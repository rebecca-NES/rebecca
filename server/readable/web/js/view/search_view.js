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

function SearchView() {
};(function() {
})();

function ContextSearchView() {
    SearchView.call(this);
    this._contextSearchOptionController = new ContextSearchOptionController();
};(function() {
    var _self = this;
    ContextSearchView.prototype = $.extend({}, SearchView.prototype);
    var _super = SearchView.prototype;
    var _proto = ContextSearchView.prototype;

    var _contextSearchView = new ContextSearchView();
    _self._checkedOptions = new ArrayList();
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_TIMELINE);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_CHAT);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_TASK);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_INBOX);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_GROUP_CHAT);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_MAIL);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_MURMUR);
    _checkedOptions.add(ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE);

    _self._checkedOptionsAll = new ArrayList();
    _self._checkedOptionsAll._array = _checkedOptions._array.slice();
    _self._checkedOptionsAll._length = _checkedOptions._length;

    _proto.getOptions = function(){
        return _checkedOptions;
    };

    _proto.setOptions = function(options){
        _checkedOptions.removeAll();
        for(var i = 0; i < options.length; i++){
            _checkedOptions.add(options[i]);
        }
    };

    ContextSearchView.getInstance = function() {
        return _contextSearchView;
    };
    _proto.toggleSearchOption = function() {
        var _self = this;
        _self._contextSearchOptionController.toggleSearchOption();
    };
    _proto.closeSearchOption = function() {
        var _self = this;
        var isForceClose = true;
        _self._contextSearchOptionController.toggleSearchOption(isForceClose);
    };


    _proto.setAutoComplete = function(tabInfo){
        var _self = this;
        if(!tabInfo || typeof tabInfo != 'object'){
            return;
        }
        var _inputArea = $('#txtSearchContext');
        if(!_inputArea){
            return;
        }
        _inputArea.removeClass('autocomplete autocomplete-for-community');
        _inputArea.removeAttr('groupId');
        _inputArea.data('iBinded', false);
        switch(tabInfo.type){
            case TabItemView.TYPE_MY_WORK_PLACE:
                _inputArea.addClass('autocomplete');
                break;
            case TabItemView.TYPE_COMMUNITY:
                _inputArea.addClass('autocomplete-for-community');
                _inputArea.attr('groupId', tabInfo.extras.communityId);
                break;
            default:
                break;
        }
        _self.closeSearchOption();
    };

    $(function() {
        $('#search_btn').button({
            icons : {
                primary : 'ui-icon-search'
            },
            text : false
        });
        $('#txtSearchContext').on('keypress', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                excecute();
                return false;
            }
        });
        $('#search_btn').on('click', function() {
            excecute();
        });
    });
    function excecute() {
        var searchCondition = Utils.trimStringMulutiByteSpace($('#txtSearchContext').val());
        var isOk = isValidateOk(searchCondition);
        if(!isOk) {
            return;
        }
        if(!search(searchCondition)){
            return;
        }
        clearText();
    };
    function clearText() {
        $('#txtSearchContext').val('');
    };
    function isValidateOk(searchCondition) {
        var _self = this;
        var _keywordElem = $('#txtSearchContext');
        _keywordElem.removeClass('input-error');
        var _keywordStr = searchCondition;
        if(_keywordStr == null || typeof _keywordStr != 'string' || _keywordStr == '' || Utils.trimStringMulutiByteSpace(_keywordStr) == '') {
            return false;
        }
        var _keywordList = ViewUtils.getKeywordListFromKeywordInputString(_keywordStr);
        if(_keywordList == null) {
            return false;
        }
        var _count = _keywordList.getCount();
        if(_count < 1) {
            return false;
        }
        for(var _i = 0; _i < _count; _i++) {
            var _inputKeyword = _keywordList.get(_i);
            var _encodeKeyword = encodeURIComponent(_inputKeyword);
            if(_encodeKeyword.length <= 1) {
                _keywordElem.addClass('input-error');
                return false;
            }
        }
        return true;
    };
    _proto.search = function(searchCondition, insertAfterBaseColumn, isSearchAll) {
        return search(searchCondition, insertAfterBaseColumn, isSearchAll);
    };
    function search(searchCondition, insertAfterBaseColumn, isSearchAll) {
        let _self = this;
        var _ret = false;
        if(searchCondition == ''){
            return _ret;
        }
        if(isSearchAll === undefined ||
           typeof isSearchAll !== 'boolean'){
            isSearchAll = false;
        }
        var _contextSearchView = ContextSearchView.getInstance();
        var _columnInformation = new SearchColumnInfomation();
        var _keywordStr = searchCondition;
        _columnInformation.setKeyword(_keywordStr);
        var _contextSearchOptionController = _contextSearchView._contextSearchOptionController;

        if (_self._checkedOptions == null && !isSearchAll) {
            return _ret;
        }
        let optionlist = isSearchAll ? _self._checkedOptionsAll : _self._checkedOptions;
        for (var _i = 0; _i < optionlist.getCount(); _i++) {
            _columnInformation.getSourceColumnTypeList().add(optionlist.get(_i));
        }
        var _searchKeywordFilter = ViewUtils.getKeywordFilterFromKeywordInputString(_keywordStr);

        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _type = _tabInfo.type;
        var _subData = null;
        if(_type == TabItemView.TYPE_COMMUNITY){
            _subData = {};
            _subData.roomId = _tabInfo.extras.communityId;
            _columnInformation.setSubData(_subData);
        }
        var _searchColumnFilter = ColumnFilterManager.getColumnFilterList(
            isSearchAll ? _self._checkedOptionsAll : _self._checkedOptions);
        if (_searchKeywordFilter != null && _searchColumnFilter != null) {
            var _andSearchCondition = new AndCondition();
            _andSearchCondition.addChildCondition(_searchKeywordFilter);
            _andSearchCondition.addChildCondition(_searchColumnFilter);
            var _coulumnSort = new ColumnSortCondition();
            var _columnSearchCondition = new ColumnSearchCondition(_andSearchCondition, _coulumnSort);
            _columnInformation.setSearchCondition(_columnSearchCondition);
            if(insertAfterBaseColumn !== undefined){
                ColumnManager.getInstance().insertAfterColumn(_columnInformation, insertAfterBaseColumn, true, true);
            }else{
                ColumnManager.getInstance().addColumn(_columnInformation, true, true);
            }
            _ret = true;
        }
        return _ret;
    }
})();

