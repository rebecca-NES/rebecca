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

function ColumnInboxView(columnInformation) {
    ColumnTaskView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_INBOX;
    this._displayName = ColumnView.DISPLAY_NAME_INBOX;
    ColumnView.prototype.createView.call(this);

    columnInformation.setIconImage('images/column_inbox.png');
};(function() {
    ColumnInboxView.cssClass = 'inbox-border-message';

    ColumnInboxView.prototype = $.extend({}, ColumnTaskView.prototype);
    var _super = ColumnTaskView.prototype;
    var _proto = ColumnInboxView.prototype;

    _proto._createSubForms = function() {
        var _self = this;
        var _htmlElem = _self.getHtmlElement();
        if(_htmlElem == null) {
            return;
        }
        var _textareaElement = _htmlElem.find('div.frm-message > textarea');
        _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('inbox_placeholder'));
        var _btnElement = _htmlElem.find('div.frm-message > button');
        _self._button = new ColumnSubmitButtonView(_btnElement, _self, Resource.getMessage('inbox_submit'));
        ViewUtils.setCharCounter(_textareaElement, _htmlElem.find('.' + ViewUtils.CHAR_COUNTER_CLASSNAME), ColumnView.TEXTAREA_MAX_LENGTH);
        var _fileUploadElement = _htmlElem.find('div.frm-message > .file-inputs');
        _self._fileUpload = new ColumnFileUploadPartsView(_fileUploadElement, this);
        var _progressBarElement = _htmlElem.find('div.frm-message').find('.submit-message-progress');
        _self._progressBar = new ProgressBarView(_progressBarElement, false);
    };
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _getCount = 20;
        function onGetInboxHistoryMessageCallback(resultMessageData) {
            var _messageList = resultMessageData.messageDataList;
            var _allItemCount = resultMessageData.allItemCount;
            if (_messageList.getCount() < _getCount) {
                _self._allMessageReceived = true;
            }
            _self._onGetInboxHistoryMessage(_messageList, _allItemCount);
            $(window).trigger('resize');
            _self.refreshScrollbar();
        }
        CubeeController.getInstance().searchMessage(_self._currentLoadedItemId, _getCount, _columnInfo.getSearchCondition(), onGetInboxHistoryMessageCallback);
    };
    _proto.clickSubFormButton = function() {
        var _self = this;

        var _jid = LoginUser.getInstance().getJid();
        function _addInbox(message) {
            function addTaskCallback(result) {
                console.log("add inbox : " + result);
            };
            var _taskMessage = new TaskMessage();
            _taskMessage.setMessage(message);
            _taskMessage.setStatus(TaskMessage.STATUS_INBOX);
            _taskMessage.setOwnerJid(_jid);
            _taskMessage.setClient(_jid);
            if (CubeeController.getInstance().addTask(_taskMessage, addTaskCallback) == true) {
                _self._textarea.clearText();
                _self._textarea.getHtmlElement().focus();
                if (_self._fileUpload != undefined) {
                    if (_self._fileUpload != null) {
                        _self._fileUpload.clearFileUpload();
                    }
                }
            } else {
                console.log("faild to add inbox");
                throw 'faild to send Inbox Message:';
            }
        };

        var _text = _self._textarea.getText();
        var retflag = _self._uploadFileAndSendMessage(_text, _addInbox);
        _self._textarea.clearTextFromFlag(retflag);
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
                _msgObj = new ColumnInboxMessageView(_self, msg);
                break;
            default:
                console.log('ColumnInboxView::createMessageObjectOnly _ invalid type:' + _type);
                break;
        }
        return _msgObj;
    };
    _proto.getColumnMessageHtml = function(message) {
        var _ret = '';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = message.getMessageHtml();
        return _ret;
    };
    _proto._onGetInboxHistoryMessage = function(messageList, allItemCount) {
        var _self = this;
        _self._hideLoadingIconInSelf();
        if (!messageList) {
            return;
        }
        if (_self._unfinishedTaskCount == null || _self._unfinishedTaskCount == -1) {
            _self._unfinishedTaskCount = allItemCount;
        }

        var _count = messageList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _inboxMessage = messageList.get(_i);
            if (_inboxMessage == null) {
                continue;
            }
            var _itemId = _inboxMessage.getItemId();
            if (!_self.getMsgObjByItemId(_itemId)) {
                _self.showHistoryMessage(_inboxMessage);
            }
            if(_inboxMessage.getDemandStatus() == TaskMessage.DEMAND_ON) {
                _self._demandTaskItemIds.add(_itemId, _inboxMessage);
            }
        }
        _self._readAll(messageList);

        if (_self._allMessageReceived == true) {
            _self.updateColumnTitle(_self._unfinishedTaskCount);
        }
    };
    _proto._readAll = function(taskMessageList) {
        var _self = this;
        if (_self._allMessageReceived == false) {
            _self._showReadMore(true);
        }
    };
    _proto.deleteMessage = function(itemId) {
        var _self = this;
        if(_super.deleteMessageBase.call(_self, itemId)) {
            if (_self._unfinishedTaskCount > 0) {
                _self._unfinishedTaskCount--;
                _self.updateColumnTitle(_self._unfinishedTaskCount);
            }
        }
        return;
    };
    _proto._updateMessageOnDemand = function(itemId, newDemandStatus) {
        var _self = this;
        var _messageViewObj = _self.getMsgObjByItemId(itemId);
        if(_messageViewObj == null){
            return;
        }
        var _inboxMessage = _messageViewObj.getMessage();
        var isDemandUp = false;
        if(newDemandStatus == TaskMessage.DEMAND_ON) {
            var _columnInfo = _self._info;
            var _searchCondition = _columnInfo.getSearchCondition();
            var _sortCondition = _searchCondition.getSortCondition();
            var _sortItems = _sortCondition.getItems();
            var _sortOders = _sortCondition.getOrders();
            if(_sortItems.get(0) == TaskFilterAndSortCondition.DB_COLUMN_DEMAND_STATUS && _sortOders.get(0) == ColumnSortCondition.SORT_ORDER_DESC
                && _sortItems.get(1) == TaskFilterAndSortCondition.DB_COLUMN_DEMAND_DATE && _sortOders.get(1) == ColumnSortCondition.SORT_ORDER_ASC) {
                isDemandUp = true;
            }
        }

        var _pos = _self.getMsgObjIndexPositionByItemId(itemId);
        var _targetMsgElm = _messageViewObj.getHtmlElement();
        _targetMsgElm.remove();
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

        _self._insertMessage(_inboxMessage, _insertPos);
    };

    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = ColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new ColumnOptionMenu(_optionMenuElem, _self._info, _self);
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
        _self.removeMsgObjIndexByItemId(_targetMsgItemId);

        var _preStatus = taskMessage.getPreStatus();
        var _newStatus = taskMessage.getStatus();

        _self._removeTaskMessageElement(_targetMsgElm, _newStatus);

        if (_self.isNeedShowTask(taskMessage) == false) {
            if (_preStatus > TaskMessage.STATUS_UNKNOWN && _preStatus < TaskMessage.STATUS_FINISHED) {
                if (_self._unfinishedTaskCount > 0) {
                    _self._unfinishedTaskCount--;
                    _self.updateColumnTitle(_self._unfinishedTaskCount);
                }
            }
            return;
        }
        if (_preStatus > TaskMessage.STATUS_UNKNOWN && _preStatus < TaskMessage.STATUS_FINISHED) {
            if (_self._unfinishedTaskCount > 0) {
                _self._unfinishedTaskCount--;
            }
        }
        _self.updateColumnTitle(_self._unfinishedTaskCount);
        _self.onAddTaskMessageReceive(taskMessage);
    };
    _proto._showReadMore = function() {
        var _self = this;
        _super._showReadMore.call(_self, true);
    };
})();
