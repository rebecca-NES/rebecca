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
function DialogSettingFilterMyTaskView(title, columnInfo, ownerObj, parentColumn) {

    this._height = 490;

    this._width = 610;

    this._submitButtonTitle = DialogOkCancelView.LABEL_OK;
    this._dialogID = 'filter-my-task-input';

    DialogSettingFilterTaskView.call(this, title, columnInfo, ownerObj, parentColumn); 
};(function() {

    DialogSettingFilterMyTaskView.prototype = $.extend({}, DialogSettingFilterTaskView.prototype);

    var _super = DialogSettingFilterTaskView.prototype;

    var _proto = DialogSettingFilterMyTaskView.prototype;

    _proto.getInnerHtml = function() {

        var _self = this;

        var _ret = "";
        _ret += '<div id="taskfilter_modal" class="card modal_card">';
        _ret += '<div class="card_title"><p>' + Resource.getMessage('task_filter') + '</p></div>';
        _ret += '<div class="list_wrapper">';
        _ret += '<ul class="modal_list select_list cf">';

        _ret += _self._displayFieldClient();


        _ret += _self._displayFieldOwner();

        _ret += _self._displayFieldStatus();

        _ret += _self._displayFieldPriority();

        _ret += _self._displayFieldDemandStatus();

        _ret += _self._displayFieldRequestType();

        _ret += _self._displayFieldDueDate();

        _ret += _self._displayFieldUrl();

        _ret += _self._displayFieldTerm();

        _ret += '</ul>';
        _ret += '</div>';
        _ret += _self.displaySubmitButton();
        _ret += '</div>';

        return _ret;
    };
})();
