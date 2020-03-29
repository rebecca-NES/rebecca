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

const SessionDataMannager = require("../../session_data_manager");
const Validation = require('../../validation');
const Const = require('../../const');
const _log = require("../../server_log").getInstance();
const UserProfileListDbStore = require('./dbif');

exports.receive = (_globalSnsDB, socket, request, processCallback, callBackResponse) => {
    _log.connectionLog(7, 'do func profile.list.api.request(...');
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
