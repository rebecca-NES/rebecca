(function() {
    // ログ出力モジュールの読み込み
    var ServerLog = require('../../controller/server_log');
    // 共通設定ファイルの読み込み
    var Conf = require('../../controller/conf');
    // redis_connectorの読み込み
    var RedisConnector = require('./redis_connector');

    var log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    // コンストラクタ
    function RedisReception() {
        var _self = this;

        // 接続設定
        var _lockTimeout = parseInt(_conf.getConfData('REDIS_LOCK_TIMEOUT'));
        if (isNaN(_lockTimeout)) {
            // デフォルトtimeout値 5sec
            _lockTimeout = 5000;
            log.connectionLog(4,
                'RedisConnector: redis Lock Timeout Setting is nothing (REDIS_LOCK_TIMEOUT)');
        }
        var _timeout_retry_max_cnt = parseInt(_conf.getConfData('REDIS_LOCK_CHEK_RETRY_MAX_CNT'));
        if (isNaN(_timeout_retry_max_cnt)) {
            // デフォルト
            _timeout_retry_max_cnt = 10;
            log.connectionLog(4,
                'RedisReception: redis Connection Timeout Setting is nothing (REDIS_LOCK_CHEK_RETRY_MAX_CNT)');
        }
        var _timeout_retry_interval = parseInt(_conf.getConfData('REDIS_LOCK_CHEK_RETRY_INTERVAL'));
        if (isNaN(_timeout_retry_interval)) {
            // デフォルト
            _timeout_retry_interval = 500;
            log.connectionLog(4,
                'RedisReception: redis Connection Timeout Setting is nothing (REDIS_LOCK_CHEK_RETRY_INTERVAL)');
        }

        // Cubeeとしてのオプション
        _self._spfRedisOptions = {
                 lock_timeout : _lockTimeout                        // ロック時のタイムアウト秒数
                ,timeout_retry_max_cnt: _timeout_retry_max_cnt      // Redis の既ロックをチェックするリトライ上限回数
                ,timeout_retry_interval: _timeout_retry_interval    // Redis の既ロックをチェックするリトライ間隔（秒）
        };
        // 個別アクション設定
        _self._recipe = {};
        _self._error = null;
        _self._output = null;
    }

    var _RedisReception = new RedisReception();

    /**
    * シングルトン実装
    */
    RedisReception.getInstance = function() {
        return _RedisReception;
    }

    exports.getInstance = RedisReception.getInstance;

    var _proto = RedisReception.prototype;

    /**
     * Hash Redisに指定キーで値を設定する
     * @param {string} key キー名
     * @param {string} value 値
     * @param {number} expireSec 揮発秒
     * @param {function} onResultCallBack 実行結果後のコールバック。引数は err, string
     * @return {boolean} true : 処理成功 / false : 処理失敗
     */
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
                // 0: if the key was not set
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

    /**
     * Hash キーの指定フィールドの値をRedisから取得する
     * @param {string} key キー名
     * @param {string} field フィールド名
     * @param {function} onResultCallBack 実行結果後のコールバック。引数は err, string
     * @return {boolean} true : 処理成功 / false : 処理失敗
     */
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

    /**
     * キーの削除を行う
     * @param {string} key キー名
     * @param {function} onResultCallBack 実行結果後のコールバック。引数は err, string
     * @return {boolean} true : 処理成功 / false : 処理失敗
     */
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

    /**
     * キーの揮発時間を設定する（更新する）
     * @param {string} key キー名
     * @param {number} expireSec 揮発秒
     * @param {function} onResultCallBack 実行結果後のコールバック。引数は err, string
     * @return {boolean} true : 処理成功 / false : 処理失敗
     */
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
                // 1 if the timeout was set.
                // 0 if key does not exist or the timeout could not be set.
                log.connectionLog(4, 'RedisReception#_doDel_complete: expire command results not 1. Maybe redis server is restarted and CubeeProxy send it to me.');
            }
            log.connectionLog(7, 'RedisReception#_doExpire_complete');
            onResultCallBack(null, result);
        }

        _doExpire_expire();
        return true;
    }

    /**
     * Hash Redisのキーの指定フィールドに値を設定する
     * @param {string} key キー名
     * @param {string} field フィールド名
     * @param {string} value 値
     * @param {function} onResultCallBack 実行結果後のコールバック。引数は err, string
     * @return {boolean} true : 処理成功 / false : 処理失敗
     */
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

            // redis ロックのタイムアウト時間
            var _lockTimeout = _self._spfRedisOptions.lock_timeout;
            var _unixLockTimeout = (_lockTimeout + 1) * 10;
            var _releaseTime = (new Date().getTime() + _unixLockTimeout);

            _redisClient.setnx(_lockName, _releaseTime, _onAcquireLock);

            function _onAcquireLock(err, exists) {
                if(err) {
                    // redis の接続を解除する
                    log.connectionLog(3,
                        'RedisReception#_doHset_lock _onAcquireLock redis lock error : ' +
                        err.message);
                    onResultCallBack(new Error('Failed to acquire lock by redis'), null);
                    return;
                }
                if(exists !== 1) {
                    // 既にロックされていた場合、そのキーの値（ロック解放予定時刻）を取得する
                    _redisClient.get(_lockName, _onCheckLockTimeout);
                    return;
                }
                // ロックに成功した場合
                log.connectionLog(7,
                    'RedisReception#_doHset_lock _onAcquireLock redis lock succeeded. lock-key: ' +
                    _lockName);
                // 自ロック解除のタイムアウト設定
                _timeoutId = setTimeout(_onLockTimeout, _lockTimeout);
                // 次の処理:
                // 値を設定する
                _redisClient.hset([key, field, value], _doHset_release);
            }
            /// 自分の処理がタイムアウトした場合。異常系の処理。
            function _onLockTimeout() {
                _timeoutId = null;
                // すでに削除されていれば、err にはならない。integer 0 が返る
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
                    // DO NOTHING (DO NOT CALLBACK)
                });
            }
            /// 既にロックされていた場合の処理。
            /// 他者の異常終了があった場合、残存しているロックの timeout 時間をチェックする
            function _onCheckLockTimeout(err, timeout) {
                if (err) {
                    // *CASE1: 異常系
                    log.connectionLog(3,
                        'RedisReception#_doHset_lock _onCheckLockTimeout redis error : ' +
                        err.message);
                    onResultCallBack(new Error('Failed to get or del redis data'), null);
                    return;
                }
                var _unixTime = new Date().getTime();
                if (timeout==null || (typeof timeout == 'number' && timeout <= 1) ) {
                    // *CASE2: 他者もしくは自分で解放したと考える ロックのリトライ
                    // timeout meanings: if "get" command
                    //   指定したキー key に対応する値
                    //   キーが存在しなかったら特別な値 “nil”
                    // timeout meanings: if "del" command
                    //   an integer greater than 0 if one or more keys were removed
                    //   0 if none of the specified key existed
                    // DO NOTHING
                } else if (parseInt(timeout) && _unixTime <= parseInt(timeout) && parseInt(timeout) <= _releaseTime) {
                    // *CASE3: 他者のロックをもうちょっと待たなければいけない
                    // DO NOTHING
                }　else {
                    // *CASE4: timeout 時間を過ぎているか、異常値のためロックキーを削除する
                    // _releaseTime よりも大きな値が lock設定されていることはあり得ない
                    log.connectionLog(4,
                        'RedisReception#_doHset_lock _onCheckLockTimeout lock-key(' + _lockName + ') is going to be deleted.');
                    _redisClient.del(_lockName, _onCheckLockTimeout);
                    // この関数に帰ってきて、"CASE2" に入る
                    return;
                }

                // 上限回数に達するまではリトライする
                _retry_cnt+= 1;
                if (_self._spfRedisOptions.timeout_retry_max_cnt <= _retry_cnt) {
                    // *CASE5: リトライ上限までリトライしたが、ロックが解放されなかった
                    log.connectionLog(3,
                        'RedisReception#_doHset_lock _checkTimeout Too long waiting to get lock, I can not no longer wait. lock-key: ' +
                        _lockName);
                    onResultCallBack(new Error('Lock has never released in this cooking.'), null);
                    return;
                }
                // リトライ
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
                // ロックを解放
                _redisClient.del(_lockName, function(err) {
                    if (err) {
                        // 自分のロックを解放できなかった異常系。自分では何もできない。
                        // 次のアクセス者が、ロックの有効期限を見て、削除するまでアクセスできない状態になる。
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
