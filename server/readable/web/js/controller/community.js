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
function CommunityManager() {
    this._joinedCommunityList = null;
    this._getRoomInfoRequestList = {}; 
    this._creatingRoomIdList = [];
};(function() {
    var _proto = CommunityManager.prototype;
    _proto.onNotificationReceived = function(notification) {
        var _self = this;
        if (notification == null || typeof notification != 'object') {
            return;
        }
        if (notification.getType == null) {
            return;
        }
        var _type = notification.getType();
        if (_type != Notification_model.TYPE_COMMUNITY) {
            return;
        }
        var _subType = notification.getSubType();
        switch(_subType) {
            case CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO:
                var _updatedCommunityInfo = notification.getUpdatedCommunityInfo();
                if(_updatedCommunityInfo == null) {
                    console.log('_updatedCommunityInfo is null');
                }
                if(_self._joinedCommunityList == null) {
                    return;
                }
                var _roomId = _updatedCommunityInfo.getRoomId();
                var _cachedCommunityInfo = _self._joinedCommunityList.getByKey(_roomId);
                if(_cachedCommunityInfo == null) {
                    return;
                }
                var _ownerList = _updatedCommunityInfo.getOwnerList();
                var _cachedOwnerList = _cachedCommunityInfo.getOwnerList();
                var _count = _cachedOwnerList.getCount();
                for (var _i = 0; _i < _count; _i++) {
                    _ownerList.add(_cachedOwnerList.get(_i));
                }
                var _generalMemberList = _updatedCommunityInfo.getGeneralMemberList();
                var _cachedGeneralMemberList = _cachedCommunityInfo.getGeneralMemberList();
                _count = _cachedGeneralMemberList.getCount();
                for (var _i = 0; _i < _count; _i++) {
                    _generalMemberList.add(_cachedGeneralMemberList.get(_i));
                }

                _self._joinedCommunityList.setByKey(_roomId, _updatedCommunityInfo);
                break;
            case CommunityNotification.SUB_TYPE_ADD_MEMBER:
                if(_self._joinedCommunityList == null) {
                    return;
                }
                var _roomId = notification.getRoomId();
                var _cachedCommunityInfo = _self._joinedCommunityList.getByKey(_roomId);
                if(_cachedCommunityInfo == null) {
                    var _onGetCommunityInfoByAddMember = function(gottenCommunityInfo) {
                        if(gottenCommunityInfo != null) {
                            _self._joinedCommunityList.insert(0, gottenCommunityInfo.getRoomId(), gottenCommunityInfo);
                        }
                    };
                    _self.getCommunityInfo(_roomId, _onGetCommunityInfoByAddMember);
                    return;
                }
                var _cachedOwnerList = _cachedCommunityInfo.getOwnerList();
                var _count = _cachedOwnerList.getCount();
                if(_count <= 0) {
                    return;
                }
                var _cachedGeneralMemberList = _cachedCommunityInfo.getGeneralMemberList();
                var _addedMemeberList = notification.getAddedMemberList();
                var _addedCount = _addedMemeberList.getCount();
                for(var _i = 0; _i < _addedCount; _i++) {
                    var _addedMember = _addedMemeberList.get(_i);
                    if(_addedMember == null) {
                        continue;
                    }
                    var _role = _addedMember.getRole();
                    if(_cachedOwnerList.getByKey(_addedMember)){
                        break;
                    }else{
                        switch(_role) {
                            case CommunityMember.ROLE_TYPE_GENERAL:
                                _cachedGeneralMemberList.add(_addedMember);
                                break;
                            case CommunityMember.ROLE_TYPE_OWNER:
                                _cachedOwnerList.add(_addedMember);
                                break;
                            default:
                                break;
                        }
                    }
                }
                break;
            case CommunityNotification.SUB_TYPE_UPDATE_OWNER:
                if(_self._joinedCommunityList == null) {
                    return;
                }
                var _roomId = notification.getRoomId();
                var _cachedCommunityInfo = _self._joinedCommunityList.getByKey(_roomId);
                if(_cachedCommunityInfo == null) {
                    return;
                }
                var _cachedOwnerList = _cachedCommunityInfo.getOwnerList();
                var _count = _cachedOwnerList.getCount();
                if(_count <= 0) {
                    return;
                }
                var _cachedGeneralMemberList = _cachedCommunityInfo.getGeneralMemberList();
                var _changeInfo = _self._getChangeOwners(notification);

                var _addCount = _changeInfo.addOwners.getCount();
                var _removeCount = _changeInfo.removeOwners.getCount();
                var _getPersonDataFromCache = function(key){
                    var _personData = _cachedOwnerList.getByKey(key);
                    return _personData ? _personData : _cachedGeneralMemberList.getByKey(key);
                };

                function getNotExistAddmemberInCacheGeneralMember(){
                    var returnJidArray = new ArrayList;
                    for(var i=0; i<_addCount; i++){
                        var ownerStr = _changeInfo.addOwners.get(i);
                        if(!_cachedGeneralMemberList.getByKey(ownerStr)){
                            returnJidArray.add(ownerStr);
                        }
                    }
                    return returnJidArray;
                }

                function getPersonDataCallback(result){
                    var _cachedCommunity = _self._joinedCommunityList.getByKey(_roomId);
                    var _cachedGeneral = _cachedCommunity.getGeneralMemberList();
                    for(var i=0; i<result.getCount(); i++){
                        var communityMember = new CommunityMember();
                        communityMember.setJid(result.get(i).getJid());
                        communityMember.setUserName(result.get(i).getUserName());
                        communityMember.setLoginAccount(result.get(i).getLoginAccount());
                        _cachedOwnerList.add(communityMember);
                        if(_cachedGeneral.getByKey(result.get(i).getJid())){
                            _cachedGeneral.removeByKey(result.get(i).getJid());
                        }
                    }
                }

                var notExistCacheMemberList = getNotExistAddmemberInCacheGeneralMember();
                if(notExistCacheMemberList.getCount()){
                    CubeeController.getInstance().getPersonDataByJidFromServer(notExistCacheMemberList, getPersonDataCallback);
                }else{
                    for(var j=0; j<_addCount; j++){
                        var _addOwnerStr = _changeInfo.addOwners.get(j);
                        if(!_cachedOwnerList.getByKey(_addOwnerStr)){
                            var _person = _getPersonDataFromCache(_addOwnerStr);
                            if(_person){
                                _cachedOwnerList.add(_person);
                            }
                        }
                        if(_cachedGeneralMemberList.getByKey(_addOwnerStr)){
                           _cachedGeneralMemberList.removeByKey(_addOwnerStr);
                        }
                    }
                }

                for(var j=0; j<_removeCount; j++){
                    var _removeOwnerStr = _changeInfo.removeOwners.get(j);
                    if(!_cachedGeneralMemberList.getByKey(_removeOwnerStr)){
                        var _person = _getPersonDataFromCache(_removeOwnerStr);
                        if(_person){
                            _cachedGeneralMemberList.add(_person);
                        }
                    }
                    if(_cachedOwnerList.getByKey(_removeOwnerStr)){
                       _cachedOwnerList.removeByKey(_removeOwnerStr);
                    }
                }
                break;
            case CommunityNotification.SUB_TYPE_REMOVE_MEMBER:
                if(_self._joinedCommunityList == null) {
                    return;
                }
                var _roomId = notification.getRoomId();
                var _cachedCommunityInfo = _self._joinedCommunityList.getByKey(_roomId);
                if(_cachedCommunityInfo == null) {
                    return;
                }
                var _cachedOwnerList = _cachedCommunityInfo.getOwnerList();
                var _count = _cachedOwnerList.getCount();
                if(_count <= 0) {
                    return;
                }
                var _cachedGeneralMemberList = _cachedCommunityInfo.getGeneralMemberList();
                var _removedMemberList = notification.getRemovedMemberList();
                var _removedCount = _removedMemberList.getCount();
                for(var _i = 0; _i < _removedCount; _i++) {
                    var _removedMemberString = _removedMemberList.get(_i);
                    _cachedOwnerList.removeByKey(_removedMemberString);
                    _cachedGeneralMemberList.removeByKey(_removedMemberString);
                }
                break;
            default:
                break;
        }
    };
    _proto._getChangeOwners = function(notification){
        var _newOwnerList = notification.getOwnerList();
        var _newOwnerCount = _newOwnerList.getCount();
        var _oldOwnerList = notification.getPreOwnerList();
        var _oldOwnerCount = _oldOwnerList.getCount();

        var _tmpNewList = new ArrayList();
        var _tmpOldList = new ArrayList();
        for(var m=0; m<_newOwnerCount; m++){
            _tmpNewList.add(_newOwnerList.get(m));
        }
        for(var n=0; n<_oldOwnerCount; n++){
            _tmpOldList.add(_oldOwnerList.get(n));
        }
        for(var j=_newOwnerCount-1; j>=0; j--){
            var _newOwner = _tmpNewList.get(j);
            var _tmpOldCount = _tmpOldList.getCount();
            for(var k=_tmpOldCount-1; k>=0; k--){
                if(_newOwner == _tmpOldList.get(k)){
                    _tmpNewList.remove(j);
                    _tmpOldList.remove(k);
                    break;
                }
            }
        }
        return {
            addOwners : _tmpNewList,
            removeOwners : _tmpOldList
        };
    };

    _proto.createCommunity = function(communityInfo, onCreateCommunity) {
        var _self = this;
        if (communityInfo == null || typeof communityInfo != 'object') {
            return false;
        }
        if (onCreateCommunity != null && typeof onCreateCommunity != 'function') {
            return false;
        }
        function _callBackFunc(createdCommunityInfo) {
            if(onCreateCommunity != null) {
                onCreateCommunity(createdCommunityInfo);
            }
        };
        return CubeeServerConnector.getInstance().createCommunity(communityInfo, _callBackFunc);
    };
    _proto.getJoinedCommunityInfoList = function(startId, count, sortCondition, onGetCommunityInfoListCallback) {
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
        if (onGetCommunityInfoListCallback != null && typeof onGetCommunityInfoListCallback != 'function') {
            return false;
        }
        function callBackFunc(communityInfoList) {
            if(communityInfoList != null) {
                if(_self._joinedCommunityList == null) {
                    _self._joinedCommunityList = communityInfoList;
                } else {
                    var _gottenCount = communityInfoList.getCount();
                    for(var _i = 0; _i < _gottenCount; _i++) {
                        var _gottenCommunityInfo = communityInfoList.get(_i);
                        if(_self._joinedCommunityList.getByKey(_gottenCommunityInfo.getRoomId()) == null) {
                            _self._joinedCommunityList.add(_gottenCommunityInfo.getRoomId(), _gottenCommunityInfo);
                        }
                    }
                }
            }
            if(onGetCommunityInfoListCallback != null) {
                onGetCommunityInfoListCallback(communityInfoList);
            }
        };
        return CubeeServerConnector.getInstance().getJoinedCommunityInfoList(startId, count, sortCondition, callBackFunc);
    };
    _proto.getNoJoinedPublicCommunityInfoList = function(startId, count, sortCondition, onGetCommunityInfoListCallback) {
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
        if (onGetCommunityInfoListCallback != null && typeof onGetCommunityInfoListCallback != 'function') {
            return false;
        }
        function callBackFunc(communityInfoList) {
            if(onGetCommunityInfoListCallback != null) {
                onGetCommunityInfoListCallback(communityInfoList);
            }
        };
        return CubeeServerConnector.getInstance().getNotJoinedPublicCommunityInfoList(startId, count, sortCondition, callBackFunc);
    };
    _proto.getCommunityInfo = function(roomId, onGetCommunityInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetCommunityInfoCallback != null && typeof onGetCommunityInfoCallback != 'function') {
            return false;
        }
        var _cachedCommunityInfo = null;
        if(_self._joinedCommunityList != null) {
            _cachedCommunityInfo = _self._joinedCommunityList.getByKey(roomId);
        }
        if(_cachedCommunityInfo != null) {
            setTimeout(function() {
                if(onGetCommunityInfoCallback != null) {
                    onGetCommunityInfoCallback(_cachedCommunityInfo);
                }
            }, 1);
            return true;
        }

        if (_self._getRoomInfoRequestList[roomId]) {
            _self._getRoomInfoRequestList[roomId].push(onGetCommunityInfoCallback);
            return true;
        }
        _self._getRoomInfoRequestList[roomId] = [];
        _self._getRoomInfoRequestList[roomId].push(onGetCommunityInfoCallback);

        var _callback = function(communityInfo){
            if(_self._joinedCommunityList != null && _self._joinedCommunityList.getByKey(roomId) == null){
                _self._joinedCommunityList.add(roomId, communityInfo);
            }

            if (_self._getRoomInfoRequestList[roomId]) {
                setTimeout(function() {
                    _allCallback();
                }, 1);
                function _allCallback() {
                    var _length = _self._getRoomInfoRequestList[roomId].length;
                    for (var _i = 0; _i < _length; _i++) {
                        if (_self._getRoomInfoRequestList[roomId][_i]) {
                            _self._getRoomInfoRequestList[roomId][_i](communityInfo);
                        }
                    }
                    delete _self._getRoomInfoRequestList[roomId];
                }
            }
        }

        var _ret = CubeeServerConnector.getInstance().getCommunityInfo(roomId, _callback);
        if (!_ret) {
            delete _self._getRoomInfoRequestList[roomId];
        }
        return _ret;
    };
    _proto.getCommunityMemberInfo = function(roomId, onGetCommunityMemberInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetCommunityMemberInfoCallback != null && typeof onGetCommunityMemberInfoCallback != 'function') {
            return false;
        }
        var _cachedCommunityInfo = null;
        if(_self._joinedCommunityList != null) {
            _cachedCommunityInfo = _self._joinedCommunityList.getByKey(roomId);
        }
        if(_cachedCommunityInfo != null) {
            var _ownerList = _cachedCommunityInfo.getOwnerList();
            if(_ownerList != null && _ownerList.getCount() > 0) {
                setTimeout(function() {
                    if(onGetCommunityMemberInfoCallback != null) {
                        onGetCommunityMemberInfoCallback(_cachedCommunityInfo);
                    }
                }, 1);
                return true;
            }
        }
        function _callback(communityInfo) {
            if(_cachedCommunityInfo != null) {
                if(communityInfo != null) {
                    var _resposeOwnerList = communityInfo.getOwnerList();
                    var _cachedOwnerList = _cachedCommunityInfo.getOwnerList();
                    _cachedOwnerList.removeAll();
                    var _count = _resposeOwnerList.getCount();
                    for(var _i = 0; _i < _count; _i++) {
                        var _communityMember = _resposeOwnerList.get(_i);
                        if(_communityMember == null) {
                            continue;
                        }
                        _cachedOwnerList.add(_communityMember);
                    }
                    var _resposeGeneralMemberList = communityInfo.getGeneralMemberList();
                    var _cachedGeneralMemberList = _cachedCommunityInfo.getGeneralMemberList();
                    _cachedGeneralMemberList.removeAll();
                    _count = _resposeGeneralMemberList.getCount();
                    for(var _i = 0; _i < _count; _i++) {
                        var _communityMember = _resposeGeneralMemberList.get(_i);
                        if(_communityMember == null) {
                            continue;
                        }
                        _cachedGeneralMemberList.add(_communityMember);
                    }
                    communityInfo = _cachedCommunityInfo;
                }
            }
            if(onGetCommunityMemberInfoCallback != null) {
                onGetCommunityMemberInfoCallback(communityInfo);
            }
        };
        return CubeeServerConnector.getInstance().getCommunityMemberInfo(roomId, _callback);
    };
    _proto.getCachedCommunityMember = function(roomId, jid) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return null;
        }
        if (jid != null && typeof jid != 'string') {
            return null;
        }
        var _cachedCommunityInfo = null;
        if(_self._joinedCommunityList != null) {
            _cachedCommunityInfo = _self._joinedCommunityList.getByKey(roomId);
        }
        if(_cachedCommunityInfo != null) {
            var _ownerList = _cachedCommunityInfo.getOwnerList();
            if(_ownerList == null) {
                return null;
            }
            var _count = _ownerList.getCount();
            for(var _i = 0; _i < _count; _i++) {
                var _communityMember = _ownerList.get(_i);
                if(_communityMember == null) {
                    continue;
                }
                var _cachedJid = _communityMember.getJid();
                if(_cachedJid == jid ){
                    return _communityMember;
                }
            }
            var _generalMemberList = _cachedCommunityInfo.getGeneralMemberList();
            var _count = _generalMemberList.getCount();
            for(var _i = 0; _i < _count; _i++) {
                var _communityMember = _generalMemberList.get(_i);
                if(_communityMember == null) {
                    continue;
                }
                var _cachedJid = _communityMember.getJid();
                if(_cachedJid == jid ){
                    return _communityMember;
                }
            }
            return null;
        }
        return null;
    };
    _proto.updateCommunity = function(communityInfo, onUpdateCommunityCallback) {
        var _self = this;
        if (communityInfo == null || typeof communityInfo != 'object') {
            return false;
        }
        if (onUpdateCommunityCallback != null && typeof onUpdateCommunityCallback != 'function') {
            return false;
        }
        function _callback(updatedCommunityInfo, preCommunityInfo) {

            if(onUpdateCommunityCallback != null) {
                onUpdateCommunityCallback(updatedCommunityInfo, preCommunityInfo);
            }
        };
        return CubeeServerConnector.getInstance().updateCommunity(communityInfo, _callback);
    };
    _proto.addCommunityMember = function(roomId, memberList, onAddCommunityMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onAddCommunityMemberCallback != null && typeof onAddCommunityMemberCallback != 'function') {
            return false;
        }
        function _callback(addedMemberList) {

            if(onAddCommunityMemberCallback != null) {
                onAddCommunityMemberCallback(addedMemberList);
            }
        };
        return CubeeServerConnector.getInstance().addCommunityMember(roomId, memberList, _callback);
    };
    _proto.updateCommunityOwner = function(roomId, ownerList, onUpdateCommunityOwnerCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (ownerList == null || typeof ownerList != 'object') {
            return false;
        }
        if (onUpdateCommunityOwnerCallback != null && typeof onUpdateCommunityOwnerCallback != 'function') {
            return false;
        }
        function _callback(communityOwnerList, preOwnerList) {

            if(onUpdateCommunityOwnerCallback != null) {
                onUpdateCommunityOwnerCallback(communityOwnerList, preOwnerList);
            }
        };
        return CubeeServerConnector.getInstance().updateCommunityOwner(roomId, ownerList, _callback);
    };
    _proto.removeCommunityMember = function(roomId, memberList, onRemoveCommunityMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onRemoveCommunityMemberCallback != null && typeof onRemoveCommunityMemberCallback != 'function') {
            return false;
        }
        function _callback(removedMemberList) {

            if(onRemoveCommunityMemberCallback != null) {
                onRemoveCommunityMemberCallback(removedMemberList);
            }
        };
        return CubeeServerConnector.getInstance().removeCommunityMember(roomId, memberList, _callback);
    };

    _proto.removePublicCommunityMember = function(roomId, onRemoveCommunityMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onRemoveCommunityMemberCallback != null && typeof onRemoveCommunityMemberCallback != 'function') {
            return false;
        }
        function _callback(removedMemberList) {

            if(onRemoveCommunityMemberCallback != null) {
                onRemoveCommunityMemberCallback(removedMemberList);
            }
        };
        return CubeeServerConnector.getInstance().removePublicCommunityMember(roomId, _callback);
    };
    _proto.onProfileChanged = function(profileChangeNotice) {
         var _self = this;
        if (profileChangeNotice == null || typeof profileChangeNotice != 'object') {
            return;
        }
        if(_self._joinedCommunityList == null) {
            return;
        }
        var _updateJid = profileChangeNotice.getJid();
        var _count = _self._joinedCommunityList.getCount();
        var _processCount = 0;
        function _onProfileChangedInCachedCommunityLoop() {
            setTimeout(function() {
                if(_processCount >= _count) {
                    return;
                }
                if (!_self._joinedCommunityList) {
                    return;
                }
                var _communityInfo = _self._joinedCommunityList.get(_processCount);
                if (_communityInfo != null) {
                    var _updatePerson = null;
                    var _cachedOwnerList = _communityInfo.getOwnerList();
                    if(_cachedOwnerList != null) {
                        _updatePerson = _cachedOwnerList.getByJid(_updateJid);
                    }
                    var _cachedGeneralMemberList = _communityInfo.getGeneralMemberList();
                    if(_updatePerson == null && _cachedGeneralMemberList != null) {
                        _updatePerson = _cachedGeneralMemberList.getByJid(_updateJid);
                    }
                    if(_updatePerson != null) {
                        switch (profileChangeNotice.getType()) {
                            case ProfileChangeNotice.TYPE_PRESENCE:
                                _updatePerson.setPresence(profileChangeNotice.getPresence());
                                _updatePerson.setMyMemo(profileChangeNotice.getMyMemo());
                                break;
                            case ProfileChangeNotice.TYPE_PROFILE:
                                var _profile = profileChangeNotice.getProfile();
                                if(_profile == null) {
                                    return;
                                }
                                _updatePerson.setUserName(_profile.getNickName());
                                _updatePerson.setAvatarType(_profile.getAvatarType());
                                _updatePerson.setAvatarData(_profile.getAvatarData());
                                _updatePerson.setGroup(_profile.getGroup());
                                break;
                            default:
                                break;
                        }
                    }
                }
                _processCount++;
                _onProfileChangedInCachedCommunityLoop();
            },1);
        }
        _onProfileChangedInCachedCommunityLoop();
    }

    _proto.hasCreatingRoomIdList = function(roomId) {
        return this._creatingRoomIdList.indexOf(roomId) < 0? false : true;
    }

    _proto.disconnected = function() {
        var _self = this;
        if(_self._joinedCommunityList != null) {
            _self._joinedCommunityList.removeAll();
            _self._joinedCommunityList = null;
        }
    };
})();
