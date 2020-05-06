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
function Notification_model () {
    this._type = Notification_model.TYPE_BASE;
};(function() {
    Notification_model.TYPE_BASE = 0;
    Notification_model.TYPE_GOOD_JOB = 1;
    Notification_model.TYPE_TASK = 2;
    Notification_model.TYPE_CHAT = 3;
    Notification_model.TYPE_SYSTEM = 4;
    Notification_model.TYPE_MESSAGE_OPTION = 5;
    Notification_model.TYPE_DELETE_MESSAGE = 6;
    Notification_model.TYPE_GROUP_CHAT = 7;
    Notification_model.TYPE_MAIL = 8;
    Notification_model.TYPE_COMMUNITY = 9;
    Notification_model.TYPE_AUTHORITY_CHANGED = 10;
    Notification_model.TYPE_THREAD_TITLE = 11;
    Notification_model.TYPE_MESSAGE_UPDATE = 12;
    Notification_model.TYPE_EMOTION_POINT = 13;
    Notification_model.TYPE_ASSIGN_NOTE = 14;
    Notification_model.TYPE_DELETE_NOTE = 15;
    Notification_model.TYPE_QUESTIONNAIRE = 16;
    Notification_model.TYPE_USER_FOLLOW = 17;
    Notification_model.TYPE_MURMUR = 18;
    var _proto = Notification_model.prototype;
    _proto.getType = function() {
        return this._type;
    };
})();
function GoodJobNotification() {
    Profile.call(this);
    Notification_model.call(this);
    this._type = Notification_model.TYPE_GOOD_JOB;
    this._itemId = "";
    this._fromJid = "";
    this._fromName = "";
    this._date = "";
    this._message = "";
    this._msgOwnJid = "";
    this._msgTo = "";
    this._msgType = Message.TYPE_UNKNOWN;
};(function(){
    GoodJobNotification.prototype = $.extend({}, Notification_model.prototype, Profile.prototype);
    var _super = Notification_model.prototype;
    var _proto = GoodJobNotification.prototype;
    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto.setItemId = function(itemId) {
        if(itemId == null || typeof itemId != 'string') {
            return;
        }
        this._itemId = itemId;
    };
    _proto.getFromJid = function() {
        return this._fromJid;
    };
    _proto.setFromJid = function(fromJid) {
        if(fromJid == null || typeof fromJid != 'string') {
            return;
        }
        this._fromJid = fromJid;
    };
    _proto.getFromName = function() {
        return this._fromName;
    };
    _proto.setFromName = function(fromName) {
        if(fromName == null || typeof fromName != 'string') {
            return;
        }
        this._fromName = fromName;
    };
    _proto.getDate = function() {
        return this._date;
    };
    _proto.setDate = function(date) {
        if(date == null || typeof date != 'string') {
            return;
        }
        this._date = date;
    };
    _proto.getMessage = function() {
        return this._message;
    };
    _proto.setMessage = function(message) {
        if (message == null || typeof message != 'string') {
            return;
        }
        this._message = message;
    };
    _proto.getMsgOwnJid = function() {
        return this._msgOwnJid;
    };
    _proto.setMsgOwnJid = function(msgOwnJid) {
        if (msgOwnJid == null || typeof msgOwnJid != 'string') {
            return;
        }
        this._msgOwnJid = msgOwnJid;
    };
    _proto.getMsgTo = function() {
        return this._msgTo;
    };
    _proto.setMsgTo = function(msgTo) {
        if (msgTo == null || typeof msgTo != 'string') {
            return;
        }
        this._msgTo = msgTo;
    };
    _proto.getMsgType = function() {
        return this._msgType;
    };
    _proto.setMsgType = function(msgType) {
        if (msgType == null || typeof msgType != 'number') {
            return;
        }
        this._msgType = msgType;
    };
})();

function TaskNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_TASK;
    this._actionType = TaskNotification.ACTION_TYPE_NONE;
    this._taskMessage = null;
};(function(){
    TaskNotification.ACTION_TYPE_NONE = 0;
    TaskNotification.ACTION_TYPE_ADD = 1;
    TaskNotification.ACTION_TYPE_UPDATE = 2;
    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    TaskNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = TaskNotification.prototype;
    _proto.getActionType = function() {
        return this._actionType;
    };
    _proto.setActionType = function(actionType) {
        if(actionType == null || typeof actionType != 'number') {
            return;
        }
        this._actionType = actionType;
    };
    _proto.getTaskMessage = function() {
        return this._taskMessage;
    };
    _proto.setTaskMessage = function(taskMessage) {
        if(taskMessage == null || typeof taskMessage != 'object') {
            return;
        }
        this._taskMessage = taskMessage;
    };
})();

function QuestionnaireNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_QUESTIONNAIRE;
    this._actionType = QuestionnaireNotification.ACTION_TYPE_NONE;
    this._questionnaireMessage = null;
};(function(){
    QuestionnaireNotification.ACTION_TYPE_NONE = 0;
    QuestionnaireNotification.ACTION_TYPE_ADD = 1;
    QuestionnaireNotification.ACTION_TYPE_UPDATE = 2;
    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    QuestionnaireNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = QuestionnaireNotification.prototype;
    _proto.getActionType = function() {
        return this._actionType;
    };
    _proto.setActionType = function(actionType) {
        if(actionType == null || typeof actionType != 'number') {
            return;
        }
        this._actionType = actionType;
    };
    _proto.getQuestionnaireMessage = function() {
        return this._questionnaireMessage;
    };
    _proto.setQuestionnaireMessage = function(questionnaireMessage) {
        if(questionnaireMessage == null || typeof questionnaireMessage != 'object') {
            return;
        }
        this._questionnaireMessage = questionnaireMessage;
    };
})();
function ChatNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_CHAT;
    this._chatMessage = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    ChatNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = ChatNotification.prototype;
    _proto.getChatMessage = function() {
        return this._chatMessage;
    };
    _proto.setChatMessage = function(chatMessage) {
        if(chatMessage == null || typeof chatMessage != 'object') {
            return;
        }
        this._chatMessage = chatMessage;
    };
})();
function SystemNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_SYSTEM;
    this._systemMessage = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    SystemNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = SystemNotification.prototype;
    _proto.getSystemMessage = function() {
        return this._systemMessage;
    };
    _proto.setSystemMessage = function(systemMessage) {
        if(systemMessage == null || typeof systemMessage != 'object') {
            return;
        }
        this._systemMessage = systemMessage;
    };
})();
function MessageOptionNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_MESSAGE_OPTION;
    this._contentType = MessageOptionNotification.CONTENT_TYPE_BASE;
    this._itemId = "";
};(function(){
    MessageOptionNotification.CONTENT_TYPE_BASE = 0;
    MessageOptionNotification.CONTENT_TYPE_GOOD_JOB = 1;
    MessageOptionNotification.CONTENT_TYPE_SIBLING_TASK = 2;
    MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK = 3;
    MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE = 4;
    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    MessageOptionNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MessageOptionNotification.prototype;
    _proto.getContentType = function() {
        return this._contentType;
    };
    _proto.setContentType = function(contentType) {
        if(_contentType == null || typeof _contentType != 'number') {
            return;
        }
        this._contentType = contentType;
    };
    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto.setItemId = function(itemId) {
        if(itemId == null || typeof itemId != 'string') {
            return;
        }
        this._itemId = itemId;
    };
 })();
function SiblingTaskNotification() {
    MessageOptionNotification.call(this);
    this._contentType = MessageOptionNotification.CONTENT_TYPE_SIBLING_TASK;
    this._siblingItemId = "";
    this._ownerJid = "";
    this._ownerName = "";
    this._status = TaskMessage.STATUS_UNKNOWN;

    this._nickName = null;
    this._avatarType = null;
    this._avatarData = null;
    this._loginAccount = null;
    this._userStatus = Profile.STATUS_UNKNOWN;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = MessageOptionNotification.prototype;
    SiblingTaskNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = SiblingTaskNotification.prototype;
    _proto.getSiblingItemId = function() {
        return this._siblingItemId;
    };
    _proto.setSiblingItemId = function(siblingItemId) {
        if(siblingItemId == null || typeof siblingItemId != 'string') {
            return;
        }
        this._siblingItemId = siblingItemId;
    };
    _proto.getOwnerJid = function() {
        return this._ownerJid;
    };
    _proto.setOwnerJid = function(ownerJid) {
        if(ownerJid == null || typeof ownerJid != 'string') {
            return;
        }
        this._ownerJid = ownerJid;
    };
    _proto.getOwnerName = function() {
        return this._ownerName;
    };
    _proto.setOwnerName = function(ownerName) {
        if(ownerName == null || typeof ownerName != 'string') {
            return;
        }
        this._ownerName = ownerName;
    };
    _proto.getStatus = function() {
        return this._status;
    };
    _proto.setStatus = function(status) {
        if (status == null || typeof status != 'number') {
            return;
        }
        this._status = status;
    };
    _proto.getNickName = function() {
        return this._nickName;
    };
    _proto.setNickName = function(nickName) {
        if(nickName == null || typeof nickName != 'string') {
            return;
        }
        this._nickName = nickName;
    };
    _proto.getAvatarType = function() {
        return this._avatarType;
    };
    _proto.setAvatarType = function(avatarType) {
        if(avatarType == null || typeof avatarType != 'string') {
            return;
        }
        this._avatarType = avatarType;
    };
    _proto.getAvatarData = function() {
        return this._avatarData;
    };
    _proto.setAvatarData = function(avatarData) {
        if(avatarData == null || typeof avatarData != 'string') {
            return;
        }
        this._avatarData = avatarData;
    };
    _proto.getLoginAccount = function() {
        return this._loginAccount;
    };
    _proto.setLoginAccount = function(loginAccount) {
        if(loginAccount == null || typeof loginAccount != 'string') {
            return;
        }
        this._loginAccount = loginAccount;
    };
    _proto.getUserStatus = function() {
        return this._userStatus;
    };
    _proto.setUserStatus = function(userStatus) {
        if(userStatus == null || typeof userStatus != 'number') {
            return;
        }
        this._userStatus = userStatus;
    };
 })();
function DeleteMessageNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_DELETE_MESSAGE;
    this._itemId = "";
    this._deleteFlag = "";
    this._adminDeleted = "";
};(function(){

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    DeleteMessageNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = DeleteMessageNotification.prototype;
    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto.setItemId = function(itemId) {
        if(itemId == null || typeof itemId != 'string') {
            return;
        }
        this._itemId = itemId;
    };
    _proto.getDeleteFlag = function() {
        return this._deleteFlag;
    };
    _proto.setDeleteFlag = function(deleteFlag) {
        if(deleteFlag == null || typeof deleteFlag != 'number') {
            return;
        }
        this._deleteFlag = deleteFlag;
    };
    _proto.getAdminDeleted = function() {
        return this._adminDeleted;
    };
    _proto.setAdminDeleted = function(adminDeleted) {
        if(adminDeleted == null || typeof adminDeleted != 'boolean') {
            return;
        }
        this._adminDeleted = adminDeleted;
    };
})();
function GroupChatNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_GROUP_CHAT;
    this._subType = 0;
    this._roomInfo = null;
    this._profileMap = new StringMapedArrayList();
};(function(){
    GroupChatNotification.SUB_TYPE_UNKNOWN = 0;
    GroupChatNotification.SUB_TYPE_MESSAGE = 1;
    GroupChatNotification.SUB_TYPE_CREATE_ROOM = 2;
    GroupChatNotification.SUB_TYPE_ADD_MEMBER = 3;
    GroupChatNotification.SUB_TYPE_UPDATE_ROOM_INFO = 4;
    GroupChatNotification.SUB_TYPE_REMOVE_MEMBER = 5;
    GroupChatNotification.SUB_TYPE_AUTHORITY_CHANGED = 7;

    GroupChatNotification.prototype = $.extend({}, Notification_model.prototype);
    var _super = Notification_model.prototype;
    var _proto = GroupChatNotification.prototype;
    _proto.getSubType = function() {
        return this._subType;
    };
    _proto.getRoomInfo = function() {
        return this._roomInfo;
    };
    _proto.setRoomInfo = function(roomInfo) {
        if(roomInfo == null || typeof roomInfo != 'object') {
            return;
        }
        this._roomInfo = roomInfo;
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
})();

function GroupChatMessageNotification() {
    GroupChatNotification.call(this);
    this._subType = GroupChatNotification.SUB_TYPE_MESSAGE;
    this._groupChatMessage = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = GroupChatNotification.prototype;
    GroupChatMessageNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatMessageNotification.prototype;
    _proto.getGroupChatMessage = function() {
        return this._groupChatMessage;
    };
    _proto.setGroupChatMessage = function(groupChatMessage) {
        if(groupChatMessage == null || typeof groupChatMessage != 'object') {
            return;
        }
        this._groupChatMessage = groupChatMessage;
    };
})();
function GroupChatCreateNotification() {
    GroupChatNotification.call(this);
    this._subType = GroupChatNotification.SUB_TYPE_CREATE_ROOM;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = GroupChatNotification.prototype;
    GroupChatCreateNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatCreateNotification.prototype;
})();
function GroupChatAddMemberNotification() {
    GroupChatNotification.call(this);
    this._subType = GroupChatNotification.SUB_TYPE_ADD_MEMBER;
    this._addedBy = null;
    this._addedMemberList = new ArrayList();
};(function(){

    var Super = function Super() {
    };
    Super.prototype = GroupChatNotification.prototype;
    GroupChatAddMemberNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatAddMemberNotification.prototype;
    _proto.getAddedBy = function() {
        return this._addedBy;
    };
    _proto.setAddedBy = function(addedBy) {
        if(addedBy == null || typeof addedBy != 'string') {
            return;
        }
        this._addedBy = addedBy;
    };
    _proto.getAddedMemberList = function() {
        return this._addedMemberList;
    };
})();

