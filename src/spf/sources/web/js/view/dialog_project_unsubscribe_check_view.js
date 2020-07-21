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

function DialogProjectUnsubscribeCheckView(_roomId) {
    _self = this;
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    _self._roomId = _roomId;
    DialogOkCancelView.call(_self);
};(function() {
    DialogProjectUnsubscribeCheckView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogProjectUnsubscribeCheckView.prototype;
    _proto._init = function() {
        var _self = this;
        _self.submitFalse = false;

        _self.member = new ArrayList();
        _self.member.add(LoginUser.getInstance().getJid());

        _self.frame = _self.getHtml();

        _self._dialogAreaElement.html(_self.frame);
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        _self._dialogInnerElement.find('.success_btn').on('click', function(){
            _self.request();
        });

        _self._dialogInnerElement.find('.cancel_btn').on('click', function(){
            ViewUtils.modal_allexit();
        });

    };

    _proto.getHtml = function(){
        const ret = '<div id="groupleave_modal" class="card modal_card">\
            <div class="card_title">\
                <p>' + Resource.getMessage('dialog_confirmation_title') + '</p>\
            </div>\
            <div class="modal_content_wrapper">\
                <p class="txt">' + Resource.getMessage('dialog_label_project_remove_member') + '</p>\
            </div>\
            <div class="btn_wrapper">\
                <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>\
                <button type="button" class="modal_btn cancel_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_cancel_title') + '</span></button>\
                <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_label_ok') + '</span></button>\
            </div>\
            <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>\
        </div>';
        return $(ret);
    };

    _proto.request = function (){
        function _onRemoveMemberCallback(result) {
            if(result.hasOwnProperty('content')){
                if(result.content.mess &&
                   result.content.mess == 'NOT_FOUND_OTHER_MANAGER'){
                    errOnDialog(Resource.getMessage('leave_last_manager_member_err'));
                }else{
                    errOnDialog(Resource.getMessage('leave_member_err'));
                }
                _self.submitFalse = true;
                return;
            }else{
                const _jid = LoginUser.getInstance().getJid();
                const _host = location.hostname;
                const _colmunListId = TabColumnStateStore.COLUMN_LIST_KEY + '_' + _host
                                    + '_' + _jid;
                const clistStr = TabColumnStateStore.getInstance()._getItem(_colmunListId)
                const clist = JSON.parse(clistStr);
                for(let i=0;i<clist.length;i++){
                    if(clist[i].communityId != null &&
                       clist[i].communityId == _self._roomId){
                        delete clist[i]
                        TabColumnStateStore.getInstance()._localStorage.removeItem(
                            _self._roomId+'_'+_colmunListId)
                    }
                }
                TabColumnStateStore.getInstance()
                       ._setItem(_colmunListId,JSON.stringify(clist))

                $('ul.#project > li > a[data_value='+_self._roomId+']').parent().remove()
                $('ul.#project').parent().css("height","auto")
                ViewUtils.modal_allexit();
                TabManager.getInstance().activeMyWorkplaceTab(()=>{});
            }
        }
        var _only_me = [LoginUser.getInstance().getLoginAccount()];
        if(_self.submitFalse){
            ViewUtils.modal_allexit();
            return;
        }
        _self._dialogInnerElement.find("#dialog-error").text("");
        loadingIconOnDialog();
        CubeeController.getInstance().removePublicCommunityMember(_self._roomId, _onRemoveMemberCallback);
        function errOnDialog(errMessage){
            var _rootElement = _self._dialogInnerElement;
            var _errElement = _rootElement.find("#dialog-error");
            _errElement.text(errMessage);
            _rootElement.find("button").attr("disabled", false);
            _rootElement.find('.modal_exit').attr("disabled", false);
        }
        function loadingIconOnDialog(){
            var _rootElement = _self._dialogInnerElement;
            _rootElement.find("button").eq(0).attr("disabled", true);
            _rootElement.find('.modal_exit').eq(0).attr("disabled", true);
            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
            ViewUtils.showLoadingTopInChild($('#dialog-error'));
        }
    };
})();
