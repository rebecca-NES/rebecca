/**
 * 管理者用APIのIF定義
 * @module  src/scripts/controller/usermanagement/web_api
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

/**
 * recieve
 *
 * 管理系APIに関するAPIの受け口
 * accessTokenからユーザがテナント管理者かどうか
 * 判断した後、request先の処理に振り分ける
 *
 * @param {Object} socket - socket情報
 * @param {Object} _receiveObject - リクエスト情報
 * @param {function} processCallback - クライアントへの応答CallBack
 * @param {function} apiUtil - APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
exports.receive = (socket, _receiveObject, processCallback, apiUtil) => {

    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(utils.getChildObject(_receiveObject, 'accessToken'));
    const _fromJid = _sessionData.getJid();
    // エラー時に返却するjsonの作成
    let errorContent = {};
    // ログインユーザがテナント管理者であるかどうかの確認callback
    function _tenantAdminCallback(xmlIqElem){

        // 正常にデータが取得できていない場合
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
        // ログインユーザがテナント管理者である場合、リクエストの処理を実行
        const _authorityType = _typeElem.text();
        if (_authorityType == PersonData.AUTHORITY_TYPE_ADMIN) {
            // リクエストによって処理を振り分け
            // Invocation of method with 2 Values name may dispatch to unexpected target and cause an exception
            if (typeof requestMap[_receiveObject.request] === 'function') {
                requestMap[_receiveObject.request](_receiveObject, processCallback, apiUtil);
            }
        } else {
            Log.connectionLog(3, `tenantAdmin-WEB_API receive: ` +
                `login user is not tenant admin`);
            errorContent = createErrorReasonResponse(_receiveObject, API_STATUS.FORBIDDEN);
            executeCallback(_receiveObject,  processCallback, errorContent, 0, apiUtil);
        }
    }

    // requestごとに実行する処理の振り分け
    if (_.has(requestMap, _receiveObject.request)) {
        // ログインユーザがテナント管理者であるかどうかを確認
        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.getUserAuthority(utils.getChildObject(_receiveObject, 'accessToken'), _fromJid, _tenantAdminCallback);
    } else {
        errorContent = createErrorReasonResponse(_receiveObject, API_STATUS.BAD_REQUEST);
        executeCallback(_receiveObject,  processCallback, errorContent, 0, apiUtil);
        return false;
    }
    return true;
};

/**
 * ユーザ登録API
 *
 * @param {Object} receiveObject リクエスト時に受け付けたパラメータ
 * @param {Object} callback クライアントへの応答CallBack
 * @param {function} apiUtil APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
function createUser(receiveObject, callback, apiUtil) {

    // content内の入力値のバリデーションチェック
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

    // 登録ユーザデータ作成
    const _userInfoList = setCreateUserInfo(_content);

    // ライセンス情報確認
    // confファイルから取得するユーザに含めないOpenfireアカウント名（テナント管理者）の取得
    const _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
    const _expect = [_adminAccount];
    // sessionData及びtenantIdの取得
    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _tenantId = _sessionData.getTenantUuid();
    // ユーザ登録数の取得
    // 第3引数のbooleanは利用停止ユーザをユーザ数としてカウントするか否かを判断する
    return UserAccountUtils.getUserListCountForAdmintool(_sessionData,
        _tenantId, _expect, false, _getUserCountCallback);

    // ユーザ登録数取得callback
    function _getUserCountCallback(allCount) {
        // ライセンスの上限数の取得
        const _licenseManager = LicenseManager.getInstance();
        const _license = _licenseManager.getLicensedUserCount(_tenantId);

        // ライセンス数の取得に失敗した場合（0が返却された場合）
        if(_license.count == 0 || !_license){
            Log.connectionLog(3, `tenantAdmin-WEB_API createUser: failed get license`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        }

        // ライセンス数の上限に達していた場合
        if ((_license.count - allCount) < _userInfoList.length) {
            Log.connectionLog(3, `tenantAdmin-WEB_API createUser: ` +
                `User creation limit has been reached.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.BAD_REQUEST);
            executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        }else{
            // ユーザ登録処理実行
            const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
            _synchronousBridgeNodeXmpp.execBatchRegistration(_accessToken, _userInfoList, _createUserCallback);
        }
    }

    // ユーザ登録処理後のコールバック
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

/**
 * createUserにおけるリクエスト値のバリデーションチェック
 *
 * @param {object} _receiveObject リクエストパラメータ
 *
 * @return {boolean}
 */