function GroupChatRemoveMemberNotification() {
    GroupChatNotification.call(this);
    this._subType = GroupChatNotification.SUB_TYPE_REMOVE_MEMBER;
    this._removedBy = null;
    this._removedMemberList = new ArrayList();
};(function(){
    GroupChatRemoveMemberNotification.prototype = $.extend({}, GroupChatNotification.prototype);
    var _super = GroupChatNotification.prototype;
    var _proto = GroupChatRemoveMemberNotification.prototype;

    _proto.getRemovedBy = function() {
        return this._removedBy;
    };
    _proto.setRemovedBy = function(removedBy) {
        if(removedBy == null || typeof removedBy != 'string') {
            return;
        }
        this._removedBy = removedBy;
    };
    _proto.getRemovedMemberList = function() {
        return this._removedMemberList;
    };
})();

function GroupChatInfoUpdateNotification() {
    GroupChatNotification.call(this);
    this._subType = GroupChatNotification.SUB_TYPE_UPDATE_ROOM_INFO;
    this._updatedItems = new Array();
    this._previousRoomName = null;
    this._previousPrivacyType = null;
};(function(){
    GroupChatInfoUpdateNotification.SUB_TYPE_CHANGE_ROOM_NAME = 'ChangeRoomName';
    GroupChatInfoUpdateNotification.SUB_TYPE_CHANGE_ROOM_PRIVACY_TYPE = 'ChangePrivacyType';

    var Super = function Super() {
    };
    Super.prototype = GroupChatNotification.prototype;
    GroupChatInfoUpdateNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatInfoUpdateNotification.prototype;
    _proto.getUpdatedItems = function() {
        return this._updatedItems;
    };
    _proto.getPreviousRoomName = function() {
        return this._previousRoomName;
    };
    _proto.setPreviousRoomName = function(previousRoomName) {
        if(previousRoomName == null || typeof previousRoomName != 'string') {
            return;
        }
        this._previousRoomName = previousRoomName;
    };
    _proto.getPreviousPrivacyType = function() {
        return this._previousPrivacyType;
    };
    _proto.setPreviousPrivacyType = function(previousPrivacyType) {
        if(previousPrivacyType == null || typeof previousPrivacyType != 'number') {
            return;
        }
        this._previousPrivacyType = previousPrivacyType;
    };
})();

function GroupChatAuthorityChangedNotification() {
    GroupChatNotification.call(this);
    this._subType = GroupChatNotification.SUB_TYPE_AUTHORITY_CHANGED;
    this._roomId = '';
    this._roomInfo = null;
    this._policy = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = GroupChatNotification.prototype;
    GroupChatAuthorityChangedNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatAuthorityChangedNotification.prototype;
    _proto.getRoomId = function() {
        return this._roomId;
    };
    _proto.setRoomId = function(roomId) {
        if(roomId == null || typeof roomId != 'string') {
            return;
        }
        this._roomId = roomId;
    };
    _proto.setRoomInfo = function(roomInfo) {
        this._roomInfo = roomInfo;
    }
    _proto.getRoomInfo = function() {
        return this._roomInfo;
    }
    _proto.setPolicy = function(policy) {
        this._policy = policy;
    };
    _proto.getPolicy = function() {
        return this._policy;
    }
})();
function MailMessageNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_MAIL;
    this._mailMessage = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    MailMessageNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MailMessageNotification.prototype;
    _proto.getMailMessage = function() {
        return this._mailMessage;
    };
    _proto.setMailMessage = function(mailMessage) {
        if(mailMessage == null || typeof mailMessage != 'object') {
            return;
        }
        this._mailMessage = mailMessage;
    };
})();
function DemandTaskNotification() {
    MessageOptionNotification.call(this);
    this._contentType = MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK;
    this._taskTitle = "";
    this._taskOwner = "";
    this._taskClient = "";
    this._taskStatus = "";
    this._taskDemandStatus = TaskMessage.DEMAND_ON;
    this._taskDemandDate = "";
    this._fromJid = "";
    this._fromName = "";
};(function(){
    var Super = function Super() {
    };
    Super.prototype = MessageOptionNotification.prototype;
    DemandTaskNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = DemandTaskNotification.prototype;
    _proto.getTitle = function() {
        return this._taskTitle;
    };
    _proto.setTitle = function(title) {
        if(title == null || typeof title != 'string') {
            return;
        }
        this._taskTitle = title;
    };
    _proto.getOwner = function() {
        return this._taskOwner;
    };
    _proto.setOwner = function(owner) {
        if(owner == null || typeof owner != 'string') {
            return;
        }
        this._taskOwner = owner;
    };
    _proto.getClient = function() {
        return this._taskClient;
    };
    _proto.setClient = function(client) {
        if(client == null || typeof client != 'string') {
            return;
        }
        this._taskClient = client;
    };
    _proto.getStatus = function() {
        return this._taskStatus;
    };
    _proto.setStatus = function(status) {
        if(status == null || typeof status != 'number') {
            return;
        }
        this._taskStatus = status;
    };
    _proto.getDemandStatus = function() {
        return this._taskDemandStatus;
    };
    _proto.setDemandStatus = function(demandStatus) {
        if(demandStatus == null || typeof demandStatus != 'number') {
            return;
        }
        this._taskDemandStatus = demandStatus;
    };
    _proto.getDemandDate = function() {
        return this._taskDemandDate;
    };
    _proto.setDemandDate = function(date) {
        if(date == null || typeof date != 'string') {
            return;
        }
        this._taskDemandDate = date;
    };
    _proto.getJid = function() {
        return this._fromJid;
    };
    _proto.setJid = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return;
        }
        this._fromJid = jid;
    };
    _proto.getNickName = function() {
        return this._fromName;
    };
    _proto.setNickName = function(nickName) {
        if(nickName == null || typeof nickName != 'string') {
            return;
        }
        this._fromName = nickName;
    };
})();
function SetReadMessageNotification() {
    MessageOptionNotification.call(this);
    this._contentType = MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE
    this._existingReaderItem = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = MessageOptionNotification.prototype;
    SetReadMessageNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = SetReadMessageNotification.prototype;
    _proto.getExistingReaderItem = function() {
        return this._existingReaderItem;
    };
    _proto.setExistingReaderItem = function(existingReaderItem) {
        if (existingReaderItem == null || typeof existingReaderItem != 'object') {
            return;
        }
        this._existingReaderItem = existingReaderItem;
    };
 })();
function CommunityNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_COMMUNITY;
    this._subType = 0;
};(function(){
    CommunityNotification.SUB_TYPE_UNKNOWN = 0;
    CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO = 1;
    CommunityNotification.SUB_TYPE_ADD_MEMBER = 2;
    CommunityNotification.SUB_TYPE_UPDATE_OWNER = 3;
    CommunityNotification.SUB_TYPE_REMOVE_MEMBER = 4;
    CommunityNotification.SUB_TYPE_MESSAGE = 5;
    CommunityNotification.SUB_TYPE_AUTHORITY_CHANGED = 6;

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    CommunityNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityNotification.prototype;
    _proto.getSubType = function() {
        return this._subType;
    };
})();
function CommunityInfoUpdateNotification() {
    CommunityNotification.call(this);
    this._subType = CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO;
    this._updatedCommunityInfo = null;
    this._previousCommunityInfo = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = CommunityNotification.prototype;
    CommunityInfoUpdateNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityInfoUpdateNotification.prototype;
    _proto.getUpdatedCommunityInfo = function() {
        return this._updatedCommunityInfo;
    };
    _proto.getPreviousCommunityInfo = function() {
        return this._previousCommunityInfo;
    };
    _proto.setData = function(updatedCommunityInfo, previousCommunityInfo) {
        if(updatedCommunityInfo != null && typeof updatedCommunityInfo != 'object') {
            return;
        }
        if(previousCommunityInfo != null && typeof previousCommunityInfo != 'object') {
            return;
        }
        this._updatedCommunityInfo = updatedCommunityInfo;
        this._previousCommunityInfo = previousCommunityInfo;
    };
})();
function CommunityMemberAddNotification() {
    CommunityNotification.call(this);
    this._subType = CommunityNotification.SUB_TYPE_ADD_MEMBER;
    this._roomId = '';
    this._roomName = '';
    this._addedBy = '';
    this._addedMemberList = new CommunityMemberList();
};(function(){

    var Super = function Super() {
    };
    Super.prototype = CommunityNotification.prototype;
    CommunityMemberAddNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityMemberAddNotification.prototype;
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
    _proto.getAddedBy = function() {
        return this._addedBy;
    };
    _proto.setAddedBy = function(addedBy) {
        if(addedBy == null || typeof addedBy != 'string') {
            return;
        }
        this._addedBy = addedBy;
    };
    _proto.getAddedMemberList = function() {
        return this._addedMemberList;
    };
})();
function CommunityOwnerUpdateNotification() {
    CommunityNotification.call(this);
    this._subType = CommunityNotification.SUB_TYPE_UPDATE_OWNER;
    this._roomId = '';
    this._ownerList = new ArrayList();
    this._preOwnerList = new ArrayList();
};(function(){

    var Super = function Super() {
    };
    Super.prototype = CommunityNotification.prototype;
    CommunityOwnerUpdateNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityOwnerUpdateNotification.prototype;
    _proto.getRoomId = function() {
        return this._roomId;
    };
    _proto.setRoomId = function(roomId) {
        if(roomId == null || typeof roomId != 'string') {
            return;
        }
        this._roomId = roomId;
    };
    _proto.getOwnerList = function() {
        return this._ownerList;
    };
    _proto.getPreOwnerList = function() {
        return this._preOwnerList;
    };
})();
function CommunityMemberRemoveNotification() {
    CommunityNotification.call(this);
    this._subType = CommunityNotification.SUB_TYPE_REMOVE_MEMBER;
    this._roomId = '';
    this._roomName = '';
    this._removedBy = '';
    this._removedMemberList = new ArrayList();
};(function(){

    var Super = function Super() {
    };
    Super.prototype = CommunityNotification.prototype;
    CommunityMemberRemoveNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityMemberRemoveNotification.prototype;
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
    _proto.getRemovedBy = function() {
        return this._removedBy;
    };
    _proto.setRemovedBy = function(removedBy) {
        if(removedBy == null || typeof removedBy != 'string') {
            return;
        }
        this._removedBy = removedBy;
    };
    _proto.getRemovedMemberList = function() {
        return this._removedMemberList;
    };
})();
function CommunityMessageNotification() {
    CommunityNotification.call(this);
    this._subType = CommunityNotification.SUB_TYPE_MESSAGE;
    this._communityMessage = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = CommunityNotification.prototype;
    CommunityMessageNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityMessageNotification.prototype;
    _proto.getCommunityMessage = function() {
        return this._communityMessage;
    };
    _proto.setCommunityMessage = function(communityMessage) {
        if(communityMessage == null || typeof communityMessage != 'object') {
            return;
        }
        this._communityMessage = communityMessage;
    };
})();
function CommunityAuthorityChangedNotification() {
    CommunityNotification.call(this);
    this._subType = CommunityNotification.SUB_TYPE_AUTHORITY_CHANGED;
    this._roomId = '';
    this._roomName = '';
    this._policy = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = CommunityNotification.prototype;
    CommunityAuthorityChangedNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityAuthorityChangedNotification.prototype;
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
    _proto.setPolicy = function(policy) {
        this._policy = policy;
    };
    _proto.getPolicy = function() {
        return this._policy;
    };
})();

