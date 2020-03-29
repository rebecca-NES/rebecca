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
    var tcp = require('net');
    var ServerLog = require('./server_log');
    function create(arg1, arg2, arg3, arg4, arg5, arg6) {
        var _xsConnector = null;
        switch(arguments.length) {
            case 4:
                _xsConnector = new XmppServerConnector(null, null, arg1, arg2, arg3, arg4);
                break;
            case 5:
                _xsConnector = new XmppServerConnector(arg1, null, arg2, arg3, arg4, arg5);
                break;
            case 6:
                _xsConnector = new XmppServerConnector(arg1, arg2, arg3, arg4, arg5, arg6);
                break;
            default:
                break;
        }
        return _xsConnector;
    };

    exports.create = create;

    function XmppServerConnector(host, port, onConnectCallback, onDisconnectCallback, onDataReceiveCallback, onErrorOccurredCallback) {
        var _self = this;
        _self.initialized = false;
        _self._host = '';
        _self._port = 0;
        _self._log = ServerLog.getInstance();
        _self._onConnectCallback = null;
        _self._onDisconnectCallback = null;
        _self._onDataReceiveCallback = null;
        _self._socket = null;

        _self._log.connectionLog(7, 'do func XmppServerConnector(');

        if(host == null) {
            _self._host = 'localhost';
        } else if( typeof host == 'string') {
            _self._host = host;
        } else {
            _self._log.connectionLog(4, 'host is invalid data.');
            return;
        }
        if(port == null) {
            _self._port = 5222;
        } else if( typeof port == 'number' && port >= 0 && port < 65536) {
            _self._port = port;
        } else {
            _self._log.connectionLog(4, 'port is invalid data.');
            return;
        }

        if(onConnectCallback == null || typeof onConnectCallback != 'function') {
            _self._log.connectionLog(4, 'onConnectCallback is not function');
            return;
        }
        _self._onConnectCallback = onConnectCallback;
        if(onDisconnectCallback == null || typeof onDisconnectCallback != 'function') {
            log.connectionLog(4, 'onDisconnectCallback is not function');
            return;
        }
        _self._onDisconnectCallback = onDisconnectCallback;
        if(onDataReceiveCallback == null || typeof onDataReceiveCallback != 'function') {
            _self._log.connectionLog(4, 'onDataReceiveCallback is not function');
            return;
        }
        _self._onDataReceiveCallback = onDataReceiveCallback;
        if(onErrorOccurredCallback == null || typeof onErrorOccurredCallback != 'function') {
            _self._log.connectionLog(4, 'onErrorOccurredCallback is not function');
            return;
        }
        _self._onErrorOccurredCallback = onErrorOccurredCallback;

        _self.initialized = true;
        _self._log.connectionLog(7, 'XmppServerConnector initialized');

    };

    var _proto = XmppServerConnector.prototype;

    _proto.setHost = function(host) {
        this._host = host;
    }
    _proto.getHost = function() {
        return this._host;
    }
    _proto.setPort = function(port) {
        this._port = port;
    }
    _proto.getPort = function() {
        return this._port;
    }

    _proto.connect = function() {
        var _self = this;
        _self._log.connectionLog(7, 'do func XmppServerConnector.connect(');
        if(_self._socket) {
            _self.disconnect();
        }
        _self._socket = tcp.createConnection(_self._port, _self._host);
        _self._socket.setTimeout(0);

        var _onConnect = function() {
            _onConnected(_self);
        };
        var _onError = function(error) {
            _onErrorOccurred(_self, error);
        };
        var _onReceive = function(data) {
            try {
                _onReceived(_self, data);
            } catch (e) {
                var _date = new Date();
                if(_self._log) {
                    _self._log.connectionLog(1, '[' + _date +'] Exception => ' + e.stack);
                } else {
                    console.log('[' + _date +'] Exception => ' + e.stack);
                }
            }
        };
        var _onDisconnect = function(error) {
            _onDisconnected(_self, error);
        };
        _self._socket.addListener('connect', _onConnect);
        _self._socket.addListener('error', _onError);
        _self._socket.addListener('close', _onDisconnect);
        _self._socket.addListener('data', _onReceive);
    };
    _proto.send = function(data) {
        var _self = this;
        _self._log.connectionLog(7, 'do func XmppServerConnector.send(');

        if(_self._socket) {
            if(_self._log) {
                _self._log.connectionLog(7, 'XMPP server send : ' + data);
            }
            _self._socket.write(data);
        } else {
            if(_self._log) {
                _self._log.connectionLog(3, '_socket is undefied');
            }
        }
    };
    _proto.disconnect = function() {
        var _self = this;
        _self._log.connectionLog(7, 'do func XmppServerConnector.disconnect(');
        if(_self._socket) {
            _self._socket.end();
            delete _self._socket;
            _self._socket = null;
            if(_self._log) {
                _self._log.connectionLog(6, 'disconnect xmpp server.');
            }
        } else {
            if(_self._log) {
                _self._log.connectionLog(3, '_socket is undefied');
            }
        }
    };

    _proto.startHeartbeat = function(xmppSendPing) {
        var _self = this;
        setTimeout(function() {
            function sendPing() {
                if(_self != null && _self._socket != null) {
                    _self.send(xmppSendPing);
                    setTimeout(function() {
                        sendPing();
                    }, 150000);
                }
            }
            sendPing();
        }, 10000);
    };
    function _onConnected(_self) {
        if(_self._log) {
            _self._log.connectionLog(7, 'XMPP Server connected.');
        }
        _self._onConnectCallback(_self);
    };

    function _onErrorOccurred(_self, error) {
        var _error = error.toString();
        if(_self._log) {
            _self._log.connectionLog(3, 'XMPP connection socket is error: ' + _error);
        }
        _self._onErrorOccurredCallback(_self, _error);
    };

    function _onReceived(_self, data) {
        _self._log.connectionLog(7, 'do func XmppServerConnector._onReceived(');
        var _message = data.toString();
        if(_self._log) {
            _self._log.connectionLog(7, 'Receive data from XMPP Server: ' + _message);
        }
        _self._onDataReceiveCallback(_self, _message);
    };

    function _onDisconnected(_self, error) {
        _self._log.connectionLog(7, 'do func XmppServerConnector._onDisconnected(');
        if(_self._log) {
            _self._log.connectionLog(6, 'XMPP Server disconnected: ' + error);
        }
        _self._onDisconnectCallback(_self);
        if(_self._socket) {
            delete _self._socket;
            _self._socket = null;
        }
    };

})();
