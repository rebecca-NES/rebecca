/**
 * グループチャットのnode内からも使うAPI
 * Webからはweb_apiが口になり、このファイルの上位
 *
 * @module src/scripts/controller/groupchat/api
 */
'use strict';

const _ = require('underscore');
const Log = require('../server_log').getInstance();
const AuthorityController = require('../authority/controller');
const AUTHORITY_ACTIONS = require('../authority/const').AUTHORITY_ACTIONS;
const API_STATUS = require('../const').API_STATUS;
const RequestData = require('../../model/request_data').RequestData;
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const UserAccountManager = require('../user_account_manager');

/**
 * ルーム作成時に実行されるAPI（公開関数）
 * Xmppでルーム作成が完了後の処理
 *
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} _content - リクエストとXmppから作成後に返された値
 *
 * @return {promise} 正常に更新できた場合はresolve, 失敗した場合はreject
 */
exports.doAfterCreatedRoom = (system_uuid, session, _content) => {
    return new Promise((resolve, reject) => {
        if(!_.has(_content,"items")||
           !_.isArray(_content.items)||
           _content.items.length <= 0||
           !_.has(_content.items[0],"roomId") ||
           !_.isString(_content.items[0].roomId) ||
           !_.has(_content.items[0],"memberItems") ||
           !_.isArray(_content.items[0].memberItems)||
           _content.items[0].memberItems.length <= 0
          ){
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        let actionMenbers = actionMemberSelectFromContent(_content);

        //メンバーリストをJIDからUIDへ変換して取得
        actionMemberSelectFromJID(
            _content.items[0].memberItems,
            actionMenbers,
            session.getXmppServerName())
            .then((memberUIDs) => {
                //ルーム作成で複数処理がある場合、ここに追加すること
                setDefaultPolicyAndRightsAtCreate(system_uuid, session,
                                                  _content.items[0].roomId,
                                                  memberUIDs)
                    .then((res)=> {
                        Log.connectionLog(6, `groupchat.api.doAfterCreatedRoom  _content: ${JSON.stringify(_content)}`);
                        _content["result"] = true;
                        _content["reason"] = API_STATUS.SUCCESS;
                        resolve(_content);
                    }).catch((err) => {
                        Log.connectionLog(5, `groupchat.api.doAfterCreatedRoom setDefaultPolicyAndRightsAtCreate err: ${JSON.stringify(err)}`);
                        deleteRoomAndMemberAuthority(system_uuid, session,
                                                     _content.items[0].roomId,
                                                     _content.items[0].memberItems)
                            .then((res2)=>{
                                err["roomId"] = _content.items[0].roomId;
                                err["deleted"] = res2.deleted;
                                //ルーム削除は成功したが登録としては失敗なためreject
                                reject(err);
                            }).catch((err2)=>{
                                err["roomId"] = _content.items[0].roomId;
                                err["deleted"] = err2.deleted;
                                reject(err);
                            });
                    });
            })
            .catch((err) => {
                //異常系処理(UIDリストがJIDで検索出来無かった)
                reject({result: false, reason: API_STATUS.BAD_REQUEST});
            });
    });
};

/**
 * 第1階層のキーの値にアクション名をもつオブジェクトからアクション名をキーにユーザIDのリストを作る
 *
 * @param _content 第1階層のキーの値にアクション名をもつオブジェクト
 *
 * @return JIDリストに存在するユーザIDだけで構成されてアクション名に対比するユーザーIDの配列をもったオブジェクト
 */
const actionMemberSelectFromContent = (_content) => {
    let actionMenbers = {};
    if(_.has(_content,AUTHORITY_ACTIONS.GC_MANAGE) &&
       _.isArray(_content[AUTHORITY_ACTIONS.GC_MANAGE])){
        actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE] = _content[AUTHORITY_ACTIONS.GC_MANAGE];
    }else{
        actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE] = [];
    }
    if(_.has(_content,AUTHORITY_ACTIONS.GC_SEND) &&
       _.isArray(_content[AUTHORITY_ACTIONS.GC_SEND])){
        actionMenbers[AUTHORITY_ACTIONS.GC_SEND] = _content[AUTHORITY_ACTIONS.GC_SEND];
    }else{
        actionMenbers[AUTHORITY_ACTIONS.GC_SEND] = [];
    }
    if(_.has(_content,AUTHORITY_ACTIONS.GC_VIEW) &&
       _.isArray(_content[AUTHORITY_ACTIONS.GC_VIEW])){
        actionMenbers[AUTHORITY_ACTIONS.GC_VIEW] = _content[AUTHORITY_ACTIONS.GC_VIEW];
    }else{
        actionMenbers[AUTHORITY_ACTIONS.GC_VIEW] = [];
    }
    Log.connectionLog(6, `groupchat.api.doAfterCreatedRoom - actionMenbers: ${JSON.stringify(actionMenbers)}`);
    return actionMenbers;
};

