"use strict";

const request = require("request");
const cookie_mod  = require("cookie");
const crypto = require("crypto");
// セッション管理モジュールの読み込み
const SessionDataMannager = require("../session_data_manager");
const _conf = require("../conf").getInstance();
let log = require("../server_log").getInstance();
const Validation = require('../validation');
const CubeeWebApi = require('../cubee_web_api');
const XmppUtils = require('../xmpp_utils');
const Const = require("../const");
const CodimdXmpp = require('./xmpp');
/**
 * このファイル内の設定、定数に当たるもの
 */
let conf = {
    /**
     * Setting file /var/lib/docker/volumes/opt_cubee_node_conf/spf-dckr-nj-0001/server.conf
     * 固定値のランダムな値を入れておく,パスワードを生成するシードの様なもの。
     * あえて複雑な物の必要は無くこの値を元にランダムな値を生成するので
     * 神経質になる必要はない。
     */
    "settingkey" : (_conf.getConfData("CODIMD_USER_PASSWORD_KEY") ? _conf.getConfData("CODIMD_USER_PASSWORD_KEY") : "ho#g@e*720$_b"),
    "cubee_base_location": (_conf.getConfData("SYSTEM_LOCATION_ROOT") ? _conf.getConfData("SYSTEM_LOCATION_ROOT") : "cubee"),
    "codimd_sv" : {
        "sv_service" : "http",
        "sv_host"    : "codimd_app",
        "sv_port"    : 3000
    }
};

let data = {
    
};

/**
 * ログイン後ノートページ表示（ログイン状態をJsonの値でレスポンス）
 *
 * @param request
 * @param response
 *
 * @return レスポンスは正しく実行されればブラウザーへJsonが返され、エラーの場合はcodimdのパスにリダイレクトされる。
 */
exports.Login = (request, response, globalSnsDB) => {
    log.connectionLog(7,"do func  codimd.api.js Login");
    let _accessToken, acountId, tenantuuId;
    if(!Validation.accessTokenValidationCheck(request.body.accessToken, true)){
        response.json({
            result: false,
            reason: Const.API_STATUS.BAD_REQUEST
        });
        return;
    }
    _accessToken = request.body.accessToken;
    let _sessionDataMannager = SessionDataMannager.getInstance();
    let _sessionData = _sessionDataMannager.get(_accessToken);
    if(_sessionData){
        acountId = _sessionData.getLoginAccout();
        tenantuuId = _sessionData.getTenantUuid();
        getCodiMDCookie(request, response, globalSnsDB, acountId, tenantuuId, conf.settingkey).then((res) => {
            if(res){
                //CookieをCodimdから取得しブラウザーにセットする。
                let exdate = new Date(res.cookie.Expires);
                response.cookie("connect.sid", res.cookieid, {
                    "expires" : exdate,
                    "httpOnly" : false
                });
                response.cookie("tuuid", tenantuuId, {
                    "expires" : exdate,
                    "httpOnly" : false
                });
                log.connectionLog(7,"codimd.api.js - set Codimd Cookie to Browser. json");
                response.json({
                    result: true,
                    reason: Const.API_STATUS.SUCCESS
                });
            }else{
                log.connectionLog(1,"codimd.api.js - invalid responce.");
                response.json({
                    result: false,
                    reason: Const.API_STATUS.NOT_FOUND
                });
            }
            return;
        }).catch((e)=>{
            if(e.body.status != undefined &&
               e.body.status == "forbidden"){
                log.connectionLog(1,"codimd.api.js - invalid email or password.");
            }else{
                log.connectionLog(1,"codimd.api.js - invalid access. " + e.mess);
            }
            response.json({
                result: false,
                reason: Const.API_STATUS.FORBIDDEN
            });
            return;
        });
    }else{
        //accessTokenがないときはcubeeのTopページにリダイレクト
        log.connectionLog(1,"codimd.api.js - not found accessToken:" + request.body.accessToken);
        response.json({
            result: false,
            reason: Const.API_STATUS.UNAUTHORIZED
        });
        return;
    }
};

/**
 * ログイン後ノートページ表示（リダイレクト）
 *
 * @param request
 * @param response
 */
exports.LoginRedirect = (request, response, globalSnsDB) => {
    log.connectionLog(7,"do func  codimd.api.js LoginRedirect");
    let _accessToken, acountId, tenantuuId;
    if(!Validation.accessTokenValidationCheck(request.body.accessToken, true)){
        response.json({
            result: false,
            location: conf.cubee_base_location + "/",
            reason: Const.API_STATUS.BAD_REQUEST
        });
        return;
    }
    _accessToken = request.body.accessToken;
    let _sessionDataMannager = SessionDataMannager.getInstance();
    let _sessionData = _sessionDataMannager.get(_accessToken);
    if(_sessionData){
        acountId = _sessionData.getLoginAccout();
        tenantuuId = _sessionData.getTenantUuid();
        getCodiMDCookie(request, response, globalSnsDB, acountId, tenantuuId, conf.settingkey).then((res) => {
            if(res){
                //CookieをCodimdから取得しブラウザーにセットする。
                let exdate = new Date(res.cookie.Expires);
                response.cookie("connect.sid",res.cookieid, {
                    "expires" : exdate,
                    "httpOnly" : false
                });
                response.cookie("tuuid", tenantuuId, {
                    "expires" : exdate,
                    "httpOnly" : false
                });
                response.json({
                    result: true,
                    location: "/codimd/",
                    reason: Const.API_STATUS.SUCCESS
                });
                log.connectionLog(7,"codimd.api.js - set Codimd Cookie to Browser. redirect");
                return;
            }else{
                log.connectionLog(1,"codimd.api.js - invalid responce.");
                response.json({
                    result: false,
                    location: conf.cubee_base_location + "/",
                    reason: Const.API_STATUS.NOT_FOUND
                });
                return;
            }
        }).catch((e)=>{
            if(e.body.status != undefined &&
               e.body.status == "forbidden"){
                log.connectionLog(1,"codimd.api.js - invalid email or password.");
            }else{
                log.connectionLog(1,"codimd.api.js - invalid access. " + e.mess);
            }
            response.json({
                result: false,
                location: conf.cubee_base_location + "/",
                reason: Const.API_STATUS.FORBIDDEN
            });
            return;
        });
    }else{
        //accessTokenがないときはcubeeのTopページにリダイレクト
        log.connectionLog(1,"codimd.api.js - not found accessToken");
        response.redirect(conf.cubee_base_location + "/");
        return;
    }
};

/**
 * 新規ノート作成
 * express のルーター引数に取る関数
 * app.post(location + '/codimd/new', CodiMDConnector.getNewNoteUrl);
 * の様に利用してください。
 *
 * @param request
 * @param response
 */
