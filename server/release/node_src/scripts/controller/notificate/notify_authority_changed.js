/**
 * Notification of authority changed to session via websocket
 * @module  src/scripts/controller/notificate/notify_authority_changed
 */

'use strict';

const _ = require('underscore');

const ServerLog = require('../server_log');
const _log = ServerLog.getInstance();

const CubeeWebApi = require('../cubee_web_api');
const SessionDataMannager = require('../session_data_manager');

const RequestData = require('../../model/request_data').RequestData;


/**
 * 権限変更の通知を行う
 * @param  {string} tenant_uuid テナントUUID
 * @param  {object} user_ids    通知対象のユーザ（ログインアカウント）の配列
 * @param  {object} content     通知する内容
 */
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
