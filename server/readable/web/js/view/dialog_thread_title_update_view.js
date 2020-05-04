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
function DialogThreadTitleUpdateView(message) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._message = message;
    DialogOkCancelView.call(this);
};(function() {
    DialogThreadTitleUpdateView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogThreadTitleUpdateView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _rootElement = _self._dialogInnerElement;
        var _titleInputElement = _rootElement.find('input#title_name');
        _titleInputElement.on('keypress', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                _self._updateTitleExecute();
            }
        });
        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _self._updateTitleExecute();
        })
        ColumnTextAreaView.setTitleCategorySelectorEvent(
            _self._dialogInnerElement.find('.modal_content'),
            "#title_name");
    };
    _proto.showDialog = function() {
        var _self = this;
        _self._onOpenDialog();
        var _titleNameInputElement = _self._dialogInnerElement.find('input#title_name');
        _titleNameInputElement.blur();
        _titleNameInputElement.focus();
    };
    _proto._onOpenDialog = function() {
        var _self = this;
        _self._initInputData();
        $('#modal_area').css('display', 'block');
        $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
        _self._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        $('.overlay').animate({ 'opacity':0.3}, 200 );
    };
    _proto._initInputData = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _titleNameInputElement = _rootElement.find('input#title_name');
        var _defaultVal = _self._message.getThreadTitle();
        _titleNameInputElement.val(_defaultVal);
    };

    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = "";

        _ret = '<div id="grouptitle_modal" class="card modal_card">';
        _ret += '    <div class="card_title">';
        // This expression has no effect.
        // _ret += '      <p>' + Resource.getMessage('dialog_label_thread_title_update'); + '</p>';
        _ret += '      <p>' + Resource.getMessage('dialog_label_thread_title_update') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <div class="modal_content">';
        _ret += '        <input type="text" id="title_name" placeholder="' + Resource.getMessage('dialog_placeholder_title') + '" class="field ui-corner-all thread-title-input" style="padding-left: 20px;">';
        var roomId = ''
        var expandsClass = ''
        if (_self._message.getType() == Message.TYPE_COMMUNITY ||
            _self._message.getType() == Message.TYPE_GROUP_CHAT) {
            roomId = _self._message.getTo()
            var list_room = LoginUser.getInstance().getTenantInfo().threadTitleCategoryForRoom
            if (list_room && roomId in list_room) {
                expandsClass = 'expands-notes'
            }
        }
        _ret += ColumnTextAreaView.getTitleCategorySelectorHtml("in-edit", roomId, _self._message.getType());
        _ret += '        <p id="dialog-notes" class="' + expandsClass + '">' + Resource.getMessage('dialog_update_title_note') + '</p>';
        _ret += '      </div>';
        _ret += '    </div>';
        _ret += '    <div class="btn_wrapper">';
        _ret += '      <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '      <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_label_ok') + '</span></button>';
        _ret += '    </div>';
        _ret += '    <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };

    _proto._updateTitleExecute = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        if (!_self._isChangeData(_rootElement)) {
            ViewUtils.modal_allexit();
            return true;
        }
        if (!_self._isValidationOk(_rootElement)) {
            return false;
        }

        var _titleElement = _rootElement.find('input#title_name');
        var _titleStr = Utils.excludeControleCharacters(_titleElement.val());

        CubeeController.getInstance().updateThreadTitle(_self._message, _titleStr)
        .then(function(result){
            ViewUtils.modal_allexit();
            return;
        }).catch(function(err){
            if (err && err.content.reason) {
                switch (err.content.reason) {
                    case (403000):
                        _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('authority_err'));
                        break;
                    default:
                        _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_update_title_error'));
                        break;
                }
            } else {
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_update_title_error'));
            }
            return;
        })
        return true;
    };
    _proto._isChangeData = function(formObj) {
        var _self = this;
        var _ret = true;
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _rootElement = formObj.find('input#title_name');
        var _titleName = _rootElement.val();
        if (_titleName == _self._message.getThreadTitle()) {
            _ret = false;
        }
        return _ret;
    };

    _proto._isValidationOk = function(formObj) {
        var _self = this;
        var _ret = true;
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _rootElement = formObj.find('input#title_name');
        var _titleName = _rootElement.val();
        formObj.find("#dialog-error").text('');
        _rootElement.removeClass('input-error');
        if (ViewUtils.getCalculattionTitle(_titleName) > ColumnView.THREAD_TITLE_MAX_LENGTH) {
            _rootElement.addClass('input-error');
            formObj.find("#dialog-error").text(Resource.getMessage('dialog_update_title_validation_error'));
            _ret = false;
        }
        return _ret;
    };
})();
