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

const AuthorityController = require('./controller');
const AUTHORITY_ACTIONS = require('./const').AUTHORITY_ACTIONS;

const SessionDataMannager = require('../session_data_manager');
const RequestData = require('../../model/request_data').RequestData;

const LOG = require('../server_log').getInstance();
const Const = require('../const');

function _checkParams(token) {

    if (! _.isString(token) || _.isEmpty(token)) {
        LOG.connectionLog(7, "authority_checker::_checkParams, ignore cos not logged in.");
        return false;
    }
    const _sessionData = SessionDataMannager.getInstance().get(token);
    if (_sessionData == null) {
        LOG.connectionLog(7, "authority_checker::_checkParams, ignore cos not logged in.");
        return false;
    }
    const _tenant_uuid = _sessionData.getTenantUuid();
    if (! _.isString(_tenant_uuid) || _.isEmpty(_tenant_uuid)) {
        LOG.connectionLog(7, "authority_checker::_checkParams, ignore cos no tenantUuid.");
        return false;
    }

    return true;
}

const CheckFacard = {
    [Const.API_REQUEST.API_GET_MESSAGE]: {
        [RequestData.GET_MESSAGE_TYPE_MY_FEED]: _addCheckingForViewFeed,
        [RequestData.GET_MESSAGE_TYPE_SEARCH]: _addCheckingForSearchingFeed,
        [RequestData.GET_MESSAGE_TYPE_THREAD]: _addCheckingForViewFeedItem,
        [RequestData.GET_MESSAGE_TYPE_SEARCH_ALL]: _addCheckingForSearchingAllMessage,
        [RequestData.GET_MESSAGE_TYPE_QUESTIONNAIRE]: _addCheckingForViewToQuestionnaire,
        [RequestData.GET_MESSAGE_TYPE_MURMUR]: _addCheckingForViewMurmur
    },
    [Const.API_REQUEST.API_SEND_MESSAGE]: {
        [RequestData.SEND_MESSAGE_TYPE_PUBLIC]: _addCheckingForSendToFeed,
        [RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT]: _addCheckingForSendToGroupchat,
        [RequestData.SEND_MESSAGE_TYPE_COMMUNITY]: _addCheckingForSendToCommunity,
        [RequestData.SEND_MESSAGE_TYPE_QUESTIONNAIRE]: _addCheckingForCreateQuestionnaire,
        [RequestData.SEND_MESSAGE_TYPE_MURMUR]: _addCheckingForSendToMurmur
    },
    [Const.API_REQUEST.API_UPDATE_MESSAGE]:{
        [RequestData.UPDATE_MESSAGE_TYPE_PUBLIC]: _addCheckingForSendToFeed,
        [RequestData.UPDATE_MESSAGE_TYPE_GROUP_CHAT]: _addCheckingForSendToGroupchat,
        [RequestData.UPDATE_MESSAGE_TYPE_COMMUNITY]: _addCheckingForSendToCommunity,
        [RequestData.UPDATE_MESSAGE_TYPE_QUESTIONNAIRE]: _addCheckingForUpdateToQuestionnaire,
        [RequestData.UPDATE_MESSAGE_TYPE_MURMUR]: _addCheckingForSendToMurmur
    },
    [Const.API_REQUEST.API_MESSAGE_OPTION]: {
        [RequestData.MESSAGE_OPTION_TYPE_ADD_GOOD_JOB]: _addCheckingForViewFeedItem,
        [RequestData.MESSAGE_OPTION_TYPE_ADD_EMOTION_POINT]: _addCheckingForViewFeedItem,
        [RequestData.MESSAGE_OPTION_TYPE_SET_READ_MESSAGE]: _addCheckingForViewFeedItem,
        [RequestData.MESSAGE_OPTION_TYPE_GET_EXISTING_READER_LIST]: _addCheckingForViewFeedItem,
        [RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_LIST]: _addCheckingForViewFeedItem,
        [RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_LIST]: _addCheckingForViewFeedItem,
    },
    [Const.API_REQUEST.API_UPDATE_THREAD_TITLE]:{
        [RequestData.SEND_MESSAGE_TYPE_PUBLIC]: _addCheckingForSendToFeed,
        [RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT]: _addCheckingForSendToGroupchat,
        [RequestData.SEND_MESSAGE_TYPE_COMMUNITY]: _addCheckingForSendToCommunity,
        [RequestData.SEND_MESSAGE_TYPE_MURMUR]: _addCheckingForSendToMurmur
    },
    [Const.API_REQUEST.API_GET_THREAD_TITLE_LIST]:{
        [RequestData.SEND_MESSAGE_TYPE_PUBLIC]: _addCheckingForViewFeed,
        [RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT]: _addCheckingForViewGroupchat,
        [RequestData.SEND_MESSAGE_TYPE_COMMUNITY]: _addCheckingForViewCommunity,
        [RequestData.GET_MESSAGE_TYPE_RECENT]: _addCheckingForViewRecent
    },
    [Const.API_REQUEST.API_CREATE_GROUP]: {
        [RequestData.CREATE_GROUP_TYPE_GROUP_CHAT_ROOM]: _addCheckingForCreateGroupchat,
        [RequestData.CREATE_GROUP_TYPE_COMMUNITY_ROOM]: _addCheckingForCreateCommunity
    },
    [Const.API_REQUEST.API_GET_GROUP]: {
        [RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_INFO]: _addCheckingForViewGroupchat,
        [RequestData.GET_GROUP_TYPE_COMMUNITY_INFO]: _addCheckingForViewCommunity,
        [RequestData.GET_GROUP_TYPE_COMMUNITY_MEMBER_INFO]: _addCheckingForViewCommunity
    },
    [Const.API_REQUEST.API_UPDATE_GROUP]: {
        [RequestData.UPDATE_GROUP_TYPE_GROUP_CHAT_ROOM_INFO]: _addCheckingForManageGroupchat,
        [RequestData.UPDATE_GROUP_TYPE_COMMUNITY_ROOM_INFO]: _addCheckingForManageCommunity,
    },
    [Const.API_REQUEST.API_ADD_MEMBER]: {
        [RequestData.ADD_MEMBER_TYPE_GROUP_CHAT_ROOM]: _addCheckingForManageGroupchat,
        [RequestData.ADD_MEMBER_TYPE_COMMUNITY_ROOM]: _addCheckingForManageCommunity
    },
    [Const.API_REQUEST.API_REMOVE_MEMBER]: {
        [RequestData.UPDATE_MEMBER_TYPE_COMMUNITY_OWNER]: _addCheckingForManageCommunity
    },
    [Const.API_REQUEST.API_UPDATE_MEMBER]: {
        [RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM]: _addCheckingForManageGroupchat,
        [RequestData.REMOVE_MEMBER_TYPE_COMMUNITY_ROOM]: _addCheckingForManageCommunity,
        [RequestData.UPDATE_MEMBER_TYPE_COMMUNITY_OWNER]: _addCheckingForManageCommunity
    },
    [Const.API_REQUEST.API_MURMUR]: {
        [RequestData.MURMUR_SET_COLUMN_NAME]: _addCheckingForSendToMurmur
    },
    [Const.API_REQUEST.API_ADMIN_DELETE_MESSAGE]: {
        [RequestData.DELETE_MESSAGE_TYPE_ADMIN_DELETE]: _addCheckingForAdminDeleteMessages,
    },
    [Const.API_REQUEST.API_POLICY_CREATE]: {
        all: _addCheckingForCreatePolicyOrRight
    },
    [Const.API_REQUEST.API_RIGHT_CREATE]: {
        all: _addCheckingForCreatePolicyOrRight
    },
    [Const.API_REQUEST.API_POLICY_ASSIGN_TO_USERS]: {
        all: _addCheckingForCreatePolicyOrRight
    },
    [Const.API_REQUEST.API_POLICIES_OF_USER_GET_BY_RESOURCE]: {
        all: _addCheckingForGetUserPoliciesByResource
    },
    [Const.API_REQUEST.API_POLICY_UNASSIGN_FROM_USERS]: {
        all: _addCheckingForUnassignPolicyFromUser
    }
};


