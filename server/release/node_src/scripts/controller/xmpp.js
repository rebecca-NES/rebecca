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
        // libxml.Element(_doc, 'auth');を使用するとセグメンテーションフォールトが発生する
        _authElem.namespace('urn:ietf:params:xml:ns:xmpp-sasl');

        _authElem.attr({
            'mechanism' : 'PLAIN',
        });
        // データをエンコード
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
        // <iq>
        var _iqElem = _doc.node('iq');
        // libxml.Element(_doc, 'iq');を使用するとセグメンテーションフォールトが発生する
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        _iqElem.attr({
            'type' : 'set',
            'id' : 'bind' + _randomNum,
        });
        // <bind>
        var _bindElem = _iqElem.node('bind');
        _bindElem.namespace('urn:ietf:params:xml:ns:xmpp-bind');
        // <resource>
        var _resourceElem = _bindElem.node('resource');
        _resourceElem.text(clientName);
        return _iqElem.toString();
    };

    Xmpp.getSessionXmpp = function() {
        var _doc = libxml.Document();
        // <iq>
        var _iqElem = _doc.node('iq');
        // libxml.Element(_doc, 'iq');を使用するとセグメンテーションフォールトが発生する
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        _iqElem.attr({
            'type' : 'set',
            'id' : 'session' + _randomNum,
        });
        // <session>
        var _bindElem = _iqElem.node('session');
        _bindElem.namespace('urn:ietf:params:xml:ns:xmpp-session');
        return _iqElem.toString();
    };

    // プレゼンス変更用
    Xmpp.createUpdatePresence = function(presence, myMemo) {
        var _presenceStr = PersonData.convertPresenceNumToStr(presence);
        if (_presenceStr == null || _presenceStr == '') {
            return null;
        }
        var _doc = libxml.Document();
        var _presenceElem = _doc.node('presence');
        // libxml.Element(_doc, 'iq');を使用するとセグメンテーションフォールトが発生する
        // <show>
        _presenceElem.node('show').text(_presenceStr);
        // <status>
        _presenceElem.node('status').text(myMemo);
        return [ _presenceElem.toString(), '' ];
    };

    Xmpp.createGetVcardInformationXmpp = function(fromJid, toJid) {
        _log.connectionLog(7, 'do func Xmpp.createGetVcardInformationXmpp(');
        var _doc = libxml.Document();
        var _iqElem = _doc.node('iq');
        // libxml.Element(_doc, 'iq');を使用するとセグメンテーションフォールトが発生するgetGoodJobList
        var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
        var _id = 'vCard' + _randomNum;
        _iqElem.attr({
            'type' : 'get',
            'id' : _id,
            'from' : fromJid,
            'to' : toJid,
        });
        // <vCard>
        var _vCardElem = _iqElem.node('vCard');
        _vCardElem.namespace('vcard-temp');
        _vCardElem.attr({
            'version' : '2.0',
            'prodid' : '-//HandGen//NONSGML vGen v1.0//EN',
        });
        return [ _iqElem.toString(), _id ];
    };

    // vCard更新
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
        // <vCard>
        var _vCardElem = _iqElem.node('vCard');
        _vCardElem.namespace('vcard-temp');
        // <NICKNAME>
        // 指定がない場合は、更新する意図がないものとして、XMPP に含めない
        var _nickName = profile.nickName;
        if (_nickName != null) {
            if (_nickName == '') {
                return null;
            }
            _vCardElem.node('NICKNAME').text(_nickName);
        }
        // <PHOTO>
        var _photoElem = _vCardElem.node('PHOTO');
        // <TYPE>
        var _photoType = profile.avatarType;
        if (_photoType == null) {
            _photoType = '';
        }
        _photoElem.node('TYPE').text(_photoType);
        // <BINVAL>
        var _photoBinVal = profile.avatarData;
        if (_photoBinVal == null) {
            _photoBinVal = '';
        }
        _photoElem.node('BINVAL').text(_photoBinVal);
        // <EMAIL>
        if(profile.mailAddress != null) {
            var _emailElem = _vCardElem.node('EMAIL');
            _emailElem.node('USERID').text(profile.mailAddress);
        } else {
            // mailAddressが設定されていないAPIの場合、cubee V2以前と認識し、互換性を保つために何もしない
            /* DO NOTHING */
        }
        // <Affiliation(group)>
        if(profile.group != null && Array.isArray(profile.group)) {
            var _affiliationElem = _vCardElem.node('group');
            if(_affiliationElem != null){
                for(let i=0;i<profile.group.length;i++){
                    let _affiliation = profile.group[i].trim();
                    _affiliationElem.node('item').text(_affiliation);
                }
            }
        }
        // <EXTRAS>
        var _extrasElem = _vCardElem.node('EXTRAS');
        if (profile.extras != null) {
            _extrasElem.text(profile.extras);
        }
        return [ _iqElem.toString(), _id ];
    };

    // パスワード変更
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:register');
        // <username>
        _queryElem.node('username').text(userName);
        // <password>
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:roster');
        return [ _iqElem.toString(), _id ];
    };
    //コンタクトリストへのメンバー追加
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
        // <contact>
        var _contactElem = _iqElem.node('contact');
        _contactElem.namespace('http://necst.nec.co.jp/protocol/addcontactlistmember');
        // <content>
        var _contentElem = _contactElem.node('content');
        // <members>
        var _membersElem = _contentElem.node('members');
        // <member>
        var _memberItems = addContactListMemberRequestData.members;
        var _memberItemsCount = _memberItems.length;
        for ( var _i = 0; _i < _memberItemsCount; _i++) {
            var _memberItem = _memberItems[_i];
            // <member>
            var _memberElem = _membersElem.node('member');
            // <jid>
            var _jidElem = _memberElem.node('jid');
            _jidElem.text(_getSafeStringData(_memberItem.jid));
            // <contactlistgroup>
            var _contactListGroupElem = _memberElem.node('contactlistgroup');
            _contactListGroupElem.text(_getSafeStringData(_memberItem.contactListGroup));
        }

        // <members> の count
        _membersElem.attr({
            count : _memberItemsCount
        });
        return [ _iqElem.toString(), _id ];
    };

    //コンタクトリストのメンバ削除
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
        // <contact>
        var _contactElem = _iqElem.node('contact');
        _contactElem.namespace('http://necst.nec.co.jp/protocol/removecontactlistmember');
        // <content>
        var _contentElem = _contactElem.node('content');
        // <members>
        var _membersElem = _contentElem.node('members');
        // <member>
        var _memberItems = removeContactListMemberRequestData.members;
        var _memberItemsCount = _memberItems.length;
        for ( var _i = 0; _i < _memberItemsCount; _i++) {
            var _memberItem = _memberItems[_i];
            // <member>
            var _memberElem = _membersElem.node('member');
            // <jid>
            var _jidElem = _memberElem.node('jid');
            _jidElem.text(_getSafeStringData(_memberItem.jid));
        }

        // <members> の count
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:private');
        // <exodus>
        var _exodusElem = _queryElem.node('exodus');
        _exodusElem.namespace('timeline_history');
        // <timeline_history>
        var _timelineHistoryElem = _exodusElem.node('timeline_history');
        // <base_id>
        _timelineHistoryElem.node('base_id').text('' + baseId);
        // <count>
        _timelineHistoryElem.node('count').text('' + count);
        // <from>
        _timelineHistoryElem.node('from').text(_fromJid);

        return [ _iqElem.toString(), _id ];
    };
    // メッセージ送信
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/send');
        // <content>
        var _contentElem = null;
        var _type = sendData.type;
        switch (_type) {
        case RequestData.SEND_MESSAGE_TYPE_PUBLIC:
            _contentElem = _getPublicDataContentXmppElem(sendData, fromJid);
            break;
        case RequestData.SEND_MESSAGE_TYPE_CHAT:
            // 共通化したAPIではなく個別で実装しているためこの関数を使っていない
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
                // Superfluous argument passed to function _getItemsFromCreateOrUpdateUserResultItemsElm.
            _contentElem = _getMurmurDataContentXmppElem(sendData, fromJid);
            break;
        default:
            break;
        }
        if (_contentElem) {
            _messageElem.addChild(_contentElem);
        }
        return [ _iqElem.toString(), _id ];
    };

    // メッセージの更新
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/update');
        // <content>
        var _contentElem = null;
        var _type = sendData.type;
        switch (_type) {
        case RequestData.SEND_MESSAGE_TYPE_PUBLIC:
            // 更新機能なし
            break;
        case RequestData.SEND_MESSAGE_TYPE_CHAT:
            // 更新機能なし
            break;
        case RequestData.SEND_MESSAGE_TYPE_TASK:
            _contentElem = _getTaskDataContentXmppElem(sendData, fromJid,
                    xmppServerHostName);
            // itemIdを追加する
            _contentElem.node('item_id').text(sendData.itemId);
            break;
        case RequestData.SEND_MESSAGE_TYPE_GROUP_CHAT:
            // 更新機能なし
            break;
        case RequestData.SEND_MESSAGE_TYPE_COMMUNITY:
            // 更新機能なし
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

    // メッセージの本文更新
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/updatemessagebody');
        // <content>
        var _contentElem = _messageElem.node('content');
        var _type = sendData.type;
        // <body>
        _contentElem.node('body').text(_getSafeStringData(sendData.body));
        // <item_id>
        _contentElem.node('item_id').text(
            _getSafeStringData(sendData.itemId));
        // <roomId>コンテキスト実相時に内容を設定する
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

    // メールメッセージの投稿
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/send');
        // <content>
        var _contentElem = _messageElem.node('content');
        _contentElem.attr({
            'type' : 'Mail'
        });
        // <items>
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

        // 通知数を設定
        _itemsElem.attr({
            'count' : '' + _itemsCount,
        });

        return [ _iqElem.toString(), _id ];
    };

    /**
     * threadTitle編集リクエストXMPP の生成
     *
     * @param xmppServerHostName
     * @param fromJid
     * @param sendData
     *
     * @return XMPPリクエストのXML
     */
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/threadtitleupdate');
        //
        var _doc = libxml.Document();
        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : sendData.type
        });
        // <msgtype>
        _contentElem.node('room_id').text(sendData.roomId ? sendData.roomId : "");
        // <msgfrom>
        _contentElem.node('msgto').text(sendData.msgto ? sendData.msgto : "");
        // <threadTitle>
        _contentElem.node('thread_title').text(sendData.threadTitle);
        // <threadRootId>
        _contentElem.node('thread_root_id').text(sendData.threadRootId);
        // <itemId>
        _contentElem.node('item_id').text(sendData.itemId);
        _messageElem.addChild(_contentElem);

        return [ _iqElem.toString(), _id ];
    };

    /**
     * threadTitleリストのリクエストXMPP の生成
     *
     * @param xmppServerHostName
     * @param fromJid
     * @param sendData
     *
     * @return XMPPリクエストのXML
     */
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/threadtitlelistget');
        //
        var _doc = libxml.Document();
        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : sendData.type
        });
        // <msgtype>
        _contentElem.node('room_id').text(sendData.roomId ? sendData.roomId : "");
        // <msgfrom>
        _contentElem.node('msgto').text(sendData.msgto ? sendData.msgto : "");
        //<filter>
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


    // メール登録リクエストからItemsを取得する
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
        // <content>
        var _itemElem = _doc.node('item');
        // <msgtype>
        _itemElem.node('msgtype').text('' + _getSafeNumberData(item.type));
        // <msgfrom>
        _itemElem.node('msgfrom').text(_getSafeStringData(messageFrom));
        // <msgto>
        _itemElem.node('msgto').text(_getSafeStringData(item.to));
        // <entry>
        var _entryElem = _itemElem.node('entry');
        // entry内の<body>
        _entryElem.node('body').text(_getSafeStringData(item.body));
        // <priority>
        _itemElem.node('priority').text('' + _getSafeNumberData(item.priority));
        // <mail_message_id>
        _itemElem.node('mail_message_id').text(
                _getSafeStringData(item.mailMessageId));
        // <mail_in_reply_to>
        _itemElem.node('mail_in_reply_to').text(
                _getSafeStringData(item.mailInReplyTo));
        // <attached_items>
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
        // <context>コンテキスト実相時に内容を設定する
        _itemElem.node('context').text(_getSafeStringData(item.context));
        // <mail_body>
        _itemElem.node('mail_body').text(_getSafeStringData(item.mailBody));
        return _itemElem;
    }

    // チャット履歴の取得
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:private');
        // <exodus>
        var _exodusElem = _queryElem.node('exodus');
        _exodusElem.namespace('chat_history');
        // <chat_history>
        var _chatHistoryElem = _exodusElem.node('chat_history');
        // <base_id>
        _chatHistoryElem.node('base_id').text('' + baseId);
        // <count>
        _chatHistoryElem.node('count').text('' + count);
        // <filter>
        var _filterElem = _chatHistoryElem.node('filter');
        // <partner>
        _filterElem.node('partner').text(partnerJid, _partnerJid);

        return [ _iqElem.toString(), _id ];
    };

    // チャットの送信
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
        // <body>
        _messgeElem.node('body').text(messageBody);
        // <reply_id>
        if (replyId == null) {
            replyId = '';
        }
        _messgeElem.node('reply_id').text(replyId);
        // <bodyType>
        if (bodyType != null && typeof bodyType === 'number') {
            _messgeElem.node('body_type').text(bodyType);
        }else{
            _messgeElem.node('body_type').text("0");
        }

        // <thread_title>
        if (threadTitle == undefined || threadTitle == null) {
            threadTitle = '';
        }
        _messgeElem.node('thread_title').text(threadTitle);
        // <quotationItemId>
        if (quotationItemId != undefined && quotationItemId != null) {
            _messgeElem.node('quotation_item_id').text(_getSafeStringData(quotationItemId));
        }
        // <attached_items>
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
        // <context>
        if (context == null) {
            context = '';
        }
        _messgeElem.node('context').text(context);
        return [ _messgeElem.toString(), _id ];
    };

    // タスクの取得
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:private');
        // <exodus>
        var _exodusElem = _queryElem.node('exodus');
        _exodusElem.namespace('task_list');
        // <task_list>
        var _taskListElem = _exodusElem.node('task_list');
        // <base_id>
        _taskListElem.node('base_id').text('' + baseId);
        // <count>
        _taskListElem.node('count').text('' + count);
        // <filter>
        var _filterElem = _taskListElem.node('filter');
        // <key>
        // Variable _key is used like a local variable, but is missing a declaration.
        var _key;
        for (_key in filter) {
            _filterElem.node(_key).text(filter[_key]);
        }
        // <sort>
        var _sortElem = _taskListElem.node('sort');
        // <item>
        _sortElem.node('item').text(sort.item);
        // <order>
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:private');
        // <exodus>
        var _exodusElem = _queryElem.node('exodus');
        _exodusElem.namespace('questionnaire_list');
        // <questionnaire_list>
        var _questionnaireListElem = _exodusElem.node('questionnaire_list');
        // <base_id>
        _questionnaireListElem.node('base_id').text('' + baseId);
        // <count>
        _questionnaireListElem.node('count').text('' + count);
        // <filter>  scd ToDo
        var _filterElem = _questionnaireListElem.node('filter');
        //_getFilterConditionXmppElem(_filterElem, filter);
        if(filter != undefined && filter.withoutfeed){
            _filterElem.node('withoutfeed').text('1');
        }
        // <key>
        // <sort>
        var _sortElem = _questionnaireListElem.node('sort');
        // <item>
        _sortElem.node('item').text(sort.item);
        // <order>
        _sortElem.node('order').text(sort.order);
        return [ _iqElem.toString(), _id ];

    };

    // メッセージ検索
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/search');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <condition>
        var _conditionElem = _contentElem.node('condition');
        // <filter>
        var _filterElem = _conditionElem.node('filter');
        _getFilterConditionXmppElem(_filterElem, filter);
        // <sort>
        var _sortElem = _conditionElem.node('sort');
        // <item>
        _sortElem.node('item').text(sort.item);
        // <order>
        _sortElem.node('order').text(sort.order);

        // <startid>
        _contentElem.node('startid').text('' + startId);
        // <count>
        _contentElem.node('count').text('' + count);

        return [ _iqElem.toString(), _id ];
    };

    /**
     * タイプ別の値もつXmpp用 XML生成関数
     */
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/search');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <condition>
        var _conditionElem = _contentElem.node('condition');
        // <filter>
        var _filterElem = _conditionElem.node('filter');

        _getFilterConditionXmppElem(_filterElem, filter);
        // <sort>
        var _sortElem = _conditionElem.node('sort');
        // <item>
        _sortElem.node('item').text(sort.item);
        // <order>
        _sortElem.node('order').text(sort.order);

        // <startid>
        _contentElem.node('startid').text('' + startId);
        // <count>
        _contentElem.node('count').text('' + count);
        // <type>
        if(type && typeof type == 'string' &&
           type.match(/^[A-Za-z0-9]+$/)){
            _contentElem.node('type').text(type);
        }

        return [ _iqElem.toString(), _id ];
    };

    function _getQuestionnaireUpdateDataContentXmppElem(questionnaireData, fromJid, toXmppServerHostName) {
        _log.connectionLog(7, 'do func Xmpp._getQuestionnaireUpdateDataContentXmppElem(...');
        var _doc = libxml.Document();

        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Questionnaire'
        });

        // <itemId>
        var _itemIdElem = _contentElem.node('itemId');
        _itemIdElem.text(questionnaireData.itemId);
        //<msgto>
        var _msgToElem = _contentElem.node('msgto');
        if(questionnaireData.msgto &&
           typeof questionnaireData.msgto == 'string' &&
           questionnaireData.msgto.length > 0){
            _msgToElem.text(questionnaireData.msgto);
        }else{
            _msgToElem.text("");
        }
        // <optionItems>
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

    // アンケート作成用のXMPP(contentタグ以下)を取得
    function _getQuestionnaireDataContentXmppElem(questionnaireData, fromJid,
                                         toXmppServerHostName) {
        var _doc = libxml.Document();
        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Questionnaire'
        });
        // <msgtype>
        _contentElem.node('msgtype').text('' + 10);
        // <msgfrom>
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        // <msgto>
        if(questionnaireData.roomId == 0) {
            _contentElem.node('msgto').text(
                _getSafeStringData(toXmppServerHostName));
        } else {
            _contentElem.node('msgto').text(
                questionnaireData.roomId);
        }
        // <entry>
        var _entryElem = _contentElem.node('entry');
        // entry内の<body>
        _entryElem.node('body').text(_getSafeStringData(questionnaireData.body));

        // <inputType>
        _contentElem.node('inputType').text(
            '' + _getSafeNumberData(questionnaireData.inputType));
        // <resultVisible>
        _contentElem.node('resultVisible').text(
            '' + _getSafeNumberData(questionnaireData.resultVisible));
        // <graphType>
        _contentElem.node('graphType').text(
            '' + _getSafeNumberData(questionnaireData.graphType));
        // <roomType>
        _contentElem.node('roomType').text(
            '' + _getSafeNumberData(questionnaireData.roomType));
        // <roomId>
        if(questionnaireData.roomId == 0) {
            _contentElem.node('roomId').text(
                _getSafeStringData(""));
        } else {
            _contentElem.node('roomId').text(
                '' + _getSafeStringData(questionnaireData.roomId));
        }
        // <optionItems>
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
        // <start_date>
        _contentElem.node('start_date').text(
            _getSafeStringData(questionnaireData.startDate));
        // <due_date>
        _contentElem.node('due_date')
            .text(_getSafeStringData(questionnaireData.dueDate));
        // <context>コンテキスト実装時に内容を設定する
        _contentElem.node('context').text(_getSafeStringData(questionnaireData.context));
        // <attached_items>
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

    // Publicメッセージの送信用XMPP(contentタグ以下)を取得
    function _getPublicDataContentXmppElem(publicData, fromJid) {
        _log.connectionLog(7, 'do func Xmpp._getPublicDataContentXmppElem(...');
        var _doc = libxml.Document();
        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Public'
        });
        // <msgtype>
        _contentElem.node('msgtype').text('' + _getSafeNumberData(1));
        // <msgfrom>
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        // <threadTitle>
        _contentElem.node('thread_title').text(_getSafeStringData(publicData.threadTitle));
        // <quotationItemId>
        if(publicData.quotationItemId != undefined &&
           publicData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(publicData.quotationItemId));
        }
        // <entry>
        var _entryElem = _contentElem.node('entry');
        // entry内の<body>
        _entryElem.node('body').text(_getSafeStringData(publicData.body));
        // <bodyType>
        if(publicData.bodyType){
            _contentElem.node('body_type').text(
                _getSafeNumberData(publicData.bodyType));
        }else{
            _contentElem.node('body_type').text("0");
        }
        // <attached_items>
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
        // <reply_id>
        _contentElem.node('reply_id').text(
                _getSafeStringData(publicData.replyId));
        // <context>コンテキスト実相時に内容を設定する
        _contentElem.node('context').text(
                _getSafeStringData(publicData.context));

        return _contentElem;
    }

    // GroupChatメッセージの送信用XMPP(contentタグ以下)を取得
    function _getGroupChatDataContentXmppElem(groupChatData, fromJid) {
        _log.connectionLog(7, 'do func Xmpp._getGroupChatDataContentXmppElem(...');
        var _doc = libxml.Document();
        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'GroupChat'
        });
        // <msgtype>
        _contentElem.node('msgtype').text('' + 3);
        // <msgfrom>
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        // <msgto>
        _contentElem.node('msgto').text(
                _getSafeStringData(groupChatData.roomId));
        // <bodyType>
        _contentElem.node('body_type').text(
            _getSafeStringData(''+groupChatData.bodyType));
        // <threadTitle>
        _contentElem.node('thread_title').text(_getSafeStringData(groupChatData.threadTitle));
        // <quotationItemId>
        if(groupChatData.quotationItemId != undefined &&
           groupChatData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(groupChatData.quotationItemId));
        }
        // <entry>
        var _entryElem = _contentElem.node('entry');
        // entry内の<body>
        _entryElem.node('body').text(_getSafeStringData(groupChatData.body));
        // <attached_items>
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
        // <reply_id>
        _contentElem.node('reply_id').text(
                _getSafeStringData(groupChatData.replyId));
        // <reply_to>
        _contentElem.node('reply_to').text(
                _getSafeStringData(groupChatData.replyTo));
        // <context>コンテキスト実相時に内容を設定する
        _contentElem.node('context').text(
                _getSafeStringData(groupChatData.context));

        return _contentElem;
    }

    // コミュニティメッセージの送信用XMPP(contentタグ以下)を取得
    function _getCommunityMessageDataContentXmppElem(communityMessageData,
            fromJid) {
        _log.connectionLog(7, 'do func Xmpp._getCommunityMessageDataContentXmppElem(...');
        var _doc = libxml.Document();
        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Community'
        });
        // <msgtype>
        _contentElem.node('msgtype').text('' + 5);
        // <msgfrom>
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        // <msgto>
        _contentElem.node('msgto').text(
                _getSafeStringData(communityMessageData.roomId));
        // <entry>
        var _entryElem = _contentElem.node('entry');
        // entry内の<body>
        _entryElem.node('body').text(
                _getSafeStringData(communityMessageData.body));
        // <attached_items>
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
        // <reply_id>
        _contentElem.node('reply_id').text(
                _getSafeStringData(communityMessageData.replyId));
        // <reply_to>
        _contentElem.node('reply_to').text(
                _getSafeStringData(communityMessageData.replyTo));
        // <body_type>
        _contentElem.node('body_type').text(
                _getSafeStringData('' + communityMessageData.bodyType));
        // <threadTitle>
        _contentElem.node('thread_title').text(_getSafeStringData(communityMessageData.threadTitle));
        // <quotationItemId>
        if(communityMessageData.quotationItemId != undefined &&
           communityMessageData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(communityMessageData.quotationItemId));
        }
        // <context>コンテキスト実相時に内容を設定する
        _contentElem.node('context').text(
                _getSafeStringData(communityMessageData.context));

        return _contentElem;
    }

    /**
     * つぶやきメッセージの送信用XMPP(contentタグ以下)を取得
     *
     * @param murmurMessageData JSONフォーマットのつぶやき投稿データ
     * @param fromJid 投稿者JID
     */
    function _getMurmurDataContentXmppElem(murmurMessageData,
                                           fromJid) {
        _log.connectionLog(7, 'do func Xmpp._getMurmurDataContentXmppElem(...');
        var _doc = libxml.Document();
        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Murmur'
        });
        // <msgtype>
        _contentElem.node('msgtype').text('11');
        // <msgfrom>
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        // <msgto>
        _contentElem.node('msgto').text(_getSafeStringData(fromJid));
        // <entry>
        var _entryElem = _contentElem.node('entry');
        // entry内の<body>
        _entryElem.node('body').text(
                _getSafeStringData(murmurMessageData.body));
        // <attached_items>
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
        // <reply_id>
        _contentElem.node('reply_id').text(
                _getSafeStringData(murmurMessageData.replyId));
        // <reply_to>
        _contentElem.node('reply_to').text(
                _getSafeStringData(murmurMessageData.replyTo));
        // <body_type>
        _contentElem.node('body_type').text(
                _getSafeStringData('' + murmurMessageData.bodyType));
        // <threadTitle>
        _contentElem.node('thread_title').text(_getSafeStringData(murmurMessageData.threadTitle));
        // <quotationItemId>
        if(murmurMessageData.quotationItemId != undefined &&
           murmurMessageData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(murmurMessageData.quotationItemId));
        }
        // <context>コンテキスト実相時に内容を設定する
        _contentElem.node('context').text(
                _getSafeStringData(murmurMessageData.context));

        return _contentElem;
    }

    // タスクの追加・更新用XMPP(contentタグ以下)を取得
    function _getTaskDataContentXmppElem(taskData, fromJid,
            toXmppServerHostName) {
        _log.connectionLog(7, 'do func Xmpp._getTaskDataContentXmppElem(...');
        var _doc = libxml.Document();
        // <content>
        var _contentElem = _doc.node('content');
        _contentElem.attr({
            'type' : 'Task'
        });
        // <msgtype>
        _contentElem.node('msgtype').text('' + 4);
        // <msgfrom>
        _contentElem.node('msgfrom').text(_getSafeStringData(fromJid));
        // <msgto>
        _contentElem.node('msgto').text(
                _getSafeStringData(toXmppServerHostName));
        // <entry>
        var _entryElem = _contentElem.node('entry');
        // entry内の<title>
        _entryElem.node('title').text(_getSafeStringData(taskData.title));
        // entry内の<body>
        _entryElem.node('body').text(_getSafeStringData(taskData.body));
        // entry内の<progress>
        _entryElem.node('progress').text(
                '' + _getSafeNumberData(taskData.progress));
        // entry内の<spent_time>
        _entryElem.node('spent_time').text(
                '' + _getSafeNumberData(taskData.spentTime));
        // entry内の<estimated_time>
        _entryElem.node('estimated_time').text(
                '' + _getSafeNumberData(taskData.estimatedTime));
        // entry内の<remaining_time>
        _entryElem.node('remaining_time').text(
                '' + _getSafeNumberData(taskData.remainingTime));
        // entry内の<goal>
        _entryElem.node('goal').text(_getSafeStringData(taskData.goal));
        // entry内の<alert>
        _entryElem.node('alert').text('' + _getSafeNumberData(taskData.alert));
        // <priority>
        _contentElem.node('priority').text(
                '' + _getSafeNumberData(taskData.priority));
        // <reply_id>
        _contentElem.node('reply_id')
                .text(_getSafeStringData(taskData.replyId));
        // <reply_to>
        _contentElem.node('reply_to')
                .text(_getSafeStringData(taskData.replyTo));
        // <start_date>
        _contentElem.node('start_date').text(
                _getSafeStringData(taskData.startDate));
        // <due_date>
        _contentElem.node('due_date')
                .text(_getSafeStringData(taskData.dueDate));
        // <owner>
        _contentElem.node('owner').text(_getSafeStringData(taskData.owner));
        // <group>
        _contentElem.node('group').text(_getSafeStringData(taskData.group));
        // <status>
        _contentElem.node('status').text(
                '' + _getSafeNumberData(taskData.status));
        // <client>
        _contentElem.node('client').text(_getSafeStringData(taskData.client));
        // <quotationItemId>
        if(taskData.quotationItemId != undefined &&
           taskData.quotationItemId != null){
            _contentElem.node('quotation_item_id').text(_getSafeStringData(taskData.quotationItemId));
        }
        // <context>コンテキスト実装時に内容を設定する
        _contentElem.node('context').text(_getSafeStringData(taskData.context));
        // <parent_item_id>
        _contentElem.node('parent_item_id').text(
                _getSafeStringData(taskData.parentItemId));
        // <attached_items>
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

    // 検索フィルターの条件の種類
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

        // 比較演算子‐より大きい
        case CONDITION_TYPE_GREATER_THAN:
            _getFilterGreaterThanConditionXmppElem(parentElem, condition);
            break;

        // 比較演算子‐より小さい
        case CONDITION_TYPE_LESS_THAN:
            _getFilterLessThanConditionXmppElem(parentElem, condition);
            break;

        case CONDITION_TYPE_KEYWORD:
            _getFilterKeywordConditionXmppElem(parentElem, condition);
            break;

        // 個別条件
        case CONDITION_TYPE_PARTICULAR:
            _getFilterParticularConditionXmppElem(parentElem, condition);
            break;

        default:
            break;
        }
        return;
    }
    // AND条件フィルターを作成
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
            // 配列でない場合はエラー
            return;
        }
        var _count = _value.length;
        if (_count == null || _count < 2) {
            // 配下の条件の数が不正
            return;
        }
        var _andElem = parentElem.node('and');
        for ( var _i = 0; _i < _count; _i++) {
            var _childCondition = _value[_i];
            _getFilterConditionXmppElem(_andElem, _childCondition);
        }
    }
    // OR条件フィルターを作成
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
            // 配列でない場合はエラー
            return;
        }
        var _count = _value.length;
        if (_count == null || _count < 2) {
            // 配下の条件の数が不正
            return;
        }
        var _orElem = parentElem.node('or');
        for ( var _i = 0; _i < _count; _i++) {
            var _childCondition = _value[_i];
            var _childConditionXmppElem = _getFilterConditionXmppElem(_orElem,
                    _childCondition);
        }
    }
    // NOT条件フィルターを作成
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
            // 配列の場合はエラー
            return;
        }
        if (!(_value instanceof Object)) {
            // オブジェクトでない場合はエラー
            return;
        }
        var _notElem = parentElem.node('not');
        // 配下を取得
        _getFilterConditionXmppElem(_notElem, _value);
    }
    // ITEM条件フィルターを作成
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
        // _nameのチェック
        _name = Utils.trim(_name);
        if (_name == '') {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (_value instanceof Array) {
            // 配列の場合はエラー
            return;
        }
        if (_value instanceof Object) {
            // オブジェクトの場合はエラー
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
    // より大きい条件フィルターを作成
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
        // _nameのチェック
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
            // 配列の場合はエラー
            _log.connectionLog(3, '_getFilterGreaterThanConditionXmppElem  _value is not allow array');
            return;
        }
        if (_value instanceof Object) {
            // オブジェクトの場合はエラー
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
    // より小さい条件フィルターを作成
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
        // _nameのチェック
        _name = Utils.trim(_name);
        if (_name == '') {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (_value instanceof Array) {
            // 配列の場合はエラー
            return;
        }
        if (_value instanceof Object) {
            // オブジェクトの場合はエラー
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
    // KEYWORD条件フィルターを作成
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
            // 配列の場合はエラー
            return;
        }
        if (_value instanceof Object) {
            // オブジェクトの場合はエラー
            return;
        }
        // include部分の取得（ない場合はこれまで通りの動作を保証する）
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
        // 検索キーワードをkeywordエレメントに設定
        var _keywordElem = parentElem.node('keyword');
        _keywordElem.text('' + _value);
        // include項目をkeywordエレメントの属性として追加
        _keywordElem.attr({
            'include' : _includeValue
        });
    }
    // 個別
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
        // _nameのチェック
        _name = Utils.trim(_name);
        if (_name == '') {
            return;
        }
        var _value = condition.value;
        if (_value == null) {
            return;
        }
        if (_value instanceof Array) {
            // 配列の場合はエラー
            return;
        }
        if (_value instanceof Object) {
            // オブジェクトの場合はエラー
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
    // Good Jobの追加
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
        // <goodJob>
        var _goodJobElem = _iqElem.node('goodJob');
        _goodJobElem.namespace('http://necst.nec.co.jp/protocol/goodjob');
        // <item>
        var _itemElem = _goodJobElem.node('item');
        _itemElem.attr({
            'itemid' : itemId,
        });

        return [ _iqElem.toString(), _id ];
    };

    /**
     * EmotionPointの追加
     *
     */
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
        // <emotionPoint>
        var _emotionPointElem = _iqElem.node('emotionPoint');
        _emotionPointElem.namespace('http://necst.nec.co.jp/protocol/emotionpoint');
        // <item>
        var _itemElem = _emotionPointElem.node('item');
        _itemElem.attr({
            'itemid' : itemId,
            'emotion_point' : emotionPoint,
        });

        return [ _iqElem.toString(), _id ];
    };

    // タスク催促のXMPP
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(demandTaskRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');
        // <item_id>
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem.text(_getSafeStringData(demandTaskRequestData.itemId));
        // <clear_condition>
        var _clearConditionElem = _itemElm.node('clear_condition');
        _clearConditionElem
                .text(_getSafeStringData(demandTaskRequestData.clearCondition));
        return [ _iqElem.toString(), _id ];
    };

    // タスク催促解除のXMPP
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(demandTaskRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');
        // <item_id>
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem.text(_getSafeStringData(demandTaskRequestData.itemId));
        return [ _iqElem.toString(), _id ];
    };
    // 既読者一覧のXMPP
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem
                .text(_getSafeStringData(getExistingReaderListRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');
        // <item_id>
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem
                .text(_getSafeStringData(getExistingReaderListRequestData.itemId));
        return [ _iqElem.toString(), _id ];
    };
    // 既読要求のXMPP
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(setReadMessageData.type));
        // <items>
        var _itemsElem = _contentElem.node('items');
        var _items = setReadMessageData.items;
        var _itemsCount = _items.length;
        _itemsElem.attr({
            'count' : '' + _itemsCount,
        });
        for ( var _i = 0; _i < _itemsCount; _i++) {
            var _item = _items[_i];
            // <item>
            var _itemElm = _itemsElem.node('item');
            // <item_id>
            var _itemIdElem = _itemElm.node('item_id');
            _itemIdElem.text(_getSafeStringData(_item.itemId));
        }

        return [ _iqElem.toString(), _id ];
    };

    // GoodJob一覧のXMPP
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getGoodJobListRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');
        // <item_id>
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem.text(_getSafeStringData(getGoodJobListRequestData.itemId));
        return [ _iqElem.toString(), _id ];
    };

    /**
     * GoodJob トータル数のXMPP
     *
     * string xmppServerHostName XMPPホスト名
     * string fromJid 実行者JID
     * ojbect getGoodJobTotalRequestData リクエスト値
     */
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getGoodJobTotalRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');

        // <jid>
        let jid = fromJid;
        if(getGoodJobTotalRequestData.jid != undefined &&
           getGoodJobTotalRequestData.jid != null){
            jid = getGoodJobTotalRequestData.jid;
        }
        var _jidElem = _itemElm.node('jid');
        _jidElem.text(_getSafeStringData(jid));
        // <dateFrom>
        var _dateFromElem = _itemElm.node('date_from');
        _dateFromElem.text(_getSafeStringData(getGoodJobTotalRequestData.dateFrom));
        // <dateTo>
        var _dateToElem = _itemElm.node('date_to');
        _dateToElem.text(_getSafeStringData(getGoodJobTotalRequestData.dateTo));

        return [ _iqElem.toString(), _id ];
    };

    /**
     * GoodJob RankingのXMPP
     *
     * string xmppServerHostName XMPPホスト名
     * string fromJid 実行者JID
     * ojbect getGoodJobRankingRequestData リクエスト値
     */
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getGoodJobRankingRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');

        // <dateFrom>
        var _dateFromElem = _itemElm.node('date_from');
        _dateFromElem.text(_getSafeStringData(getGoodJobRankingRequestData.dateFrom));
        // <dateTo>
        var _dateToElem = _itemElm.node('date_to');
        _dateToElem.text(_getSafeStringData(getGoodJobRankingRequestData.dateTo));
        // <rankBottom>
        var _rankBottomElem = _itemElm.node('rank_bottom');
        if(getGoodJobRankingRequestData.rankBottom == undefined ||
           getGoodJobRankingRequestData.rankBottom == null ||
           typeof getGoodJobRankingRequestData.rankBottom != 'number'){
            _rankBottomElem.text(-1);
        }else{
            _rankBottomElem.text(getGoodJobRankingRequestData.rankBottom);
        }
        // <limit>
        var _limitElem = _itemElm.node('limit');
        if(getGoodJobRankingRequestData.limit == undefined ||
           getGoodJobRankingRequestData.limit == null ||
           typeof getGoodJobRankingRequestData.limit != 'number'){
            _limitElem.text(-1);
        }else{
            _limitElem.text(getGoodJobRankingRequestData.limit);
        }
        // <offset>
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

    // EmotionPoint一覧のXMPP
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getEmotionPointListRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');
        // <item_id>
        var _itemIdElem = _itemElm.node('item_id');
        _itemIdElem.text(_getSafeStringData(getEmotionPointListRequestData.itemId));
        return [ _iqElem.toString(), _id ];
    };

    /**
     * EmotionPointトータル数のXMPP
     *
     * string xmppServerHostName XMPPホスト名
     * string fromJid 実行者JID
     * ojbect getEmotionPointTotalRequestData リクエスト値
     */
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getEmotionPointTotalRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');

        // <jid>
        let jid = fromJid;
        if(getEmotionPointTotalRequestData.jid != undefined &&
           getEmotionPointTotalRequestData.jid != null){
            jid = getEmotionPointTotalRequestData.jid;
        }
        var _jidElem = _itemElm.node('jid');
        _jidElem.text(_getSafeStringData(jid));
        // <dateFrom>
        var _dateFromElem = _itemElm.node('date_from');
        _dateFromElem.text(_getSafeStringData(getEmotionPointTotalRequestData.dateFrom));
        // <dateTo>
        var _dateToElem = _itemElm.node('date_to');
        _dateToElem.text(_getSafeStringData(getEmotionPointTotalRequestData.dateTo));

        return [ _iqElem.toString(), _id ];
    };

    /**
     * EmotionPointランキングのXMPP
     *
     * string xmppServerHostName XMPPホスト名
     * string fromJid 実行者JID
     * ojbect getEmotionPointRankingRequestData リクエスト値
     */
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/messageoption');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(_getSafeStringData(getEmotionPointRankingRequestData.type));
        // <items>
        var _itemsElm = _contentElem.node('items');
        _itemsElm.attr({
            'count' : '1',
        });
        // <item>
        var _itemElm = _itemsElm.node('item');

        // <dateFrom>
        var _dateFromElem = _itemElm.node('date_from');
        _dateFromElem.text(_getSafeStringData(getEmotionPointRankingRequestData.dateFrom));
        // <dateTo>
        var _dateToElem = _itemElm.node('date_to');
        _dateToElem.text(_getSafeStringData(getEmotionPointRankingRequestData.dateTo));
        // <rankBottom>
        var _rankBottomElem = _itemElm.node('rank_bottom');
        if(getEmotionPointRankingRequestData.rankBottom == undefined ||
           getEmotionPointRankingRequestData.rankBottom == null ||
           typeof getEmotionPointRankingRequestData.rankBottom != 'number'){
            _rankBottomElem.text(-1);
        }else{
            _rankBottomElem.text(getEmotionPointRankingRequestData.rankBottom);
        }
        // <limit>
        var _limitElem = _itemElm.node('limit');
        if(getEmotionPointRankingRequestData.limit == undefined ||
           getEmotionPointRankingRequestData.limit == null ||
           typeof getEmotionPointRankingRequestData.limit != 'number'){
            _limitElem.text(-1);
        }else{
            _limitElem.text(getEmotionPointRankingRequestData.limit);
        }
        // <offset>
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

    // メッセージの削除
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/delete');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <item_id>
        var _itemidElem = _contentElem.node('item_id');
        _itemidElem.text(messageData.itemId);
        // <delete_flag>
        var _deleteflagElem = _contentElem.node('delete_flag');
        _deleteflagElem.text(messageData.deleteFlag);
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text(messageData.type);

        return [ _iqElem.toString(), _id ];
    };

    // グループチャットのチャットルームの作成
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem.namespace('http://necst.nec.co.jp/protocol/createchatroom');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomname>
        var _roomNameElem = _contentElem.node('roomname');
        _roomNameElem.text(_getSafeStringData(groupChatRoomData.roomName));
        // <parent_room_id>
        var _parentRoomIdElem = _contentElem.node('parentroomid');
        _parentRoomIdElem.text(_getSafeStringData(groupChatRoomData.parentRoomId));
        // <privacy_type>
        var _privacyTypeElem = _contentElem.node('privacytype');
        if(groupChatRoomData.privacyType != undefined &&
           (""+groupChatRoomData.privacyType).match(/^\d+$/)){
            _privacyTypeElem.text(groupChatRoomData.privacyType);
        }else{
            _privacyTypeElem.text("2");
        }
        // <members>
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
        // <notiry_type>
        if(groupChatRoomData.notifyType != undefined) {
            // 存在する場合のみ設定
            var _notifyTypeElem = _contentElem.node('notify_type');
            _notifyTypeElem.text(groupChatRoomData.notifyType);
        }

        return [ _iqElem.toString(), _id ];
    };

    // グループチャットのルーム情報取得のXMPP
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem.namespace('http://necst.nec.co.jp/protocol/getchatroominfo');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem.text(_getSafeStringData(roomId));
        return [ _iqElem.toString(), _id ];
    };

    // グループチャットのルーム一覧取得のXMPP
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/getgroupchatlist');
        // <content>
        var _contentElem = _groupElem.node('content');

        // <parentRoomId>
        var _parentRoomIdElem = _contentElem.node('parentroomid');
        if(groupChatRoomListRequestData.parentRoomId == undefined){
            _parentRoomIdElem.remove();
        }else{
            _parentRoomIdElem
                .text(groupChatRoomListRequestData.parentRoomId);
        }
        // <privacy_type>
        if(groupChatRoomListRequestData.privacyType != undefined &&
           typeof groupChatRoomListRequestData.privacyType === 'number'){
            var _privacyTypeElem = _contentElem.node('privacytype');
            _privacyTypeElem
                .text(_getSafeNumberData(groupChatRoomListRequestData.privacyType));
        }

        // <listtype>
        if(groupChatRoomListRequestData.listType != undefined &&
           typeof groupChatRoomListRequestData.listType === 'number'){
            var _listTypeElem = _contentElem.node('listtype');
            _listTypeElem
                .text(_getSafeNumberData(groupChatRoomListRequestData.listType));
        }

        // <startid>
        var _startIdElem = _contentElem.node('startid');
        _startIdElem
                .text(_getSafeNumberData(groupChatRoomListRequestData.startId));
        // <count>
        var _countElem = _contentElem.node('count');
        _countElem.text(_getSafeNumberData(groupChatRoomListRequestData.count));
        // <condition>
        var _conditionElem = _contentElem.node('condition');
        var _conditionRequestData = groupChatRoomListRequestData.condition;
        if (_conditionRequestData == null) {
            return [ '', '' ];
        }
        // <sort>
        var _sortElem = _conditionElem.node('sort');
        var _sortRequestData = _conditionRequestData.sort;
        if (_sortRequestData == null) {
            return [ '', '' ];
        }
        // <item>
        var _sortItem = _sortRequestData.item;
        if (_sortItem == null || typeof _sortItem != 'string'
                || _sortItem == '') {
            return [ '', '' ];
        }
        _sortElem.node('item').text(_getSafeStringData(_sortItem));
        // <order>
        var _sortOrder = _sortRequestData.order;
        if (_sortOrder == null || typeof _sortOrder != 'string'
                || _sortOrder == '') {
            return [ '', '' ];
        }
        _sortElem.node('order').text(_getSafeStringData(_sortOrder));
        return [ _iqElem.toString(), _id ];
    };

    // グループチャットのルームに人を追加のXMPP
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/addchatroommember');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(addGroupChatMemberRequestData.roomId));
        // <member>
        var _memberElem = _contentElem.node('member');
        _memberElem
                .text(_getSafeStringData(addGroupChatMemberRequestData.member));
        return [ _iqElem.toString(), _id ];
    };
    // グループチャットルーム情報更新のXMPP
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/updatechatroominfo');
        // <content>
        var _contentElem = _groupElem.node('content');
        var _extras = updateGroupChatRoomInfoData.extras;
        if (_extras == null) {
            return [ '', '' ];
        }
        // <extras>
        var _extrasElem = _contentElem.node('extras');
        // <subType>
        var _subType = _extras.subType;
        if (_subType == null) {
            return [ '', '' ];
        }
        var _subTypeElem = _extrasElem.node('subtype');
        // <item>
        var _subTypeCount = 0;
        if ((_subType instanceof Array) && _subType.length > 0) {
            _subTypeCount = _subType.length;
        }
        for ( var _i = 0; _i < _subTypeCount; _i++) {
            var _itemElem = _subTypeElem.node('item');
            _itemElem.text(_getSafeStringData(_subType[_i]));
        }
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(updateGroupChatRoomInfoData.roomId));
        // <roomname>
        if(updateGroupChatRoomInfoData.roomName != undefined) {
            // 存在する場合のみ設定する
            var _roomnameElem = _contentElem.node('roomname');
            _roomnameElem
                .text(_getSafeStringData(updateGroupChatRoomInfoData.roomName));
        }

        // <privacytype>
        if(updateGroupChatRoomInfoData.privacyType != undefined &&
           typeof updateGroupChatRoomInfoData.privacyType === 'number'){
            var _privacyTypeElem = _contentElem.node('privacytype');
            _privacyTypeElem
                .text(_getSafeNumberData(updateGroupChatRoomInfoData.privacyType));
        }

        // <notiry_type>
        if(updateGroupChatRoomInfoData.notifyType != undefined) {
            // 存在する場合のみ設定する
            var _notifyTypeElem = _contentElem.node('notify_type');
            _notifyTypeElem.text(updateGroupChatRoomInfoData.notifyType);
        }

        return [ _iqElem.toString(), _id ];

    };
    /**
     * グループチャットルーム削除のXMPP
     * @param  {string} xmppServerHostName          送信先のXMPPサーバホスト名
     * @param  {string} fromJid                     送信者のJID
     * @param  {object} deleteGroupChatRoomInfoData 削除する対象の情報（{ roomId: [string] }
     * @return {string}                             作成したXMPP
     */
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/deletechatroom');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(deleteGroupChatRoomInfoData.roomId));

        return [ _iqElem.toString(), _id ];
    };
    // GrouopChatメンバの削除リクエスト（XMPP）生成
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/removegroupchatmember');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        _contentElem.node('roomid').text(
                _getSafeStringData(removeMemberRequestData.roomId));
        // <removeType>
        _contentElem.node('removetype').text(
                _getSafeStringData(removeMemberRequestData.removeType));
        // <mebers>
        var _membersElem = _contentElem.node('members');
        // <member>
        var _members = removeMemberRequestData.members;
        var _membersCount = _members.length;
        for ( var _i = 0; _i < _membersCount; _i++) {
            _membersElem.node('member').text(_getSafeStringData(_members[_i]));
        }

        // <members> の count
        _membersElem.attr({
            count : _membersCount
        });

        return [ _iqElem.toString(), _id ];
    };
    // メール連携用メールアカウント設定のXMPPのXMPP
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
        // <mail>
        var _mailElem = _iqElem.node('mail');
        _mailElem.namespace('http://necst.nec.co.jp/protocol/setsettings');
        // <content>
        var _contentElem = _mailElem.node('content');
        // <items>
        var _itemsElem = _contentElem.node('items');
        var _itemsCount = _items.length;
        _itemsElem.attr({
            'count' : '' + _itemsCount,
        });
        for ( var _i = 0; _i < _itemsCount; _i++) {
            var _item = _items[_i];
            var _itemElm = _itemsElem.node('item');
            // <id>
            var _idElem = _itemElm.node('id');
            _idElem.text(_getSafeNumberData(_item.id));
            // <branch_number>
            var _branchNumberElem = _itemElm.node('branch_number');
            _branchNumberElem.text(_getSafeNumberData(_item.branchNumber));
            // <mail_address>
            var _mailAddressElem = _itemElm.node('mail_address');
            _mailAddressElem.text(_getSafeStringData(_item.mailAddress));
            // <sever_id>
            var _severIdElem = _itemElm.node('server_id');
            _severIdElem.text(_getSafeNumberData(_item.serverId));
            // <mail_cooperation_type >
            var _mailCooperationTypeElem = _itemElm
                    .node('mail_cooperation_type');
            _mailCooperationTypeElem
                    .text(_getSafeNumberData(_item.mailCooperationType));
            // <setting_info>
            var _settingInfoElem = _getMailCooperationSettingInfoElem(_itemElm,
                    _item);
        }
        return [ _iqElem.toString(), _id ];
    };
    // メール連携の設定情報エレメント作成
    function _getMailCooperationSettingInfoElem(contentElem, mailSettingData) {
        var _settingInfoElem = contentElem.node('setting_info');
        var _settingInfo = mailSettingData.settingInfo;
        if (_settingInfo == null || _settingInfo.length == 0) {
            return _settingInfoElem;
        }
        // 今はPOPのみ対応
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

    // メールサーバ一覧取得
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
        // <mail>
        var _mailElem = _iqElem.node('mail');
        _mailElem.namespace('http://necst.nec.co.jp/protocol/getserverlist');
        // <content>
        var _contentElem = _mailElem.node('content');
        return [ _iqElem.toString(), _id ];
    };
    // メールアカウント設定取得
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
        // <mail>
        var _mailElem = _iqElem.node('mail');
        _mailElem.namespace('http://necst.nec.co.jp/protocol/getsettings');
        // <content>
        var _contentElem = _mailElem.node('content');
        return [ _iqElem.toString(), _id ];
    };
    // メールアカウント情報一覧取得
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
        // <mail>
        var _mailElem = _iqElem.node('mail');
        _mailElem
                .namespace('http://necst.nec.co.jp/protocol/getallusersettings');
        // <content>
        var _contentElem = _mailElem.node('content');
        return [ _iqElem.toString(), _id ];
    };
    // メール本文取得
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/getmailbody');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <item_id>
        _contentElem.node('item_id').text(_getSafeStringData(itemId));

        return [ _iqElem.toString(), _id ];
    };
    // メッセージのスレッドの取得のXMPP
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
        // <message>
        var _messageElem = _iqElem.node('message');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/threadmessage');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <item_id>
        _contentElem.node('item_id').text(_getSafeStringData(itemId));

        return [ _iqElem.toString(), _id ];
    };
    // メッセージの件数取得
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/getcount');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <typpe>
        var _typeElem = _contentElem.node('type').text(
                _getSafeStringData(messageCountInfoData.type));
        // <condition>
        var _conditionElem = _contentElem.node('condition');
        // <filter>
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
    // コミュニティに人を追加のXMPP
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/addcommunitymember');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(addCommunityMemberRequestData.roomId));
        // <members>
        var _membersElem = _contentElem.node('members');
        // <member>
        var _memberItems = addCommunityMemberRequestData.members;
        var _memberItemsCount = _memberItems.length;
        for ( var _i = 0; _i < _memberItemsCount; _i++) {
            _membersElem.node('member').text(
                    _getSafeStringData(_memberItems[_i]));
        }

        // <owners> の count
        _membersElem.attr({
            count : _memberItemsCount
        });
        return [ _iqElem.toString(), _id ];
    };
    // コミュニティオーナー更新
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/updatecommunityowner');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        _contentElem.node('roomid').text(
                _getSafeStringData(communityOwnerRequestData.roomId));
        // <owners>
        var _ownersElem = _contentElem.node('owners');
        // <owner>
        var _ownerItems = communityOwnerRequestData.ownerItems;
        var _ownerItemsCount = _ownerItems.length;
        for ( var _i = 0; _i < _ownerItemsCount; _i++) {
            _ownersElem.node('owner').text(_getSafeStringData(_ownerItems[_i]));
        }

        // <owners> の count
        _ownersElem.attr({
            count : _ownerItemsCount
        });

        return [ _iqElem.toString(), _id ];
    };
    // コミュニティメンバー削除
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/removecommunitymember');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        _contentElem.node('roomid').text(
                _getSafeStringData(removeMemberRequestData.roomId));
        // <mebers>
        var _membersElem = _contentElem.node('members');
        // <member>
        var _members = removeMemberRequestData.members;
        var _membersCount = _members.length;
        for ( var _i = 0; _i < _membersCount; _i++) {
            _membersElem.node('member').text(_getSafeStringData(_members[_i]));
        }

        // <members> の count
        _membersElem.attr({
            count : _membersCount
        });

        return [ _iqElem.toString(), _id ];
    };
    // ユーザ検索
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
        // <person>
        var _messageElem = _iqElem.node('person');
        _messageElem.namespace('http://necst.nec.co.jp/protocol/searchperson');
        // <content>
        var _contentElem = _messageElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        var _type = _convertPersonSearchType(type);
        if(_type == null){
            return [null, null];
        }
        _typeElem.text(_type);
        // <condition>
        var _conditionElem = _contentElem.node('condition');
        // <filter>
        var _filterElem = _conditionElem.node('filter');
        _getFilterConditionXmppElem(_filterElem, filter);
        // <sort>
        var _sortElem = _conditionElem.node('sort');
        // <item>
        _sortElem.node('item').text(sort.item);
        // <order>
        _sortElem.node('order').text(sort.order);

        // <startid>
        _contentElem.node('startid').text('' + startId);
        // <count>
        _contentElem.node('count').text('' + count);
        return [ _iqElem.toString(), _id ];
    };
    // ユーザ検索タイプのコンバート
    function _convertPersonSearchType(type){
        var _ret = null;
        if(type == RequestData.GET_PERSON_LIST_TYPE_SEARCH_SUB_TYPE_ALL_USERS){
            _ret = 'allusers';
        }
        return _ret;
    }
    // 端末情報登録
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
        // <device_info>
        var _deviceInfoElem = _iqElem.node('device_info');
        _deviceInfoElem
                .namespace('http://necst.nec.co.jp/protocol/deviceinfo/register');
        // <content>
        var _contentElem = _deviceInfoElem.node('content');
        // <device_id>
        _contentElem.node('device_id').text(deviceId);
        // <notification_service>
        _contentElem.node('notification_service').text(notificationService);
        return [ _iqElem.toString(), _id ];
    };
    // 端末情報削除
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
        // <device_info>
        var _deviceInfoElem = _iqElem.node('device_info');
        _deviceInfoElem
                .namespace('http://necst.nec.co.jp/protocol/deviceinfo/delete');
        // <content>
        var _contentElem = _deviceInfoElem.node('content');
        // <device_id>
        _contentElem.node('device_id').text(deviceId);
        return [ _iqElem.toString(), _id ];
    };
    // ユーザ登録（※単一ユーザの登録のみ）
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('jabber:iq:register');
        // <username>
        var _userNameElem = _queryElem.node('username');
        _userNameElem.text(openfireAccount);
        // <password>
        var _passwordElem = _queryElem.node('password');
        _passwordElem.text(password);
        // <email>
        var _emailElem = _queryElem.node('email');
        _emailElem.text(personData.getMail());
        // <vCard>
        var _vCardElem = _queryElem.node('vCard');
        _vCardElem.namespace('vcard-temp');
        // <NICKNAME>
        var _nickNameElem = _vCardElem.node('NICKNAME');
        _nickNameElem.text(personData.getNickName());
        var _groups = personData.getGroup();
        var _groupElem = _getGroupElmFromGroupArray(_queryElem, _groups);

        // <contact>
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
    // ユーザ権限取得
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
        // <user_authority>
        var _userAuthorityElem = _iqElem.node('user_authority');
        _userAuthorityElem
                .namespace('http://necst.nec.co.jp/protocol/authority');
        return [ _iqElem.toString(), _id ];
    };
    // 全ユーザ情報一覧取得のXMPP
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text('GetAllUserList');
        // テナント指定がある場合はテナント情報を付加する
        if (tenantId != null && typeof tenantId == 'string' && tenantId != '') {
            // <tenant_id>
            var _tenantIdElem = _contentElem.node('tenant_id');
            _tenantIdElem.text(tenantId);
        }
        return [ _iqElem.toString(), _id ];
    };
    // 指定ユーザ情報一覧取得のXMPP
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text('GetSelectUserList');
        // <items>
        var _itemsElem = _contentElem.node('items');

        if (userAcountDataList != null) {
            var _count = userAcountDataList.length;
            for ( var _i = 0; _i < _count; _i++) {
                var _itemElem = _itemsElem.node('item');
                // <jid>
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
    // ユーザ情報更新のXMPP
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text('UpdateVCard');
        // <jid>
        var _jid = updateVCardData.jid;
        var _jidElem = _contentElem.node('jid');
        _jidElem.text(_jid);
        // <vCard>
        var _vCardElem = _contentElem.node('vCard');
        _vCardElem.namespace('vcard-temp');
        // <NICKNAME>
        var _nickName = updateVCardData.nickName;
        if (_nickName == null) {
            _nickName = '';
        }
        _vCardElem.node('NICKNAME').text(_nickName);
        // <PHOTO>
        var _photoElem = _vCardElem.node('PHOTO');
        // <TYPE>
        var _photoType = updateVCardData.avatarType;
        if (_photoType == null) {
            _photoType = '';
        }
        _photoElem.node('TYPE').text(_photoType);
        // <BINVAL>
        var _photoBinVal = updateVCardData.avatarData;
        if (_photoBinVal == null) {
            _photoBinVal = '';
        }
        _photoElem.node('BINVAL').text(_photoBinVal);
        return [ _iqElem.toString(), _id ];
    };
    // コミュニティの作成
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem.namespace('http://necst.nec.co.jp/protocol/createcommunity');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomname>
        var _roomNameElem = _contentElem.node('roomname');
        _roomNameElem.text(_getSafeStringData(communityRoomData.roomName));
        // <description>
        var _descriptionElem = _contentElem.node('description');
        _descriptionElem
                .text(_getSafeStringData(communityRoomData.description));
        // <privacytype>
        var _privacyTypeElem = _contentElem.node('privacytype');
        _privacyTypeElem.text(_getSafeStringData(''
                + communityRoomData.privacyType));
        // <memberentrytype>
        var _memberEntryTypeElem = _contentElem.node('memberentrytype');
        _memberEntryTypeElem.text(_getSafeStringData(''
                + communityRoomData.memberEntryType));
        // <logourl>
        var _logoUrlElem = _contentElem.node('logourl');
        _logoUrlElem.text(_getSafeStringData(communityRoomData.logoUrl));
        // <notiry_type>
        if(communityRoomData.notifyType != undefined) {
            // 存在する場合のみ設定
            var _notifyTypeElem = _contentElem.node('notify_type');
            _notifyTypeElem.text(communityRoomData.notifyType);
        }
        return [ _iqElem.toString(), _id ];
    };
    // 自分の参加しているコミュニティ一覧の取得
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/getmycommunitylist');
        // <content>
        var _contentElem = _groupElem.node('content');

        // <privacyType>
        if( myCommunityListRequestData.privacyType != undefined &&
            typeof myCommunityListRequestData.privacyType === 'number' ){
            var _privacyTypeElem = _contentElem.node('privacytype');
            _privacyTypeElem.text(_getSafeNumberData(myCommunityListRequestData.privacyType));
        }

        // <listType>
        if( myCommunityListRequestData.listType != undefined &&
            typeof myCommunityListRequestData.listType === 'number' ){
            var _listTypeElem = _contentElem.node('listtype');
            _listTypeElem.text(_getSafeNumberData(myCommunityListRequestData.listType));
        }

        // <startid>
        var _startIdElem = _contentElem.node('startid');
        _startIdElem
                .text(_getSafeNumberData(myCommunityListRequestData.startId));
        // <count>
        var _countElem = _contentElem.node('count');
        _countElem.text(_getSafeNumberData(myCommunityListRequestData.count));
        // <condition>
        var _conditionElem = _contentElem.node('condition');
        var _conditionRequestData = myCommunityListRequestData.condition;
        if (_conditionRequestData == null) {
            return [ '', '' ];
        }
        // <sort>
        var _sortElem = _conditionElem.node('sort');
        var _sortRequestData = _conditionRequestData.sort;
        if (_sortRequestData == null) {
            return [ '', '' ];
        }
        // <item>
        var _sortItem = _sortRequestData.item;
        if (_sortItem == null || typeof _sortItem != 'string'
                || _sortItem == '') {
            return [ '', '' ];
        }
        _sortElem.node('item').text(_getSafeStringData(_sortItem));
        // <order>
        var _sortOrder = _sortRequestData.order;
        if (_sortOrder == null || typeof _sortOrder != 'string'
                || _sortOrder == '') {
            return [ '', '' ];
        }
        _sortElem.node('order').text(_getSafeStringData(_sortOrder));
        return [ _iqElem.toString(), _id ];
    };
    // コミュニティ情報の取得
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/getcommunityinfo');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem.text(_getSafeStringData(communityInfoRequestData.roomId));
        return [ _iqElem.toString(), _id ];
    };
    // コミュニティ参加者情報の取得
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/getcommunitymemberinfo');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem
                .text(_getSafeStringData(communityMemberInfoRequestData.roomId));
        return [ _iqElem.toString(), _id ];
    };
    // コミュニティ情報の更新のXMPP
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/updatecommunityinfo');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem.text(_getSafeStringData(updateCommunityInfoData.roomId));
        // <roomname>
        var _roomnameElem = _contentElem.node('roomname');
        _roomnameElem
                    .text(_getSafeStringData(updateCommunityInfoData.roomName));
        // <description>
        var _descriptionElem = _contentElem.node('description');
        _descriptionElem
                .text(_getSafeStringData(updateCommunityInfoData.description));
        // <privacytype>
        var _privacyTypeElem = _contentElem.node('privacytype');
        _privacyTypeElem
                .text(_getSafeNumberData(updateCommunityInfoData.privacyType));
        // <memberentrytype>
        var _memberEntryTypeElem = _contentElem.node('memberentrytype');
        _memberEntryTypeElem
                .text(_getSafeNumberData(updateCommunityInfoData.memberEntryType));
        // <logourl>
        var _logoUrlElem = _contentElem.node('logourl');
        _logoUrlElem.text(_getSafeStringData(updateCommunityInfoData.logoUrl));
        // <notiry_type>
        if(updateCommunityInfoData.notifyType != undefined) {
            // 存在する場合のみ設定
            var _notifyTypeElem = _contentElem.node('notify_type');
            _notifyTypeElem.text(updateCommunityInfoData.notifyType);
        }
        return [ _iqElem.toString(), _id ];
    };
    /**
     * コミュニティ削除のXMPP
     * @param  {string} xmppServerHostName          送信先のXMPPサーバホスト名
     * @param  {string} fromJid                     送信者のJID
     * @param  {object} deleteGroupChatRoomInfoData 削除する対象の情報（{ roomId: [string] }
     * @return {string}                             作成したXMPP
     */
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
        // <group>
        var _groupElem = _iqElem.node('group');
        _groupElem
                .namespace('http://necst.nec.co.jp/protocol/deletecommunity');
        // <content>
        var _contentElem = _groupElem.node('content');
        // <roomid>
        var _roomIdElem = _contentElem.node('roomid');
        _roomIdElem.text(_getSafeStringData(communityInfoRequestData.roomId));
        return [ _iqElem.toString(), _id ];
    };
    // Admin用他のユーザのパスワード更新のXMPP
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text('UpdateUserPassword');
        // <jid>
        var _userNameElem = _contentElem.node('username');
        _userNameElem.text(targetUserName);
        // <password>
        var _passwordElem = _contentElem.node('password');
        _passwordElem.text(password);
        return [ _iqElem.toString(), _id ];
    };
    // ユーザ登録(※複数のユーザ登録に対応)
    // createUserList : 登録ユーザ情報の配列
    // openfireAccount : Openfireアカウント
    // personData : PersonDataオブジェクト
    // password : パスワード
    // registeredContactData : RegisteredContactDataオブジェクト
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text('CreateUser');
        // <items>
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
                // <username>
                var _userNameElem = _itemElem.node('username');
                var _openfireAccount = _createUserData.openfireAccount;
                _userNameElem.text(_openfireAccount);
                // <password>
                var _passwordElem = _itemElem.node('password');
                var _password = _createUserData.password;
                _passwordElem.text(_password);
                // <email>
                var _emailElem = _itemElem.node('email');
                _emailElem.text(_personData.getMail());
                // <vCard>
                var _vCardElem = _itemElem.node('vCard');
                _vCardElem.namespace('vcard-temp');
                // <NICKNAME>
                var _nickNameElem = _vCardElem.node('NICKNAME');
                _nickNameElem.text(_personData.getNickName());
                // <group>
                var _groups = _personData.getGroup();
                var _groupElem = _getGroupElmFromGroupArray(_itemElem, _groups);
                // <contact>
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
    // ユーザ更新(※複数のユーザ更新に対応)
    // updateUserList : 登録ユーザ情報の配列
    // openfireAccount : Openfireアカウント
    // nickname : ニックネーム
    // group : グループ
    // delete_flg : 削除フラグ
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text('UpdateUser');
        // <items>
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
                // <username>
                var _userNameElem = _itemElem.node('username');
                var _openfireAccount = _updateUserData.openfireAccount;
                _userNameElem.text(_openfireAccount);
                // <vCard>
                var _vCardElem = _itemElem.node('vCard');
                _vCardElem.namespace('vcard-temp');
                // <NICKNAME>
                var _nickNameElem = _vCardElem.node('NICKNAME');
                _nickNameElem.text(_updateUserData.nickname);
                // <group>
                var _groups = _updateUserData.group;
                var _groupElem = _getGroupElmFromGroupArray(_itemElem, _groups);
                // <delete_flg>
                var _deleteFlgElem = _itemElem.node('delete_flg');
                var _delete_flg = _updateUserData.delete_flg;
                _deleteFlgElem.text(_delete_flg);
                // <EMAIL>
                if(_updateUserData.mailAddress != null) {
                    var _emailElem = _vCardElem.node('EMAIL');
                    _emailElem.node('USERID').text(_updateUserData.mailAddress);
                }
            }
        }
        return [ _iqElem.toString(), _id ];
    };
    // グループエレメントの生成
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
            // <item>
            var _itemElem = _groupElem.node('item');
            _itemElem.text(groupArray[_i]);
        }
        return _groupElem;
    }
    // ユーザ物理削除
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text('PhysicalDeleteUser');
        // <items>
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
                // <username>
                var _userNameElem = _itemElem.node('username');
                _userNameElem.text(_deleteUser);
            }
        }
        return [ _iqElem.toString(), _id ];
    };
    // Admin用他のユーザのステータス更新のXMPP
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
        // <query>
        var _queryElem = _iqElem.node('query');
        _queryElem.namespace('http://necst.nec.co.jp/protocol/admin');
        // <content>
        var _contentElem = _queryElem.node('content');
        // <type>
        var _typeElem = _contentElem.node('type');
        _typeElem.text('UpdateUserAccountStatus');
        // <username>
        var _userNameElem = _contentElem.node('username');
        _userNameElem.text(targetUserName);
        // <accountStatus>
        var _accountStatusElem = _contentElem.node('accountstatus');
        _accountStatusElem.text(_getSafeNumberData(accountStatus));
        return [ _iqElem.toString(), _id ];
    };
    // ソケットハートビート用
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
        // <ping>
        var _pingElem = _iqElem.node('ping');
        _pingElem.namespace('urn:xmpp:ping');
        return [ _iqElem.toString(), _id ];
    };
    // サーバからPingを送ってきた場合の応答
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
