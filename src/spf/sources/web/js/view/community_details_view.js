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

function CommunityDetailsView(){
    SideMenuAccordionParts.call(this);
}(function() {
    CommunityDetailsView.prototype = $.extend({}, SideMenuAccordionParts.prototype);
    var _super = SideMenuAccordionParts.prototype;

    var _proto = CommunityDetailsView.prototype;

    var _communityDetailsView = new CommunityDetailsView();

    _proto.init = function(communityId) {
        var _self = this;
        _super.init.call(_self);
        _self._headerDisplayName = Resource.getMessage('CommunityDetail');
        _self._headerElm = null;
        _self._communityId = communityId;
        _self.personCount = 0;
        _self.allPersons = [];

        $('#prj_ico').off('click');
        $('#prj_ico').on('click', function(){
          if (!$('.control-sidebar').hasClass('control-sidebar-open')) {
            SideMenuRecentView.getInstance().close();
            _self.setCommunityDetailData(communityId);
          }
          $('.control-sidebar').toggleClass('control-sidebar-open');
        });
        $('#project_scroll_area').off('scroll');
        $('#project_scroll_area').on('scroll', function() {
            $('#project_scroll_area').on('ps-y-reach-end', function(){
                if (_self.personCount !== _self.allPersons.length){
                    _self.addPersons(_self._communityId);
                }
            });
        });

        return _self;
    };

    CommunityDetailsView.getInstance = function() {
        return _communityDetailsView;
    };

    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp.call(_self);
        if(_self._headerElm){
            _self._headerElm.children('*').off();
            _self._headerElm.remove();
            _self._headerElm = null;
        }
        _self._headerDisplayName = null;
        if(_self._mtipObj){
            _self._mtipObj.remove();
        }
    };

    _proto.createFrame = function() {
        var _self = this;
        var _detailsElm = '<div class="community-detail box-border flex1 olient-vertical vertical-scroll"></div>';
        var _dom = $(_detailsElm);
        _self._frame = _dom;
        return _dom;
    };

    _proto.showInnerFrame = function(callback) {
        var _self = this;
        if(_self._frame == null) {
            return;
        }
        var _dom = _self._frame;
        var _headerElm = '<div class="list-form olient-horizontal vertical-scroll"><button class="list-form-button community-settings"></button></div>';
        _headerElm = $(_headerElm);
        _headerElm.children('button').button({
            icons: {
                primary: 'ui-icon-gear'
            },
            text: false
        });
        var _buttonElm = _headerElm.children('button');
        _self._createConfToolTipDom(_onCreateConfToolTipDom);
        function _onCreateConfToolTipDom(toolTipObj){
            if(toolTipObj == null){
                return;
            }
        }
        _self._headerElm = _headerElm;
        _dom.before(_headerElm);
        return _self._asyncShowDetails(callback);
    };
    _proto._createConfToolTipDom = function(callback) {
        var _self = this;
        var _dom = $('<ul class="config_menu list_none"></ul>');
        _dom.css('text-align','center');
        var _communityId = _self._communityId;
        if(_communityId == null || _communityId == ''){
            return;
        }
        CubeeController.getInstance().getCommunityMemberInfo(_communityId, _onGetCommunityMemberInfo);

        function _onGetCommunityMemberInfo(communityInfo){
            if(communityInfo == null){
                return;
            }
            var _isOwner = false;
            var _ownerList = communityInfo.getOwnerList();
            var _ownerCount = _ownerList.getCount();
            var _loginUser = LoginUser.getInstance();
            var _loginUserJid = _loginUser.getJid();
            for(var _i = 0; _i < _ownerCount; _i++) {
                var _ownerPerson = _ownerList.get(_i);
                var _curJid = _ownerPerson.getJid();
                if(_loginUserJid == _curJid){
                    _isOwner = true;
                }
            }
            var authorityInfo = AuthorityInfo.getInstance();
            if(!_isOwner){
                if(!authorityInfo.checkRights('manageCommunity', _communityId)){
                    var _confirmMemberToolTipDom = _self._confirmMemberToolTipDom();
                    _dom.append(_confirmMemberToolTipDom);
                }
                callback(_dom);
                return;
            }
            if(authorityInfo.checkRights('manageCommunity', _communityId)){
                var _addMemberToolTipDom = _self._createAddMemberToolTipDom();
                _dom.append(_addMemberToolTipDom);
                var _changeAuthMemberToolTipDom = _self._createAuthorityChangeMemberToolTipDom();
                _dom.append(_changeAuthMemberToolTipDom);
                var _leaveMemberToolTipDom = _self._createForceLeaveMemberToolTipDom();
                _dom.append(_leaveMemberToolTipDom);
                var _settingToolTipDom = _self._createCommunitySettingToolTipDom();
                _dom.append(_settingToolTipDom);
                callback(_dom);
            }
        }
    };
    _proto._createCommunitySettingToolTipDom = function() {
        var _self = this;
        var _html = '<li><p>' + Resource.getMessage('conf_community_setting_tooltip') + '</p></li>';
        var _dom = $(_html);
        _dom.on('click',function(){
            _self._onClickSettingToolTip();
        });
        return _dom;
    };
    _proto._onClickSettingToolTip = function() {
        var _self = this;
        var _communityId = _self._communityId;
        if(_communityId == null){
            return;
        }
        var _dialogSettingCommunityView = new DialogSettingCommunityView(_communityId);
        _dialogSettingCommunityView.showDialog();
    };
    _proto._createAddMemberToolTipDom = function() {
        var _self = this;
        var _html = '<li><p>' + Resource.getMessage('conf_community_add_member_tooltip') + '</p></li>';
        var _dom = $(_html);
        _dom.on('click',function(){
            _self._onClickAddMemberToolTip();
        });
        return _dom;
    };
    _proto._onClickAddMemberToolTip = function() {
        var _self = this;
        var _communityId = _self._communityId;
        if(_communityId == null){
            return;
        }
        var _dialogCommunityAddMemberView = new DialogSelectCommunityAddMemberView(_communityId);
        _dialogCommunityAddMemberView.showDialog();
    };

    _proto._createAuthorityChangeMemberToolTipDom = function() {
        var _self = this;
        var _html = '<li><p>' + Resource.getMessage('conf_community_change_authority_tooltip') + '</p></li>';
        var _dom = $(_html);
        _dom.on('click',function(){
            _self._onClickAuthorityChengeMemberToolTipDom();
        });
        return _dom;
    };
    _proto._onClickAuthorityChengeMemberToolTipDom = function() {
        var _self = this;
        var _communityId = _self._communityId;
        if(_communityId == null){
            return;
        }
        var _dialogCommunityChangeAuthorityMemberView = new DialogSelectCommunityChangeAuthorityMemberView(_communityId);
        _dialogCommunityChangeAuthorityMemberView.showDialog();
    };
    _proto._confirmMemberToolTipDom = function() {
        var _self = this;
        var _html = '<li><p>' + Resource.getMessage('conf_confirm_authority_tooltip') + '</p></li>';
        var _dom = $(_html);
        _dom.on('click',function(){
            _self._onClickConfirmMemberToolTip();
        });
        return _dom;
    };
    _proto._onClickConfirmMemberToolTip = function() {
        var _self = this;
        var _communityId = _self._communityId;
        if(_communityId == null){
            return;
        }
        var _dialogCommunityConfirmAuthorityMemberView= new DialogSelectCommunityConfirmAuthorityMemberView(_communityId);
        _dialogCommunityConfirmAuthorityMemberView.showDialog();
    };

    _proto._createAuthorityChangeMemberToolTipDom = function() {
        var _self = this;
        var _html = '<li><p>' + Resource.getMessage('conf_community_change_authority_tooltip') + '</p></li>';
        var _dom = $(_html);
        _dom.on('click',function(){
            _self._onClickAuthorityChengeMemberToolTipDom();
        });
        return _dom;
    };
    _proto._onClickAuthorityChengeMemberToolTipDom = function() {
        var _self = this;
        var _communityId = _self._communityId;
        if(_communityId == null){
            return;
        }
        var _dialogCommunityChangeAuthorityMemberView = new DialogSelectCommunityChangeAuthorityMemberView(_communityId);
        _dialogCommunityChangeAuthorityMemberView.showDialog();
    };
    _proto._createForceLeaveMemberToolTipDom = function() {
        var _self = this;
        var _html = '<li><p>' + Resource.getMessage('conf_community_leave_member_tooltip') + '</p></li>';
        var _dom = $(_html);
        _dom.on('click',function(){
            _self._onClickForceLeaveMemberToolTip();
        });
        return _dom;
    };
    _proto._onClickForceLeaveMemberToolTip = function() {
        var _self = this;
        var _communityId = _self._communityId;
        if(_communityId == null){
            return;
        }
        var _dialogCommunityForceLeaveMemberView = new DialogSelectCommunityForceLeaveMemberView(_communityId);
        _dialogCommunityForceLeaveMemberView.showDialog();
    };

    var _onNotificationFunc = {};
    _onNotificationFunc[Notification_model.TYPE_COMMUNITY] = _onCommunityNotify;

    _proto.onNotification = function(notification) {
        if(notification == null || typeof notification != 'object'){
            return;
        }

        var _self = this;

        _self.setCommunityDetailData(notification.getRoomId());

        var _type = notification.getType();
        var _onNotifyFunction = Utils.getSafeValue(_onNotificationFunc, _type, function(){});
        _onNotifyFunction(_self, notification);
    };

    var _onNotificationCommunity = {};
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO] = _onUpdateCommunityInfoNotify;
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_UPDATE_OWNER] = _onUpdateOwnerNotify;

    function _onCommunityNotify(communityDetailsView, notification){
        if(communityDetailsView == null || typeof communityDetailsView != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        var _notifyFunc = Utils.getSafeValue(_onNotificationCommunity, _subType, function(){});
        _notifyFunc(communityDetailsView, notification);
    };

    function _onUpdateCommunityInfoNotify(communityDetailsView,notification){
        if(communityDetailsView == null || typeof communityDetailsView != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO){
            return;
        }
        var _communityInfo = notification.getUpdatedCommunityInfo();
        var _updateRoomId = _communityInfo.getRoomId();
        if(_updateRoomId != communityDetailsView._communityId){
            return;
        }
        function _callback(){
        };
        communityDetailsView._asyncShowDetails(_callback);
    };

    function _onUpdateOwnerNotify(communityDetailsView,notification){
        if(communityDetailsView == null || typeof communityDetailsView != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        if(notification.getSubType() != CommunityNotification.SUB_TYPE_UPDATE_OWNER){
            return;
        }
        var _updateRoomId = notification.getRoomId();
        if(_updateRoomId != communityDetailsView._communityId){
            return;
        }
        var _ownerListElem = communityDetailsView._getUserNameListElement(notification.getOwnerList());
        if(_ownerListElem !== null && _ownerListElem !== ''){
            $(".community-owner-list").empty().append(_ownerListElem);
        }
        communityDetailsView._createConfToolTipDom(_onCreateConfToolTipDom);
        function _onCreateConfToolTipDom(toolTipObj) {
            if (!toolTipObj) {
                return;
            }
        }
    }

    _proto._asyncShowDetails = function(callbackFunc) {
        var _self = this;
        var _communityId = _self._communityId;
        if(_communityId == null || _communityId == ''){
            return;
        }

        _self.setCommunityDetailData(_communityId);
    };

    _proto._createDetailsDom = function(communityInfo) {
        var _self = this;
        if(communityInfo == null || typeof communityInfo != 'object'){
            return Resource.getMessage('not_referable_community');
        }
        var _privacyType = communityInfo.getPrivacyType();
        var _memberEntryType = communityInfo.getMemberEntryType();
        var _description = communityInfo.getDescription();
        _privacyType = ViewUtils.communityPrivacyTypeNumToStr(_privacyType);
        _memberEntryType = ViewUtils.communityMemberEntryTypeNumToStr(_memberEntryType);
        _description = Utils.convertEscapedHtml(_description, true);
        var _ownerList = communityInfo.getOwnerList();
        var _ownerListElem = '';
        if(_ownerList.getCount() == 0){
            var _callback = function(_info){
                if(_info == null){
                    return;
                }
                _ownerListElem = _self._getUserNameListElement(_info.getOwnerList());
                $(".community-owner-list").empty().append(_ownerListElem);
            };
            var _roomId = communityInfo.getRoomId();
            CubeeController.getInstance().getCommunityMemberInfo(_roomId, _callback);
        }else{
            _ownerListElem = _self._getUserNameListElement(communityInfo.getOwnerList());
        }

        var _ret = '';
        _ret += '<div class="table">';
        _ret += '  <div class="table_rh communuty-propaty">' + Resource.getMessage('community_privacy') + ':</div>';
        _ret += '  <div class="table_d">' + _privacyType + '</div>';
        _ret += '</div>';
        _ret += '<div class="table">';
        _ret += '  <div class="table_rh communuty-propaty">' + Resource.getMessage('community_member_entry_type') + ':</div>';
        _ret += '  <div class="table_d">' + _memberEntryType + '</div>';
        _ret += '</div>';
        _ret += '<div class="table">';
        _ret += '  <div class="table_rh communuty-propaty">' + Resource.getMessage('community_detail_label_owner') + ':</div>';
        _ret += '</div>';
        _ret += '<div class="table">';
        _ret += '  <div class="table_d word-break-all community-owner-list">' + _ownerListElem +'</div>';
        _ret += '</div>';
        _ret += '<div class="table">';
        _ret += '  <div class="table_rh communuty-propaty">' + Resource.getMessage('community_description') + ':</div>';
        _ret += '</div>';
        _ret += '<div class="table">';
        _ret += '  <div class="table_d word-break-all">' + _description +'</div>';
        _ret += '</div>';
        _ret = $(_ret);
        return _ret;
    };

    _proto.updateDetails = function() {
        var _self = this;
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
        var _headerElm = _rootElm._headerElm;
        var _parentHeight = _parent.outerHeight(true);
        var _headerElmHeight = 0;
        if(_headerElm != null){
            var _startChatFormElm = _startChatFormObj.getHtmlElement();
            if(_headerElm.is(':visible')){
                _headerElmHeight = _headerElm.outerHeight(true)
            }
        }
        var _contentsHeight = _parentHeight - _headerElmHeight;
        _rootElm.height(_contentsHeight);
    };

    _proto._getUserNameListElement = function(memberList){
        if(memberList == null || memberList.getCount() === 0){
            return '';
        }

        var _self = this;
        var _resultElem = '<ul class="community-detail-owner-list">';
        _resultElem += '</ul>';

        var _onGetCommunityMemberInfo = function(communityInfo){
            if(!communityInfo){
                return;
            }
            _createHtml(communityInfo.getOwnerList());
        };
        var _createHtml = function(communityMemberList){
            var _count = communityMemberList.getCount();
            for(var i=0; i<_count; i++){
                var _person = communityMemberList.get(i);
                var _jid = _person.getJid();
                if(_jid == null || _jid === ''){
                    continue;
                }
                var _nickName = _person.getUserName();
                var _accountName = _person.getLoginAccount();
                var _title = Utils.convertEscapedTag(_nickName) +' @' + Utils.convertEscapedTag(_accountName);

                _self.getHtmlElement().find('.community-detail-owner-list').append('<li class="community-detail-owner" title="' + _title + '">' + Utils.convertEscapedHtml(_nickName) +
                    '<span class="sender-account">@' + Utils.convertEscapedHtml(_accountName) + '</span>' +
                '</li>');
            }
        };

        if(memberList instanceof CommunityMemberList){
            setTimeout(function(){_createHtml(memberList);},1);
        }else{
            CubeeController.getInstance().getCommunityMemberInfo(this._communityId, _onGetCommunityMemberInfo);
        }

        return _resultElem;
    };

    _proto.getCommunityMemberList = function(_communityId){
        return new Promise(function(resolve, reject){
            function callback(communityInfo){
                if(communityInfo == null){
                    reject();
                    return;
                }
                var _personsArray = new Array();
                var _ownerList = communityInfo.getOwnerList();
                var _ownerCount = _ownerList.getCount();
                var _generalMemberList = communityInfo.getGeneralMemberList();
                var _generalMemberCount = _generalMemberList.getCount();
                for(var _i = 0; _i < _ownerCount; _i++) {
                    var _ownerPerson = _ownerList.get(_i);
                    _ownerPerson._role = 2;
                    _personsArray.push(_ownerPerson);
                }
                for(var _i = 0; _i < _generalMemberCount; _i++) {
                    var _generalPerson = _generalMemberList.get(_i);
                    _generalPerson._role = 1;
                    _personsArray.push(_generalPerson);
                }
                resolve(_personsArray);
            }
             CubeeController.getInstance().getCommunityMemberInfo(_communityId, callback);
        })
    }

    _proto.setOwners = function(owners){

        $.each(owners, function(i, owner){
            let _nickName = Utils.getSafeStringData(owner._profile._nickName);
            _nickName = Utils.convertEscapedHtml(_nickName) + ViewUtils.getUserStatusString(owner._profile._status);
            let _avatarType = owner._profile._avatarType;
            let _avaterDate = owner._profile._avatarData;
            let _account = "@"+owner._profile._loginAccount;
            let avatar = ViewUtils.getAvatarDataHtmlFromPerson(owner);
            const ownerHtml = "<li title='"+ _nickName+" "+Utils.convertEscapedHtml(_account)+"'>\
                <span class='ico ico_user status'></span>\
                <span class='name'>" + _nickName + "</span>\
                <span class='group'></span>\
                </li>";
            let query = $(ownerHtml);
            let content = $("#community_detail_owner_info").append(query);

            query.find('.ico_user').append(avatar);
            query.find('.status').addClass(ViewUtils.getPresenceColorCss(owner.getPresence()));
            query.find(".group").text(_account).html();
        });
    };

    _proto.setMembers= function(members){

        let me = LoginUser.getInstance();

        $.each(members, function(i, member){
            let _nickName = Utils.getSafeStringData(member._profile._nickName);
            _nickName = Utils.convertEscapedHtml(_nickName) + ViewUtils.getUserStatusString(member._profile._status);
            let _avatarType = member._profile._avatarType;
            let _avaterDate = member._profile._avatarData;
            let _account = "@"+member._profile._loginAccount;
            let avatar = ViewUtils.getAvatarDataHtmlFromPerson(member);
            const memberHetml = "<li class='project_member' title='"+ _nickName+" "+Utils.convertEscapedHtml(_account)+"'>\
               <a>\
               <span class='ico ico_user status'></span>\
               <span class='name'>"+_nickName+"</span>\
               <span class='group'></span>\
               </a>\
               </li>";
            let query = $(memberHetml);
            let content = $("#community_detail_member_list").append(query);

            let _selectedJid = member.getJid();
            var _cachedUser = CubeeController.getInstance().getPersonData(_selectedJid);
            query.find('.ico_user').append(avatar);
            query.find('.status').addClass(ViewUtils.getPresenceColorCss(_cachedUser ? _cachedUser.getPresence() : member.getPresence()));
            query.find(".group").text(_account).html();
            if(_selectedJid !== me.getJid()){
                query.on('click', function () {
                    ColumnManager.getInstance().addChatColumn(_selectedJid, true, true);
                });
            }
        });
    };

    _proto.setCommunityDetailData = function(_communityId){
        var _self = this;
        if(_communityId == null || _communityId == ''){
            return;
        }
        $('#project_scroll_area').scrollTop(0);
        _self.personCount = 0;
        _self.allPersons = [];
        $("#community_detail_owner_info").empty();
        $("#community_detail_member_list").empty();

        CubeeController.getInstance().getCommunityInfo(_communityId, function(communityInfo){
            if(communityInfo == null){
                return;
            }
            var _privacyType = communityInfo.getPrivacyType();
            var _memberEntryType = communityInfo.getMemberEntryType();
            var _description = communityInfo.getDescription();
            _privacyType = ViewUtils.communityPrivacyTypeNumToStr(_privacyType);
            _memberEntryType = ViewUtils.communityMemberEntryTypeNumToStr(_memberEntryType);
            _description = Utils.convertEscapedHtml(_description, true);

            $("#community_detail_publishing_setting").html(_privacyType);
            $("#community_detail_account_type").html(_memberEntryType);
            $("#community_detail_community_description").html(_description);

            _proto.getCommunityMemberList(_self._communityId).then(function(persons){
                let me = LoginUser.getInstance();
                persons.forEach(person => {
                    if(person._jid === me.getJid()){
                        let _removeMemverElement = ''
                        if(communityInfo.getPrivacyType() == CommunityInfo.PRIVACY_TYPE_ITEM_OPEN){
                            _removeMemverElement =
                                '<li><a class="txt_btn_project" data-modal="community_withdraw_member_modal">'
                                + Resource.getMessage('conf_community_withdraw_member_tooltip')
                                +'</a></li>'
                        }
                        if(person._role === 2){
                            $('.project_detail_menu').find('ul.popup_list').replaceWith($('<ul class="popup_list"><li><a class="txt_btn_project" data-modal="addprojectmember_modal">'+Resource.getMessage('conf_community_add_member_tooltip')+'</a></li>\
                                <li><a class="txt_btn_project" data-modal="removeprojectmember_modal">'+Resource.getMessage('conf_community_leave_member_tooltip')+'</a></li>\
                                <li><a class="txt_btn_project" data-modal="projectauthority_modal">'+Resource.getMessage('conf_community_change_owner_tooltip')+'</a></li>\
                                <li><a class="txt_btn_project" data-modal="settingproject_modal">'+Resource.getMessage('conf_community_setting_tooltip')+'</a></li>'
                                                                                        + _removeMemverElement +'</ul>'));
                        }else{
                            $('.project_detail_menu').find('ul.popup_list').replaceWith($('<ul class="popup_list"><li><a class="txt_btn_project" data-modal="projectconfirmauthority_modal">'+Resource.getMessage('conf_confirm_authority_tooltip')+'</a></li>'+ _removeMemverElement +'</ul>'));
                        }
                        $('.txt_btn_project').off('click');
                        let dialog;
                        $(".txt_btn_project").on('click', function () {
                            let modal_name = $(this).data('modal');
                            if(modal_name === "addprojectmember_modal"){
                                dialog = new DialogSelectCommunityAddMemberView(_communityId);
                            }else if(modal_name === "removeprojectmember_modal"){
                                dialog = new DialogSelectCommunityForceLeaveMemberView(_communityId);
                            }else if(modal_name === "projectauthority_modal"){
                                dialog = new DialogSelectCommunityChangeAuthorityMemberView(_communityId);
                            }else if(modal_name === "settingproject_modal"){
                                dialog = new DialogSettingCommunityView(_communityId);
                            }else if(modal_name === "projectconfirmauthority_modal"){
                                dialog = new DialogSelectCommunityConfirmAuthorityMemberView(_communityId);
                            }else if(modal_name === "community_withdraw_member_modal"){
                                dialog = new DialogProjectUnsubscribeCheckView(_communityId);
                            }
                            dialog ? dialog.showDialog() : '';
                        });
                    }
                });

                _self.allPersons = persons;
                _self.addPersons(_communityId);

                var project_scroll_area = $('#project_scroll_area');
                var exist_scroll = project_scroll_area.get(0) ? project_scroll_area.get(0).scrollHeight > project_scroll_area.innerHeight() : false;
                while (!exist_scroll) {
                    if (_self.personCount >= _self.allPersons.length) {
                        break;
                    }
                    _self.addPersons(_communityId);
                    exist_scroll = project_scroll_area.get(0) ? project_scroll_area.get(0).scrollHeight > project_scroll_area.innerHeight() : false;
                }

            }).catch(function(err){
               return;
            });;
        });
    };

    _proto.addPersons = function(_communityId){
        const COUNT = Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST');
        let _self = this;
        let persons = [];
        for (var i = _self.personCount; i < Math.min(_self.personCount+COUNT, _self.allPersons.length); i++) {
              persons.push(_self.allPersons[i]);
        }

        _self.personCount+=persons.length;
        let owners = [];
        let members = [];

        $.each(persons, function(i, person){
            if(person._role === 2){
                owners.push(person);
            }

            members.push(person);
        });

        _self.setOwners(owners);
        _self.setMembers(members);
    };

})();
