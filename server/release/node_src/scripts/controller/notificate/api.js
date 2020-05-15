"use strict";

const SessionDataMannager = require("../session_data_manager");
const CubeeWebApi = require('../cubee_web_api');
const _log = require("../server_log").getInstance();
const AuthorityManager = require('../../Authority/authority_api');
/**
 * 通知送信
 *
 * 通ををDBに保存する場合はopenfireの下記の内容などを考慮すること
 *  jp/co/nec/necst/spf/globalSNS/Data/NotificationDbData.java
 *  DB: globalsns , Table: notification_store
 *
 * @param accessToken
 * @param loginUserList (自分は含まないログインIDを設定)
 * @param notifyType
 * @param pushContent
 * @param policy 権限({action: AUTHORITY_ACTIONS.MURMUR_VIEW, resource: null} など)
 */
exports.notifyPush = (accessToken, loginUserList, notifyType, pushContent, policy) => {
    _log.connectionLog(7, "do func notificate.api.js notifyPushMessgeToLoginList(");
    let tenantuuid = null;
    let _sessionDataMannager;
    //何故か同じトークンで複数セッションデータが存在することがあるため
    let addAccsessTokenHash = {};
    if(!accessToken || !notifyType ||
       !pushContent || typeof pushContent != 'object'){
        _log.connectionLog(4, ' notificate.api.js notifyPushMessgeToLoginList no list user.');
        return;
    }
    try{
        _sessionDataMannager = SessionDataMannager.getInstance();
        if(!_sessionDataMannager){
            _log.connectionLog(3, ' notificate.api.js notifyPushMessgeToLoginList'
                                + ' send owner error SessionDataMannager.getInstance');
            return;
        }
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(!_sessionData){
            _log.connectionLog(3, ' notificate.api.js notifyPushMessgeToLoginList'
                                + ' send owner error _sessionDataMannager.get(accessToken)');
            return;
        }
        const _xsConn = _sessionData.getOpenfireSock();
        if(!_xsConn){
            _log.connectionLog(3, ' notificate.api.js notifyPushMessgeToLoginList'
                                + ' send owner error _sessionData.getOpenfireSock()');
            return;
        }
        const _sessionDataAry = _sessionDataMannager.getByOpenfireSock(_xsConn);
        if(!_sessionDataAry || !Array.isArray(_sessionDataAry)){
            _log.connectionLog(3, ' notificate.api.js notifyPushMessgeToLoginList'
                                + ' send owner error _sessionData.getOpenfireSock()');
            return;
        }
        addAccsessTokenHash[accessToken] = true;
        //自分に送信
        notifyPushMessge(_sessionDataAry, notifyType, pushContent);

        //現在のテナントUUIDを取得
        for(let i=0;i<_sessionDataAry.length;i++){
            // This guard always evaluates to true.
            // if(tenantuuid == null){
                tenantuuid = _sessionDataAry[i].getTenantUuid() ?
                             _sessionDataAry[i].getTenantUuid() : null;
                break;
            // }
        }
    }catch(e){
        _log.connectionLog(3, ' notificate.api.js notifyPushMessgeToLoginList send owner error:'+e);
        return;
    }
    if(!tenantuuid || !Array.isArray(loginUserList)){
        _log.connectionLog(7, ' notificate.api.js notifyPushMessgeToLoginList  no list user.');
        return;
    }
    _sessionDataMannager = SessionDataMannager.getInstance();
    for(let j=0;j<loginUserList.length;j++){
        _log.connectionLog(7, ' notificate.api.js send list user jid. :' + loginUserList[j]);
        if(loginUserList[j].match(/\@/)){
            _log.connectionLog(5, ' notificate.api.js send list user is not allow jid. :' + loginUserList[j]);
        }

        try{
            _log.connectionLog(7, ' notificate.api.js send list user:' + loginUserList[j]);
            const _sessionData = _sessionDataMannager.getByLoginAccountInTenant(tenantuuid, loginUserList[j]);
            if(!Array.isArray(_sessionData) || _sessionData.length == 0){
                _log.connectionLog(6, ' notificate.api.js notifyPushMessgeToLoginList'
                                    + '  send list '
                                    + loginUserList[j] + 'error _sessionDataMannager.getByLoginAccountInTenant or not login');
                continue;
            }
            if(typeof policy == 'object' &&
               typeof policy.action == 'string' &&
               _sessionData.length > 0){
                AuthorityManager.checkUserHavePolicy(tenantuuid,
                                                     _sessionData[0],
                                                     loginUserList[j],
                                                     policy.action,
                                                     policy.resource)
                                .then((res) => {
                                    if(res.enable_flag){
                                        _log.connectionLog(7, ' notificate.api.js [policy check] have policy. action:' + policy.action
                                                            + " resource:" + policy.resource
                                                            + " uid:" + loginUserList[j]);
                                        sessionToNotify(_sessionData, notifyType, pushContent,
                                                        addAccsessTokenHash,
                                                        _sessionDataMannager);
                                    }else{
                                        _log.connectionLog(7, ' notificate.api.js [policy check] have not policy. action:' + policy.action
                                                            + " resource:" + policy.resource
                                                            + " uid:" + loginUserList[j]);
                                    }
                                }).catch((err) => {
                                    _log.connectionLog(3, ' notificate.api.js check polcy error:' + err);
                                    return;
                                });
            }else{
                _log.connectionLog(7, ' notificate.api.js [policy check] not check policy uid:' + loginUserList[j]);
                sessionToNotify(_sessionData, notifyType, pushContent,
                                addAccsessTokenHash,
                                _sessionDataMannager);
            }
        }catch(e){
            _log.connectionLog(3, ' notificate.api.js notifyPushMessgeToLoginList'
                                + ' send list '
                                + loginUserList[j] + ' error:'+e);
            continue;
        }
    }
};

