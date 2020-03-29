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
'use strict';

const _ = require('underscore');
const Log = require('../server_log').getInstance();
const AuthorityController = require('../authority/controller');
const AUTHORITY_ACTIONS = require('../authority/const').AUTHORITY_ACTIONS;
const API_STATUS = require('../const').API_STATUS;
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const RequestData = require('../../model/request_data').RequestData;

exports.doAfterCreatedRoom = (system_uuid, session, _content) => {
    return new Promise((resolve, reject) => {
        if(!_.has(_content,"items")||
           !_.isArray(_content.items)||
           _content.items.length <= 0||
           !_.has(_content.items[0],"roomId")){
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        Log.connectionLog(6, `community.api.doAfterCreatedRoom - _content: ${JSON.stringify(_content)}`);
        setDefaultPolicyAndRightsAtCreate(system_uuid, session,
                                          _content.items[0].roomId)
            .then((res)=> {
                Log.connectionLog(5, `community.api.doAfterCreatedRoom  _content: ${JSON.stringify(_content)}`);
                _content["result"] = true;
                _content["reason"] = API_STATUS.SUCCESS;
                resolve(_content);
            })
            .catch((err) => {
                Log.connectionLog(5, `community.api.doAfterCreatedRoom catch: ${JSON.stringify(err)}`);
                deleteRoomAndMemberAuthority(system_uuid, session,
                                             _content.items[0].roomId)
                    .then((res2)=>{
                        err["roomId"] = _content.items[0].roomId;
                        err["deleted"] = res2.deleted;
                        Log.connectionLog(6, `community.api.doAfterCreatedRoom deleteRoomAndMemberAuthority then: ${JSON.stringify(err)}`);
                        reject(err);
                    }).catch((err2)=>{
                        err["roomId"] = _content.items[0].roomId;
                        err["deleted"] = err2.deleted;
                        Log.connectionLog(6, `community.api.doAfterCreatedRoom deleteRoomAndMemberAuthority catchn: ${JSON.stringify(err)}`);
                        reject(err);
                    });
            });
    });
};

const setDefaultPolicyAndRightsAtCreate = (system_uuid, session, resource) => {
    return new Promise((resolve, reject) => {
        if(!_.isString(resource)){
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        const loginuser = session.getLoginAccout();
        const actions = [
            AUTHORITY_ACTIONS.COMMUNITY_MANAGE,
            AUTHORITY_ACTIONS.COMMUNITY_SEND,
            AUTHORITY_ACTIONS.COMMUNITY_VIEW];

        let promisesP = [];
        for(let action of actions){
            promisesP.push(
                AuthorityController.createPolicy(
                    system_uuid, session,
                    {
                        policy_id : "p_" + action + "_" + resource,
                        policy_tid : "none",
                        translations : {ja:""}
                    }
                ));
        }
        Promise.all(promisesP)
            .then((res)=>{
                let promisesR = [];
                for(let action of actions){
                    promisesR.push(
                        AuthorityController.createRight(
                            system_uuid, session,
                            {
                                policy_id:"p_" + action + "_" + resource,
                                action: action,
                                resource: resource,
                                condition:"",
                                enable_flag:true
                            }));
                }
                Promise.all(promisesR)
                    .then((res2)=>{
                        AuthorityController.assignPolicyToUsers(
                            system_uuid, session,
                            {
                                policy_id : "p_" + AUTHORITY_ACTIONS.COMMUNITY_MANAGE + "_" + resource,
                                users : [loginuser]
                            },
                            'create'
                        ).then((res3)=>{
                            resolve({result: true, reason: API_STATUS.SUCCESS});
                        }).catch((err3)=>{
                            Log.connectionLog(5, `community.api.setDefaultPolicyAndRightsAtCreate : authority set Right err! ${JSON.stringify(err3)}`);
                            reject(err3);
                        });
                    })
                    .catch((err2)=>{
                        Log.connectionLog(5, `community.api.setDefaultPolicyAndRightsAtCreate : authority set Right err! ${JSON.stringify(err2)}`);
                        reject(err2);
                    });
            })
            .catch((err)=>{
                Log.connectionLog(5, `community.api.setDefaultPolicyAndRightsAtCreate : authority set Policy err! ${JSON.stringify(err)}`);
                reject(err);
            });
    });
};


const deleteRoomAndMemberAuthority = (system_uuid, session, resource) => {
    return new Promise((resolve, reject) => {
        if(!_.isString(resource)){
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        const accessToken = session.getAccessToken();
        AuthorityController.deleteRightPolicyOfResource(
            system_uuid, session,{resource:resource})
            .then((res2) =>{
                sendDeleteGroupRequestToXmpp(accessToken, resource)
                    .then((res3) => {
                        if(res3.result){
                            Log.connectionLog(5, `community.api.deleteRoomAndMemberAuthority: authority cleaned, clean xmpp done !:${JSON.stringify(res3)}`);
                            resolve({
                                result: true,
                                reason: API_STATUS.SUCCESS,
                                roomId : resource,
                                deleted: true
                            });
                        }else{
                            Log.connectionLog(3, `community.api.deleteRoomAndMemberAuthority: authority cleaned, clean xmpp dose not err!:${JSON.stringify(res3)}`);
                            reject({
                                result: false,
                                reason: API_STATUS.INTERNAL_SERVER_ERROR,
                                roomId : resource,
                                deleted: false
                            });
                        }
                    }).catch((err3) => {
                        Log.connectionLog(3, `community.api.setDefaultPolicyAndRightsAtCreat: not clean xmpp err!:${JSON.stringify(err3)}`);
                        reject({
                            result: false,
                            reason: API_STATUS.INTERNAL_SERVER_ERROR,
                            roomId : resource,
                            deleted: false
                        });
                    });
            }).catch((err2) =>{
                Log.connectionLog(2, `community.api.deleteRoomAndMemberAuthority: not authority clean err! ${JSON.stringify(err2)}`);
                reject({
                    result: false,
                    reason: API_STATUS.INTERNAL_SERVER_ERROR,
                    roomId : resource,
                    deleted: false
                });
            });
    });
};

function sendDeleteGroupRequestToXmpp(accessToken, roomId) {
    return new Promise((resolve, reject) => {
        if (! _.isString(accessToken) || accessToken == '') {
            Log.connectionLog(4, 'accessToken is invalid. community::api::sendDeleteGroupRequestToXmpp');
            reject('invalid parameter');
            return;
        }
        if (! _.isString(roomId) || roomId == '') {
            Log.connectionLog(4, 'roomId is invalid. community::api::sendDeleteGroupRequestToXmpp');
            reject('invalid parameter');
            return;
        }
        const _accessToken = accessToken;
        const _content = {
            type: RequestData.DELETE_GROUP_TYPE_COMMUNITY_ROOM,
            roomId: roomId
        };
        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.deleteGroup(
            _accessToken,
            _content,
            (result, reason, extras, count, items)=> {
                const _responceContent = {
                    result : result,
                    reason : reason,
                    type : _content.type,
                    items: items
                };
                resolve(_responceContent);
                return;
            }
        );
    });
}

const __testonly__ = {
    sendDeleteGroupRequestToXmpp: sendDeleteGroupRequestToXmpp
};
exports.__testonly__ = __testonly__;
