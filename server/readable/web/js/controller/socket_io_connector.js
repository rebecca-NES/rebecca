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
function SocketIoConnector() {
    this._socket = null;
    this._isLogined = false;
    this._onConnectCallBack = null;
    this._onDiscconectCallBack = null;
    this._onErrorCallBack = null;
    this._onMessageReceivedCallback = null;
};

(function() {
    var _proto = SocketIoConnector.prototype;

    _proto.connect = function(host, port, onConnectCallBack, onDisconnectCallBack, onErrorCallBack, onMessageReceivedCallback) {
        var _self = this;

        if (host == null || typeof host != 'string') {
            return false;
        }
        if (port == null || typeof port != 'number') {
            return false;
        }
        if (onConnectCallBack == null || typeof onConnectCallBack != 'function') {
            return false;
        }
        if (onDisconnectCallBack == null || typeof onDisconnectCallBack != 'function') {
            return false;
        }
        if (onErrorCallBack == null || typeof onErrorCallBack != 'function') {
            return false;
        }
        if (onMessageReceivedCallback == null || typeof onMessageReceivedCallback != 'function') {
            return false;
        }
        if (_self._socket != null) {
        }

        setTimeout(function() {
            _self._onConnectCallBack = onConnectCallBack;
            _self._onDisconnectCallBack = onDisconnectCallBack;
            _self._onErrorCallBack = onErrorCallBack;
            _self._onMessageReceivedCallback = onMessageReceivedCallback;

            _self._socket = io.connect(location.protocol + '//' + host + ':' + port + '/', {
                transports : ['websocket', 'xhr-polling'],
                reconnectionAttempts: 10
            });
            if(_self._socket.socket) {
                _self._socket.socket.redoTransports = true;
            }

            _self._socket.on('connect', function(data) {
                console.log('connected');
                if (_self != null && _self._onConnectCallBack != null) {
                    _self._onConnectCallBack();
                }
            });
            _self._socket.on('message', function(data) {
                console.log(data);
                if (_self != null && _self._onMessageReceivedCallback != null) {
                    _self._onMessageReceivedCallback(data);
                }
            });
            _self._socket.on('XMPP server disconnect', function(data) {
                console.log('disconnected');
                delete _self._socket;
                if (_self != null && _self._onDisconnectCallBack != null) {
                    _self._onDisconnectCallBack();
                }
                _self._onConnectCallBack = null;
                _self._onDisconnectCallBack = null;
                _self._onErrorCallBack = null;
                _self._onMessageReceivedCallback = null;
            });
            _self._socket.on('disconnect', function() {
                console.log('socket.io disconnected');
            });
            _self._socket.on('error', function(error) {
                console.log('error : ' + error);
                if (_self != null && _self._onErrorCallBack != null) {
                    _self._onErrorCallBack(error);
                }
            });
            _self._socket.on('reconnect_failed', function() {
                console.log('reconnect failed');
                delete _self._socket;
                if (_self != null && _self._onDisconnectCallBack != null) {
                    _self._onDisconnectCallBack();
                }
                _self._onConnectCallBack = null;
                _self._onDisconnectCallBack = null;
                _self._onErrorCallBack = null;
                _self._onMessageReceivedCallback = null;
            });
            _self._socket.on('connect_failed', function() {
                console.log('connect failed');
                delete _self._socket;
                if (_self != null && _self._onDisconnectCallBack != null) {
                    _self._onDisconnectCallBack();
                }
                _self._onConnectCallBack = null;
                _self._onDisconnectCallBack = null;
                _self._onErrorCallBack = null;
                _self._onMessageReceivedCallback = null;
            });
            _self._socket.on('reconnecting', function() {
                console.log('reconnecting...');
            });
        }, 1);
        return true;
    };

    _proto.disconnect = function() {
        var _self = this;
        if (_self._socket != null) {
            _self._socket.disconnect();
        }
        _self._onConnectCallBack = null;
        _self._onDisconnectCallBack = null;
        _self._onErrorCallBack = null;
        _self._onMessageReceivedCallback = null;
    };

    _proto.sendData = function(data) {
        var _self = this;
        if (_self._socket != null) {
            _self._socket.send(data);
            return true;
        }
        return false;
    };

})();
