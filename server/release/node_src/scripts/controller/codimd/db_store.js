"use strict";

const fs = require('fs');
const Sequelize = require('sequelize');
const log = require("../server_log").getInstance();
const util = require('util');
const Const = require("../const");

/**
 * Nodeから直接DBに接続するためのクラス。
 * 2019/3末時点websocketで使わないのでapp.jsないで初期化し
 * codimdで使うテーブル動作のみで使っている
 *
 */
module.exports = class DbStore{

    constructor (confFilePath) {
        this.readConfig(confFilePath);
    }

    /**
     * 設定ファイルを読み込み、接続
     *
     * @param confFilePath 設定ファイルパス
     */
    readConfig(confFilePath) {
        if(this.sequelize == undefined ||
           this.sequelize == null) {
            this.sequelize = {};
        }
        if (confFilePath == null || typeof confFilePath != "string") {
            throw "DbStore set config file path is invalid.";
        }
        let conf = null;
        try{
            let _confStr = fs.readFileSync(confFilePath, 'utf8');
            conf = JSON.parse(_confStr);
        }catch(err){
            throw "DbStore config file can not read or json format error:"+err;
        }
        if(!conf){
            throw "DbStore config data is invalid";
        }
        for(let uuid in conf){
            for(let dbname in conf[uuid]){
                if(conf[uuid][dbname].db && conf[uuid][dbname].opts){
                    const db = conf[uuid][dbname].db;
                    const option = conf[uuid][dbname].opts;
                    if(this.sequelize[uuid] == undefined ||
                       this.sequelize[uuid] == null) {
                        this.sequelize[uuid] = {};
                    }
                    if(this.sequelize[uuid][dbname] == undefined ||
                       this.sequelize[uuid][dbname] == null) {
                        this.sequelize[uuid][dbname] = {};
                    }
                    this.sequelize[uuid][dbname] = new Sequelize(db, option);
                }
            }
        }
    }

    /**
     * 新規のNoteデータの作成またはタイトルなどの更新
     *
     * @param uuid テナントUUID
     * @param jid  JID
     * @param codimd_uid Codimd発行のUID
     * @param title ノートタイトル
     * @param urlpath ノートURL Path
     * @param thread_root_id 紐付するThreadRoorId
     */
    setNote(uuid, jid, codimd_uid, title, urlpath, thread_root_id){
        return new Promise((resolve, reject)=>{
            try{
                if(! jid){
                    log.connectionLog(2," codimd.db_store.js setNote jid invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! codimd_uid){
                    log.connectionLog(2," codimd.db_store.js setNote codimd_uid invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! title){
                    log.connectionLog(2," codimd.db_store.js setNote title invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! urlpath){
                    log.connectionLog(2," codimd.db_store.js setNote urlpath invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! this.sequelize ||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.setNote  sequelize is invalid");
                    reject({
                        result:false
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.setNote  sequelize is ok");
                }
                const sqlbase = "INSERT INTO"
                              + " note_store ("
                              + " note_title, note_url, ownjid , codimd_uid, thread_root_id, created_at)"
                              + " VALUES ("
                              + " %s,         %s,       %s,      %s,         %s,             now()"
                              + ")"
                              + " ON CONFLICT (note_url)"
                              + " DO UPDATE SET"
                              + "  note_title = %s, thread_root_id= %s, updated_at = now()";
                let sql = util.format(sqlbase,
                                      this.sequelize[uuid]["globalsns"].escape(title),
                                      this.sequelize[uuid]["globalsns"].escape(urlpath),
                                      this.sequelize[uuid]["globalsns"].escape(jid),
                                      this.sequelize[uuid]["globalsns"].escape(codimd_uid),
                                      (thread_root_id ? this.sequelize[uuid]["globalsns"].escape(thread_root_id) : "''"),
                                      this.sequelize[uuid]["globalsns"].escape(title),
                                      (thread_root_id ? this.sequelize[uuid]["globalsns"].escape(thread_root_id) : "''")
                );
                this.sequelize[uuid]["globalsns"].query(sql)
                    .then((res) => {
                        log.connectionLog(7," codimd.db_store.setNote  note_store: s" + JSON.stringify(res));
                        resolve({
                            result:true
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," codimd.db_store.setNote  note_store: err" + err);
                        reject({
                            result:false
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," codimd.db_store.setNote( catch. " + e);
                reject({
                    result:false
                });
                return;
            }
        });
    }

    /**
     * 指定のNoteURLを持ったデータにTheadRootIdを登録する
     *
     * @param uuid テナントUUID
     * @param urlpath ノートURL Path
     * @param thread_root_id 紐付するThreadRoorId
     */
    setThreadRootIdToNote(uuid, urlpath, thread_root_id){
        return new Promise((resolve, reject)=>{
            try{
                if(! urlpath){
                    log.connectionLog(2," codimd.db_store.js setThreadRootIdToNote urlpath invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! thread_root_id){
                    log.connectionLog(2," codimd.db_store.js setThreadRootIdToNote thread_root_id invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.setThreadRootIdToNote  sequelize is invalid");
                    reject({
                        result:false
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.setThreadRootIdToNote  sequelize is ok");
                }
                const sqlbase = "UPDATE SET"
                              + "  thread_root_id= %s, updated_at = now()"
                              + " WHERE"
                              + "  note_url= %s";
                let sql = util.format( sqlbase,
                                       (thread_root_id ? this.sequelize[uuid]["globalsns"].escape(thread_root_id) : "''"),
                                       this.sequelize[uuid]["globalsns"].escape(urlpath) );
                this.sequelize[uuid]["globalsns"].query(sql)
                    .then((res) => {
                        log.connectionLog(7," codimd.db_store.setThreadRootIdToNote  note_store: s" + JSON.stringify(res));
                        resolve({
                            result:true
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," codimd.db_store.setThreadRootIdToNote  note_store: err" + err);
                        reject({
                            result:false
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," codimd.db_store.setThreadRootIdToNote( catch. " + e);
                reject({
                    result:false
                });
                return;
            }
        });
    }

    /**
     * Cubee上からaccsessTokenの認証を使い履歴から削除
     *
     * @param uuid テナントUUID
     * @param jid  JID
     * @param thread_root_id 紐付するThreadRoorId
     */
    deleteNoteFromJid(uuid, jid, urlpath){
        return new Promise((resolve, reject)=>{
            try{
                if(! urlpath){
                    log.connectionLog(2," codimd.db_store.js deleteNoteFromJid urlpath invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! jid){
                    log.connectionLog(2," codimd.db_store.js deleteNoteFromJid jid invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.deleteNoteFromJid  sequelize is invalid");
                    reject({
                        result:false
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.deleteNoteFromJid  sequelize is ok");
                }
                this.getNote(uuid, jid, urlpath).then((selectres)=>{
                    if(selectres.result &&
                       typeof selectres.data[0] == "object"){
                        const sqlbase = "DELETE FROM"
                                      + "  note_store "
                                      + " WHERE"
                                      + "  note_url = %s AND "
                                      + "  ownjid = %s ";
                        let sql = util.format(sqlbase,
                                              this.sequelize[uuid]["globalsns"].escape(urlpath),
                                              this.sequelize[uuid]["globalsns"].escape(jid)
                        );
                        this.sequelize[uuid]["globalsns"].query(sql)
                            .then((res) => {
                                log.connectionLog(7," codimd.db_store.deleteNoteFromJid  note_store: res.rowCount:" + res.rowCount);
                                if(res.length > 1 &&
                                   res[1].rowCount > 0){
                                    log.connectionLog(7," codimd.db_store.deleteNoteFromJid  note_store: succsess" + JSON.stringify(res));
                                    resolve({
                                        result:true,
                                        data:selectres.data[0]
                                    });
                                }else{
                                    //not found delete note
                                    log.connectionLog(3," codimd.db_store.deleteNoteFromJid  note_store not found detete note id SQL:" + sql);
                                    reject({
                                        result:false
                                    });
                                }
                                return;
                            }).catch((err)=>{
                                log.connectionLog(2," codimd.db_store.deleteNoteFromJid  note_store: err:" + err);
                                reject({
                                    result:false
                                });
                                return;
                            });
                    }else{
                        log.connectionLog(2," codimd.db_store.deleteNoteFromJid  note_store not found detete urlpath. selectres:" + JSON.stringify(selectres));
                        reject({
                            result:false
                        });
                        return;
                    }
                }).catch((selecterr)=>{
                    log.connectionLog(2," codimd.db_store.deleteNoteFromJid  note_store urlpath select err:" + selecterr);
                    reject({
                        result:false
                    });
                    return;
                });
            }catch(e){
                log.connectionLog(2," codimd.db_store.deleteNoteFromJid catch. " + e);
                reject({
                    result:false
                });
                return;
            }
        });
    }

    /**
     * Codimdから直接削除の場合の関数の為
     * 未使用。今後拡張などの為に残す。
     *
     * @param uuid テナントUUID
     * @param codimd_uid Codimd発行のUID
     * @param urlpath ノートURL Path
     */
    deleteNoteFromCodimdUid(uuid, codimd_uid, urlpath){
        return new Promise((resolve, reject)=>{
            try{
                if(! urlpath){
                    log.connectionLog(2," codimd.db_store.js deleteNoteFromCodimdUid urlpath invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! codimd_uid){
                    log.connectionLog(2," codimd.db_store.js deleteNoteFromCodimdUid codimd_uid invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.deleteNoteFromCodimdUid  sequelize is invalid");
                    reject({
                        result:false
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.deleteNoteFromCodimdUid  sequelize is ok");
                }
                const sqlbase = "DELETE FROM"
                              + "  note_store "
                              + " WHERE"
                              + "  note_url = %s AND "
                              + "  codimd_uid = %s ";
                let sql = util.format(sqlbase,
                                      this.sequelize[uuid]["globalsns"].escape(urlpath),
                                      this.sequelize[uuid]["globalsns"].escape(codimd_uid)
                );
                this.sequelize[uuid]["globalsns"].query(sql)
                    .then((res) => {
                        log.connectionLog(7," codimd.db_store.deleteNoteFromCodimdUid  note_store: succsess" + JSON.stringify(res));
                        resolve({
                            result:true
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," codimd.db_store.deleteNoteFromCodimdUid  note_store: err" + err);
                        reject({
                            result:false
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," codimd.db_store.deleteNoteFromCodimdUid catch. " + e);
                reject({
                    result:false
                });
                return;
            }
        });
    }

    /**
     * thread_root_id と room_idの値のどちらかか両方に属するもの
     * もしくは両方共無い場合はjidに紐付されたリストが返却される
     *
     * @param uuid テナントUUID
     * @param jid  JID
     * @param msgtype メッセージタイプ
     * @param thread_root_id 紐付するThreadRoorId
     * @param room_id CubeeのRoomId(Chatは相手のJID)
     */
    getNoteList(uuid, jid, msgtype, thread_root_id, room_id){
        return new Promise((resolve, reject)=>{
            try{
                if(! jid && !thread_root_id && !room_id){
                    log.connectionLog(2," codimd.db_store.js getNoteList jid,thread_root_id,room_id all invalid.");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.getNoteList  sequelize is invalid");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.getNoteList  sequelize is ok");
                }
                const sqlbase = "SELECT"
                              + "  n.note_title,"
                              + "  n.note_url,"
                              + "  p.msgtype,"
                              + "  n.thread_root_id,"
                              + "  CASE"
                              + "   WHEN p.msgtype = 2 THEN p.msgto"
                              + "   WHEN p.msgtype = 3 THEN p.msgto"
                              + "   WHEN p.msgtype = 5 THEN p.msgto"
                              + "   WHEN p.msgtype = 11 THEN p.msgto"
                              + "   ELSE ''"
                              + "  END AS room_id,"
                              + "  CASE"
                              + "   WHEN p.msgtype = 2 THEN (SELECT nickname  FROM user_profile WHERE jid=p.msgto limit 1)"
                              + "   WHEN p.msgtype = 3 THEN (SELECT room_name FROM chatroom_store WHERE room_id=p.msgto)"
                              + "   WHEN p.msgtype = 5 THEN (SELECT room_name FROM community_store WHERE room_id=p.msgto)"
                              + "   WHEN p.msgtype = 11 THEN (SELECT column_name FROM murmur_store WHERE own_jid=p.msgto)"
                              + "   ELSE ''"
                              + "  END AS room_name,"
                              + "  n.ownjid,"
                              + "  n.created_at,"
                              + "  n.updated_at,"
                              + "  CASE WHEN n.updated_at is NULL THEN n.created_at ELSE n.updated_at END AS data_changed_at"
                              + " FROM"
                              + "  note_store AS n"
                              + "  LEFT OUTER JOIN publicmessage_store AS p ON  n.thread_root_id != '' AND n.thread_root_id = p.item_id "
                ;
                let selWhere = "";
                if(thread_root_id){
                    if(selWhere){
                        selWhere += " AND ";
                    }
                    selWhere += util.format(" n.thread_root_id= %s",
                                            this.sequelize[uuid]["globalsns"].escape(thread_root_id));
                }
                if(room_id){
                    if(selWhere){
                        selWhere += " AND ";
                    }
                    if(msgtype){
                        switch(msgtype){
                        case 2:
                            selWhere += util.format(" ((p.msgfrom=%s AND p.msgto=%s) OR (p.msgfrom=%s AND p.msgto=%s ))",
                                                    this.sequelize[uuid]["globalsns"].escape(jid),
                                                    this.sequelize[uuid]["globalsns"].escape(room_id),
                                                    this.sequelize[uuid]["globalsns"].escape(room_id),
                                                    this.sequelize[uuid]["globalsns"].escape(jid)
                            );
                            break;
                        case 3:
                        case 5:
                            selWhere += util.format(" p.msgto= %s",
                                                    this.sequelize[uuid]["globalsns"].escape(room_id)
                            );
                            break;
                        case 11:
                            selWhere += util.format(" p.msgto=%s",
                                                    this.sequelize[uuid]["globalsns"].escape(room_id)
                            );
                            break;
                        default:
                            break;
                        }
                    }else{
                        selWhere += util.format(" p.msgto= %s",
                                                this.sequelize[uuid]["globalsns"].escape(room_id)
                        );
                    }
                }
                if(msgtype){
                    if(selWhere){
                        selWhere += " AND ";
                    }
                    selWhere += util.format(" p.msgtype=%s",
                                            this.sequelize[uuid]["globalsns"].escape(msgtype)
                    );
                }
                if(selWhere){
                    selWhere += " AND ("
                              + "   ("
                              + "     p.msgtype = 1"
                              + "   )"
                              + "   OR"
                              + "   ("
                              + "     p.msgtype = 2"
                              + "   )"
                              + "   OR"
                              + "   ("
                              + "     p.msgtype = 3"
                              + "      AND"
                              + "     EXISTS (SELECT 1 FROM chatroom_member_store WHERE jid=n.ownjid AND room_id=p.msgto)"
                              + "   )"
                              + "   OR"
                              + "   ("
                              + "     p.msgtype = 5"
                              + "      AND"
                              + "     EXISTS (SELECT 1 FROM community_member_store WHERE jid=n.ownjid AND room_id=p.msgto)"
                              + "   )"
                              + "   OR"
                              + "   ("
                              + "     p.msgtype = 11"
                              + "   )"
                              + " )";
                }else{
                    //thread_root_id or roomid の指定が無い場合はJIDのリストを取得
                    if(jid){
                        selWhere += util.format(" n.ownjid= %s",this.sequelize[uuid]["globalsns"].escape(jid));
                    }else{
                        log.connectionLog(7," codimd.db_store.getNoteList jid is invalid.");
                        reject({
                            result:false,
                            data:[]
                        });
                        return;
                    }
                }
                const orderby = " ORDER BY  data_changed_at DESC, n.created_at DESC, n.id DESC";
                let sql = sqlbase
                        + " WHERE  "
                        + selWhere + orderby;
                log.connectionLog(7," codimd.db_store.getNoteList  sql:" + sql);
                this.sequelize[uuid]["globalsns"].query(sql,{raw:true})
                    .then((res) => {
                        if(res.length){
                            log.connectionLog(7," codimd.db_store.getNoteList  note_store success:"+ JSON.stringify(res[0]));
                            for(let i=0;i<res[0].length;i++){
                                delete res[0][i].data_changed_at;
                            }
                            resolve({
                                result:true,
                                data:res[0]
                            });
                        }else{
                            log.connectionLog(7," codimd.db_store.getNoteList  note_store db responce invalid");
                            reject({
                                result:false,
                                data:[]
                            });
                        }
                        return;
                    });
            }catch(e){
                log.connectionLog(2," codimd.db_store.getNoteList( catch. " + e);
                reject({
                    result:false,
                    data:[]
                });
                return;
            }
        });
    }

    /**
     * urlpathのnotoの情報を取得
     *
     * @param uuid テナントUUID
     * @param jid  JID
     * @param thread_root_id 紐付するThreadRoorId
     */
    getNote(uuid, jid, urlpath){
        return new Promise((resolve, reject)=>{
            try{
                if(! jid ){
                    log.connectionLog(2," codimd.db_store.js getNote jid invalid.");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.getNote  sequelize is invalid");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.getNote  sequelize is ok");
                }
                const sqlbase = "SELECT "
                              + "   n.note_title,"
                              + "   n.note_url,"
                              + "   p.msgtype,"
                              + "   n.thread_root_id,"
                              + "  CASE"
                              + "   WHEN p.msgtype = 2 THEN p.msgto"
                              + "   WHEN p.msgtype = 3 THEN p.msgto"
                              + "   WHEN p.msgtype = 5 THEN p.msgto"
                              + "   ELSE ''"
                              + "  END AS room_id,"
                              + "  CASE"
                              + "   WHEN p.msgtype = 2 THEN (SELECT nickname  FROM user_profile WHERE jid=p.msgto limit 1)"
                              + "   WHEN p.msgtype = 3 THEN (SELECT room_name FROM chatroom_store WHERE room_id=p.msgto)"
                              + "   WHEN p.msgtype = 5 THEN (SELECT room_name FROM community_store WHERE room_id=p.msgto)"
                              + "   ELSE ''"
                              + "  END AS room_name,"
                              + "   n.ownjid,"
                              + "   n.created_at,"
                              + "   n.updated_at"
                              + " FROM"
                              + "  note_store AS n"
                              + "  LEFT OUTER JOIN publicmessage_store AS p ON n.thread_root_id = p.item_id "
                ;
                let selWhere = "";
                if(urlpath){
                    selWhere += util.format(" n.note_url= %s",this.sequelize[uuid]["globalsns"].escape(urlpath));
                }else{
                    log.connectionLog(1," codimd.db_store.getNote  urlpath is invalid");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }
                if(jid){
                    if(selWhere){
                        selWhere += " AND ";
                    }
                    selWhere += util.format(" n.ownjid= %s",this.sequelize[uuid]["globalsns"].escape(jid));
                }else{
                    log.connectionLog(7," codimd.db_store.getNote jid is invalid.");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }
                log.connectionLog(7," codimd.db_store.getNote  sql:" + sqlbase + " WHERE " + selWhere);
                this.sequelize[uuid]["globalsns"].query(sqlbase + " WHERE " + selWhere,{raw:true})
                    .then((res) => {
                        if(res.length){
                            log.connectionLog(7," codimd.db_store.getNote  note_store success:"+ JSON.stringify(res[0]));
                            resolve({
                                result:true,
                                data:res[0]
                            });
                        }else{
                            log.connectionLog(7," codimd.db_store.getNote  note_store db responce invalid");
                            reject({
                                result:false,
                                data:[]
                            });
                        }
                        return;
                    });
            }catch(e){
                log.connectionLog(2," codimd.db_store.getNoteList( catch. " + e);
                reject({
                    result:false,
                    data:[]
                });
                return;
            }
        });
    }

    /**
     * threadrootidのnotoの情報を取得
     *
     * @param uuid,
     * @param jid,
     * @param note_url,
     * @param  thread_root_id
     *
     * @return 指定ThreadRootIdのレコードの値を返す
     */
    getNoteFromThreadRootId(uuid, jid, threadRootId){
        return new Promise((resolve, reject)=>{
            try{
                if(! jid ){
                    log.connectionLog(2," codimd.db_store.js getNoteFromThreadRootId jid invalid.");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }
                if(! threadRootId ){
                    log.connectionLog(2," codimd.db_store.js getNoteFromThreadRootId threadRootId invalid.");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.getNoteFromThreadRootId  sequelize is invalid");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.getNoteFromThreadRootId  sequelize is ok");
                }
                const sqlbase = "SELECT "
                              + "   n.note_title,"
                              + "   n.note_url,"
                              + "   p.msgtype,"
                              + "   n.thread_root_id,"
                              + "  CASE"
                              + "   WHEN p.msgtype = 3 THEN p.msgto"
                              + "   WHEN p.msgtype = 5 THEN p.msgto"
                              + "   ELSE ''"
                              + "  END AS room_id,"
                              + "  CASE"
                              + "   WHEN p.msgtype = 2 THEN (SELECT nickname  FROM user_profile WHERE jid=p.msgto limit 1)"
                              + "   WHEN p.msgtype = 3 THEN (SELECT room_name FROM chatroom_store WHERE room_id=p.msgto)"
                              + "   WHEN p.msgtype = 5 THEN (SELECT room_name FROM community_store WHERE room_id=p.msgto)"
                              + "   ELSE ''"
                              + "  END AS room_name,"
                              + "   n.ownjid,"
                              + "   n.created_at,"
                              + "   n.updated_at"
                              + " FROM"
                              + "  note_store AS n"
                              + "  LEFT OUTER JOIN publicmessage_store AS p ON n.thread_root_id = p.item_id "
                ;
                let selWhere = util.format(" n.thread_root_id= %s",this.sequelize[uuid]["globalsns"].escape(threadRootId));
                if(jid){
                    if(selWhere){
                        selWhere += " AND ";
                    }
                    selWhere += util.format(" n.ownjid= %s",this.sequelize[uuid]["globalsns"].escape(jid));
                }else{
                    log.connectionLog(7," codimd.db_store.getNoteFromThreadRootId jid is invalid.");
                    reject({
                        result:false,
                        data:[]
                    });
                    return;
                }
                log.connectionLog(7," codimd.db_store.getNoteFromThreadRootId  sql:" + sqlbase + " WHERE " + selWhere);
                this.sequelize[uuid]["globalsns"].query(sqlbase + " WHERE " + selWhere,{raw:true})
                    .then((res) => {
                        if(res.length){
                            log.connectionLog(7," codimd.db_store.getNoteFromThreadRootId  note_store success:"+ JSON.stringify(res[0]));
                            resolve({
                                result:true,
                                data:res[0]
                            });
                        }else{
                            log.connectionLog(7," codimd.db_store.getNoteFromThreadRootId  note_store db responce invalid");
                            reject({
                                result:false,
                                data:[]
                            });
                        }
                        return;
                    });
            }catch(e){
                log.connectionLog(2," codimd.db_store.getNoteList( catch. " + e);
                reject({
                    result:false,
                    data:[]
                });
                return;
            }
        });
    }

    /**
     * notoの情報テーブルに
     * thread_root_idの値を設定する。
     * thread_root_idに値が既に設定されていれば一旦空「''」を設定すればthread_root_idを変更できる
     *
     * @param uuid,
     * @param jid,
     * @param note_url,
     * @param  thread_root_id
     *
     * @return 変更後のレコードの値を返す
     */
    joinNoteToCubeeMesssage(uuid, jid, note_url, thread_root_id){
        return new Promise((resolve, reject)=>{
            try{
                if(! jid ){
                    log.connectionLog(2," codimd.db_store.js.joinNoteToCubeeMesssage jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(note_url == undefined ||
                   note_url == null){
                    log.connectionLog(2," codimd.db_store.js.joinNoteToCubeeMesssage note_url invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(thread_root_id == undefined ||
                   thread_root_id == null){
                    log.connectionLog(2," codimd.db_store.js.joinNoteToCubeeMesssage thread_root_id invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(note_url == "" && thread_root_id == ""){
                    log.connectionLog(2," codimd.db_store.js.joinNoteToCubeeMesssage note_url and thread_root_id is empty.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.joinNoteToCubeeMesssage  sequelize is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.joinNoteToCubeeMesssage  sequelize is ok");
                }
                if(note_url != ""){
                    this.getNote(uuid, jid, note_url).then((selectres)=>{
                        if(selectres.result &&
                           typeof selectres.data[0] == "object"){
                            let sql = "";
                            const sqlbase = "UPDATE "
                                          + "   note_store "
                                          + " SET"
                                          + "   thread_root_id=%s,"
                                          + "   updated_at=now()"
                                          + " WHERE"
                                          + "   note_url=%s"
                                          + "  AND"
                                          + "   ownjid=%s"
                                          + "  AND"
                                          + "   (CASE"
                                          + "     WHEN %s=''  THEN thread_root_id!=''"
                                          + "     WHEN %s!='' THEN thread_root_id =''"
                                          + "                    AND"
                                          + "                      EXISTS (SELECT 1 FROM publicmessage_store WHERE thread_root_id=%s )"
                                          + "                    AND"
                                          + "                      NOT EXISTS (SELECT 1 FROM note_store WHERE thread_root_id=%s )"
                                          + "     ELSE ''!=''"
                                          + "   END)"
                                          + "  RETURNING"
                                          + "    note_title,"
                                          + "    note_url,"
                                          + "    thread_root_id,"
                                          + "    ownjid,"
                                          + "    created_at,"
                                          + "    updated_at,"
                                          + "    (SELECT p.msgto FROM publicmessage_store as p WHERE p.item_id = %s limit 1) AS room_id"
                            ;
                            sql = util.format(sqlbase,
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id),
                                              this.sequelize[uuid]["globalsns"].escape(note_url),
                                              this.sequelize[uuid]["globalsns"].escape(jid),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id)
                            );
                            log.connectionLog(7," codimd.db_store.joinNoteToCubeeMesssage  sql:" + sql);
                            this.sequelize[uuid]["globalsns"].query(sql,{raw:true})
                                .then((res) => {
                                    if(res.length && res[1].rowCount && res[1].rowCount > 0){
                                        log.connectionLog(7," codimd.db_store.joinNoteToCubeeMesssage note_store success:"+ JSON.stringify(res[0]));
                                        resolve({
                                            result:true,
                                            reason: Const.API_STATUS.SUCCESS,
                                            data:{
                                                note_title: res[0][0].note_title,
                                                note_url: res[0][0].note_url,
                                                thread_root_id: res[0][0].thread_root_id,
                                                old_thread_root_id: selectres.data[0].thread_root_id,
                                                room_id: res[0][0].room_id,
                                                ownjid: res[0][0].ownjid,
                                                created_at: res[0][0].created_at,
                                                updated_at: res[0][0].updated_at
                                            }
                                        });
                                    }else{
                                        log.connectionLog(5," codimd.db_store.joinNoteToCubeeMesssage note_store db responce invalid"+ JSON.stringify(res));
                                        reject({
                                            result:false,
                                            reason: Const.API_STATUS.NOT_FOUND
                                        });
                                    }
                                    return;
                                });
                        }else{
                            log.connectionLog(2," codimd.db_store.joinNoteToCubeeMesssage  note_store not found update urlpath. urlpath:"
                                              + note_url + ", selectres:" + JSON.stringify(selectres));
                            reject({
                                result:false,
                                reason: Const.API_STATUS.NOT_FOUND
                            });
                            return;
                        }
                    }).catch((selecterr)=>{
                        log.connectionLog(2," codimd.db_store.joinNoteToCubeeMesssage  note_store urlpath select err:" + selecterr);
                        reject({
                            result:false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                        });
                        return;
                    });
                }else{
                    //note_urlが空の時のSQL実行(指定のthreadRootId紐付け解除)
                    this.getNoteFromThreadRootId(uuid, jid, thread_root_id).then((selectres)=>{
                        if(selectres.result &&
                           typeof selectres.data[0] == "object"){
                            let sql = "";
                            const sqlbase = "UPDATE "
                                          + "   note_store "
                                          + " SET"
                                          + "   thread_root_id='',"
                                          + "   updated_at=now()"
                                          + " WHERE"
                                          + "   ownjid=%s"
                                          + "  AND"
                                          + "   (CASE"
                                          + "     WHEN %s=''  THEN TRUE"
                                          + "     WHEN %s!='' THEN EXISTS (SELECT 1 FROM publicmessage_store WHERE thread_root_id=%s )"
                                          + "     ELSE FALSE"
                                          + "   END)"
                                          + "  AND"
                                          + "   thread_root_id=%s"
                                          + "  RETURNING"
                                          + "    note_title,"
                                          + "    note_url,"
                                          + "    thread_root_id,"
                                          + "    ownjid,"
                                          + "    created_at,"
                                          + "    updated_at,"
                                          + "    (SELECT '') AS room_id"
                            ;
                            sql = util.format(sqlbase,
                                              this.sequelize[uuid]["globalsns"].escape(jid),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id),
                                              this.sequelize[uuid]["globalsns"].escape(thread_root_id)
                            );
                            log.connectionLog(7," codimd.db_store.joinNoteToCubeeMesssage  sql:" + sql);
                            this.sequelize[uuid]["globalsns"].query(sql,{raw:true})
                                .then((res) => {
                                    if(res.length && res[1].rowCount && res[1].rowCount > 0){
                                        log.connectionLog(7," codimd.db_store.joinNoteToCubeeMesssage note_store success:"+ JSON.stringify(res[0]));
                                        resolve({
                                            result:true,
                                            reason: Const.API_STATUS.SUCCESS,
                                            data:{
                                                note_title: res[0][0].note_title,
                                                note_url: res[0][0].note_url,
                                                thread_root_id: res[0][0].thread_root_id,
                                                old_thread_root_id: selectres.data[0].thread_root_id,
                                                room_id: res[0][0].room_id,
                                                ownjid: res[0][0].ownjid,
                                                created_at: res[0][0].created_at,
                                                updated_at: res[0][0].updated_at
                                            }
                                        });
                                    }else{
                                        log.connectionLog(5," codimd.db_store.joinNoteToCubeeMesssage note_store db responce invalid"+ JSON.stringify(res));
                                        reject({
                                            result:false,
                                            reason: Const.API_STATUS.NOT_FOUND
                                        });
                                    }
                                    return;
                                });
                        }else{
                            log.connectionLog(2," codimd.db_store.joinNoteToCubeeMesssage  note_store not found update urlpath. urlpath:"
                                              + note_url + ", selectres:" + JSON.stringify(selectres));
                            reject({
                                result:false,
                                reason: Const.API_STATUS.NOT_FOUND
                            });
                            return;
                        }
                    }).catch((selecterr)=>{
                        log.connectionLog(2," codimd.db_store.joinNoteToCubeeMesssage  note_store urlpath select err:" + selecterr);
                        reject({
                            result:false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                        });
                        return;
                    });
                }
            }catch(e){
                log.connectionLog(2," codimd.db_store.joinNoteToCubeeMesssage try catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * noteにjidのアカントがあるか、登録中かを返却する
     * noteのCubee側でアカウント情報テーブルを持ち
     * アカントの二重登録を制御する。
     *
     * @param uuid,
     * @param jid
     *
     * @return 変更後のレコードの値を返す
     */
    getAccountStatus(uuid, jid){
        return new Promise((resolve, reject)=>{
            try{
                if(! jid ){
                    log.connectionLog(2," codimd.db_store.js.getAccountStatus jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.getAccountStatus  sequelize is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.getAccountStatus  sequelize is ok");
                }
                //***
                const sqlbase = "SELECT status FROM note_account_store WHERE jid = %s ";
                let sql = util.format(sqlbase,
                                      this.sequelize[uuid]["globalsns"].escape(jid)
                );
                this.sequelize[uuid]["globalsns"].query(sql)
                    .then((res) => {
                        log.connectionLog(7," codimd.db_store.getAccountStatus succsess sql:" + sql);
                        log.connectionLog(7," codimd.db_store.getAccountStatus succsess res:" + JSON.stringify(res));
                        if(res.length){
                            resolve({
                                result: true,
                                reason: Const.API_STATUS.SUCCESS,
                                status: (res[0].status ? res[0].status : 0),
                                data: res
                            });
                        }else{
                            log.connectionLog(2," codimd.db_store.getAccountStatus responce data error");
                            reject({
                                result: false,
                                reason: Const.API_STATUS.NOT_FOUND,
                                status: 0,
                                data: res
                            });
                        }
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," codimd.db_store.getAccountStatus error:" + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.NOT_FOUND,
                            data: err
                        });
                        return;
                    });
                //***
            }catch(e){
                log.connectionLog(2," codimd.db_store.getAccountStatus try catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * noteにjidのアカントがあるか、登録中かを返却する
     * noteのCubee側でアカウント情報テーブルを持ち
     * アカントの二重登録を制御する。
     *
     * @param uuid,
     * @param jid
     *
     * @return 変更後のレコードの値を返す
     */
    setAccountStatus(uuid, jid, status){
        return new Promise((resolve, reject)=>{
            try{
                if(! jid ){
                    log.connectionLog(2," codimd.db_store.js.setAccountStatus jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(status == undefined ||
                   status == null ||
                   typeof status != 'number'){
                    log.connectionLog(2," codimd.db_store.js.setAccountStatus status invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.setAccountStatus  sequelize is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.setAccountStatus  sequelize is ok");
                }
                //***
                const sqlbase = "INSERT INTO note_account_store"
                            + "  (jid, status, created_at, updated_at) VALUES"
                            + "  (%s , %s    , now()     , now() )"
                            + " ON CONFLICT (jid)"
                            + " DO UPDATE SET"
                            + "  status = %s, updated_at = now()";
                let sql = util.format(sqlbase,
                                      this.sequelize[uuid]["globalsns"].escape(jid),
                                      this.sequelize[uuid]["globalsns"].escape(status),
                                      this.sequelize[uuid]["globalsns"].escape(status)
                );
                this.sequelize[uuid]["globalsns"].query(sql)
                    .then((res) => {
                        log.connectionLog(7," codimd.db_store.setAccountStatus succsess:" + JSON.stringify(res));
                        resolve({
                            result:true,
                            reason: Const.API_STATUS.SUCCESS,
                            data:res
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," codimd.db_store.setAccountStatus error:" + err);
                        reject({
                            result:false,
                            reason: Const.API_STATUS.BAD_REQUEST,
                            data:err
                        });
                        return;
                    });
                //***
            }catch(e){
                log.connectionLog(2," codimd.db_store.setAccountStatus try catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * notoの情報テーブルのtitleを変更する。
     *
     * @param uuid,
     * @param jid,
     * @param note_url,
     * @param title
     *
     * @return 変更後のレコードの値を返す
     */
    renameNoteOnCubee(uuid, jid, note_url, title){
        log.connectionLog(7,"do func codimd.db_store.js.renameNoteOnCubee(");
        return new Promise((resolve, reject)=>{
            try{
                if(! jid ){
                    log.connectionLog(2," codimd.db_store.js.renameNoteOnCubee jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(note_url == undefined ||
                   note_url == null ||
                   note_url == ""){
                    log.connectionLog(2," codimd.db_store.js.renameNoteOnCubee note_url invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(title == undefined ||
                   title == null ||
                   title == ""){
                    log.connectionLog(2," codimd.db_store.js.renameNoteOnCubee title invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.sequelize||
                   ! this.sequelize[uuid] ||
                   ! this.sequelize[uuid]["globalsns"]){
                    log.connectionLog(1," codimd.db_store.renameNoteOnCubee  sequelize is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }else{
                    log.connectionLog(7," codimd.db_store.renameNoteOnCubee  sequelize is ok");
                }
                this.getNote(uuid, jid, note_url).then((selectres)=>{
                    if(selectres.result &&
                       typeof selectres.data[0] == "object"){
                        let sql = "";
                        const sqlbase = "UPDATE "
                                      + "   note_store "
                                      + " SET"
                                      + "   note_title=%s,"
                                      + "   updated_at=now()"
                                      + " WHERE"
                                      + "   note_url=%s"
                                      + "  AND"
                                      + "   ownjid=%s"
                                      + "  RETURNING"
                                      + "    note_title,"
                                      + "    note_url,"
                                      + "    thread_root_id,"
                                      + "    ownjid,"
                                      + "    created_at,"
                                      + "    updated_at,"
                                      + "    (SELECT p.msgto FROM publicmessage_store as p WHERE p.item_id = note_store.thread_root_id limit 1) AS room_id"
                        ;
                        sql = util.format(sqlbase,
                                          this.sequelize[uuid]["globalsns"].escape(title),
                                          this.sequelize[uuid]["globalsns"].escape(note_url),
                                          this.sequelize[uuid]["globalsns"].escape(jid)
                        );
                        log.connectionLog(7," codimd.db_store.renameNoteOnCubee  sql:" + sql);
                        this.sequelize[uuid]["globalsns"].query(sql,{raw:true})
                            .then((res) => {
                                if(res.length && res[1].rowCount && res[1].rowCount > 0){
                                    log.connectionLog(7," codimd.db_store.renameNoteOnCubee note_store success:"+ JSON.stringify(res[0]));
                                    resolve({
                                        result:true,
                                        reason: Const.API_STATUS.SUCCESS,
                                        data:{
                                            note_title: res[0][0].note_title,
                                            note_url: res[0][0].note_url,
                                            thread_root_id: res[0][0].thread_root_id,
                                            room_id: res[0][0].room_id,
                                            ownjid: res[0][0].ownjid,
                                            created_at: res[0][0].created_at,
                                            updated_at: res[0][0].updated_at
                                        }
                                    });
                                }else{
                                    log.connectionLog(5," codimd.db_store.renameNoteOnCubee note_store db responce invalid"+ JSON.stringify(res));
                                    reject({
                                        result:false,
                                        reason: Const.API_STATUS.NOT_FOUND
                                    });
                                }
                                return;
                            });
                    }else{
                        log.connectionLog(2," codimd.db_store.renameNoteOnCubee  note_store not found update urlpath. urlpath:"
                                          + note_url + ", selectres:" + JSON.stringify(selectres));
                        reject({
                            result:false,
                            reason: Const.API_STATUS.NOT_FOUND
                        });
                        return;
                    }
                }).catch((selecterr)=>{
                    log.connectionLog(2," codimd.db_store.renameNoteOnCubee  note_store urlpath select err:" + selecterr);
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                });
            }catch(e){
                log.connectionLog(2," codimd.db_store.renameNoteOnCubee try catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

};
