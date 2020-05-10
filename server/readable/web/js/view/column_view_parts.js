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
function ColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    if (!htmlElement || typeof htmlElement !== 'object') {
        this._htmlElement = null;
    } else {
        this._htmlElement = htmlElement;
    }
    if (!columnInfo || typeof columnInfo !== 'object') {
        this._columnInfo = null;
    } else {
        this._columnInfo = columnInfo;
    }
    if (!ownerObj || typeof ownerObj !== 'object') {
        this._ownerObj = null;
    } else {
        this._ownerObj = ownerObj;
    }
    this._createEventHandler();
} ; (function () {
    ColumnOptionMenu.ELEMENT_CLASS_NAME = 'column_option_menu';
    ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME = 'filter';
    ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME = 'custom_filter';
    ColumnOptionMenu.ELEMENT_MENU_NOTIFICATION_VAL_NAME = 'notificationicon_setting';
    ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST = 'thread_title';
    ColumnOptionMenu.ELEMENT_MENU_NOTE_ASSIGNED_LIST = 'assigned_note';
    ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK = 'read_in_bulk';
    ColumnOptionMenu.ELEMENT_MENU_SET_MURMUR_COLUMN_NAME = 'set_murmur_column_name';
    ColumnOptionMenu.getHtml = function (columnInfo) {
        var _searchDisplayName = columnInfo.getDisplayName();
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        var _type = columnInfo.getColumnType();
        if (_type == ColumnInformation.TYPE_COLUMN_CHAT || _type == ColumnInformation.TYPE_COLUMN_TIMELINE) {
            _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST + '">' + Resource.getMessage('column_option_thread_title_list') + '</a></li>';
            _ret += CodiMdViewUtils.getNoteListHtmlElementForColumn();
        }
        _ret += ColumnOptionMenu.getNotificationSettingHtml(columnInfo);
        _ret += '</ul>';
        return _ret;
    };

    ColumnOptionMenu.getNotificationSettingHtml = function (columnInfo) {
        var _type = columnInfo.getColumnType();
        var _id = null;
        switch (_type) {
            case ColumnInformation.TYPE_COLUMN_MENTION :
                break;
            case ColumnInformation.TYPE_COLUMN_TOME :
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT :
                _id = columnInfo.getFilterCondition();
                break;
            case ColumnInformation.TYPE_COLUMN_TASK :
                break;
            case ColumnInformation.TYPE_COLUMN_INBOX :
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
                _id = columnInfo.getChatRoomInfomation().getRoomId();
                break;
            case ColumnInformation.TYPE_COLUMN_MAIL :
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED :
                _id = columnInfo.getCommunityInfomation().getRoomId();
                break;
            case ColumnInformation.TYPE_COLUMN_MURMUR :
                _id = MurmurColumnInformation.getOwnJidFromSearchCondition(columnInfo);
                break;
            default :
                return "";
        }
        var _notificationSettingManager = NotificationSettingManager.getInstance();
        var _element_menu_notification_val_name = "";
        if (_notificationSettingManager.isSetting(_type, _id)) {
            _element_menu_notification_val_name = Resource.getMessage('column_option_notification_on');
        }
        else {
            _element_menu_notification_val_name = Resource.getMessage('column_option_notification_off');
        }
        return '<li value="' + ColumnOptionMenu.ELEMENT_MENU_NOTIFICATION_VAL_NAME + '"><a class="txt_btn" data-modal="' + ColumnOptionMenu.ELEMENT_MENU_NOTIFICATION_VAL_NAME  + '">' + _element_menu_notification_val_name + '</a></li>';
    };
    var _proto = ColumnOptionMenu.prototype;

    _proto._createEventHandler = function () {
        var _self = this;
        var _rootElement = _self._htmlElement;
        if (_rootElement === null) {
            return;
        }
        var _filterMenu = _rootElement.find('li [value="' + ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME + '"]');
        _filterMenu.on('click', function () {
            var _title = $(this).text();
            var _filterSettingDialogView = new DialogSettingFilterView(_title, _self._columnInfo, _self._ownerObj);
            _filterSettingDialogView.showDialog();
        });
        var _customFilterMenu = _rootElement.find('li [value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '"]');
        _customFilterMenu.on('click', function () {
            var _title = $(this).text();
            if(_self._columnInfo == null) {
                return;
            }
            var _customFilterSettingDialogView = null;
            var _isInboxCustomFilter = false;
            var _parentColumType = _self._columnInfo.getColumnType();
            if(_parentColumType == ColumnInformation.TYPE_COLUMN_TASK || _parentColumType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK || (_parentColumType == ColumnInformation.TYPE_COLUMN_FILTER && (_self._columnInfo.getSourceColumnType() == ColumnInformation.TYPE_COLUMN_TASK || _self._columnInfo.getSourceColumnType() == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK))) {
                var _filterTaskSettingDialogView = new DialogSettingFilterMyTaskView(_title, _self._columnInfo, _self._ownerObj, null);
                _filterTaskSettingDialogView.showDialog();
            } else if(_parentColumType == ColumnInformation.TYPE_COLUMN_INBOX || (_parentColumType == ColumnInformation.TYPE_COLUMN_FILTER && _self._columnInfo.getSourceColumnType() == ColumnInformation.TYPE_COLUMN_INBOX)) {
                _customFilterSettingDialogView = new DialogSettingCustomFilterInboxView(_title, _self._columnInfo, _self._ownerObj);
            } else {
                _customFilterSettingDialogView = new DialogSettingCustomFilterView(_title, _self._columnInfo, _self._ownerObj);
            }
            if(_customFilterSettingDialogView != null) {
                _customFilterSettingDialogView.showDialog();
            }
        });
        var _threadTitleMenu = _rootElement.find('li [value="' + ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST + '"]');
        _threadTitleMenu.on('click', function () {
            var _threadTitleDialogView = new DialogThreadTitleListView(_self._columnInfo, _self._ownerObj);
            _threadTitleDialogView.showDialog();
        });
        var _noteListMenu = _rootElement.find('li [value="' + ColumnOptionMenu.ELEMENT_MENU_NOTE_ASSIGNED_LIST + '"]');
        _noteListMenu.on('click', function () {
            var _dialogNoteListView = new DialogNoteListView(_self._columnInfo);
            _dialogNoteListView.showDialog();
        });
        var _filterMenu = _rootElement.find('li[value="'+ ColumnOptionMenu.ELEMENT_MENU_NOTIFICATION_VAL_NAME +'"]');
        _filterMenu.on('click', function () {

            var _obj = $(this).find("a");
            var _columnInfo = _self._columnInfo;
            var _type = _columnInfo.getColumnType();
            var _id = null;
            switch (_type) {
                case ColumnInformation.TYPE_COLUMN_MENTION :
                    break;
                case ColumnInformation.TYPE_COLUMN_TOME :
                    break;
                case ColumnInformation.TYPE_COLUMN_CHAT :
                    _id = _columnInfo.getFilterCondition();
                    break;
                case ColumnInformation.TYPE_COLUMN_TASK :
                    break;
                case ColumnInformation.TYPE_COLUMN_INBOX :
                    break;
                case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
                    _id = _columnInfo.getChatRoomInfomation().getRoomId();
                    break;
                case ColumnInformation.TYPE_COLUMN_MAIL :
                    break;
                case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED :
                    _id = _columnInfo.getCommunityInfomation().getRoomId();
                    break;
                case ColumnInformation.TYPE_COLUMN_MURMUR :
                    _id = MurmurColumnInformation.getOwnJidFromSearchCondition(columnInfo);
                    break;
                default :
                    return false;
            }
            var _notificationSettingManager = NotificationSettingManager.getInstance();
            if (_notificationSettingManager.isSetting(_type, _id)) {
                _notificationSettingManager.removeSetting(_type, _id, _callback);
            }
            else {
                _notificationSettingManager.appendSetting(_type, _id, _callback);
            }

            function _callback() {
                var _notificationSettingManager = NotificationSettingManager.getInstance();
                if (_notificationSettingManager.isSetting(_type, _id)) {
                    _obj.text(Resource.getMessage('column_option_notification_on'));
                }
                else {
                    _obj.text(Resource.getMessage('column_option_notification_off'));
                }
                var _columnList = ColumnManager.getInstance().getColumnList();
                var _columnCount = _columnList.getCount();
                for (var _i = 0; _i < _columnCount; _i++) {
                    var _columnInfo = _columnList.get(_i);
                    if (_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_RECENT) {
                        var _filterCondition = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_RECENT);
                        var _sortCondition = _columnInfo.getSearchCondition().getSortCondition();
                        var _searchCondition = new ColumnSearchCondition(_filterCondition, _sortCondition);
                        _columnInfo.setSearchCondition(_searchCondition);
                        break;
                    }
                }
            }
        });
        var _readBulkMenu = _rootElement.find('li [value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '"]');
        _readBulkMenu.on('click', function () {
            var _dialogReadBulkView = new DialogReadInBulkCheckView(_self._columnInfo,
                                                                    $(this).closest(".card.col_card.chat_card"));
            _dialogReadBulkView.showDialog();
        });
    };
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self._htmlElement;
        if (_rootElement != null) {
            _rootElement.off();
            _self._htmlElement = null;
        }
        if(_self.columnInfo){
            _self.columnInfo = null;
        }
        if(_self.ownerObj){
            _self.ownerObj = null;
        }
    };

})();

function GroupChatColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj)
};(function() {
    GroupChatColumnOptionMenu.ELEMENT_MENU_CHANGE_AUTHORITY_MEMBER_VAL_NAME = 'change-authority-member';
    GroupChatColumnOptionMenu.ELEMENT_MENU_ADD_MEMBER_VAL_NAME = 'add-member';
    GroupChatColumnOptionMenu.ELEMENT_MENU_LEAVE_MEMBER_VAL_NAME = 'leave-member';
    GroupChatColumnOptionMenu.ELEMENT_MENU_LIST_MEMBER_VAL_NAME = 'list-member';
    GroupChatColumnOptionMenu.ELEMENT_MENU_UNSUBSCRIBE_VAL_NAME = 'unsubscribe';
    GroupChatColumnOptionMenu.ELEMENT_MENU_PUBLIC_GC_ROOM_UNSUBSCRIBE_VAL_NAME = 'public-gc-room-unsubscribe';
    GroupChatColumnOptionMenu.ELEMENT_MENU_UPDATE_ROOM_INFO_VAL_NAME = 'update-room-info';
    GroupChatColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = GroupChatColumnOptionMenu.prototype;
    GroupChatColumnOptionMenu.getHtml = function(columnInfo) {
        let _privacyType = columnInfo.getChatRoomInfomation().getPrivacyType();
        var _action = AuthorityInfo.getInstance().getWhichRightToGroupchatResource(columnInfo.getChatRoomInfomation().getRoomId());
        if (_action == null) {
            return '';
        }
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST + '">' + Resource.getMessage('column_option_thread_title_list') + '</a></li>';
        _ret += CodiMdViewUtils.getNoteListHtmlElementForColumn();
        if (_action == AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE) {
            _ret += '  <li><a class="txt_btn" value="' + GroupChatColumnOptionMenu.ELEMENT_MENU_UPDATE_ROOM_INFO_VAL_NAME + '">' + Resource.getMessage('column_option_group_chat_update_room_info') + '</a></li>';
            _ret += '  <li><a class="txt_btn" value="' + GroupChatColumnOptionMenu.ELEMENT_MENU_ADD_MEMBER_VAL_NAME + '">' + Resource.getMessage('column_option_group_chat_add_member') + '</a></li>';
            _ret += '  <li><a class="txt_btn" value="' + GroupChatColumnOptionMenu.ELEMENT_MENU_CHANGE_AUTHORITY_MEMBER_VAL_NAME + '">' + Resource.getMessage('column_option_group_chat_change_authority_member') + '</a></li>';
            _ret += '  <li><a class="txt_btn" value="' + GroupChatColumnOptionMenu.ELEMENT_MENU_LEAVE_MEMBER_VAL_NAME + '">' + Resource.getMessage('column_option_group_chat_leave_member') + '</a></li>';
        } else {
            _ret += '  <li><a class="txt_btn" value="' + GroupChatColumnOptionMenu.ELEMENT_MENU_LIST_MEMBER_VAL_NAME + '">' + Resource.getMessage('column_option_group_chat_list_member') + '</a></li>';
            if(_privacyType != ChatRoomInformation.PRIVACY_TYPE_ITEM_OPEN){
                _ret += '  <li><a class="txt_btn" value="' + GroupChatColumnOptionMenu.ELEMENT_MENU_UNSUBSCRIBE_VAL_NAME + '">' + Resource.getMessage('column_option_group_chat_unsubscribe') + '</a></li>';
            }
        }
        _ret += ColumnOptionMenu.getNotificationSettingHtml(columnInfo);
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        if(_privacyType == ChatRoomInformation.PRIVACY_TYPE_ITEM_OPEN){
            _ret += '  <li><a class="txt_btn" value="' + GroupChatColumnOptionMenu.ELEMENT_MENU_PUBLIC_GC_ROOM_UNSUBSCRIBE_VAL_NAME + '">' + Resource.getMessage('column_option_public_group_chat_unsubscribe') + '</a></li>';
        }
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        _super._createEventHandler.call(this);
        var _self = this;
        var _rootElement = _self._htmlElement;
        if (_rootElement == null) {
            return;
        }
        var _columnOptionMenu = _rootElement.find('li');
        _columnOptionMenu.on('click', function() {
            var _title = $(this).text();
            var _roomId = _self._columnInfo.getChatRoomInfomation().getRoomId();
            var _dialogView = null;

            var _value = $(this).find('a').attr("value");
            switch(_value){
                case GroupChatColumnOptionMenu.ELEMENT_MENU_ADD_MEMBER_VAL_NAME:
                    _dialogView = new DialogSelectChatRoomAddMemberView(_roomId);
                    break;
                case GroupChatColumnOptionMenu.ELEMENT_MENU_CHANGE_AUTHORITY_MEMBER_VAL_NAME:
                    _dialogView = new DialogSelectChatRoomChangeAuthorityMemberView(_roomId);
                    break;
                case GroupChatColumnOptionMenu.ELEMENT_MENU_LEAVE_MEMBER_VAL_NAME:
                    _dialogView = new DialogSelectChatRoomForceLeaveMemberView(_roomId);
                    break;
                case GroupChatColumnOptionMenu.ELEMENT_MENU_UNSUBSCRIBE_VAL_NAME:
                    _dialogView = new DialogUnsubscribeCheckView(_roomId);
                    break;
                case GroupChatColumnOptionMenu.ELEMENT_MENU_PUBLIC_GC_ROOM_UNSUBSCRIBE_VAL_NAME:
                    _dialogView = new DialogGroupChatUnsubscribeCheckView(_roomId);
                    break;
                case GroupChatColumnOptionMenu.ELEMENT_MENU_LIST_MEMBER_VAL_NAME:
                    _dialogView = new DialogSelectChatRoomConfirmAuthorityMemberView(_roomId);
                    break;
                case GroupChatColumnOptionMenu.ELEMENT_MENU_UPDATE_ROOM_INFO_VAL_NAME:
                    _dialogView = new DialogChatRoomUpdateRoomInfoView(_title, _self._columnInfo.getChatRoomInfomation().getRoomId());
                    break;
                default:
                    return;
            }
            if(_dialogView){
                _dialogView.showDialog();
            }
            if(_value != GroupChatColumnOptionMenu.ELEMENT_MENU_UPDATE_ROOM_INFO_VAL_NAME){
                var textareaElement = $('textarea#add-member-account-input');
                ViewUtils.setCursorEndOfLineForText(textareaElement);
            }
        });
    };
})();

function TaskColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj);
};(function() {
    TaskColumnOptionMenu.ELEMENT_MENU_FILTER_TASK_VAL_NAME = 'filter_task';

    TaskColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = TaskColumnOptionMenu.prototype;

    TaskColumnOptionMenu.getHtml = function(columnInfo) {
        var _ret = '';
        _ret += '<ul id="' + ColumnOptionMenu.ELEMENT_ID_NAME + '" class="' + ColumnOptionMenu.ELEMENT_CLASS_NAME + ' popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + TaskColumnOptionMenu.ELEMENT_MENU_FILTER_TASK_VAL_NAME + '">' + Resource.getMessage('task_filter_dialog_title') + '</a></li>';
        _ret += ColumnOptionMenu.getNotificationSettingHtml(columnInfo);
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        _super._createEventHandler.call(this);
        var _self = this;
        var _rootElement = _self._htmlElement;
        if (_rootElement == null) {
            return;
        }
        var _filterTaskMenu = _rootElement.find('li [value="'+ TaskColumnOptionMenu.ELEMENT_MENU_FILTER_TASK_VAL_NAME +'"]');
        _filterTaskMenu.on('click', function () {
            var _title = $(this).text();
            var _filterTaskSettingDialogView = new DialogSettingFilterMyTaskView(_title, _self._columnInfo, _self._ownerObj, null);
            _filterTaskSettingDialogView.showDialog();
        });
    };
})();

function CommunityFeedColumnOptionMenu(htmlElement, columnInfo, ownerObj, tabType) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj);
    this._tabType = tabType;
};(function() {
    CommunityFeedColumnOptionMenu.ELEMENT_MENU_ADD_COLUMN_TO_MYWORKPLACE_VAL_NAME = 'add-myworkplace';
    CommunityFeedColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = CommunityFeedColumnOptionMenu.prototype;
    CommunityFeedColumnOptionMenu.getHtml = function(columnInfo, tabType) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST + '">' + Resource.getMessage('column_option_thread_title_list') + '</a></li>';
        _ret += CodiMdViewUtils.getNoteListHtmlElementForColumn();
        if(tabType != TabItemView.TYPE_MY_WORK_PLACE) {
            _ret += '  <li><a class="txt_btn" value="' + CommunityFeedColumnOptionMenu.ELEMENT_MENU_ADD_COLUMN_TO_MYWORKPLACE_VAL_NAME + '">' + Resource.getMessage('column_option_add_myworkplace') + '</a></li>';
        }
        _ret += ColumnOptionMenu.getNotificationSettingHtml(columnInfo);
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        _super._createEventHandler.call(this);
        var _self = this;
        var _rootElement = _self._htmlElement;
        if (_rootElement == null) {
            return;
        }
        if(_self._tabType != TabItemView.TYPE_MY_WORK_PLACE) {
            var _addMyWorkplaceMenu = _rootElement.find('a[value="'+ CommunityFeedColumnOptionMenu.ELEMENT_MENU_ADD_COLUMN_TO_MYWORKPLACE_VAL_NAME +'"]');
            _addMyWorkplaceMenu.on('click', function() {
                var _columnInfo = _self._columnInfo;
                if(_columnInfo == null || _columnInfo.getColumnType() != ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
                    return;
                }
                var _communityInfo = _columnInfo.getCommunityInfomation();
                if(_communityInfo == null) {
                    return;
                }
                var _communityId = _communityInfo.getRoomId();
                if(_communityId == null || _communityId == '') {
                    return;
                }
                function onActiveMyWorkplace(result) {
                    if(!result) {
                        return;
                    }
                    ColumnManager.getInstance().addCommunityFeedColumn(_communityId, true, false);
                };
                if(TabManager.getInstance().isActiveMyWorkplace()) {
                    onActiveMyWorkplace(true);
                } else {
                    TabManager.getInstance().activeMyWorkplaceTab(onActiveMyWorkplace);
                }
            });
        }
    };
})();

function CommunityTaskColumnOptionMenu(htmlElement, columnInfo, ownerObj, tabType) {
    TaskColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj);
    this._tabType = tabType;
};(function() {
    CommunityTaskColumnOptionMenu.ELEMENT_MENU_ADD_COLUMN_TO_MYWORKPLACE_VAL_NAME = 'add-myworkplace';
    CommunityTaskColumnOptionMenu.prototype = $.extend({}, TaskColumnOptionMenu.prototype);
    var _super = TaskColumnOptionMenu.prototype;
    var _proto = CommunityTaskColumnOptionMenu.prototype;
    CommunityTaskColumnOptionMenu.getHtml = function(columnInfo, tabType) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        if(tabType != TabItemView.TYPE_MY_WORK_PLACE) {
            _ret += '  <li><a class="txt_btn" value="' + CommunityFeedColumnOptionMenu.ELEMENT_MENU_ADD_COLUMN_TO_MYWORKPLACE_VAL_NAME + '">' + Resource.getMessage('column_option_add_myworkplace') + '</a></li>';
        }
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        _super._createEventHandler.call(this);
        var _self = this;
        var _rootElement = _self._htmlElement;
        if (_rootElement == null) {
            return;
        }
        if(_self._tabType != TabItemView.TYPE_MY_WORK_PLACE) {
            var _addMyWorkplaceMenu = _rootElement.find('li [value="'+ CommunityTaskColumnOptionMenu.ELEMENT_MENU_ADD_COLUMN_TO_MYWORKPLACE_VAL_NAME +'"]');
            _addMyWorkplaceMenu.on('click', function() {
                var _columnInfo = _self._columnInfo;
                if(_columnInfo == null || _columnInfo.getColumnType() != ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
                    return;
                }
                var _communityInfo = _columnInfo.getCommunityInfomation();
                if(_communityInfo == null) {
                    return;
                }
                var _communityId = _communityInfo.getRoomId();
                if(_communityId == null || _communityId == '') {
                    return;
                }
                function onActiveMyWorkplace(result) {
                    if(!result) {
                        return;
                    }
                    ColumnManager.getInstance().addCommunityTaskColumn(_communityId, true, false);
                };
                if(TabManager.getInstance().isActiveMyWorkplace()) {
                    onActiveMyWorkplace(true);
                } else {
                    TabManager.getInstance().activeMyWorkplaceTab(onActiveMyWorkplace);
                }
            });
        }
    };
})();

function ToMeColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj)
};(function() {
    ToMeColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = ToMeColumnOptionMenu.prototype;
    ToMeColumnOptionMenu.getHtml = function(columnInfo) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        var _type = columnInfo.getColumnType();
        if (_type == ColumnInformation.TYPE_COLUMN_CHAT || _type == ColumnInformation.TYPE_COLUMN_TIMELINE) {
            _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST + '">' + Resource.getMessage('column_option_thread_title_list') + '</a></li>';
            _ret += CodiMdViewUtils.getNoteListHtmlElementForColumn();
        }
        _ret += ColumnOptionMenu.getNotificationSettingHtml(columnInfo);
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
    };
})();

function WithReadDoneColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj)
};(function() {
    WithReadDoneColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = WithReadDoneColumnOptionMenu.prototype;
    WithReadDoneColumnOptionMenu.getHtml = function(columnInfo) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        var _type = columnInfo.getColumnType();
        if (_type == ColumnInformation.TYPE_COLUMN_CHAT || _type == ColumnInformation.TYPE_COLUMN_TIMELINE) {
            _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST + '">' + Resource.getMessage('column_option_thread_title_list') + '</a></li>';
            _ret += CodiMdViewUtils.getNoteListHtmlElementForColumn();
        }
        _ret += ColumnOptionMenu.getNotificationSettingHtml(columnInfo);
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
    };
})();

function ConversationColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj)
};(function() {
    ConversationColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = ConversationColumnOptionMenu.prototype;
    ConversationColumnOptionMenu.getHtml = function(columnInfo) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
    };
})();

function CustomFilterColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj)
};(function() {
    CustomFilterColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = CustomFilterColumnOptionMenu.prototype;
    CustomFilterColumnOptionMenu.getHtml = function(columnInfo) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
    };
})();

function FilterColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj)
};(function() {
    FilterColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = FilterColumnOptionMenu.prototype;
    FilterColumnOptionMenu.getHtml = function(columnInfo) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
    };
})();

function RecentColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj)
};(function() {
    RecentColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    var _super = ColumnOptionMenu.prototype;
    var _proto = RecentColumnOptionMenu.prototype;
    RecentColumnOptionMenu.getHtml = function(columnInfo) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST + '">' + Resource.getMessage('column_option_thread_title_list') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
    };
})();

function MurmurColumnOptionMenu(htmlElement, columnInfo, ownerObj) {
    ColumnOptionMenu.call(this, htmlElement, columnInfo, ownerObj)
};(function() {
    MurmurColumnOptionMenu.prototype = $.extend({}, ColumnOptionMenu.prototype);
    const _super = ColumnOptionMenu.prototype;
    const _proto = MurmurColumnOptionMenu.prototype;
    MurmurColumnOptionMenu.getHtml = function(columnInfo) {
        var _ret = '<ul class="popup_list">';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_CUSTOM_FILTER_VAL_NAME + '">' + Resource.getMessage('column_option_custom_filter') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_THREAD_TITLE_LIST + '">' + Resource.getMessage('column_option_thread_title_list') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_NOTE_ASSIGNED_LIST + '">' + Resource.getMessage('dialog_label_get_note_list') + '</a></li>';
        _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_READ_IN_BULK + '">' + Resource.getMessage('read_in_bulk_control') + '</a></li>';
        if(MurmurColumnInformation.getOwnJidFromSearchCondition(columnInfo) == LoginUser.getInstance().getJid()){
            _ret += '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_SET_MURMUR_COLUMN_NAME
                  + '">' + Resource.getMessage('set_murmur_column_name') + '</a></li>';
        }
        _ret += '</ul>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
        const _rootElement = _self._htmlElement;
        const _menu = _rootElement.find('li [value="' + ColumnOptionMenu.ELEMENT_MENU_SET_MURMUR_COLUMN_NAME + '"]');
        _menu.on('click', function () {
            const _dialogMurmurColumnNameSetView = new DialogMurmurColumnNameSetView(_self._columnInfo);
            _dialogMurmurColumnNameSetView.showDialog();
        });
    };
})();

function ColumnButtonView(htmlElement, parent, name, clickEventCallback, tooltip) {
    this._htmlElement = htmlElement;
    this._parent = parent;
    this.updateNameHtml(name, tooltip);
    this._clickEventCallback = clickEventCallback;
    this._createEventHandler();
};(function() {
    ColumnButtonView.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnButtonView.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.off();
        this._htmlElement = null;
        this._parent = null;
    };
    ColumnButtonView.getHtml = function(columnType) {
        var _ret = '';
        switch(columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_CHAT:
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_INBOX:
            case ColumnInformation.TYPE_COLUMN_SEARCH:
            case ColumnInformation.TYPE_COLUMN_FILTER:
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
            case ColumnInformation.TYPE_COLUMN_RECENT:
            case ColumnInformation.TYPE_COLUMN_TOME:
            case ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION:
            case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE:
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                _ret = '<button type="button" title=""></button>';
                break;
            case ColumnInformation.TYPE_COLUMN_MAIL:
                break;
            default:
                throw 'ColumnButtonView::getHtml _ invalid type:' + columnType;
                break;
        }
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        if (!_rootElement) {
            return;
        }
        _rootElement.button();
        _rootElement.on('mousedown', function() {
            _self._clickEventCallback();
        });
    };
    _proto._clickEventCallback = function() {
        throw 'ColumnButtonView::_clickEventCallback _ need override';
    }
    _proto.updateNameHtml = function(name, tooltip) {
        var _self = this;
        if (!name || typeof name != 'string') {
            return;
        }
        var _rootElement = _self.getHtmlElement();
        if (!_rootElement) {
            return;
        }
        _rootElement.attr('data-original-title', tooltip ? tooltip : name);
        _rootElement.attr('data-toggle', 'tooltip');
        _rootElement.attr('data-placement', 'bottom');
        _rootElement.html(name);
    };
})();

function ColumnSubmitButtonView(htmlElement, parent, name, tooltip) {
    ColumnButtonView.call(this, htmlElement, parent, name, this._clickEventCallback, tooltip);
};(function() {
    ColumnSubmitButtonView.getHtml = ColumnButtonView.getHtml;
    ColumnSubmitButtonView.prototype = $.extend({}, ColumnButtonView.prototype);
    var _super = ColumnButtonView.prototype;
    var _proto = ColumnSubmitButtonView.prototype;

    _proto._clickEventCallback = function() {
        var _self = this;
        if (_self._parent) {
            _self._parent.clickSubFormButton();
        }
    };
})();
function ColumnReloadButtonView(htmlElement, parent, name) {
    ColumnButtonView.call(this, htmlElement, parent, name, this._clickEventCallback);
};(function() {
    ColumnReloadButtonView.getHtml = ColumnButtonView.getHtml;
    ColumnReloadButtonView.prototype = $.extend({}, ColumnButtonView.prototype);
    var _super = ColumnButtonView.prototype;
    var _proto = ColumnReloadButtonView.prototype;
    _proto._clickEventCallback = function() {
         var _self = this;
         if (_self._parent) {
             _self._parent.clickReloadButton();
         }
    };
})();

