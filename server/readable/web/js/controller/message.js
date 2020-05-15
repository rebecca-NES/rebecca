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
function MessageManager() {
    this._replyManager = new ReplyManager();
    this._childrenManager = new TaskChildrenManager();
    this._messageDataList = new MessageDataList();
    this._viewRefarenceCounter = {};
};(function() {
    var _proto = MessageManager.prototype;
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
        function callBackFunc(taskMessageDataList, unfinishedTaskCount, childrenTaskMessageDataList) {
            var _count = taskMessageDataList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                _self._addMessage(taskMessageDataList.get(_i));
            }
            // This guard always evaluates to true.
            if (childrenTaskMessageDataList != undefined /* && childrenTaskMessageDataList != null */) {
                var _childrenCount = childrenTaskMessageDataList.getCount();
                for (var _i = 0; _i < _childrenCount; _i++) {
                    _self._addMessage(childrenTaskMessageDataList.get(_i));
                }
            }
            onGetTaskMessageCallbak(taskMessageDataList, unfinishedTaskCount);
        }

        return CubeeServerConnector.getInstance().getTaskMessages(baseId, count, filter, sort, callBackFunc);
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
        function callBackFunc(chatMessageDataList) {
            var _count = chatMessageDataList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                _self._addMessage(chatMessageDataList.get(_i));
            }
            onGetChatMessageCallbak(chatMessageDataList);
        }

        return CubeeServerConnector.getInstance().getChatMessages(baseId, count, messageTo, callBackFunc);
    };

    _proto.getQuestionnaireMessages = function(startId, count, sort, onGetQuestionnaireMessagesCallback) {
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
        if (onGetQuestionnaireMessagesCallback == null || typeof onGetQuestionnaireMessagesCallback != 'function') {
            return false;
        }
        function callbackFunc(questionnaireMessageDataList) {
            var _count = questionnaireMessageDataList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                _self._addMessage(questionnaireMessageDataList.get(_i));
            }
            onGetQuestionnaireMessagesCallback(questionnaireMessageDataList);
        }
        return CubeeServerConnector.getInstance().getQuestionnaireMessages(startId, count, sort, callbackFunc);
    };
    _proto.sendVoteMessage = function(onSendVoteMessageCallback, msgto, itemId, optionItems) {
        if (msgto == null || typeof msgto != 'string') {
            return false;
        }
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (optionItems == null || typeof optionItems != 'object') {
            return false;
        }
        if (onSendVoteMessageCallback == null || typeof onSendVoteMessageCallback != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().sendVoteMessage(onSendVoteMessageCallback, msgto, itemId, optionItems);
    };

    _proto.sendPublicMessage = function(messageBody, replyItemId, messageTitle='', callback) {
        var _self = this;
        if (messageBody == null || typeof messageBody != 'string') {
            return false;
        }
        if (replyItemId == null || typeof replyItemId != 'string') {
            return false;
        }
        if (callback == null || typeof callback != 'function') {
            return false;
        }
        var _message = new PublicMessage();
        _message.setMessage(messageBody);
        _message.setReplyItemId(replyItemId);
        _message.setThreadTitle(messageTitle);
        return CubeeServerConnector.getInstance().sendPublicMessage(_message, callback);
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
        function callBackFunc(history) {
            if (history == null) {
                onGetPublicMessage(null);
                return;
            }
            var _historyCount = history.length;
            for (var _i = 0; _i < _historyCount; _i++) {
                var _historyMessage = history[_i];
                var _message = null;
                switch(_historyMessage.type) {
                    case Message.TYPE_PUBLIC:
                        _message = new PublicMessage();
                        _message.setReplyTo(_historyMessage.replyTo);
                        _message.setReplyItemId(_historyMessage.replyId);
                        _message.setPublishNode(_historyMessage.publishNode);
                        _message.setDeleteFlag(_historyMessage.deleteFlag);
                        break;
                    case Message.TYPE_CHAT:
                        _message = new ChatMessage();
                        _message.setTo(_historyMessage.to);
                        _message.setDirection(_historyMessage.direction);
                        _message.setDeleteFlag(_historyMessage.deleteFlag);
                        break;
                    case Message.TYPE_GROUP_CHAT:
                        _message = new GroupChatMessage();
                        _message.setTo(_historyMessage.to);
                        _message.setDirection(_historyMessage.direction);
                        _message.setRoomName(_historyMessage.roomName);
                        _message.setReplyTo(_historyMessage.replyTo);
                        _message.setReplyItemId(_historyMessage.replyId);
                        _message.setDeleteFlag(_historyMessage.deleteFlag);
                        break;
                    case Message.TYPE_TASK:
                        _message = new TaskMessage();
                        break;
                    case Message.TYPE_COMMUNITY:
                        _message = new CommunityMessage();
                        break;
                    case Message.TYPE_SYSTEM:
                        _message = new SystemMessage();
                        _message.setReplyTo(_historyMessage.replyTo);
                        _message.setReplyItemId(_historyMessage.replyId);
                        _message.setTriggerAction(_historyMessage.triggerAction);
                        break;
                    case Message.TYPE_QUESTIONNAIRE:
                        _message = new QuestionnaireMessage();
                        _message.setRoomType(_historyMessage.roomType);
                        _message.setRoomId(_historyMessage.roomId);
                        _message.setRoomName(_historyMessage.roomName);
                        _message.setGraphType(_historyMessage.graphType);
                        _message.setInputType(_historyMessage.inputType);
                        _message.setResultVisible(_historyMessage.resultVisible);
                        var itemArray = new ArrayList();
                        for (var i = 0; i < _historyMessage.optionCount; i++) {
                            var item = _historyMessage.optionItems.get(i);
                            var itemStr = Utils.urldecode(Utils.getSafeStringData(item.option));
                            var itemObject = new Object();
                            itemObject.option = itemStr;
                            itemObject.optionId = item.optionId;
                            itemObject.optionValue = item.optionValue;
                            itemArray.add(itemObject);
                        }
                        _message.setOptionItems(itemArray);
                        _message.setOptionCount(_historyMessage.optionCount);
                        _message.setVoteFlag(!!_historyMessage.voteFlag);
                        _message.setStartDate(_historyMessage.startDate);
                        _message.setDueDate(_historyMessage.dueDate);
                        _message.setDeleteFlag(_historyMessage.deleteFlag);
                        break;
                    case Message.TYPE_UNKNOWN:
                    default:
                        _message = new Message();
                        break;
                }
                _message.setFrom(_historyMessage.from);
                _message.setMessage(_historyMessage.body);
                _message.setDate(_historyMessage.date);
                _message.setUpdatedAt(_historyMessage.updatedAt);
                _message.setItemId(_historyMessage.itemId);
                _message.setId(_historyMessage.id);
                _message.setHistory(true);
                _message.setReadFlag(_historyMessage.readFlag);
                _message.setProfileMap(_historyMessage.profileMap);
                _message.setThreadTitle(_historyMessage.threadTitle);
                _message.setThreadRootId(_historyMessage.threadRootId);
                _message.setNoteTitle(_historyMessage.noteTitle);
                _message.setNoteUrl(_historyMessage.noteUrl);
                _message.setBodyType(_historyMessage.bodyType);
                if(_historyMessage.existingReaderInfo != null){
                    _message.setExistingReaderInfo(_historyMessage.existingReaderInfo);
                }
                _message.setEmotionIconList(_historyMessage.emotionPointIcons);
                for (var i=0; i<_historyMessage.emotionPoint._length; i++) {
                    _message.getEmotionPointList().add(_historyMessage.emotionPoint.get(i));
                }
                _message.setUIShortenUrls(_historyMessage.shortenItems);

                _self._addMessage(_message);
                var _goodJobListHistory = _historyMessage.goodJob;
                if (_goodJobListHistory != null) {
                    var _goodJobHistoryCount = _goodJobListHistory.getCount();
                    var _notificationManager = getNotificationManager();
                    if (_notificationManager != null) {
                        for (var _j = 0; _j < _goodJobHistoryCount; _j++) {
                            _notificationManager.onNotificationReceived(_goodJobListHistory.get(_j));
                        }
                    }
                }


                if(_i+1 == _historyCount) {
                    onGetPublicMessage(_message, true);
                } else {
                    onGetPublicMessage(_message, false);
                }
            }
        }

        return CubeeServerConnector.getInstance().getPublicMessages(startId, count, callBackFunc);
    };
    _proto.sendGroupChatMessage = function(groupChatMessage, callback) {
        var _self = this;
        if (groupChatMessage == null || typeof groupChatMessage != 'object') {
            return false;
        }
        if (callback == null || typeof callback != 'function'){
            return false;
        }
        return CubeeServerConnector.getInstance().sendGroupChatMessage(groupChatMessage, callback);
    };
    _proto.sendCommunityMessage = function(communityMessage, onSendCommunityMessageCallback) {
        var _self = this;
        if (communityMessage == null || typeof communityMessage != 'object') {
            return false;
        }
        if (onSendCommunityMessageCallback != null && typeof onSendCommunityMessageCallback != 'function') {
            return false;
        }
        function _callback(sendedCommunityMessage) {
            if(onSendCommunityMessageCallback != null) {
                onSendCommunityMessageCallback(sendedCommunityMessage);
            }
        }
        return CubeeServerConnector.getInstance().sendCommunityMessage(communityMessage, _callback);
    };
    _proto.sendMurmurMessage = function(murmurMessage, onSendMurmurMessageCallback) {
        var _self = this;
        if (murmurMessage == null || typeof murmurMessage != 'object') {
            return false;
        }
        if (onSendMurmurMessageCallback != null && typeof onSendMurmurMessageCallback != 'function') {
            return false;
        }
        function _callback(sendedMurmurMessage) {
            if(onSendMurmurMessageCallback != null) {
                onSendMurmurMessageCallback(sendedMurmurMessage);
            }
        }
        return CubeeServerConnector.getInstance().sendMurmurMessage(murmurMessage, _callback);
    };
    _proto.getReplyReverseItemIds = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        return _self._replyManager.getReplyReverseItemIds(itemId);
    };
    _proto.getChildrenTaskItemIds = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        return _self._childrenManager.getChildrenTaskItemIds(itemId);
    };
    _proto.sendChatMessage = function(message, callback) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return false;
        }
        if (callback == null || typeof callback != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().sendChatMessage(message, callback);
    };
    _proto.onMessageReceived = function(message) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return;
        }
        _self._addMessage(message);
    };
    _proto.getMessage = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        return _self._messageDataList.getByItemId(itemId);
    };
    _proto.getAllMessage = function() {
        var _self = this;
        return _self._messageDataList;
    };
    _proto._addMessage = function(message) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return;
        }
        var _messageType = message.getType();
        switch(_messageType) {
            case Message.TYPE_PUBLIC:
            case Message.TYPE_GROUP_CHAT:
            case Message.TYPE_COMMUNITY:
            case Message.TYPE_MURMUR:
                _self._replyManager.addMessage(message);
                break;
            case Message.TYPE_TASK:
                _self._childrenManager.addMessage(message);
                break;
            default:
                break;
        }
        _self._messageDataList.add(message);
    };
    _proto.sendGoodJob = function(itemId, onSendGoodJobCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendGoodJobCallback == null || typeof onSendGoodJobCallback != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().sendGoodJob(itemId, onSendGoodJobCallback);
    };
    _proto.sendDemandTask = function(itemId, onSendDemandTaskCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendDemandTaskCallback == null || typeof onSendDemandTaskCallback != 'function') {
            return false;
        }
        var _targetMessage = _self.getMessage(itemId);
        if (_targetMessage == null) {
            return false;
        }
        var _userJid = LoginUser.getInstance().getJid();
        if (_userJid == null || _userJid == '') {
            return false;
        }
        return CubeeServerConnector.getInstance().sendDemandTask(itemId, onSendDemandTaskCallback);
    };
    _proto.sendClearDemandedTask = function(itemId, onSendClearDemandedTaskCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendClearDemandedTaskCallback == null || typeof onSendClearDemandedTaskCallback != 'function') {
            return false;
        }
        var _userJid = LoginUser.getInstance().getJid();
        if (_userJid == null || _userJid == '') {
            return false;
        }
        return CubeeServerConnector.getInstance().sendClearDemandedTask(itemId, onSendClearDemandedTaskCallback);
    };
    _proto.sendGetExistingReaderList = function(itemId, onGetExistingReaderListCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetExistingReaderListCallback == null || typeof onGetExistingReaderListCallback != 'function') {
            return false;
        }
        var _userJid = LoginUser.getInstance().getJid();
        if (_userJid == null || _userJid == '') {
            return false;
        }
        return CubeeServerConnector.getInstance().sendGetExistingReaderList(itemId, onGetExistingReaderListCallback);
    };
    _proto.sendSetReadOneMessage = function(itemId, onSendSetReadOneMessageCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onSendSetReadOneMessageCallback == null || typeof onSendSetReadOneMessageCallback != 'function') {
            return false;
        }
        var _callcack = function(itemIdList) {
            if(itemIdList == null){
                onSendSetReadOneMessageCallback(null);
                return;
            }
            var _count = itemIdList.getCount();
            if(_count == 0){
                onSendSetReadOneMessageCallback(null);
                return;
            }
            var _itemId = itemIdList.get(0);
            onSendSetReadOneMessageCallback(_itemId);
            return;
        };
        return CubeeServerConnector.getInstance().sendSetReadOneMessage(itemId, _callcack);
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
        switch(_type) {
            case Notification_model.TYPE_GOOD_JOB:
                var _goodJobNotification = notification;
                var _itemId = _goodJobNotification.getItemId();
                var _targetMessage = _self.getMessage(_itemId);
                if (_targetMessage == null) {
                    return;
                }
                var _gjJid = _goodJobNotification.getFromJid();
                var _targetGoodJobList = _targetMessage.getGoodJobList();
                var _goodJobData = _targetGoodJobList.getByJid(_gjJid);
                if (_goodJobData != null) {
                }
                _goodJobData = new GoodJobData();
                _goodJobData.setJid(_gjJid);
                var _date = new Date(_goodJobNotification.getDate());
                _goodJobData.setDate(_date);
                _goodJobData.setNickName(_goodJobNotification.getNickName());
                _goodJobData.setAvatarType(_goodJobNotification.getAvatarType());
                _goodJobData.setAvatarData(_goodJobNotification.getAvatarData());
                _goodJobData.setLoginAccount(_goodJobNotification.getLoginAccount());
                _goodJobData.setStatus(_goodJobNotification.getStatus());

                _targetGoodJobList.add(_goodJobData);
                var _personManager = getPersonManager();
                if (_personManager != null) {
                    getPersonManager().onNotificationReceived(notification);
                }
                break;
            case Notification_model.TYPE_TASK:
                _self._onTaskNotificationReceived(notification);
                break;
            case Notification_model.TYPE_SYSTEM:
                _self._onSystemNotificationReceived(notification);
                break;
            case Notification_model.TYPE_MESSAGE_OPTION:
                _self._onMessageOptionReceived(notification);
                break;
            case Notification_model.TYPE_DELETE_MESSAGE:
                _self._onDeleteMessageNotificationReceived(notification);
                break;
            case Notification_model.TYPE_GROUP_CHAT:
                _self._onGroupChatMessageNotificationReceived(notification);
                break;
            case Notification_model.TYPE_MAIL:
                _self._onMailMessageNotificationReceived(notification);
                break;
            case Notification_model.TYPE_COMMUNITY:
                if(notification.getSubType() == CommunityNotification.SUB_TYPE_MESSAGE) {
                    _self._onCommunityMessageNotificationReceived(notification);
                }
                break;
            case Notification_model.TYPE_THREAD_TITLE:
                _self._onThreadTitleUpdateNotificationReceived(notification);
                break;
            case Notification_model.TYPE_MESSAGE_UPDATE:
                _self._onMessageUpdateNotificationReceived(notification);
                break;
            case Notification_model.TYPE_EMOTION_POINT:
                _self._onEmotionPointNotificationReceived(notification);
                break;
            case Notification_model.TYPE_ASSIGN_NOTE:
            case Notification_model.TYPE_DELETE_NOTE:
                _self._onNoteAssignChangedNotificationReceived(notification);
                break;
            case Notification_model.TYPE_QUESTIONNAIRE:
                _self._onQuestionnaireNotificationReceived(notification);
                break;
            case Notification_model.TYPE_MURMUR:
                if(notification.getSubType() == MurmurNotification.SUB_TYPE_MESSAGE) {
                    _self._onMurmurMessageNotificationReceived(notification);
                }else if(notification.getSubType() == MurmurNotification.SUB_TYPE_SET_COLUMN_NAME) {
                    _self._onMurmurSetColumnNameNotificationReceived(notification);
                }
                break;
            default:
                break;
        }
    };
    _proto.addQuestionnaire = function(questionnaireMessage, onAddQuestionnaireCallback) {
        var _self = this;
        if (questionnaireMessage == null || typeof questionnaireMessage != 'object') {
            return false;
        }
        if (onAddQuestionnaireCallback == null || typeof onAddQuestionnaireCallback != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().addQuestionnaire(questionnaireMessage, onAddQuestionnaireCallback);
    };
    _proto.addTask = function(taskMessage, onAddTaskCallback) {
        var _self = this;
        if (taskMessage == null || typeof taskMessage != 'object') {
            return false;
        }
        if (onAddTaskCallback == null || typeof onAddTaskCallback != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().addTask(taskMessage, onAddTaskCallback);
    };
    _proto.updateTask = function(taskMessage, onUpdateTaskCallback) {
        var _self = this;
        if (taskMessage == null || typeof taskMessage != 'object') {
            return false;
        }
        if (onUpdateTaskCallback == null || typeof onUpdateTaskCallback != 'function') {
            return false;
        }
        return CubeeServerConnector.getInstance().updateTask(taskMessage, onUpdateTaskCallback);
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
        return CubeeServerConnector.getInstance().deleteMessage(deleteMessage, deleteFlag, onDeleteMessageCallback);
    };
    _proto._onQuestionnaireNotificationReceived = function(questionnaireNotification) {
        var _self = this;
        if (questionnaireNotification == null || typeof questionnaireNotification != 'object') {
            return;
        }
        if (questionnaireNotification.getType == null) {
            return;
        }
        if (questionnaireNotification.getType() != Notification_model.TYPE_QUESTIONNAIRE) {
            return;
        }
        var _actionType = questionnaireNotification.getActionType();
        var _questionnaireMessage = questionnaireNotification.getQuestionnaireMessage();
        if (_actionType == null || _questionnaireMessage == null) {
            return;
        }
        switch(_actionType) {
            case QuestionnaireNotification.ACTION_TYPE_ADD:
                _self._addMessage(_questionnaireMessage);
                break;
            case QuestionnaireNotification.ACTION_TYPE_UPDATE:
                _self._addMessage(_questionnaireMessage);
                break;
            default:
                break;
        }
    };
    _proto._onTaskNotificationReceived = function(taskNotification) {
        var _self = this;
        if (taskNotification == null || typeof taskNotification != 'object') {
            return;
        }
        if (taskNotification.getType == null) {
            return;
        }
        if (taskNotification.getType() != Notification_model.TYPE_TASK) {
            return;
        }
        var _actionType = taskNotification.getActionType();
        var _taskMessage = taskNotification.getTaskMessage();
        if (_actionType == null || _taskMessage == null) {
            return;
        }
        switch(_actionType) {
            case TaskNotification.ACTION_TYPE_ADD:
                _self._addMessage(_taskMessage);
                break;
            case TaskNotification.ACTION_TYPE_UPDATE:
                var _preMessage = _self._messageDataList.getByItemId(_taskMessage.getItemId());
                if (_preMessage != null) {
                    _taskMessage.setPreStatus(_preMessage.getStatus());
                    _taskMessage.setPreOwnerJid(_preMessage.getOwnerJid());
                    _taskMessage.setPreTitle(_preMessage.getTitle());
                    _taskMessage.setPreMessage(_preMessage.getMessage());
                    _taskMessage.setPreProgress(_preMessage.getProgress());
                    _taskMessage.setPreSpentTime(_preMessage.getSpentTime());
                    _taskMessage.setPreEstimatedTime(_preMessage.getEstimatedTime());
                    _taskMessage.setPreRemainingTime(_preMessage.getRemainingTime());
                    _taskMessage.setPreGoal(_preMessage.getGoal());
                    _taskMessage.setPreAlert(_preMessage.getAlert());
                }
                _self._addMessage(_taskMessage);
                break;
            default:
                break;
        }
    };
    _proto._onSystemNotificationReceived = function(systemNotification) {
        var _self = this;
        if (systemNotification == null || typeof systemNotification != 'object') {
            return;
        }
        if (systemNotification.getType == null) {
            return;
        }
        if (systemNotification.getType() != Notification_model.TYPE_SYSTEM) {
            return;
        }
        var _systemMessage = systemNotification.getSystemMessage();
        if (_systemMessage == null) {
            return;
        }
        _self._addMessage(_systemMessage);
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
    _proto._onDeleteMessageNotificationReceived = function(deleteMessageNotification) {
        var _self = this;
        if (deleteMessageNotification == null || typeof deleteMessageNotification != 'object') {
            return;
        }
        if (deleteMessageNotification.getType == null) {
            return;
        }
        if (deleteMessageNotification.getType() != Notification_model.TYPE_DELETE_MESSAGE) {
            return;
        }
        var _itemId = deleteMessageNotification.getItemId();
        if (_itemId == null) {
            return;
        }

        var _deleteFlag = deleteMessageNotification.getDeleteFlag();
        var _targetMessage = _self.getMessage(_itemId);
        if(_targetMessage != null){
            _targetMessage.setDeleteFlag(deleteMessageNotification.getDeleteFlag());
            if(_deleteFlag == 2){
                var _adminDeleted = deleteMessageNotification.getAdminDeleted();
                if (_adminDeleted){
                    _targetMessage.setMessage("deleted_by_admin");
                } else {
                    _targetMessage.setMessage("deleted");
                }
                _targetMessage.getAttachedFileUrlList().removeAll();
            }
            _self._messageDataList.setByKey(_itemId, _targetMessage);
        }

        if (_deleteFlag != 2){
            _self._messageDataList.removeByKey(_itemId);
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

        var _itemId = siblingTaskNotification.getItemId();
        var _targetMessage = _self.getMessage(_itemId);
        if (_targetMessage == null) {
            return;
        }
        var _siblingItemId = siblingTaskNotification.getSiblingItemId();
        var _targetSiblingTaskList = _targetMessage.getSiblingTaskDataList();
        var _siblingTaskData = _targetSiblingTaskList.getBySiblingItemId(_siblingItemId);
        if (_siblingTaskData != null) {
            _siblingTaskData.setItemId(_itemId);
            _siblingTaskData.setSiblingOwnerJid(siblingTaskNotification.getOwnerJid());
            _siblingTaskData.setSiblingTaskStatus(siblingTaskNotification.getStatus());
        } else {
            _siblingTaskData = new SiblingTaskData();
            _siblingTaskData.setItemId(_itemId);
            _siblingTaskData.setSiblingItemId(_siblingItemId);
            _siblingTaskData.setSiblingOwnerJid(siblingTaskNotification.getOwnerJid());
            _siblingTaskData.setSiblingTaskStatus(siblingTaskNotification.getStatus());
            _siblingTaskData.setNickName(siblingTaskNotification.getNickName());
            _siblingTaskData.setAvatarType(siblingTaskNotification.getAvatarType());
            _siblingTaskData.setAvatarData(siblingTaskNotification.getAvatarData());
            _siblingTaskData.setLoginAccount(siblingTaskNotification.getLoginAccount());
            _siblingTaskData.setStatus(siblingTaskNotification.getUserStatus());

            _targetSiblingTaskList.add(_siblingTaskData);
        }
        var _personManager = getPersonManager();
        if (_personManager != null) {
            getPersonManager().onNotificationReceived(siblingTaskNotification);
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
        var _targetMessage = _self.getMessage(demandTaskNotification.getItemId());
        if (_targetMessage == null) {
            return;
        }
        _targetMessage.setDemandStatus(demandTaskNotification.getDemandStatus());
        _targetMessage.setDemandDate(demandTaskNotification.getDemandDate());

        var _personManager = getPersonManager();
        if (_personManager != null) {
            getPersonManager().onNotificationReceived(demandTaskNotification);
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
        var _message = _self.getMessage(setReadMessageNotification.getItemId());
        if (_message == null) {
            return;
        }
        var _personManager = getPersonManager();
        if (_personManager != null) {
            getPersonManager().onNotificationReceived(setReadMessageNotification);
        }
        var _existingReaderItem = setReadMessageNotification.getExistingReaderItem();
        if(LoginUser.getInstance().getJid() == _existingReaderItem.getPerson().getJid()){
            if(_message.getReadFlag() == Message.READ_STATUS_READ) {
                return;
            }
        }

        var _existingReaderInfo = _message.getExistingReaderInfo();
        if(_existingReaderInfo == null){
            _existingReaderInfo = new MessageExistingReaderInfo();
            _existingReaderInfo.setAllCount(1);
            _existingReaderInfo.getExistingReaderItemList().add(_existingReaderItem);
            _message.setExistingReaderInfo(_existingReaderInfo);
            return;
        }
        var _count = _existingReaderInfo.getAllCount();
        _existingReaderInfo.setAllCount(_count + 1);
        _existingReaderInfo.getExistingReaderItemList().removeAll();
        _existingReaderInfo.getExistingReaderItemList().add(_existingReaderItem);
    };
    _proto._onGroupChatMessageNotificationReceived = function(groupChatNotification) {
        var _self = this;
        if (groupChatNotification == null || typeof groupChatNotification != 'object') {
            return;
        }
        if (groupChatNotification.getType == null) {
            return;
        }
        if (groupChatNotification.getType() != Notification_model.TYPE_GROUP_CHAT) {
            return;
        }
        if (groupChatNotification.getSubType() != GroupChatNotification.SUB_TYPE_MESSAGE) {
            return;
        }
        var _groupChatMessage = groupChatNotification.getGroupChatMessage();
        if (_groupChatMessage == null) {
            return;
        }
        _self._addMessage(_groupChatMessage);
    };
    _proto._onMailMessageNotificationReceived = function(mailNotification) {
        var _self = this;
        if (mailNotification == null || typeof mailNotification != 'object') {
            return;
        }
        if (mailNotification.getType() == null) {
            return;
        }
        if (mailNotification.getType() != Notification_model.TYPE_MAIL) {
            return;
        }
        var _mailMessage = mailNotification.getMailMessage();
        if (_mailMessage == null) {
            return;
        }
        _self._addMessage(_mailMessage);
    };
    _proto._onCommunityMessageNotificationReceived = function(communityMessageNotification) {
        var _self = this;
        if (communityMessageNotification == null || typeof communityMessageNotification != 'object') {
            return;
        }
        if (communityMessageNotification.getType() != Notification_model.TYPE_COMMUNITY) {
            return;
        }
        if (communityMessageNotification.getSubType() != CommunityNotification.SUB_TYPE_MESSAGE) {
            return;
        }
        var _communityMessage = communityMessageNotification.getCommunityMessage();
        if (_communityMessage == null) {
            return;
        }
        _self._addMessage(_communityMessage);
    };
    _proto._onMurmurMessageNotificationReceived = function(murmurMessageNotification) {
        var _self = this;
        if (murmurMessageNotification == null || typeof murmurMessageNotification != 'object') {
            return;
        }
        if (murmurMessageNotification.getType() != Notification_model.TYPE_MURMUR) {
            return;
        }
        if (murmurMessageNotification.getSubType() != MurmurNotification.SUB_TYPE_MESSAGE) {
            return;
        }
        var _murmurMessage = murmurMessageNotification.getMurmurMessage();
        if (_murmurMessage == null) {
            return;
        }
        _self._addMessage(_murmurMessage);
    };
    _proto._onMurmurSetColumnNameNotificationReceived = function(murmurMessageNotification) {
        var _self = this;
        if (murmurMessageNotification == null || typeof murmurMessageNotification != 'object') {
            return;
        }
        if (murmurMessageNotification.getType() != Notification_model.TYPE_MURMUR) {
            return;
        }
        if (murmurMessageNotification.getSubType() != MurmurNotification.SUB_TYPE_SET_COLUMN_NAME) {
            return;
        }
        for (var i=0; i < _self._messageDataList._length; i++) {
            let mess = _self._messageDataList.get(i);
            if(mess.getType() == Message.TYPE_MURMUR &&
                mess.getTo() == murmurMessageNotification.getJid()){
                _self._messageDataList.get(i).setColumnName(murmurMessageNotification.getColumnName());
            }
        }
    };
    _proto._onThreadTitleUpdateNotificationReceived = function(notification) {
        var _self = this;
        if (notification == null || typeof notification != 'object') {
            return;
        }
        if (notification.getType() != Notification_model.TYPE_THREAD_TITLE) {
            return;
        }

        for (var i=0; i < _self._messageDataList._length; i++) {
            if(_self._messageDataList.get(i).getThreadRootId() == notification.getThreadRootId()){
                _self._messageDataList.get(i).setThreadTitle(notification.getThreadTitle());
            }
        }
    }

    _proto._onMessageUpdateNotificationReceived = function(notification) {
        var _self = this;
        if (notification == null || typeof notification != 'object') {
            return;
        }
        if (notification.getType() != Notification_model.TYPE_MESSAGE_UPDATE) {
            return;
        }

        var _itemId = notification.getMessage().getItemId();
        if (_self._messageDataList.getByKey(_itemId)){
            _self._messageDataList.setByKey(_itemId, notification.getMessage());
        }
    }

    _proto._onEmotionPointNotificationReceived = function(notification) {
        var _self = this;
        var _itemId = notification.getItemId();
        var _targetMessage = _self.getMessage(_itemId);
        if (_targetMessage==null) {
            return;
        }
        var _fromJid = notification.getFromJid();
        var _targetEmotionList = _targetMessage.getEmotionPointList();
        var _beforeEmotionPointData = _targetEmotionList.getByJid(_fromJid);
        var _emotionPoint = notification.getEmotionPoint();
        if (_beforeEmotionPointData) {
            var _beforePoint = _beforeEmotionPointData.getEmotionPoint();
            if (_beforePoint && _emotionPoint=="") {
                _targetEmotionList.removeByJid(_fromJid);
                return;
            } else if (_emotionPoint && _emotionPoint!=_beforePoint) {
                _targetEmotionList.getByJid(_fromJid).setEmotionPoint(_emotionPoint);
                return;
            }
        }
        if (_emotionPoint=="") {
            return;
        }

        var _emotionPointData = new EmotionPointData();
        _emotionPointData.setJid(_fromJid);
        var _createdAt = new Date(notification.getCreatedAt());
        var _updatedAt = new Date(notification.getUpdatedAt());
        _emotionPointData.setCreatedAt(_createdAt);
        _emotionPointData.setUpdatedAt(_updatedAt);
        _emotionPointData.setNickName(notification.getNickName());
        _emotionPointData.setAvatarType(notification.getAvatarType());
        _emotionPointData.setAvatarData(notification.getAvatarData());
        _emotionPointData.setLoginAccount(notification.getLoginAccount());
        _emotionPointData.setStatus(notification.getStatus());
        _emotionPointData.setEmotionPoint(_emotionPoint);
        _targetEmotionList.add(_emotionPointData);
        var _personManager = getPersonManager();
        if (_personManager != null) {
            getPersonManager().onNotificationReceived(notification);
        }
    }
    _proto._onNoteAssignChangedNotificationReceived = function(notification) {
        var _self = this;
        if (notification == null || typeof notification != 'object') {
            return;
        }
        var notificationType = notification.getType();
        if (notificationType != Notification_model.TYPE_ASSIGN_NOTE &&
            notificationType != Notification_model.TYPE_DELETE_NOTE) {
            return;
        }
        if (notificationType == Notification_model.TYPE_ASSIGN_NOTE) {
            var threadRootId = notification.getThreadRootId();
            var oldThreadRootId = notification.getOldThreadRootId();
            if (threadRootId && !oldThreadRootId) {
                for (var i=0; i < _self._messageDataList._length; i++) {
                    if(_self._messageDataList.get(i).getThreadRootId() == threadRootId){
                        _self._messageDataList.get(i).setNoteTitle(notification.getNoteTitle());
                        _self._messageDataList.get(i).setNoteUrl(notification.getNoteUrl());
                    }
                }
            } else if (oldThreadRootId && !threadRootId) {
                for (var i=0; i < _self._messageDataList._length; i++) {
                    if(_self._messageDataList.get(i).getThreadRootId() == oldThreadRootId){
                        _self._messageDataList.get(i).setNoteTitle('');
                        _self._messageDataList.get(i).setNoteUrl('');
                    }
                }
            }
        } else if(notificationType == Notification_model.TYPE_DELETE_NOTE) {
            var threadRootId = notification.getThreadRootId();
            for (var i=0; i < _self._messageDataList._length; i++) {
                if(_self._messageDataList.get(i).getThreadRootId() == threadRootId){
                    _self._messageDataList.get(i).setNoteTitle('');
                    _self._messageDataList.get(i).setNoteUrl('');
                }
            }
        }

    }

    _proto.getMailBody = function(itemId, onGetMailBodyCallback) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetMailBodyCallback != null && typeof onGetMailBodyCallback != 'function') {
            return false;
        }
        function callBackFunc(mailBodyInfo) {
            var _mailMessage = _self._messageDataList.getByItemId(mailBodyInfo.getItemId());
            if (_mailMessage != null) {
                var _mailBody = new MailBody();
                _mailBody.setItemId(mailBodyInfo.getItemId());
                _mailBody.setJid(mailBodyInfo.getJid());
                _mailBody.setBody(mailBodyInfo.getBody());
                _mailMessage.setBodyInfo(_mailBody);
            }
            _self._addMessage(_mailMessage);
            onGetMailBodyCallback(mailBodyInfo);
        }
        return CubeeServerConnector.getInstance().getMailBody(itemId, callBackFunc);
    };
    _proto.getThreadMessage = function(itemId, onGetThreadMessage) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        if (onGetThreadMessage != null && typeof onGetThreadMessage != 'function') {
            return false;
        }
        function callBackFunc(messageList) {
            onGetThreadMessage(messageList);
        }
        return CubeeServerConnector.getInstance().getThreadMessage(itemId, callBackFunc);
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
        function callBackFunc(resultMessageData) {
            var _count = resultMessageData.messageDataList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                _self._addMessage(resultMessageData.messageDataList.get(_i));
            }
            if (resultMessageData.childrenMessageDataList != null) {
                var _childrenCount = resultMessageData.childrenMessageDataList.getCount();
                for (var _i = 0; _i < _childrenCount; _i++) {
                    _self._addMessage(resultMessageData.childrenMessageDataList.get(_i));
                }
            }
            onSearchMessageCallback(resultMessageData);
        }

        return getSearchManager().searchMessage(startId, count, columnSearchCondition, callBackFunc);
    };
    _proto.onAddMessageView = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        var _message = _self._messageDataList.getByItemId(itemId);
        var _refarenceCounter = _self._viewRefarenceCounter;
        if(_message == null) {
            delete _refarenceCounter[itemId];
            return false;
        }
        if(_self._viewRefarenceCounter[itemId] == null) {
            _refarenceCounter[itemId] = 1;
        } else {
            _refarenceCounter[itemId] += 1;
        }
        return true;
    };

    _proto.onRemoveMessageView = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return false;
        }
        var _message = _self._messageDataList.getByItemId(itemId);
        var _refarenceCounter = _self._viewRefarenceCounter;
        if(_message == null) {
            delete _refarenceCounter[itemId];
            return false;
        }
        if(_self._viewRefarenceCounter[itemId] == null) {
            return false;
        } else {
            _refarenceCounter[itemId] -= 1;
        }
        if(_refarenceCounter[itemId] <= 0) {
            function _deleteMessageData() {
                if(_refarenceCounter[itemId] <= 0) {
                    _self._messageDataList.removeByKey(itemId);
                    _self._replyManager.deleteItem(itemId);
                    _self._childrenManager.deleteItem(itemId);
                    delete _refarenceCounter[itemId];
                }
            }
            setTimeout(_deleteMessageData, 10);
        }
        return true;
    }
    _proto.onAddParentMessageRefarence = function(parentItemId) {
        var _self = this;
        return _self._childrenManager.onAddParentMessageRefarence(parentItemId);
    };
    _proto.onRemoveParentMessageRefarence = function(parentItemId) {
        var _self = this;
        return _self._childrenManager.onRemoveParentMessageRefarence(parentItemId);
    };
    _proto.onRemoveAllMessageView = function() {
        var _self = this;
        _self._messageDataList.removeAll();
        _self._replyManager.cleanUp();
        _self._childrenManager.cleanUp();
        delete _self._viewRefarenceCounter;
        _self._viewRefarenceCounter = {};
        return true;
    };

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
            CubeeServerConnector.getInstance().updateThreadTitle(message, threadTitle)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(res){
                reject(res);
                return;
            })
        })
    };

    _proto.getThreadTitleList = function(_columnInfo) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!_columnInfo || typeof _columnInfo != 'object') {
                reject(false);
                return;
            }
            CubeeServerConnector.getInstance().getThreadTitleList(_columnInfo)
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
            CubeeServerConnector.getInstance().updateMessage(_editMessage, _messageObj)
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
            CubeeServerConnector.getInstance().sendQuoteMessage(_quoteMessageData)
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
        return CubeeServerConnector.getInstance().sendEmotionPoint(itemId, emotionValue, onSendEmoteCallback);
    };

    _proto.getGoodJobTotal = function(jid, dateFrom) {
        return new Promise((resolve, reject) => {
            var _self = this;
            if (!jid || dateFrom == undefined  ||
                typeof jid != 'string' || typeof dateFrom != 'string') {
                reject(false);
                return;
            }
            CubeeServerConnector.getInstance().getGoodJobTotal(jid, dateFrom)
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
            CubeeServerConnector.getInstance().getThanksPointsTotal(jid, dateFrom)
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
            CubeeServerConnector.getInstance().getGoodJobRanking(dateFrom, rankBottom, offset, limit)
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
            CubeeServerConnector.getInstance().getThanksPointsRanking(dateFrom, rankBottom, offset, limit)
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
            CubeeServerConnector.getInstance().getMurmurTotal(jid, dateFrom)
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
            CubeeServerConnector.getInstance().getMurmurRanking(dateFrom, rankBottom, offset, limit)
            .then(function(res){
                resolve(res);
                return;
            }).catch(function(err){
                reject(err);
                return;
            })
        })
    }

    _proto.disconnected = function() {
        var _self = this;
        _self._replyManager.disconnected();
        _self._childrenManager.disconnected();
        _self._messageDataList.removeAll();
    };
    function getPersonManager() {
        return CubeeController.getInstance()._personManager;
    };

    function getNotificationManager() {
        return CubeeController.getInstance()._notificationManager;
    };
    function getSearchManager() {
        return CubeeController.getInstance()._searchManager;
    };

})();

