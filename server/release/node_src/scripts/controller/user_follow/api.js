"use strict";

const SessionDataMannager = require("../session_data_manager");
const Validation = require('../validation');
const Const = require('../const');
const _log = require("../server_log").getInstance();
// Unused variable NotificateApi.
// const NotificateApi = require('../notificate/api');
const UserFollowDbStore = require('./dbif');

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
    _log.connectionLog(7, 'do func user_follow.api.request(...');
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
        _log.connectionLog(5, '  user_follow.api.request not token');
        // The value assigned to _ret here is unused.
        /* _ret = {
            errorCode : 9,
            content : {
                result: false,
                reason: Const.API_STATUS.FORBIDDEN
            } 
        }; */
    } else {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(request.accessToken);
        const _myJid = _sessionData.getJid();
        switch(_type){
                case 'addUserFollow':
                //リクエスト値をチェック
                if(typeof _content.followeeJid != 'string' ||
                   !Validation.jidValidationCheck(_content.followeeJid, true) ||
                   _content.followeeJid == _myJid){
                    _log.connectionLog(4, '  user_follow.api.request addUserFollow invalid _content.followeeJid:'
                                       + _content.followeeJid + ", _myJid:" + _myJid);
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
                /* _ret = addUserFollow(_globalSnsDB, request.accessToken,
                                     _content.followeeJid)
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
                                followeeJid: _content.followeeJid,
                                followerJid: _myJid,
                                personInfo: res.content.personInfo
                            });
                        const notifyuser = _content.followeeJid.replace(/.{4}\@[^\@]+$/,"");
                        //通知はここで処理
                        NotificateApi.notifyPush(request.accessToken,
                                                 [notifyuser],
                                                 request.request,
                                                 {
                            type: _type,
                            followeeJid: _content.followeeJid,
                            followerJid: _myJid,
                            personInfo: res.content.personInfo
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
            
                case 'delUserFollow':
                //リクエスト値をチェック
                if(typeof _content.followeeJid != 'string' ||
                   !Validation.jidValidationCheck(_content.followeeJid, true) ||
                   _content.followeeJid == _myJid){
                    _log.connectionLog(4, '  user_follow.api.request delUserFollow invalid _content.followeeJid:'
                                       + _content.followeeJid + ", _myJid:" + _myJid);
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
                /* _ret = delUserFollow(_globalSnsDB, request.accessToken,
                                     _content.followeeJid)
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
                                followeeJid: _content.followeeJid,
                                followerJid: _myJid,
                                personInfo: res.content.personInfo
                            });
                        const notifyuser = _content.followeeJid.replace(/.{4}\@[^\@]+$/,"");
                        //通知はここで処理
                        NotificateApi.notifyPush(request.accessToken,
                                                 [notifyuser],
                                                 request.request,
                            {
                                type: _type,
                                followeeJid: _content.followeeJid,
                                followerJid: _myJid,
                                personInfo: res.content.personInfo
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
        case 'getFollowInfo':
            if(typeof _content.jid != 'string' ||
                   !Validation.jidValidationCheck(_content.jid, true)){
                _log.connectionLog(4, '  user_follow.api.request getFollowInfo invalid _content.jid:' + _content.jid);
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
                /* _ret = getFollowInfo(_globalSnsDB, request.accessToken, _content.jid)
                    .then((res)=>{
                        //httpレスポンスをここで実行
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            res.errorCode,
                            Object.assign({
                                type: _type
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
                            Object.assign({type: _type},err.content));
                    }); */
            break;
        case 'getFolloweeList':
            if(typeof _content.jid != 'string' ||
                   !Validation.jidValidationCheck(_content.jid, true)){
                _log.connectionLog(4, '  user_follow.api.request getFolloweeList invalid _content.jid:' + _content.jid);
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
                /* _ret = getFolloweeList(_globalSnsDB, request.accessToken, _content.jid)
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
                                items:  res.content.items,
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
        case 'getFollowerList':
            if(typeof _content.jid != 'string' ||
                   !Validation.jidValidationCheck(_content.jid, true)){
                _log.connectionLog(4, '  user_follow.api.request getFollowerList invalid _content.jid:' + _content.jid);
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
                /* _ret = getFollowerList(_globalSnsDB, request.accessToken, _content.jid)
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
                                items:  res.content.items,
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
            _log.connectionLog(3, '  user_follow.api.request not type:' + _type);
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
 * API実行者が指定ユーザーをフォローする
 * ※フォローするユーザーはAPI実行ユーザー
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param followeeJid フォローされるユーザーJID
 */
const addUserFollow = (globalSnsDB, accessToken, followeeJid) => {
    _log.connectionLog(7, 'do func user_follow.api.addUserFollow(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const followerJid = _sessionData.getJid();
            const userFollowDb = new UserFollowDbStore(globalSnsDB, tenantuuId);
            userFollowDb.addUserFollow(followeeJid, followerJid)
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

/**
 * API実行者が指定ユーザーのフォロー解除
 * ※フォローするユーザーはAPI実行ユーザー
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param followeeJid フォロー解除されるユーザーJID
 */
const delUserFollow = (globalSnsDB, accessToken, followeeJid) => {
    _log.connectionLog(7, 'do func user_follow.api.delUserFollow(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const followerJid = _sessionData.getJid();
            const userFollowDb = new UserFollowDbStore(globalSnsDB, tenantuuId);
            userFollowDb.delUserFollow(followeeJid, followerJid)
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

/**
 * フォローの状態（フォローされている人数、フォローしている人数）を取得
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param jid 状態を取得するユーザーのJID
 */
const getFollowInfo = (globalSnsDB, accessToken, jid) => {
    _log.connectionLog(7, 'do func user_follow.api.getFollowInfo(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const userFollowDb = new UserFollowDbStore(globalSnsDB, tenantuuId);
            userFollowDb.getFollowInfo(jid)
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

/**
 * 指定ユーザーがフォローしているリストを取得
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param jid フォローしているユーザーのJID(指定ユーザー)
 */
const getFolloweeList = (globalSnsDB, accessToken, jid) => {
    _log.connectionLog(7, 'do func user_follow.api.getFolloweeList(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const userFollowDb = new UserFollowDbStore(globalSnsDB, tenantuuId);
            userFollowDb.getFolloweeList(jid)
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

/**
 * 指定ユーザーがフォローされているリストを取得
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param jid フォローされているユーザーのJID(指定ユーザー)
 */
const getFollowerList = (globalSnsDB, accessToken, jid) => {
    _log.connectionLog(7, 'do func user_follow.api.getFollowerList(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const userFollowDb = new UserFollowDbStore(globalSnsDB, tenantuuId);
            userFollowDb.getFollowerList(jid)
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
