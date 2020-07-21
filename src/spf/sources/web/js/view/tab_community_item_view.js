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

function TabCommunityItemView() {
    TabItemView.call(this);
};
(function() {

    TabCommunityItemView.prototype = $.extend({}, TabItemView.prototype);
    var _super = TabItemView.prototype;

    var _proto = TabCommunityItemView.prototype;

    _proto.init = function(communityId) {
        var _self = this;
        _self._tabInfo.type = TabItemView.TYPE_COMMUNITY;
        var _communitySideListViewImpl = new CommunitySideListViewImpl();
        _self._sideListViewImpl = _communitySideListViewImpl;
        if(communityId != null && typeof communityId == 'string'){
            this._tabInfo.extras.communityId = communityId;
            var _jid = LoginUser.getInstance().getJid();
            var _host = location.hostname;
            var _columnListId = communityId + '_columnList' + '_' + _host + '_' + _jid;
            _self._tabInfo.columnListId = _columnListId;
        }
        var _communityId = _self._tabInfo.extras.communityId;
        var _communityInfo = new CommunityInfo();
        _communityInfo.setRoomId(_communityId);
        var _columnFeedInfo = ViewUtils.getCommunityFeedColumnInfo(_communityInfo);
        var _columnTaskInfo = ViewUtils.getCommunityTaskColumnInfo(_communityInfo);
        this._defaultColumnInfoList.add(_columnFeedInfo);
        this._defaultColumnInfoList.add(_columnTaskInfo);
        return _self;
    };

    _proto.isContainMinimumColumn = function(columnInfoList) {
        var _self = this;
        var _ret = false;
        if(columnInfoList == null) {
            return _ret;
        }
        var _isContainCommunityFeed = false;
        var _isContainCommunityTask = false;
        var _count = columnInfoList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            var _columnInfo = columnInfoList.get(_i);
            if(_columnInfo == null) {
                continue;
            }
            if(_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED && _columnInfo.getCommunityInfomation().getRoomId() == _self._tabInfo.extras.communityId) {
                _isContainCommunityFeed = true;
            } else if(_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK && _columnInfo.getCommunityInfomation().getRoomId() == _self._tabInfo.extras.communityId) {
                _isContainCommunityTask = true;
            }
        }
        _ret = (_isContainCommunityFeed && _isContainCommunityTask);
        return _ret;
    };


    _proto.getDom = function() {
        var _self = this;
        var _dom = _super.getDom.call(_self);
        var _communityId = _self._tabInfo.extras.communityId;
        CubeeController.getInstance().getCommunityInfo(_communityId, _onGetCommunityInfo);
        var _closeImg = '<img src="images/add_attach_cancel.png" class="close-tab">';
            _dom.append(_closeImg);
        return $(_dom);

        function _onGetCommunityInfo(communityInfo){
            var _communityName = Resource.getMessage('tab_not_referable_community');
            if(communityInfo != null){
                _communityName = communityInfo.getRoomName();
                _self._iconUrl = communityInfo.getLogoUrl() || _self._iconUrl;
            }
            _self._onUpdateLogoUrl(_self._iconUrl);
            _dom.children('span').text(_communityName);
            _dom.children('span').attr('title',_communityName);
        };
    };

    _proto.isMatch = function(tabItemView) {
        var _self = this;
        var _ret = _super.isMatch.call(_self,tabItemView);
        if (!_ret) {
            return false;
        }
        var _tabInfo =  tabItemView.getTabInfo();
        if(_tabInfo == null){
            return false;
        }
        var _extras = _tabInfo.extras;
        if(_extras == null){
            return false;
        }
        return _self._tabInfo.extras.communityId == _extras.communityId;
    };

    _proto.isMutchCommunityId = function(communityId) {
        var _self = this;
        return _self._tabInfo.extras.communityId == communityId;
    };

    _proto._createEventHandler = function(tabItemElm) {
        if (!tabItemElm || typeof tabItemElm != 'object') {
            return;
        }
        var _self = this;
        tabItemElm.find('img.close-tab').on('click',function(){
            var _parentElm = $(this).parent();
            _self._onClickCloseCallBack(_parentElm);
            return false;
        })
    };

    var _onNotificationFunc = {};
    _onNotificationFunc[Notification_model.TYPE_COMMUNITY] = _onCommunityNotify;

    _proto.onNotification = function(notification) {
        if (!notification || typeof notification != 'object') {
            return;
        }
        var _self = this;
        var _type = notification.getType();
        var _onNotifyFunction = Utils.getSafeValue(_onNotificationFunc, _type, function(){});
        _onNotifyFunction(_self, notification);
    };

    var _onNotificationCommunity = {};
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO] = _onUpdateCommunityInfoNotify;

    function _onCommunityNotify(self, notification){
        var _subType = notification.getSubType();
        var _notifyFunc = Utils.getSafeValue(_onNotificationCommunity, _subType, function(){});
        _notifyFunc(self, notification);
    };

    function _onUpdateCommunityInfoNotify(self, notification){
        if (!notification || typeof notification != 'object') {
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO){
            return;
        }
        var _communityInfo = notification.getUpdatedCommunityInfo();
        var _updateRoomId = _communityInfo.getRoomId();
        var _communityId = self._tabInfo.extras.communityId
        if(_updateRoomId != _communityId){
            return;
        }
        var _dom = self._dom;
        var _communityId = self._tabInfo.extras.communityId;
        return CubeeController.getInstance().getCommunityInfo(_communityId, _onGetCommunityInfo);

        function _onGetCommunityInfo(communityInfo){
            if(communityInfo == null){
                return;
            }
            var _communityLogo = communityInfo.getLogoUrl();
            if(_communityLogo != ''){
                self._onUpdateLogoUrl(_communityLogo);
            }
        };
    };

})();
