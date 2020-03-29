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
function Message() {
    this._type = Message.TYPE_UNKNOWN;
    this._from = '';
    this._message = '';
    this._date = '';
    this._itemId = '';
    this._id = -1;
    this._history = false;
    this._deleteFlag = 0;
    this._goodJobList = new GoodJobList();
    this._emotionPointList = new EmotionPointList();
    this._emotionIconList = null;
    this._readMore = false;
    this._attachedFileUrlList = new ArrayList();
    this._readFlag = 0;
    this._existingReaderInfo = null;
    this._uiShortenUrls = new ArrayList();
    this._profileMap = new StringMapedArrayList();
    this._threadTitle = '';
    this._threadRootId = '';
    this._updatedAt = '';
    this._quotation = '';
    this._noteTitle = '';
    this._noteUrl = '';
    this._bodyType = 0;
};(function() {
    Message.TYPE_UNKNOWN = 0;
    Message.TYPE_PUBLIC = 1;
    Message.TYPE_CHAT = 2;
    Message.TYPE_GROUP_CHAT = 3;
    Message.TYPE_TASK = 4;
    Message.TYPE_COMMUNITY = 5;
    Message.TYPE_SYSTEM = 6;
    Message.TYPE_MAIL = 9;
    Message.TYPE_QUESTIONNAIRE = 10;
    Message.TYPE_MURMUR = 11;

    Message.READ_STATUS_UNREAD = 0;
    Message.READ_STATUS_READ = 1;
    Message.BODYTYPE_MESSAGE = 0;
    Message.BODYTYPE_STAMP = 1;

    var _proto = Message.prototype;
    _proto.getType = function() {
        return this._type;
    };
    _proto.getFrom = function() {
        return this._from;
    };
    _proto.setFrom = function(from) {
        if (from == null || typeof from != 'string') {
            return;
        }
        this._from = from;
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
    _proto.getDate = function() {
        return this._date;
    };
    _proto.setDate = function(date) {
        if (date == null || typeof date != 'string') {
            return;
        }
        this._date = date;
    };
    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto.setItemId = function(itemId) {
        if (itemId == null || typeof itemId != 'string') {
            return;
        }
        this._itemId = itemId;
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
    _proto.isHistory = function() {
        return this._history;
    };
    _proto.setHistory = function(history) {
        if (history == null || typeof history != 'boolean') {
            return;
        }
        this._history = history;
    };
    _proto.getDeleteFlag = function() {
        return this._deleteFlag;
    };
    _proto.setDeleteFlag = function(deleteFlag) {
        if (deleteFlag == null || typeof deleteFlag != 'number') {
            return;
        }
        this._deleteFlag = deleteFlag;
    };
    _proto.getGoodJobList = function() {
        return this._goodJobList;
    };
    _proto.getEmotionPointList = function() {
        return this._emotionPointList;
    };
    _proto.getEmotionIconList = function() {
        return this._emotionIconList;
    };
    _proto.setEmotionIconList = function(emotionIconList) {
        if (emotionIconList == null || typeof emotionIconList != 'object') {
            return;
        }
        this._emotionIconList = emotionIconList;
    };
    _proto.isReadMore = function() {
        return this._readMore;
    };
    _proto.setReadMore = function(readMore) {
        if (readMore == null || typeof readMore != 'boolean') {
            return;
        }
        this._readMore = readMore;
    };
    _proto.getAttachedFileUrlList = function() {
        return this._attachedFileUrlList;
    };
    _proto.addAttachedFileUrl = function(url) {
        if (url == null || typeof url != 'string') {
            return;
        }
        this._attachedFileUrlList.add(url);
    };
    _proto.getReadFlag = function() {
        return this._readFlag;
    };
    _proto.setReadFlag = function(readFlag) {
        if (readFlag == null || typeof readFlag != 'number') {
            return;
        }
        this._readFlag = readFlag;
    };
    _proto.getExistingReaderInfo = function() {
        return this._existingReaderInfo;
    };
    _proto.setExistingReaderInfo = function(existingReaderInfo) {
        if (existingReaderInfo == null || typeof existingReaderInfo != 'object') {
            return;
        }
        this._existingReaderInfo = existingReaderInfo;
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
    _proto.getProfileByJid = function(jid) {
        if (jid == null || typeof jid != 'string') {
            return;
        }
        return this._profileMap.getByKey(jid);
    };
    _proto.setThreadTitle = function(threadTitle) {
        if (threadTitle == null || typeof threadTitle != 'string') {
            return;
        }
        this._threadTitle = threadTitle;
    }
    _proto.getThreadTitle = function() {
        return this._threadTitle;
    }
    _proto.setThreadRootId = function(threadRootId) {
        if (threadRootId == null || typeof threadRootId != 'string') {
            return;
        }
        this._threadRootId = threadRootId;
    }
    _proto.getThreadRootId = function() {
        return this._threadRootId;
    }
    _proto.setUpdatedAt = function(updatedAt) {
        if (updatedAt == null || typeof updatedAt != 'string') {
            return;
        }
        this._updatedAt = updatedAt;
    }
    _proto.getUpdatedAt = function() {
        return this._updatedAt;
    }
    _proto.setQuotationItem = function(messageObj) {
        if (messageObj == null || typeof messageObj != 'object') {
            return;
        }
        this._quotation = messageObj;
    }
    _proto.getQuotationItem = function() {
        return this._quotation;
    }
    _proto.setNoteTitle = function(notetitle) {
        if (notetitle == null || typeof notetitle != 'string') {
            return;
        }
        this._noteTitle = notetitle;
    }
    _proto.getNoteTitle = function() {
        return this._noteTitle;
    }
    _proto.setNoteUrl = function(noteurl) {
        if (noteurl == null || typeof noteurl != 'string') {
            return;
        }
        this._noteUrl = noteurl;
    }
    _proto.getNoteUrl = function() {
        return this._noteUrl;
    }
    _proto.setBodyType = function(bodyType) {
        if (bodyType == null || typeof bodyType != 'number') {
            return;
        }
        this._bodyType = bodyType;
    }
    _proto.getBodyType = function() {
        return this._bodyType;
    }

    _proto.addAttachedFileMessage = function() {
        var _self = this;
        var _urlList = _self.getAttachedFileUrlList();
        var _messageBody = this._message;
        var _count = _urlList.getCount();
        var _urls = '';
        for ( i = 0; i < _count; i++) {
            _urls += _urlList.get(i);
        }
        this._message = _messageBody + _urls;
    };

    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = false;
        switch(name) {
            case 'id':
                _ret = (_self.getId() == value);
                break;
            case 'item_id':
                _ret = (_self.getItemId() == value);
                break;
            case 'msgtype':
                _ret = (_self.getType() == value);
                break;
            case 'msgfrom':
                _ret = (_self.getFrom() == value);
                break;
            case 'created_at':
                _ret = (_self.getDate() == value);
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.hasKeyword = function(value, include) {
        var _self = this;
        var _ret = Utils.hasSubStringWithCaseIgnored(_self.getMessage(), value);
        if(_ret) {
            return _ret;
        }
        if(include != null && include[KeywordCondition.INCLUDE_TYPE_MSGFROM] != null) {
            var _fromJid = _self.getFrom();

            var _personInfo = _self.getProfileByJid(_fromJid);
            if(_personInfo == null) {
                return _ret;
            }
            var _account = _personInfo.getLoginAccount();
            var _nickName = _personInfo.getNickName();
            _ret = Utils.hasSubStringWithCaseIgnored(_account, value);
            if(!_ret) {
                _ret = Utils.hasSubStringWithCaseIgnored(_nickName, value);
            }
            if (!_ret && value.slice(0, 1)=="@") {
                _ret = Utils.hasSubStringWithCaseIgnored(_account, value.slice(1));
            }
        }
        return _ret;
    };
    _proto.isColmunChangeableFilterCondition = function(name, value) {
        var _self = this;
        return _self.isMatchFilterCondition(name, value);
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        var _self = this;
        var _ret = false;
        return _ret;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = false;
        switch(name) {
            case 'id':
                _ret = (_self.getId() > value);
                break;
            case 'item_id':
                _ret = false;
                break;
            case 'msgtype':
                _ret = (_self.getType() > value);
                break;
            case 'msgfrom':
                _ret = false;
                break;
            case 'created_at':
                _ret = (new Date(_self.getDate())).isAfter(value);
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.isColmunChangeableGraterThanCondition = function(name, value) {
        var _self = this;
        return _self.isMatchGraterThanCondition(name, value);
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = false;
        switch(name) {
            case 'id':
                _ret = (_self.getId() < value);
                break;
            case 'item_id':
                _ret = false;
                break;
            case 'msgtype':
                _ret = (_self.getType() < value);
                break;
            case 'msgfrom':
                _ret = false;
                break;
            case 'created_at':
                _ret = (new Date(_self.getDate())).isBefore(value);
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.isColmunChangeableLessThanCondition = function(name, value) {
        var _self = this;
        return _self.isMatchLessThanCondition(name, value);
    };

    _proto.setUIShortenUrls = function(uiShortenUrls) {
        var _self = this;
        if (uiShortenUrls == null || typeof uiShortenUrls != 'object') {
            return;
        }
        _self._uiShortenUrls = uiShortenUrls;
    };
    _proto.getUIShortenUrls = function() {
        var _self = this;
        return _self._uiShortenUrls;
    };
})();
function PublicMessage() {
    Message.call(this);
    this._replyItemId = '';
    this._publishNode = '';
    this._replyTo = '';
    this._type = Message.TYPE_PUBLIC;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = Message.prototype;
    PublicMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = PublicMessage.prototype;
    _proto.getReplyItemId = function() {
        return this._replyItemId;
    };
    _proto.setReplyItemId = function(replyItemId) {
        if (replyItemId == null || typeof replyItemId != 'string') {
            return;
        }
        this._replyItemId = replyItemId;
    };
    _proto.getPublishNode = function() {
        return this._publishNode;
    };
    _proto.setPublishNode = function(publishNode) {
        if (publishNode == null || typeof publishNode != 'string') {
            return;
        }
        this._publishNode = publishNode;
    };
    _proto.getReplyTo = function() {
        return this._replyTo;
    };
    _proto.setReplyTo = function(replyTo) {
        if (replyTo == null || typeof replyTo != 'string') {
            return;
        }
        this._replyTo = replyTo;
    };
    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchFilterCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = true;
                break;
            case 'publish_nodename':
                _ret = (_self.getPublishNode() == value);
                break;
            case 'reply_id':
                _ret = (_self.getReplyItemId() == value);
                break;
            case 'reply_to':
                _ret = (_self.getReplyTo() == value);
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.hasKeyword = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeyword.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeywordPreInfomation.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchGraterThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = false;
                break;
            case 'publish_nodename':
                _ret = false;
                break;
            case 'reply_id':
                _ret = false;
                break;
            case 'reply_to':
                _ret = false;
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchLessThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = false;
                break;
            case 'publish_nodename':
                _ret = false;
                break;
            case 'reply_id':
                _ret = false;
                break;
            case 'reply_to':
                _ret = false;
                break;
            default:
                break;
        }
        return _ret;
    };
})();
function ChatMessage() {
    Message.call(this);
    this._to = '';
    this._direction = -1;
    this._replyItemId = '';
    this._replyTo = '';
    this._type = Message.TYPE_CHAT;
};(function() {
    ChatMessage.DIRECTION_SEND = 0;
    ChatMessage.DIRECTION_RECEIVE = 1;
    var Super = function Super() {
    };
    Super.prototype = Message.prototype;
    ChatMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = ChatMessage.prototype;
    _proto.getTo = function() {
        return this._to;
    };
    _proto.setTo = function(to) {
        if (to == null || typeof to != 'string') {
            return;
        }
        this._to = to;
    };
    _proto.getDirection = function() {
        return this._direction;
    };
    _proto.setDirection = function(direction) {
        if (direction == null || typeof direction != 'number') {
            return;
        }
        if (direction < ChatMessage.DIRECTION_SEND || direction > ChatMessage.DIRECTION_RECEIVE) {
            return;
        }
        this._direction = direction;
    };
    _proto.getReplyItemId = function() {
        return this._replyItemId;
    };
    _proto.setReplyItemId = function(replyItemId) {
        if (replyItemId == null || typeof replyItemId != 'string') {
            return;
        }
        this._replyItemId = replyItemId;
    };
    _proto.getReplyTo = function() {
        return this._replyTo;
    };
    _proto.setReplyTo = function(replyTo) {
        if (replyTo == null || typeof replyTo != 'string') {
            return;
        }
        this._replyTo = replyTo;
    };
    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchFilterCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = (_self.getTo() == value);
                break;
            case 'reply_id':
                _ret = (_self.getReplyItemId() == value);
                break;
            case 'reply_to':
                _ret = (_self.getReplyTo() == value);
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.hasKeyword = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeyword.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeywordPreInfomation.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchGraterThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = false;
                break;
            case 'reply_id':
                _ret = false;
                break;
            case 'reply_to':
                _ret = false;
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchLessThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = false;
                break;
            case 'reply_id':
                _ret = false;
                break;
            case 'reply_to':
                _ret = false;
                break;
            default:
                break;
        }
        return _ret;
    };
})();
function GroupChatMessage() {
    ChatMessage.call(this);
    this._roomName = '';
    this._parentRoomId = '';
    this._type = Message.TYPE_GROUP_CHAT;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ChatMessage.prototype;
    GroupChatMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatMessage.prototype;
    _proto.getRoomName = function() {
        return this._roomName;
    };
    _proto.setRoomName = function(roomName) {
        if (roomName == null || typeof roomName != 'string') {
            return;
        }
        this._roomName = roomName;
    };
    _proto.getParentRoomId = function() {
        return this._parentRoomId;
    };
    _proto.setParentRoomId = function(parentroomid) {
        if (parentroomid == null || typeof parentroomid != 'string') {
            return;
        }
        this._parentRoomId = parentroomid;
    };

    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchFilterCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeyword = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeyword.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeywordPreInfomation.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchGraterThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchLessThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
})();
function MailMessage() {
    Message.call(this);
    this._to = '';
    this._priority = 1;
    this._mailMessageId = '';
    this._mailInReplyTo = '';
    this._replyItemId = '';
    this._mailBodyInfo = null;
    this._type = Message.TYPE_MAIL;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = Message.prototype;
    MailMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MailMessage.prototype;

    _proto.getTo = function() {
        return this._to;
    };
    _proto.setTo = function(to) {
        if (to == null || typeof to != 'string') {
            return;
        }
        this._to = to;
    };
    _proto.getPriority = function() {
        return this._priority;
    };
    _proto.setPriority = function(priority) {
        if (priority == null || typeof priority != 'number') {
            return;
        }
        this._priority = priority;
    };
    _proto.getMailMessageId = function() {
        return this._mailMessageId;
    };
    _proto.setMailMessageId = function(mailMessageId) {
        if (mailMessageId == null || typeof mailMessageId != 'string') {
            return;
        }
        this._mailMessageId = mailMessageId;
    };
    _proto.getMailInReplyTo = function() {
        return this._mailInReplyTo;
    };
    _proto.setMailInReplyTo = function(mailInReplyTo) {
        if (mailInReplyTo == null || typeof mailInReplyTo != 'string') {
            return;
        }
        this._mailInReplyTo = mailInReplyTo;
    };
    _proto.getReplyItemId = function() {
        return this._replyItemId;
    };
    _proto.setReplyItemId = function(replyItemId) {
        if (replyItemId == null || typeof replyItemId != 'string') {
            return;
        }
        this._replyItemId = replyItemId;
    };
    _proto.getBodyInfo = function() {
        return this._mailBodyInfo;
    };
    _proto.setBodyInfo = function(mailBodyInfo) {
        if (mailBodyInfo == null || typeof mailBodyInfo != 'object') {
            return;
        }
        this._mailBodyInfo = mailBodyInfo;
    };

    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchFilterCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeyword = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeyword.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeywordPreInfomation.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchGraterThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchLessThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
})();
function MailBody() {
    this._id = -1;
    this._itemId = '';
    this._jid = '';
    this._mailBody = '';
};(function() {
    var _proto = MailBody.prototype;

    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto.setItemId = function(itemId) {
        if (itemId == null || typeof itemId != 'string') {
            return;
        }
        this._itemId = itemId;
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
    _proto.getJid = function() {
        return this._jid;
    };
    _proto.setJid = function(jid) {
        if (jid == null || typeof jid != 'string') {
            return;
        }
        if (jid == '') {
            return;
        }
        this._jid = jid;
    };
    _proto.getBody = function() {
        return this._mailBody;
    };
    _proto.setBody = function(mailBody) {
        if (mailBody == null || typeof mailBody != 'string') {
            return;
        }
        this._mailBody = mailBody;
    };
})();
function TaskMessage() {
    Message.call(this);
    this._type = Message.TYPE_TASK;
    this._title = '';
    this._startDate = null;
    this._dueDate = null;
    this._ownerJid = '';
    this._priority = TaskMessage.PRIORITY_LOW;
    this._progress = 0;
    this._noteArray = new TaskNoteList();
    this._status = TaskMessage.STATUS_NEW;
    this._reminderList = new ReminderList();
    this._spentTime = 0;
    this._estimatedTime = 0;
    this._remainingTime = 0;
    this._parentItemId = '';
    this._childrenItemIdList = new ArrayList();
    this._goal = '';
    this._alert = TaskMessage.ALERT_NORMAL;
    this._referenceMessageItemId = '';
    this._completeDate = null;
    this._replyTo = '';
    this._updatedAt = null;
    this._updatedBy = '';
    this._client = '';
    this._preStatus = TaskMessage.STATUS_UNKNOWN;
    this._preOwnerJid = '';
    this._preTitle = '';
    this._preMessage = '';
    this._preProgress = 0;
    this._preSpentTime = 0;
    this._preEstimatedTime = 0;
    this._preRemainingTime = 0;
    this._preGoal = '';
    this._preAlert = TaskMessage.ALERT_NORMAL;
    this._siblingTaskDataList = new SiblingTaskDataList();
    this._demandStatus = TaskMessage.DEMAND_OFF;
    this._demandDate = null;
    this._communityId = '';
    this._communityNeme = '';
};(function() {
    TaskMessage.PRIORITY_LOW = 1;
    TaskMessage.PRIORITY_MEDIUM = 2;
    TaskMessage.PRIORITY_HIGH = 3;
    TaskMessage.PRIORITY_TOP = 4;
    TaskMessage.STATUS_UNKNOWN = 0;
    TaskMessage.STATUS_INBOX = 1;
    TaskMessage.STATUS_ASSIGNING = 2;
    TaskMessage.STATUS_NEW = 3;
    TaskMessage.STATUS_DOING = 4;
    TaskMessage.STATUS_SOLVED = 5;
    TaskMessage.STATUS_FEEDBACK = 6;
    TaskMessage.STATUS_FINISHED = 7;
    TaskMessage.STATUS_REJECTED = 8;
    TaskMessage.ALERT_NORMAL = 0;
    TaskMessage.ALERT_INFO = 1;
    TaskMessage.ALERT_WARNING = 2;
    TaskMessage.ALERT_COUTION = 3;
    TaskMessage.DEMAND_OFF = 0;
    TaskMessage.DEMAND_ON = 1;
    var Super = function Super() {
    };
    Super.prototype = Message.prototype;
    TaskMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = TaskMessage.prototype;
    _proto.getTitle = function() {
        return this._title;
    };
    _proto.setTitle = function(title) {
        if (title == null || typeof title != 'string') {
            return;
        }
        this._title = title;
    };
    _proto.getStartDate = function() {
        return this._startDate;
    };
    _proto.setStartDate = function(startDate) {
        if (typeof startDate != 'object') {
            return;
        }
        this._startDate = startDate;
    };
    _proto.getDueDate = function() {
        return this._dueDate;
    };
    _proto.setDueDate = function(dueDate) {
        if (typeof dueDate != 'object') {
            return;
        }
        this._dueDate = dueDate;
    };
    _proto.getCommunityId = function() {
        return this._communityId;
    };
    _proto.setCommunityId = function(communityId) {
        if (communityId == null || typeof communityId != 'string') {
            return;
        }
        this._communityId = communityId;
    };
    _proto.getCommunityName = function() {
        return this._communityName;
    };
    _proto.setCommunityName = function(communityName) {
        if (communityName == null || typeof communityName != 'string') {
            return;
        }
        this._communityName = communityName;
    };
    _proto.getOwnerJid = function() {
        return this._ownerJid;
    };
    _proto.setOwnerJid = function(ownerJid) {
        if (ownerJid == null || typeof ownerJid != 'string') {
            return;
        }
        this._ownerJid = ownerJid;
    };
    _proto.getPriority = function() {
        return this._priority;
    };
    _proto.setPriority = function(priority) {
        if (priority == null || typeof priority != 'number') {
            return;
        }
        this._priority = priority;
    };
    _proto.getProgress = function() {
        return this._progress;
    };
    _proto.setProgress = function(progress) {
        if (progress == null || typeof progress != 'number') {
            return;
        }
        this._progress = progress;
    };
    _proto.getNoteArray = function() {
        return this._noteArray;
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
    _proto.getReminderList = function() {
        return this._reminderList;
    };
    _proto.getSpentTime = function() {
        return this._spentTime;
    };
    _proto.setSpentTime = function(spentTime) {
        if (spentTime == null || typeof spentTime != 'number') {
            return;
        }
        this._spentTime = spentTime;
    };
    _proto.getEstimatedTime = function() {
        return this._estimatedTime;
    };
    _proto.setEstimatedTime = function(estimatedTime) {
        if (estimatedTime == null || typeof estimatedTime != 'number') {
            return;
        }
        this._estimatedTime = estimatedTime;
    };
    _proto.getRemainingTime = function() {
        return this._remainingTime;
    };
    _proto.setRemainingTime = function(remainingTime) {
        if (remainingTime == null || typeof remainingTime != 'number') {
            return;
        }
        this._remainingTime = remainingTime;
    };
    _proto.getParentItemId = function() {
        return this._parentItemId;
    };
    _proto.setParentItemId = function(parentItemId) {
        if (parentItemId == null || typeof parentItemId != 'string') {
            return;
        }
        this._parentItemId = parentItemId;
    };
    _proto.getChildItemIdList = function() {
        return this._childrenItemIdList;
    };
    _proto.getGoal = function() {
        return this._goal;
    };
    _proto.setGoal = function(goal) {
        if (goal == null || typeof goal != 'string') {
            return;
        }
        this._goal = goal;
    };
    _proto.getAlert = function() {
        return this._alert;
    };
    _proto.setAlert = function(alert) {
        if (alert == null || typeof alert != 'number') {
            return;
        }
        this._alert = alert;
    };
    _proto.getReferenceMessageItemId = function() {
        return this._referenceMessageItemId;
    };
    _proto.setReferenceMessageItemId = function(referenceMessageItemId) {
        if (referenceMessageItemId == null || typeof referenceMessageItemId != 'string') {
            return;
        }
        this._referenceMessageItemId = referenceMessageItemId;
    };
    _proto.getCompleteDate = function() {
        return this._completeDate;
    };
    _proto.setCompleteDate = function(completeDate) {
        if (completeDate == null || typeof completeDate != 'object') {
            return;
        }
        this._completeDate = completeDate;
    };
    _proto.getReplyTo = function() {
        return this._replyTo;
    };
    _proto.setReplyTo = function(replyTo) {
        if (replyTo == null || typeof replyTo != 'string') {
            return;
        }
        this._replyTo = replyTo;
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
        if (updatedBy == null || typeof updatedBy != 'string') {
            return;
        }
        this._updatedBy = updatedBy;
    };
    _proto.getClient = function() {
        return this._client;
    };
    _proto.setClient = function(client) {
        if (client == null || typeof client != 'string') {
            return;
        }
        this._client = client;
    };
    _proto.getSiblingTaskDataList = function() {
        return this._siblingTaskDataList;
    };

    _proto.getPreStatus = function() {
        return this._preStatus;
    };
    _proto.setPreStatus = function(preStatus) {
        if (preStatus == null || typeof preStatus != 'number') {
            return;
        }
        this._preStatus = preStatus;
    };
    _proto.getPreOwnerJid = function() {
        return this._preOwnerJid;
    };
    _proto.setPreOwnerJid = function(preOwnerJid) {
        if (preOwnerJid == null || typeof preOwnerJid != 'string') {
            return;
        }
        this._preOwnerJid = preOwnerJid;
    };
    _proto.getPreTitle = function() {
        return this._preTitle;
    };
    _proto.setPreTitle = function(preTitle) {
        if (preTitle == null || typeof preTitle != 'string') {
            return;
        }
        this._preTitle = preTitle;
    };
    _proto.getPreMessage = function() {
        return this._preMessage;
    };
    _proto.setPreMessage = function(preMessage) {
        if (preMessage == null || typeof preMessage != 'string') {
            return;
        }
        this._preMessage = preMessage;
    };
    _proto.getPreProgress = function() {
        return this._PreProgress;
    };
    _proto.setPreProgress = function(preProgress) {
        if (preProgress == null || typeof preProgress != 'number') {
            return;
        }
        this._preProgress = preProgress;
    };
    _proto.getPreSpentTime = function() {
        return this._preSpentTime;
    };
    _proto.setPreSpentTime = function(preSpentTime) {
        if (preSpentTime == null || typeof preSpentTime != 'number') {
            return;
        }
        this._preSpentTime = preSpentTime;
    };
    _proto.getPreEstimatedTime = function() {
        return this._preEstimatedTime;
    };
    _proto.setPreEstimatedTime = function(preEstimatedTime) {
        if (preEstimatedTime == null || typeof preEstimatedTime != 'number') {
            return;
        }
        this._preEstimatedTime = preEstimatedTime;
    };
    _proto.getPreRemainingTime = function() {
        return this._preRemainingTime;
    };
    _proto.setPreRemainingTime = function(preRemainingTime) {
        if (preRemainingTime == null || typeof preRemainingTime != 'number') {
            return;
        }
        this._preRemainingTime = preRemainingTime;
    };
    _proto.getPreGoal = function() {
        return this._preGoal;
    };
    _proto.setPreGoal = function(preGoal) {
        if (preGoal == null || typeof preGoal != 'string') {
            return;
        }
        this._preGoal = preGoal;
    };
    _proto.getPreAlert = function() {
        return this._preAlert;
    };
    _proto.setPreAlert = function(preAlert) {
        if (preAlert == null || typeof preAlert != 'number') {
            return;
        }
        this._preAlert = preAlert;
    };
    _proto.getSiblingTaskDataList = function() {
        return this._siblingTaskDataList;
    };
    _proto.getDemandStatus = function() {
        return this._demandStatus;
    };
    _proto.setDemandStatus = function(demandStatus) {
        if (demandStatus == null || typeof demandStatus != 'number') {
            return;
        }
        this._demandStatus = demandStatus;
    };
    _proto.getDemandDate = function() {
        return this._demandDate;
    };
    _proto.setDemandDate = function(demandDate) {
        if (typeof demandDate != 'object') {
            return;
        }
        this._demandDate = demandDate;
    };
    _proto.getPropertyByFilterKey = function(filterKey) {
        var _ret = '';
        var _self = this;
        if (filterKey == null || typeof filterKey != 'string') {
            return _ret;
        }
        switch(filterKey) {
            case TaskFilterAndSortCondition.FILTER_KEY_OWNER:
                _ret = _self.getOwnerJid();
                break;
            case TaskFilterAndSortCondition.FILTER_KEY_STATUS:
                _ret = _self.getStatus();
                break;
            case TaskFilterAndSortCondition.FILTER_KEY_GROUP:
                _ret = _self.getCommunityName();
                break;
            case TaskFilterAndSortCondition.FILTER_KEY_START_DATE:
                _ret = _self.getStartDate();
                break;
            case TaskFilterAndSortCondition.FILTER_KEY_END_DATE:
                _ret = _self.getDueDate();
                break;
            case TaskFilterAndSortCondition.FILTER_KEY_CLIENT:
                _ret = _self.getClient();
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.copy = function(message) {
        if (message == null || typeof message != 'object') {
            return;
        }
        var _self = this;
        _self.setFrom(message.getFrom());
        _self.setMessage(message.getMessage());
        _self.setDate(message.getDate());
        _self.setItemId(message.getItemId());
        _self.setId(message.getId());
        _self.setHistory(message.isHistory());
        _self._goodJobList.copy(message.getGoodJobList());
        _self.setReadMore(message.isReadMore());
        _self._attachedFileUrlList.copy(message.getAttachedFileUrlList());

        if (message.getType() != Message.TYPE_TASK) {
            return;
        }
        _self.setTitle(message.getTitle());
        _self.setStartDate(message.getStartDate());
        _self.setDueDate(message.getDueDate());
        _self.setCommunityId(message.getCommunityId());
        _self.setCommunityName(message.getCommunityName());
        _self.setOwnerJid(message.getOwnerJid());
        _self.setPriority(message.getPriority());
        _self.setProgress(message.getProgress());
        _self.getNoteArray().copy(message.getNoteArray);
        _self.setStatus(message.getStatus());
        _self.getReminderList().copy(message.getReminderList());
        _self.setSpentTime(message.getSpentTime());
        _self.setEstimatedTime(message.getEstimatedTime());
        _self.setRemainingTime(message.getRemainingTime());
        _self.setParentItemId(message.getParentItemId());
        _self.getChildItemIdList().copy(message.getChildItemIdList());
        _self.setGoal(message.getGoal());
        _self.setAlert(message.getAlert());
        _self.setReferenceMessageItemId(message.getReferenceMessageItemId());
        _self.setCompleteDate(message.getCompleteDate());
        _self.setReplyTo(message.getReplyTo());
        _self.setUpdatedAt(message.getUpdatedAt());
        _self.setUpdatedBy(message.getUpdatedBy());
        _self.setClient(message.getClient());
        _self.getSiblingTaskDataList().copy(message.getSiblingTaskDataList());
        _self.setDemandStatus(message.getDemandStatus());
        _self.setDemandDate(message.getDemandDate());
        _self.setDeleteFlag(message.getDeleteFlag());
    };

    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchFilterCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = true;
                break;
            case 'reply_id':
                _ret = (_self.getReferenceMessageItemId() == value);
                break;
            case 'reply_to':
                _ret = (_self.getReplyTo() == value);
                break;
            case 'start_date':
                _ret = (Utils.getDate(_self.getStartDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT) == value);
                break;
            case 'due_date':
                _ret = (Utils.getDate(_self.getDueDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT) == value);
                break;
            case 'owner':
                _ret = (_self.getOwnerJid() == value);
                break;
            case 'group_name':
                _ret = (_self.getCommunityId() == value);
                break;
            case 'status':
                _ret = (_self.getStatus() == value);
                break;
            case 'complete_date':
                _ret = (Utils.getDate(_self.getCompleteDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT) == value);
                break;
            case 'priority':
                _ret = (_self.getPriority() == value);
                break;
            case 'updated_at':
                _ret = (Utils.getDate(_self.getUpdatedAt(), Utils.DISPLAY_STANDARD_DATE_FORMAT) == value);
                break;
            case 'updated_by':
                _ret = (_self.getUpdatedBy() == value);
                break;
            case 'client':
                _ret = (_self.getClient() == value);
                break;
            case 'parent_item_id':
                _ret = (_self.getParentItemId() == value);
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.hasKeyword = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeyword.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        if (Utils.hasSubStringWithCaseIgnored(_self.getTitle(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getProgress(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getSpentTime(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getEstimatedTime(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getRemainingTime(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored(_self.getGoal(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getAlert(), value)) {
            _ret = true;
        } else {
            _ret = false;
        }
        return _ret;
    };
    _proto.isColmunChangeableFilterCondition = function(name, value) {
        var _self = this;
        var _ret = _self.isMatchFilterCondition(name, value);
        if(_ret) {
            return _ret;
        }
        switch(name) {
            case 'owner':
                _ret = (_self.getPreOwnerJid() == value);
                break;
            case 'status':
                _ret = (_self.getPreStatus() == value);
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeywordPreInfomation.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        if (Utils.hasSubStringWithCaseIgnored(_self.getPreTitle(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored(_self.getPreMessage(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getPreProgress(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getPreSpentTime(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getPreEstimatedTime(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getPreRemainingTime(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored(_self.getPreGoal(), value)) {
            _ret = true;
        } else if (Utils.hasSubStringWithCaseIgnored('' + _self.getPreAlert(), value)) {
            _ret = true;
        } else {
            _ret = false;
        }
        return _ret;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchGraterThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = false;
                break;
            case 'reply_id':
                _ret = false;
                break;
            case 'reply_to':
                _ret = false;
                break;
            case 'start_date':
                _ret = (new Date(_self.getStartDate())).isAfter(value);
                break;
            case 'due_date':
                _ret = (new Date(_self.getDueDate())).isAfter(value);
                break;
            case 'owner':
                _ret = false;
                break;
            case 'group_name':
                _ret = false;
                break;
            case 'status':
                _ret = (_self.getStatus() > value);
                break;
            case 'complete_date':
                _ret = (new Date(_self.getCompleteDate())).isAfter(value);
                break;
            case 'priority':
                _ret = (_self.getPriority() > value);
                break;
            case 'updated_at':
                _ret = (new Date(_self.getUpdatedAt())).isAfter(value);
                break;
            case 'updated_by':
                _ret = false;
                break;
            case 'client':
                _ret = false;
                break;
            case 'parent_item_id':
                _ret = false;
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.isColmunChangeableGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = _self.isMatchGraterThanCondition(name, value);
        if(_ret) {
            return _ret;
        }
        switch(name) {
            case 'owner':
                _ret = false;
                break;
            case 'status':
                _ret = false;
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchLessThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        switch(name) {
            case 'msgto':
                _ret = false;
                break;
            case 'reply_id':
                _ret = false;
                break;
            case 'reply_to':
                _ret = false;
                break;
            case 'start_date':
                _ret = (new Date(_self.getStartDate())).isBefore(value);
                break;
            case 'due_date':
                _ret = (new Date(_self.getDueDate())).isBefore(value);
                break;
            case 'owner':
                _ret = false;
                break;
            case 'group_name':
                _ret = false;
                break;
            case 'status':
                _ret = (_self.getStatus() < value);
                break;
            case 'complete_date':
                _ret = (new Date(_self.getCompleteDate())).isBefore(value);
                break;
            case 'priority':
                _ret = (_self.getPriority() < value);
                break;
            case 'updated_at':
                _ret = (new Date(_self.getUpdatedAt())).isBefore(value);
                break;
            case 'updated_by':
                _ret = false;
                break;
            case 'client':
                _ret = false;
                break;
            case 'parent_item_id':
                _ret = false;
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.isColmunChangeableLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = _self.isMatchLessThanCondition(name, value);
        if(_ret) {
            return _ret;
        }
        switch(name) {
            case 'owner':
                _ret = false;
                break;
            case 'status':
                _ret = false;
                break;
            default:
                break;
        }
        return _ret;
    };
})();
function CommunityMessage() {
    GroupChatMessage.call(this);
    this._type = Message.TYPE_COMMUNITY;
};(function() {
    CommunityMessage.DIRECTION_SEND = 0;
    CommunityMessage.DIRECTION_RECEIVE = 1;
    var Super = function Super() {
    };
    Super.prototype = GroupChatMessage.prototype;
    CommunityMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityMessage.prototype;

    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchFilterCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeyword = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeyword.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeywordPreInfomation.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchGraterThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchLessThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
})();
function SystemMessage() {
    Message.call(this);
    this._type = Message.TYPE_SYSTEM;
    this._triggerAction = SystemMessage.TRIGGER_ACTION_NONE;
    this._replyItemId = '';
    this._replyTo = '';
};(function() {
    SystemMessage.TRIGGER_ACTION_NONE = 0;
    SystemMessage.TRIGGER_ACTION_ADD_TASK = 1;
    SystemMessage.TRIGGER_ACTION_FINISH_TASK = 2;
    SystemMessage.TRIGGER_ACTION_REQUEST_TASK = 3;
    var Super = function Super() {
    };
    Super.prototype = Message.prototype;
    SystemMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = SystemMessage.prototype;
    _proto.getTriggerAction = function() {
        return this._triggerAction;
    };
    _proto.setTriggerAction = function(triggerAction) {
        if (triggerAction == null || typeof triggerAction != 'number') {
            return;
        }
        this._triggerAction = triggerAction;
    };
    _proto.getReplyItemId = function() {
        return this._replyItemId;
    };
    _proto.setReplyItemId = function(replyItemId) {
        if (replyItemId == null || typeof replyItemId != 'string') {
            return;
        }
        this._replyItemId = replyItemId;
    };
    _proto.getReplyTo = function() {
        return this._replyTo;
    };
    _proto.setReplyTo = function(replyTo) {
        if (replyTo == null || typeof replyTo != 'string') {
            return;
        }
        this._replyTo = replyTo;
    };
    _proto.isMatchFilterCondition = function(name, value) {
        return false;
    };
    _proto.hasKeyword = function(value, include) {
        return false;
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        return false;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        return false;
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        return false;
    };
})();
function MessageDataList() {
    StringMapedArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = StringMapedArrayList.prototype;
    MessageDataList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MessageDataList.prototype;
    _proto.add = function(message) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return false;
        }
        if (message.getItemId == null) {
            return false;
        }
        var _itemId = message.getItemId();
        var _ret = _super.add.call(_self, _itemId, message);
        if (_ret == false) {
            _ret = _super.setByKey.call(_self, _itemId, message);
        }
        return _ret;
    };
    _proto.getByItemId = function(itemId) {
        var _self = this;
        if (itemId == null || typeof itemId != 'string') {
            return null;
        }
        if (itemId == '') {
            return null;
        }
        return _super.getByKey.call(_self, itemId);
    };
})();
function TaskNoteData() {
    this._jid = '';
    this._date = null;
    this._message = '';
};(function() {
    var _proto = TaskNoteData.prototype;
    _proto.getJid = function() {
        return this._jid;
    };
    _proto.setJid = function(jid) {
        if (jid == null || typeof jid != 'string') {
            return;
        }
        if (jid == '') {
            return;
        }
        this._jid = jid;
    };
    _proto.getDate = function() {
        return this._date;
    };
    _proto.setDate = function(date) {
        if (date == null || typeof date != 'object') {
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
})();
function TaskNoteList() {
    ArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    TaskNoteList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = TaskNoteList.prototype;
    _proto.add = function(taskNoteData) {
        var _self = this;
        if (taskNoteData == null || typeof taskNoteData != 'object') {
            return false;
        }
        if (taskNoteData.getJid == null) {
            return false;
        }
        var _jid = taskNoteData.getJid();
        if (_jid == null || _jid == '') {
            return false;
        }
        var _existTaskNoteData = _self.getByJid(_jid);
        if (_existTaskNoteData != null) {
            return false;
        }
        return _super.add.call(this, taskNoteData);
    };
    _proto.getByJid = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        var _retTaskNoteData = null;
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i].getJid() == jid) {
                _retTaskNoteData = _self._array[_i];
                break;
            }
        }
        return _retTaskNoteData;
    };
    _proto.removeByJid = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        var _retTaskNoteData = null;
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i].getJid() == jid) {
                _retTaskNoteData = _super.remove.call(this, _i);
                break;
            }
        }
        return _retTaskNoteData;
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();

function SiblingTaskData() {
    Profile.call(this);
    this._itemId = ''
    this._siblingItemId = '';
    this._siblingOwnerJid = '';
    this._siblingTaskStatus = TaskMessage.STATUS_UNKNOWN;
};(function() {
    SiblingTaskData.prototype = $.extend({}, Profile.prototype);
    var _proto = SiblingTaskData.prototype;
    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto.setItemId = function(itemId) {
        if (itemId == null || typeof itemId != 'string') {
            return;
        }
        if (itemId == '') {
            return;
        }
        this._itemId = itemId;
    };
    _proto.getSiblingItemId = function() {
        return this._siblingItemId;
    };
    _proto.setSiblingItemId = function(siblingItemId) {
        if (siblingItemId == null || typeof siblingItemId != 'string') {
            return;
        }
        if (siblingItemId == '') {
            return;
        }
        this._siblingItemId = siblingItemId;
    };
    _proto.getSiblingOwnerJid = function() {
        return this._siblingOwnerJid;
    };
    _proto.setSiblingOwnerJid = function(siblingOwnerJid) {
        if (siblingOwnerJid == null || typeof siblingOwnerJid != 'string') {
            return;
        }
        if (siblingOwnerJid == '') {
            return;
        }
        this._siblingOwnerJid = siblingOwnerJid;
    };
    _proto.getSiblingTaskStatus = function() {
        return this._siblingTaskStatus;
    };
    _proto.setSiblingTaskStatus = function(siblingTaskStatus) {
        if (siblingTaskStatus == null || typeof siblingTaskStatus != 'number') {
            return;
        }
        this._siblingTaskStatus = siblingTaskStatus;
    };
})();
function SiblingTaskDataList() {
    ArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    SiblingTaskDataList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = SiblingTaskDataList.prototype;
    _proto.add = function(siblingTaskData) {
        var _self = this;
        if (siblingTaskData == null || typeof siblingTaskData != 'object') {
            return false;
        }
        if (siblingTaskData.getSiblingItemId == null) {
            return false;
        }
        var _siblingItemId = siblingTaskData.getSiblingItemId();
        if (_siblingItemId == null || _siblingItemId == '') {
            return false;
        }
        var _existSiblingTaskData = _self.getBySiblingItemId(_siblingItemId);
        if (_existSiblingTaskData != null) {
            return false;
        }
        return _super.add.call(this, siblingTaskData);
    };
    _proto.getBySiblingItemId = function(siblingItemId) {
        var _self = this;
        if (siblingItemId == null || typeof siblingItemId != 'string') {
            return null;
        }
        var _retSiblingTaskData = null;
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i].getSiblingItemId() == siblingItemId) {
                _retSiblingTaskData = _self._array[_i];
                break;
            }
        }
        return _retSiblingTaskData;
    };
    _proto.getBySiblingOwnerJid = function(siblingOwnerJid) {
        var _self = this;
        if (siblingOwnerJid == null || typeof siblingOwnerJid != 'string') {
            return null;
        }
        var _retSiblingTaskData = null;
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i].getSiblingOwnerJid() == siblingOwnerJid) {
                _retSiblingTaskData = _self._array[_i];
                break;
            }
        }
        return _retSiblingTaskData;
    };
    _proto.removeBySiblingItemId = function(siblingItemId) {
        var _self = this;
        if (siblingItemId == null || typeof siblingItemId != 'string') {
            return null;
        }
        var _retSiblingTaskData = null;
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i].getSiblingItemId() == siblingItemId) {
                _retSiblingTaskData = _super.remove.call(this, _i);
                break;
            }
        }
        return _retSiblingTaskData;
    };
    _proto.removeBySiblingOwnerJid = function(siblingOwnerJid) {
        var _self = this;
        if (siblingOwnerJid == null || typeof siblingOwnerJid != 'string') {
            return null;
        }
        var _retSiblingTaskData = null;
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i].getSiblingOwnerJid() == siblingOwnerJid) {
                _retSiblingTaskData = _super.remove.call(this, _i);
                break;
            }
        }
        return _retSiblingTaskData;
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();

function QuestionnaireMessage() {
    Message.call(this);
    this._type = Message.TYPE_QUESTIONNAIRE;
    this._inputType = QuestionnaireMessage.INPUTTYPE_RADIO;
    this._resultVisible = QuestionnaireMessage.INFORMATION_PUBLIC;
    this._graphType = QuestionnaireMessage.GRAPHTYPE_BAR;
    this._roomType = '';
    this._roomId = '';
    this._roomName = '';
    this._parentRoomId = '';
    this._optionCount = 0;
    this._optionItems = new ArrayList();
    this._startDate = null;
    this._dueDate = null;
    this._replyItemId = '';
    this._voteFlag = false;
};(function() {
    QuestionnaireMessage.INPUTTYPE_RADIO= 1;
    QuestionnaireMessage.INPUTTYPE_CHECKBOX = 2;
    QuestionnaireMessage.INFORMATION_PUBLIC = 1;
    QuestionnaireMessage.INFORMATION_PRIVATE = 2;
    QuestionnaireMessage.GRAPHTYPE_BAR = 1;
    QuestionnaireMessage.GRAPHTYPE_PIE = 2;
    var Super = function Super() {
    };
    Super.prototype = Message.prototype;
    QuestionnaireMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = QuestionnaireMessage.prototype;
    _proto.getReplyItemId = function() {
        return this._replyItemId;
    };
    _proto.setReplyItemId = function(replyItemId) {
        if (replyItemId == null || typeof replyItemId != 'string') {
            return;
        }
        this._replyItemId = replyItemId;
    };
    _proto.getStartDate = function() {
        return this._startDate;
    };
    _proto.setStartDate = function(startDate) {
        if (typeof startDate != 'string') {
            return;
        }
        this._startDate = startDate;
    };
    _proto.getDueDate = function() {
        return this._dueDate;
    };
    _proto.setDueDate = function(dueDate) {
        if (typeof dueDate != 'string') {
            return;
        }
        this._dueDate = dueDate;
    };
    _proto.getInputType = function() {
        return this._inputType;
    };
    _proto.setInputType = function(inputType) {
        if (inputType == null || typeof inputType != 'number') {
            return;
        }
        this._inputType = inputType;
    };
    _proto.getResultVisible = function() {
        return this._resultVisible;
    };
    _proto.setResultVisible = function(resultVisible) {
        if (resultVisible == null || typeof resultVisible != 'number') {
            return;
        }
        this._resultVisible = resultVisible;
    };
    _proto.getGraphType = function() {
        return this._graphType;
    };
    _proto.setGraphType = function(graphType) {
        if (graphType == null || typeof graphType != 'number') {
            return;
        }
        this._graphType = graphType;
    };
    _proto.getOptionCount = function() {
        return this._optionCount;
    };
    _proto.setOptionCount = function(optionCount) {
        if (optionCount == null || typeof optionCount != 'number') {
            return;
        }
        this._optionCount = optionCount;
    };
    _proto.getOptionItems = function() {
        return this._optionItems;
    };
    _proto.setOptionItems = function(optionItems) {
        if (optionItems == null || typeof optionItems != 'object') {
            return;
        }
        this._optionItems = optionItems;
    };
    _proto.getRoomType = function() {
        return this._roomType;
    };
    _proto.setRoomType = function(roomType) {
        if (roomType == null || typeof roomType != 'string') {
            return;
        }
        this._roomType = roomType;
    };
    _proto.getRoomId = function() {
        return this._roomId;
    };
    _proto.setRoomId = function(roomId) {
        if (roomId == null || typeof roomId != 'string') {
            return;
        }
        this._roomId = roomId;
    };
    _proto.getRoomName = function() {
        return this._roomName;
    };
    _proto.setRoomName = function(roomName) {
        if (roomName == null || typeof roomName != 'string') {
            return;
        }
        this._roomName = roomName;
    };
    _proto.getParentRoomId = function() {
        return this._parentRoomId;
    };
    _proto.setParentRoomId = function(parentroomid) {
        if (parentroomid == null || typeof parentroomid != 'string') {
            return;
        }
        this._parentRoomId = parentroomid;
    };
    _proto.getVoteFlag = function() {
        return this._voteFlag;
    };
    _proto.setVoteFlag = function(flag) {
        this._voteFlag = flag;
    };
    _proto.copy = function(message) {
        if (message == null || typeof message != 'object') {
            return;
        }
        var _self = this;
        _self.setFrom(message.getFrom());
        _self.setMessage(message.getMessage());
        _self.setDate(message.getDate());
        _self.setItemId(message.getItemId());
        _self.setId(message.getId());
        _self.setHistory(message.isHistory());
        _self._goodJobList.copy(message.getGoodJobList());
        _self.setReadMore(message.isReadMore());
        _self._attachedFileUrlList.copy(message.getAttachedFileUrlList());

        if (message.getType() != Message.TYPE_QUESTIONNAIRE) {
            return;
        }
        _self.setInputType(message.getInputType());
        _self.setResultVisible(message.getResultVisible());
        _self.setGraphType(message.getGraphType());
        _self.setOptionCount(message.getOptionCount());
        _self.setOptionItems(message.getOptionItems());
        _self.setRoomType(message.getRoomType());
        _self.setRoomId(message.getRoomId());
        _self.setStartDate(message.getStartDate());
        _self.setDueDate(message.getDueDate());
    };
    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = false;
        switch(name) {
            case 'id':
                _ret = (_self.getId() == value);
                break;
            case 'item_id':
                _ret = (_self.getItemId() == value);
                break;
            case 'msgtype':
                _ret = (_self.getType() == value);
                break;
            case 'msgfrom':
                _ret = (_self.getFrom() == value);
                break;
            case 'created_at':
                _ret = (_self.getDate() == value);
                break;
            case 'msgto':
                if (_self.getRoomType() == Message.TYPE_PUBLIC+'') {
                    _ret = (_self.getRoomId() == '')
                } else if (_self.getRoomType() == Message.TYPE_GROUP_CHAT+'' ||
                    _self.getRoomType() == Message.TYPE_COMMUNITY) {
                    _ret = (_self.getRoomId() == value);
                }
                break;
            default:
                break;
        }
        return _ret;
    };
})();

function MurmurMessage() {
    ChatMessage.call(this);
    this._type = Message.TYPE_MURMUR;
    this._columnName = '';
};(function() {
    MurmurMessage.DIRECTION_SEND = 0;
    MurmurMessage.DIRECTION_RECEIVE = 1;
    var Super = function Super() {
    };
    Super.prototype = ChatMessage.prototype;
    MurmurMessage.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MurmurMessage.prototype;
    _proto.isMatchFilterCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchFilterCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeyword = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeyword.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.hasKeywordPreInfomation = function(value, include) {
        var _self = this;
        var _ret = _super.hasKeywordPreInfomation.call(_self, value, include);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchGraterThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchGraterThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.isMatchLessThanCondition = function(name, value) {
        var _self = this;
        var _ret = _super.isMatchLessThanCondition.call(_self, name, value);
        if (_ret) {
            return _ret;
        }
        return _ret;
    };
    _proto.setColumnName = function(value) {
        var _self = this;
        if (typeof value !== 'string') {
            return false;
        }
        _self._columnName = value;
        return true;
    };
    _proto.getColumnName = function() {
        return this._columnName;
    };
})();
