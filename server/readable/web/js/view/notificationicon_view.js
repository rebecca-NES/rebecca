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
function NotificationIconView(message) {
    IconAreaIconView.call(this);
    this._imagePath = this._getIconPath();
    this._htmlElement = $('.alert_menu > ul');
    this._type = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._count = 0;
    this._init(message);
};(function() {
    NotificationIconView.prototype = $.extend({}, IconAreaIconView.prototype);
    var _super = IconAreaIconView.prototype;
    var _proto = NotificationIconView.prototype;
    _proto.getType = function() {
        return this._type;
    };
    _proto._init = function(message) {
        var _self = this;
        _self._setType();
    };
    _proto.getHtmlElement = function() {
        var _self = this;
        return _self._htmlElement;
    };

    _proto.updateNotificationArea = function(message) {
        var _self = this;
        _self._addNotificationCount(_self._count + 1);
    };
    _proto._addNotificationCount = function(count) {
        if(count == null || typeof count != 'number' || count < 0) {
            return;
        }
        var _self = this;
        var _rootElm = _self._htmlElement;
        var _countElm = _rootElm.children('.notification-count');
        _self._count = count;
        _countElm.text(count);
    };
    _proto._getIconPath = function() {
        return 'images/notice_blue.png';
    };
    _proto.onLogin = function() {
        var _self = this;
    };
})();
