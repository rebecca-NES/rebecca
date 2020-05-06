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

function TabMyWorkPlaceItemView() {
    TabItemView.call(this);
};
(function() {

    TabMyWorkPlaceItemView.prototype = $.extend({}, TabItemView.prototype);
    var _super = TabItemView.prototype;

    var _proto = TabMyWorkPlaceItemView.prototype;

    _proto.init = function() {
        var _self = this;
        _self._tabInfo.type = TabItemView.TYPE_MY_WORK_PLACE;
        var _jid = LoginUser.getInstance().getJid();
        var _host = location.hostname;
        var _columnListId = 'columnList' + '_' + _host + '_' + _jid;
        _self._tabInfo.columnListId = _columnListId;
        var _columnRecentInfo = new RecentColumnInfomation();
        var _filter = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_RECENT, null);
        if(_filter == null) { return false; }
        var _searchCondition = new ColumnSearchCondition(_filter, new ColumnSortCondition());
        _columnRecentInfo.setSearchCondition(_searchCondition);
        _self._defaultColumnInfoList.add(_columnRecentInfo);
        var _myWorkPlaceSideListViewImpl = new MyWorkPlaceSideListViewImpl();
        _self._sideListViewImpl = _myWorkPlaceSideListViewImpl;
        return _self;
    };

    _proto.isContainMinimumColumn = function(columnInfoList) {
        var _self = this;
        var _ret = false;
        if(columnInfoList == null) {
            return _ret;
        }
        var _count = columnInfoList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            var _columnInfo = columnInfoList.get(_i);
            if(_columnInfo == null) {
                continue;
            }
            if(_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_RECENT) {
                _ret = true;
                break;
            }
        }
        return _ret;
    };

    _proto.setTabInfo = function(tabInfo) {
    };

    _proto.getDom = function() {
        var _self = this;
        var _title = Resource.getMessage('MyWorkplace');
        var _dom = _super.getDom.call(_self);
        _dom.find('span').text(_title);
        _dom.find('span').attr('title',_title);
        _dom.addClass('non-close');
        return $(_dom);
    };


})();
