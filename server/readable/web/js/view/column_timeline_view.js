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
function ColumnTimelineView(columnInformation){
    this._hasRightToSendMessage(columnInformation);
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_TIMELINE;
    this._displayName = this._createDisplayName();
    this._closable = true;
    this.createView();

    columnInformation.setIconImage('images/column_myfeed.png');
};(function() {
    ColumnTimelineView.cssClassTimeline = 'timeline-message';
    if(ViewUtils.isIE89()) {
        ColumnTimelineView.cssClassThread = 'thread-message thread-message-ie89';
    } else {
        ColumnTimelineView.cssClassThread = 'thread-message';
    }

    ColumnTimelineView.prototype = $.extend({}, ColumnView.prototype);
    var _super = ColumnView.prototype;


    var _columnTimelineView;
    ColumnTimelineView.getInstance = function() {
        if(_columnTimelineView) {
            return _columnTimelineView;
        }
        return null;
    }

    ColumnTimelineView.setInstance = function(_columnObj) {
        _columnTimelineView = _columnObj;
        return;
    }

    var _proto = ColumnTimelineView.prototype;

    _proto.createMessageObjectOnly = function(msg) {
        var _self = this;
        if (!msg || typeof msg != 'object') {
            return;
        }
        var _type = msg.getType();
        var _msgObj = null;
        switch(_type) {
            case Message.TYPE_PUBLIC:
                _msgObj = new ColumnPublicMessageView(_self, msg);
                break;
            case Message.TYPE_SYSTEM:
                _msgObj = new ColumnSystemMessageView(_self, msg);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                _msgObj = new ColumnQuestionnaireMessageView(_self, msg);
                break;
            default:
                console.log('ColumnTimelineView::createMessageObjectOnly _ invalid type:' + _type);
                break;
        }

        return _msgObj;
    };
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _count = 20;
        var _received = 0;
        function onReceivePublicMessagesCallback (message, isReceiveFinished) {
            onGetHistoryMessage(message);
            _received++;
            if(isReceiveFinished) {
                _self.onReceiveFinishedPublicMessage(_count, _received);
            }
        };
        CubeeController.getInstance().getPublicMessages(_self._currentLoadedItemId, _count, onReceivePublicMessagesCallback);
        function onGetHistoryMessage(message) {
            _self._hideLoadingIconInSelf();
            _self.showHistoryMessage(message);
        }
    };
    _proto.getColumnMessageHtml = function (message, replyFlag) {
        var ret = '';
        if(!message || typeof message != 'object') {
            return ret;
        }
        if (replyFlag == null) {
            replyFlag = false;
        }
        ret = message.getMessageHtml(replyFlag,_sendMessageRight);
        return ret;
    };
    _proto.clickSubFormButton = function() {
        var _self = this;
        _self.sendPublicMessage();
    };
    _proto.sendPublicMessage = function() {
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
        function _sendPublicMessage(message) {
            if (CubeeController.getInstance().sendPublicMessage(message, '', _textTitleArea, assignNoteForMessage) == false) {
                var _title   = Resource.getMessage('dialog_title_system_info');
                var _message = Resource.getMessage('dialog_error_send_message');
                var _dialog = new DialogCloseView(_title, _message);
                _dialog.showDialog();
            }
        };
        var _text = _self._textarea.getText();
        var retflag = _self._uploadFileAndSendMessage(_text, _sendPublicMessage, _textTitleArea);
        _self._textarea.clearTextFromFlag(retflag);
    };
    _proto.onSystemMessageReceive = function(systemMessage) {
        var _self = this;
        if(systemMessage == null || systemMessage.getType() != Message.TYPE_SYSTEM) {
            return;
        }
        _self.showMessage(systemMessage);
    };
    _proto.onAddMessageReceive = function(questionnaireMessage) {
        var _self = this;
        if(questionnaireMessage == null || questionnaireMessage.getType() != Message.TYPE_QUESTIONNAIRE) {
            return;
        }
        _self.showMessage(questionnaireMessage);
    };
    _proto.notifyDisconnect = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        if(_selfElm){
            $("div.column-content", _selfElm).prepend(_self.createDivMessageBorder(ColumnSystemMessageView.getOfflineMessageHtml()));
        }
    };
    _proto._showMessageData = function(msg) {
        var _self = this;
        return _self._showMessageDataWithThread(msg);
    };
    _proto.showHistoryMessage = function(msg) {
        var _self = this;
        _self._showHistoryMessageWithThread(msg);
    };
    _proto._createDisplayName = function() {
        var _ret = '';
        _ret = ColumnView.DISPLAY_NAME_TIMELINE;
        var _filterCondition = this.getColumnInfo().getFilterCondition();
        if (_filterCondition != null && _filterCondition != '') {
            _ret += '(' + _filterCondition + ')';
        }
        return _ret;
    };
    var _sendMessageRight = '';
    _proto._hasRightToSendMessage = function(columnInformation) {
        var _ret = '';
        var AuthInfo = AuthorityInfo.getInstance();
        _ret = AuthInfo.checkRights(AuthorityDef.AUTHORITY_ACTIONS.FEED_SEND);
        columnInformation.setRightToSendMessage(_ret);
        _ret = AuthInfo.checkRights(AuthorityDef.AUTHORITY_ACTIONS.FEED_VIEW);
        columnInformation.setRightToViewMessage(_ret);
        _sendMessageRight = columnInformation.getRightToViewMessage();
        return;
    };

    _proto.onReceiveFinishedPublicMessage = function(requestCount, receiveCount) {
        var _self = this;
        if (receiveCount < requestCount) {
            _self._allMessageReceived = true;
        }
        _self.refreshScrollbar();
    };

    $(document).on('click', '.' + ColumnView.TOGGLE_REPLY_CLS_NAME, function() {
        var _replyTag = 'div';
        var _targetRepry = $(this).parent().children(_replyTag+'.thread-message');
        var _toggleCount = $(this).parent().children(_replyTag+'.thread-message').length - ColumnView.RECENT_REPLY_SHOW_COUNT;
        var _lastIdx = $(this).parent().children(_replyTag+'.thread-message').length - 1;
        var _toggleIdx = _lastIdx - ColumnView.RECENT_REPLY_SHOW_COUNT;
        for (var _i = 0; _i <= _toggleIdx; _i++) {
            _targetRepry.eq(_i).toggle();
        }
        $(this).parent().children('.comment_wrapper').eq(0).toggle();
        var visibleCount = $(this).parent().children(_replyTag+'.thread-message:visible').length;
        if (visibleCount > ColumnView.RECENT_REPLY_SHOW_COUNT) {
            $(this).text(Resource.getMessage('hidden_past_reply_txt'));
        } else {
            var allReplyCount = _targetRepry.length;
            var toggleString = Utils.stringFormat(Resource.getMessage('show_past_reply_txt'), allReplyCount);
            $(this).text(toggleString);
        }
    });
})();
