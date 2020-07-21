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
            if(!fs.existsSync(_dataDir)) {
                fs.mkdirSync(_dataDir);
            }
            var _tenantDirStr = _dataDirStr + tenantUuid;
            var _tenantDir = path.join(__dirname, _tenantDirStr);
            if(!fs.existsSync(_tenantDir)) {
                fs.mkdirSync(_tenantDir);
            }
            var _userDirStr = _tenantDirStr + DIR_DELIMITER + USER_DIR;
            var _userDir = path.join(__dirname, _userDirStr);
            if(!fs.existsSync(_userDir)) {
                fs.mkdirSync(_userDir);
            }
            var _accountDirStr = _userDirStr + DIR_DELIMITER + _account;
            var _accountDir = path.join(__dirname, _accountDirStr);
            if(!fs.existsSync(_accountDir)) {
                fs.mkdirSync(_accountDir);
            }
            var _imageDirStr = _accountDirStr + DIR_DELIMITER + useType;
            var _imageDir = path.join(__dirname, _imageDirStr);
            if(!fs.existsSync(_imageDir)) {
                fs.mkdirSync(_imageDir);
            }
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
            var _filename = '';
            for(var _i = 0; _i < 10; _i++) {
                _filename = _self._createAvatarFileName();
                if(_filename == null || typeof _filename != 'string' || _filename.length != 8) {
                    continue;
                }
                _filename = prefix + '_' + _filename + _fileExt;
                _imagePath = _imageDir + DIR_DELIMITER + _filename;
                if(fs.existsSync(_imagePath)) {
                    _imagePath = '';
                    continue;
                }
                break;
            }
            if (_imagePath == '') {
                _log.connectionLog(3, 'Create image filename failed');
                return null;
            }
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
    _proto._createAvatarFileName = function() {
        var _ret = '';
        for(var _i = 0; _i < 8; _i++) {
            var _num6bit = Utils.getRandomNumber(0, 63);
            _ret += Utils.convert6BitNumToChara(_num6bit);
        }
        return _ret;
    };
    _proto._createCommunityFileName = function() {
        var _self = this;
        return _self._createAvatarFileName();
    };
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
                if (!_checkPrefix || (_checkPrefix && _fileList[_i].indexOf(prefix + '_') == 0)) {
                    _filePathList.push(_imagePath + _fileList[_i]);
                }
            }
        }
        return _filePathList;
    };

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
                if (!_checkPrefix || (_checkPrefix && _fileList[_i].indexOf(prefix + '_') == 0)) {
                    _filePathList.push(_imagePath + _fileList[_i]);
                }
            }
        }
        return _filePathList;
    };

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
            if(!fs.existsSync(_dataDir)) {
                fs.mkdirSync(_dataDir);
            }
            var _tenantDirStr = _dataDirStr + tenantUuid;
            var _tenantDir = path.join(__dirname, _tenantDirStr);
            if(!fs.existsSync(_tenantDir)) {
                fs.mkdirSync(_tenantDir);
            }
            var _userDirStr = _tenantDirStr + DIR_DELIMITER + USER_DIR;
            var _userDir = path.join(__dirname, _userDirStr);
            if(!fs.existsSync(_userDir)) {
                fs.mkdirSync(_userDir);
            }
            var _accountDirStr = _userDirStr + DIR_DELIMITER + _account;
            var _accountDir = path.join(__dirname, _accountDirStr);
            if(!fs.existsSync(_accountDir)) {
                fs.mkdirSync(_accountDir);
            }
            var _imageDirStr = _accountDirStr + DIR_DELIMITER + useType;
            var _imageDir = path.join(__dirname, _imageDirStr);
            if(!fs.existsSync(_imageDir)) {
                fs.mkdirSync(_imageDir);
            }
            var _filename = '';
            var _fileExt = fileExt.toLowerCase();
            if(!imageContentType[_fileExt]){
                _log.connectionLog(3, 'Image type is invaild ');
                return null;
            }
            for(var _i = 0; _i < 10; _i++) {
                _filename = _self._createAvatarFileName();
                if(_filename == null || typeof _filename != 'string' || _filename.length != 8) {
                    continue;
                }
                _filename = prefix + '_' + _filename + _fileExt;
                _newImagePath = _imageDir + DIR_DELIMITER + _filename;
                if(fs.existsSync(_newImagePath)) {
                    _newImagePath = '';
                    continue;
                }
                break;
            }
            if (_newImagePath == '') {
                _log.connectionLog(3, 'Move image filename failed');
                return null;
            }
            fs.renameSync(filePath, _newImagePath);
            _newImagePath = tenantUuid + DIR_DELIMITER + USER_DIR + _account + DIR_DELIMITER + useType + DIR_DELIMITER + _filename;
            _log.connectionLog(7, 'moveToUserFilePath :: _newImagePath : ' + _newImagePath);
            return _newImagePath;
        }catch(err){
            _log.connectionLog(3, err.stack);
            return null;
        }
    };

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
            if(!fs.existsSync(_dataDir)) {
                fs.mkdirSync(_dataDir);
            }
            var _tenantDirStr = _dataDirStr + tenantUuid;
            var _tenantDir = path.join(__dirname, _tenantDirStr);
            if(!fs.existsSync(_tenantDir)) {
                fs.mkdirSync(_tenantDir);
            }
            var _communityDirStr = _tenantDirStr + DIR_DELIMITER + COMMUNITY_DIR;
            var _communityDir = path.join(__dirname, _communityDirStr);
            if(!fs.existsSync(_communityDir)) {
                fs.mkdirSync(_communityDir);
            }
            var _communityIdDirStr = _communityDirStr + DIR_DELIMITER + _communityIdAndHost;
            var _communityIdDir = path.join(__dirname, _communityIdDirStr);
            if(!fs.existsSync(_communityIdDir)) {
                fs.mkdirSync(_communityIdDir);
            }
            var _imageDirStr = _communityIdDirStr + DIR_DELIMITER + useType;
            var _imageDir = path.join(__dirname, _imageDirStr);
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
            for(var _i = 0; _i < 10; _i++) {
                _filename = _self._createCommunityFileName();
                if(_filename == null || typeof _filename != 'string' || _filename.length != 8) {
                    continue;
                }
                _filename = prefix + '_' + _filename + _fileExt;
                _newImagePath = _imageDir + DIR_DELIMITER + _filename;
                if(fs.existsSync(_newImagePath)) {
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
