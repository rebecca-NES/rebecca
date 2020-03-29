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
function ChatRoomInformation() {
    this._id = -1;
    this._roomName = '';
    this._roomId = '';
    this._parentRoomId = '';
    this._memberList = new ArrayList();
    this._memberListWithData = {};
    this._createdAt = null;
    this._createdBy = '';
    this._updatedAt = null;
    this._updatedBy = '';
    this._owner = '';
    this._preRoomName = '';
    this._profileMap = new StringMapedArrayList();
    this._privacyType = ChatRoomInformation.PRIVACY_TYPE_ITEM_OPEN;
};(function() {
    ChatRoomInformation.PRIVACY_TYPE_ITEM_OPEN = 0;
    ChatRoomInformation.PRIVACY_TYPE_ITEM_CLOSED = 1;
    ChatRoomInformation.PRIVACY_TYPE_ITEM_SECRET = 2;
    var _proto = ChatRoomInformation.prototype;
    _proto.getRoomName = function() {
        return this._roomName;
    };
    _proto.setRoomName = function(roomName) {
        if(roomName == null || typeof roomName != 'string') {
            return;
        }
        this._roomName = roomName;
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
    _proto.getParentRoomId = function() {
        return this._parentRoomId;
    };
    _proto.setParentRoomId = function(parentRoomId) {
        if(parentRoomId == null || typeof parentRoomId != 'string') {
            return;
        }
        this._parentRoomId = parentRoomId;
    };
    _proto.getMemberList = function() {
        return this._memberList;
    };
    _proto.getMemberListWithData = function() {
        return this._memberListWithData;
    };
    _proto.getMembersAction = function(memberJid) {
        if ('action' in this._memberListWithData[memberJid]) {
            return this._memberListWithData[memberJid].action;
        }
        return null;
    }
    _proto.getMembersAccountName = function(memberJid) {
        if ('accountName' in this._memberListWithData[memberJid]) {
            return this._memberListWithData[memberJid].accountName;
        }
        return null;
    }
    _proto.removeMemberList = function(memberJid) {
        if(memberJid == null || typeof memberJid != 'string') {
            return;
        }
        var _idx = -1;
        var _memberList = this._memberList;
        var _count = _memberList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            if (_memberList.get(_i) == memberJid) {
                _idx = _i;
                break;
            }
        }
        this._memberList.remove(_idx);
        this._memberListWithData[memberJid] = null;
    };
    _proto.addMemberList = function(memberJid, action, accountName) {
        if(memberJid == null || typeof memberJid != 'string') {
            return;
        }
        if(action == undefined || action == null || typeof action != 'string') {
            action = '';
        }
        if(accountName == undefined || accountName == null || typeof accountName != 'string') {
            accountName = '';
        }
        var _idx = -1;
        var _memberList = this._memberList;
        var _count = _memberList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            if (_memberList.get(_i) == memberJid) {
                _idx = _i;
                break;
            }
        }
        if (_idx < 0) {
            this._memberList.add(memberJid);
            this._memberListWithData[memberJid] = {
                action: action,
                accountName: accountName
            };
        }
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
    _proto.getCreatedAt = function() {
        return this._createdAt;
    };
    _proto.setCreatedAt = function(createdAt) {
        if (createdAt == null || typeof createdAt != 'object') {
            return;
        }
        this._createdAt = createdAt;
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
    _proto.getUpdatedAt = function() {
        return this._updatedAt;
    };
    _proto.setUpdatedAt = function(updatedAt) {
        if (updatedAt == null || typeof updatedAt != 'object') {
            return;
        }
        this._updatedAt = updatedAt;
    };
    _proto.getOwner = function() {
        return this._owner;
    };
    _proto.setOwner = function(owner) {
        if(owner == null || typeof owner != 'string') {
            return;
        }
        this._owner = owner;
    };
    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if (id == null || typeof id != 'number') {
            return;
        }
        this._id = id;
    };
    _proto.getPreRoomName = function() {
        return this._preRoomName;
    };
    _proto.setPreRoomName = function(preRoomName) {
        if(preRoomName == null || typeof preRoomName != 'string') {
            return;
        }
        this._preRoomName = preRoomName;
    };
    _proto.getProfileMap = function() {
        return this._profileMap;
    };
    _proto.setProfileMap = function(profileMap) {
        if (profileMap == null || typeof profileMap != 'object') {
            return;
        }
        this._profileMap = profileMap;
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
})();

function ChatRoomInfoList() {
    StringMapedArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = StringMapedArrayList.prototype;
    ChatRoomInfoList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = ChatRoomInfoList.prototype;
    _proto.add = function(roomInfo) {
        var _self = this;
        if (roomInfo == null || typeof roomInfo != 'object') {
            return false;
        }
        if (roomInfo.getRoomId() == null) {
            return false;
        }
        var _roomId = roomInfo.getRoomId();
        var _ret = _super.add.call(_self, _roomId, roomInfo);
        if (_ret == false) {
            _ret = _super.setByKey.call(_self, _roomId, roomInfo);
        }
        return _ret;
    };
    _proto.getByRoomId = function(roomId) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return null;
        }
        if (roomId == '') {
            return null;
        }
        return _super.getByKey.call(_self, roomId);
    };
})();
