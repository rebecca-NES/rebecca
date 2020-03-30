/**
 * プロファイルのnode内からも使うAPI
 * Webからはweb_apiが口になり、このファイルの上位
 *
 * @module src/scripts/controller/profile/api
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

/**
 * パスワードの変更の前に、チェックを行う
 * @param  {string} system_uuid テナントUUID
 * @param  {object} session     SessionData
 * @param  {object} _content    request の content
 * @return {function}           チェックを行う Promise 関数を返却する
 */
exports.doBeforeChangePassword = (system_uuid, session, _content) => {
    return new Promise((resolve, reject) => {
        // パラメータのチェック
        if(!_.has(_content, 'oldPassword')||
           !_.has(_content, 'newPassword')
        ){
            Log.connectionLog(6, 'profile.api.doBeforeChangePassword invalid parameter');
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        // パラメータの確保
        const oldPassword = _content.oldPassword,
                newPassword = _content.newPassword;

        // キャッシュからテナント名を取得
        //modules.export.getTenantNameFromCache(system_uuid)
        getTenantNameFromCache(system_uuid)
        .then((tenantName) => {
            Log.connectionLog(7, 'profile.api.doBeforeChangePassword got tenantName: ' + tenantName);
            // キャッシュからテナント設定を取得
            //return modules.export.getTenantConfFromCache(tenantName);
            return getTenantConfFromCache(tenantName);
        })
        .then((tenantConf) => {
            Log.connectionLog(7, 'profile.api.doBeforeChangePassword got tenantConf: ' + JSON.stringify(tenantConf));
            // LDAP データ連携がありの場合、パスワードのチェックをスルーする
            // LDAP データ更新可否が不可の場合、ここで失敗を返却する
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
                // パスワードのチェック
                let hexedPassword = session.getPassword();
                //let checkRes = modules.export.checkChangingPassword(hexedPassword, oldPassword, newPassword);
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

/**
 * 新旧のパスワードのチェックを行う
 * @param  {string} hexedPassword sessionData に持っている、md5ハッシュしたパスワード
 * @param  {string} oldPassword   API の request でわたってきた古い方のパスワード
 * @param  {string} newPassword   API の request でわたってきた新しい方のパスワード
 * @param  {object} tenantConf    キャッシュから取得したテナント情報
 * @return {int}                  チェック結果（0: 問題なし。それ以外: そのままresponseのreasonに使用する）
 */
function checkChangingPassword(hexedPassword, oldPassword, newPassword, tenantConf) {
    const _passwordLength_min = 8;
    const _passwordLength_max = 32;
    // 変更前パスワードが正しいか確認
    if (Utils.md5Hex(oldPassword) != hexedPassword) {
        // パスワードが異なるので失敗
        Log.connectionLog(4, 'oldPassword is different');
        return ERROR_INCORRECT_OLD_PASSWORD;

    } else if ( newPassword.length < _passwordLength_min ||
                newPassword.length > _passwordLength_max){
        // パスワードが短いor長い
        Log.connectionLog(4, 'newPassword-length too short or long');
        return ERROR_PASSWORD_LENGTH;

    } else if (!validation.passwordValidationCheck(newPassword,true)){
        // 全角文字が含まれている
        // passwordValidationCheck ではパスワード長のチェックも行っているが、
        // 上段で実施しているため、実質文字チェックのみを実施
        Log.connectionLog(4, 'newPassword has two bytes character');
        return ERROR_PASSWORD_CHARACTER_TYPE;
    }
    // 複雑性チェック
    let _ret = validation.checkComplexity(newPassword, tenantConf);
    if (_ret != 0) {
        return _ret;
    }

    return 0;
}

/**
 * プロファイルの変更の前に、チェックを行う
 * @param  {string} system_uuid テナントUUID
 * @param  {object} session     SessionData
 * @param  {object} _content    request の content
 * @return {function}           チェックを行う Promise 関数を返却する
 */
exports.doBeforeUpdateProfile = (system_uuid, session, _content) => {
    return new Promise((resolve, reject) => {
        // パラメータの確保
        if ( (! _.has(_content, 'nickName') || _.isEmpty(_content.nickName) ) &&
             (! _.has(_content, 'mailAddress') || _.isEmpty(_content.mailAddress) )
        ) {
            Log.connectionLog(7, 'profile.api.doBeforeUpdateProfile no need to see tenant_store.conf.');
            resolve();
            return;
        }

        // キャッシュからテナント名を取得
        getTenantNameFromCache(system_uuid)
        .then((tenantName) => {
            Log.connectionLog(7, 'profile.api.doBeforeUpdateProfile got tenantName: ' + tenantName);
            // キャッシュからテナント設定を取得
            return getTenantConfFromCache(tenantName);
        })
        .then((tenantConf) => {
            Log.connectionLog(7, 'profile.api.doBeforeUpdateProfile got tenantConf: ' + JSON.stringify(tenantConf));
            // LDAP データ更新可否が不可の場合、ここで失敗を返却する
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

/**
 * テナント名をキャッシュもしくはDBから取得する
 * @param  {string} system_uuid テナントUUID
 * @return {function}           Promise 関数を返却する
 */
function getTenantNameFromCache(system_uuid) {
    return new Promise((resolve, reject) => {

        // キャッシュもしくはDBから引き出すためのモデルを作成
        let _tenantXmppData = TenantXmppData.createAsOrder(system_uuid);
        let _chef = ReadCacheBeforeDBChef.getInstance();

        // キャッシュもしくはDBから引き出す
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
            // 取得できたテナント名を返却する
            resolve(dish.getTenantName());
        });
    });
}

/**
 * テナント設定をキャッシュもしくはDBから抜き出す
 * @param  {string} tenantName テナント名（例：spf）
 * @return {function}          Promise関数を返却する。
 */
function getTenantConfFromCache(tenantName) {
    return new Promise((resolve, reject) => {
        Log.connectionLog(7, `profile.api.getTenantConfFromCache in: ${tenantName}`);

        // キャッシュもしくはDBから引き出すためのモデルを作成
        let _tenantData = TenantData.createAsOrder(tenantName);
        let _chef = ReadCacheBeforeDBChef.getInstance();

        // キャッシュもしくはDBから引き出す
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
            // 取得できたテナント設定を返却する
            resolve(dish.getTenantConf());
        });
    });
}

// UT実行のためエクスポート
//exports.checkChangingPassword = checkChangingPassword;
//exports.getTenantNameFromCache = getTenantNameFromCache;
//exports.getTenantConfFromCache = getTenantConfFromCache;
