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
function ColumnTaskMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnTaskMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if(_type != Message.TYPE_TASK) {
        console.log('ColumnTaskMessageView::new _ invalid type:' + _type);
        return;
    }
    ColumnMessageView.call(this, parent, msg);
    this._isEditInit = false;
    this._isShowMultiOwner = false;
    this._isMultiOwner = false;
    this._isMultiOwnerExpand = false;
    this._isRequestTask = false;
    this._attachedFileListObj = null;
    this._statusAreaTimerBlinkIDList = new StringMapedArrayList();
};(function() {
    ColumnTaskMessageView.TASK_PRIORITY_MEDIUM_CLS_NAME = 'task-priority-medium';
    ColumnTaskMessageView.TASK_PRIORITY_HIGH_CLS_NAME = 'task-priority-high';
    ColumnTaskMessageView.TASK_PRIORITY_TOP_CLS_NAME = 'task-priority-top';
    ColumnTaskMessageView.TASK_MESSAGE_ICON_CLS_NAME = 'task-message-icon';
    ColumnTaskMessageView.TASK_FINISHED_CLS_NAME = 'task-finished';

    ColumnTaskMessageView.DEMAND_TASK_ICON_HTML = '<img src="images/demand_red.png">';

    ColumnTaskMessageView.DEMAND_TASK_BLINK_DELAY = 1500;

    ColumnTaskMessageView.MAX_LENGTH_TASK_NAME = Conf.getVal('TASK_TITLE_MAX_LENGTH');
    ColumnTaskMessageView.MAX_LENGTH_TASK_BODY = Conf.getVal('MESSAGE_BODY_MAX_LENGTH');

    ColumnTaskMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnTaskMessageView.prototype;

    _proto.cleanup = function() {
        var _self = this;
        var _message = _self._msg;
        var _itemId = _message.getItemId();
        var _parentItemId = _message.getParentItemId();
        var _siblingTaskList = _message.getSiblingTaskDataList();
        _super.cleanup.call(_self);
        var _statusAreaTimerBlinkIDList = _self._statusAreaTimerBlinkIDList;
        var _statusAreaTimerBlinkIDCount = _statusAreaTimerBlinkIDList.getCount();
        for (var _i = 0; _i < _statusAreaTimerBlinkIDCount; _i++) {
          var _timeIdObj = _statusAreaTimerBlinkIDList.get(_i);
          clearInterval(_timeIdObj.timerId);
        }
        _self._statusAreaTimerBlinkIDList.removeAll();
        _self._attachedFileListObj = null;
        _self._statusAreaTimerBlinkIDList = null;
        if(_parentItemId != null && _parentItemId != ''){
            CubeeController.getInstance().onRemoveParentMessageRefarence(_parentItemId);
        }
        var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childrenTaskItemIds != null){
            var _childrenCount = _childrenTaskItemIds.getCount();
            for(var _i = 0; _i < _childrenCount; _i++){
                var _childItemId = _childrenTaskItemIds.get(_i);
                CubeeController.getInstance().onRemoveMessageView(_childItemId);
            }
        }
        var _siblingTaskList = _message.getSiblingTaskDataList();
        var _sblingCount = _siblingTaskList.getCount();
        for(var _i = 0; _i < _sblingCount; _i++){
            var _siblingTask = _siblingTaskList.get(_i);
            var _siblingItemId = _siblingTask.getSiblingItemId();
            CubeeController.getInstance().onRemoveMessageView(_siblingItemId);
        }
    };

    _proto.getMessageHtml = function() {
        var _self = this;
        var _ret = '';
        var _msg = this.getMessage();
        var _itemId = this.getItemId();
        _ret += '<div draggable="false" class="box-border olient-vertical ' + ColumnTaskView.cssClass + ' ' + getTaskMessageCLSName(_msg) + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        _ret += _self.getMessageHeaderHtml();
        _ret += _self.getMessageBodyHtml();
        _ret += _self.getMessageFooterHtml();
        _ret += '</div> <!-- task-message -->';
        return _ret;
    };
    _proto.setHtmlElement = function(htmlElement) {
        var _setEvent = function(target){
           var _multiOwnerAssignView = target._htmlElement.find('div.children-task-assign-area');
           _multiOwnerAssignView.addClass('hide-view');
           target._htmlElement.on('click', '.task_toggle_btn', function(elem) {
               target.onToggleMultiOwner(this);
           });
        };

        var _self = this;
        var msg = _self.getMessage();
        var addedClickEvent = false;
        _self._htmlElement = htmlElement;
        if(_self._htmlElement) {
            var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(msg.getItemId());
            if(_childrenTaskItemIds != null && _childrenTaskItemIds.getCount() > 0){
                _self._isMultiOwner = true;
                _self._isRequestTask = true;
                var _isCommunity = false;
                if(msg.getStatus() >= TaskMessage.STATUS_ASSIGNING) {
                    var _communityName = msg.getCommunityName();
                    if(_communityName != null && _communityName != '') {
                        _isCommunity = true;
                    }
                }
                if((_isCommunity || _childrenTaskItemIds.getCount() > 1)) {
                    _setEvent(_self);
                    addedClickEvent = true;
                }
            }
            var _msgBody = msg.getMessage();
            if(!addedClickEvent && (_msgBody !== null && _msgBody !== "")) {
                _setEvent(_self);
            }

            var _taskSiblingArea = _self._htmlElement.find('div.task-sibling-area');
            TooltipView.getInstance().createSiblingTaskTooltip(_taskSiblingArea, msg.getSiblingTaskDataList());

            if(msg.getParentItemId() != '' || _self._isRequestTask){
                var _ownerSelectView = _self._htmlElement.find('#task-owner');
                _ownerSelectView.attr("disabled","disabled");
                if(_self._isRequestTask){
                    var _statusSelectView = _self._htmlElement.find('#task-status');
                    _statusSelectView.attr("disabled","disabled");
                }
            }
            _self._execBlinkAllDemandTask();

            var _assignArea = _self._htmlElement.find('div.task-assign');
            var _statusArea = _self._htmlElement.find('div.multi-owner-task-status-view');
            var _messageWidth = _self._htmlElement.css('width');
            var _statusWidht = _statusArea.css('width');
            _assignArea.css('width', _messageWidth-_statusWidht-4);
            _self._htmlElement.find('.pack-end').remove();

            var _messageThumbnailElement = _self._htmlElement.find('img.image-thumbnail');
            var _imageMaxWidth = ColumnManager.getInstance().getImageMaxWidth();
            _messageThumbnailElement.each(function(index, el) {
                var _element = $(el);
                if(!_element.attr('src')) {
                    var _itemId = _self._msg.getItemId();
                    var url = _element.attr('data-url');
                    CubeeController.getInstance().downloadThumbnailImage(url, _itemId, _element);
                }
                _element.css('max-width', _imageMaxWidth);
            });

            ViewUtils.showOpenGraphProtocolImage(_self._htmlElement);
        }

        let hashtagElement = _self._htmlElement.find('a.hashtag');
        _self._setHashtagEvent(hashtagElement);
    };

    _proto._setHashtagEvent = function(element) {
        var _self = this;
        if (element) {
            element.on('click', function() {
                ContextSearchView.getInstance().search($(this).text(), _self.getParent(), true);
            });
        }
    };

    _proto._execBlinkAllDemandTask = function() {
        var _self = this;
        var _msg = _self.getMessage();
        var _itemId = _msg.getItemId();
        var _demandTaskList = ViewUtils.getDemandTaskListByMessage(_msg);
        var _demandTaskCount = _demandTaskList.getCount();
        for (var _i = 0; _i < _demandTaskCount; _i++) {
            var _demandTask = _demandTaskList.get(_i);
            if (_demandTask == null) {
                continue;
            }
            var _ownerJid = _demandTask.getOwnerJid();
            var _status = _demandTask.getStatus();
            _self._execBlinkDemandTaskOnly(_ownerJid, _status);
        }
    };

    _proto._execBlinkDemandTaskOnly = function(ownerJid, baseStatus) {
        var _self = this;
        var _msg = _self.getMessage();
        var _itemId = _msg.getItemId();
        var _rootElement = _self._htmlElement;
        var _isParent = _self._isParent();
        var _baseHtml = ColumnTaskMessageView.getStatusAreaBaseDisplayHtml(baseStatus, _isParent, _self._isMultiOwner);
        var _demandTaskHtml = ColumnTaskMessageView.getStatusAreaDemandTaskDisplayHtml(_self._isMultiOwner);
        var _timerIdObj = _self._statusAreaTimerBlinkIDList.getByKey(ownerJid);
        var _timerId;
        if(_timerIdObj != null){
            _timerId = _timerIdObj.timerId;
        };
        if(_timerId){
          ViewUtils.invalidBlinkTaskStatusElement(_timerId,_rootElement,_baseHtml,_self._isMultiOwner,ownerJid);
          _self._statusAreaTimerBlinkIDList.removeByKey(ownerJid);
        };
        _timerId = ViewUtils.validBlinkTaskStatusElement(_rootElement,ColumnTaskMessageView.DEMAND_TASK_BLINK_DELAY,_baseHtml,_demandTaskHtml,_self._isMultiOwner,ownerJid);
        var _timerIdObj = {timerId : _timerId}
        var _ret = _self._statusAreaTimerBlinkIDList.setByKey(ownerJid,_timerIdObj);
        if(!_ret){
            var _ret = _self._statusAreaTimerBlinkIDList.add(ownerJid,_timerIdObj);
        }
    };

    _proto._invalidBlinkDemandTaskOnly = function(ownerJid, baseStatus) {
        var _self = this;
        var _msg = _self.getMessage();
        var _itemId = _msg.getItemId();
        var _rootElement = _self._htmlElement;
        var _isParent = _self._isParent();
        var _baseHtml = ColumnTaskMessageView.getStatusAreaBaseDisplayHtml(baseStatus, _isParent, _self._isMultiOwner);
        var _timerIdObj = _self._statusAreaTimerBlinkIDList.getByKey(ownerJid);
        var _timerId;
        if(_timerIdObj != null){
            _timerId = _timerIdObj.timerId;
        };
        if(_timerId){
          ViewUtils.invalidBlinkTaskStatusElement(_timerId,_rootElement,_baseHtml,_self._isMultiOwner,ownerJid);
          _self._statusAreaTimerBlinkIDList.removeByKey(ownerJid);
        };
    }

    _proto._isParent = function() {
        var _ret = false;
        var _self = this;
        var _msg = _self.getMessage();
        var _itemId = _msg.getItemId();
        var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childrenTaskItemIds != null) {
            _ret = true;
        }
        return _ret;
    };

    ColumnTaskMessageView.getStatusAreaBaseDisplayHtml = function(status, isParent, isMultiOwner){
      var _retHtml = '';
      var _statusStr = ViewUtils.requestTaskStatusNumToStr(status, isParent);
      var _statusClassName = getTaskStatusClassName(status);
      var _taskStatusViewName = 'task-status-view ';
      if(isMultiOwner){
        _taskStatusViewName += 'child-task-status-view ';
      }
      _retHtml = '<div class="' + _taskStatusViewName + ' ' + _statusClassName + '">' + _statusStr + '</div>';
      return _retHtml;
    };

    ColumnTaskMessageView.getStatusAreaDemandTaskDisplayHtml = function(isMultiOwner){
      var _retHtml = '';
      var _taskStatusViewName = 'task-status-view ';
      if(isMultiOwner){
        _taskStatusViewName += 'child-task-status-view ';
      }
      _retHtml = '<div class="' + _taskStatusViewName + ' task-status-view-demand">' + Resource.getMessage('task_demand') + '</div>';
      return _retHtml;
    };

    _proto.onToggleMultiOwner = function(target) {
        $(target).parents('.message-border').toggleClass('open').find('.message-body,.thumbnail-area').stop().slideToggle(200).end().find('.children-task-assign-area').stop().slideToggle(200);
    };
    _proto.onTaskRegist = function(register){
        var _self = this;
        register.registTask(_callback);
        function _callback(result) {
            if(result) {
                _self._editEnd(undefined);
                _self._parent.showUpdateMessage(register.getRegistedMessageData());
            }
        };
    };
    _proto.onMessageOptionReceive = function(messageOptionNotification) {
        var _self = this;
        _super.onMessageOptionReceive.call(_self, messageOptionNotification);
        var _contentType = messageOptionNotification.getContentType();
        switch(_contentType){
            case MessageOptionNotification.CONTENT_TYPE_SIBLING_TASK:
                var _taskSiblingArea = _self._htmlElement.find('div.task-sibling-area');
                TooltipView.getInstance().createSiblingTaskTooltip(_taskSiblingArea, _self.getMessage().getSiblingTaskDataList());
                break;
            case MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK:
                var _demandTaskArea = _self._htmlElement.find('div.demand-task');
                var _demandStatus = messageOptionNotification.getDemandStatus();
                var _ownerJid = messageOptionNotification.getOwner();
                var _baseStatus = messageOptionNotification.getStatus();
                if(_demandStatus == TaskMessage.DEMAND_ON){
                    _self._execBlinkDemandTaskOnly(_ownerJid, _baseStatus);
                }else{
                    _self._invalidBlinkDemandTaskOnly(_ownerJid, _baseStatus);
                }
                if (_self._isParent()) {
                    _self._updateParentTaskActionToolTip();
                }
                break;
            default:
                break;
        }
    };
    _proto._updateParentTaskActionToolTip = function() {
        var _self = this;
        var _msg = _self.getMessage();
        var _demandTaskList = ViewUtils.getDemandTaskListByMessage(_msg);
        var _type = TooltipView.TYPE_PARENT_TASK;
        if (_demandTaskList != null && _demandTaskList.getCount() > 0) {
            _type = TooltipView.TYPE_PARENT_TASK_CANCEL;
        }
        _self._parent._updateActionToolTipToMessageElem(_self, _type);
    };
    _proto.getMessageHeaderHtml = function() {
        var _self = this;
        var _ret = '';
        var _message = _self.getMessage();
        _ret = _getMessageHeaderHtml(_message);
        return _ret;
    };
    ColumnTaskMessageView.getMessageHeaderHtml = function(message) {
        var _ret ='';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageHeaderHtml(message);
        return _ret;
    };
    function _getDispFormatEndDate(startDate, endDate) {
        var _ret = '';
        if (endDate == null || endDate =='') {
          return _ret;
        }
        if (startDate == null || startDate =='') {
          return endDate;
        }
      if (startDate.substr(0,4) == endDate.substr(0,4)){
        _ret = endDate.substr(5);
      } else {
        _ret = endDate;
      }
        return _ret;
    };
    function _getMessageHeaderHtml(msg) {
        var _ret = '';
        var _id = msg.getId();
        var _itemId = msg.getItemId();
        var _title = msg.getTitle();
        var _escapedTitle = Utils.convertEscapedHtml(_title, false);
        var _escapedTitleTag = Utils.convertEscapedTag(_title);
        var _clientJid = msg.getClient();
        var _ownerJid = msg.getOwnerJid();
        var _startDate = (msg.getStartDate() == null) ? '' : Utils.getDate(msg.getStartDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);
        var _endDate = '';
        var _demandStatus = msg.getDemandStatus();
        if (msg.getStatus() >= TaskMessage.STATUS_FINISHED) {
            if (msg.getCompleteDate() != null) {
                _endDate = Utils.getDate(msg.getCompleteDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);
            } else {
                _endDate = (msg.getDueDate() == null) ? '' : Utils.getDate(msg.getDueDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);
            }
        } else {
            _endDate = (msg.getDueDate() == null) ? '' : Utils.getDate(msg.getDueDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);
        }
        var _escapedCommunityName = '';
        var _escapedCommunityNameTag = '';
        if(msg.getStatus() >= TaskMessage.STATUS_ASSIGNING) {
            var _communityName = msg.getCommunityName();
            if(_communityName != null && _communityName != '') {
                _escapedCommunityName = Utils.convertEscapedHtml(' <' + _communityName + '>', false);
                _escapedCommunityNameTag = Utils.convertEscapedTag(' <' + _communityName + '>');
            }
        }
        _ret += '<div class="box-border olient-horizontal message-header task-message-header">';
        _ret += '<div class="message-info" messageid="' + (_id == null ? '' : _id) + '" itemid="' + _itemId + '" />';
        if(ViewUtils.isIE89()) _ret += '<table class="width-100" style="table-layout: fixed;"><tr><td style="width:30px;">';

        var _profileMap = msg.getProfileMap();
        var _profile = null;
        var _person = new Person();
        if (_clientJid) {
            _profile = _profileMap.getByKey(_clientJid);
            _person = ViewUtils.createPersonByProfile(_clientJid, _profile);
            _ret += ViewUtils.getAvatarDataHtmlFromPerson(_person, 'avatar ' + ColumnTaskMessageView.TASK_MESSAGE_ICON_CLS_NAME);
        } else if (_ownerJid) {
            _profile = _profileMap.getByKey(_ownerJid);
            _person = ViewUtils.createPersonByProfile(_ownerJid, _profile);
            _ret += ViewUtils.getAvatarDataHtmlFromPerson(_person, 'avatar ' + ColumnTaskMessageView.TASK_MESSAGE_ICON_CLS_NAME);
        }else{
            _ret += _getBlankImageHtml();
        }
        if(ViewUtils.isIE89()) _ret += '</td><td>';
        _ret += '<div class="flex1 block-info">';
        _ret += '<div class="task-name">';
        _ret += '<div class="text-overflow-ellipsis-nosize box-border-for-abbreviation" title="' + _escapedTitleTag + _escapedCommunityNameTag + '">' + _escapedTitle + _escapedCommunityName + '</div>';
        _ret += '</div>';
        _ret += '<div class="message-time message-time-task">';

        _ret += '<div>' + Resource.getMessage('task_startdate_label') + Resource.getMessage('label_separator') + _startDate + '</div>';
        _ret += '<div>' + Resource.getMessage('task_enddate_label') + Resource.getMessage('label_separator') + _endDate + '</div>';

        _ret += '</div>' + '</div>';
        if(ViewUtils.isIE89()) _ret += '</td></tr></table>';
        _ret += '</div>';
        return _ret;
    }
    function _getBlankImageHtml(){
        var _ret = '';
        _ret += '<div>';
        _ret += '<img class="avatar ' +  ColumnTaskMessageView.TASK_MESSAGE_ICON_CLS_NAME +'" src="images/blank.png">';
        _ret += '</div>';
        return _ret;
    }
    _proto.getMessageFooterHtml = function() {
        var _self = this;
        var _ret = '';
        var _message = _self.getMessage();
        _ret = _getMessageFooterHtml(_message);
        return _ret;
    };
    _proto.onAddMessageReferCount = function() {
        var _self = this;
        _super.onAddMessageReferCount.call(_self);
        var _message = _self.getMessage();
        if(_message == null){
            return;
        }
        var _parentItemId = _message.getParentItemId();
        if(_parentItemId != null && _parentItemId != ''){
            CubeeController.getInstance().onAddParentMessageRefarence(_parentItemId);
        }
        var _itemId = _message.getItemId();
        var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childrenTaskItemIds != null){
            var _childrenCount = _childrenTaskItemIds.getCount();
            for(var _i = 0; _i < _childrenCount; _i++){
                var _childItemId = _childrenTaskItemIds.get(_i);
                CubeeController.getInstance().onAddMessageView(_childItemId);
            }
        }
        var _siblingTaskList = _message.getSiblingTaskDataList();
        var _siblingCount = _siblingTaskList.getCount();
        for(var _i = 0; _i < _siblingCount; _i++){
            var _siblingTask = _siblingTaskList.get(_i);
            var _siblingItemId = _siblingTask.getSiblingItemId();
            CubeeController.getInstance().onAddMessageView(_siblingItemId);
        }
    };
    ColumnTaskMessageView.getMessageFooterHtml = function(message) {
        var _ret ='';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageFooterHtml(message);
        return _ret;
    };
    function _getMessageFooterHtml(msg) {
        var _ret = '';
        var _clientJid = msg.getClient();
        var _ownerJid = msg.getOwnerJid();
        var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(msg.getItemId());
        var _status = getTaskStatus(msg);
        var _isParent = false;
        if(_childrenTaskItemIds != null) {
            _isParent = true;
        }
        var _statusStr = ViewUtils.requestTaskStatusNumToStr(_status, _isParent);
        var _statusClassName = getTaskStatusClassName(_status);

        var _childrenTaskList = new ArrayList();
        var _childrenCount = 0;
        if(_childrenTaskItemIds != null) {
            _childrenCount = _childrenTaskItemIds.getCount();
            for (var _i = 0; _i < _childrenCount; _i++) {
                var _childTask = CubeeController.getInstance().getMessage(_childrenTaskItemIds.get(_i));
                if (_childTask == null) {
                    continue;
                }
                _childrenTaskList.add(_childTask);
            }
        }
        _childrenCount = _childrenTaskList.getCount();
        var _isMultiOwner = false;
        _ret += '<div class="message-footer">';
        _ret += '<div class="olient-horizontal box-border width-100 task-footer-contents cf">';
        var _siblingTaskDataList = msg.getSiblingTaskDataList();
        var _siblingTaskCount = _siblingTaskDataList.getCount()
        if (ViewUtils.isIE89()) _ret += '<table class="width-100"><tr><td class="width-100">';
        _ret += '<div class="task-assign box-border-only-ms-webkit flex1">';

        var _clientUserName = Utils.convertEscapedHtml(_getUserNameAndStatusStrByProfile(msg, _clientJid));
        var _ownerUserName = Utils.convertEscapedHtml(_getUserNameAndStatusStrByProfile(msg, _ownerJid));
        var _clientUserNameTag = Utils.convertEscapedTag(_getUserNameAndStatusStrByProfile(msg, _clientJid));
        var _ownerUserNameTag = Utils.convertEscapedTag(_getUserNameAndStatusStrByProfile(msg, _ownerJid));

        if (_clientJid != _ownerJid) {
            _ret += '<div class="task-client box-border-for-abbreviation" title="' + _clientUserNameTag + '">' + _clientUserName + '</div>';
            _ret += '<div class="task-assign-separator box-border">' + Resource.getMessage('task_user_arrow') + '</div>';
            _ret += '<div class="task-owner box-border-for-abbreviation" title="'+ _ownerUserNameTag + '">' + _ownerUserName + '</div>';
        } else {
            if (_childrenCount > 0) {
                var _isCommunity = false;
                if(msg.getStatus() >= TaskMessage.STATUS_ASSIGNING) {
                    var _communityName = msg.getCommunityName();
                    if(_communityName != null && _communityName != '') {
                        _isCommunity = true;
                    }
                }
                if (!_isCommunity && _childrenCount == 1) {
                    _ret += '<div class="task-client box-border-for-abbreviation" title="' + _ownerUserNameTag + '">' + _ownerUserName + '</div>';
                    _ret += '<div class="task-assign-separator box-border">' + Resource.getMessage('task_user_arrow') + '</div>';
                    var _childTask = _childrenTaskList.get(0);
                    var _childTaskUserName = Utils.convertEscapedHtml(_getUserNameAndStatusStrByProfile(_childTask, _childTask.getOwnerJid()));
                    var _childTaskUserNameTag = Utils.convertEscapedTag(_getUserNameAndStatusStrByProfile(_childTask, _childTask.getOwnerJid()));
                    _ret += '<div class="task-owner box-border-for-abbreviation';
                    if (msg.getMessage() === null || msg.getMessage() === "") {
                        _ret += ' flex1';
                    }
                    _ret += '" title="' + _childTaskUserNameTag + '">' + _childTaskUserName + '</div>';
                } else {
                    _isMultiOwner = true;
                    _ret += '<div class="task-client box-border-for-abbreviation" title="'+ _clientUserNameTag +'">' + _clientUserName + '</div>';
                    _ret += '<div class="task-assign-separator box-border">' + Resource.getMessage('task_user_arrow') + '</div>';
                    _ret += '<div class="task-owner box-border">' + _childrenCount + Resource.getMessage('task_user_count') + '</div>';
                }
            } else {
                _ret += '<div class="task-client-owner box-border-for-abbreviation" title="'+ _clientUserNameTag + '">' + Resource.getMessage('task_owner') + _clientUserName + '</div>';
            }
        }

        var _msgBody = msg.getMessage();
        if ((_msgBody != null && _msgBody != "") || (!_isCommunity && _childrenCount > 1) || (_isCommunity && _childrenCount > 0)) {
            _ret += '<a class="task_toggle_btn ico_btn"><i class="fa fa-caret-down"></i></a>';
        }
        if(_siblingTaskCount > 0) {
            _ret += '<div class="task-sibling-area box-border">('+ Resource.getMessage('task_user_other') + _siblingTaskCount + Resource.getMessage('task_user_count') + ')</div>';
        }
        _ret += '</div>';

        if (ViewUtils.isIE89()) _ret += '</td><td>';
        if(_isMultiOwner) {
            var _statusCountArray = getStatusCount(_childrenTaskList);
            _ret += '<div class="multi-owner-task-status-view task-status-view">';
            for(var _i = 0; _i < _statusCountArray.length; _i++) {
                _ret += getStatusCountHtml(_i, _statusCountArray[_i]);
            }
            _ret += '</div>';
        } else if (_status != TaskMessage.STATUS_INBOX) {
            _ret += '<div class="task-status-view ' + _statusClassName + '">' + _statusStr + '</div>';
        }
        _ret += '</div>';
        if (ViewUtils.isIE89()) _ret += '</td></tr></table>';
        if (_isMultiOwner) {
            _ret += '<div class="children-task-assign-area box-border width-100">';
            _ret += '<div class="children-task-padding"/>';
            _ret += '<div class="children-task-assign box-border olient-vertical flex1">';
            for (var _i = 0; _i < _childrenCount; _i++) {
                var _childTask = _childrenTaskList.get(_i);
                if (_childTask == null) {
                    continue;
                }

                _ret +=_footerHtmlChildTaskItem(_childTask, msg, _isParent);
            }
            _ret += '</div>';
            _ret += '</div>';
        }
        _ret += '</div>';
        return _ret;
    };

    ColumnTaskMessageView.ChangedTitle = 0x01;
    ColumnTaskMessageView.ChangedMessage = 0x02;
    ColumnTaskMessageView.ChangedPriority = 0x04;
    ColumnTaskMessageView.ChangedStartDate = 0x08;
    ColumnTaskMessageView.ChangedDueDate = 0x10;
    ColumnTaskMessageView.ChangedCompleteDate = 0x20;

    function _childTaskChangeItemCheck(childTask, parentTask) {
        var _bChanged = 0;
        if(childTask.getTitle() != parentTask.getTitle()){
            _bChanged = _bChanged | ColumnTaskMessageView.ChangedTitle;
        }
        if(childTask.getMessage() != parentTask.getMessage()){
            _bChanged = _bChanged | ColumnTaskMessageView.ChangedMessage;
        }
        if(childTask.getPriority() != parentTask.getPriority()){
            _bChanged = _bChanged | ColumnTaskMessageView.ChangedPriority;
        }

        function timeCompare(time1, time2){
            if(time1 == null){
                if(time2 != null){
                    return false;
                }
            }
            else{
                if(time2 != null){
                    if(time1.getTime() != time2.getTime()){
                        return false;
                    }
                }
                else{
                    return false;
                }
            }
            return true;
        }

        var _parentTime = childTask.getStartDate();
        var _childTime = parentTask.getStartDate();
        if(timeCompare(_parentTime, _childTime) == false){
            _bChanged = _bChanged | ColumnTaskMessageView.ChangedStartDate;
        }
        _parentTime = childTask.getDueDate();
        _childTime = parentTask.getDueDate();
        if(timeCompare(_parentTime, _childTime) == false){
            _bChanged = _bChanged | ColumnTaskMessageView.ChangedDueDate;
        }

        var _status = childTask.getStatus();
        if((_status == TaskMessage.STATUS_FINISHED) || (_status == TaskMessage.STATUS_REJECTED)){
            if (childTask.getCompleteDate() != null) {
                _bChanged = _bChanged & ~ColumnTaskMessageView.ChangedDueDate;
                _bChanged = _bChanged | ColumnTaskMessageView.ChangedCompleteDate;
            }
        }
        return _bChanged;
    }

    function _childTaskChangeItem(childTask, parentTask, bChanged){
        var _ret = '';
        if(bChanged != 0){
            _ret += '<div class="flex1 block-info">';

            if(bChanged & ColumnTaskMessageView.ChangedTitle){
                _ret += '<div class="task-name">';
                var _title = Utils.convertEscapedHtml(childTask.getTitle(), false);
                var _titleTag = Utils.convertEscapedTag(childTask.getTitle());
                _ret += '<div class="box-border-for-abbreviation" title="' + _titleTag + '">';
                _ret += '[' + Resource.getMessage('task_name') + ']';
                _ret += _title + '</div>';
                _ret += '</div>';
            }

            if(bChanged & (ColumnTaskMessageView.ChangedStartDate | ColumnTaskMessageView.ChangedDueDate | ColumnTaskMessageView.ChangedCompleteDate)){
                var _date;
                _ret += '<div class="message-time message-time-task">';
                if(bChanged & ColumnTaskMessageView.ChangedStartDate){
                    _date = childTask.getStartDate();
                    _date = (_date == null) ? '' : Utils.getDate(_date, Utils.DISPLAY_STANDARD_DATE_FORMAT);
                    _ret += '<div>' + Resource.getMessage('task_startdate_label') + Resource.getMessage('label_separator') + _date + '</div>';
                }
                if(bChanged & ColumnTaskMessageView.ChangedDueDate){
                    _date = childTask.getDueDate();
                    _date = (_date == null) ? '' : Utils.getDate(_date, Utils.DISPLAY_STANDARD_DATE_FORMAT);
                    _ret += '<div>' + Resource.getMessage('task_enddate_label') + Resource.getMessage('label_separator') + _date + '</div>';
                }
                if(bChanged & ColumnTaskMessageView.ChangedCompleteDate){
                    _date = childTask.getCompleteDate();
                    _date = (_date == null) ? '' : Utils.getDate(_date, Utils.DISPLAY_STANDARD_DATE_FORMAT);
                    _ret += '<div>' + Resource.getMessage('task_enddate_label') + Resource.getMessage('label_separator') + _date + '</div>';
                }
                _ret += '</div>';
            }

            if(bChanged & ColumnTaskMessageView.ChangedPriority){
                _ret += '<div class="task-priority-string">' + '[' + Resource.getMessage('task_priority_title') + ']';
                switch(childTask.getPriority()){
                case TaskMessage.PRIORITY_LOW:        _ret += Resource.getMessage('task_priority_low');        break;
                case TaskMessage.PRIORITY_MEDIUM:    _ret += Resource.getMessage('task_priority_medium');    break;
                case TaskMessage.PRIORITY_HIGH:        _ret += Resource.getMessage('task_priority_high');        break;
                case TaskMessage.PRIORITY_TOP:        _ret += Resource.getMessage('task_priority_top');        break;
                }
                _ret += '</div>';
            }

            if(bChanged & ColumnTaskMessageView.ChangedMessage){
                _ret += '<div class="task-content">';
                _ret += '<pre>';
                _ret +=  '[' + Resource.getMessage('task_body_placeholder') + ']';
                _ret += childTask.getMessage();
                _ret += '</pre>';
                _ret += '</div>';
            }
            _ret += '</div>';
        }
        return _ret;
    }

    function _footerHtmlChildTaskItem(childTask, parentTask, isParent){
        var _ret = '';
        _ret += '<div class="olient-vertical">';

        var _childTaskOwnerJid = childTask.getOwnerJid();
        var _childTaskItemId = childTask.getItemId();
        _ret += '<div class="child-task-owner-jid olient-horizontal box-border width-100" ownerjid="' + _childTaskOwnerJid + '" itemid="' + _childTaskItemId + '">';

        var _childTaskOwnerUserName = Utils.convertEscapedHtml(_getUserNameAndStatusStrByProfile(childTask, _childTaskOwnerJid));
        var _childTaskOwnerUserNameTag = Utils.convertEscapedTag(_getUserNameAndStatusStrByProfile(childTask, _childTaskOwnerJid));
        var _profile = childTask.getProfileMap().getByKey(_childTaskOwnerJid);
        var _avatarSrc = ViewUtils.getAvatarUrl(_profile);
        _ret += '<div class="child-task-owner box-border-for-abbreviation flex1" title="'+ _childTaskOwnerUserNameTag +'">';
        var HAS_NO_AVATAR = 'images/user_noimage.png';
        if (_avatarSrc == HAS_NO_AVATAR) {
            var _person = new Person();
            _person.setJid(_childTaskOwnerJid);
            _person._profile = _profile;
            _ret += '<span class="ico ico_user child-task-avatar">' + ViewUtils.getDefaultAvatarHtml(_person) + '</span>' + _childTaskOwnerUserName;
            _person._profile = null;
        } else {
            _ret += '<img class="child-task-avatar" src="' + _avatarSrc + '" />' + _childTaskOwnerUserName;
        }
        _ret += '</div>';

        var _childTaskStatus = childTask.getStatus();
        var _childTaskStatusStr = ViewUtils.requestTaskStatusNumToStr(_childTaskStatus, isParent);
        var _childTaskStatusClassName = getTaskStatusClassName(_childTaskStatus);
        if (_childTaskStatus != TaskMessage.STATUS_INBOX) {
            _ret += '<div class="child-task-status-view task-status-view ' + _childTaskStatusClassName + '">' + _childTaskStatusStr + '</div>';
        }
        if(ViewUtils.isIE89()) {
            _ret += '</td></tr></table>'
        }
        _ret += '</div>';

        var _bChanged = _childTaskChangeItemCheck(childTask, parentTask)
        _ret += _childTaskChangeItem(childTask, parentTask, _bChanged);
        _ret += '</div>';
        return _ret;
    }

    _proto.setMessageInnerActionToolTip = function() {
        return;
    };
    function _getUserNameAndStatusStrByProfile(message, jid){
        var _ret = '';
        if(!message || !jid){
            return _ret;
        }

        var _profile = message.getProfileMap().getByKey(jid);
        if(!_profile || typeof _profile != 'object'){
            return　_ret;
        }

        var _userName = _profile.getNickName();
        if(_userName == null || _userName == ''){
            _userName = ViewUtils.getUserName(jid);
        }
        var _statusStr = _getUserStausStr(_profile);

        return _userName + _statusStr;
    }
    function _getUserStausStr(profile){
        var _ret = '';
        var _status = Profile.STATUS_UNKNOWN;
        if(profile != null){
            _status = profile.getStatus();
        }
        _ret = ViewUtils.getUserStatusString(_status);
        return _ret;
    };

    ColumnTaskMessageView.getMessageEditAreaHtml = function(message) {
        if (_validation({'message' : message}) == false) {
            return '';
        }
        return getMessageEditAreaHtml(message);
    };
    ColumnTaskMessageView.getTaskMessageCLSName = function(message) {
        if (_validation({'message' : message}) == false) {
            return '';
        }
        return getTaskMessageCLSName(message);
    };
    ColumnTaskMessageView.getTaskStatusCLSName = function(message) {
        if (_validation({'message' : message}) == false) {
            return '';
        }
        return getTaskStatusClassName(message.getStatus());
    };

    function getMessageEditAreaHtml(msg) {
        var _ret = '';
        var _itemId = msg.getItemId();
        var _clientJid = msg.getClient();
        _ret += '<form class="edit-area display-none">';
        _ret += '<img class="action-update-task action-button-base" src="images/add_send.png">';
        _ret += '<div class="width-100">';
        _ret += '  <div class="edit-task-client edit-task-label">' + Resource.getMessage('task_client') + '<span class="edit-task-label-margin">&nbsp;</span>：' + Utils.convertEscapedHtml(ViewUtils.getUserName(_clientJid)) + '</div>';
        _ret += '  <div class="edit-task-priority box-border olient-horizontal">';
        _ret += '    <div class="edit-task-label">' + Resource.getMessage('task_priority_title') + '<span class="edit-task-label-margin">&nbsp;</span>：</div>';
        _ret += '    <select id="task-priority" class="ui-corner-all flex1">';
        _ret += '      <option value="' + TaskMessage.PRIORITY_LOW + '">' + Resource.getMessage('task_priority_low') + '</option>';
        _ret += '      <option value="' + TaskMessage.PRIORITY_MEDIUM + '">' + Resource.getMessage('task_priority_medium') + '</option>';
        _ret += '      <option value="' + TaskMessage.PRIORITY_HIGH + '">' + Resource.getMessage('task_priority_high') + '</option>';
        _ret += '      <option value="' + TaskMessage.PRIORITY_TOP + '">' + Resource.getMessage('task_priority_top') + '</option>';
        _ret += '    </select>';
        _ret += '  </div>';
        _ret += '</div>';
        _ret += '<div class="edit-task-date">';
        _ret += '  <div class="edit-task-start-date olient-horizontal">';
        _ret += '    <div class="task-date-input">';
        _ret += '      <input id="task-start-date-' + _itemId + '" name="task-start-date" class="task-start-date date-time-picker ui-corner-all" placeholder="' + Resource.getMessage('task_start_date') + '">';
        _ret += '    </div>';
        _ret += '  </div>';
        _ret += '  <div class="edit-task-due-date olient-horizontal">';
        _ret += '    <div class="task-date-input">';
        _ret += '      <input id="task-due-date' + _itemId + '" name="task-due-date" class="task-due-date date-time-picker ui-corner-all" placeholder="' + Resource.getMessage('task_due_date') + '">';
        _ret += '    </div>';
        _ret += '  </div>';
        _ret += '</div>';
        _ret += '<div class="edit-task-name box-border olient-horizontal">';
        _ret += '<div class="flex1">';
        _ret += '<input class="ui-corner-all" name="task-name" placeholder="' + Resource.getMessage('task_name_placeholder') + '">';
        _ret += '</div>';
        _ret += '<div>';
        _ret += ViewUtils.getCharCounterHtml('char-counter-task-add-dialog');
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<div class="edit-task-body box-border olient-horizontal">';
        _ret += '<div class="task-body-textarea-area flex1">';
        _ret += '<textarea id="task-body" name="task-body" class="ui-corner-all autoresize-textarea" placeholder="' + Resource.getMessage('task_body_placeholder') + '"></textarea>';
        _ret += '</div>';
        _ret += '<div class="task-body-char-counter">';
        _ret += ViewUtils.getCharCounterHtml('char-counter-task-add-dialog');
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<div class="edit-attached-files">';
        _ret += '</div>';
        _ret += '<div class="edit-task-client-owner box-border olient-horizontal width-100">';
        _ret += '<div class="edit-task-label">' + Resource.getMessage('task_owner_edit') + '<span class="edit-task-label-margin">&nbsp;</span>：</div>'
        _ret += '<div class="edit-task-owner">';
        _ret += '<select id="task-owner" class="ui-corner-all">';
        _ret += '</select>';
        _ret += '</div>';
        _ret += '</div>';
        _ret += '<div class="width-100">';
        _ret += '<div class="edit-task-status box-border olient-horizontal width-100">';
        _ret += '<div class="edit-task-label">' + Resource.getMessage('task_status') + '</div>';
        _ret += '<select id="task-status" class="ui-corner-all">';
        _ret += '</select>';
        _ret += '<div class="edit-task-space" />';
        _ret += '</div>';
        _ret += '</div>';

        _ret += '</form>';
        return _ret;
    };
    function getTaskMessageCLSName(message) {
        if (!message || typeof message != 'object' || message.getType() != Message.TYPE_TASK) {
            return '';
        }
        var _ret = '';
        var _status = message.getStatus();
        if (_status >= TaskMessage.STATUS_FINISHED) {
            _ret = ColumnTaskMessageView.TASK_FINISHED_CLS_NAME;
        } else {
            var _priority = message.getPriority();
            switch(_priority) {
                case TaskMessage.PRIORITY_MEDIUM:
                    _ret = ColumnTaskMessageView.TASK_PRIORITY_MEDIUM_CLS_NAME;
                    break;
                case TaskMessage.PRIORITY_HIGH:
                    _ret = ColumnTaskMessageView.TASK_PRIORITY_HIGH_CLS_NAME;
                    break;
                case TaskMessage.PRIORITY_TOP:
                    _ret = ColumnTaskMessageView.TASK_PRIORITY_TOP_CLS_NAME;
                    break;
                default:
                    break;
            }
            var _backGroundCssClass = 'task-alert-normal';
            var _dueDate = message.getDueDate();
            if (_dueDate != null) {
                var _now = new Date();
                var _infoAlertRangeStart = _now.clone().rewind({
                    day : -1
                }, true);
                var _infoAlertRangeEnd = _now.clone().rewind({
                    day : -4
                }, true);
                _infoAlertRangeEnd = _infoAlertRangeEnd.addSeconds(-1);
                if (_now.isAfter(_dueDate)) {
                    _backGroundCssClass = 'task-alert-caution';
                } else if (_dueDate.isToday()) {
                    _backGroundCssClass = 'task-alert-warning';
                } else if (_dueDate.isBetween(_infoAlertRangeStart, _infoAlertRangeEnd, 1)) {
                    _backGroundCssClass = 'task-alert-info';
                }
            }
            if (_ret != '') {
                _ret += ' ';
            }
            _ret += _backGroundCssClass;
        }

        return _ret;
    };
    function getTaskStatus(message) {
        var _retStatus = -1;
        var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(message.getItemId());
        if (_childrenTaskItemIds != null && _childrenTaskItemIds.getCount() > 0) {
            var _childrenCount = _childrenTaskItemIds.getCount();
            for (var _i = 0; _i < _childrenCount; _i++) {
                var _childTask = CubeeController.getInstance().getMessage(_childrenTaskItemIds.get(_i));
                if (_childTask == null) {
                    continue;
                }
                var _childStatus = _childTask.getStatus();
                if (_retStatus == -1 || _childStatus < _retStatus) {
                    _retStatus = _childStatus;
                }
            }
        }
        if (_retStatus == -1) {
            _retStatus = message.getStatus();
        }
        return _retStatus;
    };
    function getTaskStatusClassName(status) {
        var _statusClassName = '';
        switch(status) {
            case TaskMessage.STATUS_ASSIGNING:
                _statusClassName = 'task-status-view-assigning';
                break;
            case TaskMessage.STATUS_NEW:
                _statusClassName = 'task-status-view-new';
                break;
            case TaskMessage.STATUS_DOING:
                _statusClassName = 'task-status-view-doing';
                break;
            case TaskMessage.STATUS_FINISHED:
                _statusClassName = 'task-status-view-finished';
                break;
            case TaskMessage.STATUS_REJECTED:
                _statusClassName = 'task-status-view-rejected';
                break;
            default:
                break;
        }
        return _statusClassName;
    };
    function getStatusCount(taskList) {
        var _retArray = new Array();
        _retArray[TaskMessage.STATUS_UNKNOWN] = 0;
        _retArray[TaskMessage.STATUS_INBOX] = 0;
        _retArray[TaskMessage.STATUS_ASSIGNING] = 0;
        _retArray[TaskMessage.STATUS_NEW] = 0;
        _retArray[TaskMessage.STATUS_DOING] = 0;
        _retArray[TaskMessage.STATUS_SOLVED] = 0;
        _retArray[TaskMessage.STATUS_FEEDBACK] = 0;
        _retArray[TaskMessage.STATUS_FINISHED] = 0;
        _retArray[TaskMessage.STATUS_REJECTED] = 0;
        _retArray[TaskMessage.STATUS_UNKNOWN] = 0;
        if(taskList == null) {
            return _retArray;
        }
        var _count = taskList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _taskMessage = taskList.get(_i);
            if(_taskMessage == null ) {
                continue;
            }
            var _status = _taskMessage.getStatus();
            if(_retArray[_status] == undefined) {
                _retArray[_status] = 0;
            }
            _retArray[_status]++;
        }
        return _retArray;
    };
    function getStatusCountHtml(status, count) {
        var _retHtml = '';
        if (_validation({'status' : status, 'count' : count}) == false) {
            return _retHtml;
        }
        if(count < 1) {
            return _retHtml;
        }
        switch(status) {
            case TaskMessage.STATUS_INBOX:
                _retHtml = '&nbsp;<span class="task-status-view-count-status-inbox">' + Resource.getMessage('task_to_inbox_omit') + '</span>:' + count + '&nbsp;';
                break;
            case TaskMessage.STATUS_ASSIGNING:
                _retHtml = '&nbsp;<span class="task-status-view-count-status-assigning">' + Resource.getMessage('task_status_assign_omit') + '</span>:' + count + '&nbsp;';
                break;
            case TaskMessage.STATUS_NEW:
                _retHtml = '&nbsp;<span class="task-status-view-count-status-new">' + Resource.getMessage('task_status_new_omit') + '</span>:' + count + '&nbsp;';
                break;
            case TaskMessage.STATUS_DOING:
                _retHtml = '&nbsp;<span class="task-status-view-count-status-doing">' + Resource.getMessage('task_status_do_omit') + '</span>:' + count + '&nbsp;';
                break;
            case TaskMessage.STATUS_FINISHED:
                _retHtml = '&nbsp;<span class="task-status-view-count-status-finished">' + Resource.getMessage('task_status_fin_omit') + '</span>:' + count + '&nbsp;';
                break;
            case TaskMessage.STATUS_REJECTED:
                _retHtml = '&nbsp;<span class="task-status-view-count-status-rejected">' + Resource.getMessage('task_status_rej_omit') + '</span>:' + count + '&nbsp;';
                break;
            default:
                break;
        }
        return _retHtml;
    };
    function _validation(args) {
        for (var p in args) {
            if (p == 'message') {
                if (!args[p] || typeof args[p] != 'object' || args[p].getType() != Message.TYPE_TASK) {return false;}
            } else if (p == 'status' || p == 'count') {
                if (args[p] == null || typeof args[p] != 'number') {return false;}
            }
        }
        return true;
    };
    _proto.getMessageBodyHtml = function() {
        var _self = this;
        var _ret = '';
        var _message = _self.getMessage();
        _ret = _getMessageBodyHtml(_message);
        return _ret;
    };
    ColumnTaskMessageView.getMessageBodyHtml = function(message) {
        var _ret ='';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageBodyHtml(message);
        return _ret;
    };
    function _getMessageBodyHtml(msg) {
        var _ret = ColumnMessageView.getMessageBodyHtml(msg);
        return _ret;
    }
    _proto._setReadMessage = function(){
    };
    _proto._setMessageReadFlgView = function() {
    };
})();
