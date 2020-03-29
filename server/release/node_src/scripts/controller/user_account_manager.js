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
(function() {
    var GlobalSNSManagerDbConnector = require('../lib/DbHelper/global_sns_manager_db_connector');
    var UserAccountData = require('../model/user_account_data');
    var ServerLog = require('./server_log');
    var Utils = require('../utils');
    var SynchronousBridgeNodeXmpp = require('./synchronous_bridge_node_xmpp');
    var Conf = require('./conf');
    var XmppUtils = require('./xmpp_utils');
    var ReadCacheBeforeDBChef = require('../lib/CacheHelper/read_cache_before_db_chef');
    var TenantXmppData = require('../lib/CacheHelper/tenant_xmpp_data');

    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();


    function UserAccountManager() {
    };

    var COLUMN_ID_NAME = "id";
    var COLUMN_TENANT_UUID = "tenant_uuid";
    var COLUMN_LOGIN_ACCOUNT_NAME = "login_account";
    var COLUMN_OPENFIRE_ACCOUNT_NAME = "openfire_account";
    var COLUMN_XMPP_SERVER_NAME = "xmpp_server_name";
    var COLUMN_UPDATE_TIME_NAME = "update_time";
    var COLUMN_DELETE_FLG_NAME = "delete_flg";
    var COLUMN_MAILADDRESS_NAME = "mailaddress";

    var LOGIN_ACCOUNT_NAME_MAX_LENGTH = 252;

    var PASSWORD_MIN_SIZE = 8;
    var PASSWORD_MAX_SIZE = 32;

    var _proto = UserAccountManager.prototype;

    _proto.getUserAccountDataByTenantLoginAccount = function(tenantUuid, loginAccount, onGetUserAccountDataCallBack) {
        if(tenantUuid == null || typeof tenantUuid != 'string') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataByTenantLoginAccount tenantUuid is invalid');
            return false;
        }
        if(loginAccount == null || typeof loginAccount != 'string') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataByTenantLoginAccount loginAccount is invalid');
            return false;
        }
        if(onGetUserAccountDataCallBack == null || typeof onGetUserAccountDataCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataByTenantLoginAccount onGetUserAccountDataCallBack is invalid');
            return false;
        }
        var _self = this;
        return GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);

        function _onGetConnectionCallBack(err, connection){
            if(err){
                _log.connectionLog(3,'UserAccountManager#getUserAccountDataByTenantLoginAccount : ' + err.name + ": " + err.message);
                onGetUserAccountDataCallBack(err, null);
                return;
            }
            var _sql = 'SELECT * FROM user_account_store WHERE login_account = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(loginAccount);
            _sql += ' AND tenant_uuid = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(tenantUuid);
            _log.connectionLog(7,'UserAccountManager#getUserAccountDataByTenantLoginAccount _sql : ' + _sql);
            connection.query(_sql,_onGetUserAccountData);

            function _onGetUserAccountData(err, result){
                connection.end(function(endErr){
                    if(endErr){
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataByTenantLoginAccount : DB disconect err :: ' + endErr);
                    }
                    if(err){
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataByTenantLoginAccount : ' + err.name + ": " + err.message);
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataByTenantLoginAccount _sql : ' + _sql);
                        onGetUserAccountDataCallBack(err, null);
                        return;
                    }
                    var _userAcountData = null;
                    if(result && result.length > 0){
                        _log.connectionLog(7,'UserAccountManager#getUserAccountDataByTenantLoginAccount : data nume');
                        _userAcountData = UserAccountData.create(result[0]);
                    }
                    onGetUserAccountDataCallBack(null, _userAcountData);
                });
            }
        }
    };

    _proto.getUserAccountDataByOFAccountAndXmppServerName = function(openfireAccount, xmppServerName, onGetUserAccountDataCallBack) {
        if(openfireAccount == null || typeof openfireAccount != 'string' || openfireAccount == '') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataByOFAccountAndXmppServerName openfireAccount is invalid');
            return false;
        }
        if(xmppServerName == null || typeof xmppServerName != 'string' || xmppServerName == '') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataByOFAccountAndXmppServerName xmppServerName is invalid');
            return false;
        }
        if(onGetUserAccountDataCallBack == null || typeof onGetUserAccountDataCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataByOFAccountAndXmppServerName onGetUserAccountDataCallBack is invalid');
            return false;
        }
        var _self = this;
        var _serchList = new Array();
        var _serchData = {};
        _serchData.openfire_account = openfireAccount;
        _serchData.xmpp_server_name = xmppServerName;
        _serchList[0] = _serchData;
        return _self.getUserAccountDataListByOFAccountAndXmppServerName(_serchList, _onGetUserAccountDataCallBackFunc);

        function _onGetUserAccountDataCallBackFunc(err, _userAcountDataList){
            if(err){
                _log.connectionLog(3,'UserAccountManager#getUserAccountDataByOFAccountAndXmppServerName : ' + err.name + ": " + err.message);
                _log.connectionLog(3,'UserAccountManager#getUserAccountDataByOFAccountAndXmppServerName _sql : ' + _sql);
                onGetUserAccountDataCallBack(err, null);
                return;
            }
            var _userAcountData = null;
            if(_userAcountDataList && _userAcountDataList.length > 0){
                _userAcountData = _userAcountDataList[0];
            }
            onGetUserAccountDataCallBack(null, _userAcountData);
        }
    };
    _proto.getUserAccountDataListByOFAccountAndXmppServerName = function(searchList, onGetUserAccountDataCallBack) {
        if(searchList == null || !(searchList instanceof Array)) {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataListByOFAccountAndXmppServerName searchList is invalid');
            return false;
        }
        if(onGetUserAccountDataCallBack == null || typeof onGetUserAccountDataCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataListByOFAccountAndXmppServerName onGetUserAccountDataCallBack is invalid');
            return false;
        }
        var _self = this;

        if(searchList.length == 0){
            onGetUserAccountDataCallBack(null, []);
            return;
        }

        return GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);

        function _onGetConnectionCallBack(err, connection){
            if(err){
                _log.connectionLog(3,'UserAccountManager#getUserAccountDataListByOFAccountAndXmppServerName : ' + err.name + ": " + err.message);
                onGetUserAccountDataCallBack(err, null);
                return;
            }
            var _sql = 'SELECT * FROM user_account_store WHERE ' + _createWhereString(searchList);
            connection.query(_sql,_onGetUserAccountData);

            function _onGetUserAccountData(err, result){
                connection.end(function(endErr){
                    if(endErr){
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataListByOFAccountAndXmppServerName : DB disconect err :: ' + endErr.name + ": " + endErr.message);
                    }
                    if(err){
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataListByOFAccountAndXmppServerName : ' + err.name + ": " + err.message);
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataListByOFAccountAndXmppServerName _sql : ' + _sql);
                        onGetUserAccountDataCallBack(err, null);
                        return;
                    }
                    var _userAcountDataList = new Array();
                    if(result && result.length > 0){
                        var _count = result.length;
                        for(var _i = 0; _i < _count; _i++){
                            _userAcountDataList[_i] = UserAccountData.create(result[_i]);
                        }
                    }
                    if(_userAcountDataList.length == 0){
                        _userAcountDataList = null;
                    }
                    onGetUserAccountDataCallBack(null, _userAcountDataList);
                });
            }
        }

        function _createWhereString(searchList){
            if(searchList == null || !(searchList instanceof Array)) {
                _log.connectionLog(3, 'UserAccountManager#getUserAccountDataListByOFAccountAndXmppServerName#_createWhereString searchList is invalid');
                return null;
            }
            var _count = searchList.length;
            var _ret = '';
            for(var _i = 0; _i < _count; _i++){
                var _searchData = searchList[_i];
                var _openfireAccount = GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_searchData.openfire_account);
                var _xmppServerName = GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_searchData.xmpp_server_name);
                if(_i >= 1){
                    _ret += ' OR ';
                }
                _ret += '( openfire_account = ' + _openfireAccount + ' AND xmpp_server_name = ' + _xmppServerName +' )';
            }
            return _ret;
        }
    };
    _proto.getUserListCountForAdmintool = function(sessionData, tenantId, except, onSelectDelUsrFlg, onGetUserListCountCallBack) {
        if(sessionData == null || typeof sessionData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#getUserListCountForAdmintool sessionData is invalid');
            return false;
        }
        if (except == null || typeof except != 'object') {
            _log.connectionLog(3, 'UserAccountManager#getUserListCountForAdmintool :: except is invalid');
            return false;
        }
        var _onSelectDelUsrFlg = true;
        if (onSelectDelUsrFlg == false) {
            _onSelectDelUsrFlg = onSelectDelUsrFlg;
        }
        if(onGetUserListCountCallBack == null || typeof onGetUserListCountCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#getUserListCountForAdmintool onGetUserListCountCallBack is invalid');
            return false;
        }
        var _self = this;
        var _tenantAdminUserAccount = sessionData.getLoginAccout();
        var _xmppServerName = null;
        _getXmppServerName(sessionData.getTenantUuid(), _tenantAdminUserAccount, _onGetXmppServerNameFromCache);

        function _onGetXmppServerNameFromCache(err, xmppServerName) {
            if (err) {
                _log.connectionLog(3,'UserAccountManager#getUserListCountForAdmintool _onGetXmppServerNameFromCache : ' + err.name + ": " + err.message);
                onGetUserListCountCallBack(err, null);
                return;
            }
            _xmppServerName = xmppServerName;

            return GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);
        }

        function _onGetConnectionCallBack(err, connection){
            if(err){
                _log.connectionLog(3,'UserAccountManager#getUserListCountForAdmintool : ' + err.name + ": " + err.message);
                onGetUserListCountCallBack(err, null, null);
                return;
            }

            var _sql = 'SELECT count(1) as cnt , count(delete_flg = 0 or null) as cnt_del FROM user_account_store WHERE ';
            if (_onSelectDelUsrFlg == false) {
                _sql = _sql + 'delete_flg = 0 and ';
            }
            if(tenantId != null) {
                _sql = _sql + 'tenant_uuid = \'' + tenantId + '\' and ';
            }
            _sql = _sql + 'xmpp_server_name = '
                + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_xmppServerName);
            if(except.length > 0) {
                _sql = _sql + ' and (';
                for(var _i = 0; _i < except.length; _i++) {
                    if(_i != 0 ) {
                        _sql = _sql + ' and '
                    }
                    _sql = _sql + 'openfire_account<>\''+ except[_i] +'\'';
                }
                _sql = _sql + ')';
            }
            _log.connectionLog(7,'UserAccountManager#getUserListCountForAdmintool : sql is \'' + _sql + '\'');
            connection.query(_sql,_onGetUserListCount);

            function _onGetUserListCount(err, result){
                connection.end(function(endErr){
                    if(endErr){
                        _log.connectionLog(3,'UserAccountManager#getUserListCountForAdmintool : DB disconect err :: ' + endErr.name + ": " + endErr.message);
                    }
                    if(err){
                        _log.connectionLog(3,'UserAccountManager#getUserListCountForAdmintool : ' + err.name + ": " + err.message);
                        _log.connectionLog(3,'UserAccountManager#getUserListCountForAdmintool _sql : ' + _sql);
                        onGetUserListCountCallBack(err, null, null);
                        return;
                    }
                    var _userAcountCount = null;
                    var _userAcountCount_NotDelete = null;
                    if(result && result.length > 0){
                        _userAcountCount = result[0].cnt;
                        _userAcountCount_NotDelete = result[0].cnt_del;
                    }
                    onGetUserListCountCallBack(null, _userAcountCount, _userAcountCount_NotDelete);
                });
            }
        }
    };
    _proto.getUserListForAdmintool = function(sessionData, tenantId, except, start, count, onSelectDelUsrFlg, onGetUserListCallBack) {
        if(sessionData == null || typeof sessionData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#getUserListForAdmintool sessionData is invalid');
            return false;
        }
        if (except == null || typeof except != 'object') {
            _log.connectionLog(3, 'UserAccountManager#getUserListForAdmintool :: except is invalid');
            return false;
        }
        if(start == null || typeof start != 'number') {
            _log.connectionLog(3, 'UserAccountManager#getUserListForAdmintool start is invalid');
            return false;
        }
        if(count == null || typeof count != 'number') {
            _log.connectionLog(3, 'UserAccountManager#getUserListForAdmintool count is invalid');
            return false;
        }
        var _onSelectDelUsrFlg = true;
        if (onSelectDelUsrFlg == false) {
            _onSelectDelUsrFlg = onSelectDelUsrFlg;
        }
        if(onGetUserListCallBack == null || typeof onGetUserListCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#getUserListForAdmintool onGetUserListCallBack is invalid');
            return false;
        }
        var _self = this;
        var _tenantAdminUserAccount = sessionData.getLoginAccout()
        var _xmppServerName = null;
        _getXmppServerName(sessionData.getTenantUuid(), _tenantAdminUserAccount, _onGetXmppServerNameFromCache);

        function _onGetXmppServerNameFromCache(err, xmppServerName) {
            if (err) {
                _log.connectionLog(3,'UserAccountManager#getUserListForAdmintool _onGetXmppServerNameFromCache : ' + err.name + ": " + err.message);
                onGetUserListCountCallBack(err, null);
                return;
            }
            _xmppServerName = xmppServerName;

            return GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);
        }

        function _onGetConnectionCallBack(err, connection){
            if(err){
                _log.connectionLog(3,'UserAccountManager#getUserListForAdmintool : ' + err.name + ": " + err.message);
                onGetUserListCallBack(err, null);
                return;
            }
            var _sql = 'SELECT * FROM user_account_store WHERE ';
            if (_onSelectDelUsrFlg == false) {
                _sql = _sql + 'delete_flg = 0 and ';
            }
            if(tenantId != null) {
                _sql = _sql + 'tenant_uuid = \'' + tenantId + '\' and ';
            }
            _sql = _sql + 'xmpp_server_name = '
                + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_xmppServerName);
            if(except.length > 0) {
                _sql = _sql + ' and (';
                for(var _i = 0; _i < except.length; _i++) {
                    if(_i != 0 ) {
                        _sql = _sql + ' and '
                    }
                    _sql = _sql + 'openfire_account<>\''+ except[_i] +'\'';
                }
                _sql = _sql + ')';
            }
            _sql = _sql + ' order by login_account limit ' + count + ' offset ' + (start-1);
            connection.query(_sql,_onGetUserList);

            function _onGetUserList(err, result){
                connection.end(function(endErr){
                    if(endErr){
                        _log.connectionLog(3,'UserAccountManager#getUserListForAdmintool : DB disconect err :: ' + endErr.name + ": " + endErr.message);
                    }
                    if(err){
                        _log.connectionLog(3,'UserAccountManager#getUserListForAdmintool : ' + err.name + ": " + err.message);
                        _log.connectionLog(3,'UserAccountManager#getUserListForAdmintool _sql : ' + _sql);
                        onGetUserListCallBack(err, null);
                        return;
                    }
                    var _count = result.length;
                    var _userAcountDataList = new Array();
                    if(result && result.length > 0){
                        for(var _i = 0; _i < _count; _i++){
                            _userAcountDataList[_i] = UserAccountData.create(result[_i]);
                        }
                    }
                    if(_userAcountDataList.length == 0){
                        _userAcountDataList = null;
                    }
                    onGetUserListCallBack(null, _userAcountDataList);
                });
            }
        }
    };
    _proto.getUserAccountDataByMailaddress = function(mailaddress, onGetUserAccountDataCallBack) {
        if(mailaddress == null || typeof mailaddress != 'string') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataByMailaddress mailaddress is invalid');
            return false;
        }
        if(onGetUserAccountDataCallBack == null || typeof onGetUserAccountDataCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#getUserAccountDataByMailaddress onGetUserAccountDataCallBack is invalid');
            return false;
        }
        var _self = this;
        return GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);

        function _onGetConnectionCallBack(err, connection){
            if(err){
                _log.connectionLog(3,'UserAccountManager#getUserAccountDataByMailaddress : ' + err.name + ": " + err.message);
                onGetUserAccountDataCallBack(err, null);
                return;
            }
            var _sql = 'SELECT * FROM user_account_store WHERE mailaddress = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(mailaddress);
            _log.connectionLog(7,'UserAccountManager#getUserAccountDataByMailaddress _sql : ' + _sql);
            connection.query(_sql,_onGetUserAccountData);

            function _onGetUserAccountData(err, result){
                connection.end(function(endErr){
                    if(endErr){
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataByMailaddress : DB disconect err :: ' + endErr.name + ": " + endErr.message);
                    }
                    if(err){
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataByMailaddress : ' + err.name + ": " + err.message);
                        _log.connectionLog(3,'UserAccountManager#getUserAccountDataByMailaddress _sql : ' + _sql);
                        onGetUserAccountDataCallBack(err, null);
                        return;
                    }
                    var _userAcountData = null;
                    if(result && result.length > 0){
                        _userAcountData = UserAccountData.create(result[0]);
                    }
                    onGetUserAccountDataCallBack(null, _userAcountData);
                });
            }
        }
    };
    _proto.create = function(sessionData,personData,password,registeredContactData,onRegUserCallBack) {
        if(sessionData == null || typeof sessionData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#create sessionData is invalid');
            return false;
        }
        if(personData == null || typeof personData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#create personData is invalid');
            return false;
        }
        if(password == null || typeof password != 'string') {
            _log.connectionLog(3, 'UserAccountManager#create password is invalid');
            return false;
        }
        if(registeredContactData == null || typeof registeredContactData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#create registeredContactData is invalid');
            return false;
        }
        if(onRegUserCallBack == null || typeof onRegUserCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#create onRegUserCallBack is invalid');
            return false;
        }
        var _tenantUuid = sessionData.getTenantUuid();
        var _self = this;
        var _result = false;
        var _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_UNKNOWN;
        var _tenantAdminUserAccount = sessionData.getLoginAccout()
        var _tran = null;

        var _xmppServerName = null;
        _getXmppServerName(_tenantUuid, _tenantAdminUserAccount, _onGetXmppServerNameFromCache);
        return true;

        function _onGetXmppServerNameFromCache(err, xmppServerName) {
            if (err) {
                _log.connectionLog(3,'UserAccountManager#create _onGetXmppServerNameFromCache : ' + err.name + ": " + err.message);
                onGetUserListCountCallBack(err, null);
                return;
            }
            _xmppServerName = xmppServerName;

            _tran = GlobalSNSManagerDbConnector.getInstance().getTransaction();
            _tran.begin(_onBeginTranCallBack);
        }

        function _onBeginTranCallBack(err, result){
            if(err){
                _log.connectionLog(3,'UserAccountManager#create#_onBeginTranCallBack : ' + err.name + ": " + err.message);
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _tenantUuid = sessionData.getTenantUuid();
            var _regUserName = personData.getUserName();
            var _ret = _self.getUserAccountDataByTenantLoginAccount(_tenantUuid, _regUserName, _onGetUserAccountDataCallBack);
            if(!_ret){
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                _tran.rollback(_onRollBackCallBack);
            }
        }
        function _onGetUserAccountDataCallBack(err, userAccountData){
            if(err){
                _log.connectionLog(3,'UserAccountManager#create#_onGetUserAccountDataCallBack : ' + err.name + ": " + err.message);
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_UNKNOWN;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            if(userAccountData != null){
                _log.connectionLog(3,'UserAccountManager#create This user exists : ' + personData.getUserName());
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_EXIST_USER;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _ret = _self._requestRegUserToXmppServer(sessionData,personData,password,registeredContactData, _requestRegUserToXmppServerCallBack);
            if(!_ret){
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
        }
        function _onCheckMailAddressCallBack(err, userAccountData){
            if(err){
                _log.connectionLog(3,'UserAccountManager#create#_onCheckMailAddressCallBack : ' + err.name + ": " + err.message);
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_UNKNOWN;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            if(userAccountData != null){
                _log.connectionLog(3,'UserAccountManager#create#_onCheckMailAddressCallBack This mail exists : ' + personData.getMail());
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_EXIST_MAILADDRESS;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _ret = _self._requestRegUserToXmppServer(sessionData,personData,password,registeredContactData, _requestRegUserToXmppServerCallBack);
            if(!_ret){
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
        }
        function _requestRegUserToXmppServerCallBack(regResult, reason, xmppAccount){
            if(!regResult){
                _log.connectionLog(3,'UserAccountManager#create#_requestRegUserToXmppServerCallBack failed ');
                _result = false;
                _reason = reason;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _loginAccount = personData.getUserName();
            var _openfireAccount = xmppAccount;
            var _mail = personData.getMail();
            var _tenantUuid = sessionData.getTenantUuid();
            var _userAccountData = UserAccountData.create();
            _userAccountData.setLoginAccount(_loginAccount);
            _userAccountData.setOpenfireAccount(_openfireAccount);
            _userAccountData.setXmppServerName(_xmppServerName);
            _userAccountData.setMailAddress(_mail);
            _userAccountData.setTenantUuid(_tenantUuid);
            var _userAccountArray = new Array();
            _userAccountArray[0] = _userAccountData;
            var _ret = _self._insertUserAccountData(_userAccountArray,_tran,_insertUserAccountDataCallBack);
            if(!_ret){
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                _tran.rollback(_onRollBackCallBack);
            }
        }
        function _insertUserAccountDataCallBack(err, insertUserAccountDataResult){
            if(err){
                _log.connectionLog(3,'UserAccountManager#create#_insertUserAccountDataCallBack : ' + err.name + ": " + err.message);
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            _tran.commit(_onCommitCallBack);
        }
        function _onCommitCallBack(err, commitResult){
            if(err){
                _log.connectionLog(3,'UserAccountManager#create#_onCommitCallBack :  ::' + err.name + ": " + err.message);
            }else{
                _result = true;
                _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                _log.connectionLog(7,'UserAccountManager#create#_onCommitCallBack : success');
            }
            _tran.end(_onEndConnectionCallBack);
        }
        function _onRollBackCallBack(err, rollbackResult){
            if(err){
                _log.connectionLog(3,'UserAccountManager#create#_onRollBackCallBack ::' + err.name + ": " + err.message);
            }
            _tran.end(_onEndConnectionCallBack);
        }
        function _onEndConnectionCallBack(err){
            onRegUserCallBack(_result, _reason, personData, password, registeredContactData);
        }
    };
    _proto._requestRegUserToXmppServer = function(sessionData,personData,password,registeredContactData,onRegUserCallBack) {
        if(sessionData == null || typeof sessionData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer sessionData is invalid');
            return false;
        }
        if(personData == null || typeof personData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer personData is invalid');
            return false;
        }
        if(password == null || typeof password != 'string') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer password is invalid');
            return false;
        }
        if(registeredContactData == null || typeof registeredContactData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer registeredContactData is invalid');
            return false;
        }
        if(onRegUserCallBack == null || typeof onRegUserCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer onRegUserCallBack is invalid');
            return false;
        }
        var _self = this;
        var _xsConn = sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, 'UserAccountManager#_requestRegUserToXmppServer _xsConn is null');
            return false;
        }
        var _xmppServerName = sessionData.getXmppServerName();
        var _loginAccount = personData.getUserName();
        return _self.createUniqueOpenfireAccount(_loginAccount, _xmppServerName, _onCreateOpenfireAccountCallBack);

        function _onCreateOpenfireAccountCallBack(openfireAccount, xmppServerName){
            if(openfireAccount == null){
                _log.connectionLog(4, 'UserAccountManager#_requestRegUserToXmppServer openfireAccount is null');
                onRegUserCallBack(false, SynchronousBridgeNodeXmpp.ERROR_REASON_INNER, null);
            }
            var _xmpp = require('./xmpp').Xmpp;
            var _fromJid = sessionData.getJid();
            var _xmppRegisterUser = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return _xmpp.createRegisterUserXmpp(_fromJid, openfireAccount, personData, password, registeredContactData);
            });
            if (_xmppRegisterUser == null) {
                _log.connectionLog(4, 'UserAccountManager#_requestRegUserToXmppServer _xmppRegisterUser is null');
                return;
            }
            var _xmppStr = _xmppRegisterUser[0];
            if (_xmppStr == null || _xmppStr == '') {
                _log.connectionLog(4, 'UserAccountManager#_requestRegUserToXmppServer _xmppRegisterUser[0] is invalid');
                return;
            }
            var _id = _xmppRegisterUser[1];
            var _regXmppAccount = openfireAccount;
            sessionData.setCallback(_id, _onRegisterUserCallback);
            _xsConn.send(_xmppStr);

            function _onRegisterUserCallback(xmlRootElem){
                var _result = false;
                var _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_XMPP_SERVER;
                var _xmppAccount = null;
                var _iqTypeAttr = xmlRootElem.attr('type');
                if(_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                    _result = true;
                    _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                    _xmppAccount = _regXmppAccount;
                }
                onRegUserCallBack(_result, _reason, _xmppAccount);
            }
        }
    };

    _proto.execBatchRegistration = function(sessionData,createUserList,onExecBatchRegistration) {
        if(sessionData == null || typeof sessionData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#execBatchRegistration sessionData is invalid');
            return false;
        }
        if(createUserList == null || typeof createUserList != 'object') {
            _log.connectionLog(3, 'UserAccountManager#execBatchRegistration createUserList is invalid');
            return false;
        }
        if(onExecBatchRegistration == null || typeof onExecBatchRegistration != 'function') {
            _log.connectionLog(3, 'UserAccountManager#execBatchRegistration onExecBatchRegistration is invalid');
            return false;
        }
        var _tenantUuid = sessionData.getTenantUuid();
        var _self = this;
        var _result = false;
        var _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_UNKNOWN;
        var _responceData = new Array();
        var _tran = null;

        var _xmppServerName = null;
        var _tenantAdminUserAccount = sessionData.getLoginAccout();
        _getXmppServerName(_tenantUuid, _tenantAdminUserAccount, _onGetXmppServerNameFromCache);
        return true;

        function _onGetXmppServerNameFromCache(err, xmppServerName) {
            if (err) {
                _log.connectionLog(3,'UserAccountManager#execBatchRegistration _onGetXmppServerNameFromCache : ' + err.name + ": " + err.message);
                onGetUserListCountCallBack(err, null);
                return;
            }
            _xmppServerName = xmppServerName;

            _tran = GlobalSNSManagerDbConnector.getInstance().getTransaction();
            _tran.begin(_onBeginTranCallBack);
        }

        function _onBeginTranCallBack(err, result){
            if(err){
                _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onBeginTranCallBack : ' + err.name + ": " + err.message);
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _createUserListCount = createUserList.length;
            for (var _i = 0; _i < _createUserListCount; _i++) {
                var _personData = createUserList[_i].personData;
                var _item = {};
                _item.account = _personData.getUserName();
                _item.result = null;
                _item.reason = null;
                _responceData.push(_item);
            }
            var _ret = _checkDuplicationUserAccount(createUserList);
            if(!_ret){
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                _tran.rollback(_onRollBackCallBack);
            }
        };
        function _checkDuplicationUserAccount(createTargetUserList){
            if(createTargetUserList == null || typeof createTargetUserList != 'object') {
                _log.connectionLog(3, 'UserAccountManager#execBatchRegistration#_checkDuplicationUserAccount createUserList is invalid');
                return false;
            }
            var _count = createTargetUserList.length;
            if(_count == 0){
                _log.connectionLog(3, 'UserAccountManager#execBatchRegistration#_checkDuplicationUserAccount createUserList count is 0');
                return false;
            }
            var _newCreateUserList = new Array();
            var _i = 0;
            var _personData = createTargetUserList[_i].personData;
            var _regUserName = _personData.getUserName();
            return _self.getUserAccountDataByTenantLoginAccount(_tenantUuid, _regUserName, _onGetUserAccountDataCallBack);

            function _onGetUserAccountDataCallBack(err, userAccountData){
                if(err){
                    _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onGetUserAccountDataCallBack : ' + err.name + ": " + err.message);
                }
                else if(userAccountData != null){
                    _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onGetUserAccountDataCallBack This user exists : ' + userAccountData.getLoginAccount());
                    _setResponceDataByAccount(_responceData, _regUserName, false, SynchronousBridgeNodeXmpp.ERROR_EXIST_USER);
                }
                else{
                    _newCreateUserList.push(createTargetUserList[_i]);
                }
                _i++;
                if(_i == _count){
                    if(_newCreateUserList.length == 0){
                        _log.connectionLog(3, 'UserAccountManager#execBatchRegistration#_checkDuplicationUserAccount _newCreateUserList count is 0');
                        _result = true;
                        _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                        _tran.rollback(_onRollBackCallBack);
                        return;
                    }
                    var _ret = _createOpenfireAccountInCreateUserList(_newCreateUserList);
                    if(!_ret){
                        _result = false;
                        _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                        _tran.rollback(_onRollBackCallBack);
                    }
                    return;
                }
                _personData = createTargetUserList[_i].personData;
                _regUserName = _personData.getUserName();
                _self.getUserAccountDataByTenantLoginAccount(_tenantUuid, _regUserName, _onGetUserAccountDataCallBack);
            }
        }
        function _checkDuplicationMailAdress(createTargetUserList){
            if(createTargetUserList == null || typeof createTargetUserList != 'object') {
                _log.connectionLog(3, 'UserAccountManager#execBatchRegistration#_checkDuplicationMailAdress createUserList is invalid');
                return false;
            }
            var _count = createTargetUserList.length;
            if(_count == 0){
                _log.connectionLog(3, 'UserAccountManager#execBatchRegistration#_checkDuplicationMailAdress createUserList count is 0');
                return false;
            }
            var _i = 0;
            var _newCreateUserList = new Array();
            var _personData = createTargetUserList[_i].personData;
            var _email = _personData.getMail();
            return _self.getUserAccountDataByMailaddress(_email, _onGetUserAccountDataCallBack);
            function _onGetUserAccountDataCallBack(err, userAccountData){
                if(err){
                    _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_checkDuplicationMailAdress#_onGetUserAccountDataCallBack : ' + err.name + ": " + err.message);
                }
                else if(userAccountData != null){
                    _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_checkDuplicationMailAdress#_onGetUserAccountDataCallBack This mail exists : ' + userAccountData.getMailAddress());
                    var _regUserName = _personData.getUserName();
                    var _regUserName = _personData.getUserName();
                    _setResponceDataByAccount(_responceData, _regUserName, false, SynchronousBridgeNodeXmpp.ERROR_EXIST_MAILADDRESS);
                }
                else{
                    _newCreateUserList.push(createTargetUserList[_i]);
                }
                _i++;
                if(_i == _count){
                    if(_newCreateUserList.length == 0){
                        _log.connectionLog(3, 'UserAccountManager#execBatchRegistration#_checkDuplicationMailAdress _newCreateUserList count is 0');
                        _result = true;
                        _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                        _tran.rollback(_onRollBackCallBack);
                        return;
                    }
                    var _ret = _createOpenfireAccountInCreateUserList(_newCreateUserList);
                    if(!_ret){
                        _result = false;
                        _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                        _tran.rollback(_onRollBackCallBack);
                    }
                    return;
                }
                _personData = createTargetUserList[_i].personData;
                _email = _personData.getMail();
                _self.getUserAccountDataByMailaddress(_email, _onGetUserAccountDataCallBack);
            }
        }
        function _createOpenfireAccountInCreateUserList(createTargetUserList){
            if(createTargetUserList == null || typeof createTargetUserList != 'object') {
                _log.connectionLog(3, 'UserAccountManager#execBatchRegistration#_createOpenfireAccountInCreateUserList createTargetUserList is invalid');
                return false;
            }
            var _count = createTargetUserList.length;
            if(_count == 0){
                _log.connectionLog(3, 'UserAccountManager#execBatchRegistration#_createOpenfireAccountInCreateUserList createUserList count is 0');
                return false;
            }
            var _i = 0;
            var _newCreateUserList = new Array();
            var _personData = createTargetUserList[_i].personData;
            var _loginAccount = _personData.getUserName();
            return _self.createUniqueOpenfireAccount(_loginAccount, _xmppServerName, _onCreateOpenfireAccountCallBack);

            function _onCreateOpenfireAccountCallBack(openfireAccount, xmppServerName){
                if(openfireAccount == null){
                    _log.connectionLog(4, 'UserAccountManager#_requestRegUserToXmppServer Creating OpenfireAccount fail :: User' + _loginAccount);
                    _setResponceDataByAccount(_responceData, _loginAccount, false, SynchronousBridgeNodeXmpp.ERROR_REASON_INNER);
                }else{
                    createTargetUserList[_i].openfireAccount = openfireAccount;
                    _newCreateUserList.push(createTargetUserList[_i]);
                }
                _i++;
                if(_i == _count){
                    var _ret = _self._requestCreateUserToXmppServer(sessionData,_newCreateUserList, xmppServerName, _onRequestCreateUserToXmppServerCallBack);
                    if(!_ret){
                        _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_createOpenfireAccountInCreateUserList :: _requestCreateUserToXmppServer failed');
                        _result = false;
                        _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                        _tran.rollback(_onRollBackCallBack);
                    }
                    return;
                }
                _personData = createTargetUserList[_i].personData;
                _loginAccount = _personData.getUserName();
                _self.createUniqueOpenfireAccount(_loginAccount, _xmppServerName, _onCreateOpenfireAccountCallBack);
            }
        }
        function _onRequestCreateUserToXmppServerCallBack(regResult, reason, resultCreateUserList, xmppServerName){
            if(!regResult){
                _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onRequestCreateUserToXmppServerCallBack failed ');
                _result = false;
                _reason = reason;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            if(!resultCreateUserList){
                _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onRequestCreateUserToXmppServerCallBack resultCreateUserList is invalid ');
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _count = resultCreateUserList.length;
            if(_count == 0){
                _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onRequestCreateUserToXmppServerCallBack resultCreateUserList.length is 0 ');
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _userTargetCreateAccountArray = new Array();
            for(var _i = 0; _i < _count; _i++){
                var _personData = resultCreateUserList[_i].personData;
                var _loginAccount = _personData.getUserName();
                if(!resultCreateUserList[_i].result){
                    _setResponceDataByAccount(_responceData, _loginAccount, false, SynchronousBridgeNodeXmpp.ERROR_REASON_XMPP_SERVER);
                    continue;
                }
                var _openfireAccount = resultCreateUserList[_i].openfireAccount;
                var _tenantAdminUserAccount = sessionData.getLoginAccout()
                var _xmppServerName = xmppServerName;
                var _mail = _personData.getMail();
                var _tenantUuid = sessionData.getTenantUuid();
                var _userAccountData = UserAccountData.create();
                _userAccountData.setLoginAccount(_loginAccount);
                _userAccountData.setOpenfireAccount(_openfireAccount);
                _userAccountData.setXmppServerName(_xmppServerName);
                _userAccountData.setMailAddress(_mail);
                _userAccountData.setTenantUuid(_tenantUuid);
                _userTargetCreateAccountArray.push(_userAccountData);
            }
            var _ret = _self._insertUserAccountData(_userTargetCreateAccountArray,_tran,_insertUserAccountDataCallBack);
            if(!_ret){
                _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onRequestCreateUserToXmppServerCallBack : _insertUserAccountData failed');
                _result = false;
                _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                _tran.rollback(_onRollBackCallBack);
            }

            function _insertUserAccountDataCallBack(err, insertUserAccountDataResult){
                if(err){
                    _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_insertUserAccountDataCallBack : ' + err.name + ": " + err.message);
                    execPhysicalDeleteUserToXmppServer();
                    return;
                }
                _tran.commit(_onCommitCallBack);
            }
            function _onCommitCallBack(err, commitResult){
                if(err){
                    _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onCommitCallBack ::' + err.name + ": " + err.message);
                    execPhysicalDeleteUserToXmppServer();
                    return;
                }
                _result = true;
                _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                var _successResultList = new Array();
                var _createdUserCount = _userTargetCreateAccountArray.length;
                for(var _j = 0; _j < _createdUserCount; _j++){
                    var _retItem = {};
                    _retItem.result = true;
                    _retItem.reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                    _successResultList.push(_retItem);
                }
                _setResponceDataFromResultArray(_responceData, _successResultList);
                _log.connectionLog(6,'UserAccountManager#execBatchRegistration#_onCommitCallBack : success');
                _tran.end(_onEndConnectionCallBack);
            }
            function execPhysicalDeleteUserToXmppServer(){
                var _deleteOpenfireAccountList = new Array();
                var _failResultList = new Array();
                for(_k = 0; _k < _userTargetCreateAccountArray.length; _k++){
                    _deleteOpenfireAccountList.push(_userTargetCreateAccountArray[_k].getOpenfireAccount());
                    var _retItem = {};
                    _retItem.result = false;
                    _retItem.reason = SynchronousBridgeNodeXmpp.ERROR_REASON_INNER;
                    _failResultList.push(_retItem);
                }
                _setResponceDataFromResultArray(_responceData, _failResultList);
                var _ret = _requestPhysicalDeleteUserToXmppServer(sessionData,_deleteOpenfireAccountList,_onRequestPhysicalDeleteUserToXmppServerCallBack);
                if(!_ret){
                    _log.connectionLog(3,'UserAccountManager#execBatchRegistration#execPhysicalDeleteUserToXmppServer failed');
                    _result = false;
                    _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM;
                    _tran.rollback(_onRollBackCallBack);
                }
                function _onRequestPhysicalDeleteUserToXmppServerCallBack(delResult, reason, resultDeleteUserList){
                    _result = false;
                    _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_INNER;
                    _tran.rollback(_onRollBackCallBack);
                }
            }
            function _setResponceDataFromResultArray(resData, resultArray){
                if(resData == null || typeof resData != 'object') {
                    _log.connectionLog(3, 'UserAccountManager#_setResponceData resData is invalid');
                    return;
                }
                if(resultArray == null || typeof resultArray != 'object') {
                    _log.connectionLog(3, 'UserAccountManager#_setResponceData resultArray is invalid');
                    return;
                }
                var _retCount = resultArray.length;
                var _nextIndex = 0;
                for(var _i = 0; _i < _retCount; _i++){
                    var _retItem = resultArray[_i];
                    var _j = _nextIndex;
                    for( ; _j < resData.length; _j++) {
                        if(resData[_j].result == null){
                            break;
                        }
                        _nextIndex++;
                    }
                    if(_j == resData.length) {
                        _log.connectionLog(4, 'UserAccountManager#_setResponceDataFromResultArray merge data invalid');
                        break;
                    }
                    resData[_nextIndex].result = _retItem.result;
                    resData[_nextIndex].reason = _retItem.reason;
                    _nextIndex++;
                }
            };
        }
        function _setResponceDataByAccount(resData, account, resResult, resReason){
            if(resData == null || typeof resData != 'object') {
                _log.connectionLog(3, 'UserAccountManager#_setResponceData resData is invalid');
                return;
            }
            if(account == null || typeof account != 'string') {
                _log.connectionLog(3, 'UserAccountManager#_setResponceData account is invalid');
                return;
            }
            if(resResult == null || typeof resResult != 'boolean') {
                _log.connectionLog(3, 'UserAccountManager#_setResponceData resResult is invalid');
                return;
            }
            if(resReason == null || typeof resReason != 'number') {
                _log.connectionLog(3, 'UserAccountManager#_setResponceData resReason is invalid');
                return;
            }
            var _resCount = resData.length;
            for(var _i = 0; _i < _resCount; _i++){
                var _resDataItem = resData[_i];
                if(_resDataItem.result != null){
                    continue;
                }
                if(account != _resDataItem.account){
                    continue;
                }
                resData[_i].result = resResult;
                resData[_i].reason = resReason;
                break;
            }
        };
        function _onRollBackCallBack(err, rollbackResult){
            if(err){
                _log.connectionLog(3,'UserAccountManager#execBatchRegistration#_onRollBackCallBack ::' + err.name + ": " + err.message);
            }
            _tran.end(_onEndConnectionCallBack);
        };
        function _onEndConnectionCallBack(err){
            var _count = _responceData.length;
            onExecBatchRegistration(_result, _reason, {}, _count, _responceData);
        };
    };
    _proto._requestCreateUserToXmppServer = function(sessionData,createUserList,xmppServerName,onCreateUserCallBack) {
        if(sessionData == null || typeof sessionData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer sessionData is invalid');
            return false;
        }
        if(createUserList == null || typeof createUserList != 'object') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer createUserList is invalid');
            return false;
        }
        if(xmppServerName == null || typeof xmppServerName != 'string') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer xmppServerName is invalid');
            return false;
        }
        if(onCreateUserCallBack == null || typeof onCreateUserCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#_requestRegUserToXmppServer onCreateUserCallBack is invalid');
            return false;
        }
        var _self = this;
        var _xsConn = sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, 'UserAccountManager#_requestRegUserToXmppServer _xsConn is null');
            return false;
        }
        var _xmpp = require('./xmpp').Xmpp;
        var _fromJid = sessionData.getJid();
        var _xmppRegisterUser = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return _xmpp.createCreateUserXmpp(_fromJid,createUserList);
        });
        if (_xmppRegisterUser == null) {
            _log.connectionLog(4, 'UserAccountManager#_requestRegUserToXmppServer _xmppRegisterUser is null');
            return false;
        }
        var _xmppStr = _xmppRegisterUser[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, 'UserAccountManager#_requestRegUserToXmppServer _xmppRegisterUser[0] is invalid');
            return false;
        }
        var _id = _xmppRegisterUser[1];
        sessionData.setCallback(_id, _onRegisterUserCallback);
        _xsConn.send(_xmppStr);
        return true;

        function _onRegisterUserCallback(xmlRootElem){
            _log.connectionLog(7, 'UserAccountManager#_requestRegUserToXmppServer xmlRootElem :' + xmlRootElem.toString());
            var _result = false;
            var _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = xmlRootElem.attr('type');
            var _items = null;
            if(_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                var _itemsElm = _getItemsElemFromCreateOrUpdateUserResponce(xmlRootElem);
                _items = _getItemsFromCreateOrUpdateUserResultItemsElm(_itemsElm,createUserList);
            }
            onCreateUserCallBack(_result, _reason, _items, xmppServerName);
        }
    };
    function _requestPhysicalDeleteUserToXmppServer(sessionData,deleteUserList,onDelUserCallBack) {
        if(sessionData == null || typeof sessionData != 'object') {
            _log.connectionLog(3, 'UserAccountManager#_requestPhysicalDeleteUserToXmppServer sessionData is invalid');
            return false;
        }
        if(deleteUserList == null || typeof deleteUserList != 'object') {
            _log.connectionLog(3, 'UserAccountManager#_requestPhysicalDeleteUserToXmppServer deleteUserList is invalid');
            return false;
        }
        if(onDelUserCallBack == null || typeof onDelUserCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#_requestPhysicalDeleteUserToXmppServer onDelUserCallBack is invalid');
            return false;
        }
        var _xsConn = sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, 'UserAccountManager#_requestPhysicalDeleteUserToXmppServer _xsConn is null');
            return false;
        }
        var _xmpp = require('./xmpp').Xmpp;
        var _fromJid = sessionData.getJid();
        var _xmppDelUser = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return _xmpp.createPhysicalDeleteUserXmpp(_fromJid,deleteUserList);
        });
        if (_xmppDelUser == null) {
            _log.connectionLog(4, 'UserAccountManager#_requestPhysicalDeleteUserToXmppServer _xmppRegisterUser is null');
            return false;
        }
        var _xmppStr = _xmppDelUser[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, 'UserAccountManager#_requestPhysicalDeleteUserToXmppServer _xmppRegisterUser[0] is invalid');
            return false;
        }
        var _id = _xmppDelUser[1];
        sessionData.setCallback(_id, _onDelUserCallBack);
        _xsConn.send(_xmppStr);
        return true;

        function _onDelUserCallBack(xmlRootElem){
            _log.connectionLog(6, 'UserAccountManager#_requestPhysicalDeleteUserToXmppServer response xmpp :' + xmlRootElem.toString());
            var _result = false;
            var _reason = SynchronousBridgeNodeXmpp.ERROR_REASON_XMPP_SERVER;
            var _xmppAccount = null;
            var _iqTypeAttr = xmlRootElem.attr('type');
            var _items = null;
            if(_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                var _itemsElm = _getItemsElemFromCreateOrUpdateUserResponce(xmlRootElem);
                _items = _getItemsFromCreateOrUpdateUserResultItemsElm(_itemsElm,createUserList);
            }
            onDelUserCallBack(_result, _reason, _items);
        }
    };
    function _getItemsFromCreateOrUpdateUserResultItemsElm(itemsElm, targetUserList){
        if(itemsElm == null) {
            _log.connectionLog(3, '_getItemsFromUserItemsElm :: itemsElem is null');
            return null;
        }
        if(targetUserList == null) {
            _log.connectionLog(3, '_getItemsFromUserItemsElm :: targetUserList is null');
            return null;
        }
        if(itemsElm.name == null || itemsElm.name() != 'items') {
            _log.connectionLog(3, '_getItemsFromUserItemsElm :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElm, 'item');
        if(_itemElemArray == null) {
            _log.connectionLog(3, '_getItemsFromUserItemsElm :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        if(_count != targetUserList.length) {
            _log.connectionLog(3, '_getItemsFromUserItemsElm :: Arraylength is invalid');
            _log.connectionLog(3, '_getItemsFromUserItemsElm :: _itemElemArray' + length);
            _log.connectionLog(3, '_getItemsFromUserItemsElm :: targetUserList.length' + targetUserList.length);
            return null;
        }

        for(var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _resultElem = Utils.getChildXmlElement(_itemElem, 'result');
            if(_resultElem == null) {
                _log.connectionLog(3, '_getItemsFromUserItemsElm :: _resultElem is null. No.' + _i);
                continue;
            }
            var _result = _resultElem.text();
            var _userNameElem = Utils.getChildXmlElement(_itemElem, 'username');
            if(_userNameElem == null) {
                _log.connectionLog(3, '_getItemsFromUserItemsElm :: _userNameElem is null. No.' + _i);
                continue;
            }
            var _openfireAccount = _userNameElem.text();
            _retArray[_itemIndex] = {
                result : (_result == 'true') ? true : false,
                personData : targetUserList[_itemIndex].personData,
                openfireAccount : _openfireAccount,
            };
            _itemIndex++;
        }
        return _retArray;
    }
    function _getItemsElemFromCreateOrUpdateUserResponce(xmlRootElem) {
        if(xmlRootElem == null) {
            _log.connectionLog(3, '_getItemsElemFromCreateOrUpdateUserResponce :: xmlRootElem is null');
            return null;
        }
        var _queryElem = Utils.getChildXmlElement(xmlRootElem, 'query');
        if(_queryElem == null) {
            _log.connectionLog(3, '_getItemsElemFromCreateOrUpdateUserResponce :: _queryElem is invalid');
            return null;
        }
        var _queryElemNamespace = _queryElem.namespace().href();
        if(_queryElemNamespace != 'http://necst.nec.co.jp/protocol/admin') {
            _log.connectionLog(3, '_getItemsElemFromCreateOrUpdateUserResponce :: _queryElemNamespace is not "admin"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_queryElem, 'content');
        if(_contentElem == null) {
            _log.connectionLog(3, '_getItemsElemFromCreateOrUpdateUserResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if(_itemsElem == null) {
            _log.connectionLog(3, '_getItemsElemFromCreateOrUpdateUserResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    };
    _proto._insertUserAccountData = function(userAccountArray, transaction ,onCreateUserAccountDataCallBack) {
        if(userAccountArray == null || !(userAccountArray instanceof Array)) {
            _log.connectionLog(3, 'UserAccountManager#_insertUserAccountData userAccountArray is invalid');
            return false;
        }
        if(transaction == null || typeof transaction != 'object') {
            _log.connectionLog(3, 'UserAccountManager#_insertUserAccountData transaction is invalid');
            return false;
        }
        if(onCreateUserAccountDataCallBack == null || typeof onCreateUserAccountDataCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#_insertUserAccountData onCreateUserAccountDataCallBack is invalid');
            return false;
        }
        var _self = this;
        var _columns = '( ' + COLUMN_TENANT_UUID + ',' + COLUMN_LOGIN_ACCOUNT_NAME + ',' + COLUMN_OPENFIRE_ACCOUNT_NAME + ',' + COLUMN_XMPP_SERVER_NAME + ',' + COLUMN_UPDATE_TIME_NAME + ',' + COLUMN_DELETE_FLG_NAME + ',' + COLUMN_MAILADDRESS_NAME + ' )';
        var _values = _createInsertValuesFromUserAccountDataArray(userAccountArray);
        if(_values == null){
            _log.connectionLog(3, 'UserAccountManager#_insertUserAccountData _values is invalid');
            return false;
        }

        var _sql = 'INSERT INTO user_account_store ' + _columns + ' VALUES ' + _values;
        transaction.query(_sql,_onCreateUserAccountData);
        return true;

        function _onCreateUserAccountData(err, result){
            if(err){
                _log.connectionLog(3,'UserAccountManager#_insertUserAccountData _sql : ' + _sql);
                _log.connectionLog(3,'UserAccountManager#_insertUserAccountData : ' + err.name + ": " + err.message);
                onCreateUserAccountDataCallBack(err, null);
                return;
            }
            onCreateUserAccountDataCallBack(null, result);
        }
    };
    function _createInsertValuesFromUserAccountDataArray(userAccountArray){
        if(userAccountArray == null || !(userAccountArray instanceof Array)) {
            _log.connectionLog(3, 'UserAccountManager#_createInsertValuesFromUserAccountDataArray userAccountArray is invalid');
            return null;
        }
        var _ret = '';
        var _size = userAccountArray.length;
        if(_size == 0){
            _log.connectionLog(3, 'UserAccountManager#_createInsertValuesFromUserAccountDataArray userAccountArray count is 0');
            return null;
        }
        for(var _i = 0; _i < _size; _i++){
            var _userAcountData = userAccountArray[_i];
            var _tenantUuid = GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_userAcountData.getTenantUuid());
            var _loginAccount = GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_userAcountData.getLoginAccount());
            var _openfireAccount = GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_userAcountData.getOpenfireAccount());
            var _xmppServerName = GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_userAcountData.getXmppServerName());
            var _deleteFlg = _userAcountData.getDeleteFlg();
            var _mail = GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(_userAcountData.getMailAddress());
            if(_i >= 1){
                _ret += ',';
            }
            _ret += '(' + _tenantUuid + ',' + _loginAccount + ',' + _openfireAccount + ',' + _xmppServerName + ',' + 'Now()' + ',' +_deleteFlg + ',' + _mail + ')';
        }
        return _ret;
    }
    _proto.updateUserAccountStatus = function(tenantUuid,loginAccount,accountStatus,onUpdateUserAccountStatusCallBack) {
        if(loginAccount == null || typeof loginAccount != 'string') {
            _log.connectionLog(3, 'UserAccountManager#updateUserAccountStatus loginAccount is invalid');
            return false;
        }
        if(accountStatus == null || typeof accountStatus != 'number') {
            _log.connectionLog(3, 'UserAccountManager#updateUserAccountStatus accountStatus is invalid');
            return false;
        }
        if(onUpdateUserAccountStatusCallBack == null || typeof onUpdateUserAccountStatusCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#updateUserAccountStatus onUpdateUserAccountStatusCallBack is invalid');
            return false;
        }
        var _self = this;
        var _result = false;
        var _tran = GlobalSNSManagerDbConnector.getInstance().getTransaction();
        _tran.begin(_onBeginTranCallBack);
        return true;

        function _onBeginTranCallBack(err, result){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus#_onBeginTranCallBack : ' + err.name + ": " + err.message);
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _sql = _updateUserAccuntStatusSql(tenantUuid,loginAccount,accountStatus);
            if(_sql == null){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus#_onBeginTranCallBack : _sql is invalid');
                _result = false;
                _tran.rollback(_onRollBackCallBack);
            }
            _tran.query(_sql, _onUpdateUserAccountStatusToDBCallBack);

        }
        function _onUpdateUserAccountStatusToDBCallBack(err, result){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus#_onUpdateUserAccountStatusToDBCallBack : ' + err.name + ": " + err.message);
                _result = false;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            if(result.changedRows < 1){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus#_onUpdateUserAccountStatusToDBCallBack : update user_account_store fail ');
                _result = false;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            _tran.commit(_onCommitCallBack);
        }
        function _onCommitCallBack(err, commitResult){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus#_onCommitCallBack :  ::' + err.name + ": " + err.message);
                _result = false;
            }else{
                _result = true;
                _log.connectionLog(7,'UserAccountManager#updateUserAccountStatus#_onCommitCallBack : success');
            }
            _tran.end(_onEndConnectionCallBack);
        }
        function _onRollBackCallBack(err, rollbackResult){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus#_onRollBackCallBack ::' + err.name + ": " + err.message);
            }
            _tran.end(_onEndConnectionCallBack);
        }
        function _onEndConnectionCallBack(err){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountStatus#_onEndConnectionCallBack ::' + err.name + ": " + err.message);
            }
            onUpdateUserAccountStatusCallBack(_result);
        }
    };

    function _updateUserAccuntStatusSql(tenantUuid,loginAccount,accountStatus){
        if(loginAccount == null || typeof loginAccount != 'string') {
            _log.connectionLog(3, 'UserAccountManager#_updateUserAccuntStatusSql loginAccount is invalid');
            return null;
        }
        if(accountStatus == null || typeof accountStatus != 'number') {
            _log.connectionLog(3, 'UserAccountManager#_updateUserAccuntStatusSql accountStatus is invalid');
            return null;
        }
        var _sql = 'UPDATE user_account_store SET';
        _sql += ' ' + COLUMN_DELETE_FLG_NAME + ' = ' + accountStatus;
        _sql += ' , ' + COLUMN_UPDATE_TIME_NAME + ' = NOW()';
        _sql += ' WHERE ' + COLUMN_LOGIN_ACCOUNT_NAME + ' = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(loginAccount);
        _sql += ' AND ' + COLUMN_TENANT_UUID + ' = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(tenantUuid);
        return _sql;
    }
    _proto.updateUserAccountMailAddress = function(tenantUuid, loginAccount, mailAddress, onUpdateUserAccountMailAddressCallBack) {
        if(tenantUuid == null || typeof tenantUuid != 'string') {
            _log.connectionLog(3, 'UserAccountManager#updateUserAccountMailAddress tenantUuid is invalid');
            return false;
        }
        if(loginAccount == null || typeof loginAccount != 'string') {
            _log.connectionLog(3, 'UserAccountManager#updateUserAccountMailAddress loginAccount is invalid');
            return false;
        }
        if(mailAddress == null || typeof mailAddress != 'string') {
            _log.connectionLog(3, 'UserAccountManager#updateUserAccountMailAddress mailAddress is invalid');
            return false;
        }
        if(onUpdateUserAccountMailAddressCallBack == null || typeof onUpdateUserAccountMailAddressCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#updateUserAccountMailAddress onUpdateUserAccountMailAddressCallBack is invalid');
            return false;
        }
        var _self = this;
        var _result = false;
        var _tran = GlobalSNSManagerDbConnector.getInstance().getTransaction();
        _tran.begin(_onBeginTranCallBack);
        return true;

        function _onBeginTranCallBack(err, result){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountMailAddress#_onBeginTranCallBack : ' + err.name + ": " + err.message);
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            var _sql = _updateUserAccuntMailAddressSql(tenantUuid, loginAccount, mailAddress);
            if(_sql == null){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountMailAddress#_onBeginTranCallBack : _sql is invalid');
                _result = false;
                _tran.rollback(_onRollBackCallBack);
            }
            _tran.query(_sql, _onUpdateUserAccountMailAddressToDBCallBack);

        }
        function _onUpdateUserAccountMailAddressToDBCallBack(err, result){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountMailAddress#_onUpdateUserAccountMailAddressToDBCallBack : ' + err.name + ": " + err.message);
                _result = false;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            if(result.changedRows < 1){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountMailAddress#_onUpdateUserAccountMailAddressToDBCallBack : update user_account_store fail ');
                _result = false;
                _tran.rollback(_onRollBackCallBack);
                return;
            }
            _tran.commit(_onCommitCallBack);
        }
        function _onCommitCallBack(err, commitResult){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountMailAddress#_onCommitCallBack :  ::' + err.name + ": " + err.message);
                _result = false;
            }else{
                _result = true;
                _log.connectionLog(7,'UserAccountManager#updateUserAccountMailAddress#_onCommitCallBack : success');
            }
            _tran.end(_onEndConnectionCallBack);
        }
        function _onRollBackCallBack(err, rollbackResult){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountMailAddress#_onRollBackCallBack ::' + err.name + ": " + err.message);
            }
            _tran.end(_onEndConnectionCallBack);
        }
        function _onEndConnectionCallBack(err){
            if(err){
                _log.connectionLog(3,'UserAccountManager#updateUserAccountMailAddress#_onEndConnectionCallBack ::' + err.name + ": " + err.message);
            }
            onUpdateUserAccountMailAddressCallBack(_result);
        }
    };
    function _updateUserAccuntMailAddressSql(tenantUuid, loginAccount, mailAddress){
        if(loginAccount == null || typeof loginAccount != 'string') {
            _log.connectionLog(3, 'UserAccountManager#_updateUserAccuntMailAddressSql loginAccount is invalid');
            return null;
        }
        if(mailAddress == null || typeof mailAddress != 'string') {
            _log.connectionLog(3, 'UserAccountManager#_updateUserAccuntMailAddressSql mailAddress is invalid');
            return null;
        }
        var _sql = 'UPDATE user_account_store SET';
        _sql += ' ' + COLUMN_MAILADDRESS_NAME + ' = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(mailAddress);
        _sql += ' , ' + COLUMN_UPDATE_TIME_NAME + ' = NOW()';
        _sql += ' WHERE ' + COLUMN_LOGIN_ACCOUNT_NAME + ' = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(loginAccount);
        _sql += ' AND ' + COLUMN_TENANT_UUID + ' = ' + GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(tenantUuid);
        return _sql;
    }
    function _getXmppServerName(tenantUuid, tenantAdminUserAccount, onGetXmppServerNameFromCache){
        if (tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
            _log.connectionLog(3, 'UserAccountManager#_getXmppServerName internal error. argument tenantUuid is incorrect.');
            onGetXmppServerNameFromCache(new Error('Internal error. Argument tenantUuid is incorrect.'), null);
            return;
        }
        if (tenantAdminUserAccount == null || typeof tenantAdminUserAccount != 'string' || tenantAdminUserAccount == '') {
            _log.connectionLog(3, 'UserAccountManager#_getXmppServerName internal error. argument tenantUuid is incorrect.');
            onGetXmppServerNameFromCache(new Error('Internal error. Argument tenantUuid is incorrect.'), null);
            return;
        }
        if (onGetXmppServerNameFromCache == null || typeof onGetXmppServerNameFromCache != 'function') {
            _log.connectionLog(3, 'UserAccountManager#_getXmppServerName internal error. argument onGetXmppServerNameFromCache is null.');
            onGetXmppServerNameFromCache(new Error('Internal error. Argument onGetXmppServerNameFromCache is null.'), null);
            return;
        }

        var _tenantXmppData = TenantXmppData.createAsOrder(tenantUuid);
        if (_tenantXmppData == null) {
            _log.connectionLog(3, 'UserAccountManager#_getXmppServerName internal error. Could not create order.');
            onGetXmppServerNameFromCache(new Error('Internal error. Coud not create order.'), null);
            return;
        }
        var _chef = ReadCacheBeforeDBChef.getInstance();

        var _xmppServerName = null;
        _chef.cook(_tenantXmppData, function(err, dish) {
            if (err) {
                _log.connectionLog(3, 'UserAccountManager#_getXmppServerName cooking explosion is occured');
                onGetXmppServerNameFromCache(err, null);
                return;
            }
            if (dish == null) {
                _log.connectionLog(3, 'UserAccountManager#_getXmppServerName cooking explosion.');
                onGetXmppServerNameFromCache(new Error('CacheChef could not create dish.'), null);
                return;
            }
            _xmppServerName = dish.getXmppServerNames()[0];

            onGetXmppServerNameFromCache(null, _xmppServerName);
        });

    }
    function _createOpenfireAccount(loginAccount) {
        if(loginAccount == null || typeof loginAccount != 'string' || loginAccount == '') {
            _log.connectionLog(3, 'UserAccountManager#createOpenfireAccount loginAccount is invalid');
            return null;
        }
        if(loginAccount.length > LOGIN_ACCOUNT_NAME_MAX_LENGTH) {
            return null;
        }
        var _ret = '';
        var _safix = '';
        for(var _i = 0; _i < 4; _i++) {
            var _num3bit = Utils.getRandomNumber(0, 37);
            _safix += Utils.convert38NumToChara(_num3bit);
        }
        _ret = loginAccount.toLowerCase() + _safix;
        return _ret;
    }
    _proto.createUniqueOpenfireAccount = function(loginAccount, xmppServerName, onCreateOpenfireAccountCallBack) {
        if(loginAccount == null || typeof loginAccount != 'string' || loginAccount == '') {
            _log.connectionLog(3, 'UserAccountManager#createUniqueOpenfireAccount loginAccount is invalid');
            return false;
        }
        if(xmppServerName == null || typeof xmppServerName != 'string' || xmppServerName == '') {
            _log.connectionLog(3, 'UserAccountManager#createUniqueOpenfireAccount xmppServerName is invalid');
            return false;
        }
        if(onCreateOpenfireAccountCallBack == null || typeof onCreateOpenfireAccountCallBack != 'function') {
            _log.connectionLog(3, 'UserAccountManager#createUniqueOpenfireAccount onCreateOpenfireAccountCallBack is invalid');
            return false;
        }
        var _self = this;
        var _ret = '';
        var _count = 0;
        var _openfireAccount = _createOpenfireAccount(loginAccount);
        return _self.getUserAccountDataByOFAccountAndXmppServerName(_openfireAccount, xmppServerName, _onGetUserAccountDataCallBack);

        function _onGetUserAccountDataCallBack(err, userAcountData){
            if(err) {
                _log.connectionLog(3,'UserAccountManager#createUniqueOpenfireAccount : ' + err.name + ": " + err.message);
                onCreateOpenfireAccountCallBack(null, xmppServerName);
                return;
            }
            if(userAcountData == null) {
                onCreateOpenfireAccountCallBack(_openfireAccount, xmppServerName);
                return;
            }
            if(_count > 100) {
                onCreateOpenfireAccountCallBack(null, xmppServerName);
                return;
            }
            _count++;
            _openfireAccount = _createOpenfireAccount(loginAccount);
            _self.getUserAccountDataByOFAccountAndXmppServerName(_openfireAccount, xmppServerName, _onGetUserAccountDataCallBack);
        }
    }

    var _userAccountManager = new UserAccountManager();

    UserAccountManager.getInstance = function() {
        return _userAccountManager;
    };
    exports.getInstance = UserAccountManager.getInstance;
    exports.PASSWORD_MIN_SIZE=UserAccountManager.PASSWORD_MIN_SIZE;
    exports.PASSWORD_MAX_SIZE=UserAccountManager.PASSWORD_MAX_SIZE;

})();
