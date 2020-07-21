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

function ColumnInformation() {
    this._colmnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._filterCondition = '';
    this._sortOrder = ColumnInformation.SORT_ORDER_DES;
    this._sortType = ColumnInformation.SORT_TYPE_TIME;
    this._messageList = new MessageDataList();
    this._displayName = '';
    this._iconImage = '';
    this._searchCondition = null;
    this._hasSendMessageRight = false;
    this._hasViewMessageRight = false;
};(function() {
    ColumnInformation.TYPE_COLUMN_UNKNOWN = 0;
    ColumnInformation.TYPE_COLUMN_TIMELINE = 1;
    ColumnInformation.TYPE_COLUMN_MENTION = 2;
    ColumnInformation.TYPE_COLUMN_CHAT = 3;
    ColumnInformation.TYPE_COLUMN_TASK = 4;
    ColumnInformation.TYPE_COLUMN_TASK_REGISTER = 5;
    ColumnInformation.TYPE_COLUMN_INBOX = 6;
    ColumnInformation.TYPE_COLUMN_SEARCH = 7;
    ColumnInformation.TYPE_COLUMN_FILTER = 8;
    ColumnInformation.TYPE_COLUMN_GROUP_CHAT = 9;
    ColumnInformation.TYPE_COLUMN_MAIL = 10;
    ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER = 11;
    ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED = 12;
    ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK = 13;
    ColumnInformation.TYPE_COLUMN_RECENT = 14;
    ColumnInformation.TYPE_COLUMN_TOME = 15;
    ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION = 16;
    ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE = 17;
    ColumnInformation.TYPE_COLUMN_MURMUR = 18;

    ColumnInformation.SORT_ORDER_ASC = 0;
    ColumnInformation.SORT_ORDER_DES = 1;
    ColumnInformation.SORT_TYPE_TIME = 0;
    var _proto = ColumnInformation.prototype;
    _proto.getColumnType = function() {
        return this._colmnType;
    };
    _proto.setColumnType = function(colmnType) {
        if(colmnType == null || typeof colmnType != 'number') {
            return;
        }
        this._colmnType = colmnType;
    };
    _proto.getFilterCondition = function() {
        return this._filterCondition;
    };
    _proto.setFilterCondition = function(filterCondition) {
        if(filterCondition == null || typeof filterCondition != 'string') {
            return;
        }
        this._filterCondition = filterCondition;
    };
    _proto.getSortOrder = function() {
        return this._sortOrder;
    };
    _proto.setSortOrder = function(sortOrder) {
        if(sortOrder == null || typeof sortOrder != 'number') {
            return;
        }
        if(sortOrder < ColumnInformation.SORT_ORDER_ASC || sortOrder > ColumnInformation.SORT_ORDER_DES) {
            return;
        }
        this._sortOrder = sortOrder;
    };
    _proto.getSortType = function() {
        return this._sortType;
    };
    _proto.setSortType = function(sortType) {
        if(sortType == null || typeof sortType != 'number') {
            return;
        }
        this._sortType = sortType;
    };
    _proto.getMessageList = function() {
        return this._messageList;
    };
    _proto.getDisplayName = function() {
        return this._displayName;
    };
    _proto.setDisplayName = function(displayName) {
        if(displayName == null || typeof displayName != 'string') {
            return;
        }
        this._displayName = displayName;
    };
    _proto.getIconImage = function() {
        return this._iconImage;
    };
    _proto.setIconImage = function(iconImage) {
        if(iconImage == null || typeof iconImage != 'string') {
            return;
        }
        this._iconImage = iconImage;
    };
    _proto.getSearchCondition = function() {
        return this._searchCondition;
    };
    _proto.setSearchCondition = function(searchCondition) {
        if(searchCondition == null || typeof searchCondition != 'object') {
            return;
        }
        this._searchCondition = searchCondition;
    };
    _proto.getRightToSendMessage = function() {
        return this._hasSendMessageRight;
    }
    _proto.setRightToSendMessage = function(sendMessageRight) {
        if(typeof sendMessageRight != 'boolean') {
            return;
        }
        this._hasSendMessageRight = sendMessageRight;
    }
    _proto.getRightToViewMessage = function() {
        return this._hasViewMessageRight;
    }
    _proto.setRightToViewMessage = function(viewMessageRight) {
        if(typeof viewMessageRight != 'boolean') {
            return;
        }
        this._hasViewMessageRight = viewMessageRight;
    }

})();
function FilterColumnInfomation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_FILTER;
    this._sourceColumnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._sourceColumnDisplayName = '';
    this._keyword = '';
    this._subData = null;
    this._beginningColumnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = ColumnInformation.prototype;
    FilterColumnInfomation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = FilterColumnInfomation.prototype;
    _proto.getSourceColumnType = function() {
        return this._sourceColumnType;
    };
    _proto.setSourceColumnType = function(sourceColumnType) {
        if(sourceColumnType == null || typeof sourceColumnType != 'number') {
            return;
        }
        this._sourceColumnType = sourceColumnType;
    };
    _proto.getSourceColumnDisplayName = function() {
        return this._sourceColumnDisplayName;
    };
    _proto.setSourceColumnDisplayName = function(sourceColumnDisplayName) {
        if(sourceColumnDisplayName == null || typeof sourceColumnDisplayName != 'string') {
            return;
        }
        this._sourceColumnDisplayName = sourceColumnDisplayName;
    };
    _proto.getKeyword = function() {
        return this._keyword;
    };
    _proto.setKeyword = function(keyword) {
        if(keyword == null || typeof keyword != 'string') {
            return;
        }
        this._keyword = keyword;
    };
    _proto.getSubData = function() {
        return this._subData;
    };
    _proto.setSubData = function(subData) {
        this._subData = subData;
    };
    _proto.getBeginningColumnType = function() {
        return this._beginningColumnType;
    };
})();
function CustomFilterColumnInfomation() {

    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER;
    this._sourceColumnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._sourceColumnDisplayName = '';

    this._setting = null;

    this._subData = null;

    this._sourceColumnTypeList = new ArrayList();
    this._keyword = null;
    this._beginningColumnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
};(function(){

    CustomFilterColumnInfomation.prototype = $.extend({}, ColumnInformation.prototype);
    var _super = ColumnInformation.prototype;

    var _proto = CustomFilterColumnInfomation.prototype;

    _proto.getSourceColumnType = function() {
        return this._sourceColumnType;
    };

    _proto.setSourceColumnType = function(sourceColumnType) {

        if(sourceColumnType == null || typeof sourceColumnType != 'number') {
            return;
        }
        this._sourceColumnType = sourceColumnType;
    };

    _proto.getSourceColumnDisplayName = function() {
        return this._sourceColumnDisplayName;
    };

    _proto.setSourceColumnDisplayName = function(sourceColumnDisplayName) {

        if(sourceColumnDisplayName == null || typeof sourceColumnDisplayName != 'string') {
            return;
        }
        this._sourceColumnDisplayName = sourceColumnDisplayName;
    };

    _proto.getSetting = function(){
        return this._setting;
    };

    _proto.setSetting = function(setting) {

        if(setting == null || typeof setting != 'object') {
            return;
        }
        this._setting = setting;
    };

    _proto.getSubData = function() {
        return this._subData;
    };
    _proto.setSubData = function(subData) {
        this._subData = subData;
    };

    _proto.getSourceColumnTypeList = function() {
        return this._sourceColumnTypeList;
    };

    _proto.getKeyword = function() {
        return this._keyword;
    };
    _proto.setKeyword = function(keyword) {
        this._keyword = keyword;
    };
    _proto.getBeginningColumnType = function() {
        return this._beginningColumnType;
    };

    _proto.setBeginningColumnType = function(beginningColumnType) {

        if(beginningColumnType == null || typeof beginningColumnType != 'number') {
            return;
        }
        this._beginningColumnType = beginningColumnType;
    };

    CustomFilterColumnInfomation.copySubData = function(subData) {
        return $.extend(true, {}, subData);
    };
})();
function SearchColumnInfomation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_SEARCH;
    this._sourceColumnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._sourceColumnTypeList = new ArrayList();
    this._keyword = '';
    this._subData = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = ColumnInformation.prototype;
    SearchColumnInfomation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = SearchColumnInfomation.prototype;
    _proto.getSourceColumnType = function() {
        return this._sourceColumnType;
    };
    _proto.getSourceColumnTypeList = function() {
        return this._sourceColumnTypeList;
    };
    _proto.getKeyword = function() {
        return this._keyword;
    };
    _proto.setKeyword = function(keyword) {
        if(keyword == null || typeof keyword != 'string') {
            return;
        }
        this._keyword = keyword;
    };
    _proto.getSubData = function() {
        return this._subData;
    };
    _proto.setSubData = function(subData) {
        if(subData == null || typeof subData != 'object') {
            return;
        }
        this._subData = subData;
    };
})();
function GroupChatColumnInformation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_GROUP_CHAT;
    this._iconImage = 'images/community_onebit.png';
    this._chatRoomInfomation = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = ColumnInformation.prototype;
    GroupChatColumnInformation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GroupChatColumnInformation.prototype;
    _proto.getChatRoomInfomation = function() {
        return this._chatRoomInfomation;
    };
    _proto.setChatRoomInfomation = function(chatRoomInfomation) {
        if(chatRoomInfomation == null || typeof chatRoomInfomation != 'object') {
            return;
        }
        this._chatRoomInfomation = chatRoomInfomation;
    };

})();
function CommunityFeedColumnInformation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED;
    this._iconImage = 'images/column_community_feed.png';
    this._communityInfomation = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = ColumnInformation.prototype;
    CommunityFeedColumnInformation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityFeedColumnInformation.prototype;
    _proto.getCommunityInfomation = function() {
        return this._communityInfomation;
    };
    _proto.setCommunityInfomation = function(communityInfomation) {
        if(communityInfomation == null || typeof communityInfomation != 'object') {
            return;
        }
        this._communityInfomation = communityInfomation;
    };

})();
function CommunityTaskColumnInformation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK;
    this._iconImage = 'images/community_onebit.png';
    this._communityInfomation = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = ColumnInformation.prototype;
    CommunityTaskColumnInformation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = CommunityTaskColumnInformation.prototype;
    _proto.getCommunityInfomation = function() {
        return this._communityInfomation;
    };
    _proto.setCommunityInfomation = function(communityInfomation) {
        if(communityInfomation == null || typeof communityInfomation != 'object') {
            return;
        }
        this._communityInfomation = communityInfomation;
    };

})();

