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
    var RedisReception = require('./redis_reception');
    var ServerLog = require('../../controller/server_log');
    var SessionDataMannager = require('../../controller/session_data_manager');
    var Conf = require('../../controller/conf');

    var _redisReception = RedisReception.getInstance();
    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    function StoreVolatileChef() {
        var _timeout_a = parseInt(_conf.getConfData('KEEP_SESSION_DATA_TIME_AFTER_DISCONNECT'));
        var _timeout_b = parseInt(_conf.getConfData('REDIS_VOLATILE_SECONDS'));
        this.EXPIRE_SEC = _timeout_a + _timeout_b;

    }

    var _proto = StoreVolatileChef.prototype;

    _proto.store = function(dish, onResultCallBack) {
        if (onResultCallBack == null || typeof onResultCallBack != 'function') {
            _log.connectionLog(3,'StoreVolatileChef#store : Internal Error. Incorrect argument (onResultCallBack) ');
            return;
        }
        if (dish == null || typeof dish != 'object') {
            _log.connectionLog(3,'StoreVolatileChef#store : Internal Error. Incorrect argument (dish) ');
            onResultCallBack(new Error('Internal Error. Incorrect argument '));
            return;
        }
        var _sessionDataManager = SessionDataMannager.getInstance();
        var _self = this;

        function _callRedisReceptionToStore() {
            var _newKey = _sessionDataManager.createUniqueAccessToken();
            dish.setKeyName(_newKey);
            _redisReception.doSetnxAndExpire(dish.getKeyName(), dish.getData(), _self.EXPIRE_SEC, _onStoreToRedis);
        }

        function _onStoreToRedis(err, exists) {
            if (err) {
                _log.connectionLog(3,'StoreVolatileChef#store#_onStoreToRedis : ' + err.message);
                onResultCallBack(new Error('Faild to store data to redis'));
                return;
            }
            if (exists === 0) {
                _log.connectionLog(3,'StoreVolatileChef#store#_onStoreToRedis Same key is already exist. Retrying..');
                setTimeout(_callRedisReceptionToStore, 10);
                return;
            }
            _log.connectionLog(7,'StoreVolatileChef#store#_onStoreToRedis stored! ' + dish.getKeyName() + ' = ' + dish.getData());
            onResultCallBack(null, dish);
        }

        setTimeout(_callRedisReceptionToStore, 10);
    }

    _proto.discard = function(key, onResultCallBack) {
        if (onResultCallBack == null || typeof onResultCallBack != 'function') {
            _log.connectionLog(7,'StoreVolatileChef#discard : Do not mind about no callback');
        }
        if (key == null || typeof key != 'string') {
            _log.connectionLog(3,'StoreVolatileChef#discard : Internal Error. Incorrect argument (key) ');
            return;
        }

        function _onDiscardOnRedis(err, result) {
            if (err) {
                _log.connectionLog(3,'StoreVolatileChef#discard#_onDiscardOnRedis : ' + err.message);
                if (onResultCallBack) {
                    onResultCallBack(new Error('Faild to discard data on redis'));
                }
                return;
            }

            _log.connectionLog(7,'StoreVolatileChef#discard#_onDiscardOnRedis discard! key: ' + key);
            if (onResultCallBack) {
                onResultCallBack(null);
            }
        }

        _redisReception.doDel(key, _onDiscardOnRedis);

    }

    _proto.extend = function(key, onResultCallBack) {
        if (onResultCallBack == null || typeof onResultCallBack != 'function') {
            _log.connectionLog(7,'StoreVolatileChef#extend : Do not mind about no callback');
        }
        if (key == null || typeof key != 'string') {
            _log.connectionLog(3,'StoreVolatileChef#extend : Internal Error. Incorrect argument (key) ');
            return;
        }
        var _self = this;

        function _onExpireOnRedis(err, result) {
            if (err) {
                _log.connectionLog(3,'StoreVolatileChef#extend#_onExpireOnRedis : ' + err.message);
                if (onResultCallBack) {
                    onResultCallBack(new Error('Faild to extend data on redis'));
                }
                return;
            }

            _log.connectionLog(7,'StoreVolatileChef#extend#_onExpireOnRedis extend! key: ' + key);
            if (onResultCallBack) {
                onResultCallBack(null);
            }
        }

        _redisReception.doExpire(key, _self.EXPIRE_SEC, _onExpireOnRedis);

    }

    var _storeVolatileChef = new StoreVolatileChef();

    StoreVolatileChef.getInstance = function() {
        return _storeVolatileChef;
    }

    exports.getInstance = StoreVolatileChef.getInstance;

})();
