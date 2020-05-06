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
function ColumnFilterManager() {
};(function() {

    var _proto = ColumnFilterManager.prototype;

    ColumnFilterManager.getColumnFilter = function(columnType, subData) {
        var _retCondition = null;
        switch(columnType){
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
                _retCondition = FeedColumnFilter.getFilter();
                break;
            case ColumnInformation.TYPE_COLUMN_MENTION:
                _retCondition = MentionColumnFilter.getFilter();
                break;
            case ColumnInformation.TYPE_COLUMN_TOME:
                _retCondition = ToMeColumnFilter.getFilter();
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                _retCondition = ChatColumnFilter.getFilter(subData);
                break;
            case ColumnInformation.TYPE_COLUMN_TASK:
                _retCondition = TaskColumnFilter.getFilter();
                break;
            case ColumnInformation.TYPE_COLUMN_INBOX:
                _retCondition = InboxColumnFilter.getFilter();
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                _retCondition = GroupChatColumnFilter.getFilter(subData);
                break;
            case ColumnInformation.TYPE_COLUMN_MAIL:
                _retCondition = MailColumnFilter.getFilter();
                break;
            case ColumnInformation.TYPE_COLUMN_RECENT:
                _retCondition = RecentColumnFilter.getFilter(subData);
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
                _retCondition = CommunityFeedColumnFilter.getFilter(subData);
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                _retCondition = CommunityTaskColumnFilter.getFilter(subData);
                break;
            case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE:
                _retCondition = QuestionnaireColumnFilter.getFilter();
                break;
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                _retCondition = MurmurColumnFilter.getFilter(subData);
                break;
            default:
                break;
        }
        return _retCondition;
    };

    ColumnFilterManager.getColumnFilterList = function(columnTypeList) {
        var _retCondition = null;
        var _count = columnTypeList.getCount();
        if (_count > 1) {
            _retCondition = new OrCondition();
            for (var i = 0; i < _count; i++) {
                var _filterCondition = ColumnFilterManager.getColumnFilter(columnTypeList.get(i));
                if (_filterCondition != null) {
                    _retCondition.addChildCondition(_filterCondition);
                }
            }
        } else {
            var _filterCondition = ColumnFilterManager.getColumnFilter(columnTypeList.get(0));
            if (_filterCondition != null) {
                _retCondition = _filterCondition;
            }
        }
        return _retCondition;
    };

    ColumnFilterManager.getColumnFilterForCommunity = function(columnTypeList, subData) {
        var _self = this;
        var _retCondition = null;
        var _count = columnTypeList.getCount();
        if (_count > 1) {
            _retCondition = new OrCondition();
            for (var i = 0; i < _count; i++) {
                var _curColumnType = columnTypeList.get(i);
                var _subData = null;
                if(_curColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED
                        || _curColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK){
                    _subData = subData;
                }
                var _filterCondition = ColumnFilterManager.getColumnFilter(_curColumnType, _subData);
                if (_filterCondition != null) {
                    _retCondition.addChildCondition(_filterCondition);
                }
            }
        } else {
            var _columnType = columnTypeList.get(0);
            var _subData = null;
            if(_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED
                    || _columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK){
                _subData = subData;
            }
            var _filterCondition = ColumnFilterManager.getColumnFilter(_columnType, _subData);
            if (_filterCondition != null) {
                _retCondition = _filterCondition;
            }
        }
        return _retCondition;
    };

})();

function FeedColumnFilter() {
};(function() {

    var _proto = FeedColumnFilter.prototype;

    FeedColumnFilter.getFilter = function() {

        var _msgTypeItemFeedCondition = new ItemCondition();
        _msgTypeItemFeedCondition.setData('msgtype', Message.TYPE_PUBLIC);

        var _msgTypeItemQuestionnaireCondition = new ItemCondition();
        _msgTypeItemQuestionnaireCondition.setData('msgtype', Message.TYPE_QUESTIONNAIRE);

        var _addOrCondition = new OrCondition();
        var _retCondition = new AndCondition();
        _addOrCondition.addChildCondition(_msgTypeItemFeedCondition);
        _addOrCondition.addChildCondition(_msgTypeItemQuestionnaireCondition);
        _retCondition.addChildCondition(_addOrCondition);

        var _msgtypeCondition = new ItemCondition();
        var jid = LoginUser.getInstance().getJid();
        var tenant_uuid = jid.slice(jid.lastIndexOf("@") + 1);
        _msgtypeCondition.setData('msgto', tenant_uuid);
        _retCondition.addChildCondition(_msgtypeCondition);

        return _retCondition;
    };
})();

