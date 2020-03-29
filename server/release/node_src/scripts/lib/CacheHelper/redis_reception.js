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
    var ServerLog = require('../../controller/server_log');
    var Conf = require('../../controller/conf');
    var RedisConnector = require('./redis_connector');

    var log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    function RedisReception() {
        var _self = this;

        var _lockTimeout = parseInt(_conf.getConfData('REDIS_LOCK_TIMEOUT'));
        if (isNaN(_lockTimeout)) {
            _lockTimeout = 5000;
            log.connectionLog(4,
                'RedisConnector: redis Lock Timeout Setting is nothing (REDIS_LOCK_TIMEOUT)');
        }
        var _timeout_retry_max_cnt = parseInt(_conf.getConfData('REDIS_LOCK_CHEK_RETRY_MAX_CNT'));
        if (isNaN(_timeout_retry_max_cnt)) {
            _timeout_retry_max_cnt = 10;
            log.connectionLog(4,
                'RedisReception: redis Connection Timeout Setting is nothing (REDIS_LOCK_CHEK_RETRY_MAX_CNT)');
        }
        var _timeout_retry_interval = parseInt(_conf.getConfData('REDIS_LOCK_CHEK_RETRY_INTERVAL'));
        if (isNaN(_timeout_retry_interval)) {
            _timeout_retry_interval = 500;
            log.connectionLog(4,
                'RedisReception: redis Connection Timeout Setting is nothing (REDIS_LOCK_CHEK_RETRY_INTERVAL)');
        }

        _self._spfRedisOptions = {
                 lock_timeout : _lockTimeout                        
                ,timeout_retry_max_cnt: _timeout_retry_max_cnt      
                ,timeout_retry_interval: _timeout_retry_interval    
        }
        _self._recipe = {};
        _self._error = null;
        _self._output = null;
    }

    var _RedisReception = new RedisReception();

    RedisReception.getInstance = function() {
        return _RedisReception;
    }

    exports.getInstance = RedisReception.getInstance;

    var _proto = RedisReception.prototype;

    _proto.doSetnxAndExpire = function(key, value, expireSec, onResultCallBack) {
        if(key == null || typeof key != 'string' || key == '') {
            log.connectionLog(3, 'RedisReception#doSetnxAndExpire Internal error. Invalid argument (key).');
            return false;
        }
        if(value == null || typeof value != 'string' || value == '') {
            log.connectionLog(3, 'RedisReception#doSetnxAndExpire Internal error. Invalid argument (value).');
            return false;
        }
        if(!expireSec || typeof expireSec != 'number' ) {
            log.connectionLog(3, 'RedisReception#doSetnxAndExpire Internal error. Invalid argument (expireSec).');
            return false;
        }
        if(onResultCallBack == null || typeof onResultCallBack != 'function') {
            log.connectionLog(3, 'RedisReception#doSetnxAndExpire Internal error. Argument is invalid (callback).');
            return false;
        }
        var _self = this;
        var _redisClient = RedisConnector.getInstance().getRedisClient();

        function _doSetnxAndExpire_setnx() {
            log.connectionLog(7, 'RedisReception#_doSetnxAndExpire_setnx: ' + key + ', expireSec: ' + expireSec + ', value: ' + value);
            _redisClient.setnx([key, value], _doSetnxAndExpire_expire);
        }
        function _doSetnxAndExpire_expire(err, result) {
            if (err) {
                log.connectionLog(7, 'RedisReception#_doSetnxAndExpire_expire: setnx failed error: ' + err);
                onResultCallBack(err, null);
                return;
            }
            if (result === 0) {
                log.connectionLog(7, 'RedisReception#_doSetnxAndExpire_expire: setnx results not to set');
                onResultCallBack(null, result);
                return;
            }
            _redisClient.expire([key, expireSec], _doSetnxAndExpire_complete);
        }
        function _doSetnxAndExpire_complete(err, result) {
            if (err) {
                log.connectionLog(7, 'RedisReception#_doSetnxAndExpire_complete: expire failed error: ' + err);
                onResultCallBack(err, null);
                return;
            }
            log.connectionLog(7, 'RedisReception#_doSetnxAndExpire_complete');
            onResultCallBack(null, null);
        }

        _doSetnxAndExpire_setnx();
        return true;
    }

    _proto.doHget = function(key, field, onResultCallBack) {
        if(key == null || typeof key != 'string' || key == '') {
            log.connectionLog(3,
                'RedisReception#doHget Internal error. Invalid argument (key).');
            return false;
        }
        if(field == null || typeof field != 'string' || field == '') {
            log.connectionLog(3,
                'RedisReception#doHget Internal error. Invalid argument (field).');
            return false;
        }
        if(onResultCallBack == null || typeof onResultCallBack != 'function') {
            log.connectionLog(3,
                'RedisReception#doHget Internal error. Argument is invalid (callback).');
            return false;
        }
        var _self = this;
        var _redisClient = RedisConnector.getInstance().getRedisClient();

        function _doHget_hget() {
            log.connectionLog(7, 'RedisReception#_doHget_hget');
            _redisClient.hget([key, field], _doHget_complete);
        }
        function _doHget_complete(err, result) {
            if (err) {
                log.connectionLog(7, 'RedisReception#_doHget_complete: hget failed error: ' + err);
                onResultCallBack(err, null);
                return;
            }
            log.connectionLog(7, 'RedisReception#_doHget_complete');
            onResultCallBack(null, result);
        }

        _doHget_hget();
        return true;
    }

    _proto.doDel = function(key, onResultCallBack) {
        if(key == null || typeof key != 'string' || key == '') {
            log.connectionLog(3,
                'RedisReception#doHget Internal error. Invalid argument (key).');
            return false;
        }
        if(onResultCallBack == null || typeof onResultCallBack != 'function') {
            log.connectionLog(3,
                'RedisReception#doHget Internal error. Argument is invalid (callback).');
            return false;
        }
        var _self = this;
        var _redisClient = RedisConnector.getInstance().getRedisClient();

        function _doDel_del() {
            log.connectionLog(7, 'RedisReception#_doDel_del');
            _redisClient.del(key, _doDel_complete);
        }
        function _doDel_complete(err, result) {
            if (err) {
                log.connectionLog(7, 'RedisReception#_doDel_complete: hget failed error: ' + err);
                onResultCallBack(err, null);
                return;
            }
            log.connectionLog(7, 'RedisReception#_doDel_complete');
            onResultCallBack(null, result);
        }

        _doDel_del();
        return true;
    }

    _proto.doExpire = function(key, expireSec, onResultCallBack) {
        if(key == null || typeof key != 'string' || key == '') {
            log.connectionLog(3,
                'RedisReception#doExpire Internal error. Invalid argument (key).');
            return false;
        }
        if(onResultCallBack == null || typeof onResultCallBack != 'function') {
            log.connectionLog(3,
                'RedisReception#doExpire Internal error. Argument is invalid (callback).');
            return false;
        }
        var _self = this;
        var _redisClient = RedisConnector.getInstance().getRedisClient();

        function _doExpire_expire() {
            log.connectionLog(7, 'RedisReception#_doExpire_expire');
            _redisClient.expire([key, expireSec], _doExpire_complete);
        }
        function _doExpire_complete(err, result) {
            if (err) {
                log.connectionLog(7, 'RedisReception#_doDel_complete: hget failed error: ' + err);
                onResultCallBack(err, null);
                return;
            }
            if (result !== 1) {
                log.connectionLog(4, 'RedisReception#_doDel_complete: expire command results not 1. Maybe redis server is restarted and CubeeProxy send it to me.');
            }
            log.connectionLog(7, 'RedisReception#_doExpire_complete');
            onResultCallBack(null, result);
        }

        _doExpire_expire();
        return true;
    }

    _proto.doHset = function(key, field, value, onResultCallBack) {
        if(key == null || typeof key != 'string' || key == '') {
            log.connectionLog(3, 'RedisReception#doHset Internal error. Invalid argument (key).');
            return false;
        }
        if(field == null || typeof field != 'string' || field == '') {
            log.connectionLog(3, 'RedisReception#doHset Internal error. Invalid argument (field).');
            return false;
        }
        if(value == null || typeof value != 'string' || value == '') {
            log.connectionLog(3, 'RedisReception#doHset Internal error. Invalid argument (value).');
            return false;
        }
        if(onResultCallBack == null || typeof onResultCallBack != 'function') {
            log.connectionLog(3, 'RedisReception#doHset Internal error. Argument is invalid (onResultCallBack).');
            return false;
        }
        var _self = this;
        var _redisClient = RedisConnector.getInstance().getRedisClient();

        var _lockName = 'lock.' + key;
        var _timeoutId = null;
        var _retry_cnt = 0;

        function _doHset_lock() {
            log.connectionLog(7, 'RedisReception#_doHset_lock redis Lock');

            var _lockTimeout = _self._spfRedisOptions.lock_timeout;
            var _unixLockTimeout = (_lockTimeout + 1) * 10;
            var _releaseTime = (new Date().getTime() + _unixLockTimeout);

            _redisClient.setnx(_lockName, _releaseTime, _onAcquireLock);

            function _onAcquireLock(err, exists) {
                if(err) {
                    log.connectionLog(3,
                        'RedisReception#_doHset_lock _onAcquireLock redis lock error : ' +
                        err.message);
                    onResultCallBack(new Error('Failed to acquire lock by redis'), null);
                    return;
                }
                if(exists !== 1) {
                    _redisClient.get(_lockName, _onCheckLockTimeout);
                    return;
                }
                log.connectionLog(7,
                    'RedisReception#_doHset_lock _onAcquireLock redis lock succeeded. lock-key: ' +
                    _lockName);
                _timeoutId = setTimeout(_onLockTimeout, _lockTimeout);
                _redisClient.hset([key, field, value], _doHset_release);
            }
            function _onLockTimeout() {
                _timeoutId = null;
                _redisClient.del(_lockName, function(err, res) {
                    if (err) {
                        log.connectionLog(3,
                            'RedisReception#_doHset_lock _onLockTimeout Failed to del redis lock-key: ' +
                            _lockName + ' : ' + err.message);
                    }
                    if (res === 1) {
                        log.connectionLog(4,
                            'RedisReception#_doHset_lock _onLockTimeout Writing to redis is timed-out. lock-key: ' +
                            _lockName);
                    }
                });
            }
            function _onCheckLockTimeout(err, timeout) {
                if (err) {
                    log.connectionLog(3,
                        'RedisReception#_doHset_lock _onCheckLockTimeout redis error : ' +
                        err.message);
                    onResultCallBack(new Error('Failed to get or del redis data'), null);
                    return;
                }
                var _unixTime = new Date().getTime();
                if (timeout==null || (typeof timeout == 'number' && timeout <= 1) ) {
                } else if (parseInt(timeout) && _unixTime <= parseInt(timeout) && parseInt(timeout) <= _releaseTime) {
                }　else {
                    log.connectionLog(4,
                        'RedisReception#_doHset_lock _onCheckLockTimeout lock-key(' + _lockName + ') is going to be deleted.');
                    _redisClient.del(_lockName, _onCheckLockTimeout);
                    return;
                }

                _retry_cnt+= 1;
                if (_self._spfRedisOptions.timeout_retry_max_cnt <= _retry_cnt) {
                    log.connectionLog(3,
                        'RedisReception#_doHset_lock _checkTimeout Too long waiting to get lock, I can not no longer wait. lock-key: ' +
                        _lockName);
                    onResultCallBack(new Error('Lock has never released in this cooking.'), null);
                    return;
                }
                setTimeout( function(){ _doHset_lock(); }, _self._spfRedisOptions.timeout_retry_interval);
                return;
            }
        }
        function _doHset_release(err, result) {
            if (err) {
                log.connectionLog(7, 'RedisReception#_doHset_release: hset failed error: ' + err);
                onResultCallBack(err, null);
                return;
            }
            log.connectionLog(7, 'RedisReception#_doHset_release');

            function _release() {
                if(!_timeoutId) {
                    log.connectionLog(4,
                        'RedisReception#_doHset_release _release Timeout has occured. key-name: ' +
                        _lockName);
                    onResultCallBack(err, null);
                    return;
                }
                clearTimeout(_timeoutId);
                _redisClient.del(_lockName, function(err) {
                    if (err) {
                        log.connectionLog(3, 'RedisReception#_doHset_release _release Failed to release redis lock('
                            + _lockName + ')' + err.message);
                        onResultCallBack(new Error('Failed to release redis lock(' + _lockName + ')'), null);
                        return;
                    }
                    onResultCallBack(null, null);
                });
            }

            _release();
        }

        _doHset_lock();
        return true;
    }

})();