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
function DialogChatListView() {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    DialogOkCancelView.call(this);
};(function() {
    DialogChatListView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogChatListView.prototype;
    _proto._init = function() {
        var _self = this;

        _self.frame = _self.getInnerHtml();

        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _contactList = ContactList.getInstance();
        let _countAlllist = _contactList.getCount();
        let personList = [];
        for(let i=0;i<_contactList.getCount();i++){
            if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')){
                personList.push(_contactList.get(i));
            }
        }
        _self._createColumnNameElement(personList, _countAlllist);

        _self.ps = new PerfectScrollbar(_self.frame.find('.scroll_content')[0], {
            suppressScrollX: true
        });
        dlg_scr.push(_self.ps);

        _self._createEventHandler();

        _self._dialogInnerElement.find('.scroll_content').on('ps-y-reach-end', function(){
            let personList = [];
            for(let i = _self._dialogInnerElement.find('ul.modal_list.select_list li').length;
                i <_contactList.getCount(); i++){
                if(i < Conf.getVal('NUMBER_OF_ITEMS_BY_PER_REQUEST')
                   + _self._dialogInnerElement.find('ul.modal_list.select_list li').length){
                    personList.push(_contactList.get(i));
                }
            }
            _self._createColumnNameElement(personList, _countAlllist, true);
        })
        _self._dialogInnerElement.on('click', ".modal_exit", function() {
            _super.cleanup.call(_self);
        })
    };

    _proto.getInnerHtml = function(){
        const ret = '<div id="chatlist_modal" class="card modal_card">\
          <div class="card_title">\
            <p> '+Resource.getMessage('dialog_title_chatlist')+' </p>\
          </div>\
          <div class="select_menu">\
            <form action="#" method="get" class="search_form title_search_form">\
              <input type="text" name="q" class="field" placeholder="'+Resource.getMessage('dialog_label_chatlist_search')+'">\
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
    _proto._createColumnNameElement = function(columnNameList, countAlllist, isNotZeroResult) {
        var _self = this;
        var _errorElement = _self._dialogAreaElement.find("#dialog-error");
        _errorElement.text("");
        if (countAlllist == 0){
            _errorElement.text(Resource.getMessage('dialog_chatlist_nothing'));
            return;
        }
        if (columnNameList.length == 0 && !isNotZeroResult) {
            _self._dialogAreaElement.find("#dialog-error")
                 .text(Resource.getMessage('dialog_chatlist_search_nothing'));
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
                    ColumnManager.getInstance().addColumn(_columnInformation, true, true);
                    ViewUtils.unsetNewNoticeMark($(event.currentTarget));
                    NotificationIconManager.getInstance().onColumnClicked(_columnInformation);
                    ViewUtils.modal_allexit();
                });

            }
        }
    }

    _proto.filterColumnName = function(){
        var _self = this;
        _self._dialogInnerElement.find('.select_list').empty();

        var _inputKeyword = _self._dialogInnerElement.find('input.field').val();
        var _contactList = ContactList.getInstance();
        let _countAlllist = _contactList.getCount();
        let personList = [];
        for(let i=0;i<_contactList.getCount();i++){
            let person = _contactList.get(i);
            if(person.getUserName().indexOf(_inputKeyword) >= 0 ||
               person.getGroup().indexOf(_inputKeyword) >= 0 ||
               person.getLoginAccount().indexOf(_inputKeyword) >= 0){
                personList.push(person);
            }
        }
        _self._createColumnNameElement(personList, _countAlllist);
        _self._dialogInnerElement.find('.scroll_content').scrollTop(0);
    };

    $(function() {
        var showChatList = $('#left_sidebar').find('.contact_list .all_list_btn a');
        showChatList.on('click', function(){
            var dialog = new DialogChatListView();
            dialog.showDialog();
        });
    });
})();
