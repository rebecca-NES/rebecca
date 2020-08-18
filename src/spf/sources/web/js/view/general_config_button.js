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

function GeneralConfigButton() {
    this._generalConfigMenu = null;
};(function() {
    var _generalConfigButton = new GeneralConfigButton();

    var sidebarGjTp = new Vue({
        el: '#sidebar-gj-tp',
        data: {
            total: {
                goodjob_count: 0,
                goodjob_all_count: "-",
                thanks_count: 0,
                thanks_all_count: "-",
            }
        },
        methods: {
            setGoodJobCount: function(count) {
                this.total.goodjob_count = count;
            },
            setThanksPointsCount: function(count) {
                this.total.thanks_count = count;
            },
            setGoodJobAllCount: function(count) {
                this.total.goodjob_all_count = count;
            },
            setThanksPointsAllCount: function(count) {
                this.total.thanks_all_count = count;
            }
        }
    })

    GeneralConfigButton.getInstance = function() {
        return _generalConfigButton;
    };

    var _proto = GeneralConfigButton.prototype;

    _proto.updateGoodJobCount = function() {
        var fiscalYearDate = getDate(getFiscalYear());
        var countHtml = '<div id="sidebar-collapse-goodjob-count">\
            <div><i class="fa fa-thumbs-o-up"></i></div>\
            <div><span id="goodjob_count"><span></div>\
            <div><span id="goodjob_count_total"><span></div>\
            </div>';
        if (!$('#sidebar-collapse-goodjob-count').length) {
            if ($('#sidebar-collapse-thanks-count').length) {
                $('#sidebar-collapse-thanks-count').before(countHtml);
            } else {
                $('#loginAvatar .block-avatar').append(countHtml);
            }
            if (!$('.sidebar-collapse').length) {
                $('#sidebar-collapse-goodjob-count').hide();
            }
        }

        CubeeController.getInstance().getGoodJobTotal(LoginUser.getInstance().getJid(), fiscalYearDate)
        .then(function(result){
            var point = result.content.items[0].points;
            if (typeof point == 'number') {
                sidebarGjTp.setGoodJobCount(point);
                $('#goodjob_count').text(point);
            }
        }).catch(function(err){
            sidebarGjTp.setGoodJobCount("-");
        })
    }

    _proto.updateGoodJobAllCount = function() {
        CubeeController.getInstance().getGoodJobTotal(LoginUser.getInstance().getJid(), "")
        .then(function(result){
            var point = result.content.items[0].points;
            if (typeof point == 'number') {
                sidebarGjTp.setGoodJobAllCount(point);
                $('#goodjob_count_total').text('('+ point + ')');
            }
        }).catch(function(err){
            sidebarGjTp.setGoodJobAllCount("-");
        })
    }

    _proto.updateThanksPointsCount = function() {
        var fiscalYearDate = getDate(getFiscalYear());
        var countHtml = '<div id="sidebar-collapse-thanks-count">\
            <div><i class="fa fa-heart-o"></i></div>\
            <div><span id="thanks_count"></span></div>\
            <div><span id="thanks_count_total"></span></div>\
            </div>';
        if (!$('#sidebar-collapse-thanks-count').length) {
            $('#loginAvatar .block-avatar').append(countHtml);
            if (!$('.sidebar-collapse').length) {
                $('#sidebar-collapse-thanks-count').hide();
            }
        }

        CubeeController.getInstance().getThanksPointsTotal(LoginUser.getInstance().getJid(), fiscalYearDate)
        .then(function(result){
            var point = result.content.items[0].points;
            if (typeof point == 'number') {
                sidebarGjTp.setThanksPointsCount(point);
                $('#thanks_count').text(point);
            }
        }).catch(function(err){
            sidebarGjTp.setThanksPointsCount("-");
        })
    }

    _proto.updateThanksPointsAllCount = function() {
        CubeeController.getInstance().getThanksPointsTotal(LoginUser.getInstance().getJid(), "")
        .then(function(result){
            var point = result.content.items[0].points;
            if (typeof point == 'number') {
                sidebarGjTp.setThanksPointsAllCount(point);
                $('#thanks_count_total').text('(' + point + ')');
            }
        }).catch(function(err){
            sidebarGjTp.setThanksPointsAllCount("-");
        })
    }

    function getFiscalYear() {
        var dt = new Date();
        dt.setMonth(dt.getMonth()-3);
        dt.setMonth(3);
        dt.setDate(1)
        return dt;
    }

    function getDate(_date) {
        var resultDate = "";
        if (_date.getFullYear()) {
            var y = _date.getFullYear();
            var m = ("00" + (_date.getMonth()+1)).slice(-2);
            var d = ("00" + _date.getDate()).slice(-2);
            resultDate = y + "/" + m + "/" + d;
        }
        return resultDate;
    }

    _proto.showLoginUserName = function() {
        var _curUserName = LoginUser.getInstance().getUserName();
        $('#loginUserName').text(_curUserName);

        var groups = Utils.getSafeArrayData(LoginUser.getInstance().getGroup());
        $('#loginUserName').attr('title', `${_curUserName} ${groups}`);
    };
    _proto.showLoginUserAvatar = function() {
        var _loginUserAvatarArea = $('#loginAvatar').eq(0);

        var _org = _loginUserAvatarArea.find("span").attr('class');
        var presenceCls = _org ? _org : "ico ico_user";

        var p = CubeeController.getInstance().getPersonData(LoginUser.getInstance().getJid());
        var _insertAvatarHtml = '';
        var _t = p.getAvatarType();
        var _d = p.getAvatarData();
        if (_t != null && _t != '' && _d != null && _d != '') {
          _insertAvatarHtml = ViewUtils.getAvatarDataHtml(LoginUser.getInstance().getJid());
        } else {
          _insertAvatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(p);
        }

        _loginUserAvatarArea.html(_insertAvatarHtml);
        _loginUserAvatarArea.find("span").removeClass('ico ico_user status online offline leave busy out');
        _loginUserAvatarArea.find("span").addClass(presenceCls);

    };
    _proto.showLoginUserGroup = function() {
        var groups = Utils.getSafeArrayData(LoginUser.getInstance().getGroup());
        $('#loginUserGroup').text(groups.join(','));
    };
    _proto.updateFolloweeFollower = function() {
        var followee = (Utils.getSafeNumberData(LoginUser.getInstance().getFolloweeList().getCount()));
        $('#followee-list-count').text(followee);
        var follower = (Utils.getSafeNumberData(LoginUser.getInstance().getFollowerList().getCount()));
        $('#follower-list-count').text(follower);
    };
    _proto.setConfigMenu = function(mailCooperationSettingServerList) {
        var _self = this;
        var _configMenuHtml = GeneralConfigMenu.getHtml(mailCooperationSettingServerList);
        var _configMenuObj = new GeneralConfigMenu();
        _self._generalConfigMenu = _configMenuObj;
    };
    _proto.updateConfig = function() {
        var _self = this;
        _self.showLoginUserName();
        _self.showLoginUserAvatar();
        _self.showLoginUserGroup();
        _self.updateGoodJobCount();
        _self.updateGoodJobAllCount();
        _self.updateThanksPointsCount();
        _self.updateThanksPointsAllCount();
        _self.setConfigMenu();
        _self.updateFolloweeFollower();
        View.resizeHeaderContent();
    };

    $(function() {
        $('#btnOption').button({
            icons : {
                secondary : 'ui-icon-gear'
            }
        });
    });

})();

