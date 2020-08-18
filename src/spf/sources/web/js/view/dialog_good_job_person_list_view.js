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

function DialogGoodJobPersonListView(messageItemId, personList) {
    this._messageItemId = messageItemId;
    DialogPersonListView.call(this, Resource.getMessage('goodjob'), personList);
};(function() {
    DialogGoodJobPersonListView.prototype = $.extend({}, DialogPersonListView.prototype);
    var _super = DialogPersonListView.prototype;
    var _proto = DialogGoodJobPersonListView.prototype;
    _proto.onNotification = function(notification) {
        var _self = this;
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_GOOD_JOB){
            return;
        }
        var _itemId = notification.getItemId();
        if(_itemId != _self._messageItemId){
            return;
        }
        var _jid = notification.getFromJid();
        var _person = new Person();
        _person.setJid(_jid);
        _person.setLoginAccount(notification.getLoginAccount());
        _person.setUserName(notification.getNickName());
        _person.setAvatarType(notification.getAvatarType());
        _person.setAvatarData(notification.getAvatarData());
        _person.setStatus(notification.getStatus());
        var _personHtml = _self._createPersonHtml(_person);
        _self._dialogInnerElement.find(".modal_list").prepend(_personHtml);
        _self.rewritDialogTitle();
    };
})();
