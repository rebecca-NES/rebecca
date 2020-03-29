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

var log = require('./log');
var DBIF = require('./db/db_if');
var DBError = require('./db/db_error').DBError;
var _ = require('underscore');

var LOG = log.returnLogFunction();
var _dbif = DBIF.create();

function listRoles(system_uuid, request={}){
    return new Promise((resolve, reject) => {
        if (!request || !request.getLoginAccout) {
            reject(false);
        }
        _dbif.getRoles(system_uuid, (e,res) => {
            if (e) {
                LOG.connectionLog(6, `err: ${JSON.stringify(e)}`);
                reject(e);
            } else {
                LOG.connectionLog(6, `res: ${JSON.stringify(res)}`);
                resolve(res);
            }
        });
    });
}

function detailRoles(_system_uuid, request, userId){
    return new Promise((resolve, reject) => {
        if (!request || !request.getLoginAccout) {
            reject(false);
        }
        _dbif.getPoliciesOfRole(_system_uuid, userId, (e,res) => {
            if (e) {
                LOG.connectionLog(6, `err: ${JSON.stringify(e)}`);
                reject(e);
            } else {
                LOG.connectionLog(6, `res: ${JSON.stringify(res)}`);
                resolve(res);
            }
        });
    });
}

function getRoleAssignmentForUser(system_uuid, request={}, userId='') {
    return new Promise((resolve, reject) => {
        _dbif.getUserRole(system_uuid, userId, (e, roles) => {
            if (e) {
                LOG.connectionLog(6, `err: ${JSON.stringify(e)}`);
                if ('code' in e && e.code == DBError.DB_ERR_RESULT_NONE) {
                    resolve({});
                    return;
                }
                reject(e);
            } else {
                LOG.connectionLog(7, `roles: ${JSON.stringify(roles)}`);
                resolve(roles);
            }
        });
    });
}

function assignRoleToUser(system_uuid, request={}, userId='', roleId='') {
    return new Promise((resolve, reject) => {
        if (!request || !request.getLoginAccout) {
            reject(false);
        }
        const bywho = request.getLoginAccout();
        _dbif.upsertUser(system_uuid, userId, roleId, bywho, (e, res) => {
            if (e) {
                LOG.connectionLog(6, `err: ${JSON.stringify(e)}`);
                reject(e);
            } else {
                LOG.connectionLog(6, `res: ${JSON.stringify(res)}`);
                resolve(res);
            }
        });
    });
}

function getRights(system_uuid, session, userId) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        _dbif.getRightsOfUser(system_uuid, userId, (e, res) => {
            if (e) {
                LOG.connectionLog(3, `err: ${JSON.stringify(e)}`);
                if (_.isObject(e) && 'code' in e && e.code == DBError.DB_ERR_RESULT_NONE) {
                    resolve([]);
                    return;
                }
                reject(e);
            } else {
                LOG.connectionLog(7, `res: ${JSON.stringify(res)}`);
                resolve(res);
            }
        });
    });
}

function createPolicy(system_uuid, session, policyID, policyTID, translations) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        const bywho = session.getLoginAccout();
        _dbif.upsertPolicy(system_uuid, policyID, policyTID, translations, bywho, (e, res) => {
            if (e) {
                LOG.connectionLog(3, `err: ${JSON.stringify(e)}`);
                reject(e);
            } else {
                LOG.connectionLog(7, `res: ${JSON.stringify(res)}`);
                resolve(res);
            }
        });
    });
}

function createRight(system_uuid, session, policyID, action, resource, condition, enableFlag) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        const bywho = session.getLoginAccout();
        _dbif.upsertRight(system_uuid, policyID, action, resource,
                          condition, enableFlag, bywho, (e, res) => {
                              if (e) {
                                  LOG.connectionLog(3, `err: ${JSON.stringify(e)}`);
                                  reject(e);
                              } else {
                                  LOG.connectionLog(7, `res: ${JSON.stringify(res)}`);
                                  resolve(res);
                              }
                          });
    });
}

function assignPolicyToUsers(system_uuid, session, userIDs, policyID) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        _dbif.assignPolicyToUsers(
            system_uuid, userIDs, policyID, (e, res) => {
                if (e) {
                    LOG.connectionLog(3, `err: ${JSON.stringify(e)}`);
                    reject(e);
                } else {
                    LOG.connectionLog(7, `res: ${JSON.stringify(res)}`);
                    resolve(res);
                }
            }
        );
    });
}

function getUserPoliciesByResource(system_uuid, session, resourceID) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        _dbif.getUsersAttachedWithResource(
            system_uuid, resourceID, (e, res) => {
                if (e) {
                    LOG.connectionLog(3, `err: ${JSON.stringify(e)}`);
                    reject(e);
                } else {
                    LOG.connectionLog(7, `res: ${JSON.stringify(res)}`);
                    resolve(res);
                }
            });
    });
}

function unassignPolicyFromUser(system_uuid, session, userIDs, policyID) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        _dbif.unassignPolicyToUsers(
            system_uuid, userIDs, policyID, (e, res) => {
                if (e) {
                    LOG.connectionLog(3, `err: ${JSON.stringify(e)}`);
                    reject(e);
                } else {
                    LOG.connectionLog(7, `res: ${JSON.stringify(res)}`);
                    resolve(res);
                }
            });
    });
}

function checkUserHavePolicy(system_uuid, session, userID, action, resource) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        _dbif.doesUserHasSpecificRight(
            system_uuid, userID, action, resource, (e, res) => {
                if (e) {
                    LOG.connectionLog(3, `err: ${JSON.stringify(e)}`);
                    reject(e);
                } else {
                    LOG.connectionLog(7, `res: ${JSON.stringify(res)}`);
                    resolve(res);
                }
            });
    });
}

function deleteRightPolicyOfResource(system_uuid, session, resource) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        _dbif.deleteRightPolicyOfResource(
            system_uuid, resource, (e, res) => {
                if (e) {
                    LOG.connectionLog(3, `err: ${JSON.stringify(e)}`);
                    reject(e);
                } else {
                    LOG.connectionLog(7, `res: ${JSON.stringify(res)}`);
                    resolve(res);
                }
            });
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
