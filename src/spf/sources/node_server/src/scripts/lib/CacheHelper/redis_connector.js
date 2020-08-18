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
    var Redis = require('redis');
    var ServerLog = require('../../controller/server_log');
    var Conf = require('../../controller/conf');

    var log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    function RedisConnector() {
        var _self = this;

        var _host = _conf.getConfData('REDIS_SERVER_HOST');
        var _port = parseInt(_conf.getConfData('REDIS_PORT'));
        var _pw   = _conf.getConfData('REDIS_PW');
        var _connectTimeOut = parseInt(_conf.getConfData('REDIS_CONNECT_TIMEOUT'));
        if (isNaN(_connectTimeOut)) {
            _connectTimeOut = 2000;
            log.connectionLog(4,
                'RedisConnector: redis Connection Timeout Setting is nothing (REDIS_CONNECT_TIMEOUT)');
        }
        _self._redisOptions = {
                 host     : _host
                ,port     : _port
                ,password : _pw
                ,db       : 1
                ,tls      : false
                ,connect_timeout : _connectTimeOut
                ,socket_keepalive : true
        }
        _self._redisClient = null;
        _self._isAuthorized = false;

    }

    var _RedisConnector = new RedisConnector();

    RedisConnector.getInstance = function() {
        return _RedisConnector;
    }

    exports.getInstance = RedisConnector.getInstance;

    var _proto = RedisConnector.prototype;

    _proto.getRedisClient = function() {
        log.connectionLog(7, 'RedisConnector#getRedisClient');
        var _self = this;
        if (!_self._redisClient) {
            _connect(_self);
        }
        return _self._redisClient;
    }

    function _connect(_self) {

        if (!_self._redisClient) {
            log.connectionLog(7, 'RedisConnector#_connect Prepair to connect.');

            _self._redisClient = Redis.createClient(_self._redisOptions.port, _self._redisOptions.host, _self._redisOptions);

            _self._redisClient.on('error', _onRedisError);
            _self._redisClient.on('clientError', _onRedisClientError);
            _self._redisClient.once('close', _onRedisClose);
            _self._redisClient.once('end', _onRedisEnd);

        }
        if (_self._isAuthorized) {
            log.connectionLog(7, 'RedisConnector#_connect Already connected to redis.');
            return;
        }

        function _onRedisError(err) {
            log.connectionLog(4, 'RedisConnector#_onRedisError err: ' + err);
            onRedisError(_self, err);
        }
        function _onRedisClientError(err) {
            log.connectionLog(7, 'RedisConnector#_onRedisClientError');
            onRedisClientError(_self, err);
        }
        function _onRedisClose() {
            log.connectionLog(7, 'RedisConnector#_onRedisClose');
            onRedisClose(_self);
        }
        function _onRedisEnd() {
            log.connectionLog(7, 'RedisConnector#_onRedisEnd');
            onRedisEnd(_self);
        }
        function _onRedisAuth(err, res) {
            log.connectionLog(7, 'RedisConnector#_onRedisAuth');
            _onRedisAuth(_self, err, res);
        }

        log.connectionLog(7, 'RedisConnector#_connect Starting auth');
        _self._redisClient.auth(_self._redisOptions.password, _self._onRedisAuth);

    }

    function onRedisError(_self, err) {
        log.connectionLog(4, 'RedisConnector#onRedisError err: ' + err);
    }
    function onRedisClientError(_self, err) {
        log.connectionLog(7, 'RedisConnector#onRedisClientError');
        onRedisError(_self, err);
    }
    function onRedisClose(_self) {
        log.connectionLog(7, 'RedisConnector#onRedisClose');
        log.connectionLog(7, 'RedisConnector#onRedisClose Going down');
        _self._isAuthorized = false;
        _self._redisClient = null;
    }
    function onRedisEnd(_self) {
        log.connectionLog(7, 'RedisConnector#onRedisEnd');
        onRedisClose(_self);
    }
    function onRedisAuth(_self, err, res) {
        if (err) {
            log.connectionLog(4, 'RedisConnector#_onRedisAuth Failed to auth cos: ' + err);
            _self._disconnect(new Error('Failed to auth cos: ' + err.message));
            return;
        }
        if (!res || typeof res != 'string') {
            log.connectionLog(4, 'RedisConnector#_onRedisAuth Failed to auth cos result is not OK');
            _self._disconnect(new Error('Failed to auth cos result is not OK'));
            return;
        }
        if (res != 'OK') {
            log.connectionLog(4, 'RedisConnector#_onRedisAuth Failed to auth cos result is not OK: ' + res);
            _self._disconnect(new Error('Failed to auth cos result is not OK'));
            return;
        }
        _self._isAuthorized = true;
    }

})();