function MyfeedColumnFilter() {
};(function() {

    var _proto = MyfeedColumnFilter.prototype;

    MyfeedColumnFilter.getFilter = function() {
        var _loginUserJid = LoginUser.getInstance().getJid();
        var _retCondition = new AndCondition();
        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_PUBLIC);
        _retCondition.addChildCondition(_msgTypeItemCondition);

        var _followerList = CubeeController.getInstance().getFollowList();
        var _msgFromList = new ArrayList();
        _msgFromList.add(_loginUserJid);
        for (var i = 0; i < _followerList.getCount(); i++) {
            _msgFromList.add(_followerList.get(i).getJid());
        }

        var _orCondition = new OrCondition();
        var _count = _msgFromList.getCount();
        if (_count > 1) {
            for (var i = 0; i < _count; i++) {
                var _orMsgFromItemCondition = new ItemCondition();
                _orMsgFromItemCondition.setData('msgfrom', _msgFromList.get(i));
                _orCondition.addChildCondition(_orMsgFromItemCondition);
            }
            _retCondition.addChildCondition(_orCondition);
        } else {
            var _msgFromItemCondition = new ItemCondition();
            _msgFromItemCondition.setData('msgfrom', _msgFromList.get(0));
            _retCondition.addChildCondition(_msgFromItemCondition);
        }

        return _retCondition;
    };
})();

function ChatColumnFilter() {
};(function() {

    var _proto = ChatColumnFilter.prototype;

    ChatColumnFilter.getFilter = function(subData) {
        var _loginUserJid = LoginUser.getInstance().getJid();
        var _retCondition = new AndCondition();
        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_CHAT);
        _retCondition.addChildCondition(_msgTypeItemCondition);
        if(subData == null || subData.partner == null || typeof subData.partner != 'string') {
            var _orCondition = new OrCondition();
            var _msgFromItemCondition = new ItemCondition();
            _msgFromItemCondition.setData('msgfrom', _loginUserJid);
            _orCondition.addChildCondition(_msgFromItemCondition);
            var _msgToItemCondition = new ItemCondition();
            _msgToItemCondition.setData('msgto', _loginUserJid);
            _orCondition.addChildCondition(_msgToItemCondition);
            _retCondition.addChildCondition(_orCondition);
        } else {
            var _orCondition = new OrCondition();
            var _fromMeToPartnerAnd = new AndCondition();
            var _msgFromMeItemCondition = new ItemCondition();
            _msgFromMeItemCondition.setData('msgfrom', _loginUserJid);
            _fromMeToPartnerAnd.addChildCondition(_msgFromMeItemCondition);
            var _msgToPartnerItemCondition = new ItemCondition();
            _msgToPartnerItemCondition.setData('msgto', subData.partner);
            _fromMeToPartnerAnd.addChildCondition(_msgToPartnerItemCondition);
            _orCondition.addChildCondition(_fromMeToPartnerAnd);
            var _fromPartnerToMePartnerAnd = new AndCondition();
            var _msgFromPartnerItemCondition = new ItemCondition();
            _msgFromPartnerItemCondition.setData('msgfrom', subData.partner);
            _fromPartnerToMePartnerAnd.addChildCondition(_msgFromPartnerItemCondition);
            var _msgToMeItemCondition = new ItemCondition();
            _msgToMeItemCondition.setData('msgto', _loginUserJid);
            _fromPartnerToMePartnerAnd.addChildCondition(_msgToMeItemCondition);

            _orCondition.addChildCondition(_fromPartnerToMePartnerAnd);
            _retCondition.addChildCondition(_orCondition);
        }
        return _retCondition;
    };

})();

