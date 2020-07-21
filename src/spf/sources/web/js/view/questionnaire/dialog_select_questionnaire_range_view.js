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

function DialogSelectQuestinnaireRangeView(title, optionItem) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._height = 200;
    this._submitButtonTitle = DialogOkCancelView.LABEL_OK;
    this._optionItem = optionItem;
    this._title = title;
    DialogOkCancelView.call(this);
};(function() {
    DialogSelectQuestinnaireRangeView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogSelectQuestinnaireRangeView.prototype;

    var _range;
    var _defalutSelectValue;
    var _allRoomList = [];

    _proto._init = function() {
        var _self = this;
        _self.frame = _self.getInnerHtml();
        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _defalutSelectValue = _self._optionItem.val();
        var paramArray=_defalutSelectValue.split(",");
        var roomType = paramArray[1];
        if (roomType == -1) {
            roomType = 5;
        }
        $("select#range-type").val(roomType);

        creatRangeSelectMemberName(_self, roomType);

        _self._createEventHandler();

    };

    _proto._createEventHandler = function() {
        var _self = this;
        $("select#range-type").change(function() {
            var selectValue = $("select#range-type").val();
            creatRangeSelectMemberName(_self, selectValue);
        });

        _self._dialogInnerElement.find(".success_btn").on("click", function(){
            _self.submit();
        })

        _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
            suppressScrollX: true
        });

        _self._dialogInnerElement.find('.title_search_btn').off('click');
        _self._dialogInnerElement.find('.title_search_btn').on('click', function(){
            filterRoomList(_self);
        });
        _self._dialogInnerElement.find('input.field').keypress(function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
                filterRoomList(_self);
            }
            return e.which !== 13;
        });
    }

    function filterRoomList(_self) {
        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        _self._dialogInnerElement.find('#dialog-error').text("");
        $('#showList_for_range').children().remove();
        var _searchResult = [];
        _allRoomList.filter(function(roomInfo){
            var roomName = roomInfo.getRoomName();
            if( 0 <= roomName.indexOf(_inputKeyword)) {
                _searchResult.add(roomInfo)
            }
        })
        var selectType = parseInt($("select#range-type").val());
        if (!_searchResult.length || !selectType) {
            _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('dialog_search_room_nothing'));
            return;
        }
        if (selectType == QuestionnaireRegister.ROOM_TYPE_COMMUNITY) {
            $('#showList_for_range').append(setProjectListFrame(_searchResult));
        } else if (selectType == QuestionnaireRegister.ROOM_TYPE_GROUPCHAT) {
            $('#showList_for_range').append(setGroupchatListFrame(_searchResult));
        }
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    _proto.getRange = function(){
        return [
            {value: QuestionnaireRegister.ROOM_TYPE_COMMUNITY, label: Resource.getMessage('questionnaire_dialog_range_community')}
            ,{value:  QuestionnaireRegister.ROOM_TYPE_GROUPCHAT, label: Resource.getMessage('questionnaire_dialog_range_group')}
            ,{value: QuestionnaireRegister.ROOM_TYPE_FEED, label: Resource.getMessage('questionnaire_dialog_range_feed')}
        ];
    };

    function onJoinedCommunityInfoListCallback(communityList) {
        var i = 0;
        var _sortCondition = new ColumnSortCondition();

        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);

        if(communityList == null) {
            return;
        }

        for (i = 0; communityList && i < communityList.getCount(); i++) {
            _allRoomList.add(communityList.get(i));
        }

        if(communityList.getCount() < QuestionnaireRegister.COUNT) {
            $('#showList_for_range').children().remove();
            $('#showList_for_range').append(setProjectListFrame(_allRoomList));
            $('#questionnaire_range_modal .scroll_content').scrollTop(0);
        } else {
            var communityId = communityList.get(communityList.getCount() -1)._id;
            CubeeController.getInstance().getJoinedCommunityInfoList(communityId, QuestionnaireRegister.COUNT, _sortCondition, onJoinedCommunityInfoListCallback);
        }
    };

    function setProjectListFrame(_communityList) {
        var projectListCount= _communityList.length;
        if(projectListCount == 0){
            $('#questionnaire_range_modal #dialog-error').text(Resource.getMessage('project_list_zero'));
            return;
        }

        var _ret = "";
        for(var i = 0; i< projectListCount; i++) {
            var _roomInfo = _communityList[i];
            _avaterDate = _roomInfo.getLogoUrl();
            projectname = _roomInfo.getRoomName();

            _ret += '<li class="cf"><label><span class="ico ico_project">';

            if (_avaterDate == null || _avaterDate == '') {
                var result = Utils.avatarCreate({name:projectname ,type:DialogProjectListView.AvaterType });
                _ret += '<div class="no_img" style="background-color:' + result.color + '"><div class="no_img_inner">' + result.name + '</div></div></span>';
            } else {
                _ret += '<img src="' + _avaterDate + '" alt=""></span>';
            }

            var selectValue = _roomInfo.getRoomId() + ',' + QuestionnaireRegister.ROOM_TYPE_COMMUNITY;
            _ret += '<div class="name">' + Utils.convertEscapedHtml(projectname,false) + '</span>';
            _ret += '<label class="radio"><input type="radio" name="column-info" value="'+ selectValue +'" id="range-member"><span></span></label>';
            _ret += '</label></li>'
        }
        return _ret;
    }

    function getDilogCommunityInfoList(_self) {
        _range = new ArrayList();
        _defalutSelectValue = _self._optionItem.val();
        _allRoomList = [];
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);
        CubeeController.getInstance().getJoinedCommunityInfoList(0, QuestionnaireRegister.COUNT, _sortCondition, onJoinedCommunityInfoListCallback);
    }

    function onGetGroupInfoListHistoryCallback(groupchatList) {
        var i = 0;
        var _sortCondition = new ColumnSortCondition();

        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);

        if(groupchatList == null) {
            return;
        }

        for (i = 0; i < groupchatList.getCount(); i++) {
            _allRoomList.add(groupchatList.get(i));
        }

        if(groupchatList.getCount() < QuestionnaireRegister.COUNT) {
            $('#showList_for_range').children().remove();
            $('#showList_for_range').append(setGroupchatListFrame(_allRoomList));
            $('#questionnaire_range_modal .scroll_content').scrollTop(0);
        } else {
            var groupId = groupchatList.get(groupchatList.getCount() - 1)._id;
            var communityList = new ArrayList();
            communityList.add(new CommunityInfo());
            CubeeController.getInstance().getRoomInfoList(groupId, QuestionnaireRegister.COUNT, communityList,_sortCondition, onGetGroupInfoListHistoryCallback);
        }
    }

    function setGroupchatListFrame(_groupchatList) {
        var groupchatListCount= _groupchatList.length;
        if(groupchatListCount == 0){
            $('#questionnaire_range_modal #dialog-error').text(Resource.getMessage('dialog_error_no_groupchat'));
            return;
        }

        var _ret = "";
        for(var i = 0; i< groupchatListCount; i++) {
            var _roomInfo = _groupchatList[i];

            var roomName = Utils.convertEscapedHtml(_roomInfo.getRoomName())
            var avatarInfo = Utils.avatarCreate({type: 'group', name: _roomInfo.getRoomName()})
            var selectValue = _roomInfo.getRoomId() + ',' + QuestionnaireRegister.ROOM_TYPE_GROUPCHAT;

            _ret += '<li>'
            _ret += '<label>'
            _ret += '  <span class="ico ico_group">'
            _ret += '    <div class="no_img" style="background-color:' + avatarInfo.color + '">';
            _ret += '      <div class="no_img_inner">' + avatarInfo.name + '</div>';
            _ret += '    </div></span>';
            _ret += '  <div class="name">' + roomName + '</span>';
            _ret += '<label class="radio"><input type="radio" name="column-info" value="'+ selectValue +'" id="range-member"><span></span></label>';
            _ret += '</label>'
            _ret += '</li>';
        }
        return _ret;
    }

    function getDilogRoomInfoList(_self) {
        _range = new ArrayList();
        _defalutSelectValue = _self._optionItem.val();
        _allRoomList = [];
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getItems().removeAll();
        _sortCondition.getItems().add("updated_at");
        _sortCondition.getOrders().removeAll();
        _sortCondition.getOrders().add(ColumnSortCondition.SORT_ORDER_DESC);
        var communityList = new ArrayList();
        communityList.add(new CommunityInfo());
        CubeeController.getInstance().getRoomInfoList(0, QuestionnaireRegister.COUNT, communityList, _sortCondition, onGetGroupInfoListHistoryCallback);
    }

    _proto.getInnerHtml = function() {
        var _self = this;
        var _form = "";

        var ranges = _self.getRange();

        _form = '\
            <div id="questionnaire_range_modal" class="card modal_card">\
                <div class="card_title">\
                    <p>' + _self._title + '</p>\
                </div>\
                <div class="modal_content_wrapper">\
                    <div class="modal_content">\
                        <div class="dialog-questionnaire-label">' + Resource.getMessage('questionnaire_range_title') + '</div>\
                        <select class="dialog-questionnaire-select-type" id = "range-type">';

        for (i=0; i<ranges.length; i++) {
            var range = ranges[i];
            _form += '          <option value="' + range.value + '">' + range.label + '</option>';
        }

        _form += '\
                        </select>\
                    </div>';
        _form += '  <div class="select_menu">\
                        <form action="#" method="get" class="search_form">\
                            <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_search_room_name')+'">\
                            <button type="button" name="search" class="title_search_btn ico_btn"><i class="fa fa-search"></i></button>\
                        </form>\
                    </div>';
        _form += '  <div class="list_wrapper scroll_content" id="quote_dest_list">\
                        <ul class="modal_list select_list" id="showList_for_range">\
                        </ul>\
                    </div>';
        _form += '  <div class="btn_wrapper">\
                        <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
                        <button id="password_button" type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('config_submit_buttom') + '</span></button>\
                    </div>\
                </div>\
                <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
            </div>\
        ';
        return _form;
    };

    function creatRangeSelectMemberName(_self, selectValue) {
        var _rootElement = _self._dialogInnerElement;
        _self._dialogInnerElement.find('#dialog-error').text('');
        if(selectValue == QuestionnaireRegister.ROOM_TYPE_FEED) {
            $("#showList_for_range").children().remove();
            $('#questionnaire_range_modal .select_menu').hide();
            $('#showList_for_range').hide();

        } else if(selectValue == QuestionnaireRegister.ROOM_TYPE_COMMUNITY) {
            $('#questionnaire_range_modal .select_menu').show();
            $('#showList_for_range').show();
            getDilogCommunityInfoList(_self);
        } else if(selectValue == QuestionnaireRegister.ROOM_TYPE_GROUPCHAT){
            $('#questionnaire_range_modal .select_menu').show();
            $('#showList_for_range').show();
            getDilogRoomInfoList(_self);
        }
    }
    _proto.submit = function() {
        var _self = this;
        _self._getSelectedRangeOption();
    };

    _proto._getSelectedRangeOption = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        _self._dialogInnerElement.find('#dialog-error').text('');
        var selectElem = _rootElement.find('input[name="column-info"]').filter(':checked');
        var selectRoomType = parseInt(_rootElement.find('#range-type').val());
        if (!selectElem.length && selectRoomType != 1) {
            _self._dialogInnerElement.find('#dialog-error').text(Resource.getMessage('questionnaire_dialog_error_no_select_range'));
            return false;
        }

        var selectText = Utils.convertEscapedHtml(selectElem.closest('div.name').text());
        var selectValue = selectElem.val();

        $("select#rangeId").empty();
        if(selectText.length != 0 && selectValue != null) {
            optionItem = "<option value=" + selectValue + ">" + selectText + "</option>"
            $("select#rangeId").prepend(optionItem);
        } else {
            optionItem = "<option value=" + "0,1" + ">" + Resource.getMessage('questionnaire_range_value')+ "</option>";
            $("select#rangeId").prepend(optionItem);
        }

        $("select#range-type").die();
        _rootElement.dialog("close");
        ViewUtils.modal_allexit();

        return true;
    };
})();
