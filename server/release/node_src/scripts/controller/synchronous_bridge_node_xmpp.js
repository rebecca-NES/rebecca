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
    const crypto = require('crypto');
    var libxml = require("libxmljs");
    var Url = require('url');
    var Xmpp = require('./xmpp').Xmpp;
    var ServerLog = require('./server_log');
    var Conf = require('./conf');
    var Const = require('./const');
    var XmppServerConnector = require('./xmpp_server_connector');
    var SessionData = require('../model/session_data');
    var SessionDataMannager = require('./session_data_manager');
    var StoreVolatileChef = require('../lib/CacheHelper/store_volatile_chef');
    var RequestData = require('../model/request_data').RequestData;
    var Utils = require('../utils');
    var PersonData = require('../model/person_data');
    var CubeeWebApi = require('./cubee_web_api');
    var RegisteredContactData = require('../model/registered_contact_data');
    var ImageFileUtils = require('./image_file_utils');
    var UserAccountUtils = require('./user_account_utils');
    var UserAccountManager = require('./user_account_manager');
    var ReadCacheBeforeDBChef = require('../lib/CacheHelper/read_cache_before_db_chef');
    var XmppServerData = require('../lib/CacheHelper/xmpp_server_data');
    var AccessRelationData = require('../lib/CacheHelper/access_relation_data');
    var AuthorityChecker = require('./authority/authority_checker');
    var ShortenURLUtils = require('./shorten_url_utils');
    var ShortenURLManager = require('./shorten_url_manager');
    var ShortenURLInfo = require('../model/shorten_url_info');

    var XmppUtils = require('./xmpp_utils');

    var FileUtils = require('./file_utils');
    var FileConvert = require('./file_convert');
    var PathFileConvert = require('./file_convert');
    const Validation = require('./validation');
    const Formatting = require('./formatting');

    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    function SynchronousBridgeNodeXmpp() {
    }

    const MESSAGE_TYPE_PUBLIC_ID = 1;
    const MESSAGE_TYPE_CHAT_ID = 2;
    const MESSAGE_TYPE_GROUP_CHAT_ID = 3;
    const MESSAGE_TYPE_TASK_ID = 4;
    const MESSAGE_TYPE_COMMUNITY_ID = 5;
    const MESSAGE_TYPE_MURMUR_ID = 11;

    var LOGIN_STATUS_NOCONNECT = 1;
    var LOGIN_STATUS_CONNECTING = 2;
    var LOGIN_STATUS_OPENING_AUTHENTICATE_STREAM = 3;
    var LOGIN_STATUS_AUTHENTICATING = 4;
    var LOGIN_STATUS_OPENING_NEW_STREAM = 5;
    var LOGIN_STATUS_BINDING = 6;
    var LOGIN_STATUS_STARTING_SESSION = 7;
    var LOGIN_STATUS_LOGINED = 8;

    var DISCCONECT_REASON_NO = 0;
    var DISCCONECT_REASON_UNKNOWN = 1;
    var DISCCONECT_REASON_ERROR_INNER = 2;
    var DISCCONECT_REASON_ERROR_PARAM = 3;
    var DISCCONECT_REASON_ERROR_AUTH = 4;
    var ERROR_REASON_PARSE_RESPONSE_XMPP = 5;
    var ERROR_REASON_XMPP_SERVER = 6;
    var ERROR_REASON_INNER = 7;
    var ERROR_REASON_NO_LOGINED = 9;
    var ERROR_REASON_ERROR_PARAM = 10;
    var ERROR_CREATE_AVATAR_IMAGE = 11;
    var ERROR_EXIST_USER = 12;
    var ERROR_EXIST_MAILADDRESS = 13;
    var ERROR_NOT_FOUND_USER = 14;
    var ERROR_REASON_DB_ACCESS_ERROR = 15;

    var DEFAULT_XMPP_SERVER_CLIENT_PORT = 5222;

    const EMOTION_POINT_BASIC_ICON = '{}';

    var _proto = SynchronousBridgeNodeXmpp.prototype;

    _proto.login = function(socket, tenantUuid, user, password, onLogindCallback,
            isIndependence) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.login(');
        var _self = this;
        if (socket == null || typeof socket != 'object') {
            _log.connectionLog(4, 'socket is invalid');
            return false;
        }
        if (user == null || typeof user != 'string' || user == '') {
            _log.connectionLog(4, 'user is invalid');
            return false;
        }
        if (tenantUuid == null || typeof tenantUuid != 'string' || tenantUuid == '') {
            _log.connectionLog(4, 'tenantUuid is invalid');
            return false;
        }
        if (password == null || typeof password != 'string' || password == '') {
            _log.connectionLog(4, 'password is invalid');
            return false;
        }
        if (onLogindCallback == null || typeof onLogindCallback != 'function') {
            _log.connectionLog(4, 'onLogindCallback is invalid');
            return false;
        }
        var _isIndependence = false;
        if (isIndependence != null && typeof isIndependence == 'boolean') {
            _isIndependence = isIndependence;
        }
        function xsConnectedCallback(xsConnector) {
            xsConnected(xsConnector);
        }
        function xsDataReceiveCallback(xsConnector, data) {
            xsDataReceived(_self, xsConnector, data);
        }
        function xsDisconnectCallback(xsConnector) {
            xsDisconnected(xsConnector);
        }
        function xsErrorOccurredCallback(xsConnector, error) {
            xsErrorOccurred(xsConnector, error);
        }
        var _xmppServerHost = null;
        var _xmppServerPort = DEFAULT_XMPP_SERVER_CLIENT_PORT;

        var xsConn = XmppServerConnector.create(_xmppServerHost,
                _xmppServerPort, xsConnectedCallback, xsDisconnectCallback,
                xsDataReceiveCallback, xsErrorOccurredCallback);
        if (xsConn == null || !xsConn.initialized) {
            _log.connectionLog(4, 'xsConn is not initialized');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionDataAry = _sessionDataMannager.getByLoginAccountInTenant(tenantUuid, user);
        if(_sessionDataAry == null){
            _log.connectionLog(4, 'sessionDataAry is null');
            return false;
        }
        if(_sessionDataAry.length > 0){
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp login :: detect user['+tenantUuid+' '+user+']. begin multi session');
            var _tempData = {
                tenantUuid : _sessionDataAry[0].getTenantUuid(),
                user : _sessionDataAry[0].getUserName(),
                jid  : _sessionDataAry[0].getJid(),
                xmppServerName : _sessionDataAry[0].getXmppServerName(),
                xmppServerPort : _sessionDataAry[0].getXmppServerPort(),
                openfireSock : _sessionDataAry[0].getOpenfireSock(),
            };
            setTimeout(function(){
                try{
                    xsConn.socketIO = socket;
                    xsConn.setHost(_tempData.xmppServerName);
                    xsConn.setPort(_tempData.xmppServerPort);
                    xsConn.tenantUuid = tenantUuid;
                    xsConn.user = _tempData.user;
                    xsConn.password = password;
                    xsConn.status = LOGIN_STATUS_CONNECTING;
                    xsConn.onLogindCallback = onLogindCallback;
                    xsConn.receiveBuf = '';
                    xsConn.isIndependence = _isIndependence;
                    xsConn.loginAccount = user;
                    xsConn.jid = _tempData.jid;
                    socket.xsConn = xsConn;
                    xsConn.onMultiSessionConnected = _onMultiSessionConnected;
                    xsConn.openfireSock = _tempData.openfireSock;
                    xsConn.connect();
                }catch(e){
                    _log.connectionLog(7, 'SynchronousBridgeNodeXmpp login :: multi session failer.');
                    onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER, null);
                    return;
                }
            }, 1);
            return true;
        }
        function _onMultiSessionConnected(result) {
            if(result != true){
                var _sessionDataAry = SessionDataMannager.getInstance().getByOpenfireSock(xsConn.openfireSock);
                if(_sessionDataAry == null){
                    _log.connectionLog(4, 'SynchronousBridgeNodeXmpp _onMultiSessionConnected :: _sessionDataAry is null');
                    return;
                }
                if(_sessionDataAry.length > 0){
                    _log.connectionLog(7, 'SynchronousBridgeNodeXmpp _onMultiSessionConnected :: keep openfire session, detect sessionData.');
                }else{
                    _log.connectionLog(7, 'SynchronousBridgeNodeXmpp _onMultiSessionConnected :: close openfire session, not detect sessionData.');
                    xsConn.openfireSock.disconnect();
                    xsConn.openfireSock = null;
                }
                return;
            }
            var _hostName = _conf.getConfData('NODEJS_HOSTNAME');
            var _accessRelationData = AccessRelationData.createDish(_hostName);
            StoreVolatileChef.getInstance().store(_accessRelationData, _onStored);

            function _onStored(err) {
                if (err) {
                    _log.connectionLog(3, 'Failed storing access_relation_data to Redis.');
                    onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER, null);
                    return;
                }

                var _accessToken = _accessRelationData.getKeyName();
                var _sessionData = SessionData.create();
                _sessionData.setAccessToken(_accessToken);
                _sessionData.setIpAddress(Utils.getIPAddress(socket));
                _sessionData.setTenantUuid(xsConn.tenantUuid);
                _sessionData.setUserName(xsConn.user);
                _sessionData.setPassword(Utils.md5Hex(xsConn.password));
                _sessionData.setJid(xsConn.jid);
                _sessionData.setSocketIoSock(socket);
                _sessionData.setOpenfireSock(xsConn.openfireSock);
                if(xsConn.isIndependence){
                    var _independentClientNumber = _sessionDataMannager.createIndependentClientNumber();
                    _sessionData.setIndependentClientNumber(_independentClientNumber);
                }else{
                    _sessionData.setIndependentClientNumber(0);
                }
                _sessionData.setLoginAccout(xsConn.loginAccount);
                _sessionData.setXmppServerName(xsConn.getHost());
                _sessionData.setXmppServerPort(xsConn.getPort());
                _sessionDataMannager.add(_sessionData);
                onLogindCallback(true, DISCCONECT_REASON_NO, _accessToken);
            }

        }

        _log.connectionLog(7, 'SynchronousBridgeNodeXmpp login :: not detect user['+tenantUuid+' '+user+']. create openfire session');
        var _tenantUuid = tenantUuid;
        var _loginAccount = user;
        return UserAccountUtils.getActiveUserDataByTenantLoginAccount(_tenantUuid, _loginAccount,
                _onGetActiveUserData);

        function _onGetActiveUserData(userAccountData) {
            if (!userAccountData) {
                onLogindCallback(false, DISCCONECT_REASON_ERROR_AUTH, null);
                return;
            }
            var _xmppServerName = userAccountData.getXmppServerName();
            var _openfireAccount = userAccountData.getOpenfireAccount();
            var _tenantUuid = userAccountData.getTenantUuid();
            xsConn.socketIO = socket;
            xsConn.tenantUuid = _tenantUuid;
            xsConn.user = _openfireAccount.toLowerCase();
            xsConn.password = password;
            xsConn.status = LOGIN_STATUS_CONNECTING;
            xsConn.onLogindCallback = onLogindCallback;
            xsConn.receiveBuf = '';
            xsConn.isIndependence = _isIndependence;
            xsConn.independentClientNumber = 0;
            xsConn.loginAccount = userAccountData.getLoginAccount();
            xsConn.jid = userAccountData.getOpenfireAccount() + '@'
                    + userAccountData.getXmppServerName();
            socket.xsConn = xsConn;
            xsConn.onMultiSessionConnected = null;

            var _xmppServerData = XmppServerData.createAsOrder(_xmppServerName);
            if (_xmppServerData == null) {
                _log.connectionLog(3, 'Internal error. Could not create order.');
                onLogindCallback(false, DISCCONECT_REASON_ERROR_AUTH, null);
                return;
            }
            var _chef = ReadCacheBeforeDBChef.getInstance();
            _chef.cook(_xmppServerData, _onGetXmppDataFromCache);

        }

        function _onGetXmppDataFromCache(err, dish) {
            if (err) {
                _log.connectionLog(3, 'SynchronousBridgeNodeXmpp _onGetXmppDataFromCache :: Could not get reach to redis / DB'
                    + '[' + tenantUuid + ' ' + user + ']. ERROR: ' + err.name + ' (' + err.message + ').');
                onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER, null);
                return;
            }
            if (dish == null) {
                _log.connectionLog(3, 'SynchronousBridgeNodeXmpp _onGetXmppDataFromCache :: Could not get reach to redis / DB');
                onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER, null);
                return;
            }
            xsConn.setHost(dish.getServerName());
            xsConn.setPort(parseInt(dish.getPortClnt()));

            xsConn.connect();
        }
    };

    _proto.clientDisconnect = function(socket) {
        if (socket == null) {
            _log
                    .connectionLog(4,
                            'SynchronousBridgeNodeXmpp clientDisconnect :: socket is null');
            return;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.getBySocketIoSock(socket);
        if (_sessionData == null) {
            _log
                    .connectionLog(4,
                            'SynchronousBridgeNodeXmpp clientDisconnect :: _sessionData is null');
            return;
        }
        _sessionData.setSocketIoSock(null);
        _sessionDataMannager.notifyDisconnect(_sessionData.getAccessToken());
    };

    _proto.clientReconnect = function(socket, accessToken) {
        if (socket == null) {
            _log
                    .connectionLog(4,
                            'SynchronousBridgeNodeXmpp clientReconnect :: socket is null');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log
                    .connectionLog(4,
                            'SynchronousBridgeNodeXmpp clientReconnect :: _sessionData is null');
            return false;
        }
        _sessionDataMannager.notifyReconnect(accessToken, socket);
    };

    _proto.logout = function(socket) {
        if (socket == null) {
            _log.connectionLog(4,
                    'SynchronousBridgeNodeXmpp logout :: socket is null');
            return;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.getBySocketIoSock(socket);
        if (_sessionData == null) {
            _log.connectionLog(4,
                    'SynchronousBridgeNodeXmpp logout :: _sessionData is null');
            return;
        }
        _sessionData.setSocketIoSock(null);
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn != null) {
            var _sessionDataAry = _sessionDataMannager.getByOpenfireSock(_xsConn);
            if(_sessionDataAry == null){
                _log.connectionLog(4, 'SynchronousBridgeNodeXmpp logout :: _sessionDataAry is null');
                return;
            }
            if(_sessionDataAry.length > 1){
                _log.connectionLog(7, 'SynchronousBridgeNodeXmpp logout :: keep openfire session, detect user.');
            }else{
                var _user = _sessionData.getLoginAccout();
                var _tenantUuid = _sessionData.getTenantUuid();
                var _status = CubeeWebApi.getInstance().isLoginSequenceLocked(_tenantUuid, _user);
                if(_status != true){
                    _log.connectionLog(7, 'SynchronousBridgeNodeXmpp logout :: close openfire session, not detect user.');
                    _xsConn.disconnect();
                } else {
                    _log.connectionLog(7, 'SynchronousBridgeNodeXmpp logout :: keep openfire session, not detect user.');
                }
            }
        }
        _sessionDataMannager.remove(_sessionData.getAccessToken());
        _log.connectionLog(7, 'SynchronousBridgeNodeXmpp logout :: remove sessionData.');
    };

    function xsConnected(xsConn) {
        _log.connectionLog(7, 'XMPP connected');
        var _xmppServerName = xsConn.getHost();

        setTimeout(function() {
            var _xmlHeader = Xmpp.getHeaderXmpp();
            if (_xmlHeader == '') {
                _log.connectionLog(4, 'getXmlHeader Data is empty');
                if(xsConn.onMultiSessionConnected != null){
                    xsConn.onMultiSessionConnected(false);
                }
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _openStreamXmpp = Xmpp.getOpenStreamXmpp(_xmppServerName);
            if (_openStreamXmpp == '') {
                _log.connectionLog(4, 'getOpenStreamXmpp Data is empty');
                if(xsConn.onMultiSessionConnected != null){
                    xsConn.onMultiSessionConnected(false);
                }
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            xsConn.status = LOGIN_STATUS_OPENING_AUTHENTICATE_STREAM;
            xsConn.send(_xmlHeader);
            xsConn.send(_openStreamXmpp);
        }, 10);
    }

    function xsDataReceived(_self, xsConn, data) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.xsDataReceived(');
        if (_self == null || xsConn == null || data == null) {
            return;
        }
        _log.connectionLog(7, 'XMPP receive data : status = ' + xsConn.status);

        switch (xsConn.status) {
        case LOGIN_STATUS_NOCONNECT:
            break;
        case LOGIN_STATUS_CONNECTING:
            break;
        case LOGIN_STATUS_OPENING_AUTHENTICATE_STREAM:
            onOpenAuthenticateStream(xsConn, data);
            break;
        case LOGIN_STATUS_AUTHENTICATING:
            onAuthentication(xsConn, data);
            break;
        case LOGIN_STATUS_OPENING_NEW_STREAM:
            onOpenAuthedStream(xsConn, data);
            break;
        case LOGIN_STATUS_BINDING:
            onBind(xsConn, data);
            break;
        case LOGIN_STATUS_STARTING_SESSION:
            onSession(xsConn, data);
            break;
        case LOGIN_STATUS_LOGINED:
            onData(xsConn, data);
            break;
        }
    }

    function onOpenAuthenticateStream(xsConn, data) {
        var _buff = xsConn.receiveBuf;
        xsConn.receiveBuf = _buff + data;
        var len = xsConn.receiveBuf.length;
        if (len < 18
                || xsConn.receiveBuf.substr(len - 18, 18) != '</stream:features>') {
            _log.connectionLog(7, 'onOpenAuthenticateStream : "' + data + '"');
            return;
        }
        xsConn.receiveBuf = '';
        setTimeout(function() {
            var _xmppAuthPlain = Xmpp.getAuthPlainXmpp(xsConn.user,
                    xsConn.password);
            if (_xmppAuthPlain == '') {
                _log.connectionLog(4, 'getAuthPlainXmpp Data is empty');
                if(xsConn.onMultiSessionConnected != null){
                    xsConn.onMultiSessionConnected(false);
                }
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            xsConn.status = LOGIN_STATUS_AUTHENTICATING;
            xsConn.send(_xmppAuthPlain);
        }, 10);
    }

    function onAuthentication(xsConn, data) {
        var _doc = null;
        xsConn.receiveBuf = xsConn.receiveBuf + data;
        try {
            _doc = libxml.parseXml(xsConn.receiveBuf);
        } catch (e) {
            return;
        }
        xsConn.receiveBuf = '';
        setTimeout(function() {
            if (_doc == null) {
                _log.connectionLog(4, 'onAuthentication _doc is null');
                if(xsConn.onMultiSessionConnected != null){
                    xsConn.onMultiSessionConnected(false);
                }
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _rootElem = _doc.root();
            if (_rootElem.name() != 'success') {
                _log.connectionLog(5, 'onAuthentication AUTH ERROR');
                if(xsConn.onMultiSessionConnected != null){
                    xsConn.onMultiSessionConnected(false);
                }
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_AUTH,
                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }

            if(xsConn.onMultiSessionConnected != null){
                xsConn.status = LOGIN_STATUS_LOGINED;
                xsConn.onMultiSessionConnected(true);
                xsConn.disconnect();
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }

            var _xmlHeader = Xmpp.getHeaderXmpp();
            if (_xmlHeader == '') {
                _log.connectionLog(4, 'getXmlHeader Data is empty');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _openStreamXmpp = Xmpp.getOpenStreamXmpp(xsConn.getHost());
            if (_openStreamXmpp == '') {
                _log.connectionLog(4, 'getOpenStreamXmpp Data is empty');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            xsConn.status = LOGIN_STATUS_OPENING_NEW_STREAM;
            xsConn.send(_xmlHeader);
            xsConn.send(_openStreamXmpp);
        }, 10);
    }

    function onOpenAuthedStream(xsConn, data) {
        xsConn.receiveBuf = xsConn.receiveBuf + data;
        var len = xsConn.receiveBuf.length;
        if (len < 18
            || xsConn.receiveBuf.substr(len - 18, 18) != '</stream:features>') {
            return;
        }
        xsConn.receiveBuf = '';
        setTimeout(function() {
            var _clientBaseName = 'cubeeClient';
            var _clientName = _clientBaseName;
            if (xsConn.isIndependence) {
                xsConn.independentClientNumber = SessionDataMannager
                    .getInstance().createIndependentClientNumber();
                _clientName = _clientBaseName + xsConn.independentClientNumber;
            }
            var _bindXmpp = Xmpp.getBindXmpp(_clientName);
            if (_bindXmpp == '') {
                _log.connectionLog(4, 'getBindXmpp Data is empty');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            xsConn.status = LOGIN_STATUS_BINDING;
            xsConn.send(_bindXmpp);
        }, 10);
    }

    function onBind(xsConn, data) {
        var _doc = null;
        xsConn.receiveBuf = xsConn.receiveBuf + data;
        try {
            _doc = libxml.parseXml(xsConn.receiveBuf);
        } catch (e) {
            return;
        }
        xsConn.receiveBuf = '';
        setTimeout(function() {
            if (_doc == null) {
                _log.connectionLog(4, 'onBind _doc is null');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _rootElem = _doc.root();
            if (_rootElem.name() != 'iq') {
                _log.connectionLog(4, 'onBind _rootElem name is invalid');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            if (_rootElem.attr('type') == null) {
                _log.connectionLog(4, 'onBind _rootElem type is invalid');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            if (_rootElem.attr('type').value() != 'result') {
                _log.connectionLog(4, 'onBind _rootElem type not result');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_PARAM,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _bindElem = _rootElem.child(0);
            if (_bindElem == null || _bindElem.name() != 'bind') {
                _log.connectionLog(4, 'onBind _bindElem is invalid');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _jidElem = _bindElem.child(0);
            if (_jidElem == null || _jidElem.name() != 'jid') {
                _log.connectionLog(4, 'onBind _jidElem is invalid');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _xmppSession = Xmpp.getSessionXmpp();
            if (_xmppSession == '') {
                _log.connectionLog(4, 'getSessionXmpp Data is empty');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            xsConn.status = LOGIN_STATUS_STARTING_SESSION;
            xsConn.send(_xmppSession);
        }, 10);
    }

    function onSession(xsConn, data) {
        var _doc = null;
        xsConn.receiveBuf = xsConn.receiveBuf + data;
        try {
            _doc = libxml.parseXml(xsConn.receiveBuf);
        } catch (e) {
            return;
        }
        xsConn.receiveBuf = '';
        setTimeout(function() {
            if (_doc == null) {
                _log.connectionLog(4, 'onSession _doc is null');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _rootElem = _doc.root();
            if (_rootElem.name() != 'iq') {
                _log.connectionLog(4, 'onSession _rootElem name is invalid');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            if (_rootElem.attr('type') == null) {
                _log.connectionLog(4, 'onSession _rootElem type is invalid');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            if (_rootElem.attr('type').value() != 'result') {
                _log.connectionLog(4, 'onSession _rootElem type not result');
                xsConn.disconnect();
                xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_PARAM,
                                        null);
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }
            var _hostName = _conf.getConfData('NODEJS_HOSTNAME');
            var _accessRelationData = AccessRelationData.createDish(_hostName);
            StoreVolatileChef.getInstance().store(_accessRelationData, _onStored);

            function _onStored(err) {
                if (err) {
                    _log.connectionLog(3, 'Failed storing access_relation_data to Redis.');
                    xsConn.onLogindCallback(false, DISCCONECT_REASON_ERROR_INNER, null);
                    return;
                }
                var _accessToken = _accessRelationData.getKeyName();
                _registerSession(_accessToken, xsConn.socketIO, xsConn);

                xsConn.status = LOGIN_STATUS_LOGINED;
                xsConn.onLogindCallback(true, DISCCONECT_REASON_NO, _accessToken);
                delete xsConn.onLogindCallback;

                var _xmppSendPing = XmppUtils.checkCreateXmppData(xsConn, function(){
                    return Xmpp.createSendPingXmpp(xsConn.getHost(),
                                                   xsConn.user + '@' + xsConn.getHost());
                });
                if (_xmppSendPing[0] == null || _xmppSendPing[0] == '') {
                    _log.connectionLog(4, '_xmppSendPing[0] is invalid');
                    return false;
                }
                setTimeout(function() {
                    xsConn.startHeartbeat(_xmppSendPing[0]);
                }, 30000);
                delete xsConn.socketIO.xsConn;
                delete xsConn.socketIO;
                delete xsConn.user;
                delete xsConn.password;
                delete xsConn.isIndependence;
                delete xsConn.independentClientNumber;
            }

        }, 10);
    }

    function _registerSession(accessToken, socketIoSock, xsConn) {
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = SessionData.create();
        _sessionData.setAccessToken(accessToken);
        _sessionData.setIpAddress(Utils.getIPAddress(socketIoSock));
        _sessionData.setUserName(xsConn.user);
        _sessionData.setPassword(Utils.md5Hex(xsConn.password));
        _sessionData.setJid(xsConn.jid);
        _sessionData.setSocketIoSock(socketIoSock);
        _sessionData.setOpenfireSock(xsConn);
        _sessionData.setIndependentClientNumber(xsConn.independentClientNumber);
        _sessionData.setLoginAccout(xsConn.loginAccount);
        _sessionData.setTenantUuid(xsConn.tenantUuid);
        _sessionData.setXmppServerName(xsConn.getHost());
        _sessionData.setXmppServerPort(xsConn.getPort());
        if (!_sessionDataMannager.add(_sessionData)) {
            return '';
        }
        return accessToken;
    }

    function onData(xsConn, data) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.onData(');
        var _doc = null;
        xsConn.receiveBuf = xsConn.receiveBuf + data;
        var _processData = '<process>' + xsConn.receiveBuf + '</process>';
        try {
            _doc = libxml.parseXml(_processData);
        } catch (e) {
            return;
        }
        xsConn.receiveBuf = '';
        if (_doc == null) {
            _log.connectionLog(4, '_doc is null');
            return;
        }
        var _rootElem = _doc.root();
        var _childNodes = _rootElem.childNodes();
        for (_i = 0; _i < _childNodes.length; _i++) {
            var _element = _childNodes[_i];
            if (_element.type() != 'element') {
                continue;
            }
            var _elementName = _element.name();
            switch (_elementName) {
            case 'iq':
                _onIq(xsConn, _element);
                break;
            case 'presence':
                break;
            case 'message':
                _onMessage(xsConn, _element);
                break;
            default:
                break;
            }
        }
    }

    function _onIq(xsConn, xmlRootElem) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp._onIq(');
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _iqTypeAttr = xmlRootElem.attr('type');
        if (_iqTypeAttr != null && _iqTypeAttr.value() == 'get') {
            var _pingElem = Utils.getChildXmlElement(xmlRootElem, 'ping');
            if (_pingElem != null
                && _pingElem.namespace().href() == 'urn:xmpp:ping') {
                _onIqPingReceived(xsConn, xmlRootElem);
                return;
            }
        }
        var _idObj = xmlRootElem.attr('id');
        if (_idObj == null) {
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp._onIq _idObj is null');
            return;
        }
        var _sessionDataAry = _sessionDataMannager.getByOpenfireSock(xsConn);
        if(_sessionDataAry == null){
            _log.connectionLog(4, 'SynchronousBridgeNodeXmpp onIq :: _sessionDataAry is null');
            return;
        }
        if (_sessionDataAry.length < 1) {
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp._onIq _sessionDataAry length 0');
            return;
        }
        var _id = _idObj.value();
        for(var _index = 0; _index < _sessionDataAry.length; _index++){
            var _callbackFunc = _sessionDataAry[_index].getCallback(_id);
            if (_callbackFunc == undefined || _callbackFunc == null || typeof _callbackFunc != 'function') {
                continue;
            }
            _log.connectionLog(7, 'onIq:callback['+_id+']');
            _sessionDataAry[_index].unsetCallback(_id);
            _callbackFunc(xmlRootElem);
            break;
        }
    }

    function _onIqPingReceived(xsConn, xmlRootElem) {
        if (xsConn == null) {
            return;
        }
        if (xmlRootElem == null) {
            return;
        }
        var _iqTypeAttr = xmlRootElem.attr('type');
        if (_iqTypeAttr == null || _iqTypeAttr.value() != 'get') {
            return;
        }
        var _pingFromAttr = xmlRootElem.attr('from');
        var _pingFrom = '';
        if (_pingFromAttr != null) {
            _pingFrom = _pingFromAttr.value();
        }
        var _pingToAttr = xmlRootElem.attr('to');
        var _pingTo = '';
        if (_pingToAttr != null) {
            _pingTo = _pingToAttr.value();
        }
        var _pingIdAttr = xmlRootElem.attr('id');
        var _pingId = '';
        if (_pingIdAttr != null) {
            _pingId = _pingIdAttr.value();
        }
        var _xmppResponsePing = Xmpp.createResponsePingXmpp(_pingTo, _pingFrom,
                                                            _pingId);
        var _xmppStr = _xmppResponsePing[0];
        xsConn.send(_xmppStr);
    }

    function _onMessage(xsConn, xmlRootElem) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp._onMessage(..');
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionDataAry = _sessionDataMannager.getByOpenfireSock(xsConn);
        if(_sessionDataAry == null){
            _log.connectionLog(4, 'SynchronousBridgeNodeXmpp onMessage :: _sessionDataAry is null');
            return;
        }
        if (_sessionDataAry.length < 1) {
            return;
        }
        var xmlRootElemTypeAttr = xmlRootElem.attr('type');
        if (xmlRootElemTypeAttr != null) {
            var _xmlRootElemType = xmlRootElemTypeAttr.value();
            if (_xmlRootElemType == 'chat') {
                _log.connectionLog(7, '_onMessage::_onChatNotification');
                _onChatNotification(_sessionDataAry, xmlRootElem);
                return;
            }
        }
        var _chatElem = Utils.getChildXmlElement(xmlRootElem, 'chat');
        if (_chatElem != null) {
            _log.connectionLog(7, '_onMessage::_onChatMessage');
            _onChatMessage(_sessionDataAry, xmlRootElem);
            return;
        }
        var _taskElem = Utils.getChildXmlElement(xmlRootElem, 'task');
        if (_taskElem != null) {
            _log.connectionLog(7, '_onMessage::_onTaskMessage');
            _onTaskMessage(_sessionDataAry, xmlRootElem);
            return;
        }
        var _goodJobElem = Utils.getChildXmlElement(xmlRootElem, 'goodjob');
        if (_goodJobElem != null) {
            _log.connectionLog(7, '_onMessage::_onGoodJobMessage');
            _onGoodJobMessage(_sessionDataAry, xmlRootElem);
            return;
        }
        var _emotionPointElem = Utils.getChildXmlElement(xmlRootElem, 'emotionpoint');
        if (_emotionPointElem != null) {
            _log.connectionLog(7, '_onMessage::_onEmotionPointMessage');
            _onEmotionPointMessage(_sessionDataAry, xmlRootElem);
            return;
        }
        var _threadTitleElem = Utils.getChildXmlElement(xmlRootElem, 'threadtitleupdate');
        if (_threadTitleElem != null) {
            _log.connectionLog(7, '_onMessage::_threadTitleMessage');
            _onThreadTitleMessage(_sessionDataAry, xmlRootElem);
            return;
        }
        var _noteElem = Utils.getChildXmlElement(xmlRootElem, 'notedelete');
        if (_noteElem != null) {
            _log.connectionLog(7, '_onMessage::_onDeleteNoteNotify');
            _onDeleteNoteNotify(_sessionDataAry, xmlRootElem);
            return;
        }
        var _noteElem = Utils.getChildXmlElement(xmlRootElem, "noteinfoupdate");
        if (_noteElem != null) {
            _log.connectionLog(7, '_onMessage::_onDeleteNoteNotify');
            _onUpdateNoteInfoNotify(_sessionDataAry, xmlRootElem);
            return;
        }
        var _systemElem = Utils.getChildXmlElement(xmlRootElem, 'system');
        if (_systemElem != null) {
            _log.connectionLog(7, '_onMessage::_onSystemMessage');
            _onSystemMessage(_sessionDataAry, xmlRootElem);
            return;
        }
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem != null) {
            var _notifyElemNamespace = _notifyElem.namespace().href();
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp#_onMessage:: _notify Elem Namespace:'+_notifyElemNamespace);
            switch (_notifyElemNamespace) {
            case RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE_OPTION:
                _log.connectionLog(7, '_onMessage::_onMessageOptionNotify');
                _onMessageOptionNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_CHANGE_PERSON_DATA:
                _log.connectionLog(7, '_onMessage::_onChangePersonDataNotify');
                _onChangePersonDataNotify(_sessionDataAry, xmlRootElem, xsConn);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE:
            case RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_MESSAGE_BODY:
                _log.connectionLog(7, '_onMessage::_onMessageNotify');
                _onMessageNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE_DELETE:
                _log.connectionLog(7, '_onMessage::_onMessageDeleteNotify');
                _onMessageDeleteNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_CREATE_CHAT_ROOM:
                _log.connectionLog(7, '_onMessage::_onCreateChatRoomNotify');
                _onCreateChatRoomNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_ADD_CHAT_ROOM_MEMBER:
                _log.connectionLog(7, '_onMessage::_onAddChatRoomMemberNotify');
                _onAddChatRoomMemberNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_CHATROOM_INFO:
                _log.connectionLog(7, '_onMessage::_onUpdateChatRoomInfoNotify');
                _onUpdateChatRoomInfoNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_COMMUNITY_INFO:
                _log.connectionLog(7, '_onMessage::_onUpdateCommunityInfoNotify');
                _onUpdateCommunityInfoNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_ADD_COMMUNITY_MEMBER:
                _log.connectionLog(7, '_onMessage::_onAddCommunityMemberNotify');
                _onAddCommunityMemberNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_COMMUNITY_OWNER:
                _log.connectionLog(7, '_onMessage::_onUpdateCommunityOwnerNotify');
                _onUpdateCommunityOwnerNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_REMOVE_COMMUNITY_MEMBER:
                _log.connectionLog(7, '_onMessage::_onRemoveCommunityMemberNotify');
                _onRemoveCommunityMemberNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            case RequestData.XMPP_NOTIFY_NAMESPACE_REMOVE_CHAT_ROOM_MEMBER:
                _log.connectionLog(7, '_onMessage::_onRemoveChatRoomMemberNotify');
                _onRemoveChatRoomMemberNotify(_sessionDataAry, xmlRootElem);
                return;
                break;
            default:
                _log.connectionLog(6, '_onMessage::unknown namespace'
                                        + _notifyElemNamespace);
                break;
            }
        }
    }

    _proto.getVCard = function(accessToken, toJid, onGetVCardCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid');
            return false;
        }
        if (toJid == null || typeof toJid != 'string') {
            _log.connectionLog(4, 'toJid is invalid');
            return false;
        }
        if (onGetVCardCallBackFunc == null
            || typeof onGetVCardCallBackFunc != 'function') {
            _log.connectionLog(4, 'onGetVCardCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }
        var _fromJid = _sessionData.getJid();
        var _xmppGetVCard = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createGetVcardInformationXmpp(_fromJid, toJid);
        });
        var _xmppStr = _xmppGetVCard[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, '_xmppGetVCard[0] is invalid');
            return false;
        }
        var _id = _xmppGetVCard[1];
        function onGetVCardCallBack(responceXmlRootElem) {
            var _responceData = getVCardDataFromOnGetVCard(responceXmlRootElem);
            var _result = true;
            var _reason = DISCCONECT_REASON_NO;
            if (_responceData == null) {
                _responceData = {};
                _result = false;
                _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
            }
            onGetVCardCallBackFunc(_result, _reason, _responceData, toJid);
        }
        _sessionData.setCallback(_id, onGetVCardCallBack);
        setTimeout(function() {
            var _callbackFunc = _sessionData.getCallback(_id);
            _sessionData.unsetCallback(_id);
            if (_callbackFunc == undefined || _callbackFunc == null
                || typeof _callbackFunc != 'function') {
                return;
            }
            _sessionData.unsetCallback(_id);
            _log.connectionLog(6, 'getVCard timeout!');
            var _result = true;
            var _reason = DISCCONECT_REASON_NO;
            var _responceData = {
                nickName : '',
                avatarType : '',
                avatarData : '',
            };
            onGetVCardCallBackFunc(_result, _reason, _responceData, toJid);
        }, 5000);
        _xsConn.send(_xmppStr);

        return true;
    };

    function getVCardDataFromOnGetVCard(responceXmlRootElem) {
        var _responceData = null;
        var _vCardElem = Utils.getChildXmlElement(responceXmlRootElem, 'vCard');
        if (_vCardElem == null) {
            var _vCardElem = Utils.getChildXmlElement(responceXmlRootElem,
                                                      'vcard');
            if (_vCardElem == null) {
                _log.connectionLog(3, '_vCardElem is null - '
                                    + responceXmlRootElem.toString());
                return _responceData;
            }
        }
        _responceData = {};
        var _nickName = '';
        var _nickNameElem = Utils.getChildXmlElement(_vCardElem, 'NICKNAME');
        if (_nickNameElem == null) {
            _nickNameElem = Utils.getChildXmlElement(_vCardElem, 'nickname');
        }
        if (_nickNameElem != null) {
            _nickName = _nickNameElem.text();
        }
        _responceData.nickName = Utils.replaceAll(_nickName, '\n', '');

        let _gropArray = Utils.getChildXmlElement(_vCardElem, 'group');
        let _groupItems = [];
        if(_gropArray != null){
            let _grops = Utils.getChildXmlElementArray(_gropArray, 'item');
            if (_grops != null) {
                for (let _j = 0; _j < _grops.length; _j++) {
                    let _groupElem = _grops[_j];
                    _groupItems.push(_groupElem.text());
                }
            }
        }
        _responceData.group =_groupItems

        var _avatarType = '';
        var _avatarData = '';
        var _photoElem = Utils.getChildXmlElement(_vCardElem, 'PHOTO');
        if (_photoElem == null) {
            _photoElem = Utils.getChildXmlElement(_vCardElem, 'photo');
        }
        if (_photoElem != null) {
            var _typeElem = Utils.getChildXmlElement(_photoElem, 'TYPE');
            if (_typeElem == null) {
                _typeElem = Utils.getChildXmlElement(_photoElem, 'type');
            }
            if (_typeElem != null) {
                _avatarType = _typeElem.text();
            }
            var _binValElem = Utils.getChildXmlElement(_photoElem, 'BINVAL');
            if (_binValElem == null) {
                _binValElem = Utils.getChildXmlElement(_photoElem, 'binval');
            }
            if (_binValElem != null) {
                _avatarData = _binValElem.text();
            }

        }
        _responceData.avatarType = Utils.replaceAll(_avatarType, '\n', '');
        _responceData.avatarData = Utils.replaceAll(_avatarData, '\n', '');
        var _extras = '';
        var _extrasElem = Utils.getChildXmlElement(_vCardElem, 'EXTRAS');
        if (_extrasElem == null) {
            _extrasElem = Utils.getChildXmlElement(_vCardElem, 'extras');
        }
        if (_extrasElem != null) {
            _extras = _extrasElem.text();
            _extras = decodeURIComponent(_extras);
        }

        _responceData.extras = Utils.replaceAll(_extras, '\n', '');
        return _responceData;
    }

    _proto.getRoster = function(accessToken, onGetRosterCallBackFunc) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (onGetRosterCallBackFunc == null
            || typeof onGetRosterCallBackFunc != 'function') {
            _log.connectionLog(4, 'onGetRosterCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }
        var _fromJid = _sessionData.getJid();
        var _xmppGetRoster = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createGetRosterXmpp(_fromJid);
        });
        var _xmppStr = _xmppGetRoster[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, '_xmppGetRoster[0] is invalid');
            return false;
        }
        var _id = _xmppGetRoster[1];
        function onGetRosterCallBack(responceXmlRootElem) {
            var _responseData = onGetRoster(responceXmlRootElem);
            var _responseCount = _responseData.length;
            if (_responseCount == 0) {
                onGetRosterCallBackFunc(true, DISCCONECT_REASON_NO,
                                        _responseCount, _responseData);
            } else {
                var _jidList = new Array();
                for ( var _i = 0; _i < _responseCount; _i++) {
                    _jidList[_i] = _responseData[_i].jid;
                }
                UserAccountUtils.getLoginAccountListByJidList(_jidList,
                                                              _onGetUserAccountDataCallBack);

                function _onGetUserAccountDataCallBack(mapData) {
                    var _loginAccountMapData = mapData;
                    for ( var _i = 0; _i < _responseCount; _i++) {
                        if (_loginAccountMapData) {
                            _responseData[_i].userName = _loginAccountMapData[_responseData[_i].jid];
                        }
                    }
                    onGetRosterCallBackFunc(true, DISCCONECT_REASON_NO,
                                            _responseCount, _responseData);
                }
            }
        }
        _sessionData.setCallback(_id, onGetRosterCallBack);
        _xsConn.send(_xmppStr);

        return true;
    };

    function onGetRoster(responceXmlRootElem) {
        var _responceData = [];
        var _queryElem = Utils.getChildXmlElement(responceXmlRootElem, 'query');
        if (_queryElem == null) {
            _log.connectionLog(3, '_queryElem is null - '
                                + responceXmlRootElem.toString());
            return _responceData;
        }
        var _itemArray = Utils.getChildXmlElementArray(_queryElem, 'item');
        var _itemCount = 0;
        if (_itemArray != null) {
            _itemCount = _itemArray.length;
            for ( var _i = 0; _i < _itemCount; _i++) {
                var _itemElem = _itemArray[_i];
                var _jidAttr = _itemElem.attr('jid');
                var _jid = '';
                if (_jidAttr != null) {
                    _jid = _jidAttr.value();
                }
                var _userName = _jid.split('@')[0];
                var _subscriptionAttr = _itemElem.attr('subscription');
                var _subscription = '';
                if (_subscriptionAttr != null) {
                    _subscription = _subscriptionAttr.value();
                }
                var _gropArray = Utils.getChildXmlElementArray(_itemElem,
                                                               'group');
                var _groupCount = 0;
                var _groupItems = [];
                if (_gropArray != null) {
                    _groupCount = _gropArray.length;
                    for ( var _j = 0; _j < _groupCount; _j++) {
                        var _groupElem = _gropArray[_j];
                        _groupItems[_j] = _groupElem.text();
                    }
                }
                var _nickNameAttr = _itemElem.attr('nickname');
                var _nickName = '';
                if (_nickNameAttr != null) {
                    _nickName = _nickNameAttr.value();
                }
                var _avatarTypeAttr = _itemElem.attr('avatartype');
                var _avatarType = '';
                if (_avatarTypeAttr != null) {
                    _avatarType = _avatarTypeAttr.value();
                }
                var _avatarDataAttr = _itemElem.attr('avatardata');
                var _avatarData = '';
                if (_avatarDataAttr != null) {
                    _avatarData = _avatarDataAttr.value();
                }
                var _presenceAttr = _itemElem.attr('presence');
                var _presence = 0;
                if (_presenceAttr != null) {
                    var _presenceStr = _presenceAttr.value();
                    _presence = parseInt(_presenceStr);
                }
                var _myMemoAttr = _itemElem.attr('mymemo');
                var _myMemo = '';
                if (_myMemoAttr != null) {
                    _myMemo = _myMemoAttr.value();
                }
                var _statusAttr = _itemElem.attr('status');
                var _status = 0;
                if (_statusAttr != null) {
                    var _statusStr = _statusAttr.value();
                    _status = parseInt(_statusStr);
                }

                _responceData[_i] = {
                    jid : _jid,
                    userName : _userName,
                    subscription : _subscription,
                    groupCount : _groupCount,
                    groupItems : _groupItems,
                    nickName : _nickName,
                    avatarType : _avatarType,
                    avatarData : _avatarData,
                    presence : _presence,
                    myMemo : _myMemo,
                    status : _status
                };
            }
        }
        return _responceData;
    }

    _proto.searchPerson = function(accessToken, requestData,
                                   onSearchPersonCallBackFunc) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onSearchPersonCallBackFunc == null
            || typeof onSearchPersonCallBackFunc != 'function') {
            _log.connectionLog(4, 'onSearchPersonCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }
        var _fromJid = _sessionData.getJid();
        var _subType = requestData.subType;
        var _startId = requestData.startId;
        var _count = requestData.count;
        var _condition = requestData.condition;
        if (_startId == null || _count == null || _condition == null) {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        var _filter = _condition.filter;
        var _sort = _condition.sort;
        if (_filter == null || _sort == null) {
            _log.connectionLog(3, 'filter or sort data is invalid');
            return false;
        }
        if (_subType == null) {
            _log.connectionLog(4, '_subType is invalid');
            return false;
        }
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _xmppSearchPerson = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createSearchPersonXmpp(
                _xmppServerHostName, _fromJid, _startId, _count, _filter, _sort, _subType);
        });
        var _xmppStr = _xmppSearchPerson[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, '_xmppSearchPerson[0] is invalid');
            return false;
        }
        var _id = _xmppSearchPerson[1];
        function _onSearchPersonCallBack(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            if (_result == true) {
                var _personElem = Utils.getChildXmlElement(responceXmlRootElem,
                                                           'person');
                if (_personElem == null) {
                    _log.connectionLog(3, '_personElem is null - '
                                        + responceXmlRootElem.toString());
                    onSearchPersonCallBackFunc(false,
                                               ERROR_REASON_PARSE_RESPONSE_XMPP, _extras, 0,
                                               _items);
                    return;
                }
                var _contentElem = Utils.getChildXmlElement(_personElem,
                                                            'content');
                if (_contentElem == null) {
                    _log.connectionLog(3, '_contentElem is null - '
                                        + _personElem.toString());
                    onSearchPersonCallBackFunc(false,
                                               ERROR_REASON_PARSE_RESPONSE_XMPP, _extras, 0,
                                               _items);
                    return;
                }
                var _extras = _getSearchPersonExtrasFromContentElem(_contentElem);
                var _items = _getPersonItemsFromContentElem(_contentElem);
                var _count = _items.length;
                var _jidList = new Array();
                for ( var _i = 0; _i < _count; _i++) {
                    _jidList[_i] = _items[_i].jid;
                }
                UserAccountUtils.getLoginAccountListByJidList(_jidList,
                                                              _onGetUserAccountDataCallBack);
            } else {
                var _result = false;
                var _reason = ERROR_REASON_XMPP_SERVER;
                onSearchPersonCallBackFunc(_result, _reason, _extras, 0, _items);
            }

            function _onGetUserAccountDataCallBack(mapData) {
                var _loginAccountMapData = mapData;
                for ( var _i = 0; _i < _count; _i++) {
                    if (_loginAccountMapData) {
                        _items[_i].userName = _loginAccountMapData[_items[_i].jid];
                    }
                }
                onSearchPersonCallBackFunc(_result, _reason, _extras, _count, _items);
            }
        }
        _sessionData.setCallback(_id, _onSearchPersonCallBack);
        _xsConn.send(_xmppStr);

        return true;
    };
    function _getSearchPersonExtrasFromContentElem(contentElem) {
        var _extras = {};
        var _extrasElem = Utils.getChildXmlElement(contentElem, 'extras');
        if (_extrasElem == null) {
            _log.connectionLog(3, '_extrasElem is null - '
                                + contentElem.toString());
            return _extras;
        }
        var _allItemCountElem = Utils.getChildXmlElement(_extrasElem,
                                                         'all_item_count');
        var _allItemCount = 0;
        if (_allItemCountElem != null) {
            var _allItemCountStr = _allItemCountElem.text();
            _allItemCount = parseInt(_allItemCountStr);
        }
        _extras = {
            allItemCount : _allItemCount
        };
        return _extras;
    }

    function _getPersonItemsFromContentElem(contentElem) {
        var _itemsArray = [];
        var _itemsElem = Utils.getChildXmlElement(contentElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is null - '
                                + contentElem.toString());
            return _itemsArray;
        }
        var _itemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        _itemsArray = _getPersonItemsFromElementArray(_itemArray);
        return _itemsArray;
    }

    function _getPersonItemsFromElementArray(elementArray) {
        var _itemsArray = [];
        if (elementArray == null) {
            _log.connectionLog(3, 'elementArray is null - ');
            return _itemsArray;
        }
        var _itemCount = elementArray.length;
        for( var _i = 0; _i < _itemCount; _i++){
            var _itemElem = elementArray[_i];
            var _item = _getPersonItemFromElement(_itemElem);
            _itemsArray[_i] = _item;
        }
        return _itemsArray;
    }

    function _getPersonItemFromElement(element){
        var _ret = null;
        if (element == null) {
            _log.connectionLog(3, 'element is null - ');
            return null;
        }
        var _idElem = Utils.getChildXmlElement(element, 'id');
        var _id = -1;
        if (_idElem != null) {
            var _idStr = _idElem.text();
            _id = parseInt(_idStr);
        }
        var _jidElem = Utils.getChildXmlElement(element, 'jid');
        var _jid = '';
        if (_jidElem != null) {
            _jid = _jidElem.text();
        }
        var _subscriptionElem = Utils.getChildXmlElement(element,
                                                         'subscription');
        var _subscription = '';
        if (_subscriptionElem != null) {
            _subscription = _subscriptionElem.text();
        }
        var _groupsElem = Utils.getChildXmlElement(element, 'groups');
        var _gropArray = Utils.getChildXmlElementArray(_groupsElem,
                                                       'group');
        var _groupCount = 0;
        var _groupItems = [];
        if (_gropArray != null) {
            _groupCount = _gropArray.length;
            for ( var _j = 0; _j < _groupCount; _j++) {
                var _groupElem = _gropArray[_j];
                _groupItems[_j] = _groupElem.text();
            }
        }
        var _nickNameElem = Utils.getChildXmlElement(element,
                                                     'nickname');
        var _nickName = '';
        if (_nickNameElem != null) {
            _nickName = _nickNameElem.text();
        }
        var _avatarTypeElem = Utils.getChildXmlElement(element,
                                                       'avatartype');
        var _avatarType = '';
        if (_avatarTypeElem != null) {
            _avatarType = _avatarTypeElem.text();
        }
        var _avatarDataElem = Utils.getChildXmlElement(element,
                                                       'avatardata');
        var _avatarData = '';
        if (_avatarDataElem != null) {
            _avatarData = _avatarDataElem.text();
        }
        var _presenceElem = Utils.getChildXmlElement(element,
                                                     'presence');
        var _presence = 0;
        if (_presenceElem != null) {
            var _presenceStr = _presenceElem.text();
            _presence = parseInt(_presenceStr);
        }
        var _myMemoElem = Utils.getChildXmlElement(element, 'mymemo');
        var _myMemo = '';
        if (_myMemoElem != null) {
            _myMemo = _myMemoElem.text();
        }
        var _statusElem = Utils.getChildXmlElement(element, 'status');
        var _status = 0;
        if (_statusElem != null) {
            var _statusStr = _statusElem.text();
            _status = parseInt(_statusStr);
        }


        _ret = {
            id : _id,
            jid : _jid,
            subscription : _subscription,
            groupCount : _groupCount,
            groupItems : _groupItems,
            nickName : _nickName,
            avatarType : _avatarType,
            avatarData : _avatarData,
            presence : _presence,
            myMemo : _myMemo,
            status : _status
        };
        return _ret;
    }

    _proto.setLoginPersonData = function(accessToken, requestData,
                                         onSetLoginPersonDataCallBackFunc) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onSetLoginPersonDataCallBackFunc != null
            && typeof onSetLoginPersonDataCallBackFunc != 'function') {
            _log
                .connectionLog(3,
                               'onSetLoginPersonDataCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _avatarDataFileList = new Array();
        var _xmppSetLoginPersonData = null;
        var _type = requestData.type;
        var _sendFileType = requestData.avatarType; 
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _tenantUuid = _sessionData.getTenantUuid();
        switch (_type) {
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PRESENCE:
            var _presence = requestData.presence;
            var _myMemo = requestData.myMemo;
            _xmppSetLoginPersonData = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createUpdatePresence(_presence,_myMemo);
            });
            break;
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE:
            if (requestData.avatarType != '') {
                var _imageFileUtils = ImageFileUtils.getInstance();
                _avatarDataFileList = _imageFileUtils.getUserFilePathList(
                        _tenantUuid, _sessionData.getJid(), ImageFileUtils.USE_TYPE_AVATER,
                        ImageFileUtils.PREFIX_ORIGINAL);
                var _imagePath = '';
                if (requestData.avatarType != RequestData.SET_LOGIN_PERSON_DATA_AVATAR_TYPE_IMAGEPATH) {
                    _imagePath = _imageFileUtils.createUserFile(_tenantUuid, _sessionData
                            .getJid(), requestData.avatarType,
                                                                    requestData.avatarData,
                                                                    ImageFileUtils.USE_TYPE_AVATER,
                                                                    ImageFileUtils.PREFIX_ORIGINAL);
                } else {
                    _imagePath = requestData.avatarData;
                }
                if (_imagePath == null || _imagePath == '') {
                    setTimeout(function() {
                        var _result = false;
                        var _reason = ERROR_CREATE_AVATAR_IMAGE;
                        onSetLoginPersonDataCallBackFunc(_result, _reason);
                    }, 1);
                    return false;
                }
                requestData.avatarType = RequestData.SET_LOGIN_PERSON_DATA_AVATAR_TYPE_IMAGEPATH;
                requestData.avatarData = _imagePath;
            }
            if (requestData.extras != null && requestData.extras != '') {
                var _extraMaxBytes = _conf.getConfData('USER_PROFILE_EXTRAS_DATA_MAX_BYTE', '20971520');
                if (_extraMaxBytes == null || typeof _extraMaxBytes != 'string' || isNaN(Number(_extraMaxBytes))) {
                    _extraMaxBytes = 20971520;
                }
                var _extraBytes = encodeURIComponent(requestData.extras).replace(/%../g, "x").length;
                if (_extraBytes > _extraMaxBytes) {
                    _log.connectionLog(4, 'extras key is over USER_PROFILE_EXTRAS_DATA_MAX_BYTE');
                    var _result = false;
                    var _reason = ERROR_REASON_ERROR_PARAM;
                    onSetLoginPersonDataCallBackFunc(_result, _reason);
                    return true;
                }
                var _jsonCheck = '';
                try {
                    _jsonCheck = JSON.parse(requestData.extras);
                } catch (e){
                    _log.connectionLog(4, 'extras is not json');
                    var _result = false;
                    var _reason = ERROR_REASON_ERROR_PARAM;
                    onSetLoginPersonDataCallBackFunc(_result, _reason);
                    return true;
                }
                requestData.extras = encodeURIComponent(requestData.extras);
            }
            if(!Validation.affiliationCheck(requestData.group, false)){
                return false
            }
            _xmppSetLoginPersonData = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createUpdateVcardInformationXmpp(requestData);
            });
            break;
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PASSWORD:
            _xmppSetLoginPersonData = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createChangePasswordXmpp(
                        _xmppServerHostName, _sessionData.getUserName(), requestData.newPassword);
            });
            break;
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_MAIL_COOPERATION_SETTING:
            _xmppSetLoginPersonData = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createSetMailCooperationSettings(
                        _xmppServerHostName, _sessionData.getJid(), requestData);
            });
            break;
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_REGISTER_DEVICE_INFO:
            var _deviceId = requestData.deviceId;
            var _notificationService = requestData.notificationService;
            var _result = false;
            var _reason = ERROR_REASON_ERROR_PARAM;
            if (_deviceId == null || typeof _deviceId != 'string'
                    || _deviceId == "") {
                _log.connectionLog(4, 'deviceId is invalid');
                if (onSetLoginPersonDataCallBackFunc != null) {
                    setTimeout(function() {
                        onSetLoginPersonDataCallBackFunc(_result, _reason);
                    }, 1);
                }
                return false;
            }
            if (_notificationService == null
                    || typeof _notificationService != 'number') {
                _log.connectionLog(4, 'notificationService is invalid');
                if (onSetLoginPersonDataCallBackFunc != null) {
                    setTimeout(function() {
                        onSetLoginPersonDataCallBackFunc(_result, _reason);
                    }, 1);
                }
                return false;
            }
            _xmppSetLoginPersonData = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createRegisterDeviceInfoXmpp(
                        _xmppServerHostName, _sessionData.getJid(), _deviceId, _notificationService);
            });
            _log.connectionLog(6, 'RegisterDeviceInfo request will be proceeded: '
                                    + _notificationService + ', '
                                    + _deviceId + ', '
                                    + _sessionData.getJid()
                );
            break;
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_DELETE_DEVICE_INFO:
            var _deviceId = requestData.deviceId;
            var _result = false;
            var _reason = ERROR_REASON_ERROR_PARAM;
            if (_deviceId == null || typeof _deviceId != 'string'
                    || _deviceId == "") {
                _log.connectionLog(4, 'deviceId is invalid');
                if (onSetLoginPersonDataCallBackFunc != null) {
                    setTimeout(function() {
                        onSetLoginPersonDataCallBackFunc(_result, _reason);
                    }, 1);
                }
                return false;
            }
            _xmppSetLoginPersonData = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createDeleteDeviceInfoXmpp(
                        _xmppServerHostName, _sessionData.getJid(), _deviceId);
            });
            _log.connectionLog(6, 'DeleteDeviceInfo request will be proceeded: '
                                    + _deviceId + ', '
                                    + _sessionData.getJid()
                );
            break;
        default:
            break;
        }
        if (_xmppSetLoginPersonData == null) {
            _log.connectionLog(3, '_xmppSetLoginPersonData is null');
            return false;
        }
        var _xmppStr = _xmppSetLoginPersonData[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppSetLoginPersonData[0] is invalid');
            return false;
        }
        var _id = _xmppSetLoginPersonData[1];
        function _onSetLoginPersonDataCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            var _isResponse = true; 
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            if (_type == RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE) {
                var _imageFileUtils = ImageFileUtils.getInstance();
                var _ret = true;
                if (_result == true) {
                    for ( var _i = 0; _i < _avatarDataFileList.length; _i++) {
                        if (_avatarDataFileList[_i] == requestData.avatarData) {
                            continue;
                        }
                        _ret = _imageFileUtils
                            .deleteFile(_avatarDataFileList[_i]);
                    }
                } else {
                    if (_sendFileType != RequestData.SET_LOGIN_PERSON_DATA_AVATAR_TYPE_IMAGEPATH) {
                        _ret = _imageFileUtils
                            .deleteFile(requestData.avatarData);
                    }
                }
                if (!_ret) {
                    _log.connectionLog(3, 'delete file is failed');
                }
                if(_result && requestData.mailAddress != null) {
                    var _loginAccount = _sessionData.getLoginAccout();
                    var _updateRet = UserAccountUtils.updateUserAccountMailAddress(_tenantUuid, _loginAccount, requestData.mailAddress, _onUpdateUserAccountMailAddress);
                    if(_updateRet) {
                        _isResponse = false;
                    } else {
                        _result = false;
                        _reason = ERROR_REASON_DB_ACCESS_ERROR;
                    }
                }
            } else if (_type == RequestData.SET_LOGIN_PERSON_DATA_TYPE_REGISTER_DEVICE_INFO) {
                _log.connectionLog(6, 'RegisterDeviceInfo request has been proceeded: ' + _result);
            } else if (_type == RequestData.SET_LOGIN_PERSON_DATA_TYPE_DELETE_DEVICE_INFO) {
                _log.connectionLog(6, 'DeleteDeviceInfo request has been proceeded: ' + _result);
            }
            if (_type == RequestData.SET_LOGIN_PERSON_DATA_TYPE_PASSWORD) {
                if (_result == true) {
                    _sessionData.setPassword(Utils
                        .md5Hex(requestData.newPassword));
                }
            }
            if (onSetLoginPersonDataCallBackFunc == null) {
                return;
            }
            if(_isResponse) {
                if (_type == RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE && requestData.extras != null) {
                    var _responceData = getVCardDataFromOnGetVCard(responceXmlRootElem);
                    onSetLoginPersonDataCallBackFunc(_result, _reason, _responceData);
                } else if (_type == RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE && requestData.extras == null){
                    onSetLoginPersonDataCallBackFunc(_result, _reason, requestData);
                } else {
                    onSetLoginPersonDataCallBackFunc(_result, _reason);
                }
            }
            function _onUpdateUserAccountMailAddress(updateResult) {
                var _content = null;
                if(updateResult == true) {
                    _result = true;
                    _reason = DISCCONECT_REASON_NO;
                    var _responceData = getVCardDataFromOnGetVCard(responceXmlRootElem);
                    _responceData.mailAddress = requestData.mailAddress;
                    if (_type == RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE && requestData.extras != null) {
                        _content = _responceData;
                    } else{
                        _content = requestData;
                    }
                } else {
                    _result = false;
                    _reason = ERROR_REASON_DB_ACCESS_ERROR;
                }
                if (onSetLoginPersonDataCallBackFunc == null) {
                    return;
                }
                onSetLoginPersonDataCallBackFunc(_result, _reason, _content);
            }
        }
        _sessionData.setCallback(_id, _onSetLoginPersonDataCallback);
        _xsConn.send(_xmppStr);

        return true;
    };

    _proto.getMessage = function(accessToken, requestData,
                                 onGetMessageCallBackFunc) {
        _log.connectionLog(7, 'do func Synchronousbridgenodexmpp.getMessage(...');
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onGetMessageCallBackFunc == null
            || typeof onGetMessageCallBackFunc != 'function') {
            _log.connectionLog(3, 'onGetMessageCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _tenantUuid = _sessionData.getTenantUuid();
        var _xmppGetMessage = null;
        var _requestType = requestData.type;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        let isAnalizeAccsess = false;
        switch (_requestType) {
        case RequestData.GET_MESSAGE_TYPE_MY_FEED:
            var _fromJid = _sessionData.getJid();
            var _baseId = requestData.startId;
            var _count = requestData.count;
            if(requestData.analizeAccsess != undefined &&
               requestData.analizeAccsess != null &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != undefined &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != null &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != "" &&
               requestData.analizeAccsess == _conf._confData.ANALIZE_ACCSESS_PASSWORD){
                isAnalizeAccsess = true;
            }
            if (_baseId == null || _count == null) {
                _log.connectionLog(3, 'requestData is invalid');
                return false;
            }
            _xmppGetMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetMyFeedXmpp(_fromJid, _baseId, _count);
            });
            break;
        case RequestData.GET_MESSAGE_TYPE_CHAT:
            var _fromJid = _sessionData.getJid();
            var _baseId = requestData.startId;
            var _count = requestData.count;
            var _condition = requestData.condition;
            if(requestData.analizeAccsess != undefined &&
               requestData.analizeAccsess != null &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != undefined &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != null &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != "" &&
               requestData.analizeAccsess == _conf._confData.ANALIZE_ACCSESS_PASSWORD){
                isAnalizeAccsess = true;
            }
            if (_baseId == null || _count == null || _condition == null) {
                _log.connectionLog(3, 'requestData is invalid');
                return false;
            }
            var _partner = _condition.partner;
            if (_partner == null) {
                _log.connectionLog(3, 'partner data is invalid');
                return false;
            }
            _xmppGetMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetChatXmpp(_fromJid, _partner, _baseId, _count);
            });
            break;
        case RequestData.GET_MESSAGE_TYPE_TASK:
            var _fromJid = _sessionData.getJid();
            var _baseId = requestData.startId;
            var _count = requestData.count;
            var _condition = requestData.condition;
            if (_baseId == null || _count == null || _condition == null) {
                _log.connectionLog(3, 'requestData is invalid');
                return false;
            }
            var _filter = _condition.filter;
            var _sort = _condition.sort;
            if (_filter == null || _sort == null) {
                _log.connectionLog(3, 'filter or sort data is invalid');
                return false;
            }
            _xmppGetMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetTaskListXmpp(_fromJid, _baseId, _count, _filter, _sort);
            });
            break;
        case RequestData.GET_MESSAGE_TYPE_QUESTIONNAIRE:
            var _fromJid = _sessionData.getJid();
            var _baseId = requestData.startId;
            var _count = requestData.count;
            var _condition = requestData.condition;
            if (_baseId == null || _count == null || _condition == null) {
                _log.connectionLog(3, 'requestData is invalid');
                return false;
            }
            var _filter = _condition.filter;
            var _sort = _condition.sort;
            _xmppGetMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetQuestionnaireXmpp(_fromJid, _baseId, _count, _filter, _sort);
            });
            break;
        case RequestData.GET_MESSAGE_TYPE_SEARCH:
            var _fromJid = _sessionData.getJid();
            var _startId = requestData.startId;
            var _count = requestData.count;
            var _condition = requestData.condition;
            if(requestData.analizeAccsess != undefined &&
               requestData.analizeAccsess != null &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != undefined &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != null &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != "" &&
               requestData.analizeAccsess == _conf._confData.ANALIZE_ACCSESS_PASSWORD){
                isAnalizeAccsess = true;
            }
            if (_startId == null || _count == null || _condition == null) {
                _log.connectionLog(3, 'requestData is invalid');
                return false;
            }
            var _filter = _condition.filter;
            var _sort = _condition.sort;
            if (_filter == null || _sort == null) {
                _log.connectionLog(3, 'filter or sort data is invalid');
                return false;
            }
            _xmppGetMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createSearchMessageXmpp(_xmppServerHostName,
                                                        _fromJid, _startId, _count, _filter, _sort);
            });
            break;
        case RequestData.GET_MESSAGE_TYPE_SEARCH_ALL:
            var _fromJid = _sessionData.getJid();
            var _startId = requestData.startId;
            var _count = requestData.count;
            var _condition = requestData.condition;
            if (_startId == null || _count == null || _condition == null) {
                _log.connectionLog(3, 'requestData is invalid');
                return false;
            }
            var _filter = _condition.filter;
            var _sort = _condition.sort;
            if (_filter == null || _sort == null) {
                _log.connectionLog(3, 'filter or sort data is invalid');
                return false;
            }
            _xmppGetMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createSearchMessageForTypeXmpp(_xmppServerHostName,
                                                               _fromJid, _startId, _count, _filter, _sort, _requestType);
            });
            break;
        case RequestData.GET_MESSAGE_TYPE_MAIL_BODY:
            var _fromJid = _sessionData.getJid();
            var _itemId = requestData.itemId;
            if (_itemId == null) {
                _log.connectionLog(3, 'requestData is invalid');
                return false;
            }
            _xmppGetMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetMailBodyXmpp(_xmppServerHostName, _fromJid, _itemId);
            });
            break;
        case RequestData.GET_MESSAGE_TYPE_THREAD:
            var _fromJid = _sessionData.getJid();
            var _itemId = requestData.itemId;
            if (_itemId == null) {
                _log.connectionLog(3, 'requestData is invalid');
                return false;
            }
            if(requestData.analizeAccsess != undefined &&
               requestData.analizeAccsess != null &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != undefined &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != null &&
               _conf._confData.ANALIZE_ACCSESS_PASSWORD != "" &&
               requestData.analizeAccsess == _conf._confData.ANALIZE_ACCSESS_PASSWORD){
                isAnalizeAccsess = true;
            }
            _xmppGetMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetThreadMessageXmpp(_xmppServerHostName, _fromJid, _itemId);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppGetMessage == null) {
            _log.connectionLog(3, '_xmppGetMessage is null');
            return false;
        }
        var _xmppStr = _xmppGetMessage[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppGetMessage[0] is invalid');
            return false;
        }
        var _id = _xmppGetMessage[1];
        function _onGetMessageCallBack(responceXmlRootElem) {
            _log.connectionLog(7, 'do func Synchronousbridgenodexmpp.getMessage._onGetMessageCallBack(...');
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            if (_result == true) {
                var ret = _getMessageListExtras(_tenantUuid, responceXmlRootElem,
                                                _requestType, _onGetExtrasCallBack);
                if (!ret) {
                    _result = false;
                    _reason = ERROR_REASON_INNER;
                    onGetMessageCallBackFunc(_result, _reason, _extras, 0,
                                             _items);
                }
            } else {
                var _result = false;
                var _reason = ERROR_REASON_XMPP_SERVER;
                onGetMessageCallBackFunc(_result, _reason, _extras, 0, _items);
            }

            function _onGetExtrasCallBack(extras) {
                _extras = extras || _extras;
                var _ret = _onGetMessageList(_tenantUuid, responceXmlRootElem, _requestType,
                                             _onGetItems, isAnalizeAccsess);
                if (!_ret) {
                    _result = false;
                    _reason = ERROR_REASON_INNER;
                    onGetMessageCallBackFunc(_result, _reason, _extras, 0,
                                             _items);
                }
            }

            function _onGetItems(items) {
                _items = items;
                var _count = 0;
                if (_items == null) {
                    _result = false;
                    _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                    _items = [];
                } else {
                    _count = _items.length;
                }
                onGetMessageCallBackFunc(_result, _reason, _extras, _count,
                                         _items);
            }

        }
        _sessionData.setCallback(_id, _onGetMessageCallBack);
        _xsConn.send(_xmppStr);

        return true;

    };

    function _getMessageListExtras(tenantUuid, responceXmlRootElem, requestType,
                                   onGetMessageListExtras) {
        if (responceXmlRootElem == null
            || typeof responceXmlRootElem != 'object') {
            _log.connectionLog(3, 'responceXmlRootElem is invalid');
            return false;
        }
        if (requestType == null || typeof requestType != 'string') {
            _log.connectionLog(3, 'requestType is invalid');
            return false;
        }
        if (onGetMessageListExtras == null
            || typeof onGetMessageListExtras != 'function') {
            _log.connectionLog(3, 'onGetMessageListExtras is invalid');
            return false;
        }
        var _ret = {};
        var _childrenItemsElem = null;
        if (requestType != RequestData.GET_MESSAGE_TYPE_SEARCH &&
            requestType != RequestData.GET_MESSAGE_TYPE_SEARCH_ALL) {
            var _queryElem = Utils.getChildXmlElement(responceXmlRootElem,
                                                      'query');
            if (_queryElem == null) {
                _callback(null);
                return true;
            }
            var _exodusElem = Utils.getChildXmlElement(_queryElem, 'exodus');
            if (_exodusElem == null) {
                _callback(null);
                return true;
            }
            var _exodusNamespace = _exodusElem.namespace().href();
            if (_exodusNamespace == 'task_list') {
                var _itemsElem = Utils.getChildXmlElement(_exodusElem, 'items');
                if (_itemsElem != null) {
                    var _unfinishedTaskCountAttr = _itemsElem
                        .attr('unfinished_task_count');
                    if (_unfinishedTaskCountAttr != null) {
                        _ret.unfinishedTaskCount = parseInt(_unfinishedTaskCountAttr
                            .value());
                    }
                }
                _childrenItemsElem = Utils.getChildXmlElement(_exodusElem,
                                                              'children_items');
            }
        } else {
            var _messageElem = Utils.getChildXmlElement(responceXmlRootElem,
                                                        'message');
            if (_messageElem == null) {
                _callback(null);
                return true;
            }
            var _contentElem = Utils
                .getChildXmlElement(_messageElem, 'content');
            if (_contentElem == null) {
                _callback(null);
                return true;
            }
            var _extrasElem = Utils.getChildXmlElement(_contentElem, 'extras');
            if (_extrasElem == null) {
                _callback(null);
                return true;
            }
            var _allItemCountElem = Utils.getChildXmlElement(_extrasElem,
                                                             'all_item_count');
            if (_allItemCountElem != null) {
                _ret.allItemCount = parseInt(_allItemCountElem.text());
            }
            _childrenItemsElem = Utils.getChildXmlElement(_extrasElem,
                                                          'children_items');
        }
        return _getMessageListExtrasChildrenItems(tenantUuid, _childrenItemsElem, _callback);

        function _callback(childrenItems) {
            if (childrenItems != null) {
                _ret.childrenItems = childrenItems;
                _ret.childrenCount = childrenItems.length;
            }
            onGetMessageListExtras(_ret);
        }

    }

    function _getMessageListExtrasChildrenItems(tenantUuid, childrenItemsElem,
                                                onGetMessageListExtrasChildrenItemsCallBack) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp._getMessageListExtrasChildrenItems');
        if (onGetMessageListExtrasChildrenItemsCallBack == null
            || typeof onGetMessageListExtrasChildrenItemsCallBack != 'function') {
            _log
                .connectionLog(
                    3,
                    '_getMessageListExtrasChildrenItems :: onGetMessageListExtrasChildrenItemsCallBack is invalid');
            return false;
        }
        if (childrenItemsElem != null) {
            var _childrenItemArray = Utils.getChildXmlElementArray(
                childrenItemsElem, 'item');
            if (_childrenItemArray != null) {
                return _getMessageItemsFromMessageItemElementArray(
                    tenantUuid, _childrenItemArray, _callback);
            }
        } else {
            setTimeout(function() {
                onGetMessageListExtrasChildrenItemsCallBack(null);
            }, 0);
        }
        function _callback(itemsData) {
            onGetMessageListExtrasChildrenItemsCallBack(itemsData);
            return;
        }
        return true;
    }

    function _onGetMessageList(tenantUuid, responceXmlRootElem, requestType,
                               onGetMessageListCallBack, isAnalizeAccsess) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp._onGetMessageList');
        var _ret = false;
        var _itemsElem = null;
        if (requestType != RequestData.GET_MESSAGE_TYPE_SEARCH
            && requestType != RequestData.GET_MESSAGE_TYPE_SEARCH_ALL
            && requestType != RequestData.GET_MESSAGE_TYPE_MAIL_BODY
            && requestType != RequestData.GET_MESSAGE_TYPE_THREAD) {
            var _queryElem = Utils.getChildXmlElement(responceXmlRootElem,
                                                      'query');
            if (_queryElem == null) {
                _log.connectionLog(3,
                                   '_onGetMessageList :: _queryElem is invalid');
                return _ret;
            }
            var _exodusElem = Utils.getChildXmlElement(_queryElem, 'exodus');
            if (_exodusElem == null) {
                _log.connectionLog(3,
                                   '_onGetMessageList :: _exodusElem is invalid');
                return _ret;
            }
            _itemsElem = Utils.getChildXmlElement(_exodusElem, 'items');
        } else {
            var _messageElem = Utils.getChildXmlElement(responceXmlRootElem,
                                                        'message');
            if (_messageElem == null) {
                _log.connectionLog(3,
                                   '_onGetMessageList :: _messageElem is invalid');
                return _ret;
            }
            var _contentElem = Utils
                .getChildXmlElement(_messageElem, 'content');
            if (_contentElem == null) {
                _log.connectionLog(3,
                                   '_onGetMessageList :: _contentElem is invalid');
                return _ret;
            }
            _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        }
        if (_itemsElem == null) {
            _log.connectionLog(3, '_onGetMessageList :: _itemsElem is invalid');
            return _ret;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log.connectionLog(3,
                               '_onGetMessageList :: _itemElemArray is invalid');
            return _ret;
        }
        _ret = _getMessageList(_itemElemArray, requestType, _callback);
        return _ret;

        function _getMessageList(itemElemArray, requestType, onGetListCallBack) {
            _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._onGetMessageList._getMessageList(...");
            if (requestType == RequestData.GET_MESSAGE_TYPE_MAIL_BODY) {
                return _createMailBodyData(itemElemArray, onGetListCallBack);
            } else {
                return _getMessageItemsFromMessageItemElementArray(
                    tenantUuid, _itemElemArray, onGetListCallBack, isAnalizeAccsess);
            }
        }

        function _createMailBodyData(itemsArray, onCreateCallBack) {
            if (itemsArray == null) {
                return false;
            }
            if (onCreateCallBack == null
                || typeof onCreateCallBack != 'function') {
                return false;
            }
            setTimeout(function() {
                _createItems();
            }, 10);
            return true;

            function _createItems() {
                var _count = _itemElemArray.length;
                var _itemDataCount = 0;
                var _items = [];
                for ( var _i = 0; _i < _count; _i++) {
                    var _itemElem = _itemElemArray[_i];
                    var _itemData = null;
                    if (requestType == RequestData.GET_MESSAGE_TYPE_MAIL_BODY) {
                        _itemData = _getItemDataFromMailBodyItemElem(_itemElem);
                    }
                    if (_itemData == null) {
                        continue;
                    }
                    _items[_itemDataCount] = _itemData;
                    _itemDataCount++;
                }
                onCreateCallBack(_items);
            }
        }

        function _callback(itemsData) {
            onGetMessageListCallBack(itemsData);
            return;
        }
    }

    function _getMessageItemsFromMessageItemElementArray(tenantUuid, messegeItemsArray,
                                                         onGetMessageItemsCallBack, isAnalizeAccsess) {
        _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getMessageItemsFromMessageItemElementArray");
        if (messegeItemsArray == null) {
            _log
                .connectionLog(3,
                               '_getMessageItemsFromMessageItemElementArray :: messegeItemsArray is invalid');
            return false;
        }
        if (onGetMessageItemsCallBack == null
            || typeof onGetMessageItemsCallBack != 'function') {
            _log
                .connectionLog(
                    3,
                    '_getMessageItemsFromMessageItemElementArray :: onGetMessageItemsCallBack is invalid');
            return false;
        }
        var _count = messegeItemsArray.length;
        var _itemDataCount = 0;
        var _itemsData = [];

        function _createMessageItemsData() {
            _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getMessageItemsFromMessageItemElementArray._createMessageItemsData(...");
            if (_itemDataCount >= _count) {
                setTimeout(function() {
                    onGetMessageItemsCallBack(_itemsData);
                }, 0);
                return;
            }
            var _itemElem = messegeItemsArray[_itemDataCount];
            var _ret = _getItemDataFromMessageItemElem(tenantUuid, _itemElem, _callback, isAnalizeAccsess);
            if (!_ret) {
                _itemDataCount++;
                _createMessageItemsData();
            }

            function _callback(itemData) {
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getMessageItemsFromMessageItemElementArray._createMessageItemsData._callback(");
                if (itemData != null) {
                    _itemsData.push(itemData);
                }
                _itemDataCount++;
                _createMessageItemsData();
            }
        }
        setTimeout(function() {
            _createMessageItemsData();
        }, 0);
        return true;
    }


    function _getItemDataFromMessageItemElem(tenantUuid, itemElem, onGetItemDataCallBack, isAnalizeAccsess) {
        _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem");
        if(isAnalizeAccsess == undefined ||
           isAnalizeAccsess == null ||
           isAnalizeAccsess == ""){
            isAnalizeAccsess = false;
        }
        if (itemElem == null) {
            _log.connectionLog(3,
                               '_getItemDataFromMessageItemElem :: itemElem is invalid');
            return false;
        }
        if (onGetItemDataCallBack == null
            || typeof onGetItemDataCallBack != 'function') {
            _log
                .connectionLog(3,
                               '_getItemDataFromMessageItemElem :: onGetItemDataCallBack is invalid');
            return false;
        }
        var _itemElem = itemElem;
        var _itemData = {};

        function _createItem() {
            _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem(...");
            var _idElem = Utils.getChildXmlElement(_itemElem, 'id');
            if (_idElem == null) {
                _log.connectionLog(7, 'Message : id');
                return false;
            }
            _itemData.id = parseInt(_idElem.text());
            var _itemIdElem = Utils.getChildXmlElement(_itemElem, 'item_id');
            if (_itemIdElem == null) {
                _log.connectionLog(7, 'Message : itemId');
                return false;
            }
            _itemData.itemId = _itemIdElem.text();
            var _fromElem = Utils.getChildXmlElement(_itemElem, 'msgfrom');
            if (_fromElem != null) {
                _itemData.from = _fromElem.text();
            }
            var _toElem = Utils.getChildXmlElement(_itemElem, 'msgto');
            if (_toElem != null) {
                _itemData.to = _toElem.text();
            }
            var _typeElem = Utils.getChildXmlElement(_itemElem, 'msgtype');
            if (_typeElem == null) {
                _log.connectionLog(7, 'Message : type');
                return false;
            }
            _itemData.type = parseInt(_typeElem.text());

            var _roomNameElem = Utils.getChildXmlElement(_itemElem, 'roomname');
            if (_roomNameElem != null) {
                _itemData.roomName = _roomNameElem.text();
            }

            var _roomTypeElem = Utils.getChildXmlElement(_itemElem, 'roomType');
            if (_roomTypeElem != null) {
                _itemData.roomType = _roomTypeElem.text();
            }

            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomId');
            if (_roomIdElem != null) {
                _itemData.roomId = _roomIdElem.text();
            }

            var _roomNameElem = Utils.getChildXmlElement(_itemElem, 'roomName');
            if (_roomNameElem != null) {
                _itemData.roomName = _roomNameElem.text();
            }

            var _voteFlagElem = Utils.getChildXmlElement(_itemElem, 'voteFlag');
            if (_voteFlagElem != null) {
                _itemData.voteFlag = parseInt(_voteFlagElem.text(), 10);
            }

            var _inputTypeElem = Utils.getChildXmlElement(_itemElem, 'inputType');
            if (_inputTypeElem != null) {
                _itemData.inputType = parseInt(_inputTypeElem.text(), 10);
            }
            var _resultVisibleElem = Utils.getChildXmlElement(_itemElem, 'resultVisible');
            if (_resultVisibleElem != null) {
                _itemData.resultVisible = parseInt(_resultVisibleElem.text(),10);
            }
            var _graphTypeElem = Utils.getChildXmlElement(_itemElem, 'graphType');
            if (_graphTypeElem != null) {
                _itemData.graphType = parseInt(_graphTypeElem.text(), 10);
            }
            var _optionCountElem = Utils.getChildXmlElement(_itemElem, 'optionCount');
            if (_optionCountElem != null) {
                _itemData.optionCount = _optionCountElem.text();
            }
            var _optionItemsElem = Utils.getChildXmlElement(_itemElem, 'optionItems');
            if(_optionItemsElem !=null){
                var _optionItemsElemElemArray  = Utils.getChildXmlElementArray(_optionItemsElem, 'optionItem');
                _itemData.optionCount = 0;
                _itemData.optionItems = [];

                if(_optionItemsElemElemArray != null){
                    _itemData.optionCount = _optionItemsElemElemArray.length;
                    for(var _j = 0; _j < _itemData.optionCount; _j++) {
                        var _optionItemElem = _optionItemsElemElemArray[_j];
                        var _optionItemData = {};
                        var _optionIdAttr = Utils.getChildXmlElement(_optionItemElem, 'optionId');
                        if(_optionIdAttr != null) {
                            _optionItemData.optionId = _optionIdAttr.text();
                        }
                        var _optionAttr = Utils.getChildXmlElement(_optionItemElem, 'option');
                        if(_optionAttr != null) {
                            _optionItemData.option = _optionAttr.text();
                        }
                        var _optionValueAttr = Utils.getChildXmlElement(_optionItemElem, 'optionValue');
                        if(_optionAttr != null) {
                            _optionItemData.optionValue = parseInt(_optionValueAttr.text(), 10);
                        }
                        _itemData.optionItems[_j] = _optionItemData;
                    }
                }
            }

            if(_itemData.type == 3 ||
               _itemData.type == 10){
                var _parentRoomIdElem = Utils.getChildXmlElement(_itemElem, 'parentroomid');
                if (_parentRoomIdElem != null) {
                    _itemData.parentRoomId = _parentRoomIdElem.text();
                }

                var _privacyTypeElem = Utils.getChildXmlElement(_itemElem, 'privacytype');
                if (_privacyTypeElem != null) {
                    _itemData.privacyType = parseInt(_privacyTypeElem.text());
                }
            }
            var _entryElem = Utils.getChildXmlElement(_itemElem, 'entry');
            if (_entryElem != null) {
                var _titleElem = Utils.getChildXmlElement(_entryElem, 'title');
                if (_titleElem != null) {
                    _itemData.title = _titleElem.text();
                }
                var _bodyElem = Utils.getChildXmlElement(_entryElem, 'body');
                if (_bodyElem != null) {
                    _itemData.body = _bodyElem.text();
                }
                var _triggerActionElem = Utils.getChildXmlElement(_entryElem,
                                                                  'trigger_action');
                if (_triggerActionElem != null) {
                    _itemData.triggerAction = parseInt(_triggerActionElem
                        .text());
                }
                var _progressElem = Utils.getChildXmlElement(_entryElem,
                                                             'progress');
                if (_progressElem != null) {
                    _itemData.progress = parseInt(_progressElem.text());
                }
                var _spentTimeElem = Utils.getChildXmlElement(_entryElem,
                                                              'spent_time');
                if (_spentTimeElem != null) {
                    _itemData.spentTime = parseInt(_spentTimeElem.text());
                }
                var _estimatedTimeElem = Utils.getChildXmlElement(_entryElem,
                                                                  'estimated_time');
                if (_estimatedTimeElem != null) {
                    _itemData.estimatedTime = parseInt(_estimatedTimeElem
                        .text());
                }
                var _remainingTimeElem = Utils.getChildXmlElement(_entryElem,
                                                                  'remaining_time');
                if (_remainingTimeElem != null) {
                    _itemData.remainingTime = parseInt(_remainingTimeElem
                        .text());
                }
                var _goalElem = Utils.getChildXmlElement(_entryElem, 'goal');
                if (_goalElem != null) {
                    _itemData.goal = _goalElem.text();
                }
                var _alertElem = Utils.getChildXmlElement(_entryElem, 'alert');
                if (_alertElem != null) {
                    _itemData.alert = parseInt(_alertElem.text());
                }
            }
            var _bodyTypeElem = Utils.getChildXmlElement(_itemElem,
                                                         'body_type');
            if (_bodyTypeElem != null) {
                _itemData.bodyType = parseInt(_bodyTypeElem.text());
            }
            var _nodeNameElem = Utils.getChildXmlElement(_itemElem,
                                                         'publish_nodename');
            if (_nodeNameElem != null) {
                _itemData.nodeName = _nodeNameElem.text();
            }
            var _parentItemIdElem = Utils.getChildXmlElement(_itemElem,
                                                             'parent_item_id');
            if (_parentItemIdElem != null) {
                _itemData.parentItemId = _parentItemIdElem.text();
            }
            var _priorityElem = Utils.getChildXmlElement(_itemElem, 'priority');
            if (_priorityElem != null) {
                _itemData.priority = parseInt(_priorityElem.text());
            }
            var _createdAtElem = Utils.getChildXmlElement(_itemElem,
                                                          'created_at');
            if (_createdAtElem != null) {
                _itemData.createdAt = _createdAtElem.text();
            }
            var _replyIdElem = Utils.getChildXmlElement(_itemElem, 'reply_id');
            if (_replyIdElem != null) {
                _itemData.replyId = _replyIdElem.text();
            }
            var _replyToElem = Utils.getChildXmlElement(_itemElem, 'reply_to');
            if (_replyToElem != null) {
                _itemData.replyTo = _replyToElem.text();
            }
            var _threadTitleElem = Utils.getChildXmlElement(_itemElem, 'thread_title');
            if (_threadTitleElem != null) {
                _itemData.threadTitle = _threadTitleElem.text();
            }
            var _threadRootIdElem = Utils.getChildXmlElement(_itemElem, 'thread_root_id');
            if (_threadRootIdElem != null) {
                _itemData.threadRootId = _threadRootIdElem.text();
            }
            var _startDateElem = Utils.getChildXmlElement(_itemElem,
                                                          'start_date');
            if (_startDateElem != null) {
                _itemData.startDate = _startDateElem.text();
            }
            var _dueDateElem = Utils.getChildXmlElement(_itemElem, 'due_date');
            if (_dueDateElem != null) {
                _itemData.dueDate = _dueDateElem.text();
            }
            var _completeDateElem = Utils.getChildXmlElement(_itemElem,
                                                             'complete_date');
            if (_completeDateElem != null) {
                _itemData.completeDate = _completeDateElem.text();
            }
            var _ownerElem = Utils.getChildXmlElement(_itemElem, 'owner');
            if (_ownerElem != null) {
                _itemData.owner = _ownerElem.text();
            }
            var _groupElem = Utils.getChildXmlElement(_itemElem, 'group');
            if (_groupElem != null) {
                _itemData.group = _groupElem.text();
            }
            var _groupNameElem = Utils.getChildXmlElement(_itemElem,
                                                          'groupname');
            if (_groupNameElem != null) {
                _itemData.groupName = _groupNameElem.text();
            }
            var _columnNameElem = Utils.getChildXmlElement(_itemElem,
                                                          'column_name');
            if (_columnNameElem != null) {
                _itemData.columnName = _columnNameElem.text();
            }
            var _clientElem = Utils.getChildXmlElement(_itemElem, 'client');
            if (_clientElem != null) {
                _itemData.client = _clientElem.text();
            }
            var _statusElem = Utils.getChildXmlElement(_itemElem, 'status');
            if (_statusElem != null) {
                _itemData.status = parseInt(_statusElem.text());
            }
            var _updatedAtElem = Utils.getChildXmlElement(_itemElem,
                                                          'updated_at');
            if (_updatedAtElem != null) {
                _itemData.updatedAt = _updatedAtElem.text();
            }
            var _updatedByElem = Utils.getChildXmlElement(_itemElem,
                                                          'updated_by');
            if (_updatedByElem != null) {
                _itemData.updatedBy = _updatedByElem.text();
            }
            var _mailMessageIdElem = Utils.getChildXmlElement(_itemElem,
                                                              'mail_message_id');
            if (_mailMessageIdElem != null) {
                _itemData.mailMessageId = _mailMessageIdElem.text();
            }
            var _mailInReplyToElem = Utils.getChildXmlElement(_itemElem,
                                                              'mail_in_reply_to');
            if (_mailInReplyToElem != null) {
                _itemData.mailInReplyTo = _mailInReplyToElem.text();
            }
            var _deleteFlagElem = Utils.getChildXmlElement(_itemElem,
                                                           'delete_flag');
            if (_deleteFlagElem != null) {
                _itemData.deleteFlag = parseInt(_deleteFlagElem.text());
            }
            var _noteElem = Utils.getChildXmlElement(_itemElem, 'note');
            if (_noteElem != null) {
                var _noteItemElemArray = Utils.getChildXmlElementArray(
                    _noteElem, 'item');
                _itemData.noteCount = 0;
                _itemData.noteItems = [];
                if (_noteItemElemArray != null) {
                    _itemData.noteCount = _noteItemElemArray.length;
                    for ( var _j = 0; _j < _itemData.noteCount; _j++) {
                        var _noteItemElem = _noteItemElemArray[_j];
                        var _noteData = {};
                        var _noteSenderJidAttr = _noteItemElem
                            .attr('senderjid');
                        if (_noteSenderJidAttr != null) {
                            _noteData.senderJid = _noteSenderJidAttr.value();
                        }
                        var _noteDateAttr = _noteItemElem.attr('date');
                        if (_noteDateAttr != null) {
                            _noteData.date = _noteDateAttr.value();
                        }
                        _noteData.body = _noteItemElem.text();
                        _itemData.noteItems[_j] = _noteData;
                    }
                }
            }

            var _reminderElem = Utils.getChildXmlElement(_itemElem, 'reminder');
            if (_reminderElem != null) {
                var _remingerItemElemArray = Utils.getChildXmlElementArray(
                    _reminderElem, 'item');
                _itemData.reminderCount = 0;
                _itemData.reminderItems = [];
                if (_remingerItemElemArray != null) {
                    _itemData.reminderCount = _remingerItemElemArray.length;
                    for ( var _j = 0; _j < _itemData.reminderCount; _j++) {
                        var _reminderItemElem = _remingerItemElemArray[_j];
                        _itemData.reminderItems[_j] = _reminderItemElem.text(); 
                    }
                }
            }

            var _attachedElem = Utils.getChildXmlElement(_itemElem,
                                                         'attached_items');
            if (_attachedElem != null) {
                var _attachedItemElemArray = Utils.getChildXmlElementArray(
                    _attachedElem, 'item');
                _itemData.attachedCount = 0;
                _itemData.attachedItems = [];
                if (_attachedItemElemArray != null) {
                    _itemData.attachedCount = _attachedItemElemArray.length;
                    for ( var _j = 0; _j < _itemData.attachedCount; _j++) {
                        var _attachedItemElem = _attachedItemElemArray[_j];
                        _itemData.attachedItems[_j] = _attachedItemElem.text();
                    }
                }
            }

            var _contextElem = Utils.getChildXmlElement(_itemElem, 'context');
            if (_contextElem != null) {
                _itemData.context = _contextElem.text();
            }

            var _demandStatusElem = Utils.getChildXmlElement(_itemElem,
                                                             'demand_status');
            if (_demandStatusElem != null) {
                _itemData.demandStatus = parseInt(_demandStatusElem.text());
            }

            var _demandDateElem = Utils.getChildXmlElement(_itemElem,
                                                           'demand_date');
            if (_demandDateElem != null) {
                _itemData.demandDate = _demandDateElem.text();
            }

            if(_itemData.type == MESSAGE_TYPE_PUBLIC_ID ||
               _itemData.type == MESSAGE_TYPE_CHAT_ID ||
               _itemData.type == MESSAGE_TYPE_GROUP_CHAT_ID ||
               (_itemData.type == MESSAGE_TYPE_TASK_ID && _itemData.status && _itemData.status == 1)||
               _itemData.type == MESSAGE_TYPE_COMMUNITY_ID ||
               _itemData.type == MESSAGE_TYPE_MURMUR_ID ){
                const _quotationElem = Utils.getChildXmlElement(_itemElem,'quotation');
                const _quotationItemIdElem = Utils.getChildXmlElement(_quotationElem,'quotation_item_id');
                let _quotationJson = {};
                if(_quotationElem != null &&
                   _quotationItemIdElem != undefined &&
                   _quotationItemIdElem != null &&
                   _quotationItemIdElem.text() != ""){
                    const _idElem = Utils.getChildXmlElement(_quotationElem,'id');
                    if(_idElem != null){
                        _quotationJson.id = parseInt(_idElem.text());
                    }
                    _quotationJson.shareItemId = "";
                    const _msgtypeElem = Utils.getChildXmlElement(_quotationElem,'msgtype');
                    if(_msgtypeElem != null){
                        _quotationJson.msgtype = parseInt(_msgtypeElem.text());
                    }
                    const _entryElem = Utils.getChildXmlElement(_quotationElem,'entry');
                    const _bodyElem = Utils.getChildXmlElement(_entryElem,'body');
                    if(_bodyElem != null){
                        _quotationJson.body = _bodyElem.text();
                    }
                    const _createdAtElem = Utils.getChildXmlElement(_quotationElem,'created_at');
                    if( _createdAtElem != null){
                        _quotationJson.createdAt = _createdAtElem.text();
                    }
                    const _updatedAtElem = Utils.getChildXmlElement(_quotationElem,'updated_at');
                    if(_updatedAtElem != null){
                        _quotationJson.updatedAt = _updatedAtElem.text();
                    }

                    let isPublicFlg = false;
                    const _msgfromElem = Utils.getChildXmlElement(_quotationElem,'msgfrom');
                    const _userNameElem = Utils.getChildXmlElement(_quotationElem,'user_name');
                    const _privateFlagElem = Utils.getChildXmlElement(_quotationElem,'private_flag');
                    if(_privateFlagElem != null &&
                       _privateFlagElem.text() == "0"){
                        isPublicFlg = true;
                    }
                    if(isAnalizeAccsess){
                        isPublicFlg = true;
                    }

                    if(isPublicFlg && _quotationItemIdElem != null){
                        _quotationJson.shareItemId = _quotationItemIdElem.text();
                    }
                    if(isPublicFlg && _msgfromElem != null){
                        _quotationJson.msgfrom = _msgfromElem.text();
                    }
                    const _msgtoElem = Utils.getChildXmlElement(_quotationElem,'msgto');
                    if(isPublicFlg &&
                       _msgtypeElem != null &&
                       (
                           _msgtypeElem.text() == MESSAGE_TYPE_GROUP_CHAT_ID ||
                           _msgtypeElem.text() == MESSAGE_TYPE_COMMUNITY_ID
                       ) &&
                       _msgtoElem != null){
                        _quotationJson.roomId = _msgtoElem.text();
                    }else{
                        _quotationJson.roomId = "";
                    }

                    _quotationJson["personInfo"] = {};
                    if(isPublicFlg){
                        const msgfrom = _msgfromElem.text();
                        _quotationJson["personInfo"][msgfrom] = {};
                        if(_userNameElem != null && _userNameElem.text().length > 4){
                            let _user_name = _userNameElem.text().substr(0, _userNameElem.text().length - 4);
                            _quotationJson["personInfo"][msgfrom]["userName"] = _user_name;
                        }else if(_userNameElem.text().length == 0){
                            _quotationJson["personInfo"][msgfrom]["userName"] = "";
                        }
                        const _nicknameElem = Utils.getChildXmlElement(_quotationElem,'nickname');
                        if(_nicknameElem != null){
                            _quotationJson["personInfo"][msgfrom]["nickName"] = _nicknameElem.text();
                        }
                        const _photoTypeElem = Utils.getChildXmlElement(_quotationElem,'photo_type');
                        if(_photoTypeElem != null){
                            _quotationJson["personInfo"][msgfrom]["avatarType"] = _photoTypeElem.text();
                        }
                        const _photoDataElem = Utils.getChildXmlElement(_quotationElem,'photo_data');
                        if(_photoDataElem != null){
                            _quotationJson["personInfo"][msgfrom]["avatarData"] = _photoDataElem.text();
                        }
                    }
                    if(_quotationJson.body != null){
                        _getShortenUrlInfo(_quotationJson, false);
                    }
                }
                _itemData.quotation = _quotationJson;
            }

            _getEmotionPointData();
            function _getEmotionPointData() {
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem._getEmotionPointData(...");
                let _emotionPointElem = Utils.getChildXmlElement(_itemElem, 'emotionpoint');
                if(_emotionPointElem != null) {
                    var _emotionPointItemElemArray = Utils.getChildXmlElementArray(_emotionPointElem, 'item');
                    _itemData.emotionPointCount = 0;
                    _itemData.emotionPointItems = [];
                    _itemData.emotionPointIcons = JSON.parse(EMOTION_POINT_BASIC_ICON);
                    if(_emotionPointItemElemArray != null) {
                        var _jidList = [];
                        _itemData.emotionPointCount = _emotionPointItemElemArray.length;
                        if(_itemData.emotionPointCount == 0) {
                            _onGetEmotionPoint();
                            return;
                        }
                        for(var _j = 0; _j < _itemData.emotionPointCount; _j++) {
                            var _emotionPointItemElem = _emotionPointItemElemArray[_j];
                            var _emotionPointData = {};
                            var _emotionPointEmotionPointAttr = _emotionPointItemElem.attr('emotion_point');
                            if(_emotionPointEmotionPointAttr != null) {
                                _emotionPointData.emotionPoint = parseInt(_emotionPointEmotionPointAttr.value());
                            }
                            var _emotionPointFromJidAttr = _emotionPointItemElem.attr('fromjid');
                            if(_emotionPointFromJidAttr != null) {
                                _emotionPointData.fromJid = _emotionPointFromJidAttr.value();
                            }
                            var _emotionPointFromNameAttr = _emotionPointItemElem.attr('fromname');
                            if(_emotionPointFromNameAttr != null) {
                                _emotionPointData.fromName = _emotionPointFromNameAttr.value();
                            }
                            var _emotionPointCreatedAtAttr = _emotionPointItemElem.attr('created_at');
                            if(_emotionPointCreatedAtAttr != null) {
                                _emotionPointData.createdAt = _emotionPointCreatedAtAttr.value();
                            }
                            var _emotionPointUpdatedAtAttr = _emotionPointItemElem.attr('updated_at');
                            if(_emotionPointUpdatedAtAttr != null) {
                                _emotionPointData.updatedAt = _emotionPointUpdatedAtAttr.value();
                            }
                            var _nickNameElem = Utils.getChildXmlElement(_emotionPointItemElem, 'nickname');
                            if(_nickNameElem != null) {
                                _emotionPointData.nickName = _nickNameElem.text();
                            }
                            var _avatarDataElem = Utils.getChildXmlElement(_emotionPointItemElem, 'avatardata');
                            if(_avatarDataElem != null) {
                                _emotionPointData.avatarData = _avatarDataElem.text();
                            }
                            var _avatarTypeElem = Utils.getChildXmlElement(_emotionPointItemElem, 'avatartype');
                            if(_avatarTypeElem != null) {
                                _emotionPointData.avatarType = _avatarTypeElem.text();
                            }
                            var _statusElem = Utils.getChildXmlElement(_emotionPointItemElem, 'status');
                            if(_statusElem != null) {
                                _emotionPointData.status = parseInt(_statusElem.text());
                            }
                            _jidList.push(_emotionPointData.fromJid);
                            _itemData.emotionPointItems[_j] = _emotionPointData;
                        }
                        if(_jidList.length > 0) {
                            UserAccountUtils.getLoginAccountListByJidList(_jidList, _onGetUserAccountDataCallBackForEmotionPoint);
                        } else {
                            _onGetEmotionPoint();
                            return;
                        }
                    }
                } else {
                    _onGetEmotionPoint();
                    return;
                }
                function _onGetUserAccountDataCallBackForEmotionPoint(mapData) {
                    var _itemCount = _itemData.emotionPointItems.length;
                    for(var _i = 0; _i < _itemCount; _i++) {
                        var _emotionPointData = _itemData.emotionPointItems[_i];
                        _emotionPointData.userName = mapData[_emotionPointData.fromJid];
                    }
                    _onGetEmotionPoint();
                }
                function _onGetEmotionPoint(){
                    if(_itemData.type == MESSAGE_TYPE_PUBLIC_ID ||
                       _itemData.type == MESSAGE_TYPE_CHAT_ID ||
                       _itemData.type == MESSAGE_TYPE_GROUP_CHAT_ID ||
                       _itemData.type == MESSAGE_TYPE_COMMUNITY_ID){
                        let _emotionPointIconJsonElem = Utils.getChildXmlElement(_itemElem,'emotion_point_icon');
                        try{
                            if(_emotionPointIconJsonElem == undefined ||
                               _emotionPointIconJsonElem == null ||
                               _emotionPointIconJsonElem.text() == "" ||
                               _emotionPointIconJsonElem.text() == "{}"){
                                _itemData.emotionPointIcons =
                                    JSON.parse(EMOTION_POINT_BASIC_ICON);
                            }else{
                                _itemData.emotionPointIcons =
                                    JSON.parse(_emotionPointIconJsonElem.text());
                            }
                        }catch(e){
                            _log.connectionLog(3, "SynchronousBridgeNodeXmpp._getEmotionPointItemsFromEmotionPointItemsXML _emotionPointIconElem json.parse error:" + e);
                            _itemData.emotionPointIcons = {};
                        }
                    }
                    _getGoodJobData();
                }
            }


            function _getGoodJobData() {
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem._getGoodJobData(...");
                var _goodJobElem = Utils.getChildXmlElement(_itemElem, 'goodjob');
                if(_goodJobElem != null) {
                    var _goodJobItemElemArray = Utils.getChildXmlElementArray(_goodJobElem, 'item');
                    _itemData.goodJobCount = 0;
                    _itemData.goodJobItems = [];

                    if(_goodJobItemElemArray != null) {
                        var _jidList = [];
                        _itemData.goodJobCount = _goodJobItemElemArray.length;
                        if(_itemData.goodJobCount == 0) {
                            _onGetGoodJob();
                            return;
                        }
                        for(var _j = 0; _j < _itemData.goodJobCount; _j++) {
                            var _goodJobItemElem = _goodJobItemElemArray[_j];
                            var _goodJobData = {};
                            var _goodJobFromJidAttr = _goodJobItemElem.attr('fromjid');
                            if(_goodJobFromJidAttr != null) {
                                _goodJobData.fromJid = _goodJobFromJidAttr.value();
                            }
                            var _goodJobFromNameAttr = _goodJobItemElem.attr('fromname');
                            if(_goodJobFromNameAttr != null) {
                                _goodJobData.fromName = _goodJobFromNameAttr.value();
                            }
                            var _goodJobDateAttr = _goodJobItemElem.attr('date');
                            if(_goodJobDateAttr != null) {
                                _goodJobData.date = _goodJobDateAttr.value();
                            }
                            var _nickNameElem = Utils.getChildXmlElement(_goodJobItemElem, 'nickname');
                            if(_nickNameElem != null) {
                                _goodJobData.nickName = _nickNameElem.text();
                            }
                            var _avatarDataElem = Utils.getChildXmlElement(_goodJobItemElem, 'avatardata');
                            if(_avatarDataElem != null) {
                                _goodJobData.avatarData = _avatarDataElem.text();
                            }
                            var _avatarTypeElem = Utils.getChildXmlElement(_goodJobItemElem, 'avatartype');
                            if(_avatarTypeElem != null) {
                                _goodJobData.avatarType = _avatarTypeElem.text();
                            }
                            var _statusElem = Utils.getChildXmlElement(_goodJobItemElem, 'status');
                            if(_statusElem != null) {
                                _goodJobData.status = parseInt(_statusElem.text());
                            }
                            _jidList.push(_goodJobData.fromJid);

                            _itemData.goodJobItems[_j] = _goodJobData;
                        }
                        if(_jidList.length > 0) {
                            UserAccountUtils.getLoginAccountListByJidList(_jidList, _onGetUserAccountDataCallBackForGoodJob);
                        } else {
                            _onGetGoodJob();
                            return;
                        }
                    }
                } else {
                    _onGetGoodJob();
                    return;
                }
                function _onGetUserAccountDataCallBackForGoodJob(mapData) {
                    var _itemCount = _itemData.goodJobItems.length;
                    for(var _i = 0; _i < _itemCount; _i++) {
                        var _goodJobData = _itemData.goodJobItems[_i];
                        _goodJobData.userName = mapData[_goodJobData.fromJid];
                    }
                    _onGetGoodJob();
                }
                function _onGetGoodJob(){
                    _getNoteData();
                }
            }

            function _getNoteData() {
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem._getNoteData(...");
                let _noteElem = Utils.getChildXmlElement(_itemElem, 'note_codimd');
                if(_noteElem != null) {
                    var _noteItemElemArray = Utils.getChildXmlElementArray(_noteElem, 'item');
                    _itemData.noteCount = 0;
                    _itemData.noteItems = [];
                    if(_noteItemElemArray != null) {
                        var _jidList = [];
                        _itemData.noteCount = _noteItemElemArray.length;
                        if(_itemData.noteCount == 0) {
                            _onGetNote();
                            return;
                        }
                        for(var _j = 0; _j < _itemData.noteCount; _j++) {
                            var _noteItemElem = _noteItemElemArray[_j];
                            var _noteData = {};
                            var _noteTitleAttr = _noteItemElem.attr('note_title');
                            if(_noteTitleAttr != null) {
                                _noteData.noteTitle = _noteTitleAttr.value();
                            }
                            var _noteUrlAttr = _noteItemElem.attr('note_url');
                            if(_noteUrlAttr != null) {
                                _noteData.noteUrl = _noteUrlAttr.value();
                            }
                            var _threadRoorIdAttr = _noteItemElem.attr('thread_root_id');
                            if(_threadRoorIdAttr != null) {
                                _noteData.threadRoorId = _threadRoorIdAttr.value();
                            }
                            var _ownJidAttr = _noteItemElem.attr('ownjid');
                            if(_ownJidAttr != null) {
                                _noteData.ownJid = _ownJidAttr.value();
                            }
                            var _noteCreatedAtAttr = _noteItemElem.attr('created_at');
                            if(_noteCreatedAtAttr != null) {
                                _noteData.createdAt = _noteCreatedAtAttr.value();
                            }
                            var _noteUpdatedAtAttr = _noteItemElem.attr('updated_at');
                            if(_noteUpdatedAtAttr != null) {
                                _noteData.updatedAt = _noteUpdatedAtAttr.value();
                            }
                            _jidList.push(_noteData.fromJid);
                            _itemData.noteItems[_j] = _noteData;
                        }
                        _onGetNote();
                        return;
                    }
                } else {
                    _onGetNote();
                    return;
                }
                function _onGetNote(){
                    _getSiblingItems();
                }
            }

            function _getSiblingItems() {
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem._getSiblingItems(...");
                doGetSibling = true;
                var _siblingElem = Utils.getChildXmlElement(_itemElem, 'sibling');
                if(_siblingElem != null) {
                    var _siblingItemElemArray = Utils.getChildXmlElementArray(_siblingElem, 'item');
                    _itemData.siblingCount = 0;
                    _itemData.siblingItems = [];
                    if(_siblingItemElemArray != null) {
                        _itemData.siblingCount = _siblingItemElemArray.length;
                        var _jidList = [];
                        if(_itemData.siblingCount == 0) {
                            _onGetSiblingItems();
                            return;
                        }
                        for(var _j = 0; _j < _itemData.siblingCount; _j++) {
                            var _siblingItemElem = _siblingItemElemArray[_j];
                            var _siblingData = {};
                            var _siblingItemIdAttr = _siblingItemElem.attr('siblingitemid');
                            if(_siblingItemIdAttr != null) {
                                _siblingData.siblingItemId = _siblingItemIdAttr.value();
                            }
                            var _siblingOwnerJidAttr = _siblingItemElem.attr('ownerjid');
                            if(_siblingOwnerJidAttr != null) {
                                _siblingData.ownerJid = _siblingOwnerJidAttr.value();
                            }
                            var _siblingOwnerNameAttr = _siblingItemElem.attr('ownername');
                            if(_siblingOwnerNameAttr != null) {
                                _siblingData.ownerName = _siblingOwnerNameAttr.value();
                            }
                            var _siblingStatusAttr = _siblingItemElem.attr('status');
                            if(_siblingStatusAttr != null) {
                                _siblingData.status = parseInt(_siblingStatusAttr.value());
                            }
                            var _nickNameElem = Utils.getChildXmlElement(_siblingItemElem, 'nickname');
                            if(_nickNameElem != null) {
                                _siblingData.nickName = _nickNameElem.text();
                            }
                            var _avatarDataElem = Utils.getChildXmlElement(_siblingItemElem, 'avatardata');
                            if(_avatarDataElem != null) {
                                _siblingData.avatarData = _avatarDataElem.text();
                            }
                            var _avatarTypeElem = Utils.getChildXmlElement(_siblingItemElem, 'avatartype');
                            if(_avatarTypeElem != null) {
                                _siblingData.avatarType = _avatarTypeElem.text();
                            }
                            var _userStatusElem = Utils.getChildXmlElement(_siblingItemElem, 'status');
                            if(_userStatusElem != null) {
                                _siblingData.userStatus = parseInt(_userStatusElem.text());
                            }
                            _jidList.push(_siblingData.ownerJid);

                            _itemData.siblingItems[_j] = _siblingData;
                        }
                        if(_jidList.length > 0) {
                            UserAccountUtils.getLoginAccountListByJidList(_jidList, _onGetUserAccountDataCallBackForSibling);
                        } else {
                            _onGetSiblingItems();
                            return;
                        }
                    }
                } else {
                    _onGetSiblingItems();
                    return;
                }
                function _onGetUserAccountDataCallBackForSibling(mapData) {
                    var _itemCount = _itemData.siblingItems.length;
                    for(var _i = 0; _i < _itemCount; _i++) {
                        var _siblingData = _itemData.siblingItems[_i];
                        _siblingData.userName = mapData[_siblingData.ownerJid];
                    }
                    _onGetSiblingItems();
                }
                function _onGetSiblingItems(){
                    _getReadItemsData();
                }
            }

            function _getReadItemsData() {
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem._getReadItemsData(...");
                var _readFlgElem = Utils.getChildXmlElement(_itemElem, 'readflg');
                if(_readFlgElem != null) {
                    _itemData.readFlg = parseInt(_readFlgElem.text());
                }
                var _readItemsElem = Utils.getChildXmlElement(_itemElem, 'readItems');
                if(_readItemsElem != null) {
                    var _readItemElemArray = Utils.getChildXmlElementArray(_readItemsElem, 'item');
                    var _readAllCountAttr = _readItemsElem.attr('allcount');
                    if(_readAllCountAttr != null) {
                        _itemData.readAllCount = parseInt(_readAllCountAttr.value());
                    }
                    _getExistingReaderItemsFromExistingReaderElementArray(_readItemElemArray, _onGetExistingReaderItems);
                } else {
                    _onGetExistingReaderItems(null);
                }
                function _onGetExistingReaderItems(items){
                    if(items != null){
                        _itemData.readItems = items;
                    }
                    _getPersonInfo();
                }
            }

            function _getPersonInfo() {
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem._getPersonInfo(...");
                var _personInfoElem = Utils.getChildXmlElement(_itemElem, 'person_info');
                _getPersonInfoItemsFromPersonInfoElement(_personInfoElem, _onGetPersonInfoItemsFromPersonInfoElement);
                function _onGetPersonInfoItemsFromPersonInfoElement(personInfoItems){
                    if(personInfoItems != null){
                        _itemData.personInfo = personInfoItems;
                    }
                    _getShortenUrlInfo(_itemData, true);
                }
            }

            function _getShortenUrlInfo(_m_itemData, isNext) {
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem._getShortenUrlInfo(...");
                var _urlObj = _getURLs(_m_itemData.body);
                var _shortenURLInfoArray = new Array();
                if (_urlObj == null) {
                    _onGetShortenUrlInfo(_shortenURLInfoArray);
                } else {
                    _log.connectionLog(7, 'create Item and shorten_url_info');
                    var _iURL = 0;
                    var _maxURL = _urlObj.length;
                    _log.connectionLog(7, 'call loopShortenURL:_maxURL =' + _maxURL);
                    setTimeout(function(){
                        loopShortenURL();
                    }, 1);

                    function loopShortenURL() {
                        _log.connectionLog(7, 'enter loopShortenURL:_iURL =' + _iURL);
                        if (_iURL >= _maxURL) {
                            _log.connectionLog(7, 'leave loopShortenURL');
                            _log.connectionLog(7, 'shortenURLInfo.length=' + _shortenURLInfoArray.length);
                            _onGetShortenUrlInfo(_shortenURLInfoArray);
                            return;
                        }
                        ShortenURLUtils.getURLInfoFromOriginalURL(_urlObj[_iURL], cbLoopShortenURL);

                        function cbLoopShortenURL(err, shortenObj) {
                            _log.connectionLog(7, 'enter cbLoopShortenURL');
                            if (err != null) {
                                if (typeof err == 'string') {
                                    _log.connectionLog(3, 'SynchronouseBridgeNode#cbLoopShortenURL detect error: ' + err);
                                } else {
                                    _log.connectionLog(3, 'SynchronouseBridgeNode#cbLoopShortenURL detect error: ' + err.name + ":" + err.message);
                                }
                            } else if (shortenObj == null) {
                                _log.connectionLog(7, 'leave cbLoopShortenURL; not found ' + _urlObj[_iURL]);
                            } else {
                                _log.connectionLog(7, 'cbLoopShortenURL get url information:' + shortenObj.getOriginalURL());
                                _shortenURLInfoArray.push(shortenObj);
                            }
                            _iURL++;
                            _log.connectionLog(7, 'call loopShortenURL');
                            loopShortenURL();
                        }
                    }
                }
                function _onGetShortenUrlInfo(shortenURLInfoArray) {
                    _log.connectionLog(7, 'shortenURLInfo.length=' + shortenURLInfoArray.length);
                    _m_itemData.shortenItems = shortenURLInfoArray;
                    _m_itemData.shortenUrlCount = shortenURLInfoArray.length;
                    if(isNext){
                        _getConvertFileInfo();
                    }
                }
            }

            function _getConvertFileInfo(){
                _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemDataFromMessageItemElem._createItem._getConvertFileInfo(...");
                var _urlObj = _getAttachedURLs(_itemData.body);
                var _convertFileInfoAry = new Array();
                if (_urlObj == null) {
                    _onGetConvertFileInfo();
                } else {
                    _log.connectionLog(7, '==== create Item and convert file info ====');
                    var _iURL = 0;
                    var _maxURL = _urlObj.length;
                    _log.connectionLog(7, 'call loopConvertFileInfo:_maxURL =' + _maxURL);
                    setTimeout(function(){
                        _loopConvertFileInfo();
                    }, 1);
                }

                function _loopConvertFileInfo(){
                    if (_iURL >= _maxURL) {
                        _log.connectionLog(7, 'loopConvertFileInfo : convertFileInfo.length=' + _convertFileInfoAry.length);
                        _onGetConvertFileInfo();
                        return;
                    }
                    _log.connectionLog(7, 'loopConvertFileInfo:URL=' + _urlObj[_iURL]);
                    _getConvertFileItem(tenantUuid, _urlObj[_iURL], _onGetConvertFileItem);
                }

                function _onGetConvertFileItem(convertFileItem){
                    if(convertFileItem == null){
                        _log.connectionLog(7, '_onGetConvertedFileItem : item not found');
                    } else {
                        _log.connectionLog(7, '_onGetConvertedFileItem : get convertedFileItem');
                        _convertFileInfoAry.push(convertFileItem);
                    }
                    _iURL++;
                    _loopConvertFileInfo();
                }

                function _onGetConvertFileInfo(){
                    _log.connectionLog(7, '_onGetConvertFileInfo:' + _convertFileInfoAry);
                    _itemData.convertFileItems = _convertFileInfoAry;
                    _itemData.convertFileItemCount = _convertFileInfoAry.length;
                    _returnCallback();
                }
            }
        }

        function _returnCallback() {
            if (onGetItemDataCallBack != null
                && typeof onGetItemDataCallBack == 'function') {
                setTimeout(function() {
                    onGetItemDataCallBack(_itemData);
                }, 1);
            }
        }

        setTimeout(function() {
            _createItem();
        }, 0);

        return true;
    }

    function _getExistingReaderItemsFromExistingReaderElementArray(
        existingReaderItemsArray, onGetExistingReaderItemsCallBack) {
        _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getExistingReaderItemsFromExistingReaderElementArray(...");
        if (existingReaderItemsArray == null) {
            _log
                .connectionLog(
                    3,
                    '_getMessageItemsFromMessageItemElementArray :: existingReaderItemsArray is invalid');
            return false;
        }
        if (onGetExistingReaderItemsCallBack == null
            || typeof onGetExistingReaderItemsCallBack != 'function') {
            _log
                .connectionLog(
                    3,
                    '_getMessageItemsFromMessageItemElementArray :: onGetExistingReaderItemsCallBack is invalid');
            return false;
        }
        var _count = existingReaderItemsArray.length;
        var _itemDataCount = 0;
        var _itemsData = [];
        function _createExistingReaderItemsData() {
            if (_itemDataCount >= _count) {
                setTimeout(function() {
                    _appendCubeeAccountForGetMessageResponseOrNotification(
                        _itemsData, _returnCallback);
                }, 0);
                return;
            }
            var _itemElem = existingReaderItemsArray[_itemDataCount];
            var _ret = _getMessageExistingReaderItemFromItemElement(_itemElem,
                                                                    _callback);
            if (!_ret) {
                _itemDataCount++;
                _createExistingReaderItemsData();
            }

            function _callback(itemData) {
                if (itemData != null) {
                    _itemsData.push(itemData);
                }
                _itemDataCount++;
                _createExistingReaderItemsData();
            }
        }
        function _returnCallback() {
            if (onGetExistingReaderItemsCallBack != null
                && typeof onGetExistingReaderItemsCallBack == 'function') {
                setTimeout(function() {
                    onGetExistingReaderItemsCallBack(_itemsData);
                }, 1);
            }
        }
        setTimeout(function() {
            _createExistingReaderItemsData();
        }, 0);
        return true;
    }

    function _getMessageExistingReaderItemFromItemElement(itemElem,
                                                          onGetItemDataCallBack) {
        if (itemElem == null) {
            _log
                .connectionLog(3,
                               '_getMessageExistingReaderItemFromItemElement :: itemElem is invalid');
            return false;
        }
        if (onGetItemDataCallBack == null
            || typeof onGetItemDataCallBack != 'function') {
            _log
                .connectionLog(
                    3,
                    '_getMessageExistingReaderItemFromItemElement :: onGetItemDataCallBack is invalid');
            return false;
        }
        var _itemElem = itemElem;
        var _itemData = {};
        var _jidElem = Utils.getChildXmlElement(_itemElem, 'jid');
        if (_jidElem != null) {
            _itemData.jid = _jidElem.text();
        }
        var _nickNameElem = Utils.getChildXmlElement(_itemElem, 'nickname');
        if (_nickNameElem != null) {
            _itemData.nickName = _nickNameElem.text();
        }
        var _avatarDataElem = Utils.getChildXmlElement(_itemElem, 'avatardata');
        if (_avatarDataElem != null) {
            _itemData.avatarData = _avatarDataElem.text();
        }
        var _avatarTypeElem = Utils.getChildXmlElement(_itemElem, 'avatartype');
        if (_avatarTypeElem != null) {
            _itemData.avatarType = _avatarTypeElem.text();
        }
        var _dateElem = Utils.getChildXmlElement(_itemElem, 'date');
        if (_dateElem != null) {
            _itemData.date = _dateElem.text();
        }
        setTimeout(function() {
            onGetItemDataCallBack(_itemData);
        }, 0);
        return true;
    }

    function _getPersonInfoItemsFromPersonInfoElement(personInfoElement, onGetPersonInfoItemsCallBack){
        var _ret = {};
        function _returnCallBack() {
            if (onGetPersonInfoItemsCallBack != null && typeof onGetPersonInfoItemsCallBack == 'function') {
                setTimeout(function(){
                    onGetPersonInfoItemsCallBack(_ret);
                }, 1);
            } else {
                _log.connectionLog(7, '_getPersonInfoItemsFromPersonInfoElement :: onGetPersonInfoItemsCallBack is null or undefined');
            }
        }
        if(personInfoElement == null) {
            _log.connectionLog(6, '_getPersonInfoItemsFromPersonInfoElement :: personInfoElement is null');
            _returnCallBack();
            return;
        }
        var _personInfoDataArray = Utils.getChildXmlElementArray(personInfoElement, 'item');
        var _count = _personInfoDataArray.length;
        var _jidList = [];
        for(var _i = 0; _i < _count; _i++) {
            var _itemElem = _personInfoDataArray[_i];
            var _jidElem = Utils.getChildXmlElement(_itemElem, 'jid');
            if(_jidElem == null) {
                continue;
            }
            var _jidStr = _jidElem.text();
            var _personInfoData = {};
            var _nickNameElem = Utils.getChildXmlElement(_itemElem, 'nickname');
            if(_nickNameElem != null) {
                _personInfoData.nickName = _nickNameElem.text();
            }
            var _avatarDataElem = Utils.getChildXmlElement(_itemElem, 'avatardata');
            if(_avatarDataElem != null) {
                _personInfoData.avatarData = _avatarDataElem.text();
            }
            var _avatarTypeElem = Utils.getChildXmlElement(_itemElem, 'avatartype');
            if(_avatarTypeElem != null) {
                _personInfoData.avatarType = _avatarTypeElem.text();
            }
            var _statusElem = Utils.getChildXmlElement(_itemElem, 'status');
            if(_statusElem != null) {
                _personInfoData.status = parseInt(_statusElem.text());
            }

            _ret[_jidStr] = _personInfoData;
            _jidList.push(_jidStr);
        }
        if(_jidList.length > 0) {
            UserAccountUtils.getLoginAccountListByJidList(_jidList, _onGetUserAccountDataCallBack);
        } else {
            _returnCallBack();
            return;
        }
        function _onGetUserAccountDataCallBack(mapData) {
            var _jidCount = _jidList.length;
            for(var _i = 0; _i < _jidCount; _i++) {
                var _jidDataStr = _jidList[_i];
                var _personInfoData = _ret[_jidDataStr];
                if(_personInfoData == null) {
                    continue;
                }
                _personInfoData.userName = mapData[_jidDataStr];
            }
            _returnCallBack();
        }
    }

    function _appendCubeeAccountForGetMessageResponseOrNotification(items,
                                                                    callbackFunc) {
        if (items == null) {
            _returnCallback();
            return;
        }
        var _jidList = [];
        var _jidHash = {};
        var _itemCount = items.length;
        for ( var _i = 0; _i < _itemCount; _i++) {
            var _item = items[_i];
            var _jid = _item.jid;
            if (_jidHash[_jid] == null) {
                _jidList.push(_jid);
                _jidHash[_jid] = true;
            }
        }
        if (_jidList.length > 0) {
            UserAccountUtils.getLoginAccountListByJidList(_jidList,
                                                          _onGetUserAccountDataCallBack);
        } else {
            _returnCallback();
            return;
        }
        function _onGetUserAccountDataCallBack(mapData) {
            for ( var _i = 0; _i < _itemCount; _i++) {
                var _item = items[_i];
                var _jid = _item.jid;
                _item.account = mapData[_jid];
            }
            _returnCallback();
        }
        function _returnCallback() {
            if (callbackFunc != null && typeof callbackFunc == 'function') {
                setTimeout(function() {
                    callbackFunc(items);
                }, 1);
            }
        }
    }

    function _getItemDataFromMailBodyItemElem(itemElem) {
        if (itemElem == null) {
            return null;
        }
        var _itemElem = itemElem;
        var _idElem = Utils.getChildXmlElement(_itemElem, 'id');
        if (_idElem == null) {
            _log.connectionLog(7, 'Message : id');
            return null;
        }
        var _itemData = {};
        _itemData.id = parseInt(_idElem.text());
        var _itemIdElem = Utils.getChildXmlElement(_itemElem, 'item_id');
        if (_itemIdElem == null) {
            _log.connectionLog(7, 'Message : itemId');
            return null;
        }
        _itemData.itemId = _itemIdElem.text();
        var _jidElem = Utils.getChildXmlElement(_itemElem, 'jid');
        if (_jidElem == null) {
            _log.connectionLog(7, 'Message : jid');
            return null;
        }
        _itemData.jid = _jidElem.text();
        var _mailBodyElem = Utils.getChildXmlElement(_itemElem, 'mail_body');
        if (_mailBodyElem == null) {
            _log.connectionLog(7, 'Message : mailBody');
            return null;
        }
        _itemData.mailBody = _mailBodyElem.text();
        return _itemData;
    }

    _proto.sendMessage = function(accessToken, requestData,
                                  onSendMessageCallBackFunc) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.sendMessage');
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onSendMessageCallBackFunc != null
            && typeof onSendMessageCallBackFunc != 'function') {
            _log.connectionLog(3, 'onSendMessageCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _tenantUuid = _sessionData.getTenantUuid();
        var _xmppSendMessage = null;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        var _type = requestData.type;

        var _ret = true;
        var _maxURL = 0;
        var _iURL = 0;
        var _urlObj = null;
        if(_type == RequestData.SEND_MESSAGE_TYPE_MAIL) {
            _ret = _onRegisterShortenUrl();
        } else {
            _log.connectionLog(7, '***requestData.body = ' + requestData.body);
            _urlObj = _getURLs(requestData.body);
            if (_urlObj != null) {
                _maxURL = _urlObj.length;
            }
            _log.connectionLog(7, '_maxURL=' + _maxURL);
            var _ret = true;
            if (_urlObj != null) {
                setTimeout(function() {
                    _loopGetURLIDSend();
                }, 1);
            } else {
                _ret = _onRegisterShortenUrl();
            }
        }
        return _ret;

        function _loopGetURLIDSend() {
            _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.sendMessage._loopGetURLIDSend(..');
            _log.connectionLog(7, 'enter _loopGetURLIDSend, _iURL = ' + _iURL);
            if (_iURL >= _maxURL) {
                _onRegisterShortenUrl();
                return;
            }
            ShortenURLUtils.getURLID(_urlObj[_iURL], onGetURLIDSend);

            function onGetURLIDSend(err, urlid) {
                if (err != null) {
                    if (typeof err == 'string') {
                        _log.connectionLog(3, 'SynchronouseBridgeNode#onGetURLIDSend detect error: ' + err);
                    }
                    else {
                        _log.connectionLog(3, 'SynchronouseBridgeNode#onGetURLIDSend detect error: ' + err.name + ':' + err.message);
                    }
                }
                else if (urlid != null){
                    _log.connectionLog(7, 'enter _loopGetURLIDSend, urlid = ' + urlid);
                }
                else {
                    _log.connectionLog(7, 'enter _loopGetURLIDSend, urlid = null' );
                }
                _iURL++;
                _loopGetURLIDSend();
            }
        }

        function _onRegisterShortenUrl() {
            _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.sendMessage._onRegisterShortenUrl(..');
            var _xsConn = _sessionData.getOpenfireSock();
            if (_xsConn == null) {
                _log.connectionLog(3, '_xsConn is null');
                return false;
            }
            requestData.threadTitle = Formatting.exTrim(requestData.threadTitle);
            if(!Validation.threadTitleValidationCheck(requestData.threadTitle, false)){
                _log.connectionLog(7, 'SynchronousBridgeNodeXmpp.sendMessage._onRegisterShortenUrl(.. '
                                    + 'threadTitle is invalid:' + requestData.threadTitle);
                return false;
            }
            requestData.quotationItemId = undefined;
            if(requestData.shareItemId != undefined &&
               requestData.shareItemId != null &&
               !Validation.itemIdValidationCheck(requestData.shareItemId, true)){
                return false;
            }
            requestData.quotationItemId = requestData.shareItemId;

            switch (_type) {
            case RequestData.SEND_MESSAGE_TYPE_PUBLIC:
                var _messageBody = requestData.body;
                if (_messageBody == null) {
                    _log.connectionLog(3, 'requestData is invalid');
                    return false;
                }
                var _bodyType = requestData.bodyType;
                if (!Validation.bodyTypeCheck(_bodyType, false)) {
                    _log.connectionLog(3, 'requestData bodyType is invalid.:'+_bodyType);
                    return false;
                }
                var _sendData = requestData;
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createSendMessageXmpp(_xmppServerHostName, _fromJid, _sendData);
                });
                break;
            case RequestData.SEND_MESSAGE_TYPE_CHAT:
                var _partnerJid = requestData.to;
                var _messageBody = requestData.body;
                var _attachedFileUrlCount = requestData.attachedCount;
                var _attachedFileUrls = requestData.attachedItems;
                var _threadTitle = requestData.threadTitle;
                var _replyId = requestData.replyId;
                var _context = requestData.context;
                var _quotationItemId = requestData.quotationItemId;
                if (_messageBody == null) {
                    _log.connectionLog(3, 'requestData body is invalid');
                    return false;
                }
                if (!Validation.jidValidationCheck(_partnerJid, true)) {
                    _log.connectionLog(3, 'requestData to is invalid');
                    return false;
                }
                var _bodyType = requestData.bodyType;
                if (!Validation.bodyTypeCheck(_bodyType, false)) {
                    _log.connectionLog(3, 'requestData bodyType is invalid:' + _bodyType);
                    return false;
                }
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createSendChatMessageXmpp(_fromJid,
                                                          _partnerJid, _messageBody, _replyId, _attachedFileUrlCount,
                                                          _attachedFileUrls, _threadTitle, _context, _quotationItemId,
                                                          _bodyType);
                });
                break;
            case RequestData.SEND_MESSAGE_TYPE_TASK:
                var _sendData = requestData;
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createSendMessageXmpp(_xmppServerHostName, _fromJid, _sendData);
                });
                break;
            case RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT:
                var _sendData = requestData;
                var _messageBody = requestData.body;
                if (_messageBody == null) {
                    _log.connectionLog(3, 'requestData body is invalid');
                    return false;
                }
                var _messageRoomId = requestData.roomId;
                if (_messageRoomId == null) {
                    _log.connectionLog(3, 'requestData roomId is invalid');
                    return false;
                }
                var _bodyType = requestData.bodyType;
                if (!Validation.bodyTypeCheck(_bodyType, false)) {
                    _log.connectionLog(3, 'requestData bodyType is invalid');
                    return false;
                }
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createSendMessageXmpp(_xmppServerHostName, _fromJid, _sendData);
                });
                break;
            case RequestData.SEND_MESSAGE_TYPE_MAIL:
                var _sendData = requestData;
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createSendMessageMailXmpp(_xmppServerHostName, _fromJid, _sendData);
                });
                break;
            case RequestData.SEND_MESSAGE_TYPE_COMMUNITY:
                var _sendData = requestData;
                var _messageBody = requestData.body;
                if (_messageBody == null) {
                    _log.connectionLog(3, 'requestData body is invalid');
                    return false;
                }
                var _messageRoomId = requestData.roomId;
                if (_messageRoomId == null) {
                    _log.connectionLog(3, 'requestData roomId is invalid');
                    return false;
                }
                var _bodyType = requestData.bodyType;
                if (!Validation.bodyTypeCheck(_bodyType, false)) {
                    _log.connectionLog(3, 'requestData bodyType is invalid..');
                    return false;
                }
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createSendMessageXmpp(_xmppServerHostName, _fromJid, _sendData);
                });
                break;
            case RequestData.SEND_MESSAGE_TYPE_QUESTIONNAIRE:
                var _sendData = requestData;
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createSendMessageXmpp(_xmppServerHostName, _fromJid, _sendData);
                });
                break;
            case RequestData.SEND_MESSAGE_TYPE_MURMUR:
                var _sendData = requestData;
                var _messageBody = requestData.body;
                if (_messageBody == null) {
                    _log.connectionLog(3, 'requestData body is invalid');
                    return false;
                }
                var _bodyType = requestData.bodyType;
                if (!Validation.bodyTypeCheck(_bodyType, false)) {
                    _log.connectionLog(3, 'requestData bodyType is invalid..');
                    return false;
                }
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createSendMessageXmpp(_xmppServerHostName, _fromJid, _sendData);
                });
                break;
            default:
                _log.connectionLog(3, 'request type is invalid');
                return false;
            }
            if (_xmppSendMessage == null) {
                _log.connectionLog(3, '_xmppSendMessage is null');
                return false;
            }
            var _xmppStr = _xmppSendMessage[0];
            if (_xmppStr == null || _xmppStr == '') {
                _log.connectionLog(3, '_xmppSendMessage[0] is invalid');
                return false;
            }
            var _id = _xmppSendMessage[1];
            if (onSendMessageCallBackFunc != null) {
                _sessionData.setCallback(_id, onSendMessageCallback);
            }
            _xsConn.send(_xmppStr);
            return true;
        }

        function onSendMessageCallback(responceXmlRootElem) {
            _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.sendMessage.onSendMessageCallback(.. [send to openfire]');
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = null;
            var _items = null;
            var _count = null;
            var _isResponse = true;
            if (_result == true) {
                switch (_type) {
                case RequestData.SEND_MESSAGE_TYPE_QUESTIONNAIRE:
                    var _contentElem = _getContentElemFromSendOrUpdateMessageResponse(
                        responceXmlRootElem,
                        'http://necst.nec.co.jp/protocol/send');
                    _extras = {};
                    var _itemsRet = _getItemsFromSendQuestionnaireResponceContent(
                        _contentElem,
                        function(items) {
                            _onGetItemsCallBack(
                                items,
                                _finishInnerCallBackFuncs);
                        });
                    if (!_itemsRet) {
                        _result = false;
                        _reason = ERROR_REASON_INNER;
                        _extras = {};
                        _items = [];
                        _finishInnerCallBackFuncs();
                    } else {
                        _isResponse = false;
                    }
                    break;
                case RequestData.SEND_MESSAGE_TYPE_MAIL:
                    break;
                case RequestData.SEND_MESSAGE_TYPE_PUBLIC:
                case RequestData.SEND_MESSAGE_TYPE_CHAT:
                    var _contentElem = _getContentElemFromSendOrUpdateMessageResponse(
                        responceXmlRootElem,
                        'http://necst.nec.co.jp/protocol/send');
                        _extras = {};
                        var _itemsRet = _getItemsFromSendOrUpdateMessageResponceContent(
                            _tenantUuid,
                            _contentElem,
                            function(items) {
                                _onGetItemsCallBack(
                                    items,
                                    _finishInnerCallBackFuncs);
                            });
                    if (!_itemsRet) {
                        _result = false;
                        _reason = ERROR_REASON_INNER;
                        _extras = {};
                        _items = [];
                        _finishInnerCallBackFuncs();
                    } else {
                        _isResponse = false;
                    }
                    break;
                case RequestData.SEND_MESSAGE_TYPE_TASK:
                    var _contentElem = _getContentElemFromSendOrUpdateMessageResponse(
                        responceXmlRootElem,
                        'http://necst.nec.co.jp/protocol/send');
                    var _extrasRet = _getExtrasFromTaskAddOrUpdateResponceContent(
                        _tenantUuid,
                        _contentElem,
                        function(extras) {
                            _onGetExtrasCallBack(
                                extras,
                                function() {
                                    var _itemsRet = _getItemsFromSendOrUpdateMessageResponceContent(
                                        _tenantUuid,
                                        _contentElem,
                                        function(items) {
                                            _onGetItemsCallBack(
                                                items,
                                                _finishInnerCallBackFuncs);
                                        });
                                    if (!_itemsRet) {
                                        _result = false;
                                        _reason = ERROR_REASON_INNER;
                                        _extras = {};
                                        _items = [];
                                        _finishInnerCallBackFuncs();
                                    }
                                });
                        });
                    if (!_extrasRet) {
                        _result = false;
                        _reason = ERROR_REASON_INNER;
                        _extras = {};
                        _items = [];
                        _finishInnerCallBackFuncs();
                    } else {
                        _isResponse = false;
                    }
                    break;
                case RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT:
                case RequestData.SEND_MESSAGE_TYPE_COMMUNITY:
                    var _contentElem = _getContentElemFromSendOrUpdateMessageResponse(
                        responceXmlRootElem,
                        'http://necst.nec.co.jp/protocol/send');
                    _extras = {};
                    var _itemsRet = _getItemsFromSendOrUpdateMessageResponceContent(
                            _tenantUuid, _contentElem, function(items) {
                                _onGetItemsCallBack(items,
                                        _finishInnerCallBackFuncs);
                            });
                    if (!_itemsRet) {
                        _result = false;
                        _reason = ERROR_REASON_INNER;
                        _extras = {};
                        _items = [];
                        _finishInnerCallBackFuncs();
                    } else {
                        _isResponse = false;
                    }
                    break;
                case RequestData.SEND_MESSAGE_TYPE_MURMUR:
                    var _contentElem = _getContentElemFromSendOrUpdateMessageResponse(
                        responceXmlRootElem,
                        'http://necst.nec.co.jp/protocol/send');
                    _extras = {};
                    var _itemsRet = _getItemsFromSendOrUpdateMessageResponceContent(
                            _tenantUuid, _contentElem, function(items) {
                                _onGetItemsCallBack(items,
                                        _finishInnerCallBackFuncs);
                            });
                    if (!_itemsRet) {
                        _result = false;
                        _reason = ERROR_REASON_INNER;
                        _extras = {};
                        _items = [];
                        _finishInnerCallBackFuncs();
                    } else {
                        _isResponse = false;
                    }
                    break;
                default:
                    _log
                            .connectionLog(
                                    3,
                                    'SynchronousBridgeNodeXmpp#sendMessage(onSendMessageCallback)::request type is invalid');
                    break;
                }
            }
            if(_isResponse) {
                _finishInnerCallBackFuncs();
            }

            function _onGetExtrasCallBack(extras, onCallback) {
                _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.sendMessage.onSendMessageCallback._onGetExtrasCallBack(..');
                _extras = extras;
                if (_extras == null) {
                    _extras = {};
                }
                onCallback();
            }

            function _onGetItemsCallBack(items, onCallback) {
                _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.sendMessage.onSendMessageCallback._onGetItemsCallBack(..');
                _items = items;
                if (_items == null) {
                    _log
                            .connectionLog(
                                    3,
                                    'SynchronousBridgeNodeXmpp#sendMessage(onSendMessageCallback)::_items is null. type='
                                            + _type);
                    _result = false;
                    _reason = ERROR_REASON_XMPP_SERVER;
                    _extras = {};
                    _items = [];
                }
                _count = _items.length;
                onCallback();
            }

            function _finishInnerCallBackFuncs() {
                _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.sendMessage.onSendMessageCallback._finishInnerCallBackFuncs(..');
                if(onSendMessageCallBackFunc && typeof onSendMessageCallBackFunc == 'function') {
                    onSendMessageCallBackFunc(_result, _reason, _extras, _count, _items);
                }
            }
        }
    };

    _proto.updateMessageBody = function(accessToken, requestData,
                                        onSendMessageCallBackFunc, apiUtil) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.updateMessageBody');
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if(requestData.type == undefined ||
           requestData.type == null ||
           !Validation.messageTypeValidationCheck(requestData.type, true)){
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp.updateMessageBody._onRegisterShortenUrl(.. type is invalid:');
            return false;
        }
        if(requestData.body == undefined ||
           requestData.body == null ||
           typeof requestData.body != "string" ||
           requestData.body.length == 0){
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp.updateMessageBody._onRegisterShortenUrl(.. body is invalid:' + requestData.body);
            return false;
        }
        if(requestData.itemId == undefined ||
           requestData.itemId == null ||
           !Validation.itemIdValidationCheck(requestData.itemId, true)){
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp.updateMessageBody._onRegisterShortenUrl(.. itemId is invalid:' + requestData.itemId);
            return false;
        }
        if(requestData.roomId != undefined &&
           requestData.roomId != null &&
           !Validation.roomIdValidationCheck(requestData.roomId, false)){
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp.updateMessageBody._onRegisterShortenUrl(.. roomId is invalid:' + requestData.roomId);
            return false;
        }
        if (onSendMessageCallBackFunc != null
            && typeof onSendMessageCallBackFunc != 'function') {
            _log.connectionLog(3, 'onSendMessageCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _tenantUuid = _sessionData.getTenantUuid();
        var _xmppSendMessage = null;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        var _type = requestData.type;


        var _maxURL = 0;
        var _iURL = 0;
        var _urlObj = null;

        _log.connectionLog(7, '***requestData.body = ' + requestData.body);
        _urlObj = _getURLs(requestData.body);
        if (_urlObj != null) {
            _maxURL = _urlObj.length;
        }
        _log.connectionLog(7, '_maxURL=' + _maxURL);
        var _ret = true;
        if (_urlObj != null) {
            setTimeout(function() {
                _ret = _loopGetURLIDSend();
            }, 1);
        } else {
            _ret = _onRegisterShortenUrl();
        }

        return _ret;

        function _loopGetURLIDSend() {
            _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.updateMessageBody._loopGetURLIDSend(..');
            _log.connectionLog(7, 'enter _loopGetURLIDSend, _iURL = ' + _iURL);
            if (_iURL >= _maxURL) {
                _onRegisterShortenUrl();
                return;
            }
            ShortenURLUtils.getURLID(_urlObj[_iURL], onGetURLIDSend);

            function onGetURLIDSend(err, urlid) {
                if (err != null) {
                    if (typeof err == 'string') {
                        _log.connectionLog(3, 'SynchronouseBridgeNode#onGetURLIDSend detect error: ' + err);
                    }
                    else {
                        _log.connectionLog(3, 'SynchronouseBridgeNode#onGetURLIDSend detect error: ' + err.name + ':' + err.message);
                    }
                }
                else if (urlid != null){
                    _log.connectionLog(7, 'enter _loopGetURLIDSend, urlid = ' + urlid);
                }
                else {
                    _log.connectionLog(7, 'enter _loopGetURLIDSend, urlid = null' );
                }
                _iURL++;
                _loopGetURLIDSend();
            }
        }

        function _onRegisterShortenUrl() {
            _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.updateMessageBody._onRegisterShortenUrl(..');
            var _xsConn = _sessionData.getOpenfireSock();
            if (_xsConn == null) {
                _log.connectionLog(3, '_xsConn is null');
                return false;
            }

            switch (_type) {
            case RequestData.UPDATE_MESSAGE_TYPE_PUBLIC:
            case RequestData.UPDATE_MESSAGE_TYPE_CHAT:
            case RequestData.UPDATE_MESSAGE_TYPE_GROUP_CHAT:
            case RequestData.UPDATE_MESSAGE_TYPE_COMMUNITY:
            case RequestData.UPDATE_MESSAGE_TYPE_MURMUR:
                var _messageBody = requestData.body;
                if (_messageBody == null) {
                    _log.connectionLog(3, 'requestData is invalid');
                    return false;
                }
                var _sendData = requestData;
                _xmppSendMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createUpdateMessageBodyXmpp(_xmppServerHostName, _fromJid, _sendData);
                });
                break;
            default:
                _log.connectionLog(3, 'request type is invalid');
                return false;
            }
            if (_xmppSendMessage == null) {
                _log.connectionLog(3, '_xmppSendMessage is null');
                return false;
            }
            var _xmppStr = _xmppSendMessage[0];
            if (_xmppStr == null || _xmppStr == '') {
                _log.connectionLog(3, '_xmppSendMessage[0] is invalid');
                return false;
            }
            var _id = _xmppSendMessage[1];
            if (onSendMessageCallBackFunc != null) {
                _sessionData.setCallback(_id, onUpdateMessageBodyCallback);
            }
            _xsConn.send(_xmppStr);
            return true;
        }

        function onUpdateMessageBodyCallback(responceXmlRootElem) {
            _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.updateMessageBody.onUpdateMessageBodyCallback(.. [send to openfire]');
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _extras = null;
            var _items = null;
            var _count = null;

            if(responceXmlRootElem == null){
                _log.connectionLog(3, 'SynchronousBridgeNodeXmpp.updateMessageBody.onUpdateMessageBodyCallback(.. responceXmlRootElem is null');
                _result = false;
                _reason = Const.API_STATUS.INTERNAL_SERVER_ERROR;
                _extras = {};
                _items = [];
                _finishInnerCallBackFuncs();
                return;
            }
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            switch (_type) {
                case RequestData.UPDATE_MESSAGE_TYPE_PUBLIC:
                case RequestData.UPDATE_MESSAGE_TYPE_CHAT:
                case RequestData.UPDATE_MESSAGE_TYPE_GROUP_CHAT:
                case RequestData.UPDATE_MESSAGE_TYPE_COMMUNITY:
                case RequestData.UPDATE_MESSAGE_TYPE_MURMUR:
                    if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                        _result = true;
                        _reason = Const.API_STATUS.SUCCESS;
                        _extras = {};
                        _items = [];
                        _finishInnerCallBackFuncs();
                        return;
                    }else if (_iqTypeAttr != null && _iqTypeAttr.value() == 'error') {
                        const errorElm = Utils.getChildXmlElement(responceXmlRootElem,"error");
                        if(errorElm.attr('code') == undefined){
                            _result = false;
                            _reason = Const.API_STATUS.INTERNAL_SERVER_ERROR;
                            _extras = {};
                            _items = [];
                            _finishInnerCallBackFuncs();
                            return;
                        }
                        const codeattr = errorElm.attr('code').value();
                        if(isNaN(codeattr) ||codeattr.length == 0){
                            _result = false;
                            _reason = Const.API_STATUS.INTERNAL_SERVER_ERROR;
                            _extras = {};
                            _items = [];
                            _finishInnerCallBackFuncs();
                            return;
                        }else{
                            if(codeattr.length == 3){
                                _result = false;
                                _reason = parseInt(codeattr + "900");
                                _extras = {};
                                _items = [];
                                _finishInnerCallBackFuncs();
                                return;
                            }else{
                                _result = false;
                                _reason = parseInt(codeattr);
                                _extras = {};
                                _items = [];
                                _finishInnerCallBackFuncs();
                                return;
                            }
                        }
                    }else{
                        _result = false;
                        _reason = Const.API_STATUS.INTERNAL_SERVER_ERROR;
                        _extras = {};
                        _items = [];
                        _finishInnerCallBackFuncs();
                        return;
                    }
                    break;
                default:
                    _log.connectionLog(
                        3,
                        'SynchronousBridgeNodeXmpp#sendMessage(onSendMessageCallback)::request type is invalid');
                    _result = false;
                    _reason = Const.API_STATUS.BAD_REQUEST;
                    _extras = {};
                    _items = [];
                    _finishInnerCallBackFuncs();
                    return;
            }

            function _finishInnerCallBackFuncs() {
                _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.updateMessageBody.onSendMessageCallback._finishInnerCallBackFuncs(..');
                if(onSendMessageCallBackFunc && typeof onSendMessageCallBackFunc == 'function') {
                    onSendMessageCallBackFunc(_result, _reason, _extras, _count, _items);
                }
            }
        }
    };
    function _getContentElemFromSendOrUpdateMessageResponse(
            responceXmlRootElem, namespace) {
        var _ret = null;
        if (responceXmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getContentElemFromSendOrUpdateMessageResponse :: xmlRootElem is null');
            return _ret;
        }
        var _messageElem = Utils.getChildXmlElement(responceXmlRootElem,
                'message');
        if (_messageElem == null) {
            _log
                    .connectionLog(3,
                            '_getContentElemFromSendOrUpdateMessageResponse :: _messageElem is null');
            return _ret;
        }
        var _messgeElemNamespace = _messageElem.namespace().href();
        if (_messgeElemNamespace != namespace) {
            _log
                    .connectionLog(
                            3,
                            '_getContentElemFromSendOrUpdateMessageResponse :: _messgeElemNamespace is not "send"');
            return _ret;
        }
        var _contentElem = Utils.getChildXmlElement(_messageElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getContentElemFromSendOrUpdateMessageResponse :: _contentElem is invalid');
            return _ret;
        }
        _ret = _contentElem;
        return _ret;
    }

    function _getItemsFromSendOrUpdateMessageResponceContent(tenantUuid, contentElem,
            onGetItemsFromSendOrUpdateMessageCallBack) {
        _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemsFromSendOrUpdateMessageResponceContent(...");
        var _ret = false;
        if (contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromSendOrUpdateMessageResponceContent :: contentElem is null');
            return _ret;
        }
        var _itemsElem = Utils.getChildXmlElement(contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromSendOrUpdateMessageResponceContent :: _itemsElem is null');
            return _ret;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromSendOrUpdateMessageResponceContent :: _itemElemArray is null');
            return _ret;
        }
        return _getMessageItemsFromMessageItemElementArray(tenantUuid, _itemElemArray, onGetItemsFromSendOrUpdateMessageCallBack);
    }

    function _getItemsFromSendQuestionnaireResponceContent(contentElem,
                                                           onGetItemsFromSendOrUpdateMessageCallBack) {
        _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._getItemsFromSendOrUpdateMessageResponceContent(...");
        var _ret = false;
        if (contentElem == null) {
            _log.connectionLog(
                3,'_getItemsFromSendOrUpdateMessageResponceContent :: contentElem is null');
            return _ret;
        }
        var _itemsElem = Utils.getChildXmlElement(contentElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(
                3,'_getItemsFromSendOrUpdateMessageResponceContent :: _itemsElem is null');
            return _ret;
        }
        var _itemElemArray = Utils.getChildXmlElement(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log.connectionLog(
                3,'_getItemsFromSendOrUpdateMessageResponceContent :: _itemElemArray is null');
            return _ret;
        }
        var _itemIdElemArray = Utils.getChildXmlElement(_itemElemArray, 'item_id');
        if (_itemIdElemArray == null) {
            _log.connectionLog(
                3,'_getItemsFromSendOrUpdateMessageResponceContent :: _itemIdElemArray is null');
            return _ret;
        }
        onGetItemsFromSendOrUpdateMessageCallBack([{"itemId":_itemIdElemArray.text()}]);
        return _itemIdElemArray;
    }

    function _getExtrasFromTaskAddOrUpdateResponceContent(tenantUuid, contentElem,
            onGetExtrasFromTaskAddOrUpdateCallBack) {
        var _ret = false;
        if (contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromTaskAddOrUpdateResponceContent :: contentElem is null');
            return _ret;
        }
        if (onGetExtrasFromTaskAddOrUpdateCallBack != null
                && typeof onGetExtrasFromTaskAddOrUpdateCallBack != 'function') {
            _log
                    .connectionLog(
                            3,
                            '_getExtrasFromTaskAddOrUpdateResponceContent :: onGetExtrasFromTaskAddOrUpdateCallBack is invalid');
            return false;
        }
        var _extrasElem = Utils.getChildXmlElement(contentElem, 'extras');
        if (_extrasElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromTaskAddOrUpdateResponceContent :: _itemsElem is null');
            return _ret;
        }
        var _childrenItemsElem = Utils.getChildXmlElement(_extrasElem,
                'children_items');
        if (_childrenItemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromTaskAddOrUpdateResponceContent :: _childrenItemsElem is null');
            return _ret;
        }
        return _getMessageListExtrasChildrenItems(tenantUuid, _childrenItemsElem, _callback);

        function _callback(childrenItems) {
            if (childrenItems == null) {
                _log
                        .connectionLog(3,
                                '_getExtrasFromTaskAddOrUpdateResponceContent :: childrenItems is null');
                onGetExtrasFromTaskAddOrUpdateCallBack(null);
                return;
            }
            var _extras = {
                childrenCount : childrenItems.length,
                childrenItems : childrenItems
            };
            onGetExtrasFromTaskAddOrUpdateCallBack(_extras);
        }
    }

    _proto.updateMessage = function(accessToken, requestData,
            onUpdateMessageCallBackFunc) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp.updateMessage');
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onUpdateMessageCallBackFunc != null
                && typeof onUpdateMessageCallBackFunc != 'function') {
            _log.connectionLog(3, 'onUpdateMessageCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _tenantUuid = _sessionData.getTenantUuid();
        var _xmppUpdateMessage = null;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        var _type = requestData.type;

        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        switch (_type) {
        case RequestData.UPDATE_MESSAGE_TYPE_TASK:
            var _taskData = requestData;
            var _maxURL = 0;
            var _iURL = 0;
            var _urlObj= _getURLs(_taskData.body);
            if (_urlObj != null) {
                _maxURL = _urlObj.length;
            }
            _log.connectionLog(7, 'UPDATE_MESSAGE_TYPE_TASK: _maxURL = ' + _maxURL);
            setTimeout(function(){
                _loopGetURLIDUpdate();
            }, 1);

            function _loopGetURLIDUpdate() {
                _log.connectionLog(7, 'enter _loopGetURLIDUpdate, _iURL = ' + _iURL);
                if (_iURL >= _maxURL) {
                    _log.connectionLog(7, 'leave _loopGetURLIDUpdate');
                    _xmppUpdateMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                        return Xmpp.createUpdateMessageXmpp(_xmppServerHostName, _fromJid, _taskData);
                    });
                    _onCreateUpdateMessageXmpp(_xmppUpdateMessage);
                    return;
                }
                ShortenURLUtils.getURLID(_urlObj[_iURL], _onGetURLIDUpdate);

                function _onGetURLIDUpdate(err, result) {
                    _log.connectionLog(7, 'enter _onGetURLIDUpdate: _iURL = ' + _iURL);
                    if (err != null) {
                        if (typeof err == 'string') {
                            _log.connectionLog(3, 'SynchronouseBridgeNode#_onGetURLIDUpdate detect error: ' + err);
                        }
                        else {
                            _log.connectionLog(3, 'SynchronouseBridgeNode#_onGetURLIDUpdate detect error: ' + err.name + ':' + err.message);
                        }
                    }
                    _iURL++;
                    _loopGetURLIDUpdate();
                }
            }
            break;
        case RequestData.UPDATE_MESSAGE_TYPE_QUESTIONNAIRE:
            _log.connectionLog(7, 'UPDATE_MESSAGE_TYPE_QUESTIONNAIRE');
            _xmppUpdateMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createUpdateMessageXmpp(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        var _ret = true;
        if(_xmppUpdateMessage != null) {
            _ret = _onCreateUpdateMessageXmpp(_xmppUpdateMessage);
        }
        function _onCreateUpdateMessageXmpp(xmppUpdateMessage) {
            if (xmppUpdateMessage == null) {
                _log.connectionLog(3, 'xmppUpdateMessage is null');
                return false;
            }
            var _xmppStr = xmppUpdateMessage[0];
            if (_xmppStr == null || _xmppStr == '') {
                _log.connectionLog(3, 'xmppUpdateMessage[0] is invalid');
                return false;
            }
            var _id = xmppUpdateMessage[1];
            function onUpdateMessageCallback(responseXmlRootElem) {
                var _result = false;
                var _reason = ERROR_REASON_XMPP_SERVER;
                var _iqTypeAttr = responseXmlRootElem.attr('type');
                if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                    _result = true;
                    _reason = DISCCONECT_REASON_NO;
                }
                var _extras = {};
                var _items = [];
                if (_result == true) {
                    switch (_type) {
                        case RequestData.UPDATE_MESSAGE_TYPE_QUESTIONNAIRE:
                            break;
                        case RequestData.UPDATE_MESSAGE_TYPE_TASK:
                            var _contentElem = _getContentElemFromSendOrUpdateMessageResponse(
                                responseXmlRootElem,
                                'http://necst.nec.co.jp/protocol/update');
                            var _extrasRet = _getExtrasFromTaskAddOrUpdateResponceContent(
                                _tenantUuid,
                                _contentElem,
                                function(extras) {
                                    _onGetExtrasCallBack(
                                        extras,
                                        function() {
                                            var _itemsRet = _getItemsFromSendOrUpdateMessageResponceContent(
                                                _tenantUuid,
                                                _contentElem,
                                                function(items) {
                                                    _onGetItemsCallBack(
                                                        items,
                                                        _finishInnerCallBackFuncs);
                                                });
                                            if (!_itemsRet) {
                                                var _result = false;
                                                var _reason = ERROR_REASON_INNER;
                                                _finishInnerCallBackFuncs();
                                            }
                                        });
                                });
                            if (!_extrasRet) {
                                _result = false;
                                _reason = ERROR_REASON_INNER;
                                _finishInnerCallBackFuncs();
                            }
                            break;
                        default:
                            _log
                                .connectionLog(
                                    3,
                                    'SynchronousBridgeNodeXmpp#updateMessage(onUpdateMessageCallback)::request type is invalid');
                            break;
                    }
                }
                var _count = 0;
                if (_items == null) {
                    _result = false;
                    _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                    _items = [];
                } else {
                    _count = _items.length;
                }
                if(_type != RequestData.UPDATE_MESSAGE_TYPE_TASK ||
                   (_type == RequestData.UPDATE_MESSAGE_TYPE_TASK && _items.length != 0)){
                    _finishInnerCallBackFuncs();
                }
                function _finishInnerCallBackFuncs() {
                    onUpdateMessageCallBackFunc(_result, _reason, _extras, _count,
                                                _items);
                }

                                function _onGetExtrasCallBack(extras, onCallback) {
                    _extras = extras;
                    if (_extras == null) {
                        _extras = {};
                    }
                    onCallback();
                }

                                function _onGetItemsCallBack(items, onCallback) {
                    _items = items;
                    if (_items == null) {
                        _log
                            .connectionLog(
                                3,
                                'SynchronousBridgeNodeXmpp#sendMessage(onSendMessageCallback)::_items is null. type='
                                + _type);
                        _result = false;
                        _reason = ERROR_REASON_XMPP_SERVER;
                        _extras = {};
                        _items = [];
                    }
                    _count = _items.length;
                    onCallback();
                }
            }
            _sessionData.setCallback(_id, onUpdateMessageCallback);
            _xsConn.send(_xmppStr);
            return true;
        }

        return _ret;
    };

    _proto.deleteMessage = function(accessToken, requestData,
            onDeleteMessageCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onDeleteMessageCallBackFunc != null
                && typeof onDeleteMessageCallBackFunc != 'function') {
            _log.connectionLog(3, 'onDeleteMessageCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _xmppDeleteMessage = null;
        var _type = requestData.type;
        switch (_type) {
        case RequestData.DELETE_MESSAGE_TYPE_DELETE:
        case RequestData.DELETE_MESSAGE_TYPE_ADMIN_DELETE:
            var _xmppServerHostName = _sessionData.getXmppServerName();
            var _fromJid = _sessionData.getJid();
            var _messageData = requestData;
            _xmppDeleteMessage = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createDeleteMessageXmpp(_xmppServerHostName, _fromJid, _messageData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppDeleteMessage == null) {
            _log.connectionLog(3, '_xmppDeleteMessage is null');
            return false;
        }
        var _xmppStr = _xmppDeleteMessage[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppDeleteMessage[0] is invalid');
            return false;
        }
        var _id = _xmppDeleteMessage[1];
        function onDeleteMessageCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            onDeleteMessageCallBackFunc(_result, _reason);
        }
        _sessionData.setCallback(_id, onDeleteMessageCallback);
        _xsConn.send(_xmppStr);

        return true;
    };

    _proto.setMessageOption = function(accessToken, requestData,
            onSetMessageOptionCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onSetMessageOptionCallBackFunc == null
                || typeof onSetMessageOptionCallBackFunc != 'function') {
            _log.connectionLog(3, 'onSetMessageOptionCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _xmppMessageOption = null;
        var _type = requestData.type;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        switch (_type) {
        case RequestData.MESSAGE_OPTION_TYPE_ADD_GOOD_JOB:
            var _itemId = requestData.itemId;
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createAddGoodJobXmpp(_xmppServerHostName, _fromJid, _itemId);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_ADD_EMOTION_POINT:
            var _itemId = null;
            if(Validation.itemIdValidationCheck(requestData.itemId, true)){
                _itemId = requestData.itemId;
            }else{
                _log.connectionLog(3, 'request add emotion_point type is need itemId');
                return false;
            }
            let _emotionPoint = 0;
            if(Validation.emotionPointValidationCheck(requestData.emotionPoint, true)){
                _emotionPoint = parseInt(requestData.emotionPoint);
            }else if(requestData.emotionPoint !== undefined &&
                  requestData.emotionPoint !== null){
                _log.connectionLog(3, 'request add emotion_point type is invalid emotionPoint value');
                return false;
            }
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createAddEmotionPointXmpp(_xmppServerHostName, _fromJid,
                                                       _itemId, _emotionPoint);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_DEMAND_TASK:
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createDemandTask(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_CLEAR_DEMANDED_TASK:
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createClearDemandedTask(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_SET_READ_MESSAGE:
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createSetReadMessage(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppMessageOption == null) {
            _log.connectionLog(3, '_xmppMessageOption is null');
            return false;
        }
        var _xmppStr = _xmppMessageOption[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppMessageOption[0] is invalid');
            return false;
        }
        var _id = _xmppMessageOption[1];
        function onSetMessageOptionCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            if (_type != RequestData.MESSAGE_OPTION_TYPE_SET_READ_MESSAGE) {
                onSetMessageOptionCallBackFunc(_result, _reason);
                return;
            }
            var _itemsElem = _getItemsElemFromMessageOptionResponce(responceXmlRootElem);
            if (_itemsElem == null) {
                _log.connectionLog(3, '_itemsElem is invalid');
                onSetMessageOptionCallBackFunc(false, ERROR_REASON_XMPP_SERVER);
                return;
            }
            var _items = _getItemsFromMessageOptionSetItemsElem(_itemsElem);
            onSetMessageOptionCallBackFunc(_result, _reason, _items);
        }
        _sessionData.setCallback(_id, onSetMessageOptionCallback);

        _xsConn.send(_xmppStr);

        return true;
    };

    _proto.getMessageOption = function(accessToken, requestData,
            onGetMessageOptionCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onGetMessageOptionCallBackFunc == null
                || typeof onGetMessageOptionCallBackFunc != 'function') {
            _log.connectionLog(3, 'onGetMessageOptionCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _xmppMessageOption = null;
        var _type = requestData.type;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        switch (_type) {
        case RequestData.MESSAGE_OPTION_TYPE_GET_EXISTING_READER_LIST:
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.getExistingReaderList(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_LIST:
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.getGoodJobList(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_TOTAL:
            if(!Validation.jidValidationCheck(requestData.jid,false)){
                return false;
            }
            if(!Validation.dateValidationCheck(requestData.dateFrom, false)){
                return false;
            }
            if(!Validation.dateValidationCheck(requestData.dateTo, false)){
                return false;
            }
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.getGoodJobTotal(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_RANKING:
            if(!Validation.dateValidationCheck(requestData.dateFrom, false)){
                return false;
            }
            if(!Validation.dateValidationCheck(requestData.dateTo, false)){
                return false;
            }
            if(requestData.rankBottom != undefined &&
               ( requestData.rankBottom == null ||
                 typeof requestData.rankBottom != 'number') ){
                return false;
            }
            if(requestData.limit != undefined &&
               ( requestData.limit == null ||
                 typeof requestData.limit != 'number') ){
                return false;
            }
            if(requestData.offset != undefined &&
               ( requestData.offset == null ||
                 typeof requestData.offset != 'number') ){
                return false;
            }
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.getGoodJobRanking(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_LIST:
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.getEmotionPointList(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_TOTAL:
            if(!Validation.jidValidationCheck(requestData.jid, false)){
                return false;
            }
            if(!Validation.dateValidationCheck(requestData.dateFrom, false)){
                return false;
            }
            if(!Validation.dateValidationCheck(requestData.dateTo, false)){
                return false;
            }
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.getEmotionPointTotal(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_RANKING:
            if(!Validation.dateValidationCheck(requestData.dateFrom, false)){
                return false;
            }
            if(!Validation.dateValidationCheck(requestData.dateTo, false)){
                return false;
            }
            if(requestData.rankBottom != undefined &&
               ( requestData.rankBottom == null ||
                 typeof requestData.rankBottom != 'number') ){
                return false;
            }
            if(requestData.limit != undefined &&
               ( requestData.limit == null ||
                 typeof requestData.limit != 'number') ){
                return false;
            }
            if(requestData.offset != undefined &&
               ( requestData.offset == null ||
                 typeof requestData.offset != 'number') ){
                return false;
            }
            _xmppMessageOption = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.getEmotionPointRanking(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppMessageOption == null) {
            _log.connectionLog(3, '_xmppMessageOption is null');
            return false;
        }
        var _xmppStr = _xmppMessageOption[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppMessageOption[0] is invalid');
            return false;
        }
        var _id = _xmppMessageOption[1];
        function onGetMessageOptionCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _items = null;
            if (_result == true) {
                switch (_type) {
                case RequestData.MESSAGE_OPTION_TYPE_GET_EXISTING_READER_LIST:
                    var _itemsElem = _getItemsElemFromMessageOptionResponce(responceXmlRootElem);
                    if (_itemsElem == null) {
                        _log.connectionLog(3, '_itemsElem is invalid');
                        _onGetItemsFromMessageOptionResponce(false,
                                ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                        return;
                    }
                    var _ret = _getItemsFromGetExistingReaderListItemsElem(
                            _itemsElem, function(items) {
                                _onGetItemsFromMessageOptionResponce(_result,
                                        _reason, items);
                            });
                    if (!_ret) {
                        _onGetItemsFromMessageOptionResponce(false,
                                ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                        return;
                    }
                    break;
                case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_LIST:
                    var _itemsElem = _getItemsElemFromMessageOptionResponce(responceXmlRootElem);
                    if (_itemsElem == null) {
                        _log.connectionLog(3, '_itemsElem is invalid');
                        _onGetItemsFromMessageOptionResponce(false,
                                ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                        return;
                    }
                    _getGoodJobItemsFromGoodJobItemsXML(_itemsElem, function(retCount, retItems){
                        _onGetItemsFromMessageOptionResponce(_result, _reason, retItems);
                    });
                    break;
                case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_TOTAL:
                    var _itemsElem = _getItemsElemFromMessageOptionResponce(responceXmlRootElem);
                    if (_itemsElem == null) {
                        _log.connectionLog(3, '_itemsElem is invalid');
                        _onGetItemsFromMessageOptionResponce(false,
                                ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                        return;
                    }
                    _getGoodJobTotalFromGoodJobCountingXML(_itemsElem,(retCount, retItems) => {
                            _onGetItemsFromMessageOptionResponce(_result, _reason, retItems);
                    });
                    break;
                case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_RANKING:
                    var _itemsElem = _getItemsElemFromMessageOptionResponce(responceXmlRootElem);
                    if (_itemsElem == null) {
                        _log.connectionLog(3, '_itemsElem is invalid');
                        _onGetItemsFromMessageOptionResponce(false,
                                ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                        return;
                    }
                    _getGoodJobRankingFromGoodJobCountingXML(_itemsElem,(retCount, retItems) => {
                        _onGetItemsFromMessageOptionResponce(_result, _reason, retItems);
                    });
                    break;
                case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_LIST:
                    var _itemsElem = _getItemsElemFromMessageOptionResponce(responceXmlRootElem);
                    if (_itemsElem == null) {
                        _log.connectionLog(3, '_itemsElem is invalid');
                        _onGetItemsFromMessageOptionResponce(false,
                                ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                        return;
                    }
                    _getEmotionPointItemsFromEmotionPointItemsXML(_itemsElem, function(retCount, retItems){
                        _onGetItemsFromMessageOptionResponce(_result, _reason, retItems);
                    });
                    break;
                case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_TOTAL:
                    var _itemsElem = _getItemsElemFromMessageOptionResponce(responceXmlRootElem);
                    if (_itemsElem == null) {
                        _log.connectionLog(3, '_itemsElem is invalid');
                        _onGetItemsFromMessageOptionResponce(false,
                                ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                        return;
                    }
                    _getEmotionPointTotalFromEmotionPointCountingXML(_itemsElem, function(retCount, retItems){
                        _onGetItemsFromMessageOptionResponce(_result, _reason, retItems);
                    });
                    break;
                case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_RANKING:
                    var _itemsElem = _getItemsElemFromMessageOptionResponce(responceXmlRootElem);
                    if (_itemsElem == null) {
                        _log.connectionLog(3, '_itemsElem is invalid');
                        _onGetItemsFromMessageOptionResponce(false,
                                ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                        return;
                    }
                    _getEmotionPointRankingFromEmotionPointCountingXML(_itemsElem, function(retCount, retItems){
                        _onGetItemsFromMessageOptionResponce(_result, _reason, retItems);
                    });
                    break;
                default:
                    _log.connectionLog(3, 'request type is invalid');
                    _onGetItemsFromMessageOptionResponce(false,
                            ERROR_REASON_PARSE_RESPONSE_XMPP, null);
                    break;
                }
            } else {
                _onGetItemsFromMessageOptionResponce(false,
                        ERROR_REASON_PARSE_RESPONSE_XMPP, null);
            }

            function _onGetItemsFromMessageOptionResponce(result, reason, items) {
                var _items = items;
                if (_items == null) {
                    _items = [];
                }
                onGetMessageOptionCallBackFunc(result, reason, _items);
            }

        }
        _sessionData.setCallback(_id, onGetMessageOptionCallback);

        _xsConn.send(_xmppStr);

        return true;
    };

    function _getItemsElemFromMessageOptionResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromMessageOptionResponce :: xmlRootElem is null');
            return null;
        }
        var _messageElem = Utils.getChildXmlElement(xmlRootElem, 'message');
        if (_messageElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromMessageOptionResponce :: _messageElem is invalid');
            return null;
        }
        var _messageElemNamespace = _messageElem.namespace().href();
        if (_messageElemNamespace != 'http://necst.nec.co.jp/protocol/messageoption') {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromMessageOptionResponce :: _messageElemNamespace is not "messageoption"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_messageElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromMessageOptionResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromMessageOptionResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }

    function _getItemsFromGetExistingReaderListItemsElem(itemsElem,
            onGetItemsCallBack) {
        if (itemsElem == null) {
            return false;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        var _ret = _getExistingReaderItemsFromExistingReaderElementArray(
                _itemElemArray, _onGetExistingReaderItems);
        return _ret;

        function _onGetExistingReaderItems(items) {
            if (onGetItemsCallBack != null
                    && typeof onGetItemsCallBack == 'function') {
                onGetItemsCallBack(items);
            }
        }
    }

    function _getItemsFromMessageOptionSetItemsElem(itemsElem) {
        if (itemsElem == null) {
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            return null;
        }
        var _count = _itemElemArray.length;
        var _items = [];
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _itemData = {};
            var _itemIdElem = Utils.getChildXmlElement(_itemElem, 'item_id');
            if (_itemIdElem != null) {
                _itemData.itemId = _itemIdElem.text();
                _items.push(_itemData);
            }
        }
        return _items;
    }

    _proto.createGroup = function(accessToken, requestData,
            onCreateGroupCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onCreateGroupCallBackFunc == null
                || typeof onCreateGroupCallBackFunc != 'function') {
            _log.connectionLog(3, 'onCreateGroupCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _xmppCreateGroup = null;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        var _type = requestData.type;
        switch (_type) {
        case RequestData.CREATE_GROUP_TYPE_GROUP_CHAT_ROOM:
            _xmppCreateGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {

                return Xmpp.createCreateGroupChatRoomXmpp(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        case RequestData.CREATE_GROUP_TYPE_COMMUNITY_ROOM:
            if (requestData.memberEntryType != null) {
                var communityColor = String(requestData.memberEntryType);
                if (communityColor.startsWith('#')) {
                    communityColor = communityColor.slice(1);
                }
                if (communityColor == 0 || communityColor == 1) {
                    communityColor = '2A98E9';
                }
                if (!Utils.varidieter.memberEntryType(communityColor)) {
                    _log.connectionLog(3, 'memberEntryType is invalid');
                    var _result = false;
                    var _reason = Const.API_STATUS.BAD_REQUEST;
                    onCreateGroupCallBackFunc(_result, _reason);
                    return false;
                }
                if (communityColor.length == 3) {
                    communityColor = Utils.convertThreeWordToSix(communityColor);
                }
                requestData.memberEntryType = Utils.convertHexaToDecimal(communityColor);
            }
            _xmppCreateGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createCreateCommunityRoomXmpp(_xmppServerHostName, _fromJid, requestData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppCreateGroup == null) {
            _log.connectionLog(3, '_xmppCreateGroup is null');
            return false;
        }
        var _xmppStr = _xmppCreateGroup[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppCreateGroup[0] is invalid');
            return false;
        }
        var _id = _xmppCreateGroup[1];
        function onCreateGroupCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            var _isResponse = true;   
            if(_result == true) {
                switch(_type) {
                case RequestData.CREATE_GROUP_TYPE_GROUP_CHAT_ROOM:
                    {
                        _extras = {};
                        var _itemsElem = _getItemsElemFromCreateGroupChatRoomResponce(responceXmlRootElem);
                        if(_itemsElem != null) {
                            _isResponse = false;
                            function _onGetItemsFromGroupChatRoomInfoItemsElem(items) {
                                _items = items;
                                _callCallBackFunc();
                            }
                            _getItemsFromGroupChatRoomInfoItemsElem(_itemsElem, _onGetItemsFromGroupChatRoomInfoItemsElem);
                        }
                    }
                    break;
                case RequestData.CREATE_GROUP_TYPE_COMMUNITY_ROOM:
                    _extras = {};
                    var _itemsElem = _getItemsElemFromCreateCommunityResponce(responceXmlRootElem);
                    if(_itemsElem != null) {
                        _items = _getItemsFromCommunityInfoItemsElem(_itemsElem);
                    }
                    break;
                default :
                    _log.connectionLog(3, 'request type is invalid');
                    break;
                }
            }
            if(_isResponse) {
                _callCallBackFunc();
            }
            function _callCallBackFunc() {
                var _count = 0;
                if(_items == null) {
                    _result = false;
                    _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                    _items = [];
                } else {
                    _count = _items.length;
                }
                onCreateGroupCallBackFunc(_result, _reason, _extras, _count, _items);
            }
        }
        _sessionData.setCallback(_id, onCreateGroupCallback);

        _xsConn.send(_xmppStr);

        return true;
    };

    function _getItemsElemFromCreateGroupChatRoomResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateGroupChatRoomResponce :: xmlRootElem is null');
            return null;
        }
        var _groupElem = Utils.getChildXmlElement(xmlRootElem, 'group');
        if (_groupElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateGroupChatRoomResponce :: _groupElem is invalid');
            return null;
        }
        var _groupElemNamespace = _groupElem.namespace().href();
        if (_groupElemNamespace != 'http://necst.nec.co.jp/protocol/createchatroom') {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromCreateGroupChatRoomResponce :: _groupElemNamespace is not "createchatroom"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_groupElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateGroupChatRoomResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateGroupChatRoomResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }
    function _getItemsFromGroupChatRoomInfoItemsElem(itemsElem, onGetItemsCallBack) {
        var _retArray = [];
        if(itemsElem == null) {
            _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: itemsElem is null');
            _callCallbackFunc();
            return;
        }
        if(itemsElem.name == null || typeof itemsElem.name != 'function' || itemsElem.name() != 'items') {
            _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: itemsElem is invalid');
            _callCallbackFunc();
            return;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if(_itemElemArray == null) {
            _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _itemElemArray is null');
            _callCallbackFunc();
            return;
        }
        var _processIndex = 0;
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        _createNextItem();

        function _createNextItem() {
            if(_processIndex >= _count) {
                _callCallbackFunc();
                return;
            }
            var _i = _processIndex;    
            _processIndex++;   

            var _itemElem = _itemElemArray[_i];
            var _idElem = Utils.getChildXmlElement(_itemElem, 'id');
            if(_idElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _idElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _id = parseInt(_idElem.text());
            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomid');
            if(_roomIdElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _roomIdElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _roomId = _roomIdElem.text();
            var _roomNameElem = Utils.getChildXmlElement(_itemElem, 'roomname');
            if(_roomNameElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _roomNameElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _roomName = _roomNameElem.text();
            var _parentRoomIdElem = Utils.getChildXmlElement(_itemElem, 'parentroomid');
            if(_parentRoomIdElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _parentRoomIdElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _parentRoomId = _parentRoomIdElem.text();

            var _privacyTypeElem = Utils.getChildXmlElement(_itemElem, 'privacytype');
            if(_privacyTypeElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _privacyTypeElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _privacyType = parseInt(_privacyTypeElem.text());
            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if(_membersElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _membersElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _memberElemArray = Utils.getChildXmlElementArray(_membersElem, 'member');
            if(_memberElemArray == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _memberElemArray is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _memberCount = _memberElemArray.length;
            var _memberItems = [];
            var _memberIndex = 0;
            for ( var _j = 0; _j < _memberCount; _j++) {
                var _memberElem = _memberElemArray[_j];
                if (_memberElem == null) {
                    _log.connectionLog(3,
                            '_getItemsFromGroupChatRoomInfoItemsElem :: _memberElem is null. No.'
                                    + _i + '-' + _j);
                    continue;
                }
                var _memberJid = _memberElem.text();
                if (_memberJid == null || _memberJid == "") {
                    _log.connectionLog(3,
                            '_getItemsFromGroupChatRoomInfoItemsElem :: _memberJid is invalid. No.'
                                    + _i + '-' + _j);
                    continue;
                }
                _memberItems[_memberIndex] = _memberJid;
                _memberIndex++;
            }
            if(_memberIndex == 0) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _memberIndex is 0. No.' + _i);
                _createNextItem();
                return;
            }
            _memberCount = _memberIndex;
            var _notifyTypeElem = Utils.getChildXmlElement(_itemElem, 'notify_type');
            if(_notifyTypeElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _notifyTypeElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _notifyType = parseInt(_notifyTypeElem.text());
            var _createdAtElem = Utils.getChildXmlElement(_itemElem, 'created_at');
            if(_createdAtElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _createdAtElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _createdAt = _createdAtElem.text();
            var _createdByElem = Utils.getChildXmlElement(_itemElem, 'created_by');
            if(_createdByElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _createdByElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _createdBy = _createdByElem.text();
            var _updatedAtElem = Utils.getChildXmlElement(_itemElem, 'updated_at');
            if(_updatedAtElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _updatedAtElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _updatedAt = _updatedAtElem.text();
            var _updatedByElem = Utils.getChildXmlElement(_itemElem, 'updated_by');
            if(_updatedByElem == null) {
                _log.connectionLog(3, '_getItemsFromGroupChatRoomInfoItemsElem :: _updatedByElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _updatedBy = _updatedByElem.text();
            var _personInfoElem = Utils.getChildXmlElement(_itemElem, 'person_info');
            var _personInfo = null;
            if(_personInfoElem != null) {
                _getPersonInfoItemsFromPersonInfoElement(_personInfoElem, _onGetPersonInfoItemsFromPersonInfoElement);
            } else {
                _onGetDataEntry();
            }
            function _onGetPersonInfoItemsFromPersonInfoElement(personInfoItems){
                _personInfo = personInfoItems;
                _onGetDataEntry();
            }

            function _onGetDataEntry() {
                _retArray[_itemIndex] = {
                    id : _id,
                    roomId : _roomId,
                    roomName : _roomName,
                    parentRoomId : _parentRoomId,
                    privacyType : _privacyType,
                    memberCount : _memberCount,
                    memberItems : _memberItems,
                    notifyType : _notifyType,
                    createdAt : _createdAt,
                    createdBy : _createdBy,
                    updatedAt : _updatedAt,
                    updatedBy : _updatedBy
                };
                if(_personInfo != null) {
                    _retArray[_itemIndex].personInfo = _personInfo;
                }
                _itemIndex++;
                setTimeout(function(){
                    _createNextItem();
                }, 1);
            }
        }
        function _callCallbackFunc() {
            if(onGetItemsCallBack != null && typeof onGetItemsCallBack == 'function') {
                setTimeout(function(){
                    onGetItemsCallBack(_retArray);
                }, 1);
            }
        }
    }

    function _getItemsFromAddGroupChatMemberItemsElem(itemsElem, onGetItemsCallBack) {
        var _retArray = [];
        if(itemsElem == null) {
            _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: itemsElem is null');
            _callCallbackFunc();
            return;
        }
        if(itemsElem.name == null || typeof itemsElem.name != 'function' || itemsElem.name() != 'items') {
            _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: itemsElem is invalid');
            _callCallbackFunc();
            return;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if(_itemElemArray == null) {
            _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _itemElemArray is null');
            _callCallbackFunc();
            return;
        }
        var _processIndex = 0;
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        _createNextItem();

        function _createNextItem() {
            if(_processIndex >= _count) {
                _callCallbackFunc();
                return;
            }
            var _i = _processIndex;    
            _processIndex++;   

            var _itemElem = _itemElemArray[_i];
            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomid');
            if(_roomIdElem == null) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _roomIdElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _roomId = _roomIdElem.text();
            var _roomNameElem = Utils.getChildXmlElement(_itemElem, 'roomname');
            if(_roomNameElem == null) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _roomNameElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _roomName = _roomNameElem.text();
            var _parentRoomIdElem = Utils.getChildXmlElement(_itemElem, 'parentroomid');
            if(_parentRoomIdElem == null) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _parentRoomIdElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _parentRoomId = _parentRoomIdElem.text();

            var _privacyTypeElem = Utils.getChildXmlElement(_itemElem, 'privacytype');
            if(_privacyTypeElem == null) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _privacyTypeElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _privacyType = parseInt(_privacyTypeElem.text());

            var _addedByElem = Utils.getChildXmlElement(_itemElem, 'added_by');
            if(_addedByElem == null) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _addedByElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _addedBy = _addedByElem.text();

            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if(_membersElem == null) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _membersElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _memberElemArray = Utils.getChildXmlElementArray(_membersElem, 'member');
            if(_memberElemArray == null) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _memberElemArray is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _memberCount = _memberElemArray.length;
            var _memberItems = [];
            var _memberIndex = 0;
            for ( var _j = 0; _j < _memberCount; _j++) {
                var _memberElem = _memberElemArray[_j];
                if (_memberElem == null) {
                    _log.connectionLog(3,
                            '_getItemsFromAddGroupChatMemberItemsElem :: _memberElem is null. No.'
                                    + _i + '-' + _j);
                    continue;
                }
                var _memberJid = _memberElem.text();
                if (_memberJid == null || _memberJid == "") {
                    _log.connectionLog(3,
                            '_getItemsFromAddGroupChatMemberItemsElem :: _memberJid is invalid. No.'
                                    + _i + '-' + _j);
                    continue;
                }
                _memberItems[_memberIndex] = _memberJid;
                _memberIndex++;
            }
            if(_memberIndex == 0) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _memberIndex is 0. No.' + _i);
                _createNextItem();
                return;
            }
            _memberCount = _memberIndex;

            var _notifyTypeElem = Utils.getChildXmlElement(_itemElem, 'notify_type');
            if(_notifyTypeElem == null) {
                _log.connectionLog(3, '_getItemsFromAddGroupChatMemberItemsElem :: _notifyTypeElem is null. No.' + _i);
                _createNextItem();
                return;
            }
            var _notifyType = parseInt(_notifyTypeElem.text());

            var _personInfoElem = Utils.getChildXmlElement(_itemElem, 'person_info');
            var _personInfo = null;
            if(_personInfoElem != null) {
                _getPersonInfoItemsFromPersonInfoElement(_personInfoElem, _onGetPersonInfoItemsFromPersonInfoElement);
            } else {
                _onGetDataEntry();
            }
            function _onGetPersonInfoItemsFromPersonInfoElement(personInfoItems){
                _personInfo = personInfoItems;
                _onGetDataEntry();
            }

            function _onGetDataEntry() {
                _retArray[_itemIndex] = {
                    roomId : _roomId,
                    roomName : _roomName,
                    parentRoomId : _parentRoomId,
                    privacyType : _privacyType,
                    addedBy : _addedBy,
                    count : _memberCount,
                    members : _memberItems,
                    notifyType : _notifyType,
                };
                if(_personInfo != null) {
                    _retArray[_itemIndex].personInfo = _personInfo;
                }
                _itemIndex++;
                setTimeout(function(){
                    _createNextItem();
                }, 1);
            }
        }
        function _callCallbackFunc() {
            if(onGetItemsCallBack != null && typeof onGetItemsCallBack == 'function') {
                setTimeout(function(){
                    onGetItemsCallBack(_retArray);
                }, 1);
            }
        }
    }

    function _getItemsElemFromCreateCommunityResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateCommunityResponce :: xmlRootElem is null');
            return null;
        }
        var _groupElem = Utils.getChildXmlElement(xmlRootElem, 'group');
        if (_groupElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateCommunityResponce :: _groupElem is invalid');
            return null;
        }
        var _groupElemNamespace = _groupElem.namespace().href();
        if (_groupElemNamespace != 'http://necst.nec.co.jp/protocol/createcommunity') {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromCreateCommunityResponce :: _groupElemNamespace is not "createcommunity"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_groupElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateCommunityResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateCommunityResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }

    function _getItemsFromCommunityInfoItemsElem(itemsElem) {
        if (itemsElem == null) {
            _log.connectionLog(3,
                    '_getItemsFromCommunityInfoItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || typeof itemsElem.name != 'function'
                || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromCommunityInfoItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromCommunityInfoItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _idElem = Utils.getChildXmlElement(_itemElem, 'id');
            if (_idElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _idElem is null. No.'
                                + _i);
                continue;
            }
            var _id = parseInt(_idElem.text());
            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomid');
            if (_roomIdElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _roomIdElem is null. No.'
                                + _i);
                continue;
            }
            var _roomId = _roomIdElem.text();
            var _roomNameElem = Utils.getChildXmlElement(_itemElem, 'roomname');
            if (_roomNameElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _roomNameElem is null. No.'
                                + _i);
                continue;
            }
            var _roomName = _roomNameElem.text();
            var _descriptionElem = Utils.getChildXmlElement(_itemElem,
                    'description');
            if (_descriptionElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _descriptionElem is null. No.'
                                + _i);
                continue;
            }
            var _description = _descriptionElem.text();
            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if (_membersElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _membersElem is null. No.'
                                + _i);
                continue;
            }
            var _memberCountAttr = _membersElem.attr('count');
            if (_memberCountAttr == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _memberCountAttr is null. No.'
                                + _i);
                continue;
            }
            var _memberCount = parseInt(_memberCountAttr.value());
            var _privacyTypeElem = Utils.getChildXmlElement(_itemElem,
                    'privacytype');
            if (_privacyTypeElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _privacyTypeElem is null. No.'
                                + _i);
                continue;
            }
            var _privacyType = parseInt(_privacyTypeElem.text());
            var _memberEntryTypeElem = Utils.getChildXmlElement(_itemElem,
                    'memberentrytype');
            if (_memberEntryTypeElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _memberEntryTypeElem is null. No.'
                                + _i);
                continue;
            }
            var _memberEntryType = parseInt(_memberEntryTypeElem.text());
            if (_memberEntryType == 0) {
                _memberEntryType = 2791657;
            }
            _memberEntryType = Utils.convertDecimalToHexa(_memberEntryType);
            var _logoUrlElem = Utils.getChildXmlElement(_itemElem, 'logourl');
            if (_logoUrlElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _logoUrlElem is null. No.'
                                + _i);
                continue;
            }
            var _logoUrl = _logoUrlElem.text();

            var _notifyTypeElem = Utils.getChildXmlElement(_itemElem, 'notify_type');
            if(_notifyTypeElem == null) {
                _log.connectionLog(3, '_getItemsFromCommunityInfoItemsElem :: _notifyTypeElem is null. No.' + _i);
                continue;
            }
            var _notifyType = parseInt(_notifyTypeElem.text());

            var _createdAtElem = Utils.getChildXmlElement(_itemElem,
                    'created_at');
            if (_createdAtElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _createdAtElem is null. No.'
                                + _i);
                continue;
            }
            var _createdAt = _createdAtElem.text();
            var _createdByElem = Utils.getChildXmlElement(_itemElem,
                    'created_by');
            if (_createdByElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _createdByElem is null. No.'
                                + _i);
                continue;
            }
            var _createdBy = _createdByElem.text();
            var _updatedAtElem = Utils.getChildXmlElement(_itemElem,
                    'updated_at');
            if (_updatedAtElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _updatedAtElem is null. No.'
                                + _i);
                continue;
            }
            var _updatedAt = _updatedAtElem.text();
            var _updatedByElem = Utils.getChildXmlElement(_itemElem,
                    'updated_by');
            if (_updatedByElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityInfoItemsElem :: _updatedByElem is null. No.'
                                + _i);
                continue;
            }
            var _updatedBy = _updatedByElem.text();
            _retArray[_itemIndex] = {
                id : _id,
                roomId : _roomId,
                roomName : _roomName,
                description : _description,
                memberCount : _memberCount,
                privacyType : _privacyType,
                memberEntryType : _memberEntryType,
                logoUrl : _logoUrl,
                notifyType : _notifyType,
                createdAt : _createdAt,
                createdBy : _createdBy,
                updatedAt : _updatedAt,
                updatedBy : _updatedBy
            };
            _itemIndex++;
        }
        return _retArray;
    }

    _proto.getGroup = function(accessToken, requestData, onGetGroupCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onGetGroupCallBackFunc == null
                || typeof onGetGroupCallBackFunc != 'function') {
            _log.connectionLog(3, 'onGetGroupCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _xmppGetGroup = null;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        var _type = requestData.type;
        switch (_type) {
        case RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_INFO:
            var _roomId = requestData.roomId;
            _xmppGetGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetGroupChatRoomInfoXmpp(_xmppServerHostName, _fromJid, _roomId);
            });
            break;
        case RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_LIST:
            var _groupChatRoomListRequestData = requestData;
            if(!Validation.privacyTypeValidationCheck(
                _groupChatRoomListRequestData.privacyType, false)){
                return false;
            }
            if(!Validation.listTypeValidationCheck(
                _groupChatRoomListRequestData.listType, false)){
                return false;
            }
            _xmppGetGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createGetGroupChatRoomListXmpp(
                    _xmppServerHostName, _fromJid, _groupChatRoomListRequestData);
            });
            break;
        case RequestData.GET_GROUP_TYPE_MY_COMMUNITY_LIST:
            var _myCommunityListRequestData = requestData;
            if(!Validation.privacyTypeValidationCheck(
                _myCommunityListRequestData.privacyType, false)){
                return false;
            }
            if(!Validation.listTypeValidationCheck(
                _myCommunityListRequestData.listType, false)){
                return false;
            }
            _xmppGetGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetMyCommunityListXmpp(
                        _xmppServerHostName, _fromJid, _myCommunityListRequestData);
            });
            break;
        case RequestData.GET_GROUP_TYPE_COMMUNITY_INFO:
            var _communityInfoRequestData = requestData;
            _xmppGetGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetCommunityInfoXmpp(
                        _xmppServerHostName, _fromJid, _communityInfoRequestData);
            });
            break;
        case RequestData.GET_GROUP_TYPE_COMMUNITY_MEMBER_INFO:
            var _communityMemberInfoRequestData = requestData;
            _xmppGetGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetCommunityMemberInfoXmpp(
                        _xmppServerHostName, _fromJid, _communityMemberInfoRequestData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppGetGroup == null) {
            _log.connectionLog(3, '_xmppGetGroup is null');
            return false;
        }
        var _xmppStr = _xmppGetGroup[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppGetGroup[0] is invalid');
            return false;
        }
        var _id = _xmppGetGroup[1];
        function onGetGroupCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _isResponse = true; 
            var _extras = {};
            var _items = null;
            if(_result == true) {
                switch(_type) {
                case RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_INFO:
                    _extras = {};
                    var _namesapace = 'http://necst.nec.co.jp/protocol/getchatroominfo';
                    var _itemsElem = _getItemsElemFromGetGroupListResponce(responceXmlRootElem, _namesapace);
                    if(_itemsElem != null) {
                        _isResponse = false;
                        function _onGetItemsFromGroupChatRoomInfoItemsElemForGroupChatRoomInfo(items) {
                            _items = items;
                            _callCallBackFunc();
                        }
                        _getItemsFromGroupChatRoomInfoItemsElem(_itemsElem, _onGetItemsFromGroupChatRoomInfoItemsElemForGroupChatRoomInfo);
                    }
                    break;
                case RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_LIST:
                    _extras = {};
                    var _namesapace = 'http://necst.nec.co.jp/protocol/getgroupchatlist';
                    var _itemsElem = _getItemsElemFromGetGroupListResponce(responceXmlRootElem, _namesapace);
                    if(_itemsElem != null) {
                        _isResponse = false;
                        function _onGetItemsFromGroupChatRoomInfoItemsElemForGroupChatList(items) {
                            _items = items;
                            _callCallBackFunc();
                        }
                        _getItemsFromGroupChatRoomInfoItemsElem(_itemsElem, _onGetItemsFromGroupChatRoomInfoItemsElemForGroupChatList);
                    }
                    break;
                case RequestData.GET_GROUP_TYPE_MY_COMMUNITY_LIST:
                    _extras = {};
                    var _namesapace = 'http://necst.nec.co.jp/protocol/getmycommunitylist';
                    var _itemsElem = _getItemsElemFromGetGroupListResponce(responceXmlRootElem, _namesapace);
                    if(_itemsElem != null) {
                        _items = _getItemsFromCommunityInfoItemsElem(_itemsElem);
                    }
                    break;
                case RequestData.GET_GROUP_TYPE_COMMUNITY_INFO:
                    _extras = {};
                    var _namesapace = 'http://necst.nec.co.jp/protocol/getcommunityinfo';
                    var _itemsElem = _getItemsElemFromGetGroupListResponce(responceXmlRootElem, _namesapace);
                    if(_itemsElem != null) {
                        _items = _getItemsFromCommunityInfoItemsElem(_itemsElem);
                    }
                    break;
                case RequestData.GET_GROUP_TYPE_COMMUNITY_MEMBER_INFO:
                    _extras = {};
                    var _itemsElem = _getItemsElemFromGetCommunityMemberInfoResponce(responceXmlRootElem);
                    if(_itemsElem != null) {
                        _items = _getItemsFromCommunityMemberInfoItemsElem(_itemsElem);
                        if(_items != null && _items.length > 0) {
                            _isResponse = false;
                            var _jidList = [];
                            var _jidHash = {};
                            var _itemCount = _items.length;
                            for(var _i = 0; _i < _itemCount; _i++) {
                                var _item = _items[_i];
                                var _memberItems = _item.memberItems;
                                var _ownerItems = _memberItems.ownerItems;
                                var _ownerCount = _ownerItems.length;
                                for ( var _j = 0; _j < _ownerCount; _j++) {
                                    var _ownerItem = _ownerItems[_j];
                                    var _jid = _ownerItem.jid;
                                    if (_jidHash[_jid] == null) {
                                        _jidList.push(_jid);
                                        _jidHash[_jid] = true;
                                    }
                                }
                                var _generalMemberItems = _memberItems.generalMemberItems;
                                var _generalMemberCount = _generalMemberItems.length;
                                for ( var _j = 0; _j < _generalMemberCount; _j++) {
                                    var _generalMemberItem = _generalMemberItems[_j];
                                    var _jid = _generalMemberItem.jid;
                                    if (_jidHash[_jid] == null) {
                                        _jidList.push(_jid);
                                        _jidHash[_jid] = true;
                                    }
                                }
                            }
                            if(_jidList.length > 0) {
                                UserAccountUtils.getLoginAccountListByJidList(_jidList, _onGetUserAccountDataCallBack);
                            } else {
                                _isResponse = true;
                            }
                            function _onGetUserAccountDataCallBack(mapData){
                                for(var _i = 0; _i < _itemCount; _i++) {
                                    var _item = _items[_i];
                                    var _memberItems = _item.memberItems;
                                    var _ownerItems = _memberItems.ownerItems;
                                    var _ownerCount = _ownerItems.length;
                                    for(var _j = 0; _j < _ownerCount; _j++) {
                                        var _ownerItem = _ownerItems[_j];
                                        _ownerItem.userName = mapData[_ownerItem.jid];
                                    }
                                    var _generalMemberItems = _memberItems.generalMemberItems;
                                    var _generalMemberCount = _generalMemberItems.length;
                                    for(var _j = 0; _j < _generalMemberCount; _j++) {
                                        var _generalMemberItem = _generalMemberItems[_j];
                                        _generalMemberItem.userName = mapData[_generalMemberItem.jid];
                                    }
                                }
                                _callCallBackFunc();
                            }
                        }
                    }
                    break;
                default:
                    _log.connectionLog(3, 'request type is invalid');
                    break;
                }
            }
            if(_isResponse == true) {
                _callCallBackFunc();
            }
            function _callCallBackFunc() {
                var _count = 0;
                if(_items == null) {
                    _result = false;
                    _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                    _items = [];
                } else {
                    _count = _items.length;
                }
                onGetGroupCallBackFunc(_result, _reason, _extras, _count, _items);
            }
        }
        _sessionData.setCallback(_id, onGetGroupCallback);

        _xsConn.send(_xmppStr);

        return true;
    };

    function _getItemsElemFromGetGroupListResponce(xmlRootElem, namespace) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetGroupListResponce :: xmlRootElem is null');
            return null;
        }
        var _groupElem = Utils.getChildXmlElement(xmlRootElem, 'group');
        if (_groupElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetGroupListResponce :: _groupElem is invalid');
            return null;
        }
        var _groupElemNamespace = _groupElem.namespace().href();
        if (_groupElemNamespace != namespace) {
            _log.connectionLog(3,
                    '_getItemsElemFromGetGroupListResponce :: _groupElemNamespace is not "'
                            + namespace + '"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_groupElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetGroupListResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetGroupListResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }

    function _getItemsElemFromGetCommunityMemberInfoResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetCommunityMemberInfoResponce :: xmlRootElem is null');
            return null;
        }
        var _groupElem = Utils.getChildXmlElement(xmlRootElem, 'group');
        if (_groupElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetCommunityMemberInfoResponce :: _groupElem is invalid');
            return null;
        }
        var _groupElemNamespace = _groupElem.namespace().href();
        var _namespace = 'http://necst.nec.co.jp/protocol/getcommunitymemberinfo';
        if (_groupElemNamespace != _namespace) {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromGetCommunityMemberInfoResponce :: _groupElemNamespace is not "'
                                    + namespace + '"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_groupElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetCommunityMemberInfoResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetCommunityMemberInfoResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }

    function _getItemsFromCommunityMemberInfoItemsElem(itemsElem) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromCommunityMemberInfoItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || typeof itemsElem.name != 'function'
                || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromCommunityMemberInfoItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromCommunityMemberInfoItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _idElem = Utils.getChildXmlElement(_itemElem, 'id');
            if (_idElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityMemberInfoItemsElem :: _idElem is null. No.'
                                + _i);
                continue;
            }
            var _id = parseInt(_idElem.text());
            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomid');
            if (_roomIdElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityMemberInfoItemsElem :: _roomIdElem is null. No.'
                                + _i);
                continue;
            }
            var _roomId = _roomIdElem.text();
            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if (_membersElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCommunityMemberInfoItemsElem :: _membersElem is null. No.'
                                + _i);
                continue;
            }
            var _ownerArray = _getOwnerItemsFromCommunityMemberInfoMembersElem(_membersElem);
            var _generalMemberArray = _getGeneralMemberItemsFromCommunityMemberInfoMembersElem(_membersElem);
            var _memberCount = ((_ownerArray) ? _ownerArray.length : 0)
                    + ((_generalMemberArray) ? _generalMemberArray.length : 0);
            var _memberItems = {
                ownerItems : (_ownerArray) ? _ownerArray : [],
                generalMemberItems : (_generalMemberArray) ? _generalMemberArray
                        : []
            };
            _retArray[_itemIndex] = {
                id : _id,
                roomId : _roomId,
                memberCount : _memberCount,
                memberItems : _memberItems
            };
            _itemIndex++;
        }
        return _retArray;
    }

    function _getOwnerItemsFromCommunityMemberInfoMembersElem(membersElem) {
        var _retArray = [];
        var _ownerElemArray = Utils.getChildXmlElementArray(membersElem,
                'owner');
        var _count = _ownerElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _ownerElem = _ownerElemArray[_i];
            var _ownerData = _getMemberDataFromProfileElem(_ownerElem);
            if (_ownerData == null) {
                continue;
            }
            _retArray.push(_ownerData);
        }
        return _retArray;
    }

    function _getGeneralMemberItemsFromCommunityMemberInfoMembersElem(
            membersElem) {
        var _retArray = [];
        var _generalMemberElemArray = Utils.getChildXmlElementArray(
                membersElem, 'generalmember');
        var _count = _generalMemberElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _generalMemberElem = _generalMemberElemArray[_i];
            var _generalMember = _getMemberDataFromProfileElem(_generalMemberElem);
            if (_generalMember == null) {
                continue;
            }
            _retArray.push(_generalMember);
        }
        return _retArray;
    }

    function _getMemberDataFromProfileElem(memberElem) {
        var _ret = {};
        var _jidElem = Utils.getChildXmlElement(memberElem, 'jid');
        if (_jidElem != null) {
            _ret.jid = _jidElem.text();
        } else {
            return null;
        }
        var _nickNameElem = Utils.getChildXmlElement(memberElem, 'nickName');
        if (_nickNameElem != null) {
            _ret.nickName = _nickNameElem.text();
        } else {
            return null;
        }
        var _avatarTypeElem = Utils
                .getChildXmlElement(memberElem, 'avatarType');
        if (_avatarTypeElem != null) {
            _ret.avatarType = _avatarTypeElem.text();
        } else {
            return null;
        }
        var _avatarDataElem = Utils
                .getChildXmlElement(memberElem, 'avatarData');
        if (_avatarDataElem != null) {
            _ret.avatarData = _avatarDataElem.text();
        } else {
            return null;
        }
        var _statusElem = Utils.getChildXmlElement(memberElem, 'status');
        if (_statusElem != null) {
            _ret.status = parseInt(_statusElem.text());
        } else {
            return null;
        }
        var _roleElem = Utils.getChildXmlElement(memberElem, 'role');
        if (_roleElem != null) {
            _ret.role = parseInt(_roleElem.text());
        } else {
            return null;
        }
        return _ret;
    }

    _proto.updateGroup = function(accessToken, requestData,
            onUpdateGroupCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onUpdateGroupCallBackFunc == null
                || typeof onUpdateGroupCallBackFunc != 'function') {
            _log.connectionLog(3, 'onUpdateGroupCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _logoDataFileList = new Array();
        var _xmppUpdateGroup = null;
        var _type = requestData.type;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _tenantUuid = _sessionData.getTenantUuid();
        var _fromJid = _sessionData.getJid();
        switch (_type) {
        case RequestData.UPDATE_GROUP_TYPE_GROUP_CHAT_ROOM_INFO:
            var _updateGroupChatRoomInfoRequestData = requestData;

            if(!Validation.privacyTypeValidationCheck(
                _updateGroupChatRoomInfoRequestData.privacyType, false)){
                onUpdateGroupCallBackFunc(false,
                                          Const.API_STATUS.BAD_REQUEST,
                                          null, 0, {});
                return false;
            }
            if(_updateGroupChatRoomInfoRequestData.privacyType != undefined &&
                (
                _updateGroupChatRoomInfoRequestData.extras == undefined ||
                typeof _updateGroupChatRoomInfoRequestData.extras != 'object' ||
                _updateGroupChatRoomInfoRequestData.extras.subType == undefined ||
                _updateGroupChatRoomInfoRequestData.extras.subType == null ||
                !Array.isArray(_updateGroupChatRoomInfoRequestData.extras.subType) ||
                _updateGroupChatRoomInfoRequestData.extras.subType.indexOf("ChangePrivacyType") < 0
                )
            ){
                onUpdateGroupCallBackFunc(false,
                                          Const.API_STATUS.BAD_REQUEST,
                                          null, 0, {});
                return false;
            }
            _xmppUpdateGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createUpdateGroupChatRoomInfo(
                        _xmppServerHostName, _fromJid, _updateGroupChatRoomInfoRequestData);
            });
            break;
        case RequestData.UPDATE_GROUP_TYPE_COMMUNITY_ROOM_INFO:
            var _updateCommunityInfoRequestData = requestData;
            var _imageFileUtils = ImageFileUtils.getInstance();
            _logoDataFileList = _imageFileUtils.getCommunityFilePathList(
                    _tenantUuid,
                    _updateCommunityInfoRequestData.roomId,
                    _xmppServerHostName, ImageFileUtils.USE_TYPE_LOGO,
                    ImageFileUtils.PREFIX_ORIGINAL);
            if (requestData.memberEntryType != null) {
                var communityColor = String(requestData.memberEntryType);
                if (communityColor.startsWith('#')) {
                    communityColor = communityColor.slice(1);
                }
                if (communityColor == 0 || communityColor == 1) {
                    communityColor = '2A98E9';
                }
                if (!Utils.varidieter.memberEntryType(communityColor)) {
                    _log.connectionLog(3, 'memberEntryType is invalid');
                    return false;
                }
                if (communityColor.length == 3) {
                    communityColor = Utils.convertThreeWordToSix(communityColor);
                }
                requestData.memberEntryType = Utils.convertHexaToDecimal(communityColor);
            }
            var _updateCommunityInfoRequestData = requestData;
            _xmppUpdateGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createUpdateCommunityInfo(
                        _xmppServerHostName, _fromJid, _updateCommunityInfoRequestData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppUpdateGroup == null) {
            _log.connectionLog(3, '_xmppUpdateGroup is null');
            return false;
        }
        var _xmppStr = _xmppUpdateGroup[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppUpdateGroup[0] is invalid');
            return false;
        }
        var _id = _xmppUpdateGroup[1];
        function _onUpdateGroupCallBack(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _count = 0;
            var _items = [];
            if (_result == true) {
                switch (_type) {
                case RequestData.UPDATE_GROUP_TYPE_GROUP_CHAT_ROOM_INFO:
                    break;
                case RequestData.UPDATE_GROUP_TYPE_COMMUNITY_ROOM_INFO:
                    var _imageFileUtils = ImageFileUtils.getInstance();
                    for ( var _i = 0; _i < _logoDataFileList.length; _i++) {
                        if (_logoDataFileList[_i] == requestData.logoUrl) {
                            continue;
                        }
                        if (_imageFileUtils.deleteFile(_logoDataFileList[_i]) == false) {
                            _log.connectionLog(3,
                                    'updateGroup::delete file is failed');
                        }
                    }
                    var _extrasElem = _getExtrasElemFromUpdateCommunityResponce(responceXmlRootElem);
                    if (_extrasElem != null) {
                        _extras = _getExtrasFromUpdateCommunityInfoExtrasElem(_extrasElem);
                    }
                    var _itemsElem = _getItemsElemFromUpdateCommunityResponce(responceXmlRootElem);
                    if (_itemsElem != null) {
                        _items = _getItemsFromCommunityInfoItemsElem(_itemsElem);
                        if (_items == null) {
                            _result = false;
                            _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                            _items = [];
                            _extras = {};
                        } else {
                            _count = _items.length;
                        }
                    }
                    break;
                default:
                    _log.connectionLog(3, 'request type is invalid');
                    break;
                }
            }
            onUpdateGroupCallBackFunc(_result, _reason, _extras, _count, _items);
        }
        _sessionData.setCallback(_id, _onUpdateGroupCallBack);

        _xsConn.send(_xmppStr);

        return true;
    };

    _proto.deleteGroup = function(accessToken, requestData,
            onDeleteGroupCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onDeleteGroupCallBackFunc == null
                || typeof onDeleteGroupCallBackFunc != 'function') {
            _log.connectionLog(3, 'onDeleteGroupCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _logoDataFileList = new Array();
        var _xmppDeleteGroup = null;
        var _type = requestData.type;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _tenantUuid = _sessionData.getTenantUuid();
        var _fromJid = _sessionData.getJid();
        switch (_type) {
        case RequestData.DELETE_GROUP_TYPE_GROUP_CHAT_ROOM:
            var _deleteGroupChatRoomInfoRequestData = requestData;
            _xmppDeleteGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createDeleteGroupChatRoomInfo(
                        _xmppServerHostName, _fromJid, _deleteGroupChatRoomInfoRequestData);
            });
            break;
        case RequestData.DELETE_GROUP_TYPE_COMMUNITY_ROOM:
            var _deleteCommunityRoomInfoRequestData = requestData;
            _xmppDeleteGroup = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createDeleteCommunityXmpp(
                        _xmppServerHostName, _fromJid, _deleteCommunityRoomInfoRequestData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppDeleteGroup == null) {
            _log.connectionLog(3, '_xmppDeleteGroup is null');
            return false;
        }
        var _xmppStr = _xmppDeleteGroup[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppDeleteGroup[0] is invalid');
            return false;
        }
        var _id = _xmppDeleteGroup[1];
        function _onDeleteGroupCallBack(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _count = 0;
            var _items = [];

            onDeleteGroupCallBackFunc(_result, _reason, _extras, _count, _items);
        }
        _sessionData.setCallback(_id, _onDeleteGroupCallBack);

        _xsConn.send(_xmppStr);

        return true;
    };

    function _getExtrasElemFromUpdateCommunityResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasElemFromUpdateCommunityResponce :: xmlRootElem is null');
            return null;
        }
        var _groupElem = Utils.getChildXmlElement(xmlRootElem, 'group');
        if (_groupElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasElemFromUpdateCommunityResponce :: _groupElem is invalid');
            return null;
        }
        var _groupElemNamespace = _groupElem.namespace().href();
        if (_groupElemNamespace != 'http://necst.nec.co.jp/protocol/updatecommunityinfo') {
            _log
                    .connectionLog(
                            3,
                            '_getExtrasElemFromUpdateCommunityResponce :: _groupElemNamespace is not "updatecommunityinfo"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_groupElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasElemFromUpdateCommunityResponce :: _contentElem is invalid');
            return null;
        }
        var _extrasElem = Utils.getChildXmlElement(_contentElem, 'extras');
        if (_extrasElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasElemFromUpdateCommunityResponce :: _extrasElem is invalid');
            return null;
        }
        return _extrasElem;
    }

    function _getExtrasFromUpdateCommunityInfoExtrasElem(extrasElem) {
        var _ret = {};
        if (extrasElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: extrasElem is null');
            return _ret;
        }
        var _preInfoElem = Utils.getChildXmlElement(extrasElem, 'preinfo');
        if (_preInfoElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _preInfoElem is invalid');
            return _ret;
        }
        var _idElem = Utils.getChildXmlElement(_preInfoElem, 'id');
        if (_idElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _idElem is null.');
            return _ret;
        }
        var _id = parseInt(_idElem.text());
        var _roomIdElem = Utils.getChildXmlElement(_preInfoElem, 'roomid');
        if (_roomIdElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _roomIdElem is null.');
            return _ret;
        }
        var _roomId = _roomIdElem.text();
        var _roomNameElem = Utils.getChildXmlElement(_preInfoElem, 'roomname');
        if (_roomNameElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _roomNameElem is null.');
            return _ret;
        }
        var _roomName = _roomNameElem.text();
        var _descriptionElem = Utils.getChildXmlElement(_preInfoElem,
                'description');
        if (_descriptionElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _descriptionElem is null.');
            return _ret;
        }
        var _description = _descriptionElem.text();
        var _membersElem = Utils.getChildXmlElement(_preInfoElem, 'members');
        if (_membersElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _membersElem is null.');
            return _ret;
        }
        var _memberCountAttr = _membersElem.attr('count');
        if (_memberCountAttr == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _memberCountAttr is null.');
            return _ret;
        }
        var _memberCount = parseInt(_memberCountAttr.value());
        var _privacyTypeElem = Utils.getChildXmlElement(_preInfoElem,
                'privacytype');
        if (_privacyTypeElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _privacyTypeElem is null.');
            return _ret;
        }
        var _privacyType = parseInt(_privacyTypeElem.text());
        var _memberEntryTypeElem = Utils.getChildXmlElement(_preInfoElem,
                'memberentrytype');
        if (_memberEntryTypeElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _memberEntryTypeElem is null.');
            return _ret;
        }
        var _memberEntryType = parseInt(_memberEntryTypeElem.text());
        if (_memberEntryType == 0) {
            _memberEntryType = 2791657;
        }
        _memberEntryType = Utils.convertDecimalToHexa(_memberEntryType);
        var _logoUrlElem = Utils.getChildXmlElement(_preInfoElem, 'logourl');
        if (_logoUrlElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityInfoExtrasElem :: _logoUrlElem is null.');
            return _ret;
        }
        var _logoUrl = _logoUrlElem.text();

        var _notifyTypeElem = Utils.getChildXmlElement(_preInfoElem, 'notify_type');
        if(_notifyTypeElem == null) {
            _log.connectionLog(3, '_getExtrasFromUpdateCommunityInfoExtrasElem :: _notifyTypeElem is null.');
            return _ret;
        }
        var _notifyType = parseInt(_notifyTypeElem.text());

        var _preInfo = {
            id : _id,
            roomId : _roomId,
            roomName : _roomName,
            description : _description,
            memberCount : _memberCount,
            privacyType : _privacyType,
            memberEntryType : _memberEntryType,
            logoUrl : _logoUrl,
            notifyType : _notifyType,
        };

        _ret.preInfo = _preInfo;
        return _ret;
    }

    function _getItemsElemFromUpdateCommunityResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromUpdateCommunityResponce :: xmlRootElem is null');
            return null;
        }
        var _groupElem = Utils.getChildXmlElement(xmlRootElem, 'group');
        if (_groupElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromUpdateCommunityResponce :: _groupElem is invalid');
            return null;
        }
        var _groupElemNamespace = _groupElem.namespace().href();
        if (_groupElemNamespace != 'http://necst.nec.co.jp/protocol/updatecommunityinfo') {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromUpdateCommunityResponce :: _groupElemNamespace is not "updatecommunityinfo"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_groupElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromUpdateCommunityResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromUpdateCommunityResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }

    _proto.addMember = function(accessToken, requestData,
            onAddMemberCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onAddMemberCallBackFunc == null
                || typeof onAddMemberCallBackFunc != 'function') {
            _log.connectionLog(3, 'onAddMemberCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _xmppAddMember = null;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        var _type = requestData.type;
        switch (_type) {
        case RequestData.ADD_MEMBER_TYPE_GROUP_CHAT_ROOM:
            var _addGroupChatMemberRequestData = requestData;
            _xmppAddMember = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createAddGroupChatMemberXmpp(
                    _xmppServerHostName, _fromJid, _addGroupChatMemberRequestData);
            });
            break;
        case RequestData.ADD_MEMBER_TYPE_COMMUNITY_ROOM:
            var _addCommunityMemberRequestData = requestData;
            _xmppAddMember = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createAddCommunityMemberXmpp(
                        _xmppServerHostName, _fromJid, _addCommunityMemberRequestData);
            });
            break;
        case RequestData.ADD_MEMBER_TYPE_CONTACT_LIST:
            var _addContactListMemberRequestData = requestData;
            _xmppAddMember = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createAddContactListMemberXmpp(
                        _xmppServerHostName, _fromJid, _addContactListMemberRequestData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppAddMember == null) {
            _log.connectionLog(3, '_xmppGetGroup is null');
            return false;
        }
        var _xmppStr = _xmppAddMember[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppAddMember[0] is invalid');
            return false;
        }
        var _id = _xmppAddMember[1];
        function onAddMemberCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _isResponse = true; 
            var _extras = {};
            var _items = null;
            if(_result == true) {
                switch(_type) {
                case RequestData.ADD_MEMBER_TYPE_GROUP_CHAT_ROOM:
                    _extras = {};
                    var _itemsElem = _getItemsElemFromAddOrRemoveGroupResponce(responceXmlRootElem, 'http://necst.nec.co.jp/protocol/addchatroommember');
                    if(_itemsElem != null) {
                        _isResponse = false;
                        function _onGetItemsFromAddGroupChatMemberItemsElem(items) {
                            _items = items;
                            _callCallBackFunc();
                        }
                        _getItemsFromAddGroupChatMemberItemsElem(_itemsElem, _onGetItemsFromAddGroupChatMemberItemsElem);
                    }
                    break;
                case RequestData.ADD_MEMBER_TYPE_COMMUNITY_ROOM:
                    _extras = {};
                    var _itemsElem = _getItemsElemFromAddOrRemoveGroupResponce(responceXmlRootElem, 'http://necst.nec.co.jp/protocol/addcommunitymember');
                    if(_itemsElem == null) {
                        _log.connectionLog(3, 'SynchronousBridgeNodeXmpp#addMember(onAddMemberCallback):: _itemsElem is invalid (' + RequestData.ADD_MEMBER_TYPE_COMMUNITY_ROOM + ')');
                        break;
                    }
                    _items = _getItemsFromAddCommunityMemberItemsElem(_itemsElem);
                    if(_items == null || _items.length <= 0) {
                        _log.connectionLog(3, 'SynchronousBridgeNodeXmpp#addMember(onAddMemberCallback):: _items is invalid (' + RequestData.ADD_MEMBER_TYPE_COMMUNITY_ROOM + ')');
                        break;
                    }

                    _isResponse = false;
                    _appendCubeeAccountForAddMemberResponseOrNotification(_items, _onAppendCubeeAccountCallback);
                    function _onAppendCubeeAccountCallback(returnItems){
                        _items = returnItems;
                        _callCallBackFunc();
                    }
                    break;
                case RequestData.ADD_MEMBER_TYPE_CONTACT_LIST:
                    _extras = {};
                    var _itemsElem = _getItemsElemFromAddOrRemoveContactMemberResponce(responceXmlRootElem, 'http://necst.nec.co.jp/protocol/addcontactlistmember');
                    if(_itemsElem != null) {
                        _isResponse = false;
                        function _onGetItemsFromAddContactListMemberItemsElem(items) {
                            _items = items;
                            _callCallBackFunc();
                        }
                        _getItemsFromAddContactListMemberItemsElem(_itemsElem, _onGetItemsFromAddContactListMemberItemsElem);
                    }
                    break;
                default :
                    _log.connectionLog(3, 'request type is invalid');
                    break;
                }
            }

            if(_isResponse == true) {
                _callCallBackFunc();
            }

            function _callCallBackFunc() {
                var _count = 0;
                if(_items == null) {
                    _result = false;
                    _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                    _items = [];
                } else {
                    _count = _items.length;
                }
                onAddMemberCallBackFunc(_result, _reason, _extras, _count, _items);
            }
        }
        _sessionData.setCallback(_id, onAddMemberCallback);

        _xsConn.send(_xmppStr);

        return true;
    };

    function _getItemsElemFromAddOrRemoveGroupResponce(xmlRootElem, namespace) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromAddOrRemoveGroupResponce :: xmlRootElem is null');
            return null;
        }
        var _groupElem = Utils.getChildXmlElement(xmlRootElem, 'group');
        if (_groupElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromAddOrRemoveGroupResponce :: _groupElem is invalid');
            return null;
        }
        var _groupElemNamespace = _groupElem.namespace().href();
        if (_groupElemNamespace != namespace) {
            _log.connectionLog(3,
                    '_getItemsElemFromAddOrRemoveGroupResponce :: _groupElemNamespace is not "'
                            + namespace + '"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_groupElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromAddOrRemoveGroupResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromAddOrRemoveGroupResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }

    function _getItemsElemFromAddOrRemoveContactMemberResponce(xmlRootElem, namespace) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromRemoveContactMemberResponce :: xmlRootElem is null');
            return null;
        }
        var _contactElem = Utils.getChildXmlElement(xmlRootElem, 'contact');
        if (_contactElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromRemoveContactMemberResponce :: _contactElem is invalid');
            return null;
        }
        var _contactElemNamespace = _contactElem.namespace().href();
        if (_contactElemNamespace != namespace) {
            _log.connectionLog(3,
                    '_getItemsElemFromRemoveContactMemberResponce :: _contactElemNamespace is not "'
                            + namespace + '"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_contactElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromRemoveContactMemberResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromRemoveContactMemberResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }

    function _getItemsFromAddContactListMemberItemsElem(itemsElem, onGetItemsCallBack) {
        var _retArray = [];
        if(itemsElem == null) {
            _log.connectionLog(3, '_getItemsFromAddContactListMemberItemsElem :: itemsElem is null');
            _callCallbackFunc();
            return;
        }
        if(itemsElem.name == null || typeof itemsElem.name != 'function' || itemsElem.name() != 'items') {
            _log.connectionLog(3, '_getItemsFromAddContactListMemberItemsElem :: itemsElem is invalid');
            _callCallbackFunc();
            return;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if(_itemElemArray == null) {
            _log.connectionLog(3, '_getItemsFromAddContactListMemberItemsElem :: _itemElemArray is null');
            _callCallbackFunc();
            return;
        }
        var _processIndex = 0;
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        _createNextItem();

        function _createNextItem() {
            if(_processIndex >= _count) {
                _callCallbackFunc();
                return;
            }
            var _i = _processIndex;    
            _processIndex++;   

            var _itemElem = _itemElemArray[_i];
            var _addedByElem = Utils.getChildXmlElement(_itemElem, 'added_by');
            if(_addedByElem == null) {
                _log.connectionLog(3, '_getItemsFromAddContactListMemberItemsElem :: _addedByElem is null. No.' + _processIndex);
                _createNextItem();
                return;
            }
            var _addedBy = _addedByElem.text();

            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if(_membersElem == null) {
                _log.connectionLog(3, '_getItemsFromAddContactListMemberItemsElem :: _membersElem is null. No.' + _processIndex);
                _createNextItem();
                return;
            }
            var _membersItem = {};
            var _memberCount = _membersElem.attr('count').value();
            _memberCount = parseInt(_memberCount);
            var _failureMembers = _getFailureMemberForAddContactListMember(_membersElem);
            if(_failureMembers == null){
                _failureMembers = [];
                _log.connectionLog(3, '_getItemsFromAddContactListMemberItemsElem :: _failureMembers is null. : From _membersElem ' + _membersElem.toString());
            }
            _getSuccessMemberForAddContactListMember(_membersElem, _onGetSuccessMemberCallBack);

            function _onGetSuccessMemberCallBack(successMembers){
                var _successMembers = successMembers;
                if(_successMembers == null){
                    _successMembers = [];
                    _log.connectionLog(3, '_getItemsFromAddContactListMemberItemsElem :: _successMembers is null. : From _membersElem ' + _membersElem.toString());
                }
                _membersItem.successMembers = _successMembers;
                _membersItem.failureMembers = _failureMembers;
                _onGetDataEntry();
            }

            function _onGetDataEntry() {
                _retArray[_itemIndex] = {
                    addedBy : _addedBy,
                    count : _memberCount,
                    members : _membersItem,
                };
                _itemIndex++;
                setTimeout(function(){
                    _createNextItem();
                }, 1);
            }
        }
        function _callCallbackFunc() {
            if(onGetItemsCallBack != null && typeof onGetItemsCallBack == 'function') {
                setTimeout(function(){
                    onGetItemsCallBack(_retArray);
                }, 1);
            }
        }
    }

    function _getSuccessMemberForAddContactListMember(element, onGetMemberCallBack){
        if(element == null) {
            _log.connectionLog(3, '_getSuccessMemberForAddContactListMember :: element is null');
            onGetMemberCallBack(null);
            return;
        }
        var _successMembersElem = Utils.getChildXmlElement(element, 'successmembers');
        if(_successMembersElem == null) {
            _log.connectionLog(3, '_getSuccessMemberForAddContactListMember :: _successMembersElem is null.');
            onGetMemberCallBack(null);
            return;
        }
        var _memberElemArray = Utils.getChildXmlElementArray(_successMembersElem,
                'member');
        var _memberArray = _getMemberItemsFromAddedContactListMemberElemArray(_memberElemArray);
        var _count = _memberArray.length;
        var _jidList = new Array();
        for ( var _i = 0; _i < _count; _i++) {
            _jidList[_i] = _memberArray[_i].jid;
        }
        UserAccountUtils.getLoginAccountListByJidList(_jidList,
                _onGetUserAccountDataCallBack);

        function _onGetUserAccountDataCallBack(mapData) {
            var _loginAccountMapData = mapData;
            for ( var _i = 0; _i < _count; _i++) {
                if (_loginAccountMapData) {
                    _memberArray[_i].userName = _loginAccountMapData[_memberArray[_i].jid];
                }
            }
            onGetMemberCallBack(_memberArray);
        }
    }

    function _getMemberItemsFromAddedContactListMemberElemArray(memberElemArray){
        if(memberElemArray == null) {
            _log.connectionLog(3, '_getMemberItemsFromAddedContactListMemberElemArray :: memberElemArray is null');
            return null;
        }
        var _memberArray = [];
        var _memberElemCount = memberElemArray.length;
        for(_i = 0; _i < _memberElemCount; _i++){
            var _memberElem = memberElemArray[_i];
            var _item = _getPersonItemFromElement(_memberElem);

            var _contactListGroupsElem = Utils.getChildXmlElement(_memberElem, 'contactlistgroups');
            var _contactListGroupArray = Utils.getChildXmlElementArray(_contactListGroupsElem, 'contactlistgroup');
            var _contactListGroupCount = 0;
            var _contactListGroupItems = [];
            if(_contactListGroupArray != null){
                _contactListGroupCount = _contactListGroupArray.length;
                for(var _j = 0; _j < _contactListGroupCount; _j++){
                    var _contactListGroupElem = _contactListGroupArray[_j];
                    _contactListGroupItems[_j] = _contactListGroupElem.text();
                }
            }
            var _positionElem = Utils.getChildXmlElement(_memberElem,
                    'position');
            var _positionItemArray = Utils.getChildXmlElementArray(_positionElem, 'item');
            var _positionCount = 0;
            var _positionItems = [];
            if(_positionItemArray != null){
                _positionCount = _positionItemArray.length;
                for(var _k = 0; _k < _positionCount; _k++){
                    var _itemElem = _positionItemArray[_k];
                    var _position = parseInt(_itemElem.text());
                    _positionItems[_k] = _position;
                }
            }
            _item.contactListGroup = _contactListGroupItems;
            _item.position = _positionItems;
            _memberArray.push(_item);
        }
        return _memberArray;
    }

    function _getFailureMemberForAddContactListMember(element){
        if(element == null) {
            _log.connectionLog(3, '_getFailureMemberForAddContactListMember :: element is null');
            return null;
        }
        var _failureMembersElem = Utils.getChildXmlElement(element, 'failuremembers');
        if(_failureMembersElem == null) {
            _log.connectionLog(3, '_getFailureMemberForAddContactListMember :: _failureMembersElem is null.');
            return null;
        }
        var _memberElemArray = Utils.getChildXmlElementArray(_failureMembersElem,
                'member');
        var _memberArray = [];
        var _memberElemCount = _memberElemArray.length;
        for(_i = 0; _i < _memberElemCount; _i++){
            var _memberElem = _memberElemArray[_i];
            var _item = {};
            var _jidElem = Utils.getChildXmlElement(_memberElem,
                    'jid');
            var _jid = '';
            if (_jidElem != null) {
                _jid = _jidElem.text();
            }

            var _contactListGroupElem = Utils.getChildXmlElement(_memberElem, 'contactlistgroup');
            var _contactListGroup = '';
            if (_contactListGroupElem != null) {
                _contactListGroup = _contactListGroupElem.text();
            }
            _item.jid = _jid;
            _item.contactListGroup = _contactListGroup;
            _memberArray.push(_item);
        }
        return _memberArray;
    }


    function _getItemsFromAddCommunityMemberItemsElem(itemsElem) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromAddCommunityMemberItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || typeof itemsElem.name != 'function'
                || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromAddCommunityMemberItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromAddCommunityMemberItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomid');
            if (_roomIdElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromAddCommunityMemberItemsElem :: _roomIdElem is null. No.'
                                + _i);
                continue;
            }
            var _roomId = _roomIdElem.text();
            var _roomNameElem = Utils.getChildXmlElement(_itemElem, 'roomname');
            if (_roomNameElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromAddCommunityMemberItemsElem :: _roomNameElem is null. No.'
                                + _i);
                continue;
            }
            var _roomName = _roomNameElem.text();
            var _addedByElem = Utils.getChildXmlElement(_itemElem, 'added_by');
            if (_addedByElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromAddCommunityMemberItemsElem :: _addedByElem is null. No.'
                                + _i);
                continue;
            }
            var _addedBy = _addedByElem.text();
            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if (_membersElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromAddCommunityMemberItemsElem :: _membersElem is null. No.'
                                + _i);
                continue;
            }
            var _members = [];
            var _memberElemArray = Utils.getChildXmlElementArray(_membersElem,
                    'member');
            var _count = _memberElemArray.length;
            for ( var _i = 0; _i < _count; _i++) {
                var _memberElem = _memberElemArray[_i];
                var _memberData = _getMemberDataFromProfileElem(_memberElem);
                if (_memberData == null) {
                    continue;
                }
                _members.push(_memberData);
            }
            var _memberCount = _members.length;
            var _notifyTypeElem = Utils.getChildXmlElement(_itemElem, 'notify_type');
            if(_notifyTypeElem == null) {
                _log.connectionLog(3, '_getItemsFromAddCommunityMemberItemsElem :: _notifyTypeElem is null. No.' + _i);
                continue;
            }
            var _notifyType = parseInt(_notifyTypeElem.text());
            _retArray[_itemIndex] = {
                roomId : _roomId,
                roomName : _roomName,
                addedBy : _addedBy,
                count : _memberCount,
                members : _members,
                notifyType : _notifyType
            };
            _itemIndex++;
        }
        return _retArray;
    }

    function _appendCubeeAccountForAddMemberResponseOrNotification(items,
            callbackFunc) {
        if (items == null) {
            _returnCallback();
            return;
        }
        var _jidList = [];
        var _jidHash = {};
        var _itemCount = items.length;
        for ( var _i = 0; _i < _itemCount; _i++) {
            var _item = items[_i];
            var _members = _item.members;
            var _memberCount = _members.length;
            for ( var _j = 0; _j < _memberCount; _j++) {
                var _memberItem = _members[_j];
                var _jid = _memberItem.jid;
                if (_jidHash[_jid] == null) {
                    _jidList.push(_jid);
                    _jidHash[_jid] = true;
                }
            }
        }
        if (_jidList.length > 0) {
            UserAccountUtils.getLoginAccountListByJidList(_jidList,
                    _onGetUserAccountDataCallBack);
        } else {
            _returnCallback();
            return;
        }
        function _onGetUserAccountDataCallBack(mapData) {
            for ( var _i = 0; _i < _itemCount; _i++) {
                var _item = items[_i];
                var _members = _item.members;
                var _memberCount = _members.length;
                for ( var _j = 0; _j < _memberCount; _j++) {
                    var _memberItem = _members[_j];
                    _memberItem.userName = mapData[_memberItem.jid];
                }
            }
            _returnCallback();
        }
        function _returnCallback() {
            if (callbackFunc != null && typeof callbackFunc == 'function') {
                setTimeout(function() {
                    callbackFunc(items);
                }, 1);
            }
        }
    }

    _proto.getServerList = function(accessToken, requestData,
            onGetServerListCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onGetServerListCallBackFunc == null
                || typeof onGetServerListCallBackFunc != 'function') {
            _log.connectionLog(3, 'onGetServerListCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _xmppGetServerList = null;
        var _type = requestData.type;
        switch (_type) {
        case RequestData.GET_SERVER_LIST_TYPE_MAIL_SERVER:
            var _xmppServerHostName = _sessionData.getXmppServerName();
            var _fromJid = _sessionData.getJid();
            _xmppGetServerList = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetMailServerListXmpp(_xmppServerHostName, _fromJid);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppGetServerList == null) {
            _log.connectionLog(3, '_xmppGetGroup is null');
            return false;
        }
        var _xmppStr = _xmppGetServerList[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppGetServerList[0] is invalid');
            return false;
        }
        var _id = _xmppGetServerList[1];
        function onGetServerListCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            if (_result == true) {
                switch (_type) {
                case RequestData.GET_SERVER_LIST_TYPE_MAIL_SERVER:
                    _extras = {};
                    var _itemsElem = _getItemsElemFromGetMailServerListResponce(responceXmlRootElem);
                    if (_itemsElem != null) {
                        _items = _getItemsFromGetMailServerListItemsElem(_itemsElem);
                    }
                    break;
                default:
                    _log.connectionLog(3, 'request type is invalid');
                    break;
                }
            }
            var _count = 0;
            if (_items == null) {
                _result = false;
                _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                _items = [];
            } else {
                _count = _items.length;
            }
            onGetServerListCallBackFunc(_result, _reason, _extras, _count,
                    _items);
        }
        _sessionData.setCallback(_id, onGetServerListCallback);

        _xsConn.send(_xmppStr);

        return true;
    };

    function _getItemsElemFromGetMailServerListResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetMailServerListResponce :: xmlRootElem is null');
            return null;
        }
        var _mailElem = Utils.getChildXmlElement(xmlRootElem, 'mail');
        if (_mailElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetMailServerListResponce :: _mailElem is invalid');
            return null;
        }
        var _mailElemNamespace = _mailElem.namespace().href();
        if (_mailElemNamespace != 'http://necst.nec.co.jp/protocol/getserverlist') {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromGetMailServerListResponce :: _mailElemNamespace is not "createchatroom"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_mailElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetMailServerListResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetMailServerListResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }

    function _getItemsFromGetMailServerListItemsElem(itemsElem) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetMailServerListItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || typeof itemsElem.name != 'function'
                || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetMailServerListItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetMailServerListItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _idElem = Utils.getChildXmlElement(_itemElem, 'id');
            if (_idElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _idElem is null. No.'
                                + _i);
                continue;
            }
            var _idStr = _idElem.text();
            var _id = parseInt(_idStr);
            var _displayNameElem = Utils.getChildXmlElement(_itemElem,
                    'display_name');
            if (_displayNameElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _displayNameElem is null. No.'
                                + _i);
                continue;
            }
            var _displayName = _displayNameElem.text();
            var _serverTypeElem = Utils.getChildXmlElement(_itemElem,
                    'server_type');
            if (_serverTypeElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _serverTypeElem is null. No.'
                                + _i);
                continue;
            }
            var _serverTypeStr = _serverTypeElem.text();
            var _serverType = parseInt(_serverTypeStr);
            var _createdAtElem = Utils.getChildXmlElement(_itemElem,
                    'created_at');
            if (_createdAtElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _createdAtElem is null. No.'
                                + _i);
                continue;
            }
            var _createdAt = _createdAtElem.text();
            var _createdByElem = Utils.getChildXmlElement(_itemElem,
                    'created_by');
            if (_createdByElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _createdByElem is null. No.'
                                + _i);
                continue;
            }
            var _createdBy = _createdByElem.text();
            var _updatedAtElem = Utils.getChildXmlElement(_itemElem,
                    'updated_at');
            if (_updatedAtElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _updatedAtElem is null. No.'
                                + _i);
                continue;
            }
            var _updatedAt = _updatedAtElem.text();
            var _updatedByElem = Utils.getChildXmlElement(_itemElem,
                    'updated_by');
            if (_updatedByElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _updatedByElem is null. No.'
                                + _i);
                continue;
            }
            var _updatedBy = _updatedByElem.text();
            var _popHostElem = Utils.getChildXmlElement(_itemElem, 'pop_host');
            if (_popHostElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _popHostElem is null. No.'
                                + _i);
                continue;
            }
            var _popHost = _popHostElem.text();
            var _popPortElem = Utils.getChildXmlElement(_itemElem, 'pop_port');
            if (_popPortElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _popPortElem is null. No.'
                                + _i);
                continue;
            }
            var _popPortStr = _popPortElem.text();
            var _popPort = parseInt(_popPortStr);
            var _popAuthModeElem = Utils.getChildXmlElement(_itemElem,
                    'pop_auth_mode');
            if (_popAuthModeElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailServerListItemsElem :: _popAuthModeElem is null. No.'
                                + _i);
                continue;
            }
            var _popAuthModeStr = _popAuthModeElem.text();
            var _popAuthMode = parseInt(_popAuthModeStr);
            var _popResponseTimeoutElem = Utils.getChildXmlElement(_itemElem,
                    'pop_response_timeout');
            if (_popResponseTimeoutElem == null) {
                _log
                        .connectionLog(
                                3,
                                '_getItemsFromGetMailServerListItemsElem :: _popResponseTimeoutElem is null. No.'
                                        + _i);
                continue;
            }
            var _popResponseTimeoutStr = _popResponseTimeoutElem.text();
            var _popResponseTimeout = parseInt(_popResponseTimeoutStr);
            _retArray[_itemIndex] = {
                id : _id,
                displayName : _displayName,
                serverType : _serverType,
                createdAt : _createdAt,
                createdBy : _createdBy,
                updatedAt : _updatedAt,
                updatedBy : _updatedBy,
                popHost : _popHost,
                popPort : _popPort,
                popAuthMode : _popAuthMode,
                popResponseTimeout : _popResponseTimeout,
            };
            _itemIndex++;
        }
        return _retArray;
    }
    _proto.getGetMailCooperationSettings = function(accessToken, onGetMailCooperationSettingsCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid');
            return false;
        }
        if (onGetMailCooperationSettingsCallBackFunc == null
                || typeof onGetMailCooperationSettingsCallBackFunc != 'function') {
            _log.connectionLog(4,
                    'onGetMailCooperationSettingsCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }
        var _fromJid = _sessionData.getJid();
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _xmppGetMailCooperationSettings = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createGetMailCooperationSettingsXmpp(_xmppServerHostName, _fromJid);
        });
        var _xmppStr = _xmppGetMailCooperationSettings[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4,
                    '_xmppGetMailCooperationSettings[0] is invalid');
            return false;
        }
        var _id = _xmppGetMailCooperationSettings[1];
        function onGetMailCooperationSettingsCallBack(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            if (_result == true) {
                var _itemsElem = _getItemsElemFromGetMailCooperationSettingsResponce(responceXmlRootElem);
                if (_itemsElem != null) {
                    _items = _getItemsFromGetMailCooperationSettingsItemsElem(_itemsElem);
                }
            }
            var _count = 0;
            if (_items == null) {
                _result = false;
                _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                _items = [];
            } else {
                _count = _items.length;
            }
            onGetMailCooperationSettingsCallBackFunc(_result, _reason, _extras,
                    _count, _items);
        }
        _sessionData.setCallback(_id, onGetMailCooperationSettingsCallBack);
        _xsConn.send(_xmppStr);

        return true;
    };
    function _getItemsElemFromGetMailCooperationSettingsResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetMailCooperationSettingsResponce :: xmlRootElem is null');
            return null;
        }
        var _mailElem = Utils.getChildXmlElement(xmlRootElem, 'mail');
        if (_mailElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetMailCooperationSettingsResponce :: _mailElem is invalid');
            return null;
        }
        var _mailElemNamespace = _mailElem.namespace().href();
        if (_mailElemNamespace != 'http://necst.nec.co.jp/protocol/getsettings') {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromGetMailCooperationSettingsResponce :: _mailElemNamespace is not "getsettings"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_mailElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromGetMailCooperationSettingsResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetMailCooperationSettingsResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }
    _proto.getAllUserMailSettings = function(accessToken, requestData, onGetAllUserMailSettingsCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(4, 'accessToken is invalid');
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onGetAllUserMailSettingsCallBackFunc == null
                || typeof onGetAllUserMailSettingsCallBackFunc != 'function') {
            _log.connectionLog(4,
                    'onGetAllUserMailSettingsCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }
        var _xmppGetAllUserMailSettings = null;
        var _type = requestData.type;
        switch (_type) {
        case RequestData.GET_SETTINGS_TYPE_ALL_USER_MAIL_SETTINGS:
            var _fromJid = _sessionData.getJid();
            var _xmppServerHostName = _sessionData.getXmppServerName();
            _xmppGetAllUserMailSettings = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createGetAllUserMailSettingsXmpp(_xmppServerHostName, _fromJid);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        var _xmppStr = _xmppGetAllUserMailSettings[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4,
                    '_xmppGetMailCooperationSettings[0] is invalid');
            return false;
        }
        var _id = _xmppGetAllUserMailSettings[1];
        function onGetAllUserMailSettingsCallBack(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            if (_result == true) {
                var _itemsElem = _getItemsElemFromGetAllUserMailSettingsResponce(responceXmlRootElem);
                if (_itemsElem != null) {
                    _items = _getItemsFromGetMailCooperationSettingsItemsElem(_itemsElem);
                }
            }
            var _count = 0;
            if (_items == null) {
                _result = false;
                _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                _items = [];
            } else {
                _count = _items.length;
            }
            onGetAllUserMailSettingsCallBackFunc(_result, _reason, _extras,
                    _count, _items);
        }
        _sessionData.setCallback(_id, onGetAllUserMailSettingsCallBack);
        _xsConn.send(_xmppStr);
        return true;
    };
    function _getItemsElemFromGetAllUserMailSettingsResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetMailCooperationSettingsResponce :: xmlRootElem is null');
            return null;
        }
        var _mailElem = Utils.getChildXmlElement(xmlRootElem, 'mail');
        if (_mailElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetAllUserMailSettingsResponce :: _mailElem is invalid');
            return null;
        }
        var _mailElemNamespace = _mailElem.namespace().href();
        if (_mailElemNamespace != 'http://necst.nec.co.jp/protocol/getallusersettings') {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromGetAllUserMailSettingsResponce :: _mailElemNamespace is not "getallusersettings"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_mailElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetAllUserMailSettingsResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetAllUserMailSettingsResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }
    function _getItemsFromGetMailCooperationSettingsItemsElem(itemsElem) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetMailCooperationSettingsItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || typeof itemsElem.name != 'function'
                || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetMailCooperationSettingsItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetMailCooperationSettingsItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _idElem = Utils.getChildXmlElement(_itemElem, 'id');
            if (_idElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailCooperationSettingsItemsElem :: _idElem is null. No.'
                                + _i);
                continue;
            }
            var _idStr = _idElem.text();
            var _id = parseInt(_idStr);
            var _jidElem = Utils.getChildXmlElement(_itemElem, 'jid');
            if (_jidElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailCooperationSettingsItemsElem :: _jidElem is null. No.'
                                + _i);
                continue;
            }
            var _jid = _jidElem.text();
            var _serverIdElem = Utils
                    .getChildXmlElement(_itemElem, 'server_id');
            if (_serverIdElem == null) {
                _log
                        .connectionLog(
                                3,
                                '_getItemsFromGetMailCooperationSettingsItemsElem :: _serverIdElem is null. No.'
                                        + _i);
                continue;
            }
            var _serverIdStr = _serverIdElem.text();
            var _serverId = parseInt(_serverIdStr);
            var _branchNumberElem = Utils.getChildXmlElement(_itemElem,
                    'branch_number');
            if (_branchNumberElem == null) {
                _log
                        .connectionLog(
                                3,
                                '_getItemsFromGetMailCooperationSettingsItemsElem :: _branchNumberElem is null. No.'
                                        + _i);
                continue;
            }
            var _branchNumberStr = _branchNumberElem.text();
            var _branchNumber = parseInt(_branchNumberStr);
            var _mailElem = Utils.getChildXmlElement(_itemElem, 'mail_address');
            if (_mailElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailCooperationSettingsItemsElem :: _mailElem is null. No.'
                                + _i);
                continue;
            }
            var _mail = _mailElem.text();
            var _typeElem = Utils.getChildXmlElement(_itemElem,
                    'mail_cooperation_type');
            if (_typeElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetMailCooperationSettingsItemsElem :: _typeElem is null. No.'
                                + _i);
                continue;
            }
            var _typeStr = _typeElem.text();
            var _type = parseInt(_typeStr);
            var _settingInfo = {};
            var _settingInfoElem = Utils.getChildXmlElement(_itemElem,
                    'setting_info');
            if (_settingInfoElem == null) {
                _log
                        .connectionLog(
                                3,
                                '_getItemsFromGetMailCooperationSettingsItemsElem :: _settingInfoElem is null. No.'
                                        + _i);
                continue;
            }
            _settingInfo = _getSettingInfoFromSettngInfoElm(_settingInfoElem);

            _retArray[_itemIndex] = {
                id : _id,
                serverId : _serverId,
                jid : _jid,
                branchNumber : _branchNumber,
                mailAddress : _mail,
                settingInfo : _settingInfo,
                mailCooperationType : _type,
            };
            _itemIndex++;
        }
        return _retArray;

        function _getSettingInfoFromSettngInfoElm(settingInfoElem) {
            var _ret = {};
            if (settingInfoElem == null) {
                return _ret;
            }
            var _popServerElem = Utils.getChildXmlElement(settingInfoElem,
                    'pop_server');
            if (_popServerElem == null) {
                _log
                        .connectionLog(7,
                                '_getSettingInfoFromSettngInfoElm :: _popServerElem is null.');
                return _ret;
            }
            var _popServer = {};
            var _mailAccountElem = Utils.getChildXmlElement(_popServerElem,
                    'mail_account');
            if (_mailAccountElem == null) {
                _log
                        .connectionLog(7,
                                '_getSettingInfoFromSettngInfoElm  :: _mailAccountElem is null.');
                return _ret;
            }
            var _mailAccount = _mailAccountElem.text();
            var _mailPassElem = Utils.getChildXmlElement(_popServerElem,
                    'mail_password');
            if (_mailPassElem == null) {
                _log
                        .connectionLog(3,
                                '_getSettingInfoFromSettngInfoElm :: _mailPassElem is null.');
                return _ret;
            }
            var _mailPass = _mailPassElem.text();
            _popServer.mailAccount = _mailAccount;
            _popServer.mailPassword = _mailPass;
            _ret.popServer = _popServer;
            return _ret;
        }
    }
    _proto.getCount = function(accessToken, requestData, onGetCountCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3, 'accessToken is invalid : ' + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log.connectionLog(3, 'requestData is invalid');
            return false;
        }
        if (onGetCountCallBackFunc == null
                || typeof onGetCountCallBackFunc != 'function') {
            _log.connectionLog(3, 'onGetCountCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3, '_xsConn is null');
            return false;
        }
        var _xmppGetCount = null;
        var _type = requestData.type;
        switch (_type) {
        case RequestData.GET_COUNT_TYPE_MESSAGE:
            var _xmppServerHostName = _sessionData.getXmppServerName();
            var _fromJid = _sessionData.getJid();
            var _messageCountInfoData = requestData;
            _xmppGetCount = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.getMessageCountXmpp(_xmppServerHostName,_fromJid, _messageCountInfoData);
            });
            break;
        default:
            _log.connectionLog(3, 'request type is invalid');
            return false;
        }
        if (_xmppGetCount == null) {
            _log.connectionLog(3, '_xmppGetCount is null');
            return false;
        }
        var _xmppStr = _xmppGetCount[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(3, '_xmppGetCount[0] is invalid');
            return false;
        }
        var _id = _xmppGetCount[1];
        function onGetCountCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _count = 0;
            if (_result == true) {
                switch (_type) {
                case RequestData.GET_COUNT_TYPE_MESSAGE:
                    _extras = {};
                    var _queryElem = Utils.getChildXmlElement(
                            responceXmlRootElem, 'query');
                    if (_queryElem == null) {
                        _log.connectionLog(3,
                                'onGetCountCallback :: _queryElem is invalid');
                        _result = false;
                        _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                        break;
                    }
                    var _contentElem = Utils.getChildXmlElement(_queryElem,
                            'content');
                    if (_contentElem == null) {
                        _log
                                .connectionLog(3,
                                        'onGetCountCallback :: _contentElem is invalid');
                        _result = false;
                        _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                        break;
                    }
                    var _countElem = Utils.getChildXmlElement(_contentElem,
                            'count');
                    if (_countElem == null) {
                        _log.connectionLog(3,
                                'onGetCountCallback :: _countElem is invalid');
                        _result = false;
                        _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                        break;
                    }
                    _count = parseInt(_countElem.text());
                    break;
                default:
                    _log.connectionLog(3, 'request type is invalid');
                    _result = false;
                    _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                    break;
                }
            }
            onGetCountCallBackFunc(_result, _reason, _extras, _count);
        }
        _sessionData.setCallback(_id, onGetCountCallback);

        _xsConn.send(_xmppStr);
        return true;
    };

    _proto.updateMember = function(accessToken, requestData,
            onUpdateMemberCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3,
                    'synchronousBridgeNodeXmpp updateMember::accessToken is invalid : '
                            + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp updateMember::requestData is invalid');
            return false;
        }
        if (onUpdateMemberCallBackFunc == null
                || typeof onUpdateMemberCallBackFunc != 'function') {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp updateMember::onUpdateMemberCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp updateMember::_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3,
                    'synchronousBridgeNodeXmpp updateMember::_xsConn is null');
            return false;
        }
        var _xmppUpdateMember = null;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        var _type = requestData.type;
        switch (_type) {
        case RequestData.UPDATE_MEMBER_TYPE_COMMUNITY_OWNER:
            var _communityOwnerRequestData = requestData;
            _xmppUpdateMember = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createUpdateCommunityOwnerXmpp(
                        _xmppServerHostName, _fromJid, _communityOwnerRequestData);
            });
            break;
        default:
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp updateMember::request type is invalid');
            return false;
        }
        if (_xmppUpdateMember == null) {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp updateMember::_xmppUpdateMember is null');
            return false;
        }
        var _xmppStr = _xmppUpdateMember[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp updateMember::_xmppUpdateMember[0] is invalid');
            return false;
        }
        var _id = _xmppUpdateMember[1];
        function onUpdateMemberCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            if (_result == true) {
                switch (_type) {
                case RequestData.UPDATE_MEMBER_TYPE_COMMUNITY_OWNER:
                    var _contentElem = _getContentElemFromUpdateCommunityOwnerResponce(responceXmlRootElem);
                    if (_contentElem == null) {
                        _log
                                .connectionLog(
                                        3,
                                        'synchronousBridgeNodeXmpp updateMember(onUpdateMemberCallback)::response data(content) is invalid');
                        break;
                    }
                    _extras = _getExtrasFromUpdateCommunityOwnerResponceContent(_contentElem);
                    if (_extras == null) {
                        _log
                                .connectionLog(
                                        6,
                                        'synchronousBridgeNodeXmpp updateMember(onUpdateMemberCallback)::response data(extras) is invalid');
                        _extras = {};
                    }
                    _items = _getItemsFromUpdateCommunityOwnerResponceContent(_contentElem);
                    if (_items == null) {
                        _log
                                .connectionLog(
                                        3,
                                        'synchronousBridgeNodeXmpp updateMember(onUpdateMemberCallback)::response data(items) is invalid');
                        _extras = {};
                    }
                    break;
                default:
                    _log
                            .connectionLog(
                                    3,
                                    'synchronousBridgeNodeXmpp updateMember(onUpdateMemberCallback)::request type is invalid');
                    break;
                }
            }
            var _count = 0;
            if (_items == null) {
                _result = false;
                _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                _items = [];
            } else {
                _count = _items.length;
            }
            onUpdateMemberCallBackFunc(_result, _reason, _extras, _count,
                    _items);
        }
        _sessionData.setCallback(_id, onUpdateMemberCallback);

        _xsConn.send(_xmppStr);

        return true;
    };

    function _getContentElemFromUpdateCommunityOwnerResponce(
            responceXmlRootElem) {
        var _ret = null;
        if (responceXmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getContentElemFromUpdateCommunityOwnerResponce :: xmlRootElem is null');
            return _ret;
        }
        var _groupElem = Utils.getChildXmlElement(responceXmlRootElem, 'group');
        if (_groupElem == null) {
            _log
                    .connectionLog(3,
                            '_getContentElemFromUpdateCommunityOwnerResponce :: _groupElem is invalid');
            return _ret;
        }
        var _groupElemNamespace = _groupElem.namespace().href();
        if (_groupElemNamespace != 'http://necst.nec.co.jp/protocol/updatecommunityowner') {
            _log
                    .connectionLog(
                            3,
                            '_getContentElemFromUpdateCommunityOwnerResponce :: _groupElemNamespace is not "createchatroom"');
            return _ret;
        }
        var _contentElem = Utils.getChildXmlElement(_groupElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getContentElemFromUpdateCommunityOwnerResponce :: _contentElem is invalid');
            return _ret;
        }
        _ret = _contentElem;
        return _ret;
    }

    function _getExtrasFromUpdateCommunityOwnerResponceContent(contentElem) {
        var _ret = null;
        if (contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityOwnerResponceContent :: contentElem is null');
            return _ret;
        }
        var _extrasElem = Utils.getChildXmlElement(contentElem, 'extras');
        if (_extrasElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityOwnerResponceContent :: _extrasElem is null');
            return _ret;
        }
        var _preOwnersElem = Utils.getChildXmlElement(_extrasElem, 'preowners');
        if (_preOwnersElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityOwnerResponceContent :: _preOwnersElem is null');
            return _ret;
        }
        var _ownersArray = _getOwnerArrayFromOwnersElem(_preOwnersElem);
        if (_ownersArray == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromUpdateCommunityOwnerResponceContent :: _ownersArray is null');
            return _ret;
        }
        var _extras = {
            preOwnerCount : _ownersArray.length,
            preOwnerItems : _ownersArray
        };

        _ret = _extras;
        return _ret;
    }

    function _getItemsFromUpdateCommunityOwnerResponceContent(contentElem) {
        var _ret = null;
        if (contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromUpdateCommunityOwnerResponceContent :: contentElem is null');
            return _ret;
        }
        var _itemsElem = Utils.getChildXmlElement(contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromUpdateCommunityOwnerResponceContent :: _itemsElem is null');
            return _ret;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromUpdateCommunityOwnerResponceContent :: _itemElemArray is null');
            return _ret;
        }
        var _itemArray = [];
        var _index = 0;
        var _itemCount = _itemElemArray.length;
        for ( var _i = 0; _i < _itemCount; _i++) {
            var _itemElem = _itemElemArray[_i];
            if (_itemElem == null) {
                continue;
            }
            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomid');
            if (_roomIdElem == null) {
                _log
                        .connectionLog(3,
                                '_getItemsFromUpdateCommunityOwnerResponceContent :: _roomIdElem is null');
                continue;
            }
            var _roomId = _roomIdElem.text();
            var _ownersElem = Utils.getChildXmlElement(_itemElem, 'owners');
            var _ownersArray = _getOwnerArrayFromOwnersElem(_ownersElem);
            if (_ownersArray == null) {
                _log
                        .connectionLog(3,
                                '_getItemsFromUpdateCommunityOwnerResponceContent :: _ownersArray is null');
                return _ret;
            }
            var _item = {
                roomId : _roomId,
                ownerCount : _ownersArray.length,
                ownerItems : _ownersArray
            };
            _itemArray[_index] = _item;
            _index++;
        }
        _ret = _itemArray;
        return _ret;
    }

    function _getOwnerArrayFromOwnersElem(ownersElem) {
        var _ret = null;
        if (ownersElem == null) {
            _log.connectionLog(3,
                    '_getOwnerArrayFromOwnersElem :: ownersElem is null');
            return _ret;
        }
        var _ownerElemArray = Utils
                .getChildXmlElementArray(ownersElem, 'owner');
        if (_ownerElemArray == null) {
            _log.connectionLog(3,
                    '_getOwnerArrayFromOwnersElem :: _ownerElemArray is null');
            return _ret;
        }
        var _ownerArray = [];
        var _index = 0;
        var _ownerCount = _ownerElemArray.length;
        for ( var _i = 0; _i < _ownerCount; _i++) {
            var _ownerElem = _ownerElemArray[_i];
            if (_ownerElem == null) {
                continue;
            }
            _ownerArray[_index] = _ownerElem.text();
            _index++;
        }
        _ret = _ownerArray;

        return _ret;
    }

    _proto.removeMember = function(accessToken, requestData,
            onRemoveMemberCallBackFunc) {
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3,
                    'synchronousBridgeNodeXmpp removeMember::accessToken is invalid : '
                            + accessToken);
            return false;
        }
        if (requestData == null || typeof requestData != 'object') {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp removeMember::requestData is invalid');
            return false;
        }
        if (onRemoveMemberCallBackFunc == null
                || typeof onRemoveMemberCallBackFunc != 'function') {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp removeMember::onRemoveMemberCallBackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp removeMember::_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(3,
                    'synchronousBridgeNodeXmpp removeMember::_xsConn is null');
            return false;
        }
        var _xmppRemoveMember = null;
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _fromJid = _sessionData.getJid();
        var _type = requestData.type;
        var _removeType = requestData.removeType;
        switch (_type) {
        case RequestData.REMOVE_MEMBER_TYPE_COMMUNITY_ROOM:
            var _removeMemberRequestData = requestData;
            _xmppRemoveMember = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createRemoveCommunityMemberXmpp(
                        _xmppServerHostName, _fromJid, _removeMemberRequestData);
            });
            break;
        case RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM:
            var _removeMemberRequestData = requestData;
            _xmppRemoveMember = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createRemoveGroupChatMemberXmpp(
                        _xmppServerHostName, _fromJid, _removeMemberRequestData);
            });
            break;
        case RequestData.REMOVE_MEMBER_TYPE_CONTACT_LIST:
            var _removeMemberRequestData = requestData;
            _xmppRemoveMember = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createRemoveContactListMemberXmpp(
                        _xmppServerHostName, _fromJid, _removeMemberRequestData);
            });
            break;
        default:
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp removeMember::request type is invalid');
            return false;
        }
        if (_xmppRemoveMember == null) {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp removeMember::_xmppRemoveMember is null');
            return false;
        }
        var _xmppStr = _xmppRemoveMember[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log
                    .connectionLog(3,
                            'synchronousBridgeNodeXmpp removeMember::_xmppRemoveMember[0] is invalid');
            return false;
        }
        var _id = _xmppRemoveMember[1];
        function onRemoveMemberCallback(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            if (_result == true) {
                switch (_type) {
                case RequestData.REMOVE_MEMBER_TYPE_COMMUNITY_ROOM:
                    _extras = {};
                    var _itemsElem = _getItemsElemFromAddOrRemoveGroupResponce(
                            responceXmlRootElem,
                            'http://necst.nec.co.jp/protocol/removecommunitymember');
                    if (_itemsElem == null) {
                        _log
                                .connectionLog(
                                        3,
                                        'SynchronousBridgeNodeXmpp#removeMember(onRemoveMemberCallback):: _itemsElem is invalid ('
                                                + RequestData.REMOVE_MEMBER_TYPE_COMMUNITY_ROOM
                                                + ')');
                        break;
                    }
                    _items = _getItemsFromRemoveCommunityMemberItemsElem(_itemsElem);
                    if (_items == null || _items.length <= 0) {
                        _log
                                .connectionLog(
                                        3,
                                        'SynchronousBridgeNodeXmpp#removeMember(onRemoveMemberCallback):: _items is invalid ('
                                                + RequestData.REMOVE_MEMBER_TYPE_COMMUNITY_ROOM
                                                + ')');
                    }
                    break;
                case RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM:
                    var _itemsElem = _getItemsElemFromAddOrRemoveGroupResponce(
                            responceXmlRootElem,
                            'http://necst.nec.co.jp/protocol/removegroupchatmember');
                    if (_itemsElem == null) {
                        _log
                                .connectionLog(
                                        3,
                                        'SynchronousBridgeNodeXmpp#removeMember(onRemoveMemberCallback):: _itemsElem is invalid ('
                                                + RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM
                                                + ')');
                        break;
                    }
                    var _itemObj = _getItemsFromRemoveGroupChatMemberItemsElem(
                            _itemsElem, 0);
                    _items = _itemObj.items;
                    _extras = {
                        removeType : _itemObj.removeType ? _itemObj.removeType
                                : _removeType
                    };
                    if (_items == null || _items.length <= 0) {
                        _log
                                .connectionLog(
                                        3,
                                        'SynchronousBridgeNodeXmpp#removeMember(onRemoveMemberCallback):: _items is invalid ('
                                                + RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM
                                                + ')');
                    }
                    break;
                case RequestData.REMOVE_MEMBER_TYPE_CONTACT_LIST:
                    var _itemsElem = _getItemsElemFromAddOrRemoveContactMemberResponce(
                            responceXmlRootElem,
                            'http://necst.nec.co.jp/protocol/removecontactlistmember');
                    if (_itemsElem == null) {
                        _log
                                .connectionLog(
                                        3,
                                        'SynchronousBridgeNodeXmpp#removeMember(onRemoveMemberCallback):: _itemsElem is invalid ('
                                                + RequestData.REMOVE_MEMBER_TYPE_CONTACT_LIST
                                                + ')');
                        break;
                    }
                    _items = _getItemsFromRemoveContactListMemberItemsElem(_itemsElem);
                    if (_items == null || _items.length <= 0) {
                        _log
                                .connectionLog(
                                        3,
                                        'SynchronousBridgeNodeXmpp#removeMember(onRemoveMemberCallback):: _items is invalid ('
                                                + RequestData.REMOVE_MEMBER_TYPE_CONTACT_LIST
                                                + ')');
                    }
                    break;
                default:
                    _log
                            .connectionLog(
                                    3,
                                    'synchronousBridgeNodeXmpp removeMember(onRemoveMemberCallback)::request type is invalid');
                    break;
                }
            }
            var _count = 0;
            if (_items == null) {
                _result = false;
                _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                _items = [];
                switch (_type) {
                case RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM:
                    _extras = {
                        removeType : _removeType
                    };
                    break;
                }
            } else {
                _count = _items.length;
            }
            onRemoveMemberCallBackFunc(_result, _reason, _extras, _count,
                    _items);
        }
        _sessionData.setCallback(_id, onRemoveMemberCallback);

        _xsConn.send(_xmppStr);

        return true;
    };

    function _getItemsFromRemoveCommunityMemberItemsElem(itemsElem) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveCommunityMemberItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || typeof itemsElem.name != 'function'
                || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveCommunityMemberItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveCommunityMemberItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomid');
            if (_roomIdElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveCommunityMemberItemsElem :: _roomIdElem is null. No.'
                                + _i);
                continue;
            }
            var _roomId = _roomIdElem.text();
            var _roomNameElem = Utils.getChildXmlElement(_itemElem, 'roomname');
            if (_roomNameElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveCommunityMemberItemsElem :: _roomNameElem is null. No.'
                                + _i);
                continue;
            }
            var _roomName = _roomNameElem.text();
            var _removedByElem = Utils.getChildXmlElement(_itemElem,
                    'removed_by');
            if (_removedByElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveCommunityMemberItemsElem :: _removedByElem is null. No.'
                                + _i);
                continue;
            }
            var _removedBy = _removedByElem.text();
            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if (_membersElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveCommunityMemberItemsElem :: _membersElem is null. No.'
                                + _i);
                continue;
            }
            var _members = [];
            var _memberElemArray = Utils.getChildXmlElementArray(_membersElem,
                    'member');
            var _count = _memberElemArray.length;
            for ( var _i = 0; _i < _count; _i++) {
                var _memberElem = _memberElemArray[_i];
                var _member = _memberElem.text();
                _members.push(_member);
            }
            var _memberCount = _members.length;
            var _itemData = {
                roomId : _roomId,
                roomName : _roomName,
                removedBy : _removedBy,
                count : _memberCount,
                members : _members
            };
            _retArray.push(_itemData);
        }
        return _retArray;
    }

    function _getItemsFromRemoveGroupChatMemberItemsElem(itemsElem, packetType) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveGroupChatMemberItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || typeof itemsElem.name != 'function'
                || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveGroupChatMemberItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveGroupChatMemberItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _roomIdElem = Utils.getChildXmlElement(_itemElem, 'roomid');
            if (_roomIdElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveGroupChatMemberItemsElem :: _roomIdElem is null. No.'
                                + _i);
                continue;
            }
            var _roomId = _roomIdElem.text();

            var _roomNameElem = Utils.getChildXmlElement(_itemElem, 'roomname');
            if (_roomNameElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveGroupChatMemberItemsElem :: _roomNameElem is null. No.'
                                + _i);
                continue;
            }
            var _roomName = _roomNameElem.text();

            var _parentRoomIdElem = Utils.getChildXmlElement(_itemElem, 'parentroomid');
            if (_parentRoomIdElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveGroupChatMemberItemsElem :: _parentRoomIdElem is null. No.'
                                + _i);
                continue;
            }
            var _parentRoomId = _parentRoomIdElem.text();

            var _privacyTypeElem = Utils.getChildXmlElement(_itemElem, 'privacytype');
            if (_privacyTypeElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveGroupChatMemberItemsElem :: _privacyTypeElem is null. No.'
                                + _i);
                continue;
            }
            var _privacyType = parseInt(_privacyTypeElem.text());

            var _removedByElem = Utils.getChildXmlElement(_itemElem,
                    'removed_by');
            if (_removedByElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveGroupChatMemberItemsElem :: _removedByElem is null. No.'
                                + _i);
                continue;
            }
            var _removedBy = _removedByElem.text();

            var _removetypeElem = Utils.getChildXmlElement(_itemElem,
                    'removetype');
            if (_removetypeElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveGroupChatMemberItemsElem :: _removetypeElem is null. No.'
                                + _i);
                continue;
            }
            var _removetype = _removetypeElem.text();

            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if (_membersElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveGroupChatMemberItemsElem :: _membersElem is null. No.'
                                + _i);
                continue;
            }

            var _memberCount = 0;
            var _membersList = [];
            if (packetType == 0) {
                var _successMembersElem = Utils.getChildXmlElement(
                        _membersElem, 'successmembers');
                var _sMembers = [];
                if (_successMembersElem) {
                    var _memberElemArray = Utils.getChildXmlElementArray(
                            _successMembersElem, 'member');
                    var _count = _memberElemArray.length;
                    for ( var _i = 0; _i < _count; _i++) {
                        var _memberElem = _memberElemArray[_i];
                        var _member = _memberElem.text();
                        _sMembers.push(_member);
                    }
                }
                var _failureMembersElem = Utils.getChildXmlElement(
                        _membersElem, 'failuremembers');
                var _fMembers = [];
                if (_failureMembersElem) {
                    var _memberElemArray = Utils.getChildXmlElementArray(
                            _failureMembersElem, 'member');
                    var _count = _memberElemArray.length;
                    for ( var _i = 0; _i < _count; _i++) {
                        var _memberElem = _memberElemArray[_i];
                        var _member = _memberElem.text();
                        _fMembers.push(_member);
                    }
                }
                _memberCount = _sMembers.length;
                _membersList = {
                    successMembers : _sMembers,
                    failureMembers : _fMembers
                };
            } else {
                var _members = [];
                var _memberElemArray = Utils.getChildXmlElementArray(
                        _membersElem, 'member');
                var _count = _memberElemArray.length;
                for ( var _i = 0; _i < _count; _i++) {
                    var _memberElem = _memberElemArray[_i];
                    var _member = _memberElem.text();
                    _members.push(_member);
                }
                _memberCount = _members.length;
                _membersList = _members;
            }

            var _itemData = {
                roomId : _roomId,
                roomName : _roomName,
                parentRoomId : _parentRoomId,
                privacyType : _privacyType,
                removedBy : _removedBy,
                count : _memberCount,
                members : _membersList
            };
            _retArray.push(_itemData);
        }
        return {
            items : _retArray,
            removeType : _removetype
        };
    }

    function _getItemsFromRemoveContactListMemberItemsElem(itemsElem) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveContactListMemberItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || typeof itemsElem.name != 'function'
                || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveContactListMemberItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromRemoveContactListMemberItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _removedByElem = Utils.getChildXmlElement(_itemElem,
                    'removed_by');
            if (_removedByElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveContactListMemberItemsElem :: _removedByElem is null. No.'
                                + _i);
                continue;
            }
            var _removedBy = _removedByElem.text();

            var _membersElem = Utils.getChildXmlElement(_itemElem, 'members');
            if (_membersElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromRemoveContactListMemberItemsElem :: _membersElem is null. No.'
                                + _i);
                continue;
            }

            var _membersList = [];
            var _memberCount = 0;
            var _successMembersElem = Utils.getChildXmlElement(
                    _membersElem, 'successmembers');
            var _sMembers = [];
            if (_successMembersElem) {
                var _memberElemArray = Utils.getChildXmlElementArray(
                        _successMembersElem, 'member');
                var _count = _memberElemArray.length;
                for ( var _i = 0; _i < _count; _i++) {
                    var _memberElem = _memberElemArray[_i];
                    var _jidElem = Utils.getChildXmlElement(_memberElem, 'jid');
                    if(_jidElem == null){
                        continue;
                    }
                    var _member = {
                        jid : _jidElem.text()
                    };
                    _sMembers.push(_member);
                    _memberCount++;
                }
            }
            var _failureMembersElem = Utils.getChildXmlElement(
                    _membersElem, 'failuremembers');
            var _fMembers = [];
            if (_failureMembersElem) {
                var _memberElemArray = Utils.getChildXmlElementArray(
                        _failureMembersElem, 'member');
                var _count = _memberElemArray.length;
                for ( var _i = 0; _i < _count; _i++) {
                    var _memberElem = _memberElemArray[_i];
                    var _jidElem = Utils.getChildXmlElement(_memberElem, 'jid');
                    if(_jidElem == null){
                        continue;
                    }
                    var _member = {
                        jid : _jidElem.text()
                    };
                    _fMembers.push(_member);
                    _memberCount++;
                }
            }
            _membersList = {
                successMembers : _sMembers,
                failureMembers : _fMembers
            };
            var _itemData = {
                removedBy : _removedBy,
                count : _memberCount,
                members : _membersList
            };
            _retArray.push(_itemData);
        }
        return _retArray;
    }

    function _onPubSubMessage(sessionData, xmlRootElem) {
        var _fromAttr = xmlRootElem.attr('from');
        if (_fromAttr == null) {
            _log.connectionLog(3, '_fromAttr is invalid');
            return;
        }
        var _from = _fromAttr.value().split('/')[0];

        var _toAttr = xmlRootElem.attr('to');
        if (_toAttr == null) {
            _log.connectionLog(3, '_toAttr is invalid');
            return;
        }
        var _to = _toAttr.value().split('/')[0];

        var _eventElem = Utils.getChildXmlElement(xmlRootElem, 'event');
        if (_eventElem == null) {
            _log.connectionLog(3, '_eventElem is invalid');
            return;
        }
        var _eventElemNamespace = _eventElem.namespace().href();
        if (_eventElemNamespace != 'http://jabber.org/protocol/pubsub#event') {
            _log.connectionLog(3, '_eventElemNamespace is not "Pubsub"');
            return;
        }

        var _itemsElem = Utils.getChildXmlElement(_eventElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        var _publishNodeAttr = _itemsElem.attr('node');
        if (_publishNodeAttr == null) {
            _log.connectionLog(3, '_publishNodeAttr is invalid');
            return;
        }
        var _nodeName = _publishNodeAttr.value();

        var _itemElem = Utils.getChildXmlElement(_itemsElem, 'item');
        if (_itemElem == null) {
            _log.connectionLog(3, '_itemElem is invalid');
            return;
        }

        var _itemIdAttr = _itemElem.attr('id');
        if (_itemIdAttr == null) {
            _log.connectionLog(3, '_itemIdAttr is invalid');
            return;
        }
        var _itemId = _itemIdAttr.value();

        var _pushContent = {
            type : RequestData.NOTIFY_MESSAGE_TYPE_PUBLIC,
            extras : {},
            count : 1,
            items : [],
        };

        var _itemData = {
            itemId : _itemId,
            from : _from,
            to : _to,
            type : 1,
            nodeName : _nodeName,
        };
        var _entryElem = Utils.getChildXmlElement(_itemElem, 'entry');
        if (_entryElem != null) {
            var _bodyElem = Utils.getChildXmlElement(_entryElem, 'body');
            if (_bodyElem != null) {
                _itemData.body = _bodyElem.text();
            }
            var _replyElem = Utils.getChildXmlElement(_entryElem, 'reply');
            if (_replyElem != null) {
                var _replyId = _replyElem.text();
                if (_replyId == 'no_id') {
                    _replyId = '';
                }
                _itemData.replyId = _replyId;
            }

            _itemData.replyTo = ''; 

            var _attachedElem = Utils.getChildXmlElement(_entryElem,
                    'attached_items');
            if (_attachedElem != null) {
                var _attachedItemElemArray = Utils.getChildXmlElementArray(
                        _attachedElem, 'item');
                _itemData.attachedCount = 0;
                _itemData.attachedItems = [];
                if (_attachedItemElemArray != null) {
                    _itemData.attachedCount = _attachedItemElemArray.length;
                    for ( var _j = 0; _j < _itemData.attachedCount; _j++) {
                        var _attachedItemElem = _attachedItemElemArray[_j];
                        _itemData.attachedItems[_j] = _attachedItemElem.text();
                    }
                }
            }

            var _contextElem = Utils.getChildXmlElement(_entryElem, 'context');
            if (_contextElem != null) {
                _itemData.context = _contextElem.text();
            }
        }

        _pushContent.items[0] = _itemData;
        var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE;
        _notifyPushMessge([sessionData], _notifyType, _pushContent);
    }

    function _onChatNotification(sessionDataAry, xmlRootElem) {
        var xmlRootElemTypeAttr = xmlRootElem.attr('type');
        if (xmlRootElemTypeAttr == null) {
            _log.connectionLog(3, 'xmlRootElemTypeAttr is invalid');
            return;
        }
        var _xmlRootElemType = xmlRootElemTypeAttr.value();
        if (_xmlRootElemType != 'chat') {
            _log.connectionLog(3, '_xmlRootElemType is invalid');
            return;
        }
        var _fromAttr = xmlRootElem.attr('from');
        if (_fromAttr == null) {
            _log.connectionLog(3, '_fromAttr is invalid');
            return;
        }
        var _from = _fromAttr.value().split('/')[0];

        var _toAttr = xmlRootElem.attr('to');
        if (_toAttr == null) {
            _log.connectionLog(3, '_toAttr is invalid');
            return;
        }
        var _to = _toAttr.value().split('/')[0];

        var _bodyElem = Utils.getChildXmlElement(xmlRootElem, 'body');
        if (_bodyElem == null) {
            _log.connectionLog(3, '_bodyElem is invalid');
            return;
        }
        var _body = _bodyElem.text();
        var _replyId = '';
        var _replyIdElem = Utils.getChildXmlElement(xmlRootElem, 'reply_id');
        if (_replyIdElem != null) {
            _replyId = _replyIdElem.text();
        }

        var _pushContent = {
            type : RequestData.NOTIFY_MESSAGE_TYPE_CHAT,
            extras : {},
            count : 1,
            items : [],
        };

        var _itemData = {
            from : _from,
            to : _to,
            body : _body,
            replyId : _replyId,
        };
        _pushContent.items[0] = _itemData;

        var _notifyType = Const.API_NOTIFY.API_NOTIFY_NOTIFICATION;
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }

    function _onChatMessage(sessionDataAry, xmlRootElem) {
        _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._onChatMessage(...");
        var _chatElem = Utils.getChildXmlElement(xmlRootElem, 'chat');
        if (_chatElem == null) {
            _log.connectionLog(3, '_chatElem is invalid');
            return;
        }
        var _itemsElem = Utils.getChildXmlElement(_chatElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log.connectionLog(3, '_itemElemArray is invalid');
            return;
        }
        var _tenantUuid = sessionDataAry[0].getTenantUuid();
        var _ret = _getMessageItemsFromMessageItemElementArray(_tenantUuid, _itemElemArray,
                _callback);
        return;

        function _callback(itemsData) {
            var _pushContent = {
                type : RequestData.NOTIFY_MESSAGE_TYPE_CHAT,
                extras : {},
                count : itemsData.length,
                items : itemsData,
            };
            var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _onTaskMessage(sessionDataAry, xmlRootElem) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp._onTaskMessage(..');
        var _taskElem = Utils.getChildXmlElement(xmlRootElem, 'task');
        if (_taskElem == null) {
            _log.connectionLog(3, '_taskElem is invalid');
            return;
        }
        var _subType = 0;
        var _taskNamespace = _taskElem.namespace().href();
        if (_taskNamespace == 'http://necst.nec.co.jp/protocol/task#add') {
            _subType = 1;
        } else if (_taskNamespace == 'http://necst.nec.co.jp/protocol/task#update') {
            _subType = 2;
        } else {
            _log.connectionLog(3, 'task namespace is invalid');
            return;
        }
        var _itemsElem = Utils.getChildXmlElement(_taskElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log.connectionLog(3, '_itemElemArray is invalid');
            return;
        }
        var _tenantUuid = sessionDataAry[0].getTenantUuid();
        _getMessageItemsFromMessageItemElementArray(_tenantUuid, _itemElemArray, _callback);
        return;

        function _callback(itemsData) {
            var _pushContent = {
                type : RequestData.NOTIFY_MESSAGE_TYPE_TASK,
                extras : {
                    subType : _subType,
                },
                count : itemsData.length,
                items : itemsData,
            };
            var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _onSystemMessage(sessionDataAry, xmlRootElem) {
        _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._onSystemMessage(...");
        var _systemElem = Utils.getChildXmlElement(xmlRootElem, 'system');
        if (_systemElem == null) {
            _log.connectionLog(3, '_systemElem is invalid');
            return;
        }
        var _itemsElem = Utils.getChildXmlElement(_systemElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log.connectionLog(3, '_itemElemArray is invalid');
            return;
        }
        var _tenantUuid = sessionDataAry[0].getTenantUuid();
        _getMessageItemsFromMessageItemElementArray(_tenantUuid, _itemElemArray, _callback);
        return;

        function _callback(itemsData) {
            var _pushContent = {
                type : RequestData.NOTIFY_MESSAGE_TYPE_SYSTEM,
                extras : {},
                count : itemsData.length,
                items : itemsData,
            };
            var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _onGoodJobMessage(sessionDataAry, xmlRootElem) {
        var _goodJobElem = Utils.getChildXmlElement(xmlRootElem, 'goodjob');
        if (_goodJobElem == null) {
            _log.connectionLog(3, '_goodJobElem is invalid');
            return;
        }
        var _itemsElem = Utils.getChildXmlElement(_goodJobElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        var _itemCount = 0;
        var _items_to_check = [];
        var _items = [];
        _getGoodJobItemsFromGoodJobItemsXML(_itemsElem, function(retCount, retItems){
            _itemCount = retCount;
            _items_to_check = retItems;
            function _onCheckedAuthority(checked_items) {
                for (var i = 0; i < _items_to_check.length; ++i) {
                    if (checked_items[_items_to_check[i].itemId].have_policy == true) {
                        _items.push(_items_to_check[i]);
                    }
                }
                if (_items.length == 0) {
                    _log.connectionLog(6, '_onGoodJobMessage, authority check denied all.');
                } else {
                    _notifyGoodJob();
                }
            }
            AuthorityChecker.checkOnMessage(sessionDataAry, _items_to_check, _onCheckedAuthority);
        });
        function _notifyGoodJob() {
            var _pushContent = {
                type : RequestData.NOTIFY_MESSAGE_OPTION_TYPE_ADD_GOOD_JOB,
                extras : {},
                count : _itemCount,
                items : _items,
            };
            var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE_OPTION;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _getGoodJobItemsFromGoodJobItemsXML(_goodJobItemsXMLElem, callback) {
        var _retZeroCount = 0;
        var _retZeroItems = [];
        var _itemCount = 0;
        var _items = [];
        if (_goodJobItemsXMLElem == null) {
            _log.connectionLog(3, '_goodJobItemsXMLElem is invalid');
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }
        var _goodJobItemElemArray = Utils.getChildXmlElementArray(_goodJobItemsXMLElem,
                'item');
        if(_goodJobItemElemArray != null) {
            var _jidList = [];
            _itemCount = _goodJobItemElemArray.length;
            if(_itemCount == 0) {
                setTimeout(function(){
                    callback(_retZeroCount, _retZeroItems);
                }, 1);
                return;
            }
            for(var _i = 0; _i < _itemCount; _i++) {
                var _goodJobItemElem = _goodJobItemElemArray[_i];
                var _goodJobData = {};
                var _goodJobItemIdAttr = _goodJobItemElem.attr('itemid');
                if (_goodJobItemIdAttr != null) {
                    _goodJobData.itemId = _goodJobItemIdAttr.value();
                }
                var _goodJobMsgOwnJidAttr = _goodJobItemElem.attr('msgownjid');
                if (_goodJobMsgOwnJidAttr != null) {
                    _goodJobData.msgOwnJid = _goodJobMsgOwnJidAttr.value();
                }
                var _goodJobMsgToAttr = _goodJobItemElem.attr('msgto');
                if (_goodJobMsgToAttr != null) {
                    _goodJobData.msgTo = _goodJobMsgToAttr.value();
                }
                var _goodJobMsgTypeAttr = _goodJobItemElem.attr('msgtype');
                if (_goodJobMsgTypeAttr != null) {
                    _goodJobData.msgType = parseInt(_goodJobMsgTypeAttr.value());
                }
                var _goodJobBodyAttr = _goodJobItemElem.attr('body');
                if (_goodJobBodyAttr != null) {
                    _goodJobData.body = _goodJobBodyAttr.value();
                }

                var _goodJobFromJidAttr = _goodJobItemElem.attr('fromjid');
                if (_goodJobFromJidAttr != null) {
                    _goodJobData.fromJid = _goodJobFromJidAttr.value();
                }
                var _goodJobFromNameAttr = _goodJobItemElem.attr('fromname');
                if (_goodJobFromNameAttr != null) {
                    _goodJobData.fromName = _goodJobFromNameAttr.value();
                }
                var _goodJobDateAttr = _goodJobItemElem.attr('date');
                if (_goodJobDateAttr != null) {
                    _goodJobData.date = _goodJobDateAttr.value();
                }
                var _nickNameElem = Utils.getChildXmlElement(_goodJobItemElem, 'nickname');
                if(_nickNameElem != null) {
                    _goodJobData.nickName = _nickNameElem.text();
                }
                var _avatarDataElem = Utils.getChildXmlElement(_goodJobItemElem, 'avatardata');
                if(_avatarDataElem != null) {
                    _goodJobData.avatarData = _avatarDataElem.text();
                }
                var _avatarTypeElem = Utils.getChildXmlElement(_goodJobItemElem, 'avatartype');
                if(_avatarTypeElem != null) {
                    _goodJobData.avatarType = _avatarTypeElem.text();
                }
                var _statusElem = Utils.getChildXmlElement(_goodJobItemElem, 'status');
                if(_statusElem != null) {
                    _goodJobData.status = parseInt(_statusElem.text());
                }

                _items[_i] = _goodJobData;
                _jidList.push(_goodJobData.fromJid);
            }
            if(_jidList.length > 0) {
                UserAccountUtils.getLoginAccountListByJidList(_jidList, _onGetUserAccountDataCallBackForGoodJobData);
            } else {
                setTimeout(function(){
                    callback(_retZeroCount, _retZeroItems);
                }, 1);
                return;
            }
        } else {
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }
        function _onGetUserAccountDataCallBackForGoodJobData(mapData) {
            var _itemCount = _items.length;
            for(var _i = 0; _i < _itemCount; _i++) {
                var _goodJobData = _items[_i];
                _goodJobData.userName = mapData[_goodJobData.fromJid];
            }
            setTimeout(function(){
                callback(_itemCount, _items);
            }, 1);
        }
    }

    function _getGoodJobTotalFromGoodJobCountingXML(_goodJobItemsXMLElem, callback) {
        var _retZeroCount = 0;
        var _retZeroItems = [];
        var _itemCount = 0;
        var _items = [];
        if (_goodJobItemsXMLElem == null) {
            _log.connectionLog(3, '_goodJobItemsXMLElem is invalid');
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }

        var _goodJobItemElemArray = Utils.getChildXmlElementArray(_goodJobItemsXMLElem,'item');
        if(_goodJobItemElemArray != null) {
            var _jidList = [];
            _itemCount = _goodJobItemElemArray.length;
            if(_itemCount == 0) {
                setTimeout(function(){
                    callback(_retZeroCount, _retZeroItems);
                }, 1);
                return;
            }
            for(var _i = 0; _i < _itemCount; _i++) {
                var _goodJobItemElem = _goodJobItemElemArray[_i];
                var _goodJobData = {};
                var _goodJobRankElem = Utils.getChildXmlElement(_goodJobItemElem, 'rank');
                if (_goodJobRankElem != null) {
                    _goodJobData.rank = parseInt(_goodJobRankElem.text());
                }
                var _goodJobJidElem = Utils.getChildXmlElement(_goodJobItemElem, 'jid');
                if (_goodJobJidElem != null) {
                    _goodJobData.jid = _goodJobJidElem.text();
                }
                var _pointsElem = Utils.getChildXmlElement(_goodJobItemElem, 'points');
                if(_pointsElem != null) {
                    _goodJobData.points = parseInt(_pointsElem.text());
                }
                _items[_i] = _goodJobData;
            }
            setTimeout(function(){
                callback(_itemCount, _items);
            }, 1);
        } else {
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }
    }

    function _getGoodJobRankingFromGoodJobCountingXML(_goodJobItemsXMLElem, callback) {
        var _retZeroCount = 0;
        var _retZeroItems = [];
        var _itemCount = 0;
        var _items = [];
        if (_goodJobItemsXMLElem == null) {
            _log.connectionLog(3, '_goodJobItemsXMLElem is invalid');
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }

        var _goodJobItemElemArray = Utils.getChildXmlElementArray(_goodJobItemsXMLElem,'item');
        if(_goodJobItemElemArray != null) {
            var _jidList = [];
            _itemCount = _goodJobItemElemArray.length;
            if(_itemCount == 0) {
                setTimeout(function(){
                    callback(_retZeroCount, _retZeroItems);
                }, 1);
                return;
            }
            for(var _i = 0; _i < _itemCount; _i++) {
                var _goodJobItemElem = _goodJobItemElemArray[_i];
                var _goodJobData = {};
                var _goodJobRankElem = Utils.getChildXmlElement(_goodJobItemElem, 'rank');
                if (_goodJobRankElem != null) {
                    _goodJobData.rank = parseInt(_goodJobRankElem.text());
                }
                var _goodJobJidElem = Utils.getChildXmlElement(_goodJobItemElem, 'jid');
                if (_goodJobJidElem != null) {
                    _goodJobData.jid = _goodJobJidElem.text();
                }
                var _pointsElem = Utils.getChildXmlElement(_goodJobItemElem, 'points');
                if(_pointsElem != null) {
                    _goodJobData.points = parseInt(_pointsElem.text());
                }
                var _nameElem = Utils.getChildXmlElement(_goodJobItemElem, 'name');
                if(_nameElem != null) {
                    _goodJobData.name = _nameElem.text();
                }
                var _nicknameElem = Utils.getChildXmlElement(_goodJobItemElem, 'nickname');
                if(_nicknameElem != null) {
                    _goodJobData.nickname = _nicknameElem.text();
                }
                var _affiliationElem = Utils.getChildXmlElement(_goodJobItemElem, 'affiliation');
                if(_affiliationElem != null) {
                    try{
                        _goodJobData.affiliation = JSON.parse(_affiliationElem.text());
                    }catch(e){
                        _goodJobData.affiliation = JSON.parse("[]");
                    }
                }
                var _avatartypeElem = Utils.getChildXmlElement(_goodJobItemElem, 'avatartype');
                if(_avatartypeElem != null) {
                    _goodJobData.avatartype = _avatartypeElem.text();
                }
                var _avatardataElem = Utils.getChildXmlElement(_goodJobItemElem, 'avatardata');
                if(_avatardataElem != null) {
                    _goodJobData.avatardata = _avatardataElem.text();
                }

                _items[_i] = _goodJobData;
            }
            setTimeout(function(){
                callback(_itemCount, _items);
            }, 1);
        } else {
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }
    }

    function _onEmotionPointMessage(sessionDataAry, xmlRootElem) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp._onEmotionPointMessage(..');
        var _emotionPointElem = Utils.getChildXmlElement(xmlRootElem, 'emotionpoint');
        if (_emotionPointElem == null) {
            _log.connectionLog(3, '_emotionPointElem is invalid');
            return;
        }
        var _itemsElem = Utils.getChildXmlElement(_emotionPointElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        var _itemCount = 0;
        var _items_to_check = [];
        var _items = [];
        _getEmotionPointItemsFromEmotionPointItemsXML(_itemsElem, function(retCount, retItems){
            _itemCount = retCount;
            _items_to_check = retItems;
            function _onCheckedAuthority(checked_items) {
                for (var i = 0; i < _items_to_check.length; ++i) {
                    if (checked_items[_items_to_check[i].itemId].have_policy == true) {
                        _items.push(_items_to_check[i]);
                    }
                }
                if (_items.length == 0) {
                    _log.connectionLog(6, '_onEmotionPointMessage, authority check denied all.');
                } else {
                    _notifyEmotionPoint();
                }
            }
            AuthorityChecker.checkOnMessage(sessionDataAry, _items_to_check, _onCheckedAuthority);
        });
        function _notifyEmotionPoint() {
            var _pushContent = {
                type : RequestData.NOTIFY_MESSAGE_OPTION_TYPE_ADD_EMOTION_POINT,
                extras : {},
                count : _itemCount,
                items : _items,
            };
            var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE_OPTION;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _getEmotionPointItemsFromEmotionPointItemsXML(_emotionPointItemsXMLElem, callback) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp._getEmotionPointItemsFromEmotionPointItemsXML(..');
        var _retZeroCount = 0;
        var _retZeroItems = [];
        var _itemCount = 0;
        var _items = [];
        if (_emotionPointItemsXMLElem == null) {
            _log.connectionLog(3, '_emotionPointItemsXMLElem is invalid');
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }
        var _emotionPointItemElemArray = Utils.getChildXmlElementArray(_emotionPointItemsXMLElem,
                'item');
        if(_emotionPointItemElemArray != null) {
            var _jidList = [];
            _itemCount = _emotionPointItemElemArray.length;
            if(_itemCount == 0) {
                setTimeout(function(){
                    callback(_retZeroCount, _retZeroItems);
                }, 1);
                return;
            }

            for(var _i = 0; _i < _itemCount; _i++) {
                var _emotionPointItemElem = _emotionPointItemElemArray[_i];
                var _emotionPointData = {};
                var _emotionPointItemIdAttr = _emotionPointItemElem.attr('itemid');
                if (_emotionPointItemIdAttr != null) {
                    _emotionPointData.itemId = _emotionPointItemIdAttr.value();
                }
                var _emotionPointMsgOwnJidAttr = _emotionPointItemElem.attr('msgownjid');
                if (_emotionPointMsgOwnJidAttr != null) {
                    _emotionPointData.msgOwnJid = _emotionPointMsgOwnJidAttr.value();
                }
                var _emotionPointMsgToAttr = _emotionPointItemElem.attr('msgto');
                if (_emotionPointMsgToAttr != null) {
                    _emotionPointData.msgTo = _emotionPointMsgToAttr.value();
                }
                var _emotionPointMsgTypeAttr = _emotionPointItemElem.attr('msgtype');
                if (_emotionPointMsgTypeAttr != null) {
                    _emotionPointData.msgType = parseInt(_emotionPointMsgTypeAttr.value());
                }
                var _emotionPointBodyAttr = _emotionPointItemElem.attr('body');
                if (_emotionPointBodyAttr != null) {
                    _emotionPointData.body = _emotionPointBodyAttr.value();
                }
                var _emotionPointEmotionPointAttr = _emotionPointItemElem.attr('emotion_point');
                if (_emotionPointEmotionPointAttr != null) {
                    _emotionPointData.emotionPoint = parseInt(_emotionPointEmotionPointAttr.value());
                }
                var _emotionPointFromJidAttr = _emotionPointItemElem.attr('fromjid');
                if (_emotionPointFromJidAttr != null) {
                    _emotionPointData.fromJid = _emotionPointFromJidAttr.value();
                }
                var _emotionPointFromNameAttr = _emotionPointItemElem.attr('fromname');
                if (_emotionPointFromNameAttr != null) {
                    _emotionPointData.fromName = _emotionPointFromNameAttr.value();
                }
                var _emotionPointCreatedAtAttr = _emotionPointItemElem.attr('created_at');
                if (_emotionPointCreatedAtAttr != null) {
                    _emotionPointData.createdAt = _emotionPointCreatedAtAttr.value();
                }
                var _emotionPointUpdatedAtAttr = _emotionPointItemElem.attr('updated_at');
                if (_emotionPointUpdatedAtAttr != null) {
                    _emotionPointData.updatedAt = _emotionPointUpdatedAtAttr.value();
                }
                var _nickNameElem = Utils.getChildXmlElement(_emotionPointItemElem, 'nickname');
                if(_nickNameElem != null) {
                    _emotionPointData.nickName = _nickNameElem.text();
                }
                var _avatarDataElem = Utils.getChildXmlElement(_emotionPointItemElem, 'avatardata');
                if(_avatarDataElem != null) {
                    _emotionPointData.avatarData = _avatarDataElem.text();
                }
                var _avatarTypeElem = Utils.getChildXmlElement(_emotionPointItemElem, 'avatartype');
                if(_avatarTypeElem != null) {
                    _emotionPointData.avatarType = _avatarTypeElem.text();
                }
                var _statusElem = Utils.getChildXmlElement(_emotionPointItemElem, 'status');
                if(_statusElem != null) {
                    _emotionPointData.status = parseInt(_statusElem.text());
                }
                _items[_i] = _emotionPointData;
                _jidList.push(_emotionPointData.fromJid);
            }
            if(_jidList.length > 0) {
                UserAccountUtils.getLoginAccountListByJidList(_jidList, _onGetUserAccountDataCallBackForEmotionPointData);
            } else {
                setTimeout(function(){
                    callback(_retZeroCount, _retZeroItems);
                }, 1);
                return;
            }
        } else {
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }
        function _onGetUserAccountDataCallBackForEmotionPointData(mapData) {
            var _itemCount = _items.length;
            for(var _i = 0; _i < _itemCount; _i++) {
                var _emotionPointData = _items[_i];
                _emotionPointData.userName = mapData[_emotionPointData.fromJid];
            }
            setTimeout(function(){
                callback(_itemCount, _items);
            }, 1);
        }
    }

    function _getEmotionPointTotalFromEmotionPointCountingXML(_emotionPointItemsXMLElem, callback) {
        var _retZeroCount = 0;
        var _retZeroItems = [];
        var _itemCount = 0;
        var _items = [];
        if (_emotionPointItemsXMLElem == null) {
            _log.connectionLog(3, '_emotionPointItemsXMLElem is invalid');
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }

        var _emotionPointItemElemArray = Utils.getChildXmlElementArray(_emotionPointItemsXMLElem,'item');
        if(_emotionPointItemElemArray != null) {
            var _jidList = [];
            _itemCount = _emotionPointItemElemArray.length;
            if(_itemCount == 0) {
                setTimeout(function(){
                    callback(_retZeroCount, _retZeroItems);
                }, 1);
                return;
            }
            for(var _i = 0; _i < _itemCount; _i++) {
                var _emotionPointItemElem = _emotionPointItemElemArray[_i];
                var _emotionPointData = {};
                var _emotionPointRankElem = Utils.getChildXmlElement(_emotionPointItemElem, 'rank');
                if (_emotionPointRankElem != null) {
                    _emotionPointData.rank = parseInt(_emotionPointRankElem.text());
                }
                var _emotionPointJidElem = Utils.getChildXmlElement(_emotionPointItemElem, 'jid');
                if (_emotionPointJidElem != null) {
                    _emotionPointData.jid = _emotionPointJidElem.text();
                }
                var _pointsElem = Utils.getChildXmlElement(_emotionPointItemElem, 'points');
                if(_pointsElem != null) {
                    _emotionPointData.points = parseInt(_pointsElem.text());
                }
                _items[_i] = _emotionPointData;
            }
            setTimeout(function(){
                callback(_itemCount, _items);
            }, 1);
        } else {
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }
    }

    function _getEmotionPointRankingFromEmotionPointCountingXML(_emotionPointItemsXMLElem, callback) {
        var _retZeroCount = 0;
        var _retZeroItems = [];
        var _itemCount = 0;
        var _items = [];
        if (_emotionPointItemsXMLElem == null) {
            _log.connectionLog(3, '_emotionPointItemsXMLElem is invalid');
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }

        var _emotionPointItemElemArray = Utils.getChildXmlElementArray(_emotionPointItemsXMLElem,'item');
        if(_emotionPointItemElemArray != null) {
            var _jidList = [];
            _itemCount = _emotionPointItemElemArray.length;
            if(_itemCount == 0) {
                setTimeout(function(){
                    callback(_retZeroCount, _retZeroItems);
                }, 1);
                return;
            }
            for(var _i = 0; _i < _itemCount; _i++) {
                var _emotionPointItemElem = _emotionPointItemElemArray[_i];
                var _emotionPointData = {};
                var _emotionPointRankElem = Utils.getChildXmlElement(_emotionPointItemElem, 'rank');
                if (_emotionPointRankElem != null) {
                    _emotionPointData.rank = parseInt(_emotionPointRankElem.text());
                }
                var _emotionPointJidElem = Utils.getChildXmlElement(_emotionPointItemElem, 'jid');
                if (_emotionPointJidElem != null) {
                    _emotionPointData.jid = _emotionPointJidElem.text();
                }
                var _pointsElem = Utils.getChildXmlElement(_emotionPointItemElem, 'points');
                if(_pointsElem != null) {
                    _emotionPointData.points = parseInt(_pointsElem.text());
                }
                var _nameElem = Utils.getChildXmlElement(_emotionPointItemElem, 'name');
                if(_nameElem != null) {
                    _emotionPointData.name = _nameElem.text();
                }
                var _nicknameElem = Utils.getChildXmlElement(_emotionPointItemElem, 'nickname');
                if(_nicknameElem != null) {
                    _emotionPointData.nickname = _nicknameElem.text();
                }
                var _affiliationElem = Utils.getChildXmlElement(_emotionPointItemElem, 'affiliation');
                if(_affiliationElem != null) {
                    try{
                        _emotionPointData.affiliation = JSON.parse(_affiliationElem.text());
                    }catch(e){
                        _emotionPointData.affiliation = JSON.parse("[]");
                    }
                }
                var _avatartypeElem = Utils.getChildXmlElement(_emotionPointItemElem, 'avatartype');
                if(_avatartypeElem != null) {
                    _emotionPointData.avatartype = _avatartypeElem.text();
                }
                var _avatardataElem = Utils.getChildXmlElement(_emotionPointItemElem, 'avatardata');
                if(_avatardataElem != null) {
                    _emotionPointData.avatardata = _avatardataElem.text();
                }

                _items[_i] = _emotionPointData;
            }
            setTimeout(function(){
                callback(_itemCount, _items);
            }, 1);
        } else {
            setTimeout(function(){
                callback(_retZeroCount, _retZeroItems);
            }, 1);
            return;
        }
    }

    function _onThreadTitleMessage(sessionDataAry, xmlRootElem) {
        _log.connectionLog(7, 'do func SynchronousBridgeNodeXmpp._onThreadTitleMessage(...');
        const _threadTitleUpdateElem = Utils.getChildXmlElement(xmlRootElem, 'threadtitleupdate');
        if (_threadTitleUpdateElem == null) {
            _log.connectionLog(3, '_threadTitleUpdateElem is invalid');
            return;
        }
        const _itemsElem = Utils.getChildXmlElement(_threadTitleUpdateElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }

        let _threadTitleData = {};
        const _typeElem = Utils.getChildXmlElement(_itemsElem, 'type');
        let _typeStr = "";
        if(_typeElem == null ||
           (
               RequestData.SEND_MESSAGE_TYPE_PUBLIC != _typeElem.text() &&
               RequestData.SEND_MESSAGE_TYPE_CHAT != _typeElem.text() &&
               RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT != _typeElem.text() &&
               RequestData.SEND_MESSAGE_TYPE_COMMUNITY != _typeElem.text() &&
               RequestData.SEND_MESSAGE_TYPE_MURMUR != _typeElem.text()
           )) {
            _log.connectionLog(3, '_typeElem is invalid');
            return;
        }
        _typeStr = _typeElem.text();
        const _threadRootIdElem = Utils.getChildXmlElement(_itemsElem, 'thread_root_id');
        if(_threadRootIdElem != null) {
            _threadTitleData.threadRootId = _threadRootIdElem.text();
        }
        const _threadTitleElem = Utils.getChildXmlElement(_itemsElem, 'thread_title');
        if(_threadTitleElem != null) {
            _threadTitleData.threadTitle = _threadTitleElem.text();
        }
        const _itemIdElem = Utils.getChildXmlElement(_itemsElem, 'item_id');
        if(_itemIdElem != null) {
            _threadTitleData.itemId = _itemIdElem.text();
        }

        var _pushContent = {
            type : _typeStr,
            extras : {},
            count : 1,
            items : [_threadTitleData],
        };
        var _notifyType = Const.API_NOTIFY.API_NOTIFY_THREAD_TITLE;
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }

    function _onMessageOptionNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log.connectionLog(3, '_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE_OPTION) {
            _log.connectionLog(3, '_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log.connectionLog(3, '_contentElem is invalid');
            return;
        }

        var _typeElem = Utils.getChildXmlElement(_contentElem, 'type');
        if (_typeElem == null) {
            _log.connectionLog(3, '_typeElem is invalid');
            return;
        }
        var _type = _typeElem.text();
        var _extras = {};
        var _itemCount = 0;
        var _items = [];
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        switch(_type) {
        case RequestData.NOTIFY_MESSAGE_OPTION_TYPE_UPDATE_SIBLING_TASK:
            var _siblingTaskItemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
            _type = RequestData.NOTIFY_MESSAGE_OPTION_TYPE_UPDATE_SIBLING_TASK;     
            if(_siblingTaskItemElemArray != null) {
                _itemCount = _siblingTaskItemElemArray.length;
                if(_itemCount == 0) {
                    _onGetItemsCallBack(_items);
                    return;
                }
                var _jidList = [];
                for(var _i = 0; _i < _itemCount; _i++) {
                    var _siblingItemElem = _siblingTaskItemElemArray[_i];
                    var _siblingData = {};
                    var _itemIdAttr = _siblingItemElem.attr('itemid');
                    if(_itemIdAttr != null) {
                        _siblingData.itemId = _itemIdAttr.value();
                    }
                    var _siblingItemIdAttr = _siblingItemElem.attr('siblingitemid');
                    if(_siblingItemIdAttr != null) {
                        _siblingData.siblingItemId = _siblingItemIdAttr.value();
                    }
                    var _ownerJidAttr = _siblingItemElem.attr('ownerjid');
                    if(_ownerJidAttr != null) {
                        _siblingData.ownerJid = _ownerJidAttr.value();
                    }
                    var _ownerNameAttr = _siblingItemElem.attr('ownername');
                    if(_ownerNameAttr != null) {
                        _siblingData.ownerName = _ownerNameAttr.value();
                    }
                    var _statusAttr = _siblingItemElem.attr('status');
                    if(_statusAttr != null) {
                        _siblingData.status = parseInt(_statusAttr.value());
                    }
                    var _nickNameElem = Utils.getChildXmlElement(_siblingItemElem, 'nickname');
                    if(_nickNameElem != null) {
                        _siblingData.nickName = _nickNameElem.text();
                    }
                    var _avatarDataElem = Utils.getChildXmlElement(_siblingItemElem, 'avatardata');
                    if(_avatarDataElem != null) {
                        _siblingData.avatarData = _avatarDataElem.text();
                    }
                    var _avatarTypeElem = Utils.getChildXmlElement(_siblingItemElem, 'avatartype');
                    if(_avatarTypeElem != null) {
                        _siblingData.avatarType = _avatarTypeElem.text();
                    }
                    var _userStatusElem = Utils.getChildXmlElement(_siblingItemElem, 'status');
                    if(_userStatusElem != null) {
                        _siblingData.userStatus = parseInt(_userStatusElem.text());
                    }
                    _jidList.push(_siblingData.ownerJid);

                    _items[_i] = _siblingData;
                }
                function _onGetUserAccountDataCallBackForSiblingNotify(mapData) {
                    for(var _i = 0; _i < _itemCount; _i++) {
                        var _siblingData = _items[_i];
                        _siblingData.userName = mapData[_siblingData.ownerJid];
                    }
                    _onGetItemsCallBack(_items);
                }
                if(_jidList.length > 0) {
                    UserAccountUtils.getLoginAccountListByJidList(_jidList, _onGetUserAccountDataCallBackForSiblingNotify);
                } else {
                    _onGetItemsCallBack(_items);
                    return;
                }
            }
            break;
        case RequestData.NOTIFY_MESSAGE_OPTION_TYPE_DEMAND_TASK:
        case RequestData.NOTIFY_MESSAGE_OPTION_TYPE_CLEAR_DEMANDED_TASK:
            var _itemsArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
            if(_itemsArray != null){
                _itemCount = _itemsArray.length;
            }
            _items = _getItemsFromDemandItemsElm(_itemsElem);
            _onGetItemsCallBack(_items);
            break;
        case RequestData.NOTIFY_MESSAGE_OPTION_TYPE_SET_READ_MESSAGE:
            var _itemsArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
            if(_itemsArray != null){
                _itemCount = _itemsArray.length;
            }
            function _onGetItemsFromSetMessageElmCallback(items_to_check) {
                function _onCheckedAuthority(checked_items) {
                    var _items = [];
                    for (var i = 0; i < items_to_check.length; ++i) {
                        if (checked_items[items_to_check[i].itemId].have_policy == true) {
                            _items.push(items_to_check[i]);
                        }
                    }
                    if (_items.length == 0) {
                        _log.connectionLog(6, '_onGoodJobMessage, authority check denied all.');
                    } else {
                        _onGetItemsCallBack(_items);
                    }
                }
                AuthorityChecker.checkOnMessage(sessionDataAry, items_to_check, _onCheckedAuthority);
            }
            _getItemsFromSetReadMessageElm(_itemsElem, _onGetItemsFromSetMessageElmCallback);
            break;
        default:
            break;
        }

        function _onGetItemsCallBack(items) {
            var _pushContent = {
                type : _type,
                extras : _extras,
                count : _itemCount,
                items : items,
            };
            var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE_OPTION;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _getItemsFromDemandItemsElm(itemsElem) {
        if (itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return null;
        }
        var _items = null;
        var _itemsElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemsElemArray != null) {
            _items = [];
            _itemCount = _itemsElemArray.length;
            for ( var _i = 0; _i < _itemCount; _i++) {
                var _itemElem = _itemsElemArray[_i];
                var _itemData = {};
                var _taskInfoElm = Utils.getChildXmlElement(_itemElem,
                        'task_info');
                if (_taskInfoElm == null) {
                    _log.connectionLog(3, '_taskInfoElm is null');
                    continue;
                }
                var _itemIdElm = Utils.getChildXmlElement(_taskInfoElm,
                        'item_id');
                if (_itemIdElm == null) {
                    _log.connectionLog(3, '_itemIdElm is null');
                    continue;
                }
                var _itemId = _itemIdElm.text();
                var _titleElm = Utils.getChildXmlElement(_taskInfoElm, 'title');
                if (_titleElm == null) {
                    _log.connectionLog(3, '_titleElm is null');
                    continue;
                }
                var _title = _titleElm.text();
                var _ownerElm = Utils.getChildXmlElement(_taskInfoElm, 'owner');
                if (_ownerElm == null) {
                    _log.connectionLog(3, '_ownerElm is null');
                    continue;
                }
                var _owner = _ownerElm.text();
                var _clientElm = Utils.getChildXmlElement(_taskInfoElm,
                        'client');
                if (_clientElm == null) {
                    _log.connectionLog(3, '_clientElm is null');
                    continue;
                }
                var _client = _clientElm.text();
                var _statusElm = Utils.getChildXmlElement(_taskInfoElm,
                        'status');
                if (_statusElm == null) {
                    _log.connectionLog(3, '_statusElm is null');
                    continue;
                }
                var _status = parseInt(_statusElm.text());
                var _demandDateElm = Utils.getChildXmlElement(_taskInfoElm,
                        'demand_date');
                if (_demandDateElm == null) {
                    _log.connectionLog(3, '_demandDateElm is null');
                    continue;
                }
                var _demandDate = _demandDateElm.text();
                var _fromUserInfoElm = Utils.getChildXmlElement(_itemElem,
                        'from_user_info');
                if (_fromUserInfoElm == null) {
                    _log.connectionLog(3, '_fromUserInfoElm is null');
                    continue;
                }
                var _jidElm = Utils.getChildXmlElement(_fromUserInfoElm, 'jid');
                if (_jidElm == null) {
                    _log.connectionLog(3, '_jidElm is null');
                    continue;
                }
                var _jid = _jidElm.text();
                var _nicknameElm = Utils.getChildXmlElement(_fromUserInfoElm,
                        'nickname');
                if (_nicknameElm == null) {
                    _log.connectionLog(3, '_nicknameElm is null');
                    continue;
                }
                var _nickname = _nicknameElm.text();

                _itemData = {
                    "taskInfo" : {
                        "itemId" : _itemId,
                        "title" : _title,
                        "owner" : _owner,
                        "client" : _client,
                        "status" : _status,
                        "demandDate" : _demandDate,
                    },
                    "fromUserInfo" : {
                        "jid" : _jid,
                        "nickName" : _nickname,
                    },
                };
                _items[_i] = _itemData;
            }
        }
        return _items;
    }

    function _getItemsFromSetReadMessageElm(itemsElem, onGetItemsCallBack) {
        if (itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return false;
        }
        var _itemsElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemsElemArray == null) {
            return false;
        }
        var _itemsData = [];
        var _count = _itemsElemArray.length;
        var _itemDataCount = 0;
        function _createExistingReaderItemsData() {
            if (_itemDataCount >= _count) {
                setTimeout(function() {
                    _appendCubeeAccountForGetMessageResponseOrNotification(
                            _itemsData, _returnCallback);
                }, 10);
                return;
            }
            var _itemElem = _itemsElemArray[_itemDataCount];
            var _itemIdElm = Utils.getChildXmlElement(_itemElem, 'item_id');
            if (_itemIdElm == null) {
                _log.connectionLog(3, '_itemIdElm is null');
                return;
            }
            var _itemId = _itemIdElm.text();
            var _fromUserInfoElm = Utils.getChildXmlElement(_itemElem,
                    'from_user_info');
            if (_fromUserInfoElm == null) {
                _log.connectionLog(3, '_fromUserInfoElm is null');
                return;
            }
            var _ret = _getMessageExistingReaderItemFromItemElement(
                    _fromUserInfoElm, _callback);
            if (!_ret) {
                _itemDataCount++;
                _createExistingReaderItemsData();
            }

            function _callback(itemData) {
                if (itemData != null) {
                    _itemData = {
                        "itemId" : _itemId,
                        "jid" : itemData.jid,
                        "nickName" : itemData.nickName,
                        "avatarData" : itemData.avatarData,
                        "avatarType" : itemData.avatarType,
                        "date" : itemData.date,
                    };
                    _itemsData.push(_itemData);
                }
                _itemDataCount++;
                _createExistingReaderItemsData();
            }
        }
        function _returnCallback() {
            if (onGetItemsCallBack != null
                    && typeof onGetItemsCallBack == 'function') {
                setTimeout(function() {
                    onGetItemsCallBack(_itemsData);
                }, 1);
            }
        }
        setTimeout(function() {
            _createExistingReaderItemsData();
        }, 10);
        return true;
    }

    function _onChangePersonDataNotify(sessionDataAry, xmlRootElem, xsConn) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log.connectionLog(3, '_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_CHANGE_PERSON_DATA) {
            _log.connectionLog(3, '_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log.connectionLog(3, '_contentElem is invalid');
            return;
        }

        var _typeElem = Utils.getChildXmlElement(_contentElem, 'type');
        if (_typeElem == null) {
            _log.connectionLog(3, '_typeElem is invalid');
            return;
        }
        var _type = _typeElem.text();
        var _extras = {};
        var _itemCount = 0;
        var _items = [];
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        switch (_type) {
        case RequestData.NOTIFY_CHANGE_PERSON_DATA_TYPE_PRESENCE:
            if (_itemsElem == null) {
                _log.connectionLog(3, '_itemsElem is invalid');
                return;
            }
            var _presenceItemElemArray = Utils.getChildXmlElementArray(
                    _itemsElem, 'item');
            if (_presenceItemElemArray != null) {
                _itemCount = _presenceItemElemArray.length;
                for ( var _i = 0; _i < _itemCount; _i++) {
                    var _presenceItemElem = _presenceItemElemArray[_i];
                    var _presenceData = {};
                    var _jidAttr = _presenceItemElem.attr('jid');
                    if (_jidAttr != null) {
                        _presenceData.jid = _jidAttr.value();
                    }
                    var _presenceAttr = _presenceItemElem.attr('presence');
                    if (_presenceAttr != null) {
                        _presenceData.presence = parseInt(_presenceAttr.value());
                    }
                    var _myMemoAttr = _presenceItemElem.attr('myMemo');
                    if (_myMemoAttr != null) {
                        _presenceData.myMemo = _myMemoAttr.value();
                    }
                    var _updateTimeAttr = _presenceItemElem.attr('updateTime');
                    if (_updateTimeAttr != null) {
                        _presenceData.updateTime = _updateTimeAttr.value();
                    }
                    _items[_i] = _presenceData;
                }
            }
            _type = RequestData.NOTIFY_CHANGE_PERSON_DATA_TYPE_PRESENCE; 
            break;
        case RequestData.NOTIFY_CHANGE_PERSON_DATA_TYPE_PROFILE:
            if (_itemsElem == null) {
                _log.connectionLog(3, '_itemsElem is invalid');
                return;
            }
            var _profileItemElemArray = Utils.getChildXmlElementArray(
                    _itemsElem, 'item');
            if (_profileItemElemArray != null) {
                _itemCount = _profileItemElemArray.length;
                for ( var _i = 0; _i < _itemCount; _i++) {
                    var _profileItemElem = _profileItemElemArray[_i];
                    var _profileData = {};
                    var _jidElem = Utils.getChildXmlElement(_profileItemElem,
                            'jid');
                    if (_jidElem != null) {
                        _profileData.jid = _jidElem.text();
                    }
                    var _nickNameElem = Utils.getChildXmlElement(
                            _profileItemElem, 'nickName');
                    if (_nickNameElem != null) {
                        _profileData.nickName = _nickNameElem.text();
                    }
                    var _groupArray = Utils.getChildXmlElement(
                        _profileItemElem, 'group');
                    let _groupItems = [];
                    if(_groupArray != null){
                        let _grops = Utils.getChildXmlElementArray(_groupArray, 'item');
                        if (_grops != null) {
                            for (let _j = 0; _j < _grops.length; _j++) {
                                let _groupElem = _grops[_j];
                                _groupItems.push(_groupElem.text());
                            }
                        }
                    }
                    _profileData.group = _groupItems;

                    var _avatarTypeElem = Utils.getChildXmlElement(
                            _profileItemElem, 'avatarType');
                    if (_avatarTypeElem != null) {
                        _profileData.avatarType = _avatarTypeElem.text();
                    }
                    var _avatarDataElem = Utils.getChildXmlElement(
                            _profileItemElem, 'avatarData');
                    if (_avatarDataElem != null) {
                        _profileData.avatarData = _avatarDataElem.text();
                    }
                    var _updateTimeElem = Utils.getChildXmlElement(
                            _profileItemElem, 'updateTime');
                    if (_updateTimeElem != null) {
                        _profileData.updateTime = _updateTimeElem.text();
                    }
                    _items[_i] = _profileData;
                }
            }
            break;
        default:
            break;
        }
        var _pushContent = {
            type : _type,
            extras : _extras,
            count : _itemCount,
            items : _items,
        };

        var _notifyType = Const.API_NOTIFY.API_NOTIFY_CHANGE_PERSON_DATA;
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }
    function _onMessageNotify(sessionDataAry, xmlRootElem) {
        _log.connectionLog(7, "do func  SynchronousBridgeNodeXmpp._onMessageNotify(...");
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log.connectionLog(3, '_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE &&
            _notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_MESSAGE_BODY ) {
            _log.connectionLog(3, '_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log.connectionLog(3, '_contentElem is invalid');
            return;
        }

        var _type = _contentElem.attr('type').value();

        var _extras = {};
        if (_type == 'Public' ||
            _type == 'Chat' ||
            _type == 'GroupChat'||
            _type == 'Task'||
            _type == 'Community'||
            _type == 'Murmur') {
            var _extrasElem = Utils.getChildXmlElement(_contentElem, 'extras');
            if (_extrasElem != null) {
                var _subTypeElem = Utils.getChildXmlElement(_extrasElem,
                        'sub_type');
                if (_subTypeElem != null) {
                    var _subType = parseInt(_subTypeElem.text());
                    _extras.subType = _subType;
                } else {
                    _log.connectionLog(3, '_subTypeElem is null');
                }
            } else {
                let loglevel = 5;
                if(_type == 'Task'){
                    loglevel = 3;
                }
                _log.connectionLog(loglevel, '_extrasElem is null _type:' + _type);
            }
        }
        var _items = [];
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log.connectionLog(3, '_itemElemArray is invalid');
            return;
        }
        var _tenantUuid = sessionDataAry[0].getTenantUuid();
        function _onGetItemsFromMessageItemElementArray(items_to_check) {
            function _onCheckedAuthority(checked_items) {
                var _items_to_notify = [];
                for (var i = 0; i < items_to_check.length; ++i) {
                    if (checked_items[items_to_check[i].itemId].have_policy == true) {
                        _items_to_notify.push(items_to_check[i]);
                    }
                }
                if (_items_to_notify.length == 0) {
                    _log.connectionLog(6, '_onGoodJobMessage, authority check denied all.');
                } else {
                    _callback(_items_to_notify);
                }
            }
            AuthorityChecker.checkOnMessage(sessionDataAry, items_to_check, _onCheckedAuthority);
        }
        _getMessageItemsFromMessageItemElementArray(_tenantUuid, _itemElemArray, _onGetItemsFromMessageItemElementArray);
        return;

        function _callback(itemsData) {
            var _pushContent = {
                type : _type,
                extras : _extras,
                count : itemsData.length,
                items : itemsData,
            };

            var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }


    function _onMessageDeleteNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log.connectionLog(3, '_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE_DELETE) {
            _log.connectionLog(3, '_notifyElemNamespace is invalid');
            return;
        }
        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log.connectionLog(3, '_contentElem is invalid');
            return;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3, '_itemsElem is invalid');
            return;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(_itemsElem, 'item');
        if (_itemElemArray == null) {
            _log.connectionLog(3, '_itemElemArray is invalid');
            return;
        }
        var _items = [];
        var _count = _itemElemArray.length;
        var _itemData = {};
        var _itemDataCount = 0;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            if (_itemElem == null) {
                continue;
            }
            var _itemIdElem = Utils.getChildXmlElement(_itemElem, 'item_id');
            if (_itemIdElem == null) {
                _log.connectionLog(7, 'Message' + _i + '  : itemId');
                return null;
            }
            _itemData.itemId = _itemIdElem.text();

            var _deleteFlagElem = Utils.getChildXmlElement(_itemElem,
                    'delete_flag');
            if (_deleteFlagElem == null) {
                _log.connectionLog(7, 'Message' + _i + '  : deleteFlag');
                return null;
            }
            _itemData.deleteFlag = parseInt(_deleteFlagElem.text());

            var _deletedByElem = Utils.getChildXmlElement(_itemElem,
                    'deleted_by');
            if (_deletedByElem == null) {
                _log.connectionLog(7, 'Message' + _i + '  : _deletedBy');
                return null;
            }
            _itemData.AdminDeleted = Utils.CheckDeletedBy(_deletedByElem.text());

            _items[_itemDataCount] = _itemData;
            _itemDataCount++;
        }
        function _onCheckedAuthority(checked_items) {
            var _items_to_notify = [];
            for (var i = 0; i < _items.length; ++i) {
                if (checked_items[_items[i].itemId].have_policy == true) {
                    _items_to_notify.push(_items[i]);
                }
            }
            if (_items_to_notify.length == 0) {
                _log.connectionLog(6, '_onGoodJobMessage, authority check denied all.');
            } else {
                var _pushContent = {
                    type : "Delete",
                    extras : {},
                    count : _items_to_notify.length,
                    items : _items_to_notify,
                };
                var _notifyType = Const.API_NOTIFY.API_NOTIFY_MESSAGE;
                _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
            }
        }
        AuthorityChecker.checkOnMessage(sessionDataAry, _items, _onCheckedAuthority);
    }

    function _onCreateChatRoomNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log.connectionLog(3,
                    '_onCreateChatRoomNotify::_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_CREATE_CHAT_ROOM) {
            _log.connectionLog(3,
                    '_onCreateChatRoomNotify::_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log.connectionLog(3,
                    '_onCreateChatRoomNotify::_contentElem is invalid');
            return;
        }
        var _extras = {};
        var _itemCount = 0;
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        var _items = null;
        if(_itemsElem != null) {
            function _onGetItemsFromGroupChatRoomInfoItemsElem(items) {
                _items = items;
                _notifyPush();
            }
            _getItemsFromGroupChatRoomInfoItemsElem(_itemsElem, _onGetItemsFromGroupChatRoomInfoItemsElem);
        } else {
            _notifyPush();
        }
        function _notifyPush() {
            if(_items == null) {
                _items = [];
            } else {
                _itemCount = _items.length;
            }
            var _pushContent = {
                type : RequestData.NOTIFY_CREATE_GROUP_TYPE_GROUP_CHAT_ROOM,
                extras : _extras,
                count : _itemCount,
                items : _items,
            };

            var _notifyType = Const.API_NOTIFY.API_NOTIFY_CREATE_GROUP;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _onAddChatRoomMemberNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log.connectionLog(3,
                    '_onAddChatRoomMemberNotify::_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_ADD_CHAT_ROOM_MEMBER) {
            _log
                    .connectionLog(3,
                            '_onAddChatRoomMemberNotify::_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log.connectionLog(3,
                    '_onAddChatRoomMemberNotify::_contentElem is invalid');
            return;
        }
        var _extras = {};
        var _itemCount = 0;
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        var _items = null;
        if(_itemsElem != null) {
            function _onGetItemsFromAddGroupChatMemberItemsElem(items) {
                _items = items;
                _notifyPush();
            }
            _getItemsFromAddGroupChatMemberItemsElem(_itemsElem, _onGetItemsFromAddGroupChatMemberItemsElem);
        } else {
            _notifyPush();
        }
        function _notifyPush() {
            if(_items == null) {
                _items = [];
            } else {
                _itemCount = _items.length;
            }
            var _pushContent = {
                type : RequestData.NOTIFY_ADD_MEMBER_TYPE_GROUP_CHAT_ROOM,
                extras : _extras,
                count : _itemCount,
                items : _items,
            };

            var _notifyType = Const.API_NOTIFY.API_NOTIFY_ADD_MEMBER;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _onRemoveChatRoomMemberNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onRemoveChatRoomMemberNotify::_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_REMOVE_CHAT_ROOM_MEMBER) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onRemoveChatRoomMemberNotify::_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onRemoveChatRoomMemberNotify::_contentElem is invalid');
            return;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onRemoveChatRoomMemberNotify::_itemsElem is invalid');
            return;
        }
        var _itemObj = _getItemsFromRemoveGroupChatMemberItemsElem(_itemsElem,
                1);
        var _items = _itemObj.items;
        var _extras = {
            removeType : _itemObj.removeType
        };
        if (_items == null || _items.length <= 0) {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#_onRemoveChatRoomMemberNotify:: _items is invalid');
            return;
        }
        var _itemCount = _items.length;
        var _pushContent = {
            type : RequestData.NOTIFY_REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM,
            extras : _extras,
            count : _itemCount,
            items : _items,
        };
        var _notifyType = Const.API_NOTIFY.API_NOTIFY_REMOVE_MEMBER;
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }

    function _notifyPushMessge(sessionDataAry, notifyType, pushContent) {
        if(sessionDataAry == null){
            return;
        }
        var _index = 0;
        function _callPushMessage(){
            var _accessToken = sessionDataAry[_index].getAccessToken();
            _index++;
            _log.connectionLog(7, 'notifyPushMessage:['+_accessToken+']');
            CubeeWebApi.getInstance().pushMessage(_accessToken, notifyType, pushContent);
            if(_index < sessionDataAry.length){
                setTimeout(_callPushMessage, 1);
            }
        }
        setTimeout(_callPushMessage, 1);
    }
    function _onUpdateChatRoomInfoNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log.connectionLog(3,
                    '_onUpdateChatRoomInfoNotify::_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_CHATROOM_INFO) {
            _log
                    .connectionLog(3,
                            '_onUpdateChatRoomInfoNotify::_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log.connectionLog(3,
                    '_onUpdateChatRoomInfoNotify::_contentElem is invalid');
            return;
        }
        var _extrasElem = Utils.getChildXmlElement(_contentElem, 'extras');
        if (_extrasElem == null) {
            _log.connectionLog(3,
                    '_onUpdateChatRoomInfoNotify::_extrasElem is invalid');
            return;
        }
        var _extras = _getExtrasFromGroupChatRoomInfoExtrasElem(_extrasElem);
        if (_extras == null) {
            _extras = {};
        }
        var _itemCount = 0;
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        var _items = null;
        if(_itemsElem != null) {
            function _onGetItemsFromGroupChatRoomInfoItemsElem(items) {
                _items = items;
                _notifyPush();
            }
            _getItemsFromGroupChatRoomInfoItemsElem(_itemsElem, _onGetItemsFromGroupChatRoomInfoItemsElem);
        } else {
            _notifyPush();
        }
        function _notifyPush() {
            if(_items == null) {
                _items = [];
            } else {
                _itemCount = _items.length;
            }
            var _pushContent = {
                type : RequestData.NOTIFY_UPDATE_GROUP_TYPE_GROUP_CHAT_ROOM_INFO,
                extras : _extras,
                count : _itemCount,
                items : _items,
            };

            var _notifyType = Const.API_NOTIFY.API_NOTIFY_UPDATE_GROUP;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }
    function _getExtrasFromGroupChatRoomInfoExtrasElem(extrasElem) {
        if (extrasElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromGroupChatRoomInfoExtrasElem :: extrasElem is null');
            return null;
        }
        var _extras = {};
        var _subTypeElem = Utils.getChildXmlElement(extrasElem, 'subtype');
        if (_subTypeElem == null) {
            _log
                    .connectionLog(3,
                            '_getExtrasFromGroupChatRoomInfoExtrasElem :: _subTypeElem is null');
            return null;
        }
        var _itemElemArray = Utils
                .getChildXmlElementArray(_subTypeElem, 'item');
        if (_itemElemArray == null) {
            _log.connectionLog(3, '_itemElemArray is invalid');
            return;
        }
        var _subTypeArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            _subTypeArray[_itemIndex] = _itemElem.text();
            _itemIndex++;
        }
        var _preRoomNameElem = Utils.getChildXmlElement(extrasElem,
                'preroomname');
        var _preRoomName = _preRoomNameElem.text();
        var _preNotifyTypeElem = Utils.getChildXmlElement(extrasElem,
                'prenotify_type');
        var _preNotifyType = parseInt(_preNotifyTypeElem.text());
        var _prePrivacyTypeElem = Utils.getChildXmlElement(extrasElem,
                'preprivacy_type');
        var _prePrivacyType = parseInt(_prePrivacyTypeElem.text());

        _extras = {
            "subType" : _subTypeArray,
            "preRoomName" : _preRoomName,
            "preNotifyType" : _preNotifyType,
            "prePrivacyType" : _prePrivacyType
        };
        return _extras;
    }

    function _onUpdateCommunityInfoNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log.connectionLog(3,
                    '_onUpdateCommunityInfoNotify::_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_COMMUNITY_INFO) {
            _log
                    .connectionLog(3,
                            '_onUpdateCommunityInfoNotify::_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log.connectionLog(3,
                    '_onUpdateCommunityInfoNotify::_contentElem is invalid');
            return;
        }
        var _extrasElem = Utils.getChildXmlElement(_contentElem, 'extras');
        if (_extrasElem == null) {
            _log.connectionLog(3,
                    '_onUpdateCommunityInfoNotify::_extrasElem is invalid');
            return;
        }
        var _extras = _getExtrasFromUpdateCommunityInfoExtrasElem(_extrasElem);
        if (_extras == null) {
            _extras = {};
            _log.connectionLog(6,
                    '_onUpdateCommunityInfoNotify::_extras is nothing');
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log.connectionLog(3,
                    '_onUpdateCommunityInfoNotify::_itemsElem is invalid');
            return;
        }
        var _items = _getItemsFromCommunityInfoItemsElem(_itemsElem);
        if (_items == null) {
            _log.connectionLog(3,
                    '_onUpdateCommunityInfoNotify::_items is invalid');
            return;
        }
        var _itemCount = _items.length;
        var _pushContent = {
            type : RequestData.NOTIFY_UPDATE_GROUP_TYPE_COMMUNITY_ROOM_INFO,
            extras : _extras,
            count : _itemCount,
            items : _items,
        };

        var _notifyType = Const.API_NOTIFY.API_NOTIFY_UPDATE_GROUP;
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }

    function _onAddCommunityMemberNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#_onAddCommunityMemberNotify::_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_ADD_COMMUNITY_MEMBER) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onAddCommunityMemberNotify::_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onAddCommunityMemberNotify::_contentElem is invalid');
            return;
        }
        var _extras = {};
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#_onAddCommunityMemberNotify::_itemsElem is invalid');
            return;
        }
        var _items = _getItemsFromAddCommunityMemberItemsElem(_itemsElem);
        if (_items == null || _items.length <= 0) {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#_onAddCommunityMemberNotify:: _items is invalid');
            return;
        }

        _appendCubeeAccountForAddMemberResponseOrNotification(_items,
                _onAppendCubeeAccountCallback);
        function _onAppendCubeeAccountCallback(returnItems) {
            var _itemCount = 0;
            if (returnItems != null) {
                _itemCount = returnItems.length;
            }
            var _pushContent = {
                type : RequestData.NOTIFY_ADD_MEMBER_TYPE_COMMUNITY_ROOM,
                extras : _extras,
                count : _itemCount,
                items : returnItems,
            };
            var _notifyType = Const.API_NOTIFY.API_NOTIFY_ADD_MEMBER;
            _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
        }
    }

    function _onUpdateCommunityOwnerNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onUpdateCommunityOwnerNotify::_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_COMMUNITY_OWNER) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onUpdateCommunityOwnerNotify::_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onUpdateCommunityOwnerNotify::_contentElem is invalid');
            return;
        }
        var _extras = _getExtrasFromUpdateCommunityOwnerResponceContent(_contentElem);
        if (_extras == null) {
            _log
                    .connectionLog(
                            6,
                            'SynchronousBridgeNodeXmpp#_onUpdateCommunityOwnerNotify::notify data(extras) is invalid');
            _extras = {};
        }
        _items = _getItemsFromUpdateCommunityOwnerResponceContent(_contentElem);
        if (_items == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onUpdateCommunityOwnerNotify::notify data(items) is invalid');
            return;
        }

        var _itemCount = _items.length;

        var _pushContent = {
            type : RequestData.NOTIFY_UPDATE_MEMBER_TYPE_COMMUNITY_OWNER,
            extras : _extras,
            count : _itemCount,
            items : _items,
        };
        var _notifyType = Const.API_NOTIFY.API_NOTIFY_UPDATE_MEMBER;
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }

    function _onRemoveCommunityMemberNotify(sessionDataAry, xmlRootElem) {
        var _notifyElem = Utils.getChildXmlElement(xmlRootElem, 'notify');
        if (_notifyElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onRemoveCommunityMemberNotify::_notifyElem is invalid');
            return;
        }
        var _notifyElemNamespace = _notifyElem.namespace().href();
        if (_notifyElemNamespace != RequestData.XMPP_NOTIFY_NAMESPACE_REMOVE_COMMUNITY_MEMBER) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onRemoveCommunityMemberNotify::_notifyElemNamespace is invalid');
            return;
        }

        var _contentElem = Utils.getChildXmlElement(_notifyElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onRemoveCommunityMemberNotify::_contentElem is invalid');
            return;
        }
        var _extras = {};
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_onRemoveCommunityMemberNotify::_itemsElem is invalid');
            return;
        }
        var _items = _getItemsFromRemoveCommunityMemberItemsElem(_itemsElem);
        if (_items == null || _items.length <= 0) {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#_onRemoveCommunityMemberNotify:: _items is invalid');
            return;
        }
        var _itemCount = _items.length;
        var _pushContent = {
            type : RequestData.NOTIFY_REMOVE_MEMBER_TYPE_COMMUNITY_ROOM,
            extras : _extras,
            count : _itemCount,
            items : _items,
        };
        var _notifyType = Const.API_NOTIFY.API_NOTIFY_REMOVE_MEMBER;
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }

    function _onDeleteNoteNotify(sessionDataAry, xmlRootElem) {
        _log.connectionLog(7,'do func SynchronousBridgeNodeXmpp#_onDeleteNoteNotify(');
        _log.connectionLog(7,'do func SynchronousBridgeNodeXmpp#_onDeleteNoteNotify('+xmlRootElem);
        var _deleteNoteElem = Utils.getChildXmlElement(xmlRootElem, 'notedelete');
        if (_deleteNoteElem == null) {
            _log.connectionLog(3, '_deleteNoteElem is invalid');
            return;
        }
        var _itemElem = Utils.getChildXmlElement(_deleteNoteElem, 'item');
        if (_itemElem == null) {
            _log.connectionLog(3, '_itemElem is invalid');
            return;
        }
        var _pushContent = {
            note_title : (_itemElem.attr("note_title") ? _itemElem.attr("note_title").value() : ""),
            note_url   : (_itemElem.attr("note_url") ? _itemElem.attr("note_url").value() : ""),
            thread_root_id : (_itemElem.attr("thread_root_id") ? _itemElem.attr("thread_root_id").value() : ""),
            room_id    : (_itemElem.attr("room_id") ? _itemElem.attr("room_id").value() : ""),
            ownjid     : (_itemElem.attr("ownjid") ? _itemElem.attr("ownjid").value() : ""),
            created_at : (_itemElem.attr("created_at") ? _itemElem.attr("created_at").value() : ""),
            updated_at : (_itemElem.attr("updated_at") ? _itemElem.attr("updated_at").value() : "")
        };
        var _notifyType = Const.API_NOTIFY.API_NOTIFY_DELETE_NOTE;
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }

    function _onUpdateNoteInfoNotify(sessionDataAry, xmlRootElem) {
        _log.connectionLog(7,'do func SynchronousBridgeNodeXmpp#_onUpdateNoteInfoNotify(');
        var _updateNoteInfoElem = Utils.getChildXmlElement(xmlRootElem, 'noteinfoupdate');
        if (_updateNoteInfoElem == null) {
            _log.connectionLog(3, '_updateNoteInfoElem is invalid');
            return;
        }
        var _itemElem = Utils.getChildXmlElement(_updateNoteInfoElem, 'item');
        if (_itemElem == null) {
            _log.connectionLog(3, '_itemElem is invalid');
            return;
        }
        var _pushContent = {
            note_title : (_itemElem.attr("note_title") ? _itemElem.attr("note_title").value() : ""),
            note_url   : (_itemElem.attr("note_url") ? _itemElem.attr("note_url").value() : ""),
            thread_root_id : (_itemElem.attr("thread_root_id") ? _itemElem.attr("thread_root_id").value() : ""),
            old_thread_root_id : (_itemElem.attr("old_thread_root_id") ? _itemElem.attr("old_thread_root_id").value() : ""),
            room_id    : (_itemElem.attr("room_id") ? _itemElem.attr("room_id").value() : ""),
            ownjid     : (_itemElem.attr("ownjid") ? _itemElem.attr("ownjid").value() : ""),
            created_at : (_itemElem.attr("created_at") ? _itemElem.attr("created_at").value() : ""),
            updated_at : (_itemElem.attr("updated_at") ? _itemElem.attr("updated_at").value() : "")
        };
        var _notifyType = Const.API_NOTIFY.API_NOTIFY_UPDATE_NOTE_INFO
        _notifyPushMessge(sessionDataAry, _notifyType, _pushContent);
    }

    function xsErrorOccurred(xsConn, error) {
        _log.connectionLog(7, 'XMPP error occurred');
        if (xsConn == null) {
            return;
        }
        if (xsConn.status < LOGIN_STATUS_LOGINED) {
            _log.connectionLog(4, 'login status : ' + xsConn.status);
            setTimeout(function() {
                xsConn.disconnect();
                if (xsConn.status == LOGIN_STATUS_AUTHENTICATING) {
                    xsConn.onLogindCallback(false,
                            DISCCONECT_REASON_ERROR_AUTH, null);
                } else {
                    xsConn.onLogindCallback(false,
                            DISCCONECT_REASON_ERROR_INNER, null);
                }
                xsConn.socketIO.xsConn = null;
                xsConn.socketIO = null;
                return;
            }, 1);
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionDataAry = _sessionDataMannager.getByOpenfireSock(xsConn);
        if(_sessionDataAry == null){
            _log.connectionLog(6, 'SynchronousBridgeNodeXmpp xsErrorOccurred :: _sessionDataAry is null');
            return;
        }
        if(_sessionDataAry.length <= 0){
            _log.connectionLog(6, 'SynchronousBridgeNodeXmpp xsErrorOccurred :: _sessionDataAry is length 0');
            return;
        }
        var _index = 0;
        function _callOnErrorXmppServer() {
            var _accessToken = _sessionDataAry[_index].getAccessToken();
            _log.connectionLog(7, 'SynchronousBridgeNodeXmpp xsErrorOccurred :: [' + _index + ']:' + _accessToken);
            _sessionDataMannager.remove(_accessToken);
            _log.connectionLog(6, 'Remove session data: ' + _accessToken);
            var _clientSock = _sessionDataAry[_index].getSocketIoSock();
            if (_clientSock != null) {
                CubeeWebApi.getInstance().onErrorXmppServer(_clientSock, error);
            }
            _index++;
            if(_index < _sessionDataAry.length){
                setTimeout(_callOnErrorXmppServer, 1);
            }
        }
        setTimeout(_callOnErrorXmppServer, 1);
    }

    function xsDisconnected(xsConn) {
        _log.connectionLog(7, 'XMPP disconnect');
        if (xsConn == null) {
            return;
        }
        if (xsConn.status < LOGIN_STATUS_LOGINED) {
            _log.connectionLog(4, 'login status : ' + xsConn.status);
            setTimeout(function() {
                if (xsConn.socketIO != null) {
                    xsConn.onLogindCallback(false,
                            DISCCONECT_REASON_ERROR_INNER, null);
                    xsConn.socketIO.xsConn = null;
                    xsConn.socketIO = null;
                }
                return;
            }, 1);
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionDataAry = _sessionDataMannager.getByOpenfireSock(xsConn);
        if(_sessionDataAry == null){
            _log.connectionLog(6, 'SynchronousBridgeNodeXmpp xsDisconnected :: _sessionDataAry is null');
            return;
        }
        if(_sessionDataAry.length <= 0){
            _log.connectionLog(6, 'SynchronousBridgeNodeXmpp xsDisconnected :: _sessionDataAry is length 0');
            return;
        }
        var _index = 0;
        function _callOnDisconnectXmppServer() {
            var _sessionData = _sessionDataAry[_index];
            _log.connectionLog(6, 'SynchronousBridgeNodeXmpp xsDisconnected :: [' + _index + ']:' + _sessionDataAry[_index].getAccessToken());
            _sessionDataMannager.remove(_sessionData.getAccessToken());
            var _clientSock = _sessionData.getSocketIoSock();
            if (_clientSock != null) {
                CubeeWebApi.getInstance().onDisconnectXmppServer(_clientSock);
            }
            _index++;
            if(_index < _sessionDataAry.length){
                setTimeout(_callOnDisconnectXmppServer, 1);
            }
        }
        setTimeout(_callOnDisconnectXmppServer, 1);
    }
    _proto.adminLogin = function(socket, tenantUuid, user, password, onLogindCallback,
            isIndependence) {
        var _self = this;
        function _loginCallback(result, reason, accessToken) {
            var _result = result;
            var _reason = reason;
            var _accessToken = accessToken;
            if (_result) {
                var _sessionDataMannager = SessionDataMannager.getInstance();
                var _sessionData = _sessionDataMannager.get(accessToken);
                if (_sessionData == null) {
                    _log.connectionLog(4, '_sessionData is invalid');
                    onLogindCallback(false, DISCCONECT_REASON_ERROR_AUTH, null);
                    _self.logout(socket);
                    return;
                }
                var _fromJid = _sessionData.getJid();
                _self.getUserAuthority(_accessToken, _fromJid,
                        _onGetUserAuthority);
            } else {
                onLogindCallback(result, reason, accessToken);
                _self.logout(socket);
            }

            function _onGetUserAuthority(xmlIqElem) {
                var _userAuthorityElem = Utils.getChildXmlElement(xmlIqElem,
                        'user_authority');
                if (_userAuthorityElem == null) {
                    _log.connectionLog(3, '_userAuthorityElem is null - '
                            + xmlIqElem.toString());
                    onLogindCallback(false, DISCCONECT_REASON_ERROR_AUTH, null);
                    _self.logout(socket);
                }
                var _typeElem = Utils.getChildXmlElement(_userAuthorityElem,
                        'type');
                if (_typeElem == null) {
                    _log.connectionLog(3, '_typeElem is null - '
                            + _userAuthorityElem.toString());
                    onLogindCallback(false, DISCCONECT_REASON_ERROR_AUTH, null);
                    _self.logout(socket);
                }
                var _authorityType = _typeElem.text();
                if (_authorityType == PersonData.AUTHORITY_TYPE_ADMIN) {
                    onLogindCallback(result, reason, accessToken);
                } else {
                    onLogindCallback(false, DISCCONECT_REASON_ERROR_AUTH, null);
                    _self.logout(socket);
                }
            }
        }
        return _self.login(socket, tenantUuid, user, password, _loginCallback,
                isIndependence);
    };
    _proto.getUserAuthority = function(accessToken, fromJid,
            onGetUserAuthorityCallBack) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (fromJid == null || typeof fromJid != 'string') {
            return false;
        }
        if (onGetUserAuthorityCallBack == null
                || typeof onGetUserAuthorityCallBack != 'function') {
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }
        var _xmppGetUserAuthority = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createGetUserAuthorityXmpp(fromJid);
        });
        var _xmppStr = _xmppGetUserAuthority[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, '_xmppGetRoster[0] is invalid');
            return false;
        }
        var _id = _xmppGetUserAuthority[1];
        _sessionData.setCallback(_id, onGetUserAuthorityCallBack);
        _xsConn.send(_xmppStr);
        return true;
    };

    _proto.registerUser = function(accessToken, personData, password,
            registeredContactData, onRegisterUserCallback) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (personData == null || typeof personData != 'object') {
            return false;
        }
        if (password == null || typeof password != 'string') {
            return false;
        }
        if (onRegisterUserCallback == null
                || typeof onRegisterUserCallback != 'function') {
            return false;
        }
        if (registeredContactData == null
                || typeof registeredContactData != 'object') {
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        return UserAccountUtils.create(_sessionData, personData, password,
                registeredContactData, onRegisterUserCallback);
    };
    _proto.getAllUserListForAdmin = function(accessToken,
            onGetAllUserListCallBackFunc, tenantId) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (onGetAllUserListCallBackFunc == null
                || typeof onGetAllUserListCallBackFunc != 'function') {
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }
        var _fromJid = _sessionData.getJid();
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _xmppGetAllUserList = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createGetAllUserListXmpp(_xmppServerHostName, _fromJid, tenantId);
        });
        var _xmppStr = _xmppGetAllUserList[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, '_xmppGetAllUserList[0] is invalid');
            return false;
        }
        var _id = _xmppGetAllUserList[1];
        _sessionData.setCallback(_id, onGetAllUserListCallBack);
        _xsConn.send(_xmppStr);
        return true;

        function onGetAllUserListCallBack(responceXmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            var _extras = {};
            var _items = null;
            if (_result == true) {
                var _itemsElem = _getItemsElemFromGetAllUserListResponce(responceXmlRootElem);
                if (_itemsElem != null) {
                    _items = _getItemsFromGetAllUserListItemsElem(_itemsElem);
                }
            }
            if (_items == null) {
                _result = false;
                _reason = ERROR_REASON_PARSE_RESPONSE_XMPP;
                _items = [];
            }
            onGetAllUserListCallBackFunc(_result, _reason, _extras, _items);
        }
    };
    function _getItemsElemFromGetAllUserListResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetAllUserListResponce :: xmlRootElem is null');
            return null;
        }
        var _queryElem = Utils.getChildXmlElement(xmlRootElem, 'query');
        if (_queryElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetAllUserListResponce :: _queryElem is invalid');
            return null;
        }
        var _queryElemNamespace = _queryElem.namespace().href();
        if (_queryElemNamespace != 'http://necst.nec.co.jp/protocol/admin') {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetAllUserListResponce :: _queryElemNamespace is not "admin"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_queryElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetAllUserListResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromGetAllUserListResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }
    function _getItemsFromGetAllUserListItemsElem(itemsElem) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetAllUserListItemsElem :: itemsElem is null');
            return null;
        }
        if (itemsElem.name == null || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetAllUserListItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetAllUserListItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _jidElem = Utils.getChildXmlElement(_itemElem, 'jid');
            if (_jidElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetAllUserListItemsElem :: _jidElem is null. No.'
                                + _i);
                continue;
            }
            var _jid = _jidElem.text();
            var _nickName = '';
            var _avatarType = '';
            var _avatarData = '';
            var _vCardElem = Utils.getChildXmlElement(_itemElem, 'vCard');
            if (_vCardElem != null) {
                var _nickNameElem = Utils.getChildXmlElement(_vCardElem,
                        'NICKNAME');
                if (_nickNameElem == null) {
                    _nickNameElem = Utils.getChildXmlElement(_vCardElem,
                            'nickname');
                }
                if (_nickNameElem != null) {
                    _nickName = _nickNameElem.text();
                }
                _nickName = Utils.replaceAll(_nickName, '\n', '');
                var _photoElem = Utils.getChildXmlElement(_vCardElem, 'PHOTO');
                if (_photoElem == null) {
                    _photoElem = Utils.getChildXmlElement(_vCardElem, 'photo');
                }
                if (_photoElem != null) {
                    var _typeElem = Utils
                            .getChildXmlElement(_photoElem, 'TYPE');
                    if (_typeElem == null) {
                        _typeElem = Utils
                                .getChildXmlElement(_photoElem, 'type');
                    }
                    if (_typeElem != null) {
                        _avatarType = _typeElem.text();
                        _avatarType = Utils.replaceAll(_avatarType, '\n', '');
                    }
                    var _binValElem = Utils.getChildXmlElement(_photoElem,
                            'BINVAL');
                    if (_binValElem == null) {
                        _binValElem = Utils.getChildXmlElement(_photoElem,
                                'binval');
                    }
                    if (_binValElem != null) {
                        _avatarData = _binValElem.text();
                        _avatarData = Utils.replaceAll(_avatarData, '\n', '');
                    }
                }
            }
            var _groupArray = new Array();
            var _groupElem = Utils.getChildXmlElement(_itemElem, 'group');
            if (_groupElem != null) {
                var _groupItemElemArray = Utils.getChildXmlElementArray(
                        _groupElem, 'item');
                var _groupCount = _groupItemElemArray.length;
                for ( var _j = 0; _j < _groupCount; _j++) {
                    var _groupItemElem = _groupItemElemArray[_j];
                    _groupArray.push(_groupItemElem.text());
                }
            }
            var _status = 0;
            var _statusElem = Utils.getChildXmlElement(_itemElem, 'status');
            if (_statusElem != null) {
                _status = _statusElem.text();
                _status = parseInt(_status);
            }
            _retArray[_itemIndex] = {
                jid : _jid,
                nickName : _nickName,
                avatarType : _avatarType,
                avatarData : _avatarData,
                group : _groupArray,
                status : _status
            };
            _itemIndex++;
        }
        return _retArray;
    }
    _proto.updateVCardForAdmin = function(accessToken, updateVCardData,
            onUpdateVCardCallbackFunc) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (onUpdateVCardCallbackFunc == null
                || typeof onUpdateVCardCallbackFunc != 'function') {
            return false;
        }
        if (updateVCardData == null || typeof updateVCardData != 'object') {
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }
        var _fromJid = _sessionData.getJid();
        var _xmppServerHostName = _sessionData.getXmppServerName();
        var _xmppUpdateVCard = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createUpdateVCardXmpp(_xmppServerHostName, _fromJid, updateVCardData);
        });
        var _xmppStr = _xmppUpdateVCard[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, '_xmppUpdateVCard[0] is invalid');
            return false;
        }
        var _id = _xmppUpdateVCard[1];
        _sessionData.setCallback(_id, onUpdateVCardCallback);
        _xsConn.send(_xmppStr);
        return true;

        function onUpdateVCardCallback(xmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = xmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            onUpdateVCardCallbackFunc(_result, _reason);
        }
    };

    _proto.updateUserPassword = function(accessToken, loginAccount, password,
            onUpdateUserPasswordCallback) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (loginAccount == null || typeof loginAccount != 'string') {
            return false;
        }
        if (password == null || typeof password != 'string') {
            return false;
        }
        if (onUpdateUserPasswordCallback == null
                || typeof onUpdateUserPasswordCallback != 'function') {
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        return UserAccountUtils.updateUserPassword(_sessionData, loginAccount,
                password, onUpdateUserPasswordCallback);
    };

    _proto.getUserListForAdmintool = function(accessToken, tenantId, except,
            start, count, onGetUserListCallbackFunc) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            _log.connectionLog(3,
                    'getUserListForAdmintool :: accessToken is invalid : '
                            + accessToken);
            return false;
        }
        if (except == null || typeof except != 'object') {
            _log.connectionLog(3,
                    'getUserListForAdmintool :: except is invalid');
            return false;
        }
        if (start == null || typeof start != 'number') {
            _log.connectionLog(3,
                    'getUserListForAdmintool :: start is invalid : ' + start);
            return false;
        }
        if (count == null || typeof count != 'number') {
            _log.connectionLog(3,
                    'getUserListForAdmintool :: count is invalid : ' + count);
            return false;
        }
        if (onGetUserListCallbackFunc == null
                || typeof onGetUserListCallbackFunc != 'function') {
            _log
                    .connectionLog(3,
                            'getUserListForAdmintool :: onGetUserListCallbackFunc is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4,
                    'getUserListForAdmintool :: _sessionData is invalid');
            return false;
        }
        return UserAccountUtils.getUserListCountForAdmintool(_sessionData,
                tenantId, except, true, onGetUserListCountCallback);

        function onGetUserListCountCallback(userAcountCount, userAcountCount_NotDelete) {

            return UserAccountUtils
                    .getUserListForAdmintool(_sessionData, tenantId, except,
                            start, count, true, onGetUserListCallBack);

            function onGetUserListCallBack(userAcountDataList) {
                var _xsConn = _sessionData.getOpenfireSock();
                if (_xsConn == null) {
                    _log.connectionLog(4, '_xsConn is null');
                    return false;
                }
                var _fromJid = _sessionData.getJid();
                var _xmppServerHostName = _xsConn.getHost();
                var _xmppGetSelectUserList = XmppUtils.checkCreateXmppData(_xsConn, function() {
                    return Xmpp.createGetSelectUserListXmpp(_xmppServerHostName, _fromJid, userAcountDataList);
                });
                var _xmppStr = _xmppGetSelectUserList[0];
                if (_xmppStr == null || _xmppStr == '') {
                    _log.connectionLog(4,
                            '_xmppGetSelectUserList[0] is invalid');
                    return false;
                }
                var _id = _xmppGetSelectUserList[1];
                _sessionData.setCallback(_id, onGetSelectUserListCallBack);
                _xsConn.send(_xmppStr);

                function onGetSelectUserListCallBack(responceXmlRootElem) {
                    _log.connectionLog(7, 'onGetSelectUserListCallBack start');
                    var _result = false;
                    var _reason = ERROR_REASON_XMPP_SERVER;
                    var _iqTypeAttr = responceXmlRootElem.attr('type');
                    if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                        _result = true;
                        _reason = DISCCONECT_REASON_NO;
                    }
                    var _extras = {
                        allCount : userAcountCount,
                        notDeleteCount : userAcountCount_NotDelete
                    };
                    var _items = null;
                    if (_result == true) {
                        var _itemsElem = _getItemsElemFromGetAllUserListResponce(responceXmlRootElem);
                        if (_itemsElem != null) {
                            _items = _getItemsFromGetSelectUserListItemsElem(
                                    _itemsElem, userAcountDataList);
                        }
                    }
                    if (_items == null) {
                        _items = [];
                    }
                    var _content = {
                        result : _result,
                        reason : _reason,
                        extras : _extras,
                        count : _items.length,
                        items : _items,
                    };
                    var _ret = {
                        content : _content,
                    };
                    _log.connectionLog(7, 'onGetSelectUserListCallBack end');
                    onGetUserListCallbackFunc(_ret);
                }
            }
        }
    };

    _proto.getPersonByUserAccountData = function(accessToken, accountData, callback) {
        var _sessionData = SessionDataMannager.getInstance().get(accessToken);

        var _xsConn = _sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log.connectionLog(4, '_xsConn is null');
            return false;
        }

        var _xmppData = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createGetSelectUserListXmpp(
                _xsConn.getHost(), _sessionData.getJid(), [accountData]);
        }
        );

        var _xmppStr = _xmppData[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log.connectionLog(4, '_xmppGetSelectUserList[0] is invalid');
            return false;
        }
        _log.connectionLog(3, _xmppStr);

        _sessionData.setCallback(_xmppData[1], function(responce) {
            _log.connectionLog(3, responce);
            var _iqTypeAttr = responce.attr('type');
            var _result = (_iqTypeAttr != null && _iqTypeAttr.value() == 'result');
            var _reason = _result ? DISCCONECT_REASON_NO : ERROR_REASON_XMPP_SERVER;
            var _items = null;

            if (_result) {
                var _itemsElem = _getItemsElemFromGetAllUserListResponce(responce);
                if (_itemsElem != null) {
                    _items = _getItemsFromGetSelectUserListItemsElem(
                        _itemsElem, [accountData]);
                }
            }
            _log.connectionLog(7, 'onGetSelectUserListCallBack end');

            callback({
                content : {
                    result : _result,
                    reason : _reason,
                    extras : {},
                    count : _items ? _items.length : 0,
                    items : _items ? _items : [],
                }
            });
        });
        _xsConn.send(_xmppStr);
    };

    _proto.execBatchRegistration = function(accessToken, createUserMap,
            onExecBatchRegistrationCallback) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#execBatchRegistration accessToken is invalid');
            return false;
        }
        if (createUserMap == null || typeof createUserMap != 'object') {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#execBatchRegistration createUserMap is invalid');
            return false;
        }
        if (onExecBatchRegistrationCallback == null
                || typeof onExecBatchRegistrationCallback != 'function') {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#execBatchRegistration onExecBatchRegistrationCallback is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        return UserAccountUtils.execBatchRegistration(_sessionData,
                createUserMap, onExecBatchRegistrationCallback);
    };
    function _getItemsFromGetSelectUserListItemsElem(itemsElem,
            userAcountDataList) {
        if (itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetSelectUserListItemsElem :: itemsElem is null');
            return null;
        }
        if (userAcountDataList == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetSelectUserListItemsElem :: userAcountDataList is null');
            return null;
        }
        if (itemsElem.name == null || itemsElem.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetSelectUserListItemsElem :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElem, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetSelectUserListItemsElem :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _itemIndex = 0;
        var _count = _itemElemArray.length;
        if (_count != userAcountDataList.length) {
            _log
                    .connectionLog(3,
                            '_getItemsFromGetSelectUserListItemsElem :: Arraylength is invalid');
            _log.connectionLog(3,
                    '_getItemsFromGetSelectUserListItemsElem :: _itemElemArray'
                            + length);
            _log.connectionLog(3,
                    '_getItemsFromGetSelectUserListItemsElem :: userAcountDataList.length'
                            + userAcountDataList.length);
            return null;
        }

        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _jidElem = Utils.getChildXmlElement(_itemElem, 'jid');
            if (_jidElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromGetSelectUserListItemsElem :: _jidElem is null. No.'
                                + _i);
                continue;
            }
            var _jid = _jidElem.text();
            var _nickName = '';
            var _vCardElem = Utils.getChildXmlElement(_itemElem, 'vCard');
            if (_vCardElem != null) {
                var _nickNameElem = Utils.getChildXmlElement(_vCardElem,
                        'NICKNAME');
                if (_nickNameElem == null) {
                    _nickNameElem = Utils.getChildXmlElement(_vCardElem,
                            'nickname');
                }
                if (_nickNameElem != null) {
                    _nickName = _nickNameElem.text();
                }
                _nickName = Utils.replaceAll(_nickName, '\n', '');
            }
            var _group = [];
            var _groupElem = Utils.getChildXmlElement(_itemElem, 'group');
            if (_groupElem != null) {
                var _groupItemElemArray = Utils.getChildXmlElementArray(
                        _groupElem, 'item');
                if (_groupItemElemArray != null) {
                    var _index = 0;
                    for ( var _j = 0; _j < _groupItemElemArray.length; _j++) {
                        var _groupItemElem = _groupItemElemArray[_j];
                        if (_groupItemElem != null) {
                            _group[_index] = _groupItemElem.text();
                            _index++;
                        }
                    }
                }
            }
            var _mailAddressElem = Utils.getChildXmlElement(_itemElem, 'email');
            var _mailAddress = _mailAddressElem != null ? _mailAddressElem.text() : '';

            var _isAdminElem = Utils.getChildXmlElement(_itemElem, 'isAdmin');
            var _isAdmin = _isAdminElem && _isAdminElem.text() == PersonData.AUTHORITY_TYPE_ADMIN;

            _retArray[_itemIndex] = {
                id : userAcountDataList[_itemIndex].getId(),
                jid : _jid,
                loginAccount : userAcountDataList[_itemIndex].getLoginAccount(),
                nickName : _nickName,
                status : userAcountDataList[_itemIndex].getDeleteFlg(),
                group : _group,
                mailAddress: _mailAddress,
                isAdmin: _isAdmin
            };
            _itemIndex++;
        }
        return _retArray;
    }
    _proto.execBatchUpdate = function(accessToken, updateUserList,
            onExecBatchUpdateCallBack) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#execBatchUpdate accessToken is invalid');
            return false;
        }
        if (updateUserList == null || typeof updateUserList != 'object') {
            _log
                    .connectionLog(3,
                            'SynchronousBridgeNodeXmpp#execBatchUpdate updateUserList is invalid');
            return false;
        }
        if (onExecBatchUpdateCallBack == null
                || typeof onExecBatchUpdateCallBack != 'function') {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#execBatchUpdate onExecBatchUpdateCallBack is invalid');
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return false;
        }
        var _updUserCount = updateUserList.length;
        if (_updUserCount == 0) {
            _log.connectionLog(3, '_updUserCount is 0');
            return false;
        }
        var _resultList = [];
        for ( var _i = 0; _i < _updUserCount; _i++) {
            var _updUserData = updateUserList[_i];
            var _item = {
                account : _updUserData.account,
                result : null,
                reason : null
            };
            _resultList[_i] = _item;
        }
        return _getRequestUpdateUserListToXmpp(_sessionData.getTenantUuid(), updateUserList, _resultList,
                _onGetRequestUpdateUserListToXmpp);

        function _onGetRequestUpdateUserListToXmpp(requestUpdUserListToXmpp) {
            var _count = requestUpdUserListToXmpp.length;
            if (_count == 0) {
                onExecBatchUpdateCallBack(true, DISCCONECT_REASON_NO, {},
                        _resultList.length, _resultList);
                return;
            }
            var _ret = _requestUpdateUserToXmppServer(_sessionData,
                    requestUpdUserListToXmpp, _onRequestUpdateUserToXmppServer);
            if (!_ret) {
                onExecBatchUpdateCallBack(false, DISCCONECT_REASON_ERROR_INNER,
                        {}, 0, []);
            }
        }

        function _onRequestUpdateUserToXmppServer(result, reason, items) {
            var _resultListCount = _resultList.length;
            if (!result) {
                onExecBatchUpdateCallBack(result, reason, {}, 0, []);
                return;
            }
            var _itemsCount = items.length;
            var _curResultListIdx = 0;
            for ( var _itemsIdx = 0; _itemsIdx < _itemsCount; _itemsIdx++) {
                var _item = items[_itemsIdx];
                for ( var _resultListIdx = _curResultListIdx; _resultListIdx < _resultListCount; _resultListIdx++) {
                    var _resultData = _resultList[_resultListIdx];
                    if (_resultData.result != null) {
                        continue;
                    }
                    _resultData.result = _item.result;
                    if (!_resultData.result) {
                        _resultData.reason = ERROR_REASON_XMPP_SERVER;
                    } else {
                        _resultData.reason = DISCCONECT_REASON_NO;
                    }
                    var _nextIdx = _resultListIdx++;
                    _curResultListIdx = _nextIdx;
                    break;
                }
            }
            onExecBatchUpdateCallBack(result, reason, {}, _resultListCount,
                    _resultList);
        }
    };

    function _getRequestUpdateUserListToXmpp(tenantUuid, updateUserList, resultList,
            onGetRequestUpdateUserListToXmpp) {
        if (updateUserList == null || typeof updateUserList != 'object') {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_getRequestUpdateUserListToXmpp updateUserList is invalid');
            return false;
        }
        if (resultList == null || typeof resultList != 'object') {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_getRequestUpdateUserListToXmpp resultList is invalid');
            return false;
        }
        if (onGetRequestUpdateUserListToXmpp == null
                || typeof onGetRequestUpdateUserListToXmpp != 'function') {
            _log
                    .connectionLog(
                            3,
                            'SynchronousBridgeNodeXmpp#_getRequestUpdateUserListToXmpp onGetRequestUpdateUserListToXmpp is invalid');
            return false;
        }
        var _updUserListIdx = 0;
        var _count = updateUserList.length;
        var _account = updateUserList[_updUserListIdx].account;
        var _tenantUuid = tenantUuid;
        var _requestUpdUserListToXmpp = new Array();
        return UserAccountUtils.getUserDataByTenantLoginAccount(_tenantUuid, _account,
                _onGetUserAccountData);

        function _onGetUserAccountData(userAccountData) {
            if (userAccountData == null) {
                _log
                        .connectionLog(
                                3,
                                'SynchronousBridgeNodeXmpp#execBatchUpdate#_getRequestUpdateUserListToXmpp This user not found : '
                                        + _account);
                resultList[_updUserListIdx].result = false;
                resultList[_updUserListIdx].reason = ERROR_NOT_FOUND_USER;
            } else {
                var _item = {};
                _item.openfireAccount = userAccountData.getOpenfireAccount();
                _item.nickname = updateUserList[_updUserListIdx].nickname;
                _item.group = updateUserList[_updUserListIdx].group;
                if(updateUserList[_updUserListIdx].delete_flg != ""){
                    _item.delete_flg = updateUserList[_updUserListIdx].delete_flg;
                }
                _item.mailAddress = updateUserList[_updUserListIdx].mailAddress;
                _requestUpdUserListToXmpp.push(_item);
            }
            _updUserListIdx++;
            if (_updUserListIdx == _count) {
                onGetRequestUpdateUserListToXmpp(_requestUpdUserListToXmpp);
                return;
            }
            _account = updateUserList[_updUserListIdx].account;
            UserAccountUtils.getUserDataByTenantLoginAccount(_tenantUuid, _account,
                    _onGetUserAccountData);
        }
    }

    function _requestUpdateUserToXmppServer(sessionData, updateUserList,
            onUpdateUserCallBack) {
        if (sessionData == null || typeof sessionData != 'object') {
            _log
                    .connectionLog(3,
                            'UserAccountManager#_requestUpdateUserToXmppServer sessionData is invalid');
            return false;
        }
        if (updateUserList == null || typeof updateUserList != 'object') {
            _log
                    .connectionLog(3,
                            'UserAccountManager#_requestUpdateUserToXmppServer updateUserList is invalid');
            return false;
        }
        if (onUpdateUserCallBack == null
                || typeof onUpdateUserCallBack != 'function') {
            _log
                    .connectionLog(
                            3,
                            'UserAccountManager#_requestUpdateUserToXmppServer onUpdateUserCallBack is invalid');
            return false;
        }
        var _self = this;
        var _xsConn = sessionData.getOpenfireSock();
        if (_xsConn == null) {
            _log
                    .connectionLog(4,
                            'UserAccountManager#_requestUpdateUserToXmppServer _xsConn is null');
            return false;
        }
        var _fromJid = sessionData.getJid();
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _xmppRegisterUser = XmppUtils.checkCreateXmppData(_xsConn, function() {
            return Xmpp.createUpdateUserXmpp(_fromJid, updateUserList);
        });
        if (_xmppRegisterUser == null) {
            _log
                    .connectionLog(4,
                            'UserAccountManager#_requestUpdateUserToXmppServer _xmppRegisterUser is null');
            return false;
        }
        var _xmppStr = _xmppRegisterUser[0];
        if (_xmppStr == null || _xmppStr == '') {
            _log
                    .connectionLog(
                            4,
                            'UserAccountManager#_requestUpdateUserToXmppServer _xmppRegisterUser[0] is invalid');
            return false;
        }
        var _id = _xmppRegisterUser[1];
        sessionData.setCallback(_id, _onRegisterUserCallback);
        _xsConn.send(_xmppStr);
        return true;

        function _onRegisterUserCallback(xmlRootElem) {
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = xmlRootElem.attr('type');
            var _items = null;
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'result') {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
                var _itemsElm = _getItemsElemFromCreateOrUpdateUserXmppResponce(xmlRootElem);
                _items = _getItemsFromCreateOrUpdateUserResultItemsElm(
                        _itemsElm, updateUserList);
            }
            onUpdateUserCallBack(_result, _reason, _items);
        }
    }
    function _getItemsElemFromCreateOrUpdateUserXmppResponce(xmlRootElem) {
        if (xmlRootElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateOrUpdateUserResponce :: xmlRootElem is null');
            return null;
        }
        var _queryElem = Utils.getChildXmlElement(xmlRootElem, 'query');
        if (_queryElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateOrUpdateUserResponce :: _queryElem is invalid');
            return null;
        }
        var _queryElemNamespace = _queryElem.namespace().href();
        if (_queryElemNamespace != 'http://necst.nec.co.jp/protocol/admin') {
            _log
                    .connectionLog(
                            3,
                            '_getItemsElemFromCreateOrUpdateUserResponce :: _queryElemNamespace is not "admin"');
            return null;
        }
        var _contentElem = Utils.getChildXmlElement(_queryElem, 'content');
        if (_contentElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateOrUpdateUserResponce :: _contentElem is invalid');
            return null;
        }
        var _itemsElem = Utils.getChildXmlElement(_contentElem, 'items');
        if (_itemsElem == null) {
            _log
                    .connectionLog(3,
                            '_getItemsElemFromCreateOrUpdateUserResponce :: _itemsElem is invalid');
            return null;
        }
        return _itemsElem;
    }
    function _getItemsFromCreateOrUpdateUserResultItemsElm(itemsElm) {
        if (itemsElm == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromCreateOrUpdateUserResultItemsElm :: itemsElem is null');
            return null;
        }
        if (itemsElm.name == null || itemsElm.name() != 'items') {
            _log
                    .connectionLog(3,
                            '_getItemsFromCreateOrUpdateUserResultItemsElm :: itemsElem is invalid');
            return null;
        }
        var _itemElemArray = Utils.getChildXmlElementArray(itemsElm, 'item');
        if (_itemElemArray == null) {
            _log
                    .connectionLog(3,
                            '_getItemsFromCreateOrUpdateUserResultItemsElm :: _itemElemArray is null');
            return null;
        }
        var _retArray = [];
        var _count = _itemElemArray.length;

        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _itemElemArray[_i];
            var _resultElem = Utils.getChildXmlElement(_itemElem, 'result');
            if (_resultElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCreateOrUpdateUserResultItemsElm :: _resultElem is null. No.'
                                + _i);
                continue;
            }
            var _result = _resultElem.text();
            var _userNameElem = Utils.getChildXmlElement(_itemElem, 'username');
            if (_userNameElem == null) {
                _log.connectionLog(3,
                        '_getItemsFromCreateOrUpdateUserResultItemsElm :: _userNameElem is null. No.'
                                + _i);
                continue;
            }
            var _openfireAccount = _userNameElem.text();
            _retArray[_i] = {
                result : (_result == 'true') ? true : false,
                openfireAccount : _openfireAccount,
            };
        }
        return _retArray;
    }
    _proto.updateUserAccountStatus = function(accessToken, loginAccount,
            accountStatus, onUpdateUserAccountStatusCallback) {
        var _self = this;
        if (accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (loginAccount == null || typeof loginAccount != 'string') {
            return false;
        }
        if (accountStatus == null || typeof accountStatus != 'number') {
            return false;
        }
        if (onUpdateUserAccountStatusCallback == null
                || typeof onUpdateUserAccountStatusCallback != 'function') {
            return false;
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(4, '_sessionData is invalid');
            return false;
        }
        var _tenantUuid = _sessionData.getTenantUuid();
        return UserAccountUtils.getUserDataByTenantLoginAccount(_tenantUuid, loginAccount,
                _onGetUserAccountDataCallBack);

        function _onGetUserAccountDataCallBack(userAcountData) {

            if (userAcountData == null) {
                onUpdateUserAccountStatusCallback(false, ERROR_NOT_FOUND_USER);
                return;
            }

            var _xsConn = _sessionData.getOpenfireSock();
            if (_xsConn == null) {
                _log.connectionLog(4, '_xsConn is null');
                onUpdateUserAccountStatusCallback(false, ERROR_REASON_INNER);
                return;
            }
            var _fromJid = _sessionData.getJid();
            var _xmppServerHostName = _xsConn.getHost();
            var _openfireAccount = userAcountData.getOpenfireAccount();
            var _xmppUpdateUserAccountStatus = XmppUtils.checkCreateXmppData(_xsConn, function() {
                return Xmpp.createUpdateUserAccountStatusXmpp(_xmppServerHostName,
                            _fromJid, _openfireAccount, accountStatus);
            });
            var _xmppStr = _xmppUpdateUserAccountStatus[0];
            if (_xmppStr == null || _xmppStr == '') {
                _log.connectionLog(4,
                        '_xmppUpdateUserAccountStatus[0] is invalid');
                onUpdateUserAccountStatusCallback(false, ERROR_REASON_INNER);
                return;
            }
            var _id = _xmppUpdateUserAccountStatus[1];
            _sessionData.setCallback(_id,
                    _onUpdateUserAccountStatusFromXmppCallBack);
            _xsConn.send(_xmppStr);
        }

        function _onUpdateUserAccountStatusFromXmppCallBack(responceXmlRootElem) {
            _log.connectionLog(7, 'onGetSelectUserListCallBack start');
            var _result = false;
            var _reason = ERROR_REASON_XMPP_SERVER;
            var _iqTypeAttr = responceXmlRootElem.attr('type');
            if (_iqTypeAttr != null && _iqTypeAttr.value() == 'error') {
                _log.connectionLog(7, 'onGetSelectUserListCallBack end');
                onUpdateUserAccountStatusCallback(_result, _reason);
                return;
            }
            UserAccountUtils.updateUserAccountStatus(_tenantUuid, loginAccount, accountStatus, _onUpdateUserAccountStoreCallBack);
        }

        function _onUpdateUserAccountStoreCallBack(result) {
            _log.connectionLog(7, '_onUpdateUserAccountStoreCallBack start');
            var _result = false;
            var _reason = ERROR_REASON_INNER;
            if (result) {
                _result = true;
                _reason = DISCCONECT_REASON_NO;
            }
            _log.connectionLog(7, '_onUpdateUserAccountStoreCallBack end');
            onUpdateUserAccountStatusCallback(_result, _reason);
        }
    };

    var _synchronousBridgeNodeXmpp = new SynchronousBridgeNodeXmpp();

    SynchronousBridgeNodeXmpp.getInstance = function() {
        return _synchronousBridgeNodeXmpp;
    };



    function _getURLs(body) {
        var ary = body.split(/(%09|%20|%0D%0A|%0d%0a|%0A|%0a|%0D|%0d|%E3%80%80|%e3%80%80)/);
        var urlregexp =  /((https?)(%3A%2F%2F|%3a%2f%2f).+)/gi;
        var rep;
        var retval = new Array();

        _log.connectionLog(7, '***enter _getURL:');

        for (var i = 0; i < ary.length; i++) {
            rep = ary[i].match(urlregexp);
            if (rep != null) {
                for (var j = 0; j < rep.length; j++) {
                    if (_isAttachedURL(rep[j]) == false) {
                        retval.push(rep[j]);
                    }
                }
            }
        }

        if (retval.length == 0) {
            _log.connectionLog(7, '***_getURLs: no URL');
            return null;
        }
        return retval;
    }

    function _isAttachedURL(url) {
        var localregexp = Utils.replaceAll(_conf.getConfData('SYSTEM_LOCATION_ROOT') + "/f/.*",
                                           "/", "%2F");
        strmatch = url.match(localregexp);
        if (strmatch == null) {
            _log.connectionLog(7, '***_isAttachedURL false: ' + url);
            return false;
        } else {
            _log.connectionLog(7, '***_isAttachedURL true: ' + url);
            return true;
        }
    }

    function _getAttachedURLs(body) {
        var ary = body.split(/(%09|%20|%0D%0A|%0d%0a|%0A|%0a|%0D|%0d|%E3%80%80|%e3%80%80)/);
        var urlregexp =  /((https?)(%3A%2F%2F|%3a%2f%2f).+)/gi;
        var rep;
        var retval = new Array();

        _log.connectionLog(7, '***enter _getAttachedURLs:');

        for (var i = 0; i < ary.length; i++) {
            rep = ary[i].match(urlregexp);
            if (rep != null) {
                for (var j = 0; j < rep.length; j++) {
                    if (_isAttached(rep[j]) == true) {
                        retval.push(rep[j]);
                    }
                }
            }
        }
        if (retval.length == 0) {
            _log.connectionLog(7, '***_getAttachedURLs: not found');
            return null;
        }
        return retval;

        function _isAttached(url) {
            var localregexp = Utils.replaceAll(_conf.getConfData('SYSTEM_LOCATION_ROOT') + "/f/.*", "/", "%2F");
            var _strmatch = url.match(localregexp);
            if (_strmatch != null) {
                return true;
            }

            localregexp = Utils.replaceAll(_conf.getConfData('SYSTEM_LOCATION_ROOT') + "/file/.*", "/", "%2F");
            _strmatch = url.match(localregexp);
            if (_strmatch != null) {
                return true;
            }
            return false;
        }
    }

    function _getConvertFileItem(tenantUuid, url, onCallback){
        var _decoded = decodeURIComponent(url.replace(/\+/g, '%20'));
        var _fileUtils = FileUtils.getInstance();
        _fileUtils.getFilePathFromURL(tenantUuid, _decoded, function(filePath){
            if(filePath == null || filePath == ''){
                _log.connectionLog(7, '_getConvertFiFleItem : file not found');
                onCallback(null);
            } else {
                var _systemLocationStr = _conf.getConfData('SYSTEM_LOCATION_ROOT');
                var _targetPath = filePath.substr(filePath.indexOf(_systemLocationStr)+_systemLocationStr.length);
                _log.connectionLog(7, '_getConvertFileItem::'+_targetPath);
                var _fileConvert = FileConvert.getInstance();
                var _ret = _fileConvert.getConvertedFilePath(_targetPath, 'thumbnail', _onGetConvertedFilePath);
                if(_ret != true){
                    onCallback(null);
                }
            }
        });

        function _onGetConvertedFilePath(_convertedFilePath){
            var _ret = null;
            if(_convertedFilePath != null){
                var _parts = Url.parse(_decoded);
                if (_parts.host == null) {
                    _ret = null;
                } else {
                    var _tenantUuidRegExp = new RegExp(tenantUuid+'/');
                    _convertedFilePath = _convertedFilePath.replace(_tenantUuidRegExp, '');
                    var _systemLocationStr = _conf.getConfData('SYSTEM_LOCATION_ROOT');
                    var _headURL = _parts.protocol + '//' + _parts.host + _systemLocationStr;
                    var _convertedFileURL = encodeURIComponent(_headURL + _convertedFilePath);
                    _ret = {
                        "originalURL" : url,
                        "convertURL" : _convertedFileURL,
                    };
                }
            }
            onCallback(_ret);
        }
    }

    exports.getInstance = SynchronousBridgeNodeXmpp.getInstance;
    exports.DISCCONECT_REASON_NO = DISCCONECT_REASON_NO;
    exports.DISCCONECT_REASON_UNKNOWN = DISCCONECT_REASON_UNKNOWN;
    exports.DISCCONECT_REASON_ERROR_INNER = DISCCONECT_REASON_ERROR_INNER;
    exports.DISCCONECT_REASON_ERROR_PARAM = DISCCONECT_REASON_ERROR_PARAM;
    exports.DISCCONECT_REASON_ERROR_AUTH = DISCCONECT_REASON_ERROR_AUTH;
    exports.ERROR_REASON_PARSE_RESPONSE_XMPP = ERROR_REASON_PARSE_RESPONSE_XMPP;
    exports.ERROR_REASON_XMPP_SERVER = ERROR_REASON_XMPP_SERVER;
    exports.ERROR_REASON_INNER = ERROR_REASON_INNER;
    exports.ERROR_REASON_ERROR_PARAM = ERROR_REASON_ERROR_PARAM;
    exports.ERROR_CREATE_AVATAR_IMAGE = ERROR_CREATE_AVATAR_IMAGE;
    exports.ERROR_EXIST_USER = ERROR_EXIST_USER;
    exports.ERROR_EXIST_MAILADDRESS = ERROR_EXIST_MAILADDRESS;
    exports.ERROR_NOT_FOUND_USER = ERROR_NOT_FOUND_USER;
    exports.directTestPath = {
        _onThreadTitleMessage : _onThreadTitleMessage,
        _getItemDataFromMessageItemElem : _getItemDataFromMessageItemElem
    }
})();
