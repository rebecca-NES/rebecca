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

function ColumnAddIconView() {
    IconAreaIconView.call(this);
};(function() {
    ColumnAddIconView.prototype = $.extend({}, IconAreaIconView.prototype);

    var _dialogAddColumn = {};
    _dialogAddColumn[TabItemView.TYPE_MY_WORK_PLACE] = DialogAddColumnView;
    _dialogAddColumn[TabItemView.TYPE_COMMUNITY] = DialogAddColumnForCommunityView;

    var additionalFunc = function() {
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _tabType = _tabInfo.type;
        var _dialogAddColumnView = Utils.getSafeValue(_dialogAddColumn, _tabType, DialogAddColumnView);
        var _mailCooperationSettingServerList = LoginView.getInstance().getMailCooperationSettingServerList();
        var _columnAddDialogView = new _dialogAddColumnView(_mailCooperationSettingServerList);
        _columnAddDialogView.showDialog();
    };
    $(function() {
        var addColumnIcon = $('#left_sidebar').find('a.addcolum_modal');
        addColumnIcon.on('click', additionalFunc);
    });

})();
