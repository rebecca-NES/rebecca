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
    var libxml = require('libxmljs');
    var Utils = require('../utils');
    var RequestData = require('../model/request_data').RequestData;
    var PersonData = require('../model/person_data');
    var RegisteredContactData = require('../model/registered_contact_data');
    var UserAccountUtils = require('./user_account_utils');
    var ServerLog = require('./server_log');
    var _log = ServerLog.getInstance();

    function Xmpp() {
    }

    Xmpp.getHeaderXmpp = function() {
        return libxml.Document().toString();
    };

    Xmpp.getOpenStreamXmpp = function(xmppserverName) {
        return '<stream:stream xmlns:stream="http://etherx.jabber.org/streams" version="1.0" xmlns="jabber:client" to="'
                + xmppserverName
                + '" xml:lang="ja" xmlns:xml="http://www.w3.org/XML/1998/namespace" >';
    };

    Xmpp.getAuthPlainXmpp = function(user, password) {
        if (user == null || typeof user != 'string') {
            return '';
        }
        if (password == null || typeof password != 'string') {
            return '';
        }

        var _doc = libxml.Document();

        var _authElem = _doc.node('auth');
        _authElem.namespace('urn:ietf:params:xml:ns:xmpp-sasl');

        _authElem.attr({
            'mechanism' : 'PLAIN',
        });
        var _authenticationData = '\0' + user + '\0' + password;
        var _buffer = new Buffer(_authenticationData, 'utf8');
        var _encodedStr = _buffer.toString('base64');
        _authElem.text(_encodedStr);
        return _authElem.toString();
    };

    Xmpp.getBindXmpp = function(clientName) {
        if (clientName == null || typeof clientName != 'string') {
            return '';
        }
        if (clientName == '') {
            return '';
        }
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        _iqElem.attr({
            'type' : 'set',
            'id' : 'bind' + _randomNum,
        });
        var _bindElem = _iqElem.node('bind');
        _bindElem.namespace('urn:ietf:params:xml:ns:xmpp-bind');
        var _resourceElem = _bindElem.node('resource');
        _resourceElem.text(clientName);
        return _iqElem.toString();
    };

    Xmpp.getSessionXmpp = function() {
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        _iqElem.attr({
            'type' : 'set',
            'id' : 'session' + _randomNum,
        });
        var _bindElem = _iqElem.node('session');
        _bindElem.namespace('urn:ietf:params:xml:ns:xmpp-session');
        return _iqElem.toString();
    };

    Xmpp.createUpdatePresence = function(presence, myMemo) {
        var _presenceStr = PersonData.convertPresenceNumToStr(presence);
        if (_presenceStr == null || _presenceStr == '') {
            return null;
        }
        var _doc = libxml.Document();
        var _presenceElem = _doc.node('presence');
        _presenceElem.node('show').text(_presenceStr);
        _presenceElem.node('status').text(myMemo);
        return [ _presenceElem.toString(), '' ];
    };

    Xmpp.createGetVcardInformationXmpp = function(fromJid, toJid) {
        _log.connectionLog(7, 'do func Xmpp.createGetVcardInformationXmpp(');
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'vCard' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : fromJid,
            'to' : toJid,
        });
        var _vCardElem = _iqElem.node('vCard');
        _vCardElem.namespace('vcard-temp');
        _vCardElem.attr({
            'version' : '2.0',
            'prodid' : '-//HandGen//NONSGML vGen v1.0//EN',
        });
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createUpdateVcardInformationXmpp = function(profile) {
        _log.connectionLog(7, 'do func Xmpp.createUpdateVcardInformationXmpp(');
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'vCard' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
        });
        var _vCardElem = _iqElem.node('vCard');
        _vCardElem.namespace('vcard-temp');
        var _nickName = profile.nickName;
        if (_nickName != null) {
            if (_nickName == '') {
                return null;
            }
            _vCardElem.node('NICKNAME').text(_nickName);
        }
        var _photoElem = _vCardElem.node('PHOTO');
        var _photoType = profile.avatarType;
        if (_photoType == null) {
            _photoType = '';
        }
        _photoElem.node('TYPE').text(_photoType);
        var _photoBinVal = profile.avatarData;
        if (_photoBinVal == null) {
            _photoBinVal = '';
        }
        _photoElem.node('BINVAL').text(_photoBinVal);
        if(profile.mailAddress != null) {
            var _emailElem = _vCardElem.node('EMAIL');
            _emailElem.node('USERID').text(profile.mailAddress);
        } else {
        }
        if(profile.group != null && Array.isArray(profile.group)) {
            var _affiliationElem = _vCardElem.node('group');
            if(_affiliationElem != null){
                for(let i=0;i<profile.group.length;i++){
                    let _affiliation = profile.group[i].trim()
                    _affiliationElem.node('item').text(_affiliation)
                }
            }
        }
        var _extrasElem = _vCardElem.node('EXTRAS');
        if (profile.extras != null) {
            _extrasElem.text(profile.extras);
        }
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createChangePasswordXmpp = function(xmppServerHostName, userName,
            password) {
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'password' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'to' : xmppServerHostName,
            'id' : _id,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:register');
        _queryElem.node('username').text(userName);
        _queryElem.node('password').text(password);
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createGetRosterXmpp = function(fromJid) {
        var _doc = libxml.Document();
        var _toJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'roster' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : fromJid,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:roster');
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createAddContactListMemberXmpp = function(xmppServerHostName, fromJid,
            addContactListMemberRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'addContactListMemberXmpp' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _contactElem = _iqElem.node('contact');
        _contactElem.namespace('http://necst.nec.co.jp/protocol/addcontactlistmember');
        var _contentElem = _contactElem.node('content');
        var _membersElem = _contentElem.node('members');
        var _memberItems = addContactListMemberRequestData.members;
        var _memberItemsCount = _memberItems.length;
        for ( var _i = 0; _i < _memberItemsCount; _i++) {
            var _memberItem = _memberItems[_i];
            var _memberElem = _membersElem.node('member');
            var _jidElem = _memberElem.node('jid');
            _jidElem.text(_getSafeStringData(_memberItem.jid));
            var _contactListGroupElem = _memberElem.node('contactlistgroup');
            _contactListGroupElem.text(_getSafeStringData(_memberItem.contactListGroup));
        }

        _membersElem.attr({
            count : _memberItemsCount
        });
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createRemoveContactListMemberXmpp = function(xmppServerHostName, fromJid,
            removeContactListMemberRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'removeContactListMemberXmpp' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _contactElem = _iqElem.node('contact');
        _contactElem.namespace('http://necst.nec.co.jp/protocol/removecontactlistmember');
        var _contentElem = _contactElem.node('content');
        var _membersElem = _contentElem.node('members');
        var _memberItems = removeContactListMemberRequestData.members;
        var _memberItemsCount = _memberItems.length;
        for ( var _i = 0; _i < _memberItemsCount; _i++) {
            var _memberItem = _memberItems[_i];
            var _memberElem = _membersElem.node('member');
            var _jidElem = _memberElem.node('jid');
            _jidElem.text(_getSafeStringData(_memberItem.jid));
        }

        _membersElem.attr({
            count : _memberItemsCount
        });
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createGetMyFeedXmpp = function(fromJid, baseId, count) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getMyFeed' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:private');
        var _exodusElem = _queryElem.node('exodus');
        _exodusElem.namespace('timeline_history');
        var _timelineHistoryElem = _exodusElem.node('timeline_history');
        _timelineHistoryElem.node('base_id').text('' + baseId);
        _timelineHistoryElem.node('count').text('' + count);
        _timelineHistoryElem.node('from').text(_fromJid);

        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createSendMessageXmpp = function(xmppServerHostName, fromJid, sendData) {
        _log.connectionLog(7, 'do func Xmpp.createSendMessageXmpp(..');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'sendMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/send');
        var _contentElem = null;
        var _type = sendData.type;
        switch (_type) {
        case RequestData.SEND_MESSAGE_TYPE_PUBLIC:
            _contentElem = _getPublicDataContentXmppElem(sendData, fromJid);
            break;
        case RequestData.SEND_MESSAGE_TYPE_CHAT:
            break;
        case RequestData.SEND_MESSAGE_TYPE_TASK:
            _contentElem = _getTaskDataContentXmppElem(sendData, fromJid,
                    xmppServerHostName);
            break;
        case RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT:
            _contentElem = _getGroupChatDataContentXmppElem(sendData, fromJid);
            break;
        case RequestData.SEND_MESSAGE_TYPE_COMMUNITY:
            _contentElem = _getCommunityMessageDataContentXmppElem(sendData,
                    fromJid);
            break;
        case RequestData.SEND_MESSAGE_TYPE_QUESTIONNAIRE:
            _contentElem = _getQuestionnaireDataContentXmppElem(sendData, fromJid,
                xmppServerHostName);
            break;
        case RequestData.SEND_MESSAGE_TYPE_MURMUR:
            _contentElem = _getMurmurDataContentXmppElem(sendData, fromJid,
                xmppServerHostName);
            break;
        default:
            break;
        }
        if (_contentElem) {
            _messageElem.addChild(_contentElem);
        }
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createUpdateMessageXmpp = function(xmppServerHostName, fromJid,
            sendData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'updateMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/update');
        var _contentElem = null;
        var _type = sendData.type;
        switch (_type) {
        case RequestData.SEND_MESSAGE_TYPE_PUBLIC:
            break;
        case RequestData.SEND_MESSAGE_TYPE_CHAT:
            break;
        case RequestData.SEND_MESSAGE_TYPE_TASK:
            _contentElem = _getTaskDataContentXmppElem(sendData, fromJid,
                    xmppServerHostName);
            _contentElem.node('item_id').text(sendData.itemId);
            break;
        case RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT:
            break;
        case RequestData.SEND_MESSAGE_TYPE_COMMUNITY:
            break;
        case RequestData.UPDATE_MESSAGE_TYPE_QUESTIONNAIRE:
            _contentElem = _getQuestionnaireUpdateDataContentXmppElem(sendData, fromJid,
                xmppServerHostName);
            break;
        default:
            break;
        }
        if (_contentElem) {
            _messageElem.addChild(_contentElem);
        }
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createUpdateMessageBodyXmpp = function(xmppServerHostName, fromJid,
            sendData) {
        _log.connectionLog(7, 'do func Xmpp.createUpdateMessageBodyXmpp(...');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'updateMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/updatemessagebody');
        var _contentElem = _messageElem.node('content');
        var _type = sendData.type;
        _contentElem.node('body').text(_getSafeStringData(sendData.body));
        _contentElem.node('item_id').text(
            _getSafeStringData(sendData.itemId));
        let roomIdStr = "";
        if(sendData.roomId != undefined &&
           sendData.roomId != null){
            roomIdStr = sendData.roomId;
        }
        _contentElem.node('room_id')
                    .text(_getSafeStringData(roomIdStr));
        switch (_type) {
        case RequestData.SEND_MESSAGE_TYPE_PUBLIC:
                _contentElem.attr({
                    'type' : 'Public'
                });
            break;
        case RequestData.SEND_MESSAGE_TYPE_CHAT:
            _contentElem.attr({
                'type' : 'Chat'
            });
            break;
        case RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT:
            _contentElem.attr({
                'type' : 'GroupChat'
            });
            break;
        case RequestData.SEND_MESSAGE_TYPE_COMMUNITY:
            _contentElem.attr({
                'type' : 'Community'
            });
            break;
        case RequestData.SEND_MESSAGE_TYPE_MURMUR:
            _contentElem.attr({
                'type' : 'Murmur'
            });
            break;
        default:
            break;
        }
        _messageElem.addChild(_contentElem);
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createSendMessageMailXmpp = function(xmppServerHostName, fromJid,
            sendData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'sendMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/send');
        var _contentElem = _messageElem.node('content');
        _contentElem.attr({
            'type' : 'Mail'
        });
        var _itemsElem = _contentElem.node('items');
        var _itemsCount = 0;
        var _items = getItemsFromSendMailMessageRequest(sendData);
        if (_items != null) {
            var _count = _items.length;
            for ( var _i = 0; _i < _count; _i++) {
                var _item = _items[_i];
                if (_item == null) {
                    continue;
                }
                var _itemElem = getSendMeailMessageItemElemFromSendMailMessageItemObject(
                        _item, xmppServerHostName);
                if (_itemElem == null) {
                    continue;
                }
                _itemsElem.addChild(_itemElem);
                _itemsCount++;
            }
        }

        _itemsElem.attr({
            'count' : '' + _itemsCount,
        });

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createUpdateThreadTitleXmpp = function(xmppServerHostName, fromJid, sendData) {
        _log.connectionLog(7, 'do func Xmpp.createUpdateThreadTitleXmpp(..');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'updateThreadTitle' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/threadtitleupdate');
        var _doc = libxml.Document();
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : sendData.type
        });
        _contentElem.node('room_id').text(sendData.roomId ? sendData.roomId : "");
        _contentElem.node('msgto').text(sendData.msgto ? sendData.msgto : "");
        _contentElem.node('thread_title').text(sendData.threadTitle);
        _contentElem.node('thread_root_id').text(sendData.threadRootId);
        _contentElem.node('item_id').text(sendData.itemId);
        _messageElem.addChild(_contentElem);

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createGetThreadTitleListXmpp = function(xmppServerHostName, fromJid, sendData) {
        _log.connectionLog(7, 'do func Xmpp.createGetThreadTitleListXmpp(..');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'updateThreadTitle' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/threadtitlelistget');
        var _doc = libxml.Document();
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : sendData.type
        });
        _contentElem.node('room_id').text(sendData.roomId ? sendData.roomId : "");
        _contentElem.node('msgto').text(sendData.msgto ? sendData.msgto : "");
        var _filterElem = _contentElem.node('filter');
        if(sendData.condition != undefined &&
           sendData.condition.filter != undefined &&
           sendData.condition.filter.withoutfeed != undefined &&
           typeof sendData.condition.filter.withoutfeed == "boolean" &&
           sendData.condition.filter.withoutfeed){
            _filterElem.node('withoutfeed').text('1');
        }

        _messageElem.addChild(_contentElem);

        return [ _iqElem.toString(), _id ];
    };

    function getItemsFromSendMailMessageRequest(sendMailMessageRequest) {
        if (sendMailMessageRequest == null) {
            return null;
        }
        return sendMailMessageRequest.items;
    }

    function getSendMeailMessageItemElemFromSendMailMessageItemObject(item,
            messageFrom) {
        if (item == null) {
            return null;
        }
        var _doc = libxml.Document();
        var _itemElem = _doc.node('item');
        _itemElem.node('msgtype').text('' + _getSafeNumberData(item.type));
        _itemElem.node('msgfrom').text(_getSafeStringData(messageFrom));
        _itemElem.node('msgto').text(_getSafeStringData(item.to));
        var _entryElem = _itemElem.node('entry');
        _entryElem.node('body').text(_getSafeStringData(item.body));
        _itemElem.node('priority').text('' + _getSafeNumberData(item.priority));
        _itemElem.node('mail_message_id').text(
                _getSafeStringData(item.mailMessageId));
        _itemElem.node('mail_in_reply_to').text(
                _getSafeStringData(item.mailInReplyTo));
        var _attachedItemsElem = _itemElem.node('attached_items');
        var _attachedFileUrls = null;
        var attachedFileUrlCount = _getSafeNumberData(item.attachedCount);
        if (item.attachedItems == null) {
            _attachedFileUrls = new Array();
        } else {
            _attachedFileUrls = item.attachedItems;
        }
        _attachedItemsElem.attr({
            'count' : '' + attachedFileUrlCount,
        });
        for ( var _i = 0; _i < attachedFileUrlCount; _i++) {
            _attachedItemsElem.node('item').text(_attachedFileUrls[_i]);
        }
        _itemElem.node('context').text(_getSafeStringData(item.context));
        _itemElem.node('mail_body').text(_getSafeStringData(item.mailBody));
        return _itemElem;
    }

    Xmpp.createGetChatXmpp = function(fromJid, partnerJid, baseId, count) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _partnerJid = partnerJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getChat' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:private');
        var _exodusElem = _queryElem.node('exodus');
        _exodusElem.namespace('chat_history');
        var _chatHistoryElem = _exodusElem.node('chat_history');
        _chatHistoryElem.node('base_id').text('' + baseId);
        _chatHistoryElem.node('count').text('' + count);
        var _filterElem = _chatHistoryElem.node('filter');
        _filterElem.node('partner').text(partnerJid, _partnerJid);

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createSendChatMessageXmpp = function(fromJid, partnerJid, messageBody,
            replyId, attachedFileUrlCount, attachedFileUrls, threadTitle, context, quotationItemId, bodyType) {
        _log.connectionLog(7, 'do func Xmpp.createSendChatMessageXmpp(...');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _partnerJid = partnerJid.split('/')[0];
        var _messgeElem = _doc.node('message');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'sendChatMessage' + _randomNum;
        _messgeElem.attr({
            'type' : 'chat',
            'id' : _id,
            'from' : _fromJid,
            'to' : _partnerJid,
        });
        _messgeElem.node('body').text(messageBody);
        if (replyId == null) {
            replyId = '';
        }
        _messgeElem.node('reply_id').text(replyId);
        if (bodyType != null && typeof bodyType === 'number') {
            _messgeElem.node('body_type').text(bodyType);
        }else{
            _messgeElem.node('body_type').text("0");
        }

        if (threadTitle == undefined || threadTitle == null) {
            threadTitle = '';
        }
        _messgeElem.node('thread_title').text(threadTitle);
        if (quotationItemId != undefined && quotationItemId != null) {
            _messgeElem.node('quotation_item_id').text(_getSafeStringData(quotationItemId));
        }
        var _attachedItemsElem = _messgeElem.node('attached_items');
        if (attachedFileUrls == null) {
            attachedFileUrls = new Array();
        }
        _attachedItemsElem.attr({
            'count' : '' + attachedFileUrlCount,
        });
        for ( var _i = 0; _i < attachedFileUrlCount; _i++) {
            _attachedItemsElem.node('item').text(attachedFileUrls[_i]);
        }
        if (context == null) {
            context = '';
        }
        _messgeElem.node('context').text(context);
        return [ _messgeElem.toString(), _id ];
    };

    Xmpp.createGetTaskListXmpp = function(fromJid, baseId, count, filter, sort) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getTaskList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:private');
        var _exodusElem = _queryElem.node('exodus');
        _exodusElem.namespace('task_list');
        var _taskListElem = _exodusElem.node('task_list');
        _taskListElem.node('base_id').text('' + baseId);
        _taskListElem.node('count').text('' + count);
        var _filterElem = _taskListElem.node('filter');
        for (_key in filter) {
            _filterElem.node(_key).text(filter[_key]);
        }
        var _sortElem = _taskListElem.node('sort');
        _sortElem.node('item').text(sort.item);
        _sortElem.node('order').text(sort.order);

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createGetQuestionnaireXmpp = function(fromJid, baseId, count, filter, sort) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getQuestionnaireList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:private');
        var _exodusElem = _queryElem.node('exodus');
        _exodusElem.namespace('questionnaire_list');
        var _questionnaireListElem = _exodusElem.node('questionnaire_list');
        _questionnaireListElem.node('base_id').text('' + baseId);
        _questionnaireListElem.node('count').text('' + count);
        var _filterElem = _questionnaireListElem.node('filter');
        if(filter != undefined && filter.withoutfeed){
            _filterElem.node('withoutfeed').text('1');
        }
        var _sortElem = _questionnaireListElem.node('sort');
        _sortElem.node('item').text(sort.item);
        _sortElem.node('order').text(sort.order);
        return [ _iqElem.toString(), _id ];

    };

    Xmpp.createSearchMessageXmpp = function(xmppServerHostName, fromJid,
            startId, count, filter, sort) {
        _log.connectionLog(7, 'do func Xmpp.createSearchMessageXmpp(...');
        var _doc = new libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'searchMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/search');
        var _contentElem = _messageElem.node('content');
        var _conditionElem = _contentElem.node('condition');
        var _filterElem = _conditionElem.node('filter');
        _getFilterConditionXmppElem(_filterElem, filter);
        var _sortElem = _conditionElem.node('sort');
        _sortElem.node('item').text(sort.item);
        _sortElem.node('order').text(sort.order);

        _contentElem.node('startid').text('' + startId);
        _contentElem.node('count').text('' + count);

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createSearchMessageForTypeXmpp = function(xmppServerHostName, fromJid,
            startId, count, filter, sort, type) {
        _log.connectionLog(7, 'do func Xmpp.createSearchMessageForTypeXmpp(...');
        var _doc = new libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'searchMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/search');
        var _contentElem = _messageElem.node('content');
        var _conditionElem = _contentElem.node('condition');
        var _filterElem = _conditionElem.node('filter');

        _getFilterConditionXmppElem(_filterElem, filter);
        var _sortElem = _conditionElem.node('sort');
        _sortElem.node('item').text(sort.item);
        _sortElem.node('order').text(sort.order);

        _contentElem.node('startid').text('' + startId);
        _contentElem.node('count').text('' + count);
        if(type && typeof type == 'string' &&
           type.match(/^[A-Za-z0-9]+$/)){
            _contentElem.node('type').text(type);
        }

        return [ _iqElem.toString(), _id ];
    };

    function _getQuestionnaireUpdateDataContentXmppElem(questionnaireData, fromJid, toXmppServerHostName) {
        _log.connectionLog(7, 'do func Xmpp._getQuestionnaireUpdateDataContentXmppElem(...');
        var _doc = libxml.Document();

        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Questionnaire'
        });

        var _itemIdElem = _contentElem.node('itemId');
        _itemIdElem.text(questionnaireData.itemId);
        var _msgToElem = _contentElem.node('msgto');
        if(questionnaireData.msgto &&
           typeof questionnaireData.msgto == 'string' &&
           questionnaireData.msgto.length > 0){
            _msgToElem.text(questionnaireData.msgto);
        }else{
            _msgToElem.text("");
        }
        var _optionItemsElem = _contentElem.node('optionItems');
        var _optionItems = questionnaireData.optionItems;
        for (var _i = 0; _i < _optionItems.length; _i++) {
            var _optionItem = _optionItems[_i];
            var _optionItemElem = _optionItemsElem.node('optionItem');
            _optionItemElem.node('optionId').text(_optionItem.optionId);
            _optionItemElem.node('optionValue').text(_optionItem.optionValue);
        }

        return _contentElem;
    }

    function _getQuestionnaireDataContentXmppElem(questionnaireData, fromJid,
                                         toXmppServerHostName) {
        var _doc = libxml.Document();
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Questionnaire'
        });
        _contentElem.node('msgtype').text('' + 10);
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        if(questionnaireData.roomId == 0) {
            _contentElem.node('msgto').text(
                _getSafeStringData(toXmppServerHostName));
        } else {
            _contentElem.node('msgto').text(
                questionnaireData.roomId);
        }
        var _entryElem = _contentElem.node('entry');
        _entryElem.node('body').text(_getSafeStringData(questionnaireData.body));

        _contentElem.node('inputType').text(
            '' + _getSafeNumberData(questionnaireData.inputType));
        _contentElem.node('resultVisible').text(
            '' + _getSafeNumberData(questionnaireData.resultVisible));
        _contentElem.node('graphType').text(
            '' + _getSafeNumberData(questionnaireData.graphType));
        _contentElem.node('roomType').text(
            '' + _getSafeNumberData(questionnaireData.roomType));
        if(questionnaireData.roomId == 0) {
            _contentElem.node('roomId').text(
                _getSafeStringData(""));
        } else {
            _contentElem.node('roomId').text(
                '' + _getSafeStringData(questionnaireData.roomId));
        }
        var _optionItemItemsElem = _contentElem.node('optionItems');
        var optionItems = null;
        var optionCount = _getSafeNumberData(questionnaireData.optionCount);
        if (questionnaireData.optionItems == null) {
            optionItems = new Array();
        } else {
            optionItems = questionnaireData.optionItems;
        }
        _optionItemItemsElem.attr({
            'count' : '' + optionCount,
        });
        for ( var _j = 0; _j < optionCount; _j++) {
            var item = optionItems[_j];
            _optionItemItemsElem.node('option').text(item.option);
        }
        _contentElem.node('start_date').text(
            _getSafeStringData(questionnaireData.startDate));
        _contentElem.node('due_date')
            .text(_getSafeStringData(questionnaireData.dueDate));
        _contentElem.node('context').text(_getSafeStringData(questionnaireData.context));
        var _attachedItemsElem = _contentElem.node('attached_items');
        var _attachedFileUrls = null;
        var attachedFileUrlCount = _getSafeNumberData(questionnaireData.attachedCount);
        if (questionnaireData.attachedItems == null) {
            _attachedFileUrls = new Array();
        } else {
            _attachedFileUrls = questionnaireData.attachedItems;
        }
        _attachedItemsElem.attr({
            'count' : '' + attachedFileUrlCount,
        });
        for ( var _i = 0; _i < attachedFileUrlCount; _i++) {
            _attachedItemsElem.node('item').text(_attachedFileUrls[_i]);
        }

        return _contentElem;
    };

    function _getPublicDataContentXmppElem(publicData, fromJid) {
        _log.connectionLog(7, 'do func Xmpp._getPublicDataContentXmppElem(...');
        var _doc = libxml.Document();
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Public'
        });
        _contentElem.node('msgtype').text('' + _getSafeNumberData(1));
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        _contentElem.node('thread_title').text(_getSafeStringData(publicData.threadTitle));
        if(publicData.quotationItemId != undefined &&
           publicData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(publicData.quotationItemId));
        }
        var _entryElem = _contentElem.node('entry');
        _entryElem.node('body').text(_getSafeStringData(publicData.body));
        if(publicData.bodyType){
            _contentElem.node('body_type').text(
                _getSafeNumberData(publicData.bodyType));
        }else{
            _contentElem.node('body_type').text("0");
        }
        var _attachedItemsElem = _contentElem.node('attached_items');
        var _attachedFileUrls = null;
        var attachedFileUrlCount = _getSafeNumberData(publicData.attachedCount);
        if (publicData.attachedItems == null) {
            _attachedFileUrls = new Array();
        } else {
            _attachedFileUrls = publicData.attachedItems;
        }
        _attachedItemsElem.attr({
            'count' : '' + attachedFileUrlCount,
        });
        for ( var _i = 0; _i < attachedFileUrlCount; _i++) {
            _attachedItemsElem.node('item').text(_attachedFileUrls[_i]);
        }
        _contentElem.node('reply_id').text(
                _getSafeStringData(publicData.replyId));
        _contentElem.node('context').text(
                _getSafeStringData(publicData.context));

        return _contentElem;
    }

    function _getGroupChatDataContentXmppElem(groupChatData, fromJid) {
        _log.connectionLog(7, 'do func Xmpp._getGroupChatDataContentXmppElem(...');
        var _doc = libxml.Document();
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'GroupChat'
        });
        _contentElem.node('msgtype').text('' + 3);
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        _contentElem.node('msgto').text(
                _getSafeStringData(groupChatData.roomId));
        _contentElem.node('body_type').text(
            _getSafeStringData(''+groupChatData.bodyType));
        _contentElem.node('thread_title').text(_getSafeStringData(groupChatData.threadTitle));
        if(groupChatData.quotationItemId != undefined &&
           groupChatData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(groupChatData.quotationItemId));
        }
        var _entryElem = _contentElem.node('entry');
        _entryElem.node('body').text(_getSafeStringData(groupChatData.body));
        var _attachedItemsElem = _contentElem.node('attached_items');
        var _attachedFileUrls = null;
        var attachedFileUrlCount = _getSafeNumberData(groupChatData.attachedCount);
        if (groupChatData.attachedItems == null) {
            _attachedFileUrls = new Array();
        } else {
            _attachedFileUrls = groupChatData.attachedItems;
        }
        _attachedItemsElem.attr({
            'count' : '' + attachedFileUrlCount,
        });
        for ( var _i = 0; _i < attachedFileUrlCount; _i++) {
            _attachedItemsElem.node('item').text(_attachedFileUrls[_i]);
        }
        _contentElem.node('reply_id').text(
                _getSafeStringData(groupChatData.replyId));
        _contentElem.node('reply_to').text(
                _getSafeStringData(groupChatData.replyTo));
        _contentElem.node('context').text(
                _getSafeStringData(groupChatData.context));

        return _contentElem;
    }

    function _getCommunityMessageDataContentXmppElem(communityMessageData,
            fromJid) {
        _log.connectionLog(7, 'do func Xmpp._getCommunityMessageDataContentXmppElem(...');
        var _doc = libxml.Document();
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Community'
        });
        _contentElem.node('msgtype').text('' + 5);
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        _contentElem.node('msgto').text(
                _getSafeStringData(communityMessageData.roomId));
        var _entryElem = _contentElem.node('entry');
        _entryElem.node('body').text(
                _getSafeStringData(communityMessageData.body));
        var _attachedItemsElem = _contentElem.node('attached_items');
        var _attachedFileUrls = null;
        var attachedFileUrlCount = _getSafeNumberData(communityMessageData.attachedCount);
        if (communityMessageData.attachedItems == null) {
            _attachedFileUrls = new Array();
        } else {
            _attachedFileUrls = communityMessageData.attachedItems;
        }
        _attachedItemsElem.attr({
            'count' : '' + attachedFileUrlCount,
        });
        for ( var _i = 0; _i < attachedFileUrlCount; _i++) {
            _attachedItemsElem.node('item').text(_attachedFileUrls[_i]);
        }
        _contentElem.node('reply_id').text(
                _getSafeStringData(communityMessageData.replyId));
        _contentElem.node('reply_to').text(
                _getSafeStringData(communityMessageData.replyTo));
        _contentElem.node('body_type').text(
                _getSafeStringData('' + communityMessageData.bodyType));
        _contentElem.node('thread_title').text(_getSafeStringData(communityMessageData.threadTitle));
        if(communityMessageData.quotationItemId != undefined &&
           communityMessageData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(communityMessageData.quotationItemId));
        }
        _contentElem.node('context').text(
                _getSafeStringData(communityMessageData.context));

        return _contentElem;
    }

    function _getMurmurDataContentXmppElem(murmurMessageData,
                                           fromJid) {
        _log.connectionLog(7, 'do func Xmpp._getMurmurDataContentXmppElem(...');
        var _doc = libxml.Document();
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Murmur'
        });
        _contentElem.node('msgtype').text('11');
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        _contentElem.node('msgto').text(_getSafeStringData(fromJid));
        var _entryElem = _contentElem.node('entry');
        _entryElem.node('body').text(
                _getSafeStringData(murmurMessageData.body));
        var _attachedItemsElem = _contentElem.node('attached_items');
        var _attachedFileUrls = null;
        var attachedFileUrlCount = _getSafeNumberData(murmurMessageData.attachedCount);
        if (murmurMessageData.attachedItems == null) {
            _attachedFileUrls = new Array();
        } else {
            _attachedFileUrls = murmurMessageData.attachedItems;
        }
        _attachedItemsElem.attr({
            'count' : '' + attachedFileUrlCount,
        });
        for ( var _i = 0; _i < attachedFileUrlCount; _i++) {
            _attachedItemsElem.node('item').text(_attachedFileUrls[_i]);
        }
        _contentElem.node('reply_id').text(
                _getSafeStringData(murmurMessageData.replyId));
        _contentElem.node('reply_to').text(
                _getSafeStringData(murmurMessageData.replyTo));
        _contentElem.node('body_type').text(
                _getSafeStringData('' + murmurMessageData.bodyType));
        _contentElem.node('thread_title').text(_getSafeStringData(murmurMessageData.threadTitle));
        if(murmurMessageData.quotationItemId != undefined &&
           murmurMessageData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(murmurMessageData.quotationItemId));
        }
        _contentElem.node('context').text(
                _getSafeStringData(murmurMessageData.context));

        return _contentElem;
    }

    function _getTaskDataContentXmppElem(taskData, fromJid,
            toXmppServerHostName) {
        _log.connectionLog(7, 'do func Xmpp._getTaskDataContentXmppElem(...');
        var _doc = libxml.Document();
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Task'
        });
        _contentElem.node('msgtype').text('' + 4);
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        _contentElem.node('msgto').text(
                _getSafeStringData(toXmppServerHostName));
        var _entryElem = _contentElem.node('entry');
        _entryElem.node('title').text(_getSafeStringData(taskData.title));
        _entryElem.node('body').text(_getSafeStringData(taskData.body));
        _entryElem.node('progress').text(
                '' + _getSafeNumberData(taskData.progress));
        _entryElem.node('spent_time').text(
                '' + _getSafeNumberData(taskData.spentTime));
        _entryElem.node('estimated_time').text(
                '' + _getSafeNumberData(taskData.estimatedTime));
        _entryElem.node('remaining_time').text(
                '' + _getSafeNumberData(taskData.remainingTime));
        _entryElem.node('goal').text(_getSafeStringData(taskData.goal));
        _entryElem.node('alert').text('' + _getSafeNumberData(taskData.alert));
        _contentElem.node('priority').text(
                '' + _getSafeNumberData(taskData.priority));
        _contentElem.node('reply_id')
                .text(_getSafeStringData(taskData.replyId));
        _contentElem.node('reply_to')
                .text(_getSafeStringData(taskData.replyTo));
        _contentElem.node('start_date').text(
                _getSafeStringData(taskData.startDate));
        _contentElem.node('due_date')
                .text(_getSafeStringData(taskData.dueDate));
        _contentElem.node('owner').text(_getSafeStringData(taskData.owner));
        _contentElem.node('group').text(_getSafeStringData(taskData.group));
        _contentElem.node('status').text(
                '' + _getSafeNumberData(taskData.status));
        _contentElem.node('client').text(_getSafeStringData(taskData.client));
        if(taskData.quotationItemId != undefined &&
           taskData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(taskData.quotationItemId));
        }
        _contentElem.node('context').text(_getSafeStringData(taskData.context));
        _contentElem.node('parent_item_id').text(
                _getSafeStringData(taskData.parentItemId));
        var _attachedItemsElem = _contentElem.node('attached_items');
        var _attachedFileUrls = null;
        var attachedFileUrlCount = _getSafeNumberData(taskData.attachedCount);
        if (taskData.attachedItems == null) {
            _attachedFileUrls = new Array();
        } else {
            _attachedFileUrls = taskData.attachedItems;
        }
        _attachedItemsElem.attr({
            'count' : '' + attachedFileUrlCount,
        });
        for ( var _i = 0; _i < attachedFileUrlCount; _i++) {
            _attachedItemsElem.node('item').text(_attachedFileUrls[_i]);
        }

        return _contentElem;
    }

    var CONDITION_TYPE_AND = 'and';
    var CONDITION_TYPE_OR = 'or';
    var CONDITION_TYPE_NOT = 'not';
    var CONDITION_TYPE_ITEM = 'item';
    var CONDITION_TYPE_GREATER_THAN = 'greaterthan';
    var CONDITION_TYPE_LESS_THAN = 'lessthan';
    var CONDITION_TYPE_KEYWORD = 'keyword';
    var CONDITION_TYPE_PARTICULAR = 'particular';

    function _getFilterConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterConditionXmppElem(...');
        if (condition == null) {
            return;
        }
        if (condition.type == null) {
            return;
        }
        switch (condition.type) {
        case CONDITION_TYPE_AND:
            _getFilterAndConditionXmppElem(parentElem, condition);
            break;
        case CONDITION_TYPE_OR:
            _getFilterOrConditionXmppElem(parentElem, condition);
            break;
        case CONDITION_TYPE_NOT:
            _getFilterNotConditionXmppElem(parentElem, condition);
            break;
        case CONDITION_TYPE_ITEM:
            _getFilterItemConditionXmppElem(parentElem, condition);
            break;

        case CONDITION_TYPE_GREATER_THAN:
            _getFilterGreaterThanConditionXmppElem(parentElem, condition);
            break;

        case CONDITION_TYPE_LESS_THAN:
            _getFilterLessThanConditionXmppElem(parentElem, condition);
            break;

        case CONDITION_TYPE_KEYWORD:
            _getFilterKeywordConditionXmppElem(parentElem, condition);
            break;

        case CONDITION_TYPE_PARTICULAR:
            _getFilterParticularConditionXmppElem(parentElem, condition);
            break;

        default:
            break;
        }
        return;
    }
    function _getFilterAndConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterAndConditionXmppElem(...');
        if (condition == null) {
            return;
        }
        if (condition.type == null || condition.type != CONDITION_TYPE_AND) {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (!(_value instanceof Array)) {
            return;
        }
        var _count = _value.length;
        if (_count == null || _count < 2) {
            return;
        }
        var _andElem = parentElem.node('and');
        for ( var _i = 0; _i < _count; _i++) {
            var _childCondition = _value[_i];
            _getFilterConditionXmppElem(_andElem, _childCondition);
        }
    }
    function _getFilterOrConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterOrConditionXmppElem(...');
        if (condition == null) {
            return;
        }
        if (condition.type == null || condition.type != CONDITION_TYPE_OR) {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (!(_value instanceof Array)) {
            return;
        }
        var _count = _value.length;
        if (_count == null || _count < 2) {
            return;
        }
        var _orElem = parentElem.node('or');
        for ( var _i = 0; _i < _count; _i++) {
            var _childCondition = _value[_i];
            var _childConditionXmppElem = _getFilterConditionXmppElem(_orElem,
                    _childCondition);
        }
    }
    function _getFilterNotConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterNotConditionXmppElem(...');
        if (condition == null) {
            return;
        }
        if (condition.type == null || condition.type != CONDITION_TYPE_NOT) {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (_value instanceof Array) {
            return;
        }
        if (!(_value instanceof Object)) {
            return;
        }
        var _notElem = parentElem.node('not');
        _getFilterConditionXmppElem(_notElem, _value);
    }
    function _getFilterItemConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterItemConditionXmppElem(...');
        if (condition == null) {
            return;
        }
        if (condition.type == null || condition.type != CONDITION_TYPE_ITEM) {
            return;
        }
        var _name = condition.name;
        if (_name == null || typeof _name != 'string') {
            return;
        }
        _name = Utils.trim(_name);
        if (_name == '') {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (_value instanceof Array) {
            return;
        }
        if (_value instanceof Object) {
            return;
        }
        var _itemElem = parentElem.node('item');
        if (typeof _value == 'string') {
            _itemElem.attr({
                'name' : _name,
                'type' : 'string'
            });
        } else if (typeof _value == 'number') {
            _itemElem.attr({
                'name' : _name,
                'type' : 'number'
            });
        } else {
            return;
        }
        _itemElem.text('' + _value);
    }
    function _getFilterGreaterThanConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterGreaterThanConditionXmppElem(...');
        if (condition == null) {
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem condition is not allow null');
            return;
        }
        if (condition.type == null
                || condition.type != CONDITION_TYPE_GREATER_THAN) {
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem condition.type is invalid');
            return;
        }
        var _name = condition.name;
        if (_name == null || typeof _name != 'string') {
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem condition.name is invalid');
            return;
        }
        _name = Utils.trim(_name);
        if (_name == '') {
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem  condition.name is not allow empty');
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem  _value is not allow null');
            return;
        }
        if (_value instanceof Array) {
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem  _value is not allow array');
            return;
        }
        if (_value instanceof Object) {
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem  _value is not allow object');
            return;
        }
        var _greaterThanElem = parentElem.node('greaterthan');
        if (typeof _value == 'string') {
            _greaterThanElem.attr({
                'name' : _name,
                'type' : 'string'
            });
        } else if (typeof _value == 'number') {
            _greaterThanElem.attr({
                'name' : _name,
                'type' : 'number'
            });
        } else {
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem  _value is not allow');
            return;
        }
        _greaterThanElem.text('' + _value);
    }
    function _getFilterLessThanConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterLessThanConditionXmppElem(...');
        if (condition == null) {
            return;
        }
        if (condition.type == null
                || condition.type != CONDITION_TYPE_LESS_THAN) {
            return;
        }
        var _name = condition.name;
        if (_name == null || typeof _name != 'string') {
            return;
        }
        _name = Utils.trim(_name);
        if (_name == '') {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (_value instanceof Array) {
            return;
        }
        if (_value instanceof Object) {
            return;
        }
        var _lessThanElem = parentElem.node('lessthan');
        if (typeof _value == 'string') {
            _lessThanElem.attr({
                'name' : _name,
                'type' : 'string'
            });
        } else if (typeof _value == 'number') {
            _lessThanElem.attr({
                'name' : _name,
                'type' : 'number'
            });
        } else {
            return;
        }
        _lessThanElem.text('' + _value);
    }
    function _getFilterKeywordConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterKeywordConditionXmppElem(...');
        if (condition == null) {
            return;
        }
        if (condition.type == null || condition.type != CONDITION_TYPE_KEYWORD) {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (_value instanceof Array) {
            return;
        }
        if (_value instanceof Object) {
            return;
        }
        var _include = condition.include;
        var _includeValue = '';
        if (_include != null) {
            for ( var _i = 0; _i < _include.length; _i++) {
                if (_i > 0) {
                    _includeValue += ' ';
                }
                _includeValue += _include[_i];
            }
        }
        var _keywordElem = parentElem.node('keyword');
        _keywordElem.text('' + _value);
        _keywordElem.attr({
            'include' : _includeValue
        });
    }
    function _getFilterParticularConditionXmppElem(parentElem, condition) {
        _log.connectionLog(7, 'do func Xmpp._getFilterParticularConditionXmppElem(...');
        if (condition == null) {
            return;
        }
        if (condition.type == null
                || condition.type != CONDITION_TYPE_PARTICULAR) {
            return;
        }
        var _name = condition.name;
        if (_name == null || typeof _name != 'string') {
            return;
        }
        _name = Utils.trim(_name);
        if (_name == '') {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (_value instanceof Array) {
            return;
        }
        if (_value instanceof Object) {
            return;
        }
        var _particularElem = parentElem.node('particular');
        if (typeof _value == 'string') {
            _particularElem.attr({
                'name' : _name,
                'type' : 'string'
            });
        } else if (typeof _value == 'number') {
            _particularElem.attr({
                'name' : _name,
                'type' : 'number'
            });
        } else {
            return;
        }
        _particularElem.text('' + _value);
    }
    Xmpp.createAddGoodJobXmpp = function(xmppServerHostName, fromJid, itemId) {
        _log.connectionLog(7, 'do func Xmpp.createAddGoodJobXmpp(...');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'addGoodJob' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _goodJobElem = _iqElem.node('goodJob');
        _goodJobElem.namespace('http://necst.nec.co.jp/protocol/goodjob');
        var _itemElem = _goodJobElem.node('item');
        _itemElem.attr({
            'itemid' : itemId,
        });

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createAddEmotionPointXmpp = function(xmppServerHostName, fromJid, itemId, emotionPoint) {
        _log.connectionLog(7, 'do func Xmpp.createAddEmotionPointXmpp(...');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'addEmotionPoint' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _emotionPointElem = _iqElem.node('emotionPoint');
        _emotionPointElem.namespace('http://necst.nec.co.jp/protocol/emotionpoint');
        var _itemElem = _emotionPointElem.node('item');
        _itemElem.attr({
            'itemid' : itemId,
            'emotion_point' : emotionPoint,
        });

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createDemandTask = function(xmppServerHostName, fromJid,
            demandTaskRequestData) {
        _log.connectionLog(7, 'do func Xmpp.createDemandTask(...');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'createDemandTask' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(demandTaskRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem.text(_getSafeStringData(demandTaskRequestData.itemId));
        var _clearConditionElem = _itemElm.node('clear_condition');
        _clearConditionElem
                .text(_getSafeStringData(demandTaskRequestData.clearCondition));
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createClearDemandedTask = function(xmppServerHostName, fromJid,
            demandTaskRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'createClearDemandedTask' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(demandTaskRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem.text(_getSafeStringData(demandTaskRequestData.itemId));
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.getExistingReaderList = function(xmppServerHostName, fromJid,
            getExistingReaderListRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getExistingReaderList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem
                .text(_getSafeStringData(getExistingReaderListRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem
                .text(_getSafeStringData(getExistingReaderListRequestData.itemId));
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createSetReadMessage = function(xmppServerHostName, fromJid,
            setReadMessageData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'setReadMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(setReadMessageData.type));
        var _itemsElem = _contentElem.node('items');
        var _items = setReadMessageData.items;
        var _itemsCount = _items.length;
        _itemsElem.attr({
            'count' : '' + _itemsCount,
        });
        for ( var _i = 0; _i < _itemsCount; _i++) {
            var _item = _items[_i];
            var _itemElm = _itemsElem.node('item');
            var _itemIdElem = _itemElm.node('item_id');
            _itemIdElem.text(_getSafeStringData(_item.itemId));
        }

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.getGoodJobList = function(xmppServerHostName, fromJid,
            getGoodJobListRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getGoodJobList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getGoodJobListRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem.text(_getSafeStringData(getGoodJobListRequestData.itemId));
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.getGoodJobTotal = function(xmppServerHostName, fromJid,
                                    getGoodJobTotalRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getGoodJobTotal' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getGoodJobTotalRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');

        let jid = fromJid;
        if(getGoodJobTotalRequestData.jid != undefined &&
           getGoodJobTotalRequestData.jid != null){
            jid = getGoodJobTotalRequestData.jid;
        }
        var _jidElem = _itemElm.node('jid');
        _jidElem.text(_getSafeStringData(jid));
        var _dateFromElem = _itemElm.node('date_from');
        _dateFromElem.text(_getSafeStringData(getGoodJobTotalRequestData.dateFrom));
        var _dateToElem = _itemElm.node('date_to');
        _dateToElem.text(_getSafeStringData(getGoodJobTotalRequestData.dateTo));

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.getGoodJobRanking = function(xmppServerHostName, fromJid,
                                      getGoodJobRankingRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getGoodJobRanking' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getGoodJobRankingRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');

        var _dateFromElem = _itemElm.node('date_from');
        _dateFromElem.text(_getSafeStringData(getGoodJobRankingRequestData.dateFrom));
        var _dateToElem = _itemElm.node('date_to');
        _dateToElem.text(_getSafeStringData(getGoodJobRankingRequestData.dateTo));
        var _rankBottomElem = _itemElm.node('rank_bottom');
        if(getGoodJobRankingRequestData.rankBottom == undefined ||
           getGoodJobRankingRequestData.rankBottom == null ||
           typeof getGoodJobRankingRequestData.rankBottom != 'number'){
            _rankBottomElem.text(-1);
        }else{
            _rankBottomElem.text(getGoodJobRankingRequestData.rankBottom);
        }
        var _limitElem = _itemElm.node('limit');
        if(getGoodJobRankingRequestData.limit == undefined ||
           getGoodJobRankingRequestData.limit == null ||
           typeof getGoodJobRankingRequestData.limit != 'number'){
            _limitElem.text(-1);
        }else{
            _limitElem.text(getGoodJobRankingRequestData.limit);
        }
        var _offsetElem = _itemElm.node('offset');
        if(getGoodJobRankingRequestData.offset == undefined ||
           getGoodJobRankingRequestData.offset == null ||
           typeof getGoodJobRankingRequestData.offset != 'number'){
            _offsetElem.text(-1);
        }else{
            _offsetElem.text(getGoodJobRankingRequestData.offset);
        }

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.getEmotionPointList = function(xmppServerHostName, fromJid,
                                        getEmotionPointListRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getEmotionPointList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getEmotionPointListRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem.text(_getSafeStringData(getEmotionPointListRequestData.itemId));
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.getEmotionPointTotal = function(xmppServerHostName, fromJid,
                                         getEmotionPointTotalRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getEmotionPointTotal' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getEmotionPointTotalRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');

        let jid = fromJid;
        if(getEmotionPointTotalRequestData.jid != undefined &&
           getEmotionPointTotalRequestData.jid != null){
            jid = getEmotionPointTotalRequestData.jid;
        }
        var _jidElem = _itemElm.node('jid');
        _jidElem.text(_getSafeStringData(jid));
        var _dateFromElem = _itemElm.node('date_from');
        _dateFromElem.text(_getSafeStringData(getEmotionPointTotalRequestData.dateFrom));
        var _dateToElem = _itemElm.node('date_to');
        _dateToElem.text(_getSafeStringData(getEmotionPointTotalRequestData.dateTo));

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.getEmotionPointRanking = function(xmppServerHostName, fromJid,
                                           getEmotionPointRankingRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getEmotionPointRanking' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getEmotionPointRankingRequestData.type));
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        var _itemElm = _itemsElm.node('item');

        var _dateFromElem = _itemElm.node('date_from');
        _dateFromElem.text(_getSafeStringData(getEmotionPointRankingRequestData.dateFrom));
        var _dateToElem = _itemElm.node('date_to');
        _dateToElem.text(_getSafeStringData(getEmotionPointRankingRequestData.dateTo));
        var _rankBottomElem = _itemElm.node('rank_bottom');
        if(getEmotionPointRankingRequestData.rankBottom == undefined ||
           getEmotionPointRankingRequestData.rankBottom == null ||
           typeof getEmotionPointRankingRequestData.rankBottom != 'number'){
            _rankBottomElem.text(-1);
        }else{
            _rankBottomElem.text(getEmotionPointRankingRequestData.rankBottom);
        }
        var _limitElem = _itemElm.node('limit');
        if(getEmotionPointRankingRequestData.limit == undefined ||
           getEmotionPointRankingRequestData.limit == null ||
           typeof getEmotionPointRankingRequestData.limit != 'number'){
            _limitElem.text(-1);
        }else{
            _limitElem.text(getEmotionPointRankingRequestData.limit);
        }
        var _offsetElem = _itemElm.node('offset');
        if(getEmotionPointRankingRequestData.offset == undefined ||
           getEmotionPointRankingRequestData.offset == null ||
           typeof getEmotionPointRankingRequestData.offset != 'number'){
            _offsetElem.text(-1);
        }else{
            _offsetElem.text(getEmotionPointRankingRequestData.offset);
        }

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createDeleteMessageXmpp = function(xmppServerHostName, fromJid,
            messageData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'deleteMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/delete');
        var _contentElem = _messageElem.node('content');
        var _itemidElem = _contentElem.node('item_id');
        _itemidElem.text(messageData.itemId);
        var _deleteflagElem = _contentElem.node('delete_flag');
        _deleteflagElem.text(messageData.deleteFlag);
        var _typeElem = _contentElem.node('type');
        _typeElem.text(messageData.type);

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createCreateGroupChatRoomXmpp = function(xmppServerHostName, fromJid,
            groupChatRoomData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'createGroupChatRoom' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem.namespace('http://necst.nec.co.jp/protocol/createchatroom');
        var _contentElem = _groupElem.node('content');
        var _roomNameElem = _contentElem.node('roomname');
        _roomNameElem.text(_getSafeStringData(groupChatRoomData.roomName));
        var _parentRoomIdElem = _contentElem.node('parentroomid');
        _parentRoomIdElem.text(_getSafeStringData(groupChatRoomData.parentRoomId));
        var _privacyTypeElem = _contentElem.node('privacytype');
        if(groupChatRoomData.privacyType != undefined &&
           (""+groupChatRoomData.privacyType).match(/^\d+$/)){
            _privacyTypeElem.text(groupChatRoomData.privacyType);
        }else{
            _privacyTypeElem.text("2");
        }
        var _membersElem = _contentElem.node('members');
        var _members = groupChatRoomData.memberItems;
        var _memberCount = 0;
        if ((_members instanceof Array) && _members.length > 0) {
            _memberCount = _members.length;
        }
        _membersElem.attr({
            'count' : '' + _memberCount
        });
        for ( var _i = 0; _i < _memberCount; _i++) {
            var _memberElem = _membersElem.node('member');
            _memberElem.text(_getSafeStringData(_members[_i]));
        }
        if(groupChatRoomData.notifyType != undefined) {
            var _notifyTypeElem = _contentElem.node('notify_type');
            _notifyTypeElem.text(groupChatRoomData.notifyType);
        }

        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createGetGroupChatRoomInfoXmpp = function(xmppServerHostName, fromJid,
            roomId) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getGroupChatRoomInfo' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem.namespace('http://necst.nec.co.jp/protocol/getchatroominfo');
        var _contentElem = _groupElem.node('content');
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem.text(_getSafeStringData(roomId));
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createGetGroupChatRoomListXmpp = function(xmppServerHostName, fromJid,
            groupChatRoomListRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getGroupChatRoomList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/getgroupchatlist');
        var _contentElem = _groupElem.node('content');

        var _parentRoomIdElem = _contentElem.node('parentroomid');
        if(groupChatRoomListRequestData.parentRoomId == undefined){
            _parentRoomIdElem.remove();
        }else{
            _parentRoomIdElem
                .text(groupChatRoomListRequestData.parentRoomId);
        }
        if(groupChatRoomListRequestData.privacyType != undefined &&
           typeof groupChatRoomListRequestData.privacyType === 'number'){
            var _privacyTypeElem = _contentElem.node('privacytype');
            _privacyTypeElem
                .text(_getSafeNumberData(groupChatRoomListRequestData.privacyType));
        }

        if(groupChatRoomListRequestData.listType != undefined &&
           typeof groupChatRoomListRequestData.listType === 'number'){
            var _listTypeElem = _contentElem.node('listtype');
            _listTypeElem
                .text(_getSafeNumberData(groupChatRoomListRequestData.listType));
        }

        var _startIdElem = _contentElem.node('startid');
        _startIdElem
                .text(_getSafeNumberData(groupChatRoomListRequestData.startId));
        var _countElem = _contentElem.node('count');
        _countElem.text(_getSafeNumberData(groupChatRoomListRequestData.count));
        var _conditionElem = _contentElem.node('condition');
        var _conditionRequestData = groupChatRoomListRequestData.condition;
        if (_conditionRequestData == null) {
            return [ '', '' ];
        }
        var _sortElem = _conditionElem.node('sort');
        var _sortRequestData = _conditionRequestData.sort;
        if (_sortRequestData == null) {
            return [ '', '' ];
        }
        var _sortItem = _sortRequestData.item;
        if (_sortItem == null || typeof _sortItem != 'string'
                || _sortItem == '') {
            return [ '', '' ];
        }
        _sortElem.node('item').text(_getSafeStringData(_sortItem));
        var _sortOrder = _sortRequestData.order;
        if (_sortOrder == null || typeof _sortOrder != 'string'
                || _sortOrder == '') {
            return [ '', '' ];
        }
        _sortElem.node('order').text(_getSafeStringData(_sortOrder));
        return [ _iqElem.toString(), _id ];
    };

    Xmpp.createAddGroupChatMemberXmpp = function(xmppServerHostName, fromJid,
            addGroupChatMemberRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'addGroupChatMember' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/addchatroommember');
        var _contentElem = _groupElem.node('content');
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(addGroupChatMemberRequestData.roomId));
        var _memberElem = _contentElem.node('member');
        _memberElem
                .text(_getSafeStringData(addGroupChatMemberRequestData.member));
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createUpdateGroupChatRoomInfo = function(xmppServerHostName, fromJid,
            updateGroupChatRoomInfoData) {
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'UpdateGroupChatRoomInfo' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'to' : xmppServerHostName,
            'id' : _id,
            'from' : fromJid,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/updatechatroominfo');
        var _contentElem = _groupElem.node('content');
        var _extras = updateGroupChatRoomInfoData.extras;
        if (_extras == null) {
            return [ '', '' ];
        }
        var _extrasElem = _contentElem.node('extras');
        var _subType = _extras.subType;
        if (_subType == null) {
            return [ '', '' ];
        }
        var _subTypeElem = _extrasElem.node('subtype');
        var _subTypeCount = 0;
        if ((_subType instanceof Array) && _subType.length > 0) {
            _subTypeCount = _subType.length;
        }
        for ( var _i = 0; _i < _subTypeCount; _i++) {
            var _itemElem = _subTypeElem.node('item');
            _itemElem.text(_getSafeStringData(_subType[_i]));
        }
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(updateGroupChatRoomInfoData.roomId));
        if(updateGroupChatRoomInfoData.roomName != undefined) {
            var _roomnameElem = _contentElem.node('roomname');
            _roomnameElem
                .text(_getSafeStringData(updateGroupChatRoomInfoData.roomName));
        }

        if(updateGroupChatRoomInfoData.privacyType != undefined &&
           typeof updateGroupChatRoomInfoData.privacyType === 'number'){
            var _privacyTypeElem = _contentElem.node('privacytype');
            _privacyTypeElem
                .text(_getSafeNumberData(updateGroupChatRoomInfoData.privacyType));
        }

        if(updateGroupChatRoomInfoData.notifyType != undefined) {
            var _notifyTypeElem = _contentElem.node('notify_type');
            _notifyTypeElem.text(updateGroupChatRoomInfoData.notifyType);
        }

        return [ _iqElem.toString(), _id ];

    };
    Xmpp.createDeleteGroupChatRoomInfo = function(xmppServerHostName, fromJid,
            deleteGroupChatRoomInfoData) {
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'DeleteGroupChatRoom' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'to' : xmppServerHostName,
            'id' : _id,
            'from' : fromJid,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/deletechatroom');
        var _contentElem = _groupElem.node('content');
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(deleteGroupChatRoomInfoData.roomId));

        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createRemoveGroupChatMemberXmpp = function(xmppServerHostName,
            fromJid, removeMemberRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'RemoveGroupChatMember' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/removegroupchatmember');
        var _contentElem = _groupElem.node('content');
        _contentElem.node('roomid').text(
                _getSafeStringData(removeMemberRequestData.roomId));
        _contentElem.node('removetype').text(
                _getSafeStringData(removeMemberRequestData.removeType));
        var _membersElem = _contentElem.node('members');
        var _members = removeMemberRequestData.members;
        var _membersCount = _members.length;
        for ( var _i = 0; _i < _membersCount; _i++) {
            _membersElem.node('member').text(_getSafeStringData(_members[_i]));
        }

        _membersElem.attr({
            count : _membersCount
        });

        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createSetMailCooperationSettings = function(xmppServerHostName,
            fromJid, mailSettingData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'setMailCooperationSettings' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _items = mailSettingData.items;
        var _mailElem = _iqElem.node('mail');
        _mailElem.namespace('http://necst.nec.co.jp/protocol/setsettings');
        var _contentElem = _mailElem.node('content');
        var _itemsElem = _contentElem.node('items');
        var _itemsCount = _items.length;
        _itemsElem.attr({
            'count' : '' + _itemsCount,
        });
        for ( var _i = 0; _i < _itemsCount; _i++) {
            var _item = _items[_i];
            var _itemElm = _itemsElem.node('item');
            var _idElem = _itemElm.node('id');
            _idElem.text(_getSafeNumberData(_item.id));
            var _branchNumberElem = _itemElm.node('branch_number');
            _branchNumberElem.text(_getSafeNumberData(_item.branchNumber));
            var _mailAddressElem = _itemElm.node('mail_address');
            _mailAddressElem.text(_getSafeStringData(_item.mailAddress));
            var _severIdElem = _itemElm.node('server_id');
            _severIdElem.text(_getSafeNumberData(_item.serverId));
            var _mailCooperationTypeElem = _itemElm
                    .node('mail_cooperation_type');
            _mailCooperationTypeElem
                    .text(_getSafeNumberData(_item.mailCooperationType));
            var _settingInfoElem = _getMailCooperationSettingInfoElem(_itemElm,
                    _item);
        }
        return [ _iqElem.toString(), _id ];
    };
    function _getMailCooperationSettingInfoElem(contentElem, mailSettingData) {
        var _settingInfoElem = contentElem.node('setting_info');
        var _settingInfo = mailSettingData.settingInfo;
        if (_settingInfo == null || _settingInfo.length == 0) {
            return _settingInfoElem;
        }
        var _popServer = _settingInfo.popServer;
        if (_popServer == null || _popServer.length == 0) {
            return _settingInfoElem;
        }
        var _popElem = _settingInfoElem.node('pop_server');
        var _mailAccountElem = _popElem.node('mail_account');
        _mailAccountElem.text(_getSafeStringData(_popServer.mailAccount));
        var _mailPasswordElem = _popElem.node('mail_password');
        _mailPasswordElem.text(_getSafeStringData(_popServer.mailPassword));
        return _settingInfoElem;
    }

    Xmpp.createGetMailServerListXmpp = function(xmppServerHostName, fromJid) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getMailServerList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _mailElem = _iqElem.node('mail');
        _mailElem.namespace('http://necst.nec.co.jp/protocol/getserverlist');
        var _contentElem = _mailElem.node('content');
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetMailCooperationSettingsXmpp = function(xmppServerHostName,
            fromJid) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'GetMailCooperationSetting' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _mailElem = _iqElem.node('mail');
        _mailElem.namespace('http://necst.nec.co.jp/protocol/getsettings');
        var _contentElem = _mailElem.node('content');
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetAllUserMailSettingsXmpp = function(xmppServerHostName,
            fromJid) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'GetAllUserMailSettings' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _mailElem = _iqElem.node('mail');
        _mailElem
                .namespace('http://necst.nec.co.jp/protocol/getallusersettings');
        var _contentElem = _mailElem.node('content');
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetMailBodyXmpp = function(xmppServerHostName, fromJid, itemId) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'GetMailBody' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/getmailbody');
        var _contentElem = _messageElem.node('content');
        _contentElem.node('item_id').text(_getSafeStringData(itemId));

        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetThreadMessageXmpp = function(xmppServerHostName, fromJid,
            itemId) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'GetThreadMessage' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/threadmessage');
        var _contentElem = _messageElem.node('content');
        _contentElem.node('item_id').text(_getSafeStringData(itemId));

        return [ _iqElem.toString(), _id ];
    };
    Xmpp.getMessageCountXmpp = function(xmppServerHostName, fromJid,
            messageCountInfoData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'GetMessageCount' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/getcount');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type').text(
                _getSafeStringData(messageCountInfoData.type));
        var _conditionElem = _contentElem.node('condition');
        var _filterElem = _conditionElem.node('filter');
        var _conditionData = messageCountInfoData.condition;
        if (_conditionData == null) {
            return [ '', '' ];
        }
        var _filterInfo = _conditionData.filter;
        if (_filterInfo == null) {
            return [ '', '' ];
        }
        _getFilterConditionXmppElem(_filterElem, _filterInfo);

        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createAddCommunityMemberXmpp = function(xmppServerHostName, fromJid,
            addCommunityMemberRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'addCommunityMemberXmpp' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/addcommunitymember');
        var _contentElem = _groupElem.node('content');
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(addCommunityMemberRequestData.roomId));
        var _membersElem = _contentElem.node('members');
        var _memberItems = addCommunityMemberRequestData.members;
        var _memberItemsCount = _memberItems.length;
        for ( var _i = 0; _i < _memberItemsCount; _i++) {
            _membersElem.node('member').text(
                    _getSafeStringData(_memberItems[_i]));
        }

        _membersElem.attr({
            count : _memberItemsCount
        });
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createUpdateCommunityOwnerXmpp = function(xmppServerHostName, fromJid,
            communityOwnerRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'UpdateCommunityMember' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/updatecommunityowner');
        var _contentElem = _groupElem.node('content');
        _contentElem.node('roomid').text(
                _getSafeStringData(communityOwnerRequestData.roomId));
        var _ownersElem = _contentElem.node('owners');
        var _ownerItems = communityOwnerRequestData.ownerItems;
        var _ownerItemsCount = _ownerItems.length;
        for ( var _i = 0; _i < _ownerItemsCount; _i++) {
            _ownersElem.node('owner').text(_getSafeStringData(_ownerItems[_i]));
        }

        _ownersElem.attr({
            count : _ownerItemsCount
        });

        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createRemoveCommunityMemberXmpp = function(xmppServerHostName,
            fromJid, removeMemberRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'RemoveCommunityMember' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/removecommunitymember');
        var _contentElem = _groupElem.node('content');
        _contentElem.node('roomid').text(
                _getSafeStringData(removeMemberRequestData.roomId));
        var _membersElem = _contentElem.node('members');
        var _members = removeMemberRequestData.members;
        var _membersCount = _members.length;
        for ( var _i = 0; _i < _membersCount; _i++) {
            _membersElem.node('member').text(_getSafeStringData(_members[_i]));
        }

        _membersElem.attr({
            count : _membersCount
        });

        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createSearchPersonXmpp = function(xmppServerHostName, fromJid,
            startId, count, filter, sort, type) {
        var _doc = new libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'searchPerson' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _messageElem = _iqElem.node('person');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/searchperson');
        var _contentElem = _messageElem.node('content');
        var _typeElem = _contentElem.node('type');
        var _type = _convertPersonSearchType(type);
        if(_type == null){
            return [null, null];
        }
        _typeElem.text(_type);
        var _conditionElem = _contentElem.node('condition');
        var _filterElem = _conditionElem.node('filter');
        _getFilterConditionXmppElem(_filterElem, filter);
        var _sortElem = _conditionElem.node('sort');
        _sortElem.node('item').text(sort.item);
        _sortElem.node('order').text(sort.order);

        _contentElem.node('startid').text('' + startId);
        _contentElem.node('count').text('' + count);
        return [ _iqElem.toString(), _id ];
    };
    function _convertPersonSearchType(type){
        var _ret = null;
        if(type == RequestData.GET_PERSON_LIST_TYPE_SEARCH_SUB_TYPE_ALL_USERS){
            _ret = 'allusers';
        }
        return _ret;
    }
    Xmpp.createRegisterDeviceInfoXmpp = function(xmppServerHostName, fromJid,
            deviceId, notificationService) {
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'RegisterDeviceInfo' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'to' : xmppServerHostName,
            'id' : _id,
            'from' : fromJid,
        });
        var _deviceInfoElem = _iqElem.node('device_info');
        _deviceInfoElem
                .namespace('http://necst.nec.co.jp/protocol/deviceinfo/register');
        var _contentElem = _deviceInfoElem.node('content');
        _contentElem.node('device_id').text(deviceId);
        _contentElem.node('notification_service').text(notificationService);
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createDeleteDeviceInfoXmpp = function(xmppServerHostName, fromJid,
            deviceId) {
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'DeleteDeviceInfo' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'to' : xmppServerHostName,
            'id' : _id,
            'from' : fromJid,
        });
        var _deviceInfoElem = _iqElem.node('device_info');
        _deviceInfoElem
                .namespace('http://necst.nec.co.jp/protocol/deviceinfo/delete');
        var _contentElem = _deviceInfoElem.node('content');
        _contentElem.node('device_id').text(deviceId);
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createRegisterUserXmpp = function(fromJid, openfireAccount,
            personData, password, registereContactData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'registerUser' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:register');
        var _userNameElem = _queryElem.node('username');
        _userNameElem.text(openfireAccount);
        var _passwordElem = _queryElem.node('password');
        _passwordElem.text(password);
        var _emailElem = _queryElem.node('email');
        _emailElem.text(personData.getMail());
        var _vCardElem = _queryElem.node('vCard');
        _vCardElem.namespace('vcard-temp');
        var _nickNameElem = _vCardElem.node('NICKNAME');
        _nickNameElem.text(personData.getNickName());
        var _groups = personData.getGroup();
        var _groupElem = _getGroupElmFromGroupArray(_queryElem, _groups);

        var _contactElem = _queryElem.node('contact');
        var _type = registereContactData.getType();
        switch (_type) {
        case RegisteredContactData.TYPE_ALL:
            _contactElem.attr({
                'type' : _type,
            });
            break;
        case RegisteredContactData.TYPE_CUSTOM:
        case RegisteredContactData.TYPE_NONE:
        default:
            _contactElem.attr({
                'type' : RegisteredContactData.TYPE_NONE,
            });
            break;
        }
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetUserAuthorityXmpp = function(fromJid) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'userAuthority' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
        });
        var _userAuthorityElem = _iqElem.node('user_authority');
        _userAuthorityElem
                .namespace('http://necst.nec.co.jp/protocol/authority');
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetAllUserListXmpp = function(xmppServerHostName, fromJid,
            tenantId) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getAllUserList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text('GetAllUserList');
        if (tenantId != null && typeof tenantId == 'string' && tenantId != '') {
            var _tenantIdElem = _contentElem.node('tenant_id');
            _tenantIdElem.text(tenantId);
        }
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetSelectUserListXmpp = function(xmppServerHostName, fromJid,
            userAcountDataList) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getSelectUserList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text('GetSelectUserList');
        var _itemsElem = _contentElem.node('items');

        if (userAcountDataList != null) {
            var _count = userAcountDataList.length;
            for ( var _i = 0; _i < _count; _i++) {
                var _itemElem = _itemsElem.node('item');
                var _openfireAccount = userAcountDataList[_i]
                        .getOpenfireAccount();
                var _xmppServerName = userAcountDataList[_i]
                        .getXmppServerName();
                var _jid = _openfireAccount + '@' + _xmppServerName;
                var _jidElem = _itemElem.node('jid');
                _jidElem.text(_jid);
            }
        }
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createUpdateVCardXmpp = function(xmppServerHostName, fromJid,
            updateVCardData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'updateVCard' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text('UpdateVCard');
        var _jid = updateVCardData.jid;
        var _jidElem = _contentElem.node('jid');
        _jidElem.text(_jid);
        var _vCardElem = _contentElem.node('vCard');
        _vCardElem.namespace('vcard-temp');
        var _nickName = updateVCardData.nickName;
        if (_nickName == null) {
            _nickName = '';
        }
        _vCardElem.node('NICKNAME').text(_nickName);
        var _photoElem = _vCardElem.node('PHOTO');
        var _photoType = updateVCardData.avatarType;
        if (_photoType == null) {
            _photoType = '';
        }
        _photoElem.node('TYPE').text(_photoType);
        var _photoBinVal = updateVCardData.avatarData;
        if (_photoBinVal == null) {
            _photoBinVal = '';
        }
        _photoElem.node('BINVAL').text(_photoBinVal);
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createCreateCommunityRoomXmpp = function(xmppServerHostName, fromJid,
            communityRoomData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'createCommunityRoom' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem.namespace('http://necst.nec.co.jp/protocol/createcommunity');
        var _contentElem = _groupElem.node('content');
        var _roomNameElem = _contentElem.node('roomname');
        _roomNameElem.text(_getSafeStringData(communityRoomData.roomName));
        var _descriptionElem = _contentElem.node('description');
        _descriptionElem
                .text(_getSafeStringData(communityRoomData.description));
        var _privacyTypeElem = _contentElem.node('privacytype');
        _privacyTypeElem.text(_getSafeStringData(''
                + communityRoomData.privacyType));
        var _memberEntryTypeElem = _contentElem.node('memberentrytype');
        _memberEntryTypeElem.text(_getSafeStringData(''
                + communityRoomData.memberEntryType));
        var _logoUrlElem = _contentElem.node('logourl');
        _logoUrlElem.text(_getSafeStringData(communityRoomData.logoUrl));
        if(communityRoomData.notifyType != undefined) {
            var _notifyTypeElem = _contentElem.node('notify_type');
            _notifyTypeElem.text(communityRoomData.notifyType);
        }
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetMyCommunityListXmpp = function(xmppServerHostName, fromJid,
            myCommunityListRequestData) {
        _log.connectionLog(7, 'do func Xmpp.createGetMyCommunityListXmpp(..');
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getMyCommunityList' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/getmycommunitylist');
        var _contentElem = _groupElem.node('content');

        if( myCommunityListRequestData.privacyType != undefined &&
            typeof myCommunityListRequestData.privacyType === 'number' ){
            var _privacyTypeElem = _contentElem.node('privacytype');
            _privacyTypeElem.text(_getSafeNumberData(myCommunityListRequestData.privacyType));
        }

        if( myCommunityListRequestData.listType != undefined &&
            typeof myCommunityListRequestData.listType === 'number' ){
            var _listTypeElem = _contentElem.node('listtype');
            _listTypeElem.text(_getSafeNumberData(myCommunityListRequestData.listType));
        }

        var _startIdElem = _contentElem.node('startid');
        _startIdElem
                .text(_getSafeNumberData(myCommunityListRequestData.startId));
        var _countElem = _contentElem.node('count');
        _countElem.text(_getSafeNumberData(myCommunityListRequestData.count));
        var _conditionElem = _contentElem.node('condition');
        var _conditionRequestData = myCommunityListRequestData.condition;
        if (_conditionRequestData == null) {
            return [ '', '' ];
        }
        var _sortElem = _conditionElem.node('sort');
        var _sortRequestData = _conditionRequestData.sort;
        if (_sortRequestData == null) {
            return [ '', '' ];
        }
        var _sortItem = _sortRequestData.item;
        if (_sortItem == null || typeof _sortItem != 'string'
                || _sortItem == '') {
            return [ '', '' ];
        }
        _sortElem.node('item').text(_getSafeStringData(_sortItem));
        var _sortOrder = _sortRequestData.order;
        if (_sortOrder == null || typeof _sortOrder != 'string'
                || _sortOrder == '') {
            return [ '', '' ];
        }
        _sortElem.node('order').text(_getSafeStringData(_sortOrder));
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetCommunityInfoXmpp = function(xmppServerHostName, fromJid,
            communityInfoRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getCommunityInfo' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/getcommunityinfo');
        var _contentElem = _groupElem.node('content');
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem.text(_getSafeStringData(communityInfoRequestData.roomId));
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createGetCommunityMemberInfoXmpp = function(xmppServerHostName,
            fromJid, communityMemberInfoRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'getCommunityMemberInfo' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/getcommunitymemberinfo');
        var _contentElem = _groupElem.node('content');
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(communityMemberInfoRequestData.roomId));
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createUpdateCommunityInfo = function(xmppServerHostName, fromJid,
            updateCommunityInfoData) {
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'UpdateCommunityInfo' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'to' : xmppServerHostName,
            'id' : _id,
            'from' : fromJid,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/updatecommunityinfo');
        var _contentElem = _groupElem.node('content');
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem.text(_getSafeStringData(updateCommunityInfoData.roomId));
        var _roomnameElem = _contentElem.node('roomname');
        _roomnameElem
                    .text(_getSafeStringData(updateCommunityInfoData.roomName));
        var _descriptionElem = _contentElem.node('description');
        _descriptionElem
                .text(_getSafeStringData(updateCommunityInfoData.description));
        var _privacyTypeElem = _contentElem.node('privacytype');
        _privacyTypeElem
                .text(_getSafeNumberData(updateCommunityInfoData.privacyType));
        var _memberEntryTypeElem = _contentElem.node('memberentrytype');
        _memberEntryTypeElem
                .text(_getSafeNumberData(updateCommunityInfoData.memberEntryType));
        var _logoUrlElem = _contentElem.node('logourl');
        _logoUrlElem.text(_getSafeStringData(updateCommunityInfoData.logoUrl));
        if(updateCommunityInfoData.notifyType != undefined) {
            var _notifyTypeElem = _contentElem.node('notify_type');
            _notifyTypeElem.text(updateCommunityInfoData.notifyType);
        }
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createDeleteCommunityXmpp = function(xmppServerHostName, fromJid,
            communityInfoRequestData) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'DeleteCommunityRoom' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/deletecommunity');
        var _contentElem = _groupElem.node('content');
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem.text(_getSafeStringData(communityInfoRequestData.roomId));
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createUpdateUserPasswordXmpp = function(xmppServerHostName, fromJid,
            targetUserName, password) {
        if (xmppServerHostName == null || typeof xmppServerHostName != 'string'
                || Utils.trim(xmppServerHostName) == '') {
            return null;
        }
        if (fromJid == null || typeof fromJid != 'string'
                || Utils.trim(fromJid) == '') {
            return null;
        }
        if (targetUserName == null || typeof targetUserName != 'string'
                || Utils.trim(targetUserName) == '') {
            return null;
        }
        if (password == null || typeof password != 'string'
                || Utils.trim(password) == '') {
            return null;
        }
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'updateUserPassword' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text('UpdateUserPassword');
        var _userNameElem = _contentElem.node('username');
        _userNameElem.text(targetUserName);
        var _passwordElem = _contentElem.node('password');
        _passwordElem.text(password);
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createCreateUserXmpp = function(fromJid, createUserList) {
        if (fromJid == null || typeof fromJid != 'string'
                || Utils.trim(fromJid) == '') {
            return null;
        }
        if (createUserList == null || typeof createUserList != 'object') {
            return null;
        }
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'createUser' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text('CreateUser');
        var _itemsElem = _contentElem.node('items');
        _itemsElem.attr({
            'count' : '' + 0,
        });

        if (createUserList != null) {
            var _count = createUserList.length;
            _itemsElem.attr({
                'count' : '' + _count,
            });
            for ( var _i = 0; _i < _count; _i++) {
                var _itemElem = _itemsElem.node('item');
                var _createUserData = createUserList[_i];
                var _personData = _createUserData.personData;
                var _registeredContactData = _createUserData.registeredContactData;
                var _userNameElem = _itemElem.node('username');
                var _openfireAccount = _createUserData.openfireAccount;
                _userNameElem.text(_openfireAccount);
                var _passwordElem = _itemElem.node('password');
                var _password = _createUserData.password;
                _passwordElem.text(_password);
                var _emailElem = _itemElem.node('email');
                _emailElem.text(_personData.getMail());
                var _vCardElem = _itemElem.node('vCard');
                _vCardElem.namespace('vcard-temp');
                var _nickNameElem = _vCardElem.node('NICKNAME');
                _nickNameElem.text(_personData.getNickName());
                var _groups = _personData.getGroup();
                var _groupElem = _getGroupElmFromGroupArray(_itemElem, _groups);
                var _contactElem = _itemElem.node('contact');
                var _type = _registeredContactData.getType();
                switch (_type) {
                case RegisteredContactData.TYPE_ALL:
                    _contactElem.attr({
                        'type' : _type,
                    });
                    break;
                case RegisteredContactData.TYPE_CUSTOM:
                case RegisteredContactData.TYPE_NONE:
                default:
                    _contactElem.attr({
                        'type' : RegisteredContactData.TYPE_NONE,
                    });
                    break;
                }
            }
        }
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createUpdateUserXmpp = function(fromJid, updateUserList) {
        if (fromJid == null || typeof fromJid != 'string'
                || Utils.trim(fromJid) == '') {
            return null;
        }
        if (updateUserList == null || typeof updateUserList != 'object') {
            return null;
        }
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'UpdateUser' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text('UpdateUser');
        var _itemsElem = _contentElem.node('items');
        _itemsElem.attr({
            'count' : '' + 0,
        });

        if (updateUserList != null) {
            var _count = updateUserList.length;
            _itemsElem.attr({
                'count' : '' + _count,
            });
            for ( var _i = 0; _i < _count; _i++) {
                var _itemElem = _itemsElem.node('item');
                var _updateUserData = updateUserList[_i];
                var _userNameElem = _itemElem.node('username');
                var _openfireAccount = _updateUserData.openfireAccount;
                _userNameElem.text(_openfireAccount);
                var _vCardElem = _itemElem.node('vCard');
                _vCardElem.namespace('vcard-temp');
                var _nickNameElem = _vCardElem.node('NICKNAME');
                _nickNameElem.text(_updateUserData.nickname);
                var _groups = _updateUserData.group;
                var _groupElem = _getGroupElmFromGroupArray(_itemElem, _groups);
                var _deleteFlgElem = _itemElem.node('delete_flg');
                var _delete_flg = _updateUserData.delete_flg;
                _deleteFlgElem.text(_delete_flg);
                if(_updateUserData.mailAddress != null) {
                    var _emailElem = _vCardElem.node('EMAIL');
                    _emailElem.node('USERID').text(_updateUserData.mailAddress);
                }
            }
        }
        return [ _iqElem.toString(), _id ];
    };
    function _getGroupElmFromGroupArray(parentElm, groupArray) {
        if (parentElm == null || typeof parentElm != 'object') {
            return null;
        }
        if (groupArray == null || typeof groupArray != 'object') {
            return null;
        }
        var _count = groupArray.length;
        var _groupElem = parentElm.node('group');
        for ( var _i = 0; _i < _count; _i++) {
            var _itemElem = _groupElem.node('item');
            _itemElem.text(groupArray[_i]);
        }
        return _groupElem;
    }
    Xmpp.createPhysicalDeleteUserXmpp = function(fromJid, deleteUserList) {
        if (fromJid == null || typeof fromJid != 'string'
                || Utils.trim(fromJid) == '') {
            return null;
        }
        if (deleteUserList == null || typeof deleteUserList != 'object') {
            return null;
        }
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'physicalDeleteUser' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text('PhysicalDeleteUser');
        var _itemsElem = _contentElem.node('items');
        _itemsElem.attr({
            'count' : '' + 0,
        });
        if (deleteUserList != null) {
            var _count = deleteUserList.length;
            _itemsElem.attr({
                'count' : '' + _count,
            });
            for ( var _i = 0; _i < _count; _i++) {
                var _itemElem = _itemsElem.node('item');
                var _deleteUser = deleteUserList[_i];
                var _userNameElem = _itemElem.node('username');
                _userNameElem.text(_deleteUser);
            }
        }
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createUpdateUserAccountStatusXmpp = function(xmppServerHostName,
            fromJid, targetUserName, accountStatus) {
        if (xmppServerHostName == null || typeof xmppServerHostName != 'string'
                || Utils.trim(xmppServerHostName) == '') {
            return null;
        }
        if (fromJid == null || typeof fromJid != 'string'
                || Utils.trim(fromJid) == '') {
            return null;
        }
        if (targetUserName == null || typeof targetUserName != 'string'
                || Utils.trim(targetUserName) == '') {
            return null;
        }
        if (accountStatus == null || typeof accountStatus != 'number') {
            return null;
        }
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'updateUserAccountStatus' + _randomNum;
        _iqElem.attr({
            'type' : 'set',
            'id' : _id,
            'from' : _fromJid,
            'to' : xmppServerHostName,
        });
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        var _contentElem = _queryElem.node('content');
        var _typeElem = _contentElem.node('type');
        _typeElem.text('UpdateUserAccountStatus');
        var _userNameElem = _contentElem.node('username');
        _userNameElem.text(targetUserName);
        var _accountStatusElem = _contentElem.node('accountstatus');
        _accountStatusElem.text(_getSafeNumberData(accountStatus));
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createSendPingXmpp = function(xmppServerHostName, fromJid) {
        var _doc = libxml.Document();
        var _fromJid = fromJid.split('/')[0];
        var _to = xmppServerHostName;
        var _iqElem = _doc.node('iq');
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'ping' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : _fromJid,
            'to' : _to,
        });
        var _pingElem = _iqElem.node('ping');
        _pingElem.namespace('urn:xmpp:ping');
        return [ _iqElem.toString(), _id ];
    };
    Xmpp.createResponsePingXmpp = function(responseFrom, responseTo, responseId) {
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        _iqElem.attr({
            'type' : 'result',
            'id' : responseId,
            'from' : responseFrom,
            'to' : responseTo,
        });
        return [ _iqElem.toString(), responseId ];
    };

    function _getSafeStringData(data) {
        var _ret = '';
        if (data == null || typeof data != 'string') {
            return _ret;
        }
        return data;
    }

    function _getSafeNumberData(data) {
        var _ret = 0;
        if (data == null || typeof data != 'number') {
            return _ret;
        }
        return data;
    }

    var _proto = Xmpp.prototype;

    exports.Xmpp = Xmpp;
})();
