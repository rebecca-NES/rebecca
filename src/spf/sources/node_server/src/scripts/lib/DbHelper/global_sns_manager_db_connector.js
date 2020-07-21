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
    var AbstractDbConnector = require('./abstract_db_connector').AbstractDbConnector;
    var NodeJsUtil = require('util');
    var Conf = require('../../controller/conf');
    var _conf = Conf.getInstance();
    var _host = _conf.getConfData('GLOBAL_SNS_MANAGER_DB_SERVER_HOST', '127.0.0.1');
    var _user = _conf.getConfData('GLOBAL_SNS_MANAGER_DB_USER', 'globalsns_admin');
    var _pw = _conf.getConfData('GLOBAL_SNS_MANAGER_DB_PW', '');

    function GlobalSNSManagerDbConnector(_dbConfig){
        AbstractDbConnector.call(this,_dbConfig);
    }

    var _proto = GlobalSNSManagerDbConnector.prototype;

    NodeJsUtil.inherits(GlobalSNSManagerDbConnector, AbstractDbConnector);

    var _dbConfig = {
            host     : _host,
            user     : _user,
            password : _pw,
            database : 'globalsns_manager',
            connectionLimit : 50,
            insecureAuth: true,
    };
    var _globalSNSManagerDbConnector = new GlobalSNSManagerDbConnector(_dbConfig);

    GlobalSNSManagerDbConnector.getInstance = function() {
        return _globalSNSManagerDbConnector;
    };
    exports.getInstance = GlobalSNSManagerDbConnector.getInstance;

})();
