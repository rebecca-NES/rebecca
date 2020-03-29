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
function ColumnMailView(columnInformation) {
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_MAIL;
    this._displayName = this._createDisplayName();
    this.createView();
    this._htmlElement.find('button.column-toggle').hide();
    this._htmlElement.find('div.wrap-frm-message').hide();
    columnInformation.setIconImage('images/column_mail.png');
};(function() {
    ColumnMailView.cssClass = 'mail-message';

    ColumnMailView.prototype = $.extend({}, ColumnView.prototype);
    var _super = ColumnView.prototype;
    var _proto = ColumnMailView.prototype;

    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _getCount = 20;
        function onGetHistoryMessageCallback(resultMessageData) {
            _self._resultAllCount = resultMessageData.allItemCount;
            var _messageList = resultMessageData.messageDataList;
            if(_messageList.getCount() < _getCount) {
                _self._allMessageReceived = true;
            }
            _self._onGetHistoryMessage(_messageList);
        }
        CubeeController.getInstance().searchMessage(_self._currentLoadedItemId, _getCount, _columnInfo.getSearchCondition(), onGetHistoryMessageCallback);
    };
    _proto._onGetHistoryMessage = function(messageList) {
        var _self = this;
        _self._hideLoadingIconInSelf();
        var _count = messageList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _message = messageList.get(_i);
            if (_message == null) {
                continue;
            }
            var _itemId = _message.getItemId();
            if (!_self.getMsgObjByItemId(_itemId)) {
                _super.showHistoryMessage.call(_self,_message);
            }
        }
        _self._readMoreHistoryMessageIfNoScrollBar();
    };
    _proto.onAddMessageReceive = function(message) {
        var _self = this;
        var _searchCondition = _self._info.getSearchCondition();
        if(_searchCondition.isMatch(message)){
            var _itemId = message.getItemId();
            if (!_self.getMsgObjByItemId(_itemId)) {
                _self.showMessage(message);
            }
        }
    };
    _proto.createMessageObjectOnly = function(message) {
        var _self = this;
        if (!message || typeof message != 'object') {
            return;
        }
        var _type = message.getType();
        var _msgObj = null;
        switch(_type) {
            case Message.TYPE_MAIL:
                _msgObj = new ColumnMailMessageView(_self, message);
                break;
            default:
                console.log('ColumnMailView::createMessageObjectOnly _ invalid type:' + _type);
                break;
        }
        return _msgObj;
    };
    _proto.getColumnMessageHtml = function(message) {
        var _ret = '';
        if(!message || typeof message != 'object') {
            return ret;
        }
        _ret = message.getMessageHtml();
        return _ret;
    };
    _proto._createDisplayName = function() {
        var _ret = ColumnView.DISPLAY_NAME_MAIL;
        return _ret;
    };
})();
