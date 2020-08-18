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

function ChatNotificationIconView(message) {
    NotificationIconView.call(this, message);
    this._jidList = new StringMapedArrayList();
    if(message == null || typeof message != 'object') {
        return;
    }
    this._jidList.add(message.getFrom(), new Number(1));

};(function() {
    ChatNotificationIconView.prototype = $.extend({}, NotificationIconView.prototype, ViewCore.prototype);
    var _super = NotificationIconView.prototype;
    var _proto = ChatNotificationIconView.prototype;
    _proto._init = function(message) {
        var _self = this;
        _super._init.call(_self, message);
        _self._createNotificationTooltip(message);
    };
    _proto.updateNotificationArea = function(message) {
       var _self = this;
        _super.updateNotificationArea.call(_self, message);
        var updateFlg = _self._jidList.set(message.getFrom(), _self._jidList.getByKey() + 1);
        if(!updateFlg) {
            _self._jidList.add(message.getFrom(), new Number(1));
        }
        _self.updateNotificationTooltipMessage(message);
    };
    _proto._getIconPath = function() {
        return 'images/column_chat_notice.png';
    };
    _proto._setType = function() {
        var _self = this;
        _self._type = ColumnInformation.TYPE_COLUMN_CHAT;
    };
    _proto._createNotificationTooltip = function(message) {
        if(message == null || typeof message != 'object') {
            return false;
        }
        var _self = this;
        var _selfElm = _self._htmlElement;

        var _onGetContentCallback = function(content){
            var _htmlString = content;
            var _jid = message.getFrom();
            var _notificationMessageByAvatar = _selfElm.find("[jid='" + _jid + "']");
            if(_notificationMessageByAvatar.length > 0) {
                _notificationMessageByAvatar.parent('li').off().remove();
            }
            _selfElm.append(_htmlString);
            var _targetElm = _selfElm.find("[jid='" + _jid + "']");
            _self._addEventClick(_targetElm);
            NotificationIconManager.getInstance().addAttention();
            return true;
        };

        _self._notificationTooltipHtml(message, _onGetContentCallback);
    };
    _proto.updateNotificationTooltipMessage = function(message) {
        if(message == null || typeof message != 'object') {
            return false;
        }
        var _self = this;
        var _onGetContentCallback = function(content){
            var _selfElm = _self._htmlElement;
            var _htmlString = content;
            var _jid = message.getFrom();
            var _notificationMessageByAvatar = _selfElm.find("[jid='" + _jid + "']");
            if(_notificationMessageByAvatar.length > 0) {
                _notificationMessageByAvatar.parent('li').off().remove();
            }
            _selfElm.append(_htmlString);
            _self._addEventClick(_selfElm.find("[jid='" + _jid + "']"));
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
        if(message == null || typeof message != 'object') {
            return '';
        }
        if(callback == null || typeof callback != 'function'){
            return '';
        }
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _jid = message.getFrom();

        var _onGetPersonCallback = function(personMap){
            var _avatarName = '';
            var _avatarSrc = ViewUtils.getAvatarUrl(null);

            if(personMap && typeof personMap == 'object'){
                var _person = personMap.getByKey(_jid);
                _avatarName = _person.getUserName();
                _avatarSrc = ViewUtils.getAvatarUrl(_person);
            }

            var _notificationMessageByAvatar = _selfElm.find("[jid='" + _jid + "']");
            var _counter = 0;
            if(_notificationMessageByAvatar.length > 0) {
                _counter = _notificationMessageByAvatar.find('.count').html();
            }
            _counter++;
            var _htmlString = '<li>';
            _htmlString += '<a jid="' + _jid + '" class="text_btn">';
            _htmlString += '<span class="ico ico_user">';
            if(_avatarSrc != ViewUtils.DEFAULT_USER_AVATAR_SRC){
                _htmlString += '<img src="' + _avatarSrc + '">';
            }else{
                var result = Utils.avatarCreate({type: 'user', name: _avatarName});
                _htmlString += '    <div class="no_img" style="background-color:' + result.color + '" title="' + Utils.convertEscapedHtml(_avatarName) + '">';
                _htmlString += '      <div class="no_img_inner">' + result.name + '</div>';
                _htmlString += '    </div>';
            }
            _htmlString += '</span>';
            _htmlString += '<span class="name">' + Utils.convertEscapedHtml(_avatarName) + '</span>(<span class="count">' + _counter + '</span>' + Resource.getMessage('notification_items') + ')';
            _htmlString += '</a></li>';

            callback(_htmlString);
        };

        return CubeeController.getInstance().getPersonDataByJidFromServer(_jid, _onGetPersonCallback);
    };
    _proto._addEventClick = function(notificationListItemElm) {
        if(notificationListItemElm == null || typeof notificationListItemElm != 'object') {
            return;
        }
        var _self = this;
        notificationListItemElm.on('click', function() {
            var _selectedJid = $(this).attr('jid');
            _self._onListItemClicked(_selectedJid);
            ColumnManager.getInstance().addChatColumn(_selectedJid, true);
        });
    };
    _proto._onListItemClicked = function(jid) {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _targetElem = _selfElm.find("[jid='" + jid + "']");
        if(_targetElem.length <= 0) {
            return;
        }
        _targetElem.parent("li").off().remove();
        _self._jidList.removeByKey(jid);
        NotificationIconManager.getInstance().removeNotificationIcon(_self);
        if($("#left_sidebar .contact_list").find('li[jid="' + jid + '"]').find('.new_message_notice').size() != 0){
            ViewUtils.unsetNewNoticeMark($("#left_sidebar .contact_list").find('li[jid="' + jid + '"]'));
        }

        NotificationIconManager.getInstance()
                               .removeAttentionHeaderColumnIcon(
                                   'li[jid="'+ jid +'"][columntype="3"].sortable-item .ico');
    }
    _proto.onAddColumn = function(columnInfo) {
        var _self = this;
        var _selfElm = _self._htmlElement;
        var _countElm = _selfElm.children('.notification-count');
        var _jid = columnInfo.getFilterCondition();
        var _notificationList = _selfElm.children('.mTip').children('.notification_list');
        var _notificationListItemElm = _notificationList.children("[jid='" + _jid + "']");
        _notificationListItemElm.remove();
        _self._jidList.removeByKey(_selectedJid);
        if (_self._count == 0) {
            NotificationIconManager.getInstance().removeNotificationIcon(_self);
        } else {
            _countElm.text(_self._count);
        }
    };
    _proto.onColumnClicked = function(columnInformation) {
        var _self = this;
        var _clickedColumnType = columnInformation.getColumnType();
        if(_self.getType() != _clickedColumnType) {
            return;
        }
        var _jid = columnInformation.getFilterCondition();
        if(_jid == null || typeof _jid != 'string' || _jid == '') {
            return;
        }
        _self._onListItemClicked(_jid);
    };
})();
