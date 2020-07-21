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

function DialogUpdateMessageView(message, column) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._message = message;
    this._column = column;
    this._uploading = false;
    this.displayMessage = "";
    this.displayFileName = "";
    DialogOkCancelView.call(this);
};(function() {
    DialogUpdateMessageView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogUpdateMessageView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self._createEventHandler();
    };

    _proto._createEventHandler = function() {
      var _self = this;

      var _textareaElement = _self._dialogInnerElement.find('textarea.message-input-area');
      _textareaElement.on('keypress', function(e) {
          if (e.ctrlKey && e.keyCode == 13 || e.keyCode == 10 ) {
              _self._updateMessageExecute();
          }
      });
      _self._dialogInnerElement.find('.modal_btn').on('click', function(){
          _self._updateMessageExecute();
      })

      autosize(_self._dialogInnerElement.find('.message-input-area'));

      var _textareaElement = _self._dialogInnerElement.find('div.frm-message > textarea.message-input-area');
      _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('default_placeholder'));
      ViewUtils.setCharCounter(_textareaElement, _self._dialogInnerElement.find('.char-counter-column'), ColumnView.TEXTAREA_MAX_LENGTH);
      var _fileUploadElement = _self._dialogInnerElement.find('div.frm-message > .file-inputs');
      _self._fileUpload = new ColumnFileUploadPartsView(_fileUploadElement, _self);
      var _progressBarElement = _self._dialogInnerElement.find('div.frm-message').find('.submit-message-progress');
      _self._progressBar = new ProgressBarView(_progressBarElement, false);
    }

    _proto.showDialog = function() {
        var _self = this;
        _self._onOpenDialog();
        var _messageInputElement = _self._dialogInnerElement.find('.message-input-area');
        _messageInputElement.blur();
        _messageInputElement.focus();
        autosize.update(_messageInputElement);
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
        var _inputElement = _rootElement.find('.message-input-area');
        var _defaultVal = _self._message.getMessage();
        _self.displayMessage = ViewUtils.removeAttachmentUrl(_defaultVal);
        _self.displayFileName = ViewUtils.getAttachmentFileName(_defaultVal);
        if (_self.displayFileName) {
            var _label = _rootElement.find('p.file-name');
            _label.text(_self.displayFileName);
            _label.attr('title', _self.displayFileName);
            _rootElement.find('#fileupload_cancel_btn').remove();
            var ret = '<a class="ico_btn" id="fileupload_cancel_btn"> \
                <i class="fa fa-close" title="'+Resource.getMessage('dialog_cancel_title')+'"></i>\
                </a>';
            _label.after(ret);
            _self.displayMessage = _self.displayMessage.slice(0, -1);
            _inputElement.val(_self.displayMessage);
        } else {
            _inputElement.val(_self.displayMessage);
        }
    };

    _proto.getInnerHtml = function() {
        var _self = this;
        var createInputElement = "<div>";
        var _autoCompleteType = 'autocomplete'
        if (_self._message.getType() == Message.TYPE_COMMUNITY) {
            _autoCompleteType = 'autocomplete-for-community" groupId="'+_self._message.getTo()+'"';
        } else if(_self._message.getType() == Message.TYPE_GROUP_CHAT) {
            _autoCompleteType = 'autocomplete-for-chatroom" groupId="'+_self._message.getTo()+'"';
        }
        createInputElement += '<textarea class="ui-corner-all autoresize-textarea message-input-area ' + _autoCompleteType + ' placeholder="" style="min-height: 4em; max-height: 300px;"></textarea>';
        createInputElement += ColumnFileUploadPartsView.getHtml(1);
        createInputElement += ColumnTextAreaView.getCharCounterHtml(1, true);
        createInputElement += '</div>';
        var _ret = "";

        _ret = '<div id="grouptitle_modal" class="card modal_card">';
        _ret += '    <div class="card_title">';
        _ret += '      <p>' + Resource.getMessage('dialog_label_update_message') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <div class="flex1 frm-message update_message">';
        _ret += $(createInputElement).find('.message-input-area').prop('outerHTML');
        _ret += $(createInputElement).find('.file-inputs').prop('outerHTML');
        _ret += $(createInputElement).find('.char-counter-column').prop('outerHTML');
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

    _proto._uploadFileAndSendMessage = function(text, sendMessageFunction) {
        var _self = this;
        if (typeof sendMessageFunction != 'function') {
            return false;
        }
        if (_self._uploading == true) {
            return false;
        }
        var _files=null;
        var _fileform=null;
        var newMessageArea = _self._dialogInnerElement.find(".modal_content_wrapper");

        var _countText = text;
        if (ViewUtils.getAttachmentFileName(text)) {
            _countText = ViewUtils.removeAttachmentUrl(text).slice(0, -1);
        }

        if (ViewUtils.isValidInputTextLength(_countText)) {
            if (_self._fileUpload == null) {
                sendMessageFunction(text);
                return;
            }
            _files = _self._fileUpload.getFilesObject();
            if (_files == null) {
                sendMessageFunction(text);
                return;
            }
            if (_files.length <= 0) {
                sendMessageFunction(text);
                return;
            }
            _self._progressBar.visibleProgressBar();
            ViewUtils.switchAttachmentArea(newMessageArea, false);

            function onUploadResult(result) {
                if (result.result != "success") {
                    _self._uploading = false;
                    ViewUtils.switchAttachmentArea(newMessageArea, true);
                    _self._progressBar.progressClear();
                    _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_update_file_error'));
                    return;
                }

                text += '\n' + result.path;
                sendMessageFunction(text);
                _self._uploading = false;
                ViewUtils.switchAttachmentArea(newMessageArea, true);
                _self._progressBar.progressComplete();
            };

            function onUploadProgress(progress) {
                _self._progressBar.setProgressValue(progress);
            };

            _self._uploading = true;
            var _file = _files[0];
            return CubeeController.getInstance().uploadFile(_file, onUploadResult, onUploadProgress);
        }
        return false;
    };

    _proto._updateMessageExecute = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        if (!_self._isChangeData(_rootElement)) {
            ViewUtils.modal_allexit();
            return true;
        }
        if (!_self._isValidationOk(_rootElement)) {
            return false;
        }

        function _updateMessage(message) {
            CubeeController.getInstance().updateMessage(message, _self._message)
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
                            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_update_message_error'));
                            break;
                    }
                } else {
                    _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_update_message_error'));
                }
                return;
            })
        }

        var _text = _self._textarea.getText();
        if (_self.displayFileName &&
            _rootElement.find('p.file-name').text() == _self.displayFileName &&
            _self._fileUpload.getFilesObject().length <= 0) {
            var splitOriginalMessage = _self._message.getMessage().split(/(\n| )/);
            if(splitOriginalMessage.length > 1){
                let split = '\n';
                if(_self._message.getMessage().substring(
                    _self._message.getMessage().indexOf(splitOriginalMessage[splitOriginalMessage.length-1])-1,
                    _self._message.getMessage().indexOf(splitOriginalMessage[splitOriginalMessage.length-1])
                ) == ' '){
                    split = ' '
                }
                if(split == '\n'){
                    _text = _text + '\n' + splitOriginalMessage[splitOriginalMessage.length-1];
                }else
                if(split == ' ' && splitOriginalMessage[splitOriginalMessage.length-1].match(/^https?:\/\//)){
                    _text = _text + '\n' + splitOriginalMessage[splitOriginalMessage.length-1];
                }
            }
        }
        _self._uploadFileAndSendMessage(_text, _updateMessage);
        return true;
    };

    _proto._isChangeData = function(formObj) {
        var _self = this;
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _text = formObj.find(".message-input-area").val();
        if (_self.displayMessage != _text) {
            return true;
        }
        if (_self.displayFileName && !formObj.find('p.file-name').text()) {
            return true;
        } else if (_self._fileUpload.getFilesObject().length > 0) {
            return true;
        }

        return false;
    };

    _proto._isValidationOk = function(formObj) {
        var _self = this;
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _textareaElement = formObj.find('textarea.message-input-area');
        var _message = _textareaElement.val();
        formObj.find("#dialog-error").text('');
        _textareaElement.removeClass('input-error');
        if (!_message.length) {
            _textareaElement.addClass('input-error');
            formObj.find("#dialog-error").text(Resource.getMessage('dialog_update_message_nothing_error'));
            return false;
        }
        if (!ViewUtils.isValidInputTextLength(_message)) {
            _textareaElement.addClass('input-error');
            formObj.find("#dialog-error").text(ColumnView.TEXTAREA_MAX_LENGTH + Resource.getMessage('dialog_update_message_number_error'));
            return false;
        }
        return true;
    };
})();
