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
function ColumnFilterView(columnInformation) {
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_FILTER;
    this._displayName = this._createDisplayName(columnInformation);
    this.createView();

    this._resultAllCount = 0;
    this._htmlElement.find('div.frm-message').children('input').val(this._info.getKeyword());
    columnInformation.setIconImage('images/column_search.png');

    this._updateColumnTitle();
};(function() {
    ColumnFilterView.prototype = $.extend({}, ColumnView.prototype);
    var _super = ColumnView.prototype;
    var _proto = ColumnFilterView.prototype;

    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = FilterColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new FilterColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };

    _proto._createSubForms = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _textareaElement = _htmlElem.find('div.frm-message > input[type="text"]');
        _self._textarea = new ColumnTextAreaView(_textareaElement, _self, '');
        var _btnElement = _htmlElem.find('div.frm-message > button');
        _self._button = new ColumnSubmitButtonView(_btnElement, _self, Resource.getMessage('column_btn_search'));
    };
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _getCount = 20;
        function onGetHistoryMessageCallback(resultMessageData) {
            _self._hideLoadingIconInSelf();
            _self._resultAllCount = resultMessageData.allItemCount;
            var _messageList = resultMessageData.messageDataList;
            if(_messageList.getCount() < _getCount) {
                _self._allMessageReceived = true;
            }
            var _count = _messageList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                var _message = _messageList.get(_i);
                if (_message == null) {
                    continue;
                }
                var _itemId = _message.getItemId();
                if (!_self.getMsgObjByItemId(_itemId)) {
                    _self.showHistoryMessage(_message);
                }
            }
            _self._getNotAvailableMessageHtmlIfMessageNothing(_self._getMsgObjIndexList().getCount());
            $(window).trigger('resize');
            _self.refreshScrollbar();
            _self._disableBottomEvent = false;
        }
        _self._disableBottomEvent = true
        CubeeController.getInstance().searchMessage(_self._currentLoadedItemId, _getCount, _columnInfo.getSearchCondition(), onGetHistoryMessageCallback);
    };
     _proto._getNotAvailableMessageHtmlIfMessageNothing = function(count) {
        var _self = this;
        _self._deleteNotAvailableMessageHtml();
        if(_self._allMessageReceived && count <= 0) {
            var _htmlElem = _self.getHtmlElement();
            if(_htmlElem == null) {
                return false;
            }
            var _targetColumnElem = _htmlElem;
            var _columnContentElem = _self.getColumnContent();
            // Variable _tailOfElm is used like a local variable, but is missing a declaration.
            var _tailOfElm = _columnContentElem.children('div.column-search-message-none');
            if (_tailOfElm.hasClass('column-search-message-none')) {
                return false;
            }
            var _content = '<div class="column-search-message-none">' + Resource.getMessage('search_result_message_none') + '</div>';

            _columnContentElem.prepend(_content);
        }
    };
    _proto._deleteNotAvailableMessageHtml = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return false;
        }
        var _targetColumnElem = _htmlElem;
        var _columnContentElem = _self.getColumnContent();
        // Variable _tailOfElm is used like a local variable, but is missing a declaration.
        var _tailOfElm = _columnContentElem.children('div.column-search-message-none');
        if (0 < _tailOfElm.length) {
            _tailOfElm.remove();
        }
    };
    _proto.clickSubFormButton = function() {
        var _self = this;
        var _keywordStr = Utils.trimStringMulutiByteSpace(_self._htmlElement.find('div.frm-message').children('input').val());
        var _isOk = _self._isValidateOk(_keywordStr);
        if(!_isOk) {
            return;
        }
        var _columnKeywordFilter = _self._getKeywordFilterCondition(_keywordStr);
        var _searchCondition = _self._createSearchCondition(_columnKeywordFilter);
        var _columnInfo = _self._info;
        _columnInfo.setSearchCondition(_searchCondition);
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _messageElement = _htmlElem.find('div.column-content .message-border');
        var _hash = _self._getMsgObjHash();
        for (var key in _hash) {
            delete _hash[key];
        }
        _self._getMsgObjIndexList().removeAll();
        _messageElement.remove();
        _self._hideLoadingIconInSelf();

        _self._allMessageReceived = false;
        _self._currentLoadedItemId = 0;

        _columnInfo.setKeyword(_keywordStr);
        var _displayName = _self._createDisplayName(_columnInfo);
        _columnInfo.setDisplayName(_displayName);
        _self.updateColumnTitle();
        ColumnManager.getInstance().saveColumnList();

        _super._LoadingIcon(_self,'div.wrap-frm-message');

        _self.getHistoryMessage();
   };
    _proto._isValidateOk = function(searchCondition) {
        var _self = this;
        var _keywordElem = _self._htmlElement.find('div.frm-message').children('input');
        _keywordElem.removeClass('input-error');
        var _keywordStr = searchCondition;
        if(_keywordStr == null || typeof _keywordStr != 'string' || _keywordStr == '' || Utils.trimStringMulutiByteSpace(_keywordStr) == '') {
            return false;
        }
        var _keywordList = ViewUtils.getKeywordListFromKeywordInputString(_keywordStr);
        if(_keywordList == null) {
            return false;
        }
        var _count = _keywordList.getCount();
        if(_count < 1) {
            return false;
        }
        for(var _i = 0; _i < _count; _i++) {
            var _inputKeyword = _keywordList.get(_i);
            var _encodeKeyword = encodeURIComponent(_inputKeyword);
            if(_encodeKeyword.length <= 1) {
                _keywordElem.addClass('input-error');
                return false;
            }
        }
        return true;
    };
    _proto.createMessageObjectOnly = function(msg) {
        var _self = this;
        if (!msg || typeof msg != 'object') {
            return null;
        }
        var _type = msg.getType();
        var _msgObj = ViewUtils.createMessageObject(_self, msg);
        return _msgObj;
    };
    _proto.getColumnMessageHtml = function(message) {
        var _self = this;
        var _ret = '';
        var _columnInfo = _self._info;
        var _sourceColumnType = _columnInfo.getSourceColumnType();

        var _beginningColumnType = null;
        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
            _beginningColumnType = _columnInfo.getBeginningColumnType();
        }

        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH || _sourceColumnType == ColumnInformation.TYPE_COLUMN_RECENT || _sourceColumnType == ColumnInformation.TYPE_COLUMN_TOME || _beginningColumnType == ColumnInformation.TYPE_COLUMN_TOME) {
            var _msg = message.getMessage();
            var _itemId = message.getItemId();
            var _msgBorderHeaderHtml = ColumnSearchView.getBorderHeaderHtml(_msg);

            _ret += '<div draggable="false" class="box-border olient-vertical search-message width-100" style="border-left: 0;"';
            _ret += ' itemId="' + _itemId + '">';
            _ret += _msgBorderHeaderHtml;
            _ret += '<div class="box-border olient-vertical message-info search-message-info">';
            _ret += _self.getColumnMessageHtmlInner(message);
            _ret += '</div>';
            _ret += '<div class="message-footer search-message-footer">' + '</div>';
            _ret += '</div> <!-- .search-message -->';
        } else {
            _ret += _self.getColumnMessageHtmlInner(message);
        }
        if (_ret !== "") {
            _self._deleteNotAvailableMessageHtml();
        }
        return _ret;
    };
    _proto.getColumnMessageHtmlInner = function(message) {
        var _ret = '';
        var _msg = message.getMessage();

        var _isInbox = this.isInbox(_msg);
        _ret += this.getFilterMessageHeaderHtml(_msg, _isInbox);
        if (_isInbox) {
            _ret += message.getHtml();
        } else {
            _ret += message.getMessageHeaderHtml();
            _ret += message.getMessageBodyHtml();
            _ret += message.getMessageFooterHtml();
        }
        _ret += this.getFilterMessageFooterHtml(_msg);
        return _ret;
    };
    _proto._getKeywordFilterCondition = function(keywordStr) {
        var _self = this;
        var _keywordStr = Utils.trimStringMulutiByteSpace(keywordStr);
        var _keywordCondition = ViewUtils.getKeywordFilterFromKeywordInputString(_keywordStr);
        return _keywordCondition;
    };
    _proto._createSearchCondition = function(keywordCondition) {
        if (!keywordCondition || typeof keywordCondition != 'object') {
            return;
        }
        var _self = this;
        var _columnInfo = _self._info;
        var _sortCondition = new ColumnSortCondition();
        var _filterCondition = _self._createFilterCondition(keywordCondition);
        var _columnSearchCondition = new ColumnSearchCondition(_filterCondition, _sortCondition);
        return _columnSearchCondition;
    };
    _proto._createFilterCondition = function(keywordCondition) {
        if (!keywordCondition || typeof keywordCondition != 'object') {
            return;
        }
        var _self = this;
        var _columnInfo = _self._info;
        var _sourceColumnFilterType = _columnInfo.getSourceColumnType();
        var _subData = _columnInfo.getSubData();
        var _sourceColumnFilter = ColumnFilterManager.getColumnFilter(_sourceColumnFilterType, _subData);
        var _filterCondition = new AndCondition();
        _filterCondition.addChildCondition(_sourceColumnFilter);
        _filterCondition.addChildCondition(keywordCondition);
        return _filterCondition;
    };
    _proto.showHistoryMessage = function(message) {
        var _self = this;
        _super.showHistoryMessage.call(_self, message);
    };
    _proto.onUpdateMessageReceive = function(message) {
        var _self = this;
        _self.onAddMessageReceive(message);
    };
    _proto.onAddMessageReceive = function(message) {
        var _self = this;
        setTimeout(function() {
            _self.showMessage(message);
        }, 1000);
    };
    _proto.showNewMatchUpdateMessage = function(msg) {
        var _self = this;
        if (_self._validation({'object': msg}) == false) {
            return false;
        }
        var _itemId = msg.getItemId();
        var _targetMsgOjb = _self.getMsgObjByItemId(_itemId);
        if(_targetMsgOjb != null){
            var _targetElm = _self.getMessageHtmlElement(_targetMsgOjb);
            _targetElm.remove();
            _self.removeMsgObjIndexByItemIdNoCleanupMessage(_itemId);
        }
        if(!_self._info.getSearchCondition().isMatch(msg)){
            return false;
        }

        var insertItemId = null;
        var insertIndex = 0;
        var insertDate = Date.parse(msg.getDate());
        for (var i=0; i<_self._msgObjIndexList._length; i++) {
            var indexMsgObj = _self._msgObjIndexList.get(i).getMsgObj().getMessage();
            var indexDate = Date.parse(indexMsgObj.getDate());
            if (!indexDate || !insertDate) {
                return false;
            }
            var insertDateObj = new Date(insertDate);
            var indexDateObj = new Date(indexDate);
            if (insertDateObj.getTime() < indexDateObj.getTime()) {
                continue;
            } else {
                insertIndex = i;
                insertItemId = indexMsgObj.getItemId();
                break;
            }
        }
        var insertAfter = false;
        if (!insertItemId) {
            if (_self._msgObjIndexList._length == 0) {
                _self.showMessage(msg);
                return true;
            } else if(_self._allMessageReceived) {
                insertIndex = -1;
                insertItemId = _self._getMsgObjIndexList().get(_self._getMsgObjIndexList()._length-1).getMsgObj().getItemId();
                insertAfter = true;
            } else {
                return false;
            }
        }

        var _columnContentElem = _self.getMsgObjByItemId(insertItemId).getHtmlElement();
        if (_columnContentElem.length == 0) {
            return false;
        }

        var msgObj = _self.createMessageObjectOnly(msg);
        if(msgObj == null) {
            return false;
        }
        // Variable _content is used like a local variable, but is missing a declaration.
        var _content = _self.getColumnMessageHtml(msgObj);
        if (_content == "") {
            return false;
        }
        _content = _self.createDivMessageBorder(_content);
        _self._setMessageObject(msgObj, _content, insertIndex);
        var _linkElm = _content.children();
        new MessageColumnLink($(_linkElm), msg);
        _self._deleteNotAvailableMessageHtml();
        if (insertAfter) {
            _columnContentElem.after(_content);
        } else {
            _columnContentElem.before(_content);
        }
        var _tooltipTargetElm = _self._getToolTipBaseElement(_content);
        _self._setToolTipToMessageElem(_tooltipTargetElm, msg, msgObj);
        msgObj.onAddMessageReferCount();
        return true;
    };

    _proto.showMessage = function(msg) {
        var _self = this;
        if (_self._validation({'object' : msg}) == false) {
            return false;
        }
        var _targetSel;
        var _content;
        var _msgElement;
        var _type = msg.getType();

        if (_type == Message.TYPE_TASK) {
            var isCommunityTask = function(){
                return msg.getCommunityId() && msg.getCommunityId().length > 0;
            };
            if((msg.getOwnerJid() != LoginUser.getInstance().getJid()) && !isCommunityTask()){
                return false;
            }
            _self.showChildMessage(msg);
        }

        var _itemId = msg.getItemId();
        var _targetMsgOjb = _self.getMsgObjByItemId(_itemId);
        if(_targetMsgOjb != null){
            var _targetElm = _self.getMessageHtmlElement(_targetMsgOjb);
            _targetElm.remove();
            _self.removeMsgObjIndexByItemIdNoCleanupMessage(_itemId);
        }
        if(!_self._info.getSearchCondition().isMatch(msg)){
            return false;
        }
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return false;
        }
        var _targetColumnElem = _htmlElem;
        var _columnContentElem = _self.getColumnContent();

        var msgObj = _self.createMessageObjectOnly(msg);
        if(msgObj == null) {
            return false;
        }
        _content = _self.getColumnMessageHtml(msgObj);
        if (_content == "") {
            return false;
        }
        _content = _self.createDivMessageBorder(_content);
        _self._setMessageObject(msgObj, _content, 0);
        var _linkElm = _content.children();
        new MessageColumnLink($(_linkElm), msg);
        _self._deleteNotAvailableMessageHtml();
        _columnContentElem.prepend(_content);
        _msgElement = _self._getMessageElement(0);
        var _tooltipTargetElm = _self._getToolTipBaseElement(_msgElement);
        _self._setToolTipToMessageElem(_tooltipTargetElm, msg, msgObj);
        msgObj.onAddMessageReferCount();

        if(msg.getBodyType() == 1){
            ViewUtils.showStampMessage(_linkElm, _self);
        }
        _self.afterCreateMessageHtml(_linkElm);
        return true;
    };

    _proto._addClassInnerMessage = function (msgElement) {
        return msgElement
    };
    _proto.getMessageHtmlElement = function(msgObj) {
        if (msgObj == null || typeof msgObj != 'object') {
            return;
        }
        return msgObj.getHtmlElement();
    };
    _proto.showChildMessage = function(taskMessage) {
        var _self = this;
        var _parentItemId = taskMessage.getParentItemId();
        if (!_parentItemId) {
            return;
        }
        var _pos = _self.getMsgObjIndexPositionByItemId(_parentItemId);
        if (_pos == -1) {
            return;
        }
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _columnContent = _htmlElem.children('.column-content');
        var _targetMsgObj = _self.getParentMsgObjByPosition(_pos);
        var _targetMsgElm = _self.getMessageHtmlElement(_targetMsgObj);
        _targetMsgElm.remove();
        _self.removeMsgObjIndexByItemIdNoCleanupMessage(_parentItemId);
        var _parentTaskMessage = CubeeController.getInstance().getMessage(_parentItemId);
        _self.showMessage(_parentTaskMessage);
    };
    _proto.isInbox = function(message) {
        if (!message || typeof message != 'object') {
            return '';
        }
        var _ret = false;
        var isAssigning = false;
        var _type = message.getType();
        if (_type != Message.TYPE_TASK) {
            return _ret;
        }
        var _status = message.getStatus();
        isAssigning = ColumnTaskView.prototype.isAssigningTask(message);
        if (_status == TaskMessage.STATUS_INBOX || isAssigning == true) {
            _ret = true;
        }
        return _ret;
    };
    _proto.getFilterMessageHeaderHtml = function(msg, isInbox) {
        var _ret = '';
        var _itemId = msg.getItemId();
        var _type = msg.getType();
        switch (_type) {
            case Message.TYPE_PUBLIC:
            case Message.TYPE_CHAT:
            case Message.TYPE_GROUP_CHAT:
            case Message.TYPE_MAIL:
            case Message.TYPE_COMMUNITY:
            case Message.TYPE_MURMUR:
                _ret += '<div';
                _ret += ' class="box-border olient-vertical ' + getMessageCssCLSName(msg, isInbox) + '"';
                _ret += ' itemId="' + _itemId + '"';
                _ret += ' href="' + ColumnView.READ_MESSAGE_CONTROL_HREF_HEDER_STRING + _itemId + '">';
                break;
            case Message.TYPE_TASK:
                _ret += '<div class="box-border olient-vertical ' + getMessageCssCLSName(msg, isInbox) + '"';
                _ret += ' itemId="' + _itemId + '">';
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto.getFilterMessageFooterHtml = function(msg) {
        var _ret = '';
        var _itemId = msg.getItemId();
        var _type = msg.getType();
        switch (_type) {
            case Message.TYPE_PUBLIC:
            case Message.TYPE_CHAT:
            case Message.TYPE_GROUP_CHAT:
            case Message.TYPE_MAIL:
            case Message.TYPE_COMMUNITY:
            case Message.TYPE_MURMUR:
                if (ViewUtils.isIE89()) {
                    _ret += '</div> <!-- .filter-message -->';
                } else {
                    _ret += '</a> <!-- .filter-message -->';
                }
                break;
            case Message.TYPE_TASK:
                _ret += '</div> <!-- .filter-message -->';
                break;
            default:
                break;
        }
        return _ret;
    };
    function getMessageCssCLSName(msg, isInbox){
        var _ret = '';
        if (!msg || typeof msg != 'object') {
            return _ret;
        }
        var _type = msg.getType();
        switch (_type) {
            case Message.TYPE_PUBLIC:
                _ret = ColumnTimelineView.cssClassTimeline;
                break;
            case Message.TYPE_CHAT:
                _ret = ColumnChatView.cssClass;
                break;
            case Message.TYPE_TASK:
                if (isInbox) {
                    _ret = ColumnInboxView.cssClass;
                } else {
                    _ret = ColumnTaskView.cssClass + ' ' + ColumnTaskMessageView.getTaskMessageCLSName(msg);
                }
                break;
            case Message.TYPE_GROUP_CHAT:
                _ret = ColumnGroupChatView.cssClassGroupChat;
                break;
            case Message.TYPE_MAIL:
                _ret = ColumnMailView.cssClass;
                break;
            case Message.TYPE_COMMUNITY:
                _ret = ColumnCommunityFeedView.cssClassCommunityFeed;
                break;
            case Message.TYPE_MURMUR:
                _ret = ColumnMurmurView.cssClassMurmur;
                break;
            default:
                break;
        }
        return _ret;
    };
    _proto._createDisplayName = function(columnInfo) {
        var _columnType = columnInfo.getColumnType();
        switch(_columnType){
            case ColumnInformation.TYPE_COLUMN_FILTER:
                return columnInfo.getSourceColumnDisplayName() + ' / ' + columnInfo.getKeyword();
            case ColumnInformation.TYPE_COLUMN_SEARCH:
                return ColumnView.DISPLAY_NAME_SEARCH + ' / ' + columnInfo.getKeyword();
            case ColumnInformation.TYPE_COLUMN_RECENT:
                return ColumnView.DISPLAY_NAME_RECENT;
        }
    };
    _proto.showUpdateMessage = function(msg) {
        var _self = this;
        if (msg == null || typeof msg != 'object') {
            return;
        }
        var _itemId = msg.getItemId();
        if (!_itemId) {
            return;
        }
        // Variable _pos is used like a local variable, but is missing a declaration.
        var _pos = _self.getMsgObjIndexPositionByItemId(_itemId);
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _columnContent = _htmlElem.children('.column-content');
        var _targetMsgObj = _self.getParentMsgObjByPosition(_pos);
        var _targetMsgElm = _self.getMessageHtmlElement(_targetMsgObj);
        var _targetMsgItemId = _targetMsgObj.getMessage().getItemId();
        _self.removeMsgObjIndexByItemId(_targetMsgItemId);
        _targetMsgElm.remove();
    };

    _proto.onMessageOptionReceive = function(messageOptionNotification) {
        var _self = this;
        if (_self._validation({'object' : messageOptionNotification}) == false) {
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return ;
        }
        if (messageOptionNotification.getType == null) {
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return;
        }
        var _type = messageOptionNotification.getType();
        if (_type != Notification_model.TYPE_MESSAGE_OPTION) {
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return;
        }
        var _contentType = messageOptionNotification.getContentType();
        if (_contentType != MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK) {
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return;
        }
        var _itemId = messageOptionNotification.getItemId();
        var _messageViewObj = _self.getMsgObjByItemId(_itemId);
        if(_messageViewObj != null){
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return;
        }
        var _childTaskMessage = CubeeController.getInstance().getMessage(_itemId);
        if(_childTaskMessage == null){
            return;
        }
        if(_childTaskMessage.getType() != Message.TYPE_TASK){
            return;
        }
        var _parentItemId = _childTaskMessage.getParentItemId();
        var _messageViewObj = _self.getMsgObjByItemId(_parentItemId);
        if (_messageViewObj == null) {
            return;
        }
        _messageViewObj.onMessageOptionReceive(messageOptionNotification);
    };

    _proto._updateActionToolTipToMessageElem = function(msgViewObj, type) {
        var _messageElement = msgViewObj.getHtmlElement();
        if (_messageElement) {
            var _actionToolTipOwner = _messageElement.children().children('div.message-info').children('div.task-message').children('div.message-header').eq(0);
            TooltipView.getInstance().updateActionToolTip(_actionToolTipOwner, type);
        }
    };

    _proto._updateColumnTitle = function(){
        var _self = this;
        var _columnInfo = _self._info;
        var _sourceColumnType = _columnInfo.getSourceColumnType();
        var _sourceColumnDisplayName = _columnInfo.getSourceColumnDisplayName();
        if(_sourceColumnDisplayName == null){
            _sourceColumnDisplayName = '';
        }
        var _subData = ViewUtils.getSubDataInColumnInfo(_sourceColumnType, _columnInfo.getSubData());

        ViewUtils.createDisplayNameWithSubData(_sourceColumnType, _subData, _sourceColumnDisplayName, function(_columnTitle){
            if(_columnTitle != null && _columnTitle != '' && typeof _columnTitle == 'string'){
                _columnInfo.setSourceColumnDisplayName(_columnTitle);
            }
            var _displayName = _self._createDisplayName(_columnInfo);
            _columnInfo.setDisplayName(_displayName);
            _self.updateColumnTitle();
            ColumnManager.getInstance().saveColumnList();
        });
    };
})();