function _checkFacard(request, type, content, params) {
    LOG.connectionLog(7, "do func AuthorityChecker._checkFacard(... request,type : " + request + ', '+ type);
    if (_.has(CheckFacard, request)) {
        if (_.has(CheckFacard[request], type)) {
            LOG.connectionLog(7, "AuthorityChecker._checkFacard(... type:"+type);
            CheckFacard[request][type](content, params);
        } else if (_.has(CheckFacard[request], 'all')) {
            LOG.connectionLog(7, "AuthorityChecker._checkFacard(... all");
            CheckFacard[request]['all'](content, params);
        }
    }
}

function _addCheckingForCreatePolicyOrRight(content, params) {
    let _policy_id = content.policy_id;
    if (_.isString(_policy_id) && _policy_id != '' &&
        _.has(params,"user_id") && params.user_id){
        const _roomtype = getRoomTypeInPolicyId(_policy_id);
        const _resouce = getResourceIdInPolicyId(_policy_id);
        switch (_roomtype) {
        case ROOMTYPE_COMMUNITY:
            params.pre_check = {
                func: _hasResourcePolicy,
                resource: _resouce,
                if_true_checkes: [{
                    action: AUTHORITY_ACTIONS.COMMUNITY_CREATE,
                    resource: null
                }],
                if_false_checkes: [{
                    action: AUTHORITY_ACTIONS.COMMUNITY_MANAGE,
                    resource: _resouce
                }]
            };
            break;
        case ROOMTYPE_GROUPCHAT:
            params.pre_check = {
                func: _hasResourcePolicy,
                resource: _resouce,
                if_true_checkes: [{
                    action: AUTHORITY_ACTIONS.GC_CREATE,
                    resource: null
                }],
                if_false_checkes: [{
                    action: AUTHORITY_ACTIONS.GC_MANAGE,
                    resource: _resouce
                }]
            };
            break;
        default:
            params.invalid = true;
            break;
        }
    }
    LOG.connectionLog(7, "authority_checker::_addCheckingForCreatePolicyOrRight");
}


