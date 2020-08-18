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
    var bunyan = require('bunyan');
    var fs = require('fs');
    var path = require('path');
    var Conf = require('./conf');

    function Log() {
        var _self = this;

        var _settingLevel = 7;
        var _temp_val = parseInt(Conf.getInstance().getConfData('LOG_LEVEL'));
        if(!isNaN(_temp_val)) {
            _settingLevel = _temp_val;
        }
        _self._logJsLogLevel = _getLogJsLogLevel(_settingLevel);

        var _settingOutputType = 'FILE';
        _temp_val = Conf.getInstance().getConfData('LOG_OUTPUT_TYPE').toUpperCase();
        if ( (_temp_val && _temp_val != "") && (_temp_val == 'FILE' || _temp_val == 'STREAM')) {
            _settingOutputType = _temp_val;
        }

        _self._logsDir = path.join(__dirname, '../../logs');
        if(!fs.existsSync(_self._logsDir)) {
            fs.mkdirSync(_self._logsDir, '0777');
        }

        _self._connectionLogFile = path.join(_self._logsDir, 'connection.log');
        if (_settingOutputType == 'FILE') {
            if(!fs.existsSync(_self._connectionLogFile)) {
                fs.closeSync(fs.openSync(_self._connectionLogFile, 'w'));
            }
        }
        if (_settingOutputType == 'STREAM') {
            _self._connectionLogFile = '/dev/stdout'
        }

        _self._logger = bunyan.createLogger({
            name: 'spf-px',
            level: _self._logJsLogLevel,
            streams: [
                {
                    path: _self._connectionLogFile
                }
            ]
        });

        process.on('SIGUSR1', function () {
            _self._logger.reopenFileStreams();
        });
    };

    var _logObject = new Log();
    function getInstance() {
        return _logObject;
    };

    var _proto = Log.prototype;

    _proto.connectionLog = function(level, message) {
        var _self = this;
        if(level == null || typeof level != 'number') {
            return;
        }
        if(message == null || typeof message != 'string') {
            return;
        }

        switch(level) {
            case 0:
            case 1:
            case 2:
                _self._logger.fatal(message);
                break;
            case 3:
                _self._logger.error(message);
                break;
            case 4:
                _self._logger.warn(message);
                break;
            case 5:
                _self._logger.info(message);
                break;
            case 6:
                _self._logger.debug(message);
                break;
            case 7:
                _self._logger.trace(message);
                break;
            default:
                _self._logger.trace(message);
                break;
        }
    };
    function _getLogJsLogLevel(level) {
        var _logJsLogLevel = 20;
        if(level == null || typeof level != 'number') {
            return _logJsLogLevel;
        }
        switch(level) {
            case 0:
            case 1:
            case 2:
                _logJsLogLevel = 60;
                break;
            case 3:
                _logJsLogLevel = 50;
                break;
            case 4:
                _logJsLogLevel = 40;
                break;
            case 5:
                _logJsLogLevel = 30;
                break;
            case 6:
                _logJsLogLevel = 20;
                break;
            case 7:
                _logJsLogLevel = 10;
                break;
            default:
                break;
        }
        return _logJsLogLevel;
    };

    exports.getInstance = getInstance;

})();
