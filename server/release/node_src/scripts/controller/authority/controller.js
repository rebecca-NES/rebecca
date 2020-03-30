/**
 * Cubee Authority API interface module
 * @module  src/scripts/controller/auhority/controller
 */

'use strict';

const _ = require('underscore');

const authorityManager = require('../../Authority/authority_api');

const NotifyAuthorityChanged = require('../notificate/notify_authority_changed');

const LOG = require('../server_log').getInstance();
const API_REQUEST = require('../const').API_REQUEST;
const API_STATUS = require('../const').API_STATUS;

/**
 * 1. ロール一覧参照
 *
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {Object} session - リクエストを行ったユーザ情報
 *
 * @return {promise} データ取得が正常にできた場合はresolve, 失敗した場合はreject
 */
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

/**
 * 2. ロール詳細参照(id指定あり)
 *
  * @param {string} system_uuid - 権限管理を利用するシステムのUUID
  * @param {Object} session - リクエストを行ったユーザ情報
  * @param {string} userId - 取得したいユーザのID
  *
  * @return {promise} データ取得が正常にできた場合はresolve, 失敗した場合はreject
 */
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
                    //const _role = _.pick(res[userId].role, 'id', 't')
                    resolve(_.extend({result: true, reason: API_STATUS.SUCCESS}, {role: returnData[0]}));
                })
                .catch((err) => {
                    LOG.connectionLog(5, `detailRoles: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

 /**
  * getRoleAssignmentForUser
  *
  * 3. 指定ユーザのロール（アカウントタイプ）を取得する
  * <pre>
  * {
  *   result: true,
  *   reason: 0,
  *   role: {
  *     id: 'roleID',
  *     t: {
  *       ja: 'roleName'
  *     }
  *   }
  * }
  * </pre>
  * @param {string} system_uuid - 権限管理を利用するシステムのUUID
  * @param {Object} session - リクエストを行ったユーザ情報
  * @param {string} userId - 取得したいユーザのID
  *
  * @return {promise} データ取得が正常にできた場合はresolve, 失敗した場合はreject
  */
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

/**
 * assignRoleToUser
 *
 * 4. 指定したユーザにロール情報を設定する。既に別のロールの場合は付け替える
 * <pre>
 * {
 *   result: true,
 *   reason: 0
 * }
 * </pre>
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} params - 設定したいユーザのIDと設定するロールのID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
function assignRoleToUser(system_uuid, session, params={}) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'user_id') || typeof params.user_id != 'string' ||
            !_.has(params, 'role_id') || typeof params.role_id != 'string') {
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        } else {
            // ロール紐づけの前に、ユーザに紐づいているロールを確認する
            authorityManager.getRoleAssignmentForUser(system_uuid, session, params.user_id)
            .then((resGet) => {
                // 結果が空の場合、何もしない（ユーザの新規作成時）
                if (_.isEmpty(resGet)){
                // 変更前と変更後のロールが同一の場合、紐付処理は行わない
                } else if (params.role_id == _.pick(resGet[params.user_id].role, 'id', 't').id) {
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                    return;
                }
                authorityManager.assignRoleToUser(system_uuid, session, params.user_id, params.role_id)
                .then((res) => {
                    // WebSocket通知を行う
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

                    // アサインが成功した場合は、レスポンスはresultとreasonのみ
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

/**
 * getRights
 *
 * 5 権限参照
 * <pre>
 * {
 *   "rights": [
 *     {
 *       "action": "createCommunity",
 *       "resource": "grouchchat_y-nishizawa-tsvxo_8",
 *       "enable_flag": true
 *     },
 *     {
 *       "action": "manageCommunity",
 *       "enable_flag": true
 *     },
 *   ]
 * }
 * </pre>
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} params - 設定したいユーザのIDと設定するロールのID
 *
 * @return {promise} 正常に更新できた場合はresolve, 失敗した場合はreject
 */
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
                    //404 or 403
                    LOG.connectionLog(5, `.getRights: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

 /**
  * createPolicy
  *
  * 6.1 ポリシー更新
  * <pre>
  * {
  *   result: true,
  *   reason: 200000
  * }
  * </pre>
  * @param {string} system_uuid - 権限管理を利用するシステムのUUID
  * @param {object} session - リリクエストを行ったユーザ情報
  * @param {object} params - 設定したいユーザのIDと設定するロールのID
  *
  * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
  */
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
                    // アサインが成功した場合は、レスポンスはresultとreasonのみ
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    //404 or 403
                    LOG.connectionLog(5, `.createPolicy: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

/**
 * createRight
 *
 * 6.2 権限更新
 * <pre>
 * {
 *   result: true,
 *   reason: 200000
 * }
 * </pre>
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} params - 設定したいユーザのIDと設定するロールのID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
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
                    // アサインが成功した場合は、レスポンスはresultとreasonのみ
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.createRight: ${JSON.stringify(err)}`);
                    reject({result: false, reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                });
        }
    });
}

