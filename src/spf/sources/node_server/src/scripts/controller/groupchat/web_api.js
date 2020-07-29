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
const API = require('./api');
const Log = require('../server_log').getInstance();
const SessionDataMannager = require('../session_data_manager');
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const API_STATUS = require('../const').API_STATUS;
const utils = require('../../utils');
const Validation = require('../validation');

exports.create = (socket, receiveObj={}, callback, apiUtil) => {
    let _ret = false;
    if(!_.has(receiveObj,"accessToken")||
       !_.has(receiveObj,"content")||
       !_.has(receiveObj.content,"memberItems")||
       ( _.has(receiveObj.content,"parentRoomId") &&
         ! utils.varidieter.parentRoomId(receiveObj.content.parentRoomId) ) ||
       ! Validation.privacyTypeValidationCheck(receiveObj.content.privacyType, false)||
       !_.isArray(receiveObj.content.memberItems) ||
       receiveObj.content.memberItems.length == 0){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return _ret;
    }
    const _accessToken = receiveObj.accessToken;
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(_accessToken),
            _system_uuid = _session.getTenantUuid();

    const afterCreatedRoomCallback = (result, reason, extras, count, items) => {
        _content["result"] = result;
        _content["reason"] = reason;
        _content["extras"] = extras;
        _content["count"]  = count;
        _content["items"]  = items;
        if(!result){
            Log.connectionLog(4, `groupchat.web_api#create Xmpp createGroup error (xmpp reason: ${reason})`);
            executeCallback(receiveObj,
                            callback, _content, 1, apiUtil);
            return;
        }

        API.doAfterCreatedRoom(
            _system_uuid, _session, _content
        ).then((res) => {
            executeCallback(receiveObj,
                            callback, res, 0, apiUtil);
        }).catch((reason) => {
            executeCallback(receiveObj,
                            callback, reason, 1, apiUtil);
        });
    };
    var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    if(_.has(receiveObj.content,"parentRoomId") &&
       receiveObj.content.parentRoomId.length > 0){
        return _synchronousBridgeNodeXmpp.getGroup(
            _accessToken,
            {
                "type" : "CommunityInfo",
                "roomId" : _content.parentRoomId
            },
            (result, reason) => {
                if(result){
                    return _synchronousBridgeNodeXmpp
                        .createGroup(
                            _accessToken,
                            _content,
                            afterCreatedRoomCallback);
                }else{
                    Log.connectionLog(4, `groupchat.web_api#create Xmpp getGroup error (xmpp reason: ${reason})`);
                    executeCallback(receiveObj,
                                    callback, {
                                        result: false,
                                        reason: API_STATUS.BAD_REQUEST
                                    }, 1, apiUtil);
                    return false;
                }
            });
    }else{
        return _synchronousBridgeNodeXmpp
            .createGroup(
                _accessToken,
                _content,
                afterCreatedRoomCallback);
    }
};

function executeCallback(req,  callback, content=null, errorCode, apiUtil) {
    const cntlist = ["type","result","reason","extras","count","items"];
    let _content = {};
    for(let cntkey of cntlist){
        if(_.has(content,cntkey)){
            _content[cntkey] =  content[cntkey];
        }
    }
    const _req = req.request,
            _id = req.id,
            _version = req.version,
            _token = req.accessToken;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, _content);
}
