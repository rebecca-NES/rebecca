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

    //定数
    var PAGE_TITLE_SIGN_UP = 'ユーザ新規登録';
    var LABEL_NO_SETTING = '未設定';
    var SIGNUP_AUTH_ERROR  = '認証エラー';
    var DEFAULT_TENANT_KEY = 'AGFkbWluAHBhc3N';     //TODO: テナント対応まで固定とする
    var URL_PARAM_TKEY = 'tkey';
    var ACCOUNT_FORMAT_MESSAGE = 'アカウントには(A-Z, a-z),(0-9),(_.*!#$%+-)を使用してください';

    //サインアップ画面表示
    exports.show = function(req, res){
        //URLよりテナントキーを取得
        var _query = req.query;
        var _tenantInfo = _getTenantName(_query.tkey);    //テナント対応時はテナントキーから名称・tidを取得する
        if (!_tenantInfo) {
            //テナントが確定しないためエラー画面を表示する
            res.render('blank', {
                message: SIGNUP_AUTH_ERROR
            });
        }
        //signup画面表示
        var _locals = _getLocals(req, _tenantInfo, '');
        res.render('signup', {
            locals: _locals
        });
    };

    //ユーザ登録処理
    exports.createUser = function(req, res){
        //adminでログインを行う
        function _loginCallback(result, reason, accessToken) {
            if (result) {
                //ログイン成功
                req.session.accessToken = accessToken;
                req.session.loginUser = _adminAccount;
                //ユーザ登録処理
                _createUser();
            } else {
                //ログイン失敗
                _loginErrorCallback();
            }
        };
        function _loginErrorCallback() {
            //認証失敗画面を表示
            res.render('blank', {
                message: SIGNUP_AUTH_ERROR
            });
        };
        //adminLogin実行
        _loginManager.adminLogin(_adminAccount, _adminPassword, _loginCallback, _loginErrorCallback, req);

        //ユーザ登録処理
        function _createUser() {
            var _query = req.query;
            var _tenantInfo = _getTenantName(_query.tkey);
            if (!_tenantInfo) {
                //テナントが確定しないためエラー画面を表示する
                res.render('blank', {
                    message: SIGNUP_AUTH_ERROR
                });
            }
            //アクセストークンを取得
            var _accessToken = req.session.accessToken;
            if(!_accessToken){
                res.redirect(_location + '/signup');
                return;
            }
            //フォームデータ取得
            var _formData = req.body;
            //ユーザ登録処理開始
            var _ret = _userAccountManager.createUser(_accessToken, _formData, _onCreateUserCallBack);
            if(!_ret.result){
                _renderRegUser(_ret.result, _formData, _ret.reason);
            }
            // ユーザ登録後のコールバック
            function _onCreateUserCallBack(result, reason){
                _renderRegUser(result, _formData, reason);
            };
            // 画面に結果を返す
            function _renderRegUser(result, formData, reason){
                var _locals = _getLocals(req, _tenantInfo);
                _locals.txtAccount = (!formData.account)? '' : formData.account;
                _locals.txtNickname = (!formData.nickname)? '' : formData.nickname;
                _locals.txtEmail = (!formData.email)? '' : formData.email;
                _setErrMessage(_locals,reason);
                //nicknameが未設定の場合(登録成功時の表示に使用する)
                _locals.noNickname = (!formData.nickname)? '<span>' + LABEL_NO_SETTING + '</span>' : '';
                _locals.success = result;
                if(result){
                    _locals.successMessage = User.SUCCESS_CREATE_USER;
                }
                res.render('signup', {
                    locals: _locals
                });
            };
            //エラーメッセージのセット
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
                    //アカウントフォーム用のエラーメッセージ
                    locals.errMessageAccount = User.errStrArray[errReason];
                }else if(errReason == UserAccountManager.ERR_REASON_EMAIL_EMPTY ||
                        errReason == UserAccountManager.ERR_REASON_EMAIL_WRONG_FORMAT ||
                        errReason == UserAccountManager.ERROR_REASON_EXIST_MAILADDRESS){
                    //email用のエラーメッセージ
                    locals.errMessageEmail = User.errStrArray[errReason];
                }else if(errReason == UserAccountManager.ERR_REASON_PASSWORD_SIZE){
                    //password用のエラーメッセージ
                    locals.errMessagePassword = User.errStrArray[errReason];
                }else if(errReason == UserAccountManager.ERR_REASON_NOT_MATCH_PASSWORD_AND_CONFIRM_PASSWORD){
                    //confirm password用のエラーメッセージ
                    locals.errMessageConfirmPassword = User.errStrArray[errReason];
                }
            };
        };
    };

    //テナントキーより、テナント情報を取得
    function _getTenantName(tkey) {
        //TODO:キー情報は現在固定
        var tenantInfo = null;
        if (tkey == DEFAULT_TENANT_KEY) {
            tenantInfo = {
                    name: 'default',
                    id: 1
            }
        }
        return tenantInfo;
    };

    //画面変数設定
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
                successMessage : '',   //signup画面ではセットされることはない
                success: null
        };
        return _locals
    };
})();
