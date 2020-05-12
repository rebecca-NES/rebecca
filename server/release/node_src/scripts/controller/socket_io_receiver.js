(function() {
    // SSL 3.0無効化用モジュール読み込み
    // Unused variable constants.
    // var constants = require('constants');
    // 設定ファイルデータモジュールの読み込み
    var fs = require('fs');
    var Conf = require('./conf');
    var _conf = Conf.getInstance();
    var CubeeWebApi = require('./cubee_web_api');
    // ログAPIモジュールの読み込み
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
            // Socket.IOモジュールの読み込み
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
                // Socket.IOモジュールの読み込み
                _ioSsl = require('socket.io')(https_server);
                https_server.listen(_socketIoSslPort);
            }
        }
        // 接続処理受け付ける
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
        //
        socket.receiveBuf = '';

        // メッセージ受信時
        socket.on('message', function(msg) {
            var _receiveData = msg.toString();
            log.connectionLog(7, _receiveData);
            //socket.receiveBuf += _receiveData;
            socket.receiveBuf = _receiveData;
            try {
                _receiveObject = JSON.parse(socket.receiveBuf);
            } catch(e) {
                // JSON形式以外はエラー
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
        // 切断時
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

    // Xmppサーバでエラーが発生
    function onError(socket, error) {
        if (socket == null) {
            return;
        }
        socket.emit('error', error);
    };

    // Xmppサーバから切断された
    function onDisconnect(socket) {
        if (socket == null) {
            return;
        }
        socket.emit('XMPP server disconnect', '');
        //socket.disconnect();
    };

    exports.start = start;
    exports.pushMessage = pushMessage;
    exports.onError = onError;
    exports.onDisconnect = onDisconnect;

})();