/**
 * アクション名の持っているユーザーIDでJIDのリストに無いものを取り除き
 * アクション名に対比するユーザー名の配列のオブジェクトを返す、
 * JIDのリストにありアクション名をキーに持つオブジェクトに無い値は全てマネージャーとして扱う。
 *
 * @param jidmenber jidの配列リスト
 * @param actionMenbers  アクション名に対比するユーザー名の配列のオブジェクト
 *        {
 *          sendMessageXXX : ["user01"],
 *          viewMessageXXX : ["user02"]
 *        }
 *
 * @return JIDリストに存在するユーザIDだけで構成されてアクション名に対比するユーザーIDの配列をもったオブジェクト(Promise resolve)
 */
const actionMemberSelectFromJID = (jidmenber, actionMenbers, xmppServerName) => {
    return new Promise((resolve, reject) => {
        let _actionMenbers = {};
        _actionMenbers[AUTHORITY_ACTIONS.GC_VIEW]   = [];
        _actionMenbers[AUTHORITY_ACTIONS.GC_SEND]   = [];
        _actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE] = [];
        let promisesJ2U = [];
        for(let item of jidmenber){
            promisesJ2U.push(jid2uid(item,xmppServerName));
        }
        Promise.all(promisesJ2U)
            .then((resAll) =>{
                for(let res of resAll){
                    if(actionMenbers[AUTHORITY_ACTIONS.GC_VIEW].indexOf(res) < 0){
                        if(actionMenbers[AUTHORITY_ACTIONS.GC_SEND].indexOf(res) < 0){
                            _actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE].push(res);
                            Log.connectionLog(6, `groupchat.api.actionMemberSelectFromJID uid ( "${res}" )`);
                        }else{
                            _actionMenbers[AUTHORITY_ACTIONS.GC_SEND].push(res);
                        }
                    }else{
                        _actionMenbers[AUTHORITY_ACTIONS.GC_VIEW].push(res);
                    }
                }
                Log.connectionLog(6,`groupchat.api.actionMemberSelectFromJID view list (${JSON.stringify(_actionMenbers[AUTHORITY_ACTIONS.GC_VIEW])})`);
                Log.connectionLog(6,`groupchat.api.actionMemberSelectFromJID send list (${JSON.stringify(_actionMenbers[AUTHORITY_ACTIONS.GC_SEND])})`);
                Log.connectionLog(6,`groupchat.api.actionMemberSelectFromJID list (${JSON.stringify(_actionMenbers[AUTHORITY_ACTIONS.GC_MANAGE])})`);
                resolve(_actionMenbers);
            })
            .catch((err)=>{
                //UIDの問い合せ時にエラーが有った。
                Log.connectionLog(3,`groupchat.app.actionMemberSelectFromJID get UID Error (${err})`);
                reject(err);
            });
    });
};

/**
 * jidからアカウントidを持ち出す。
 *
 * @param jid JID
 * @param xmppServerName Xmppのサーバ名
 *
 * @return アカウントID(Promise resolve)
 */
