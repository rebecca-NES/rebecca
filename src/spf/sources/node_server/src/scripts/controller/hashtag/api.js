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
const _log = require("../server_log").getInstance();
const HashTagUtils = require('./utils');
const HashtagDbStore = require('./dbif');
const Validation = require('../validation');
const Const = require("../const");

exports.setHashtagToDb = (globalSnsDB, _accessToken, body, itemId) => {
    _log.connectionLog(7, 'do func hashtag.api.setHashtagToDb(...');
    return new Promise((resolve, reject)=>{
        if(!Validation.accessTokenValidationCheck(_accessToken, true)){
            reject({
                result:false
            });
            return;
        }
        if(!Validation.itemIdValidationCheck(itemId, true)){
            reject({
                result:false
            });
            return;
        }
        if(body){
            let tags = HashTagUtils.getTagsArrayFromCodecBody(body);
            let _sessionDataMannager = SessionDataMannager.getInstance();
            let _sessionData = _sessionDataMannager.get(_accessToken);
            if(_sessionData){
                let tenantuuId = _sessionData.getTenantUuid();
                let jid = _sessionData.getJid();
                let hashtagdb = new HashtagDbStore(globalSnsDB, tenantuuId);
                hashtagdb.setHastagArray(tags, itemId, jid)
                         .then((res)=>{
                             resolve({
                                 result:true,
                                 data:res
                             });
                         }).catch((err)=>{
                             reject({
                                 result:false,
                                 data:err
                             });
                         });
            }else{
                reject({
                    result:false
                });
                return;
            }
        }else{
            reject({
                result:false
            });
            return;
        }
    });
};

exports.getHashtagRanking = (globalSnsDB, accessToken, _content) => {
    _log.connectionLog(7, 'do func hashtag.api.getHashtagRanking(...');
    return new Promise((resolve, reject) => {
        if(!Validation.accessTokenValidationCheck(accessToken, true)){
            reject({
                result:false,
                reason:Const.API_STATUS.BAD_REQUEST,
                data:[]
            });
            return;
        }
        if(!Validation.msgToValidationCheck(_content.msgTo, false)||
           !Validation.dateValidationCheck(_content.dateFrom, false)||
           !Validation.dateValidationCheck(_content.dateTo, false)||
           !(_content.rankBottom == null || typeof _content.rankBottom == 'number')||
           !(_content.offset == null || typeof _content.offset == 'number')||
           !(_content.limit == null || typeof _content.limit == 'number') ){
            reject({
                result:false,
                reason:Const.API_STATUS.BAD_REQUEST,
                data:[]
            });
            return;
        }
        getHashtagRankingFromDb(globalSnsDB, accessToken,
                                _content.msgTo,
                                _content.dateFrom,
                                _content.dateTo,
                                _content.rankBottom,
                                _content.offset,
                                _content.limit)
            .then((res)=>{
                resolve(res);
            }).catch((err)=>{
                reject(err);
            });
    });
};
const getHashtagRankingFromDb = (globalSnsDB, accessToken, msgTo, dateFrom, dateTo, rankBottom, offset, limit) => {
    _log.connectionLog(7, 'do func hashtag.api.getHashtagRankingFromDb(...');
    return new Promise((resolve, reject) => {
        let _sessionDataMannager = SessionDataMannager.getInstance();
        let _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            let tenantuuId = _sessionData.getTenantUuid();
            let hashtagdb = new HashtagDbStore(globalSnsDB, tenantuuId);
            hashtagdb.getHastagRanking(msgTo, dateFrom, dateTo, rankBottom, offset, limit)
                     .then((res)=>{
                         resolve({
                             result:true,
                             reason:Const.API_STATUS.SUCCESS,
                             data:res.data
                         });
                     }).catch((err)=>{
                         reject({
                             result:false,
                             reason:err.reason,
                             data:[],
                             mess:err
                         });
                     });
        }else{
            reject({
                result:false,
                reason:Const.API_STATUS.FORBIDDEN,
                data:[]
            });
            return;
        }
    });
};

