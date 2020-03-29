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
    var _ = require('underscore');
    var API_STATUS = require('./const').API_STATUS;
    var Utils = require('../utils');
    var Conf = require('./conf');
    var Const = require('./const');
    var ServerLog = require('./server_log');
    var SynchronousBridgeNodeXmpp = require('./synchronous_bridge_node_xmpp');
    var SessionDataMannager = require('./session_data_manager');
    var RequestData = require('../model/request_data').RequestData;
    var PersonData = require('../model/person_data');
    var SocketIo = require('./socket_io_receiver');
    var RegisteredContactData = require('../model/registered_contact_data');
    var UserAccountUtils = require('./user_account_utils');
    var ReadCacheBeforeDBChef = require('../lib/CacheHelper/read_cache_before_db_chef');
    var StoreVolatileChef = require('../lib/CacheHelper/store_volatile_chef');
    var TenantData = require('../lib/CacheHelper/tenant_data');
    var RoleApiController = require('./authority/cubee_authority_api');
    var AuthorityChecker = require('./authority/authority_checker');
    var CommunityWebAPI = require('./community/web_api');
    var GroupChatWebAPI = require('./groupchat/web_api');
    var MessageWebAPI = require('./message/web_api');
    var ProfileWebAPI = require('./profile/web_api');
    var UserManagementController = require('./usermanagement/web_api');
    const HashTagAPI = require('./hashtag/api');
    const ProfileListAPI = require('./profile/list/api');
    const PublicGroupChatMemberAPI = require('./groupchat/public/member/api');
    const PublicGroupChatAPI = require('./groupchat/public/api');
    const PublicCommunityAPI = require('./community/public/api');
    const PublicCommunityMemberAPI = require('./community/public/member/api');
    const UserFollowAPI = require('./user_follow/api');
    const MurmurRankingAPI = require('./murmur/ranking/api');
    const MurmurAPI = require('./murmur/api');

    const DBStore = require('./db/db_store');

    var _conf = Conf.getInstance();
    var _log = ServerLog.getInstance();
    let _globalSnsDB = new DBStore('/opt/cubee/cmnconf/spf_globalsns_dbs.json');

    function CubeeWebApi() {

    }

    var STR_REQUEST = 'request';
    var STR_ACCESS_TOKEN = 'accessToken';
    var STR_ID = 'id';
    var STR_VERSION = 'version';
    var STR_CONTENT = 'content';
    var STR_TENANT_NAME = 'tenantName';

    var CONF_KEY_DEFAULT_TENANT_NAME = 'DEFAULT_TENANT_NAME';

    var _proto = CubeeWebApi.prototype;

    _proto.receive = function(socket, receiveStr, processCallback, isIndependence) {
        var _self = this;
        if (processCallback == null || typeof processCallback != 'function') {
            _log.connectionLog(4, 'processCallback is invalid.');
            return false;
        }
        if (socket == null || typeof socket != 'object') {
            _log.connectionLog(4, 'socket is invalid.');
            _callBackResponse(processCallback);
            return false;
        }
        if (receiveStr == null || typeof receiveStr != 'string' || receiveStr == '') {
            _log.connectionLog(4, 'receiveStr is invalid.');
            _callBackResponse(processCallback);
            return false;
        }
        var _receiveObject = null;
        try {
            _receiveObject = JSON.parse(receiveStr);
        } catch(e) {
            _log.connectionLog(4, 'receive data is not json format. receive data : ' + receiveStr);
            _callBackResponse(processCallback);
            return false;
        }
        if (_receiveObject == null) {
            _log.connectionLog(4, 'receiveObject is null. receive data : ' + receiveStr);
            _callBackResponse(processCallback);
            return false;
        }

        var _socket = socket;
        var _processCallback = processCallback;
        var _receiveStr = receiveStr;
        var _isIndependence = isIndependence;

        function _onAuthorityCheck(res) {
            if (res) {
                _log.connectionLog(4, 'CubeeWebApi::receive::_onAuthorityCheck() unauthorized.');
                _callBackResponse(_processCallback, res.accessToken, res.request, res.id, res.version, res.errorCode, res.content);
                return;
            }
            runApi(_socket, _receiveStr, _receiveObject, _processCallback, _isIndependence);
        }

        AuthorityChecker.checkOnReceiveApi(_receiveObject, _onAuthorityCheck);

        return true;
    };

    function runApi(socket, receiveStr, _receiveObject, processCallback, isIndependence) {
        _log.connectionLog(7, 'do func CubeeWebApi::runApi');
        var _accessToken = Utils.getChildObject(_receiveObject, STR_ACCESS_TOKEN);
        var _request = Utils.getChildObject(_receiveObject, STR_REQUEST);
        var _id = Utils.getChildObject(_receiveObject, STR_ID);
        var _version = Utils.getChildObject(_receiveObject, STR_VERSION);
        var _content = Utils.getChildObject(_receiveObject, STR_CONTENT);
        var _ret = false;
        if(_request != Const.API_REQUEST.API_LOGIN && _request != Const.API_REQUEST.API_ADMIN_LOGIN) {
            var _sessionDataMannager = SessionDataMannager.getInstance();
            var _sessionData = _sessionDataMannager.get(_accessToken);
            if(_sessionData != null) {
                if(_sessionData.getSocketIoSock() == null) {
                    var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
                    _synchronousBridgeNodeXmpp.clientReconnect(socket, _accessToken);
                }
                StoreVolatileChef.getInstance().extend(_accessToken, null);
            } else {
                _log.connectionLog(4, '_sessionData is null. receive data : ' + receiveStr);

                _callBackResponse(processCallback, null, _request, _id, _version, 9, _content);
                return false;
            }
        }
        _log.connectionLog(7, 'do func CubeeWebApi::runApi before switch _request : ' + _request);
        switch(_request) {
        case Const.API_REQUEST.API_LOGIN:
            _ret = _loginRequest(socket, _receiveObject, processCallback, false);
            break;
        case Const.API_REQUEST.API_LOGOUT:
            _ret = _logoutRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_GET_PERSON_LIST:
            _ret = _getPersonListRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_SET_LOGIN_PERSON_DATA:
            var _type = Utils.getChildObject(Utils.getChildObject(_receiveObject, STR_CONTENT),'type');
            var apiUtil = {_callBackResponse: _callBackResponse};
            switch(_type) {
            case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PASSWORD:
            case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE:
                _ret = ProfileWebAPI.doApi(socket, _receiveObject, processCallback, apiUtil);
                break;
            default:
                _ret = _setLoginPersonData(socket, _receiveObject, processCallback);
                break;
            }
            break;
       case Const.API_REQUEST.API_GET_PROFILE_LIST:
            ProfileListAPI.receive(_globalSnsDB,socket, _receiveObject, processCallback, _callBackResponse);
            break;
        case Const.API_REQUEST.API_GET_MESSAGE:
            _log.connectionLog(7, 'do func CubeeWebApi::runApi switch Const.API_REQUEST.API_GET_MESSAGE');
            _ret = _getMessageRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_SEND_MESSAGE:
            _log.connectionLog(7, 'do func CubeeWebApi::runApi switch Const.API_REQUEST.API_SEND_MESSAGE');
            _ret = _sendMessageRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_UPDATE_MESSAGE:
            var _type = Utils.getChildObject(_content, 'type');
                switch(_type){
                    case RequestData.UPDATE_MESSAGE_TYPE_PUBLIC:
                    case RequestData.UPDATE_MESSAGE_TYPE_CHAT:
                    case RequestData.UPDATE_MESSAGE_TYPE_GROUP_CHAT:
                    case RequestData.UPDATE_MESSAGE_TYPE_COMMUNITY:
                    case RequestData.UPDATE_MESSAGE_TYPE_MURMUR:
                        var apiUtil = {_callBackResponse: _callBackResponse};
                        _ret = _updateMessageBodyRequest(socket, _receiveObject, processCallback, apiUtil);
                        break;
                    case RequestData.UPDATE_MESSAGE_TYPE_TASK:
                    case RequestData.UPDATE_MESSAGE_TYPE_QUESTIONNAIRE:
                        _ret = _updateMessageRequest(socket, _receiveObject, processCallback);
                        break;
                    default:
                        _log.connectionLog(4, 'type is invalid. CubeeWebApi::_updateMessageRequest - (type = ' + _type + ')');
                        break;
                }
            break;
        case Const.API_REQUEST.API_DELETE_MESSAGE:
        case Const.API_REQUEST.API_ADMIN_DELETE_MESSAGE:
            var apiUtil = {_callBackResponse: _callBackResponse};
            _ret = MessageWebAPI.deleteMessage(socket, _receiveObject, processCallback, apiUtil);
            break;
        case Const.API_REQUEST.API_MESSAGE_OPTION:
            _ret = _sendMessageOptionRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_UPDATE_THREAD_TITLE:
            var apiUtil = {_callBackResponse: _callBackResponse};
            _ret = MessageWebAPI.updateTreadTitle(socket, _receiveObject, processCallback, apiUtil);
            break;
        case Const.API_REQUEST.API_GET_THREAD_TITLE_LIST:
            var apiUtil = {_callBackResponse: _callBackResponse};
            _ret = MessageWebAPI.getTreadTitleList(socket, _receiveObject, processCallback, apiUtil);
            break;
        case Const.API_REQUEST.API_CREATE_GROUP:
            var _type = Utils.getChildObject(
                    Utils.getChildObject(_receiveObject, STR_CONTENT),
                    'type');
            var apiUtil = {_callBackResponse: _callBackResponse};
            switch(_type) {
            case RequestData.CREATE_GROUP_TYPE_GROUP_CHAT_ROOM:
                _ret = GroupChatWebAPI.create(socket, _receiveObject, processCallback, apiUtil);
                break;
            case RequestData.CREATE_GROUP_TYPE_COMMUNITY_ROOM:
                _ret = CommunityWebAPI.create(socket, _receiveObject, processCallback, apiUtil);
                break;
            default:
                _log.connectionLog(4, 'type is invalid. CubeeWebApi Const.API_REQUEST.API_CREATE_GROUP - (type = ' + _type + ')');
                break;
            }
            break;
        case Const.API_REQUEST.API_GET_GROUP:
            _ret = _getGroupRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_UPDATE_GROUP:
            _ret = _updateGroupRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_ADD_MEMBER:
            _ret = _addMemberRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_PUBLIC_GROUP:
            _ret = PublicGroupChatAPI.receive(_globalSnsDB,socket, _receiveObject, processCallback, _callBackResponse);
            break;
        case Const.API_REQUEST.API_PUBLIC_COMMUNITY:
            _ret = PublicCommunityAPI.receive(_globalSnsDB,socket, _receiveObject, processCallback, _callBackResponse);
            break;
        case Const.API_REQUEST.API_PUBLIC_GROUP_MEMBER:
            _ret = PublicGroupChatMemberAPI.receive(_globalSnsDB,socket, _receiveObject, processCallback, _callBackResponse);
            break;
        case Const.API_REQUEST.API_PUBLIC_COMMUNITY_MEMBER:
            _ret = PublicCommunityMemberAPI.receive(_globalSnsDB,socket, _receiveObject, processCallback, _callBackResponse);
            break;
        case Const.API_REQUEST.API_GET_SERVER_LIST:
            _ret = _getServerListRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_ADMIN_LOGIN:
            _ret = _adminLoginRequest(socket, _receiveObject, processCallback, isIndependence);
            break;
        case Const.API_REQUEST.API_REGISTER_USER:
            _ret = _registerUserRequest(_receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_GET_SETTINGS:
            _ret = _getSettingsRequest(_receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_CONTROLL_CONECTION:
            _ret = _controllConectionRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_GET_LOGIN_PERSON_DATA:
            _ret = _getLoginPersonDataRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_GET_COUNT:
            _ret = _getCountRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_UPDATE_MEMBER:
            _ret = _updateMemberRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_REMOVE_MEMBER:
            _ret = _removeMemberRequest(socket, _receiveObject, processCallback);
            break;
        case Const.API_REQUEST.API_USER_FOLLOW:
            _ret = UserFollowAPI.receive(_globalSnsDB,socket, _receiveObject, processCallback, _callBackResponse);
            break;
        case Const.API_REQUEST.API_MURMUR_RANKING:
            _ret = MurmurRankingAPI.receive(_globalSnsDB,socket, _receiveObject, processCallback, _callBackResponse);
            break;
        case Const.API_REQUEST.API_MURMUR:
            _ret = MurmurAPI.receive(_globalSnsDB,socket, _receiveObject, processCallback, _callBackResponse);
            break;
        case Const.API_REQUEST.API_GET_ROLES:
        case Const.API_REQUEST.API_GET_ROLE_ASSIGNMENT:
        case Const.API_REQUEST.API_ASSIGN_ROLE:
        case Const.API_REQUEST.API_RIGHT_GET:
        case Const.API_REQUEST.API_POLICY_CREATE:
        case Const.API_REQUEST.API_RIGHT_CREATE:
        case Const.API_REQUEST.API_POLICY_ASSIGN_TO_USERS:
        case Const.API_REQUEST.API_POLICIES_OF_USER_GET_BY_RESOURCE:
        case Const.API_REQUEST.API_POLICY_UNASSIGN_FROM_USERS:
        case Const.API_REQUEST.API_POLICY_CHECK:
            var apiUtil = {_callBackResponse: _callBackResponse};
            _ret = RoleApiController.receive(socket, _receiveObject, processCallback, apiUtil);
            break;
        case Const.API_REQUEST.ADMIN_API_CREATE_USER:
        case Const.API_REQUEST.ADMIN_API_UPDATE_USER:
        case Const.API_REQUEST.ADMIN_API_UPDATE_USER_STATUS:
        case Const.API_REQUEST.ADMIN_API_GET_USERS:
        case Const.API_REQUEST.ADMIN_API_GET_LICENSE_INFO:
            var apiUtil = {_callBackResponse: _callBackResponse};
            _ret = UserManagementController.receive(socket, _receiveObject, processCallback, apiUtil);
            break;
        default :
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::receive - (request = ' + _request);
            _callBackResponse(processCallback, _accessToken, _request, _id, _version, 1, _content);
            return false;
        }
        return _ret;
    }

    _proto.notifyDisconnect = function(socket) {
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.clientDisconnect(socket);
    };

    function _callBackResponse(callBackFunk, accessToken, request, id, version, errorCode, content) {
        _log.connectionLog(7, 'do func CubeeWebApi::_callBackResponse');
        if (callBackFunk == null || typeof callBackFunk != 'function') {
            _log.connectionLog(2, 'callBackFunk is invalid.');
            return;
        }
        _log.connectionLog(7, 'callBackFunk is no invalid.');
        var _accessToken, _request, _id, _version, _errorCode, _content;
        if (accessToken == null || typeof accessToken != 'string') {
            _accessToken = null;
        } else {
            _accessToken = accessToken;
        }
        if (request == null || typeof request != 'string') {
            _request = '';
        } else {
            _request = request;
        }
        if (id == null || typeof id != 'string') {
            _id = '';
        } else {
            _id = id;
        }
        if (version == null || typeof version != 'number') {
            _version = 1;
        } else {
            _version = version;
        }
        if (errorCode == null || typeof errorCode != 'number') {
            _errorCode = 1;
        } else {
            _errorCode = errorCode;
        }
        if (content == null || typeof content != 'object') {
            _content = {};
        } else {
            _content = content;
        }
        var _response = {
            request : _request,
            id : _id,
            version : _version,
            errorCode : _errorCode,
            content : _content
        };
        if (_accessToken != null) {
            _response.accessToken = _accessToken;
        }
        try {
            var _responseStr = JSON.stringify(_response);
            setTimeout(function() {
                _log.connectionLog(7, '_responseStr : ' + _responseStr);
                callBackFunk(_responseStr);
            }, 1);
        } catch(e) {
            _log.connectionLog(2, '_response obj is invalid.');
        }
    }

    var _loginSequenceLock = {};
    function _lockLoginSequence(tenantUuid, userName){
        var lockValue = tenantUuid + " " + userName;
        if(_loginSequenceLock[lockValue] != true){
            _loginSequenceLock[lockValue] = true;
            return true;
        }
        return false;
    }
    function _unlockLoginSequence(tenantUuid, userName){
        var lockValue = tenantUuid + " " + userName;
        if(_loginSequenceLock[lockValue] == true){
            delete _loginSequenceLock[lockValue];
            return true;
        }
        return false;
    }
    _proto.isLoginSequenceLocked = function(tenantUuid, userName){
        var lockValue = tenantUuid + " " + userName;
        if(_loginSequenceLock[lockValue] == true){
            return true;
        }
        return false;
    };

    function _loginRequest(socket, request, processCallback, isIndependence) {
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_LOGIN) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_loginRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _user = Utils.getChildObject(_content, 'user');
        if(_user == null || typeof _user != 'string' || _user == ''){
            _log.connectionLog(4, 'user is invalid. CubeeWebApi::_loginRequest - (user = ' + _user);
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _password = Utils.getChildObject(_content, 'password');

        var _tenantName = Utils.getChildObject(_content, STR_TENANT_NAME);
        if (_tenantName == null || typeof _tenantName != 'string' || _tenantName == '') {
            _tenantName = _conf.getConfData(CONF_KEY_DEFAULT_TENANT_NAME);
            if(!_tenantName) {
                _tenantName = 'spf';
            }
        }

        var _tenantUuid = null;
        var _tenantConf = {};
        var _tenantData = TenantData.createAsOrder(_tenantName);
        if (_tenantData == null) {
            _log.connectionLog(3, 'Internal error. Could not create order. tenant: ' + _tenantName + ', user: ' + _user);
            _loginCallback(false, SynchronousBridgeNodeXmpp.DISCCONECT_REASON_ERROR_INNER, null);
            return false;
        }
        var _chef = ReadCacheBeforeDBChef.getInstance();
        _chef.cook(_tenantData, _onGetTenantDataFromCache);

        function _loginCallback(result, reason, accessToken) {
            var _responceContent = {
                result : result,
                reason : reason,
                accessToken : accessToken,
                tenantInfo: ('disclosable' in _tenantConf ? _tenantConf.disclosable : {}),
            };
            var _resExtras = false;
            _unlockLoginSequence(_tenantUuid, _user);
            _log.connectionLog(7, 'unlockLoginSequence['+ _tenantUuid + ' ' +_user+'] case callback');
            if(result == false) {
                _callBackResponse(processCallback, null, _requestStr, _id, _version, 0, _responceContent);
                return;
            }
            _execLoginUserPersonData(accessToken, _id, _version, _requestStr, _responceContent ,_resExtras, processCallback);
        }
        var _login_wait_count  = 0;
        var _LOCK_RETRY_MAX_CNT = _conf.getConfData('LOGIN_SEQUENCE_LOCK_RETRY_MAX_CNT');
        function _waitLogin() {
            var _lock = _lockLoginSequence(_tenantUuid, _user);
            if(_lock != true && _login_wait_count  < _LOCK_RETRY_MAX_CNT ) {
                setTimeout(function (){
                    _log.connectionLog(7, 'lockLoginSequence retry['+ _tenantUuid + ' ' +_user+']');
                    _waitLogin();
                },100);
            } else {
                if(_login_wait_count  == _LOCK_RETRY_MAX_CNT ){
                    _log.connectionLog(4, 'The limit of lockLoginSequence retry has been reached');
                }
                _log.connectionLog(7, 'lockLoginSequence succeed['+ _tenantUuid + ' ' +_user+']');
                var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
                var _ret = _synchronousBridgeNodeXmpp.login(socket, _tenantUuid, _user, _password, _loginCallback, isIndependence);
                if( _ret != true) {
                    _unlockLoginSequence(_tenantUuid, _user);
                    _log.connectionLog(7, 'unlockLoginSequence['+ _tenantUuid + ' ' +_user+'] case false');
                    _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
                }
            }
        }
        function _onGetTenantDataFromCache(err, dish) {
            if (err) {
                _log.connectionLog(4, 'Could not get tenant data. CubeeWebApi::_loginRequest: ' + err);
                _loginCallback(false, SynchronousBridgeNodeXmpp.DISCCONECT_REASON_ERROR_AUTH, null);
                return;
            }
            if (dish == null) {
                _log.connectionLog(3, 'Chef could not cook order.');
                _loginCallback(false, SynchronousBridgeNodeXmpp.DISCCONECT_REASON_ERROR_AUTH, null);
                return;
            }
            _tenantUuid = dish.getTenantUuid();
            _tenantConf = dish.getTenantConf();
            if (_.has(_tenantConf, "disclosable") &&
                !_.has(_tenantConf.disclosable, "note")){
                _tenantConf.disclosable.note = {enable:false}
            }
            if (_conf.getConfData('ENABLE_NOTE').toUpperCase() == 'TRUE') {
                _tenantConf.disclosable.note.enable = true
            } else {
                _tenantConf.disclosable.note.enable = false
            }
            setTimeout(_waitLogin, 1);
        }
        return true;
    }
    function _getVCardData(accessToken, jid, callbackFunc) {
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.getVCard(accessToken, jid, callbackFunc);
    }
    function _getGetMailCooperationSettings(accessToken, callbackFunc) {
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.getGetMailCooperationSettings(accessToken, callbackFunc);
    }
    function _getLoginPersonDataRequest(socket, request, processCallback) {
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_GET_LOGIN_PERSON_DATA) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_getLoginPersonDataRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _responceContent = {
            result : false,
            reason : SynchronousBridgeNodeXmpp.DISCCONECT_REASON_UNKNOWN,
            accessToken : _accessToken,
        };
        var _resExtras = true;
        _execLoginUserPersonData(_accessToken, _id, _version, _requestStr, _responceContent , _resExtras, processCallback);
        return true;
    }
    function _execLoginUserPersonData(accessToken, id, version, requestStr, responceContent, resExtras, callbackFunc) {
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData == null) {
            responceContent.result = false;
            responceContent.reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_ERROR_INNER;
            _callBackResponse(callbackFunc, null, requestStr, id, version, 0, responceContent);
        }
        var _jid = _sessionData.getJid();
        var _name = _sessionData.getLoginAccout();
        var _tenantUuid = _sessionData.getTenantUuid();
        function onGetVCardCallback(result, reason, responceData) {
            responceContent.result = result;
            responceContent.reason = reason;
            responceContent.userInfo = {};
            var _userInfo = responceContent.userInfo;
            if(result == false) {
                responceContent.result = result;
                responceContent.reason = reason;
            } else {
                _userInfo.jid = _jid;
                _userInfo.name =_name;
                _userInfo.nickName = responceData.nickName;
                _userInfo.group = responceData.group;
                _userInfo.avatarType = responceData.avatarType;
                _userInfo.avatarData = responceData.avatarData;
                if (resExtras) {
                    _userInfo.extras = responceData.extras;
                }
            }
            _getGetMailCooperationSettings(accessToken, onGetMailCooperationSettings);
            function onGetMailCooperationSettings(result, reason, extras, count, items){
                if(result == false) {
                    responceContent.result = result;
                    responceContent.reason = reason;
                }
                _userInfo.mailCooperationCount = count;
                _userInfo.mailCooperationItems = items;
                UserAccountUtils.getUserDataByTenantLoginAccount(_tenantUuid, _name, _onGetUserAccountData);
            }
            function _onGetUserAccountData(userAccountData){
                if(!userAccountData){
                    responceContent.result = false;
                    responceContent.reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_ERROR_INNER;
                    _callBackResponse(callbackFunc, null, requestStr, id, version, 0, responceContent);
                    return;
                }
                responceContent.result = true;
                responceContent.reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
                _userInfo.status = userAccountData.getDeleteFlg();
                _userInfo.mailAddress = userAccountData.getMailAddress();
                _callBackResponse(callbackFunc, null, requestStr, id, version, 0, responceContent);
            }
        }
        _getVCardData(accessToken, _jid, onGetVCardCallback);
    }

    function _logoutRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = {};
        _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _content);

        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.logout(socket);

        return true;
    }

    function _getPersonListRequest(socket, request, processCallback) {
        _log.connectionLog(7, 'CubeeWebApi::_getPersonListRequest - ');
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_GET_PERSON_LIST) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_getPersonListRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        switch(_type) {
        case RequestData.GET_PERSON_LIST_TYPE_CONTACT_LIST:
            function _getRosterCallback(result, reason, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : {},
                    count : count,
                    items : items,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.getRoster(_accessToken, _getRosterCallback);
            break;
        case RequestData.GET_PERSON_LIST_TYPE_SEARCH:
            var _subType = Utils.getChildObject(_content, 'subType');
            function _onSearchPersonCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    subType : _subType,
                    extras : extras,
                    count : count,
                    items : items,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.searchPerson(_accessToken, _content, _onSearchPersonCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_getPersonListRequest - (type = ' + _type);
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
        }
        return _ret;
    }
    function _setLoginPersonData(socket, request, processCallback) {
        _log.connectionLog(7, 'do func CubeeWebApi::_setLoginPersonData - ');
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_SET_LOGIN_PERSON_DATA) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_setLoginPersonData - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _isSoonCallBack = false;
        var _responceContent = _content;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        switch(_type) {
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PRESENCE:
            _ret = _synchronousBridgeNodeXmpp.setLoginPersonData(_accessToken, _content, null);
            _isSoonCallBack = true;
            _responceContent = {
                result : _ret,
                reason : SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO,
                type : _type,
            };
            if (_ret == false) {
                _responceContent.reason = SynchronousBridgeNodeXmpp.ERROR_REASON_INNER;
            }
            break;
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_MAIL_COOPERATION_SETTING:
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_REGISTER_DEVICE_INFO:
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_DELETE_DEVICE_INFO:
            function _setLoginPersonDataCallback(result, reason, content) {
                var _responceContent = {};
                if(content != null) {
                    _responceContent = content;
                    _responceContent.result = result;
                    _responceContent.reason = reason;
                    _responceContent.type = _type;
                } else {
                    _responceContent = {
                        result : result,
                        reason : reason,
                        type : _type,
                    };
                }
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.setLoginPersonData(_accessToken, _content, _setLoginPersonDataCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_setLoginPersonData - (type = ' + _type);
            break;
        }

        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        } else if(_isSoonCallBack == true) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
        }
        return _ret;
    }
    function _getMessageRequest(socket, request, processCallback) {
        _log.connectionLog(7, 'do func CubeeWebApi::_getMessageRequest');
        _log.connectionLog(7, 'CubeeWebApi::_getMessageRequest - ');
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_GET_MESSAGE) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_getMessageRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _log.connectionLog(7, 'do func CubeeWebApi::_getMessageRequest before switch _type : '+_type);
        switch(_type) {
        case RequestData.GET_MESSAGE_TYPE_SEARCH_ALL:
            let apiUtil = {_callBackResponse: _callBackResponse};
            _ret = MessageWebAPI.searchAllMessage(socket, request, processCallback, apiUtil);
            break;
        case RequestData.GET_MESSAGE_TYPE_MY_FEED:
        case RequestData.GET_MESSAGE_TYPE_CHAT:
        case RequestData.GET_MESSAGE_TYPE_TASK:
        case RequestData.GET_MESSAGE_TYPE_SEARCH:
        case RequestData.GET_MESSAGE_TYPE_MAIL_BODY:
        case RequestData.GET_MESSAGE_TYPE_THREAD:
        case RequestData.GET_MESSAGE_TYPE_QUESTIONNAIRE:
        case RequestData.GET_MESSAGE_TYPE_MURMUR:
            function _getMessageCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.getMessage(_accessToken, _content, _getMessageCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_getMessageRequest - (type = ' + _type);
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
        }
        return _ret;
    }
    function _sendMessageRequest(socket, request, processCallback) {
        _log.connectionLog(7, 'do func CubeeWebApi::_sendMessageRequest - ');
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_SEND_MESSAGE) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_sendMessageRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _isSoonCallBack = false;
        var _responceContent = _content;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        switch(_type) {
        case RequestData.SEND_MESSAGE_TYPE_PUBLIC:
        case RequestData.SEND_MESSAGE_TYPE_CHAT:
        case RequestData.SEND_MESSAGE_TYPE_TASK:
        case RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT:
        case RequestData.SEND_MESSAGE_TYPE_MAIL:
        case RequestData.SEND_MESSAGE_TYPE_COMMUNITY:
        case RequestData.SEND_MESSAGE_TYPE_QUESTIONNAIRE:
        case RequestData.SEND_MESSAGE_TYPE_MURMUR:
            function _sendMessageCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                };
                if(extras != null) {
                    _responceContent.extras = extras;
                }
                if(count != null) {
                    _responceContent.count = count;
                }
                if(items != null) {
                    _responceContent.items = items;
                }
                if(result && Array.isArray(items) && items.length > 0){
                    HashTagAPI.setHashtagToDb(_globalSnsDB, _accessToken, _content.body, items[0].itemId);
                }
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.sendMessage(_accessToken, _content, _sendMessageCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_sendMessageRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        } else if(_isSoonCallBack == true){
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
        }
        return _ret;
    }
    function _updateMessageRequest(socket, request, processCallback) {
        _log.connectionLog(7, 'CubeeWebApi::_updateMessageRequest - ');
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_UPDATE_MESSAGE) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_updateMessageRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        switch(_type) {
        case RequestData.UPDATE_MESSAGE_TYPE_TASK:
        case RequestData.UPDATE_MESSAGE_TYPE_QUESTIONNAIRE:
            function _updateMessageCallback(result, reason, extras, count, items ) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items
                };
                if(result &&
                   Array.isArray(items) && items.length > 0 && items[0].itemId &&
                   _type != RequestData.UPDATE_MESSAGE_TYPE_QUESTIONNAIRE){
                    HashTagAPI.setHashtagToDb(_globalSnsDB, _accessToken,  _content.body, items[0].itemId);
                }
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.updateMessage(_accessToken, _content, _updateMessageCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_updateMessageRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        }
        return _ret;
    }

    function _updateMessageBodyRequest(socket, request, processCallback, apiUtil) {
        _log.connectionLog(7, 'do func CubeeWebApi::_updateMessageBodyRequest - ');
        let _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        let _requestStr = Utils.getChildObject(request, STR_REQUEST);
        let _id = Utils.getChildObject(request, STR_ID);
        let _version = Utils.getChildObject(request, STR_VERSION);
        let _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_UPDATE_MESSAGE) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_updateMessageBodyRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        switch(_type) {
        case RequestData.UPDATE_MESSAGE_TYPE_PUBLIC:
        case RequestData.UPDATE_MESSAGE_TYPE_CHAT:
        case RequestData.UPDATE_MESSAGE_TYPE_GROUP_CHAT:
        case RequestData.UPDATE_MESSAGE_TYPE_COMMUNITY:
        case RequestData.UPDATE_MESSAGE_TYPE_MURMUR:
            function _sendMessageCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                };
                if(extras != null) {
                    _responceContent.extras = extras;
                }
                if(count != null) {
                    _responceContent.count = count;
                }
                if(items != null) {
                    _responceContent.items = items;
                }
                if(result){
                    HashTagAPI.setHashtagToDb(_globalSnsDB, _accessToken, _content.body, _content.itemId);
                }
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.updateMessageBody(_accessToken, _content, _sendMessageCallback, apiUtil);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_updateMessageBodyRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        }
        return _ret;
    }

    function _sendMessageOptionRequest(socket, request, processCallback) {
        _log.connectionLog(7, 'CubeeWebApi::_sendMessageOptionRequest - ');
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_MESSAGE_OPTION) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_sendMessageOptionRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        switch(_type) {
        case RequestData.MESSAGE_OPTION_TYPE_ADD_GOOD_JOB:
        case RequestData.MESSAGE_OPTION_TYPE_ADD_EMOTION_POINT:
        case RequestData.MESSAGE_OPTION_TYPE_DEMAND_TASK:
        case RequestData.MESSAGE_OPTION_TYPE_CLEAR_DEMANDED_TASK:
        case RequestData.MESSAGE_OPTION_TYPE_SET_READ_MESSAGE:
            _ret = _synchronousBridgeNodeXmpp.setMessageOption(_accessToken, _content, _onResponceCallBack);
            break;
        case RequestData.MESSAGE_OPTION_TYPE_GET_EXISTING_READER_LIST:
        case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_LIST:
        case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_LIST:
        case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_TOTAL:
        case RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_RANKING:
        case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_TOTAL:
        case RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_RANKING:
            _ret = _synchronousBridgeNodeXmpp.getMessageOption(_accessToken, _content, _onResponceCallBack);
            break;
        case RequestData.MESSAGE_OPTION_TYPE_GET_HASHTAG_RANKING:
                HashTagAPI.getHashtagRanking(_globalSnsDB, _accessToken, _content)
                          .then((res)=>{
                              _onResponceCallBack(res.result,
                                                  res.reason,
                                                  res.data);
                          }).catch((err)=>{
                              _callBackResponse(processCallback,
                                                _accessToken,
                                                _requestStr,
                                                _id, _version,
                                                1, _responceContent);
                          });
                _ret = true;
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_sendMessageOptionRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        }
        return _ret;

        function _onResponceCallBack(result, reason, items){
            var _responceContent = {
                result : result,
                reason : reason,
                type : _type
            };
            if(items != null){
                _responceContent.itemCount = items.length;
                _responceContent.items = items;
            }
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
        }
    }

    function _getGroupRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_GET_GROUP) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_getGroupRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        var _type = Utils.getChildObject(_content, 'type');
        switch(_type) {
        case RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_LIST:
            if( _.has(request.content,"parentRoomId") &&
                    ! Utils.varidieter.parentRoomId(request.content.parentRoomId) ){
                _callBackResponse(processCallback,
                                      _accessToken,
                                      _requestStr,
                                      _id, _version, 1, {
                                          result: false,
                                          reason: API_STATUS.BAD_REQUEST
                                      });
                break;
            }
        case RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_INFO:
        case RequestData.GET_GROUP_TYPE_MY_COMMUNITY_LIST:
        case RequestData.GET_GROUP_TYPE_COMMUNITY_INFO:
        case RequestData.GET_GROUP_TYPE_COMMUNITY_MEMBER_INFO:
            function _getGroupCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.getGroup(_accessToken, _content, _getGroupCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_getGroupRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        }
        return _ret;
    }
    function _updateGroupRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_UPDATE_GROUP) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_updateGroupRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        var _type = Utils.getChildObject(_content, 'type');
        switch(_type) {
        case RequestData.UPDATE_GROUP_TYPE_GROUP_CHAT_ROOM_INFO:
            function _onUpdateGroupChatInfoCallBack(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.updateGroup(_accessToken, _content, _onUpdateGroupChatInfoCallBack);
            break;
        case RequestData.UPDATE_GROUP_TYPE_COMMUNITY_ROOM_INFO:
            function _onUpdateCommunityInfoCallBack(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.updateGroup(_accessToken, _content, _onUpdateCommunityInfoCallBack);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_updateGroupRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        }
        return _ret;
    }
    function _addMemberRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_ADD_MEMBER) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_addMemberRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        var _type = Utils.getChildObject(_content, 'type');
        switch(_type) {
        case RequestData.ADD_MEMBER_TYPE_GROUP_CHAT_ROOM:
        case RequestData.ADD_MEMBER_TYPE_COMMUNITY_ROOM:
        case RequestData.ADD_MEMBER_TYPE_CONTACT_LIST:
            function _addMemberGroupChatCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.addMember(_accessToken, _content, _addMemberGroupChatCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_addMemberRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        }
        return _ret;
    }
    function _getServerListRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_GET_SERVER_LIST) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_getServerListRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        var _type = Utils.getChildObject(_content, 'type');
        switch(_type) {
        case RequestData.GET_SERVER_LIST_TYPE_MAIL_SERVER:
            function _getServerListCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.getServerList(_accessToken, _content, _getServerListCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_addMemberRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        }
        return _ret;
    }

    function _getSettingsRequest(request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_GET_SETTINGS) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_getSettingsRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        var _type = Utils.getChildObject(_content, 'type');
        switch(_type) {
        case RequestData.GET_SETTINGS_TYPE_ALL_USER_MAIL_SETTINGS:
            function _getAllUserMailSettingsCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.getAllUserMailSettings(_accessToken, _content, _getAllUserMailSettingsCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_getSettingsRequest - (type = ' + _type + ')');
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _responceContent);
        }
        return _ret;
    }
    function _controllConectionRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        var _errorCodeErr = 1;
        if (_requestStr != Const.API_REQUEST.API_CONTROLL_CONECTION) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_controllConectionRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, _errorCodeErr, _content);
            return false;
        }
        var _ret = false;
        var _responceContent = _content;
        var _type = Utils.getChildObject(_content, 'type');
        switch(_type) {
        case RequestData.CONTROLL_CONECTION_TYPE_SWITCH_PROTOCOL:
            var _responceContent = {
                result : false,
                reason : SynchronousBridgeNodeXmpp.ERROR_REASON_ERROR_PARAM,
                type : _type,
            };
            var _sessionData = SessionDataMannager.getInstance().get(_accessToken);
            if(_sessionData == null){
                _log.connectionLog(4, '_sessionData is invalid. CubeeWebApi::_controllConectionRequest');
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, _errorCodeErr, _responceContent);
                break;
            }
            var _curIPAddress = _sessionData.getIpAddress();
            var _requestIPAdress = Utils.getIPAddress(socket);
            if(_curIPAddress != _requestIPAdress){
                _log.connectionLog(4, 'Bad IPAddress. CubeeWebApi::_controllConectionRequest - _curIPAddress = ' + _curIPAddress + ' / _requestIPAdress = ' + _requestIPAdress);
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, _errorCodeErr, _responceContent);
                break;
            }
            SessionDataMannager.getInstance().get(_accessToken).setSocketIoSock(socket);
            _ret = true;
            _responceContent.result = true;
            _responceContent.reason = SynchronousBridgeNodeXmpp.DISCCONECT_REASON_NO;
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_setLoginPersonData - (type = ' + _type);
            break;
        }

        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, _errorCodeErr, _responceContent);
        }
        return _ret;
    }
    function _getCountRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_GET_COUNT) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_getCountRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        switch(_type) {
        case RequestData.GET_COUNT_TYPE_MESSAGE :
            function _getCountCallback(result, reason, extras, count) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.getCount(_accessToken, _content, _getCountCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_getCountRequest - (type = ' + _type);
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
        }
        return _ret;
    }
    function _updateMemberRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_UPDATE_MEMBER) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_updateMemberRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        switch(_type) {
        case RequestData.UPDATE_MEMBER_TYPE_COMMUNITY_OWNER :
            function _updateMemberCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.updateMember(_accessToken, _content, _updateMemberCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_updateMemberRequest - (type = ' + _type);
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
        }
        return _ret;
    }
    function _removeMemberRequest(socket, request, processCallback) {
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_REMOVE_MEMBER) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_removeMemberRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _ret = false;
        var _type = Utils.getChildObject(_content, 'type');
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();

        switch(_type) {
        case RequestData.REMOVE_MEMBER_TYPE_COMMUNITY_ROOM :
        case RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM :
        case RequestData.REMOVE_MEMBER_TYPE_CONTACT_LIST :
            function _removeMemberCallback(result, reason, extras, count, items) {
                var _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                    extras : extras,
                    count : count,
                    items : items
                };
                _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 0, _responceContent);
            }
            _ret = _synchronousBridgeNodeXmpp.removeMember(_accessToken, _content, _removeMemberCallback);
            break;
        default:
            _log.connectionLog(4, 'type is invalid. CubeeWebApi::_removeMemberRequest - (type = ' + _type);
            break;
        }
        if (_ret == false) {
            _callBackResponse(processCallback, _accessToken, _requestStr, _id, _version, 1, _content);
        }
        return _ret;
    }
    function _adminLoginRequest(socket, request, processCallback, isIndependence) {
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_ADMIN_LOGIN) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_loginRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _user = Utils.getChildObject(_content, 'user');
        var _password = Utils.getChildObject(_content, 'password');
        function _loginCallback(result, reason, accessToken) {
            var _responceContent = {
                result : result,
                reason : reason,
                accessToken : accessToken,
            };
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 0, _responceContent);
        }
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        return _synchronousBridgeNodeXmpp.adminLogin(socket, _user, _password, _loginCallback, isIndependence);
    }
    function _registerUserRequest(request, processCallback) {
        var _requestStr = Utils.getChildObject(request, STR_REQUEST);
        var _id = Utils.getChildObject(request, STR_ID);
        var _version = Utils.getChildObject(request, STR_VERSION);
        var _content = Utils.getChildObject(request, STR_CONTENT);
        if (_requestStr != Const.API_REQUEST.API_REGISTER_USER) {
            _log.connectionLog(4, 'request is invalid. CubeeWebApi::_loginRequest - (request = ' + _requestStr);
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 1, _content);
            return false;
        }
        var _personData = PersonData.create(_content);
        var _password = Utils.getChildObject(_content, 'password');
        var _accessToken = Utils.getChildObject(request, STR_ACCESS_TOKEN);
        var _contactData = Utils.getChildObject(_content, 'contact');
        var _registerContactType = _contactData.type;
        var _registeredContactData = RegisteredContactData.create();
        _registeredContactData.setType(_registerContactType);
        function _registerUserCallback(result, reason, personData, password, registeredContactData) {
            var _responceContent = {
                result : result,
                reason : reason,
            };
            _responceContent.userInfo = {};
            var _userInfo = _responceContent.userInfo;
            _userInfo.user = personData.getUserName();
            _userInfo.mail = personData.getMail();
            _userInfo.nickName = personData.getNickName();
            _userInfo.contact = {};
            var _contact = _userInfo.contact;
            _contact.type = registeredContactData.getType();
            _callBackResponse(processCallback, null, _requestStr, _id, _version, 0, _responceContent);
        }
        var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        return _synchronousBridgeNodeXmpp.registerUser(_accessToken, _personData, _password, _registeredContactData,_registerUserCallback);
    }

    _proto.pushMessage = function(accessToken, notify, content) {
        _log.connectionLog(7, "do func CubeeWebAPI.pushMessage(...");
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(accessToken);
        if (_sessionData == null) {
            _log.connectionLog(3, '_sessionData is invalid');
            return;
        }
        var _socket = _sessionData.getSocketIoSock();
        if(_socket == null) {
            _log.connectionLog(7, '_socket is invalid');
            return;
        }
        if(_socket.isSynchronous != true) {
            _log.connectionLog(7, 'not SocketIo');
            return;
        }

        var _notify, _id, _version, _content;
        if (notify == null || typeof notify != 'string') {
            _notify = '';
        } else {
            _notify = notify;
        }

        var _id = _notify;
        for(var _i = 0; _i < 8; _i++) {
            var _num6bit = Utils.getRandomNumber(0, 63);
            _id += Utils.convert6BitNumToChara(_num6bit);
        }
        var _version = 1;

        if (content == null || typeof content != 'object') {
            _content = {};
        } else {
            _content = content;
        }

        var _pushData = {
            accessToken : accessToken,
            notify : _notify,
            id : _id,
            version : _version,
            content : _content,
        };
        try{
            var _message = JSON.stringify(_pushData);
            setTimeout(function() {
                _log.connectionLog(7, 'push message : ' + _message);
                SocketIo.pushMessage(_socket, _message);
            }, 1);
        } catch(e) {
            _log.connectionLog(2, 'pushData obj is invalid.');
        }
    };

    _proto.onErrorXmppServer = function(socket, error) {
        if(socket == null) {
            return;
        }
        if(socket.isSynchronous == true) {
            setTimeout(function() {
                SocketIo.onError(socket, error);
                return;
            }, 1);
        }
    };

    _proto.onDisconnectXmppServer = function(socket) {
        if(socket == null) {
            return;
        }
        if(socket.isSynchronous == true) {
            setTimeout(function() {
                SocketIo.onDisconnect(socket);
                return;
            }, 1);
        }
    };

    var _cubeeWebApi = new CubeeWebApi();

    CubeeWebApi.getInstance = function() {
        return _cubeeWebApi;
    };

    exports.getInstance = CubeeWebApi.getInstance;
})();
