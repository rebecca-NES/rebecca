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

function DialogSelectCommunityAddMemberView(communityId) {

    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._communityId = communityId;
    DialogOkCancelView.call(this);
};(function() {

    DialogSelectCommunityAddMemberView.prototype = $.extend({}, DialogSelectCommunityMemberView.prototype);
    var _super = DialogSelectCommunityMemberView.prototype;
    var _proto = DialogSelectCommunityAddMemberView.prototype;

    _proto._init = function() {
        var _self = this;

        _self.displayMembers = [];
        _self.allItemCount = -1;
        _self.personCount = 0;
        _self.startId = 0;

        _self.frame = _self.getHtml();

        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);
        _self.frame.find('.scroll_content').off('scroll');
        _self.frame.find('.scroll_content').on('scroll', function() {
            if($(this).get(0).scrollHeight === $(this).scrollTop() + $(this).get(0).clientHeight){
                _self.searchExecute();
            }
        });

        _self.memberList = new ArrayList();

        _self._dialogInnerElement.find('.success_btn').off('click');
        _self._dialogInnerElement.find('.success_btn').on('click', function(){
            _self._request(_self.memberList, _self);
        });

        _self._dialogInnerElement.find('.user_search_btn').off('click');
        _self._dialogInnerElement.find('.user_search_btn').on('click', function(){
            _self.firstSearch();
        });
        _self._dialogInnerElement.find('.field').keypress(function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
                _self.firstSearch();
            }
            return e.which !== 13;
        });

        _self._dialogInnerElement.find('input[name=allcheck]').off('change');
        _self._dialogInnerElement.find('input[name=allcheck]').on('change', function() {
            _self._dialogInnerElement.find('input[name=addprojectmember]').prop('checked', this.checked);
            let jids = _self._dialogInnerElement.find('input[name=addprojectmember]');
            var sels = _self._dialogInnerElement.find('select.field[name=authority]');
            var objVals = [];
            for( var i = 0; i < jids.length; i++){
                if(jids[i].checked){
                    objVals[jids[i].value] = sels[i].value;
                }
            }
            if(this.checked){
                for(var jid in objVals){
                    if(0 === _self.memberList._array.filter(m => m.jid === jid).length){
                        let checkedMember = _self.displayMembers.filter(m => m.getJid() === jid)[0];
                        _self.memberList.add({jid:jid, action:objVals[jid], accountName:checkedMember._profile._loginAccount});
                    }
                }
            }else{
                for( var i = 0; i < jids.length; i++){
                    _self.memberList.remove(_self.memberList._array.map(m => m.jid).indexOf(jids[i].value));
                }
            }
            let cnt = _self.memberList.getCount();
            _self._dialogInnerElement.find('.checkedCnt').text(cnt);
        });

        _self.projectMembers = [];

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
            _self.allAuthLists = getUserAuthority(result[0]);
            _self.projectMembers = result[1];
            let _loginUser = LoginUser.getInstance();
            let _groups = Utils.getSafeArrayData(_loginUser.getGroup());
            let _group = _groups.length > 0 ? _groups[0] : '';
            _self._dialogInnerElement.find('input.field').val(_group);
            _self.searchExecute();

        }).catch(function(err){
            return;
        });
    };

    _proto.firstSearch = function(){
        let _self = this;
        _self.allItemCount = -1;
        _self.personCount = 0;
        _self.startId = 0;
        _self.displayMembers = [];
        _self._dialogInnerElement.find('.select_list').empty();
        _self.searchExecute();
        _self.frame.find('.scroll_content').scrollTop(0);
    };

    _proto.getHtml = function(){
        const ret = '<div id="addprojectmember_modal" class="card modal_card">\
          <div class="card_title">\
            <p>'+Resource.getMessage('dialog_title_group_chat_add_member')+'</p>\
          </div>\
          <div class="select_menu">\
            <span class="select_number"><i class="fa fa-user"></i><span class="checkedCnt">0</span></span>\
            <form class="search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('wizard_chatlist_conditions')+'">\
              <button type="button" name="search" class="user_search_btn ico_btn"><i class="fa fa-search"></i></button>\
            </form>\
            <label class="modal_btn all_check">'+Resource.getMessage('wizard_chatlist_allcheck')+'<label class="checkbox"><input name="allcheck" type="checkbox"><span></span></label></label>\
          </div>\
          <div class="list_wrapper scroll_content">\
            <ul class="modal_list select_list"></ul>\
          </div>\
          <div class="btn_wrapper">\
            <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
            <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">追加</span></button>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

    _proto.searchExecute = function() {

        var _self = this;
        if(_self.displayMembers.length === _self.allItemCount){
          return;
        }

        _self._dialogInnerElement.find('input[name=allcheck]').prop('checked', false);

        var _inputKeyword = _self.frame.find('.field').val();

        var _searchKeyword = Utils.trimStringMulutiByteSpace(_inputKeyword);
        if(!_searchKeyword || _searchKeyword == ""){
            return;
        }

        var condition = ViewUtils.getKeywordFilterFromKeywordInputString(_searchKeyword, false);
        if (!condition || typeof condition != 'object') {
            return;
        }

        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("login_account");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_ASC);
        var _filterCondition = condition;
        var _columnSearchCondition = new ColumnSearchCondition(_filterCondition, _sortCondition);
        var _count = Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST');

        return CubeeController.getInstance().searchPerson(
            _self.startId,
            _count,
            _columnSearchCondition,
            function(userList) {
                var lastId = userList._array[userList._array.length-1];
                _self.startId = lastId ? lastId.getId() : 0;
                _self.displayMembers = _self.displayMembers.concat(userList._array);
                _self.allItemCount = userList._allItemCount;
                _self.personCount += userList.getCount();
                _self._createMemberElement(userList);
            }
        );
    }

    _proto._createMemberElement = function(userList){
        let _self = this;
        let persons = userList._array;
        let _loginUser = LoginUser.getInstance();
        let _loginUserJid = _loginUser.getJid();
        $.each(persons, function(i, person){
            if(_loginUserJid !== person.getJid()){
                var _nickName = Utils.getSafeStringData(person.getUserName());
                _nickName = Utils.convertEscapedHtml(_nickName);
                var _account = person._profile._loginAccount;
                var _groups = Utils.getSafeArrayData(person.getGroup());
                _groups = _groups.length > 0 ? _groups.join(',') : Resource.getMessage('group_title_no_group');
                _groups = Utils.convertEscapedHtml(_groups);
                let avatar = ViewUtils.getAvatarDataHtmlFromPerson(person);

                const memberHtml = '<li title="'+_nickName + ' ' + _groups+'"><label>\
                   <span class="ico ico_user"></span> \
                   <span class="name">'+_nickName+'</span> \
                   <span class="group">'+_groups+'</span> \
                   <label class="checkbox">\
                     <input type="checkbox" name="addprojectmember"><span></span></label> \
                   <select class="field" name="authority">\
                   <option value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE + '">' + Resource.getMessage('policy_manage') + '</option>\
                   <option value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_SEND + '">' + Resource.getMessage('policy_send') + '</option>\
                   <option value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_VIEW + '">' + Resource.getMessage('policy_view') + '</option>\
                   </select> </label></li>';

                let query = $(memberHtml);
                let content = _self._dialogInnerElement.find('.select_list').append(query);
                query.find('.ico_user').append(avatar);
                query.find("input:checkbox").val(person.getJid());

                if (_self.allAuthLists.hasOwnProperty(_account)){
                    let _his_action = _self.allAuthLists[_account];
                    query.find('select.field option[value="'+_his_action+'"]').prop('selected',true);
                } else {
                    query.find('select.field option[value="' + AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_SEND + '"]').prop('selected',true);
                }

                if (0 <= _self.memberList._array.map(m => m.jid).indexOf(person.getJid())){
                    query.find("input:checkbox").prop("checked",true);
                }

                let memberJids = _self.projectMembers.map(m => m.getJid());
                if(-1 === memberJids.indexOf(person.getJid())){
                    query.find('input[name=addprojectmember]').off('change');
                    query.find('input[name=addprojectmember]').on('change', function() {
                        let jid = this.value;
                        let checkedMember = _self.displayMembers.filter(m => m.getJid() === jid)[0];
                        let action = query.find('select.field[name=authority]').val();
                        if(this.checked){
                            _self.memberList.add({jid:this.value, action:action, accountName:checkedMember._profile._loginAccount});
                        }else{
                            _self.memberList._array.forEach((x, i) => {
                                if(x.jid === jid) _self.memberList.remove(i);
                            });
                        }
                        let cnt = _self.memberList.getCount();
                        _self._dialogInnerElement.find('.checkedCnt').text(cnt);
                    });
                    query.find('select.field[name=authority]').off('change');
                    query.find('select.field[name=authority]').on('change', function() {
                        let action = this.value;
                        let jid = query.find('input[name=addprojectmember]').val();
                        _self.memberList._array.filter(m => m.jid === jid).forEach(m => m.action = action);
                    });
                }else{
                    query.find('input[name=addprojectmember]').prop("disabled", true);
                    query.find('input[name=addprojectmember]').attr('name', '');
                    query.find('.field').prop("disabled", true);
                }
            }
        });
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

    _proto.getCommunityMemberList = function(_communityId){
        return new Promise((resolve, reject) => {
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

    _proto.getPersonData = function(memberList){
        return new Promise((resolve, reject) => {
            function callback(result){
                resolve(result);
            }
            CubeeController.getInstance().getPersonDataByJidFromServer(memberList, callback);
        })
    }

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

        var updateAuthorityList = {
            [actionList[0]]:[],
            [actionList[1]]:[],
            [actionList[2]]:[]
        };

        var addMemberList = new ArrayList();
        for ( var i=0; i<memberList.getCount(); i++ ){
            addMemberList.add(memberList.get(i).jid);
        }

        function validation(communityMemberList, personList){
            for(var member of communityMemberList){
                for(var i=0; i<addMemberList.getCount(); i++){
                    if(member.getJid() == addMemberList.get(i)){
                        addMemberList.remove(i);
                    }
                    if(personList.getByKey(addMemberList.get(i)) == null){
                        addMemberList.remove(i);
                    }
                }
            }
        }

        var _rootElement = _self._dialogInnerElement;
        _rootElement.find('.btn_wrapper').find("button").eq(0).attr("disabled", true);
        _rootElement.find("#dialog-error").text("");
        loadingIconOnDialog();

        Promise.all([
            _self.getCommunityMemberList(_communityId),
            _self.getPersonData(addMemberList)
        ]).then(function(result){
            validation(result[0], result[1]);
            if(addMemberList.getCount() == 0){
                _self.cleanup();
                return;
            }
            for(var j = 0; j<addMemberList.getCount(); j++){
                for ( var i = 0; i<memberList.getCount(); i++ ){
                    var member = memberList.get(i);
                    if(member.jid == addMemberList.get(j)){
                        updateAuthorityList[member.action].push(member.accountName);
                    }
                }
            }
            CubeeController.getInstance().addCommunityMember(_communityId, addMemberList, _onAddCommunityMemberCallback);
        }).catch(function(err){
            errOnDialog(Resource.getMessage('add_member_err_submit'));
        })

        function _onAddCommunityMemberCallback(addedMemberList){
            if(addedMemberList.hasOwnProperty('content')){
                if(addedMemberList.content.reason == 403000){
                    errOnDialog(Resource.getMessage('authority_err'));
                }else{
                    errOnDialog(Resource.getMessage('add_member_err_submit'));
                }
                return;
            }
            if(updateAuthorityList.manageCommunity.length != 0){
                getCommunityOwnerList(_communityId)
                .then(function(result){
                    var ownerList = new ArrayList;
                    for (var owner of result ){
                        ownerList.add(owner.getJid());
                    }
                    for(var i=0; i< memberList.getCount(); i++){
                        member = memberList.get(i);
                        if(member.action == AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE &&
                          updateAuthorityList[AuthorityDef.AUTHORITY_ACTIONS.COMMUNITY_MANAGE].includes(member.accountName)){
                            ownerList.add(member.jid);
                        }
                    }
                    CubeeController.getInstance().updateCommunityOwner(_communityId, ownerList, _onUpdateCommunityOwnerCallback);
                })
            }else{
              _onUpdateCommunityOwnerCallback('changedOwnerList')
            }
        }

        function _onUpdateCommunityOwnerCallback(changedOwnerList){
            if(changedOwnerList.hasOwnProperty('content')){
                if(changedOwnerList.content.reason == 403000){
                    errOnDialog(Resource.getMessage('authority_err_on_add_member'));
                }else{
                    errOnDialog(Resource.getMessage('add_member_err_authority_change'));
                }
                return;
            }
            var _promises = [];
            for ( var i of actionList){
                if(updateAuthorityList[i].length != 0){
                    _promises.push(
                        CubeeController.getInstance().assignPolicyToUser(
                            Utils.getPolicyIdByActionAndResource(i, _communityId),
                            updateAuthorityList[i])
                    );
                }
            }
            Promise.all(_promises)
            .then(function(result){
              let dialog = new CommunityDetailsView();
              dialog.init(_communityId);
              new Promise(resolve => {
                setTimeout(() => {
                  resolve(dialog.setCommunityDetailData(_communityId))
                }, 3000)
              });

              _self.cleanup();

            }).catch(function(err){
                if(err.content.reason == 403000){
                    errOnDialog(Resource.getMessage('authority_err_on_add_member'));
                }else if(err.content.reason == 404000){
                    errOnDialog(err.content.error_users + Resource.getMessage('not_assign_account_type_err'));
                }else{
                    errOnDialog(Resource.getMessage('add_member_err_authority_change'));
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

    function getCommunityOwnerList(_communityId){
        return new Promise((resolve, reject) => {
            function callback(communityInfo){
                if(communityInfo == null){

                }
                var _personsArray = new Array();
                var _ownerList = communityInfo.getOwnerList();
                var _ownerCount = _ownerList.getCount();
                for(var _i = 0; _i < _ownerCount; _i++) {
                    var _ownerPerson = _ownerList.get(_i);
                    _personsArray.push(_ownerPerson);
                }
                resolve(_personsArray);
            }
             CubeeController.getInstance().getCommunityMemberInfo(_communityId, callback);
        })
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
    }
})();
