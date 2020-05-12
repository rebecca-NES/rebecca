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
function DialogSelectChatRoomForceLeaveMemberView(roomId) {
    var _self = this;
    _self._roomId = roomId;
    var _title = Resource.getMessage('dialog_title_group_chat_leave_member');
    _self._autoCompleteCssCls = 'autocomplete-for-chatroom';
    DialogSelectChatRoomMemberView.call(this, _title, roomId);
};(function() {
    DialogSelectChatRoomForceLeaveMemberView.prototype = $.extend({}, DialogSelectChatRoomMemberView.prototype);
    var _super = DialogSelectChatRoomMemberView.prototype;
    var _proto = DialogSelectChatRoomForceLeaveMemberView.prototype;

    _proto._init = function() {
        var _self = this;

        _self.allMembers = [];

        _self.frame = _self.getHtml();

        _self._getRoomMemberList(_self._roomId).then(function(persons){
            _self.allMembers = persons._array;
            _self.allPersons = persons._array;
            _self.addPersons();
        }).catch(function(err){
            return;
        });

        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);
        _self.personCount = 0; 
        _self.frame.find('.scroll_content').off('scroll');
        _self.frame.find('.scroll_content').on('scroll', function() {
            if($(this).get(0).scrollHeight === $(this).scrollTop() + $(this).get(0).clientHeight){
                if (_self.personCount !== _self.allPersons.length){
                    _self.addPersons();
                }
            }
        });

        _self.memberList = new ArrayList();

        _self._dialogInnerElement.find('.success_btn').off('click');
        _self._dialogInnerElement.find('.success_btn').on('click', function(){
            _self._request(_self.memberList, _self);
        });

       _self._dialogInnerElement.find('.user_search_btn').off('click');
       _self._dialogInnerElement.find('.user_search_btn').on('click', function(){
          _self.filterMembers();
       });
       _self._dialogInnerElement.find('.field').keypress(function(e) {
          if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
              _self.filterMembers();
          }
          return e.which !== 13;
       });

       _self._dialogInnerElement.find('input[name=allcheck]').off('change');
       _self._dialogInnerElement.find('input[name=allcheck]').on('change', function() {
           _self._dialogInnerElement.find('input[name=removeprojectmember]').prop('checked', this.checked);
           let jids = _self._dialogInnerElement.find('input[name=removeprojectmember]');
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
    };

    _proto.getHtml = function(){
        const ret = '<div id="removeprojectmember_modal" class="card modal_card">\
          <div class="card_title">\
            <p>'+Resource.getMessage('dialog_title_group_chat_leave_member')+'</p>\
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
            <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('button_force_leave')+'</span></button>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

    _proto._createMemberElement = function(persons){
        let _self = this;
        let _loginUser = LoginUser.getInstance();
        let _loginUserJid = _loginUser.getJid();
        $.each(persons, function(i, person){
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
                   <input type="checkbox" name="removeprojectmember"><span></span></label> \
                   </label></li>';

                let query = $(memberHtml);
                // Unused variable content.
                // let content = _self._dialogInnerElement.find('.select_list').append(query);
                query.find('.ico_user').append(avatar);
                query.find(".group").text(_account).html();
                query.find("input:checkbox").val(person._jid);

                if (0 <= _self.memberList._array.indexOf(person.getJid())){
                    query.find("input:checkbox").prop("checked",true);
                }
                query.find('input[name=removeprojectmember]').off('change');
                query.find('input[name=removeprojectmember]').on('change', function() {
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
        _self.addPersons();
        _self.frame.find('.scroll_content').scrollTop(0);
    };

    _proto.addPersons = function(){
        const COUNT = Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST');
        let _self = this;
        let persons = [];
        for (var i = _self.personCount; i < Math.min(_self.personCount+COUNT, _self.allPersons.length); i++) {
              persons.push(_self.allPersons[i]);
        }

        _self.personCount+=persons.length;

        _self._createMemberElement(persons);
    };

    _proto._request = function(memberList, dialogObj) {
        var _self = this;
        _self._dialogInnerElement.find('.checkedCnt').text("0");
        if(memberList == null || typeof memberList != 'object'){
            return;
        }
        if(dialogObj == null || typeof dialogObj != 'object'){
            return;
        }
        if(memberList.getCount() == 0){
            return;
        }
        var _roomId = _self._groupId;
        var _actionList = [
            AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE,
            AuthorityDef.AUTHORITY_ACTIONS.GC_SEND,
            AuthorityDef.AUTHORITY_ACTIONS.GC_VIEW
        ];

        function createUnassignPolicyList(userList, assignList){
            var deleteList = {
                [_actionList[0]]:[],
                [_actionList[1]]:[],
                [_actionList[2]]:[]
            };
            var members = assignList.content.users;
            for(var deleteAccountName of userList){
                for( var member of members ) {
                    if( member.user == deleteAccountName){
                        deleteList[member.policies[0].rights[0].action].push(deleteAccountName);
                        break;
                    }
                }
            }
            return deleteList;
        }

        loadingIconOnDialog();

        Promise.all([
            CubeeController.getInstance().getUserPoliciesByResource(_roomId),
            _self._getRoomMemberList(_roomId)
        ]).then(function(result){
            var deleteAccountNameList = [];
            for ( var i = 0; i < memberList.getCount(); i++){
                deleteAccountNameList.push(result[1].getByKey(memberList.get(i)).getLoginAccount());
            }
            var deleteList = createUnassignPolicyList(deleteAccountNameList, result[0]);
            var promise = [];
            for(var i of _actionList){
                if(deleteList[i].length != 0){
                    promise.push(CubeeController.getInstance().unassignPolicyFromUser(deleteList[i], Utils.getPolicyIdByActionAndResource(i, _roomId)));
                }
            }
            return Promise.all(promise);
        }).then(function(result){
            CubeeController.getInstance().removeChatRoomMember(_roomId, memberList, 'member', _onRemoveMemberCallback);
        }).catch(function(err){
            if(err.content.reason == 403000){
                errOnDialog(Resource.getMessage('authority_err'));
            }else{
                errOnDialog(Resource.getMessage('leave_member_err'));
            }
        })

        function _onRemoveMemberCallback(leavedMemberList){
            if(leavedMemberList.hasOwnProperty('content')){
                if(leavedMemberList.content.reason == 403000){
                    errOnDialog(Resource.getMessage('authority_err'));
                }else{
                    errOnDialog(Resource.getMessage('leave_member_err'));
                }
                return;
            }else{
                _self.cleanup();
            }
        }

        function errOnDialog(errMessage){
            _self._dialogInnerElement.find("#dialog-error").text(errMessage);
            _self._dialogInnerElement.find(".success_btn").attr("disabled", false);
        }

        function loadingIconOnDialog(){
            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
            ViewUtils.showLoadingTopInChild($('#dialog-error'));
            _self._dialogInnerElement.find(".success_btn").attr("disabled", true);
            _self._dialogInnerElement.find("#dialog-error").text("");
        }
    };

    _proto._isValidateOk = function(inputAccountArray, personList, onValidateCallBack) {
        var _self = this;
        var _loginUser = LoginUser.getInstance();
        var _loginUserJid = _loginUser.getJid();

        var _memberInfo =_self._validateInputMemberList(inputAccountArray, personList);
        var _memberList = _memberInfo.memberList;

        var _count = _memberList.getCount();
        for(var _i = 0; _i < _count; _i++){
            if(_loginUserJid == _memberList.get(_i).getJid()){
                _memberInfo.errList.add(Resource.getMessage('not_force_leave_yourself'));
                _memberList.remove(_i);
                break;
            }
        }

        _self._isValidateJoinedMember(_memberInfo, onValidateCallBack);
    };

    _proto._validateJoinedMember = function(memberInfo, existMemberList, notExistMemberList){
        var _notMemberStr = '';

        var _count = notExistMemberList.getCount();
        for(var _i = 0; _i < _count ; _i++) {
            if (_notMemberStr !== '') {
                _notMemberStr += ' ';
            }
            _notMemberStr += Utils.convertEscapedHtml('@' + notExistMemberList.get(_i).getLoginAccount());
        }

        if (_notMemberStr !== '') {
            memberInfo.errList.add('"' + _notMemberStr + '"' + Resource.getMessage('add_member_err_not_exist'));
        }

        return {
            memberList: existMemberList,
            errList: memberInfo.errList
        };
    };

    _proto.cleanup = function() {
        ViewUtils.modal_allexit();
    };
})();
