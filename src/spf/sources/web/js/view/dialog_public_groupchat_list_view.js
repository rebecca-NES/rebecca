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

function DialogPublicGroupchatListView(tabInfo) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this.currentTabInfo = tabInfo ? tabInfo : {};
    DialogOkCancelView.call(this);
    this.isGotRoomArrayList = false;
    this.roomArrayList = new ArrayList();
};(function() {
    DialogPublicGroupchatListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogPublicGroupchatListView.prototype;

    _proto._init = function() {
        var _self = this;

        _self.isGotRoomArrayList = false;
        _self.roomArrayList = new ArrayList();

        _self.frame = _self.getInnerHtml();

        var groupchatListView = new PublicGroupChatListView();
        groupchatListView.init({
            numOfGroupchat: 10
        });
        groupchatListView.showInnerFrameFromProject(function(){}, _self.currentTabInfo);
        _self.frame.find('.modal_list').append(groupchatListView._frame);
        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();
        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });

        _self._createEventHandler();

        _self._dialogInnerElement.find('.scroll_content').on('ps-y-reach-end', function(){
            groupchatListView._showReadMore();
        })
        _self._dialogInnerElement.on('click', ".modal_exit", function() {
            _super.cleanup.call(_self);
        })
    };

    _proto.getInnerHtml = function(){
        const ret = '<div id="public_grouplist_modal" class="card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('PublicGroupChatList')+' </p>\
          </div>\
          <div class="select_menu">\
            <form action="#" method="get" class="search_form title_search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_label_groupchatlist_search')+'">\
              <button type="button" name="search" class="title_search_btn ico_btn"><i class="fa fa-search"></i></button>\
            </form>\
          </div>\
          <div class="list_wrapper scroll_content">\
            <ul class="modal_list select_list"></ul>\
          </div>\
          <div class="btn_wrapper">\
            <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
            <button type="button" role="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" id="dialog-public-groupchat-joining-button">\
             <span>'+Resource.getMessage('dialog_public_groupchat_joining')+'</span>\
            </button>\
          </div>\
          <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

    _proto._createEventHandler = function() {
        var _self = this;
        _self._dialogInnerElement.find('.title_search_btn').off('click');
        _self._dialogInnerElement.find('.title_search_btn').on('click', function(){
            _self.filterColumnName();
        });
        _self._dialogInnerElement.find('input.field').keypress(function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
              _self.filterColumnName();
           }
           return e.which !== 13;
        });
        $('#dialog-public-groupchat-joining-button').click(()=>{
            const sltRoomId = _self._dialogInnerElement.find('input[name=public-gc-room-id]:checked').val()
            if(sltRoomId == null){
                return;
            }
            CubeeServerConnector.getInstance().addPublicGroupChatRoomMember(sltRoomId,()=>{
                setTimeout(()=>{
                    let chatroominfo = CubeeController.getInstance().getChatRoomInfoByRoomId(sltRoomId);
                    if(chatroominfo == null){
                        var _errorElement = _self._dialogAreaElement.find("#dialog-error");
                        _errorElement.text(Resource.getMessage('add_member_err_submit'));
                        return;
                    }
                    const myJid = LoginUser.getInstance().getJid();
                    chatroominfo.addMemberList(myJid)

                    let _columnInformation = ViewUtils.getGroupChatColumnInfo(chatroominfo);
                    ColumnManager.getInstance().addColumn(_columnInformation, true, true);
                    ViewUtils.modal_allexit();
                },500)
            });
        })
    }

    _proto._createColumnNameElement = function(columnNameList, countAlllist) {
        var _self = this;
        var _errorElement = _self._dialogAreaElement.find("#dialog-error");
        _errorElement.text("");
        if (countAlllist == 0){
            _errorElement.text(Resource.getMessage('dialog_groupchatlist_nothing'));
            return;
        }
        if (columnNameList.length == 0) {
            _self._dialogAreaElement.find("#dialog-error")
                 .text(Resource.getMessage('dialog_groupchatlist_search_nothing'));
            return;
        }
        const myJid = LoginUser.getInstance().getJid();
        for (var i=0; i<columnNameList.length; i++) {
            if(columnNameList[i].getRoomName() != null &&
               columnNameList[i].getRoomName().length > 0){

                const memberList = columnNameList[i].getMemberList();
                if(memberList._array.indexOf(myJid) >= 0){
                    continue;
                }
                var avatarInfo = Utils.avatarCreate({type: 'group', name: columnNameList[i].getRoomName()})
                var columnNameElement = '\
                    <li title="'
                                 + Utils.convertEscapedHtml(columnNameList[i].getRoomName())
                                 + '">\
                    <label for="pub_gc_' + columnNameList[i].getRoomId() + '"><div><a roomid='
                                 + columnNameList[i].getRoomId()
                                 + ' title="'
                                 + Utils.convertEscapedHtml(columnNameList[i].getRoomName()) + '">\
                        <span class="ico ico_group">\
                           <div class="no_img" style="background-color:' + avatarInfo.color + '">\
                             <div class="no_img_inner">' + avatarInfo.name + '</div>\
                           </div></span>\
                        <span class="name room-list-name">'
                                 + Utils.convertEscapedHtml(columnNameList[i].getRoomName())
                                 + '</span>\
                    </a>\
                    <input type="radio" name="public-gc-room-id" value="' + columnNameList[i].getRoomId() + '" id="pub_gc_' + columnNameList[i].getRoomId() + '" />\
                    <span class="public-gc-room-list-radio"></span>\
                </div></label></li>';
                var query = $(columnNameElement);
                let roomId = columnNameList[i].getRoomId();
                this._dialogInnerElement.find('.select_list').append(query);
            }
        }
    }

    _proto.filterColumnName = function(){
        var _self = this;
        _self._dialogInnerElement.find('.select_list').empty();

        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        if(!_self.isGotRoomArrayList && _inputKeyword.length == 0){
            return;
        }
        const makeListHtml = (groupchatList) => {
            let gcList = [];
            for(let i=0;i<groupchatList.getCount();i++){
                let gcinfo = groupchatList.get(i);
                if(gcinfo.getRoomName().indexOf(_inputKeyword) >= 0){
                    gcList.push(gcinfo);
                }
                if(!_self.isGotRoomArrayList){
                    _self.roomArrayList.add(gcinfo);
                }
            }
            _self.isGotRoomArrayList = true;
            _self._createColumnNameElement(gcList, -1, true);
            _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
        }

        if(_self.isGotRoomArrayList){
            makeListHtml(_self.roomArrayList);
        }else{
            var _sortCondition = new ColumnSortCondition();
            _sortCondition.getItems().removeAll();
            _sortCondition.getItems().add("updated_at");
            _sortCondition.getOrders().removeAll();
            _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);
            var parentList = new ArrayList();
            parentList.add(this.currentTabInfo);
            CubeeController.getInstance().getPublicGroupRoomInfoList(
                0, Conf.getVal('NUMBER_OF_ITEMS_SEARCH_MAX_LIST'),
                _sortCondition, makeListHtml);
        }
    };

    $(function() {
        var showGroupChat = $('#left_sidebar').find('.groupchat_list .all_public_list_btn a');
        showGroupChat.on('click', function(){
            var tabInfo = TabManager.getInstance().getCommunityInfo();
            var dialog = new DialogPublicGroupchatListView(tabInfo);
            dialog.showDialog();
        });
    });
})();
