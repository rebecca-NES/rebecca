(function() {
    var Conf      = require('./conf');
    var File      = require('./file_reader');
    var ServerLog = require('./server_log');

    // confクラスインスタンス取得
    var _conf = Conf.getInstance();

    // ServerLogクラスインスタンス取得
    var _log = ServerLog.getInstance();

    // 定数定義
    var CONF_KEY_SERVER_LIST_FILE_PATH = 'SERVER_LIST_FILE_PATH';
    var LIST_FILE_SUFFIX = '.outsidemap';

    function OutsideSocketIOServerListManager() {
        // Cubee サーバリスト
        this._outsideInsideServerMap = null;
    }

    var _proto = OutsideSocketIOServerListManager.prototype;


    _proto.loadList = function(callback) {
        var _self = this;
        if (_self._outsideInsideServerMap != null) {
            // 読み込み済みであれば、何もしない
            setTimeout(function() {
                callback();
            }, 1);
            return;
        }

        var _file = _file = File.getInstance();
        var _filePath = _conf.getConfData(CONF_KEY_SERVER_LIST_FILE_PATH) + LIST_FILE_SUFFIX;
        if (!_filePath) {
            // デフォルトファイル
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
            // リストをバリデート
            _self._outsideInsideServerMap = _self._validateServerList(serverList);
            callback();
        }
    };

    /*
     * データを返す
     */
    _proto.getHostAndPort = function(insideHostname) {
        var _self = this;
        if( _self._outsideInsideServerMap == null) {
            return null;
        }
        return _self._outsideInsideServerMap[insideHostname];
    }

    /*
     * 内、外のリストをバリデート
     * @param {Array} serverList Cubeeサーバリスト
     *   example:
     *     [
     *       "localhost,1.2.3.3,80",
     *       "192.168.10.100,1.2.3.4,3000",
     *       "192.168.10.100,1.2.3.4,3000",   * validate error
     *       "192.168.10.100,1.2.3.4,3001",   * validate error
     *       "192.168.10.101,1.2.3.5,hoge", * validate error
     *       "192.168.10.102,1.2.3.6,8080"
     *     ]
     *
     * @returns {Object} バリデート後のCubeeサーバリスト
     *   example:
     *     {
     *       "localhost" : ["1.2.3.3", "80"],
     *       "192.168.10.100" : ["1.2.3.4", "3000"],
     *       "192.168.10.101 : ["1.2.3.6", "8080"]
     *     }
     */
    _proto._validateServerList = function(serverList) {
        var _self = this;
        var _splitServerData = [];
        var _retServerMap = {};
        for (var i = 0; i < serverList.length; i++) {
            // 内ホスト、外Socket.IO用ホスト、外Socket.IO用ポート番号を "," で配列に分割
            _splitServerData = serverList[i].split(',');
            // バリデート実行
            if(!_self._validateServerData(_splitServerData)) {
                // バリデートエラー
                _log.connectionLog(4,
                    'OutsideSocketIOServerListManager.splitServerList:: Invalid spf host data : ' +
                    serverList[i]);

                continue;
            }
            _outsideData = [_splitServerData[1], _splitServerData[2]];
            if(_retServerMap[_splitServerData[0]] == null) {
                _retServerMap[_splitServerData[0]] = _outsideData;
            } else {
                // 重複エラー
                _log.connectionLog(4,
                    'OutsideSocketIOServerListManager.splitServerList:: Duplicate spf host data : ' +
                    serverList[i]);
            }
        }
        return _retServerMap;
    }

    /*
     * サーバ情報のバリデート
     * @param {Object} splitServerData ホスト名とポート番号を持ったオブジェクト
     * @returns {Boolean} true : 正しい形式 / false : 不正な形式
     */
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
            // ホスト名のバリデート
            _insideHostname = splitServerData[0];
            _outsideHostname = splitServerData[1];
            _port = parseInt(splitServerData[2], 10);
            // 内側
            if(_insideHostname.indexOf(':') >= 0) {
                // IPv6
                if(!_self._validateHostnameIPv6(_insideHostname)) {
                    return false;
                }
            } else {
                // IPv4 or hostname
                if(!_self._validateHostname(_insideHostname)) {
                    return false;
                }
            }
            // 外側
            if(_outsideHostname.indexOf(':') >= 0) {
                // IPv6
                if(!_self._validateHostnameIPv6(_outsideHostname)) {
                    return false;
                }
            } else {
                // IPv4 or hostname
                if(!_self._validateHostname(_outsideHostname)) {
                    return false;
                }
            }
            // ポート番号のバリデート
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

    /*
     * ホスト名のバリデート
     * @param {String} hostname ホスト名
     * @returns {Boolean} true : 正しい形式 / false : 不正な形式
     */
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

    /*
     * ホスト名のバリデート(IPv6)
     * @param {String} hostname ホスト名
     * @returns {Boolean} true : 正しい形式 / false : 不正な形式
     */
    _proto._validateHostnameIPv6 = function(hostname) {
        if(typeof hostname != 'string') {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateHostnameIPv6:: hostname is not string type');

            return false;
        }
        // The escape sequence '\d' is equivalent to just 'd', so the sequence is not a character class when it is used in a regular expression.
        // The escape sequence '\.' is equivalent to just '.', so the sequence may still represent a meta-character when it is used in a regular expression.
        // The escape sequence '\s' is equivalent to just 's', so the sequence is not a character class when it is used in a regular expression.
        // \s*$ -> (\s*$)
        var _regHostnameIPv6 = '^(' +
            '(([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|' +
            '(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|' +
            '(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3})|:))|' +
            '(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|' +
            '(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:))|' +
            '(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]d|1dd|[1-9]?d)(.(25[0-5]|2[0-4]d|1dd|[1-9]?d)){3}))|:)))(%.+)?(\\s*$)';
        var _regHostnameIPv6Exp = new RegExp(_regHostnameIPv6);

        if(!_regHostnameIPv6Exp.test(hostname)) {
            _log.connectionLog(4,
                'OutsideSocketIOServerListManager._validateHostnameIPv6:: hostname format is wrong');

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
