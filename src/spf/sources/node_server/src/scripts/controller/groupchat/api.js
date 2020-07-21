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
const RequestData = require('../../model/request_data').RequestData;
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const UserAccountManager = require('../user_account_manager');

exports.doAfterCreatedRoom = (system_uuid, session, _content) => {
    return new Promise((resolve, reject) => {
        if(!_.has(_content,"items")||
           !_.isArray(_content.items)||
           _content.items.length <= 0||
           !_.has(_content.items[0],"roomId") ||
           !_.isString(_content.items[0].roomId) ||
           !_.has(_content.items[0],"memberItems") ||
           !_.isArray(_content.items[0].memberItems)||
           _content.items[0].memberItems.length <= 0
          ){
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        let actionMenbers = actionMemberSelectFromContent(_content);

        actionMemberSelectFromJID(
            _content.items[0].memberItems,
            actionMenbers,
            session.getXmppServerName())
            .then((memberUIDs) => {
                setDefaultPolicyAndRightsAtCreate(system_uuid, session,
                                                  _content.items[0].roomId,
                                                  memberUIDs)
                    .then((res)=> {
                        Log.connectionLog(6, `groupchat.api.doAfterCreatedRoom  _content: ${JSON.stringify(_content)}`);
                        _content["result"] = true;
                        _content["reason"] = API_STATUS.SUCCESS;
                        resolve(_content);
                    }).catch((err) => {
                        Log.connectionLog(5, `groupchat.api.doAfterCreatedRoom setDefaultPolicyAndRightsAtCreate err: ${JSON.stringify(err)}`);
                        deleteRoomAndMemberAuthority(system_uuid, session,
                                                     _content.items[0].roomId,
                                                     _content.items[0].memberItems)
                            .then((res2)=>{
                                err["roomId"] = _content.items[0].roomId;
                                err["deleted"] = res2.deleted;
                                reject(err);
                            }).catch((err2)=>{
                                err["roomId"] = _content.items[0].roomId;
                                err["deleted"] = err2.deleted;
                                reject(err);
                            });
                    });
            })
            .catch((err) => {
                reject({result: false, reason: API_STATUS.BAD_REQUEST});
            });
    });
};

const actionMemberSelectFromContent = (_content) => {
    let actionMenbers = {};
    if(_.has(_content,AUTHORITY_ACTIONS.GC_MANAGE) &&
       _.isArray(_content[AUTHORITY_ACTIONS.GC_MANAGE])){
        actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE] = _content[AUTHORITY_ACTIONS.GC_MANAGE];
    }else{
        actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE] = [];
    }
    if(_.has(_content,AUTHORITY_ACTIONS.GC_SEND) &&
       _.isArray(_content[AUTHORITY_ACTIONS.GC_SEND])){
        actionMenbers[AUTHORITY_ACTIONS.GC_SEND] = _content[AUTHORITY_ACTIONS.GC_SEND];
    }else{
        actionMenbers[AUTHORITY_ACTIONS.GC_SEND] = [];
    }
    if(_.has(_content,AUTHORITY_ACTIONS.GC_VIEW) &&
       _.isArray(_content[AUTHORITY_ACTIONS.GC_VIEW])){
        actionMenbers[AUTHORITY_ACTIONS.GC_VIEW] = _content[AUTHORITY_ACTIONS.GC_VIEW];
    }else{
        actionMenbers[AUTHORITY_ACTIONS.GC_VIEW] = [];
    }
    Log.connectionLog(6, `groupchat.api.doAfterCreatedRoom - actionMenbers: ${JSON.stringify(actionMenbers)}`);
    return actionMenbers;
};

const actionMemberSelectFromJID = (jidmenber, actionMenbers, xmppServerName) => {
    return new Promise((resolve, reject) => {
        let _actionMenbers = {};
        _actionMenbers[AUTHORITY_ACTIONS.GC_VIEW]   = [];
        _actionMenbers[AUTHORITY_ACTIONS.GC_SEND]   = [];
        _actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE] = [];
        let promisesJ2U = [];
        for(let item of jidmenber){
            promisesJ2U.push(jid2uid(item,xmppServerName));
        }
        Promise.all(promisesJ2U)
            .then((resAll) =>{
                for(let res of resAll){
                    if(actionMenbers[AUTHORITY_ACTIONS.GC_VIEW].indexOf(res) < 0){
                        if(actionMenbers[AUTHORITY_ACTIONS.GC_SEND].indexOf(res) < 0){
                            _actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE].push(res);
                            Log.connectionLog(6, `groupchat.api.actionMemberSelectFromJID uid ( "${res}" )`);
                        }else{
                            _actionMenbers[AUTHORITY_ACTIONS.GC_SEND].push(res);
                        }
                    }else{
                        _actionMenbers[AUTHORITY_ACTIONS.GC_VIEW].push(res);
                    }
                }
                Log.connectionLog(6,`groupchat.api.actionMemberSelectFromJID view list (${JSON.stringify(_actionMenbers[AUTHORITY_ACTIONS.GC_VIEW])})`);
                Log.connectionLog(6,`groupchat.api.actionMemberSelectFromJID send list (${JSON.stringify(_actionMenbers[AUTHORITY_ACTIONS.GC_SEND])})`);
                Log.connectionLog(6,`groupchat.api.actionMemberSelectFromJID list (${JSON.stringify(_actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE])})`);
                resolve(_actionMenbers);
            })
            .catch((err)=>{
                Log.connectionLog(3,`groupchat.app.actionMemberSelectFromJID get UID Error (${err})`);
                reject(err);
            });
    });
};

