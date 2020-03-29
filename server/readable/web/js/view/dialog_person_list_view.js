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
function DialogPersonListView(title, personList) {
    this._title = title;
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._personList = personList;
    DialogOkCancelView.call(this);
};(function() {
    DialogPersonListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogPersonListView.prototype;
    _proto._init = function() {
        var _self = this;
        var _count = _self._personList.getCount();
        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _self.cleanup();
            ViewUtils.modal_allexit();
        })
    };
    _proto.cleanup = function() {
        var _self = this;
        if (_self.ps) {
            _self.ps.destroy();
        }
        _self._title = null;
        _self._dialogAreaElement = null;
        _self._dialogInnerElement = null;
        _self._personList = null;
    }
    _proto._onCloseDialog = function() {
        ColumnManager.getInstance().closePersonListDialog();
    };
    _proto.submit = function(dialogObj) {
        $(dialogObj).dialog("close");
    };
    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = "";
        var _personList = _self._personList;
        if(_personList == null){
            return _ret;
        }
        var _count = _personList.getCount();
        _ret += '<div id="read_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>' + _self._title + '（'+_count+'）</p>';
        _ret += '  </div>';
        _ret += '  <div class="list_wrapper scroll_content">';
        _ret += '   <ul class="modal_list">';
        for(var _i = 0; _i < _count; _i++){
            var _person = _personList.get(_i);
            _ret += _self._createPersonHtml(_person);
        }
        _ret += '   </ul>';
        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_label_ok') + '</span></button>';
        _ret += '  </div>';
        _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };
    _proto._createPersonHtml = function(person) {
        var _ret = "";
        var _jid = person.getJid();
        var _avatarSrc = ViewUtils.getAvatarUrl(person);
        var _accountName = person.getLoginAccount();
        var _userName = person.getUserName();
        var HAS_NO_AVATAR = 'images/user_noimage.png';
        if(_userName == null || _userName == ''){
            _userName = ViewUtils.getUserName(_jid);
        }
        var _status = person.getStatus();
        _ret += '<li class="cf">';
        _ret += '  <span class="ico ico_user">';
        if (_avatarSrc == HAS_NO_AVATAR) {
            var p = new Person();
            p.setUserName(_userName);
            _ret += ViewUtils.getDefaultAvatarHtml(p);
        } else {
            _ret += '    <img src="' + _avatarSrc + '" alt="' + Utils.convertEscapedTag(_userName) + '">';
        }
        _ret += '  </span>';
        _ret += '  <span class="name">'+Utils.convertEscapedHtml(_userName)+'</span>';
        _ret += '  <span class="group">@' + Utils.convertEscapedHtml(_accountName) + '</span>';
        _ret += '</li>';
        return _ret;
    };

    _proto.onNotification = function(notification) {
    };

    _proto.rewritDialogTitle = function() {
        var _self = this;
        var _childrens = _self._dialogInnerElement.find('.modal_list li');
        var _childrenCount = _childrens.length;
        var _title = _self._dialogInnerElement.parent().find('.card_title p');
        _title.text(_self._title + ' (' + _childrenCount + ')');
    };
})();
