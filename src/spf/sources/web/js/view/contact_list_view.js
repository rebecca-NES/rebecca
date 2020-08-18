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

function ContactListView() {
    SideMenuAccordionParts.call(this);
    this._userListView = null;
    this._searchView = null;
    this._searchResultView = null;
    this._callbacks = null;
    this._isOpenSearchResultView = false;

    this.VIEW_PARTS_TYPE = 'contact-list';
    this.viewPartsListHeader = ContactListView._VIEW_PARTS_LIST_HEADER;
};(function() {
    ContactListView.SELECTED_AVATARS_AREA_CLS_NAME = 'selected_users_area';
    ContactListView._VIEW_PARTS_LIST_HEADER = 'contact-list-header';

    ContactListView.prototype = $.extend({}, SideMenuAccordionParts.prototype);
    var _super = SideMenuAccordionParts.prototype;
    var _proto = ContactListView.prototype;

    _proto.init = function(opts) {
        var _self = this;
        _self.opts = opts;
        _super.init.call(_self);
        _self._headerDisplayName = Resource.getMessage('ContactList');

        _self._callbacks = {
            getSelectedUserList : _self.getSelectedUserList.bind(_self),
            addSelectedUserList : _self.addSelectedUserList.bind(_self),
            removeSelectedUserList : _self.removeSelectedUserList.bind(_self),
            removeSelectedUserListAll : _self.removeSelectedUserListAll.bind(_self),
            onRemoveView : _self.onRemoveView.bind(_self),
            searchExecuteFromAllUser : _self.searchExecuteFromAllUser.bind(_self),
            onAddContactListMemberSuccessCallback : _self.onAddContactListMemberSuccessCallback.bind(_self),
            onRemoveContactListMemberSuccessCallback : _self.onRemoveContactListMemberSuccessCallback.bind(_self),

            onAddFavoriteMemberSuccessCallback : _self.onAddFavoriteMemberSuccessCallback.bind(_self),
            onRemoveFavoriteListMemberSuccessCallback : _self.onRemoveFavoriteMemberSuccessCallback.bind(_self)
        };
        _self._userListView = new ContactListMemberView(_self.VIEW_PARTS_TYPE, _self._callbacks);

        _self._subParts = [_self._subView, _self._userListView, _self._searchView, _self._searchResultView];
        _self.createFrame()
        return _self;
    };

    _proto.cleanUp = function() {
        var _self = this;
        _super.cleanUp.call(_self);
        if(_self._startChatFormObj){
            _self._startChatFormObj.cleanUp();
            _self._startChatFormObj = null;
        }
        if(_self._selectedUserList){
            _self._selectedUserList.removeAll();
            _self._selectedUserList = null;
        }
        _self._headerDisplayName = null;

        if(_self._userListView){
            _self._userListView.cleanUp();
            _self._userListView = null;
        }
        if(_self._subView){
            _self._subView.cleanUp();
            _self._subView = null;
        }
        if(_self._searchView){
            _self._searchView.cleanUp();
            _self._searchView = null;
        }
        if(_self._searchResultView){
            _self._searchResultView.cleanUp();
            _self._searchResultView = null;
        }
    };

    _proto.createFrame = function() {
        var _self = this;
        var _topElem = '<div class="sidebar_list ' + this.VIEW_PARTS_TYPE + '-top box-border olient-vertical flex1"></div>';
        var _userListViewHtmlObj = _self._userListView._frame;
        var _contents = $(_topElem).append(_userListViewHtmlObj);
        _self._frame = _contents;
        return _contents;
    };

    _proto.showInnerFrame = function(callback) {
        var _self = this;
        var _contactList = ContactList.getInstance();
        return _self._userListView._asyncShowPersonList(_contactList, callback, _self.opts);
    };

    _proto.moreAddPerson = function(beforeListNumber) {
        var _self = this;
        var _contactList = ContactList.getInstance();
        return _self._userListView._addContactListDialog(_contactList, beforeListNumber);
    }

    var _onProfileChangedFunc = {};
    _onProfileChangedFunc[ProfileChangeNotice.TYPE_PRESENCE] = _onPresenceNotify;
    _onProfileChangedFunc[ProfileChangeNotice.TYPE_PROFILE] = _onProfileNotify;

    _proto.onProfileChanged = function(profile) {
        var _self = this;
        var _type = profile.getType();
        var _profileChangedFunc = Utils.getSafeValue(_onProfileChangedFunc, _type, function(){});
        _profileChangedFunc(_self, profile);
    };

    function _onPresenceNotify(contactListView, profile){
        var _jid = profile.getJid();
        contactListView.updateContactListPresence(_jid);
    }

    function _onProfileNotify(contactListView, profile){
        var _jid = profile.getJid();
        contactListView.updateContactListProfile(_jid);
    }
    _proto.updateContactListPresence = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return false;
        }
        var _person = CubeeController.getInstance().getContactListData(jid);
        if(_person == null) {
            return false;
        }

        var _self = this;
        var root = _self.getHtmlElement();
        var _updateElems = root.find('li[jid=\'' + jid + '\']');

        if (_updateElems) {
            var personHtml = _self._userListView._createHtmlOnePersonFromPersonData(_person);
            var _newMark = false;
            if(_updateElems.find('.new_message_notice').size() != 0){
                _newMark = true;
            }
            _updateElems.replaceWith(personHtml);
            if(_newMark){
                ViewUtils.setNewNoticeMark(root.find('li[jid=\'' + jid + '\']').children("a"));
            }
        }
        return true;
    };
    function _onShowToolTip( $tip, options, event){
        if(event.type == 'longtap'){
            return false;
        }
    }
    _proto.updateContactListProfile = function(jid) {
        if(jid == null || typeof jid != 'string') {
            return false;
        }
        var _person = CubeeController.getInstance().getContactListData(jid);
        if(_person == null) {
            return false;
        }
        var _self = this;
        var root = _self.getHtmlElement();
        var _updateElems = root.find('li[jid=\'' + jid + '\']');

        if (_updateElems) {
            var personHtml = _self._userListView._createHtmlOnePersonFromPersonData(_person);
            var _newMark = false;
            if(_updateElems.find('.new_message_notice').size() != 0){
                _newMark = true;
            }
            _updateElems.replaceWith(personHtml);
            if(_newMark){
                ViewUtils.setNewNoticeMark(root.find('li[jid=\'' + jid + '\']').children("a"));
            }
        }
        return true;
    };

    _proto.resizeContent = function() {
        var _self = this;
        var _cotactListArea = _self.getHtmlElement();
        if(_cotactListArea == null){
            return;
        }
        if(_cotactListArea.css('display') == 'none') {
            return;
        }
        _self._subParts.forEach(function(elem){
            if(elem && elem.resizeContent){
                elem.resizeContent();
            }
        });
        if(ViewUtils.isIE89()){
            var _width = _cotactListArea.outerWidth(true);
            _cotactListArea.find('.contact-list-box').width(_width);
            _cotactListArea.find('.list-contact').css('overflow-x', 'hidden');
        }
    };

    _proto.resizeAreaForIE89 = function() {
        var _self = this;
        if(!ViewUtils.isIE89()){
            return;
        }
        _self._subParts.forEach(function(elem){
            if(elem && elem.resizeAreaForIE89){
                elem.resizeAreaForIE89();
            }
        });
        if(_self._subView){
            _self._subView.setListInnerContainerScrollForIE89();
        }
    };

    _proto.getSelectedUserList = function() {
        if(!this._subView){
            return new ArrayList();
        }
        return this._subView.getSelectedUserList();
    };
    _proto.addSelectedUserList = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return;
        }

        if(!_self._subView){
            _self._subView = new ContactListSubView(_self.VIEW_PARTS_TYPE, _self._callbacks);
            $('#listInnerContainer').append(_self._subView._frame);
        }

        _self._subView.addSelectedUserList(person);
        _self._subView.show();
        _self.notifyChangeSelectedUserList();
    };
    _proto.removeSelectedUserList = function(person) {
        var _self = this;
        if(person == null || typeof person != 'object') {
            return;
        }
        if(!_self._subView){
            return;
        }
        _self._subView.removeSelectedUserList(person);

        _self.notifyChangeSelectedUserList();

        if(_self.getSelectedUserList().getCount() == 0){
            _self._subView.hide();
            _self._subView.cleanUp();
            _self._subView = null;
            var _viewHtml = $('#listContainer #' + _self.VIEW_PARTS_TYPE + '-subview');
            if(_viewHtml.length > 0){
                _viewHtml.remove();
            }
        }
    };
    _proto.removeSelectedUserListAll = function() {
        var _self = this;
        if(!_self._subView){
            return;
        }
        _self._subView.removeSelectedUserListAll();

        _self.notifyChangeSelectedUserList();

        _self._subView.hide();
        _self._subView.cleanUp();
        _self._subView = null;
        var _viewHtml = $('#listContainer #' + _self.VIEW_PARTS_TYPE + '-subview');
        if(_viewHtml.length > 0){
            _viewHtml.remove();
        }
    };

    _proto.notifyChangeSelectedUserList = function(){
        var _self = this;
        var _selectedUserList = _self.getSelectedUserList();
        [_self._subView, _self._userListView, _self._searchResultView].forEach(function(elem){
            if(elem){
                elem.receivedChangeSelectedUser(_selectedUserList);
            }
        });
    };

    _proto.beforeActivate = function(targetObj){
        var _self = this;
        if(targetObj instanceof ContactListView){
            return;
        }
        if(_self._subView){
            _self._subView.hide();
        }
    };
    _proto.activate = function(targetObj){
        var _self = this;
        if(!(targetObj instanceof ContactListView)){
            return;
        }
        if(_self._subView){
            _self._subView.show();
        }
    };

    _proto.searchExecute = function(tabIndex, condition){
        var _self = this;
        if(typeof tabIndex != 'number' || typeof condition != 'object'){
            return;
        }

        if(!_self._searchResultView){
            var _searchInfo = {
                condition : condition,
                isOpenSearchResultView : function(){return _self._isOpenSearchResultView;},
                selectedTabIndex : function(){return _self._searchView._selectedTabIndex;},
                lastExecSearchTabIndex : function(){return _self._searchView._lastExecSearchTabIndex;}
            };
            _self._searchResultView = new SearchPersonResultView(_self.VIEW_PARTS_TYPE,_searchInfo, _self._callbacks);
            _self._frame.append(_self._searchResultView._frame);
        }else{
            _self._searchResultView.initialize(condition);
        }

        switch(tabIndex){
            case SearchPersonView.TAB_TYPE_INNER_SEARCH:
                _self.searchExecuteFromContactListUser(condition);
                break;
            case SearchPersonView.TAB_TYPE_ALL_USER_SEARCH:
                _self.searchExecuteFromAllUser(condition);
                break;
        }
    };
    _proto.searchExecuteFromContactListUser = function(condition){
        if (!condition || typeof condition != 'object') {
            return;
        }
        var _self = this;
        if(!_self._searchResultView){
            return;
        }
        var _searchTarget = ContactList.getInstance();
        setTimeout(function(){
            ViewUtils.searchUserExecute(_searchTarget, condition, function(_resultUserList){
                if(_self._searchResultView && _self._searchResultView._asyncShowPersonList){
                    _self._searchResultView._asyncShowPersonList(_resultUserList, function(){
                            _self._searchResultView._refreshSearchResultList(_resultUserList);
                            _self.notifyChangeSelectedUserList();
                        }
                    );
                }

            });
        },1);
        _self.switchActiveView(1);
        _self._searchResultView.getHtmlElement().addClass('hide-view');
        ViewUtils.showLoadingIcon(_self._searchResultView.getHtmlElement());
    };
    _proto.searchExecuteFromAllUser = function(condition){
        if (!condition || typeof condition != 'object') {
            return;
        }
        var _self = this;
        if(!_self._searchResultView){
            return;
        }
        var _startId = _self._searchResultView._currentLoadedJidForAllUserSearch;

        var _onSearchPersonCallback = function(resultList){
            var _resultUserList = resultList;
            if(!_resultUserList){
                _resultUserList = new SearchResultPersonList();
            }
            if(_self._searchResultView && _self._searchResultView.onSearchPersonCallback){
                _self._searchResultView.onSearchPersonCallback(_resultUserList,
                    function(){_self.notifyChangeSelectedUserList();}
                );
            }
        };
        var _ret = _self._searchView.searchAllUser(_startId, condition, _onSearchPersonCallback);
        if(_ret){
            _self.switchActiveView(1);
            if(_startId == 0){
                _self._searchResultView.getHtmlElement().addClass('hide-view');
            }
            ViewUtils.showLoadingIcon(_self._searchResultView.getHtmlElement());
        }
    };
    _proto.switchActiveView = function(activeIndex){
        var _self = this;
        switch(activeIndex){
            case 0:
                $('.' + _self.VIEW_PARTS_TYPE).removeClass('hide-view');
                $('.' + _self.VIEW_PARTS_TYPE + '-search-result').addClass('hide-view');
                _self._isOpenSearchResultView = false;
            break;
            case 1:
                $('.' + _self.VIEW_PARTS_TYPE).addClass('hide-view');
                $('.' + _self.VIEW_PARTS_TYPE + '-search-result').removeClass('hide-view');
                _self._isOpenSearchResultView = true;
            break;
            default:
            break;
        }
        return activeIndex;
    };

    _proto.onRemoveView = function(){
        var _self = this;
        _self.switchActiveView(0);
        _self._searchResultView = null;
    };

    _proto.onAddContactListMemberSuccessCallback = function(result){
        var _self = this;
        _self.removeSelectedUserListAll();

        if(!result){
            return;
        }
        var _addUserList = result.addSuccessMemberList;

        _self._subParts.forEach(function(elem){
            if(elem && elem.notifyAddContactListMemberCallBack){
                elem.notifyAddContactListMemberCallBack(_addUserList);
            }
        });
    };
    _proto.onRemoveContactListMemberSuccessCallback = function(result){
        var _self = this;
        _self.removeSelectedUserListAll();

        if(!result){
            return;
        }
        var _removedUserList = result.removeSuccessMemberList;

        _self._subParts.forEach(function(elem){
            if(elem && elem.notifyRemoveContactListMemberCallBack){
                elem.notifyRemoveContactListMemberCallBack(_removedUserList);
            }
        });
    };

    _proto.onAddFavoriteMemberSuccessCallback = function(favoriteId, jidList){
        this._userListView.notifyAddFavoriteMemberCallBack(favoriteId, jidList);
    }

    _proto.onRemoveFavoriteMemberSuccessCallback = function(favoriteId, jidList){
        this._userListView.notifyRemoveFavoriteMemberCallBack(favoriteId, jidList);
    }

    _proto.notifyChatMessage = function(msg) {
        var _self = this;
        if(!msg) {
          return;
        }
        var from = msg.getFrom();
        var to = msg.getTo();
        var loginUserJid = LoginUser.getInstance().getJid();
        var jid = loginUserJid == from ? to : from;
        var _newMark = false;
        if(from != loginUserJid){
            _newMark = true;
        }
        _self.addChatMember(jid, _newMark);
    }
    _proto.addChatMember = function(jid, newMark) {
        var _self = this;
        if(!jid) {
            return;
        }
        var root = $('#left_sidebar').find(this.getHtmlElement());
        var selector = 'li[jid=\'' + jid + '\'] a';
        function setMarkAndShow() {
            if(newMark) {
                if(root.find(selector).find('.new_message_notice').length == 0) {
                    ViewUtils.setNewNoticeMark(root.find(selector));
                }
            }
            root.find(selector).parent().prependTo(root.find(selector).parent().parent());
        }
        function dspUser(){
            if(root.find(selector).length == 0) {
                CubeeController.getInstance().getPersonDataByJidFromServer(jid, function(person) {
                    if (person && person.getCount() > 0) {
                        if(root.find("li").size() == 5){
                            root.find("li").eq(4).find("*").off();
                            root.find("li").eq(4).remove();
                        }
                        _self._userListView.showPerson(person.get(0));
                        setMarkAndShow();
                    }
                });
            } else {
              setMarkAndShow()
            }
        }
        var postData = new ArrayList();
        postData.add({jid: jid, contactListGroup: ''});
        CubeeController.getInstance().addContactListMember(postData, dspUser);
    }
    _proto.onNotifyAddChatMember = function(AddContactListMemeberList) {
        var _self = this;
        var root = this.getHtmlElement();
        var listedUsers = root.find('li');
        var diff = 5 - listedUsers.length
        if(diff <= 0) {
            return;
        }

        for (var i=0; i<diff; i++) {
            if (i > AddContactListMemeberList.getCount() - 1) {
                return;
            }
            var AddContactListMember = AddContactListMemeberList.get(i);
            _self._userListView.showPerson(AddContactListMember.getPerson());
        }
    }
     _proto.onNotifyRemoveChatMember = function(RemoveContactListMemberList) {
         var _self = this;
         var root = this.getHtmlElement();
         var contactList = ContactList.getInstance();
         var onSidebarJidList = [];
         var removeList = [];
         for (var i=0; i<RemoveContactListMemberList.getCount(); i++) {
             removeList.push(RemoveContactListMemberList.get(i).jid);
         }
         root.find('li').each(function(i, elem) {
             if (removeList.includes($(elem).attr('jid'))) {
                 $(elem).remove();
             } else {
                 onSidebarJidList.push($(elem).attr('jid'));
             }
         });
         for (var i=0; i<contactList.getCount(); i++) {
             var onSidebarChatListElement = root.find('li');
             if (onSidebarChatListElement.length == 5 || contactList.getCount() <= onSidebarChatListElement.length) {
                 break;
             }
             if (!onSidebarJidList.includes(contactList.get(i).getJid())) {
                 _self._userListView.showPerson(contactList.get(i));
             }
         }
     }

})();