const jid2uid = (jid, xmppServerName) => {
    return new Promise((resolve, reject) => {
        const openfireAccount = jid.substring(0,jid.lastIndexOf('@'));
        const getUidFromJID = (openfireAccount,xmppServerName) => {
            return new Promise((resolve, reject) => {
                var _userAccountManager = UserAccountManager.getInstance();
                _userAccountManager.getUserAccountDataByOFAccountAndXmppServerName(
                    openfireAccount,
                    xmppServerName,
                    (err, userAccountData) => {
                        if(userAccountData != null){
                            Log.connectionLog(6,`groupchat/api.js jid2uid userAccountData.getLoginAccount() : ${userAccountData.getLoginAccount()}`);
                            resolve(userAccountData.getLoginAccount());
                        }else{
                            Log.connectionLog(3,`groupchat.app.jid2uid userAccountData is null`);
                            reject('');
                        }
                    });
            });
        };
        getUidFromJID(openfireAccount, xmppServerName)
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                Log.connectionLog(3,`groupchat.app.jid2uid getUidFromJID Promise err`);
                reject(err);
            });
    });
};

const setDefaultPolicyAndRightsAtCreate = (system_uuid, session, resource, actionMenbers) => {
    return new Promise((resolve, reject) => {
        Log.connectionLog(6, `groupchat.api.setDefaultPolicyAndRightsAtCreate - actionMenbers: ${JSON.stringify(actionMenbers)}`);
        const actions = [
            AUTHORITY_ACTIONS.GC_MANAGE,
            AUTHORITY_ACTIONS.GC_SEND,
            AUTHORITY_ACTIONS.GC_VIEW];

        let promisesP = [];
        for(let action of actions){
            promisesP.push(
                AuthorityController.createPolicy(
                    system_uuid, session,
                    {
                        policy_id:"p_" + action + "_" + resource,
                        policy_tid:"p_" + action + "_" + resource,
                        translations:{ja:"","en":""}
                    }));
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
                        let _promises = [];
                        for(let action of actions){
                            if(actionMenbers[action].length == 0)
                                continue;
                            _promises.push(
                                AuthorityController.assignPolicyToUsers(
                                    system_uuid, session,{
                                        policy_id : "p_" + action + "_" + resource,
                                        users : actionMenbers[action]
                                    },'create')
                            );
                        }
                        Promise.all(_promises).then((res3)=>{
                            resolve({result: true, reason: API_STATUS.SUCCESS});
                        }).catch((err3)=>{
                            Log.connectionLog(5, `groupchat.api.setDefaultPolicyAndRightsAtCreate : authority set Policy To User err! ${JSON.stringify(err3)}`);
                            reject(err3);
                        });
                    })
                    .catch((err2)=>{
                        Log.connectionLog(5, `groupchat.api.setDefaultPolicyAndRightsAtCreate : authority set Right err! ${JSON.stringify(err2)}`);
                        reject(err2);
                    });
            })
            .catch((err)=>{
                Log.connectionLog(5, `groupchat.api.setDefaultPolicyAndRightsAtCreate : authority set Policy err! ${JSON.stringify(err)}`);
                reject(err);
            });
    });
};

const deleteRoomAndMemberAuthority = (system_uuid, session, resource, actionMenberJIDs) => {
    return new Promise((resolve, reject) => {
        const accessToken = session.getAccessToken();
        const createrJid = session.getJid();
        AuthorityController.deleteRightPolicyOfResource(
            system_uuid, session,{resource:resource}
        ).then(
            (res2) =>{
                actionMenberJIDs = _.without(actionMenberJIDs, createrJid);
                Log.connectionLog(6, `groupchat.api.deleteRoomAndMemberAuthority: sliced creater actionMenberJIDs:${JSON.stringify(actionMenberJIDs)}`);
                sendRemoveMemberRequestToXmpp(
                    accessToken, resource, createrJid, actionMenberJIDs
                ).then((res3)=>{
                    Log.connectionLog(5, `groupchat.api.deleteRoomAndMemberAuthority: authority cleaned, clean xmpp done !`);
                    resolve({
                        result: true,
                        reason: API_STATUS.SUCCESS,
                        roomId : resource,
                        deleted: true
                    });
                }).catch((err3)=>{
                    Log.connectionLog(3, `groupchat.api.setDefaultPolicyAndRightsAtCreat: not clean xmpp err!:${JSON.stringify(err3)}`);
                    reject({
                        result: false,
                        reason: API_STATUS.INTERNAL_SERVER_ERROR,
                        roomId : resource,
                        deleted: false
                    });
                });
            }).catch((err2) =>{
                Log.connectionLog(2, `groupchat.api.deleteRoomAndMemberAuthority: not authority clean err! ${JSON.stringify(err2)}`);
                reject({
                    result: false,
                    reason: API_STATUS.INTERNAL_SERVER_ERROR,
                    roomId : resource,
                    deleted: false
                });
            });
    });
};

