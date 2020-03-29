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
(function() {
    var Utils = require('../utils')

    function RegisteredContactData() {
        var _self = this;
        _self._type = RegisteredContactData.TYPE_NONE;
    };

    RegisteredContactData.TYPE_NONE = 'none';
    RegisteredContactData.TYPE_ALL = 'all';
    RegisteredContactData.TYPE_CUSTOM = 'custom';

    var _proto = RegisteredContactData.prototype;

        RegisteredContactData.create = function() {
        return new RegisteredContactData();
    };

    _proto.getType = function() {
        return this._type;
    };
    _proto.setType = function(type) {
        if(type == null || typeof type != 'string') {
            return;
        }
        this._type = type;
    };
    _proto.cleanUp = function() {
        var _self = this;
        _self._type = RegisteredContactData.TYPE_NONE;
    };

    exports.create = RegisteredContactData.create;
    exports.TYPE_NONE = RegisteredContactData.TYPE_NONE;
    exports.TYPE_ALL = RegisteredContactData.TYPE_ALL;
    exports.TYPE_CUSTOM = RegisteredContactData.TYPE_CUSTOM;
})();
