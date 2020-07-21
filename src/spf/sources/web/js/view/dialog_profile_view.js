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

function DialogProfileView(title) {
    DialogSettingView.call(this, title);
    this._createEventHandler();
    this._avaterType = LoginUser.getInstance().getAvatarType();
    this._avaterData = LoginUser.getInstance().getAvatarData();
    this._backgroundPath = '';
};(function() {
    DialogProfileView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogProfileView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        if(!ViewUtils.isIE89()){
            var _avaterImgAreaElm = _self._dialogInnerElement.find('#avater_edit_area div.block-avatar');
            var _avaterChangeButtonHtml = '<button id="changeAvaterPhoto" class="profile_change_avater_btn">' + Resource.getMessage('config_profile_image_label')  + '</button>';
            _avaterImgAreaElm.append(_avaterChangeButtonHtml);
            _self._dialogInnerElement.find('button').button();
        }
        _self.getGroupList();
    };
    _proto.getGroupList = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _groupElement = _rootElement.find('#group');

        CubeeController.getInstance().getGroupList()
        .then(function(result){
            var _group = result.content.groups;
            for(var i = 0 ; i < _group.length ; i++){
                _group[i] = Utils.urldecode(Utils.getSafeStringData(_group[i]));
            }
            var _delimiter = new RegExp(',');
            _groupElement.autocomplete({
                lookup: _group,
                minChars: 1,
                delimiter: _delimiter,
                lookupFilter: function(suggestion, originalQuery, queryLowerCase){
                    if(originalQuery.length >= 1 &&
                        originalQuery.match(/^\s*$/) &&
                        suggestion.value.match(/^\s*$/)){
                            return;
                    }
                    if(originalQuery.length >= 1 &&
                        !originalQuery.match(/^[^\x01-\x7E\xA1-\xDF]+$/) &&
                        !suggestion.value.match(/^[^\x01-\x7E\xA1-\xDF]+$/)){
                            return;
                    }
                    if(originalQuery.length >= 101 &&
                        suggestion.length >= 101){
                            return;
                    }
                    return suggestion.value.toUpperCase().indexOf(originalQuery) !== -1;
                }
            })
        }).catch(function(err){
            _rootElement.find("#dialog-error").text(Resource.getMessage('config_profile_group_list_err'));
            _groupElement.addClass('input-error');
            return;
        });
    };
    
    _proto.getInnerHtml = function() {
        var _loginUserName = LoginUser.getInstance().getUserName();
        _loginUserName = Utils.convertEscapedTag(_loginUserName);
        var _isUpdatablePersonData = LoginUser.getInstance().isUpdatablePersonData();
        var _ret = "";

        _ret += '<div id="profile_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>' + Resource.getMessage('config_profile_title') + '</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('config_profile_nickname_label') + '</p>';
        if (! _isUpdatablePersonData) {
            _ret += '      <input type="text" maxlength="20" class="field ui-corner-all" id="nick_name" disabled value="' + _loginUserName +'">';
        }else{
            _ret += '      <input type="text" maxlength="20" class="field ui-corner-all" id="nick_name" value="' + _loginUserName +'">';
        }
        _ret += '    </div>';
        var _mailAddress = LoginUser.getInstance().getMailAddress();
        _mailAddress = Utils.convertEscapedTag(_mailAddress);
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('config_profile_mail_address') + '</p>';
        if (! _isUpdatablePersonData) {
            _ret += '      <input type="text" maxlength="256" class="field ui-corner-all" id="mail_address" disabled value="' + _mailAddress +'">';
        }else{
            _ret += '      <input type="text" maxlength="256" class="field ui-corner-all" id="mail_address" value="' + _mailAddress +'">';
        }
        _ret += '    </div>';
        var _str = LoginUser.getInstance().getGroup();
        var _group = _str.join(",");
        _group = Utils.convertEscapedTag(_group);
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('config_profile_group') + '</p>';
        if (! _isUpdatablePersonData) {
            _ret += '      <input type="text" maxlength="504" class="field ui-corner-all" id="group" disabled value="' + _group +'">';
        }else{
            _ret += '      <input type="text" maxlength="504" class="field ui-corner-all" id="group" value="' + _group +'">';
        }
        _ret += '      <p class="notes" style="margin-left: 10px" >' + Resource.getMessage('config_profile_group_notes') + '</p>';
        _ret += '    </div>';
        var AuthInfo = AuthorityInfo.getInstance();
        _ret += '    <div class="modal_content w50">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('config_account_type') + '</p>';
        _ret += '      <p class="fwb mb0">'+Utils.convertEscapedHtml(AuthInfo.getRoleName())+'</p>';
        _ret += '    </div>';
        var loginUserStatus = LoginUser.getInstance().getPresence();
        _ret += '    <div class="modal_content w50">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('config_user_status') + '</p>';
        _ret += '      <select class="field" id="profile_status">';
        _ret += '        <option value="1">' + Resource.getMessage('presence_online') + '</option>';
        _ret += '        <option value="2">' + Resource.getMessage('presence_staway') + '</option>';
        _ret += '        <option value="3">' + Resource.getMessage('presence_exaway') + '</option>';
        _ret += '        <option value="4">' + Resource.getMessage('presence_nodisturb') + '</option>';
        _ret += '      </select>';
        _ret += '    </div>';

        var loginUserMemo = LoginUser.getInstance().getMyMemo();
        loginUserMemo = Utils.convertEscapedTag(loginUserMemo);
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('my_memo_placeholder') + '</p>';
        _ret += '      <input type="text" class="field" id="profile_memo" value="'+ loginUserMemo +'">';
        _ret += '    </div>';

        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('config_profile_avater_label') + '</p>';
        _ret += '      <div class="cropped_wrapper">';
        _ret += '        <div id="profile-logo-field">';
        _ret += '          <input type="file" name="logofile" class="avatar_file_prof" size="30" accept="image/jpeg, image/gif, image/png">';
        _ret += '        </div>';
        _ret += '        <div class="img_edit_area">';
        _ret += '          <div class="imageBox imageBox_prof">';
        _ret += '            <div class="thumbBox"></div>';
        _ret += '            <div class="spinner" style="display: none">Loading...</div>';
        _ret += '          </div>';
        _ret += '          <div class="action">';
        _ret += '            <button class="modal_btn zoom_btn" id="btnZoomIn"><i class="fa fa-plus"></i> '+ Resource.getMessage('config_avator_zoom_in') +'</button>';
        _ret += '            <button class="modal_btn zoom_btn" id="btnZoomOut"><i class="fa fa-minus"></i> '+ Resource.getMessage('config_avator_zoom_out') +'</button>';
        _ret += '            <button class="modal_btn success_btn" id="btnCrop">' + Resource.getMessage('dialog_label_ok') + '</button>';
        _ret += '          </div>';
        _ret += '        </div>';
        _ret += '        <div class="cropped"></div>';
        _ret += '      </div>';
        _ret += '    </div>';

        if (window.Notification) {
            _ret += '    <div class="modal_content">';
            _ret += '      <p class="modal_title">' + Resource.getMessage('push_notification_setting_title') + '</p>';
            _ret += '<div class="select-quote-target">\
                      <label for="notification_on" class="radio">\
                      <input type="radio" name="push_notification_setting" id="notification_on" value='+Message.TYPE_COMMUNITY+'>\
                      <span></span>' + Resource.getMessage('push_notification_on') + '</label>\
                      <label for="notification_off" class="radio">\
                      <input type="radio" name="push_notification_setting" id="notification_off" value='+Message.TYPE_GROUP_CHAT+' checked>\
                      <span></span>' + Resource.getMessage('push_notification_off') + '</label>\
                    </div>'
            _ret += '    </div>';
        }

        if (TabManager.getInstance().isActiveMyWorkplace()) {
            _ret += '    <div class="modal_content">';
            _ret += '      <p class="modal_title">' + Resource.getMessage('config_dashboard_background_image') + '</p>';
            _ret += '<div id="background_image" class="select-quote-target">\
                      <label for="bg_1" class="radio">\
                      <input type="radio" name="background_setting" id="bg_1" value="dashboard_wrapper" checked>\
                      <span></span>1</label>\
                      <label for="bg_2" class="radio">\
                      <input type="radio" name="background_setting" id="bg_2" value="dashboard_wrapper2">\
                      <span></span>2</label>\
                      <label for="bg_3" class="radio">\
                      <input type="radio" name="background_setting" id="bg_3" value="dashboard_wrapper3">\
                      <span></span>3</label>\
                      <label for="bg_4" class="radio">\
                      <input type="radio" name="background_setting" id="bg_4" value="dashboard_wrapper4">\
                      <span></span>4</label>\
                      <label for="bg_5" class="radio">\
                      <input type="radio" name="background_setting" id="bg_5" value="dashboard_wrapper5">\
                      <span></span>5</label>\
                      <label for="bg_6" class="radio">\
                      <input type="radio" name="background_setting" id="bg_6" value="dashboard_wrapper6">\
                      <span></span>6</label>\
                      <label for="bg_7" class="radio">\
                      <input type="radio" name="background_setting" id="bg_7" value="dashboard_wrapper7">\
                      <span></span>7</label>\
                      <label for="bg_8" class="radio">\
                      <input type="radio" name="background_setting" id="bg_8" value="dashboard_wrapper8">\
                      <span></span>8</label>\
                    </div>'
            _ret += '    </div>';
        }
        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button class="modal_btn success_btn" id="profile_button">' + Resource.getMessage('config_submit_buttom') + '</button>';
        _ret += '  </div>';
        _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';

        _ret = $(_ret)
        _ret.find('select#profile_status').val(loginUserStatus).prop("selected", true);
        _ret.find('div#background_image input[value="'+LoginUser.getInstance().getExtras().backgroundImage+'"]').prop("checked", true);

        return _ret;

    };
    _proto.submit = function(dialogObj) {
        var _self = this;
        var _profile = new Profile();
        var _rootElement = _self._dialogInnerElement;
        var _nickNameElement = _rootElement.find('#nick_name');
        var _nickName = Utils.excludeControleCharacters(_nickNameElement.val());
        _profile.setNickName(_nickName);
        _nickNameElement.removeClass('input-error');
        var _mailAddressElement = _rootElement.find('#mail_address');
        var _mailAddress = _mailAddressElement.val();
        _profile.setMailAddress(_mailAddress);
        _mailAddressElement.removeClass('input-error');
        if (Utils.trimStringMulutiByteSpace(_nickName).length == 0) {
            _nickNameElement.addClass('input-error');
            _rootElement.find("#dialog-error").text(Resource.getMessage('config_profile_nickname_empty'));
            return;
        }
        var _groupElement = _rootElement.find('#group');
        var _group = _groupElement.val();
        if(_group){
            var _str = _group;
            _group = _str.split(',');
            if (_group.length > 5){
                _rootElement.find("#dialog-error").text(Resource.getMessage('config_profile_group_empty'));
                _groupElement.addClass('input-error');
                return;
            }
            for(var i = 0 ; i < _group.length ; i++){
                if(_group[i].match(/^\s*$/)){
                    _rootElement.find("#dialog-error").text(Resource.getMessage('config_profile_group_must'));
                    _groupElement.addClass('input-error');
                    return;
                }
                if (!_group[i].match(/^[^\x01-\x7E\xA1-\xDF]+$/)) {
                    _rootElement.find("#dialog-error").text(Resource.getMessage('config_profile_group_txt'));
                    _groupElement.addClass('input-error');
                    return;
                }
                if(_group[i].length > 100){
                    _rootElement.find("#dialog-error").text(Resource.getMessage('config_profile_group_complexity'));
                    _groupElement.addClass('input-error');
                    return;
                }
                _group[i] = encodeURIComponent(_group[i]);
            }
        } else {
            _group = [];
        }
        _profile.setGroup(_group);
        if(!ViewUtils.isIE89()){
            _profile.setAvatarType(_self._avaterType);
            _profile.setAvatarData(_self._avaterData);
            CubeeController.getInstance().changeProfile(_profile, onChangeProfileCallback);
        } else {
            if(_rootElement.find('#inputAvaterIE').val() != ""){
                var csc = CubeeServerConnector.getInstance();
                _rootElement.find('#avatarupload_accesstoken').val(csc._accessToken);
                _rootElement.find('#avatarupload_account').val(csc._user);
                CubeeController.getInstance().uploadAvatarIE(_rootElement.find('#avaterfields'), onUploadAvatarCallback);
            } else {
                _profile.setAvatarType(_self._avaterType);
                _profile.setAvatarData(_self._avaterData);
                CubeeController.getInstance().changeProfile(_profile, onChangeProfileCallback);
            }
        }
       
        function onChangeProfileCallback(result) {
            if (result) {
                var _status = Number(_rootElement.find('#profile_status').children('option:selected').val());
                var convertStrStatus = Utils.convertPresenceNumToStr(_status);
                var _memo = _rootElement.find('#profile_memo').val();
                var _ret = CubeeController.getInstance().changePresence(convertStrStatus, _memo);
                if(_ret){
                  CubeeController.getInstance().clearPrePresence();
                  ColumnMessageView.updateMessageAvatarToolTip(LoginUser.getInstance().getJid());
                  if (_self._backgroundPath) {
                      var extras = LoginUser.getInstance().getExtras();
                      var saveExtras = {};
                      saveExtras.backgroundImage = _self._backgroundPath;
                      CubeeServerConnector.getInstance().setLoginUserExtras(saveExtras)
                      .then(function(res){
                          var _extras = res.content.extras;
                          if (_extras) {
                              try {
                                  _extras = JSON.parse(_extras);
                                  LoginUser.getInstance().setExtras(_extras);
                                  ViewUtils.modal_allexit();
                              } catch (error) {
                                  _extras = {};
                              }
                          }
                      });
                  } else {
                      ViewUtils.modal_allexit();
                  }
                }else{
                    _rootElement.find("#dialog-error").text( Resource.getMessage('config_profile_change_failed') );
                }
            } else {
                _rootElement.find("#dialog-error").text( Resource.getMessage('config_profile_change_failed') );
            }
        };

        function onUploadAvatarCallback(result) {
            _rootElement.find('#avatarupload_accesstoken').val('');
            _rootElement.find('#avatarupload_account').val('');
            if (result.result != "success") {
                _rootElement.find("#dialog-error").text( Resource.getMessage('config_profile_change_failed') );
                return;
            }
            _profile.setAvatarType('imagepath');
            _profile.setAvatarData(result.path);
            CubeeController.getInstance().changeProfile(_profile, onChangeProfileCallback);
        };

    };

    _proto._avatorImage = function(_rootElement) {
      var _self = this;
      var options_prof =
        {
          imageBox: '.imageBox_prof',
          thumbBox: '.thumbBox',
          spinner: '.spinner',
          imgSrc: ''
        }
      var cropper_prof;

      $('.img_edit_area, .cropped').hide();
      $('.avatar_file_prof').click(function () {
        _rootElement.find("#dialog-error").text('');
        cropper = '';
        $(this).val('');
        $(this).parents('.cropped_wrapper').find('.cropped').hide();
        $(this).parents('.cropped_wrapper').find('.img_edit_area').hide();
        _self._avaterData = "";
        _self._avaterType = "";
      });

      $('.avatar_file_prof').change(function () {
        if (this.files.length > 0) {
          var item = this.files[0];
          switch (item.type) {
            case 'image/jpeg':
            case 'image/gif':
            case 'image/png':
            case 'image/bmp':
            break;
          default:
            _rootElement.find("#dialog-error").text( Resource.getMessage('config_profile_image_failed') );
            return;
          }

          reader_prof = new FileReader();
          reader_prof.onload = function (e) {
            options_prof.imgSrc = e.target.result;
            cropper_prof = new cropbox(options_prof);
          }
          reader_prof.readAsDataURL(this.files[0]);
          $(this).parents('.cropped_wrapper').find('.cropped').hide();
          $(this).parents('.cropped_wrapper').find('.img_edit_area').fadeIn();
        }
      });

      $('.modal_content #btnCrop').on('click', function () {
        _rootElement.find("#dialog-error").text( Resource.getMessage('') );
        var img = cropper_prof.getDataURL();
        $(this).parents('.img_edit_area').nextAll('.cropped').replaceWith('<div class="cropped"><img src="' + img + '" class="mCS_img_loaded"></div>');
        $(this).parents('.img_edit_area').hide();
        $(this).parents('.img_edit_area').nextAll('.cropped').fadeIn();

        var type = img.split(";")[0];
        type = type.split(":")[1];
        var imgData = img.split(",")[1];
        _self._avaterData = imgData;
        _self._avaterType = type;
      });

      $('.modal_content #btnZoomIn').on('click', function () {
        cropper_prof.zoomIn();
      });
      $('.modal_content #btnZoomOut').on('click', function () {
        cropper_prof.zoomOut();
      });
    }

    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        _self._avatorImage(_rootElement);

        if (window.Notification) {
            if (PushNotificationSettingManager.getInstance().isSetting(LoginUser.getInstance().getJid())) {
                _rootElement.find('input[id="notification_on"]').prop('checked', true);
            }

            _rootElement.on('change', 'input[name="push_notification_setting"]:radio', function(){
                var a = $(this);
                switch ($(this).attr('id')) {
                    case 'notification_on':
                        Notification.requestPermission(function(result) {
                            if (result === 'denied') {
                                alert(Resource.getMessage('push_notification_alert_blocking'));
                                return;
                            } else if (result === 'default') {
                                return;
                            } else if (result === 'granted') {
                                PushNotificationSettingManager.getInstance().appendSetting(LoginUser.getInstance().getJid());
                            }
                        })
                        break;
                    case 'notification_off':
                        PushNotificationSettingManager.getInstance().removeSetting(LoginUser.getInstance().getJid());
                        break;
                    default:
                        break;
                }
            });
        }

        _rootElement.on('change', 'input[name="background_setting"]:radio', function(){
            var a = $(this);
            $('div[name="mainWrapper"]').removeClass (function (index, css) {
                return (css.match (/\bdashboard_w\S+/g) || []).join(' ');
            });
            switch ($(this).attr('id')) {
                case 'bg_1':
                    _self._backgroundPath = 'dashboard_wrapper';
                    break;
                case 'bg_2':
                    _self._backgroundPath = 'dashboard_wrapper2';
                    break;
                case 'bg_3':
                    _self._backgroundPath = 'dashboard_wrapper3';
                    break;
                case 'bg_4':
                    _self._backgroundPath = 'dashboard_wrapper4';
                    break;
                case 'bg_5':
                    _self._backgroundPath = 'dashboard_wrapper5';
                    break;
                case 'bg_6':
                    _self._backgroundPath = 'dashboard_wrapper6';
                    break;
                case 'bg_7':
                    _self._backgroundPath = 'dashboard_wrapper7';
                    break;
                case 'bg_8':
                    _self._backgroundPath = 'dashboard_wrapper8';
                    break;
                default:
                    break;
            }
            if (TabManager.getInstance().isActiveMyWorkplace()) {
                $('div[name="mainWrapper"]').addClass(_self._backgroundPath);
                return;
            }
        });

        _rootElement.on('click', '#profile_button', function() {
            _self.submit(_self._dialogAreaElement);
        });
    };
})();
