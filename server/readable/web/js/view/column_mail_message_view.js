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

function ColumnMailMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnMailMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if(_type != Message.TYPE_MAIL) {
        console.log('ColumnMailMessageView::new _ invalid type:' + _type);
        return;
    }
    ColumnMessageView.call(this, parent, msg);
};(function() {
    ColumnMailMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnMailMessageView.prototype;

    ColumnMailMessageView.MAIL_BODY_WINDOW_HEIGHT = 700;
    ColumnMailMessageView.MAIL_BODY_WINDOW_WIDTH = 700;
    ColumnMailMessageView.MAIL_BODY_ICON = 'images/page_white_text.png';
    ColumnMailMessageView.MAIL_MESSAGE_ICON_CLS_NAME = 'mail-message-icon';
    ColumnMailMessageView.MAIL_PRIORITY_HIGH_CLS_NAME = 'mail-priority-high';

    _proto._setMailMessageSubjectToolTip = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _mailMessageHeader = _rootElement.find('div.mail-message-header-items');
        var _mailMessageHeaderSubject = _mailMessageHeader.eq(0);
        var _toolTipContent = '<div class="tooltipMailMessageSubject"><h>' + _mailMessageHeaderSubject.text() + '</h><div>';
        _mailMessageHeaderSubject.attr('title', _mailMessageHeaderSubject.text());
    };

    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);
        var _rootElement = _self._htmlElement;
        var _message = _self.getMessage();
        var _itemId = _self.getItemId();
        var _mailBodyElm = _rootElement.find('div.mail-body').children();
        _mailBodyElm.on('click',function() {
           var _mailBodyInfo = _message.getBodyInfo();
           if(_mailBodyInfo != null){
               var _mailBody = _mailBodyInfo.getBody();
               winOpenMailBody(_mailBody);
               return false;
           }
           CubeeController.getInstance().getMailBody(_itemId, _onGetMailBody);
        });
        function _onGetMailBody(){
            var _updatedMessage = CubeeController.getInstance().getMessage(_itemId);
            var _mailBodyInfo = _updatedMessage.getBodyInfo();
            var _mailBody = _mailBodyInfo.getBody();
            _self._msg.setBodyInfo(_mailBodyInfo);
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
        _self._setMailMessageSubjectToolTip();
    };
    _proto.getMessageHtml = function() {
        var _ret = '';
        var _self = this;
        var _itemId = _self.getItemId();

        _ret += '<div';
        _ret += ' class="box-border' + ' olient-vertical ' + ColumnMailView.cssClass + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += _self.getMessageHeaderHtml();
        _ret += _self.getMessageBodyHtml();
        _ret += _self.getMessageFooterHtml();
        _ret += '</div> <!-- .mail-message -->';
        return _ret;
    };

    _proto.getMessageHeaderHtml = function() {
        var _self = this;
        var _ret = '';
        var _message = _self.getMessage();
        _ret = _getMessageHeaderHtml(_message);
        return _ret;
    }
    ColumnMailMessageView.getMessageHeaderHtml = function(message) {
        var _ret ='';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageHeaderHtml(message);
        return _ret;
    };

    function _getMessageHeaderHtml(message) {
        var _ret ='';
        var _itemId = message.getItemId();
        var _id = message.getId();
        var _from = LoginUser.getInstance().getSettings().getMailCooperationList().get(0).getServerName();
        if (_from == '') {
            _from = ViewUtils.getCooperationServerName();
        }
        var _mailImageSrc = 'images/new_email.png';
        var _mailHeaderinfo = Utils.convertStringToArray(message.getMessage(), '\n');
        var _date = _mailHeaderinfo[2];
        _ret += '<div class="box-border olient-horizontal message-header">';
        _ret += '<div class="message-info" messageid="' + (_id == null ? '' : _id) + '" itemid="' + _itemId + '" />';
        if(ViewUtils.isIE89()) _ret += '<table><tr><td>';
        _ret += '<div class="block-avatar">';
        _ret += '<img class="avatar ' + ColumnMailMessageView.MAIL_MESSAGE_ICON_CLS_NAME + '" src="' + _mailImageSrc + '">';
        _ret += '</div>';
        if(ViewUtils.isIE89()) _ret += '</td><td width="100%">';
        _ret += '<div class="flex1 block-info">';
        _ret += '<div class="sender-name text-overflow-ellipsis-nosize box-border-for-abbreviation" title="' + Utils.convertEscapedTag(_from) + '">';
        _ret += Utils.convertEscapedHtml(_from) + '</div>';
        _ret += '<div class="message-time">' + _date + '</div>';
        _ret += '</div>';
        if(ViewUtils.isIE89()) _ret += '</td></tr></table>';
        _ret += '</div>';
        return _ret;
    };
    _proto.getMessageBodyHtml = function() {
        var _self = this;
        var _ret = '';
        var _message = _self.getMessage();
        _ret = _getMessageBodyHtml(_message);
        return _ret;
    }
    ColumnMailMessageView.getMessageBodyHtml = function(message) {
        var _ret ='';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageBodyHtml(message);
        return _ret;
    };

    function _getMessageBodyHtml(message) {
        var _ret ='';
        var _mailHeaderinfo = Utils.convertStringToArray(message.getMessage(), '\n');
        _ret += '<div class="box-border olient-vertical message-info">';
        _ret += '<div class="message-body box-border-for-abbreviation olient-vertical">';
        for (var _i = 0; _i < _mailHeaderinfo.length - 1; _i++) {
            var _titleInfo = Utils.convertEscapedTag(_mailHeaderinfo[_i]);
            var _headerInfo = Utils.convertEscapedHtml(_mailHeaderinfo[_i]);
            _ret += '<div class="mail-message-header-items" title="' + _titleInfo + '">' + _headerInfo + '</div>';
        }
        _ret += '</div>';
        _ret += _getMailBodyHtml(message);
        _ret += '</div>';
        return _ret;
    };
    function _getMailBodyHtml(message) {
        var _ret = '';
        _ret += '<div class="box-border olient-vertical mail-body">';
        _ret += '<span><img src="'+ ColumnMailMessageView.MAIL_BODY_ICON +'"></span>';
        _ret += '</div>';
        return _ret;
    };
})();
