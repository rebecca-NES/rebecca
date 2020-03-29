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
function DialogFolloweeListView(_jid) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._jid = _jid;
    DialogOkCancelView.call(this);
};(function() {
    DialogFolloweeListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogFolloweeListView.prototype;

    _proto._init = function() {
        var _self = this;

        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _myJid = LoginUser.getInstance().getJid();
        var _ownJid = _self._jid;

        if(_myJid == _ownJid) {
            var _followeeList = LoginUser.getInstance().getFolloweeList();
            var _followeeAllList = _followeeList.getCount();
            var followeeUser = [];
            for(var i = 0 ; i < _followeeAllList ; i++){
                if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')){
                    followeeUser.push(_followeeList.get(i));
                }
            }
            _self._followeeList = _followeeList;
            _self._createColumnNameElement(followeeUser, _followeeAllList);

            _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
                suppressScrollX: true
            });
            dlg_scr.push(_self.ps);

            _self._createEventHandler();

            _self._dialogInnerElement.find('.scroll_content').on('ps-y-reach-end', function(){
                var followeeUser = [];
                for(var i = _self._dialogInnerElement.find('ul.modal_list.select_list li').length;
                    i < _followeeAllList ; i++){
                    if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')
                    + _self._dialogInnerElement.find('ul.modal_list.select_list li').length){
                        followeeUser.push(_followeeList.get(i));
                    }
                }
                _self._createColumnNameElement(followeeUser, _followeeAllList, true);
            });
            _self._dialogInnerElement.on('click', ".modal_exit", function() {
                _super.cleanup.call(_self);
            });
        } else {
            CubeeController.getInstance().getFolloweeList(_ownJid)
            .then(function(result) {
                var _followeeList = result;
                var _followeeAllList = _followeeList.getCount();
                var followeeUser = [];
                for(var i = 0 ; i < _followeeAllList ; i++){
                    if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')){
                        followeeUser.push(_followeeList.get(i));
                    }
                }
                _self._followeeList = _followeeList;
                _self._createColumnNameElement(followeeUser, _followeeAllList);

                _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
                    suppressScrollX: true
                });
                dlg_scr.push(_self.ps);

                _self._createEventHandler();

                _self._dialogInnerElement.find('.scroll_content').on('ps-y-reach-end', function(){
                    var followeeUser = [];
                    for(var i = _self._dialogInnerElement.find('ul.modal_list.select_list li').length;
                        i < _followeeAllList ; i++){
                        if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')
                        + _self._dialogInnerElement.find('ul.modal_list.select_list li').length){
                            followeeUser.push(_followeeList.get(i));
                        }
                    }
                    _self._createColumnNameElement(followeeUser, _followeeAllList, true);
                });
                _self._dialogInnerElement.on('click', ".modal_exit", function() {
                    _super.cleanup.call(_self);
                });
            });
        }
    };

    _proto.getInnerHtml = function(){
        const ret = '<div class="followeelist-modal card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('dialog_title_followee')+' </p>\
          </div>\
          <div class="select_menu">\
            <form action="." method="get" class="search_form title_search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_label_followee_search')+'">\
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
            _self.filterColumnName();
        });
        _self._dialogInnerElement.find('input.field').keypress(function(e) {
            if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
              _self.filterColumnName();
           }
           return e.which !== 13;
        });
    }

    _proto._createColumnNameElement = function(columnNameList, followeeAlllist, isNotZeroResult) {
        var _self = this;
        var _errorElement = _self._dialogAreaElement.find("#dialog-error");
        _errorElement.text("");
        if (followeeAlllist == 0){
            _errorElement.text(Resource.getMessage('dialog_followee_list_nothing'));
            return;
        }
        if (columnNameList.length == 0 && !isNotZeroResult) {
            _self._dialogAreaElement.find("#dialog-error")
                 .text(Resource.getMessage('dialog_followee_list_search_nothing'));
            return;
        }
        for (var i=0; i<columnNameList.length; i++) {
            if(columnNameList[i].getUserName() != null ||
               columnNameList[i].getUserName().length > 0) {
                var userIconElm = ViewUtils.getAvatarDataHtmlFromPerson(columnNameList[i]);
                var presenceClass = " status "
                                  + ViewUtils.getPresenceColorCss(columnNameList[i].getPresence());
                var groupNames = (columnNameList[i].getGroup().length > 0) ?
                                 columnNameList[i].getGroup().join(" ") :
                                 Resource.getMessage('group_title_no_group');
                var _myJid = LoginUser.getInstance().getJid();
                var _ownJid = _self._jid;
                var isOwnerAttr = "";
                if(_myJid == _ownJid) {
                    if(columnNameList[i]._jid == _myJid) {
                        isOwnerAttr = '<span>'
                                    + '<button type="button" class="follow-dialog-btn">'
                                    + Resource.getMessage('add_followee_text')
                                    + '</button>'
                                    + '</span>';
                    } else {
                        isOwnerAttr = '<span>'
                                    + '<button type="button" class="unfollow-dialog-btn">'
                                    + Resource.getMessage('del_followee_text')
                                    + '</button>'
                                    + '</span>';
                    }
                }
                var columnNameElement = '\
                <li>\
                    <a jid="' + columnNameList[i].getJid() + '" class="follow-dialog-user" title="'+ columnNameList[i].getUserName() + ' '
                                + Utils.convertEscapedHtml(groupNames)  + '">\
                        <span class="ico ico_user ' + presenceClass + '">' + userIconElm + '</span>\
                        <span class="name">'+Utils.convertEscapedHtml(columnNameList[i].getUserName())+'</span>\
                        <span class="group">'+Utils.convertEscapedHtml(groupNames)+'</span>\
                    </a>\
                    ' + isOwnerAttr + ' \
                </li>';
                var query = $(columnNameElement);
                this._dialogInnerElement.find('.select_list').append(query);
                $('#modal_area div.followeelist-modal ul > li > a').click((event)=>{
                    var jid = $(event.target).closest("a.follow-dialog-user").attr("jid");
                    var _columnInformation = new ColumnInformation();
                    _columnInformation.setColumnType(ColumnInformation.TYPE_COLUMN_CHAT);
                    _columnInformation.setFilterCondition(jid);
                    ColumnManager.getInstance().addMurmurColumn(jid,true,false,false);
                    ViewUtils.unsetNewNoticeMark($(event.currentTarget));
                    NotificationIconManager.getInstance().onColumnClicked(_columnInformation);
                    ViewUtils.modal_allexit();
                });

                var _jid = columnNameList[i].getJid();
                var _change = 'follow';
                if (query.find('button').hasClass('follow-dialog-btn')){
                    _change = 'follow';
                } else {
                    _change = 'unfollow';
                }
                addBtnEvent(query.find('button'), _change, _jid);
                function addBtnEvent(_btnObj, _change, _jid) {
                    var _user = _jid;
                    if(_change == 'follow') {
                        _btnObj.on('click', function() {
                            CubeeController.getInstance().addUserFollow(_user)
                            .then(function(){
                                _btnObj.off('click');
                                _btnObj.addClass('unfollow-dialog-btn change');
                                _btnObj.removeClass('follow-dialog-btn');
                                _btnObj.text(Resource.getMessage('del_followee_text'));
                                addBtnEvent(_btnObj, 'unfollow', _user);
                            }).catch(function(err){
                            })
                        })
                    }
                    if(_change == 'unfollow') {
                        _btnObj.on('click', function() {
                            CubeeController.getInstance().delUserFollow(_user)
                            .then(function(){
                                _btnObj.off('click');
                                _btnObj.addClass('follow-dialog-btn change');
                                _btnObj.removeClass('unfollow-dialog-btn');
                                _btnObj.text(Resource.getMessage('add_followee_text'));
                                addBtnEvent(_btnObj, 'follow', _user);
                            }).catch(function(err){
                            })
                        })
                    }
                };
            }
        }
    }

    _proto.filterColumnName = function(){
        var _self = this;
        var _followeeList = _self._followeeList;
        _self._dialogInnerElement.find('.select_list').empty();

        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _followeeAllList = _followeeList.getCount();
        var followeeUser = [];
        for(var i = 0 ; i < _followeeAllList ; i++){
            var followee = _followeeList.get(i);
            if(followee.getUserName().indexOf(_inputKeyword) >= 0 ||
                followee.getGroup().indexOf(_inputKeyword) >= 0 ||
                followee.getUserName().indexOf(_inputKeyword) >= 0){
                    followeeUser.push(followee);
            }
        }
        _self._createColumnNameElement(followeeUser, _followeeAllList);
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    $(function() {
        var showFolloweeList = $('#left_sidebar').find('.followee_list .all_list_btn a');
        showFolloweeList.on('click', function(){
            var dialog = new DialogFolloweeListView();
            dialog.showDialog();
        });
    });
})();