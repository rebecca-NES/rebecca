(function(){

    function SessionData() {
        this._accessToken = '';
        this._ipAddress = '';
        this._userName = '';
        this._password = '';
        this._jid = '';
        this._socketIoSock = null;
        this._openfireSock = null;
        this._disconnectDatetime = null;
        this._callback = {};
        this._independentClientNumber = 0;
        this._loginAccount = '';
        this._tenantUuid = '';
        this._xmppServerName = '';
        this._xmppServerPort = 0;
    };

    SessionData.create = function() {
        return new SessionData();
    };

    var _proto = SessionData.prototype;

    // AccessToken
    _proto.getAccessToken = function() {
        return this._accessToken;
    };
    _proto.setAccessToken = function(accessToken) {
        if(accessToken == null) {
            return;
        }
        if(typeof accessToken != 'string') {
            return;
        }
        this._accessToken = accessToken;
    };
    // IpAddress
    _proto.getIpAddress = function() {
        return this._ipAddress;
    };
    _proto.setIpAddress = function(ipAddress) {
        if(ipAddress == null) {
            return;
        }
        if(typeof ipAddress != 'string') {
            return;
        }
        this._ipAddress = ipAddress;
    };
    // userName(ここにはOpenfireのユーザ名をセットする)
    _proto.getUserName = function() {
        return this._userName;
    };
    _proto.setUserName = function(userName) {
        if(userName == null) {
            return;
        }
        if(typeof userName != 'string') {
            return;
        }
        this._userName = userName;
    };
    // password
    _proto.getPassword = function() {
        return this._password;
    };
    _proto.setPassword = function(password) {
        if(password == null) {
            return;
        }
        if(typeof password != 'string') {
            return;
        }
        this._password = password;
    };
    // JID
    _proto.getJid = function() {
        return this._jid;
    };
    _proto.setJid = function(jid) {
        if(jid == null) {
            return;
        }
        if(typeof jid != 'string') {
            return;
        }
        this._jid = jid;
    };
    // Socket.IO Socket
    _proto.getSocketIoSock = function() {
        return this._socketIoSock;
    };
    _proto.setSocketIoSock = function(socketIoSock) {
        if(socketIoSock == null) {
            this._socketIoSock = null;
            return;
        }
        if(typeof socketIoSock != 'object') {
            return;
        }
        this._socketIoSock = socketIoSock;
    };
    // Openfire Socket
    _proto.getOpenfireSock = function() {
        return this._openfireSock;
    };
    _proto.setOpenfireSock = function(openfireSock) {
        if(openfireSock == null) {
            this._openfireSock = null;
            return;
        }
        if(typeof openfireSock != 'object') {
            return;
        }
        this._openfireSock = openfireSock;
    };
    // DisconnectDatetime
    _proto.getDisconnectDatetime = function() {
        return this._disconnectDatetime;
    };
    _proto.setDisconnectDatetime = function(disconnectDatetime) {
        if(disconnectDatetime == null) {
            this._disconnectDatetime = null;
            return;
        }
        if(typeof disconnectDatetime != 'object') {
            return;
        }
        this._disconnectDatetime = disconnectDatetime;
    };
    // callback
    _proto.getCallback = function(id) {
        return this._callback[id];
    };
    _proto.setCallback = function(id, func) {
        if(id == null || typeof id != 'string') {
            return;
        }
        if(id == '') {
            return;
        }
        if(func == null || typeof func != 'function') {
            return;
        }
        this._callback[id] = func;
    };
    _proto.unsetCallback = function(id) {
        if(id == null || typeof id != 'string') {
            return;
        }
        if(this._callback[id] == undefined) {
            return;
        }
        delete this._callback[id];
    };
    // IndependentClientNumber
    _proto.getIndependentClientNumber = function() {
        return this._independentClientNumber;
    };
    _proto.setIndependentClientNumber = function(independentClientNumber) {
        if(independentClientNumber == null) {
            return;
        }
        if(typeof independentClientNumber != 'number') {
            return;
        }
        this._independentClientNumber = independentClientNumber;
    };
    // loginAccout
    _proto.getLoginAccout = function() {
        return this._loginAccount;
    };
    _proto.setLoginAccout = function(loginAccount) {
        if(loginAccount == null) {
            return;
        }
        if(typeof loginAccount != 'string') {
            return;
        }
        this._loginAccount = loginAccount;
    };
    // tenantUuid
    _proto.getTenantUuid = function() {
        return this._tenantUuid;
    };
    _proto.setTenantUuid = function(tenantUuid) {
        if(tenantUuid == null) {
            return;
        }
        if(typeof tenantUuid != 'string') {
            return;
        }
        this._tenantUuid = tenantUuid;
    };
    // xmppServerName
    _proto.getXmppServerName = function() {
        return this._xmppServerName;
    };
    _proto.setXmppServerName = function(xmppServerName) {
        if(xmppServerName == null) {
            return;
        }
        if(typeof xmppServerName != 'string') {
            return;
        }
        this._xmppServerName = xmppServerName;
    };
    // xmppServerPort
    _proto.getXmppServerPort = function() {
        return this._xmppServerPort;
    };
    _proto.setXmppServerPort = function(xmppServerPort) {
        if(xmppServerPort == null) {
            return;
        }
        if(typeof xmppServerPort != 'number') {
            return;
        }
        this._xmppServerPort = xmppServerPort;
    };
    // tenantUuid+loginAccount
    _proto.getLoginAccountInTenant = function() {
        if (this._loginAccount == null || this._loginAccount == '') {
            return null;
        }
        if (this._tenantUuid == null || this._tenantUuid == '') {
            return null;
        }
        return this._tenantUuid + ' ' + this._loginAccount ;
    }
    exports.create = SessionData.create;
})();
