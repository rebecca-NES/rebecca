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

'use strict';

const _ = require('underscore');
const Log = require('../server_log').getInstance();
const Conf = require('../conf');
const SessionDataMannager = require('../session_data_manager');
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const API_REQUEST = require('../const').API_REQUEST;
const API_STATUS = require('../const').API_STATUS;
const utils = require('../../utils');
const PersonData = require('../../model/person_data');
const RegisteredContactData = require('../../model/registered_contact_data');
const UserAccountUtils = require('../user_account_utils');
const LicenseManager = require('../../../express_app/controller/license_manager');
const validationCheck = require('../validation');

const _conf = Conf.getInstance();
const requestMap = {
    [API_REQUEST.ADMIN_API_CREATE_USER]: createUser,
    [API_REQUEST.ADMIN_API_UPDATE_USER]: updateUser,
    [API_REQUEST.ADMIN_API_UPDATE_USER_STATUS]: updateUserStatus,
    [API_REQUEST.ADMIN_API_GET_USERS]: getUsers,
    [API_REQUEST.ADMIN_API_GET_LICENSE_INFO]: getLicenseInfo
};

exports.receive = (socket, _receiveObject, processCallback, apiUtil) => {

    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(utils.getChildObject(_receiveObject, 'accessToken'));
    const _fromJid = _sessionData.getJid();
    let errorContent = {};
    function _tenantAdminCallback(xmlIqElem){

        const _userAuthorityElem = utils.getChildXmlElement(xmlIqElem, 'user_authority');
        if (_userAuthorityElem == null) {
            Log.connectionLog(3, `tenantAdmin-WEB_API receive: ` +
              `_userAuthorityElem is null - ${xmlIqElem.toString()}`);
            errorContent = createErrorReasonResponse(_receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(_receiveObject,  processCallback, errorContent, 0, apiUtil);
            return;
        }
        const _typeElem = utils.getChildXmlElement(_userAuthorityElem, 'type');
        if (_typeElem == null) {
            Log.connectionLog(3, `tenantAdmin-WEB_API receive: ` +
                `_typeElem is null - ${_userAuthorityElem.toString()}`);
            errorContent = createErrorReasonResponse(_receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(_receiveObject,  processCallback, errorContent, 0, apiUtil);
            return;
        }
        const _authorityType = _typeElem.text();
        if (_authorityType == PersonData.AUTHORITY_TYPE_ADMIN) {
            requestMap[_receiveObject.request](_receiveObject, processCallback, apiUtil);
        } else {
            Log.connectionLog(3, `tenantAdmin-WEB_API receive: ` +
                `login user is not tenant admin`);
            errorContent = createErrorReasonResponse(_receiveObject, API_STATUS.FORBIDDEN);
            executeCallback(_receiveObject,  processCallback, errorContent, 0, apiUtil);
        }
    }

    if (_.has(requestMap, _receiveObject.request)) {
        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.getUserAuthority(utils.getChildObject(_receiveObject, 'accessToken'), _fromJid, _tenantAdminCallback);
    } else {
        errorContent = createErrorReasonResponse(_receiveObject, API_STATUS.BAD_REQUEST);
        executeCallback(_receiveObject,  processCallback, errorContent, 0, apiUtil);
        return false;
    }
    return true;
};

function createUser(receiveObject, callback, apiUtil) {

    let _errContent = {};
    if (!createValidationCheck(receiveObject)){
        Log.connectionLog(3, `tenantAdmin-WEB_API createUser: ` +
            `the value entered has problem.`);
        _errContent = createErrorReasonResponse(receiveObject, API_STATUS.BAD_REQUEST);
        executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        return false;
    }
    const _accessToken = utils.getChildObject(receiveObject, 'accessToken');
    const _content = utils.getChildObject(receiveObject, 'content');

    const _userInfoList = setCreateUserInfo(_content);

    const _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
    const _expect = [_adminAccount];
    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _tenantId = _sessionData.getTenantUuid();
    return UserAccountUtils.getUserListCountForAdmintool(_sessionData,
        _tenantId, _expect, false, _getUserCountCallback);

    function _getUserCountCallback(allCount) {
        const _licenseManager = LicenseManager.getInstance();
        const _license = _licenseManager.getLicensedUserCount(_tenantId);

        if(_license.count == 0 || !_license){
            Log.connectionLog(3, `tenantAdmin-WEB_API createUser: failed get license`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        }

        if ((_license.count - allCount) < _userInfoList.length) {
            Log.connectionLog(3, `tenantAdmin-WEB_API createUser: ` +
                `User creation limit has been reached.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.BAD_REQUEST);
            executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        }else{
            const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
            _synchronousBridgeNodeXmpp.execBatchRegistration(_accessToken, _userInfoList, _createUserCallback);
        }
    }

    function _createUserCallback(result, reason, extras, count, items) {
        const _responseContent = {
            result,
            reason
        };
        if (count > 0) {
            _responseContent.result = items[0].result;
            _responseContent.reason = items[0].reason;
        }
        if (_responseContent.result) {
            executeCallback(receiveObject, callback, _responseContent, 0, apiUtil);
        } else {
            Log.connectionLog(3, `tenantAdmin-WEB_API createUser: `+
                `User update process failed. There is a possibility that the `+
                `user does not exist or internal processing has failed.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject, callback, _errContent, 0, apiUtil);
        }
    }
}

function createValidationCheck(_receiveObject) {
    const _content = utils.getChildObject(_receiveObject, 'content');
    if(!_content){
        return false;
    }
    const _user = utils.getChildObject(_content, 'user');
    const _nickName =  utils.getChildObject(_content, 'nickName');
    const _password =  utils.getChildObject(_content, 'password');
    const _group = utils.getChildObject(_content, 'group');
    const _mailAddress = utils.getChildObject(_content, 'mailAddress');

    if(validationCheck.userValidationCheck(_user, true) &&
        validationCheck.nickNameValidationCheck(_nickName, true) &&
        validationCheck.passwordValidationCheck(_password, true) &&
        validationCheck.groupValidationCheck(_group, false) &&
        validationCheck.mailAddressValidationCheck(_mailAddress, false)){
        return true;
    }
    return false;
}

function setCreateUserInfo(content) {
    const _personData = PersonData.create();
    _personData.setUserName(utils.getChildObject(content, 'user'));
    _personData.setNickName(utils.getChildObject(content, 'nickName'));
    if(utils.getChildObject(content, 'mailAddress')){
        _personData.setMail(content.mailAddress);
    }else{
        _personData.setMail('');
    }
    if(utils.getChildObject(content, 'group')){
        _personData.setGroup(content.group);
    }

    const _registeredContactData = RegisteredContactData.create();
    _registeredContactData.setType(RegisteredContactData.TYPE_NONE);

    return [{
        'personData': _personData,
        'password': utils.getChildObject(content, 'password'),
        'registeredContactData': _registeredContactData
    }];
}

function updateUser(receiveObject, callback, apiUtil) {
    const _accessToken = utils.getChildObject(receiveObject, 'accessToken');
    const _content = utils.getChildObject(receiveObject, 'content');
    let _errContent = {};
    if (!updateValidationCheck(receiveObject)) {
        Log.connectionLog(3, `tenantAdmin-WEB_API updateUser: ` +
            `the value entered has problem.`);
        _errContent = createErrorReasonResponse(receiveObject, API_STATUS.BAD_REQUEST);
        executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        return false;
    }

    const _userInfo = {
        'account': utils.getChildObject(_content, 'user'),
        'nickname': utils.getChildObject(_content, 'nickName')
    };
    if (utils.getChildObject(_content, 'group')) {
        _userInfo.group = utils.getChildObject(_content, 'group');
    }
    if (utils.getChildObject(_content, 'mailAddress')) {
        _userInfo.mailAddress = utils.getChildObject(_content, 'mailAddress');
    }

    function _updateUserCallback (result, reason, extras, count, items) {
        const _responseContent = {
            result,
            reason
        };
        if (count > 0) {
            _responseContent.result = items[0].result;
            _responseContent.reason = items[0].reason;
        }
        if (_responseContent.result){
            const _sessionDataMannager = SessionDataMannager.getInstance();
            const _sessionData = _sessionDataMannager.get(utils.getChildObject(receiveObject, 'accessToken'));
            const _tenantUuid = _sessionData.getTenantUuid();
            if(utils.getChildObject(_content, 'mailAddress')){
                UserAccountUtils.updateUserAccountMailAddress(_tenantUuid, utils.getChildObject(_content, 'user'),
                    _content.mailAddress, _onUpdateUserAccountMailAddress);
            }else{
                executeCallback(receiveObject, callback, _responseContent, 0, apiUtil);
            }
        } else {
            Log.connectionLog(3, `tenantAdmin-WEB_API updateUser:` +
                `User update process failed. There is a possibility that the` +
                `user does not exist or internal processing has failed.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject, callback, _errContent, 0, apiUtil);
        }
    }

    function _onUpdateUserAccountMailAddress(updateResult) {
        const _responseContent = {};
        if(updateResult == true) {
            _responseContent.result = true;
            _responseContent.reason = 0;
            executeCallback(receiveObject, callback, _responseContent, 0, apiUtil);
        } else {
            Log.connectionLog(3, `tenantAdmin-WEB_API updateUser: `+
                `User update process failed. There is a possibility that the `+
                `user does not exist or internal processing has failed.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject, callback, _errContent, 0, apiUtil);
        }
    }
    const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.execBatchUpdate(_accessToken, [_userInfo], _updateUserCallback);
}

function updateValidationCheck(_receiveObject) {
    const _content = utils.getChildObject(_receiveObject, 'content');
    if(!_content){
        return false;
    }
    const _user = utils.getChildObject(_content, 'user');
    const _nickName = utils.getChildObject(_content, 'nickName');
    const _group = utils.getChildObject(_content, 'group');
    const _mailAddress = utils.getChildObject(_content, 'mailAddress');

    if(validationCheck.userValidationCheck(_user, true) &&
        validationCheck.nickNameValidationCheck(_nickName, true) &&
        validationCheck.groupValidationCheck(_group, false) &&
        validationCheck.mailAddressValidationCheck(_mailAddress, false)){
        return true;
    }
    return false;
}

function updateUserStatus(receiveObject, callback, apiUtil) {
    let _errContent = {};
    if (!updateUserStatusValidationCheck(receiveObject)) {
        Log.connectionLog(3, `tenantAdmin-WEB_API updateUserStatus: ` +
            `the value entered has problem.`);
        _errContent = createErrorReasonResponse(receiveObject, API_STATUS.BAD_REQUEST);
        executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        return false;
    }

    const _accessToken = utils.getChildObject(receiveObject, 'accessToken');
    const _content = utils.getChildObject(receiveObject, 'content');

    const _user = utils.getChildObject(_content, 'user');
    const _status = utils.getChildObject(_content, 'status');
    function _updateUserStatusCallback(result, reason) {
        const _responseContent = {
            result,
            reason
        };
        if (_responseContent.result) {
            executeCallback(receiveObject, callback, _responseContent, 0, apiUtil);
        } else {
            Log.connectionLog(3, `tenantAdmin-WEB_API updateUserStatus: `+
                `User update process failed. There is a possibility that the `+
                `user does not exist or internal processing has failed.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject, callback, _errContent, 0, apiUtil);
        }
    }
    const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.updateUserAccountStatus(_accessToken, _user, _status, _updateUserStatusCallback);
}

function updateUserStatusValidationCheck(_receiveObject) {
    const _content = utils.getChildObject(_receiveObject, 'content');
    if(!_content){
        return false;
    }
    const _user = utils.getChildObject(_content, 'user');
    const _status = utils.getChildObject(_content, 'status');

    if(validationCheck.userValidationCheck(_user, true) &&
        validationCheck.statusValidationCheck(_status, true)){
        return true;
    }
    return false;
}

function getUsers(receiveObject, callback, apiUtil) {

    let _errContent = {};
    if (!getUsersValidationCheck(receiveObject)) {
        Log.connectionLog(3, `tenantAdmin-WEB_API getUsers: ` +
            `the value entered has problem.`);
        _errContent = createErrorReasonResponse(receiveObject, API_STATUS.BAD_REQUEST);
        executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        return false;
    }
    const _accessToken = utils.getChildObject(receiveObject, 'accessToken');
    const _content = utils.getChildObject(receiveObject, 'content');

    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _tenantId = _sessionData.getTenantUuid();

    const _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
    const _except = _content.except.concat();
    _except.push(_adminAccount);

    const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.getUserListForAdmintool(_accessToken, _tenantId, _except,
        _content.start, _content.count, _getUserCallback);
    function _getUserCallback(ret){
        if (ret.content.result == true){
            executeCallback(receiveObject, callback, ret.content, 0, apiUtil);
        }else{
            Log.connectionLog(3, `tenantAdmin-WEB_API getUsers: `+
                `User get process failed. There is a possibility that the `+
                `internal processing has failed.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject, callback, _errContent, 0, apiUtil);
        }
    }
}

function getUsersValidationCheck(_receiveObject) {
    const _content = utils.getChildObject(_receiveObject, 'content');
    if(!_content){
        return false;
    }
    const _except = utils.getChildObject(_content, 'except');
    const _start = utils.getChildObject(_content, 'start');
    const _count = utils.getChildObject(_content, 'count');

    if(validationCheck.exceptValidationCheck(_except, true) &&
        validationCheck.startValidationCheck(_start, true) &&
        validationCheck.countValidationCheck(_count, true)){
        return true;
    }
    return false;
}

function getLicenseInfo(receiveObject, callback, apiUtil) {

    let _errContent = {};
    const _accessToken = utils.getChildObject(receiveObject, 'accessToken');

    const _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
    const _expect = [_adminAccount];

    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _tenantId = _sessionData.getTenantUuid();
    return UserAccountUtils.getUserListCountForAdmintool(_sessionData,
        _tenantId, _expect, false, _getUserCountCallback);

    function _getUserCountCallback(allCount) {
        if (allCount == null){
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
            return;
        }
        const _licenseManager = LicenseManager.getInstance();
        const _license = _licenseManager.getLicensedUserCount(_tenantId);

        if(_license.count == 0 || !_license){
            Log.connectionLog(3, `tenantAdmin-WEB_API getLicenseInfo: failed get license`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        }

        const _responseContent = {
            'result': true,
            'reason': 0,
            'licensedUserCount': _license.count,
            'registedUserCount': allCount,
            'remainedUserCount': _license.count - allCount
        };
        executeCallback(receiveObject, callback, _responseContent, 0, apiUtil);
    }
}

function createErrorReasonResponse(_req, _reason) {
    let _content = utils.getChildObject(_req, 'content');
    if (_content == null){
        _content = {
            result: false,
            reason: _reason
        };
    } else {
        _content.result = false;
        _content.reason = _reason;
    }
    return _content;
}

function executeCallback(req,  callback, content=null, errorCode, apiUtil) {
    const _id = req.id,
            _req = req.request,
            _token = req.accessToken,
            _version = req.version;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, content);
}
