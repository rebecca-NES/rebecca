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

function ColumnChatMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnChatMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if(_type != Message.TYPE_CHAT) {
        console.log('ColumnChatMessageView::new _ invalid type:' + _type);
        return;
    }
    ColumnMessageView.call(this, parent, msg);
};(function() {
    ColumnChatMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnChatMessageView.prototype;

    _proto.getMessageHtml = function() {
        var _ret = '';
        var _self = this;
        var _msg = _self.getMessage();
        var _itemId = _self.getItemId();

        _ret += '<div';
        _ret += ' class="box-border olient-vertical ' + ColumnChatView.cssClass + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += this.getMessageHeaderHtml();
        _ret += this.getMessageBodyHtml();
        _ret += this.getMessageFooterHtml();
        _ret += '</div> <!-- .chat-message -->';
        return _ret;
    };

})();