function ContextSearchOptionButton() {
};(function() {
    $(function() {
        $('#btnSearchOption').button({
            icons : {
                primary : 'ui-icon-triangle-1-s'
            },
            text : false
        });
        $('.search_menu_btn').on('click', function() {
            const dialog = new DialogSearchOptionView();
            dialog.showDialog();
        });
    });
})();

function ContextSearchOptionController() {
    this._showSearchOptionView = null;
};(function() {
    var _proto = ContextSearchOptionController.prototype;

    _proto.getSearchColumnFilter = function(columnTypeList, subData) {
        var _self = this;
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _type = _tabInfo.type;
        var _columnFilter = null;
        switch(_type){
            case TabItemView.TYPE_MY_WORK_PLACE:
                _columnFilter =ColumnFilterManager.getColumnFilterList(columnTypeList);
                break;
            case TabItemView.TYPE_COMMUNITY:
                _columnFilter =ColumnFilterManager.getColumnFilterForCommunity(columnTypeList, subData);
                break;
            default:
                break;
        }
        return _columnFilter;
    };

    _proto.getSearchOptionView = function() {
        var _self = this;
        var _searchOptionView = _self._showSearchOptionView;
        if(_searchOptionView != null){
            return _searchOptionView;
        }
        return _self._initSearchOptionView();
    };

    _proto.toggleSearchOption = function(isForceClose) {
        var _self = this;
        var _searchOptionElem = $('#frmSearch').children('div.search-option-view');
        if (_searchOptionElem != null && _searchOptionElem.length != 0) {
            if (_searchOptionElem.is(':visible')) {
                _searchOptionElem.slideToggle(_clear);
                return;
            }
            _clear();
        }
        if (isForceClose === true) {
            return;
        }
        var _searchOptionViewObj = _self._initSearchOptionView();
        _self._showSearchOptionView = _searchOptionViewObj;
        _self._showSearchOptionView.toggleView();
        return;

        function _clear(){
            _searchOptionElem.remove();
            if(_self._showSearchOptionView != null){
                _self._showSearchOptionView.cleanup();
                _self._showSearchOptionView = null;
            }
        }
    };
    _proto._initSearchOptionView = function() {
        var _self = this;
        var _htmlStr = _self._createSearchOptionHtml();
        $('#frmSearch').append(_htmlStr);
        var _searchOptionElem = $('#frmSearch').children('div.search-option-view');
        var _searchOptionViewObj = _self._createSearchOptionView(_searchOptionElem);
        return _searchOptionViewObj;
    };

    _proto._createSearchOptionHtml = function() {
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _type = _tabInfo.type;
        var _htmlStr = '';

        switch(_type){
            case TabItemView.TYPE_MY_WORK_PLACE:
                _htmlStr = ContextSearchOptionView.getHtml();
                break;
            case TabItemView.TYPE_COMMUNITY:
                _htmlStr = CommunityContextSearchOptionView.getHtml();
                break;
            default:
                break;
        }
        return _htmlStr;
    };

    _proto._createSearchOptionView = function(htmlElement) {
        var _self = this;
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _type = _tabInfo.type;
        var _ret = null;
        switch(_type){
            case TabItemView.TYPE_MY_WORK_PLACE:
                _ret =new ContextSearchOptionView(htmlElement, _onCloseCallback);
                break;
            case TabItemView.TYPE_COMMUNITY:
                _ret = new CommunityContextSearchOptionView(htmlElement, _onCloseCallback);
                break;
            default:
                break;
        }
        return _ret;

        function _onCloseCallback() {
            _self.toggleSearchOption();
        }
    };
})();

