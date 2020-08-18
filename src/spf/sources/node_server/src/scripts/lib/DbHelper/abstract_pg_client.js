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

    var Client = require('pg').Client;

    var ServerLog = require('../../controller/server_log');

    var _client;

    var _log = ServerLog.getInstance();

    function AbstractPgClient() {
    };

    var _proto = AbstractPgClient.prototype;

    _proto.initTransactionSetting = function(dbConfig) {
        this._client = new Client(dbConfig);
        this._client.connect();
    };

    _proto.begin = function(callback) {
        var _self = this;
        _self._client.query("BEGIN", function(err, result) {
            _log.connectionLog(7, 'begin');
            if(err) {
                callback(err);
            }
            else {
                callback(null, result);
            }
        });
    };

    _proto.commit = function(callback) {
        var _self = this;
        _self._client.query("COMMIT", _self._client.end.bind(_self._client));
        _log.connectionLog(7, 'commit');
        callback(null, null);
    };

    _proto.rollback = function(callback) {
        var _self = this;
        _self._client.query("ROLLBACK", function() {
            _log.connectionLog(7, 'rollback');
            callback(null, null);
            _self._client.end();
        });
    };

    _proto.query = function(sql, onSqlResultCallBack) {
        var _self = this;
        _self._client.query(sql, function(err, result) {
            if(err) {
                onSqlResultCallBack(err, null);
            }
            else {
                var _err = null;
                var ret;
                if(!result) {
                    _err = 'result is null.';
                }
                else {
                    ret = result.rows;
                }
                onSqlResultCallBack(err, ret);
            }
        });
        _log.connectionLog(7, 'query');
    };

    _proto.end = function(callback) {
        callback(null, null);
        _log.connectionLog(7, 'end');
    }


    AbstractPgClient.getInstance = function() {
        return new AbstractPgClient();
    };
    exports.getInstance = AbstractPgClient.getInstance;
})();
