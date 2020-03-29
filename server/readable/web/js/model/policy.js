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
function Policy() {
    this._id = null;
    this._action = null;
    this._resource_id = null;
    this._room_type = null;
    this._translations = null;
};(function() {

    var _proto = Policy.prototype;
    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if(id == null || typeof id != 'string') {
            return;
        }
        this._id = id;
        this._action = Utils.getActionInPolicyId(this._id);
        this._resource_id = Utils.getResourceIdInPolicyId(this._id);
        this._room_type = Utils.getRoomTypeInPolicyId(this._id);
    };
    _proto.getAction = function() {
        return this._action;
    };
    _proto.getResourceId = function() {
        return this._resource_id;
    };
    _proto.getRoomType = function() {
        return this._room_type;
    };
    _proto.getTranslations = function() {
        return this._translations;
    };
    _proto.setTranslations = function(translations) {
        if(translations == null || typeof translations != 'object') {
            return;
        }
        this._translations = new Translations();
        this._translations.setTranslations(translations);
    };
})();
