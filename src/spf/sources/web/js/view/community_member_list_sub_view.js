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

function CommunityMemberListSubView(communityId, partsType, parent) {
    ContactListSubView.call(this, partsType, parent, null);
    this._communityId = communityId;
};(function() {
    CommunityMemberListSubView.prototype = $.extend({}, ContactListSubView.prototype);
    var _super = ContactListSubView.prototype;
    var _proto = CommunityMemberListSubView.prototype;

    _proto._getInnerHtml = function() {
        var _self = this;
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _tabType = _tabInfo.type;
        var _communityId = _self.communityId;
        if (_tabType == TabItemView.TYPE_COMMUNITY) {
            var _communityId = _tabInfo.extras.communityId;
        }
        var _canCreateGroupchat = AuthorityInfo.getInstance().checkRights(AuthorityDef.AUTHORITY_ACTIONS.GC_CREATE);
        var _haveManageCommunity = AuthorityInfo.getInstance().checkRights(AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE, _communityId);
        var _ret = "";
        _ret += '<div class="subview-padding">';
        _ret += '  <div class="label aligin-top">' + Resource.getMessage('subview_label_selected_user') + '<span class="selectedUserNumber">0</span>' + Resource.getMessage('subview_label_selected_user_suffix') + '</div>';
        _ret += '  <div class="input-form">';
        _ret += '    <ul name="member-list" class="ui-widget-content ui-corner-all width-100 member-list-area"></ul>';
        _ret += '  </div>';
        _ret += '</div>';
        _ret += '<div class="ui-widget-content width-100"></div>';
        _ret += '<div class="footer-area">';
        _ret += '  <button id="btnStartChat" class="subview-action-btn chat" title="' + Resource.getMessage('subview_btn_title_start_chat') + '"></button>';
        if (_canCreateGroupchat) {
            _ret += '  <button id="btnStartGroupChat" class="subview-action-btn groupchat" title="' + Resource.getMessage('subview_btn_title_start_group_chat') + '"></button>';
        }
        if (_communityId && _haveManageCommunity) {
            _ret += '  <button id="btnAddMember" class="subview-action-btn add_member" title="' + Resource.getMessage('subview_btn_title_community_add_member') + '"></button>';
            _ret += '  <button id="btnUnsubscribeMember" class="subview-action-btn unsubscribe_member" title="' + Resource.getMessage('subview_btn_title_community_unsubscribe_member') + '"></button>';
        }
        _ret += '</div>';
        return _ret;
    };

    _proto._createEventHandler = function() {

        var _self = this;
        _self._frame.find('.ui-icon-closethick').on('click', function(){
            if(_self._parentObj && _self._parentObj.removeSelectedUserListAll){
                _self._parentObj.removeSelectedUserListAll();
            }
        });

        _self._frame.find('#btnStartChat').button({
            icons : {primary : 'ui-icon-custom-chat'}
        });
        _self._frame.find('#btnStartGroupChat').button({
            icons : {primary : 'ui-icon-custom-group-chat'}
        });
        _self._frame.find('#btnAddMember').button({
            icons : {primary : 'ui-icon-plusthick',secondary : 'ui-icon-custom-community'}
        });
        _self._frame.find('#btnUnsubscribeMember').button({
            icons : {primary : 'ui-icon-minusthick',secondary : 'ui-icon-custom-community'}
        });

        _self._frame.find(".subview-action-btn").css({"padding-left": "0px","height": "32px"});
        _self._updateFunctionButtonStatus();

        _self._frame.on('click', '#btnStartChat', _self._startChat.bind(_self));
        _self._frame.on('click', '#btnStartGroupChat', _self._startGroupChat.bind(_self));
        _self._frame.on('click', '#btnAddMember', _self._onClickAddMember.bind(_self));
        _self._frame.on('click', '#btnUnsubscribeMember', _self._onClickUnsubscribeMember.bind(_self));
    };

    _proto._updateFunctionButtonStatus = function(){
        var _self = this;
        var _selectedUserList = _self._selectedUserList;
        var _count = _selectedUserList.getCount();

        var _btnObjList = {
            '#btnStartChat' :  _count == 1,
            '#btnStartGroupChat' : _count > 0,
            '#btnAddMember': false,
            '#btnUnsubscribeMember': false
        };
        for(var key in _btnObjList){
            if(_btnObjList[key]){
                _self._frame.find(key).button('enable');
            }else{
                _self._frame.find(key).button('disable');
            }
        }
        _self._updateMemberControlButton();
    };

    _proto._updateMemberControlButton = function() {
        var _self = this;
        if (_self._communityId) {
            CubeeController.getInstance().getCommunityMemberInfo(_self._communityId, _callback);
        }
        function _callback(communityInfo) {
            if (_self._frame) {
                var _addMember = 'disable';
                var _unsubscribeMember = 'disable';
                if (communityInfo) {
                    var _loginUserJid = LoginUser.getInstance().getJid();
                    if (communityInfo.hasOwner(_loginUserJid)) {
                        _addMember = 'enable';
                        _unsubscribeMember = 'enable';
                    }
                    else if (communityInfo.hasGeneralMember(_loginUserJid)) {
                        _addMember = 'enable';
                    }
                }
                _self._frame.find('#btnAddMember').button(_addMember);
                _self._frame.find('#btnUnsubscribeMember').button(_unsubscribeMember);
            }
        };
    };

    _proto._onClickAddMember = function() {
        var _self = this;
        if(!_self._selectedUserList){
            return;
        }
        var _accountList = _getAccountList(_self._selectedUserList);
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _tabType = _tabInfo.type;
        if (_tabType == TabItemView.TYPE_COMMUNITY) {
            var _communityId = _tabInfo.extras.communityId;
            if (_communityId) {
                var _dialogSelectCommunityAddMemberView = new DialogSelectCommunityAddMemberView(_communityId);
                _dialogSelectCommunityAddMemberView.showDialog();
                _dialogSelectCommunityAddMemberView.setInputAccount(_accountList);
            }
        }
    };

    _proto._onClickUnsubscribeMember = function() {
        var _self = this;
        if(!_self._selectedUserList){
            return;
        }
        var _accountList = _getAccountList(_self._selectedUserList);
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _tabType = _tabInfo.type;
        if (_tabType == TabItemView.TYPE_COMMUNITY) {
            var _communityId = _tabInfo.extras.communityId;
            if (_communityId) {
                var _dialogCommunityForceLeaveMemberView = new DialogSelectCommunityForceLeaveMemberView(_communityId);
                _dialogCommunityForceLeaveMemberView.showDialog();
                _dialogCommunityForceLeaveMemberView.setInputAccount(_accountList);
            }
        }
    };

    function _getAccountList(selectedUserList) {
        var _accountList = [];
        var _count = selectedUserList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _obj = selectedUserList.get(_i);
            if (!_obj || !_obj._profile || !_obj._profile._loginAccount) {
                continue;
            }
            _accountList.push('@' + _obj._profile._loginAccount);
        }
        return _accountList;
    };
})();
