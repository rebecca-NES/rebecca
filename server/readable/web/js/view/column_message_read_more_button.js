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
function ColumnMessageReadMoreButton(htmlElement, parent, isToolTipOwner) {
    this._htmlElement = htmlElement;
    this._parent = parent;
    if(isToolTipOwner != false) {
        isToolTipOwner = true;
    }
    this._isToolTipOwner = isToolTipOwner;
    this._createEventHandler();
};(function() {
    ColumnMessageReadMoreButton.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnMessageReadMoreButton.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.off();
        this._htmlElement = null;
        this._parent = null;
    };
    ColumnMessageReadMoreButton.getReadMoreImgHtml = function() {
        return this.getHtmlElement().prop('outerHTML');
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.on('click', function() {
            _self._parent.changeMessage();
        });
    };
})();
