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
function TaskRegister(parentObject, message, mode){
    this._parentObject = parentObject;
    this._messageData = message;
    this._registedMessageData = undefined;
    this._mode = mode;
    this._registerForm = undefined;
    this._fileList = undefined;
    this.init();
    this._ctrlFlg = false;
};(function(){

    TaskRegister.mode_add = 'TaskParameter.mode_add';
    TaskRegister.mode_edit = 'TaskParameter.mode_edit';
    TaskRegister.MAX_LENGTH_TASK_NAME = Conf.getVal('TASK_TITLE_MAX_LENGTH');
    TaskRegister.MAX_LENGTH_TASK_BODY = Conf.getVal('MESSAGE_BODY_MAX_LENGTH');

    TaskRegister.TASK_TYPE_MY_TASK = 0;
    TaskRegister.TASK_TYPE_COMMUNITY_TASK = 1;

    var _proto = TaskRegister.prototype;

    _proto.init = function(){
        var _self = this;
        var FORMAT = Utils.DISPLAY_STANDARD_DATE_FORMAT;
        _self._taskTitle = (_self._messageData.getTitle ? _self._messageData.getTitle() : '');
        _self._romMessage = _self._messageData.getMessage();
        _self._files = [];
        _self._urlList = ViewUtils.extractAttachedFileUrls(_self._romMessage);
        for (var _i = 0; _i < _self._urlList.getCount(); _i++) {
            _self._files.push(_self._urlList.get(_i));
        }
        _self._taskMessageBody = ViewUtils.removeAttachmentUrl(_self._romMessage);
        var loginUserJid = LoginUser.getInstance().getJid();
        var messgageOwnerJid = (_self._messageData.getOwnerJid ? _self._messageData.getOwnerJid() : loginUserJid);
        var _taskDefaultClient = (_self._messageData.getClient ? _self._messageData.getClient() : '');
        if(_self._mode == TaskRegister.mode_add && _taskDefaultClient == ''){
            if(_self._messageData.getType() != Message.TYPE_MAIL) {
                _self._client = _self._messageData.getFrom();
            }
        }else{
            _self._client = _taskDefaultClient;
        }
        _self._clientUsername ='';
        var _profileMap = _self._messageData.getProfileMap();
        if(_profileMap && typeof _profileMap == 'object'){
            var _clientProfile = _profileMap.getByKey(_self._client);
            if(_clientProfile && typeof _clientProfile == 'object'){
                _self._clientUsername =_clientProfile.getNickName();
            }
        }

        _self._owner = messgageOwnerJid;
        _self._taskStartDate = (_self._messageData.getStartDate ? _self._messageData.getStartDate() : '');
        _self._taskStartDateStr = (_self._taskStartDate ? Utils.getDate(_self._taskStartDate.toString(), FORMAT) : '');
        _self._taskDueDate = (_self._messageData.getDueDate ? _self._messageData.getDueDate() : _self._messageData.getDueDate);
        _self._taskDueDateStr = (_self._taskDueDate ? Utils.getDate(_self._taskDueDate.toString(), FORMAT) : '');
        if(_self._mode == TaskRegister.mode_add){
            _self._taskStatus = TaskMessage.STATUS_UNKNOWN
            _self._taskPriority = TaskMessage.PRIORITY_LOW;
        }else{
            _self._taskStatus = _self._messageData.getStatus();
            _self._taskPriority = _self._messageData.getPriority();
        }
    };

    _proto.getContactList = function(flgAddMe){
        var ret = { list: [], hash: {} };
        if(flgAddMe){
            var me = LoginUser.getInstance();
            ret.list.push(me);
            ret.hash[me.getJid()] = me;
        }
        var contactList = ContactList.getInstance();
        var count = contactList.getCount();
        for(var i = 0; i < count; i++) {
            var person = contactList.get(i);
            var jid = person.getJid();
            ret.list.push(person);
            ret.hash[jid] = person;
        }
        return ret;
    };

    _proto.getPriorities = function(){
        return [
             {value: TaskMessage.PRIORITY_LOW, label: Resource.getMessage('task_priority_low')}
            ,{value: TaskMessage.PRIORITY_MEDIUM, label: Resource.getMessage('task_priority_medium')}
            ,{value: TaskMessage.PRIORITY_HIGH, label: Resource.getMessage('task_priority_high')}
            ,{value: TaskMessage.PRIORITY_TOP, label: Resource.getMessage('task_priority_top')}
        ];
    };

    _proto.getRegisterForm = function(){
        var _self = this;
        var contactList = _self.getContactList(true);
        var loginUserID = LoginUser.getInstance().getJid();
        var i, selected, isMyTask;
        if(this._mode == TaskRegister.mode_add){
            isMyTask = false;
        }else{
            isMyTask = (_self._owner == loginUserID) ? true : false;
        }
        var _ret = '';
        var titleLabel = 'unknown node!';
        switch(this._mode){
            case TaskRegister.mode_add : titleLabel = Resource.getMessage('task_title_registerTask'); break
            case TaskRegister.mode_edit: titleLabel = Resource.getMessage('task_title_editTask'); break
        }
        _ret += '<div id="taskregist_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>'+titleLabel+'</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <div class="modal_content register-task-name">';
        _ret += '      <p class="modal_title">'+Resource.getMessage('task_name')+'</p>';
        _ret += '    <div class="register-task-name-char-counter">';
        _ret +=        ViewUtils.getCharCounterHtml('char-counter-task-register');
        _ret += '    </div>';
        _ret += '      <input type="text" name="task-name" class="field task-register-item ui-corner-all" value="' + Utils.convertEscapedTag(_self._taskTitle) + '" placeholder="'+Resource.getMessage('task_register_name_placeholder')+'">';
        _ret += '    </div>';
        _ret += '    <div class="modal_content register-task-body">';
        _ret += '      <p class="modal_title">'+Resource.getMessage('task_body')+'</p>';
        _ret += '      <div class="register-task-body-char-counter">';
        _ret +=          ViewUtils.getCharCounterHtml('char-counter-task-register');
        _ret += '      </div>';
        _ret += '      <div class="textarea">';
        _ret += '        <textarea name="task-body" class="field task-register-item ui-corner-all autocomplete" rows="2" placeholder="' + Resource.getMessage('task_body_placeholder') + '">' + Utils.convertEscapedHtml(_self._taskMessageBody) + '</textarea>';
        _ret += '      </div>';
        _ret += '     <div class="register-task-body attatch-file-anchor olient-horizontal file-inputs">';
        _ret += '     </div>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content register-task-client">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('task_client') + '</p>';
        if(isMyTask){
            _ret += '<input type="text" class="field task-register-item register-client-input ui-corner-all autocomplete" value="' + Utils.convertEscapedHtml(_self._clientUsername) + '" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '" disabled>';
        }else{
            var _clientValue = '';
            var _profileMap = _self._messageData.getProfileMap();
            if(_profileMap && typeof _profileMap == 'object'){
                var _clientProfile = _profileMap.getByKey(_self._client);
                if(_clientProfile != null) {
                    _clientValue = '@' + _clientProfile.getLoginAccount();
                }
            }
            if(_clientValue === ''){
                _clientValue = ViewUtils.convertJidStrToAccountStr(loginUserID);
            }
            if (_self._mode == TaskRegister.mode_edit) {
                _ret += '<input type="text" class="field task-register-item register-client-input ui-corner-all autocomplete" value="' + Utils.convertEscapedTag(((_clientValue == null)? '' : _clientValue)) + '" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '" disabled>';
            } else {
                _ret += '<input type="text" class="field task-register-item register-client-input ui-corner-all autocomplete" value="' + Utils.convertEscapedTag(((_clientValue == null)? '' : _clientValue)) + '" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '">';
            }
        }
        _ret += '    </div>';

        _ret += '    <div class="modal_content register-task-owner ">';
        var _mulutiOwnerStr = Resource.getMessage('task_multi_selection');
        var _ownerValue = '';
        if(_self._mode == TaskRegister.mode_edit) {
            _mulutiOwnerStr = Resource.getMessage('task_non_multi_selection');
            _ownerValue = ViewUtils.convertJidStrToAccountStr(_self._owner) + ' ';
        } else {
            _ownerValue = ViewUtils.convertJidStrToAccountStr(loginUserID) + ' ';
        }
        _ret += '      <p class="modal_title">'+Resource.getMessage('task_owner')+' ' + _mulutiOwnerStr + '</p>';
        var _enabled = ' ';
        if (_self._mode == TaskRegister.mode_edit && _self._getCommunityId() || _self._mode == TaskRegister.mode_edit && _self._client != loginUserID ) {
            _enabled = 'disabled';
        }
        _ret += '<textarea class="field task-register-item register-owner-input ui-corner-all autocomplete" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '" ' + _enabled + '>' + ((_ownerValue == null)? '' : _ownerValue) + '</textarea>';
        _ret += '    </div>';

        _ret += '    <div class="modal_content w50 register-task-status">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('task_status') + '</p>';
        _ret += '      <select class="field task-status task-register-item ui-corner-all">';
        _ret += '        <option value="3" selected="">' + Resource.getMessage('task_status_new') + '</option>';
        _ret += '        <option value="4">' + Resource.getMessage('task_status_do') + '</option>';
        _ret += '        <option value="7">' + Resource.getMessage('task_status_fin') + '</option>';
        _ret += '        <option value="8">' + Resource.getMessage('task_status_rej') + '</option>';
        _ret += '      </select>';
        _ret += '    </div>';

        var priorities = _self.getPriorities();
        _ret += '    <div class="modal_content w50 register-task-priority">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('task_priority_title') + '</p>';
        _ret += '      <select class="field task-priority task-register-item ui-corner-all">';
        for(i=0; i<priorities.length; i++){
            var priority = priorities[i];
            selected = ((_self._taskPriority == priority.value) ? 'selected' : '');
            _ret += '        <option value="' + priority.value + '" ' + selected + '>' + priority.label + '</option>';
        }
        _ret += '      </select>';
        _ret += '    </div>';

        _ret += _self._getInputTaskTypeHtml();

        _ret += '    <div class="modal_content w50 mb0 register-task-start-date">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('task_start_date') + '</p>';
        _ret += '      <input type="text" class="field task-start-date date-time-picker task-register-item ui-corner-all" value="'+_self._taskStartDateStr+'">';
        _ret += '    </div>';

        _ret += '    <div class="modal_content w50 mb0 register-task-due-date">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('task_due_date') + '</p>';
        _ret += '      <input type="text" class="field task-due-date date-time-picker task-register-item ui-corner-all" value="'+_self._taskDueDateStr+'">';
        _ret += '    </div>';

        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button class="modal_btn success_btn register-task-OK ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">OK</span></button>';
        _ret += '  </div>';
        _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';

        var form = (this._registerForm = $(_ret));

        var taskNameBlock = $(form).find('div.register-task-name');
        ViewUtils.setCharCounter($(taskNameBlock).find('input[name="task-name"]'), $(taskNameBlock).find('.' + ViewUtils.CHAR_COUNTER_CLASSNAME), ColumnTaskMessageView.MAX_LENGTH_TASK_NAME, true);

        var taskBodyBlock = $(form).find('div.register-task-body');
        var taskBodyTextarea = $(taskBodyBlock).find('textarea');
        ViewUtils.setCharCounter($(taskBodyTextarea), $(taskBodyBlock).find('.' + ViewUtils.CHAR_COUNTER_CLASSNAME), ColumnTaskMessageView.MAX_LENGTH_TASK_BODY);

        var taskButtonBlock = $(form).find('div.btn_wrapper');
        var taskButtonOK = $(taskButtonBlock).find('button.modal_btn').button();
        $(taskButtonOK).on('click', function(){
            _self._parentObject.onTaskRegist(_self);
        });

        var taskFileBlock = $(form).find('div.attatch-file-anchor');
        var files = (this._fileList = new AttachedFileList(taskFileBlock));
        files.cleanup();
        if(_self._files.length){
          while(_self._files.length){ files.add(_self._files.shift()); }
          $(taskFileBlock).append(files.getHtml());
        }else{
          taskFileBlock.remove();
        }

        var dateTimePicker = $(form).find('input.date-time-picker');
        dateTimePicker.datetimepicker();

        var taskClientSelect = $(form).find('div.register-task-client > input.register-client-input');
        var taskOwnerSelect = $(form).find('div.register-task-owner > textarea.register-owner-input');

        var taskStatusSelect = $(form).find('div.register-task-status > select.task-status');
        var taskTypeSelect = $(form).find('div.register-task-type > select.task-type');

        $(taskClientSelect).on('change keyup focus', function() {
            _self._onChangeOwnerClient();
        });
        $(taskOwnerSelect).on('change keyup focus', function() {
            _self._onChangeOwnerClient();
        });
        $(taskTypeSelect).on('change keyup focus', function() {
            _self._onChangeOwnerClient();
        });
        var _taskTypeElem = $(form).find('div.register-task-type > select.task-type');
        if($(_taskTypeElem).length == 1){
            var _communityId =_self._getCommunityId();
            taskClientSelect.removeClass('autocomplete');
            taskClientSelect.addClass('autocomplete-for-community');
            taskClientSelect.attr('communityId',_communityId);
            taskOwnerSelect.removeClass('autocomplete');
            taskOwnerSelect.addClass('autocomplete-for-community');
            taskOwnerSelect.attr('communityId', _communityId);
        }
        _self._onChangeOwnerClient();   
        $(taskStatusSelect).val(_self._taskStatus);


        var _taskRegisterScrollArea = $(form).find('div.modal_content_wrapper');
        $(_taskRegisterScrollArea).on('keydown', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                if (_self._ctrlFlg) {
                        _self._parentObject.onTaskRegist(_self);
                        _self._ctrlFlg = false;
                }
            } else if ((e.which && e.which == 17) || (e.keyCode && e.keyCode == 17)) {
                _self._ctrlFlg = true;
            } else {
                _self._ctrlFlg = false;
            }
        });
        $(_taskRegisterScrollArea).on('keyup', function(e) {
            if ((e.which && e.which == 17) || (e.keyCode && e.keyCode == 17)) {
                _self._ctrlFlg = false;
            }
        });

        return form;
    };

    _proto._getInputTaskTypeHtml = function() {
        var _self = this;
        var _ret = '';
        var _message = _self._messageData;
        if(_message == null){
            return _ret;
        }
        var _type = _message.getType();
        var _communityId = null;
        var _communityName = null;
        if(_type == Message.TYPE_TASK && _message.getCommunityId() != ''){
            _communityId = _message.getCommunityId();
            _communityName = _message.getCommunityName();
        }else if(_type == Message.TYPE_COMMUNITY){
            _communityId = _message.getTo();
            _communityName = _message.getRoomName();
        }
        if(_communityId == null){
            return _ret;
        }

        _ret += '  <div class="modal_content register-task-type">';
        _ret += '    <p class="modal_title register-task-label">' + Resource.getMessage('task_type') + '</p>';
        _ret += '    <select class="field task-type task-register-item ui-corner-all"'+(_self._messageData._type === ColumnInformation.TYPE_COLUMN_TASK && _self._messageData._communityId !== "" ? " disabled" : "")+'>';
        _ret += '      <option value="" task-type="' + TaskRegister.TASK_TYPE_MY_TASK + '">' + Resource.getMessage('MyTask') + '</option>';
        _ret += '      <option value="' + _communityId + '" task-type="' + TaskRegister.TASK_TYPE_COMMUNITY_TASK + '" selected>'+ Utils.convertEscapedTag(_communityName) +'</option>';
        _ret += '    </select>';
        _ret += '  </div>';

        return _ret;
    };

    _proto._getCommunityId = function() {
        var _self = this;
        var _ret = '';
        var _message = _self._messageData;
        if(_message == null){
            return _ret;
        }
        var _type = _message.getType();
        var _communityId = null;
        if(_type == Message.TYPE_TASK && _message.getCommunityId() != ''){
            _communityId = _message.getCommunityId();
        }else if(_type == Message.TYPE_COMMUNITY){
            _communityId = _message.getTo();
        }
        if(_communityId == null){
            return _ret;
        }
        _ret = _communityId;
        return _ret;
    };

    _proto._addTextareaAutosize = function(registerForm) {
        var taskBodyTextareaBlock = registerForm.find('div.register-task-body');
        var taskBodyTextarea = $(taskBodyTextareaBlock).find('textarea');
        $(taskBodyTextarea).autosize();
    };

    _proto._addSelectBoxControlEvent = function(registerForm) {
        if (registerForm.parents('a').length > 0) {
            var _selectBoxes = registerForm.find('select.task-register-item');
            _selectBoxes.each(function() {
                var _selfSelectBox = $(this);
                _selfSelectBox.on('mousedown', function(e) {
                    _controlSelectBox(_selfSelectBox, e);
                });
            });
        }
    };
    function _controlSelectBox(selectBox, e) {
            if(e.target.nodeName.toUpperCase() == 'OPTION') {
                setTimeout(function() {
                    selectBox.val($(e.target).val());
                    selectBox.blur();
                }, 1);
            } else if(e.target.nodeName.toUpperCase() == 'SELECT') {
                selectBox.blur();
            }
    };

    _proto._onChangeOwnerClient = function() {
        var _self = this;
        var form = this._registerForm;
        if(!form) {
            return;
        }
        var loginUserAccountStr = ViewUtils.ACCOUNT_PREFIX + LoginUser.getInstance().getLoginAccount();
        var _taskStatusSelect = $(form).find('div.register-task-status > select.task-status');
        var _currentStatus = _taskStatusSelect.val();
        _taskStatusSelect.children().remove();
        var _clientStr = _self._getEditingClientId();
        var _ownerStr = _self._getEditingOwnerId();

        var _statusList = ColumnTaskView.getStatusListHtml(_ownerStr, _clientStr);
        if(_self._mode == TaskRegister.mode_edit) {
            if(_clientStr == loginUserAccountStr) {
                _statusList = ColumnTaskView.getStatusListHtml(_ownerStr, _clientStr);
            } else {
                _statusList = ColumnTaskView.getStatusListHtml(_ownerStr, _ownerStr);
            }
        }
        $(_taskStatusSelect).append(_statusList).val(_currentStatus);
    };

    _proto._getEditingClientId = function(){
        var _self = this;
        var _client = '';
        var _selector = 'div.register-task-client > input.register-client-input';
        var _targetElem = $(this._registerForm).find(_selector);

        if (!$(_targetElem).is(':disabled')) {
            _client = $(_targetElem).val();
        }else{
            var _profileMap = _self._messageData.getProfileMap();
            if(_profileMap && typeof _profileMap == 'object'){
                var _clientProfile = _profileMap.getByKey(_self._client);
                if(_clientProfile != null) {
                    _client = '@' + _clientProfile.getLoginAccount();
                }
            }
        }
        var _clientStr = Utils.trimStringMulutiByteSpace(_client);
        _clientStr = this._editingClientId(_clientStr);

        return _clientStr;
    };

    _proto._editingClientId = function(clientStr){
        var _clientStr = clientStr;
        var loginUserAccountStr = ViewUtils.ACCOUNT_PREFIX + LoginUser.getInstance().getLoginAccount();
        if(this._getInputCommunityId() == "" && (_clientStr === null || _clientStr === '')){
            _clientStr = loginUserAccountStr;
        }
        return _clientStr;
    };

    _proto._getEditingOwnerId = function(){
        var _ownerStr = '';
        var _selector = 'div.register-task-owner > textarea.register-owner-input';
        var _targetElem = $(this._registerForm).find(_selector);

        var _ownerStr = Utils.trimStringMulutiByteSpace(_targetElem.val());
        _ownerStr = this._editingOwnertId(_ownerStr);

        return _ownerStr;
    };

    _proto._editingOwnertId = function(ownerStr){
        var _ownerStr = ownerStr;
        var loginUserAccountStr = ViewUtils.ACCOUNT_PREFIX + LoginUser.getInstance().getLoginAccount();
        if(_ownerStr === null || _ownerStr === '') {
            _ownerStr = loginUserAccountStr;
        }
        return _ownerStr;
    };

    _proto.getRegistedMessageData = function(){
        return this._registedMessageData;
    }

    _proto.registTask = function(callback){
        var _self = this;
        if(!_self._registerForm) { throw Resource.getMessage('register form is not defined.'); }
        var preStatus = (_self._messageData.getStatus ? _self._messageData.getStatus() : TaskMessage.STATUS_UNKNOWN);
        if(!_self._isValidationOk(preStatus, _onIsValidation)){
            setTimeout(function() {
                callback(false);
            }, 1);
            return;
        }
        function _onIsValidation(isValidationResult) {
            if(!isValidationResult) {
                callback(false);
                return;
            }
            var _taskMessage = new TaskMessage();
            if(_self._messageData.getType() == Message.TYPE_TASK) {
                _taskMessage.copy(_self._messageData);
            } else {
                _taskMessage.setMessage(_self._messageData.getMessage());
                _taskMessage.setReferenceMessageItemId(_self._messageData.getItemId());
                _taskMessage.getAttachedFileUrlList().copy(_self._messageData.getAttachedFileUrlList());
            }
            _self.getInputContent(_taskMessage, _onGetInputContent);
        }
        function _onGetInputContent(taskMessage) {
            taskMessage.setPreOwnerJid(_self._messageData.getOwnerJid ? _self._messageData.getOwnerJid() : '');
            taskMessage.setPreStatus(preStatus);
            var _ret = false;

            switch(_self._mode){
                case TaskRegister.mode_add:
                    if(preStatus == TaskMessage.STATUS_INBOX){
                        _ret = _self.doUpdateTask(taskMessage);
                    }else{
                        _ret = _self.doRegistTask(taskMessage);
                    }
                    break;
                case TaskRegister.mode_edit:
                    if(_self._messageData.getType() != Message.TYPE_TASK){
                        throw 'TaskRegister::registTask _ message is not task.';
                    }
                    if(!_self.isChangeData(_self._messageData, taskMessage)){
                        _ret = true;
                        break;
                    }
                    _ret = _self.doUpdateTask(taskMessage);
                    break;
                default:
                    throw 'unknown mode:' + _self._mode;
            }
            callback(_ret);
        }
    };

    _proto.doRegistTask = function(taskMessage){
        var _self = this;
        var callback = function(){ console.log('TaskRegister::doRegistTask _ regist task.'); };
        if(CubeeController.getInstance().addTask(taskMessage, callback)){
            _self._registedMessageData = taskMessage;
            return true;
        }else{
            console.log("TaskRegister::registTask _ failed to regist task.");
            return false;
        }
    };
    _proto.doUpdateTask = function(taskMessage){
        var _self = this;
        var callback = function(){ console.log('TaskRegister::doUpdateTask _ update task.'); };
        if(CubeeController.getInstance().updateTask(taskMessage, callback)){
            _self._registedMessageData = taskMessage;
            return true;
        }else{
            console.log("TaskRegister::registTask _ failed to update task.");
            return false;
        }
    };

    _proto.isChangeData = function(beforeTaskMessage, afterTaskMessage){
        var i, j;
        if(beforeTaskMessage.getStatus() !== afterTaskMessage.getStatus()){ return true; }
        if(LoginUser.getInstance().getJid() !== afterTaskMessage.getOwnerJid()){ return true; }
        if(beforeTaskMessage.getTitle() !== afterTaskMessage.getTitle()){ return true; }
        if(beforeTaskMessage.getMessage() !== afterTaskMessage.getMessage()){ return true; }
        if(beforeTaskMessage.getDueDate() !== afterTaskMessage.getDueDate()){ return true; }
        if(beforeTaskMessage.getStartDate() !== afterTaskMessage.getStartDate()){ return true; }
        if(beforeTaskMessage.getPriority() !== afterTaskMessage.getPriority()){ return true; }
        if(beforeTaskMessage.getClient() !== afterTaskMessage.getClient()){ return true; }
        var _beforeFileDictionary = {};
        var _afterFileDictionary = {};
        var _beforeFiles = beforeTaskMessage.getAttachedFileUrlList();
        var _afterFiles = afterTaskMessage.getAttachedFileUrlList();
        var dictionaryContainer = [_beforeFileDictionary, _afterFileDictionary];
        var arraylistContainer = [_beforeFiles, _afterFiles];
        for(i=0; i<=1; i++){
            var dictionary = dictionaryContainer[i];
            var files = arraylistContainer[i];
            for(j=0; j<files.getCount(); j++){
                dictionary[files.get(i)] = true;
            }
        }
        for(i=0; i<=1; i++){
            var fromDic = dictionaryContainer[i];
            var toDic = dictionaryContainer[1-i];
            for (var key in fromDic){
                if(!toDic[key]){ return true; }
            }
        }

        return false;

    }

    _proto.getInputContent = function(taskMessage, callback){
        var _self = this;
        var form = this._registerForm;

        taskMessage.setTitle(Utils.excludeControleCharacters($(form).find('div.register-task-name > input[name="task-name"]').val()));
        taskMessage.setDueDate(new Date($(form).find('div.register-task-due-date > input.task-due-date').val()));
        taskMessage.setStartDate(new Date($(form).find('div.register-task-start-date > input.task-start-date').val()));
        taskMessage.setPriority(parseInt($(form).find('div.register-task-priority > select.task-priority').val()));
        var status = parseInt($(form).find('div.register-task-status > select.task-status').val());
        taskMessage.setStatus(status);

        var _content = $(form).find('div.register-task-body > div.textarea > textarea').val();
        _content = Utils.excludeControleCharacters(_content);
        taskMessage.setMessage(_content);

        var _attachedFileList = _self._fileList;
        var _fileCount = _attachedFileList._length;
        if (_fileCount > 0) {
            for (var _i = 0; _i < _fileCount; _i++) {
                var _attachedFileData = _attachedFileList.get(_i);
                var _flag = _attachedFileData.getFlag();
                var _url = _attachedFileData.getUrl();
                if (_flag == AttachedFileData.FILE_DELETE) {
                    _attachedFileList.removeByUrl(_url);
                }
            }
        }
        if (_attachedFileList.getCount() > 0) {
            _fileCount = _attachedFileList._length;
            for (var _i = 0; _i < _fileCount; _i++) {
                var _url = _attachedFileList.get(_i).getUrl();
                var _romMessage = _self._romMessage;
                if(ViewUtils.isAttachmentUrl(_romMessage, _url)){
                    taskMessage.addAttachedFileUrl(_url);
                }
            }
            taskMessage.addAttachedFileMessage();
        }

        var _typeElm = $(form).find('div.register-task-type > select.task-type');
        if(_typeElm.length == 1){
            var _communityId = _typeElm.val();
        }
        taskMessage.setCommunityId(_communityId);

        _getOwnerJidList();
        function _getOwnerJidList() {
            var _taskOwnerTextAreaElem = $(form).find('div.register-task-owner > textarea.register-owner-input');
            var _ownerStr = _taskOwnerTextAreaElem.val();
            _ownerStr = Utils.replaceAll(_ownerStr, '　', ' ');
            _ownerStr = Utils.replaceAll(_ownerStr, ',', ' ');
            _ownerStr = Utils.replaceAll(_ownerStr, '、', ' ');
            _ownerStr = Utils.replaceAll(_ownerStr, '\r\n', ' ');
            _ownerStr = Utils.replaceAll(_ownerStr, '\r', ' ');
            _ownerStr = Utils.replaceAll(_ownerStr, '\n', ' ');
            var _ownerArray = _ownerStr.split(' ');
            var _ownerAccountList = new ArrayList();
            for(var _i = 0; _i < _ownerArray.length; _i++) {
                var _ownerAccount = Utils.trimStringMulutiByteSpace(_ownerArray[_i]);
                if(_ownerAccount != null && _ownerAccount != '') {
                    var _idx = _ownerAccount.indexOf(ViewUtils.ACCOUNT_PREFIX);
                    if(_idx != 0){
                        continue;
                    }
                    _ownerAccount = _ownerAccount.substring(1, _ownerAccount.length);
                    _ownerAccountList.add(_ownerAccount);
                }
            }
            if(_ownerAccountList.getCount() == 0) {
                _onGetPersonDataByLoginAccountFromServer(null);
            }
            CubeeController.getInstance().getPersonDataByLoginAccountFromServer(_ownerAccountList, _onGetPersonDataByLoginAccountFromServer);
            function _onGetPersonDataByLoginAccountFromServer(personList) {
                var _ownerString = '';
                if(personList != null) {
                    var _personCount = personList.getCount();
                    for(var _i = 0; _i < _personCount; _i++) {
                        if(_i != 0) {
                            _ownerString += ',';
                        }
                        _ownerString += personList.get(_i).getJid();
                    }
                }
                taskMessage.setOwnerJid(_ownerString);
                _getClientJid();
            }
        }

        function _getClientJid() {
            _self.getInputClient(_onGetClientJid);
            function _onGetClientJid(clientJid) {
                var _client = '';
                if(clientJid != null) {
                    _client = clientJid;
                }
                taskMessage.setClient(_client);
                _callCallback();
            }
        }

        function _callCallback() {
            if(callback && typeof callback == 'function') {
                setTimeout(function(){
                    callback(taskMessage);
                }, 1);
            }
        }
    };

     _proto._getInputCommunityId = function(){
        var _inputCommunityId = '';
        var _typeElm = $(this._registerForm).find('div.register-task-type > select.task-type');
        if(_typeElm.length == 1){
            _inputCommunityId = _typeElm.val();
        }
        return _inputCommunityId;
     };

    _proto.getInputClient = function(callback){
        var _self = this;
        var form = this._registerForm;
        var loginUserJid = LoginUser.getInstance().getJid();

        var _taskClientInputElem = $(form).find('div.register-task-client > input.register-client-input');
        if($(_taskClientInputElem).length > 0){
            var _taskClientJid = LoginUser.getInstance().getJid();
            var _clientAccount = Utils.trimStringMulutiByteSpace(_taskClientInputElem.val());
            if(_clientAccount != null && _clientAccount != '') {
                ViewUtils.convertAccountStrToJidStrFromServer(_clientAccount, _onGetClientJid);
            } else {
                _onGetClientJid(null);
            }
        }else{
            _onGetClientJid(_self._client);
        }
        return;
        function _onGetClientJid(jid) {
            var _ret = '';
            if(jid != null) {
                _ret = jid;
            }
            if(callback && typeof callback == 'function') {
                setTimeout(function(){
                    callback(_ret);
                }, 1);
            }
        }
    };
    _proto._isValidationOk = function(preStatus, callback) {
        var _ret = true;
        var _self = this;
        var form = this._registerForm;
        var _typeElm = $(form).find('div.register-task-type > select.task-type');
        var _communityId = '';
        if(_typeElm.length == 1){
            _communityId = Utils.trimStringMulutiByteSpace(_typeElm.val());
        } else {
            var _message = _self._messageData;
            if(_message != null){
                var _type = _message.getType();
                if(_type == Message.TYPE_TASK ){
                    _communityId = _message.getCommunityId();
                }else if(_type == Message.TYPE_COMMUNITY){
                    _communityId = _message.getTo();
                }
            }
        }
        if(_communityId == null || _communityId == '') {
            setTimeout(function() {
                _validationCheck(null);
            }, 1);
        } else {
            if(!CubeeController.getInstance().getCommunityMemberInfo(_communityId, _onCommunityMemberGotton)) {
                return false;
            }
        }

        function _onCommunityMemberGotton(communityInfoOfMember) {
            if(communityInfoOfMember == null) {
                callback(false);
                return;
            }
            _validationCheck(communityInfoOfMember);
        };
        function _validationCheck(communityInfoOfMember) {
            var _taskNameInputElem = $(form).find('div.register-task-name > input[name="task-name"]');
            var _taskBodyTextAreaElem = $(form).find('div.register-task-body > div.textarea > textarea');

            _taskNameInputElem.removeClass('input-error');
            _taskBodyTextAreaElem.removeClass('input-error');
            var _status = parseInt($(form).find('div.register-task-status > select.task-status').val());
            if (_taskNameInputElem.val() == '') {
                if(
                       (this._mode == TaskRegister.mode_add )
                    || (
                           (_status != TaskMessage.STATUS_FINISHED && _status != TaskMessage.STATUS_REJECTED)
                        || (preStatus != TaskMessage.STATUS_FINISHED && preStatus != TaskMessage.STATUS_REJECTED)
                    )
                ){
                    _taskNameInputElem.addClass('input-error');
                    _ret = false;
                }
            }

            var _taskStartDateInput = $(form).find('div.register-task-start-date > input.task-start-date');
            var _startDateStr = _taskStartDateInput.val();
            var _startDate = null;
            _taskStartDateInput.removeClass('input-error');
            if(_startDateStr != '') {

                if(Utils.isValidDate(_startDateStr)) {
                    _startDate = new Date(_startDateStr);
                } else {
                    _taskStartDateInput.addClass('input-error');
                    _ret = false;
                }
            }
            var _taskDueDateInput = $(form).find('div.register-task-due-date > input.task-due-date');
            var _dueDateStr = _taskDueDateInput.val();
            var _dueDate = null;
            _taskDueDateInput.removeClass('input-error');
            if(_dueDateStr != '') {

                if(Utils.isValidDate(_dueDateStr)) {
                    _dueDate = new Date(_dueDateStr);
                } else {
                    _taskDueDateInput.addClass('input-error');
                    _ret = false;
                }
            }
            if(_startDate && _dueDate) {
                if(_startDate.getTime() > _dueDate.getTime()) {
                    if (!_taskStartDateInput.hasClass('input-error')) {
                        _taskStartDateInput.addClass('input-error');
                    }
                    if (!_taskDueDateInput.hasClass('input-error')) {
                        _taskDueDateInput.addClass('input-error');
                    }
                    _ret = false;
                }
            }
            if(_taskNameInputElem.val().length > TaskRegister.MAX_LENGTH_TASK_NAME) {
                _taskNameInputElem.addClass('input-error');
                _ret = false;
            }
            var editedLen = ViewUtils.getCalculattionBody(_taskBodyTextAreaElem.val());
            if(editedLen > TaskRegister.MAX_LENGTH_TASK_BODY) {
                _taskBodyTextAreaElem.addClass('input-error');
                _ret = false;
            }

            var _taskClientInputElem = $(form).find('div.register-task-client > input.register-client-input');
            var _taskOwnerTextAreaElem = $(form).find('div.register-task-owner > textarea.register-owner-input');
            var isMyTask;

            if(_self._mode == TaskRegister.mode_add){
                isMyTask = false;
            }else{
                isMyTask = (_self._owner == LoginUser.getInstance().getJid()) ? true : false;
            }
            if($(_taskClientInputElem).length > 0 && !isMyTask){
                _taskClientInputElem.removeClass('input-error');
                var _clientAccount = Utils.trimStringMulutiByteSpace(_taskClientInputElem.val());
                if(_clientAccount != null && _clientAccount != '') {
                    if(communityInfoOfMember == null) {
                        var _loginUserJid = LoginUser.getInstance().getJid();
                        var _clientJid = ViewUtils.convertAccountStrToJidStr(_clientAccount);
                        if(_loginUserJid != _clientJid) {
                            var _person = ContactList.getInstance().getByJid(_clientJid);
                            if (_person == null) {
                                _taskClientInputElem.addClass('input-error');
                                _ret = false;
                            }
                        }
                    } else {
                        var _clientAccountData = _clientAccount.substring(1, _clientAccount.length);
                        var _person = communityInfoOfMember.getOwnerList().getByLoginAccount(_clientAccountData);
                        if(_person == null) {
                            _person = communityInfoOfMember.getGeneralMemberList().getByLoginAccount(_clientAccountData);
                        }
                        if (_person == null) {
                            _taskClientInputElem.addClass('input-error');
                            _ret = false;
                        }
                    }
                }
            }
            if(!_self._isValidationOwnerOk(communityInfoOfMember)){
                _ret = false;
            }
            callback(_ret);
        };
        return true;
    };

    _proto._isValidationOwnerOk = function(communityInfoOfMember) {
        var _ret = true;
        var _self = this;
        var form = this._registerForm;

        var _taskOwnerTextAreaElem = $(form).find('div.register-task-owner > textarea.register-owner-input');

        _taskOwnerTextAreaElem.removeClass('input-error');
        var _ownerStr = _taskOwnerTextAreaElem.val();
        _ownerStr = Utils.replaceAll(_ownerStr, '　', ' ');
        _ownerStr = Utils.replaceAll(_ownerStr, ',', ' ');
        _ownerStr = Utils.replaceAll(_ownerStr, '、', ' ');
        _ownerStr = Utils.replaceAll(_ownerStr, '\r\n', ' ');
        _ownerStr = Utils.replaceAll(_ownerStr, '\r', ' ');
        _ownerStr = Utils.replaceAll(_ownerStr, '\n', ' ');
        var _ownerArray = _ownerStr.split(' ');
        var _ownerCount = 0;
        var _ownerList = new StringMapedStringArrayList();
        for(var _i = 0; _i < _ownerArray.length; _i++) {
            var _ownerAccount = Utils.trimStringMulutiByteSpace(_ownerArray[_i]);
            if(_ownerAccount != null && _ownerAccount != '') {
                _ownerCount++;
                if(communityInfoOfMember == null) {
                    var _loginUserJid = LoginUser.getInstance().getJid();
                    var _ownerJid = ViewUtils.convertAccountStrToJidStr(_ownerAccount);
                    if(_loginUserJid != _ownerJid) {
                        var _person = ContactList.getInstance().getByJid(_ownerJid);
                        if (_person == null) {
                            _taskOwnerTextAreaElem.addClass('input-error');
                            _ret = false;
                            break;
                        }
                    }
                } else {
                    var _ownerAccountData = _ownerAccount.substring(1, _ownerAccount.length);
                    var _person = communityInfoOfMember.getOwnerList().getByLoginAccount(_ownerAccountData);
                    if(_person == null) {
                        _person = communityInfoOfMember.getGeneralMemberList().getByLoginAccount(_ownerAccountData);
                    }
                    if (_person == null) {
                        _taskOwnerTextAreaElem.addClass('input-error');
                        _ret = false;
                        break;
                    }
                }
                if(_ownerList.getByKey(_ownerAccount) == null) {
                    _ownerList.add(_ownerAccount, _ownerAccount);
                } else {
                    _taskOwnerTextAreaElem.addClass('input-error');
                    _ret = false;
                    break;
                }
            }
        }
        var _isCommunity = false;
        if(communityInfoOfMember != null) {
            _isCommunity = true;
        }
        if(!_self._isCheckOwnerCount(_ownerCount, _isCommunity)) {
            _taskOwnerTextAreaElem.addClass('input-error');
            _ret = false;
        }
        return _ret;
    };

    _proto._isCheckOwnerCount = function(ownerCount, isCommunity) {
        var _self = this;
        var _ret = false;
        if(isCommunity) {
            _ret = (_self._mode != TaskRegister.mode_edit || ownerCount <= 1);
        } else {
            _ret = (ownerCount != 0 && (_self._mode != TaskRegister.mode_edit || ownerCount == 1));
        }
        return _ret;
    };
})();