function TaskColumnFilter() {
};(function() {

    var _proto = TaskColumnFilter.prototype;

    TaskColumnFilter.getFilter = function() {
        var _retCondition = new AndCondition();
        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_TASK);
        _retCondition.addChildCondition(_msgTypeItemCondition);
        var _ownerItemCondition = new ItemCondition();
        _ownerItemCondition.setData('owner', LoginUser.getInstance().getJid());
        _retCondition.addChildCondition(_ownerItemCondition);
        var _andCondition = new AndCondition();
        var _notInboxStatusCondition = new NotCondition();
        var _inboxStatusItemCondition = new ItemCondition();
        _inboxStatusItemCondition.setData('status', TaskMessage.STATUS_INBOX);
        _notInboxStatusCondition.setChildCondition(_inboxStatusItemCondition);
        _andCondition.addChildCondition(_notInboxStatusCondition);
        var _orCondition = new OrCondition();
        var _notAssigningStatusCondition = new NotCondition();
        var _assigningStatusItemCondition = new ItemCondition();
        _assigningStatusItemCondition.setData('status', TaskMessage.STATUS_ASSIGNING);
        _notAssigningStatusCondition.setChildCondition(_assigningStatusItemCondition);
        _orCondition.addChildCondition(_notAssigningStatusCondition);
        var _parentItemIdItemCondition = new ItemCondition();
        _parentItemIdItemCondition.setData('parent_item_id', '');
        _orCondition.addChildCondition(_parentItemIdItemCondition);
        _andCondition.addChildCondition(_orCondition);
        _retCondition.addChildCondition(_andCondition);
        return _retCondition;
    };

})();

function InboxColumnFilter() {
};(function() {

    var _proto = InboxColumnFilter.prototype;

    InboxColumnFilter.getFilter = function() {
        var _retCondition = new AndCondition();
        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_TASK);
        _retCondition.addChildCondition(_msgTypeItemCondition);
        var _ownerItemCondition = new ItemCondition();
        _ownerItemCondition.setData('owner', LoginUser.getInstance().getJid());
        _retCondition.addChildCondition(_ownerItemCondition);
        var _orCondition = new OrCondition();
        var _inboxStatusItemCondition = new ItemCondition();
        _inboxStatusItemCondition.setData('status', TaskMessage.STATUS_INBOX);
        _orCondition.addChildCondition(_inboxStatusItemCondition);
        var _andCondition = new AndCondition();
        var _assigningStatusItemCondition = new ItemCondition();
        _assigningStatusItemCondition.setData('status', TaskMessage.STATUS_ASSIGNING);
        _andCondition.addChildCondition(_assigningStatusItemCondition);
        var _notCondition = new NotCondition();
        var _parentItemIdItemCondition = new ItemCondition();
        _parentItemIdItemCondition.setData('parent_item_id', '');
        _notCondition.setChildCondition(_parentItemIdItemCondition);

        _andCondition.addChildCondition(_notCondition);
        _orCondition.addChildCondition(_andCondition);
        _retCondition.addChildCondition(_orCondition);
        return _retCondition;
    };

})();

