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

const AUTHORITY_ACTIONS = {
    FEED_VIEW: 'viewMessageInFeed',
    FEED_SEND: 'sendMessageToFeed',
    GC_VIEW: 'viewMessageInGroupchat',
    GC_SEND: 'sendMessageToGroupchat',
    GC_MANAGE: 'manageGroupchat',
    GC_CREATE: 'createGroupchat',
    COMMUNITY_VIEW: 'viewMessageInCommunity',
    COMMUNITY_SEND: 'sendMessageToCommunity',
    COMMUNITY_MANAGE: 'manageCommunity',
    COMMUNITY_CREATE: 'createCommunity',
    MURMUR_VIEW: 'viewMessageInMurmur',
    MURMUR_SEND: 'sendMessageToMurmur',

    SEARCH_ALL_MESSAGES : 'searchAllMessages',

    ADMIN_DELETE: 'deleteAllMessages'
};

exports.AUTHORITY_ACTIONS = AUTHORITY_ACTIONS;

