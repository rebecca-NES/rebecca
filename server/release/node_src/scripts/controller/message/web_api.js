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
const Log = require('../server_log').getInstance();
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const API_STATUS = require('../const').API_STATUS;
const API_REQUEST = require('../const').API_REQUEST;
const RequestData = require('../../model/request_data').RequestData;
const Validation = require('../validation');
const SessionDataMannager = require('../session_data_manager');
const XmppUtils = require('../xmpp_utils');
const Xmpp = require('../xmpp').Xmpp;
const libxml = require("libxmljs");
const Utils = require("../../utils");
const Formatting = require('../formatting');

exports.getTreadTitleList = (socket, receiveObj={}, callback, apiUtil) => {
    Log.connectionLog(7, 'do func message/WebApi.getTreadTitleList(...');
    if(!_.has(receiveObj,"accessToken")||
       !_.has(receiveObj,"content")||
       (
           ! Validation.messageTypeValidationCheck(receiveObj.content.type, true) &&
           receiveObj.content.type != "all"
       )||
       receiveObj.content.type == 'Task' ||
       ! Validation.roomIdValidationCheck(receiveObj.content.roomId, false)||
       ! Validation.jidValidationCheck(receiveObj.content.msgto, false)){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }
    const _accessToken = receiveObj.accessToken;
    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _xsConn = _sessionData.getOpenfireSock();
    const _xmppServerHostName = _sessionData.getXmppServerName();
    const _fromJid = _sessionData.getJid();
    let _xmppSendMessage = XmppUtils.checkCreateXmppData(
        _xsConn, ()  => {
            return Xmpp.createGetThreadTitleListXmpp(
                _xmppServerHostName,
                _fromJid,
                {
                    type         : receiveObj.content.type,
                    roomId       : receiveObj.content.roomId,
                    msgto        : receiveObj.content.msgto,
                    condition    : receiveObj.content.condition
                }
            );
        }
    );
    if (_xmppSendMessage == null) {
        Log.connectionLog(3, '_xmppSendMessage is null');
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }
    const _xmppStr = _xmppSendMessage[0];
    if (_xmppStr == null || _xmppStr == '') {
        Log.connectionLog(3, '_xmppSendMessage[0] is invalid');
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }
    const _id = _xmppSendMessage[1];

    _sessionData.setCallback(_id, (responstXML) => {
        let resContent = {
            result: false,
            reason: API_STATUS.INTERNAL_SERVER_ERROR,
        };
        let errorCode = 1;
        const xmldoc = libxml.parseXml(responstXML);
        const iqElem = xmldoc.root();

        switch (iqElem.attr('type').value()) {
        case "result": {
            const messageElem = Utils.getChildXmlElement(iqElem, "message");
            const contentElem = Utils.getChildXmlElement(messageElem, "content");
            const extrasElem = Utils.getChildXmlElement(contentElem, "extras");
            const _extras = {};
            if(extrasElem != undefined &&
               extrasElem != null &&
               extrasElem.name() == "extras" &&
               extrasElem.childNodes().length > 0){
                for(let i=0;i<extrasElem.childNodes().length;i++){
                }
            }
            const itemsElem = Utils.getChildXmlElement(contentElem, "items");
            if(itemsElem == null){
                Log.connectionLog(3, 'message/WebApi.getTreadTitleList(. items is null');
                resContent = {
                    result: false,
                    reason: API_STATUS.BAD_REQUEST,
                };
                break;
            }
            const itemArray = Utils.getChildXmlElementArray(itemsElem, "item");
            let _items = [];
            for(let i=0;i<itemArray.length;i++){
                _items[i] = {
                    id: Utils.getChildXmlElement(itemArray[i],"id").text(),
                    msgType: parseInt(Utils.getChildXmlElement(itemArray[i],"msgtype").text()),
                    threadTitle: Utils.getChildXmlElement(itemArray[i],"thread_title").text(),
                    threadRootId: Utils.getChildXmlElement(itemArray[i],"thread_root_id").text(),
                    editedAt: Utils.getChildXmlElement(itemArray[i],"edited_at").text(),
                    roomName: Utils.getChildXmlElement(itemArray[i],"room_name").text()
                };
            }
            resContent = {
                result: true,
                reason: API_STATUS.SUCCESS,
                type : receiveObj.content.type,
                extras : _extras,
                count : itemArray.length,
                items : _items
            };
            errorCode = 0;
            break;
        }
        case "error": {
            const errorElm = Utils.getChildXmlElement(iqElem,"error");
            if(errorElm.attr('code') == undefined){
                resContent = {
                    result: false,
                    reason: API_STATUS.INTERNAL_SERVER_ERROR,
                };
                break;
            }
            const codeattr = errorElm.attr('code').value();
            if(isNaN(codeattr) ||
               codeattr.length == 0){
                Log.connectionLog(4, 'message/WebApi.getTreadTitleList(... openfire responce xmpp code not number');
                resContent = {
                    result: false,
                    reason: API_STATUS.INTERNAL_SERVER_ERROR,
                };
            }else{
                if(codeattr == "500"){
                    Log.connectionLog(3, 'message/WebApi.getTreadTitleList(... openfire responce code - in error : ' + codeattr);
                }else{
                    Log.connectionLog(6, 'message/WebApi.getTreadTitleList(... openfire responce code - in error : ' + codeattr);
                }
                if(codeattr.length == 3){
                    resContent = {
                        result: false,
                        reason: parseInt(codeattr + "900"),
                    };
                }else{
                    resContent = {
                        result: false,
                        reason: parseInt(codeattr),
                    };
                }
            }
            break;
        }
        default: {
            Log.connectionLog(3, 'message/WebApi.getTreadTitleList(... switch default: ' + iqElem.attr('type').value());
            resContent = {
                result: false,
                reason: API_STATUS.INTERNAL_SERVER_ERROR,
            };
            break;
        }
        }
        executeCallback(receiveObj,
                        callback, resContent, errorCode, apiUtil);
    });
    _xsConn.send(_xmppStr);
    return;
};

