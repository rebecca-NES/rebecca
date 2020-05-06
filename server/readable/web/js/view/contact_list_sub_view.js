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

function ContactListSubView(partsType, parent, bFavoriteButton) {
    this._size = {
        'width': 300,
        'height': 150
    };
    var _pos = {
        width:300
    };
    SideMenuExtensionParts.call(this, partsType, parent, null, _pos);

    this._selectedUserList = new ArrayList();

    this.init();
};(function() {
    ContactListSubView.prototype = $.extend({}, SideMenuExtensionParts.prototype);
    var _super = SideMenuExtensionParts.prototype;
    var _proto = ContactListSubView.prototype;

    _proto.init = function() {
        var _self = this;
        _super.init.call(_self);
        return _self;
    };
    _proto.cleanUp = function(){
        var _self = this;
        _super.cleanUp();
        if(_self._frame){
            _self._frame.remove();
            _self._frame = null;
        }
        if(_self._selectedUserList){
            _self._selectedUserList = null;
        }
    };
    _proto._getInnerHtml = function() {
        var _self = this;
        var _canCreateGroupchat = AuthorityInfo.getInstance().checkRights(AuthorityDef.AUTHORITY_ACTIONS.GC_CREATE);
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
        _ret += '  <button id="btnAddContactList" class="subview-action-btn" title="' + Resource.getMessage('subview_btn_title_add_contact_list') + '"></button>';
        _ret += '  <button id="btnRemoveContactList" class="subview-action-btn" title="' + Resource.getMessage('subview_btn_title_remove_contact_list') + '"></button>';

        _ret += '  <button id="btnAddFavorite" class="subview-action-btn favorite" title="' + Resource.getMessage('subview_btn_title_add_favorite') + '"></button>';
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
        _self._frame.find('#btnAddContactList').button({
            icons : {primary : 'ui-icon-plusthick',secondary : 'ui-icon-person'}
        });
        _self._frame.find('#btnRemoveContactList').button({
            icons : {primary : 'ui-icon-minusthick',secondary : 'ui-icon-person'}
        });

        _self._frame.find('#btnAddFavorite').button({
            icons : {primary : 'ui-icon-custom-favorite'}
        });

        _self._frame.find(".subview-action-btn").css({"padding-left": "0px","height": "32px"});
        _self._updateFunctionButtonStatus();


        _self._frame.on('click', '#btnStartChat', _self._startChat.bind(_self));
        _self._frame.on('click', '#btnStartGroupChat', _self._startGroupChat.bind(_self));
        _self._frame.on('click', '#btnAddContactList', _self._addContactListMember.bind(_self));
        _self._frame.on('click', '#btnRemoveContactList', _self._removeContactListMember.bind(_self));

        _self._frame.on('click', '#btnAddFavorite', _self._addFavoriteGroupMember.bind(_self));
    };

    _proto.getSelectedUserList = function() {
        return this._selectedUserList;
    };
    _proto.addSelectedUserList = function(person) {
        if(person == null || typeof person != 'object') {
            return;
        }
        this._selectedUserList.add(person);

        return this._selectedUserList;
    };
    _proto.removeSelectedUserList = function(person) {
        if(person == null || typeof person != 'object') {
            return;
        }
        var _idx = -1;
        var _selectedUserList = this._selectedUserList;
        var _count = _selectedUserList.getCount();
        var _selectedJid = person.getJid();
        for (var _i = 0; _i < _count; _i++) {
            var _jid = _selectedUserList.get(_i).getJid();
            if (_jid == _selectedJid) {
                _idx = _i;
                break;
            }
        }
        this._selectedUserList.remove(_idx);

        return this._selectedUserList;
    };
    _proto.removeSelectedUserListAll = function() {
        this._selectedUserList.removeAll();

        return null;
    };

    _proto.receivedChangeSelectedUser = function(selectedUserList){
        var _self = this;
        _self._showSelectedUserList(selectedUserList);
        _self._updateFunctionButtonStatus();
    };
    _proto._showSelectedUserList = function(selectedUserList) {
        var _self = this;
        var _count = selectedUserList.getCount();
        var _target = _self._frame.find('ul[name="member-list"]');
        _target.empty();
        for(var i=0; i<_count; i++){
            var _person = selectedUserList.get(i);
            var _memberElement = _self._createMemberElement(_person);
            if(_memberElement == null){
                return;
            }
            _target.append(_memberElement);
        }
        _self._frame.find('.selectedUserNumber').text(_count);
    };
    _proto._createMemberElement = function(person) {
        if(person == null || typeof person != 'object'){
            return null;
        }
        var _self = this;
        var _nickName = ViewUtils.getUserNameByPerson(person);
        var _accountName = person.getLoginAccount();
        var _ret = '';
        var _jid = person.getJid();
        _ret = '<li class="selected-user-height-ie">';
        _ret += '  <span class="item text-abbreviation user-item" ></span>';
        _ret += '  <span class="cancel"><img src="images/add_close.png" class="user-cancel-icon"></span>';
        _ret += '</li>';
        _ret = $(_ret);
        var _displayStr = _nickName + '@' + _accountName;
        _ret.children('span.item').attr('jid', _jid);
        _ret.children('span.item').attr('title', _displayStr);
        _ret.children('span.item').text(_displayStr);
        _ret.children('span.cancel').children().on('click', function(){
            if(_self._parentObj && _self._parentObj.removeSelectedUserList){
                _self._parentObj.removeSelectedUserList(person);
            }
        });
        return _ret;
    };
    _proto._updateFunctionButtonStatus = function(){
        var _self = this;
        var _selectedUserList = _self._selectedUserList;
        var _count = _selectedUserList.getCount();

        var _enabledStatus = _isEnabled();
        var _isAddContactListEnabled = _enabledStatus.add;
        var _isRemoveContactListEnabled = _enabledStatus.remove;

        var _isAddFavoriteEnabled = _enabledStatus.remove;      

        function _isEnabled(){
            var _addOk = false;
            var _removeOK = false;
            if(_count > 0) {
                _addOk = true;
                _removeOK = true;
                for(var i=0; i<_count; i++){
                    var _jid = _selectedUserList.get(i).getJid();
                    var _isMember = CubeeController.getInstance().isContactListMember(_jid);
                    if(_isMember){
                        _addOk = false;
                    }else{
                        _removeOK = false;
                    }
                }
            }
            return {
                add: _addOk,
                remove: _removeOK
            };
        }

        var _btnObjList = {
            '#btnStartChat' :  _count == 1,
            '#btnStartGroupChat' : _count > 0,
            '#btnAddContactList' : _isAddContactListEnabled,
            '#btnRemoveContactList' : _isRemoveContactListEnabled,

            '#btnAddFavorite' : _isRemoveContactListEnabled      
        };
        for(var key in _btnObjList){
            if(_btnObjList[key]){
                $(key).button('enable');
            }else{
                $(key).button('disable');
            }
        }
    };

    _proto._startChat = function(){
        var _self = this;
        var _selectedUserList = _self._selectedUserList;
        if(_selectedUserList.getCount() != 1){
            return;
        }
        var _selectedJid = _selectedUserList.get(0).getJid();
        var _columnInformation = new ColumnInformation();
        _columnInformation.setColumnType(ColumnInformation.TYPE_COLUMN_CHAT);
        _columnInformation.setFilterCondition(_selectedJid);
        ColumnManager.getInstance().addColumn(_columnInformation, true, true);

        if(_self._parentObj && _self._parentObj.removeSelectedUserListAll){
            _self._parentObj.removeSelectedUserListAll();
        }
    };
    _proto._startGroupChat = function(){
        var _self = this;
        var _afterCreateGCCallback = function(){
            if(_self._parentObj && _self._parentObj.removeSelectedUserListAll){
                _self._parentObj.removeSelectedUserListAll();
            }
        };
        LayoutManager.switchToColumn();

        var _jidList = new ArrayList();
        var _count = _self._selectedUserList.getCount();
        for(var i=0; i<_count; i++){
            var _obj = _self._selectedUserList.get(i);
            if(_obj == null){
                continue;
            }
            _jidList.add(_obj.getJid());
        }
        var _createGroupChatDialog = new DialogChatRoomCreateRoomInfoView(Resource.getMessage('dialog_title_create_groupchat'), _jidList, _afterCreateGCCallback);
    };
    _proto._addContactListMember = function(){
        var _self = this;
        if(!_self._selectedUserList){
            return;
        }
        var _count = _self._selectedUserList.getCount();
        var _addContactListMember = new ArrayList();
        for(var i=0; i<_count; i++){
            var _obj = _self._selectedUserList.get(i);
            if(_obj == null){
                continue;
            }
            var _addUser = {
                jid: _obj.getJid(),
                contactListGroup: ''
            };
            _addContactListMember.add(_addUser);
        }
        var _onAddContactListMemberCallback = function(result, reason){
            if(result && _self._parentObj && _self._parentObj.onAddContactListMemberSuccessCallback){
                _self._parentObj.onAddContactListMemberSuccessCallback(result);
            }
        };
        var ret = CubeeController.getInstance().addContactListMember(_addContactListMember, _onAddContactListMemberCallback);
        if(ret){
        }
    };
    _proto._removeContactListMember = function(){
        var _self = this;
        if(!_self._selectedUserList){
            return;
        }

        var _message = Resource.getMessage('dialog_delete_conf_message_for_contactlist');
        var _okCallback = function(){
            var _count = _self._selectedUserList.getCount();
            var _removeContactListMember = new ArrayList();
            for(var i=0; i<_count; i++){
                var _obj = _self._selectedUserList.get(i);
                if(_obj == null){
                    continue;
                }
                var _removeUser = {
                    jid: _obj.getJid()
                };
                _removeContactListMember.add(_removeUser);
            }
            var _onRemoveContactListMemberCallback = function(result, reason){
                if(result && _self._parentObj && _self._parentObj.onRemoveContactListMemberSuccessCallback){
                    _self._parentObj.onRemoveContactListMemberSuccessCallback(result);
                }
            };
            var ret = CubeeController.getInstance().removeContactListMember(_removeContactListMember, _onRemoveContactListMemberCallback);
            if(ret){
            }
        };

        LayoutManager.switchToColumn();

        new MessageBox(_message, _okCallback, true, false, false, _self._size);
    };

    _proto._addFavoriteGroupMember = function() {
        var _self = this;

        LayoutManager.switchToColumn();

        var _jidList = new ArrayList();
        var _count = _self._selectedUserList.getCount();
        for(var i = 0; i < _count; i++){
            var _obj = _self._selectedUserList.get(i);
            if(_obj == null){
                continue;
            }
            _jidList.add(_obj.getJid());
        }
        var _createFavoriteGroupDialog = new DialogFavoriteGroupView(Resource.getMessage('dialog_title_add_favorite'), _jidList, favoriteDialogCallback);

        function favoriteDialogCallback(favoriteId){
            if(_self._parentObj && _self._parentObj.onAddFavoriteMemberSuccessCallback){
                _self._parentObj.onAddFavoriteMemberSuccessCallback(favoriteId, FavoriteStore.getInstance().getGroupMember(favoriteId));
            }
            if(_self._parentObj && _self._parentObj.removeSelectedUserListAll){
                _self._parentObj.removeSelectedUserListAll();
            }
        }
    };


})();

