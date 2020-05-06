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
function FavoriteStore() {
    this._localStorage = window.localStorage;
    this._favoriteGroupList = [];
    this.init();
};
(function() {
    FavoriteStore.FAVORITE_KEY = 'favorite';
    FavoriteStore.FAVORITE_GROUP_MAX = 5;
    var _proto = FavoriteStore.prototype;

    var _thisInstance = null;
    FavoriteStore.getInstance = function() {
        if (_thisInstance == null) {
            _thisInstance = new FavoriteStore();
        }
        return _thisInstance;
    };

    _proto.init = function(){
        var _loadData = _loadLocalStorage(this._localStorage);
        if(_loadData != null){
            try{
                this._favoriteGroupList = JSON.parse(_loadData);
            }
            catch(e){
                noStrageData(this._favoriteGroupList);
            }
        }
        else{
            noStrageData(this._favoriteGroupList);
        }
        function noStrageData(list){
            for(var _id = 0; _id < FavoriteStore.FAVORITE_GROUP_MAX; _id++){
                var _favoriteGroup = {};
                _favoriteGroup.id = _id;
                _favoriteGroup.name = Resource.getMessage('group_title_favorite') + parseInt(_id+1);
                _favoriteGroup.memberList = [];
                list.add(_favoriteGroup);
            }
        }
    };

    _proto.getGroupMember = function(favoriteGroupId){
        return this._favoriteGroupList[favoriteGroupId].memberList;
    };

    _proto.getGroupIdByName = function(favoriteGroupName){
        var _ret = -1;
        for(var _id = 0; _id < FavoriteStore.FAVORITE_GROUP_MAX; _id++){
            if(this._favoriteGroupList[_id].name == favoriteGroupName){
                _ret = _id;
                break;
            }
        }
        return _ret;
    };

    _proto.getGroupName = function(favoriteGroupId){
        return this._favoriteGroupList[favoriteGroupId].name;
    };

    _proto.getGroupCount = function(){
        return FavoriteStore.FAVORITE_GROUP_MAX;
    };

    _proto.addGroupMember = function(favoriteGroupId, addMemberList){
        var _jidList = [];
        var _memberList = this._favoriteGroupList[favoriteGroupId].memberList;

        var _addMemberCount = addMemberList.length;
        for(var _i = 0; _i < _addMemberCount; _i++){
            var _jid = addMemberList[_i];
            var _find = -1;
            _find = _findMemberJid(_memberList, _jid);
            if(_find < 0){
                _jidList.add(_jid);
            }
        }

        if(_jidList.length > 0){
            for(_i = 0; _i < _jidList.length; _i++){
                _memberList.push(_jidList[_i]);
            }
            var _strageDataStr = JSON.stringify(this._favoriteGroupList);
            _saveLocalStorage(this._localStorage, _strageDataStr);
        }
    };

    _proto.removeGroupMember = function(favoriteGroupId, removeMemberList){
        var _memberList = this._favoriteGroupList[favoriteGroupId].memberList;
        var _removeMemberCount = removeMemberList.length;
        for(var _i = 0; _i < _removeMemberCount; _i++){
            var _jid = removeMemberList[_i];
            var _find = -1;
            _find = _findMemberJid(_memberList, _jid);
            if(_find >= 0){
                _memberList.splice(_find, 1);
            }
        }

        if(_removeMemberCount){
            var _strageDataStr = JSON.stringify(this._favoriteGroupList);
            _saveLocalStorage(this._localStorage, _strageDataStr);
        }
    };

    function _findMemberJid(memberList, findJid){
        var _memberCount = memberList.length;
        for(var _i = 0; _i < _memberCount; _i++){
            var _jid = memberList[_i];
            if(findJid == _jid){
                return _i;
            }
        }
        return -1;
    };

    function _saveLocalStorage(storage, saveData){
        var _key = FavoriteStore.FAVORITE_KEY + '_' + location.hostname + '_' + LoginUser.getInstance().getJid();
        storage.setItem(_key, saveData);
    };

    function _loadLocalStorage(storage){
        var _key = FavoriteStore.FAVORITE_KEY + '_' + location.hostname + '_' + LoginUser.getInstance().getJid();
        return storage.getItem(_key);
    };
})();
