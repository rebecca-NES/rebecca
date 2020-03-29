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
    const _ = require('underscore');
    var crypto = require('crypto');
    var fs = require('fs');

    function getRandomNumber(start, end) {
        return start + Math.floor(Math.random() * (end - start + 1));
    };

    var _6BitNumToChare = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    function convert6BitNumToChara(num) {
        if (num == null || typeof num != 'number') {
            return '';
        }
        if (num < 0 || num > 63) {
            return '';
        }
        return _6BitNumToChare[num];
    };

    var _0_37_NumToChare = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    function convert38NumToChara(num) {
        if (num == null || typeof num != 'number') {
            return '';
        }
        if (num < 0 || num > 37) {
            return '';
        }
        return _0_37_NumToChare[num];
    };

    function getChildObject(obj, key) {
        if(obj == null || typeof obj != 'object') {
            return null;
        }
        if(key == null || typeof key != 'string' || key == '') {
            return null;
        }
        var _ret = obj[key];
        if(_ret == undefined) {
            return null;
        }
        return _ret;
    };

    function getIPAddress(socket) {
        if(socket == null || typeof socket != 'object') {
            return null;
        }
        var _ret = null;
        if(socket.remoteAddress){
            _ret = socket.clientIP;
        }else if(socket.request.connection.remoteAddress){
            _ret = socket.request.connection.remoteAddress;
        }
        return _ret;
    };

    function getChildXmlElement(parentElem, childNodeName) {
        if(parentElem == null) {
            return null;
        }
        if(parentElem.childNodes == null || typeof parentElem.childNodes != 'function') {
            return null;
        }
        var _childNodes = parentElem.childNodes();
        if(_childNodes.length == null || typeof _childNodes.length != 'number') {
            return null;
        }
        var _childNodeCount = _childNodes.length;
        var _childNode = null;
        var _isFind = false;
        for(var _i = 0; _i < _childNodeCount; _i++) {
            _childNode = _childNodes[_i];
            if(_childNode == null) {
                continue;
            }
            if(_childNode.type == null || typeof _childNode.type != 'function') {
                continue;
            }
            var _type = _childNode.type();
            if(_type == null || typeof _type != 'string' || _type != 'element') {
                continue;
            }
            if(_childNode.name == null || typeof _childNode.name != 'function') {
                continue;
            }
            var _name = _childNode.name();
            if(_name == null || typeof _name != 'string') {
                continue;
            }
            if(_name == childNodeName) {
                _isFind = true;
                break;
            }
        }
        if(_isFind) {
            return _childNode;
        }
        return null;
    };

    function getChildXmlElementArray(parentElem, childNodeName) {
        if(parentElem == null) {
            return null;
        }
        if(parentElem.childNodes == null || typeof parentElem.childNodes != 'function') {
            return null;
        }
        var _childNodes = parentElem.childNodes();
        if(_childNodes.length == null || typeof _childNodes.length != 'number') {
            return null;
        }
        var _childNodeCount = _childNodes.length;
        var _retArray = new Array();
        var _findCount = 0;
        for(var _i = 0; _i < _childNodeCount; _i++) {
            var _childNode = _childNodes[_i];
            if(_childNode == null) {
                continue;
            }
            if(_childNode.type == null || typeof _childNode.type != 'function') {
                continue;
            }
            var _type = _childNode.type();
            if(_type == null || typeof _type != 'string' || _type != 'element') {
                continue;
            }
            if(childNodeName != null) {
                var _name = _childNode.name();
                if(_name == null || typeof _name != 'string') {
                    continue;
                }
                if(_name != childNodeName) {
                    continue;
                }
            }
            _retArray[_findCount] = _childNode;
            _findCount++;
        }
        return _retArray;
    };

    function replaceAll(expression, org, dest) {
        return expression.split(org).join(dest);
    };

    function md5Hex(src) {
        var md5 = crypto.createHash('md5');
        md5.update(src, 'utf8');
        return md5.digest('hex');
    };

    function sha256Hex(src) {
        var _sha256 = crypto.createHash('sha256');
        _sha256.update(src, 'utf8');
        return _sha256.digest('hex');
    }

    function trim(src) {
        return src.replace(/(^\s+)|(\s+$)/g, '');
    }

    function checkRegExp(str, regexp) {
        if (!(str.match(regexp))) {
            return false;
        } else {
            return true;
        }
    };

    var ENCODING_UTF8 = 'utf8';
    function appendDataFile(filePath, lineData, encoding) {
        var _encoding = ENCODING_UTF8;
        if(encoding != null && typeof encoding == 'string') {
            _encoding = encoding;
        }
        var _lineData = lineData + '\n';
        fs.appendFileSync(filePath, _lineData, _encoding);
    }

    function excludeControleCharacters(input) {
        if(input == null || typeof input != 'string' || input == '') {
            return '';
        }
        var _str = input;
        _str = _str.replace(/[\u0009\u000B\u000C\u001C\u001D\u001E\u001F\u00A0\u2028\u2029]+/g, ' ');
        return _str;
    };


    const varidieter = {
        parentRoomId : (value) => {
            if(!_.isString(value) ||
               value.length > 272 ||
               value.match(/[^a-zA-Z0-9_.*!#$%&*+-]/)){
                return false;
            }else{
                return true;
            }
        },
        memberEntryType : (value) => {
            if(!_.isString(value) ||
               (value.length != 6 && value.length != 3) ||
               value.match(/[^a-fA-F0-9]/)){
                return false;
            }else{
                return true;
            }
        }
    };

    function convertDecimalToHexa(number) {
        return number.toString(16).toUpperCase();
    };

    function convertHexaToDecimal(string) {
        return parseInt(string, 16);
    };

    function convertThreeWordToSix (string) {
        var codeArr = string.split('');
        let res = codeArr[0] + codeArr[0] + codeArr[1] + codeArr[1] + codeArr[2] + codeArr[2];
        return res;
    };

    function CheckDeletedBy(deletedBy) {
        var _ret = false;
        if (deletedBy != null && deletedBy != '') {
            if (deletedBy.startsWith('adminDelete:')) {
                _ret = true;
            }
        }
        return _ret;
    };

    const formatDate = (dateString) => {
        if(!dateString){
            return "";
        }
        let date = new Date(dateString);
        return date.getFullYear()
             + "/" + ("0" + (date.getMonth() + 1)).slice(-2)
             + "/" + ("0" + date.getDate()).slice(-2)
             + " " + ("0" + date.getHours()).slice(-2)
             + ":" + ("0" + date.getMinutes()).slice(-2)
             + ":" + ("0" + date.getSeconds()).slice(-2)
             + "." + ("000" + date.getMilliseconds()).slice(-3);
    };

    exports.getRandomNumber = getRandomNumber;
    exports.convert6BitNumToChara = convert6BitNumToChara;
    exports.convert38NumToChara = convert38NumToChara;
    exports.getChildObject = getChildObject;
    exports.getIPAddress = getIPAddress;
    exports.getChildXmlElement = getChildXmlElement;
    exports.getChildXmlElementArray = getChildXmlElementArray;
    exports.replaceAll = replaceAll;
    exports.md5Hex = md5Hex;
    exports.sha256Hex = sha256Hex;
    exports.trim = trim;
    exports.checkRegExp = checkRegExp;
    exports.ENCODING_UTF8 = ENCODING_UTF8;
    exports.appendDataFile = appendDataFile;
    exports.excludeControleCharacters = excludeControleCharacters;
    exports.varidieter = varidieter;
    exports.convertHexaToDecimal = convertHexaToDecimal;
    exports.convertDecimalToHexa = convertDecimalToHexa;
    exports.convertThreeWordToSix = convertThreeWordToSix;
    exports.CheckDeletedBy = CheckDeletedBy;
    exports.formatDate = formatDate;
})();
