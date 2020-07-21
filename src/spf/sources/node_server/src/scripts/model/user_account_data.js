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
    var Utils = require('../utils')

    function UserAccountData(userAccountDataContent) {
        var _self = this;
        _self._id = null;
        _self._loginAccount = null;
        _self._openfireAccount = null;
        _self._xmppServerName = null;
        _self._updateTime = new Date();
        _self._deleteFlg = UserAccountData.DELETE_FLG_OFF;
        _self._mailAddress = null;
        _self._tenantUuid = null;

        if(userAccountDataContent){
            _self.setId(Utils.getChildObject(userAccountDataContent, 'id'));
            _self.setLoginAccount(Utils.getChildObject(userAccountDataContent, 'login_account'));
            _self.setOpenfireAccount(Utils.getChildObject(userAccountDataContent, 'openfire_account'));
            _self.setXmppServerName(Utils.getChildObject(userAccountDataContent, 'xmpp_server_name'));
            _self.setUpdateTime(Utils.getChildObject(userAccountDataContent, 'update_time'));
            _self.setDeleteFlg(Utils.getChildObject(userAccountDataContent, 'delete_flg'));
            _self.setMailAddress(Utils.getChildObject(userAccountDataContent, 'mailaddress'));
            _self.setTenantUuid(Utils.getChildObject(userAccountDataContent, 'tenant_uuid'));
        }
    }

    UserAccountData.create = function(arg) {
        var _userAccountData = null;
        switch (arguments.length) {
             case 0: _userAccountData = new UserAccountData(null);
                    break;
             case 1: _userAccountData = new UserAccountData(arg);
                    break;
             default:
                    break;
         }
        return _userAccountData;
    };

    UserAccountData.DELETE_FLG_OFF = 0;
    UserAccountData.DELETE_FLG_ON = 1;
    UserAccountData.DELETE_FLG_SUSPEND = 2;

    var _proto = UserAccountData.prototype;

    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if(id == null || typeof id != 'number') {
            return;
        }
        this._id = id;
    };
    _proto.getLoginAccount = function() {
        return this._loginAccount;
    };
    _proto.setLoginAccount = function(loginAccount) {
        if(loginAccount == null || typeof loginAccount != 'string') {
            return;
        }
        this._loginAccount = loginAccount;
    };
    _proto.getOpenfireAccount = function() {
        return this._openfireAccount;
    };
    _proto.setOpenfireAccount = function(openfireAccount) {
        if(openfireAccount == null || typeof openfireAccount != 'string') {
            return;
        }
        this._openfireAccount = openfireAccount;
    };
    _proto.getXmppServerName = function() {
        return this._xmppServerName;
    };
    _proto.setXmppServerName = function(xmppServerName) {
        if(xmppServerName == null || typeof xmppServerName != 'string') {
            return;
        }
        this._xmppServerName = xmppServerName;
    };
    _proto.getUpdateTime = function() {
        return this._updateTime;
    };
    _proto.setUpdateTime = function(updateTime) {
        var isDate =  updateTime instanceof Date;
        if(updateTime == null || !isDate) {
            return;
        }
        this._updateTime = updateTime;
    };
    _proto.getDeleteFlg = function() {
        return this._deleteFlg;
    };
    _proto.setDeleteFlg = function(deleteFlg) {
        if(deleteFlg == null || typeof deleteFlg != 'number') {
            return;
        }
        if(deleteFlg < UserAccountData.DELETE_FLG_OFF || deleteFlg > UserAccountData.DELETE_FLG_SUSPEND) {
            return;
        }
        this._deleteFlg = deleteFlg;
    };
    _proto.getMailAddress = function() {
        return this._mailAddress;
    };
    _proto.setMailAddress = function(mailAddress) {
        if(mailAddress == null || typeof mailAddress != 'string') {
            return;
        }
        this._mailAddress = mailAddress;
    };
    _proto.getTenantUuid = function() {
        return this._tenantUuid;
    };
    _proto.setTenantUuid = function(tenantUuid) {
        if(tenantUuid == null || typeof tenantUuid != 'string') {
            return;
        }
        this._tenantUuid = tenantUuid;
    };

    exports.create = UserAccountData.create;
    exports.DELETE_FLG_OFF = UserAccountData.DELETE_FLG_OFF;
    exports.DELETE_FLG_ON = UserAccountData.DELETE_FLG_ON;
    exports.DELETE_FLG_SUSPEND = UserAccountData.DELETE_FLG_SUSPEND;
})();
