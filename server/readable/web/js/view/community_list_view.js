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

function CommunityListView(){
    SideMenuAccordionParts.call(this);
    this.viewPartsListHeader = CommunityListView._VIEW_PARTS_LIST_HEADER;
};(function() {
    CommunityListView._VIEW_PARTS_LIST_HEADER = 'community-list-header';

    CommunityListView.prototype = $.extend({}, SideMenuAccordionParts.prototype);
    var _super = SideMenuAccordionParts.prototype;
    var _proto = CommunityListView.prototype;

    _proto.init = function() {
        var _self = this;
        _super.init.call(_self);
        this._currentLoadedItemId = 0;
        this._allCommunityListReceived = false;
        this._headerDisplayName = Resource.getMessage('CommunityList');
        this._headerElm = null;
        return _self;
    };

    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp.call(_self);
        if(_self._headerElm){
            _self._headerElm.remove();
            _self._headerElm = null;
        }
        _self._currentLoadedItemId = null;
        _self._allCommunityListReceived = null;
        _self._headerDisplayName = null;
    };

    _proto.createFrame = function() {
        var _self = this;
        var _communityListElm = '<div class="list-community box-border flex1 olient-vertical vertical-scroll"></div>';
        var _dom = $(_communityListElm);
        _self._frame = _dom;
        return _dom;
    };

    _proto.showInnerFrame = function(callbackFunc) {
        var _self = this;
        if(_self._frame == null) {
            return;
        }
        const auth_if = AuthorityInfo.getInstance();
        if(auth_if.checkRights("createCommunity")){
            var _dom = _self._frame;
            var _header = '<div class="list-form olient-horizontal">';
            _header += '<button class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only">' + Resource.getMessage('create_community_dialog_title') + '</button>';
            _header += '</div>';

            var _headerElm = $(_header);
            _headerElm.children('button').button().on('click',function(){
                var _dialogCreateCommunityView = new DialogCreateCommunityView();
                _dialogCreateCommunityView.showDialog();
            });
            _self._headerElm = _headerElm;
            _dom.before(_headerElm);
        }
        return _self._asyncShowCommunityList(callbackFunc);
    };

    _proto._asyncShowCommunityList = function(callbackFunc) {
        var _self = this;
        var _communityArea = _self.getHtmlElement();
        _communityArea.find('.list-community').children().remove();
        _self.getCommunityInfoList(_onGetCommunityInfoList);
        function _onGetCommunityInfoList(communityList){
            _self._onGetCommunityListHistory(communityList, callbackFunc);
        };
        _self._createEventHandler();
        return true;
    };

    _proto.getCommunityInfoList = function(callbackFunc) {
        var _self = this;
        var _self = this;
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);

        function onJoinedCommunityInfoListCallback(communityList) {
            if (!communityList) {
                return;
            }
            if (communityList.getCount() < 20) {
                _self._allCommunityListReceived = true;
            }
            callbackFunc(communityList);
        }
        CubeeController.getInstance().getJoinedCommunityInfoList(_self._currentLoadedItemId, 20, _sortCondition, onJoinedCommunityInfoListCallback);
    };

    _proto._onGetCommunityListHistory = function(communityList,callbackFunc) {
        var _self = this;
        _self._hideLoadingIconInSelf();
        var _communityListElem = _self.getHtmlElement();
        if(_communityListElem == null){
            return;
        }
        for (var _i = 0; _i < communityList.getCount(); _i++) {
            var _roomInfo = communityList.get(_i);
            var _alreadyElem = _communityListElem.find('div[communityId=\'' + _roomInfo.getRoomId() + '\']');
            if(_alreadyElem.length != 0) {
                continue;
            }
            _self._addCommunity(_roomInfo, false);
        }

        setTimeout(function(){
            callbackFunc();
        },1);
        _self.resizeContent();
        return;
    };
    _proto._addCommunity = function(roomInfo, isCreated) {
        if(roomInfo == null || typeof roomInfo != 'object') {
            return false;
        }
        var _self = this;
        var _id = roomInfo.getId();
        if (_self._currentLoadedItemId == 0 || _self._currentLoadedItemId > _id) {
            _self._currentLoadedItemId = _id;
        }

        var _communityArea = _self.getHtmlElement();
        if(_communityArea == null){
            return false;
        }
        var _communityId = roomInfo.getRoomId();
        var _targetElem = _communityArea.find('div[communityId=\'' + _communityId + '\']');
        if(_targetElem.length != 0){
            return;
        }
        var _insertHtml = '<div class="box-border olient-horizontal community-list-box" communityId="' + roomInfo.getRoomId() + '" title="' + Utils.convertEscapedTag(roomInfo.getRoomName()) + '">';
        _insertHtml += '<div class="community-list-info box-border-for-abbreviation flex1">' + Utils.convertEscapedHtml(roomInfo.getRoomName()) + '</div>';
        _insertHtml += '</div>';
        var _insertElm = $(_insertHtml);

        var _insertElmIndex = 0;
        if (isCreated) {
            _communityArea.prepend(_insertElm);
        } else {
            _communityArea.append(_insertElm);
        }
        _addEventClick(_insertElm);

        _setTooltip(_insertElm,roomInfo.getRoomName());

        return true;
    };
    var _onNotificationFunc = {};
    _onNotificationFunc[Notification_model.TYPE_COMMUNITY] = _onCommunityNotify;

    _proto.onNotification = function(notification) {
        var _self = this;
        var _type = notification.getType();
        var _onNotifyFunction = Utils.getSafeValue(_onNotificationFunc, _type, function(){});
        _onNotifyFunction(_self, notification);
    };

    var _onNotificationCommunity = {};
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO] = _onUpdateCommunityInfoNotify;
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_ADD_MEMBER] = _onAddMemberNotify;
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_REMOVE_MEMBER] = _onRemoveMemberNotify;

    function _onCommunityNotify(self, notification){
        var _subType = notification.getSubType();
        var _notifyFunc = Utils.getSafeValue(_onNotificationCommunity, _subType, function(){});
        _notifyFunc(self, notification);
    };

    function _onUpdateCommunityInfoNotify(self, notification){
        self.onChangeCommunityName(notification);
    };

    function _onAddMemberNotify(self, notification){
        if(self == null || typeof self != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_ADD_MEMBER){
            return;
        }
        var _targets = notification.getAddedMemberList();
        var _count = _targets.getCount();
        var _processedCount = 0;
        _asyncAddMember();

        function _asyncAddMember(){
            if(_count <= _processedCount) {
                return;
            } else {
                var _person = _targets.get(_processedCount);
                var _loginUser = LoginUser.getInstance();
                var _loginUserJid = _loginUser.getJid();
                var _jid = _person.getJid();
                if(_loginUserJid == _jid){
                    var _communityId = notification.getRoomId();
                    var _communityName = notification.getRoomName();
                    var _tmpCommunityInfo = new CommunityInfo();
                    _tmpCommunityInfo.setRoomId(_communityId);
                    _tmpCommunityInfo.setRoomName(_communityName);
                    self._addCommunity(_tmpCommunityInfo, true);
                    return;
                }
                _processedCount++;
                setTimeout(function() {
                    _asyncAddMember();
                }, 1);
            }
        }
    };

    function _onRemoveMemberNotify(self, notification){
        if(self == null || typeof self != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_REMOVE_MEMBER){
            return;
        }
        var _targets = notification.getRemovedMemberList();
        var _count = _targets.getCount();
        var _processedCount = 0;
        _asyncRemoveMember();

        function _asyncRemoveMember(){
            if(_count <= _processedCount) {
                return;
            } else {
                var _loginUser = LoginUser.getInstance();
                var _loginUserJid = _loginUser.getJid();
                var _jid = _targets.get(_processedCount);
                if(_loginUserJid == _jid){
                    var _communityId = notification.getRoomId();
                    var _communityListElem = self.getHtmlElement();
                    var _targetElem = _communityListElem.find('div[communityId=\'' + _communityId + '\']');
                    _targetElem.remove();
                    return;
                }
                _processedCount++;
                setTimeout(function() {
                    _asyncRemoveMember();
                }, 1);
            }
        }
    };

    _proto.onChangeCommunityName = function(notification) {
        if(notification == null || typeof notification != 'object') {
            return false;
        }
        var _self = this;
        var _updatedCommunityInfo = notification.getUpdatedCommunityInfo();
        var _preCommunityInfo = notification.getPreviousCommunityInfo();
        var _updatedCommunityName = _updatedCommunityInfo.getRoomName();
        var _preCommunityName = _preCommunityInfo.getRoomName();
        if(_updatedCommunityName == _preCommunityName){
            return false;
        }
        var _communityListElem = _self.getHtmlElement();
        var _targetElem = _communityListElem.find('div[communityId=\'' + _updatedCommunityInfo.getRoomId() + '\']');
        if(_targetElem.length != 0) {
            _targetElem.find('div.community-list-info').text(_updatedCommunityInfo.getRoomName());
            _setTooltip(_targetElem,_updatedCommunityInfo.getRoomName());
            return true;
        }
        return false;
    };

    function _addEventClick(communityElem) {
        communityElem.click(function() {
            var _communityId = communityElem.attr('communityId');
            TabManager.getInstance().selectOrAddTabByCommunityId(_communityId);
        });
    };
    function _setTooltip(communityElem,roomName) {
        TooltipView.getInstance().setCommunityNameToolTip(communityElem, roomName, false);
        communityElem.attr('title', roomName);
    };

    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _selectorBottom = _rootElement;
        _selectorBottom.bottom({
            proximity : 0.1
        });

        _selectorBottom.on('bottom', function() {
            _self._showReadMore();
        });
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
        if (_self._allCommunityListReceived == true) {
            return false;
        }
        _tailOfElm = _elm.children('div:last');
        if (_tailOfElm.hasClass('loading-readmore')) {
            return false;
        }
        ViewUtils.showLoadingIcon(_tailOfElm);
        _maxNumMsg = _elm.children('div').size();
        if (_maxNumMsg == 0) {
            ViewUtils.hideLoadingIcon(_tailOfElm);
            return false;
        }

        var _callback = function(){};
        function _onGetCommunityInfoList(communityList){
            _self._onGetCommunityListHistory(communityList, _callback);
        };
        _self.getCommunityInfoList(_onGetCommunityInfoList);
        _ret = true;
        return _ret;
    };

    _proto._hideLoadingIconInSelf = function() {
        var _self = this;
        var _targetElem = _self.getHtmlElement();
        ViewUtils.hideLoadingIconInChild(_targetElem);
    };

    _proto.resizeContent = function() {
        var _self = this;
        var _communityArea = _self.getHtmlElement();
        if (_communityArea.parent().css('display') == 'none') {
            return;
        }
        setTimeout(function(){
            _nextRead();
        }, 1);

        function _nextRead() {
            if (_communityArea.prop('clientHeight') == _communityArea.prop('scrollHeight')) {
                if (!_self._allCommunityListReceived) {
                    _self._showReadMore();
                }
            }
        };
    };
    _proto.resizeAreaForIE89 = function() {
        if(!ViewUtils.isIE89()){
            return;
        }
        var _self = this;
        if (_self._frame == null) {
            return;
        }
        var _rootElm = _self._frame;
        var _parent = _rootElm.parent();
        var _parentHeight = _parent.outerHeight(true);
        var _previousElm = _rootElm.prev();
        var _previousHeight = _previousElm.outerHeight(true);
        var _contentsHeight = _parentHeight - _previousHeight;
        _rootElm.height(_contentsHeight);
    };

})();

function CommunityListElementView(){
};(function() {
    $(function(){
        $('#listCommunity ul').selectable({
            filter: 'img'
        });
    });
})();

function AllCommunityDialog(){
    DialogView.call(this);
};(function() {
    AllCommunityDialog.prototype = $.extend({}, DialogView.prototype);
    var _super = DialogView.prototype;
    var _proto = AllCommunityDialog.prototype;
    $(function(){
        $('#communityListModal').dialog({
            autoOpen : false,
            width : 500,
            height : 320,
            resizable : false
        });
    });
})();

function CommunityAvatar(){
    AvatarView.call(this);
};(function() {
    CommunityAvatar.prototype = $.extend({}, AvatarView.prototype);
    var _super = AvatarView.prototype;
    var _proto = CommunityAvatar.prototype;
})();
