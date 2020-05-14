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
function CubeeController() {
    this._loginManager = new LoginManager();
    this._personManager = new PersonManager();
    this._favoriteManager = new FavoriteManager();
    this._messageManager = new MessageManager();
    this._searchManager = new SearchManager();
    this._notificationManager = new NotificationManager();
    this._communityManager = new CommunityManager();
    this._chatroomManager = new ChatRoomManager();
    this._mailServerManager = new MailServerManager();
    this._authorityManager = new AuthorityManager();
    this._imageDataMap = {};
};(function() {
    var _cubeeController = new CubeeController();
    CubeeController.getInstance = function() {
        return _cubeeController;
    };
    var _proto = CubeeController.prototype;

    _proto.getImageData = function(name) {
        if (!name || typeof name != 'string') {
            return null;
        }
        return this._imageDataMap[name];
    }

    _proto.setImageData = function(name, data) {
        if (!name || typeof name != 'string') {
            return;
        }
        if (!data) {
            delete this._imageDataMap[name];
            return;
        }
        this._imageDataMap[name] = data;
    }

    _proto.login = function(tenantName, userName, password, onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification, onLoginWizard) {
        var _self = this;
        if (userName == null || typeof userName != 'string') {
            return false;
        }
        if (password == null || typeof password != 'string') {
            return false;
        }
        if (!_checkParameterCallbackFunction(onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification, onLoginWizard)) {

            return false;
        }
        function _onConnectedCallback(connectReceiveData) {
            if (connectReceiveData == null || typeof connectReceiveData != 'object') {
                return;
            }
            if (connectReceiveData.getLoginUserPerson == null || typeof connectReceiveData.getLoginUserPerson != 'function') {
                return;
            }
            var _loginUser = connectReceiveData.getLoginUserPerson();
            if(_loginUser == null){
                return;
            }
            var _loginUserJid = _loginUser.getJid();
            if(_loginUserJid == null){
                return;
            }
            var _jidList = new ArrayList();
            _jidList.add(_loginUserJid);
            function _onGetLoginPersonDataCallBack(result){
                if(result != null){
                    var _loginPersonData = result.get(0);
                    if(_loginPersonData != null){
                        _loginUser.setGroup(_loginPersonData.getGroup());
                        LoginPresence.getInstance().setLoginPresence(_loginPersonData.getPresence());
                        LoginMyMemo.getInstance().setLoginMyMemo(_loginPersonData.getMyMemo());
                    }
                }
                _self._personManager.setLoginedUserData(connectReceiveData);
                function onGetServerListCallBack() {
                };
                _self._mailServerManager.getServerInfoListFirst(onGetServerListCallBack);


                onConnected();

                var _heartbeatTimeMills = Conf.getVal('SERVER_HEART_BEAT_TIME_MILLS');
                function _heartbeat() {
                    setTimeout(function(){
                        if(LoginUser.getInstance().getPresence() == Person.PRESENCE_STATUS_OFFLINE) {
                            return;
                        }
                        _self._personManager.changePresence(null, null);
                        setTimeout(function() {
                            if(LoginUser.getInstance().getPresence() == Person.PRESENCE_STATUS_OFFLINE) {
                                return;
                            }
                            _self._personManager.changePresence(null, null);
                            _heartbeat();
                        }, 500);
                    }, _heartbeatTimeMills);
                };
                _heartbeat();
            }
            Promise.all([
              _self.getRights(_loginUser.getLoginAccount()),
              _self.getRoleAssignmentForUser(_loginUser.getLoginAccount())
            ]).then(function(result){
                AuthorityInfo.getInstance().setRoleId(result[1]['content']['role']['id']);
                AuthorityInfo.getInstance().setRoleName(result[1]['content']['role']['t']['ja']);
                AuthorityInfo.getInstance().setRights(result[0]['content']['rights']);
                _self.getPersonDataByJidFromServer(_jidList, _onGetLoginPersonDataCallBack);
            }).catch(function(err){
                if ('content' in err && 'reason' in err.content) {
                    let error = { message: ''};
                    switch(err.content.reason) {
                    case 404000:
                        error.message = 'unauthorized_assignment';
                        break;
                    default:
                        error.message = 'failed_to_fetch_authority_data';
                        break;
                    }
                    return onError(error);
                }
            });

            return true;
        };

        function _onDisconnectedCallback() {
            var _contactList = ContactList.getInstance();
            var _contactListCount = _contactList.getCount();
            for (var _i = 0; _i < _contactListCount; _i++) {
                var _person = _contactList.get(_i);
                var _profile = new PresenceChangeNotice();
                _profile.setJid(_person.getJid());
                _profile.setPresence(Person.PRESENCE_STATUS_OFFLINE);
                _profile.setMyMemo('');
                _onProfileChangedCallback(_profile);
            }
            onDisconnected();
            _self._notifyDisconnected();
        };

        function _onErrorOccuredCallback(err) {
            onError(err);
        };

        function _onProfileChangedCallback(profileChangeNotice) {
            _self._personManager.onProfileChanged(profileChangeNotice);
            _self._communityManager.onProfileChanged(profileChangeNotice);
            onProfileChangedNotify(profileChangeNotice);
        };

        function _onMessageReceivedCallback(message) {
            _self._messageManager.onMessageReceived(message);
            onMessage(message);
        };

        function _onNotificationReceivedCallback(notification) {
            if (notification.getType() == Notification_model.TYPE_DELETE_MESSAGE) {
                onNotification(notification);
                _self._notificationManager.onNotificationReceived(notification);
            } else {
                _self._notificationManager.onNotificationReceived(notification);
                onNotification(notification);
            }
        };

        function _onLoginWizardCallback(connectReceiveData) {
            onLoginWizard(connectReceiveData);
        };

        return _self._loginManager.login(tenantName, userName, password, _onConnectedCallback, _onDisconnectedCallback, _onErrorOccuredCallback, _onProfileChangedCallback, _onMessageReceivedCallback, _onNotificationReceivedCallback,_onLoginWizardCallback);
    };
    _proto.skipLogin = function(accessToken, onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (!_checkParameterCallbackFunction(onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification)) {
            return false;
        }
        function _onConnectedCallback(connectReceiveData) {
            _self._personManager.setLoginedUserData(connectReceiveData);
            function onGetServerListCallBack() {
            };
            _self._mailServerManager.getServerInfoListFirst(onGetServerListCallBack);
            onConnected();
        };

        function _onDisconnectedCallback() {
            var _contactList = ContactList.getInstance();
            var _contactListCount = _contactList.getCount();
            for (var _i = 0; _i < _contactListCount; _i++) {
                var _person = _contactList.get(_i);
                var _profile = new PresenceChangeNotice();
                _profile.setJid(_person.getJid());
                _profile.setPresence(Person.PRESENCE_STATUS_OFFLINE);
                _profile.setMyMemo('');
                _onProfileChangedCallback(_profile);
            }
            onDisconnected();
            _self._notifyDisconnected();
        };

        function _onErrorOccuredCallback(err) {
            onError(err);
        };

        function _onProfileChangedCallback(profileChangeNotice) {
            _self._personManager.onProfileChanged(profileChangeNotice);
            onProfileChangedNotify(profileChangeNotice);
        };

        function _onMessageReceivedCallback(message) {
            _self._messageManager.onMessageReceived(message);
            onMessage(message);
        };

        function _onNotificationReceivedCallback(notification) {
            if (notification.getType() == Notification_model.TYPE_DELETE_MESSAGE) {
                onNotification(notification);
                _self._notificationManager.onNotificationReceived(notification);
            } else {
                _self._notificationManager.onNotificationReceived(notification);
                onNotification(notification);
            }
        };

        return _self._loginManager.skipLogin(accessToken, _onConnectedCallback, _onDisconnectedCallback, _onErrorOccuredCallback, _onProfileChangedCallback, _onMessageReceivedCallback, _onNotificationReceivedCallback);
    };
    function _checkParameterCallbackFunction(onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification, onLoginWizard) {
        if(onConnected == null || typeof onConnected != 'function') {
            return false;
        }
        if(onDisconnected == null || typeof onDisconnected != 'function') {
            return false;
        }
        if(onError == null || typeof onError != 'function') {
            return false;
        }
        if(onProfileChangedNotify == null || typeof onProfileChangedNotify != 'function') {
            return false;
        }
        if(onMessage == null || typeof onMessage != 'function') {
            return false;
        }
        if(onNotification == null || typeof onNotification != 'function') {
            return false;
        }
        if(onLoginWizard == null || typeof onLoginWizard != 'function') {
            return false;
        }

        return true;
    };
    _proto.getChatroomManager = function() {
        return this._chatroomManager;
    };
    _proto.getCommunityManager = function() {
        return this._communityManager;
    };
    _proto.getTaskMessages = function(baseId, count, filter, sort, onGetTaskMessageCallbak) {
        var _self = this;
        if (baseId == null || typeof baseId != 'number' || baseId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (filter == null || typeof filter != 'object' || $.isEmptyObject(filter)) {
            return false;
        }
        if (sort == null || typeof sort != 'object') {
            return false;
        }
        if (onGetTaskMessageCallbak == null || typeof onGetTaskMessageCallbak != 'function') {
            return false;
        }
        return _self._messageManager.getTaskMessages(baseId, count, filter, sort, onGetTaskMessageCallbak);
    };
    _proto.getChatMessages = function(baseId, count, messageTo, onGetChatMessageCallbak) {
        var _self = this;
        if (baseId == null || typeof baseId != 'number' || baseId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (messageTo == null || typeof messageTo != 'string') {
            return false;
        }
        if (onGetChatMessageCallbak == null || typeof onGetChatMessageCallbak != 'function') {
            return false;
        }
        return _self._messageManager.getChatMessages(baseId, count, messageTo, onGetChatMessageCallbak);
    };

    _proto.getQuestionnaireMessages = function(startId, count, sort, onGetQuestionnaireMessagesCallback) {
        var _self = this;
        return _self._messageManager.getQuestionnaireMessages(startId, count, sort, onGetQuestionnaireMessagesCallback);
    };

    _proto.sendVoteMessage = function(onSendVoteMessageCallback, msgto, itemId, optionItems) {
        var _self = this;
        return _self._messageManager.sendVoteMessage(onSendVoteMessageCallback, msgto, itemId, optionItems);
    };
    _proto.sendPublicMessage = function(messageBody, replyItemId, messageTitle="", callback=function(){}) {
        var _self = this;
        if (messageBody == null || typeof messageBody != 'string') {
            return false;
        }
        if (replyItemId == null || typeof replyItemId != 'string') {
            return false;
        }
        if (callback == null || typeof callback != 'function'){
            return false;
        }
        return _self._messageManager.sendPublicMessage(messageBody, replyItemId, messageTitle, callback);
    };
    _proto.getPublicMessages = function(startId, count, onGetPublicMessage) {
        var _self = this;
        if (startId == null || typeof startId != 'number' || startId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (onGetPublicMessage == null || typeof onGetPublicMessage != 'function') {
            return false;
        }
        return _self._messageManager.getPublicMessages(startId, count, onGetPublicMessage);
    };
    _proto.getMessage = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        return _self._messageManager.getMessage(itemId);
    };

    _proto.getAllMessage = function() {
        var _self = this;
        return _self._messageManager.getAllMessage();
    };

    _proto.getReplyReverseItemIds = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        return _self._messageManager.getReplyReverseItemIds(itemId);
    };
    _proto.getChildrenTaskItemIds = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        return _self._messageManager.getChildrenTaskItemIds(itemId);
    };
    _proto.onAddMessageView = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        return _self._messageManager.onAddMessageView(itemId);
    };
    _proto.onRemoveMessageView = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        return _self._messageManager.onRemoveMessageView(itemId);
    };
    _proto.onAddParentMessageRefarence = function(parentItemId) {
        var _self = this;
        return _self._messageManager.onAddParentMessageRefarence(parentItemId);
    };
    _proto.onRemoveParentMessageRefarence = function(parentItemId) {
        var _self = this;
        return _self._messageManager.onRemoveParentMessageRefarence(parentItemId);
    };
    _proto.onRemoveAllMessageView = function() {
        var _self = this;
        return _self._messageManager.onRemoveAllMessageView();
    };
    _proto.changePresence = function(presence, myMemo) {
        var _self = this;
        if (presence != null && typeof presence != 'string') {
            return false;
        }
        if (myMemo != null && typeof myMemo != 'string') {
            return false;
        }
        return _self._personManager.changePresence(presence, myMemo);
    };
    _proto.changeProfile = function(profile, onChangeProfileCallback) {
        var _self = this;
        if (profile == null || typeof profile != 'object') {
            return false;
        }
        if (onChangeProfileCallback != null && typeof onChangeProfileCallback != 'function') {
            return false;
        }
        return _self._personManager.changeProfile(profile, onChangeProfileCallback);
    };

    _proto.uploadAvatarIE = function(file, onUploadResultCallback) {
        var _postUrlPath = location.protocol + "//" + location.hostname;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') < 0) {
                _postUrlPath += _path + '/';
            } else {
                _postUrlPath += _path.substring(0, _lastPathDelimiterIndex + 1);
            }
        } else {
            _postUrlPath += _path;
        }
        var _uploadPhpFile = 'uploaduseravatar';
        _uploadPhpFile = _postUrlPath + _uploadPhpFile;

        try{
            $(file).upload(_uploadPhpFile, function(res){
                var _responseObject;
                if(res != null && res.result != null) {
                    _responseObject = res;
                } else {
                    _responseObject = {
                        result : "failed",
                        path : "",
                        filename : ""
                    };
                }
                onUploadResultCallback(_responseObject);
            }, 'json');
        }catch (e){
            var _resultObject = {
                result : "failed",
                path : "",
                filename : ""
            };
            onUploadResultCallback(_resultObject);
        }

        return true;
    }


    _proto.uploadCommunityLogo = function(_roomid, file, onUploadResultCallback) {
        var _self = this;
        if (file == null || typeof file != 'object') {
            return false;
        }
        if (onUploadResultCallback == null || typeof onUploadResultCallback != 'function') {
            return false;
        }

        var _accessToken = CubeeServerConnector.getInstance().getAccessToken();
        if (_accessToken == "") {
            return false;
        }

        var _account =  LoginUser.getInstance().getLoginAccount();
        if (_account == "") {
            return false;
        }

        var _postUrlPath = location.protocol + "//" + location.hostname;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') < 0) {
                _postUrlPath += _path + '/';
            } else {
                _postUrlPath += _path.substring(0, _lastPathDelimiterIndex + 1);
            }
        } else {
            _postUrlPath += _path;
        }
        var _uploadUrlPath = 'uploadcommunitylogo';
        _uploadUrlPath = _postUrlPath + _uploadUrlPath;

        function uploadProgress(event) {
            if (event.lengthComputable) {
            } else {
            }
        };

        function uploadComplete(event) {
            var status = event.target.status;
            if(status == 200) {
                var _response = event.target.responseText;
                var _responseObject = JSON.parse(_response);
                onUploadResultCallback(_responseObject);
            } else {
                console.log('error : upload failed');
                var _resultObject = {
                    result : "failed",
                    status : '' + event.target.status,
                    statusText : event.target.statusText
                };
                onUploadResultCallback(_resultObject);
            }
        };

        function uploadFailed(event) {
            console.log('error : upload failed');
            var _resultObject = {
                result : "failed",
                status : '' + event.target.status,
                statusText : event.target.statusText
            };
            onUploadResultCallback(_resultObject);
        };

        function uploadCanceled(event) {
            console.log('cancel : upload failed');
            var _resultObject = {
                result : "canceled"
            };
            onUploadResultCallback(_resultObject);
        };

        var fd = new FormData();
        fd.append("logofile", file);
        fd.append("accesstoken", _accessToken);
        fd.append("account", _account);
        fd.append("roomid", _roomid);

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", uploadProgress, false);
        xhr.addEventListener("load", uploadComplete, false);
        xhr.addEventListener("error", uploadFailed, false);
        xhr.addEventListener("abort", uploadCanceled, false);
        xhr.open("POST", _uploadUrlPath, true);
        xhr.send(fd);

        return true;
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
        return _self._personManager.changePassword(oldPassword, newPassword, onChangePasswordCallback);
    };
    _proto.searchMessage = function(startId, count, columnSearchCondition, onSearchMessageCallback) {
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
        if (onSearchMessageCallback == null || typeof onSearchMessageCallback != 'function') {
            return false;
        }
        return _self._messageManager.searchMessage(startId, count, columnSearchCondition, onSearchMessageCallback);
    };
    _proto.getMessageCount = function(condition, onGetMessageCountCallback) {
        var _self = this;
        if (condition == null || typeof condition != 'object') {
            return false;
        }
        if (onGetMessageCountCallback == null || typeof onGetMessageCountCallback != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().getMessageCount(condition, onGetMessageCountCallback);
    };
    _proto.onNotifyKeyOperation = function(isKeyOperation) {
        var _self = this;
        var _ret = false;
        if (isKeyOperation == null || typeof isKeyOperation != 'boolean') {
            return _ret;
        }
        var _presence = _self._personManager.decideSendPresence(isKeyOperation);
        _ret = _self.changePresence(_presence, null);
        if (_ret) {
            var _myMemo = LoginUser.getInstance().getMyMemo();

            MyPresenceView.getInstance().updateChangePresence(_presence, _myMemo);
            ColumnMessageView.updateMessageAvatarToolTip(LoginUser.getInstance().getJid());
        }
        return _ret;
    };
    _proto.clearPrePresence = function() {
        var _self = this;
        _self._personManager.clearPrePresence();
    };
    _proto.sendChatMessage = function(message, callback=function(){}) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return false;
        }
        if (callback == null || typeof callback != 'function') {
            return false;
        }
        return _self._messageManager.sendChatMessage(message, callback);
    };
    _proto.getPersonData = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        return _self._personManager.getPersonData(jid);
    };
    _proto.getPersonDataByLoginAccount = function(loginAccount) {
        var _self = this;
        if (loginAccount == null || typeof loginAccount != 'string') {
            return null;
        }
        return _self._personManager.getPersonDataByLoginAccount(loginAccount);
    };
    _proto.getContactListData = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        return _self._personManager.getContactListData(jid);
    };
    _proto.sendGoodJob = function(itemId, onSendGoodJobCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendGoodJobCallback == null || typeof onSendGoodJobCallback != 'function') {
            return false;
        }
        return _self._messageManager.sendGoodJob(itemId, onSendGoodJobCallback);
    };
    _proto.setNotificationChatMessage = function(jid, message) {
        var _self = this;
        _self._notificationManager.setChatMessageData(jid, message);
    };
    _proto.getNotificationChatMessageByJid = function(jid) {
        var _self = this;
        return _self._notificationManager.getChatMessageListByJid(jid);
    };
    _proto.removeNotificationChatMessageByJid = function(jid) {
        var _self = this;
        return _self._notificationManager.removeChatMessageListByJid(jid);
    };
    _proto.addQuestionnaire = function(questionnaireMessage, onAddQuestionnaireCallback) {
        var _self = this;
        if (questionnaireMessage == null || typeof questionnaireMessage != 'object') {
            return false;
        }
        if (onAddQuestionnaireCallback == null || typeof onAddQuestionnaireCallback != 'function') {
            return false;
        }
        return _self._messageManager.addQuestionnaire(questionnaireMessage, onAddQuestionnaireCallback);
    };
    _proto.addTask = function(taskMessage, onAddTaskCallback) {
        var _self = this;
        if (taskMessage == null || typeof taskMessage != 'object') {
            return false;
        }
        if (onAddTaskCallback == null || typeof onAddTaskCallback != 'function') {
            return false;
        }
        return _self._messageManager.addTask(taskMessage, onAddTaskCallback);
    };
    _proto.updateTask = function(taskMessage, onUpdateTaskCallback) {
        var _self = this;
        if (taskMessage == null || typeof taskMessage != 'object') {
            return false;
        }
        if (onUpdateTaskCallback == null || typeof onUpdateTaskCallback != 'function') {
            return false;
        }
        return _self._messageManager.updateTask(taskMessage, onUpdateTaskCallback);
    };
    _proto.sendDemandTask = function(itemId, onSendDemandTaskCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendDemandTaskCallback == null || typeof onSendDemandTaskCallback != 'function') {
            return false;
        }
        return _self._messageManager.sendDemandTask(itemId, onSendDemandTaskCallback);
    };
    _proto.sendClearDemandedTask = function(itemId, onSendClearDemandedTaskCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendClearDemandedTaskCallback == null || typeof onSendClearDemandedTaskCallback != 'function') {
            return false;
        }
        return _self._messageManager.sendClearDemandedTask(itemId, onSendClearDemandedTaskCallback);
    };
    _proto.sendGetExistingReaderList = function(itemId, onGetExistingReaderListCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetExistingReaderListCallback == null || typeof onGetExistingReaderListCallback != 'function') {
            return false;
        }
        return _self._messageManager.sendGetExistingReaderList(itemId, onGetExistingReaderListCallback);
    };
    _proto.sendSetReadOneMessage = function(itemId, onSendSetReadOneMessageCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendSetReadOneMessageCallback == null || typeof onSendSetReadOneMessageCallback != 'function') {
            return false;
        }
        return _self._messageManager.sendSetReadOneMessage(itemId, onSendSetReadOneMessageCallback);
    };
    _proto.deleteMessage = function(deleteMessage, deleteFlag, onDeleteMessageCallback) {
        var _self = this;
        if (deleteMessage == null || typeof deleteMessage != 'object') {
            return false;
        }
        if (deleteFlag == null || typeof deleteFlag != 'number') {
            return false;
        }
        if (onDeleteMessageCallback == null || typeof onDeleteMessageCallback != 'function') {
            return false;
        }
        return _self._messageManager.deleteMessage(deleteMessage, deleteFlag, onDeleteMessageCallback);
    };
    _proto.getRoomInfo = function(roomId, onGetGroupInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetGroupInfoCallback != null && typeof onGetGroupInfoCallback != 'function') {
            return false;
        }
        return _self._chatroomManager.getRoomInfo(roomId, onGetGroupInfoCallback);
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
        if (onGetGroupInfoListCallback != null && typeof onGetGroupInfoListCallback != 'function') {
            return false;
        }
        return _self._chatroomManager.getRoomInfoList(startId, count, communityList, sortCondition, onGetGroupInfoListCallback);
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
        if (onGetGroupInfoListCallback != null && typeof onGetGroupInfoListCallback != 'function') {
            return false;
        }
        return _self._chatroomManager.getPublicGroupRoomInfoList(startId, count, sortCondition, onGetGroupInfoListCallback);
    };


    _proto.createChatRoom = function(chatRoomInfo, onCreateChatRoomCallback) {
        var _self = this;
        var _chatRoomInfo = chatRoomInfo;
        if (chatRoomInfo == null || typeof chatRoomInfo != 'object') {
            return false;
        }
        if (onCreateChatRoomCallback == null || typeof onCreateChatRoomCallback != 'function') {
            return false;
        }

        return CubeeServerConnector.getInstance().createChatRoom(_chatRoomInfo, onCreateChatRoomCallback);
    };
    _proto.updateChatRoomInfo = function(chatRoomInfo, onUpdateChatRoomCallback) {
        var _self = this;
        if (chatRoomInfo == null || typeof chatRoomInfo != 'object') {
            return false;
        }
        if (onUpdateChatRoomCallback == null || typeof onUpdateChatRoomCallback != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().updateChatRoomInfo(chatRoomInfo, onUpdateChatRoomCallback);
    };
    _proto.sendGroupChatMessage = function(groupChatMessage, callback=function(){}) {
        var _self = this;
        if (groupChatMessage == null || typeof groupChatMessage != 'object') {
            return false;
        }
        if (callback == null || typeof callback != 'function') {
            return false;
        }
        return _self._messageManager.sendGroupChatMessage(groupChatMessage, callback);
    };
    _proto.getChatRoomInfoByRoomId = function(roomId) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return null;
        }
        return _self._chatroomManager.getChatRoomInfoByRoomId(roomId);
    };

    _proto.addGroupChatRoomMember = function(roomId, memberList, onAddMemberCallBack) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onAddMemberCallBack == null || typeof onAddMemberCallBack != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().addGroupChatRoomMember(roomId, memberList, onAddMemberCallBack);
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
        return _self._chatroomManager.removeChatRoomMember(roomId, memberList, removeType, onRemoveChatRoomMemberCallback);
    };
    _proto.removePublicChatRoomMember = function(roomId, onRemoveChatRoomMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onRemoveChatRoomMemberCallback == null || typeof onRemoveChatRoomMemberCallback != 'function') {
            return false;
        }
        return _self._chatroomManager.removePublicChatRoomMember(roomId, onRemoveChatRoomMemberCallback);
    };
    _proto.getServerList = function(onGetServerListCallBack) {
        var _self = this;
        if (onGetServerListCallBack != null && typeof onGetServerListCallBack != 'function') {
            return false;
        }
        return _self._mailServerManager.getServerInfoListFirst(onGetServerListCallBack);
    };
    _proto.getServerInfoById = function(id) {
        var _self = this;
        if (id != null && typeof id != 'number') {
            return null;
        }
        return _self._mailServerManager.getServerInfoById(id);
    }
    _proto.changeMailCooperationSetting = function(mailCooperationInfoList, onChangeMailCooperationSettingCallback) {
        var _self = this;
        if (mailCooperationInfoList == null || typeof mailCooperationInfoList != 'object') {
            return false;
        }
        if (onChangeMailCooperationSettingCallback != null && typeof onChangeMailCooperationSettingCallback != 'function') {
            return false;
        }
        return _self._personManager.changeMailCooperationSetting(mailCooperationInfoList, onChangeMailCooperationSettingCallback);
    };
    _proto.getMailBody = function(itemId, onGetMailBodyCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetMailBodyCallback != null && typeof onGetMailBodyCallback != 'function') {
            return false;
        }
        return _self._messageManager.getMailBody(itemId, onGetMailBodyCallback);
    };
    _proto.getThreadMessage = function(itemId, onGetThreadMessage) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetThreadMessage != null && typeof onGetThreadMessage != 'function') {
            return false;
        }
        return _self._messageManager.getThreadMessage(itemId, onGetThreadMessage);
    };
    _proto.createCommunity = function(communityInfo, onCreateCommunity) {
        var _self = this;
        var _communityInfo = communityInfo;
        if (communityInfo == null || typeof communityInfo != 'object') {
            return false;
        }
        if (onCreateCommunity != null && typeof onCreateCommunity != 'function') {
            return false;
        }
        return _self._communityManager.createCommunity(communityInfo, onCreateCommunity);
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
        return _self._communityManager.getJoinedCommunityInfoList(startId, count, sortCondition, onGetCommunityInfoListCallback);
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
        return _self._communityManager.getNoJoinedPublicCommunityInfoList(startId, count, sortCondition, onGetCommunityInfoListCallback);
    };
    _proto.getCommunityInfo = function(roomId, onGetCommunityInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetCommunityInfoCallback != null && typeof onGetCommunityInfoCallback != 'function') {
            return false;
        }
        return _self._communityManager.getCommunityInfo(roomId, onGetCommunityInfoCallback);
    };
    _proto.getCommunityMemberInfo = function(roomId, onGetCommunityMemberInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetCommunityMemberInfoCallback != null && typeof onGetCommunityMemberInfoCallback != 'function') {
            return false;
        }
        return _self._communityManager.getCommunityMemberInfo(roomId, onGetCommunityMemberInfoCallback);
    };
    _proto.getCachedCommunityMember = function(roomId, jid) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return null;
        }
        if (jid != null && typeof jid != 'string') {
            return null;
        }
        return _self._communityManager.getCachedCommunityMember(roomId, jid);
    };
    _proto.updateCommunity = function(communityInfo, onUpdateCommunityCallback) {
        var _self = this;
        if (communityInfo == null || typeof communityInfo != 'object') {
            return false;
        }
        if (onUpdateCommunityCallback != null && typeof onUpdateCommunityCallback != 'function') {
            return false;
        }
        return _self._communityManager.updateCommunity(communityInfo, onUpdateCommunityCallback);
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
        return _self._communityManager.addCommunityMember(roomId, memberList, onAddCommunityMemberCallback);
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
        return _self._communityManager.updateCommunityOwner(roomId, ownerList, onUpdateCommunityOwnerCallback);
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
        return _self._communityManager.removeCommunityMember(roomId, memberList, onRemoveCommunityMemberCallback);
    };
    _proto.removePublicCommunityMember = function(roomId, onRemoveCommunityMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onRemoveCommunityMemberCallback != null && typeof onRemoveCommunityMemberCallback != 'function') {
            return false;
        }
        return _self._communityManager.removePublicCommunityMember(roomId, onRemoveCommunityMemberCallback);
    };
    _proto.sendCommunityMessage = function(communityMessage, onSendCommunityMessageCallback) {
        var _self = this;
        if (communityMessage == null || typeof communityMessage != 'object') {
            return false;
        }
        if (onSendCommunityMessageCallback != null && typeof onSendCommunityMessageCallback != 'function') {
            return false;
        }
        return _self._messageManager.sendCommunityMessage(communityMessage, onSendCommunityMessageCallback);
    };
    _proto.sendMurmurMessage = function(murmurMessage, onSendMurmurMessageCallback) {
        var _self = this;
        if (murmurMessage == null || typeof murmurMessage != 'object') {
            return false;
        }
        if (onSendMurmurMessageCallback != null && typeof onSendMurmurMessageCallback != 'function') {
            return false;
        }
        return _self._messageManager.sendMurmurMessage(murmurMessage, onSendMurmurMessageCallback);
    };
    _proto.logout = function() {
        var _self = this;
        _self._loginManager.logout();
        _self._notifyDisconnected();
    };
    _proto._notifyDisconnected = function() {
        var _self = this;
        _self._loginManager.disconnected();
        _self._personManager.disconnected();
        _self._favoriteManager.disconnected();
        _self._messageManager.disconnected();
        _self._searchManager.disconnected();
        _self._notificationManager.disconnected();
        _self._communityManager.disconnected();
    };

    _proto.uploadFile = function(file, onUploadResultCallback, onUploadProgressCallback) {
        var _self = this;
        if (file == null || typeof file != 'object') {
            return false;
        }
        if (onUploadResultCallback == null || typeof onUploadResultCallback != 'function') {
            return false;
        }
        if (onUploadProgressCallback == null || typeof onUploadProgressCallback != 'function') {
            return false;
        }

        var _accessToken = CubeeServerConnector.getInstance().getAccessToken();
        if (_accessToken == "") {
            return false;
        }

        var _postUrlPath = location.protocol + "//" + location.hostname;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') < 0) {
                _postUrlPath += _path + '/';
            } else {
                _postUrlPath += _path.substring(0, _lastPathDelimiterIndex + 1);
            }
        } else {
            _postUrlPath += _path;
        }
        var _uploadFile = 'fileupload';
        _uploadFile = _postUrlPath + _uploadFile;

        function uploadProgress(event) {
            if (event.lengthComputable) {
                var percentComplete = Math.round(event.loaded * 100 / event.total);
                onUploadProgressCallback(percentComplete);
            } else {
                console.log('unable compute');
                onUploadProgressCallback(-1);
            }
        };

        function uploadComplete(event) {
            var status = event.target.status;
            if(status == 200) {
                var _response = event.target.responseText;
                var _responseObject = JSON.parse(_response);
                _responseObject.path = _postUrlPath + _responseObject.path;
                onUploadResultCallback(_responseObject);
            } else {
                console.log('error : upload failed');
                var _resultObject = {
                    result : "failed",
                    status : '' + event.target.status,
                    statusText : event.target.statusText
                };
                onUploadResultCallback(_resultObject);
            }
        };

        function uploadFailed(event) {
            console.log('error : upload failed');
            var _resultObject = {
                result : "failed",
                status : '' + event.target.status,
                statusText : event.target.statusText
            };
            onUploadResultCallback(_resultObject);
        };

        function uploadCanceled(event) {
            console.log('cancel : upload failed');
            var _resultObject = {
                result : "canceled"
            };
            onUploadResultCallback(_resultObject);
        };

        var fd = new FormData();
        fd.append("uploadfile", file);
        fd.append("accesstoken", _accessToken);

        var xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", uploadProgress, false);
        xhr.addEventListener("load", uploadComplete, false);
        xhr.addEventListener("error", uploadFailed, false);
        xhr.addEventListener("abort", uploadCanceled, false);
        xhr.open("POST", _uploadFile, true);
        xhr.send(fd);

        return false;
    };

    _proto.uploadFileIE = function(file, onUploadResultCallback) {

        if (file == null || typeof file != 'object') {
            return false;
        }
        if (onUploadResultCallback == null || typeof onUploadResultCallback != 'function') {
            return false;
        }
        var _accessToken = CubeeServerConnector.getInstance().getAccessToken();
        if (_accessToken == "") {
            return false;
        }

        var _postUrlPath = location.protocol + "//" + location.hostname;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') < 0) {
                _postUrlPath += _path + '/';
            } else {
                _postUrlPath += _path.substring(0, _lastPathDelimiterIndex + 1);
            }
        } else {
            _postUrlPath += _path;
        }
        var _uploadFile = 'fileupload';
        _uploadFile = _postUrlPath + _uploadFile;

        var data = {
            'accesstoken':_accessToken,
            'uploadfile':file
        };

        try{
            $(file).upload(_uploadFile, data, function(res){
                var _responseObject;
                if(res != null && res.result != null) {
                    _responseObject = res;
                    _responseObject.path = _postUrlPath + _responseObject.path;
                } else {
                    _responseObject = {
                        result : "failed"
                    };
                }
                onUploadResultCallback(_responseObject);
            }, 'json');
        }catch (e){
            var _resultObject = {
                result : "failed"
            };
            onUploadResultCallback(_resultObject);
        }

        return false;
    }

    _proto.downloadfile = function(url, itemId) {
        var _self = this;
        if (url == null || typeof url != 'string') {
            return false;
        }
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }

        var _postUrlPath = location.protocol + "//" + location.hostname;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') < 0) {
                _postUrlPath += _path + '/';
            } else {
                _postUrlPath += _path.substring(0, _lastPathDelimiterIndex + 1);
            }
        } else {
            _postUrlPath += _path;
        }
        var _downloadFile = 'filedownload';
        // The value assigned to _downloadFile here is unused.
        _downloadFile; // = _postUrlPath + _downloadFile;

        var _accessToken = CubeeServerConnector.getInstance().getAccessToken();
        if (_accessToken == "") {
            return false;
        }

        $('#df_accesstoken').val(_accessToken);
        $('#df_itemId').val(itemId);
        $('#df_downloadURL').val(url);
        $('#download_form').submit();

        return false;
    };

    _proto.downloadfileOpen = function(element) {
        var _self = this;
        var _image = $(element).children('img.image-thumbnail').eq(0);
        if (_image && _image.hasClass('image-thumbnail')) {
            var _src = _image.attr('src');
            var _title = _image.attr('title');
            if (_src && _title) {
                _self.setImageData(_title, _src)
                window.open("showImage.html", _title); 
            }
        }

        return false;
    };

    _proto.downloadThumbnailImage = function(url, itemId, element) {
        var _self = this;
        if (url == null || typeof url != 'string') {
            return;
        }
        if (itemId == null || typeof itemId != 'string') {
            return;
        }
        if (element == null) {
            return;
        }

        var _postUrlPath = location.protocol + "//" + location.hostname;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') < 0) {
                _postUrlPath += _path + '/';
            } else {
                _postUrlPath += _path.substring(0, _lastPathDelimiterIndex + 1);
            }
        } else {
            _postUrlPath += _path;
        }
        var _downloadFile = 'filedownload';
        _downloadFile = _postUrlPath + _downloadFile;

        var _accessToken = CubeeServerConnector.getInstance().getAccessToken();
        if (_accessToken == "") {
            return;
        }

        var data = 'accesstoken=' + _accessToken + '&'
                    + 'itemId=' + itemId + '&'
                    + 'downloadURL=' + encodeURIComponent(url);

        var xhr = new XMLHttpRequest();
        xhr.open("POST", _downloadFile, true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4 && xhr.status === 200) {
                var _response = xhr.response;
                if (_response) {
                    var file = new Blob([_response], {type: "image/jpeg"});
                    var url = window.URL || window.webkitURL;
                    var browser = window.navigator.userAgent.toLowerCase();
                    if (browser.indexOf('edge') == -1 &&
                        browser.indexOf('chrome') == -1 &&
                        browser.indexOf('safari') !== -1) {
                            element.attr('src', url.createObjectURL(file));
                    } else {
                        loadImage.parseMetaData(file, (data) => {
                            var options = {
                                canvas: true
                            };
                            if (data.exif) {
                                options.orientation = data.exif.get('Orientation');
                            }
                            loadImage(file, (canvas) => {
                                if(typeof canvas.toDataURL == 'function'){
                                    var dataUri = canvas.toDataURL('image/jpeg');
                                    element.attr('src', dataUri);
                                }
                            }, options);
                        });
                    }                    
                } else {
                    element.attr('src', 'images/add_attach_img_file.png')
                           .attr('style', 'margin-left: 2px; height: 20px; width: 20px; border: 0px;');
                }
            } else {
            }
        };
        xhr.responseType="arraybuffer";
        xhr.send(data);

        return;
    };

    _proto.openShortenUrl = function(url, itemId) {
        var _self = this;
        if (url == null || typeof url != 'string') {
            return false;
        }
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        var _accessToken = CubeeServerConnector.getInstance().getAccessToken();
        if (_accessToken == "") {
            return false;
        }
        $('#shorten_url_link').attr('action', url);
        $('#shorten_url_accesstoken').val(_accessToken);
        $('#shorten_url_itemId').val(itemId);
        $('#shorten_url_link').submit();

        return false;
    };

    _proto.getFollowList = function() {
        var _self = this;
        return _self._personManager.getFollowList();
    };
    _proto.getAccessToken = function() {
        return CubeeServerConnector.getInstance().getAccessToken();
    };
    _proto.isContactListMember = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        return _self._personManager.isContactListMember(jid);
    };

    _proto.addContactListMember = function(memberList, onAddContactListMemberCallback) {
        var _self = this;
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onAddContactListMemberCallback == null || typeof onAddContactListMemberCallback != 'function') {
            return false;
        }
        return _self._personManager.addContactListMember(memberList, onAddContactListMemberCallback);
    };
    _proto.removeContactListMember = function(memberList, onRemoveContactListMemberCallback) {
        var _self = this;
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onRemoveContactListMemberCallback == null || typeof onRemoveContactListMemberCallback != 'function') {
            return false;
        }
        return _self._personManager.removeContactListMember(memberList, onRemoveContactListMemberCallback);
    };
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
        return _self._personManager.searchPerson(startId, count, columnSearchCondition, onSearchPersonCallback);
    };
    _proto.getPersonDataByJidFromServer = function(jidList, onGetPersonDataCallback) {
        var _self = this;
        if(jidList == null){
            return false;
        }
        var _jidList = new ArrayList();
        if(typeof jidList == 'string'){
            _jidList.add(jidList);
        }else{
            _jidList = jidList;
        }
        if (typeof _jidList != 'object' || _jidList.getCount() <= 0) {
            return false;
        }
        if (onGetPersonDataCallback == null || typeof onGetPersonDataCallback != 'function') {
            return false;
        }
        return _self._personManager.getPersonDataByJidFromServer(_jidList, onGetPersonDataCallback);
    };
    _proto.getPersonDataByLoginAccountFromServer = function(accountList, onGetPersonDataCallback) {
        var _self = this;
        if(accountList == null){
            return false;
        }
        var _accountList = new ArrayList();
        if(typeof accountList == 'string'){
            _accountList.add(accountList);
        }else{
            _accountList = accountList;
        }
        if (typeof _accountList != 'object' || _accountList.getCount() <= 0) {
            return false;
        }
        if (onGetPersonDataCallback == null || typeof onGetPersonDataCallback != 'function') {
            return false;
        }
        return _self._personManager.getPersonDataByLoginAccountFromServer(_accountList, onGetPersonDataCallback);
    };

    _proto.getRights = function(userName) {
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._authorityManager.getRights(userName)
            .then(function(res){
                resolve(res);
            }).catch(function(err){
                reject(err);
            })
        })
    }

    _proto.getRoleAssignmentForUser = function(userName){
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._authorityManager.getRoleAssignmentForUser(userName)
            .then(function(res){
                resolve(res);
            }).catch(function(err){
                reject(err);
            })
        })
    }

    _proto.createPolicy = function(policy_id, policy_tid, translations){
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._authorityManager.createPolicy(policy_id, policy_tid, translations)
            .then(function(res){
                resolve(res);
            }).catch(function(err){
                reject(err);
            })
        })
    }

    _proto.createRight = function(policy_id, action, resource_id){
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._authorityManager.createRight(policy_id, action, resource_id)
            .then(function(res){
                resolve(res);
            }).catch(function(err){
                reject(err);
            })
        })
    }

    _proto.assignPolicyToUser = function(policy_id, users){
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._authorityManager.assignPolicyToUser(policy_id, users)
            .then(function(res){
                resolve(res);
            }).catch(function(err){
                reject(err);
            })
        })
    }

    _proto.getUserPoliciesByResource = function(resource_id){
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._authorityManager.getUserPoliciesByResource(resource_id)
            .then(function(res){
                resolve(res);
            }).catch(function(err){
                reject(err);
            })
        })
    }

    _proto.unassignPolicyFromUser = function(users, policy_id){
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._authorityManager.unassignPolicyFromUser(users, policy_id)
            .then(function(res){
                resolve(res);
            }).catch(function(err){
                reject(err);
            })
        })
    }

    _proto.updateThreadTitle = function(message, threadTitle) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (message == null || typeof message != 'object') {
                reject(false);
                return;
            }
            if (threadTitle == null || typeof threadTitle != 'string') {
                reject(false);
                return;
            }
            _self._messageManager.updateThreadTitle(message, threadTitle)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getThreadTitleList = function(_columnInfo) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!_columnInfo || typeof _columnInfo != 'object') {
                reject(false);
                return;
            }
            _self._messageManager.getThreadTitleList(_columnInfo)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.updateMessage = function(_editMessage, _messageObj) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!_editMessage || typeof _editMessage != 'string') {
                reject(false);
                return;
            }
            if (!_messageObj || typeof _messageObj != 'object') {
                reject(false);
                return;
            }
            _self._messageManager.updateMessage(_editMessage, _messageObj)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.sendQuoteMessage = function(_quoteMessageData) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!_quoteMessageData || typeof _quoteMessageData != 'object') {
                reject(false);
                return;
            }
            _self._messageManager.sendQuoteMessage(_quoteMessageData)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.sendEmotionPoint = function(itemId, emotionValue, onSendEmoteCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (emotionValue == null || typeof emotionValue != 'number') {
            return false;
        }
        if (onSendEmoteCallback == null || typeof onSendEmoteCallback != 'function') {
            return false;
        }
        return _self._messageManager.sendEmotionPoint(itemId, emotionValue, onSendEmoteCallback);
    };

    _proto.getGoodJobTotal = function(jid, dateFrom) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!jid || dateFrom == undefined  ||
                typeof jid != 'string' || typeof dateFrom != 'string') {
                reject(false);
                return;
            }
            _self._messageManager.getGoodJobTotal(jid, dateFrom)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getThanksPointsTotal = function(jid, dateFrom) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!jid || dateFrom == undefined  ||
                typeof jid != 'string' || typeof dateFrom != 'string') {
                reject(false);
                return;
            }
            _self._messageManager.getThanksPointsTotal(jid, dateFrom)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getGoodJobRanking = function(dateFrom, rankBottom, offset, limit) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!dateFrom  || typeof dateFrom != 'string') {
                reject(false);
                return;
            }
            if (typeof rankBottom != 'number' ||
                typeof offset != 'number' ||
                typeof limit != 'number') {
                reject(false);
                return;
            }
            _self._messageManager.getGoodJobRanking(dateFrom, rankBottom, offset, limit)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getThanksPointsRanking = function(dateFrom, rankBottom, offset, limit) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!dateFrom  || typeof dateFrom != 'string') {
                reject(false);
                return;
            }
            if (typeof rankBottom != 'number' ||
                typeof offset != 'number' ||
                typeof limit != 'number') {
                reject(false);
                return;
            }
            _self._messageManager.getThanksPointsRanking(dateFrom, rankBottom, offset, limit)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getMurmurTotal = function(jid, dateFrom) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!jid || dateFrom == undefined  ||
                typeof jid != 'string' || typeof dateFrom != 'string') {
                reject(false);
                return;
            }
            _self._messageManager.getMurmurTotal(jid, dateFrom)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getMurmurRanking = function(dateFrom, rankBottom, offset, limit) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!dateFrom  || typeof dateFrom != 'string') {
                reject(false);
                return;
            }
            if (typeof rankBottom != 'number' ||
                typeof offset != 'number' ||
                typeof limit != 'number') {
                reject(false);
                return;
            }
            _self._messageManager.getMurmurRanking(dateFrom, rankBottom, offset, limit)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getGroupList = function() {
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._personManager.getGroupList()
                 .then(function(res){
                     resolve(res);
                     return;
                 }).catch(function(err){
                     reject(err);
                     return;
                 })
        })
    }

    _proto.getFolloweeList = function(jid) {
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._personManager.getFolloweeList(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getFollowerList = function(jid) {
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._personManager.getFollowerList(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.getFollowInfo = function(jid) {
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._personManager.getFollowInfo(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.addUserFollow = function(jid) {
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._personManager.addUserFollow(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.delUserFollow = function(jid) {
        return new Promise((resolve, reject) => {
            var _self = this;
            _self._personManager.delUserFollow(jid)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

})();

$(window).on('ChangeKeyOparationOn', function(event) {
});
$(window).on('ChangeKeyOparationOFF', function(event) {
});
