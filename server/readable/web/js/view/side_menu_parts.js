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

function SideMenuParts() {
    this._frame = null;
};
(function() {

    var _proto = SideMenuParts.prototype;

    _proto.init = function() {
        var _self = this;
        return _self;
    };

    _proto.getHtmlElement = function() {
        return this._frame;
    };

    _proto.createFrame = function() {
        var _self = this;
        var _dom = $();
        _self._frame = _dom;
        return _dom;
    };

    _proto.showInnerFrame = function(callback) {
        var _self = this;
        setTimeout(function() {
            if (callback != null && typeof callback == 'function') {
                callback();
            }
        }, 1);
    };

    _proto.resizeContent = function() {
    };

    _proto.onProfileChanged = function(profile) {
    };

    _proto.onNotification = function(notification) {
    };

    _proto._createEventHandler = function() {
    };

    _proto.cleanUp = function() {
        var _self = this;
        var _rootElm = _self._frame;
        if(_rootElm == null){
            return;
        }
        _rootElm.find('*').off();
        _rootElm.remove();
        _self._frame = null;
    };
})();