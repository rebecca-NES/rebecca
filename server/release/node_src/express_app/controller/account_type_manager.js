'use strict'

var authority_api = require('../../scripts/controller/authority/cubee_authority_api');
var authControl = require('../../scripts/controller/authority/controller');
var ServerLog = require('../../scripts/controller/server_log');
var utils = require('../../scripts/utils');
var sessionDataMannager = require('../../scripts/controller/session_data_manager').getInstance()
const _ = require('underscore');
var _log = ServerLog.getInstance();

/**
 * getRoleList
 *
 * ロール一覧情報を返却する
 *
 * <pre>
 * {
 *    "<role_id>" : "<role_name>",
 *    "<role_id>" : "<role_name>",
 *    ...
 * } </pre>
 * @param {string} accessToken アクセストークン
 * @return {object} ロール一覧情報
 */
function getRoleList(accessToken){
    return new Promise(function(resolve, reject){
        var session = sessionDataMannager.get(accessToken);
        var system_uuid = session.getTenantUuid();
        authControl.listRoles(system_uuid, session)
            .then(function(res){
                if(_.has(res,"role")){
                    function extractRoleslist(response){
                        var res_roles = {};
                        for(let res of response.role){
                            res_roles[res["id"]] = res["t"]["ja"];
                        }
                        return res_roles;
                    }
                    resolve(extractRoleslist(res));
                }else{
                    reject({result: false, reason: 404000, err: res});
                }
            }).catch(function(err){
                reject({result: false, reason: 500000 ,err: err});
            })
    })
}

/**
 * assignRoleToUser
 *
 * ロールを指定されたユーザに対して紐づける。
 * 別のロールの場合は付け替える。
 *
 * <pre>
 * {
 *    result : true,
 *    reason : 2000000,
 * } </pre>
 * @param {string} accessToken アクセストークン
 * @param {string} role ロールID
 * @param {string} userId ユーザID
 *
 * @return {promise}
 */
function assignRoleToUser(accessToken, role, userId){
  return new Promise(function(resolve, reject){
    var params = {
      user_id: userId,
      role_id: role
    };
    var session = sessionDataMannager.get(accessToken);
    var system_uuid = session.getTenantUuid();
    authControl.assignRoleToUser(system_uuid, session, params)
    .then(function(res){
      resolve(res);
    }).catch(function(err){
      reject(err);
    })
  })
}

/**
 * getRoleAssignmentForUser
 *
 * ユーザに対して紐づいているロール情報を取得する。
 * 別のロールの場合は付け替える。
 *
 * <pre>
 * {
 *    result : true,
 *    reason : 2000000,
 *    role:{
 *      id: "admin",
 *      t: {
 *        "ja": "管理者"
 *      }
 *    }
 * } </pre>
 * @param {string} accessToken アクセストークン
 * @param {string} userId ユーザID
 *
 * @return {promise}
 */
function getRoleAssignmentForUser(accessToken, userId){
    return new Promise(function(resolve, reject){
        var session = sessionDataMannager.get(accessToken);
        var system_uuid = session.getTenantUuid();
        authControl.getRoleAssignmentForUser(system_uuid, session, userId)
            .then(function(res){
                resolve(res);
            }).catch(function(err){
                reject(err);
            })
    })
}

exports.getRoleList = getRoleList;
exports.assignRoleToUser = assignRoleToUser;
exports.getRoleAssignmentForUser = getRoleAssignmentForUser;
