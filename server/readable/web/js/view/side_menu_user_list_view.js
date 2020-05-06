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

function SideMenuUserListView(partsType, viewType, parent) {
    this._parentObj = parent;

    this._partsType = partsType;

    this._listViewType = viewType;

    this._mTipList = new ArrayList();

    this._accordionSetting = null;

    this._accordionSortableSetting = null;



    this.init();
};(function() {
    SideMenuUserListView.prototype = $.extend({}, SideMenuParts.prototype);
    var _super = SideMenuParts.prototype;
    var _proto = SideMenuUserListView.prototype;

    _proto.init = function() {
        var _self = this;
        _self.element = _self.createFrame();
        return _self;
    };
    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp();
        if(_self._parentObj){
            _self._parentObj = null;
        }
        if(_self._mTipList){
            var _count = _self._mTipList.getCount();
            var _processedCount = 0;

            var _asyncRemoveMTip = function(){
                if(_count <= _processedCount){
                    _self._mTipList = null;
                    return;
                }
                var _mTipId = _self._mTipList.get(_processedCount);
                $('#' + _mTipId).remove();
                _processedCount++;
                setTimeout(function(){
                    _asyncRemoveMTip();
                }, 1);
            };
            setTimeout(function(){
                _asyncRemoveMTip();
            }, 1);
        }
    };
    _proto.refreshAccrodion = function(nonActive) {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        if(_rootElement.accordion){
            var _active = false;
            if (!nonActive) {
                _active = _rootElement.accordion("option", "active");
            }
            _self._accordionSetting.active = _active;
            _rootElement.accordion('destroy').accordion(_self._accordionSetting).sortable(_self._accordionSortableSetting);
        }
    };
    _proto.createFrame = function() {
        var _self = this;
        var _contactListViewFrame = _self._getInnerHtml();
        _self._frame = $(_contactListViewFrame);
        _self._createEventHandler();
        return _self._frame;
    };

    _proto._getInnerHtml = function(){
        var _self = this;
        var _ret = '';
        _ret += '<div class="' + _self._partsType + ' ' + this._listViewType + ' box-border flex1 olient-vertical vertical-scroll  ui-widget ui-helper-reset hide-view"></div>';
        return _ret;
    };

    _proto.getParentHtmlElement = function(){
        var _self = this;
        return _self._frame.parent();
    };

    _proto.getPersonData = function(jid){
        var _self = this;
    };


    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        $(_rootElement).on('click', 'ul.list-contact.sidebar_list li', function() {
            var _selfObj = $(this);

            _self._startChat($(this));

        });
    };

    _proto._getSelectedUserList = function() {
        var _self = this;
        if(_self._parentObj && _self._parentObj.getSelectedUserList){
            return _self._parentObj.getSelectedUserList();
        }
        return ;
    };
    _proto._addSelectedUserList = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return;
        }
        if(_self._parentObj && _self._parentObj.addSelectedUserList){
            _self._parentObj.addSelectedUserList(person);
        }
        return ;
    };
    _proto._removeSelectedUserList = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return;
        }
        if(_self._parentObj && _self._parentObj.removeSelectedUserList){
            _self._parentObj.removeSelectedUserList(person);
        }
        return ;
    };

    _proto.receivedChangeSelectedUser = function(selectedUserList){
        var _self = this;
        _self._frame.find('.' + _self._partsType + '-box').removeClass(_self._partsType + '-selected');

        var _count = selectedUserList.getCount();
        for(var i=0; i<_count; i++){
            var _selectedJid = selectedUserList.get(i).getJid();
            var _elem = _self._frame.find('.' + _self._partsType + '-box[jid=\'' + _selectedJid + '\']');
            if(_elem.length > 0){
                _elem.addClass(_self._partsType + '-selected');
            }
        }
    };

    _proto._startChat = function(contactListBoxElem){
        var _selectedJid = contactListBoxElem.attr('jid');
        var _columnInformation = new ColumnInformation();
        _columnInformation.setColumnType(ColumnInformation.TYPE_COLUMN_CHAT);
        _columnInformation.setFilterCondition(_selectedJid);
        ColumnManager.getInstance().addColumn(_columnInformation, true, true);
        ViewUtils.unsetNewNoticeMark(contactListBoxElem);
        NotificationIconManager.getInstance().onColumnClicked(_columnInformation);
    };

    _proto.showPerson = function(person) {
        var _self = this;
        var root = _self.getHtmlElement();
        if(!person || !$(root).find('ul.list-contact.sidebar_list').length){
            return false;
        }
        var personHtml = _self._createHtmlOnePersonFromPersonData(person);
        $(root).find('ul.list-contact.sidebar_list').append(personHtml);

        return true;
    }

    _proto._addContactListDialog = function(contactList, beforeListNumber) {
      var _self = this;
      var root = _self.getHtmlElement();
      var addNumber = beforeListNumber + 10;
      var result = false;
      if (contactList.getCount() <= addNumber) {
          addNumber = contactList.getCount()
          result = true;
      }
      for (var i=beforeListNumber; i<addNumber; i++) {
        var personHtml = _self._createHtmlOnePersonFromPersonData(contactList.get(i));
        $('#chatlist_modal .list-contact.sidebar_list').append(personHtml);
      }
      return result;
    }

    _proto._asyncShowPersonList = function(contactList, callbackFunc, opts=null) {
        var _groupListArea = this.getHtmlElement();
        var _contactList = new ArrayList();
        var DISPLAY_NUM_ON_SIDEBAR = 5;
        if (!opts){
            if (contactList.getCount() > DISPLAY_NUM_ON_SIDEBAR) {
              for (var i=0; i<DISPLAY_NUM_ON_SIDEBAR; i++) {
                _contactList.add(contactList.get(i));
              }
            } else {
              _contactList = contactList;
            }
        }else if(opts.mode != null && opts.mode == 'dialog'){
            var DISPLAY_NUM_ON_SIDEBAR = 10;
            if (contactList.getCount() > DISPLAY_NUM_ON_SIDEBAR) {
                for (var i=0; i<DISPLAY_NUM_ON_SIDEBAR; i++) {
                  _contactList.add(contactList.get(i));
                }
            } else {
                _contactList = contactList;
            }
        } else if (opts.numOfChat != null) {
            if (typeof opts.numOfChat == 'number') {
                for (var i=0; i<opts.numOfChat; i++) {
                  _contactList.add(contactList.get(i));
                }
            } else if (typeof opts.numOfChat == 'string' && opts.numOfChat == 'all') {
                for (var i=0; i<contactList.getCount(); i++) {
                    _contactList.add(contactList.get(i));
                }
            }
        }

        this._asyncAddGroupToPersonList(
          _groupListArea,
          this._createOneGroupData('', _contactList, true),
          callbackFunc);
    }


    function _createdSortData(contactList, callback) {
        var _sortedContactListCache = contactList.getSortedData();
        if(_sortedContactListCache != null) {
            setTimeout(function(){
                callback(_sortedContactListCache);
            }, 1);
            return;
        }
        var _groups = new Array();
        _groups[0] = {};
        var _noGroup = _groups[0];
        _noGroup.name = Resource.getMessage('group_title_no_group');
        _noGroup.personCount = 0;
        _noGroup.person = new Array();
        _noGroup.existing = true;   
        var _contactListCount = contactList.getCount();
        var _processedCount = 0;
        setTimeout(function() {
            _asyncGrouping();
        }, 1);

        function _asyncGrouping() {
            if(_contactListCount <= _processedCount) {
                _asyncGroupSort();
            } else {
                var _person = contactList.get(_processedCount);
                _asyncAddGroups(_person, _groups, _noGroup, function() {
                    _processedCount++;
                    _asyncGrouping();
                });
            }
        };

        function _asyncGroupSort() {
            function _onGroupSort() {

                var _favoriteGroupMax = FavoriteStore.getInstance().getGroupCount();
                for(var _id = 0; _id < _favoriteGroupMax; _id++){
                    var _favoriteGroup = {};
                    _favoriteGroup.name = FavoriteStore.getInstance().getGroupName(_id);

                    var _jidList = FavoriteStore.getInstance().getGroupMember(_id);
                    var _personList = [];
                    for(var _i = 0; _i < _jidList.length; _i++){
                        var _person = CubeeController.getInstance().getPersonData(_jidList[_i]);
                        if(_person != null){
                            _personList.add(_person);
                        }
                    }
                    _favoriteGroup.person = _personList;
                    _favoriteGroup.personCount = _favoriteGroup.person.length;
                    _favoriteGroup.existing = true;     
                    _groups.add(_favoriteGroup);
                }

                _asysncPersonInGroup();
            };
            _asysncSortGroup(_groups, 1, _groups.length - 2, _onGroupSort);
        };

        function _asysncPersonInGroup() {
            var _groupCount = _groups.length;
            var _processedCount = 0;
            _asyncShowGroup();
            function _asyncShowGroup() {
                if(_groupCount <= _processedCount) {
                    setTimeout(function(){
                        callback(_groups);
                    }, 1);
                } else {
                    function _onSortContactListItem() {
                        _processedCount++;
                        _asyncShowGroup();
                    };
                    var _group = _groups[_processedCount];
                    _asyncSortContactListItems(_group.person, 0, _group.person.length - 1, _onSortContactListItem);
                }
            };
        };
    }

    function _asyncAddGroups(person, groups, noGroup, callbackFunc) {
        var _personGroups = person.getGroup();
        if(_personGroups.length == 0) {
            noGroup.person[noGroup.personCount++] = person;
        } else {
            for(var _j = 0; _j < _personGroups.length; _j++) {
                var _personGroupName = _personGroups[_j];
                var _findGroup = null;
                for(var _k = 0; _k < groups.length; _k++) {
                    if(groups[_k].existing == false && groups[_k].name == _personGroupName) {
                        _findGroup = groups[_k];
                        break;
                    }
                }
                if(_findGroup == null) {
                    var _addIndex = groups.length;
                    groups[_addIndex] = {};
                    _findGroup = groups[_addIndex];
                    _findGroup.name = _personGroupName;
                    _findGroup.personCount = 0;
                    _findGroup.person = new Array();
                    _findGroup.existing = false;
                }
                _findGroup.person[_findGroup.personCount] = person;
                _findGroup.personCount++;
            }
        }
        setTimeout(function(){
            // Variable 'callbackFunc' is of type function, but it is compared to an expression of type null.
            // if(callbackFunc != null && typeof callbackFunc == 'function') { 
            if (typeof callbackFunc == 'function') {
                callbackFunc();
            }
        }, 1);
    };

    _proto._asyncAddGroupList = function(parent, group, callback) {
        var _self = this;
        if(parent == null || typeof parent != 'object') {
            callback(false);
            return;
        }
        if(group == null || typeof group != 'object') {
            callback(false);
            return;
        }
        group.isMemberList = false; 
        var _groupHtml = _self._createHtmlOneGroupFromGroupData(group);
        parent.append(_groupHtml);

        setTimeout(function(){
            callback(true);
        }, 1);
    };

    _proto._asyncAddPersonList = function(parent, group, callback) {
        var _self = this;
        if(parent == null || typeof parent != 'object') {
            return;
        }
        if(group == null || typeof group != 'object') {
            return;
        }
        if (group.isMemberList) {
            return;
        }

        var _avatarListElem = parent.children('li.list-contact').eq(0);
        var _showProcessCount = 0;
        function _showOnePersonItem() {
            var _loopCount = 20;
            for(var _i = 0; _i < _loopCount; _i++) {
                if(_showProcessCount >= group.person.length) {
                    group.isMemberList = true;
                    break;
                }
                var _person = group.person[_showProcessCount];

                var _personHtml = _self._createHtmlOnePersonFromPersonData(_person, group.name);

                _avatarListElem.append(_personHtml);
                _showProcessCount++;
            }
            if(_showProcessCount >= group.person.length) {
                setTimeout(function(){
                    callback(true);
                }, 1);
                ViewUtils.hideLoadingIcon(_avatarListElem);
                return;
            }
            setTimeout(function(){
                _showOnePersonItem();
            }, 1);
        }
        setTimeout(function(){
            ViewUtils.showLoadingIcon(_avatarListElem);
            _showOnePersonItem();
        }, 1);
    };

    _proto._asyncAddGroupToPersonList = function(parent, group, callback) {
        var _self = this;
        if(parent == null || typeof parent != 'object') {
            callback(false);
            return;
        }
        if(group == null || typeof group != 'object') {
            callback(false);
            return;
        }
        var _groupHtml = _self._createHtmlOneGroupFromGroupData(group);

        parent.append(_groupHtml);

        var _avatarListElem = parent.children('ul.list-contact');
        var _showProcessCount = 0;
        function _showOnePersonItem() {
            var _loopCount = 20;
            for(var _i = 0; _i < _loopCount; _i++) {
                if(_showProcessCount >= group.person.length) {
                    group.isMemberList = true;
                    break;
                }
                var _person = group.person[_showProcessCount];
                var _personHtml = _self._createHtmlOnePersonFromPersonData(_person);
                _avatarListElem.append(_personHtml);
                _showProcessCount++;
            }
            if(_showProcessCount >= group.person.length) {
                setTimeout(function(){
                    callback(true);
                }, 1);
                return;
            }
            setTimeout(function(){
                _showOnePersonItem();
            }, 1);
        }
        setTimeout(function(){
            _showOnePersonItem();
        }, 1);
    };

    _proto._createOneGroupData = function(groupName, personList, existing, personCount) {
        var _personCount = personCount ? personCount : personList.getCount();
        var _searchResultGroup = {
            name : groupName,
            personCount : _personCount,
            person : [],
            existing : existing
        };
        var _count = personList.getCount();
        for(var i=0; i<_count; i++){
            _searchResultGroup.person[i] = personList.get(i);
        }
        return _searchResultGroup;
    };
    _proto._createHtmlOneGroupFromGroupData = function(group) {
        var _insertHtml = '<ul class="list-contact sidebar_list"></ul>';

        return $(_insertHtml);
    };

    _proto._createHtmlOnePersonFromPersonData = function(person, groupName){
        var _self = this;
        var _person = person;
        var _jid = _person.getJid();

        var _bFavorite = false;
        var _favoriteId = FavoriteStore.getInstance().getGroupIdByName(groupName);
        if(_favoriteId >= 0){
            _bFavorite = true;
        }
        var groupName = ViewUtils.getGroupName(_person);

        var avatarHtml = '';
        if (ViewUtils.getAvatarUrl(_person) == ViewUtils.DEFAULT_USER_AVATAR_SRC) {
          avatarHtml = ViewUtils.getDefaultAvatarHtml(_person);
        } else {
          avatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(_person);
        }

        var _insertAvatarHtml = '';
        _insertAvatarHtml += '<li jid="' + _jid + '">';
        _insertAvatarHtml += '  <a title="' + Utils.convertEscapedHtml(_person.getUserName()) + '  ' + Utils.convertEscapedHtml(groupName) + '">';
        _insertAvatarHtml += '    <span class="ico ico_user status ' + ViewUtils.getPresenceColorCss(_person.getPresence()) + '">';
        _insertAvatarHtml += avatarHtml;
        _insertAvatarHtml += '    </span>';
        _insertAvatarHtml += '    <span class="name">' + Utils.convertEscapedHtml(_person.getUserName()) + ViewUtils.getUserStatusString(_person.getStatus()) + '</span>';
        _insertAvatarHtml += '    <span class="group">' + Utils.convertEscapedHtml(groupName) + '</span>';
        _insertAvatarHtml += '</a></li>';
        var _retElem = $(_insertAvatarHtml);

        var _updateElemSelectorNickName = _retElem.find('.info-user-nickname');
        var _nickNameContent = _updateElemSelectorNickName.attr('title');
        _updateElemSelectorNickName.attr('title',_nickNameContent);

        var _mTipOwner = _retElem.find('.block-avatar');
        TooltipView.getInstance().setAvatarToolTip(TooltipView.TYPE_USER_AVATAR, _mTipOwner, false, {
            align : 'bottom left'
        });
        if(_self._mTipList && _mTipOwner.data('mTip') && _mTipOwner.data('mTip').tipID){
            _self._mTipList.add(_mTipOwner.data('mTip').tipID);
        }

        if(_bFavorite){
            var _child;
            if(_bIE89){
                _child = _retElem.children().children().children().children().children('div.cancel').children();
            }
            else{
                _child = _retElem.children('div.cancel').children();
            }
            _child.on('click', function(e){
                var _okCallback = function(){
                    var _jidList = [];
                    _jidList.add(person.getJid());
                    FavoriteStore.getInstance().removeGroupMember(_favoriteId, _jidList);
                    if(_self._parentObj && _self._parentObj.removeSelectedUserList){
                        _self._parentObj.onRemoveFavoriteListMemberSuccessCallback(_favoriteId, _jidList);
                    }
                }
                e.stopPropagation();
                var _message = Resource.getMessage('dialog_label_remove');
                _message = _message.replace('[[1]]', person.getUserName());
                _message = _message.replace('[[2]]', groupName);
                new MessageBox(_message, _okCallback, true, null, Resource.getMessage('dialog_title_remove_favorite'));
            });
        }

        return _retElem;
    };

    _proto._getUserNameAreaHtml = function(person) {
        var _ret = '';
        if(person == null || typeof person != 'object') {
            return _ret;
        }
        var _jid = person.getJid();
        var _nickname = person.getUserName();
        var _accountName = person.getLoginAccount();
        var _status = person.getStatus();
        _ret = '<div class="contact-list-info info-user-nickname box-border-for-abbreviation"'
             + ' title="'+ Utils.convertEscapedTag(_nickname)
             + ViewUtils.getUserStatusString(_status)
             + ' @' + Utils.convertEscapedTag(_accountName) + '">'
             + Utils.convertEscapedHtml(_nickname)
             + ViewUtils.getUserStatusString(_status)
             // This expression has no effect.
             // + '<span class="sender-account">@' + Utils.convertEscapedHtml(_accountName) + '</span>';
             + '<span class="sender-account">@' + Utils.convertEscapedHtml(_accountName) + '</span>'
             + '</div>';
        return _ret;
    };
    function _asyncSortContactListItems(personsArray, start, end, callback) {
        if(personsArray.length == 0 || start >= end ) {
            _onSorted();
            return;
        }
        var _pivotItem = personsArray[Math.floor((start + end) / 2)];
        var _pivotStr = encodeURIComponent(_pivotItem.getUserName());
        var _i = start;
        var _j = end;
        var _personsArrayMaxIdx = personsArray.length - 1;
        while (true) {
            while (encodeURIComponent(personsArray[_i].getUserName()) < _pivotStr) {
                _i++;
                if (_i > _personsArrayMaxIdx) {
                    break;
                }
            }
            while (_pivotStr < encodeURIComponent(personsArray[_j].getUserName())) {
                _j--;
                if (_j < 0) {
                    break;
                }
            }
            if (_i >= _j) {
                break;
            }
            var n = personsArray[_i];
            personsArray[_i] = personsArray[_j];
            personsArray[_j] = n;
            _i++;
            _j--;
        }
        function _firstHalfSort(_onFirstHalfSortCallback) {
            if (start < _i - 1) {
                function _onAsyncSort() {
                    _onFirstHalfSortCallback();
                }
                _asyncSortContactListItems(personsArray, start, _i - 1, _onAsyncSort);
            } else {
                setTimeout(function(){
                    _onFirstHalfSortCallback();
                }, 1);
            }
        };
        function _lastHalfSort(_onLastHalfSortCallback) {
            if (_j + 1 < end) {
                function _onAsyncSort() {
                    _onLastHalfSortCallback();
                }
                _asyncSortContactListItems(personsArray, _j + 1, end, _onAsyncSort);
            } else {
                setTimeout(function(){
                    _onLastHalfSortCallback();
                }, 1);
            }
        };
        function _onSorted() {
            setTimeout(function() {
                callback();
            }, 1);
        };
        function _onFirstHalf() {
            _lastHalfSort(_onSorted);
        };
        _firstHalfSort(_onFirstHalf);
    };
    function _asysncSortGroup(groupsArray, start, end, callback) {
        if(groupsArray.length == 0 || start >= end ) {
            _onSorted();
            return;
        }
        var _pivotGroup = groupsArray[Math.floor((start + end) / 2)];
        var _pivotStr = _pivotGroup.name;
        var _i = start;
        var _j = end;
        var _groupsArrayMaxIdx = groupsArray.length - 1;
        while (true) {
            while (groupsArray[_i].name < _pivotStr) {
                _i++;
                if (_i > _groupsArrayMaxIdx) {
                    break;
                }
            }
            while (_pivotStr < groupsArray[_j].name) {
                _j--;
                if (_j < 0) {
                    break;
                }
            }
            if (_i >= _j) {
                break;
            }
            var n = groupsArray[_i];
            groupsArray[_i] = groupsArray[_j];
            groupsArray[_j] = n;
            _i++;
            _j--;
        }
        function _firstHalfSort(_onFirstHalfSortCallback) {
            if (start < _i - 1) {
                function _onAsyncSort() {
                    _onFirstHalfSortCallback();
                }
                _asysncSortGroup(groupsArray, start, _i - 1, _onAsyncSort);
            } else {
                setTimeout(function(){
                    _onFirstHalfSortCallback();
                }, 1);
            }
        };
        function _lastHalfSort(_onLastHalfSortCallback) {
            if (_j + 1 < end) {
                function _onAsyncSort() {
                    _onLastHalfSortCallback();
                }
                _asysncSortGroup(groupsArray, _j + 1, end, _onAsyncSort);
            } else {
                setTimeout(function(){
                    _onLastHalfSortCallback();
                }, 1);
            }
        };
        function _onSorted() {
            setTimeout(function() {
                callback();
            }, 1);
        };
        function _onFirstHalf() {
            _lastHalfSort(_onSorted);
        };
        _firstHalfSort(_onFirstHalf);
    };

    _proto._getGroupByName = function (sortedData, groupname) {
        for (var i = 0; i < sortedData.length; i++) {
            if (sortedData[i].name == groupname) {
                return sortedData[i];
            }
        }
        return null;
    };

})();
