/**
 * コミュニティーのnode内からも使うAPI
 * Webからはweb_apiが口になり、このファイルの上位
 *
 * @module src/scripts/controller/community/api
 */
'use strict';

const _ = require('underscore');
const Log = require('../server_log').getInstance();
const AuthorityController = require('../authority/controller');
const AUTHORITY_ACTIONS = require('../authority/const').AUTHORITY_ACTIONS;
const API_STATUS = require('../const').API_STATUS;
const SynchronousBridgeNodeXmpp = require('../synchronous_bridge_node_xmpp');
const RequestData = require('../../model/request_data').RequestData;

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
           !_.has(_content.items[0],"roomId")){
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        Log.connectionLog(6, `community.api.doAfterCreatedRoom - _content: ${JSON.stringify(_content)}`);
        setDefaultPolicyAndRightsAtCreate(system_uuid, session,
                                          _content.items[0].roomId)
            .then((res)=> {
                Log.connectionLog(5, `community.api.doAfterCreatedRoom  _content: ${JSON.stringify(_content)}`);
                _content["result"] = true;
                _content["reason"] = API_STATUS.SUCCESS;
                resolve(_content);
            })
            .catch((err) => {
                Log.connectionLog(5, `community.api.doAfterCreatedRoom catch: ${JSON.stringify(err)}`);
                deleteRoomAndMemberAuthority(system_uuid, session,
                                             _content.items[0].roomId)
                    .then((res2)=>{
                        err["roomId"] = _content.items[0].roomId;
                        err["deleted"] = res2.deleted;
                        Log.connectionLog(6, `community.api.doAfterCreatedRoom deleteRoomAndMemberAuthority then: ${JSON.stringify(err)}`);
                        //ルーム削除は成功したが登録としては失敗なためreject
                        reject(err);
                    }).catch((err2)=>{
                        err["roomId"] = _content.items[0].roomId;
                        err["deleted"] = err2.deleted;
                        Log.connectionLog(6, `community.api.doAfterCreatedRoom deleteRoomAndMemberAuthority catchn: ${JSON.stringify(err)}`);
                        reject(err);
                    });
            });
    });
};

/**
 * ルーム作成時など、初期のポリシーと権限をルームに設定する
 * すべて設定予定の権限作成に成功しなかった場合は作成された物も削除
 * して元の状態にもどる。
 * ※サブ関数としてプライベートな関数とする
 *
 * @param {string} system_uuid - 権限管理を利用するシステムのUUID
 * @param {object} session - リリクエストを行ったユーザ情報
 * @param {object} resource - リソースID（ルームID）
 *
 * @return {promise} 正常に更新できた場合はresolve, 失敗した場合はreject
 */
const setDefaultPolicyAndRightsAtCreate = (system_uuid, session, resource) => {
    return new Promise((resolve, reject) => {
        if(!_.isString(resource)){
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        const loginuser = session.getLoginAccout();
        const actions = [
            AUTHORITY_ACTIONS.COMMUNITY_MANAGE,
            AUTHORITY_ACTIONS.COMMUNITY_SEND,
            AUTHORITY_ACTIONS.COMMUNITY_VIEW];

        let promisesP = [];
        for(let action of actions){
            promisesP.push(
                AuthorityController.createPolicy(
                    system_uuid, session,
                    {
                        policy_id : "p_" + action + "_" + resource,
                        policy_tid : "none",
                        translations : {ja:""}
                    }
                ));
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
                        AuthorityController.assignPolicyToUsers(
                            system_uuid, session,
                            {
                                policy_id : "p_" + AUTHORITY_ACTIONS.COMMUNITY_MANAGE + "_" + resource,
                                users : [loginuser]
                            },
                            'create'
                        ).then((res3)=>{
                            //すべて実行成功
                            resolve({result: true, reason: API_STATUS.SUCCESS});
                        }).catch((err3)=>{
                            Log.connectionLog(5, `community.api.setDefaultPolicyAndRightsAtCreate : authority set Right err! ${JSON.stringify(err3)}`);
                            reject(err3);
                        });
                        //--------------
                    })
                    .catch((err2)=>{
                        Log.connectionLog(5, `community.api.setDefaultPolicyAndRightsAtCreate : authority set Right err! ${JSON.stringify(err2)}`);
                        reject(err2);
                    });
            })
            .catch((err)=>{
                Log.connectionLog(5, `community.api.setDefaultPolicyAndRightsAtCreate : authority set Policy err! ${JSON.stringify(err)}`);
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
const deleteRoomAndMemberAuthority = (system_uuid, session, resource) => {
    return new Promise((resolve, reject) => {
        if(!_.isString(resource)){
            reject({result: false, reason: API_STATUS.BAD_REQUEST});
            return;
        }
        const accessToken = session.getAccessToken();
        // ここに権限失敗したので削除処理追加
        AuthorityController.deleteRightPolicyOfResource(
            system_uuid, session,{resource:resource})
            .then((res2) =>{
                //失敗した権限の削除に成功した
                //ルームの削除を実行
                sendDeleteGroupRequestToXmpp(accessToken, resource)
                    .then((res3) => {
                        if(res3.result){
                            Log.connectionLog(5, `community.api.deleteRoomAndMemberAuthority: authority cleaned, clean xmpp done !:${JSON.stringify(res3)}`);
                            resolve({
                                result: true,
                                reason: API_STATUS.SUCCESS,
                                roomId : resource,
                                deleted: true
                            });
                        }else{
                            //システムトラブルは無かったが削除に失敗した
                            Log.connectionLog(3, `community.api.deleteRoomAndMemberAuthority: authority cleaned, clean xmpp dose not err!:${JSON.stringify(res3)}`);
                            reject({
                                result: false,
                                reason: API_STATUS.INTERNAL_SERVER_ERROR,
                                roomId : resource,
                                deleted: false
                            });
                        }
                    }).catch((err3) => {
                        //権限削除は成功したが、ルーム削除に失敗した。
                        Log.connectionLog(3, `community.api.setDefaultPolicyAndRightsAtCreat: not clean xmpp err!:${JSON.stringify(err3)}`);
                        reject({
                            result: false,
                            reason: API_STATUS.INTERNAL_SERVER_ERROR,
                            roomId : resource,
                            deleted: false
                        });
                    });
            }).catch((err2) =>{
                //DBなどシステムトラブルでエラーとなった
                Log.connectionLog(2, `community.api.deleteRoomAndMemberAuthority: not authority clean err! ${JSON.stringify(err2)}`);
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
 * システムとしてのコミュニティ削除要求をXMPPに送信する
 *
 * @param  {string} accessToken アクセストークン
 * @param  {string} roomId      対象のルームID
 * @return {function}           プロミスの関数を返却する。resolveの場合は、object、rejectの場合はstringを返却。
 */
function sendDeleteGroupRequestToXmpp(accessToken, roomId) {
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
        // リクエストの作成
        const _accessToken = accessToken;
        const _content = {
            type: RequestData.DELETE_GROUP_TYPE_COMMUNITY_ROOM,
            roomId: roomId
        };
        // リクエストの送出
        const _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
        _synchronousBridgeNodeXmpp.deleteGroup(
            _accessToken,
            _content,
            (result, reason, extras, count, items)=> {
                const _responceContent = {
                    result : result,
                    reason : reason,
                    type : _content.type,
                    items: items
                };
                resolve(_responceContent);
                return;
            }
        );
    });
}

const __testonly__ = {
    sendDeleteGroupRequestToXmpp: sendDeleteGroupRequestToXmpp
};
exports.__testonly__ = __testonly__;
