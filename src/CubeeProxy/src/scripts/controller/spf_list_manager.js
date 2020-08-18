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
    var RedisConnector = require('./redis_connector');

    var _conf = Conf.getInstance();

    var _log = ServerLog.getInstance();

    var _redisConnector = RedisConnector.getInstance();

    var REDIS_KEY_SPF_SERVER_LIST = 'spf_server_list';
    var CONF_KEY_SERVER_LIST_FILE_PATH = 'SERVER_LIST_FILE_PATH';

    function SpfListManager() {
        this._spfServerList = [];
    }

    var _proto = SpfListManager.prototype;

    _proto.getSpfServerList = function() {
        return this._spfServerList;
    }

    _proto.setSpfServerList = function(serverList) {
        this._spfServerList = serverList;
    }

    _proto.loadSpfServerList = function(redisClient, closeConnection, callback) {
        if(!redisClient) {
            _log.connectionLog(3,
                'SpfListManager.loadSpfServerList:: redis client is undefied');

            var _retErr = new Error('redis client is undefied');
            if(closeConnection) {
                _redisConnector.quit(redisClient);
            }
            setTimeout(callback, 10, _retErr);
            return;
        }
        var _self = this;

        var _serverObjList = [];
        var _timeoutId = '';

        redisClient.lrange(REDIS_KEY_SPF_SERVER_LIST, 0, -1, function(err, list){
            if(err) {
                _log.connectionLog(3,
                    'SpfListManager.loadSpfServerList:: redis error : ' +
                    err.message);

                if(closeConnection) {
                    _redisConnector.quit(redisClient);
                }
                var _retErr = new Error('Failed to load Spf Server List data');
                callback(_retErr);
                return;
            }

            if(list.length == 0) {
                _log.connectionLog(6,
                    'SpfListManager.loadSpfServerList:: ' +
                    REDIS_KEY_SPF_SERVER_LIST + ' data is nothing in redis');

                _redisConnector.acquireLock(redisClient,
                                            REDIS_KEY_SPF_SERVER_LIST,
                                            _readFileSpfServerList);
            } else {
                _log.connectionLog(7,
                    'SpfListManager.loadSpfServerList:: Get ' +
                    REDIS_KEY_SPF_SERVER_LIST + ' data in redis : ' + list);

                if(closeConnection) {
                    _redisConnector.quit(redisClient);
                }
                _serverObjList = _self.splitServerList(list);
                _self.setSpfServerList(_serverObjList);
                callback(null);
            }
        });

        function _readFileSpfServerList(err, timeoutId) {
            if(err) {
                _log.connectionLog(3,
                    'SpfListManager.loadSpfServerList:: redis error : ' +
                    err.message);

                if(closeConnection) {
                    _redisConnector.quit(redisClient);
                }
                var _retErr = new Error('Failed to load Spf Server List file');
                callback(_retErr);
                return;
            }
            var _file = null;
            var _filePath = '';

            if(timeoutId) {
                _file = File.getInstance();
                _filePath = _conf.getConfData(CONF_KEY_SERVER_LIST_FILE_PATH);
                if (!_filePath) {
                    _filePath = '../../../cmnconf/spf_server_list';

                    _log.connectionLog(4,
                        'SpfListManager.loadSpfServerList:: spf_server_list file path Setting is nothing');
                }
                _timeoutId = timeoutId;
                _file.readFile(_filePath, _setRedisSpfServerList);
            } else {
                _log.connectionLog(6,
                    'SpfListManager.loadSpfServerList:: ' +
                    CONF_KEY_SERVER_LIST_FILE_PATH +
                    ' is no data, and acquire lock failure');
                var _retErr = new Error(CONF_KEY_SERVER_LIST_FILE_PATH +
                    ' is no data, and acquire lock failure');
                callback(_retErr);
            }
        }

        function _setRedisSpfServerList(readErr, serverList) {
            if(readErr) {
                _log.connectionLog(3,
                    'SpfListManager.loadSpfServerList:: readFile error');

                if(closeConnection) {
                    _redisConnector.quit(redisClient);
                }
                var _retErr = new Error('Failed to read Spf Server List file');
                callback(_retErr);
                return;
            }
            var _index = 0;

            serverList = _self.validateServerList(serverList);

            _registerSpfServerList();

            function _registerSpfServerList() {
                if(_index >= serverList.length) {
                    _log.connectionLog(6,
                        'SpfListManager.loadSpfServerList:: Register complete in redis : ' +
                        serverList);

                    _redisConnector.release(redisClient,
                                            REDIS_KEY_SPF_SERVER_LIST,
                                            _timeoutId,
                                            function(releaseErr){
                        if(closeConnection) {
                            _redisConnector.quit(redisClient);
                        }
                        _serverObjList = _self.splitServerList(serverList);
                        _self.setSpfServerList(_serverObjList);
                        callback(null);
                    });
                    return;
                }
                redisClient.rpush(REDIS_KEY_SPF_SERVER_LIST,
                                  serverList[_index],
                                  function(registerErr, rsize) {
                    if(registerErr) {
                        _log.connectionLog(3,
                            'SpfListManager.loadSpfServerList:: redis error : ' +
                            registerErr.message);

                        _redisConnector.release(redisClient,
                                                REDIS_KEY_SPF_SERVER_LIST,
                                                _timeoutId,
                                                function(releaseErr){
                            if(closeConnection) {
                                _redisConnector.quit(redisClient);
                            }
                            var _retErr = new Error('Failed to register Spf Server List data');
                            callback(_retErr);
                        });
                        return;
                    }
                    _log.connectionLog(6,
                        'SpfListManager.loadSpfServerList:: Register data ' +
                        serverList[_index] +
                        ' in redis');
                    _index++;
                    _registerSpfServerList();
                });
            }
        }
    }

    _proto.validateServerList = function(serverList) {
        var _splitServerData = [];
        var _retServerList = [];
        for (var i = 0; i < serverList.length; i++) {
            _splitServerData = serverList[i].split(':');
            if(!this._validateServerData(_splitServerData)) {
                _log.connectionLog(4,
                    'SpfListManager.splitServerList:: Invalid spf host data : ' +
                    serverList[i]);

                continue;
            }
            if(_retServerList.indexOf(serverList[i]) == -1) {
                _retServerList.push(serverList[i]);
            } else {
                _log.connectionLog(4,
                    'SpfListManager.splitServerList:: Duplicate spf host data : ' +
                    serverList[i]);
            }
        }
        return _retServerList;
    }

    _proto.splitServerList = function(serverList) {
        var _splitServerData = [];
        var _serverObj = {};
        var _serverObjList = [];
        for (var i = 0; i < serverList.length; i++) {
            _splitServerData = serverList[i].split(':');

            if(!this._validateServerData(_splitServerData)) {
                _log.connectionLog(4,
                    'SpfListManager.splitServerList:: Invalid spf host data : ' +
                    serverList[i]);

                continue;
            }
            _serverObj = {};
            if(_splitServerData.length == 2) {
                _serverObj['hostname'] = _splitServerData[0];
                _serverObj['port'] = parseInt(_splitServerData[1], 10);
            } else {
                _serverObj['port'] = parseInt(_splitServerData.pop(), 10);
                _serverObj['hostname'] = _splitServerData.join(':');
            }
            _serverObjList.push(_serverObj);
        }
        return _serverObjList;
    }

    _proto._validateServerData = function(splitServerData) {
        var _hostname = '';
        var _port = null;
        if(splitServerData.length < 2){
            _log.connectionLog(4,
                'SpfListManager._validateServerData:: spf server list data format is wrong');

            return false;
        } else if(splitServerData.length == 2) {
            _hostname = splitServerData[0];
            _port = parseInt(splitServerData[1], 10);
            if(!this._validateHostname(_hostname)) {
                return false;
            }
        } else {
            var _tmpServerData = [];
            for (var i = 0; i < splitServerData.length; i++) {
                if(i == splitServerData.length - 1) {
                    _port = parseInt(splitServerData[i], 10);
                } else {
                    _tmpServerData.push(splitServerData[i]);
                }
            }
            _hostname = _tmpServerData.join(':');
            if(!this._validateHostnameIPv6(_hostname)) {
                return false;
            }
        }
        if(!this._validatePort(_port)) {
            return false;
        }
        return true;
    }

    _proto._validateHostname = function(hostname) {
        if(typeof hostname != 'string') {
            _log.connectionLog(4,
                'SpfListManager._validateHostname:: hostname is not string type');

            return false;
        }
        if(!hostname || hostname.length > 255) {
            _log.connectionLog(4,
                'SpfListManager._validateHostname:: hostname is orver length 255');

            return false;
        }
        var regex = /^[a-zA-Z0-9¥.¥-]+$/;
        if(!regex.test(hostname)) {
            _log.connectionLog(4,
                'SpfListManager._validateHostname:: hostname format is wrong');

            return false;
        }
        var _labels = hostname.split('.');
        for (var i = 0; i < _labels.length; i++) {
            if( _labels[i].length < 1 || _labels[i].length > 63) {
                _log.connectionLog(4,
                    'SpfListManager._validateHostname:: hostname format is wrong');

                return false;
            }
        }
        return true;
    }

    _proto._validateHostnameIPv6 = function(hostname) {
        if(typeof hostname != 'string') {
            _log.connectionLog(4,
                'SpfListManager._validateHostname:: hostname is not string type');

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
                'SpfListManager._validateHostname:: hostname format is wrong');

            return false;
        }
        return true;
    }

    _proto._validatePort = function(port) {
        if(isNaN(port)) {
            _log.connectionLog(4,
                'SpfListManager._validatePort:: port is not number type');

            return false;
        }
        if(port < 1 || port > 65535) {
            _log.connectionLog(4,
                'SpfListManager._validatePort:: port is out of range');

            return false;
        }
        return true;
    }

    var _spfListManager = new SpfListManager();

    SpfListManager.getInstance = function() {
        return _spfListManager;
    }

    exports.getInstance = SpfListManager.getInstance;

})();
