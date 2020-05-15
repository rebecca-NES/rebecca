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

function TabManager() {
    this._tabContainerElement = $('#tabContainer');
    this._tabInnerContainerElement = this._tabContainerElement
            .children('#tabInnerContainer');
    this._prevTabElement = $('#prevTab');
    this._nextTabElement = $('#nextTab');
    this._tabItemViewList = new ArrayList();
    this._tabSelectRefreshing = false;
    this._communityInfo = new CommunityInfo();
    this.selectedInfo = {}
}
(function() {

    var TAB_CLASSES = {};
    TAB_CLASSES[TabItemView.TYPE_MY_WORK_PLACE] = TabMyWorkPlaceItemView;
    TAB_CLASSES[TabItemView.TYPE_COMMUNITY] = TabCommunityItemView;

    var _tabManager = new TabManager();

    TabManager.getInstance = function() {
        return _tabManager;
    };

    var _proto = TabManager.prototype;

    _proto.onLogin = function(callback) {
        var _self = this;
        _self._refreshTab(_refreshTabCallback);
        function _refreshTabCallback(activeTabInfo, defaultColumnInfoList) {
            if (callback != null && typeof callback == 'function') {
                callback(activeTabInfo, defaultColumnInfoList);
            }
        };
        ContextSearchView.getInstance().setAutoComplete({type:TabItemView.TYPE_MY_WORK_PLACE});
    };

    _proto.selectOrAddTabByCommunityId = function(communityId, callback) {
        var _self = this;
        var _tabCommunity = new TabCommunityItemView();
        if ($('.control-sidebar').hasClass('control-sidebar-open')) {
            $('.control-sidebar').toggleClass('control-sidebar-open');
        }
        _self._communityInfo = new CommunityInfo();
        if(communityId == "myworkplace"){
         _tabCommunity = new (Utils.getSafeValue(
               TAB_CLASSES, TabItemView.TYPE_MY_WORK_PLACE,
               TabItemView))();
        _tabCommunity.init();
       }else{
        _tabCommunity.init(communityId);
       }
        _self.selectOrAddTab(_tabCommunity, callback);
    };

    _proto.selectOrAddTabByCommunityInfo = function(communityId, communityInfo, callback) {
        var _self = this;
        var _tabCommunity = new TabCommunityItemView();
        if ($('.control-sidebar').hasClass('control-sidebar-open')) {
            $('.control-sidebar').toggleClass('control-sidebar-open');
        }
        if(communityId == "myworkplace"){
            _self._communityInfo = new CommunityInfo();
            _tabCommunity = new (Utils.getSafeValue(
               TAB_CLASSES, TabItemView.TYPE_MY_WORK_PLACE,
               TabItemView))();
            _tabCommunity.init();
        }else{
            _self._communityInfo = communityInfo;
            _tabCommunity.init(communityId);
        }
        _self.selectOrAddTab(_tabCommunity, callback);
    };

    _proto.selectOrAddTab = function(tabItemViewObj, callback) {
        if (!tabItemViewObj || typeof tabItemViewObj != 'object') {
            return;
        }
        var _self = this;
        var _count = _self._tabItemViewList.getCount();
        var _pos = -1;
        for ( var _i = 0; _i < _count; _i++) {
            var _tabObj = _self._tabItemViewList.get(_i);
            if(_tabObj.isMatch(tabItemViewObj)){
                _pos = _i;
                break;
            }
        }
        if(_pos == -1){
            _self._appendTab(tabItemViewObj);
            _self._tabItemViewList.add(tabItemViewObj);
            _pos = _self._tabItemViewList.getCount() - 1;
            _self._saveTab(_activeTab);
        }else{
            _activeTab();
        }

        function _activeTab(){
            _self._selectAndRefresh(_pos, callback);
        };
    };

    _proto.onNotification = function(notification) {
        var _self = this;
        var _tabItemViewList = _self._tabItemViewList;
        var _count = _tabItemViewList.getCount();
        var _index = 0;
        var _delay = 10;
        function asyncNotificationFunc() {
            if(_index >= _count) {
                return;
            }
            var _curTabItemView = _tabItemViewList.get(_index);
            _curTabItemView.onNotification(notification);
            _index++;
            setTimeout(asyncNotificationFunc, _delay);
        }
        setTimeout(asyncNotificationFunc, _delay);
    };

    _proto._refreshTab = function(callback) {
        var _self = this;
        function getTabInfoArrayCallback(tabInfoArray) {
            var isCorrect = false;
            if (tabInfoArray != null && tabInfoArray.length > 0) {
                var isOnlyOneMyWorkplace = false;
                for ( var _i = 0; _i < tabInfoArray.length; _i++) {
                    var _tabInfo = tabInfoArray[_i];
                    if (_tabInfo == null) {
                        continue;
                    }
                    if (_tabInfo.type == TabItemView.TYPE_MY_WORK_PLACE) {
                        isOnlyOneMyWorkplace = !isOnlyOneMyWorkplace;
                    }
                }
                isCorrect = isOnlyOneMyWorkplace;
            }
            if (isCorrect) {
                for ( var _i = 0; _i < tabInfoArray.length; _i++) {
                    var _tabInfo = tabInfoArray[_i];
                    if (_tabInfo == null) {
                        continue;
                    }
                    var _tabItemView = new (Utils.getSafeValue(TAB_CLASSES,
                            _tabInfo.type, TabItemView))();
                    _tabItemView.setTabInfo(_tabInfo);
                    _tabItemView.setCloseCallBack(_onClickCloseCallBackFunc);
                    _tabItemView.init();
                    _self._tabItemViewList.add(_tabItemView);
                }
            } else {
                var _tabMyWorkPlaceItemView = new (Utils.getSafeValue(
                        TAB_CLASSES, TabItemView.TYPE_MY_WORK_PLACE,
                        TabItemView))();
                _tabMyWorkPlaceItemView.setTabInfo(_tabInfo);
                _tabMyWorkPlaceItemView.setCloseCallBack(_onClickCloseCallBackFunc);
                _tabMyWorkPlaceItemView.init();
                _self._tabItemViewList.add(_tabMyWorkPlaceItemView);
            }
            if (callback != null && typeof callback == 'function') {
                var _myWorkPlaceTabView = _self._tabItemViewList.get(0);
                var _activeTabInfo = _myWorkPlaceTabView.getTabInfo();
                _self.selectedInfo = _myWorkPlaceTabView;
                var _defaultColumnInfoList  = _myWorkPlaceTabView.getDefaultColumnInfoList();
                var _sideListViewImpl = _myWorkPlaceTabView.getSideListViewImpl();
                SideListView.getInstance().refreshContents(_sideListViewImpl, _activeTabInfo);
                callback(_activeTabInfo, _defaultColumnInfoList);
                _self.isCreateGroupchat("myworkplace");
            }
            function _onClickCloseCallBackFunc(tabElemObj){
                _self._onClickCloseCallBack(tabElemObj);
            }
        };
        TabColumnStateStore.getInstance().getTabArray(getTabInfoArrayCallback);
    };

    _proto.isActiveMyWorkplace = function() {
        return (this.getCurrentTabInfo().type == 1);
    };

    _proto.activeMyWorkplaceTab = function(callback) {
        var _self = this;
        var len = _self._tabItemViewList.getCount();
        var index = -1;

        if ($('.control-sidebar').hasClass('control-sidebar-open')) {
            $('.control-sidebar').toggleClass('control-sidebar-open');
        }
        $("#groupChatList > div.all_gc_list_btn").removeClass('nomalpadd')
        $("#groupChatList > div.all_public_list_btn").show()

        for (var i=0; len; i++) {
            if (_self._tabItemViewList.get(i) instanceof TabMyWorkPlaceItemView) {
              index = i;
              break;
            }
        }

        if (index > -1) {
          _self._communityInfo = new CommunityInfo();
          _self._refreshContents(index, callback);
        } else {
            setTimeout(function() {
                if(callback != null && typeof callback == 'function') {
                    callback(false);
                }
            },1);
            return;
        }
    };

    _proto.isActiveCommunityTab = function(communityId) {
        var _self = this;
        var _ret = false;
        var _currentAcctiveTabItemView = _self.getCurrentTabItemView();
        if(_currentAcctiveTabItemView.getTabType() != TabItemView.TYPE_COMMUNITY) {
            return false;
        }
        return _currentAcctiveTabItemView.isMutchCommunityId(communityId);
    };

    _proto._saveTab = function(callback) {
        var _self = this;
        var _tabArray = new Array();
        var _count = _self._tabItemViewList.getCount();
        for ( var _i = 0; _i < _count; _i++) {
            var _tabObj = _self._tabItemViewList.get(_i);
            if (_tabObj == null) {
                continue;
            }
            _tabArray.push(_tabObj.getTabInfo());
        }
        TabColumnStateStore.getInstance().setTabArray(_tabArray, function() {
            setTimeout(function() {
                if (callback != null && typeof callback == 'function') {
                    callback();
                }
            }, 1);
        });
    };

    _proto._appendTab = function(tabItemViewObj) {
        if (!tabItemViewObj || typeof tabItemViewObj != 'object') {
            return;
        }
        var _self = this;
        var _dom = tabItemViewObj.getDom();
        _self._tabInnerContainerElement.append(_dom);
    };

    _proto.getCurrentTabItemView = function() {
        var _self = this;
        var _selectedElm = _self._tabInnerContainerElement.children('span.tab.select');
        var _index = _selectedElm.index();
        var _tabItemView = _self._tabItemViewList.get(_index);
        return _tabItemView;
    };

    _proto.getCurrentTabInfo = function() {
        if(typeof this.selectedInfo == 'object' &&
           Object.keys(this.selectedInfo) == 0){
            return new TabItemView();
        }else{
            return this.selectedInfo.getTabInfo();
        }
    };
    _proto.getCommunityInfo = function() {
        return this._communityInfo;
    };


    _proto._selectAndRefresh = function(index, callback) {
        if (index == null || typeof index != 'number') {
            return;
        }
        var _self = this;
        var _tabElm = _self._tabInnerContainerElement.children().eq(index);
        var _isSelect = _self._selectTab(_tabElm);

        if(_isSelect){
            if(index == 0){
                $("#groupChatList > div.all_gc_list_btn").removeClass('nomalpadd')
                $("#groupChatList > div.all_public_list_btn").show()
            }else{
                $("#groupChatList > div.all_gc_list_btn").addClass('nomalpadd')
                $("#groupChatList > div.all_public_list_btn").hide()
            }
            _self._refreshContents(index, callback);
        } else {
            setTimeout(function() {
                if(callback != null && typeof callback == 'function') {
                    callback(false);
                }
            },1);
            return;
        }
    };

    _proto._onClickCloseCallBack = function(tabElemObj) {
        if (!tabElemObj || typeof tabElemObj != 'object') {
            return;
        }
        var _self = this;
        var _index = tabElemObj.index();
        if(_index == null || _index == -1){
            return;
        }
        var _ret = _self._deleteTab(tabElemObj);
        if(_ret){
            _self._saveTab(function(){
                _self.resizeContent();
                if(tabElemObj.hasClass('select')){
                    var _preIndex = (_index - 1 < 0) ? 0 : _index - 1;
                    _self._selectAndRefresh(_preIndex);
                }
            });
        }
    };

    _proto._deleteTab = function(tabElemObj) {
        if (!tabElemObj || typeof tabElemObj != 'object') {
            return false;
        }
        var _self = this;
        if(_self._tabSelectRefreshing) {
            return false;
        }
        var _index = tabElemObj.index();
        var _tabItemView = _self._tabItemViewList.get(_index);
        if(_tabItemView == null){
            return false;
        }
        _tabItemView.cleanup();
        _self._tabItemViewList.remove(_index);
        tabElemObj.remove();
        tabElemObj = null;
        return true;
    };

    _proto._deleteProject = function(tabItemViewObj) {
        var _self = this;

        var _count = _self._tabItemViewList.getCount();
        var _pos = -1;
        for ( var _i = 0; _i < _count; _i++) {
            var _tabObj = _self._tabItemViewList.get(_i);
            if(_tabObj.isMatch(tabItemViewObj)){
                _pos = _i;
                break;
            }
        }

        if(_pos != -1) {
            var _tabItemView = _self._tabItemViewList.get(_pos);
            if(_tabItemView == null){
                return;
            }
            _tabItemView.cleanup();
            _self._tabItemViewList.remove(_pos);
        }
    };

    _proto._selectTab = function(tabElemObj) {
        if (!tabElemObj || typeof tabElemObj != 'object') {
            return false;
        }
        var _self = this;
        if(_self._tabSelectRefreshing) {
            return false;
        }
        var _isSelected = $(tabElemObj).hasClass('select');
        if (_isSelected) {
            return false;
        }
        var _tabInnnerElm = _self._tabInnerContainerElement;
        var _tabChildren = _tabInnnerElm.children();
        _tabChildren.removeClass('select');
        $(tabElemObj).addClass('select');
        $(tabElemObj).removeClass('left-select');

        for(var i=1; i<_tabChildren.length; i++){
            if($(_tabChildren[i]).hasClass('select')){
                $(_tabChildren[i-1]).addClass('left-select');
            }else{
                $(_tabChildren[i-1]).removeClass('left-select');
            }
        }
        return true;
    };

    _proto._bringTabIntoView = function(index) {
        if (index == null || typeof index != 'number') {
            return;
        }
        var _self = this;
        var _tabInnnerElm = _self._tabInnerContainerElement;
        var _tabElm = _tabInnnerElm.children().eq(index);
        if(_tabElm.length == 0){
            return;
        }
        var _tabInnnerOffsetLeft = _tabInnnerElm.offset().left;
        var _offsetLeft = _tabElm.offset().left;
        var _tabContainerElement = _self._tabContainerElement;
        var _curTabContainerScrollPount = _tabContainerElement.scrollLeft();
        _offsetLeft = _curTabContainerScrollPount + _offsetLeft;
        _tabContainerElement.animate({
            scrollLeft : _offsetLeft
        }, 'slow');
    };

    _proto.resizeContent = function() {
        var _self = this;
        _self._resizeTabAreaWidth();
        _self._controllTabScrollButton();
        _self._resizeTabAreaWidth();
    };

    _proto._resizeTabAreaWidth = function() {
        var _self = this;
        var _tabInnerAreaWidth = 0;
        _self._tabInnerContainerElement.children().each(function(){
            var _tabWidth = $(this).outerWidth(true);
            _tabInnerAreaWidth += _tabWidth;
        });
        _tabInnerAreaWidth += 2;
        _self._tabInnerContainerElement.css('width', _tabInnerAreaWidth);
        _self._tabInnerContainerElement.css('min-width', _tabInnerAreaWidth);
        _self._tabInnerContainerElement.css('max-width', _tabInnerAreaWidth);
        var _headerContainerElm = $('#headerContainer');
        var _prevTabParentElm = _self._prevTabElement.parent();
        var _nextTabParentElm = _self._nextTabElement.parent();
        var _notificationAreaElm = _headerContainerElm.children('#notification-area');
        var _genaralSettingElm = _headerContainerElm.children('.options');
        var _headerWidth = _headerContainerElm.outerWidth(true);
        var _prevTabWidth = _prevTabParentElm.outerWidth(true);
        var _nextTabWidth = _nextTabParentElm.outerWidth(true);
        _self._tabContainerElement.addClass('display-none');
        var _notificationAreaWidth = _notificationAreaElm.outerWidth(true);
        var _genaralSettingWidth = _genaralSettingElm.outerWidth(true);
        _self._tabContainerElement.removeClass('display-none');
        var _tabContainerWidth = _headerWidth - ( _prevTabWidth + _nextTabWidth + _notificationAreaWidth + _genaralSettingWidth );
        _tabContainerWidth = (_tabContainerWidth > Conf.getVal('MIN_TAB_WIDTH')) ? _tabContainerWidth : Conf.getVal('MIN_TAB_WIDTH');
        _tabContainerWidth -= 1;
        _self._tabContainerElement.css('min-width', _tabContainerWidth);
        _self._tabContainerElement.css('max-width', _tabContainerWidth);
        _self._tabContainerElement.width(_tabContainerWidth);
    };

    _proto._controllTabScrollButton = function() {
        var _self = this;
        var _tabContainerElm = _self._tabContainerElement;
        var _tabInnerContainerElm = _self._tabInnerContainerElement;
        var _prevElm = _self._prevTabElement;
        var _nextElm = _self._nextTabElement;

        var _tabContainerWidth = _tabContainerElm.outerWidth(true);
        var _tabInnerContainerWidth = _tabInnerContainerElm.outerWidth(true);

        if (_tabContainerWidth < _tabInnerContainerWidth) {
            _nextElm.removeClass('display-none');
            _prevElm.removeClass('display-none');
        } else {
            _nextElm.addClass('display-none');
            _prevElm.addClass('display-none');
        }
    };
    _proto.isCreateGroupchat = function(communityid) {
        var _self = this;
        var auth_if = AuthorityInfo.getInstance();
        if(auth_if.checkRights("createGroupchat") == true){
            $("#groupChatList .list_ttl > a").show();
        }else{
            $("#groupChatList .list_ttl > a").hide();
        }
    };
    _proto._refreshContents = function(index, callback) {
        if (index == null || typeof index != 'number') {
            return;
        }
        var _self = this;
        if(_self._tabSelectRefreshing) {
            setTimeout(function() {
                if(callback != null && typeof callback == 'function') {
                    callback(false);
                }
            },1);
            return;
        }
        var _tabItemView = _self._tabItemViewList.get(index);
        if (!_tabItemView) {
            setTimeout(function() {
                if(callback != null && typeof callback == 'function') {
                    callback(false);
                }
            },1);
            return;
        }
        _self._tabSelectRefreshing = true;
        _tabItemView.startLoading();

        var _tabInfo = _tabItemView.getTabInfo();
        _self.selectedInfo = _tabItemView;
        var _columnListId = _tabInfo.columnListId;
        var _columnInfoList = _tabItemView.getDefaultColumnInfoList();  
        TabColumnStateStore.getInstance().getColumnList(_columnListId, onGetColumnList);
        function onRefreshCallBack(refleshResult){
            if(refleshResult){
                _tabItemView.endLoading();
                _self._tabSelectRefreshing = false;
                if(callback != null && typeof callback == 'function') {
                    callback(refleshResult);
                    head_scr.update();                          
                    wtc_scr.update();                           
                }
            }else{
                callback(false);
            }
        }
        function onGetColumnList(columnInfoList){
            if(_tabItemView.isContainMinimumColumn(columnInfoList)) {
                _columnInfoList = columnInfoList;
            }
            _removeMTipUnderBody(function(){});
            setTimeout(_refreshInnerContents, 1);
            col_scr.forEach(function (value) {
                value.destroy();
            });
            col_scr = [];
        }
        function _removeMTipUnderBody(onRemoveCallback) {
            var _mTipElems = $('body').children('div.mTip');
            var _mTipsCount = _mTipElems.length;
            var _mTipIndex = _mTipsCount - 1;
            function _removeMTipElem() {
                var _loopCount = 100;
                for(var _i = 0; _i < _loopCount; _i++) {
                    if(_mTipIndex < 0) {
                        break;
                    }
                    _mTipElems.eq(_mTipIndex).remove();
                    _mTipIndex--;
                }
                if(_mTipIndex < 0) {
                    // Variable 'onRemoveCallback' is of type function, but it is compared to an expression of type null.
                    // if(onRemoveCallback != null && typeof onRemoveCallback == 'function') {
                    // This guard always evaluates to true.
                    // if (typeof onRemoveCallback == 'function') {
                        onRemoveCallback();
                    // }
                    return;
                }
                setTimeout(function() {
                    _removeMTipElem();
                }, 1);
            }
            setTimeout(function() {
                _removeMTipElem();
            }, 1);
            return;
        }
        function _refreshInnerContents() {
            ContextSearchView.getInstance().setAutoComplete(_tabInfo);
            ColumnManager.getInstance().refresh(_columnListId, _columnInfoList, onRefreshCallBack);
            setTimeout(function(){
                var _sideListViewImpl = _tabItemView.getSideListViewImpl();
                _self.isCreateGroupchat(_tabInfo.extras.communityId);
                var _tagRoute = "#groupChatList > ul > div.list-groupchat";
                $(_tagRoute).find('*').off();
                $(_tagRoute).off().remove();
                if(index == 0){
                    _tagRoute = ".contact_list ul.sidebar_list > div.contact-list-top";
                    $(_tagRoute).children().off();
                    $(_tagRoute).off().remove();
                    _tagRoute = ".colum_list .list_ttl > a";
                    $(_tagRoute).show();
                    $('#prj_ico').hide();
                    $('#side-bar-recent-ico').hide();
                    $('#side-bar-murmur-ico').show();
                    SideMenuRecentView.getInstance().clearColumn();
                    SelectAndAddProjectView.getInstance().setHeaderIconAndColor(null);
                }else{
                    _tagRoute = ".colum_list .list_ttl > a";
                    $(_tagRoute).hide();
                    $('#prj_ico').show();
                    $('#side-bar-recent-ico').show();
                    $('#side-bar-murmur-ico').hide();
                    SelectAndAddProjectView.getInstance().setHeaderIconAndColor(_self.getCommunityInfo());
                }
                SideListView.getInstance().refreshContents(_sideListViewImpl,_tabInfo);
            },1);
        }
    };

    _proto._getMyWorkPlaceTabObj = function() {
        var _self = this;
        var _count = _self._tabItemViewList.getCount();
        var _i = 0;
        for (; _i < _count; _i++) {
            var _tabObj = _self._tabItemViewList.get(_i);
            var _tabInfo = _tabObj.getTabInfo();
            if (_tabInfo.type == TabItemView.TYPE_MY_WORK_PLACE) {
                break;
            }
        }
        if (_i == _count) {
            return $();
        }
        var _tabInnnerElm = _self._tabInnerContainerElement;
        var _myWorkPlaceObj = _tabInnnerElm.children().eq(_i);
        return $(_myWorkPlaceObj);
    };

    _proto.startRefreshingFromLoginView = function() {
        var _self = this;
        _self._tabSelectRefreshing = true;
        var _tabItemView = _self.getCurrentTabItemView();
        _tabItemView.startLoading();
    };
    _proto.endRefreshingFromLoginView = function() {
        var _self = this;
        var _tabItemView = _self.getCurrentTabItemView();
        _tabItemView.endLoading();
        _self._tabSelectRefreshing = false;
    };

})();
