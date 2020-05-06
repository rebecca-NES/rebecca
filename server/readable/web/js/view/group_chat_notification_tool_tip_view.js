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
function GroupChatNotificationToolTipView(parent, groupChatNotification) {
    this._parent = parent;
    this._itemViewList = new ArrayList();
    this._htmlElement = null;
    this._init(groupChatNotification);
};(function() {
    var _proto = GroupChatNotificationToolTipView.prototype;
    _proto._init = function(groupChatNotification) {
        if(groupChatNotification == null || typeof groupChatNotification != 'object') {
            return;
        }
        var _self = this;
        var _parentHtmlElemnt = _self._parent.getHtmlElement();
        var _htmlString = _self._getHtml();
        _self._htmlElement = _parentHtmlElemnt.append(_htmlString);
        var _toolTipItemView = _self._createToolTipItemView(groupChatNotification);
        if(_toolTipItemView == null) {
            return;
        }
        _self._itemViewList.insert(0,_toolTipItemView);
    };
    _proto.destruct = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        if(_selfElm) {
            _selfElm.unbind().remove();
        }
    };
    _proto._getHtml = function() {
        var _ret = '';
        _ret += '<div class="notification_list"></div>';
        return _ret;
    };
    _proto.getHtmlElement = function() {
        return this._htmlElement;
    };
    _proto.getCount = function() {
        return this._itemViewList.getCount();
    };
    _proto.onNotificationRecieved = function(groupChatNotification) {
        var _self = this;
        var _roomInfo = groupChatNotification.getRoomInfo();
        var _roomId = _roomInfo.getRoomId();
        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByRoomId(_roomId);
        var _isUpdateFlg = _self._checkUpdateExistToolTipItem(groupChatNotification);
        if(!_isUpdateFlg){
            _self._addToolTipItemView(groupChatNotification);
            return;
        }
        var _count = _toolTipItemViewIdxList.getCount();
        var _recievedSubType = groupChatNotification.getSubType();
        for(var _i = 0; _i < _count; _i++){
            var _idx = _toolTipItemViewIdxList.get(_i);
            var _curToolTipItemView = _self._itemViewList.get(_idx);
            var _curToolTipItemViewType = _curToolTipItemView.getType();
            if(_recievedSubType == _curToolTipItemViewType){
                _self._updateToolTipItemView(_idx);
                break;
            }
        }
    };
    _proto._checkUpdateExistToolTipItem = function(groupChatNotification){
        var _self = this;
        var _isUpdateFlg = false;
        var _roomInfo = groupChatNotification.getRoomInfo();
        var _roomId = _roomInfo.getRoomId();
        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByRoomId(_roomId);
        var _count = _toolTipItemViewIdxList.getCount();
        if(_count == 0){
            return _isUpdateFlg;
        }
        var _recievedSubType = groupChatNotification.getSubType();
        for(var _i = 0; _i < _count; _i++){
            var _idx = _toolTipItemViewIdxList.get(_i);
            var _curToolTipItemView = _self._itemViewList.get(_idx);
            var _curToolTipItemViewType = _curToolTipItemView.getType();
            if(_recievedSubType == _curToolTipItemViewType){
                _isUpdateFlg = true;
                break;
            }
        }

        return _isUpdateFlg;
    };
    _proto._addToolTipItemView = function(groupChatNotification) {
        var _self = this;
        var _toolTipItemView = _self._createToolTipItemView(groupChatNotification);
        _self._itemViewList.insert(0,_toolTipItemView);
        _self._parent.onToolTipUpdated();
    };
    _proto._updateToolTipItemView = function(toolTipItemViewIdx) {
        var _self = this;
        var _curToolTipItemView = _self._itemViewList.get(toolTipItemViewIdx);
        if(_curToolTipItemView == null){
            return;
        }
        _curToolTipItemView.onNotificationRecieved();
    };
    _proto._getToolTipItemViewIdxsByRoomId = function(roomId) {
        var _self = this;
        var _idxList = new ArrayList();
        var _toolTipItemViewList = _self._itemViewList;
        var _count = _toolTipItemViewList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _toolTipItemView = _self._itemViewList.get(_i);
            var _curRoomId = _toolTipItemView.getRoomId();
            if(_curRoomId == roomId){
                _idxList.add(_i);
            }
        }
        return _idxList;
    };
    _proto._createToolTipItemView = function(groupChatNotification) {
        var _self = this;
        var _subType = groupChatNotification.getSubType();
        var _roomInfo = groupChatNotification.getRoomInfo();
        var _columnInfomation = ViewUtils.getGroupChatColumnInfo(_roomInfo);
        var _toolTipItemView = null;
        switch(_subType) {
            case GroupChatNotification.SUB_TYPE_MESSAGE:
                _toolTipItemView = new GroupChatMessageNotificationToolTipItemView(_self,_columnInfomation);
                break;
            case GroupChatNotification.SUB_TYPE_CREATE_ROOM:
                _toolTipItemView = new GroupChatCreateRoomNotificationToolTipItemView(_self,_columnInfomation);
                break;
            case GroupChatNotification.SUB_TYPE_ADD_MEMBER:
                _toolTipItemView = new GroupChatAddMemberNotificationToolTipItemView(_self,_columnInfomation);
                break;
            case GroupChatNotification.SUB_TYPE_REMOVE_MEMBER:
                var _isContainLoginUser = false;
                var _removedMemberList = groupChatNotification.getRemovedMemberList();
                var _loginUserJid = LoginUser.getInstance().getJid();
                var _count = _removedMemberList.getCount();
                // Variable _j is used like a local variable, but is missing a declaration.
                var _j;
                for(_j = 0; _j < _count; _j++) {
                    if(_loginUserJid == _removedMemberList.get(_j)) {
                        _isContainLoginUser = true;
                        var roomId = groupChatNotification.getRoomInfo().getRoomId()
                        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByRoomId(roomId);
                        var _count = _toolTipItemViewIdxList.getCount();
                        for(var _i = 0; _i < _count; _i++){
                            var _idx = _toolTipItemViewIdxList.get(_i);
                            var _toolTipItemView = _self._itemViewList.get(_idx);
                            _toolTipItemView.removeHtmlElement();
                        }
                        var _itemViewListCount = _self._itemViewList.getCount();
                        for(var _k = _itemViewListCount; _k > 0; _k--){
                            var _idx = _k - 1;
                            var _curToolTipItemView = _self._itemViewList.get(_idx);
                            var _curRoomId = _curToolTipItemView.getRoomId();
                            if(roomId == _curRoomId){
                                _self._itemViewList.remove(_idx);
                            }
                        }
                        break;
                    }
                }
                _toolTipItemView = new GroupChatRemoveMemberNotificationToolTipItemView(_self,_columnInfomation, _isContainLoginUser);
                break;
            case GroupChatNotification.SUB_TYPE_UPDATE_ROOM_INFO:
                var _items = groupChatNotification.getUpdatedItems();
                for (var _i = 0; _i < _items.length; _i++) {
                    switch(_items[_i]) {
                        case GroupChatInfoUpdateNotification.SUB_TYPE_CHANGE_ROOM_NAME:
                            _toolTipItemView = new GroupChatUpdateRoomNameNotificationToolTipItemView(_self,_columnInfomation, groupChatNotification.getPreviousRoomName());
                            break;
                        default:
                            break;
                    }
                }
                break;
            case GroupChatNotification.SUB_TYPE_AUTHORITY_CHANGED:
                _toolTipItemView = new GroupChatAuthorityChanagedNotificationToolTipItemView(_self, _columnInfomation);
            default:
                break;
        }
        return _toolTipItemView;
    };
    _proto.onListItemClicked = function(roomId){
        var _self = this;
        _self._removeTooltipItem(roomId);
    };
    _proto._removeTooltipItem = function(roomId){
        var _self = this;
        var _parent = _self._parent;
        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByRoomId(roomId);
        var _count = _toolTipItemViewIdxList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _idx = _toolTipItemViewIdxList.get(_i);
            var _toolTipItemView = _self._itemViewList.get(_idx);
            _toolTipItemView.removeHtmlElement();
        }
        var _itemViewListCount = _self._itemViewList.getCount();
        for(var _j = _itemViewListCount; _j > 0; _j--){
            var _idx = _j - 1;
            var _curToolTipItemView = _self._itemViewList.get(_idx);
            var _curRoomId = _curToolTipItemView.getRoomId();
            if(roomId == _curRoomId){
                _self._itemViewList.remove(_idx);
            }
        }
        if($("#groupChatList").find('a[roomid="' + roomId + '"]').children(".new_message_notice").size() != 0){
            ViewUtils.unsetNewNoticeMark($("#groupChatList").find('a[roomid="' + roomId + '"]').parent("li"));
        }
        _parent.onToolTipUpdated();
    };
    _proto.onUpdateRoomInfoNotificationRecieved = function(groupChatNotification) {
        var _self = this;
        var _roomInfo = groupChatNotification.getRoomInfo();
        var _roomId = _roomInfo.getRoomId();
        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByRoomId(_roomId);
        var _count = _toolTipItemViewIdxList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _idx = _toolTipItemViewIdxList.get(_i);
            var _toolTipItemView = _self._itemViewList.get(_idx);
            var _columnInfo = _toolTipItemView.getColumnInfo();
            _columnInfo.setChatRoomInfomation(_roomInfo);
            _toolTipItemView.onUpdateRoomInfoNotificationRecieved();
        }
    };
    _proto.onAddColumn = function(columnInfo) {
        var _self = this;
        var _roomInfo = columnInfo.getChatRoomInfomation();
        var _roomId = _roomInfo.getRoomId();
        _self._removeTooltipItem(_roomId);
    };
    _proto.onColumnClicked = function(columnInformation) {
        var _self = this;
        var _clickedColumnType = columnInformation.getColumnType();
        if(ColumnInformation.TYPE_COLUMN_GROUP_CHAT != _clickedColumnType) {
            return;
        }
        var _roomInfo = columnInformation.getChatRoomInfomation();
        if(_roomInfo == null) {
            return;
        }
        var _roomId = _roomInfo.getRoomId();
        _self.onListItemClicked(_roomId);
    };

})();
function GroupChatNotificationToolTipItemView(parent,groupChatColumnInfomation, type) {
    this._parent = parent;
    this._columnInfo = groupChatColumnInfomation;
    this._htmlElement = null;
    this._count = 0;
    this._type = type ? type : 0; 
    this._init();
};(function() {
    GroupChatNotificationToolTipItemView.TYPE_UNKOWN = 0;
    GroupChatNotificationToolTipItemView.TYPE_MESSAGE = 1;
    GroupChatNotificationToolTipItemView.TYPE_CREATE_ROOM = 2;
    GroupChatNotificationToolTipItemView.TYPE_ADD_MEMBER = 3;
    GroupChatNotificationToolTipItemView.TYPE_UPDATE_ROOM_NAME = 4;
    GroupChatNotificationToolTipItemView.TYPE_REMOVE_MEMBER_NOT_INCLUDE_OWN = 5;
    GroupChatNotificationToolTipItemView.TYPE_REMOVE_MEMBER_INCLUDE_OWN = 6;
    GroupChatNotificationToolTipItemView.TYPE_AUTHORITY_CHANGED = 7;

    GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_NAME = 'span';
    GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_START = '<' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_NAME + '>';
    GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END = '</' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_NAME + '>';
    GroupChatNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME = Resource.getMessage('notification_items');
    GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_COUNT = 'count';
    GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_ROOM_NAME = 'room_name';
    GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START = '<' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_NAME + ' class="' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_COUNT + '">';
    GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ROOM_NAME_ELEMENT_START = '<' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_NAME + ' class="' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_ROOM_NAME + '">';

    var _proto = GroupChatNotificationToolTipItemView.prototype;
    _proto._init = function() {
        var _self = this;
        var _parentHtmlElemnt = _self._parent.getHtmlElement();
        var _htmlString = _self._getHtml();
        _parentHtmlElemnt.prepend(_htmlString);
        _self._htmlElement = _parentHtmlElemnt.children(':first');
        _self._count += 1;
        _self._updateCount(_self._count);
        _self._addCreateEvent();
    };
    _proto.destruct = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        if(_selfElm) {
            _selfElm.unbind().remove();
        }
    };
    _proto.getColumnInfo = function() {
        return this._columnInfo;
    }
    _proto.removeHtmlElement = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        if(_selfElm) {
            _selfElm.unbind().remove();
        }
    };
    _proto._addCreateEvent = function() {
        var _self = this;
        var _rootElement = _self._htmlElement;
        var _columnInfo = _self._columnInfo;
        var _roomInfo = _columnInfo.getChatRoomInfomation();
        var _roomId = _roomInfo.getRoomId();
        var _roomParentId = _roomInfo.getParentRoomId();
        var _roomName = _roomInfo.getRoomName();
        _rootElement.on('click',function(){
            var _parent = _self._parent;
            _parent.onListItemClicked(_roomId);
            if(_self.getType() != GroupChatNotificationToolTipItemView.TYPE_REMOVE_MEMBER_INCLUDE_OWN){
                function moveMyworkplace(){
                    if($('.project_btn').attr('data_value') != 'myworkplace'){
                        $('#project').find('a[data_value="myworkplace"]').trigger("click", _self._columnInfo);
                    }else{
                        ColumnManager.getInstance().addColumn(_self._columnInfo, true, true);
                    }
                }
                if(_roomParentId != ""){                    
                    function callback(communityInfo){
                        if(!communityInfo || typeof communityInfo != 'object'){
                            moveMyworkplace();
                        }else{
                            if($('.project_btn').attr('data_value') != _roomParentId){
                                function _callback(communityInfo){
                                    function dspColumn(){
                                        ColumnManager.getInstance().addColumn(_columnInfo, true, true);
                                    };
                                    TabManager.getInstance().selectOrAddTabByCommunityInfo(_roomParentId, communityInfo, dspColumn);
                                };
                                CubeeController.getInstance().getCommunityInfo(_roomParentId, _callback);
                            }else{
                                ColumnManager.getInstance().addColumn(_self._columnInfo, true, true);
                            }
                        }
                    }
                    CubeeController.getInstance().getCommunityInfo(_roomParentId, callback);
                }else{
                    moveMyworkplace();
                }
                if(_roomId){
                    NotificationIconManager.getInstance()
                                           .removeAttentionHeaderColumnIcon(
                                               'li[msgto="'
                                               + _roomId
                                               +'"][columntype="'
                                               +ColumnInformation.TYPE_COLUMN_GROUP_CHAT
                                               +'"].sortable-item .ico_group');
                }
            }
        });
    };
    _proto._getHtml = function() {
        var _self = this;
        var _ret = '<li><a class="txt_btn"> ';
        _ret += '<span class="ico ico_group">'
        var result = Utils.avatarCreate({type: 'group', name: _self._getRoomName()});
        _ret += '<div class="no_img" style="background-color:' + result.color + '">';
        _ret += '<div class="no_img_inner">' + result.name + '</div>';
        _ret += '</div>';
        _ret += '</span>';
        _ret += GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ROOM_NAME_ELEMENT_START;
        _ret += _self._getRoomNameHtml();
        _ret += GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END;
        _ret += _self._getNotificationInfoHtml();
        _ret += '</a></li>';
        return _ret;
    };
    _proto.onNotificationRecieved = function() {
        var _self = this;
        _self._count += 1;
        _self._updateCount(_self._count);
    };
    _proto.onUpdateRoomInfoNotificationRecieved = function() {
        var _self = this;
        _self._updateRoomName();
    };
    _proto._updateRoomName = function() {
        var _self = this;
        var _rootElement = _self._htmlElement;
        var _roomName = _self._columnInfo.getChatRoomInfomation().getRoomName();
        _rootElement.find(GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_NAME + '.' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_ROOM_NAME).text(_roomName);
    };
    _proto._updateCount = function(count) {
        var _self = this;
        var _rootElement = _self._htmlElement;
        _rootElement.find(GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_NAME + '.' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_COUNT).text(count);
    };
    _proto._getRoomName = function() {
        var _self = this;
        var _columnInfo = _self._columnInfo;
        var _roomInfo = _columnInfo.getChatRoomInfomation();
        var _roomName = _roomInfo.getRoomName();
        var _ret = _roomName;
        return _ret;
    };
    _proto._getRoomNameHtml = function() {
        var _self = this;
        var _columnInfo = _self._columnInfo;
        var _roomInfo = _columnInfo.getChatRoomInfomation();
        var _roomName = Utils.convertEscapedHtml(_roomInfo.getRoomName());
        var _ret = _roomName;
        return _ret;
    };
    _proto._getNotificationInfoHtml = function() {
        return '';
    };
    _proto.getRoomId = function() {
        var _self = this;
        var _columnInfo = _self._columnInfo;
        var _roomInfo = _columnInfo.getChatRoomInfomation();
        var _roomId = _roomInfo.getRoomId();
        var _ret = _roomId;
        return _ret;
    };
    _proto.getType = function() {
        return this._type;
    };
})();
function GroupChatMessageNotificationToolTipItemView(parent,groupChatColumnInfomation) {
    GroupChatNotificationToolTipItemView.call(this,parent,groupChatColumnInfomation);
    this._type = GroupChatNotificationToolTipItemView.TYPE_MESSAGE;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = GroupChatNotificationToolTipItemView.prototype;
    GroupChatMessageNotificationToolTipItemView.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatMessageNotificationToolTipItemView.prototype;
    _proto._getNotificationInfoHtml = function() {
        var _self = this;
        var _ret = '( '+ GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END + GroupChatNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME+ ' )';
        return _ret;
    };
})();
function GroupChatCreateRoomNotificationToolTipItemView(parent,groupChatColumnInfomation) {
    GroupChatNotificationToolTipItemView.call(this,parent,groupChatColumnInfomation);
    this._type = GroupChatNotificationToolTipItemView.TYPE_CREATE_ROOM;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = GroupChatNotificationToolTipItemView.prototype;
    GroupChatCreateRoomNotificationToolTipItemView.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatCreateRoomNotificationToolTipItemView.prototype;
    _proto._getNotificationInfoHtml = function() {
        return '( ' + Resource.getMessage('group_chat_notification_join') + ' )';
    };

})();
function GroupChatAddMemberNotificationToolTipItemView(parent,groupChatColumnInfomation) {
    GroupChatNotificationToolTipItemView.call(this,parent,groupChatColumnInfomation);
    this._type = GroupChatNotificationToolTipItemView.TYPE_ADD_MEMBER;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = GroupChatNotificationToolTipItemView.prototype;
    GroupChatAddMemberNotificationToolTipItemView.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatAddMemberNotificationToolTipItemView.prototype;
    _proto._getNotificationInfoHtml = function() {
        var _self = this;
        var _ret = '( ' + Resource.getMessage('group_chat_notification_add_member') + '  ' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END + GroupChatNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME+ ' )';
        return _ret;
    };
})();
function GroupChatUpdateRoomNameNotificationToolTipItemView(parent, groupChatColumnInfomation) {
    GroupChatNotificationToolTipItemView.call(this,parent,groupChatColumnInfomation);
    this._type = GroupChatNotificationToolTipItemView.TYPE_UPDATE_ROOM_NAME;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = GroupChatNotificationToolTipItemView.prototype;
    GroupChatUpdateRoomNameNotificationToolTipItemView.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatUpdateRoomNameNotificationToolTipItemView.prototype;
    _proto._getNotificationInfoHtml = function() {
        var _self = this;
        var _roomInfo = _self._columnInfo._chatRoomInfomation;
        return '( ' + _roomInfo.getPreRoomName() + ' ' + Resource.getMessage('group_chat_notification_update_room_name') + ' )';
    };
})();

