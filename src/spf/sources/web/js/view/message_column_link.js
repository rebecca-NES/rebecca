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

function MessageColumnLink(htmlElement, message) {
    this._htmlElement = htmlElement;
    this._message = message;
    this._createEventHandler();
};(function() {
    var _proto = MessageColumnLink.prototype;
    _proto._getHtmlElement = function() {
        return this._htmlElement;
    };
    _proto._getMessage = function() {
        return this._message;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self._getHtmlElement();
        var _message = _self._getMessage();
        if(_message == null) {
            return;
        }
        _rootElement.click(function() {
            var _columnIconAreaTargetColumnInfoList = ColumnManager.getInstance().getTargetColumnsInfoArrayList(_message);
            var _columnInfoCount = _columnIconAreaTargetColumnInfoList.getCount();
            for (var _i = 0; _i < _columnInfoCount; _i++) {
                var _columnInfo = _columnIconAreaTargetColumnInfoList.get(_i);
                ColumnIconArea.getInstance().removeColumnNotificationIconByColumnInformation(_columnInfo);
            }
            NotificationIconManager.getInstance().removeColumnNotificationIconByMessage(_message);
            switch(_message.getType()){
                case Message.TYPE_CHAT:
                    const myjid = LoginUser.getInstance().getJid();
                    let jid = _message.getFrom();
                    if(myjid == jid){
                        jid = _message.getTo();
                    }
                    NotificationIconManager
                        .getInstance()
                        .removeAttentionHeaderColumnIcon(
                            'li[jid="'+ jid +'"][columntype="3"].sortable-item .ico');
                    break;
                case Message.TYPE_GROUP_CHAT:
                    NotificationIconManager
                        .getInstance()
                        .removeAttentionHeaderColumnIcon(
                            'li[msgto="'+ _message.getTo() +'"][columntype="'
                            +ColumnInformation.TYPE_COLUMN_GROUP_CHAT
                            +'"].sortable-item .ico_group');
                    break;
                case Message.TYPE_COMMUNITY:
                    NotificationIconManager
                        .getInstance()
                        .removeAttentionHeaderColumnIcon(
                            'li[msgto="'+ _message.getTo()
                            +'"][columntype="'+ ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED
                            +'"].sortable-item .ico_project');
                    break;
                case Message.TYPE_QUESTIONNAIRE:
                    let _roomId = _message.getRoomId();
                    if($(_rootElement).parent().parent().parent().parent().find(".column-group-chat[roomid="+_roomId+"]").length > 0){
                        NotificationIconManager
                            .getInstance()
                            .removeAttentionHeaderColumnIcon(
                                'li[msgto="'+ _roomId +'"][columntype="'+ColumnInformation.TYPE_COLUMN_GROUP_CHAT
                                +'"].sortable-item .ico_group');
                    }
                    else if($(_rootElement).parent().parent().parent().parent().find(".column-community-feed[roomid="+_roomId+"]").length > 0){
                        NotificationIconManager
                            .getInstance()
                            .removeAttentionHeaderColumnIcon(
                                'li[msgto="'+_roomId+'"][columntype="'+ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED
                                +'"].sortable-item .ico_project');
                    }else if($(_rootElement).parent().parent().parent().parent().find(".column-questionnaire").length > 0){
                        NotificationIconManager
                            .getInstance()
                            .removeAttentionHeaderColumnIcon(
                                'li[columntype=17].sortable-item .ico_system');
                    }
                    break;
                case Message.TYPE_MURMUR:
                    NotificationIconManager
                        .getInstance()
                        .removeAttentionHeaderColumnIcon(
                            'li[jid="'+ _message.getTo()
                            +'"][columntype="18"].sortable-item .ico_user');
                    break;
            }
        });
    };
})();
