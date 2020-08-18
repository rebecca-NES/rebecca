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

function DialogSettingFilterView(title, columnInfo, ownerObj) {
    this._title = title;
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._dialogID = 'keyword-input';
    this._columnInfo = columnInfo;
    this._ownerObj = ownerObj;
    DialogSettingView.call(this, title);
};(function() {
    DialogSettingFilterView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogSettingFilterView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        var _rootElement = _self._dialogInnerElement;
        var _keywordInputElement = _rootElement.find('input#' + _self._dialogID);
        _keywordInputElement.on('keypress', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                _self._searchExecute();
            }
        });
        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _self._searchExecute();
        })
    };

    _proto.getInnerHtml = function() {
        var _autoCompleteInfo = ViewUtils.getAutoCompleteAttributesFromColumnInfo(this._columnInfo);
        var _ret = "";
        _ret = '<div id="colsearch_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>'+this._title+'</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('dialog_label_keyword') + '</p>';
        _ret += '      <input type="text" id="keyword-input" class="field ui-corner-all ' + _autoCompleteInfo.autoCompleteType + '" ' + _autoCompleteInfo.roomIdAttribute + '>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content mb0">';
        _ret += '      <p class="mb0">' + Resource.getMessage('dialog_label_keyword_and') + '<br>';
        _ret += '        ' + Resource.getMessage('dialog_label_keyword_or') + '</p>';
        _ret += '    </div>';
        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_label_ok') + '</span></button>';
        _ret += '  </div>';
        _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };
    _proto._searchExecute = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        if (!_self._checkKeyword(_rootElement)) {
            return false;
        }

        var _keywordElement = _rootElement.find('input#' + _self._dialogID);
        var _keywordStr = Utils.trimStringMulutiByteSpace(_keywordElement.val());

        var _filterColumnInformation = new FilterColumnInfomation();
        _filterColumnInformation.setSourceColumnType(_self._columnInfo.getColumnType());
        _filterColumnInformation.setSourceColumnDisplayName(_self._getDisplayName());
        _filterColumnInformation.setKeyword(_keywordStr);

        var _columnFilter = new AndCondition();
        var _sourceColumnType = _self._columnInfo.getColumnType();
        var _subData = {};
        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_CHAT) {
            _subData.partner = _self._columnInfo.getFilterCondition();
        } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
            var _roomInfo = _self._columnInfo.getChatRoomInfomation();
            var _roomId = _roomInfo.getRoomId();
            _subData.roomId = _roomId;
        } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED){
            var _roomInfo = _self._columnInfo.getCommunityInfomation();
            var _roomId = _roomInfo.getRoomId();
            _subData.roomId = _roomId;
        } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK){
            var _roomInfo = _self._columnInfo.getCommunityInfomation();
            var _roomId = _roomInfo.getRoomId();
            _subData.roomId = _roomId;
        }
        _filterColumnInformation.setSubData(_subData);
        var _colmunTypeFilter = ColumnFilterManager.getColumnFilter(_sourceColumnType, _subData);
        if(_colmunTypeFilter == null) {
            return false;
        }
        _columnFilter.addChildCondition(_colmunTypeFilter);
        var _keywordFilter = ViewUtils.getKeywordFilterFromKeywordInputString(_keywordStr);
        _columnFilter.addChildCondition(_keywordFilter);

        var _coulumnSort = new ColumnSortCondition();
        var _columnSearchCondition = new ColumnSearchCondition(_columnFilter, _coulumnSort);
        _filterColumnInformation.setSearchCondition(_columnSearchCondition);
        ColumnManager.getInstance().insertAfterColumn(_filterColumnInformation, _self._ownerObj, true, true);
        ViewUtils.modal_allexit();
        return true;
    };
    _proto._getDisplayName = function() {
        var _self = this;
        var _displayName = _self._columnInfo.getDisplayName();
        if (_self._columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_TASK
            || _self._columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_INBOX) {
            _displayName = ViewUtils.createDisplayName(_self._columnInfo);
        }
        return _displayName;
    };

    _proto._checkKeyword = function(filterFormObj) {
        if (!filterFormObj || typeof filterFormObj != 'object') {
            return false;
        }
        var _keywordElement = filterFormObj.find('input#keyword-input');
        var _keywordStr = _keywordElement.val();

        filterFormObj.find("#dialog-error").text('');
        _keywordElement.removeClass('input-error');
        if (_keywordStr == null || _keywordStr == '' || Utils.trimStringMulutiByteSpace(_keywordStr) == '') {
            _keywordElement.addClass('input-error');
            filterFormObj.find("#dialog-error").text(Resource.getMessage('dialogerrorSearch'));
            return false;
        }
        _keywordStr = Utils.trimStringMulutiByteSpace(_keywordStr);
        var _keywordList = ViewUtils.getKeywordListFromKeywordInputString(_keywordStr);
        if(_keywordList == null) {
            _keywordElement.addClass('input-error');
            filterFormObj.find("#dialog-error").text(Resource.getMessage('dialogerrorSearch'));
            return false;
        }
        var _count = _keywordList.getCount();
        if(_count < 1) {
            _keywordElement.addClass('input-error');
            filterFormObj.find("#dialog-error").text(Resource.getMessage('dialogerrorSearch'));
            return false;
        }
        for(var _i = 0; _i < _count; _i++) {
            var _inputKeyword = _keywordList.get(_i);
            var _encodeKeyword = encodeURIComponent(_inputKeyword);
            if(_encodeKeyword.length <= 1) {
                _keywordElement.addClass('input-error');
                filterFormObj.find("#dialog-error").text(Resource.getMessage('dialogerrorSearchOneChar'));
                return false;
            }
        }
        return true;
    };
})();
