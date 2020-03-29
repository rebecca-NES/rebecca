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

function TabItemView() {
    this._tabInfo = {
        type : TabItemView.TYPE_UNKNOWN,
        columnListId : '',
        extras : {}
    };
    this._defaultColumnInfoList = new ArrayList();
    this._sideListViewImpl = null;
    this._onClickCloseCallBack = null;
    this._dom = null;
    this._iconUrl = 'images/blank.png';
    this._isLoading = false;
};
(function() {
    TabItemView.TYPE_UNKNOWN = 0;
    TabItemView.TYPE_MY_WORK_PLACE = 1;
    TabItemView.TYPE_COMMUNITY = 2;

    TabItemView._loadingIconUrl = 'images/loading2.gif';
    var _proto = TabItemView.prototype;

    _proto.init = function() {
        var _self = this;
        return _self;
    };

    _proto.cleanup = function() {
        var _self = this;
        _self._tabInfo = null;
        _self._defaultColumnInfoList = null;
        _self._sideListViewImpl = null;
        _self._onClickCloseCallBack = null;
        _self._dom = null;
        _self._logoUrl = 'images/blank.png';
        _self._isLoading = false;
    };

    _proto.getTabInfo = function() {
        return this._tabInfo;
    };

    _proto.setTabInfo = function(tabInfo) {
        this._tabInfo = tabInfo;
    };

    _proto.getTabType = function() {
        return this._tabInfo.type;
    };

    _proto.getDom = function() {
        var _self = this;
        var _htmlStr = '<span class="tab"><span class="text-abbreviation"></span></span>';
        var _dom = $(_htmlStr);
        var _imgBlank = '<img src="' + _self._iconUrl + '" class="tab-icon">';
        _dom.prepend(_imgBlank);
        _self._createEventHandler(_dom);
        _self._dom = _dom;
        return $(_dom);
    };

    _proto.getDefaultColumnInfoList = function() {
        return this._defaultColumnInfoList;
    };

    _proto.isContainMinimumColumn = function(columnInfoList) {
        return true;
    };

    _proto.getSideListViewImpl = function() {
        return this._sideListViewImpl;
    };

    _proto.getCloseCallBack = function() {
        return this._onClickCloseCallBack;
    };

    _proto.setCloseCallBack = function(onClickCloseCallBack) {
        this._onClickCloseCallBack = onClickCloseCallBack;
    };

    _proto.isMatch = function(tabItemView) {
        if (!tabItemView || typeof tabItemView != 'object') {
            return false;
        }
        var _self = this;
        var _tabInfo =  tabItemView.getTabInfo();
        if(_tabInfo == null){
            return false;
        }
        return _self._tabInfo.type == _tabInfo.type;
    };

    _proto.onNotification = function(notification) {
        if (!notification || typeof notification != 'object') {
            return;
        }
        return;
    };

    _proto._createEventHandler = function(tabItemElm) {
        if (!tabItemElm || typeof tabItemElm != 'object') {
            return;
        }
    };

    _proto._onUpdateLogoUrl = function(logoUrl) {
        var _self = this;
        if(logoUrl == null || typeof logoUrl != 'string') {
            return;
        }
        _self._iconUrl = logoUrl;
        if(_self._isLoading) {
            return;
        }
        _self._changeLogoArea(_self._iconUrl);
    };
    _proto.startLoading = function() {
        var _self = this;
        if(_self._isLoading) {
            return;
        }
        _self._isLoading = true;
        _self._changeLogoArea(TabItemView._loadingIconUrl);
    };
    _proto.endLoading = function() {
        var _self = this;
        if(!_self._isLoading) {
            return;
        }
        _self._changeLogoArea(_self._iconUrl);
        _self._isLoading = false;
    };

    _proto._changeLogoArea = function(logoUrl) {
        var _self = this;
        if(logoUrl == null || typeof logoUrl != 'string') {
            return;
        }

                var _imgBlank = '<img src="' + _self._iconUrl + '" class="tab-icon">';
        var _domblk = $(_imgBlank)
        _self._createEventHandler(_domblk);
        _self._dom = _domblk;

        var _dom = _self._dom;
        _dom.find('img.tab-icon').attr('src', logoUrl);
    };
})();