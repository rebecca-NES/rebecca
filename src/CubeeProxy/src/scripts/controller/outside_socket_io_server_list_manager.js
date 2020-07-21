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
    var Conf      = require('./conf');
    var File      = require('./file_reader');
    var ServerLog = require('./server_log');

    var _conf = Conf.getInstance();

    var _log = ServerLog.getInstance();

    var CONF_KEY_SERVER_LIST_FILE_PATH = 'SERVER_LIST_FILE_PATH';
    var LIST_FILE_SUFFIX = '.outsidemap';

    function OutsideSocketIOServerListManager() {
        this._outsideInsideServerMap = null;
    }

    var _proto = OutsideSocketIOServerListManager.prototype;


    _proto.loadList = function(callback) {
        var _self = this;
        if (_self._outsideInsideServerMap != null) {
            setTimeout(function() {
                callback();
            }, 1);
            return;
        }

        var _file = _file = File.getInstance();
        var _filePath = _conf.getConfData(CONF_KEY_SERVER_LIST_FILE_PATH) + LIST_FILE_SUFFIX;
        if (!_filePath) {
            _filePath = '../../../cmnconf/spf_server_list.outsidemap';

            _log.connectionLog(4,
                'OutsideSocketIOServerListManager.loadList:: spf_server_list.outsidemap file path Setting is nothing');
        }
        _file.readFile(_filePath, _onReadFile);
        function _onReadFile(readErr, serverList) {
            if(readErr) {
                _log.connectionLog(3,
                    'OutsideSocketIOServerListManager.loadList:: readFile error');

                var _retErr = new Error('Failed to read Spf Server List file');
                callback(_retErr);
                return;
            }
            var _index = 0;
            _self._outsideInsideServerMap = _self._validateServerList(serverList);
            callback();
        }
    };

    _proto.getHostAndPort = function(insideHostname) {
        var _self = this;
        if( _self._outsideInsideServerMap == null) {
            return null;
        }
        return _self._outsideInsideServerMap[insideHostname];
    }

    _proto._validateServerList = function(serverList) {
        var _self = this;
        var _splitServerData = [];
        var _retServerMap = {};
        for (var i = 0; i < serverList.length; i++) {
            _splitServerData = serverList[i].split(',');
            if(!_self._validateServerData(_splitServerData)) {
                _log.connectionLog(4,
                    'OutsideSocketIOServerListManager.splitServerList:: Invalid spf host data : ' +
                    serverList[i]);

                continue;
            }
            _outsideData = [_splitServerData[1], _splitServerData[2]];
            if(_retServerMap[_splitServerData[0]] == null) {
                _retServerMap[_splitServerData[0]] = _outsideData;
            } else {
                _log.connectionLog(4,
                    'OutsideSocketIOServerListManager.splitServerList:: Duplicate spf host data : ' +
                    serverList[i]);
            }
        }
        return _retServerMap;
    }

    _proto._validateServerData = function(splitServerData) {
        var _self = this;
        var _insideHostname = '';
        var _outsideHostname = '';
        var _port = null;
        if(splitServerData.length < 3){
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateServerData:: spf server list data format is wrong');

            return false;
        } else if(splitServerData.length == 3) {
            _insideHostname = splitServerData[0];
            _outsideHostname = splitServerData[1];
            _port = parseInt(splitServerData[2], 10);
            if(_insideHostname.indexOf(':') >= 0) {
                if(!_self._validateHostnameIPv6(_insideHostname)) {
                    return false;
                }
            } else {
                if(!_self._validateHostname(_insideHostname)) {
                    return false;
                }
            }
            if(_outsideHostname.indexOf(':') >= 0) {
                if(!_self._validateHostnameIPv6(_outsideHostname)) {
                    return false;
                }
            } else {
                if(!_self._validateHostname(_outsideHostname)) {
                    return false;
                }
            }
            if(!_self._validatePort(_port)) {
                return false;
            }
        } else {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateServerData:: spf server list data format is wrong');
            return false;
        }
        return true;
    }

    _proto._validateHostname = function(hostname) {
        if(typeof hostname != 'string') {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateHostname:: hostname is not string type');

            return false;
        }
        if(!hostname || hostname.length > 255) {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateHostname:: hostname is over length 255');

            return false;
        }
        var regex = /^[a-zA-Z0-9¥.¥-]+$/;
        if(!regex.test(hostname)) {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateHostname:: hostname format is wrong');

            return false;
        }
        var _labels = hostname.split('.');
        for (var i = 0; i < _labels.length; i++) {
            if( _labels[i].length < 1 || _labels[i].length > 63) {
                _log.connectionLog(4,
                    'OutsideSocketIOServerListManager._validateHostname:: hostname format is wrong');

                return false;
            }
        }
        return true;
    }

    _proto._validateHostnameIPv6 = function(hostname) {
        if(typeof hostname != 'string') {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateHostnameIPv6:: hostname is not string type');

            return false;
        }
        var _regHostnameIPv6 = '^(' +
            '(([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|' +
            '(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|' +
            '(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|' +
            '(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|' +
            '(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$';
        var _regHostnameIPv6Exp = new RegExp(_regHostnameIPv6);

        if(!_regHostnameIPv6Exp.test(hostname)) {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateHostnameIPv6:: hostname format is wrong');

            return false;
        }
        return true;
    }

    _proto._validatePort = function(port) {
        if(isNaN(port)) {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validatePort:: port is not number type');

            return false;
        }
        if(port < 1 || port > 65535) {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validatePort:: port is out of range');

            return false;
        }
        return true;
    }

    var _outsideSocketIOServerListManager = new OutsideSocketIOServerListManager();

    OutsideSocketIOServerListManager.getInstance = function() {
        return _outsideSocketIOServerListManager;
    };

    exports.getInstance = OutsideSocketIOServerListManager.getInstance;
})();
