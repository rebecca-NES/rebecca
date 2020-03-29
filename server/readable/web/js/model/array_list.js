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
function ArrayList() {
    this._array = new Array();
    this._length = 0;
};(function() {
    var _proto = ArrayList.prototype;
    _proto.add = function(obj) {
        var _self = this;
        var _count = _self._length;
        _self._array[_count] = obj;
        _self._length++;
        return true;
    };
    _proto.remove = function(index) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return null;
        }
        if (index < 0 || index >= _self._length) {
            return null;
        }
        var _retObj = _self._array[index];
        var _count = _self._length;
        for (var _i = index; _i < _count - 1; _i++) {
            _self._array[_i] = _self._array[_i + 1];
        }
        delete _self._array[_count - 1];
        _self._length--;
        return _retObj;
    };
    _proto.insert = function(index, obj) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return false;
        }
        if (index < 0 || index > _self._length) {
            return false;
        }
        var _count = _self._length;
        for (var _i = _count; _i > index; _i--) {
            _self._array[_i] = _self._array[_i - 1];
        }
        _self._array[index] = obj;
        _self._length++;
        return true;
    };
    _proto.get = function(index) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return null;
        }
        if (index < 0 || index >= _self._length) {
            return null;
        }
        var _retObj = _self._array[index];
        return _retObj;
    };
    _proto.move = function(fromIndex, toIndex) {
        var _self = this;
        if (fromIndex == null || typeof fromIndex != 'number') {
            return false;
        }
        if (fromIndex < 0 || fromIndex >= _self._length) {
            return false;
        }
        if (toIndex == null || typeof toIndex != 'number') {
            return false;
        }
        if (toIndex < 0 || toIndex >= _self._length) {
            return false;
        }
        if (fromIndex == toIndex) {
            return true;
        }
        var _targetObj = _self._array[fromIndex];
        if (fromIndex < toIndex) {
            for (var _i = fromIndex; _i < toIndex; _i++) {
                _self._array[_i] = _self._array[_i + 1];
            }
        } else {
            for (var _i = fromIndex; _i > toIndex; _i--) {
                _self._array[_i] = _self._array[_i - 1];
            }
        }
        _self._array[toIndex] = _targetObj;
        return true;
    };
    _proto.set = function(index, obj) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return false;
        }
        if (index < 0 || index >= _self._length) {
            return false;
        }
        delete _self._array[index];
        _self._array[index] = obj;
        return true;
    };
    _proto.getCount = function() {
        return this._length;
    };
    _proto.removeAll = function() {
        var _self = this;
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            delete _self._array[_i];
        }
        delete _self._array;
        _self._array = new Array();
        _self._length = 0;
    };
    _proto.copy = function(arrayList) {
        var _self = this;
        if (arrayList == null || typeof arrayList != 'number') {
            return;
        }
        var _count = arrayList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            _self.add(arrayList.get(_i));
        }
    };
})();
function StringMapedArrayList() {
    ArrayList.call(this);
    this._map = {};
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    StringMapedArrayList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = StringMapedArrayList.prototype;
    _proto.add = function(key, object) {
        var _self = this;
        if (key == null || typeof key != 'string' || key == '') {
            return false;
        }
        if (object == null || typeof object != 'object') {
            return false;
        }

        var _existObj = _self.getByKey(key);
        if (_existObj != null) {
            return false;
        }

        var _ret = _super.add.call(_self, object);
        if (_ret) {
            _self._map[key] = object;
        }
        return _ret;
    };
    _proto.insert = function(index, key, object) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return false;
        }
        if (index < 0 || index > _self._length) {
            return false;
        }
        if (key == null || typeof key != 'string' || key == '') {
            return false;
        }
        var _existObj = _self.getByKey(key);
        if (_existObj != null) {
            return false;
        }
        var _ret = _super.insert.call(_self, index, object);
        if (_ret) {
            _self._map[key] = object;
        }
        return _ret;
    };
    _proto.getByKey = function(key) {
        var _self = this;
        if (key == null || typeof key != 'string' || key == '') {
            return null;
        }
        if (_self._map[key] == null) {
            return null;
        }
        return _self._map[key];
    };
    _proto.remove = function(index) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return null;
        }
        if (index < 0 || index >= _self._length) {
            return null;
        }
        var _retObj = _super.remove.call(_self, index);
        for (var _key in _self._map) {
            if (_self._map[_key] == _retObj) {
                delete _self._map[_key];
            }
        }
        return _retObj;
    };
    _proto.removeByKey = function(key) {
        var _self = this;
        if (key == null || typeof key != 'string') {
            return null;
        }
        var _retObj = _self.getByKey(key);
        if (_retObj == null) {
            return null;
        }
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i] == _retObj) {
                _retObj = _super.remove.call(_self, _i);
                break;
            }
        }
        delete _self._map[key];
        return _retObj;
    };
    _proto.removeAll = function() {
        var _self = this;
        _super.removeAll.call(_self);
        for (var _key in _self._map) {
            delete _self._map[_key];
        }
        delete _self._map;
        _self._map = {};
    };
    _proto.set = function(index, obj) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return false;
        }
        if (index < 0 || index >= _self._length) {
            return false;
        }
        for (var _key in _self._map) {
            if (_self._map[_key] == _self._array[index]) {
                delete _self._map[_key];
                _self._map[_key] == obj;
            }
        }
        _super.set.call(_self, index, obj);
        return true;
    };
    _proto.setByKey = function(key, obj) {
        var _self = this;
        if (key == null || typeof key != 'string') {
            return false;
        }
        var _retObj = _self.getByKey(key);
        if (_retObj == null) {
            return false;
        }
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i] == _retObj) {
                _super.set.call(_self, _i, obj);
                break;
            }
        }
        delete _self._map[key];
        _self._map[key] = obj;
        return true;
    };
})();

