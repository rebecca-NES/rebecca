/**
 * グループチャットを管理するWeb(ネット)からのアクセスの口になるAPI
 *
 * @module src/scripts/controller/groupchat/web_api
 */
'use strict';
const _ = require('underscore');
const API = require('./api');
const Log = require('../server_log').getInstance();
const SessionDataMannager = require('../session_data_manager');
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const API_STATUS = require('../const').API_STATUS;
const utils = require('../../utils');
const Validation = require('../validation');

/**
 * グループチャット作成時実行のAPI
 *
 * @param {Object} socket - socket情報
 * @param {Object} receiveObj - リクエスト情報
 * @param {function} callback - クライアントへの応答CallBack
 *
 * @return {boolean}
 */
exports.create = (socket, receiveObj={}, callback, apiUtil) => {
    let _ret = false;
    //memberItemsが設定れていない場合
    if(!_.has(receiveObj,"accessToken")||
       !_.has(receiveObj,"content")||
       !_.has(receiveObj.content,"memberItems")||
       ( _.has(receiveObj.content,"parentRoomId") &&
         ! utils.varidieter.parentRoomId(receiveObj.content.parentRoomId) ) ||
       ! Validation.privacyTypeValidationCheck(receiveObj.content.privacyType, false)||
       !_.isArray(receiveObj.content.memberItems) ||
       receiveObj.content.memberItems.length == 0){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        return _ret;
    }
    const _accessToken = receiveObj.accessToken;
    const _content = receiveObj.content,
            _session = SessionDataMannager.getInstance().get(_accessToken),
            _system_uuid = _session.getTenantUuid();

    /*
     * xmppでルーム作成時に使われるコールバック
     */
    const afterCreatedRoomCallback = (result, reason, extras, count, items) => {
        _content["result"] = result;
        _content["reason"] = reason;
        _content["extras"] = extras;
        _content["count"]  = count;
        _content["items"]  = items;
        if(!result){
            //作成失敗
            Log.connectionLog(4, `groupchat.web_api#create Xmpp createGroup error (xmpp reason: ${reason})`);
            executeCallback(receiveObj,
                            callback, _content, 1, apiUtil);
            return;
        }

        API.doAfterCreatedRoom(
            _system_uuid, _session, _content
        ).then((res) => {
            executeCallback(receiveObj,
                            callback, res, 0, apiUtil);
        }).catch((reason) => {
            executeCallback(receiveObj,
                            callback, reason, 1, apiUtil);
        });
    };
    var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
    if(_.has(receiveObj.content,"parentRoomId") &&
       receiveObj.content.parentRoomId.length > 0){
        return _synchronousBridgeNodeXmpp.getGroup(
            _accessToken,
            {
                "type" : "CommunityInfo",
                "roomId" : _content.parentRoomId
            },
            (result, reason) => {
                if(result){
                    return _synchronousBridgeNodeXmpp
                        .createGroup(
                            _accessToken,
                            _content,
                            afterCreatedRoomCallback);
                }else{
                    Log.connectionLog(4, `groupchat.web_api#create Xmpp getGroup error (xmpp reason: ${reason})`);
                    executeCallback(receiveObj,
                                    callback, {
                                        result: false,
                                        reason: API_STATUS.BAD_REQUEST
                                    }, 1, apiUtil);
                    return false;
                }
            });
    }else{
        return _synchronousBridgeNodeXmpp
            .createGroup(
                _accessToken,
                _content,
                afterCreatedRoomCallback);
    }
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
function executeCallback(req,  callback, content=null, errorCode, apiUtil) {
    const cntlist = ["type","result","reason","extras","count","items"];
    let _content = {};
    for(let cntkey of cntlist){
        if(_.has(content,cntkey)){
            _content[cntkey] =  content[cntkey];
        }
    }
    const _req = req.request,
            _id = req.id,
            _version = req.version,
            _token = req.accessToken;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, _content);
}
