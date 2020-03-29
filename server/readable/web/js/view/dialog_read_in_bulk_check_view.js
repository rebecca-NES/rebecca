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
function DialogReadInBulkCheckView(_columnInfo=null, _columnjq=null) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._columnInfo = _columnInfo;
    this._columnjq = _columnjq;
    DialogOkCancelView.call(this);
};(function() {
    DialogReadInBulkCheckView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogReadInBulkCheckView.prototype;
    _proto._init = function() {
        var _self = this;

        _super._init.call(_self);

        this._dialogAreaElement.html(_self.getReadInBulkMessageCheckHtml());
        this._dialogInnerElement = this._dialogAreaElement.children();

        _self._dialogInnerElement.find('#read_in_bulk_ok_btn').on('click', function() {
            let itemIdList = [];
            $(_self._columnjq)
                .find("div"
                    + " > div"
                    + " > div.message-border"
                    + " > div[itemid]")
                .each(function(index, element){
                    itemIdList.push($(element).attr("itemid"));
                });
            function readInBulkCallback(result) {
                console.log("message read done : " + result);
            };
            let falseItemIds = [];
            for(let i=0;i<itemIdList.length;i++){
                if(!CubeeServerConnector.getInstance()
                                       .sendSetReadOneMessage(itemIdList[i],readInBulkCallback)){
                    falseItemIds.push(itemIdList[i]);
                }
            }

            if(falseItemIds.length > 0){
                $("#read_in_bulk_modal > div.modal_content_wrapper > p").text(Resource.getMessage("read_in_bulk_error_message"));
            }else{
                ViewUtils.modal_allexit();
            }
        });
        _self._dialogInnerElement.find('#read_in_bulk_cancel_btn').on('click', function() {
            ViewUtils.modal_allexit();
        });
    };
    _proto.getReadInBulkMessageCheckHtml = function() {
        var _self = this;
        let displayName = _self._columnInfo.getDisplayName();
        var _displayMessage = displayName
                            + Resource.getMessage('read_in_bulk_attention_message');
        var _displayNotifyMessage = Resource.getMessage('read_in_bulk_attention_nonify_message');
        var _ret = "";
        _ret += '<div id="read_in_bulk_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>'+Resource.getMessage('dialog_confirmation_title')+'</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <p class="txt">'+_displayMessage
              + '<span style="display:block;">' + Resource.getMessage('read_in_bulk_attention_message_last_line')
              + '</span>' + '<span style="color:#f00;display:block;margin-top:10px;">'+_displayNotifyMessage+'</span></p>';
        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button type="button" id="read_in_bulk_cancel_btn" class="modal_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_cancel')+'</span></button>';
        _ret += '    <button type="button" id="read_in_bulk_ok_btn" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_ok')+'</span></button>';
        _ret += '  </div>';
        _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };
})();
