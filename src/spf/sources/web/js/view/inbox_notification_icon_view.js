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

function InboxNotificationIconView(message) {
    this._demandTask = 0;
    this._normalTask = 0;
    NotificationIconView.call(this, message);
};(function() {
    InboxNotificationIconView.prototype = $.extend({}, NotificationIconView.prototype, ViewCore.prototype);
    var _super = NotificationIconView.prototype;
    var _proto = InboxNotificationIconView.prototype;
    _proto._init = function(message) {
        var _self = this;
        _super._init.call(_self, message);
        _self._createNotificationTooltip(message);
    };
    _proto.updateNotificationArea = function(message) {
       var _self = this;
        _super.updateNotificationArea.call(_self, message);
        _self.updateNotificationTooltipMessage(message);
    };
    _proto._setType = function() {
        var _self = this;
        _self._type = ColumnInformation.TYPE_COLUMN_INBOX;
    };
    _proto._createNotificationTooltip = function(message) {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _onGetContentCallback = function(content){
            var _htmlString = content;
            var _notificationMessageByAvatar = _selfElm.find(".alert_inbox");
            if(_notificationMessageByAvatar.length > 0) {
                _notificationMessageByAvatar.parent('li').off().remove();
            }
            _selfElm.append(_htmlString);
            var _targetElm = _selfElm.find(".alert_inbox");
            _self._addEventClick(_targetElm);
            NotificationIconManager.getInstance().addAttention();
            return true;
        };
        _self._notificationTooltipHtml(message, _onGetContentCallback);
    };
    _proto.makeNumber = function(normaltask) {
        var _self = this;
        var _htmlString = "";
        if(_self.getNormalTask() > 0){
            _htmlString = '(<span class="count">' + _self.getNormalTask() + '</span>' + Resource.getMessage('notification_items') + ')';
        }
        if(_self.getDemandTask() > 0){
            _htmlString += '(催促' + _self.getDemandTask() + Resource.getMessage('notification_items') + ')';
        }
        return _htmlString;
    };
    _proto.setNormalTask = function(normaltask) {
        var _self = this;
        _self._normalTask = normaltask;
    };
    _proto.getNormalTask = function() {
        var _self = this;
        return _self._normalTask;
    };
    _proto.setDemandData = function(itemList) {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _targetElem = _selfElm.find(".alert_inbox");
        _self._demandTask = itemList.getByKey(ColumnInformation.TYPE_COLUMN_INBOX.toString());
        if(_self.getTaskCount() == 0){
            _self._onListItemClicked();
        }else{
            _targetElem.find(".number").html(_self.makeNumber());
        }
    };
    _proto.getDemandTask = function() {
        var _self = this;
        return _self._demandTask;
    };
    _proto.getTaskCount = function() {
        var _self = this;
        return _self.getNormalTask() + _self.getDemandTask();
    };
    _proto.updateNotificationTooltipMessage = function(message) {
        var _self = this;
        var _onGetContentCallback = function(content){
            var _selfElm = _self._htmlElement;
            var _htmlString = content;
            var _notificationMessageByAvatar = _selfElm.find(".alert_inbox");
            if(_notificationMessageByAvatar.length > 0) {
                _notificationMessageByAvatar.parent('li').off().remove();
            }
            _selfElm.append(_htmlString);
            _self._addEventClick(_selfElm.find(".alert_inbox"));
        };
        _self._notificationTooltipMessageHtml(message, _onGetContentCallback);
    };
    _proto._notificationTooltipHtml = function(message, callback) {
        if(callback == null || typeof callback != 'function'){
            return '';
        }
        var _self = this;
        var _onGetContentCallback = function(content){
            callback(content);
        };
        _self._notificationTooltipMessageHtml(message, _onGetContentCallback);
    };
    _proto._notificationTooltipMessageHtml = function(message, callback) {
        if(callback == null || typeof callback != 'function'){
            return '';
        }
        var _self = this;
        var _selfElm = _self._htmlElement;

        var _notificationMessageByAvatar = _selfElm.find(".alert_inbox");
        if (message != null) {
            _self.setNormalTask(_self.getNormalTask()+1);
        }
        var _htmlString = '<li class="sortable-item">';
        _htmlString += '<a  class="alert_inbox text_btn">';
        _htmlString += '<span class="ico ico_system">';
        _htmlString += '<i class="menu-column fa fa-archive" title="インボックス"></i>';
        _htmlString += '</span>';
        _htmlString += '<span class="name">インボックス</span><span class="number">' + _self.makeNumber() + '</span>';
        _htmlString += '</a></li>';
        callback(_htmlString);
    };
    _proto._addEventClick = function(notificationListItemElm) {
        if(notificationListItemElm == null || typeof notificationListItemElm != 'object') {
            return;
        }
        var _self = this;
        notificationListItemElm.on('click', function() {
            function activeColumn(){
                var cmi = ColumnManager.getInstance();
                cmi.addInboxColumn(true);
            }
            if(TabManager.getInstance().isActiveMyWorkplace()){
                activeColumn();
            }else{

                TabManager.getInstance().activeMyWorkplaceTab(activeColumn);
            }
            _self._onListItemClicked();
        });
    };
    _proto._onListItemClicked = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _targetElem = _selfElm.find(".alert_inbox");
        if(_targetElem.length <= 0) {
            return;
        }
        _self.setNormalTask(0);
        if((_self.getTaskCount() == 0) || (NotificationSettingManager.getInstance().isSetting(ColumnInformation.TYPE_COLUMN_INBOX, ""))){
            _targetElem.parent("li").off().remove();
            NotificationIconManager.getInstance().removeNotificationIcon(_self);
            NotificationIconManager.getInstance()
                                   .removeAttentionHeaderColumnIcon(
                                       'li[columntype="'+ColumnInformation.TYPE_COLUMN_INBOX
                                       +'"].sortable-item .ico_system');
        }else{
              _targetElem.find(".number").html(_self.makeNumber());
        }
    };
    _proto.onColumnClicked = function(columnInformation) {
        var _self = this;
        var _clickedColumnType = columnInformation.getColumnType();
        if(_self.getType() != _clickedColumnType) {
            return;
        }
        _self._onListItemClicked();
    };
})();
