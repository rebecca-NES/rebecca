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
function SearchPersonView(parent) {
    SideMenuParts.call(this);
    this._selectedTabIndex = 0;
    this._parentObj = parent;
    this._lastExecSearchTabIndex = -1;

    this.init();
};(function() {
    SearchPersonView.prototype = $.extend({}, SideMenuParts.prototype);
    var _super = SideMenuParts.prototype;
    var _proto = SearchPersonView.prototype;

    SearchPersonView.TAB_TYPE_INNER_SEARCH = 0;
    SearchPersonView.TAB_TYPE_ALL_USER_SEARCH = 1;
    _proto.init = function() {
        var _self = this;
        _super.init.call(_self);
        _self._frame = _self._createFrame();
        _self._createEventHandler();
        return _self;
    };
    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp.call(_self);
        if(_self._parentObj){
            _self._parentObj = null;
        }
    };
    _proto._createFrame = function() {
        var _self = this;
        var _ret = "";
        _ret =  '<div id="ui-tab" class="user-search-tab">';
        _ret += '  <ul class="userSearchTab">';
        _ret += '    <li><a href="#fragment-1"><span>' + Resource.getMessage('sideview_tab_search_contact_list_member') + '</span></a></li>';
        _ret += '    <li><a href="#fragment-2"><span>' + Resource.getMessage('sideview_tab_search_all_user') + '</span></a></li>';
        _ret += '  </ul>';
        _ret += '  <div id="fragment-1" class="tab-contents">';
        _ret += '    <div class="box-border search-main-view width-100">';
        _ret += '      <input type="text" placeholder="' + Resource.getMessage('sideview_text_search_placeholder') + '" id="txtSearchGroupUser" class="txtSearchUser ui-corner-all" size="5"/>';
        _ret += '      <button type="button" class="btnSearchUser btn-user-search" title="' + Resource.getMessage('sideview_btn_search_exec') + '" id="btnContactListUserSearch"/>';
        _ret += '    </div>';
        _ret += '  </div>';
        _ret += '  <div id="fragment-2" class="tab-contents">';
        _ret += '    <div class="box-border search-main-view width-100">';
        _ret += '      <input type="text" placeholder="' + Resource.getMessage('sideview_text_search_placeholder') + '" id="txtSearchAllUser" class="txtSearchUser ui-corner-all" size="5"/>';
        _ret += '      <button type="button" class="btnSearchUser btn-user-search" title="' + Resource.getMessage('sideview_btn_search_exec') + '" id="btnAllUserSearch" />';
        _ret += '    </div>';
        _ret += '  </div>';
        _ret += '</div>';
        _ret = $(_ret).tabs({
            selected : 0,
            select: function(event, ui){
                _self._selectedTabIndex = ui.index;
            }
        });
        return _ret;
    };
    _proto._createEventHandler = function(){
        var _self = this;
        _self._frame.find('.btnSearchUser').button({
            icons : {primary : 'ui-icon-search'},
            text : false
        });
        _self._frame.find('.txtSearchUser').on('keypress', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                _self._excecute();
                _self._lastExecSearchTabIndex = _self._selectedTabIndex;
                return false;
            }
        });
        _self._frame.find('.btnSearchUser').on('click', function() {
            _self._lastExecSearchTabIndex = _self._selectedTabIndex;
            _self._excecute();
        });
    };
    _proto._excecute = function() {
        var _self = this;
        var _index = _self._selectedTabIndex;
        var _inputKeyword = null;
        var _condition = null;

        switch(_index){
            case  SearchPersonView.TAB_TYPE_INNER_SEARCH:
            _inputKeyword = _self._frame.find('#txtSearchGroupUser').attr('value');
            break;
            case SearchPersonView.TAB_TYPE_ALL_USER_SEARCH:
            _inputKeyword = _self._frame.find('#txtSearchAllUser').attr('value');
            break;
        }

        var _searchKeyword = Utils.trimStringMulutiByteSpace(_inputKeyword);
        if(!_searchKeyword || _searchKeyword == ""){
            return;
        }

        _condition = ViewUtils.getKeywordFilterFromKeywordInputString(_searchKeyword, false);

        if(_self._parentObj && typeof _self._parentObj.searchExecute == 'function'){
            _self._parentObj.searchExecute(_index, _condition);
        }
    };
    _proto.searchAllUser = function(startId, condition, onSearchPersonCallback){
        if (!condition || typeof condition != 'object') {
            return;
        }
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("login_account");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_ASC);
        var _filterCondition = condition;
        var _columnSearchCondition = new ColumnSearchCondition(_filterCondition, _sortCondition);
        var _count = Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST');

        return CubeeController.getInstance().searchPerson(startId, _count, _columnSearchCondition, onSearchPersonCallback);
    };

    _proto.notifyAddContactListMemberCallBack = function(memberList){
    };
    _proto.notifyRemoveContactListMemberCallBack = function(memberList){
    };
})();
