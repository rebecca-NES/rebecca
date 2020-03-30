(function() {
    var Utils = require('../utils')

    /**
     * @class 人データ
     */
    function PersonData(personDataContent) {
        var _self = this;
        // グループ名[配列]
        _self._group = null;
        // ユーザ名
        _self._userName = null;
        // JID(hoge@fuga.com)形式
        _self._jid = null;
        //　プレゼンス(0:オフライン、1:オンライン(=チャット可能)、2:離席中、3:長期不在、4:取り込み中)
        _self._presence = PersonData.PRESENCE_STATUS_OFFLINE;
        // マイメモ
        _self._myMemo = null;
        // アバター
        _self._avatarType = null;
        _self._avatarData = null;
        // メール
        _self._mail = null;
        // ニックネーム
        _self._nickName = null;
        //TODO:subscriptionはPersonDataに入れるか要検討
        //subscription
        //_self._subscription = PersonData.SUBSCRIPTION_STATUS_UNKNOWN;
        
        if(personDataContent){
            _self.setGroup(Utils.getChildObject(personDataContent, 'groupItems'));
            //useeName
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
            //_self.setSubscription(Utils.getChildObject(personDataContent, 'subscription'));
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

    // 定数定義
    // プレゼンス(0:オフライン、1:チャット可能(=オンライン)、2:離席中、3:長期不在、4:取り込み中)
    PersonData.PRESENCE_STATUS_OFFLINE = 0;
    PersonData.PRESENCE_STATUS_ONLINE = 1;
    PersonData.PRESENCE_STATUS_AWAY = 2;
    PersonData.PRESENCE_STATUS_EXT_AWAY = 3;
    PersonData.PRESENCE_STATUS_DO_NOT_DISTURB = 4;

    // Subscription
    PersonData.SUBSCRIPTION_STATUS_UNKNOWN = 'unknown';
    PersonData.SUBSCRIPTION_STATUS_BOTH = 'both';
    PersonData.SUBSCRIPTION_STATUS_TO = 'to';
    PersonData.SUBSCRIPTION_STATUS_FROM ='from';
    PersonData.SUBSCRIPTION_STATUS_NONE = 'none';
    
    // Authority
    PersonData.AUTHORITY_TYPE_UNKNOWN = 'unknown';
    PersonData.AUTHORITY_TYPE_ADMIN = 'admin';

    var _proto = PersonData.prototype;

    // グループ名
    _proto.getGroup = function() {
        return this._group;
    };
    _proto.setGroup = function(group) {
        if(group == null || typeof group != 'object') {
            return;
        }
        this._group = group;
    };
    // ユーザ名
    _proto.getUserName = function() {
        return this._userName;
    };
    _proto.setUserName = function(userName) {
        if(userName == null || typeof userName != 'string') {
            return;
        }
        this._userName = userName;
    };
    // JID
    _proto.getJid = function() {
        return this._jid;
    };
    _proto.setJid = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return;
        }
        this._jid = jid;
    };
    // プレゼンス
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
    // マイメモ
    _proto.getMyMemo = function() {
        return this._myMemo;
    };
    _proto.setMyMemo = function(myMemo) {
        if(myMemo == null || typeof myMemo != 'string') {
            return;
        }
        this._myMemo = myMemo;
    };
    // アバター
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
    // メール
    _proto.getMail = function() {
        return this._mail;
    };
    _proto.setMail = function(mail) {
        if(mail == null || typeof mail != 'string') {
            return;
        }
        this._mail = mail;
    };
    // ニックネーム
    _proto.getNickName = function() {
        return this._nickName;
    };
    _proto.setNickName = function(nickName) {
        if(nickName == null || typeof nickName != 'string') {
            return;
        }
        this._nickName = nickName;
    };
/*
    // subscription
    _proto.getSubscription = function() {
        return this._subscription;
    };
    _proto.setSubscription = function(subscription) {
        if(subscription == null || typeof subscription != 'string') {
            return;
        }
        this._subscription = subscription;
    };
*/
    _proto.cleanUp = function() {
        var _self = this;
        // グループ名[配列]
        _self._group = null;
        // ユーザ名
        _self._userName = null;
        // JID(hoge@fuga.com)形式
        _self._jid = null;
        //　プレゼンス(0:オフライン、1:オンライン(=チャット可能)、2:離席中、3:長期不在、4:取り込み中)
        _self._presence = PersonData.PRESENCE_STATUS_OFFLINE;
        // マイメモ
        _self._myMemo = null;
        // アバター
        _self._avatarType = null;
        _self._avatarData = null;
       // メール
        _self._mail = null;
       // ニックネーム
        _self._nickName = null;
    };
    
    /**
     * プレゼンスのデータ変換(数値→XMPPで使用する文字列)
     * @param {number} presenceNum 1:チャット可能(=オンライン)、2:離席中、3:長期不在、4:取り込み中
     * @return {string} オンライン:'chat'、離席中:'away'、長期不在:'xa'、取り込み中:'dnd'、それ以外：空文字
     */
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
    
    /**
     * プレゼンスのデータ変換(文字列→数値)
     * @param {String} presenceStr オンライン:'chat'、離席中:'away'、長期不在:'xa'、取り込み中:'dnd'
     * @returns {number} プレゼンス定数 1:チャット可能(=オンライン)、2:離席中、3:長期不在、4:取り込み中、0:それ以外
     */
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
