/**
 * Cubee Authority Web API interface module
 * @module  src/scripts/controller/auhority/cubee_authority_api
 */

'use strict';

const _ = require('underscore');

const authorityController = require('./controller');
const SessionDataMannager = require('../session_data_manager');

const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const API_STATUS = require('../const').API_STATUS;
// Authority配下ではないutils
const Utils = require('../../utils');

// TODO we should not use Authority's files without IF file.
const utils = require('../../Authority/utils');
//const role_api = require('../../Authority/authority_api');


const requestMap = {
    [utils.API_GET_ROLES]: getRoles,
    [utils.API_GET_ROLE_ASSIGNMENT]: getRoleAssignmentForUser,
    [utils.API_ASSIGN_ROLE]: assignRoleToUser,
    // 5 権限参照
    [utils.API_RIGHT_GET]: getRights,
    // 6.1 ポリシー更新
    [utils.API_POLICY_CREATE]: createPolicy,
    // 6.2 権限更新
    [utils.API_RIGHT_CREATE]: createRight,
    // 7 ポリシー紐付
    [utils.API_POLICY_ASSIGN_TO_USERS]: assignPolicyToUsers,
    // 8 リソース関連ユーザー情報参照
    [utils.API_POLICIES_OF_USER_GET_BY_RESOURCE]: getUserPoliciesByResource,
    // 9 ポリシー紐づけ解除
    [utils.API_POLICY_UNASSIGN_FROM_USERS]: unassignPolicyFromUser,
    //10 ユーザー権限保持チェック
    [utils.API_POLICY_CHECK]: checkUserHavePolicy,
    //11 ルームに紐付された権限をとポリシーを削除
    [utils.API_DELETE_RIGHT_POLICY_RESOURCE]: deleteRightPolicyOfResource
};

/**
 * recieve
 *
 * 権限管理に関するAPIの受け口。
 * role, policy, resourceといった指定されたリソースに対するrequestごとにAPIを実行する。
 *
 * @param {Object} socket - socket情報
 * @param {Object} _receiveObject - リクエスト情報
 * @param {function} processCallback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
function receive(socket, _receiveObject={}, processCallback, apiUtil){
    // requestごとに実行する処理の振り分け
    if (_.has(requestMap, _receiveObject.request)) {
        // Invocation of method with 2 Values name may dispatch to unexpected target and cause an exception.
        if (typeof requestMap[_receiveObject.request] === 'function') {
            requestMap[_receiveObject.request](_receiveObject, processCallback, apiUtil);
        }
    } else {
        var _content = utils.getChildObject(_receiveObject, 'content');
        processCallback(utils.createResponseStr(_receiveObject, _content,
                                                utils.API_ERR_RESPONSE_Not_Found));
        return false;
    }
    return true;
}

/**
 * 1. ロール一覧参照, 2. ロール詳細参照(id指定あり)
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
function getRoles(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content || {},
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();
    if (_.has(_content, "id")) {
        authorityController.detailRoles(_system_uuid, _session, _content.id)
            .then((res) => {
                executeCallback(receiveObj, callback, res, 0, apiUtil);
            })
            .catch((reason) => {
                executeCallback(receiveObj, callback, reason, 1, apiUtil);
            });
    } else {
        //role_api.listRoles(_system_uuid, _receiveObject, processCallback)
        authorityController.listRoles(_system_uuid, _session)
            .then((res) => {
                executeCallback(receiveObj, callback, res, 0, apiUtil);
            })
            .catch((reason) => {
                executeCallback(receiveObj, callback, reason, 1, apiUtil);
            });
    }
}

/**
 * getRoleAssignmentForUser
 *
 * 3. 指定ユーザのロール（アカウントタイプ）を取得する
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
function getRoleAssignmentForUser(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.getRoleAssignmentForUser(_system_uuid, _session, _content.user_id)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });
    return true;
}

/**
 * AssignRoleToUser
 *
 * 4. 指定されたユーザにロール（アカウントタイプ）をセットする
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean} - whether to execute properly
 */
