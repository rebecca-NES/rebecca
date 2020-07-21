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

    var _log = ServerLog.getInstance();

    var _client;
    var _done;
 
    function AbstractPgConnector() {
    };

    var _proto = AbstractPgConnector.prototype;

    _proto.connect = function(err, client, done, onResultCallBack) {
        var _self = this;
        if(client == null) {
            return false;
        }
        if(done == null) {
            return false;
        }
        this._client = client;
        this._done = done;

        _log.connectionLog(7, 'connect');

        onResultCallBack(err, _self);
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

    _proto.end = function(onEndSqlCallBack) {
        var _self = this;
        _self._done();
        onEndSqlCallBack(null);
        _log.connectionLog(7, 'end');
    };


    AbstractPgConnector.getInstance = function() {
        return new AbstractPgConnector();
    };
    exports.getInstance = AbstractPgConnector.getInstance;
})();
