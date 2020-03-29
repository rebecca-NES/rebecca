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
    var GlobalSNSManagerDbConnector = require('../DbHelper/global_sns_manager_db_connector');
    var ServerLog = require('../../controller/server_log');

    var _redisReception = RedisReception.getInstance();
    var _log = ServerLog.getInstance();

    function ReadCacheBeforeDBChef() {
    }

    var _proto = ReadCacheBeforeDBChef.prototype;

    _proto.cook = function(order, onResultCallBack) {
        var _self = this;

        var _dish = null;

        var _REDIS_DATA_TYPE = order.REDIS_DATA_TYPE;
        var _REDIS_KEY_NAME = order.REDIS_KEY_NAME;
        var _REDIS_FIELD_NAME = null;

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
                _dish = order.createDish(_REDIS_FIELD_NAME, data);
                if (_dish == null) {
                    _log.connectionLog(3,'Redis return invalid data');
                    onResultCallBack(new Error('Redis return invalid data'), null);
                    return;
                }
                onResultCallBack(null, _dish);
                return;
            }
            GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);

        }

        function _onGetConnectionCallBack(err, connection) {
            if (err) {
                _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetConnectionCallBack : ' + err.name + ": " + err.message);
                onResultCallBack(err, null);
                return;
            }

            var _sql = order.getSql();

            _log.connectionLog(7,'ReadCacheBeforeDBChef#_onGetConnectionCallBack _sql : ' + _sql);
            connection.query(_sql,_onGetDBData);

            function _onGetDBData(err, result) {
                connection.end( function(endErr) {
                    if (endErr) {
                        _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetDBData : DB disconect err :: ' + endErr);
                        onResultCallBack(new Error('DB disconect error has occured'), null);
                        return;
                    }
                    if (err) {
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

                    _log.connectionLog(7,'ReadCacheBeforeDBChef#_onGetDBData : Got data');
                    _dish = order.createDishByDBSource(_REDIS_FIELD_NAME, result);
                    if (_dish == null) {
                        _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetDBData : Could not cook. Cos DB return invalid data');
                        _log.connectionLog(3,'ReadCacheBeforeDBChef#_onGetDBData _sql : ' + _sql);
                        onResultCallBack(new Error('ReadCacheBeforeDBChef: Could not cook. Cos DB return invalid data'), null);
                        return;
                    }

                    _redisReception.doHset(_REDIS_KEY_NAME, _REDIS_FIELD_NAME, _dish.getData(), _onPutDataToRedis);

                    function _onPutDataToRedis(err) {
                        if (err) {
                            _log.connectionLog(3,'ReadCacheBeforeDBChef#_onPutDataToRedis Could not put data to Redis : ' + err.message);
                            onResultCallBack(err, null);
                            return;
                        }

                        _log.connectionLog(7,'ReadCacheBeforeDBChef#_onPutDataToRedis : Succeeded to put data to Redis');
                        onResultCallBack(null, _dish);
                    }
                });
            }
        }
    }

    var _readCacheBeforeDBChef = new ReadCacheBeforeDBChef();

    ReadCacheBeforeDBChef.getInstance = function() {
        return _readCacheBeforeDBChef;
    }

    exports.getInstance = ReadCacheBeforeDBChef.getInstance;

})();
