
/**
* createContent
*
* responseのjson内のcontentを作成するためのメソッド
* 処理成功時のみこのメソッドを用いてcontentを作成する。
* 失敗時は原因となるerrorCodeとrequestの際のcontentをそのまま返却する。
*
* @param {str} valueKey APIの実行結果dictのkey値
* @param {object} value APIの実行結果が格納されたdict
* @param {str} _accessToken
*
* @return {object} _content
*/
function createContent(valueKey, value, _accessToken){
    var _content = {
        result: true,
        reason: 0,
        accessToken: _accessToken,
        [valueKey]: value
    };
    return(_content);
}

/**
* createResponseStr
*
* response用リストの作成用メソッド
*
* @param {list} _receiveObject
* @param {list} _roles
* @param {int} _errorCode
* @param {int} _reason
*
* @param _response
*/
function createResponseStr(_receiveObject, _content, _errorCode=0, _reason=0){
    var _request = getChildObject(_receiveObject, 'request');
    var _id = getChildObject(_receiveObject, 'id');
    var _version = getChildObject(_receiveObject, 'version');
    var _response = {
        request : _request,
        id : _id,
        version : _version,
        errorCode : _errorCode,
        content: _content
    };
    return(JSON.stringify(_response));
}

/**
* getChildObject
*
* リストのkey値を取得するメソッド
*
* @param {list} obj
* @param {str} key
*
* @param _ret
*/
function getChildObject(obj, key) {
    if(obj == null || typeof obj != 'object') {
        return null;
    }
    if(key == null || typeof key != 'string' || key == '') {
        return null;
    }
    var _ret = obj[key];
    if(_ret == undefined) {
        return null;
    }
    return _ret;
}

exports.createResponseStr = createResponseStr;
exports.getChildObject = getChildObject;
exports.createContent = createContent;

// requestごとの振り分け
exports.API_GET_ROLES = 'GetRoles';
exports.API_GET_ROLE_ASSIGNMENT = 'GetRoleAssignmentForUser';
exports.API_ASSIGN_ROLE = 'AssignRoleToUser';
exports.API_RIGHT_GET = 'GetRights';
exports.API_POLICY_CREATE = 'CreatePolicy';
exports.API_RIGHT_CREATE = 'CreateRight';
exports.API_POLICY_ASSIGN_TO_USERS = 'AssignPolicyToUsers';
exports.API_POLICIES_OF_USER_GET_BY_RESOURCE = 'GetUserPoliciesByResource';
exports.API_POLICY_UNASSIGN_FROM_USERS = 'UnassignPolicyFromUser';
exports.API_POLICY_CHECK = 'CheckUserHavePolicy';
exports.API_DELETE_RIGHT_POLICY_RESOURCE = 'DeleteRightPolicyOfResource';

// API処理時のエラーコード定義
exports.API_ERR_RESPONSE_Not_Found = 404;
exports.API_ERR_RESPONSE_Service_Unavailable = 503;