exports.getNewNoteUrl = (request, response, globalSnsDB) => {
    log.connectionLog(7,"do func  codimd.api.js getNewNoteUrl");
    try{
        let _accessToken,
                acountId,
                tenantuuId,
                noteTitle,
                noteThreadRootId,
                noteRoomId;
        if(! request.body.title ||
           !Validation.noteTitleValidationCheck(request.body.title,true)){
            response.json({
                result: false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            log.connectionLog(3," codimd.api.js getNewNoteUrl  request title invalid." + request.body.title);
            return;
        }
        // noteTitle
        noteTitle = request.body.title;
        // noteThreadRootId
        if(Validation.itemIdValidationCheck(request.body.threadRootId,true)){
            noteThreadRootId = request.body.threadRootId;
        }
        // noteRoomId
        if(Validation.roomIdValidationCheck(request.body.roomId,true)){
            noteRoomId = request.body.roomId;
        }

        if(!Validation.accessTokenValidationCheck(request.body.accessToken,true)){
            response.json({
                result: false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            log.connectionLog(3," codimd.api.js getNewNoteUrl  request accessToken invalid.");
            return;
        }
        _accessToken = request.body.accessToken;
        let _sessionDataMannager = SessionDataMannager.getInstance();
        let _sessionData = _sessionDataMannager.get(_accessToken);
        if(_sessionData){
            acountId = _sessionData.getLoginAccout();
            tenantuuId = _sessionData.getTenantUuid();
            getCodiMDCookie(request, response, globalSnsDB, acountId, tenantuuId, conf.settingkey).then((res) => {
                if(res){
                    //CookieをCodimdから取得しブラウザーにセットする。
                    let exdate = new Date(res.cookie.Expires);
                    response.cookie("connect.sid",res.cookieid, {
                        "expires" : exdate,
                        "httpOnly" : false
                    });
                    response.cookie("tuuid", tenantuuId, {
                        "expires" : exdate,
                        "httpOnly" : false
                    });
                    log.connectionLog(7,"codimd.api.js - set Codimd Cookie to Browser. json");
                    getNewNoteRedirectUrl(res.cookieid, conf.codimd_sv)
                        .then((res2)=>{
                            globalSnsDB.setNote(tenantuuId,
                                                _sessionData.getJid(),
                                                res.body.id,
                                                noteTitle,
                                                res2.location,
                                                noteThreadRootId,
                                                noteRoomId)
                                       .then((res3)=>{
                                           response.json(res2);
                                       }).catch((err3)=>{
                                           response.json(err3);
                                       });
                            return;
                        })
                        .catch((err)=>{
                            response.json(err);
                            return;
                        });
                }else{
                    log.connectionLog(1,"codimd.api.js - invalid responce.");
                    response.json({
                        result: false,
                        reason: Const.API_STATUS.NOT_FOUND
                    });
                    return;
                }
            }).catch((e)=>{
                if(e.body.status != undefined &&
                   e.body.status == "forbidden"){
                    log.connectionLog(1,"codimd.api.js - invalid email or password.");
                }else{
                    log.connectionLog(1,"codimd.api.js - invalid access. " + e.mess);
                }
                response.json({
                    result: false,
                    reason: Const.API_STATUS.FORBIDDEN
                });
                return;
            });
        }else{
            //accessTokenがないとき
            log.connectionLog(1,"codimd.api.js - not found accessToken");
            response.json({
                result: false,
                reason: Const.API_STATUS.UNAUTHORIZED
            });
            return;
        }
    }catch(e){
        log.connectionLog(1,"codimd.api.js try catch error" + e);
        response.json({
            result: false,
            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
        });
        return;
    }
};

/**
 * ノートを削除する
 *
 * @param request
 * @param response
 */
exports.deleteNote = (request, response, globalSnsDB) => {
    log.connectionLog(7,"do func  codimd.api.js deleteNote");
    try{
        //note id
        if(!Validation.noteIdValidationCheck(request.params.id, true)){
            if(request.params.id &&
               typeof request.params.id == 'string'){
                log.connectionLog(5,"  codimd.api.js deleteNote error noteid:"+request.params.id);
            }
            response.json({
                result:false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            return;
        }
        //CodiMDからのCookieを取得しているかチェック
        if(request == undefined ||
           request == null ||
           request.cookies == undefined ||
           request.cookies == null){
            response.json({
                result:false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            return;
        }
        let _accessToken = "",
                cookieid = "",
                tuuid = "";
        if(request.cookies["tuuid"] != undefined &&
           request.cookies["tuuid"] != null &&
           request.cookies["connect.sid"] != undefined &&
           request.cookies["connect.sid"] ){
            cookieid  = request.cookies["connect.sid"];
            tuuid     = request.cookies["tuuid"];
        }
        if(!Validation.accessTokenValidationCheck(request.body.accessToken,true)){
            response.json({
                result:false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            return;
        }
        _accessToken = request.body.accessToken;
        let _sessionDataMannager = SessionDataMannager.getInstance();
        let _sessionData = _sessionDataMannager.get(_accessToken);
        if(_sessionData){
            deleteNoteRedirect(cookieid, request.params.id, conf.codimd_sv)
                .then((res) => {
                    if(res.result){
                        //cubeer連動DBからも削除
                        globalSnsDB.deleteNoteFromJid(tuuid,
                                                      _sessionData.getJid(),
                                                      "/codimd/" + request.params.id)
                                   .then((res3)=>{
                                       if(res3.data.updated_at == undefined ||
                                          ( res3.data.updated_at == null ||
                                            res3.data.updated_at == "null")){
                                           res3.data.updated_at = "";
                                       }
                                       if(res3.data.msgtype){
                                           delete res3.data.msgtype;
                                       }
                                       // 直接通知なので日付けをフォーマット
                                       res3.data.created_at = formatDate(res3.data.created_at);
                                       if(res3.data.updated_at != ""){
                                           res3.data.updated_at = formatDate(res3.data.updated_at);
                                       }
                                       res3["reason"] = Const.API_STATUS.SUCCESS;
                                       response.json(res3);
                                       //cubee共有時
                                       if(res3.data.thread_root_id){
                                           log.connectionLog(7," codimd.api.js deleteNote Note join cubee.");
                                           sendToOpenfireForNotify(_sessionData,
                                                                   res3.data,
                                                                   CodimdXmpp.makeDeleteNoteForXmpp
                                           );
                                       }else
                                       //未cubee共有時
                                       {
                                           log.connectionLog(7," codimd.api.js deleteNote Note not join cubee.");
                                           let _xsConn = _sessionData.getOpenfireSock();
                                           let _sessionDataAry = _sessionDataMannager.getByOpenfireSock(_xsConn);
                                           notifyPushMessge(_sessionDataAry,
                                                            Const.API_NOTIFY.API_NOTIFY_DELETE_NOTE,
                                                            res3.data);
                                       }
                                       return;
                                   }).catch((err3)=>{
                                       err3["reason"] = Const.API_STATUS.INTERNAL_SERVER_ERROR;
                                       log.connectionLog(2," codimd.api.js deleteNote then result true but db err.:" + JSON.stringify(err3));
                                       response.json(err3);
                                       return;
                                   });
                    }else{
                        res["reason"] = Const.API_STATUS.NOT_FOUND;
                        response.json(res);
                        log.connectionLog(1," codimd.api.js deleteNote then result false");
                    }
                    return;
                }).catch((err) => {
                    let errstr;
                    if(err && typeof err == 'object'){
                        errstr = JSON.stringify(err);
                    }else{
                        errstr = err;
                    }
                    log.connectionLog(1," codimd.api.js deleteNote catch err:" + errstr);
                    response.json(err);
                    return;
                });
        }else{
            //accessTokenがないとき
            log.connectionLog(1,"codimd.api.js deleteNote not found accessToken");
            response.json({
                result: false,
                reason: Const.API_STATUS.UNAUTHORIZED
            });
            return;
        }
    }catch(e){
        log.connectionLog(1,"codimd.api.js deleteNote try catch error" + e);
        response.json({
            result: false,
            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
        });
        return;
    }
};

/**
 * (未使用であるが、今後利用する削除はCubee紐づけしない場合に取って置く)
 * ノートを削除する
 * アクセストークンの認証が無いが、CodimdのCookieの認証を引き継ぐこととノートのランダムIDのマッチで
 * 十分な認証とする。
 *
 * express のルーター引数に取る関数
 * app.post(location + '/codimd/new', CodiMDConnector.getNewNoteUrl);
 * の様に利用してください。
 *
 * @param request
 * @param response
 */
exports.deleteNoteFromCodimd = (request, response, globalSnsDB) => {
    log.connectionLog(7,"do func  codimd.api.js deleteNote");
    //note id
    if(!Validation.noteIdValidationCheck(request.params.id, true)){
        if(request.params.id &&
           typeof request.params.id == 'string'){
            log.connectionLog(5,"  codimd.api.js deleteNoteFromCodimd error noteid:"+request.params.id);
        }
        response.json({
            result:false,
            reason: Const.API_STATUS.BAD_REQUEST
        });
        return;
    }
    //CodiMDからのCookieを取得しているかチェック
    if(request == undefined ||
       request == null ||
       request.cookies == undefined ||
       request.cookies == null){
        response.json({
            result:false,
            reason: Const.API_STATUS.BAD_REQUEST
        });
        return;
    }
    let cookieid;
    let codimduid;
    let tuuid;
    if(request.cookies["tuuid"] != undefined &&
       request.cookies["tuuid"] != null &&
       request.cookies["connect.sid"] != undefined &&
       request.cookies["connect.sid"] != null &&
       request.cookies["userid"] != undefined &&
       request.cookies["userid"] != null &&
       request.cookies["loginstate"] != undefined &&
       request.cookies["loginstate"] != null){
        cookieid = request.cookies["connect.sid"];
        codimduid = request.cookies["userid"];
        tuuid = request.cookies["tuuid"];
    }
    deleteNoteRedirect(cookieid, request.params.id, conf.codimd_sv)
        .then((res) => {
            if(res.result){
                //cubeer連動DBからも削除
                globalSnsDB.deleteNoteFromCodimdUid(tuuid,
                                                    codimduid,
                                                    "/codimd/" + request.params.id)
                           .then((res3)=>{
                               res["reason"] = Const.API_STATUS.SUCCESS;
                               response.json(res);
                           }).catch((err3)=>{
                               res["reason"] = Const.API_STATUS.INTERNAL_SERVER_ERROR;
                               response.json(err3);
                           });
                log.connectionLog(7," codimd.api.js deleteNoteFromCodimd then result true");
            }else{
                response.json(res);
                log.connectionLog(1," codimd.api.js deleteNoteFromCodimd then result false");
            }
            return;
        }).catch((err) => {
            let errstr;
            if(err && typeof err == 'object'){
                errstr = JSON.stringify(err);
            }else{
                errstr = err;
            }
            log.connectionLog(1," codimd.api.js deleteNoteFromCodimd catch err:" + errstr);
            response.json(err);
            return;
        });
};

/**
 * ThreadRoorIdに関連、RoomId or 自分, のノートリストを取得
 *
 * @param request
 * @param response
 */
exports.getNoteList = (request, response, globalSnsDB) => {
    log.connectionLog(7,"do func  codimd.api.js getNoteList");
    try{
        let _accessToken,
                acountId,
                tenantuuId,
                noteThreadRootId,
                noteRoomId,
                msgtype;
        // noteThreadRootId
        if(Validation.itemIdValidationCheck(request.body.threadRootId, true)){
            noteThreadRootId = request.body.threadRootId;
        }
        // msgtype
        if(request.body.msgtype &&
           typeof request.body.msgtype == 'number' &&
           (
               (
                   request.body.msgtype > 0 &&
                   request.body.msgtype < 4
               )
               ||
               request.body.msgtype == 5
               ||
               request.body.msgtype == 11
           )
        ){
            msgtype = request.body.msgtype;
        }
        // noteRoomId
        //ルームIDにはChat,つぶやきはJIDが入ってくるのでそれぞれ場合分けでチェックを行う
        if(((msgtype == 2 || msgtype == 11) && Validation.jidValidationCheck(request.body.roomId,true)) ||
           (Validation.roomIdValidationCheck(request.body.roomId,true))){
            noteRoomId = request.body.roomId;
        }
        if(!Validation.accessTokenValidationCheck(request.body.accessToken,true)){
            response.json({
                result: false,
                data: [],
                reason: Const.API_STATUS.BAD_REQUEST
            });
            return;
        }
        _accessToken = request.body.accessToken;
        let _sessionDataMannager = SessionDataMannager.getInstance();
        let _sessionData = _sessionDataMannager.get(_accessToken);
        if(_sessionData){
            acountId = _sessionData.getLoginAccout();
            tenantuuId = _sessionData.getTenantUuid();
            getCodiMDCookie(request, response, globalSnsDB, acountId, tenantuuId, conf.settingkey).then((res) => {
                if(res){
                    log.connectionLog(7," codimd.api.js getNoteList select db");
                    globalSnsDB.getNoteList(tenantuuId,
                                            _sessionData.getJid(),
                                            msgtype,
                                            noteThreadRootId,
                                            noteRoomId)
                               .then((res)=>{
                                   log.connectionLog(7," codimd.db_store.getNoteList get from db data. ok");
                                   for(let i=0;i<res.data.length;i++){
                                       res.data[i]["created_at"] = formatDate(res.data[i]["created_at"]);
                                       if(res.data[i]["updated_at"] == "null"){
                                           res.data[i]["updated_at"] = "";
                                       }else{
                                           res.data[i]["updated_at"] = formatDate(res.data[i]["updated_at"]);
                                       }
                                       if(!res.data[i]["msgtype"]){
                                           res.data[i]["msgtype"] = "";
                                       }
                                   }
                                   response.json({
                                       result: true,
                                       data: res.data,
                                       reason: Const.API_STATUS.SUCCESS
                                   });
                               }).catch((err)=>{
                                   log.connectionLog(2," codimd.db_store.getNoteList db responce error");
                                   response.json({
                                       result: false,
                                       data: [],
                                       reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                                   });
                               });
                    return;
                }else{
                    log.connectionLog(1,"codimd.api.js getNoteList invalid responce.");
                    response.json({
                        result: false,
                        data: [],
                        reason: Const.API_STATUS.NOT_FOUND
                    });
                    return;
                }
            }).catch((e)=>{
                if(e.body.status != undefined &&
                   e.body.status == "forbidden"){
                    log.connectionLog(1,"codimd.api.js getNoteList invalid email or password.");
                }else{
                    log.connectionLog(1,"codimd.api.js getNoteList invalid access. " + e.mess);
                }
                response.json({
                    result: false,
                    data: [],
                    reason: Const.API_STATUS.FORBIDDEN
                });
                return;
            });
        }else{
            //accessTokenがないとき
            log.connectionLog(1,"codimd.api.js getNoteList not found accessToken");
            response.json({
                result: false,
                data: [],
                reason: Const.API_STATUS.UNAUTHORIZED
            });
            return;
        }
    }catch(e){
        log.connectionLog(1,"codimd.api.js getNoteList try catch error" + e);
        response.json({
            result: false,
            data: [],
            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
        });
        return;
    }
};

/**
 * ノートをcubeeの会話に紐付けするAPI
 *
 * express のルーター引数に取る関数
 * app.post(location + '/codimd/new', CodiMDConnector.getNewNoteUrl);
 * の様に利用してください。
 *
 * @param request
 * @param response
 */
exports.joinNoteToCubeeMesssage = (request, response, globalSnsDB) => {
    log.connectionLog(7,"do func  codimd.api.js joinNoteToCubeeMesssage");
    try{
        let _accessToken,
                acountId,
                tenantuuId,
                noteUrl,
                noteThreadRootId;
        if(request.body.noteUrl != undefined &&
           request.body.noteUrl != null &&
           request.body.noteUrl == ""){
            noteUrl = request.body.noteUrl;
        }else{
            if(!request.body.noteUrl ||
               request.body.noteUrl.split("/").length != 3 ||
               !Validation.noteIdValidationCheck(request.body.noteUrl.split("/")[2], true)){
                log.connectionLog(5," codimd.api.js joinNoteToCubeeMesssage noteUrl invalid." + JSON.stringify(request.body));
                response.json({
                    result: false,
                    reason: Const.API_STATUS.BAD_REQUEST
                });
                return;
            }
            noteUrl = request.body.noteUrl;
        }
        // noteThreadRootId
        if(!Validation.itemIdValidationCheck(request.body.threadRootId, true) &&
           request.body.threadRootId != ""
        ){
            log.connectionLog(5," codimd.api.js joinNoteToCubeeMesssage threadRootId invalid.");
            response.json({
                result: false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            return;
        }
        noteThreadRootId = request.body.threadRootId;
        //
        if(!Validation.accessTokenValidationCheck(request.body.accessToken,true)){
            log.connectionLog(5," codimd.api.js joinNoteToCubeeMesssage accessToken invalid.");
            response.json({
                result: false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            return;
        }
        _accessToken = request.body.accessToken;
        let _sessionDataMannager = SessionDataMannager.getInstance();
        let _sessionData = _sessionDataMannager.get(_accessToken);
        if(_sessionData){
            acountId = _sessionData.getLoginAccout();
            tenantuuId = _sessionData.getTenantUuid();
            getCodiMDCookie(request, response, globalSnsDB, acountId, tenantuuId, conf.settingkey).then((res) => {
                if(res){
                    log.connectionLog(7," codimd.api.js joinNoteToCubeeMesssage select db");
                    globalSnsDB.joinNoteToCubeeMesssage(tenantuuId,
                                                        _sessionData.getJid(),
                                                        noteUrl,
                                                        noteThreadRootId)
                               .then((res)=>{
                                   if(res.result){
                                       log.connectionLog(7," codimd.db_store.joinNoteToCubeeMesssage get from db data. ok");
                                       if(res.data.updated_at == undefined ||
                                          ( res.data.updated_at == null ||
                                            res.data.updated_at == "null")){
                                           res.data.updated_at = "";
                                       }
                                       if(res.data.room_id == undefined ||
                                          ( res.data.room_id == null ||
                                            res.data.room_id == "null")){
                                           res.data.room_id = "";
                                       }
                                       // 直接通知なので日付けをフォーマット
                                       res.data.created_at = formatDate(res.data.created_at);
                                       if(res.data.updated_at != ""){
                                           res.data.updated_at = formatDate(res.data.updated_at);
                                       }
                                       response.json({
                                           result: true,
                                           reason: Const.API_STATUS.SUCCESS,
                                           data: res.data
                                       });
                                       setTimeout(sendToOpenfireForNotify,
                                                  300,
                                                  _sessionData,
                                                  res.data,
                                                  CodimdXmpp.makeUpdateNoteInfoForXmpp);
                                   }else{
                                       log.connectionLog(2," codimd.db_store.joinNoteToCubeeMesssage db responce error");
                                       response.json({
                                           result: false,
                                           reason: Const.API_STATUS.NOT_FOUND
                                       });
                                   }
                               }).catch((err)=>{
                                   log.connectionLog(2," codimd.db_store.joinNoteToCubeeMesssage db responce error");
                                   let reason = err.reason && err.reason != 200000 ?
                                                err.reason :
                                                Const.API_STATUS.NOT_FOUND;
                                   response.json({
                                       result: false,
                                       reason: reason
                                   });
                               });
                    return;
                }else{
                    log.connectionLog(1,"codimd.api.js joinNoteToCubeeMesssage invalid responce.");
                    response.json({
                        result: false,
                        reason: Const.API_STATUS.NOT_FOUND
                    });
                    return;
                }
            }).catch((e)=>{
                if(e.body.status != undefined &&
                   e.body.status == "forbidden"){
                    log.connectionLog(1,"codimd.api.js joinNoteToCubeeMesssage invalid email or password.");
                }else{
                    log.connectionLog(1,"codimd.api.js joinNoteToCubeeMesssage invalid access. " + e.mess);
                }
                response.json({
                    result: false,
                    reason: Const.API_STATUS.FORBIDDEN
                });
                return;
            });
        }else{
            //accessTokenがないとき
            log.connectionLog(1,"codimd.api.js joinNoteToCubeeMesssage not found accessToken");
            response.json({
                result: false,
                reason: Const.API_STATUS.UNAUTHORIZED
            });
            return;
        }
    }catch(e){
        log.connectionLog(1,"codimd.api.js joinNoteToCubeeMesssage try catch error" + e);
        response.json({
            result: false,
            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
        });
        return;
    }
};

/**
 * ノートをcubee上での名前を変更する
 *
 * express のルーター引数に取る関数
 * app.post(location + '/codimd/new', CodiMDConnector.getNewNoteUrl);
 * の様に利用してください。
 *
 * @param request
 * @param response
 */
exports.renameNoteOnCubee =  (request, response, globalSnsDB) => {
    log.connectionLog(7,"do func  codimd.api.js renameNoteOnCubee");
    try{
        let _accessToken,
                acountId,
                tenantuuId,
                noteUrl,
                noteTitle;
        if(request.body.noteUrl != undefined &&
           request.body.noteUrl != null &&
           request.body.noteUrl == ""){
            noteUrl = request.body.noteUrl;
        }else{
            if(!request.body.noteUrl ||
               request.body.noteUrl.split("/").length != 3 ||
               !Validation.noteIdValidationCheck(request.body.noteUrl.split("/")[2], true)){
                log.connectionLog(5," codimd.api.js renameNoteOnCubee noteUrl invalid." + JSON.stringify(request.body));
                response.json({
                    result: false,
                    reason: Const.API_STATUS.BAD_REQUEST
                });
                return;
            }
            noteUrl = request.body.noteUrl;
        }
        // noteTitle
        if(!Validation.noteTitleValidationCheck(request.body.title, true)){
            log.connectionLog(5," codimd.api.js renameNoteOnCubee title invalid.");
            response.json({
                result: false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            return;
        }
        noteTitle = request.body.title;
        //
        if(!Validation.accessTokenValidationCheck(request.body.accessToken,true)){
            log.connectionLog(5," codimd.api.js renameNoteOnCubee accessToken invalid.");
            response.json({
                result: false,
                reason: Const.API_STATUS.BAD_REQUEST
            });
            return;
        }
        _accessToken = request.body.accessToken;
        let _sessionDataMannager = SessionDataMannager.getInstance();
        let _sessionData = _sessionDataMannager.get(_accessToken);
        if(_sessionData){
            acountId = _sessionData.getLoginAccout();
            tenantuuId = _sessionData.getTenantUuid();
            getCodiMDCookie(request, response, globalSnsDB, acountId, tenantuuId, conf.settingkey).then((res) => {
                if(res){
                    log.connectionLog(7," codimd.api.js renameNoteOnCubee update db");
                    try{
                        globalSnsDB.renameNoteOnCubee(tenantuuId,
                                                      _sessionData.getJid(),
                                                      noteUrl,
                                                      noteTitle)
                                   .then((res)=>{
                                       if(res.result){
                                           log.connectionLog(7," codimd.db_store.renameNoteOnCubee get from db data. ok");
                                           if(res.data.updated_at == undefined ||
                                              ( res.data.updated_at == null ||
                                                res.data.updated_at == "null")){
                                               res.data.updated_at = "";
                                           }
                                           if(res.data.room_id == undefined ||
                                              ( res.data.room_id == null ||
                                                res.data.room_id == "null")){
                                               res.data.room_id = "";
                                           }
                                           // 直接通知なので日付けをフォーマット
                                           res.data.created_at = formatDate(res.data.created_at);
                                           if(res.data.updated_at != ""){
                                               res.data.updated_at = formatDate(res.data.updated_at);
                                           }
                                           response.json({
                                               result: true,
                                               reason: Const.API_STATUS.SUCCESS,
                                               data: res.data
                                           });
                                           setTimeout(sendToOpenfireForNotify,
                                                      300,
                                                      _sessionData,
                                                      res.data,
                                                      CodimdXmpp.makeUpdateNoteInfoForXmpp);
                                       }else{
                                           log.connectionLog(2," codimd.db_store.renameNoteOnCubee db responce error");
                                           response.json({
                                               result: false,
                                               reason: Const.API_STATUS.NOT_FOUND
                                           });
                                       }
                                   }).catch((err)=>{
                                       log.connectionLog(2," codimd.db_store.renameNoteOnCubee db responce error");
                                       let reason = err.reason && err.reason != 200000 ?
                                                    err.reason :
                                                    Const.API_STATUS.NOT_FOUND;
                                       response.json({
                                           result: false,
                                           reason: reason
                                       });
                                   });
                        return;
                    }catch(e){
                        log.connectionLog(1,"codimd.api.js renameNoteOnCubee db error" + e);
                        response.json({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                        });
                        return;
                    }
                }else{
                    log.connectionLog(1,"codimd.api.js renameNoteOnCubee invalid responce.");
                    response.json({
                        result: false,
                        reason: Const.API_STATUS.NOT_FOUND
                    });
                    return;
                }
            }).catch((e)=>{
                if(e.body.status != undefined &&
                   e.body.status == "forbidden"){
                    log.connectionLog(1,"codimd.api.js renameNoteOnCubeee invalid email or password.");
                }else{
                    log.connectionLog(1,"codimd.api.js renameNoteOnCubeee invalid access. " + e.mess);
                }
                response.json({
                    result: false,
                    reason: Const.API_STATUS.FORBIDDEN
                });
                return;
            });
        }else{
            //accessTokenがないとき
            log.connectionLog(1,"codimd.api.js renameNoteOnCubee not found accessToken");
            response.json({
                result: false,
                reason: Const.API_STATUS.UNAUTHORIZED
            });
            return;
        }
    }catch(e){
        log.connectionLog(1,"codimd.api.js renameNoteOnCubee try catch error" + e);
        response.json({
            result: false,
            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
        });
        return;
    }
};


/**
 * CodimdからのCookieがあればそのcookieでログイン、Cookieを持っていなければ
 * ログイン状態のCookieを取得しその値を返却する。
 *
 * @param request
 * @param request
 * @param acountId
 * @param tenantuuId
 * @param settingkey
 */
const getCodiMDCookie = (request, response, globalSnsDB, acountId, tenantuuId, settingkey) => {
    return new Promise((resolve, reject)=>{
        log.connectionLog(7,"do func  codimd.api.js getCodiMDCookie");

        if(!acountId){
            reject({
                result : false,
                mess : "acountId invalid data."
            });
            return;
        }
        if(!tenantuuId){
            reject({
                result : false,
                mess : "tenantuuId invalid data."
            });
            return;
        }
        if(!settingkey){
            reject({
                result : false,
                mess : "settingkey invalid data."
            });
            return;
        }

        let password = acountId + tenantuuId + settingkey;
        const sha512 = crypto.createHash("sha512");
        sha512.update(password);
        let hashpw = sha512.digest("ascii");

        const useraccount = {
            "email"    : acountId + "@" + tenantuuId + ".com",
            "password" : hashpw
        };
        let cookieid;
        //CodiMDからのCookieを取得しているかチェック
        if(request != undefined &&
           request.cookies != undefined &&
           request.cookies["connect.sid"] != undefined &&
           request.cookies["connect.sid"] != null &&
           request.cookies["loginstate"] != undefined &&
           request.cookies["loginstate"] != null){
            cookieid = request.cookies["connect.sid"];
        }
        codiMDLoginCheck(cookieid, acountId, conf.codimd_sv)
            .then((res)=>{
                if(res.cookieid){
                    log.connectionLog(7,"codimd.api.js getCodiMDCookie resolve!"+ JSON.stringify(res));
                    //ログインできているので
                    //Codimdのアカウントチェックテーブルに
                    globalSnsDB
                        .getAccountStatus(tenantuuId, acountId)
                        .then((sas_res)=>{
                            if(sas_res.status == 0){
                                //ログインできているのにnotoのアカウント管理テーブルに登録されていないのでここで行う。
                                globalSnsDB
                                    .setAccountStatus(tenantuuId, acountId, 1)
                                    .then((sas_res)=>{
                                        log.connectionLog(
                                            7,"codimd.api.js getCodiMDCookie setAccountStatus 1 seted:"
                                            + JSON.stringify(sas_res));
                                    }).catch((sas_err)=>{
                                        log.connectionLog(
                                            2,"codimd.api.js getCodiMDCookie setAccountStatus 1 error:"
                                            + JSON.stringify(sas_err));
                                        res.result = false;
                                        res.mess = "can not set note acount status. :";
                                        res.data = sas_err;
                                        reject(res);
                                        return;
                                    });
                            }
                        }).catch((err)=>{
                            log.connectionLog(1,"codimd.api.js getCodiMDCookie can not get note acount status.");
                            res.result = false;
                            res.mess = "can not get note acount status. :";
                            res.data = err;
                            reject(res);
                            return;
                        });
                    resolve(res);
                    return;
                }else{
                    log.connectionLog(1,"codimd.api.js getCodiMDCookie cookie invalid data but login pass return.");
                    res.result = false;
                    res.mess = "cookie invalid data but login pass return.";
                    reject(res);
                    return;
                }
            })
            .catch((e)=>{
                if(e.cookieid != undefined &&
                   e.cookieid != null){
                    codiMDLogin(e.cookieid,
                                useraccount.email,
                                useraccount.password,
                                conf.codimd_sv)
                        .then((res)=>{
                            globalSnsDB.setAccountStatus(tenantuuId, acountId, 1)
                                       .then((sas_res)=>{
                                           log.connectionLog(
                                               7,"codimd.api.js getCodiMDCookie setAccountStatus 2 seted:"
                                               + JSON.stringify(sas_res));
                                       }).catch((sas_err)=>{
                                           log.connectionLog(
                                               2,"codimd.api.js getCodiMDCookie setAccountStatus 2 error:"
                                               + JSON.stringify(sas_err));
                                       });
                            codiMDLoginCheck(e.cookieid, acountId, conf.codimd_sv)
                                .then((res)=>{
                                    if(res.cookieid){
                                        log.connectionLog(7,"codimd.api.js getCodiMDCookie resolve!!");
                                        resolve(res);
                                    }else{
                                        log.connectionLog(1,"codimd.api.js getCodiMDCookie cookie invalid data but login pass return..");
                                        res.result = false;
                                        res.mess = "cookie invalid data but login pass return..";
                                        reject(res);
                                    }
                                    return;
                                })
                                .catch((e)=>{
                                    if(e.cookieid != undefined &&
                                       e.cookieid != null){
                                        globalSnsDB.getAccountStatus(tenantuuId, acountId)
                                                   .then((sas_res)=>{
                                                       log.connectionLog(
                                                           7,"codimd.api.js getCodiMDCookie getAccountStatus to register:"
                                                           + JSON.stringify(sas_res));
                                                       //ノートのアカウント管理テーブルに登録ない、
                                                       //メモリ上のユーザ登録フラグの立っていないことを確認
                                                       if(sas_res.status == 0 && ! data[useraccount.email]){
                                                           //メモリ上にユーザ登録中のフラグを立てる。
                                                           data[useraccount.email] = true;
                                                           //ユーザ登録
                                                           codiMDAcountRegister(e.cookieid,
                                                                                useraccount.email,
                                                                                useraccount.password,
                                                                                conf.codimd_sv)//アカウント作成
                                                               .then((res)=>{
                                                                   globalSnsDB.setAccountStatus(tenantuuId, acountId, 1)
                                                                              .then((sas_res)=>{
                                                                                  log.connectionLog(
                                                                                      7,"codimd.api.js getCodiMDCookie setAccountStatus 3 seted:"
                                                                                      + JSON.stringify(sas_res));
                                                                              }).catch((sas_err)=>{
                                                                                  log.connectionLog(
                                                                                      2,"codimd.api.js getCodiMDCookie setAccountStatus 3 error:"
                                                                                      + JSON.stringify(sas_err));
                                                                              });
                                                                   codiMDLogin(e.cookieid,
                                                                               useraccount.email,
                                                                               useraccount.password,
                                                                               conf.codimd_sv)//ログイン
                                                                       .then((res)=>{
                                                                           codiMDLoginCheck(e.cookieid, acountId, conf.codimd_sv)
                                                                               .then((res)=>{
                                                                                   if(res.cookieid){
                                                                                       log.connectionLog(7,"codimd.api.js getCodiMDCookie login done");
                                                                                       resolve(res);
                                                                                       delete data[useraccount.email];
                                                                                   }else{
                                                                                       log.connectionLog(3,"codimd.api.js getCodiMDCookie cookie invalid data but login pass return...");
                                                                                       res.result = false;
                                                                                       res.mess = "cookie invalid data but login pass return...";
                                                                                       reject(res);
                                                                                       delete data[useraccount.email];
                                                                                   }
                                                                                   return;
                                                                               })
                                                                               .catch((e)=>{
                                                                                   log.connectionLog(1,"codimd.api.js getCodiMDCookie login check error after register. :"+e.mess);
                                                                                   reject(e);
                                                                                   delete data[useraccount.email];
                                                                                   return;
                                                                               });
                                                                       })
                                                                       .catch((e)=>{
                                                                           log.connectionLog(1,"codimd.api.js getCodiMDCookie login error after register. :"+e.mess);
                                                                           reject(e);
                                                                           delete data[useraccount.email];
                                                                           return;
                                                                       });
                                                               })
                                                               .catch((e)=>{
                                                                   log.connectionLog(1,"codimd.api.js getCodiMDCookie acount register error. :"+e.mess);
                                                                   reject(e);
                                                                   delete data[useraccount.email];
                                                                   return;
                                                               });
                                                       }else{
                                                           log.connectionLog(2,"codimd.api.js getCodiMDCookie acount exist but cannot login. :"+sas_res);
                                                           reject(sas_res);
                                                           return;
                                                       }
                                                   }).catch((sas_err)=>{
                                                       log.connectionLog(
                                                           2,"codimd.api.js getCodiMDCookie getAccountStatus error:"
                                                           + JSON.stringify(sas_err));
                                                       reject(sas_err);
                                                       return;
                                                   });
                                    }else{
                                        //ログイン成功後後に
                                        //クッキーを取得に失敗している。
                                        log.connectionLog(1,"codimd.api.js getCodiMDCookie can not get cookie from codimd.. :"+e.mess);
                                        reject(e);
                                        return;
                                    }
                                });
                        })
                        .catch((e)=>{
                            log.connectionLog(1,"codimd.api.js getCodiMDCookie login error.. :"+e.mess);
                            reject(e);
                            return;
                        });
                }else{
                    //クッキーを取得に失敗している。
                    log.connectionLog(3,"codimd.api.js getCodiMDCookie can not get cookie from codimd. :"+e.mess);
                    reject(e);
                    return;
                }
            });
    });
};

/**
 * 新規ノート作成のリダイレクト先をresolveに返す
 *
 */
const getNewNoteRedirectUrl = (req_cookieid, sv_options) => {
    return new Promise((resolve, reject)=>{
        log.connectionLog(7,"do func codimd.api.js getNewNoteRedirectUrl");
        if(req_cookieid == undefined ||
           req_cookieid == null ||
           typeof req_cookieid != 'string'){
            reject({
                result: false,
                mess: "it has not cookie.",
                reason: Const.API_STATUS.UNAUTHORIZED
            });
            return;
        }
        let j = request.jar();
        let cookie = request.cookie("connect.sid=" + req_cookieid);
        j.setCookie(cookie, sv_options.sv_service + "://" + sv_options.sv_host +"/");
        let options = {
            uri: sv_options.sv_service + "://" + sv_options.sv_host + ":" + sv_options.sv_port + "/new",
            method: "GET",
            jar: j,
            followRedirect: false,
            rejectUnauthorized: false,
        };
        request(options,
                (error, response,  body) => {
                    if(error){
                        log.connectionLog(3,"codimd.api.js getNewNoteUrl error:"+error);
                        reject({
                            result: false,
                            mess: error,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                        });
                        return;
                    }else{
                        if(body.indexOf("Found. Redirecting to /codimd/") >= 0){
                            log.connectionLog(7,"codimd.api.js getNewNoteUrl login succsess" + body);
                            resolve({
                                result: true,
                                mess: "got new note url.",
                                location: response.headers.location,
                                reason: Const.API_STATUS.SUCCESS
                            });
                            return;
                        }else{
                            log.connectionLog(1,"codimd.api.js getNewNoteUrl not right body data:" + body);
                            reject({
                                result: false,
                                mess: "not right body data : ",
                                reason: Const.API_STATUS.NOT_FOUND
                            });
                            return;
                        }
                    }
                });
    });
};

/**
 * ノートを削除のリダイレクト先をresolveに返す
 *
 */
const deleteNoteRedirect = (req_cookieid, noteid, sv_options) => {
    return new Promise((resolve, reject)=>{
        log.connectionLog(7,"do func codimd.api.js deleteNoteRedirect");
        if(req_cookieid == undefined ||
           req_cookieid == null ||
           typeof req_cookieid != 'string'){
            reject({
                result: false,
                mess: "it has not cookie .",
                reason: Const.API_STATUS.BAD_REQUEST
            });
            log.connectionLog(5,"  codimd.api.js deleteNoteRedirect req_cookieid invalid data:" + JSON.stringify(req_cookieid));
            return;
        }
        if(noteid == undefined ||
           noteid == null||
           noteid == ""){
            reject({
                result: false,
                mess: "it has not noteid.",
                reason: Const.API_STATUS.BAD_REQUEST
            });
            log.connectionLog(7,"  codimd.api.js deleteNoteRedirect noteid invalid data");
            return;
        }
        let j = request.jar();
        let cookie = request.cookie("connect.sid=" + req_cookieid);
        j.setCookie(cookie, sv_options.sv_service + "://" + sv_options.sv_host +"/");
        let options = {
            uri: sv_options.sv_service + "://" + sv_options.sv_host + ":" + sv_options.sv_port + "/history/" + noteid,
            method: "DELETE",
            jar: j,
            followRedirect: false,
            rejectUnauthorized: false,
        };
        request(options,
                (error, response,  body) => {
                    if(error){
                        reject({
                            result: false,
                            mess: error,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                        });
                        log.connectionLog(1,"  codimd.api.js deleteNoteRedirect request error");
                    }else{
                        if(response.headers.connection == "close"){
                            resolve({
                                result: true,
                                mess: "note delete done.",
                                reason: Const.API_STATUS.SUCCESS
                            });
                            log.connectionLog(7,"codimd.api.js deleteNoteRedirect succsess");
                        }else{
                            reject({
                                result: false,
                                mess: "note delete done. but connection not close",
                                reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                            });
                            log.connectionLog(1,"codimd.api.js deleteNoteRedirect succsess not close");
                        }
                    }
                });
    });
};


/**
 * CodiMDへのログイン状態をチェック
 *
 * @param req_cookieid
 * @param acountId
 * @param sv_options
 *
 * @return Promise
 */
const codiMDLoginCheck = (req_cookieid, acountId, sv_options) => {
    return new Promise((resolve, reject)=>{
        //
        log.connectionLog(7,"do func codimd.api.js codiMDLoginCheck");
        let j = null;
        if(req_cookieid != undefined &&
           req_cookieid != null ||
           typeof req_cookieid != 'string'){
            log.connectionLog(7,"  codimd.api.js codiMDLoginCheck - cookie req_cookieid:" + JSON.stringify(req_cookieid));
            j = request.jar();
            let cookie = request.cookie("connect.sid=" + req_cookieid);
            j.setCookie(cookie, sv_options.sv_service + "://" + sv_options.sv_host +"/");
        }
        let options = {
            uri: sv_options.sv_service + "://" + sv_options.sv_host + ":" + sv_options.sv_port + "/me",
            method: "GET",
            rejectUnauthorized: false,
            followAllRedirects: false,
        };
        if(j != null){
            options.jar = j;
            log.connectionLog(7,"  codimd.api.js codiMDLoginCheck - jar j :" + JSON.stringify(j._jar.toJSON()));
        }
        request(options,
                (error, response,  body) => {
                    if(error){
                        log.connectionLog(1,"codimd.api.js codiMDLoginCheck error:" + error);
                        reject({
                            result : false,
                            mess : error
                        });
                        return;
                    }else{
                        try{
                            //Codimdは1つcookieをレスポンスしてくるので、これをパースさせる
                            const res_cookie = cookie_mod.parse(response.headers["set-cookie"][0] || "");
                            let bodyjson = JSON.parse(body);
                            if(bodyjson.status == undefined ||
                               bodyjson.status == null){
                                //リクエストエラーは無かったが/meの問い合わせで正しいフォーマットが却ってこなかった
                                log.connectionLog(1,"codimd.api.js codiMDLoginCheck error: body.status is invalid");
                                reject({
                                    result : false,
                                    mess : "not allaw url or set request error"
                                });
                                return;
                            }else if(bodyjson.status != "ok"){
                                //ログイン状態ではないがCookieを発行された
                                log.connectionLog(7,"codimd.api.js codiMDLoginCheck body.status is not ok");
                                reject({
                                    result : false,
                                    mess : "not allaw user",
                                    cookie : res_cookie,
                                    cookieid : res_cookie["connect.sid"],
                                    body : JSON.parse(body)
                                });
                                return;
                            }else if(acountId != bodyjson.name){
                                //現在のcubeeのログインしているユーザではないユーザ
                                log.connectionLog(7,"codimd.api.js codiMDLoginCheck body.name is not cubee acountId");
                                reject({
                                    result : false,
                                    mess : "changed cubee user acount.",
                                    cookie : res_cookie,
                                    cookieid : res_cookie["connect.sid"],
                                    body : JSON.parse(body)
                                });
                                return;
                            }else{
                                //ログイン状態でCookieを返却
                                log.connectionLog(7,"codimd.api.js codiMDLoginCheck logined OK!");
                                resolve({
                                    result : true,
                                    mess : "login succsess.",
                                    cookie : res_cookie,
                                    cookieid : res_cookie["connect.sid"],
                                    body : JSON.parse(body)
                                });
                                return;
                            }
                        }catch(e){
                            //リクエストエラーは無かったが/meのレスポンスでJSON.parse出来無いものが混入されている
                            log.connectionLog(1,"codimd.api.js codiMDLoginCheck error:" + e);
                            reject({
                                result : false,
                                mess : e
                            });
                            return;
                        }
                    }
                });
    });
};

/**
 * codimd ログイン
 *
 * @param req_cookieid
 * @param email
 * @param password
 * @param sv_options
 */
const codiMDLogin = (req_cookieid, email, password, sv_options) => {
    return new Promise((resolve, reject)=>{
        log.connectionLog(7,"do func codimd.api.js codiMDLogin");
        if(req_cookieid == undefined ||
           req_cookieid == null ||
           typeof req_cookieid != 'string'){
            reject({
                result : false,
                mess : "it has not cookie."
            });
            return;
        }
        let j = request.jar();
        let cookie = request.cookie("connect.sid=" + req_cookieid);
        j.setCookie(cookie, sv_options.sv_service + "://" + sv_options.sv_host +"/");
        let postDataStr = {
            "email"    : email,
            "password" : password
        };
        let options = {
            uri: sv_options.sv_service + "://" + sv_options.sv_host + ":" + sv_options.sv_port + "/login",
            method: "POST",
            jar: j,
            form: postDataStr,
            rejectUnauthorized: false,
            followAllRedirects: false,
        };
        request(options,
                (error, response,  body) => {
                    if(error){
                        log.connectionLog(3,"codimd.api.js codiMDLogin error:"+error);
                        reject({
                            result : false,
                            mess : error
                        });
                        return;
                    }else{
                        if(body == "Found. Redirecting to /codimd/"){
                            log.connectionLog(7,"codimd.api.js codiMDLogin login succsess");
                            resolve({
                                result : true,
                                mess : "login done"
                            });
                            return;
                        }else{
                            log.connectionLog(1,"codimd.api.js codiMDLogin not right body data:" + body);
                            reject({
                                result : false,
                                mess : "not right body data : " + body
                            });
                            return;
                        }
                    }
                });
    });
};

/**
 * Codimd アカウント登録
 */
const codiMDAcountRegister = (req_cookieid, email, password, sv_options) => {
    return new Promise((resolve, reject)=>{
        log.connectionLog(7,"do func codimd.api.js codiMDAcountRegister");
        if(req_cookieid == undefined ||
           req_cookieid == null ||
           typeof req_cookieid != 'string'){
            reject({
                result : false,
                mess : "it has not cookie."
            });
            return;
        }
        let j = request.jar();
        let cookie = request.cookie("connect.sid=" + req_cookieid);
        j.setCookie(cookie, sv_options.sv_service + "://" + sv_options.sv_host +"/");
        let postDataStr = {
            "email"    : email,
            "password" : password
        };
        let options = {
            "uri" : sv_options.sv_service + "://" + sv_options.sv_host + ":" + sv_options.sv_port + "/register",
            "method" : "POST",
            "jar" : j,
            "form" : postDataStr,
            "rejectUnauthorized" : false,
            followAllRedirects: false,
        };
        request(options,
                (error, response,  body) => {
                    if(error){
                        log.connectionLog(1,"codimd.api.js codiMDAcountRegister error:"+error);
                        reject({
                            result : false,
                            mess : error
                        });
                        return;
                    }else{
                        if(body == "Found. Redirecting to /codimd/"){
                            log.connectionLog(7,"codimd.api.js codiMDAcountRegister acount regist succsess");
                            resolve({
                                result : true,
                                mess : "register done"
                            });
                            return;
                        }else{
                            log.connectionLog(1,"codimd.api.js codiMDAcountRegister not right body data:" + body);
                            reject({
                                result : false,
                                mess : "not right body data : " + body
                            });
                            return;
                        }
                    }
                });
    });
};


// ====== ここから通知送信関数 or Openfireリクエスト関数 ======
/**
 * 自分だけに通知配信するための関数
 * sessionDataは自分自身のものしか取得できないので
 * 未cubee共有時に使う(openfireまで経由しないので負荷が小く、レスポンスも速い)
 *
 * @param sessionDataAry
 * @param notifyType
 * @param pushContent
 */
const notifyPushMessge = (sessionDataAry, notifyType, pushContent) => {
    log.connectionLog(7, "do func codimd.api.js notifyPushMessage(");
    try{
        if(sessionDataAry == null){
            log.connectionLog(3, " codimd.api.js notifyPushMessage sessionDataAry is null:");
            return;
        }
        var _index = 0;
        const _callPushMessage = () => {
            var _accessToken = sessionDataAry[_index].getAccessToken();
            _index++;
            log.connectionLog(7, ' codimd.api.js notifyPushMessage:['+_accessToken+']');
            //ここで通知を行う
            CubeeWebApi.getInstance().pushMessage(_accessToken, notifyType, pushContent);
            if(_index < sessionDataAry.length){
                setTimeout(_callPushMessage, 1);
            }
        };
        setTimeout(_callPushMessage, 1);
    }catch(e){
        log.connectionLog(1," codimd.api.js notifyPushMessage try catch err:" + JSON.stringify(e));
    }
};

/**
 * Openfireへリクエストを送信関数
 * これを送信することでSynchronouseBridgeNode内_onMessageで通知を受けることが出来る
 *
 * @param _sessionData
 * @param requestData
 * @param xmppDataMakeFunction 引数に（XmppHostName,FromJid,MessageData）を持つ関数、例） Xmppライブラリーで作成さている内容
 */
const sendToOpenfireForNotify = (sessionData, requestData, xmppDataMakeFunction) => {
    log.connectionLog(7,"do func codimd.api.js sendToOpenfireForNotify(");
    //通知の受信は SynchronouseBridgeNode._onMessageNotify
    var _xsConn = sessionData.getOpenfireSock();
    var _xmppServerHostName = sessionData.getXmppServerName();
    var _fromJid = sessionData.getJid();
    var _messageData = requestData;
    try{
        //XMPPフォーマットのチェック
        let _xmppData = XmppUtils.checkCreateXmppData(_xsConn, function() {
            //XML作成はXMPPライブラリーで作成
            return xmppDataMakeFunction(_xmppServerHostName,
                                        _fromJid,
                                        _messageData);
        });
        var _id = _xmppData[1];
        //XMPPからのレスポンスを受ける
        sessionData.setCallback(_id,(responceXml) => {
            //responceXmlを受け取るがエラー記録以外は必要としない？
            let typeAttr = responceXml.attr("type");
            if(typeAttr == null || typeAttr.value() == ":result"){
                log.connectionLog(3,"do func codimd.api.js sendToOpenfireForNotify sessionData.setCallback error:" + responceXml);
                return;
            }
            log.connectionLog(7," codimd.api.js sendToOpenfireForNotify sessionData.setCallback :" + responceXml);
        });
        //ノート削除XMPP送信
        var _xmppStr = _xmppData[0];
        _xsConn.send(_xmppStr);
    }catch(e){
        log.connectionLog(1,"do func codimd.api.js sendToOpenfireForNotify error:"+e);
    }
};


// ====== ここから通知送信関数 or Openfireリクエスト関数 ======
/**
 * 日付フォーマット関数
 */
const formatDate = (dateString) => {
    if(!dateString){
        return "";
    }
    let date = new Date(dateString);
    return date.getFullYear()
    + "/" + ("0" + (date.getMonth() + 1)).slice(-2)
    + "/" + ("0" + date.getDate()).slice(-2)
    + " " + ("0" + date.getHours()).slice(-2)
    + ":" + ("0" + date.getMinutes()).slice(-2)
    + ":" + ("0" + date.getSeconds()).slice(-2)
    + "." + ("000" + date.getMilliseconds()).slice(-3);
};
