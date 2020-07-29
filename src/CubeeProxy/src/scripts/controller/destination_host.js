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
    var ServerLog = require('./server_log');

    var _log = ServerLog.getInstance();

    function DestinationHost() {
        this._statusCode = 200;
        this._header = {
            'Content-Type': 'application/x-javascript',
            'Cache-Control': 'no-cache'
        };
        this._responseData = '';
    }

    var _proto = DestinationHost.prototype;

    _proto.getStatusCode = function() {
        return this._statusCode;
    }

    _proto.getHeader = function() {
        return this._header;
    }

    _proto.getResponseData = function() {
        return this._responseData;
    }

    _proto.createResponseData = function(dHost, dPort) {
        _log.connectionLog(7,
            'DestinationHost.createResponseData::dispatch destination socket.io server ' +
            dHost + ':' + dPort);

        this._responseData = 'var d_host = "' + dHost + '"; var d_socketio_port = ' + dPort + ';';
    }

    module.exports = DestinationHost;
})();