function RecentColumnInfomation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_RECENT;
    this._sourceColumnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._sourceColumnTypeList = new ArrayList();
    this._keyword = '';
    this._subData = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = ColumnInformation.prototype;
    RecentColumnInfomation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = RecentColumnInfomation.prototype;
    _proto.getSourceColumnType = function() {
        return this._sourceColumnType;
    };
    _proto.getSourceColumnTypeList = function() {
        return this._sourceColumnTypeList;
    };
    _proto.getKeyword = function() {
        return this._keyword;
    };
    _proto.setKeyword = function(keyword) {
        if(keyword == null || typeof keyword != 'string') {
            return;
        }
        this._keyword = keyword;
    };
    _proto.getSubData = function() {
        return this._subData;
    };
    _proto.setSubData = function(subData) {
        if(subData == null || typeof subData != 'object') {
            return;
        }
        this._subData = subData;
    };
})();

function ToMeColumnInfomation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_TOME;
    this._sourceColumnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._sourceColumnTypeList = new ArrayList();
    this._keyword = '';
    this._subData = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = ColumnInformation.prototype;
    ToMeColumnInfomation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = ToMeColumnInfomation.prototype;
    _proto.getSourceColumnType = function() {
        return this._sourceColumnType;
    };
    _proto.getSourceColumnTypeList = function() {
        return this._sourceColumnTypeList;
    };
    _proto.getKeyword = function() {
        return this._keyword;
    };
    _proto.setKeyword = function(keyword) {
        if(keyword == null || typeof keyword != 'string') {
            return;
        }
        this._keyword = keyword;
    };
    _proto.getSubData = function() {
        return this._subData;
    };
    _proto.setSubData = function(subData) {
        if(subData == null || typeof subData != 'object') {
            return;
        }
        this._subData = subData;
    };
})();

