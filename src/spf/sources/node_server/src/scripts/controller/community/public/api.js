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
const PublicCommunityDbStore = require('./dbif');

exports.receive = (_globalSnsDB, socket, request, processCallback, callBackResponse) => {
    _log.connectionLog(7, 'do func community.public.api.request(...');
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
            _ret = getRoomList(_globalSnsDB, request.accessToken,
                                   _content.startId, _content.count)
                    .then((res)=>{
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

