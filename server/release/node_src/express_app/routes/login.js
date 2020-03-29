(function() {
    var SynchronousBridgeNodeXmpp = require('../../scripts/controller/synchronous_bridge_node_xmpp');
    var ServerLog = require('../../scripts/controller/server_log');
    var Conf = require('../../scripts/controller/conf');
    var ReadCacheBeforeDBChef = require('../../scripts/lib/CacheHelper/read_cache_before_db_chef');
    var TenantData = require('../../scripts/lib/CacheHelper/tenant_data');
    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();
    var _location = _conf.getConfData('SYSTEM_LOCATION_ROOT');
    var _product_name = _conf.getConfData('PRODUCT_NAME');
    if(_product_name == null || _product_name == ''){
        _product_name = 'cubee'; //設定値がない場合はDefaultとしてcubeeを設定
    }

    var LoginManager = require('../controller/login_manager');
    var _loginManager = LoginManager.getInstance();

    //定数
    /*
     * login
     */
    //ログイン画面表示
    exports.start = function(req, res){
        req.session = null;
        res.render('login', {
            product_name: _product_name,
            message: '',
            location: _location
        });
    };

    //ログイン処理
    exports.execLogin = function(req, res){
        var _tenantName = req.body.tenantname;
        var _user = req.body.account;
        var _password = req.body.pass;

        // テナント名のバリデーションチェック
        if(_tenantName == null || typeof _tenantName != 'string' || _tenantName == '' || 256 < _tenantName.length || _tenantName.match(/^[a-z0-9\-\_]+$/) == null) {
            _log.connectionLog(4, 'tenantName is invalid');
            _loginErrorCallback();
            return false;
        }

        // Redis から tenant_uuid を読み出す
        var _tenantUuid = null;
        var _tenantData = TenantData.createAsOrder(_tenantName);
        if (_tenantData == null) {
            _log.connectionLog(3, 'Internal error. Could not make order: ' + _tenantName);
            _loginErrorCallback();
            return false;
        }
        var _chef = ReadCacheBeforeDBChef.getInstance();
        _chef.cook(_tenantData, _onGetTenantDataFromCache);

        function _onGetTenantDataFromCache(err, dish) {
            if (err) {
                _log.connectionLog(4, 'Could not get tenant data. login::_onGetTenantDataFromCache - ' + err.message);
                _loginErrorCallback();
                return;
            }
            if (dish == null) {
                _log.connectionLog(3, 'Could not get tenant data. login::_onGetTenantDataFromCache');
                _loginErrorCallback();
                return;
            }
            _tenantUuid = dish.getTenantUuid();

            //adminLogin実行
            _loginManager.adminLogin(_tenantUuid, _user, _password, _loginCallback, _loginErrorCallback, req);
        }

        function _loginCallback(result, reason, accessToken) {
            req.session.accessToken = accessToken;
            if (result) {
                //ログイン成功
                req.session.loginUser = _user;
                req.session.accessToken = accessToken;
                res.redirect(_location + '/admintool/tenant/' + _tenantUuid + '/user');
            } else {
                //ログイン失敗
                _loginErrorCallback();
            }
        };
        function _loginErrorCallback() {
            //ログイン失敗表示
            res.render('login', {
                product_name: _product_name,
                message: LoginManager.ERR_LOGIN_ACCOUNT_OR_PASSWORD_WRONG,
                location: _location
            });
        };
    };
})();
