(function() {
    // log.jsモジュールと関連機能の読み込み
    var bunyan = require('bunyan');
    var fs = require('fs');
    var path = require('path');
    var Conf = require('./conf');

    // クラスの実装
    /**
     * ログ出力用クラス
     * @class ログ出力クラス
     */
    function Log() {
        var _self = this;

        // ログレベルの取得
        var _settingLevel = 7;
        var _temp_val = parseInt(Conf.getInstance().getConfData('LOG_LEVEL'));
        if(!isNaN(_temp_val)) {
            _settingLevel = _temp_val;
        }
        _self._logJsLogLevel = _getLogJsLogLevel(_settingLevel);

        // ログ出力先設定の取得
        // FILE: ファイルへ出力, STREAM: 標準出力
        var _settingOutputType = 'FILE';
        _temp_val = Conf.getInstance().getConfData('LOG_OUTPUT_TYPE').toUpperCase();
        // _temp_valに値が入っている、かつ FILE or STREAM である場合
        if ( (_temp_val && _temp_val != "") && (_temp_val == 'FILE' || _temp_val == 'STREAM')) {
            _settingOutputType = _temp_val;
        }

        // ログ出力ディレクトリの設定
        _self._logsDir = path.join(__dirname, '../../logs');
        if(!fs.existsSync(_self._logsDir)) {
            // logsディレクトリがない場合は作成する
            fs.mkdirSync(_self._logsDir, '0777');
        }

        // 通信ログファイルの設定
        _self._connectionLogFile = path.join(_self._logsDir, 'connection.log');
        if (_settingOutputType == 'FILE') {
            if(!fs.existsSync(_self._connectionLogFile)) {
                // logファイルがない場合は作成する
                // default では 0666 で作られる
                fs.closeSync(fs.openSync(_self._connectionLogFile, 'w'));
            }
        }
        // STREAMの場合は標準出力
        if (_settingOutputType == 'STREAM') {
            _self._connectionLogFile = '/dev/stdout';
        }

        // ログ出力インスタンス作成
        _self._logger = bunyan.createLogger({
            name: 'spf-px',
            level: _self._logJsLogLevel,
            streams: [
                {
                    path: _self._connectionLogFile
                }
            ]
        });

        // logrotate 要求に応じる
        process.on('SIGUSR1', function () {
            _self._logger.reopenFileStreams();
        });
    };

    var _logObject = new Log();
    // Factory
    function getInstance() {
        return _logObject;
    };

    // 公開関数
    var _proto = Log.prototype;

    /**
     * 通信のログを出力する。
     * @param {Number} level ログレベル(0～7)
     * @param {String} message 出力メッセージ
     */
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
    // 内部関数
    /**
     * logレベルの数値からlog.js用のログレベルを返す。
     * @param {Number} level ログレベル(0～7)
     * @returns {Number} log.js用のログレベル
     */
    function _getLogJsLogLevel(level) {
        var _logJsLogLevel = 20;    // debug
        if(level == null || typeof level != 'number') {
            return _logJsLogLevel;
        }
        switch(level) {
            case 0:
            case 1:
            case 2:
                _logJsLogLevel = 60;    // fatal
                break;
            case 3:
                _logJsLogLevel = 50;    // error
                break;
            case 4:
                _logJsLogLevel = 40;    // warn
                break;
            case 5:
                _logJsLogLevel = 30;    // info
                break;
            case 6:
                _logJsLogLevel = 20;    // debug
                break;
            case 7:
                _logJsLogLevel = 10;    // trace
                break;
            default:
                break;
        }
        return _logJsLogLevel;
    };

    exports.getInstance = getInstance;

})();
