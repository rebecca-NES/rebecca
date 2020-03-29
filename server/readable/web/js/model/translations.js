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
function Translations() {
    this._translations = {};
};(function() {
    Translations.LANG_JA = 'ja';

    var _proto = Translations.prototype;
    _proto.getTranslations = function() {
        return this._translations;
    };
    _proto.setTranslations = function(translations) {
        if(translations == null || typeof translations != 'object') {
            return;
        }
        var _temp = [];
        Object.keys(translations).forEach(function(key) {
            switch(key) {
            case Translations.LANG_JA:
                _temp.push( { key: translations[key] });
                break;
            default:
                break;
            }
        });
        if(_temp.length == 0) {
            return;
        }
        this._translations = _temp;
    };
    _proto.getCount = function() {
        return this._translations.length;
    }
    _proto.cleanUp = function() {
        var _self = this;
        _self._translations = null;
    };
})();