function MentionColumnFilter() {
};(function() {

    var _proto = MyfeedColumnFilter.prototype;

    MentionColumnFilter.getFilter = function(subData) {
        var _account = LoginUser.getInstance().getLoginAccount();
        var _retCondition = new AndCondition();
        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_PUBLIC);
        _retCondition.addChildCondition(_msgTypeItemCondition);
        var _retOrCondition = new OrCondition();
        var _keywordStr = "@" + _account;
        var _keywordFilter = new KeywordCondition();
        _keywordFilter.setData(_keywordStr);
        _retOrCondition.addChildCondition(_keywordFilter);
        var _keywordAtAllStr = "@all";
        var _keywordAtAllFilter = new KeywordCondition();
        _keywordAtAllFilter.setData(_keywordAtAllStr);
        _retOrCondition.addChildCondition(_keywordAtAllFilter);
        _retCondition.addChildCondition(_retOrCondition);
        return _retCondition;
    };
})();
function GroupChatColumnFilter() {
};(function() {

    var _proto = GroupChatColumnFilter.prototype;

    GroupChatColumnFilter.getFilter = function(subData) {
        var _msgTypeItemGroupChatCondition = new ItemCondition();
        _msgTypeItemGroupChatCondition.setData('msgtype', Message.TYPE_GROUP_CHAT);

        if(subData == null || subData.roomId == null || typeof subData.roomId != 'string'){
            return _msgTypeItemGroupChatCondition;
        }
        var _msgTypeItemQuestionnaireCondition = new ItemCondition();
        _msgTypeItemQuestionnaireCondition.setData('msgtype', Message.TYPE_QUESTIONNAIRE);
        var _retCondition = new AndCondition();
        var _addOrCondition = new OrCondition();
        _addOrCondition.addChildCondition(_msgTypeItemGroupChatCondition);
        _addOrCondition.addChildCondition(_msgTypeItemQuestionnaireCondition);
        _retCondition.addChildCondition(_addOrCondition);
        var _roomIdItemCondition = new ItemCondition();
        _roomIdItemCondition.setData('msgto', subData.roomId);
        _retCondition.addChildCondition(_roomIdItemCondition);
        return _retCondition;
    };
})();
function CommunityFeedColumnFilter() {
};(function() {

    var _proto = CommunityFeedColumnFilter.prototype;

    CommunityFeedColumnFilter.getFilter = function(subData) {
        var _msgTypeItemCommunityFeedCondition = new ItemCondition();
        _msgTypeItemCommunityFeedCondition.setData('msgtype', Message.TYPE_COMMUNITY);

        if(subData == null || subData.roomId == null || typeof subData.roomId != 'string'){
            return _msgTypeItemCommunityFeedCondition;
        }
        var _msgTypeItemQuestionnaireCondition = new ItemCondition();
        _msgTypeItemQuestionnaireCondition.setData('msgtype', Message.TYPE_QUESTIONNAIRE);
        var _retCondition = new AndCondition();
        var _addOrCondition = new OrCondition();
        _addOrCondition.addChildCondition(_msgTypeItemCommunityFeedCondition);
        _addOrCondition.addChildCondition(_msgTypeItemQuestionnaireCondition);
        _retCondition.addChildCondition(_addOrCondition);
        var _roomIdItemCondition = new ItemCondition();
        _roomIdItemCondition.setData('msgto', subData.roomId);
        _retCondition.addChildCondition(_roomIdItemCondition);
        return _retCondition;
    };
})();

function QuestionnaireColumnFilter() {
};(function() {
    var _proto = QuestionnaireColumnFilter.prototype;

    QuestionnaireColumnFilter.getFilter = function() {
        var _msgTypeItemQuestionnaireCondition = new ItemCondition();
        _msgTypeItemQuestionnaireCondition.setData('msgtype', Message.TYPE_QUESTIONNAIRE);

        return _msgTypeItemQuestionnaireCondition;
    };
})();

function CommunityTaskColumnFilter() {
};(function() {

    var _proto = CommunityTaskColumnFilter.prototype;

    CommunityTaskColumnFilter.getFilter = function(subData) {
        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_TASK);

        if(subData == null || subData.roomId == null || typeof subData.roomId != 'string'){
            return _msgTypeItemCondition;
        }
        var _retCondition = new AndCondition();
        var _groupNameItemCondition = new ItemCondition();
        _groupNameItemCondition.setData('group_name', subData.roomId);
        var _notRequestedTask = new ItemCondition();
        _notRequestedTask.setData('parent_item_id', '');

        var _statusNotCondition = new NotCondition();
        var _inboxStatusCondition = new ItemCondition();
        _inboxStatusCondition.setData('status', TaskMessage.STATUS_INBOX);
        _statusNotCondition.setChildCondition(_inboxStatusCondition);

        _retCondition.addChildCondition(_groupNameItemCondition);
        _retCondition.addChildCondition(_notRequestedTask);
        _retCondition.addChildCondition(_statusNotCondition);
        return _retCondition;
    };
    CommunityTaskColumnFilter.getFilterWithoutCompletedTask = function(subData) {
        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_TASK);

        if(subData == null || subData.roomId == null || typeof subData.roomId != 'string'){
            return _msgTypeItemCondition;
        }
        var _retCondition = new AndCondition();
        var _groupNameItemCondition = new ItemCondition();
        _groupNameItemCondition.setData('group_name', subData.roomId);
        var _notRequestedTask = new ItemCondition();
        _notRequestedTask.setData('parent_item_id', '');

        var _statusOrCondition = new OrCondition();
        var _assignStatusCondition = new ItemCondition();
        _assignStatusCondition.setData('status', TaskMessage.STATUS_ASSIGNING);
        var _newStatusCondition = new ItemCondition();
        _newStatusCondition.setData('status', TaskMessage.STATUS_NEW);
        var _doingStatusCondition = new ItemCondition();
        _doingStatusCondition.setData('status', TaskMessage.STATUS_DOING);
        _statusOrCondition.addChildCondition(_assignStatusCondition);
        _statusOrCondition.addChildCondition(_newStatusCondition);
        _statusOrCondition.addChildCondition(_doingStatusCondition);

        _retCondition.addChildCondition(_groupNameItemCondition);
        _retCondition.addChildCondition(_notRequestedTask);
        _retCondition.addChildCondition(_statusOrCondition);
        return _retCondition;
    };
})();

