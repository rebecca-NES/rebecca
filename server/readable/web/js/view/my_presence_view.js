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

function MyPresenceView(){
}
(function() {
    var presence_type = $('#presence_type');
    var myMemo_input = $('#myMemo > input');
    var _myPresenceView = new MyPresenceView();

    MyPresenceView.getInstance = function() {
        return _myPresenceView;
    };

    var _proto = MyPresenceView.prototype;

    _proto.notifyDisconnect = function() {
        if(!LoginView.getInstance().getLoginCompleted()) {
            return;
        }
    };
    _proto.updateChangePresence = function(presence, myMemo) {
        if(presence == null || typeof presence != 'number') {
            return;
        }
        if(myMemo == null || typeof myMemo != 'string') {
            return;
        }
        $('#loginAvatar span.ico.ico_user').removeClass('status online offline leave busy out');
        $('#loginAvatar span.ico.ico_user').addClass("status " + ViewUtils.getPresenceColorCss(presence));
    };
})();
