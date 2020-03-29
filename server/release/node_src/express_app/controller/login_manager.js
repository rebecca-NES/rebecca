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
    var ServerLog = require('../../scripts/controller/server_log');
    var SynchronousBridgeNodeXmpp = require('../../scripts/controller/synchronous_bridge_node_xmpp');
    var _log = ServerLog.getInstance();

    function LoginManager() {
    };
    var ERR_LOGIN_ACCOUNT_OR_PASSWORD_WRONG = 'テナント名、アカウントまたはパスワードが不正です。';

    var _proto = LoginManager.prototype;

    _proto.adminLogin = function(tenantUuid, account, password, onConnected, onError, req) {
        if(tenantUuid == null || typeof tenantUuid != 'string') {
            return false;
        }
        if(account == null || typeof account != 'string') {
            return false;
        }
        if(password == null || typeof password != 'string') {
            return false;
        }
        if (onConnected == null || typeof onConnected != 'function') {
            return false;
        }
        if (onError == null || typeof onError != 'function') {
            return false;
        }
        if (req == null || typeof req != 'object') {
            return false;
        }
        var remoteIP = req.connection.remoteAddress;
        var clientIP = req.headers['x-forwarded-for'];
        var socket = req.connection;
        socket.disconnect = function(){};
        socket.emit = function(){};
        socket.send = function(){};
        socket.clientIP = (clientIP != null || clientIP != '')? clientIP : remoteIP;

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
