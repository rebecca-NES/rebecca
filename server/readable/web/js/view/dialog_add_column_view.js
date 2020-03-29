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
function DialogAddColumnView(mailCooperationSettingServerList) {
    this._mailCooperationSettingServerList = mailCooperationSettingServerList;
    this._tabDetailList = new ArrayList();
    this._tabDetailHtmlIdList = new ArrayList();
    this._width = 350;
    this._height = 350;
    DialogOkCancelView.call(this);
};(function() {
    DialogAddColumnView.NEW_TAB_DETAIL_HTML_ID = 'column-add-detail-new';
    DialogAddColumnView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogAddColumnView.prototype;
    _proto._init = function() {
        var _self = this;

        _super._init.call(_self);

        _self._tabDetailHtmlIdList.add(DialogAddColumnView.NEW_TAB_DETAIL_HTML_ID);
        delete _self._buttons[DialogOkCancelView.LABEL_CANCEL]

        _self._dialogAreaElement = $('#modal_area');
        _self._dialogAreaElement.html(_self.getColumnAddMenuHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _tabDetailListCount = _self._tabDetailList.getCount();
        for (var _i = 0; _i < _tabDetailListCount; _i++) {
            var _curTabDetail = _self._tabDetailList.get(_i);
            var _element = $('#' + _self._tabDetailHtmlIdList.get(_i));
            _curTabDetail.createEventHandler(_element);
        }
    };
    _proto.getColumnAddMenuHtml = function() {
        var _ret = '';
        var _self = this;
        _self._tabDetailList.add(new NewTabDetail(_self._mailCooperationSettingServerList));
        var _count = _self._tabDetailList.getCount();
        _ret += '<div id="addcolum_modal" class="card modal_card">';

        for (var _i = 0; _i < _count; _i++) {
            _ret += '<div id="' + _self._tabDetailHtmlIdList.get(_i) + '">' + _self._tabDetailList.get(_i).getDetailHtml() + '</div>';
        }
        _ret += '</div>';
        return $(_ret);
    };
})();

function NewTabDetail(mailCooperationSettingServerList) {
    this._mailCooperationSettingServerList = mailCooperationSettingServerList;
    this._tabName = Resource.getMessage('dialog_tab_new');
    this._currentSelectedIndex = -1;
    this._init();
};(function() {
    NewTabDetail.LIST_TITLE_MYFEED = Resource.getMessage('MyFeed');
    NewTabDetail.LIST_TITLE_RECENT = Resource.getMessage('RecentPostedMessages');
    NewTabDetail.LIST_TITLE_MENTION = Resource.getMessage('Mention');
    NewTabDetail.LIST_TITLE_TOME = Resource.getMessage('ToMe');
    NewTabDetail.LIST_TITLE_SEND = Resource.getMessage('Send');
    NewTabDetail.LIST_TITLE_FAVORITE = Resource.getMessage('Favorite');
    NewTabDetail.LIST_TITLE_HASHTAG = Resource.getMessage('Hashtag');
    NewTabDetail.LIST_TITLE_TASK = Resource.getMessage('Task');
    NewTabDetail.LIST_TITLE_GROUP =  Resource.getMessage('Group');
    NewTabDetail.LIST_TITLE_LIST = Resource.getMessage('List');
    NewTabDetail.LIST_TITLE_CHAT = Resource.getMessage('Chat');
    NewTabDetail.LIST_TITLE_INBOX = Resource.getMessage('Inbox');
    NewTabDetail.LIST_TITLE_SEARCH = Resource.getMessage('Search');
    NewTabDetail.LIST_TITLE_MAIL = Resource.getMessage('Mail');
    NewTabDetail.LIST_TITLE_MURMUR = Resource.getMessage('Murmur');

    NewTabDetail.LIST_TITLE_QUESTIONNAIRE = Resource.getMessage('Questionnaire');
    NewTabDetail.ERROR_SEARCH_CONDITION_KEYWORD = Resource.getMessage('dialogerrorSearch');
    NewTabDetail.ERROR_SEARCH_CONDITION_COLUMN = Resource.getMessage('dialogerrorSelect');

    var _proto = NewTabDetail.prototype;
    _proto._init = function() {
        var _self = this;
    };
    _proto.getTabName = function() {
        return this._tabName;
    };
    _proto.createEventHandler = function(element) {
        var _self = this;

        if (!element || typeof element != 'object') {
            return;
        }
        var taskElement = element.find('select[name="task"]');
        taskElement.on('focus', function() {
            taskElement.parent().trigger("click");
        });
        var chatInputElement = element.find('input.chat-partner');
        chatInputElement.on('focus', function() {
            chatInputElement.parent().trigger("click");
        });

        var submitBtn = element.find('button.success_btn');
        submitBtn.on('click', _self.onOK.bind(this, element, function() {
            ViewUtils.modal_allexit();
        }));
    };
    _proto.getDetailHtml = function() {
        var _self = this;

        var _ret = '<div id="addcolum_modal_inner">';
        _ret += '<div class="card_title">';
        _ret += '  <p>' + Resource.getMessage('dialog_add_column_title') + '</p>';
        _ret += '</div>';
        _ret += '<div class="list_wrapper">';
        _ret += '  <ul class="modal_list select_list">';
        _ret += '   <li><label for="radio1">\
                        <span class="name">' + NewTabDetail.LIST_TITLE_MYFEED + '</span>\
                        <label class="radio"><input type="radio" name="column-info"\
                          value="' + ColumnInformation.TYPE_COLUMN_TIMELINE + '" id="radio1"><span></span>\
                        </label>\
                    </label></li>';
        _ret += '    <li><label for="radio2">';
        _ret += '        <span class="name">' + NewTabDetail.LIST_TITLE_MURMUR + '</span>';
        _ret += '        <label class="radio"><input type="radio" name="column-info" ';
        _ret += '          value="' + ColumnInformation.TYPE_COLUMN_MURMUR + '" id="radio2"><span></span>';
        _ret += '        </label>';
        _ret += '    </label></li>';
        _ret += '    <li><label for="radio3">';
        _ret += '      <span class="name">' + NewTabDetail.LIST_TITLE_INBOX + '</span>';
        _ret += '      <label class="radio"><input type="radio" name="column-info" ';
        _ret += '        value="' + ColumnInformation.TYPE_COLUMN_INBOX + '" id="radio3"><span></span>';
        _ret += '      </label>';
        _ret += '    </label></li>';

        _ret += '    <li><label for="radio4">';
        _ret += '      <span class="name">' + NewTabDetail.LIST_TITLE_TASK  + '</span>';
        _ret += '      <select class="field" name="task" class="ui-corner-all">';
        _ret += '        <option value="">' + Resource.getMessage('MyTask')  + '</option></select> ';
        _ret += '      <label class="radio"><input type="radio" id="radio4" name="column-info"';
        _ret += '        value="' + ColumnInformation.TYPE_COLUMN_TASK + '"><span></span>';
        _ret += '      </label>';
        _ret += '    </label></li>';

        _ret += '    <li><label for="radio5">';
        _ret += '      <span class="name">' + NewTabDetail.LIST_TITLE_QUESTIONNAIRE  + '</span>';
        _ret += '      <label class="radio"><input type="radio" id="radio5" name="column-info"';
        _ret += '        value="' + ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE + '"><span></span>';
        _ret += '      </label>';
        _ret += '    </label></li>';

        _ret += '  </ul>';
        _ret += '</div>';
        _ret += '<div class="btn_wrapper">';
        _ret += '  <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">追加</span></button>';
        _ret += '</div>';
        _ret += '<a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };

    _proto._getContactListJid = function() {

    };

    _proto._getChatJid = function(rootElem, callback) {
        var _ret = false;
        var _chatInputElem = rootElem.find('input.chat-partner');
        if($(_chatInputElem).length > 0){
            _chatInputElem.removeClass('input-error');
            var _isError = false;
            var _chatAccount = Utils.trimStringMulutiByteSpace(_chatInputElem.val());
            ViewUtils.convertAccountStrToJidStrFromServer(_chatAccount, _onConvertJid);
        }
        function _onConvertJid(jid) {
            if(jid == null || jid == '') {
                _chatInputElem.addClass('input-error');
            }
            if(callback != null && typeof callback == 'function') {
                callback(jid);
            }
        }
        return _ret;
    };

    _proto.onOK = function(tabObject, callback) {
        var _self = this;
        var value = $(tabObject).find('input[name="column-info"]').filter(':checked').val();
        if(typeof value === 'undefined'){
            _onOkProcess(false);
            return;
        }else{
            value *= 1;
        }
        var cmi = ColumnManager.getInstance();
        switch(value){
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_TOME:
                _onOkProcess(cmi.addColumnInfo(value,true));
                break;
            case ColumnInformation.TYPE_COLUMN_INBOX:
                _onOkProcess(cmi.addInboxColumn(true));
                break;
            case ColumnInformation.TYPE_COLUMN_TASK:
                var taskGroup = $(tabObject).find('#column-info-task').siblings('ul.column-add-new').find('select[name="task"]').val();
                _onOkProcess(cmi.addTaskColumn(taskGroup, true));
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                function _onGetChatJid(jid) {
                    var _ret = false;
                    if (jid != null && jid != '') {
                        cmi.addChatColumn(jid, true);
                        _ret = true;
                    }
                    _onOkProcess(_ret);
                }
                _self._getChatJid(tabObject, _onGetChatJid);
                break;
            case ColumnInformation.TYPE_COLUMN_MAIL:
                _onOkProcess(cmi.addMailColumn(true));
                break;
            case ColumnInformation.TYPE_COLUMN_RECENT:
                _onOkProcess(cmi.addRecentColumn(true));
                break;
            case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE:
                _onOkProcess(cmi.addQuestionnaireColumn(true));
                break;
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                _onOkProcess(cmi.addMurmurColumn(LoginUser.getInstance().getJid(),true));
                break;
            default:
                _onOkProcess(false);
                break;
        }
        var _columnInformation = new ColumnInformation();
        _columnInformation.setColumnType(value);
        NotificationIconManager.getInstance().onColumnClicked(_columnInformation);
        function _onOkProcess(returnData) {
            if(callback && typeof callback == 'function') {
                setTimeout(function(){
                    callback(returnData);
                }, 1);
            }
        }
    };


})();