/**
 * assignPolicyToUsers
 *
 * 7 ポリシー紐付
 * <pre>
 * {
 *   result: true,
 *   reason: 200000
 * }
 * </pre>
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} params - 設定したいユーザのIDと設定するロールのID
 * @param {string} triger - create or update デフォルトはupdate。権限変更が実施された場合の処理を記載。通知にのせる。
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
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
                    // WebSocket通知を行う
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
                    // DBからのレスポンスresを使ってAPIが返すJsonをここで生成
                    // ここは「true」が入る
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.assignPolicyToUsers: ${JSON.stringify(err)}`);
                    //
                    if(_.has(err,"extra") && _.isArray(err.extra) &&
                       err.extra.length > 0){
                        //ユーザ個別でエラーになった場合
                        // WebSocket通知を行う。ただし、成功したユーザのみ
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
                        //error_usersに配列で入る
                        reject({
                            result: false,
                            reason: API_STATUS.NOT_FOUND,
                            error_users: err.extra
                        });
                    }else{
                        //権限登録でユーザ個別のエラーでない場合
                        reject({result: false,reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                    }
                });
        }
    });
}

/**
 * getUserPoliciesByResource
 *
 * 8 リソース関連ユーザー情報参照
 *
 * <pre>
 *
 *{
 *  "users": [
 *    {
 *      "user_id": "1",
 *      "policies": [
 *         {
 *           "id": "policyID",
 *            "rights": [
 *               {
 *                 "action": "action",
 *                  "enable_flag": true
 *                }
 *           ]
 *        }
 *      ]
 *    }
 *  ],
 *  "result": true,
 *  "reason": 200000
 *}
 *
 * </pre>
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} params - 設定したいユーザのIDと設定するロールのID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
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
                    // DBからのレスポンスresを使ってAPIが返すJsonをここで生成
                    let _res = [];
                    for(let re of res){
                        //
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

/**
 * unassignPolicyFromUser
 *
 * 9 ポリシー紐づけ解除
 * <pre>
 * {
 *   result: true,
 *   reason: 200000
 * }
 * </pre>
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} params - 設定したいユーザのIDと設定するロールのID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
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
                    // WebSocket通知を行う
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
                    // DBからのレスポンスresを使ってAPIが返すJsonをここで生成
                    // ここは「true」が入る
                    resolve({result: true, reason: API_STATUS.SUCCESS});
                })
                .catch((err) => {
                    LOG.connectionLog(5, `.unassignPolicyFromUser: ${JSON.stringify(err)}`);
                    if(_.isArray(err["extra"]) &&
                       err["extra"].length > 0){
                        //ユーザ個別でエラーになった場合
                        // WebSocket通知を行う。ただし、成功したユーザのみ
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
                        // error_usersに配列で入る
                        reject({
                            result: false,
                            reason: API_STATUS.NOT_FOUND,
                            error_users: err.extra
                        });
                    }else{
                        //権限登録でユーザ個別のエラーでない場合
                        reject({result: false,reason: API_STATUS.INTERNAL_SERVER_ERROR, code: err.code});
                    }
                });
        }
    });
}

/**
 * checkUserHavePolicy
 *
 * 10 ユーザー権限保持チェック
 * <pre>
 * {
 *   result: true,
 *   reason: 200000
 * }
 * </pre>
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} params - 設定したいユーザのIDと設定するロールのID
 *
 * @return {promise} 正常に行進できた場合はresolve, 失敗した場合はreject
 */
function checkUserHavePolicy(system_uuid, session, params={}) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            !_.has(params, 'user_id') ||
            typeof params.user_id != 'string' ||
            !_.has(params, 'action') ||
            typeof params.action != 'string' ||
            // resource  確認したいリソースID（null指定可)
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

/**
 * deleteRightPolicyOfResource
 *
 * 11 ルームに紐付された権限とポリシーを削除
 * <pre>
 * {
 *   result: true,
 *   reason: 200000
 * }
 * </pre>
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} params:{
 *                    resource: - ポリシー、権限を削除したいリソースID（ルームID）
 *                 }
 *
 * @return {promise} 正常に更新できた場合はresolve, 失敗した場合はreject
 */
function deleteRightPolicyOfResource(system_uuid, session, params={}) {
    return new Promise((resolve, reject) => {
        if (!system_uuid || !params ||
            // resource  削除したいリソースID
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