function MailColumnFilter() {
};(function() {

    var _proto = MailColumnFilter.prototype;

    MailColumnFilter.getFilter = function(subData) {
        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_MAIL);
        return _msgTypeItemCondition;
    };
})();

function RecentColumnFilter() {
};(function() {

    var _proto = RecentColumnFilter.prototype;

    RecentColumnFilter.getFilter = function(subData) {

        var _retCondition = new OrCondition();

        var _watchFeedCondition = MentionColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_watchFeedCondition);

        var _taskItemCondition = TaskColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_taskItemCondition);

        var _inboxItemCondition = InboxColumnFilter.getFilter();
        _retCondition.addChildCondition(_inboxItemCondition);

        var _mailItemCondition = MailColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_mailItemCondition);

        var _communityItemCondition = CommunityFeedColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_communityItemCondition);

        var _chatItemCondition = ChatColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_chatItemCondition);

        var _groupChatItemCondition = GroupChatColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_groupChatItemCondition);

        var _msgTypeItemQuestionnaireCondition = new ItemCondition();
        _msgTypeItemQuestionnaireCondition.setData('msgtype', Message.TYPE_QUESTIONNAIRE);
        _retCondition.addChildCondition(_msgTypeItemQuestionnaireCondition);

        let _murmurItemCondition = MyMurmurColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_murmurItemCondition);

        var _notificationSettingCondition = _getNotificationSettingFilter(NotificationSettingManager.getInstance().getNotificationInfo(), subData);

        var _outSideCondition = RecentColumnFilter._getOutSideFilter(subData);

        if ((_notificationSettingCondition != null) || (_outSideCondition != null)) {

            var _retCustomCondition = new AndCondition();
            _retCustomCondition.addChildCondition(_retCondition);

            if (_notificationSettingCondition != null) {
                _retCustomCondition.addChildCondition(_notificationSettingCondition);
            }

            if (_outSideCondition != null) {
                _retCustomCondition.addChildCondition(_outSideCondition);
            }

            return _retCustomCondition;
        }

        return _retCondition;
    };

    function _getNotificationSettingFilter(notificationInfo, subData) {
        if (!notificationInfo) {
            return null;
        }
        var _len = notificationInfo.length;
        if (_len < 1) {
            return null;
        }

        var _conditions = [];
        for (var _i = 0; _i < _len; _i++) {
            var _byTypeCondition = null;
            var _type = parseInt(notificationInfo[_i].type);
            switch (_type) {
                case ColumnInformation.TYPE_COLUMN_CHAT :
                    _byTypeCondition = new AndCondition();

                    var _msgTypeItemCondition = new ItemCondition();
                    _msgTypeItemCondition.setData('msgtype', Message.TYPE_CHAT);

                    var _msgOrCondition = new OrCondition();
                    var _msgFromPartnerItemCondition = new ItemCondition();
                    _msgFromPartnerItemCondition.setData('msgfrom', notificationInfo[_i].id);
                    var _msgToPartnerItemCondition = new ItemCondition();
                    _msgToPartnerItemCondition.setData('msgto', notificationInfo[_i].id);

                    _msgOrCondition.addChildCondition(_msgFromPartnerItemCondition);
                    _msgOrCondition.addChildCondition(_msgToPartnerItemCondition);

                    _byTypeCondition.addChildCondition(_msgTypeItemCondition);
                    _byTypeCondition.addChildCondition(_msgOrCondition);
                    break;
                case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
                    _byTypeCondition = new AndCondition();

                    var _msgTypeItemCondition = new ItemCondition();
                    _msgTypeItemCondition.setData('msgtype', Message.TYPE_GROUP_CHAT);

                    var _msgToPartnerItemCondition = new ItemCondition();
                    _msgToPartnerItemCondition.setData('msgto', notificationInfo[_i].id);

                    _byTypeCondition.addChildCondition(_msgTypeItemCondition);
                    _byTypeCondition.addChildCondition(_msgToPartnerItemCondition);
                    break;
                case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED :
                    _byTypeCondition = new AndCondition();

                    var _msgTypeItemCondition = new ItemCondition();
                    _msgTypeItemCondition.setData('msgtype', Message.TYPE_COMMUNITY);

                    var _msgToPartnerItemCondition = new ItemCondition();
                    _msgToPartnerItemCondition.setData('msgto', notificationInfo[_i].id);

                    _byTypeCondition.addChildCondition(_msgTypeItemCondition);
                    _byTypeCondition.addChildCondition(_msgToPartnerItemCondition);
                    break;
                case ColumnInformation.TYPE_COLUMN_MENTION :
                case ColumnInformation.TYPE_COLUMN_TOME :
                    _byTypeCondition = ToMeColumnFilter.getFilter();
                    break;
                case ColumnInformation.TYPE_COLUMN_TASK :
                    _byTypeCondition = TaskColumnFilter.getFilter(subData);
                    break;
                case ColumnInformation.TYPE_COLUMN_INBOX :
                    _byTypeCondition = InboxColumnFilter.getFilter(subData);
                    break;
                case ColumnInformation.TYPE_COLUMN_MAIL :
                    _byTypeCondition = MailColumnFilter.getFilter(subData);
                    break;
                default :
                    continue;
            }
            if (_byTypeCondition) {
                _conditions.push(_byTypeCondition);
            }
        }

        var _retCondition = new NotCondition();
        var _count = _conditions.length;
        if (_count == 1) {
            _retCondition.setChildCondition(_conditions[0]);
        }
        else {
            var _orCondition = new OrCondition();
            for (var _i = 0; _i < _count; _i++) {
                _orCondition.addChildCondition(_conditions[_i]);
            }
            _retCondition.setChildCondition(_orCondition);
        }
        return _retCondition;
    }

    RecentColumnFilter._getOutSideFilter = function(subData) {
        return null;
    }
})();

