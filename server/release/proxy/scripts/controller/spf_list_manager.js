(function() {
    var Conf      = require('./conf');
    var File      = require('./file_reader');
    var ServerLog = require('./server_log');
    var RedisConnector = require('./redis_connector');

    // confクラスインスタンス取得
    var _conf = Conf.getInstance();

    // ServerLogクラスインスタンス取得
    var _log = ServerLog.getInstance();

    // RedisConnectorクラスインスタンス取得
    var _redisConnector = RedisConnector.getInstance();

    // 定数定義
    var REDIS_KEY_SPF_SERVER_LIST = 'spf_server_list';
    var CONF_KEY_SERVER_LIST_FILE_PATH = 'SERVER_LIST_FILE_PATH';

    function SpfListManager() {
        // Cubee サーバリスト
        this._spfServerList = [];
    }

    var _proto = SpfListManager.prototype;

    /*
     * Getter
     * @returns {Array} Cubeeサーバリスト
     */
    _proto.getSpfServerList = function() {
        return this._spfServerList;
    }

    /*
     * Setter
     * @param {Array} serverList Cubeeサーバリスト
     */
    _proto.setSpfServerList = function(serverList) {
        this._spfServerList = serverList;
    }

    /*
     * Cubeeサーバリスト作成
     * @param {client} redisClient redisクライアント
     * @param {Boolean} closeConnection Cubeeサーバリスト作成後　redis　のコネクションを切断するフラグ
     * @param {function} callback Cubeeサーバリスト作成後のコールバック
     */
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

        // redis からCubeeサーバリストを取得
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

            // Cubeeサーバリスト作成
            if(list.length == 0) {
                // redis に Cubeeサーバリストが登録されていない場合
                _log.connectionLog(6,
                    'SpfListManager.loadSpfServerList:: ' +
                    REDIS_KEY_SPF_SERVER_LIST + ' data is nothing in redis');

                // redis を lock
                _redisConnector.acquireLock(redisClient,
                                            REDIS_KEY_SPF_SERVER_LIST,
                                            _readFileSpfServerList);
            } else {
                // redis からCubeeサーバリストを取得できた場合
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

        // Cubeeサーバリストをファイルから読み込む
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

            // redis のロックが取得できている場合
            if(timeoutId) {
                // spf_server_ist ファイルから Cubeeサーバリスト取得
                _file = File.getInstance();
                _filePath = _conf.getConfData(CONF_KEY_SERVER_LIST_FILE_PATH);
                if (!_filePath) {
                    // デフォルトテナント名
                    _filePath = '../../../cmnconf/spf_server_list';

                    _log.connectionLog(4,
                        'SpfListManager.loadSpfServerList:: spf_server_list file path Setting is nothing');
                }
                // Cubeeサーバリストを読み込み redis に登録
                _timeoutId = timeoutId;
                _file.readFile(_filePath, _setRedisSpfServerList);
            } else {
                // リストが空、かつ、他でロック中のため、失敗
                _log.connectionLog(6,
                    'SpfListManager.loadSpfServerList:: ' +
                    CONF_KEY_SERVER_LIST_FILE_PATH +
                    ' is no data, and acquire lock failure');
                var _retErr = new Error(CONF_KEY_SERVER_LIST_FILE_PATH +
                    ' is no data, and acquire lock failure');
                callback(_retErr);
            }
        }

        // redis にCubeeサーバリストを登録
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

            // Cubeeサーバリストをバリデート
            serverList = _self.validateServerList(serverList);

            // redis にCubeeサーバリストを登録
            _registerSpfServerList();

            function _registerSpfServerList() {
                if(_index >= serverList.length) {
                    // 全件登録が完了
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

    /*
     * Cubeeサーバリストをバリデート
     * @param {Array} serverList Cubeeサーバリスト
     *   example:
     *     [
     *       "localhost:80",
     *       "192.168.10.100:80",
     *       "192.168.10.100:80",   * validate error
     *       "192.168.10.100:hoge", * validate error
     *       "192.168.10.101:8080"
     *     ]
     * 
     * @returns {Array} バリデート後のCubeeサーバリスト
     *   example:
     *     [
     *       "localhost:80",
     *       "192.168.10.100:80",
     *       "192.168.10.101:8080"
     *     ]
     */
    _proto.validateServerList = function(serverList) {
        var _splitServerData = [];
        var _retServerList = [];
        for (var i = 0; i < serverList.length; i++) {
            // ホスト名とポート番号を ":" で配列に分割
            _splitServerData = serverList[i].split(':');
            // バリデート実行
            if(!this._validateServerData(_splitServerData)) {
                // バリデートエラー
                _log.connectionLog(4,
                    'SpfListManager.splitServerList:: Invalid spf host data : ' +
                    serverList[i]);

                continue;
            }
            if(_retServerList.indexOf(serverList[i]) == -1) {
                _retServerList.push(serverList[i]);
            } else {
                // 重複エラー
                _log.connectionLog(4,
                    'SpfListManager.splitServerList:: Duplicate spf host data : ' +
                    serverList[i]);
            }
        }
        return _retServerList;
    }

    /*
     * ホスト名とポート番号を取得
     * @param {Array} serverList Cubeeサーバリスト
     *   example:
     *     [
     *       "localhost:80",
     *       "192.168.10.100:80",
     *       "192.168.10.101:8080"
     *     ]
     * 
     * @returns {Array} ホスト名とポート番号を持ったオブジェクトの配列
     *   example:
     *     [
     *       {
     *         hostname:"localhost",
     *         port:80
     *       },
     *       {
     *         hostname:"192.168.10.100",
     *         port:80
     *       },
     *       {
     *         hostname:"192.168.10.101",
     *         port:8080
     *       }
     *     ]
     */
    _proto.splitServerList = function(serverList) {
        var _splitServerData = [];
        var _serverObj = {};
        var _serverObjList = [];
        for (var i = 0; i < serverList.length; i++) {
            // ホスト名とポート番号を ":" で配列に分割
            _splitServerData = serverList[i].split(':');

            // バリデート実行
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

    /*
     * サーバ情報のバリデート
     * @param {Object} splitServerData ホスト名とポート番号を持ったオブジェクト
     * @returns {Boolean} true : 正しい形式 / false : 不正な形式
     */
    _proto._validateServerData = function(splitServerData) {
        var _hostname = '';
        var _port = null;
        if(splitServerData.length < 2){
            _log.connectionLog(4,
                'SpfListManager._validateServerData:: spf server list data format is wrong');

            return false;
        } else if(splitServerData.length == 2) {
            // ホスト名のバリデート
            _hostname = splitServerData[0];
            _port = parseInt(splitServerData[1], 10);
            if(!this._validateHostname(_hostname)) {
                return false;
            }
        } else {
            // ホスト名(IPv6)のバリデート
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
        // ポート番号のバリデート
        if(!this._validatePort(_port)) {
            return false;
        }
        return true;
    }

    /*
     * ホスト名のバリデート
     * @param {String} hostname ホスト名
     * @returns {Boolean} true : 正しい形式 / false : 不正な形式
     */
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

    /*
     * ホスト名のバリデート(IPv6)
     * @param {String} hostname ホスト名
     * @returns {Boolean} true : 正しい形式 / false : 不正な形式
     */
    _proto._validateHostnameIPv6 = function(hostname) {
        if(typeof hostname != 'string') {
            _log.connectionLog(4,
                'SpfListManager._validateHostname:: hostname is not string type');

            return false;
        }
        // The escape sequence '\d' is equivalent to just 'd', so the sequence is not a character class when it is used in a regular expression.
        // The escape sequence '\.' is equivalent to just '.', so the sequence may still represent a meta-character when it is used in a regular expression.
        var _regHostnameIPv6 = '^(' +
            '(([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|' +
            '(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|' +
            '(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|' +
            '(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|' +
            '(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?\s*$';
        var _regHostnameIPv6Exp = new RegExp(_regHostnameIPv6);

        if(!_regHostnameIPv6Exp.test(hostname)) {
            _log.connectionLog(4,
                'SpfListManager._validateHostname:: hostname format is wrong');

            return false;
        }
        return true;
    }

    /*
     * ポート番号のバリデート
     * @param {Number} port ポート番号
     * @returns {Boolean} true : 正しい形式 / false : 不正な形式
     */
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
