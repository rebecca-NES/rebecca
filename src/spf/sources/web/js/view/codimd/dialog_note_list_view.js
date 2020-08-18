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

function DialogNoteListView(_columnInfo=null) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._allNoteNames = null;
    this._columnInfo = _columnInfo;
    this._threadRootId = "";
    this._roomId = "";
    this._msgType = 0;
    DialogOkCancelView.call(this);
};(function() {
    DialogNoteListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogNoteListView.prototype;
    _proto._init = function() {
        var _self = this;

        _self.frame = _self.getInnerHtml();
        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._createEventHandler();
        ViewUtils.showLoadingTopInChild($('#dialog-error'));
        if (_self._columnInfo) {
            setNoteListParam(_self);
        }
        CodiMdController.getInstance().getNoteList(_self._threadRootId, _self._roomId, _self._msgType)
        .then(function(result){
            if(result.result) {
                _self._allNoteNames = result.data;
                _self._createNoteElement(result.data);
            } else {
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_get_note_list'));
            }
        }).catch(function(err){
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_get_note_list'));
        }).finally(function(){
            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
        });
    };

    function setNoteListParam(_self) {
        _self._msgType = ViewUtils.convertColumnTypeToMessageType(_self._columnInfo.getColumnType());
        switch(_self._msgType){
            case Message.TYPE_PUBLIC:
                break;
            case Message.TYPE_CHAT:
                _self._roomId = _self._columnInfo.getFilterCondition();
                break;
            case Message.TYPE_GROUP_CHAT:
                _self._roomId = _self._columnInfo.getChatRoomInfomation().getRoomId();
                break;
            case Message.TYPE_COMMUNITY:
                _self._roomId = _self._columnInfo.getCommunityInfomation().getRoomId();
                break;
            case Message.TYPE_MURMUR:
                _self._roomId = MurmurColumnInformation.getOwnJidFromSearchCondition(_self._columnInfo);
                break;
            default:
                break;
        }
        return;
    }

    _proto._createNoteElement = function(dataList) {
        var _self = this;
        var _errorElement = _self._dialogAreaElement.find("#dialog-error");
        _errorElement.text("");
        if (_self._allNoteNames.length == 0){
            _errorElement.text(Resource.getMessage('dialog_note_nothing'));
            return;
        }
        if (dataList.length == 0) {
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_error_note_search_nothing'));
            return;
        }
        var myjid = LoginUser.getInstance().getJid();
        for (var i=0; i<dataList.length; i++) {
            var noteName = Utils.convertEscapedHtml(decodeURIComponent(dataList[i].note_title));
            var roomName = CodiMdViewUtils.getRoomName(dataList[i]);
            var isOwnerAttr = "";
            if(dataList[i].ownjid == myjid){
                isOwnerAttr = '<a class="note-info-edit-open-dialog ownnote ico_btn fa fa-pencil" '
                            + ' title="' + Resource.getMessage('note_name_edit_botton_tooltip') + '"'
                            + ' noteurl="' + dataList[i].note_url + '"></a>';
            }else{
                isOwnerAttr = '<a class="note-info-edit-open-dialog notownnote ico_btn fa fa-pencil"></a>';
            }
            var noteElement = '\
                <li>\
                    <a href="' + dataList[i].note_url + '" target="_blank"\
                    title="' + noteName + '" class="text-overflow-ellipsis title-list">\
                        <div class="note-name">\
                            <span class="name note-list">' + noteName + '</span>\
                        </div>\
                        <div class="note-group">\
                            <span class="group note-list">' + roomName + '</span>\
                        </div>\
                    </a>\
                    ' + isOwnerAttr + ' \
                </li>';
            var query = $(noteElement);
            this._dialogInnerElement.find('.select_list').append(query);
            $("a.note-info-edit-open-dialog.ownnote", query).bind({
                'blur':(event)=>{
                    $('.tooltip').remove();
                },
                'click':(event)=>{
                    $('.tooltip').remove();
                    event.stopPropagation();
                    $("a.note-info-edit-open-dialog.ownnote", this._dialogInnerElement)
                        .each((i, e)=>{
                            if(e != event.currentTarget &&
                               $(e).attr("inedit") &&
                               $(e).attr("inedit") == "true"){
                                $(e).trigger('resetNoteEdit');
                            }
                        });
                    if(! $(event.currentTarget).attr("inedit")){
                        $(event.currentTarget).attr("inedit",true)
                        $(event.currentTarget).css("font-size","2.1rem")
                        $(event.currentTarget).removeClass("fa-pencil");
                        $(event.currentTarget).addClass("fa-check");
                        $(event.currentTarget).attr("title",Resource.getMessage('note_name_save_botton_tooltip'));
                        let notename = $(event.currentTarget).parent().find("a.title-list span.name").text();
                        $(event.currentTarget).parent().find("a.title-list").hide();
                        $(event.currentTarget).parent().on('click',(e)=>{
                            e.stopPropagation();
                            $(event.currentTarget).trigger('resetNoteEdit');
                        });
                        let inputname = $('<input class="note-rename-input" type="text" />')
                            .val(notename);
                        inputname.bind({
                            'click':(e)=>{
                                e.stopPropagation();
                            },
                            'keydown':(e)=>{
                                e.stopPropagation();
                                if (e.keyCode == 13) {
                                    $(event.currentTarget).trigger('saveNoteEdit');
                                }
                            },
                            'keyup':(e)=>{
                                e.stopPropagation();
                                let val = $(e.currentTarget).val();
                                if(val.length == 0 || val.length > Conf.getVal('NOTE_TITLE_MAX_LENGTH')){
                                    $(e.currentTarget).css("background-color","#ffc0cb");
                                }else{
                                    $(e.currentTarget).css("background-color","");
                                }
                            },
                            'forcus':(e)=>{
                                e.stopPropagation();
                            }
                        });
                        inputname.trigger('keyup');
                        $(event.currentTarget).parent().children("a.title-list").after(inputname)
                        $(event.currentTarget).parent().children('input.note-rename-input').focus();
                    }else
                    {
                        $(event.currentTarget).trigger('saveNoteEdit');
                    }
                },
                'saveNoteEdit':(event)=>{
                    let _noteUrl = $(event.currentTarget).attr("noteurl");
                    let notename = $(event.currentTarget).parent().find("input.note-rename-input").val();
                    if(notename.length == 0 || notename.length > Conf.getVal('NOTE_TITLE_MAX_LENGTH')){
                        return;
                    }
                    if(notename != $(event.currentTarget).parent().find("a.title-list span.name").text()){
                        CodiMdController.getInstance().setNoteTitle(_noteUrl,
                                                                    encodeURIComponent(Utils.excludeControleCharacters(notename)))
                                        .then((res)=>{
                                            if(res.result == true){
                                                $(event.currentTarget).parent().find("a.title-list span.name")
                                                                      .text(notename);
                                                $(event.currentTarget).parent().find("a.title-list")
                                                                      .attr("title",notename);
                                            }else{
                                                console.log("error responce:" + JSON.stringify(res));
                                                var _title   = Resource.getMessage('dialog_title_note_error');
                                                var _message = Resource.getMessage('dialog_error_note_rename');
                                                var _dialog = new DialogCloseView(_title, _message);
                                                _dialog.showDialog();
                                            }
                                        })
                                        .catch((err)=>{
                                            console.log("error responce:" + JSON.stringify(err));
                                            var _title   = Resource.getMessage('dialog_title_note_error');
                                            var _message = Resource.getMessage('dialog_error_note_rename');
                                            var _dialog = new DialogCloseView(_title, _message);
                                            _dialog.showDialog();
                                        }).finally(()=>{
                                            $(event.currentTarget).trigger('resetNoteEdit');
                                        });
                    }else{
                        $(event.currentTarget).trigger('resetNoteEdit');
                    }
                },
                'resetNoteEdit':(event)=>{
                    $(event.currentTarget).css("color","")
                    $(event.currentTarget).css("font-size","")
                    $(event.currentTarget).removeAttr("inedit")
                    $(event.currentTarget).removeClass("fa-check");
                    $(event.currentTarget).addClass("fa-pencil");
                    $(event.currentTarget).attr("title",Resource.getMessage('note_name_edit_botton_tooltip'));
                    $(event.currentTarget).parent().find("a.title-list").show();
                    $(event.currentTarget).parent().find("input.note-rename-input").remove();
                }
            });
            $("a.title-list", query)
                .on('click', (event) => {
                    event.stopPropagation();
                    ViewUtils.modal_allexit();
                });
        }
    }

    _proto.getInnerHtml = function(){
        const ret = '<div id="notelist_modal" class="card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('dialog_label_get_note_list')+' </p>\
          </div>\
          <div class="select_menu">\
            <form action="#" method="get" class="search_form title_search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_label_search_note_list')+'">\
              <button type="button" name="search" class="title_search_btn ico_btn"><i class="fa fa-search"></i></button>\
            </form>\
          </div>\
          <div class="list_wrapper scroll_content">\
            <ul class="modal_list select_list"></ul>\
          </div>\
          <div class="btn_wrapper">\
            <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
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
})();
