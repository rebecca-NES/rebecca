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

function PublicGroupChatListView() {
    SideMenuAccordionParts.call(this);
};(function() {
    PublicGroupChatListView.prototype = $.extend({}, SideMenuAccordionParts.prototype);
    var _super = SideMenuAccordionParts.prototype;

    var _proto = PublicGroupChatListView.prototype;

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
    _proto.showInnerFrameFromProject = function(callback, _projectInfo) {
        var _self = this;
        setTimeout(function(){
            callback();
        }, 10);
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);
        var parentList = new ArrayList();
        parentList.add(_projectInfo);
        var _num = _self.getNumberOfGetCount();
        function onGetGroupInfoListHistoryCallback(groupchatList) {
            if (!groupchatList._array &&
                !groupchatList._length &&
                (groupchatList.errorCode != 0 ||
                 groupchatList.content == null ||
                 groupchatList.content.result == false)) {
                $("#public_grouplist_modal #dialog-error")
                    .text(Resource.getMessage('get_room_list_err'));
                return false
            }
            if (groupchatList.getCount() < _num) {
                _self._allGroupChatListReceived = true;
            }
            _self._onGetGroupInfoListHistory(groupchatList);
        }
        CubeeController.getInstance().getPublicGroupRoomInfoList(_self._currentLoadedItemId, _num, _sortCondition, onGetGroupInfoListHistoryCallback)
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
        const myJid = LoginUser.getInstance().getJid();
        const memberList = roomInfo.getMemberList();
        if(memberList._array.indexOf(myJid) >= 0){
            return true
        }

        var _date = roomInfo.getUpdatedAt() ? roomInfo.getUpdatedAt().getTime() : +new Date();

        if (_self._currentLoadedItemId == 0 || _self._currentLoadedItemDate > _date) {
            _self._currentLoadedItemId = _id;
            _self._currentLoadedItemDate = _date;
        }

        var roomName = Utils.convertEscapedHtml(roomInfo.getRoomName())
        var avatarInfo = Utils.avatarCreate({type: 'group', name: roomInfo.getRoomName()})
        var _insertHtml = '';
        _insertHtml = '<li>'
        _insertHtml += '<label for="pub_gc_' + roomInfo.getRoomId() + '"><a roomid="' + roomInfo.getRoomId() + '" title="' + roomName +'"><div>';
        _insertHtml += '  <span class="ico ico_group">'
        _insertHtml += '    <div class="no_img" style="background-color:' + avatarInfo.color + '">';
        _insertHtml += '      <div class="no_img_inner">' + avatarInfo.name + '</div>';
        _insertHtml += '    </div>';
        _insertHtml += '  </span>';
        _insertHtml += '  <span class="name room-list-name">' + roomName + '</span>';
        _insertHtml += '</a>';
        _insertHtml += '<input type="radio" name="public-gc-room-id" value="' + roomInfo.getRoomId() + '" id="pub_gc_' + roomInfo.getRoomId() + '" />';
        _insertHtml += '<span class="public-gc-room-list-radio"></span>';
        _insertHtml += '';
        _insertHtml += '</div></label></li>';

        var _insertElmIndex = 0
        if (isCreated) {
            parent.prepend(_insertHtml);
        } else {
            parent.append(_insertHtml);
            _insertElmIndex = parent.children('*').length - 1;
        }
        var _insertElem = parent.children('*').eq(_insertElmIndex);

        _setTooltip(_insertElem,roomInfo.getRoomName());

        return true;
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
        CubeeController.getInstance().getPublicGroupRoomInfoList(_self._currentLoadedItemId, _num, _sortCondition, onGetGroupInfoListHistoryCallback);
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

})();
