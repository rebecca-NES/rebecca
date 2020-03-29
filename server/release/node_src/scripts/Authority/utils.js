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

function createContent(valueKey, value, _accessToken){
    var _content = {
        result: true,
        reason: 0,
        accessToken: _accessToken,
        [valueKey]: value
    };
    return(_content);
}

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

exports.API_ERR_RESPONSE_Not_Found = 404;
exports.API_ERR_RESPONSE_Service_Unavailable = 503;
