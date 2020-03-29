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
function DialogThreadTitleListView(_columnInfo, _parentObj) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._columnInfo = _columnInfo;
    this._parentObj = _parentObj;
    this._allThreadTitles = null;
    DialogOkCancelView.call(this);
};(function() {
    DialogThreadTitleListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogThreadTitleListView.prototype;
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

        CubeeController.getInstance().getThreadTitleList(_self._columnInfo).then((result) => {
            this._allThreadTitles = result.content.items;
            _self._createTitleElement(this._allThreadTitles)
            return;
        }).catch(function(err){
            if (err && err.content.reason) {
                switch (err.content.reason) {
                    case (403000):
                        _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('authority_err'));
                        break;
                    default:
                        _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_thread_title_list_get_error'));
                        break;
                }
            } else {
                _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_thread_title_list_get_error'));
            }
            return;
        });

    };

    _proto._createTitleElement = function(titleList) {
        var _self = this;
        var _errorElement = _self._dialogAreaElement.find("#dialog-error");
        _errorElement.text("");
        if (_self._allThreadTitles.length == 0){
            _errorElement.text(Resource.getMessage('dialog_thread_title_nothing'));
            return;
        }
        if (titleList.length == 0) {
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_thread_title_search_nothing'));
            return;
        }
        for (var i=0; i<titleList.length; i++) {
            if(titleList[i].roomName != null &&
               ((titleList[i].msgType != 11 && titleList[i].roomName.length > 0)||
                (titleList[i].msgType == 11 && this._columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_RECENT)
               )){
                titleList[i].roomName = Utils.urldecode(titleList[i].roomName);
                var titleElement = '\
                <li>\
                    <a class="text-overflow-ellipsis title-list thread-title-list">\
                        <span class="threadtitle name"></span>\
                        <span class="threadtitle roomname"></span>\
                    </a>\
                </li>';
                var query = $(titleElement);
                let category = [];
                let threadTitle = decodeURIComponent(titleList[i].threadTitle);
                let _threadTitle = threadTitle;
                _threadTitle = ViewUtils.replaceTenantBaseTitleCategory(_threadTitle, threadTitle, category);
                _threadTitle = ViewUtils.replaceOrignalTitleCategory(_threadTitle, threadTitle, category);

                let categoryArray = category.sort((a,b)=>{
                    return a.index - b.index; 
                });
                let categoryStr = '';
                for(let i=0;i<categoryArray.length;i++){
                    categoryStr += categoryArray[i].data;
                }
                query.find('span.name').html(categoryStr + " " + Utils.convertEscapedHtml(_threadTitle));
                let roomname = "";
                let roomTypeClassName;
                switch(titleList[i].msgType){
                    case 1:
                        roomname = Resource.getMessage('MyFeed');
                        roomTypeClassName = "feedtype";
                        break;
                    case 2:
                        roomname = Resource.getMessage('Chat') + " " + titleList[i].roomName;
                        roomTypeClassName = "chattype";
                        break;
                    case 3:
                        roomname = "GC " + titleList[i].roomName;
                        roomTypeClassName = "groupchattype";
                        break;
                    case 5:
                        roomname = "PJ " + titleList[i].roomName;
                        roomTypeClassName = "projecttype";
                        break;
                    case 11:
                        let cName = titleList[i].roomName;
                        if(!cName){
                            cName = Resource.getMessage('Murmur');
                        }
                        roomname = cName;
                        roomTypeClassName = "murmur";
                        break;
                    default:
                        roomname = titleList[i].roomName;
                        break;
                }
                query.find('span.roomname').text(roomname);
                if(roomTypeClassName){
                    query.find('span.roomname').addClass(roomTypeClassName);
                }
                query.find('span.name').attr('itemid', titleList[i].threadRootId);
                query.find('span.name').attr('title', decodeURIComponent(titleList[i].threadTitle));
                this._dialogInnerElement.find('.select_list').append(query);
                query.on('click', function(){
                    _self.openConversationColumn($(this).find('span').attr('itemid'));
                    ViewUtils.modal_allexit();
                });
            }else{
                var titleElement = '\
                <li>\
                    <a class="text-overflow-ellipsis title-list">\
                        <span class="threadtitle name"></span>\
                    </a>\
                </li>';
                var query = $(titleElement);
                let category = [];
                let threadTitle = decodeURIComponent(titleList[i].threadTitle);
                let _threadTitle = threadTitle;
                _threadTitle = ViewUtils.replaceTenantBaseTitleCategory(_threadTitle, threadTitle, category);
                _threadTitle = ViewUtils.replaceOrignalTitleCategory(_threadTitle, threadTitle, category);

                let categoryArray = category.sort((a,b)=>{
                    return a.index - b.index;
                });
                let categoryStr = '';
                for(let i=0;i<categoryArray.length;i++){
                    categoryStr += categoryArray[i].data;
                }
                query.find('span').html(categoryStr + " " + Utils.convertEscapedHtml(_threadTitle));
                query.find('span').attr('itemid', titleList[i].threadRootId);
                query.find('span').attr('title', decodeURIComponent(titleList[i].threadTitle));
                this._dialogInnerElement.find('.select_list').append(query);
                query.on('click', function(){
                    _self.openConversationColumn($(this).find('span').attr('itemid'));
                    ViewUtils.modal_allexit();
                });
            }
        }
    }

    _proto.getInnerHtml = function(){
        const ret = '<div id="threadtitlelist_modal" class="card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('dialog_label_thread_title_list')+' </p>\
          </div>\
          <div class="select_menu">\
            <form action="#" method="get" class="search_form title_search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_label_thread_search')+'">\
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
        var _searchTitleList = _self._allThreadTitles.filter(function(threadTitle){
            if ( (_inputKeyword == Resource.getMessage('MyFeed') && threadTitle.msgType == Message.TYPE_PUBLIC) ||
                (_inputKeyword == Resource.getMessage('Chat') && threadTitle.msgType == Message.TYPE_CHAT) ||
                (_inputKeyword == 'GC' && threadTitle.msgType == Message.TYPE_GROUP_CHAT) ||
                (_inputKeyword == 'PJ' && threadTitle.msgType == Message.TYPE_COMMUNITY) ||
                (_inputKeyword == Resource.getMessage('Murmur') && threadTitle.msgType == Message.TYPE_MURMUR)
            ) {
                return true;
            }
            var _threadTitle = decodeURIComponent(threadTitle.threadTitle);
            var _noteRoomName = '';
            if (threadTitle.roomName) {
                _noteRoomName = Utils.urldecode(threadTitle.roomName);
            }
            return 0 <= _threadTitle.indexOf(_inputKeyword) || 0 <= _noteRoomName.indexOf(_inputKeyword);
        })
        _self._createTitleElement(_searchTitleList);
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    _proto.openConversationColumn = function(parentItemId) {
        var _self = this;
        var _showConversationColumnInfo = new ShowConversationColumnInfomation();
        _showConversationColumnInfo.setParentItemId(parentItemId);
        _showConversationColumnInfo.setSourceColumnDisplayName(_self._columnInfo.getDisplayName());
        _showConversationColumnInfo.setSourceColumnType(_self._parentObj.getColumnInfo().getColumnType())
        ColumnManager.getInstance().insertAfterColumn(_showConversationColumnInfo, _self._parentObj, true, true);
    }
})();
