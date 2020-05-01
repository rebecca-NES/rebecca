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
 function ColumnMessageView(parent, msg) {
    var _self = this;
    _self._parent = parent;
    _self.setMessage(msg);
    _self._htmlElement = null;
    _self._goodJobButton = null;
    _self._emotionButton = null;
    _self._isShowReadMore = false;
    _self._isToolTipOwner = false;
};(function() {
    ColumnMessageView.MESSAGE_ELLIPSIS_MAX_LINES = 3;

    ColumnMessageView.MESSAGE_READ_STATUS_UNREAD_CSS_CLS = 'unread-message';
    ColumnMessageView.MESSAGE_READ_STATUS_READ_CSS_CLS = 'read-message';

    ColumnMessageView.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnMessageView.prototype;

    _proto.getMessageHtml = function() {
    };
    _proto.setHtmlElement = function(htmlElement, isToolTipOwner) {
        var _self = this;
        var msg = _self.getMessage();
        _self._htmlElement = htmlElement;
        if (_self._htmlElement) {
            var _goodjobElement = _self._htmlElement.find('div.frm-good-job').eq(0);
            if(_goodjobElement.length == 1) {
                if (isToolTipOwner != false) {
                    _self._isToolTipOwner = true;
                }
                _self._goodJobButton = new ColumnMessageGoodJobButton(_goodjobElement, _self, _self.getItemId(), msg.getGoodJobList(), _self._isToolTipOwner);
            }

            var _emotionElement = _self._htmlElement.find('div.frm-emote').eq(0);
            if (_emotionElement.length == 1) {
              if (isToolTipOwner != false) {
                  _self._isToolTipOwner = true;
              }
              _self._emotionButton = new ColumnMessageEmotionPointButton(_emotionElement, _self, _self.getItemId(), msg.getEmotionPointList(), _self._isToolTipOwner);
            }
            let hashtagElement = _self._htmlElement.find('a.hashtag');
            _self._setHashtagEvent(hashtagElement);
            var _readMoreElement = _self._htmlElement.find('a.read-more-link').eq(0);
            _self._setReadMoreEvent(_readMoreElement);

            _self._createEventHandler();
            _self._setMessageReadFlgView();

            var _messageReaderElement = _self._htmlElement.find('div.frm-existing-reader').eq(0);
            if(_messageReaderElement.length == 1) {
                _self._columnMessageExistingReaderInfoView = new ColumnMessageExistingReaderInfoView(_messageReaderElement, _self.getMessage(), _self._isToolTipOwner);
            }

            var _messageThumbnailElement = _self._htmlElement.find('img.image-thumbnail');
            var _imageMaxWidth = ColumnManager.getInstance().getImageMaxWidth();
            _messageThumbnailElement.each(function(index, el) {
                var _element = $(el);
                if(!_element.attr('src')) {
                    var _itemId = _self._msg.getItemId();
                    var url = _element.attr('data-url');
                    CubeeController.getInstance().downloadThumbnailImage(url, _itemId, _element);
                }
                _element.css('max-width', _imageMaxWidth);
            });

            ViewUtils.showOpenGraphProtocolImage(_self._htmlElement);
        }
    };
    _proto._setMessageReadFlgView = function() {
        var _self = this;
        var msg = _self.getMessage();
        var _targetRootElement = _self._getMessageElement();
        var _toggleReplyElement = _self._htmlElement.find(".toggle_reply");
        if (_self._htmlElement) {
            if(msg.getReadFlag() == Message.READ_STATUS_UNREAD){
                _targetRootElement.removeClass(ColumnMessageView.MESSAGE_READ_STATUS_READ_CSS_CLS);
                _targetRootElement.addClass(ColumnMessageView.MESSAGE_READ_STATUS_UNREAD_CSS_CLS);
                _toggleReplyElement.removeClass(ColumnMessageView.MESSAGE_READ_STATUS_READ_CSS_CLS);
                _toggleReplyElement.addClass(ColumnMessageView.MESSAGE_READ_STATUS_UNREAD_CSS_CLS);
            }else{
                _targetRootElement.removeClass(ColumnMessageView.MESSAGE_READ_STATUS_UNREAD_CSS_CLS);
                _targetRootElement.addClass(ColumnMessageView.MESSAGE_READ_STATUS_READ_CSS_CLS);
                _toggleReplyElement.removeClass(ColumnMessageView.MESSAGE_READ_STATUS_UNREAD_CSS_CLS);
                _toggleReplyElement.addClass(ColumnMessageView.MESSAGE_READ_STATUS_READ_CSS_CLS);
            }
        }
    };
    _proto.updateMessageReadStatus = function(readFlag) {
        var _self = this;
        var _msg = _self.getMessage();
        _msg.setReadFlag(readFlag);
        _self._setMessageReadFlgView();
    };
    _proto.cleanup = function() {
        if(this._goodJobButton != null) {
            this._goodJobButton.cleanup();
            delete this._goodJobButton;
        }
        this._goodJobButton = null;
        var _itemId = this._msg.getItemId();
        if (this.getParent().getType() != ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION) {
            CubeeController.getInstance().onRemoveMessageView(_itemId);
        }
        delete this._parent;
        delete this._htmlElement;
        delete this._msg;
    };
    _proto.getGoodJobButton = function() {
        return this._goodJobButton;
    };
    _proto.getMessage = function() {
        if(this._msg == null) {
            return null;
        }
        var _cashedMessage = CubeeController.getInstance().getMessage(this._msg.getItemId());
        if(_cashedMessage != null) {
            this._msg = _cashedMessage;
        }
        return this._msg;
    };
    _proto.setMessage = function(msg) {
        if (_validation({'msg' : msg}) == false) {
            return;
        }
        this._msg = msg;
        this._itemId = msg.getItemId();
    };
    _proto.getParent = function() {
        return this._parent;
    };
    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _targetRootElement = _self._getMessageElement();
        _targetRootElement.on("click", function(){
            _self._setReadMessage();
        });
    };
    _proto._setReadMoreEvent = function(readMoreElement) {
        var _self = this;
        if (readMoreElement) {
            readMoreElement.on('click', function() {
                _self.changeMessage();
                return false;
            });
        }
    };
    _proto._setHashtagEvent = function(element) {
        var _self = this;
        if (element) {
            element.on('click', function() {
                ContextSearchView.getInstance().search($(this).text(), _self.getParent(), true);
            });
        }
    };

    _proto._getMessageElement = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _targetRootElement = _rootElement.find("div[itemId = '" + _self.getItemId() + "']");
        var _isThread = _rootElement.hasClass('thread-message');
        if(_isThread){
            _targetRootElement = _rootElement;
        }
        return _targetRootElement;
    };
    _proto._setReadMessage = function(){
        var _self = this;
        var _message = _self.getMessage();
        ReadMessageSetter.setReadMessage(_message);
    };
    _proto.sendGoodJob = function() {
        var _self = this;
        var _itemId = _self.getItemId();
        function sendGoodJobCallback(result) {
        }
        var _message = _self.getMessage();
        if (_message == null) {
            return;
        }
        var _userJid = LoginUser.getInstance().getJid();
        if (_userJid == null || _userJid == '') {
            return;
        }
        if (_message.getGoodJobList().getByJid(_userJid)) {
            return;
        }
        var _ret = CubeeController.getInstance().sendGoodJob(_itemId, sendGoodJobCallback);

        if(_ret){
            var _notification = _createGoodJobNotificationForNotifyToMySelf();

            var _goodJobList = _message.getGoodJobList();
            var _goodJobData = _goodJobList.getByJid(_userJid);
            _goodJobData = new GoodJobData();
            _goodJobData.setJid(_userJid);
            _goodJobData.setDate(new Date(_notification.getDate()));
            _goodJobData.setNickName(_notification.getNickName());
            _goodJobData.setAvatarType(_notification.getAvatarType());
            _goodJobData.setAvatarData(_notification.getAvatarData());
            _goodJobData.setLoginAccount(_notification.getLoginAccount());
            _goodJobData.setStatus(_notification.getStatus());
            _goodJobList.add(_goodJobData);

            ColumnManager.getInstance().onNotification(_notification);
        }

        function _createGoodJobNotificationForNotifyToMySelf(){
            var _jid = LoginUser.getInstance().getJid();
            var _person = CubeeController.getInstance().getPersonData(_jid);

            var _goodJobNotification = new GoodJobNotification();
            _goodJobNotification.setItemId(_itemId);
            _goodJobNotification.setFromJid(_jid);
            _goodJobNotification.setFromName(_person.getUserName());
            _goodJobNotification.setDate(new Date());
            _goodJobNotification.setNickName(_person.getUserName());
            _goodJobNotification.setAvatarType(_person.getAvatarType());
            _goodJobNotification.setAvatarData(_person.getAvatarData());
            _goodJobNotification.setLoginAccount(_person.getLoginAccount());
            _goodJobNotification.setStatus(_person.getStatus());

            return _goodJobNotification;
        }
    };
    _proto.onGoodJobReceive = function() {
        var _self = this;
        if(_self._goodJobButton != null) {
            _self._goodJobButton.onGoodJobReceive();
        }
    };
    _proto.sendEmotionPoint = function(emotionValue) {
        var _self = this;
        var _itemId = _self.getItemId();
        if (emotionValue !=0 && !emotionValue) {
            return;
        }
        CubeeController.getInstance().sendEmotionPoint(_itemId, emotionValue, function(){});
    }
    _proto.onEmotionPointReceive = function() {
        var _self = this;
        if(_self._emotionButton != null) {
            _self._emotionButton.onEmotionPointReceive();
        }
    };
    _proto.onMessageOptionReceive = function(messageOptionNotification) {
        var _self = this;
        if (_validation({'messageOptionNotification' : messageOptionNotification}) == false) {
            return;
        }
        var _type = messageOptionNotification.getType();
        if(_type != Notification_model.TYPE_MESSAGE_OPTION){
            return;
        }
        _self._onSetReadMessageReceive(messageOptionNotification);
    };
    _proto._onSetReadMessageReceive = function(messageOptionNotification) {
        var _self = this;
        if (_validation({'messageOptionNotification' : messageOptionNotification}) == false) {
            return;
        }
        var _type = messageOptionNotification.getType();
        if(_type != Notification_model.TYPE_MESSAGE_OPTION){
            return;
        }
        var _contentType = messageOptionNotification.getContentType();
        if (_contentType != MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE) {
            return;
        }

        var _message = _self.getMessage();
        if(_message == null){
            return;
        }

        var _messageType = _message.getType();
        if (_messageType == Message.TYPE_PUBLIC) {
            return;
        }
        if(_self._columnMessageExistingReaderInfoView != null) {
            _self._columnMessageExistingReaderInfoView.onSetReadMessageReceive();
            return;
        }

        var _messageExsitingReaderInfo = _message.getExistingReaderInfo();
        if(_messageExsitingReaderInfo == null){
            return;
        }

        var _existingReaderInfoHtml = ColumnMessageExistingReaderInfoView.getHtml(_messageExsitingReaderInfo);
        var _existingReaderInfoElement = $(_existingReaderInfoHtml);
        var _rootElement = _self._htmlElement;
        _rootElement.find('.pack-end:first').prepend(_existingReaderInfoElement);
        _self._columnMessageExistingReaderInfoView = new ColumnMessageExistingReaderInfoView(_existingReaderInfoElement, _self.getMessage(), _self._isToolTipOwner);
    };
    _proto.changeMessage = function() {
        var _self = this;
        var _isReadMore = _self.getMessage().isReadMore();
        var _targetHtmlElement = _self._htmlElement.find('div.box-border[itemid=\'' + _self.getItemId() + '\']');
        var _messageBodyElement = _targetHtmlElement.find('div.message-body');
        var _thumbnailHtml = _targetHtmlElement.find('.thumbnail-area').prop('outerHTML');
        var _titleArea = _targetHtmlElement.find('.message-title');
        var _titleHtml = _titleArea.length ? _titleArea.prop('outerHTML') : "";
        var _noteArea = _targetHtmlElement.find('.message-body-note');
        var _noteHtml = _noteArea.length ? _noteArea.prop('outerHTML') : "";
        var _message = ViewUtils.removeAttachmentUrl(_self.getMessage().getMessage());
        let _messageType = _self.getMessage().getType();
        var _targetInnerHtml;
        if((_messageType == Message.TYPE_PUBLIC ||
           _messageType == Message.TYPE_CHAT ||
           _messageType == Message.TYPE_GROUP_CHAT ||
            _messageType == Message.TYPE_COMMUNITY) &&
           _self.getMessage().getBodyType() != 1){
            _targetInnerHtml = getReadMoreMessageOverMaxLength(
                _self.getMessage().getUIShortenUrls(),
                _message,
                true,
                _self.getMessage().getItemId(),
                _isReadMore);
        }else{
            _targetInnerHtml = getReadMoreMessage(
                _self.getMessage().getUIShortenUrls(),
                _message,
                true,
                _self.getMessage().getItemId(),
                _isReadMore)
        }
        if (_thumbnailHtml) {
            _targetInnerHtml += _thumbnailHtml;
        }
        if (_titleHtml || _noteHtml) {
            _targetInnerHtml = _titleHtml + _noteHtml + _targetInnerHtml;
        }
        _messageBodyElement.html(_targetInnerHtml);
        if(_isReadMore && !(_messageType == Message.TYPE_PUBLIC ||
                            _messageType == Message.TYPE_CHAT ||
                            _messageType == Message.TYPE_GROUP_CHAT ||
                            _messageType == Message.TYPE_COMMUNITY) ){
            _targetHtmlElement.find('.thumbnail-area').hide();
        }else{
            _targetHtmlElement.find('.thumbnail-area').show();
        }
        _self.getMessage().setReadMore(!_isReadMore);
        let hashtagElement = $(_messageBodyElement).find('a.hashtag');
        _self._setHashtagEvent(hashtagElement);
        var _readMoreElement = $(_messageBodyElement).find('a.read-more-link').eq(0);
        _self._setReadMoreEvent(_readMoreElement);
    };
    _proto.getMessageHeaderHtml = function() {
        var _self = this;
        var _ret = '';
        var _msg = _self.getMessage();
        var _itemId = _self.getItemId();
        var _id = _msg.getId();
        var _from = _msg.getFrom();
        var _profile = _msg.getProfileByJid(_from);
        var _person = new Person();
        _person.setJid(_from);
        _person._profile = _profile;
        var _nickname = _person.getUserName();
        if(_nickname == null || _nickname == ''){
            _nickname = ViewUtils.getUserName(_from);
        }
        var _accountName = _person.getLoginAccount();
        if(_accountName == null || _accountName == ''){
            _accountName = ViewUtils.getCubeeAccountName(_from);
        }
        // Variable '_person' cannot be of type null, but it is compared to an expression of type null.
        // var _status =(_person != null)? _person.getStatus() : Person.PROFILE_STATUS_ACTIVE;
        var _status = _person.getStatus();
        var _date = Utils.getDate(_msg.getDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);
        var _updateDate = (_msg.getUpdatedAt()) ? Date.create(_msg.getUpdatedAt()).format(Utils.DISPLAY_STANDARD_DATE_FORMAT) : "";
        var _avatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(_person);
        _ret += '<div class="box-border olient-horizontal message-header">';
        _ret += '<div class="message-info" messageid="' + (_id == null ? '' : _id) + '" itemid="' + _itemId + '" />';
        if(ViewUtils.isIE89()) _ret += '<table><tr><td>';
        _ret += _avatarHtml;
        if(ViewUtils.isIE89()) _ret += '</td><td width="100%">';
        _ret += '<div class="flex1 block-info">';
        _ret += '<div class="sender-name text-overflow-ellipsis-nosize box-border-for-abbreviation"';
        _ret += ' title="' + Utils.convertEscapedTag(_nickname);
        _ret += ViewUtils.getUserStatusString(_status);
        _ret += ' @' + Utils.convertEscapedTag(_accountName) + '">';
        _ret += Utils.convertEscapedHtml(_nickname);
        _ret += ViewUtils.getUserStatusString(_status);
        _ret += '<span class="sender-account">@' + Utils.convertEscapedHtml(_accountName) + '</span></div>';
        var _dateTitle = "";
        if (_updateDate) {
            _dateTitle = "投稿: " + _date + '\n編集: ' + _updateDate;
            _ret += '<div class="message-time" title="'+_dateTitle+'">' + _date + ' (編集済み)</div>';
        } else {
            _dateTitle = "投稿: " + _date;
            _ret += '<div class="message-time" title="'+_dateTitle+'">' + _date + '</div>';
        }
        _ret += '</div>';
        if(ViewUtils.isIE89()) _ret += '</td></tr></table>';
        _ret += '</div>';
        return _ret;
    };

    _proto.getMessageHeaderHtmlFromObj = function(_messageObj) {
        var _self = this;
        var _ret = '';
        _ret = _getMessageHeaderHtmlFromObj(_messageObj);
        return _ret;
    }

    function _getMessageHeaderHtmlFromObj(messageObj) {
        var _ret = '';
        var _msg = messageObj;
        var _itemId = messageObj.getItemId();
        var _id = _msg.getId();
        var _from = _msg.getFrom();
        var _profile = _msg.getProfileByJid(_from);
        var _person = new Person();
        _person.setJid(_from);
        _person._profile = _profile;
        var _nickname = _person.getUserName();
        if(_nickname == null || _nickname == ''){
            _nickname = ViewUtils.getUserName(_from);
        }
        var _accountName = _person.getLoginAccount();
        if(_accountName == null || _accountName == ''){
            _accountName = ViewUtils.getCubeeAccountName(_from);
        }
        // Variable '_person' cannot be of type null, but it is compared to an expression of type null.
        // var _status =(_person != null)? _person.getStatus() : Person.PROFILE_STATUS_ACTIVE;
        var _status = _person.getStatus();
        var _date = Utils.getDate(_msg.getDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);
        var _updateDate = (_msg.getUpdatedAt()) ? Date.create(_msg.getUpdatedAt()).format(Utils.DISPLAY_STANDARD_DATE_FORMAT) : "";
        var _avatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(_person);
        _ret += '<div class="box-border olient-horizontal message-header">';
        _ret += '<div class="message-info" messageid="' + (_id == null ? '' : _id) + '" itemid="' + _itemId + '" />';
        if(ViewUtils.isIE89()) _ret += '<table><tr><td>';
        _ret += _avatarHtml;
        if(ViewUtils.isIE89()) _ret += '</td><td width="100%">';
        _ret += '<div class="flex1 block-info">';
        _ret += '<div class="sender-name text-overflow-ellipsis-nosize box-border-for-abbreviation"';
        _ret += ' title="' + Utils.convertEscapedTag(_nickname);
        _ret += ViewUtils.getUserStatusString(_status);
        if (_from) {
            _ret += ' @' + Utils.convertEscapedTag(_accountName) + '">';
        } else {
            _ret += '">';
        }
        _ret += Utils.convertEscapedHtml(_nickname);
        _ret += ViewUtils.getUserStatusString(_status);
        if (_from) {
            _ret += '<span class="sender-account">@' + Utils.convertEscapedHtml(_accountName) + '</span></div>';
        } else {
            _ret += '</div>';
        }
        var _dateTitle = "";
        if (_updateDate) {
            _dateTitle = "投稿: " + _date + '\n編集: ' + _updateDate;
            _ret += '<div class="message-time" title="'+_dateTitle+'">' + _date + ' (編集済み)</div>';
        } else {
            _dateTitle = "投稿: " + _date;
            _ret += '<div class="message-time" title="'+_dateTitle+'">' + _date + '</div>';
        }
        _ret += '</div>';
        if(ViewUtils.isIE89()) _ret += '</td></tr></table>';
        _ret += '</div>';
        return _ret;
    };

    _proto.getMessageBodyHtml = function() {
        var _self = this;
        var _ret = '';
        var _msg = _self.getMessage();
        _ret = _getMessageBodyHtml(_msg);
        return _ret;
    };
    ColumnMessageView.getMessageBodyHtml = function(message) {
        var _ret ='';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageBodyHtml(message);
        return _ret;
    };
    function _getMessageBodyHtml(msg) {
        var _ret = '';
        var _messageType = msg.getType();
        var _romMessage = msg.getMessage();
        var _urlList = ViewUtils.extractUrls(_romMessage);
        var _message = ViewUtils.removeAttachmentUrl(_romMessage);
        var _deleteFlag = msg.getDeleteFlag();
        var _realBody = '';
        if ((_messageType == Message.TYPE_PUBLIC ||
            _messageType == Message.TYPE_CHAT ||
            _messageType == Message.TYPE_GROUP_CHAT ||
             _messageType == Message.TYPE_COMMUNITY ||
             _messageType == Message.TYPE_MURMUR) &&
            msg.getBodyType() != 1 ) {
            _realBody = getReadMoreMessageOverMaxLength(msg.getUIShortenUrls(), _message, false, msg.getItemId(), true);
        } else {
            _realBody = ViewUtils.urlAutoLink(msg.getUIShortenUrls(), _message, true, null, false, msg.getItemId());
        }
        _realBody = ViewUtils.replaceHashtagElement(_realBody);
        if(_deleteFlag == 2){ 
            _realBody = _realBody.replace("deleted_by_admin", Resource.getMessage('deleted_message_body_by_admin'));
            _realBody = _realBody.replace("deleted", Resource.getMessage('deleted_message_body'));
        }
        _ret += '<div class="box-border olient-vertical message-info">';
        _ret += '<div class="message-body';
        if(_messageType===Message.TYPE_TASK && msg.getStatus() >= TaskMessage.STATUS_ASSIGNING ){
            _ret += ' hide-view';
        }
        _ret += '">';
        if (msg.getThreadTitle() && _deleteFlag != 2) {
            let category = [];
            let threadTitle = msg.getThreadTitle();
            let _threadTitle = threadTitle;
            _threadTitle = ViewUtils.replaceTenantBaseTitleCategory(_threadTitle, threadTitle, category);
            _threadTitle = ViewUtils.replaceOrignalTitleCategory(_threadTitle, threadTitle, category);

            let categoryArray = category.sort((a,b)=>{
                return a.index - b.index;
            });
            let categoryStr = '';
            for(let i=0;i<categoryArray.length;i++){
                categoryStr += categoryArray[i].data;
            }
            _ret += '<pre class="message-title">' + categoryStr
                  + '<span style="font-weight:700;">'+ Utils.convertEscapedHtml(_threadTitle) + '</span></pre>';
        }
        if (msg.getNoteUrl() && msg.getNoteTitle() && _deleteFlag != 2) {
            _ret += _getMessageBodyAssignNoteHtml(msg);
        }
        _ret += _realBody;
        _ret += _getMessageBodyThumbnailImageHtml(msg);
        var quotation = msg.getQuotationItem();
        if (quotation && _deleteFlag == 0) {
            if (!quotation.getItemId()) {
                quotation.setItemId("mask_itemId");
            }
            var _quoteHeader = '';
            var _quoteBodyClass = 'message-body-quote-anonymous';
            if (quotation.getFrom()){
                _quoteHeader = _getMessageHeaderHtmlFromObj(quotation);
                _quoteBodyClass = 'message-body-quote';
            }
            var _quoteBody = ViewUtils.urlAutoLink(quotation.getUIShortenUrls(), ViewUtils.removeAttachmentUrl(quotation.getMessage()), true, null, false, msg.getItemId());
            _ret += '      <div class="quote_in_message scroll_content">\
                              '+_quoteHeader+'\
                              <div class='+_quoteBodyClass+'>\
                              '+_quoteBody+'\
                              '+_getMessageBodyThumbnailImageHtml(quotation)+'\
                              </div>\
                           </div>';
        }
        _ret += '</div>';
        if (!ViewUtils.isIE89()) {
            _ret += '<table class="actionToolBarTable"><tr>';
            _ret += '<td class="actionToolBarBase"></td>';
            _ret += '<td class="goodJobBase">';
        }
        _ret += '<div class="box-border pack-end good-job">';
        _ret += _getMessageExistingReaderHtml(msg);
        if (_messageType == Message.TYPE_PUBLIC || _messageType == Message.TYPE_SYSTEM || _messageType == Message.TYPE_GROUP_CHAT ||
            _messageType == Message.TYPE_COMMUNITY || _messageType == Message.TYPE_CHAT || _messageType == Message.TYPE_MURMUR) {
            _ret += ColumnMessageGoodJobButton.getHtml(msg.getGoodJobList());
            _ret += ColumnMessageEmotionPointButton.getHtml(msg.getEmotionPointList(), msg.getEmotionIconList());
        }
        _ret += '</div>';
        if (!ViewUtils.isIE89()) {
            _ret += '</td></tr></table>';
        }
        _ret += '</div>';
        return _ret;
    };
    function _getMessageExistingReaderHtml(message){
        var _ret = '';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        if (message.getType() == Message.TYPE_PUBLIC) {
            var _readerLink = Resource.getMessage('existing_reader_link');
            _ret += '<div class="frm-existing-reader not-read-message">';
            _ret += '<span class="frm-existing-reader-link txt_btn" title="' + _readerLink + '">';
            _ret += _readerLink;
            _ret += '</span>';
            _ret += '</div>';
            return _ret;
        }
        var _messageExistingReaderInfo = message.getExistingReaderInfo();
        if(_messageExistingReaderInfo == null){
            return _ret;
        }
        var _allCount = _messageExistingReaderInfo.getAllCount();
        if(_allCount == 0){
            return _ret;
        }
        _ret = ColumnMessageExistingReaderInfoView.getHtml(_messageExistingReaderInfo);
        return _ret;
    };
    _proto.getMessageBodyThumbnailImageHtml = function(msg) {
        var _ret = '';
        _ret = _getMessageBodyThumbnailImageHtml(msg);
        return _ret;
    };
    function _getMessageBodyThumbnailImageHtml(msg) {
        var _ret = '';
        var _romMessage = msg.getMessage();
        var _messageRemoveAttach = ViewUtils.removeAttachmentUrl(_romMessage).replace(/\n+$/g, '');
        var _messageItemId = msg.getItemId();
        var _urlList = ViewUtils.extractUrls(_romMessage);
        var _urlCount = _urlList.getCount();
        if(_urlCount > 0) {
            _ret += '<div class="thumbnail-area olient-horizontal" ';
            if (msg.getType() === Message.TYPE_TASK && msg.getStatus() == TaskMessage.STATUS_INBOX) {
            } else if ((msg.getType() === Message.TYPE_TASK && msg.getStatus() >= TaskMessage.STATUS_ASSIGNING)){
                _ret += ' style="display: none;"';
            }
            _ret += '">';
            var _imgCount = 0;
            var _thumbnailCount = 0;
            for(var _i = 0 ; _i < _urlCount; _i++) {
                var _imgElem = ViewUtils.getThumbnailImageHtml(_urlList.get(_i), _romMessage, _messageItemId);
                if (_imgElem == '') {
                    _thumbnailCount += 1;
                } else {
                    _imgCount +=  1;
                }
            }
            var _showCount = 0;
            for(var _i = 0 ; _i < _urlCount; _i++) {
                var _imgHtml = ViewUtils.getThumbnailImageHtml(_urlList.get(_i), _romMessage, _messageItemId);
                if(_imgHtml == '' && _thumbnailCount == 1) {
                    _imgHtml = '<div class="ogp-area" value="'+_urlList.get(_i)+'"></div>';
                }
                _ret += _imgHtml;
            }
            _ret += '</div>';
        }
        return _ret;
    };

    function _getMessageBodyAssignNoteHtml(msg) {
        var _ret = '';
        var _noteTitle = Utils.convertEscapedHtml(decodeURIComponent(msg.getNoteTitle()));
        return _ret = '\
            <div class="message-body-note">\
                <a href="' + msg.getNoteUrl() + ' " target="_brank" title="' + _noteTitle + '">\
                    <i class="fa fa-pencil-square-o"></i>\
                    ' + _noteTitle + '\
                </a>\
            </div>\
        ';
    }

    _proto._editStart = function(mode, callback) {
        var _self = this;
        var register = new TaskRegister(_self, _self.getMessage(), mode);
        var _taskRegisterForm = register.getRegisterForm();
        var _dialogAreaElement = $('#modal_area');
        _dialogAreaElement.html(_taskRegisterForm);
        var _dialogInnerElement = _dialogAreaElement.children();
        _dialogAreaElement.css('display', 'block');
        _dialogAreaElement.prepend('<div class="overlay modal_exit"></div>');
        _dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        $('.overlay').animate({ 'opacity':0.3}, 200 );
    };
    _proto._editEnd = function(callback) {
        if (callback && typeof callback == 'function') {
            callback();
        }

        ViewUtils.modal_allexit();
    };
    _proto._invisibleEditView = function(messageBlock) {
        var _self = this;
        messageBlock.find('div.register-task-label').hide();
    }
    _proto._hideMessageView = function() {
        var _self = this;
        var _messageBlock = _self.getHtmlElement();
        if(_messageBlock == null){
            return;
        }
        if(_messageBlock.hasClass('message-border')) {
            _messageBlock = _messageBlock.children(':first');
        }
        _messageBlock.children().addClass('display-none');
    };
    _proto._showMessageView = function() {
        var _self = this;
        var _messageBlock = _self.getHtmlElement();
        if(_messageBlock == null){
            return;
        }
        if(_messageBlock.hasClass('message-border')) {
            _messageBlock = _messageBlock.children(':first');
        }
        _messageBlock.children().removeClass('display-none')
        _messageBlock.attr('style', '');
    };
    _proto._showTaskEditView = function(register) {
        var _self = this;
        var _messageBlock = _self.getHtmlElement();
        if(_messageBlock == null){
            return;
        }
        if(_messageBlock.hasClass('message-border')) {
            _messageBlock = _messageBlock.children(':first');
        }
        var _taskRegisterForm = register.getRegisterForm();
        if(_messageBlock.hasClass('olient-horizontal')) {
            _taskRegisterForm.addClass('flex1');
        }
        _messageBlock.append(_taskRegisterForm);
        register._addTextareaAutosize(_messageBlock.find('div.task-register-area'));
        register._addSelectBoxControlEvent(_messageBlock.find('div.task-register-area'));
    }
    _proto._hideTaskEditView = function() {
        var _self = this;
        var _messageBlock = _self.getHtmlElement();
        if(_messageBlock == null){
            return;
        }
        if(_messageBlock.hasClass('message-border')) {
            _messageBlock = _messageBlock.children(':first');
        }
        _messageBlock.children('div.task-register-area').remove();
    }
    _proto.onClickTaskAdd = function() {
        var _self = this;
        _self._editStart(TaskRegister.mode_add, undefined);
    }
    _proto.onClickTaskEdit = function() {
        var _self = this;
        _self._editStart(TaskRegister.mode_edit, undefined);
    }
    _proto.onTaskRegist = function(register){
        var _self = this;
        register.registTask(_callback);
        function _callback(result) {
            if(result) {
                _self._editEnd(undefined);
            }
        };
    };
    _proto.onTaskEditCancel = function() {
        var _self = this;
        _self._editEnd(undefined);
    };
    _proto.onAddMessageReferCount = function() {
        var _self = this;
        var _message = _self.getMessage();
        if(_message == null){
            return;
        }
        var _itemId = _message.getItemId();
        CubeeController.getInstance().onAddMessageView(_itemId);
    };
    _proto.getMessageFooterHtml = function() {
        var _ret = '';
        _ret += '<div class="message-footer">' + '</div>';
        return _ret;
    };

    _proto.setMessageInnerActionToolTip = function() {
    };

    ColumnMessageView.updateMessageAvatarToolTip = function(jid) {
        if (_validation({'jid' : jid}) == false) {
            return false;
        }
        var _updateElems = $('div.column-content').find('div.block-avatar[jid=\'' + jid + '\']');
        var _count = _updateElems.length;
        var _currentIndex = 0;
        function _updateAvatarToolTip() {
            if(_currentIndex >= _count) {
                return;
            }
            setTimeout(function() {
                var _updateElem = _updateElems.eq(_currentIndex);
                var _mtipData = _updateElem.data('mTip');
                if(_mtipData){
                    var _mTipElem = $('#' + _mtipData.tipID);
                    if(_mTipElem.length > 0 && _mTipElem.css('display') != 'none'){
                        TooltipView.getInstance().updateAvatarToolTip(_updateElem);
                    }
                }
                _currentIndex++;
                _updateAvatarToolTip();
            }, 1);
        }
        _updateAvatarToolTip();
        return true;
    };
    ColumnMessageView.updateMessageAvatarProfile = function(jid) {
        if (_validation({'jid' : jid}) == false) {
            return false;
        }
        var _personName = ViewUtils.getUserName(jid);
        var _updateAvaterElems = $('div.column-content').find('div.block-avatar[jid=\'' + jid + '\']');
        for(var _i = 0; _i < _updateAvaterElems.length; _i++) {
            var _updateAvaterElem = _updateAvaterElems.eq(_i);
            var _updateParentElem = _updateAvaterElem.parent();
            var _updateNickNameElems = _updateParentElem.find('div.block-info div.sender-name');
            _updateAvaterElem.remove();
            _updateParentElem.prepend(ViewUtils.getAvatarDataHtml(jid));
            _updatedAvaterElem = _updateParentElem.find('div.block-avatar[jid=\'' + jid + '\']');
            _updateNickNameElems.text(Utils.convertEscapedHtml(_personName));
            TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, _updatedAvaterElem, true);
        }
        return true;
    };

    function isOverLinesMessage(message, lines) {
        if (_validation({'message' : message}) == false) {
            return false;
        }

        if(lines < message.split("\n").length) {
            return true;
        }
        return false;
    };
    function getReadMoreMessage(shortenUrls, message, abbreviationFlg, itemId, isReadMore) {
        if (_validation({'message' : message}) == false) {
            return message;
        }

        var _message = message.replace(/\n+$/g, '');

        var _overLinesFlg = isOverLinesMessage(_message, ColumnMessageView.MESSAGE_ELLIPSIS_MAX_LINES);
        if(_overLinesFlg) {
            var _targetStr = null;
            var _readMoreLink = null;
            if (isReadMore) {
                _targetStr = subStringMessage(_message, abbreviationFlg);
                _readMoreLink = '<div class="read-more-link-base"><span class="read-more-comment">...</span><a href class="read-more-link">' + Resource.getMessage('whole_text') + '</a></div>';
            }
            else {
                _targetStr = _message;
                _readMoreLink = '<div class="read-more-link-base"><span class="read-more-comment">&nbsp;</span><a href class="read-more-link">' + Resource.getMessage('abbreviation') + '</a></div>';
            }
            var _rtnHtmlStr = ViewUtils.urlAutoLink(shortenUrls, _targetStr, true, null, false, itemId);
            _rtnHtmlStr = ViewUtils.replaceHashtagElement(_rtnHtmlStr);
            return _rtnHtmlStr.replace("</pre>", "</pre>" + _readMoreLink);
        } else {
            return ViewUtils.urlAutoLink(shortenUrls, _message, true, null, false, itemId);
        }
    };
    function getReadMoreMessageOverMaxLength(shortenUrls, message, abbreviationFlg, itemId, isReadMore) {
        if (_validation({'message' : message}) == false) {
            return message;
        }

        var _message = message.replace(/\n+$/g, '');

        var _messageLen = ViewUtils.getCalculattionBody(_message);
        if(_messageLen > Conf.getVal('MESSAGE_BODY_MAX_LENGTH')) {
            var _targetStr = null;
            var _readMoreLink = null;
            if (isReadMore) {
                _targetStr = ViewUtils.getSubstringBody(_message, Conf.getVal('MESSAGE_BODY_MAX_LENGTH'));
                _readMoreLink = '<div class="read-more-link-base"><span class="read-more-comment">...</span><a href class="read-more-link">' + Resource.getMessage('whole_text') + '</a></div>';
            }
            else {
                _targetStr = _message;
                _readMoreLink = '<div class="read-more-link-base"><span class="read-more-comment">&nbsp;</span><a href class="read-more-link">' + Resource.getMessage('abbreviation') + '</a></div>';
            }
            var _rtnHtmlStr = ViewUtils.urlAutoLink(shortenUrls, _targetStr, true, null, false, itemId);
            _rtnHtmlStr = ViewUtils.replaceHashtagElement(_rtnHtmlStr);
            return _rtnHtmlStr.replace("</pre>", "</pre>" + _readMoreLink);
        } else {
            return ViewUtils.urlAutoLink(shortenUrls, _message, true, null, false, itemId);
        }
    };
    function subStringMessage(message, abbreviationFlg) {
        if (_validation({'message' : message}) == false) {
            return message;
        }

        var _splitMsg = message.split("\n");
        if(ColumnMessageView.MESSAGE_ELLIPSIS_MAX_LINES < _splitMsg.length) {
            var _rtnMsg = "";
            for(var i = 0; i < ColumnMessageView.MESSAGE_ELLIPSIS_MAX_LINES; i++) {
                _rtnMsg += _splitMsg[i] + "\n";
            }
            return _rtnMsg;

        } else {
            return message;
        }
    };
    function _validation(args) {
        for (var p in args) {
            if (p == 'message') {
                if (!args[p] || typeof args[p] != 'string') {return false;}
            } else if (p == 'msg') {
                if (!args[p] || typeof args[p] != 'object') {return false;}
            } else if (p == 'messageOptionNotification') {
                if (args[p] == null || typeof args[p] != 'object' || args[p].getType == null) {return false;}
            } else if (p == 'jid') {
                if (args[p] == null || typeof args[p] != 'string') {return false;}
            }

        }
        return true;
    };

})();
