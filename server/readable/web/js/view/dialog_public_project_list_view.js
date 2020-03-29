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
function DialogPublicProjectListView() {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    DialogOkCancelView.call(this);
    DialogPublicProjectListView.AvaterType = 'project';
    this.isGotRoomArrayList = false;
    this.roomArrayList = new CommunityList();
};(function() {
    DialogPublicProjectListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogPublicProjectListView.prototype;

    _proto._init = function() {
        var _self = this;

        _self.isGotRoomArrayList = false;
        _self.roomArrayList = new CommunityList();

        _self._dialogAreaElement.html(getFrame());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        getAllPublicProjectList(0,_self);

        _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._dialogInnerElement.on('click', ".modal_exit", function() {
            _super.cleanup.call(_self);
            _self.cleanup();
        })
    };

    function cleanUp(_self) {
        _self._dialogAreaElement = null;
        _self.roomArrayList = null;
    }

    function getAllPublicProjectList(_startID,_self) {

        if (_self.isGotRoomArrayList) {
            _self._dialogAreaElement.find('#public-projectList')
                 .append(setPublicProjectListFrame(_self,_self.roomArrayList));
            setEventHandler(_self);
            _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
            return;
        }
        function onJoinedCommunityInfoListCallback(_communityList) {
            _self._dialogAreaElement.find('#public-projectList')
                 .append(setPublicProjectListFrame(_self,_communityList));

            _self._dialogInnerElement.off();
            setEventHandler(_self);
            _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
        }

        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);

        CubeeController.getInstance().getNoJoinedPublicCommunityInfoList(
            0, Conf.getVal('NUMBER_OF_ITEMS_SEARCH_MAX_LIST'), _sortCondition, onJoinedCommunityInfoListCallback);
    }

    function getFrame() {
        const ret = '<div id="public_projectlist_modal" class="card modal_card">\
    <div class="card_title">\
      <p> '+Resource.getMessage('public_project_list_title') + ' </p>\
    </div>\
    <div class="select_menu">\
      <form action="#" method="get" class="search_form title_search_form">\
        <input type="text" name="q" class="field" placeholder="' + Resource.getMessage('dialog_label_projectlist_search') + '">\
        <button type="button" name="search" class="title_search_btn ico_btn"><i class="fa fa-search"></i></button>\
      </form>\
    </div>\
    <div class="list_wrapper scroll_content">\
      <ul class="modal_list select_list" id="public-projectList"></ul>\
    </div>\
    <div class="btn_wrapper">\
      <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
      <button type="button" role="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" id="dialog-public-community-joining-button">\
      <span>'+Resource.getMessage('dialog_public_community_joining')+'</span>\
    </div>\
    <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
  </div>';
        return ret;
    };

    function setPublicProjectListFrame(_self,_communityList) {
        $('#public-projectList').empty();

        _self._dialogAreaElement.find("#dialog-error").text("");
        if(_communityList == null ||
           !_communityList._array ||
           ! Array.isArray(_communityList._array)){
            _self._dialogAreaElement.find("#dialog-error")
                 .text(Resource.getMessage('get_room_list_err'));
            return;
        }
        var projectListCount= _communityList.getCount();
        if(projectListCount == 0){
            _self._dialogAreaElement.find("#dialog-error")
                 .text(Resource.getMessage('dialog_projectlist_search_nothing'));
            return;
        }
        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        if(_self.roomArrayList.getCount() > 0 &&
            !_self.isGotRoomArrayList && _inputKeyword.length == 0){
            return;
        }
        var _ret = "";
        for(var i = 0; i< projectListCount; i++) {
            var _roomInfo = _communityList.get(i);

            if(!_self.isGotRoomArrayList){
                _self.roomArrayList.add(_roomInfo.getRoomId(),_roomInfo);
            }
            if(_inputKeyword.length > 0 &&
               _roomInfo.getRoomName().indexOf(_inputKeyword) < 0){
                continue;
            }
            var _avaterDate = _roomInfo.getLogoUrl();
            var projectname = _roomInfo.getRoomName();
            _ret += '<li class="cf">';
            _ret += '<label for="pub_comm_' + _roomInfo.getRoomId() + '"><div>';
            _ret += '<a  data_value="' + _roomInfo.getRoomId() + '">';
            _ret += '<span class="ico ico_project">';
            if (_avaterDate == null || _avaterDate == '') {
                var result = Utils.avatarCreate({name:projectname ,
                                                 type:DialogPublicProjectListView.AvaterType });
                _ret += '<div class="no_img" style="background-color:'
                      + result.color + '"><div class="no_img_inner">'
                      + result.name + '</div></div></span>';
            } else {
                _ret += '<img src="' + _avaterDate + '" alt=""></span>';
            }
            _ret += '<span class="name">'
                  + Utils.convertEscapedHtml(projectname,false) + '</span>';
            _ret += '<span class="detail">'
                 +  Utils.convertEscapedHtml(_roomInfo.getDescription(),true)
                  + '</span>';
            _ret += '</a>'
            _ret += '<input type="radio" name="public-comm-room-id" value="'
                  + _roomInfo.getRoomId()
                  + '" id="pub_comm_' + _roomInfo.getRoomId() + '" />'
            _ret += '<span class="public-comm-room-list-radio"></span>'
            _ret += '</div></label>'
            _ret += '</li>'
        }
        if(!_ret){
            _self._dialogAreaElement.find("#dialog-error")
                 .text(Resource.getMessage('dialog_projectlist_search_nothing'));
        }
        _self.isGotRoomArrayList = true;
        return _ret;
    }

    function roomClick(_communityId, _self){

        function getItemForId (){
            var projectListCount= _self.roomArrayList.getCount();
            for(var i = 0; i< projectListCount; i++) {
                var proItem = _self.roomArrayList.get(i);
                if(proItem.getRoomId() == _communityId) {
                    return proItem;
                }
            }
            return null;
        };

        var communityInfo = getItemForId();
        if(communityInfo == null){
            return;
        }
        var delCommunityId = $('.project_btn').attr('data_value');

        SelectAndAddProjectView.getInstance().setHeaderIconAndColor(communityInfo);

        $('#prj_ico').show();

        function deletePublicProject(){
            if(delCommunityId != _communityId){
                var _tabCommunity = new TabCommunityItemView();
                if(delCommunityId != "myworkplace"){
                    _tabCommunity.init(delCommunityId);
                }
            }
        }

        TabManager.getInstance().selectOrAddTabByCommunityInfo(
            communityInfo.getRoomId(),
            communityInfo, deletePublicProject);

        cleanUp(_self);
        ViewUtils.modal_allexit();
    }
    function setEventHandler(_self) {
        _self._dialogInnerElement.find('.title_search_btn').off('click');
        _self._dialogInnerElement.find('.title_search_btn').on('click', function(){
            getAllPublicProjectList(0,_self);
        });
        _self._dialogInnerElement.find('input.field').off('keypress');
        _self._dialogInnerElement.find('input.field').on('keypress',function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
                getAllPublicProjectList(0,_self);
            }
            return e.which !== 13;
        });
        $('#dialog-public-community-joining-button').click(()=>{
            const sltRoomId = _self._dialogInnerElement.find('input[name=public-comm-room-id]:checked').val()
            if(sltRoomId == null){
                return;
            }
            CubeeServerConnector.getInstance().addPublicCommunityMember(sltRoomId,(res)=>{
                if(res.content && !res.content.result){
                    var _errorElement = _self._dialogAreaElement.find("#dialog-error");
                    _errorElement.text(Resource.getMessage('add_member_err_submit'));
                    return;
                }
                roomClick(sltRoomId, _self)
            });
        })
    };
})();