function StringMapedStringArrayList() {
    ArrayList.call(this);
    this._map = {};
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    StringMapedStringArrayList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = StringMapedStringArrayList.prototype;
    _proto.add = function(key, str) {
        var _self = this;
        if (key == null || typeof key != 'string' || key == '') {
            return false;
        }
        if (str == null || typeof str != 'string') {
            return false;
        }

        var _existStr = _self.getByKey(key);
        if (_existStr != null) {
            return false;
        }

        var _ret = _super.add.call(_self, str);
        if (_ret) {
            _self._map[key] = str;
        }
        return _ret;
    };
    _proto.insert = function(index, key, str) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return false;
        }
        if (index < 0 || index > _self._length) {
            return false;
        }
        if (key == null || typeof key != 'string' || key == '') {
            return false;
        }
        var _existStr = _self.getByKey(key);
        if (_existStr != null) {
            return false;
        }
        var _ret = _super.insert.call(_self, index, str);
        if (_ret) {
            _self._map[key] = str;
        }
        return _ret;
    };
    _proto.getByKey = function(key) {
        var _self = this;
        if (key == null || typeof key != 'string' || key == '') {
            return null;
        }
        if (_self._map[key] == null) {
            return null;
        }
        return _self._map[key];
    };
    _proto.remove = function(index) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return null;
        }
        if (index < 0 || index >= _self._length) {
            return null;
        }
        var _retStr = _super.remove.call(_self, index);
        for (var _key in _self._map) {
            if (_self._map[_key] == _retStr) {
                delete _self._map[_key];
            }
        }
        return _retStr;
    };
    _proto.removeByKey = function(key) {
        var _self = this;
        if (key == null || typeof key != 'string') {
            return null;
        }
        var _retStr = _self.getByKey(key);
        if (_retStr == null) {
            return null;
        }
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i] == _retStr) {
                _retStr = _super.remove.call(_self, _i);
                break;
            }
        }
        delete _self._map[key];
        return _retStr;
    };
    _proto.removeAll = function() {
        var _self = this;
        _super.removeAll.call(_self);
        for (var _key in _self._map) {
            delete _self._map[_key];
        }
        delete _self._map;
        _self._map = {};
    };
    _proto.set = function(index, str) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return false;
        }
        if (index < 0 || index >= _self._length) {
            return false;
        }
        for (var _key in _self._map) {
            if (_self._map[_key] == _self._array[index]) {
                delete _self._map[_key];
                _self._map[_key] == str;
            }
        }
        _super.set.call(_self, index, str);
        return true;
    };
    _proto.setByKey = function(key, str) {
        var _self = this;
        if (key == null || typeof key != 'string') {
            return false;
        }
        var _retStr = _self.getByKey(key);
        if (_retStr == null) {
            return false;
        }
        var _count = _self._length;
        for (var _i = 0; _i < _count; _i++) {
            if (_self._array[_i] == str) {
                _super.set.call(_self, _i, str);
                break;
            }
        }
        delete _self._map[key];
        _self._map[key] = str;
        return true;
    };
})();

