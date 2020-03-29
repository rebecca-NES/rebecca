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

const authorityManager = require('../../Authority/authority_api');

const NotifyAuthorityChanged = require('../notificate/notify_authority_changed');

const LOG = require('../server_log').getInstance();
const API_REQUEST = require('../const').API_REQUEST;
const API_STATUS = require('../const').API_STATUS;

function listRoles(system_uuid, session) {
    return new Promise((resolve, reject) => {
        authorityManager.listRoles(system_uuid, session)
            .then((res) => {
                const _role = _.map(res, function(v){
                    return _.pick(v, 'id', 't');
                });
                resolve(_.extend({result: true, reason: API_STATUS.SUCCESS}, {role: _role}));
            })
            .catch((err) => {
                LOG.connectionLog(5, `.listRoles: ${JSON.stringify(err)}`);
                reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
            });
    });
}

function detailRoles(system_uuid, session, userId) {
    return new Promise((resolve, reject) => {
        if (!userId || typeof userId != "string") {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.detailRoles(system_uuid, session, userId)
                .then((res) => {
                    var returnData = _.map(res, function(v){
                        return _.pick(v, 'id','role_tid','created_at','updated_at',
                                      't', 'policies');
                    });
                    var policies = _.map(returnData[0]['policies'], function(v){
                        return _.pick(v, 'id', 't', 'rights');
                    });
                    returnData[0]['policies'] = policies;
                    resolve(_.extend({result: true, reason: API_STATUS.SUCCESS}, {role: returnData[0]}));
                })
                .catch((err) => {
                    LOG.connectionLog(5, `detailRoles: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

function getRoleAssignmentForUser(system_uuid, session, userId=null) {
    return new Promise((resolve, reject) => {
        if (!userId || typeof userId != "string") {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.getRoleAssignmentForUser(system_uuid, session, userId)
            .then((res) => {
                if (_.isEmpty(res)) {
                    resolve(_.extend({result: true, reason: API_STATUS.NOT_FOUND}, {role: {}}));
                    return;
                }
                const _role = _.pick(res[userId].role, 'id', 't');
                resolve(_.extend({result: true, reason: API_STATUS.SUCCESS}, {role: _role}));
            })
            .catch((err) => {
                LOG.connectionLog(5, `getRoleAssignmentForUser: ${JSON.stringify(err)}`);
                reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
            });
        }
    });
}

function assignRoleToUser(system_uuid, session, params={}) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'user_id') || typeof params.user_id != 'string' ||
            !_.has(params, 'role_id') || typeof params.role_id != 'string') {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.getRoleAssignmentForUser(system_uuid, session, params.user_id)
            .then((resGet) => {
                if (_.isEmpty(resGet)){
                } else if (params.role_id == _.pick(resGet[params.user_id].role, 'id', 't').id) {
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                    return;
                }
                authorityManager.assignRoleToUser(system_uuid, session, params.user_id, params.role_id)
                .then((res) => {
                    let users = [params.user_id];
                    let content = {
                        type: API_REQUEST.API_ASSIGN_ROLE,
                        role: _.pick(
                            res[params.user_id].role,
                            'id',
                            't'
                        )
                    };
                    NotifyAuthorityChanged.notifyAuthorityChanged(
                        system_uuid,
                        users,
                        content
                    );

                    resolve({result: true, reason: API_STATUS.SUCCESS});
                }).catch((err) => {
                    LOG.connectionLog(5, `assignRoleToUser: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
            }).catch((err) => {
                LOG.connectionLog(5, `assignRoleToUser: ${JSON.stringify(err)}`);
                reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
            });
        }
    });
}

function getRights(system_uuid, session, params={}) {
    return new Promise((resolve, reject) => {
        const bywho = session.getLoginAccout();
        if (!system_uuid || !params ||
            !_.has(params, 'user_id') || typeof params.user_id != 'string' ||
            bywho != params.user_id) {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.getRights(system_uuid,
                                       session,
                                       params.user_id)
                .then((res) => {
                    let _rights = [];
                    for (let re of res){
                        if(_.has(re,'resource') &&
                           _.isString(re.resource)){
                            _rights.push(
                                _.pick(re, "action","resource","enable_flag"));
                        }else{
                            _rights.push(
                                _.pick(re, "action","enable_flag"));
                        }
                    }
                    if(_rights.length > 0){
                        resolve({rights : _rights, result: true, reason: API_STATUS.SUCCESS});
                    }else{
                        reject({rights : _rights, result: true, reason: API_STATUS.NOT_FOUND});
                    }
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.getRights: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

function createPolicy(system_uuid, session, params) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'policy_id')     ||
            typeof params.policy_id != 'string' ||
            !_.has(params, 'policy_tid')    ||
            typeof params.policy_tid != 'string' ||
            !_.has(params, 'translations') ||
            typeof params.translations != 'object') {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.createPolicy(
                system_uuid,
                session,
                params.policy_id,
                params.policy_tid,
                params.translations)
                .then((res) => {
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.createPolicy: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

function createRight(system_uuid, session, params) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'policy_id')   ||
            typeof params.policy_id != 'string' ||
            !_.has(params, 'action')      ||
            typeof params.action != 'string' ||
            !_.has(params, 'resource')    ||
            typeof params.resource != 'string' ||
            (_.has(params, 'condition')  &&
             typeof params.condition != 'string') ||
            !_.has(params, 'enable_flag') ||
            !_.isBoolean(params.enable_flag)
           ) {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            let condition = null;
            if(_.has(params, 'condition')){
                condition = params.condition;
            }
            authorityManager.createRight(
                system_uuid,
                session,
                params.policy_id,
                params.action,
                params.resource,
                condition,
                params.enable_flag
            )
                .then((res) => {
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.createRight: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

function assignPolicyToUsers(system_uuid, session, params, triger='update') {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'policy_id') ||
            typeof params.policy_id != 'string' ||
            !_.has(params, 'users') ||
            !_.isArray(params.users) ||
            params.users.length == 0 ||
            typeof  params.users[0] != 'string') {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.assignPolicyToUsers(
                system_uuid,
                session,
                params.users,
                params.policy_id)
                .then((res) => {
                    let content = {
                        type: API_REQUEST.API_POLICY_ASSIGN_TO_USERS,
                        policy: _.pick(
                            res,
                            'id',
                            't'
                        ),
                        triger: triger
                    };

                    NotifyAuthorityChanged.notifyAuthorityChanged(
                        system_uuid,
                        params.users,
                        content
                    );
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.assignPolicyToUsers: ${JSON.stringify(err)}`);
                    if(_.has(err,"extra") && _.isArray(err.extra) &&
                       err.extra.length > 0){
                        if (_.has(err,"policy")) {
                            let content = {
                                type: API_REQUEST.API_POLICY_ASSIGN_TO_USERS,
                                policy: _.pick(
                                    err.policy,
                                    'id',
                                    't'
                                ),
                                triger: triger
                            };

                            NotifyAuthorityChanged.notifyAuthorityChanged(
                                system_uuid,
                                _.difference(params.users, err.extra),
                                content
                            );
                        }
                        reject({
                            result: false,
                            reason: API_STATUS.NOT_FOUND,
                            error_users: err.extra
                        });
                    }else{
                        reject({result: false,reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                    }
                });
        }
    });
}

function getUserPoliciesByResource(system_uuid, session, params) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'resource_id') ||
            typeof params.resource_id != 'string') {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.getUserPoliciesByResource(
                system_uuid,
                session,
                params.resource_id)
                .then((res) => {
                    let _res = [];
                    for(let re of res){
                        let _pol = [];
                        if(_.isArray(re["policies"])){
                            for(let re_policies of re["policies"]){
                                let _rig = [];
                                if(_.isArray(re_policies["rights"])){
                                    for(let re_pol_rights of re_policies["rights"]){
                                        _rig.push(_.pick(re_pol_rights,
                                                         "action","enable_flag"));
                                    }
                                }
                                _pol.push(
                                    _.extend(
                                        _.pick(re_policies, "id"),
                                        {"rights":_rig}
                                    )
                                );
                            }
                        }
                        _res.push(
                            _.extend(
                                _.pick(re,"user_id"),
                                _.pick(re, "user"),
                                {"policies":  _pol}
                            )
                        );
                    }
                    resolve({"users":_res,result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.getUserPoliciesByResource: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

function unassignPolicyFromUser(system_uuid, session, params) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'users') ||
            !_.isArray(params.users) ||
            params.users.length <= 0 ||
            typeof params.users[0] != 'string' ||
            !_.has(params, 'policy_id') ||
            typeof params.policy_id != 'string') {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.unassignPolicyFromUser(
                system_uuid,
                session,
                params.users,
                params.policy_id)
                .then((res) => {
                    let content = {
                        type: API_REQUEST.API_POLICY_UNASSIGN_FROM_USERS,
                        policy: _.pick(
                            res,
                            'id',
                            't'
                        )
                    };
                    NotifyAuthorityChanged.notifyAuthorityChanged(
                        system_uuid,
                        params.users,
                        content
                    );
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.unassignPolicyFromUser: ${JSON.stringify(err)}`);
                    if(_.isArray(err["extra"]) &&
                       err["extra"].length > 0){
                        if (_.has(err,"policy")) {
                            let content = {
                                type: API_REQUEST.API_POLICY_ASSIGN_TO_USERS,
                                policy: _.pick(
                                    err.policy,
                                    'id',
                                    't'
                                )
                            };
                            NotifyAuthorityChanged.notifyAuthorityChanged(
                                system_uuid,
                                _.difference(params.users, err.extra),
                                content
                            );
                        }
                        reject({
                            result: false,
                            reason: API_STATUS.NOT_FOUND,
                            error_users: err.extra
                        });
                    }else{
                        reject({result: false,reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                    }
                });
        }
    });
}

function checkUserHavePolicy(system_uuid, session, params={}) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'user_id') ||
            typeof params.user_id != 'string' ||
            !_.has(params, 'action') ||
            typeof params.action != 'string' ||
            !_.has(params, 'resource') ||
            (typeof params.resource != 'string' && params.resource != null)
           ) {
            reject({enable_flag: false,result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.checkUserHavePolicy(
                system_uuid,
                session,
                params.user_id,
                params.action,
                params.resource)
                .then((res) => {
                    let _flag = false;
                    if(_.has(res,"enable_flag")){
                        _flag = res.enable_flag;
                    }
                    resolve({
                        enable_flag: _flag,
                        result: true,
                        reason: API_STATUS.SUCCESS
                    });
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.checkUserHavePolicy: ${JSON.stringify(err)}`);
                    reject({enable_flag: false,result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

function deleteRightPolicyOfResource(system_uuid, session, params={}) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'resource') ||
            typeof params.resource != 'string'
           ) {
            reject({enable_flag: false,result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            authorityManager.deleteRightPolicyOfResource(
                system_uuid,
                session,
                params.resource)
                .then((res) => {
                    let _flag = false;
                    if(_.has(res,"deleted")){
                        _flag = res.deleted;
                    }
                    resolve({
                        enable_flag: _flag,
                        result: true,
                        reason: API_STATUS.SUCCESS
                    });
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.deleteRightPolicyOfResource: ${JSON.stringify(err)}`);
                    reject({enable_flag: false,result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

exports.listRoles = listRoles;
exports.detailRoles = detailRoles;
exports.getRoleAssignmentForUser = getRoleAssignmentForUser;
exports.assignRoleToUser = assignRoleToUser;
exports.getRights = getRights;
exports.createPolicy = createPolicy;
exports.createRight = createRight;
exports.assignPolicyToUsers = assignPolicyToUsers;
exports.getUserPoliciesByResource = getUserPoliciesByResource;
exports.unassignPolicyFromUser = unassignPolicyFromUser;
exports.checkUserHavePolicy = checkUserHavePolicy;
exports.deleteRightPolicyOfResource = deleteRightPolicyOfResource;
