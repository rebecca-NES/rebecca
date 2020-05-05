(function() {
    var Utils = require('../utils');
    var ServerLog = require('./server_log');
    var SynchronousBridgeNodeXmpp = require('./synchronous_bridge_node_xmpp');
    var SessionDataMannager = require('./session_data_manager');
    var RequestData = require('../model/request_data').RequestData;
    var PersonData = require('../model/person_data');
    var SocketIo = require('./socket_io_receiver');
    var RegisteredContactData = require('../model/registered_contact_data');
    var fs = require('fs');
    var path = require('path');

    var _log = ServerLog.getInstance();

    function ImageFileUtils() {
    };

    //定数定義

    var DIR_DELIMITER = '/';
    var DATA_DIR = '../../data/';
    var USER_DIR = 'user/';
    var USE_TYPE_AVATER = 'avatar';
    var PREFIX_ORIGINAL = 'original';
    var COMMUNITY_DIR = 'comm/';
    var USE_TYPE_LOGO = 'logo';

    var imageContentType = {
        ".jpg" : "image/jpeg",
        ".gif" : "image/gif",
        ".png" : "image/png",
        ".jfif" : "image/jpeg",
        ".jpeg" : "image/jpeg",
        ".jpe" : "image/jpeg",
        ".bmp" : "image/bmp",
        ".dib" : "image/bmp",
    };

    var _proto = ImageFileUtils.prototype;

    /**
     * ユーザに紐付く画像ファイルの作成
     * @param {string} tenantUuid : テナントUUID
     * @param {string} jid : ユーザJID
     * @param {string} dataType : データタイプ
     * @param {string} dataString : データ文字列（base64）
     * @param {string} useType : データ用途（フォルダ名）
     * @param {string} prefix : ファイル名のprefix
     * @return {string} イメージパス（/user/～）
     */
    //
    _proto.createUserFile = function(tenantUuid, jid, dataType, dataString, useType, prefix) {
        try{
            var _imagePath = '';
            var _self = this;
            if(tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
                return null;
            }
            if(jid == null || typeof jid != 'string' || jid == '') {
                return null;
            }
            if(dataType == null || typeof dataType != 'string' || dataType == '') {
                return null;
            }
            if(dataString == null || typeof dataString != 'string' || dataString == '') {
                return null;
            }
            if(useType == null || typeof useType != 'string' || useType == '') {
                return null;
            }
            if(prefix == null || typeof prefix != 'string' || prefix == '') {
                return null;
            }
            var _account = jid.split('@')[0];
            var _dataDirStr = DATA_DIR;
            var _dataDir = path.join(__dirname, _dataDirStr);
            //dataディレクトリが存在しない場合は作成
            if(!fs.existsSync(_dataDir)) {
                fs.mkdirSync(_dataDir);
            }
            var _tenantDirStr = _dataDirStr + tenantUuid;
            var _tenantDir = path.join(__dirname, _tenantDirStr);
            //tenantディレクトリが存在しない場合は作成
            if(!fs.existsSync(_tenantDir)) {
                fs.mkdirSync(_tenantDir);
            }
            var _userDirStr = _tenantDirStr + DIR_DELIMITER + USER_DIR;
            var _userDir = path.join(__dirname, _userDirStr);
            //userディレクトリが存在しない場合は作成
            if(!fs.existsSync(_userDir)) {
                fs.mkdirSync(_userDir);
            }
            var _accountDirStr = _userDirStr + DIR_DELIMITER + _account;
            var _accountDir = path.join(__dirname, _accountDirStr);
            //accountディレクトリが存在しない場合は作成
            if(!fs.existsSync(_accountDir)) {
                fs.mkdirSync(_accountDir);
            }
            var _imageDirStr = _accountDirStr + DIR_DELIMITER + useType;
            var _imageDir = path.join(__dirname, _imageDirStr);
            //useTypeで指定されたディレクトリが存在しない場合は作成
            if(!fs.existsSync(_imageDir)) {
                fs.mkdirSync(_imageDir);
            }
            //拡張子を取得
            var _fileExt = '';
            for (var _key in imageContentType) {
                if (imageContentType[_key] == dataType.toLowerCase()) {
                    _fileExt = _key;
                    break;
                }
            }
            if(_fileExt == ''){
                _log.connectionLog(3, 'Image type is invaild : ' + dataType);
                return null;
            }
            // 最大10回トライする
            var _filename = '';
            for(var _i = 0; _i < 10; _i++) {
                //avatarの場合ランダムの名前を生成
                _filename = _self._createAvatarFileName();
                if(_filename == null || typeof _filename != 'string' || _filename.length != 8) {
                    // 値が不正なのでリトライ
                    continue;
                }
                //存在確認
                _filename = prefix + '_' + _filename + _fileExt;
                _imagePath = _imageDir + DIR_DELIMITER + _filename;
                if(fs.existsSync(_imagePath)) {
                    // 既にあるのでリトライ
                    _imagePath = '';
                    continue;
                }
                break;
            }
            if (_imagePath == '') {
                _log.connectionLog(3, 'Create image filename failed');
                return null;
            }
            //ファイル作成
            var buffer = new Buffer(dataString, 'base64');
            fs.writeFileSync(_imagePath, buffer);
            _imagePath = tenantUuid + DIR_DELIMITER + USER_DIR + _account + DIR_DELIMITER + useType + DIR_DELIMITER + _filename;
            _log.connectionLog(7, 'createUserFile :: _imagePath : ' + _imagePath);
            return _imagePath;
        }catch(err){
            _log.connectionLog(3, err.stack);
            return null;
        }
    };
    //ファイル名生成(アバター用)
    _proto._createAvatarFileName = function() {
        // 8桁の文字列を生成
        var _ret = '';
        for(var _i = 0; _i < 8; _i++) {
            var _num6bit = Utils.getRandomNumber(0, 63);
            _ret += Utils.convert6BitNumToChara(_num6bit);
        }
        return _ret;
    };
    //ファイル名生成(コミュニティ用)
    _proto._createCommunityFileName = function() {
        // アバタと同じで8桁の文字列を生成
        var _self = this;
        return _self._createAvatarFileName();
    };
    /**
     * 指定ユーザディレクトリ内のファイルパスを取得
     * prefix省略時は全てのファイル
     * @param {string} tenantUuid : テナントUUID
     * @param {string} jid : ユーザJID
     * @param {string} useType : データ用途（フォルダ名）
     * @param {string} prefix : ファイル名のprefix
     */
    _proto.getUserFilePathList = function(tenantUuid, jid, useType, prefix) {
        var _filePathList = new Array();
        var _account = jid.split('@')[0];
        var _imageDirStr = DATA_DIR + tenantUuid + DIR_DELIMITER + USER_DIR + _account + DIR_DELIMITER + useType;
        var _imageDir = path.join(__dirname, _imageDirStr);
        var _imagePath = tenantUuid + DIR_DELIMITER + USER_DIR + _account + DIR_DELIMITER + useType + DIR_DELIMITER;
        var _checkPrefix = false;
        if (prefix != null || typeof prefix != 'string' || prefix.length > 0) {
            _checkPrefix = true;
        }
        if(fs.existsSync(_imageDir)) {
            var _fileList = fs.readdirSync(_imageDir);
            for (var _i = 0; _i < _fileList.length; _i++) {
                // This use of variable '_checkPrefix' always evaluates to true.
                // if (!_checkPrefix || (_checkPrefix && _fileList[_i].indexOf(prefix + '_') == 0)) {
                if (!_checkPrefix || (_fileList[_i].indexOf(prefix + '_') == 0)) {
                    _filePathList.push(_imagePath + _fileList[_i]);
                }
            }
        }
        return _filePathList;
    };

    /**
     * 指定コミュニティディレクトリ内のファイルパスを取得
     * prefix省略時は全てのファイル
     * @param {string} tenantUuid : テナントUUID
     * @param {string} roomId : コミュニティID
     * @param {string} xmppServerName : XMPPサーバのホスト名
     * @param {string} useType : データ用途（フォルダ名）
     * @param {string} prefix : ファイル名のprefix
     */
    _proto.getCommunityFilePathList = function(tenantUuid, roomId, xmppServerName, useType, prefix) {
        var _filePathList = new Array();
        var _communityIdAndHost = roomId + '_' + xmppServerName;
        var _imageDirStr = DATA_DIR + tenantUuid + DIR_DELIMITER + COMMUNITY_DIR + _communityIdAndHost + DIR_DELIMITER + useType;
        var _imageDir = path.join(__dirname, _imageDirStr);
        var _imagePath = tenantUuid + DIR_DELIMITER + COMMUNITY_DIR + _communityIdAndHost + DIR_DELIMITER + useType + DIR_DELIMITER;
        var _checkPrefix = false;
        if (prefix != null || typeof prefix != 'string' || prefix.length > 0) {
            _checkPrefix = true;
        }
        if(fs.existsSync(_imageDir)) {
            var _fileList = fs.readdirSync(_imageDir);
            for (var _i = 0; _i < _fileList.length; _i++) {
                // This use of variable '_checkPrefix' always evaluates to true.
                // if (!_checkPrefix || (_checkPrefix && _fileList[_i].indexOf(prefix + '_') == 0)) {
                if (!_checkPrefix || (_fileList[_i].indexOf(prefix + '_') == 0)) {
                    _filePathList.push(_imagePath + _fileList[_i]);
                }
            }
        }
        return _filePathList;
    };

    //ファイルの削除
    _proto.deleteFile = function(filePath) {
        try{
            var _imagePathStr = DATA_DIR + filePath;
            var _imagePath = path.join(__dirname, _imagePathStr);
            fs.unlinkSync(_imagePath);
            return true;
        }catch(err){
            _log.connectionLog(3, err.stack);
            return false;
        }
    };

    //ファイルデータ取得
    _proto.getFileData = function(filePath) {
        try{
            var _self = this;
            var _imagePathStr = DATA_DIR + filePath;
            var _imagePath = path.join(__dirname, _imagePathStr);
            if(!fs.existsSync(_imagePath)) {
                _log.connectionLog(3, _imagePath + 'is not exist.');
                return null;
            }
            var _fileExt = path.extname(_imagePath);
            var _imageType = imageContentType[_fileExt];
            if(!_imageType){
                _log.connectionLog(3, 'Image type is invaild : ' + _imageType);
                return null;
            }
            var _imageBinary = fs.readFileSync(_imagePath);
            var _fileData = {};
            _fileData.type = _imageType;
            _fileData.binary = _imageBinary;
            return _fileData;
        }catch(err){
            _log.connectionLog(3, err.stack);
            return null;
        }
    };
    /**
     * ユーザに紐付く格納場所へファイルの移動
     * @param {string} tenantUuid : テナントUUID
     * @param {string} jid : ユーザJID
     * @param {string} path : コピー元のパス
     * @param {string} fileExt : ファイル拡張子
     * @param {string} useType : データ用途（フォルダ名）
     * @param {string} prefix : ファイル名のprefix
     * @return {string} イメージパス（user/～）
     */
    //
    _proto.moveToUserFilePath = function(tenantUuid, jid, filePath, fileExt, useType, prefix) {
        try{
            var _newImagePath = '';
            var _self = this;
            if(tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
                return null;
            }
            if(jid == null || typeof jid != 'string' || jid == '') {
                return null;
            }
            if(filePath == null || typeof filePath != 'string' || filePath == '') {
                return null;
            }
            if(fileExt == null || typeof fileExt != 'string') {
                return null;
            }
            if(useType == null || typeof useType != 'string' || useType == '') {
                return null;
            }
            if(prefix == null || typeof prefix != 'string' || prefix == '') {
                return null;
            }
            var _account = jid.split('@')[0];
            var _dataDirStr = DATA_DIR;
            var _dataDir = path.join(__dirname, _dataDirStr);
            //dataディレクトリが存在しない場合は作成
            if(!fs.existsSync(_dataDir)) {
                fs.mkdirSync(_dataDir);
            }
            var _tenantDirStr = _dataDirStr + tenantUuid;
            var _tenantDir = path.join(__dirname, _tenantDirStr);
            //tenantディレクトリが存在しない場合は作成
            if(!fs.existsSync(_tenantDir)) {
                fs.mkdirSync(_tenantDir);
            }
            var _userDirStr = _tenantDirStr + DIR_DELIMITER + USER_DIR;
            var _userDir = path.join(__dirname, _userDirStr);
            //userディレクトリが存在しない場合は作成
            if(!fs.existsSync(_userDir)) {
                fs.mkdirSync(_userDir);
            }
            var _accountDirStr = _userDirStr + DIR_DELIMITER + _account;
            var _accountDir = path.join(__dirname, _accountDirStr);
            //accountディレクトリが存在しない場合は作成
            if(!fs.existsSync(_accountDir)) {
                fs.mkdirSync(_accountDir);
            }
            var _imageDirStr = _accountDirStr + DIR_DELIMITER + useType;
            var _imageDir = path.join(__dirname, _imageDirStr);
            //useTypeで指定されたディレクトリが存在しない場合は作成
            if(!fs.existsSync(_imageDir)) {
                fs.mkdirSync(_imageDir);
            }
            var _filename = '';
            var _fileExt = fileExt.toLowerCase();
            if(!imageContentType[_fileExt]){
                _log.connectionLog(3, 'Image type is invaild ');
                return null;
            }
            // 最大10回トライする
            for(var _i = 0; _i < 10; _i++) {
                //avatarの場合ランダムの名前を生成
                _filename = _self._createAvatarFileName();
                if(_filename == null || typeof _filename != 'string' || _filename.length != 8) {
                    // 値が不正なのでリトライ
                    continue;
                }
                //存在確認
                _filename = prefix + '_' + _filename + _fileExt;
                _newImagePath = _imageDir + DIR_DELIMITER + _filename;
                if(fs.existsSync(_newImagePath)) {
                    // 既にあるのでリトライ
                    _newImagePath = '';
                    continue;
                }
                break;
            }
            if (_newImagePath == '') {
                _log.connectionLog(3, 'Move image filename failed');
                return null;
            }
            //ファイル移動
            fs.renameSync(filePath, _newImagePath);
            _newImagePath = tenantUuid + DIR_DELIMITER + USER_DIR + _account + DIR_DELIMITER + useType + DIR_DELIMITER + _filename;
            _log.connectionLog(7, 'moveToUserFilePath :: _newImagePath : ' + _newImagePath);
            return _newImagePath;
        }catch(err){
            _log.connectionLog(3, err.stack);
            return null;
        }
    };

    /**
     * コミュニティに紐付く格納場所へファイルの移動
     * @param {string} tenantUuid : テナントUUID
     * @param {string} roomId : コミュニティID
     * @param {string} xmppServerName : XMPPサーバのホスト名
     * @param {string} path : コピー元のパス
     * @param {string} fileExt : ファイル拡張子
     * @param {string} useType : データ用途（フォルダ名）
     * @param {string} prefix : ファイル名のprefix
     * @param {function} onFileCopyCallback : コールバック関数
     */
    //
    _proto.moveToCommunityFilePath = function(tenantUuid, roomId, xmppServerName, filePath, fileExt, useType, prefix, onFileCopyCallback) {
        try{
            var _newImagePath = '';
            var _self = this;
            if(onFileCopyCallback == null || typeof onFileCopyCallback != 'function') {
                _log.connectionLog(3, 'moveToCommunityFilePath :: onFileCopyCallback is invalid');
                return false;
            }
            if(tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
                onFileCopyCallback(null);
                return;
            }
            if(roomId == null || typeof roomId != 'string' || roomId == '') {
                onFileCopyCallback(null);
                return;
            }
            if(xmppServerName == null || typeof xmppServerName != 'string' || xmppServerName == '') {
                onFileCopyCallback(null);
                return;
            }
            if(filePath == null || typeof filePath != 'string' || filePath == '') {
                onFileCopyCallback(null);
                return;
            }
            if(fileExt == null || typeof fileExt != 'string') {
                onFileCopyCallback(null);
                return;
            }
            if(useType == null || typeof useType != 'string' || useType == '') {
                onFileCopyCallback(null);
                return;
            }
            if(prefix == null || typeof prefix != 'string' || prefix == '') {
                onFileCopyCallback(null);
                return;
            }
            var _communityIdAndHost = roomId + '_' + xmppServerName;
            var _dataDirStr = DATA_DIR;
            var _dataDir = path.join(__dirname, _dataDirStr);
            //dataディレクトリが存在しない場合は作成
            if(!fs.existsSync(_dataDir)) {
                fs.mkdirSync(_dataDir);
            }
            var _tenantDirStr = _dataDirStr + tenantUuid;
            var _tenantDir = path.join(__dirname, _tenantDirStr);
            //tenantディレクトリが存在しない場合は作成
            if(!fs.existsSync(_tenantDir)) {
                fs.mkdirSync(_tenantDir);
            }
            var _communityDirStr = _tenantDirStr + DIR_DELIMITER + COMMUNITY_DIR;
            var _communityDir = path.join(__dirname, _communityDirStr);
            //commディレクトリが存在しない場合は作成
            if(!fs.existsSync(_communityDir)) {
                fs.mkdirSync(_communityDir);
            }
            var _communityIdDirStr = _communityDirStr + DIR_DELIMITER + _communityIdAndHost;
            var _communityIdDir = path.join(__dirname, _communityIdDirStr);
            //accountディレクトリが存在しない場合は作成
            if(!fs.existsSync(_communityIdDir)) {
                fs.mkdirSync(_communityIdDir);
            }
            var _imageDirStr = _communityIdDirStr + DIR_DELIMITER + useType;
            var _imageDir = path.join(__dirname, _imageDirStr);
            //useTypeで指定されたディレクトリが存在しない場合は作成
            if(!fs.existsSync(_imageDir)) {
                fs.mkdirSync(_imageDir);
            }
            var _filename = '';
            var _fileExt = fileExt.toLowerCase();
            if(!imageContentType[_fileExt]){
                _log.connectionLog(3, 'Image type is invaild ');
                onFileCopyCallback(null);
                return;
            }
            // 最大10回トライする
            for(var _i = 0; _i < 10; _i++) {
                //ランダムの名前を生成
                _filename = _self._createCommunityFileName();
                if(_filename == null || typeof _filename != 'string' || _filename.length != 8) {
                    // 値が不正なのでリトライ
                    continue;
                }
                //存在確認
                _filename = prefix + '_' + _filename + _fileExt;
                _newImagePath = _imageDir + DIR_DELIMITER + _filename;
                if(fs.existsSync(_newImagePath)) {
                    // 既にあるのでリトライ
                    _newImagePath = '';
                    continue;
                }
                break;
            }
            if (_newImagePath == '') {
                _log.connectionLog(3, 'Move image filename(Community) failed');
                onFileCopyCallback(null);
                return;
            }
            // ファイル移動（コピー&削除）
            var oldFile = fs.createReadStream(filePath);
            var newFile = fs.createWriteStream(_newImagePath);
            oldFile.on('data', function(data) {
                newFile.write(data);
            });
            oldFile.on('close', function() {
                newFile.end();
                fs.unlinkSync(filePath);
                _newImagePath = tenantUuid + DIR_DELIMITER + COMMUNITY_DIR + _communityIdAndHost + DIR_DELIMITER + useType + DIR_DELIMITER + _filename;
                _log.connectionLog(7, 'moveToCommunityFilePath :: _newImagePath : ' + _newImagePath);
                onFileCopyCallback(_newImagePath);
            });
        }catch(err){
            _log.connectionLog(3, err.stack);
            onFileCopyCallback(null);
        }
    };

    var _imageFileUtils = new ImageFileUtils();

    ImageFileUtils.getInstance = function() {
        return _imageFileUtils;
    };

    exports.getInstance = ImageFileUtils.getInstance;
    exports.USE_TYPE_AVATER = USE_TYPE_AVATER;
    exports.PREFIX_ORIGINAL = PREFIX_ORIGINAL;
    exports.USE_TYPE_LOGO = USE_TYPE_LOGO;

})();
