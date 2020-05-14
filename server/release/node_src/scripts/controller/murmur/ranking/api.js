"use strict";

const SessionDataMannager = require("../../session_data_manager");
const Validation = require('../../validation');
const Const = require('../../const');
const _log = require("../../server_log").getInstance();
const MurmurRankingDbStore = require('./dbif');

/**
 * cubee_web_api.js のリクエストタイプで分岐された状態で実行されるAPIベース
 *
 * @param _globalSnsDB globalSnsDBのインスタンス
 * @param socket ソケット
 * @param request リクエストJSON
 * @param processCallback 上位で設定のコールバック
 * @param callBackResponse レスポンスコールバック
 */
exports.receive = (_globalSnsDB, socket, request, processCallback, callBackResponse) => {
    _log.connectionLog(7, 'do func murmur.ranking.api.request(...');
    const _content = request.content;
    const _type = _content.type;
    //typeが正しくない場合などのデフォルト値
    let _ret = {
        //errorCode エラーコード（9=トークンが無効,1=必要パラメーターが無い場合,0=その他）
        errorCode : 1,
        content : {
            result: false,
            reason: Const.API_STATUS.NOT_FOUND
        }
    };
    //トークンが無効
    if(typeof _content != 'object' ||
       typeof _type != 'string' ||
        !Validation.accessTokenValidationCheck(request.accessToken, true)){
        _log.connectionLog(5, '  murmur.ranking.api.request not token');
        // The value assigned to _ret here is unused.
        _ret; /* = {
            errorCode : 9,
            content : {
                result: false,
                reason: Const.API_STATUS.FORBIDDEN
            }
        }; */
    }else{
        switch(_type){
        case 'getList':
            //リクエスト値をチェック
            if(typeof _content.dateFrom != 'string' ||
               !Validation.dateValidationCheck(_content.dateFrom, true) ||
               typeof _content.dateTo != 'string' ||
               !Validation.dateValidationCheck(_content.dateTo, true) ||
               typeof _content.rankBottom != 'number' ||
               (_content.rankBottom != null && typeof _content.rankBottom != 'number' )||
               (_content.offset != null && typeof _content.offset != 'number' )||
               (_content.limit != null && typeof _content.limit != 'number')
            ){
                _log.connectionLog(4, '  murmur.ranking.api.request getRankingList invalid _content.dateFrom:'
                                        + _content.dateFrom + ", _content.dateTo:" + _content.dateTo);
                callBackResponse(
                        processCallback,
                        request.accessToken,
                        request.request,
                        request.id,
                        request.version,
                        1,
                    {
                        type: _type,
                        result: false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                break;
            }
                // The value assigned to _ret here is unused.
            _ret; /* = getRankingList(_globalSnsDB, request.accessToken,
                                  _content.dateFrom, _content.dateTo,
                                  _content.rankBottom, _content.offset, _content.limit)
                    .then((res)=>{
                        //httpレスポンスをここで実行
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            res.errorCode,
                            {
                                type: _type,
                                result: res.content.result,
                                reason: res.content.reason,
                                data: res.content
                            });
                    })
                    .catch((err)=>{
                        //httpレスポンスをここで実行
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            err.errorCode,
                            Object.assign({type: _type},err.content));
                    }); */
            break;
        default:
            _log.connectionLog(3, '  murmur.ranking.api.request not type:' + _type);
                //httpレスポンスをここで実行
            callBackResponse(
                    processCallback,
                    request.accessToken,
                    request.request,
                    request.id,
                    request.version,
                    _ret.errorCode,
                    Object.assign({type: _type},_ret.content));
            break;
        }
    }
};

/**
 * ランキング一覧取得のAPI実行処理
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param dateFrom 取得開始日
 * @param dateTo 取得終了日
 * @param rankBottom 取得の最大ランキング
 * @param offset 検索結果の取得の先頭
 * @param limit 取得の最大数
 */
const getRankingList = (globalSnsDB, accessToken, dateFrom,
                        dateTo, rankBottom, offset, limit) => {
    _log.connectionLog(7, 'do func murmur.ranking.api.getFollowerList(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const murmurRankingDb = new MurmurRankingDbStore(globalSnsDB, tenantuuId);
            murmurRankingDb.getRankingList(dateFrom, dateTo, rankBottom, offset, limit)
                        .then((res)=>{
                            resolve({
                                errorCode : 0,
                                content : res
                            });
                        }).catch((err)=>{
                            reject({
                                errorCode : 1,
                                content : err
                            });
                        });
        }else{
            reject({
                errorCode : 1,
                content : {
                    result: false,
                    reason: Const.API_STATUS.FORBIDDEN,
                }
            });
        }
    });
};