function MurmurNotification() {
};(function(){
    MurmurNotification.SUB_TYPE_UNKNOWN = 0;
    MurmurNotification.SUB_TYPE_MESSAGE = 5;
    MurmurNotification.SUB_TYPE_SET_COLUMN_NAME = 6;
})();

function MurmurMessageNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_MURMUR;
    this._subType = MurmurNotification.SUB_TYPE_MESSAGE;
    this._murmurMessage = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    MurmurMessageNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MurmurMessageNotification.prototype;

    _proto.getSubType = function() {
        return this._subType;
    };

    _proto.getMurmurMessage = function() {
        return this._murmurMessage;
    };

    _proto.setMurmurMessage = function(murmurMessage) {
        if(murmurMessage == null || typeof murmurMessage != 'object') {
            return;
        }
        this._murmurMessage = murmurMessage;
    };
})();
function AuthorityInfoUpdateNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_AUTHORITY_CHANGED;
    this._subType = null;
    this._updatedItem = null;
    this._previousRoomName = null;
    this._triger = null;
};(function(){
    AuthorityInfoUpdateNotification.SUB_TYPE_ASSIGN_ROLE = 'AssignRoleToUser';
    AuthorityInfoUpdateNotification.SUB_TYPE_POLICY_ASSIGN = 'AssignPolicyToUsers';
    AuthorityInfoUpdateNotification.SUB_TYPE_POLICY_UNASSIGN = 'UnassignPolicyFromUser';

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    AuthorityInfoUpdateNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = AuthorityInfoUpdateNotification.prototype;
    _proto.getSubType = function() {
        return this._subType;
    };
    _proto.setSubType = function(subtype) {
        if(subtype == null || typeof subtype != 'string') {
            return;
        }
        this._subType = subtype;
    };
    _proto.getUpdatedItem = function() {
        return this._updatedItem;
    };
    _proto.setUpdatedItem = function(item) {
        this._updatedItem = item;
    };
    _proto.getTriger = function() {
        return this._triger;
    };
    _proto.setTriger = function(item) {
        this._triger = item;
    };
})();

function MurmurSetColumnNameNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_MURMUR;
    this._subType = MurmurNotification.SUB_TYPE_SET_COLUMN_NAME;
    this._jid = null;
    this._columnName = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    MurmurSetColumnNameNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MurmurSetColumnNameNotification.prototype;
    _proto.getSubType = function() {
        return this._subType;
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
    _proto.getColumnName = function() {
        return this._columnName;
    };
    _proto.setColumnName = function(columnName) {
        this._columnName = columnName;
    };
})();

function ThreadTitleUpdateNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_THREAD_TITLE;
    this._subType = null;
    this._threadRootId = null;
    this._threadTitle = null;
    this._itemId = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    ThreadTitleUpdateNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = ThreadTitleUpdateNotification.prototype;
    _proto.getSubType = function() {
        return this._subType;
    }
    _proto.setSubType = function(subtype) {
        if(subtype == null || typeof subtype != 'string') {
            return;
        }
        this._subType = subtype;
    };
    _proto.getThreadRootId = function() {
        return this._threadRootId;
    };
    _proto.setThreadRootId = function(item) {
        this._threadRootId = item;
    };
    _proto.getThreadTitle = function() {
        return this._threadTitle;
    };
    _proto.setThreadTitle = function(item) {
        this._threadTitle = item;
    };
    _proto.getItemId = function() {
        return this._itemId;
    }
    _proto.setItemId = function(item) {
        this._itemId = item;
    }
})();

function MessageUpdateNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_MESSAGE_UPDATE;
    this._subType = null;
    this._message = null
};(function(){

    MessageUpdateNotification.ACTION_TYPE_UPDATE = 2;
    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    MessageUpdateNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MessageUpdateNotification.prototype;
    _proto.getMessage = function() {
        return this._message;
    }
    _proto.setMessage = function(message) {
        if(message == null || typeof message != 'object') {
            return;
        }
        this._message = message;
    };
})();

function EmotionPointNotification() {
    Profile.call(this);
    Notification_model.call(this);
    this._type = Notification_model.TYPE_EMOTION_POINT;
    this._itemId = "";
    this._fromJid = "";
    this._fromName = "";
    this._created_at = "";
    this._updated_at = "";
    this._emotion_point = "";
    this._message = "";
    this._msgOwnJid = "";
    this._msgTo = "";
    this._msgType = Message.TYPE_UNKNOWN;
};(function(){
    EmotionPointNotification.prototype = $.extend({}, Notification_model.prototype, Profile.prototype);
    var _super = Notification_model.prototype;
    var _proto = EmotionPointNotification.prototype;
    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto.setItemId = function(itemId) {
        if(itemId == null || typeof itemId != 'string') {
            return;
        }
        this._itemId = itemId;
    };
    _proto.getFromJid = function() {
        return this._fromJid;
    };
    _proto.setFromJid = function(fromJid) {
        if(fromJid == null || typeof fromJid != 'string') {
            return;
        }
        this._fromJid = fromJid;
    };
    _proto.getFromName = function() {
        return this._fromName;
    };
    _proto.setFromName = function(fromName) {
        if(fromName == null || typeof fromName != 'string') {
            return;
        }
        this._fromName = fromName;
    };
    _proto.getCreatedAt = function() {
        return this._created_at;
    };
    _proto.setCreatedAt = function(date) {
        if(date == null || typeof date != 'string') {
            return;
        }
        this._created_at = date;
    };
    _proto.getUpdatedAt = function() {
        return this._updated_at;
    };
    _proto.setUpdatedAt = function(date) {
        if(date == null || typeof date != 'string') {
            return;
        }
        this._updated_at = date;
    };
    _proto.getEmotionPoint = function() {
        return this._emotion_point;
    };
    _proto.setEmotionPoint = function(emotion_point) {
        if(emotion_point == null || typeof emotion_point != 'number') {
            return;
        }
        // Variable 'emotion_point' is of type number, but it is compared to an expression of type string.
        // if (emotion_point == '') {
        //    return;
        // }
        this._emotion_point = emotion_point;
    };
    _proto.getMessage = function() {
        return this._message;
    };
    _proto.setMessage = function(message) {
        if (message == null || typeof message != 'string') {
            return;
        }
        this._message = message;
    };
    _proto.getMsgOwnJid = function() {
        return this._msgOwnJid;
    };
    _proto.setMsgOwnJid = function(msgOwnJid) {
        if (msgOwnJid == null || typeof msgOwnJid != 'string') {
            return;
        }
        this._msgOwnJid = msgOwnJid;
    };
    _proto.getMsgTo = function() {
        return this._msgTo;
    };
    _proto.setMsgTo = function(msgTo) {
        if (msgTo == null || typeof msgTo != 'string') {
            return;
        }
        this._msgTo = msgTo;
    };
    _proto.getMsgType = function() {
        return this._msgType;
    };
    _proto.setMsgType = function(msgType) {
        if (msgType == null || typeof msgType != 'number') {
            return;
        }
        this._msgType = msgType;
    };
})();

function NoteAssignChangedNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_ASSIGN_NOTE;
    this._noteTitle = null;
    this._noteUrl = null;
    this._oldThreadRootId = null;
    this._threadRootId = null;
    this._roomId = null;
    this._ownJid = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    NoteAssignChangedNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = NoteAssignChangedNotification.prototype;
    _proto.getNoteTitle= function() {
        return this._noteTitle;
    };
    _proto.setNoteTitle = function(item) {
        this._noteTitle = item;
    };
    _proto.getNoteUrl = function() {
        return this._noteUrl;
    };
    _proto.setNoteUrl = function(item) {
        this._noteUrl = item;
    };
    _proto.getOldThreadRootId = function() {
        return this._oldThreadRootId;
    };
    _proto.setOldThreadRootId = function(item) {
        this._oldThreadRootId = item;
    };
    _proto.getThreadRootId = function() {
        return this._threadRootId;
    };
    _proto.setThreadRootId = function(item) {
        this._threadRootId = item;
    };
    _proto.getRoomId = function() {
        return this._roomId;
    };
    _proto.setRoomId = function(item) {
        this._roomId = item;
    };
    _proto.getOwnJid = function() {
        return this._ownJid;
    };
    _proto.setOwnJid = function(item) {
        this._ownJid = item;
    };
})();

function NoteDeleteNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_DELETE_NOTE;
    this._noteTitle = null;
    this._noteUrl = null;
    this._threadRootId = null;
    this._roomId = null;
    this._ownJid = null;
};(function(){

    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    NoteDeleteNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = NoteDeleteNotification.prototype;
    _proto.getNoteTitle= function() {
        return this._noteTitle;
    };
    _proto.setNoteTitle = function(item) {
        this._noteTitle = item;
    };
    _proto.getNoteUrl = function() {
        return this._noteUrl;
    };
    _proto.setNoteUrl = function(item) {
        this._noteUrl = item;
    };
    _proto.getThreadRootId = function() {
        return this._threadRootId;
    };
    _proto.setThreadRootId = function(item) {
        this._threadRootId = item;
    };
    _proto.getRoomId = function() {
        return this._roomId;
    };
    _proto.setRoomId = function(item) {
        this._roomId = item;
    };
    _proto.getOwnJid = function() {
        return this._ownJid;
    };
    _proto.setOwnJid = function(item) {
        this._ownJid = item;
    };
})();

function UserFollowNotification() {
    Notification_model.call(this);
    this._type = Notification_model.TYPE_USER_FOLLOW;
    this._actionType = UserFollowNotification.ACTION_TYPE_NONE;
    this._followeeJid = null;
    this._followerJid = null;
    this._personInfo = null;
};(function(){
    UserFollowNotification.ACTION_TYPE_NONE = "";
    UserFollowNotification.ACTION_TYPE_ADD = "addUserFollow";
    UserFollowNotification.ACTION_TYPE_DEL = "delUserFollow";
    var Super = function Super() {
    };
    Super.prototype = Notification_model.prototype;
    UserFollowNotification.prototype = new Super();
    var _super = Super.prototype;
    var _proto = UserFollowNotification.prototype;
    _proto.getActionType = function() {
        return this._actionType;
    };
    _proto.setActionType = function(actionType) {
        if(actionType == null ||
            typeof actionType != 'string' ||
            (actionType != UserFollowNotification.ACTION_TYPE_ADD &&
            actionType != UserFollowNotification.ACTION_TYPE_DEL)) {
            return;
        }
        this._actionType = actionType;
    };
    _proto.getFolloweeJid = function() {
        return this._followeeJid;
    };
    _proto.setFolloweeJid = function(followeeJid) {
        if(followeeJid == null || typeof followeeJid != 'string') {
            return;
        }
        this._followeeJid = followeeJid;
    };
    _proto.getFollowerJid = function() {
        return this._followerJid;
    };
    _proto.setFollowerJid = function(followerJid) {
        if(followerJid == null || typeof followerJid != 'string') {
            return;
        }
        this._followerJid = followerJid;
    };
    _proto.getPersonInfo = function() {
        return this._personInfo;
    };
    _proto.setPersonInfo = function(personInfo) {
        if(personInfo == null || typeof personInfo != 'object') {
            return;
        }
        this._personInfo = personInfo;
    };
})();
