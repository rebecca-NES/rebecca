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

function ColumnManager() {
    this._columnList = ColumnList.getInstance();
    this._columnObjList = new ArrayList();
    this._columnContainer = $('#columnContainer');
    this._columnInnerContainer = $('#columnInnerContainer');
    this._personListDialogObj = null;
    this._attentionColumnBlinkTime = 500;
    this._columnListId = null;
    this._isCleaningUp = false;
    this._isRefreshing = false;
};(function() {
    ColumnManager.prototype = $.extend({}, ViewCore.prototype);

    var columViewList = [];
    columViewList[ColumnInformation.TYPE_COLUMN_TIMELINE] = ColumnTimelineView;
    columViewList[ColumnInformation.TYPE_COLUMN_MENTION] = ColumnMentionView;
    columViewList[ColumnInformation.TYPE_COLUMN_TOME] = ColumnToMeView;
    columViewList[ColumnInformation.TYPE_COLUMN_INBOX] = ColumnInboxView;
    columViewList[ColumnInformation.TYPE_COLUMN_TASK] = ColumnTaskView;
    columViewList[ColumnInformation.TYPE_COLUMN_CHAT] = ColumnChatView;
    columViewList[ColumnInformation.TYPE_COLUMN_SEARCH] = ColumnSearchView;
    columViewList[ColumnInformation.TYPE_COLUMN_FILTER] = ColumnFilterView;
    columViewList[ColumnInformation.TYPE_COLUMN_GROUP_CHAT] = ColumnGroupChatView;
    columViewList[ColumnInformation.TYPE_COLUMN_MAIL] = ColumnMailView;
    columViewList[ColumnInformation.TYPE_COLUMN_RECENT] = ColumnRecentView;   
    columViewList[ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER] = ColumnCustomFilterView;
    columViewList[ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED] = ColumnCommunityFeedView;
    columViewList[ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK] = ColumnCommunityTaskView;
    columViewList[ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION] = ColumnShowConversationView;
    columViewList[ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE] = ColumnQuestionnaireView;
    columViewList[ColumnInformation.TYPE_COLUMN_MURMUR] = ColumnMurmurView;

    var _MIN_COLUMN_WIDTH = 290;

    var _imageMaxWidth = 0;

    var _columnManager = new ColumnManager();
    ColumnManager.getInstance = function() {
        return _columnManager;
    };

    var _proto = ColumnManager.prototype;
    _proto.getColumnList = function() {
        return this._columnList;
    };
    _proto.getColumnObjList = function() {
        return this._columnObjList;
    };
    _proto.getImageMaxWidth = function() {
        return this._imageMaxWidth;
    }; // add semicolon by TM 2020/04/30
    _proto._getColumnContainer = function() {
        return this._columnContainer;
    };
    _proto._getColumnInnerContainer = function() {
        return this._columnInnerContainer;
    };
    _proto._getPersonListDialogObj = function() {
        return this._personListDialogObj;
    };
    _proto._setPersonListDialogObj = function(dialogObj) {
        if (!dialogObj || typeof dialogObj != 'object') {
            return;
        }
        return this._personListDialogObj = dialogObj;
    };
    _proto.disconnected = function() {
        var _self = this;
        _self._columnObjList.removeAll();
        _self._columnList.removeAll();
    };

    _proto.refresh = function(columnListId, columnInfoList, callback) {
        var _self = this;
        if(columnListId == null || typeof columnListId != 'string'){
            setTimeout(function() {
                callback(false);
            }, 1);
            return;
        }
        if(columnInfoList == null || typeof columnInfoList != 'object'){
            setTimeout(function() {
                callback(false);
            }, 1);
            return;
        }
        if(_self._isRefreshing) {
            setTimeout(function() {
                callback(false);
            }, 1);
            return;
        }
        if(_self._isCleaningUp) {
            setTimeout(function() {
                callback(false);
            }, 1);
            return;
        }
        _self._isRefreshing = true;
        _self._isCleaningUp = true;
        _self.cleanup(_onCleanUpCallBack);

        function _onCleanUpCallBack(){
            _self._isCleaningUp = false;
            _self._columnListId = columnListId;
            var _count = columnInfoList.getCount();
            var _index = 0;
            var _delay = Conf.getVal('ADD_COLUMN_DELAY');
            function addColumnFunc() {
                if(_index >= _count) {
                    if (callback != null && typeof callback == 'function') {
                        callback(true);
                    }
                    _self._isRefreshing = false;
                    setTimeout(function(){
                        $(".scroll_content").trigger("resize");
                    }, 0);
                    return;
                }
                var _curColumnInfo = columnInfoList.get(_index);
                if(columnListId.indexOf('columnList_' + location.hostname + '_' + LoginUser.getInstance().getJid()) != 0 &&
                   _curColumnInfo._colmnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED &&
                   columnListId.indexOf(_curColumnInfo.getCommunityInfomation().getRoomId() + "_") == -1){
                    _onAddColumnCallBack();
                    return;
                }
                _self.addColumn(_curColumnInfo, false, false, false, _onAddColumnCallBack);
            }
            function _onAddColumnCallBack(){
                _index++;
                addColumnFunc();
            }
            setTimeout(addColumnFunc, _delay);
        };
    };

    _proto.cleanup = function(callback) {
        var _self = this;
        var _columnCount = _self.getColumnObjList().getCount();
        var _index = _columnCount - 1
        var _delay = 0;
        var _childrenElem = _self._columnInnerContainer.children();

        function _allRmvFunc(){
            ColumnIconArea.getInstance().cleanup();
            _self._columnInnerContainer.find('*').off();
            for (var i=_index; i >= 0; i--) {
                var _columnObj = _self.getColumnObjList().get(i);
                _columnObj.cleanup();
                _childrenElem.eq(i).remove();
            }
            _self._columnObjList.removeAll();
            _self._columnList.removeAll();
            _self._columnInnerContainer.find('*').remove()
            if(callback != null && typeof callback == 'function') {
                if (_index > 0) {
                    setTimeout(function(){
                        callback();
                        $('#columnInnerContainer').toggle('drop', 200);
                    },_delay)
                } else {
                    callback();
                }
            }
        }
        if (_index > 0) {
            $('#columnInnerContainer').toggle("drop", 200);
            setTimeout(function(){
                _allRmvFunc();
            }, 250)
            _delay = 100;
        } else {
            _allRmvFunc();
        }
        return;
    };

    _proto.addColumn = function(columnInfo, isScroll, isAttention, isColumnIconNotify, callback, beforeColumn) {
        var _self = this;
        if(isScroll != false) {
            isScroll = true;
        }
        var _lastColumnIndex = _self.getColumnList().getCount() - 1;
        var _lastColumnObj = null;
        if (_lastColumnIndex >= 0) {
            _lastColumnObj = _self.getColumnList().get(_lastColumnIndex);
        }
        function _onAddColumn(insertedColumnIndex) {
            if(isColumnIconNotify == true && insertedColumnIndex >= 0) {
                var _columnType = columnInfo.getColumnType();
                var _id = null;
                switch (_columnType) {
                    case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED :
                        _id = columnInfo.getCommunityInfomation().getRoomId();
                        break;
                    case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
                        _id = columnInfo.getChatRoomInfomation().getRoomId();
                        break;
                    case ColumnInformation.TYPE_COLUMN_CHAT :
                        _id = columnInfo.getFilterCondition();
                        break;
                    default :
                        break;
                }
                var _notificationSettingManager = NotificationSettingManager.getInstance();
                if (!_notificationSettingManager.isSetting(_columnType, _id)) {
                    ColumnIconArea.getInstance().receiveMessage(insertedColumnIndex);
                }
            }
            if(callback != null && typeof callback == 'function') {
                callback();
            }
        }
        let setColumnPosition = _lastColumnObj;
        if(beforeColumn != null && typeof beforeColumn == 'object'){
            setColumnPosition = beforeColumn;
        }
        _self.insertAfterColumn(columnInfo, setColumnPosition, isScroll, isAttention, _onAddColumn);
    };

    _proto.addColumnInfo = function(columuntype,isAttention, isColumnIconNotify, beforeColumn) {
        var _self = this;
        var _columnInfo = new FilterColumnInfomation();
        _columnInfo.setColumnType(columuntype);
        _columnInfo.setFilterCondition('');
        var _filter = ColumnFilterManager.getColumnFilter(columuntype, null);
        if(_filter == null) { return false; }
        var _searchCondition = new ColumnSearchCondition(_filter, new ColumnSortCondition());
        _columnInfo.setSearchCondition(_searchCondition, isAttention);

        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify, undefined, beforeColumn);
        return true;
    };

    _proto.addInboxColumn = function(isAttention, isColumnIconNotify) {
        var _self = this;
        var _columnInfo = ViewUtils.createIndexColumnInfo();
        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify);
        return true;
    };

    _proto.addQuestionnaireColumn = function(isAttention, isColumnIconNotify) {
        var _self = this;
        var _columnInfo = ViewUtils.createQuestionnaireColumnInfo();
        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify);
        return true;
    };

    _proto.addTaskColumn = function(taskGroup, isAttention, isColumnIconNotify) {
        var _self = this;
        var _columnInfo = new ColumnInformation();
        _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_TASK);
        var _jid = LoginUser.getInstance().getJid();
        var _condition = ViewUtils.getTaskFilterAndSortCondition(_jid);
        _columnInfo.setFilterCondition(_condition.getFilterConditionJSONString());
        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify);
        return true;
    };

    _proto.addChatColumn = function(jid, isAttention, isColumnIconNotify, beforeColumn) {
        var _self = this;
        if(!jid) { return false; }
        if(jid == LoginUser.getInstance().getJid()) { return false; }
        var _columnInfo = new ColumnInformation();
        var _newMark = false;
        _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_CHAT);
        _columnInfo.setFilterCondition(jid);
        if($("#left_sidebar .contact_list").find('li[jid="' + jid + '"]').find('.new_message_notice').size() != 0){
            _newMark = true;
        }

        if(isAttention){
            NotificationIconManager.getInstance()
                                   .removeAttentionHeaderColumnIcon(
                                       'li[jid="'+ jid +'"][columntype="3"].sortable-item .ico');
        }

        SideListView.getInstance().addChatMember(jid, _newMark);
        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify, undefined, beforeColumn);
        return true;
    };

    _proto.addMailColumn = function(isAttention, isColumnIconNotify) {
        var _self = this;
        var _columnInfo = ViewUtils.getMailColumnInfomation();
        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify);
        return true;
    };

    _proto.addRecentColumn = function(isAttention, isColumnIconNotify) {
        var _self = this;
        var _columnInfo = new RecentColumnInfomation();
        _columnInfo.setFilterCondition('');
        var _filter = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_RECENT, null);
        if(_filter == null) { return false; }
        var _searchCondition = new ColumnSearchCondition(_filter, new ColumnSortCondition());
        _columnInfo.setSearchCondition(_searchCondition, isAttention);

        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify);
        return true;
    };

    _proto.addGroupChatColumn = function(roomId, isAttention, isColumnIconNotify, beforeColumn) {
        var _self = this;
        if(!roomId) { return false; }
        var _columnInfo = new ColumnInformation();
        function _callback(roomInfo){
            if(roomInfo == null){
                return false;
            }
            _columnInfo = ViewUtils.getGroupChatColumnInfo(roomInfo);
            _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify, undefined, beforeColumn);
            if(isAttention){
                NotificationIconManager.getInstance()
                                       .removeAttentionHeaderColumnIcon(
                                           'li[msgto="'+ roomId +'"][columntype="'+ColumnInformation.TYPE_COLUMN_GROUP_CHAT
                                           +'"].sortable-item .ico_group');
            }
            return true;
        };
        CubeeController.getInstance().getRoomInfo(roomId, _callback);
    };

    _proto.addCommunityFeedColumn = function(communityId, isAttention, isColumnIconNotify, beforeColumn) {
        var _self = this;
        if(!communityId) { return false; }
        var _communityInfo = new CommunityInfo();
        _communityInfo.setRoomId(communityId);
        var _columnInfo = ViewUtils.getCommunityFeedColumnInfo(_communityInfo);
        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify, undefined, beforeColumn);
        if(isAttention){
            NotificationIconManager.getInstance()
                                   .removeAttentionHeaderColumnIcon(
                                       'li[msgto="'+ communityId
                                       +'"][columntype="'+ ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED
                                       +'"].sortable-item .ico_project');
        }
        return true;
    };

    _proto.addCommunityTaskColumn = function(communityId, isAttention, isColumnIconNotify) {
        var _self = this;
        if(!communityId) { return false; }
        var _communityInfo = new CommunityInfo();
        _communityInfo.setRoomId(communityId);
        var _columnInfo = ViewUtils.getCommunityTaskColumnInfo(_communityInfo);
        _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify);
        if(isAttention){
            NotificationIconManager.getInstance()
                                   .removeAttentionHeaderColumnIcon(
                                       'li[msgto="'+communityId+'"][columntype="'
                                       +ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK
                                       +'"].sortable-item .ico_system');
        }
        return true;
    };

    _proto.addMurmurColumn = function(jid, isAttention, isColumnIconNotify, beforeColumn) {
        var _self = this;
        if(!jid) { return false; }
        const _columnInfo = ViewUtils.getMurmurColumnInfo(jid);
        if(isAttention){
            NotificationIconManager.getInstance()
                                   .removeAttentionHeaderColumnIcon(
                                       'li[jid="'+ jid +'"][columntype=18].sortable-item .ico');
        }
        CubeeServerConnector.getInstance().getMurmurColumnName(jid)
               .then((res)=>{
                   if(typeof res.content == 'object' &&
                      typeof res.content.result == 'boolean' &&
                      res.content.result &&
                      typeof res.content.columnName == 'string'){
                        const _columnName = decodeURIComponent(res.content.columnName);
                       _columnInfo._columnName = _columnName;
                       _self.addColumn(_columnInfo, true, isAttention, isColumnIconNotify, undefined, beforeColumn);
                   }
               });
        return true;
    };

    _proto.insertAfterColumn = function(columnInfo, beforeColumn, isScroll, isAttention, callback) {
        var _self = this;
        function _onInsertAfter(insertedColumnIndex) {
            if(callback != null && typeof callback == 'function') {
                setTimeout(function() {
                    callback(insertedColumnIndex);
                }, 1);
            }
        }
        var _ret = false;

        if (_validation({'columnInfo' : columnInfo}) == false) {
            return _ret;
        } else if (beforeColumn) {
            if (_validation({'beforeColumn' : beforeColumn}) == false){ return _ret; }
        }
        if(isScroll != false) {
            isScroll = true;
        }

        var _alreadyExistColumnIndex = _self._getColumnIndex(columnInfo);

        console.log("_alreadyExistColumnIndex:" + _alreadyExistColumnIndex);

        if (_alreadyExistColumnIndex >= 0) {
            var _isAttention = true;
            var _columnType = columnInfo.getColumnType();
            if(_columnType == ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION){
                var _existColumnInfo = _self.getColumnList().get(_alreadyExistColumnIndex);
                var _existColumnParentItemId = _existColumnInfo.getParentItemId();
                if(columnInfo.getParentItemId() != _existColumnParentItemId){
                    var _existColumnObj = _self.getColumnObjList().get(_alreadyExistColumnIndex);
                    _self.removeColumn(_existColumnObj, true);
                    _isAttention = false;
                }
            }
            if(_isAttention){
                if(isScroll) {
                    LayoutManager.switchToColumn();
                    _self.bringColumnIntoView(_alreadyExistColumnIndex);
                }
                _self.attentionColumn(_alreadyExistColumnIndex, isAttention);
                _onInsertAfter(_alreadyExistColumnIndex);
                return true;
            }
        };
        var _columnType = columnInfo.getColumnType();
        var _columnView = Utils.getSafeValue(columViewList, _columnType, ColumnView);
        if (_columnView == undefined) {
            console.log('[insertAfterColumn] invalid columnType' + _columnType);
            return _ret;
        }

        var _columnObj = null;
        var _tabInfo = TabManager.getInstance().getCurrentTabInfo();
        var _tabType = _tabInfo.type;
        var _dspName = columnInfo.getDisplayName();
        var _dspImage = columnInfo.getIconImage();
        _columnObj = new _columnView(columnInfo, _tabType);
        if((_dspName != "") && (_columnType == ColumnInformation.TYPE_COLUMN_CHAT)){
            columnInfo.setDisplayName(_dspName);
            if(_dspImage != ""){
                columnInfo.setIconImage(_dspImage);
            }
        }
        if (_columnType == ColumnInformation.TYPE_COLUMN_TIMELINE) {
            ColumnTimelineView.setInstance(_columnObj);
        }
        // This guard always evaluates to false.
        // if (_columnObj == null) {
        //    return _ret;
        // }
        var _columnElement = _columnObj._htmlElement;

        var _container = _self._getColumnInnerContainer();
        var _columnObjList = _self.getColumnObjList();
        var _columnCount = _columnObjList.getCount();
        var _columnIndex = -2;
        if(beforeColumn != null) {
            for (var _i = 0; _i < _columnCount; _i++) {
                if (_columnObjList.get(_i) == beforeColumn) {
                    _columnIndex = _i;
                    break;
                }
            }
        } else {
            _columnIndex = -1;
        }
        if(_columnIndex == -1) {
            _container.prepend(_columnElement);
            _columnIndex += 1;
        } else if (_columnIndex == -2) {
            _container.append(_columnElement);
            _columnIndex = _container.children().length - 1;
        } else {
            _container.children().eq(_columnIndex).after(_columnElement);
            _columnIndex += 1;
        }
        var _insertedPosition = _columnIndex;

        _self.getColumnList().insert(_insertedPosition, columnInfo);
        _self.getColumnObjList().insert(_insertedPosition, _columnObj);
        LayoutManager.switchToColumn();
        ColumnIconArea.getInstance().insertIcon(_insertedPosition, columnInfo);
        if(isScroll) {
            _self.bringColumnIntoView(_insertedPosition);
        }
        function _onSaveColumnList() {
            _onInsertAfter(_insertedPosition);
        }
        _self.saveColumnList(_onSaveColumnList);
        _self.attentionColumn(_insertedPosition, isAttention);
        _ret = true;
        if(ViewUtils.isIE89()) {
            SideListView.getInstance().resizeContents();
        }
        return _ret;
    };

    _proto.saveColumnList = function(callback) {
        var _self = this;
        var _columnListId = _self._columnListId;
        var _columnInfoList = _self.getColumnList();
        TabColumnStateStore.getInstance().setColumnList(_columnListId, _columnInfoList, _onSetCallBack);

        function _onSetCallBack(){
            if(callback != null && typeof callback == 'function'){
                callback();
            }
        }
    };

    _proto._getColumnIndex = function(columnInfo) {
        var _self = this;
        var _ret = -1;
        var _columnType = columnInfo.getColumnType();
        var _filterCondition = columnInfo.getFilterCondition();
        if (_validation({'filterCondition' : _filterCondition}) == false) {
            return _ret;
        }
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            if (_columnInfo.getColumnType() == _columnType) {
                if (_filterCondition != null) {
                    if (_columnInfo.getFilterCondition() == _filterCondition && (_self._booleanColumnType(_columnType) == true)) {
                        _ret = _i;
                        break;
                    } else if(_columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT && _columnInfo.getChatRoomInfomation().getRoomId() == columnInfo.getChatRoomInfomation().getRoomId()) {
                        _ret = _i;
                        break;
                    } else if(_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED && _columnInfo.getCommunityInfomation().getRoomId() == columnInfo.getCommunityInfomation().getRoomId()) {
                        _ret = _i;
                        break;
                    } else if(_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK && _columnInfo.getCommunityInfomation().getRoomId() == columnInfo.getCommunityInfomation().getRoomId()) {
                        _ret = _i;
                        break;
                    } else if(_columnType == ColumnInformation.TYPE_COLUMN_MURMUR &&
                              (
                                  MurmurColumnInformation.getOwnJidFromSearchCondition(_columnInfo) != null &&
                                  MurmurColumnInformation.getOwnJidFromSearchCondition(columnInfo) != null &&
                                  MurmurColumnInformation.getOwnJidFromSearchCondition(_columnInfo)
                                  == MurmurColumnInformation.getOwnJidFromSearchCondition(columnInfo)
                              )) {
                        _ret = _i;
                        break;
                    }
                } else {
                    _ret = _i;
                    break;
                }
            }
        }
        return _ret;
    };

    _proto._booleanColumnType = function(columnType) {
        var _ret ;
        switch(columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE :
            case ColumnInformation.TYPE_COLUMN_CHAT :
            case ColumnInformation.TYPE_COLUMN_TASK :
            case ColumnInformation.TYPE_COLUMN_INBOX :
            case ColumnInformation.TYPE_COLUMN_MENTION :
            case ColumnInformation.TYPE_COLUMN_MAIL :
            case ColumnInformation.TYPE_COLUMN_RECENT :
            case ColumnInformation.TYPE_COLUMN_TOME :
            case ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION :
            case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE:
                _ret = true;
                break;
            default :
                _ret = false;
                break;
        }
        return _ret;
    };
    _proto._getColumnElement = function(index) {
        if (_validation({'index' : index}) == false) {
            return null;
        }
        var _self = this;
        var _container = _self._getColumnInnerContainer();
        return _container.children().eq(index);
    };
    _proto._resizeAllColumnWidth = function() {
        var _self = this;
        var _bodyOuterWidthM = $('body').outerWidth(true);
        var _mainContainerOuterWidthM = _bodyOuterWidthM;
        var _listContainer = $('#listContainer');
        var _listInnerContainer = $('#listInnerContainer');
        var _listContainerOuterWidthM = $(_listContainer).outerWidth(true);
        if ($(_listInnerContainer).is(':hidden')) {
            _listContainerOuterWidthM = $('#toggler').outerWidth(true);
        }
        if(LayoutManager.isMobile) _listContainerOuterWidthM = 0;
        var _columnContainerOuterWidthM = _mainContainerOuterWidthM - _listContainerOuterWidthM;
        if (ViewUtils.isIE89()) _columnContainerOuterWidthM -= 1;
        var _columnContainerObj = $('#columnContainer');
        var _columnInnerContainerObj = $('#columnInnerContainer');
        var _columnObj = $('.column', _columnContainerObj);
        var _targetColumnNum = _columnObj.length - $('.column[style*=display]', _columnContainerObj).length;
        if(ViewUtils.isIE89()) {
            _columnObj = $('.column', _columnInnerContainerObj);
            _targetColumnNum = _columnObj.length - $('.column[style*=display]', _columnInnerContainerObj).length;
        }
        var _columnOuterMinWidthM = _MIN_COLUMN_WIDTH;
        if(LayoutManager.isMobile) _columnOuterMinWidthM = _mainContainerOuterWidthM;
        var _columnNum = _targetColumnNum;
        var _displayableColumnNum = Math.floor(_columnContainerOuterWidthM / _columnOuterMinWidthM);
        if (_targetColumnNum > _displayableColumnNum) {
            _columnNum = _displayableColumnNum;
        }
        var _columnOuterWidthMNew = Math.floor((_columnContainerOuterWidthM-2) / _columnNum);
        if (_targetColumnNum > _displayableColumnNum) {
            _columnOuterWidthMNew = _columnOuterMinWidthM;
        }
        var _columnOuterWidthM = _columnObj.outerWidth(true);
        var _columnMarginW = parseInt(_columnObj.css('marginLeft')) + parseInt(_columnObj.css('marginRight'));
        var _columnWidthNew = _columnOuterWidthMNew - _columnMarginW;
        _columnObj.css('width', _columnWidthNew);
        _columnContainerObj.css('width', _columnContainerOuterWidthM);
        if (ViewUtils.isIE89()) {
            var _mainHmin = 38;
            var _mainHmax = 76;
            var _mainHeaderH = $('#mainHeader').outerHeight(true);
            var _menubarW = $('#menubar').outerWidth(true);
            var _actionbarW = $('#actionbar').outerWidth(true);
            var _optionbarW = $('#menuoptionalfunction').outerWidth(true);
            if (LayoutManager.isMobile) {
                if( _mainHeaderH != _mainHmin) $('#mainHeader').css('height', _mainHmin);
            } else {
                if (_bodyOuterWidthM < _menubarW + _optionbarW) {
                    if( _mainHeaderH != _mainHmax) $('#mainHeader').css('height', _mainHmax);
                } else {
                    if( _mainHeaderH != _mainHmin) $('#mainHeader').css('height', _mainHmin);
                }
            }
        }
        var _bodyOuterHeightM = $('body').outerHeight(true);
        var _headerContainerHeightM = Conf.getVal('HEADER_CONTAINER_HEIGHT');
        var _mainHeaderOuterHeightM = $('#mainHeader').outerHeight(true);
        var _mainContainerOuterHeightM = _bodyOuterHeightM - _headerContainerHeightM - _mainHeaderOuterHeightM;
        var _mainContainerObj = $('#mainContainer');
        var _mainContainerMarginH = parseInt(_mainContainerObj.css('marginTop')) + parseInt(_mainContainerObj.css('marginBottom'));
        var _mainContainerBorderH = parseInt(_mainContainerObj.css('borderTopWidth')) + parseInt(_mainContainerObj.css('borderBottomWidth'));
        var _mainContainerPaddingH = parseInt(_mainContainerObj.css('paddingTop')) + parseInt(_mainContainerObj.css('paddingBottom'));
        var _mainContainerHeightNew = _mainContainerOuterHeightM - _mainContainerMarginH - _mainContainerBorderH - _mainContainerPaddingH;
        _mainContainerObj.css('height', _mainContainerHeightNew);

        _listContainer.css('height', _mainContainerHeightNew);
        _listContainer.css('max-height', _mainContainerHeightNew);
        _listContainer.css('min-height', _mainContainerHeightNew);
        _listInnerContainer.css('height', _mainContainerHeightNew);
        _listInnerContainer.css('max-height', _mainContainerHeightNew);
        _listInnerContainer.css('min-height', _mainContainerHeightNew);
        _columnContainerObj.css('height', _mainContainerHeightNew);
        _columnContainerObj.css('max-height', _mainContainerHeightNew);
        _columnContainerObj.css('min-height', _mainContainerHeightNew);
        var columns = _self.getColumnObjList();
        var columnCount = columns.getCount();
        if (ViewUtils.isIE()) { 
            _listContainer.css('max-height', '');
            _listContainer.css('min-height', '');
            _listInnerContainer.css('height', '');
            _listInnerContainer.css('max-height', '');
            _listInnerContainer.css('min-height', '');
            _columnContainerObj.css('height', '');
            _columnContainerObj.css('max-height', '');
            _columnContainerObj.css('min-height', '');
            if (LayoutManager.isMobile) {
                _listInnerContainer.css('width', _mainContainerOuterWidthM);
                _listInnerContainer.css('min-width', _mainContainerOuterWidthM);
                _listInnerContainer.css('max-width', _mainContainerOuterWidthM);
            } else if ($(_listInnerContainer).is(':hidden')) {
            } else {
                var _listInnerContainerNewW = _listContainerOuterWidthM-$('#toggler').outerWidth(true)-1;
                _listInnerContainer.css('width', _listInnerContainerNewW);
                _listInnerContainer.css('min-width', _listInnerContainerNewW);
                _listInnerContainer.css('max-width', _listInnerContainerNewW);
            }
            _listContainer.css('height', _mainContainerHeightNew);
            _listInnerContainer.css('height', _mainContainerHeightNew);

            _columnContainerObj.css('height', _mainContainerHeightNew);
            var _innerContainerW = (_columnOuterWidthMNew*columnCount)+2;
            _columnInnerContainerObj.css('width', _innerContainerW);
            if (_innerContainerW > _columnContainerOuterWidthM) { 
                _columnObj.css('height', _mainContainerHeightNew-17); 
            } else {
                _columnObj.css('height', _mainContainerHeightNew); 
            }
        }

        if(LayoutManager.isMobile) $(_listInnerContainer).css('height', _mainContainerHeightNew);

        this._imageMaxWidth = _columnWidthNew - (55 + 30);
        $('.image-thumbnail').css('max-width', this._imageMaxWidth);

    };
    _proto.getTargetColumnsInfoArrayList = function(msg) {
        var _self = this;
        var _ret = new ArrayList();
        var _targetColumnsIndex = _self._getTargetColumnsIndex(msg);
        if(_targetColumnsIndex == null) {
            return _ret;
        }
        var _columnCount = _targetColumnsIndex.getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnIndex = _targetColumnsIndex.get(_i);
            if(_columnIndex == null) {
                continue;
            }
            var _columnInfo = _self.getColumnList().get(_columnIndex);
            if(_columnInfo == null) {
                continue;
            }
            _ret.add(_columnInfo);
        }
        return _ret;
    };
    _proto._getTargetColumnsIndex = function(msg) {
        var _self = this;
        var _ret = null;
        if (_validation({'message' : msg}) == false) {
            return _ret;
        }
        var _messageType = msg.getType();
        switch(_messageType) {
            case Message.TYPE_PUBLIC:
                _ret = _self._getPublicMessageTargetColumnsIndex(msg);
                break;
            case Message.TYPE_CHAT:
                _ret = _self._getChatMessageTargetColumnsIndex(msg);
                break;
            case Message.TYPE_GROUP_CHAT:
                _ret = _self._getGroupChatMessageTargetColumnsIndex(msg);
                break;
            case Message.TYPE_TASK:
                 _ret = _self._getTaskMessageTargetColumnsIndex(msg);
                break;
            case Message.TYPE_COMMUNITY:
                _ret = _self._getCommunityMessageTargetColumnsIndex(msg);
                break;
            case Message.TYPE_SYSTEM:
                _ret = _self._getSystemMessageTargetColumnsIndex(msg);
                break;
            case Message.TYPE_MAIL:
                _ret = _self._getMailMessageTargetColumnsIndex(msg);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                _ret = _self._getQuestionnaireMessageTargetColumnsIndex(msg);
                break;
            case Message.TYPE_MURMUR:
                _ret = _self._getMurmurMessageTargetColumnsIndex(msg);
                break;
            default:
                console.log('ColumnManager::_getTargetColumnsIndex invalid _type:' + _messageType);
                break;
        }
        if(_ret == null){
            _ret = new ArrayList();
        }
        _self._getMessageTargetColumnsIndex(msg,_ret);
        return _ret;
    };
    _proto._getMessageTargetColumnsIndex = function(message, indexArraylist) {
        if (_validation({'message' : message, 'array' : indexArraylist}) == false) {
            return;
        }
        var _self = this;
        var _ret = indexArraylist;
        var _columnCount = _self.getColumnList().getCount();
        var _columnType = null;
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            _columnType = _columnInfo.getColumnType();
            if (_columnType != ColumnInformation.TYPE_COLUMN_SEARCH &&
                _columnType != ColumnInformation.TYPE_COLUMN_RECENT &&
                _columnType != ColumnInformation.TYPE_COLUMN_TOME &&
                _columnType != ColumnInformation.TYPE_COLUMN_FILTER &&
                _columnType != ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK &&
                _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER &&
                _columnType != ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION &&
                _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_MENTION) {
                    continue;
            }
            if (_columnType != ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION ) {
                if (_columnInfo.getSearchCondition().isColmunChangeable(message)) {
                        _ret.add(_i);
                        continue;
                }
            } else {
                var _columnObj = _self.getColumnObjList().get(_i);
                if (_columnObj.isShowableMessage(message) == true) {
                    _ret.add(_i);
                }
            }
            if(message.getType() == Message.TYPE_TASK) {
                var _parentItemId = message.getParentItemId();
                if(_parentItemId != null && _parentItemId != '') {
                    var _parentTask = CubeeController.getInstance().getMessage(_parentItemId);
                    if(_parentTask != null) {
                        if (_columnInfo.getSearchCondition().isColmunChangeable(_parentTask)) {
                            _ret.add(_i);
                            continue;
                        }
                    }
                }
            }
        }
    };
    _proto._getPublicMessageTargetColumnsIndex = function(publicMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : publicMessage}) == false) {
            return _ret;
        }
        var _messageType = publicMessage.getType();
        if (_messageType != Message.TYPE_PUBLIC) {
            return _ret;
        }
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            var _columnType = _columnInfo.getColumnType();
            if (_columnType == ColumnInformation.TYPE_COLUMN_TIMELINE) {
                _ret.add(_i);
            } else if (_columnType == ColumnInformation.TYPE_COLUMN_MENTION) {
                var _isMention = ViewUtils.isMentionMessage(publicMessage);
                if (_isMention) {
                    _ret.add(_i);
                }
            }
        }
        return _ret;
    };
    _proto._getChatMessageTargetColumnsIndex = function(chatMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : chatMessage}) == false) {
            return _ret;
        }
        var _messageType = chatMessage.getType();
        if (_messageType != Message.TYPE_CHAT) {
            return _ret;
        }
        var _messageDirection = chatMessage.getDirection();
        var _messageJid = chatMessage.getFrom();
        if (_messageDirection == ChatMessage.DIRECTION_SEND) {
            _messageJid = chatMessage.getTo();
        }
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            if (_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_CHAT) {
                var _filterCondition = _columnInfo.getFilterCondition();
                if (_columnInfo.getFilterCondition() == _messageJid) {
                    _ret.add(_i);
                }
            }
        }
        return _ret;
    }; // add semicolon by TM 2020/04/30
    _proto._getQuestionnaireMessageTargetColumnsIndex = function(questionnaireMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : questionnaireMessage}) == false) {
            return _ret;
        }
        var _messageType = questionnaireMessage.getType();
        if (_messageType != Message.TYPE_QUESTIONNAIRE) {
            return _ret;
        }
        var _columnCount = _self.getColumnList().getCount();
        var _roomType = questionnaireMessage.getRoomType();
        var _roomId = questionnaireMessage.getRoomId();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            var _columnType = _columnInfo.getColumnType();
            if (_columnType == ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE) {
                _ret.add(_i);
            } else if (_columnType == ColumnInformation.TYPE_COLUMN_TIMELINE){
                if(_roomType == QuestionnaireRegister.ROOM_TYPE_FEED){
                    _ret.add(_i);
                }
            } else if (_columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT){
                var _roomInfo = _columnInfo.getChatRoomInfomation();
                var _groupChatRoomId = _roomInfo.getRoomId();
                if(_roomType == QuestionnaireRegister.ROOM_TYPE_GROUPCHAT && _groupChatRoomId == _roomId){
                    _ret.add(_i);
                }
            } else if (_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED){
                var _communityInfo = _columnInfo.getCommunityInfomation();
                var _communityRoomId = _communityInfo.getRoomId();
                if(_roomType == QuestionnaireRegister.ROOM_TYPE_COMMUNITY && _communityRoomId == _roomId){
                    _ret.add(_i);
                }
            }
        }
        return _ret;
    };
    _proto._getTaskMessageTargetColumnsIndex = function(taskMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : taskMessage}) == false) {
            return _ret;
        }
        var _messageType = taskMessage.getType();
        if (_messageType != Message.TYPE_TASK) {
            return _ret;
        }
        var _parentTaskMessage = CubeeController.getInstance().getMessage(taskMessage.getParentItemId());
        var _target = [];
        _target[0] = taskMessage;
        if (_parentTaskMessage != null) {
            _target[1] = _parentTaskMessage;
        }
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            if (_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_TASK || _columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_INBOX) {
                if(_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_INBOX){
                    var _parentItemId = taskMessage.getParentItemId();
                    var _status = taskMessage.getStatus();
                    var _preStatus = taskMessage.getPreStatus();
                    if((_parentItemId == null || _parentItemId == '') && (_status != TaskMessage.STATUS_INBOX && (_preStatus != TaskMessage.STATUS_INBOX && _preStatus != TaskMessage.STATUS_UNKNOWN))){
                        continue;
                    }else if((_parentItemId == null || _parentItemId == '') && (_status != TaskMessage.STATUS_INBOX && (_preStatus == TaskMessage.STATUS_UNKNOWN))){
                        continue;
                    }
                } else if(_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_TASK) {
                    var _parentItemId = taskMessage.getParentItemId();
                    var _status = taskMessage.getStatus();
                    var _owner = taskMessage.getOwnerJid();
                    var _loginUserJid = LoginUser.getInstance().getJid();
                    if(_owner == _loginUserJid) {
                        if(_status == TaskMessage.STATUS_INBOX || ((_parentItemId != null && _parentItemId != '') && (_status == TaskMessage.STATUS_ASSIGNING))) {
                            continue;
                        }
                    }
                }
                var _columnFilterCondition = _columnInfo.getFilterCondition();
                var _filterCondition = new TaskFilterAndSortCondition();
                var _filterObj = _filterCondition.getFilterObject(_columnFilterCondition);
                var _count = _target.length;
                var _key;
                for (var _l = 0; _l < _count; _l++) {
                    var _added = false;
                    // key is not defined. so define _key. replace variable to _key.
                    for (_key in _filterObj) {
                        if (_filterObj[_key] == '') {
                            continue;
                        }
                        var _propertyVal = _target[_l].getPropertyByFilterKey(_key);
                        if (_propertyVal == '') {
                            continue;
                        }
                        var _filterValArray = _filterObj[_key].split(TaskFilterAndSortCondition.DELIMITER_STRING);
                        var _added = false;
                        var _filterValArrayCount = _filterValArray.length;
                        for (var _j = 0; _j < _filterValArrayCount; _j++) {
                            if (_filterValArray[_j] == _propertyVal) {
                                _ret.add(_i);
                                _added = true;
                                break;
                            } else if (_key == TaskFilterAndSortCondition.FILTER_KEY_OWNER) {
                                if (_filterValArray[_j] == _target[_l].getPreOwnerJid()) {
                                    _ret.add(_i);
                                    _added = true;
                                    break;
                                }
                            } else if (_key == TaskFilterAndSortCondition.FILTER_KEY_STATUS) {
                                if (_filterValArray[_j] == _target[_l].getPreStatus()) {
                                    _ret.add(_i);
                                    _added = true;
                                    break;
                                }
                            }
                        }
                        if (_added == true) {
                            break;
                        }
                    }
                    if (_added == true) {
                        break;
                    }
                }
            }
        }
        return _ret;
    };
    _proto._getSystemMessageTargetColumnsIndex = function(systemMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : systemMessage}) == false) {
            return _ret;
        }
        var _messageType = systemMessage.getType();
        if (_messageType != Message.TYPE_SYSTEM) {
            return _ret;
        }
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            if (_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_TIMELINE) {
                if (_columnInfo.getFilterCondition() == '') {
                    _ret.add(_i);
                }
            }
        }
        return _ret;
    };
    _proto._getInboxMessageTargetColumnsIndex = function(inboxMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : inboxMessage}) == false) {
            return _ret;
        }
        var _messageType = inboxMessage.getType();
        if (_messageType != Message.TYPE_TASK) {
            return _ret;
        }
        var _parentTaskMessage = CubeeController.getInstance().getMessage(inboxMessage.getParentItemId());
        var _target = [];
        _target[0] = inboxMessage;
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            if (_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_INBOX) {
                var _columnFilterCondition = _columnInfo.getFilterCondition();
                var _filterCondition = new TaskFilterAndSortCondition();
                var _filterObj = _filterCondition.getFilterObject(_columnFilterCondition);
                var _count = _target.length;
                for (var _l = 0; _l < _count; _l++) {
                    var _added = false;
                    var _itemId = _target[_l].getItemId();
                    var _childTask = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
                    var _key;
                    if(_childTask != null){
                        return _ret;
                    }
                    for (_key in _filterObj) {
                        if (_filterObj[_key] == '') {
                            continue;
                        }
                        var _propertyVal = _target[_l].getPropertyByFilterKey(_key);
                        if (_propertyVal == '') {
                            continue;
                        }
                        var _filterValArray = _filterObj[_key].split(TaskFilterAndSortCondition.DELIMITER_STRING);
                        var _added = false;
                        var _filterValArrayCount = _filterValArray.length;
                        for (var _j = 0; _j < _filterValArrayCount; _j++) {
                            if (_filterValArray[_j] == _propertyVal) {
                                _ret.add(_i);
                                _added = true;
                                break;
                            } else if (_key == TaskFilterAndSortCondition.FILTER_KEY_OWNER) {
                                if (_filterValArray[_j] == _target[_l].getPreOwnerJid()) {
                                    _ret.add(_i);
                                    _added = true;
                                    break;
                                }
                            }
                        }
                        if (_added == true) {
                            break;
                        }
                    }
                    if (_added == true) {
                        break;
                    }
                }
            }
        }
        return _ret;
    };
    _proto._getGroupChatMessageTargetColumnsIndex = function(groupChatMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : groupChatMessage}) == false) {
            return _ret;
        }
        var _columnCount = _self.getColumnList().getCount();
        var _columnType = null;
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            _columnType = _columnInfo.getColumnType();
            if (_columnType != ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                continue;
            }
            if (_columnInfo.getSearchCondition().isColmunChangeable(groupChatMessage)) {
                _ret.add(_i);
            }
        }
        return _ret;
    };

    _proto._getMailMessageTargetColumnsIndex = function(mailMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (mailMessage == null || typeof mailMessage != 'object') {
            return _ret;
        }
        var _messageType = mailMessage.getType();
        if (_messageType != Message.TYPE_MAIL) {
            return _ret;
        }
        var _columnCount = _self._columnList.getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self._columnList.get(_i);
            if (_columnInfo.getColumnType() == ColumnInformation.TYPE_COLUMN_MAIL) {
                _ret.add(_i);
            }
        }
        return _ret;
    };

    _proto._getCommunityMessageTargetColumnsIndex = function(communityMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : communityMessage}) == false) {
            return _ret;
        }
        var _columnCount = _self.getColumnList().getCount();
        var _columnType = null;
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            _columnType = _columnInfo.getColumnType();
            if (_columnType != ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
                continue;
            }
            if (_columnInfo.getSearchCondition().isColmunChangeable(communityMessage)) {
                _ret.add(_i);
            }
        }
        return _ret;
    };

    _proto._getMurmurMessageTargetColumnsIndex = function(murmurMessage) {
        var _self = this;
        var _ret = new ArrayList();
        if (_validation({'message' : murmurMessage}) == false) {
            return _ret;
        }
        var _columnCount = _self.getColumnList().getCount();
        var _columnType = null;
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            _columnType = _columnInfo.getColumnType();
            if (_columnType != ColumnInformation.TYPE_COLUMN_MURMUR) {
                continue;
            }
            if (_columnInfo.getSearchCondition().isColmunChangeable(murmurMessage)) {
                _ret.add(_i);
            }
        }
        return _ret;
    };

    _proto.showMessage = function(msg) {
        if (_validation({'message' : msg}) == false) {
            return false;
        }
        var _type = msg.getType();
        var _showFlg = false;
        switch(_type) {
            case Message.TYPE_PUBLIC:
                _showFlg = this._showMessage(msg, 'message');
                break;
            case Message.TYPE_CHAT:
                _showFlg = this._showMessage(msg, 'chat');
                break;
            case Message.TYPE_GROUP_CAHT:
                break;
            case Message.TYPE_TASK:
                break;
            case Message.TYPE_COMMUNITY:
                break;
            case Message.TYPE_SYSTEM:
                _showFlg = this._showMessage(msg, 'message');
                break;
            default:
                console.log('msg::type>>>' + _type);
                break;
        }
        return _showFlg;
    };
    _proto._showMessage = function(msg, mode) {
        if (_validation({'message' : msg, 'mode' : mode}) == false) {
            return false;
        }
        var _self = this;
        var _ret = false;
        var _targetColumnsIndex = _self._getTargetColumnsIndex(msg);
        if (_targetColumnsIndex == null){
            return _ret;
        }
        var _targetColumnsIndexLength = _targetColumnsIndex.getCount();
        var _notificationSettingManager = NotificationSettingManager.getInstance();
        for (var _i = -2; _i < _targetColumnsIndexLength; _i++) {
            var _idx, _curColumn, _columnObjList, _curColumnObj;
            if(_i == -1){
                _idx = null;
                _curColumn = null;
                _columnObjList = null;
                _curColumnObj = SideMenuRecentView.getInstance();
            } 
            else if(_i == -2){
                if(msg.getType() != Message.TYPE_MURMUR){
                    // add semicolon by TM.
                    continue;
                }
                _idx = null;
                _curColumn = null;
                _columnObjList = null;
                _curColumnObj = SideMenuMurmurView.getInstance();
            }else{
                _idx = _targetColumnsIndex.get(_i);
                // The value assigned to _curColumn here is unused.
                // _curColumn = _self.getColumnList().get(_idx);
                _columnObjList = _self.getColumnObjList();
                _curColumnObj = _columnObjList.get(_idx);
            }
            switch(mode) {
                case 'history':
                    _curColumnObj.showHistoryMessage(msg);
                    _ret = true;
                    break;
                case 'message':
                    _curColumnObj.showMessage(msg);
                    var _columnType = _curColumnObj.getType();
                    if(_columnType == ColumnInformation.TYPE_COLUMN_MENTION ||
                       _columnType == ColumnInformation.TYPE_COLUMN_TOME){
                        if (!_notificationSettingManager.isSetting(_columnType)) {
                            ColumnIconArea.getInstance().receiveMessage(_idx);
                        }
                    }
                    _ret = true;
                    break;
                case 'chat':
                    _curColumnObj.showMessage(msg);
                    var _loginUserJid = LoginUser.getInstance().getJid();
                    var _messageJid = msg.getFrom();
                    if (_loginUserJid != _messageJid) {
                        var _columnType = _curColumnObj.getType();
                        if (_columnType != ColumnInformation.TYPE_COLUMN_FILTER &&
                                _columnType != ColumnInformation.TYPE_COLUMN_SEARCH &&
                                _columnType != ColumnInformation.TYPE_COLUMN_RECENT &&
                                _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {

                            if(_columnType == ColumnInformation.TYPE_COLUMN_TOME){
                                _messageJid = null;
                            }
                            if (!_notificationSettingManager.isSetting(_columnType, _messageJid)) {
                                ColumnIconArea.getInstance().receiveMessage(_idx);
                            }
                        }
                    } else {
                        ColumnIconArea.getInstance().removeColumnNotificationIcon(_idx);
                    }
                    _ret = true;
                    break;
                case 'group-chat':
                    break;
                case 'mytask':
                    break;
                case 'community':
                    break;
                case 'system':
                    break;
                default:
                    console.log('ColumnManager::_showMessage invalid mode:' + mode);
                    break;
            }
        }
        return _ret;
    };

    function _searchShowConversationColumnObj(columnObjList){
        var _count = columnObjList.getCount();
        for (var _i = 0; _i < _count; _i++) {
            var _columnObj = columnObjList.get(_i);
            var _columnType = _columnObj.getType();
            if(_columnType == ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION){
                return _columnObj;
            }
        }
        return null;
    }

    _proto.onNotification = function(notification) {
        var _self = this;
        var _loginUserJid = LoginUser.getInstance().getJid();
        if (_validation({'notification' : notification}) == false) {
            return;
        }
        var _itemId = '';
        var _type = notification.getType();
        switch(_type) {
            case Notification_model.TYPE_GOOD_JOB:
                var _goodJobNotification = notification;
                _itemId = _goodJobNotification.getItemId();
                var _showConversationColumnObj = _searchShowConversationColumnObj(_self.getColumnObjList());
                if( _showConversationColumnObj != null){
                    _showConversationColumnObj.onGoodJobNotificationReceive(notification);
                }
                break;
            case Notification_model.TYPE_TASK:
                var _taskNotification = notification;
                _itemId = _taskNotification.getTaskMessage().getItemId();
                break;
            case Notification_model.TYPE_QUESTIONNAIRE:
                var _questionnaireNotification = notification;
                _itemId = _questionnaireNotification.getQuestionnaireMessage().getItemId();
                break;
            case Notification_model.TYPE_SYSTEM:
                var _systemNotification = notification;
                _itemId = _systemNotification.getSystemMessage().getItemId();
                break;
            case Notification_model.TYPE_MESSAGE_OPTION:
                var _messageOptionNotification = notification;
                var _contentType =_messageOptionNotification.getContentType();
                _itemId = _messageOptionNotification.getItemId();
                if(_contentType == MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK){
                    _self.onDemandTaskNotification(_messageOptionNotification);
                    return;
                }
                var _showConversationColumnObj = _searchShowConversationColumnObj(_self.getColumnObjList());
                if( _showConversationColumnObj != null){
                    _showConversationColumnObj.onMessageOptionNotificationReceive(notification);
                }
                break;
            case Notification_model.TYPE_DELETE_MESSAGE:
                var _deleteMessageNotification = notification;
                _itemId = _deleteMessageNotification.getItemId();
                break;
            case Notification_model.TYPE_GROUP_CHAT:
                var _groupChatMessageNotification = notification;
                var _subType = _groupChatMessageNotification.getSubType();
                if(_subType != GroupChatNotification.SUB_TYPE_MESSAGE){
                    break;
                }
                _itemId = _groupChatMessageNotification.getGroupChatMessage().getItemId();
                break;
            case Notification_model.TYPE_MAIL:
                var _mailMessageNotification = notification;
                _itemId = _mailMessageNotification.getMailMessage().getItemId();
                break;
            case Notification_model.TYPE_COMMUNITY:
                var _communityMessageNotification = notification;
                _itemId = _communityMessageNotification.getCommunityMessage().getItemId();
                break;
            case Notification_model.TYPE_MURMUR:
                var _murmurMessageNotification = notification;
                var _subType =_murmurMessageNotification.getSubType();
                if(_subType == MurmurNotification.SUB_TYPE_MESSAGE){
                    _itemId = _murmurMessageNotification.getMurmurMessage().getItemId();
                }else if(_subType == MurmurNotification.SUB_TYPE_SET_COLUMN_NAME){
                }
                break;
            case Notification_model.TYPE_THREAD_TITLE:
                var _threadTitleUpdateNotification = notification;
                _itemId = _threadTitleUpdateNotification.getThreadRootId();
                break;
            case Notification_model.TYPE_MESSAGE_UPDATE:
                _itemId = notification.getMessage().getItemId();
                var columnList = _self.getColumnObjList();
                for (var i=0; i< columnList.getCount(); i++) {
                    var columnObj = columnList.get(i);
                    var _columnType = columnObj.getType();
                    var columnInfo = _self.getColumnList().get(i);
                    if (_columnType == ColumnInformation.TYPE_COLUMN_SEARCH ||
                        _columnType == ColumnInformation.TYPE_COLUMN_RECENT ||
                        _columnType == ColumnInformation.TYPE_COLUMN_TOME ||
                        _columnType == ColumnInformation.TYPE_COLUMN_FILTER ||
                        _columnType == ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
                        if (columnObj.getMsgObjByItemId(notification._message.getItemId()) &&
                            !columnInfo.getSearchCondition().isColmunChangeable(notification.getMessage())) {
                                columnObj.showUpdateMessage(notification.getMessage());
                                columnObj._getNotAvailableMessageHtmlIfMessageNothing(columnObj._getMsgObjIndexList().getCount());
                        }
                    }
                }
                break;
            case Notification_model.TYPE_EMOTION_POINT:
                _itemId = notification.getItemId();
                break;
            case Notification_model.TYPE_ASSIGN_NOTE:
                if (notification.getThreadRootId()) {
                    _itemId = notification.getThreadRootId();
                } else if (notification.getOldThreadRootId()) {
                    _itemId = notification.getOldThreadRootId();
                }
                break;
            case Notification_model.TYPE_DELETE_NOTE:
                _itemId = notification.getThreadRootId();
                break;
            default:
                break;
        }
        if (_itemId == null || _itemId == '') {
            return;
        }
        var _message = CubeeController.getInstance().getMessage(_itemId);
        var updateMessages = [];
        var targetColumnForThread = new ArrayList();
        if (_type == Notification_model.TYPE_THREAD_TITLE ||
            _type == Notification_model.TYPE_ASSIGN_NOTE ||
            _type == Notification_model.TYPE_DELETE_NOTE) {
            var _messages = CubeeController.getInstance().getAllMessage();
            var _targetMessages = [];
            for (var i=0; i<_messages._length; i++) {
                var messageData = _messages.get(i);
                if (messageData.getThreadRootId()==_itemId){
                    updateMessages.push(messageData.getItemId());
                    _targetMessages.push(messageData);
                }
            }
            if (_type == Notification_model.TYPE_THREAD_TITLE) {
                _message = (!_message) ? CubeeController.getInstance().getMessage(notification.getItemId()) : _message;
                _message = (!_message) ? CubeeController.getInstance().getMessage(updateMessages[0]) : _message;
            }
            var _ColumnsIndex = [];
            for (var i=0; i<_targetMessages.length; i++) {
                _ColumnsIndex = _ColumnsIndex.concat(_self._getTargetColumnsIndex(_targetMessages[i])._array);
            }
            _ColumnsIndex = _ColumnsIndex.filter(function (x, i, self) {
                return self.indexOf(x) === i;
            });
            for (var i=0; i<_ColumnsIndex.length; i++) {
                targetColumnForThread.insert(i, _ColumnsIndex[i]);
            }
        }
        var _targetColumnsIndex = _self._getTargetColumnsIndex(_message);
        if (targetColumnForThread._length) {
            _targetColumnsIndex = targetColumnForThread;
        }
        if (_targetColumnsIndex != null && _targetColumnsIndex.getCount() >= 0) {
            var _targetColumnCount = _targetColumnsIndex.getCount();
            var _notificationSettingManager = NotificationSettingManager.getInstance();
            for (var _i = -2; _i < _targetColumnCount; _i++) {
                var _idx,
                    _columnObjList,
                    _curColumnObj;
                if(_i == -1){
                    _idx = null;
                    _columnObjList = null;
                    _curColumnObj = SideMenuRecentView.getInstance();
                    if(!_curColumnObj.isGotHistory()){
                        continue;
                    }
                } 
                else if(_i == -2){
                    if(_type != Notification_model.TYPE_MURMUR &&
                       (
                           typeof notification.getMessage !== 'function' ||
                           typeof notification.getMessage().getType !== 'function' ||
                           notification.getMessage().getType() != Message.TYPE_MURMUR ||
                           _type != Notification_model.TYPE_MESSAGE_UPDATE
                       ) &&
                       (
                           typeof notification.getItemId !== 'function' ||
                           notification.getItemId().indexOf("murmur_") != 0 ||
                           (
                               _type != Notification_model.TYPE_DELETE_MESSAGE &&
                               _type != Notification_model.TYPE_MESSAGE_OPTION
                           )
                       ) &&
                       (
                           typeof notification.getThreadTitle !== 'function' ||
                           typeof notification.getThreadRootId !== 'function' ||
                           notification.getThreadRootId().indexOf("murmur_") != 0 ||
                           _type != Notification_model.TYPE_THREAD_TITLE
                       ) &&
                       (
                           typeof notification.getThreadRootId !== 'function' ||
                           notification.getThreadRootId().indexOf("murmur_") != 0 ||
                           _type != Notification_model.TYPE_ASSIGN_NOTE
                       ) &&
                       (
                           typeof notification.getOldThreadRootId !== 'function' ||
                           notification.getOldThreadRootId().indexOf("murmur_") != 0 ||
                           (
                               _type != Notification_model.TYPE_ASSIGN_NOTE &&
                               _type != Notification_model.TYPE_DELETE_NOTE
                           )
                       ) &&
                       (
                           typeof notification.getMsgType !== 'function' ||
                           (
                               notification.getMsgType() != Message.TYPE_UNKNOWN &&
                               notification.getMsgType() != Message.TYPE_MURMUR
                           ) ||
                           typeof notification.getItemId !== 'function' ||
                           notification.getItemId().indexOf("murmur_") != 0 ||
                           (
                               _type != Notification_model.TYPE_GOOD_JOB &&
                               _type != Notification_model.TYPE_EMOTION_POINT
                           )
                       )
                    ){
                        continue;
                    }
                    _idx = null;
                    _columnObjList = null;
                    _curColumnObj = SideMenuMurmurView.getInstance();
                    if(!_curColumnObj.getColumnInfo().getSearchCondition().isColmunChangeable(_message)){
                        continue;
                    }
                }else{
                    _idx = _targetColumnsIndex.get(_i);
                    _columnObjList = _self.getColumnObjList();
                    _curColumnObj = _columnObjList.get(_idx);
                }
                var _columnType = _curColumnObj.getType();
                switch(_type) {
                    case Notification_model.TYPE_GOOD_JOB:
                        _curColumnObj.onGoodJobReceive(_itemId);
                        break;
                    case Notification_model.TYPE_EMOTION_POINT:
                        _curColumnObj.onEmotionPointReceive(_itemId);
                        break;
                    case Notification_model.TYPE_TASK:
                        var _doNotifyToColumnIcon = true;
                        var _actionType = _taskNotification.getActionType();
                        if (_actionType == TaskNotification.ACTION_TYPE_ADD) {
                            _curColumnObj.onAddMessageReceive(_message);
                        } else if (_actionType == TaskNotification.ACTION_TYPE_UPDATE) {
                            _curColumnObj.onUpdateMessageReceive(_message);
                        } else {
                            _doNotifyToColumnIcon = false;
                        }
                        if (_columnType == ColumnInformation.TYPE_COLUMN_INBOX) {
                            if (_message.getOwnerJid() != _loginUserJid) {
                                _doNotifyToColumnIcon = false;
                            }
                        }
                        if (_columnType == ColumnInformation.TYPE_COLUMN_TASK) {
                            var isAssigning = _curColumnObj.isAssigningTask(_message);
                            if (isAssigning) {
                                _doNotifyToColumnIcon = false;
                            }
                        }
                        if (_columnType == ColumnInformation.TYPE_COLUMN_FILTER ||
                                _columnType == ColumnInformation.TYPE_COLUMN_SEARCH ||
                                _columnType == ColumnInformation.TYPE_COLUMN_RECENT ||
                                _columnType == ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION ||
                                _columnType == ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {

                            _doNotifyToColumnIcon = false;
                        }
                        if (_doNotifyToColumnIcon) {
                            var _updaterJid = _message.getUpdatedBy();
                            var _ownerJid = _message.getOwnerJid();
                            var _clientJid = _message.getClient();
                            if (_loginUserJid != _updaterJid && ( _ownerJid == _loginUserJid || _clientJid == _loginUserJid )) {
                                View.getInstance().validBlinkTitleBar(800, View.getInstance().getTitle(), View.getInstance().getBlinkTitle());
                                if (!_notificationSettingManager.isSetting(_columnType)) {
                                    ColumnIconArea.getInstance().receiveMessage(_idx);
                                }
                            }
                        }
                        break;
                    case Notification_model.TYPE_SYSTEM:
                        _curColumnObj.onSystemMessageReceive(_message);
                        break;
                    case Notification_model.TYPE_MESSAGE_OPTION:
                        _curColumnObj.onMessageOptionReceive(notification);
                        break;
                    case Notification_model.TYPE_DELETE_MESSAGE:
                       var _deleteFlag = _deleteMessageNotification.getDeleteFlag();
                       var _adminDeleted = _deleteMessageNotification.getAdminDeleted();
                       _curColumnObj.deleteMessage(_itemId, _deleteFlag, _adminDeleted);
                        break;
                    case Notification_model.TYPE_GROUP_CHAT:
                        if (_columnType != ColumnInformation.TYPE_COLUMN_FILTER &&
                                _columnType != ColumnInformation.TYPE_COLUMN_SEARCH &&
                                _columnType != ColumnInformation.TYPE_COLUMN_RECENT &&
                                _columnType != ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION &&
                                _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {

                            if(_loginUserJid != _message.getFrom()){
                                var _id = null;
                                if(_columnType != ColumnInformation.TYPE_COLUMN_TOME){
                                    _id = _curColumnObj.getColumnInfo().getChatRoomInfomation().getRoomId();
                                }
                                if (!_notificationSettingManager.isSetting(_columnType, _id)) {
                                    ColumnIconArea.getInstance().receiveMessage(_idx);
                                }
                            }
                        }
                        _curColumnObj.showMessage(_message);
                        break;
                    case Notification_model.TYPE_MAIL:
                        if (_columnType != ColumnInformation.TYPE_COLUMN_FILTER &&
                                _columnType != ColumnInformation.TYPE_COLUMN_SEARCH &&
                                _columnType != ColumnInformation.TYPE_COLUMN_RECENT &&
                                _columnType != ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION &&
                                _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {

                            if (!_notificationSettingManager.isSetting(_columnType)) {
                                ColumnIconArea.getInstance().receiveMessage(_idx);
                            }
                        }
                        _curColumnObj.onAddMessageReceive(_message);
                        break;
                    case Notification_model.TYPE_COMMUNITY:
                        if (_columnType != ColumnInformation.TYPE_COLUMN_FILTER &&
                                _columnType != ColumnInformation.TYPE_COLUMN_SEARCH &&
                                _columnType != ColumnInformation.TYPE_COLUMN_RECENT &&
                                _columnType != ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION &&
                                _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {

                            if(_loginUserJid != _message.getFrom()){
                                var _id = null;
                                if(_columnType != ColumnInformation.TYPE_COLUMN_TOME &&
                                   _curColumnObj.getColumnInfo()){
                                    _id = _curColumnObj.getColumnInfo().getCommunityInfomation().getRoomId();
                                }
                                if (!_notificationSettingManager.isSetting(_columnType, _id)) {
                                    ColumnIconArea.getInstance().receiveMessage(_idx);
                                }
                            }
                        }
                        _curColumnObj.showMessage(_message);
                        break;
                    case Notification_model.TYPE_MURMUR:
                        _curColumnObj.showMessage(_message);
                        break;
                    case Notification_model.TYPE_THREAD_TITLE:
                        _curColumnObj.onThreadTitleUpdateReceived(updateMessages, notification);
                        break;
                    case Notification_model.TYPE_MESSAGE_UPDATE:
                        _curColumnObj.onMessageUpdateReceived(notification);
                        break;
                    case Notification_model.TYPE_ASSIGN_NOTE:
                    case Notification_model.TYPE_DELETE_NOTE:
                        _curColumnObj.onNoteAssignChangedReceived(updateMessages, notification);
                        break;
                    case Notification_model.TYPE_QUESTIONNAIRE:
                        // The initial value of _doNotifyToColumnIcon is unused, since it is always overwritten.
                        var _doNotifyToColumnIcon; // = true;
                        var _actionType = _questionnaireNotification.getActionType();
                        if (_actionType == QuestionnaireNotification.ACTION_TYPE_ADD) {
                            _curColumnObj.onAddMessageReceive(_message);
                        } else if (_actionType == QuestionnaireNotification.ACTION_TYPE_UPDATE) {
                            _curColumnObj.onUpdateQuestionnaireMessageReceive(_message);
                        } else {
                            _doNotifyToColumnIcon = false;
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        if (_type == Notification_model.TYPE_MESSAGE_OPTION) {
            var _messageOptionNotification = notification;
            var _contentType =_messageOptionNotification.getContentType();
            if (_contentType == MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE){
                var _existingReaderItem = _messageOptionNotification.getExistingReaderItem();
                if(_existingReaderItem != null) {
                    var _person = _existingReaderItem.getPerson();
                    if(_person != null) {
                        var _readerJid = _person.getJid();
                        if(_readerJid == LoginUser.getInstance().getJid()) {
                            if(_message != null){
                                var _columnIconAreaTargetColumnInfoList = _self.getTargetColumnsInfoArrayList(_message);
                                var _columnInfoCount = _columnIconAreaTargetColumnInfoList.getCount();
                                for (var _i = 0; _i < _columnInfoCount; _i++) {
                                    var _columnInfo = _columnIconAreaTargetColumnInfoList.get(_i);
                                    ColumnIconArea.getInstance().removeColumnNotificationIconByColumnInformation(_columnInfo);
                                }
                                NotificationIconManager.getInstance().removeColumnNotificationIconByMessage(_message);
                            }
                            _self.updateMessageReadStatus(_itemId, Message.READ_STATUS_READ);
                        }
                    }
                }
            }
        }
        var _personListDialog = _self._getPersonListDialogObj();
        if (_personListDialog != null) {
            _personListDialog.onNotification(notification);
        }
    };

    _proto.onLoginUserRemoveGroupChatMemberNotification = function(notification) {
        var _self = this;
        var _loginUserJid = LoginUser.getInstance().getJid();
        if (_validation({'notification' : notification}) == false) {
            return;
        }
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_GROUP_CHAT){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != GroupChatNotification.SUB_TYPE_REMOVE_MEMBER){
            return;
        }
        var _roomId = notification.getRoomInfo().getRoomId();
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            var _columnType = _columnInfo.getColumnType();
            if(_columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                if(_columnInfo.getChatRoomInfomation().getRoomId() == _roomId) {
                    var _columnViewObj = _self.getColumnObjList().get(_i);
                    _columnViewObj.notifyRemoveMember(notification);
                }
            }
        }
    };

    _proto.onGroupChatAuthorityChangedNotication = function(notification) {
        var _self = this;
        var _loginUserJid = LoginUser.getInstance().getJid();
        if (_validation({'notification' : notification}) == false) {
            return;
        }
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_GROUP_CHAT){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != GroupChatNotification.SUB_TYPE_AUTHORITY_CHANGED){
            return;
        }
        var _roomId = notification.getRoomInfo().getRoomId();
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            var _columnType = _columnInfo.getColumnType();
            if(_columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                if(_columnInfo.getChatRoomInfomation().getRoomId() == _roomId) {
                    var _columnViewObj = _self.getColumnObjList().get(_i);
                    _columnViewObj.showChangedAuthorityMessage();
                }
            }
        }
    };

    _proto.onLoginUserRemoveCommunityMemberNotification = function(notification) {
        var _self = this;
        var _loginUserJid = LoginUser.getInstance().getJid();
        if (_validation({'notification' : notification}) == false) {
            return;
        }
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_COMMUNITY){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_REMOVE_MEMBER){
            return;
        }
        var _communityId = notification.getRoomId();
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            var _columnType = _columnInfo.getColumnType();
            if(_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
                if(_columnInfo.getCommunityInfomation().getRoomId() == _communityId) {
                    var _columnViewObj = _self.getColumnObjList().get(_i);
                    _columnViewObj.notifyRemoveMember(notification);
                }
            }
        }
    };
    _proto.onCommunityInfoUpdateNotication = function(notification) {
        var _self = this;
        var _loginUserJid = LoginUser.getInstance().getJid();
        if (_validation({'notification' : notification}) == false) {
            return;
        }
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_COMMUNITY){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO){
            return;
        }
        var _updatedCommunityInfo = notification.getUpdatedCommunityInfo();
        var _communityId = _updatedCommunityInfo.getRoomId();
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            var _columnType = _columnInfo.getColumnType();
            if(_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED || _columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
                if(_columnInfo.getCommunityInfomation().getRoomId() == _communityId) {
                    var _columnViewObj = _self.getColumnObjList().get(_i);
                    _columnViewObj.onCommunityInfoUpdateNotication(notification);
                }
            }
        }
    };
    _proto.onCommunityAuthorityChangedNotication = function(notification) {
        var _self = this;
        var _loginUserJid = LoginUser.getInstance().getJid();
        if (_validation({'notification' : notification}) == false) {
            return;
        }
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_COMMUNITY){
            return;
        }
        var _subType = notification.getSubType();
        if(_subType != CommunityNotification.SUB_TYPE_AUTHORITY_CHANGED){
            return;
        }
        var _communityId = notification.getRoomId();
        var _columnCount = _self.getColumnList().getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            var _columnInfo = _self.getColumnList().get(_i);
            var _columnType = _columnInfo.getColumnType();
            if(_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
                if(_columnInfo.getCommunityInfomation().getRoomId() == _communityId) {
                    var _columnViewObj = _self.getColumnObjList().get(_i);
                    _columnViewObj.showChangedAuthorityMessage();
                }
            }
            if(_columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
                if(_columnInfo.getCommunityInfomation().getRoomId() == _communityId) {
                    $("#columnInnerContainer").children("div").eq(_i).find(".column-community-task-frm-message").children("button").eq(0).trigger("mousedown");
                }
            }
        }
        if($('.project_btn').attr('data_value') == _communityId){
            TabManager.getInstance().isCreateGroupchat(_communityId);
        }
    };
    _proto.onDemandTaskNotification = function(notification) {
        var _self = this;
        if (_validation({'notification' : notification}) == false) {
            return;
        }
        var _itemId = '';
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_MESSAGE_OPTION){
            return;
        }
        var _messageOptionJobNotification = notification;
        var _contentType =_messageOptionJobNotification.getContentType();
        if(_contentType != MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK){
            return;
        }
        var _targetColumnsIndex;
        _itemId = _messageOptionJobNotification.getItemId();
        var _baseMessage = CubeeController.getInstance().getMessage(_itemId);
        var _parentItemId = _baseMessage.getParentItemId();
        var _message = CubeeController.getInstance().getMessage(_itemId);
        var _targetColumnsIndexBase = _self._getTargetColumnsIndex(_message);
        if (_targetColumnsIndexBase == null || _targetColumnsIndexBase.getCount() == 0) {
            return;
        }
        var _parentMessage = null;
        if(_parentItemId != ''){
            _parentMessage = CubeeController.getInstance().getMessage(_parentItemId);
        }
        var _targetColumnsIndexParent = _self._getTargetColumnsIndex(_parentMessage);
        if (_targetColumnsIndexParent == null || _targetColumnsIndexParent.getCount() == 0) {
          _targetColumnsIndex = _targetColumnsIndexBase;
        }else{
          _targetColumnsIndex = _margeColumnTargetIndexList(_targetColumnsIndexBase,_targetColumnsIndexParent);

        }
        // Variable '_targetColumnsIndex' cannot be of type null, but it is compared to an expression of type null.
        // _targetColumnsIndex == null は、常に偽
        // if (_targetColumnsIndex == null || _targetColumnsIndex.getCount() == 0) {
        if (_targetColumnsIndex.getCount() == 0) {
            return;
        }

        var _targetColumnCount = _targetColumnsIndex.getCount();
        for (var _i = 0; _i < _targetColumnCount; _i++) {
            var _idx = _targetColumnsIndex.get(_i);
            var _columnObjList = _self.getColumnObjList();
            var _curColumnObj = _columnObjList.get(_idx);
            _curColumnObj.onMessageOptionReceive(notification);
        }

        function _margeColumnTargetIndexList(targetColumnsIndexList, otherTargetColumnsIndexList){
            var _ret = null;
            // This guard always evaluates to false.
            // if (targetColumnsIndexList == null) {
            //    return _ret;
            //}
            // This guard always evaluates to false.
            // if (otherTargetColumnsIndexList == null) {
            //    return _ret;
            //}
            var _idxListCount = otherTargetColumnsIndexList.getCount();
            for (var _i = 0; _i < _idxListCount; _i++) {
                var _idx = otherTargetColumnsIndexList.get(_i);
                if(_checkDuplicate(targetColumnsIndexList,_idx)){
                  continue;
                }
                targetColumnsIndexList.add(_idx);
            }
            _ret = targetColumnsIndexList;
            return _ret;
        }
       function _checkDuplicate(arrayList, val){
           for(var _i =0; _i < arrayList.getCount(); _i++){
               if(val == arrayList.get(_i)){
                 return true;
               }
           }
           return false;
       };
    };
    _proto.onAddMember = function(columnInfo,addedMemberList) {
        if (_validation({'columnInfo' : columnInfo, 'array' : addedMemberList}) == false) {
            return;
        }
        var _self = this;
        var _columnType = columnInfo.getColumnType();
        var _idx = -1;
        switch(_columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_CHAT:
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_INBOX:
            case ColumnInformation.TYPE_COLUMN_SEARCH:
            case ColumnInformation.TYPE_COLUMN_MAIL:
            case ColumnInformation.TYPE_COLUMN_RECENT:
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                _idx = _self._getColumnIndex(columnInfo);
                if(_idx < 0){
                    break;
                }
                var _curColumnObj = _self._columnObjList.get(_idx);
                _curColumnObj.onAddMember(addedMemberList);
                break;
            default:
                console.log('[onAddMember] invalid columnType' + _columnType);
                return;
        }
    };
    _proto.onRemoveMember = function(columnInfo,removedMemberList) {
        if (_validation({'columnInfo' : columnInfo, 'array' : removedMemberList}) == false) {
            return;
        }
        var _self = this;
        var _columnType = columnInfo.getColumnType();
        var _idx = -1;
        switch(_columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_CHAT:
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_INBOX:
            case ColumnInformation.TYPE_COLUMN_SEARCH:
            case ColumnInformation.TYPE_COLUMN_FILTER:
            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
            case ColumnInformation.TYPE_COLUMN_MAIL:
            case ColumnInformation.TYPE_COLUMN_RECENT:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                _idx = _self._getColumnIndex(columnInfo);
                if(_idx < 0){
                    break;
                }
                var _curColumnObj = _self._columnObjList.get(_idx);
                _curColumnObj.onRemoveMember(removedMemberList);
                break;
            default:
                console.log('[onRemoveMember] invalid columnType' + _columnType);
                return;
        }
    };
    _proto.onChangeRoomName = function(columnInfo, chatRoomInfo) {
        if (_validation({'columnInfo' : columnInfo, 'chatRoomInfo' : chatRoomInfo}) == false) {
            return;
        }
        var _self = this;
        var _columnType = columnInfo.getColumnType();
        var _idx = -1;
        switch(_columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_CHAT:
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_INBOX:
            case ColumnInformation.TYPE_COLUMN_SEARCH:
            case ColumnInformation.TYPE_COLUMN_FILTER:
            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
            case ColumnInformation.TYPE_COLUMN_MAIL:
            case ColumnInformation.TYPE_COLUMN_RECENT:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                _idx = _self._getColumnIndex(columnInfo);
                if(_idx < 0){
                    break;
                }
                var _curColumnObj = _self._columnObjList.get(_idx);
                _curColumnObj.onChangeRoomName(chatRoomInfo);
                break;
            default:
                console.log('[onChangeRoomName] invalid columnType' + _columnType);
                return;
        }
    };
    _proto.onChangeGroupChatPrivacyType = function(columnInfo, chatRoomInfo) {
        if (_validation({'columnInfo' : columnInfo, 'chatRoomInfo' : chatRoomInfo}) == false) {
            return;
        }
        var _self = this;
        // Variable _idx is used like a local variable, but is missing a declaration.
        var _idx = _self._getColumnIndex(columnInfo);
        if(_idx < 0){
            return;
        }
        var _curColumnObj = _self._columnObjList.get(_idx);
        _curColumnObj.onChangeGroupChatPrivacyType(chatRoomInfo);
    };
    // Avoid automated semicolon insertion

    _proto.removeColumn = function(columnObject, isSoon) {
        var _self = this;
        if (_validation({'columnObject' : columnObject}) == false) {
            return;
        }
        var _elem = columnObject.getHtmlElement();
        if(_elem == null) {
            return;
        }
        var _index = 0;
        function removeColmnData() {
            var _columnObjList = _self.getColumnObjList();
            var _columnCount = _columnObjList.getCount();
            for (var _i = 0; _i < _columnCount; _i++) {
                if (_columnObjList.get(_i) == columnObject) {
                    columnObject.cleanup();
                    _index = _i;
                    _columnObjList.remove(_i);
                    _self.getColumnList().remove(_i);
                    break;
                }
            }
            ColumnIconArea.getInstance().removeIcon(_index);
            if(_elem != null) {
                _elem.find('*').off();
                _elem.off();
                _elem.find('*').remove();
                _elem.remove();
            }
            _self.saveColumnList();
            if(ViewUtils.isIE89()) {
                SideListView.getInstance().resizeContents();
            }
        }
        // Variable '_elem' cannot be of type null, but it is compared to an expression of type null.
        // if ((isSoon == null || isSoon == false) && _elem != null) {
        if (isSoon == null || isSoon == false) {
            _elem.hide('clip', 'fast', function() {
                removeColmnData();
                $(this).off();
                columnObject = null;
                _elem = null;
            });
        } else {
            removeColmnData();
            _elem = null;
        }
    };
    _proto.hasShowableColumnByMessage = function(message) {
        var _self = this;
        var _targetColumnsIndex = _self._getTargetColumnsIndex(message);
        if (_targetColumnsIndex == null || _targetColumnsIndex.getCount() == 0) {
            return false;
        }
        var _ret = false;
        var _targetColumnCount = _targetColumnsIndex.getCount();
        var _isMention = ViewUtils.isMentionMessage(message);
        for (var _i = 0; _i < _targetColumnCount; _i++) {
            var _idx = _targetColumnsIndex.get(_i);
            var _curColumnObj = _self._columnObjList.get(_idx);
            var _columnType = _curColumnObj.getType();
            if (_isMention) {
                if (_columnType != ColumnInformation.TYPE_COLUMN_TIMELINE &&
                       _columnType != ColumnInformation.TYPE_COLUMN_FILTER &&
                       _columnType != ColumnInformation.TYPE_COLUMN_SEARCH &&
                       _columnType != ColumnInformation.TYPE_COLUMN_RECENT &&
                       _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
                    _ret = true;
                    break;
                }
            } else {
                if (_columnType != ColumnInformation.TYPE_COLUMN_FILTER &&
                       _columnType != ColumnInformation.TYPE_COLUMN_SEARCH &&
                       _columnType != ColumnInformation.TYPE_COLUMN_RECENT &&
                       _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
                    _ret = true;
                    break;
                }
            }
        }
        return _ret;
    };
    _proto.isDisplayedByItemId = function(itemId) {
        var _self = this;
        var _ret = false;
        var _message = CubeeController.getInstance().getMessage(itemId);
        if(_message == null) {
            return _ret;
        }
        var _columnObjList = _self.getColumnObjList();
        var _columnCount = _self.getColumnList().getCount();
        var _columnType = null;
        for (var _i = 0; _i < _columnCount; _i++) {
            var _curColumnObj = _columnObjList.get(_i);
            _columnType = _curColumnObj.getType();
            if (_columnType != ColumnInformation.TYPE_COLUMN_FILTER &&
               _columnType != ColumnInformation.TYPE_COLUMN_SEARCH &&
               _columnType != ColumnInformation.TYPE_COLUMN_RECENT &&
               _columnType != ColumnInformation.TYPE_COLUMN_MENTION &&
               _columnType != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
                var _msgObj = _curColumnObj.getMsgObjByItemId(itemId);
                if (_msgObj != null) {
                    _ret = true;
                    break;
                }
            }
        }
        return _ret;
    };
    _proto.getDemandTaskCount = function(columnInfo) {
        var _self = this;
        if (_validation({'columnInfo' : columnInfo}) == false) {
            return false;
        }
        var _idx = _self._getColumnIndex(columnInfo);
        if(_idx < 0){
            return false;
        }
        var _curColumnObj = _self._columnObjList.get(_idx);
        return _curColumnObj.getDemandTaskCount();
    };

    _proto.bringColumnIntoView = function(index, _callback = function(){}) {
        var _self = this;
        if (_validation({'index' : index}) == false) {
            return;
        }
        var _columnObjList = _self.getColumnObjList();
        var _curColumnObj = _columnObjList.get(index);
        if (_curColumnObj == null) {
            return;
        }
        var _columnElement = _curColumnObj.getHtmlElement();
        if (_columnElement == null) {
            return;
        }
        LayoutManager.resetScreenLayout();
        LayoutManager.iconAreaScrollToShow(index);


        var _offsetLeftbar;
        if($("#left_sidebar").offset().left < 0){
            _offsetLeftbar = 0;
        }else{
            // Avoid automated semicolon insertion
            _offsetLeftbar = parseInt($("#left_sidebar").width());
        }
        var _offsetLeft = _columnElement.offset().left; 
        _offsetLeft -= _offsetLeftbar + parseInt($("#columnInnerContainer").css("padding-left"));
        var _offsetWidth = parseInt(_columnElement.width()) + parseInt($("#columnInnerContainer").children("div").eq(0).css("margin-right"));
        var _columnLeft = -Math.floor((-_columnElement.offset().left) + $("#columnInnerContainer").children("div").eq(0).offset().left);
        var _columnContainer = _self._getColumnContainer(); 
        if(_offsetLeft > 0) {
            var _offsetRight = _offsetLeft + _offsetWidth;            
            var _containerWidth = parseInt(_columnContainer.width()); 
            if(_offsetRight > _containerWidth) {
                _columnLeft = _columnLeft - _containerWidth + _offsetWidth + 40;
            } else {
                _callback();
                return;
            }
        } 
        // else {
        //   This expression assigns variable _columnLeft to itself. not edited
        //    _columnLeft = _columnLeft;
        // }
        if(_columnLeft < 0){
            _columnLeft = 0;        
        }
        _columnContainer.animate({
            scrollLeft : _columnLeft
        }, 'slow', _callback);
        _columnContainer = null;
    };

    _proto.bringLeftMostColumn = function() {
        var _self = this;
        var _curColumnObj = _self._columnObjList.get(0);
        if (_curColumnObj == null) {
            return;
        }
        var _columnElement = _curColumnObj.getHtmlElement();
        if (_columnElement == null) {
            return;
        }
        var _offsetLeft = _columnElement.offset().left;
        var _columnContainer = _self._getColumnContainer();
        _columnContainer.animate({
            scrollLeft : _offsetLeft
        }, 50);
    };
    _proto.updateColumnIconTitle = function(columnObject) {
        var _self = this;
        var _updateColumnIconIndex = -1;
        var _columnObjList = _self.getColumnObjList();
        var _columnCount = _columnObjList.getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            if (_columnObjList.get(_i) == columnObject) {
                _updateColumnIconIndex = _i;
                break;
            }
        }
        if(_updateColumnIconIndex < 0) {
            console.log('ColumnManager::updateColumnIcon : index is not found');
            return;
        }
        ColumnIconArea.getInstance().updateIconTitle(_updateColumnIconIndex);
    };
    _proto.updateColumnIcon = function(columnObject){
        var _self = this;
        var _updateColumnIconIndex = -1;
        var _columnObjList = _self.getColumnObjList();
        var _columnCount = _columnObjList.getCount();
        for (var _i = 0; _i < _columnCount; _i++) {
            if (_columnObjList.get(_i) == columnObject) {
                _updateColumnIconIndex = _i;
                break;
            }
        }
        if(_updateColumnIconIndex < 0) {
            return;
        }
        ColumnIconArea.getInstance().updateColumnIcon(_updateColumnIconIndex);
    // Avoid automated semicolon insertion
    };
     
    _proto.showPersonListDialog = function(dialogPersonListView) {
        var _self = this;
        if(dialogPersonListView == null){
            return;
        }
        dialogPersonListView.showDialog();
        _self._setPersonListDialogObj(dialogPersonListView);
    };

    _proto.closePersonListDialog = function() {
        var _self = this;
        _self._personListDialogObj = null;
    };
    _proto.sortColumn = function(originalIndex, newIndex, isMoveColumnView) {
        var _self = this;
        var _ret = false;
        // This property is overwritten by another property in the same object literal.
        if (_validation({'irugubakIndex' : originalIndex, 'newIndex' : newIndex}) == false) {
            return _ret;
        }
        if (isMoveColumnView != false) {
            isMoveColumnView = true;
        }
        var _columnObjList = _self.getColumnObjList();
        var _curColumnObj = _columnObjList.get(originalIndex);
        if (_curColumnObj == null) {
            return _ret;
        }

        if (isMoveColumnView) {
            var _columnElement = _curColumnObj.getHtmlElement();
            if (_columnElement == null) {
                return _ret;
            }
            var _targetColumnElement = null;
            var _insertedPosition = 0;
            if (newIndex == 0) {
                _targetColumnElement = _self._getColumnElement(newIndex);
                _columnElement.detach();
                _targetColumnElement.before(_columnElement);
                // The value assigned to _insertedPosition here is unused.
                // _insertedPosition = newIndex;
            } else {
                var _targetIndex = -1;
                if (originalIndex < newIndex) {
                    _targetIndex = newIndex;
                } else {
                    _targetIndex = newIndex - 1;
                }
                _targetColumnElement = _self._getColumnElement(_targetIndex);
                if (_targetColumnElement == null) {
                    return _ret;
                }
                _columnElement.detach();
                _targetColumnElement.after(_columnElement);
                // The value assigned to _insertedPosition here is unused.
                // _insertedPosition = _targetIndex + 1;
            }
        }

        _self.getColumnList().move(originalIndex, newIndex);
        _self.getColumnObjList().move(originalIndex, newIndex);

        _self.saveColumnList();

        _ret = true;
        return _ret;
    };
    _proto.sortColumnByColumnView = function(originalIndex, newIndex) {
        var _self = this;
        // Variable _ret is used like a local variable, but is missing a declaration.
        // _ret = _self.sortColumn(originalIndex, newIndex, false);
        var _ret = _self.sortColumn(originalIndex, newIndex, false);
        return _ret;
    };
    _proto.attentionColumn = function(index, isAttention) {
        if (isAttention) {
            var _self = this;
            if (_validation({'index' : index}) == false) {
                return;
            }
            var _columnObjList = _self.getColumnObjList();
            var _curColumnObj = _columnObjList.get(index);
            if (_curColumnObj == null) {
                return;
            }
            var _columnElement = _curColumnObj.getHtmlElement();
            if (_columnElement == null) {
                return;
            }
            if (ViewUtils.isIE89()) {
                var selecter = 'div.column-header-title';
            } else {
                var selecter = 'div.column-header > div[title]';
            }
            $(selecter, _columnElement)
                .fadeOut(this._attentionColumnBlinkTime)
                .fadeIn(this._attentionColumnBlinkTime)
                .fadeOut(this._attentionColumnBlinkTime)
                .fadeIn(this._attentionColumnBlinkTime)
                .fadeOut(this._attentionColumnBlinkTime)
                .fadeIn(this._attentionColumnBlinkTime)
                .fadeOut(this._attentionColumnBlinkTime)
                .fadeIn(this._attentionColumnBlinkTime);
        }
    };
    _proto.updateMessageReadStatus = function(itemId, readFlag) {
        var _self = this;
        var _columnCount = _self.getColumnObjList().getCount();
        var _index = -2;
        var _delay = 1;
        function _asyncDoReadMessage(){
            if(_index >= _columnCount){
                return;
            }
            var _columnObj;
            if(_index == -1){
                _columnObj = SideMenuRecentView.getInstance();
            } 
            else if(_index == -2){
                _columnObj = SideMenuMurmurView.getInstance();
            }else{
                _columnObj = _self.getColumnObjList().get(_index);
            }
            if(_columnObj == null){
                _next();
                return;
            }
            _columnObj.updateMessageReadStatus(itemId, readFlag);
            _next();

            function _next(){
                _index++;
                setTimeout(_asyncDoReadMessage, _delay);
            };
        };
        setTimeout(_asyncDoReadMessage, _delay);
    };
    function _validation(args) {
        for (var p in args) {
            if (p == 'columnInfo' || p == 'beforeColumn' || p == 'message' || p == 'array' || p == 'notification' || p == 'columnObject' || p == 'chatRoomInfo') {
                if (args[p] == null || typeof args[p] != 'object') {return false;}
            } else if (p == 'filterCondition' || p == 'htmlString' || p == 'mode') {
                if (args[p] == null || typeof args[p] != 'string') {return false;}
            } else if (p == 'index') {
                if (args[p] == null || typeof args[p] != 'number' || args[p] < 0) {return false;}
            }
        }
        return true;
    };

    _proto._getChatroomInformationFromColumnObjByRoomId = function(roomId){
        var _self = this;
        var ret = null;
        var _columnObjList = _self.getColumnObjList();
        var _count = _columnObjList.getCount();
        for(var i=0; i<_count; i++){
            if(_columnObjList.get(i).getType() == ColumnInformation.TYPE_COLUMN_GROUP_CHAT){
                var _columnView = _columnObjList.get(i);
                var _info = _columnView._info;
                if(_info){
                    var _roomInfo = _info.getChatRoomInfomation();
                    if(_roomInfo && _roomInfo.getRoomId() == roomId){
                        ret = _roomInfo;
                        break;
                    }
                }
            }
        }
        return ret;
    };
})();
