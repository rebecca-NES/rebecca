(function() {
    var Utils = require('../utils');
    var ServerLog = require('./server_log');
    var fs = require('fs');
    var path = require('path');

    var _log = ServerLog.getInstance();

    function FileUtils() {
    };

    //定数定義
    var DIR_DELIMITER = '/';
    var DATA_DIR = '../../data/';
    var FILE_UPLOAD_CURRENT_DIR = 'file';
    var MAKE_RANDOM_DIR_RETRY_MAX = 100;        // randomディレクトリ生成リトライ最大回数
    var MAKE_RANDOM_DIR_NAME_NUMBER_MIN = 1;    // randomディレクトリ作成 最小文字数
    var MAKE_RANDOM_DIR_NAME_NUMBER_MAX = 32;   // randomディレクトリ作成 最大文字数
    var MAKE_RANDOM_DIR_NAME_NUMBER = 8;        // makeDirectory()で、randomディレクトリ作成時の文字数

    var _proto = FileUtils.prototype;

    /**
     * 指定された場所にファイルの移動
     * @param {string} tenantUuid : テナントUUID
     * @param {string} filePath : コピー元のパス
     * @param {string} fileName : ファイル名
     * @param {callback} moveToFilePathCallback : 結果返却用コールバック
     */
    _proto.moveToFilePath = function(tenantUuid, filePath, fileName, moveToFilePathCallback) {
        var _self = this;
        if(tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
            setTimeout(function() {
                moveToFilePathCallback(null);
            }, 0);
            return;
        }
        if(filePath == null || typeof filePath != 'string' || filePath == '') {
            setTimeout(function() {
                moveToFilePathCallback(null);
            }, 0);
            return;
        }
        if(fileName == null || typeof fileName != 'string') {
            setTimeout(function() {
                moveToFilePathCallback(null);
            }, 0);
            return;
        }

        // ディレクトリ作成
        _self.makeDirectory(tenantUuid, _onMakeDirectoryEnd);

        function _onMakeDirectoryEnd(newPath) {
            if (newPath == '') {
                _log.connectionLog(3, 'Move filename failed');
                moveToFilePathCallback(null);
                return;
            }

            // ファイル移動（コピー&削除）
            var _newFilePath = newPath + DIR_DELIMITER + fileName;
            _log.connectionLog(7, 'moveToUserFilePath :: oldFilePath : ' + filePath);
            _log.connectionLog(7, 'moveToUserFilePath :: newFilePath : ' + _newFilePath);
            var oldFile = fs.createReadStream(filePath);
            var newFile = fs.createWriteStream(_newFilePath);

            oldFile.on('data', function(data) {
                newFile.write(data);
            });

            oldFile.on('close', function() {
                newFile.end();
                fs.unlink(filePath, function(error) {
                    if(error) {
                        _log.connectionLog(3, 'moveToUserFilePath:: fileUnlink is error : ' + error);
                        moveToFilePathCallback(null);
                        return;
                    }
                    var _dataDir = path.join(__dirname, DATA_DIR);
                    var _retFilePath = _newFilePath.substring(_dataDir.length);
                    moveToFilePathCallback(_retFilePath);
                });
            });
        };
    };

    /**
     * ディレクトリ作成
     * @param {string} tenantUuid : テナントUUID
     * @param {callback} makeDirectoryCallback : 処理結果返却用
     */
    _proto.makeDirectory = function(tenantUuid, makeDirectoryCallback) {
        var _self = this;
        // 現在日時を取得
        var _date = new Date();
        var _yaer = _date.getFullYear();
        var _month = _date.getMonth() + 1;
        var _day = _date.getDate();
        var _hours = _date.getHours();
        var _minutes = _date.getMinutes();
        var _senconds = _date.getSeconds();

        // 演算
        var _dateNum = _yaer << 12 | _month << 8 | _day;
        var _timeNum = (_hours * 60 + _minutes) * 60 + _senconds;

        //　dataディレクトリが存在しない場合は作成
        var _dataDir = path.join(__dirname, DATA_DIR);
        fs.exists(_dataDir, function (exists) {
            if(!exists) {
                // 存在しないため生成
                fs.mkdir(_dataDir, function(error){
                    if(error) {
                        _log.connectionLog(3, 'makeDirectory:: make data dir is error : ' + error);
                        makeDirectoryCallback(null);
                        return;
                    }
                    _makeTenantDir(_dataDir);
                });
            } else {
                // 存在するため次の作成へ
                _makeTenantDir(_dataDir);
            }
        });

        //　tenantディレクトリが存在しない場合は作成
        function _makeTenantDir(dataDir) {
            var _tenantDir = path.join(dataDir, tenantUuid);
            fs.exists(_tenantDir, function (exists) {
                if(!exists) {
                    // 存在しないため生成
                    fs.mkdir(_tenantDir, function(error){
                        if(error) {
                            _log.connectionLog(3, 'makeDirectory:: make tenant dir is error : ' + error);
                            makeDirectoryCallback(null);
                            return;
                        }
                        _makeBaseDir(_tenantDir);
                    });
                } else {
                    // 存在するため次の作成へ
                    _makeBaseDir(_tenantDir);
                }
            });
        }

        // ベースとなるディレクトリが存在しない場合は作成
        function _makeBaseDir(tenantDir) {
            var _upload_base_dir = path.join(tenantDir, FILE_UPLOAD_CURRENT_DIR);
            fs.exists(_upload_base_dir, function (exists) {
                if(!exists) {
                    // 存在しないため生成
                    fs.mkdir(_upload_base_dir, function(error){
                        if(error) {
                            _log.connectionLog(3, 'makeDirectory:: make base dir is error : ' + error);
                            makeDirectoryCallback(null);
                            return;
                        }
                        _onMakeDateDir(_upload_base_dir);
                    });
                } else {
                    // 存在するため次の作成へ
                    _onMakeDateDir(_upload_base_dir);
                }
            });
        }

        //　日付ディレクトリが存在しない場合は作成
        function _onMakeDateDir(upload_base_dir) {
            var _dateDir = path.join(upload_base_dir, ('000000'+_dateNum.toString(16)).slice(-6));
            fs.exists(_dateDir, function (exists) {
                if(!exists) {
                    fs.mkdir(_dateDir, function(error){
                        if(error) {
                            _log.connectionLog(3, 'makeDirectory:: make date dir is error : ' + error);
                            makeDirectoryCallback(null);
                            return;
                        }
                        _onMakeTimeDir(_dateDir);
                    });
                } else {
                    // 存在するため次の作成へ
                    _onMakeTimeDir(_dateDir);
                }
            });
        }

        function _onMakeTimeDir(dateDir) {
            //　時間ディレクトリが存在しない場合は作成
            var _timeDir = path.join(dateDir, ('00000'+_timeNum.toString(16)).slice(-5));
            var _ret;
            fs.exists(_timeDir, function (exists) {
                if(!exists) {
                    fs.mkdir(_timeDir, function(error){
                        if(error) {
                            _log.connectionLog(3, 'makeDirectory:: make time dir is error : ' + error);
                            makeDirectoryCallback(null);
                            return;
                        }
                        _log.connectionLog(7, 'makeDirectory(create directory) : ' + _timeDir);
                        // ランダムディレクトリ作成
                        _ret = _self.makeRandomDirectory(_timeDir, MAKE_RANDOM_DIR_NAME_NUMBER, makeDirectoryCallback);
                        if(_ret != true){
                            makeDirectoryCallback(null);
                            return;
                        }
                    });
                } else {
                    _log.connectionLog(7, 'makeDirectory(exist directory) : ' + _timeDir);
                    // ランダムディレクトリ作成
                    _ret = _self.makeRandomDirectory(_timeDir, MAKE_RANDOM_DIR_NAME_NUMBER, makeDirectoryCallback);
                    if(_ret != true){
                        makeDirectoryCallback(null);
                        return;
                    }
                }
            });
        }
    };

    /**
     * randomディレクトリ作成
     * @param {string} filePath : 作成する位置
     * @param {number} nameNumber : 作成するディレクトリ名の文字数
     * @param {callback} makeDirectoryCallback : 処理結果返却用
     */
    _proto.makeRandomDirectory = function(filePath, nameNumber, onCallback) {
        var _retry = 0;

        if(filePath == '' || filePath == null || typeof filePath != 'string' ||
          onCallback == null || typeof onCallback != 'function' ||
          nameNumber == null || typeof nameNumber != 'number'){
            return false;
        }
        if(nameNumber < MAKE_RANDOM_DIR_NAME_NUMBER_MIN || nameNumber > MAKE_RANDOM_DIR_NAME_NUMBER_MAX){
            return false;
        }

        fs.exists(filePath, function (exists) {
            if(!exists) {
                _log.connectionLog(3, 'makeRandomDirectory:: filePath is not exist : ' + filePath);
                onCallback(null);
                return;
            }
            _makeRandomDirLoop();
        });
        return true;

        function _makeRandomDirLoop() {
            //　ディレクトリ名称作成
            var _randomName = _makeRandomDirName(nameNumber);
            var _randomDir = path.join(filePath, _randomName);
            fs.exists(_randomDir, function (exists) {
                if(!exists) {
                    fs.mkdir(_randomDir, function(error){
                        if(error) {
                            _log.connectionLog(3, 'makeRandomDirectory:: make dir is error : ' + error);
                            onCallback(null);
                            return;
                        }
                        _log.connectionLog(7, 'makeRandomDirectory : ' + _randomDir);
                        // ディレクトリ返却
                        onCallback(_randomDir);
                    });
                } else {
                    _log.connectionLog(7, 'makeRandomDirectory:: retry make random dir');
                    _retry++;
                    if(_retry >= MAKE_RANDOM_DIR_RETRY_MAX){
                        _log.connectionLog(3, 'makeRandomDirectory:: retry over');
                        onCallback(null);
                        return;
                    }
                    _makeRandomDirLoop();
                }
            });
        }

        function _makeRandomDirName(num) {
            var _ret = '';
            for(var _i = 0; _i < num; _i++){
                var _randomNum = Utils.getRandomNumber(0, 37);
                _ret += Utils.convert38NumToChara(_randomNum);
            }
            return _ret;
        }
    };

    /**
     * URLからファイルパス部分を取得
     * @param {string} tenantUuid : テナントUUID
     * @param {string} url : URL
     * @param {callback} getDownloadFilePathCallback : 処理結果返却用
     */
    _proto.getFilePathFromURL = function(tenantUuid, url, getDownloadFilePathCallback) {
        var _self = this;
        if(tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
            getDownloadFilePathCallback(null);
            return;
        }
        if(url == null || typeof url != 'string' || url == '') {
            getDownloadFilePathCallback(null);
            return;
        }
        // バックスラッシュでスプリット
        var _separator = '/';
        var _dirs = url.split(_separator);

        var _firstFilePathIndex = 3;
        var _dir = '';
        for(var i=_firstFilePathIndex; i < _dirs.length; i++) {
            _dir = _dir + _separator + _dirs[i];
        }

        // URLだったのでエンコードされている
        _dir = decodeURI(_dir);
        // パスにテナントUUIDを追加
        _dir = _dir.replace('file/', tenantUuid + '/file/');
        _log.connectionLog(7, 'filepath : ' + _dir);

        getDownloadFilePathCallback(_dir);
    };

    /**
     * URLから相対パスでのファイルパスを取得
     * @param {string} tenantUuid : テナントUUID
     * @param {string} url : URL
     * @param {string} location_root : SYSTEM LOCATION ROOT
     * @param {callback} getDownloadFilePathCallback : 処理結果返却用
     */
    _proto.getRelativeFilePathFromURL = function(tenantUuid, url, location_root, getFilePathCallback) {
        var _self = this;
        if (url == null || typeof url != 'string' || url == '') {
            getFilePathCallback(null);
            return;
        }
        if (location_root == null || typeof location_root != 'string' || location_root == '') {
            location_root = '/';
        }
        // バックスラッシュでスプリット
        var _dirs = url.split(path.sep);
        var _rPath = path.join(__dirname, DATA_DIR);

        // location_root を "/" ではじまり、"/" で終わるよう 構成する
        if (location_root[0] != path.sep){
            // 0文字目が "/" でなければ、追加する
            location_root = path.sep + location_root;
        }
        if (location_root[location_root.length-1] != path.sep){
            // 最後の文字が "/" でなければ、追加する
            location_root = location_root + path.sep;
        }

        // 0st     1st  2nd      3rd..   any
        // http: /    / domain / cubee / file / random1 / random2 / random3 / filename

        // domain部分まで削除し、先頭に"/"を追加する
        var urls = _dirs.splice(3);
        urls = urls.join(path.sep);
        urls = path.sep + urls;

        // 開始位置の文字列がlocation_rootと一致している場合、それ以降を取得する
        if (urls.substring(0,location_root.length) == location_root){
            urls = urls.slice(location_root.length);
        } else {
            // SYSTEM_LOCATION_ROOT が想定外
            _log.connectionLog(3, 'FileUtils#getRelativeFilePathFromURL unexpected url: ' + url);
            getFilePathCallback(null);
            return;
        }

        //ディレクトリパスと結合する
        _rPath = path.join(_rPath, tenantUuid);
        _rPath = path.join(_rPath, urls);

        // URLだったのでエンコードされている
        _rPath = decodeURI(_rPath);

        _log.connectionLog(7, 'FileUtils#getRelativeFilePathFromURL#result filepath: ' + _rPath);

        getFilePathCallback(_rPath);
    };

    /*
     * RFC 2231 形式に変換する
     */
    _proto.rawurlencode = function(str) {
        str = (str + '');
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29');
    };

    var _fileUtils = new FileUtils();

    FileUtils.getInstance = function() {
        return _fileUtils;
    };

    exports.getInstance = FileUtils.getInstance;

})();
