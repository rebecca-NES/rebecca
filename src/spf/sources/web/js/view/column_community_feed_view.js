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

function ColumnCommunityFeedView(communityFeedColumnInformation, tabType) {
    this._hasRightMessage(communityFeedColumnInformation);
    ColumnView.call(this, communityFeedColumnInformation);
    this._className = ColumnView.CLASS_SEL_COMMUNITY_FEED;
    this._idName = communityFeedColumnInformation.getCommunityInfomation().getRoomId();
    this._displayName = this._createDisplayName();
    this._tabType = tabType;
    if(this._tabType == TabItemView.TYPE_COMMUNITY){
        this._closable = false;
    }
    this.createView();

    this._showTitleAndSetColor();
};(function() {
    ColumnCommunityFeedView.cssClassCommunityFeed= 'community-feed-message';
    if(ViewUtils.isIE89()) {
        ColumnCommunityFeedView.cssClassThread = 'thread-message thread-message-ie89';
    } else {
        ColumnCommunityFeedView.cssClassThread = 'thread-message';
    }

    ColumnCommunityFeedView.prototype = $.extend({}, ColumnView.prototype);
    var _super = ColumnView.prototype;
    var _proto = ColumnCommunityFeedView.prototype;

    _proto.cleanup = function() {
        var _self = this;
        _super.cleanup.call(_self);
    };

    _proto._showTitleAndSetColor = function() {
        var _self = this;
        var _communityInfo = _self._info.getCommunityInfomation();
        var _communityId = _communityInfo.getRoomId();
        _self._requestCommunityInfo(_communityId, onGetCommunityInfoCallBack);
        function onGetCommunityInfoCallBack(communityInfo){
            if(communityInfo == null || typeof communityInfo != 'object'){
                _self._showNotReferableCommunity();
                return;
            }
            _self._displayName = _self._createDisplayName();
            _self._info.setDisplayName(_self._displayName);
            var _avatarSrc = _communityInfo.getLogoUrl();
            _self._info.setIconImage(_avatarSrc);
            _super.updateColumnTitle.call(_self, '#' + communityInfo.getMemberEntryType());
        };
    };
    _proto._showNotReferableCommunity = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        if(_selfElm){
            $("div.column-content", _selfElm).prepend(_self.createDivMessageBorder(ColumnSystemMessageView.getNotReferableMessageHtml(Resource.getMessage('not_referable_community'))));
        }
    };
    _proto.showChangedAuthorityMessage = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        if(_selfElm){
            $("div.column-content", _selfElm).prepend(_self.createDivMessageBorder(ColumnSystemMessageView.getNotReferableMessageHtml(Resource.getMessage('authchanged_force_reload_community'))));
        }
    };
    _proto._hasRightMessage = function(columnInformation) {
        var _ret = '';
        var _roomId = columnInformation.getCommunityInfomation().getRoomId();
        var AuthInfo = AuthorityInfo.getInstance();
        switch(AuthInfo.getWhichRightToCommunityResource(_roomId)) {
            case AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE:
            case AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_SEND:
                columnInformation.setRightToSendMessage(true);
                columnInformation.setRightToViewMessage(true);
                break;
            case AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_VIEW:
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
    _proto._requestCommunityInfo = function(communityId, onGetCommunityInfoCallBack){
        var _self = this;
        if(communityId == null || typeof communityId != 'string'){
            return null;
        }
        function _callback(communityInfo){
            if(communityInfo != null){
                _self._updateCommunityInfo(communityInfo);
            }
            onGetCommunityInfoCallBack(communityInfo);
        };
        CubeeController.getInstance().getCommunityInfo(communityId, _callback);
    };

    _proto.onCommunityInfoUpdateNotication = function(communityNotification) {
        var _self = this;
        var _updatedCommunityInfo = communityNotification.getUpdatedCommunityInfo();
        var _notoficationCommunityId = _updatedCommunityInfo.getRoomId();
        var _communityInfo = _self._info.getCommunityInfomation();
        var _columnCommunityId = _communityInfo.getRoomId();
        if(_columnCommunityId == _notoficationCommunityId) {
            _self._updateCommunityInfo(_updatedCommunityInfo);
            _self._displayName = _self._createDisplayName();
            _self._info.setDisplayName(_self._displayName);
            var _avatarSrc = _updatedCommunityInfo.getLogoUrl();
            _self._info.setIconImage(_avatarSrc);
            _super.updateColumnTitle.call(_self);
        }
    };
    _proto._updateCommunityInfo = function(communityInfo){
        var _self = this;
        if(communityInfo == null || typeof communityInfo != 'object'){
            return null;
        }
        _self._info.setCommunityInfomation(communityInfo);
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
    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _tabType = _self._tabType;
        var _optionMenuHtml = CommunityFeedColumnOptionMenu.getHtml(_self._info, _tabType);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new CommunityFeedColumnOptionMenu(_optionMenuElem, _self._info, _self, _tabType);
    };
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _searchCondition = _columnInfo.getSearchCondition();
        var _requestCount = 20;
        var _roomInfo = _self._info.getCommunityInfomation();
        CubeeController.getInstance().searchMessage(_self._currentLoadedItemId, _requestCount, _searchCondition, onGetCommunityFeedHistoryMessageCallback);
        function onGetCommunityFeedHistoryMessageCallback(resultMessageData) {
            _self._hideLoadingIconInSelf();
            if (!resultMessageData) {
                return;
            }
            var _communityMessageList = resultMessageData.messageDataList;
            if(!_communityMessageList) {
                return;
            }
            var _count = _communityMessageList.getCount();
            if (_count < _requestCount) {
                _self._allMessageReceived = true;
            }
            _self.onGetHistoryMessage(_communityMessageList);
            _self._updateColumnTitleAndColumnIcon(_roomInfo.getRoomId());
            _self.refreshScrollbar();
        };
    };

    _proto.onGetHistoryMessage = function(communityMessageList) {
        var _self = this;
        if (!communityMessageList) {
            return;
        }
        var _count = communityMessageList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _communityMessage = communityMessageList.get(_i);
            if (_communityMessage == null) {
                continue;
            }
            var _itemId = _communityMessage.getItemId();
            if (!_self.getMsgObjByItemId(_itemId)) {
                _self.showHistoryMessage(_communityMessage);
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
            case Message.TYPE_COMMUNITY:
                _msgObj = new ColumnCommunityMessageView(_self, message);
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
        var _communityInfo = _self._info.getCommunityInfomation();
        var _communityName = '';
        if(_communityInfo != null) {
            var _communityName = _communityInfo.getRoomName();
            if(_communityName == null) {
                _communityName = '';
            }
        }
        var _ret = ViewUtils.createDisplayName(_self._info);
        if (TabManager.getInstance().isActiveMyWorkplace() && _communityName != '') {
            _ret = _communityName;
        }
        return _ret;
    };

    _proto.showHistoryMessage = function(msg) {
        var _self = this;
        _self._showHistoryMessageWithThread(msg);
    };

    _proto.clickSubFormButton = function() {
        var _self = this;
        _self.sendCommunityMessage();
    };
    _proto.sendCommunityMessage = function() {
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
        function _sendCommunityMessage(message) {
            var _communityMessage = new CommunityMessage();
            _communityMessage.setFrom(LoginUser.getInstance().getJid());
            var _roomInfo = _self._info.getCommunityInfomation();
            var _roomId = _roomInfo.getRoomId();
            _communityMessage.setTo(_roomId);
            _communityMessage.setMessage(message);
            _communityMessage.setDirection(ChatMessage.DIRECTION_SEND);
            _communityMessage.setThreadTitle(_textTitleArea);
            if (CubeeController.getInstance().sendCommunityMessage(_communityMessage, onSendCallBack) == false) {
                console.log('faild to send Community Message:');
                var _title   = Resource.getMessage('dialog_title_system_info');
                var _message = Resource.getMessage('dialog_error_send_message');
                var _dialog = new DialogCloseView(_title, _message);
                _dialog.showDialog();
                return;
            }
            function onSendCallBack(communityMessage){
                if(communityMessage == null){
                    console.log('faild to save Community Message:');
                    var _title   = Resource.getMessage('dialog_title_system_info');
                    var _message = Resource.getMessage('dialog_error_send_message');
                    var _dialog = new DialogCloseView(_title, _message);
                    _dialog.showDialog();
                    return;
                }
                var _noteArea = _self.getHtmlElement().find('.attach-note-element p').attr('value');
                if (_noteArea) {
                    var interval_time = 200;
                    var timeout = 10000;
                    var set_interval_id = setInterval(waitGetNotification, interval_time);
                    var interval_cnt = 0;
                    function waitGetNotification() {
                        if (CubeeController.getInstance()._messageManager.getAllMessage().getByItemId(communityMessage.getItemId())) {
                            clearInterval(set_interval_id);
                            CodiMdController.getInstance().assignNoteOnThreadRootId(communityMessage.getItemId(), _noteArea)
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
                } else {
                    cleanTextArea();
                }
            }
        };
        var _text = _self._textarea.getText();
        var retflag = _self._uploadFileAndSendMessage(_text, _sendCommunityMessage, _textTitleArea);
        _self._textarea.clearTextFromFlag(retflag);
    };

    _proto._showMessageData = function(msg) {
        var _self = this;
        return _self._showMessageDataWithThread(msg);
    };
    _proto.notifyDisconnect = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        if(_selfElm){
            $("div.column-content", _selfElm).prepend(_self.createDivMessageBorder(ColumnSystemMessageView.getOfflineMessageHtml()));
        }
    };
    _proto.notifyRemoveMember = function(communityNotification) {
        var _self = this;
        var _notoficationCommunityId = communityNotification.getRoomId();
        var _communityInfo = _self._info.getCommunityInfomation();
        var _columnCommunityId = _communityInfo.getRoomId();
        if(_columnCommunityId == _notoficationCommunityId) {
            _self._showNotReferableCommunity();
        }
    };
    _proto._updateColumnTitleAndColumnIcon = function(communityId) {
        var _self = this;
        function callback(communityInfo){
            if(!communityInfo || typeof communityInfo != 'object'){
                return;
            }
            var _avatarSrc = communityInfo.getLogoUrl();
            _self._info.setIconImage(_avatarSrc);
            ColumnManager.getInstance().updateColumnIcon(_self);
            $(window).trigger('resize');
        }
        CubeeController.getInstance().getCommunityInfo(communityId, callback);
    }
    _proto.onAddMessageReceive = function(questionnaireMessage) {
        var _self = this;
        if(questionnaireMessage == null || questionnaireMessage.getType() != Message.TYPE_QUESTIONNAIRE) {
            return;
        }
        _self.showMessage(questionnaireMessage);
    };
})();