function ColumnTextAreaView(htmlElement, parent, placeholder) {
    this._htmlElement = htmlElement;
    this._parent = parent;
    if (placeholder && typeof placeholder == 'string') {
        htmlElement.attr('placeholder', placeholder);
    }
    this._ctrlFlg = false;
    this._createEventHandler();
};(function() {
    ColumnTextAreaView.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnTextAreaView.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.find('*').trigger('autosize.destroy').off().remove();
        _rootElement.off();
        this._htmlElement = null;
        this._parent = null;
    };
    _proto.getType = function() {
        return this._type;
    };
    ColumnTextAreaView.getHtml = function(columnType, autoCompleteInfo,SendMessageRight) {
        var _ret = '';
        if (columnType == null || typeof columnType != 'number') {
            return _ret;
        }
        if (autoCompleteInfo == null || typeof autoCompleteInfo != 'object') {
            return _ret;
        }
        var _autoCompleteType = 'autocomplete';
        var _roomIdAttribute = '';
        switch(autoCompleteInfo.sourceColumnType){
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
                _autoCompleteType = 'autocomplete-for-chatroom';
                _roomIdAttribute = 'groupId="' + autoCompleteInfo.roomId + '"';
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                _autoCompleteType = 'autocomplete-for-community';
                _roomIdAttribute = 'groupId="' + autoCompleteInfo.roomId + '"';
                break;
            default :
                break;
        }

        switch(columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
                if (SendMessageRight != true) {
                    _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;" disabled=true ></textarea>';
                } else {
                     _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area-title ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 32px; height: 32px; max-height: 300px; padding-top: 6px;"></textarea>';
                     _ret += ColumnTextAreaView.getTitleCategorySelectorHtml();
                     _ret += '<p style="margin: 0px 0 1.5px;"></p>';
                     _ret += '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;"></textarea>';
                }
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area-title ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 32px; height: 32px; max-height: 300px; padding-top: 6px;"></textarea>';
                _ret += ColumnTextAreaView.getTitleCategorySelectorHtml();
                _ret += '<p style="margin: 0px 0 1.5px;"></p>';
                _ret += '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;"></textarea>';
                break;
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_INBOX:
                _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;"></textarea>';
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                if (SendMessageRight != true) {
                    _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area  ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;" disabled=true ></textarea>';
                } else {
                    _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area-title ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 32px; height: 32px; max-height: 300px; padding-top: 6px;"></textarea>';
                    _ret += ColumnTextAreaView.getTitleCategorySelectorHtml('', autoCompleteInfo.roomId);
                    _ret += '<p style="margin: 0px 0 1.5px;"></p>';
                    _ret += '<a class="menthion-dialog-btn fa fa-at" data-toggle="tooltip" data-original-title="'+Resource.getMessage('menthion_icon_title')+'"></a>';
                    _ret += '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;"></textarea>';
                }
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
                if (SendMessageRight != true) {
                    _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area  ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;" disabled=true ></textarea>';
                } else {
                    _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area-title ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 32px; height: 32px; max-height: 300px; padding-top: 6px;"></textarea>';
                    _ret += ColumnTextAreaView.getTitleCategorySelectorHtml('', autoCompleteInfo.roomId);
                    _ret += '<p style="margin: 0px 0 1.5px;"></p>';
                    _ret += '<a class="menthion-dialog-btn fa fa-at" data-toggle="tooltip" data-original-title="'+Resource.getMessage('menthion_icon_title')+'"></a>';
                    _ret += '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;"></textarea>';
                }
                break;
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_MAIL:
            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
            case ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION:
                break;
            case ColumnInformation.TYPE_COLUMN_SEARCH:
            case ColumnInformation.TYPE_COLUMN_FILTER:
            case ColumnInformation.TYPE_COLUMN_TOME:
            case ColumnInformation.TYPE_COLUMN_RECENT:
                _ret = '<input type="text" class="ui-corner-all message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + 'style="min-height: 3em; overflow-y:visible!important">';
                break;
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                if (SendMessageRight != true) {
                    _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;" disabled=true ></textarea>';
                } else {
                    _ret = '<textarea class="ui-corner-all autoresize-textarea message-input-area-title ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 32px; height: 32px; max-height: 300px; padding-top: 6px;"></textarea>';
                    _ret += ColumnTextAreaView.getTitleCategorySelectorHtml("", "", Message.TYPE_MURMUR);
                    _ret += '<p style="margin: 0px 0 1.5px;"></p>';
                    _ret += '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + '" ' + _roomIdAttribute + ' placeholder="" style="min-height: 60.5px; max-height: 300px;"></textarea>';
                }
                break;
            default:
                throw 'ColumnTextAreaView::getHtml _ invalid type:' + columnType;
                break;
        }
        return _ret;
    };
    ColumnTextAreaView.getCharCounterHtml = function(columnType, sendMessage=false) {
        var _ret = '';
        if (columnType == null || typeof columnType != 'number') {
            return _ret;
        }
        switch(columnType) {
            case ColumnInformation.TYPE_COLUMN_INBOX:
            case ColumnInformation.TYPE_COLUMN_MENTION:
                _ret += ViewUtils.getCharCounterHtml('char-counter-column');
                break;
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_CHAT:
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                if (sendMessage || columnType == ColumnInformation.TYPE_COLUMN_CHAT) {
                    _ret += ViewUtils.getCharCounterHtml('char-counter-title-column');
                    _ret += '<span style="display: inline-block; font-size: 0.5rem; font-weight: bold; margin-right: 2px">,</span>';
                }
                _ret += ViewUtils.getCharCounterHtml('char-counter-column');
                break;
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_SEARCH:
            case ColumnInformation.TYPE_COLUMN_FILTER:
            case ColumnInformation.TYPE_COLUMN_MAIL:
            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
            case ColumnInformation.TYPE_COLUMN_RECENT:
            case ColumnInformation.TYPE_COLUMN_TOME:
            case ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION:
                break;
            default:
                throw 'ColumnTextAreaView::getCharCounterHtml _ invalid type:' + columnType;
                break;
        }
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _parent = _self._parent;
        _rootElement.autosize();
        _rootElement.on('focus', function() {
        });
        _rootElement.on('keydown', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                if (_self._ctrlFlg) {
                    var _buttonNode = $(this.parentNode).children('button');
                    $(_buttonNode).mousedown();
                    $(_buttonNode).mouseup();
                } else {
                }
            } else if ((e.which && e.which == 17) || (e.keyCode && e.keyCode == 17)) {
                _self._ctrlFlg = true;
            } else if (e.keyCode === 9 || e.which === 9) {
                if (_rootElement.hasClass('message-input-area-title')) {
                    _rootElement.parent().find('.message-input-area').focus();
                } else {
                    _rootElement.parent().find('.message-input-area-title').focus();
                }
            } else {
                _self._ctrlFlg = false;
            }
        });
        _rootElement.on('keyup', function(e) {
            if ((e.which && e.which == 17) || (e.keyCode && e.keyCode == 17)) {
                _self._ctrlFlg  = false;
            }
        });

        ColumnTextAreaView.setTitleCategorySelectorEvent(_rootElement.parent(),".message-input-area-title");
    };
    _proto.getText = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        return _selfElm.val();
    };
    _proto.clearText = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        _selfElm.val('');
        _selfElm.trigger('autosize.resize');
    };
    _proto.clearTextFromFlag = function(flag) {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        var _text = _selfElm.val();
        setTimeout(function() {
            if (flag != false ||
                (flag == false && _text == '')) {
                _selfElm.val('');
                _selfElm.trigger('autosize.resize');
            } else {
                _selfElm.val(_text);
                _selfElm.trigger('autosize.resize');
            }
        }, 1);
    };
    ColumnTextAreaView.getTitleCategorySelectorHtml = (extra_class_name='', room_id='', msgtype=null) => {
        if(extra_class_name == null){
            extra_class_name = '';
        }
        let datalist = LoginUser.getInstance().getTenantInfo().threadTitleCategory;
        if(msgtype == Message.TYPE_MURMUR){
          let murmurExTitle = LoginUser.getInstance().getTenantInfo().threadTitleCategoryForMurmur
          if (murmurExTitle) {
            datalist = murmurExTitle
          }
        }else if (room_id) {
          let list_room = LoginUser.getInstance().getTenantInfo().threadTitleCategoryForRoom
          if (list_room && room_id in list_room) {
            datalist = list_room[room_id]
          }
        }
        let btn = '<div class="thread-title-category-select-btn popup_btn '+extra_class_name+'"'
                + 'data-original-title="'+Resource.getMessage('title_select_category')+'" data-toggle="tooltip" data-placement="right">'
                + ' <a  class="fa fa-caret-right"></a>'
                + '</div>';
        let sel = '<ul class="thread-title-category-select-list popup_list '+extra_class_name+'">';
        if(datalist && Object.keys(datalist).length != 0){
            let datalistSorted = Object.keys(datalist).sort((a,b)=>{
                return datalist[a].id - datalist[b].id;
            });
            for(let i=0;i<datalistSorted.length;i++){
                let val = decodeURIComponent(datalistSorted[i]);
                let bgColor = datalist[datalistSorted[i]].bgColor;
                // Unused variable color.
                // let color = datalist[datalistSorted[i]].color;
                sel +=' <li class="thread-title-category-select-opt '
                    + extra_class_name + '" category="'
                    + val + '"><a><span class="title-category-color fa fa-check-square" style="font-size:16px;vertical-align:-1px;margin-right:5px;color:'
                    + bgColor + '"></span>' + val + '</a></li>';
            }
        }
        sel += '</ul>';
        return btn + sel;
    }

    ColumnTextAreaView.setTitleCategorySelectorEvent = (frm_message_eml, title_form_selector) => {
        let list = frm_message_eml.find('.thread-title-category-select-list');
        frm_message_eml.find('.thread-title-category-select-btn')
                       .off('click.thread-title-category-select-btn');
        frm_message_eml.find('.thread-title-category-select-opt')
                       .off('click.thread-title-category-select-opt');
        $(list).hide();
        frm_message_eml.find('.thread-title-category-select-btn').on(
            'click.thread-title-category-select-btn', (cuttentBtn)=>{
                if($(list).css('display') == 'block'){
                    $(list).css('z-index','1');
                }else{
                    let classCheck = $(cuttentBtn.currentTarget).attr("class").split(" ");
                    let backgroundSelector = "body";
                    if(classCheck.length > 1 && classCheck[1] != "undefined"){
                        backgroundSelector = "#grouptitle_modal";
                    }
                    $(list).css('z-index','9999');
                    $('<div id="thread-title-category-select-back">')
                        .prependTo(backgroundSelector)
                        .on('click',
                            (cuttent)=>{
                                $(list).css('display','none');
                                $(cuttent.currentTarget).remove();
                            });
                    let catlist = $(cuttentBtn.currentTarget).parent().find("li.thread-title-category-select-opt");
                    let mess = frm_message_eml
                        .find(title_form_selector).val();
                    let catNames = {};
                    for(let i=0;i<catlist.length;i++){
                        catNames[$(catlist[i]).attr("category")] = catlist[i];
                        $(catlist[i]).find("a > span.title-category-color")
                                     .removeClass("fa-check-square")
                                     .addClass("fa-square");
                    }
                    let reg = new RegExp(/\[([^\]\s]+)\]/,'g');
                    let isCatarog = true;
                    let colectCatarog = [];
                    mess.replace(reg,
                                 (match, p1, offset, string) => {
                                     if(p1 &&
                                        isCatarog && colectCatarog.length < 5 &&
                                        (catNames[p1] != null || p1.length <= 2)&&
                                        ((offset > 0 && string.substring(offset-1,offset) == ']') || offset ==0)){
                                         $(catNames[p1]).find("a > span.title-category-color")
                                                        .removeClass("fa-square")
                                                        .addClass("fa-check-square");
                                         colectCatarog.push(p1);
                                         return "";
                                     }else{
                                         isCatarog = false;
                                         return match;
                                     }
                                 });
                }
                return;
            });
        const menuEvent = (cuttent)=>{
            let catlist = $(cuttent.currentTarget)
                .parent().find("li.thread-title-category-select-opt");
            let cate = $(cuttent.currentTarget).attr("category");
            let mess = frm_message_eml
                .find(title_form_selector).val();
            let catNames = {};
            for(let i=0;i<catlist.length;i++){
                catNames[$(catlist[i]).attr("category")] = catlist[i];
            }
            let isCatarog = true;
            let catarog_last_index = 0;
            let colectCatarog = [];
            let reg = new RegExp(/\[([^\]\s]+)\]/,'g');
            mess.replace(reg,
                         (match, p1, offset, string) => {
                             if(p1 && colectCatarog.length < 5 &&
                                isCatarog &&
                                (catNames[p1] != null||p1.length <= 2) &&
                                ((offset > 0 && string.substring(offset-1,offset) == ']') || offset ==0)){
                                 if(catNames[p1] != null){
                                     $(catNames[p1]).find("a > span.title-category-color")
                                                    .removeClass("fa-square")
                                                    .addClass("fa-check-square");
                                 }
                                 catarog_last_index = offset + match.length;
                                 colectCatarog.push(p1);
                                 return "";
                             }else{
                                 isCatarog = false;
                                 return match;
                             }
                         });
            let foundCatarogInMess = false;
            {
                const reg = new RegExp('\\\[(' + cate + ')\\\]');
                if(catarog_last_index > 0){
                    foundCatarogInMess = mess.substring(0,catarog_last_index).match(reg);
                }
                if(!foundCatarogInMess){
                    foundCatarogInMess = (colectCatarog.length >= 5);
                }
            }
            if(!foundCatarogInMess){
                mess = mess.substring(0,catarog_last_index) + '[' + cate + ']' + mess.substring(catarog_last_index);
                setTimeout(()=>{
                    $(cuttent.currentTarget)
                        .parent().find('li.thread-title-category-select-opt[category="'+cate+'"] > a > span.title-category-color')
                        .removeClass("fa-square")
                        .addClass("fa-check-square");
                },300);
            }else
            {
                const reg = new RegExp('\\\[(' + cate + ')\\\]',"g");
                let lastMess = mess.substring(catarog_last_index);
                mess = mess.substring(0,catarog_last_index).replace(reg,"");
                mess += lastMess;
                setTimeout(()=>{
                    $(cuttent.currentTarget)
                        .parent().find('li.thread-title-category-select-opt[category="'+cate+'"] > a > span.title-category-color')
                        .removeClass("fa-check-square")
                        .addClass("fa-square");
                },300);
            }
            $(list).fadeOut(300);
            frm_message_eml.find(title_form_selector).val(mess);

            $("#thread-title-category-select-back").remove();
        }
        frm_message_eml.find('.thread-title-category-select-opt').on(
            'click.thread-title-category-select-opt', menuEvent);
    }
})();

