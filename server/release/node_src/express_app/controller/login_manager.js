(function() {
    var ServerLog = require('../../scripts/controller/server_log');
    var SynchronousBridgeNodeXmpp = require('../../scripts/controller/synchronous_bridge_node_xmpp');
    var _log = ServerLog.getInstance();

    /**
     * LoginManagerコンストラクタ
     */
    function LoginManager() {
    };
    //定数
    var ERR_LOGIN_ACCOUNT_OR_PASSWORD_WRONG = 'テナント名、アカウントまたはパスワードが不正です。';

    var _proto = LoginManager.prototype;

    _proto.adminLogin = function(tenantUuid, account, password, onConnected, onError, req) {
        // 引数チェック
        if(tenantUuid == null || typeof tenantUuid != 'string') {
            return false;
        }
        if(account == null || typeof account != 'string') {
            return false;
        }
        if(password == null || typeof password != 'string') {
            return false;
        }
        // パラメータのコールバック関数チェック
        if (onConnected == null || typeof onConnected != 'function') {
            return false;
        }
        if (onError == null || typeof onError != 'function') {
            return false;
        }
        if (req == null || typeof req != 'object') {
            return false;
        }
        //socket
        var remoteIP = req.connection.remoteAddress;
        var clientIP = req.headers['x-forwarded-for'];
        var socket = req.connection;
        socket.disconnect = function(){};
        socket.emit = function(){};
        socket.send = function(){};
        socket.clientIP = (clientIP != null || clientIP != '')? clientIP : remoteIP;

        //adminLogin実行
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        var _ret = _synchronousBridgeNodeXmpp.adminLogin(socket, tenantUuid, account, password, onConnected, true);
        if(!_ret){
            onError();
        }
        return _ret;
    };

    var _loginManager = new LoginManager();
    LoginManager.getInstance = function() {
        return _loginManager;
    };
    exports.getInstance = LoginManager.getInstance;
    exports.ERR_LOGIN_ACCOUNT_OR_PASSWORD_WRONG = ERR_LOGIN_ACCOUNT_OR_PASSWORD_WRONG;

})();
