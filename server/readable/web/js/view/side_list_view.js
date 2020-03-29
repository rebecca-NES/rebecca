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

function SideListView() {
    this._sideListViewImpl = null;
};
(function() {
    var _sideListView = new SideListView();

    SideListView.getInstance = function() {
        return _sideListView;
    };

    var _proto = SideListView.prototype;

    _proto.refreshContents = function(sideListViewImpl, tabInfo) {
        if (!sideListViewImpl || typeof sideListViewImpl != 'object') {
            return;
        }
        if (!tabInfo || typeof tabInfo != 'object') {
            return;
        }
        var _self = this;
        var sidebarParts = null;
        if(_self._sideListViewImpl){
            sidebarParts = _self._sideListViewImpl.sidebarParts[1];
            if(typeof sidebarParts != 'object'){
                sidebarParts = null;
            }
            _self._sideListViewImpl.cleanUp();
        }
        _self._sideListViewImpl = sideListViewImpl.init(tabInfo, sidebarParts);
        _self._sideListViewImpl.refresh();
    };

    _proto.resizeContents = function() {
        var _self = this;
        if (_self._sideListViewImpl == null) {
            return;
        }
        _self._sideListViewImpl.resizeContents();
    };

    _proto.onProfileChanged = function(profile) {
        var _self = this;
        if (_self._sideListViewImpl == null) {
            return;
        }
        _self._sideListViewImpl.onProfileChanged(profile);
    };

    _proto.onNotification = function(notification) {
        var _self = this;
        if (_self._sideListViewImpl == null) {
            return;
        }
        if (notification.getType() == Notification_model.TYPE_GROUP_CHAT) {
            if(typeof notification.getGroupChatMessage == 'function'){
                var _message = notification.getGroupChatMessage();
                var _notificationSettingManager = NotificationSettingManager.getInstance();
                if (_notificationSettingManager.isSetting(ColumnInformation.TYPE_COLUMN_GROUP_CHAT, _message.getTo())) {
                    return;
                }
            }
        } else if (notification.getType() == Notification_model.TYPE_QUESTIONNAIRE) {
            if (notification.getQuestionnaireMessage().getRoomType() == Message.TYPE_GROUP_CHAT) {
                var _notificationSettingManager = NotificationSettingManager.getInstance();
                if (_notificationSettingManager.isSetting(ColumnInformation.TYPE_COLUMN_GROUP_CHAT, notification.getQuestionnaireMessage().getRoomId())) {
                    return;
                }
            } else {
                return;
            }
        }
        _self._sideListViewImpl.onNotification(notification);
    };

    _proto.notifyChatMessage = function(notification) {
        var _self = this;
        if (_self._sideListViewImpl == null) {
            return;
        }
        var _notificationSettingManager = NotificationSettingManager.getInstance();
        var _id = notification.getFrom();
        if (_notificationSettingManager.isSetting(ColumnInformation.TYPE_COLUMN_CHAT, _id)) {
            return;
        }
        _self._sideListViewImpl.notifyChatMessage(notification);
    };
    _proto.addChatMember = function(jid, newMark) {
        var _self = this;
        if (_self._sideListViewImpl == null) {
            return;
        }
        _self._sideListViewImpl.sidebarParts[1].addChatMember(jid, newMark);

    };
})();
