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
function ColumnMurmurView(murmurColumnInformation) {
    this._hasRightMessage(murmurColumnInformation);
    ColumnView.call(this, murmurColumnInformation);
    this._className = ColumnView.CLASS_SEL_MURMUR;
    this._displayName = this._createDisplayName(null);

    this.createView();
    this.partnerJid = MurmurColumnInformation.getOwnJidFromSearchCondition(murmurColumnInformation);
    if(this.partnerJid != null){
        if(!this.isSideMenu){
            if(LoginUser.getInstance().getJid() != this.partnerJid){
                this._htmlElement.find(".column-toggle.col_btn.col_input_btn.popup_btn.ico_btn").hide();
            }
            if(this.partnerJid != null){
                const _self = this;
                let basetitle = this._htmlElement.find(".column-header-title").text();
                CubeeController.getInstance().getPersonDataByJidFromServer(
                    this.partnerJid,
                    (personMap)=>{
                        if(!personMap || typeof personMap != 'object'){
                            return;
                        }
                        const _person = personMap.getByKey(this.partnerJid);
                        if(_person){
                            const _userName = _person.getUserName();
                            const _avatarSrc = ViewUtils.getAvatarUrl(_person);
                            let _dispname = _self._createDisplayName(_userName);
                            _self._info.setDisplayName(_dispname);
                            _self._info.setIconImage(_avatarSrc);
                            const result = Utils.avatarCreate({name: _userName, type: 'user'});
                            _self.updateColumnTitle.call(_self, result.color);
                            ColumnManager.getInstance().updateColumnIcon(_self);
                        }
                    });
                let _person = CubeeController.getInstance().getContactListData(this.partnerJid);
                let _avatarSrc = ViewUtils.getAvatarUrl(_person);
                murmurColumnInformation.setIconImage(_avatarSrc);
            }
        }
    }
};(function() {
    ColumnMurmurView.cssClassMurmur = 'murmur-message';
    if(ViewUtils.isIE89()) {
        ColumnMurmurView.cssClassThread = 'thread-message thread-message-ie89';
    } else {
        ColumnMurmurView.cssClassThread = 'thread-message';
    }

    ColumnMurmurView.prototype = $.extend({}, ColumnView.prototype);
    var _super = ColumnView.prototype;
    var _proto = ColumnMurmurView.prototype;

    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = MurmurColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new MurmurColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        let _searchCondition = _columnInfo.getSearchCondition();
        var _requestCount = 20;
        function onGetMurmurHistoryMessageCallback(resultMessageData) {
            _self._hideLoadingIconInSelf();
            if (!resultMessageData) {
                return;
            }
            var _murmurMessageList = resultMessageData.messageDataList;
            if(!_murmurMessageList) {
                return;
            }
            var _count = _murmurMessageList.getCount();
            if (_count < _requestCount) {
                _self._allMessageReceived = true;
            }
            _self.onGetMurmurHistoryMessage(_murmurMessageList);
            $(window).trigger('resize');
            _self.refreshScrollbar();
            _self._disableBottomEvent = false;
        }
        _self._disableBottomEvent = true;
        CubeeController.getInstance().searchMessage(_self._currentLoadedItemId, _requestCount,
                                                    _searchCondition, onGetMurmurHistoryMessageCallback);
    };

    _proto.onGetMurmurHistoryMessage = function(murmurMessageList) {
        var _self = this;
        if (!murmurMessageList) {
            return;
        }
        var _count = murmurMessageList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _murmurMessage = murmurMessageList.get(_i);
            if (_murmurMessage == null) {
                continue;
            }
            var _itemId = _murmurMessage.getItemId();
            if (!_self.getMsgObjByItemId(_itemId)) {
                _self.showHistoryMessage(_murmurMessage);
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
            case Message.TYPE_MURMUR:
                _msgObj = new ColumnMurmurMessageView(_self, message);
                break;
            default:
                console.log('ColumnMurmurView::createMessageObjectOnly _ invalid type:' + _type);
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

    _proto._createDisplayName = function(userName) {
        const _self = this;
        var _ret = ColumnView.DISPLAY_NAME_MURMUR;
        if(typeof _self._info._columnName == 'string' &&
           _self._info._columnName.length > 0){
            _ret = _self._info._columnName;
        }
        if(typeof userName == 'string' && userName != ''){
            _ret += " (" +userName + ")";
        }
        return _ret;
    };

    _proto.showHistoryMessage = function(msg) {
        var _self = this;
        if(_self.isSideMenu){
            _super.showHistoryMessage.call(_self, msg);
        }else{
            _self._showHistoryMessageWithThread(msg);
        }
    };

    _proto.clickSubFormButton = function() {
        var _self = this;
        _self.sendMurmurMessage();
    };
    _proto.sendMurmurMessage = function() {
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
                if (result != null && result.content && result.content.result) {
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
        function _sendMurmurMessage(message) {
            var _murmurMessage = new MurmurMessage();
            _murmurMessage.setFrom(LoginUser.getInstance().getJid());
            _murmurMessage.setTo(LoginUser.getInstance().getJid());
            _murmurMessage.setMessage(message);
            _murmurMessage.setDirection(ChatMessage.DIRECTION_SEND);
            _murmurMessage.setThreadTitle(_textTitleArea);
            if (CubeeController.getInstance().sendMurmurMessage(_murmurMessage, assignNoteForMessage) == false) {
                console.log("faild to send Murmur");
                var _title   = Resource.getMessage('dialog_title_system_info');
                var _message = Resource.getMessage('dialog_error_send_message');
                var _dialog = new DialogCloseView(_title, _message);
                _dialog.showDialog();
            }
        }
        var _text = _self._textarea.getText();
        var retflag = _self._uploadFileAndSendMessage(_text, _sendMurmurMessage, _textTitleArea);
        _self._textarea.clearTextFromFlag(retflag);
    };

    _proto._showMessageData = function(msg) {
        var _self = this;
        if(_self.isSideMenu){
            return _super._showMessageData.call(_self, msg);
        }else{
            return _self._showMessageDataWithThread(msg);
        }
    };

    _proto._hasRightMessage = function(columnInformation) {
        var _ret = '';
        var AuthInfo = AuthorityInfo.getInstance();
        _ret = AuthInfo.checkRights(AuthorityDef.AUTHORITY_ACTIONS.MURMUR_SEND);
        columnInformation.setRightToSendMessage(_ret);
        _ret = AuthInfo.checkRights(AuthorityDef.AUTHORITY_ACTIONS.MURMUR_VIEW);
        columnInformation.setRightToViewMessage(_ret);
        _sendMessageRight = columnInformation.getRightToViewMessage();
        return;
    };

})();
