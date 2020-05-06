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
function ColumnInboxMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnInboxMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if(_type != Message.TYPE_TASK) {
        console.log('ColumnInboxMessageView::new _ invalid type:' + _type);
        return;
    }
    ColumnMessageView.call(this, parent, msg);
    this._timerId = null;
    this._isMessageExpand = false;
};(function() {
    ColumnInboxMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnInboxMessageView.prototype;

    _proto.cleanup = function() {
        var _self = this;
        var _message = _self._msg;
        var _itemId = _message.getItemId();
        var _parentItemId = _message.getParentItemId();
        var _siblingTaskList = _message.getSiblingTaskDataList();
        _super.cleanup.call(_self);
        if(_parentItemId != null && _parentItemId != ''){
            CubeeController.getInstance().onRemoveParentMessageRefarence(_parentItemId);
        }
        var _siblingTaskList = _message.getSiblingTaskDataList();
        var _sblingCount = _siblingTaskList.getCount();
        for(var _i = 0; _i < _sblingCount; _i++){
            var _siblingTask = _siblingTaskList.get(_i);
            var _siblingItemId = _siblingTask.getSiblingItemId();
            CubeeController.getInstance().onRemoveMessageView(_siblingItemId);
        }
    };


    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
        var _rootElement = _self._htmlElement;
        var _message = _self.getMessage();
        var _itemId = _self.getItemId();
        var _refItemId = _message.getReferenceMessageItemId();
        var _refMsgType = getMsgTypeFromReplyId(_refItemId);
        if(_refMsgType == Message.TYPE_MAIL){
            var _mailBodyElm = _rootElement.find('div.mail-body').children();
            _mailBodyElm.on('click',function() {
               CubeeController.getInstance().getMailBody(_refItemId, _onGetMailBody);
            });
            function _onGetMailBody(mailBodyInfo){
                if(mailBodyInfo == null || typeof mailBodyInfo != 'object'){
                    return false;
                }
                var _mailBody = mailBodyInfo.getBody();
                winOpenMailBody(_mailBody);
                return false;
            };
            function winOpenMailBody(mailBody){
                var _mailBodyWindow;
                if(LayoutManager.isMobile) {
                    _mailBodyWindow = window.open('', '', 'scrollbars=1');
                } else {
                    _mailBodyWindow = window.open('', '', 'width=' + ColumnMailMessageView.MAIL_BODY_WINDOW_WIDTH + ', height=' + ColumnMailMessageView.MAIL_BODY_WINDOW_HEIGHT + ', scrollbars=1');
                }
                _mailBodyWindow.document.write(Utils.convertEscapedHtml(mailBody,true));
                return false;
            };
        }
        if(_message.getStatus() == TaskMessage.STATUS_ASSIGNING) {
            var _siblingTaskDataList = _message.getSiblingTaskDataList();
            var _siblingTaskCount = _siblingTaskDataList.getCount();
            if(_siblingTaskCount > 0) {
                var _taskSiblingArea = _rootElement.find('div.task-sibling-area');
                TooltipView.getInstance().createSiblingTaskTooltip(_taskSiblingArea, _siblingTaskDataList);
            }
            var _demandStatus = _message.getDemandStatus();
            if(_demandStatus == TaskMessage.DEMAND_ON){
                _self._execBlinkDemandTaskOnly();
            }
        }
    };
    _proto.getMessageHtml = function() {
        var _ret = '';
        var _itemId = this.getItemId();
        _ret += '<div draggable="false" class="box-border olient-vertical ' + ColumnInboxView.cssClass + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += this.getHtml();
        _ret += '</div> <!-- .inbox-border-message -->';
        return _ret;
    };
    _proto.getHtml = function() {
        var _self = this;
        var _ret = '';
        var _msg = this.getMessage();
        var _itemId = this.getItemId();
        var _id = _msg.getId();
        var _createAt = Utils.getDate(_msg.getDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);

        _ret += '<div class="box-border olient-horizontal message-header inbox-message-header">';
        _ret += '<div class="flex1 message-created-date">' + Resource.getMessage('inbox_add_date') + _createAt + '</div>';
        _ret += '</div>';
        _ret += '<div class="box-border olient-vertical message-info message-info-inbox-ex">';
        _ret += '<div class="box-border olient-horizontal inbox-inner-message">';
        _ret += '<div class="inner-message-padding"></div>';

        _ret += '<div class="inner-message-body flex1">';
        _ret += '<div draggable="false" class="box-border flex1 olient-vertical ' + getMessageCssCLSName(_msg) + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += _self.getMessageHeaderHtml();
        _ret += _self.getMessageBodyHtml();
        _ret += _self.getMessageFooterHtml();
        _ret += '</div>';
        _ret += '</div>';

        _ret += '<div class="inner-message-padding"></div>';
        _ret += '</div>';
        _ret += '</div>';

        _ret += _super.getMessageFooterHtml.call(_self);
        return _ret;
    };
    function getMsgTypeFromReplyId(_refItemId) {
        var _type = Message.TYPE_TASK;
        var _itemIdStrs = Utils.convertStringToArray(_refItemId, '_');
        if (_itemIdStrs.length > 0) {
            switch (_itemIdStrs[0]) {
                case 'mail':
                    _type = Message.TYPE_MAIL;
                    break;
                default :
                    break;
            }
        }
        return _type;
    };
    _proto.getMessageHeaderHtml = function() {
        var _self = this;
        var _ret = '';
        var _msg = this.getMessage();
        var _status = _msg.getStatus();
        if (_status == TaskMessage.STATUS_ASSIGNING) {
            _ret += ColumnTaskMessageView.getMessageHeaderHtml(_msg);
        } else {
            var _refItemId = _msg.getReferenceMessageItemId();
            var _refMsgType = getMsgTypeFromReplyId(_refItemId);
            if(_refMsgType == Message.TYPE_MAIL) {
                _ret += ColumnMailMessageView.getMessageHeaderHtml(_msg);
            } else {
                var _id = _msg.getId();
                var _itemId = this.getItemId();
                var _jid = getJid(_msg);
                var _profile = _msg.getProfileMap().getByKey(_jid);
                var _person = ViewUtils.createPersonByProfile(_jid, _profile);
                var _nickname = ViewUtils.getUserNameByPerson(_person);
                var _accountName = ViewUtils.getCubeeAccountNameByPerson(_person);

                var _originalCreatedAt = '';
                _ret += '<div class="box-border olient-horizontal message-header">';
                _ret += '<div class="message-info" messageid="' + (_id == null ? '' : _id) + '" itemid="' + _itemId + '" />';
                _ret += '<table><tr><td>';
                _ret += ViewUtils.getAvatarDataHtmlFromPerson(_person);
                _ret += '</td><td>';
                _ret += '<div class="flex1 block-info">';
                _ret += '<div class="sender-name text-overflow-ellipsis-nosize box-border-for-abbreviation" title="' + Utils.convertEscapedTag(_nickname) +' @' + Utils.convertEscapedTag(_accountName) + '">' + Utils.convertEscapedHtml(_nickname);
                _ret += '<span class="sender-account">@' + Utils.convertEscapedHtml(_accountName) + '</span></div>';
                _ret += '<div class="message-time">';
                _ret += _originalCreatedAt;
                _ret += '</div>' + '</div>';
                _ret += '</td></tr></table>';
                _ret += '</div>';
            }
        }
        return _ret;
    };
    _proto.getMessageBodyHtml = function() {
        var _self = this;
        var _ret = '';
        var _msg = this.getMessage();
        var _status = _msg.getStatus();
        if (_status == TaskMessage.STATUS_ASSIGNING) {
            _ret += ColumnTaskMessageView.getMessageBodyHtml(_msg);
        } else {
            var _refItemId = _msg.getReferenceMessageItemId();
            var _refMsgType = getMsgTypeFromReplyId(_refItemId);
            if(_refMsgType == Message.TYPE_MAIL) {
                _ret += ColumnMailMessageView.getMessageBodyHtml(_msg);
            } else {
                _ret += _super.getMessageBodyHtml.call(_self);
            }
        }
        return _ret;
    };
    _proto.getMessageFooterHtml = function() {
        var _self = this;
        var _ret = '';
        var _msg = this.getMessage();
        var _status = _msg.getStatus();
        if (_status == TaskMessage.STATUS_ASSIGNING) {
            _ret += ColumnTaskMessageView.getMessageFooterHtml(_msg);
        } else {
            _ret += _super.getMessageFooterHtml.call(_self);
        }
        return _ret;
    };
    function getMessageCssCLSName(msg){
        var _ret = 'inbox-message';
        var _taskMessage = ColumnTaskView.cssClass;
        if (!msg || typeof msg != 'object') {
            return _ret;
        }
        var _type = msg.getType();
        var _status = msg.getStatus();
        if (_status != TaskMessage.STATUS_INBOX) {
            _ret = _taskMessage + ' ' + ColumnTaskMessageView.getTaskMessageCLSName(msg);
        }
        return _ret;
    };
    function getJid(msg){
        var _ret = '';
        if (!msg || typeof msg != 'object') {
            return _ret;
        }
        _ret = msg.getClient();
        return _ret;
    };

    _proto.onMessageOptionReceive = function(messageOptionNotification) {
        var _self = this;
        _super.onMessageOptionReceive.call(_self, messageOptionNotification);
        var _rootElement = _self._htmlElement;
        var _message = _self.getMessage();
        var _contentType = messageOptionNotification.getContentType();
        switch(_contentType){
            case MessageOptionNotification.CONTENT_TYPE_SIBLING_TASK:
                if(_message.getStatus() == TaskMessage.STATUS_ASSIGNING) {
                    var _siblingTaskDataList = _message.getSiblingTaskDataList();
                    var _siblingTaskCount = _siblingTaskDataList.getCount();
                    if(_siblingTaskCount > 0) {
                        var _taskSiblingArea = _rootElement.find('div.task-sibling-area');
                        TooltipView.getInstance().createSiblingTaskTooltip(_taskSiblingArea, _siblingTaskDataList);
                    }
                }
                break;
            case MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK:
                var _demandTaskArea = _rootElement.find('div.demand-task');
                if(_demandTaskArea.length == 0){
                    break;
                }
                var _demandStatus = messageOptionNotification.getDemandStatus();
                if(_demandStatus == TaskMessage.DEMAND_ON){
                    _self._execBlinkDemandTaskOnly();
                }else{
                    _self._invalidBlinkDemandTaskOnly();
                }
                break;
            default:
                break;
        }
    };
    _proto._execBlinkDemandTaskOnly = function() {
        var _self = this;
        var _msg = _self.getMessage();
        var _ownerJid = _msg.getOwnerJid();
        var _baseStatus = _msg.getStatus();
        var _rootElement = _self._htmlElement;
        var _isParent = false;
        var _isMultiOwner = false;
        var _baseHtml = ColumnTaskMessageView.getStatusAreaBaseDisplayHtml(_baseStatus, _isParent, _isMultiOwner);
        var _demandTaskHtml = ColumnTaskMessageView.getStatusAreaDemandTaskDisplayHtml(_isMultiOwner);
        var _timerId = _self._timerId;
        if(_timerId){
          ViewUtils.invalidBlinkTaskStatusElement(_timerId,_rootElement,_baseHtml,_isMultiOwner,_ownerJid);
          _self._timerId = null;
        };
        _self._timerId = ViewUtils.validBlinkTaskStatusElement(_rootElement,ColumnTaskMessageView.DEMAND_TASK_BLINK_DELAY,_baseHtml,_demandTaskHtml,_self._isMultiOwner,_ownerJid);
    };
    _proto._invalidBlinkDemandTaskOnly = function() {
        var _self = this;
        var _msg = _self.getMessage();
        var _ownerJid = _msg.getOwnerJid();
        var _baseStatus = _msg.getStatus();
        var _rootElement = _self._htmlElement;
        var _isParent = false;
        var _isMultiOwner = false;
        var _baseHtml = ColumnTaskMessageView.getStatusAreaBaseDisplayHtml(_baseStatus, _isParent, _isMultiOwner);
        var _demandTaskHtml = ColumnTaskMessageView.getStatusAreaDemandTaskDisplayHtml(_isMultiOwner);
        var _timerId = _self._timerId;
        if(_timerId){
          ViewUtils.invalidBlinkTaskStatusElement(_timerId,_rootElement,_baseHtml,_isMultiOwner,_ownerJid);
          _self._timerId = null;
        };
    };

    _proto.onAddMessageReferCount = function() {
        var _self = this;
        _super.onAddMessageReferCount.call(_self);
        var _message = _self.getMessage();
        if(_message == null){
            return;
        }
        var _parentItemId = _message.getParentItemId();
        if(_parentItemId != null && _parentItemId != ''){
            CubeeController.getInstance().onAddParentMessageRefarence(_parentItemId);
        }
        var _siblingTaskList = _message.getSiblingTaskDataList();
        var _siblingCount = _siblingTaskList.getCount();
        for(var _i = 0; _i < _siblingCount; _i++){
            var _siblingTask = _siblingTaskList.get(_i);
            var _siblingItemId = _siblingTask.getSiblingItemId();
            CubeeController.getInstance().onAddMessageView(_siblingItemId);
        }
    };
    _proto.setHtmlElement = function(htmlElement, isToolTipOwner) {
        var _self = this;
        _super.setHtmlElement.call(_self, htmlElement, isToolTipOwner);
        if(_self._htmlElement != null){
            _self._htmlElement.find('.pack-end').remove();

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
        }

        var _message = _self.getMessage();
        if(_message && _message.getStatus() == TaskMessage.STATUS_ASSIGNING){
            htmlElement.on('click', '.task_toggle_btn', function() { _self.onToggleMessageBody(htmlElement); });
        }
    };

    _proto.onToggleMessageBody = function(target){
        $(target).toggleClass('open').find('.message-body,.thumbnail-area').stop().slideToggle(200).end().find('.children-task-assign-area').stop().slideToggle(200);
    };

    _proto._setMessageReadFlgView = function() {
    };
    _proto._setReadMessage = function(){
    };
})();