function MurmurColumnFilter() {
};(function() {

    var _proto = MurmurColumnFilter.prototype;

    MurmurColumnFilter.getFilter = function(subData) {
        var _msgTypeItemMurmurCondition = new ItemCondition();
        _msgTypeItemMurmurCondition.setData('msgtype', Message.TYPE_MURMUR);
        if(subData == null || subData.jid == null || typeof subData.jid != 'string'){
            return _msgTypeItemMurmurCondition;
        }
        var _retCondition = new AndCondition();
        _retCondition.addChildCondition(_msgTypeItemMurmurCondition);
        var _roomIdItemCondition = new ItemCondition();
        _roomIdItemCondition.setData('msgto', subData.jid);
        _retCondition.addChildCondition(_roomIdItemCondition);
        return _retCondition;
    };
})();

function MyMurmurColumnFilter() {
};(function() {

    var _proto = MyMurmurColumnFilter.prototype;

    MyMurmurColumnFilter.getFilter = function() {
        var _retCondition = new AndCondition();
        var _msgTypeItemMurmurCondition = new ItemCondition();
        _msgTypeItemMurmurCondition.setData('msgtype', Message.TYPE_MURMUR);
        _retCondition.addChildCondition(_msgTypeItemMurmurCondition);

        let followees = LoginUser.getInstance().getFolloweeList();

        var _orCondition = new OrCondition();
        _retCondition.addChildCondition(_orCondition);

        let myjid = LoginUser.getInstance().getJid();
        var _myjidItemCondition = new ItemCondition();
        _myjidItemCondition.setData('msgto', myjid);
        _orCondition.addChildCondition(_myjidItemCondition);

        var _myrepItemCondition = new ItemCondition();
        _myrepItemCondition.setData('msgfrom', myjid);
        _orCondition.addChildCondition(_myrepItemCondition);

        var _account = LoginUser.getInstance().getLoginAccount();
        var _keywordStr = "@" + _account;
        var _keywordFilter = new KeywordCondition();
        _keywordFilter.setData(_keywordStr);
        _orCondition.addChildCondition(_keywordFilter);

        var _keywordAtAllStr = "@all";
        var _keywordAtAllFilter = new KeywordCondition();
        _keywordAtAllFilter.setData(_keywordAtAllStr);
        _orCondition.addChildCondition(_keywordAtAllFilter);

        if(followees.getCount() > 0){
            for(let i=0;i<followees.getCount();i++){
                let _followeeItemCondition = new ItemCondition();
                _followeeItemCondition.setData('msgto', followees.get(i).getJid());
                _orCondition.addChildCondition(_followeeItemCondition);
            }
        }
        return _retCondition;
    };
})();

