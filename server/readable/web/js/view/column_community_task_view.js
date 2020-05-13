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
function ColumnCommunityTaskView(columnInformation, tabType) {
    this._tabType = tabType;
    ColumnTaskView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_COMMUNITY_TASK;
    this._displayName = this._createDisplayName();
    if(this._tabType == TabItemView.TYPE_COMMUNITY){
        this._closable = false;
        this._displayName = Resource.getMessage('ContextSearchCommunityTask');
    }
    this.createView();
    this._showTitle();
};(function() {

    ColumnCommunityTaskView.prototype = $.extend({}, ColumnTaskView.prototype);
    var _super = ColumnTaskView.prototype;
    var _proto = ColumnCommunityTaskView.prototype;

    _proto._showTitle = function() {
        var _self = this;
        var _communityInfo = _self._info.getCommunityInfomation();
        var _communityId = _communityInfo.getRoomId();
        _self._requestCommunityInfo(_communityId, onGetCommunityInfoCallBack);
        function onGetCommunityInfoCallBack(communityInfo){
            _self.updateColumnTitle(_self._unfinishedTaskCount, '#' + communityInfo.getMemberEntryType());
        };
    };
    _proto._requestCommunityInfo = function(communityId, onGetCommunityInfoCallBack){
        var _self = this;
        if(communityId == null || typeof communityId != 'string'){
            return null;
        }
        function _callback(communityInfo){
            if(communityInfo != null){
                _self._updateCommunityInfo(communityInfo);
            }
            onGetCommunityInfoCallBack(communityInfo);
        };
        CubeeController.getInstance().getCommunityInfo(communityId, _callback);
    };
    _proto.onCommunityInfoUpdateNotication = function(communityNotification) {
        var _self = this;
        var _updatedCommunityInfo = communityNotification.getUpdatedCommunityInfo();
        var _notoficationCommunityId = _updatedCommunityInfo.getRoomId();
        var _communityInfo = _self._info.getCommunityInfomation();
        var _columnCommunityId = _communityInfo.getRoomId();
        if(_columnCommunityId == _notoficationCommunityId) {
            _self._updateCommunityInfo(_updatedCommunityInfo);
            _self.updateColumnTitle(_self._unfinishedTaskCount);
        }
    };
    _proto._updateCommunityInfo = function(communityInfo){
         var _self = this;
        if(communityInfo == null || typeof communityInfo != 'object'){
            return null;
        }
        _self._info.setCommunityInfomation(communityInfo);
    };
    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _tabType = _self._tabType;
        var _optionMenuHtml = CommunityTaskColumnOptionMenu.getHtml(_self._info, _tabType);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new CommunityTaskColumnOptionMenu(_optionMenuElem, _self._info, _self, _tabType);
    };
    _proto.getHistoryMessage = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _searchCondition = _columnInfo.getSearchCondition();
        var _getCount = 20;
        function onGetTaskHistoryMessageCallback(resultMessageData) {
            var _messageList = resultMessageData.messageDataList;
            var _allItemCount = resultMessageData.allItemCount;
            if (_messageList.getCount() < _getCount) {
                _self._allMessageReceived = true;
            }
            _self._onGetTaskHistoryMessage(_messageList, _allItemCount);
            $(window).trigger('resize');
            _self.refreshScrollbar();
        }
        CubeeController.getInstance().searchMessage(_self._currentLoadedItemId, _getCount, _columnInfo.getSearchCondition(), onGetTaskHistoryMessageCallback);
    };

    _proto.clickSubFormButton = function() {
        var _self = this;
        var _columnInfo = _self._info;
        var _communityInfo = _columnInfo.getCommunityInfomation();
        var _communityId = _communityInfo.getRoomId();
        CubeeController.getInstance().getCommunityInfo(_communityId, _onGetCommunityInfo);
        function _onGetCommunityInfo(communityInfo){
            if(communityInfo == null){
                return;
            }
            _self._info.setCommunityInfomation(communityInfo);
            var _communityName = communityInfo.getRoomName();

            var _taskMessage = new TaskMessage();
            _taskMessage.setCommunityId(_communityId);
            _taskMessage.setCommunityName(_communityName);
            var register = new TaskRegister(_self, _taskMessage, TaskRegister.mode_add);
            var _htmlElem = _self.getHtmlElement();
            if(_htmlElem == null) {
                return;
            }
            var _taskRegisterForm = register.getRegisterForm();
            var _dialogAreaElement = $('#modal_area');
            _dialogAreaElement.html(_taskRegisterForm);
            var _dialogInnerElement = _dialogAreaElement.children();
            _dialogAreaElement.css('display', 'block');
            _dialogAreaElement.prepend('<div class="overlay modal_exit"></div>');
            _dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
            $('.overlay').animate({ 'opacity':0.3}, 200 );

        };
    };
    _proto.isMuchFilterCondition = function(taskMessage) {
        var _self = this;
        var _columnInfo = _self._info;
        var _searchCondition = _columnInfo.getSearchCondition();
        return _searchCondition.isMatch(taskMessage);
    };

    _proto._createDisplayName = function() {
        var _self = this;
        var _communityInfo = _self._info.getCommunityInfomation();
        var _communityName = '';
        if(_communityInfo != null) {
            var _communityName = _communityInfo.getRoomName();
            if(_communityName == null) {
                // This expression has no effect.
                // _communityName == '';
                _communityName = '';
            }
        }
        var _ret = ViewUtils.createDisplayName(_self._info) + (_communityName == ''? '' : '(' + _communityName + ')');
        return _ret;
    };
    _proto.updateColumnTitle = function(unfinishedTaskCount, color="") {
        var _self = this;
        var _countTitle = Resource.getMessage('task_unfinished_number');
        var _unfinishedTaskCount = 0;
        /* The value assigned to _unfinishedTaskCount here is unused.
        if (unfinishedTaskCount != null && typeof unfinishedTaskCount == 'number') {
            _unfinishedTaskCount = unfinishedTaskCount;
        } */
        var _info = _self._info;
        var _baseDispalyName = _self._createDisplayName();
        if(this._tabType == TabItemView.TYPE_COMMUNITY){
            this._displayName = Resource.getMessage('ContextSearchCommunityTask');
            _baseDispalyName = this._displayName;
        }
        _info.setDisplayName(_baseDispalyName);
        ColumnView.prototype.updateColumnTitle.call(_self, color);
    };

    _proto._setToolTipToMessageElem = function(messageElement, message, messageObject) {
        var _self = this;
        var _actionToolTipType = _self.getActionToolTipType(message);
        var _bottomToolTipType = _self.getBottomToolTipType(message);

        var _bottomToolTipOwner = messageElement.children('div.message-info').eq(0);
        var _avatarToolTipOwner = messageElement.find('div.block-avatar').eq(0);
        if (_actionToolTipType != TooltipView.TYPE_UNKNOWN) {

            // The initial value of _communityInfo is unused, since it is always overwritten.
            var _communityInfo; // = _self._info.getCommunityInfomation();
            var _columnInfo = _self._info;
            var _communityInfo = _columnInfo.getCommunityInfomation();
            var _communityId = _communityInfo.getRoomId();
            CubeeController.getInstance().getCommunityMemberInfo(_communityId, _onGetCommunityInfo);

            function _onGetCommunityInfo(communitiyInfo) {
                var _loginUserJid = LoginUser.getInstance().getJid();

                var _communityAdmin = false;
                var _taskClient = false;
                _communityAdmin = communitiyInfo.hasOwner(_loginUserJid);
                _taskClient = messageObject.hasTaskClient(_loginUserJid);
                if(_communityAdmin || _taskClient) {
                    var _actionToolTipOwner = null;
                    messageElement = _self._appendShowActionToolTipElement(messageElement, message);
                    var _showToolTipElem = messageElement.find('.showActionTooltip').eq(0);
                    if (ViewUtils.isIE89() || message.getType() == Message.TYPE_TASK) {
                        _actionToolTipOwner = messageElement.children('div.message-header').eq(0);
                    }
                    else {
                        _actionToolTipOwner = messageElement.find('td.actionToolTipBase').eq(0);
                    }

                    TooltipView.getInstance().setActionToolTip(_actionToolTipType, _actionToolTipOwner, _showToolTipElem);
                }
            };
        }
        messageObject.setMessageInnerActionToolTip();
        if (_bottomToolTipType != TooltipView.TYPE_UNKNOWN) {
            TooltipView.getInstance().setActionToolTip(_bottomToolTipType, _bottomToolTipOwner);
        }
        TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, _avatarToolTipOwner, true);
    };


})();