function _addCheckingForGetUserPoliciesByResource(content, params) {
    const _resouce = content.resource_id;

    switch(getRoomTypeFromResourceId(_resouce)) {
    case ROOMTYPE_COMMUNITY:
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_VIEW, resource: _resouce});
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_SEND, resource: _resouce});
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_MANAGE, resource: _resouce});
        break;
    case ROOMTYPE_GROUPCHAT:
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_VIEW, resource: _resouce});
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_SEND, resource: _resouce});
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_MANAGE, resource: _resouce});
        break;
    default:
        params.invalid = true;
        break;
    }
    LOG.connectionLog(7, "authority_checker::_addCheckingForGetUserPoliciesByResource");
}

function _addCheckingForUnassignPolicyFromUser(content, params) {
    const _policy_id = content.policy_id;
    if (_.isString(_policy_id) && _policy_id != '' &&
        _.has(params,"user_id") && params.user_id){
        const _roomtype = getRoomTypeInPolicyId(_policy_id);
        const _resouce = getResourceIdInPolicyId(_policy_id);
        if(_roomtype == ROOMTYPE_COMMUNITY){
            params.checks.push( {
                action: AUTHORITY_ACTIONS.COMMUNITY_MANAGE,
                resource: _resouce
            });
        }else if( _roomtype == ROOMTYPE_GROUPCHAT){
            params.checks.push( {
                action: AUTHORITY_ACTIONS.GC_MANAGE,
                resource: _resouce
            });
            params.checks.push( {
                action: AUTHORITY_ACTIONS.GC_SEND,
                resource: _resouce
            });
            params.checks.push( {
                action: AUTHORITY_ACTIONS.GC_VIEW,
                resource: _resouce
            });
        } else {
            params.invalid = true;
        }
    }
    LOG.connectionLog(7, "authority_checker::_addCheckingForUnassignPolicyFromUser");
}

function _addCheckingForSendToFeed(content, params) {
    LOG.connectionLog(7, "do func AuthorityChecker._addCheckingForSendToFeed(...");
    params.checks.push( { action: AUTHORITY_ACTIONS.FEED_SEND, resource: null });
}

function _addCheckingForViewFeed(content, params) {
    params.checks.push( { action: AUTHORITY_ACTIONS.FEED_SEND, resource: null });
    params.checks.push( { action: AUTHORITY_ACTIONS.FEED_VIEW, resource: null });
    LOG.connectionLog(7, "authority_checker::_addCheckingForViewFeed");
}

