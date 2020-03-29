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
function MailCooperationInformation() {
    this._id = -1;
    this._serverId = -1;
    this._serverName = '';
    this._jid = '';
    this._mailAddress = '';
    this._branchNumber = -1;
    this._settingInfo = null;   
    this._cooperationType = 0;  
};(function() {
    MailCooperationInformation.SERVER_TYPE_NON = 0;
    MailCooperationInformation.SERVER_TYPE_SMTP = 1;
    MailCooperationInformation.SERVER_TYPE_POP = 2;
    MailCooperationInformation.SERVER_TYPE_IMAP = 3;
    MailCooperationInformation.SERVER_TYPE_SMTP_POP = 4;
    var _proto = MailCooperationInformation.prototype;

    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if (id == null || typeof id != 'number') {
            return;
        }
        this._id = id;
    };
    _proto.getServerId = function() {
        return this._serverId;
    };
    _proto.setServerId = function(serverId) {
        if (serverId == null || typeof serverId != 'number') {
            return;
        }
        this._serverId = serverId;
    };
    _proto.getServerName = function() {
        return this._serverName;
    };
    _proto.setServerName = function(serverName) {
        if(serverName == null || typeof serverName != 'string') {
            return;
        }
        this._serverName = serverName;
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
    _proto.getMailAddress = function() {
        return this._mailAddress;
    };
    _proto.setMailAddress = function(mailAddress) {
        if(mailAddress == null || typeof mailAddress != 'string') {
            return;
        }
        this._mailAddress = mailAddress;
    };
    _proto.getBranchNumber = function() {
        return this._branchNumber;
    };
    _proto.setBranchNumber = function(branchNumber) {
        if (branchNumber == null || typeof branchNumber != 'number') {
            return;
        }
        this._branchNumber = branchNumber;
    };
    _proto.getCooperationType = function() {
        return this._cooperationType;
    };
    _proto.setCooperationType = function(cooperationType) {
        if (cooperationType == null || typeof cooperationType != 'number') {
            return;
        }
        this._cooperationType = cooperationType;
    };
    _proto.getSettingInfo = function() {
        return this._settingInfo;
    };
    _proto.setSettingInfo = function(settingInfo) {
        if (settingInfo == null || typeof settingInfo != 'object') {
            return;
        }
        this._settingInfo = settingInfo;
    };
})();

function MailCooperationInfoList() {
    ArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    MailCooperationInfoList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MailCooperationInfoList.prototype;
})();

function AccountSettingInfomation() {
    this._account = '';
    this._password = '';
};(function() {
    AccountSettingInfomation.SERVER_TYPE_SMTP = 1;
    AccountSettingInfomation.SERVER_TYPE_POP = 2;
    AccountSettingInfomation.SERVER_TYPE_IMAP = 3;
    AccountSettingInfomation.SERVER_TYPE_SMTP_POP = 4;

    var _proto = AccountSettingInfomation.prototype;
    _proto.getAccount = function() {
        return this._account;
    };
    _proto.setAccount = function(account) {
        if(account == null || typeof account != 'string') {
            return;
        }
        this._account = account;
    };
    _proto.getPassword = function() {
        return this._password;
    };
    _proto.setPassword = function(password) {
        if(password == null || typeof password != 'string') {
            return;
        }
        this._password = password;
    };
})();

function PopSettingInfomation() {
    AccountSettingInfomation.call(this);
    this._type = AccountSettingInfomation.SERVER_TYPE_POP;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = AccountSettingInfomation.prototype;
    PopSettingInfomation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = PopSettingInfomation.prototype;

    _proto.getType = function() {
        return this._type;
    };
})();