const jid2uid = (jid, xmppServerName) => {
    return new Promise((resolve, reject) => {
        const openfireAccount = jid.substring(0,jid.lastIndexOf('@'));
        const getUidFromJID = (openfireAccount,xmppServerName) => {
            return new Promise((resolve, reject) => {
                var _userAccountManager = UserAccountManager.getInstance();
                _userAccountManager.getUserAccountDataByOFAccountAndXmppServerName(
                    openfireAccount,
                    xmppServerName,
                    (err, userAccountData) => {
                        if(userAccountData != null){
                            Log.connectionLog(6,`groupchat/api.js jid2uid userAccountData.getLoginAccount() : ${userAccountData.getLoginAccount()}`);
                            resolve(userAccountData.getLoginAccount());
                        }else{
                            //ユーザーアカウントが存在しなかった
                            Log.connectionLog(3,`groupchat.app.jid2uid userAccountData is null`);
                            reject('');
                        }
                    });
            });
        };
        getUidFromJID(openfireAccount, xmppServerName)
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                //UIDの問い合せ時にエラーが有った。
                Log.connectionLog(3,`groupchat.app.jid2uid getUidFromJID Promise err`);
                reject(err);
            });
    });
};

/**
 * ルーム作成時など、初期のポリシーと権限をルームに設定する
 * 初期登録時のメンバーの権限設定も同時に行う
 * すべて設定予定の権限作成に成功しなかった場合は作成された物も削除
 * して元の状態にもどる。
 * ※サブ関数としてプライベートな関数とする
 *
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} resource - リソースID（ルームID）
 * @param {Object} actionMenbers {
 *        manageGroupchat - 管理権限設定のユーザーID（配列）
 *        sendMessageToGroupchat - 管理権限設定のユーザーID（配列）
 *        viewMessageInGroupchat - 管理権限設定のユーザーID（配列）
 *       }
 * @param {Array} actionMenberJIDs 配列の1番目をオーナーとしたメンバーのJID
 *
 * @return {promise} 正常に更新できた場合はresolve, 失敗した場合はreject
 */
const setDefaultPolicyAndRightsAtCreate = (system_uuid, session, resource, actionMenbers) => {
    return new Promise((resolve, reject) => {
        Log.connectionLog(6, `groupchat.api.setDefaultPolicyAndRightsAtCreate - actionMenbers: ${JSON.stringify(actionMenbers)}`);
        const actions = [
            AUTHORITY_ACTIONS.GC_MANAGE,
            AUTHORITY_ACTIONS.GC_SEND,
            AUTHORITY_ACTIONS.GC_VIEW];

        let promisesP = [];
        for(let action of actions){
            promisesP.push(
                AuthorityController.createPolicy(
                    system_uuid, session,
                    {
                        policy_id:"p_" + action + "_" + resource,
                        policy_tid:"p_" + action + "_" + resource,
                        translations:{ja:"","en":""}
                    }));
        }
        Promise.all(promisesP)
            .then((res)=>{
                let promisesR = [];
                for(let action of actions){
                    promisesR.push(
                        AuthorityController.createRight(
                            system_uuid, session,
                            {
                                policy_id:"p_" + action + "_" + resource,
                                action: action,
                                resource: resource,
                                condition:"",
                                enable_flag:true
                            }));
                }
                Promise.all(promisesR)
                    .then((res2)=>{
                        //-- メンバー登録の設定-----
                        let _promises = [];
                        for(let action of actions){
                            if(actionMenbers[action].length == 0)
                                continue;
                            _promises.push(
                                AuthorityController.assignPolicyToUsers(
                                    system_uuid, session,{
                                        policy_id : "p_" + action + "_" + resource,
                                        users : actionMenbers[action]
                                    },'create')
                            );
                        }
                        Promise.all(_promises).then((res3)=>{
                            //すべて実行成功
                            resolve({result: true, reason: API_STATUS.SUCCESS});
                            //reject({result:false});
                        }).catch((err3)=>{
                            Log.connectionLog(5, `groupchat.api.setDefaultPolicyAndRightsAtCreate : authority set Policy To User err! ${JSON.stringify(err3)}`);
                            reject(err3);
                        });
                    })
                    .catch((err2)=>{
                        Log.connectionLog(5, `groupchat.api.setDefaultPolicyAndRightsAtCreate : authority set Right err! ${JSON.stringify(err2)}`);
                        reject(err2);
                    });
            })
            .catch((err)=>{
                Log.connectionLog(5, `groupchat.api.setDefaultPolicyAndRightsAtCreate : authority set Policy err! ${JSON.stringify(err)}`);
                reject(err);
            });
    });
};

/**
 * 権限設定に失敗した時に権限とルームを削除する
 *
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} resource - リソースID（ルームID）
 * @param {Array} actionMenberJIDs 配列の1番目をオーナーとしたメンバーのJID
 *
 * @return {promise} 正常に更新できた場合はresolve, 失敗した場合はreject
 */
