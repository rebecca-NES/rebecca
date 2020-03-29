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

function IconAreaView() {
    this._iconAreaContener = $('ul#menuIcons');
    this._iconViewList = new ArrayList();
};(function() {
    $(function() {
        $('#menuIcons').sortable({
            items: '.sortable-item',
            axis: 'x',
            tolerance: "pointer",
            scrollSensitivity: 5
        });
        $('#menuIcons').disableSelection();
    });
})();

function ColumnIconArea() {
    IconAreaView.call(this);
    this._movingIconIndex = -1;
};(function() {

    ColumnIconArea.COLUM_ICON_SPARATOR_ELEMENT = $('ul#menuIcons').children('li.menu-separator');
    ColumnIconArea.prototype = $.extend({}, IconAreaView.prototype);
    var _super = IconAreaView.prototype;
    var _proto = ColumnIconArea.prototype;
    var _columnIconArea = new ColumnIconArea();
    ColumnIconArea.getInstance = function() {
        return _columnIconArea;
    };
    _proto.getColumnIconViewList = function() {
        return this._iconViewList;
    };
    _proto.addIcon = function(columnInformation) {
        var _self = this;
        if(!columnInformation || typeof columnInformation != 'object') {
            return false;
        }
        var _columIconView = new ColumnIconView();
        var _ret = _columIconView.initColumnIconView(columnInformation);
        _self._iconViewList.add(_columIconView);
        return _ret;
    };
    _proto.insertIcon = function(index, columnInformation) {
        var _self = this;
        if(index == null || typeof index != 'number') {
            return false;
        }
        if(!columnInformation || typeof columnInformation != 'object') {
            return false;
        }
        var _columIconView = new ColumnIconView();
        var _ret = _columIconView.initColumnIconView(columnInformation, index);
        _self._iconViewList.insert(index, _columIconView);
        return _ret;
    };
    _proto.removeIcon = function(index) {
        if(index == null || typeof index != 'number') {
            return false;
        }
        this._iconAreaContener.children().eq(index).find('*').off();
        this._iconAreaContener.children().eq(index).off();
        this._iconAreaContener.children().eq(index).find('*').remove();
        this._iconAreaContener.children().eq(index).remove();
        this.removeIconObj(index);
        LayoutManager.resetScreenLayout();
        return true;
    };
    _proto.removeIconObj = function(index) {
        if(index == null || typeof index != 'number') {
            return false;
        }
        var _iconView = this._iconViewList.get(index);
        _iconView.cleanup();
        this._iconViewList.remove(index);
        return true;
    };
    _proto.startSortIcon = function(index) {
        if(index == null || typeof index != 'number') {
            return false;
        }
        this._movingIconIndex = index;
    };
    _proto.updateSortIcon = function(newIndex) {
        if(newIndex == null || typeof newIndex != 'number') {
            return false;
        }
        var _originalIndex = this._movingIconIndex;
        _ret = ColumnManager.getInstance().sortColumn(_originalIndex, newIndex)
        if (_ret) {
            this._iconViewList.move(_originalIndex, newIndex);
        } else {
            var _htmlElement = this._iconAreaContener.children().eq(newIndex);
            var _targetIndex = -1;
            if (originalIndex > newIndex) {
                _targetIndex = originalIndex;
            } else {
                _targetIndex = originalIndex - 1;
            }

            var _beforIndexElement = this._iconAreaContener.children().eq(_targetIndex);
            _htmlElement.detach();
            if (_targetIndex == 0) {
                _targetElm.before(_htmlElement);
            } else {
                _targetElm.after(_htmlElement);
            }
        }
        this._movingIconIndex = -1;
        return _ret;
    };
    _proto.receiveMessage = function(columIconIndex) {
        if(columIconIndex == null || typeof columIconIndex != 'number') {
            return false;
        }
        var _ret = false;
        var _columnIconViewObj = this._iconViewList.get(columIconIndex);
        if(_columnIconViewObj != null) {
            LayoutManager.iconAreaScrollToShow(columIconIndex);
            _ret = true;
        }
        return _ret;
    };
    _proto.removeColumnNotificationIcon = function(columIconIndex) {
        if(columIconIndex == null || typeof columIconIndex != 'number') {
            return false;
        }
        var _ret = false;
        var _columnIconViewObj = this._iconViewList.get(columIconIndex);
        if(_columnIconViewObj != null) {
            _columnIconViewObj.removeColumnNotificationIcon();
            _ret = true;
        }
        return _ret;
    };

    _proto.removeColumnNotificationIconByColumnInformation = function(columnInformation) {
        var _self = this;
        var _ret = false;
        var _count = _self._iconViewList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _columnIconViewObj = _self._iconViewList.get(_i);
            if(_columnIconViewObj != null) {
                if (_columnIconViewObj.isMatchColumnInfo(columnInformation)) {
                    _columnIconViewObj.removeColumnNotificationIcon();
                    _ret = true;
                    break;
                }
            }
        }
        return _ret;
    };
    _proto.updateIconTitle = function(index) {
        var _self = this;
        if(index == null || typeof index != 'number') {
            return false;
        }
        var _columnIconViewObj = _self._iconViewList.get(index);
        if(_columnIconViewObj != null) {
            _columnIconViewObj.updateTitle();
        }
    };
    _proto.updateColumnIcon = function(index) {
        var _self = this;
        if(index == null || typeof index != 'number') {
            return false;
        }
        var _columnIconViewObj = _self._iconViewList.get(index);
        if(_columnIconViewObj != null) {
            _columnIconViewObj.updateColumnIcon();
        }
    };
    _proto.updateDisplay = function(columnInfo) {
        var _self = this;
        if(columnInfo == null || typeof columnInfo != 'object') {
            return false;
        }
        var _count = _self._iconViewList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _columnIconViewObj = _self._iconViewList.get(_i);
            if(_columnIconViewObj != null) {
                if (_columnIconViewObj.isMatchColumnInfo(columnInfo)) {
                    _columnIconViewObj.onUpdateDisplay(columnInfo);
                    break;
                }
            }
        }
    };

    _proto.onNewlyArrived = function(columnInfo) {
        var _self = this;
        if(columnInfo == null || typeof columnInfo != 'object') {
            return false;
        }
        var _count = _self._iconViewList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _columnIconViewObj = _self._iconViewList.get(_i);
            if(_columnIconViewObj != null) {
                if (_columnIconViewObj.isMatchColumnInfo(columnInfo)) {
                    _columnIconViewObj.onNewlyArrived();
                    break;
                }
            }
        }
    };

    _proto.cleanup = function() {
        var _self = this;
        _self._iconAreaContener.children('.sortable-item').remove();
        _self._iconViewList.removeAll();
    };

    _proto.getIconColumnInfo = function(columIconIndex) {
        var _self = this;
        if(columIconIndex == null || typeof columIconIndex != 'number') {
            return null;
        }
        var _columnIconViewObj = _self._iconViewList.get(columIconIndex);
        if(_columnIconViewObj == null) {
            return null;
        }
        return _columnIconViewObj.getColumnInfo();
    };
})();

function IconAreaIconView() {
};(function() {
})();
