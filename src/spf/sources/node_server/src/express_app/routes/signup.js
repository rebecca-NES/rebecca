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

(function() {
    var SynchronousBridgeNodeXmpp = require('../../scripts/controller/synchronous_bridge_node_xmpp');
    var ServerLog = require('../../scripts/controller/server_log');
    var Conf = require('../../scripts/controller/conf');
    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();
    var _location = _conf.getConfData('SYSTEM_LOCATION_ROOT');
    var _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
    var _adminPassword = _conf.getConfData('XMPP_SERVER_ADMIN_PASSWORD');

    var User = require('./tenant/user/user');
    var UserAccountManager = require('../controller/user_account_manager');
    var _userAccountManager = UserAccountManager.getInstance();
    var LoginManager = require('../controller/login_manager');
    var _loginManager = LoginManager.getInstance();

    var PAGE_TITLE_SIGN_UP = 'ユーザ新規登録';
    var LABEL_NO_SETTING = '未設定';
    var SIGNUP_AUTH_ERROR  = '認証エラー';
    var DEFAULT_TENANT_KEY = 'AGFkbWluAHBhc3N';
    var URL_PARAM_TKEY = 'tkey';
    var ACCOUNT_FORMAT_MESSAGE = 'アカウントには(A-Z, a-z),(0-9),(_.*!#$%+-)を使用してください';

    exports.show = function(req, res){
        var _query = req.query;
        var _tenantInfo = _getTenantName(_query.tkey);
        if (!_tenantInfo) {
            res.render('blank', {
                message: SIGNUP_AUTH_ERROR
            });
        }
        var _locals = _getLocals(req, _tenantInfo, '');
        res.render('signup', {
            locals: _locals
        });
    };

    exports.createUser = function(req, res){
        function _loginCallback(result, reason, accessToken) {
            if (result) {
                req.session.accessToken = accessToken;
                req.session.loginUser = _adminAccount;
                _createUser();
            } else {
                _loginErrorCallback();
            }
        };
        function _loginErrorCallback() {
            res.render('blank', {
                message: SIGNUP_AUTH_ERROR
            });
        };
        _loginManager.adminLogin(_adminAccount, _adminPassword, _loginCallback, _loginErrorCallback, req);

        function _createUser() {
            var _query = req.query;
            var _tenantInfo = _getTenantName(_query.tkey);
            if (!_tenantInfo) {
                res.render('blank', {
                    message: SIGNUP_AUTH_ERROR
                });
            }
            var _accessToken = req.session.accessToken;
            if(!_accessToken){
                res.redirect(_location + '/signup');
                return;
            }
            var _formData = req.body;
            var _ret = _userAccountManager.createUser(_accessToken, _formData, _onCreateUserCallBack);
            if(!_ret.result){
                _renderRegUser(_ret.result, _formData, _ret.reason);
            }
            function _onCreateUserCallBack(result, reason){
                _renderRegUser(result, _formData, reason);
            };
            function _renderRegUser(result, formData, reason){
                var _locals = _getLocals(req, _tenantInfo);
                _locals.txtAccount = (!formData.account)? '' : formData.account;
                _locals.txtNickname = (!formData.nickname)? '' : formData.nickname;
                _locals.txtEmail = (!formData.email)? '' : formData.email;
                _setErrMessage(_locals,reason);
                _locals.noNickname = (!formData.nickname)? '<span>' + LABEL_NO_SETTING + '</span>' : '';
                _locals.success = result;
                if(result){
                    _locals.successMessage = User.SUCCESS_CREATE_USER;
                }
                res.render('signup', {
                    locals: _locals
                });
            };
            function _setErrMessage(locals, errReason){
                if(locals == null){
                    return;
                }
                if(errReason == null){
                    return;
                }
                if(errReason == UserAccountManager.ERR_REASON_ACCOUNT_EMPTY ||
                        errReason == UserAccountManager.ERR_REASON_ACCOUNT_OVER_MAX_SIZE ||
                        errReason == UserAccountManager.ERR_REASON_ACCOUNT_WRONG_FORMAT ||
                        errReason == UserAccountManager.ERROR_REASON_EXIST_USER){
                    locals.errMessageAccount = User.errStrArray[errReason];
                }else if(errReason == UserAccountManager.ERR_REASON_EMAIL_EMPTY ||
                        errReason == UserAccountManager.ERR_REASON_EMAIL_WRONG_FORMAT ||
                        errReason == UserAccountManager.ERROR_REASON_EXIST_MAILADDRESS){
                    locals.errMessageEmail = User.errStrArray[errReason];
                }else if(errReason == UserAccountManager.ERR_REASON_PASSWORD_SIZE){
                    locals.errMessagePassword = User.errStrArray[errReason];
                }else if(errReason == UserAccountManager.ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD){
                    locals.errMessageConfirmPassword = User.errStrArray[errReason];
                }
            };
        };
    };

    function _getTenantName(tkey) {
        var tenantInfo = null;
        if (tkey == DEFAULT_TENANT_KEY) {
            tenantInfo = {
                    name: 'default',
                    id: 1
            }
        }
        return tenantInfo;
    };

    function _getLocals(req, tenantInfo) {
        var _locals = {
                location: _location,
                pageTitle: PAGE_TITLE_SIGN_UP,
                account: User.ACCOUNT_LABEL,
                nickname: User.NICKNAME_LABEL,
                email: User.EMAIL_LABEL,
                password: User.PASSWORD_LABEL,
                confirmPassword: User.CONFIRM_PASSWORD_LABEL,
                register: User.REGISTER_BUTTON_LABEL,
                txtAccount: '',
                txtNickname: '',
                txtEmail: '',
                actionPath: _location + '/signup?' + URL_PARAM_TKEY + '=' + req.query.tkey,
                tenantName: tenantInfo.name,
                errMessageAccount : '',
                errMessageNickname : '',
                errMessageEmail : '',
                errMessagePassword : '',
                errMessageConfirmPassword : '',
                warningMessage : ACCOUNT_FORMAT_MESSAGE,
                successMessage : '',
                success: null
        };
        return _locals
    };
})();
