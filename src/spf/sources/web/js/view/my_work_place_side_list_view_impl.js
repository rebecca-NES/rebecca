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

function MyWorkPlaceSideListViewImpl() {
    BaseSideListViewImpl.call(this);
};
(function() {

    MyWorkPlaceSideListViewImpl.prototype = $.extend({}, BaseSideListViewImpl.prototype);
    var _super = BaseSideListViewImpl.prototype;

    var _proto = MyWorkPlaceSideListViewImpl.prototype;

    _proto.init = function(tabInfo) {
        var _self = this;
        _super.init.call(_self, tabInfo);

        var groupchatListView = (new GroupChatListView()).init({
          mode: 'sidebar'
        });
        groupchatListView.showInnerFrame(function(){
          $("#groupChatList > .sidebar_list").append(groupchatListView._frame);
        });

        var chatListView = (new ContactListView()).init();
        chatListView.showInnerFrame(function(){
          $(".contact_list .sidebar_list").append(chatListView._frame);
        });

        _self.sidebarParts = [groupchatListView, chatListView];
        return _self;
    };

})();
