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
function CommunityNotificationToolTipItemView(parent, communityId, communityName, communityImage) {
    this._parent = parent;
    this._htmlElement = null;
    this._communityId = communityId;
    this._communityName = communityName;
    this._communityImage = communityImage;
    this._count = 0;
    this._type = CommunityNotificationToolTipItemView.TYPE_UNKOWN;
    this._init();
};(function() {
    CommunityNotificationToolTipItemView.TYPE_UNKOWN = 0;
    CommunityNotificationToolTipItemView.TYPE_CHANGE_INFO = 1;
    CommunityNotificationToolTipItemView.TYPE_MESSAGE = 2;
    CommunityNotificationToolTipItemView.TYPE_AUTHORITY_CHANGED = 3;

    CommunityNotificationToolTipItemView.COUNT_AREA_TAG_NAME = 'span';
    CommunityNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_START = '<' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_NAME + '>';
    CommunityNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END = '</' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_NAME + '>';
    CommunityNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME = Resource.getMessage('notification_items');
    CommunityNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_COUNT = 'count';
    CommunityNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_ROOM_NAME = 'room_name';
    CommunityNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START = '<' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_NAME + ' class="' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_COUNT + '">';
    CommunityNotificationToolTipItemView.COUNT_AREA_TAG_ROOM_NAME_ELEMENT_START = '<' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_NAME + ' class="' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_ROOM_NAME + '">';

    var _proto = CommunityNotificationToolTipItemView.prototype;
    _proto._init = function() {
        var _self = this;
        var _parentHtmlElemnt = _self._parent.getHtmlElement();
        var _htmlString = _self._getHtml();
        _parentHtmlElemnt.prepend(_htmlString);
        _self._htmlElement = _parentHtmlElemnt.children(':first');
        _self._count += 1;
        _self._updateCount(_self._count);
        _self._addCreateEvent();

    };
    _proto.destruct = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        if(_selfElm) {
            _selfElm.unbind().remove();
        }
    };
    _proto.getCommunityId = function() {
        return this._communityId;
    };
    _proto.getCommunityName = function() {
        return this._communityName;
    };
    _proto.getCommunityImage = function() {
        return this._communityImage;
    };
    _proto.removeHtmlElement = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        if(_selfElm) {
            _selfElm.unbind().remove();
        }
    };
    _proto._addCreateEvent = function() {
        var _self = this;
        var _rootElement = _self._htmlElement;
        _rootElement.on('click',function(){
            _self._toolTipItemClicked($(this));
        });
    };
    _proto._toolTipItemClicked = function(element) {
        var _self = this;
        var _communityId = _self.getCommunityId();
        NotificationIconManager.getInstance()
                               .removeAttentionHeaderColumnIcon(
                                   'li[msgto="'+ _communityId
                                   +'"][columntype="'+ ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED
                                   +'"].sortable-item .ico_project');

                var _parent = _self._parent;
        _parent.onListItemClicked(_communityId);

    };
    _proto._getHtml = function() {
        var _self = this;
        var _ret = '<li><a class="txt_btn">';
        _ret += '<span class="ico ico_project">';
        if(_self.getCommunityImage() == ''){
            var result = Utils.avatarCreate({type: 'project', name: _self._getRoomName()});
            _ret += '<div class="no_img" style="background-color:' + result.color + '">';
            _ret += '<div class="no_img_inner">' + result.name + '</div>';
            _ret += '</div>';
        }else{
            _ret += '<img src="' + _self.getCommunityImage() + '">';
        }
        _ret += '</span>';
        _ret += CommunityNotificationToolTipItemView.COUNT_AREA_TAG_ROOM_NAME_ELEMENT_START;
        _ret += _self._getRoomNameHtml();
        _ret += CommunityNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END;
        _ret += _self._getNotificationInfoHtml();
        _ret += '</a></li>';
        return _ret;
    };
    _proto.onNotificationRecieved = function() {
        var _self = this;
        _self._count += 1;
        _self._updateCount(_self._count);
    };
    _proto.onUpdateCommynityInfoNotificationRecieved = function(communityInfo) {
        var _self = this;
        _self._updateCommunityName(communityInfo);
    };
    _proto._updateCommunityName = function(communityInfo) {
        var _self = this;
        var _rootElement = _self._htmlElement;
        var _communityName = communityInfo.getRoomName();
        _rootElement.find(CommunityNotificationToolTipItemView.COUNT_AREA_TAG_NAME + '.' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_ROOM_NAME).text(_communityName);
        _self._communityName = _communityName;
    };
    _proto._updateCount = function(count) {
        var _self = this;
        var _rootElement = _self._htmlElement;
        _rootElement.find(CommunityNotificationToolTipItemView.COUNT_AREA_TAG_NAME + '.' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_CLASS_COUNT).text(count);
    };
    _proto._getRoomName = function() {
        var _self = this;
        var _communityName = _self.getCommunityName();
        var _ret = _communityName;
        return _ret;
    };
    _proto._getRoomNameHtml = function() {
        var _self = this;
        var _communityName = Utils.convertEscapedHtml(_self.getCommunityName());
        var _ret = _communityName;
        return _ret;
    };
    _proto._getNotificationInfoHtml = function() {
        return '';
    };
    _proto.getType = function() {
        return this._type;
    };
})();
function CommunityInfoChangeNotificationToolTipItemView(parent, communityId, communityName, communityImage) {
    CommunityNotificationToolTipItemView.call(this, parent, communityId, communityName, communityImage);
    this._type = CommunityNotificationToolTipItemView.TYPE_CHANGE_INFO;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = CommunityNotificationToolTipItemView.prototype;
    CommunityInfoChangeNotificationToolTipItemView.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityInfoChangeNotificationToolTipItemView.prototype;
    _proto._getNotificationInfoHtml = function() {
        var _self = this;
        var _ret = '( ' + Resource.getMessage('community_notification_change_info') + '  ' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END + CommunityNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME + ' )';
        return _ret;
    };
})();

