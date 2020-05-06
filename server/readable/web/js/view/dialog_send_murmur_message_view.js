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
function DialogSendMurmurMessageView(message, column) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._message = message;
    this._column = column;
    this._uploading = false;
    this.displayMessage = "";
    this.displayFileName = "";
    this.isNoteLiistOpen = false;
    DialogOkCancelView.call(this);
};(function() {
    DialogSendMurmurMessageView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogSendMurmurMessageView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();
        $('[data-toggle="tooltip"]').tooltip({trigger: 'hover'});
        _self._createEventHandler();
    };

    _proto._createEventHandler = function() {
        var _self = this;

        var _textareaElement = _self._dialogInnerElement.find('textarea.message-input-area');
        _textareaElement.on('keypress', function(e) {
            if (e.ctrlKey && e.keyCode == 13 || e.keyCode == 10 ) {
                _self._sendMessageExecute();
            }
        });
        $('#murmur_send_modal > div.btn_wrapper > button.modal_btn').on('click', function(){
            _self._sendMessageExecute();
        });

        autosize(_self._dialogInnerElement.find('.message-input-area'));

        var _titleElement = _self._dialogInnerElement.find('div.frm-message > textarea.message-input-area-title');
        _self._titlearea = new ColumnTextAreaView(_titleElement, _self, Resource.getMessage('default_placeholder'));
        ViewUtils.setCharCounter(_titleElement, _self._dialogInnerElement.find('.char-counter-column-title'), ColumnView.THREAD_TITLE_MAX_LENGTH);
        var _textareaElement = _self._dialogInnerElement.find('div.frm-message > textarea.message-input-area');
        _self._textarea = new ColumnTextAreaView(_textareaElement, _self, Resource.getMessage('default_placeholder'));
        ViewUtils.setCharCounter(_textareaElement, _self._dialogInnerElement.find('.char-counter-column'), ColumnView.TEXTAREA_MAX_LENGTH);
        var _fileUploadElement = _self._dialogInnerElement.find('div.frm-message > .file-inputs');
        _self._fileUpload = new ColumnFileUploadPartsView(_fileUploadElement, _self);
        var _progressBarElement = _self._dialogInnerElement.find('div.frm-message').find('.submit-message-progress');
        _self._progressBar = new ProgressBarView(_progressBarElement, false);

        _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._dialogInnerElement.find('#attach-note-cancel-btn').hide();
        _self._dialogInnerElement.find('#attach-note-cancel-btn').off('click.attach-note-cancel-btn');
        _self._dialogInnerElement.find('#attach-note-cancel-btn').on('click', () => {
            $("#murmur_send_modal .message-body-note > a > span").remove();
            $("#murmur_send_modal .message-body-note > a").append("<span>");
            _self._dialogInnerElement.find('#attach-note-cancel-btn').hide();
            _self.isNoteLiistOpen = false;
        });
        $("#murmur_send_modal textarea").off("click.murmur_send_modal_textarea");
        $("#murmur_send_modal textarea").on("click.murmur_send_modal_textarea",()=>{
            _self.isNoteLiistOpen = false;
            $("#dialog-error").text("");
            $('#murmur_send_modal div.note-assign-list').hide();
        });
        _self._dialogInnerElement.find('.note-assign-list').hide();
        _self._dialogInnerElement.find('.attach-note-btn').on('click', () => {
            if(_self.isNoteLiistOpen){
                _self.isNoteLiistOpen = false;
                $("#dialog-error").text("");
                $('#murmur_send_modal div.note-assign-list').hide();
            }else{
                CodiMdController.getInstance().getNoteList(
                ).then((res)=>{
                    if(res.result && Array.isArray(res.data)){
                        _self.isNoteLiistOpen = true;
                        $("#murmur_send_modal .note-assign-list ul > li").remove();
                        let addCount = 0;
                        for(let i=0;i<res.data.length;i++){
                            if(res.data[i].msgtype){
                                continue;
                            }
                            const noteTitle = decodeURIComponent(res.data[i].note_title);
                            const noteRoom = res.data[i].room_name ?
                                             decodeURIComponent(res.data[i].room_name) :
                                             Resource.getMessage('not_assign_room_notes');
                            const a = $("<a>")
                                .val(res.data[i].note_url)
                                .attr("value", res.data[i].note_url)
                                .attr("title", noteTitle)
                                .attr("class", "text-overflow-ellipsis title-list")
                                .html('<div class="name note-list">'+noteTitle +'</div>'
                                    + '<div class="group note-list">'+  noteRoom +'</div>'
                                ).on('click',(event)=>{
                                    _self.isNoteLiistOpen = false;
                                    const selectedTitle = $(event.currentTarget).attr("title");
                                    const selectedValue = $(event.currentTarget).attr("value");
                                    if(selectedTitle.length > 0){
                                        $("#murmur_send_modal div.message-body-note > a.attach-note-btn > span").text(selectedTitle)
                                        $("#murmur_send_modal div.message-body-note > a.attach-note-btn > span").attr("title",selectedTitle)
                                        $("#murmur_send_modal div.message-body-note > a.attach-note-btn > span").attr("value",selectedValue)
                                        $('#attach-note-cancel-btn').css("display","inline-block");
                                        $('#murmur_send_modal div.note-assign-list').hide();
                                    }
                                });
                            const li = $("<li>")
                                .append(a);
                            $("#murmur_send_modal .note-assign-list ul").append(li);
                            addCount++;
                        }
                        if(addCount == 0){
                            $('#murmur_send_modal div.note-assign-list').hide();
                            $("#dialog-error").text(Resource.getMessage('dialog_note_nothing_for_assign'));
                        }
                    }else{
                        $('#murmur_send_modal div.note-assign-list').hide();
                        $("#dialog-error").text(Resource.getMessage('dialog_note_nothing_for_assign'));

                    }
                }).catch((err)=>{
                    console.error("can not get note list error:"+err)
                })
                _self._dialogInnerElement.find('.note-assign-list').show();
            }
        });
    };

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
        $('#modal_area').css('display', 'block');
        $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
        _self._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        $('.overlay').animate({ 'opacity':0.3}, 200 );
    };
    _proto.getInnerHtml = function() {
        var _self = this;
        var createInputElement = "<div>";
        var _autoCompleteType = 'autocomplete';
        createInputElement += '<textarea class="ui-corner-all autoresize-textarea message-input-area '
                            + _autoCompleteType + '" placeholder="" style="min-height: 8em; max-height: 300px;margin-top:3px;border-radius: 3px;"></textarea>';
        createInputElement += ColumnFileUploadPartsView.getHtml(1);
        createInputElement += ColumnTextAreaView.getCharCounterHtml(1, true);
        createInputElement += '</div>';
        var _ret = "";

        _ret = '<div id="murmur_send_modal" class="card modal_card">';
        _ret += '    <div class="card_title">';
        _ret += '      <p>' + Resource.getMessage('dialog_label_murmur_send_message') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <div class="flex1 frm-message murmur_send_message">';

        _ret += '<textarea class="ui-corner-all autoresize-textarea message-input-area-title '
              + _autoCompleteType + '" ' + "_roomIdAttribute"
              + ' placeholder="' +Resource.getMessage('title_select_category')
              + '" style="min-height: 32px; max-height: 100px; width: 420px; padding-top: 6px; padding-bottom: 0px; padding-left: 21px;'
              + '         border: solid #eee 1px; line-height: 2rem;border-radius: 3px;" maxlength="51"></textarea>';
        _ret += ColumnTextAreaView.getTitleCategorySelectorHtml("murmur-send-message-title", "", Message.TYPE_MURMUR);
        _ret += '<span class="char-counter char-counter-column-title char-counter-under">'+ColumnView.THREAD_TITLE_MAX_LENGTH+'</span>';

        _ret += $(createInputElement).find('.message-input-area').prop('outerHTML');
        _ret += $(createInputElement).find('.file-inputs').prop('outerHTML');
        _ret += $(createInputElement).find('.char-counter-column').prop('outerHTML');

        let _noteTitle = '';
        let _noteUrl = '';
        _ret += '      <div class="message-body-note">';
        _ret += '           <a class="ico_btn attach-note-btn" data-toggle="tooltip" data-original-title="'+Resource.getMessage('tootip_assign_note')+'" data-placement="right">';
        _ret += '               <i class="fa fa-pencil-square-o"></i>';
        _ret += '               <span></span>';
        _ret += '           </a>';
        _ret += '           <a class="ico_btn" id="attach-note-cancel-btn">';
        _ret += '             <i class="fa fa-close" title="' + Resource.getMessage('dialog_label_cancel') + '"></i></a>';
        _ret += '      </div>';

        _ret += '       <div class="note-assign-list scroll_content">';
        _ret += '        <ul class="select_list"></ul>';
        _ret += '       </div>';

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


    _proto._uploadFileAndSendMessage = function(text, title, sendMessageFunction) {
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
                sendMessageFunction(text, title);
                return;
            }
            _files = _self._fileUpload.getFilesObject();
            if (_files == null) {
                sendMessageFunction(text, title);
                return;
            }
            if (_files.length <= 0) {
                sendMessageFunction(text, title);
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
                sendMessageFunction(text, title);
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

    _proto._sendMessageExecute = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        if (!_self._isValidationOk(_rootElement)) {
            return false;
        }

        function _sendMessage(message, title) {
            let _mess = new MurmurMessage();
            _mess.setMessage(message);
            _mess.setThreadTitle(title ? title : "");
            _mess.setTo(LoginUser.getInstance().getJid());
            _mess.setReplyItemId("");
            _mess.setReplyTo("");
            _mess.getBodyType(0);
            let _ret = CubeeController.getInstance().sendMurmurMessage(_mess, (res)=>{
                if(res.content.result){
                    assignNoteForMessage(res)
                    ViewUtils.modal_allexit();
                }else{
                    if (res && res.content.reason) {
                        switch (res.content.reason) {
                            case (403000):
                                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('authority_err'));
                                break;
                            default:
                                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_murmur_send_message_error'));
                                break;
                        }
                    } else {
                        _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_murmur_send_message_error'));
                    }
                    return;
                }
            })
        }
        const assignNoteForMessage = (result) => {
            const _noteArea = $('#murmur_send_modal div.message-body-note > a.attach-note-btn > span').attr('value');
            if (_noteArea) {
                if (result != null && result.content && result.content.result) {
                    if (result.content.items && result.content.items.length) {
                        const item = result.content.items[0];
                        const interval_time = 200;
                        const timeout = 10000;
                        const set_interval_id = setInterval(waitGetNotification, interval_time);
                        let interval_cnt = 0;
                        function waitGetNotification() {
                            if (CubeeController.getInstance()._messageManager.getAllMessage().getByItemId(item.itemId)) {
                                clearInterval(set_interval_id);
                                CodiMdController.getInstance().assignNoteOnThreadRootId(item.itemId, _noteArea)
                                .then(function(result){
                                    $("#murmur_send_modal .message-body-note > a > span").remove();
                                    $("#murmur_send_modal .message-body-note > a").append("<span>");
                                    return;
                                }).catch(function(err){
                                    const _title   = Resource.getMessage('dialog_title_system_info');
                                    const _message = Resource.getMessage('dialog_error_assign_note_after_try');
                                    const _dialog = new DialogCloseView(_title, _message);
                                    _dialog.showDialog();
                                    return;
                                });
                            } else {
                                interval_cnt += 1;
                                if (interval_time * interval_cnt > timeout) {
                                    clearInterval(set_interval_id);
                                    const _title   = Resource.getMessage('dialog_title_system_info');
                                    const _message = Resource.getMessage('dialog_error_assign_note_after_try');
                                    const _dialog = new DialogCloseView(_title, _message);
                                    _dialog.showDialog();
                                }
                            }
                        }
                    }
                } else {
                    const _title   = Resource.getMessage('dialog_title_system_info');
                    const _message = Resource.getMessage('dialog_error_send_message');
                    const _dialog = new DialogCloseView(_title, _message);
                    _dialog.showDialog();
                    return;
                }
            } else {
                $("#murmur_send_modal .message-body-note > a > span").remove();
                $("#murmur_send_modal .message-body-note > a").append("<span>");
            }
        }

        let _title = $("#murmur_send_modal textarea.message-input-area-title").val();
        let _text = $("#murmur_send_modal textarea.message-input-area").val();
        if(!_text){
            alert("")
            return false;
        }
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
        _self._uploadFileAndSendMessage(_text, _title, _sendMessage);
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
        let _titleElement = formObj.find('textarea.message-input-area-title');
        let _title = _titleElement.val();
        formObj.find("#dialog-error").text('');
        _textareaElement.removeClass('input-error');
        _titleElement.removeClass('input-error');
        if(_title.length > ColumnView.THREAD_TITLE_MAX_LENGTH){
            _titleElement.addClass('input-error');
            formObj.find("#dialog-error").text(Resource.getMessage('dialog_update_title_validation_error'));
            return false;
        }
        if (_message.trim().length == 0) {
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
