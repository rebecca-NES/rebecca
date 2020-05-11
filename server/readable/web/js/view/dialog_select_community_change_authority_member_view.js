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
function DialogSelectCommunityChangeAuthorityMemberView(communityId) {
  this._dialogAreaElement = $('#modal_area');
  this._dialogInnerElement = null;
  this._communityId = communityId;
  DialogOkCancelView.call(this);
};(function() {
    DialogSelectCommunityChangeAuthorityMemberView.prototype = $.extend({}, DialogSelectCommunityMemberView.prototype);
    var _super = DialogSelectCommunityMemberView.prototype;
    var _proto = DialogSelectCommunityChangeAuthorityMemberView.prototype;

    _proto._init = function() {
        var _self = this;

        _self.frame = _self.getHtml();

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
        _self._dialogInnerElement.find('.success_btn').off('click');
        _self._dialogInnerElement.find('.success_btn').on('click', function(){
            var _memberList = new ArrayList();
            var obj = _self._dialogInnerElement.find('select.field[name=authority]');
            var objVals = [];
            for( var i = 0; i < obj.length; i++){
                objVals.push(obj[i].value);
            }
            $.each(_self.allPersons, function(i, person){
                _memberList.add({jid:person._jid, action:objVals[i] ? objVals[i] : _self.allAuthLists[person._profile._loginAccount], accountName:person._profile._loginAccount});
            });
            _self._request(_memberList, _self);
        });


        function getUserAuthority(authList){
            var users = authList.content.users;
            var retValue = {};
            for( var user of users ){
                retValue[user.user] = user.policies[0].rights[0].action;
            }
            return retValue;
        };

        Promise.all([
            CubeeController.getInstance().getUserPoliciesByResource(_self._communityId),
            _self.getCommunityMemberList(_self._communityId)
          ]).then((result) => {
            var authList = getUserAuthority(result[0]);
            _self.allPersons = result[1];
            _self.allAuthLists = authList;
            _self.addPersons();
        }).catch(function(err){
            return;
        });
    };

    _proto.getHtml = function(){
        const ret = '<div id="projectauthority_modal" class="card modal_card">\
          <div class="card_title">\
            <p>'+Resource.getMessage('dialog_title_group_chat_change_authority_member')+'</p>\
          </div>\
          <div class="list_wrapper scroll_content">\
            <ul class="modal_list select_list"></ul>\
          </div>\
          <div class="btn_wrapper">\
            <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
            <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_ok')+'</span></button>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

    _proto._createMemberElement = function(persons, authList){
        let _self = this;
        let _loginUserJid = LoginUser.getInstance().getJid();
        $.each(persons, function(i, person){
            let _profile = person._profile;
            let _nickName = Utils.getSafeStringData(_profile._nickName);
            _nickName = Utils.convertEscapedHtml(_nickName);
            var _account = _profile._loginAccount;
            let avatar = ViewUtils.getAvatarDataHtmlFromPerson(person);

            let memberHtml = '<li title="'+_nickName + ' @' + _account+'"><label>\
              <span class="ico ico_user"></span> \
              <span class="name">'+_nickName+'</span> \
              <span class="group"></span> \
              <select class="field" name="authority">\
              <option value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE + '">' + Resource.getMessage('policy_manage') + '</option>\
              <option value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_SEND + '">' + Resource.getMessage('policy_send') + '</option>\
              <option value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_VIEW + '">' + Resource.getMessage('policy_view') + '</option>\
              </select>\
              </label></li>';

            let query = $(memberHtml);
            // Unused variable content.
            // let content = _self._dialogInnerElement.find('.select_list').append(query);
            query.find('.ico_user').append(avatar);
            query.find(".group").text("@"+_account).html();

            if (authList.hasOwnProperty(_account)){
                let _his_action = authList[_account];
                query.find('select.field option[value="'+_his_action+'"]').prop('selected',true);
                if (_loginUserJid === person.getJid()){
                  query.find('select.field').attr("disabled", "disabled");
                }
            }
        });
    }

    _proto.getCommunityMemberList = function(_communityId){
        return new Promise(function(resolve, reject){
            function callback(communityInfo){
                if(communityInfo == null){
                  reject();
                  return;
                }
                var _personsArray = new Array();
                var _ownerList = communityInfo.getOwnerList();
                var _ownerCount = _ownerList.getCount();
                var _generalMemberList = communityInfo.getGeneralMemberList();
                var _generalMemberCount = _generalMemberList.getCount();
                for(var _i = 0; _i < _ownerCount; _i++) {
                    var _ownerPerson = _ownerList.get(_i);
                    _personsArray.push(_ownerPerson);
                }
                for(var _i = 0; _i < _generalMemberCount; _i++) {
                    var _gemeralPerson = _generalMemberList.get(_i);
                    _personsArray.push(_gemeralPerson);
                }
                resolve(_personsArray);
            }
             CubeeController.getInstance().getCommunityMemberInfo(_communityId, callback);
        })
    }

    _proto.addPersons = function(){
        const COUNT = Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST');
        let _self = this;
        let persons = [];
        for (var i = _self.personCount; i < Math.min(_self.personCount+COUNT, _self.allPersons.length); i++) {
            persons.push(_self.allPersons[i]);
        }

        _self.personCount+=persons.length;

        _self._createMemberElement(persons, _self.allAuthLists);
    };

    _proto._createExistMemberElement = function(person, authList) {
        if(person == null || typeof person != 'object'){
            return null;
        }
        var _self = this;
        var _jid = person.getJid();
        var _nickName = person.getUserName();
        var _accountName = person.getLoginAccount();
        var _avatorSrc = ViewUtils.getAvatarUrl(person);

        var _me = LoginUser.getInstance().getLoginAccount();
        var _ret = '';
        _ret += '<li id="change_authority" class="change_authority authority-member-item" id="auth_li_' + _accountName + '">';
        _ret += '  <span class="row-item"><img class="avatar" alt="' + Utils.convertEscapedTag(_nickName) + '" src="' + _avatorSrc +'"></span>';
        _ret += '  <span class="row-item item text-abbreviation"></span>';
        _ret += '  <div class="item-left-position">';
        _ret += '    <span class="row-item">';
        _ret += '      <select class="form_control" name="groupchat_authority" id="auth_list_'　+ _accountName +　'">';
        _ret += '        <option selected value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE + '">' + Resource.getMessage('policy_manage') + '</option>';
        _ret += '        <option value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_SEND + '">' + Resource.getMessage('policy_send') + '</option>';
        _ret += '        <option value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_VIEW + '">' + Resource.getMessage('policy_view') + '</option>';
        _ret += '      </select></span>';
        _ret += '  </div>';
        _ret += '</li>';
        _ret = $(_ret);
        var _displayStr = _nickName + '@' + _accountName;
        _ret.children('span.item').attr('jid', _jid);
        _ret.children('span.item').attr('accountName', _accountName);
        _ret.children('span.item').text(_displayStr);
        if (authList.hasOwnProperty(_accountName)){
            var _his_action = authList[_accountName];
            _ret.find('select#auth_list_'　+ _accountName).val(_his_action);
        } else {
            _ret.find('select#auth_list_'　+ _accountName).append($('<option selected />').html('').val(''));
        }
        if (_me == _accountName) {
            _ret.find('select#auth_list_'　+ _accountName).prop('disabled', true);
        }
        return _ret;
    }

    _proto._createMemberListFromMemberListElement = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _memberAreaElement = _rootElement.find('ul[name="member-list"]');
        if(_memberAreaElement.length == 0){
            return;
        }
        var _memberList = new ArrayList();
        _memberAreaElement.children('.change_authority').each(function(){
            var _accountName = $(this).children('span.item').attr('accountName');
            var _jid = $(this).children('span.item').attr('jid');
            var _action = $('#auth_list_'+_accountName).children('option:selected').val();

            _memberList.add({jid:_jid, action:_action, accountName:_accountName});
        });
        return _memberList;
    };

    _proto._request = function(memberList, dialogObj) {
        if(memberList == null || typeof memberList != 'object'){
            return;
        }
        if(dialogObj == null || typeof dialogObj != 'object'){
            return;
        }
        if(memberList.getCount() == 0){
            return;
        }
        var _self = this;
        var _communityId = _self._communityId;
        var actionList = [
            AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE,
            AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_SEND,
            AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_VIEW
        ];

        function sortUpdateMember(_memberList, _beforeMemberList){
            var returnValue = {
                [actionList[0]]:[],
                [actionList[1]]:[],
                [actionList[2]]:[]
            };
            var returnDeleteValue = _beforeMemberList;

            function deleteMemberFromDeleteValue(list, _accountName){
                for( var key in list){
                    if(list[key].indexOf(_accountName) != -1){
                        list[key].splice(list[key].indexOf(_accountName),1);
                    }
                }
                return list;
            }

            for(var i=0; i< _memberList.getCount(); i++){
                var member = _memberList.get(i);
                if( member.action == '' ){
                    return null;
                }else {
                    var _found = false;
                    for (var j = 0; j < actionList.length; ++j) {
                        var action = actionList[j];
                        if (member.action == action &&
                            _beforeMemberList[action].indexOf(member.accountName) == -1) {
                            returnValue[action].push(member.accountName);
                            _found = true;
                            break;
                        }
                    }
                    if (! _found) {
                        returnDeleteValue = deleteMemberFromDeleteValue(
                            returnDeleteValue,
                            member.accountName
                        );
                    }
                }
            }
            return {update:returnValue, delete:returnDeleteValue};
        }
        function sortNowMember(_beforeMemberList){
            var members = _beforeMemberList.content.users;
            var returnValue = {
                [actionList[0]]: [],
                [actionList[1]]: [],
                [actionList[2]]: []
            };
            for( var member of members ){
                returnValue[member.policies[0].rights[0].action].push(member.user);
            }
            return returnValue;
        }

        var inputMemberInfo = {};
        if(memberList.getCount() == 1){
            _self.cleanup();
        }else{
            loadingIconOnDialog();
            CubeeController.getInstance().getUserPoliciesByResource(_communityId)
            .then(function(result){
                var beforeMemberInfo = sortNowMember(result);
                inputMemberInfo = sortUpdateMember(memberList, beforeMemberInfo);
                if (inputMemberInfo == null){
                    errOnDialog(Resource.getMessage('not_selected_authority_info'));
                    return;
                }
                // Variable ownerList is used like a local variable, but is missing a declaration.
                // Variable member is used like a local variable, but is missing a declaration
                if(inputMemberInfo.update.manageCommunity.length != 0 || inputMemberInfo.delete.manageCommunity.length != 0){
                    var ownerList = new ArrayList();
                    for(var i=0; i< memberList.getCount(); i++){
                        var member = memberList.get(i);
                        if(member.action == AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE){
                            ownerList.add(member.jid);
                        }
                    }
                    CubeeController.getInstance().updateCommunityOwner(_communityId, ownerList, _onUpdateCommunityOwnerCallback);;
                }else{
                    _onUpdateCommunityOwnerCallback('changedOwnerList');
                }
              }).catch(function(err){
                  errOnDialog(Resource.getMessage('change_member_authority_err'));
              });
        }

        function _onUpdateCommunityOwnerCallback(changedOwnerList){
            if(changedOwnerList.hasOwnProperty('content')){
              if(changedOwnerList.content.reason == 403000){
                  errOnDialog(Resource.getMessage('authority_err'));
              }else{
                  errOnDialog(Resource.getMessage('change_member_authority_err'));
              }
            }
            var promise = [];
            for(var i of actionList){
                if(inputMemberInfo.update[i].length != 0){
                    promise.push(CubeeController.getInstance().assignPolicyToUser(Utils.getPolicyIdByActionAndResource(i, _communityId) ,inputMemberInfo.update[i]));
                }
                if(inputMemberInfo.delete[i].length != 0){
                    promise.push(CubeeController.getInstance().unassignPolicyFromUser(inputMemberInfo.delete[i], Utils.getPolicyIdByActionAndResource(i, _communityId)));
                }
            }
            Promise.all(promise)
            .then(function(result){
              _self.closeDialog(result);

            }).catch(function(err){
                if(err.content.reason == 403000){
                    errOnDialog(Resource.getMessage('authority_err'));
                }else if(err.content.reason == 404000){
                    errOnDialog(err.content.error_users + Resource.getMessage('not_assign_account_type_err'));
                }else{
                    errOnDialog(Resource.getMessage('change_member_authority_err'));
                }
            })
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

    _proto.closeDialog = function(result){
        var _self = this;
        let view = new CommunityDetailsView();
        view.init(this._communityId);
        new Promise(resolve => {
            setTimeout(() => {
              resolve(view.setCommunityDetailData(this._communityId))
            }, 3000)
        });
        _self.cleanup();
    }

    _proto._isValidateOk = function(inputAccountArray, personList, onValidateCallBack) {
        var _self = this;

        var _memberInfo =_self._validateInputMemberList(inputAccountArray, personList);

        _self._isValidateJoinedMember(_memberInfo, onValidateCallBack);
    };

    _proto._validateJoinedMember = function(memberInfo, existMemberList, notExistMemberList){
        var _memberStr = '';

        var _count = existMemberList.getCount();
        for(var _i = 0; _i < _count ; _i++) {
            if (_memberStr !== '') {
                _memberStr += ' ';
            }
            _memberStr += Utils.convertEscapedHtml('@' + existMemberList.get(_i).getLoginAccount());
        }

        if (_memberStr !== '') {
            memberInfo.errList.add('"' + _memberStr + '"' + Resource.getMessage('add_member_err_exist'));
        }

        return {
            memberList: notExistMemberList,
            errList: memberInfo.errList
        };
    };


    _proto.cleanup = function() {
        ViewUtils.modal_allexit();
    };

})();
