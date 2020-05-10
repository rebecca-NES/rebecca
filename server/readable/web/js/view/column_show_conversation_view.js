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
function ColumnShowConversationView(columnInformation) {
    ColumnView.call(this, columnInformation);
    this._className = ColumnView.CLASS_SEL_SHOW_CONVERSATION;
    this._displayName = this._createDisplayName(columnInformation);
    this._parentItemId = columnInformation.getParentItemId();
    this._itemIdList = [];
    this._waitMsgList = [];
    this._msgNestHash = {};
    this.indentSize = 20;
    this.messageBodyMinSize = 320;
    this.sidebarSize = 320;
    this.columnMinSize = 600;
    this.windowSize = $(window).width();
    this.createView();
    this._htmlElement.find('div.frm-message').css('display', 'none');
    this._htmlElement.find('a.column-toggle').css('display', 'none');
    this._titleElement = null;
    this._threadRootMessage = null;


};(function() {

    ColumnShowConversationView.prototype = $.extend({}, ColumnView.prototype);

    var _super = ColumnView.prototype;

    var _proto = ColumnShowConversationView.prototype;

    _proto.makeIndentThreadData = function(msgList){
        var _self = this;
        msgList.sort((a,b)=>{
            let at = new Date(a.getDate()).getTime();
            let bt = new Date(b.getDate()).getTime();
            return(at - bt);
        });
        function makeThreadList(msglist){
            var tmlist = [];
            for (var _i = 0; _i < msglist.length; _i++) {
                var _msg = msglist[_i];
                var _type = _msg.getType();
                if (_type == Message.TYPE_PUBLIC ||
                    _type == Message.TYPE_GROUP_CHAT ||
                    _type == Message.TYPE_COMMUNITY ||
                    _type == Message.TYPE_CHAT ||
                    _type == Message.TYPE_MURMUR) {

                    var _itemId = _msg.getItemId();
                    var _replyItemId = _msg.getReplyItemId();

                    if(!_replyItemId){
                        tmlist.splice(0,0,{
                            id:_itemId,
                            data:_msg,
                            nest: 0
                        });
                        _self._msgNestHash[_itemId] = {depth:0, lastChild:""};
                        continue;
                    }
                    if (!_self._msgNestHash[_replyItemId]) {
                        throw Error("notFoundParentMessage");
                    }
                    let parent_depth = _self._msgNestHash[_replyItemId]['depth'];
                    tmlist.push({
                        id:_itemId,
                        data:_msg,
                        nest: parent_depth + 1
                    });
                    _self._msgNestHash[_itemId] = {depth:parent_depth + 1, lastChild:""};
                }else{
                    continue;
                }
            }
            return tmlist;
        }
        var msglist2 = makeThreadList(msgList);
        return(msglist2);
    }

    _proto.getHistoryMessage = function() {
        var _self = this;
        function _onGetThreadMessage(msgList) {
            _self._hideLoadingIconInSelf();
            _self._parentItemId = msgList.get(0).getItemId();

            const makeIndentThreadMappdArrayData = function(msgList){
                var __msglist = [];
                var _count = msgList.getCount();
                for(var _i = 0; _i < _count; _i++){
                    __msglist.push(msgList.get(_i));
                }
                return _self.makeIndentThreadData(__msglist);
            };

            let msgMappingList, waitMsgMappingList = "";
            try {
                msgMappingList = makeIndentThreadMappdArrayData(msgList);
                waitMsgMappingList = _self.makeIndentThreadData(_self._waitMsgList);
            } catch (e) {
                _self.displayErrorMessage(e);
                $(window).trigger('resize');
                return;
            }
            for (let _i = 0; _i < msgMappingList.length; _i++) {
                let _msg = msgMappingList[_i];
                let _type = _msg.data.getType();
                if (_type == Message.TYPE_PUBLIC ||
                    _type == Message.TYPE_GROUP_CHAT ||
                    _type == Message.TYPE_COMMUNITY ||
                    _type == Message.TYPE_CHAT ||
                    _type == Message.TYPE_MURMUR) {
                    _self._itemIdList.push(_msg.data.getItemId());
                    _self.showHistoryMessage(_msg.data,_msg.nest);
                }
            }

            for (let _i = 0; _i < waitMsgMappingList.length; _i++) {
                let _msg = waitMsgMappingList[_i];
                let _type = _msg.data.getType();
                if (_type == Message.TYPE_PUBLIC ||
                    _type == Message.TYPE_GROUP_CHAT ||
                    _type == Message.TYPE_COMMUNITY ||
                    _type == Message.TYPE_CHAT ||
                    _type == Message.TYPE_MURMUR) {
                    let _itemId = _msg.data.getItemId();
                    if(_self.getMsgObjByItemId(_itemId)){
                        continue;
                    }
                    _self._itemIdList.push(_msg.data.getItemId());
                    _self.showHistoryMessage(_msg.data,_msg.nest);
                }
            }
            _self._threadRootMessage = msgMappingList[0].data;
            if (_self._threadRootMessage.getThreadTitle()) {
                var _targetColumnElem = _self.getHtmlElement();
                var titleElement = $(ColumnSearchView.getBorderHeaderHtml(_self._threadRootMessage));
                let category = [];
                let threadTitle = _self._threadRootMessage.getThreadTitle();
                let _threadTitle = threadTitle;
                _threadTitle = ViewUtils.replaceTenantBaseTitleCategory(_threadTitle, threadTitle, category,
                                                                        {"class":"in-conversation-colum"});
                _threadTitle = ViewUtils.replaceOrignalTitleCategory(_threadTitle, threadTitle, category,
                                                                     {"class":"in-conversation-colum"});

                let categoryArray = category.sort((a,b)=>{
                    return a.index - b.index;
                });
                let categoryStr = '';
                for(let i=0;i<categoryArray.length;i++){
                    categoryStr += categoryArray[i].data;
                }
                titleElement.html('' + categoryStr+ '<span style="font-weight:700;">' + Utils.convertEscapedHtml(_threadTitle) + '</span>');
                titleElement.attr('title', _self._threadRootMessage.getThreadTitle());
                _self._titleElement = titleElement;
                _targetColumnElem.find('div.box-border.ui-widget-content.wrap-frm-message').append(titleElement);
                _targetColumnElem.find('.message-title').remove();
            }

            _self._allMessageReceived = true;
            $(window).trigger('resize');
            _self.refreshScrollbar();
            function scrollClickMessage() {
                if(!_self.getHtmlElement().find('[itemid="' + _self.getColumnInfo().getItemId() + '"]').offset()){
                    return
                }
                var targetItemX = _self.getHtmlElement().find('[itemid="' + _self.getColumnInfo().getItemId() + '"]').offset().top;
                var scrollContentX = _self.getHtmlElement().find('.scroll_content').offset().top
                var scrollCenterHeight = _self.getHtmlElement().find('.scroll_content').height() / 2;
                var itemCenterHeight = _self.getHtmlElement().find('[itemid="' + _self.getColumnInfo().getItemId() + '"]').height() / 2;
                var scrollHeight = targetItemX - scrollContentX - scrollCenterHeight + itemCenterHeight;
                _self.getHtmlElement().find('.scroll_content').animate({scrollTop:scrollHeight}, function(){
                    var _attentionColumnBlinkTime = 500;
                    _self.getHtmlElement().find('[itemid="' + _self.getColumnInfo().getItemId() + '"]')
                        .fadeOut(_attentionColumnBlinkTime)
                        .fadeIn(_attentionColumnBlinkTime)
                        .fadeOut(_attentionColumnBlinkTime)
                        .fadeIn(_attentionColumnBlinkTime)
                });
                _self.getHtmlElement().find('.message-border').children('[itemid="' + _self.getColumnInfo().getItemId() + '"]').addClass('target-show-conversation');
            }
            ColumnManager.getInstance().bringColumnIntoView(ColumnManager.getInstance()._getColumnIndex(_self.getColumnInfo()), scrollClickMessage);
        }
        CubeeController.getInstance().getThreadMessage(_self._parentItemId, _onGetThreadMessage);
    };

    _proto.getMaxNestSize = function() {
        var _self = this;
        var max_nest = 0;
        for (let key in _self._msgNestHash) {
            max_nest = _self._msgNestHash[key]['depth'] > max_nest ? _self._msgNestHash[key]['depth'] : max_nest;
        }
        return max_nest;
    }

    _proto.getMaxColumnSize = function() {
        return this.windowSize - this.sidebarSize;
    }

    _proto.setConversationColumnSize = function(depth) {
        var _self = this;
        // Variable min_width is used like a local variable, but is missing a declaration.
        var min_width = _self.columnMinSize;
        if (depth + _self.messageBodyMinSize > min_width) {
            min_width = depth + _self.messageBodyMinSize;
        }
        var max_width = _self.getMaxColumnSize();
        var _targetColumnElem = $('.column-show-conversation-wrapper');
        if (min_width >= max_width) {
            _targetColumnElem.css("min-width",max_width+"px")
        } else {
            if (_targetColumnElem.width() < min_width) {
                _targetColumnElem.css({"min-width":min_width + "px", "width":min_width + "px"});
            } else {
                _targetColumnElem.css({"min-width":min_width + "px", "width":_targetColumnElem.width() + "px"});
            }
        }
    }

    _proto.getInsertMessageId = function(replyItemId) {
        var _self = this;
        var insertMessageId = _self._msgNestHash[replyItemId]['lastChild'];
        if (!insertMessageId) {
            return replyItemId;
        }
        while (insertMessageId) {
            var getLastChild = _self._msgNestHash[insertMessageId]['lastChild'];
            if (getLastChild) {
                insertMessageId = getLastChild;
            } else {
                return insertMessageId;
                // This statement is unreachable.
                // break;
            }
        }
    }

    _proto.showHistoryMessage = function(msg, depth, replyItemId) {
        var _self = this;

        var _targetColumnElem = _self.getHtmlElement();
        if(_targetColumnElem == null) {
            return;
        }
        var _columnContentElem = _self.getColumnContent();

        var _isReply = false;
        if(msg.getReplyItemId()){
            _isReply = true;
        }
        var _msgObj = _self.createMessageObjectOnly(msg);
        var _content = _self.getColumnMessageHtml(_msgObj, _isReply);
        if (_content == '') {
            return;
        }

        var _msgType = msg.getType();
        var shiftn = depth * _self.indentSize;
        var upperIndentLimit = _self.getMaxColumnSize() - _self.messageBodyMinSize;
        shiftn = shiftn > upperIndentLimit ? upperIndentLimit : shiftn;
        var messjq = $(_content);
        if(_msgType == Message.TYPE_CHAT){
            $(messjq).attr("style","padding-left:" + shiftn + "px");
            $(messjq).attr("msgto",msg.getTo());
            $(messjq).attr("msgfrom",msg.getFrom());
        }else{
            $('div.thread-padding',messjq).attr("style","width:" + shiftn + "px");
        }
        $(messjq).attr("msgtype",_msgType);
        _content = $(messjq);

        var _msgElem;
        let _msgElemForChat;
        if(_msgType == Message.TYPE_CHAT){
            _content = _self.createDivMessageBorder(_content);
            _self._setMessageObject(_msgObj, _content, -1);
            if(replyItemId && replyItemId.length > 0){
                var insertMessageId = _self.getInsertMessageId(replyItemId);
                _self._msgNestHash[msg.getReplyItemId()]['lastChild'] = msg.getItemId();
                let jqselector ='div.box-border.olient-vertical.chat-message';
                $(jqselector + '[itemid=' + insertMessageId + ']',_columnContentElem).parent().after(_content);
                let itemid = $(_content).attr('itemid');
                _msgElem = $(jqselector + '[itemid=' + itemid + ']',_columnContentElem);
                _msgElemForChat = $(jqselector + '[itemid=' + insertMessageId + ']',_columnContentElem).parent().next();
            }else{
                if (msg.getReplyItemId()) {
                    var insertMessageId = _self.getInsertMessageId(msg.getReplyItemId());
                    _self._msgNestHash[msg.getReplyItemId()]['lastChild'] = msg.getItemId();
                    $('div.box-border.olient-vertical.chat-message[itemid=' + insertMessageId + ']', _columnContentElem).parent().after(_content);
                    _msgElemForChat = $('div.box-border.olient-vertical.chat-message[itemid=' + insertMessageId + ']', _columnContentElem).parent().next();
                } else {
                    _columnContentElem.append(_content);
                    _msgElem = _self._getMessageElement(0).children().eq(-1);
                    _msgElemForChat = _msgElem;
                }
            }

        } else if(_isReply) {
            var _parentItemObj = _self.getMsgObjByItemId(_self._parentItemId);
            var _insertElem = _parentItemObj.getHtmlElement();
            var insertMessageId = _self.getInsertMessageId(msg.getReplyItemId());
            _self._msgNestHash[msg.getReplyItemId()]['lastChild'] = msg.getItemId();
            if(replyItemId && replyItemId.length > 0){
                let jqselector ='div.box-border.olient-horizontal.thread-message';
                let jqselectorParent ='div.box-border.olient-horizontal.thread-message';
                if(! $(jqselector + '[itemid=' + insertMessageId + ']',_insertElem)[0]){
                    jqselectorParent = 'div.box-border.olient-vertical.read-message';
                }
                $(jqselectorParent + '[itemid=' + insertMessageId + ']',_insertElem).after(_content);
                let itemid = $(_content).attr('itemid');
                _msgElem = $(jqselector + '[itemid=' + itemid + ']',_insertElem);
            }else{
                $('div.box-border[itemid=' + insertMessageId + ']:not(.flex1)', _insertElem).after(_content);
                _msgElem = $('div.box-border.olient-horizontal.thread-message[itemid=' + msg.getItemId() + ']', _insertElem);
            }
            _msgObj.setHtmlElement(_msgElem);
            var _msgObjIndex = new MessageObjectIndex(_msgObj);
            _self.addMsgObjIndexChild(_self._parentItemId, _msgObjIndex);

            _insertElem.detach();
            _columnContentElem.prepend(_insertElem);
            var _replyInsertIndex = _self.getMsgObjIndexPositionByItemId(_self._parentItemId);
            _self._getMsgObjIndexList().move(_replyInsertIndex, 0);
        } else {
            _content = _self.createDivMessageBorder(_content);
            _self._setMessageObject(_msgObj, _content, -1);
            _columnContentElem.prepend(_content);
            _msgElem = _self._getMessageElement(0).children().eq(-1);
        }
        var _linkElm = _msgElem;
        new MessageColumnLink($(_linkElm), msg);

        var _toolTipBaseElement;
        // Variable _insertedElement is used like a local variable, but is missing a declaration.
        var _insertedElement;
        if(_msgType == Message.TYPE_CHAT){
            _toolTipBaseElement = _content.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
        } else if(_isReply) {
            _toolTipBaseElement = $('div.box-border.flex1[itemid=' + $(_content).attr('itemid') + ']', _columnContentElem);
        } else {
            _insertedElement = _columnContentElem.children('div').eq(0);
            _toolTipBaseElement = _insertedElement.children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(-1);
        }

        let max_indent = _self.getMaxNestSize() * _self.indentSize;
        _self.setConversationColumnSize(max_indent);

        _self._setToolTipToMessageElem(_toolTipBaseElement, msg, _msgObj);

        let _messageElem = _linkElm;
        if(msg.getBodyType() == 1){
            if(_msgType == Message.TYPE_CHAT){
                _messageElem = _msgElemForChat;
                ViewUtils.showStampMessage(_msgElemForChat, _self);
            }else{
                ViewUtils.showStampMessage(_linkElm, _self);
            }
        }

        _self.afterCreateMessageHtml(_messageElem);
    };

    _proto.getColumnMessageHtml = function(msgObj, isReply) {
        var _ret = '';
        _ret = msgObj.getMessageHtml(isReply);
        return _ret;
    };

    _proto.createMessageObjectOnly = function(msg) {
        var _self = this;
        if (!msg || typeof msg != 'object') {
            return null;
        }
        var _msgObj = ViewUtils.createMessageObject(_self, msg);
        return _msgObj;
    };

    _proto._showMessageData = function(msg) {
        var _self = this;

        var _count = _self._itemIdList.length;

        var _itemId = msg.getItemId();

        if(_count == 0){
            for(var _i = 0; _i < _self._waitMsgList.length; _i++) {
                var _waitItemId = _self._waitMsgList[_i];
                if(_waitItemId == _itemId) {
                    return false;
                }
            }
            _self._waitMsgList.push(msg);
            return false;
        }


        for(let _i = 0; _i < _count; _i++){
            var _replyItemId = (msg.getReplyItemId)? msg.getReplyItemId() : null;
            var _showItemId = _self._itemIdList[_i];
            if(_showItemId == _itemId) {
                return false;
            }
            if(_replyItemId != null && _showItemId == _replyItemId){
                let depth = 1;
                if(_self._msgNestHash[_replyItemId]['depth'] > 0){
                    depth = _self._msgNestHash[_replyItemId]['depth'] + 1;
                }
                _self._msgNestHash[msg.getItemId()] = {depth:depth, lastChild:''};
                _self._itemIdList.push(msg.getItemId());
                _self.showHistoryMessage(msg, depth, _replyItemId);
                _self.getHtmlElement().find('.message-title').remove();
                return true;
            }
        }
        return false;
    };

    _proto._createDisplayName = function(columnInfo) {
        return Resource.getMessage('ShowConversation') + ' / ' + columnInfo.getSourceColumnDisplayName();
    };

    _proto.onGoodJobNotificationReceive = function(notification) {
        var _self = this;
        var _itemId = notification.getItemId();
        var _msgObj = _self.getMsgObjByItemId(_itemId);
        if (_msgObj == null) {
            return;
        }

        var _cachedMessage = CubeeController.getInstance().getMessage(_itemId);
        if(_cachedMessage != null){
            return;
        }

        var _message = _msgObj.getMessage();
        if (_message == null) {
            return;
        }
        var _gjJid = notification.getFromJid();
        var _goodJobList = _message.getGoodJobList();
        var _goodJobData = _goodJobList.getByJid(_gjJid);
        if (_goodJobData == null) {
            _goodJobData = new GoodJobData();
            _goodJobData.setJid(_gjJid);
            var _date = new Date(notification.getDate());
            _goodJobData.setDate(_date);
            _goodJobList.add(_goodJobData);
        }
        _msgObj.onGoodJobReceive();
    };

    _proto.onMessageOptionNotificationReceive = function(notification) {
        var _self = this;
        var _contentType = notification.getContentType();
        if (_contentType != MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE) {
            return;
        }

        var _itemId = notification.getItemId();
        var _msgObj = _self.getMsgObjByItemId(_itemId);
        if(_msgObj == null){
            return;
        }

        function _setReadMessage() {
            var _cachedMessage = CubeeController.getInstance().getMessage(_itemId);
            if(_cachedMessage != null){
                return;
            }
            var _msg = _msgObj.getMessage();
            if (_msg == null) {
                return;
            }

            var _existingReaderItem = notification.getExistingReaderItem();
            if(LoginUser.getInstance().getJid() == _existingReaderItem.getPerson().getJid()){
                if(_msg.getReadFlag() == Message.READ_STATUS_READ) {
                    return;
                }
            }

            var _existingReaderInfo = _msg.getExistingReaderInfo();
            if(_existingReaderInfo == null){
                _existingReaderInfo = new MessageExistingReaderInfo();
                _existingReaderInfo.setAllCount(1);
                _existingReaderInfo.getExistingReaderItemList().add(_existingReaderItem);
                _msg.setExistingReaderInfo(_existingReaderInfo);
                return;
            }
            var _count = _existingReaderInfo.getAllCount();
            _existingReaderInfo.setAllCount(_count + 1);
            _existingReaderInfo.getExistingReaderItemList().removeAll();
            _existingReaderInfo.getExistingReaderItemList().add(_existingReaderItem);
        }
        _setReadMessage();
        _msgObj.onMessageOptionReceive(notification);
    };

    _proto.onThreadTitleUpdateReceived = function(updateMessages, notification) {
        var _self = this;
        if (_self._titleElement && _self._titleElement[0]) {
            if (notification.getThreadTitle()) {
                let category = [];
                let threadTitle = notification.getThreadTitle();
                let _threadTitle = threadTitle;
                _threadTitle = ViewUtils.replaceTenantBaseTitleCategory(_threadTitle, threadTitle, category,
                                                                        {"class":"in-conversation-colum"});
                _threadTitle = ViewUtils.replaceOrignalTitleCategory(_threadTitle, threadTitle, category,
                                                                     {"class":"in-conversation-colum"});

                let categoryArray = category.sort((a,b)=>{
                    return a.index - b.index;
                });
                let categoryStr = '';
                for(let i=0;i<categoryArray.length;i++){
                    categoryStr += categoryArray[i].data;
                }
                _self._titleElement.html('' + categoryStr+ '<span style="font-weight:700;">' + Utils.convertEscapedHtml(_threadTitle) + '</span>');
                _self._titleElement.attr('title', Utils.convertEscapedHtml(notification.getThreadTitle()));
            } else {
                _self._titleElement.remove();
                _self._titleElement = null;
                $(window).trigger('resize');
                _self.refreshScrollbar();
            }
        } else {
            var titleElement = $(ColumnSearchView.getBorderHeaderHtml(_self._threadRootMessage));
            let category = [];
            let threadTitle = notification.getThreadTitle();
            let _threadTitle = threadTitle;
            _threadTitle = ViewUtils.replaceTenantBaseTitleCategory(_threadTitle, threadTitle, category,
                                                                    {"class":"in-conversation-colum"});
            _threadTitle = ViewUtils.replaceOrignalTitleCategory(_threadTitle, threadTitle, category,
                                                                 {"class":"in-conversation-colum"});

            let categoryArray = category.sort((a,b)=>{
                return a.index - b.index;
            });
            let categoryStr = '';
            for(let i=0;i<categoryArray.length;i++){
                categoryStr += categoryArray[i].data;
            }
            titleElement.html('' + categoryStr+ '<span style="font-weight:700;">' + Utils.convertEscapedHtml(_threadTitle) + '</span>');
            titleElement.attr('title', Utils.convertEscapedHtml(notification.getThreadTitle()));
            _self._titleElement = titleElement;
            _self.getHtmlElement().find('div.box-border.ui-widget-content.wrap-frm-message').append(titleElement);
            $(window).trigger('resize');
            _self.refreshScrollbar();
        }
    }

    _proto.isShowableMessage = function(message) {
        var _ret = false;
        var _self = this;
        var _itemIdArray = _self._itemIdList;
        if(_itemIdArray == null) {
            return _ret;
        }
        var _targetItemId = message.getItemId();
        var _targetReplyItemId = (message.getReplyItemId)? message.getReplyItemId() : null;     
        if(_targetItemId == null) {
            return _ret;
        }
        for(var _i = 0; _i < _itemIdArray.length; _i++) {
            var _compareItemId = _itemIdArray[_i];
            // Operands _compar ... == null and _compar ... == null are identical.
            if(_compareItemId == null) {
                continue;
            }
            if(_targetItemId == _compareItemId) {
                _ret = true;
                break;
            }
            if(_targetReplyItemId != null && _targetReplyItemId == _compareItemId) {
                _ret = true;
                break;
            }
        }
        return _ret;
    };

    _proto.displayErrorMessage = function(e) {
        var _self = this;
        var _columnContentElem = _self.getColumnContent();
        var _content = '<div class="column-error-message">' + Resource.getMessage('column_unexpected_error') + '</div>'
        _columnContentElem.append(_content);
    }

    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = ConversationColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new ConversationColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };

    _proto.cleanup = function() {
      _super.cleanup.call(this);
      this._className = null
      this._displayName = null
      this._parentItemId = null
      this._itemIdList = [];
      this._waitMsgList = [];
      this._msgNestHash = {};
      this.indentSize = null;
      this.messageBodyMinSize = null;
      this.sidebarSize = null;
      this.columnMinSize = null;
      this.windowSize = null;
      this._htmlElement=null;
    }
})();
