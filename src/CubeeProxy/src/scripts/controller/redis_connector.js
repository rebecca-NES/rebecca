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
    var Conf      = require('./conf');
    var ServerLog = require('./server_log');
    var redis     = require('redis');

    var _conf = Conf.getInstance();

    var _log = ServerLog.getInstance();

    var CONF_KEY_REDIS_PORT = 'REDIS_PORT';
    var CONF_KEY_REDIS_SERVER_HOST = 'REDIS_SERVER_HOST';
    var CONF_KEY_REDIS_PW = 'REDIS_PW';
    var CONF_KEY_REDIS_CONNECT_TIMEOUT = 'REDIS_CONNECT_TIMEOUT';
    var CONF_KEY_REDIS_LOCK_TIMEOUT = 'REDIS_LOCK_TIMEOUT';

    function RedisConnector() {
    }

    var _proto = RedisConnector.prototype;

    _proto.createRedisClient = function(callback) {
        _log.connectionLog(7, 'RedisConnector.createRedisClient:: create redis client');

        var _port = parseInt(_conf.getConfData(CONF_KEY_REDIS_PORT));
        if (isNaN(_port)) {
            _port = 6379;

            _log.connectionLog(4,
                'RedisConnector.createRedisClient:: redis Port Setting is nothing');
        }
        var _host = _conf.getConfData(CONF_KEY_REDIS_SERVER_HOST);
        if (!_host) {
            _host = "localhost";

            _log.connectionLog(4,
                'RedisConnector.createRedisClient:: redis Host Setting is nothing');
        }
        var _timeout = parseInt(_conf.getConfData(CONF_KEY_REDIS_CONNECT_TIMEOUT));
        if (isNaN(_timeout)) {
            _timeout = 2000;

            _log.connectionLog(4,
                'RedisConnector.createRedisClient:: redis Connect Timeout Setting is nothing');
        }
        var option = {
            connect_timeout:_timeout
        };
        var client = redis.createClient(_port, _host, option);
        client.on("error", function (err) {
            _log.connectionLog(3, 'RedisConnector.createRedisClient:: redis error : ' +
                err.message);

            return;
        });
        var _password = _conf.getConfData(CONF_KEY_REDIS_PW);
        if (!_password) {
            _password = "password";

            _log.connectionLog(4,
                'RedisConnector.createRedisClient:: redis Password Setting is nothing');
        }
        client.auth(_password, function (err) {
            if(err) {
                _log.connectionLog(3,
                    'RedisConnector.createRedisClient:: redis authentication error : ' +
                    err.message);

                var _retErr = new Error('redis authentication error');
                callback(_retErr, null);
                return;
            }
            _log.connectionLog(7,
                'RedisConnector.createRedisClient:: redis authentication successfull');

            callback(null, client);
        });
    }

    _proto.quit = function(client) {
        if(client) {
            if(client.connected) {
                _log.connectionLog(7,
                    'RedisConnector.quit:: redis client quit');

                client.quit();
            } else {
                _log.connectionLog(6,
                    'RedisConnector.quit:: redis client already quit');
            }
        } else {
            _log.connectionLog(3,
                'RedisConnector.quit:: redis client is undefied');
        }
    }

    _proto.acquireLock = function(client, lockName, lockTimeout, callback) {
        if(!callback) {
            callback = lockTimeout;
            lockTimeout = _conf.getConfData(CONF_KEY_REDIS_LOCK_TIMEOUT);
            if (isNaN(lockTimeout)) {
                lockTimeout = 5000;

                _log.connectionLog(4,
                    'RedisConnector.acquireLock:: redis Lock Timeout Setting is nothing');
            }
        }
        if(!client) {
            _log.connectionLog(3,
                'RedisConnector.acquireLock:: redis client is undefied');

            var _retErr = new Error('redis client is undefied');
            setTimeout(callback, 10, _retErr, null);
            return;
        }
        if(!lockName) {
            _log.connectionLog(3,
                'RedisConnector.acquireLock:: lockName is undefied');

            var _retErr = new Error('lockName is undefied');
            setTimeout(callback, 10, _retErr, null);
            return;
        }
        var _self = this;

        var _lockName = 'lock.' + lockName;
        var _unixLockTimeout = (lockTimeout + 1) * 10;
        var _releaseTime = (new Date().getTime() + _unixLockTimeout);
        var _timeoutId = null;

        client.setnx(_lockName, _releaseTime, function(err, exists){
            if(err) {
                _log.connectionLog(3,
                    'RedisConnector.acquireLock:: redis error : ' +
                    err.message);

                var _retErr = new Error('Failed to acquire lock by redis');
                callback(_retErr, null);
            }
            if(exists == 1) {
                _log.connectionLog(7,
                    'RedisConnector.acquireLock:: redis lock successfull : ' +
                    _lockName);
                _timeoutId = setTimeout(function() {
                    client.del(_lockName, function(err) {
                        _self.quit(client);

                        _log.connectionLog(1,
                            'RedisConnector.acquireLock:: Connection timeout : Release the redis lock ' +
                            _lockName + ' and quit redis client');

                        if(err) {
                            _log.connectionLog(3,
                                'RedisConnector.acquireLock:: Connection timeout : Release failure redis lock ' +
                                _lockName + ' : ' + err.message);
                        }
                    });
                }, lockTimeout);
                callback(null, _timeoutId);
            } else {
                _self._checkTimeout(client, lockName, lockTimeout, callback);
            }
        });
    }

    _proto._checkTimeout = function(client, lockName, lockTimeout, callback) {
        var _self = this;

        var _lockName = 'lock.' + lockName;
        var _unixTime = null;
        client.get(_lockName, function(err, timeout) {
            if(err) {
                _log.connectionLog(3,
                    'RedisConnector._checkTimeout:: redis error : ' +
                    err.message);

                var _retErr = new Error('Failed to get redis data');
                callback(_retErr, null);
            } else {
                _unixTime = new Date().getTime();
                if(_unixTime > timeout) {
                    client.del(_lockName, function(err) {
                        if(err) {
                            _log.connectionLog(3,
                                'RedisConnector._checkTimeout:: Release failure redis lock ' +
                                _lockName + ' : ' + err.message);

                            var _retErr = new Error('Failed to delete redis data');
                            callback(_retErr, null);
                        } else {
                            _log.connectionLog(4,
                                'RedisConnector._checkTimeout:: Timeout : release the redis lock ' + 
                                _lockName);

                            _self.acquireLock(client, lockName,
                                              lockTimeout, callback);
                        }
                    });
                } else {
                    callback(null, null);
                }
            }
        });
    }

    _proto.release = function(client, lockName, timeoutId, callback) {
        if(!client) {
            _log.connectionLog(3,
                'RedisConnector.release:: redis client is undefied');

            if(callback) {
                var _retErr = new Error('redis client is undefied');
                setTimeout(callback, 10, _retErr);
            }
            return;
        }
        var _lockName = 'lock.' + lockName;
        client.del(_lockName, function(err) {
            if(err) {
                _log.connectionLog(3,
                    'RedisConnector.release:: Release failure redis lock ' +
                    _lockName + ' : ' + err.message);

                if(callback) {
                    var _retErr = new Error('Failed to delete redis data');
                    callback(_retErr);
                }
            } else {
                _log.connectionLog(7,
                    'RedisConnector.release:: release the redis lock ' +
                    _lockName);

                if(timeoutId) {
                    clearTimeout(timeoutId);
                }
                if(callback) {
                    callback(null);
                }
            }
        });
    }

    function getInstance() {
        var _redisConnector = new RedisConnector();
        return _redisConnector;
    }

    exports.getInstance = getInstance;
})();