function AllMurmurColumnFilter() {
};(function() {

    var _proto = AllMurmurColumnFilter.prototype;

    AllMurmurColumnFilter.getFilter = function() {
        var _msgTypeItemMurmurCondition = new ItemCondition();
        _msgTypeItemMurmurCondition.setData('msgtype', Message.TYPE_MURMUR);

        return _msgTypeItemMurmurCondition;
    };
})();

function ToMeColumnFilter() {
};(function() {

    var _proto = ToMeColumnFilter.prototype;

    ToMeColumnFilter.getFilter = function(subData) {

        var _retCondition = new OrCondition();

        var _watchFeedCondition = MentionColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_watchFeedCondition);

        var _taskItemCondition = TaskColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_taskItemCondition);

        var _inboxItemCondition = InboxColumnFilter.getFilter();
        _retCondition.addChildCondition(_inboxItemCondition);

        var _mailItemCondition = MailColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_mailItemCondition);

        var _communityItemCondition = CommunityFeedColumnFilter.getFilter(subData);
        var _communityItemConditionToMe = _addToMeCondition(_communityItemCondition);
        _retCondition.addChildCondition(_communityItemConditionToMe);

        var _chatItemCondition = ChatColumnFilter.getFilter(subData);
        _retCondition.addChildCondition(_chatItemCondition);

        var _groupChatItemCondition = GroupChatColumnFilter.getFilter(subData);
        var _groupChatItemConditionToMe = _addToMeCondition(_groupChatItemCondition);
        _retCondition.addChildCondition(_groupChatItemConditionToMe);

        let _murmurItemCondition = MurmurColumnFilter.getFilter({jid:LoginUser.getInstance().getJid()});
        _retCondition.addChildCondition(_murmurItemCondition);
        let followees = LoginUser.getInstance().getFolloweeList();
        for(let i=0;i<followees.getCount();i++){
            let jid = followees.get(i).getJid();
            if(jid != null){
                let _fMurmurItemCondition = MurmurColumnFilter.getFilter({jid:jid});
                let _fMurmurItemConditionToMe = _addToMeCondition(_fMurmurItemCondition);
                _retCondition.addChildCondition(_fMurmurItemConditionToMe);
            }
        }

        return _retCondition;
    };

    function _addToMeCondition(orgCondition) {
        var _retCondition = new AndCondition();
        _retCondition.addChildCondition(orgCondition);
        var _retOrCondition = new OrCondition();

        var _account = LoginUser.getInstance().getLoginAccount();
        var _keywordStr = "@" + _account;
        var _keywordFilter = new KeywordCondition();
        _keywordFilter.setData(_keywordStr);
        _retOrCondition.addChildCondition(_keywordFilter);
        var _keywordAtAllStr = "@all";
        var _keywordAtAllFilter = new KeywordCondition();
        _keywordAtAllFilter.setData(_keywordAtAllStr);
        _retOrCondition.addChildCondition(_keywordAtAllFilter);
        _retCondition.addChildCondition(_retOrCondition);
        return _retCondition;
    }
})();
