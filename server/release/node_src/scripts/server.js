// cubeeのSocket.IO、WebAPI用フロントプログラム

var ServerLog = require('./controller/server_log');
var DBIF = require('./Authority/db/db_if');

// 最低限の例外処理
process.on('uncaughtException', function(err) {
    var _date = new Date();
    try {
        var _log = ServerLog.getInstance();
        _log.connectionLog(1, '[' + _date +'] uncaughtException => ' + err.stack);

    } catch (e) {
        console.log('[' + _date +'] uncaughtException => ' + err.stack);
    }
});

function startServer() {
    var _log = ServerLog.getInstance();
    // Socket.IO受信モジュールの読み込み
    var io = require('./controller/socket_io_receiver');
    io.start();

    // Expressモジュール読み込み。HTTP受信も行う
    var express = require('../express_app/app.js');
    express.start();

    // 権限管理DB接続の開始
    /* Unused variable dbif.
    var dbif = DBIF.create().initialize('/opt/cubee/cmnconf/spf_rightctl_dbs.json',
        function(err) {
            if (err) {
                _log.connectionLog(3, 'Failed to connect rightctl dbs: ' + JSON.stringify(err));
            } else {
                _log.connectionLog(6, 'Rightctl DB connected.');
            }
        }
    ); */
    _log.connectionLog(6,'CubeeServer is running.');
};

//サーバー起動
startServer();
