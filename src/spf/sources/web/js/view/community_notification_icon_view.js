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

function CommunityNotificationIconView(communityNotification, communityInfo) {
    this._communityInfo = communityInfo;
    this._toolTipView = null;
    NotificationIconView.call(this, communityNotification, communityInfo);
};(function() {
    CommunityNotificationIconView.prototype = $.extend({}, NotificationIconView.prototype);
    var _super = NotificationIconView.prototype;
    var _proto = CommunityNotificationIconView.prototype;

    _proto._setType = function() {
        var _self = this;
        _self._type = ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED;
    };

    _proto._getIconPath = function() {
        return 'images/notice_red.png';
    };

    _proto._init = function(communityNotification) {
        if(communityNotification == null || typeof communityNotification != 'object') {
            return;
        }
        var _self = this;
        _super._init.call(_self, communityNotification);
        _self._toolTipView = new CommunityNotificationToolTipView(_self, communityNotification, this._communityInfo);
    };

    _proto._addNotificationCount = function(count) {
    };
    _proto.onNotificationRecieved = function(communityNotification) {
        var _self = this;
        _self.updateNotificationArea(communityNotification);
    };
    _proto.updateNotificationArea = function(communityNotification) {
        var _self = this;
        var _tooltipView = _self._toolTipView;
        _tooltipView.onNotificationRecieved(communityNotification);
    };
    _proto._updateNotificationCount = function(count) {
        if(count == null || typeof count != 'number' || count < 0) {
            return;
        }
    };
    _proto.onToolTipUpdated = function() {

        var _self = this;
        var _count = _self._toolTipView.getCount();
        if(_count == 0){
            NotificationIconManager.getInstance().removeNotificationIcon(_self);

            return;
        }
    };
    _proto.getHtmlElement = function() {
        return this._htmlElement;
    };

    _proto.onAddColumn = function(columnInfo) {
        var _self = this;
        _self._toolTipView.onAddColumn(columnInfo);
    };
    _proto.onColumnClicked = function(columnInformation) {

        var _self = this;
        var _clickedColumnType = columnInformation.getColumnType();
        if(_self.getType() != _clickedColumnType) {
            return;
        }
        var _toolTipView = _self._toolTipView;
        if(_toolTipView == null) {
            return;
        }
        _toolTipView.onColumnClicked(columnInformation);
    };
})();
