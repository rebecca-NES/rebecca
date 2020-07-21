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
    var constants = require('constants');
    var fs = require('fs');
    var Conf = require('./conf');
    var _conf = Conf.getInstance();
    var CubeeWebApi = require('./cubee_web_api');
    var ServerLog = require('./server_log');

    var log = ServerLog.getInstance();

    var _io = null;
    var _ioSsl = null;

    function start() {
        var _socketIoPort = parseInt(_conf.getConfData('SOCKET_IO_PORT'));
        if (isNaN(_socketIoPort)) {
            log.connectionLog(6, 'Socket.IO Port Setting is nothing');
        } else {
            var http_server = require('http').createServer();
            _io = require('socket.io')(http_server);
            http_server.listen(_socketIoPort);
        }
        var _socketIoSslPort = parseInt(_conf.getConfData('SOCKET_IO_SSL_PORT'));
        if (isNaN(_socketIoSslPort)) {
            log.connectionLog(6, 'Socket.IO SSL Port Setting is nothing');
        } else {
            var _sslCertificateFile = _conf.getConfData('SOCKET_IO_SSL_CERTIFICATE_PATH');
            var _sslCertificateKeyFile = _conf.getConfData('SOCKET_IO_SSL_CERTIFICATE_KEY_PATH');
            if (_sslCertificateFile == '' || _sslCertificateKeyFile == '') {
                log.connectionLog(6, 'Socket.IO SSL Setting is invalid');
            } else {
                var https_server = require('https').createServer({
                    key : fs.readFileSync(_sslCertificateKeyFile).toString(),
                    cert : fs.readFileSync(_sslCertificateFile).toString()
                });
                _ioSsl = require('socket.io')(https_server);
                https_server.listen(_socketIoSslPort);
            }
        }
        if (_io != null) {
            _io.set('transports', ['websocket', 'polling']);
            _io.on('connection', onSocketsConnected);
        }
        if (_ioSsl != null) {
            _ioSsl.set('transports', ['websocket', 'polling']);
            _ioSsl.on('connection', onSocketsConnected);
        }
    };

    function onSocketsConnected(socket) {
        var _ipAddress = socket.handshake.address.address;
        log.connectionLog(7, 'connected from ' + _ipAddress);
        socket.isSynchronous = true;
        socket.receiveBuf = '';

        socket.on('message', function(msg) {
            var _receiveData = msg.toString();
            log.connectionLog(7, _receiveData);
            socket.receiveBuf = _receiveData;
            try {
                _receiveObject = JSON.parse(socket.receiveBuf);
            } catch(e) {
                log.connectionLog(7, 'receive JSON parse error : ' + socket.receiveBuf);
                return;
            }
            var _message = socket.receiveBuf;
            socket.receiveBuf = '';
            function processCallback(response) {
                socket.emit('message', response);
            }


            CubeeWebApi.getInstance().receive(socket, _message, processCallback);
        });
        socket.on('disconnect', function() {
            log.connectionLog(7, 'disconnected');
            CubeeWebApi.getInstance().notifyDisconnect(socket);
        });
    };

    function pushMessage(socket, message) {
        if (socket == null) {
            return;
        }
        socket.emit('message', message);
    };

    function onError(socket, error) {
        if (socket == null) {
            return;
        }
        socket.emit('error', error);
    };

    function onDisconnect(socket) {
        if (socket == null) {
            return;
        }
        socket.emit('XMPP server disconnect', '');
    };

    exports.start = start;
    exports.pushMessage = pushMessage;
    exports.onError = onError;
    exports.onDisconnect = onDisconnect;

})();
