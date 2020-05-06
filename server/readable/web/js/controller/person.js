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
function PersonManager() {
    this._contactListManger = new ContactListManager();
    this._followFollowesManager = new FollowFollowersManager();
    this._loginUserManager = new LoginUserManager();
    this._noConnectionUserManager = new NoConnectionUserManager();
};(function() {
    var _proto = PersonManager.prototype;
    _proto.setLoginedUserData = function(connectReceiveData) {
        var _self = this;
        if (connectReceiveData == null || typeof connectReceiveData != 'object') {
            return;
        }
        if (connectReceiveData.getLoginUserPerson == null || typeof connectReceiveData.getLoginUserPerson != 'function') {
            return;
        }
        if (connectReceiveData.getContactList == null || typeof connectReceiveData.getContactList != 'function') {
            return;
        }
        var _loginUserReceiveData = connectReceiveData.getLoginUserPerson();
        var _contactListData = connectReceiveData.getContactList();
        _self._loginUserManager.setLoginedLoginUserData(_loginUserReceiveData);
        _self._contactListManger.setLoginedContactListData(_contactListData);
    };
    _proto.changePresence = function(presence, myMemo) {
        var _self = this;
        if (presence != null && typeof presence != 'string') {
            return false;
        }
        if (myMemo != null && typeof myMemo != 'string') {
            return false;
        }
        return _self._loginUserManager.changePresence(presence, myMemo);
    };
    _proto.decideSendPresence = function(isKeyOperation) {
        var _self = this;
        if (isKeyOperation == null || typeof isKeyOperation != 'boolean') {
            return '';
        }
        return _self._loginUserManager.decideSendPresence(isKeyOperation);
    };
    _proto.changeProfile = function(profile, onChangeProfileCallback) {
        var _self = this;
        if (profile == null || typeof profile != 'object') {
            return false;
        }
        if (onChangeProfileCallback != null && typeof onChangeProfileCallback != 'function') {
            return false;
        }
        return _self._loginUserManager.changeProfile(profile, onChangeProfileCallback);
    };
    _proto.changePassword = function(oldPassword, newPassword, onChangePasswordCallback) {
        var _self = this;
        if (oldPassword == null || typeof oldPassword != 'string') {
            return false;
        }
        if (newPassword == null || typeof newPassword != 'string') {
            return false;
        }
        if (onChangePasswordCallback != null && typeof onChangePasswordCallback != 'function') {
            return false;
        }
        return _self._loginUserManager.changePassword(oldPassword, newPassword, onChangePasswordCallback);
    };
    _proto.changeMailCooperationSetting = function(mailCooperationInfoList, onChangeMailCooperationSettingCallback) {
        var _self = this;
        if (mailCooperationInfoList == null || typeof mailCooperationInfoList != 'object') {
            return false;
        }
        if (onChangeMailCooperationSettingCallback != null && typeof onChangeMailCooperationSettingCallback != 'function') {
            return false;
        }
        return _self._loginUserManager.changeMailCooperationSetting(mailCooperationInfoList, onChangeMailCooperationSettingCallback);
    };
    _proto.onProfileChanged = function(profileChangeNotice) {
        var _self = this;
        if (profileChangeNotice == null || typeof profileChangeNotice != 'object') {
            return;
        }
        _self._loginUserManager.onProfileChanged(profileChangeNotice);
        _self._contactListManger.onProfileChanged(profileChangeNotice);
        _self._followFollowesManager.onProfileChanged(profileChangeNotice);
        _self._noConnectionUserManager.onProfileChanged(profileChangeNotice);
    };
    _proto.getPersonData = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        return (_self._loginUserManager.getPersonData(jid) || _self._contactListManger.getPersonData(jid) || _self._followFollowesManager.getPersonData(jid));
    };
    _proto.getPersonDataByLoginAccount = function(loginAccount) {
        var _self = this;
        if (loginAccount == null || typeof loginAccount != 'string') {
            return null;
        }
        return (_self._loginUserManager.getPersonDataByLoginAccount(loginAccount) || _self._contactListManger.getPersonDataByLoginAccount(loginAccount) || _self._followFollowesManager.getPersonDataByLoginAccount(loginAccount) || _self._noConnectionUserManager.getPersonDataByLoginAccount(loginAccount));
    };
    _proto.getContactListData = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        return _self._contactListManger.getPersonData(jid);
    };
    _proto.onNotificationReceived = function(notification) {
        var _self = this;
        if (notification == null || typeof notification != 'object') {
            return;
        }
        if (notification.getType == null ||
            (notification.getType() != Notification_model.TYPE_GOOD_JOB &&
            notification.getType() != Notification_model.TYPE_MESSAGE_OPTION &&
            notification.getType() != Notification_model.TYPE_USER_FOLLOW)) {
            return;
        }
        var _type = notification.getType();
        switch(_type) {
            case Notification_model.TYPE_GOOD_JOB:
                var _goodJobNotification = notification;
                var _gjJid = _goodJobNotification.getFromJid();
                var _person = _self.getPersonData(_gjJid);
                if (_person != null) {
                    _person.setUserName(_goodJobNotification.getFromName());
                } else {
                    _person = new Person();
                    _person.setJid(_goodJobNotification.getFromJid());
                    _person.setUserName(_goodJobNotification.getFromName());
                    _person.setAvatarType(_goodJobNotification.getAvatarType());
                    _person.setAvatarData(_goodJobNotification.getAvatarData());
                    _person.setLoginAccount(_goodJobNotification.getLoginAccount());
                    _person.setStatus(_goodJobNotification.getStatus());
                    _person.setUserName(_goodJobNotification.getNickName());
                    _self._noConnectionUserManager.addPersonData(_person);
                }
                break;
            case Notification_model.TYPE_MESSAGE_OPTION:
                _self._onMessageOptionReceived(notification);
                break;
            case Notification_model.TYPE_USER_FOLLOW:
                _self._onUserFollowReceived(notification);
                break;
            default:
                break;
        }
    };
    _proto._onMessageOptionReceived = function(messageOptionNotification) {
        var _self = this;
        if (messageOptionNotification == null || typeof messageOptionNotification != 'object') {
            return;
        }
        if (messageOptionNotification.getType == null) {
            return;
        }
        if (messageOptionNotification.getType() != Notification_model.TYPE_MESSAGE_OPTION) {
            return;
        }
        var _contentType = messageOptionNotification.getContentType();
        switch(_contentType) {
            case MessageOptionNotification.CONTENT_TYPE_SIBLING_TASK:
                _self._onUpdateSiblingTaskReceived(messageOptionNotification);
                break;
            case MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK:
                _self._onDemandTaskReceived(messageOptionNotification);
                break;
            case MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE:
                _self._onSetReadMessageReceived(messageOptionNotification);
                break;
            default:
                break;
        }
    };
    _proto._onUpdateSiblingTaskReceived = function(siblingTaskNotification) {
        var _self = this;
        if (siblingTaskNotification == null || typeof siblingTaskNotification != 'object') {
            return;
        }
        if (siblingTaskNotification.getType == null) {
            return;
        }
        if (siblingTaskNotification.getType() != Notification_model.TYPE_MESSAGE_OPTION) {
            return;
        }
        var _contentType = siblingTaskNotification.getContentType();
        if (_contentType != MessageOptionNotification.CONTENT_TYPE_SIBLING_TASK) {
            return;
        }

        var _sblingOwnerJid = siblingTaskNotification.getOwnerJid();
        var _person = _self.getPersonData(_sblingOwnerJid);
        if (_person != null) {
            _person.setUserName(siblingTaskNotification.getOwnerName());
        } else {
            _person = new Person();
            _person.setJid(_sblingOwnerJid);
            _person.setUserName(siblingTaskNotification.getOwnerName());
            _person.setAvatarType(siblingTaskNotification.getAvatarType());
            _person.setAvatarData(siblingTaskNotification.getAvatarData());
            _person.setLoginAccount(siblingTaskNotification.getLoginAccount());
            _person.setStatus(siblingTaskNotification.getUserStatus());
            _person.setUserName(siblingTaskNotification.getNickName());
            _self._noConnectionUserManager.addPersonData(_person);
        }
    };
    _proto._onDemandTaskReceived = function(demandTaskNotification) {
        var _self = this;
        if (demandTaskNotification == null || typeof demandTaskNotification != 'object') {
            return;
        }
        if (demandTaskNotification.getType == null) {
            return;
        }
        if (demandTaskNotification.getType() != Notification_model.TYPE_MESSAGE_OPTION) {
            return;
        }
        var _contentType = demandTaskNotification.getContentType();
        if (_contentType != MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK) {
            return;
        }
        var _fromJid = demandTaskNotification.getJid();
        var _fromName = demandTaskNotification.getNickName();
        var _person = _self.getPersonData(_fromJid);
        if (_person != null) {
            _person.setUserName(_fromName);
        } else {
            _person = new Person();
            _person.setJid(_fromJid);
            _person.setUserName(_fromName);
            _self._noConnectionUserManager.addPersonData(_person);
        }
    };
    _proto._onSetReadMessageReceived = function(setReadMessageNotification) {
        var _self = this;
        if (setReadMessageNotification == null || typeof setReadMessageNotification != 'object') {
            return;
        }
        if (setReadMessageNotification.getType == null) {
            return;
        }
        if (setReadMessageNotification.getType() != Notification_model.TYPE_MESSAGE_OPTION) {
            return;
        }
        var _contentType = setReadMessageNotification.getContentType();
        if (_contentType != MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE) {
            return;
        }
        var _existingReaderItem = setReadMessageNotification.getExistingReaderItem();
        var _fromPerson = _existingReaderItem.getPerson();
        var _fromJid = _fromPerson.getJid();
        var _fromName = _fromPerson.getUserName();
        var _fromAvatarData = _fromPerson.getAvatarData();
        var _fromAvatarType = _fromPerson.getAvatarType();
        var _person = _self.getPersonData(_fromJid);
        if (_person != null) {
            _person.setUserName(_fromName);
            _person.setAvatarData(_fromAvatarData);
            _person.setAvatarType(_fromAvatarType);
        } else {
            _self._noConnectionUserManager.addPersonData(_fromPerson);
        }
    };

    _proto._onUserFollowReceived = function(notification) {
        var _self = this;
        var _actionType = notification._actionType;
        var _followeeJid = notification._followeeJid;
        var _followerJid = notification._followerJid;
        if (notification == null || typeof notification != 'object') {
            return;
        }
        if (notification.getType == null) {
            return;
        }
        if (notification.getType() != Notification_model.TYPE_USER_FOLLOW) {
            return;
        }
        var _myjid = LoginUser.getInstance().getJid();
        if(_actionType == "addUserFollow") {
            if(_followerJid == _myjid) {
                var _list = LoginUser.getInstance().getFolloweeList();
                for(var i = 0 ; i < _list.getCount() ; i++) {
                    var _user = _list.get(i).getJid();
                    if(_followeeJid == _user) {
                        return;
                    }
                }
                var _info = notification.getPersonInfo();
                for(var j = 0 ; j < _info.getCount() ; j++) {
                    var _jidInfo = _info.get(j).getJid();
                    if(_followeeJid == _jidInfo) {
                        LoginUser.getInstance().getFolloweeList().add(_info.get(j));
                    }
                }
            } else {
                var _list = LoginUser.getInstance().getFollowerList();
                for(var i = 0 ; i < _list.getCount() ; i++) {
                    var _user = _list.get(i).getJid();
                    if(_followerJid == _user) {
                        return;
                    }
                }
                var _info = notification.getPersonInfo();
                for(var j = 0 ; j < _info.getCount() ; j++) {
                    var _jidInfo = _info.get(j).getJid();
                    if(_followerJid == _jidInfo) {
                        LoginUser.getInstance().getFollowerList().add(_info.get(j));
                    }
                }
            }
        }
        if(_actionType == "delUserFollow") {
            if(_followerJid == _myjid) {
                var _list = LoginUser.getInstance().getFolloweeList();
                var _rm = [];
                for(var i = 0 ; i < _list.getCount() ; i++) {
                    var _user = _list.get(i).getJid();
                    if(_followeeJid == _user) {
                        _rm.push(i);
                    }
                }
                var _rmList = _rm.sort();
                for(var j = _rmList.length ; j > 0 ; j--) {
                    LoginUser.getInstance().getFolloweeList().remove(_rmList[j-1]);
                }
            } else {
                var _list = LoginUser.getInstance().getFollowerList();
                var _rm =[];
                for(var i = 0 ; i < _list.getCount() ; i++) {
                    var _user = _list.get(i).getJid();
                    if(_followerJid == _user) {
                        _rm.push(i);
                    }
                }
                var _rmList = _rm.sort();
                for(var j = _rmList.length ; j > 0 ; j--) {
                    LoginUser.getInstance().getFollowerList().remove(_rmList[j-1]);
                }
            }
        };
        const _filterCondition = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_RECENT, null);
        const _sortCondition = new ColumnSortCondition();
        const _searchCondition = new ColumnSearchCondition(_filterCondition,_sortCondition);
        const list = ColumnManager.getInstance().getColumnList();
        for(let i=0;i<list.getCount();i++){
            const column =  list.get(i);
            if(column.getColumnType() == ColumnInformation.TYPE_COLUMN_RECENT){
                list.get(i).setSearchCondition(_searchCondition);
            }
        }
        SideMenuRecentView.getInstance().getColumnInfo().setSearchCondition(_searchCondition);
        SideMenuMurmurView.getInstance().getColumnInfo().setSearchCondition(_searchCondition);
        const displayVal = $('#side-bar-murmur').css('display');
        $('#side-bar-murmur').css('display','none');
        SideMenuMurmurView.getInstance().clearColumn();
        SideMenuMurmurView.getInstance().showMurmurHistory();
        if(displayVal != 'none'){
            setTimeout(()=>{
                SideMenuMurmurView.getInstance().open();
            },300);
        }
    };

    _proto.clearPrePresence = function() {
        var _self = this;
        _self._loginUserManager.clearPrePresence();
    };
    _proto.getFollowList = function() {
        var _self = this;
        return _self._followFollowesManager.getFollowList();
    };
    _proto.disconnected = function() {
        var _self = this;
        _self._loginUserManager.disconnected();
        _self._contactListManger.disconnected();
        _self._followFollowesManager.disconnected();
        _self._noConnectionUserManager.disconnected();
    };

    _proto.isContactListMember = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return false;
        }

        var _isContactListMember = false;
        var _person = _self._contactListManger.getPersonData(jid);
        if(_person){
            _isContactListMember = true;
        }
        return _isContactListMember;
    };

    _proto.getPersonDataByJidFromServer = function(jidList, onGetPersonDataCallback) {
        var _self = this;
        if (jidList == null || typeof jidList != 'object' || jidList.getCount() <= 0) {
            return false;
        }
        if (onGetPersonDataCallback == null || typeof onGetPersonDataCallback != 'function') {
            return false;
        }
        var _personList = new StringMapedArrayList();
        var _needRequestJidList = new ArrayList();
        for(var i=0; i<jidList.getCount(); i++){
            var _jid = jidList.get(i);
            var _person = _self.getPersonData(_jid);
            if(_person){
                _personList.add(_jid, _person);
            }else{
                _needRequestJidList.add(_jid);
            }
        }
        if(_needRequestJidList.getCount() <= 0){
            setTimeout(function(){
                onGetPersonDataCallback(_personList);
            },1);
            return true;
        }
        var _callback = function(result){
            if(result){
                var _relCount = result.getCount();
                for(var j=0; j<_relCount; j++){
                    var _person = result.get(j);
                    if(_person == null){
                        continue;
                    }
                    _personList.add(_person.getJid(), _person);
                }
            }
            onGetPersonDataCallback(_personList);
        };
        var _startId = 0;
        var _count = jidList.getCount();
        var _condition = _createGetPersonCondition('jid', _needRequestJidList);
        if(!_condition){
            return false;
        }
        return _self.searchPerson(_startId, _count, _condition, _callback);
    };
    _proto.getPersonDataByLoginAccountFromServer = function(accountList, onGetPersonDataCallback) {
        var _self = this;
        if (accountList == null || typeof accountList != 'object' || accountList.getCount() <= 0) {
            return false;
        }
        if (onGetPersonDataCallback == null || typeof onGetPersonDataCallback != 'function') {
            return false;
        }
        var _personList = new StringMapedArrayList();
        var _needRequestAccountList = new ArrayList();
        for(var i=0; i<accountList.getCount(); i++){
            var _account = accountList.get(i);
            var _person = _self.getPersonDataByLoginAccount(_account);
            if(_person){
                _personList.add(_account, _person);
            }else{
                _needRequestAccountList.add(_account);
            }
        }
        if(_needRequestAccountList.getCount() <= 0){
            setTimeout(function(){
                onGetPersonDataCallback(_personList);
            },1);
            return true;
        }
        var _callback = function(result){
            if(result){
                var _relCount = result.getCount();
                for(var j=0; j<_relCount; j++){
                    var _person = result.get(j);
                    if(_person == null){
                        continue;
                    }
                    _personList.add(_person.getLoginAccount(), _person);
                }
            }
            onGetPersonDataCallback(_personList);
        };
        var _startId = 0;
        var _count = accountList.getCount();
        var _condition = _createGetPersonCondition('login_account', _needRequestAccountList);
        if(!_condition){
            return false;
        }
        return _self.searchPerson(_startId, _count, _condition, _callback);
    };
    function _createGetPersonCondition(type, itemList){
        if(type == null || typeof type != 'string'){
            return null;
        }
        if(itemList == null || typeof itemList != 'object'){
            return null;
        }
        var _filterCondition = null;
        if(itemList.getCount() == 1){
            _filterCondition = new ItemCondition();
            _filterCondition.setData(type, itemList.get(0));
        }else{
            _filterCondition = new OrCondition();
            var _count = itemList.getCount();
            for(var i=0; i<_count; i++){
                var _itemCondition = new ItemCondition();
                _itemCondition.setData(type, itemList.get(i));
                _filterCondition.addChildCondition(_itemCondition);
            }
        }
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("login_account");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_ASC);

        return new ColumnSearchCondition(_filterCondition, _sortCondition);
    }
    _proto.searchPerson = function(startId, count, columnSearchCondition, onSearchPersonCallback) {
        var _self = this;
        if (startId == null || typeof startId != 'number' || startId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (columnSearchCondition == null || typeof columnSearchCondition != 'object') {
            return false;
        }
        if (onSearchPersonCallback == null || typeof onSearchPersonCallback != 'function') {
            return false;
        }
        function callBackFunc(resultPersonData) {
            onSearchPersonCallback(resultPersonData);
        }

        return CubeeServerConnector.getInstance().searchPerson(startId, count, columnSearchCondition, callBackFunc);
    };
    _proto.addContactListMember = function(memberList, onAddContactListMemberCallback){
        var _self = this;
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onAddContactListMemberCallback != null && typeof onAddContactListMemberCallback != 'function') {
            return false;
        }

        return _self._contactListManger.addContactListMember(memberList, onAddContactListMemberCallback);
    };
    _proto.removeContactListMember = function(memberList, onRemoveContactListMemberCallback){
        var _self = this;
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onRemoveContactListMemberCallback != null && typeof onRemoveContactListMemberCallback != 'function') {
            return false;
        }
        return _self._contactListManger.removeContactListMember(memberList, onRemoveContactListMemberCallback);
    };
    PersonManager.setProfile = function(person, profile) {
        var _self = this;
        if(person == null || profile == null) {
            return;
        }
        var _nickName = profile.getNickName();
        _nickName = (_nickName == null || _nickName.length == 0)? null : _nickName;
        person.setUserName(_nickName);
        var _group = profile.getGroup();
        _group = (_group == null || !Array.isArray(_group) || _group.length == 0)? [] : _group;
        person.setGroup(_group);
        person.setAvatarType(profile.getAvatarType());
        person.setAvatarData(profile.getAvatarData());
    };

    _proto.getGroupList = function() {
        return new Promise((resolve, reject) => {
            var _self = this;
            CubeeServerConnector.getInstance().getGroupList()
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    };

    _proto.getFolloweeList = function(jid) {
        return new Promise((resolve,reject) => {
            var _self = this;
            CubeeServerConnector.getInstance().getFolloweeList(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    };

    _proto.getFollowerList = function(jid) {
        return new Promise((resolve,reject) => {
            var _self = this;
            CubeeServerConnector.getInstance().getFollowerList(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    };

    _proto.getFollowInfo = function(jid) {
        return new Promise((resolve,reject) => {
            var _self = this;
            CubeeServerConnector.getInstance().getFollowInfo(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    };

    _proto.addUserFollow = function(jid) {
        return new Promise((resolve,reject) => {
            var _self = this;
            CubeeServerConnector.getInstance().addUserFollow(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    };

    _proto.delUserFollow = function(jid) {
        return new Promise((resolve,reject) => {
            var _self = this;
            CubeeServerConnector.getInstance().delUserFollow(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    };

})();

function ContactListManager() {

};(function() {
    var _proto = ContactListManager.prototype;
    _proto.setLoginedContactListData = function(contactListData) {
        var _self = this;
        if (contactListData == null || typeof contactListData != 'object') {
            return;
        }
        var _contactList = ContactList.getInstance();
        var _count = contactListData.getCount();
        for (var _i = 0; _i < _count; _i++) {
            _contactList.add(contactListData.get(_i));
        }
    };
    _proto.onProfileChanged = function(profileChangeNotice) {
        var _self = this;
        if (profileChangeNotice == null || typeof profileChangeNotice != 'object') {
            return;
        }
        var _contactList = ContactList.getInstance();
        var _updatePerson = _contactList.getByJid(profileChangeNotice.getJid());
        if (_updatePerson == null) {
            return;
        }
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
                PersonManager.setProfile(_updatePerson, _profile);
                break;
            default:
                break;
        }
    };
    _proto.getPersonData = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        var _contactList = ContactList.getInstance();
        return _contactList.getByJid(jid);
    };
    _proto.getPersonDataByLoginAccount = function(loginAccount) {
        var _self = this;
        if (loginAccount == null || typeof loginAccount != 'string') {
            return null;
        }
        var _contactList = ContactList.getInstance();
        return _contactList.getByLoginAccount(loginAccount);
    };
    _proto.disconnected = function() {
        var _contactList = ContactList.getInstance();
        _contactList.removeAll();
    };

    _proto.addContactListMember = function(memberList, onAddContactListMemberCallback){
        var _self = this;
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onAddContactListMemberCallback != null && typeof onAddContactListMemberCallback != 'function') {
            return false;
        }
        function _callback(result, reason) {
            if(result){
                var _addUserList = result.addSuccessMemberList;
                var _contactListMasterData = ContactList.getInstance();
                var _count = _addUserList.getCount();
                for (var _i = 0; _i < _count; _i++) {
                    _contactListMasterData.add(_addUserList.get(_i).getPerson());
                }
            }
            onAddContactListMemberCallback(result, reason);
        }
        return CubeeServerConnector.getInstance().addContactListMember(memberList, _callback);
    };
    _proto.removeContactListMember = function(memberList, onRemoveContactListMemberCallback){
        var _self = this;
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onRemoveContactListMemberCallback != null && typeof onRemoveContactListMemberCallback != 'function') {
            return false;
        }
        function _callback(result, reason) {
            if(result){
                var _removedUserList = result.removeSuccessMemberList;
                var _contactListMasterData = ContactList.getInstance();
                var _count = _removedUserList.getCount();
                for (var _i = 0; _i < _count; _i++) {
                    _contactListMasterData.removeByJid(_removedUserList.get(_i).jid);
                }
            }
            onRemoveContactListMemberCallback(result, reason);
        }
        return CubeeServerConnector.getInstance().removeContactListMember(memberList, _callback);
    };
})();

function FollowFollowersManager() {

};(function() {
    var _proto = FollowFollowersManager.prototype;
    _proto.onProfileChanged = function(profileChangeNotice) {
        var _self = this;
        if (profileChangeNotice == null || typeof profileChangeNotice != 'object') {
            return;
        }
        var _followList = FollowList.getInstance();
        var _updateFollowPerson = _followList.getByJid(profileChangeNotice.getJid());
        var _followerList = FollowerList.getInstance();
        var _updateFollowerPerson = _followerList.getByJid(profileChangeNotice.getJid());
        switch (profileChangeNotice.getType()) {
            case ProfileChangeNotice.TYPE_PRESENCE:
                if (_updateFollowPerson != null) {
                    _updateFollowPerson.setPresence(profileChangeNotice.getPresence());
                    _updateFollowPerson.setMyMemo(profileChangeNotice.getMyMemo());
                }
                if (_updateFollowerPerson != null) {
                    _updateFollowerPerson.setPresence(profileChangeNotice.getPresence());
                    _updateFollowerPerson.setMyMemo(profileChangeNotice.getMyMemo());
                }
                break;
            case ProfileChangeNotice.TYPE_PROFILE:
                var _profile = profileChangeNotice.getProfile();
                if(_profile == null) {
                    return;
                }
                if (_updateFollowPerson != null) {
                    PersonManager.setProfile(_updateFollowPerson, _profile);
                }
                if (_updateFollowerPerson != null) {
                    PersonManager.setProfile(_updateFollowerPerson, _profile);
                }
                break;
            default:
                break;
        }
    };
    _proto.getPersonData = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        var _followList = FollowList.getInstance();
        var _followerList = FollowerList.getInstance();
        return _followList.getByJid(jid) || _followerList.getByJid(jid);
    };
    _proto.getPersonDataByLoginAccount = function(loginAccount) {
        var _self = this;
        if (loginAccount == null || typeof loginAccount != 'string') {
            return null;
        }
        var _followList = FollowList.getInstance();
        var _followerList = FollowerList.getInstance();
        return _followList.getByLoginAccount(loginAccount) || _followerList.getByLoginAccount(loginAccount);
    };
    _proto.getFollowList = function() {
        var _followList = ContactList.getInstance();
        return _followList;
    };
    _proto.disconnected = function() {
        var _followList = FollowList.getInstance();
        _followList.removeAll();
        var _followerList = FollowerList.getInstance();
        _followerList.removeAll();
    };
})();

function LoginUserManager() {
    this._prePresence = null;
};(function() {
    var _proto = LoginUserManager.prototype;
    _proto.setLoginedLoginUserData = function(loginUserReceiveData) {
        var _self = this;
        if (loginUserReceiveData == null || typeof loginUserReceiveData != 'object') {
            return;
        }
        var _loginUser = LoginUser.getInstance();
        var _loginUserPresence = Person.PRESENCE_STATUS_ONLINE;
        var _loginUserMyMemo = '';
        _loginUser.setPresence(_loginUserPresence);
        _loginUser.setMyMemo(_loginUserMyMemo);
        _loginUser.setUserName(loginUserReceiveData.getUserName());
        _loginUser.setMailAddress(loginUserReceiveData.getMailAddress());
        _loginUser.setJid(loginUserReceiveData.getJid());
        _loginUser.setAvatarType(loginUserReceiveData.getAvatarType());
        _loginUser.setAvatarData(loginUserReceiveData.getAvatarData());
        _loginUser.setSettings(loginUserReceiveData.getSettings());
        _loginUser.setLoginAccount(loginUserReceiveData.getLoginAccount());
        _loginUser.setStatus(loginUserReceiveData.getStatus());
        _loginUser.setGroup(loginUserReceiveData.getGroup());
        _loginUser.setTenantInfo(loginUserReceiveData.getTenantInfo());
    };
    _proto.changePresence = function(presence, myMemo) {
        var _self = this;
        if (presence != null && typeof presence != 'string') {
            return false;
        }
        if (myMemo != null && typeof myMemo != 'string') {
            return false;
        }
        var _loginUser = LoginUser.getInstance();
        var _presence;
        if (presence == null) {
            _presence = _loginUser.getPresence();
        } else {
            _presence = Utils.convertPresenceStrToNum(presence);
        }
        var _myMemo = myMemo;
        if (_myMemo == null) {
            _myMemo = _loginUser.getMyMemo();
        }
        var _ret = CubeeServerConnector.getInstance().changePresence(_presence, _myMemo);
        if (_ret) {
            _loginUser.setPresence(_presence);
            _loginUser.setMyMemo(_myMemo);
        }
        return _ret;
    };

    _proto.changeProfile = function(profile, onChangeProfileCallback) {
        var _self = this;
        if (profile == null || typeof profile != 'object') {
            return false;
        }
        if (onChangeProfileCallback != null && typeof onChangeProfileCallback != 'function') {
            return false;
        }
        var _loginUser = LoginUser.getInstance();
        if (profile.getNickName() == null) {
            profile.setNickName(_loginUser.getUserName());
        }
        if (profile.getMailAddress() == null) {
            profile.setMailAddress(_loginUser.getMailAddress());
        }
        var _avatarType = profile.getAvatarType();
        var _avatarData = profile.getAvatarData();
        if (_avatarType == null || _avatarData == null) {
            if (_avatarType == null && _avatarData == null) {
                profile.setAvatarType(_loginUser.getAvatarType());
                profile.setAvatarData(_loginUser.getAvatarData());
            } else {
                profile.setAvatarType('');
                profile.setAvatarData('');
            }
        }
        function _callback(result) {
            onChangeProfileCallback(result);
        };
        return CubeeServerConnector.getInstance().changeProfile(profile, _callback);
    };

    _proto.changePassword = function(oldPassword, newPassword, onChangePasswordCallback) {
        var _self = this;
        if (oldPassword == null || typeof oldPassword != 'string') {
            return false;
        }
        if (newPassword == null || typeof newPassword != 'string') {
            return false;
        }
        if (onChangePasswordCallback != null && typeof onChangePasswordCallback != 'function') {
            return false;
        }
        function _callback(result, reason) {
            onChangePasswordCallback(result, reason);
        };
        return CubeeServerConnector.getInstance().changePassword(oldPassword, newPassword, _callback);
    };

    _proto.changeMailCooperationSetting = function(mailCooperationInfoList, onChangeMailCooperationSettingCallback) {
        var _self = this;
        if (mailCooperationInfoList == null || typeof mailCooperationInfoList != 'object') {
            return false;
        }
        if (onChangeMailCooperationSettingCallback != null && typeof onChangeMailCooperationSettingCallback != 'function') {
            return false;
        }
        function _callback(result, reason) {
            if (result) {
                var _loginUser = LoginUser.getInstance();
                _loginUser.getSettings().setMailCooperationList(mailCooperationInfoList);
            }
            onChangeMailCooperationSettingCallback(result, reason);
        };
        return CubeeServerConnector.getInstance().changeMailCooperationSetting(mailCooperationInfoList, _callback);
    };

    _proto.onProfileChanged = function(profileChangeNotice) {
        var _self = this;
        if (profileChangeNotice == null || typeof profileChangeNotice != 'object') {
            return;
        }
        var _loginUser = LoginUser.getInstance();
        if (profileChangeNotice.getJid() != _loginUser.getJid()) {
            return;
        }
        switch (profileChangeNotice.getType()) {
            case ProfileChangeNotice.TYPE_PRESENCE:
                _loginUser.setPresence(profileChangeNotice.getPresence());
                _loginUser.setMyMemo(profileChangeNotice.getMyMemo());
                break;
            case ProfileChangeNotice.TYPE_PROFILE:
                var _profile = profileChangeNotice.getProfile();
                if(_profile == null) {
                    return;
                }
                PersonManager.setProfile(_loginUser, _profile);
                break;
            default:
                break;
        }
    };
    _proto.onProfileChanged = function(profileChangeNotice) {
        var _self = this;
        if (profileChangeNotice == null || typeof profileChangeNotice != 'object') {
            return;
        }
        var _loginUser = LoginUser.getInstance();
        if (profileChangeNotice.getJid() != _loginUser.getJid()) {
            return;
        }
        switch (profileChangeNotice.getType()) {
            case ProfileChangeNotice.TYPE_PRESENCE:
                _loginUser.setPresence(profileChangeNotice.getPresence());
                _loginUser.setMyMemo(profileChangeNotice.getMyMemo());
                break;
            case ProfileChangeNotice.TYPE_PROFILE:
                var _profile = profileChangeNotice.getProfile();
                if(_profile == null) {
                    return;
                }
                PersonManager.setProfile(_loginUser, _profile);
                break;
            default:
                break;
        }
    };
    _proto.getPersonData = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        var _loginUser = LoginUser.getInstance();
        if (_loginUser.getJid() != jid) {
            return null;
        }
        return _loginUser;
    };
    _proto.getPersonDataByLoginAccount = function(loginAccount) {
        var _self = this;
        if (loginAccount == null || typeof loginAccount != 'string') {
            return null;
        }
        var _loginUser = LoginUser.getInstance();
        if (_loginUser.getLoginAccount() != loginAccount) {
            return null;
        }
        return _loginUser;
    };
    _proto.decideSendPresence = function(isKeyOperation) {
        var _self = this;
        var _ret = '';
        if (isKeyOperation == null || typeof isKeyOperation != 'boolean') {
            return _ret;
        }
        var _loginUser = LoginUser.getInstance();
        var _presence = _loginUser.getPresence();

        if (!isKeyOperation) {
            switch(_presence) {
                case Person.PRESENCE_STATUS_ONLINE:
                case Person.PRESENCE_STATUS_AWAY:
                    _ret = Utils.convertPresenceNumToStr(Person.PRESENCE_STATUS_AWAY);
                    break;
                case Person.PRESENCE_STATUS_EXT_AWAY:
                    _ret = Utils.convertPresenceNumToStr(Person.PRESENCE_STATUS_EXT_AWAY);
                    break;
                case Person.PRESENCE_STATUS_DO_NOT_DISTURB:
                    _ret = Utils.convertPresenceNumToStr(Person.PRESENCE_STATUS_DO_NOT_DISTURB);
                    break;
                default:
                    break;
            }
            _self._prePresence = _presence;
        } else {
            switch(_presence) {
                case Person.PRESENCE_STATUS_ONLINE:
                case Person.PRESENCE_STATUS_EXT_AWAY:
                case Person.PRESENCE_STATUS_DO_NOT_DISTURB:
                    _ret = Utils.convertPresenceNumToStr(_presence);
                    break;
                case Person.PRESENCE_STATUS_AWAY:
                    _ret = Utils.convertPresenceNumToStr(_self._prePresence);
                    if (_ret == '') {
                        _ret = Utils.convertPresenceNumToStr(_presence);
                    }
                    break;
                default:
                    break;
            }
            _self.clearPrePresence();
        }
        return _ret;
    };
    _proto.clearPrePresence = function() {
        var _self = this;
        _self._prePresence = null;
    };
    _proto.disconnected = function() {
        var _loginUser = LoginUser.getInstance();
        _loginUser.cleanUp();
    };
})();
function NoConnectionUserManager() {

};(function() {
    var _proto = NoConnectionUserManager.prototype;
    _proto.onProfileChanged = function(profileChangeNotice) {
        var _self = this;
        if (profileChangeNotice == null || typeof profileChangeNotice != 'object') {
            return;
        }
        var _noConnectionPersonList = NoConnectionPersonList.getInstance();
        var _updatePerson = _noConnectionPersonList.getByJid(profileChangeNotice.getJid());
        switch (profileChangeNotice.getType()) {
            case ProfileChangeNotice.TYPE_PRESENCE:
                if (_updatePerson != null) {
                    _updatePerson.setPresence(profileChangeNotice.getPresence());
                    _updatePerson.setMyMemo(profileChangeNotice.getMyMemo());
                }
                break;
            case ProfileChangeNotice.TYPE_PROFILE:
                var _profile = profileChangeNotice.getProfile();
                if(_profile == null) {
                    return;
                }
                if(_updatePerson == null) {
                    return;
                }
                PersonManager.setProfile(_updatePerson, _profile);
                break;
            default:
                break;
        }
    };
    _proto.getPersonData = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        var _noConnectionPersonList = NoConnectionPersonList.getInstance();
        return _noConnectionPersonList.getByJid(jid);
    };
    _proto.getPersonDataByLoginAccount = function(loginAccount) {
        var _self = this;
        if (loginAccount == null || typeof loginAccount != 'string') {
            return null;
        }
        var _noConnectionPersonList = NoConnectionPersonList.getInstance();
        return _noConnectionPersonList.getByLoginAccount(loginAccount);
    };
    _proto.addPersonData = function(person) {
        var _self = this;
        if (person == null || typeof person != 'object') {
            return false;
        }
        var _noConnectionPersonList = NoConnectionPersonList.getInstance();
        return _noConnectionPersonList.add(person);
    };
    _proto.disconnected = function() {
        var _noConnectionPersonList = NoConnectionPersonList.getInstance();
        _noConnectionPersonList.removeAll();
    };
})();
