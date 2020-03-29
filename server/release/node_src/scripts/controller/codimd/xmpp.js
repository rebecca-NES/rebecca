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
const libxml = require('libxmljs');
const Utils = require('../../utils');
let log = require("../server_log").getInstance();


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
    var _noteElem = _iqElem.node('note');
    _noteElem.namespace('http://necst.nec.co.jp/protocol/deletenote');
    var _itemElem = _noteElem.node('item');
    _itemElem.attr(noteInfoData);
    let created_at_longtime = Date.parse(noteInfoData.created_at);
    _itemElem.attr("created_at_longtime", (
        (created_at_longtime &&
         typeof created_at_longtime == "number" &&
         !isNaN(created_at_longtime)
        ) ? created_at_longtime : ""));
    let updated_at_longtime = Date.parse(noteInfoData.updated_at);
    _itemElem.attr("updated_at_longtime",(
        (updated_at_longtime &&
         typeof updated_at_longtime == "number" &&
         !isNaN(updated_at_longtime)) ?
        updated_at_longtime : ""));
    log.connectionLog(7," codimd.xmpp.js makeDeleteNoteForXmpp _iqElem.toString():"+_iqElem.toString());
    return [ _iqElem.toString(), _id ];
};

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
    var _noteElem = _iqElem.node('note');
    _noteElem.namespace('http://necst.nec.co.jp/protocol/updatenoteinfo');
    var _itemElem = _noteElem.node('item');
    _itemElem.attr(noteInfoData);
    let created_at_longtime = Date.parse(noteInfoData.created_at);
    _itemElem.attr("created_at_longtime", (
        (created_at_longtime &&
         typeof created_at_longtime == "number" &&
         !isNaN(created_at_longtime)
        ) ? created_at_longtime : ""));
    let updated_at_longtime = Date.parse(noteInfoData.updated_at);
    _itemElem.attr("updated_at_longtime",(
        (updated_at_longtime &&
         typeof updated_at_longtime == "number" &&
         !isNaN(updated_at_longtime)) ?
        updated_at_longtime : ""));
    log.connectionLog(7," codimd.xmpp.js makeUpdateNoteInfoForXmpp _iqElem.toString():"+_iqElem.toString());
    return [ _iqElem.toString(), _id ];
};