function assignRoleToUser(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid(),
            _accessToken = Utils.getChildObject(receiveObj, 'accessToken'),
            _fromJid = _session.getJid();

    confirmTenantAdmin(_accessToken, _fromJid).then((res) => {
        authorityController.assignRoleToUser(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        });
    }).catch((reason) => {
        executeCallback(receiveObj, callback, reason, 1, apiUtil);
    });
    return true;
}

function confirmTenantAdmin(_accessToken, _fromJid) {
    return new Promise((resolve, reject) => {

        function _tenantAdminCallback(xmlIqElem){
            // 正常にデータが取得できていない場合
            const _userAuthorityElem = Utils.getChildXmlElement(xmlIqElem, 'user_authority');
            if (_userAuthorityElem == null) {
                reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR});
                return;
            }
            const _typeElem = Utils.getChildXmlElement(_userAuthorityElem, 'type');
            if (_typeElem == null) {
                reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR});
                return;
            }
            // ログインユーザがテナント管理者である場合、リクエストの処理を実行
            const _authorityType = _typeElem.text();
            const PersonData = require('../../model/person_data');
            if (_authorityType == PersonData.AUTHORITY_TYPE_ADMIN) {
                // リクエストによって処理を振り分け
                resolve(true);
            } else {
                reject({result: false, reason: API_STATUS.FORBIDDEN});
            }
        }

        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.getUserAuthority(_accessToken, _fromJid, _tenantAdminCallback);
    });
}

/**
 * getRights
 *
 * 5 権限参照
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean} - whether to execute properly
 */
function getRights(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.getRights(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });

    return true;
}

/**
 * createPolicy
 *
 * 6.1 ポリシー更新
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean} - whether to execute properly
 */
function createPolicy(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.createPolicy(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });

    return true;
}

/**
 * createRight
 *
 * 6.2 権限更新
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean} - whether to execute properly
 */
function createRight(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.createRight(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });

    return true;
}

/**
 * assignPolicyToUsers
 *
 * 7 ポリシー紐付
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 * @param {string} triger - create or update デフォルトはupdate。権限変更が実施された場合の処理を記載。通知にのせる。
 *
 * @return {boolean} - whether to execute properly
 */
function assignPolicyToUsers(receiveObj, callback, apiUtil, triger='update') {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.assignPolicyToUsers(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });

    return true;
}

/**
 * getUserPoliciesByResource
 *
 * 8 リソース関連ユーザー情報参照
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean} - whether to execute properly
 */
function getUserPoliciesByResource(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.getUserPoliciesByResource(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });

    return true;
}

/**
 * unassignPolicyFromUser
 *
 * 9 ポリシー紐づけ解除
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean} - whether to execute properly
 */
function unassignPolicyFromUser(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.unassignPolicyFromUser(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });

    return true;
}

/**
 * checkUserHavePolicy
 *
 * 10 ユーザー権限保持チェック
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean} - whether to execute properly
 */
function checkUserHavePolicy(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.checkUserHavePolicy(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });

    return true;
}

/**
 * deleteRightPolicyOfResource
 *
 * 11 ルームに紐付された権限とポリシーを削除
 *
 * @param {Object} receiveObj - リクエスト情報
 * @param {Object} callback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean} - whether to execute properly
 */
function deleteRightPolicyOfResource(receiveObj, callback, apiUtil) {
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(receiveObj.accessToken),
            _system_uuid = _session.getTenantUuid();

    authorityController.deleteRightPolicyOfResource(_system_uuid, _session, _content)
        .then((res) => {
            executeCallback(receiveObj, callback, res, 0, apiUtil);
        })
        .catch((reason) => {
            executeCallback(receiveObj, callback, reason, 1, apiUtil);
        });

    return true;
}


function executeCallback(req,  callback, content=null, errorCode, apiUtil) {
    const _req = req.request,
            _id = req.id,
            _version = req.version,
            _token = req.accessToken;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, content);
}

exports.receive = receive;
