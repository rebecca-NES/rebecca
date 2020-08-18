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
const UserFollowDbStore = require('./dbif');

exports.receive = (_globalSnsDB, socket, request, processCallback, callBackResponse) => {
    _log.connectionLog(7, 'do func user_follow.api.request(...');
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
        _log.connectionLog(5, '  user_follow.api.request not token');
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
        case 'addUserFollow':
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
            _ret = addUserFollow(_globalSnsDB, request.accessToken,
                                     _content.followeeJid)
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
                                followeeJid: _content.followeeJid,
                                followerJid: _myJid,
                                personInfo: res.content.personInfo
                            });
                        const notifyuser = _content.followeeJid.replace(/.{4}\@[^\@]+$/,"");
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
        case 'delUserFollow':
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
            _ret = delUserFollow(_globalSnsDB, request.accessToken,
                                     _content.followeeJid)
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
                                followeeJid: _content.followeeJid,
                                followerJid: _myJid,
                                personInfo: res.content.personInfo
                            });
                        const notifyuser = _content.followeeJid.replace(/.{4}\@[^\@]+$/,"");
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
            _ret = getFollowInfo(_globalSnsDB, request.accessToken, _content.jid)
                    .then((res)=>{
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
            _ret = getFolloweeList(_globalSnsDB, request.accessToken, _content.jid)
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
                                items:  res.content.items,
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
            _ret = getFollowerList(_globalSnsDB, request.accessToken, _content.jid)
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
                                items:  res.content.items,
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
            _log.connectionLog(3, '  user_follow.api.request not type:' + _type);
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
