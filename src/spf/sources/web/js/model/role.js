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

function Role() {
    this._id = null;
    this._translations = null;
};(function() {

    var _proto = Role.prototype;
    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if(id == null || typeof id != 'string') {
            return;
        }
        this._id = id;
    };
    _proto.getTranslations = function() {
        return this._translations;
    };
    _proto.setTranslations = function(translations) {
        if(translations == null || typeof translations != 'object') {
            return;
        }
        var _temp = new Translations();
        _temp.setTranslations(translations);
        if(_temp.getCount() == 0) {
            return;
        }
        this._translations = _temp;
    };
    _proto.cleanUp = function() {
        var _self = this;
        _self._id = null;
        _self._translations = null;
    };
})();