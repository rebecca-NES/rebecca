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
    function AccessRelationData() {
        this.REDIS_DATA_TYPE = 'string';
        this.REDIS_KEY_NAME = null;
        this._hostName = null;
    }

    AccessRelationData.createDish = function(hostName) {
        if (!hostName || typeof hostName != 'string') {
            return null;
        }
        var _accessRelationData = new AccessRelationData();

        _accessRelationData.setHostName(hostName);

        return _accessRelationData;
    }

    var _proto = AccessRelationData.prototype;

    _proto.setKeyName = function(keyName) {
        this.REDIS_KEY_NAME = keyName;
    };
    _proto.getKeyName = function() {
        return this.REDIS_KEY_NAME;
    }
    _proto.setHostName = function(hostName) {
        this._hostName = hostName;
    };
    _proto.getHostName = function() {
        return this._hostName;
    }

    _proto.getData = function() {
        return this._hostName;
    }

    exports.createDish = AccessRelationData.createDish;
    exports.REDIS_DATA_TYPE = AccessRelationData.REDIS_DATA_TYPE;
    exports.REDIS_KEY_NAME = AccessRelationData.REDIS_KEY_NAME;
})();