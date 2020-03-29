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

function PushNotificationSettingManager() {
    this._notificationInfo = [];
};(function() {

    var _proto = PushNotificationSettingManager.prototype;

    var _pushNotificationSettingManager = new PushNotificationSettingManager();

    PushNotificationSettingManager.getInstance = function() {
        return _pushNotificationSettingManager;
    };

    _proto.getNotificationInfo = function () {
        var _self = this;
        return _self._notificationInfo;
    };

    function setNotificationInfo(_self, notificationInfo) {
        var _notificationInfo = [];
        if (notificationInfo) {
            _notificationInfo = notificationInfo;
        }
        _self._notificationInfo = _notificationInfo;
    };

    _proto.appendSetting = function (id, callback) {
        var _self = this;
        var _notificationInfo = [];
        var _ret = false;
        if (id) {
            _notificationInfo = _self.getNotificationInfo();
            if (!_self.isSetting(id)) {
                var _obj = {};
                _obj.id = id;
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

    _proto.removeSetting = function (id, callback) {
        var _self = this;
        var _notificationInfo = [];
        var _ret = false;
        if (id) {
            _notificationInfo = _self.getNotificationInfo();
            var _index = _self.indexOfSetting(id);
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

    _proto.indexOfSetting = function (id) {
        var _self = this;
        var _notificationInfo = [];
        if (id) {
            _notificationInfo = _self.getNotificationInfo();
            for (var _i = 0; _i < _notificationInfo.length; _i++) {
                if (id == _notificationInfo[_i].id) {
                    return _i;
                }
                continue;
            }
        }
        return (-1);
    };

    _proto.isSetting = function (id) {
        var _self = this;
        return (_self.indexOfSetting(id) != (-1));
    };


    PushNotificationSettingManager.PARAM_PUSH_NOTIFICATIONICON_SETTING = "push_notification_settings";

    _proto.read = function () {
        var _self = this;
        var _notificationInfo = [];
        var _stringNotificationInfo = localStorage.getItem(PushNotificationSettingManager.PARAM_PUSH_NOTIFICATIONICON_SETTING);
        if (_stringNotificationInfo) {
            _notificationInfo = JSON.parse(_stringNotificationInfo);
            if (!_notificationInfo || _notificationInfo.length < 1) {
                _notificationInfo = [];
            }
        }
        setNotificationInfo(_self, _notificationInfo);
    };

    function _write(self, notificationInfo) {
        var _notificationInfo = [];
        var _ret = false;
        if (notificationInfo && notificationInfo.length > 0) {
            for (var _i = 0; _i < notificationInfo.length; _i++) {
                var _obj = {};
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
                    localStorage.setItem(PushNotificationSettingManager.PARAM_PUSH_NOTIFICATIONICON_SETTING, _stringNotificationInfo);
                    _ret = true;
                }
            }
        }
        if (!_ret) {
            _removeAllSetting(self);
        }
    };

    function _removeAllSetting(self) {
        localStorage.removeItem(PushNotificationSettingManager.PARAM_PUSH_NOTIFICATIONICON_SETTING);
        setNotificationInfo(self, []);
    };
})();
