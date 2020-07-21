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

function ColumnPublicMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnPublicMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if(_type != Message.TYPE_PUBLIC) {
        console.log('ColumnPublicMessageView::new _ invalid type:' + _type);
        return;
    }
    ColumnMessageView.call(this, parent, msg);
    this._isShowReadMore = true;
};(function() {
    ColumnPublicMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnPublicMessageView.prototype;
    var _AuthType ='';
    _proto.getMessageHtml = function(replyFlag,sendMessageRight) {
        var ret = '';
        _AuthType = sendMessageRight;
        if (replyFlag == null) {
            replyFlag = false;
        }
        if (replyFlag) {
            ret = this._getPublicReplyMessageHtml();
        } else {
            ret = this._getPublicOriginalMessageHtml();
        }
        return ret;
    };
    _proto._getPublicOriginalMessageHtml = function() {
        var _ret = '';
        var _msg = this.getMessage();
        var _itemId = this.getItemId();
        _ret += '<div';
        _ret += ' class="box-border olient-vertical ' + ColumnTimelineView.cssClassTimeline + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += this._getPublicMessageBodyHtml();
        _ret += '</div> <!-- .timeline-message -->'
        return _ret;
    };
    _proto._getPublicReplyMessageHtml = function() {
        var _ret = '';
        var _msg = this.getMessage();
        var _itemId = this.getItemId();
        _ret += '<div';
        _ret += ' class="box-border olient-horizontal ' + ColumnTimelineView.cssClassThread + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += '<div class="thread-padding"></div>';
        _ret += '<div class="box-border flex1 olient-vertical ' + ColumnTimelineView.cssClassTimeline + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += this._getPublicMessageBodyHtml();
        _ret += '</div>';
        _ret += '</div> <!-- .thread-message -->'
        return _ret;
    };
    _proto._getPublicMessageBodyHtml = function() {
        var _ret = '';
        var _msg = this.getMessage();
        if(_AuthType == false && _msg._type != Message.TYPE_SYSTEM) {
            return _ret;
        }
        _ret += this.getMessageHeaderHtml();
        _ret += this.getMessageBodyHtml();
        _ret += this.getMessageFooterHtml();
        return _ret;
    };

})();
