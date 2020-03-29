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
    var Utils = require('../utils')

    function PersonData(personDataContent) {
        var _self = this;
        _self._group = null;
        _self._userName = null;
        _self._jid = null;
        _self._presence = PersonData.PRESENCE_STATUS_OFFLINE;
        _self._myMemo = null;
        _self._avatarType = null;
        _self._avatarData = null;
        _self._mail = null;
        _self._nickName = null;

                if(personDataContent){
            _self.setGroup(Utils.getChildObject(personDataContent, 'groupItems'));
            _self.setUserName(Utils.getChildObject(personDataContent, 'userName'));
            _self.setUserName(Utils.getChildObject(personDataContent, 'name'));
            _self.setUserName(Utils.getChildObject(personDataContent, 'user'));
            _self.setJid(Utils.getChildObject(personDataContent, 'jid'));
            _self.setPresence(Utils.getChildObject(personDataContent, 'presence'));
            _self.setMyMemo(Utils.getChildObject(personDataContent, 'myMemo'));
            _self.setAvatarType(Utils.getChildObject(personDataContent, 'avatarType'));
            _self.setAvatarData(Utils.getChildObject(personDataContent, 'avatarData'));
            _self.setMail(Utils.getChildObject(personDataContent, 'mail'));
            _self.setNickName(Utils.getChildObject(personDataContent, 'nickName'));
        }
    };

    PersonData.create = function(arg) {
        var _personData = null;
        switch (arguments.length) {
             case 0: _personData = new PersonData(null);
                    break;
             case 1: _personData = new PersonData(arg);
                    break;
             default:
                    break;
         }
        return _personData;
    };

    PersonData.PRESENCE_STATUS_OFFLINE = 0;
    PersonData.PRESENCE_STATUS_ONLINE = 1;
    PersonData.PRESENCE_STATUS_AWAY = 2;
    PersonData.PRESENCE_STATUS_EXT_AWAY = 3;
    PersonData.PRESENCE_STATUS_DO_NOT_DISTURB = 4;

    PersonData.SUBSCRIPTION_STATUS_UNKNOWN = 'unknown';
    PersonData.SUBSCRIPTION_STATUS_BOTH = 'both';
    PersonData.SUBSCRIPTION_STATUS_TO = 'to';
    PersonData.SUBSCRIPTION_STATUS_FROM ='from';
    PersonData.SUBSCRIPTION_STATUS_NONE = 'none';

    PersonData.AUTHORITY_TYPE_UNKNOWN = 'unknown';
    PersonData.AUTHORITY_TYPE_ADMIN = 'admin';

    var _proto = PersonData.prototype;

    _proto.getGroup = function() {
        return this._group;
    };
    _proto.setGroup = function(group) {
        if(group == null || typeof group != 'object') {
            return;
        }
        this._group = group;
    };
    _proto.getUserName = function() {
        return this._userName;
    };
    _proto.setUserName = function(userName) {
        if(userName == null || typeof userName != 'string') {
            return;
        }
        this._userName = userName;
    };
    _proto.getJid = function() {
        return this._jid;
    };
    _proto.setJid = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return;
        }
        this._jid = jid;
    };
    _proto.getPresence = function() {
        return this._presence;
    };
    _proto.setPresence = function(presence) {
        if(presence == null || typeof presence != 'number') {
            return;
        }
        if(presence < PersonData.PRESENCE_STATUS_OFFLINE || presence > PersonData.PRESENCE_STATUS_DO_NOT_DISTURB) {
            return;
        }
        this._presence = presence;
    };
    _proto.getMyMemo = function() {
        return this._myMemo;
    };
    _proto.setMyMemo = function(myMemo) {
        if(myMemo == null || typeof myMemo != 'string') {
            return;
        }
        this._myMemo = myMemo;
    };
    _proto.getAvatarType = function() {
        return this._avatarType;
    };
    _proto.setAvatarType = function(avatarType) {
        if(avatarType == null || typeof avatarType != 'string') {
            return;
        }
        this._avatarType = avatarType;
    };
    _proto.getAvatarData = function() {
        return this._avatarData;
    };
    _proto.setAvatarData = function(avatarData) {
        if(avatarData == null || typeof avatarData != 'string') {
            return;
        }
        this._avatarData = avatarData;
    };
    _proto.getMail = function() {
        return this._mail;
    };
    _proto.setMail = function(mail) {
        if(mail == null || typeof mail != 'string') {
            return;
        }
        this._mail = mail;
    };
    _proto.getNickName = function() {
        return this._nickName;
    };
    _proto.setNickName = function(nickName) {
        if(nickName == null || typeof nickName != 'string') {
            return;
        }
        this._nickName = nickName;
    };
    _proto.cleanUp = function() {
        var _self = this;
        _self._group = null;
        _self._userName = null;
        _self._jid = null;
        _self._presence = PersonData.PRESENCE_STATUS_OFFLINE;
        _self._myMemo = null;
        _self._avatarType = null;
        _self._avatarData = null;
        _self._mail = null;
        _self._nickName = null;
    };

    function convertPresenceNumToStr(presenceNum) {
        var _presenceStr = '';
        if(presenceNum == null || typeof presenceNum != 'number') {
            return _presenceStr;
        }
        switch(presenceNum) {
            case PersonData.PRESENCE_STATUS_ONLINE:
                _presenceStr = 'chat';
                break;
            case PersonData.PRESENCE_STATUS_AWAY:
                _presenceStr = 'away';
                break;
            case PersonData.PRESENCE_STATUS_EXT_AWAY:
                _presenceStr = 'xa';
                break;
            case PersonData.PRESENCE_STATUS_DO_NOT_DISTURB:
                _presenceStr = 'dnd';
                break;
            default:
                break;
        }
        return _presenceStr;
    };

    function convertPresenceStrToNum(presenceStr) {
        var _presenceNum = PersonData.PRESENCE_STATUS_OFFLINE;
        if(presenceStr == null || typeof presenceStr != 'string') {
            return _presenceNum;
        }
        switch(presenceStr) {
            case 'chat':
                _presenceNum = PersonData.PRESENCE_STATUS_ONLINE;
                break;
            case 'away':
                _presenceNum = PersonData.PRESENCE_STATUS_AWAY;
                break;
            case 'xa':
                _presenceNum = PersonData.PRESENCE_STATUS_EXT_AWAY;
                break;
            case 'dnd':
                _presenceNum = PersonData.PRESENCE_STATUS_DO_NOT_DISTURB;
                break;
            default:
                break;
        }
        return _presenceNum;
    };

    exports.create = PersonData.create;
    exports.convertPresenceNumToStr = convertPresenceNumToStr;
    exports.convertPresenceStrToNum = convertPresenceStrToNum;
    exports.AUTHORITY_TYPE_UNKNOWN = PersonData.AUTHORITY_TYPE_UNKNOWN;
    exports.AUTHORITY_TYPE_ADMIN = PersonData.AUTHORITY_TYPE_ADMIN;
})();