const deleteRoomAndMemberAuthority = (system_uuid, session, resource, actionMenberJIDs) => {
    return new Promise((resolve, reject) => {
        const accessToken = session.getAccessToken();
        const createrJid = session.getJid();
        // ここに権限失敗したので削除処理追加
        AuthorityController.deleteRightPolicyOfResource(
            system_uuid, session,{resource:resource}
        ).then(
            (res2) =>{
                //メンバーリストからのクリエーターJIDを抜き取る
                actionMenberJIDs = _.without(actionMenberJIDs, createrJid);
                Log.connectionLog(6, `groupchat.api.deleteRoomAndMemberAuthority: sliced creater actionMenberJIDs:${JSON.stringify(actionMenberJIDs)}`);
                //グループチャットのルームやユーザーを削除
                sendRemoveMemberRequestToXmpp(
                    accessToken, resource, createrJid, actionMenberJIDs
                ).then((res3)=>{
                    //登録に失敗した権限の削除に成功した
                    Log.connectionLog(5, `groupchat.api.deleteRoomAndMemberAuthority: authority cleaned, clean xmpp done !`);
                    resolve({
                        result: true,
                        reason: API_STATUS.SUCCESS,
                        roomId : resource,
                        deleted: true
                    });
                }).catch((err3)=>{
                    //権限削除は成功したが、ルーム削除に失敗した。
                    Log.connectionLog(3, `groupchat.api.setDefaultPolicyAndRightsAtCreat: not clean xmpp err!:${JSON.stringify(err3)}`);
                    reject({
                        result: false,
                        reason: API_STATUS.INTERNAL_SERVER_ERROR,
                        roomId : resource,
                        deleted: false
                    });
                });
            }).catch((err2) =>{
                //DBなどシステムトラブルでエラーとなった
                Log.connectionLog(2, `groupchat.api.deleteRoomAndMemberAuthority: not authority clean err! ${JSON.stringify(err2)}`);
                //エラーコードは権限作成に付いてのエラーコードを返す。
                reject({
                    result: false,
                    reason: API_STATUS.INTERNAL_SERVER_ERROR,
                    roomId : resource,
                    deleted: false
                });
            });
    });
};

/**
 * 作成に失敗したGroupChatの後始末を行う。
 * メンバーを全て退会させ、Ownerも退会させ、システムとして削除した状態とする。
 *
 * @param  {string} accessToken アクセストークン
 * @param  {string} roomId      ルームID
 * @param  {string} ownerJid    GC所有者のJID
 * @param  {string} memberJids  GCに属するメンバーのJIDの配列
 * @return {function}           Promise関数を返却する。正常終了は、resolveで戻り値なし。異常終了は、rejectでerr文言を返却。
 */
