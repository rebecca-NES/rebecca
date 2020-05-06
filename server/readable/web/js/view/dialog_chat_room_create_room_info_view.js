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
function DialogChatRoomCreateRoomInfoView(title, memberList, callback) {
  this._dialogAreaElement = $('#modal_area');
  this._dialogInnerElement = null;
  DialogSettingView.call(this, title);
};(function() {
    DialogChatRoomCreateRoomInfoView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogChatRoomCreateRoomInfoView.prototype;

    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);

        _self.frame = _self.getInnerHtml();

        _self.selectUserListView = new SelectUserListView();
        _self.selectUserListView.init({
            hasAuthority: true,
            loginUserInfo: LoginUser.getInstance(),
            excludedList: []
        });

        if(TabManager.getInstance().isActiveMyWorkplace()){
            _self.frame.find('.modal_list').append(_self.selectUserListView.getInitialView());
        }else{
            _self.frame.find('.modal_list').append(_self.selectUserListView.getInitialGroupView($('.project_btn').attr('data_value')));
        }

        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);
        if(!TabManager.getInstance().isActiveMyWorkplace()){
            _self.frame.find('.scroll_content').on('scroll', function() {
                if($(this).get(0).scrollHeight === $(this).scrollTop() + $(this).get(0).clientHeight){
                    if(_self.frame.find(".select_list").children("li").size() >= _self.selectUserListView.allPersons.length){
                        _self.frame.find('.scroll_content').off();
                        return;
                    }
                    _self.selectUserListView.addPersons();
                }
            });
        }
        _self._createEventHandler();

        var _defaultVal = Utils.getDate(Utils.DISPLAY_STANDARD_DATE_FORMAT);
        _defaultVal += ' ' + Resource.getMessage('default_group_chat_suffix');;
        var _roomNameInputElement = _self.frame.find('input#room_name');
        _roomNameInputElement.val(_defaultVal);


        _self._callback = function(){
            _self.cleanup();
            ViewUtils.modal_allexit();
        };
    };

    _proto.cleanup = function() {
        var _self = this;
        if (_self.ps) {
            _self.ps.destroy();
        }
        _self.selectUserListView.cleanUp();
        _self.selectUserListView = null;
        _self._dialogAreaElement = null;
        _self._dialogInnerElement = null;
        _self.frame = null;
    }

    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = '';
        _ret += '<div id="addgroup_modal" class="card modal_card">';
        _ret += '<div class="card_title">';
        _ret += '<p>' + Resource.getMessage('dialog_title_create_groupchat') + '</p>';
        _ret += '</div>';
        _ret += '<div class="modal_content_wrapper pt10 pb5">';
        _ret += '<div class="modal_content mb10">';
        _ret += '<p class="modal_title">' + Resource.getMessage('group_chat_start_label_title') + '</p>';
        _ret += '<input type="text" maxlength="50" class="field ui-corner-all" id="room_name" value="">';
        _ret += '</div>';
        _ret += '<div class="modal_content mb0">';
        _ret += '<p class="notes">' + Resource.getMessage('dialog_note_1_create_groupchat')+ '</p>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<div class="list_wrapper">';
        _ret += '<ul class="modal_list select_content">';
        _ret += '</ul>';
        _ret += '</div>';

        _ret += '<div class="" style="height: 60px"></div>';
        _ret += '<div class="btn_wrapper">';
        _ret += '<p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += ' <button id="more_button" type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('button_create') +'</span></button>';
        _ret += '</div>';
        _ret += '<a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return $(_ret);
    };

    _proto._createEventHandler = function() {
        var _self = this;
        _self.frame.find("#more_button").on('click', function(){
            _self._createRoomInfoExecute();
        })
    }

    _proto._createRoomInfoExecute = function() {
        var _self = this;
        var _rootElement = _self.frame;

        if (!_self._isValidationOk()) {
            return false;
        }
        loadingIconOnDialog();
        var _chatroomInfo = _self._setCreateChatRoomInfo();
        CubeeController.getInstance().createChatRoom(_chatroomInfo, _onCreateRoomInfoCallBack);

        function _onCreateRoomInfoCallBack(result){
            var retryCount = 10;
            if (result.errorCode == 0 && result.content != null && result.content.result == true) {
                var roomId = result.content.items[0].roomId;
                CubeeController.getInstance().getChatroomManager().addCreatingRoomIdList(roomId, {[roomId]:true});
                _rootElement.dialog("close");
                _self._callback();
                setTimeout(_wait_for_created, 1000);
            }else{
                if(result.content.reason == 403000){
                    errOnDialog(Resource.getMessage('authority_err'));
                }else if(result.content.reason == 404000){
                    errOnDialog(result.content.error_users + Resource.getMessage('not_assign_account_type_err'));
                }else{
                    errOnDialog(Resource.getMessage('groupchat_community_err'));
                }
                if(result.content.hasOwnProperty('deleted')){
                    var roomId = result.content.roomId;
                    CubeeController.getInstance().getChatroomManager().addCreatingRoomIdList(roomId, {[roomId]:false});
                    setTimeout(_wait_for_created, 1000);
                }
                return;
            }
            function _wait_for_created() {
                var notification1 = CubeeController.getInstance().getChatroomManager().hasCreatingRoomIdList(roomId+'notification1');
                var notification2 = CubeeController.getInstance().getChatroomManager().hasCreatingRoomIdList(roomId+'notification2');
                if ( ( notification1 != null && notification2 != null ) || retryCount == 0){
                    CubeeController.getInstance().getChatroomManager().delCreatingRoomIdList(roomId);
                    CubeeController.getInstance().getChatroomManager().delCreatingRoomIdList(roomId+'notification1');
                    CubeeController.getInstance().getChatroomManager().delCreatingRoomIdList(roomId+'notification2');
                }else{
                    --retryCount;
                    setTimeout(_wait_for_created, 1000)
                }
            }
        }

        function errOnDialog(errMessage){
            var _errElement = _rootElement.find("#dialog-error");
            _errElement.text(errMessage);
            _rootElement.parent().find("button").eq(0).attr("disabled", false);
            _rootElement.parent().find("button").eq(1).attr("disabled", false);
            $(".ui-dialog-titlebar-close").show();
        }

        function loadingIconOnDialog(){
            _rootElement.parent().find("button").eq(0).attr("disabled", true);
            _rootElement.parent().find("button").eq(1).attr("disabled", true);
            $(".ui-dialog-titlebar-close").hide();
            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
            ViewUtils.showLoadingTopInChild($('#dialog-error'));
        }
    };

    _proto._setCreateChatRoomInfo = function() {
        var _self = this;
        var _chatroomInfo = new ChatRoomInformation();
        var _rootElement = _self._dialogInnerElement;

        var _loginUserJid = LoginUser.getInstance().getJid();
        var _loginUserName = LoginUser.getInstance().getLoginAccount();
        var _projectId = $('.project_btn').attr('data_value');
        if(TabManager.getInstance().isActiveMyWorkplace()){
            _projectId = '';
        }
        _chatroomInfo.setParentRoomId(_projectId);  
        var _chatRoomNameInputElem = _rootElement.find('input#room_name');
        _chatroomInfo.setRoomName(Utils.excludeControleCharacters(_chatRoomNameInputElem.val()));

        var _selectedPersonList = _self.selectUserListView.getSelectedUserList();
        var _selectedCount = _selectedPersonList.length; 
        for (var _i = 0; _i < _selectedCount; _i++) {
            var _person = _selectedPersonList[_i]; 
            var _jid = _person.jid; 
            var _accountName = _person.accountName; 
            var _selectedAction = _person.authority;
            _chatroomInfo.addMemberList(_jid, _selectedAction, _accountName);
        }
        _chatroomInfo.addMemberList(_loginUserJid, AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE, _loginUserName);
        _chatroomInfo.setCreatedBy(_loginUserJid);

        return _chatroomInfo;
    };

    _proto._isValidationOk = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _ret = true;
        if (!_rootElement || typeof _rootElement != 'object') {
            _ret = false;
            return _ret;
        }
        var _chatRoomNameInputElem = _rootElement.find('input#room_name');
        var _roomName = _chatRoomNameInputElem.val();

        _rootElement.find("#dialog-error").text('');
        _chatRoomNameInputElem.removeClass('input-error');

        if (_roomName == '' || Utils.trimStringMulutiByteSpace(_roomName) == '') {
            _chatRoomNameInputElem.addClass('input-error');
            _rootElement.find("#dialog-error").text(Resource.getMessage('group_chat_error_room_name'));
            _ret = false;
        }
        return _ret;
    };

    $(function() {
        var showChatList = $('#left_sidebar').find('.groupchat_list .list_ttl a');
        showChatList.on('click', function(){
            var dialog = new DialogChatRoomCreateRoomInfoView();
            dialog.showDialog();
        });
    });
})();
