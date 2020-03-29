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
function DialogSearchOptionView() {

    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    DialogOkCancelView.call(this);

};(function() {

    DialogSearchOptionView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogSearchOptionView.prototype;

    _proto._init = function() {
        var _self = this;

        _self.frame = _self.getHtml();

        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var options = ContextSearchView.getInstance().getOptions();
        _self.selectedOptions = [];
        for (var i = 0; i < options.getCount(); i++){
            _self.selectedOptions.push(options.get(i));
        }

        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="1"]').prop('checked', -1 != _self.selectedOptions.indexOf(1));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="9"]').prop('checked', -1 != _self.selectedOptions.indexOf(9));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="6"]').prop('checked', -1 != _self.selectedOptions.indexOf(6));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="12"]').prop('checked', -1 != _self.selectedOptions.indexOf(12));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="13"]').prop('checked', -1 != _self.selectedOptions.indexOf(13));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="3"]').prop('checked', -1 != _self.selectedOptions.indexOf(3));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="4"]').prop('checked', -1 != _self.selectedOptions.indexOf(4));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="10"]').prop('checked', -1 != _self.selectedOptions.indexOf(10));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="17"]').prop('checked', -1 != _self.selectedOptions.indexOf(17));
        _self._dialogInnerElement.find('input[name=search-column-checkbox][value="18"]').prop('checked', -1 != _self.selectedOptions.indexOf(18));

        _self._dialogInnerElement.find('.success_btn').on('click', function(){
            let obj = _self._dialogInnerElement.find('input[name=search-column-checkbox]:checked');
            let objVals = [];
            for( var i = 0; i < obj.length; i++){
                objVals.push(parseInt(obj[i].value));
            }

            if(objVals.length === 0){
                _self._dialogInnerElement.find("#dialog-error").text(Resource.getMessage('dialogerrorSelect'));
                return;
            }
            ContextSearchView.getInstance().setOptions(objVals);
            ViewUtils.modal_allexit();
            _self._dialogInnerElement = null;
        });

        _self._dialogInnerElement.find('input[name=allcheck]').on('change', function() {
            _self._dialogInnerElement.find('input[name=search-column-checkbox]').prop('checked', this.checked);
        });
    };

    _proto.getHtml = function(){
        const ret = '<div id="searchmenu_modal" class="card modal_card">\
            <div class="card_title">\
                <p>' + Resource.getMessage('search_option_title') + '</p>\
            </div>\
            <div class="select_menu cf">\
                <label class="modal_btn all_check">' + Resource.getMessage('wizard_chatlist_allcheck') + '<label class="checkbox"><input type="checkbox" name="allcheck"><span></span></label></label>\
            </div>\
            <div class="list_wrapper">\
                <ul class="modal_list select_list cf">\
                    <li><label> <span class="name">' + Resource.getMessage('MyFeed') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-myfeed" value="'+
                        ColumnInformation.TYPE_COLUMN_TIMELINE +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li><label> <span class="name">' + Resource.getMessage('GroupChat') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-groupchat" value="'+
                        ColumnInformation.TYPE_COLUMN_GROUP_CHAT +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li><label> <span class="name">' + Resource.getMessage('Inbox') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-inbox" value="'+
                        ColumnInformation.TYPE_COLUMN_INBOX +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li><label> <span class="name">' + Resource.getMessage('CommunityFeed') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-community-feed" value="'+
                        ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li><label> <span class="name">' + Resource.getMessage('ContextSearchCommunityTask') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-community-task" value="'+
                        ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li><label> <span class="name">' + Resource.getMessage('Chat') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-chat" value="'+
                        ColumnInformation.TYPE_COLUMN_CHAT +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li><label> <span class="name">' + Resource.getMessage('MyTask') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-task" value="'+
                        ColumnInformation.TYPE_COLUMN_TASK +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li><label> <span class="name">' + Resource.getMessage('Questionnaire') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-questionnaire" value="'+
                        ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li><label> <span class="name">' + Resource.getMessage('Murmur') + '</span> <label class="checkbox"><input type="checkbox" id="column-info-search-murmur" value="'+
                        ColumnInformation.TYPE_COLUMN_MURMUR +'" name="search-column-checkbox"><span></span></label> </label></li>\
                    <li></li>\
                </ul>\
            </div>\
            <div class="btn_wrapper">\
                <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
                <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">OK</span></button>\
            </div>\
            <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    }

})();
