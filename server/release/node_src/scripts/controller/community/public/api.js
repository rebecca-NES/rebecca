"use strict";

const SessionDataMannager = require("../../session_data_manager");
const Validation = require('../../validation');
const Const = require('../../const');
const _log = require("../../server_log").getInstance();
const PublicCommunityDbStore = require('./dbif');

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
    _log.connectionLog(7, 'do func community.public.api.request(...');
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
        _log.connectionLog(5, '  community.public.api.request not token');
        _ret = {
            errorCode : 9,
            content : {
                result: false,
                reason: Const.API_STATUS.FORBIDDEN
            }
        };
    }else{
        switch(_type){
        case 'getRoomList':
                //_content.startId,_content.count
                //はnullも許容するのでDBないで値チェック
                //登録実行
            _ret = getRoomList(_globalSnsDB, request.accessToken,
                                   _content.startId, _content.count)
                    .then((res)=>{
                        //httpレスポンスをここで実行
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            res.errorCode,
                            Object.assign({type: _type},res.content));
                    })
                .catch((err)=>{
                    _log.connectionLog(3, '  community.public.api.request getRoomList catch err:'+JSON.stringify(err));
                    //httpレスポンスをここで実行
                    callBackResponse(
                        processCallback,
                        request.accessToken,
                        request.request,
                        request.id,
                        request.version,
                        err.errorCode,
                        Object.assign({type: _type},err.content));
                });
            break;
        default:
            _log.connectionLog(3, '  community.public.api.request not type');
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
 *公開ルームのリストを取得
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param startId 検索開始ID
 * @param count 検索取得数
 */
const getRoomList = (globalSnsDB, accessToken, startId, count) => {
    _log.connectionLog(7, 'do func community.public.api.getRoomList(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const publicCommunityDb = new PublicCommunityDbStore(globalSnsDB, tenantuuId);
            publicCommunityDb.getRoomList(
                startId,
                count
            ).then((res)=>{
                resolve({
                    errorCode : 0,
                    content : res
                });
            }).catch((err)=>{
                _log.connectionLog(3, '  community.public.api.getRoomList db err:'+ JSON.stringify(err));
                reject({
                    errorCode : 1,
                    content : err
                });
            });
        }else{
            _log.connectionLog(3, '  community.public.api.getRoomList not session error');
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

