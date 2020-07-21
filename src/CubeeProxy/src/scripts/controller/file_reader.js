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
    var ServerLog = require('./server_log');

    var _log = ServerLog.getInstance();

    function File() {
    }

    var _file;

    function getInstance() {
        return _file;
    }

    var _proto = File.prototype;

    _proto.readFile = function(filepath, callback) {
        _log.connectionLog(7, 'File.readFile:: read file ' + filepath);

        fs.exists(filepath, function(exists) {
            var _retList = [];

            if(exists) {
                var _options = {
                    encoding:'utf8'
                };
                fs.readFile(filepath, _options, function(err, data) {
                    if(err) {
                        _log.connectionLog(3, 'File.readFile:: readFile error : ' + err.message);

                        var _retErr = new Error('Failed to read file');
                        callback(_retErr, _retList);
                        return;
                    }
                    var _fileData = data.toString();
                    var _fileListDatas = _fileData.split('\n');
                    var _count = _fileListDatas.length;
                    for(var _i = 0; _i < _count; _i++) {
                        var _lineData = _fileListDatas[_i];
                        var _line = _lineData.replace(/^\s+|\s+$/g, "");
                        if(_line == '') {
                            continue;
                        }
                        _retList.push(_line);
                    }
                    callback(null, _retList);
                });
            } else {
                _log.connectionLog(3, 'File.readFile:: ' + filepath + ' is not exist');

                var _retErr = new Error(filepath + ' is not exist');
                callback(_retErr, _retList);
            }
        });
    }

    _file = new File();

    exports.getInstance = getInstance;
})();
