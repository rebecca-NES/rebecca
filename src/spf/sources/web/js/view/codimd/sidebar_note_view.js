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

function SidebarNoteView() {
    this._htmlElement = null;
};(function() {
    var _sidebarNoteView = new SidebarNoteView();

    SidebarNoteView.getInstance = function() {
        return _sidebarNoteView;
    };

    var _proto = SidebarNoteView.prototype;

    _proto.setNoteHtmlElement = function(){
        let _html = '\
          <div class="sidebar_list_content note_list">\
              <div class="list_ttl_ico">\
                  <i class="fa fa-pencil-square-o"></i>\
              </div>\
              <div class="sidebar_list_inner">\
                  <div class="list_ttl">\
                      <span>ノート</span>\
                      <a id="note-create" class="list_add ico_btn" data-toggle="tooltip" data-placement="left" title="ノートを作成" data-modal="addchat_modal"><i class="fa fa-plus"></i></a>\
                      <a id="note-delete" class="list_remove ico_btn" data-toggle="tooltip" data-placement="left" title="ノートを削除" data-modal="removechat_modal"><i class="fa fa-minus"></i></a>\
                  </div>\
                  <ul class="sidebar_list"></ul>\
                  <div class="all_list_btn">\
                      <a id="note-all-list" class="list_add txt_btn" data-modal="chatlist_modal">全てのノートを見る</a>\
                  </div>\
              </div>\
          </div>\
        ';
        let sidebar_list = $('.sidebar_list_wrapper');
        sidebar_list.append(_html);
        this._htmlElement = sidebar_list.find('.note_list');
        createEvent(this._htmlElement);
        this.reloadNoteListOnSidebar();
    }

    function createEvent(element) {
        element.find('#note-create').on('click', function(){
            let _createNoteView = new DialogCreateNoteView();
            _createNoteView.showDialog();
        });
        element.find('#note-delete').on('click', function(){
            let _removeNoteView = new DialogRemoveNoteView();
            _removeNoteView.showDialog();
        });
        element.find('#note-all-list').on('click', function(){
            let _getNoteListView = new DialogNoteListView();
            _getNoteListView.showDialog();
        });
        element.find('[data-toggle="tooltip"]').tooltip({
            trigger: 'hover'
        });
    }

    _proto.reloadNoteListOnSidebar = function() {
        let _self = this;
        CodiMdController.getInstance().getNoteList()
        .then(function(result){
            if(result.result) {
                let _listElement = _self._htmlElement.find('ul.sidebar_list');
                _listElement.children().remove();
                for (var i=0; i<5; i++) {
                    _listElement.append(getNoteListHtmlElement(_listElement, result.data[i]));
                }
            } else {
            }
        }).catch(function(){
        });
    }

    function getNoteListHtmlElement(listElement, data) {
        if (!data.note_title) {
            return false;
        }
        let _note_title = Utils.convertEscapedHtml(decodeURIComponent(data.note_title));
        let _roomName = CodiMdViewUtils.getRoomName(data);
        let html = '\
            <li>\
                <a href="' + data.note_url + '" target="_blank" \
                        msgtype="'+ data.msgtype +'" \
                        roomid="'+ data.room_id +'" \
                        title="' + _note_title + ' ' + _roomName + '">\
                    <span class="name">' + _note_title + '</span>\
                    <span class="group">' + _roomName  + '</span>\
                </a>\
            </li>';
        return html;
    }

    _proto.showNoteList = function() {
        let _self = this;
        if (!CodiMdViewUtils.judgeNoteEnable()) {
            return
        }
        let max_count = 3600;
        let count = 0;
        let intid = setInterval(()=>{
            if(CodiMdController.getInstance().connectPostToZeroJson()){
                clearTimeout(intid);
                _self.setNoteHtmlElement();
            }
        },1000);
    };

})();