function ShowConversationColumnInfomation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_SHOW_CONVERSATION;
    this._iconImage = 'images/column_show_conversation.png';
    this._sourceColumnType = ColumnInformation.TYPE_COLUMN_UNKNOWN;
    this._sourceColumnDisplayName = '';
    this._parentItemId = null;
    this._itemId = null;
};(function(){
    var Super = function Super() {
    };
    Super.prototype = ColumnInformation.prototype;
    ShowConversationColumnInfomation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = ShowConversationColumnInfomation.prototype;
    _proto.getSourceColumnType = function() {
        return this._sourceColumnType;
    };
    _proto.setSourceColumnType = function(sourceColumnType) {
        if(sourceColumnType == null || typeof sourceColumnType != 'number') {
            return;
        }
        this._sourceColumnType = sourceColumnType;
    };
    _proto.getSourceColumnDisplayName = function() {
        return this._sourceColumnDisplayName;
    };
    _proto.setSourceColumnDisplayName = function(sourceColumnDisplayName) {
        if(sourceColumnDisplayName == null || typeof sourceColumnDisplayName != 'string') {
            return;
        }
        this._sourceColumnDisplayName = sourceColumnDisplayName;
    };
    _proto.getParentItemId = function() {
        return this._parentItemId;
    };
    _proto.setParentItemId = function(itemId) {
        if(itemId == null || typeof itemId != 'string') {
            return;
        }
        this._parentItemId = itemId;
    };
    _proto.getItemId = function() {
        return this._itemId;
    };
    _proto.setItemId = function(itemId) {
        if(itemId == null || typeof itemId != 'string') {
            return;
        }
        this._itemId = itemId;
    };
})();

