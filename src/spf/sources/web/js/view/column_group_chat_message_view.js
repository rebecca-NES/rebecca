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

function ColumnGroupChatMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnGroupChatMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if(_type != Message.TYPE_GROUP_CHAT) {
        console.log('ColumnGroupChatMessageView::new _ invalid type:' + _type);
        return;
    }
    ColumnMessageView.call(this, parent, msg);
};(function() {
    ColumnGroupChatMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnGroupChatMessageView.prototype;

    _proto.getMessageHtml = function(replyFlag) {
        var ret = '';
        if (replyFlag == null) {
            replyFlag = false;
        }
        if (replyFlag) {
            ret = this._getGroupChatReplyMessageHtml();
        } else {
            ret = this._getGroupChatOriginalMessageHtml();
        }
        return ret;
    };
    _proto._getGroupChatOriginalMessageHtml = function() {
        var _self = this;
        var _ret = '';
        var _itemId = _self.getItemId();
        _ret += '<div';
        _ret += ' class="box-border olient-vertical ' + ColumnGroupChatView.cssClassGroupChat + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += _self._getGroupChatMessageBodyHtml();
        _ret += '</div> <!-- .groupchat-message -->';
        return _ret;
    };
    _proto._getGroupChatReplyMessageHtml = function() {
        var _self = this;
        var _ret = '';
        var _itemId = _self.getItemId();
        _ret += '<div';
        _ret += ' class="box-border olient-horizontal ' + ColumnGroupChatView.cssClassThread + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += '<div class="thread-padding"></div>';
        _ret += '<div class="box-border flex1 olient-vertical ' + ColumnGroupChatView.cssClassGroupChat + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += _self._getGroupChatMessageBodyHtml();
        _ret += '</div>';
        _ret += '</div> <!-- .thread-message -->';
        return _ret;
    };
    _proto._getGroupChatMessageBodyHtml = function() {
        var _self = this;
        var _ret = '';
        _ret += _self.getMessageHeaderHtml();
        _ret += _self.getMessageBodyHtml();
        _ret += _self.getMessageFooterHtml();
        return _ret;
    };
})();
