(function() {
    var RedisReception = require('./redis_reception');
    var GlobalSNSManagerDbConnector = require('../DbHelper/global_sns_manager_db_connector');
    var ServerLog = require('../../controller/server_log');

    var _redisReception = RedisReception.getInstance();
    var _log = ServerLog.getInstance();

    /**
    * Cache(redis) から 指定されたデータを読み出す。存在しなければ、DBから読み出し、Cache（redisに登録）する
    */
    function ReadCacheBeforeDBChef() {
    }

    var _proto = ReadCacheBeforeDBChef.prototype;

    /**
    *  注文を調理する
    * @param {TenantData} order 注文
    * @param {callback function} onResultCallBack コールバック
    */
    _proto.cook = function(order, onResultCallBack) {
        var _self = this;

        // 返却用
        var _dish = null;

        // order から 読み出す
        var _REDIS_DATA_TYPE = order.REDIS_DATA_TYPE;
        var _REDIS_KEY_NAME = order.REDIS_KEY_NAME;
        var _REDIS_FIELD_NAME = null;

        // DATA_TYPE, KEY_NAME によって調理を制限
        switch(_REDIS_DATA_TYPE) {
            case 'hash':
                _REDIS_FIELD_NAME = order.getFieldName();
                _log.connectionLog(7,
                    'ReadCacheBeforeDBChef#cook : Start cooking (' +
                    _REDIS_KEY_NAME + ' ' + _REDIS_FIELD_NAME + ')');

                _redisReception.doHget(_REDIS_KEY_NAME, _REDIS_FIELD_NAME, _onReadDataFromRedis);
                break;
            default:
                _log.connectionLog(4,
                    'Internal error: not supported type [' + _REDIS_DATA_TYPE + ']');
                onResultCallBack(new Error('Internal error: not supported type'), null);
                return;
        }

        function _onReadDataFromRedis(err, data) {
            if (err) {
                _log.connectionLog(3,'ReadCacheBeforeDBChef#_onReadDataFromRedis : ' + err.message);
                onResultCallBack(new Error('Faild to read data from redis'), null);
                return;
            }
            if (data) {
                // 読めれば、
                // dish に入れてコールバックを呼び出しておわり
                _dish = order.createDish(_REDIS_FIELD_NAME, data);
                if (_dish == null) {
                    _log.connectionLog(3,'Redis return invalid data');
                    onResultCallBack(new Error('Redis return invalid data'), null);
                    return;
                }
                onResultCallBack(null, _dish);
                return;
            }
            // 読めなければ
            // DBに接続して読み出す
            GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);

        }

        // コールバック： DBのコネクションを得たとき
        function _onGetConnectionCallBack(err, connection) {
            if (err) {
                _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetConnectionCallBack : ' + err.name + ": " + err.message);
                onResultCallBack(err, null);
                return;
            }

            var _sql = order.getSql();

            _log.connectionLog(7,'ReadCacheBeforeDBChef#_onGetConnectionCallBack _sql : ' + _sql);
            connection.query(_sql,_onGetDBData);

            // コールバック： DBデータを得たとき
            function _onGetDBData(err, result) {
                // コネクション切断
                connection.end( function(endErr) {
                    if (endErr) {
                        // コネクション切断時のエラー
                        _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetDBData : DB disconect err :: ' + endErr);
                        onResultCallBack(new Error('DB disconect error has occured'), null);
                        return;
                    }
                    if (err) {
                        // DB情報取得失敗時
                        _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetDBData : ' + err.name + ": " + err.message);
                        _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetDBData _sql : ' + _sql);
                        onResultCallBack(err, null);
                        return;
                    }
                    if (!result || result.length == 0) {
                        _log.connectionLog(4,'ReadCacheBeforeDBChef#_onGetDBData : Could not get db data');
                        _log.connectionLog(4,'ReadCacheBeforeDBChef#_onGetDBData _sql : ' + _sql);
                        onResultCallBack(new Error('ReadCacheBeforeDBChef: Could not get db data'), null);
                        return;
                    }

                    // 調理結果生成
                    _log.connectionLog(7,'ReadCacheBeforeDBChef#_onGetDBData : Got data');
                    _dish = order.createDishByDBSource(_REDIS_FIELD_NAME, result);
                    if (_dish == null) {
                        _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetDBData : Could not cook. Cos DB return invalid data');
                        _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetDBData _sql : ' + _sql);
                        onResultCallBack(new Error('ReadCacheBeforeDBChef: Could not cook. Cos DB return invalid data'), null);
                        return;
                    }

                    // 読めれば、redis に登録
                    _redisReception.doHset(_REDIS_KEY_NAME, _REDIS_FIELD_NAME, _dish.getData(), _onPutDataToRedis);

                    // コールバック：
                    function _onPutDataToRedis(err) {
                        if (err) {
                            _log.connectionLog(3,'ReadCacheBeforeDBChef#_onPutDataToRedis Could not put data to Redis : ' + err.message);
                            onResultCallBack(err, null);
                            return;
                        }

                        // コールバックを呼び出しておしまい
                        _log.connectionLog(7,'ReadCacheBeforeDBChef#_onPutDataToRedis : Succeeded to put data to Redis');
                        onResultCallBack(null, _dish);
                    }
                });
            }
        }
    }

    // インスタンス生成
    var _readCacheBeforeDBChef = new ReadCacheBeforeDBChef();

    // シングルトン実装
    ReadCacheBeforeDBChef.getInstance = function() {
        return _readCacheBeforeDBChef;
    }

    exports.getInstance = ReadCacheBeforeDBChef.getInstance;

})();