function sendRemoveMemberRequestToXmpp(accessToken, roomId, ownerJid, memberJids) {
    return new Promise((resolve, reject) => {
        // パラメータチェック
        if (! _.isString(accessToken) || accessToken == '') {
            Log.connectionLog(4, 'accessToken is invalid. community::api::sendDeleteGroupRequestToXmpp');
            reject('invalid parameter');
            return;
        }
        if (! _.isString(roomId) || roomId == '') {
            Log.connectionLog(4, 'roomId is invalid. community::api::sendDeleteGroupRequestToXmpp');
            reject('invalid parameter');
            return;
        }
        if (! _.isString(ownerJid) || ownerJid == '') {
            Log.connectionLog(4, 'ownerJid is invalid. community::api::sendDeleteGroupRequestToXmpp');
            reject('invalid parameter');
            return;
        }
        if (! _.isArray(memberJids)) {
            Log.connectionLog(4, 'memberJids is invalid. community::api::sendDeleteGroupRequestToXmpp');
            reject('invalid parameter');
            return;
        }
        // リクエストの作成
        const _accessToken = accessToken;
        const _content = {
            type: RequestData.REMOVE_MEMBER_TYPE_GROUP_CHAT_ROOM,
            removeType: 'member',
            roomId: roomId
        };
        // メンバーの退会
        let _promises = [];
        if (memberJids.length == 0) {
            // メンバーなし
            _promises.push(Promise.resolve({result: true}));
        } else {
            _content.members = memberJids;
            // メンバーを退会させる要求を出す
            _promises.push(sendRemoveMemberRequestToXmppWrap(_accessToken, _content));
        }

        // プロミスチェーンを開始する
        Promise.all(_promises)
        .then((res)=> {
            if (res[0].result == true) {
                Log.connectionLog(6, 'community::api::sendDeleteGroupRequestToXmpp, done to remove members. ' + _content.roomId);
            } else {
                Log.connectionLog(4, 'community::api::sendDeleteGroupRequestToXmpp, done to remove members. but might be failed.' + _content.roomId);
            }
            _content.removeType = 'own';
            _content.members = [ownerJid];
            // 所有者を退会させ、論理削除状態とする要求を出す
            return sendRemoveMemberRequestToXmppWrap(_accessToken, _content);
        }).then((res)=> {
            if (res.result == true) {
                Log.connectionLog(6, 'community::api::sendDeleteGroupRequestToXmpp, done to remove owner. ' + _content.roomId);
            } else {
                Log.connectionLog(4, 'community::api::sendDeleteGroupRequestToXmpp, done to remove owner. but might be failed.' + _content.roomId);
            }
            // システムとして削除状態とする要求を出す
            return sendDeleteGroupRequestToXmpp(_accessToken, _content.roomId);
        }).then((res)=> {
            if (res.result == true) {
                Log.connectionLog(6, 'community::api::sendDeleteGroupRequestToXmpp, done to system remove. ' + _content.roomId);
            } else {
                Log.connectionLog(4, 'community::api::sendDeleteGroupRequestToXmpp, done to system remove. but might be failed.' + _content.roomId);
            }
            resolve();
        }).catch((err)=> {
            Log.connectionLog(3, 'community::api::sendDeleteGroupRequestToXmpp, failed to remove. ' + _content.roomId + ', ' + err);
            reject(err);
        });
    });
}

/**
 * メンバーをGCから退会させる要求を出すPromise関数を返却する。
 * 内部からの呼び出しに限るため、パラメータチェックは行わない。
 *
 * @param  {string} accessToken アクセストークン
 * @param  {object} content     削除要求のcontent
 * @return {function}           Promise関数を返却する。正常終了は、resolve で、Objectを返却する。
 */
function sendRemoveMemberRequestToXmppWrap(accessToken, content) {
    return new Promise((resolve, reject) => {
        // リクエストの送出
        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        // メンバー削除要求送出
        let _res = _synchronousBridgeNodeXmpp.removeMember(
            accessToken,
            content,
            (result, reason, extras, count, items)=> {
                const _responceContent = {
                    result : result,
                    reason : reason,
                    type : content.type,
                    extras : extras,
                    count : count,
                    items : items
                };
                resolve(_responceContent);
                return;
            }
        );
        if (!_res) {
            reject('failed to call removeMember');
            return;
        }
    });
}

/**
 * システムとしてのGroupChat削除要求をXMPPに送信する
 * これを呼び出す前に、GCに属するメンバすべてをメンバー退会させる要求を創出しておく必要がある
 *
 * @param  {string} accessToken アクセストークン
 * @param  {string} roomId      対象のルームID
 * @return {function}           Promise関数を返却する。正常終了は、resolve で、Objectを返却する。
 */
function sendDeleteGroupRequestToXmpp(accessToken, roomId) {
    return new Promise((resolve, reject) => {
        // リクエストの作成
        const _accessToken = accessToken;
        const _content = {
            type: RequestData.DELETE_GROUP_TYPE_GROUP_CHAT_ROOM,
            roomId: roomId
        };
        // リクエストの送出
        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        let _res = _synchronousBridgeNodeXmpp.deleteGroup(
            _accessToken,
            _content,
            (result, reason, extras, count, items)=> {
                const _responceContent = {
                    result : result,
                    reason : reason,
                    type : _content.type,
                    items : items
                };
                resolve(_responceContent);
                return;
            }
        );
        if (!_res) {
            reject('failed to call removeMember');
            return;
        }
    });
}

const __testonly__ = {
    sendRemoveMemberRequestToXmpp: sendRemoveMemberRequestToXmpp
};
exports.__testonly__ = __testonly__;
