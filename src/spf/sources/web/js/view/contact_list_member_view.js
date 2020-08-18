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

function ContactListMemberView(partsType, callbacks) {
    SideMenuUserListView.call(this, partsType, 'member-list', callbacks);
};(function() {
    ContactListMemberView.prototype = $.extend({}, SideMenuUserListView.prototype);
    var _super = SideMenuUserListView.prototype;
    var _proto = ContactListMemberView.prototype;

    _proto.getPersonData = function(jid){
        var _self = this;
        return CubeeController.getInstance().getPersonData(jid);
    };

    _proto.notifyAddContactListMemberCallBack = function(addMemberList){
        if(addMemberList == null || typeof addMemberList != 'object'){
            return;
        }
        var _self = this;
        var _count = addMemberList.getCount();
        var _cacheSortData = ContactList.getInstance().getSortedData();
        var _processedCount = 0;

        setTimeout(function(){
            _asyncAddMember();
        }, 1);

        function _asyncAddMember(){
            if(_count <= _processedCount) {
                _self.refreshAccrodion();
                ViewUtils.clearAutoCompleteEventToTextArea(ViewUtils.TYPE_CONTACT_LIST);
                return;
            } else {
                var _addMemberListItem = addMemberList.get(_processedCount);
                var _person = _addMemberListItem.getPerson();

                var _groupArray = _addMemberListItem.getContactListGroup();
                var _groupCount = _groupArray.length;
                var _positionArray =  _addMemberListItem.getPosition();
                if(_groupCount == 0){
                    _addMemberView(Resource.getMessage('group_title_no_group'), -1, _person, true);
                    _processedCount++;
                    setTimeout(function(){
                        _asyncAddMember();
                    }, 1);
                    return;
                }
                var _processedGroupCount = 0;
                var _groupName = _groupArray[_processedGroupCount];
                var _position = _positionArray[_processedGroupCount];
                _addMemberView(_groupName, _position, _person, false, function(){_onAddMemberViewCallBack();});

                function _onAddMemberViewCallBack(){
                    _processedGroupCount++;
                    if(_groupCount <= _processedGroupCount) {
                        _processedCount++;
                        setTimeout(function(){
                            _asyncAddMember();
                        }, 1);
                        return;
                    }
                    var _groupName = _groupArray[_processedGroupCount];
                    var _position = _positionArray[_processedGroupCount];
                    _addMemberView(_groupName, _position, _person, false, _onAddMemberViewCallBack);
                }
            }
        }

        function _addMemberView(groupName, position, person, existing, onAddMemberCallBack){
            var _escapedGroupName = Utils.convertEscapedTag(groupName);
            var _rootElem = _self.getHtmlElement();
            var _targetElem = _rootElem.find('.group[groupname="' + _escapedGroupName + '"]');
            var _insertPos = {
                group : _targetElem.index(),
                person :  0
            };

            if(_targetElem.length > 0){
                var _group = _self._getGroupByName(_cacheSortData, _escapedGroupName);
                if (_group) {
                    if (_group.isMemberList) {
                        var _personHtmlElem = _self._createHtmlOnePersonFromPersonData(person);
                        var _userNodes = _targetElem.find('.list-contact').children();

                        if(position == 0){
                            _targetElem.find('.list-contact').prepend(_personHtmlElem);
                        }else if(position < 0 || _userNodes.length < position){
                            _targetElem.find('.list-contact').append(_personHtmlElem);
                            _insertPos.person = _userNodes.length;
                        }else{
                            _userNodes.eq(position - 1).after(_personHtmlElem);
                            _insertPos.person = position - 1;
                        }
                    }
                    _targetElem = _rootElem.find('.group[groupname="' + _escapedGroupName + '"]');
                    var _memberElems = _targetElem.children('.list-contact').children();
                    var _memberCount = _group.person.length + 1;
                    var _groupTitle = groupName + '(' + _memberCount + ')';
                    _headerElem = _targetElem.children('h3').children('a');
                    _headerElem.attr('title', groupName);
                    _headerElem.text(_groupTitle);
                    _callBack(_insertPos, person);
                }
            }else{
                var _group = {};
                _group.name = groupName;
                _group.personCount = 1;
                _group.person = [ person ];
                _group.existing = existing;
                var _groupListArea = _rootElem.find('#groupList-' + _self._listViewType);
                _insertPos.group = _groupListArea.children().length;
                _self._asyncAddGroupToPersonList(_groupListArea, _group, function(result){
                    _callBack(_insertPos, _group);
                });
            }

            function _callBack(insertPos, insertObj){
                if(insertObj instanceof Person){
                    var _group = _cacheSortData[insertPos.group];
                    if(_group){
                        var _personList = _group.person;
                        _personList.splice(insertPos.person, 0, insertObj);
                        _group.personCount = _personList.length;
                    }
                }else{
                    _cacheSortData.push(insertObj);
                }

                if(onAddMemberCallBack != null && typeof onAddMemberCallBack == 'function'){
                    setTimeout(function(){
                        onAddMemberCallBack();
                    }, 1);
                }
            }
        }
    };

    _proto.notifyRemoveContactListMemberCallBack = function (removedMemberList) {
        if (removedMemberList == null || typeof removedMemberList != 'object') {
            return;
        }
        var _self = this;
        var _count = removedMemberList.getCount();
        var _rootElem = _self.getHtmlElement();
        var _cacheSortData = ContactList.getInstance().getSortedData();

        setTimeout(function(){
            _asyncRemoveMember();
        }, 1);

        function _asyncRemoveMember() {
            for (var _processedCount = 0; _processedCount < _count; _processedCount++) {
                var _jid = removedMemberList.get(_processedCount).jid;
                for (var _groupCount = 0; _groupCount < _cacheSortData.length; _groupCount++) {
                    var _group = _cacheSortData[_groupCount];
                    var _persons = _group.person;
                    var _personsBeforeCount = _persons.length;
                    var _personsAfterCount = _personsBeforeCount;

                    var _favoriteId = FavoriteStore.getInstance().getGroupIdByName(_group.name);

                    for (var _personCount = 0; _personCount < _persons.length; _personCount++) {
                        if (_persons[_personCount]._jid == _jid) {

                            if(_favoriteId >= 0){
                                var _list = [];
                                _list.add(_persons[_personCount]._jid);
                                FavoriteStore.getInstance().removeGroupMember(_favoriteId, _list);
                            }

                            _persons.splice(_personCount, 1);
                            _personsAfterCount = _persons.length;
                            _group.personCount = _personsAfterCount;
                            _personCount--;
                            if (_group.isMemberList) {
                                _removeUser(_group.name, _jid);
                            }
                        }
                    }

                    if (_personsAfterCount == 0 && _favoriteId < 0) {
                        _cacheSortData.splice(_groupCount, 1);
                        _groupCount--;
                        _removeGroup(_group.name);
                    }
                    else if (_personsBeforeCount != _personsAfterCount) {
                        _updateHeader(_group.name, _personsAfterCount);
                    }
                }
            }

            _self.refreshAccrodion(true);
            ViewUtils.clearAutoCompleteEventToTextArea(ViewUtils.TYPE_CONTACT_LIST);

            function _updateHeader(groupname, count) {
                var _escapedGroupName = Utils.convertEscapedHtml(groupname);
                var _targetElem = _rootElem.find('.group[groupname="' + _escapedGroupName + '"]');
                var _oldText = _targetElem.find('a').text();
                var _newText = _oldText.substring(0, _oldText.lastIndexOf('(')) + '(' + count + ')';
                _targetElem.find('a').text(_newText);
                _targetElem.find('a').attr('title', _newText);
            }

            function _removeGroup(groupname) {
                var _escapedGroupName = Utils.convertEscapedHtml(groupname);
                var _targetElem = _rootElem.find('.group[groupname="' + _escapedGroupName + '"]');
                if (_targetElem.length > (-1)) {
                    _targetElem.eq(0).remove();
                }
            }

            function _removeUser(groupname, jid) {
                var _escapedGroupName = Utils.convertEscapedHtml(groupname);
                var _groupElem = _rootElem.find('.group[groupname="' + _escapedGroupName + '"]');
                var _targetElem = _groupElem.find('div.contact-list-box[jid="' + jid + '"]');
                if (_targetElem.length > (-1)) {
                    _targetElem.eq(0).remove();
                }
            }

        }
    };

    _proto.resizeContent = function() {
        var _self = this;
        if(!ViewUtils.isIE89()){
            return;
        }
        _self._setGroupListHeightForIE89();
    };
    _proto.resizeAreaForIE89 = function() {
        var _self = this;
        if(!ViewUtils.isIE89()){
            return;
        }
        _self._setGroupListHeightForIE89();
    };
    _proto._setGroupListHeightForIE89 = function(){
        if(!ViewUtils.isIE89()){
            return;
        }
        var _self = this;
        var _rootElm = _self._frame;
        if(_rootElm == null || _rootElm.css('display') == 'none'){
            return;
        }
        var _parent = _rootElm.parent();
        var _groupListArea = _rootElm.find('#groupList-' + _self._listViewType);
        var _parentHeight = _parent.parent().outerHeight(true);
        var _startChatFormObjHeight = 0;
        var _searchViewHeight = _rootElm.closest('dd').find('#ui-tab').outerHeight();
        var _contentsHeight = _parentHeight - _searchViewHeight;
        _groupListArea.height(_contentsHeight);
    };

    _proto.notifyAddFavoriteMemberCallBack = function(favoriteId, jidList){
        var _self = this;
        var _addMemberList = [];
        var _addMemberCount = jidList.length;

        for(var _i = 0; _i < _addMemberCount; _i++){
            _addMemberList[_i] = _self.getPersonData(jidList[_i]);
        }

        var _groupName = FavoriteStore.getInstance().getGroupName(favoriteId);
        var _escapedGroupName = Utils.convertEscapedHtml(_groupName);

        var _cacheSortData = ContactList.getInstance().getSortedData();
        var _rootElem = _self.getHtmlElement();
        var _targetElem = _rootElem.find('.group[groupname="' + _escapedGroupName + '"]');

        var _group = _cacheSortData[_targetElem.index()];
        var _personList = _group.person;
        _removeMemberHtml(_rootElem, _escapedGroupName, _personList);
        _personList.splice(0, _personList.length);
        _group.personCount = 0;

        
        _group.person = _addMemberList;
        _group.personCount = _addMemberCount;

        if(_group.isMemberList){
            var _personHtmlElem = {};
            for(_i = 0; _i < _addMemberCount; _i++){
                _personHtmlElem = _self._createHtmlOnePersonFromPersonData(_addMemberList[_i], _groupName);
                _targetElem.find('.list-contact').append(_personHtmlElem);
            }
        }
        _updateHeaderHtml(_rootElem, _groupName, _addMemberCount);
    };

    _proto.notifyRemoveFavoriteMemberCallBack = function(favoriteId, jidList){
        var _self = this;
        var _groupName = FavoriteStore.getInstance().getGroupName(favoriteId);
        var _escapedGroupName = Utils.convertEscapedHtml(_groupName);

        var _cacheSortData = ContactList.getInstance().getSortedData();
        var _rootElem = _self.getHtmlElement();
        var _targetElem = _rootElem.find('.group[groupname="' + _escapedGroupName + '"]');

        var _group = _cacheSortData[_targetElem.index()];
        var _personList = _group.person;

        var _removeMemberCount = jidList.length;
        var _removeList = [];
        for(var _i = 0; _i < _removeMemberCount; _i++){
            var _jid = jidList[_i];
            for(var _index = 0; _index < _personList.length; _index++){
                if(_personList[_index]._jid == _jid){
                    _removeList.add(_personList[_index]);
                    _personList.splice(_index, 1);
                    _group.personCount--;

                }
            }
        }
        if(_removeList.length > 0){
            _removeMemberHtml(_rootElem, _escapedGroupName, _removeList);
            _updateHeaderHtml(_rootElem, _groupName, _personList.length);
        }
    };

    function _removeMemberHtml(rootElem, _escapedGroupName, personList){
        var _groupElem = rootElem.find('.group[groupname="' + _escapedGroupName + '"]');
        for(var _i = 0; _i < personList.length; _i++){
            var _jid = personList[_i].getJid();
            var _targetElem = _groupElem.find('div.contact-list-box[jid="' + _jid + '"]');
            if (_targetElem.length > (-1)) {
                _targetElem.eq(0).remove();
            }
        }
    };

    function _updateHeaderHtml(rootElem, groupName, count){
        var _escapedGroupName = Utils.convertEscapedHtml(groupName);

        var _targetElem = rootElem.find('.group[groupname="' + _escapedGroupName + '"]');
        var _memberElems = _targetElem.children('.list-contact').children();
        var _groupTitle = groupName + '(' + count + ')';
        var _headerElem = _targetElem.children('h3').children('a');
        _headerElem.attr('title', groupName);
        _headerElem.text(_groupTitle);
    };

})();


