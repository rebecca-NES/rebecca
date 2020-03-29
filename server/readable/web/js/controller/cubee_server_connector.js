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
function CubeeServerConnector() {
    this._serverConnector = null;
    this._xmppServerHostName = '';
    this._user = '';
    this._password = '';
    this._onConnectCallBack = null;
    this._onDisconnectCallBack = null;
    this._onErrorCallBack = null;
    this._onProfileChangedNotifyCallback = null;
    this._onMessageReceivedCallback = null;
    this._onNotificationCallback = null;
    this._onLoginWizardCallback = null;
    this._nickName = null;
    this._isLogined = false;
    this._callBacks = {};
    this._accessToken = '';
    this._loginTicket = '';
    this._jid = '';
    this._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_NO_LOGIN;
};

(function() {
    CubeeServerConnector._LOGIN_STATUS_TYPE_NO_LOGIN = 0;
    CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTING = 1;
    CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTED = 2;
    CubeeServerConnector._LOGIN_STATUS_TYPE_LOGINED = 3;
    var _cubeeServerConnector = new CubeeServerConnector();
    CubeeServerConnector.getInstance = function() {
        return _cubeeServerConnector;
    };
    var _proto = CubeeServerConnector.prototype;

    _proto.connect = function(host, port, tenant, user, password, onConnectCallBack, onDisconnectCallBack, onErrorCallBack, onProfileChangedNotifyCallback, onMessageReceivedCallback, onNotificationCallback, onLoginWizardCallback) {
        var _self = this;
        if (host == null || typeof host != 'string') {
            return false;
        }
        if (user == null || typeof user != 'string') {
            return false;
        }
        if (password == null || typeof password != 'string') {
            return false;
        }
        if (onConnectCallBack == null || typeof onConnectCallBack != 'function') {
            return false;
        }
        if (onDisconnectCallBack == null || typeof onDisconnectCallBack != 'function') {
            return false;
        }
        if (onErrorCallBack == null || typeof onErrorCallBack != 'function') {
            return false;
        }
        if (onProfileChangedNotifyCallback == null || typeof onProfileChangedNotifyCallback != 'function') {
            return false;
        }
        if (onMessageReceivedCallback == null || typeof onMessageReceivedCallback != 'function') {
            return false;
        }
        if (onNotificationCallback == null || typeof onNotificationCallback != 'function') {
            return false;
        }
        if (onLoginWizardCallback == null || typeof onLoginWizardCallback != 'function') {
            return false;
        }

        _self._user = user;
        _self._onConnectCallBack = onConnectCallBack;
        _self._onDisconnectCallBack = onDisconnectCallBack;
        _self._onErrorCallBack = onErrorCallBack;
        _self._onProfileChangedNotifyCallback = onProfileChangedNotifyCallback;
        _self._onMessageReceivedCallback = onMessageReceivedCallback;
        _self._onNotificationCallback = onNotificationCallback;
        _self._onLoginWizardCallback = onLoginWizardCallback;

        var _onConnectedCb = function() {
            _onConnected(_self, tenant, user, password);
        };
        var _onDisconnectedCb = function() {
            _onDisconnected(_self);
        };
        var _onErrorCb = function(err) {
            _onError(_self, err);
        };
        var _onReceivedCb = function(data) {
            _onReceived(_self, data);
        };

        var _ret = false;
        if(_self._serverConnector != null) {
            if(_self._loginStatus != CubeeServerConnector._LOGIN_STATUS_TYPE_NO_LOGIN) {
                _self.disconnect();
            }
            _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTING;
            setTimeout(function() {
                _onConnected(_self, tenant, user, password);
            }, 1);
            return true;
        } else {
            _self._serverConnector = new SocketIoConnector();
            _ret = _self._serverConnector.connect(host, port, _onConnectedCb, _onDisconnectedCb, _onErrorCb, _onReceivedCb);
            if(_ret) {
                _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTING;
            }
        }
        return _ret;
    };

    _proto.skipLoginConnect = function(host, port, accessToken, onConnectCallBack, onDisconnectCallBack, onErrorCallBack, onProfileChangedNotifyCallback, onMessageReceivedCallback, onNotificationCallback) {
        var _self = this;
        if (host == null || typeof host != 'string') {
            return false;
        }
        if (accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (onConnectCallBack == null || typeof onConnectCallBack != 'function') {
            return false;
        }
        if (onDisconnectCallBack == null || typeof onDisconnectCallBack != 'function') {
            return false;
        }
        if (onErrorCallBack == null || typeof onErrorCallBack != 'function') {
            return false;
        }
        if (onProfileChangedNotifyCallback == null || typeof onProfileChangedNotifyCallback != 'function') {
            return false;
        }
        if (onMessageReceivedCallback == null || typeof onMessageReceivedCallback != 'function') {
            return false;
        }
        if (onNotificationCallback == null || typeof onNotificationCallback != 'function') {
            return false;
        }

        _self._accessToken = accessToken;
        _self._onConnectCallBack = onConnectCallBack;
        _self._onDisconnectCallBack = onDisconnectCallBack;
        _self._onErrorCallBack = onErrorCallBack;
        _self._onProfileChangedNotifyCallback = onProfileChangedNotifyCallback;
        _self._onMessageReceivedCallback = onMessageReceivedCallback;
        _self._onNotificationCallback = onNotificationCallback;

        var _onConnectedCb = function() {
            _onSkipLoginConnected(_self);
        };
        var _onDisconnectedCb = function() {
            _onDisconnected(_self);
        };
        var _onErrorCb = function(err) {
            _onError(_self, err);
        };
        var _onReceivedCb = function(data) {
            _onReceived(_self, data);
        };

        var _ret = false;
        _self._serverConnector = new SocketIoConnector();
        _ret = _self._serverConnector.connect(host, port, _onConnectedCb, _onDisconnectedCb, _onErrorCb, _onReceivedCb);
        if(_ret) {
            _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTING;
        }
        return _ret;
    };

    _proto.disconnect = function() {
        var _self = this;
        if (_self._serverConnector != null) {
            if(_self._loginStatus == CubeeServerConnector._LOGIN_STATUS_TYPE_LOGINED) {
                var _api = ApiCubee.createLogoutRequest(_self._accessToken);
                var _apiStr = _api[0];
                if (_apiStr == null || _apiStr == '') {
                    return;
                }
                _sendMessage(_self, _apiStr);
            }
        } else {
            _cleanUp(_self);
        }
    };

    _proto.changePresence = function(presence, myMemo) {
        var _self = this;
        if (presence == null || typeof presence != 'number') {
            return false;
        }
        if (presence < Person.PRESENCE_STATUS_ONLINE || presence > Person.PRESENCE_STATUS_DO_NOT_DISTURB) {
            return false;
        }
        if (myMemo == null || typeof myMemo != 'string') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createChangePresenceRequest(_self._accessToken, presence, myMemo);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };

    _proto.sendChatMessage = function(message, callback) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return false;
        }
        if (callback == null || typeof callback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendChatMessageRequest(_self._accessToken, message);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        return _sendMessage(_self, _apiStr, _id, callback);
    };

    _proto.sendPublicMessage = function(message, callback) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return false;
        }
        if (callback == null || typeof callback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendPublicMessageRequest(_self._accessToken, message);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        return _sendMessage(_self, _apiStr, _id, callback);
    };

    _proto.getPublicMessages = function(startId, count, onGetPublicMessageCallbak) {
        var _self = this;
        if (startId == null || typeof startId != 'number' || startId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (onGetPublicMessageCallbak == null || typeof onGetPublicMessageCallbak != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetPublicMessageRequest(_self._accessToken, startId, count);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            var _history = null;
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onGetPublicMessageCallbak(_history);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                onGetPublicMessageCallbak(_history);
                return;
            }
            _history = new Array(_itemCount);
            for (var _i = 0; _i < _itemCount; _i++) {
                var _item = _items[_i];
                _history[_i] = {};
                _history[_i].id = Utils.getSafeNumberData(_item.id);
                _history[_i].itemId = Utils.getSafeStringData(_item.itemId);
                _history[_i].from = Utils.getSafeStringData(_item.from);
                _history[_i].to = Utils.getSafeStringData(_item.to);
                _history[_i].type = Utils.getSafeNumberData(_item.type);
                _history[_i].body = Utils.urldecode(Utils.getSafeStringData(_item.body));
                _history[_i].triggerAction = Utils.getSafeNumberData(_item.triggerAction);
                _history[_i].publishNode = Utils.getSafeStringData(_item.nodeName);
                _history[_i].date = Utils.getDate(Utils.getSafeStringData(_item.createdAt), Utils.STANDARD_DATE_FORMAT);
                _history[_i].updatedAt = (_item.updatedAt) ? Utils.getSafeStringData(
                    Date.create(_item.updatedAt).format(Utils.STANDARD_DATE_FORMAT)) : "";
                _history[_i].replyId = Utils.getSafeStringData(_item.replyId);
                _history[_i].replyTo = Utils.getSafeStringData(_item.replyTo);
                _history[_i].deleteFlag = Utils.getSafeNumberData(_item.deleteFlag);
                _history[_i].inputType = Utils.getSafeNumberData(_item.inputType);
                _history[_i].resultVisible = Utils.getSafeNumberData(_item.resultVisible);
                _history[_i].graphType = Utils.getSafeNumberData(_item.graphType);
                _history[_i].roomType = Utils.getSafeStringData(_item.roomType);
                _history[_i].roomId = Utils.getSafeNumberData(_item.roomId);
                _history[_i].startDate = Utils.getSafeStringData(_item.startDate);
                _history[_i].dueDate = Utils.getSafeStringData(_item.dueDate);
                _history[_i].optionCount = Utils.getSafeNumberData(_item.optionCount);
                var _optionItems = Utils.getSafeArrayData(_item.optionItems);
                var _optionCount = _optionItems.length;
                var _optionList = new ArrayList();
                for (var _j = 0; _j < _optionCount; _j++) {
                    var itemObject = new Object();
                    itemObject.optionId = _optionItems[_j].optionId;
                    itemObject.option = _optionItems[_j].option;
                    itemObject.optionValue = _optionItems[_j].optionValue;
                    _optionList.add(itemObject);
                }
                _history[_i].optionItems = _optionList;
                _history[_i].voteFlag = Utils.getSafeNumberData(_item.voteFlag);
                _history[_i].goodJob = new ArrayList();
                _history[_i].emotionPoint = new ArrayList();
                _history[_i].emotionPointIcons = {};
                _history[_i].threadTitle = Utils.urldecode(Utils.getSafeStringData(_item.threadTitle));
                _history[_i].threadRootId = Utils.getSafeStringData(_item.threadRootId);
                if(_item.noteCount && _item.noteItems.length) {
                    _history[_i].noteTitle = Utils.getSafeStringData(_item.noteItems[0].noteTitle);
                    _history[_i].noteUrl = Utils.getSafeStringData(_item.noteItems[0].noteUrl);
                } else {
                    _history[_i].noteTitle = '';
                    _history[_i].noteUrl = '';
                }
                _history[_i].bodyType = Utils.getSafeNumberData(_item.bodyType);
                var _goodJobItems = Utils.getSafeArrayData(_item.goodJobItems);
                var _goodJobCount = _goodJobItems.length;
                for (var _j = 0; _j < _goodJobCount; _j++) {
                    var _goodJobItem = _goodJobItems[_j];
                    if(!_goodJobItem.itemId){
                        _goodJobItem.itemId = _history[_i].itemId;
                    }
                    var _goodJobNotification = _createGoodJobNotification(_goodJobItem);
                    _history[_i].goodJob.add(_goodJobNotification);
                }
                var emotionIconsList = _item.emotionPointIcons ? _item.emotionPointIcons : {};
                if (Object.keys(emotionIconsList).length == 0) {
                    if (LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon) {
                        emotionIconsList = LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon;
                    }
                }
                for (var key in emotionIconsList) {
                    _history[_i].emotionPointIcons[key] = Utils.urldecode(emotionIconsList[key]);
                }
                var _emotionItems = Utils.getSafeArrayData(_item.emotionPointItems);
                var _emotionCount = _emotionItems.length;
                for (var _j=0; _j<_emotionCount; _j++)  {
                    var _emotionItem = _emotionItems[_j];
                    var _emotionData = _getEmotionPointFromEmotionItem(_emotionItem);
                    if (_emotionData == null) {
                        continue;
                    }
                    _history[_i].emotionPoint.add(_emotionData);
                }
                var _shortenUrlItems = Utils.getSafeArrayData(_item.shortenItems);
                var _shortenUrlCount = _shortenUrlItems.length;
                var _shortenUrlList = new ArrayList();

                for (var _j = 0; _j < _shortenUrlCount; _j++) {
                    var _shortenUrlItem = new ShortenURLInfo();
                    if (_shortenUrlItem == null) {
                        continue;
                    }
                    _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
                    _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
                    _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
                    _shortenUrlList.add(_shortenUrlItem);
                }

                _history[_i].shortenItems = _shortenUrlList;
                _history[_i].shortenUrlCount = _shortenUrlCount;
                var _readFlag = Utils.getSafeNumberData(_item.readFlg);
                _history[_i].readFlag = _readFlag;
                var _existingReaderInfo = _getExistingReaderItemFromMessageItem(_item);
                if(_existingReaderInfo != null){
                    _history[_i].existingReaderInfo = _existingReaderInfo;
                }
                _history[_i].profileMap = new StringMapedArrayList();
                var _personInfo = _item.personInfo;
                if(_personInfo){
                    for(var _jid in _personInfo){
                        var _profile = _createProfile(_personInfo[_jid]);
                        if(!_profile){
                            continue;
                        }
                        _history[_i].profileMap.add(_jid, _profile);
                    }
                }
            }
            onGetPublicMessageCallbak(_history);
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };

    _proto.sendGoodJob = function(itemId, onSendGoodJobCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendGoodJobCallback == null || typeof onSendGoodJobCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendGoodJobRequest(_self._accessToken, itemId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onSendGoodJobCallback(true);
            } else {
                onSendGoodJobCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };

    _proto.addQuestionnaire = function(questionnaireMessage, onAddQuestionnaireCallback) {
        var _self = this;
        if (questionnaireMessage == null || typeof questionnaireMessage != 'object') {
            return false;
        }
        if (onAddQuestionnaireCallback == null || typeof onAddQuestionnaireCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendQuestionnaireRequest(_self._accessToken, questionnaireMessage);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onAddQuestionnaireCallback(receiveObject);
            } else {
                onAddQuestionnaireCallback(receiveObject);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };

    _proto.addTask = function(taskMessage, onAddTaskCallback) {
        var _self = this;
        if (taskMessage == null || typeof taskMessage != 'object') {
            return false;
        }
        if (onAddTaskCallback == null || typeof onAddTaskCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendTaskRequest(_self._accessToken, taskMessage);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onAddTaskCallback(true);
            } else {
                onAddTaskCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };

    _proto.updateTask = function(taskMessage, onUpdateTaskCallback) {
        var _self = this;
        if (taskMessage == null || typeof taskMessage != 'object') {
            return false;
        }
        if (onUpdateTaskCallback == null || typeof onUpdateTaskCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createUpdateTaskRequest(_self._accessToken, taskMessage);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onUpdateTaskCallback(true);
            } else {
                onUpdateTaskCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };

    _proto.sendDemandTask = function(itemId, onSendDemandTaskCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendDemandTaskCallback == null || typeof onSendDemandTaskCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createDemandTaskRequest(_self._accessToken, itemId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onSendDemandTaskCallback(true);
            } else {
                onSendDemandTaskCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.sendClearDemandedTask = function(itemId, onSendClearDemandedTaskCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendClearDemandedTaskCallback == null || typeof onSendClearDemandedTaskCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createClearDemandTaskRequest(_self._accessToken, itemId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onSendClearDemandedTaskCallback(true);
            } else {
                onSendClearDemandedTaskCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.sendGetExistingReaderList = function(itemId, onGetExistingReaderListCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetExistingReaderListCallback == null || typeof onGetExistingReaderListCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetExistingReaderListRequest(_self._accessToken, itemId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            var _existingReaderInfo = null;
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                _existingReaderInfo = _getExistingReaderItemFromGetExistingReaderItem(receiveObject.content);
                onGetExistingReaderListCallback(_existingReaderInfo);
            } else {
                onGetExistingReaderListCallback(_existingReaderInfo);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.sendSetReadOneMessage = function(itemId, onSendSetReadOneMessageCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendSetReadOneMessageCallback == null || typeof onSendSetReadOneMessageCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _itemIdList = new ArrayList();
        _itemIdList.add(itemId);
        var _api = ApiCubee.createSetReadMessageRequest(_self._accessToken, _itemIdList);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            var _responceItemIdList = null;
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                _responceItemIdList = _getItemIdListFromSetReadOneMessageItem(receiveObject.content);
                onSendSetReadOneMessageCallback(_responceItemIdList);
            } else {
                onSendSetReadOneMessageCallback(_responceItemIdList);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createDeleteMessageRequest(_self._accessToken, deleteFlag, deleteMessage);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
              onDeleteMessageCallback(true);
            } else {
              onDeleteMessageCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetTaskListRequest(_self._accessToken, filter, sort, baseId, count);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            var _taskMessageDataList = new MessageDataList();
            var _childrenTaskMessageDataList = new MessageDataList();
            var _unfinishedTaskCount = 0;
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onGetTaskMessageCallbak(_taskMessageDataList, _unfinishedTaskCount, _childrenTaskMessageDataList);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                onGetTaskMessageCallbak(_taskMessageDataList, _unfinishedTaskCount, _childrenTaskMessageDataList);
                return;
            }
            for (var _i = 0; _i < _itemCount; _i++) {
                var _item = _items[_i];
                var _taskMessage = _getTaskMessageFromTaskItem(_item);
                _taskMessageDataList.add(_taskMessage);
            }

            if (_receiveContent.extras != null) {
                var _extras = _receiveContent.extras;
                _unfinishedTaskCount = Utils.getSafeNumberData(_extras.unfinishedTaskCount);
                var _childrenItems = Utils.getSafeArrayData(_extras.childrenItems);
                var _childrenItemCount = _childrenItems.length;
                for (var _i = 0; _i < _childrenItemCount; _i++) {
                    var _childrenItem = _childrenItems[_i];
                    var _childrenTaskMessage = _getTaskMessageFromTaskItem(_childrenItem);
                    _childrenTaskMessageDataList.add(_childrenTaskMessage);
                }
            }
            onGetTaskMessageCallbak(_taskMessageDataList, _unfinishedTaskCount, _childrenTaskMessageDataList);
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetChatMessageRequest(_self._accessToken, messageTo, baseId, count);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            var _chatMessageDataList = new MessageDataList();
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onGetChatMessageCallbak(_chatMessageDataList);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                onGetChatMessageCallbak(_chatMessageDataList);
                return;
            }
            for (var _i = 0; _i < _itemCount; _i++) {
                var _item = _items[_i];
                var _chatMessage = _getMessageFromMessageItem(_self, _item);
                _chatMessageDataList.add(_chatMessage);
            }
            onGetChatMessageCallbak(_chatMessageDataList);
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };

    _proto.getQuestionnaireMessages = function(startId, count, sort, onGetQuestionnaireMessageCallback) {
        var _self = this;
        if (startId == null || typeof startId != 'number' || startId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (sort == null || typeof sort != 'object') {
            return false;
        }
        if (onGetQuestionnaireMessageCallback == null || typeof onGetQuestionnaireMessageCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetQuestionnaireMessagesRequest(_self._accessToken, startId, count, sort);
        var _apiStr = _api[0];
        var _id = _api[1];
        var _callback = function(receiveObject) {
            var _questionnaireMessageDataList = new MessageDataList();
            if (!receiveObject || receiveObject.errorCode != 0 || !receiveObject.content || !receiveObject.content.result) {
                onGetQuestionnaireMessageCallback(_questionnaireMessageDataList);
                return false;
            }

            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            for (var _i = 0; _i < _itemCount; _i++) {
                var _item = _items[_i];
                var _questionnaireMessage = _getMessageFromMessageItem(_self, _item);
                _questionnaireMessageDataList.add(_questionnaireMessage);
            }

            onGetQuestionnaireMessageCallback(_questionnaireMessageDataList);
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };

    _proto.sendVoteMessage = function(onSendVoteMessageCallback, msgto, itemId, optionItems) {
        var _self = this;
        if (onSendVoteMessageCallback == null || typeof onSendVoteMessageCallback != 'function') {
            return false;
        }
        if (msgto == null || typeof msgto != 'string') {
            return false;
        }
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (optionItems == null || typeof optionItems!= 'object') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendVoteMessageRequest(_self._accessToken, msgto, itemId, optionItems);
        var _apiStr = _api[0];
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onSendVoteMessageCallback(true);
            } else {
                onSendVoteMessageCallback(false);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };

    _proto.changeProfile = function(profile, onChangeProfileCallback) {
        var _self = this;
        if (profile == null || typeof profile != 'object') {
            return false;
        }
        if (onChangeProfileCallback != null && typeof onChangeProfileCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        if (profile.getNickName() == null) {
            profile.setNickName('');
        }
        if (profile.getMailAddress() == null) {
            profile.setMailAddress('');
        }
        if (profile.getGroup() == null) {
            profile.setGroup([]);
        }
        var _avatarType = profile.getAvatarType();
        var _avatarData = profile.getAvatarData();
        if ((_avatarType == null || _avatarType == '') || (_avatarData == null || _avatarData == '')) {
            profile.setAvatarType('');
            profile.setAvatarData('');
        }
        var _apiStr = null;
        if (LoginUser.getInstance().isUpdatablePersonData()) {
            _api = ApiCubee.createChangeProfileRequest(_self._accessToken, profile);
        } else {
            _api = ApiCubee.createChangeProfileOnlyAvaterRequest(_self._accessToken, profile);
        }
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                LoginUser.getInstance().setMailAddress(profile.getMailAddress());
                var _group = profile.getGroup();
                if(_group.length <= 5){
                    for(var i = 0 ; i < _group.length ; i++){
                        _group[i] = Utils.urldecode(Utils.getSafeStringData(_group[i]));
                    }
                }
                LoginUser.getInstance().setGroup(_group);
                onChangeProfileCallback(true);
            } else {
                onChangeProfileCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createChangePasswordRequest(_self._accessToken, oldPassword, newPassword);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject == null || receiveObject.errorCode == null || receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == null) {
                onChangePasswordCallback(false, 1);
            } else if (receiveObject.content.result == true) {
                onChangePasswordCallback(true, 0);
            } else if (receiveObject.content.reason == null) {
                onChangePasswordCallback(false, 1);
            } else {
                onChangePasswordCallback(false, receiveObject.content.reason);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.searchMessage = function(startId, count, columnSearchCondition, onSearchMessageCallback) {
        var _self = this;
        if (startId == null || typeof startId != 'number') {
            return false;
        }
        if (count == null || typeof count != 'number') {
            return false;
        }
        if (columnSearchCondition != null && typeof columnSearchCondition != 'object') {
            return false;
        }
        if (onSearchMessageCallback != null && typeof onSearchMessageCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSearchMessageRequest(_self._accessToken, startId, count, columnSearchCondition);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            var _messageDataList = new MessageDataList();
            var _childrenMessageDataList = new MessageDataList();
            var _allItemCount = 0;
            var _resultMessageData = {};
            _resultMessageData.messageDataList = _messageDataList;
            _resultMessageData.childrenMessageDataList = _childrenMessageDataList;
            _resultMessageData.allItemCount = _allItemCount;
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onSearchMessageCallback(_resultMessageData);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _extras = _receiveContent.extras;
            if (_extras != null) {
                _allItemCount = Utils.getSafeNumberData(_extras.allItemCount);
                _resultMessageData.allItemCount = _allItemCount;
                var _childrenItems = Utils.getSafeArrayData(_extras.childrenItems);
                var _childrenItemCount = _childrenItems.length;
                for (var _i = 0; _i < _childrenItemCount; _i++) {
                    var _childrenItem = _childrenItems[_i];
                    var _childrenMessage = _getTaskMessageFromTaskItem(_childrenItem);
                    _childrenMessageDataList.add(_childrenMessage);
                }
            }
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                onSearchMessageCallback(_resultMessageData);
                return;
            }
            for (var _i = 0; _i < _itemCount; _i++) {
                var _item = _items[_i];
                var _message = _getMessageFromMessageItem(_self, _item);
                if (_message == null) {
                    continue;
                }
                _messageDataList.add(_message);
            }
            onSearchMessageCallback(_resultMessageData);
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.getMessageCount = function(condition, onGetMessageCountCallback) {
        var _self = this;
        if (condition != null && typeof condition != 'object') {
            return false;
        }
        if (onGetMessageCountCallback != null && typeof onGetMessageCountCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetCountRequest(_self._accessToken, ApiCubee.CONTENT_TYPE_MESSAGE, condition);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onGetMessageCountCallback(false, 0);
                return;
            }
            onGetMessageCountCallback(receiveObject.content.result, receiveObject.content.count);
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.getRoomInfo = function(roomId, onGetGroupInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetGroupInfoCallback != null && typeof onGetGroupInfoCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetRoomInfoRequest(_self._accessToken, roomId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            var _resultData = null;
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onGetGroupInfoCallback(_resultData);
                return;
            }
            var _receiveContent = receiveObject.content;

            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount != 1) {
                onGetGroupInfoCallback(_resultData);
                return;
            }
            _resultData = _getRoomInfoFromRoomInfoItem(_items[0]);
            onGetGroupInfoCallback(_resultData);
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };

    _proto.getRoomInfoList = function(startId, count, communityList, sortCondition, onGetGroupInfoListCallback) {
        var _self = this;
        if (startId == null || typeof startId != 'number') {
            return false;
        }
        if (count == null || typeof count != 'number') {
            return false;
        }
        if (communityList == null || typeof communityList != 'object') {
            return false;
        }
        if (sortCondition != null && typeof sortCondition != 'object') {
            return false;
        }
        if (onGetGroupInfoListCallback != null && typeof onGetGroupInfoListCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }

        var communityListCount= communityList.getCount();

        for(var i = 0; i < communityListCount; i++)
        {
            var parentRoomId = communityList.get(i).getRoomId();

            var _api = ApiCubee.createGetRoomInfoListRequest(_self._accessToken, startId, count, parentRoomId, sortCondition);
            var _apiStr = _api[0];
            if (_apiStr == null || _apiStr == '') {
                return false;
            }
            var _id = _api[1];
            var _callback = function(receiveObject) {
                var _chatroomList = new ChatRoomInfoList();
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    onGetGroupInfoListCallback(_chatroomList);
                }
                var _receiveContent = receiveObject.content;
                var _items = Utils.getSafeArrayData(_receiveContent.items);
                var _itemCount = _items.length;
                if (_itemCount <= 0) {
                    onGetGroupInfoListCallback(_chatroomList);
                }
                for (var _i = 0; _i < _itemCount; _i++) {
                    _chatroomList.add(_getRoomInfoFromRoomInfoItem(_items[_i]));
                }
                onGetGroupInfoListCallback(_chatroomList);
            };

            return _sendMessage(_self, _apiStr, _id, _callback);

        }

    };

    _proto.getPublicGroupRoomInfoList = function(startId, count, sortCondition, callBackFunc) {
        var _self = this;
        if (startId == null || typeof startId != 'number') {
            return false;
        }
        if (count == null || typeof count != 'number') {
            return false;
        }
        if (sortCondition != null && typeof sortCondition != 'object') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetPublicGroupRoomInfoListRequest(_self._accessToken, startId, count, sortCondition);
        if (_api[0] == null || _api[0] == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            var _chatroomList = new ChatRoomInfoList();
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                callBackFunc(receiveObject);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                callBackFunc(_chatroomList);
            }
            for (var _i = 0; _i < _itemCount; _i++) {
                _chatroomList.add(_getRoomInfoFromRoomInfoItem(_items[_i]));
            }
            callBackFunc(_chatroomList);
        };
        return _sendMessage(_self, _api[0], _id, _callback);
    };

    _proto.createChatRoom = function(chatRoomInfo, onCreateChatRoomCallback) {
        var _self = this;
        if (chatRoomInfo == null || typeof chatRoomInfo != 'object') {
            return false;
        }
        if (onCreateChatRoomCallback == null || typeof onCreateChatRoomCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createCreateChatRoomRequest(_self._accessToken, chatRoomInfo);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onCreateChatRoomCallback(receiveObject);
            } else {
                onCreateChatRoomCallback(receiveObject);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.sendGroupChatMessage = function(groupChatMessage, callback) {
        var _self = this;
        if (groupChatMessage == null || typeof groupChatMessage != 'object') {
            return false;
        }
        if (callback == null || typeof callback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendGroupChatMessageRequest(_self._accessToken, groupChatMessage);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        return _sendMessage(_self, _apiStr, _id, callback);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createAddGroupChatRoomMemberRequest(_self._accessToken, roomId, memberList);
        if(_api == null){
            return false;
        }
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            onAddMemberCallBack(receiveObject);
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.addPublicGroupChatRoomMember = function(roomId, onAddMemberCallBack) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onAddMemberCallBack == null || typeof onAddMemberCallBack != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createAddPublicGroupMemberRequest(_self._accessToken, roomId);
        if(_api == null){
            return false;
        }
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            onAddMemberCallBack(receiveObject);
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.updateChatRoomInfo = function(chatRoomInfo, onUpdateChatRoomInfoCallBack) {
        var _self = this;
        if (chatRoomInfo == null || typeof chatRoomInfo != 'object') {
            return false;
        }
        if (onUpdateChatRoomInfoCallBack == null || typeof onUpdateChatRoomInfoCallBack != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createUpdateChatRoomInfoRequest(_self._accessToken, chatRoomInfo);
        if(_api == null){
            return false;
        }
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.removeChatRoomMember = function(roomId, memberList, removeType, onRemoveChatRoomMemberCallBack) {
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
        if (onRemoveChatRoomMemberCallBack != null && typeof onRemoveChatRoomMemberCallBack != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createRemoveChatRoomMemberRequest(_self._accessToken, roomId, memberList, removeType);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onRemoveChatRoomMemberCallBack(receiveObject);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            if(_items.length <= 0 || !_items[0].members) {
                onRemoveCommunityMemberCallback(receiveObject);
                return;
            }
            var _sMemberItems = Utils.getSafeArrayData(_items[0].members.successMembers);
            var _fMemberItems = Utils.getSafeArrayData(_items[0].members.failureMembers);
            var _sMemberItemsCount = _sMemberItems.length;
            var _fMemberItemsCount = _fMemberItems.length;

            var _removedSuccessMemberList = new ArrayList();
            var _removedFailureMemberList = new ArrayList();
            for (var _i = 0; _i < _sMemberItemsCount; _i++) {
                _removedSuccessMemberList.add(_sMemberItems[_i]);
            }
            for (var _j = 0; _j < _fMemberItemsCount; _j++) {
                _removedFailureMemberList.add(_fMemberItems[_j]);
            }
            onRemoveChatRoomMemberCallBack({
                removedSuccessMemberList: _removedSuccessMemberList,
                removedFailureMemberList: _removedFailureMemberList
            });
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.removePublicChatRoomMember = function(roomId, onRemoveChatRoomMemberCallBack) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onRemoveChatRoomMemberCallBack != null && typeof onRemoveChatRoomMemberCallBack != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createDelPublicGroupMemberRequest(_self._accessToken, roomId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onRemoveChatRoomMemberCallBack(receiveObject);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            if(_items.length <= 0 || !_items[0].members) {
                onRemoveCommunityMemberCallback(receiveObject);
                return;
            }
            var _sMemberItems = Utils.getSafeArrayData(_items[0].members.successMembers);
            var _fMemberItems = Utils.getSafeArrayData(_items[0].members.failureMembers);
            var _sMemberItemsCount = _sMemberItems.length;
            var _fMemberItemsCount = _fMemberItems.length;

            var _removedSuccessMemberList = new ArrayList();
            var _removedFailureMemberList = new ArrayList();
            for (var _i = 0; _i < _sMemberItemsCount; _i++) {
                _removedSuccessMemberList.add(_sMemberItems[_i]);
            }
            for (var _j = 0; _j < _fMemberItemsCount; _j++) {
                _removedFailureMemberList.add(_fMemberItems[_j]);
            }
            onRemoveChatRoomMemberCallBack({
                removedSuccessMemberList: _removedSuccessMemberList,
                removedFailureMemberList: _removedFailureMemberList
            });
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.getServerList = function(onGetServerListCallBack) {
        var _self = this;
        if (onGetServerListCallBack != null && typeof onGetServerListCallBack != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetServerListRequest(_self._accessToken);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            var _severList = new MailServerInfoList();
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onGetServerListCallBack(_severList);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                onGetServerListCallBack(_severList);
                return;
            }
            for (var _i = 0; _i < _itemCount; _i++) {
                var _serverInfo = _getServerInfoFromServerInfoItem(_items[_i]);
                _severList.add(_serverInfo);
            }
            onGetServerListCallBack(_severList);
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.changeMailCooperationSetting = function(mailCooperationInfoList, onChangeMailCooperationSettingCallback) {
        var _self = this;
        if (mailCooperationInfoList == null || typeof mailCooperationInfoList != 'object') {
            return false;
        }
        if (onChangeMailCooperationSettingCallback != null && typeof onChangeMailCooperationSettingCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createChangeMailCooperationSettingRequest(_self._accessToken, mailCooperationInfoList);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onChangeMailCooperationSettingCallback(true);
            } else {
                onChangeMailCooperationSettingCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };
    _proto.getMailBody = function(itemId, onGetMailBodyCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetMailBodyCallback != null && typeof onGetMailBodyCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetMailBodyRequest(_self._accessToken, itemId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            var _resultData = null;
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onGetMailBodyCallback(_resultData);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount != 1) {
                onGetMailBodyCallback(_resultData);
                return;
            }
            _resultData = _getMailBodyInfoFromMailBodyInfoItem(_items[0]);
            onGetMailBodyCallback(_resultData);
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.getThreadMessage = function(itemId, onGetThreadMessage) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetThreadMessage != null && typeof onGetThreadMessage != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetThreadMessageRequest(_self._accessToken, itemId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            var _messageDataList = new MessageDataList();
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                onGetThreadMessage(_messageDataList);
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                onGetThreadMessage(_messageDataList);
                return;
            }
            for (var _i = 0; _i < _itemCount; _i++) {
                var _item = _items[_i];
                var _message = _getMessageFromMessageItem(_self, _item);
                if (_message == null) {
                    continue;
                }
                _messageDataList.add(_message);
            }
            onGetThreadMessage(_messageDataList);
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };

    _proto.createCommunity = function(communityInfo, onCreateCommunity) {
        var _self = this;
        if (communityInfo == null || typeof communityInfo != 'object') {
            return false;
        }
        if (onCreateCommunity != null && typeof onCreateCommunity != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createCreateCommunityRequest(_self._accessToken, communityInfo);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onCreateCommunity != null) {
                    onCreateCommunity(receiveObject);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                if(onCreateCommunity != null) {
                    onCreateCommunity(receiveObject);
                }
                return;
            }
            var _item = _items[0];
            var _communityInfo = _getCommunityInfoFromCommunityInfoItem(_item);
            if(onCreateCommunity != null) {
                onCreateCommunity(_communityInfo);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetJoinedCommunityInfoListRequest(_self._accessToken, startId, count, sortCondition);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onGetCommunityInfoListCallback != null) {
                    onGetCommunityInfoListCallback(null);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _communityInfoList = new CommunityList();
            var _itemCount = _items.length;
            for(var _i = 0; _i < _itemCount; _i++) {
                var _item = _items[_i];
                if(_item == null) {
                    continue;
                }
                var _communityInfo = _getCommunityInfoFromCommunityInfoItem(_item);
                if(_communityInfo == null) {
                    continue;
                }
                _communityInfoList.add(_communityInfo.getRoomId(), _communityInfo);
            };

            if(onGetCommunityInfoListCallback != null) {
                onGetCommunityInfoListCallback(_communityInfoList);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.getNotJoinedPublicCommunityInfoList = function(startId, count, sortCondition, onGetCommunityInfoListCallback) {
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetPublicCommunityRoomInfoListRequest(_self._accessToken, startId, count, sortCondition);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onGetCommunityInfoListCallback != null) {
                    onGetCommunityInfoListCallback(null);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _communityInfoList = new CommunityList();
            var _itemCount = _items.length;
            for(var _i = 0; _i < _itemCount; _i++) {
                var _item = _items[_i];
                if(_item == null) {
                    continue;
                }
                if(Array.isArray(_receiveContent.items[_i].memberItems) &&
                   _receiveContent.items[_i].memberItems
                                  .indexOf(_self._jid) >= 0){
                    continue;
                }
                var _communityInfo = _getCommunityInfoFromCommunityInfoItem(_item);
                if(_communityInfo == null) {
                    continue;
                }
                _communityInfoList.add(_communityInfo.getRoomId(), _communityInfo);
            };

            if(onGetCommunityInfoListCallback != null) {
                onGetCommunityInfoListCallback(_communityInfoList);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.getCommunityInfo = function(roomId, onGetCommunityInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetCommunityInfoCallback != null && typeof onGetCommunityInfoCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetCommunityInfoRequest(_self._accessToken, roomId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onGetCommunityInfoCallback != null) {
                    onGetCommunityInfoCallback(null);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onGetCommunityInfoCallback != null) {
                    onGetCommunityInfoCallback(null);
                }
                return;
            }
            var _item = _items[0];
            var _communityInfo = _getCommunityInfoFromCommunityInfoItem(_item);
            if(onGetCommunityInfoCallback != null) {
                onGetCommunityInfoCallback(_communityInfo);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };

    _proto.getCommunityMemberInfo = function(roomId, onGetCommunityMemberInfoCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onGetCommunityMemberInfoCallback != null && typeof onGetCommunityMemberInfoCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createGetCommunityMemberInfoRequest(_self._accessToken, roomId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onGetCommunityMemberInfoCallback != null) {
                    onGetCommunityMemberInfoCallback(null);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onGetCommunityMemberInfoCallback != null) {
                    onGetCommunityMemberInfoCallback(null);
                }
                return;
            }
            var _item = _items[0];
            var _communityInfo = _getCommunityMemberInfoFromCommunityMemberInfoItem(_item);

            if(onGetCommunityMemberInfoCallback != null) {
                onGetCommunityMemberInfoCallback(_communityInfo);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
     _proto.updateCommunity = function(communityInfo, onUpdateCommunityCallback) {
        var _self = this;
        if (communityInfo == null || typeof communityInfo != 'object') {
            return false;
        }
        if (onUpdateCommunityCallback != null && typeof onUpdateCommunityCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createUpdateCommunityRequest(_self._accessToken, communityInfo);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onUpdateCommunityCallback != null) {
                    onUpdateCommunityCallback(null, null);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _extras = _receiveContent.extras;
            var _preCommunityInfo = null;
            if(_extras != null) {
                var _preInfo = _extras.preInfo;
                if(_preInfo != null) {
                    _preCommunityInfo = _getCommunityInfoFromCommunityInfoItem(_preInfo);
                }
            }
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onUpdateCommunityCallback != null) {
                    onUpdateCommunityCallback(null, null);
                }
                return;
            }
            var _item = _items[0];
            var _communityInfo = _getCommunityInfoFromCommunityInfoItem(_item);
            if(_communityInfo != null && _preCommunityInfo != null) {
                _preCommunityInfo.setCreatedAt(_communityInfo.getCreatedAt());
                _preCommunityInfo.setCreatedBy(_communityInfo.getCreatedBy());
                _preCommunityInfo.setUpdatedAt(_communityInfo.getUpdatedAt());
                _preCommunityInfo.setUpdatedBy(_communityInfo.getUpdatedBy());
            }
            if(onUpdateCommunityCallback != null) {
                onUpdateCommunityCallback(_communityInfo, _preCommunityInfo);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createAddCommunityMemberRequest(_self._accessToken, roomId, memberList);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onAddCommunityMemberCallback != null) {
                    onAddCommunityMemberCallback(receiveObject);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onAddCommunityMemberCallback != null) {
                    onAddCommunityMemberCallback(receiveObject);
                }
                return;
            }
            var _item = _items[0];

            var _memberItems = Utils.getSafeArrayData(_item.members);
            var _memberItemsCount = _memberItems.length;
            var _addedMemberList = new CommunityMemberList();
            for (var _i = 0; _i < _memberItemsCount; _i++) {
                var _memberItem = _memberItems[_i];
                if (_memberItem == null) {
                    continue;
                }
                var _communityMember = _getCommunityMemberFromCommunityMemberItem(_memberItem);
                if(_communityMember == null) {
                    continue;
                }
                _addedMemberList.add(_communityMember);
            }
            if(onAddCommunityMemberCallback != null) {
                onAddCommunityMemberCallback(_addedMemberList);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.addPublicCommunityMember = function(roomId, onAddCommunityMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onAddCommunityMemberCallback != null && typeof onAddCommunityMemberCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createAddPublicCommunityMemberRequest(_self._accessToken, roomId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onAddCommunityMemberCallback != null) {
                    onAddCommunityMemberCallback(receiveObject);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onAddCommunityMemberCallback != null) {
                    onAddCommunityMemberCallback(receiveObject);
                }
                return;
            }
            var _item = _items[0];

            var _memberItems = Utils.getSafeArrayData(_item.members);
            var _memberItemsCount = _memberItems.length;
            var _addedMemberList = new CommunityMemberList();
            for (var _i = 0; _i < _memberItemsCount; _i++) {
                var _memberItem = _memberItems[_i];
                if (_memberItem == null) {
                    continue;
                }
                var _communityMember = _getCommunityMemberFromCommunityMemberItem(_memberItem);
                if(_communityMember == null) {
                    continue;
                }
                _addedMemberList.add(_communityMember);
            }
            if(onAddCommunityMemberCallback != null) {
                onAddCommunityMemberCallback(_addedMemberList);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createUpdateCommunityOwnerRequest(_self._accessToken, roomId, ownerList);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onUpdateCommunityOwnerCallback != null) {
                    onUpdateCommunityOwnerCallback(receiveObject, null);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _preOwnerList = new ArrayList();
            var _extras = _receiveContent.extras;
            if(_extras != null || _extras.preOwnerItems != null) {
                var _preOwnerItems = Utils.getSafeArrayData(_extras.preOwnerItems);
                for(var _i = 0; _i < _preOwnerItems.length; _i++) {
                    _preOwnerList.add(_preOwnerItems[_i]);
                }
            }
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            if(_items.length <= 0) {
                if(onUpdateCommunityOwnerCallback != null) {
                    onUpdateCommunityOwnerCallback(receiveObject, null);
                }
                return;
            }
            var _ownerList = new ArrayList();
            var _item = _items[0];
            var _ownerItems = Utils.getSafeArrayData(_item.ownerItems);
            for(var _i = 0; _i < _ownerItems.length; _i++) {
                _ownerList.add(_ownerItems[_i]);
            }

            if(onUpdateCommunityOwnerCallback != null) {
                onUpdateCommunityOwnerCallback(_ownerList, _preOwnerList);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createRemoveCommunityMemberRequest(_self._accessToken, roomId, memberList);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onRemoveCommunityMemberCallback != null) {
                    onRemoveCommunityMemberCallback(receiveObject);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onRemoveCommunityMemberCallback != null) {
                    onRemoveCommunityMemberCallback(receiveObject);
                }
                return;
            }
            var _item = _items[0];

            var _memberItems = Utils.getSafeArrayData(_item.members);
            var _memberItemsCount = _memberItems.length;
            var _removedMemberList = new ArrayList();
            for (var _i = 0; _i < _memberItemsCount; _i++) {
                _removedMemberList.add(_memberItems[_i]);
            }
            if(onRemoveCommunityMemberCallback != null) {
                onRemoveCommunityMemberCallback(_removedMemberList);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.removePublicCommunityMember = function(roomId, onRemoveCommunityMemberCallback) {
        var _self = this;
        if (roomId == null || typeof roomId != 'string') {
            return false;
        }
        if (onRemoveCommunityMemberCallback != null && typeof onRemoveCommunityMemberCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createDelPublicCommunityMemberRequest(_self._accessToken, roomId);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onRemoveCommunityMemberCallback != null) {
                    onRemoveCommunityMemberCallback(receiveObject);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onRemoveCommunityMemberCallback != null) {
                    onRemoveCommunityMemberCallback(receiveObject);
                }
                return;
            }
            var _item = _items[0];

            var _memberItems = Utils.getSafeArrayData(_item.members);
            var _memberItemsCount = _memberItems.length;
            var _removedMemberList = new ArrayList();
            for (var _i = 0; _i < _memberItemsCount; _i++) {
                _removedMemberList.add(_memberItems[_i]);
            }
            if(onRemoveCommunityMemberCallback != null) {
                onRemoveCommunityMemberCallback(_removedMemberList);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.sendCommunityMessage = function(communityMessage, onSendCommunityMessageCallback) {
        var _self = this;
        if (communityMessage == null || typeof communityMessage != 'object') {
            return false;
        }
        if (onSendCommunityMessageCallback != null && typeof onSendCommunityMessageCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendCommunityMessageRequest(_self._accessToken, communityMessage);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onSendCommunityMessageCallback != null) {
                    onSendCommunityMessageCallback(null, receiveObject);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onSendCommunityMessageCallback != null) {
                    onSendCommunityMessageCallback(null, receiveObject);
                }
                return;
            }
            var _item = _items[0];
            var _message = _getMessageFromMessageItem(_self, _item);
            if(onSendCommunityMessageCallback != null) {
                onSendCommunityMessageCallback(_message, receiveObject);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.sendMurmurMessage = function(murmurMessage, onSendMurmurMessageCallback) {
        var _self = this;
        if (murmurMessage == null || typeof murmurMessage != 'object') {
            return false;
        }
        if (onSendMurmurMessageCallback != null && typeof onSendMurmurMessageCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendMurmurMessageRequest(_self._accessToken, murmurMessage);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null) {
                if(onSendMurmurMessageCallback != null) {
                    onSendMurmurMessageCallback(null);
                }
                return;
            }
            var _receiveContent = receiveObject.content;
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if(_itemCount <= 0) {
                if(onSendMurmurMessageCallback != null) {
                    onSendMurmurMessageCallback(receiveObject);
                }
                return;
            }
            var _item = _items[0];
            var _message = _getMessageFromMessageItem(_self, _item);
            if(onSendMurmurMessageCallback != null) {
                onSendMurmurMessageCallback(receiveObject);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.getAccessToken = function() {
        return this._accessToken;
    };

    _proto.addContactListMember = function(memberList, onAddContactListMemberCallback) {
        var _self = this;
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onAddContactListMemberCallback != null && typeof onAddContactListMemberCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createAddContactListMemberRequest(_self._accessToken, memberList);

        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            var _relObj = _getItemsFromReceiveObject(receiveObject)
            if(!_relObj[0]){ 
                if(onAddContactListMemberCallback != null) {
                    onAddContactListMemberCallback(false, receiveObject.errorCode);
                }
                return;
            }
            var _items = _relObj[1];
            var _sMemberItems = Utils.getSafeArrayData(_items[0].members.successMembers);
            var _fMemberItems = Utils.getSafeArrayData(_items[0].members.failureMembers);
            var _sMemberItemsCount = _sMemberItems.length;
            var _fMemberItemsCount = _fMemberItems.length;

            var _sMemberList = new ArrayList();
            var _fMemberList = new ArrayList();
            for (var _i = 0; _i < _sMemberItemsCount; _i++) {
                var _item = new AddContactListMember();
                var _person = _getPersonDataFromResponseItem(_sMemberItems[_i]);
                if(_person == null){
                    continue;
                }
                _item.setPerson(_person);
                var _contactListGroupArray = Utils.getSafeArrayData(_sMemberItems[_i].contactListGroup);
                var _contactListGroupList = [];
                for(var _k = 0; _k < _contactListGroupArray.length; _k++){
                    _contactListGroupList.push(Utils.urldecode(_contactListGroupArray[_k]));
                }
                _item.setContactListGroup(_contactListGroupList);
                var _positionList = Utils.getSafeArrayData(_sMemberItems[_i].position);
                _item.setPosition(_positionList);
                _sMemberList.add(_item);
            }
            for (var _j = 0; _j < _fMemberItemsCount; _j++) {
                var _item = {
                    jid: _fMemberItems[_j].jid,
                    contactListGroup: _fMemberItems[_j].contactListGroup
                }
                _fMemberList.add(_item);
            }
            if(onAddContactListMemberCallback != null) {
                onAddContactListMemberCallback({
                    addSuccessMemberList: _sMemberList,
                    addFailureMemberList: _fMemberList
                }, null);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.removeContactListMember = function(memberList, onRemoveContactListMemberCallback) {
        var _self = this;
        if (memberList == null || typeof memberList != 'object') {
            return false;
        }
        if (onRemoveContactListMemberCallback != null && typeof onRemoveContactListMemberCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createRemoveContactListMemberRequest(_self._accessToken, memberList);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callback = function(receiveObject) {
            var _relObj = _getItemsFromReceiveObject(receiveObject)
            if(!_relObj[0]){ 
                if(onRemoveContactListMemberCallback != null) {
                    onRemoveContactListMemberCallback(false, receiveObject.errorCode);
                }
                return;
            }
            var _items = _relObj[1];
            var _sMemberItems = Utils.getSafeArrayData(_items[0].members.successMembers);
            var _fMemberItems = Utils.getSafeArrayData(_items[0].members.failureMembers);
            var _sMemberItemsCount = _sMemberItems.length;
            var _fMemberItemsCount = _fMemberItems.length;

            var _sMemberList = new ArrayList();
            var _fMemberList = new ArrayList();
            for (var _j = 0; _j < _sMemberItemsCount; _j++) {
                var _item = {
                    jid: _sMemberItems[_j].jid
                }
                _sMemberList.add(_item);
            }
            for (var _j = 0; _j < _fMemberItemsCount; _j++) {
                var _item = {
                    jid: _fMemberItems[_j].jid
                }
                _fMemberList.add(_item);
            }
            if(onRemoveContactListMemberCallback != null) {
                onRemoveContactListMemberCallback({
                    removeSuccessMemberList: _sMemberList,
                    removeFailureMemberList: _fMemberList
                }, null);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callback);
    };
    _proto.searchPerson = function(startId, count, columnSearchCondition, onSearchPersonCallback) {
        var _self = this;
        if (startId == null || typeof startId != 'number') {
            return false;
        }
        if (count == null || typeof count != 'number') {
            return false;
        }
        if (columnSearchCondition != null && typeof columnSearchCondition != 'object') {
            return false;
        }
        if (onSearchPersonCallback != null && typeof onSearchPersonCallback != 'function') {
            return false;
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSearchPersonRequest(_self._accessToken, startId, count, columnSearchCondition);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            var _searchResultPersonList = new SearchResultPersonList();
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                if(onSearchPersonCallback != null){
                    onSearchPersonCallback(_searchResultPersonList);
                }
                return;
            }
            var _receiveContent = receiveObject.content;

            var _extras = _receiveContent.extras;
            if (_extras != null) {
                var _allItemCount = Utils.getSafeNumberData(_extras.allItemCount);
                _searchResultPersonList.setAllItemCount(_allItemCount);
            }
            var _items = Utils.getSafeArrayData(_receiveContent.items);
            var _itemCount = _items.length;
            if (_itemCount <= 0) {
                if(onSearchPersonCallback != null){
                    onSearchPersonCallback(_searchResultPersonList);
                }
                return;
            }
            for (var _i = 0; _i < _itemCount; _i++) {
                var _person = _getPersonDataFromResponseItem(_items[_i]);
                if (_person == null) {
                    continue;
                }
                _searchResultPersonList.add(_person);
            }
            if(onSearchPersonCallback != null){
                onSearchPersonCallback(_searchResultPersonList);
            }
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };

    _proto.getRights = function(userName){
        var _self = this;
        var _apiStr = ApiCubee.getRights(_self._accessToken, userName);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                }else{
                    resolve(receiveObject);
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    };

    _proto.getRoleAssignmentForUser = function(userName){
        var _self = this;
        var _apiStr = ApiCubee.getRoleAssignmentForUser(_self._accessToken, userName);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                }else{
                    resolve(receiveObject);
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    };

    _proto.createPolicy = function(userName, policy_id, policy_tid, translations){
        var _self = this;
        var _apiStr = ApiCubee.createPolicy(_self._accessToken, userName, policy_id, policy_tid, translations);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                }else{
                    resolve(receiveObject);
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    };

    _proto.createRight = function(policy_id, action, resource_id){
        var _self = this;
        var _apiStr = ApiCubee.createRight(_self._accessToken, policy_id, action, resource_id);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                }else{
                    resolve(receiveObject);
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    };

    _proto.assignPolicyToUser = function(policy_id, users){
        var _self = this;
        var _apiStr = ApiCubee.assignPolicyToUser(_self._accessToken, policy_id, users);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                }else{
                    resolve(receiveObject);
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    };

    _proto.getUserPoliciesByResource = function(resource_id){
        var _self = this;
        var _apiStr = ApiCubee.getUserPoliciesByResource(_self._accessToken, resource_id);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                }else{
                    resolve(receiveObject);
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    };

    _proto.unassignPolicyFromUser = function(users, policy_id){
        var _self = this;
        var _apiStr = ApiCubee.unassignPolicyFromUser(_self._accessToken, users, policy_id);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                }else{
                    resolve(receiveObject);
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    };

    _proto.updateThreadTitle = function(message, threadTitle){
        var _self = this;
        var _apiStr = ApiCubee.updateThreadTitle(_self._accessToken, message, threadTitle);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getThreadTitleList = function(_columnInfo) {
        var _self = this;
        var _apiStr = ApiCubee.getThreadTitleList(_self._accessToken, _columnInfo);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.updateMessage = function(_editMessage, _messageObj) {
        var _self = this;
        var _apiStr = ApiCubee.updateMessage(_self._accessToken, _editMessage, _messageObj);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.sendQuoteMessage = function(_quoteMessageData) {
        var _self = this;
        var _apiStr = ApiCubee.sendQuoteMessage(_self._accessToken, _quoteMessageData);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
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
        if (_self._serverConnector == null) {
            return false;
        }
        if (_self._isLogined == false) {
            return false;
        }
        var _api = ApiCubee.createSendEmotionPointRequest(_self._accessToken, itemId, emotionValue);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            return false;
        }
        var _id = _api[1];
        var _callcack = function(receiveObject) {
            if (receiveObject.errorCode == 0 && receiveObject.content != null && receiveObject.content.result == true) {
                onSendEmoteCallback(true);
            } else {
                onSendEmoteCallback(false);
            }
            return;
        };
        return _sendMessage(_self, _apiStr, _id, _callcack);
    };

    _proto.getGoodJobTotal = function(jid, dateFrom) {
        var _self = this;
        var _apiStr = ApiCubee.getGoodJobTotal(_self._accessToken, jid, dateFrom);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getThanksPointsTotal = function(jid, dateFrom) {
        var _self = this;
        var _apiStr = ApiCubee.getThanksPointsTotal(_self._accessToken, jid, dateFrom);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getGoodJobRanking = function(dateFrom, rankBottom, offset, limit) {
        var _self = this;
        var _apiStr = ApiCubee.getGoodJobRanking(_self._accessToken, dateFrom, rankBottom, offset, limit);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getThanksPointsRanking = function(dateFrom, rankBottom, offset, limit) {
        var _self = this;
        var _apiStr = ApiCubee.getThanksPointsRanking(_self._accessToken, dateFrom, rankBottom, offset, limit);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getMurmurTotal = function(jid, dateFrom) {
        var _self = this;
        var _apiStr = ApiCubee.getMurmurTotal(_self._accessToken, jid, dateFrom);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getMurmurRanking = function(dateFrom, rankBottom, offset, limit) {
        var _self = this;
        var _apiStr = ApiCubee.getMurmurRanking(_self._accessToken, dateFrom, rankBottom, offset, limit);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getGroupList = function() {
        var _self = this;
        var _apiStr = ApiCubee.getGroupList(_self._accessToken);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getHashtagRanking = function(msgTo, dateFrom, dateTo, rankBottom, offset, limit) {
        let _self = this;
        let _apiStr = ApiCubee.getHashtagRanking(_self._accessToken, msgTo, dateFrom, dateTo, rankBottom, offset, limit);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getFolloweeList = function(jid) {
        let _self = this;
        let _apiStr = ApiCubee.getFolloweeList(_self._accessToken, jid);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    var _followeeList = new ArrayList();
                    var _followeeUser = receiveObject.content.items;
                    for (var i = 0 ; i < _followeeUser.length ; i++) {
                        var _person = new Person();
                        _person.setJid(Utils.getSafeStringData(_followeeUser[i].jid));
                        var _groupList = [];
                        var _groups = _followeeUser[i].group;
                        for(var j = 0 ; j < _groups.length ; j++) {
                            _groupList.push(Utils.urldecode(Utils.getSafeStringData(_groups[j])));
                        }
                        var _nickName = Utils.getSafeStringData(_followeeUser[i].nickName);
                        if (_nickName == '') {
                            _nickName = Utils.getSafeStringData(_followeeUser[i].name);
                        }
                        _nickName = Utils.urldecode(_nickName);
                        _person.setUserName(_nickName);
                        _person.setGroup(_groupList);
                        _person.setLoginAccount(Utils.urldecode(Utils.getSafeStringData(_followeeUser[i].name)));
                        _person.setAvatarData(Utils.getSafeStringData(_followeeUser[i].avatarData));
                        _person.setAvatarType(Utils.getSafeStringData(_followeeUser[i].avatarType));
                        _followeeList.insert(i, _person);
                    }
                    resolve(_followeeList);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getFollowerList = function(jid) {
        let _self = this;
        let _apiStr = ApiCubee.getFollowerList(_self._accessToken, jid);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    var _followerList = new ArrayList();
                    var _followerUser = receiveObject.content.items;
                    for (var i = 0 ; i < _followerUser.length ; i++) {
                        var _person = new Person();
                        _person.setJid(Utils.getSafeStringData(_followerUser[i].jid));
                        var _groupList = [];
                        var _groups = _followerUser[i].group;
                        for(var j = 0 ; j < _groups.length ; j++) {
                            _groupList.push(Utils.urldecode(Utils.getSafeStringData(_groups[j])));
                        }
                        var _nickName = Utils.getSafeStringData(_followerUser[i].nickName);
                        if (_nickName == '') {
                            _nickName = Utils.getSafeStringData(_followerUser[i].name);
                        }
                        _nickName = Utils.urldecode(_nickName);
                        _person.setUserName(_nickName);
                        _person.setGroup(_groupList);
                        _person.setLoginAccount(Utils.urldecode(Utils.getSafeStringData(_followerUser[i].name)));
                        _person.setAvatarData(Utils.getSafeStringData(_followerUser[i].avatarData));
                        _person.setAvatarType(Utils.getSafeStringData(_followerUser[i].avatarType));
                        _followerList.insert(i, _person);
                    }
                    resolve(_followerList);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getFollowInfo = function(jid) {
        var _self = this;
        var _apiStr = ApiCubee.getFollowInfo(_self._accessToken, jid);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.addUserFollow = function(jid) {
        var _self = this;
        var _apiStr = ApiCubee.addUserFollow(_self._accessToken, jid);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.delUserFollow = function(jid) {
        var _self = this;
        var _apiStr = ApiCubee.delUserFollow(_self._accessToken, jid);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.getMurmurColumnName = function(jid) {
        var _self = this;
        var _apiStr = ApiCubee.getMurmurColumnName(_self._accessToken, jid);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.setMurmurColumnName = function(jid, columnName) {
        var _self = this;
        var _apiStr = ApiCubee.setMurmurColumnName(_self._accessToken, jid, columnName);
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject){
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            };
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    _proto.setLoginUserExtras = function(extras) {
        var _self = this;
        return new Promise(function(resolve, reject){
            var _callback = function(receiveObject) {
                if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                    reject(receiveObject);
                    return;
                }else{
                    resolve(receiveObject);
                    return;
                }
            }
            if (!extras || typeof extras != "object") {
                reject(false);
            }
            var extrasString = "";
            if (extras) {
                try {
                    extrasString = JSON.stringify(extras);
                } catch (error) {
                    reject(false);
                }
            }
            for (key in extras) {
                if (key != "Logged" && key != "recentFilter" && key != "backgroundImage") {
                    reject(false);
                }
            }
            var _apiStr = ApiCubee.createChangeExtrasRequest(_self._accessToken, extrasString);
            _sendMessage(_self, _apiStr[0], _apiStr[1], _callback);
        })
    }

    function _cleanUp(_self) {
        if (_self._serverConnector != null) {
            delete _self._serverConnector;
        }
        _self._xmppServerHostName = '';
        _self._user = '';
        _self._password = '';
        _self._onConnectCallBack = null;
        _self._onDisconnectCallBack = null;
        _self._onErrorCallBack = null;
        _self._onProfileChangedNotifyCallback = null;
        _self._onMessageReceivedCallback = null;
        _self._onNotificationCallback = null;
        _self._onLoginWizardCallback = null;
        _self._nickName = null;
        _self._isLogined = false;
        _self._callBacks = {};
        _self._accessToken = '';
        _self._jid = '';
        _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_NO_LOGIN;

    };

    function _getContactListData(receiveObject) {
        var _receiveContent = receiveObject.content;
        var _items = Utils.getSafeArrayData(_receiveContent.items);
        var _conatactListItemCount = _items.length;
        var _contactList = new ContactList();
        for (var _i = 0; _i < _conatactListItemCount; _i++) {
            var _item = _items[_i];
            var _person = new Person();
            _person.setJid(Utils.getSafeStringData(_item.jid));
            var _nickName = Utils.getSafeStringData(_item.nickName);
            if (_nickName == '') {
                _nickName = Utils.getSafeStringData(_item.userName);
            }
            _nickName = Utils.urldecode(_nickName);
            _person.setUserName(_nickName);
            var _groups = Utils.getSafeArrayData(_item.groupItems);
            var _groupList = [];
            for(var j=0; j<_groups.length; j++){
                _groupList.push(Utils.urldecode(_groups[j]));
            }
            _person.setGroup(_groupList);
            _person.setPresence(Utils.getSafeNumberData(_item.presence));
            _person.setMyMemo(Utils.urldecode(Utils.getSafeStringData(_item.myMemo)));
            _person.setAvatarType(Utils.getSafeStringData(_item.avatarType));
            _person.setAvatarData(Utils.getSafeStringData(_item.avatarData));
            _person.setLoginAccount(Utils.getSafeStringData(_item.userName));
            _person.setStatus(Utils.getSafeNumberData(_item.status));
            _contactList.add(_person);
        }
        return _contactList;
    };

    function _getLoginUserInfo(_self, receiveContent) {
        var _loginUser = new LoginUser();
        var _userInfo = receiveContent.userInfo;
        if (_userInfo == null) {
            _onError(_self, 'LoginError');
        }
        _loginUser.setJid(_userInfo.jid);
        _self._jid = _loginUser.getJid();
        var _nickName = Utils.getSafeStringData(_userInfo.nickName);
        if (_nickName == '') {
            _nickName = Utils.getSafeStringData(_userInfo.name);
        }
        _nickName = Utils.urldecode(_nickName);
        _loginUser.setUserName(_nickName);
        _loginUser.setLoginAccount(_userInfo.name);
        var _mailAddress = Utils.getSafeStringData(_userInfo.mailAddress);
        _mailAddress = Utils.urldecode(_mailAddress);
        _loginUser.setMailAddress(_mailAddress);
        if (_userInfo.avatarType != null) {
            _loginUser.setAvatarType(_userInfo.avatarType);
        }
        if (_userInfo.avatarData != null) {
            _loginUser.setAvatarData(_userInfo.avatarData);
        }
        _loginUser.setLoginAccount(Utils.getSafeStringData(_userInfo.name));
        _loginUser.setStatus(Utils.getSafeNumberData(_userInfo.status));
        var _mailCooperationCount = Utils.getSafeNumberData(_userInfo.mailCooperationCount);
        var _mailCooperationItems = Utils.getSafeArrayData(_userInfo.mailCooperationItems);
        if (_mailCooperationItems == null) {
            _onError(_self, 'LoginError');
        }
        var _userSettings = new UserSettings();
        for (var _i = 0; _i < _mailCooperationCount; _i++) {
            var _mailCooperationInfo = new MailCooperationInformation();
            var _accountInfo = _mailCooperationItems[_i];
            _mailCooperationInfo.setId(Utils.getSafeNumberData(_accountInfo.id));
            _mailCooperationInfo.setServerId(Utils.getSafeNumberData(_accountInfo.serverId));
            _mailCooperationInfo.setJid(Utils.getSafeStringData(_accountInfo.jid));
            _mailCooperationInfo.setMailAddress(Utils.getSafeStringData(_accountInfo.mailAddress));
            _mailCooperationInfo.setBranchNumber(Utils.getSafeNumberData(_accountInfo.branchNumber));
            _mailCooperationInfo.setCooperationType(Utils.getSafeNumberData(_accountInfo.mailCooperationType));
            var _settingInfo = _accountInfo.settingInfo;
            if (_settingInfo == null) {
                _onError(_self, 'LoginError');
            }
            var _popServerInfo = _settingInfo.popServer;
            if (_popServerInfo != null) {
                var _userSettingInfo = new PopSettingInfomation();
                _userSettingInfo.setAccount(Utils.getSafeStringData(_popServerInfo.mailAccount));
                _userSettingInfo.setPassword(Utils.getSafeStringData(_popServerInfo.mailPassword));
                _mailCooperationInfo.setSettingInfo(_userSettingInfo);
            }
            _userSettings.getMailCooperationList().add(_mailCooperationInfo);
        }
        _loginUser.setTenantInfo(receiveContent.tenantInfo);
        _loginUser.setSettings(_userSettings);
        return _loginUser;
    }

    function _onConnected(_self, tenant, user, password) {

        if(_self._loginStatus != CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTING) {
            console.log('CubeeServerConnector - _onConnected - Maybe Reconnected');
            return;
        }
        _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTED;
        var _api = ApiCubee.createLoginRequest(tenant, user, password);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            _onError(_self, 'LoginError');
            return;
        }

        var _id = _api[1];
        var _connectReceiveData = new ConnectReceiveData();

        var isWizard = false;
        var _userInfo = null;


        function _onGetGroupList(receiveObject) {

            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                _onError(_self, 'GetChatGroupListError');
                return;
            }

            var _accessToken = receiveObject.accessToken;
            if (_accessToken == null) {
                _onError(_self, 'GetChatGroupListError');
                return;
            }

            var groupCount = receiveObject.content.items[0].groupCount;
            if(parseInt(groupCount) == 0) {
                var _contactList = new ContactList();
                _connectReceiveData.setContactList(_contactList);

                _self._onLoginWizardCallback(_connectReceiveData);

                return;
            }

            var _groupItems = receiveObject.content.items[0];
            var _groups = _groupItems.groupItems[0];
            var _groupName = Utils.getSafeStringData(_groups);
            _groupName = Utils.urldecode(_groupName);

            var _contactListApi = ApiCubee.createGetUserGroupRequest(_self._accessToken,_groupName,0,Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST'));
            var _contactListApiStr = _contactListApi[0];
            if (_contactListApiStr == null || _contactListApiStr == '') {
                _onError(_self, 'GetChatGroupListError');
                return;
            }
            var _contactListApiId = _contactListApi[1];
            setTimeout(function() {
                _sendMessage(_self, _contactListApiStr, _contactListApiId, _onGetChatUserList);
            }, 1);
        };

        function _onGetChatUserList(receiveObject) {

            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                _onError(_self, '_onGetChatUserList');
                return;
            }

            var _contactList = _getContactListData(receiveObject);
            _connectReceiveData.setContactList(_contactList);

            _self._isLogined = true;
            _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_LOGINED;
            _self._onLoginWizardCallback(_connectReceiveData);

        };

        function _onLoggedUserInfo(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                _onError(_self, 'LoggedUserInfoError');
                return;
            }

            var _accessToken = receiveObject.accessToken;
            if (_accessToken == null) {
                _onError(_self, 'LoggedUserInfoError');
                return;
            }

            var _extras = receiveObject.content.extras;
            if (_extras) {
                try {
                    _extras = JSON.parse(_extras);
                } catch (error) {
                    _extras = {};
                }
            }
            LoginUser.getInstance().setExtras(_extras);

            var _account = _connectReceiveData.getLoginUserPerson().getLoginAccount();

            var _contactListApi = ApiCubee.createGetUserGroupRequest(_self._accessToken, _account, 0, 1);
            var _contactListApiStr = _contactListApi[0];
            if (_contactListApiStr == null || _contactListApiStr == '') {
                _onError(_self, 'LoggedUserInfoError');
                return;
            }
            var _contactListApiId = _contactListApi[1];
            setTimeout(function() {
                _sendMessage(_self, _contactListApiStr, _contactListApiId, _onGetGroupList);
            }, 1);
        };

        function _onLoginUserDataCallback(receiveObject) {

            if (receiveObject.errorCode != 0 || receiveObject.content == null) {
                _onError(_self, 'GetLoginPersonData Error');
                return;
            }

            var _accessToken = receiveObject.content.accessToken;
            if (_accessToken == null) {
                _onError(_self, 'GetLoginPersonData Error');
                return;
            }

            var _receiveContent = receiveObject.content;
            if (_receiveContent.result == false) {
                _onError(_self, 'GetLoginPersonData Error');
                return;
            }

            _userInfo = _receiveContent.userInfo;
            if (_userInfo == null) {
                _onError(_self, 'GetLoginPersonData Error');
                return;
            }
            var _extras = receiveObject.content.userInfo.extras;
            if (_extras) {
                try {
                    _extras = JSON.parse(_extras);
                } catch (error) {
                    _extras = {};
                }
            }
            LoginUser.getInstance().setExtras(_extras);
            if (LoginTicket.read()) {
              ViewUtils.wizard_overlayClose();
            } else {
                if (_extras.Logged && _extras.Logged == 1) {
                     ViewUtils.wizard_overlayClose();
                }else{
                    isWizard = true;
                    LoginUser.getInstance().setFirstLogin();
                }
            }
            _onGetLoginUserInfo(receiveObject);
        };

        function _onSetLogged(accessToken, _userInfo) {
            var _changeloggedApi = ApiCubee.createChangeLoggedRequest(accessToken, _userInfo);
            var _changeloggedApiStr = _changeloggedApi[0];
            var _changeloggedApiId = _changeloggedApi[1];
            setTimeout(function() {
                _sendMessage(_self, _changeloggedApiStr, _changeloggedApiId, _onLoggedUserInfo);
            }, 1);
        }

        function _onGetContactList(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                _onError(_self, '_onGetContactListError');
                return;
            }

            var _contactList = _getContactListData(receiveObject);
            _connectReceiveData.setContactList(_contactList);
            _self._isLogined = true;
            _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_LOGINED;
            if(!_self._onConnectCallBack(_connectReceiveData)){
                return;
            }
            if (isWizard) {
                _onSetLogged(_self._accessToken, _userInfo);
            }
        };

        function _onGetFollowList(receiveObject){
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                _onError(_self, '_onGetFollowList 1');
                return;
            }
            var _accessToken = receiveObject.accessToken;
            if (_accessToken == null) {
                _onError(_self, '_onGetFollowList 2');
                return;
            }
            const myJid = _connectReceiveData.getLoginUserPerson().getJid();
            Promise.all([
                _self.getFolloweeList(myJid),
                _self.getFollowerList(myJid)
            ]).then((res)=>{
                if(res[0]){
                    LoginUser.getInstance().setFolloweeList(res[0])
                }
                if(res[1]){
                    LoginUser.getInstance().setFollowerList(res[1])
                }
                _onGetContactList(receiveObject)
            }).catch((e)=>{
                _onError(_self, '_onGetFollowList 3 ' + JSON.stringify(e));
                return;
            });
        }

        function _onGetLoginUserInfo(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null) {
                _onError(_self, '_onGetLoginUserInfo Error');
                return;
            }
            var _receiveContent = receiveObject.content;
            if (_receiveContent.result == false && _receiveContent.reason == 4) {
                _onError(_self, '_onGetLoginUserInfo Error');
                return;
            }
            var _contactListApi = ApiCubee.createGetContactListRequest(_self._accessToken);
            var _contactListApiStr = _contactListApi[0];
            if (_contactListApiStr == null || _contactListApiStr == '') {
                _onError(_self, '_onGetLoginUserInfo Error');
                return;
            }
            var _contactListApiId = _contactListApi[1];
            setTimeout(function() {
                _sendMessage(_self, _contactListApiStr, _contactListApiId, _onGetFollowList);
            }, 1);
        };


        function _onLoginCallback(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null) {
                _onError(_self, 'LoginError');
                return;
            }

            var _receiveContent = receiveObject.content;
            if (_receiveContent.result == false && _receiveContent.reason == 4) {
                _onError(_self, 'Not Authorized');
                return;
            }

            var _accessToken = receiveObject.content.accessToken;
            if (_accessToken == null) {
                _onError(_self, 'LoginError');
                return;
            }

            _self._isLogined = true;
            _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_LOGINED;

            _self._accessToken = _accessToken;
            var _loginUser = _getLoginUserInfo(_self, _receiveContent);
            _connectReceiveData.setLoginUserPerson(_loginUser);

            var _loginuserInfoApi = ApiCubee.createGetLoginUserInfoRequest(_self._accessToken);
            var _loginuserInfoApiStr = _loginuserInfoApi[0];
            if (_loginuserInfoApiStr == null || _loginuserInfoApiStr == '') {
                _onError(_self, 'LoginError');
                return;
            }
            var _loginuserInfoApiId = _loginuserInfoApi[1];
            setTimeout(function() {
                _sendMessage(_self, _loginuserInfoApiStr, _loginuserInfoApiId, _onLoginUserDataCallback);
            }, 1);

        };

        setTimeout(function() {
             _sendMessage(_self, _apiStr, _id, _onLoginCallback);
        }, 1);
    };

    function _onSkipLoginConnected(_self) {
        var _errCode = 0;
        if(_self._loginStatus != CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTING) {
            console.log('CubeeServerConnector - _onConnected - Maybe Reconnected');
            _onError(_self, 'SkipLoginError');
            return;
        }
        _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_CONNECTED;

        var _api = ApiCubee.createSwitchProtocolRequest(_self._accessToken);
        var _apiStr = _api[0];
        if (_apiStr == null || _apiStr == '') {
            _onError(_self, 'SkipLoginError');
            return;
        }
        var _id = _api[1];
        var _connectReceiveData = new ConnectReceiveData();

        function _onGetContactList(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
                _onError(_self, 'SkipLoginError');
                return;
            }
            var _contactList = _getContactListData(receiveObject);
            _connectReceiveData.setContactList(_contactList);
            _self._isLogined = true;
            _self._loginStatus = CubeeServerConnector._LOGIN_STATUS_TYPE_LOGINED;
            setTimeout(function() {
                _self._onConnectCallBack(_connectReceiveData);
            }, 1);
        };
        function _onGetLoginUserInfo(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null) {
                _onError(_self, 'SkipLoginError');
                return;
            }
            var _receiveContent = receiveObject.content;
            if (_receiveContent.result == false && _receiveContent.reason == 4) {
                _onError(_self, 'Not Authorized');
                return;
            }
            var _loginUser = _getLoginUserInfo(_self, _receiveContent);
            _connectReceiveData.setLoginUserPerson(_loginUser);
            var _contactListApi = ApiCubee.createGetContactListRequest(_self._accessToken);
            var _contactListApiStr = _contactListApi[0];
            if (_contactListApiStr == null || _contactListApiStr == '') {
                _onError(_self, 'SkipLoginError');
                return;
            }
            var _contactListApiId = _contactListApi[1];
            setTimeout(function() {
                _sendMessage(_self, _contactListApiStr, _contactListApiId, _onGetContactList);
            }, 1);
        };
        function _onProtocolSwitchCallback(receiveObject) {
            if (receiveObject.errorCode != 0 || receiveObject.content == null) {
                _onError(_self, 'Failed Switch Protocol');
                return;
            }
            var _receiveContent = receiveObject.content;
            if (_receiveContent.result == false && _receiveContent.reason == 4) {
                _onError(_self, 'Not Authorized');
                return;
            }
            var _loginUserInfoApi = ApiCubee.createGetLoginUserInfoRequest(_self._accessToken);
            var _loginUserInfoApiStr = _loginUserInfoApi[0];
            if (_loginUserInfoApiStr == null || _loginUserInfoApiStr == '') {
                _onError(_self, 'SkipLoginError');
                return;
            }
            var _loginUserInfoApiId = _loginUserInfoApi[1];
            setTimeout(function() {
                _sendMessage(_self, _loginUserInfoApiStr, _loginUserInfoApiId, _onGetLoginUserInfo);
            }, 1);
        };

        setTimeout(function() {
            _sendMessage(_self, _apiStr, _id, _onProtocolSwitchCallback);
        }, 1);
    };

    function _onChangePersonData(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_PRESENCE:
                _onPresenceReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_PROFILE:
                _onProfileChangeReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    };

    function _onPresenceReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _profile = new PresenceChangeNotice();
            _profile.setJid(Utils.getSafeStringData(_item.jid));
            _profile.setPresence(Utils.getSafeNumberData(_item.presence));
            var _myMemo = Utils.urldecode(Utils.getSafeStringData(_item.myMemo));

            _profile.setMyMemo(_myMemo);
            _onProfileChanged(_self, _profile);
        }
    };

    function _onProfileChangeReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _profileData = new Profile();
            var _nickName = Utils.urldecode(Utils.getSafeStringData(_item.nickName));
            _profileData.setNickName(_nickName);

            var _mailAddress = Utils.urldecode(Utils.getSafeStringData(_item.mailAddress));
            _profileData.setMailAddress(_mailAddress);

            _profileData.setAvatarType(Utils.getSafeStringData(_item.avatarType));
            _profileData.setAvatarData(Utils.getSafeStringData(_item.avatarData));

            if(_item.group.length <= 5){
                for(var i = 0 ; i < _item.group.length ; i++){
                    _item.group[i] = Utils.urldecode(Utils.getSafeStringData(_item.group[i]));
                }
            }
            _profileData.setGroup(_item.group);

            var _profileNotice = new ProfileChangeData();
            _profileNotice.setProfile(_profileData);
            _profileNotice.setJid(Utils.getSafeStringData(_item.jid));
            _profileNotice.setUpdateTime(Utils.getSafeStringData(_item.updateTime));
            _onProfileChanged(_self, _profileNotice);
        }
    };

    function _onProfileChanged(_self, profile) {
        _self._onProfileChangedNotifyCallback(profile);
    };

    function _onNotification(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_CHAT:
                _onChatNotificationReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    }

    function _onChatNotificationReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _message = new ChatMessage();
            _message.setFrom(Utils.getSafeStringData(_item.from));
            _message.setTo(Utils.getSafeStringData(_item.to));
            var _body = Utils.urldecode(Utils.getSafeStringData(_item.body));
            _message.setMessage(_body);
            _message.setDirection(ChatMessage.DIRECTION_RECEIVE);
            _message.setHistory(false);

            var _chatNotification = new ChatNotification();
            _chatNotification.setChatMessage(_message);
            _self._onNotificationCallback(_chatNotification);
        }
    };

    function _onMessage(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        var _subType = 0;
        if (_content.extras && _content.extras.subType) {
            _subType = _content.extras.subType;
            var array = [ApiCubee.CONTENT_TYPE_CHAT,
                ApiCubee.CONTENT_TYPE_PUBLIC,
                ApiCubee.CONTENT_TYPE_GROUP_CHAT,
                ApiCubee.CONTENT_TYPE_COMMUNITY,
                ApiCubee.CONTENT_TYPE_MURMUR];
            if (_content.type && array.includes(_content.type) &&
                _subType == MessageUpdateNotification.ACTION_TYPE_UPDATE) {
                    _onMessageChanged(_self, _content)
                    return;
                }
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_CHAT:
                _onChat(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_PUBLIC:
                _onPublicMessageReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_TASK:
                _onTaskMessageReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_SYSTEM:
                _onSystemMessageReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_DELETE:
                _onDeleteMessageReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_GROUP_CHAT:
                _onGroupChatMessageReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_MAIL:
                _onMailMessageReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_COMMUNITY:
                _onCommunityMessageReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_QUESTIONNAIRE:
                _onQuestionnaireMessageReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_MURMUR:
                _onMurmurMessageReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    };

    function _onChat(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _chatMessage = _getMessageFromMessageItem(_self, _item);
            _onMessageReceived(_self, _chatMessage);
        }
    };

    function _onPublicMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _publicMessage = _getMessageFromMessageItem(_self, _item);
            _onMessageReceived(_self, _publicMessage);
        }
    };

    function _onQuestionnaireMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        if (content.extras == null) {
            console.log('questionnaire message notify :: extras is null.');
            return;
        }

        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _questionnaireMessage = _getMessageFromMessageItem(_self, _item);

            var _questionnaireNotification = new QuestionnaireNotification();
            _questionnaireNotification.setQuestionnaireMessage(_questionnaireMessage);
            var _actionType = QuestionnaireNotification.ACTION_TYPE_ADD;
            var _jid = _questionnaireMessage.getFrom();
            for (var _j = 0; _j < _questionnaireMessage.getOptionCount(); _j++) {
                if (_questionnaireMessage.getOptionItems()._array[_j].optionValue > 0) {
                    _actionType = QuestionnaireNotification.ACTION_TYPE_UPDATE;
                    break;
                }
            }
            _questionnaireNotification.setActionType(_actionType);

            _self._onNotificationCallback(_questionnaireNotification);
        }
    }
    function _onTaskMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        if (content.extras == null) {
            console.log('task message notify :: extras is null.');
            return;
        }
        var _subType = Utils.getSafeNumberData(content.extras.subType);
        if (_subType == 0) {
            console.log('task message notify :: subType is 0.');
            return;
        }
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _taskMessage = _getMessageFromMessageItem(_self, _item);
            var _taskNotification = new TaskNotification();
            _taskNotification.setTaskMessage(_taskMessage);
            switch(_subType) {
                case 1:
                    _taskNotification.setActionType(TaskNotification.ACTION_TYPE_ADD);
                    break;
                case 2:
                    _taskNotification.setActionType(TaskNotification.ACTION_TYPE_UPDATE);
                    break;
                default:
                    console.log('task message notify :: subType is invalid.');
                    return;
            }
            _self._onNotificationCallback(_taskNotification);
        }
    };

    function _onSystemMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _systemMessage = _getMessageFromMessageItem(_self, _item);
            var _systemNotification = new SystemNotification();
            _systemNotification.setSystemMessage(_systemMessage);
            _self._onNotificationCallback(_systemNotification);
        }
    };

    function _onDeleteMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];

            var _itemId = _getItemIdFromdeleteMessageItem(_item);
            var _deleteFlag = _getDeleteFlagFromdeleteMessageItem(_item);
            var _adminDeleted = _getAdminDeletedFromdeleteMessageItem(_item);
            var _deleteMessageNotification = new DeleteMessageNotification();
            _deleteMessageNotification.setItemId(_itemId);
            _deleteMessageNotification.setDeleteFlag(_deleteFlag);
            _deleteMessageNotification.setAdminDeleted(_adminDeleted);

            _self._onNotificationCallback(_deleteMessageNotification);
        }
    };
    function _onGroupChatMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _groupChatMessage = _getMessageFromMessageItem(_self, _item);
            var _roomInfo = new ChatRoomInformation();
            _roomInfo.setRoomId(_groupChatMessage.getTo());
            _roomInfo.setParentRoomId(_groupChatMessage.getParentRoomId());
            _roomInfo.setRoomName(_groupChatMessage.getRoomName());
            var _messageNotification = new GroupChatMessageNotification();
            _messageNotification.setRoomInfo(_roomInfo);
            _messageNotification.setGroupChatMessage(_groupChatMessage);
            _self._onNotificationCallback(_messageNotification);
        }
    };
    function _onMailMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _mailMessage = _getMessageFromMessageItem(_self, _item);
            var _mailNotification = new MailMessageNotification();
            _mailNotification.setMailMessage(_mailMessage);
            _self._onNotificationCallback(_mailNotification);
        }
    };
    function _onCommunityMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _communityMessage = _getMessageFromMessageItem(_self, _item);
            var _messageNotification = new CommunityMessageNotification();
            _messageNotification.setCommunityMessage(_communityMessage);
            _self._onNotificationCallback(_messageNotification);
        }
    };
    function _onMurmurMessageReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _murmurMessage = _getMessageFromMessageItem(_self, _item);
            var _messageNotification = new MurmurMessageNotification();
            _messageNotification.setMurmurMessage(_murmurMessage);
            _self._onNotificationCallback(_messageNotification);
        }
    };
    function _onMessageReceived(_self, message) {
        _self._onMessageReceivedCallback(message);
    };
    function _getMessageFromMessageItem(_self, messageItem) {
        if (messageItem == null) {
            return null;
        }
        var _type = messageItem.type;
        var _message = null;
        switch(_type) {
            case Message.TYPE_PUBLIC:
                _message = _getPublicMessageFromPublicMessageItem(messageItem);
                break;
            case Message.TYPE_CHAT:
                _message = _getChatMessageFromChatItem(_self, messageItem);
                break;
            case Message.TYPE_GROUP_CHAT:
                _message = _getGroupChatMessageFromGroupChatItem(_self, messageItem);
                break;
            case Message.TYPE_TASK:
                _message = _getTaskMessageFromTaskItem(messageItem);
                break;
            case Message.TYPE_COMMUNITY:
                _message = _getCommunityMessageFromCommunityMessageItem(_self, messageItem);
                break;
            case Message.TYPE_SYSTEM:
                _message = _getSystemMessageFromSystemMessageItem(messageItem);
                break;
            case Message.TYPE_MAIL:
                _message = _getMailMessageFromMailItem(messageItem);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                _message = _getQuestionnaireMessageFromQuestionnaireItem(messageItem);
                break;
            case Message.TYPE_MURMUR:
                _message = _getMurmurMessageFromMurmurMessageItem(_self, messageItem);
                break;
            default:
                console.log('ColumnView::_getHistoryMessage … Unknown type>>>' + _type);
                break;
        }
        _message = _setMessageReadInfoFromMessageItem(_message, messageItem);
        _message = _setMessagePersonInfoFromMessageItem(_message, messageItem);
        return _message;
    };

    function _setMessageReadInfoFromMessageItem(message, messageItem){
        if(message == null || typeof message != 'object'){
            return null;
        }
        if(messageItem == null || typeof messageItem != 'object'){
            return null;
        }
        var _message = message;
        var _readFlg = Utils.getSafeNumberData(messageItem.readFlg);
        _message.setReadFlag(_readFlg);
        var _existingReaderInfo = _getExistingReaderItemFromMessageItem(messageItem);
        if(_existingReaderInfo != null){
            _message.setExistingReaderInfo(_existingReaderInfo);
        }
        return _message;
    }

    function _setMessagePersonInfoFromMessageItem(message, messageItem){
        if(message == null || typeof message != 'object'){
            return message;
        }
        if(messageItem == null || typeof messageItem != 'object'){
            return message;
        }
        var _personInfo = messageItem.personInfo;
        if(!_personInfo && typeof _personInfo != 'object'){
            return message;
        }
        for (var _jid in _personInfo){
            var _info = _personInfo[_jid];
            if(!_info){
                continue;
            }
            var _profile = _createProfile(_info);
            if(!_profile){
                continue;
            }
            message.getProfileMap().add(_jid, _profile);
        }
        return message;
    }
    function _createProfile(profileObj){
        if(!profileObj || typeof profileObj != 'object'){
            return null;
        }
        var _profile = new Profile();
        _profile.setNickName(Utils.urldecode(Utils.getSafeStringData(profileObj.nickName)));
        _profile.setMailAddress(Utils.urldecode(Utils.getSafeStringData(profileObj.mailAddress)));
        _profile.setAvatarType(Utils.getSafeStringData(profileObj.avatarType));
        _profile.setAvatarData(Utils.getSafeStringData(profileObj.avatarData));
        _profile.setLoginAccount(Utils.getSafeStringData(profileObj.userName));
        _profile.setStatus(Utils.getSafeNumberData(profileObj.status));
        return _profile;
    }
    function _getPublicMessageFromPublicMessageItem(publicMessageItem) {
        var _publicMessage = new PublicMessage();
        _publicMessage.setId(Utils.getSafeNumberData(publicMessageItem.id));
        _publicMessage.setFrom(Utils.getSafeStringData(publicMessageItem.from));
        _publicMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(publicMessageItem.body)));
        _publicMessage.setDate(Utils.getDate(Utils.getSafeStringData(publicMessageItem.createdAt), Utils.STANDARD_DATE_FORMAT));
        _publicMessage.setUpdatedAt((publicMessageItem.updatedAt) ? Utils.getSafeStringData(
            Date.create(publicMessageItem.updatedAt).format(Utils.STANDARD_DATE_FORMAT)) : "");
        _publicMessage.setItemId(Utils.getSafeStringData(publicMessageItem.itemId));
        _publicMessage.setPublishNode(Utils.getSafeStringData(publicMessageItem.nodeName));
        _publicMessage.setReplyItemId(Utils.getSafeStringData(publicMessageItem.replyId));
        _publicMessage.setReplyTo(Utils.getSafeStringData(publicMessageItem.replyTo));
        _publicMessage.setDeleteFlag(Utils.getSafeNumberData(publicMessageItem.deleteFlag));
        _publicMessage.setThreadTitle(Utils.urldecode(Utils.getSafeStringData(publicMessageItem.threadTitle)));
        _publicMessage.setThreadRootId(Utils.getSafeStringData(publicMessageItem.threadRootId));
        if (publicMessageItem.noteCount && publicMessageItem.noteItems.length) {
            _publicMessage.setNoteTitle(Utils.urldecode(Utils.getSafeStringData(publicMessageItem.noteItems[0].noteTitle)));
            _publicMessage.setNoteUrl(Utils.getSafeStringData(publicMessageItem.noteItems[0].noteUrl));
        }
        _publicMessage.setBodyType(Utils.getSafeNumberData(publicMessageItem.bodyType));
        var _goodJobItems = Utils.getSafeArrayData(publicMessageItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _publicMessage.getGoodJobList().add(_goodJobData);
        }
        var IconsList = {};
        var emotionIconsList = publicMessageItem.emotionPointIcons ? publicMessageItem.emotionPointIcons : {};
        if (Object.keys(emotionIconsList).length == 0) {
            if (LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon) {
                emotionIconsList = LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon;
            }
        }
        for (var key in emotionIconsList) {
            IconsList[key] = Utils.urldecode(emotionIconsList[key]);
        }
        _publicMessage.setEmotionIconList(IconsList);
        var _emotionItems = Utils.getSafeArrayData(publicMessageItem.emotionPointItems);
        var _emotionCount = _emotionItems.length;
        for (var _j=0; _j<_emotionCount; _j++)  {
            var _emotionItem = _emotionItems[_j];
            var _emotionData = _getEmotionPointFromEmotionItem(_emotionItem);
            if (_emotionData == null) {
                continue;
            }
            _publicMessage.getEmotionPointList().add(_emotionData);
        }
        var _shortenUrlItems = Utils.getSafeArrayData(publicMessageItem.shortenItems);
        var _shortenUrlCount = _shortenUrlItems.length;
        var _shortenUrlList = new ArrayList();

        for (var _j = 0; _j < _shortenUrlCount; _j++) {
            var _shortenUrlItem = new ShortenURLInfo();
            if (_shortenUrlItem == null) {
                continue;
            }
            _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
            _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
            _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
            _shortenUrlList.add(_shortenUrlItem);
        }
        _publicMessage.setUIShortenUrls(_shortenUrlList);

        return _publicMessage;
    };
    function _getQuestionnaireMessageFromQuestionnaireItem(questionnaireItem) {
        var _questionnaireMessage = new QuestionnaireMessage();
        _questionnaireMessage.setId(Utils.getSafeNumberData(questionnaireItem.id));
        _questionnaireMessage.setItemId(Utils.getSafeStringData(questionnaireItem.itemId));
        _questionnaireMessage.setFrom(Utils.getSafeStringData(questionnaireItem.from));
        _questionnaireMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(questionnaireItem.body)));
        _questionnaireMessage.setInputType(Utils.getSafeNumberData(questionnaireItem.inputType));
        _questionnaireMessage.setResultVisible(Utils.getSafeNumberData(questionnaireItem.resultVisible));
        _questionnaireMessage.setGraphType(Utils.getSafeNumberData(questionnaireItem.graphType));
        _questionnaireMessage.setRoomType(Utils.getSafeStringData(questionnaireItem.roomType));
        _questionnaireMessage.setRoomId(Utils.getSafeStringData(questionnaireItem.roomId));
        _questionnaireMessage.setRoomName(Utils.urldecode(Utils.getSafeStringData(questionnaireItem.roomName)));
        _questionnaireMessage.setParentRoomId(Utils.getSafeStringData(questionnaireItem.parentRoomId));
        _questionnaireMessage.setDate(questionnaireItem.createdAt);
        _questionnaireMessage.setVoteFlag(!!questionnaireItem.voteFlag);
        _questionnaireMessage.setStartDate(questionnaireItem.startDate);
        _questionnaireMessage.setDueDate(questionnaireItem.dueDate);
        _questionnaireMessage.setOptionCount(Utils.getSafeNumberData(questionnaireItem.optionCount));
        var itemArray = new ArrayList();
        for (var i = 0; i < questionnaireItem.optionCount; i++) {
            var item = questionnaireItem.optionItems[i];
            var itemStr = Utils.urldecode(Utils.getSafeStringData(item.option));
            var itemObject = new Object();
            itemObject.option = itemStr;
            itemObject.optionId = item.optionId;
            itemObject.optionValue = item.optionValue;
            itemArray.add(itemObject);
        }
        _questionnaireMessage.setOptionItems(itemArray);

        _questionnaireMessage.setDeleteFlag(Utils.getSafeNumberData(questionnaireItem.deleteFlag));
        if (Utils.getSafeStringData(questionnaireItem.startDate) != '') {
            _questionnaireMessage.setStartDate(new Date(Utils.getSafeStringData(questionnaireItem.startDate)));
        }
        if (Utils.getSafeStringData(questionnaireItem.dueDate) != '') {
            _questionnaireMessage.setDueDate(new Date(Utils.getSafeStringData(questionnaireItem.dueDate)));
        }
        var _goodJobItems = Utils.getSafeArrayData(questionnaireItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _questionnaireMessage.getGoodJobList().add(_goodJobData);
        }

        _setMessagePersonInfoFromMessageItem(_questionnaireMessage, questionnaireItem);
        return _questionnaireMessage;
    };
    function _getTaskMessageFromTaskItem(taskItem) {
        var _taskMessage = new TaskMessage();
        _taskMessage.setId(Utils.getSafeNumberData(taskItem.id));
        _taskMessage.setItemId(Utils.getSafeStringData(taskItem.itemId));
        _taskMessage.setFrom(Utils.getSafeStringData(taskItem.from));
        _taskMessage.setTitle(Utils.urldecode(Utils.getSafeStringData(taskItem.title)));
        _taskMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(taskItem.body)));
        _taskMessage.setProgress(Utils.getSafeNumberData(taskItem.progress));
        _taskMessage.setSpentTime(Utils.getSafeNumberData(taskItem.spentTime));
        _taskMessage.setEstimatedTime(Utils.getSafeNumberData(taskItem.estimatedTime));
        _taskMessage.setRemainingTime(Utils.getSafeNumberData(taskItem.remainingTime));
        _taskMessage.setGoal(Utils.urldecode(Utils.getSafeStringData(taskItem.goal)));
        _taskMessage.setAlert(Utils.getSafeNumberData(taskItem.alert));
        _taskMessage.setParentItemId(Utils.getSafeStringData(taskItem.parentItemId));
        _taskMessage.setPriority(Utils.getSafeNumberData(taskItem.priority));
        _taskMessage.setDate(Utils.getSafeStringData(taskItem.createdAt));
        _taskMessage.setReferenceMessageItemId(Utils.getSafeStringData(taskItem.replyId));
        _taskMessage.setReplyTo(Utils.getSafeStringData(taskItem.replyTo));
        _taskMessage.setDeleteFlag(Utils.getSafeNumberData(taskItem.deleteFlag));
        if (Utils.getSafeStringData(taskItem.startDate) != '') {
            _taskMessage.setStartDate(new Date(Utils.getSafeStringData(taskItem.startDate)));
        }
        if (Utils.getSafeStringData(taskItem.dueDate) != '') {
            _taskMessage.setDueDate(new Date(Utils.getSafeStringData(taskItem.dueDate)));
        }
        if (Utils.getSafeStringData(taskItem.completeDate) != '') {
            _taskMessage.setCompleteDate(new Date(Utils.getSafeStringData(taskItem.completeDate)));
        }
        _taskMessage.setOwnerJid(Utils.getSafeStringData(taskItem.owner));
        _taskMessage.setCommunityId(Utils.getSafeStringData(taskItem.group));
        _taskMessage.setCommunityName(Utils.urldecode(Utils.getSafeStringData(taskItem.groupName)));
        _taskMessage.setClient(Utils.getSafeStringData(taskItem.client));
        _taskMessage.setStatus(Utils.getSafeNumberData(taskItem.status));
        if (Utils.getSafeStringData(taskItem.updatedAt) != '') {
            _taskMessage.setUpdatedAt(new Date(Utils.getSafeStringData(taskItem.updatedAt)));
        }
        _taskMessage.setUpdatedBy(Utils.getSafeStringData(taskItem.updatedBy));
        var _goodJobItems = Utils.getSafeArrayData(taskItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _taskMessage.getGoodJobList().add(_goodJobData);
        }

        var _shortenUrlItems = Utils.getSafeArrayData(taskItem.shortenItems);
        var _shortenUrlCount = _shortenUrlItems.length;
        var _shortenUrlList = new ArrayList();

        for (var _j = 0; _j < _shortenUrlCount; _j++) {
            var _shortenUrlItem = new ShortenURLInfo();
            if (_shortenUrlItem == null) {
                continue;
            }
            _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
            _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
            _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
            _shortenUrlList.add(_shortenUrlItem);
        }
        _taskMessage.setUIShortenUrls(_shortenUrlList);

        var _noteItems = Utils.getSafeArrayData(taskItem.noteItems);
        var _noteCount = _noteItems.length;
        for (var _i = 0; _i < _noteCount; _i++) {
            var _noteItem = _noteItems[_i];
            var _noteJid = Utils.getSafeStringData(_noteItem.senderJid);
            var _noteDate = Utils.getSafeStringData(_noteItem.date);
            var _noteBody = Utils.urldecode(Utils.getSafeStringData(_noteItem.body));
            var _noteDataObj = new TaskNoteData();
            _noteDataObj.setJid(_noteJid);
            if (_noteDate != '') {
                _noteDataObj.setDate(new Date(_noteDate));
            }
            _noteDataObj.setMessage(Utils.urldecode(_noteBody));
            _taskMessage.getNoteArray().add(_noteDataObj);
        }
        var _reminderItems = Utils.getSafeArrayData(taskItem.reminderItems);
        var _reminderCount = _reminderItems.length;
        for (var _i = 0; _i < _reminderCount; _i++) {
            var _reminderItem = _reminderItems[_i];
        }
        var _siblingItems = Utils.getSafeArrayData(taskItem.siblingItems);
        var _siblingCount = _siblingItems.length;
        for (var _i = 0; _i < _siblingCount; _i++) {
            var _siblingItem = _siblingItems[_i];
            var _siblingItemId = Utils.getSafeStringData(_siblingItem.siblingItemId);
            var _siblingOwnerJid = Utils.getSafeStringData(_siblingItem.ownerJid);
            var _siblingTaskStatus = Utils.getSafeNumberData(_siblingItem.status);
            var _nickName = Utils.urldecode(Utils.getSafeStringData(_siblingItem.nickName));
            var _avatarType = Utils.getSafeStringData(_siblingItem.avatarType);
            var _avatarData = Utils.getSafeStringData(_siblingItem.avatarData);
            var _loginAccount= Utils.getSafeStringData(_siblingItem.userName);
            var _userStatus = Utils.getSafeNumberData(_siblingItem.userStatus);
            var _siblingTaskDataObj = new SiblingTaskData();
            _siblingTaskDataObj.setItemId(_taskMessage.getItemId());
            _siblingTaskDataObj.setSiblingItemId(_siblingItemId);
            _siblingTaskDataObj.setSiblingOwnerJid(_siblingOwnerJid);
            _siblingTaskDataObj.setSiblingTaskStatus(_siblingTaskStatus);
            _siblingTaskDataObj.setNickName(_nickName);
            _siblingTaskDataObj.setAvatarType(_avatarType);
            _siblingTaskDataObj.setAvatarData(_avatarData);
            _siblingTaskDataObj.setLoginAccount(_loginAccount);
            _siblingTaskDataObj.setStatus(_userStatus);
            _taskMessage.getSiblingTaskDataList().add(_siblingTaskDataObj);
        }
        if (_taskMessage.getClient() == '') {
            _taskMessage.setClient(_taskMessage.getOwnerJid());
        }
        _taskMessage.setDemandStatus(Utils.getSafeNumberData(taskItem.demandStatus));
        if (Utils.getSafeStringData(taskItem.demandDate) != '') {
            _taskMessage.setCompleteDate(new Date(Utils.getSafeStringData(taskItem.demandDate)));
        }

        if (taskItem.quotation != null && Object.keys(taskItem.quotation).length) {
            _taskMessage.setQuotationItem(getQuotationItemFromMessage(taskItem.quotation));
        }

        _setMessagePersonInfoFromMessageItem(_taskMessage, taskItem);
        return _taskMessage;
    };

    function _getChatMessageFromChatItem(_self, chatItem) {
        var _chatMessage = new ChatMessage();
        _chatMessage.setId(Utils.getSafeNumberData(chatItem.id));
        _chatMessage.setItemId(Utils.getSafeStringData(chatItem.itemId));
        _chatMessage.setFrom(Utils.getSafeStringData(chatItem.from));
        _chatMessage.setTo(Utils.getSafeStringData(chatItem.to));
        _chatMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(chatItem.body)));
        _chatMessage.setDate(Utils.getSafeStringData(chatItem.createdAt));
        _chatMessage.setUpdatedAt((chatItem.updatedAt) ? Utils.getSafeStringData(
            Date.create(chatItem.updatedAt).format(Utils.STANDARD_DATE_FORMAT)) : "");
        _chatMessage.setReplyItemId(Utils.getSafeStringData(chatItem.replyId));
        _chatMessage.setReplyTo(Utils.getSafeStringData(chatItem.replyTo));
        _chatMessage.setDeleteFlag(Utils.getSafeNumberData(chatItem.deleteFlag));
        _chatMessage.setThreadTitle(Utils.urldecode(Utils.getSafeStringData(chatItem.threadTitle)));
        _chatMessage.setThreadRootId(Utils.getSafeStringData(chatItem.threadRootId));
        if (chatItem.noteCount && chatItem.noteItems.length) {
            _chatMessage.setNoteTitle(Utils.urldecode(Utils.getSafeStringData(chatItem.noteItems[0].noteTitle)));
            _chatMessage.setNoteUrl(Utils.getSafeStringData(chatItem.noteItems[0].noteUrl));
        }
        _chatMessage.setBodyType(Utils.getSafeNumberData(chatItem.bodyType));
        var _goodJobItems = Utils.getSafeArrayData(chatItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _chatMessage.getGoodJobList().add(_goodJobData);
        }
        var IconsList = {};
        var emotionIconsList = chatItem.emotionPointIcons ? chatItem.emotionPointIcons : {};
        if (Object.keys(emotionIconsList).length == 0) {
            if (LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon) {
                emotionIconsList = LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon;
            }
        }
        for (var key in emotionIconsList) {
            IconsList[key] = Utils.urldecode(emotionIconsList[key]);
        }
        _chatMessage.setEmotionIconList(IconsList);
        var _emotionItems = Utils.getSafeArrayData(chatItem.emotionPointItems);
        var _emotionCount = _emotionItems.length;
        for (var _j=0; _j<_emotionCount; _j++)  {
            var _emotionItem = _emotionItems[_j];
            var _emotionData = _getEmotionPointFromEmotionItem(_emotionItem);
            if (_emotionData == null) {
                continue;
            }
            _chatMessage.getEmotionPointList().add(_emotionData);
        }
        var _shortenUrlItems = Utils.getSafeArrayData(chatItem.shortenItems);
        var _shortenUrlCount = _shortenUrlItems.length;
        var _shortenUrlList = new ArrayList();

        for (var _j = 0; _j < _shortenUrlCount; _j++) {
            var _shortenUrlItem = new ShortenURLInfo();
            if (_shortenUrlItem == null) {
                continue;
            }
            _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
            _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
            _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
            _shortenUrlList.add(_shortenUrlItem);
        }
        _chatMessage.setUIShortenUrls(_shortenUrlList);

        var _loginUserJid = _self._jid;
        if (_loginUserJid == _chatMessage.getFrom()) {
            _chatMessage.setDirection(ChatMessage.DIRECTION_SEND);
        } else {
            _chatMessage.setDirection(ChatMessage.DIRECTION_RECEIVE);
        }

        if (chatItem.quotation != null && Object.keys(chatItem.quotation).length) {
            _chatMessage.setQuotationItem(getQuotationItemFromMessage(chatItem.quotation));
        }

        return _chatMessage;
    };

    function _getGroupChatMessageFromGroupChatItem(_self, groupchatItem) {
        var _groupchatMessage = new GroupChatMessage();
        _groupchatMessage.setId(Utils.getSafeNumberData(groupchatItem.id));
        _groupchatMessage.setItemId(Utils.getSafeStringData(groupchatItem.itemId));
        _groupchatMessage.setFrom(Utils.getSafeStringData(groupchatItem.from));
        _groupchatMessage.setTo(Utils.getSafeStringData(groupchatItem.to));
        _groupchatMessage.setParentRoomId(Utils.urldecode(Utils.getSafeStringData(groupchatItem.parentRoomId)));
        _groupchatMessage.setRoomName(Utils.urldecode(Utils.getSafeStringData(groupchatItem.roomName)));
        _groupchatMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(groupchatItem.body)));
        _groupchatMessage.setDate(Utils.getSafeStringData(groupchatItem.createdAt));
        _groupchatMessage.setUpdatedAt((groupchatItem.updatedAt) ? Utils.getSafeStringData(
            Date.create(groupchatItem.updatedAt).format(Utils.STANDARD_DATE_FORMAT)) : "");
        _groupchatMessage.setReplyItemId(Utils.getSafeStringData(groupchatItem.replyId));
        _groupchatMessage.setReplyTo(Utils.getSafeStringData(groupchatItem.replyTo));
        _groupchatMessage.setDeleteFlag(Utils.getSafeNumberData(groupchatItem.deleteFlag));
        _groupchatMessage.setThreadTitle(Utils.urldecode(Utils.getSafeStringData(groupchatItem.threadTitle)));
        _groupchatMessage.setThreadRootId(Utils.getSafeStringData(groupchatItem.threadRootId));
        if (groupchatItem.noteCount && groupchatItem.noteItems.length) {
            _groupchatMessage.setNoteTitle(Utils.urldecode(Utils.getSafeStringData(groupchatItem.noteItems[0].noteTitle)));
            _groupchatMessage.setNoteUrl(Utils.getSafeStringData(groupchatItem.noteItems[0].noteUrl));
        }
        _groupchatMessage.setBodyType(Utils.getSafeNumberData(groupchatItem.bodyType));
        var _goodJobItems = Utils.getSafeArrayData(groupchatItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _groupchatMessage.getGoodJobList().add(_goodJobData);
        }
        var IconsList = {};
        var emotionIconsList = groupchatItem.emotionPointIcons ? groupchatItem.emotionPointIcons : {};
        if (Object.keys(emotionIconsList).length == 0) {
            if (LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon) {
                emotionIconsList = LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon;
            }
        }
        for (var key in emotionIconsList) {
            IconsList[key] = Utils.urldecode(emotionIconsList[key]);
        }
        _groupchatMessage.setEmotionIconList(IconsList);
        var _emotionItems = Utils.getSafeArrayData(groupchatItem.emotionPointItems);
        var _emotionCount = _emotionItems.length;
        for (var _j=0; _j<_emotionCount; _j++)  {
            var _emotionItem = _emotionItems[_j];
            var _emotionData = _getEmotionPointFromEmotionItem(_emotionItem);
            if (_emotionData == null) {
                continue;
            }
            _groupchatMessage.getEmotionPointList().add(_emotionData);
        }
        var _shortenUrlItems = Utils.getSafeArrayData(groupchatItem.shortenItems);
        var _shortenUrlCount = _shortenUrlItems.length;
        var _shortenUrlList = new ArrayList();

        for (var _j = 0; _j < _shortenUrlCount; _j++) {
            var _shortenUrlItem = new ShortenURLInfo();
            if (_shortenUrlItem == null) {
                continue;
            }
            _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
            _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
            _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
            _shortenUrlList.add(_shortenUrlItem);
        }
        _groupchatMessage.setUIShortenUrls(_shortenUrlList);

        var _loginUserJid = _self._jid;
        if (_loginUserJid == _groupchatMessage.getFrom()) {
            _groupchatMessage.setDirection(ChatMessage.DIRECTION_SEND);
        } else {
            _groupchatMessage.setDirection(ChatMessage.DIRECTION_RECEIVE);
        }

        if (groupchatItem.quotation != null && Object.keys(groupchatItem.quotation).length) {
            _groupchatMessage.setQuotationItem(getQuotationItemFromMessage(groupchatItem.quotation));
        }

        return _groupchatMessage;
    };

    function getQuotationItemFromMessage(quotation) {
        var _quotationMessage = '';
        switch (quotation.msgtype) {
            case Message.TYPE_PUBLIC:
                _quotationMessage = new PublicMessage();
                break;
            case Message.TYPE_CHAT:
                _quotationMessage = new ChatMessage();
                break;
            case Message.TYPE_GROUP_CHAT:
                _quotationMessage = new GroupChatMessage();
                break;
            case Message.TYPE_COMMUNITY:
                _quotationMessage = new CommunityMessage();
                break;
            case Message.TYPE_MURMUR:
                _quotationMessage = new MurmurMessage();
                break;
            default:
                return;
        }
        _quotationMessage.setId(Utils.getSafeNumberData(quotation.id));
        _quotationMessage.setItemId(Utils.getSafeStringData(quotation.shareItemId));
        _quotationMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(quotation.body)));
        _quotationMessage.setDate(Utils.getSafeStringData(quotation.createdAt));
        _quotationMessage.setUpdatedAt((quotation.updatedAt) ? Utils.getSafeStringData(
            Date.create(quotation.updatedAt).format(Utils.STANDARD_DATE_FORMAT)) : "");

        if (quotation.msgfrom) {
            _quotationMessage.setFrom(Utils.getSafeStringData(quotation.msgfrom));
        }

        var _shortenUrlItems = Utils.getSafeArrayData(quotation.shortenItems);
        var _shortenUrlCount = _shortenUrlItems.length;
        var _shortenUrlList = new ArrayList();

        for (var _j = 0; _j < _shortenUrlCount; _j++) {
            var _shortenUrlItem = new ShortenURLInfo();
            if (_shortenUrlItem == null) {
                continue;
            }
            _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
            _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
            _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
            _shortenUrlList.add(_shortenUrlItem);
        }

        _quotationMessage.setUIShortenUrls(_shortenUrlList);
        _quotationMessage = _setMessagePersonInfoFromMessageItem(_quotationMessage, quotation);
        return _quotationMessage;
    }

    function _getMailMessageFromMailItem(mailItem) {
        var _mailMessage = new MailMessage();
        _mailMessage.setId(Utils.getSafeNumberData(mailItem.id));
        _mailMessage.setItemId(Utils.getSafeStringData(mailItem.itemId));
        _mailMessage.setFrom(Utils.getSafeStringData(mailItem.from));
        _mailMessage.setTo(Utils.getSafeStringData(mailItem.to));
        _mailMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(mailItem.body)));
        _mailMessage.setDate(Utils.getSafeStringData(mailItem.createdAt));
        _mailMessage.setPriority(Utils.getSafeNumberData(mailItem.priority));
        _mailMessage.setMailMessageId(Utils.getSafeStringData(mailItem.mailMessageId));
        _mailMessage.setMailInReplyTo(Utils.getSafeStringData(mailItem.mailInReplyTo));
        _mailMessage.setReplyItemId(Utils.getSafeStringData(mailItem.replyId));
        _mailMessage.setDeleteFlag(Utils.getSafeNumberData(mailItem.deleteFlag));
        var _goodJobItems = Utils.getSafeArrayData(mailItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _mailMessage.getGoodJobList().add(_goodJobData);
        }
        return _mailMessage;
    };

    function _getMailBodyInfoFromMailBodyInfoItem(mailBodyItem) {
        var _mailBody = new MailBody();
        _mailBody.setId(Utils.getSafeNumberData(mailBodyItem.id));
        _mailBody.setItemId(Utils.getSafeStringData(mailBodyItem.itemId));
        _mailBody.setJid(Utils.getSafeStringData(mailBodyItem.jid));
        _mailBody.setBody(Utils.urldecode(Utils.getSafeStringData(mailBodyItem.mailBody)));
        return _mailBody;
    };

    function _getSystemMessageFromSystemMessageItem(systemMessageItem) {
        var _systemMessage = new SystemMessage();
        _systemMessage.setId(Utils.getSafeNumberData(systemMessageItem.id));
        _systemMessage.setItemId(Utils.getSafeStringData(systemMessageItem.itemId));
        _systemMessage.setFrom(Utils.getSafeStringData(systemMessageItem.from));
        _systemMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(systemMessageItem.body)));
        _systemMessage.setTriggerAction(Utils.getSafeNumberData(systemMessageItem.triggerAction));
        _systemMessage.setDate(Utils.getSafeStringData(systemMessageItem.createdAt));
        _systemMessage.setReplyItemId(Utils.getSafeStringData(systemMessageItem.replyId));
        _systemMessage.setReplyTo(Utils.getSafeStringData(systemMessageItem.replyTo));
        _systemMessage.setDeleteFlag(Utils.getSafeNumberData(systemMessageItem.deleteFlag));
        var _goodJobItems = Utils.getSafeArrayData(systemMessageItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _systemMessage.getGoodJobList().add(_goodJobData);
        }
        var _shortenUrlItems = Utils.getSafeArrayData(systemMessageItem.shortenItems);
        var _shortenUrlCount = _shortenUrlItems.length;
        var _shortenUrlList = new ArrayList();

        for (var _j = 0; _j < _shortenUrlCount; _j++) {
            var _shortenUrlItem = new ShortenURLInfo();
            if (_shortenUrlItem == null) {
                continue;
            }
            _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
            _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
            _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
            _shortenUrlList.add(_shortenUrlItem);
        }
        _systemMessage.setUIShortenUrls(_shortenUrlList);
        return _systemMessage;
    };

    function _getCommunityMessageFromCommunityMessageItem(_self, communityMessageItem) {
        var _communityMessage = new CommunityMessage();
        _communityMessage.setId(Utils.getSafeNumberData(communityMessageItem.id));
        _communityMessage.setItemId(Utils.getSafeStringData(communityMessageItem.itemId));
        _communityMessage.setFrom(Utils.getSafeStringData(communityMessageItem.from));
        _communityMessage.setTo(Utils.getSafeStringData(communityMessageItem.to));
        _communityMessage.setRoomName(Utils.urldecode(Utils.getSafeStringData(communityMessageItem.roomName)));
        _communityMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(communityMessageItem.body)));
        _communityMessage.setDate(Utils.getSafeStringData(communityMessageItem.createdAt));
        _communityMessage.setUpdatedAt((communityMessageItem.updatedAt) ? Utils.getSafeStringData(
            Date.create(communityMessageItem.updatedAt).format(Utils.STANDARD_DATE_FORMAT)) : "");
        _communityMessage.setReplyItemId(Utils.getSafeStringData(communityMessageItem.replyId));
        _communityMessage.setReplyTo(Utils.getSafeStringData(communityMessageItem.replyTo));
        _communityMessage.setDeleteFlag(Utils.getSafeNumberData(communityMessageItem.deleteFlag));
        _communityMessage.setThreadTitle(Utils.urldecode(Utils.getSafeStringData(communityMessageItem.threadTitle)));
        _communityMessage.setThreadRootId(Utils.getSafeStringData(communityMessageItem.threadRootId));
        if (communityMessageItem.noteCount && communityMessageItem.noteItems.length) {
            _communityMessage.setNoteTitle(Utils.urldecode(Utils.getSafeStringData(communityMessageItem.noteItems[0].noteTitle)));
            _communityMessage.setNoteUrl(Utils.getSafeStringData(communityMessageItem.noteItems[0].noteUrl));
        }
        _communityMessage.setBodyType(Utils.getSafeNumberData(communityMessageItem.bodyType));
        var _goodJobItems = Utils.getSafeArrayData(communityMessageItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _communityMessage.getGoodJobList().add(_goodJobData);
        }
        var IconsList = {};
        var emotionIconsList = communityMessageItem.emotionPointIcons ? communityMessageItem.emotionPointIcons : {};
        if (Object.keys(emotionIconsList).length == 0) {
            if (LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon) {
                emotionIconsList = LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon;
            }
        }
        for (var key in emotionIconsList) {
            IconsList[key] = Utils.urldecode(emotionIconsList[key]);
        }
        _communityMessage.setEmotionIconList(IconsList);

        var _emotionItems = Utils.getSafeArrayData(communityMessageItem.emotionPointItems);
        var _emotionCount = _emotionItems.length;
        for (var _j=0; _j<_emotionCount; _j++)  {
            var _emotionItem = _emotionItems[_j];
            var _emotionData = _getEmotionPointFromEmotionItem(_emotionItem);
            if (_emotionData == null) {
                continue;
            }
            _communityMessage.getEmotionPointList().add(_emotionData);
        }
        var _shortenUrlItems = Utils.getSafeArrayData(communityMessageItem.shortenItems);
        var _shortenUrlCount = _shortenUrlItems.length;
        var _shortenUrlList = new ArrayList();

        for (var _j = 0; _j < _shortenUrlCount; _j++) {
            var _shortenUrlItem = new ShortenURLInfo();
            if (_shortenUrlItem == null) {
                continue;
            }
            _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
            _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
            _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
            _shortenUrlList.add(_shortenUrlItem);
        }
        _communityMessage.setUIShortenUrls(_shortenUrlList);
        var _loginUserJid = _self._jid;
        if (_loginUserJid == _communityMessage.getFrom()) {
            _communityMessage.setDirection(CommunityMessage.DIRECTION_SEND);
        } else {
            _communityMessage.setDirection(CommunityMessage.DIRECTION_RECEIVE);
        }

        if (communityMessageItem.quotation != null && Object.keys(communityMessageItem.quotation).length) {
            _communityMessage.setQuotationItem(getQuotationItemFromMessage(communityMessageItem.quotation));
        }
        return _communityMessage;
    };
    function _getMurmurMessageFromMurmurMessageItem(_self, murmurMessageItem) {
        var _murmurMessage = new MurmurMessage();
        _murmurMessage.setId(Utils.getSafeNumberData(murmurMessageItem.id));
        _murmurMessage.setItemId(Utils.getSafeStringData(murmurMessageItem.itemId));
        _murmurMessage.setFrom(Utils.getSafeStringData(murmurMessageItem.from));
        _murmurMessage.setTo(Utils.getSafeStringData(murmurMessageItem.to));
        _murmurMessage.setMessage(Utils.urldecode(Utils.getSafeStringData(murmurMessageItem.body)));
        _murmurMessage.setDate(Utils.getSafeStringData(murmurMessageItem.createdAt));
        _murmurMessage.setUpdatedAt((murmurMessageItem.updatedAt) ? Utils.getSafeStringData(
            Date.create(murmurMessageItem.updatedAt).format(Utils.STANDARD_DATE_FORMAT)) : "");
        _murmurMessage.setReplyItemId(Utils.getSafeStringData(murmurMessageItem.replyId));
        _murmurMessage.setReplyTo(Utils.getSafeStringData(murmurMessageItem.replyTo));
        _murmurMessage.setDeleteFlag(Utils.getSafeNumberData(murmurMessageItem.deleteFlag));
        _murmurMessage.setThreadTitle(Utils.urldecode(Utils.getSafeStringData(murmurMessageItem.threadTitle)));
        _murmurMessage.setThreadRootId(Utils.getSafeStringData(murmurMessageItem.threadRootId));
        _murmurMessage.setColumnName(Utils.getSafeStringData(Utils.urldecode(murmurMessageItem.columnName)));
        if (murmurMessageItem.noteCount && murmurMessageItem.noteItems.length) {
            _murmurMessage.setNoteTitle(Utils.urldecode(Utils.getSafeStringData(murmurMessageItem.noteItems[0].noteTitle)));
            _murmurMessage.setNoteUrl(Utils.getSafeStringData(murmurMessageItem.noteItems[0].noteUrl));
        }
        _murmurMessage.setBodyType(Utils.getSafeNumberData(murmurMessageItem.bodyType));
        var _goodJobItems = Utils.getSafeArrayData(murmurMessageItem.goodJobItems);
        var _goodJobCount = _goodJobItems.length;
        for (var _j = 0; _j < _goodJobCount; _j++) {
            var _goodJobItem = _goodJobItems[_j];
            var _goodJobData = _getGoodJobFromGoodJobItem(_goodJobItem);
            if (_goodJobData == null) {
                continue;
            }
            _murmurMessage.getGoodJobList().add(_goodJobData);
        }
        var IconsList = {};
        var emotionIconsList = murmurMessageItem.emotionPointIcons ? murmurMessageItem.emotionPointIcons : {};
        if (Object.keys(emotionIconsList).length == 0) {
            if (LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon) {
                emotionIconsList = LoginUser.getInstance().getTenantInfo().emotionPointBasicIcon;
            }
        }
        for (var key in emotionIconsList) {
            IconsList[key] = Utils.urldecode(emotionIconsList[key]);
        }
        _murmurMessage.setEmotionIconList(IconsList);

        var _emotionItems = Utils.getSafeArrayData(murmurMessageItem.emotionPointItems);
        var _emotionCount = _emotionItems.length;
        for (var _j=0; _j<_emotionCount; _j++)  {
            var _emotionItem = _emotionItems[_j];
            var _emotionData = _getEmotionPointFromEmotionItem(_emotionItem);
            if (_emotionData == null) {
                continue;
            }
            _murmurMessage.getEmotionPointList().add(_emotionData);
        }
        var _shortenUrlItems = Utils.getSafeArrayData(murmurMessageItem.shortenItems);
        var _shortenUrlCount = _shortenUrlItems.length;
        var _shortenUrlList = new ArrayList();

        for (var _j = 0; _j < _shortenUrlCount; _j++) {
            var _shortenUrlItem = new ShortenURLInfo();
            if (_shortenUrlItem == null) {
                continue;
            }
            _shortenUrlItem.setDisplayedURL(Utils.urldecode(_shortenUrlItems[_j].DisplayedURL));
            _shortenUrlItem.setShortenPath(Utils.urldecode(_shortenUrlItems[_j].ShortenPath));
            _shortenUrlItem.setOriginalURL(Utils.urldecode(_shortenUrlItems[_j].OriginalURL));
            _shortenUrlList.add(_shortenUrlItem);
        }
        _murmurMessage.setUIShortenUrls(_shortenUrlList);
        var _loginUserJid = _self._jid;
        if (_loginUserJid == _murmurMessage.getFrom()) {
            _murmurMessage.setDirection(MurmurMessage.DIRECTION_SEND);
        } else {
            _murmurMessage.setDirection(MurmurMessage.DIRECTION_RECEIVE);
        }

        if (murmurMessageItem.quotation != null && Object.keys(murmurMessageItem.quotation).length) {
            _murmurMessage.setQuotationItem(getQuotationItemFromMessage(murmurMessageItem.quotation));
        }
        return _murmurMessage;
    };
    function _getExistingReaderItemFromMessageItem(messageItem){
        if (messageItem == null) {
            return null;
        }
        if(messageItem.readAllCount == undefined || !messageItem.readItems == undefined){
            return null;
        }
        var _existingReaderInfo = new MessageExistingReaderInfo();
        _existingReaderInfo.setAllCount(Utils.getSafeNumberData(messageItem.readAllCount));
        var _readItems =  Utils.getSafeArrayData(messageItem.readItems);
        var _count = _readItems.length;
        for(var _i = 0; _i < _count; _i++){
            var _item = _readItems[_i];
            var _existingReaderItem = _getExistingReaderItemFromItem(_item);
            if(_existingReaderItem != null){
                _existingReaderInfo.getExistingReaderItemList().add(_existingReaderItem);
            }
        }
        return _existingReaderInfo;
    }
    function _getExistingReaderItemFromGetExistingReaderItem(existingReaderItem){
        if (existingReaderItem == null) {
            return null;
        }
        if(existingReaderItem.itemCount == undefined || existingReaderItem.items == undefined){
            return null;
        }
        var _existingReaderInfo = new MessageExistingReaderInfo();
        _existingReaderInfo.setAllCount(Utils.getSafeNumberData(existingReaderItem.readAllCount));
        var _items =  Utils.getSafeArrayData(existingReaderItem.items);
        var _count = _items.length;
        for(var _i = 0; _i < _count; _i++){
            var _item = _items[_i];
            var _existingReaderItem = _getExistingReaderItemFromItem(_item);
            if(_existingReaderItem != null){
                _existingReaderInfo.getExistingReaderItemList().add(_existingReaderItem);
            }
        }
        return _existingReaderInfo;
    }
    function _getItemIdListFromSetReadOneMessageItem(setReadMessageItem){
        if (setReadMessageItem == null) {
            return null;
        }
        if(setReadMessageItem.itemCount == undefined || setReadMessageItem.items == undefined){
            return null;
        }
        var _itemIdList = new ArrayList();
        var _items =  Utils.getSafeArrayData(setReadMessageItem.items);
        var _count = _items.length;
        for(var _i = 0; _i < _count; _i++){
            var _item = _items[_i];
            var _itemId = _item.itemId;
            if(_itemId != null){
                _itemIdList.add(_itemId);
            }
        }
        return _itemIdList;
    }
    function _getExistingReaderItemFromItem(item){
        if (item == null) {
            return null;
        }
        var _person = new Person();
        _person.setJid(item.jid);
        _person.setLoginAccount(Utils.getSafeStringData(item.account));
        _person.setUserName(Utils.urldecode(Utils.getSafeStringData(item.nickName)));
        _person.setAvatarType(Utils.getSafeStringData(item.avatarType));
        _person.setAvatarData(Utils.getSafeStringData(item.avatarData));
        var _existingReaderItem = new ExistingReaderItem();
        _existingReaderItem.setPerson(_person);
        var _date = new Date(Utils.getSafeStringData(item.date));
        _existingReaderItem.setDate(_date);
        return _existingReaderItem;
    }
    function _getGoodJobFromGoodJobItem(goodJobItem) {
        if (goodJobItem == null) {
            return null;
        }

        var _nickName = Utils.urldecode(Utils.getSafeStringData(goodJobItem.nickName));
        var _avatarType = Utils.getSafeStringData(goodJobItem.avatarType);
        var _avatarData = Utils.getSafeStringData(goodJobItem.avatarData);
        var _loginAccount = Utils.getSafeStringData(goodJobItem.userName);
        var _status = Utils.getSafeNumberData(goodJobItem.status);

        var _goodJobData = new GoodJobData();
        var _goodJobDate = new Date(Utils.getSafeStringData(goodJobItem.date));

        _goodJobData.setJid(Utils.getSafeStringData(goodJobItem.fromJid));
        _goodJobData.setDate(_goodJobDate);
        _goodJobData.setNickName(_nickName);
        _goodJobData.setAvatarType(_avatarType);
        _goodJobData.setAvatarData(_avatarData);
        _goodJobData.setLoginAccount(_loginAccount);
        _goodJobData.setStatus(_status);

        return _goodJobData;
    };

    function _getEmotionPointFromEmotionItem(emotionItem) {
        if (emotionItem == null) {
            return null;
        }

        var _nickName = Utils.urldecode(Utils.getSafeStringData(emotionItem.nickName));
        var _avatarType = Utils.getSafeStringData(emotionItem.avatarType);
        var _avatarData = Utils.getSafeStringData(emotionItem.avatarData);
        var _loginAccount = Utils.getSafeStringData(emotionItem.userName);
        var _status = Utils.getSafeNumberData(emotionItem.status);
        var _emotionPoint = Utils.getSafeNumberData(emotionItem.emotionPoint);

        var _emotionData = new EmotionPointData();
        var _emotionCreatedAt = new Date(Utils.getSafeStringData(emotionItem.createdAt));
        var _emotionUpdatedAt = new Date(Utils.getSafeStringData(emotionItem.updatedAt));

        _emotionData.setJid(Utils.getSafeStringData(emotionItem.fromJid));
        _emotionData.setCreatedAt(_emotionCreatedAt);
        _emotionData.setUpdatedAt(_emotionUpdatedAt);
        _emotionData.setNickName(_nickName);
        _emotionData.setAvatarType(_avatarType);
        _emotionData.setAvatarData(_avatarData);
        _emotionData.setLoginAccount(_loginAccount);
        _emotionData.setStatus(_status);
        _emotionData.setEmotionPoint(_emotionPoint);

        return _emotionData;
    };

    function _getRoomInfoFromRoomInfoItem(roomInfoItem) {
        var _chatRoomInfomation = new ChatRoomInformation();
        _chatRoomInfomation.setId(Utils.getSafeNumberData(roomInfoItem.id));
        _chatRoomInfomation.setRoomId(Utils.getSafeStringData(roomInfoItem.roomId));
        _chatRoomInfomation.setRoomName(Utils.urldecode(Utils.getSafeStringData(roomInfoItem.roomName)));
        _chatRoomInfomation.setParentRoomId(Utils.getSafeStringData(roomInfoItem.parentRoomId));
        _chatRoomInfomation.setCreatedAt(new Date(Utils.getSafeStringData(roomInfoItem.createdAt)));
        _chatRoomInfomation.setCreatedBy(Utils.getSafeStringData(roomInfoItem.createdBy));
        _chatRoomInfomation.setUpdatedAt(new Date(Utils.getSafeStringData(roomInfoItem.updatedAt)));
        _chatRoomInfomation.setUpdatedBy(Utils.getSafeStringData(roomInfoItem.updatedBy));
        _chatRoomInfomation.setOwner(Utils.getSafeStringData(roomInfoItem.updatedBy));
        _chatRoomInfomation.setPrivacyType(Utils.getSafeNumberData(roomInfoItem.privacyType));
        var _memberItems = Utils.getSafeArrayData(roomInfoItem.memberItems);
        var _memberItemsCount = _memberItems.length;
        for (var _j = 0; _j < _memberItemsCount; _j++) {
            var _memberItem = _memberItems[_j];
            if (_memberItem == null || _memberItem == '') {
                continue;
            }
            _chatRoomInfomation.getMemberList().add(_memberItem);
        }
        var _profileMap = _chatRoomInfomation.getProfileMap();
        var _personInfo = roomInfoItem.personInfo;
        if(_personInfo && typeof _personInfo == 'object'){
            for (var _jid in _personInfo){
                var _info = _personInfo[_jid];
                if(!_info){
                    continue;
                }
                var _profile = _createProfile(_info);
                if(!_profile){
                    continue;
                }
                _profileMap.add(_jid, _profile);
            }
        }
        return _chatRoomInfomation;
    };
    function _getServerInfoFromServerInfoItem(serverInfoItem) {
        var _serverInfomation = new MailServerInformation();
        _serverInfomation.setId(Utils.getSafeNumberData(serverInfoItem.id));
        _serverInfomation.setDisplayName(Utils.urldecode(Utils.getSafeStringData(serverInfoItem.displayName)));
        _serverInfomation.setServerType(Utils.getSafeNumberData(serverInfoItem.serverType));
        _serverInfomation.setCreatedAt(Utils.getSafeStringData(serverInfoItem.createdAt));
        _serverInfomation.setCreatedBy(Utils.getSafeStringData(serverInfoItem.createdBy));
        _serverInfomation.setUpdatedBy(Utils.getSafeStringData(serverInfoItem.updatedAt));
        _serverInfomation.setUpdatedAt(Utils.getSafeStringData(serverInfoItem.updatedBy));
        _serverInfomation.setPopHost(Utils.getSafeStringData(serverInfoItem.popHost));
        _serverInfomation.setPopPort(Utils.getSafeNumberData(serverInfoItem.popPort));
        _serverInfomation.setPopAuthMode(Utils.getSafeNumberData(serverInfoItem.popAuthMode));
        _serverInfomation.setPopResponseTimeout(Utils.getSafeNumberData(serverInfoItem.popResponseTimeout));
        return _serverInfomation;
    };
    function _getCommunityInfoFromCommunityInfoItem(communityInfoItem) {
        if(communityInfoItem == null) {
            return null;
        }
        var _communityInfo = new CommunityInfo();
        _communityInfo.setId(Utils.getSafeNumberData(communityInfoItem.id));
        _communityInfo.setRoomId(Utils.getSafeStringData(communityInfoItem.roomId));
        _communityInfo.setRoomName(Utils.urldecode(Utils.getSafeStringData(communityInfoItem.roomName)));
        _communityInfo.setDescription(Utils.urldecode(Utils.getSafeStringData(communityInfoItem.description)));
        _communityInfo.setMemberCount(Utils.getSafeNumberData(communityInfoItem.memberCount));
        _communityInfo.setPrivacyType(Utils.getSafeNumberData(communityInfoItem.privacyType));
        _communityInfo.setMemberEntryType(Utils.getSafeStringData(communityInfoItem.memberEntryType));
        _communityInfo.setLogoUrl(Utils.getSafeStringData(communityInfoItem.logoUrl));
        _communityInfo.setCreatedAt(new Date(Utils.getSafeStringData(communityInfoItem.createdAt)));
        _communityInfo.setCreatedBy(Utils.getSafeStringData(communityInfoItem.createdBy));
        _communityInfo.setUpdatedAt(new Date(Utils.getSafeStringData(communityInfoItem.updatedAt)));
        _communityInfo.setUpdatedBy(Utils.getSafeStringData(communityInfoItem.updatedBy));
        return _communityInfo;
    };
    function _getCommunityMemberInfoFromCommunityMemberInfoItem(communityMemberItem) {
        if(communityMemberItem == null) {
            return null;
        }
        var _communityInfo = new CommunityInfo();
        _communityInfo.setId(Utils.getSafeNumberData(communityMemberItem.id));
        _communityInfo.setRoomId(Utils.getSafeStringData(communityMemberItem.roomId));
        _communityInfo.setMemberCount(Utils.getSafeNumberData(communityMemberItem.memberCount));

        var _ownerList = _communityInfo.getOwnerList();
        var _memberItems = communityMemberItem.memberItems;
        if(_memberItems == null) {
            return null;
        }
        var _ownerItems = _memberItems.ownerItems;
        if(_ownerItems == null) {
            return null;
        }
        var _generalMemberItems = _memberItems.generalMemberItems;
        if(_generalMemberItems == null) {
            return null;
        }

        var _ownerList = _communityInfo.getOwnerList();
        var _count = _ownerItems.length;
        for(var _i = 0; _i < _count; _i++) {
            var _ownerItem = _ownerItems[_i];
            if(_ownerItem == null) {
                continue;
            }
            var _communityMember = _getCommunityMemberFromCommunityMemberItem(_ownerItem);
            if(_communityMember == null) {
                continue;
            }
            _ownerList.add(_communityMember);
        }

        var _generalMemberList = _communityInfo.getGeneralMemberList();
        _count = _generalMemberItems.length;
        for(var _i = 0; _i < _count; _i++) {
            var _generalMemberItem = _generalMemberItems[_i];
            if(_generalMemberItem == null) {
                continue;
            }
            var _communityMember = _getCommunityMemberFromCommunityMemberItem(_generalMemberItem);
            if(_communityMember == null) {
                continue;
            }
            _generalMemberList.add(_communityMember);
        }

        return _communityInfo;
    };

    function _getCommunityMemberFromCommunityMemberItem(memberItem) {
        var _ret = null;
        if(memberItem == null || typeof memberItem != 'object') {
            return _ret;
        }
        var _communityMember = new CommunityMember();
        _communityMember.setRole(Utils.getSafeNumberData(memberItem.role));
        _communityMember.setJid(Utils.getSafeStringData(memberItem.jid));
        _communityMember.setLoginAccount(Utils.getSafeStringData(memberItem.userName));
        _communityMember.setUserName(Utils.urldecode(Utils.getSafeStringData(memberItem.nickName)));
        _communityMember.setAvatarType(Utils.getSafeStringData(memberItem.avatarType));
        _communityMember.setAvatarData(Utils.getSafeStringData(memberItem.avatarData));
        _communityMember.setStatus(Utils.getSafeNumberData(memberItem.status));
        _ret = _communityMember;
        return _ret;
    }

    function _onMessageOption(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_ADD_GOOD_JOB:
                _onAddGoodJob(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_UPDATE_SIBLING_TASK:
                _onUpdateSiblingTask(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_DEMAND_TASK:
            case ApiCubee.CONTENT_TYPE_CLEAR_DEMANDED_TASK:
                _onDemandTask(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_SET_READ_MESSAGE:
                _onSetReadMessage(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_ADD_EMOTIONPOINT:
                _onAddEmotionPoint(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    };

    function _onAddEmotionPoint(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _emotionPointNotification = _createEmotionPointNotification(_item);
            _self._onNotificationCallback(_emotionPointNotification);
        }
    };

    function _createEmotionPointNotification(item){
        var _item = item;
        if(!_item){
            return;
        }
        var _itemId = Utils.getSafeStringData(_item.itemId);
        var _fromJid = Utils.getSafeStringData(_item.fromJid);
        var _fromName = Utils.urldecode(Utils.getSafeStringData(_item.fromName));
        var _createdAt = Utils.getSafeStringData(_item.createdAt);
        var _updatedAt = Utils.getSafeStringData(_item.updatedAt);
        var _nickName = Utils.urldecode(Utils.getSafeStringData(_item.nickName));
        var _avatarType = Utils.getSafeStringData(_item.avatarType);
        var _avatarData = Utils.getSafeStringData(_item.avatarData);
        var _loginAccount = Utils.getSafeStringData(_item.userName);
        var _status = Utils.getSafeNumberData(_item.status);
        var _emotion_point = Utils.getSafeNumberData(_item.emotionPoint);
        var _body = Utils.urldecode(Utils.getSafeStringData(_item.body));
        var _msgOwnJid = Utils.getSafeStringData(_item.msgOwnJid);
        var _msgTo = Utils.getSafeStringData(_item.msgTo);
        var _msgType = Utils.getSafeNumberData(_item.msgType);

        var _emotionPointNotification = new EmotionPointNotification();
        _emotionPointNotification.setItemId(_itemId);
        _emotionPointNotification.setFromJid(_fromJid);
        _emotionPointNotification.setFromName(_fromName);
        _emotionPointNotification.setCreatedAt(_createdAt);
        _emotionPointNotification.setUpdatedAt(_updatedAt);
        _emotionPointNotification.setNickName(_nickName);
        _emotionPointNotification.setAvatarType(_avatarType);
        _emotionPointNotification.setAvatarData(_avatarData);
        _emotionPointNotification.setLoginAccount(_loginAccount);
        _emotionPointNotification.setStatus(_status);
        _emotionPointNotification.setEmotionPoint(_emotion_point);
        _emotionPointNotification.setMessage(_body);
        _emotionPointNotification.setMsgOwnJid(_msgOwnJid);
        _emotionPointNotification.setMsgTo(_msgTo);
        _emotionPointNotification.setMsgType(_msgType);

        return _emotionPointNotification;
    }

    function _onAddGoodJob(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _goodJobNotification = _createGoodJobNotification(_item);
            _self._onNotificationCallback(_goodJobNotification);
        }
    };
    function _createGoodJobNotification(item){
        var _item = item;
        if(!_item){
            return;
        }
        var _itemId = Utils.getSafeStringData(_item.itemId);
        var _fromJid = Utils.getSafeStringData(_item.fromJid);
        var _fromName = Utils.urldecode(Utils.getSafeStringData(_item.fromName));
        var _date = Utils.getSafeStringData(_item.date);
        var _nickName = Utils.urldecode(Utils.getSafeStringData(_item.nickName));
        var _avatarType = Utils.getSafeStringData(_item.avatarType);
        var _avatarData = Utils.getSafeStringData(_item.avatarData);
        var _loginAccount = Utils.getSafeStringData(_item.userName);
        var _status = Utils.getSafeNumberData(_item.status);
        var _body = Utils.urldecode(Utils.getSafeStringData(_item.body));
        var _msgOwnJid = Utils.getSafeStringData(_item.msgOwnJid);
        var _msgTo = Utils.getSafeStringData(_item.msgTo);
        var _msgType = Utils.getSafeNumberData(_item.msgType);

        var _goodJobNotification = new GoodJobNotification();
        _goodJobNotification.setItemId(_itemId);
        _goodJobNotification.setFromJid(_fromJid);
        _goodJobNotification.setFromName(_fromName);
        _goodJobNotification.setDate(_date);
        _goodJobNotification.setNickName(_nickName);
        _goodJobNotification.setAvatarType(_avatarType);
        _goodJobNotification.setAvatarData(_avatarData);
        _goodJobNotification.setLoginAccount(_loginAccount);
        _goodJobNotification.setStatus(_status);
        _goodJobNotification.setMessage(_body);
        _goodJobNotification.setMsgOwnJid(_msgOwnJid);
        _goodJobNotification.setMsgTo(_msgTo);
        _goodJobNotification.setMsgType(_msgType);

        return _goodJobNotification;
    }
    function _onUpdateSiblingTask(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];

            var _itemId = Utils.getSafeStringData(_item.itemId);
            var _siblingItemId = Utils.getSafeStringData(_item.siblingItemId);
            var _ownerJid = Utils.getSafeStringData(_item.ownerJid);
            var _ownerName = Utils.urldecode(Utils.getSafeStringData(_item.ownerName));
            var _status = Utils.getSafeNumberData(_item.status);
            var _nickName = Utils.urldecode(Utils.getSafeStringData(_item.nickName));
            var _avatarType = Utils.getSafeStringData(_item.avatarType);
            var _avatarData = Utils.getSafeStringData(_item.avatarData);
            var _loginAccount= Utils.getSafeStringData(_item.userName);
            var _userStatus = Utils.getSafeNumberData(_item.userStatus);

            var _siblingTaskNotification = new SiblingTaskNotification();
            _siblingTaskNotification.setItemId(_itemId);
            _siblingTaskNotification.setSiblingItemId(_siblingItemId);
            _siblingTaskNotification.setOwnerJid(_ownerJid);
            _siblingTaskNotification.setOwnerName(_ownerName);
            _siblingTaskNotification.setStatus(_status);
            _siblingTaskNotification.setNickName(_nickName);
            _siblingTaskNotification.setAvatarType(_avatarType);
            _siblingTaskNotification.setAvatarData(_avatarData);
            _siblingTaskNotification.setLoginAccount(_loginAccount);
            _siblingTaskNotification.setUserStatus(_userStatus);
            _self._onNotificationCallback(_siblingTaskNotification);
        }
    };

    function _onDemandTask(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        var _demandStatus = TaskMessage.DEMAND_ON;
        if (content.type == ApiCubee.CONTENT_TYPE_CLEAR_DEMANDED_TASK) {
            _demandStatus = TaskMessage.DEMAND_OFF;
        }
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _demandTaskNotification = _getDemandInfoFromDemandInfoItem(_item, _demandStatus);
            if (_demandTaskNotification != null) {
                _self._onNotificationCallback(_demandTaskNotification);
            }
        }
    };
    function _getDemandInfoFromDemandInfoItem(demandItemInfo, demandStatus) {
        var _itemTaskInfo = demandItemInfo.taskInfo;
        var _itemFromUserInfo = demandItemInfo.fromUserInfo;
        if (_itemTaskInfo == null || _itemFromUserInfo == null) {
            return null;
        }
        var _demandTaskNotification = new DemandTaskNotification();
        _demandTaskNotification.setItemId(Utils.getSafeStringData(_itemTaskInfo.itemId));
        _demandTaskNotification.setTitle(Utils.getSafeStringData(_itemTaskInfo.title));
        _demandTaskNotification.setOwner(Utils.getSafeStringData(_itemTaskInfo.owner));
        _demandTaskNotification.setClient(Utils.getSafeStringData(_itemTaskInfo.client));
        _demandTaskNotification.setStatus(Utils.getSafeNumberData(_itemTaskInfo.status));
        _demandTaskNotification.setDemandStatus(Utils.getSafeNumberData(demandStatus));
        _demandTaskNotification.setDemandDate(Utils.getSafeStringData(_itemTaskInfo.demandDate));
        _demandTaskNotification.setJid(Utils.getSafeStringData(_itemFromUserInfo.jid));
        _demandTaskNotification.setNickName(Utils.urldecode(Utils.getSafeStringData(_itemFromUserInfo.nickName)));
        return _demandTaskNotification;
    };

    function _onSetReadMessage(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _setReadMessageNotification = _getSetReadMessageInfoFromSetReadMessageInfoItem(_item);
            if (_setReadMessageNotification != null) {
                _self._onNotificationCallback(_setReadMessageNotification);
            }
        }
    };
    function _getSetReadMessageInfoFromSetReadMessageInfoItem(setReadMessageItemInfo) {
        if(setReadMessageItemInfo == null){
            return null;
        }
        var _setReadMessageNotification = new SetReadMessageNotification();
        _setReadMessageNotification.setItemId(Utils.getSafeStringData(setReadMessageItemInfo.itemId));
        var _person = new Person();
        _person.setJid(Utils.getSafeStringData(setReadMessageItemInfo.jid));
        _person.setUserName(Utils.urldecode(Utils.getSafeStringData(setReadMessageItemInfo.nickName)));
        _person.setAvatarData(Utils.getSafeStringData(setReadMessageItemInfo.avatarData));
        _person.setAvatarType(Utils.getSafeStringData(setReadMessageItemInfo.avatarType));
        _person.setLoginAccount(Utils.getSafeStringData(setReadMessageItemInfo.account));
        var _existingReaderItem = new ExistingReaderItem();
        _existingReaderItem.setPerson(_person);
        var _date = new Date(Utils.getSafeStringData(setReadMessageItemInfo.date));
        _existingReaderItem.setDate(_date);
        _setReadMessageNotification.setExistingReaderItem(_existingReaderItem);
        return _setReadMessageNotification;
    };

    function _onCreateGroup(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM:
                _onCreateRoomInfoReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    };

    function _onCreateRoomInfoReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _roomInfo = _getRoomInfoFromRoomInfoItem(_item);
            var _notification = new GroupChatCreateNotification();
            _notification.setRoomInfo(_roomInfo);
            _self._onNotificationCallback(_notification);
        }
    };

    function _onUpdateGroupInfo(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM_INFO:
                _onUpdateRoomInfoReceived(_self, _content);
                if(_content.items == null || !Array.isArray(_content.items)){
                    console.log('content or content.items is null.');
                    return;
                }
                break;
            case ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM_INFO:
                _onUpdateCommunityInfoReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    };
    function _onUpdateRoomInfoReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        var _subType = content.extras.subType;
        var _preRoomName = Utils.urldecode(Utils.getSafeStringData(content.extras.preRoomName));
        var _prePrivacyType = Utils.getSafeNumberData(content.extras.prePrivacyType);
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _roomInfo = _getRoomInfoFromRoomInfoItem(_item);
            var _notification = new GroupChatInfoUpdateNotification();
            _notification.setRoomInfo(_roomInfo);
            for (var _i = 0; _i < _subType.length; _i++) {
                _notification.getUpdatedItems().push(_subType[_i]);
            }
            if (_preRoomName != '') {
                _notification.setPreviousRoomName(_preRoomName);
            }
            if (typeof _prePrivacyType == 'number' &&
                0 <= _prePrivacyType && _prePrivacyType <= 2) {
                _notification.setPreviousPrivacyType(_prePrivacyType);
            }
            _self._onNotificationCallback(_notification);
        }
    };

    function _onUpdateCommunityInfoReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _extras = content.extras;
        var _preCommunityInfo = null;
        if(_extras != null) {
            var _preInfo = _extras.preInfo;
            if(_preInfo != null) {
                _preCommunityInfo = _getCommunityInfoFromCommunityInfoItem(_preInfo);
            }
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        if(_itemCount <= 0) {
            return;
        }
        var _item = _items[0];
        var _communityInfo = _getCommunityInfoFromCommunityInfoItem(_item);
        if(_communityInfo != null && _preCommunityInfo != null) {
            _preCommunityInfo.setCreatedAt(_communityInfo.getCreatedAt());
            _preCommunityInfo.setCreatedBy(_communityInfo.getCreatedBy());
            _preCommunityInfo.setUpdatedAt(_communityInfo.getUpdatedAt());
            _preCommunityInfo.setUpdatedBy(_communityInfo.getUpdatedBy());
        }
        var _notification = new CommunityInfoUpdateNotification();
        _notification.setData(_communityInfo, _preCommunityInfo);
        _self._onNotificationCallback(_notification);
    };

    function _onAddMember(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM:
                _onAddGroupChatMemberRoomInfoReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM:
                _onAddCommunityMemberReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    };
    function _onAddGroupChatMemberRoomInfoReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _roomInfo = _getRoomInfoFromRoomInfoItem(_item);
            var _notification = new GroupChatAddMemberNotification();
            _notification.setRoomInfo(_roomInfo);
            _notification.setAddedBy(_item.addedBy);
            var _memberItems = Utils.getSafeArrayData(_item.members);
            var _memberItemsCount = _memberItems.length;
            for (var _j = 0; _j < _memberItemsCount; _j++) {
                var _memberItem = _memberItems[_j];
                if (_memberItem == null || _memberItem == '') {
                    continue;
                }
                _notification.getAddedMemberList().add(_memberItem);
            }
            if(_roomInfo.getProfileMap()){
                _notification.setProfileMap(_roomInfo.getProfileMap());
            }
            _self._onNotificationCallback(_notification);
        }
    };

    function _onAddCommunityMemberReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _notification = new CommunityMemberAddNotification();
            _notification.setRoomId(Utils.getSafeStringData(_item.roomId));
            _notification.setRoomName(Utils.urldecode(Utils.getSafeStringData(_item.roomName)));
            _notification.setAddedBy(Utils.getSafeStringData(_item.addedBy));
            var _addedMemberList = _notification.getAddedMemberList();
            var _memberItems = Utils.getSafeArrayData(_item.members);
            var _memberItemsCount = _memberItems.length;
            for (var _j = 0; _j < _memberItemsCount; _j++) {
                var _memberItem = _memberItems[_j];
                if (_memberItem == null) {
                    continue;
                }
                var _communityMember = _getCommunityMemberFromCommunityMemberItem(_memberItem);
                if(_communityMember == null) {
                    continue;
                }
                _addedMemberList.add(_communityMember);
            }
            _self._onNotificationCallback(_notification);
        }
    };

    function _onUpdateMember(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_COMMUNITY_OWNER:
                _onUpdateCommunityOwnerReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    };


    function _onUpdateCommunityOwnerReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _extras = content.extras;
        var _communityOwnerUpdateNotification = new CommunityOwnerUpdateNotification();
        var _preOwnerList = _communityOwnerUpdateNotification.getPreOwnerList();
        if(_extras != null) {
            var _preOwnerItems = Utils.getSafeArrayData(_extras.preOwnerItems);
            for(var _i = 0; _i < _preOwnerItems.length; _i++) {
                _preOwnerList.add(Utils.getSafeStringData(_preOwnerItems[_i]));
            }
        }
        var _items = Utils.getSafeArrayData(content.items);
        if(_items.length <= 0) {
            return;
        }
        var _item = _items[0];
        _communityOwnerUpdateNotification.setRoomId(Utils.getSafeStringData(_item.roomId));
        var _ownerList = _communityOwnerUpdateNotification.getOwnerList();
        var _ownerItems = Utils.getSafeArrayData(_item.ownerItems);
        for(var _i = 0; _i < _ownerItems.length; _i++) {
            _ownerList.add(Utils.getSafeStringData(_ownerItems[_i]));
        }
        _self._onNotificationCallback(_communityOwnerUpdateNotification);
    };

    function _onRemoveMember(_self, receiveObject) {
        var _content = receiveObject.content;
        if (_content == null) {
            console.log('_content is null');
            return;
        }
        switch(_content.type) {
            case ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM:
                _onRemoveCommunityMemberReceived(_self, _content);
                break;
            case ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM:
                _onRemoveGroupChatMemberReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    };
    function _onRemoveCommunityMemberReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            var _notification = new CommunityMemberRemoveNotification();
            _notification.setRoomId(Utils.getSafeStringData(_item.roomId));
            _notification.setRoomName(Utils.urldecode(Utils.getSafeStringData(_item.roomName)));
            _notification.setRemovedBy(Utils.getSafeStringData(_item.removedBy));
            var _removedMemberList = _notification.getRemovedMemberList();
            var _memberItems = Utils.getSafeArrayData(_item.members);
            var _memberItemsCount = _memberItems.length;
            for (var _j = 0; _j < _memberItemsCount; _j++) {
                _removedMemberList.add(_memberItems[_j]);
            }
            _self._onNotificationCallback(_notification);
        }
    };

    function _onRemoveGroupChatMemberReceived(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items is null.');
            return;
        }
        var _items = Utils.getSafeArrayData(content.items);
        var _itemCount = _items.length;
        for (var _i = 0; _i < _itemCount; _i++) {
            var _item = _items[_i];
            if(_item.members == null){
                continue;
            }
            var _roomInfo = _getRoomInfoFromRoomInfoItem(_item);
            var _notification = new GroupChatRemoveMemberNotification();
            _notification.setRoomInfo(_roomInfo);
            _notification.setRemovedBy(_item.removedBy);
            var _sMemberItems = Utils.getSafeArrayData(_item.members);
            var _sMemberItemsCount = _sMemberItems.length;
            for (var _j = 0; _j < _sMemberItemsCount; _j++) {
                var _memberItem = _sMemberItems[_j];
                if (_memberItem == null || _memberItem == '') {
                    continue;
                }
                _notification.getRemovedMemberList().add(_memberItem);
            }

            _self._onNotificationCallback(_notification);
        }
    };

    function _onAuthorityChanged(_self, received) {
        if (received == null || received['content'] == null) {
            console.log('received or received.content null.');
            return;
        }
        var _item = received.content;
        var _type = _item.type;
        var _data = null;
        switch(_type) {
        case AuthorityInfoUpdateNotification.SUB_TYPE_ASSIGN_ROLE:
            _data = _getRoleInfoFromResponseItem(_item.role);
            break;
        case AuthorityInfoUpdateNotification.SUB_TYPE_POLICY_ASSIGN:
        case AuthorityInfoUpdateNotification.SUB_TYPE_POLICY_UNASSIGN:
            _data = _getPolicyInfoFromResponseItem(_item.policy);
            break;
        default:
            return;
        }
        var _notification = new AuthorityInfoUpdateNotification();
        if(received.content.hasOwnProperty('triger')){
          _notification.setTriger(received.content.triger);
        }
        _notification.setSubType(_type);
        _notification.setUpdatedItem(_data);

        _self._onNotificationCallback(_notification);
    }

    function _onUserFollowChanged(_self, receiveObject) {
        var _content = receiveObject.content;
        if(_content == null) {
            console.log('_content is null');
            return;
        }
        switch(receiveObject.content.type) {
            case 'addUserFollow':
                _onAddUserFollowReceived(_self, _content);
                break;
            case 'delUserFollow':
                _onDelUserFollowReceived(_self, _content);
                break;
            default:
                console.log('_content.type is invalid');
                break;
        }
    }

    function _onAddUserFollowReceived(_self, content) {
        if (content == null ||
            !content.type || !content.followeeJid || !content.followerJid) {
            console.log('content or content.items is null.');
            return;
        }
        var _addUserFollow = new UserFollowNotification();
        _actionType = UserFollowNotification.ACTION_TYPE_ADD;
        _addUserFollow.setActionType(Utils.getSafeStringData(content.type));
        _addUserFollow.setFolloweeJid(Utils.getSafeStringData(content.followeeJid));
        _addUserFollow.setFollowerJid(Utils.getSafeStringData(content.followerJid));
        var _follow = content.personInfo;
        var _followUser = Object.keys(_follow).length;
        var _personInfo = new ArrayList();
        var _doneList = {};
        for (var i = 0 ; i < _followUser ; i++) {
            Object.keys(_follow).forEach(function (k) {
                var _person = new Person();
                _person.setJid(Utils.getSafeStringData(k));
                var _groupList = [];
                var _groups = _follow[k].group;
                for(var j = 0 ; j < _groups.length ; j++) {
                    _groupList.push(Utils.urldecode(Utils.getSafeStringData(_groups[j])));
                }
                var _nickName = Utils.getSafeStringData(_follow[k].nickName);
                if (_nickName == '') {
                    _nickName = Utils.getSafeStringData(_follow[k].userName);
                }
                _nickName = Utils.urldecode(_nickName);
                _person.setUserName(_nickName);
                _person.setGroup(_groupList);
                _person.setLoginAccount(Utils.urldecode(Utils.getSafeStringData(_follow[k].userName)));
                _person.setAvatarData(Utils.getSafeStringData(_follow[k].avatarData));
                _person.setAvatarType(Utils.getSafeStringData(_follow[k].avatarType));
                if(!_doneList[_person.getJid()]){
                    _personInfo.insert(i, _person);
                    _doneList[_person.getJid()] = true;
                }
            });
            _addUserFollow.setPersonInfo(_personInfo);
        };

        _self._onNotificationCallback(_addUserFollow);
    }

    function _onDelUserFollowReceived(_self, content) {
        if (content == null ||
            !content.type || !content.followeeJid || !content.followerJid) {
            console.log('content or content.items is null.');
            return;
        }
        var _delUserFollow = new UserFollowNotification();
        _actionType = UserFollowNotification.ACTION_TYPE_DEL;
        _delUserFollow.setActionType(Utils.getSafeStringData(content.type));
        _delUserFollow.setFolloweeJid(Utils.getSafeStringData(content.followeeJid));
        _delUserFollow.setFollowerJid(Utils.getSafeStringData(content.followerJid));
        var _follow = content.personInfo;
        var _followUser = Object.keys(_follow).length;
        var _personInfo = new ArrayList();
        var _doneList = {};
        for (var i = 0 ; i < _followUser ; i++) {
            Object.keys(_follow).forEach(function (k) {
                var _person = new Person();
                _person.setJid(Utils.getSafeStringData(k));
                var _groupList = [];
                var _groups = _follow[k].group;
                for(var j = 0 ; j < _groups.length ; j++) {
                    _groupList.push(Utils.urldecode(Utils.getSafeStringData(_groups[j])));
                }
                var _nickName = Utils.getSafeStringData(_follow[k].nickName);
                if (_nickName == '') {
                    _nickName = Utils.getSafeStringData(_follow[k].userName);
                }
                _nickName = Utils.urldecode(_nickName);
                _person.setUserName(_nickName);
                _person.setGroup(_groupList);
                _person.setLoginAccount(Utils.urldecode(Utils.getSafeStringData(_follow[k].userName)));
                _person.setAvatarData(Utils.getSafeStringData(_follow[k].avatarData));
                _person.setAvatarType(Utils.getSafeStringData(_follow[k].avatarType));
                if(!_doneList[_person.getJid()]){
                    _personInfo.insert(i, _person);
                    _doneList[_person.getJid()] = true;
                }
            });
            _delUserFollow.setPersonInfo(_personInfo);
        };

        _self._onNotificationCallback(_delUserFollow);
    }

    function _onThreadTitleChanged(_self, received) {
        if (received == null || received['content'] == null) {
            console.log('receive or received.content null.');
            return;
        }
        if (!received.content.items || !Array.isArray(received.content.items)) {
            console.log('threadtitle update receive object is error');
            return;
        }

        var _notification = new ThreadTitleUpdateNotification();
        if (!received.content.items[0].hasOwnProperty('threadRootId') ||
            !received.content.items[0].hasOwnProperty('threadTitle') ||
            !received.content.items[0].hasOwnProperty('itemId')) {
            console.log('threadTitle update error');
        }
        _notification.setThreadRootId(received.content.items[0].threadRootId);
        _notification.setThreadTitle(decodeURIComponent(received.content.items[0].threadTitle));
        _notification.setItemId(received.content.items[0].itemId);

        _self._onNotificationCallback(_notification);
    }

    function _onNoteChanged(_self, received) {
        if (received == null || received['content'] == null) {
            console.log('receive or received.content null.');
            return;
        }

        switch(received.notify) {
            case ApiCubee.API_UPDATE_NOTE:
                var _notification = new NoteAssignChangedNotification();
                if (!received.content.hasOwnProperty('note_title') ||
                    !received.content.hasOwnProperty('note_url') ||
                    !received.content.hasOwnProperty('old_thread_root_id') ||
                    !received.content.hasOwnProperty('thread_root_id') ||
                    !received.content.hasOwnProperty('room_id') ||
                    !received.content.hasOwnProperty('ownjid')) {
                    console.log('note update error');
                }
                _notification.setNoteTitle(decodeURIComponent(received.content.note_title));
                _notification.setNoteUrl(received.content.note_url);
                _notification.setOldThreadRootId(received.content.old_thread_root_id);
                _notification.setThreadRootId(received.content.thread_root_id);
                _notification.setRoomId(received.content.room_id);
                _notification.setOwnJid(received.content.ownjid);

                _self._onNotificationCallback(_notification);
                break;
            case ApiCubee.API_DELETE_NOTE:
                var _notification = new NoteDeleteNotification();
                if (!received.content.hasOwnProperty('note_title') ||
                    !received.content.hasOwnProperty('note_url') ||
                    !received.content.hasOwnProperty('thread_root_id') ||
                    !received.content.hasOwnProperty('room_id') ||
                    !received.content.hasOwnProperty('ownjid')) {
                    console.log('note update error');
                }
                _notification.setNoteTitle(decodeURIComponent(received.content.note_title));
                _notification.setNoteUrl(received.content.note_url);
                _notification.setThreadRootId(received.content.thread_root_id);
                _notification.setRoomId(received.content.room_id);
                _notification.setOwnJid(received.content.ownjid);

                _self._onNotificationCallback(_notification);
                break;
            default:
                break;
        }
    }

    function _onMurmurChanged(_self, received) {
        if (received == null || received['content'] == null) {
            console.log('receive or received.content null.');
            return;
        }
        if(typeof received.content.type === "string"){
            switch(received.content.type){
                case "SetColumnName":
                    var _notification = new MurmurSetColumnNameNotification();
                    if (! typeof received.content.jid == 'string' ||
                        ! typeof received.content.columnName == 'string') {
                        console.log('threadTitle update error');
                        break;
                    }
                    _notification.setJid(received.content.jid);
                    _notification.setColumnName(decodeURIComponent(received.content.columnName));

                    _self._onNotificationCallback(_notification);
                    break;
            }
        }
    }

    function _onMessageChanged(_self, content) {
        if (content == null || content.items == null) {
            console.log('content or content.items null.');
            return;
        }

        var _items = Utils.getSafeArrayData(content.items);
        for (var i=0; i<_items.length; i++) {
            var _item = _items[i];
            var _messageObject = _getMessageFromMessageItem(_self, _item);
            var _notification = new MessageUpdateNotification();
            _notification.setMessage(_messageObject);
            _self._onNotificationCallback(_notification);
        }
    }

    function _getItemIdFromdeleteMessageItem(itemData) {
        var _itemId = itemData.itemId;
        return _itemId;
    };

    function _getDeleteFlagFromdeleteMessageItem(itemData) {
        var _deleteFlag = itemData.deleteFlag;
        return _deleteFlag;
    };

    function _getAdminDeletedFromdeleteMessageItem(itemData) {
        var _adminDeleted = false;
        if ("AdminDeleted" in itemData) {
            _adminDeleted = itemData.AdminDeleted;
        }
        return _adminDeleted;
    };

    function _onDisconnected(_self) {
        if (_self._onDisconnectCallBack != null) {
            _self._onDisconnectCallBack();
        }
        _cleanUp(_self);
    };

    function _onError(_self, err) {
        var _err = {};
        _err.message = err;
        _self._onErrorCallBack(_err);
    };

    function _sendMessage(_self, data, id, callbackFunc) {
        if (_self == null) {
            return false;
        }
        if (data == null || typeof data != 'string') {
            return false;
        }
        if (id != null) {
            if ( typeof id != 'string' || id == '') {
                return false;
            } else if (callbackFunc == null || typeof callbackFunc != 'function') {
                return false;
            }
        }
        if (_self._serverConnector == null) {
            return false;
        }
        if (id != null) {
            _setCallback(_self, id, callbackFunc);
        }
        return _self._serverConnector.sendData(data);
    }

    function _onReceived(_self, data) {
        var _receiveObject = null;
        try {
            _receiveObject = JSON.parse(data);
        } catch(e) {
            console.log('receive data is not json format. receive data : ' + data);
            return;
        }
        if (_receiveObject.request != null) {
            var _id = _receiveObject.id;
            var _callbackFunc = _getCallback(_self, _id);
            if (_callbackFunc != null) {
                _unsetCallback(_self, _id);
                if ( typeof _callbackFunc == 'function') {
                    setTimeout(function() {
                        _callbackFunc(_receiveObject);
                    }, 1);
                }
            }
            return;
        }
        if (_receiveObject.notify != null) {
            switch(_receiveObject.notify) {
                case ApiCubee.API_CHANGE_PERSON_DATA:
                    _onChangePersonData(_self, _receiveObject);
                    break;
                case ApiCubee.API_NOTIFICATION:
                    _onNotification(_self, _receiveObject);
                    break;
                case ApiCubee.API_MESSAGE:
                    _onMessage(_self, _receiveObject);
                    break;
                case ApiCubee.API_MESSAGE_OPTION:
                    _onMessageOption(_self, _receiveObject);
                    break;
                case ApiCubee.API_CREATE_GROUP:
                    _onCreateGroup(_self, _receiveObject);
                    break;
                case ApiCubee.API_ADD_MEMBER:
                    _onAddMember(_self, _receiveObject);
                    break;
                case ApiCubee.API_UPDATE_GROUP:
                    _onUpdateGroupInfo(_self, _receiveObject);
                    break;
                case ApiCubee.API_UPDATE_MEMBER:
                    _onUpdateMember(_self, _receiveObject);
                    break;
                case ApiCubee.API_REMOVE_MEMBER:
                    _onRemoveMember(_self, _receiveObject);
                    break;
                case ApiCubee.API_AUTHORIY_CHANGED:
                    _onAuthorityChanged(_self, _receiveObject);
                    break;
                case ApiCubee.API_USER_FOLLOW:
                    _onUserFollowChanged(_self, _receiveObject);
                    break;
                case ApiCubee.API_THREAD_TITLE:
                    _onThreadTitleChanged(_self, _receiveObject);
                    break;
                case ApiCubee.API_UPDATE_NOTE:
                case ApiCubee.API_DELETE_NOTE:
                    _onNoteChanged(_self, _receiveObject);
                    break;
                case ApiCubee.API_MURMUR:
                    _onMurmurChanged(_self, _receiveObject);
                    break;
                default:
                    console.log('_receiveObject.notify is invalid');
                    break;
            }
            return;
        }
    }

    function _setCallback(_self, id, callbackFunc) {
        if (_self == null) {
            return;
        }
        if (id == null || typeof id != 'string' || id == '') {
            return;
        }
        if (callbackFunc == null || typeof callbackFunc != 'function') {
            return;
        }
        if (_self._callBacks == null) {
            return;
        }
        _self._callBacks[id] = callbackFunc;
    };

    function _getCallback(_self, id) {
        if (_self == null) {
            return null;
        }
        if (id == null || typeof id != 'string' || id == '') {
            return null;
        }
        if (_self._callBacks == null) {
            return null;
        }
        return _self._callBacks[id];
    };

    function _unsetCallback(_self, id) {
        if (_self == null) {
            return;
        }
        if (id == null || typeof id != 'string' || id == '') {
            return;
        }
        if (_self._callBacks == null) {
            return;
        }
        delete _self._callBacks[id];
    };

    function _getFilterMyMemoStr(presence, myMemoString) {
        var _ret = '';
        switch(presence) {
            case Person.PRESENCE_STATUS_OFFLINE:
                break;
            default:
                if (myMemoString != 'Available') {
                    _ret = myMemoString;
                }
                break;
        }
        return _ret;
    };

    function _getPersonDataFromResponseItem(item) {
        var _person = new Person();
        _person.setId(Utils.getSafeNumberData(item.id))
        _person.setJid(Utils.getSafeStringData(item.jid));
        var _nickName = Utils.getSafeStringData(item.nickName);
        if (_nickName == '') {
            _nickName = Utils.getSafeStringData(item.userName);
        }
        _nickName = Utils.urldecode(_nickName);
        _person.setUserName(_nickName);
        var _mailAddress = Utils.getSafeStringData(item.mailAddress);
        if (_mailAddress) {
          _person.setMailAddress(Utils.getSafeStringData(_mailAddress));
        }
        var _groups = Utils.getSafeArrayData(item.groupItems);
        var _groupList = [];
        for(var j=0; j<_groups.length; j++){
            _groupList.push(Utils.urldecode(_groups[j]));
        }
        _person.setGroup(_groupList);
        _person.setPresence(Utils.getSafeNumberData(item.presence));
        _person.setMyMemo(Utils.urldecode(Utils.getSafeStringData(item.myMemo)));
        _person.setAvatarType(Utils.getSafeStringData(item.avatarType));
        _person.setAvatarData(Utils.getSafeStringData(item.avatarData));
        _person.setLoginAccount(Utils.getSafeStringData(item.userName));
        _person.setStatus(Utils.getSafeNumberData(item.status));
        return _person;
    };

    function _getRoleInfoFromResponseItem(item) {
        var _role = new Role();
        _role.setId(Utils.getSafeStringData(item.id));
        _role.setTranslations(item.t);
        return _role;
    }

    function _getPolicyInfoFromResponseItem(item) {
        var _policy = new Policy();
        _policy.setId(Utils.getSafeStringData(item.id));
        _policy.setTranslations(item.t);
        return _policy;
    }

    function _getItemsFromReceiveObject(receiveObject){
        var _result = false;
        var _items = null;

        if (receiveObject.errorCode != 0 || receiveObject.content == null || receiveObject.content.result == false) {
            return [_result, _items];
        }
        var _receiveContent = receiveObject.content;
        var _items = Utils.getSafeArrayData(_receiveContent.items);
        if(_items.length <= 0) {
            return [_result, _items];
        }
        _result = true;
        return [_result, _items];
    }
})();

function ConnectReceiveData() {
    this._loginUserPerson = null;
    this._contactList = null;
};(function() {
    var _proto = ConnectReceiveData.prototype;
    _proto.getLoginUserPerson = function() {
        return this._loginUserPerson;
    };
    _proto.setLoginUserPerson = function(loginUserPerson) {
        if (loginUserPerson == null || typeof loginUserPerson != 'object') {
            return;
        }
        this._loginUserPerson = loginUserPerson;
    };
    _proto.getContactList = function() {
        return this._contactList;
    };
    _proto.setContactList = function(contactList) {
        if (contactList == null || typeof contactList != 'object') {
            return;
        }
        this._contactList = contactList;
    };
})();