exports.updateTreadTitle = (socket, receiveObj={}, callback, apiUtil) => {
    Log.connectionLog(7, 'do func message/WebApi.updateThreadTitle(...');
    if(!_.has(receiveObj,"accessToken")||
       !_.has(receiveObj,"content")){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }
    receiveObj.content.threadTitle = Formatting.exTrim(receiveObj.content.threadTitle);
    if(! Validation.messageTypeValidationCheck(receiveObj.content.type, true) ||
       ! Validation.threadTitleValidationCheck(receiveObj.content.threadTitle, true) ||
       ! Validation.itemIdValidationCheck(receiveObj.content.threadRootId, true) ||
       ! Validation.itemIdValidationCheck(receiveObj.content.itemId, true) ||
       ! Validation.roomIdValidationCheck(receiveObj.content.roomId, false)||
       ! Validation.jidValidationCheck(receiveObj.content.msgto, false)){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }

    const _accessToken = receiveObj.accessToken;
    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _xsConn = _sessionData.getOpenfireSock();
    const _xmppServerHostName = _sessionData.getXmppServerName();
    const _fromJid = _sessionData.getJid();

    let _xmppSendMessage = XmppUtils.checkCreateXmppData(
        _xsConn, ()  => {
            return Xmpp.createUpdateThreadTitleXmpp(
                _xmppServerHostName,
                _fromJid,
                {
                    type         : receiveObj.content.type,
                    threadTitle  : receiveObj.content.threadTitle,
                    threadRootId : receiveObj.content.threadRootId,
                    itemId       : receiveObj.content.itemId,
                    roomId       : receiveObj.content.roomId,
                    msgto        : receiveObj.content.msgto
                }
            );
        }
    );
    if (_xmppSendMessage == null) {
        Log.connectionLog(3, '_xmppSendMessage is null');
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }
    const _xmppStr = _xmppSendMessage[0];
    if (_xmppStr == null || _xmppStr == '') {
        Log.connectionLog(3, '_xmppSendMessage[0] is invalid');
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }
    const _id = _xmppSendMessage[1];
    _sessionData.setCallback(_id, (responstXML) => {
        let result = false;
        let reason = API_STATUS.INTERNAL_SERVER_ERROR;
        const xmldoc = libxml.parseXml(responstXML);
        const iqElem = xmldoc.root();
        let errorCode = 1;
        switch(iqElem.attr('type').value()) {
        case "result": {
            result = true;
            reason = API_STATUS.SUCCESS;
            errorCode = 0;
            break;
        }
        case "error": {
            const errorElm = Utils.getChildXmlElement(iqElem,"error");
            if(errorElm.attr('code') == undefined){
                result =  false;
                reason =  API_STATUS.INTERNAL_SERVER_ERROR;
                break;
            }
            const codeattr = errorElm.attr('code').value();
            if(isNaN(codeattr) ||
               codeattr.length == 0){
                Log.connectionLog(4, 'message/WebApi.updateThreadTitle(... openfire responce xmpp code not number');
                result = false;
                reason = API_STATUS.INTERNAL_SERVER_ERROR;
            }else{
                if(codeattr == "500"){
                    Log.connectionLog(3, 'message/WebApi.getTreadTitleList(... openfire responce code - in error : ' + codeattr);
                }else{
                    Log.connectionLog(6, 'message/WebApi.getTreadTitleList(... openfire responce code - in error : ' + codeattr);
                }
                result = false;
                if(codeattr.length == 3){
                    reason = parseInt(codeattr + "900");
                }else{
                    reason = parseInt(codeattr);
                }
            }
            break;
        }
        default: {
            Log.connectionLog(3, 'message/WebApi.updateThreadTitle(... switch default: ' + iqElem.attr('type').value());
            result = false;
            reason = API_STATUS.INTERNAL_SERVER_ERROR;
            break;
        }
        }
        executeCallback(receiveObj,
                        callback, {
                            result: result,
                            reason: reason,
                        }, errorCode, apiUtil);
    });
    _xsConn.send(_xmppStr);
    return;
};

