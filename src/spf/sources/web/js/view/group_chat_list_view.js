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

function GroupChatListView() {
    SideMenuAccordionParts.call(this);
    this.viewPartsListHeader = GroupChatListView._VIEW_PARTS_LIST_HEADER;
};(function() {
    GroupChatListView._VIEW_PARTS_LIST_HEADER = 'groupchat-list-header';

    GroupChatListView.prototype = $.extend({}, SideMenuAccordionParts.prototype);
    var _super = SideMenuAccordionParts.prototype;

    var _proto = GroupChatListView.prototype;

    _proto.init = function(opts) {
        var _self = this;
        _super.init.call(_self);
        _self._mode = opts.mode;
        _self._addEvent = true;
        if ('addEvent' in opts && opts.addEvent == false) {
            _self._addEvent = false;
        }
        _self._currentLoadedItemId = 0;
        _self._allGroupChatListReceived = false;
        _self._headerDisplayName = Resource.getMessage('GroupChatList');
        _self.createFrame();
        return _self;
    };

    _proto.createFrame = function() {
        var _self = this;
        var _groupChatListViewFrame = '<div class="sidebar_list list-groupchat box-border flex1 olient-vertical vertical-scroll"></div>';
        var _dom = $(_groupChatListViewFrame);
        _self._frame = _dom;
        return _dom;
    };

    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp.call(_self);
        _self._currentLoadedItemId = null;
        _self._allGroupChatListReceived = null;
        _self._headerDisplayName = null;
    };
    _proto.showInnerFrame = function(callback) {
        var _self = this;
        setTimeout(function(){
            callback();
        }, 10);
        return _self.showGroupChatList();
    };
    _proto.showInnerFrameFromProject = function(callback, _projectInfo) {
        var _self = this;
        setTimeout(function(){
            callback();
        }, 10);
        return _self.showGroupChatListFromProject(_projectInfo);
    };
    _proto.showGroupChatList = function() {
        var _self = this;
        var _groupchatListArea = _self.getHtmlElement();
        _groupchatListArea.children().remove();

        _self.getHistoryRoomInfo();

        return true;
    };

    _proto.showGroupChatListFromProject = function(_projectInfo) {
        var _self = this;
        _self.getHistoryRoomInfoFromProject(_projectInfo);
        return true;
    };

    _proto._addGroupChat = function(parent, roomInfo, isCreated) {
        if(parent == null || typeof parent != 'object') {
            return false;
        }
        if(roomInfo == null || typeof roomInfo != 'object') {
            return false;
        }
        var _self = this;
        var _id = roomInfo.getId();
        var _date = roomInfo.getUpdatedAt() ? roomInfo.getUpdatedAt().getTime() : +new Date();

        if (_self._currentLoadedItemId == 0 || _self._currentLoadedItemDate > _date) {
            _self._currentLoadedItemId = _id;
            _self._currentLoadedItemDate = _date;
        }

        var roomName = Utils.convertEscapedHtml(roomInfo.getRoomName())
        var avatarInfo = Utils.avatarCreate({type: 'group', name: roomInfo.getRoomName()})
        const privacyTypeID = roomInfo.getPrivacyType()
        let privacyTypeIcon = ''
        if(this._mode != 'sidebar' && privacyTypeID != null && privacyTypeID == 0){
            privacyTypeIcon = ' <span class="public-room-chip">公開</span>'
        }
        var _insertHtml = '';
        _insertHtml = '<li style="display:block">'
        _insertHtml += '<a roomid="' + roomInfo.getRoomId() + '" title="' + roomName +'">';
        _insertHtml += '  <span class="ico ico_group">'
        _insertHtml += '    <div class="no_img" style="background-color:' + avatarInfo.color + '">';
        _insertHtml += '      <div class="no_img_inner">' + avatarInfo.name + '</div>';
        _insertHtml += '    </div></span>';
        _insertHtml += '  <span class="name room-list-name">' + roomName + '</span>' + privacyTypeIcon + '';
        _insertHtml += '</a></li>';

        var _insertElmIndex = 0
        if (isCreated) {
            parent.prepend(_insertHtml);
        } else {
            parent.append(_insertHtml);
            _insertElmIndex = parent.children('*').length - 1;
        }
        var _insertElem = parent.children('*').eq(_insertElmIndex);

        if (_self._addEvent) {
            _addEventClick(_insertElem);
        }

        _setTooltip(_insertElem,roomInfo.getRoomName());

        return true;
    };
    var _onNotificationFunc = {};
    _onNotificationFunc[Notification_model.TYPE_GROUP_CHAT] = _onGroupChatNotify;
    _onNotificationFunc[Notification_model.TYPE_QUESTIONNAIRE] = _onGroupChatNotify;

    _proto.onNotification = function(notification) {
        var _self = this;
        var _type = notification.getType();
        var _onNotifyFunction = Utils.getSafeValue(_onNotificationFunc, _type, function(){});
        _onNotifyFunction(_self, notification);
    };

    var _onNotificationGroupChat = {};
    _onNotificationGroupChat[GroupChatNotification.SUB_TYPE_MESSAGE] = _onNewMessageNotify;
    _onNotificationGroupChat[GroupChatNotification.SUB_TYPE_CREATE_ROOM] = _onCreateRoomNotify;
    _onNotificationGroupChat[GroupChatNotification.SUB_TYPE_UPDATE_ROOM_INFO] = _onUpdateRoomNotify;
    _onNotificationGroupChat[GroupChatNotification.SUB_TYPE_REMOVE_MEMBER] = _onRemoveMemberNotify;

    function _onGroupChatNotify(groupChatListView, notification){
        if (notification.getType() == Notification_model.TYPE_GROUP_CHAT) {
            var _subType = notification.getSubType();
            var _chatroomInfo = notification.getRoomInfo();
            if(TabManager.getInstance().isActiveMyWorkplace() || ($('.project_btn').attr('data_value') == _chatroomInfo.getParentRoomId())){
                var _notifyFunc = Utils.getSafeValue(_onNotificationGroupChat, _subType, function(){});
                _notifyFunc(groupChatListView,_chatroomInfo, notification);
            }
        } else if (notification.getType() == Notification_model.TYPE_QUESTIONNAIRE) {
            if(TabManager.getInstance().isActiveMyWorkplace() ||
              ($('.project_btn').attr('data_value') == notification.getQuestionnaireMessage().getParentRoomId())){
                var chatRoomInfo = new ChatRoomInformation();
                chatRoomInfo.setRoomId(notification.getQuestionnaireMessage().getRoomId());
                chatRoomInfo.setRoomName(notification.getQuestionnaireMessage().getRoomName());
                groupChatListView.newMessageNotifyForQuestionnaire(chatRoomInfo, notification);
            }
        }
    }

    function _onNewMessageNotify(groupChatListView, roomInfo, notification){
        groupChatListView.newMessageNotify(roomInfo, notification);
    }

    function _onCreateRoomNotify(groupChatListView,roomInfo, notification){
        groupChatListView.addCreatedGroupChat(roomInfo);
    }

    function _onUpdateRoomNotify(groupChatListView,roomInfo, notification){
        groupChatListView.onChangeRoomName(roomInfo)
        if(roomInfo != null && roomInfo._roomId &&
           typeof roomInfo._roomId == 'string') {
            groupChatListView.onUpdateOptionMenu(roomInfo._roomId)
        }
    }

    function _onRemoveMemberNotify(groupChatListView,roomInfo, notification){
        groupChatListView.removeGroupChat(notification);
    }

    _proto.newMessageNotify = function(roomInfo, notification) {
        if(!roomInfo || !notification) {
            return;
        }
        var root = this.getHtmlElement();
        var selector = 'a[roomid=\'' + roomInfo.getRoomId() + '\']';
        if(root.find(selector).length == 0) {
            this._addGroupChat(root, roomInfo, true);
        }
        var target = root.find(selector);

        if(notification.getGroupChatMessage().getFrom() != LoginUser.getInstance().getJid()) {
            if(target.find('.new_message_notice').length == 0) {
                ViewUtils.setNewNoticeMark(target);
           }
        }

        target.parent().prependTo(root.find(selector).parent().parent());
        this.adjustListedNum();
    }
    _proto.newMessageNotifyForQuestionnaire = function(roomInfo, notification) {
        if(!roomInfo || !notification) {
            return;
        }
        var root = this.getHtmlElement();
        var selector = 'a[roomid=\'' + roomInfo.getRoomId() + '\']';
        if(root.find(selector).length == 0) {
            this._addGroupChat(root, roomInfo, true);
        }
        var target = root.find(selector);
        let optItems = notification.getQuestionnaireMessage().getOptionItems();
        let isAnswerQuest = false;
        for(let i in optItems["_array"]){
            if(optItems["_array"][i].optionValue > 0){
                isAnswerQuest = true;
                break;
            }
        }
        if(! isAnswerQuest &&
           notification.getQuestionnaireMessage().getFrom() != LoginUser.getInstance().getJid()) {
            if(target.find('.new_message_notice').length == 0) {
                ViewUtils.setNewNoticeMark(target);
           }
        }

        target.parent().prependTo(root.find(selector).parent().parent());
        this.adjustListedNum();
    }
    _proto.addCreatedGroupChat = function(roomInfo) {
        if(roomInfo == null || typeof roomInfo != 'object') {
            return false;
        }
        var _self = this;
        var _groupchatListElem = _self.getHtmlElement();
        var _alreadyElem = _groupchatListElem.find('a[roomid=\'' + roomInfo.getRoomId() + '\']');
        if(_alreadyElem.length != 0) {
            return true;
        }

        _self._addGroupChat(_groupchatListElem, roomInfo, true);
        _self.adjustListedNum();

    };

    _proto.removeGroupChat = function(notification){
        var _self = this;
        if(notification === null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != GroupChatNotification.SUB_TYPE_REMOVE_MEMBER){
            return;
        }
        var _targets = notification.getRemovedMemberList();
        var _count = _targets.getCount();
        var _processedCount = 0;
        _asyncRemoveMember();

        const remove_jids = notification.getRemovedMemberList();
        const myJid = LoginUser.getInstance().getJid();
        if(remove_jids && remove_jids._array.indexOf(myJid) >= 0){
            const _rem_roomId = notification.getRoomInfo().getRoomId();
            const _columnObjList = ColumnManager.getInstance().getColumnObjList()
            for(let i=0;i<_columnObjList._array.length;i++){
                if(_columnObjList._array[i] &&
                   _columnObjList._array[i]._idName &&
                   _rem_roomId == _columnObjList._array[i]._idName){
                    ColumnManager.getInstance().removeColumn(_columnObjList._array[i], true);
                    $(window).resize()
                }
            }
            $('#groupChatList li:has(a[roomid="'+_rem_roomId+'"])').remove();
        }
        function _asyncRemoveMember(){
            if(_count <= _processedCount) {
                return;
            } else {
                var _loginUser = LoginUser.getInstance();
                var _loginUserJid = _loginUser.getJid();
                var _jid = _targets.get(_processedCount);
                if(_loginUserJid == _jid){
                    var _roomId = notification.getRoomInfo().getRoomId();
                    var _groupChatListElem = _self.getHtmlElement();
                    var _targetElem = _groupChatListElem.find('div[roomid=\'' + _roomId + '\']');
                    _targetElem.remove();
                    return;
                }
                _processedCount++;
                setTimeout(function() {_asyncRemoveMember();}, 1);
            }
        }
    };

    _proto.onChangeRoomName = function(roomInfo) {
        if(roomInfo == null || typeof roomInfo != 'object') {
            return false;
        }
        var _self = this;
        var _groupchatListElem = _self.getHtmlElement();
        var _targetElem = _groupchatListElem.find('a.[roomid=\'' + roomInfo.getRoomId() + '\']');
        if(_targetElem.length != 0) {
            var avatarInfo = Utils.avatarCreate({type: 'group', name: roomInfo.getRoomName()});
            _targetElem.find('div.no_img').css('background-color', avatarInfo.color);
            _targetElem.find('div.no_img_inner').text(avatarInfo.name);
            _targetElem.find('span.name').text(roomInfo.getRoomName());
            _setTooltip(_targetElem,roomInfo.getRoomName());
            return true;
        }
        return false;
    }
    _proto.onUpdateOptionMenu = (roomId) =>{
        if(roomId == null || typeof roomId != 'string') {
            return false;
        }
        var _selectorConfigButton = 'div.popup_menu.col_menu';
        const _columnObjList = ColumnManager.getInstance().getColumnObjList()
        for(let i=0;i<_columnObjList._array.length;i++){
            if(_columnObjList._array[i] &&
               _columnObjList._array[i]._idName &&
               roomId == _columnObjList._array[i]._idName){
                const _optionMenu = _columnObjList._array[i].getHtmlElement().find(_selectorConfigButton);
                _optionMenu.find("ul.popup_list").remove()
                _columnObjList._array[i]._setOptionMenu(_optionMenu)
                return true;
            }
        }
        return false;
    }
    function _addEventClick(groupChatElem) {
        groupChatElem.click(function() {
            var _roomid = groupChatElem.children('a').attr('roomid');
            var _roomInfo = CubeeController.getInstance().getChatRoomInfoByRoomId(_roomid);
            var _columnInfo = ViewUtils.getGroupChatColumnInfo(_roomInfo);
            ColumnManager.getInstance().addColumn(_columnInfo, true, true);
            ViewUtils.unsetNewNoticeMark(groupChatElem);
            NotificationIconManager.getInstance().onColumnClicked(_columnInfo);
            NotificationIconManager.getInstance()
                                   .removeAttentionHeaderColumnIcon(
                                       'li[msgto="'
                                       + _roomid
                                       +'"][columntype="'
                                       +ColumnInformation.TYPE_COLUMN_GROUP_CHAT
                                       +'"].sortable-item .ico_group');
        });
    };
    function _setTooltip(groupChatElem,roomName) {
        TooltipView.getInstance().setGroupChatNameToolTip(groupChatElem, roomName, false);
        groupChatElem.attr('title', roomName);
    };

    _proto._showReadMore = function() {
        var _self = this;
        var _tailOfElm;
        var _ret = false;
        var _maxNumMsg = 0;
        var _elm = _self.getHtmlElement();
        if (!_elm || typeof _elm != 'object') {
            return _ret;
        }
        if (_self._allGroupChatListReceived == true) {
            return false;
        }
        _tailOfElm = _elm.children('li:last');
        var loadingElem = _elm.children('div.loading-readmore');
        if (loadingElem.length > 0) {
            return false;
        }
        ViewUtils.showLoadingIcon(_tailOfElm);
        _maxNumMsg = _elm.children('li').size();
        if (_maxNumMsg == 0) {
            ViewUtils.hideLoadingIcon(_tailOfElm);
            return false;
        }
        _self.getHistoryRoomInfo();
        _ret = true;
        return _ret;
    };
    _proto.getHistoryRoomInfo = function() {
        var _self = this;
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);
        var parentList = new ArrayList();
        parentList.add(new CommunityInfo());
        var _num = _self.getNumberOfGetCount();
        function onGetGroupInfoListHistoryCallback(groupchatList) {
            if (groupchatList.getCount() < _num) {
                _self._allGroupChatListReceived = true;
            }
            _self._onGetGroupInfoListHistory(groupchatList);
        }
        CubeeController.getInstance().getRoomInfoList(_self._currentLoadedItemId, _num, parentList, _sortCondition, onGetGroupInfoListHistoryCallback);
    };
    _proto.getHistoryRoomInfoFromProject = function(_projectInfo) {
        var _self = this;
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);
        var parentList = new ArrayList();
        parentList.add(_projectInfo);
        var _num = _self.getNumberOfGetCount();
        function onGetGroupInfoListHistoryCallback(groupchatList) {
            if (groupchatList.getCount() < _num) {
                _self._allGroupChatListReceived = true;
            }
            _self._onGetGroupInfoListHistory(groupchatList);
        }
        CubeeController.getInstance().getRoomInfoList(_self._currentLoadedItemId, _num, parentList, _sortCondition, onGetGroupInfoListHistoryCallback);
    };
    _proto.getNumberOfGetCount = function() {
        switch (this._mode) {
            case 'sidebar':
                return 5;
            case 'dialog':
                return 10;
            case 'all':
                return 1000;
            default:
                return 20
        }
    }

    _proto.adjustListedNum = function() {
        var root = this.getHtmlElement();
        var items = root.children('li');
        var diff = items.length - this.getNumberOfGetCount()
        if(diff > 0) {
            for(var i=0; i<diff; i++) {
                root.find('li:last').remove();
            }
        }
    }

    _proto._onGetGroupInfoListHistory = function(groupchatList) {
        var _self = this;
        _self._hideLoadingIconInSelf();
        var _groupchatListElem = _self.getHtmlElement();
        if(_groupchatListElem == null){
            return;
        }
        for (var _i = 0; _i < groupchatList.getCount(); _i++) {
            var _roomInfo = groupchatList.get(_i);
            var _alreadyElem = _groupchatListElem.find('div[roomid=\'' + _roomInfo.getRoomId() + '\']');
            if(_alreadyElem.length != 0) {
                continue;
            }
            _self._addGroupChat(_groupchatListElem, _roomInfo, false);
        }
    };
    _proto._hideLoadingIconInSelf = function() {
        var _self = this;
        var _targetElem = _self.getHtmlElement();
        ViewUtils.hideLoadingIconInChild(_targetElem);
    };

    _proto.resizeContent = function() {
        var _self = this;
        var _groupChatListArea = _self.getHtmlElement();
        if (_groupChatListArea.parent().css('display') == 'none') {
            return;
        }
        setTimeout(function(){
            _nextRead();
        }, 1);

        function _nextRead() {
            if (_groupChatListArea.prop('clientHeight') == _groupChatListArea
                    .prop('scrollHeight')) {
                if (!_self._allGroupChatListReceived) {
                    _self._showReadMore();
                }
            }
        };
    };

})();
