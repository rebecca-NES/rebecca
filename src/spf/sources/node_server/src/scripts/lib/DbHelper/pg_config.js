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
    var Conf = require('../../controller/conf');
    var _conf = Conf.getInstance();
    var _host = _conf.getConfData('GLOBAL_SNS_MANAGER_DB_SERVER_HOST', '127.0.0.1');

    function PgConfig() {

    }

    var _proto = PgConfig.prototype;

    var _dbConfig = {
            host     : _host,
            port     : 5432,
            user     : 'globalsns_admin',
            password : 'password',
            database : 'globalsns',
            ssl      : false,
    };
    var _pgConfig = new PgConfig();

    _proto.getConfig = function() {
    	return _dbConfig;
    };

    PgConfig.getInstance = function() {
        return _pgConfig;
    };
    exports.getInstance = PgConfig.getInstance;
})();
