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

    var db_type = "pg";
    var mysql = require('mysql');

    var PgConnector = require('./pg_connector');

    function AbstractDbConnector(dbConfig) {
        if(db_type === "pg") {
            this._dbConfig = dbConfig;
            this._pg = PgConnector.getInstance();
        }
        else {
            this._pool = mysql.createPool(dbConfig);
        }
    };

    var _proto = AbstractDbConnector.prototype;

    _proto.getConnection = function(onResultCallBack) {
        if(onResultCallBack == null || typeof onResultCallBack != 'function') {
            return false;
        }
        var _self = this;
        if(db_type === "pg") {
            _self._pg.getConnection(onResultCallBack);
        }
        else {
            _self._pool.getConnection(function(err, connection) {
                if(err){
                    onResultCallBack(err, null);
                    return;
                }
                onResultCallBack(null, connection);
            });
        }      
        return true;
    };
    _proto.getTransaction = function() {
        var _self = this;
        if(db_type === "pg") {
            var _tran = _self._pg.getTransaction();
            _self._pg.initTransactionSetting(_tran);
        }
        else {
            var _tran = mysql.createConnection(_self._dbConfig);
            _self.initTransactionSetting(_tran);
        }
        return _tran;
    };
    _proto.initTransactionSetting = function(transaction) {
        if(transaction == null || typeof transaction != 'object') {
            return false;
        }
        var _self = this;

        transaction.begin = function(callback) {
            transaction.query("SET autocommit=0", function(err, info) {
                if(err) {
                    callback(err);
                }
                else {
                    transaction.query("START TRANSACTION", function(err, info) {
                        if(err) {
                            callback(err);
                        }
                        else {
                            callback(null, info);
                        }
                    });
                }
            });
        }

        transaction.commit = function(callback) {
            transaction.query("COMMIT", function(err, info) {
                if(err) {
                    callback(err);
                }
                else {
                    transaction.query("SET autocommit=1", function(err, info) {
                        if(err) {
                            callback(err);
                        }
                        else {
                            callback(null, info);
                        }
                    });
                }
            });
        }

        transaction.rollback = function(callback) {
            transaction.query("ROLLBACK", function(err, info) {
                if(err) {
                    callback(err);
                }
                else {
                    transaction.query("SET autocommit=1", function(err, info) {
                        if(err) {
                            callback(err);
                        }
                        else {
                            callback(null, info);
                        }
                    });
                }
            });
        }
    };
    _proto.escapeSqlStr = function(sql) {
        return mysql.escape(sql);
    };

    exports.AbstractDbConnector = AbstractDbConnector;
})();
