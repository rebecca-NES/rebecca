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
const MurmurRankingDbStore = require('./dbif');

exports.receive = (_globalSnsDB, socket, request, processCallback, callBackResponse) => {
    _log.connectionLog(7, 'do func murmur.ranking.api.request(...');
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
        _log.connectionLog(5, '  murmur.ranking.api.request not token');
        _ret = {
            errorCode : 9,
            content : {
                result: false,
                reason: Const.API_STATUS.FORBIDDEN
            }
        };
    }else{
        switch(_type){
        case 'getList':
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
            _ret = getRankingList(_globalSnsDB, request.accessToken,
                                  _content.dateFrom, _content.dateTo,
                                  _content.rankBottom, _content.offset, _content.limit)
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
                                data: res.content
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
        default:
            _log.connectionLog(3, '  murmur.ranking.api.request not type:' + _type);
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
