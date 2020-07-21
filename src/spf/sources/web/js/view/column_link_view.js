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

function ColumnLinkView(htmlElement) {
    this._htmlElement = htmlElement;
    this._ctrlFlg = false;
    this._createEventHandler();
};(function() {
    ColumnLinkView.prototype = $.extend({}, ViewCore.prototype);

    var _proto = ColumnLinkView.prototype;
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.on('keydown', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                if (_self._ctrlFlg) {
                    _self._ctrlFlg = false;
                    return false;
                } else {
                }
            } else if ((e.which && e.which == 17) || (e.keyCode && e.keyCode == 17)) {
                _self._ctrlFlg = true;
            } else {
                _self._ctrlFlg = false;
            }
        });
        _rootElement.on('keyup', function(e) {
            if ((e.which && e.which == 17) || (e.keyCode && e.keyCode == 17)) {
                _self._ctrlFlg = false;
            }
        });
    };
})();