function ContactListAccordion() {
    AccordionView.call(this);
};(function() {
    ContactListAccordion.prototype = $.extend({}, AccordionView.prototype);
    var _super = AccordionView.prototype;
    var _proto = ContactListAccordion.prototype;
    $(function() {
        $('#contactList').accordion({
            header : '> div > div > h3',
            fillSpace : true,
            collapsible : true
        }).sortable({
            axis : 'y',
            handle : 'h3',
            stop : function(event, ui) {
                ui.item.children('h3').triggerHandler('focusout');
            }
        });
    });
})();

function ContactListGroup() {
};(function() {
})();

function ContactListGroupMember() {
};(function() {
    $(function() {
        $('#contactList div.block-avatar').selectable();
    });
})();

function ContactListGroupMemberAvatar() {
    AvatarView.call(this);
};(function() {
    ContactListGroupMemberAvatar.prototype = $.extend({}, AvatarView.prototype);
    var _super = AvatarView.prototype;
    var _proto = ContactListGroupMemberAvatar.prototype;
})();

function ContactListGroupMemberAvatarTooltip() {
    TooltipView.call(this);
};(function() {
    ContactListGroupMemberAvatarTooltip.prototype = $.extend({}, TooltipView.prototype);
    var _super = TooltipView.prototype;
    var _proto = ContactListGroupMemberAvatarTooltip.prototype;
})();