function PersonList() {
    StringMapedArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = StringMapedArrayList.prototype;
    PersonList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = PersonList.prototype;
    _proto.add = function(person) {
        var _self = this;
        if (person == null || typeof person != 'object') {
            return false;
        }
        if (person.getJid == null) {
            return false;
        }
        var _jid = person.getJid();
        if (_jid == null || _jid == '') {
            return false;
        }
        var _existPerson = _self.getByJid(_jid);
        if (_existPerson != null) {
            return false;
        }
        return _super.add.call(this, _jid, person);
    };
    _proto.insert = function(index, person) {
        var _self = this;
        if (index == null || typeof index != 'number') {
            return false;
        }
        if (index < 0 || index > _self._length) {
            return false;
        }
        if (person == null || typeof person != 'object') {
            return false;
        }
        var _jid = person.getJid();
        if (_jid == null || _jid == '') {
            return false;
        }
        return _super.insert.call(this, index, _jid, person);
    };
    _proto.getByJid = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        return _super.getByKey.call(this, jid);
    };
    _proto.getByLoginAccount = function(loginAccount) {
        var _self = this;
        if (loginAccount == null || typeof loginAccount != 'string') {
            return null;
        }
        var _count = _self._length;
        var _ret = null;
        for (var _i = 0; _i < _count; _i++) {
            var _personData = _self._array[_i];
            if(_personData.getLoginAccount() == loginAccount){
                _ret = _personData;
                break;
            }
        }
        return _ret;
    };
    _proto.removeByJid = function(jid) {
        var _self = this;
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        return _super.removeByKey.call(this, jid);
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();
function ContactList() {
    PersonList.call(this);
    this._sortedData = null;
};(function() {

    var Super = function Super() {
    };
    Super.prototype = PersonList.prototype;
    ContactList.prototype = new Super();
    var _super = Super.prototype;

    var _contactList = new ContactList();
    ContactList.getInstance = function() {
        return _contactList;
    };
    var _proto = ContactList.prototype;
    _proto.removeAll = function() {
        _super.removeAll.call(this);
        this._sortedData = null;
    };

    _proto.getSortedData = function() {
        return this._sortedData;
    };
    _proto.setSortedData = function(sortedData) {
        this._sortedData = sortedData;
    };
})();
function FollowFollowerList() {
    PersonList.call(this);
    this._memberCount = 0;
    this._gotten = false;
};(function() {

    var Super = function Super() {
    };
    Super.prototype = PersonList.prototype;
    FollowFollowerList.prototype = new Super();
    var _super = Super.prototype;

    var _proto = FollowFollowerList.prototype;
    _proto.getMemberCount = function() {
        return this._memberCount;
    };
    _proto.setMemberCount = function(memberCount) {
        if (memberCount == null || typeof memberCount != 'number') {
            return;
        }
        this._memberCount = memberCount;
    };
    _proto.add = function(person) {
        var _self = this;
        if (person == null || typeof person != 'object') {
            return false;
        }
        var _ret = _super.add.call(this, person);
        if (_ret == true) {
            this._gotten = true;
        }
        return _ret;
    };
    _proto.isDataGotten = function() {
        return this._gotten;
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
        this._memberCount = 0;
        this._gotten = false;
    };
})();
function FollowList() {
    FollowFollowerList.call(this);
};(function() {

    var Super = function Super() {
    };
    Super.prototype = FollowFollowerList.prototype;
    FollowList.prototype = new Super();
    var _super = Super.prototype;

    var _followList = new FollowList();
    FollowList.getInstance = function() {
        return _followList;
    };
    var _proto = FollowList.prototype;
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();
function FollowerList() {
    FollowFollowerList.call(this);
};(function() {

    var Super = function Super() {
    };
    Super.prototype = FollowFollowerList.prototype;
    FollowerList.prototype = new Super();
    var _super = Super.prototype;

    var _followerList = new FollowerList();
    FollowerList.getInstance = function() {
        return _followerList;
    };
    var _proto = FollowerList.prototype;
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();

function NoConnectionPersonList() {
    PersonList.call(this);
};(function() {

    var Super = function Super() {
    };
    Super.prototype = PersonList.prototype;
    NoConnectionPersonList.prototype = new Super();
    var _super = Super.prototype;

    var _noConnectionPersonList = new NoConnectionPersonList();
    NoConnectionPersonList.getInstance = function() {
        return _noConnectionPersonList;
    };
    var _proto = NoConnectionPersonList.prototype;
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();
function ReminderList() {
    ArrayList.call(this);
};(function() {

    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    ReminderList.prototype = new Super();
    var _super = Super.prototype;

    var _proto = ReminderList.prototype;

})();
function SearchResultPersonList() {
    this._allItemCount = 0;
    PersonList.call(this);
};(function() {
    var Super = function Super() {};
    Super.prototype = PersonList.prototype;
    SearchResultPersonList.prototype = new Super();
    var _super = Super.prototype;

    var _proto = SearchResultPersonList.prototype;
    _proto.getAllItemCount = function() {
        return this._allItemCount;
    };
    _proto.setAllItemCount = function(allItemCount) {
        if(allItemCount == null || typeof allItemCount != 'number') {
            return;
        }
        this._allItemCount = allItemCount;
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();
