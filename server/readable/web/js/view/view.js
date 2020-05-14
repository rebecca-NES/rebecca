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
function View() {
    this._arrayLoginedNotification = new ArrayList();
    this._arrayLoginedNotifyMessage = new ArrayList();
};
(function() {

    var _view = new View();

    View.getInstance = function() {
        return _view;
    };
    var _proto = View.prototype;

    var isActive;
    var _timerBlink;
    var _titleBarStringBackup;
    var _blinkTitleStr = Resource.getMessage('blink_title');

    _proto.getTitle = function() {
        return _titleBarStringBackup;
    };
    _proto.getBlinkTitle = function() {
        return _blinkTitleStr;
    };
     _proto.onLogin = function() {
        console.log('Connected!');
        LoginView.getInstance().showMainScreen();
    };

    _proto.onLoginWizard = function(_connectReceiveData) {
        var interval = null;
        function waitLoginUserData(){
            if (LoginUser.getInstance().getTenantInfo()){
                console.log('Wizard OPEN');
                clearInterval(interval);
                LoginView.getInstance().showWizardStandby(_connectReceiveData);
            } else {
                console.log('wait Wizard OPEN');
            }
        }
        interval = setInterval(waitLoginUserData, 100);
    };


    _proto.onError = function(err) {
        if (err != undefined && err != null && err.message != undefined) {
            console.log('onError : ' + err.message);
        } else {
            console.log('onError');
        }
        return LoginView.getInstance().onLoginError(err);
    };
    _proto.onSkipLoginError = function(err) {
        if (err != undefined && err != null && err.message != undefined) {
            console.log('onSkipLoginError : ' + err.message);
        } else {
            console.log('onSkipLoginError');
        }
        return LoginView.getInstance().onSkipLoginError(err);
    };
    _proto.onDisconnected = function() {
        console.log('Disconnected!');
        View.getInstance()._notifyDisconnected();

        var _loginView = LoginView.getInstance();
        if (!_loginView.getLoginCompleted()) {
            _loginView.relogin('Disconnected');
        } else {
            var _title   = Resource.getMessage('dialog_title_system_info');
            var _message = Resource.getMessage('system_message_server_disconnected');
            var _dialog = new DialogCloseView(_title, _message);
            _dialog.showDialog();
        }
    };
    _proto.logout = function() {
        var _self = this;
        CubeeController.getInstance().logout();
        _self._notifyDisconnected();
    };

    _proto._notifyDisconnected = function() {
        ColumnManager.getInstance().disconnected();
        MyPresenceView.getInstance().notifyDisconnect();
    };
    _proto.onProfileChanged = function(profile) {
        console.log('Presence was received!');
        var _jid = profile.getJid();
        var _type = profile.getType();
        switch (_type) {
        case ProfileChangeNotice.TYPE_PRESENCE:
            var _presence = profile.getPresence();
            var _myMemo = profile.getMyMemo();
            ColumnMessageView.updateMessageAvatarToolTip(_jid);
            var _loginUserJid = LoginUser.getInstance().getJid();
            if (_jid == _loginUserJid) {
                MyPresenceView.getInstance().updateChangePresence(_presence,
                        _myMemo);
            }
            MemberAreaView.updateMessageAvatarToolTip(_jid);
            MemberAreaView.updateMessageAvatarPresenceIcon(profile);
            break;
        case ProfileChangeNotice.TYPE_PROFILE:
            var _loginUserJid = LoginUser.getInstance().getJid();
            if (_jid == _loginUserJid) {
                GeneralConfigButton.getInstance().updateConfig();
            }
            MemberAreaView.updateMessageAvatarProfile(profile);
            break;
        default:
            break;
        }
        SideListView.getInstance().onProfileChanged(profile);
    };
    _proto.onMessage = function(msg) {
        var _self = View.getInstance();
        if (LoginView.getInstance().getLoginedViewInitFinish()) {
            ColumnManager.getInstance().showMessage(msg);
            if (msg.getType() != Message.TYPE_CHAT) {
                NotificationIconManager.getInstance().notifyMessage(msg);
                console.log("message Type:" + msg.getType() + ' From:'
                        + msg.getFrom());
                ViewUtils.sendPushNotification(msg);
            } else {
              SideListView.getInstance().notifyChatMessage(msg);
              ViewUtils.sendPushNotification(msg);
            }
        } else {
            _self._arrayLoginedNotifyMessage.add(msg);
        }
    };

    _proto.onNotification = function(notification) {
        var _self = View.getInstance();
        var _type = notification.getType();
        var _loginUser = LoginUser.getInstance().getJid();
        switch (_type) {
        case Notification_model.TYPE_MESSAGE_OPTION:
            var _contentType = notification.getContentType();
            switch (_contentType) {
            case MessageOptionNotification.CONTENT_TYPE_SIBLING_TASK:
                break;
            case MessageOptionNotification.CONTENT_TYPE_DEMAND_TASK:
                DemandTaskCautionIconView.getDemandTaskCount();
                break;
            case MessageOptionNotification.CONTENT_TYPE_SET_READ_MESSAGE:
                break;
            default:
                break;
            }
            ColumnManager.getInstance().onNotification(notification);
            break;
        case Notification_model.TYPE_GOOD_JOB:
            ColumnManager.getInstance().onNotification(notification);
            if (notification.getFromJid() != LoginUser.getInstance().getJid()) {
                GeneralConfigButton.getInstance().updateGoodJobCount();
                GeneralConfigButton.getInstance().updateGoodJobAllCount();
            }
            ViewUtils.sendPushNotificationForGoodJobOrThanksPoint(notification);
            break;
        case Notification_model.TYPE_EMOTION_POINT:
            ColumnManager.getInstance().onNotification(notification);
            if (notification.getFromJid() != LoginUser.getInstance().getJid()) {
                GeneralConfigButton.getInstance().updateThanksPointsCount();
                GeneralConfigButton.getInstance().updateThanksPointsAllCount();
            }
            ViewUtils.sendPushNotificationForGoodJobOrThanksPoint(notification);
            break;
        case Notification_model.TYPE_QUESTIONNAIRE:
            var _questionnaireMessage = notification.getQuestionnaireMessage();
            var roomType = parseInt(_questionnaireMessage.getRoomType());
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                NotificationIconManager.getInstance().notifyMessage(
                    _questionnaireMessage);
            }
            if ((roomType == Message.TYPE_COMMUNITY ||
                roomType == Message.TYPE_GROUP_CHAT) &&
                !_questionnaireMessage.getRoomName()) {
                break;
            }
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                ColumnManager.getInstance().onNotification(notification);
                if (roomType == Message.TYPE_COMMUNITY) {
                    if (TabManager.getInstance().isActiveMyWorkplace()) {
                        SelectAndAddProjectView.getInstance().getProjectList();
                    } else {
                        SelectAndAddProjectView.getInstance().getProjectList(TabManager.getInstance().getCommunityInfo());
                    }
                }
                if (notification.getActionType() == QuestionnaireNotification.ACTION_TYPE_ADD) {
                    ViewUtils.sendPushNotification(_questionnaireMessage);
                }
            } else {
                _self._arrayLoginedNotification.add(notification);
            }
            break;
        case Notification_model.TYPE_TASK:
            var _taskMessage = notification.getTaskMessage();
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                NotificationIconManager.getInstance().notifyMessage(
                    _taskMessage);
            }
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                ColumnManager.getInstance().onNotification(notification);
                DemandTaskCautionIconView.getDemandTaskCount();
            } else {
                _self._arrayLoginedNotification.add(notification);
            }
            break;
        case Notification_model.TYPE_CHAT:
            var _chatMessage = notification.getChatMessage();
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                View.getInstance().validBlinkTitleBar(800,
                        _titleBarStringBackup, _blinkTitleStr);
                NotificationIconManager.getInstance().notifyMessage(
                    _chatMessage);
            } else {
                _self._arrayLoginedNotification.add(notification);
            }
            break;
        case Notification_model.TYPE_SYSTEM:
            ColumnManager.getInstance().onNotification(notification);
            break;
        case Notification_model.TYPE_DELETE_MESSAGE:
            ColumnManager.getInstance().onNotification(notification);
            DemandTaskCautionIconView.getDemandTaskCount();
            break;
        case Notification_model.TYPE_GROUP_CHAT:
            var _chatroomInfo = notification.getRoomInfo();
            var _roomId = _chatroomInfo.getRoomId();
            var _isNotification = View._canShowGroupChatNotification(_roomId);
            var _subType = notification.getSubType();
            var _roomName = _chatroomInfo.getRoomName();
            var _profileMap = _chatroomInfo.getProfileMap();
            if (_subType == GroupChatNotification.SUB_TYPE_UPDATE_ROOM_INFO) {
                NotificationIconManager.getInstance().updateRoomInfo(
                        notification);
                var _updatedItems = notification.getUpdatedItems();
                for ( var _i = 0; _i < _updatedItems.length; _i++) {
                    if (_updatedItems[_i] == 'ChangeRoomName') {
                        if (_loginUser != _chatroomInfo.getUpdatedBy()) {
                            if (LoginView.getInstance()
                                    .getLoginedViewInitFinish()) {
                                if(_isNotification) {
                                    View.getInstance().validBlinkTitleBar(800,
                                            _titleBarStringBackup, _blinkTitleStr);
                                    NotificationIconManager.getInstance().notifyGroupChat(notification);
                                }
                            } else {
                                _self._arrayLoginedNotification
                                        .add(notification);
                            }
                        }
                        var _columnInfo = ViewUtils
                                .getGroupChatColumnInfo(_chatroomInfo);
                        ColumnManager.getInstance().onChangeRoomName(
                                _columnInfo, _chatroomInfo);
                    } else if (_updatedItems[_i] == GroupChatInfoUpdateNotification.SUB_TYPE_CHANGE_ROOM_PRIVACY_TYPE) {
                        var _columnInfo = ViewUtils.getGroupChatColumnInfo(_chatroomInfo);
                        ColumnManager.getInstance().onChangeGroupChatPrivacyType(_columnInfo, _chatroomInfo);
                    } else {
                    }
                }
            } else if (_subType == GroupChatNotification.SUB_TYPE_CREATE_ROOM) {
                if (_chatroomInfo.getCreatedBy() == _loginUser) {
                    var _retryCnt = 19;
                    function _wait_for_created() {
                      var result = CubeeController.getInstance().getChatroomManager().hasCreatingRoomIdList(_chatroomInfo.getRoomId());
                        if ( result != null || _retryCnt == 0) {
                            if ( result != null && result[_chatroomInfo.getRoomId()] ){
                                var _columnInfo = ViewUtils
                                        .getGroupChatColumnInfo(_chatroomInfo);
                                ColumnManager.getInstance().addColumn(_columnInfo, true, true);
                            }
                            if (result != null){
                                CubeeController.getInstance().getChatroomManager().addCreatingRoomIdList(_chatroomInfo.getRoomId()+'notification2', {[_chatroomInfo.getRoomId()]: true})
                            }
                        } else {
                            --_retryCnt;
                            setTimeout(_wait_for_created, 200);
                        }
                    }
                    setTimeout(_wait_for_created, 400);
                } else {
                    if (LoginView.getInstance().getLoginedViewInitFinish()) {
                        if(_isNotification) {
                            View.getInstance().validBlinkTitleBar(800,
                                    _titleBarStringBackup, _blinkTitleStr);
                            NotificationIconManager.getInstance().notifyGroupChat(
                                    notification);
                        }
                    } else {
                        _self._arrayLoginedNotification.add(notification);
                    }
                }
            } else if (_subType == GroupChatNotification.SUB_TYPE_ADD_MEMBER) {
                var _addedBy = notification.getAddedBy();
                // The initial value of _addedMemberList is unused, since it is always overwritten.
                var _addedMemberList; // = notification.getAddedMemberList();
                if (_loginUser != _addedBy) {
                    if (LoginView.getInstance().getLoginedViewInitFinish()) {
                        if(_isNotification) {
                            View.getInstance().validBlinkTitleBar(800,
                                    _titleBarStringBackup, _blinkTitleStr);
                            NotificationIconManager.getInstance().notifyGroupChat(
                                    notification);
                        }
                    } else {
                        _self._arrayLoginedNotification.add(notification);
                    }
                }
                var _columnInfo = ViewUtils
                        .getGroupChatColumnInfo(_chatroomInfo);
                var _addedMemberList = notification.getAddedMemberList();
                ColumnManager.getInstance().onAddMember(_columnInfo,
                        _addedMemberList);
                ViewUtils.clearAutoCompleteEventToTextArea(ViewUtils.TYPE_GROUP_CHAT, _roomId);
            } else if(_subType == GroupChatNotification.SUB_TYPE_REMOVE_MEMBER){
                var _removedBy = notification.getRemovedBy();
                var _removedMemberList = notification.getRemovedMemberList();
                var _removedMember = _removedMemberList.get(0);

                var _loginUserJid = LoginUser.getInstance().getJid();
                var _isContainLoginUser = false;
                var _count = _removedMemberList.getCount();
                // Variable _j is used like a local variable, but is missing a declaration.
                var _j;
                for(_j = 0; _j < _count; _j++) {
                    if(_loginUserJid == _removedMemberList.get(_j)) {
                        _isContainLoginUser = true;
                        break;
                    }
                }

                if(_isContainLoginUser){
                    ColumnManager.getInstance().onLoginUserRemoveGroupChatMemberNotification(notification);
                }

                if (_loginUser != _removedBy) {
                    if (LoginView.getInstance().getLoginedViewInitFinish()) {
                        if(_isNotification) {
                            View.getInstance().validBlinkTitleBar(800,_titleBarStringBackup, _blinkTitleStr);
                            NotificationIconManager.getInstance().notifyGroupChat(notification);
                        }
                    } else {
                        _self._arrayLoginedNotification.add(notification);
                    }
                }

                var _columnInfo = ViewUtils.getGroupChatColumnInfo(_chatroomInfo);
                ColumnManager.getInstance().onRemoveMember(_columnInfo,_removedMemberList);
                ViewUtils.clearAutoCompleteEventToTextArea(ViewUtils.TYPE_GROUP_CHAT, _roomId);
            } else if (_subType == GroupChatNotification.SUB_TYPE_MESSAGE) {
                var _groupChatMessage = notification.getGroupChatMessage();
                var _senderJid = _groupChatMessage.getFrom();
                var _loginUserJid = LoginUser.getInstance().getJid();
                if (LoginView.getInstance().getLoginedViewInitFinish()) {
                    if(_isNotification) {
                        if (_loginUserJid != _senderJid) {
                            View.getInstance().validBlinkTitleBar(800,
                                    _titleBarStringBackup, _blinkTitleStr);
                            NotificationIconManager.getInstance().notifyGroupChat(
                                    notification);
                        }
                    }
                    ColumnManager.getInstance().onNotification(notification);
                    ViewUtils.sendPushNotification(_groupChatMessage);
                } else {
                    _self._arrayLoginedNotification.add(notification);
                }
            }
            break;
        case Notification_model.TYPE_MAIL:
            var _mailMessage = notification.getMailMessage();
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                NotificationIconManager.getInstance().notifyMessage(
                        _mailMessage);
            }
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                View.getInstance().validBlinkTitleBar(800,
                        _titleBarStringBackup, _blinkTitleStr);
                ColumnManager.getInstance().onNotification(notification);
            } else {
                _self._arrayLoginedNotification.add(notification);
            }
            break;
        case Notification_model.TYPE_COMMUNITY:
            _self._onCommunityNodtification(notification);
            break;
        case Notification_model.TYPE_MURMUR:
            _self._onMurmurNodtification(notification);
            break;
        case Notification_model.TYPE_AUTHORITY_CHANGED:
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                _self._onAuthorityChangedNotification(notification);
            } else {
                _self._arrayLoginedNotification.add(notification);
            }
            break;
        case Notification_model.TYPE_THREAD_TITLE:
            ColumnManager.getInstance().onNotification(notification);
            break;
        case Notification_model.TYPE_MESSAGE_UPDATE:
            ColumnManager.getInstance().onNotification(notification);
            break;
        case Notification_model.TYPE_ASSIGN_NOTE:
        case Notification_model.TYPE_DELETE_NOTE:
            ColumnManager.getInstance().onNotification(notification);
            SidebarNoteView.getInstance().reloadNoteListOnSidebar();
            break;
        case Notification_model.TYPE_USER_FOLLOW:
            GeneralConfigButton.getInstance().updateConfig();
            break;
        default:
            break;
        }
        TabManager.getInstance().onNotification(notification);
        SideListView.getInstance().onNotification(notification);
    };

    _proto._onCommunityNodtification = function(communityNotification) {
        var _self = this;
        var _type = communityNotification.getType();
        if(_type != Notification_model.TYPE_COMMUNITY) {
            return;
        }
        var _loginUserJid = LoginUser.getInstance().getJid();
        var _subType = communityNotification.getSubType();
        switch(_subType) {
        case CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO:
        case CommunityNotification.SUB_TYPE_ADD_MEMBER:
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                var _senderJid = '';
                var _communityId = '';
                switch(_subType) {
                case CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO:
                    var _updatedCommunityInfo = communityNotification.getUpdatedCommunityInfo();
                    _senderJid = _updatedCommunityInfo.getUpdatedBy();
                    _communityId = _updatedCommunityInfo.getRoomId();
                    break;
                case CommunityNotification.SUB_TYPE_ADD_MEMBER:
                    _senderJid = communityNotification.getAddedBy();
                    _communityId = communityNotification.getRoomId();
                    break;
                }
                if (_loginUserJid != _senderJid) {

                    _self.validBlinkTitleBar(800,
                            _self.getTitle(), _self.getBlinkTitle());
                    NotificationIconManager.getInstance().onCommunityNotificationRecieved(communityNotification);
                }
                if(_subType == CommunityNotification.SUB_TYPE_ADD_MEMBER) {
                    ViewUtils.clearAutoCompleteEventToTextArea(ViewUtils.TYPE_COMMUNITY, _communityId);
                }
            } else {
                _self._arrayLoginedNotification.add(communityNotification);
            }
            if(_subType == CommunityNotification.SUB_TYPE_UPDATE_ROOM_INFO) {
                ColumnManager.getInstance().onCommunityInfoUpdateNotication(communityNotification);
            }
            break;
        case CommunityNotification.SUB_TYPE_UPDATE_OWNER:
            break;
        case CommunityNotification.SUB_TYPE_REMOVE_MEMBER:
            var _senderJid = communityNotification.getRemovedBy();
            var _communityId = communityNotification.getRoomId();
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                if (_loginUserJid != _senderJid) {
                    var _isContainLoginUser = false;
                    var _removedMemberList = communityNotification.getRemovedMemberList();
                    var _count = _removedMemberList.getCount();
                    // Variable _i is used like a local variable, but is missing a declaration.
                    var _i;
                    for(_i = 0; _i < _count; _i++) {
                        var _removedMember = _removedMemberList.get(_i);
                        if(_loginUserJid == _removedMember) {
                            _isContainLoginUser = true;
                            break;
                        }
                    }
                    if(_isContainLoginUser) {
                        ColumnManager.getInstance().onLoginUserRemoveCommunityMemberNotification(communityNotification);
                    } else {
                        _self.validBlinkTitleBar(800,
                                _self.getTitle(), _self.getBlinkTitle());
                        NotificationIconManager.getInstance().onCommunityNotificationRecieved(communityNotification);
                    }
                }
                ViewUtils.clearAutoCompleteEventToTextArea(ViewUtils.TYPE_COMMUNITY, _communityId);
            } else {
                _self._arrayLoginedNotification.add(communityNotification);
            }
            break;
        case CommunityNotification.SUB_TYPE_MESSAGE:
            var _communityMessage = communityNotification.getCommunityMessage();
            var _senderJid = _communityMessage.getFrom();
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                if (_loginUserJid != _senderJid) {
                    View.getInstance().validBlinkTitleBar(800, _self.getTitle(), _self.getBlinkTitle());
                }
                NotificationIconManager.getInstance().onCommunityNotificationRecieved(communityNotification);
                ColumnManager.getInstance().onNotification(communityNotification);
                ViewUtils.sendPushNotification(_communityMessage);
            } else {
                _self._arrayLoginedNotification.add(communityNotification);
            }
            break;
        default:
            break;
        }
    };

    _proto._onMurmurNodtification = function(murmurNotification) {
        var _self = this;
        var _type = murmurNotification.getType();
        if(_type != Notification_model.TYPE_MURMUR) {
            return;
        }
        var _loginUserJid = LoginUser.getInstance().getJid();
        var _subType = murmurNotification.getSubType();
        switch(_subType) {
        case MurmurNotification.SUB_TYPE_MESSAGE:
            var _murmurMessage = murmurNotification.getMurmurMessage();
            var _senderJid = _murmurMessage.getFrom();
            if (LoginView.getInstance().getLoginedViewInitFinish()) {
                if (_loginUserJid != _senderJid) {
                    View.getInstance().validBlinkTitleBar(800, _self.getTitle(), _self.getBlinkTitle());
                }
                NotificationIconManager.getInstance().onMurmurNotificationRecieved(murmurNotification);
                ColumnManager.getInstance().onNotification(murmurNotification);
                ViewUtils.sendPushNotification(_murmurMessage);
            } else {
                _self._arrayLoginedNotification.add(murmurNotification);
            }
            break;
        case MurmurNotification.SUB_TYPE_SET_COLUMN_NAME:
                let cName = murmurNotification.getColumnName();
                if(cName.length == 0){
                    cName = Resource.getMessage('Murmur');
                }
                const columnJid = murmurNotification.getJid();
                $('div[msgtype="11"][msgto="'+columnJid+'"] div.message-border-header-murmur').text(cName)
                $('div.murmur-message div.side-murmur-thread-root-message[msgto="'+columnJid+'"]').text(cName)
                $('#left_sidebar div.note_list li > a[msgtype="11"][roomid="'+columnJid+'"]').each((index, element)=>{
                    const noteName = $('span.name', element).text()
                    $('span.group', element).text(cName)
                    $(element).attr("title",noteName+" "+cName)
                });
                const list = ColumnManager.getInstance().getColumnList();
                for(let i=0;i<list.getCount();i++){
                    const column =  list.get(i);
                    const infojid = MurmurColumnInformation.getOwnJidFromSearchCondition(column);
                    if(column.getColumnType() == ColumnInformation.TYPE_COLUMN_MURMUR &&
                       infojid == columnJid){
                        list.get(i)._columnName = murmurNotification.getColumnName()
                        list.get(i)._displayName = murmurNotification.getColumnName()
                        const _person = CubeeController.getInstance().getPersonData(infojid);
                        if(_person != null){
                            const _columnName = _person.getUserName();
                            if($('#columnInnerContainer > div.column-murmur-wrapper > div.column-murmur[jid="' + infojid+ '"]').length){
                                $('#columnInnerContainer > div.column-murmur-wrapper > div.column-murmur[jid="' + infojid+ '"]')
                                    .find("div.column-header-title")
                                    .attr("title", cName + "(" + _columnName + ")")
                                    .text(cName + "(" + _columnName + ")")
                            }
                            if($('#menuIcons > li[jid="'+infojid+'"] span.name').length){
                                $('#menuIcons > li[jid="'+infojid+'"] span.name').text(cName + " (" + _columnName + ")")
                            }
                            if($('#menuIcons > li[jid="'+infojid+'"] img').length){
                                $('#menuIcons > li[jid="'+infojid+'"] img').attr("title",cName + " (" + _columnName + ")")
                            }
                        }
                        else{
                            CubeeController.getInstance().getPersonDataByJidFromServer(
                                infojid,
                                (_personList)=>{
                                    for(let i=0;i<_personList.getCount();i++){
                                        const _person = _personList.get(i);
                                        if(_person == null){
                                            console.error("_person is null")
                                            continue
                                        }
                                        const _columnName = _person.getUserName();
                                        if($('#columnInnerContainer > div.column-murmur-wrapper > div.column-murmur[jid="' + infojid+ '"]').length){
                                            $('#columnInnerContainer > div.column-murmur-wrapper > div.column-murmur[jid="' + infojid+ '"]')
                                                .find("div.column-header-title")
                                                .attr("title", cName + " (" + _columnName + ")")
                                                .text(cName + " (" + _columnName + ")")
                                        }
                                        if($('#menuIcons > li[jid="'+infojid+'"] span.name').length){
                                            $('#menuIcons > li[jid="'+infojid+'"] span.name').text(cName + " (" + _columnName + ")")
                                        }
                                        if($('#menuIcons > li[jid="'+infojid+'"] img').length){
                                            $('#menuIcons > li[jid="'+infojid+'"] img').attr("title",cName + " (" + _columnName + ")")
                                        }
                                    }
                                });
                        }
                    }
                }
            break;
        default:
            break;
        }
    };

    _proto._onAuthorityChangedNotification = function(notification) {
        var _self = this;
        var _type = notification.getType();
        if(_type != Notification_model.TYPE_AUTHORITY_CHANGED) {
            return;
        }
        var _subType = notification.getSubType();
        switch(_subType) {
        case AuthorityInfoUpdateNotification.SUB_TYPE_ASSIGN_ROLE:
            var _title   = Resource.getMessage('dialog_title_system_info');
            var _message = Resource.getMessage('authority_changed_role');
            var _dialog = new DialogCloseView(_title, _message);
            _dialog.showDialog();
            break;
        case AuthorityInfoUpdateNotification.SUB_TYPE_POLICY_ASSIGN:
            var _item = notification.getUpdatedItem();
            var _policyName = _item.getTranslations()[Translations.LANG_JA];
            var _action = _item.getAction();
            var _resourceId = _item.getResourceId();
            var _roomType = _item.getRoomType();
            switch(_roomType) {
                case Utils.ROOMTYPE_GROUPCHAT:
                  var cut_resourceId = _resourceId.substring(_resourceId.indexOf("_")+1 , _resourceId.lastIndexOf("_"));
                  var loginJid = LoginUser.getInstance().getJid();
                  var cut_jid = loginJid.substring(0, loginJid.indexOf("@"));
                  if (cut_jid == cut_resourceId
                      && notification.getTriger() == 'create' ){
                        break;
                    }
                    var _notifiy = new GroupChatAuthorityChangedNotification();
                    _notifiy.setRoomId(_resourceId);
                    _notifiy.setPolicy(_item);
                    function _onGetGroupchatInfo(roomInfo) {
                        if (roomInfo == null) {
                            return;
                        }
                        _notifiy.setRoomInfo(roomInfo);
                        NotificationIconManager.getInstance().notifyGroupChat(_notifiy);
                        ColumnManager.getInstance().onGroupChatAuthorityChangedNotication(_notifiy);
                    }
                    CubeeController.getInstance().getRoomInfo(_resourceId, _onGetGroupchatInfo);
                    break;
                case Utils.ROOMTYPE_COMMUNITY:
                    if (CubeeController.getInstance().getCommunityManager().hasCreatingRoomIdList(_resourceId)) {
                        break;
                    }
                    var _notifiy = new CommunityAuthorityChangedNotification();
                    _notifiy.setRoomId(_resourceId);
                    _notifiy.setPolicy(_item);
                    function _onGetCommunityInfo(communityInfo) {
                        if (communityInfo == null) {
                            return;
                        }
                        _notifiy.setRoomName(communityInfo.getRoomName());
                        NotificationIconManager.getInstance().onCommunityNotificationRecieved(_notifiy);
                        ColumnManager.getInstance().onCommunityAuthorityChangedNotication(_notifiy);
                    }
                    CubeeController.getInstance().getCommunityInfo(_resourceId, _onGetCommunityInfo);
                    break;
                default:
                    break;
            }
            break;
        case AuthorityInfoUpdateNotification.SUB_TYPE_POLICY_UNASSIGN:
            break;
        default:
        }

    };

    _proto.onLoginedViewInitFinished = function() {
        var _self = this;

        var _messageCount = _self._arrayLoginedNotifyMessage.getCount();
        for ( var _i = 0; _i < _messageCount; _i++) {
            var _message = _self._arrayLoginedNotifyMessage.get(_i);
            _self.onMessage(_message);
        }
        _self._arrayLoginedNotifyMessage.removeAll();

        var _notificationCount = _self._arrayLoginedNotification.getCount();
        for ( var _i = 0; _i < _notificationCount; _i++) {
            var _notification = _self._arrayLoginedNotification.get(_i);
            _self.onNotification(_notification);
        }
        _self._arrayLoginedNotification.removeAll();
    };
    _proto.invalidBlinkTitleBar = function() {
        if (_timerBlink) {
            clearInterval(_timerBlink);
            _timerBlink = null;
            document.title = _titleBarStringBackup;
        }
    };
    _proto.validBlinkTitleBar = function(delay, beforeTitleStr, AfterTitleStr) {
        return; 
    };
    _proto.resizeContent = function() {
        SideListView.getInstance().resizeContents();
        View.resizeButton();
        View.resizeHeaderContent();
    };
    View.resizeButton = function() {
        RightSlideContainerView.getInstance().resizeButton();
    };
    View.resizeHeaderContent = function() {
        TabManager.getInstance().resizeContent();
    };

    window.onfocus = function() {
        isActive = true;
    };
    window.onblur = function() {
        isActive = false;
    };
    $(window).on("beforeunload", function() {
        CubeeController.getInstance().logout();
        return;
    });
    $(function() {
        $('#btnSearchOption').on('click', function() {
            return false;
        });
        var _longTapIntarval = 500;
        var _longTapTimer = 0;
        $(document).on("touchstart", function(e) {
            _longTapTimer = setTimeout(function() {
                $(e.target).trigger('longtap');
            }, _longTapIntarval);

            function clearFunction() {
                clearTimeout(_longTapTimer);
            }

            $(document).on("touchend touchmove touchcancel",clearFunction);
        });

    });

    $(function() {
        document.title = Conf.getVal('PRODUCT_NAME') + ' - ' + _cubee_version;
        _titleBarStringBackup = document.title;
    });

    View._canShowGroupChatNotification = function(roomId) {
        return true;
    };

})();
