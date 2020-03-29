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
function DialogTaskView(message, mode) {
    DialogOkCancelView.call(this);
    if (mode == DialogTaskView.MODE_UPDATE && message == null) {
        return null;
    }
    this._taskMessage = new TaskMessage();
    this._taskMessage.copy(message);
    if (mode == DialogTaskView.MODE_UPDATE && this._taskMessage.getItemId() == '') {
        return null;
    }
    this._mode = mode;
    this._initView();
};(function() {
    DialogTaskView.MODE_ADD = 1;
    DialogTaskView.MODE_READ = 2;
    DialogTaskView.MODE_UPDATE = 3;
    DialogTaskView.MAX_LENGTH_TASK_NAME = Conf.getVal('TASK_TITLE_MAX_LENGTH');
    DialogTaskView.MAX_LENGTH_TASK_BODY = Conf.getVal('MESSAGE_BODY_MAX_LENGTH');
    DialogTaskView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogTaskView.prototype;
    _proto._initView = function() {
        var _self = this;
        var _dialogTitle = '';
        switch(_self._mode) {
            case DialogTaskView.MODE_ADD:
                _dialogTitle = Resource.getMessage('task_title_add');
                function addTaskCallback(result) {
                    console.log("add task : " + result);
                };
                _self._buttons = {
                    "OK" : function() {
                        if (!isValidationOk()) {
                            return;
                        }
                        updateTaskMessageData();
                        if (CubeeController.getInstance().addTask(_self._taskMessage, addTaskCallback) == true) {
                            $(this).dialog("close");
                            _self._dialogInnerElement.remove();
                        } else {
                            console.log("faild to add task");
                        }
                    },
                    "キャンセル" : function() {
                        $(this).dialog("close");
                    }
                };
                break;
            case DialogTaskView.MODE_READ:
                _dialogTitle = Resource.getMessage('task_title_view');
                _self._buttons = {
                    "閉じる" : function() {
                        $(this).dialog("close");
                    }
                };
                break;
            case DialogTaskView.MODE_UPDATE:
                _dialogTitle = Resource.getMessage('task_title_update');
                _self._buttons = {
                    "OK" : function() {
                        if (!isValidationOk()) {
                            return;
                        }
                        function updateTaskCallback(result) {
                            console.log("update task : " + result);
                        };

                        var _columnPositions = ColumnManager.getInstance()._getTargetColumnsIndex(_self._taskMessage);
                        var _itemId = _self._taskMessage.getItemId();
                        var _msgPositions = new ArrayList();
                        var _columnObjects = new ArrayList();
                        for (var _i = 0; _i < _columnPositions.getCount(); _i++) {
                            var _curPos = _columnPositions.get(_i);
                            var _columnObj = ColumnManager.getInstance().getColumnObjList().get(_curPos);
                            var _msgPos = _columnObj.getMsgObjIndexPositionByItemId(_itemId);
                            _columnObjects.add(_columnObj);
                            _msgPositions.add(_msgPos);
                        }
                        updateTaskMessageData();
                        var _owner = _self._taskMessage.getOwnerJid();
                        var _client = _self._taskMessage.getClient();
                        var _loginUserJid = LoginUser.getInstance().getJid();
                        if (_owner != _loginUserJid && _client != _loginUserJid) {
                            for (var _i = 0; _i < _columnPositions.getCount(); _i++) {
                                var _curColumnObj = _columnObjects.get(_i);
                                var _curMessagePos = _msgPositions.get(_i);
                                var _columnContent = _curColumnObj.getHtmlElement().children('div.column-content');
                                var _targetMsgObj = _curColumnObj.getParentMsgObjByPosition(_curMessagePos);
                                var _targetMsgElm = _targetMsgObj.getHtmlElement();
                                _targetMsgElm.remove();
                                _curColumnObj.removeMsgObjIndexByItemId(_itemId);
                            }
                        }
                        if (CubeeController.getInstance().updateTask(_self._taskMessage, updateTaskCallback) == true) {
                            $(this).dialog("close");
                        } else {
                            console.log("faild to add task");
                        }
                    },
                    "キャンセル" : function() {
                        $(this).dialog("close");
                    }
                };
                break;
            default:
                break;
        }
        $('#dialog_area').html(_self._getTaskDialogBasicHtml());
        var _taskNameElm = $('#dialog-task-name');
        var _taskBodyElm = $('#dialog-task-body');
        ViewUtils.setCharCounter(_taskNameElm, _taskNameElm.next('.' + ViewUtils.CHAR_COUNTER_CLASSNAME), DialogTaskView.MAX_LENGTH_TASK_NAME, true);
        ViewUtils.setCharCounter(_taskBodyElm, _taskBodyElm.next('.' + ViewUtils.CHAR_COUNTER_CLASSNAME), DialogTaskView.MAX_LENGTH_TASK_BODY);
        _self._dialogInnerElement = $('#dialog-task-dialog');
        if (_self._taskMessage.getOwnerJid() != "") {
            $('#dialog-task-owner').val(_self._taskMessage.getOwnerJid());
        } else {
            $('#dialog-task-owner').val(LoginUser.getInstance().getJid());
        }
        $('#dialog-task-status').val(_self._taskMessage.getStatus());
        $('#dialog-task-priority').val(_self._taskMessage.getPriority());
        var _startDateObj = _self._taskMessage.getStartDate();
        if (_startDateObj) {
            var _startDateStr = _startDateObj.toString();
            if (_startDateStr != 'Invalid Date') {
                var _startDateForDisplay = Utils.getDate(_startDateStr, Utils.DISPLAY_STANDARD_DATE_FORMAT);
                $('#dialog-task-start-date').val(_startDateForDisplay);
            }
        }
        var _dateObj = _self._taskMessage.getDueDate();
        if (_dateObj) {
            var _dateStr = _dateObj.toString();
            if (_dateStr != 'Invalid Date') {
                var _dateForDisplay = Utils.getDate(_dateStr, Utils.DISPLAY_STANDARD_DATE_FORMAT);
                $('#dialog-task-due-date').val(_dateForDisplay);
            }
        }
        _self._dialogInnerElement.find('input.date-time-picker').datetimepicker({
            showOn : "button",
            buttonImage : "images/calendar.png",
            buttonImageOnly : true,
            dateFormat : Utils.DISPLAY_DATEPICKER_DATE_FORMAT
        });
        _self._dialogInnerElement.find('input.date-time-picker').next('img').css('width', '24');
        _self._dialogInnerElement.dialog({
            buttons : _self._buttons,
            modal : true,
            autoOpen : false,
            width : 500,
            title : _dialogTitle,
            close : function() {
                $(this).dialog('destroy');
                $(this).remove();
            }
        });

        function isValidationOk() {
            var _status = parseInt($('#dialog-task-status').val());
            if (_status == TaskMessage.STATUS_INBOX || (_status >= TaskMessage.STATUS_FINISHED && _self._taskMessage.getStatus() == TaskMessage.STATUS_INBOX)) {

            } else {
                if (_self.isEmptyValue($('#dialog-task-name').attr('value'))) {
                    $('#dialog-task-dialog-error').text( Resource.getMessage('task_error_taskname') );
                    return false;
                }
            }
            var _startDateStr = $('#dialog-task-start-date').val();
            var _startDate = null;
            if (_startDateStr != '') {

                if (Utils.isValidDate(_startDateStr)) {
                    _startDate = new Date(_startDateStr);
                } else {
                    $('#dialog-task-dialog-error').text( Resource.getMessage('task_error_datetime') );
                    return false;
                }
            }
            var _dueDateStr = $('#dialog-task-due-date').val();
            var _dueDate = null;
            if (_dueDateStr != '') {

                if (Utils.isValidDate(_dueDateStr)) {
                    _dueDate = new Date(_dueDateStr);
                } else {
                    $('#dialog-task-dialog-error').text( Resource.getMessage('task_error_datetime') );
                    return false;
                }
            }
            if (_startDate && _dueDate) {
                if (_startDate.getTime() > _dueDate.getTime()) {
                    $('#dialog-task-dialog-error').text( Resource.getMessage('task_error_statu_due_datetime') );
                    return false;
                }
            }
            if ($('#dialog-task-name').val().length > DialogTaskView.MAX_LENGTH_TASK_NAME) {
                $('#dialog-task-dialog-error').text( Resource.getMessage('task_error_taskname_length') );
                return false;
            }
            var re = /((https?)(:\/\/\S+))/gi;
            var text = $('#dialog-task-body').val();
            var edited = text.replace(re, "");
            if (edited.length > DialogTaskView.MAX_LENGTH_TASK_BODY) {
                $('#dialog-task-dialog-error').text( Resource.getMessage('task_error_content_length') );
                return false;
            }
            var ownerObj = $('#dialog-task-owner').val();
            if (ownerObj.length == 0) {
                $('#dialog-task-dialog-error').text( Resource.getMessage('task_error_owner_select') );
                return false;
            }
            return true;
        };

        function updateTaskMessageData() {
            var _ownerObj = $('#dialog-task-owner').val();
            var _ownerString = _ownerObj.join();
            var _taskMessage = _self._taskMessage;
            _taskMessage.setTitle($('#dialog-task-name').val());
            _taskMessage.setMessage($('#dialog-task-body').val());
            _taskMessage.setDueDate(new Date($('#dialog-task-due-date').val()));
            _taskMessage.setOwnerJid(_ownerString);
            _taskMessage.setStatus(parseInt($('#dialog-task-status').val()));
            _taskMessage.setStartDate(new Date($('#dialog-task-start-date').val()));
            _taskMessage.setPriority(parseInt($('#dialog-task-priority').val()));
            _taskMessage.setClient($('#dialog-task-client option:selected').val());
        };
    };

    _proto._getTaskDialogBasicHtml = function() {
        var _ret = '';
        var _self = this;
        var _taskTitle = _self._taskMessage.getTitle();
        var _taskMessageBody = _self._taskMessage.getMessage();
        var _loginUserJid = LoginUser.getInstance().getJid();
        var _loginUserName = LoginUser.getInstance().getUserName();
        var _taskDueDate = _self._taskMessage.getDueDate();
        var _taskDueDateStr = '';
        var _taskDefaultClient = _self._taskMessage.getFrom();
        var _taskClientSelected = 'selected';
        if (_taskDefaultClient.length == 0) {
            _taskDefaultClient = _loginUserJid;
            _taskClientSelected = '';
        }
        if (_taskDueDate) {
            _taskDueDateStr = Utils.getDate(_taskDueDate.toString, Utils.DISPLAY_DATEPICKER_DATE_FORMAT);
        }
        var _taskStartDate = _self._taskMessage.getStartDate();
        var _taskStartDateStr = '';
        if (_taskStartDate) {
            _taskStartDateStr = Utils.getDate(_taskStartDate.toString, Utils.DISPLAY_DATEPICKER_DATE_FORMAT);
        }
        _ret += '<div id="dialog-task-dialog">';
        _ret += '<p id="dialog-task-dialog-error" class="ui-state-error-text"></p>';
        _ret += '<form class="task-dialog-form">';
        _ret += '<label for="task-name" class="task-dialog-label">' + Resource.getMessage('task_name') + '</label>';
        _ret += '<input id="dialog-task-name" name="task-name" class="task-dialog-item ui-corner-all" value="' + Utils.convertEscapedTag(_taskTitle) + '">';
        _ret += ViewUtils.getCharCounterHtml('char-counter-task-add-dialog');
        _ret += '<br />';
        _ret += '<label for="task-body" class="task-dialog-label">' + Resource.getMessage('task_body_placeholder') + '</label>';
        _ret += '<textarea id="dialog-task-body" name="task-body" class="task-dialog-item ui-corner-all">' + _taskMessageBody + '</textarea>';
        _ret += ViewUtils.getCharCounterHtml('char-counter-task-add-dialog');
        _ret += '<br />';
        _ret += '<label for="task-client" class="task-dialog-label">' + Resource.getMessage('task_client') + '</label>';
        _ret += '<select id="dialog-task-client" class="task-dialog-item ui-corner-all">';
        _ret += '<option value="' + _taskDefaultClient + '"></option>';
        _ret += '<option value="' + _loginUserJid + '" ' + _taskClientSelected + '>' + Utils.convertEscapedHtml(_loginUserName) + '</option>';
        var _contactListCount = ContactList.getInstance().getCount();
        for (var _i = 0; _i < _contactListCount; _i++) {
            var _curPerson = ContactList.getInstance().get(_i);
            var _curUserName = _curPerson.getUserName();
            var _curJid = _curPerson.getJid();
            if (_curJid == _taskDefaultClient) {
                _ret += '<option value="' + _curJid + '" ' + _taskClientSelected + '>' + Utils.convertEscapedHtml(_curUserName) + '</option>';
            } else {
                _ret += '<option value="' + _curJid + '">' + Utils.convertEscapedHtml(_curUserName) + '</option>';
            }
        }
        _ret += '</select>';
        _ret += '<br />';
        _ret += '<label for="task-owner" class="task-dialog-label"><div class="task-dialog-item">' + Resource.getMessage('task_owner_edit') + '</div><div class="task-dialog-item">' + Resource.getMessage('task_multi_selection') + '</div><div class="task-dialog-item"></div></label>';
        _ret += '<select id="dialog-task-owner" class="task-dialog-item ui-corner-all" size="5" multiple="multiple">';
        _ret += '<option value="' + _loginUserJid + '" selected>' + Utils.convertEscapedHtml(_loginUserName) + '</option>';
        for (var _i = 0; _i < _contactListCount; _i++) {
            var _curPerson = ContactList.getInstance().get(_i);
            var _curUserName = _curPerson.getUserName();
            var _curJid = _curPerson.getJid();
            _ret += '<option value="' + _curJid + '">' + Utils.convertEscapedHtml(_curUserName) + '</option>';
        }
        _ret += '</select>';
        _ret += '<br />';
        _ret += '<label for="task-start-date" class="task-dialog-label">' + Resource.getMessage('task_start_date') + '</label>';
        _ret += '<input id="dialog-task-start-date" name="task-start-date" class="task-dialog-item date-time-picker ui-corner-all" value="' + _taskStartDateStr + '">';
        _ret += '<br />';
        _ret += '<label for="task-due-date" class="task-dialog-label">' + Resource.getMessage('task_due_date') + '</label>';
        _ret += '<input id="dialog-task-due-date" name="task-due-date" class="task-dialog-item date-time-picker ui-corner-all" value="' + _taskDueDateStr + '">';
        _ret += '<br />';
        _ret += '<label for="task-status" class="task-dialog-label">' + Resource.getMessage('task_status') + '</label>';
        _ret += '<select id="dialog-task-status" class="task-dialog-item ui-corner-all">';
        _ret += '<option value="' + TaskMessage.STATUS_INBOX + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_INBOX) + '</option>';
        _ret += '<option value="' + TaskMessage.STATUS_ASSIGNING + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_ASSIGNING) + '</option>';
        _ret += '<option value="' + TaskMessage.STATUS_NEW + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_NEW) + '</option>';
        _ret += '<option value="' + TaskMessage.STATUS_DOING + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_DOING) + '</option>';
        _ret += '<option value="' + TaskMessage.STATUS_FINISHED + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_FINISHED) + '</option>';
        _ret += '<option value="' + TaskMessage.STATUS_REJECTED + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_REJECTED) + '</option>';
        _ret += '</select>';
        _ret += '<br />';
        _ret += '<label for="task-priority" class="task-dialog-label">' + Resource.getMessage('task_priority_title') + '</label>';
        _ret += '<select id="dialog-task-priority" class="task-dialog-item ui-corner-all">';
        _ret += '<option value="' + TaskMessage.PRIORITY_LOW + '">' + Resource.getMessage('task_priority_low') + '/option>';
        _ret += '<option value="' + TaskMessage.PRIORITY_MEDIUM + '">' + Resource.getMessage('task_priority_medium') + '</option>';
        _ret += '<option value="' + TaskMessage.PRIORITY_HIGH + '">' + Resource.getMessage('task_priority_high') + '</option>';
        _ret += '<option value="' + TaskMessage.PRIORITY_TOP + '">' + Resource.getMessage('task_priority_top') + '</option>';
        _ret += '</select>';
        _ret += '<br />';
        _ret += '</form>';
        _ret += '</div>';
        return _ret;
    };
    _proto._getTaskDialogDetailHtml = function() {
        var _self = this;
        var _ret = _self._getTaskDialogBasicHtml();
        return _ret;
    };
    _proto.showDialog = function() {
        this._dialogInnerElement.dialog('open');
    };
    _proto.isEmptyValue = function(value) {
        var _ret = false;
        if (value == null || ( typeof value == 'string' && value == '')) {
            _ret = true;
        }
        return _ret;
    };
})();
