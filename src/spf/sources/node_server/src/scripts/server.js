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

var ServerLog = require('./controller/server_log');
var DBIF = require('./Authority/db/db_if');

process.on('uncaughtException', function(err) {
    var _date = new Date();
    try {
        var _log = ServerLog.getInstance();
        _log.connectionLog(1, '[' + _date +'] uncaughtException => ' + err.stack);

    } catch (e) {
        console.log('[' + _date +'] uncaughtException => ' + err.stack);
    }
});

function startServer() {
    var _log = ServerLog.getInstance();
    var io = require('./controller/socket_io_receiver');
    io.start();

    var express = require('../express_app/app.js');
    express.start();

    var dbif = DBIF.create().initialize('/opt/cubee/cmnconf/spf_rightctl_dbs.json',
        function(err) {
            if (err) {
                _log.connectionLog(3, 'Failed to connect rightctl dbs: ' + JSON.stringify(err));
            } else {
                _log.connectionLog(6, 'Rightctl DB connected.');
            }
        }
    );
    _log.connectionLog(6,'CubeeServer is running.');
};

startServer();
