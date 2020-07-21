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

function DialogQuestionnaireConfirmView(_message, _callback) {
    DialogView.call(this);
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._buttons = {	};
    this._callback = _callback;
    this._message = _message;
    this._init(_message);
};(function() {
    DialogQuestionnaireConfirmView.prototype = $.extend({}, DialogView.prototype);
    var _super = DialogView.prototype;
    var _proto = DialogQuestionnaireConfirmView.prototype;
    _proto._init = function(_message) {
        var _self = this;
        var _ret = "";
        var roomName = Utils.convertEscapedHtml(_message.getRoomName());
        var showMessage = "";
        switch(parseInt(_message.getRoomType())) {
            case QuestionnaireRegister.ROOM_TYPE_FEED:
                showMessage = Resource.getMessage('MyFeed') + "へアンケートを登録します。よろしいですか？";
                break;
            case QuestionnaireRegister.ROOM_TYPE_COMMUNITY:
                showMessage = roomName + "(" +Resource.getMessage('Community') + ") へアンケートを登録します。よろしいですか？";
                break;
            case QuestionnaireRegister.ROOM_TYPE_GROUPCHAT:
                showMessage = roomName + "(" + Resource.getMessage('GroupChat') + ") へアンケートを登録します。よろしいですか？";
                break;
            default:
                break;
        }

        _ret += '<div id="questionnaire_confirm_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>'+Resource.getMessage('dialog_confirmation_title')+'</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <p class="txt">'+showMessage+'</p>';
        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button type="button" id="delete_cancel_btn" class="modal_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_cancel')+'</span></button>';
        _ret += '    <button type="button" id="msg_ok_btn" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_ok')+'</span></button>';
        _ret += '  </div>';
        _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        _self._dialogAreaElement.html(_ret);
        _self._dialogInnerElement = this._dialogAreaElement.children();

        this._dialogInnerElement.find('#msg_ok_btn').on('click', function() {
            _self.doRegistQuestionnaire();
        });
        this._dialogInnerElement.find('#delete_cancel_btn').on('click', function() {
            ViewUtils.modal_allexit();
            _self._dialogInnerElement = null;
            _self._callback(false);
        });
    };

    _proto.doRegistQuestionnaire = function(){
        var _self = this;
        var callback = function(result){
            if (result.content && result.content.result) {
                ViewUtils.modal_allexit();
                _self._dialogInnerElement = null;
                _self._callback(true);
            } else {
                if (result.content.reason == 403000) {
                    _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('authority_err'));
                } else {
                    _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('questionnaire_dialog_error_send'));
                }
                _self._dialogInnerElement.find('#msg_ok_btn').hide();
                _self._callback(false);
            }
        };
        CubeeController.getInstance().addQuestionnaire(_self._message, callback);
    };

    _proto.showDialog = function() {
        $('#modal_area').css('display', 'block');
        $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
        this._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        $('.overlay').animate({ 'opacity':0.3}, 200 );
        document.activeElement.blur();
    };
})();
