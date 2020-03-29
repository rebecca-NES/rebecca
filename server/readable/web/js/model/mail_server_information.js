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
function MailServerInformation() {
    this._id = -1;
    this._displayName = '';
    this._serverType = -1;
    this._createdAt = null;
    this._createdBy = '';
    this._updatedAt = null;
    this._updatedBy = '';
    this._popHost = '';
    this._popPort = 0;
    this._popAuthMode = 0;
    this._popResponseTimeout = 0;
};(function() {
    var _proto = MailServerInformation.prototype;

    _proto.getId = function() {
        return this._id;
    };
    _proto.setId = function(id) {
        if (id == null || typeof id != 'number') {
            return;
        }
        this._id = id;
    };
    _proto.getDisplayName = function() {
        return this._displayName;
    };
    _proto.setDisplayName = function(displayName) {
        if(displayName == null || typeof displayName != 'string') {
            return;
        }
        this._displayName = displayName;
    };
    _proto.getServerType = function() {
        return this._serverType;
    };
    _proto.setServerType = function(serverType) {
        if (serverType == null || typeof serverType != 'number') {
            return;
        }
        this._serverType = serverType;
    };
    _proto.getCreatedBy = function() {
        return this._createdBy;
    };
    _proto.setCreatedBy = function(createdBy) {
        if(createdBy == null || typeof createdBy != 'string') {
            return;
        }
        this._createdBy = createdBy;
    };
    _proto.getCreatedAt = function() {
        return this._createdAt;
    };
    _proto.setCreatedAt = function(createdAt) {
        if (createdAt == null || typeof createdAt != 'object') {
            return;
        }
        this._createdAt = createdAt;
    };
    _proto.getUpdatedBy = function() {
        return this._updatedBy;
    };
    _proto.setUpdatedBy = function(updatedBy) {
        if(updatedBy == null || typeof updatedBy != 'string') {
            return;
        }
        this._updatedBy = updatedBy;
    };
    _proto.getUpdatedAt = function() {
        return this._updatedAt;
    };
    _proto.setUpdatedAt = function(updatedAt) {
        if (updatedAt == null || typeof updatedAt != 'object') {
            return;
        }
        this._updatedAt = updatedAt;
    };
    _proto.getPopHost = function() {
        return this._popHost;
    };
    _proto.setPopHost = function(popHost) {
        if(popHost == null || typeof popHost != 'string') {
            return;
        }
        this._popHost = popHost;
    };
    _proto.getPopPort = function() {
        return this._popPort;
    };
    _proto.setPopPort = function(popPort) {
        if (popPort == null || typeof popPort != 'number') {
            return;
        }
        this._popPort = popPort;
    };
    _proto.getPopAuthMode = function() {
        return this._popAuthMode;
    };
    _proto.setPopAuthMode = function(popAuthMode) {
        if (popAuthMode == null || typeof popAuthMode != 'number') {
            return;
        }
        this._popAuthMode = popAuthMode;
    };
    _proto.getPopResponseTimeout = function() {
        return this._popResponseTimeout;
    };
    _proto.setPopResponseTimeout = function(popResponseTimeout) {
        if (popResponseTimeout == null || typeof popResponseTimeout != 'number') {
            return;
        }
        this._popResponseTimeout = popResponseTimeout;
    };
})();

function MailServerInfoList() {
    ArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    MailServerInfoList.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MailServerInfoList.prototype;
})();
