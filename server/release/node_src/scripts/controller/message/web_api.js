/**
 * メッセージを管理するWeb(ネット)からのアクセスの口になるAPI
 * cubee_web_api.jsから使われる
 *
 * @module src/scripts/controller/message/web_api
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

/**
 * 会話(thread)のタイトルのリストを取得
 *
 * @param {Object} socket - socket情報
 * @param {Object} receiveObj - リクエスト情報
 * @param {function} callback - クライアントへの応答CallBack
 *
 * @return {boolean}
 */
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
    /*
     * アクセストークン
     * セッションデータ
     * openfireのソケット
     * openfireサーバネーム
     * アクセス者のJIDを取得
     */
    const _accessToken = receiveObj.accessToken;
    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _xsConn = _sessionData.getOpenfireSock();
    const _xmppServerHostName = _sessionData.getXmppServerName();
    const _fromJid = _sessionData.getJid();
    /*
     * Xmpp XMP 作成
     */
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
    /*
     * _xmppSendMessage の値がnull
     */
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
    /*
     * _xmppSendMessage の1番目の配列値がnull又は空の時
     */
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

    /*
     * openfireからresponstXMLにのXMPPのレスポンスが帰って来る
     */
    _sessionData.setCallback(_id, (responstXML) => {
        // The initial value of resContent is unused, since it is always overwritten.
        let resContent; /* = {
            result: false,
            reason: API_STATUS.INTERNAL_SERVER_ERROR,
        }; */
        let errorCode = 1;
        /*
         * openfireからのレスポンス値にエラーが有ればその値を
         */
        const xmldoc = libxml.parseXml(responstXML);
        const iqElem = xmldoc.root();

        switch (iqElem.attr('type').value()) {
        case "result": {
            const messageElem = Utils.getChildXmlElement(iqElem, "message");
            const contentElem = Utils.getChildXmlElement(messageElem, "content");
            const extrasElem = Utils.getChildXmlElement(contentElem, "extras");
            const _extras = {};
            // This guard always evaluates to true.
            if(extrasElem != undefined &&
               // extrasElem != null &&
               extrasElem.name() == "extras" &&
               extrasElem.childNodes().length > 0){
                for(let i=0;i<extrasElem.childNodes().length;i++){
                    //XMPPのデータでextrasは値は2018/8現在未実装、設定されていない。
                    //_extras = extrasElem.text();
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
                //エラーコードをopenfireが返して来た(しも3桁 "900" で識別)
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

/**
 * 会話(thread)のタイトルを編集
 *
 * @param {Object} socket - socket情報
 * @param {Object} receiveObj - リクエスト情報
 * @param {function} callback - クライアントへの応答CallBack
 *
 * @return {boolean}
 */
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

    /*
     * アクセストークン
     * セッションデータ
     * openfireのソケット
     * openfireサーバネーム
     * アクセス者のJIDを取得
     */
    const _accessToken = receiveObj.accessToken;
    const _sessionDataMannager = SessionDataMannager.getInstance();
    const _sessionData = _sessionDataMannager.get(_accessToken);
    const _xsConn = _sessionData.getOpenfireSock();
    const _xmppServerHostName = _sessionData.getXmppServerName();
    const _fromJid = _sessionData.getJid();

    /*
     * Xmpp XMP 作成
     */
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
    /*
     * _xmppSendMessage の値がnull
     */
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
    /*
     * _xmppSendMessage の1番目の配列値がnull又は空の時
     */
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
    /*
     * openfireからresponstXMLにのXMPPのレスポンスが帰って来る
     */
    _sessionData.setCallback(_id, (responstXML) => {
        let result = false;
        // The initial value of reason is unused, since it is always overwritten.
        let reason; // = API_STATUS.INTERNAL_SERVER_ERROR;
        /*
         * openfireからのレスポンス値にエラーが有ればその値を
         */
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
                //エラーコードをopenfireが返して来たた(しも3桁 "900" で識別)
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

/**
 * メッセージの全メッセージ検索API
 * 投稿内容の管理ツールとして利用する想定のAPI
 *
 * @param {Object} socket - socket情報
 * @param {Object} receiveObj - リクエスト情報
 * @param {function} callback - クライアントへの応答CallBack
 *
 * @return {boolean}
 */
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
    /*
     * xmppでルーム作成時に使われるコールバック
     */
    const _getAllMessageCallback = (result, reason, extras, count, items) => {
        Object.assign(_content, { result, reason, extras, count, items });
        if(!result){
            //作成失敗
            Log.connectionLog(3, `message.web_api#searchAllMessage Xmpp searchAllMessage error (xmpp reason: ${reason})`);
            executeCallback(receiveObj,
                            callback, {
                                result: false,
                                reason: API_STATUS.INTERNAL_SERVER_ERROR
                            }, 1, apiUtil);
            return;
        }
        //リクエスト値は不要なので削除
        delete _content.condition;
        //結果取得に成功の一桁ステータスコードの戻り値から書き換え
        _content["reason"] = API_STATUS.SUCCESS;

        //Jsonフォーマットなどはメッセージのタイプ毎の規定のフォーマットに生成済みで
        //戻ってくるのでここから処理せず戻す。
        executeCallback(receiveObj, callback, _content, 0, apiUtil);
    };
    var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    return _synchronousBridgeNodeXmpp.getMessage(
        _accessToken,
        _content,
        _getAllMessageCallback);
};

/**
 * メッセージの削除API
 * 管理ツールとして利用する想定のAPI
 *
 * @param {Object} socket - socket情報
 * @param {Object} receiveObj - リクエスト情報
 * @param {function} callback - クライアントへの応答CallBack
 *
 * @return {boolean}
 */
exports.deleteMessage = (socket, receiveObj={}, callback, apiUtil) => {
    let _ret = false;
    // パラメータのチェック
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
    /*
     * メッセージ削除処理コールバック
     */
    const _deleteMessageCallback = (result, reason) => {
        if(!result){
            //作成失敗
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

        //Jsonフォーマットなどはメッセージのタイプ毎の規定のフォーマットに生成済みで
        //戻ってくるのでここから処理せず戻す。
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

/**
 * APIレスポンス作成の為のコールバック関数
 * cubee_web_api.js内で利用されているコールバックを返す
 *
 * @param req リクエストデータ
 * @param callback プロセスコールバック（セッションなどの情報をセットする）
 * @param content リクエストで受け取ったcontent
 * @param errorCode エラーコード（9=トークンが無効,1=必要パラメーターが無い場合,0=その他）
 * @param apiUtil cubee_web_spiで作成された使われるコールバック関数
 */
function executeCallback(req,  callback, content, errorCode, apiUtil) {
    const _req = req.request,
            _id = req.id,
            _version = req.version,
            _token = req.accessToken;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, content);
}

/**
 * 検索JSONの値とキーに不適合な文字列をチェック
 * URLエンコード、日時、JIDなど検索に必要な値だけど通過させる。
 *
 * @param {object} filterjson 検索コンディション内のJSON
 *
 * @return {boolean} 文字列に問題があるかどうか
 */
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
