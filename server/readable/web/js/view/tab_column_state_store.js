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
function TabColumnStateStore() {
    this._localStorage = window.localStorage;
};
(function() {
    TabColumnStateStore.COLUMN_LIST_KEY = 'columnList';
    TabColumnStateStore.SOURCE_COLUMN_TYPE_LIST_DELIMITOR = ',';
    TabColumnStateStore.TAB_LIST_KEY = 'tabList';
    var _proto = TabColumnStateStore.prototype;

    var _thisInstance = null;
    TabColumnStateStore.getInstance = function() {
        if (_thisInstance == null) {
            _thisInstance = new TabColumnStateStore();
        }
        return _thisInstance;
    };
    _proto.getColumnList = function(columnListId, callback) {
        var _self = this;
        var _columnInfoList = null;
        function _callCallback() {
            setTimeout(function() {
                if (callback != null && typeof callback == 'function') {
                    callback(_columnInfoList);
                }
            }, 1);
        };
        var _jid = LoginUser.getInstance().getJid();
        if (_jid == null || typeof _jid != 'string' || _jid == '') {
            _callCallback();
            return;
        }
        var _colmunListId = '';
        if (columnListId != null && typeof columnListId == 'string') {
            _colmunListId = columnListId;
        } else {
            var _host = location.hostname;
            _colmunListId = TabColumnStateStore.COLUMN_LIST_KEY + '_' + _host
                    + '_' + _jid; 
        }

        var _strageData = _self._getItem(_colmunListId);
        function _onCreateColumnInfoList(createdColumnInfoList) {
            _columnInfoList = createdColumnInfoList;
            _callCallback();
        };
        try {
            var _columnInfoListData = JSON.parse(_strageData);
            _getColumnInfoListFromLocalStrageData(_columnInfoListData, _onCreateColumnInfoList);
        } catch (e) {
            _callCallback();
        }
    };
    _proto.setColumnList = function(columnListId, columnInfoList, callback) {
        var _self = this;
        function _callCallback() {
            setTimeout(function() {
                if (callback != null && typeof callback == 'function') {
                    callback();
                }
            }, 1);
        };
        if (columnListId == null || typeof columnListId != 'string'
                || columnListId == '') {
            _callCallback();
            return;
        }
        if (columnInfoList == null || typeof columnInfoList != 'object') {
            _callCallback();
            return;
        }
        var _jid = LoginUser.getInstance().getJid();
        if (_jid == null || typeof _jid != 'string' || _jid == '') {
            _callCallback();
            return;
        }
        var _columnListStrageData = _getColumnLocalStrageDataFromColumnInfoList(columnInfoList);
        if (_columnListStrageData == null) {
            _callCallback();
            return;
        }
        var _columnListStrageDataStr = JSON.stringify(_columnListStrageData);

        if (_self._validationSetLocalStorageString(_columnListStrageDataStr)) {
            _self._setItem(columnListId, _columnListStrageDataStr);
        }
        _callCallback();
    };

    _proto._validationSetLocalStorageString = function(stringData) {
        var _storageStrParse = "";
        try {
            _storageStrParse = JSON.parse(stringData);
        } catch(err) {
            console.log("set localstorage failed! parse str: " + stringData);
            return false;
        }
        for (var i=0; i<_storageStrParse.length; i++) {
            if (!_storageStrParse[i] || !_storageStrParse[i].type) {
                console.log("set localstorage failed! parse str: " + stringData);
                return false;
            }
        }
        return true;
    };

    _proto._getItem = function(key) {
        var _ret = null;
        if (key == null || typeof key != 'string') {
            return _ret;
        }
        var _self = this;
        if (_self._localStorage) {
            _ret = _self._localStorage.getItem(key);
        }
        return _ret;
    };
    _proto._setItem = function(key, val) {
        if (key == null || typeof key != 'string') {
            return;
        }
        var _self = this;
        if (_self._localStorage) {
            _self._localStorage.setItem(key, val);
        }
    };
    function _getColumnInfoListFromLocalStrageData(columnListLocalStrageData, callback) {
        var _ret = null;
        if (columnListLocalStrageData == null
                || typeof columnListLocalStrageData != 'object') {
            callback(_ret);
            return;
        }
        var _count = columnListLocalStrageData.length;
        _ret = new ArrayList();
        var _currentIndex = 0;
        function addColumnInfo() {
            if(_currentIndex >= _count) {
                callback(_ret);
                return;
            }
            var _strageData = columnListLocalStrageData[_currentIndex];
            function _onCreateColumnInfo(columnInfo) {
                if(columnInfo != null) {
                    _ret.add(columnInfo);
                }
                _currentIndex++;
                addColumnInfo();
            };
            _createColumnInfo(_strageData, _onCreateColumnInfo);
        };
        addColumnInfo();
        SideMenuMurmurView.getInstance().showMurmurHistory();
    };
    function _createColumnInfo(localStrageData, callback) {
        var _ret = null;
        if (localStrageData == null || typeof localStrageData != 'object') {
            callback(_ret);
            return;
        }
        var _isAsync = false;
        var _columnType = localStrageData.type;
        switch (_columnType) {
        case ColumnInformation.TYPE_COLUMN_TIMELINE:
            _ret = _createMyFeedColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE:
            _ret = _createMyQuestionnaireColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_CHAT:
            _ret = _createChatColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_TASK:
            _ret = _createTaskColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_INBOX:
            _ret = _createInboxColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_SEARCH:
            _ret = _createSearchColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
            function _onCreateGroupChatColumnInfo(createdColumnInfo) {
                callback(createdColumnInfo);
            };
            _createGroupChatColumnInfo(localStrageData, _onCreateGroupChatColumnInfo);
            _isAsync = true;
            _ret = null;
            break;
        case ColumnInformation.TYPE_COLUMN_MAIL:
            _ret = _createMailColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_RECENT:
            _ret = _createRecentColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_MENTION:
        case ColumnInformation.TYPE_COLUMN_TOME:
            _ret = _createToMeColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_FILTER:
            function _onCreateFilterColumnInfo(createdColumnInfo) {
                callback(createdColumnInfo);
            };
            _createFilterColumnInfo(localStrageData, _onCreateFilterColumnInfo);
            _isAsync = true;
            _ret = null;
            break;
        case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
            function _onCreateCustomFilterColumnInfo(createdColumnInfo) {
                callback(createdColumnInfo);
            };
            _createCustomFilterColumnInfo(localStrageData, _onCreateCustomFilterColumnInfo);
            _isAsync = true;
            _ret = null;
            break;
        case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            _ret = _createCommunityFeedColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
            _ret = _createCommunityTaskColumnInfo(localStrageData);
            break;
        case ColumnInformation.TYPE_COLUMN_MURMUR:
            // This negation always evaluates to true.
            // if(!_isAsync) {
            _createMurmurColumnInfo(localStrageData, callback);
            return;
        default:
            break;
        }
        if(!_isAsync) {
            callback(_ret);
        }
    };

    function _createMyFeedColumnInfo(myFeedColumnLocalStrageData) {
        var _ret = null;
        if (myFeedColumnLocalStrageData == null
                || typeof myFeedColumnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = myFeedColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_TIMELINE) {
            return _ret;
        }
        var _columnInfo = new ColumnInformation();
        _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_TIMELINE);
        _ret = _columnInfo;
        return _ret;
    };

    function _createMyQuestionnaireColumnInfo(myQuestionnaireColumnLocalStrageData) {
        var _ret = null;
        if (myQuestionnaireColumnLocalStrageData == null
            || typeof myQuestionnaireColumnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = myQuestionnaireColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE) {
            return _ret;
        }
        var _columnInfo = ViewUtils.createQuestionnaireColumnInfo();
        _ret = _columnInfo;
        return _ret;
    }
    function _createChatColumnInfo(chatColumnlocalStrageData) {
        var _ret = null;
        if (chatColumnlocalStrageData == null
                || typeof chatColumnlocalStrageData != 'object') {
            return _ret;
        }
        var _type = chatColumnlocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_CHAT) {
            return _ret;
        }
        var _columnInfo = new ColumnInformation();
        var _jid = chatColumnlocalStrageData.jid;
        _columnInfo.setFilterCondition(_jid);
        _columnInfo.setColumnType(_type);
        _ret = _columnInfo;
        return _ret;
    };
    function _createTaskColumnInfo(taskColumnLocalStrageData) {
        var _ret = null;
        if (taskColumnLocalStrageData == null
                || typeof taskColumnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = taskColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_TASK) {
            return _ret;
        }
        var _columnInfo = new ColumnInformation();
        _columnInfo.setColumnType(_type);
        var _jid = LoginUser.getInstance().getJid();
        var _filterCondition = ViewUtils.getTaskFilterAndSortCondition(_jid);
        _columnInfo.setFilterCondition(_filterCondition
                .getFilterConditionJSONString());
        _ret = _columnInfo;
        return _ret;
    };
    function _createMentionColumnInfo(mentionColumnLocalStrageData) {
        var _ret = null;
        if (mentionColumnLocalStrageData == null
                || typeof mentionColumnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = mentionColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_MENTION) {
            return _ret;
        }
        var _columnInfo = new FilterColumnInfomation();
        _columnInfo.setColumnType(_type);
        var _colmunTypeFilter = ColumnFilterManager.getColumnFilter(_columnInfo
                .getColumnType(), null);
        if (_colmunTypeFilter == null) {
            return false;
        }
        var _mentionSortCondition = new ColumnSortCondition();
        var _mentionColumnSearchCondition = new ColumnSearchCondition(
                _colmunTypeFilter, _mentionSortCondition);
        _columnInfo.setSearchCondition(_mentionColumnSearchCondition);
        _ret = _columnInfo;
        return _ret;
    };
    function _createInboxColumnInfo(inboxColumnLocalStrageData) {
        var _ret = null;
        if (inboxColumnLocalStrageData == null
                || typeof inboxColumnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = inboxColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_INBOX) {
            return _ret;
        }
        _ret = ViewUtils.createIndexColumnInfo();
        return _ret;
    };
    function _createSearchColumnInfo(searchColumnlocalStrageData) {
        var _ret = null;
        if (searchColumnlocalStrageData == null
                || typeof searchColumnlocalStrageData != 'object') {
            return _ret;
        }
        var _type = searchColumnlocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_SEARCH) {
            return _ret;
        }
        var _columnInfo = new SearchColumnInfomation();
        var _keywordStr = searchColumnlocalStrageData.keyword;
        _columnInfo.setKeyword(_keywordStr);
        var _columnTypeListStr = searchColumnlocalStrageData.sourceColumnTypeList;
        _setSourceColumnTypeList(_columnTypeListStr, _columnInfo.getSourceColumnTypeList());
        var _searchKeywordFilter = ViewUtils
                .getKeywordFilterFromKeywordInputString(_keywordStr);
        var _searchColumnFilter = ColumnFilterManager
                .getColumnFilterList(_columnInfo.getSourceColumnTypeList());
        if (_searchKeywordFilter != null && _searchColumnFilter != null) {
            var _andSearchCondition = new AndCondition();
            _andSearchCondition.addChildCondition(_searchKeywordFilter);
            _andSearchCondition.addChildCondition(_searchColumnFilter);

            var _coulumnSort = new ColumnSortCondition();
            var _columnSearchCondition = new ColumnSearchCondition(
                    _andSearchCondition, _coulumnSort);
            _columnInfo.setSearchCondition(_columnSearchCondition);
        }
        var _subData = _getSubData(ColumnInformation.TYPE_COLUMN_SEARCH, searchColumnlocalStrageData.subData);
        _columnInfo.setSubData(_subData);
        _ret = _columnInfo;
        return _ret;
    };
    function _setSourceColumnTypeList(columnTypeListStr, sourceColumnTypeList) {
        if(columnTypeListStr == null || sourceColumnTypeList == null) {
            return;
        }
        var _columnTypeList = Utils.convertStringToArrayList(
                columnTypeListStr,
                TabColumnStateStore.SOURCE_COLUMN_TYPE_LIST_DELIMITOR);
        if(_columnTypeList == null) {
            return;
        }
        for (var _i = 0; _i < _columnTypeList.getCount(); _i++) {
            var _curType = parseInt(_columnTypeList.get(_i));
            if (isNaN(_curType)) {
                continue;
            }
            sourceColumnTypeList.add(_curType);
        }
    };
    function _createGroupChatColumnInfo(groupChatColumnLocalStrageData, callback) {
        var _self = this;
        var _ret = null;
        if (groupChatColumnLocalStrageData == null
                || typeof groupChatColumnLocalStrageData != 'object') {
            callback(_ret);
            return;
        }
        var _type = groupChatColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
            callback(_ret);
            return;
        }
        var _roomId = groupChatColumnLocalStrageData.roomId;
        var _roomName = groupChatColumnLocalStrageData.roomName;
        var _roomInfo = new ChatRoomInformation();
        _roomInfo.setRoomId(_roomId);
        _roomInfo.setRoomName(_roomName);
        var _columnInfo = ViewUtils.getGroupChatColumnInfo(_roomInfo);

        function _onGetRoomInfo(gottenRoomInfo) {
            // This guard always evaluates to false.
            // if(gottenRoomInfo != null) {
            //    _roomInfo = gottenRoomInfo;
            // }
            var _columnInfo = ViewUtils.getGroupChatColumnInfo(_roomInfo);
            callback(_columnInfo);
        };
        if(_roomId != null && _roomId != '') {
            setTimeout(function() {
                callback(_columnInfo);
            }, 1);
        } else {
            setTimeout(function() {
                _onGetRoomInfo(null);
            }, 1);
        }
    };
    function _createMailColumnInfo(mailColumnLocalStrageData) {
        var _ret = null;
        if (mailColumnLocalStrageData == null
                || typeof mailColumnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = mailColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_MAIL) {
            return _ret;
        }
        var _columnInfoMail = ViewUtils.getMailColumnInfomation();
        _ret = _columnInfoMail;
        return _ret;
    };
    function _createRecentColumnInfo(columnLocalStrageData) {
        var _ret = null;
        if (columnLocalStrageData == null
                || typeof columnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = columnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_RECENT) {
            return _ret;
        }

        var _columnInfo = new RecentColumnInfomation();
        _columnInfo.setColumnType(_type);
        _columnInfo.setFilterCondition('');

        var _filter = ColumnFilterManager.getColumnFilter(_type, null);
        if(_filter == null) { return false; }

        var _searchCondition = new ColumnSearchCondition(_filter, new ColumnSortCondition());
        _columnInfo.setSearchCondition(_searchCondition, false);    

        _ret = _columnInfo;
        return _ret;
    };
    function _createToMeColumnInfo(columnLocalStrageData) {
        var _ret = null;
        if (columnLocalStrageData == null
                || typeof columnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = columnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_TOME) {
            return _ret;
        }

        var _columnInfo = new ToMeColumnInfomation();
        _columnInfo.setColumnType(_type);
        _columnInfo.setFilterCondition('');

        var _filter = ColumnFilterManager.getColumnFilter(_type, null);
        if(_filter == null) { return false; }

        var _searchCondition = new ColumnSearchCondition(_filter, new ColumnSortCondition());
        _columnInfo.setSearchCondition(_searchCondition, false);    

        _ret = _columnInfo;
        return _ret;
    };
    function _createFilterColumnInfo(filterColumnlocalStrageData, callback) {
        var _ret = null;
        if (filterColumnlocalStrageData == null
                || typeof filterColumnlocalStrageData != 'object') {
            callback(_ret);
            return;
        }
        var _type = filterColumnlocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_FILTER) {
            callback(_ret);
            return;
        }
        var _columnInfo = new FilterColumnInfomation();
        var _sourceColumnType = filterColumnlocalStrageData.sourceColumnType;
        var _sourceColumnDisplayName = filterColumnlocalStrageData.sourceColumnDisplayName;
        var _keyword = filterColumnlocalStrageData.keyword;
        var _subDataStr = filterColumnlocalStrageData.subData;
        var _subData = _getSubData(_sourceColumnType, filterColumnlocalStrageData.subData);

        _columnInfo.setSubData(_subData);
        _columnInfo.setSourceColumnType(_sourceColumnType);
        _columnInfo.setSourceColumnDisplayName(_sourceColumnDisplayName);
        _columnInfo.setKeyword(_keyword);
        var _colmunTypeFilter = ColumnFilterManager.getColumnFilter(
                _sourceColumnType, _subData);
        if (_colmunTypeFilter == null) {
            callback(_ret);
            return;
        }
        var _columnFilter = new AndCondition();
        _columnFilter.addChildCondition(_colmunTypeFilter);
        var _keywordFilter = ViewUtils
                .getKeywordFilterFromKeywordInputString(_keyword);
        _columnFilter.addChildCondition(_keywordFilter);

        var _coulumnSort = new ColumnSortCondition();
        var _columnSearchCondition = new ColumnSearchCondition(_columnFilter,
                _coulumnSort);
        _columnInfo.setSearchCondition(_columnSearchCondition);
        function _onCreateSourceColumnDisplayName(createdSourceColumnDisplayName) {
            if(createdSourceColumnDisplayName != null && createdSourceColumnDisplayName != '') {
                _columnInfo.setSourceColumnDisplayName(createdSourceColumnDisplayName)
            }
            _ret = _columnInfo;
            callback(_ret);
        };
        _createSourceColumnDisplayName(filterColumnlocalStrageData, _onCreateSourceColumnDisplayName);
    };
    function _createSourceColumnDisplayName(filterColumnlocalStrageData, callback) {
        var _sourceColumnDisplayName = ''
        var _subDataStr = filterColumnlocalStrageData.subData;
        var _sourceColumnType = filterColumnlocalStrageData.sourceColumnType;
        var _sourceColumnDisplayName = filterColumnlocalStrageData.sourceColumnDisplayName;
        if(_sourceColumnDisplayName == null){
            _sourceColumnDisplayName = '';
        }
        callback(_sourceColumnDisplayName);
    };
    function _createCustomFilterColumnInfo(filterColumnlocalStrageData, callback) {
        var _ret = null;
        if (filterColumnlocalStrageData == null
                || typeof filterColumnlocalStrageData != 'object') {
            callback(_ret);
            return;
        }
        var _type = filterColumnlocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
            callback(_ret);
            return;
        }
        var _columnInfo = new CustomFilterColumnInfomation();
        var _sourceColumnType = filterColumnlocalStrageData.sourceColumnType;
        var _sourceColumnDisplayName = filterColumnlocalStrageData.sourceColumnDisplayName;

        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
            _columnInfo.setBeginningColumnType(filterColumnlocalStrageData.beginningColumnType);
        }
        var _subData = {};
        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
            _subData = _getSubData(filterColumnlocalStrageData.beginningColumnType, filterColumnlocalStrageData.subData);
        } else {
            _subData = _getSubData(_sourceColumnType, filterColumnlocalStrageData.subData);
        }
        _columnInfo.setSubData(_subData);

        _columnInfo.setSourceColumnType(_sourceColumnType);
        _columnInfo.setSourceColumnDisplayName(_sourceColumnDisplayName);
        var _filter = filterColumnlocalStrageData.searchCondition.filter;
        var _sort = filterColumnlocalStrageData.searchCondition.sort;
        var _filterCondition = new AndCondition();
        _filterCondition.getConditionObject(_filter);
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.getConditionObject(_sort);
        var _searchCondition = new ColumnSearchCondition(_filterCondition,
                _sortCondition);
        _columnInfo.setSearchCondition(_searchCondition);

        _columnInfo.setSetting(filterColumnlocalStrageData.setting);
        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH) {
            var _columnTypeListStr = filterColumnlocalStrageData.sourceColumnTypeList;
            _setSourceColumnTypeList(_columnTypeListStr, _columnInfo.getSourceColumnTypeList());
        }
        if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH || _sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
            _columnInfo.setKeyword(filterColumnlocalStrageData.keyword);
        }

        function _onCreateSourceColumnDisplayName(createdSourceColumnDisplayName) {
            if(createdSourceColumnDisplayName != null && createdSourceColumnDisplayName != '') {
                _columnInfo.setSourceColumnDisplayName(createdSourceColumnDisplayName)
            }
            _ret = _columnInfo;
            callback(_ret);
        };
        _createSourceColumnDisplayName(filterColumnlocalStrageData, _onCreateSourceColumnDisplayName);
    };
    function _createMurmurColumnInfo(murmurColumnlocalStrageData, callback) {
        var _ret = null;
        if (murmurColumnlocalStrageData == null
            || typeof murmurColumnlocalStrageData != 'object') {
            return _ret;
        }
        var _type = murmurColumnlocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_MURMUR) {
            callback(_ret);
            return;
        }
        const _jid = murmurColumnlocalStrageData.jid;
        if(_jid == null){
            callback(_ret);
            return;
        }
        _ret = ViewUtils.getMurmurColumnInfo(_jid);
        CubeeServerConnector.getInstance().getMurmurColumnName(_jid)
                        .then((res)=>{
                            if(typeof res.content == 'object' &&
                               typeof res.content.result == 'boolean' &&
                               res.content.result &&
                               typeof res.content.columnName == 'string'){
                                const _columnNameFromAPI = decodeURIComponent(res.content.columnName);
                                _ret._columnName = _columnNameFromAPI;
                                callback(_ret);
                            }else{
                                _ret._columnName = '';
                                callback(_ret);
                            }
                        }).catch((err) => {
                            callback(_ret);
                        });
    };

    function _getSubData(columnType, subData) {
        var _ret = {};
        switch(columnType){
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_INBOX:
            case ColumnInformation.TYPE_COLUMN_MAIL:
            case ColumnInformation.TYPE_COLUMN_RECENT:
            case ColumnInformation.TYPE_COLUMN_TOME:
            case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE:
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                _ret.partner = subData;
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                _ret.roomId = subData;
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
                _ret.roomId = subData;
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                _ret.roomId = subData;
                break;
            case ColumnInformation.TYPE_COLUMN_SEARCH:
                _ret = subData;
                break;
            default:
                break;
        }
        return _ret;
    };
    function _createCommunityFeedColumnInfo(communityFeedColumnLocalStrageData) {
        var _self = this;
        var _ret = null;
        if (communityFeedColumnLocalStrageData == null
                || typeof communityFeedColumnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = communityFeedColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
            return _ret;
        }
        var _roomId = communityFeedColumnLocalStrageData.communityId;
        if(_roomId == null || _roomId == ''){
            return _ret;
        }
        var _roomName = communityFeedColumnLocalStrageData.communityName;
        var _roomInfo = new CommunityInfo();
        _roomInfo.setRoomId(_roomId);
        _roomInfo.setRoomName(_roomName);
        var _columnInfo = ViewUtils.getCommunityFeedColumnInfo(_roomInfo);
        _ret = _columnInfo;
        return _ret;
    };
    function _createCommunityTaskColumnInfo(communityTaskColumnLocalStrageData) {
        var _self = this;
        var _ret = null;
        if (communityTaskColumnLocalStrageData == null
                || typeof communityTaskColumnLocalStrageData != 'object') {
            return _ret;
        }
        var _type = communityTaskColumnLocalStrageData.type;
        if (_type != ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
            return _ret;
        }
        var _roomId = communityTaskColumnLocalStrageData.communityId;
        if(_roomId == null || _roomId == ''){
            return _ret;
        }
        var _roomName = communityTaskColumnLocalStrageData.communityName;
        var _roomInfo = new CommunityInfo();
        _roomInfo.setRoomId(_roomId);
        _roomInfo.setRoomName(_roomName);
        var _columnInfo = ViewUtils.getCommunityTaskColumnInfo(_roomInfo);
        _ret = _columnInfo;
        return _ret;
    };
    function _getColumnLocalStrageDataFromColumnInfoList(columnInfoList) {
        var _ret = null;
        if (columnInfoList == null || typeof columnInfoList != 'object') {
            return _ret;
        }
        var _strageDataArray = [];
        var _count = columnInfoList.getCount();
        let _j=0;
        for ( var _i = 0; _i < _count; _i++) {
            var _columnInfo = columnInfoList.get(_i);
            var _strageData = _getColumnLocalStrageDataFromColumnInfo(_columnInfo);
            if(_strageData == null){
                continue;
            }
            _strageDataArray[ _j] = _strageData;
            _j++;
        }
        _ret = _strageDataArray;
        return _ret;
    };
    function _getColumnLocalStrageDataFromColumnInfo(columnInfo) {
        var _ret = null;
        if (columnInfo == null || typeof columnInfo != 'object') {
            return _ret;
        }
        var _columnType = columnInfo.getColumnType();
        switch (_columnType) {
        case ColumnInformation.TYPE_COLUMN_TIMELINE:
        case ColumnInformation.TYPE_COLUMN_TASK:
        case ColumnInformation.TYPE_COLUMN_MENTION:
        case ColumnInformation.TYPE_COLUMN_INBOX:
        case ColumnInformation.TYPE_COLUMN_MAIL:
        case ColumnInformation.TYPE_COLUMN_RECENT:
        case ColumnInformation.TYPE_COLUMN_TOME:
        case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE:
            _ret = _getColumnLocalStrageDataFromColumnInfoCommon(columnInfo);
            break;
        case ColumnInformation.TYPE_COLUMN_CHAT:
            _ret = _getChatColumnLocalStrageDataFromChatColumnInfo(columnInfo);
            break;
        case ColumnInformation.TYPE_COLUMN_SEARCH:
            _ret = _getSearchColumnChatLocalStrageDataFromSearchColumnInfo(columnInfo);
            break;
        case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
            _ret = _getGroupColumnChatLocalStrageDataFromGroupChatColumnInfo(columnInfo);
            break;
        case ColumnInformation.TYPE_COLUMN_FILTER:
            _ret = _getFilterColumnChatLocalStrageDataFromFilterColumnInfo(columnInfo);
            break;
        case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
            _ret = _getCustomFilterColumnChatLocalStrageDataFromCustomFilterColumnInfo(columnInfo);
            break;
        case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
        case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
            _ret = _getCommunityCommonLocalStrageDataFromCommunityCommonColumnInfo(columnInfo);
            break;
        case ColumnInformation.TYPE_COLUMN_MURMUR:
            _ret = _getMurmurColumnLocalStrageDataFromMurmurColumnInfo(columnInfo);
            break;
        default:
            break;
        }
        return _ret;
    };
    function _getColumnLocalStrageDataFromColumnInfoCommon(columnInfo) {
        var _ret = null;
        if (columnInfo == null || typeof columnInfo != 'object') {
            return _ret;
        }
        var _columnListItemData = {};
        _columnListItemData.type = columnInfo.getColumnType();
        _ret = _columnListItemData;
        return _ret;
    };
    function _getChatColumnLocalStrageDataFromChatColumnInfo(chatColumnInfo) {
        var _ret = null;
        if (chatColumnInfo == null || typeof chatColumnInfo != 'object') {
            return _ret;
        }
        var _columnListItemData = _getColumnLocalStrageDataFromColumnInfoCommon(chatColumnInfo);
        _columnListItemData.jid = chatColumnInfo.getFilterCondition();
        _ret = _columnListItemData;
        return _ret;
    };
    function _getGroupColumnChatLocalStrageDataFromGroupChatColumnInfo(groupChatColumnInfo) {
        var _ret = null;
        if (groupChatColumnInfo == null
                || typeof groupChatColumnInfo != 'object') {
            return _ret;
        }
        var _columnListItemData = _getColumnLocalStrageDataFromColumnInfoCommon(groupChatColumnInfo);
        var _roomInfo = groupChatColumnInfo.getChatRoomInfomation();
        var _roomId = _roomInfo.getRoomId();
        var _roomName = _roomInfo.getRoomName();
        _columnListItemData.roomId = _roomId;
        _columnListItemData.roomName = _roomName;
        _ret = _columnListItemData;
        return _ret;
    };
    function _getFilterColumnChatLocalStrageDataFromFilterColumnInfo(filterColumnInfo) {
        var _ret = null;
        if (filterColumnInfo == null || typeof filterColumnInfo != 'object') {
            return _ret;
        }
        var _columnListItemData = _getColumnLocalStrageDataFromColumnInfoCommon(filterColumnInfo);
        var _sourceColumnType = filterColumnInfo.getSourceColumnType();
        var _sourceColumnName = filterColumnInfo.getSourceColumnDisplayName();
        _columnListItemData.sourceColumnType = _sourceColumnType;
        _columnListItemData.sourceColumnDisplayName = _sourceColumnName;
        _columnListItemData.keyword = filterColumnInfo.getKeyword();
        var _subData = filterColumnInfo.getSubData();
        _columnListItemData.subData = _getLocalStarageSubData(_sourceColumnType, _subData);
        _ret = _columnListItemData;
        return _ret;
    };

    function _getLocalStarageSubData(columnType, subData) {
        var _ret = {};
        if(subData == null) {
            return _ret;
        }
        if (columnType == ColumnInformation.TYPE_COLUMN_CHAT) {
            _ret = subData.partner;
        } else if (columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
            _ret = subData.roomId;
        } else if (columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
            _ret = subData.roomId;
        } else if (columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
            _ret = subData.roomId;
        } else {
            _ret = subData;
        }
        return _ret;
    };
    function _getCustomFilterColumnChatLocalStrageDataFromCustomFilterColumnInfo(filterColumnInfo) {
        if (filterColumnInfo == null || typeof filterColumnInfo != 'object') {
            return null;
        }
        var _columnListItemData = _getColumnLocalStrageDataFromColumnInfoCommon(filterColumnInfo);
        var _sourceColumnType = filterColumnInfo.getSourceColumnType();
        var _sourceColumnName = filterColumnInfo.getSourceColumnDisplayName();
        _columnListItemData.sourceColumnType = _sourceColumnType;
        _columnListItemData.sourceColumnDisplayName = _sourceColumnName;
        var _searchCondition = {};
        {
            var _filterCondition = filterColumnInfo.getSearchCondition()
                    .getFilterCondition();
            _searchCondition.filter = _filterCondition.getJSONObject();
        }
        {
            var _condition = filterColumnInfo.getSearchCondition()
                    .getSortCondition();
            _searchCondition.sort = _condition.getJSONObject();
        }
        _columnListItemData.searchCondition = _searchCondition;
        _columnListItemData.setting = filterColumnInfo.getSetting();

        var _subData = filterColumnInfo.getSubData();
        if (_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
            _columnListItemData.subData = _getLocalStarageSubData(filterColumnInfo.getBeginningColumnType(), _subData);
        } else {
            _columnListItemData.subData = _getLocalStarageSubData(_sourceColumnType, _subData);
        }
        if (_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
            _columnListItemData.beginningColumnType = filterColumnInfo.getBeginningColumnType();
        }

        if (_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH) {
            var _sourceColumnTypeList = filterColumnInfo.getSourceColumnTypeList();
            _columnListItemData.sourceColumnTypeList = Utils.convertArrayListToString(_sourceColumnTypeList, TabColumnStateStore.SOURCE_COLUMN_TYPE_LIST_DELIMITOR);
        }

        if (_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER || _sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH) {
            _columnListItemData.keyword = filterColumnInfo.getKeyword();
        }


        return _columnListItemData;
    };
    function _getSearchColumnChatLocalStrageDataFromSearchColumnInfo(searchColumnInfo) {
        var _ret = null;
        if (searchColumnInfo == null || typeof searchColumnInfo != 'object') {
            return _ret;
        }
        var _columnListItemData = _getColumnLocalStrageDataFromColumnInfoCommon(searchColumnInfo);
        var _sourceColumnTypeList = searchColumnInfo.getSourceColumnTypeList();
        _columnListItemData.sourceColumnTypeList = Utils.convertArrayListToString(_sourceColumnTypeList, TabColumnStateStore.SOURCE_COLUMN_TYPE_LIST_DELIMITOR);
        _columnListItemData.keyword = searchColumnInfo.getKeyword();
        var _subData = searchColumnInfo.getSubData();
        _columnListItemData.subData = _getLocalStarageSubData(ColumnInformation.TYPE_COLUMN_SEARCH, _subData);
        _ret = _columnListItemData;
        return _ret;
    };
    function _getCommunityCommonLocalStrageDataFromCommunityCommonColumnInfo(
            communityFeedColumnInfo) {
        var _ret = null;
        if (communityFeedColumnInfo == null
                || typeof communityFeedColumnInfo != 'object') {
            return _ret;
        }
        var _columnListItemData = _getColumnLocalStrageDataFromColumnInfoCommon(communityFeedColumnInfo);
        var _roomInfo = communityFeedColumnInfo.getCommunityInfomation();
        var _roomId = _roomInfo.getRoomId();
        var _roomName = _roomInfo.getRoomName();
        _columnListItemData.communityId = _roomId;
        _columnListItemData.communityName = _roomName;
        _ret = _columnListItemData;
        return _ret;
    };
    function _getMurmurColumnLocalStrageDataFromMurmurColumnInfo(murmurColumnInfo) {
        let _ret = null;
        if (murmurColumnInfo == null || typeof murmurColumnInfo != 'object') {
            return _ret;
        }
        let _columnListItemData = _getColumnLocalStrageDataFromColumnInfoCommon(murmurColumnInfo);
        let _jid = MurmurColumnInformation.getOwnJidFromSearchCondition(murmurColumnInfo);
        if(_jid == null){
            return null
        }
        _columnListItemData.jid = _jid
        _ret = _columnListItemData;
        return _ret;
    };
    _proto.getTabArray = function(callback) {
        var _self = this;
        var _tabInfoList = null;
        function _callCallback() {
            setTimeout(function() {
                if (callback != null && typeof callback == 'function') {
                    callback(_tabInfoList);
                }
            }, 1);
        };
        TabColumnStateStore.TAB_LIST_KEY = 'tabList';
        var _jid = LoginUser.getInstance().getJid();
        if (_jid == null || typeof _jid != 'string' || _jid == '') {
            _callCallback();
            return;
        }
        var _host = location.hostname;
        var _tabListId = TabColumnStateStore.TAB_LIST_KEY + '_' + _host + '_'
                + _jid;

        var _strageData = _self._getItem(_tabListId);
        try {
            _tabInfoList = JSON.parse(_strageData);
        } catch (e) {
        }
        _callCallback();
    };

    _proto.setTabArray = function(tabArray, callback) {
        var _self = this;
        function _callCallback() {
            setTimeout(function() {
                if (callback != null && typeof callback == 'function') {
                    callback();
                }
            }, 1);
        };
        if (tabArray == null || typeof tabArray != 'object') {
            _callCallback();
            return;
        }
        var _jid = LoginUser.getInstance().getJid();
        if (_jid == null || typeof _jid != 'string' || _jid == '') {
            _callCallback();
            return;
        }
        var _host = location.hostname;
        var _tabListId = TabColumnStateStore.TAB_LIST_KEY + '_' + _host + '_'
                + _jid;
        var _tabListStrageDataStr = JSON.stringify(tabArray);

        _self._setItem(_tabListId, _tabListStrageDataStr);
        _callCallback();
    };

})();
