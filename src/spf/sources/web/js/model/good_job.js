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

function GoodJobList() {
    ArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    GoodJobList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GoodJobList.prototype;
    _proto.add = function(goodJobData) {
        var _self = this;
        if(goodJobData == null || typeof goodJobData != 'object') {
            return false;
        }
        if(goodJobData.getJid == null) {
            return false;
        }
        var _jid = goodJobData.getJid();
        if(_jid == null || _jid == '') {
            return false;
        }
        var _existGoodJobData = _self.getByJid(_jid);
        if(_existGoodJobData != null) {
            return false;
        }
        return _super.add.call(this, goodJobData);
    };
    _proto.getByJid = function(jid) {
        var _self = this;
        if(jid == null || typeof jid != 'string') {
            return null;
        }
        var _retGoodJobData = null;
        var _count = _self._length;
        for(var _i = 0; _i < _count; _i++) {
            if(_self._array[_i].getJid() == jid) {
                _retGoodJobData = _self._array[_i];
                break;
            }
        }
        return _retGoodJobData;
    };
    _proto.removeByJid = function(jid) {
        var _self = this;
        if(jid == null || typeof jid != 'string') {
            return null;
        }
        var _retGoodJobData = null;
        var _count = _self._length;
        for(var _i = 0; _i < _count; _i++) {
            if(_self._array[_i].getJid() == jid) {
                _retGoodJobData = _super.remove.call(this, _i);
                break;
            }
        }
        return _retGoodJobData;
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();

function GoodJobData() {
    Profile.call(this);
    this._jid = '';
    this._date = null;
};(function() {
    GoodJobData.prototype = $.extend({}, Profile.prototype);
    var _proto = GoodJobData.prototype;

    _proto.getJid = function() {
        return this._jid;
    };
    _proto.setJid = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return;
        }
        if(jid == '') {
            return;
        }
        this._jid = jid;
    };
    _proto.getDate = function() {
        return this._date;
    };
    _proto.setDate = function(date) {
        if(date == null || typeof date != 'object') {
            return;
        }
        this._date = date;
    };
})();
