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
    var fs = require('fs');
    var path = require('path');

    var COMMON_CONF_DIR = '../../../cmnconf';
    var COMMON_CONF_FILE = 'common.conf';
    var CONF_DIR = '../../conf';
    var CONF_FILE = 'server.conf';

    function Conf() {
        this._confData = {};
        this._readConfFile(COMMON_CONF_DIR, COMMON_CONF_FILE);
        this._readConfFile(CONF_DIR, CONF_FILE);
    }

    var _conf;

    function getInstance() {
        return _conf;
    }

    var _proto = Conf.prototype;

    _proto.getConfData = function(key, defaultValue) {
        var _self = this;
        var _data = _self._confData[key];
        if(_data == undefined || _data == null) {
            if(defaultValue != null && typeof defaultValue == 'string') {
                _data = defaultValue;
            } else {
                _data = '';
            }
        }
        return _data;
    }

    _proto._readConfFile = function(confDir, confFile) {
        var _self = this;
        var _confDir = path.join(__dirname, confDir);
        if(!fs.existsSync(_confDir)) {
            console.log(_confDir + 'is not exist.');
            return;
        }
        var _confFile = confFile;
        var _confFilePath = path.join(_confDir, _confFile);
        if(!fs.existsSync(_confFilePath)) {
            console.log(_confFilePath + 'is not exist.');
            return;
        }
        var _fileData = fs.readFileSync(_confFilePath, 'utf8').toString();
        var _confDatas = _fileData.split('\n');
        var _count = _confDatas.length;
        for(var _i = 0; _i < _count; _i++) {
            var _confData = _confDatas[_i];
            var _keyValue = _confData.split('=');
            if(_keyValue.length != 2) {
                continue;
            }
            var _key = _keyValue[0].replace(/^\s+|\s+$/g, "");
            var _value = _keyValue[1].replace(/^\s+|\s+$/g, "");
            if(_key == '' || _value == '') {
                continue;
            }
            _self._confData[_key] = _value;
        }
    }

    _conf = new Conf();

    exports.getInstance = getInstance;
})();
