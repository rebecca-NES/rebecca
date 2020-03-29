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
function DialogSettingSearchView(title) {
    this._height = 200;
    this._submitButtonTitle = DialogOkCancelView.LABEL_OK;
    this._dialogID = 'contextsearch-input';
    DialogSettingView.call(this, title);
};(function() {
    DialogSettingSearchView.prototype = $.extend({}, DialogSettingFilterView.prototype);
    var _super = DialogSettingFilterView.prototype;
    var _proto = DialogSettingSearchView.prototype;
    _proto._searchExecute = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _keywordInputElement = _rootElement.find('input#' + _self._dialogID);
        var _keywordStr = Utils.trimStringMulutiByteSpace(_keywordInputElement.val());
        if(ContextSearchView.getInstance().search(_keywordStr)){
            _rootElement.dialog("close");
        }
    }
})();