function sendRemoveMemberRequestToXmpp(accessToken, roomId, ownerJid, memberJids) {
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
        if (! _.isString(ownerJid) || ownerJid == '') {
            Log.connectionLog(4, 'ownerJid is invalid. community::api::sendDeleteGroupRequestToXmpp');
            reject('invalid parameter');
            return;
        }
        if (! _.isArray(memberJids)) {
            Log.connectionLog(4, 'memberJids is invalid. community::api::sendDeleteGroupRequestToXmpp');
            reject('invalid parameter');
            return;
        }
        const _accessToken = accessToken;
        const _content = {
            type: RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM,
            removeType: 'member',
            roomId: roomId
        };
        let _promises = [];
        if (memberJids.length == 0) {
            _promises.push(Promise.resolve({result: true}));
        } else {
            _content.members = memberJids;
            _promises.push(sendRemoveMemberRequestToXmppWrap(_accessToken, _content));
        }

        Promise.all(_promises)
        .then((res)=> {
            if (res[0].result == true) {
                Log.connectionLog(6, 'community::api::sendDeleteGroupRequestToXmpp, done to remove members. ' + _content.roomId);
            } else {
                Log.connectionLog(4, 'community::api::sendDeleteGroupRequestToXmpp, done to remove members. but might be failed.' + _content.roomId);
            }
            _content.removeType = 'own';
            _content.members = [ownerJid];
            return sendRemoveMemberRequestToXmppWrap(_accessToken, _content);
        }).then((res)=> {
            if (res.result == true) {
                Log.connectionLog(6, 'community::api::sendDeleteGroupRequestToXmpp, done to remove owner. ' + _content.roomId);
            } else {
                Log.connectionLog(4, 'community::api::sendDeleteGroupRequestToXmpp, done to remove owner. but might be failed.' + _content.roomId);
            }
            return sendDeleteGroupRequestToXmpp(_accessToken, _content.roomId);
        }).then((res)=> {
            if (res.result == true) {
                Log.connectionLog(6, 'community::api::sendDeleteGroupRequestToXmpp, done to system remove. ' + _content.roomId);
            } else {
                Log.connectionLog(4, 'community::api::sendDeleteGroupRequestToXmpp, done to system remove. but might be failed.' + _content.roomId);
            }
            resolve();
        }).catch((err)=> {
            Log.connectionLog(3, 'community::api::sendDeleteGroupRequestToXmpp, failed to remove. ' + _content.roomId + ', ' + err);
            reject(err);
        });
    });
}

function sendRemoveMemberRequestToXmppWrap(accessToken, content) {
    return new Promise((resolve, reject) => {
        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        let _res = _synchronousBridgeNodeXmpp.removeMember(
            accessToken,
            content,
            (result, reason, extras, count, items)=> {
                const _responceContent = {
                    result : result,
                    reason : reason,
                    type : content.type,
                    extras : extras,
                    count : count,
                    items : items
                };
                resolve(_responceContent);
                return;
            }
        );
        if (!_res) {
            reject('failed to call removeMember');
            return;
        }
    });
}

function sendDeleteGroupRequestToXmpp(accessToken, roomId) {
    return new Promise((resolve, reject) => {
        const _accessToken = accessToken;
        const _content = {
            type: RequestData.DELETE_GROUP_TYPE_GROUP_CHAT_ROOM,
            roomId: roomId
        };
        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        let _res = _synchronousBridgeNodeXmpp.deleteGroup(
            _accessToken,
            _content,
            (result, reason, extras, count, items)=> {
                const _responceContent = {
                    result : result,
                    reason : reason,
                    type : _content.type,
                    items : items
                };
                resolve(_responceContent);
                return;
            }
        );
        if (!_res) {
            reject('failed to call removeMember');
            return;
        }
    });
}

const __testonly__ = {
    sendRemoveMemberRequestToXmpp: sendRemoveMemberRequestToXmpp
};
exports.__testonly__ = __testonly__;
