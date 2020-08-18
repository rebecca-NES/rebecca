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

function ColumnMessageExistingReaderInfoView(htmlElement, message, isToolTipOwner) {
    this._htmlElement = htmlElement;
    this._message = message;
    this._itemId = message.getItemId();
    this._count = 0;
    if(isToolTipOwner != false) {
        isToolTipOwner = true;
    }
    this._isToolTipOwner = isToolTipOwner;
    this._createEventHandler();
};(function() {
    ColumnMessageExistingReaderInfoView.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnMessageExistingReaderInfoView.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.off();
        this._htmlElement = null;
        this._itemId = null;
        this._isToolTipOwner = null;
        this._message = null;
    };
    ColumnMessageExistingReaderInfoView.getHtml = function(messageExistingReaderInfo) {
        var _ret = '';
        _ret += '<div class="frm-existing-reader not-read-message">';
        _ret += '<span class="frm-existing-reader-link txt_btn">';
        _ret += '' + messageExistingReaderInfo.getAllCount();
        _ret += Resource.getMessage('existing_reader_label');
        _ret += '</span>';
        _ret += '</div>';
        return _ret;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.on('click','span.frm-existing-reader-link', function(e) {
            _rootElement.children('.mTip').hide();
            _self.showExistingReaderList();
            e.stopPropagation();
        });
        if (_self._message.getType() != Message.TYPE_PUBLIC) {
            TooltipView.getInstance().createMessageExistingReaderTooltip(_rootElement, _self._getCachedMessageExistReaderInfo(), _self._isToolTipOwner);
        }
    };
    _proto._getCachedMessageExistReaderInfo = function() {
        var _self = this;
        if(_self._message == null) {
            return null;
        }
        var _message = _self._message;
        if(_message == null) {
            return null;
        }
        return _message.getExistingReaderInfo();
    }
    _proto.showExistingReaderList = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _itemId = _self._itemId;
        CubeeController.getInstance().sendGetExistingReaderList(_itemId, _callBack);

        function _callBack(_existingReaderInfo){
            if(_existingReaderInfo == null){
                return;
            }
            var _existingReaderItemList = _existingReaderInfo.getExistingReaderItemList();
            var _count = _existingReaderItemList.getCount();
            var _lastIndex = _count - 1;
            var _personList = new ArrayList();
            for(var _i = _lastIndex; _i >= 0; _i--){
                var _existingReaderItem = _existingReaderItemList.get(_i);
                var _person = _existingReaderItem.getPerson();
                _personList.add(_person);
            }
            var _dialogPersonListView = new DialogExistingPersonListView(_self._itemId, _personList);
            ColumnManager.getInstance().showPersonListDialog(_dialogPersonListView);
        }
    };
    _proto.onSetReadMessageReceive = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _messageExistingReaderInfo = _self._getCachedMessageExistReaderInfo();
        var _messageExistingReaderText = _messageExistingReaderInfo.getAllCount() +  Resource.getMessage('existing_reader_label');
        _rootElement.find('.frm-existing-reader-link').html(_messageExistingReaderText);
        TooltipView.getInstance().createMessageExistingReaderTooltip(_rootElement, _messageExistingReaderInfo, _self._isToolTipOwner);
    };
})();
