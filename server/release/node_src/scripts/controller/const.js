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

const API_REQUEST = {
    API_LOGIN: 'Login',
    API_LOGOUT: 'Logout',
    API_GET_PERSON_LIST: 'GetPersonList',
    API_SET_LOGIN_PERSON_DATA: 'SetLoginPersonData',
    API_GET_PROFILE_LIST: 'GetUserProfile',
    API_GET_MESSAGE: 'GetMessage',
    API_SEND_MESSAGE: 'SendMessage',
    API_UPDATE_MESSAGE: 'UpdateMessage',
    API_DELETE_MESSAGE: 'DeleteMessage',
    API_MESSAGE_OPTION: 'MessageOption',
    API_UPDATE_THREAD_TITLE: 'UpdateThreadTitle',
    API_GET_THREAD_TITLE_LIST: 'GetThreadTitles',
    API_CREATE_GROUP: 'CreateGroup',
    API_GET_GROUP: 'GetGroup',
    API_ADD_MEMBER: 'AddMember',
    API_PUBLIC_GROUP: 'PublicGroup',
    API_PUBLIC_COMMUNITY: 'PublicCommunity',
    API_PUBLIC_GROUP_MEMBER: 'PublicGroupMember',
    API_PUBLIC_COMMUNITY_MEMBER: 'PublicCommunityMember',
    API_GET_SERVER_LIST: 'GetServerList',
    API_GET_SETTINGS: 'GetSettings',
    API_GET_LOGIN_PERSON_DATA: 'GetLoginPersonData',
    API_UPDATE_GROUP: 'UpdateGroup',
    API_GET_COUNT: 'GetCount',
    API_UPDATE_MEMBER: 'UpdateMember',
    API_REMOVE_MEMBER: 'RemoveMember',
    API_GET_ROLES: "GetRoles",
    API_GET_ROLE_ASSIGNMENT: "GetRoleAssignmentForUser",
    API_ASSIGN_ROLE: "AssignRoleToUser",
    API_RIGHT_GET: 'GetRights',
    API_POLICY_CREATE: 'CreatePolicy',
    API_RIGHT_CREATE: 'CreateRight',
    API_POLICY_ASSIGN_TO_USERS: 'AssignPolicyToUsers',
    API_POLICIES_OF_USER_GET_BY_RESOURCE: 'GetUserPoliciesByResource',
    API_POLICY_UNASSIGN_FROM_USERS: 'UnassignPolicyFromUser',
    API_POLICY_CHECK: 'CheckUserHavePolicy',
    API_DELETE_RIGHT_POLICY_RESOURCE: 'DeleteRightPolicyOfResource',
    API_CONTROLL_CONECTION: 'ControlConnection',
    API_ADMIN_LOGIN: 'AdminLogin',
    API_ADMIN_DELETE_MESSAGE: 'AdminDeleteMessage',
    API_REGISTER_USER: 'RegisterUser',
    API_USER_FOLLOW: 'UserFollow',
    API_MURMUR_RANKING: 'MurmurRanking',
    API_MURMUR: 'Murmur',
    ADMIN_API_CREATE_USER: 'CreateUser',
    ADMIN_API_UPDATE_USER: 'UpdateUser',
    ADMIN_API_UPDATE_USER_STATUS: 'UpdateUserStatus',
    ADMIN_API_GET_USERS: 'GetUsers',
    ADMIN_API_GET_LICENSE_INFO: 'GetLicenseInfo'
};

const API_NOTIFY = {
    API_NOTIFY_MESSAGE: 'Message',
    API_NOTIFY_NOTIFICATION: 'Notification',
    API_NOTIFY_CHANGE_PERSON_DATA: 'ChangePersonData',
    API_NOTIFY_MESSAGE_OPTION: 'MessageOption',
    API_NOTIFY_CREATE_GROUP: 'CreateGroup',
    API_NOTIFY_ADD_MEMBER: 'AddMember',
    API_NOTIFY_UPDATE_GROUP: 'UpdateGroup',
    API_NOTIFY_UPDATE_MEMBER: 'UpdateMember',
    API_NOTIFY_REMOVE_MEMBER: 'RemoveMember',
    API_NOTIFY_THREAD_TITLE: 'ThreadTitle',

    API_NOTIFY_DELETE_NOTE: 'DeleteNote',
    API_NOTIFY_UPDATE_NOTE_INFO: 'UpdateNoteInfo',

    API_NOTIFY_GET_HASHTAG_RANKING: 'GetHashtagRanking',

    API_NOTIFY_MURMUR: 'Murmur'
};

const API_STATUS = {
    SUCCESS: 200000,
    BAD_REQUEST: 400000,
    UNAUTHORIZED: 401000,
    FORBIDDEN: 403000,
    NOT_FOUND: 404000,
    INTERNAL_SERVER_ERROR: 500000,
};

exports.API_REQUEST = API_REQUEST;
exports.API_NOTIFY = API_NOTIFY;
exports.API_STATUS = API_STATUS;