/**
 * マルチ接続のユーザーにそれぞれ通知を送信
 *
 * @param sessionData
 * @param notifyType
 * @param pushContent
 * @param addAccsessTokenHash
 * @param sessionDataMannager
 */
const sessionToNotify = (sessionData, notifyType, pushContent, addAccsessTokenHash, sessionDataMannager) => {
    _log.connectionLog(7, ' notificate.api.js send user sessionData.length:' + sessionData.length);
    for(let i=0;i<sessionData.length;i++){
        if(addAccsessTokenHash[sessionData[i].getAccessToken()] &&
           addAccsessTokenHash[sessionData[i].getAccessToken()] == true){
            _log.connectionLog(7, ' notificate.api.js not found session :' + sessionData[i].getAccessToken());
            continue;
        }
        _log.connectionLog(7, ' notificate.api.js send list AccsessToken :' + sessionData[i].getAccessToken());
        const _xsConn = sessionData[i].getOpenfireSock();
        if(!_xsConn){
            _log.connectionLog(3, ' notificate.api.js notifyPushMessgeToLoginList'
                                + '  send list error sessionData[i].getOpenfireSock');
            continue;
        }
        const sessionDataAry = sessionDataMannager.getByOpenfireSock(_xsConn);
        if(!sessionDataAry){
            _log.connectionLog(3, ' notificate.api.js notifyPushMessgeToLoginList'
                                + '  send list error sessionDataMannager.getByOpenfireSock');
            continue;
        }
        addAccsessTokenHash[sessionData[i].getAccessToken()] = 1;
        notifyPushMessge(sessionDataAry, notifyType, pushContent);
    }
};

/**
 * sessionDataAryの持ち主ユーザにたいして通知送信
 *
 * @param sessionDataAry
 * @param notifyType
 * @param pushContent
 */
const notifyPushMessge = (sessionDataAry, notifyType, pushContent) => {
    _log.connectionLog(7, "do func notificate.api.js notifyPushMessage(");
    try{
        if(sessionDataAry == null || !Array.isArray(sessionDataAry)){
            _log.connectionLog(3, " notificate.api.js notifyPushMessage sessionDataAry is null:");
            return;
        }
        for(let i=0;i<sessionDataAry.length;i++){
            const _accessToken = sessionDataAry[i].getAccessToken();
            _log.connectionLog(7, ' notificate.api.js notifyPushMessage _accessToken:' + _accessToken);

            //ここで通知を行う
            if(_accessToken){
                CubeeWebApi.getInstance().pushMessage(_accessToken, notifyType, pushContent);
            }
        }
    }catch(e){
        _log.connectionLog(1," notificate.api.js notifyPushMessage try catch err:" + e);
    }
};

/**
 * 日付フォーマット関数
 */
exports.formatDate = (dateString) => {
    if(!dateString){
        return "";
    }
    let date = new Date(dateString);
    return date.getFullYear()
    + "/" + ("0" + (date.getMonth() + 1)).slice(-2)
    + "/" + ("0" + date.getDate()).slice(-2)
    + " " + ("0" + date.getHours()).slice(-2)
    + ":" + ("0" + date.getMinutes()).slice(-2)
    + ":" + ("0" + date.getSeconds()).slice(-2)
    + "." + ("000" + date.getMilliseconds()).slice(-3);
};
