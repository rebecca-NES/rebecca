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
function Utils() {
};(function() {
    Utils.STANDARD_DATE_FORMAT = '{yyyy}/{MM}/{dd} {HH}:{mm}:{ss}';
    Utils.DISPLAY_STANDARD_DATE_FORMAT = '{yyyy}/{MM}/{dd} {HH}:{mm}';
    Utils.DISPLAY_DATEPICKER_DATE_FORMAT = 'yy/mm/dd';
    Utils.DISPLAY_VOTE_END_DATE_FORMAT = '{MM}/{dd} {HH}:{mm}';
    Utils.SERVER_NAME = 'localhost';

    Utils.getDate = function(srcFormat, dstFormat) {
        var _dateString;
        if(!srcFormat) {
            _dateString = Date.create().format(Utils.STANDARD_DATE_FORMAT);
        } else if(!dstFormat) {
            _dateString = Date.create().format(srcFormat);
        } else {
            _dateString = Date.create(srcFormat).format(dstFormat);
        }
        return _dateString;
    };
    Utils.isValidDate = function(dateStr){

        var match = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})\s(\d{2}):(\d{2})$/);
        if(match == null) {
            return false;
        }

        return new Date(dateStr).isValid();
    };
    Utils.getRandomNumber = function(start, end) {
        return start + Math.floor(Math.random() * (end - start + 1));
    };
    Utils.convertPresenceNumToStr = function(presenceNum) {
        var _presenceStr = '';
        if(presenceNum == null || typeof presenceNum != 'number') {
            return _presenceStr;
        }
        switch(presenceNum) {
            case Person.PRESENCE_STATUS_ONLINE:
                _presenceStr = 'chat';
                break;
            case Person.PRESENCE_STATUS_AWAY:
                _presenceStr = 'away';
                break;
            case Person.PRESENCE_STATUS_EXT_AWAY:
                _presenceStr = 'xa';
                break;
            case Person.PRESENCE_STATUS_DO_NOT_DISTURB:
                _presenceStr = 'dnd';
                break;
            default:
                break;
        }
        return _presenceStr;
    };
    Utils.convertPresenceStrToNum = function(presenceStr) {
        var _presenceNum = Person.PRESENCE_STATUS_OFFLINE;
        if(presenceStr == null || typeof presenceStr != 'string') {
            return _presenceNum;
        }
        switch(presenceStr) {
            case 'chat':
                _presenceNum = Person.PRESENCE_STATUS_ONLINE;
                break;
            case 'away':
                _presenceNum = Person.PRESENCE_STATUS_AWAY;
                break;
            case 'xa':
                _presenceNum = Person.PRESENCE_STATUS_EXT_AWAY;
                break;
            case 'dnd':
                _presenceNum = Person.PRESENCE_STATUS_DO_NOT_DISTURB;
                break;
            default:
                break;
        }
        return _presenceNum;
    };
    Utils.convertEscapedHtml = function(html, convertLinefeed) {
        if(html == null || typeof html != 'string') {
            return '';
        }
        var _str = html;
        _str = _str.replace(/&/g, '&amp;');
        _str = _str.replace(/"/g, '&quot;');
        _str = _str.replace(/'/g, '&#039;');
        _str = _str.replace(/</g, '&lt;');
        _str = _str.replace(/>/g, '&gt;');
        _str = _str.replace(/\t/g, '&#x0009;');
        _str = _str.replace(/ /g, '&nbsp;');
        if(convertLinefeed) {
            _str = _str.replace(/\r\n/g, '<br>');
            _str = _str.replace(/\n|\r/g, '<br>');
        }
        return _str;
    };

    Utils.convertUnEscapedHtml = function(html, convertLinefeed) {
        if(html == null || typeof html != 'string') {
            return '';
        }
        var _str = html;
        _str = _str.replace(/&quot;/g, '"');
        _str = _str.replace(/&#039;/g, '\'');
        _str = _str.replace(/&lt;/g, '<');
        _str = _str.replace(/&gt;/g, '>');
        _str = _str.replace(/&#x0009;/g, '\t');
        _str = _str.replace(/&nbsp;/g, ' ');
        _str = _str.replace(/&amp;/g, '&');
        if(convertLinefeed) {
            _str = _str.replace(/<br>/g, '\n');
        }
        return _str;
    };

    Utils.convertPreEscapedHtml = function(str) {
        if(str == null || typeof str != 'string') {
            return '';
        }
        var _str = Utils.convertEscapedHtml(str, true);
        _str = '<pre>' + _str + '</pre>';
        return _str;
    };
    Utils.stringFormat = function(str, col) {
        col = typeof col === 'object' ? col : Array.prototype.slice.call(arguments, 1);
        return str.replace(/\{\{|\}\}|\{(\w+)\}/g, function(m, n) {
            if(m == "{{") {
                return "{";
            }
            if(m == "}}") {
                return "}";
            }
            return col[n];
        });
    };
    Utils.replaceAll = function(expression, org, dest) {
        return expression.split(org).join(dest);
    };

    Utils.urldecode = function(str){
        var _ret = '';
        try{
            _ret = decodeURIComponent((str+'').replace(/\+/g, '%20'));
        }catch(e) {
            console.log('Can\'t decode str');
        }
        return _ret;
    };


    Utils.getSafeStringData = function(data) {
        var _ret = '';
        if(data == null || typeof data != 'string') {
            return _ret
        }
        return data;
    };

    Utils.getSafeNumberData = function(data) {
        var _ret = 0;
        if(data == null || typeof data != 'number') {
            return _ret
        }
        return data;
    };

    Utils.getSafeArrayData = function(data) {
        var _ret = 0;
        if(data == null || typeof data != 'object' || data.length == null) {
            return [];
        }
        return data;
    };
    Utils.hasSubString = function(str, substr) {
        if(str == null || typeof str != 'string' || substr == null || typeof substr != 'string') {
            return false;
        }
        if(str.indexOf(substr) >= 0) {
            return true;
        }
        return false;
    };
    Utils.hasSubStringWithCaseIgnored = function(str, substr) {
        if(str == null || typeof str != 'string' || substr == null || typeof substr != 'string') {
            return false;
        }
        var _str = str.toLowerCase();
        var _substr = substr.toLowerCase();
        return Utils.hasSubString(_str, _substr);
    };
    Utils.trimString = function(str) {
        if(str == null || typeof str != 'string') {
            return '';
        }
        return str.replace(/(^\s+)|(\s+$)/g, "");
    }
    Utils.convertArrayListToString = function(arraylist, delimitor) {
        var _str = '';
        if(arraylist == null || typeof arraylist != 'object') {
            return _str;
        }
        if(delimitor == null || typeof delimitor != 'string') {
            return _str;
        }
        var _count = arraylist.getCount();
        var _isFirst = true;
        for(var _i = 0; _i < _count; _i++){
             var _item = arraylist.get(_i);
             if (_isFirst) {
                 _isFirst = false;
             } else {
                 _str += delimitor;
             }
             _str += _item;
        }
        return _str;
    };
    Utils.convertStringToArrayList = function(str, delimitor) {
        if(str == null || typeof str != 'string') {
            return null;
        }
        if(delimitor == null || typeof delimitor != 'string') {
            return null;
        }
        var _array = str.split(delimitor);
        var _arrayList = new ArrayList();
        var _count = _array.length;
        for(var _i = 0; _i < _count; _i++){
             var _item = _array[_i];
             _arrayList.add(_item);
        }
        return _arrayList;
    };
    Utils.convertStringToArray = function(str, delimitor) {
        if(str == null || typeof str != 'string') {
            return null;
        }
        if(delimitor == null || typeof delimitor != 'string') {
            return null;
        }
        var _array = str.split(delimitor);
        return _array;
    };
    Utils.trimStringMulutiByteSpace = function(str) {
        if(str == null || typeof str != 'string') {
            return '';
        }
        return str.replace(/^[\s　]+|[\s　]+$/g, '');
    };
    Utils.getSafeValue = function(map, key, def) {
        var _ret = def;
        if(map != null && map[key] != null) {
            _ret = map[key];
        }
        return _ret;
    };
    Utils.getDocumentRootUrl = function() {
        return location.protocol + '//' + Utils.getDocumentRootUrlWithoutProtocol();
    };
    Utils.getDocumentRootUrlWithoutProtocol = function() {
        var _documentRootUrlWithoutProtocol = location.hostname;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') < 0) {
                _documentRootUrlWithoutProtocol += _path + '/';
            } else {
                _documentRootUrlWithoutProtocol += _path.substring(0, _lastPathDelimiterIndex + 1);
            }
        } else {
            _documentRootUrlWithoutProtocol += _path;
        }
        return _documentRootUrlWithoutProtocol;
    };
    Utils.convertEscapedTag = function(input) {
        if(input == null || typeof input != 'string') {
            return '';
        }
        var _str = input;
        _str = _str.replace(/&/g, '&amp;');
        _str = _str.replace(/"/g, '&quot;');
        _str = _str.replace(/</g, '&lt;');
        _str = _str.replace(/>/g, '&gt;');

        return _str;
    };
    Utils.excludeControleCharacters = function(input) {
        if(input == null || typeof input != 'string' || input == '') {
            return '';
        }
        var _str = input;
        _str = _str.replace(/[\u0009\u000B\u000C\u001C\u001D\u001E\u001F\u00A0\u2028\u2029]+/g, ' ');
        return _str;
    };

    Utils.ROOMTYPE_GROUPCHAT = 'room';
    Utils.ROOMTYPE_COMMUNITY = 'community';

    var _what_in_policy_id = {
        action: 1,
        room_type: 2,
        resource_id: 3
    };

    Utils.getPolicyIdByActionAndResource = function(action, resource) {
        if (action == null || typeof action != 'string' || action == ''
            || resource == null || typeof resource != 'string' || resource == '') {
            return "";
        }
        return "p_" + action + "_" + resource;
    };

    Utils.getActionInPolicyId = function(policyId) {
        return Utils.getInfoInPolicyId(policyId, _what_in_policy_id.action);
    };

    Utils.getRoomTypeInPolicyId = function(policyId) {
        return Utils.getInfoInPolicyId(policyId, _what_in_policy_id.room_type);
    };

    Utils.getResourceIdInPolicyId = function(policyId) {
        return Utils.getInfoInPolicyId(policyId, _what_in_policy_id.resource_id);
    };

    Utils.getInfoInPolicyId = function(policyId, what) {
        if (policyId == null || typeof policyId != 'string' || policyId == '') {
            return '';
        }
        var terms = policyId.split('_');
        if (terms.length < 3) {
            return '';
        }
        switch(what) {
        case _what_in_policy_id.action:
            return terms[what];
        case _what_in_policy_id.room_type:
            if (terms[what] == Utils.ROOMTYPE_GROUPCHAT) {
                return Utils.ROOMTYPE_GROUPCHAT;
            } else if (terms[what] == Utils.ROOMTYPE_COMMUNITY) {
                return Utils.ROOMTYPE_COMMUNITY;
            }
            break;
        case _what_in_policy_id.resource_id:
            return terms.slice(2).join('_');
        default:
            break;
        }
        return '';
    };

    Utils.avatarCreate = function(input) {
      var avater = {
      name: '',
      color: ''
    };

    if (input.type === 'user') {
      var reName = input.name.replace(/( | |　)+/g, ' ').replace(/^ /, '').replace(/ $/, '');
      // Variable chars is used like a local variable, but is missing a declaration.
      var chars;
      if (!input.name) {
        avater.name = "";
      } else if (reName.match(/( | |　)/)) {
        let names = reName.split(' ');
        avater.name = Array.from(names[0])[0] + Array.from(names[1])[0];
      } else {
        chars = Array.from(reName);
        avater.name = chars[0] + (1 < chars.length ? chars[1] : "");
        avater.name = Utils.convertEscapedHtml(avater.name);
      }
    } else {
      reName = input.name.replace(/( | )+/g, '');
      chars = Array.from(reName);
      avater.name = chars[0];
    }

    var oct = '';
    var colorN = 0;
    var userColor = ['#e96363', '#e98463', '#e9a663', '#e9c763', '#b23333', '#b25333', '#b27333', '#b29233']
    var groupColor = ['#6379e9', '#639be9', '#63bce9', '#63dee9', '#3348b2', '#3368b2', '#3388b2', '#33a8b2']
    var hashTagColor = ['#d32f2f', '#C2185B', '#7B1FA2', '#512DA8', '#303F9F', '#1976D2', '#0288D1', '#0097A7',
                        '#00796B', '#388E3C', '#689F38', '#AFB42B', '#FBC02D', '#FFA000', '#F57C00', '#E64A19']
    for (var i = 0; i < input.name.length; ++i) {
      var h = input.name.charCodeAt(i).toString(8);
      oct += h
    }
    for (var i = 0; i < oct.length; ++i) {
      colorN = Number(colorN) + Number(oct.substr(i, 1));
    }
    if (input.type === 'user') {
      avater.color = userColor[colorN % 8]
    }else if(input.type === 'hashtag') {
        avater.color = hashTagColor[colorN % 16];
    } else {
      avater.color = groupColor[colorN % 8]
    }
    return avater;
  }
})();
