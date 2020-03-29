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
function ColumnGroupChatView(groupChatColumnInformation) {
    this._hasRightMessage(groupChatColumnInformation);
    ColumnView.call(this, groupChatColumnInformation);

    this._className = ColumnView.CLASS_SEL_GROUP_CHAT;
    this._idName = groupChatColumnInformation.getChatRoomInfomation().getRoomId();
    this._displayName = this._createDisplayName();
    this._memberAreaView = null;

    this.createView();

    this._showMember();
};(function() {
    ColumnGroupChatView.cssClassGroupChat = 'groupchat-message';
    if(ViewUtils.isIE89()) {
        ColumnGroupChatView.cssClassThread = 'thread-message thread-message-ie89';
    } else {
        ColumnGroupChatView.cssClassThread = 'thread-message';
    }

    ColumnGroupChatView.prototype = $.extend({}, ColumnView.prototype);
    var _super = ColumnView.prototype;
    var _proto = ColumnGroupChatView.prototype;

    _proto.cleanup = function() {
        var _self = this;
        _super.cleanup.call(_self);
        if(_self._memberAreaView){
            _self._memberAreaView.cleanup();
            delete _self._memberAreaView;
        }
    };
    _proto._showMember = function(){
        var _self = this;
        var _roomInfo = _self._info.getChatRoomInfomation();
        var _roomId = _roomInfo.getRoomId();
        _self._requestRoomInfo(_roomId, onGetRoomInfoCallBack);
        function onGetRoomInfoCallBack(roomInfo){
            if(roomInfo == null || typeof roomInfo != 'object'){
                return;
            }
            var _roomMemberList = roomInfo.getMemberList();
            _self._prependMemberArea(_roomMemberList);
            _self._info.setChatRoomInfomation(roomInfo);
            _self.onChangeRoomName(roomInfo);
        }
    };
    _proto._hasRightMessage = function(columnInformation) {
        var _ret = '';
        var _roomId = columnInformation.getChatRoomInfomation().getRoomId();
        var AuthInfo = AuthorityInfo.getInstance();
        switch(AuthInfo.getWhichRightToGroupchatResource(_roomId)) {
            case AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE:
            case AuthorityDef.AUTHORITY_ACTIONS.GC_SEND:
                columnInformation.setRightToSendMessage(true);
                columnInformation.setRightToViewMessage(true);
                break;
            case AuthorityDef.AUTHORITY_ACTIONS.GC_VIEW:
                columnInformation.setRightToSendMessage(false);
                columnInformation.setRightToViewMessage(true);
                break;
            default:
                columnInformation.setRightToSendMessage(false);
                columnInformation.setRightToViewMessage(false);
                break;
        }
        return;
    };
    _proto._prependMemberArea = function() {
        var _self = this;
        var _roomInfo = _self._info.getChatRoomInfomation();
        var _roomMemberList = _roomInfo.getMemberList();
        var _htmlString = MemberAreaView.getHtml(_roomInfo);
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _frmElm = _htmlElem.find('.wrap-frm-message');
        _frmElm.prepend(_htmlString);
        var _memberAreaElem = _frmElm.children('.' + MemberAreaView.CSS_CLS_NAME);
        _self._memberAreaView = new MemberAreaView(_memberAreaElem, _self);
        _self.resizeColumn();
        var _count = _roomMemberList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _jid = _roomMemberList.get(_i);
            _self._memberAreaView.addMessageAvatarToolTip(_jid);
            var _personData = CubeeController.getInstance().getPersonData(_jid);
            var _presence = 0;
            if (_personData != null) {
              _presence = _personData.getPresence();
            }
            var _insertAvatarElem = _memberAreaElem.children('.' + MemberAreaView.CSS_BODY_CLS_NAME).find('.block-avatar[jid=\'' + _jid + '\']');
            ViewUtils.showPresenceIcon(_insertAvatarElem, _presence, ViewUtils.STATUS_PRESENCEICON_GROUPCHAT_MEMBERLIST);
        }
        for(var _i = 0; _i < _count; _i++){
            var _jid = _roomMemberList.get(_i);
            if(LoginUser.getInstance().getJid() == _jid) {
                continue;
            }
            var contactMember = CubeeController.getInstance().getContactListData(_jid);
            if(contactMember != null) {
                continue;
            }
            var _onGetPersonDataCallback = function(result){
                if(!result || !result.get(0)){
                    return;
                }
                var _person = result.get(0);
                if (_self._memberAreaView) { 
                    _self._memberAreaView.updateAvatarPresenceByPersonData(_person);
                }
            };
            CubeeController.getInstance().getPersonDataByJidFromServer(_jid, _onGetPersonDataCallback);
        }
    };
    _proto.resizeColumn = function() {
        var _self = this;
        var _columnOuterHeightM = _self._htmlElement.outerHeight(true);
        var _columnContentMarginH = parseInt(_self._htmlElement.css('marginTop')) + parseInt(_self._htmlElement.css('marginBottom'));
        var _columnContentBorderH = parseInt(_self._htmlElement.css('borderTopWidth')) + parseInt(_self._htmlElement.css('borderBottomWidth'));
        var _columnContentPaddingH = parseInt(_self._htmlElement.css('paddingTop')) + parseInt(_self._htmlElement.css('paddingBottom'));
        var _columnHeaderOuterHeightM = _self._htmlElement.find('.column-header').outerHeight(true);
        var _columnFormOuterHeightM = _self._htmlElement.find('.wrap-frm-message').outerHeight(true);
        var _columnOuterHeightMNew = _columnOuterHeightM - _columnHeaderOuterHeightM - _columnFormOuterHeightM;
        var _columnContentHeightNew = _columnOuterHeightMNew - _columnContentMarginH - _columnContentBorderH - _columnContentPaddingH;
        _self._htmlElement.find('.column-content').css('height', _columnContentHeightNew);
    };
    _proto._requestRoomInfo = function(roomId, onGetRoomInfoCallBack){
        var _self = this;
        if(roomId == null || typeof roomId != 'string'){
            return null;
        }
        var chatroomInfo = _self.getColumnInfo().getChatRoomInfomation();
        if (chatroomInfo.getRoomId() == roomId &&
            chatroomInfo.getId() != -1 &&
            chatroomInfo.getMemberList()._length &&
            chatroomInfo.getProfileMap()._length) {
            _self._updateRoomInfo(chatroomInfo);
            onGetRoomInfoCallBack(chatroomInfo);
            return;
        }
        function _callback(roomInfo){
            if(roomInfo == null){
                _self._showNotReferableGroupChat();
                return;
            }
            _self._updateRoomInfo(roomInfo);
            onGetRoomInfoCallBack(roomInfo);
        };
        CubeeController.getInstance().getRoomInfo(roomId, _callback);
    };
    _proto._updateRoomInfo = function(roomInfo){
         var _self = this;
        if(roomInfo == null || typeof roomInfo != 'object'){
            return null;
        }
        _self._info.setChatRoomInfomation(roomInfo);
    };

    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = GroupChatColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new GroupChatColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _searchCondition = _self._info.getSearchCondition();
        var _requestCount = 20;
        CubeeController.getInstance().searchMessage(_self._currentLoadedItemId, _requestCount, _searchCondition, onGetGroupChatHistoryMessageCallback);
        function onGetGroupChatHistoryMessageCallback(resultMessageData) {
            _self._hideLoadingIconInSelf();
            if (!resultMessageData) {
                return;
            }
            var _groupchatMessageList = resultMessageData.messageDataList;
            if(!_groupchatMessageList) {
                return;
            }
            var _count = _groupchatMessageList.getCount();
            if (_count < _requestCount) {
                _self._allMessageReceived = true;
            }
            _self.onGetGroupChatHistoryMessage(_groupchatMessageList);
            $(window).trigger('resize');
            _self.refreshScrollbar();
        };
    };

    _proto.onGetGroupChatHistoryMessage = function(groupchatMessageList) {
        var _self = this;
        if (!groupchatMessageList) {
            return;
        }
        var _count = groupchatMessageList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _groupchatMessage = groupchatMessageList.get(_i);
            if (_groupchatMessage == null) {
                continue;
            }
            var _itemId = _groupchatMessage.getItemId();
            if (!_self.getMsgObjByItemId(_itemId)) {
                _self.showHistoryMessage(_groupchatMessage);
            }
        }
    };
    _proto.createMessageObjectOnly = function(message) {
        var _self = this;
        if (!message || typeof message != 'object') {
            return;
        }
        var _type = message.getType();
        var _msgObj = null;
        switch(_type) {
            case Message.TYPE_GROUP_CHAT:
                _msgObj = new ColumnGroupChatMessageView(_self, message);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                _msgObj = new ColumnQuestionnaireMessageView(_self, message);
                break;
            default:
                console.log('ColumnGroupChatView::createMessageObjectOnly _ invalid type:' + _type);
                break;
        }
        return _msgObj;
    };
    _proto.getColumnMessageHtml = function (messageObj, replyFlag) {
        var ret = '';
        if(!messageObj || typeof messageObj != 'object') {
            return ret;
        }
        if (replyFlag == null) {
            replyFlag = false;
        }
        ret = messageObj.getMessageHtml(replyFlag);
        return ret;
    };

    _proto._createDisplayName = function() {
        var _self = this;
        return _self.getColumnInfo().getChatRoomInfomation().getRoomName();
    };

    _proto.showHistoryMessage = function(msg) {
        var _self = this;
        _self._showHistoryMessageWithThread(msg);
    };

    _proto.clickSubFormButton = function() {
        var _self = this;
        _self.sendGroupChatMessage();
    };
    _proto.sendGroupChatMessage = function() {
        var _self = this;
        var _textTitleArea = _self._textTitleArea.getText().trim();
        function cleanTextArea() {
            _self._textarea.clearText();
            _self._textTitleArea.clearText();
            if (_self._fileUpload != undefined) {
                if (_self._fileUpload != null) {
                    _self._fileUpload.clearFileUpload();
                }
            }
            if (_self.getHtmlElement().find('.attach-note-element p').attr('value')) {
                _self.getHtmlElement().find('.attach-note-element p').remove();
                _self.getHtmlElement().find('.attach-note-element .note_cancel_btn').remove();
            }
            if (_self.getHtmlElement().find('.message-attachment-area').is(':visible')) {
                _self.getHtmlElement().find('.message-attachment-area').slideToggle(200, function(){
                    $(window).trigger('resize');
                });
            }
        }
        function assignNoteForMessage(result) {
            var _noteArea = _self.getHtmlElement().find('.attach-note-element p').attr('value');
            if (_noteArea) {
                if (result.content && result.content.result) {
                    if (result.content.items && result.content.items.length) {
                        var item = result.content.items[0];
                        var interval_time = 200;
                        var timeout = 10000;
                        var set_interval_id = setInterval(waitGetNotification, interval_time);
                        var interval_cnt = 0;
                        function waitGetNotification() {
                            if (CubeeController.getInstance()._messageManager.getAllMessage().getByItemId(item.itemId)) {
                                clearInterval(set_interval_id);
                                CodiMdController.getInstance().assignNoteOnThreadRootId(item.itemId, _noteArea)
                                .then(function(result){
                                    cleanTextArea();
                                    return;
                                }).catch(function(err){
                                    var _title   = Resource.getMessage('dialog_title_system_info');
                                    var _message = Resource.getMessage('dialog_error_assign_note_after_try');
                                    var _dialog = new DialogCloseView(_title, _message);
                                    _dialog.showDialog();
                                    return;
                                });
                            } else {
                                interval_cnt += 1;
                                if (interval_time * interval_cnt > timeout) {
                                    clearInterval(set_interval_id);
                                    var _title   = Resource.getMessage('dialog_title_system_info');
                                    var _message = Resource.getMessage('dialog_error_assign_note_after_try');
                                    var _dialog = new DialogCloseView(_title, _message);
                                    _dialog.showDialog();
                                }
                            }
                        }
                    }
                } else {
                    var _title   = Resource.getMessage('dialog_title_system_info');
                    var _message = Resource.getMessage('dialog_error_send_message');
                    var _dialog = new DialogCloseView(_title, _message);
                    _dialog.showDialog();
                    return;
                }
            } else {
                cleanTextArea();
            }
        }
        function _sendGroupChatMessage(message) {
            var _groupChatMessage = new GroupChatMessage();
            _groupChatMessage.setFrom(LoginUser.getInstance().getJid());
            var _roomInfo = _self._info.getChatRoomInfomation();
            var _roomId = _roomInfo.getRoomId();
            _groupChatMessage.setTo(_roomId);
            _groupChatMessage.setMessage(message);
            _groupChatMessage.setDirection(ChatMessage.DIRECTION_SEND);
            _groupChatMessage.setThreadTitle(_textTitleArea);
            if (CubeeController.getInstance().sendGroupChatMessage(_groupChatMessage, assignNoteForMessage) == false) {
                console.log("faild to send Group Chat");
                var _title   = Resource.getMessage('dialog_title_system_info');
                var _message = Resource.getMessage('dialog_error_send_message');
                var _dialog = new DialogCloseView(_title, _message);
                _dialog.showDialog();
            }
        };
        var _text = _self._textarea.getText();
        var retflag = _self._uploadFileAndSendMessage(_text, _sendGroupChatMessage, _textTitleArea);
        _self._textarea.clearTextFromFlag(retflag);
    };

    _proto._showMessageData = function(msg) {
        var _self = this;
        return _self._showMessageDataWithThread(msg);
    };

    _proto.onAddMember = function(addedMemberList) {
        var _self = this;
        if(_self._memberAreaView == null) {
            return;
        }
        var _curRoomInfo = _self._info.getChatRoomInfomation();
        var _curMemberList = _curRoomInfo.getMemberList();
        var _addMemberCount = addedMemberList.getCount();
        var _viewManagedProfileMap = _curRoomInfo.getProfileMap();
        var _controllerManagedRoomInfo = CubeeController.getInstance().getChatRoomInfoByRoomId(_curRoomInfo.getRoomId());
        let _checkAddJid = [];
        for(let j=0;j<_curMemberList._array.length;j++){
            _checkAddJid.push(_curMemberList._array[j])
        }
        for(var _i = 0; _i < _addMemberCount; _i++){
            var _addMemberJid = addedMemberList.get(_i);
            if(_checkAddJid.indexOf(_addMemberJid) >= 0){
                continue;
            }
            _checkAddJid.push(_addMemberJid)
            _curMemberList.add(_addMemberJid);
            if(_controllerManagedRoomInfo){
                var _profile = _controllerManagedRoomInfo.getProfileMap().getByKey(_addMemberJid);
                if(_profile){
                    _viewManagedProfileMap.add(_addMemberJid, _profile);
                }
                var _person = ViewUtils.createPersonByProfile(_addMemberJid, _profile);
                _self._memberAreaView.onAddMember(_person);
            }
        }
    };

    _proto.onRemoveMember = function(removedMemberList) {
        var _self = this;
        if(_self._memberAreaView === null) {
            return;
        }
        var _curRoomInfo = _self._info.getChatRoomInfomation();
        var _curMemberList = _curRoomInfo.getMemberList();
        var _curMemberListCount = _curMemberList.getCount();
        var _removedMemberCount = removedMemberList.getCount();
        var _viewManagedProfileMap = _curRoomInfo.getProfileMap();
        for(var _i = 0; _i < _removedMemberCount; _i++){
            var _removeMemberJid = removedMemberList.get(_i);
            _viewManagedProfileMap.removeByKey(_removeMemberJid);
            for(var _j = 0; _j < _curMemberListCount; _j++){
                if(_removeMemberJid == _curMemberList.get(_j)){
                    _curMemberList.remove(_j);
                    _self._memberAreaView.onRemoveMember(_removeMemberJid);
                    break;
                }
            }
        }
    };

    _proto.notifyRemoveMember = function(notification) {
        var _self = this;
        var _removedMemberList = notification.getRemovedMemberList();
        if(_removedMemberList == null){
            return;
        }
        var _loginUserJid = LoginUser.getInstance().getJid();
        var _isContainLoginUser = false;
        var _count = _removedMemberList.getCount();
        for(_j = 0; _j < _count; _j++) {
            if(_loginUserJid == _removedMemberList.get(_j)) {
                _isContainLoginUser = true;
                break;
            }
        }
        if(!_isContainLoginUser){
            return;
        }
        var _notificationRoomId = notification.getRoomInfo().getRoomId();
        var _roomInfo = _self._info.getChatRoomInfomation();
        var _roomId = _roomInfo.getRoomId();
        var _tmpRoomInfo = new ChatRoomInformation();
        _tmpRoomInfo.setRoomName(Resource.getMessage("NotReferableColumnTitle"));
        if(_roomId == _notificationRoomId) {
            _self._showNotReferableGroupChat();
        }
    };
    _proto._showNotReferableGroupChat = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        if(_selfElm){
            var _hash = _self._getMsgObjHash();
            for (var key in _hash) {
                _hash[key].cleanup();
                delete _hash[key];
            }
            $("div.column-content", _selfElm).empty();
            var _systemMessageElement = _self.createDivMessageBorder(ColumnSystemMessageView.getNotReferableMessageHtml(Resource.getMessage('not_referable_groupchat')));
            $("div.column-header div.column-option", _selfElm).hide()
            $("div.column-content", _selfElm).prepend(_systemMessageElement);
        }
    };
    _proto.showChangedAuthorityMessage = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        if(_selfElm){
            $("div.column-content", _selfElm).prepend(_self.createDivMessageBorder(ColumnSystemMessageView.getNotReferableMessageHtml(Resource.getMessage('authchanged_force_reload_groupchat'))));
        }
    };

    _proto.onChangeRoomName = function(roomInfo) {
        var _self = this;
        var _curRoomInfo = _self._info.getChatRoomInfomation();
        _curRoomInfo.setRoomName(roomInfo.getRoomName());
        _self._displayName = _self._createDisplayName();
        _self._info.setDisplayName(_self._displayName);
        var result = Utils.avatarCreate({name: roomInfo.getRoomName(), type: 'group'});
        _super.updateColumnTitle.call(_self, result.color);
        ColumnManager.getInstance().saveColumnList();
    };
    _proto.onChangeGroupChatPrivacyType = function(roomInfo) {
        var _self = this;
        var _curRoomInfo = _self._info.getChatRoomInfomation();
        _curRoomInfo.setPrivacyType(roomInfo.getPrivacyType());
    };
    _proto.onAddMessageReceive = function(questionnaireMessage) {
        var _self = this;
        if(questionnaireMessage == null || questionnaireMessage.getType() != Message.TYPE_QUESTIONNAIRE) {
            return;
        }
        _self.showMessage(questionnaireMessage);
    };
})();
