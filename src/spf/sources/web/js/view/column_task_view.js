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

function ColumnTaskView(columnInformation) {
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_TASK;
    this._displayName = ColumnView.DISPLAY_NAME_MY_TASK;
    this.createView();

    this._unfinishedTaskCount = -1;
    this._readAllUnfinishedTask = false;
    this._demandTaskItemIds = new StringMapedArrayList();
    columnInformation.setIconImage('images/column_task.png');
};(function() {
    ColumnTaskView.cssClass = 'task-message';

    ColumnTaskView.UNKNOWN_TASK = 0;
    ColumnTaskView.UNFINISHED_TASK = 1;
    ColumnTaskView.FINISHED_TASK = 2;

    ColumnTaskView.prototype = $.extend({}, ColumnView.prototype);
    var _super = ColumnView.prototype;
    var _proto = ColumnTaskView.prototype;

    _proto.createView = function() {
        var _self = this;
        var columnInfo = this.getColumnInfo();
        if (columnInfo == null || typeof columnInfo != 'object') {
            return;
        }
        var _columnType = _self.getType();
        var displayName = ViewUtils.createDisplayName(columnInfo);
        columnInfo.setDisplayName(displayName);
        var FormAreaHtml = '';
        FormAreaHtml += ColumnSubmitButtonView.getHtml(_columnType);
        this.createHtml(FormAreaHtml);
    };
    _proto._createSubForms = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        _htmlElem.find('div.frm-message > button').before(ColumnSubmitButtonView.getHtml(ColumnInformation.TYPE_COLUMN_TASK));
        var _btnElement = _htmlElem.find('div.frm-message > button');
        var _reloadBtnElement = _btnElement.eq(0);
        var _taskAddBtnElement = _btnElement.eq(1);
        _self._buttonList = new ArrayList();
        _self._buttonList.add(new ColumnSubmitButtonView(_taskAddBtnElement, _self, Resource.getMessage('task_registerTask_btn') ));
        _self._buttonList.add(new ColumnReloadButtonView(_reloadBtnElement, _self,  Resource.getMessage('task_reloadTask_btn') ));
    };
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _filterCondition = new TaskFilterAndSortCondition();
        var _filter = _filterCondition.getFilterObject(_columnInfo.getFilterCondition());
        var _sort = _filterCondition.getSortObject(_columnInfo.getFilterCondition());
        function onGetTaskHistoryMessageCallback(taskMessageList, unfinishedTaskCount) {
            if (taskMessageList.getCount() < 20) {
                _self._allMessageReceived = true;
            }
            _self._onGetTaskHistoryMessage(taskMessageList, unfinishedTaskCount);
            $(window).trigger('resize');
            _self.refreshScrollbar();
            _self._disableBottomEvent = false
        }
        _self._disableBottomEvent = true
        CubeeController.getInstance().getTaskMessages(_self._currentLoadedItemId, 20, _filter, _sort, onGetTaskHistoryMessageCallback);
    };
    _proto.cleanup = function() {
        var _self = this;
        _super.cleanup.call(_self);
        if(_self._buttonList){
            _self._buttonList.removeAll();
            delete _self._buttonList;
        }
    };
    _proto.getFinishType = function(status) {
        var _self = this;
        var _ret = ColumnTaskView.UNKNOWN_TASK;
        if (status == null || typeof status != 'number') {
            return _ret;
        }
        switch(status) {
            case TaskMessage.STATUS_INBOX:
            case TaskMessage.STATUS_ASSIGNING:
            case TaskMessage.STATUS_NEW:
            case TaskMessage.STATUS_DOING:
            case TaskMessage.STATUS_SOLVED:
            case TaskMessage.STATUS_FEEDBACK:
                _ret = ColumnTaskView.UNFINISHED_TASK;
                break;
            case TaskMessage.STATUS_FINISHED:
            case TaskMessage.STATUS_REJECTED:
                _ret = ColumnTaskView.FINISHED_TASK;
                break;
            default:
                break;
        }
        return _ret;
    };
    ColumnTaskView.getStatusListHtml = function(owner, client) {
        var _ret = '';
        if (client == "" || owner == client) {
            _ret += '<option value="' + TaskMessage.STATUS_NEW + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_NEW) + '</option>';
            _ret += '<option value="' + TaskMessage.STATUS_DOING + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_DOING) + '</option>';
            _ret += '<option value="' + TaskMessage.STATUS_FINISHED + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_FINISHED) + '</option>';
            _ret += '<option value="' + TaskMessage.STATUS_REJECTED + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_REJECTED) + '</option>';
        } else {
            _ret += '<option value="' + TaskMessage.STATUS_ASSIGNING + '">' + ViewUtils.taskStatusNumToStr(TaskMessage.STATUS_ASSIGNING) + '</option>';
        }
        return _ret;
    };
    _proto.clickSubFormButton = function() {
        var _self = this;
        var taskMessage = new TaskMessage();
        var register = new TaskRegister(_self, taskMessage, TaskRegister.mode_add);
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _taskRegisterForm = register.getRegisterForm();
        var _dialogAreaElement = $('#modal_area');
        _dialogAreaElement.html(_taskRegisterForm);
        var _dialogInnerElement = _dialogAreaElement.children();
        _dialogAreaElement.css('display', 'block');
        _dialogAreaElement.prepend('<div class="overlay modal_exit"></div>');
        _dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        $('.overlay').animate({ 'opacity':0.3}, 200 );
    }
    _proto._endSubformEditMode = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var subFormDiv = _htmlElem.find('div.frm-message');
        _self._hideTaskEditView(subFormDiv);
        _self._showSubForm(subFormDiv);
        View.getInstance().resizeContent();
    }
    _proto._showSubForm = function(subForm) {
        var _self = this;
        $(subForm).css('height', '');
        $(subForm).children('button').removeClass('display-none');
    }
    _proto._hideTaskEditView = function(subForm) {
        var _self = this;
        $(subForm).children('div.task-register-area').remove();
    }
    _proto.onTaskRegist = function(register){
        var _self = this;
        register.registTask(_callback);
        function _callback(result) {
            if(result) {
                ViewUtils.modal_allexit();
                _self.showUpdateMessage(register.getRegistedMessageData());
            }
        };
    };
    _proto.onTaskEditCancel = function() {
        var _self = this;
        _self._endSubformEditMode();
    };
    _proto.clickReloadButton = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _taskMessageElement = _self.getColumnContent().children('div').not('.' + ViewUtils.LOADING_ICON_CLASS_NAME);
        _self._currentLoadedItemId = 0;
        var _hash = _self._getMsgObjHash();
        for (var key in _hash) {
            _hash[key].cleanup();
            delete _hash[key];
        }
        _self._getMsgObjIndexList().removeAll();
        _self._demandTaskItemIds.removeAll();
        _taskMessageElement.remove();
        _self._hideLoadingIconInSelf();
        _self._allMessageReceived = false;
        _self._readAllUnfinishedTask = false;
        _self._unfinishedTaskCount = -1;
        _self.updateColumnTitle(_self._unfinishedTaskCount);
        _super._LoadingIcon(_self,'div.wrap-frm-message');
        _self.getHistoryMessage();
    };
    _proto.onAddMessageReceive = function(message) {
        var _self = this;
        if (_self._validation({'object' : message}) == false) {
            return;
        }
        _self.onAddTaskMessageReceive(message);
    };
    _proto.onUpdateMessageReceive = function(message) {
        var _self = this;
        if (_self._validation({'object' : message}) == false) {
            return;
        }
        _self.onUpdateTaskMessageReceive(message);
    };
    _proto.onAddTaskMessageReceive = function(taskMessage) {
        var _self = this;
        if (taskMessage == null) {
            return;
        }

        var _isShow = true;
        if (taskMessage.getType() == Message.TYPE_TASK && _self.isMuchFilterCondition(taskMessage)) {
            var _itemId = taskMessage.getItemId();
            if (_self.getMsgObjByItemId(_itemId)) {
                return;
            }
            var _status = taskMessage.getStatus();
            if (_status > TaskMessage.STATUS_UNKNOWN && _status < TaskMessage.STATUS_FINISHED) {
                _self._unfinishedTaskCount++;
                var _columnType =  _self.getType();
                var _isAssigning = _self.isAssigningTask(taskMessage);
                if ((_columnType == ColumnInformation.TYPE_COLUMN_TASK) && (_isAssigning == true)) {
                    _isShow = false;
                    _self._unfinishedTaskCount--;
                }
                _self.updateColumnTitle(_self._unfinishedTaskCount);
            }
        }
        if (_isShow) {
            _self.showMessage(taskMessage);
        }
    };
    _proto.onUpdateTaskMessageReceive = function(taskMessage) {
        var _self = this;
        if (taskMessage == null || typeof taskMessage != 'object') {
            return;
        }
        var _itemId = taskMessage.getItemId();
        if (!_itemId) {
            return;
        }
        var _parentItemId = taskMessage.getParentItemId();
        if (_parentItemId != null && _parentItemId != '') {
            var _posParent = _self.getMsgObjIndexPositionByItemId(_parentItemId);
            if (_posParent > -1) {
                var _parentTaskMessage = CubeeController.getInstance().getMessage(_parentItemId);
                if (_parentTaskMessage != null) {
                    _parentTaskMessage.setPreStatus(_parentTaskMessage.getStatus());
                    _parentTaskMessage.setPreOwnerJid(_parentTaskMessage.getOwnerJid());
                    _self.onUpdateTaskMessageReceive(_parentTaskMessage);
                }
            }
        }
        var _pos = _self.getMsgObjIndexPositionByItemId(_itemId);
        if (_pos == -1) {
            if (_self.isNeedShowTask(taskMessage) == true) {
                _self.onAddTaskMessageReceive(taskMessage);
            }
            return;
        }
        _pos = _self.getMsgObjIndexPositionByItemId(_itemId);
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _columnContent = _htmlElem.children('div.column-content');
        var _targetMsgObj = _self.getParentMsgObjByPosition(_pos);
        var _targetMsgElm = _targetMsgObj.getHtmlElement();
        var _targetMsgItemId = _targetMsgObj.getMessage().getItemId();
        _self.removeMsgObjIndexByItemIdNoCleanupMessage(_targetMsgItemId);

        var _preStatus = taskMessage.getPreStatus();
        var _newStatus = taskMessage.getStatus();

        _self._removeTaskMessageElement(_targetMsgElm, _newStatus);

        if (_preStatus > TaskMessage.STATUS_UNKNOWN && _preStatus < TaskMessage.STATUS_FINISHED) {
            if (_self._unfinishedTaskCount > 0) {
                _self._unfinishedTaskCount--;
            }
        }
        if (_newStatus > TaskMessage.STATUS_UNKNOWN && _newStatus < TaskMessage.STATUS_FINISHED) {
            _self._unfinishedTaskCount++;
        }
        _self.updateColumnTitle(_self._unfinishedTaskCount);
        _self._showMessageData(taskMessage);
    };
    _proto._removeTaskMessageElement = function(targetMessageElment, taskStatus) {
        var _self = this;
        if (targetMessageElment == null || typeof targetMessageElment != 'object') {
            return;
        }
        if (taskStatus == null || typeof taskStatus != 'number') {
            return;
        }
        removeElement();

        function removeElement() {
            targetMessageElment.remove();
        };
    };
    _proto.isNeedShowTask = function(taskMessage) {
        var _self = this;
        var _columnInfo = _self._info;
        var _columnFilterCondition = _columnInfo.getFilterCondition();
        var _filterCondition = new TaskFilterAndSortCondition();
        var _filterObj = _filterCondition.getFilterObject(_columnFilterCondition);
        var _parentTaskMessage = CubeeController.getInstance().getMessage(taskMessage.getParentItemId());
        var _target = [];
        _target[0] = taskMessage;
        if (_parentTaskMessage != null) {
            _target[1] = _parentTaskMessage;
        }
        var _count = _target.length;
        for (var _i = 0; _i < _count; _i++) {
            var _isMuch = true;
            for (key in _filterObj) {
                if (_filterObj[key] == '') {
                    continue;
                }
                var _propertyVal = _target[_i].getPropertyByFilterKey(key);
                if (_propertyVal == '') {
                    continue;
                }
                var _isPartMuch = false;
                var _filterValArray = _filterObj[key].split(TaskFilterAndSortCondition.DELIMITER_STRING);
                var _filterValArrayCount = _filterValArray.length;
                for (var _j = 0; _j < _filterValArrayCount; _j++) {
                    if (_filterValArray[_j] == _propertyVal) {
                        _isPartMuch = true;
                        break;
                    }
                }
                if (!_isPartMuch) {
                    _isMuch = false;
                    break;
                }
            }
            if (_isMuch) {
                return true;
            }
        }
        return false;
    };
    _proto.isMuchFilterCondition = function(taskMessage) {
        var _self = this;
        var _columnInfo = _self._info;
        var _columnFilterCondition = _columnInfo.getFilterCondition();
        var _filterCondition = new TaskFilterAndSortCondition();
        var _filterObj = _filterCondition.getFilterObject(_columnFilterCondition);
        for (key in _filterObj) {
            if (_filterObj[key] == '') {
                continue;
            }
            var _propertyVal = taskMessage.getPropertyByFilterKey(key);
            var _filterValArray = _filterObj[key].split(TaskFilterAndSortCondition.DELIMITER_STRING);
            var _filterValArrayCount = _filterValArray.length;
            var _isPartMuch = false;
            for (var _j = 0; _j < _filterValArrayCount; _j++) {
                if (_filterValArray[_j] == _propertyVal) {
                    _isPartMuch = true;
                    break;
                }
            }
            if (!_isPartMuch) {
                return false;
            }
        }
        return true;
    };
    _proto.showChildMessage = function(taskMessage) {
        var _self = this;
        var _parentItemId = taskMessage.getParentItemId();
        if (!_parentItemId) {
            return;
        }
        var _pos = _self.getMsgObjIndexPositionByItemId(_parentItemId);
        if (_pos == -1) {
            return;
        }
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _columnContent = _htmlElem.children('div.column-content');
        var _targetMsgObj = _self.getParentMsgObjByPosition(_pos);
        var _targetMsgElm = _targetMsgObj.getHtmlElement();
        _targetMsgElm.remove();
        _self.removeMsgObjIndexByItemIdNoCleanupMessage(_parentItemId);
        var _parentTaskMessage = CubeeController.getInstance().getMessage(_parentItemId);
        _self.showMessage(_parentTaskMessage);
    };
    _proto.showUpdateMessage = function(taskMessage) {
        var _self = this;
        if (taskMessage == null || typeof taskMessage != 'object') {
            return;
        }
        var _preStatus = taskMessage.getPreStatus();
        if (_self.isMuchFilterCondition(taskMessage) == false) {

            var _itemId = taskMessage.getItemId();
            if (!_itemId) {
                return;
            }
            _pos = _self.getMsgObjIndexPositionByItemId(_itemId);
            var _htmlElem = _self.getHtmlElement();
            if(_htmlElem == null) {
                return;
            }
            var _columnContent = _htmlElem.children('.column-content');
            var _targetMsgObj = _self.getParentMsgObjByPosition(_pos);
            var _targetMsgElm = _targetMsgObj.getHtmlElement();
            var _targetMsgItemId = _targetMsgObj.getMessage().getItemId();
            _self.removeMsgObjIndexByItemIdNoCleanupMessage(_targetMsgItemId);
            _targetMsgElm.remove();
            if (_preStatus > TaskMessage.STATUS_UNKNOWN && _preStatus < TaskMessage.STATUS_FINISHED) {
                _self._unfinishedTaskCount--;
                _self.updateColumnTitle(_self._unfinishedTaskCount);
            }
        }
    };
    _proto._onGetTaskHistoryMessage = function(taskMessageList, unfinishedTaskCount) {
        var _self = this;
        _self._hideLoadingIconInSelf();
        if (!taskMessageList) {
            return;
        }
        if (_self._unfinishedTaskCount == -1) {
            _self._unfinishedTaskCount = unfinishedTaskCount;
        }
        var _count = taskMessageList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _taskMessage = taskMessageList.get(_i);
            if (_taskMessage == null) {
                continue;
            }
            var _itemId = _taskMessage.getItemId();
            var _columnType =  _self.getType();
            var isAssigning = _self.isAssigningTask(_taskMessage);
            if ((_columnType == ColumnInformation.TYPE_COLUMN_TASK) && (isAssigning == true) && _self._unfinishedTaskCount > 0) {
                _self._unfinishedTaskCount--;
            } else {
                if (!_self.getMsgObjByItemId(_itemId)) {
                    _self.showHistoryMessage(_taskMessage);
                    if(_taskMessage.getDemandStatus() == TaskMessage.DEMAND_ON) {
                        _self._demandTaskItemIds.add(_itemId, _taskMessage);
                    }
                }
            }
            _self._currentLoadedItemId = _taskMessage.getId()
       }
        _self._readAll(taskMessageList);
        if (_self._readAllUnfinishedTask == true || _self._allMessageReceived == true) {
            _self.updateColumnTitle(_self._unfinishedTaskCount);
        }
    };
    _proto._readAll = function(taskMessageList) {
        var _self = this;
        var _columnInfo = _self._info;
        var _filterCondition = new TaskFilterAndSortCondition(_columnInfo.getFilterCondition());
        var _count = taskMessageList.getCount();
        var _isReadMoreSortCondition = false;
        if (_self._readAllUnfinishedTask == false) {
            var _isReadMoreSortCondition = false;
            if(_filterCondition.getSortKey(0) == TaskFilterAndSortCondition.DB_COLOMN_STATUS
                        || _filterCondition.getSortKey(0) == TaskFilterAndSortCondition.DB_COLOMN_COMPLETE_DATE + ' ' + TaskFilterAndSortCondition.SORT_COLUMN_IS_NULL) {
                _isReadMoreSortCondition = true;
            } else if(_filterCondition.getSortKey(0) == TaskFilterAndSortCondition.DB_COLUMN_DEMAND_STATUS) {
                if(_filterCondition.getSortKey(1) == TaskFilterAndSortCondition.DB_COLOMN_STATUS
                            || _filterCondition.getSortKey(1) == TaskFilterAndSortCondition.DB_COLOMN_COMPLETE_DATE + ' ' + TaskFilterAndSortCondition.SORT_COLUMN_IS_NULL) {
                    _isReadMoreSortCondition = true;
                } else if(_filterCondition.getSortKey(1) == TaskFilterAndSortCondition.DB_COLUMN_DEMAND_DATE) {
                    if(_filterCondition.getSortKey(2) == TaskFilterAndSortCondition.DB_COLOMN_STATUS
                                || _filterCondition.getSortKey(2) == TaskFilterAndSortCondition.DB_COLOMN_COMPLETE_DATE + ' ' + TaskFilterAndSortCondition.SORT_COLUMN_IS_NULL) {
                        _isReadMoreSortCondition = true;
                    }
                }
            }
            if (_self._allMessageReceived == false && _isReadMoreSortCondition && taskMessageList.get(_count - 1).getCompleteDate() == null && _self._unfinishedTaskCount > 0) {
                _self._showReadMore(false);
            } else {
                _self._readAllUnfinishedTask = true;
            }
        }
    };
    _proto._showReadMore = function(isForce) {
        var _self = this;
        if (_self._readAllUnfinishedTask == false) {
            if (isForce != null && isForce == true) {
                _super._showReadMore.call(_self);
            }
        } else {
            _super._showReadMore.call(_self);
        }
    };
    _proto.updateColumnTitle = function(unfinishedTaskCount) {
        var _self = this;
        var _countTitle = Resource.getMessage('task_unfinished_number');
        if (_self.getType() == ColumnInformation.TYPE_COLUMN_INBOX) {
            _countTitle = Resource.getMessage('inbox_item_number');
        }
        var _unfinishedTaskCount = 0;
        if (unfinishedTaskCount != null && typeof unfinishedTaskCount == 'number') {
            _unfinishedTaskCount = unfinishedTaskCount;
        }
        var _info = _self._info;
        var _baseDispalyName = ViewUtils.createDisplayName(_info);

        _info.setDisplayName(_baseDispalyName);
        _super.updateColumnTitle.call(_self);
    };
    _proto.isAssigningTask = function(taskMessage) {
        var _isAssigning = false;
        var _parentItemId = taskMessage.getParentItemId();
        var _status = taskMessage.getStatus();
        if ((_status == TaskMessage.STATUS_ASSIGNING) && (_parentItemId != "")) {
            _isAssigning = true;
        }
        return _isAssigning;
    };
    _proto.deleteMessage = function(itemId) {
        var _self = this;

        if(_super.deleteMessageBase.call(_self, itemId)) {
            var _taskMessage = CubeeController.getInstance().getMessage(itemId);
            var _status = _taskMessage.getStatus();
            if (_status > TaskMessage.STATUS_INBOX && _status < TaskMessage.STATUS_FINISHED) {
                if (_self._unfinishedTaskCount > 0) {
                    _self._unfinishedTaskCount--;
                    _self.updateColumnTitle(_self._unfinishedTaskCount);
                }
            }
        }
        return;
    };
    _proto.createMessageObjectOnly = function(msg) {
        var _self = this;
        if (!msg || typeof msg != 'object') {
            return;
        }
        var _type = msg.getType();
        var _msgObj = null;
        switch(_type) {
            case Message.TYPE_TASK:
                var _communityId = msg.getCommunityId();
                if(_communityId == null || _communityId == ''){
                    _msgObj = new ColumnTaskMessageView(_self, msg);
                } else {
                    _msgObj = new ColumnCommunityTaskMessageView(_self, msg);
                }
                break;
            default:
                console.log('ColumnTaskView::createMessageObjectOnly _ invalid type:' + _type);
                break;
        }

        return _msgObj;
    };
    _proto.showMessage = function(msg) {
        var _self = this;
        if (_self._validation({'object' : msg}) == false) {
            return false;
        }
        var _insertElementFound = false;
        if (_self.isMuchFilterCondition(msg) == false) {
            _self.showChildMessage(msg);
            return true;
        } else {
            var _parentItemId = msg.getParentItemId();
            if (_parentItemId != null && _parentItemId != '') {
                _self.showChildMessage(msg);
            }
        }
        _self._showMessageData(msg);
        return true;
    };
    _proto.getColumnMessageHtml = function(message) {
        var _ret = '';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = message.getMessageHtml();
        return _ret;
    };
    _proto.setContentLayout = function(){
        var _self = this;
        var column = _self.getHtmlElement();
        if(column == null) {
            return;
        }
        var columnH = $(column).outerHeight(true);
        var headerH = $(column).children('div.column-header').outerHeight(true);
        var input = $(column).children('div.wrap-frm-message').css('height', '');
        var inputH = $(input).hasClass('display-none') ? 0 : $(input).outerHeight(true);
        var register = $(input).find('div.frm-message > div.task-register-area');
        var regBody = $(register).children('div.task-register-scroll-area').css('height', '');
        var content = $(column).children('div.column-content');
        if(LayoutManager.isDesktop || (headerH + inputH) <= columnH){
            $(content).css('height', (columnH - (headerH + inputH)) + 'px');
        } else {
            $(content).css('height', '0px');
            var nextInputH = columnH - headerH;
            var regHeadH = $(register).children('div.task-register-header').outerHeight(true);
            var regButtonH = $(register).children('div.register-task-buttons').outerHeight(true);
            $(regBody).css('height', (nextInputH - (regHeadH + regButtonH)) + 'px');
            $(input).css('height', nextInputH + 'px');
        }
    }
    _proto._createDisplayName = function(columnInfo) {
        var _columnType = columnInfo.getColumnType();
        switch(_columnType){
            case ColumnInformation.TYPE_COLUMN_TASK:
                return ColumnView.DISPLAY_NAME_MY_TASK;
            case ColumnInformation.TYPE_COLUMN_INBOX:
                return ColumnView.DISPLAY_NAME_INBOX;
            default:
                return "";
        }
    };
    _proto.onMessageOptionReceive = function(messageOptionNotification) {
        var _self = this;
        if (_self._validation({'object' : messageOptionNotification}) == false) {
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return ;
        }
        if (messageOptionNotification.getType == null) {
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return;
        }
        var _type = messageOptionNotification.getType();
        if (_type != Notification_model.TYPE_MESSAGE_OPTION) {
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return;
        }
        var _contentType = messageOptionNotification.getContentType();
        if (_contentType != MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK) {
            _super.onMessageOptionReceive.call(_self, messageOptionNotification);
            return;
        }
        _self._updateChildrenMessageOnDemand(messageOptionNotification);

        var _itemId = messageOptionNotification.getItemId();
        var _messageViewObj = _self.getMsgObjByItemId(_itemId);
        if(_messageViewObj == null){
            return;
        }
        var _msg = _messageViewObj.getMessage();
        var _newDemandStatus = messageOptionNotification.getDemandStatus();
        if (_newDemandStatus == TaskMessage.DEMAND_ON) {
            _self._demandTaskItemIds.add(_itemId, _msg);
        } else if (_newDemandStatus == TaskMessage.DEMAND_OFF) {
            _self._demandTaskItemIds.removeByKey(_itemId);
        }
        _self._updateMessageOnDemand(_itemId, _newDemandStatus);
    };
    _proto.getDemandTaskCount = function() {
        var _self = this;
        return _self._demandTaskItemIds.getCount();
    };

    _proto._updateMessageOnDemand = function(itemId, newDemandStatus) {
        var _self = this;
        var _messageViewObj = _self.getMsgObjByItemId(itemId);
        if(_messageViewObj == null){
            return;
        }
        var _taskMessage = _messageViewObj.getMessage();
        var isDemandUp = false;
        if(newDemandStatus == TaskMessage.DEMAND_ON) {
            var _columnInfo = _self._info;
            var _filterCondition = new TaskFilterAndSortCondition(_columnInfo.getFilterCondition());
            if(_filterCondition.getSortKey(0) == TaskFilterAndSortCondition.DB_COLUMN_DEMAND_STATUS && _filterCondition.getSortOrderValue(0) == TaskFilterAndSortCondition.SORT_ORDER_DES
                && _filterCondition.getSortKey(1) == TaskFilterAndSortCondition.DB_COLUMN_DEMAND_DATE && _filterCondition.getSortOrderValue(1) == TaskFilterAndSortCondition.SORT_ORDER_ASC) {
                isDemandUp = true;
            }
        }

        var _pos = _self.getMsgObjIndexPositionByItemId(itemId);
        if(_messageViewObj != null){
            _messageViewObj.getHtmlElement().remove();
        }
        _self.removeMsgObjIndexByItemIdNoCleanupMessage(itemId);
        var _insertPos = _pos;
        if(isDemandUp) {
            var _indexList = _self._getMsgObjIndexList();
            var _messgeObjCount = _indexList.getCount();
            var _isFound = false;
            for(var _i = 0; _i < _messgeObjCount; _i++) {
                var _currentIndex = _indexList.get(_i);
                var _currentMessageObj = _currentIndex.getMsgObj();
                var _currentMessage = _currentMessageObj.getMessage();
                if(_currentMessage.getDemandStatus() == TaskMessage.DEMAND_OFF) {
                    _isFound = true;
                    _insertPos = _i;
                    break;
                }
            }
            if(!_isFound) {
                _insertPos = _messgeObjCount;
            }
        }

        _self._insertMessage(_taskMessage, _insertPos);
    };
    _proto._updateChildrenMessageOnDemand = function(messageOptionNotification) {
        var _self = this;
        var _itemId = messageOptionNotification.getItemId();
        var _childTaskMessage = CubeeController.getInstance().getMessage(_itemId);
        if(_childTaskMessage == null){
            return false;
        }
        var _parentItemId = _childTaskMessage.getParentItemId();
        var _parentMessageViewObj = _self.getMsgObjByItemId(_parentItemId);
        if(_parentMessageViewObj == null){
            return false;
        }
        _parentMessageViewObj.onMessageOptionReceive(messageOptionNotification);
        return true;
    };
    _proto._updateActionToolTipToMessageElem = function(msgViewObj, type) {
        var _messageElement = msgViewObj.getHtmlElement();
        var _actionToolTipOwner = _messageElement.children().children('div.message-header').eq(0);
        TooltipView.getInstance().updateActionToolTip(_actionToolTipOwner, type);
    };

    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = TaskColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = optionButton.append(_optionMenuHtml);
        _self._columnOptionMenu = new TaskColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };

    _proto._getFrmMessageHeight = function(subFormDiv) {
        var _frmMessageHeight = '';
        var _subElem = $(subFormDiv).get(0);
        var _subFormDivHeight = parseInt($(_subElem).css('height'));
        var _regElem = $(subFormDiv).find('div.task-register-area').get(0);
        var _taskRegisterAreaOuterHeight = $(_regElem).outerHeight(true);
        if (_subFormDivHeight < _taskRegisterAreaOuterHeight) {
            var _subFormDivBorderH = parseInt(subFormDiv.css('borderTopWidth')) + parseInt(subFormDiv.css('borderBottomWidth'));
            var _subFormDivPaddingH = parseInt(subFormDiv.css('paddingTop')) + parseInt(subFormDiv.css('paddingBottom'));
            _frmMessageHeight = (_taskRegisterAreaOuterHeight + _subFormDivBorderH + _subFormDivPaddingH);
        }
        return _frmMessageHeight;
    };
})();