function GeneralConfigMenu(htmlElement) {
    if (!htmlElement || typeof htmlElement != 'object') {
        this._htmlElement = null;
    } else {
        this._htmlElement = htmlElement;
    }
    this._createEventHandler();
};(function() {
    GeneralConfigMenu.ELEMENT_ID_NAME = 'config_menu';
    GeneralConfigMenu.ELEMENT_MENU_PROFILE_VAL_NAME = 'profile';
    GeneralConfigMenu.ELEMENT_MENU_PASSWORD_VAL_NAME = 'password';
    GeneralConfigMenu.ELEMENT_MENU_MAIL_COOPERATION_VAL_NAME = 'mailcooperation';
    GeneralConfigMenu.ELEMENT_MENU_LOGOUT_VAL_NAME = 'logout';

    var _proto = GeneralConfigMenu.prototype;

    GeneralConfigMenu.getHtml = function(mailCooperationSettingServerList) {
        var _isUpdatablePersonData = LoginUser.getInstance().isUpdatablePersonData();
        var _ret = '<ul id="' + GeneralConfigMenu.ELEMENT_ID_NAME + '" class="' + GeneralConfigMenu.ELEMENT_ID_NAME + ' list_none">';
        _ret += '<li value="' + GeneralConfigMenu.ELEMENT_MENU_PROFILE_VAL_NAME + '">' + Resource.getMessage('config_profile') + '</li>';
        if (_isUpdatablePersonData) {
            _ret += '<li value="' + GeneralConfigMenu.ELEMENT_MENU_PASSWORD_VAL_NAME + '">' + Resource.getMessage('config_password') + '</li>';
        }
        if(mailCooperationSettingServerList != null && mailCooperationSettingServerList.getCount() > 0) {
            _ret += '<li value="' + GeneralConfigMenu.ELEMENT_MENU_MAIL_COOPERATION_VAL_NAME + '">' + Resource.getMessage('config_mail_cooperation') + '</li>';
        }
        _ret += '<li value="' + GeneralConfigMenu.ELEMENT_MENU_LOGOUT_VAL_NAME + '">' + Resource.getMessage('config_logout') + '</li>';
        _ret += '</ul>';
        return _ret;
    };

    _proto._createEventHandler = function() {
        var _self = this;
        var _jid = LoginUser.getInstance().getJid();
        var _followeeMenu = $('#left_sidebar').find('.followee-count, .followeelist');
        _followeeMenu.on('click', function() {
            var _followeeDialogView = new DialogFolloweeListView(_jid);
            _followeeDialogView.showDialog();
        });
        var _followerMenu = $('#left_sidebar').find('.follower-count, .followerlist');
        _followerMenu.on('click', function() {
            var _followerDialogView = new DialogFollowerListView(_jid);
            _followerDialogView.showDialog();
        });
        var _profileMenu = $('#left_sidebar').find('li[value = "' + GeneralConfigMenu.ELEMENT_MENU_PROFILE_VAL_NAME + '"]');
        _profileMenu.on('click', function() {
            var _title = $('#left_sidebar').find('li[value = "' + GeneralConfigMenu.ELEMENT_MENU_PROFILE_VAL_NAME + '"]').text();
            var _profileDialogView = new DialogProfileView(_title);
            _profileDialogView.showDialog();
        });
        var _passwordMenu = $('#left_sidebar').find('li[value = "' + GeneralConfigMenu.ELEMENT_MENU_PASSWORD_VAL_NAME + '"]');
        _passwordMenu.on('click', function() {
            var _title = $('#left_sidebar').find('li[value = "' + GeneralConfigMenu.ELEMENT_MENU_PASSWORD_VAL_NAME + '"]').text();
            var _passwordDialogView = new DialogPasswordView(_title);
            _passwordDialogView.showDialog();
        });
        var _logoutMenu = $('#left_sidebar').find('li[value = "' + GeneralConfigMenu.ELEMENT_MENU_LOGOUT_VAL_NAME + '"]');
        _logoutMenu.on('click', function() {
            $('.user_menu_btn').trigger('click');
            View.getInstance().logout();
            setTimeout("window.location.reload(true)", 500);
            LoginTicket.remove();
        });
        var _self = this;
        var _murmur = $('#left_sidebar').find('.murmur-open-send-dialog');
        _murmur.on('click', function() {
            var _DialogSendMurmurMessageView = new DialogSendMurmurMessageView();
            _DialogSendMurmurMessageView.showDialog();
        });
    };

})();

function GeneralConfigDialog() {
    DialogView.call(this);
};(function() {
    GeneralConfigDialog.prototype = $.extend({}, DialogView.prototype);
    var _super = DialogView.prototype;
    var _proto = GeneralConfigDialog.prototype;
    $(function() {
        $('#mainSettingModal').dialog({
            autoOpen : false,
            width : 320,
            height : 240,
            resizable : false
        });
    });
})();