function ColumnFileUploadPartsView(htmlElement, parent) {
    this._htmlElement = htmlElement;
    this._parent = parent;
    this._createEventHandler();

};(function() {
    ColumnFileUploadPartsView.MAX_FILE_UPLOAD_SIZE_MB = 20;
    ColumnFileUploadPartsView.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnFileUploadPartsView.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.off();
        _self._htmlElement = null;
        _self._parent = null;
    };
    ColumnFileUploadPartsView.getHtml = function(columnType) {
        var _ret = '';
        if (columnType == null || typeof columnType != 'number') {
            return _ret;
        }
        switch(columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_CHAT:
            case ColumnInformation.TYPE_COLUMN_INBOX:
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                _ret = _fileUploadFormHtml();
                break;
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_SEARCH:
            case ColumnInformation.TYPE_COLUMN_FILTER:
            case ColumnInformation.TYPE_COLUMN_MAIL:
            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
            case ColumnInformation.TYPE_COLUMN_RECENT:
            case ColumnInformation.TYPE_COLUMN_TOME:
            case ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION:
                break;
            default:
                throw 'ColumnFileUploadPartsView::getHtml _ invalid type:' + columnType;
                break;
        }
        return _ret;
    };
    ColumnFileUploadPartsView.getFormHtml = function() {
        return _fileUploadFormHtml();
    };
    _proto.clearFileUpload = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.find('input[type="file"]').replaceWith(_inputFileTagHtml());
        _rootElement.find('#fileupload_cancel_btn').remove();
        var lavel = _rootElement.find('p.file-name');
        lavel.text('');
        lavel.attr('title', '');
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.on("click", 'div.file-selected > a.ico_btn .fa-paperclip', function() {
            _rootElement.find('input[type="file"]').click();
        });
        if(!ViewUtils.isIE89()){
            _rootElement.on("click", 'div.file-selected > a.ico_btn .fa-close', function() {
                _rootElement.find('input[type="file"]').replaceWith(_inputFileTagHtml());
                $(this).remove();
                var lavel = _rootElement.find('p.file-name');
                lavel.removeClass('ui-state-error-text');
                lavel.text('');
                lavel.attr('title', '');
            });
        } else {
            _rootElement.on("click", 'div.file-inputs > a.ico_btn .fa-close', function() {
                _rootElement.find('input[type="file"]').replaceWith(_inputFileTagHtml());
                $(this).remove();
                ViewUtils.hideErrorMessageIE(_self.getHtmlElement().parent().find('textarea.ui-corner-all'));
            });
        }
        _rootElement.on("change", 'input[type="file"]', function() {
            if(!ViewUtils.isIE89()){
                var file = $(this).prop('files')[0];
                if (!file) {
                    _self.clearFileUpload();
                }else {
                    var _lavel = _rootElement.find('p.file-name');
                    _lavel.removeClass('size_error');
                    var fileSize = 0;
                    if (file.size > 1024 * 1024) {
                        fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100);
                        if (fileSize > ColumnFileUploadPartsView.MAX_FILE_UPLOAD_SIZE_MB) {
                            _self.clearFileUpload();
                            _lavel = _rootElement.find('p.file-name');
                            _lavel.addClass('size_error');
                            _lavel.text(Resource.getMessage('error_file_up_over_max_sixe'));
                            _lavel.attr('title', Resource.getMessage('error_file_up_over_max_sixe'));
                            _lavel.after(_cancelFileUploadButonHtml());
                            return;
                        };
                    }
                    _lavel.text(file.name);
                    _lavel.attr('title', file.name);
                    _rootElement.find('#fileupload_cancel_btn').remove();
                    _lavel.after(_cancelFileUploadButonHtml());
                }
            }else{
                try {
                    var fso = new ActiveXObject("Scripting.FileSystemObject");
                    if (fso.FileExists(this.value)) {
                        var objFile = fso.getFile(this.value);
                        var fileSize = 0;
                        if(objFile.size > 1024 * 1024) {
                            fileSize = (Math.round(objFile.size * 100 / (1024 * 1024)) / 100);
                            if (fileSize > ColumnFileUploadPartsView.MAX_FILE_UPLOAD_SIZE_MB) {
                                _self.clearFileUpload();

                                ViewUtils.showErrorMessageIE(_self.getHtmlElement().parent().find('textarea.ui-corner-all'),Resource.getMessage('error_file_up_over_max_sixe'));

                                var _file = _rootElement.find('input[type="file"]');
                                _file.after(_cancelFileUploadButonHtml());
                                return;
                            };
                        }
                    }
                }catch (e){}

                var _file = _rootElement.find('input[type="file"]');
                _rootElement.find('#fileupload_cancel_btn').remove();
                _file.after(_cancelFileUploadButonHtml());

                ViewUtils.hideErrorMessageIE(_self.getHtmlElement().parent().find('textarea.ui-corner-all'));
            }
        });
    };
    _proto.getFilesObject = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _targetElement = _rootElement.find('input[type="file"]');
        return _targetElement.prop('files');
    };
    _proto.getFileForm = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _targetElement = _rootElement.find('input[type="file"]');
        return _targetElement[0];
    };
    function _cancelFileUploadButonHtml() {
        var ret = '<a class="ico_btn" id="fileupload_cancel_btn">'
        ret += '  <i class="fa fa-close" title="'+Resource.getMessage('dialog_cancel_title')+'"></i>'
        ret += '</a>'
        return ret
    };
    function _inputFileTagHtml() {
        if(!ViewUtils.isIE89()) {
            return '<input type="file" name="upfile" class="file" />';
        } else {
            return '<input type="file" name="uploadfile" class="file-ie" />';
        }
    };
    function _fileUploadFormHtml() {
        var _ret = '<div class="file-inputs white-space-nowrap">';
        _ret += _inputFileTagHtml();
        _ret += '<div class="file-selected">';
        if(!ViewUtils.isIE89()) {
            _ret += '<a class="ico_btn" data-toggle="tooltip" title="" data-original-title="' + Resource.getMessage('file_up_title') + '" data-placement="right"><i class="fa fa-paperclip"></i></a>';
            _ret += '<p class="file-name">&nbsp;</p>';
            _ret += ProgressBarView.getHtml('submit-message-progress');
            _ret += '<br class="clear-float" />';
        } else {
            _ret += '<br class="clear-float" />';
            _ret += '<p class="file-name">&nbsp;</p>';
        }
        _ret += '</div>';
        _ret += '</div>';
        return _ret;
    };
    $(function() {
    });
})();

