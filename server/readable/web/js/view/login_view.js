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
function LoginView() {
    this._isLoginCompleted = false;
    this._needRelogin = false;
    this._qsParamArray = null;
    this._loginedViewInitFinish = false;
    this._mailCooperationSettingServerList = null;
};(function() {
    LoginView.MIN_LENGTH_USER_NAME = 2;
    LoginView.MAX_LENGTH_USER_NAME = 32;
    LoginView.MIN_LENGTH_PASSWORD = 8;
    LoginView.MAX_LENGTH_PASSWORD = 32;
    LoginView.HIDE_SPEED = 500;
    LoginView.URI_PARAM_ACCESS_TOKEN = 'access_token';
    LoginView.URI_PARAM_LOGIN_TICKET = 'login_ticket';
    LoginView.URI_PARAM_COLUMN_TYPE = 'column_type';
    LoginView.URI_PARAM_TO_JID = 'to_jid';
    LoginView.URI_PARAM_ROOM_ID = 'room_id';
    LoginView.LOGIN_COMPLETE_DELAY = 50;
    LoginView.START_ADD_FIRST_COLUMN_DELAY = LoginView.LOGIN_COMPLETE_DELAY + LoginView.HIDE_SPEED;

    var _loginView = new LoginView();
    LoginView.getInstance = function() {
        return _loginView;
    };

    var _proto = LoginView.prototype;
    _proto.setQueryStringParamArray = function(paramArray) {
        if (typeof paramArray != 'object') {
            return;
        }
        this._qsParamArray = paramArray;
    };
    _proto.getQueryStringParamArray = function() {
        return this._qsParamArray;
    };
    _proto._execLogin = function() {

        $('#loginErrMsg').text('');
        if(!LoginView.getInstance()._checkTenantname() || !LoginView.getInstance()._checkUsername() || !LoginView.getInstance()._checkPassword()) {
          $('#btnLogin').prop("disabled", false);
          return false;
        }
        ViewUtils.showLoginLoadingIcon($('#loginErrMsg'));
        var view = View.getInstance();
        CubeeController.getInstance().login($('#txtLogintenant').val(), $('#txtLoginid').val(), $('#txtLoginpassword').val(), view.onLogin, view.onDisconnected, view.onError, view.onProfileChanged, view.onMessage, view.onNotification,view.onLoginWizard);

    };

    _proto._execTicketLogin = function(loginTicket) {
        $('#loginErrMsg').text('');
        var _account = LoginTicket.loginTicket2Account(loginTicket);
        if (!_account) {
          return false;
        }
        ViewUtils.showLoginLoadingIcon($('#loginErrMsg'));

        var view = View.getInstance();
        CubeeController.getInstance().login(_account.tenant, _account.id, _account.pw, view.onLogin, view.onDisconnected, view.onError, view.onProfileChanged, view.onMessage, view.onNotification,view.onLoginWizard);

    };

    _proto._execSkipLogin = function(accessToken) {
        $('#loginErrMsg').text('');
        ViewUtils.showLoginLoadingIcon($('#loginErrMsg'));
        var view = View.getInstance();
        CubeeController.getInstance().skipLogin(accessToken, view.onLogin, view.onDisconnected, view.onSkipLoginError, view.onProfileChanged, view.onMessage, view.onNotification);
        return true;
    };

    _proto._execSkipLoginFromUri = function() {
        var _paramArray = ViewUtils.getRequestString();
        LoginView.getInstance().setQueryStringParamArray(_paramArray);
        var _accessToken = _paramArray[LoginView.URI_PARAM_ACCESS_TOKEN];
        if (_accessToken != null) {
            LoginView.getInstance()._execSkipLogin(_accessToken);
        } else {
        }
        return true;
    };

    _proto.onLoginError = function(err) {
        var _self = this;
        var errMsg = err.message;
        ViewUtils.hideLoginLoadingIcon($('#loginErrMsg'));
        if(errMsg == "Not Authorized") {
            if (LoginTicket.readAccount()) {
                LoginTicket.remove();
                window.location.reload();
            }
            else {
                $('#loginErrMsg').text(Resource.getMessage('loginErrMsg'));
                $('#btnLogin').prop("disabled", false);
            }
            return;
        }else if(errMsg == 'unauthorized_assignment' || errMsg == 'failed_to_fetch_authority_data'){
            if (LoginTicket.readAccount()) {
                LoginTicket.remove();
                window.location.reload();
            }
            $('#loginErrMsg').text(Resource.getMessage(errMsg));
            $('#btnLogin').prop("disabled", false);
            return false;
        }else {
            if(!_self._isLoginCompleted) {
                _self.relogin(errMsg);
                return false;
            }
        }
        return true;
    };

    _proto.relogin = function(errMsg) {
        var _self = this;
        if(_self._needRelogin == false) {
            _self._needRelogin = true;
            console.log('login communicateion error : ' + errMsg);
             setTimeout(function() {
                _self._needRelogin = false;
                _self._execLogin();
            }, 5000);
            CubeeController.getInstance().logout();
        }
    };
    _proto.onSkipLoginError = function(err) {
        var _self = this;
        var errMsg = err.message;
        ViewUtils.hideLoginLoadingIcon($('#loginErrMsg'));
        if(errMsg == "Not Authorized") {
            $('#loginErrMsg').text(Resource.getMessage('skipLoginAccessTokenErrMsg'));
            return false;
        } else if (errMsg == "Failed Switch Protocol") {
            $('#loginErrMsg').text(Resource.getMessage('skipLoginSwitchProtocolErrMsg'));
            return false;
        } else {
            $('#loginErrMsg').text(Resource.getMessage('skipLoginErrMsg'));
            return false;
        }
        return true;
    };
    _proto._checkTenantname = function() {
        var _objLoginTenant = $('#txtLogintenant');
        var _userInputErrMsg = '#loginErrMsg';
        if(ViewUtils.checkRegexp(_objLoginTenant, /^\s*$/)) {
            $(_userInputErrMsg).text(Resource.getMessage('loginErrTenantContain'));
            return false;
        } else {
            $(_userInputErrMsg).text('');
            return true;
        }
    };
    _proto._checkUsername = function() {
        var _objLoginId = $('#txtLoginid');
        var _userInputErrMsg = '#loginErrMsg';
        if(ViewUtils.checkRegexp(_objLoginId, /^\s*$/)) {
            $(_userInputErrMsg).text(Resource.getMessage('loginErrUserContain'));
            return false;
        } else {
            $(_userInputErrMsg).text('');
            return true;
        }
    };
    _proto._checkPassword = function() {
        var _objLoginPassword = $('#txtLoginpassword');
        var _passwordInputErrMsg = '#loginErrMsg';
        if(ViewUtils.checkRegexp(_objLoginPassword, /^$/)) {
            $(_passwordInputErrMsg).text(Resource.getMessage('loginErrPasswordContain'));
            return false;
        } else {
            $(_passwordInputErrMsg).text('');
            return true;
        }
    };
    _proto._addRequestColumn = function() {
        var _self = this;
        var _paramArray = _self.getQueryStringParamArray();
        var _columnInfo = new ColumnInformation();
        var _columnType = _paramArray[LoginView.URI_PARAM_COLUMN_TYPE];
        var _toJid = _paramArray[LoginView.URI_PARAM_TO_JID];
        var _roomId = _paramArray[LoginView.URI_PARAM_ROOM_ID];
        _columnType *= 1;
        var cmi = ColumnManager.getInstance();
        switch(_columnType){
            case ColumnInformation.TYPE_COLUMN_MENTION:
                return cmi.addColumnInfo(_columnType);
            case ColumnInformation.TYPE_COLUMN_INBOX:
                return cmi.addInboxColumn();
            case ColumnInformation.TYPE_COLUMN_TASK:
                return cmi.addTaskColumn('');
            case ColumnInformation.TYPE_COLUMN_CHAT:
                return cmi.addChatColumn(_toJid);
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                return cmi.addGroupChatColumn(_roomId);
            case ColumnInformation.TYPE_COLUMN_MAIL:
                return cmi.addMailColumn();
            case ColumnInformation.TYPE_COLUMN_RECENT:
                return cmi.addRecentColumn();
            default: return false;
        }
        return true;
    };



    _proto.showWizardStandby = function(_connectReceiveData) {

        var _loginTicket = LoginTicket.read();
        if (!_loginTicket) {
          LoginTicket.writeAccount($('#txtLogintenant').val(), $('#txtLoginid').val(), $('#txtLoginpassword').val());
        }

        WizardView.getInstance().showWizard(_connectReceiveData);

        $('#login').animate({ opacity:0}, 600, function(){
            $(this).remove();
                setTimeout(function(){
                ViewUtils.modal_on('wizard_modal', true);
            }, 400);
        });
    };


    _proto.showMainScreen = function() {
        var _self = this;

        SelectAndAddProjectView.getInstance().getProjectList();

        var _paramArray = _self.getQueryStringParamArray();
        var _requestColumnType = _paramArray[LoginView.URI_PARAM_COLUMN_TYPE];
        var _jid = LoginUser.getInstance().getJid();
        var _contactList = ContactList.getInstance();
        var _useLocalStrage = true;

        var _notificationSettingManager = NotificationSettingManager.getInstance();
        _notificationSettingManager.read();
        var _pushNotificationSettingManager = PushNotificationSettingManager.getInstance();
        _pushNotificationSettingManager.read();

        TabManager.getInstance().onLogin(_onLoginCallBackFunc);

        function _onLoginCallBackFunc(activeTabInfo, defaultColumnInfoList){
            var _columnListId = activeTabInfo.columnListId;
            TabColumnStateStore.getInstance().getColumnList(_columnListId, onGetColumnList);

            function onGetColumnList(columnInfoList){
                var _columnInfoList = columnInfoList;

                var _addColumnDelay = 200;
                if(_columnInfoList == null || _columnInfoList.getCount() < 1 || _useLocalStrage == false){
                    function addDefaultColumn() {
                        var _defaultColumnInfoList = defaultColumnInfoList;
                        ColumnManager.getInstance().refresh(_columnListId, defaultColumnInfoList, _onRefreshCallBack);
                        function _onRefreshCallBack(refleshResult){
                            if(LoginUser.getInstance().isFirstLogin()){
                                ColumnManager.getInstance().addRecentColumn(true);
                            }
                            if(!refleshResult) {
                                _self._onLoginedViewInitFinished();
                                TabManager.getInstance().endRefreshingFromLoginView();
                                return;
                            }
                            if (_requestColumnType != null) {
                                setTimeout(function(){
                                    _self._addRequestColumn();
                                    _self._onLoginedViewInitFinished();
                                }, _addColumnDelay);
                            } else {
                                _self._onLoginedViewInitFinished();
                            }
                        };
                    };
                    setTimeout(addDefaultColumn, LoginView.START_ADD_FIRST_COLUMN_DELAY);
                } else {
                    var _count = _columnInfoList.getCount();
                    var _index = 0;
                    var isRecentColumn = false;
                    for (var i=0; i<_count; i++) {
                        if (_columnInfoList.get(i).getColumnType() == ColumnInformation.TYPE_COLUMN_RECENT) {
                            isRecentColumn = true;
                            break;
                        }
                    }
                    if (!isRecentColumn) {
                        var _columnRecentInfo = new RecentColumnInfomation();
                        var _filter = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_RECENT, null);
                        if(_filter == null) { return false; }
                        var _searchCondition = new ColumnSearchCondition(_filter, new ColumnSortCondition());
                        _columnRecentInfo.setSearchCondition(_searchCondition);
                        _columnInfoList.add(_columnRecentInfo);
                    }
                    function addPreviousLogoutColumnFunc() {
                        ColumnManager.getInstance().refresh(_columnListId, _columnInfoList, _onRefreshCallBack);
                        function _onRefreshCallBack(refleshResult){
                            if(!refleshResult) {
                                _self._onLoginedViewInitFinished();
                                return;
                            }
                            if (_requestColumnType != null) {
                                _self._addRequestColumn();
                            }
                            _self._onLoginedViewInitFinished();
                        };
                    };
                    setTimeout(addPreviousLogoutColumnFunc, LoginView.START_ADD_FIRST_COLUMN_DELAY);
                }
                GeneralConfigButton.getInstance().showLoginUserName();
                GeneralConfigButton.getInstance().showLoginUserGroup();
                GeneralConfigButton.getInstance().showLoginUserAvatar();
                SidebarNoteView.getInstance().showNoteList();
                GeneralConfigButton.getInstance().setConfigMenu(_self._mailCooperationSettingServerList);
                GeneralConfigButton.getInstance().updateGoodJobCount();
                GeneralConfigButton.getInstance().updateGoodJobAllCount();
                GeneralConfigButton.getInstance().updateThanksPointsCount();
                GeneralConfigButton.getInstance().updateThanksPointsAllCount();
                GeneralConfigButton.getInstance().updateFolloweeFollower();
                if (!LoginUser.getInstance().isUpdatablePersonData()) {
                    $('ul.user_menu li[value="password"]').remove();
                }
                if(_self._mailCooperationSettingServerList == null) {
                    CubeeController.getInstance().getServerList(_onGetServerListCallBack);
                }
                function _onGetServerListCallBack(serverList) {
                    _self._mailCooperationSettingServerList = serverList;
                    if(_self._mailCooperationSettingServerList != null && _self._mailCooperationSettingServerList.getCount() > 0) {
                        GeneralConfigButton.getInstance().setConfigMenu(_self._mailCooperationSettingServerList);
                    }
                }
                ViewUtils.setAutoCompleteEventToTextArea();
                ViewUtils.setAutoCompleteEventForCommunityMember();
                ViewUtils.setAutoCompleteEventToTextAreaForGroup();

                var _presence;
                var _myMemo;

                if (LoginPresence.getInstance().isLogin()) {
                    _presence = $('#presence_type').val();
                    _myMemo   = $('#myMemo > input').val();
                }
                else {
                    _presence = LoginPresence.getInstance().getLoginPresenceToStr();
                    _myMemo   = LoginMyMemo.getInstance().getLoginMyMemo();
                    if (CubeeController.getInstance().changePresence(_presence, _myMemo + ' ') == true) {
                        ColumnMessageView.updateMessageAvatarToolTip(_jid);
                    }
                }

                if (CubeeController.getInstance().changePresence(_presence, _myMemo) == true) {
                    ColumnMessageView.updateMessageAvatarToolTip(_jid);
                }
                setTimeout(function() {
                    _self.onLoginCompleted();
                    setTimeout(function() {
                        View.resizeButton();
                    }, LoginView.HIDE_SPEED);
                }, LoginView.LOGIN_COMPLETE_DELAY);
            };
        };

    };

    _proto._onLoginedViewInitFinished = function() {
        var _self = this;
        setTimeout(function() {
            _self._loginedViewInitFinish = true;
            View.getInstance().onLoginedViewInitFinished();
            DemandTaskCautionIconView.getDemandTaskCount();
        }, 1);
        ViewUtils.setDoubleClickEventToAvatar();
    };

    _proto.getLoginedViewInitFinish = function() {
        var _self = this;
        return _self._loginedViewInitFinish;
    };

    _proto.onLoginCompleted = function() {
        var _self = this;
        ViewUtils.hideLoginLoadingIcon($('#loginErrMsg'));

        var _hideEffect = 'slide';
        var _hideOptions = {
            direction : "up"
        };
        var _hideSpeed = LoginView.HIDE_SPEED;

        $('#login').hide(_hideEffect, _hideOptions, _hideSpeed, function() {
            $('#mainOuterContainer').removeClass('visibility-hidden');
            View.getInstance().resizeContent();
        });

        _self._isLoginCompleted = true;

        LayoutManager.resetScreenLayout();

        var _loginTicket = LoginTicket.read();
        if (!_loginTicket) {
          LoginTicket.writeAccount($('#txtLogintenant').val(), $('#txtLoginid').val(), $('#txtLoginpassword').val());
        }
    };

    _proto.getLoginCompleted = function() {
        var _self = this;
        return _self._isLoginCompleted;
    };
    _proto.controlFocus = function() {

        if ($('#txtLogintenant').val().length == 0) {
            $(document).ready( function() {
                $("#txtLogintenant").focus();
                });
        } else if($('#txtLoginid').val().length == 0) {
            $(document).ready( function() {
                $("#txtLoginid").focus();
                });
        } else {
            $(document).ready( function() {
                $("#txtLoginpassword").focus();
            });
        }
    };
    $(function() {

      LoginView.getInstance()._execSkipLoginFromUri();

      $('body').css('display', '');

      var _loginTicket = LoginTicket.read();

      if (!_loginTicket) {
        $('#btnLogin').on('click', function(){
            $('#btnLogin').prop("disabled", true);
           LoginView.getInstance()._execLogin();
          return false;
        });
        if (ViewUtils.isIE89()) {
            $('#txtLoginid').on('keydown', function(e) {
                clickEnterLogin(e);
            });
            $('#txtLoginpassword').on('keydown', function(e) {
                clickEnterLogin(e);
            });
        }

        $('#forgotPassword > a').on('click', function() {
        });
        var clickEnterLogin = function(e) {
            var ENTER_KEY = 13;
            var code = (e.keyCode ? e.keyCode : e.which);
            if(code && code == ENTER_KEY) {
                if(!LoginView.getInstance()._execLogin()){
                    return false;
                }
            }
        };

        LoginView.getInstance()._setResourceStaticElements();

        LoginView.getInstance().controlFocus();
      }
      else {
        LoginView.getInstance()._execTicketLogin(_loginTicket);
        LoginView.getInstance()._setResourceStaticElements();
      }
    });

    _proto._setResourceStaticElements = function(){

        $('.login_inner h2').text(Resource.getMessage('login_header'));
        $('#txtLogintenant').attr('placeholder', Resource.getMessage('login_tenantname_placeholder'));
        $('#txtLoginid').attr('placeholder', Resource.getMessage('login_username_placeholder'));
        $('#txtLoginpassword').attr('placeholder', Resource.getMessage('login_password_placeholder'));
        $('#btnLoginText').text(Resource.getMessage('login_btn'));


        var _presenseList = ['chat','away','xa','dnd'];
        for(var i=0; i<_presenseList.length; i++){
            var _presenseType = _presenseList[i];
            var _resource = Resource.getMessage('presence_' + _presenseType);
            $('#presence_type > option[value="' + _presenseType + '"]').text(_resource);
        }

        $('#myMemo input:first').attr({'placeholder': Resource.getMessage('my_memo_placeholder')});

        var _setResourceSelectorList = {
            '.action-reply' : 'action_reply',
            '.action-show-conversation' : 'action_show_conversation',
            '.action-add-inbox-task' : 'action_add_inbox_task',
            '.action-doing-task' : 'action_doing_task',
            '.action-doing-inner-task' : 'action_doing_task',
            '.action-finish-task' : 'action_finish_task',
            '.action-finish-inner-task' : 'action_finish_task',
            '.action-edit-task' : 'action_edit_task',
            '.action-accept-new-task' : 'action_accept_new_task',
            '.action-accept-new-inner-task' : 'action_accept_new_task',
            '.action-Reject-task' : 'action_reject_task',
            '.action-reject-inner-task' : 'action_reject_task',
            '.action-demand-task': 'action_demand_task',
            '.action-clear-demanded-task' : 'action_clear_demanded_task',
            '.action-add-new-task' : 'action_add_new_task_from_message',
            '#tooltipInboxMessageAction > .action-add-new-task' : 'action_add_new_task_from_inbox',
            '#tooltipInboxMessageAction > .action-delete-message' : 'action_delete_from_inbox',
            '#tooltipReplyMessageActionCanDelete > .action-delete-message' : 'action_delete_message',
            '#tooltipReplyMessageActionCanDeleteBar > .action-delete-message' : 'action_delete_message',
            '#tooltipTaskMessageAction > .action-delete-message' : 'action_delete_task',
            '#tooltipChatMessageActionCanDelete > .action-delete-message' : 'action_delete_from_inbox',
            '#tooltipChatMessageActionCanDeleteBar > .action-delete-message' : 'action_delete_from_inbox',
            '#tooltipParentTaskMessageAction > .action-delete-message' : 'action_delete_task',
            '#tooltipParentTaskMessageCancelAction > .action-delete-message' : 'action_delete_task',
            '#addColumnIcon' : 'header_add_column',
            '#switchToList' : 'header_switch_to_list',
            '#switchToColumn' : 'header_switch_to_columns',
            '#searchIcon_for_mobile' : 'header_context_search',
            '#addColumnIcon_for_mobile' : 'header_add_column'
        };
        for (var resourceKey in _setResourceSelectorList) {
            var _resource = Resource.getMessage(_setResourceSelectorList[resourceKey]);
            $(resourceKey).attr({alt: _resource, title: _resource});
        }

        $('#txtSearchContext').attr({
            placeholder: Resource.getMessage('header_context_search_placeholder')
        });
        $('.header_right .input_group a').attr({
            'data-original-title': Resource.getMessage('search_option_title')
        });
        $('.header_right .input_group #search_btn').attr({
            'data-original-title': Resource.getMessage('Search')
        });
        $('.header_btn .popup_menu a').attr({
            'data-original-title': Resource.getMessage('main_header_system_info')
        });
        $('.header_btn #prj_ico').attr({
            'data-original-title': Resource.getMessage('main_header_project_details')
        });
        $('.header_btn #side-bar-recent-ico').attr({
            'data-original-title': Resource.getMessage('main_header_recent_list')
        });
    };

    _proto.getMailCooperationSettingServerList = function() {
        var _self = this;
        return _self._mailCooperationSettingServerList;
    };
})();
