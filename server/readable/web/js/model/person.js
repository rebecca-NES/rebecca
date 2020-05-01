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
function Profile() {
    this._nickName = null;
    this._mailAddress = null;
    this._group = null;
    this._avatarType = null;
    this._avatarData = null;
    this._loginAccount = null;
    this._status = Profile.STATUS_UNKNOWN;

};(function() {
    Profile.STATUS_UNKNOWN = -1;
    Profile.STATUS_ACTIVE = 0;
    Profile.STATUS_DELETE = 1;
    Profile.STATUS_SUSPEND = 2;

    var _proto = Profile.prototype;
    _proto.getNickName = function() {
        return this._nickName;
    };
    _proto.setNickName = function(nickName) {
        if(nickName == null || typeof nickName != 'string') {
            return;
        }
        this._nickName = nickName;
    };
    _proto.getMailAddress = function() {
        return this._mailAddress;
    };
    _proto.setMailAddress = function(mailAddress) {
        if(mailAddress == null || typeof mailAddress != 'string') {
            return;
        }
        this._mailAddress = mailAddress;
    };
    _proto.getGroup = function() {
        return this._group;
    };
    _proto.setGroup = function(group) {
        if(!Array.isArray(group)) {
            return;
        }
        this._group = group;
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
    _proto.getLoginAccount = function() {
        return this._loginAccount;
    };
    _proto.setLoginAccount = function(loginAccount) {
        if(loginAccount == null || typeof loginAccount != 'string') {
            return;
        }
        this._loginAccount = loginAccount;
    };
    _proto.getStatus = function() {
        return this._status;
    };
    _proto.setStatus = function(status) {
        if(status == null || typeof status != 'number') {
            return;
        }
        this._status = status;
    };

})();

function Person() {
    this._group = null;
    this._profile = null;
    this._jid = null;
    this._presence = Person.PRESENCE_STATUS_OFFLINE;
    this._myMemo = null;
    this._id = -1;
};(function() {
    Person.PRESENCE_STATUS_OFFLINE = 0;
    Person.PRESENCE_STATUS_ONLINE = 1;
    Person.PRESENCE_STATUS_AWAY = 2;
    Person.PRESENCE_STATUS_EXT_AWAY = 3;
    Person.PRESENCE_STATUS_DO_NOT_DISTURB = 4;

    Person.PROFILE_STATUS_ACTIVE = Profile.STATUS_ACTIVE;
    Person.PROFILE_STATUS_DELETE = Profile.STATUS_DELETE;
    Person.PROFILE_STATUS_SUSPEND = Profile.STATUS_SUSPEND;

    var _proto = Person.prototype;
    _proto.getGroup = function() {
        return this._group;
    };
    _proto.setGroup = function(group) {
        if(group == null || typeof group != 'object') {
            return;
        }
        this._group = group;
    };
    _proto.getLoginAccount = function() {
        if(this._profile == null) {
            return null;
        }
        return this._profile.getLoginAccount();
    };
    _proto.setLoginAccount = function(loginAccount) {
        if(loginAccount == null || typeof loginAccount != 'string') {
            return;
        }
        if(this._profile == null) {
            this._profile = new Profile();
        }
        this._profile.setLoginAccount(loginAccount);
    };
    _proto.getUserName = function() {
        if(this._profile == null) {
            return null;
        }
        return this._profile.getNickName();
    };
    _proto.setUserName = function(userName) {
        if(userName == null || typeof userName != 'string') {
            return;
        }
        if(this._profile == null) {
            this._profile = new Profile();
        }
        this._profile.setNickName(userName);
    };
    _proto.getMailAddress = function() {
        if(this._profile == null) {
            return null;
        }
        return this._profile.getMailAddress();
    };
    _proto.setMailAddress = function(mailAddress) {
        if(mailAddress == null || typeof mailAddress != 'string') {
            return;
        }
        if(this._profile == null) {
            this._profile = new Profile();
        }
        this._profile.setMailAddress(mailAddress);
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
        if(presence < Person.PRESENCE_STATUS_OFFLINE || presence > Person.PRESENCE_STATUS_DO_NOT_DISTURB) {
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
        if(this._profile == null) {
            return null;
        }
        return this._profile.getAvatarType();
    };
    _proto.setAvatarType = function(avatarType) {
        if(avatarType == null || typeof avatarType != 'string') {
            return;
        }
        if(this._profile == null) {
            this._profile = new Profile();
        }
        this._profile.setAvatarType(avatarType);
    };
    _proto.getAvatarData = function() {
        if(this._profile == null) {
            return null;
        }
        return this._profile.getAvatarData();
    };
    _proto.setAvatarData = function(avatarData) {
        if(avatarData == null || typeof avatarData != 'string') {
            return;
        }
        if(this._profile == null) {
            this._profile = new Profile();
        }
        this._profile.setAvatarData(avatarData);
    };
    _proto.getLoginAccount = function() {
        if(this._profile == null) {
            return null;
        }
        return this._profile.getLoginAccount();
    };
    _proto.setLoginAccount = function(loginAccount) {
        if(loginAccount == null || typeof loginAccount != 'string') {
            return;
        }
        if(this._profile == null) {
            this._profile = new Profile();
        }
        this._profile.setLoginAccount(loginAccount);
    };
    _proto.getStatus = function() {
        if(this._profile == null) {
            return Profile.STATUS_UNKNOWN;
        }
        return this._profile.getStatus();
    };
    _proto.setStatus = function(status) {
        if(status == null || typeof status != 'number') {
            return;
        }
        if(this._profile == null) {
            this._profile = new Profile();
        }
        this._profile.setStatus(status);
    };
    _proto.cleanUp = function() {
        var _self = this;
        _self._group = null;
        _self._profile = null;
        _self._jid = null;
        _self._presence = Person.PRESENCE_STATUS_OFFLINE;
        _self._myMemo = null;
        _self._id = -1;
    };
    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if(id == null || typeof id != 'number') {
            return;
        }
        this._id = id;
    };
})();
function LoginUser() {
    Person.call(this);
    this._settings = null;
    this._tenantInfo = null;
    this._extras = null;
    this._firstLogin = false;
    this._followee = [];
    this._follower = [];
};

(function() {

    var Super = function Super() {
    };
    Super.prototype = Person.prototype;
    LoginUser.prototype = new Super();
    var _super = Super.prototype;

    var _loginUser = new LoginUser();
    LoginUser.getInstance = function() {
        return _loginUser;
    };
    var _proto = LoginUser.prototype;

    _proto.setSettings = function(userSettings) {
        this._settings = userSettings;
    };
    _proto.getSettings = function() {
        return this._settings;
    };
    _proto.setTenantInfo = function(tenantInfo) {
        this._tenantInfo = tenantInfo ? JSON.parse(JSON.stringify(tenantInfo)) : this._tenantInfo;
    };
    _proto.getTenantInfo = function() {
        return this._tenantInfo;
    };
    _proto.setExtras = function(extras) {
        this._extras = extras ? JSON.parse(JSON.stringify(extras)) : this._extras;
    }
    _proto.getExtras = function() {
        return this._extras;
    }
    _proto.isUpdatablePersonData = function() {
        var tenantInfo = this._tenantInfo;
        if ('ldap' in tenantInfo && tenantInfo.ldap != null
            && 'ldapEnable' in tenantInfo.ldap && tenantInfo.ldap.ldapEnable != null
            && 'ldapUpdatable' in tenantInfo.ldap && tenantInfo.ldap.ldapUpdatable != null
            && tenantInfo.ldap.ldapEnable == true
            && tenantInfo.ldap.ldapUpdatable == false
        ) {
            return false;
        }
        return true;
    }
    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp.call(_self);
        _self._settings = null;
        _self._tenantInfo = null;
        _self._followee = [];
        _self._follower = [];
    };
    _proto.isFirstLogin = function(){
        return this._firstLogin;
    }
    _proto.setFirstLogin = function(){
        this._firstLogin = true;
    }
    _proto.getFolloweeList = function(){
        return this._followee;
    }
    _proto.setFolloweeList = function(followee){
        var _self = this;
        if(!typeof followee == 'object'){
            throw new Error('setFolloweeList followee is not array');
        }
        _self._followee = followee;
    }
    _proto.getFollowerList = function(){
        return this._follower;
    }
    _proto.setFollowerList = function(follower){
        var _self = this;
        if(!typeof follower == 'object'){
            throw new Error('setFollowerList follower is not array');
        }
        _self._follower = follower;
    }
})();
function UserSettings() {
    this._mailCooperationInfoList = new MailCooperationInfoList();

};(function() {
    var _proto = UserSettings.prototype;

    _proto.getMailCooperationList = function() {
        return this._mailCooperationInfoList;
    }
    _proto.setMailCooperationList = function(mailCooperationInfoList) {
        if(mailCooperationInfoList == null || typeof mailCooperationInfoList != 'object') {
            return;
        }
        this._mailCooperationInfoList = mailCooperationInfoList;
    };

})();
function ProfileChangeNotice() {
    this._type = 0;
    this._jid = '';
};(function() {
    ProfileChangeNotice.TYPE_PRESENCE = 1;
    ProfileChangeNotice.TYPE_PROFILE = 2;
    var _proto = ProfileChangeNotice.prototype;
    _proto.getType = function() {
        return this._type;
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
})();
function PresenceChangeNotice() {
    ProfileChangeNotice.call(this);
    this._type = ProfileChangeNotice.TYPE_PRESENCE;
    this._presence = Person.PRESENCE_STATUS_OFFLINE;
    this._myMemo = '';
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ProfileChangeNotice.prototype;
    PresenceChangeNotice.prototype = new Super();
    var _super = Super.prototype;
    var _proto = PresenceChangeNotice.prototype;
    _proto.getPresence = function() {
        return this._presence;
    };
    _proto.setPresence = function(presence) {
        if(presence == null || typeof presence != 'number') {
            return;
        }
        if(presence < Person.PRESENCE_STATUS_OFFLINE || presence > Person.PRESENCE_STATUS_DO_NOT_DISTURB) {
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
})();

function ProfileChangeData() {
    ProfileChangeNotice.call(this);
    this._type = ProfileChangeNotice.TYPE_PROFILE;
    this._profile = null;
    this._updateTime = '';
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ProfileChangeNotice.prototype;
    ProfileChangeData.prototype = new Super();
    var _super = Super.prototype;
    var _proto = ProfileChangeData.prototype;
    _proto.getProfile = function() {
        return this._profile;
    };
    _proto.setProfile = function(profile) {
        if(profile == null || typeof profile != 'object') {
            return;
        }
        this._profile = profile;
    };
    _proto.getUpdateTime = function() {
        return this._updateTime;
    };
    _proto.setUpdateTime = function(updateTime) {
        if(updateTime == null || typeof updateTime != 'string') {
            return;
        }
        this._updateTime = updateTime;
    };
})();

function AddContactListMember() {
    this._person = null;
    this._contactListGroup = null;
    this._position = 0;
};(function() {
    var _proto = AddContactListMember.prototype;
    _proto.getPerson = function() {
        return this._person;
    };
    _proto.setPerson = function(person) {
        if(person == null || typeof person != 'object') {
            return;
        }
        this._person = person;
    };
    _proto.getContactListGroup = function() {
        return this._contactListGroup;
    };
    _proto.setContactListGroup = function(contactListGroup) {
        if(contactListGroup == null || typeof contactListGroup != 'object') {
            return;
        }
        this._contactListGroup = contactListGroup;
    };
    _proto.getPosition = function() {
        return this._position;
    };
    _proto.setPosition = function(position) {
        if(position == null || typeof position != 'object') {
            return;
        }
        this._position = position;
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();

function LoginPresence() {
    this._loginPresence    = Person.PRESENCE_STATUS_OFFLINE;
    this._loginPresenceStr = '';
};
(function() {
    LoginPresence.prototype = new LoginPresence();

    var _loginPresence = new LoginPresence();
    LoginPresence.getInstance = function() {
        return _loginPresence;
    };
    var _proto = LoginPresence.prototype;

    _proto.setLoginPresence = function(loginPresence) {
        if (loginPresence == null || typeof loginPresence != 'number') {
            return;
        }
        this._loginPresence    = loginPresence;
        this._loginPresenceStr = Utils.convertPresenceNumToStr(loginPresence);
    };
    _proto.getLoginPresence = function() {
        return this._loginPresence;
    };
    _proto.getLoginPresenceToStr = function() {
        return this._loginPresenceStr;
    };
    _proto.isLogin = function () {
        return (this._loginPresence === Person.PRESENCE_STATUS_OFFLINE);
    }
})();
function LoginMyMemo() {
    this._loginMyMemo = null;
};
(function() {
    LoginMyMemo.prototype = new LoginMyMemo();

    var _loginMyMemo = new LoginMyMemo();
    LoginMyMemo.getInstance = function() {
        return _loginMyMemo;
    };
    var _proto = LoginMyMemo.prototype;

    _proto.setLoginMyMemo = function(loginMyMemo) {
        if (loginMyMemo == null || typeof loginMyMemo != 'string') {
            return;
        }
        this._loginMyMemo = loginMyMemo;
    };
    _proto.getLoginMyMemo = function() {
        return this._loginMyMemo;
    };
})();
