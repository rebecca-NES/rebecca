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
function DialogDeleteCheckView(message) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._deleteMessage = message;
    DialogOkCancelView.call(this);
};(function() {
    DialogDeleteCheckView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogDeleteCheckView.prototype;
    _proto._init = function() {
        var _self = this;

        _super._init.call(_self);

        function deleteMessageCallback(result) {
            console.log("message was deleted : " + result);
        };
        this._dialogAreaElement.html(_self.getDeleteMessageCheckHtml());
        this._dialogInnerElement = this._dialogAreaElement.children();

        _self._dialogInnerElement.find('#delete_ok_btn').on('click', function() {
            var _deleteFlag = 1;
            var _messageType = _self._deleteMessage.getType();
            switch(_messageType){
                case Message.TYPE_PUBLIC :
                case Message.TYPE_CHAT :
                case Message.TYPE_GROUP_CHAT :
                case Message.TYPE_COMMUNITY :
                case Message.TYPE_QUESTIONNAIRE :
                case Message.TYPE_MURMUR :
                  _deleteFlag = 2;
                    break;
                default :
                    break;
            }
            if (CubeeController.getInstance().deleteMessage(_self._deleteMessage, _deleteFlag, deleteMessageCallback) == false) {
                console.log("message was not deleted");
            }
            ViewUtils.modal_allexit();
        });
        _self._dialogInnerElement.find('#delete_cancel_btn').on('click', function() {
            ViewUtils.modal_allexit();
        });
    };
    _proto.getDeleteMessageCheckHtml = function() {
        var _self = this;
        var _displayMessage = Resource.getMessage('dialog_delete_conf_message');
        if(typeof _self._deleteMessage.getCommunityId == 'function' && typeof _self._deleteMessage.getStatus == 'function'){
            if (_self._deleteMessage.getStatus() != TaskMessage.STATUS_INBOX) {
                var _groupId = _self._deleteMessage.getCommunityId();
                if(_groupId != null && _groupId != ''){
                    _displayMessage = Resource.getMessage('dialog_delete_conf_message_for_community');
                    _self._width = 420;
                    _self._height = 170;
                }
            }
        }

        var _ret = "";
        _ret += '<div id="msgdelete_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>'+Resource.getMessage('dialog_confirmation_title')+'</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <p class="txt">'+_displayMessage+'</p>';
        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button type="button" id="delete_cancel_btn" class="modal_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_cancel')+'</span></button>';
        _ret += '    <button type="button" id="delete_ok_btn" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_ok')+'</span></button>';
        _ret += '  </div>';
        _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };
})();
