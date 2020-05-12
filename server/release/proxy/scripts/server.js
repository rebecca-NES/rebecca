var Conf           = require('./controller/conf');
var ServerLog      = require('./controller/server_log');
var RedisConnector = require('./controller/redis_connector');
var SpfServer      = require('./controller/spf_server');
var SpfListManager = require('./controller/spf_list_manager');
// Unused variable url.
// var url            = require('url');
var http           = require('http');

// 定数定義
var CONF_KEY_HTTP_PORT = 'HTTP_PORT';

// confクラスインスタンス取得
var _conf = Conf.getInstance();
// ServerLogクラスインスタンス取得
var _log = ServerLog.getInstance();
// RedisConnectorクラスインスタンス取得
var _redisConnector = RedisConnector.getInstance();
// SpfServerクラスインスタンス取得
var _spfServer = SpfServer.getInstance();
// SpfListManagerクラスインスタンス取得
var _spfListManager = SpfListManager.getInstance();

// 最低限の例外処理
process.on('uncaughtException', function(err) {
    var _date = new Date();
    try {
        _log.connectionLog(1, '[' + _date +'] uncaughtException => ' +
            err.stack);
    } catch (e) {
        console.log('[' + _date +'] uncaughtException => ' + err.stack);
    }
});

// メイン処理
main();

function main() {
    // redis の準備
    _redisConnector.createRedisClient(_setupServer);

    // CubeeProxy を起動するコールバック
    function _setupServer(err, client) {
        if(err) {
            return;
        }
        // Cubeeサーバリストを生成し、CubeeProxy を起動
        _spfListManager.loadSpfServerList(client, true, setupServer);
    }
}

// proxyサーバー起動呼び出し
function setupServer(err) {
    if(err) {
        _log.connectionLog(3,
            'setupServer:: problem with loadSpfServerList');
        return;
    }
    var _httpPort = parseInt(_conf.getConfData(CONF_KEY_HTTP_PORT));

    // proxyサーバー起動(HTTP)
    if (isNaN(_httpPort)) {
        _log.connectionLog(6, 'setupServer:: HTTP Port Setting is nothing');
    } else {
        startServer(_httpPort);
    }
}

// proxyサーバー起動
function startServer(listenPort) {
    // proxyサーバ起動
    http.createServer(function(serverRequest, serverResponse) {
        _log.connectionLog(7,
            'http.createServer:: Access URL:' + serverRequest.url);
        _log.connectionLog(7,
            'http.createServer:: Access port:' + listenPort);

        // リクエストを　Cubee サーバへ　proxy
        _spfServer.requestSpfServer(serverRequest, serverResponse);
    })
    .listen(listenPort, '0.0.0.0', function() {
        _log.connectionLog(6,
            'startServer:: SpfProxyServer is running. port:' + listenPort);
    })
    .on('error', function(err) {
        _log.connectionLog(3,
            'startServer:: problem with createServer : ' + err.message);
    });
}
