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

function DialogAssignNoteOnSendMessageView(attachElement) {
    this._attachElement = attachElement;
    DialogAssignNoteView.call(this, "");

};(function() {
    DialogAssignNoteOnSendMessageView.prototype = $.extend({}, DialogAssignNoteView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogAssignNoteOnSendMessageView.prototype;

    _proto.executeAssignNote = function(){
        var _self = this;
        _self._dialogAreaElement.find("#dialog-error").text('');
        if (!_self._allNoteNames.length) {
            ViewUtils.modal_allexit();
        }
        if (!_self._selectAssignNote || !_self._selectAssignNote.length) {
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_no_select_assign_note'));
            return;
        }
        this._attachElement.children('p , .note_cancel_btn').remove();
        this._attachElement.children('.note_cancel_btn').off();
        var noteUrl = _self._selectAssignNote.attr('value');
        var noteTitle = Utils.convertEscapedHtml(_self._selectAssignNote.find('.note-name .note-list').text());
        var appendHtmlElement = '\
            <p title="' + noteTitle + '" value="' + noteUrl + '">' + noteTitle + '</p>\
            <a class="ico_btn note_cancel_btn">\
                <i class="fa fa-close" title="' + Resource.getMessage('dialog_label_cancel') + '"></i>\
            </a>';
        this._attachElement.append(appendHtmlElement);
        this._attachElement.find('.note_cancel_btn').on('click', function(){
            $(this).off();
            $(this).parent().find('p').remove();
            $(this).remove();
        })
        ViewUtils.modal_allexit();

    }

})();
