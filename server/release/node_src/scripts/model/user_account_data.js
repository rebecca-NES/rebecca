(function() {
    var Utils = require('../utils')

    /**
     * @class ユーザアカウントデータ
     */
    function UserAccountData(userAccountDataContent) {
        var _self = this;
        // id
        _self._id = null;
        // ログインアカウント
        _self._loginAccount = null;
        // openfireアカウント
        _self._openfireAccount = null;
        // XMPPサーバー名
        _self._xmppServerName = null;
        // レコード更新日時
        _self._updateTime = new Date();
        // 削除フラグ(0:通常、1:削除済)
        _self._deleteFlg = UserAccountData.DELETE_FLG_OFF;
        // メールアドレス
        _self._mailAddress = null;
        // テナントUUID
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

    // 定数定義
    // 削除フラグ(0:通常、1:削除済、2:休止 )
    UserAccountData.DELETE_FLG_OFF = 0;
    UserAccountData.DELETE_FLG_ON = 1;
    UserAccountData.DELETE_FLG_SUSPEND = 2;

    var _proto = UserAccountData.prototype;

    // id
    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if(id == null || typeof id != 'number') {
            return;
        }
        this._id = id;
    };
    // ログインアカウント
    _proto.getLoginAccount = function() {
        return this._loginAccount;
    };
    _proto.setLoginAccount = function(loginAccount) {
        if(loginAccount == null || typeof loginAccount != 'string') {
            return;
        }
        this._loginAccount = loginAccount;
    };
    // openfireアカウント
    _proto.getOpenfireAccount = function() {
        return this._openfireAccount;
    };
    _proto.setOpenfireAccount = function(openfireAccount) {
        if(openfireAccount == null || typeof openfireAccount != 'string') {
            return;
        }
        this._openfireAccount = openfireAccount;
    };
    // XMPPサーバー名
    _proto.getXmppServerName = function() {
        return this._xmppServerName;
    };
    _proto.setXmppServerName = function(xmppServerName) {
        if(xmppServerName == null || typeof xmppServerName != 'string') {
            return;
        }
        this._xmppServerName = xmppServerName;
    };
    // レコード更新日時
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
    // 削除フラグ(0:通常、1:削除済)
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
    // メールアドレス
    _proto.getMailAddress = function() {
        return this._mailAddress;
    };
    _proto.setMailAddress = function(mailAddress) {
        if(mailAddress == null || typeof mailAddress != 'string') {
            return;
        }
        this._mailAddress = mailAddress;
    };
    // テナントUUID
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