function CommunityMessageNotificationToolTipItemView(parent, communityId, communityName, communityImage) {
    CommunityNotificationToolTipItemView.call(this, parent, communityId, communityName, communityImage);
    this._type = CommunityNotificationToolTipItemView.TYPE_MESSAGE;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = CommunityNotificationToolTipItemView.prototype;
    CommunityMessageNotificationToolTipItemView.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityMessageNotificationToolTipItemView.prototype;
    _proto._getNotificationInfoHtml = function() {
        var _self = this;
        var _ret = '( ' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END + CommunityNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME + ' )';
        return _ret;
    };
})();

function CommunityAuthorityChangedNotificationToolTipItemView(parent, communityId, communityName, communityImage) {
    CommunityNotificationToolTipItemView.call(this, parent, communityId, communityName, communityImage);
    this._type = CommunityNotificationToolTipItemView.TYPE_AUTHORITY_CHANGED;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = CommunityNotificationToolTipItemView.prototype;
    CommunityAuthorityChangedNotificationToolTipItemView.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityAuthorityChangedNotificationToolTipItemView.prototype;
    _proto._getNotificationInfoHtml = function() {
        var _self = this;
        var _ret = '( ' + Resource.getMessage('community_notification_change_authority') + '  ' + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_COUNT_ELEMENT_START + CommunityNotificationToolTipItemView.COUNT_AREA_TAG_ELEMENT_END + CommunityNotificationToolTipItemView.COUNT_DEFAULT_UNIT_NAME + ' )';
        return _ret;
    };
})();

