/*
Copyright 2020 NEC Solution Innovators, Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
"use strict";

const SessionDataMannager = require("../session_data_manager");
const CubeeWebApi = require('../cubee_web_api');
const _log = require("../server_log").getInstance();
const AuthorityManager = require('../../Authority/authority_api');
exports.notifyPush = (accessToken, loginUserList, notifyType, pushContent, policy) => {
    _log.connectionLog(7, "do func notificate.api.js notifyPushMessgeToLoginList(");
    let tenantuuid = null;
    let _sessionDataMannager;
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
        notifyPushMessge(_sessionDataAry, notifyType, pushContent);

        for(let i=0;i<_sessionDataAry.length;i++){
            if(tenantuuid == null){
                tenantuuid = _sessionDataAry[i].getTenantUuid() ?
                             _sessionDataAry[i].getTenantUuid() : null;
                break;
            }
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

            if(_accessToken){
                CubeeWebApi.getInstance().pushMessage(_accessToken, notifyType, pushContent);
            }
        }
    }catch(e){
        _log.connectionLog(1," notificate.api.js notifyPushMessage try catch err:" + e);
    }
};

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
