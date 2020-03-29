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

function CommunitySideListViewImpl() {
    BaseSideListViewImpl.call(this);
    this._communityId = null;
};
(function() {

    CommunitySideListViewImpl.prototype = $.extend({}, BaseSideListViewImpl.prototype);
    var _super = BaseSideListViewImpl.prototype;

    var _proto = CommunitySideListViewImpl.prototype;

    _proto.init = function(tabInfo, chatListView) {
        var _self = this;
        var _communityInfo = TabManager.getInstance().getCommunityInfo();
        _super.init.call(_self, tabInfo);

        var groupchatListView = (new GroupChatListView()).init({
          mode: 'sidebar'
        });
        groupchatListView.showInnerFrameFromProject(function(){
          $("#groupChatList > .sidebar_list").append(groupchatListView._frame);
        }, _communityInfo);

        _self.sidebarParts = [groupchatListView, chatListView];

        var _communityId = _self._tabInfo.extras.communityId;
        var _accordionPartsList = [ (new CommunityMemberListView()).init(_communityId), (new CommunityDetailsView()).init(_communityId), (new ContactListForCommunityView()).init(_communityId), (new GroupChatListView()).init({mode: 'sidebar'}), (new CommunityListView()).init() ];
        _self.setAccordionParts(_accordionPartsList);
        return _self;
    };

})();