function ReplyManager() {
    this._replyChain = {};
    this._replyReverseChain = {};
};(function() {
    var _proto = ReplyManager.prototype;
    _proto.addMessage = function(message) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return false;
        }
        var _messageType = message.getType();
        if (_messageType != Message.TYPE_PUBLIC &&
            _messageType != Message.TYPE_GROUP_CHAT &&
            _messageType != Message.TYPE_COMMUNITY &&
            _messageType != Message.TYPE_MURMUR) {
            return false;
        }
        var _itemId = message.getItemId();
        if (_itemId == null || _itemId == '') {
            return false;
        }
        var _replyItemId = message.getReplyItemId();
        if (_replyItemId == null || _replyItemId == '' || _replyItemId == 'no_id') {
            _replyItemId = '';
        }
        if (_self._replyChain[_itemId] != null) {
            return true;
        }
        _self._replyChain[_itemId] = _replyItemId;
        if (_replyItemId != '') {
            if (_self._replyReverseChain[_replyItemId] === undefined) {
                _self._replyReverseChain[_replyItemId] = new ArrayList();
            }
            _self._replyReverseChain[_replyItemId].add(_itemId);
        }
        return true;
    };
    _proto.getReplyReverseItemIds = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        var _replyReverseItemIds = _self._replyReverseChain[itemId];
        if (_replyReverseItemIds === undefined) {
            return null;
        }
        return _replyReverseItemIds;
    };
    _proto.deleteItem = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return;
        }
        var _replyId = _self._replyChain[itemId];
        if(_replyId != null && _replyId != '') {
            var _replyReverseChain = _self._replyReverseChain[_replyId];
            if(_replyReverseChain != null) {
                var _count = _replyReverseChain.getCount();
                for(var _i = 0; _i < _count; _i++) {
                    var _replyReverseId = _replyReverseChain.get(_i);
                    if(_replyReverseId == itemId) {
                        _replyReverseChain.remove(_i);
                        break;
                    }
                }
                if(_replyReverseChain.getCount() <= 0) {
                    delete _self._replyReverseChain[_replyId];
                }
            }
        }
        delete _self._replyChain[itemId];
    };
    _proto.disconnected = function() {
        var _self = this;
        for (var _replyDataKey in _self._replyChain) {
            delete _self._replyChain[_replyDataKey];
        }
        for (var _replyReverseDataKey in _self._replyReverseChain) {
            _self._replyReverseChain[_replyReverseDataKey].removeAll();
            delete _self._replyReverseChain[_replyReverseDataKey];
        }
        delete _self._replyChain;
        delete _self._replyReverseChain;
        _self._replyChain = {};
        _self._replyReverseChain = {};
    };
    _proto.cleanUp = function() {
        var _self = this;
        delete _self._replyChain;
        delete _self._replyReverseChain;
        _self._replyChain = {};
        _self._replyReverseChain = {};
    };
})();

