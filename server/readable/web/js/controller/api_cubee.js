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
function ApiCubee() {

};

(function() {
    ApiCubee.API_LOGIN = 'Login';
    ApiCubee.API_LOGOUT = 'Logout';
    ApiCubee.API_CONTROL_CONNECTION = 'ControlConnection';
    ApiCubee.API_GET_PERSON_LIST = 'GetPersonList';
    ApiCubee.API_SET_LOGIN_PERSON_DATA = 'SetLoginPersonData';
    ApiCubee.API_GET_LOGIN_PERSON_DATA = 'GetLoginPersonData';
    ApiCubee.API_GET_USER_PROFILE = 'GetUserProfile';
    ApiCubee.API_GET_MESSAGE = 'GetMessage';
    ApiCubee.API_SEND_MESSAGE = 'SendMessage';
    ApiCubee.API_UPDATE_MESSAGE = 'UpdateMessage';
    ApiCubee.API_DELETE_MESSAGE = 'DeleteMessage';
    ApiCubee.API_MESSAGE_OPTION = 'MessageOption';
    ApiCubee.API_GET_COUNT = 'GetCount';
    ApiCubee.API_MURMUR = 'Murmur';

    ApiCubee.API_CHANGE_PERSON_DATA = 'ChangePersonData';
    ApiCubee.API_NOTIFICATION = 'Notification';
    ApiCubee.API_MESSAGE = 'Message';
    ApiCubee.API_CREATE_GROUP = 'CreateGroup';
    ApiCubee.API_GET_GROUP = 'GetGroup';
    ApiCubee.API_ADD_MEMBER = 'AddMember';
    ApiCubee.API_UPDATE_MEMBER = 'UpdateMember';
    ApiCubee.API_REMOVE_MEMBER = 'RemoveMember';
    ApiCubee.API_GET_SERVER_LIST = 'GetServerList';
    ApiCubee.API_UPDATE_GROUP = 'UpdateGroup';
    ApiCubee.API_THREAD_TITLE = 'ThreadTitle';
    ApiCubee.API_UPDATE_NOTE = 'UpdateNoteInfo';
    ApiCubee.API_DELETE_NOTE = 'DeleteNote';

    ApiCubee.API_GET_RIGHTS = 'GetRights';
    ApiCubee.API_GET_ROLE_ASSIGNMENT_FOR_USER = 'GetRoleAssignmentForUser';
    ApiCubee.API_CREATE_POLICY = 'CreatePolicy';
    ApiCubee.API_CREATE_RIGHTS = 'CreateRight';
    ApiCubee.API_ASSIGN_POLISY_TO_USER = 'AssignPolicyToUsers';
    ApiCubee.API_GET_USER_POLICIES_BY_RESOURCE = 'GetUserPoliciesByResource';
    ApiCubee.API_UNASSIGN_POLICY_FROM_USER = 'UnassignPolicyFromUser';

    ApiCubee.API_AUTHORIY_CHANGED = 'AuthorityDataChanged';

    ApiCubee.API_UPDATE_THREAD_TITLE = 'UpdateThreadTitle';
    ApiCubee.API_GET_THREAD_TITLE_LIST = 'GetThreadTitles';

    ApiCubee.API_PUBLIC_GROUP_MEMBER = 'PublicGroupMember';
    ApiCubee.API_PUBLIC_GROUP = 'PublicGroup';

    ApiCubee.API_PUBLIC_COMMUNITY_MEMBER = 'PublicCommunityMember';
    ApiCubee.API_PUBLIC_COMMUNITY = 'PublicCommunity';
    ApiCubee.API_USER_FOLLOW = 'UserFollow';

    ApiCubee.CONTENT_TYPE_FOLLOWER_LIST = 'FollowerList';
    ApiCubee.CONTENT_TYPE_FOLLOWEE_LIST = 'FolloweeList';
    ApiCubee.CONTENT_TYPE_CONTACT_LIST = 'ContactList';
    ApiCubee.CONTENT_TYPE_PRESENCE = 'Presence';
    ApiCubee.CONTENT_TYPE_MY_FEED = 'MyFeed';
    ApiCubee.CONTENT_TYPE_CHAT = 'Chat';
    ApiCubee.CONTENT_TYPE_PUBLIC = 'Public';
    ApiCubee.CONTENT_TYPE_TASK = 'Task';
    ApiCubee.CONTENT_TYPE_QUESTIONNAIRE = 'Questionnaire';
    ApiCubee.CONTENT_TYPE_ADD_GOOD_JOB = 'AddGoodJob';
    ApiCubee.CONTENT_TYPE_UPDATE_SIBLING_TASK = 'UpdateSiblingTask';
    ApiCubee.CONTENT_TYPE_SYSTEM = 'System';
    ApiCubee.CONTENT_TYPE_PROFILE = 'Profile';
    ApiCubee.CONTENT_TYPE_PASSWORD = 'Password';
    ApiCubee.CONTENT_TYPE_SEARCH = 'Search';
    ApiCubee.CONTENT_TYPE_DELETE = 'Delete';
    ApiCubee.CONTENT_TYPE_GROUP_CHAT = 'GroupChat';
    ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM = 'GroupChatRoom';
    ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM_LIST = 'GroupChatRoomList';
    ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM_INFO = 'GroupChatRoomInfo';
    ApiCubee.CONTENT_TYPE_MAIL_SERVER = 'MailServer';
    ApiCubee.CONTENT_TYPE_MAIL_COOPERATION_SETTING = 'MailCooperationSetting';
    ApiCubee.CONTENT_TYPE_MAIL = 'Mail';
    ApiCubee.CONTENT_TYPE_MAIL_BODY = 'MailBody';
    ApiCubee.CONTENT_TYPE_THREAD = 'Thread';
    ApiCubee.CONTENT_TYPE_SWITCH_PROTOCOL = 'SwitchProtocol';
    ApiCubee.CONTENT_TYPE_DEMAND_TASK = 'DemandTask';
    ApiCubee.CONTENT_TYPE_CLEAR_DEMANDED_TASK = 'ClearDemandedTask';
    ApiCubee.CONTENT_TYPE_GET_EXISTING_READER_LIST = 'GetExistingReaderList';
    ApiCubee.CONTENT_TYPE_SET_READ_MESSAGE = 'SetReadMessage';
    ApiCubee.CONTENT_TYPE_MESSAGE = 'Message';
    ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM = 'CommunityRoom';
    ApiCubee.CONTENT_TYPE_MY_COMMUNITY_LIST = 'MyCommunityList';
    ApiCubee.CONTENT_TYPE_COMMUNITY_INFO = 'CommunityInfo';
    ApiCubee.CONTENT_TYPE_COMMUNITY_MEMBER_INFO = 'CommunityMemberInfo';
    ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM_INFO = 'CommunityRoomInfo';
    ApiCubee.CONTENT_TYPE_COMMUNITY_OWNER = 'CommunityOwner';
    ApiCubee.CONTENT_TYPE_COMMUNITY = 'Community';
    ApiCubee.CONTENT_TYPE_PERSON_INFO = 'PersonInfo';
    ApiCubee.CONTENT_TYPE_ADD_EMOTIONPOINT = 'AddEmotionPoint';
    ApiCubee.CONTENT_TYPE_MURMUR = 'Murmur';
    ApiCubee.CONTENT_TYPE_GET_MURMUR_TOTAL = 'MurmurTotal';
    ApiCubee.CONTENT_TYPE_MURMUR_RANKING = 'MurmurRanking';

    ApiCubee.CONTENT_TYPE_GET_GOODJOB_TOTAL = 'GetGoodJobTotal';
    ApiCubee.CONTENT_TYPE_GET_GOODJOB_TOTAL_RANKING = 'GetGoodJobRanking';
    ApiCubee.CONTENT_TYPE_GET_THANKS_POINT_TOTAL = 'GetThanksPointsTotal';
    ApiCubee.CONTENT_TYPE_GET_THANKS_POINT_RANKING = 'GetThanksPointsRanking';

    ApiCubee.CONTENT_TYPE_GET_HASHTAG_RANKING = 'GetHashtagRanking';

    ApiCubee.CONTENT_TYPE_GET_MURMUR_COLUMN_NAME = 'GetColumnName';
    ApiCubee.CONTENT_TYPE_SET_MURMUR_COLUMN_NAME = 'SetColumnName';

    ApiCubee.EXTRAS_SUBTYPE_CHANGE_ROOM_NAME = 'ChangeRoomName';
    ApiCubee.EXTRAS_SUBTYPE_CHANGE_ROOM_IMAGE = 'ChangeImage';
    ApiCubee.EXTRAS_SUBTYPE_CHANGE_ROOM_PRIVACY_TYPE = 'ChangePrivacyType';

    ApiCubee.CONTENT_SUBTYPE_ALL_USERS = 'AllUsers';

    ApiCubee.CONTENT_EXTRAS_LOGGED = 'Logged';
    ApiCubee.CONTENT_TYPE_KEYWORD = 'keyword';
    ApiCubee.CONTENT_SORT_ITEM_LOGIN_ACCOUNT = 'login_account';

    ApiCubee.CONTENT_ROOM_MEMBER_JOINING = 'Joining';
    ApiCubee.CONTENT_ROOM_MEMBER_WITHDRAW = 'Withdraw';
    ApiCubee.CONTENT_GET_MURMUR_TOTAL_LIST = 'getList';
    ApiCubee.CONTENT_GET_MURMUR_RANKING_LIST = 'getList';
    ApiCubee.CONTENT_GET_PUBLIC_COMM_ROOM_LIST = 'getRoomList';
    ApiCubee.CONTENT_GET_PUBLIC_GC_ROOM_LIST = 'getRoomList';
    ApiCubee.CONTENT_TYPE_GET_FOLLOWEE_LIST = 'getFolloweeList';
    ApiCubee.CONTENT_TYPE_GET_FOLLOWER_LIST = 'getFollowerList';
    ApiCubee.CONTENT_TYPE_GET_FOLLOW_INFO = 'getFollowInfo';
    ApiCubee.CONTENT_TYPE_ADD_USER_FOLLOW = 'addUserFollow';
    ApiCubee.CONTENT_TYPE_DEL_USER_FOLLOW = 'delUserFollow';

    ApiCubee.createLoginRequest = function(tenant, user, password) {
        var _api = ApiCubee.API_LOGIN;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            request : _api,
            id : _id,
            version : 1,
            content : {
                user : user,
                password : password,
                tenantName : tenant
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createLogoutRequest = function(accessToken) {
        var _api = ApiCubee.API_LOGOUT;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetContactListRequest = function(accessToken) {
        var _api = ApiCubee.API_GET_PERSON_LIST;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_CONTACT_LIST
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetServerListRequest = function(accessToken) {
        var _api = ApiCubee.API_GET_SERVER_LIST;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_MAIL_SERVER
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetMailBodyRequest = function(accessToken, itemId) {
        var _api = ApiCubee.API_GET_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_MAIL_BODY,
                itemId : itemId
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createChangePresenceRequest = function(accessToken, presence, myMemo) {
        var _api = ApiCubee.API_SET_LOGIN_PERSON_DATA;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _myMemo = encodeURIComponent(myMemo);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_PRESENCE,
                presence : presence,
                myMemo : _myMemo
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createChangeMailCooperationSettingRequest = function(accessToken, mailCooperationInfoList) {
        var _api = ApiCubee.API_SET_LOGIN_PERSON_DATA;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_MAIL_COOPERATION_SETTING,
                count : mailCooperationInfoList.getCount(),
                items : []
            }
        };
        _getMailCooperationContent(_request.content.items, mailCooperationInfoList);
        return [JSON.stringify(_request), _id];
    };
    function _getMailCooperationContent(items, cooperationList) {
        for (var _i = 0; _i < cooperationList.getCount(); _i++) {
            var _cooperationInfo = cooperationList.get(_i);
            var _item = {
                id : _cooperationInfo.getId(),
                jid : _cooperationInfo.getJid(),
                branchNumber : _cooperationInfo.getBranchNumber(),
                mailAddress : _cooperationInfo.getMailAddress(),
                serverId : _cooperationInfo.getServerId(),
                settingInfo : _getSettingInfoContent(_cooperationInfo.getSettingInfo()),
                mailCooperationType : _cooperationInfo.getCooperationType()
            };
            items[_i] = _item;
        }
    };
    function _getSettingInfoContent(accountInfo) {
        var _type = accountInfo.getType();
        var _settingInfo = {};
        switch(_type) {
            case AccountSettingInfomation.SERVER_TYPE_POP:
                _settingInfo = {
                    popServer : {
                        mailAccount : accountInfo.getAccount(),
                        mailPassword : accountInfo.getPassword()
                    }
                };
                break;
            default:
                break;
        }
        return _settingInfo;
    }

    ApiCubee.createGetPublicMessageRequest = function(accessToken, startId, count) {
        var _api = ApiCubee.API_GET_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_MY_FEED,
                condition : {},
                startId : startId,
                count : count
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createSendChatMessageRequest = function(accessToken, chatMessage) {
        var _api = ApiCubee.API_SEND_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _escapedBody = encodeURIComponent(chatMessage.getMessage());
        var _escapedMessageTitleBody = encodeURIComponent(chatMessage.getThreadTitle());
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_CHAT,
                to : chatMessage.getTo(),
                body : _escapedBody,
                replyId : chatMessage.getReplyItemId(),
                replyTo : chatMessage.getReplyTo(),
                attachedCount : 0,
                attachedItems : [],
                context : '',
                threadTitle: _escapedMessageTitleBody
            }
        };
        if(chatMessage.getBodyType() != null){
            _request.content["bodyType"] = parseInt(chatMessage.getBodyType());
        }
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetChatMessageRequest = function(accessToken, partner, startId, count) {
        var _api = ApiCubee.API_GET_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_CHAT,
                condition : {
                    partner : partner
                },
                startId : startId,
                count : count
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetQuestionnaireMessagesRequest = function(accessToken, startId, count, sort) {
        var _api = ApiCubee.API_GET_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_QUESTIONNAIRE,
                startId: startId,
                condition : {
                    sort : sort
                },
                count: count
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createSendVoteMessageRequest = function(accessToken, msgto, itemId, optionItems) {
        var _api = ApiCubee.API_UPDATE_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_QUESTIONNAIRE,
                msgto : msgto,
                itemId : itemId,
                optionCount : optionItems.getCount(),
                optionItems : optionItems._array
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createSendPublicMessageRequest = function(accessToken, publicMessage) {
        var _api = ApiCubee.API_SEND_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _escapedMessageBody = encodeURIComponent(publicMessage.getMessage());
        var _escapedMessageTitleBody = encodeURIComponent(publicMessage.getThreadTitle());
        var _replyId = '';
        if (publicMessage.getReplyItemId() != null) {
            _replyId = publicMessage.getReplyItemId();
        }
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_PUBLIC,
                body : _escapedMessageBody,
                replyId : _replyId,
                attachedCount : 0,
                attachedItems : [],
                context : '',
                threadTitle: _escapedMessageTitleBody
            }
        };
        if(publicMessage.getBodyType() != null){
            _request.content["bodyType"] = parseInt(publicMessage.getBodyType());
        }
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetTaskListRequest = function(accessToken, filter, sort, startId, count) {
        var _api = ApiCubee.API_GET_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_TASK,
                condition : {
                    filter : filter,
                    sort : sort
                },
                startId : startId,
                count : count
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createSendQuestionnaireRequest = function(accessToken, questionnaireMessage) {
        var _api = ApiCubee.API_SEND_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : _getSendUpdateQuestionnaireCommonContent(questionnaireMessage)
        };
        return [JSON.stringify(_request), _id];
    };

    function _getSendUpdateQuestionnaireCommonContent(questionnaireMessage) {
        var _startDateString = questionnaireMessage.getStartDate();
        var _dueDateString = questionnaireMessage.getDueDate();
        var _itemArray = new ArrayList();
        var _optionItems = questionnaireMessage.getOptionItems();

        var _content = {
            type : ApiCubee.CONTENT_TYPE_QUESTIONNAIRE,
            body : encodeURIComponent(questionnaireMessage.getMessage()),
            inputType : questionnaireMessage.getInputType(),
            resultVisible : questionnaireMessage.getResultVisible(),
            graphType : questionnaireMessage.getGraphType(),
            roomType : questionnaireMessage.getRoomType(),
            roomId : questionnaireMessage.getRoomId(),
            optionCount : questionnaireMessage.getOptionCount(),
            optionItems : [],
            startDate : _startDateString,
            dueDate : _dueDateString,
            attachedCount : 0,
            attachedItems : [],
            context : ''
        };

        for (var i =0; i < questionnaireMessage.getOptionItems()._length; i++) {
            var item = _optionItems.get(i);
            _content.optionItems.add({option:encodeURIComponent(item)})
        }
        if (_content.roomType && typeof _content.roomType != "number") {
            _content.roomType = parseInt(_content.roomType);
        }

        return _content;
    };

    ApiCubee.createSendTaskRequest = function(accessToken, taskMessage) {
        var _api = ApiCubee.API_SEND_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : _getSendUpdateTaskCommonContent(taskMessage)
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createUpdateTaskRequest = function(accessToken, taskMessage) {
        var _api = ApiCubee.API_UPDATE_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : _getSendUpdateTaskCommonContent(taskMessage)
        };
        _request.content.itemId = taskMessage.getItemId();
        return [JSON.stringify(_request), _id];
    };

    function _getSendUpdateTaskCommonContent(taskMessage) {
        var _startDateObject = taskMessage.getStartDate();
        var _startDateString = '';
        if (_startDateObject != null) {
            _startDateString = _startDateObject.format(Utils.STANDARD_DATE_FORMAT);
        }
        var _dueDateObject = taskMessage.getDueDate();
        var _dueDateString = '';
        if (_dueDateObject != null) {
            _dueDateString = _dueDateObject.format(Utils.STANDARD_DATE_FORMAT);
        }
        var _content = {
            type : ApiCubee.CONTENT_TYPE_TASK,
            title : encodeURIComponent(taskMessage.getTitle()),
            body : encodeURIComponent(taskMessage.getMessage()),
            progress : taskMessage.getProgress(),
            spentTime : taskMessage.getSpentTime(),
            estimatedTime : taskMessage.getEstimatedTime(),
            remainingTime : taskMessage.getRemainingTime(),
            goal : encodeURIComponent(taskMessage.getGoal()),
            alert : taskMessage.getAlert(),
            parentItemId : taskMessage.getParentItemId(),
            priority : taskMessage.getPriority(),
            replyId : taskMessage.getReferenceMessageItemId(),
            replyTo : taskMessage.getReplyTo(),
            startDate : _startDateString,
            dueDate : _dueDateString,
            owner : taskMessage.getOwnerJid(),
            group : taskMessage.getCommunityId(),
            client : taskMessage.getClient(),
            status : taskMessage.getStatus(),
            attachedCount : 0,
            attachedItems : [],
            context : ''
        };
        if (taskMessage.getQuotationItem() != '' && _content.status == 1) {
            _content["shareItemId"] = taskMessage.getReferenceMessageItemId();
        }
        return _content;
    };

    ApiCubee.createSendGoodJobRequest = function(accessToken, itemId) {
        var _api = ApiCubee.API_MESSAGE_OPTION;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_ADD_GOOD_JOB,
                itemId : itemId
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createChangeProfileRequest = function(accessToken, profile) {
        var _api = ApiCubee.API_SET_LOGIN_PERSON_DATA;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _escapedNickName = encodeURIComponent(profile.getNickName());
        var _escapedMailAddress = encodeURIComponent(profile.getMailAddress());
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_PROFILE,
                nickName : _escapedNickName,
                mailAddress : _escapedMailAddress,
                avatarType : profile.getAvatarType(),
                avatarData : profile.getAvatarData(),
                group : profile.getGroup()
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createChangeProfileOnlyAvaterRequest = function(accessToken, profile) {
        var _api = ApiCubee.API_SET_LOGIN_PERSON_DATA;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_PROFILE,
                avatarType : profile.getAvatarType(),
                avatarData : profile.getAvatarData()
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createChangeLoggedRequest = function(accessToken, _userInfo) {
        var _api = ApiCubee.API_SET_LOGIN_PERSON_DATA;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_PROFILE,
                avatarType : _userInfo.avatarType,
                avatarData : _userInfo.avatarData,
                "extras":"{\"Logged\":1}"
            }
        };

        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createChangeExtrasRequest = function(accessToken, extras) {
        var _api = ApiCubee.API_SET_LOGIN_PERSON_DATA;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_PROFILE,
                avatarType : LoginUser.getInstance().getAvatarType(),
                avatarData : LoginUser.getInstance().getAvatarData(),
                "extras": extras
            }
        };

        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetUserGroupRequest = function(accessToken, _accountName, startId, count) {
        var _api = ApiCubee.API_GET_PERSON_LIST;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _escapedAccountName = encodeURIComponent(_accountName);

        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_SEARCH,
                subType : ApiCubee.CONTENT_SUBTYPE_ALL_USERS,
                condition : {
                    filter : {
                        type : ApiCubee.CONTENT_TYPE_KEYWORD,
                        value : _escapedAccountName
                    },
                    sort : {
                        item : ApiCubee.CONTENT_SORT_ITEM_LOGIN_ACCOUNT,
                        order : 1
                    }
                },
                startId : startId,
                count : count
            }
        };
        return [JSON.stringify(_request), _id];
    };


    ApiCubee.createChangePasswordRequest = function(accessToken, oldPassword, newPassword) {
        var _api = ApiCubee.API_SET_LOGIN_PERSON_DATA;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_PASSWORD,
                oldPassword : oldPassword,
                newPassword : newPassword
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createSearchMessageRequest = function(accessToken, startId, count, columnSearchCondition) {
        var _api = ApiCubee.API_GET_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _filter = columnSearchCondition.getFilterCondition();
        var _sort = columnSearchCondition.getSortCondition();
        var _condition = {};
        _condition.filter = convertFilterConditionDataToURIEncode(_filter.getJSONObject());
        _condition.sort = _sort.getJSONObject();
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_SEARCH,
                condition : _condition,
                startId : startId,
                count : count
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createDeleteMessageRequest = function(accessToken, deleteFlag, deleteMessage) {
        var _api = ApiCubee.API_DELETE_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_DELETE,
                itemId : deleteMessage.getItemId(),
                deleteFlag : deleteFlag
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetRoomInfoRequest = function(accessToken, roomId) {
        var _api = ApiCubee.API_GET_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM_INFO,
                roomId : roomId
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetRoomInfoListRequest = function(accessToken, startId, count, parentRoomId, sortCondition) {
        var _api = ApiCubee.API_GET_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        _condition.sort = sortCondition.getJSONObject();
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM_LIST,
                startId : startId,
                count : count,
                condition : _condition
            }
        };
        parentRoomId ? _request.content.parentRoomId = parentRoomId : "";
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetPublicGroupRoomInfoListRequest = function(accessToken, startId, count, sortCondition) {
        var _api = ApiCubee.API_PUBLIC_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        _condition.sort = sortCondition.getJSONObject();
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_GET_PUBLIC_GC_ROOM_LIST,
                startId : startId,
                count : count,
                condition : _condition
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createAddPublicGroupMemberRequest = function(accessToken, roomId) {
        var _api = ApiCubee.API_PUBLIC_GROUP_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_ROOM_MEMBER_JOINING,
                roomId : roomId
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createDelPublicGroupMemberRequest = function(accessToken, roomId) {
        var _api = ApiCubee.API_PUBLIC_GROUP_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_ROOM_MEMBER_WITHDRAW,
                roomId : roomId
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createGetPublicCommunityRoomInfoListRequest = function(accessToken, startId, count, sortCondition) {
        var _api = ApiCubee.API_PUBLIC_COMMUNITY;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        _condition.sort = sortCondition.getJSONObject();
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_GET_PUBLIC_COMM_ROOM_LIST,
                startId : startId,
                count : count,
                condition : _condition
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createAddPublicCommunityMemberRequest = function(accessToken, roomId) {
        var _api = ApiCubee.API_PUBLIC_COMMUNITY_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_ROOM_MEMBER_JOINING,
                roomId : roomId
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createDelPublicCommunityMemberRequest = function(accessToken, roomId) {
        var _api = ApiCubee.API_PUBLIC_COMMUNITY_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_ROOM_MEMBER_WITHDRAW,
                roomId : roomId
            }
        };
        return [JSON.stringify(_request), _id];
    };


    ApiCubee.createCreateChatRoomRequest = function(accessToken, chatroomInfo) {
        var _api = ApiCubee.API_CREATE_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var authorityArray = _getAddMemberAuthority(chatroomInfo);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM,
                roomName : encodeURIComponent(chatroomInfo.getRoomName()),
                parentRoomId : encodeURIComponent(chatroomInfo.getParentRoomId()),
                memberCount : chatroomInfo.getMemberList().getCount(),
                memberItems : [],
                manageGroupchat : authorityArray[AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE],
                sendMessageToGroupchat: authorityArray[AuthorityDef.AUTHORITY_ACTIONS.GC_SEND],
                viewMessageInGroupchat : authorityArray[AuthorityDef.AUTHORITY_ACTIONS.GC_VIEW]
            }
        };
        _getChatRoomMembersContent(_request.content.memberItems, chatroomInfo);
        return [JSON.stringify(_request), _id];
    };

    function _getChatRoomMembersContent(memberItems, chatroomInfo) {
        var _memberList = chatroomInfo.getMemberList();
        for (var _i = 0; _i < _memberList.getCount(); _i++) {
            memberItems[_i] = _memberList.get(_i);
        }
    };

    function _getAddMemberAuthority(chatroomInfo){
        var returnArray = {
          [AuthorityDef.AUTHORITY_ACTIONS.GC_MANAGE]: [],
          [AuthorityDef.AUTHORITY_ACTIONS.GC_SEND]: [],
          [AuthorityDef.AUTHORITY_ACTIONS.GC_VIEW]: []
        };
        var _memberListWithData = chatroomInfo.getMemberListWithData();
        for (var i in _memberListWithData) {
            returnArray[_memberListWithData[i].action].push(_memberListWithData[i].accountName);
        }
        return returnArray;
    }

    ApiCubee.createSendGroupChatMessageRequest = function(accessToken, groupChatMessage) {
        var _api = ApiCubee.API_SEND_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _escapedBody = encodeURIComponent(groupChatMessage.getMessage());
        var _escapedMessageTitleBody = encodeURIComponent(groupChatMessage.getThreadTitle());
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GROUP_CHAT,
                roomId : groupChatMessage.getTo(),
                body : _escapedBody,
                replyId : groupChatMessage.getReplyItemId(),
                replyTo : groupChatMessage.getReplyTo(),
                attachedCount : 0,
                attachedItems : [],
                context : '',
                threadTitle: _escapedMessageTitleBody
            }
        };
        if(groupChatMessage.getBodyType() != null){
            _request.content["bodyType"] = parseInt(groupChatMessage.getBodyType());
        }
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createAddGroupChatRoomMemberRequest = function(accessToken, roomId, memberList) {
        var _api = ApiCubee.API_ADD_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _count = memberList.getCount();
        if(_count != 1){
            return null;
        }
        var _member = Utils.convertArrayListToString(memberList,',');
        if(_member == ''){
            return null;
        }
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM,
                roomId : roomId,
                member : _member
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createUpdateChatRoomInfoRequest = function(accessToken, chatroomInfo) {
        var _api = ApiCubee.API_UPDATE_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM_INFO,
                extras : {
                    subType : [
                        ApiCubee.EXTRAS_SUBTYPE_CHANGE_ROOM_NAME,
                        ApiCubee.EXTRAS_SUBTYPE_CHANGE_ROOM_PRIVACY_TYPE
                    ]
                },
                roomId : chatroomInfo.getRoomId(),
                roomName : encodeURIComponent(chatroomInfo.getRoomName()),
                privacyType : chatroomInfo.getPrivacyType()
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createRemoveChatRoomMemberRequest = function(accessToken, roomId, memberList, removeType) {
        var _api = ApiCubee.API_REMOVE_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _members = [];
        var _count = memberList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            _members.push(memberList.get(_i));
        }
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GROUP_CHAT_ROOM,
                removeType : removeType,
                roomId : roomId,
                count : _members.length,
                members : _members
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createGetCountRequest = function(accessToken, contentType, filterCondition) {
        var _api = ApiCubee.API_GET_COUNT;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        _condition.filter = convertFilterConditionDataToURIEncode(filterCondition.getJSONObject());
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : contentType,
                condition : _condition
            }
        };
        return [JSON.stringify(_request), _id];
    };

    function convertFilterConditionDataToURIEncode(filterCondition) {
        if(filterCondition == null || typeof filterCondition != 'object') {
            return null;
        }
        var _type = filterCondition.type;
        switch(_type) {
            case 'and':
            case 'or':
                var _count = filterCondition.value.length;
                for(var _i = 0; _i < _count; _i++) {
                    filterCondition.value[_i] = convertFilterConditionDataToURIEncode(filterCondition.value[_i]);
                }
                break;
            case 'not':
                filterCondition.value = convertFilterConditionDataToURIEncode(filterCondition.value);
                break;
            case 'item':
                break;
            case 'keyword':
                filterCondition.value = encodeURIComponent(filterCondition.value);
                break;
            default:
                break;
        }
        return filterCondition;
    };
    ApiCubee.createGetThreadMessageRequest = function(accessToken, itemId) {
        var _api = ApiCubee.API_GET_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_THREAD,
                itemId : itemId
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createSwitchProtocolRequest = function(accessToken) {
        var _api = ApiCubee.API_CONTROL_CONNECTION;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_SWITCH_PROTOCOL
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createGetLoginUserInfoRequest = function(accessToken) {
        var _api = ApiCubee.API_GET_LOGIN_PERSON_DATA;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {}
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createDemandTaskRequest = function(accessToken, itemId) {
        var _api = ApiCubee.API_MESSAGE_OPTION;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_DEMAND_TASK,
                itemId : itemId,
                clearCondition : ''
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createClearDemandTaskRequest = function(accessToken, itemId) {
        var _api = ApiCubee.API_MESSAGE_OPTION;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_CLEAR_DEMANDED_TASK,
                itemId : itemId
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createGetExistingReaderListRequest = function(accessToken, itemId) {
        var _api = ApiCubee.API_MESSAGE_OPTION;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GET_EXISTING_READER_LIST,
                itemId : itemId
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createSetReadMessageRequest = function(accessToken, itemIdList) {
        var _api = ApiCubee.API_MESSAGE_OPTION;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _count = itemIdList.getCount();
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_SET_READ_MESSAGE,
                itemCount : _count,
                items : []
            }
        };
        for(var _i = 0; _i < _count; _i++){
            var _item = {};
            _item.itemId = itemIdList.get(_i);
            _request.content.items.push(_item);
        }
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createCreateCommunityRequest = function(accessToken, communityInfo) {
        var _api = ApiCubee.API_CREATE_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM,
                roomName : encodeURIComponent(communityInfo.getRoomName()),
                description : encodeURIComponent(communityInfo.getDescription()),
                privacyType : communityInfo.getPrivacyType(),
                memberEntryType : communityInfo.getMemberEntryType(),
                logoUrl : communityInfo.getLogoUrl()
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createGetJoinedCommunityInfoListRequest = function(accessToken, startId, count, sortCondition) {
        var _api = ApiCubee.API_GET_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _condition = {};
        _condition.sort = sortCondition.getJSONObject();
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_MY_COMMUNITY_LIST,
                startId : startId,
                count : count,
                condition : _condition
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createGetCommunityInfoRequest = function(accessToken, roomId) {
        var _api = ApiCubee.API_GET_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_COMMUNITY_INFO,
                roomId : roomId
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createGetCommunityMemberInfoRequest = function(accessToken, roomId) {
        var _api = ApiCubee.API_GET_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_COMMUNITY_MEMBER_INFO,
                roomId : roomId
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createUpdateCommunityRequest = function(accessToken, communityInfo) {
        var _api = ApiCubee.API_UPDATE_GROUP;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM_INFO,
                roomId : communityInfo.getRoomId(),
                roomName : encodeURIComponent(communityInfo.getRoomName()),
                description : encodeURIComponent(communityInfo.getDescription()),
                privacyType : communityInfo.getPrivacyType(),
                memberEntryType : communityInfo.getMemberEntryType(),
                logoUrl : communityInfo.getLogoUrl()
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createAddCommunityMemberRequest = function(accessToken, roomId, memberList) {
        var _api = ApiCubee.API_ADD_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _members = [];
        var _count = memberList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            _members.push(memberList.get(_i));
        }
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM,
                roomId : roomId,
                count : _members.length,
                members : _members
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createUpdateCommunityOwnerRequest = function(accessToken, roomId, ownerList) {
        var _api = ApiCubee.API_UPDATE_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _owners = [];
        var _count = ownerList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            _owners.push(ownerList.get(_i));
        }
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_COMMUNITY_OWNER,
                roomId : roomId,
                ownerCount : _owners.length,
                ownerItems : _owners
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createRemoveCommunityMemberRequest = function(accessToken, roomId, memberList) {
        var _api = ApiCubee.API_REMOVE_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _members = [];
        var _count = memberList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            _members.push(memberList.get(_i));
        }
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_COMMUNITY_ROOM,
                roomId : roomId,
                count : _members.length,
                members : _members
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createSendCommunityMessageRequest = function(accessToken, communityMessage) {
        var _api = ApiCubee.API_SEND_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _escapedBody = encodeURIComponent(communityMessage.getMessage());
        var _escapedMessageTitleBody = encodeURIComponent(communityMessage.getThreadTitle());
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_COMMUNITY,
                roomId : communityMessage.getTo(),
                body : _escapedBody,
                replyId : communityMessage.getReplyItemId(),
                replyTo : communityMessage.getReplyTo(),
                attachedCount : 0,
                attachedItems : [],
                context : '',
                threadTitle: _escapedMessageTitleBody
            }
        };
        if(communityMessage.getBodyType() != null){
            _request.content["bodyType"] = parseInt(communityMessage.getBodyType());
        }
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createSendMurmurMessageRequest = function(accessToken, murmurMessage) {
        var _api = ApiCubee.API_SEND_MESSAGE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _escapedBody = encodeURIComponent(murmurMessage.getMessage());
        var _escapedMessageTitleBody = encodeURIComponent(murmurMessage.getThreadTitle());
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_MURMUR,
                body : _escapedBody,
                replyId : murmurMessage.getReplyItemId(),
                replyTo : murmurMessage.getReplyTo(),
                attachedCount : 0,
                attachedItems : [],
                context : '',
                threadTitle: _escapedMessageTitleBody
            }
        };
        if(murmurMessage.getBodyType() != null &&
           ((
               typeof murmurMessage.getBodyType() == "string" &&
               murmurMessage.getBodyType().match(/^\d+$/)
           ) || (
               typeof murmurMessage.getBodyType() == "number"
           ))
        ){
            _request.content["bodyType"] = parseInt(murmurMessage.getBodyType());
        }
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createAddContactListMemberRequest = function(accessToken, memberList) {
        var _api = ApiCubee.API_ADD_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _members = [];
        var _count = memberList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            _members.push({
                jid: memberList.get(_i).jid,
                contactListGroup: memberList.get(_i).contactListGroup
            });
        }
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_CONTACT_LIST,
                count : _members.length,
                members : _members
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createRemoveContactListMemberRequest = function(accessToken, memberList) {
        var _api = ApiCubee.API_REMOVE_MEMBER;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _members = [];
        var _count = memberList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            _members.push({
                jid: memberList.get(_i).jid
            });
        }
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_CONTACT_LIST,
                count : _members.length,
                members : _members
            }
        };
        return [JSON.stringify(_request), _id];
    };
    ApiCubee.createSearchPersonRequest = function(accessToken, startId, count, columnSearchCondition) {
        var _api = ApiCubee.API_GET_PERSON_LIST;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _filter = columnSearchCondition.getFilterCondition();
        var _sort = columnSearchCondition.getSortCondition();
        var _condition = {};
        _condition.filter = convertFilterConditionDataToURIEncode(_filter.getJSONObject());
        _condition.sort = _sort.getJSONObject();
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_SEARCH,
                subType : ApiCubee.CONTENT_SUBTYPE_ALL_USERS,
                condition : _condition,
                startId : startId,
                count : count
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.getRights = function(accessToken, userName){
        var _id = ApiCubee.API_GET_RIGHTS + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_GET_RIGHTS,
            id : _id,
            version : 1,
            content : {
                user_id : userName
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.getRoleAssignmentForUser = function(accessToken, userName){
        var _id = ApiCubee.API_GET_ROLE_ASSIGNMENT_FOR_USER + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_GET_ROLE_ASSIGNMENT_FOR_USER,
            id : _id,
            version : 1,
            content : {
                user_id : userName
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createPolicy = function(accessToken, userName, policy_id, policy_tid, translations){
        var _id = ApiCubee.API_CREATE_POLICY + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_CREATE_POLICY,
            id : _id,
            version : 1,
            content : {
                user_id : userName,
                policy_id : policy_id,
                policy_tid : policy_tid,
                translations: translations
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.createRight = function(accessToken, policy_id, action, resource_id){
        var _id = ApiCubee.API_CREATE_RIGHTS + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_CREATE_RIGHTS,
            id : _id,
            version : 1,
            content : {
                policy_id : policy_id,
                action: action,
                resource: resource_id,
                enable_flag: true
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.assignPolicyToUser = function(accessToken, policy_id, users){
        var _id = ApiCubee.API_ASSIGN_POLISY_TO_USER + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_ASSIGN_POLISY_TO_USER,
            id : _id,
            version : 1,
            content : {
                policy_id : policy_id,
                users: users
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.getUserPoliciesByResource = function(accessToken, resource_id){
        var _id = ApiCubee.API_GET_USER_POLICIES_BY_RESOURCE + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_GET_USER_POLICIES_BY_RESOURCE,
            id : _id,
            version : 1,
            content : {
                resource_id: resource_id
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.unassignPolicyFromUser = function(accessToken, users, policy_id){
        var _id = ApiCubee.API_UNASSIGN_POLICY_FROM_USER + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_UNASSIGN_POLICY_FROM_USER,
            id : _id,
            version : 1,
            content : {
                users: users,
                policy_id: policy_id
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.updateThreadTitle = function(accessToken, message, threadTitle){
        var _id = ApiCubee.API_UPDATE_THREAD_TITLE + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _content = {};
        switch (message.getType()) {
            case Message.TYPE_PUBLIC:
                _content['type'] = 'Public';
                break;
            case Message.TYPE_CHAT:
                _content['type'] = 'Chat';
                _content['msgto'] = message.getTo();
                break;
            case Message.TYPE_COMMUNITY:
                _content['type'] = 'Community';
                _content['roomId'] = message.getTo();
                break;
            case Message.TYPE_GROUP_CHAT:
                _content['type'] = 'GroupChat';
                _content['roomId'] = message.getTo();
                break;
            case Message.TYPE_MURMUR:
                _content['type'] = 'Murmur';
                _content['msgto'] = message.getTo();
                break;
            default:
                break;
        }
        _content['threadTitle'] = encodeURIComponent(threadTitle);
        _content['threadRootId'] = message.getThreadRootId();
        _content['itemId'] = message.getItemId();

        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_UPDATE_THREAD_TITLE,
            id : _id,
            version : 1,
            content : _content
        };
        return[JSON.stringify(_request), _id];

    };

    ApiCubee.getThreadTitleList = function(accessToken, _columnInfo){
        var _id = ApiCubee.API_GET_THREAD_TITLE_LIST + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _content = {};
        switch (_columnInfo.getColumnType()) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
                _content['type'] = 'Public';
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                _content['type'] = 'Chat';
                _content['msgto'] = _columnInfo.getFilterCondition();
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
                _content['type'] = 'Community';
                _content['roomId'] = _columnInfo.getCommunityInfomation().getRoomId();
              break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                _content['type'] = 'GroupChat';
                _content['roomId'] = _columnInfo.getChatRoomInfomation().getRoomId();
                break;
            case ColumnInformation.TYPE_COLUMN_RECENT:
                _content['type'] = 'all';
                break;
            case ColumnInformation.TYPE_COLUMN_MURMUR: {
                _content['type'] = 'Murmur';
                let partnerJid = MurmurColumnInformation.getOwnJidFromSearchCondition(_columnInfo);
                _content['msgto'] = partnerJid;
                break;
            }
            default:
                break;
        }
        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_GET_THREAD_TITLE_LIST,
            id : _id,
            version : 1,
            content : _content
        };
        return[JSON.stringify(_request), _id];

    };

    ApiCubee.updateMessage = function(accessToken, editMessage, message){
        var _id = ApiCubee.API_GET_THREAD_TITLE_LIST + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _content = {};
        switch (message.getType()) {
            case Message.TYPE_PUBLIC:
                _content['type'] = 'Public';
                break;
            case Message.TYPE_CHAT:
                _content['type'] = 'Chat';
                break;
            case Message.TYPE_COMMUNITY:
                _content['type'] = 'Community';
                _content['roomId'] = message.getTo();
                break;
            case Message.TYPE_GROUP_CHAT:
                _content['type'] = 'GroupChat';
                _content['roomId'] = message.getTo();
                break;
            case Message.TYPE_MURMUR:
                _content['type'] = 'Murmur';
                break;
            default:
              break;
        }
        _content['itemId'] = message.getItemId();
        _content['body'] = encodeURIComponent(editMessage);

        var _request = {
            accessToken : accessToken,
            request : ApiCubee.API_UPDATE_MESSAGE,
            id : _id,
            version : 1,
            content : _content
        };
        return[JSON.stringify(_request), _id];

    };

   ApiCubee.sendQuoteMessage = function(accessToken, quoteMessage){
       var _id = ApiCubee.API_SEND_MESSAGE + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
       var _content = {};
       switch (quoteMessage.type) {
           case Message.TYPE_PUBLIC:
               _content['type'] = 'Public';
               break;
           case Message.TYPE_CHAT:
               _content['type'] = 'Chat';
               _content['to'] = quoteMessage.sendto;
               break;
           case Message.TYPE_COMMUNITY:
               _content['type'] = 'Community';
               _content['roomId'] = quoteMessage.sendto;
               break;
           case Message.TYPE_GROUP_CHAT:
               _content['type'] = 'GroupChat';
               _content['roomId'] = quoteMessage.sendto;
               break;
           case Message.TYPE_Murmur:
               _content['type'] = 'Murmur';
               _content['to'] = quoteMessage.sendto;
               break;
           default:
             break;
       }
       _content['shareItemId'] = quoteMessage.quotationItemId;
       _content['body'] = encodeURIComponent(quoteMessage.body);

       var _request = {
           accessToken : accessToken,
           request : ApiCubee.API_SEND_MESSAGE,
           id : _id,
           version : 1,
           content : _content
       };
       return[JSON.stringify(_request), _id];

   };
   ApiCubee.createSendEmotionPointRequest = function(accessToken, itemId, emotionValue) {
       var _api = ApiCubee.API_MESSAGE_OPTION;
       var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
       var _request = {
           accessToken : accessToken,
           request : _api,
           id : _id,
           version : 1,
           content : {
               type : ApiCubee.CONTENT_TYPE_ADD_EMOTIONPOINT,
               itemId : itemId,
               emotionPoint: emotionValue
           }
       };
       return [JSON.stringify(_request), _id];
   };

   ApiCubee.getGoodJobTotal = function(accessToken, jid, dateFrom) {
       var _api = ApiCubee.API_MESSAGE_OPTION;
       var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

       var dt = new Date();
       var y = dt.getFullYear();
       var m = ("00" + (dt.getMonth()+1)).slice(-2);
       var d = ("00" + dt.getDate()).slice(-2);
       var nowDate = y + "/" + m + "/" + d;

       var _request = {
           accessToken : accessToken,
           request : _api,
           id : _id,
           version : 1,
           content : {
               type : ApiCubee.CONTENT_TYPE_GET_GOODJOB_TOTAL,
               jid : jid,
               dateTo: nowDate
           }
       };
       if (dateFrom) {
          _request.content.dateFrom = dateFrom;
       }
       return [JSON.stringify(_request), _id];
   };

   ApiCubee.getThanksPointsTotal = function(accessToken, jid, dateFrom) {
       var _api = ApiCubee.API_MESSAGE_OPTION;
       var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

       var dt = new Date();
       var y = dt.getFullYear();
       var m = ("00" + (dt.getMonth()+1)).slice(-2);
       var d = ("00" + dt.getDate()).slice(-2);
       var nowDate = y + "/" + m + "/" + d;

       var _request = {
           accessToken : accessToken,
           request : _api,
           id : _id,
           version : 1,
           content : {
               type : ApiCubee.CONTENT_TYPE_GET_THANKS_POINT_TOTAL,
               jid : jid,
               dateTo: nowDate
           }
       };
       if (dateFrom) {
          _request.content.dateFrom = dateFrom;
       }
       return [JSON.stringify(_request), _id];
   };

   ApiCubee.getGoodJobRanking = function(accessToken, dateFrom, rankBottom, offset, limit) {
       var _api = ApiCubee.API_MESSAGE_OPTION;
       var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

       var dt = new Date();
       var y = dt.getFullYear();
       var m = ("00" + (dt.getMonth()+1)).slice(-2);
       var d = ("00" + dt.getDate()).slice(-2);
       var nowDate = y + "/" + m + "/" + d;

       var _request = {
           accessToken : accessToken,
           request : _api,
           id : _id,
           version : 1,
           content : {
               type : ApiCubee.CONTENT_TYPE_GET_GOODJOB_TOTAL_RANKING,
               dateFrom: dateFrom,
               dateTo: nowDate,
               rankBottom: rankBottom,
               offset: offset,
               limit: limit
           }
       };
       return [JSON.stringify(_request), _id];
   };

   ApiCubee.getThanksPointsRanking = function(accessToken, dateFrom, rankBottom, offset, limit) {
       var _api = ApiCubee.API_MESSAGE_OPTION;
       var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

       var dt = new Date();
       var y = dt.getFullYear();
       var m = ("00" + (dt.getMonth()+1)).slice(-2);
       var d = ("00" + dt.getDate()).slice(-2);
       var nowDate = y + "/" + m + "/" + d;

       var _request = {
           accessToken : accessToken,
           request : _api,
           id : _id,
           version : 1,
           content : {
               type : ApiCubee.CONTENT_TYPE_GET_THANKS_POINT_RANKING,
               dateFrom: dateFrom,
               dateTo: nowDate,
               rankBottom: rankBottom,
               offset: offset,
               limit: limit
           }
       };
       return [JSON.stringify(_request), _id];
   };

   ApiCubee.getHashtagRanking = function(accessToken, msgTo, dateFrom, dateTo, rankBottom, offset, limit) {
       const _api = ApiCubee.API_MESSAGE_OPTION;
       const _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

       const _request = {
           accessToken : accessToken,
           request : _api,
           id : _id,
           version : 1,
           content : {
               type: ApiCubee.CONTENT_TYPE_GET_HASHTAG_RANKING,
               msgTo: msgTo,
               dateFrom: dateFrom,
               dateTo: dateTo,
               rankBottom: rankBottom,
               offset: offset,
               limit: limit
           }
       };
       return [JSON.stringify(_request), _id];
   };

   ApiCubee.getMurmurTotal = function(accessToken, jid, dateFrom) {
    var _api = ApiCubee.CONTENT_TYPE_GET_MURMUR_TOTAL;
    var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

    var dt = new Date();
    var y = dt.getFullYear();
    var m = ("00" + (dt.getMonth()+1)).slice(-2);
    var d = ("00" + dt.getDate()).slice(-2);
    var dateTo = y + "/" + m + "/" + d;

    var _request = {
        accessToken : accessToken,
        request : _api,
        id : _id,
        version : 0,
        content : {
            type : ApiCubee.CONTENT_GET_MURMUR_TOTAL_LIST,
            jid : jid,
            dateFrom: dateFrom,
            dateTo: dateTo
        }
    };
    return [JSON.stringify(_request), _id];
};

   ApiCubee.getMurmurRanking = function(accessToken, dateFrom, rankBottom, offset, limit) {
    var _api = ApiCubee.CONTENT_TYPE_MURMUR_RANKING;
    var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

    var dt = new Date();
    var y = dt.getFullYear();
    var m = ("00" + (dt.getMonth()+1)).slice(-2);
    var d = ("00" + dt.getDate()).slice(-2);
    var dateTo = y + "/" + m + "/" + d;

    var _request = {
        accessToken : accessToken,
        request : _api,
        id : _id,
        version : 0,
        content : {
            type : ApiCubee.CONTENT_GET_MURMUR_RANKING_LIST,
            dateFrom: dateFrom,
            dateTo: dateTo,
            rankBottom: rankBottom,
            offset: offset,
            limit: limit
        }
    };
    return [JSON.stringify(_request), _id];
};

   ApiCubee.getGroupList = function(accessToken) {
        var _api = ApiCubee.API_GET_USER_PROFILE;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);

        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : "getAffiliationList",
            }
        };
        return [JSON.stringify(_request), _id];

    };

    ApiCubee.getFolloweeList = function(accessToken, jid) {
        var _api = ApiCubee.API_USER_FOLLOW;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GET_FOLLOWEE_LIST,
                jid: jid
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.getFollowerList = function(accessToken, jid) {
        var _api = ApiCubee.API_USER_FOLLOW;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GET_FOLLOWER_LIST,
                jid: jid
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.getFollowInfo = function(accessToken, jid) {
        var _api = ApiCubee.API_USER_FOLLOW;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_GET_FOLLOW_INFO,
                jid: jid
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.addUserFollow = function(accessToken, jid) {
        var _api = ApiCubee.API_USER_FOLLOW;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_ADD_USER_FOLLOW,
                followeeJid : jid
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.delUserFollow = function(accessToken, jid) {
        var _api = ApiCubee.API_USER_FOLLOW;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken : accessToken,
            request : _api,
            id : _id,
            version : 1,
            content : {
                type : ApiCubee.CONTENT_TYPE_DEL_USER_FOLLOW,
                followeeJid : jid
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.getMurmurColumnName = function(accessToken, jid) {
        var _api = ApiCubee.API_MURMUR;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken: accessToken,
            request: _api,
            id: _id,
            version: 1,
            content: {
                type: ApiCubee.CONTENT_TYPE_GET_MURMUR_COLUMN_NAME,
                jid: jid
            }
        };
        return [JSON.stringify(_request), _id];
    };

    ApiCubee.setMurmurColumnName = function(accessToken, jid, columnName) {
        var _api = ApiCubee.API_MURMUR;
        var _id = _api + Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _request = {
            accessToken: accessToken,
            request: _api,
            id: _id,
            version: 1,
            content: {
                type: ApiCubee.CONTENT_TYPE_SET_MURMUR_COLUMN_NAME,
                jid: jid,
                columnName: columnName
            }
        };
        return [JSON.stringify(_request), _id];
    };

})();
