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
function DialogMenthionCommunityPersonList(communityId, baseMessage, doneFunction) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._communityId = communityId;
    this._baseMessage = baseMessage;
    this.doneFunction = doneFunction;
    DialogOkCancelView.call(this);
};(function() {
    DialogMenthionCommunityPersonList.prototype = $.extend({}, DialogSelectCommunityMemberView.prototype);
    var _super = DialogSelectCommunityMemberView.prototype;
    var _proto = DialogMenthionCommunityPersonList.prototype;

    _proto._init = function() {
        var _self = this;

        _self.allMembers = [];

        _self.frame = _self.getHtml();

        _proto.getCommunityMemberList(_self._communityId).then(function(persons){
            _self.allMembers = persons;
            _self.allPersons = persons;
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
            _self._dialogInnerElement.find('input[name=mentionmember]').prop('checked', this.checked);
            var _jids = _self._dialogInnerElement.find('input[name=mentionmember]');
            if(this.checked){
                for( var i = 0; i < _jids.length; i++){
                    if(0 === _self.memberList._array.filter((m) =>{ m === _jids[i].attr("uid");}).length){
                        _self.memberList.add(_jids[i].attr("uid"));
                    }
                }
            }else{
                for( var i = 0; i < _jids.length; i++){
                    _self.memberList.remove(_self.memberList._array.indexOf(_jids[i].attr("uid")));
                }
            }
            let cnt = _self.memberList.getCount();
            _self._dialogInnerElement.find('.checkedCnt').text(cnt);
        });
        let cnt = _self.memberList.getCount();
        _self._dialogInnerElement.find('.checkedCnt').text(cnt);
    };

    _proto.getHtml = function(){
        const ret = '<div id="mentionmember_modal" class="card modal_card">\
          <div class="card_title">\
            <p>'+Resource.getMessage('menthion_community_person_list_dialog_title')+'</p>\
          </div>\
          <div class="select_menu">\
            <form action="#" method="get" class="search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('wizard_chatlist_conditions_account')+'">\
              <button type="button" name="search" class="user_search_btn ico_btn"><i class="fa fa-search"></i></button>\
            </form>\
          </div>\
          <div class="list_wrapper scroll_content">\
            <ul class="modal_list select_list"></ul>\
          </div>\
          <div class="btn_wrapper">\
            <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
            <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('menthion_button_force_selected')+'</span></button>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

    _proto.searchExecute = function() {
        var _self = this;
        var _inputKeyword = _self.frame.find('.field').val();

        var _searchKeyword = Utils.trimStringMulutiByteSpace(_inputKeyword);
        if(!_searchKeyword || _searchKeyword == ""){
            return;
        }

        var condition = ViewUtils.getKeywordFilterFromKeywordInputString(_searchKeyword, false);
        if (!condition || typeof condition != 'object') {
            return;
        }

        _self._dialogInnerElement.find('input[name=allcheck]').prop('checked', false);

        if(0 < _self.allMembers.length){
            _self.filterMembers();
            return;
        }

        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("login_account");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_ASC);
        var _filterCondition = condition;
        var _columnSearchCondition = new ColumnSearchCondition(_filterCondition, _sortCondition);
        var startId = 0;
        var _count = Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST');

        return CubeeController.getInstance().searchPerson(
            startId,
            _count,
            _columnSearchCondition,
            function(userList) {
                _self.frame.find(_self.selector_list).empty();
                _self.setUserListHtml(userList);
                _self.applySelectedInfoToView();
                _self.applyExcludedList();
            }
        );
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
                   <input type="checkbox" name="mentionmember" uid="' + _profile._loginAccount + '"><span></span></label> \
                   </label></li>';

                let query = $(memberHtml);
                // Unused variable content.
                // let content = _self._dialogInnerElement.find('.select_list').append(query);
                query.find('.ico_user').append(avatar);
                query.find(".group").text(_account).html();
                query.find("input:checkbox").val(person._jid);

                if (0 <= _self.memberList._array.indexOf(_profile._loginAccount)){
                    query.find("input:checkbox").attr("disabled",true);
                }else if(0 <= _self._baseMessage.indexOf(_account)){
                    query.find("input:checkbox").attr("disabled",true);
                    _self.memberList.add(_profile._loginAccount);
                }
                query.find('input[name=mentionmember]').off('change');
                query.find('input[name=mentionmember]').on('change', function() {
                  let jid = $(this).attr("uid");
                  if(this.checked){
                      _self.memberList.add($(this).attr("uid"));
                  }else{
                      _self.memberList._array.forEach((x, i) => {
                          if(x === jid) _self.memberList.remove(i);
                      });
                  }
                  let cnt = _self.memberList.getCount();
                  _self._dialogInnerElement.find('.checkedCnt').text(cnt);
                });
                let cnt = _self.memberList.getCount();
                _self._dialogInnerElement.find('.checkedCnt').text(cnt);
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

    _proto._request = function(memberList) {
        var _self = this;
        if(memberList == null || typeof memberList != 'object'){
            return;
        }
        if(_self.doneFunction == null || typeof _self.doneFunction != 'function'){
            return;
        }
        let mentions = [];
        for(let j=0;j<memberList.getCount();j++){
            mentions.push("@" + memberList.get(j));
        }
        _self.doneFunction(mentions);
        _self.cleanup();
    };

    _proto._isValidateOk = function(inputAccountArray, personList, onValidateCallBack) {
        var _self = this;
        var _loginUser = LoginUser.getInstance();
        var _loginUserJid = _loginUser.getJid();

        var _memberInfo =_self._validateInputMemberList(inputAccountArray, personList);
        var _memberList = _memberInfo.memberList;

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
