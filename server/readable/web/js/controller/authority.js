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
class AuthorityManager {
    constructor(){

    }
    getRoleAssignmentForUser(userName){
        return new Promise((resolve, reject) => {
            let _self = this;
            if(userName == null || typeof userName != 'string') {
                reject(false);
                return;
            }
            CubeeServerConnector.getInstance().getRoleAssignmentForUser(userName)
            .then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            });
        });
    };

    getRights(userName) {
        return new Promise((resolve, reject) => {
            let _self = this;
            if(userName == null || typeof userName != 'string') {
                reject(false);
                return;
            }
            CubeeServerConnector.getInstance().getRights(userName)
            .then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            })
        })
    };

    createPolicy(policy_id, policy_tid, translations){
        return new Promise((resolve, reject) => {
            let _self = this;
            if(policy_id == null || typeof policy_id != 'string') {
                reject(false);
                return;
            }
            if(policy_tid == null || typeof policy_tid != 'string') {
                reject(false);
                return;
            }
            if(translations == null || typeof translations != 'object') {
                reject(false);
                return;
            }
            let userName = LoginUser.getInstance().getLoginAccount();
            CubeeServerConnector.getInstance().createPolicy(userName, policy_id, policy_tid, translations)
            .then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            })
        })
    }
    createRight(policy_id, action, resource_id){
        return new Promise((resolve, reject) => {
            let _self = this;
            if(policy_id == null || typeof policy_id != 'string') {
                reject(false);
                return;
            }
            if(action == null || typeof action != 'string') {
                reject(false);
                return;
            }
            if(resource_id == null || typeof resource_id != 'string') {
                reject(false);
                return;
            }
            CubeeServerConnector.getInstance().createRight(policy_id, action, resource_id)
            .then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            })
        })
    }
    assignPolicyToUser(policy_id, users){
        return new Promise((resolve, reject) => {
            let _self = this;
            if(policy_id == null || typeof policy_id != 'string') {
                reject(false);
                return;
            }
            if(users == null || typeof users != 'object') {
                reject(false);
                return;
            }
            CubeeServerConnector.getInstance().assignPolicyToUser(policy_id, users)
            .then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            })
        })
    }
    getUserPoliciesByResource(resource_id){
        return new Promise((resolve, reject) => {
            let _self = this;
            if(resource_id == null || typeof resource_id != 'string') {
                reject(false);
                return;
            }
            CubeeServerConnector.getInstance().getUserPoliciesByResource(resource_id)
            .then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            })
        })
    }
    unassignPolicyFromUser(users, policy_id){
        return new Promise((resolve, reject) => {
            let _self = this;
            if(users == null || typeof users != 'object') {
                reject(false);
                return;
            }
            if(policy_id == null || typeof policy_id != 'string') {
                reject(false);
                return;
            }
            CubeeServerConnector.getInstance().unassignPolicyFromUser(users, policy_id)
            .then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            })
        })
    }
};

try {
  module.exports = AuthorityManager
} catch(e){
}
