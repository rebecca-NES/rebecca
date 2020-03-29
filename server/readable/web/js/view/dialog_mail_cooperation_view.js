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
function DialogMailCooperationView(title) {
    DialogSettingView.call(this, title);
    this._createEventHandler();
    this._mailServerList = null;
};(function() {
    DialogMailCooperationView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogMailCooperationView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        _self._dialogInnerElement.dialog("option", "width", 450);
        _self._width = 450;
        _self._dialogInnerElement.dialog({
            open: function( event, ui ) {
                _self._onOpenDialog();
            }
        });
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _checkCooperationElem = _rootElement.find('#mail-cooperation-check');
        _checkCooperationElem.click(function() {
            _self._onChangeCheckCooperation();
        });
    };
    _proto._onOpenDialog = function() {
        var _self = this;
        function _onGetServerListCallBack(serverList){
            _self._mailServerList = serverList;
            _self._setOptionServerList();
            _self._onChangeCheckCooperation();
        }
        var _ret = CubeeController.getInstance().getServerList(_onGetServerListCallBack);
        if(!_ret){
            console.log('GetServerList Request is fail');
            var _rootElement = _self._dialogInnerElement;
            _rootElement.dialog("close");
            return false;
        }
    };
    _proto._setOptionServerList = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _selectServerElem = _rootElement.find('#pop_server_list');
        _rootElement.find('#pop_server_list > option').remove();
        var _userCooperationList = LoginUser.getInstance().getSettings().getMailCooperationList();
        var _count = _userCooperationList.getCount();
        var _userCooperationInfo = null;
        for (var _i = 0; _i < _count; _i++) {
            _userCooperationInfo = _userCooperationList.get(_i);
        }
        var _serverList = _self._mailServerList;
        var _serverCount = _serverList.getCount();
        if (_serverCount < 1) {
            _rootElement.find('#mail-cooperation-check').removeAttr('checked');
        }
        for (var _i = 0; _i < _serverCount; _i++) {
            var _selected = '';
            var _serverInfo = _serverList.get(_i);
            if (_serverInfo.getId() == _userCooperationInfo.getServerId()) {
                _selected = 'selected';
            }
            var _optionHtml = '<option class="margintop-clear" value="' + _serverInfo.getId() + '" ' + _selected + '>' + _serverInfo.getDisplayName() + '</option>';
            _selectServerElem.append(_optionHtml);
        }
    };
    _proto._onChangeCheckCooperation = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _allInputs = null;
        if (!_self._mailServerList || _self._mailServerList.getCount() == 0) {
            _allInputs = _rootElement.find(':input');
        } else {
            _allInputs = _rootElement.find(':input').not('#mail-cooperation-check');
        }

        var _checked = _rootElement.find('#mail-cooperation-check').attr('checked');
        if (_checked == 'checked') {
            _allInputs.removeAttr('disabled');
        } else {
            _allInputs.attr('disabled', 'disabled');
        }
    };
    _proto.getInnerHtml = function() {
        var _self = this;
        var _checked = '';
        var _mailAddress = '';
        var _mailAccount = '';
        var _mailPassword = '';
        var _mailCooperationInfoList = LoginUser.getInstance().getSettings().getMailCooperationList();
        var _mailCooperationInfo = _mailCooperationInfoList.get(0);
        if (_mailCooperationInfo != null) {
            _mailAddress = _mailCooperationInfo.getMailAddress();
            var _popAccountInfo = _mailCooperationInfo.getSettingInfo();
            if (_mailCooperationInfo.getCooperationType() == MailCooperationInformation.SERVER_TYPE_POP) {
                _checked = 'checked="checked"';
            }
            if (_popAccountInfo != null) {
                _mailAccount = _popAccountInfo.getAccount();
                _mailPassword = _popAccountInfo.getPassword();
            }
        }
        var _ret = "";
        _ret = '<form class="form-horizontal horizonal-form" id="mail_cooperation">';
        _ret += '<div class="control-group form_group">';
        _ret += '<span>';
        _ret += '<input id="mail-cooperation-check" type="checkbox" class="margintop-clear" name="cooperation-checkbox" ' + _checked +'>';
        _ret += '<label for="mail-cooperation-check">' + Resource.getMessage('config_mail_cooperation_check_cooperation_label') + '</label>';
        _ret += '</span>';
        _ret += '</div>';
        _ret += '<div class="control-group form_group">';
        _ret += '<label class="control-label form_label label_mailinfo">' + Resource.getMessage('config_mail_cooperation_server_label') + '</label>';
        _ret += '<div class="controls form_controls">';
        _ret += '<select id="pop_server_list" class="ui-corner-all">';
        _ret += '</select>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<div class="control-group form_group">';
        _ret += '<label class="control-label form_label label_mailinfo">' + Resource.getMessage('config_mail_cooperation_mail_address_label') + '</label>';
        _ret += '<div class="controls form_controls">';
        _ret += '<input type="text" class="ui-corner-all" id="mail_address" value="' + Utils.convertEscapedTag(_mailAddress) + '">';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<div class="control-group form_group">';
        _ret += '<label class="control-label form_label label_mailinfo">' + Resource.getMessage('config_mail_cooperation_pop3_account_label') + '</label>';
        _ret += '<div class="controls form_controls">';
        _ret += '<input type="text" class="ui-corner-all" id="mail_account" value="' + Utils.convertEscapedTag(_mailAccount) + '">';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<div class="control-group form_group">';
        _ret += '<label class="control-label form_label label_mailinfo">' + Resource.getMessage('config_mail_cooperation_pop3_password_label') + '</label>';
        _ret += '<div class="controls form_controls">';
        _ret += '<input type="password" id="mail_password" class="ui-corner-all" value="' + Utils.convertEscapedTag(_mailPassword) + '">';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '</form>';
        return _ret;
    };
    _proto.submit = function(dialogObj) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _updateCooperationInfoList = new MailCooperationInfoList();
        var _userCooperationList = LoginUser.getInstance().getSettings().getMailCooperationList();
        var _count = _userCooperationList.getCount();
        var _updateCooperationInfo = null;
        for (var _i = 0; _i < _count; _i++) {
            _updateCooperationInfo = _userCooperationList.get(_i);
        }
        if (!_self._isChangeData(_updateCooperationInfo)) {
            $(dialogObj).dialog("close");
            return;
        }
        var _checked = _rootElement.find('#mail-cooperation-check').attr('checked');
        if (_checked == 'checked') {
            if (!_self._isValidationOk(_rootElement)) {
                return;
            }
            _updateCooperationInfo.setCooperationType(MailCooperationInformation.SERVER_TYPE_POP);
        } else {
            _updateCooperationInfo.setCooperationType(MailCooperationInformation.SERVER_TYPE_NON);
        }
        var _serverListElm = _rootElement.find('#pop_server_list');
        _updateCooperationInfo.setServerId(_serverListElm.val());
        _updateCooperationInfo.setServerName(_serverListElm.text());
        _updateCooperationInfo.setMailAddress(_rootElement.find('#mail_address').val());
        var _settingInfo = new PopSettingInfomation();
        _settingInfo.setAccount(_rootElement.find('#mail_account').val());
        _settingInfo.setPassword(_rootElement.find('#mail_password').val());
        _updateCooperationInfo.setSettingInfo(_settingInfo);

        _updateCooperationInfoList.add(_updateCooperationInfo);

        function onChangeMailCooperationSettingCallback(result, reason) {
            if (result) {
                LoginUser.getInstance().getSettings().setMailCooperationList(_updateCooperationInfoList);
                $(dialogObj).dialog("close");
            } else {
                var _errorMessage = Resource.getMessage('mail_setting_error_message');
                _rootElement.find("#dialog-error").text(_errorMessage);
            }
        };
        CubeeController.getInstance().changeMailCooperationSetting(_updateCooperationInfoList, onChangeMailCooperationSettingCallback);
    };
    _proto._isChangeData = function(cooperationInfo) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _isChange = false;
        var _checked = _rootElement.find('#mail-cooperation-check').attr('checked');
        var _serverId = _rootElement.find('#pop_server_list').val();
        var _mailAddress = _rootElement.find('#mail_address').val();
        var _mailAccount = _rootElement.find('#mail_account').val();
        var _mailPassword = _rootElement.find('#mail_password').val();
        var _popServerInfo = cooperationInfo.getSettingInfo();

        if (_checked == 'checked') {
            if (cooperationInfo.getCooperationType() == MailCooperationInformation.SERVER_TYPE_NON) {
                _isChange = true;
            }
        } else {
            if (cooperationInfo.getCooperationType() == MailCooperationInformation.SERVER_TYPE_POP) {
                _isChange = true;
            }
            if (_isChange) {
                return _isChange;
            }
        }
        if (cooperationInfo.getId() != parseInt(_serverId)) {
            _isChange = true;
        }
        if (cooperationInfo.getMailAddress() != _mailAddress) {
            _isChange = true;
        }
        if (_popServerInfo != null) {
            if (_popServerInfo.getAccount() != _mailAccount) {
                _isChange = true;
            }
            if (_popServerInfo.getPassword() != _mailPassword) {
                _isChange = true;
            }
        } else {
            if (_mailAccount != null && _mailAccount != '') {
                _isChange = true;
            }
            if (_mailPassword != null && _mailPassword != '') {
                _isChange = true;
            }
        }
        return _isChange;
    };
    _proto._isValidationOk = function(formObj) {
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _ret = false
        var _mailAddressElement = formObj.find('#mail_address');
        var _mailAccountElement = formObj.find('#mail_account');
        var _mailPasswordElement = formObj.find('#mail_password');
        var _selectServer = formObj.find('#pop_server_list').val();
        var _mailAddress = Utils.trimStringMulutiByteSpace(_mailAddressElement.val());
        var _mailAccount = Utils.trimStringMulutiByteSpace(_mailAccountElement.val());
        var _mailPassword = Utils.trimStringMulutiByteSpace(_mailPasswordElement.val());

        formObj.find("#dialog-error").text('');
        _mailAddressElement.removeClass('input-error');
        _mailAccountElement.removeClass('input-error');
        _mailPasswordElement.removeClass('input-error');
        var _checked = formObj.find('#mail-cooperation-check').attr('checked');
        if (_checked == 'checked') {
            if (_mailAddress == null || _mailAddress == '') {
                _mailAddressElement.addClass('input-error');
                formObj.find("#dialog-error").text(Resource.getMessage('config_mail_cooperation_error_mail_address_must'));
            } else if (_mailAccount == null || _mailAccount == '') {
                _mailAccountElement.addClass('input-error');
                formObj.find("#dialog-error").text(Resource.getMessage('config_mail_cooperation_error_mail_server_account_must'));
            } else if (_mailPassword == null || _mailPassword == '') {
                _mailPasswordElement.addClass('input-error');
                formObj.find("#dialog-error").text(Resource.getMessage('config_mail_cooperation_error_mail_server_password_must'));
            } else if (!ViewUtils.checkRegexp(_mailAddressElement, /([!-~])+$/)) {
                _mailAddressElement.addClass('input-error');
                formObj.find("#dialog-error").text(Resource.getMessage('config_mail_cooperation_error_mail_address_invalid'));
            } else if (!ViewUtils.checkRegexp(_mailPasswordElement, /([!-~])+$/)) {
                _mailPasswordElement.addClass('input-error');
                formObj.find("#dialog-error").text(Resource.getMessage('config_mail_cooperation_error_mail_server_password_invalid'));
            } else {
                _ret = true;
            }
        }
        return _ret;
    };
})();
