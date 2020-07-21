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

function SearchPersonResultView(partsType, searchInfo, callbacks) {
    this._searchInfo = searchInfo;
    this._currentLoadedJidForAllUserSearch = 0;
    this._allUserListReceivedForAllUserSearch = false;
    this._searchResultList = null;
    SideMenuUserListView.call(this, partsType, 'search-result', callbacks);
};(function() {

    SearchPersonResultView.prototype = $.extend({}, SideMenuUserListView.prototype);
    var _super = SideMenuUserListView.prototype;
    var _proto = SearchPersonResultView.prototype;

     _proto.initialize = function(condition){
        var _self = this;
        if(condition){
            _self._searchInfo.condition = condition;
        }
        _self._currentLoadedJidForAllUserSearch = 0;
        _self._allUserListReceivedForAllUserSearch = false;
        _self._searchResultList = {};
     };
    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp.call(_self);
        _self._searchInfo = null;
        _self._searchResultList = null;
    };
    _proto._getInnerHtml = function(){
        var _self = this;
        var _ret = '';
        _ret += '<div class="' + _self._partsType + '-' + _self._listViewType +' box-border flex1 olient-vertical vertical-scroll  ui-widget ui-helper-reset hide-view">';
        _ret += '</div>';
        return _ret;
    };

    _proto._createEventHandler = function() {
        var _self = this;
        _super._createEventHandler.call(_self);

        var _selectorBottom = _self.getHtmlElement();
        _selectorBottom.on('bottom', '#groupList-' + _self._listViewType, function() {
            _self._showReadMore();
        });
    };
    _proto._showReadMore = function() {
        var _self = this;
        var _tailOfElm;
        var _ret = false;
        var _maxNumMsg = 0;
        var _rootElm = _self.getHtmlElement();
        var _elm = _rootElm.find('.list-contact');
        if (!_elm || typeof _elm != 'object') {
            return _ret;
        }
        var _isOpen = _self._searchInfo.isOpenSearchResultView();
        var _lastIndex = _self._searchInfo.lastExecSearchTabIndex();
        if(!_isOpen || _lastIndex != SearchPersonView.TAB_TYPE_ALL_USER_SEARCH){
            return;
        }
        if (_self._allUserListReceivedForAllUserSearch == true) {
            return false;
        }
        _tailOfElm = _rootElm.parent().children('div:last');
        if (_tailOfElm.hasClass('loading-readmore')) {
            return false;
        }
        ViewUtils.showLoadingIcon(_rootElm);
        _maxNumMsg = _elm.children('div').size();
        if (_maxNumMsg == 0) {
            ViewUtils.hideLoadingIcon(_rootElm);
            return false;
        }
        var _condition = _self._searchInfo.condition;
        if(_self._parentObj && _self._parentObj.searchExecuteFromAllUser){
            _self._parentObj.searchExecuteFromAllUser(_condition);
        }
        _ret = true;
        return _ret;
    };
    _proto._asyncShowPersonList = function(searchResult, callbackFunc) {
        var _self = this;

        function _callCallback() {
            setTimeout(function() {
                if(callbackFunc && typeof callbackFunc == 'function') {
                    callbackFunc();
                }
            }, 1);
        }

        _self.getHtmlElement().children().remove();
        _self.getHtmlElement().addClass('hide-view');
        ViewUtils.showLoadingIcon(_self.getHtmlElement());
        var _groupTitle = Resource.getMessage('sideview_label_search_result');
        var _searchResultData = _self._createOneGroupData(_groupTitle, searchResult, true, searchResult.getAllItemCount());

        _asyncShowPersonListView();

        function _asyncShowPersonListView() {
            var _cotactListArea = _self.getHtmlElement();
            if(!_cotactListArea) {
                _callCallback();
                return;
            }
            var _gListStr = '';
            _gListStr += '<div id="groupList-' + _self._listViewType + '" class="' + _self._listViewType + ' group-list box-border-for-abbreviation olient-vertical flex1 vertical-scroll">';
            _gListStr += '  <div class="btn-back-to-list " align="right">';
            _gListStr += '    <button type="button" class="btnBackToOriginal">' + Resource.getMessage('sideview_btn_back_to_contact_list') + '</button>';
            _gListStr += '  </div>';
            _gListStr += '</div>';
            _cotactListArea.append(_gListStr);
            var _groupListArea = _cotactListArea.find('#groupList-' + _self._listViewType);
            _self._asyncAddGroupToPersonList(_groupListArea, _searchResultData, function(flag){
                if(flag && _searchResultData.person.length > 0){
                    var _lastUser = _searchResultData.person[_searchResultData.person.length - 1];
                    var _lastUserId = _lastUser.getId();
                    _self._currentLoadedJidForAllUserSearch = _lastUserId;
                }
            });
            setTimeout(function(){
                _asyncSetAccordion();
            }, 1);
        }
        function _asyncSetAccordion() {
            var _cotactListArea = _self.getHtmlElement();
            if(_cotactListArea == null) {
                _callCallback();
                return;
            }
            _cotactListArea.accordion('destroy').accordion({
                header : '> div > div > h3',
                fillSpace : true,
                collapsible : false,
                active: 0
            }).sortable({
                axis : 'y',
                handle : 'h3',
                stop : function(event, ui) {
                    ui.item.children('h3').triggerHandler('focusout');
                }
            });
            _cotactListArea.find('.group a').css('background-color', '#FFDDAA');
            setTimeout(function() {
                _asyncDisplayPersonList();
            }, 1);
        }
        function _asyncDisplayPersonList() {
            var _cotactListArea = _self.getHtmlElement();
            if(_cotactListArea == null) {
                _callCallback();
                return;
            }
            _self._frame.find('.btnBackToOriginal').button();
            _self._frame.find('.btnBackToOriginal').on('click', function(){
                if(_self._parentObj && _self._parentObj.onRemoveView){
                    _self._parentObj.onRemoveView();
                    _self._parentObj = null;
                }
                _self.cleanUp();
                _self._frame.remove();
            });
            var _groupList = _cotactListArea.find('#groupList-' + _self._listViewType);
            _groupList.bottom({proximity : 0.1});
            ViewUtils.hideLoadingIcon(_self.getHtmlElement());
            _cotactListArea.removeClass('hide-view');
            _self.resizeAreaForIE89();
            _self.resizeContent();
            _groupList.scrollTop(0);
            _callCallback();
        }
        return true;
    };

    _proto.onSearchPersonCallback = function(searchResult, callbackFunc){
        var _self = this;
        var _count = searchResult.getCount();

        if (_count < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')) {
            _self._allUserListReceivedForAllUserSearch = true;
        }

        if(_self._currentLoadedJidForAllUserSearch == 0){
            _self._asyncShowPersonList(searchResult, function(){
                _self._refreshSearchResultList(searchResult);
                callbackFunc();
            });
            return;
        }
        for(var i=0; i<_count; i++){
            var _person = searchResult.get(i);
            var _jid = _person.getJid();
            var _personHtmlElem = _self._createHtmlOnePersonFromPersonData(_person);

            var _targetElem = _self.getHtmlElement().find('.group[groupname]');
            if(_targetElem.length > 0 && _targetElem.find('.list-contact div[jid="' + _jid + '"]').length == 0){
                _targetElem.find('.list-contact').append(_personHtmlElem);
                _self._currentLoadedJidForAllUserSearch = _person.getId();
            }
            _self._addSearchResultPersonData(_person);
        }
        ViewUtils.hideLoadingIcon(_self.getHtmlElement());
        _self.resizeAreaForIE89();
        _self.resizeContent();
        callbackFunc();
    };
    _proto.getPersonData = function(jid){
        var _self = this;
        return _self._searchResultList[jid];
    };
    _proto._refreshSearchResultList = function(searchResult) {
        if(searchResult == null){
            return;
        }
        var _self = this;
        _self._searchResultList = {};
        var _count = searchResult.getCount();
        for(var i=0; i<_count; i++){
            var _person = searchResult.get(i);
            if(_person == null){
                continue;
            }
            var _jid = _person.getJid();
           _self._searchResultList[_jid] = _person;
        }
    };

    _proto._addSearchResultPersonData = function(person) {
        if(person == null){
            return;
        }
        var _self = this;
        var _jid = person.getJid();
        _self._searchResultList[_jid] = person;
    };

    _proto.resizeContent = function() {
        var _self = this;
        var _listArea = _self.getHtmlElement();

        if (_listArea.closest('dd').css('display') == 'none') {
            return;
        }
        var _isOpen = _self._searchInfo.isOpenSearchResultView();
        var _lastIndex = _self._searchInfo.lastExecSearchTabIndex();
        if(!_isOpen || _lastIndex != SearchPersonView.TAB_TYPE_ALL_USER_SEARCH){
            return;
        }
        _nextRead();
        function _nextRead() {
            var _groupList = _listArea.find('#groupList-' + _self._listViewType);
            if(_groupList.length != 1){
                return;
            }
            if (_groupList.prop('clientHeight') == _groupList.prop('scrollHeight')) {
                if (!_self._allUserListReceivedForAllUserSearch) {
                    var _condition = _self._searchInfo.condition;
                    setTimeout(function() {
                        if(_self._parentObj && _self._parentObj.searchExecuteFromAllUser){
                            _self._parentObj.searchExecuteFromAllUser(_condition);
                        }
                    }, 1);
                }
            }
        }
    };
    _proto.resizeAreaForIE89 = function() {
        if(!ViewUtils.isIE89()){
            return;
        }
        var _self = this;
        if (_self._frame == null) {
            return;
        }
        var _rootElm = _self._frame;
        var _groupListArea = _rootElm.find('#groupList-' + _self._listViewType);
        var _parentHeight = _rootElm.closest('dd').outerHeight(true);
        var _startChatFormObjHeight = 0;
        var _searchViewElm = _rootElm.closest('dd').find('#ui-tab');
        _searchViewHeight = _searchViewElm.outerHeight(true);
        var _contentsHeight = _parentHeight - _searchViewHeight;
        _groupListArea.height(_contentsHeight);
    };
})();

