/**
 * プロファイルを管理するWeb(ネット)からのアクセスの口になるAPI
 *
 * @module src/scripts/controller/profile/web_api
 */
'use strict';
const _ = require('underscore');
const API = require('./api');
const Log = require('../server_log').getInstance();
const RequestData = require('../../model/request_data').RequestData;
const SessionDataMannager = require('../session_data_manager');
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const API_STATUS = require('../const').API_STATUS;

/**
 * XMPPへの問い合わせの前に実行すべきチェック処理を設定化
 * @type {Object}
 */
const precheckFuncs = {
    [RequestData.SET_LOGIN_PERSON_DATA_TYPE_PASSWORD] : API.doBeforeChangePassword,
    [RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE]  : API.doBeforeUpdateProfile,
};

/**
 * API を実行する
 * @param {Object} socket - socket情報
 * @param {Object} receiveObj - リクエスト情報
 * @param {function} callback - クライアントへの応答CallBack
 * @param {object} apiUtil    cubee_web_api の持つ メソッドなど
 *
 * @return {boolean} パラメータチェックが NG であれば、false そうでなければ、true。クライアントへの返却はこのメソッドで行う
 */
exports.doApi = (socket, receiveObj={}, callback, apiUtil) => {
    // パラメータのチェック
    if(!_.has(receiveObj, 'accessToken') ||
       !_.has(receiveObj, 'content')     ||
       !_.has(receiveObj.content, 'type')
    ){
        executeCallback(receiveObj,
                        callback, {
                            result: false,
                            reason: API_STATUS.BAD_REQUEST
                        }, 1, apiUtil);
        Log.connectionLog(6, 'profile.web_api.doApi invalid parameter');
        return false;
    }

    Log.connectionLog(7, 'profile.web_api.doApi in');

    // 必要なパラメータの抽出
    const _accessToken = receiveObj.accessToken;
    const _content = receiveObj.content,
            _type = receiveObj.content.type,
            _session = SessionDataMannager.getInstance().get(_accessToken),
            _system_uuid = _session.getTenantUuid();
    let _responceContent = {};

    // 処理実行前のチェック
    precheckFuncs[_type](_system_uuid, _session, _content)
    .then(() => {
        Log.connectionLog(7, `profile.web_api.doApi after precheckFunc`);

        // XMPP通信実施
        let _SBNX = SynchronousBridgeNodeXmpp.getInstance();
        let _ret = _SBNX.setLoginPersonData(_accessToken, _content, (result, reason, content)=> {
            // 応答の処置
            Log.connectionLog(7, `profile.web_api.callSbnx after`);
            if(content != null) {
                _responceContent = content;
                _responceContent.result = result;
                _responceContent.reason = reason;
                _responceContent.type = _type;
            } else {
                _responceContent = {
                    result : result,
                    reason : reason,
                    type : _type,
                };
            }
            executeCallback(receiveObj, callback, _responceContent, 0, apiUtil);
            return;
        });
        if (! _ret) {
            Log.connectionLog(7, `profile.web_api.callSbnx return false`);
            executeCallback(receiveObj, callback, _content, 1, apiUtil);
            return;
        }

    })
    .catch((err) => {
        Log.connectionLog(6, `profile.web_api.doApi catch error: ` + JSON.stringify(err));
        switch (_type){
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PASSWORD:
            _responceContent.result = err.result;
            _responceContent.reason = err.reason;
            _responceContent.type = _type;
            break;
        case RequestData.SET_LOGIN_PERSON_DATA_TYPE_PROFILE:
            _responceContent = _content;
            _responceContent.result = err.result;
            _responceContent.reason = err.reason;
            break;
        default:
            break;
        }
        let errorCode = 0;
        if (_responceContent.reason == API_STATUS.BAD_REQUEST) {
            errorCode = 1;
        }
        executeCallback(receiveObj, callback, _responceContent, errorCode, apiUtil);
    });

    Log.connectionLog(7, 'profile.web_api.doApi out');
    return true;

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
function executeCallback(req, callback, content=null, errorCode, apiUtil) {
    const _req = req.request,
            _id = req.id,
            _version = req.version,
            _token = req.accessToken;
    apiUtil._callBackResponse(callback, _token, _req, _id, _version, errorCode, content);
}