function TaskChildrenManager() {
    this._children = {};
    this._viewRefarenceCounter = {};
};(function() {
    var _proto = TaskChildrenManager.prototype;
    _proto.addMessage = function(childTaskMessage) {
        var _self = this;
        if (childTaskMessage == null || typeof childTaskMessage != 'object') {
            return false;
        }
        if (childTaskMessage.getType() != Message.TYPE_TASK) {
            return false;
        }
        var _itemId = childTaskMessage.getItemId();
        if (_itemId == null || _itemId == '') {
            return false;
        }
        var _parentItemId = childTaskMessage.getParentItemId();
        if (_parentItemId == null || _parentItemId == '') {
            return false;
        }
        if (_self._children[_parentItemId] === undefined) {
            _self._children[_parentItemId] = new StringMapedStringArrayList();
        }
        _self._children[_parentItemId].add(_itemId, _itemId);
        return true;
    };
    _proto.onAddParentMessageRefarence = function(parentItemId) {
        var _self = this;
        if (parentItemId == null || typeof parentItemId != 'string') {
            return false;
        }
        var _refarenceCounter = _self._viewRefarenceCounter;
        if(_self._viewRefarenceCounter[parentItemId] == null) {
            _refarenceCounter[parentItemId] = 1;
        } else {
            _refarenceCounter[parentItemId] += 1;
        }
        return true;
    };
    _proto.onRemoveParentMessageRefarence = function(parentItemId) {
        var _self = this;
        if (parentItemId == null || typeof parentItemId != 'string') {
            return false;
        }
        var _refarenceCounter = _self._viewRefarenceCounter;
        if(_self._viewRefarenceCounter[parentItemId] == null) {
            return false;
        } else {
            _refarenceCounter[parentItemId] -= 1;
        }
        if(_refarenceCounter[parentItemId] <= 0) {
            function _deleteMessageData() {
                if(_refarenceCounter[parentItemId] <= 0) {
                    _self.deleteItem(parentItemId);
                }
            }
            setTimeout(_deleteMessageData, 10);
        }
        return true;
    };
    _proto.getChildrenTaskItemIds = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        var _childrenTaskItemIds = _self._children[itemId];
        if (_childrenTaskItemIds === undefined) {
            return null;
        }
        return _childrenTaskItemIds;
    };

    _proto.deleteItem = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        delete _self._children[itemId];
        delete _self._viewRefarenceCounter[itemId];
    };
    _proto.disconnected = function() {
        var _self = this;
        for (var _childrenDataKey in _self._children) {
            _self._children[_childrenDataKey].removeAll();
            delete _self._children[_childrenDataKey];
        }
        delete _self._children;
        _self._children = {};
    };
    _proto.cleanUp = function() {
        var _self = this;
        delete _self._children;
        _self._children = {};
    };
})();