function _addCheckingForAllMessage(content, params) {
    params.checks.push( { action: AUTHORITY_ACTIONS.SEARCH_ALL_MESSAGES, resource: null });
    LOG.connectionLog(7, "authority_checker::_addCheckingForAllMessage");
}

function _addCheckingForViewFeedItem(content, params) {
    if ('itemId' in content && content.itemId.startsWith('stream_')) {
        _addCheckingForViewFeed(content, params);
        LOG.connectionLog(7, "authority_checker::_addCheckingForViewFeedItem");
    }
}

function _checkItContainSearchFeedCondition(p) {
    let _p = p;
    if (_.isObject(_p) && _.has(_p, 'value')) {
        if (_.isArray(_p.value)) {
            for (let i = 0; i < _p.value.length; ++i) {
                if (_checkItContainSearchFeedCondition(_p.value[i])) {
                    return true;
                }
            }
        } else {
            if (! ('type' in _p ) || _p.type !== 'item') {
                return false;
            }
            if (! ('name' in _p ) || _p.name !== 'msgtype') {
                return false;
            }
            if (! ('value' in _p ) || _p.value != 1) {
                return false;
            }
            return true;
        }
    }
    return false;
}

function _checkItContainSearchMurmurCondition(p) {
    let _p = p;
    if (_.isObject(_p) && _.has(_p, 'value')) {
        if (_.isArray(_p.value)) {
            for (let i = 0; i < _p.value.length; ++i) {
                if (_checkItContainSearchMurmurCondition(_p.value[i])) {
                    return true;
                }
            }
        } else {
            if (! ('type' in _p ) || _p.type !== 'item') {
                return false;
            }
            if (! ('name' in _p ) || _p.name !== 'msgtype') {
                return false;
            }
            if (! ('value' in _p ) || _p.value != 11) {
                return false;
            }
            return true;
        }
    }
    return false;
}

function _checkItContainSearchBasicCondition(p) {
    let _p = p;
    if (!_.isObject(_p) || !_.has(_p, 'value')) {
        return false;
    }
    if (_.isArray(_p.value)) {
        for (let i = 0; i < _p.value.length; i++) {
            if (_checkItContainSearchBasicCondition(_p.value[i])) {
                return true;
            }
        }
    } else {
        if (! ('type' in _p ) || _p.type !== 'item') {
            return false;
        }
        if (! ('name' in _p ) || _p.name !== 'msgtype') {
            return false;
        }
        return true;
    }
    return false;
}

function _addCheckingForSearchingFeed(content, params) {
    if ('condition' in content && 'filter') {
        if (_checkItContainSearchFeedCondition(content.condition.filter)) {
            _addCheckingForViewFeed(content, params);
            params.on_bad = _onNoViewFeedRightThenRemoveValueFromSearchReq;
            LOG.connectionLog(7, "authority_checker::_addCheckingForSearchingFeed");
        }
        else if (_checkItContainSearchMurmurCondition(content.condition.filter)) {
            _addCheckingForViewMurmur(content, params);
            params.on_bad = _onNoViewMurmurRightThenRemoveValueFromSearchReq;
            LOG.connectionLog(7, "authority_checker::_addCheckingForSearchingFeed");
        }
    }
}

function _addCheckingForSearchingAllMessage(content, params) {
    if ( _.has(content,'condition') && _.has(content.condition,'filter')) {
        if (_checkItContainSearchBasicCondition(content.condition.filter)) {

            _addCheckingForAllMessage(content, params);
            LOG.connectionLog(7, "authority_checker::_addCheckingForSearchingAllMessage");
        }
    }
}


function _addCheckingForCreateGroupchat(content, params) {
    params.checks.push( { action: AUTHORITY_ACTIONS.GC_CREATE, resource: null });
    LOG.connectionLog(7, "authority_checker::_addCheckingForCreateGroupchat");
}

function _addCheckingForManageGroupchat(content, params) {
    if ('roomId' in content && typeof content.roomId == 'string' && content.roomId != '') {
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_MANAGE, resource: content.roomId });
        LOG.connectionLog(7, "authority_checker::_addCheckingForManageGroupchat");
    }
}

