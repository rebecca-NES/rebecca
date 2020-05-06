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

function SelectUserListView() {
  this.selector_searchinput = "#txtSearchGroupUser";
  this.selector_list = ".modal_list.select_list";
  this.allPersons = [];
  this.countPmember = 0;

};(function() {
    var _proto = SelectUserListView.prototype;

    _proto.init = function(opts) {
        var _self = this;
        _self.hasAuthority = opts.hasAuthority ? opts.hasAuthority : false;
        _self.loginUserInfo = opts.loginUserInfo;
        _self.selectedUserList = [];
        _self.excludedList = opts.excludedList ? opts.excludedList : [];
        return _self;
    };

    _proto.getSelectedUserList = function() {
        return this.selectedUserList;
    }

    _proto.getInitialView = function(opts) {
        var _self = this;

        _self.createFrame();
        if(opts && !opts.showDefault) {
            return _self.frame;
        }

        _self.getInitialUserList();

        _self._createEventHandler();

        return _self.frame;
    }
    _proto.getInitialGroupView = function(communityid, opts) {
        var _self = this;
        _self.createFrame();
        if(opts && !opts.showDefault) {
            return _self.frame;
        }
        _self.getCommunityMemberList(communityid).then(function(persons){
            $.each(persons, function(i, person){
                if(person._profile._loginAccount != _self.loginUserInfo.getLoginAccount()){
                    _self.allPersons.push(person);
                }
            });
            _self.frame.find(_self.selector_list).find("input[type='checkbox']").off();
            _self.frame.find(_self.selector_list).find("select").off();
            _self.frame.find(_self.selector_list).empty();
            _self.addPersons();
        });
        return _self.frame;
    };
    _proto.addPersons = function(){
        var _self = this;
        var _maxPerson = _self.countPmember + Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST');
        var _minPerson = _self.countPmember;
        var member = "";
        var i;
        if(_maxPerson > _self.allPersons.length){
            _maxPerson = _self.allPersons.length;
        }
        for(i=_minPerson; i<_maxPerson; i++){
            member = _self.allPersons[i];
            _self.countPmember++;
            let _nickName = Utils.getSafeStringData(member._profile._nickName);
            _nickName = Utils.convertEscapedHtml(_nickName);                 
            let _avatarType = member._profile._avatarType;
            let _avaterDate = member._profile._avatarData;
            let _account = "@" + member._profile._loginAccount;       
            let avatar = "";                                        
            if (_avatarType == null || _avatarType == '' || _avaterDate == null || _avaterDate == '') {
                avatar = '<div id="avatar">';
                avatar += '<span class="ico ico_user">' + ViewUtils.getDefaultAvatarHtml(member) + '</span>';
                avatar += '</div>';
            } else {
                let _avatarSrc = ViewUtils.getAvatarUrl(member);
                avatar = '<img src="' + _avatarSrc + '" alt="">';
            }
            let _selectedJid = member.getJid();
            let selectHtml = '<label class="checkbox"><input type="checkbox" name="select_user" value="' + _selectedJid + '"><span></span></label>';
            if (_self.hasAuthority) {
                selectHtml += '<select class="field" name="groupchat_authority" id="auth_list_' + member._profile._loginAccount + '">';
                selectHtml += '  <option value="' + AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE + '">' + Resource.getMessage('policy_manage') + '</option>';
                selectHtml += '  <option selected value="' + AuthorityDef.AUTHORITY_ACTIONS.GC_SEND + '">' + Resource.getMessage('policy_send') + '</option>';
                selectHtml += '  <option value="' + AuthorityDef.AUTHORITY_ACTIONS.GC_VIEW + '">' + Resource.getMessage('policy_view') + '</option>';
                selectHtml += '</select></span>';
            }
            let _memberHtml = '<li><label title="' + _nickName + '  ' + Utils.convertEscapedTag(_account) + '"><span class="ico ico_user">' + avatar + '</span>';
            _memberHtml += '<span class="name">' + _nickName + '</span>';
            _memberHtml += '<span class="group">' + Utils.convertEscapedTag(_account) + '</span>' + selectHtml;
            _memberHtml += '</label></li>';
            _self.frame.find(_self.selector_list).append(_memberHtml);
        };
        _self.applySelectedInfoToView();
        _self.applyExcludedList();
        _self._createEventHandler();
    };

    _proto.createFrame = function() {
        var _self = this;
        var selectUserListViewFrame = _self.getFrameHtml();
        _self.frame = $(selectUserListViewFrame);
    };

    _proto.getFrameHtml = function() {
        var _self = this;
        var _ret = "";
        _ret += '<div class="select_menu">';
        _ret += '<span class="select_number"><i class="fa fa-user"></i><span id="seletedUserNum">0</span></span>';
        _ret += '<div class="search_form">';
        _ret += '<input type="text" id="txtSearchGroupUser" name="q" class="field" placeholder="' + Resource.getMessage('wizard_chatlist_conditions') + '">';
        _ret += '<button type="submit" name="search" class="user_search_btn ico_btn"><i class="fa fa-search"></i></button>';
        _ret += '</div>';
        _ret += '<label class="modal_btn all_check">' + Resource.getMessage('wizard_chatlist_allcheck') + '<label class="checkbox"><input type="checkbox"><span></span></label></label>';
        _ret += '</div>';
        _ret += '<div class="list_wrapper scroll_content">';
        _ret += '<ul class="modal_list select_list">';
        _ret += '</ul>';
        _ret += '</div>';
        return _ret;
    }

    _proto.getCommunityMemberList = function(_communityId){
        return new Promise(function(resolve, reject){
            function callback(communityInfo){
                if (!communityInfo) {
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
                    _ownerPerson._role = 2;
                    _personsArray.push(_ownerPerson);
                }
                for(var _i = 0; _i < _generalMemberCount; _i++) {
                    var _generalPerson = _generalMemberList.get(_i);
                    _generalPerson._role = 1;
                    _personsArray.push(_generalPerson);
                }
                resolve(_personsArray);
            }
            CubeeController.getInstance().getCommunityMemberInfo(_communityId, callback);
        })
    }

    _proto.searchExecute = function() {
        var _self = this;
        var _inputKeyword = _self.frame.find(_self.selector_searchinput).attr('value');

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
        var _searchResultPersonList = new SearchResultPersonList();
        _self.searchUser(0, _columnSearchCondition, _searchResultPersonList);
    }

    _proto.searchUser = function(_startId, _condition, _searchResultPersonList) {
        var _self = this;

        function onChatListCallback(userList) {

            var listCount = userList.getCount();

            for(let i = 0 ; i < listCount ; i++){
                var _person = userList.get(i);
                _searchResultPersonList.add(_person);
            }

            if (listCount < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')) {

                _self.frame.find(_self.selector_list).find("input[type='checkbox']").off();
                _self.frame.find(_self.selector_list).find("select").off();
                _self.frame.find(_self.selector_list).empty();
                _self.setUserListHtml(_searchResultPersonList);
                _self.applySelectedInfoToView();
                _self.applyExcludedList();
                dlg_scr.forEach(function (value) {
                    value.update();
                });
                _self._createEventHandler();

            }else{
                _self.searchUser(userList.get(listCount-1).getId(),_condition, _searchResultPersonList);
            }
        }

        return CubeeController.getInstance().searchPerson(_startId, Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST'), _condition, onChatListCallback);
    };

    _proto._createEventHandler = function(){
        var _self = this;

        _self.frame.find('.search_form').off('keypress').on('keypress', function(e) {
            if(_self.allPersons != null){
                $("#modal_area").find(".scroll_content").off();
                _self.allPersons = null;
                _self.countPmember = null;
            }
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                _self.searchExecute();
            }
        });
        _self.frame.find('.search_form button').off('click').on('click', function() {
            _self.searchExecute();
        });

        var rowSelector = 'input[type="checkbox"]input[name="select_user"]';
        _self.frame.off('change').on('change', rowSelector, function (e) {
            _self.changeSelectedUserInfo($(this));
            _self.frame.find('#seletedUserNum').text(_self.selectedUserList.length);
        });
        var allSelector = '.all_check .checkbox input[type="checkbox"]';
        _self.frame.on('change', allSelector, function (e) {
            var allRows = _self.frame.find(rowSelector + ':not(:disabled)');
            if ($(this).prop('checked')) {
                allRows.prop('checked', true);
            } else {
                allRows.prop('checked', false);
            }
            for (var i=0; i<allRows.length; i++) {
                _self.changeSelectedUserInfo(allRows.eq(i));
            }

            _self.frame.find('#seletedUserNum').text(_self.selectedUserList.length);
        });

        _self.frame.on('change', 'select[name="groupchat_authority"]', function (e) {
            _self.changeSelectedAuthority($(this));
        });
    };

    _proto.changeSelectedUserInfo = function(target) {
        var _self = this;
        var len = _self.selectedUserList.length;
        if (target.prop('checked')) {
            for (var i=0; i<len;i++) {
                if (_self.selectedUserList[i].jid == target.val()) {
                    return _self.selectedUserList;
                }
            }
            var newData = {jid: target.val()};
            if (_self.hasAuthority) {
                var authElem = target.parent().parent().find('select[name="groupchat_authority"]');
                newData.authority = authElem.val();
                newData.accountName = authElem.prop("id").slice("auth_list_".length);
            }
            _self.selectedUserList.push(newData);
        } else {
            for (var i=0; i<len;i++) {
                if (_self.selectedUserList[i].jid == target.val()) {
                    _self.selectedUserList.splice(i, 1);
                    break;
                }
            }
        }
        return _self.selectedUserList;
    }

    _proto.applySelectedInfoToView = function() {
        var _self = this;
        var len = _self.selectedUserList.length;
        for (var i=0; i<len; i++) {
            var jid = _self.selectedUserList[i].jid;
            var target = _self.frame.find('input[type="checkbox"]input[value="' + jid + '"]');
            if (target.length > 0) {
                target.prop('checked', true);
                if (_self.hasAuthority) {
                    var authVal = _self.selectedUserList[i].authority;
                    target.parent().parent().find('select[name="groupchat_authority"]').val(authVal);
                }
            }
        }
    }

    _proto.applyExcludedList = function() {
      var _self = this;
      var len = _self.excludedList.length;
      for (var i=0; i<len; i++) {
          var jid = _self.excludedList[i];
          var target = _self.frame.find('input[type="checkbox"]input[value="' + jid + '"]');
          if (target.length > 0) {
              target.prop('disabled', true);
          }
      }
    }

    _proto.changeSelectedAuthority = function(target) {
        var _self = this;
        var jid = target.parent().find('input[type="checkbox"]input[name="select_user"]').val();
        var len = _self.selectedUserList.length;
        for (var i=0; i<len; i++) {
            if (jid == _self.selectedUserList[i].jid) {
                _self.selectedUserList[i].authority = target.val();
            }
        }
    }

    _proto.getInitialUserList = function() {
        var _self = this;
        var groups = Utils.getSafeArrayData(_self.loginUserInfo.getGroup());
        var group = groups.length > 0 ? groups[0] : '';

        _self.frame.find(_self.selector_searchinput).val(group);

        _self.searchExecute();
    }

    _proto.setUserListHtml = function(userList) {
        var _self = this;
        var userCount = userList.getCount();
        var _loginUserJid = _self.loginUserInfo.getJid();
        var _ret = '';

        for (var _i = 0; _i < userCount; _i++) {
             var _person = userList.get(_i);

             if(_loginUserJid == _person.getJid()) {
               continue;
             }

            var _nickName = Utils.getSafeStringData(_person.getUserName());
            _nickName = Utils.convertEscapedHtml(_nickName);
            var _avatarType = _person.getAvatarType();
            var _avaterDate = _person.getAvatarData();
            var _groups = Utils.getSafeArrayData(_person.getGroup());
            var _group = _groups.length > 0 ? _groups[0] : Resource.getMessage('group_title_no_group');

            _ret += '<li><label title="' + _nickName + '  ' + Utils.convertEscapedHtml(_group) +' "> <span class="ico ico_user">';
            if (_avatarType == null || _avatarType == '' || _avaterDate == null || _avaterDate == '') {
                _ret += '<div id="avatar">';
                _ret += '<span class="ico ico_user">' + ViewUtils.getDefaultAvatarHtml(_person) + '</span>';
                _ret += '</div>';
            } else {
                var _avatarSrc = ViewUtils.getAvatarUrl(_person);
                _ret += '<img src="' + _avatarSrc + '" alt="">';
            }

            _ret += '</span> <span class="name">' + _nickName + '</span> <span class="group">' + Utils.convertEscapedHtml(_group) + '</span> <label class="checkbox"><input type="checkbox" name="select_user" value="' + _person.getJid() + '"><span></span></label>';

            if (_self.hasAuthority) {
                _ret += '<select class="field" name="groupchat_authority" id="auth_list_'　+ _person.getLoginAccount() +　'">';
                _ret += '  <option value="' + AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE + '">' + Resource.getMessage('policy_manage') + '</option>';
                _ret += '  <option selected value="' + AuthorityDef.AUTHORITY_ACTIONS.GC_SEND + '">' + Resource.getMessage('policy_send') + '</option>';
                _ret += '  <option value="' + AuthorityDef.AUTHORITY_ACTIONS.GC_VIEW + '">' + Resource.getMessage('policy_view') + '</option>';
                _ret += '</select></span>';
            }
            _ret += '</label></li>';
        }
        _self.frame.find(_self.selector_list).append(_ret);
    };

    _proto.cleanUp = function() {
        var _self = this;
        _self.frame.find('*').off();
        _self.selector_searchinput = null;
        _self.selector_list = null;
        _self.hasAuthority = null;
        _self.loginUserInfo = null;
        _self.selectedUserList = null;
        _self.excludedList = null;
        _self.frame = null;
        _self.allPersons = null;
        _self.countPmember = null;
    };
})();