function ProgressBarView(htmlElement, showFlg) {
    this._htmlElement = htmlElement;
    this._htmlElement.progressbar({
        value : 0
    });
    if (showFlg) {
        this.visibleProgressBar();
    } else {
        this.hiddenProgressBar();
    }
    this._createEventHandler();
};(function() {
    ProgressBarView.MIN_VALUE = 0;
    ProgressBarView.MAX_VALUE = 100;
    ProgressBarView.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ProgressBarView.prototype;
    _proto.cleanup = function() {
        var _self = this;
        _self.getHtmlElement().progressbar("destroy");
        _self.getHtmlElement().remove
        _self._htmlElement = null;
    };
    ProgressBarView.getHtml = function(cssClassName) {
        var _ret = '';
        if (cssClassName == null || typeof cssClassName != 'string') {
            return _ret;
        }
        _ret = '<div class="' + cssClassName + '"></div>';
        return _ret;
    };
    _proto.setProgressValue = function(progressValue) {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.progressbar("option", "value", progressValue);
    };
    _proto.progressComplete = function() {
        var _self = this;
        _self.setProgressValue(ProgressBarView.MAX_VALUE);
    };
    _proto.progressClear = function() {
        var _self = this;
        _self.hiddenProgressBar();
        _self.setProgressValue(ProgressBarView.MIN_VALUE);
    };
    _proto.visibleProgressBar = function() {
        var _self = this;
        _self.getHtmlElement().css('visibility', 'visible');
    };
    _proto.hiddenProgressBar = function() {
        var _self = this;
        _self.getHtmlElement().css('visibility', 'hidden');
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.progressbar({
            complete : function() {
                _self.progressClear();
            }
        });
    };
    $(function() {
    });
})();

