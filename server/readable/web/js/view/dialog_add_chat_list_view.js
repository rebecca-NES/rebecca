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
function DialogAddChatListView() {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    DialogOkCancelView.call(this);
};(function() {
    DialogAddChatListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogAddChatListView.prototype;
    _proto._init = function() {
        var _self = this;

        _self.frame = _self.getInnerHtml();

        _self.selectUserListView = new SelectUserListView();

        var excludedList = [];
        var len = ContactList.getInstance().getCount();
        for (var i=0; i<len; i++) {
            excludedList.push(ContactList.getInstance().get(i).getJid());
        }
        _self.selectUserListView.init({
            hasAuthority: false,
            loginUserInfo: LoginUser.getInstance(),
            excludedList: excludedList
        });

        _self.frame.find('.modal_list').append(_self.selectUserListView.getInitialView());
        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._createEventHandler();
    };

    _proto.cleanup = function() {
        var _self = this;
        if (_self.ps) {
            _self.ps.destroy();
        };
        _self.selectUserListView.cleanUp();
        _self.selectUserListView = null;
        _self._dialogAreaElement = null;
        _self._dialogInnerElement = null;
        _self.frame = null;
    }

    _proto.getInnerHtml = function() {
        var _ret = "";
        _ret += '<div id="addchat_modal" class="card modal_card">';
        _ret += '<div class="card_title">';
        _ret += '<p>' + 'ユーザの選択' + '</p>';
        _ret += '</div>';
        _ret += '<div class="list_wrapper">';
        _ret += '<ul class="modal_list select_content">';
        _ret += '</ul>';
        _ret += '</div>';
        _ret += '<div class="" style="height: 60px"></div>';
        _ret += '<div class="btn_wrapper">';
        _ret += '<p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += ' <button id="more_button" type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">' + "追加" +'</span></button>';
        _ret += '</div>';
        _ret += '<a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>'
        _ret += '</div>'
        return $(_ret);
    };

    _proto._createEventHandler = function() {
        var _self = this;
        _self.frame.find("#more_button").on('click', function(){
            _self.frame.find("#dialog-error").text('');
            _self.addChatListMember();
        })
    }

    _proto.addChatListMember = function() {
        var _self = this;
        _self.frame.find("#dialog-error").text('');
        var userList = _self.selectUserListView.getSelectedUserList();
        var postData = new ArrayList();
        for (var i=0; i<userList.length; i++) {
            postData.add({jid: userList[i].jid, contactListGroup: ''});
        }
        if(postData.getCount() > 0) {
            function callback(result, reason) {
                if (result && result.addSuccessMemberList.getCount() > 0) {
                    var currentTab = TabManager.getInstance().selectedInfo;
                    var sidebarParts = currentTab.getSideListViewImpl().sidebarParts;
                    for (var i=0; i<sidebarParts.length; i++) {
                        if (typeof sidebarParts[i].onNotifyAddChatMember == 'function') {
                            sidebarParts[i].onNotifyAddChatMember(result.addSuccessMemberList);
                        }
                    }
                }
                if (result && result.addFailureMemberList.getCount() > 0) {
                    var err = Resource.getMessage('wizard_chatList_add_failed');
                    var _reason = reason ? reason : '';
                    _self.frame.find("#dialog-error").text( err + _reason);
                } else {
                    _self.cleanup();
                    ViewUtils.modal_allexit();
                }
            }
            CubeeController.getInstance().addContactListMember(postData,callback);
        }else{
            _self.frame.find("#dialog-error").text(Resource.getMessage('dialog_add_chat_no_user'));
        }
    }
    $(function() {
        var showChatList = $('#left_sidebar').find('.contact_list .list_ttl a.list_add');
        showChatList.on('click', function(){
            var dialog = new DialogAddChatListView();
            dialog.showDialog();
        });
    });
})();
