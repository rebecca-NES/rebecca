(function() {
    var RedisReception = require('./redis_reception');
    var ServerLog = require('../../controller/server_log');
    var SessionDataMannager = require('../../controller/session_data_manager');
    // 設定ファイルの読み込み
    var Conf = require('../../controller/conf');

    var _redisReception = RedisReception.getInstance();
    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    /**
    * Cache(redis) に指定したデータを書きだす。また揮発性を持たせる
    */
    function StoreVolatileChef() {
        var _timeout_a = parseInt(_conf.getConfData('KEEP_SESSION_DATA_TIME_AFTER_DISCONNECT'));
        var _timeout_b = parseInt(_conf.getConfData('REDIS_VOLATILE_SECONDS'));
        this.EXPIRE_SEC = _timeout_a + _timeout_b;

    }

    var _proto = StoreVolatileChef.prototype;

    /**
    *  保存する
    * @param {AccessRelationData} dish
    * @param {callback function} onResultCallBack コールバック パラメータは、 err, dish
    */
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

        // Redis に 登録
        function _callRedisReceptionToStore() {
            // Generate New Key in itself
            var _newKey = _sessionDataManager.createUniqueAccessToken();
            dish.setKeyName(_newKey);
            // Store it!
            _redisReception.doSetnxAndExpire(dish.getKeyName(), dish.getData(), _self.EXPIRE_SEC, _onStoreToRedis);
        }

        // 登録処理の結果
        function _onStoreToRedis(err, exists) {
            if (err) {
                _log.connectionLog(3,'StoreVolatileChef#store#_onStoreToRedis : ' + err.message);
                onResultCallBack(new Error('Faild to store data to redis'));
                return;
            }
            if (exists === 0) {
                // キー重複していた
                // 0: if the key was not set
                _log.connectionLog(3,'StoreVolatileChef#store#_onStoreToRedis Same key is already exist. Retrying..');
                setTimeout(_callRedisReceptionToStore, 10);
                return;
            }
            _log.connectionLog(7,'StoreVolatileChef#store#_onStoreToRedis stored! ' + dish.getKeyName() + ' = ' + dish.getData());
            onResultCallBack(null, dish);
        }

        setTimeout(_callRedisReceptionToStore, 10);
    }

    /**
    *  捨てる
    * @param {string} key 削除するキー
    * @param {callback function} onResultCallBack コールバック パラメータは、 err （任意）
    */
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

        // Redis から破棄する
        _redisReception.doDel(key, _onDiscardOnRedis);

    }

    /**
    *  温めなおす
    * @param {string} key 時限を延長するキー
    * @param {callback function} onResultCallBack コールバック パラメータは、 err （任意）
    */
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

        // Redis のキーの揮発を延長する
        _redisReception.doExpire(key, _self.EXPIRE_SEC, _onExpireOnRedis);

    }

    // インスタンス生成
    var _storeVolatileChef = new StoreVolatileChef();

    // シングルトン実装
    StoreVolatileChef.getInstance = function() {
        return _storeVolatileChef;
    }

    exports.getInstance = StoreVolatileChef.getInstance;

})();
