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

function NotificationSettingManager() {
    this._notificationInfo = [];
};(function() {

    var _proto = NotificationSettingManager.prototype;

    var _notificationSettingManager = new NotificationSettingManager();

    NotificationSettingManager.getInstance = function() {
        return _notificationSettingManager;
    };

    _proto.getNotificationInfo = function () {
        var _self = this;
        return _self._notificationInfo;
    };

    _proto.setNotificationInfo = function (notificationInfo) {
        var _self = this;
        var _notificationInfo = [];
        if (notificationInfo) {
            _notificationInfo = notificationInfo;
        }
        _self._notificationInfo = _notificationInfo;
    };

    _proto.appendSetting = function (type, id, callback) {
        var _self = this;
        var _notificationInfo = [];
        var _ret = false;
        if (type) {
            _notificationInfo = _self.getNotificationInfo();
            if (!_self.isSetting(type, id)) {
                var _obj = {};
                _obj.type = type;
                if (id) {
                    _obj.id = id;
                }
                _notificationInfo.push(_obj);
                _ret = true;
            }
        }
        if (_ret) {
            _write(_self, _notificationInfo);

            if (callback &&  typeof callback == 'function') {
                setTimeout(function() {
                    callback();
                }, 1);
            }
        }
    };

    _proto.removeSetting = function (type, id, callback) {
        var _self = this;
        var _notificationInfo = [];
        var _ret = false;
        if (type) {
            _notificationInfo = _self.getNotificationInfo();
            var _index = _self.indexOfSetting(type, id);
            if (_index != (-1)) {
                _notificationInfo.splice(_index, 1);
                _ret = true;
            }
        }
        if (_ret) {
            _write(_self, _notificationInfo);

            if (callback &&  typeof callback == 'function') {
                setTimeout(function() {
                    callback();
                }, 1);
            }
        }
    };

    _proto.indexOfSetting = function (type, id) {
        var _self = this;
        var _notificationInfo = [];
        if (type) {
            _notificationInfo = _self.getNotificationInfo();
            for (var _i = 0; _i < _notificationInfo.length; _i++) {
                if (type == _notificationInfo[_i].type) {
                    if (!id || (id == _notificationInfo[_i].id)) {
                        return _i;
                    }
                    continue;
                }
            }
        }
        return (-1);
    };

    _proto.isSetting = function (type, id) {
        var _self = this;
        return (_self.indexOfSetting(type, id) != (-1));
    };


    NotificationSettingManager.PARAM_NOTIFICATIONICON_SETTING = null;

    _proto.read = function () {
        var _self = this;
        if (!_isKey()) {
            return;
        }
        var _notificationInfo = [];
        var _stringNotificationInfo = localStorage.getItem(NotificationSettingManager.PARAM_NOTIFICATIONICON_SETTING);
        if (_stringNotificationInfo) {
            _notificationInfo = JSON.parse(_stringNotificationInfo);
            if (!_notificationInfo || _notificationInfo.length < 1) {
                _notificationInfo = [];
            }
            else{
                _convertWatchFeedToToMe(_self, _notificationInfo);
            }
        }
        _self.setNotificationInfo(_notificationInfo);
    };

    function _convertWatchFeedToToMe(self, notificationInfo) {
        for (var _i = 0; _i < notificationInfo.length; _i++) {
            if(notificationInfo[_i].type == ColumnInformation.TYPE_COLUMN_MENTION){
                notificationInfo[_i].type = ColumnInformation.TYPE_COLUMN_TOME;
                _write(self, notificationInfo);
                break;
            }
        }
    }

    function _write(self, notificationInfo) {
        if (!_isKey()) {
            return;
        }
        var _notificationInfo = [];
        var _ret = false;
        if (notificationInfo && notificationInfo.length > 0) {
            for (var _i = 0; _i < notificationInfo.length; _i++) {
                var _obj = {};
                // Variable _key is used like a local variable, but is missing a declaration.
                var _key;
                for (_key in notificationInfo[_i]) {
                    var _value = notificationInfo[_i][_key];
                    if (!_value) {
                        continue;
                    }
                    _obj[_key] = _value;
                }
                if (Object.keys(_obj).length > 0) {
                    _notificationInfo.push(_obj);
                }
            }
            if (_notificationInfo.length > 0) {
                var _stringNotificationInfo = JSON.stringify(_notificationInfo);
                if (_stringNotificationInfo) {
                    localStorage.setItem(NotificationSettingManager.PARAM_NOTIFICATIONICON_SETTING, _stringNotificationInfo);
                    _ret = true;
                }
            }
        }
        if (!_ret) {
            _removeAllSetting(self);
        }
    };

    function _removeAllSetting(self) {
        localStorage.removeItem(NotificationSettingManager.PARAM_NOTIFICATIONICON_SETTING);
        self.setNotificationInfo([]);
    };

    function _isKey() {
        if (NotificationSettingManager.PARAM_NOTIFICATIONICON_SETTING == null) {
            var _jid = LoginUser.getInstance().getJid();
            if (!_jid) {
                return false;
            }
            NotificationSettingManager.PARAM_NOTIFICATIONICON_SETTING = "notificationicon_setting_" + _jid;
        }
        return true;
    }
})();
