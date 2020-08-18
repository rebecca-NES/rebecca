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

const authorityController = require('./controller');
const SessionDataMannager = require('../session_data_manager');

const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const API_STATUS = require('../const').API_STATUS;
const Utils = require('../../utils');

const utils = require('../../Authority/utils');


const requestMap = {
    [utils.API_GET_ROLES]: getRoles,
    [utils.API_GET_ROLE_ASSIGNMENT]: getRoleAssignmentForUser,
    [utils.API_ASSIGN_ROLE]: assignRoleToUser,
    [utils.API_RIGHT_GET]: getRights,
    [utils.API_POLICY_CREATE]: createPolicy,
    [utils.API_RIGHT_CREATE]: createRight,
    [utils.API_POLICY_ASSIGN_TO_USERS]: assignPolicyToUsers,
    [utils.API_POLICIES_OF_USER_GET_BY_RESOURCE]: getUserPoliciesByResource,
    [utils.API_POLICY_UNASSIGN_FROM_USERS]: unassignPolicyFromUser,
    [utils.API_POLICY_CHECK]: checkUserHavePolicy,
    [utils.API_DELETE_RIGHT_POLICY_RESOURCE]: deleteRightPolicyOfResource
};

function receive(socket, _receiveObject={}, processCallback, apiUtil){
    if (_.has(requestMap, _receiveObject.request)) {
        requestMap[_receiveObject.request](_receiveObject, processCallback, apiUtil);
    } else {
        var _content = utils.getChildObject(_receiveObject, 'content');
        processCallback(utils.createResponseStr(_receiveObject, _content,
                                                utils.API_ERR_RESPONSE_Not_Found));
        return false;
    }
    return true;
}

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
        authorityController.listRoles(_system_uuid, _session)
            .then((res) => {
                executeCallback(receiveObj, callback, res, 0, apiUtil);
            })
            .catch((reason) => {
                executeCallback(receiveObj, callback, reason, 1, apiUtil);
            });
    }
}

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
            const _authorityType = _typeElem.text();
            const PersonData = require('../../model/person_data');
            if (_authorityType == PersonData.AUTHORITY_TYPE_ADMIN) {
                resolve(true);
            } else {
                reject({result: false, reason: API_STATUS.FORBIDDEN});
            }
        }

        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.getUserAuthority(_accessToken, _fromJid, _tenantAdminCallback);
    });
}

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
