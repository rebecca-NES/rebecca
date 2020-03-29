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
function ColumnChatView(columnInformation) {
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_CHAT;
    this._displayName = this._createDisplayName(null);
    this.createView();

    this.partnerJid = columnInformation.getFilterCondition();

    var _person = CubeeController.getInstance().getContactListData(this.partnerJid);
    var _avatarSrc = ViewUtils.getAvatarUrl(_person);
    columnInformation.setIconImage(_avatarSrc);
};(function() {
    ColumnChatView.cssClass = 'chat-message';

    ColumnChatView.prototype = $.extend({}, ColumnView.prototype);
    var _super = ColumnView.prototype;
    var _proto = ColumnChatView.prototype;

    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _requestCount = 20;
        CubeeController.getInstance().getChatMessages(_self._currentLoadedItemId, _requestCount, _columnInfo.getFilterCondition(), onGetChatHistoryMessage);
        function onGetChatHistoryMessage(chatMessageList) {
            _self._hideLoadingIconInSelf();
            if (!chatMessageList) {
                return;
            }
            var _count = chatMessageList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                var _chatMessage = chatMessageList.get(_i);
                if (_chatMessage == null) {
                    continue;
                }
                var _itemId = _chatMessage.getItemId();
                if (!_self.getMsgObjByItemId(_itemId)) {
                    _self.showHistoryMessage(_chatMessage);
                }
            }
            if (_count < _requestCount) {
                _self._allMessageReceived = true;
            }
            _self._updateColumnTitleAndColumnIcon(_self.partnerJid);
            _self.refreshScrollbar();
        }
    };
    _proto.clickSubFormButton = function() {
        var _self = this;
        var _jid = _self._info.getFilterCondition();
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
                }
            } else {
                cleanTextArea();
            }
        }
        function _sendChatMessage(message) {
            var _chatMessage = new ChatMessage();
            _chatMessage.setFrom(LoginUser.getInstance().getJid());
            _chatMessage.setTo(_jid);
            _chatMessage.setMessage(message);
            _chatMessage.setDirection(ChatMessage.DIRECTION_SEND);
            _chatMessage.setThreadTitle(_textTitleArea);
            if (CubeeController.getInstance().sendChatMessage(_chatMessage, assignNoteForMessage) == false) {
                var _title   = Resource.getMessage('dialog_title_system_info');
                var _message = Resource.getMessage('dialog_error_send_message');
                var _dialog = new DialogCloseView(_title, _message);
                _dialog.showDialog();
            }
        };
        var _text = _self._textarea.getText();
        var retflag = _self._uploadFileAndSendMessage(_text, _sendChatMessage, _textTitleArea);
        _self._textarea.clearTextFromFlag(retflag);
    }
    _proto.createMessageObjectOnly = function(message) {
        var _self = this;
        if (!message || typeof message != 'object') {
            return;
        }
        var _type = message.getType();
        var _msgObj = null;
        switch(_type) {
            case Message.TYPE_CHAT:
                _msgObj = new ColumnChatMessageView(_self, message);
                break;
            default:
                console.log('ColumnChatView::createMessageObjectOnly _ invalid type:' + _type);
                break;
        }
        return _msgObj;
    };
    _proto.getColumnMessageHtml = function(message) {
        var _ret = '';
        if(!message || typeof message != 'object') {
            return ret;
        }
        _ret = message.getMessageHtml();
        return _ret;
    };
    _proto._createDisplayName = function(userName) {
        var _ret = ColumnView.DISPLAY_NAME_CHAT;
        if(userName && userName != ''){
            _ret = userName;
        }
        return _ret;
    };

    _proto._updateColumnTitleAndColumnIcon = function(partnerJid){
        var _self = this;

        var _onGetPersonCallback = function(personMap){
            if(!personMap || typeof personMap != 'object'){
                return;
            }
            var _person = personMap.getByKey(partnerJid);
            var _userName = _person.getUserName();
            var _avatarSrc = ViewUtils.getAvatarUrl(_person);
            _self._info.setDisplayName(_self._createDisplayName(_userName));
            _self._info.setIconImage(_avatarSrc);
            var result = Utils.avatarCreate({name: _userName, type: 'user'});
            _super.updateColumnTitle.call(_self, result.color);
            _self._info.setDisplayName(_userName); 
            ColumnManager.getInstance().updateColumnIcon(_self);

            $(window).trigger('resize');
        };
        CubeeController.getInstance().getPersonDataByJidFromServer(partnerJid, _onGetPersonCallback);
    };
})();
