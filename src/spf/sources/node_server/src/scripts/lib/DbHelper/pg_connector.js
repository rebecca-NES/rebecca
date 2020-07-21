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

    var pg = require('pg');
    pg.defaults.poolSize = 50;
    var PgConfig = require('./pg_config');
    var AbstractPgConnector = require('./abstract_pg_connector');
    var AbstractPgClient = require('./abstract_pg_client');

    var ServerLog = require('../../controller/server_log');

    var _log = ServerLog.getInstance();

    function PgConnector() {
        this._dbConfig = PgConfig.getInstance().getConfig();
    };

    var _proto = PgConnector.prototype;

    _proto.getConnection = function(onResultCallBack) {
        if(onResultCallBack == null || typeof onResultCallBack != 'function') {
            return false;
        }
        var _self = this;
        pg.connect(this._dbConfig, function(err, client, done) {
            var _absPg = AbstractPgConnector.getInstance();
            _absPg.connect(err, client, done, onResultCallBack);
        });
        return true;
    };
    _proto.getTransaction = function() {
        var _self = this;
        var _absCl = AbstractPgClient.getInstance();
        return _absCl;
    };

    _proto.initTransactionSetting = function(absClient) {
        if(absClient == null || typeof absClient != 'object') {
            return false;
        }
        absClient.initTransactionSetting(this._dbConfig);
    };

    var _pgConnector = new PgConnector();

    PgConnector.getInstance = function() {
        return _pgConnector;
    };
    exports.getInstance = PgConnector.getInstance;
})();