function GroupChatRemoveMemberNotificationToolTipItemView(parent,groupChatColumnInfomation, isContainLoginUser) {
    if(isContainLoginUser){
        this._type = GroupChatNotificationToolTipItemView.TYPE_REMOVE_MEMBER_INCLUDE_OWN;
    }else{
        this._type = GroupChatNotificationToolTipItemView.TYPE_REMOVE_MEMBER_NOT_INCLUDE_OWN;
    }
    GroupChatNotificationToolTipItemView.call(this,parent,groupChatColumnInfomation, this._type);
};(function() {
    GroupChatRemoveMemberNotificationToolTipItemView.prototype = $.extend({}, GroupChatNotificationToolTipItemView.prototype);
    var _super = GroupChatNotificationToolTipItemView.prototype;
    var _proto = GroupChatRemoveMemberNotificationToolTipItemView.prototype;

    _proto._getNotificationInfoHtml = function() {
        var _self = this;
        var _message = Resource.getMessage('group_chat_notification_remove_member');
        if(_self.getType() == GroupChatNotificationToolTipItemView.TYPE_REMOVE_MEMBER_INCLUDE_OWN){
            _message = Resource.getMessage('group_chat_notification_remove_member_own');
        }
        var _ret = '( ' + _message + '  ' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END + GroupChatNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME+ ' )';
        return _ret;
    };
})();

function GroupChatAuthorityChanagedNotificationToolTipItemView(parent,groupChatColumnInfomation) {
    GroupChatNotificationToolTipItemView.call(this,parent,groupChatColumnInfomation);
    this._type = GroupChatNotificationToolTipItemView.TYPE_AUTHORITY_CHANGED;
};(function() {
    GroupChatAuthorityChanagedNotificationToolTipItemView.prototype = $.extend({}, GroupChatNotificationToolTipItemView.prototype);
    var _super = GroupChatNotificationToolTipItemView.prototype;
    var _proto = GroupChatAuthorityChanagedNotificationToolTipItemView.prototype;

    _proto._getNotificationInfoHtml = function() {
        var _self = this;
        var _message = Resource.getMessage('group_chat_notification_change_authority');
        var _ret = '( ' + _message + '  ' + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START + GroupChatNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END + GroupChatNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME+ ' )';
        return _ret;
    };
})();
