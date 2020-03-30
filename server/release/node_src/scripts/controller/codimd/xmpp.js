const libxml = require('libxmljs');
const Utils = require('../../utils');
let log = require("../server_log").getInstance();

/**
 * XMPPリクエストXML作成関数 controller/xmpp.js内と同様の処理内容)
 */

/**
 * リクエストXmpp作成関数
 * ノート削除時に通知を送るためにOpenfireへ接続
 *
 */
exports.makeDeleteNoteForXmpp = (xmppServerHostName, fromJid, noteInfoData) => {
    log.connectionLog(7,"do func codimd.xmpp.js makeDeleteNoteForXmpp(");
    var _doc = libxml.Document();
    var _fromJid = fromJid.split('/')[0];
    var _iqElem = _doc.node('iq');
    var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
    var _id = 'deleteNote' + _randomNum;
    _iqElem.attr({
        'type' : 'set',
        'id' : _id,
        'from' : _fromJid,
        'to' : xmppServerHostName,
    });
    // <note>
    var _noteElem = _iqElem.node('note');
    _noteElem.namespace('http://necst.nec.co.jp/protocol/deletenote');
    // <item>
    var _itemElem = _noteElem.node('item');
    _itemElem.attr(noteInfoData);
    // created_at_longtime
    let created_at_longtime = Date.parse(noteInfoData.created_at);
    _itemElem.attr("created_at_longtime", (
        (created_at_longtime &&
         typeof created_at_longtime == "number" &&
         !isNaN(created_at_longtime)
        ) ? created_at_longtime : ""));
    // updated_at_longtime
    let updated_at_longtime = Date.parse(noteInfoData.updated_at);
    _itemElem.attr("updated_at_longtime",(
        (updated_at_longtime &&
         typeof updated_at_longtime == "number" &&
         !isNaN(updated_at_longtime)) ?
        updated_at_longtime : ""));
    log.connectionLog(7," codimd.xmpp.js makeDeleteNoteForXmpp _iqElem.toString():"+_iqElem.toString());
    return [ _iqElem.toString(), _id ];
};

/**
 * リクエストXmpp作成関数
 * ノート情報更新時除時に通知を送るためにOpenfireへ接続
 *
 */
exports.makeUpdateNoteInfoForXmpp = (xmppServerHostName, fromJid, noteInfoData) => {
    log.connectionLog(7,"do func codimd.xmpp.js makeUpdateNoteInfoForXmpp(");
    var _doc = libxml.Document();
    var _fromJid = fromJid.split('/')[0];
    var _iqElem = _doc.node('iq');
    var _randomNum = Utils.getRandomNumber(0, Math.pow(2, 31) - 1);
    var _id = 'deleteNote' + _randomNum;
    _iqElem.attr({
        'type' : 'set',
        'id' : _id,
        'from' : _fromJid,
        'to' : xmppServerHostName,
    });
    // <note>
    var _noteElem = _iqElem.node('note');
    _noteElem.namespace('http://necst.nec.co.jp/protocol/updatenoteinfo');
    // <item>
    var _itemElem = _noteElem.node('item');
    //_itemElem.attr(noteInfoData);
    _itemElem.attr(noteInfoData);
    // created_at_longtime
    let created_at_longtime = Date.parse(noteInfoData.created_at);
    _itemElem.attr("created_at_longtime", (
        (created_at_longtime &&
         typeof created_at_longtime == "number" &&
         !isNaN(created_at_longtime)
        ) ? created_at_longtime : ""));
    // updated_at_longtime
    let updated_at_longtime = Date.parse(noteInfoData.updated_at);
    _itemElem.attr("updated_at_longtime",(
        (updated_at_longtime &&
         typeof updated_at_longtime == "number" &&
         !isNaN(updated_at_longtime)) ?
        updated_at_longtime : ""));
    //
    log.connectionLog(7," codimd.xmpp.js makeUpdateNoteInfoForXmpp _iqElem.toString():"+_iqElem.toString());
    return [ _iqElem.toString(), _id ];
};

