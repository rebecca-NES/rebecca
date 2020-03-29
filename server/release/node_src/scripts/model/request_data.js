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
    function RequestData() {}

    RequestData.GET_PERSON_LIST_TYPE_CONTACT_LIST = 'ContactList';
    RequestData.GET_PERSON_LIST_TYPE_SEARCH = 'Search';
    RequestData.GET_PERSON_LIST_TYPE_SEARCH_SUB_TYPE_ALL_USERS = 'AllUsers';

    RequestData.SET_LOGIN_PERSON_DATA_TYPE_PRESENCE = 'Presence';
    RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE = 'Profile';
    RequestData.SET_LOGIN_PERSON_DATA_TYPE_PASSWORD = 'Password';
    RequestData.SET_LOGIN_PERSON_DATA_TYPE_MAIL_COOPERATION_SETTING = 'MailCooperationSetting';
    RequestData.SET_LOGIN_PERSON_DATA_TYPE_REGISTER_DEVICE_INFO = 'RegisterDeviceInfo';
    RequestData.SET_LOGIN_PERSON_DATA_TYPE_DELETE_DEVICE_INFO = 'DeleteDeviceInfo';
    RequestData.SET_LOGIN_PERSON_DATA_AVATAR_TYPE_IMAGEPATH = 'imagepath';

    RequestData.GET_MESSAGE_TYPE_MY_FEED = 'MyFeed';
    RequestData.GET_MESSAGE_TYPE_CHAT = 'Chat';
    RequestData.GET_MESSAGE_TYPE_TASK = 'Task';
    RequestData.GET_MESSAGE_TYPE_SEARCH = 'Search';
    RequestData.GET_MESSAGE_TYPE_MAIL_BODY = 'MailBody';
    RequestData.GET_MESSAGE_TYPE_THREAD = 'Thread';
    RequestData.GET_MESSAGE_TYPE_QUESTIONNAIRE = 'Questionnaire';
    RequestData.GET_MESSAGE_TYPE_MURMUR = 'Murmur';
    RequestData.GET_MESSAGE_TYPE_SEARCH_ALL = 'SearchAll';
    RequestData.GET_MESSAGE_TYPE_RECENT = 'all';

    RequestData.SEND_MESSAGE_TYPE_PUBLIC = 'Public';
    RequestData.SEND_MESSAGE_TYPE_CHAT = 'Chat';
    RequestData.SEND_MESSAGE_TYPE_TASK = 'Task';
    RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT = 'GroupChat';
    RequestData.SEND_MESSAGE_TYPE_MAIL = 'Mail';
    RequestData.SEND_MESSAGE_TYPE_COMMUNITY = 'Community';
    RequestData.SEND_MESSAGE_TYPE_QUESTIONNAIRE = 'Questionnaire';
    RequestData.SEND_MESSAGE_TYPE_MURMUR = 'Murmur';

    RequestData.UPDATE_MESSAGE_TYPE_TASK = 'Task';
    RequestData.UPDATE_MESSAGE_TYPE_QUESTIONNAIRE = 'Questionnaire';
    RequestData.UPDATE_MESSAGE_TYPE_PUBLIC = 'Public';
    RequestData.UPDATE_MESSAGE_TYPE_CHAT = 'Chat';
    RequestData.UPDATE_MESSAGE_TYPE_GROUP_CHAT = 'GroupChat';
    RequestData.UPDATE_MESSAGE_TYPE_COMMUNITY = 'Community';
    RequestData.UPDATE_MESSAGE_TYPE_MURMUR = 'Murmur';

    RequestData.DELETE_MESSAGE_TYPE_DELETE = 'Delete';
    RequestData.DELETE_MESSAGE_TYPE_ADMIN_DELETE = 'AdminDelete';

    RequestData.MESSAGE_OPTION_TYPE_ADD_GOOD_JOB = 'AddGoodJob';
    RequestData.MESSAGE_OPTION_TYPE_ADD_EMOTION_POINT = 'AddEmotionPoint';
    RequestData.MESSAGE_OPTION_TYPE_DEMAND_TASK = 'DemandTask';
    RequestData.MESSAGE_OPTION_TYPE_CLEAR_DEMANDED_TASK = 'ClearDemandedTask';
    RequestData.MESSAGE_OPTION_TYPE_GET_EXISTING_READER_LIST = 'GetExistingReaderList';
    RequestData.MESSAGE_OPTION_TYPE_SET_READ_MESSAGE = 'SetReadMessage';
    RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_LIST = 'GetGoodJobList';
    RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_LIST = 'GetEmotionPointList';

    RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_TOTAL = 'GetGoodJobTotal';
    RequestData.MESSAGE_OPTION_TYPE_GET_GOOD_JOB_RANKING = 'GetGoodJobRanking';
    RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_TOTAL = 'GetThanksPointsTotal';
    RequestData.MESSAGE_OPTION_TYPE_GET_EMOTION_POINT_RANKING = 'GetThanksPointsRanking';

    RequestData.MESSAGE_OPTION_TYPE_GET_HASHTAG_RANKING = 'GetHashtagRanking';

    RequestData.CREATE_GROUP_TYPE_GROUP_CHAT_ROOM = 'GroupChatRoom';
    RequestData.CREATE_GROUP_TYPE_COMMUNITY_ROOM = 'CommunityRoom';

    RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_INFO = 'GroupChatRoomInfo';
    RequestData.GET_GROUP_TYPE_GROUP_CHAT_ROOM_LIST = 'GroupChatRoomList';
    RequestData.GET_GROUP_TYPE_MY_COMMUNITY_LIST = 'MyCommunityList';
    RequestData.GET_GROUP_TYPE_COMMUNITY_INFO = 'CommunityInfo';
    RequestData.GET_GROUP_TYPE_COMMUNITY_MEMBER_INFO = 'CommunityMemberInfo';

    RequestData.UPDATE_GROUP_TYPE_GROUP_CHAT_ROOM_INFO = 'GroupChatRoomInfo';
    RequestData.UPDATE_GROUP_TYPE_COMMUNITY_ROOM_INFO = 'CommunityRoomInfo';

    RequestData.MURMUR_GET_COLUMN_NAME = 'GetColumnName';
    RequestData.MURMUR_SET_COLUMN_NAME = 'SetColumnName';

    RequestData.DELETE_GROUP_TYPE_GROUP_CHAT_ROOM = 'DeleteChatRoom';
    RequestData.DELETE_GROUP_TYPE_COMMUNITY_ROOM = 'DeleteCommunityRoom';

    RequestData.ADD_MEMBER_TYPE_GROUP_CHAT_ROOM = 'GroupChatRoom';
    RequestData.ADD_MEMBER_TYPE_COMMUNITY_ROOM = 'CommunityRoom';
    RequestData.ADD_MEMBER_TYPE_CONTACT_LIST = 'ContactList';

    RequestData.UPDATE_MEMBER_TYPE_COMMUNITY_OWNER = 'CommunityOwner';

    RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM = 'GroupChatRoom';
    RequestData.REMOVE_MEMBER_TYPE_COMMUNITY_ROOM = 'CommunityRoom';
    RequestData.REMOVE_MEMBER_TYPE_CONTACT_LIST = 'ContactList';

    RequestData.GET_SERVER_LIST_TYPE_MAIL_SERVER = 'MailServer';

    RequestData.GET_SETTINGS_TYPE_ALL_USER_MAIL_SETTINGS = 'AllUserMailSettings';

    RequestData.CONTROLL_CONECTION_TYPE_SWITCH_PROTOCOL = 'SwitchProtocol';

    RequestData.GET_COUNT_TYPE_MESSAGE = 'Message';

    RequestData.DELETE_NOTE = 'DeleteNote';

    RequestData.NOTIFY_MESSAGE_TYPE_PUBLIC = 'Public';
    RequestData.NOTIFY_MESSAGE_TYPE_CHAT = 'Chat';
    RequestData.NOTIFY_MESSAGE_TYPE_TASK = 'Task';
    RequestData.NOTIFY_MESSAGE_TYPE_SYSTEM = 'System';
    RequestData.NOTIFY_MESSAGE_TYPE_VOTE = 'Vote';

    RequestData.NOTIFY_CHANGE_PERSON_DATA_TYPE_PRESENCE = 'Presence';
    RequestData.NOTIFY_CHANGE_PERSON_DATA_TYPE_PROFILE = 'Profile';

    RequestData.NOTIFY_MESSAGE_OPTION_TYPE_ADD_GOOD_JOB = 'AddGoodJob';
    RequestData.NOTIFY_MESSAGE_OPTION_TYPE_ADD_EMOTION_POINT = 'AddEmotionPoint';
    RequestData.NOTIFY_MESSAGE_OPTION_TYPE_UPDATE_SIBLING_TASK = 'UpdateSiblingTask';
    RequestData.NOTIFY_MESSAGE_OPTION_TYPE_DEMAND_TASK = 'DemandTask';
    RequestData.NOTIFY_MESSAGE_OPTION_TYPE_CLEAR_DEMANDED_TASK = 'ClearDemandedTask';
    RequestData.NOTIFY_MESSAGE_OPTION_TYPE_SET_READ_MESSAGE = 'SetReadMessage';

    RequestData.NOTIFY_CREATE_GROUP_TYPE_GROUP_CHAT_ROOM = 'GroupChatRoom';

    RequestData.NOTIFY_ADD_MEMBER_TYPE_GROUP_CHAT_ROOM = 'GroupChatRoom';
    RequestData.NOTIFY_ADD_MEMBER_TYPE_COMMUNITY_ROOM = 'CommunityRoom';

    RequestData.NOTIFY_UPDATE_GROUP_TYPE_GROUP_CHAT_ROOM_INFO = 'GroupChatRoomInfo';
    RequestData.NOTIFY_UPDATE_GROUP_TYPE_COMMUNITY_ROOM_INFO = 'CommunityRoomInfo';

    RequestData.NOTIFY_UPDATE_MEMBER_TYPE_COMMUNITY_OWNER = 'CommunityOwner';

    RequestData.NOTIFY_REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM = 'GroupChatRoom';
    RequestData.NOTIFY_REMOVE_MEMBER_TYPE_COMMUNITY_ROOM = 'CommunityRoom';

    RequestData.NOTIFY_MESSAGE_AUTHORIY_CHANGED = 'AuthorityDataChanged';

    RequestData.NOTIFY_DELETE_NOTE = 'DeleteNote';

    RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE_OPTION = 'http://necst.nec.co.jp/protocol/messageoption';
    RequestData.XMPP_NOTIFY_NAMESPACE_CHANGE_PERSON_DATA = 'http://necst.nec.co.jp/protocol/changepersondata';
    RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE = 'http://necst.nec.co.jp/protocol/message';
    RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_MESSAGE_BODY = 'http://necst.nec.co.jp/protocol/updatemessagebody';
    RequestData.XMPP_NOTIFY_NAMESPACE_MESSAGE_DELETE = 'http://necst.nec.co.jp/protocol/message#delete';
    RequestData.XMPP_NOTIFY_NAMESPACE_CREATE_CHAT_ROOM = 'http://necst.nec.co.jp/protocol/createchatroom';
    RequestData.XMPP_NOTIFY_NAMESPACE_ADD_CHAT_ROOM_MEMBER = 'http://necst.nec.co.jp/protocol/addchatroommember';
    RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_CHATROOM_INFO = 'http://necst.nec.co.jp/protocol/updatechatroominfo';
    RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_COMMUNITY_INFO = 'http://necst.nec.co.jp/protocol/updatecommunityinfo';
    RequestData.XMPP_NOTIFY_NAMESPACE_ADD_COMMUNITY_MEMBER = 'http://necst.nec.co.jp/protocol/addcommunitymember';
    RequestData.XMPP_NOTIFY_NAMESPACE_UPDATE_COMMUNITY_OWNER = 'http://necst.nec.co.jp/protocol/updatecommunityowner';
    RequestData.XMPP_NOTIFY_NAMESPACE_REMOVE_COMMUNITY_MEMBER = 'http://necst.nec.co.jp/protocol/removecommunitymember';
    RequestData.XMPP_NOTIFY_NAMESPACE_REMOVE_CHAT_ROOM_MEMBER = 'http://necst.nec.co.jp/protocol/removegroupchatmember';

    exports.RequestData = RequestData;
})();
