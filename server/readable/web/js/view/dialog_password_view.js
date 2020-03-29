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
function DialogPasswordView(title) {
    DialogSettingView.call(this, title);
    this._createEventHandler();
};(function() {
    DialogPasswordView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogPasswordView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
    };
    _proto.getInnerHtml = function() {
        var _ret = "";

        _ret += '<div id="password_modal" class="card modal_card">';
        _ret += '  <form class="form-horizontal horizonal-form ui-dialog-content ui-widget-content" id="user_profile" scrolltop="0" scrollleft="0">';
        _ret += '    <div class="card_title">';
        _ret += '      <p>' + Resource.getMessage('config_password_title') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <div class="modal_content">';
        _ret += '        <p class="modal_title">' + Resource.getMessage('config_password_current_label') + '</p>';
        _ret += '        <input type="password" id="current_password" class="field ui-corner-all">';
        _ret += '      </div>';
        _ret += '      <div class="modal_content">';
        _ret += '        <p class="modal_title">' + Resource.getMessage('config_password_new_label') + '</p>';
        _ret += '        <input type="password" id="new_password" class="field ui-corner-all">';
        _ret += '      </div>';
        _ret += '      <div class="modal_content">';
        _ret += '        <p class="modal_title">' + Resource.getMessage('config_password_new_confirm_label') + '</p>';
        _ret += '        <input type="password" id="new_password_confirm" class="field ui-corner-all">';
        _ret += '      </div>';
        _ret += '      <p class="notes">' + Resource.getMessage('config_password_notes') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="btn_wrapper">';
        _ret += '      <br><p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '      <button id="password_button" type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('config_submit_buttom') + '</span></button>';
        _ret += '    </div>';
        _ret += '    <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '  </form>';
        _ret += '</div>';
        return _ret;
    };

    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        _rootElement.on('click', '#password_button', function() {
            _self.submit(_self._dialogAreaElement);
        });
    }

    _proto.submit = function(dialogObj) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        if (!_self._checkPassword(_rootElement)) {
            return;
        }

        var _oldPasswordElement = _rootElement.find('#current_password');
        var _newPasswordElement = _rootElement.find('#new_password');
        var _oldPassword = _oldPasswordElement.val();
        var _newPassword = _newPasswordElement.val();
        CubeeController.getInstance().changePassword(_oldPassword, _newPassword, onChangePasswordCallback);

        function onChangePasswordCallback(result, reason) {
            if (result) {
                LoginTicket.password(_newPassword);
                ViewUtils.modal_allexit();
            } else {
                var _errorMessage = Resource.getMessage('config_password_change_failed');
                if (reason == 8) {
                    _errorMessage = Resource.getMessage('config_current_password_invalid');
                    var _oldPasswordElement = _rootElement.find('#current_password');
                    _oldPasswordElement.addClass('input-error');
                } else if (reason == 32) {
                    _errorMessage = Resource.getMessage('config_password_complexity');
                }

                _rootElement.find("#dialog-error").text(_errorMessage);
            }
        };
    };
    _proto._checkPassword = function(passwordFormObj) {
        if (!passwordFormObj || typeof passwordFormObj != 'object') {
            return false;
        }
        var _ret = false
        var _oldPasswordElement = passwordFormObj.find('#current_password');
        var _newPasswordElement = passwordFormObj.find('#new_password');
        var _newPasswordConfirmElement = passwordFormObj.find('#new_password_confirm');
        var _oldPassword = _oldPasswordElement.val();
        var _newPassword = _newPasswordElement.val();
        var _newPasswordConfirm = _newPasswordConfirmElement.val();

        passwordFormObj.find("#dialog-error").text('');
        _oldPasswordElement.removeClass('input-error');
        _newPasswordElement.removeClass('input-error');
        _newPasswordConfirmElement.removeClass('input-error');
        if (_oldPassword == null || _oldPassword == '') {
            _oldPasswordElement.addClass('input-error');
            passwordFormObj.find("#dialog-error").text( Resource.getMessage('config_password_current_must') );
        } else if (_newPassword == null || _newPassword == '') {
            _newPasswordElement.addClass('input-error');
            passwordFormObj.find("#dialog-error").text(Resource.getMessage('config_password_new_must'));
        } else if (!ViewUtils.checkLength(_newPasswordElement, LoginView.MIN_LENGTH_PASSWORD, LoginView.MAX_LENGTH_PASSWORD)) {
            _newPasswordElement.addClass('input-error');
            passwordFormObj.find("#dialog-error").text(Resource.getMessage('loginErrPasswordLength1') + LoginView.MIN_LENGTH_PASSWORD + Resource.getMessage('loginErrPasswordLength2') + LoginView.MAX_LENGTH_PASSWORD + '.');
        } else if (!ViewUtils.checkRegexp(_newPasswordElement, /([!-~])+$/)) {
            _newPasswordElement.addClass('input-error');
            passwordFormObj.find("#dialog-error").text(Resource.getMessage('loginErrPasswordContain'));
        } else if (_newPassword != _newPasswordConfirm) {
            _newPasswordElement.addClass('input-error');
            _newPasswordConfirmElement.addClass('input-error');
            passwordFormObj.find("#dialog-error").text(Resource.getMessage('config_password_new_confirm_must'));
        } else {
            _ret = true;
        }
        return _ret;
    };
})();
