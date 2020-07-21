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
var Conf           = require('./controller/conf');
var ServerLog      = require('./controller/server_log');
var RedisConnector = require('./controller/redis_connector');
var SpfServer      = require('./controller/spf_server');
var SpfListManager = require('./controller/spf_list_manager');
var url            = require('url');
var http           = require('http');

var CONF_KEY_HTTP_PORT = 'HTTP_PORT';

var _conf = Conf.getInstance();
var _log = ServerLog.getInstance();
var _redisConnector = RedisConnector.getInstance();
var _spfServer = SpfServer.getInstance();
var _spfListManager = SpfListManager.getInstance();

process.on('uncaughtException', function(err) {
    var _date = new Date();
    try {
        _log.connectionLog(1, '[' + _date +'] uncaughtException => ' +
            err.stack);
    } catch (e) {
        console.log('[' + _date +'] uncaughtException => ' + err.stack);
    }
});

main();

function main() {
    _redisConnector.createRedisClient(_setupServer);

    function _setupServer(err, client) {
        if(err) {
            return;
        }
        _spfListManager.loadSpfServerList(client, true, setupServer);
    }
}

function setupServer(err) {
    if(err) {
        _log.connectionLog(3,
            'setupServer:: problem with loadSpfServerList');
        return;
    }
    var _httpPort = parseInt(_conf.getConfData(CONF_KEY_HTTP_PORT));

    if (isNaN(_httpPort)) {
        _log.connectionLog(6, 'setupServer:: HTTP Port Setting is nothing');
    } else {
        startServer(_httpPort);
    }
}

function startServer(listenPort) {
    http.createServer(function(serverRequest, serverResponse) {
        _log.connectionLog(7,
            'http.createServer:: Access URL:' + serverRequest.url);
        _log.connectionLog(7,
            'http.createServer:: Access port:' + listenPort);

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
