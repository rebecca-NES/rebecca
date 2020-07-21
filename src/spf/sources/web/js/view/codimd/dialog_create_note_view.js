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

function DialogCreateNoteView() {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    DialogOkCancelView.call(this);
};(function() {
    DialogCreateNoteView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogCreateNoteView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _rootElement = _self._dialogInnerElement;
        var _titleInputElement = _rootElement.find('input#title_name');
        _titleInputElement.on('keypress', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                _self._createNoteExecute();
            }
        });
        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _self._createNoteExecute();
        })
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
        $('#modal_area').css('display', 'block');
        $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
        _self._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        $('.overlay').animate({ 'opacity':0.3}, 200 );
    };

    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = "";

        _ret = '<div id="createnote_modal" class="card modal_card">';
        _ret += '    <div class="card_title">';
        _ret += '      <p>' + Resource.getMessage('dialog_label_create_note'); + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <div class="modal_content">';
        _ret += '        <p class="modal_title">' + Resource.getMessage('dialog_label_note_name') + '</p>';
        _ret += '        <input type="text" id="title_name" placeholder="' + Resource.getMessage('dialog_placeholder_note_name') + '" class="field ui-corner-all" maxlength="50">';
        _ret += '      </div>';
        _ret += '    </div>';
        _ret += '    <div class="btn_wrapper">';
        _ret += '      <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '      <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('button_create') + '</span></button>';
        _ret += '    </div>';
        _ret += '    <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };

    _proto._createNoteExecute = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        _rootElement.find('button.success_btn').prop('disabled', true);

        if (!_self._isValidationOk(_rootElement)) {
            _rootElement.find('button.success_btn').prop('disabled', false);
            return false;
        }

        var _titleElement = _rootElement.find('input#title_name');
        var _titleStr = Utils.excludeControleCharacters(_titleElement.val());
        _titleStr = encodeURIComponent(_titleStr);
        ViewUtils.showLoadingTopInChild($('#dialog-error'));
        CodiMdController.getInstance().makeNewNote(_titleStr)
        .then(function(result){
            if (result.result) {
                ViewUtils.modal_allexit();
                SidebarNoteView.getInstance().reloadNoteListOnSidebar();
            } else {
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_create_note'));
            }
        }).catch(function(err){
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_create_note'));
        }).finally(function(){
            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
            _rootElement.find('button.success_btn').prop('disabled', false);
        });

        return true;
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
        if (!_titleName) {
          _rootElement.addClass('input-error');
          formObj.find("#dialog-error").text(Resource.getMessage('dialog_error_note_name'));
          _ret = false;
        }
        if (_titleName.length > 50) {
            _rootElement.addClass('input-error');
            formObj.find("#dialog-error").text(Resource.getMessage('dialog_create_note_validation_error'));
            _ret = false;
        }
        return _ret;
    };
})();
