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

function CommunityMemberListView(){
    SideMenuAccordionParts.call(this);
    this.VIEW_PARTS_TYPE = 'community-member-list';
    this._callbacks = null;

};(function() {
    CommunityMemberListView.prototype = $.extend({}, SideMenuAccordionParts.prototype);
    var _super = SideMenuAccordionParts.prototype;

    var _proto = CommunityMemberListView.prototype;

    _proto.init = function(communityId) {
        var _self = this;
        _super.init.call(_self);
        _self._selectedUserList = new ArrayList();
        _self._startChatFormObj = null;
        _self._headerDisplayName = Resource.getMessage('CommunityMemberList');
        _self._communityId = communityId;
        _self._callbacks = {
            getSelectedUserList : _self.getSelectedUserList.bind(_self),
            addSelectedUserList : _self.addSelectedUserList.bind(_self),
            removeSelectedUserList : _self.removeSelectedUserList.bind(_self),
            removeSelectedUserListAll : _self.removeSelectedUserListAll.bind(_self)
        };
        return _self;
    };

    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp.call(_self);
        if(_self._startChatFormObj){
            _self._startChatFormObj.cleanUp();
            _self._startChatFormObj = null;
        }
        if(_self._selectedUserList){
            _self._selectedUserList.removeAll();
            _self._selectedUserList = null;
        }
        _self._headerDisplayName = null;

        if(_self._subView){
            _self._subView.cleanUp();
            _self._subView = null;
        }
        if(_self._mTipList){
            var _count = _self._mTipList.getCount();
            var _processedCount = 0;

            var _asyncRemoveMTip = function(){
                if(_count <= _processedCount){
                    _self._mTipList = null;
                    return;
                }
                var _mTipId = _self._mTipList.get(_processedCount);
                $('#' + _mTipId).remove();
                _processedCount++;
                setTimeout(function(){
                    _asyncRemoveMTip();
                }, 1);
            };
            setTimeout(function(){
                _asyncRemoveMTip();
            }, 1);
        }
    };

   _proto.createFrame = function() {
       var _self = this;
       var _memmberListElm = '<div class="box-border flex1 olient-vertical vertical-scroll ui-widget ui-helper-reset  hide-view"></div>';
       var _dom = $(_memmberListElm);
       _self._frame = _dom;
       _self._createEventHandler();
       return _dom;
   };
    _proto.showMemberList = function() {
        var _self = this;
        return _self._asyncShowMemberList(null);
    };
    _proto.showInnerFrame = function(callback) {
        var _self = this;
        return _self._asyncShowMemberList(callback);
    };
    _proto._asyncShowMemberList = function(callbackFunc) {
        var _self = this;
        function _callCallback() {
            setTimeout(function() {
                if(callbackFunc != null && typeof callbackFunc == 'function') {
                    callbackFunc();
                }
            }, 1);
        };
        var _communityId = _self._communityId;
        if(_communityId == null || _communityId == ''){
            _callCallback();
            return;
        }
        _self.getHtmlElement().children().remove();
        var _communityMemberContainer = _self.getHtmlElement();
        ViewUtils.showLoadingTopInChild(_communityMemberContainer);
        CubeeController.getInstance().getCommunityMemberInfo(_communityId, _onGetCommunityMemberInfo);

        function _getCommunityMemberContainerArea() {
            var _ret = null;
            if(_self == null) {
                return _ret;
            }
            return _self.getHtmlElement();
        }

        function _onGetCommunityMemberInfo(communityInfo){
            if(communityInfo == null){
                setTimeout(function(){
                    var _communityMemberContainer = _getCommunityMemberContainerArea();
                    if(_communityMemberContainer == null) {
                        _callCallback();
                        return;
                    }
                    ViewUtils.hideLoadingIconInChild(_communityMemberContainer);
                    _communityMemberContainer.removeClass('hide-view');
                    var _memberListAreaStr = '<div class="member-list box-border-for-abbreviation olient-vertical flex1 vertical-scroll">' + Resource.getMessage('not_referable_community') + '</div>';
                    _communityMemberContainer.append(_memberListAreaStr);
                    _callCallback();
                },1);
                return;
            }
            var _personsArray = new Array();
            var _ownerList = communityInfo.getOwnerList();
            var _ownerCount = _ownerList.getCount();
            var _generalMemberList = communityInfo.getGeneralMemberList();
            var _generalMemberCount = _generalMemberList.getCount();
            for(var _i = 0; _i < _ownerCount; _i++) {
                var _ownerPerson = _ownerList.get(_i);
                _personsArray.push(_ownerPerson);
            }
            for(var _i = 0; _i < _generalMemberCount; _i++) {
                var _gemeralPerson = _generalMemberList.get(_i);
                _personsArray.push(_gemeralPerson);
            }
            _asyncShowStartGroupChatForm();

            function _asyncShowStartGroupChatForm() {
                var _communityMemberContainer = _getCommunityMemberContainerArea();
                if(_communityMemberContainer == null) {
                    _callCallback();
                    return;
                }
                var _groupchatStartFormHtml = GroupChatStartFormView.getHtml();
                _communityMemberContainer.append(_groupchatStartFormHtml);
                setTimeout(function() {
                    _asyncShowMemberListView();
                }, 1);
            };

            function _asyncShowMemberListView() {
                var _communityMemberContainer = _getCommunityMemberContainerArea();
                if(_communityMemberContainer == null) {
                    _callCallback();
                    return;
                }
                var _memberListAreaStr = '<div class="member-list box-border-for-abbreviation olient-vertical flex1 vertical-scroll"></div>';
                _communityMemberContainer.append(_memberListAreaStr);
                var _memberArea = _communityMemberContainer.find('.member-list');
                var _count = _personsArray.length;
                var _processedCount = 0;
                _asyncShowMember();
                function _asyncShowMember() {
                    var _communityMemberContainer = _getCommunityMemberContainerArea();
                    if(_communityMemberContainer == null) {
                        _callCallback();
                        return;
                    }
                    var _loopCount = 20;
                    for(var _i = 0; _i < _loopCount; _i++) {
                        if(_count <= _processedCount) {
                            break;
                        }
                        _addMemberToCommunityMember(_memberArea, _personsArray[_processedCount]);
                        _processedCount++;
                    }
                    if(_count <= _processedCount) {
                        _asyncDisplayMemberList();
                        return;
                    }
                    setTimeout(function() {
                        _asyncShowMember();
                    }, 1);
                };
            };

            function _asyncDisplayMemberList() {
                var _communityMemberContainer = _getCommunityMemberContainerArea();
                if(_communityMemberContainer == null) {
                    _callCallback();
                    return;
                }
                ViewUtils.hideLoadingIconInChild(_communityMemberContainer);
                _communityMemberContainer.removeClass('hide-view');
                _self.resizeContent();
                _callCallback();
            };

        }
    };
    _proto.resizeContent = function() {
        var _self = this;
        var _communityMemberContainer = _self.getHtmlElement();
        if(_communityMemberContainer == null){
            return;
        }
        if(_communityMemberContainer.css('display') == 'none') {
            return;
        }
        if(ViewUtils.isIE89()){
            var _width = _communityMemberContainer.outerWidth(true);
            _communityMemberContainer.find('.community-member-list-box').width(_width);
            _communityMemberContainer.find('.list-community-member').css('overflow-x', 'hidden');
        }
    };
    function _addMemberToCommunityMember(parent, person) {
        if(parent == null || typeof parent != 'object') {
            return false;
        }
        if(person == null || typeof person != 'object') {
            return false;
        }
        var _person = person;
        var _avatarElem = _createMemberItemElement(_person);
        parent.append(_avatarElem);
        return true;
    };

    function _createMemberItemElement(person) {
        var _self = this;
        var _ret = '';
        if(person == null || typeof person != 'object') {
            return _ret;
        }
        var _insertHtml = '<div class="list-community-member"></div>';
        var _avatarListElem = $(_insertHtml);

        var _jid = person.getJid();
        var _cachedUser = CubeeController.getInstance().getPersonData(_jid);

        var _myMemo = _cachedUser ? _cachedUser.getMyMemo() : person.getMyMemo();
        if(_myMemo == null) {
            _myMemo = '';
        }

        var _insertAvatarHtml = '';
        _insertAvatarHtml += '<div class="box-border olient-horizontal community-member-list-box" jid="' + _jid + '">';
        _insertAvatarHtml +=    ViewUtils.getAvatarDataHtmlFromPerson(person, "avatar-community-member-list");
        _insertAvatarHtml += '  <div class="flex1 block-info-community-member-list">';
        _insertAvatarHtml +=      _getUserNameAreaHtml(person);
        _insertAvatarHtml += '    <div class="community-member-list-info info-user-mymemo box-border-for-abbreviation display-none" title="'+ Utils.convertEscapedTag(_myMemo) + '">' + Utils.convertEscapedHtml(_myMemo) + '</div>';
        _insertAvatarHtml += '  </div>';
        _insertAvatarHtml += '</div>';

        var _dom = $(_insertAvatarHtml);
        var _presence = _cachedUser ? _cachedUser.getPresence() : person.getPresence();
        ViewUtils.showPresenceIcon(_dom, _presence, ViewUtils.STATUS_PRESENCEICON_CONTACTLIST);
        var _updateElemSelectorNickName = _dom.find('.info-user-nickname');
        var _nickNameContent = _updateElemSelectorNickName.attr('title');
        _updateElemSelectorNickName.attr('title',_nickNameContent);
        _avatarListElem.append(_dom);

        var _mTipOwner = _avatarListElem.find('.block-avatar');
        TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, _mTipOwner, false, {
            align : 'bottom left'
        });

        return _avatarListElem;
    }

    function _getUserNameAreaHtml(person) {
        var _ret = '';
        if(person == null || typeof person != 'object') {
            return _ret;
        }
        var _jid = person.getJid();
        var _userName = ViewUtils.getUserNameByPerson(person);
        var _accountName = ViewUtils.getCubeeAccountNameByPerson(person);
        var _status = person.getStatus();
        _ret = '<div class="community-member-list-info info-user-nickname box-border-for-abbreviation"'
             + ' title="'+ Utils.convertEscapedTag(_userName)
             + ViewUtils.getUserStatusString(_status)
             + ' @' + Utils.convertEscapedTag(_accountName) + '">'
             + Utils.convertEscapedHtml(_userName)
             + ViewUtils.getUserStatusString(_status)
             + '<span class="sender-account">@' + Utils.convertEscapedHtml(_accountName) + '</span>'
             + '</div>';
        return _ret;
    };
    function _startChat(memberListBoxElem) {
        var _selectedJid = memberListBoxElem.attr('jid');
        var _columnInformation = new ColumnInformation();
        _columnInformation.setColumnType(ColumnInformation.TYPE_COLUMN_CHAT);
        _columnInformation.setFilterCondition(_selectedJid);
        ColumnManager.getInstance().addColumn(_columnInformation, true, true);


    };

    _proto._showStartChatForm = function() {
        var _self = this;
        var _startChatFormElm = _self.getHtmlElement().find('.start-chatroom-form-border');
        var _selectedCount = _self._selectedUserList.getCount();
        if (_selectedCount == 0) {
            if (_self._startChatFormObj) {
                _self._startChatFormObj.hideStartForm();
            }
        } else if (_selectedCount == 1) {
            if (!_self._startChatFormObj) {
                _self._startChatFormObj = new GroupChatStartFormView(_startChatFormElm, _self);
            }
            _self._startChatFormObj.showStartForm();
        } else {
            if (_self._startChatFormObj) {
                _self._startChatFormObj.updateSelectedCount();
            }
        }
    };
    _proto.cancelSelectedUserListAll = function() {
        var _self = this;
        var _selectedUserElm = _self.getHtmlElement().find('.community-member-list-selected');
        _self._removeSelectedUserListAll();
        _selectedUserElm.removeClass("community-member-list-selected");
        _self._showStartChatForm();
    };

    var _onProfileChangedFunc = {};
    _onProfileChangedFunc[ProfileChangeNotice.TYPE_PRESENCE] = _onPresenceNotify;
    _onProfileChangedFunc[ProfileChangeNotice.TYPE_PROFILE] = _onProfileNotify;

    _proto.onProfileChanged = function(profile) {
        var _self = this;
        var _type = profile.getType();
        var _profileChangedFunc = Utils.getSafeValue(_onProfileChangedFunc, _type, function(){});
        _profileChangedFunc(_self, profile);
    };

    function _onPresenceNotify(communityMemberListView,profile){
        communityMemberListView.updateMemmberListPresence(profile);
    };

    function _onProfileNotify(communityMemberListView,profile){
        communityMemberListView.updateMemberListProfile(profile);
    };

    _proto.updateMemmberListPresence = function(presenceChangeNotice) {
        if(presenceChangeNotice == null || typeof presenceChangeNotice != 'object') {
            return false;
        }
        var _jid = presenceChangeNotice.getJid();
        var _self = this;
        var _updateElems = _self.getHtmlElement().find('.community-member-list-box[jid=\'' + _jid + '\']');
        for(var _i = 0; _i < _updateElems.length; _i++) {
            var _updateElem = _updateElems.eq(_i);
            ViewUtils.showPresenceIcon(_updateElem, presenceChangeNotice.getPresence(), ViewUtils.STATUS_PRESENCEICON_CONTACTLIST);
            var _updateElemSelectorMemo = _updateElem.find('.info-user-mymemo');
            var _mymemo = presenceChangeNotice.getMyMemo();
            _updateElemSelectorMemo.text(_mymemo);
            _updateElemSelectorMemo.attr('title', _mymemo);
            var _updateElemSelectorAvater = _updateElem.find('.block-avatar');
            TooltipView.getInstance().updateAvatarToolTip(_updateElemSelectorAvater);
        }
        return true;
    };

    _proto.updateMemberListProfile = function(profileChangeData) {
        if(profileChangeData == null || typeof profileChangeData != 'object') {
            return false;
        }
        var _self = this;
        var _jid = profileChangeData.getJid();
        var _profile = profileChangeData.getProfile();
        var _updateElems = _self.getHtmlElement().find('.community-member-list-box[jid=\'' + _jid + '\']');

        var _person = new Person();
        _person.setJid(_jid);
        _person._profile = _profile;

        if(_updateElems.length > 0){
            var _userNickNameElem = _updateElems.eq(0).find('.info-user-nickname');
            var _nicknameStr = _userNickNameElem.text();
            var _suspendIndex = _nicknameStr.indexOf(Resource.getMessage('suspend'));
            var _status = _suspendIndex > -1 ? Profile.STATUS_SUSPEND : Profile.STATUS_ACTIVE;
            _person._profile.setStatus(_status);
            var _accountNameStr = _userNickNameElem.children('span').text();
            if(_accountNameStr.indexOf('@') === 0){
                _accountNameStr = _accountNameStr.substr(1);
            }
            _person._profile.setLoginAccount(_accountNameStr);
        }

        var _updateUserNameHtml = _getUserNameAreaHtml(_person);
        for(var _i = 0; _i < _updateElems.length; _i++) {
            var _updateElem = _updateElems.eq(_i);
            var _updateElemSelectorAvater = _updateElem.find('.block-avatar');
            _updateElemSelectorAvater.remove();
            _updateElem.prepend(ViewUtils.getAvatarDataHtmlFromPerson(_person, 'avatar-community-member-list'));
            var _updateElemSelectorNickName = _updateElem.find('.info-user-nickname');
            _updateElemSelectorNickName.replaceWith(_updateUserNameHtml);
            _updateElemSelectorNickName = _updateElem.find('.info-user-nickname');
            var _nickNameContent = _updateElemSelectorNickName.attr('title');
            TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, _updateElem.find('.block-avatar'), false, {
                align : 'bottom left'
            });
            _updateElemSelectorNickName.attr('title', _nickNameContent);
        }
        return true;
    };


    var _onNotificationFunc = {};
    _onNotificationFunc[Notification_model.TYPE_COMMUNITY] = _onCommunityNotify;

    _proto.onNotification = function(notification) {
        if(notification == null || typeof notification != 'object'){
            return;
        }
        let _communityId = notification.getRoomId();
        let view = new CommunityDetailsView();
        view.init(_communityId);
        view.setCommunityDetailData(_communityId);
    };

    var _onNotificationCommunity = {};
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_ADD_MEMBER] = _onAddMemberNotify;
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_REMOVE_MEMBER] = _onRemoveMemberNotify;
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_UPDATE_OWNER] = _onUpdateOwnerNotify; 


    function _onCommunityNotify(self, notification){
        if(self == null || typeof self != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        var _notifyFunc = Utils.getSafeValue(_onNotificationCommunity, _subType, function(){});
        _notifyFunc(self, notification);
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
        var _communityId = notification.getRoomId();
        if(_communityId != self._communityId){
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
                self._addMember(_person);
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
        var _communityId = notification.getRoomId();
        if(_communityId != self._communityId){
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
                var _jid = _targets.get(_processedCount);
                self._removeMember(_jid);
                _processedCount++;
                setTimeout(function() {
                    _asyncRemoveMember();
                }, 1);
            }
        }
    };

    function _onUpdateOwnerNotify(self, notification) {
        if (self == null || typeof self != 'object') {
            return;
        }
        if (notification == null || typeof notification != 'object') {
            return;
        }
        var _subType = notification.getSubType();
        if (_subType != CommunityNotification.SUB_TYPE_UPDATE_OWNER) {
            return;
        }
        var _communityId = notification.getRoomId();
        if (_communityId != self._communityId) {
            return;
        }
        self._updateOwner();
    };

    function _onShowToolTip( $tip, options, event){
        if(event.type == 'longtap'){
            return false;
        }
    }
    _proto._addMember = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return false;
        }
        var _rootElement = _self.getHtmlElement();
        var _avatarListElem = _rootElement.find('.member-list');
        _addMemberToCommunityMember(_avatarListElem, person);

        _self.notifyChangeSelectedUserList();
    };
    _proto._removeMember = function(jid) {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _removeElem = _self.getHtmlElement().find('.community-member-list-box[jid=\'' + jid + '\']');
        _removeElem.remove();

        if (jid == LoginUser.getInstance().getJid()) {
            if (_self._subView) {
                _self._subView._updateMemberControlButton();
            }
        }
    };
    _proto._updateOwner = function() {
        var _self = this;

        if (_self._subView) {
            _self._subView._updateMemberControlButton();
        }
    };

    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        $(_rootElement).on('click', 'div.community-member-list-box', function() {
            var _selfObj = $(this);
            var _selectedJid = _selfObj.attr('jid');
            var _loginUser = LoginUser.getInstance();
            var _loginUserJid = _loginUser.getJid();
            if(_loginUserJid == _selectedJid){
                return;
            }
            var _person = CubeeController.getInstance().getCachedCommunityMember(_self._communityId, _selectedJid);
            var _sameJidElems = _rootElement.find('.community-member-list-box[jid=\'' + _selectedJid + '\']');
            if (_selfObj.data('clickTimerId') == null) {
                var _timerid = setTimeout(function(){
                    _selfObj.data('clickTimerId', null);
                     if(!_person){
                        return;
                    }
                    if (_selfObj.hasClass("community-member-list-selected")) {
                        _sameJidElems.removeClass("community-member-list-selected");
                        _self.removeSelectedUserList(_person);
                    } else {
                        _sameJidElems.addClass("community-member-list-selected");
                        _self.addSelectedUserList(_person);
                    }
                }, ViewUtils.SINGLE_CLICK_DECISION_TIME);
                _selfObj.data('clickTimerId', _timerid);
            } else {
                clearTimeout(_selfObj.data('clickTimerId'));
                _selfObj.data('clickTimerId', null);
                _startChat($(this));
            }
        });
        if (ViewUtils.isIE8()) {
            $(_rootElement).on('dblclick', 'div.community-member-list-box', function(){
                var _selfObj = $(this);
                var _selectedJid = _selfObj.attr('jid');
                var _sameJidElems = _rootElement.find('.community-member-list-box[jid=\'' + _selectedJid + '\']');
                clearTimeout(_selfObj.data('clickTimerId'));
                _selfObj.data('clickTimerId', null);
                _startChat($(this));
            });
        }
    };

    _proto.getSelectedUserList = function() {
        if(!this._subView){
            return new ArrayList();
        }
        return this._subView.getSelectedUserList();
    };
    _proto.addSelectedUserList = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return;
        }

        if(!_self._subView){
            _self._subView = new CommunityMemberListSubView(_self._communityId, _self.VIEW_PARTS_TYPE, _self._callbacks);
            $('#listInnerContainer').append(_self._subView._frame);
        }

        _self._subView.addSelectedUserList(person);
        _self._subView.show();
        _self.notifyChangeSelectedUserList();
    };
    _proto.removeSelectedUserList = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return;
        }
        if(!_self._subView){
            return;
        }
        _self._subView.removeSelectedUserList(person);

        _self.notifyChangeSelectedUserList();

        if(_self.getSelectedUserList().getCount() == 0){
            _self._subView.hide();
            _self._subView.cleanUp();
            _self._subView = null;
            var _viewHtml = $('#listContainer #' + _self.VIEW_PARTS_TYPE + '-subview');
            if(_viewHtml.length > 0){
                _viewHtml.remove();
            }
        }
    };
    _proto.removeSelectedUserListAll = function() {
        var _self = this;
        if(!_self._subView){
            return;
        }
        _self._subView.removeSelectedUserListAll();

        _self.notifyChangeSelectedUserList();

        _self._subView.hide();
        _self._subView.cleanUp();
        _self._subView = null;
        var _viewHtml = $('#listContainer #' + _self.VIEW_PARTS_TYPE + '-subview');
        if(_viewHtml.length > 0){
            _viewHtml.remove();
        }
    };

    _proto.notifyChangeSelectedUserList = function(){
        var _self = this;
        var _selectedUserList = _self.getSelectedUserList();
        [_self, _self._subView].forEach(function(elem){ 
            if(elem){
                elem.receivedChangeSelectedUser(_selectedUserList);
            }
        });
    };
    _proto.receivedChangeSelectedUser = function(selectedUserList){
        var _self = this;
        _self._frame.find('.' + _self.VIEW_PARTS_TYPE +'-box').removeClass(_self.VIEW_PARTS_TYPE +'-selected');

        var _count = selectedUserList.getCount();
        for(var i=0; i<_count; i++){
            var _selectedJid = selectedUserList.get(i).getJid();
            var _elem = _self._frame.find('.' + _self.VIEW_PARTS_TYPE +'-box[jid=\'' + _selectedJid + '\']');
            if(_elem.length > 0){
                _elem.addClass(_self.VIEW_PARTS_TYPE +'-selected');
            }
        }
    };
    _proto.beforeActivate = function(targetObj){
        var _self = this;
        if(targetObj instanceof CommunityMemberListView){
            return;
        }
        if(_self._subView){
            _self._subView.hide();
        }
    };
    _proto.activate = function(targetObj){
        var _self = this;
        if(!(targetObj instanceof CommunityMemberListView)){
            return;
        }
        if(_self._subView){
            _self._subView.show();
            _self._subView._updateMemberControlButton();
        }
    };
    _proto.resizeAreaForIE89 = function() {
        _super.resizeAreaForIE89.call(this);

        if(!ViewUtils.isIE89()){
            return;
        }
        var _self = this;
        if(_self._subView){
            _self._subView.setListInnerContainerScrollForIE89();
        }
    };
})();