function _addCheckingForSendToGroupchat(content, params) {
    if ('roomId' in content && typeof content.roomId == 'string' && content.roomId != '') {
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_MANAGE, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_SEND, resource: content.roomId });
        LOG.connectionLog(7, "authority_checker::_addCheckingForSendToGroupchat");
    }
}

function _addCheckingForViewGroupchat(content, params) {
    if ('roomId' in content && typeof content.roomId == 'string' && content.roomId != '') {
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_MANAGE, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_SEND, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_VIEW, resource: content.roomId });
        LOG.connectionLog(7, "authority_checker::_addCheckingForViewGroupchat");
    }
}

function _addCheckingForCreateCommunity(content, params) {
    params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_CREATE, resource: null });
    LOG.connectionLog(7, "authority_checker::_addCheckingForCreateCommunity");
}

function _addCheckingForAdminDeleteMessages(content, params) {
    params.checks.push( { action: AUTHORITY_ACTIONS.ADMIN_DELETE, resource: null });
    LOG.connectionLog(7, "authority_checker::_addCheckingForAdminDeleteMessages");
}

function _addCheckingForManageCommunity(content, params) {
    if ('roomId' in content && typeof content.roomId == 'string' && content.roomId != '') {
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_MANAGE, resource: content.roomId });
        LOG.connectionLog(7, "authority_checker::_addCheckingForManageCommunity");
    }
}

function _addCheckingForSendToCommunity(content, params) {
    if ('roomId' in content && typeof content.roomId == 'string' && content.roomId != '') {
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_MANAGE, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_SEND, resource: content.roomId });
        LOG.connectionLog(7, "authority_checker::_addCheckingForSendToCommunity");
    }
}

function _addCheckingForViewCommunity(content, params) {
    if ('roomId' in content && typeof content.roomId == 'string' && content.roomId != '') {
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_MANAGE, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_SEND, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_VIEW, resource: content.roomId });
        LOG.connectionLog(7, "authority_checker::_addCheckingForViewCommunity");
    }
}

function _addCheckingForCreateQuestionnaire(content, params) {
    LOG.connectionLog(7, "do func AuthorityChecker._addCheckingForCreateQuestionnaire(...");
    if ('roomId' in content && typeof content.roomId == 'string' && content.roomId != '') {
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_MANAGE, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_SEND, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_MANAGE, resource: content.roomId });
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_SEND, resource: content.roomId });
    }else{
        params.checks.push( { action: AUTHORITY_ACTIONS.FEED_SEND, resource: null });
    }
}

function _addCheckingForUpdateToQuestionnaire(content, params) {
    LOG.connectionLog(7, "do func AuthorityChecker._addCheckingForUpdateToQuestionnaire(...");
    if ('msgto' in content && typeof content.msgto == 'string' && content.msgto != '') {
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_MANAGE, resource: content.msgto });
        params.checks.push( { action: AUTHORITY_ACTIONS.GC_SEND, resource: content.msgto });
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_MANAGE, resource: content.msgto });
        params.checks.push( { action: AUTHORITY_ACTIONS.COMMUNITY_SEND, resource: content.msgto });
    }else{
        params.checks.push( { action: AUTHORITY_ACTIONS.FEED_SEND, resource: null });
    }
}

function _addCheckingForViewMurmur(content, params) {
    LOG.connectionLog(7, "do func AuthorityChecker._addCheckingForViewMurmur(...");
    params.checks.push( { action: AUTHORITY_ACTIONS.MURMUR_SEND, resource: null });
    params.checks.push( { action: AUTHORITY_ACTIONS.MURMUR_VIEW, resource: null });
}

function _addCheckingForSendToMurmur(content, params) {
    LOG.connectionLog(7, "do func AuthorityChecker._addCheckingForSendToMurmur(...");
    params.checks.push( { action: AUTHORITY_ACTIONS.MURMUR_SEND, resource: null });
}

function _addCheckingForViewToQuestionnaire(content, params) {
    LOG.connectionLog(7, "do func AuthorityChecker._addCheckingForViewToQuestionnaire(...");
    params.checks.push( { action: AUTHORITY_ACTIONS.FEED_SEND, resource: null });
    params.checks.push( { action: AUTHORITY_ACTIONS.FEED_VIEW, resource: null });
    params.on_bad = (p) => {
        if(! content.condition){
            content.condition = {};
        }
        if(! content.condition.filter){
            content.condition.filter = {};
        }
        content.condition.filter = {
            "withoutfeed":true
        };
        return true;
    };
}

