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
    var CubeeWebApi = require('./cubee_web_api');
    var SessionData = require('../model/session_data');
    var StoreVolatileChef = require('../lib/CacheHelper/store_volatile_chef');
    var Conf = require('./conf');
    var Utils = require('../utils');
    var ServerLog = require('./server_log');
    var _log = ServerLog.getInstance();

    var DEFAULT_KEEP_SESSION_DATA_TIME_AFTER_DISCONNECT = 1800;

    function SessionDataMannager() {
        this._mapAccessTokenToSessionData = {};
        this._mapIndependetClientNumber = {};
        this._mapLoginAccountToSessionData = {};
    };

    var _proto = SessionDataMannager.prototype;

    _proto.add = function(sessionData) {
        if(sessionData == null) {
            return false;
        }
        if(typeof sessionData != 'object') {
            return false;
        }
        if(sessionData.getAccessToken == undefined) {
            return false;
        }
        if(typeof sessionData.getAccessToken != 'function') {
            return false;
        }
        var _accessToken = sessionData.getAccessToken();
        if(_accessToken == undefined) {
            return false;
        }
        if(_accessToken == null) {
            return false;
        }
        if(typeof _accessToken != 'string') {
            return false;
        }
        if(_accessToken == '') {
            return false;
        }
        if(this._mapAccessTokenToSessionData[_accessToken] != undefined) {
            return false;
        }
        this._mapAccessTokenToSessionData[_accessToken] = sessionData;
        var _independentClientNumber = sessionData.getIndependentClientNumber();
        if(_independentClientNumber != null && _independentClientNumber != 0) {
            this._mapIndependetClientNumber['' + _independentClientNumber] = true;
        }
        var _loginAccountInTenant = sessionData.getLoginAccountInTenant();
        if(this._mapLoginAccountToSessionData[_loginAccountInTenant] == null || this._mapLoginAccountToSessionData[_loginAccountInTenant] == undefined){
            this._mapLoginAccountToSessionData[_loginAccountInTenant] = [sessionData];
        }else{
            this._mapLoginAccountToSessionData[_loginAccountInTenant].push(sessionData);
        }
        return true;
    }

    _proto.remove = function(accessToken) {
        if(accessToken == null) {
            return null;
        }
        if(typeof accessToken != 'string') {
            return null;
        }
        if(this._mapAccessTokenToSessionData[accessToken] == undefined) {
            return null;
        }
        var _ret = this._mapAccessTokenToSessionData[accessToken];
        delete this._mapAccessTokenToSessionData[accessToken];
        var _independentClientNumber = _ret.getIndependentClientNumber();
        if(_independentClientNumber != null && _independentClientNumber != 0) {
            delete this._mapIndependetClientNumber['' + _independentClientNumber];
        }
        var _loginAccountInTenant = _ret.getLoginAccountInTenant();
        var _ary = this._mapLoginAccountToSessionData[_loginAccountInTenant];
        if(_ary != null ||_ary != undefined){
            for(var _index = 0; _index < _ary.length; _index++){
                if(_ary[_index] == _ret){
                    _ary.splice(_index, 1);
                    if(_ary.length == 0){
                        delete this._mapLoginAccountToSessionData[_loginAccountInTenant];
                    }
                    break;
                }
            }
        }
        StoreVolatileChef.getInstance().discard(accessToken, null);

        return _ret;
    };

    _proto.get = function(accessToken) {
        if(accessToken == null) {
            return null;
        }
        if(typeof accessToken != 'string') {
            return null;
        }
        if(this._mapAccessTokenToSessionData[accessToken] == undefined) {
            return null;
        }
        return this._mapAccessTokenToSessionData[accessToken];
    };

    _proto.getBySocketIoSock = function(socketIoSock) {
        var _self = this;
        if(socketIoSock == null) {
            return null;
        }
        if(typeof socketIoSock != 'object') {
            return null;
        }
        var _ret = null
        for(var _accessToken in _self._mapAccessTokenToSessionData) {
            var _sessionData = _self._mapAccessTokenToSessionData[_accessToken];
            if(_sessionData == undefined || _sessionData == null) {
                continue;
            }
            if(_sessionData.getSocketIoSock() == socketIoSock) {
                _ret = _sessionData;
                break;
            }
        }
        return _ret;
    };

    _proto.getByOpenfireSock = function(openfireSock) {
        var _self = this;
        var _ret = [];
        if(openfireSock == null) {
            return _ret;
        }
        if(typeof openfireSock != 'object') {
            return _ret;
        }
        for(var _accessToken in _self._mapAccessTokenToSessionData) {
            var _sessionData = _self._mapAccessTokenToSessionData[_accessToken];
            if(_sessionData == undefined || _sessionData == null) {
                continue;
            }
            if(_sessionData.getOpenfireSock() == openfireSock) {
                _ret.push(_sessionData);
            }
        }
        return _ret;
    };

    _proto.getByLoginAccountInTenant = function(tenantUuid, loginAccount) {
        var _ret = [];
        if(tenantUuid == null || typeof tenantUuid != 'string') {
            return _ret;
        }
        if(loginAccount == null || typeof loginAccount != 'string') {
            return _ret;
        }
        var loginAccountInTenant = tenantUuid + " " + loginAccount;
        var _ary = this._mapLoginAccountToSessionData[loginAccountInTenant];
        if(_ary != null || _ary != undefined){
            _ret = _ary;
        }
        return _ret;
    }
    _proto.removeAll = function() {
        for(var _key in this._mapAccessTokenToSessionData) {
            var _independentClientNumber = this._mapAccessTokenToSessionData[_key].getIndependentClientNumber();
            if(_independentClientNumber != null && _independentClientNumber != 0) {
                delete this._mapIndependetClientNumber['' + _independentClientNumber];
            }
            delete this._mapAccessTokenToSessionData[_key];
            StoreVolatileChef.getInstance().discard(_key, null);
        }
        for(var _key in this._mapLoginAccountToSessionData) {
            delete this._mapLoginAccountToSessionData[_key];
        }
    };

    _proto.notifyDisconnect = function(accessToken, keepSessinDataTime) {
        var _self = this;
        if(accessToken == null) {
            return;
        }
        if(typeof accessToken != 'string') {
            return;
        }
        var _removeTime;
        if(keepSessinDataTime != null && typeof keepSessinDataTime == 'number' && keepSessinDataTime >= 0) {
            _removeTime = keepSessinDataTime;
        } else {
            _removeTime = parseInt(Conf.getInstance().getConfData('KEEP_SESSION_DATA_TIME_AFTER_DISCONNECT'));
            if(isNaN(_removeTime)) {
                _removeTime = DEFAULT_KEEP_SESSION_DATA_TIME_AFTER_DISCONNECT;
            }
        }
        var _sessinData = _self.get(accessToken);
        if(_sessinData == null) {
            return;
        }
        if(_sessinData.setDisconnectDatetime == null || typeof _sessinData.setDisconnectDatetime != 'function') {
            return;
        }
        var _disconnectTime = new Date();
        _sessinData.setDisconnectDatetime(_disconnectTime);
        _sessinData.setSocketIoSock(null);
        setTimeout(function() {
            var _removeSessinData = _self.get(accessToken);
            if(_removeSessinData == null) {
                return;
            }
            var _removeDisconnectTime = _removeSessinData.getDisconnectDatetime();
            if(_removeDisconnectTime == null) {
                return;
            }
            if(_removeDisconnectTime.getTime() > _disconnectTime.getTime()) {
                return;
            }
            var _xsConn = _removeSessinData.getOpenfireSock();
            if (_xsConn != null) {
                var _sessionDataAry = _self.getByOpenfireSock(_xsConn);
                if(_sessionDataAry == null){
                    _log.connectionLog(4, 'SessionDataMannager notifyDisconnect :: _sessionDataAry is null');
                    return;
                }
                if(_sessionDataAry.length > 1){
                    _log.connectionLog(7, 'SessionDataMannager notifyDisconnect :: keep openfire session, detect sessionData.');
                }else{
                    var _user = _removeSessinData.getLoginAccout();
                    var _tenantUuid = _removeSessinData.getTenantUuid();
                    var _status = CubeeWebApi.getInstance().isLoginSequenceLocked(_tenantUuid, _user);
                    if(_status != true){
                        _log.connectionLog(7, 'SessionDataMannager notifyDisconnect :: close openfire session, not detect sessionData.');
                        _xsConn.disconnect();
                    } else {
                        _log.connectionLog(7, 'SessionDataMannager notifyDisconnect :: keep openfire session, not detect sessionData.');
                    }
                }
            }
            _self.remove(accessToken);
            _log.connectionLog(7, 'SessionDataMannager notifyDisconnect :: remove sessionData.');
        }, _removeTime * 1000);
    };

    _proto.notifyReconnect = function(accessToken, clientSock) {
        var _self = this;
        if(accessToken == null || typeof accessToken != 'string') {
            return;
        }
        if(clientSock == null || typeof clientSock != 'object') {
            return;
        }
        var _sessinData = _self.get(accessToken);
        if(_sessinData == null) {
            return;
        }
        if(_sessinData.setDisconnectDatetime == null || typeof _sessinData.setDisconnectDatetime != 'function') {
            return;
        }
        _sessinData.setDisconnectDatetime(null);
        _sessinData.setSocketIoSock(clientSock);
    };

    _proto._createAccessToken = function() {
        var _ret = '';
        for(var _i = 0; _i < 16; _i++) {
            var _num6bit = Utils.getRandomNumber(0, 63);
            _ret += Utils.convert6BitNumToChara(_num6bit);
        }
        return _ret;
    }

    _proto.createUniqueAccessToken = function() {
        var _self = this;
        var _ret = '';
        for(var _i = 0; _i < 100; _i++) {
            var _accessToken = _self._createAccessToken();
            if(_accessToken == null || typeof _accessToken != 'string' || _accessToken.length != 16) {
                continue;
            }
            if(_self._mapAccessTokenToSessionData[_accessToken] != undefined) {
                continue;
            }
            _ret = _accessToken;
            break;
        }
        return _ret;
    }

    _proto.createIndependentClientNumber = function() {
        var _self = this;
        var _ret = 0;
        for(var _i = 0; _i < 100; _i++) {
            var _independentClientNumber = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
            if(_self._mapIndependetClientNumber['' + _independentClientNumber] != undefined) {
                continue;
            }
            _ret = _independentClientNumber;
            break;
        }
        return _ret;
    }

    var _sessionDataMannager = new SessionDataMannager();

    SessionDataMannager.getInstance = function() {
        return _sessionDataMannager;
    };

    exports.getInstance = SessionDataMannager.getInstance;
})();