exports.searchAllMessage = (socket, receiveObj={}, callback, apiUtil) => {
    let _ret = false;
    if(!_.has(receiveObj,"accessToken")||
       !_.has(receiveObj,"content")||
       !_.has(receiveObj.content,"condition")||
       ! filterJsonEncodeCheck(receiveObj.content.condition) ||
       !_.has(receiveObj.content.condition,"filter")||
       !_.has(receiveObj.content.condition.filter,"value") ||
       !_.isArray(receiveObj.content.condition.filter.value) ||
       receiveObj.content.condition.filter.value.length <= 0){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return _ret;
    }

    const _accessToken = receiveObj.accessToken;
    const _content = receiveObj.content;
    const _getAllMessageCallback = (result, reason, extras, count, items) => {
        Object.assign(_content, { result, reason, extras, count, items });
        if(!result){
            Log.connectionLog(3, `message.web_api#searchAllMessage Xmpp searchAllMessage error (xmpp reason: ${reason})`);
            executeCallback(receiveObj,
                            callback, {
                                result: false,
                                reason: API_STATUS.INTERNAL_SERVER_ERROR
                            }, 1, apiUtil);
            return;
        }
        delete _content.condition;
        _content["reason"] = API_STATUS.SUCCESS;

        executeCallback(receiveObj, callback, _content, 0, apiUtil);
    };
    var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.getMessage(
        _accessToken,
        _content,
        _getAllMessageCallback);
};

exports.deleteMessage = (socket, receiveObj={}, callback, apiUtil) => {
    let _ret = false;
    if(!_.has(receiveObj, 'accessToken')       ||
       !_.has(receiveObj, 'content')           ||
       !_.has(receiveObj.content, 'type')      ||
       !_.has(receiveObj.content, 'itemId')    ||
       !_.has(receiveObj.content, 'deleteFlag')
    ){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        Log.connectionLog(6, 'profile.web_api.doApi invalid parameter');
        return _ret;
    }
    const _accessToken = receiveObj.accessToken;
    const _content = receiveObj.content;
    const _requestStr = receiveObj.request;
    const _type = _content.type;
    const _deleteMessageCallback = (result, reason) => {
        if(!result){
            Log.connectionLog(4, `deletemessage.web_api#create Xmpp deleteMessage error (xmpp reason: ${reason})`);
            executeCallback(receiveObj,
                            callback, {
                                type: _type,
                                result: false,
                                reason: API_STATUS.BAD_REQUEST
                            }, 1, apiUtil);
            return;
        }
        var _responceContent = {};
        _responceContent.result = result;
        _responceContent.reason = reason;
        _responceContent.type = _type;

        executeCallback(receiveObj,
                        callback, _responceContent, 0, apiUtil);
    };
    if (_requestStr == API_REQUEST.API_DELETE_MESSAGE) {
        if (_type == RequestData.DELETE_MESSAGE_TYPE_ADMIN_DELETE ) {
            Log.connectionLog(4, 'request is invalid. deletemessage.web_api::deleteMessage - (request = ' + _requestStr);
            executeCallback(receiveObj,
                            callback, {
                                type: _type,
                                result: false,
                                reason: API_STATUS.BAD_REQUEST
                            }, 1, apiUtil);
            return;
        }
    }
    if ( _requestStr == API_REQUEST.API_ADMIN_DELETE_MESSAGE
        && _type == RequestData.DELETE_MESSAGE_TYPE_DELETE) {
        Log.connectionLog(4, 'request is invalid. deletemessage.web_api::deleteMessage - (request = ' + _requestStr);
        executeCallback(receiveObj,
                        callback, {
                            type: _type,
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }
    if (_content.deleteFlag == 0 || _content.deleteFlag > 2) {
        Log.connectionLog(4, 'deleteFlag is invalid. deletemessage.web_api::deleteMessage - (deleteFlag = ' + _content.deleteFlag);
        executeCallback(receiveObj,
                        callback, {
                            type: _type,
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return;
    }
    var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.deleteMessage(
        _accessToken,
        _content,
        _deleteMessageCallback);
};

function executeCallback(req,  callback, content, errorCode, apiUtil) {
    const _req = req.request,
            _id = req.id,
            _version = req.version,
            _token = req.accessToken;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, content);
}

function filterJsonEncodeCheck(filterjson){
    var rejsonkey = /^[a-zA-Z0-9-_]+$/;
    var rejsonval = /^[\w-+@\/:%!~\*\.\(\)'\s]+$/;
    for(let key in filterjson){
        if(!_.isString(key)  ||
           ! key.match(rejsonkey) ||
           key.length > 32){
            Log.connectionLog(4, "message.web_api#filterJsonEncodeCheck - error key : [" + key + "]");
            return false;
        }
        if(_.isArray('array') ||
           _.isObject(filterjson[key])){
            if(!filterJsonEncodeCheck(filterjson[key])){
                return false;
            }
            continue;
        }
        if(_.isString(filterjson[key]) &&
           (filterjson[key].length > 1260 ||
            ! filterjson[key].match(rejsonval))
          ){
            Log.connectionLog(4, "message.web_api#filterJsonEncodeCheck - error value : [" + filterjson[key] + "]");
            return false;
        }
    }
    return true;
}
