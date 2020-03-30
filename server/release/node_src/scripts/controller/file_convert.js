(function() {
    var ServerLog = require('./server_log');
    var Fs = require('fs');
    var Path = require('path');
    var Conf = require('./conf');
    var EasyImage = require('easyimage');

    var _log = ServerLog.getInstance();

    function FileConvert() {
    };

    //定数定義
    var CREATING_IMAGE_FILE = '../../resources/creatingImage.png';
    var DATA_DIR = '../../data/';
    var THUMBNAIL_DIR = Conf.getInstance().getConfData('THUMBNAIL_FILEPATH', 'thumbnail');
    var DEFAULT_THUMBNAIL_HEIGHT = '96';
    var DEFAULT_THUMBNAIL_WIDTH = '96';
    var DEFAULT_THUMBNAIL_EXT = '.png';

    var _proto = FileConvert.prototype;

    // タイプによる処理を定義
    var _createTypeTable = {
        'thumbnail' : _convertThumbnail
    };

    var _getTypeTable = {
        'thumbnail' : _getThumbnailFilePath
    };

    /**
     * ファイル加工
     * @param {string} inputFilePath : 対象のファイルパス
     * @param {string} type : タイプ
     * @param {callback} onCallback : 結果返却用コールバック
     */
    _proto.preConvertProcess = function(inputFilePath, type, onCallback) {
        if (onCallback == null || typeof onCallback != 'function') {
            return false;
        }
        if((inputFilePath == null || typeof inputFilePath != 'string' || inputFilePath == '') ||
           (type == null || typeof type != 'string' || type == '')) {
            return false;
        }

        //　対象ファイルが存在しているかチェック
        var _absFilePath = Path.join(__dirname, DATA_DIR, inputFilePath);
        Fs.exists(_absFilePath, function (exists) {
            if(!exists) {
                _log.connectionLog(3, 'FileConvert.preConvertProcess:: file not found : ' + _absFilePath);
                onCallback(null);
                return;
            }

            //　type確認
            var _callFunction = _createTypeTable[type];
            if(_callFunction == null){
                _log.connectionLog(3, 'FileConvert.preConvertProcess:: type not found : ' + type);
                onCallback(null);
                return;
            }
            _log.connectionLog(7, 'FileConvert.preConvertProcess:: call function [file]:' + _absFilePath);
            _callFunction(_absFilePath, onCallback);
        });
        return true;
    }

    /**
     * サムネイル画像生成
     * @param {string} absFilePath : 生成対象のファイルパス(絶対パス)
     * @param {callback} onCallback : 結果返却用コールバック
     */
    function _convertThumbnail(absFilePath, onCallback) {
        //　拡張子チェック
        var _ext = _getImageFileExt(absFilePath);
        if(_ext == null){
            _log.connectionLog(7, 'convertThumbnail:: not convertable file : ' + absFilePath);
            onCallback(null);
            return;
        }

        var _work = Path.basename(absFilePath, _ext);
        var _targetFilename = _work + DEFAULT_THUMBNAIL_EXT;
        _work = Path.dirname(absFilePath);
        var _targetDir = Path.join(_work, THUMBNAIL_DIR);
        var _targetFilePath = Path.join(_targetDir, _targetFilename);
        //　格納ディレクトリをチェック
        Fs.exists(_targetDir, function (exists) {
            if(exists) {
                _copyCreatingImage();
            } else {
                //　ないので作成
                Fs.mkdir(_targetDir, function(error) {
                    if(error){
                        _log.connectionLog(3, 'convertThumbnail:: make thumbnail dir is error : ' + error);
                        onCallback(null);
                        return;
                    }
                    _log.connectionLog(7, 'convertThumbnail:: make thumbnail dir : ' + _targetDir);
                    _copyCreatingImage();
                });
            }
        });

        function _copyCreatingImage() {
            // 生成中画像のコピー
            var _fromFilePath = Path.join(__dirname, CREATING_IMAGE_FILE);
            var _toFilePath = _targetFilePath;
            _log.connectionLog(7, 'copyCreatingImage:: from : ' + _fromFilePath);
            _log.connectionLog(7, 'copyCreatingImage:: to : ' + _toFilePath);

            var _fromFile = Fs.createReadStream(_fromFilePath);
            var _toFile = Fs.createWriteStream(_toFilePath);
            _fromFile.on('data', function(data) {
                _toFile.write(data);
            });
            _fromFile.on('close', function() {
                _toFile.end();
                onCallback(_startConvert);
            });
            _fromFile.on('error', function(err) {
                _log.connectionLog(3, 'copyCreatingImage:: fromFile error : ' + err);
                _onCopyError(err);
            });
            _toFile.on('error', function(err) {
                _log.connectionLog(3, 'copyCreatingImage:: toFile error : ' + err);
                _onCopyError(err);
            });

            function _onCopyError(err){
                if(Fs.existsSync(_toFilePath)){
                    Fs.unlink(_toFilePath);
                }
                _toFile.end();
                _fromFile.end();
                onCallback(null);
            }
        }

        // 生成開始
        function _startConvert(onStartConvertCallback) {
            if (onStartConvertCallback == null || typeof onStartConvertCallback != 'function') {
                return false;
            }
            var _tempFilePath = _targetFilePath + '_tmp';
            var _conf = Conf.getInstance();
            var _resizeInfo = {
                src : absFilePath,
                dst : _tempFilePath,
                height : parseInt(_conf.getConfData('THUMBNAIL_HEIGHT', DEFAULT_THUMBNAIL_HEIGHT)),
                width  : parseInt(_conf.getConfData('THUMBNAIL_WIDTH', DEFAULT_THUMBNAIL_WIDTH)),
                ignoreAspectRatio:false
            };
            EasyImage.resize(_resizeInfo).then(
                function (image) {
                    // 生成中画像の削除
                    Fs.unlink(_targetFilePath, function(err){
                        if(err){
                            _log.connectionLog(3, 'startConvert:: target file remove error : ' + err);
                            Fs.unlink(_tempFilePath, function() {       // サムネイルの削除
                                onStartConvertCallback(false);
                            });
                            return;
                        }
                        // 加工済みファイルのリネーム
                        Fs.rename(_tempFilePath, _targetFilePath, function(err){
                            if(err){
                                _log.connectionLog(3, 'startConvert:: rename error : ' + err);
                                Fs.unlink(_tempFilePath, function() {   // サムネイルの削除
                                    onStartConvertCallback(false);
                                });
                                return;
                            }
                            onStartConvertCallback(true);
                        });
                    });
                },
                // サムネイル生成失敗
                function (err) {
                    _log.connectionLog(3, 'startConvert:: convert error : ' + err);
                    Fs.exists(_targetFilePath, function(exists){
                        if(!exists){
                            _removeTempFile();
                            return;
                        }
                        Fs.unlink(_targetFilePath, function(){          // 生成中画像の削除
                            _log.connectionLog(7, 'startConvert:: remove targetFile');
                            _removeTempFile();
                        });
                    });
                    function _removeTempFile(){
                        Fs.exists(_tempFilePath, function(err){
                            if(err){
                                onStartConvertCallback(false);
                                return;
                            }
                            Fs.unlink(_tempFilePath, function(){        // サムネイル画像の削除
                                _log.connectionLog(7, 'startConvert:: remove tempFile');
                                onStartConvertCallback(false);
                            });
                        });
                    }
                }
            );
            return true;
        }
    }

    /**
     * 対象のファイルの場合に拡張子を返す
     * @param {string} filePath : ファイルパス
     */
    function _getImageFileExt(filePath) {
        var _ary = ['.jpg','.jpeg','.gif','.bmp','.png'];
        var _targetFileExt = Path.extname(filePath);
        _targetFileExt = _targetFileExt.toLowerCase();
        for(var _i = 0; _i < _ary.length; _i++){
            if(_targetFileExt == _ary[_i]){
                return _targetFileExt;
            }
        }
        return null;
    }

    /**
     * 加工済みファイルの取得
     * @param {string} originalFilePath : 加工対象のファイルパス
     * @param {string} type : タイプ
     * @param {callback} onCallback : 結果返却用コールバック
     */
    _proto.getConvertedFilePath = function(originalFilePath, type, onCallback) {
        if (onCallback == null || typeof onCallback != 'function') {
            return false;
        }
        if((originalFilePath == null || typeof originalFilePath != 'string' || originalFilePath == '') ||
           (type == null || typeof type != 'string' || type == '')) {
            return false;
        }

        //　対象ファイルが存在しているかチェック
        var _absFilePath = Path.join(__dirname, DATA_DIR, originalFilePath);
        Fs.exists(_absFilePath, function (exists) {
            if(!exists) {
                _log.connectionLog(7, 'FileConvert.getConvertedFilePath:: file not found : ' + _absFilePath);
                onCallback(null);
                return;
            }
            _log.connectionLog(7, 'FileConvert.getConvertedFilePath:: file : ' + _absFilePath);

            //　type確認
            var _callFunction = _getTypeTable[type];
            if(_callFunction == null){
                _log.connectionLog(7, 'FileConvert.getConvertedFilePath:: type not found : ' + type);
                onCallback(null);
                return;
            }
            _callFunction(originalFilePath, onCallback);
        });
        return true;
    }

    /**
     * サムネイル画像取得
     * @param {string} originalFilePath : 生成対象のファイルパス
     * @param {callback} onCallback : 結果返却用コールバック
     */
    function _getThumbnailFilePath(originalFilePath, onCallback) {
        //　拡張子チェック
        var _absFilePath = Path.join(__dirname, DATA_DIR, originalFilePath);
        var _ext = _getImageFileExt(_absFilePath);
        if(_ext == null){
            _log.connectionLog(7, 'getThumbnailFilePath:: not convertable file : ' + originalFilePath);
            onCallback(null);
            return;
        }

        var _work = Path.basename(_absFilePath, _ext);
        var _targetFilename = _work + DEFAULT_THUMBNAIL_EXT;
        _work = Path.dirname(_absFilePath);
        var _targetDir = Path.join(_work, THUMBNAIL_DIR);
        var _targetFilePath = Path.join(_targetDir, _targetFilename);

        //　加工済みファイルをチェック
        Fs.exists(_targetFilePath, function (exists) {
            if(!exists) {
                _log.connectionLog(7, 'getThumbnailFilePath:: converted file not found: ' + _targetFilePath);
                onCallback(null);
                return;
            }
            var _retFilePath = Path.dirname(originalFilePath);
            _retFilePath = Path.join(_retFilePath, THUMBNAIL_DIR, _targetFilename);
            onCallback(_retFilePath);
        });
    }

    var _fileConvert = new FileConvert();
    FileConvert.getInstance = function() {
        return _fileConvert;
    };
    exports.getInstance = FileConvert.getInstance;

})();