function _addCheckingForViewRecent(content, params) {
    LOG.connectionLog(7, "do func AuthorityChecker._addCheckingForViewRecent(...");
    params.checks.push( { action: AUTHORITY_ACTIONS.FEED_SEND, resource: null });
    params.checks.push( { action: AUTHORITY_ACTIONS.FEED_VIEW, resource: null });
    params.on_bad = (p) => {
        if(! content.condition){
            content.condition = {};
        }
        if(! content.condition.filter){
            content.condition.filter = {};
        }
        content.condition.filter = {
            "withoutfeed":true
        };
        return true;
    };
}

function _hasResourcePolicy(tenant_uuid, req, session, params, callback) {
    return new Promise((resolve, reject)=> {
        LOG.connectionLog(7, "authority_checker::_hasResourcePolicy");

        AuthorityController.getUserPoliciesByResource(tenant_uuid, session, params)
        .then(function(res) {
            if (res.users.length == 0) {
                params.checks = params.pre_check.if_true_checkes;
            } else {
                params.checks = params.pre_check.if_false_checkes;
            }
            process.nextTick(()=> {
                callback();
            });
        })
        .catch(function(errors) {
            LOG.connectionLog(4, "authority_checker::_hasResourcePolicy(), failed + " + JSON.stringify(errors));
            process.nextTick(function() {
                process.nextTick(()=> { callback(null); });
            });
        });
    });
}

function _removeContainedSearchFeedCondition(p) {
    LOG.connectionLog(7, "do func authority_checker::_removeContainedSearchFeedCondition");
    let _p = p;
    if (_.isObject(_p) && _.has(_p, 'value')) {
        if (_.isArray(_p.value)) {
            let _founds = [];
            for (let i = 0; i < _p.value.length; ++i) {
                if (_removeContainedSearchFeedCondition(_p.value[i])) {
                    _founds.push(i);
                }
            }
            for (let j = _founds.length; j > 0; --j) {
                _p.value.splice(_founds[j], 1);
            }
        } else {
            if (! ('type' in _p ) || _p.type !== 'item') {
                return false;
            }
            if (! ('name' in _p ) || _p.name !== 'msgtype') {
                return false;
            }
            if (! ('value' in _p ) || _p.value != 1) {
                return false;
            }
            return true;
        }
    }
    return false;
}

function _removeContainedSearchMurmurCondition(p) {
    LOG.connectionLog(7, "do func authority_checker::_removeContainedSearchMurmurCondition");
    let _p = p;
    if (_.isObject(_p) && _.has(_p, 'value')) {
        if (_.isArray(_p.value)) {
            let _founds = [];
            for (let i = 0; i < _p.value.length; ++i) {
                if (_removeContainedSearchMurmurCondition(_p.value[i])) {
                    _founds.push(i);
                }
            }
            for (let j = _founds.length; j > 0; --j) {
                _p.value.splice(_founds[j], 1);
            }
        } else {
            if (! ('type' in _p ) || _p.type !== 'item') {
                return false;
            }
            if (! ('name' in _p ) || _p.name !== 'msgtype') {
                return false;
            }
            if (! ('value' in _p ) || _p.value != 11) {
                return false;
            }
            return true;
        }
    }
    return false;
}

function _onNoViewFeedRightThenRemoveValueFromSearchReq(content) {
    if ('condition' in content && 'filter') {
        _removeContainedSearchFeedCondition(content.condition.filter);
        LOG.connectionLog(7, "authority_checker::_onNoViewFeedRightThenRemoveValueFromSearchReq: AFTER: " + JSON.stringify(content) );
    }
}

function _onNoViewMurmurRightThenRemoveValueFromSearchReq(content) {
    if ('condition' in content && 'filter') {
        _removeContainedSearchMurmurCondition(content.condition.filter);
        LOG.connectionLog(7, "authority_checker::_onNoViewMurmurRightThenRemoveValueFromSearchReq: AFTER: " + JSON.stringify(content) );
    }
}

