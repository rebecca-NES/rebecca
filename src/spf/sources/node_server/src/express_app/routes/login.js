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
    var ReadCacheBeforeDBChef = require('../../scripts/lib/CacheHelper/read_cache_before_db_chef');
    var TenantData = require('../../scripts/lib/CacheHelper/tenant_data');
    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();
    var _location = _conf.getConfData('SYSTEM_LOCATION_ROOT');
    var _product_name = _conf.getConfData('PRODUCT_NAME');
    if(_product_name == null || _product_name == ''){
        _product_name = 'cubee';
    }

    var LoginManager = require('../controller/login_manager');
    var _loginManager = LoginManager.getInstance();

    exports.start = function(req, res){
        req.session = null;
        res.render('login', {
            product_name: _product_name,
            message: '',
            location: _location
        });
    };

    exports.execLogin = function(req, res){
        var _tenantName = req.body.tenantname;
        var _user = req.body.account;
        var _password = req.body.pass;

        if(_tenantName == null || typeof _tenantName != 'string' || _tenantName == '' || 256 < _tenantName.length || _tenantName.match(/^[a-z0-9\-\_]+$/) == null) {
            _log.connectionLog(4, 'tenantName is invalid');
            _loginErrorCallback();
            return false;
        }

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

            _loginManager.adminLogin(_tenantUuid, _user, _password, _loginCallback, _loginErrorCallback, req);
        }

        function _loginCallback(result, reason, accessToken) {
            req.session.accessToken = accessToken;
            if (result) {
                req.session.loginUser = _user;
                req.session.accessToken = accessToken;
                res.redirect(_location + '/admintool/tenant/' + _tenantUuid + '/user');
            } else {
                _loginErrorCallback();
            }
        };
        function _loginErrorCallback() {
            res.render('login', {
                product_name: _product_name,
                message: LoginManager.ERR_LOGIN_ACCOUNT_OR_PASSWORD_WRONG,
                location: _location
            });
        };
    };
})();
