(function() {
    var fs = require('fs');
    var path = require('path');

    // 定数定義
    var COMMON_CONF_DIR = '../../../cmnconf';
    var COMMON_CONF_FILE = 'common.conf';
    var CONF_DIR = '../../conf';
    var CONF_FILE = 'server.conf';

    /*
     * Conf クラス
     *   this._readConfFile(confDir, confFile) に
     *   ディレクトリとコンフィグファイル名を渡すと、コンフィグファイルを読み出し、
     *   this._confData　のオブジェクトに key:value の形式で格納する。
     *   
     *   ※key名が重複している場合、
     *     最後に読み込まれたkeyが保持される
     */
    function Conf() {
        this._confData = {};
        // common.conf を読み出す
        this._readConfFile(COMMON_CONF_DIR, COMMON_CONF_FILE);
        // server.conf を読み出す
        this._readConfFile(CONF_DIR, CONF_FILE);
    }

    var _conf;

    function getInstance() {
        return _conf;
    }

    var _proto = Conf.prototype;

    /*
     * コンフィグ値を取得
     * @param {String} key コンフィグから取得する値のkey
     * @param {String} defaultValue コンフィグが定義されていなかった場合に返却するデフォルト値
     * @returns {String} コンフィグ値
     */
    _proto.getConfData = function(key, defaultValue) {
        var _self = this;
        var _data = _self._confData[key];
        // This guard always evaluates to false.
        if(_data == undefined /* || _data == null */) {
            // 値が取得できない場合
            if(defaultValue != null && typeof defaultValue == 'string') {
                // デフォルト値を返却
                _data = defaultValue;
            } else {
                // 空文字を返却
                _data = '';
            }
        }
        return _data;
    }

    /*
     * コンフィグファイルを読み出し、オブジェクトに格納
     * @param {String} confDir コンフィグファイルのディレクトリパス
     * @param {String} confFile コンフィグファイル名
     */
    _proto._readConfFile = function(confDir, confFile) {
        var _self = this;
        var _confDir = path.join(__dirname, confDir);
        if(!fs.existsSync(_confDir)) {
            // ディレクトリパスが存在しない場合
            console.log(_confDir + 'is not exist.');
            return;
        }
        var _confFile = confFile;
        var _confFilePath = path.join(_confDir, _confFile);
        if(!fs.existsSync(_confFilePath)) {
            // コンフィグファイルが存在しない場合
            console.log(_confFilePath + 'is not exist.');
            return;
        }
        // コンフィグファイルを読み出して解析
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
                // 空の行はスキップ
                continue;
            }
            // オブジェクトに格納
            _self._confData[_key] = _value;
        }
    }

    _conf = new Conf();

    exports.getInstance = getInstance;
})();
