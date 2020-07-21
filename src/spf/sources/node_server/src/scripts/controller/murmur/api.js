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
const Validation = require('../validation');
const Const = require('../const');
const _log = require("../server_log").getInstance();
const NotificateApi = require('../notificate/api');
const MurmurDbStore = require('./dbif');
const AUTHORITY_ACTIONS = require('../authority/const').AUTHORITY_ACTIONS;

exports.receive = (_globalSnsDB, socket, request, processCallback, callBackResponse) => {
    _log.connectionLog(7, 'do func murmur.api.request(...');
    const _content = request.content;
    const _type = _content.type;
    let _ret = {
        errorCode : 1,
        content : {
            result: false,
            reason: Const.API_STATUS.NOT_FOUND
        }
    };
    if(typeof _content != 'object' ||
       typeof _type != 'string' ||
        !Validation.accessTokenValidationCheck(request.accessToken, true)){
        _log.connectionLog(5, '  murmur.api.request not token');
        _ret = {
            errorCode : 9,
            content : {
                result: false,
                reason: Const.API_STATUS.FORBIDDEN
            }
        };
    }else{
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(request.accessToken);
        const _myJid = _sessionData.getJid();
        switch(_type){
        case 'GetColumnName':
            if(typeof _content.jid != 'string' ||
                   !Validation.jidValidationCheck(_content.jid, true)){
                _log.connectionLog(4, '  murmur.api.request GetColumnNam invalid _content.jid:'
                                        + _content.jid);
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
            getColumnName(_globalSnsDB, request.accessToken,
                              _content.jid)
                    .then((res)=>{
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
                                jid: res.content.own_jid,
                                columnName: res.content.column_name
                            });
                    })
                    .catch((err)=>{
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
        case 'SetColumnName':
            if(typeof _content.jid != 'string' ||
                   !Validation.jidValidationCheck(_content.jid, true) ||
                   _content.jid !== _myJid){
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
                        reason: Const.API_STATUS.FORBIDDEN
                    });
                break;
            }
            if(typeof _content.columnName != 'string' ||
                   !Validation.murmurColumnNameValidationCheck(_content.columnName, true)){
                _log.connectionLog(4, '  murmur.api.request SetColumnName invalid _content:'
                                        + JSON.stringify(_content));
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
            setColumnName(_globalSnsDB, request.accessToken,
                              _content.jid, _content.columnName)
                    .then((res)=>{
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
                                jid: res.content.own_jid,
                                columnName: res.content.column_name,
                                personInfo: res.content.person_info
                            });
                        const _myUid = _myJid.replace(/.{4}\@[^\@]+$/,"");
                        res.content.noify_uids.splice(res.content.noify_uids.indexOf(_myUid),1);
                        const notifyusers = res.content.noify_uids;
                        try{
                            NotificateApi.notifyPush(request.accessToken,
                                                     notifyusers,
                                                     request.request,
                                {
                                    type: _type,
                                    jid: res.content.own_jid,
                                    columnName: res.content.column_name,
                                    personInfo: res.content.person_info
                                },{
                                    action: AUTHORITY_ACTIONS.MURMUR_VIEW,
                                    resource: null,
                                });
                        }catch(e){
                            _log.connectionLog(2, '  murmur.api.request notify send error e:' + e);
                        }
                    })
                    .catch((err)=>{
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
            _log.connectionLog(3, '  murmur.api.request not type:' + _type);
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

const getColumnName = (globalSnsDB, accessToken, jid) => {
    _log.connectionLog(7, 'do func murmur.api.etColumnName(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const db = new MurmurDbStore(globalSnsDB, tenantuuId);
            db.getColumnName(jid)
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

const setColumnName = (globalSnsDB, accessToken, jid, column_name) => {
    _log.connectionLog(7, 'do func murmur.api.setColumnName(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const db = new MurmurDbStore(globalSnsDB, tenantuuId);
            db.setColumnName(jid, column_name)
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


