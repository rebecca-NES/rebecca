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
function ColumnSystemMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnSystemMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if(_type != Message.TYPE_SYSTEM) {
        console.log('ColumnSystemMessageView::new _ invalid type:' + _type);
        return;
    }
    ColumnMessageView.call(this, parent, msg);
};(function() {
    ColumnSystemMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnSystemMessageView.prototype;

    _proto.getMessageHtml = function() {
        var _ret = "";
        var _msg = this.getMessage();
        var _date = Utils.getDate(_msg.getDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);
        var _romMessage = _msg.getMessage();
        var _message = ViewUtils.removeAttachmentUrl(_romMessage);
        var _realBody = ViewUtils.urlAutoLink(_msg.getUIShortenUrls(), _message, true, null, false, _msg.getItemId());
        var _option = this.getMessageBodyThumbnailImageHtml(_msg);
        var _goodJob = ColumnMessageGoodJobButton.getHtml(_msg.getGoodJobList());
        _ret += divSystemMessageBody(_realBody, _date, _option, _goodJob);
        return _ret;
    };
    ColumnSystemMessageView.getOfflineMessageHtml = function() {
        var _ret = '';
        var _date = Utils.getDate(Utils.DISPLAY_STANDARD_DATE_FORMAT);
        var _realBody = Resource.getMessage('system_message_server_disconnected');
        var _option = '';
        var _goodJob = ''
        _ret += divSystemMessageBody(_realBody, _date, _option, _goodJob);
        return _ret;
    };

    ColumnSystemMessageView.getNotReferableMessageHtml = function(showMessage) {
        var _ret = '';
        var _date = Utils.getDate(Utils.DISPLAY_STANDARD_DATE_FORMAT);
        var _realBody = showMessage;
        var _option = '';
        var _goodJob = '';
        _ret += divSystemMessageBody(_realBody, _date, _option, _goodJob);
        return _ret;
    };

    function divSystemMessageBody(content, date, thumbImages, goodJob) {
        var _ret = "";
        _ret += '<div draggable="false" class="box-border olient-vertical system-message read-message">';
        _ret += '<div class="box-border olient-horizontal message-header">';
        _ret += '<div class="message-info"/>';
        if (ViewUtils.isIE89()) _ret += '<table><tr><td>';
        _ret += '<div class="block-avatar"><img class="avatar" alt="' + Conf.getVal('PRODUCT_NAME')  + '" src="images/cubee.png"></div>';
        if (ViewUtils.isIE89()) _ret += '</td><td>';
        _ret += '<div class="flex1 block-info">';
        _ret += '<div class="sender-name">' + Conf.getVal('PRODUCT_NAME')  + '</div>';
        _ret += '<div class="message-time">' + date + '</div>';
        _ret += '</div>' + '</div>';
        if (ViewUtils.isIE89()) _ret += '</td></tr></table>';
        _ret += '<div class="box-border olient-vertical message-info">';
        _ret += '<div class="message-body">'+ content + '</div>';
        _ret += thumbImages;
        if(goodJob != null && typeof goodJob == 'string' && goodJob != '') {
            _ret += '<div class="box-border pack-end good-job">';
            _ret += goodJob;
            _ret += '</div>';
        }
        _ret += '</div>';
        _ret += _super.getMessageFooterHtml();
        _ret += '</div><!-- .system-message -->';
        return _ret;
    };
    _proto._setReadMessage = function(){
    };
})();