function checkOnReceiveApi(req, callback) {
    LOG.connectionLog(7, "do func AuthorityChecker.checkOnReceiveApi(...");
    const _request = req.request,
            _content = req.content,
            _token = req.accessToken,
            _type = (_content? _content.type: null);

    if (! _checkParams(_token)) {
        callback();
        return;
    }
    const _sessionData = SessionDataMannager.getInstance().get(_token);
    const _tenant_uuid = _sessionData.getTenantUuid();

    const _params = {
        user_id: _sessionData.getLoginAccout(),
        pre_check: null,
        checks: [],
        invalid: false,
        action: null,
        resource: null,
        on_bad: null
    };

    _checkFacard(_request, _type, _content, _params);

    if (_params.pre_check != null) {
        _params.resource_id = _params.pre_check.resource;
        _params.pre_check.func(_tenant_uuid, req, _sessionData, _params, (err) => {
            if (!err) {
                runCheckUserHavePolicyAndCallback(_tenant_uuid, req, _sessionData, _params, callback);
            }
        });
    } else if (_params.checks.length > 0 || _params.invalid) {
        LOG.connectionLog(7, "authority_checker::checkOnReceiveApi, checking..");
        runCheckUserHavePolicyAndCallback(_tenant_uuid, req, _sessionData, _params, callback);
    } else {
        LOG.connectionLog(7, "authority_checker::checkOnReceiveApi, no need to check..");
        process.nextTick(function() {
            callback();
        });
    }

}

function checkOnMessage(sessionDataAry, items, callback) {
    LOG.connectionLog(7, "authority_checker::checkOnMessage");

    const _oneSessionData = sessionDataAry[0];
    const _tenant_uuid = _oneSessionData.getTenantUuid();

    let _promises = [];
    let _params = [];
    let _items = {};
    items.forEach(function(item) {
        if (item.itemId.startsWith('stream_')||
            (item.itemId.startsWith('questionnaire_') && item.roomType == 1)) {
            [AUTHORITY_ACTIONS.FEED_VIEW, AUTHORITY_ACTIONS.FEED_SEND].forEach(function(action) {
                _params.push({
                    user_id: _oneSessionData.getLoginAccout(),
                    action: action,
                    resource: null,
                    itemId: item.itemId
                });
                _items[item.itemId] = _items[item.itemId] || {have_policy: false};
                _promises.push(
                    AuthorityController.checkUserHavePolicy(_tenant_uuid, _oneSessionData, _params[_params.length -1])
                );
            });
        }else if (item.itemId.startsWith('murmur_')) {
            [AUTHORITY_ACTIONS.MURMUR_VIEW, AUTHORITY_ACTIONS.MURMUR_SEND].forEach(function(action) {
                _params.push({
                    user_id: _oneSessionData.getLoginAccout(),
                    action: action,
                    resource: null,
                    itemId: item.itemId
                });
                _items[item.itemId] = _items[item.itemId] || {have_policy: false};
                _promises.push(
                    AuthorityController.checkUserHavePolicy(_tenant_uuid, _oneSessionData, _params[_params.length -1])
                );
            });
        } else {
            _items[item.itemId] = _items[item.itemId] || {have_policy: true};
        }
    });

    if (_promises.length == 0) {
        LOG.connectionLog(7, "authority_checker::checkOnMessage(), no check.");
        process.nextTick(function() {
            callback(_items);
        });

    } else {
        LOG.connectionLog(7, "authority_checker::checkOnMessage(), checking..");
        Promise.all(_promises)
        .then(function(results) {
            for (let i = 0; i < results.length; ++i) {
                let _result = results[i];
                if (_result != null && 'enable_flag' in _result && _result.enable_flag == true) {
                    _items[_params[i].itemId].have_policy = true;
                    break;
                }
            }
            LOG.connectionLog(6, "authority_checker::checkOnMessage(), checked");
            process.nextTick(function() {
                callback(_items);
            });
        })
        .catch(function(errors) {
            LOG.connectionLog(4, "authority_checker::checkOnMessage(), failed + " + errors);
            process.nextTick(function() {
                callback(_items);
            });
        });
    }

}