function ContextSearchOptionView(htmlElement, onCloseCallBack) {
    if (!htmlElement || typeof htmlElement != 'object') {
        this._htmlElement = null;
    } else {
        this._htmlElement = htmlElement;
    }
    this._onCloseCallBack = onCloseCallBack;
    this._createEventHandler();
};(function() {

    var _proto = ContextSearchOptionView.prototype;

    ContextSearchOptionView.ERROR_SEARCH_CONDITION_COLUMN = Resource.getMessage('dialogerrorSelect');

    ContextSearchOptionView.getHtml = function() {
        return _getHtml();
    };
    _proto.cleanup = function() {
        var _self = this;
        // This expression has no effect.
        // _self._htmlElement == null;; 
        _self._htmlElement = null;
    };

    _proto.toggleView = function() {
        var _self = this;
        _self._htmlElement.slideToggle();
    };
    _proto.isVisible = function() {
        var _self = this;
        if (_self._htmlElement == null || _self._htmlElement.length == 0 || _self._htmlElement.is(':hidden')) {
            return false;
        }
        return true;
    };
    _proto._createEventHandler = function() {

    };
    _proto.getColumnTypeList = function() {
        var _self = this;
        var _columnCheckboxElement = _self._htmlElement.find('div.search-column-type');
        var _errorElement =  _self._htmlElement.find("p.error-footer");
        _columnCheckboxElement.removeClass('input-error');
        _errorElement.text('');
        _errorElement.addClass('margin-clear');
        var _selectedColumnTypeList = _self._getColumnTypeList();
        var _ret = (_selectedColumnTypeList.getCount() > 0);
        if (!_ret) {
            _self._showError();
            return null;
        }
        return _selectedColumnTypeList;
    };
    _proto.getFilterCondition = function() {
        var _self = this;
        var _selectedColumnTypeList = _self.getColumnTypeList();
        return ColumnFilterManager.getColumnFilterList(_selectedColumnTypeList);
    };
    _proto._showError = function() {
        var _self = this;
        if (!_self.isVisible()) {
            return;
        }
        var _columnCheckboxElement = _self._htmlElement.find('div.search-column-type');
        var _errorElement =  _self._htmlElement.find("p.error-footer");
        _columnCheckboxElement.addClass('input-error');
        _errorElement.text(ContextSearchOptionView.ERROR_SEARCH_CONDITION_COLUMN);
        _errorElement.removeClass('margin-clear');
    };
    _proto._getColumnTypeList = function() {
        var _self = this;
        var _selectedColumnTypeList = new ArrayList();
        if (!_self.isVisible()) {
            return _self._getDefaultColumnTypeList();
        }
        var _searchCheckBoxElm = _self._htmlElement.find('input[type="checkbox"]');
        var _length = _searchCheckBoxElm.length;
        if (_length > 0) {
            for (var _i = 0; _i < _length; _i++) {
                if (_searchCheckBoxElm[_i].checked == true) {
                    _selectedColumnTypeList.add(parseInt(_searchCheckBoxElm[_i].value));
                }
            }
        }
        return _selectedColumnTypeList;
    };
    _proto._getDefaultColumnTypeList = function() {
        var _self = this;
        var _columnTypeList = new ArrayList();
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_TIMELINE);
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_CHAT);
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_TASK);
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_INBOX);
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_GROUP_CHAT);
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED);
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK);
        return _columnTypeList;
    };
    function _getHtml() {
        var _ret = '';
        _ret += '<div class="search-option-view hide-view">';
        _ret += '<div class="search-option-header box-border olient-horizontal width-100">';
        _ret += '<span class="search-option-title">' + Resource.getMessage('search_option_title') + '</span>';
        _ret += '<div class="action-search-option">';
        _ret += '<span class="cancel">';
        _ret += '<img class="img-cancel action-button-base" id="cancel-option" src="images/add_close.png" alt="' + Resource.getMessage('dialog_cancel_title') + '" title="' + Resource.getMessage('dialog_cancel_title') + '">';
        _ret += '<span class="register-task-label-margin"></span>';
        _ret += '<span class="register-task-label-margin"></span>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<form class="search-option-area">';
        _ret += '<div class="box-border olient-horizontal width-100 margin-clear">';
        _ret += '<div class="flex1 margin-clear">';
        _ret += '<div class="float-left search-option-label">' + Resource.getMessage('search_option_label');
        _ret += '</div>';
        _ret += '<div class="float-left">';
        _ret += '<a class="search-option-check-control" id="link-checked-all">' + Resource.getMessage('search_option_checked_all') + '</a>';
        _ret += '</div>';
        _ret += '<div>';
        _ret += '<a class="search-option-check-control" id="link-unchecked-all">' + Resource.getMessage('search_option_unchecked_all') + '</a>';
        _ret += '</div>';
        _ret += '<div class="search-column-type margin-clear">';
        _ret += '<div>';
        _ret += '<span class="select-column-left">';
        _ret += '<input type="checkbox" checked="checked" id="column-info-search-myfeed" value="' + ColumnInformation.TYPE_COLUMN_TIMELINE + '" name="search-column-checkbox"><label for="column-info-search-myfeed" class="search-option-label">' + Resource.getMessage('MyFeed') + '</label>';
        _ret += '</span>';
        _ret += '<span>';
        _ret += '<input type="checkbox" checked="checked" id="column-info-search-chat" value="' + ColumnInformation.TYPE_COLUMN_CHAT + '" name="search-column-checkbox"><label for="column-info-search-chat" class="search-option-label">' + Resource.getMessage('Chat') + '</label>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '<div>';
        _ret += '<span class="select-column-left">';
        _ret += '<input type="checkbox" checked="chcked" id="column-info-search-groupchat" value="' + ColumnInformation.TYPE_COLUMN_GROUP_CHAT + '" name="search-column-checkbox"><label for="column-info-search-groupchat" class="search-option-label">' + Resource.getMessage('GroupChat') + '</label>';
        _ret += '</span>';
        _ret += '<span>';
        _ret += '<input type="checkbox" checked="chcked" id="column-info-search-task" value="' + ColumnInformation.TYPE_COLUMN_TASK + '" name="search-column-checkbox"><label for="column-info-search-task" class="search-option-label">' + Resource.getMessage('MyTask') + '</label>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '<div>';
        _ret += '<span class="select-column-left">';
        _ret += '<input type="checkbox" checked="checked" id="column-info-search-inbox" value="' + ColumnInformation.TYPE_COLUMN_INBOX + '" name="search-column-checkbox"><label for="column-info-search-inbox" class="search-option-label">' + Resource.getMessage('Inbox') + '</label>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '<div>';
        _ret += '<span class="select-column-left">';
        _ret += '<input type="checkbox" checked="chcked" id="column-info-search-community-feed" value="' + ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED + '" name="search-column-checkbox"><label for="column-info-search-community-feed" class="search-option-label">' + Resource.getMessage('CommunityFeed') + '</label>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '<div>';
        _ret += '<span class="select-column-left">';
        _ret += '<input type="checkbox" checked="chcked" id="column-info-search-community-task" value="' + ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK + '" name="search-column-checkbox"><label for="column-info-search-community-task" class="search-option-label">' + Resource.getMessage('ContextSearchCommunityTask') + '</label>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<p class="ui-state-error-text error-footer margin-clear"></p>';
        _ret += '</form>';
        _ret += '</div>';
        return _ret;
    };

    $(function() {

    });
})();
function CommunityContextSearchOptionView(htmlElement, onCloseCallBack) {
    ContextSearchOptionView.call(this, htmlElement, onCloseCallBack);
};(function() {

    CommunityContextSearchOptionView.prototype = $.extend({}, ContextSearchOptionView.prototype);
    var _super = ContextSearchOptionView.prototype;

    var _proto = CommunityContextSearchOptionView.prototype;

    CommunityContextSearchOptionView.getHtml = function() {
        return _getHtml();
    };

    _proto._getDefaultColumnTypeList = function() {
        var _self = this;
        var _columnTypeList = new ArrayList();
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED);
        _columnTypeList.add(ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK);
        return _columnTypeList;
    };
    function _getHtml() {
        var _ret = '';
        _ret += '<div class="search-option-view hide-view">';
        _ret += '<div class="search-option-header box-border olient-horizontal width-100">';
        _ret += '<span class="search-option-title">' + Resource.getMessage('search_option_title') + '</span>';
        _ret += '<div class="action-search-option">';
        _ret += '<span class="cancel">';
        _ret += '<img class="img-cancel action-button-base" id="cancel-option" src="images/add_close.png" alt="' + Resource.getMessage('dialog_cancel_title') + '" title="' + Resource.getMessage('dialog_cancel_title') + '">';
        _ret += '<span class="register-task-label-margin"></span>';
        _ret += '<span class="register-task-label-margin"></span>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<form class="search-option-area">';
        _ret += '<div class="box-border olient-horizontal width-100 margin-clear">';
        _ret += '<div class="flex1 margin-clear">';
        _ret += '<div class="float-left search-option-label">' + Resource.getMessage('search_option_label');
        _ret += '</div>';
        _ret += '<div class="float-left">';
        _ret += '<a class="search-option-check-control" id="link-checked-all">' + Resource.getMessage('search_option_checked_all') + '</a>';
        _ret += '</div>';
        _ret += '<div>';
        _ret += '<a class="search-option-check-control" id="link-unchecked-all">' + Resource.getMessage('search_option_unchecked_all') + '</a>';
        _ret += '</div>';
        _ret += '<div class="search-column-type margin-clear">';
        _ret += '<div>';
        _ret += '<span class="select-column-left">';
        _ret += '<input type="checkbox" checked="chcked" id="column-info-search-community-feed" value="' + ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED + '" name="search-column-checkbox"><label for="column-info-search-community-feed" class="search-option-label">' + Resource.getMessage('CommunityFeed') + '</label>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '<div>';
        _ret += '<span class="select-column-left">';
        _ret += '<input type="checkbox" checked="chcked" id="column-info-search-community-task" value="' + ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK + '" name="search-column-checkbox"><label for="column-info-search-community-task" class="search-option-label">' + Resource.getMessage('ContextSearchCommunityTask') + '</label>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<p class="ui-state-error-text error-footer margin-clear"></p>';
        _ret += '</form>';
        _ret += '</div>';
        return _ret;
    };
})();
function PersonSearchView() {
    SearchView.call(this);
};(function() {
    PersonSearchView.prototype = $.extend({}, SearchView.prototype);
    var _super = SearchView.prototype;
    var _proto = PersonSearchView.prototype;

    $(function() {
        $('#btnSearchPerson').button({
            icons : {
                primary : 'ui-icon-search'
            },
            text : false
        });
        $('#frmSearchPerson').hide('blind', 'fast');
        $('#serarchPersonContainer > div:first').on('mouseover', function() {
            $(this).css('cursor', 'pointer');
        }).on('click', function() {
            $(this).next().toggle('slow');
            return false;
        }).next().show();
        $('#txtSearchPerson').on('keypress', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            }
        });
        $('#btnSearchPerson').on('click', function() {
        });
    });
})();
