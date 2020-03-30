const log = require("../server_log").getInstance();
const util = require('util');
const Const = require("../const");

/**
 * つぶやきのDB操作クラス
 */
module.exports = class MurmurDbStore {

    /**
     * コンストラクター
     *
     * @param db_store globalSnsDBのインスタンス
     * @param tenant_uuid テナントUUID
     * @return このクラスのインスタンス
     */
    constructor (db_store, tenant_uuid) {
        log.connectionLog(7,"do func murmur.dbif.constructor(...");
        const db_connect = db_store.getDBConnect();
        if(db_connect ||
           db_connect[tenant_uuid] ||
           db_connect[tenant_uuid]["globalsns"]){
            this.globalsns_connect = db_connect[tenant_uuid]["globalsns"];
        }
    }

    /**
     * フォローの状態（フォローされている人数、フォローしている人数）を取得
     *
     * @param jid 状態を取得するユーザーのJID
     */
    getColumnName(jid){
        log.connectionLog(7,"do func murmur.dbif.getColumnName(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! jid){
                    log.connectionLog(2," murmur.dbif.getColumnName jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," murmur.dbif.js.getColumnName globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," murmur.dbif.js.getColumnName  sequelize is ok");
                }
                const sqlbase = "SELECT"
                              + " *"
                              + "   FROM murmur_store AS ms"
                              + "   WHERE own_jid=%s";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(jid));
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        log.connectionLog(7," murmur.dbif.js.getColumnName db res:" + JSON.stringify(res));
                        resolve(
                            {
                                result: true,
                                reason: Const.API_STATUS.SUCCESS,
                                own_jid: jid,
                                column_name: res[0].length ? res[0][0].column_name : ''
                            });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," murmur.dbif.js.getColumnName sql catch. err:" + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," murmur.dbif.js.getColumnName( catch. e:" + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * つぶやきカラムのカラム名を設定
     *
     * @param jid つぶやきカラムの所有者JID
     * @param roomName 登録カラム名
     */
    setColumnName(jid, roomName){
        log.connectionLog(7,"do func murmur.dbif.setColumnName(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! jid){
                    log.connectionLog(2," murmur.dbif.setColumnName jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(typeof roomName !== 'string'){
                    log.connectionLog(2," murmur.dbif.setColumnName roomName invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," murmur.dbif.js.setColumnName globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," murmur.dbif.js.setColumnName  sequelize is ok");
                }
                const sqlbase = "INSERT INTO murmur_store"
                              + "  (own_jid, column_name, created_at)"
                              + " VALUES (%s, %s, now())"
                              + " ON CONFLICT (own_jid)"
                              + "  DO UPDATE SET"
                              + "      column_name = %s,"
                              + "      updated_at=now()"
                              + "  RETURNING own_jid, column_name, created_at, updated_at";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(jid),
                                      this.globalsns_connect.escape(roomName),
                                      this.globalsns_connect.escape(roomName));
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        const sqlbase2 = "SELECT id, jid, name, nickname, presence,"
                                       + "   photo_type,"
                                       + "   photo_data,"
                                       + "   affiliation"
                                       + " FROM user_profile"
                                       + "   WHERE jid=%s";
                        let sql2 = util.format(sqlbase2,
                                               this.globalsns_connect.escape(jid));
                        this.globalsns_connect.query(sql2).then((res2)=>{
                            try{
                                let personInfo = {};
                                for(let i=0;i<res2[0].length;i++){
                                    personInfo[res2[0][i].jid] = {
                                        nickName: res2[0][i].nickname,
                                        avatarData: res2[0][i].photo_data,
                                        avatarType: res2[0][i].photo_type,
                                        status: res2[0][i].presence,
                                        userName: res2[0][i].name,
                                        group: res2[0][i].affiliation != null ? JSON.parse(res2[0][i].affiliation) : []
                                    };
                                }
                                const sql3 = "SELECT ARRAY("
                                           + "  SELECT login_account"
                                           + "   FROM user_account_store"
                                           + "   WHERE delete_flg=0 AND login_account!='admin') AS noify_uids";
                                this.globalsns_connect.query(sql3).then((res3)=>{
                                    resolve({
                                        result: true,
                                        reason: Const.API_STATUS.SUCCESS,
                                        own_jid: res[0][0].own_jid,
                                        column_name: res[0][0].column_name,
                                        person_info: personInfo,
                                        noify_uids: res3[0][0].noify_uids
                                    });
                                    return;
                                }).catch((err3)=>{
                                    log.connectionLog(3," murmur.dbif.js.setColumnName for get notifer user err3:" + JSON.stringify(err3));
                                    reject({
                                        result: false,
                                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                    });
                                    return;
                                });
                            }catch(e){
                                log.connectionLog(2," murmur.dbif.js.setColumnName maybe JSON.parse error:" + e);
                                reject({
                                    result: false,
                                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                });
                                return;
                            }
                        }).catch((err2)=>{
                            log.connectionLog(3," murmur.dbif.js.setColumnName for user_profile:" + JSON.stringify(err2));
                            reject({
                                result: false,
                                reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                            });
                            return;
                        });
                    }).catch((err)=>{
                        log.connectionLog(4," murmur.dbif.js.setColumnName:" + JSON.stringify(err));
                        if(err.name == 'SequelizeUniqueConstraintError'){
                            reject({
                                result: false,
                                reason: Const.API_STATUS.BAD_REQUEST,
                                mess: 'DataExists'
                            });
                            return;
                        }
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," murmur.dbif.js.setColumnName( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }
};

