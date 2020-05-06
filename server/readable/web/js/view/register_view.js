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
function RegisterView(htmlElement, viewTitle, parent) {
    if (!htmlElement || typeof htmlElement != 'object') {
        this._htmlElement = null;
    } else {
        this._htmlElement = htmlElement;
    }
    if (!parent || typeof parent != 'object') {
        this._parent = null;
    } else {
        this._parent = parent;
    }
    this._createSubForms(viewTitle);
};(function() {
    RegisterView.prototype = $.extend({}, ViewCore.prototype);
    var _proto = RegisterView.prototype;

    _proto._createSubForms = function(viewTitle) {
    };

    _proto._addEventHandler = function(){
    };

    _proto._removeEventHandler = function(){
    };

    _proto._clickRegisterButton = function() {
    };

    _proto._clickCancelButton = function() {
    };

    _proto._cleanup = function() {
    };

    _proto.appear = function() {
    };

    _proto._createRegisterForm = function() {
    };

    _proto._isValidationOk = function() {
    };

    _proto.isEmptyValue = function(value) {
        var _ret = false;
        if(value == null || ( typeof value == 'string' && value == '')) {
            _ret = true;
        }
        return _ret;
    };

    _proto._updateMessageData = function() {
    };

        })();
