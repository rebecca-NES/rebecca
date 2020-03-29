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
function ColumnCustomFilterView(columnInformation) {

    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_FILTER;

    this._displayName = this._createDisplayName(columnInformation);

    this.createView();

    this._resultAllCount = 0;


    this._htmlElement.find('div.frm-message > input[type="text"]').hide();

    columnInformation.setIconImage('images/column_search.png');

    this._reloadButton = null;

    this._updateColumnTitle();

};(function() {

    ColumnCustomFilterView.prototype = $.extend({}, ColumnFilterView.prototype);

    var _super = ColumnFilterView.prototype;

    var _proto = ColumnCustomFilterView.prototype;

    _proto._createSubForms = function() {

        var _self = this;

        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _textareaElement = _htmlElem.find('div.frm-message > input[type="text"]');
        _self._textarea = new ColumnTextAreaView(_textareaElement, _self, '');

        _htmlElem.find('div.frm-message > button').before(ColumnSubmitButtonView.getHtml(ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER));
        var _btnElement = _htmlElem.find('div.frm-message > button');
        var _reloadBtnElement = _btnElement.eq(0);
        var _filterBtnElement = _btnElement.eq(1);
        _self._reloadButton = new ColumnReloadButtonView(_reloadBtnElement, _self, Resource.getMessage('task_reloadTask_btn'));
        _self._button = new ColumnSubmitButtonView(_filterBtnElement, _self, Resource.getMessage('column_btn_filter'));
    };


    _proto.clickSubFormButton = function() {

        var _self = this;

        var _columnInfo = _self._info;

        var _filterSettingDialogView = null;
        switch(_columnInfo.getSourceColumnType())
        {

        case ColumnInformation.TYPE_COLUMN_TASK:
        case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
            var _title  = Resource.getMessage('task_refilter_dialog_title');
            _filterSettingDialogView = new DialogSettingFilterMyTaskView(_title, _self._info, _self._ownerObj, _self);
            break;
        case ColumnInformation.TYPE_COLUMN_INBOX:
            var _title  = Resource.getMessage('column_option_custom_filter');
            _filterSettingDialogView = new DialogSettingCustomFilterInboxView(_title, _self._info, _self._ownerObj, _self);
            break;
        case ColumnInformation.TYPE_COLUMN_FILTER:
            var _title  = Resource.getMessage('column_option_custom_filter');
            if(_columnInfo.getBeginningColumnType() == ColumnInformation.TYPE_COLUMN_TASK || _columnInfo.getBeginningColumnType() == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
                _title  = Resource.getMessage('task_refilter_dialog_title');
                _filterSettingDialogView = new DialogSettingFilterMyTaskView(_title, _self._info, _self._ownerObj, _self);
            } else if(_columnInfo.getBeginningColumnType() == ColumnInformation.TYPE_COLUMN_INBOX) {
                _filterSettingDialogView = new DialogSettingCustomFilterInboxView(_title, _self._info, _self._ownerObj, _self);
            } else {
                _filterSettingDialogView = new DialogSettingCustomFilterView(_title, _self._info, _self._ownerObj, _self);
            }
            break;
        default:
            var _title  = Resource.getMessage('column_option_custom_filter');
            _filterSettingDialogView = new DialogSettingCustomFilterView(_title, _self._info, _self._ownerObj, _self);
            break;
        }
        if(_filterSettingDialogView == null) {
            return;
        }
        _filterSettingDialogView.showDialog();
    };

    _proto.searchAgain = function(_filterColumnInformation) {

        var _self = this;

        var _columnInfo = _self._info;
        _columnInfo.setSearchCondition(_filterColumnInformation.getSearchCondition());
        _columnInfo.setSetting(_filterColumnInformation.getSetting());

        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _messageElement = _htmlElem.find('div.column-content .message-border');
        var _hash = _self._getMsgObjHash();
        for (var key in _hash) {
            _hash[key].cleanup();
            delete _hash[key];
        }
        _self._getMsgObjIndexList().removeAll();
        _messageElement.remove();
        _self._hideLoadingIconInSelf();

        _self._allMessageReceived = false;
        _self._currentLoadedItemId = 0;

        ColumnManager.getInstance().saveColumnList();

        _super._LoadingIcon(_self,'div.wrap-frm-message');

        _self.getHistoryMessage();
    };

    _proto._createDisplayName = function(columnInfo) {

        var _columnType = columnInfo.getColumnType();
        switch(_columnType){
            case ColumnInformation.TYPE_COLUMN_FILTER:
                return columnInfo.getSourceColumnDisplayName() + ' / ' + columnInfo.getKeyword();
            case ColumnInformation.TYPE_COLUMN_SEARCH:
                return ColumnView.DISPLAY_NAME_SEARCH + ' / ' + columnInfo.getKeyword();

            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
                return columnInfo.getSourceColumnDisplayName() + ' / ' + Resource.getMessage('task_filter');

            default:
                return '';
        }
    };

    _proto.clickReloadButton = function() {
        var _self = this;
        var _columnInfo = _self._info;
        _self.searchAgain(_columnInfo);
    };

    _proto.onUpdateMessageReceive = function(message) {
        var _self = this;
        if (message == null || typeof message != 'object') {
            return;
        }
        var _itemId = message.getItemId();
        if (!_itemId) {
            return;
        }
        var _type = message.getType();
        if (_type == Message.TYPE_TASK) {
            var _parentItemId = message.getParentItemId();
            if (_self.getMsgObjByItemId(_parentItemId)) {
                var _parentTaskMessage = CubeeController.getInstance().getMessage(_parentItemId);
                _self.onUpdateMessageReceive(_parentTaskMessage);
            }
        }
        var _targetMsgOjb = _self.getMsgObjByItemId(_itemId);
        if(_targetMsgOjb == null){
            if(_self._info.getSearchCondition().isMatch(message)){
                _self._showMessageData(message);
            }
            return;
        }
        var _targetElm = _self.getMessageHtmlElement(_targetMsgOjb);
        _targetElm.remove();
        _self.removeMsgObjIndexByItemId(_itemId);
        _self._showMessageData(message);
    };

    _proto._getToolTipBaseElement = function (content) {
        var _self = this;
        var _columnInfo = _self._info;
        var _sourceColumnType = _columnInfo.getSourceColumnType();
        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH || _sourceColumnType == ColumnInformation.TYPE_COLUMN_RECENT) {
            return content.children().children().children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
        }
        return _super._getToolTipBaseElement.call(_self, content);
    };

    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = CustomFilterColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new CustomFilterColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };

    _proto.cleanup = function() {
        var _self = this;
        if(_self._reloadButton != null) {
            _self._reloadButton.cleanup();
            delete _self._reloadButton;
        }
        _super.cleanup.call(_self);
    };
})();
