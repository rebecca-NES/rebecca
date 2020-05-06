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
function ColumnRecentView(columnInformation) {
    ColumnView.call(this, columnInformation);
    this._className = ColumnView.CLASS_SEL_RECENT;
    this._displayName = this._createDisplayName();
    this._initColumnSearchCondition();
    if (this._type == ColumnInformation.TYPE_COLUMN_RECENT){
        this._closable = false;
    }
    this.createView();
    this._setRecentColumnEvent();
};(function() {
    ColumnRecentView.prototype = $.extend({}, ColumnSearchView.prototype);
    var _super = ColumnSearchView.prototype;
    var _proto = ColumnRecentView.prototype;
    _proto._initColumnSearchCondition = function(){
        var _self = this;
        var _extras = LoginUser.getInstance().getExtras();
        if (_extras && 'recentFilter' in _extras) {
            var _recentFilter = _extras.recentFilter;
            var _searchKey = _recentFilter.search ? Utils.urldecode(_recentFilter.search) : '';
            var _columnSearchCondition = this.getColumnSearchCondition(_recentFilter, _searchKey);
            this._info.setSearchCondition(_columnSearchCondition);
        }
    }
    _proto._createDisplayName = function(keyword='', quickSettings={}) {
        var _ret = ColumnView.DISPLAY_NAME_RECENT + ' /';
        if (keyword) {
            _ret += ' ' + keyword + ',';
        }
        if (quickSettings.tome) {
            _ret += ' ' + Resource.getMessage('ToMe') + ',';
        }
        if (quickSettings.unread) {
            _ret += ' ' + Resource.getMessage('custom_filter_label_unread_message') + ',';
        }
        if (quickSettings.attached_file) {
            _ret += ' ' + Resource.getMessage('custom_filter_label_having_attached_file')
        }
        if (_ret.slice(-1) == ',' || _ret.slice(-1) == '/') {
            _ret = _ret.slice(0, -1);
        }
        return _ret;
    };
    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = RecentColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new RecentColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };
    _proto._setRecentColumnEvent = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        _htmlElem.on('change', '#quick-filter-tome,#quick-filter-read,#quick-filter-file', function(event){
            _self.clickSubFormButton();
        });
        _htmlElem.on('click', 'button.all_read', function(){
            var _dialogReadBulkView = new DialogReadInBulkCheckView(_self._info, _self.getHtmlElement());
            _dialogReadBulkView.showDialog();
        });
        _htmlElem.find('.column-recent-frm-message .message-input-area').keypress(function(e){
            if ( e.which == 13 ) {
                _self.clickSubFormButton();
            }
        });
        _htmlElem.on('click', '#quickfilter_btn', function(){
            _self.clickSubFormButton();
        });
    }
    _proto.clickSubFormButton = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _messageElement = _htmlElem.find('div.column-content .message-border');
        var _hash = _self._getMsgObjHash();
        for (var key in _hash) {
            delete _hash[key];
        }
        _self._getMsgObjIndexList().removeAll();
        _messageElement.remove();
        _self._hideLoadingIconInSelf();
        _self._allMessageReceived = false;
        _self._currentLoadedItemId = 0;
        var _keywordStr = Utils.trimStringMulutiByteSpace(_self._htmlElement.find('div.frm-message').children('input').val());
        var _isOk = _self._isValidateOk(_keywordStr);
        if(!_isOk && _keywordStr != "") {
            return;
        }
        var _quickSettings = createQuickFilterObject(_htmlElem, _keywordStr);
        var _columnSearchCondition = _self.getColumnSearchCondition(_quickSettings, _keywordStr);
        var _columnInfo = _self._info;
        _columnInfo.setSearchCondition(_columnSearchCondition);
        _columnInfo.setKeyword(_keywordStr);
        var _displayName = _self._createDisplayName(_keywordStr, _quickSettings);
        _columnInfo.setDisplayName(_displayName);
        _self.updateColumnTitle();
        _super._LoadingIcon(_self,'div.wrap-frm-message');
        _htmlElem.find('.column-recent-frm-message').find(':input').attr('disabled', true);
        _self.getHistoryMessage();
        var extras = LoginUser.getInstance().getExtras();
        var saveExtras = {};
        saveExtras.Logged = extras.Logged;
        saveExtras.recentFilter = _quickSettings;
        CubeeServerConnector.getInstance().setLoginUserExtras(saveExtras)
        .then(function(res){
            var _extras = res.content.extras;
            if (_extras) {
                try {
                    _extras = JSON.parse(_extras);
                    LoginUser.getInstance().setExtras(_extras);
                } catch (error) {
                    _extras = {};
                }
            }
        })
    }
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _getCount = 20;
        function onGetHistoryMessageCallback(resultMessageData) {
            _self._hideLoadingIconInSelf();
            _self._resultAllCount = resultMessageData.allItemCount;
            var _messageList = resultMessageData.messageDataList;
            if(_messageList.getCount() < _getCount) {
                _self._allMessageReceived = true;
            }
            var _count = _messageList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                var _message = _messageList.get(_i);
                if (_message == null) {
                    continue;
                }
                var _itemId = _message.getItemId();
                if (!_self.getMsgObjByItemId(_itemId)) {
                    _self.showHistoryMessage(_message);
                }
            }
            _self._getNotAvailableMessageHtmlIfMessageNothing(_self._getMsgObjIndexList().getCount());
            $(window).trigger('resize');
            _self.refreshScrollbar();
            _self.getHtmlElement().find('.column-recent-frm-message').find(':input').attr('disabled', false);
            _self._disableBottomEvent = false
        }
        _self._disableBottomEvent = true
        CubeeController.getInstance().searchMessage(_self._currentLoadedItemId, _getCount, _columnInfo.getSearchCondition(), onGetHistoryMessageCallback);
    };
    function createQuickFilterObject(_htmlElem, searchKeyword) {
        var returnObj = {
            attached_file: false,
            having_url: false,
            sender: '',
            term: 0,
            unread: false,
            tome: false,
            search: encodeURIComponent(searchKeyword)
        };
        if (_htmlElem.find('#quick-filter-tome').prop('checked')) {
            returnObj.tome = true;
        }
        if (_htmlElem.find('#quick-filter-read').prop('checked')) {
            returnObj.unread = true;
        }
        if (_htmlElem.find('#quick-filter-file').prop('checked')) {
            returnObj.attached_file = true;
        }
        return returnObj;
    }

    _proto.getColumnSearchCondition = function(_quickSettings, _searchStr) {
        var _self = this;
        var _columnKeywordFilter = null;
        if (_searchStr != "") {
            _columnKeywordFilter = _self._getKeywordFilterCondition(_searchStr);
        }
        var _columnTypeFilter = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_RECENT);
        if (_quickSettings.tome) {
            _columnTypeFilter = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_TOME);
        }
        var _quickFilter = CustomFilterSetting.createSettingFilterCondition(_quickSettings);
        var columnFilter = null;
        // Variable _columnFilter is used like a local variable, but is missing a declaration.
        var _columnFilter;
        if (_quickFilter != null || _columnKeywordFilter != null) {
            _columnFilter = new AndCondition();
            _columnFilter.addChildCondition(_columnTypeFilter);
            if (_quickFilter != null) {
                _columnFilter.addChildCondition(_quickFilter);
            }
            if (_columnKeywordFilter != null) {
                _columnFilter.addChildCondition(_columnKeywordFilter);
            }
        } else {
            _columnFilter = _columnTypeFilter;
        }
        var _columnSort = new ColumnSortCondition();
        var _columnSearchCondition = new ColumnSearchCondition(_columnFilter, _columnSort);
        return _columnSearchCondition;
    }
    _proto._createSubForms = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _textareaElement = _htmlElem.find('div.frm-message > input[type="text"]');
        _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('dialog_context_search_title'));
        var _btnElement = _htmlElem.find('div.frm-message > button');
        _btnElement.attr({
            name: 'search',
            'data-toggle': 'tooltip',
            'data-placement': 'bottom',
            id: 'quickfilter_btn',
            'data-original-title': '検索',
            title: ''
        });
        _btnElement.append('<i class="fa fa-search"></i>');

        var quickFilterString = '<pre>クイックフィルタ：</pre>';
        _htmlElem.find('.column-recent-frm-message').prepend(quickFilterString);

        var labelDiv = '<div class="quick_filter_buttons">\
            <label class="modal_btn unread_filter right_button">\
                <div class="quickfileter_toggles" title="'+ Resource.getMessage('RecentQuickFilterOnlyToMe') +'">\
                    <span>'+ Resource.getMessage('RecentQuickFilterOnlyToMe') +'</span>\
                </div>\
                <div class="quickfileter_toggles_check">\
                    <div class="onoffswitch">\
                      <input id="quick-filter-tome" name="quick-filter-tome" type="checkbox" class="onoffswitch-checkbox">\
                      <label class="onoffswitch-label" for="quick-filter-tome"></label>\
                    </div>\
                </div>\
            </label>\
            <label class="modal_btn unread_filter left_button">\
                <div class="quickfileter_toggles" title="'+ Resource.getMessage('RecentQuickFilterUnread') +'">\
                    <span>'+ Resource.getMessage('RecentQuickFilterUnread') +'</span>\
                </div>\
                <div class="quickfileter_toggles_check">\
                    <div class="onoffswitch">\
                      <input id="quick-filter-read" name="quick-filter-read" type="checkbox" class="onoffswitch-checkbox">\
                      <label class="onoffswitch-label" for="quick-filter-read"></label>\
                    </div>\
                </div>\
            </label>\
            <label class="modal_btn unread_filter right_button">\
                <div class="quickfileter_toggles" title="'+ Resource.getMessage('RecentQuickFilterFile') +'">\
                    <span>'+ Resource.getMessage('RecentQuickFilterFile') +'</span>\
                </div>\
                <div class="quickfileter_toggles_check">\
                    <div class="onoffswitch">\
                      <input id="quick-filter-file" name="quick-filter-file" type="checkbox" class="onoffswitch-checkbox">\
                      <label class="onoffswitch-label" for="quick-filter-file"></label>\
                    </div>\
                </div>\
            </label>\
            <button class="all_read" type="button" title="" data-original-title="'+ Resource.getMessage('RecentQuickFilterAllRead') +'" data-toggle="tooltip" data-placement="bottom">'+ Resource.getMessage('RecentQuickFilterAllRead') +'</button>\
        </div>';
        _htmlElem.find('.column-recent-frm-message').append(labelDiv);
        var _extras = LoginUser.getInstance().getExtras();
        if (_extras && 'recentFilter' in _extras) {
            var _recentFilter = _extras.recentFilter;
            var _searchKey = _recentFilter.search ? Utils.urldecode(_recentFilter.search) : '';
            if (_searchKey) {
                _htmlElem.find('div.frm-message > input[type="text"]').val(_searchKey);
            }
            if (_recentFilter.tome) {
                _htmlElem.find('#quick-filter-tome').prop('checked', true);
                _htmlElem.find('#quick-filter-tome').closest('.unread_filter').find('.quickfileter_toggles').addClass('filter-enable')
            }
            if (_recentFilter.unread) {
                _htmlElem.find('#quick-filter-read').prop('checked', true);
                _htmlElem.find('#quick-filter-read').closest('.unread_filter').find('.quickfileter_toggles').addClass('filter-enable')
            }
            if (_recentFilter.attached_file) {
                _htmlElem.find('#quick-filter-file').prop('checked', true);
                _htmlElem.find('#quick-filter-file').closest('.unread_filter').find('.quickfileter_toggles').addClass('filter-enable')
            }
            var _columnInfo = _self._info;
            _columnInfo.setKeyword(_searchKey);
            var _displayName = _self._createDisplayName(_searchKey, _recentFilter);
            _columnInfo.setDisplayName(_displayName);
            _self.updateColumnTitle();
        }
    };
})();
