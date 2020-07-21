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

function DialogAddColumnForCommunityView(mailCooperationSettingServerList) {
    this._mailCooperationSettingServerList = mailCooperationSettingServerList;
    this._height = 150;
    DialogAddColumnView.call(this);
};(function() {

    DialogAddColumnForCommunityView.prototype = $.extend({}, DialogAddColumnView.prototype);
    var _super = DialogAddColumnView.prototype;
    var _proto = DialogAddColumnForCommunityView.prototype;
    _proto.getColumnAddMenuHtml = function() {
        var _ret = '';
        var _self = this;
        _self._tabDetailList.add(new NewTabDetailForCommunity(_self._mailCooperationSettingServerList));
        _ret += '<div id="tab-column-add">';
        _ret += '<ul>';
        var _count = _self._tabDetailList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            _ret += '<li><a href="#' + _self._tabDetailHtmlIdList.get(_i) + '">' + _self._tabDetailList.get(_i).getTabName() + '</a></li>';
        }
        _ret += '</ul>';
        for (var _i = 0; _i < _count; _i++) {
            _ret += '<div id="' + _self._tabDetailHtmlIdList.get(_i) + '">' + _self._tabDetailList.get(_i).getDetailHtml() + '</div>';
        }
        _ret += '</div>';
        return _ret;
    };
    _proto.showDialog = function() {
        this._dialogInnerElement.dialog('open');
    };
})();

function NewTabDetailForCommunity(mailCooperationSettingServerList) {
    NewTabDetail.call(this, mailCooperationSettingServerList);
};(function() {

    NewTabDetailForCommunity.prototype = $.extend({}, NewTabDetail.prototype);
    var _super = NewTabDetail.prototype;

    var _proto = NewTabDetailForCommunity.prototype;
    _proto._init = function() {
        var _self = this;
    };
    _proto.getDetailHtml = function() {
        var _self = this;
        var _ret = '<ul class="column-add-new">';
        _ret += '<li style="display :none;>';
        _ret += '<input type="radio" name="column-info" value="' + ColumnInformation.TYPE_COLUMN_RECENT + '" id="column-info-recent">';
        _ret += '<label for="column-info-recent">' + NewTabDetail.LIST_TITLE_RECENT + '</label>';
        _ret += '</li>';
        _ret += '<li style="display :none;>';
        _ret += '<input type="radio" name="column-info" value="' + ColumnInformation.TYPE_COLUMN_MENTION + '" id="column-info-mention">';
        _ret += '<label for="column-info-mention">' + NewTabDetail.LIST_TITLE_MENTION + '</label>';
        _ret += '</li>';
        _ret += '<li style="display :none;>';
        _ret += '<input type="radio" name="column-info" value="' + ColumnInformation.TYPE_COLUMN_INBOX + '" id="column-info-inbox">';
        _ret += '<label for="column-info-inbox">' + NewTabDetail.LIST_TITLE_INBOX + '</label>';
        _ret += '</li>';
        _ret += '<li  style="display :none;">';
        _ret += '<input type="radio" name="column-info" value="" id="column-info-send" disabled>';
        _ret += '<label for="column-info-send">' + NewTabDetail.LIST_TITLE_SEND + '</label>';
        _ret += '</li>';
        _ret += '<li  style="display :none;">';
        _ret += '<input type="radio" name="column-info" value="" id="column-info-favorite" disabled>';
        _ret += '<label for="column-info-favorite">' + NewTabDetail.LIST_TITLE_FAVORITE + '</label>';
        _ret += '</li>';
        _ret += '<li  style="display :none;">';
        _ret += '<input type="radio" name="column-info" value="" id="column-info-hashtag" disabled>';
        _ret += '<label for="column-info-hashtag">' + NewTabDetail.LIST_TITLE_HASHTAG + '</label>';
        _ret += '<ul class="column-add-new">';
        _ret += '<li>';
        _ret += '#';
        _ret += '<input type="text" name="column-info" value="" class="hashtag-input" disabled>';
        _ret += '</li>';
        _ret += '</ul>';
        _ret += '</li>';
        _ret += '<li style="display :none;>';
        _ret += '<input type="radio" name="column-info" value="' + ColumnInformation.TYPE_COLUMN_TASK + '" id="column-info-task">';
        _ret += '<label for="column-info-task">' + NewTabDetail.LIST_TITLE_TASK + '</label>';
        _ret += '<ul class="column-add-new">';
        _ret += '<li>';
        _ret += '<select name="task" class="ui-corner-all">';
        _ret += '<option value="">'+ Resource.getMessage('MyTask') +'</option>';
        _ret += '</select>';
        _ret += '</li>';
        _ret += '</ul>';
        _ret += '</li>';
        _ret += '<li style="display :none;">';
        _ret += '<input type="radio" name="column-info" value="" id="column-info-group" disabled>';
        _ret += '<label for="column-info-group">' + NewTabDetail.LIST_TITLE_GROUP + '</label>';
        _ret += '<ul class="column-add-new">';
        _ret += '<li>';
        _ret += '<select name="group" disabled>';
        _ret += '<option value="">'+ Resource.getMessage('Friend') +'</option>';
        _ret += '<option value="">'+ Resource.getMessage('Family') +'</option>';
        _ret += '</select>';
        _ret += '</li>';
        _ret += '</ul>';
        _ret += '</li>';
        _ret += '<li style="display :none;">';
        _ret += '<input type="radio" name="column-info" value="" id="column-info-list" disabled>';
        _ret += '<label for="column-info-list">' + NewTabDetail.LIST_TITLE_LIST + '</label>';
        _ret += '<ul class="column-add-new">';
        _ret += '<li>';
        _ret += '<select name="list" disabled>';
        _ret += '<option value="">'+ Resource.getMessage('Java') + '</option>';
        _ret += '<option value="">'+ Resource.getMessage('C') + '</option>';
        _ret += '</select>';
        _ret += '</li>';
        _ret += '</ul>';
        _ret += '</li>';
        _ret += '<li>';
        _ret += '<input type="radio" name="column-info" value="' + ColumnInformation.TYPE_COLUMN_CHAT + '" id="column-info-chat">';
        _ret += '<label for="column-info-chat">' + NewTabDetail.LIST_TITLE_CHAT + '</label>';
        _ret += '<br />';
        _ret += '<ul class="column-add-new">';
        _ret += '<li>';
        _ret += '<input type="text" class="chat-partner ui-corner-all autocomplete" name="column-info" value="" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '">';
        _ret += '</li>';
        _ret += '</ul>';
        _ret += '</li> <!-- chat -->';
        if(_self._mailCooperationSettingServerList != null && _self._mailCooperationSettingServerList.getCount() > 0) {
            _ret += '<li style="display :none;>';
            _ret += '<input type="radio" name="column-info" value="' + ColumnInformation.TYPE_COLUMN_MAIL + '" id="column-info-mail">';
            _ret += '<label for="column-info-mail">' + NewTabDetail.LIST_TITLE_MAIL + '</label>';
            _ret += '</li> <!-- mail -->';
        }
        _ret += '</ul>';

        return _ret;
    };

})();
