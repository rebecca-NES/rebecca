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
function DemandTaskCautionIconView(itemList) {
    CautionIconView.call(this, itemList);
    this._itemList = new StringMapedArrayList();
};(function() {
    DemandTaskCautionIconView.prototype = $.extend({}, CautionIconView.prototype, ViewCore.prototype);
    var _super = CautionIconView.prototype;
    var _proto = DemandTaskCautionIconView.prototype;
    _proto._init = function(itemList) {
        var _self = this;
        _super._init.call(_self, itemList);
        _self._itemList = itemList;
        _self._createNotificationTooltip();
    };
    _proto.updateNotificationArea = function(itemList) {
        var _self = this;
        _super.updateNotificationArea.call(_self, itemList);
        _self._itemList.removeAll();
        _self._itemList = itemList;
        _self._count = _self._getAllItemCount();
        if (_self._count == 0) {
            NotificationIconManager.getInstance().removeCautionIcon(_self);
        } else {
            _self._addNotificationCount(_self._count);
            _self.updateNotificationTooltipMessage();
        }
    };
    _proto._getAllItemCount = function() {
        var _self = this;
        var _count = 0;
        for (var _i = 0; _i < _self._itemList.getCount(); _i++) {
            _count += _self._itemList.get(_i).valueOf();
        }
        return _count;
    };
    _proto._getIconPath = function() {
        return 'images/demand_task_notice_yellow.png';
    };
    _proto._setType = function() {
        var _self = this;
        _self._type = CautionIconView.TYPE_DEMAND_TASK;
    };
    _proto._getIconTitle = function() {
        return Resource.getMessage('demand_notification');
    };
    _proto._createNotificationTooltip = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _toolTipSetting = null;
        _toolTipSetting = {
            showOn : 'click touchend',
            holder : _selfElm,
            content : _self._notificationTooltipHtml(),
            delay : [TooltipView.getInstance().TOOLTIP_SHOW_TIME, TooltipView.getInstance().TOOLTIP_HIDE_TIME]
        };
        // This guard always evaluates to false.
        // if(_toolTipSetting == null) {
        //     return false;
        // }
        if (ViewUtils.isIE8()) _toolTipSetting.updateOn = 'dummy';
        var _innerElement = _selfElm.children('.mTip').children('div.notification_list');
        var _inboxCount = _self._itemList.getByKey(String(ColumnInformation.TYPE_COLUMN_INBOX));
        var _taskCount = _self._itemList.getByKey(String(ColumnInformation.TYPE_COLUMN_TASK));
        if (_inboxCount != null && _inboxCount.valueOf() > 0) {
            var _targetElm = _innerElement.children("[columntype='" + ColumnInformation.TYPE_COLUMN_INBOX + "']");
            _self._addEventClick(_targetElm);
        }
        if (_taskCount != null && _taskCount.valueOf() > 0) {
            var _targetElm = _innerElement.children("[columntype='" + ColumnInformation.TYPE_COLUMN_TASK + "']");
            _self._addEventClick(_targetElm);
        }
        _self._count = _self._getAllItemCount();
        _self._addNotificationCount(_self._count);

        return true;
    };
    _proto.updateNotificationTooltipMessage = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _htmlString = '';
        var _inboxCount = _self._itemList.getByKey(String(ColumnInformation.TYPE_COLUMN_INBOX));
        var _taskCount = _self._itemList.getByKey(String(ColumnInformation.TYPE_COLUMN_TASK));
        if (_inboxCount != null && _inboxCount.valueOf() > 0) {
            _htmlString = _self._notificationTooltipMessageHtml(ColumnInformation.TYPE_COLUMN_INBOX, _inboxCount.valueOf());
        }
        _self._updateIconContent(ColumnInformation.TYPE_COLUMN_INBOX, _htmlString);
        _htmlString = '';
        if (_taskCount != null && _taskCount.valueOf() > 0) {
            _htmlString = _self._notificationTooltipMessageHtml(ColumnInformation.TYPE_COLUMN_TASK, _taskCount.valueOf());
        }
        _self._updateIconContent(ColumnInformation.TYPE_COLUMN_TASK, _htmlString);
    };
    _proto._updateIconContent = function(columnType, htmlString) {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _innerElement = _selfElm.children('.mTip').children('div.notification_list');
        var _notificationMessageByColumnType = _innerElement.children("[columntype='" + columnType + "']");
        if(_notificationMessageByColumnType.length > 0) {
            _notificationMessageByColumnType.remove();
        }
        if (htmlString != '') {
            _innerElement.prepend(htmlString);
            _self._addEventClick(_innerElement.children("[columntype='" + columnType + "']"));
        }
    };

    _proto._notificationTooltipHtml = function() {
        var _self = this;
        var _htmlString = '';
        var _inboxCount = _self._itemList.getByKey(String(ColumnInformation.TYPE_COLUMN_INBOX));
        var _taskCount = _self._itemList.getByKey(String(ColumnInformation.TYPE_COLUMN_TASK));
        if (_inboxCount != null && _inboxCount.valueOf() > 0) {
            _htmlString += _self._notificationTooltipMessageHtml(ColumnInformation.TYPE_COLUMN_INBOX, _inboxCount.valueOf());
        }
        if (_taskCount != null && _taskCount.valueOf() > 0) {
            _htmlString += _self._notificationTooltipMessageHtml(ColumnInformation.TYPE_COLUMN_TASK, _taskCount.valueOf());
        }
        return '<div class="notification_list">' + _htmlString + '</div>';
    };
    _proto._notificationTooltipMessageHtml = function(columnType, counter) {
        var _htmlString = '';
        if (counter > 0) {
            var _columnName = ColumnView.DISPLAY_NAME_MY_TASK;
            if (columnType == ColumnInformation.TYPE_COLUMN_INBOX) {
                _columnName = ColumnView.DISPLAY_NAME_INBOX;
            }
            _htmlString = '<div style="cursor: pointer;" class="notification_listitem" ';
            _htmlString += 'columntype="' + columnType + '" value="' + counter + '">';
            _htmlString += '<h>' + _columnName + '(' + counter + Resource.getMessage('notification_items') + ')</h>';
            _htmlString += '</div>';
        }
        return _htmlString;
    };
    _proto._addEventClick = function(NotificationListItemElm) {
        if(NotificationListItemElm == null || typeof NotificationListItemElm != 'object') {
            return;
        }
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _countElm = _selfElm.children('button.notification-count');
        var _onListItemClicked = function() {
            var _selectedColumnType = NotificationListItemElm.attr('columntype') * 1;
            function onActiveMyWorkplace(result) {
                if(!result) {
                    return;
                }
                switch (_selectedColumnType){
                    case ColumnInformation.TYPE_COLUMN_TASK:
                        ColumnManager.getInstance().addTaskColumn(null, true);
                        break;
                    case ColumnInformation.TYPE_COLUMN_INBOX:
                        ColumnManager.getInstance().addInboxColumn(true);
                        break;
                    default:
                        break;
                }
            };
            if(TabManager.getInstance().isActiveMyWorkplace()) {
                onActiveMyWorkplace(true);
            } else {
                TabManager.getInstance().activeMyWorkplaceTab(onActiveMyWorkplace);
            }
        };
        NotificationListItemElm.on('click', function() {
            _onListItemClicked();
        });
    };
    DemandTaskCautionIconView.getDemandTaskCount = function() {
        var _itemList = new StringMapedArrayList();
        var _getDemandTaskCountFilter = FilterManager.getFilter(FilterManager.TYPE_MESSAGE_COUNT_DEMAND_TASK, ColumnInformation.TYPE_COLUMN_TASK);
        function _onGetCountDemandTask(result, count) {
            _itemList.add(String(ColumnInformation.TYPE_COLUMN_TASK), new Number(count));
            var _getDemandInboxCountFilter = FilterManager.getFilter(FilterManager.TYPE_MESSAGE_COUNT_DEMAND_TASK, ColumnInformation.TYPE_COLUMN_INBOX);
            function _onGetCountDemandInbox(result, count) {
                _itemList.add(String(ColumnInformation.TYPE_COLUMN_INBOX), new Number(count));
                NotificationIconManager.getInstance().askCautionExistence(CautionIconView.TYPE_DEMAND_TASK, _itemList);
            };
            var _ret = CubeeController.getInstance().getMessageCount(_getDemandInboxCountFilter, _onGetCountDemandInbox);
            if(!_ret){
                console.log('GetMessageCount Request is fail');
                return;
            }
        };
        var _ret = CubeeController.getInstance().getMessageCount(_getDemandTaskCountFilter, _onGetCountDemandTask);
        if(!_ret){
            console.log('GetMessageCount Request is fail');
            return;
        }
    };
})();
