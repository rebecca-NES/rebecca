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

function IconInfomation() {
    this._iconType = IconInfomation.TYPE_COLUMN_UNKNOWN;
    this._iconImage = '';
    this._filterCondition = '';
    this._title = '';
};(function() {
    IconInfomation.TYPE_COLUMN_UNKNOWN = 0;
    IconInfomation.TYPE_COLUMN_TIMELINE = 1;
    IconInfomation.TYPE_COLUMN_MENTION = 2;
    IconInfomation.TYPE_COLUMN_CHAT = 3;
    IconInfomation.TYPE_COLUMN_TASK = 4;
    var _proto = IconInfomation.prototype;
    _proto.getIconType = function() {
        return this._iconType;
    };
    _proto.setIconType = function(iconType) {
        if(iconType == null || typeof iconType != 'number') {
            return;
        }
        this._iconType = iconType;
    };
    _proto.getIconImage = function() {
        return this._iconImage;
    };
    _proto.setIconImage = function(iconImage) {
        if(iconImage == null || typeof iconImage != 'string') {
            return;
        }
        this._iconImage = iconImage;
    };
    _proto.getFilterCondition = function() {
        return this._filterCondition;
    };
    _proto.setFilterCondition = function(filterCondition) {
        if(filterCondition == null || typeof filterCondition != 'string') {
            return;
        }
        this._filterCondition = filterCondition;
    };
    _proto.getTitle = function() {
        return this._title;
    };
    _proto.setTitle = function(title) {
        if(title == null || typeof title != 'string') {
            return;
        }
        this._title = title;
    };
})();
function IconList() {
    ArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    IconList.prototype = new Super();
    var _super = Super.prototype;
    var _iconList = new IconList();
    IconList.getInstance = function() {
        return _iconList;
    };
    var _proto = IconList.prototype;
    _proto.add = function(iconInfomation) {
        var _self = this;
        if(iconInfomation == null || typeof iconInfomation != 'object') {
            return false;
        }
        return _super.add.call(this, iconInfomation);
    };
    _proto.insert = function(index, iconInfomation) {
        var _self = this;
        if(index == null || typeof index != 'number') {
            return false;
        }
        if(index < 0 || index > _self._length) {
            return false;
        }
        if(iconInfomation == null || typeof iconInfomation != 'object') {
            return false;
        }
        return _super.insert.call(this, index, iconInfomation);
    };
    _proto.get = function(index) {
        var _self = this;
        if(index == null || typeof index != 'number') {
            return null;
        }
        if(index < 0 || index >= _self._length) {
            return null;
        }
        return _super.get.call(this, index);
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();
