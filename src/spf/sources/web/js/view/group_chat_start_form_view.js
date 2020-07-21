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

function GroupChatStartFormView(htmlElement, parent) {
    if (!htmlElement || typeof htmlElement != 'object') {
        this._htmlElement = null;
    } else {
        this._htmlElement = htmlElement;
        this._createEventHandler();
    }
    if (!parent || typeof parent != 'object') {
        this._parent = null;
    } else {
        this._parent = parent;
    }
    this._chatroomInfo = null;
};(function() {

    GroupChatStartFormView.DEFAULT_CHAT_NAME = Resource.getMessage('default_group_chat_suffix');
    var _proto = GroupChatStartFormView.prototype;

    _proto.cleanUp = function() {
        var _self = this;
        var _rootElm = _self.getHtmlElement();
        if(_rootElm){
            _rootElm.find('*').off();
            _rootElm.off();
            _rootElm.find('*').remove();
            _rootElm.remove();
        }
        _self._htmlElement = null;
        _self._parent = null;
        _self._chatroomInfo = null;
    };

    _proto._getChatRoomInfo = function() {
        return this._chatroomInfo;
    };
    _proto._setChatRoomInfo = function(chatroomInfo) {
        this._chatroomInfo = chatroomInfo;
    };
    _proto.getHtmlElement = function() {
        return this._htmlElement;
    };

    _proto._createEventHandler = function(){
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        if(!_rootElement) {
            return;
        }
        var _cancelButtonElm = _rootElement.find('.action-chatroom-form-button > button#cancel-chat');
        _cancelButtonElm.click(function() {
            _self._clickCancelButton();
        });
        var _startButtonElm = _rootElement.find('.action-chatroom-form-button > button#start-chat')
        _startButtonElm.click(function() {
            _self._clickStartButton();
        });
    };

    GroupChatStartFormView.getHtml = function() {
        var _ret = '';
        var _self = this;
        _ret += '<div class="box-border flex1 olient-vertical start-chatroom-form-border hide-view">';
        _ret += '<div class="start-chatroom-form">';
        _ret += '<div class="start-chatroom-form-item form-title">' + Resource.getMessage('group_chat_start_title') + '</div>';
        _ret += '<div class="start-chatroom-form-item form-caption">' + Resource.getMessage('group_chat_start_explain') + '</div>';
        _ret += '<div>';
        _ret += '<div class="box-border start-chatroom-form-item chatroom-name olient-horizontal width-100">';
        _ret += '<div class="start-chatroom-form-label-title">' + Resource.getMessage('group_chat_start_label_title') + '</div>';
        _ret += '<input name="room-name" class="ui-corner-all form-input-chatname" maxlength="50">';
        _ret += '</div>';
        _ret += '<div class="box-border start-chatroom-form-item olient-horizontal width-100">';
        _ret += '<div class="start-chatroom-form-label-count">' + Resource.getMessage('group_chat_start_label_selected_users') + '</div>';
        _ret += '<div class="selected-count"></div>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<div class="start-chatroom-form-item start-chatroom-form-button-center action-chatroom-form-button">';
        _ret += '<button id="start-chat" class="start-chatroom-form-btn  ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only">';
        _ret += '<span class="ui-button-text">' + Resource.getMessage('group_chat_start_label_start_button') + '</span></button>';
        _ret += '<button id="cancel-chat" class="start-chatroom-form-btn  ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only">';
        _ret += '<span class="ui-button-text">' + Resource.getMessage('group_chat_start_label_cancel_button') + '</span></button>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '</div>';

        return _ret;
    };
    _proto._clickCancelButton = function() {
        var _self = this;
        _self._parent.cancelSelectedUserListAll();
    };

    _proto._clickStartButton = function() {
        var _self = this;
        var _isInboxData = false;
        var _rootElement = _self.getHtmlElement();
        var _result = false;

        if(!_self._isValidationOk()) {
            return;
        }
        _self._setCreateChatRoomInfo();
        function onCreateChatRoomCallback(result) {
            console.log("create chatroom : " + result);
        };
        if(CubeeController.getInstance().createChatRoom(_self._getChatRoomInfo(), onCreateChatRoomCallback) == true) {
            _self._clickCancelButton();
        } else {
            console.log("faild to create chatroom");
        }
    };

    _proto._setCreateChatRoomInfo = function() {
        var _self = this;
        var _chatroomInfo = new ChatRoomInformation();
        var _rootElement = _self.getHtmlElement();
        var _selectedUserList = _self._parent.getSelectedUserList();
        var _loginUserJid = LoginUser.getInstance().getJid();

        var _chatRoomNameInputElem = _rootElement.find('.chatroom-name > input');
        _chatroomInfo.setRoomName(_chatRoomNameInputElem.val());

        var _selectedCount = _selectedUserList.getCount();
        for (var _i = 0; _i < _selectedCount; _i++) {
            _chatroomInfo.addMemberList(_selectedUserList.get(_i));
        }
        _chatroomInfo.addMemberList(_loginUserJid);
        _chatroomInfo.setCreatedBy(_loginUserJid);
        _self._setChatRoomInfo(_chatroomInfo);
    };

    _proto.showStartForm = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _self._setRoomName();
        _self.updateSelectedCount();
        _rootElement.show('slow', function() {
            groupchatStartFormShowCallback();
        });
    };

    _proto.hideStartForm = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.hide('slow', function() {
            groupchatStartFormShowCallback();
        });
    };
    function groupchatStartFormShowCallback() {
        SideListView.getInstance().resizeContents();
    };
    _proto._setRoomName = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _roomNameElment = _rootElement.find('.chatroom-name > input');
        var _defaultName = Utils.getDate(Utils.DISPLAY_STANDARD_DATE_FORMAT);
        _defaultName += ' ' + GroupChatStartFormView.DEFAULT_CHAT_NAME;
        _roomNameElment.removeClass('input-error');
        _roomNameElment.val(_defaultName);
    };
    _proto.updateSelectedCount = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _count = _self._parent.getSelectedUserList().getCount();
        var _userCountElment = _rootElement.find('.selected-count');
        _userCountElment.html(_count + Resource.getMessage('group_chat_start_selected_users_count_suffix'));
    };
    _proto._isValidationOk = function() {
        var _self = this;
        var _ret = true;
        var _rootElement = _self.getHtmlElement();

        var _chatRoomNameInputElem = _rootElement.find('.chatroom-name > input');
        var _chatRoomName = _chatRoomNameInputElem.val();
        _chatRoomNameInputElem.removeClass('input-error');
        if (_chatRoomName == '' || Utils.trimStringMulutiByteSpace(_chatRoomName) == '') {
            _ret = false;
            _chatRoomNameInputElem.addClass('input-error');
        }
        return _ret;
    };

})();
