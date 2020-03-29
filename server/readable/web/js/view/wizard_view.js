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
function WizardView() {

    var _searchResultPersonList = null;
    var _selectedUserList = null;
    WizardView.AvaterType = 'user';

};(function() {

    var _wizardView = new WizardView();

    WizardView.getInstance = function() {
        return _wizardView;
    };

    var _proto = WizardView.prototype;

    _proto.showWizard = function(_connectReceiveData) {
       var _self = this;

        _selectedUserList = [];

       ViewUtils.hideLoginLoadingIcon($('#loginErrMsg'));

        var _wizardProfileAreaElement = $('#wizard_profile');
        _wizardProfileAreaElement.html(_self.getProfileInnerHtml(_connectReceiveData));

        var _wizardPassAreaElement = $('#wizard_password');
        _wizardPassAreaElement.html(_self.getPasswordInnerHtml());

        var _wizardChatAreaElement = $('#wizard_chatList');
        _wizardChatAreaElement.html(_self.getChatListInnerHtml());
        $('.wizard_content').find('.select_list').html(createChatList(_connectReceiveData.getContactList()));
        applyExcludedList();

        onScrollbar();

        var _profile = new Profile();

        _self.setEventHandler(_profile);

        setCheckBoxEventHandler();
    };

    _proto.getProfileInnerHtml = function(_connectReceiveData) {
        var _loginUserName = _connectReceiveData.getLoginUserPerson().getUserName();
        _loginUserName = Utils.convertEscapedTag(_loginUserName);

        var _ret = "";
        _ret += '<div class="wizard_img">';
        _ret += '  <img src="images/wizard_img_01.png" alt="">';
        _ret += '</div>';
        _ret += '<div class="wizard_content">';
        _ret += '  <div class="wizard_title">';
        _ret += '    <p>' + Resource.getMessage('wizard_profile_title') + '</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('wizard_profile_nickname_label') + '</p>';
        if (LoginUser.getInstance().isUpdatablePersonData()) {
            _ret += '      <input type="text" maxlength="20" class="field ui-corner-all" id="nick_name" autofocus value="' + _loginUserName + '">';
        } else {
            _ret += '      <input type="text" maxlength="20" class="field ui-corner-all" id="nick_name" autofocus value="' + _loginUserName + '" disabled>';
        }
        _ret += '    </div>';
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('wizard_profile_avater_label') + '</p>';
        _ret += '      <div class="cropped_wrapper">';
        _ret += '        <div id="profile-logo-field">';
        _ret += '          <input type="file" name="logofile" class="avatar_file" size="30" accept="image/jpeg, image/gif, image/png">';
        _ret += '        </div>';
        _ret += '        <div class="img_edit_area">';
        _ret += '          <div class="imageBox imageBox">';
        _ret += '            <div class="thumbBox"></div>';
        _ret += '            <div class="spinner" style="display: none">Loading...</div>';
        _ret += '          </div>';
        _ret += '          <div class="action">';
        _ret += '            <button class="modal_btn zoom_btn" id="btnZoomIn"><i class="fa fa-plus"></i>' + Resource.getMessage('wizard_btn_avater_up') + '</button>';
        _ret += '            <button class="modal_btn zoom_btn" id="btnZoomOut"><i class="fa fa-minus"></i>' + Resource.getMessage('wizard_btn_avater_down') + '</button>';
        _ret += '            <button class="modal_btn success_btn" id="btnCrop">' + Resource.getMessage('wizard_profile_avater_OK') + '</button>';
        _ret += '          </div>';
        _ret += '        </div>';
        _ret += '        <div class="cropped"></div>';
        _ret += '      </div>';
        _ret += '    </div>';
        _ret += '  </div>';
        _ret += '  <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '  <div class="btn_wrapper slide_btn_wrapper cf">';
        _ret += '    <a class="modal_btn success_btn modal_slider_btn" id="wizard_next_password">' + Resource.getMessage('wizard_btn_next') + '</a>';
        _ret += '  </div>';
        _ret += '</div>';
        return _ret;
    };

    _proto.getPasswordInnerHtml = function() {

        var _ret = "";
        _ret += '<div class="wizard_img">';
        _ret += '  <img src="images/wizard_img_02.png" alt="">';
        _ret += '</div>';
        _ret += '<div class="wizard_content">';
        _ret += '  <div class="wizard_title">';
        _ret += '    <p>' + Resource.getMessage('wizard_password_title') + '</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('wizard_password_new_label') + '</p>';
        if (LoginUser.getInstance().isUpdatablePersonData()) {
            _ret += '      <input type="password" id="new_password" class="field ui-corner-all">';
        } else {
            _ret += '      <input type="password" id="new_password" class="field ui-corner-all" disabled>';
        }
        _ret += '    </div>';
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('wizard_password_new_confirm_label') + '</p>';
        if (LoginUser.getInstance().isUpdatablePersonData()) {
            _ret += '      <input type="password" id="new_password_confirm" class="field ui-corner-all"></p>';
        } else {
            _ret += '      <input type="password" id="new_password_confirm" class="field ui-corner-all" disabled></p>';
        }
        _ret += '    </div>';
        _ret += '    <p class="notes">' + Resource.getMessage('wizard_password_not_specified_label') + '<a class="txt_btn modal_slider_btn modal_slider_btn_next">' + Resource.getMessage('wizard_password_skip_label') + '</a>' + Resource.getMessage('wizard_password_not_specified_label_suffix') + '</p>';
        _ret += '  </div>';
        _ret += '  <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '  <div class="btn_wrapper slide_btn_wrapper cf">';
        _ret += '     <a class="modal_btn modal_slider_btn modal_slider_btn_prev" id="wizard_before_profile">' + Resource.getMessage('wizard_btn_before') + '</a>';
        _ret += '     <a class="modal_btn success_btn modal_slider_btn" id="wizard_next_chatlist">' + Resource.getMessage('wizard_btn_next') + '</a>';
        _ret += '  </div>';
        _ret += '</div>';
        return _ret;
    };


    _proto.getChatListInnerHtml = function() {

        var _ret = "";
        _ret += '<div class="wizard_img">';
        _ret += '  <img src="images/wizard_img_03.png" alt="">';
        _ret += '</div>';
        _ret += '<div class="wizard_content">';
        _ret += '  <div class="wizard_title">';
        _ret += '    <p>' + Resource.getMessage('wizard_chatlist_title') + '</p>';
        _ret += '  </div>';
        _ret += '  <div class="select_menu">';
        _ret += '    <span class="select_number"><i class="fa fa-user"></i><span id="number">0</span></span>';
        _ret += '    <div class="search_form">';
        _ret += '      <input type="text" id="search_chatlist" class="field" placeholder="' + Resource.getMessage('wizard_chatlist_conditions') +'">';
        _ret += '      <button type="button" id="search" class="user_search_btn ico_btn"><i class="fa fa-search"></i></button>';
        _ret += '    </div>';
        _ret += '    <label class="modal_btn all_check">' + Resource.getMessage('wizard_chatlist_allcheck') + '<label class="checkbox"><input type="checkbox"><span></span></label></label>';
        _ret += '  </div>';
        _ret += '  <div class="list_wrapper scroll_content">';
        _ret += '    <ul class="modal_list select_list">';
        _ret += '    </ul>';
        _ret += '  </div>';
        _ret += '  <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '  <div class="btn_wrapper slide_btn_wrapper cf">';
        _ret += '    <a class="modal_btn modal_slider_btn modal_slider_btn_prev" id="wizard_before_password">' + Resource.getMessage('wizard_btn_before') + '</a>';
        _ret += '    <a class="modal_btn success_btn modal_slider_btn modal_slider_btn_complete wizard_modal_exit" id="wizard_btn_end">' + Resource.getMessage('wizard_btn_start') + '</a>';
        _ret += '  </div>';
        _ret += '</div>';
        return _ret;
    };

    function createChatList(_resultPersonList) {

        var _personListCount = _resultPersonList.getCount();
        var _loginUserJid = LoginUser.getInstance().getJid()
        var _ret = "";
        for (var _i = 0; _i < _personListCount; _i++) {
            var _person = _resultPersonList.get(_i);
            var listJid = _person.getJid();
            if(_loginUserJid == listJid) {
                continue;
            }

            _ret += '<li><label> <span class="ico ico_user">';

            var _nickName = Utils.getSafeStringData(_person.getUserName());
            _nickName = Utils.convertEscapedHtml(_nickName);
            var _avatarType = _person.getAvatarType();
            var _avaterDate = _person.getAvatarData();
            var _groups = Utils.getSafeArrayData(_person.getGroup());
            var _group = _groups.length > 0 ? _groups[0] : Resource.getMessage('group_title_no_group');
            if (_avatarType == null || _avatarType == '' || _avaterDate == null || _avaterDate == '') {
                _ret += '<div id="avatar">';
                _ret += '<span class="ico ico_user">' + ViewUtils.getDefaultAvatarHtml(_person) + '</span>';
                _ret += '</div>';

            } else {
                var _avatarSrc = ViewUtils.getAvatarUrl(_person);
                _ret += '<img src="' + _avatarSrc + '" alt="">';
            }

            if (_selectedUserList.indexOf(listJid) >= 0){
                _ret += '</span> <span class="name">' + _nickName + '</span> <span class="group">' + Utils.convertEscapedHtml(_group) + '</span> <label class="checkbox"><input type="checkbox" name="wizardlist" value="' + listJid + '" checked="checked"><span></span></label></label></li>';
            }else{
                _ret += '</span> <span class="name">' + _nickName + '</span> <span class="group">' + Utils.convertEscapedHtml(_group) + '</span> <label class="checkbox"><input type="checkbox" name="wizardlist" value="' + listJid + '"><span></span></label></label></li>';
            }
        }
        return _ret;
    }

    function onScrollbar() {
        var ps = new PerfectScrollbar($('.wizard_content').find('.scroll_content')[0], {
          suppressScrollX: true
        });
        dlg_scr.push(ps);
    }

    function wizard_exit() {

       _searchResultPersonList = null;
       _selectedUserList = null;

       TabManager.getInstance().selectOrAddTabByCommunityInfo('myworkplace', null);

       ViewUtils.modal_allexit();

       $('.wizard_overlay').animate({ opacity:0}, 500, function(){
           $(this).remove();
       });
    };

     function modal_slider_move(type, $this) {
      if (type === 'prev') {
        $this.find('.current').removeClass('current').prev().addClass('current');
      } else if (type === 'next') {
        $this.find('.current').removeClass('current').next().addClass('current');

      }
      var current_i = $this.find('.current').index();
      var slide_w = $this.width();
      $this.children('.modal_slide_wrapper').css( 'transform', 'translateX(' + current_i * - slide_w + 'px)' );
    };

    function setCheckBoxEventHandler() {

        var rowSelector = 'input[type="checkbox"]input[name="wizardlist"]';
        $('.wizard_content .list_wrapper').off('change').on('change', rowSelector, function (e) {
            changeSelectedUserInfo($(this));
            $('#number').text(_selectedUserList.length);
        });
    }

    _proto.setEventHandler = function(_profile) {

        $('#wizard_next_password').on('click', function(){
            var _self = this;
            var _rootElement = $('#wizard_profile');
            var _nickNameElement = _rootElement.find('#nick_name');
            var _nickName = _nickNameElement.val();
            _profile.setNickName(_nickName);

            if (Utils.trimStringMulutiByteSpace(_nickName).length == 0) {
                _rootElement.find("#dialog-error").text(Resource.getMessage('wizard_profile_nickname_empty'));
                return;
            }

            CubeeController.getInstance().changeProfile(_profile, onChangeProfileCallback);

            function onChangeProfileCallback(result) {
                if (!result) {
                    _rootElement.find("#dialog-error").text( Resource.getMessage('wizard_profile_change_failed') );
                    return;
                }else{
                    if (LoginUser.getInstance().isUpdatablePersonData()){
                        modal_slider_move('next', $(_self).parents('.modal_slider'));
                    } else {
                        modal_slider_move('next', $(_self).parents('.modal_slider'));
                        modal_slider_move('next', $(_self).parents('.modal_slider'));
                    }
                }
            };

        });

        $('#wizard_next_chatlist').on('click', function(){
            var _self = this;
            var _rootElement = $('#wizard_password');

            var _newPasswordElement = _rootElement.find('#new_password');
            var _newPasswordConfirmElement = _rootElement.find('#new_password_confirm');
            var _newPassword = Utils.convertEscapedTag(_newPasswordElement.val());
            var _newPasswordConfirm = Utils.convertEscapedTag(_newPasswordConfirmElement.val());

            if (_newPassword == null || _newPassword == '') {
                _rootElement.find("#dialog-error").text(Resource.getMessage('wizard_password_new_must'));
                return;
            } else if (!ViewUtils.checkLength(_newPasswordElement, LoginView.MIN_LENGTH_PASSWORD, LoginView.MAX_LENGTH_PASSWORD)) {
                _rootElement.find("#dialog-error").text(Resource.getMessage('wizard_password_Length1') + LoginView.MIN_LENGTH_PASSWORD + Resource.getMessage('wizard_password_Length2') + LoginView.MAX_LENGTH_PASSWORD + '.');
                return;
            } else if (!ViewUtils.checkRegexp(_newPasswordElement, /([!-~])+$/)) {
                _rootElement.find("#dialog-error").text(Resource.getMessage('wizard_password_Contain'));
                return;
            } else if (_newPassword != _newPasswordConfirm) {
                _rootElement.find("#dialog-error").text(Resource.getMessage('wizard_password_new_confirm_must'));
                return;
            }

            var _loginTicket = LoginTicket.read();
            var _account = LoginTicket.loginTicket2Account(_loginTicket);
            var _oldPassword = _account.pw;

            CubeeController.getInstance().changePassword(_oldPassword, _newPassword, onChangePasswordCallback);

            function onChangePasswordCallback(result, reason) {
                if (result) {
                    LoginTicket.password(_newPassword);
                    modal_slider_move('next', $(_self).parents('.modal_slider'));
                } else {
                    var _errorMessage = Resource.getMessage('config_password_change_failed');
                    if (reason == 8) {
                        _errorMessage = Resource.getMessage('config_current_password_invalid');
                    } else if (reason == 32) {
                        _errorMessage = Resource.getMessage('config_password_complexity');
                    }
                    _rootElement.find("#dialog-error").text(_errorMessage);
                    return;
                }
            };
        });

        $('#wizard_before_profile').on('click', function(){
            modal_slider_move('prev', $(this).parents('.modal_slider'));
        });

        $('.modal_slider_btn_next').on('click', function(){
            modal_slider_move('next', $(this).parents('.modal_slider'));
        });

        $('#wizard_btn_end').on('click', function(){
            var _rootElement = $('#wizard_chatList');
            var checkedJidArray = new ArrayList;
            var count = _selectedUserList.length;
            for(var i = 0; i < count ; i++){
                var _addUser = {
                    jid: _selectedUserList[i],
                    contactListGroup: ''
                };
                checkedJidArray.add(_addUser);
            }
            if(checkedJidArray.getCount() > 0) {
                CubeeController.getInstance().addContactListMember(checkedJidArray,onaddContactListMemberCallback);

                function onaddContactListMemberCallback(result, reason) {
                    if (result && result.addFailureMemberList.getCount() > 0) {
                        $('#wizard_btn_end').prop("disabled", true);
                        var err = Resource.getMessage('wizard_chatList_add_failed');
                        var _reason = reason ? reason : '';
                        _rootElement.find("#dialog-error").text( err + _reason);
                    } else {
                        var currentTab = TabManager.getInstance().selectedInfo;
                        var sidebarParts = currentTab.getSideListViewImpl().sidebarParts;
                        for (var i=0; i<sidebarParts.length; i++) {
                            if (typeof sidebarParts[i].onNotifyAddChatMember == 'function') {
                                sidebarParts[i].onNotifyAddChatMember(result.addSuccessMemberList);
                            }
                        }
                        wizard_exit();
                    }
                };
            }else{
                wizard_exit();
            }
         });

         $('#wizard_before_password').on('click', function(){
             if (LoginUser.getInstance().isUpdatablePersonData()){
                 modal_slider_move('prev', $(this).parents('.modal_slider'));
             } else {
                 modal_slider_move('prev', $(this).parents('.modal_slider'));
                 modal_slider_move('prev', $(this).parents('.modal_slider'));
             }
         });

         $('#search').on('click', function(){
             $('.all_check .checkbox input[type="checkbox"]').prop('checked', false);
             onSearch();
             return;
         });

         $('#search_chatlist').on('keypress', function(e) {
             if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
                 $('.all_check .checkbox input[type="checkbox"]').prop('checked', false);
                 onSearch();
             }
             return;
         });

        var options =
        {
            imageBox: '.imageBox',
            thumbBox: '.thumbBox',
            spinner: '.spinner',
            imgSrc: ''
        }
        var cropper;

        $('.img_edit_area, .cropped').hide();
        $('.avatar_file').click(function () {
            $('#wizard_profile').find("#dialog-error").text('');
            cropper = '';
            $(this).val('');
            $(this).parents('.cropped_wrapper').find('.cropped').hide();
            $(this).parents('.cropped_wrapper').find('.img_edit_area').hide();
            _profile.setAvatarData("");
            _profile.setAvatarType("");
        });

        $('.avatar_file').change(function () {
            var _rootElement = $('#wizard_profile');
            _rootElement.find("#dialog-error").text('');
            if (this.files.length > 0) {
                var item = this.files[0];
                switch (item.type) {
                    case 'image/jpeg':
                    case 'image/gif':
                    case 'image/png':
                    case 'image/bmp':
                    break;
                    default:
                        _rootElement.find("#dialog-error").text( Resource.getMessage('wizard_profile_image_failed') );
                        return;
                }

                reader = new FileReader();
                reader.onload = function (e) {
                    options.imgSrc = e.target.result;
                    cropper = new cropbox(options);
                }
                reader.readAsDataURL(this.files[0]);
                $(this).parents('.cropped_wrapper').find('.cropped').hide();
                $(this).parents('.cropped_wrapper').find('.img_edit_area').fadeIn();
            }
        });

        $('.wizard_content #btnCrop').on('click', function () {
            $('#wizard_profile').find("#dialog-error").text('');
            var img = cropper.getDataURL();
            $(this).parents('.img_edit_area').nextAll('.cropped').replaceWith('<div class="cropped"><img src="' + img + '" class="mCS_img_loaded"></div>');
            $(this).parents('.img_edit_area').hide();
            $(this).parents('.img_edit_area').nextAll('.cropped').fadeIn();
            var type = img.split(";")[0];
            type = type.split(":")[1];
            var imgData = img.split(",")[1];
            _profile.setAvatarData(imgData);
            _profile.setAvatarType(type);
        });

        $('.wizard_content #btnZoomIn').on('click', function () {
            cropper.zoomIn();
        });

        $('.wizard_content #btnZoomOut').on('click', function () {
            cropper.zoomOut();
        });

        $('#wizard_modal').find('.modal_exit_btn').on('click', function () {
            wizard_exit();
        });

        $(document).on('keydown', '#wizard_modal', function (e){
            if ((e.which && e.which === 27) || (e.keyCode && e.keyCode === 27)) {
                wizard_exit();
            }
        });

        $('.modal_slider').each(function(){
            var slide_w = $(this).width(),
                slider_w = slide_w * $(this).find('.modal_slide').length;
            $(this).children('.modal_slide_wrapper').css( 'width', slider_w + 'px' ).children('.modal_slide').css( 'width', slide_w + 'px' ).first().addClass('current');
            $(this).find('*').attr('tabindex', -1).end().find('.current').find('*').attr('tabindex', '');
        });

        $('.all_check .checkbox input[type="checkbox"]').on('click', function () {
           if ($(this).prop('checked')) {
             $(this).parents('.select_menu').siblings('.list_wrapper').find('.checkbox input[type="checkbox"]').prop('checked', true);

             $('[name="wizardlist"]:checked').each(function(){
                 changeSelectedUserInfo($(this));
             });
           } else {
             $(this).parents('.select_menu').siblings('.list_wrapper').find('.checkbox input[type="checkbox"]').prop('checked', false);
             $('[name="wizardlist"]').each(function(){
                changeSelectedUserInfo($(this));
             });
           }
           $('#number').text(_selectedUserList.length);
        });
   };

    function changeSelectedUserInfo(target) {
        var _self = this;
        if (target.prop('checked')) {
            if (_selectedUserList.indexOf(target.val()) == -1){
                _selectedUserList.push(target.val());
            }
        } else {
            var _index = _selectedUserList.indexOf(target.val());
            _selectedUserList.splice(_index, 1);
        }
    }

    function onSearch() {
        _searchResultPersonList = null;
        var _inputKeyword = $('#wizard_chatList').find('#search_chatlist').val();
        var _searchKeyword = Utils.trimStringMulutiByteSpace(_inputKeyword);
        if(_searchKeyword || _searchKeyword != ""){
            var condition = ViewUtils.getKeywordFilterFromKeywordInputString(_searchKeyword, false);
            if (condition || typeof condition == 'object') {
                _searchResultPersonList = new SearchResultPersonList();
                searchExecute(0,condition);
            }
        }
    }

    function applyExcludedList() {
        var len = ContactList.getInstance().getCount();
        for (var i=0; i<len; i++) {
            var jid = ContactList.getInstance()._array[i].getJid();
            var target = $('.wizard_content').find('input[type="checkbox"]input[value="' + jid + '"]');
            if (target.length > 0) {
                target.prop('disabled', true);
            }
        }
    }

    function searchExecute(_startId,_condition) {

        function onChatListCallback(userList) {

            var listCount = userList.getCount();

            for(let i = 0 ; i < listCount ; i++){
                var _person = userList.get(i);
                _searchResultPersonList.add(_person);
            }

            if (listCount < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')) {

                $('.wizard_content .list_wrapper').find('.select_list').empty();

                var promise = Promise.resolve();
                promise
                    .then(function(){
                        return createChatList(_searchResultPersonList);
                    })
                    .then(function(result){
                        $('.wizard_content').find('.select_list').html(result);
                        applyExcludedList();
                        $('#number').text(_selectedUserList.length);
                        dlg_scr.forEach(function (value) {
                            value.update();
                        });
                    })
                    .then(function(){
                        setCheckBoxEventHandler();
                    })
                    .catch(function(err){
                        console.log("Error WizardView " + err);
                    });
            }else{
                searchExecute(userList.get(listCount-1).getId(),_condition);
            }
        }

        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("login_account");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_ASC);
        var _filterCondition = _condition;
        var _columnSearchCondition = new ColumnSearchCondition(_filterCondition, _sortCondition);
        var startId = _startId;
        var _count = Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST');

        return CubeeController.getInstance().searchPerson(startId,_count,_columnSearchCondition,onChatListCallback);
    }
})();
