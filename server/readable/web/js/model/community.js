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
function CommunityInfo() {
    this._id = -1;
    this._roomId = '';
    this._roomName = '';
    this._description = '';
    this._privacyType = CommunityInfo.PRIVACY_TYPE_ITEM_OPEN;
    this._memberEntryType = '';
    this._logoUrl = '';
    this._createdAt = null;
    this._createdBy = '';
    this._updatedAt = null;
    this._updatedBy = '';
    this._ownerList = new CommunityMemberList();
    this._generalMemberList = new CommunityMemberList();
    this._memberCount = 0;
};(function() {
    CommunityInfo.PRIVACY_TYPE_ITEM_OPEN = 0;
    CommunityInfo.PRIVACY_TYPE_ITEM_CLOSED = 1;
    CommunityInfo.PRIVACY_TYPE_ITEM_SECRET = 2;

    CommunityInfo.MEMBER_ENTRY_TYPE_ITEM_ADD = 0;
    CommunityInfo.MEMBER_ENTRY_TYPE_ITEM_INVITE = 1;
    CommunityInfo.MEMBER_ENTRY_TYPE_ITEM_INVITE_OR_ACCEPT = 2;
    CommunityInfo.MEMBER_ENTRY_TYPE_ITEM_INVITE_OR_FREE = 3;
    var _proto = CommunityInfo.prototype;
    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if (id == null || typeof id != 'number') {
            return;
        }
        this._id = id;
    };
    _proto.getRoomId = function() {
        return this._roomId;
    };
    _proto.setRoomId = function(roomId) {
        if(roomId == null || typeof roomId != 'string') {
            return;
        }
        this._roomId = roomId;
    };
    _proto.getRoomName = function() {
        return this._roomName;
    };
    _proto.setRoomName = function(roomName) {
        if(roomName == null || typeof roomName != 'string') {
            return;
        }
        this._roomName = roomName;
    };
    _proto.getDescription = function() {
        return this._description;
    };
    _proto.setDescription = function(description) {
        if(description == null || typeof description != 'string') {
            return;
        }
        this._description = description;
    };
    _proto.getPrivacyType = function() {
        return this._privacyType;
    };
    _proto.setPrivacyType = function(privacyType) {
        if(privacyType == null || typeof privacyType != 'number') {
            return;
        }
        this._privacyType = privacyType;
    };
    _proto.getMemberEntryType = function() {
        return this._memberEntryType;
    };
    _proto.setMemberEntryType = function(memberEntryType) {
        if(memberEntryType == null || typeof memberEntryType != 'string') {
            return;
        }
        this._memberEntryType = memberEntryType;
    };
    _proto.getLogoUrl = function() {
        return this._logoUrl;
    };
    _proto.setLogoUrl = function(logoUrl) {
        if(logoUrl == null || typeof logoUrl != 'string') {
            return;
        }
        this._logoUrl = logoUrl;
    };
    _proto.getCreatedAt = function() {
        return this._createdAt;
    };
    _proto.setCreatedAt = function(createdAt) {
        if (createdAt == null || typeof createdAt != 'object') {
            return;
        }
        this._createdAt = createdAt;
    };
    _proto.getCreatedBy = function() {
        return this._createdBy;
    };
    _proto.setCreatedBy = function(createdBy) {
        if(createdBy == null || typeof createdBy != 'string') {
            return;
        }
        this._createdBy = createdBy;
    };
    _proto.getUpdatedAt = function() {
        return this._updatedAt;
    };
    _proto.setUpdatedAt = function(updatedAt) {
        if (updatedAt == null || typeof updatedAt != 'object') {
            return;
        }
        this._updatedAt = updatedAt;
    };
    _proto.getUpdatedBy = function() {
        return this._updatedBy;
    };
    _proto.setUpdatedBy = function(updatedBy) {
        if(updatedBy == null || typeof updatedBy != 'string') {
            return;
        }
        this._updatedBy = updatedBy;
    };
    _proto.getOwnerList = function() {
        return this._ownerList;
    };
    _proto.hasOwner = function(jid) {
        return (_getMember(this._ownerList, jid) != null);
    };
    _proto.getGeneralMemberList = function() {
        return this._generalMemberList;
    };
    _proto.hasGeneralMember = function(jid) {
        return (_getMember(this._generalMemberList, jid) != null);
    };
    _proto.getMemberCount = function() {
        return this._memberCount;
    };
    _proto.setMemberCount = function(memberCount) {
        if(memberCount == null || typeof memberCount != 'number') {
            return;
        }
        this._memberCount = memberCount;
    };
    function _getMember(memberList, jid) {
        if (!jid || typeof jid != 'string') {
            return null;
        }
        var _count = memberList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _member = memberList.get(_i);
            if (_member && _member.getJid() == jid) {
                return _member;
            }
        }
        return null;
    }
})();
function CommunityList() {
    StringMapedArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = StringMapedArrayList.prototype;
    CommunityList.prototype = new Super();
    var _super = Super.prototype;

    var _proto = CommunityList.prototype;
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();
function CommunityMemberList() {
    PersonList.call(this);
};(function() {

    var Super = function Super() {
    };
    Super.prototype = PersonList.prototype;
    CommunityMemberList.prototype = new Super();
    var _super = Super.prototype;

    var _proto = CommunityMemberList.prototype;
})();
function CommunityMember() {
    Person.call(this);
    this._role = CommunityMember.ROLE_TYPE_NOT_JOIN;
};(function() {
    CommunityMember.ROLE_TYPE_NOT_JOIN = 0;
    CommunityMember.ROLE_TYPE_GENERAL = 1;
    CommunityMember.ROLE_TYPE_OWNER = 2;

    var Super = function Super() {
    };
    Super.prototype = Person.prototype;
    CommunityMember.prototype = new Super();
    var _super = Super.prototype;

    var _proto = CommunityMember.prototype;
    _proto.getRole = function() {
        return this._role;
    };
    _proto.setRole = function(role) {
        if(role == null || typeof role != 'number') {
            return;
        }
        if(role < CommunityMember.ROLE_TYPE_NOT_JOIN || role > CommunityMember.ROLE_TYPE_OWNER) {
            return;
        }
        this._role = role;
    };
})();
