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

function DialogRemoveNoteView() {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._allNotes = null;
    this._removeList = new ArrayList();
    this._searchNotesList = null;
    DialogOkCancelView.call(this);
};(function() {
    DialogRemoveNoteView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogRemoveNoteView.prototype;
    _proto._init = function() {
        var _self = this;

        _self.frame = _self.getInnerHtml();
        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        ViewUtils.showLoadingTopInChild($('#dialog-error'));
        CodiMdController.getInstance().getNoteList()
        .then(function(result){
            if(result.result) {
                _self._allNotes = result.data;
                _self._createNoteElement(result.data);
            } else {
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_get_note_list'));
            }
        }).catch(function(err){
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_get_note_list'));
        }).finally(function(){
            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
        });

        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._createEventHandler();
    };

    _proto.cleanup = function() {
        var _self = this;
        if (_self.ps) {
            _self.ps.destroy();
        };
        _self.selectUserListView.cleanUp();
        _self.selectUserListView = null;
        _self._dialogAreaElement = null;
        _self._dialogInnerElement = null;
        _self.frame = null;
    }

    _proto.getInnerHtml = function(){
        const ret = '<div id="removenote_modal" class="card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('dialog_label_remove_note')+' </p>\
          </div>\
          <div class="select_menu">\
            <span class="select_number"><i class="fa fa-user"></i><span class="checkedCnt">0</span></span>\
            <form action="#" method="get" class="search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_label_search_note_list')+'">\
              <button type="button" name="search" class="user_search_btn ico_btn"><i class="fa fa-search"></i></button>\
            </form>\
            <label class="modal_btn all_check">'+Resource.getMessage('wizard_chatlist_allcheck')+'<label class="checkbox"><input name="allcheck" type="checkbox"><span></span></label></label>\
          </div>\
          <div class="list_wrapper scroll_content">\
            <ul class="modal_list select_list"></ul>\
          </div>\
          <div class="btn_wrapper">\
            <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
            <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_remove_user')+'</span></button>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

    _proto._createNoteElement = function(noteList){
        let _self = this;
        _self.frame.find("#dialog-error").text("");
        if (_self._allNotes.length == 0) {
            _self.frame.find("#dialog-error").text(Resource.getMessage('dialog_note_nothing'));
            return;
        }
        if (noteList.length == 0) {
            _self.frame.find("#dialog-error").text(Resource.getMessage('dialog_error_note_search_nothing'));
            return;
        }


        $.each(noteList, function(i, note){
            let _noteTitle = Utils.convertEscapedHtml(decodeURIComponent(note.note_title));
            let _noteRoomName = CodiMdViewUtils.getRoomName(note);

            let memberHtml = '<li title="'+_noteTitle + ' ' + _noteRoomName+'"><label>\
                <div class="note-name">\
                    <span class="name">'+_noteTitle+'</span> \
                </div>\
                <div class="note-group">\
                    <span class="group">'+_noteRoomName+'</span> \
                </div>\
                <label class="checkbox">\
                <input type="checkbox" name="removenote"><span></span></label> \
                </label></li>';

            let query = $(memberHtml);
            let content = _self._dialogInnerElement.find('.select_list').append(query);
            query.find("input:checkbox").val(note.note_url);

            if (0 <= _self._removeList._array.indexOf(note.note_url)){
                query.find("input:checkbox").prop("checked",true);
            }
            query.find('input[name=removenote]').off('change');
            query.find('input[name=removenote]').on('change', function() {
              let url = this.value;
              if(this.checked){
                  _self._removeList.add(this.value);
              }else{
                  _self._removeList._array.forEach((x, i) => {
                      if(x === url) _self._removeList.remove(i);
                  });
              }
              let cnt = _self._removeList.getCount();
              _self._dialogInnerElement.find('.checkedCnt').text(cnt);
            });
        });
    }

    _proto._createEventHandler = function() {
        var _self = this;
        _self.frame.find(".success_btn").on('click', function(){
            _self.frame.find("#dialog-error").text('');
            _self.removeNotes();
        })
        _self._dialogInnerElement.find('.user_search_btn').off('click');
        _self._dialogInnerElement.find('.user_search_btn').on('click', function(){
            _self.filterNotes();
        });
        _self._dialogInnerElement.find('input.field').keypress(function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
              _self.filterNotes();
           }
           return e.which !== 13;
        });

        _self._dialogInnerElement.find('input[name=allcheck]').off('change');
        _self._dialogInnerElement.find('input[name=allcheck]').on('change', function() {
            _self._dialogInnerElement.find('input[name=removenote]').prop('checked', this.checked);
            let urls = _self._dialogInnerElement.find('input[name=removenote]');
            if(this.checked){
                for( var i = 0; i < urls.length; i++){
                    if(0 === _self._removeList._array.filter(m => m === urls[i].value).length){
                        _self._removeList.add(urls[i].value);
                    }
                }
            }else{
                for( var i = 0; i < urls.length; i++){
                    _self._removeList.remove(_self._removeList._array.indexOf(urls[i].value));
                }
            }
            let cnt = _self._removeList.getCount();
            _self._dialogInnerElement.find('.checkedCnt').text(cnt);
        });
    }

    _proto.filterNotes = function(){
        let _self = this;
        _self._dialogInnerElement.find('.select_list').empty();
        _self._dialogInnerElement.find('input[name=allcheck]').prop('checked', false);
        let _inputKeyword = _self.frame.find('.field').val();
        let noteList = _self._allNotes.filter(function(note){
            let _noteTitle = Utils.convertEscapedHtml(decodeURIComponent(note.note_title));
            let _noteRoomName = Resource.getMessage('not_assign_room_notes');
            if (note.room_name) {
                _noteRoomName = decodeURIComponent(note.room_name);
            }
            return 0 <= _noteTitle.indexOf(_inputKeyword) || 0 <= _noteRoomName.indexOf(_inputKeyword);
        })
        _self._searchNotesList = noteList;
        _self._createNoteElement(_self._searchNotesList);
        _self.frame.find('.scroll_content').scrollTop(0);
    };

    _proto.removeNotes = function() {
        var _self = this;
        _self.frame.find("#dialog-error").text('');
        ViewUtils.showLoadingTopInChild($('#dialog-error'));

        if (_self._removeList.getCount() > 0) {

            let promises = [];
            for (var i=0; i<_self._removeList.getCount(); i++) {
                promises.push(CodiMdController.getInstance().removeNote(_self._removeList.get(i)))
            }

            Promise.all(promises).then(function(result){
                SidebarNoteView.getInstance().reloadNoteListOnSidebar();
                ViewUtils.modal_allexit();
            }).catch(function(err){
                _self.frame.find("#dialog-error").text(Resource.getMessage('dialog_error_failed_remove_notes'));
            }).finally(function(){
                ViewUtils.hideLoadingIconInChild($('#dialog-error'));
            });
        } else {
            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
            _self.frame.find("#dialog-error").text(Resource.getMessage('dialog_error_select_remove_notes'));
        }
    }

})();