function runCheckUserHavePolicyAndCallback(tenant_uuid, req, session, params, callback) {
    const _res = {
        accessToken: req.accessToken,
        request: req.request,
        id: req.id,
        version: req.version,
        errorCode: 0,
        content: {
            result: false,
            reason: Const.API_STATUS.FORBIDDEN
        }
    };
    LOG.connectionLog(7, "authority_checker::runCheckUserHavePolicyAndCallback");

    if (params.invalid == true) {
        process.nextTick(function() {
            callback(_res);
        });
        LOG.connectionLog(6, "authority_checker::runCheckUserHavePolicyAndCallback invalid request..");
        return;
    }

    var _promises = [];
    params.checks.forEach(function(check) {
        params.action = check.action;
        params.resource = check.resource;
        _promises.push(
            AuthorityController.checkUserHavePolicy(tenant_uuid, session, params)
        );
    });

    Promise.all(_promises)
    .then(function(results) {
        let havePolicy = false;
        for (let i = 0; i < results.length; ++i) {
            let _result = results[i];
            if (_result != null && 'enable_flag' in _result && _result.enable_flag == true) {
                havePolicy = true;
                break;
            }
        }
        if (havePolicy) {
            LOG.connectionLog(7, "authority_checker::runCheckUserHavePolicyAndCallback(), AUTHORIZED");
            return Promise.resolve(null);
        } else {
            if (_.isFunction(params.on_bad)) {
                params.on_bad(req.content);
                return Promise.resolve(null);
            }
            LOG.connectionLog(5, "authority_checker::runCheckUserHavePolicyAndCallback(), UNAUTHORIZED");
            return Promise.resolve(_res);
        }
    })
    .then(function(res) {
        process.nextTick(function() {
            callback(res);
        });
    })
    .catch(function(errors) {
        LOG.connectionLog(4, "authority_checker::runCheckUserHavePolicyAndCallback(), failed + " + JSON.stringify(errors));
        process.nextTick(function() {
            _res.content.reason = Const.API_STATUS.INTERNAL_SERVER_ERROR;
            callback(_res);
        });
    });
}


const ROOMTYPE_GROUPCHAT = 'Groupchat';
const ROOMTYPE_COMMUNITY = 'Community';

const _what_in_policy_id = {
    room_type: 2,
    resource_id: 3
};

const ROOMTYPE_GROUPCHAT_IN_RESOURCEID = 'room_';
const ROOMTYPE_COMMUNITY_IN_RESOURCEID = 'community_';

function getRoomTypeFromResourceId(resouceId) {
    if (! _.isString(resouceId) || resouceId == '') {
        return '';
    }
    if (resouceId.startsWith(ROOMTYPE_GROUPCHAT_IN_RESOURCEID)) {
        return ROOMTYPE_GROUPCHAT;
    } else if (resouceId.startsWith(ROOMTYPE_COMMUNITY_IN_RESOURCEID)) {
        return ROOMTYPE_COMMUNITY;
    }else{
        return '';
    }
}

const getRoomTypeInPolicyId = function(policyId) {
    return getInfoInPolicyId(policyId, _what_in_policy_id.room_type);
};

const getResourceIdInPolicyId = function(policyId) {
    return getInfoInPolicyId(policyId, _what_in_policy_id.resource_id);
};

function getInfoInPolicyId(policyId, what) {
    if (policyId == null || typeof policyId != 'string' || policyId == '') {
        return '';
    }
    var terms = policyId.split('_');
    if (terms.length < 4) {
        return '';
    }
    switch(what) {
    case _what_in_policy_id.room_type:
        if (_.has(terms,(what - 1)) && _.isString(terms[what - 1]) &&
            terms[what - 1].indexOf(ROOMTYPE_GROUPCHAT) > 0) {
            return ROOMTYPE_GROUPCHAT;
        } else if (terms[what - 1].indexOf(ROOMTYPE_COMMUNITY) > 0) {
            return ROOMTYPE_COMMUNITY;
        }else{
            return '';
        }
    case _what_in_policy_id.resource_id:
        return terms.slice(2).join('_');
    default:
        return '';
    }
}

exports.checkOnReceiveApi = checkOnReceiveApi;
exports.checkOnMessage = checkOnMessage;
exports.getInfoInPolicyId = getInfoInPolicyId;
