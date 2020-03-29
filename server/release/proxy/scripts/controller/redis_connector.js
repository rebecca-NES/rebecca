(function() {
    var Conf      = require('./conf');
    var ServerLog = require('./server_log');
    var redis     = require('redis');

    // confクラスインスタンス取得
    var _conf = Conf.getInstance();

    // ServerLogクラスインスタンス取得
    var _log = ServerLog.getInstance();

    // 定数定義
    var CONF_KEY_REDIS_PORT = 'REDIS_PORT';
    var CONF_KEY_REDIS_SERVER_HOST = 'REDIS_SERVER_HOST';
    var CONF_KEY_REDIS_PW = 'REDIS_PW';
    var CONF_KEY_REDIS_CONNECT_TIMEOUT = 'REDIS_CONNECT_TIMEOUT';
    var CONF_KEY_REDIS_LOCK_TIMEOUT = 'REDIS_LOCK_TIMEOUT';

    function RedisConnector() {
    }

    var _proto = RedisConnector.prototype;

    /*
     * redis 接続設定
     * @param {function} redis接続後にclientを渡すコールバック
     */
    _proto.createRedisClient = function(callback) {
        _log.connectionLog(7, 'RedisConnector.createRedisClient:: create redis client');

        // redis に接続
        var _port = parseInt(_conf.getConfData(CONF_KEY_REDIS_PORT));
        if (isNaN(_port)) {
            // デフォルトポート番号
            _port = 6379;

            _log.connectionLog(4,
                'RedisConnector.createRedisClient:: redis Port Setting is nothing');
        }
        var _host = _conf.getConfData(CONF_KEY_REDIS_SERVER_HOST);
        if (!_host) {
            // デフォルトホスト
            _host = "localhost";

            _log.connectionLog(4,
                'RedisConnector.createRedisClient:: redis Host Setting is nothing');
        }
        var _timeout = parseInt(_conf.getConfData(CONF_KEY_REDIS_CONNECT_TIMEOUT));
        if (isNaN(_timeout)) {
            // デフォルトtimeout値 2sec
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
        // redis 認証
        var _password = _conf.getConfData(CONF_KEY_REDIS_PW);
        if (!_password) {
            // デフォルトタイムアウト
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

    /*
     * redis を切断
     * @param {client} redis クライアント
     */
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

    /*
     * redis を lock
     * @param {client} client redis クライアント
     * @param {String} lockName ロック名
     * @param {Number} lockTimeout タイムアウト時間 （省略可能パラメータ ： デフォルト5000（5 sec））
     * @param {function} callback ロック後のコールバック
     */
    _proto.acquireLock = function(client, lockName, lockTimeout, callback) {
        if(!callback) {
            // 引数のtimeout が省略されていた場合、引数の付け替え
            callback = lockTimeout;
            lockTimeout = _conf.getConfData(CONF_KEY_REDIS_LOCK_TIMEOUT);
            if (isNaN(lockTimeout)) {
                // デフォルトtimeout値 5sec
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

        // redis ロック名を生成
        var _lockName = 'lock.' + lockName;
        // redis ロックのタイムアウト時間
        var _unixLockTimeout = (lockTimeout + 1) * 10;
        var _releaseTime = (new Date().getTime() + _unixLockTimeout);
        var _timeoutId = null;

        // ロックを取得
        client.setnx(_lockName, _releaseTime, function(err, exists){
            if(err) {
                _log.connectionLog(3,
                    'RedisConnector.acquireLock:: redis error : ' +
                    err.message);

                var _retErr = new Error('Failed to acquire lock by redis');
                callback(_retErr, null);
            }
            if(exists == 1) {
                // ロックに成功した場合
                _log.connectionLog(7,
                    'RedisConnector.acquireLock:: redis lock successfull : ' +
                    _lockName);
                // タイムアウト設定
                _timeoutId = setTimeout(function() {
                    // タイムアウトしたらロックを解放して redis を切断
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
                // 既にロックされていた場合
                _self._checkTimeout(client, lockName, lockTimeout, callback);
            }
        });
    }

    /*
     * 異常終了などで timeout 時間を過ぎて lock が残っていないか確認
     * @param {client} client redis クライアント
     * @param {String} lockName ロック名
     * @param {Number} lockTimeout タイムアウト時間
     * @param {function} callback ロック中であった場合に呼び出すコールバック
     */
    _proto._checkTimeout = function(client, lockName, lockTimeout, callback) {
        var _self = this;

        // redis ロック名を生成
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
                    // ロックが timeout 時間を過ぎているので解放
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

                            // redis lock を再試行
                            _self.acquireLock(client, lockName,
                                              lockTimeout, callback);
                        }
                    });
                } else {
                    // 他でロック中のため、取得失敗
                    callback(null, null);
                }
            }
        });
    }

    /*
     * ロックを解放
     * @param {client} client redis クライアント
     * @param {String} lockName ロック名
     * @param {String} timeoutId タイムアウトID
     * @param {function} callback ロック解放後のコールバック（任意）
     */
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
        // redis ロック名を生成
        var _lockName = 'lock.' + lockName;
        // ロックを解放
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
