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
function NotificationManager() {
    this._notificationList = new StringMapedArrayList();
};(function() {
    var _chatKey = 'chat';
    var _proto = NotificationManager.prototype;
    _proto.onNotificationReceived = function(notification) {
        var _self = this;
        if(notification == null || typeof notification != 'object') {
            return;
        }
        if(notification.getType == null) {
            return;
        }
        var _type = notification.getType();
        switch(_type) {
            case Notification_model.TYPE_MESSAGE_OPTION:
            case Notification_model.TYPE_GOOD_JOB:
            case Notification_model.TYPE_EMOTION_POINT:
                var _messageManager = getMessageManager();
                if(_messageManager != null) {
                    _messageManager.onNotificationReceived(notification);
                }
                break;
            case Notification_model.TYPE_TASK:
                var _messageManager = getMessageManager();
                if(_messageManager != null) {
                    _messageManager.onNotificationReceived(notification);
                }
                break;
            case Notification_model.TYPE_QUESTIONNAIRE:
                var _messageManager = getMessageManager();
                if(_messageManager != null) {
                    _messageManager.onNotificationReceived(notification);
                }
                break;
            case Notification_model.TYPE_CHAT:
                break;
            case Notification_model.TYPE_SYSTEM:
                var _messageManager = getMessageManager();
                if(_messageManager != null) {
                    _messageManager.onNotificationReceived(notification);
                }
                break;
            case Notification_model.TYPE_DELETE_MESSAGE:
                var _messageManager = getMessageManager();
                if(_messageManager != null) {
                    _messageManager.onNotificationReceived(notification);
                }
                break;
            case Notification_model.TYPE_GROUP_CHAT:
                var _subType = notification.getSubType();
                if (_subType == GroupChatNotification.SUB_TYPE_MESSAGE) {
                    var _messageManager = getMessageManager();
                    if(_messageManager != null) {
                        _messageManager.onNotificationReceived(notification);
                    }
                } else {
                    var _chatroomManager = getChatroomManager();
                    if(_chatroomManager != null) {
                        _chatroomManager.onNotificationReceived(notification);
                    }
                }
                break;
            case Notification_model.TYPE_MAIL:
                var _messageManager = getMessageManager();
                if(_messageManager != null) {
                    _messageManager.onNotificationReceived(notification);
                }
                break;
            case Notification_model.TYPE_COMMUNITY:
                var _subType = notification.getSubType();
                if (_subType == CommunityNotification.SUB_TYPE_MESSAGE) {
                    var _messageManager = getMessageManager();
                    if(_messageManager != null) {
                        _messageManager.onNotificationReceived(notification);
                    }
                } else {
                    var _communityManager = getCommunityManager();
                    if(_communityManager != null) {
                        _communityManager.onNotificationReceived(notification);
                    }
                }
                break;
            case Notification_model.TYPE_MURMUR:
                var _subType = notification.getSubType();
                if (_subType == MurmurNotification.SUB_TYPE_MESSAGE ||
                    _subType == MurmurNotification.SUB_TYPE_SET_COLUMN_NAME) {
                    var _messageManager = getMessageManager();
                    if(_messageManager != null) {
                        _messageManager.onNotificationReceived(notification);
                    }
                }
                break;
            case Notification_model.TYPE_AUTHORITY_CHANGED:
                var _subType = notification.getSubType();
                var _item = notification.getUpdatedItem();
                if (_subType == AuthorityInfoUpdateNotification.SUB_TYPE_POLICY_ASSIGN) {
                    var _action = _item.getAction();
                    var _resourceId = _item.getResourceId();
                    if (_action == null || _resourceId == null) {
                        break;
                    }
                    AuthorityInfo.getInstance().setRightForResource(_action, _resourceId);
                } else if (_subType == AuthorityInfoUpdateNotification.SUB_TYPE_POLICY_UNASSIGN) {
                    var _action = _item.getAction();
                    var _resourceId = _item.getResourceId();
                    if (_action == null || _resourceId == null) {
                        break;
                    }
                    AuthorityInfo.getInstance().removeRightForResource(_action, _resourceId);
                }
                break;
              case Notification_model.TYPE_THREAD_TITLE:
              case Notification_model.TYPE_MESSAGE_UPDATE:
              case Notification_model.TYPE_ASSIGN_NOTE:
              case Notification_model.TYPE_DELETE_NOTE:
                  var _messageManager = getMessageManager();
                  if(_messageManager && typeof _messageManager == 'object') {
                      _messageManager.onNotificationReceived(notification);
                  }
                  break;
              case Notification_model.TYPE_USER_FOLLOW:
                var _personManager = getPersonManager();
                if(_personManager && typeof _personManager == 'object') {
                    _personManager.onNotificationReceived(notification);
                }
                  break;
            default:
                break;
        }
    };
    _proto.disconnected = function() {
    };
    _proto.setChatMessageData = function(jid,chatMessage){
        var _self = this;
        var _notificationChatList = null;
        var _notificationChatListByJid = null;
        _notificationChatList = _self._notificationList.getByKey(_chatKey);
        if (_notificationChatList == null) {
            _notificationChatList = new StringMapedArrayList();
            _notificationChatListByJid = new ArrayList();
            _notificationChatListByJid.add(chatMessage);
        }else{
            _notificationChatListByJid = _notificationChatList.getByKey(jid);
            if (_notificationChatListByJid == null) {
                _notificationChatListByJid = new ArrayList();
                _notificationChatListByJid.add(chatMessage);
            }else{
                _notificationChatListByJid.add(chatMessage);
                _notificationChatList.removeByKey(jid);
            }
            _self._notificationList.removeByKey(_chatKey);
        }
        _notificationChatList.add(jid,_notificationChatListByJid);
        _self._notificationList.add(_chatKey,_notificationChatList);
    };
    _proto.getChatMessageListByJid = function(jid){
        var _self = this;
        var _chatMessageList = _self._notificationList.getByKey(_chatKey);
        var _chatMessageListByJid = _chatMessageList.getByKey(jid);
        return _chatMessageListByJid;
    };
    _proto.removeChatMessageListByJid = function(jid){
        var _self = this;
        _self._notificationList.getByKey(_chatKey).removeByKey(jid);
    };


    function getMessageManager() {
        return CubeeController.getInstance()._messageManager;
    };
    function getChatroomManager() {
        return CubeeController.getInstance().getChatroomManager();
    };
    function getCommunityManager() {
        return CubeeController.getInstance()._communityManager;
    }
    function getPersonManager() {
        return CubeeController.getInstance()._personManager;
    }
})();
