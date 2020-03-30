/**
 * Authority API interface module
 * @module  src/scripts/Auhority/authority_api
 */

'use strict';

var log = require('./log');
var DBIF = require('./db/db_if');
var DBError = require('./db/db_error').DBError;
// Jsonの整形に使用
var _ = require('underscore');

var LOG = log.returnLogFunction();
var _dbif = DBIF.create();

/**
 * listRoles
 *
 * role一覧返却API。
 * 定義されたroleの一覧をDBから取得し、返却する。
 *
 * <pre>request:
 * {
 *  "accessToken" : <アクセストークン>,
 *  "request" : "roles",
 *  "id" : <id>,
 *  "version" : 0,
 *  "content" : {}
 * }</pre>
 *
 * <pre>response:
 * {
 *   "request" : "roles",
 *   "id" : "<id>",
 *   "version" : 0,
 *   "errorCode" : 0,
 *   "content" : {
 *     "result" : true,
 *     "reason" : 0,
 *     "accessToken" : "＜アクセストークン>",
 *     "roles": [
 *       {
 *         "id":"admin",
 *         "t": {"ja": "管理者"}
 *       },
 *       {
 *         "id":"normal",
 *         "t": {"ja":"一般利用者"}
 *       },
 *       {
 *         "id":"admin",
 *         "t": {"ja":"閲覧者"}
 *       },
 *
 *     ]
 *   }
 * }</pre>
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} request - 実行ユーザのセッションデータ
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
function listRoles(system_uuid, request={}){
    // role一覧の取得
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
                //console.log(res);
                resolve(res);
            }
        });
    });
}

/**
 * detailRoles
 *
 * role詳細返却API
 * content内にて、指定されたroleのidが存在しているか確認する。
 * 確認できた後、紐づいているpolicyを参照し、整形して返却する。
 *
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} request - 実行ユーザのセッションデータ
 * @param {string} userId ユーザーID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 *
 */
function detailRoles(_system_uuid, request, userId){
    // role一覧の取得
    return new Promise((resolve, reject) => {
        if (!request || !request.getLoginAccout) {
            reject(false);
        }
        _dbif.getPoliciesOfRole(_system_uuid, userId, (e,res) => {
            if (e) {
                LOG.connectionLog(6, `err: ${JSON.stringify(e)}`);
                //console.log(e);
                reject(e);
            } else {
                LOG.connectionLog(6, `res: ${JSON.stringify(res)}`);
                //console.log(res);
                resolve(res);
            }
        });
    });
}

/**
 * getRoleAssignmentForUser
 *
 * 指定したユーザのロールアサイン情報を取得する
 * <pre>
 * role: {
 *   id: 'userID',
 *   name: 'userName'
 * }
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} request - 実行ユーザのセッションデータ
 * @param {string} userId - 取得したいユーザのID
 *
 * @return {promise} データ取得が正常にできた場合はresolve, 失敗した場合はreject
 */
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

/**
 * assignRoleToUser
 *
 * 指定したユーザにロール情報を設定する。既に別のロールの場合は付け替える
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} request - 実行ユーザのセッションデータ
 * @param {string} userId - 設定したいユーザのID
 * @param {string} roleId - 設定するロールのID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
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

/**
 * getRights
 *
 * 5 権限参照
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - 実行ユーザのセッションデータ
 * @param {string} userId - 設定したいユーザのID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
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

/**
 * createPolicy
 *
 * 6.1 ポリシー更新
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - 実行ユーザのセッションデータ
 * @param  {string} policyID 作成するポリシーID
 * @param  {string} policyTID 作成するポリシーTID
 * @param  {object} translations { "ja": "none", "en": "none" } のようなポリシー名
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
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

/**
 * createRight
 *
 * 6.2 権限更新
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - 実行ユーザのセッションデータ
 * @param  {string} policyID 作成するポリシーID
 * @param  {string} action 機能名称（DBスキーマー：action）
 * @param  {string} resource リソースID（ルームID）
 * @param  {string} condition 作成する権限の condition
 * @param  {boolean} enableFlag 作成する権限の enable_flag
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
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

/**
 * assignPolicyToUsers
 *
 * 7 ポリシー紐付
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - 実行ユーザのセッションデータ
 * @param  {array} userIDs ユーザーのIDリスト配列
 * @param  {string} policyID 作成するポリシーID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
function assignPolicyToUsers(system_uuid, session, userIDs, policyID) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        //エラーになったユーザーIDはエラーレスポンスの生成と共に行うため
        //controller.js内で処理になる。
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

/**
 * getUserPoliciesByResource,
 *
 * 8 リソース関連ユーザー情報参照
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - 実行ユーザのセッションデータ
 * @param  {string} resourceID 確認したいリソースID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
function getUserPoliciesByResource(system_uuid, session, resourceID) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        //const bywho = session.getLoginAccout();
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

/**
 * unassignPolicyFromUser
 *
 * 9 ポリシー紐づけ解除
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - 実行ユーザのセッションデータ
 * @param  {array} userIDs userID 切り離されるユーザIDのリスト
 * @param  {string} policyID 切り離すポリシーID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
function unassignPolicyFromUser(system_uuid, session, userIDs, policyID) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        //const bywho = session.getLoginAccout();
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

/**
 * checkUserHavePolicy
 *
 * 10 ユーザー権限保持チェック
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - 実行ユーザのセッションデータ
 * @param  {string} userID - 権限有無を確認する対象のユーザ
 * @param  {array} action   - 確認したい権限名
 * @param  {array} resource - 確認したいリソースID（null指定可）
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
function checkUserHavePolicy(system_uuid, session, userID, action, resource) {
    return new Promise((resolve, reject) => {
        if (! session ||! session.getLoginAccout ||
            typeof session.getLoginAccout !== 'function' ||
            !_.isString(session.getLoginAccout()) ||
            session.getLoginAccout().length <= 0) {
            reject(false);
        }
        //const bywho = session.getLoginAccout();
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

/**
 * deleteRightPolicyOfResource
 *
 * 11 ルームに紐付された権限とポリシーを削除
 *
 * @param  {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - 実行ユーザのセッションデータ
 * @param  {array} resource - 確認したいリソースID（null指定可）
 *
 * @return {promise} 正常に更新できた場合はresolve, 失敗した場合はreject
 */
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
