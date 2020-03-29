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
function DialogSelectCommunityConfirmAuthorityMemberView(communityId) {
    var _self = this;
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._communityId = communityId;
    DialogOkCancelView.call(this);
};(function() {
    DialogSelectCommunityConfirmAuthorityMemberView.prototype = $.extend({}, DialogSelectCommunityMemberView.prototype);
    var _super = DialogSelectCommunityMemberView.prototype;
    var _proto = DialogSelectCommunityConfirmAuthorityMemberView.prototype;

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
            _self.cleanup();
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
            <p>'+Resource.getMessage('conf_confirm_authority_tooltip')+'</p>\
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
            let content = _self._dialogInnerElement.find('.select_list').append(query);
            query.find('.ico_user').append(avatar);
            query.find(".group").text("@"+_account).html();

            if (authList.hasOwnProperty(_account)){
                let _his_action = authList[_account];
                query.find('select.field option[value="'+_his_action+'"]').prop('selected',true);
                query.find('select.field').attr("disabled", "disabled");
            }
        });
    }

    _proto.getCommunityMemberList = function(_communityId){
        return new Promise(function(resolve, reject) {
            function callback(communityInfo){
                if(communityInfo == null){

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

    _proto.submit = function(dialogObj) {
        _self.cleanup();
    };

    _proto.cleanup = function() {
        ViewUtils.modal_allexit();
    };

})();
