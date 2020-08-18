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

function ColumnSearchView(columnInformation) {
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_SEARCH;
    this._displayName = this._createDisplayName(columnInformation);

    var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
    var _type = _tabInfo.type;
    if( _type == TabItemView.TYPE_COMMUNITY){
        var _columnInfo = this._info;
        var _keywordStr =_columnInfo.getKeyword();
        var _columnKeywordFilter = this._getKeywordFilterCondition(_keywordStr);
        var _searchCondition = this._createSearchCondition(_columnKeywordFilter);
        _columnInfo.setSearchCondition(_searchCondition);
    }

    this.createView();

    this._htmlElement.find('div.frm-message').children('input').val(this._info.getKeyword());
    columnInformation.setIconImage('images/column_search.png');

};(function() {
    ColumnSearchView.prototype = $.extend({}, ColumnFilterView.prototype);
    var _super = ColumnFilterView.prototype;
    var _proto = ColumnSearchView.prototype;

    function hexToRgba(hex){
        let r = String(parseInt(hex.substring(1,3), 16));
        let g = String(parseInt(hex.substring(3,5), 16));
        let b = String(parseInt(hex.substring(5,7), 16));
        return "background-color:rgba("+r+","+g+","+b+",0.05)";
    }
    _proto.getColumnMessageHtml = function(message) {
        var _self = this;
        var _ret = '';
        var _msg = message.getMessage();
        var _itemId = message.getItemId();
        var _type = _msg.getType();
        var _msgTo;
        var _msgFrom;
        if(_type == Message.TYPE_CHAT){
            _msgTo = _msg.getTo();
            _msgFrom = _msg.getFrom();
        }
        else if(_type == Message.TYPE_MURMUR){
            _msgTo = _msg.getTo();
        }
        var _msgBorderHeaderHtml = ColumnSearchView.getBorderHeaderHtml(_msg);
        if(_type == Message.TYPE_MURMUR) {
            var _partnerName = _msg._profileMap._array[0]._nickName;
            var _result = Utils.avatarCreate({name: _partnerName, type: 'user'});
            _ret += '<div draggable="false" class="box-border olient-vertical search-message width-100" style="border-left: 0;'+hexToRgba(_result.color)+';"';
        } else {
            _ret += '<div draggable="false" class="box-border olient-vertical search-message width-100" style="border-left: 0;"';
        }
        _ret += ' itemId="' + _itemId + '"';
        _ret += ' msgtype="' + _type + '"';
        if(_msgTo != null){
            _ret += ' msgto="' + _msgTo + '"';
        }
        if(_msgFrom != null){
            _ret += ' msgfrom="' + _msgFrom + '"';
        }
        _ret += '>';
        _ret += _msgBorderHeaderHtml;
        _ret += '<div class="box-border olient-vertical message-info search-message-info">';
        _ret += _super.getColumnMessageHtml.call(_self, message);
        _ret += '</div>';
        _ret += '<div class="message-footer search-message-footer">' + '</div>';
        _ret += '</div> <!-- .search-message -->';

        return _ret;
    };
    _proto._createFilterCondition = function(keywordCondition) {
        if (!keywordCondition || typeof keywordCondition != 'object') {
            return;
        }
        var _self = this;
        var _columnInfo = _self._info;
        var _sourceColumnFilterTypeList = _columnInfo.getSourceColumnTypeList();
        var _count = _sourceColumnFilterTypeList.getCount();
        var _filterCondition = null;
        if(_count > 0){
            var _sourceColumnFilter = _self._createSorceColumnFilterCondition(_sourceColumnFilterTypeList);
            _filterCondition = new AndCondition();
            _filterCondition.addChildCondition(_sourceColumnFilter);
            _filterCondition.addChildCondition(keywordCondition);
        }else{
            _filterCondition = keywordCondition;
        }
        return _filterCondition;
    };
    _proto._createSorceColumnFilterCondition = function(sourceColumnFilterTypeList) {
        var _self = this;
        var _sourceColumnFilter = null;
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _type = _tabInfo.type;
        switch(_type){
            case TabItemView.TYPE_MY_WORK_PLACE:
                _sourceColumnFilter = ColumnFilterManager.getColumnFilterList(sourceColumnFilterTypeList);
                break;
            case TabItemView.TYPE_COMMUNITY:
                _sourceColumnFilter = _self._createSorceColumnFilterConditionForCommunity(sourceColumnFilterTypeList);
                break;
            default:
                break;
        }
        return _sourceColumnFilter;
    };

    _proto._createSorceColumnFilterConditionForCommunity = function(sourceColumnFilterTypeList) {
        var _self = this;
        var _columnInfo = _self._info;
        var _subData = _columnInfo.getSubData();
        var _sourceColumnFilter = ColumnFilterManager.getColumnFilterForCommunity(sourceColumnFilterTypeList, _subData);
        return _sourceColumnFilter;
    };

    ColumnSearchView.getBorderHeaderHtml = function(msg) {
        function hexToRgba(hex){
          let r = String(parseInt(hex.substring(1,3), 16));
          let g = String(parseInt(hex.substring(3,5), 16));
          let b = String(parseInt(hex.substring(5,7), 16));
          return "background-color:rgba("+r+","+g+","+b+",0.05)";
        }

        var _ret = '';
        var _type = msg.getType();
        if (msg.getType() == Message.TYPE_QUESTIONNAIRE) {
            if (!parseInt(msg.getRoomType())) {
                return _ret;
            }
            _type = parseInt(msg.getRoomType());
        }
        var _headerTitle = '';
        var _headerCls = 'message-border-header-';
        switch(_type) {
        case Message.TYPE_PUBLIC:
            _headerTitle = ColumnView.DISPLAY_NAME_TIMELINE;
            _headerCls += 'myfeed" style="border-left-color:#26a9d1;'+hexToRgba("#26a9d1")+';"';
            break;
        case Message.TYPE_CHAT:
            var _partnerJid = msg.getFrom();
            if (_partnerJid == LoginUser.getInstance().getJid()) {
                _partnerJid = msg.getTo();
            }
            var _partnerName = '';
            var _profileMap = msg.getProfileMap();
            if(_profileMap && typeof _profileMap == 'object'){
                var _profile = _profileMap.getByKey(_partnerJid);
                if(_profile && typeof _profile == 'object'){
                    _partnerName = _profile.getNickName();
                }
            }
            _headerTitle = _partnerName;
            var result = Utils.avatarCreate({name: _partnerName, type: 'user'});
            _headerCls += 'chat" style="border-left-color:'+result.color+';'+hexToRgba(result.color)+';"';
            break;
        case Message.TYPE_TASK:
            var _isInboxMessage = _super.isInbox(msg);
            var _communityName = msg.getCommunityName();
            if (_isInboxMessage) {
                _headerTitle = ColumnView.DISPLAY_NAME_INBOX;
                _headerCls += 'inbox" style="border-left-color:#32bea6;'+hexToRgba("#32bea6")+';"';
            }else if(_communityName != null && _communityName != ''){
                _headerTitle = ColumnView.DISPLAY_NAME_COMMUNITY_TASK + '(' + _communityName + ')';
                var pj = SelectAndAddProjectView.getInstance()._communityList._array.filter(c => c._roomName === _communityName)[0];
                var pjColor = pj && pj._memberEntryType ? "#"+pj._memberEntryType : "#0000FF";
                _headerCls += 'community-task" style="border-left-color:'+pjColor+';'+hexToRgba(pjColor)+';"';
            }else {
                _headerTitle = ColumnView.DISPLAY_NAME_MY_TASK;
                _headerCls += 'task" style="border-left-color:#fabc3d;'+hexToRgba("#fabc3d")+';"';
            }
            break;
        case Message.TYPE_GROUP_CHAT:
            var _roomName = msg.getRoomName();
            _headerTitle = _roomName;
            var result = Utils.avatarCreate({name: _roomName, type: 'group'});
            _headerCls += 'groupchat" style="border-left-color:'+result.color+';'+hexToRgba(result.color)+';"';
            break;
        case Message.TYPE_MAIL:
            _headerTitle = ColumnView.DISPLAY_NAME_MAIL;
            _headerCls += 'mail" style="border-left-color:#000000;"';
            break;
        case Message.TYPE_COMMUNITY:
            var _roomName = msg.getRoomName();
            _headerTitle = _roomName;
            var pj = SelectAndAddProjectView.getInstance()._communityList._array.filter(c => c._roomName === _roomName)[0];
            var pjColor = pj && pj._memberEntryType ? "#"+pj._memberEntryType : "#0000FF";
            _headerCls += 'community-feed" style="border-left-color:'+pjColor+';'+hexToRgba(pjColor)+';"';
            break;
        case Message.TYPE_MURMUR:
            var _partnerJid = msg.getTo();
            var _partnerName = '';
            var _profileMap = msg.getProfileMap();
            if(_profileMap && typeof _profileMap == 'object'){
                var _profile = _profileMap.getByKey(_partnerJid);
                if(_profile && typeof _profile == 'object'){
                    _partnerName = _profile.getNickName();
                }
            }
            let _columnName = msg.getColumnName();
            if(typeof _columnName !== 'string' ||
               _columnName.length == 0){
                _columnName = ColumnView.DISPLAY_NAME_MURMUR;
            }
            if(_partnerName == null || _partnerName == ""){
                if(_partnerJid != null){
                    CubeeController.getInstance().getPersonDataByJidFromServer(
                        _partnerJid,
                        (personMap)=>{
                            var _person = personMap.getByKey(_partnerJid);
                            var _userName = _person.getUserName();
                            $("#columnInnerContainer div div"
                            + " > div[itemid=" + msg.getItemId() + "][msgtype=11][msgto="+_partnerJid+"]"
                            + " > div.message-header")
                                .text(_columnName);
                            var result = Utils.avatarCreate({name: _userName, type: 'user'});
                            $("#columnInnerContainer div div"
                            + " > div[itemid=" + msg.getItemId() + "][msgtype=11][msgto="+_partnerJid+"]"
                            + " > div.message-header")
                                .attr("style",'border-left-color:'+result.color+';'+hexToRgba(result.color)+';')
                        });
                }
                _headerTitle = _columnName;
                _headerCls += 'murmur"';
            }else{
                _headerTitle = _columnName;
                var result = Utils.avatarCreate({name: _partnerName, type: 'user'});
                _headerCls += 'murmur" style="border-left-color:'+result.color+';'+hexToRgba(result.color)+';"';
            }
            break;
        default:
            break;
        }
        _ret += '<div class="box-border-for-abbreviation text-overflow-ellipsis olient-horizontal message-header ' + _headerCls + '>' + Utils.convertEscapedHtml(_headerTitle) + '</div>';
        return _ret;
    };
    _proto.showUpdateMessage = function(msg) {
        var _self = this;
        _super.showUpdateMessage.call(_self, msg);
    };
    _proto._getToolTipBaseElement = function (content) {
        return content.children().children().children().not('.' + ColumnView.TOGGLE_REPLY_CLS_NAME).eq(0);
    };

})();
