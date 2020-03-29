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
const RequestData = require('../../model/request_data').RequestData;
const SessionDataMannager = require('../session_data_manager');
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const API_STATUS = require('../const').API_STATUS;

const precheckFuncs = {
    [RequestData.SET_LOGIN_PERSON_DATA_TYPE_PASSWORD] : API.doBeforeChangePassword,
    [RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE]  : API.doBeforeUpdateProfile,
};

exports.doApi = (socket, receiveObj={}, callback, apiUtil) => {
    if(!_.has(receiveObj, 'accessToken') ||
       !_.has(receiveObj, 'content')     ||
       !_.has(receiveObj.content, 'type')
    ){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        Log.connectionLog(6, 'profile.web_api.doApi invalid parameter');
        return false;
    }

    Log.connectionLog(7, 'profile.web_api.doApi in');

    const _accessToken = receiveObj.accessToken;
    const _content = receiveObj.content,
            _type = receiveObj.content.type,
            _session = SessionDataMannager.getInstance().get(_accessToken),
            _system_uuid = _session.getTenantUuid();
    let _responceContent = {};

    precheckFuncs[_type](_system_uuid, _session, _content)
    .then(() => {
        Log.connectionLog(7, `profile.web_api.doApi after precheckFunc`);

        let _SBNX = SynchronousBridgeNodeXmpp.getInstance();
        let _ret = _SBNX.setLoginPersonData(_accessToken, _content, (result, reason, content)=> {
            Log.connectionLog(7, `profile.web_api.callSbnx after`);
            if(content != null) {
                _responceContent = content;
                _responceContent.result = result;
                _responceContent.reason = reason;
                _responceContent.type = _type;
            } else {
                _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                };
            }
            executeCallback(receiveObj, callback, _responceContent, 0, apiUtil);
            return;
        });
        if (! _ret) {
            Log.connectionLog(7, `profile.web_api.callSbnx return false`);
            executeCallback(receiveObj, callback, _content, 1, apiUtil);
            return;
        }

    })
    .catch((err) => {
        Log.connectionLog(6, `profile.web_api.doApi catch error: ` + JSON.stringify(err));
        switch (_type){
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PASSWORD:
            _responceContent.result = err.result;
            _responceContent.reason = err.reason;
            _responceContent.type = _type;
            break;
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE:
            _responceContent = _content;
            _responceContent.result = err.result;
            _responceContent.reason = err.reason;
            break;
        default:
            break;
        }
        let errorCode = 0;
        if (_responceContent.reason == API_STATUS.BAD_REQUEST) {
            errorCode = 1;
        }
        executeCallback(receiveObj, callback, _responceContent, errorCode, apiUtil);
    });

    Log.connectionLog(7, 'profile.web_api.doApi out');
    return true;

};

function executeCallback(req, callback, content=null, errorCode, apiUtil) {
    const _req = req.request,
            _id = req.id,
            _version = req.version,
            _token = req.accessToken;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, content);
}
