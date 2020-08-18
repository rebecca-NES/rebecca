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

function CautionIconView(itemList) {
    IconAreaIconView.call(this);
    this._imagePath = this._getIconPath();
    this._htmlElement = null;
    this._type = CautionIconView.TYPE_UNKNOWN;
    this._count = 0;
    this._init(itemList);
};(function() {
    CautionIconView.TYPE_UNKNOWN = 0;
    CautionIconView.TYPE_DEMAND_TASK = 1;
    CautionIconView.prototype = $.extend({}, IconAreaIconView.prototype);
    var _super = IconAreaIconView.prototype;
    var _proto = CautionIconView.prototype;
    _proto.getType = function() {
        return this._type;
    };
    _proto._init = function(itemList) {
        var _self = this;
        _self._setType();
        var _htmlString = _self._getHtml();
        _self._htmlElement = $(_htmlString);
        _self._addNotificationCount(_self._count + 1);
        _self._addEventHandler();
    };
    _proto.getHtmlElement = function() {
        var _self = this;
        return _self._htmlElement;
    };
    _proto.destruct = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        if(_selfElm) {
            _selfElm.off().remove();
        }
    };
    _proto.updateNotificationArea = function(itemList) {
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
    _proto._getHtml = function() {
        var _ret = '';
        var _self = this;
        _ret += '<span>';
        _ret += '<input type="image" class="menu-button menu-notify" src="' + _self._imagePath + '" alt="' + Resource.getMessage('notification') + '" title="' + _self._getIconTitle() + '">';
        _ret += '<button class="notification-count">' + _self._count + '</button>';
        _ret += '</span>';
        return _ret;
    };
    _proto._addEventHandler = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        _selfElm.on('click', function() {
            console.log('CautionIconView::_addEventHandler … click!');
        });
    };
    _proto._getIconPath = function() {
        return 'images/notice_blue.png';
    };
    _proto._setType = function() {
    };
    _proto.onLogin = function() {
        var _self = this;
        _self.setNotificationCountPosition();
    };
    _proto.setNotificationCountPosition = function() {
        var _self = this;
        var _notificationIconElm = _self._htmlElement.children('.menu-notify');
        var _notificationCountElm = _self._htmlElement.children('.notification-count');
        _notificationCountElm.position({
            my : 'right top',
            at : 'right top',
            of : _notificationIconElm,
            offset : '4 0'
        });
        _notificationCountElm.css('margin-right', -20);
    };
    _proto.onNotificationRecieved = function(notification) {
    };
})();
