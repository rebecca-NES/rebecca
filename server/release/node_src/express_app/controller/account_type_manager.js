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
'use strict'

var authority_api = require('../../scripts/controller/authority/cubee_authority_api');
var authControl = require('../../scripts/controller/authority/controller');
var ServerLog = require('../../scripts/controller/server_log');
var utils = require('../../scripts/utils');
var sessionDataMannager = require('../../scripts/controller/session_data_manager').getInstance()
const _ = require('underscore');
var _log = ServerLog.getInstance();

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
