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

const ServerLog = require('../server_log');
const _log = ServerLog.getInstance();

const CubeeWebApi = require('../cubee_web_api');
const SessionDataMannager = require('../session_data_manager');

const RequestData = require('../../model/request_data').RequestData;


function notifyAuthorityChanged(tenant_uuid, user_ids, content) {
    if (! _.isString(tenant_uuid)) {
        _log.connectionLog(3, 'notify_authority_changed#notifyAuthorityChanged: invalid argument (tenant_uuid)');
        return;
    }
    if (! _.isArray(user_ids)) {
        _log.connectionLog(3, 'notify_authority_changed#notifyAuthorityChanged: invalid arguments (user_ids)');
        return;
    }
    if ( _.isEmpty(user_ids)) {
        _log.connectionLog(4, 'notify_authority_changed#notifyAuthorityChanged: invalid arguments (user_ids is empty)');
        return;
    }
    if (! _.isObject(content)) {
        _log.connectionLog(3, 'notify_authority_changed#notifyAuthorityChanged: invalid arguments (content)');
        return;
    }
    if ( _.isEmpty(content)) {
        _log.connectionLog(4, 'notify_authority_changed#notifyAuthorityChanged: invalid arguments (content is empty)');
        return;
    }
    let _tenant_uuid = tenant_uuid;
    let _user_ids = _.uniq(user_ids);
    let _cotent = content;

    process.nextTick(()=> {
        let _sessionDataMannager = SessionDataMannager.getInstance();
        _user_ids.forEach((user_id)=> {
            let _sessionDataArray = _sessionDataMannager.getByLoginAccountInTenant(_tenant_uuid, user_id);
            _sessionDataArray.forEach((_sessionData)=> {
                CubeeWebApi.getInstance().pushMessage(
                    _sessionData.getAccessToken(),
                    RequestData.NOTIFY_MESSAGE_AUTHORIY_CHANGED,
                    _cotent
                );
            });
        });
    });
}

exports.notifyAuthorityChanged = notifyAuthorityChanged;
