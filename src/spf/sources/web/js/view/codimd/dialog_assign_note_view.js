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

function DialogAssignNoteView(message) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._allNoteNames = null;
    this._selectAssignNote = null;
    this._assignThreadRootId = null;
    this.AssignedNoteTitle = null;
    this.AssignedNoteUrl = null;
    if (message) {
        this._assignThreadRootId = message.getThreadRootId();
        this.AssignedNoteTitle = message.getNoteTitle();
        this.AssignedNoteUrl = message.getNoteUrl();
        var data = {
            msgtype : message.getType(),
            room_name : ""
        }
        switch(message.getType()) {
            case Message.TYPE_PUBLIC:
                break;
            case Message.TYPE_CHAT:
                var userInfo = CubeeController.getInstance().getPersonData(message.getTo())
                if (userInfo) {
                    data.room_name = userInfo.getUserName();
                } else {
                    data.room_name = message.getTo().slice(0, message.getTo().indexOf('@')-4);
                }
                break;
            case Message.TYPE_GROUP_CHAT:
            case Message.TYPE_COMMUNITY:
                data.room_name = message.getRoomName();
                break;
        }
        this.roomName = CodiMdViewUtils.getRoomName(data);
    }
    DialogOkCancelView.call(this);
};(function() {
    DialogAssignNoteView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogAssignNoteView.prototype;
    _proto._init = function() {
        var _self = this;

        _self.frame = _self.getInnerHtml();
        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();
        if (this.AssignedNoteTitle && this.AssignedNoteUrl) {
            var setSelectNoteElement = getAssignedNoteElement(this.AssignedNoteTitle, this.AssignedNoteUrl, this.roomName);
            _self._dialogInnerElement.find('ul.assign_note .assign-cancel-btn').before(setSelectNoteElement);
            this._selectAssignNote = $(setSelectNoteElement);
            _self._dialogAreaElement.find('.assign-cancel-btn').show();
        }

        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._createEventHandler();
        ViewUtils.showLoadingTopInChild($('#dialog-error'));
        CodiMdController.getInstance().getNoteList()
        .then(function(result){
            if(result.result) {
                _self._allNoteNames = result.data.filter(function(note){
                    return !note.thread_root_id
                });
                _self._createNoteElement(_self._allNoteNames);
            } else {
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_get_note_list'));
            }
        }).catch(function(err){
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_get_note_list'));
        }).finally(function(){
            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
        });
    };

    _proto._createNoteElement = function(dataList) {
        var _self = this;
        var _errorElement = _self._dialogAreaElement.find("#dialog-error");
        _errorElement.text("");
        if (_self._allNoteNames.length == 0){
            if (_self.AssignedNoteUrl) {
                _errorElement.text('');
                return;
            }
            _errorElement.text(Resource.getMessage('dialog_note_nothing_for_assign'));
            return;
        }
        if (dataList.length == 0) {
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_note_search_nothing'));
            return;
        }
        for (var i=0; i<dataList.length; i++) {
            var noteName = Utils.convertEscapedHtml(decodeURIComponent(dataList[i].note_title));
            var roomName = Resource.getMessage('not_assign_room_notes');
            if (dataList[i].thread_root_id) {
                continue;
            }

            var noteElement = '\
                <li>\
                    <a value="' + dataList[i].note_url + '"\
                    title="' + noteName + '" class="text-overflow-ellipsis title-list">\
                        <div class="note-name">\
                            <span class="name note-list">' + noteName + '</span>\
                        </div>\
                        <div class="note-group">\
                            <span class="group note-list">' + roomName + '</span>\
                        </div>\
                    </a>\
                </li>';
            var query = $(noteElement);
            this._dialogInnerElement.find('.select_list').append(query);
        }
    }

    _proto.getInnerHtml = function(){
        const ret = '<div id="assignnote_modal" class="card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('dialog_label_assign_note')+' </p>\
          </div>\
          <div class="select_menu">\
            <p class="modal_title">'+ Resource.getMessage('dialog_label_select_assign_note') +':</p>\
            <form action="#" method="get" class="search_form title_search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_label_search_note_list')+'">\
              <button type="button" name="search" class="title_search_btn ico_btn"><i class="fa fa-search"></i></button>\
            </form>\
          </div>\
          <div class="assign-list">\
            <div class="list_wrapper scroll_content">\
              <ul class="modal_list select_list"></ul>\
            </div>\
            <p class="modal_title assign_note_title">' + Resource.getMessage('dialog_selected_note') + ':</p>\
            <ul class="modal_list assign_note">\
              <li>\
                <a class="ico_btn assign-cancel-btn" role="button" style="display:none;"><i class="fa fa-times"></i></a>\
              <li>\
            </ul>\
          </div>\
          <div class="btn_wrapper">\
            <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
            <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_ok')+'</span></button>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

    function getAssignedNoteElement(title, url, roomname) {
        return '\
              <a value="' + Utils.convertEscapedHtml(url) + '"\
                title="' + Utils.convertEscapedHtml(title) + '" class="text-overflow-ellipsis title-list">\
                  <div class="note-name">\
                      <span class="name note-list">' + Utils.convertEscapedHtml(title) + '</span>\
                  </div>\
                  <div class="note-group">\
                      <span class="group note-list">' + roomname + '</span>\
                  </div>\
              </a>';

    }

    _proto._createEventHandler = function() {
        var _self = this;
        _self._dialogInnerElement.find('.title_search_btn').off('click');
        _self._dialogInnerElement.find('.title_search_btn').on('click', function(){
            _self.filterTitles();
        });
        _self._dialogInnerElement.find('input.field').keypress(function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
              _self.filterTitles();
           }
           return e.which !== 13;
        });
        _self._dialogInnerElement.on('click', '.select_list li', function(){
            showAssignNote(_self, $(this).find('a').prop('outerHTML'));
        });
        _self._dialogInnerElement.on('click', '.success_btn', function() {
            _self.executeAssignNote();
        });

        _self._dialogInnerElement.find('.assign-cancel-btn').on('click', function(){
            $(this).parent().find('.title-list').remove();
            $(this).hide();
            _self._selectAssignNote = null;
        });

    }

    _proto.filterTitles = function(){
        var _self = this;
        _self._dialogInnerElement.find('.select_list').empty();

        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _searchTitleList = _self._allNoteNames.filter(function(note){
            var _noteTitle = decodeURIComponent(note.note_title);
            var _noteRoomName = Resource.getMessage('not_assign_room_notes');
            if (note.room_name) {
                _noteRoomName = decodeURIComponent(note.room_name);
            }
            return 0 <= _noteTitle.indexOf(_inputKeyword) || 0 <= _noteRoomName.indexOf(_inputKeyword);
        })
        _self._createNoteElement(_searchTitleList);
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    function showAssignNote(_self, destElem) {
        destElem = $(destElem);
        _self._dialogAreaElement.find('ul.assign_note .title-list').remove();
        _self._dialogAreaElement.find('ul.assign_note .assign-cancel-btn').before(destElem.prop('outerHTML'));
        _self._selectAssignNote = destElem;
        _self._dialogAreaElement.find('.assign-cancel-btn').show();
    }

    _proto.executeAssignNote = function(){
        var _self = this;
        _self._dialogAreaElement.find("#dialog-error").text('');
        if (!_self.AssignedNoteUrl) {
            if (!_self._allNoteNames.length) {
                ViewUtils.modal_allexit();
                return;
            }
            if (!_self._selectAssignNote || !_self._selectAssignNote.length) {
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_no_select_assign_note'));
                return;
            }
        }
        if (!_self._assignThreadRootId) {
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_assign_note'));
            return;
        }
        var noteUrl = '';
        if (_self._selectAssignNote && _self._selectAssignNote.length) {
            noteUrl = _self._selectAssignNote.attr('value');
            if (_self.AssignedNoteUrl == noteUrl) {
                ViewUtils.modal_allexit();
                return;
            }
        }
        ViewUtils.showLoadingTopInChild(_self._dialogAreaElement.find("#dialog-error"));
        _self._dialogAreaElement.find('button.success_btn').prop('disabled', true);
        if (noteUrl && _self.AssignedNoteUrl && _self.AssignedNoteUrl != noteUrl) {
            CodiMdController.getInstance().assignNoteOnThreadRootId(_self._assignThreadRootId, "")
            .then(function(result){
                return CodiMdController.getInstance().assignNoteOnThreadRootId(_self._assignThreadRootId, noteUrl);
            }).then(function(result){
                ViewUtils.modal_allexit();
            }).catch(function(err){
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_assign_note'));
            }).finally(function(){
                ViewUtils.hideLoadingIconInChild(_self._dialogAreaElement.find("#dialog-error"));
                _self._dialogAreaElement.find('button.success_btn').prop('disabled', false);
            });
        } else {
            CodiMdController.getInstance().assignNoteOnThreadRootId(_self._assignThreadRootId, noteUrl)
            .then(function(result){
                ViewUtils.modal_allexit();
            }).catch(function(err){
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_assign_note'));
            }).finally(function(){
                ViewUtils.hideLoadingIconInChild(_self._dialogAreaElement.find("#dialog-error"));
                _self._dialogAreaElement.find('button.success_btn').prop('disabled', false);
            });
        }
    }

})();
