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

function CodiMdViewUtils() {
};(function() {

    CodiMdViewUtils.getRoomName = function(data) {
        let _roomName = Resource.getMessage('not_assign_room_notes');
        if (data.msgtype) {
            switch(data.msgtype){
                case Message.TYPE_PUBLIC:
                    _roomName = Resource.getMessage('MyFeed');
                    break;
                case Message.TYPE_GROUP_CHAT:
                    _roomName = "GC";
                    break;
                case Message.TYPE_COMMUNITY:
                    _roomName = "PJ";
                    break;
                case Message.TYPE_CHAT:
                    _roomName = Resource.getMessage('Chat');
                    break;
                case Message.TYPE_MURMUR:
                    if(data.room_name){
                        _roomName = Utils.convertEscapedHtml(Utils.urldecode(data.room_name));
                    }else{
                        _roomName = Resource.getMessage('Murmur');
                    }
                    break;
                default:
                    _roomName = "";
                    break;
            }
            if (data.room_name && data.msgtype != Message.TYPE_MURMUR) {
                _roomName += ' ' + Utils.convertEscapedHtml(Utils.urldecode(data.room_name));
            }
        }
        return _roomName;
    };

    CodiMdViewUtils.getAttachmentHtmlElement = function() {
        let _ret = "";
        if (!CodiMdViewUtils.judgeNoteEnable()) {
            return _ret
        }
        _ret += '<div class="attach-note-element">';
        _ret += '<a class="ico_btn attach-note-btn" data-toggle="tooltip" data-original-title="' + Resource.getMessage('tootip_assign_note') + '" data-placement="right"><i class="fa fa-pencil-square-o"></i></a>';        _ret += '</div>';
        return _ret;
    }

    CodiMdViewUtils.getNoteListHtmlElementForColumn = function() {
        let _ret = ""
        if (!CodiMdViewUtils.judgeNoteEnable()) {
            return _ret
        }
        return '  <li><a class="txt_btn" value="' + ColumnOptionMenu.ELEMENT_MENU_NOTE_ASSIGNED_LIST + '">' + Resource.getMessage('dialog_label_get_note_list') + '</a></li>';
    }

    CodiMdViewUtils.judgeNoteEnable = function() {
        var tenantInfoForNote = LoginUser.getInstance().getTenantInfo().note
        if (typeof tenantInfoForNote != 'object' ||
            !'enable' in tenantInfoForNote) {
            return false
        }
        return tenantInfoForNote.enable
    }

})();
