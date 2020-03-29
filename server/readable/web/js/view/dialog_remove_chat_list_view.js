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
function DialogRemoveChatListView() {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    DialogOkCancelView.call(this);
};(function() {
    DialogRemoveChatListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogRemoveChatListView.prototype;
    _proto._init = function() {
        var _self = this;

        _self.frame = _self.getInnerHtml();
        _self.memberList = new ArrayList();
        _self.allMembers = new Array();
        _self.allPersons = new Array();
        for (var i=0; i<ContactList.getInstance().getCount(); i++) {
            _self.allMembers.push(ContactList.getInstance().get(i));
            _self.allPersons.push(ContactList.getInstance().get(i));
        }

        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();
        _self._createMemberElement(_self.allMembers);

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

    _proto.getInnerHtml = function(){
        const ret = '<div id="removeprojectmember_modal" class="card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('dialog_title_remove_chatlist_user')+' </p>\
          </div>\
          <div class="select_menu">\
            <span class="select_number"><i class="fa fa-user"></i><span class="checkedCnt">0</span></span>\
            <form action="#" method="get" class="search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('wizard_chatlist_conditions_account')+'">\
              <button type="button" name="search" class="user_search_btn ico_btn"><i class="fa fa-search"></i></button>\
            </form>\
            <label class="modal_btn all_check">'+Resource.getMessage('wizard_chatlist_allcheck')+'<label class="checkbox"><input name="allcheck" type="checkbox"><span></span></label></label>\
          </div>\
          <div class="list_wrapper scroll_content">\
            <ul class="modal_list select_list"></ul>\
          </div>\
          <div class="btn_wrapper">\
            <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
            <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_remove_user')+'</span></button>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

    _proto._createMemberElement = function(contactList){
        let _self = this;
        let _loginUser = LoginUser.getInstance();
        let _loginUserJid = _loginUser.getJid();
        $.each(contactList, function(i, person){
            if(_loginUserJid !== person.getJid()){
                let _profile = person._profile;
                var _nickName = Utils.getSafeStringData(_profile._nickName);
                _nickName = Utils.convertEscapedHtml(_nickName);
                var _account = "@"+_profile._loginAccount;
                let avatar = ViewUtils.getAvatarDataHtmlFromPerson(person);

                let memberHtml = '<li title="'+_nickName + ' ' + _account+'"><label>\
                   <span class="ico ico_user"></span> \
                   <span class="name">'+_nickName+'</span> \
                   <span class="group"></span> \
                   <label class="checkbox">\
                   <input type="checkbox" name="removeuser"><span></span></label> \
                   </label></li>';

                let query = $(memberHtml);
                let content = _self._dialogInnerElement.find('.select_list').append(query);
                query.find('.ico_user').append(avatar);
                query.find(".group").text(_account).html();
                query.find("input:checkbox").val(person._jid);

                if (0 <= _self.memberList._array.indexOf(person.getJid())){
                    query.find("input:checkbox").prop("checked",true);
                }
                query.find('input[name=removeuser]').off('change');
                query.find('input[name=removeuser]').on('change', function() {
                  let jid = this.value;
                  if(this.checked){
                      _self.memberList.add(this.value);
                  }else{
                      _self.memberList._array.forEach((x, i) => {
                          if(x === jid) _self.memberList.remove(i);
                      });
                  }
                  let cnt = _self.memberList.getCount();
                  _self._dialogInnerElement.find('.checkedCnt').text(cnt);
                });
            }
        });
    }

    _proto._createEventHandler = function() {
        var _self = this;
        _self.frame.find(".success_btn").on('click', function(){
            _self.frame.find("#dialog-error").text('');
            _self.removeChatListMember();
        })
        _self._dialogInnerElement.find('.user_search_btn').off('click');
        _self._dialogInnerElement.find('.user_search_btn').on('click', function(){
            _self.filterMembers();
        });
        _self._dialogInnerElement.find('input.field').keypress(function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
              _self.filterMembers();
           }
           return e.which !== 13;
        });

        _self._dialogInnerElement.find('input[name=allcheck]').off('change');
        _self._dialogInnerElement.find('input[name=allcheck]').on('change', function() {
            _self._dialogInnerElement.find('input[name=removeuser]').prop('checked', this.checked);
            let jids = _self._dialogInnerElement.find('input[name=removeuser]');
            if(this.checked){
                for( var i = 0; i < jids.length; i++){
                    if(0 === _self.memberList._array.filter(m => m === jids[i].value).length){
                        _self.memberList.add(jids[i].value);
                    }
                }
            }else{
                for( var i = 0; i < jids.length; i++){
                    _self.memberList.remove(_self.memberList._array.indexOf(jids[i].value));
                }
            }
            let cnt = _self.memberList.getCount();
            _self._dialogInnerElement.find('.checkedCnt').text(cnt);
        });
    }

    _proto.filterMembers = function(){
        let _self = this;
        _self.personCount = 0;
        _self._dialogInnerElement.find('.select_list').empty();
        _self._dialogInnerElement.find('input[name=allcheck]').prop('checked', false);
        let _inputKeyword = _self.frame.find('.field').val();
        let userList = _self.allMembers.filter(function(person){
            var _nickName = Utils.getSafeStringData(person.getUserName());
            var _account = person._profile.getLoginAccount();
            return 0 <= _nickName.indexOf(_inputKeyword) || 0 <= _account.indexOf(_inputKeyword);
        });
        _self.allPersons = userList;
        _self._createMemberElement(_self.allPersons);
        _self.frame.find('.scroll_content').scrollTop(0);
    };

    _proto.removeChatListMember = function() {
        var _self = this;
        _self.frame.find("#dialog-error").text('');
        var postData = new ArrayList();
        for (var i=0; i<_self.memberList.getCount(); i++) {
            postData.add({jid: _self.memberList.get(i)});
        }
        if(postData.getCount() > 0) {
            function callback(result, reason) {
                if (result.removeSuccessMemberList.getCount() > 0) {
                    var currentTab = TabManager.getInstance().selectedInfo;
                    var sidebarParts = currentTab.getSideListViewImpl().sidebarParts;
                    for (var i=0; i<sidebarParts.length; i++) {
                        if (typeof sidebarParts[i].onNotifyRemoveChatMember == 'function') {
                            sidebarParts[i].onNotifyRemoveChatMember(result.removeSuccessMemberList);
                        }
                    }
                }
                if (result.removeFailureMemberList.getCount() > 0) {
                    var err = Resource.getMessage('wizard_chatList_add_failed');
                    var _reason = reason ? reason : '';
                    _self.frame.find("#dialog-error").text( err + _reason);
                } else {
                    ViewUtils.modal_allexit();
                }
            }
            CubeeController.getInstance().removeContactListMember(postData,callback);
        }else{
            _self.frame.find("#dialog-error").text(Resource.getMessage('err_not_selected_user'));
        }
    }
    $(function() {
        var showChatList = $('#left_sidebar').find('.contact_list .list_ttl a.list_remove');
        showChatList.on('click', function(){
            var dialog = new DialogRemoveChatListView();
            dialog.showDialog();
        });
    });
})();