function CommunityNotificationToolTipView(parent, communityNotification) {
    this._parent = parent;
    this._itemViewList = new ArrayList();
    this._htmlElement = null;
    this._init(communityNotification);
};(function() {
    var TOOL_TIP_ITEM_VIEW_CLASS = [];
    TOOL_TIP_ITEM_VIEW_CLASS[CommunityNotificationToolTipItemView.TYPE_CHANGE_INFO] = CommunityInfoChangeNotificationToolTipItemView;
    TOOL_TIP_ITEM_VIEW_CLASS[CommunityNotificationToolTipItemView.TYPE_MESSAGE] = CommunityMessageNotificationToolTipItemView;
    TOOL_TIP_ITEM_VIEW_CLASS[CommunityNotificationToolTipItemView.TYPE_AUTHORITY_CHANGED] = CommunityAuthorityChangedNotificationToolTipItemView;

    var _proto = CommunityNotificationToolTipView.prototype;
    _proto._init = function(communityNotification) {
        if(communityNotification == null || typeof communityNotification != 'object') {
            return;
        }
        var _self = this;
        var _parentHtmlElemnt = _self._parent.getHtmlElement();
        var _htmlString = _self._getHtml();
        _self._htmlElement = _parentHtmlElemnt.append(_htmlString);
        var _toolTipItemView = _self._createToolTipItemView(communityNotification);
        if(_toolTipItemView == null) {
            return;
        }
        _self._itemViewList.insert(0,_toolTipItemView);
    };
    _proto.destruct = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        if(_selfElm) {
            _selfElm.unbind().remove();
        }
    };
    _proto._getHtml = function() {
        var _ret = '';
        _ret += '<div class="notification_list"></div>';
        return _ret;
    };
    _proto.getHtmlElement = function() {
        return this._htmlElement;
    };
    _proto.getCount = function() {
        return this._itemViewList.getCount();
    };
    _proto.onNotificationRecieved = function(communityNotification) {
        var _self = this;
        var _communityId = _self._getCommunityIdAndCommunityNameFromCommunityNotification(communityNotification)[0];
        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByCommunityId(_communityId);
        var _isUpdateFlg = _self._checkUpdateExistToolTipItem(communityNotification);
        if(!_isUpdateFlg){
            _self._addToolTipItemView(communityNotification);
            return;
        }
        var _count = _toolTipItemViewIdxList.getCount();
        var _recievedSubType = communityNotification.getSubType();
        for(var _i = 0; _i < _count; _i++){
            var _idx = _toolTipItemViewIdxList.get(_i);
            var _curToolTipItemView = _self._itemViewList.get(_idx);
            var _curToolTipItemViewType = _curToolTipItemView.getType();
            var _receiveToolTipClassType = _getToolTipClassType(communityNotification);
            if(_receiveToolTipClassType == _curToolTipItemViewType){
                _self._updateToolTipItemView(_idx);
                break;
            }
        }
    };
    _proto._checkUpdateExistToolTipItem = function(communityNotification){
        var _self = this;
        var _isUpdateFlg = false;
        var _communityId = _self._getCommunityIdAndCommunityNameFromCommunityNotification(communityNotification)[0];
        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByCommunityId(_communityId);
        var _count = _toolTipItemViewIdxList.getCount();
        if(_count == 0){
            return _isUpdateFlg;
        }
        var _recievedSubType = communityNotification.getSubType();
        for(var _i = 0; _i < _count; _i++){
            var _idx = _toolTipItemViewIdxList.get(_i);
            var _curToolTipItemView = _self._itemViewList.get(_idx);
            var _curToolTipItemViewType = _curToolTipItemView.getType();
            var _receiveToolTipClassType = _getToolTipClassType(communityNotification);
            if(_receiveToolTipClassType == _curToolTipItemViewType){
                _isUpdateFlg = true;
                break;
            }
        }
        return _isUpdateFlg;
    };
    _proto._addToolTipItemView = function(communityNotification) {
        var _self = this;
        var _toolTipItemView = _self._createToolTipItemView(communityNotification);
        _self._itemViewList.insert(0,_toolTipItemView);
        _self._parent.onToolTipUpdated();
    };
    _proto._updateToolTipItemView = function(toolTipItemViewIdx) {
        var _self = this;
        var _curToolTipItemView = _self._itemViewList.get(toolTipItemViewIdx);
        if(_curToolTipItemView == null){
            return;
        }
        _curToolTipItemView.onNotificationRecieved();
    };
    _proto._getToolTipItemViewIdxsByCommunityId = function(communityId) {
        var _self = this;
        var _idxList = new ArrayList();
        var _toolTipItemViewList = _self._itemViewList;
        var _count = _toolTipItemViewList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _toolTipItemView = _self._itemViewList.get(_i);
            var _curCommunityId = _toolTipItemView.getCommunityId();
            if(_curCommunityId == communityId){
                _idxList.add(_i);
            }
        }
        return _idxList;
    };
    _proto._createToolTipItemView = function(communityNotification) {
        var _self = this;
        var _subType = communityNotification.getSubType();
        var _toolTipItemView = null;
        var _toolTipItemViewClassType = _getToolTipClassType(communityNotification);
        var _communityIdAndCommunityName = _self._getCommunityIdAndCommunityNameFromCommunityNotification(communityNotification);
        var _clazz = TOOL_TIP_ITEM_VIEW_CLASS[_toolTipItemViewClassType];
        if((_clazz == null) || (_communityIdAndCommunityName[0] == '')) {
            return null;
        }
        _toolTipItemView = new _clazz(_self, _communityIdAndCommunityName[0], _communityIdAndCommunityName[1], _communityIdAndCommunityName[2]);
        return _toolTipItemView;
    };

    function _getToolTipClassType(communityNotification) {
        var _toolTipItemViewClassType = CommunityNotificationToolTipItemView.TYPE_UNKOWN;
        var _subType = communityNotification.getSubType();
        switch(_subType) {
            case CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO:
            case CommunityNotification.SUB_TYPE_ADD_MEMBER:
            case CommunityNotification.SUB_TYPE_REMOVE_MEMBER:
                break;
            case CommunityNotification.SUB_TYPE_UPDATE_OWNER:
                break;
            case CommunityNotification.SUB_TYPE_MESSAGE:
                _toolTipItemViewClassType = CommunityNotificationToolTipItemView.TYPE_MESSAGE;
                break;
            case CommunityNotification.SUB_TYPE_AUTHORITY_CHANGED:
                break;
            default:
                break;
        }
        return _toolTipItemViewClassType;
    };
    _proto.onListItemClicked = function(communityId){
        var _self = this;
        function _callback(communityInfo){
            function dspColumn(){
                var _columnInfo = new CommunityFeedColumnInformation();
                _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED);
                _columnInfo.setCommunityInfomation(communityInfo);
                ColumnManager.getInstance().addColumn(_columnInfo, true, true);
            };
            if($('.project_btn').attr('data_value') == communityId){
                dspColumn();
            }else{
                TabManager.getInstance().selectOrAddTabByCommunityInfo(communityId, communityInfo, dspColumn);
            }
        };
        CubeeController.getInstance().getCommunityInfo(communityId, _callback);
        _self._removeTooltipItem(communityId);
    };
    _proto._removeTooltipItem = function(communityId){
        var _self = this;
        var _parent = _self._parent;
        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByCommunityId(communityId);
        var _count = _toolTipItemViewIdxList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _idx = _toolTipItemViewIdxList.get(_i);
            var _toolTipItemView = _self._itemViewList.get(_idx);
            _toolTipItemView.removeHtmlElement();
        }
        var _itemViewListCount = _self._itemViewList.getCount();
        for(var _j = _itemViewListCount; _j > 0; _j--){
            var _idx = _j - 1;
            var _curToolTipItemView = _self._itemViewList.get(_idx);
            var _curCommunityId = _curToolTipItemView.getCommunityId();
            if(communityId == _curCommunityId){
                _self._itemViewList.remove(_idx);
            }
        }
        _parent.onToolTipUpdated();
    };
    _proto.onUpdateNotificationRecieved = function(communityNotification) {
        var _self = this;
    };
    _proto.onAddColumn = function(columnInfo) {
        var _self = this;
        var _roomInfo = columnInfo.getChatRoomInfomation();
        var _roomId = _roomInfo.getRoomId();
        _self._removeTooltipItem(_roomId);
    };
    _proto.onColumnClicked = function(columnInformation) {
        var _self = this;
        var _clickedColumnType = columnInformation.getColumnType();
        if(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED != _clickedColumnType) {
            return;
        }
        var _communityInfo = columnInformation.getCommunityInfomation();
        if(_communityInfo == null) {
            return;
        }
        var _communityId = _communityInfo.getRoomId();
        var _parent = _self._parent;
        var _toolTipItemViewIdxList = _self._getToolTipItemViewIdxsByCommunityId(_communityId);
        var _count = _toolTipItemViewIdxList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _idx = _toolTipItemViewIdxList.get(_i);
            var _toolTipItemView = _self._itemViewList.get(_idx);
            if(_toolTipItemView.getType() != CommunityNotificationToolTipItemView.TYPE_MESSAGE) {
                continue;
            }
            _toolTipItemView.removeHtmlElement();
        }
        var _itemViewListCount = _self._itemViewList.getCount();
        for(var _j = _itemViewListCount; _j > 0; _j--){
            var _idx = _j - 1;
            var _curToolTipItemView = _self._itemViewList.get(_idx);
            var _curCommunityId = _curToolTipItemView.getCommunityId();
            if(_communityId == _curCommunityId){
                if(_curToolTipItemView.getType() != CommunityNotificationToolTipItemView.TYPE_MESSAGE) {
                    continue;
                }
                _self._itemViewList.remove(_idx);
            }
        }
        _parent.onToolTipUpdated();
    };
    _proto._getCommunityIdAndCommunityNameFromCommunityNotification = function(communityNotification) {
        var _self = this;
        var _parent = _self._parent;
        var _subType = communityNotification.getSubType();
        var _toolTipItemView = null;
        var _communityId = '';
        var _communityName = '';
        var _communityImage = '';
        switch(_subType) {
            case CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO:
            case CommunityNotification.SUB_TYPE_ADD_MEMBER:
            case CommunityNotification.SUB_TYPE_UPDATE_OWNER:
                break;
            case CommunityNotification.SUB_TYPE_REMOVE_MEMBER:
            case CommunityNotification.SUB_TYPE_MESSAGE:
                var _communityMessage = communityNotification.getCommunityMessage();
                _communityId = _communityMessage.getTo();
                _communityName = _communityMessage.getRoomName();
                _communityImage = _parent._communityInfo.getLogoUrl();
                break;
            case CommunityNotification.SUB_TYPE_AUTHORITY_CHANGED:
            default:
                break;
        }
        return [_communityId, _communityName, _communityImage];
    };

})();
