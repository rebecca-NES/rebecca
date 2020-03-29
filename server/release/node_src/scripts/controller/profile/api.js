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
const Log = require('../server_log').getInstance();
const API_STATUS = require('../const').API_STATUS;
const ReadCacheBeforeDBChef = require('../../lib/CacheHelper/read_cache_before_db_chef');
const TenantData = require('../../lib/CacheHelper/tenant_data');
const TenantXmppData = require('../../lib/CacheHelper/tenant_xmpp_data');
const Utils = require('../../utils');
const validation = require('../validation');

const ERROR_PASSWORD_CHARACTER_TYPE = 4;
const ERROR_INCORRECT_OLD_PASSWORD = 8;
const ERROR_PASSWORD_LENGTH = 16;

exports.doBeforeChangePassword = (system_uuid, session, _content) => {
    return new Promise((resolve, reject) => {
        if(!_.has(_content, 'oldPassword')||
           !_.has(_content, 'newPassword')
        ){
            Log.connectionLog(6, 'profile.api.doBeforeChangePassword invalid parameter');
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        const oldPassword = _content.oldPassword,
                newPassword = _content.newPassword;

        getTenantNameFromCache(system_uuid)
        .then((tenantName) => {
            Log.connectionLog(7, 'profile.api.doBeforeChangePassword got tenantName: ' + tenantName);
            return getTenantConfFromCache(tenantName);
        })
        .then((tenantConf) => {
            Log.connectionLog(7, 'profile.api.doBeforeChangePassword got tenantConf: ' + JSON.stringify(tenantConf));
            let _haveToCheckPassword = true;
            if (tenantConf != null && typeof tenantConf == 'object') {
                if (_.has(tenantConf, 'disclosable') && _.has(tenantConf.disclosable, 'ldap')) {
                    if (_.has(tenantConf.disclosable.ldap, 'ldapEnable')) {
                        if (tenantConf.disclosable.ldap.ldapEnable == true) {
                            _haveToCheckPassword = false;
                            if (_.has(tenantConf.disclosable.ldap, 'ldapUpdatable')) {
                                if (tenantConf.disclosable.ldap.ldapUpdatable == false) {
                                    Log.connectionLog(6, 'profile.api.doBeforeChangePassword ldapUpdatable is true');
                                    reject({result: false, reason: API_STATUS.BAD_REQUEST});
                                    return;
                                }
                            }
                        }
                    }
                }
            }
            if (_haveToCheckPassword) {
                let hexedPassword = session.getPassword();
                let checkRes = checkChangingPassword(hexedPassword, oldPassword, newPassword, tenantConf);
                if (checkRes != 0) {
                    Log.connectionLog(6, 'profile.api.doBeforeChangePassword checkChangingPassword result false');
                    reject({result: false, reason: checkRes});
                    return;
                }
            }
            resolve();
            return;
        })
        .catch((error) => {
            Log.connectionLog(6, 'profile.api.doBeforeChangePassword catch error' + JSON.stringify(error));
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        });
    });
};

function checkChangingPassword(hexedPassword, oldPassword, newPassword, tenantConf) {
    const _passwordLength_min = 8;
    const _passwordLength_max = 32;
    if (Utils.md5Hex(oldPassword) != hexedPassword) {
        Log.connectionLog(4, 'oldPassword is different');
        return ERROR_INCORRECT_OLD_PASSWORD;

    } else if ( newPassword.length < _passwordLength_min ||
                newPassword.length > _passwordLength_max){
        Log.connectionLog(4, 'newPassword-length too short or long');
        return ERROR_PASSWORD_LENGTH;

    } else if (!validation.passwordValidationCheck(newPassword,true)){
        Log.connectionLog(4, 'newPassword has two bytes character');
        return ERROR_PASSWORD_CHARACTER_TYPE;
    }
    let _ret = validation.checkComplexity(newPassword, tenantConf);
    if (_ret != 0) {
        return _ret;
    }

    return 0;
}

exports.doBeforeUpdateProfile = (system_uuid, session, _content) => {
    return new Promise((resolve, reject) => {
        if ( (! _.has(_content, 'nickName') || _.isEmpty(_content.nickName) ) &&
             (! _.has(_content, 'mailAddress') || _.isEmpty(_content.mailAddress) )
        ) {
            Log.connectionLog(7, 'profile.api.doBeforeUpdateProfile no need to see tenant_store.conf.');
            resolve();
            return;
        }

        getTenantNameFromCache(system_uuid)
        .then((tenantName) => {
            Log.connectionLog(7, 'profile.api.doBeforeUpdateProfile got tenantName: ' + tenantName);
            return getTenantConfFromCache(tenantName);
        })
        .then((tenantConf) => {
            Log.connectionLog(7, 'profile.api.doBeforeUpdateProfile got tenantConf: ' + JSON.stringify(tenantConf));
            if (tenantConf != null && typeof tenantConf == 'object') {
                if (_.has(tenantConf, 'disclosable') && _.has(tenantConf.disclosable, 'ldap')) {
                    if (tenantConf.disclosable.ldap.ldapEnable == true && _.has(tenantConf.disclosable.ldap, 'ldapUpdatable')) {
                        if (tenantConf.disclosable.ldap.ldapUpdatable == false) {
                            Log.connectionLog(6, 'profile.api.doBeforeUpdateProfile ldapUpdatable is true');
                            reject({result: false, reason: API_STATUS.BAD_REQUEST});
                            return;
                        }
                    }
                }
            }
            resolve();
            return;
        })
        .catch((error) => {
            Log.connectionLog(6, 'profile.api.doBeforeUpdateProfile catch error' + JSON.stringify(error));
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
        });
    });
};

function getTenantNameFromCache(system_uuid) {
    return new Promise((resolve, reject) => {

        let _tenantXmppData = TenantXmppData.createAsOrder(system_uuid);
        let _chef = ReadCacheBeforeDBChef.getInstance();

        _chef.cook(_tenantXmppData, (err, dish) => {
            if (err) {
                Log.connectionLog(4, `profile.api.getTenantNameFromCache faild: ${err}`);
                reject();
                return;
            }
            if (!dish) {
                Log.connectionLog(4, `profile.api.getTenantNameFromCache faild: dish is null`);
                reject();
                return;
            }
            Log.connectionLog(7, `profile.api.getTenantNameFromCache got tenantName from cache`);
            resolve(dish.getTenantName());
        });
    });
}

function getTenantConfFromCache(tenantName) {
    return new Promise((resolve, reject) => {
        Log.connectionLog(7, `profile.api.getTenantConfFromCache in: ${tenantName}`);

        let _tenantData = TenantData.createAsOrder(tenantName);
        let _chef = ReadCacheBeforeDBChef.getInstance();

        _chef.cook(_tenantData, (err, dish) => {
            if (err) {
                Log.connectionLog(4, `profile.api.getTenantConfFromCache faild: ${err}`);
                reject();
                return;
            }
            if (!dish) {
                Log.connectionLog(4, `profile.api.getTenantConfFromCache faild: dish is null`);
                reject();
                return;
            }
            Log.connectionLog(7, `profile.api.getTenantConfFromCache got tenantConf from cache`);
            resolve(dish.getTenantConf());
        });
    });
}

