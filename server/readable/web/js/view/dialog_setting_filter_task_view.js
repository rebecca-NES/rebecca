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
function DialogSettingFilterTaskView(title, columnInfo, ownerObj, parentColumn) {

    this._submitButtonTitle = DialogOkCancelView.LABEL_OK;
    this._dialogID = 'filter-task-input';

    this._columnInfo = columnInfo;
    this._ownerObj = ownerObj;

    this._parentColumn = parentColumn;

    DialogSettingView.call(this, title); 
};(function() {

    DialogSettingFilterTaskView.prototype = $.extend({}, DialogSettingView.prototype);

    var _super = DialogSettingView.prototype;

    var _proto = DialogSettingFilterTaskView.prototype;

    _proto._init = function() {

        var _self = this;

        _super._init.call(_self);

        var _rootElement = _self._dialogInnerElement;
        var _datepickerElement = _rootElement.find('input.date-picker');

        _datepickerElement.datepicker({
            showOn : "focus",
            dateFormat : Utils.DISPLAY_DATEPICKER_DATE_FORMAT,
            showButtonPanel: true
        });

        var _clientJid = null; 
        var _ownerJid = null; 
        var _statusArray = null; 
        var _priorityArray = null; 
        var _requestTypeArray = null; 
        var _demandStatusArray = null; 
        var _dueDateStr = null; 
        var _attachedFile = false;  
        var _havingUrl = false; 
        var _term = DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE; 

        var _setting = null;
        if(_self._columnInfo.getSetting != null && typeof _self._columnInfo.getSetting == 'function') {
            _setting = _self._columnInfo.getSetting();
        }
        if(_setting) {
            _clientJid = _setting.client;

            _ownerJid = _setting.owner;

            _statusArray = _setting.status;

            _priorityArray = _setting.priority;

            _requestTypeArray = _setting.request_type;

            _demandStatusArray = _setting.demand_status;

            _dueDateStr = _setting.due_date;

            _attachedFile = (_setting.attached_file != null)? _setting.attached_file : _attachedFile;

            _havingUrl = (_setting.having_url != null)? _setting.having_url : _havingUrl;

            _term = (_setting.term != null)? _setting.term : _term;
        }


        _self._setClientJid(_clientJid);

        _self._setOwnerJid(_ownerJid);

        _self._setStatusArray(_statusArray);

        _self._setPriorityArray(_priorityArray);

        _self._setRequestTypeArray(_requestTypeArray);

        _self._setDemandStatusArray(_demandStatusArray);

        _self._setDueDateStr(_dueDateStr);

        _self._setHavingAttachedFileCheckStatus(_attachedFile);

        _self._setHavingUrlCheckStatus(_havingUrl);

        _self._setTermData(_term);

        _self._createEventHandler();
    };

    _proto._displayFieldClient = function() {
        var _autoCompleteInfo = ViewUtils.getAutoCompleteAttributesFromColumnInfo(this._columnInfo);
        var _ret = "";
        _ret += '<li>';
        _ret += '  <label for="client">';
        _ret += '    <label class="checkbox checkbox_title">';
        _ret += '      <input type="checkbox" class="target" id="client" name="sender-checkbox">';
        _ret += '      <span></span>' + Resource.getMessage('task_client');
        _ret += '    </label>';
        _ret += '    <input type="text" class="field client-input ui-corner-all ' + _autoCompleteInfo.autoCompleteType + '" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '" ' + _autoCompleteInfo.roomIdAttribute + '>';
        _ret += '  </label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._displayFieldOwner = function() {
        var _autoCompleteInfo = ViewUtils.getAutoCompleteAttributesFromColumnInfo(this._columnInfo);
        var _ret = "";
        _ret += '<li>';
        _ret += '  <label for="owner">';
        _ret += '    <label class="checkbox checkbox_title">';
        _ret += '      <input type="checkbox" class="target" id="owner" name="sender-checkbox">';
        _ret += '      <span></span>' + Resource.getMessage('task_owner');
        _ret += '    </label>';
        _ret += '    <input type="text" class="field owner-input ui-corner-all ' + _autoCompleteInfo.autoCompleteType + '" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '" ' + _autoCompleteInfo.roomIdAttribute + '>';
        _ret += '  </label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._displayFieldStatus = function() {

        var _ret = "";
        _ret += '<li>';
        _ret += '<label for="status">';
        _ret += '  <label class="checkbox checkbox_title"><input type="checkbox" class="target" id="status"><span></span>' + Resource.getMessage('task_status') + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="status" value="' + TaskMessage.STATUS_ASSIGNING + '"><span></span>' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_ASSIGNING) + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="status" value="' + TaskMessage.STATUS_NEW + '"><span></span>' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_NEW) + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="status" value="' + TaskMessage.STATUS_DOING + '"><span></span>' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_DOING) + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="status" value="' + TaskMessage.STATUS_FINISHED + '"><span></span>' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_FINISHED) + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="status" value="' + TaskMessage.STATUS_REJECTED + '"><span></span>' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_REJECTED) + '</label>';
        _ret += '</label>';
        _ret += '</li>';
        return _ret;
    };

    _proto._displayFieldPriority = function() {

        var _ret = "";
        _ret += '<li>';
        _ret += '<label for="priority">';
        _ret += '  <label class="checkbox checkbox_title"><input type="checkbox" class="target" id="priority"><span></span>' + Resource.getMessage('task_priority_title') + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="priority" value="' + TaskMessage.PRIORITY_TOP + '"><span></span>' + ViewUtils.taskPriorityNumToStr(TaskMessage.PRIORITY_TOP) + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="priority" value="' + TaskMessage.PRIORITY_HIGH + '"><span></span>' + ViewUtils.taskPriorityNumToStr(TaskMessage.PRIORITY_HIGH) + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="priority" value="' + TaskMessage.PRIORITY_MEDIUM + '"><span></span>' + ViewUtils.taskPriorityNumToStr(TaskMessage.PRIORITY_MEDIUM) + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="priority" value="' + TaskMessage.PRIORITY_LOW + '"><span></span>' + ViewUtils.taskPriorityNumToStr(TaskMessage.PRIORITY_LOW) + '</label>';
        _ret += '</label>';
        _ret += '</li>';
        return _ret;
    };

    _proto._displayFieldRequestType = function() {

        var _ret = "";

        _ret += '<li>';
        _ret += '<label for="request_type">';
        _ret += '  <label class="checkbox checkbox_title"><input type="checkbox" class="target" id="request_type"><span></span>' + Resource.getMessage('task_request_type') + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="request_type" value="client"><span></span>' + Resource.getMessage('task_request_type_client') + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="request_type" value="owner"><span></span>' + Resource.getMessage('task_request_type_owner') + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" name="request_type" value="self"><span></span>' + Resource.getMessage('task_request_type_self') + '</label>';
        _ret += '</label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._displayFieldDemandStatus = function() {

        var _ret = "";

        _ret += '<li>';
        _ret += '<label for="demand_status">';
        _ret += '  <label class="checkbox checkbox">';
        _ret += '    <input type="checkbox" id="demand_status" name="demand_status" value="1">';
        _ret += '    <span></span>' + Resource.getMessage('task_demand_status') ;
        _ret += '  </label>';
        _ret += '</label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._displayFieldDueDate = function() {

        var _ret = "";
        _ret += '<li>';
        _ret += '<label for="due_date">';
        _ret += '    <label class="checkbox checkbox_title"><input type="checkbox" class="target" id="due_date"><span></span>' + Resource.getMessage('task_due_date_date') + '</label>';
        _ret += '    <input type="text" class="field task-due-date task-register-item ui-corner-all date-picker">' + Resource.getMessage('task_due_date_to');
        _ret += '</label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._displayFieldUrl = function() {
        var _self = this;
        var _ret = '';

        _ret += '<li>';
        _ret += '<div>';
        _ret += '  <span class="name">' + Resource.getMessage('custom_filter_label_having_attached_file_and_url') + '</span>';
        _ret += '    <label class="checkbox checkbox_btn"><input type="checkbox" id="having-attached-file-checkbox" name="having-attached-file" value="' + DialogSettingCustomFilterView.SETTING_VALUE_HAVING_ATTACHED_FILE + '"><span></span>' + Resource.getMessage('custom_filter_label_having_attached_file') + '</label>';
        _ret += '    <label class="checkbox checkbox_btn"><input type="checkbox" id="having-url-checkbox" name="having-url" value="' + DialogSettingCustomFilterView.SETTING_VALUE_HAVING_ATTACHED_FILE + '"><span></span>' + Resource.getMessage('custom_filter_label_having_url') + '</label>';
        _ret += '  </div>';
        _ret += '</li>';

        return _ret;
    };

    _proto._displayFieldTerm = function() {
        var _self = this;
        var _ret = '';

        _ret += '<li>';
        _ret += '<label for="termCheckbox">';
        _ret += '  <label class="checkbox checkbox_title">';
        _ret += '    <input type="checkbox" class="target" id="termCheckbox" name="term-checkbox" value="1">';
        _ret += '    <span></span>' + Resource.getMessage('task_created_term');
        _ret += '  </label>';
        _ret += '  <select class="field term-select ui-corner-all">';
          var _termDataArray = DialogSettingCustomFilterView.TERM_DATA_ARRAY;
          for(var _i = 0; _i < _termDataArray.length; _i++) {
              var _termData = _termDataArray[_i];
              var _selected = ((_i == 0) ? 'selected' : '');
              _ret += '<option value="' + _termData.value + '" ' + _selected + ' style="margin-top:0;">' + _termData.label + '</option>';
          }
        _ret += '  </select>';
        _ret += '</label>';
        _ret += '</li>';

        return _ret;
    };

    _proto.displaySubmitButton = function() {
      var _self = this;
      var _ret = '';

      _ret += '<div class="btn_wrapper">';
      _ret += '  <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
      _ret += '  <button type="button" id="task_filter_btn" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">OK</span></button>';
      _ret += '</div>';
      _ret += '<a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';

      return _ret;
    }

    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        _rootElement.on('click', '#task_filter_btn', function() {
            _self.submit(_self._dialogAreaElement);
        });
    }

    _proto.submit = function(dialogObj) {
        var _self = this;
        _self._searchExecute();
    };

    _proto._searchExecute = function() {

        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        _self._checkKeyword(_rootElement, _onCheckKeyword);

        function _onCheckKeyword(result) {
            if (result == false) {
                return;
            }

            var _statusArray = _self._getStatusArray();

            var _priorityArray = _self._getPriorityArray();

            var _requestTypeArray = _self._getRequestTypeArray();

            var _demandStatusArray = _self._getDemandStatusArray();

            var _dueDate = _self._getDueDate();

            var _havingAttachedFileCheckState = _self._getHavingAttachedFileCheckState();
            var _havingUrlCheckState = _self._getHavingUrlCheckState();

            var _term = _self._getTermSettingData();

            var _filterColumnInformation = new CustomFilterColumnInfomation();
            _filterColumnInformation.setSourceColumnDisplayName(_self._getDisplayName());

            var _setting = {};

            var _colmunTypeFilter;
            var _sourceColumnType = null;
            var _beginningColumnType = null;

            var _isEdit = false;
            if(_self._columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
                _sourceColumnType = _self._columnInfo.getSourceColumnType();
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _beginningColumnType = _self._columnInfo.getBeginningColumnType();
                }
                _isEdit = true;
            } else {
                _sourceColumnType = _self._columnInfo.getColumnType();
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _beginningColumnType = _self._columnInfo.getSourceColumnType();
                }
            }

            _filterColumnInformation.setSourceColumnType(_sourceColumnType);
            if(_beginningColumnType != null) {
                _filterColumnInformation.setBeginningColumnType(_beginningColumnType);
            }

            var _subData = {};
            if(_isEdit) {
                _subData = _self._columnInfo.getSubData();
            } else {
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_CHAT) {
                    _subData.partner = _self._columnInfo.getFilterCondition();
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                    var _roomInfo = _self._columnInfo.getChatRoomInfomation();
                    var _roomId = _roomInfo.getRoomId();
                    _subData.roomId = _roomId;
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED){
                    var _roomInfo = _self._columnInfo.getCommunityInfomation();
                    var _roomId = _roomInfo.getRoomId();
                    _subData.roomId = _roomId;
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
                    var _communityInfo = _self._columnInfo.getCommunityInfomation();
                    var _roomId = _communityInfo.getRoomId();
                    _subData.roomId = _roomId;
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _subData = CustomFilterColumnInfomation.copySubData(_self._columnInfo.getSubData());
                }
            }
            _filterColumnInformation.setSubData(_subData);
            if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                var _keywordStr = _self._columnInfo.getKeyword();
                var _narrowFilterCondition = ColumnFilterManager.getColumnFilter(_beginningColumnType, _subData);
                var _searchKeywordFilter = ViewUtils.getKeywordFilterFromKeywordInputString(_keywordStr);
                _colmunTypeFilter = new AndCondition();
                _colmunTypeFilter.addChildCondition(_narrowFilterCondition);
                _colmunTypeFilter.addChildCondition(_searchKeywordFilter);

                _filterColumnInformation.setKeyword(_keywordStr);
            } else {
                _colmunTypeFilter = ColumnFilterManager.getColumnFilter(_sourceColumnType, _subData);
            }
            if(_colmunTypeFilter == null) {
                return;
            }

            var _columnFilter;
            if(_self._isTargetClient() ||
                    _self._isTargetOwner() ||
                    _self._isTargetStatus() ||
                    _self._isTargetPriority() ||
                    _self._isTargetRequestType() ||
                    _demandStatusArray.length > 0 ||
                    _self._isTargetDueDate() ||
                    _havingAttachedFileCheckState ||
                    _havingUrlCheckState ||
                    _term != DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE) {

                _columnFilter = new AndCondition();

                if(_self._isTargetClient()) {
                    var _clientJid = _self._clientJid;
                    var _itemCondition = new ItemCondition();
                    _itemCondition.setData('client', _clientJid);
                    _columnFilter.addChildCondition(_itemCondition);

                    _setting.client   = _clientJid;
                }

                if(_self._isTargetOwner()) {
                    var _ownerJid = _self._ownerJid;
                    var _particularCondition = ParticularCondition.createTaskOwnerCondition(_ownerJid);
                    _columnFilter.addChildCondition(_particularCondition);

                    _setting.owner = _ownerJid;
                }

                if(_self._isTargetStatus()) {

                    var _statusCondition;
                    if(_statusArray.length == 1) {

                        var _itemCondition = new ItemCondition();
                        _itemCondition.setData('status', _statusArray[0]);
                        _statusCondition = _itemCondition;
                    }
                    else {
                        _statusCondition = new OrCondition();

                        for(var _i=0; _i<_statusArray.length; _i++) {

                            var _itemCondition = new ItemCondition();
                            _itemCondition.setData('status', _statusArray[_i]);
                            _statusCondition.addChildCondition(_itemCondition);
                        }
                    }
                    _columnFilter.addChildCondition(_statusCondition);

                    _setting.status = _statusArray;
                }

                if(_self._isTargetPriority()) {
                    var _priorityCondition;
                    if(_priorityArray.length == 1) {
                        var _itemCondition = new ItemCondition();
                        _itemCondition.setData('priority', _priorityArray[0]);
                        _priorityCondition = _itemCondition;
                    }
                    else {
                        _priorityCondition = new OrCondition();

                        for(var _i=0; _i<_priorityArray.length; _i++) {

                            var _itemCondition = new ItemCondition();
                            _itemCondition.setData('priority', _priorityArray[_i]);
                            _priorityCondition.addChildCondition(_itemCondition);
                        }
                    }
                    _columnFilter.addChildCondition(_priorityCondition);

                    _setting.priority = _priorityArray;
                }

                if(_self._isTargetRequestType()) {

                    var _loginJid = LoginUser.getInstance().getJid();

                    if(_requestTypeArray.length == 1) {

                        var _particularCondition = null;
                        switch(_requestTypeArray[0]) {
                        case 'client':
                            _particularCondition = ParticularCondition.createTaskRequestingCondition(_loginJid);
                            break;
                        case 'owner':
                            _particularCondition = ParticularCondition.createTaskRequestedCondition(_loginJid);
                            break;
                        case 'self':
                            _particularCondition = ParticularCondition.createTaskSelfCondition(_loginJid);
                            break;
                        default:
                            break;
                        }
                        if(_particularCondition != null) {
                            _columnFilter.addChildCondition(_particularCondition);
                        }
                    } else {
                        var _orCondition = new OrCondition();
                        for(var _i=0; _i<_requestTypeArray.length; _i++) {
                            var _particularCondition = null;
                            switch(_requestTypeArray[_i]) {
                            case 'client':
                                _particularCondition = ParticularCondition.createTaskRequestingCondition(_loginJid);
                                break;
                            case 'owner':
                                _particularCondition = ParticularCondition.createTaskRequestedCondition(_loginJid);
                                break;
                            case 'self':
                                _particularCondition = ParticularCondition.createTaskSelfCondition(_loginJid);
                                break;
                            default:
                                break;
                            }
                            if(_particularCondition == null) {
                                continue;
                            }
                            _orCondition.addChildCondition(_particularCondition);
                        }
                        _columnFilter.addChildCondition(_orCondition);
                    }

                    _setting.request_type = _requestTypeArray;
                }

                if(_demandStatusArray.length > 0) {
                    var _demandStatusCondition;
                    if(_demandStatusArray.length == 1) {
                        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK){
                            var _loginJid = LoginUser.getInstance().getJid();
                            var _particularCondition = ParticularCondition.createCommunityTaskDemandedCondition(_loginJid);
                            if(_particularCondition != null) {
                                _demandStatusCondition = _particularCondition;
                            }
                        }else{
                            var _itemCondition = new ItemCondition();
                            _itemCondition.setData('demand_status', _demandStatusArray[0]);
                            _demandStatusCondition   = _itemCondition;
                        }
                    }
                    else {
                        _demandStatusCondition = new OrCondition();

                        for(var _i=0; _i<_demandStatusArray.length; _i++) {

                            var _itemCondition = new ItemCondition();
                            _itemCondition.setData('demand_status', _demandStatusArray[_i]);
                            _demandStatusCondition.addChildCondition(_itemCondition);
                        }
                    }
                    _columnFilter.addChildCondition(_demandStatusCondition);

                    _setting.demand_status = _demandStatusArray;
                }

                if(_self._isTargetDueDate()) {

                    var _nextDayStr = Date.create(_dueDate).addDays(1).format('{yyyy}/{MM}/{dd} 00:00:00');

                    var _condition = new LessThanCondition();
                    _condition.setData('due_date', _nextDayStr);
                    _columnFilter.addChildCondition(_condition);

                    _setting.due_date = _dueDate;
                }
                if(_havingAttachedFileCheckState == true || _havingUrlCheckState == true) {
                    var _attachedFileAndHavingUrlSettingFilterCondition = CustomFilterSetting.createAttachedFileAndHavingUrlSettingFilterCondition(_havingAttachedFileCheckState, _havingUrlCheckState);
                    if(_attachedFileAndHavingUrlSettingFilterCondition != null) {
                        _columnFilter.addChildCondition(_attachedFileAndHavingUrlSettingFilterCondition);
                    }
                }
                _setting.attached_file = _havingAttachedFileCheckState;
                _setting.having_url = _havingUrlCheckState;

                if(_term != DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE) {
                    var _termSettingFilterCondition = CustomFilterSetting.createTermSettingFilterCondition(_term);
                    if(_termSettingFilterCondition != null) {
                        _columnFilter.addChildCondition(_termSettingFilterCondition);
                    }
                }
                _setting.term = _term;

                _columnFilter.addChildCondition(_colmunTypeFilter);
            } else {
                _columnFilter = _colmunTypeFilter;
            }

            var _columnSort = new ViewUtils.getTaskDefaultSortCondition();
            var _columnSearchCondition = new ColumnSearchCondition(_columnFilter, _columnSort);

            _filterColumnInformation.setSearchCondition(_columnSearchCondition);

            _filterColumnInformation.setSetting(_setting);

            if(_self._parentColumn == null) {

                ColumnManager.getInstance().insertAfterColumn(_filterColumnInformation, _self._ownerObj, true, true);
            }

            else {
                _self._parentColumn.searchAgain(_filterColumnInformation);
            }

            ViewUtils.modal_allexit();
        }
    };

    _proto._getDisplayName = function()
    {
        var _self = this;
        var _displayName = _self._columnInfo.getDisplayName();

        var _columnType = _self._columnInfo.getColumnType();
        if (_columnType == ColumnInformation.TYPE_COLUMN_TASK || _columnType == ColumnInformation.TYPE_COLUMN_INBOX) {
            _displayName = ViewUtils.createDisplayName(_self._columnInfo);
        }
        return _displayName;
    };

    _proto._checkKeyword = function(filterFormObj, callback) {
        var _self = this;
        if (!filterFormObj || typeof filterFormObj != 'object') {
            return false;
        }

        var _ret = true;

        var _statusArray = this._getStatusArray();

        var _priorityArray = this._getPriorityArray();

        var _requestTypeArray = this._getRequestTypeArray();

        var _demandStatusArray = this._getDemandStatusArray();

        var _dueDate = this._getDueDate();

        filterFormObj.find("#dialog-error").text('');

        var _invalidTextArray = new Array();
        var _invalidCheckboxArray = new Array();

        if(this._isTargetStatus()) {

            if(_statusArray.length == 0) {

                _invalidCheckboxArray.push(Resource.getMessage('task_status'));

                _ret = false;
            }
        }

        if(this._isTargetPriority()) {

            if(_priorityArray.length == 0) {

                _invalidCheckboxArray.push(Resource.getMessage('task_priority_title'));

                _ret = false;
            }
        }

        if(this._isTargetRequestType()) {

            if(_requestTypeArray.length == 0) {

                _invalidCheckboxArray.push(Resource.getMessage('task_request_type'));

                _ret = false;
            }
        }


        if(this._isTargetDueDate()) {

            if (_dueDate == null) {

                filterFormObj.find('input.task-due-date').addClass('input-error');
                _invalidTextArray.push(Resource.getMessage('task_due_date_date'));

                _ret = false;
            }
        }



        _self._getClientJid(_onGetClientJid);

        function _onGetClientJid(clientJid) {
            if(_self._isTargetClient()) {

                if (clientJid == null || clientJid == '' || Utils.trimStringMulutiByteSpace(clientJid) == '') {

                    filterFormObj.find('input.client-input').addClass('input-error');
                    _invalidTextArray.push(Resource.getMessage('task_client'));

                    _ret = false;
                } else {
                    _self._clientJid = clientJid;
                }
            }
            _ownerCheck();
        }

        function _ownerCheck() {
            _self._getOwnerJid(_onGetOwnerJid);
            function _onGetOwnerJid(ownerJid) {
                if(_self._isTargetOwner()) {

                    if (ownerJid == null || ownerJid == '' || Utils.trimStringMulutiByteSpace(ownerJid) == '') {

                        filterFormObj.find('input.owner-input').addClass('input-error');
                        _invalidTextArray.push(Resource.getMessage('task_owner_edit'));

                        _ret = false;
                    } else {
                        _self._ownerJid = ownerJid;
                    }
                }
                _onCheckFinish();
            }
        }

        function _onCheckFinish() {
            if(_ret == false) {

                var _errorStr = '';

                if(_invalidTextArray.length > 0) {

                    var _invalidTextStr = '';
                    for(var _i=0; _i<_invalidTextArray.length; _i++) {

                        if(_i > 0) {
                            _invalidTextStr += ', ';
                        }

                        _invalidTextStr += _invalidTextArray[_i];
                    }
                    _errorStr += _invalidTextStr + Resource.getMessage('dialogerrorTaskFilterText');
                }

                if(_invalidCheckboxArray.length > 0) {

                    var _invalidCheckboxStr = '';
                    for(var _i=0; _i<_invalidCheckboxArray.length; _i++) {

                        if(_i > 0) {
                            _invalidCheckboxStr += ', ';
                        }

                        _invalidCheckboxStr += _invalidCheckboxArray[_i];
                    }
                    _errorStr += _invalidCheckboxStr + Resource.getMessage('dialogerrorTaskFilterCheckbox');
                }

                filterFormObj.find("#dialog-error").text(_errorStr);
            }
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(_ret);
                }, 1);
            }
        }
    };

    _proto._getClientJid = function(callback) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('.client-input');

        var _account = Utils.trimStringMulutiByteSpace(_element.val());

        ViewUtils.convertAccountStrToJidStrFromServer(_account, _onConvertAccountStrToJidStr);
        function _onConvertAccountStrToJidStr(jid) {
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(jid);
                }, 1);
            }
        }
    };

    _proto._setClientJid = function(_clientJid) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="client"]');
        if(_clientJid) {
            _fieldsetElement.find('input#client').prop('checked',true);
            ViewUtils.convertJidStrToAccountStrFromServer(_clientJid, function(clientAccount) {
                _fieldsetElement.find('.client-input').val(clientAccount);
            });
        } else {
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        }
    };

    _proto._getOwnerJid = function(callback) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('.owner-input');
        var _account = Utils.trimStringMulutiByteSpace(_element.val());

        ViewUtils.convertAccountStrToJidStrFromServer(_account, _onConvertAccountStrToJidStr);
        function _onConvertAccountStrToJidStr(jid) {
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(jid);
                }, 1);
            }
        }
    };

    _proto._setOwnerJid = function(_ownerJid) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="owner"]');
        if(_ownerJid) {
            _fieldsetElement.find('input#owner').prop('checked',true);
            ViewUtils.convertJidStrToAccountStrFromServer(_ownerJid, function(ownerAccount) {
                _fieldsetElement.find('.owner-input').val(ownerAccount);
            });
        } else {
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        }
    };

    _proto._getStatusArray = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _checked = _rootElement.find('input[name=status]:checked');

        return _checked.map(function(){ return parseInt($(this).val()); }).get();
    };

    _proto._setStatusArray = function(_statusArray) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="status"]');

        if(_statusArray) {
            _fieldsetElement.find('input#status').prop('checked',true);

            for(var _i=0; _i<_statusArray.length; _i++) {

                _fieldsetElement.find('input[name=status][value=' + _statusArray[_i] + ']').prop('checked',true);
            }
        } else {
            _fieldsetElement.find('input[name=status]').prop('checked',true);
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        }
    };

    _proto._getPriorityArray = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _checked = _rootElement.find('input[name=priority]:checked');

        return _checked.map(function(){ return parseInt($(this).val()); }).get();
    };

    _proto._setPriorityArray = function(_priorityArray) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="priority"]');

        if(_priorityArray) {
            _fieldsetElement.find('input#priority').prop('checked',true);

            for(var _i=0; _i<_priorityArray.length; _i++) {
                _fieldsetElement.find('input[name=priority][value=' + _priorityArray[_i] + ']').prop('checked',true);
            }
        } else {
            _fieldsetElement.find('input[name=priority]').prop('checked',true);
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        }
    };

    _proto._getRequestTypeArray = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _checked = _rootElement.find('input[name=request_type]:checked');

        return _checked.map(function(){ return $(this).val(); }).get();
    };

    _proto._setRequestTypeArray = function(_requestTypeArray) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="request_type"]');

        if(_requestTypeArray) {
            _fieldsetElement.find('input#request_type').prop('checked',true);

            for(var _i=0; _i<_requestTypeArray.length; _i++) {
                _fieldsetElement.find('input[name=request_type][value=' + _requestTypeArray[_i] + ']').prop('checked',true);
            }
        } else {
            _fieldsetElement.find('input[name=request_type]').prop('checked',true);
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        }
    };

    _proto._getDemandStatusArray = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _checked = _rootElement.find('input[name=demand_status]:checked');

        return _checked.map(function(){ return parseInt($(this).val()); }).get();
    };

    _proto._setDemandStatusArray = function(_demandStatusArray) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="demand_status"]');

        if(_demandStatusArray) {
            _fieldsetElement.find('input[name=demand_status]').prop('checked',true);
        }
    };

    _proto._getDueDate = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('.task-due-date');

        var _str = Utils.trimStringMulutiByteSpace(_element.val());

        var match = _str.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
        if(match == null) {
            return null;
        }

        return Date.create(_str);
    };

    _proto._setDueDateStr = function(_dueDateStr) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="due_date"]');

        if(_dueDateStr) {
            _fieldsetElement.find('input#due_date').prop('checked',true);

            var _str = Date.create(_dueDateStr).format('{yyyy}/{MM}/{dd}');
            _fieldsetElement.find('.task-due-date').val(_str);
        } else {
            var _str = Date.create('today').format('{yyyy}/{MM}/{dd}');
            _fieldsetElement.find('.task-due-date').val(_str);
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        }
    };

    _proto._getHavingAttachedFileCheckState = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('input#having-attached-file-checkbox:checked');
        return (_element.length > 0)? true: false;
    };
    _proto._setHavingAttachedFileCheckStatus = function(havingAttachedFileCheckSatus) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        if(havingAttachedFileCheckSatus) {
            _rootElement.find('input#having-attached-file-checkbox').prop('checked',true);
        }
    };
    _proto._getHavingUrlCheckState = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('input#having-url-checkbox:checked');
        return (_element.length > 0)? true: false;
    };
    _proto._setHavingUrlCheckStatus = function(havingUrlCheckSatus) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        if(havingUrlCheckSatus) {
            _rootElement.find('input#having-url-checkbox').prop('checked',true);
        }
    };
    _proto._getTermSettingData = function() {
        var _self = this;
        var _ret = DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE;
        if(_self._isTargetTerm()) {
            _ret = _self._getTermData();
        }
        return _ret;
    };
    _proto._getTermData = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _termValueStr = _rootElement.find('select.term-select').val();
        return parseInt(_termValueStr);
    };
    _proto._setTermData = function(termDataValue) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="termCheckbox"]');
        if(termDataValue == DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE) {
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        } else {
            _fieldsetElement.find('input#termCheckbox').prop('checked',true);
            _fieldsetElement.find('select.term-select').val(termDataValue);
        }
    };
    _proto._isTargetClient = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="client"]');
        return _fieldsetElement.find('input#client').is(':checked');
    };

    _proto._isTargetOwner = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="owner"]');
        return _fieldsetElement.find('input#owner').is(':checked');
    };

    _proto._isTargetStatus = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="status"]');
        return _fieldsetElement.find('input#status').is(':checked');
    };

    _proto._isTargetPriority = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="priority"]');
        return _fieldsetElement.find('input#priority').is(':checked');
    };

    _proto._isTargetRequestType = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="request_type');
        return _fieldsetElement.find('input#request_type').is(':checked');
    };

    _proto._isTargetDueDate = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="due_date');
        return _fieldsetElement.find('input#due_date').is(':checked');
    };
    _proto._isTargetTerm = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="termCheckbox');
        return _fieldsetElement.find('input#termCheckbox').is(':checked');
    };
})();
