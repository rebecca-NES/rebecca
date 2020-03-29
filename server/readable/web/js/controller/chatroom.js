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
function ChatRoomManager() {
    this._chatroomInfoList = new ChatRoomInfoList();
    this._getRoomInfoRequestList = {}; 
    this._creatingRoomIdList = new StringMapedArrayList();
};(function() {
    var _proto = ChatRoomManager.prototype;
    _proto.getRoomInfo = function(roomId, onGetGroupInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetGroupInfoCallback != null && typeof onGetGroupInfoCallback != 'function') {
            return false;
        }

        if (_self._getRoomInfoRequestList[roomId]) {
            _self._getRoomInfoRequestList[roomId].push(onGetGroupInfoCallback);
            return true;
        }
        _self._getRoomInfoRequestList[roomId] = [];
        _self._getRoomInfoRequestList[roomId].push(onGetGroupInfoCallback);

        function callBackFunc(roomInfo) {
            if (roomInfo) {
                var _roomId = roomInfo.getRoomId();
                var _count = _self._chatroomInfoList.getCount();
                var _exist = false;
                for(var i=0; i<_count; i++){
                    if(_roomId == _self._chatroomInfoList.get(i).getRoomId()){
                        _exist = true;
                        break;
                    }
                }
                if(!_exist){
                    _self._chatroomInfoList.add(roomInfo);
                }
            }
            if(roomInfo && _self._chatroomInfoList.getByKey(roomInfo.getRoomId())){
                var _masterRoomInfo = _self._chatroomInfoList.getByKey(roomInfo.getRoomId());
                var _profileMap = roomInfo.getProfileMap();
                if(_profileMap){
                    var _count = _profileMap.getCount();
                    for(var i=0; i<_count; i++){
                        var _jid = roomInfo.getMemberList().get(i);
                        var _profile = _profileMap.getByKey(_jid);
                        if(!_profile){
                            continue;
                        }
                        _masterRoomInfo.getProfileMap().add(_jid, _profile);
                    }
                }
            }

            if (_self._getRoomInfoRequestList[roomId]) {
                setTimeout(function() {
                    _allCallback();
                }, 1);
                function _allCallback() {
                    var _length = _self._getRoomInfoRequestList[roomId].length;
                    for (var _i = 0; _i < _length; _i++) {
                        if (_self._getRoomInfoRequestList[roomId][_i]) {
                            _self._getRoomInfoRequestList[roomId][_i](roomInfo);
                        }
                    }
                    delete _self._getRoomInfoRequestList[roomId];
                }
            }
        }

        var _ret = CubeeServerConnector.getInstance().getRoomInfo(roomId, callBackFunc);
        if (!_ret) {
            delete _self._getRoomInfoRequestList[roomId];
        }
        return _ret;
    };
    _proto.getRoomInfoList = function(startId, count, communityList, sortCondition, onGetGroupInfoListCallback) {
        var _self = this;
        if (startId == null || typeof startId != 'number' || startId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (communityList == null || typeof communityList != 'object') {
            return false;
        }
        if (sortCondition == null || typeof sortCondition != 'object') {
            return false;
        }
        if (onGetGroupInfoListCallback == null || typeof onGetGroupInfoListCallback != 'function') {
            return false;
        }
        function callBackFunc(chatroomList) {
            var _count = chatroomList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                _self._chatroomInfoList.add(chatroomList.get(_i));
            }
            onGetGroupInfoListCallback(chatroomList);
        };
        return CubeeServerConnector.getInstance().getRoomInfoList(startId, count, communityList, sortCondition, callBackFunc);

    };

    _proto.getPublicGroupRoomInfoList = function(startId, count, sortCondition, onGetGroupInfoListCallback) {
        var _self = this;
        if (startId == null || typeof startId != 'number' || startId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (sortCondition == null || typeof sortCondition != 'object') {
            return false;
        }
        if (onGetGroupInfoListCallback == null || typeof onGetGroupInfoListCallback != 'function') {
            return false;
        }
        function callBackFunc(chatroomList) {
            onGetGroupInfoListCallback(chatroomList);
        };
        return CubeeServerConnector.getInstance().getPublicGroupRoomInfoList(startId, count, sortCondition, callBackFunc);

    };
    _proto.getChatRoomInfoList = function() {
        var _self = this;
        return _self._chatroomInfoList;
    };
    _proto.getChatRoomInfoByRoomId = function(roomId) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return null;
        }
        return _self._chatroomInfoList.getByRoomId(roomId);
    };
    _proto._addChatRoomInfo = function(chatroomInfo) {
        var _self = this;
        if (chatroomInfo == null || typeof chatroomInfo != 'object') {
            return;
        }
        _self._chatroomInfoList.add(chatroomInfo);
    };
    _proto.addMember = function(chatroomInfo) {
        var _self = this;
        if (chatroomInfo == null || typeof chatroomInfo != 'object') {
            return;
        }
        var _roomId = chatroomInfo.getRoomId();
        var _existRoomInfo = _self.getChatRoomInfoByRoomId(_roomId);
        if(_existRoomInfo != null){
            var _recievedMemberList = chatroomInfo.getMemberList();
            var _count = _recievedMemberList.getCount();
            for(var _i = 0; _i < _count; _i++){
                var _addMemberJid = _recievedMemberList.get(_i);
                _existRoomInfo.getMemberList().add(_addMemberJid);
            }
            var _profileMap = chatroomInfo.getProfileMap()._map;
            for(var _jid in _profileMap){
                var _profile = chatroomInfo.getProfileMap().getByKey(_jid);
                _existRoomInfo.getProfileMap().add(_jid, _profile);
            }
            return;
        }
        _self.getRoomInfo(_roomId, _onCallBack);

        function _onCallBack(roomInfo){
        }
    };
    _proto._updateRoomInfo = function(chatroomInfo) {
        var _self = this;
        if (chatroomInfo == null || typeof chatroomInfo != 'object') {
            return;
        }
        _self._addChatRoomInfo(chatroomInfo);
    };
    _proto.removeMember = function(chatRoomInfo, removedMemberList) {
        var _self = this;
        if (chatRoomInfo === null || typeof chatRoomInfo != 'object') {
            return;
        }
        if (removedMemberList === null || typeof removedMemberList != 'object') {
            return;
        }
        var _roomId = chatRoomInfo.getRoomId();
        var _existRoomInfo = _self.getChatRoomInfoByRoomId(_roomId);
        if(_existRoomInfo !== null){
            var _count = removedMemberList.getCount();
            for(var _i = 0; _i < _count; _i++){
                var _memberJid = removedMemberList.get(_i);
                _existRoomInfo.removeMemberList(_memberJid);
            }
            return;
        }
        _self.getRoomInfo(_roomId, _onCallBack);

        function _onCallBack(roomInfo){
        }
    };
    _proto.onNotificationReceived = function(notification) {
        var _self = this;
        if (notification == null || typeof notification != 'object') {
            return;
        }
        if (notification.getType == null) {
            return;
        }
        var _type = notification.getType();
        if (_type != Notification_model.TYPE_GROUP_CHAT) {
            return;
        }
        var _subType = notification.getSubType();
        var _roomInfo =  new ChatRoomInformation();
        switch(_subType) {
            case GroupChatNotification.SUB_TYPE_CREATE_ROOM:
                var _createChatroomNotification = notification;
                _roomInfo = _createChatroomNotification.getRoomInfo();
                var _retryCnt = 30;
                function _wait_for_created() {
                    var result = _self.hasCreatingRoomIdList(_roomInfo.getRoomId());
                    if ( result != null || _retryCnt == 0) {
                        if ( result != null && result[_roomInfo.getRoomId()] ){
                            _self._addChatRoomInfo(_roomInfo);
                        }
                        if (result != null){
                            _self.addCreatingRoomIdList(_roomInfo.getRoomId()+'notification1', {[_roomInfo.getRoomId()]:true});
                        }
                    } else {
                        --_retryCnt;
                        setTimeout(_wait_for_created, 1000);
                    }
                };
                setTimeout(_wait_for_created, 1000);
                break;
            case GroupChatNotification.SUB_TYPE_ADD_MEMBER:
                var _addMemberNotification = notification;
                _roomInfo = _addMemberNotification.getRoomInfo();
                _self.addMember(_roomInfo);
                break;
            case GroupChatNotification.SUB_TYPE_REMOVE_MEMBER:
                var _roomInfo = notification.getRoomInfo();
                var _removedMemberList = notification.getRemovedMemberList();
                _self.removeMember(_roomInfo, _removedMemberList);
                break;
            case GroupChatNotification.SUB_TYPE_UPDATE_ROOM_INFO:
                var _items = notification.getUpdatedItems();
                for (var _i = 0; _i < _items.length; _i++) {
                    switch(_items[_i]) {
                        case GroupChatInfoUpdateNotification.SUB_TYPE_CHANGE_ROOM_NAME:
                            var _updateChatroomInfoNotification = notification;
                            _roomInfo = _updateChatroomInfoNotification.getRoomInfo();
                            _roomInfo.setPreRoomName(_updateChatroomInfoNotification.getPreviousRoomName());
                            _self._updateRoomInfo(_roomInfo);
                            break;
                        case GroupChatInfoUpdateNotification.SUB_TYPE_CHANGE_ROOM_PRIVACY_TYPE:
                            var _updateChatroomInfoNotification = notification;
                            _roomInfo = _updateChatroomInfoNotification.getRoomInfo();
                            _self._updateRoomInfo(_roomInfo);
                            break;
                        default:
                            break;
                    }
                }
            default:
                break;
        }
    };
    _proto.removeChatRoomMember = function(roomId, memberList, removeType, onRemoveChatRoomMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (removeType == null || typeof removeType != 'string' || (removeType != 'own' && removeType != 'member')) {
            return false;
        }
        if (onRemoveChatRoomMemberCallback == null || typeof onRemoveChatRoomMemberCallback != 'function') {
            return false;
        }
        function _callback(removedMemberList) {
            onRemoveChatRoomMemberCallback(removedMemberList);
        }
        return CubeeServerConnector.getInstance().removeChatRoomMember(roomId, memberList, removeType, _callback);
    };


    _proto.removePublicChatRoomMember = function(roomId, onRemoveChatRoomMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onRemoveChatRoomMemberCallback == null || typeof onRemoveChatRoomMemberCallback != 'function') {
            return false;
        }
        function _callback(removedMemberList) {
            onRemoveChatRoomMemberCallback(removedMemberList);
        }
        return CubeeServerConnector.getInstance().removePublicChatRoomMember(roomId, _callback);
    };

    _proto.addCreatingRoomIdList = function(key, object) {
        this._creatingRoomIdList.add(key, object);
    }

    _proto.hasCreatingRoomIdList = function(key) {
        return this._creatingRoomIdList.getByKey(key);
    }
    _proto.delCreatingRoomIdList = function(key) {
        return this._creatingRoomIdList.removeByKey(key);
    }

    _proto.disconnected = function() {
    };
})();
