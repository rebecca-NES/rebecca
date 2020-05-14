"use strict";

const SessionDataMannager = require("../../../session_data_manager");
const Validation = require('../../../validation');
const Const = require('../../../const');
const _log = require("../../../server_log").getInstance();
const NotificateApi = require('../../../notificate/api');
const PublicCommunityMemberDbStore = require('./dbif');
const RoleApiController = require("../../../../controller/authority/controller");

/**
 * cubee_web_api.js のリクエストタイプで分岐された状態で実行されるAPIベース
 *
 * @param _globalSnsDB globalSnsDBのインスタンス
 * @param socket ソケット
 * @param request リクエストJSON
 * @param processCallback 上位で設定のコールバック
 * @param callBackResponse レスポンスコールバック
 */
exports.receive = (_globalSnsDB, socket, request, processCallback, callBackResponse) => {
    _log.connectionLog(7, 'do func community.public.member.api.request(...');
    const _content = request.content;
    const _type = _content.type;
    //typeが正しくない場合などのデフォルト値
    let _ret = {
        //errorCode エラーコード（9=トークンが無効,1=必要パラメーターが無い場合,0=その他）
        errorCode : 1,
        content : {
            result: false,
            reason: Const.API_STATUS.NOT_FOUND
        }
    };
    //トークンが無効
    if(typeof _content != 'object' ||
       typeof _type != 'string' ||
       !Validation.accessTokenValidationCheck(request.accessToken, true)){
        _log.connectionLog(5, '  community.public.member.api.request not token');
        // The value assigned to _ret here is unused.
        _ret; /* = {
            errorCode : 9,
            content : {
                result: false,
                reason: Const.API_STATUS.FORBIDDEN
            } */
        };
    }else{
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(request.accessToken);
        const _myJid = _sessionData.getJid();
        switch(_type){
        case 'Joining':
                //リクエスト値をチェック
            if(typeof _content.roomId != 'string' ||
                   !Validation.roomIdValidationCheck(_content.roomId, true)){
                _log.connectionLog(4, '  community.public.member.api.request Joining invalid _content.roomId:'
                                        + _content.roomId + ", _myJid:" + _myJid);
                callBackResponse(
                        processCallback,
                        request.accessToken,
                        request.request,
                        request.id,
                        request.version,
                        1,
                    {
                        type: _type,
                        result: false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                break;
            }
                //登録実行
                // The value assigned to _ret here is unused.
            _ret; /* = joining(_globalSnsDB, request.accessToken,
                               _content.roomId)
                    .then((res)=>{
                        //通知メンバーをリスト化
                        let userNames = [];
                        //追加メンバー
                        let memberItems = [];
                        let ulist = Object.keys(res.content.items[0].personInfo);
                        for(let i=0;i<ulist.length;i++){
                            if(!ulist[i] || !res.content.items[0].personInfo[ulist[i]].userName){
                                continue;
                            }
                            if(_myJid == ulist[i]){
                                memberItems.push({
                                    jid: ulist[i],
                                    nickName: res.content.items[0].personInfo[ulist[i]].nickName,
                                    avatarType: res.content.items[0].personInfo[ulist[i]].avatarType,
                                    avatarData: res.content.items[0].personInfo[ulist[i]].avatarData,
                                    status: res.content.items[0].personInfo[ulist[i]].status,
                                    role: res.content.items[0].personInfo[ulist[i]].role,
                                    userName: res.content.items[0].personInfo[ulist[i]].userName
                                });
                            }else{
                                userNames.push(res.content.items[0].personInfo[ulist[i]].userName);
                            }
                        }
                        const joinType = res.content.joinType;
                        delete res.content.joinType;
                        res.content.items[0].count = memberItems.length;
                        res.content.items[0].members = memberItems;
                        delete res.content.items[0].personInfo;
                        //httpレスポンスをここで実行
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            res.errorCode,
                            Object.assign({type: _type},res.content));

                        //通知はここで処理
                        try{
                            //メンバー追加をメンバー全員に通知
                            _log.connectionLog(7, '  community.public.member.api.request Joining notificate userNames:'+userNames);

                            //通知は通常の
                            NotificateApi.notifyPush(request.accessToken,
                                                     userNames,
                                                     (
                                                         joinType == 'new' ?
                                                         Const.API_REQUEST.API_ADD_MEMBER :
                                                         Const.API_REQUEST.API_UPDATE_MEMBER
                                                     ),
                                                     Object.assign(
                                                         {type: "CommunityRoom"},
                                                         res.content));
                        }catch(e){
                            _log.connectionLog(3, '  community.public.member.api.request Joining catch notificate err:'+(e));
                        }
                    })
                    .catch((err)=>{
                        _log.connectionLog(3, '  community.public.member.api.request Joining catch err:'+JSON.stringify(err));
                        //httpレスポンスをここで実行
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            err.errorCode,
                            Object.assign({type: _type},err.content));
                    }); */
            break;
        case 'Withdraw':
                //リクエスト値をチェック
            if(typeof _content.roomId != 'string' ||
                   !Validation.roomIdValidationCheck(_content.roomId, true)){
                _log.connectionLog(4, '  community.public.member.api.request Withdraw invalid _content.roomId:'
                                        + _content.roomId + ", _myJid:" + _myJid);
                callBackResponse(
                        processCallback,
                        request.accessToken,
                        request.request,
                        request.id,
                        request.version,
                        1,
                    {
                        type: _type,
                        result: false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                break;
            }
                //登録実行
                // The value assigned to _ret here is unused.
            _ret; /* = withdraw(_globalSnsDB, request.accessToken,
                                _content.roomId)
                    .then((res)=>{
                        //メンバーリスト作成
                        let userNames = [];
                        let ulist = Object.keys(res.content.items[0].personInfo);
                        for(let i=0;i<ulist.length;i++){
                            if(!ulist[i] || !res.content.items[0].personInfo[ulist[i]].userName){
                                continue;
                            }
                            if(_myJid != ulist[i]){
                                userNames.push(res.content.items[0].personInfo[ulist[i]].userName);
                            }
                        }
                        delete res.content.items[0].personInfo;
                        //httpレスポンスをここで実行
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            res.errorCode,
                            Object.assign({type: _type},res.content));

                        try{
                            _log.connectionLog(7, '  community.public.member.api.request Withdraw notificate userNames:'+userNames);
                            //通知はここで処理
                            NotificateApi.notifyPush(request.accessToken,
                                                     userNames,
                                                     'RemoveMember',
                                                     Object.assign(
                                                         {type: "CommunityRoom"},
                                                         res.content));
                        }catch(e){
                            _log.connectionLog(3, '  community.public.member.api.request Withdraw catch notificate err:'+(e));
                        }
                        //}
                    })
                    .catch((err)=>{
                        _log.connectionLog(3, '  community.public.member.api.request Withdraw catch err:'+JSON.stringify(err));
                        //httpレスポンスをここで実行
                        callBackResponse(
                            processCallback,
                            request.accessToken,
                            request.request,
                            request.id,
                            request.version,
                            err.errorCode,
                            Object.assign({type: _type},err.content));
                    }); */
            break;
        default:
            _log.connectionLog(3, '  community.public.member.api.request not type');
                //httpレスポンスをここで実行
            callBackResponse(
                    processCallback,
                    request.accessToken,
                    request.request,
                    request.id,
                    request.version,
                    _ret.errorCode,
                    Object.assign({type: _type},_ret.content));
            break;
        }
    }
};

/**
 * メンバー追加のAPI実行処理
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param roomId ルームID
 */
const joining = (globalSnsDB, accessToken, roomId) => {
    _log.connectionLog(7, 'do func community.public.member.api.joining(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const myJid = _sessionData.getJid();
            const publicCommunityMemberDb = new PublicCommunityMemberDbStore(globalSnsDB, tenantuuId);
            let role = 1;// 1=閲覧のみ、投稿／閲覧, 2=管理者
            publicCommunityMemberDb.joining(
                roomId,
                myJid,
                role).then((res)=>{
                    //権限設定(投稿閲覧権を設定)
                    let _policy_id = "p_sendMessageToCommunity_" + roomId;
                    //メンバーが最初の一人目の時は管理者権限でユーザーを追加する
                    if(Object.keys(res.items[0].personInfo).length <= 1){
                        _policy_id = "p_manageCommunity_" + roomId;
                        role = 2;
                    }
                    publicCommunityMemberDb.updateRole(
                        roomId, myJid, role
                    ).then((res_role_set)=>{
                        RoleApiController.assignPolicyToUsers(
                            tenantuuId,
                            _sessionData,
                            {
                                users: [res.items[0].personInfo[myJid].userName],
                                policy_id: _policy_id
                            },
                            'update'
                        ).then((res_role)=>{
                            delete res.items[0].id;
                            delete res.items[0].createdAt;
                            delete res.items[0].createdBy;
                            delete res.items[0].updatedAt;
                            delete res.items[0].updatedBy;
                            delete res.items[0].description;
                            delete res.items[0].privacyType;
                            resolve({
                                errorCode : 0,
                                content : res
                            });
                        }).catch((err_role)=>{
                            _log.connectionLog(3, '  community.public.member.api.joining set role err_role:'+ err_role + JSON.stringify(err_role));
                            // ユーザーを削除
                            try{
                                publicCommunityMemberDb.leaveMember(roomId, myJid);
                            }catch(e){
                                _log.connectionLog(3, '  community.public.member.api.joining delete gc member e:'+ e);
                            }
                            reject({
                                errorCode : 1,
                                content : {
                                    result: false,
                                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                }
                            });
                        });
                    }).catch((err_set_role)=>{
                        _log.connectionLog(3, '  community.public.member.api.joining join member db err_set_role:'+ JSON.stringify(err_set_role));
                        reject({
                            errorCode : 1,
                            content : err_set_role
                        });
                    });
                }).catch((err)=>{
                    _log.connectionLog(3, '  community.public.member.api.joining join member db err:'+ err);
                    reject({
                        errorCode : 1,
                        content : err
                    });
                });
        }else{
            _log.connectionLog(3, '  community.public.member.api.joining not session error');
            reject({
                errorCode : 1,
                content : {
                    result: false,
                    reason: Const.API_STATUS.FORBIDDEN,
                }
            });
        }
    });
};

/**
 * メンバー削除のAPI実行処理
 *
 * @param globalSnsDB globalSnsDBのインスタンス
 * @param accessToken アクセストークン
 * @param roomId ルームID
 */
const withdraw = (globalSnsDB, accessToken, roomId) => {
    _log.connectionLog(7, 'do func community.public.member.api.withdraw(...');
    return new Promise((resolve, reject) => {
        const _sessionDataMannager = SessionDataMannager.getInstance();
        const _sessionData = _sessionDataMannager.get(accessToken);
        if(_sessionData){
            const tenantuuId = _sessionData.getTenantUuid();
            const myJid = _sessionData.getJid();
            const loginAccount = _sessionData.getLoginAccout();
            const publicCommunityMemberDb = new PublicCommunityMemberDbStore(globalSnsDB, tenantuuId);
            RoleApiController.getUserPoliciesByResource(
                tenantuuId,
                _sessionData,
                {
                    resource_id: roomId
                }).then((res_role_sel)=>{
                    //退会ルームの所有権限を取得
                    let deleteRights = [];
                    let hasOtherManager = false;
                    let countOtherManager = 0;
                    let isMyManager = false;
                    for(let i=0;i<res_role_sel.users.length;i++){
                        if(res_role_sel.users[i].user == loginAccount){
                            for(let j=0;j<res_role_sel.users[i].policies.length;j++){
                                //削除する権限をリスト化
                                deleteRights.push(res_role_sel.users[i].policies[j].id);
                                for(let k=0;k<res_role_sel.users[i].policies[j].rights.length;k++){
                                    if(!isMyManager &&
                                       res_role_sel.users[i].policies[j].rights[k].action
                                        == "manageCommunity"){
                                        isMyManager = true;
                                    }
                                }
                            }
                        }else{
                            countOtherManager++;
                            for(let j=0;j<res_role_sel.users[i].policies.length;j++){
                                for(let k=0;k<res_role_sel.users[i].policies[j].rights.length;k++){
                                    if(!hasOtherManager &&
                                       res_role_sel.users[i].policies[j].rights[k].action
                                        == "manageCommunity"){
                                        hasOtherManager = true;
                                    }
                                }
                            }
                        }
                    }
                    if(countOtherManager != 0 &&
                       isMyManager &&
                       !hasOtherManager){
                        //自分以外に管理者が存在しない + 一般ユーザがメンバーとしてまだ存在している
                        //のでその旨をレスポンスしてUIでアラート表示
                        //mess の 'NOT_FOUND_OTHER_MANAGER'で判断している
                        _log.connectionLog(4, '  groupchat.public.member.api.withdraw not found other manager');
                        reject({
                            errorCode : 1,
                            content : {
                                result: false,
                                reason: Const.API_STATUS.FORBIDDEN,
                                mess: 'NOT_FOUND_OTHER_MANAGER'
                            }
                        });
                        return;
                    }
                    publicCommunityMemberDb.leaveMember(
                        roomId,
                        myJid).then((res)=>{
                            //メンバーで登録されていなかった
                            if(res.res && res.res[1].rowCount == 0){
                                _log.connectionLog(4, '  community.public.member.api.withdraw not joining member error');
                                reject({
                                    errorCode : 1,
                                    content : {
                                        result: false,
                                        reason: Const.API_STATUS.FORBIDDEN,
                                    }
                                });
                                return;
                            }
                            //権限削除
                            let doUnassignPolicy = [];
                            for(let i=0;i<deleteRights.length;i++){
                                doUnassignPolicy.push(
                                    RoleApiController.unassignPolicyFromUser(
                                        tenantuuId,
                                        _sessionData,
                                        {
                                            users: [loginAccount],
                                            policy_id: deleteRights[i]
                                        }
                                    )
                                );
                            }
                            Promise.all(
                                doUnassignPolicy
                            ).then((res_role)=>{
                                publicCommunityMemberDb.getRoomInfo(
                                    myJid, roomId
                                ).then((res_ri)=>{
                                    res_ri.extras = {};
                                    res_ri.items[0].removedBy = res_ri.items[0].addedBy;
                                    res_ri.items[0].count = 1;
                                    res_ri.items[0].members = [
                                        myJid
                                    ];
                                    delete res_ri.items[0].description;
                                    delete res_ri.items[0].addedBy;
                                    delete res_ri.items[0].id;
                                    delete res_ri.items[0].notifyType;
                                    delete res_ri.items[0].createdAt;
                                    delete res_ri.items[0].createdBy;
                                    delete res_ri.items[0].updatedAt;
                                    delete res_ri.items[0].updatedBy;
                                    resolve({
                                        errorCode: 0,
                                        content: res_ri
                                    });
                                    return;
                                }).catch((err_ri)=>{
                                    reject({
                                        errorCode: 1,
                                        content: err_ri
                                    });
                                    return;
                                });
                            }).catch((err_role)=>{
                                _log.connectionLog(3, '  community.public.member.api.withdraw set role err_role:'+ JSON.stringify(err_role));
                                // ユーザーを削除
                                try{
                                    publicCommunityMemberDb.leaveMember(roomId, myJid);
                                }catch(e){
                                    _log.connectionLog(3, '  community.public.member.api.withdraw delete gc member e:'+ e);
                                }
                                reject({
                                    errorCode : 1,
                                    content : {
                                        result: false,
                                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                    }
                                });
                            });
                        }).catch((err)=>{
                            _log.connectionLog(3, '  community.public.member.api.withdraw join member db err:'+ err);
                            reject({
                                errorCode : 1,
                                content : err
                            });
                        });
                }).catch((err_role_sel)=>{
                    _log.connectionLog(3, '  community.public.member.api.withdraw set role err_role_sel:'+ JSON.stringify(err_role_sel));
                    reject({
                        errorCode : 1,
                        content : err_role_sel
                    });
                });
        }else{
            _log.connectionLog(3, '  community.public.member.api.withdraw not session error');
            reject({
                errorCode : 1,
                content : {
                    result: false,
                    reason: Const.API_STATUS.FORBIDDEN,
                }
            });
        }
    });
};
