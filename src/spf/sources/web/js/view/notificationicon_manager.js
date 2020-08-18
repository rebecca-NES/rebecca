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

function NotificationIconManager() {
    var _self = this;
    IconAreaView.call(_self);
    _self._attentionHeaderColumnIconSelectors = {};
    _self._attentionHeaderColumnIconPanelConntener = $('#header #mainHeader .ui-sortable');
    _self._cautionIconViewList = new ArrayList();
    _self._iconAreaContener = $('.alert_menu > ul');
};(function() {
    NotificationIconManager.prototype = $.extend({}, IconAreaView.prototype);
    var _super = IconAreaView.prototype;
    var _proto = NotificationIconManager.prototype;
    var _notificationIconManager = new NotificationIconManager();

    NotificationIconManager.getInstance = function() {
        return _notificationIconManager;
    };

    _proto._getIconViewList = function() {
        return this._iconViewList;
    };
    _proto._getCautionIconViewList = function() {
        return this._cautionIconViewList;
    };
    _proto.notifyMessage = function(message) {
        if(message == null || typeof message != 'object') {
            return;
        }
        var _self = this;
        var _loginUserJid = LoginUser.getInstance().getJid();
        if(message.getType() == Message.TYPE_TASK){
            if(_loginUserJid == message.getUpdatedBy()){
                return;
            }
            if(_loginUserJid != message.getOwnerJid()){
                return;
            }
        }else if(message.getType() == Message.TYPE_QUESTIONNAIRE){
            if(_loginUserJid == message.getFrom()){
                return;
            }
        }
        var _notificationColumnType = _self._getNotificationColumnType(message);
        _toMeNotificationIconProc(_self, message);
        var _notificationSettingManager = NotificationSettingManager.getInstance();
        var _id = _getId(message);
        if (_notificationSettingManager.isSetting(_notificationColumnType, _id)) {
            return;
        }
        function _getId(message) {
            var _msgType = message.getType();
            switch(_msgType){
               case Message.TYPE_CHAT :
                   return message.getFrom();
               default :
                   break;
            }
            return null;
        }
        var _idx = _self.checkNotificationIconExistence(_notificationColumnType);
        if(_idx == -1) {
            _self._createNotificationIcon(message);
        } else {
            _self._updateNotificationIcon(message);
        }
        _self.addAttention();
    };

    function _toMeNotificationIconProc(self, message) {
        var _isToMe = ViewUtils.isToMeMessage(message);
        if(!_isToMe){
            return;
        }
        if(message.getFrom() == LoginUser.getInstance().getJid()){
            return;
        }
        var _msgType = message.getType();
        var _notificationSettingManager = NotificationSettingManager.getInstance();
        if (_notificationSettingManager.isSetting(ColumnInformation.TYPE_COLUMN_TOME, null)) {
            return;
        }
        var _iconViewList = self._getIconViewList();
        var _idx = self.checkNotificationIconExistence(ColumnInformation.TYPE_COLUMN_TOME);
        if(_idx == -1){
            var _createdIconView = new ToMeNotificationIconView(message);
            self._getIconViewList().add(_createdIconView);

            self.addAttentionHeaderColumnIcon(
                'li[columntype="'+ ColumnInformation.TYPE_COLUMN_TOME
                +'"].sortable-item .ico_system');
        }else{
            var _iconView = _iconViewList.get(_idx);
            _iconView.updateNotificationArea(message);
        }
    }

    _proto._createNotificationIcon = function(message) {
        if(message == null || typeof message != 'object') {
            return;
        }
        var _self = this;
        var _msgType = message.getType();
        var _createdIconView = null;
        switch(_msgType) {
            case Message.TYPE_PUBLIC:
                break;
            case Message.TYPE_CHAT:
                _createdIconView = new ChatNotificationIconView(message);
                let _id = message.getFrom();
                _self.addAttentionHeaderColumnIcon(
                    'li[jid="'+ _id +'"][columntype="3"].sortable-item .ico');
                break;
            case Message.TYPE_TASK:
                var _isInboxMessage = ViewUtils.isInboxColumnMessage(message);
                if (_isInboxMessage) {
                    _createdIconView = new InboxNotificationIconView(message);
                    _self.addAttentionHeaderColumnIcon(
                        'li[columntype="'+ColumnInformation.TYPE_COLUMN_INBOX
                        +'"].sortable-item .ico_system');
                } else {
                    _createdIconView = new TaskNotificationIconView(message);
                    let _msgto = message.getCommunityId();
                    _self.addAttentionHeaderColumnIcon(
                        'li[msgto="'+_msgto+'"][columntype="'+ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK
                        +'"].sortable-item .ico_system');
                }
                break;
            case Message.TYPE_MAIL:
                _createdIconView = new MailNotificationIconView(message);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                let optItems = message.getOptionItems();
                let isAnswerQuest = false;
                for(let i in optItems["_array"]){
                    if(optItems["_array"][i].optionValue > 0){
                        isAnswerQuest = true;
                        break;
                    }
                }
                if(isAnswerQuest){
                    break;
                }
                _createdIconView = new QuestionnaireNotificationIconView(message);
                _self.addAttentionHeaderColumnIcon(
                    'li[columntype=17].sortable-item .ico_system');
                switch(message.getRoomType()){
                    case Message.TYPE_GROUP_CHAT+"":
                        let _roomId = message.getRoomId();
                        _self.addAttentionHeaderColumnIcon(
                            'li[msgto="'+ _roomId +'"][columntype="'+ColumnInformation.TYPE_COLUMN_GROUP_CHAT
                            +'"].sortable-item .ico_group');
                        break;
                    case Message.TYPE_COMMUNITY+"":
                        let _msgto = message.getRoomId();
                        _self.addAttentionHeaderColumnIcon(
                            'li[msgto="'+_msgto+'"][columntype="'+ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED
                            +'"].sortable-item .ico_project');
                        break;
                    default:
                        break;
                }
                break;
            case Message.TYPE_MURMUR:
                _createdIconView = new MurmurNotificationIconView(message);
                _id = message.getFrom();
                _self.addAttentionHeaderColumnIcon(
                    'li[jid="'+ _id +'"][columntype="18"].sortable-item .ico');
                break;
            default:
                _createdIconView = new NotificationIconView(message);
                break;
        }
        if(_createdIconView == null){
            return;
        }
        _self._getIconViewList().add(_createdIconView);
        LayoutManager.resetScreenLayout();
        LayoutManager.iconAreaScrollToShow(-1);
        View.resizeHeaderContent();
    };

    _proto._updateNotificationIcon = function(message) {
        if(message == null || typeof message != 'object') {
            return;
        }
        var _self = this;
        var _notificationColumnType = _self._getNotificationColumnType(message);
        var _idx = _self.checkNotificationIconExistence(_notificationColumnType);
        if(_idx != -1) {
            var _iconViewList = _self._getIconViewList();
            var _iconView = _iconViewList.get(_idx);
            _iconView.updateNotificationArea(message);
            LayoutManager.resetScreenLayout();
            LayoutManager.iconAreaScrollToShow(_idx);
        }
    };
    _proto.removeNotificationIcon = function(notificationIconViewObj) {
        if(notificationIconViewObj == null || typeof notificationIconViewObj != 'object') {
            return;
        }
        var _self = this;
        _self.removeAttention();
        var _idx = _self.checkNotificationIconExistence(notificationIconViewObj.getType());
        if(_idx == -1) {
            return;
        }

        _self._getIconViewList().remove(_idx);
        if(_self._getIconViewList().getCount() == 0) {
            View.getInstance().invalidBlinkTitleBar();
        }
        View.resizeHeaderContent();
    };
    _proto.checkNotificationIconExistence = function(columnType) {
        if(columnType == null || typeof columnType != 'number') {
            return -1;
        }
        var _self = this;
        var _iconViewList = _self._getIconViewList();
        var _iconViewListCount = _iconViewList.getCount();
        for(var _i = 0; _i < _iconViewListCount; _i++) {
            var _curIconView = _iconViewList.get(_i);
            var _curIconColumnType = _curIconView.getType();
            if(_curIconColumnType == columnType) {
                return _i;
            }
        }
        return -1;
    };
    _proto._getNotificationColumnType = function(message) {
        var _notificationColumnType = null;
        var _msgType = message.getType();
        var _columnTypeList = ViewUtils.getColumnTypeListFromMessage(message);
        switch(_msgType){
            case Message.TYPE_PUBLIC:
                for (var _i = 0; _i < _columnTypeList.getCount(); _i++) {
                    var _columnType = _columnTypeList.get(_i);
                    if (_columnType == ColumnInformation.TYPE_COLUMN_MENTION) {
                        _notificationColumnType = _columnType;
                        break;
                    }
                }
                break;
            case Message.TYPE_CHAT:
            case Message.TYPE_TASK:
            case Message.TYPE_MAIL:
                for (var _i = 0; _i < _columnTypeList.getCount(); _i++) {
                    _notificationColumnType = _columnTypeList.get(_i);
                }
                break;
            case Message.TYPE_QUESTIONNAIRE:
                for (var _i = 0; _i < _columnTypeList.getCount(); _i++) {
                    _notificationColumnType = _columnTypeList.get(_i);
                }
                break;
            default:
                break;
        }
        return _notificationColumnType;
    };
    _proto.notifyGroupChat = function(groupChatNotification) {
        if(groupChatNotification == null || typeof groupChatNotification != 'object') {
            return;
        }
        var _self = this;
        if (groupChatNotification.getSubType() === GroupChatNotification.SUB_TYPE_MESSAGE) {
            var _message = groupChatNotification.getGroupChatMessage();
            _toMeNotificationIconProc(_self, _message);
            var _notificationSettingManager = NotificationSettingManager.getInstance();
            if (_notificationSettingManager.isSetting(ColumnInformation.TYPE_COLUMN_GROUP_CHAT, groupChatNotification.getGroupChatMessage().getTo())) {
                return;
            }
        }else{
            return;
        }

        var _idx = _self.checkNotificationIconExistence(ColumnInformation.TYPE_COLUMN_GROUP_CHAT);
        if(_idx == -1) {
            var _createdIconView = new GroupChatNotificationIconView(groupChatNotification);
            var _iconElm = _createdIconView.getHtmlElement();
            _self._getIconViewList().add(_createdIconView);

            View.resizeHeaderContent();
        } else {
           var _iconView = _self._getIconViewList().get(_idx);
           _iconView.onNotificationRecieved(groupChatNotification);
        }
        _self.addAttention();

        let _roomInfo = groupChatNotification.getRoomInfo();
        let _roomId = _roomInfo.getRoomId();
        _self.addAttentionHeaderColumnIcon(
            'li[msgto="'+ _roomId +'"][columntype="'+ColumnInformation.TYPE_COLUMN_GROUP_CHAT
            +'"].sortable-item .ico_group');
    };
    _proto.updateRoomInfo = function(groupChatNotification) {
        if(groupChatNotification == null || typeof groupChatNotification != 'object') {
            return;
        }
        var _self = this;
        var _idx = _self.checkNotificationIconExistence(ColumnInformation.TYPE_COLUMN_GROUP_CHAT);
        if(_idx != -1) {
           var _iconView = _self._getIconViewList().get(_idx);
           _iconView.onUpdateRoomInfoNotificationRecieved(groupChatNotification);
        }
        _self.addAttention();
    };


    _proto.reLoadProjectMenu = function(communityNotification) {
        var setCommunity;
        var checkRoomId;
        if(typeof communityNotification._updatedCommunityInfo != 'object'){
            if(typeof communityNotification.getCommunityMessage == "function"){
                checkRoomId = communityNotification.getCommunityMessage().getTo();
            }else{
                checkRoomId = communityNotification.getRoomId();
            }
            setCommunity = TabManager.getInstance().getCommunityInfo();
        }else{
            checkRoomId = communityNotification._updatedCommunityInfo.getRoomId();
            setCommunity = communityNotification._updatedCommunityInfo;
        }
        if(TabManager.getInstance().isActiveMyWorkplace()){
            SelectAndAddProjectView.getInstance().getProjectList(null);
        }else{
            if(checkRoomId == TabManager.getInstance().getCommunityInfo().getRoomId()){
                SelectAndAddProjectView.getInstance().getProjectList(setCommunity);
            }else{
                SelectAndAddProjectView.getInstance().getProjectList(TabManager.getInstance().getCommunityInfo());
            }
        }
    };
    _proto.onCommunityNotificationRecieved = function(communityNotification) {
        if(communityNotification == null || typeof communityNotification != 'object') {
            return;
        }
        var _self = this;
        if ( communityNotification.getSubType() === CommunityNotification.SUB_TYPE_MESSAGE) {
            _self.reLoadProjectMenu(communityNotification);
            var _message = communityNotification.getCommunityMessage();
            var _senderJid = _message.getFrom();
            _toMeNotificationIconProc(_self, _message);
            var _notificationSettingManager = NotificationSettingManager.getInstance();
            if (_notificationSettingManager.isSetting(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED, communityNotification.getCommunityMessage().getTo())) {
                return;
            }
            if(_senderJid == LoginUser.getInstance().getJid()){
                return;
            }
        }else{
            _self.reLoadProjectMenu(communityNotification);
            return;
        }
        function callback(communityInfo){
            if(!communityInfo || typeof communityInfo != 'object'){
                return;
            }
            var _idx = _self.checkNotificationIconExistence(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED);
            if(_idx == -1) {
                var _createdIconView = new CommunityNotificationIconView(communityNotification, communityInfo);
                _self._getIconViewList().add(_createdIconView);

                View.resizeHeaderContent();
            } else {
               var _iconView = _self._getIconViewList().get(_idx);
                   _iconView._communityInfo = communityInfo;
               _iconView.onNotificationRecieved(communityNotification);
            }
            _self.addAttention();

            let _communityId = communityNotification.getCommunityMessage().getTo();
            _self.addAttentionHeaderColumnIcon(
                'li[msgto="'+ _communityId
                +'"][columntype="'+ ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED
                +'"].sortable-item .ico_project');
        }
        CubeeController.getInstance().getCommunityInfo(communityNotification.getCommunityMessage().getTo(), callback);
    };
    _proto.onMurmurNotificationRecieved = function(murmurNotification) {
        if(murmurNotification == null || typeof murmurNotification != 'object' ||
           ! murmurNotification.getMurmurMessage() || !murmurNotification.getMurmurMessage().getFrom()) {
            return;
        }
        if(LoginUser.getInstance().getJid() == murmurNotification.getMurmurMessage().getFrom()){
            return;
        }
        var _self = this;
        _self.addAttention();

        let _jid = murmurNotification.getMurmurMessage().getTo();
        _self.addAttentionHeaderColumnIcon(
            'li[jid="'+ _jid
            +'"][columntype="'+ ColumnInformation.TYPE_COLUMN_MURMUR
            +'"].sortable-item .ico_user');
    };
    _proto.onColumnClicked = function(columnInformation) {
        var _self = this;
        if(columnInformation == null) {
            return;
        }
        var _iconViewList = _self._getIconViewList();
        var _iconViewListCount = _iconViewList.getCount();
        for(var _i = 0; _i < _iconViewListCount; _i++) {
            var _curIconView = _iconViewList.get(_i);
            if (_curIconView) {
                try {
                    _curIconView.onColumnClicked(columnInformation);
                }
                catch (e) {}
            }
        }
    }

    _proto.askCautionExistence = function(cautionType, itemList) {
        if(cautionType == null || typeof cautionType != 'number') {
            return;
        }
        var _self = this;
        var _inboxalert = true;
        var _taskalert = true;
        var _createdIconView = null;
        var _notificationSettingManager = NotificationSettingManager.getInstance();
        if (_notificationSettingManager.isSetting(ColumnInformation.TYPE_COLUMN_TASK, "")) {
            _taskalert = false;
        }
        if (_notificationSettingManager.isSetting(ColumnInformation.TYPE_COLUMN_INBOX, "")) {
            _inboxalert = false;
        }
        var _idx = _self.checkNotificationIconExistence(ColumnInformation.TYPE_COLUMN_TASK);
        if(_taskalert){
            if(_idx != -1) {
                _self._getIconViewList().get(_idx).setDemandData(itemList);
            }else if(itemList.getByKey(ColumnInformation.TYPE_COLUMN_TASK.toString()) > 0){
                _createdIconView = new TaskNotificationIconView(null);
                _createdIconView.setDemandData(itemList);
                _self._getIconViewList().add(_createdIconView);

                _self.addAttentionHeaderColumnIcon(
                    'li[columntype="'+ ColumnInformation.TYPE_COLUMN_TASK
                    +'"].sortable-item .ico_system');
            }
        }
        _idx = _self.checkNotificationIconExistence(ColumnInformation.TYPE_COLUMN_INBOX);
        if(_inboxalert){
            if(_idx != -1) {
                _self._getIconViewList().get(_idx).setDemandData(itemList);
            }else if(itemList.getByKey(Message.TYPE_SYSTEM.toString()) > 0){
                _createdIconView = new InboxNotificationIconView(null);
                _createdIconView.setDemandData(itemList);
                _self._getIconViewList().add(_createdIconView);

                _self.addAttentionHeaderColumnIcon(
                    'li[columntype="'+ColumnInformation.TYPE_COLUMN_INBOX
                    +'"].sortable-item .ico_system');
            }
        }
        if(_createdIconView != null){
            LayoutManager.resetScreenLayout();
            LayoutManager.iconAreaScrollToShow(-1);
            View.resizeHeaderContent();
        }
    };
    _proto._addCautionIcon = function(cautionIconViewObj) {
        if(cautionIconViewObj == null || typeof cautionIconViewObj != 'object') {
            return;
        }
        var _self = this;
        var _iconElm = cautionIconViewObj.getHtmlElement();
        _self._getCautionIconViewList().add(cautionIconViewObj);
        LayoutManager.resetScreenLayout();
        LayoutManager.iconAreaScrollToShow(-1);
    };
    _proto._updateCautionIcon = function(cautionType, itemList) {
        if(cautionType == null || typeof cautionType != 'number') {
            return;
        }
        var _self = this;
        var _idx = _self.checkCautionIconExistence(cautionType);
        if(_idx != -1) {
            var _iconViewList = _self._getCautionIconViewList();
            var _iconView = _iconViewList.get(_idx);
            _iconView.updateNotificationArea(itemList);
            LayoutManager.resetScreenLayout();
            LayoutManager.iconAreaScrollToShow(_idx);
        }
    };
    _proto.removeCautionIcon = function(cautionIconViewObj) {
        if(cautionIconViewObj == null || typeof cautionIconViewObj != 'object') {
            return;
        }
        var _self = this;
        var _idx = _self.checkCautionIconExistence(cautionIconViewObj.getType());
        if(_idx == -1) {
            return;
        }
        _self._getCautionIconViewList().remove(_idx);
        if(_self._getCautionIconViewList().getCount() == 0) {
            View.getInstance().invalidBlinkTitleBar();
        }
    };
    _proto.checkCautionIconExistence = function(cautionType) {
        if(cautionType == null || typeof cautionType != 'number') {
            return -1;
        }
        var _self = this;
        var _iconViewList = _self._getCautionIconViewList();
        var _iconViewListCount = _iconViewList.getCount();
        for(var _i = 0; _i < _iconViewListCount; _i++) {
            var _curIconView = _iconViewList.get(_i);
            var _curIconCautionType = _curIconView.getType();
            if(_curIconCautionType == cautionType) {
                return _i;
            }
        }
        return -1;
    };
    _proto.addAttention = function() {
        var _self = this;
        if(_self._iconAreaContener.find("li").size() != 0){
            if(_self._iconAreaContener.prevAll("a.popup_btn").hasClass('alert_btn') == false){
                _self._iconAreaContener.prevAll("a.ico_btn").addClass('alert_btn');
                _self._iconAreaContener.prevAll("a.ico_btn").addClass('popup_btn');
            }
        }
    }
    _proto.removeAttention = function() {
        var _self = this;
        if(_self._iconAreaContener.find("li").size() == 0){
            if(_self._iconAreaContener.prevAll("a.popup_btn").hasClass('alert_btn') == true){
	            _self._iconAreaContener.prevAll("a.ico_btn").removeClass('alert_btn');
	            _self._iconAreaContener.prevAll("a.ico_btn").removeClass('popup_btn');
            }
        }
    }


    _proto.removeColumnNotificationIconByMessage = function(message) {
        var _self = this;
        var _iconViewList = _self._getIconViewList();
        var _columnInfo = null;
        var _notificationColumnType = _self._getNotificationColumnType(message);
        if(_notificationColumnType != null) {
            var _idx = _self.checkNotificationIconExistence(_notificationColumnType);
            if(_idx != -1) {
                var _iconView = _iconViewList.get(_idx);

                switch(_iconView.getType()) {
                    case ColumnInformation.TYPE_COLUMN_MENTION:
                        _columnInfo = new FilterColumnInfomation();
                        _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_MENTION);
                        _columnInfo.setFilterCondition('');
                        var _filter = ColumnFilterManager.getColumnFilter(_columnInfo.getColumnType(), null);
                        var _searchCondition = new ColumnSearchCondition(_filter, new ColumnSortCondition());
                        _columnInfo.setSearchCondition(_searchCondition, false);
                        break;
                    case ColumnInformation.TYPE_COLUMN_CHAT:
                        _columnInfo = new ColumnInformation();
                        _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_CHAT);
                        var _jid = message.getFrom();
                        if(_jid == LoginUser.getInstance().getJid()) {
                            _jid = message.getTo();
                        }
                        _columnInfo.setFilterCondition(_jid);
                        break;
                    case ColumnInformation.TYPE_COLUMN_TASK:
                        _columnInfo = new ColumnInformation();
                        _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_TASK);
                        var _jid = LoginUser.getInstance().getJid();
                        var _condition = ViewUtils.getTaskFilterAndSortCondition(_jid);
                        _columnInfo.setFilterCondition(_condition.getFilterConditionJSONString());
                        break;
                    case ColumnInformation.TYPE_COLUMN_INBOX:
                        _columnInfo = ViewUtils.createIndexColumnInfo();
                        break;
                    case ColumnInformation.TYPE_COLUMN_MAIL:
                        _columnInfo = ViewUtils.getMailColumnInfomation();
                        break;
                    default:
                        break;
                }
            }
        } else {
            var _messageType = message.getType();
            switch(_messageType) {
                case Message.TYPE_GROUP_CHAT:
                    CubeeController.getInstance().getRoomInfo(message.getTo(), _onGetGroupChatRoomInfo);
                    break;
                case Message.TYPE_COMMUNITY:
                    var _communityInfo = new CommunityInfo();
                    _communityInfo.setRoomId(message.getTo());
                    _columnInfo = ViewUtils.getCommunityFeedColumnInfo(_communityInfo);
                    break;
                default:
                    break;
            }
        }
        if(_columnInfo != null) {
            _removeColumnNotificationIconByColmunInfo(_columnInfo)
        }
        _removeToMeNotification();
        return;

        function _removeToMeNotification(){
            var _isToMe = ViewUtils.isToMeMessage(message);
            if(!_isToMe){
                return;
            }
            var _idx = _self.checkNotificationIconExistence(ColumnInformation.TYPE_COLUMN_TOME);
            if(_idx != -1) {
                _columnInfo = new ToMeColumnInfomation();
                _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_TOME);
                _columnInfo.setFilterCondition('');
                var _filter = ColumnFilterManager.getColumnFilter(_columnInfo.getColumnType(), null);
                var _searchCondition = new ColumnSearchCondition(_filter, new ColumnSortCondition());
                _columnInfo.setSearchCondition(_searchCondition, false);
                _removeColumnNotificationIconByColmunInfo(_columnInfo);
            }
        }

        function _onGetGroupChatRoomInfo(roomInfo) {
            if(roomInfo == null){
                return;
            }
            _columnInfo = ViewUtils.getGroupChatColumnInfo(roomInfo);
            if(_columnInfo != null) {
                _removeColumnNotificationIconByColmunInfo(_columnInfo)
            }
        }

        function _removeColumnNotificationIconByColmunInfo(columnInfo) {
            _self.onColumnClicked(columnInfo);
        }
    };

    _proto.addAttentionHeaderColumnIcon = function(liselector, isAttentionIconUpdate=false){
        let _self = this;
        if(typeof isAttentionIconUpdate == 'boolean' &&
           isAttentionIconUpdate){
            isAttentionIconUpdate = true;
        }
        let headerColumnCommIcon = this._attentionHeaderColumnIconPanelConntener.find(liselector);
        if(headerColumnCommIcon != undefined &&
           headerColumnCommIcon != null &&
           headerColumnCommIcon.size() != 0){
            if(isAttentionIconUpdate &&
               this._attentionHeaderColumnIconSelectors[encodeURIComponent(liselector)] != undefined &&
               typeof this._attentionHeaderColumnIconSelectors[encodeURIComponent(liselector)] == 'boolean' &&
               this._attentionHeaderColumnIconSelectors[encodeURIComponent(liselector)]){
                headerColumnCommIcon.addClass('message-notice-mainheader');
            }else{
                headerColumnCommIcon.addClass('message-notice-mainheader');
            }
            if('li[columntype="'+ColumnInformation.TYPE_COLUMN_INBOX
               +'"].sortable-item .ico_system' != liselector &&
               'li[columntype="'+ ColumnInformation.TYPE_COLUMN_TASK
               +'"].sortable-item .ico_system' != liselector){
                headerColumnCommIcon.on('click',function(){
                    _self.removeAttentionHeaderColumnIcon(liselector);
                });
            }
        }
        if(!isAttentionIconUpdate){
            this._attentionHeaderColumnIconSelectors[encodeURIComponent(liselector)] = true;
        }
    }

    _proto.removeAttentionHeaderColumnIcon = function(liselector){
        this._attentionHeaderColumnIconPanelConntener.ready(() =>{
            let headerColumnCommIcon = this._attentionHeaderColumnIconPanelConntener.find(liselector);
            headerColumnCommIcon.ready(() =>{
                if(headerColumnCommIcon != undefined &&
                   headerColumnCommIcon != null &&
                   headerColumnCommIcon.size() != 0){
                    headerColumnCommIcon.removeClass('message-notice-mainheader');
                }
            });
        });
        if(this._attentionHeaderColumnIconSelectors[encodeURIComponent(liselector)] != undefined &&
           typeof this._attentionHeaderColumnIconSelectors[encodeURIComponent(liselector)] == 'boolean' &&
           this._attentionHeaderColumnIconSelectors[encodeURIComponent(liselector)] == true){
            delete this._attentionHeaderColumnIconSelectors[encodeURIComponent(liselector)];
        }
    }

    _proto.updateAttentionHeaderColumnIconView = function(){
        this._attentionHeaderColumnIconPanelConntener.ready(() =>{
            for(let selectorURLEnc in this._attentionHeaderColumnIconSelectors){
                let selector = decodeURIComponent(selectorURLEnc);
                let headerColumnCommIcon = this._attentionHeaderColumnIconPanelConntener.find(selector);
                if(headerColumnCommIcon.size() > 0){
                    headerColumnCommIcon.ready(() =>{
                        this.addAttentionHeaderColumnIcon(selector, true);
                    });
                }
            }
        });
    }
})();