function MemberAreaView(htmlElement, parent) {
    this._htmlElement = htmlElement;
    var _readMoreButtonElement = parent.getHtmlElement().find('.group-member-btn');
    this._readMoreButton = new ColumnMessageReadMoreButton(_readMoreButtonElement, this);
    this._parent = parent;
};(function() {
    MemberAreaView.CSS_CLS_NAME = 'column-member-area';
    MemberAreaView.CSS_HEDER_CLS_NAME = MemberAreaView.CSS_CLS_NAME + '-header';
    MemberAreaView.CSS_BODY_CLS_NAME = MemberAreaView.CSS_CLS_NAME + '-body';
    MemberAreaView.CSS_MEMBER_COUNT_CLS_NAME = 'column-member-count';
    var _proto = MemberAreaView.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self._htmlElement;
        _rootElement.off();
        _self._htmlElement = null;
        _self._readMoreButton = null;
        _self._parent = null;
    };

    MemberAreaView.getHtml = function(roomInfo){
        var _ret = '';
        if(roomInfo == null || typeof roomInfo != 'object'){
            return _ret;
        }
        var _memberList = roomInfo.getMemberList();
        var _profileMap = roomInfo.getProfileMap();
        var _count = _memberList.getCount();
        _ret += '<div class="'+ MemberAreaView.CSS_CLS_NAME +'">';
        _ret += '<div class="'+ MemberAreaView.CSS_BODY_CLS_NAME +' hide-view cf">';
        _ret += '<div class="'+ MemberAreaView.CSS_HEDER_CLS_NAME +'">';
        _ret += '<div class="'+ MemberAreaView.CSS_MEMBER_COUNT_CLS_NAME +'">'+ _getMemberCountString(_count) +'</div>';
        _ret += '</div>';
        for(var _i = 0; _i < _count; _i++){
            var _jid = _memberList.get(_i);
            var _profile = _profileMap.getByKey(_jid);
            var _person = ViewUtils.createPersonByProfile(_jid, _profile);
            _ret += ViewUtils.getAvatarDataHtmlFromPerson(_person);
        }
        _ret += '</div>';
        _ret += '</div>';
        return _ret;
    };

    _proto.changeMessage = function() {
        var _self = this;
        var _parent = _self._parent;
        var _rootElement = _self._htmlElement;
        var _memberAreaHtmlElement = _rootElement.find('.' + MemberAreaView.CSS_BODY_CLS_NAME);
        var _isVisible = _memberAreaHtmlElement.is(':visible');
        _rootElement.removeClass('animation').toggleClass('open').find('.column-member-area-body').stop().slideToggle(200, function(){
          _rootElement.addClass('animation');
          $(window).trigger('resize');
        });
    };

    function _getMemberCountString(count){
        return Resource.getMessage('gorup_chat_member_label') + count + Resource.getMessage('group_chat_member_count_suffix') + ':';
    };

     function _updateMessageAvatarToolTip(htmlElem) {
        if(htmlElem == null || typeof htmlElem != 'object') {
            return false;
        }
        var _updateElems = htmlElem;
        var _count = _updateElems.length;
        var _currentIndex = 0;
        function _updateAvatarToolTip() {
            if(_currentIndex >= _count) {
                return;
            }
            setTimeout(function() {
                var _updateElem = _updateElems.eq(_currentIndex);
                var _mtipData = _updateElem.data('mTip');
                if(_mtipData){
                    var _mTipElem = $('#' + _mtipData.tipID);
                    if(_mTipElem.length > 0 && _mTipElem.css('display') != 'none'){
                        TooltipView.getInstance().updateAvatarToolTip(_updateElem);
                    }
                }
                _currentIndex++;
                _updateAvatarToolTip();
            }, 1);
        }
        _updateAvatarToolTip();
        return true;
    }

    MemberAreaView.updateMessageAvatarToolTip = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return false;
        }
        var _updateElems = $('.' + MemberAreaView.CSS_CLS_NAME).children('.' + MemberAreaView.CSS_BODY_CLS_NAME).find('.block-avatar[jid=\'' + jid + '\']');
        return _updateMessageAvatarToolTip(_updateElems);
    };

    _proto.updateMessageAvatarToolTip = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return false;
        }
        var _self = this;
        var _updateElems = _self._htmlElement.children('.' + MemberAreaView.CSS_BODY_CLS_NAME).find('.block-avatar[jid=\'' + jid + '\']');
        return _updateMessageAvatarToolTip(_updateElems);
    };

    _proto.addMessageAvatarToolTip = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return false;
        }
        var _self = this;
        var _updateElems = _self._htmlElement.children('.' + MemberAreaView.CSS_BODY_CLS_NAME).find('.block-avatar[jid=\'' + jid + '\']');
        return TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, _updateElems.eq(0), false);
    };
    function _updateMessageAvatarProfile(profileChangeData, htmlElem) {
        if(profileChangeData == null || typeof profileChangeData != 'object') {
            return false;
        }
        if(htmlElem == null || typeof htmlElem != 'object') {
            return false;
        }
        var _jid = profileChangeData.getJid();

        var _person = ViewUtils.createPersonByProfile(_jid, profileChangeData.getProfile());
        var _updateAvaterElems = htmlElem;
        var _count = _updateAvaterElems.length;
        var _currentIndex = 0;
        function _updateAvatarProfile() {
            if(_currentIndex >= _count) {
                return;
            }
            setTimeout(function() {
                var _updateAvaterElem = _updateAvaterElems.eq(_currentIndex);
                var _presenceElem = _updateAvaterElem.find('.button_presence').detach();
                _updateAvaterElem.children('span').remove();
                _updateAvaterElem.prepend($(ViewUtils.getAvatarDataHtmlFromPerson(_person)).children('span'));
                _updateAvaterElem.find('span.ico.ico_user')
                    .removeClass("ico ico_user")
                    .addClass(_presenceElem.attr('class'))
                _currentIndex++;
                _updateAvatarProfile();
            }, 1);
        };
        _updateAvatarProfile();
        return true;
    };

    MemberAreaView.updateMessageAvatarProfile = function(profile) {
        if(profile == null || typeof profile != 'object') {
            return false;
        }
        var _jid = profile.getJid();
        if(_jid == null || typeof _jid != 'string') {
            return false;
        }
        var _updateElems = $('.' + MemberAreaView.CSS_CLS_NAME).children('.' + MemberAreaView.CSS_BODY_CLS_NAME).find('.block-avatar[jid=\'' + _jid + '\']');
        if(!$(_updateElems)[0]){
            return false;
        }
        return _updateMessageAvatarProfile(profile,_updateElems);
    };

    MemberAreaView.updateMessageAvatarPresenceIcon = function(presenceChangeNotice) {
        if(presenceChangeNotice == null || typeof presenceChangeNotice != 'object') {
            return false;
        }
        var _jid = presenceChangeNotice.getJid();

        var _updateElems = $('.' + MemberAreaView.CSS_CLS_NAME).children('.' + MemberAreaView.CSS_BODY_CLS_NAME).find('.block-avatar[jid=\'' + _jid + '\']');
        setTimeout(function(){
            ViewUtils.showPresenceIcon(_updateElems, presenceChangeNotice.getPresence(), ViewUtils.STATUS_PRESENCEICON_GROUPCHAT_MEMBERLIST);
        }, 1);
        return true;
    };
    _proto.onAddMember = function(person) {
        if(person == null || typeof person != 'object') {
            return false;
        }
        var _self = this;
        var _jid = person.getJid();
        var _parent = _self._parent;
        var _avaterHtml = ViewUtils.getAvatarDataHtmlFromPerson(person);
        var _columnInfo = _parent.getColumnInfo();
        var _roomInfo = _columnInfo.getChatRoomInfomation();
        var _curMemberList = _roomInfo.getMemberList();
        var _count = _curMemberList.getCount();
        var _countHtml = _getMemberCountString(_count);
        var _headerCountElems = _self._htmlElement.find('.' + MemberAreaView.CSS_MEMBER_COUNT_CLS_NAME);
        _headerCountElems.text(_countHtml);
        var _bodyElems = _self._htmlElement.children('.' + MemberAreaView.CSS_BODY_CLS_NAME);
        _bodyElems.append(_avaterHtml);

        var _personData = CubeeController.getInstance().getPersonData(_jid);
        var _presence = 0;
        if (_personData != null) {
          _presence = _personData.getPresence();
        }
        var _insertAvatarElem = _bodyElems.find('.block-avatar[jid=\'' + _jid + '\']');
        ViewUtils.showPresenceIcon(_insertAvatarElem, _presence, ViewUtils.STATUS_PRESENCEICON_GROUPCHAT_MEMBERLIST);

        _self.addMessageAvatarToolTip(_jid);
    };

    _proto.onRemoveMember = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return false;
        }
        var _self = this;

        var _parent = _self._parent;
        var _columnInfo = _parent.getColumnInfo();
        var _roomInfo = _columnInfo.getChatRoomInfomation();
        var _curMemberList = _roomInfo.getMemberList();
        var _count = _curMemberList.getCount();
        var _countHtml = _getMemberCountString(_count);
        var _headerCountElems = _self._htmlElement.find('.' + MemberAreaView.CSS_MEMBER_COUNT_CLS_NAME);
        _headerCountElems.text(_countHtml);

        var _rootElement = $(_self._htmlElement);
        _rootElement.find('div[jid="' + jid + '"]').eq(0).remove();
    };

    _proto.updateAvatarPresenceByPersonData = function(person) {
        if(person == null || typeof person != 'object') {
            return;
        }
        var _self = this;
        var _jid = person.getJid();

        var _updateElems = _self._htmlElement.children('.' + MemberAreaView.CSS_BODY_CLS_NAME).find('.block-avatar[jid=\'' + _jid + '\']');
        var _count = _updateElems.length;
        var _currentIndex = 0;
        function _updateAvatarProfile() {
            if(_currentIndex >= _count) {
                return;
            }
            setTimeout(function() {
                var _updateAvaterElem = _updateElems.eq(_currentIndex);
                var _presenceElem = _updateAvaterElem.find('.button_presence').detach();
                _updateAvaterElem.children('span').remove();
                _updateAvaterElem.prepend($(ViewUtils.getAvatarDataHtmlFromPerson(person)).children('span'));
                _updateAvaterElem.find('span.ico.ico_user')
                    .removeClass("ico ico_user")
                    .addClass(_presenceElem.attr('class'));
                _currentIndex++;
                _updateAvatarProfile();
            }, 1);
        }
        _updateAvatarProfile();
    };

})();
