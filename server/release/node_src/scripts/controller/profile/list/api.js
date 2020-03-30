"use strict";

const SessionDataMannager = require("../../session_data_manager");
const Validation = require('../../validation');
const Const = require('../../const');
const _log = require("../../server_log").getInstance();
const UserProfileListDbStore = require('./dbif');

exports.receive = (_globalSnsDB, socket, request, processCallback, callBackResponse) => {
    _log.connectionLog(7, 'do func profile.list.api.request(...');
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
        _ret = {
            errorCode : 9,
            content : {
                result: false,
                reason: Const.API_STATUS.FORBIDDEN
            }
        };
        callBackResponse(
            processCallback,
            request.accessToken,
            request.request,
            request.id,
            request.version,
            _ret.errorCode,
            _ret.content);
    }else{
        switch(_type){
        case 'getAffiliationList':
            _ret = getAffiliationList(_globalSnsDB, request.accessToken)
                    .then((res)=>{
                        //httpレスポンスをここで実行
                        //コールバックが最終レスポンスになるので
                        //このブロックでreturnで返さない
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            res.errorCode,
                            Object.assign({
                                "type": _type
                            },res.content));
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
                            Object.assign({
                                "type": _type
                            },err.content));
                    });
            break;
        default:
                //httpレスポンスをここで実行
            callBackResponse(
                    processCallback,
                    request.accessToken,
                    request.request,
                    request.id,
                    request.version,
                    _ret.errorCode,
                    _ret.content);
            break;
        }
    }
};

const getAffiliationList = (globalSnsDB, accessToken) => {
    _log.connectionLog(7, 'do func profile.list.api.getAffiliationList(...');
    return new Promise((resolve, reject) => {
        let _sessionDataMannager = SessionDataMannager.getInstance();
        let _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            let tenantuuId = _sessionData.getTenantUuid();
            let userprofilelistdb = new UserProfileListDbStore(globalSnsDB, tenantuuId);
            userprofilelistdb.getAffiliationList()
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
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                }
            });
        }
    });
};
