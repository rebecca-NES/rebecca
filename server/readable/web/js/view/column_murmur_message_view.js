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

function ColumnMurmurMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnMurmurMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if(_type != Message.TYPE_MURMUR) {
        console.log('ColumnMurmurMessageView::new _ invalid type:' + _type);
        return;
    }
    ColumnMessageView.call(this, parent, msg);
};(function() {
    ColumnMurmurMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnMurmurMessageView.prototype;

    _proto.getMessageHtml = function(replyFlag) {
        var ret = '';
        if (replyFlag == null) {
            replyFlag = false;
        }
        if (replyFlag) {
            ret = this._getMurmurReplyMessageHtml();
        } else {
            ret = this._getMurmurOriginalMessageHtml();
        }
        return ret;
    };
    function hexToRgba(hex){
        let r = String(parseInt(hex.substring(1,3), 16));
        let g = String(parseInt(hex.substring(3,5), 16));
        let b = String(parseInt(hex.substring(5,7), 16));
        return "background-color:rgba("+r+","+g+","+b+",0.05)";
    }
    _proto._getMurmurOriginalMessageHtml = function() {
        var _self = this;
        var _ret = '';
        var _itemId = _self.getItemId();
        var _partnerName = _self._msg._profileMap._array[0]._nickName;
        var _result = Utils.avatarCreate({name: _partnerName, type: 'user'});
        _ret += '<div';
        _ret += ' message-border" style="'+hexToRgba(_result.color)+'"';
        _ret += ' class="box-border olient-vertical ' + ColumnMurmurView.cssClassMurmur + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += _self._getMurmurMessageBodyHtml();
        _ret += '</div> <!-- .murmur-message -->';
        return _ret;
    };
    _proto._getMurmurReplyMessageHtml = function() {
        var _self = this;
        var _ret = '';
        var _itemId = _self.getItemId();
        _ret += '<div';
        _ret += ' class="box-border olient-horizontal ' + ColumnMurmurView.cssClassThread + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += '<div class="thread-padding"></div>';
        _ret += '<div class="box-border flex1 olient-vertical ' + ColumnMurmurView.cssClassMurmur + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += _self._getMurmurMessageBodyHtml();
        _ret += '</div>';
        _ret += '</div> <!-- .thread-message -->';
        return _ret;
    };
    _proto._getMurmurMessageBodyHtml = function() {
        var _self = this;
        var _ret = '';
        _ret += _self.getMessageHeaderHtml();
        _ret += _self.getMessageBodyHtml();
        _ret += _self.getMessageFooterHtml();
        return _ret;
    };
})();
