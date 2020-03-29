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
function ToMeNotificationIconView(message) {
    NotificationIconView.call(this, message);
};(function() {
    ToMeNotificationIconView.prototype = $.extend({}, NotificationIconView.prototype, ViewCore.prototype);
    var _super = NotificationIconView.prototype;
    var _proto = ToMeNotificationIconView.prototype;
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
        _self._type = ColumnInformation.TYPE_COLUMN_TOME;
    };
    _proto._createNotificationTooltip = function(message) {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _onGetContentCallback = function(content){
            var _htmlString = content;
            var _notificationMessageByAvatar = _selfElm.find(".alert_tome");
            if(_notificationMessageByAvatar.length > 0) {
                _notificationMessageByAvatar.parent('li').off().remove();
            }
            _selfElm.append(_htmlString);
            var _targetElm = _selfElm.find(".alert_tome");
            _self._addEventClick(_targetElm);
            NotificationIconManager.getInstance().addAttention(); 
            return true;
        };
        _self._notificationTooltipHtml(message, _onGetContentCallback);
    };
    _proto.updateNotificationTooltipMessage = function(message) {
        var _self = this;
        var _onGetContentCallback = function(content){
            var _selfElm = _self._htmlElement;
            var _htmlString = content;
            var _notificationMessageByAvatar = _selfElm.find(".alert_tome");
            if(_notificationMessageByAvatar.length > 0) {
                _notificationMessageByAvatar.parent('li').off().remove();
            }
            _selfElm.append(_htmlString);
            _self._addEventClick(_selfElm.find(".alert_tome"));
        };
        _self._notificationTooltipMessageHtml(message, _onGetContentCallback);
    };
    _proto._notificationTooltipHtml = function(message, callback) {
        if(message == null || typeof message != 'object') {
            return '';
        }
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

        var _notificationMessageByAvatar = _selfElm.find(".alert_tome");
        var _counter = 0;
        if(_notificationMessageByAvatar.length > 0) {
            _counter = _notificationMessageByAvatar.find('.count').html();
        }
        _counter++;
        var _htmlString = '<li class="sortable-item">';
        _htmlString += '<a  class="alert_tome text_btn">';
        _htmlString += '<span class="ico ico_system">';
        _htmlString += '<i class="menu-column fa fa-at" title="自分宛"></i>';
        _htmlString += '</span>';
        _htmlString += '<span class="name">自分宛</span>(<span class="count">' + _counter + '</span>' + Resource.getMessage('notification_items') + ')';
        _htmlString += '</a></li>';
        callback(_htmlString);
    };






    _proto._addEventHandler = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        _selfElm.click(function() {
            console.log('ToMeNotificationIconView::_addEventHandler … click!');
            if(TabManager.getInstance().isActiveMyWorkplace()) {
                ColumnManager.getInstance().addColumnInfo(_self._type,true, true);
                NotificationIconManager.getInstance().removeNotificationIcon(_self);
            } else {
                function onActiveMyWorkplace(result) {
                    if(!result) {
                        return;
                    }
                    ColumnManager.getInstance().addColumnInfo(_self._type,true, true);
                };
                TabManager.getInstance().activeMyWorkplaceTab(onActiveMyWorkplace);
            }
        });
    };
    _proto._addEventClick = function(notificationListItemElm) {
        if(notificationListItemElm == null || typeof notificationListItemElm != 'object') {
            return;
        }
        var _self = this;
        notificationListItemElm.on('click', function() {
            function activeColumn(){
                var cmi = ColumnManager.getInstance();
                cmi.addColumnInfo(ColumnInformation.TYPE_COLUMN_TOME,true)
                _self._onListItemClicked();
            }
            if(TabManager.getInstance().isActiveMyWorkplace()){
                activeColumn();
            }else{
                TabManager.getInstance().activeMyWorkplaceTab(activeColumn);
            }
        });
    };
    _proto._onListItemClicked = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _targetElem = _selfElm.find(".alert_tome");
        if(_targetElem.length <= 0) {
            return;
        }
        _targetElem.parent("li").off().remove();
        NotificationIconManager.getInstance().removeNotificationIcon(_self);

        NotificationIconManager.getInstance()
                               .removeAttentionHeaderColumnIcon(
                                   'li[columntype="'+ColumnInformation.TYPE_COLUMN_TOME
                                   +'"].sortable-item .ico_system');
    };
    _proto.onColumnClicked = function(columnInformation) {
        var _self = this;
        var _clickedColumnType = columnInformation.getColumnType();
        if(_self.getType() != _clickedColumnType) {
            return;
        }
        _self._onListItemClicked();
    };
    _proto._getIconPath = function() {
        return 'images/notice_tome.png';
    };
    _proto.onAddColumn = function(columnInfo) {
        var _self = this;
        NotificationIconManager.getInstance().removeNotificationIcon(_self);
    };
})();
