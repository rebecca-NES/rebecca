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
function DialogFollowerListView(_jid) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._jid = _jid;
    DialogOkCancelView.call(this);
};(function() {
    DialogFollowerListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogFollowerListView.prototype;
    _proto._init = function() {
        var _self = this;

        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _myJid = LoginUser.getInstance().getJid();
        var _ownJid = _self._jid;

        if(_myJid == _ownJid) {
            var _followerList = LoginUser.getInstance().getFollowerList();
            var _followerAllList = _followerList.getCount();
            var followerUser = [];
            for(var i = 0 ; i < _followerAllList ; i++){
                if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')){
                    followerUser.push(_followerList.get(i));
                }
            }
            _self._followerList = _followerList;
            _self._createColumnNameElement(followerUser, _followerAllList);

            _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
                suppressScrollX: true
            });
            dlg_scr.push(_self.ps);

            _self._createEventHandler();

            _self._dialogInnerElement.find('.scroll_content').on('ps-y-reach-end', function(){
                var followerUser = [];
                for(var i = _self._dialogInnerElement.find('ul.modal_list.select_list li').length;
                    i < _followerAllList ; i++){
                    if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')
                    + _self._dialogInnerElement.find('ul.modal_list.select_list li').length){
                        followerUser.push(_followerList.get(i));
                    }
                }
                _self._createColumnNameElement(followerUser, _followerAllList, true);
            });
            _self._dialogInnerElement.on('click', ".modal_exit", function() {
                _super.cleanup.call(_self);
            });
        } else {
            CubeeController.getInstance().getFollowerList(_ownJid)
            .then(function(result) {
                var _followerList = result;
                var _followerAllList = _followerList.getCount();
                var followerUser = [];
                for(var i = 0 ; i < _followerAllList ; i++){
                    if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')){
                        followerUser.push(_followerList.get(i));
                    }
                }
                _self._followerList = _followerList;
                _self._createColumnNameElement(followerUser, _followerAllList);

                _self.ps = new PerfectScrollbar(_self._dialogInnerElement.find('.scroll_content')[0], {
                    suppressScrollX: true
                });
                dlg_scr.push(_self.ps);

                _self._createEventHandler();

                _self._dialogInnerElement.find('.scroll_content').on('ps-y-reach-end', function(){
                    var followerUser = [];
                    for(var i = _self._dialogInnerElement.find('ul.modal_list.select_list li').length;
                        i < _followerAllList ; i++){
                        if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')
                        + _self._dialogInnerElement.find('ul.modal_list.select_list li').length){
                            followerUser.push(_followerList.get(i));
                        }
                    }
                    _self._createColumnNameElement(followerUser, _followerAllList, true);
                });
                _self._dialogInnerElement.on('click', ".modal_exit", function() {
                    _super.cleanup.call(_self);
                });
            });
        }
    };

    _proto.getInnerHtml = function(){
        const ret = '<div class="followerlist-modal card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('dialog_title_follower')+' </p>\
          </div>\
          <div class="select_menu">\
            <form action="." method="get" class="search_form title_search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_label_follower_search')+'">\
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
    _proto._createColumnNameElement = function(columnNameList, followerAlllist, isNotZeroResult) {
        var _self = this;
        var _errorElement = _self._dialogAreaElement.find("#dialog-error");
        _errorElement.text("");
        if (followerAlllist == 0){
            _errorElement.text(Resource.getMessage('dialog_follower_list_nothing'));
            return;
        }
        if (columnNameList.length == 0 && !isNotZeroResult) {
            _self._dialogAreaElement.find("#dialog-error")
                 .text(Resource.getMessage('dialog_follower_list_search_nothing'));
            return;
        }
        for (var i=0; i<columnNameList.length; i++) {
            if(columnNameList[i].getUserName() != null &&
               columnNameList[i].getUserName().length > 0){
                var userIconElm = ViewUtils.getAvatarDataHtmlFromPerson(columnNameList[i]);
                var presenceClass = " status "
                                  + ViewUtils.getPresenceColorCss(columnNameList[i].getPresence());
                var groupNames = (columnNameList[i].getGroup().length > 0) ?
                                 columnNameList[i].getGroup().join(" ") :
                                 Resource.getMessage('group_title_no_group');
                var columnNameElement = '\
                <li jid="' + columnNameList[i].getJid() + '">\
                    <a title="'+ columnNameList[i].getUserName() + ' '
                                 + Utils.convertEscapedHtml(groupNames)  + '">\
                        <span class="ico ico_user ' + presenceClass + '">' + userIconElm + '</span>\
                        <span class="name">'+Utils.convertEscapedHtml(columnNameList[i].getUserName())+'</span>\
                        <span class="group">'+Utils.convertEscapedHtml(groupNames)+'</span>\
                    </a>\
                </li>';
                var query = $(columnNameElement);
                this._dialogInnerElement.find('.select_list').append(query);
                query.on('click', function(event){
                    var _selectedJid = $(event.currentTarget).attr('jid');
                    var _columnInformation = new ColumnInformation();
                    _columnInformation.setColumnType(ColumnInformation.TYPE_COLUMN_CHAT);
                    _columnInformation.setFilterCondition(_selectedJid);
                    ColumnManager.getInstance().addMurmurColumn(_selectedJid,true,false,false);
                    ViewUtils.unsetNewNoticeMark($(event.currentTarget));
                    NotificationIconManager.getInstance().onColumnClicked(_columnInformation);
                    ViewUtils.modal_allexit();
                });

            }
        }
    }

    _proto.filterColumnName = function(){
        var _self = this;
        var _followerList = _self._followerList;
        _self._dialogInnerElement.find('.select_list').empty();

        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _followerAllList = _followerList.getCount();
        var followerUser = [];
        for(var i = 0 ; i < _followerAllList ; i++){
            var follower = _followerList.get(i);
            if(follower.getUserName().indexOf(_inputKeyword) >= 0 ||
                follower.getGroup().indexOf(_inputKeyword) >= 0 ||
                follower.getUserName().indexOf(_inputKeyword) >= 0){
                followerUser.push(follower);
            }
        }
        _self._createColumnNameElement(followerUser, _followerAllList);
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    $(function() {
        var showFollowerList = $('#left_sidebar').find('.follower_list .all_list_btn a');
        showFollowerList.on('click', function(){
            var dialog = new DialogfollowerListView();
            dialog.showDialog();
        });
    });
})();