function MurmurColumnInformation() {
    ColumnInformation.call(this);
    this._colmnType = ColumnInformation.TYPE_COLUMN_MURMUR;
    this._iconImage = '';
    this._info = null;
    this._columnName = '';
};(function(){
    var Super = function Super() {  };
    Super.prototype = ColumnInformation.prototype;
    MurmurColumnInformation.prototype = new Super();
    var _super = Super.prototype;
    var _proto = MurmurColumnInformation.prototype;
    _proto.getMurmurInfomation = function() {
        return this._info;
    };
    _proto.setMurmurInfomation = function(infomation) {
        if(infomation == null || typeof infomation != 'object') {
            return;
        }
        this._info = infomation;
    };
    MurmurColumnInformation.getOwnJidFromSearchCondition = (info) =>{
        let partnerJid = null;
        const followees = LoginUser.getInstance().getFolloweeList();
        if(followees.getCount() > 0 &&
           info != null &&
           info.getSearchCondition() &&
           info.getSearchCondition().getFilterCondition() &&
           info.getSearchCondition().getFilterCondition().getJSONObject() &&
           Array.isArray(info.getSearchCondition().getFilterCondition().getJSONObject().value) &&
           info.getSearchCondition().getFilterCondition().getJSONObject().value.length == 2 &&
           ( Array.isArray(info.getSearchCondition().getFilterCondition().getJSONObject().value[0].value) ||
             Array.isArray(info.getSearchCondition().getFilterCondition().getJSONObject().value[1].value) )
        ){
            let followeeHash = {}
            for(let i=0;i<followees.getCount();i++){
                followeeHash[followees.get(i).getJid()] = true
            }
            const filters = info.getSearchCondition().getFilterCondition().getJSONObject().value;
            let values;
            if(Array.isArray(filters[1].value)){
                values = filters[1].value;
            }else if(Array.isArray(filters[0].value)){
                values = filters[0].value;
            }else{
                return null
            }
            for(let j=0;j<values.length;j++){
                if(followeeHash[values[j].value]){
                    continue;
                }
                partnerJid = values[j].value;
                break;
            }
        }else{
            if(info != null &&
               info.getSearchCondition() &&
               info.getSearchCondition().getFilterCondition() &&
               info.getSearchCondition().getFilterCondition().getJSONObject() &&
               Array.isArray(info.getSearchCondition().getFilterCondition().getJSONObject().value)){
                const filters = info.getSearchCondition().getFilterCondition().getJSONObject().value;
                for(let i=0;i<filters.length;i++){
                    if(filters[i].name == "msgto"){
                        partnerJid = filters[i].value;
                    }
                }
            }
        }
        return partnerJid;
    }
})();

function ColumnList() {
    ArrayList.call(this);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ArrayList.prototype;
    ColumnList.prototype = new Super();
    var _super = Super.prototype;
    var _columnList = new ColumnList();
    ColumnList.getInstance = function() {
        return _columnList;
    };
    var _proto = ColumnList.prototype;
    _proto.add = function(columnInformation) {
        var _self = this;
        if(columnInformation == null || typeof columnInformation != 'object') {
            return false;
        }
        return _super.add.call(this, columnInformation);
    };
    _proto.insert = function(index, columnInformation) {
        var _self = this;
        if(index == null || typeof index != 'number') {
            return false;
        }
        if(index < 0 || index > _self._length) {
            return false;
        }
        if(columnInformation == null || typeof columnInformation != 'object') {
            return false;
        }
        return _super.insert.call(this, index, columnInformation);
    };
    _proto.get = function(index) {
        var _self = this;
        if(index == null || typeof index != 'number') {
            return null;
        }
        if(index < 0 || index >= _self._length) {
            return null;
        }
        return _super.get.call(this, index);
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
})();
