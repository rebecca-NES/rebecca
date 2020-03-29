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
function DialogExistingPersonListView(messageItemId, personList) {
    this._messageItemId = messageItemId;
    DialogPersonListView.call(this, Resource.getMessage('existing_reader_dialog_title'), personList);
};(function() {
    DialogExistingPersonListView.prototype = $.extend({}, DialogPersonListView.prototype);
    var _super = DialogPersonListView.prototype;
    var _proto = DialogExistingPersonListView.prototype;
    _proto.onNotification = function(notification) {
        var _self = this;
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_MESSAGE_OPTION){
            return;
        }
        var _contentType = notification.getContentType();
        if (_contentType != MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE) {
            return;
        }
        var _itemId = notification.getItemId();
        if(_itemId != _self._messageItemId){
            return;
        }
        var _existingReaderItem = notification.getExistingReaderItem();
        var _person = _existingReaderItem.getPerson();
        var _personHtml = _self._createPersonHtml(_person);
        if(_self._dialogInnerElement){
            _self._dialogInnerElement.find(".modal_list").prepend(_personHtml);
        }
        _self.rewritDialogTitle();
    };
})();
