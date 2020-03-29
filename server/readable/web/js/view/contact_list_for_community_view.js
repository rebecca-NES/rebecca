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

function ContactListForCommunityView() {
    ContactListView.call(this);
    this._communityId = null;
    this.VIEW_PARTS_TYPE_ALIAS = 'contact-list-for-community';
};(function() {
    ContactListForCommunityView.prototype = $.extend({}, ContactListView.prototype);
    var _super = ContactListView.prototype;
    var _proto = ContactListForCommunityView.prototype;

    _proto.init = function(communityId) {
        var _self = this;
        _super.init.call(_self);
        _self._communityId = communityId;
        return _self;
    };

    _proto.createFrame = function() {
        var _self = this;
        var _topElem = '<div class="' + _self.VIEW_PARTS_TYPE + '-top ' + _self.VIEW_PARTS_TYPE_ALIAS + '-top box-border olient-vertical flex1"></div>';
        var _userListViewHtmlObj = _self._userListView._frame;
        var _contents = $(_topElem).append(_userListViewHtmlObj);
        _self._frame = _contents;
        return _contents;
    };

    _proto.addSelectedUserList = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return;
        }

        if(!_self._subView){
            _self._subView = new CommunityMemberListSubView(_self._communityId, _self.VIEW_PARTS_TYPE, _self._callbacks);
            $('#listInnerContainer').append(_self._subView._frame);
        }

        _self._subView.addSelectedUserList(person);
        _self._subView.show();
        _self.notifyChangeSelectedUserList();
    };

    _proto.beforeActivate = function(targetObj){
        var _self = this;
        if(targetObj instanceof ContactListForCommunityView){
            return;
        }
        if(_self._subView){
            _self._subView.hide();
        }
    };

    _proto.activate = function(targetObj){
        var _self = this;
        if(!(targetObj instanceof ContactListForCommunityView)){
            return;
        }
        if(_self._subView){
            _self._subView.show();
            _self._subView._updateMemberControlButton();
        }
    };

    var _onNotificationFunc = {};
    _onNotificationFunc[Notification_model.TYPE_COMMUNITY] = _onCommunityNotify;

    _proto.onNotification = function(notification) {
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _self = this;
        var _type = notification.getType();
        var _onNotifyFunction = Utils.getSafeValue(_onNotificationFunc, _type, function(){});
        _onNotifyFunction(_self, notification);
    };

    var _onNotificationCommunity = {};
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_ADD_MEMBER] = _onAddMemberNotify;
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_REMOVE_MEMBER] = _onRemoveMemberNotify;
    _onNotificationCommunity[CommunityNotification.SUB_TYPE_UPDATE_OWNER] = _onUpdateOwnerNotify; 

    function _onCommunityNotify(self, notification){
        if(self == null || typeof self != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        var _notifyFunc = Utils.getSafeValue(_onNotificationCommunity, _subType, function(){});
        _notifyFunc(self, notification);
    };

    function _onAddMemberNotify(self, notification){
        if(self == null || typeof self != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_ADD_MEMBER){
            return;
        }
        var _communityId = notification.getRoomId();
        if(_communityId != self._communityId){
            return;
        }
        var _targets = notification.getAddedMemberList();
        var _count = _targets.getCount();
        var _processedCount = 0;
        _asyncAddMember();

        function _asyncAddMember(){
            if (_count <= _processedCount) {
                return;
            } else {
                var _person = _targets.get(_processedCount);
                self._addMember(_person);
                _processedCount++;
                setTimeout(function() {
                    _asyncAddMember();
                }, 1);
            }
        }
    };

    function _onRemoveMemberNotify(self, notification){
        if(self == null || typeof self != 'object'){
            return;
        }
        if(notification == null || typeof notification != 'object'){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_REMOVE_MEMBER){
            return;
        }
        var _communityId = notification.getRoomId();
        if(_communityId != self._communityId){
            return;
        }
        var _targets = notification.getRemovedMemberList();
        var _count = _targets.getCount();
        var _processedCount = 0;
        _asyncRemoveMember();

        function _asyncRemoveMember(){
            if (_count <= _processedCount) {
                return;
            } else {
                var _jid = _targets.get(_processedCount);
                self._removeMember(_jid);
                _processedCount++;
                setTimeout(function() {
                    _asyncRemoveMember();
                }, 1);
            }
        }
    };

    function _onUpdateOwnerNotify(self, notification) {
        if (self == null || typeof self != 'object') {
            return;
        }
        if (notification == null || typeof notification != 'object') {
            return;
        }
        var _subType = notification.getSubType();
        if (_subType != CommunityNotification.SUB_TYPE_UPDATE_OWNER) {
            return;
        }
        var _communityId = notification.getRoomId();
        if (_communityId != self._communityId) {
            return;
        }
        self._updateOwner();
    };

    _proto._addMember = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return false;
        }

        _self.notifyChangeSelectedUserList();
    };
    _proto._removeMember = function(jid) {
        var _self = this;

        if (jid == LoginUser.getInstance().getJid()) {
            if (_self._subView) {
                _self._subView._updateMemberControlButton();
            }
        }
    };
    _proto._updateOwner = function() {
        var _self = this;

        if (_self._subView) {
            _self._subView._updateMemberControlButton();
        }
    };
})();