function createValidationCheck(_receiveObject) {
    const _content = utils.getChildObject(_receiveObject, 'content');
    // contentが存在しない場合
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

/**
 * 作成するユーザ情報の作成
 *
 * @param {content} object リクエストのcontentの中身
 *
 * @return {object} _userInfoList 作成するユーザ情報
 */
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

/**
 * ユーザ更新API
 *
 * @param {Object} receiveObject リクエスト時に受け付けたパラメータ
 * @param {Object} callback クライアントへの応答CallBack
 * @param {function} apiUtil APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
function updateUser(receiveObject, callback, apiUtil) {
    const _accessToken = utils.getChildObject(receiveObject, 'accessToken');
    const _content = utils.getChildObject(receiveObject, 'content');
    let _errContent = {};
    // バリデーションチェック
    if (!updateValidationCheck(receiveObject)) {
        Log.connectionLog(3, `tenantAdmin-WEB_API updateUser: ` +
            `the value entered has problem.`);
        _errContent = createErrorReasonResponse(receiveObject, API_STATUS.BAD_REQUEST);
        executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
        return false;
    }

    // 更新するユーザ情報の格納
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

    // openfire上でuser_profileテーブルの情報を更新する処理のcallback
    function _updateUserCallback (result, reason, extras, count, items) {
        const _responseContent = {
            result,
            reason
        };
        if (count > 0) {
            _responseContent.result = items[0].result;
            _responseContent.reason = items[0].reason;
        }
        // 処理に成功した場合
        if (_responseContent.result){
            const _sessionDataMannager = SessionDataMannager.getInstance();
            const _sessionData = _sessionDataMannager.get(utils.getChildObject(receiveObject, 'accessToken'));
            const _tenantUuid = _sessionData.getTenantUuid();
            // メールアドレスの更新がある場合
            if(utils.getChildObject(_content, 'mailAddress')){
                // acount_storeのmailaddress情報を更新する
                UserAccountUtils.updateUserAccountMailAddress(_tenantUuid, utils.getChildObject(_content, 'user'),
                    _content.mailAddress, _onUpdateUserAccountMailAddress);
            }else{
                executeCallback(receiveObject, callback, _responseContent, 0, apiUtil);
            }
        } else {
            // 失敗した場合（5000000）
            // This string appears to be missing a space after 'updateUser:'.
            // This string appears to be missing a space after 'the'.
            Log.connectionLog(3, `tenantAdmin-WEB_API updateUser: ` + 
                `User update process failed. There is a possibility that the ` +
                `user does not exist or internal processing has failed.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject, callback, _errContent, 0, apiUtil);
        }
    }

    // acount_storeのmailaddress情報を更新する処理のcallback
    function _onUpdateUserAccountMailAddress(updateResult) {
        const _responseContent = {};
        if(updateResult == true) {
            _responseContent.result = true;
            _responseContent.reason = 0;
            executeCallback(receiveObject, callback, _responseContent, 0, apiUtil);
        } else {
            // 失敗した場合（5000000）
            Log.connectionLog(3, `tenantAdmin-WEB_API updateUser: `+
                `User update process failed. There is a possibility that the `+
                `user does not exist or internal processing has failed.`);
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject, callback, _errContent, 0, apiUtil);
        }
    }
    // openfire上でuser_profileテーブルの情報を更新する
    const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.execBatchUpdate(_accessToken, [_userInfo], _updateUserCallback);
}

/**
 * updateUserにおけるリクエスト値のバリデーションチェック
 *
 * @param {object} _receiveObject リクエストパラメータ
 *
 * @return {boolean}
 */
function updateValidationCheck(_receiveObject) {
    const _content = utils.getChildObject(_receiveObject, 'content');
    // contentが存在しない場合
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

/**
 * ユーザステータス更新API
 *
 * @param {Object} receiveObject リクエスト時に受け付けたパラメータ
 * @param {Object} callback クライアントへの応答CallBack
 * @param {function} apiUtil APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
function updateUserStatus(receiveObject, callback, apiUtil) {
    // バリデーションチェック
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
    // status更新処理callback
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
    // status更新処理の実行
    const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.updateUserAccountStatus(_accessToken, _user, _status, _updateUserStatusCallback);
}

/**
 * updateUserStatusにおけるリクエスト値のバリデーションチェック
 *
 * @param {object} _receiveObject リクエストパラメータ
 *
 * @return {boolean}
 */
function updateUserStatusValidationCheck(_receiveObject) {
    const _content = utils.getChildObject(_receiveObject, 'content');
    // contentが存在しない場合
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

/**
 * ユーザ一覧参照API
 *
 * @param {Object} receiveObject リクエスト時に受け付けたパラメータ
 * @param {Object} callback クライアントへの応答CallBack
 * @param {function} apiUtil APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
function getUsers(receiveObject, callback, apiUtil) {

    // バリデーションチェック
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

    // sessionData及びtenantIdの取得
    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _tenantId = _sessionData.getTenantUuid();

    // ライセンス情報確認
    // confファイルから取得するユーザに含めないOpenfireアカウント名（テナント管理者）の取得
    const _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
    const _except = _content.except.concat();
    _except.push(_adminAccount);

    // ユーザ一覧取得処理の実行
    const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.getUserListForAdmintool(_accessToken, _tenantId, _except,
        _content.start, _content.count, _getUserCallback);
    // ユーザ一覧取得処理後のcallback
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

/**
 * updateUserStatusにおけるリクエスト値のバリデーションチェック
 *
 * @param {object} _receiveObject リクエストパラメータ
 *
 * @return {boolean}
 */
function getUsersValidationCheck(_receiveObject) {
    const _content = utils.getChildObject(_receiveObject, 'content');
    // contentが存在しない場合
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

/**
 * ライセンス情報参照
 *
 * @param {Object} receiveObject リクエスト時に受け付けたパラメータ
 * @param {Object} callback クライアントへの応答CallBack
 * @param {function} apiUtil APIとしての返却時のUtil関数（Cubee_web_apiから抜粋）
 *
 * @return {boolean}
 */
function getLicenseInfo(receiveObject, callback, apiUtil) {

    let _errContent = {};
    const _accessToken = utils.getChildObject(receiveObject, 'accessToken');

    // ライセンス情報確認
    // confファイルから取得するユーザに含めないOpenfireアカウント名（テナント管理者）の取得
    const _adminAccount = _conf.getConfData('XMPP_SERVER_ADMIN_ACCOUNT');
    const _expect = [_adminAccount];
    // sessionData及びtenantIdの取得

    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _tenantId = _sessionData.getTenantUuid();
    // ユーザ登録数の取得
    // 第3引数のbooleanは利用停止ユーザをユーザ数としてカウントするか否かを判断する
    return UserAccountUtils.getUserListCountForAdmintool(_sessionData,
        _tenantId, _expect, false, _getUserCountCallback);

    // ユーザ登録数取得callback
    function _getUserCountCallback(allCount) {
        // allCount取得に失敗した場合
        if (allCount == null){
            _errContent = createErrorReasonResponse(receiveObject, API_STATUS.INTERNAL_SERVER_ERROR);
            executeCallback(receiveObject,  callback, _errContent, 0, apiUtil);
            return;
        }
        // ライセンスの上限数の取得
        const _licenseManager = LicenseManager.getInstance();
        const _license = _licenseManager.getLicensedUserCount(_tenantId);

        // ライセンス数の取得に失敗した場合（0が返却された場合）
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

/**
 * 異常終了時にcontent内へresult/reasonを追記する
 *
 * @param {object} _req リクエストオブジェクト
 * @param {string} _reason content.reasonへ格納するエラーコード
 *
 * @return {object} _content レスポンスオブジェクトへ格納するcontent
 */
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

/**
 * APIレスポンス作成の為のコールバック関数
 * cubee_web_api.js内で利用されているコールバックを返す
 *
 * @param {object} req リクエストオブジェクト
 * @param {function} calback 上位から渡されてきたコールバック関数
 * @param {object} content 返却するcontent
 * @param {errorCode} int errorCodeへ格納する値
 * @param {object} apiUtil cubee_web_apiで作成された使われるコールバック関数
 */
function executeCallback(req,  callback, content=null, errorCode, apiUtil) {
    const _id = req.id,
            _req = req.request,
            _token = req.accessToken,
            _version = req.version;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, content);
}
