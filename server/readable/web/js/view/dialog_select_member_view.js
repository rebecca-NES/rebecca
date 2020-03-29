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
function DialogSelectMemberView(title, groupId) {
    var _self = this;
    _self._groupId = groupId;
    _self._height = _self._height || 420;
    _self._width = _self._width || 610;
    _self._submitButtonTitle = DialogOkCancelView.LABEL_OK;
    _self._memberInputAreaLabel = _self._memberInputAreaLabel || '';
    _self._memberAddButtonLabel = _self._memberAddButtonLabel || '';
    _self._memberListAreaLabel = _self._memberListAreaLabel || '';
    _self._autoCompleteCssCls = _self._autoCompleteCssCls || '';
    DialogSettingView.call(this, title);
    _self._createEventHandler();
    _self._ctrlFlg = false;
};(function() {
    DialogSelectMemberView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogSelectMemberView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        _self._dialogInnerElement.find('#dialog-error').css('text-align','center');
        _self._dialogInnerElement.find('#dialog-error').css('padding-top','30px');
    };
    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = "";
        _ret += '<div>';
        _ret += '  <form name="member-input-area">';
        _ret += '    <div class="member-setting-table member-setting-table-left">';
        _ret += '      <div class="label">' + _self._memberInputAreaLabel + '</div>';
        _ret += '      <div class="input-form"><textarea placeholder="' + Resource.getMessage('dialog_placeholder_account') + '" name="input-member" class="ui-corner-all width-100 ' + _self._autoCompleteCssCls + '" groupId="' + _self._groupId + '"/></div>';
        _ret += '      <div class="submit-button-area"><button type="submit">' + _self._memberAddButtonLabel + '</button></div>';
        _ret += '    </div>';
        _ret += '  </form>';
        _ret += '  <div class="member-setting-table">';
        _ret += '    <div class="label aligin-top">' + _self._memberListAreaLabel + '</div>';
        _ret += '    <div class="input-form">';
        _ret += '      <ul name="member-list" class="ui-widget-content ui-corner-all width-100">';
        _ret += '      </ul>';
        _ret += '    </div>';
        _ret += '  </div>';
        _ret += '  <p id="dialog-error" class="ui-state-error-text dialog_error_footer member-setting-error"></p>';
        _ret += '</div>';
        return _ret;
    };

    _proto.submit = function(dialogObj) {
        var _self = this;
        var _memberList = _self._createMemberListFromMemberListElement();
        var _rootElement = _self._dialogInnerElement;
        var _memberArea = _rootElement.find('ul[name="member-list"]');
        var _errElement = _rootElement.find("#dialog-error");
        if(_memberList.getCount() == 0){
            _memberArea.addClass('input-error');
            _errElement.text(Resource.getMessage('not_exist_in_list'));
            return;
        }
        _self._request(_memberList, dialogObj);
    };

    _proto._request = function(memberList, dialogObj) {
        var _self = this;
    };

    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        var _formArea = _rootElement.find('form[name="member-input-area"]');
        _formArea.find('button').button();
        _formArea.on('submit',function(){
            _self._onAddMemberToList();
            return false;
        });

        var _accountInputElement = _rootElement.find('textarea[name="input-member"]');
        _rootElement.on('ready',function(){
            var _defaultVal = '@';
            _accountInputElement.val(_defaultVal);
            _accountInputElement.focus();
        });

        _accountInputElement.on('keydown', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                if (_self._ctrlFlg) {
                    _self._onAddMemberToList();
                }
            } else if ((e.which && e.which == 17) || (e.keyCode && e.keyCode == 17)) {
                _self._ctrlFlg = true;
            } else {
                _self._ctrlFlg = false;
            }
        });
        _accountInputElement.on('keyup', function(e) {
            if ((e.which && e.which == 17) || (e.keyCode && e.keyCode == 17)) {
                _self._ctrlFlg = false;
            }
        });
    };

    _proto._onAddMemberToList = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _acountElement = _rootElement.find('textarea[name="input-member"]');
        var _listElement = _rootElement.find('ul[name="member-list"]');
        _rootElement.find("#dialog-error").text('');
        _acountElement.removeClass('input-error');
        _listElement.removeClass('input-error');

        _self._addDelimiterForCalcInputMemberList(_acountElement);

        _self._getMemberListFromInputArea(_onGetMemberList);

        function _onGetMemberList(inputAccountArray, personList) {
            _self._isValidateOk(inputAccountArray, personList, _onValidateCallBack);
        }

        function _onValidateCallBack(result){
            if(!result){
                return;
            }
            var _count = result.memberList.getCount();
            for(var i=0; i<_count; i++){
                var _person = result.memberList.get(i);
                var _memberElement = _self._createMemberElement(_person);
                if(_memberElement == null){
                    continue;
                }
                _self._addMemberListArea(_memberElement);
                var re = new RegExp('@' + _person.getLoginAccount() + "[\\s　、,]+", "g");
                _acountElement.attr('value', _acountElement.attr('value').replace(re, ''));
            }
            _self._setErrorText(result.errList);

            _self._removeDelimiterForCalcInputMemberList(_acountElement);
        }
    };

    _proto._addDelimiterForCalcInputMemberList = function(elem){
        var _elemValue = elem.attr('value');
        if(_elemValue !== ''){
            elem.attr('value', _elemValue + ' ');
        }
    };

    _proto._removeDelimiterForCalcInputMemberList = function(elem){
        var _elemValue = elem.attr('value');
        if(_elemValue != '' && _elemValue.substr(_elemValue.length - 1) == ' '){
            elem.attr('value', _elemValue.substr(0, _elemValue.length - 1));
        }
    };

    _proto._addMemberListArea = function(memberElement) {
        if(memberElement == null || typeof memberElement != 'object'){
            return;
        }
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _memberAreaElement = _rootElement.find('ul[name="member-list"]');
        if(_memberAreaElement.length == 0){
            return;
        }
        _memberAreaElement.append(memberElement);
    };

    _proto._createMemberElement = function(person) {
        if(person == null || typeof person != 'object'){
            return null;
        }
        var _self = this;
        var _jid = person.getJid();
        var _nickName = person.getUserName();
        var _accountName = person.getLoginAccount();
        var _ret = '';
        _ret = '<li>';
        _ret += '  <span class="item text-abbreviation"></span>'
        _ret += '  <span class="cancel"><img src="images/add_close.png"></span>';
        _ret += '</li>';
        _ret = $(_ret);
        var _displayStr = _nickName + '@' + _accountName;
        _ret.children('span.item').attr('jid', _jid);
        _ret.children('span.item').text(_displayStr);
        _ret.children('span.cancel').children().on('click', function(){
            _ret.remove();
        });
        return _ret;
    };

    _proto._isValidateOk = function(inputAccountArray, personList, onValidateCallBack) {
        var _memberInfo =_self._validateInputMemberList(inputAccountArray, personList);
        _self._isValidateJoinedMember(_memberInfo, onValidateCallBack);
    };

    _proto._isExistMemberArea = function(jid) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _memberAreaElement = _rootElement.find('ul[name="member-list"]');
        var _memberElement = _memberAreaElement.find('li').children('span.item[jid="' + jid + '"]');
        var _acountElement = _rootElement.find('textarea[name="input-member"]');
        var _errElement = _rootElement.find("#dialog-error");
        if(_memberElement.length == 0){
            return false;
        }
        return true;
    };

    _proto._createMemberListFromMemberListElement = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _memberAreaElement = _rootElement.find('ul[name="member-list"]');
        if(_memberAreaElement.length == 0){
            return;
        }
        var _memberList = new ArrayList();
        _memberAreaElement.children('li').each(function(){
            var _jid = $(this).children('span.item').attr('jid');
            _memberList.add(_jid);
        });
        return _memberList;
    };

    _proto._setErrorText = function(errList) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _acountElement = _rootElement.find('textarea[name="input-member"]');

        _rootElement.find("#dialog-error").text('');
        _acountElement.removeClass('input-error');

        if (errList.getCount() > 0) {
            _acountElement.addClass('input-error');
            var _errText = '';
            for (var _i = 0; _i < errList.getCount(); _i++) {
                if (_errText != '') {
                    _errText += '<br />';
                }
                _errText += errList.get(_i);
            }
            _rootElement.find("#dialog-error").html(_errText);
        }
    };

     _proto._getMemberListFromInputArea = function(callback){
        var _self = this;

        var _rootElement = _self._dialogInnerElement;
        var _acountElement = _rootElement.find('textarea[name="input-member"]');
        var _accountStr = _acountElement.val();
        _accountStr = Utils.replaceAll(_accountStr, '　', ' ');
        _accountStr = Utils.replaceAll(_accountStr, ',', ' ');
        _accountStr = Utils.replaceAll(_accountStr, '、', ' ');
        _accountStr = Utils.replaceAll(_accountStr, '\r\n', ' ');
        _accountStr = Utils.replaceAll(_accountStr, '\r', ' ');
        _accountStr = Utils.replaceAll(_accountStr, '\n', ' ');
        _accountStr = Utils.trimStringMulutiByteSpace(_accountStr);
        var _accountArray = [];
        if(_accountStr == ''){
            _onGetPersonData(new StringMapedArrayList());
            return;
        }
        _accountArray = _accountStr.split(' ');
        var _accountList = new ArrayList();
        for(var i=0; i<_accountArray.length; i++){
            if(_accountArray[i] == null || _accountArray[i].length < 1){
                continue;
            }
            var _isDuplicate = false;
            var _count = _accountList.getCount();
            for(var j=0; j<_count; j++){
                if(_accountArray[i] == ViewUtils.ACCOUNT_PREFIX + _accountList.get(j)){
                    _isDuplicate = true;
                    break;
                }
            }
            if(_isDuplicate){
                continue;
            }
            var _idx = _accountArray[i].indexOf(ViewUtils.ACCOUNT_PREFIX);
            if(_idx != 0){
                continue;
            }
            var _accountName = _accountArray[i].substring(1, _accountArray[i].length);
            _accountList.add(_accountName);
        }
        if(_accountList.getCount() == 0){
            _onGetPersonData(new StringMapedArrayList());
            return;
        }
        CubeeController.getInstance().getPersonDataByLoginAccountFromServer(_accountList, _onGetPersonData);
        function _onGetPersonData(personList) {
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(_accountArray, personList);
                }, 1);
            }
        }
     };

    _proto._validateInputMemberList = function(inputAccountArray, personListByAccount) {
        var _canAddMemberPersonList = new PersonList();
        var _errList = new ArrayList();
        var _self = this;
        var _inputCount = inputAccountArray.length;
        if (_inputCount == 0) {
            _errList.add(Resource.getMessage('add_member_err_input'));
            return {
                memberList: _canAddMemberPersonList,
                errList: _errList
            };
        }

        var _notExistAccountErr = '';
        var _existErr = '';

        for(var _i = 0; _i < _inputCount; _i++) {
            var _accountName = inputAccountArray[_i];
            var _idx = _accountName.indexOf(ViewUtils.ACCOUNT_PREFIX);
            if(_idx != 0){
                if (_notExistAccountErr !== '') {
                    _notExistAccountErr += ' ';
                }
                _notExistAccountErr += Utils.convertEscapedHtml(inputAccountArray[_i]);
                continue;
            }
            _accountName = _accountName.substring(1, _accountName.length);
            var _person = personListByAccount.getByKey(_accountName);
            if(_person == null) {
                if (_notExistAccountErr !== '') {
                    _notExistAccountErr += ' ';
                }
                _notExistAccountErr += Utils.convertEscapedHtml(inputAccountArray[_i]);
                continue;
            }
            if (_self._isExistMemberArea(_person.getJid())) {
                if (_existErr !== '') {
                    _existErr += ' ';
                }
                _existErr += Utils.convertEscapedHtml(inputAccountArray[_i]);
                continue;
            }
            _canAddMemberPersonList.add(_person);
        }
        if (_notExistAccountErr !== '') {
            _errList.add('"' + _notExistAccountErr + '"' + Resource.getMessage('add_member_err_not_exist_account'));
        }
        if (_existErr !== '') {
            _errList.add('"' + _existErr + '"' + Resource.getMessage('exist_in_list'));
        }
        return {
            memberList: _canAddMemberPersonList,
            errList: _errList
        };
    };

    _proto._isValidateJoinedMember = function(memberInfo, onValidateCallBack) {
        var _existMemberList = new PersonList();
        var _notExistMemberList = new PersonList();
        onValidateCallBack(_self._validateJoinedMember(memberInfo, _existMemberList, _notExistMemberList));

    };

    _proto._validateJoinedMember = function(memberInfo, existMemberList, notExistMemberList){
        return memberInfo;
    };

    _proto.setInputAccount = function(accountList) {
        var _self = this;
        if (!accountList || accountList.length < 0) {
            return;
        }
        var _rootElement = _self._dialogInnerElement;
        var _acountElement = _rootElement.find('textarea[name="input-member"]');
        _acountElement.val(accountList.join(' '));
    };
})();
