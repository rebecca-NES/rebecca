const log = require("../../../server_log").getInstance();
const util = require('util');
const Const = require("../../../const");
const Utils = require("../../../../utils");

const CommunityMember ={
    STATE_NOT_JOIN: 0,
    STATE_JOIN: 1,
    STATE_LEAVE: 2,//自分自身で退会した記録
    STATE_FORCE_LEAVE: 3//管理者が退会した記録
};

/**
 * 公開CommunityのDB操作クラス
 */
module.exports = class PublicCommunityMemberDbStore {

    /**
     * コンストラクター
     *
     * @param db_store globalSnsDBのインスタンス
     * @param tenant_uuid テナントUUID
     * @return このクラスのインスタンス
     */
    constructor (db_store, tenant_uuid) {
        log.connectionLog(7,"do func community.public.member.dbif.constructor(...");
        const db_connect = db_store.getDBConnect();
        if(db_connect ||
           db_connect[tenant_uuid] ||
           db_connect[tenant_uuid]["globalsns"]){
            this.globalsns_connect = db_connect[tenant_uuid]["globalsns"];
        }
    }

    /**
     * ルームに参加
     *
     * @param roomId ルームID
     * @param jid 追加ユーザーのJID
     * @param role 設定ロール(1=閲覧のみ、投稿／閲覧, 2=管理者)
     * @return Promise
     */
    joining(roomId, jid, role){
        log.connectionLog(7,"do func community.public.member.dbif.joining(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! roomId){
                    log.connectionLog(2," community.public.member.dbif.joining roomId invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! jid){
                    log.connectionLog(2," community.public.member.dbif.joining jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! role || (role != 1  && role != 2)){
                    log.connectionLog(2," community.public.member.dbif.joining role invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," community.public.member.dbif.js.joining globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," community.public.member.dbif.js.joining  sequelize is ok");
                }
                const sqlbase_sel = "SELECT cs.privacy_type, cs.delete_flag, cms2.state"
                                  + "  FROM"
                                  + "   community_store AS cs "
                                  + "   LEFT JOIN (SELECT * FROM community_member_store AS cms WHERE cms.jid=%s) AS cms2 ON cs.room_id=cms2.room_id"
                                  + "  WHERE"
                                  + "   cs.room_id=%s";
                let sql_sel = util.format(sqlbase_sel,
                                          this.globalsns_connect.escape(jid),
                                          this.globalsns_connect.escape(roomId));
                let isAccountNew = true;
                this.globalsns_connect.query(sql_sel)
                    .then((res_sel) => {
                        if(res_sel[1].rowCount == 0 ||
                           res_sel[1].rows[0].privacy_type != 0 ||
                           res_sel[1].rows[0].delete_flag != 0){
                            log.connectionLog(4," community.public.member.dbif.js.joining not found room sql_sel:"
                                              + sql_sel);
                            reject({
                                result: false,
                                reason: Const.API_STATUS.BAD_REQUEST,
                                mess: 'NotFoundPublicRoom',
                            });
                            return;
                        }
                        if(res_sel && res_sel[1] && res_sel[1].rows &&
                           res_sel[1].rows[0] &&
                           typeof res_sel[1].rows[0].state == 'number'){
                            if(res_sel[1].rows[0].privacy_type == 0 &&
                               res_sel[1].rows[0].delete_flag == 0){
                                isAccountNew = false;
                            }else{
                                log.connectionLog(4," community.public.member.dbif.js.joining NotPublicRoom:"
                                                  + roomId + ", "
                                                  + JSON.stringify(res_sel[1].rows));
                                reject({
                                    result: false,
                                    reason: Const.API_STATUS.BAD_REQUEST,
                                    mess: 'NotFoundPublicRoom',
                                });
                                return;
                            }
                        }
                        let oldMembertype = res_sel[1].rows[0] && res_sel[1].rows[0].state ?
                                            res_sel[1].rows[0].state :
                                            CommunityMember.STATE_NOT_JOIN;

                        //権限：投稿/閲覧
                        let sql;
                        if(isAccountNew){
                            const sqlbase = "INSERT INTO community_member_store"
                                          + "  (room_id, jid, state, role, join_date)"
                                          + " VALUES (%s, %s, " + CommunityMember.STATE_JOIN + ", %s, now())";
                            sql = util.format(sqlbase,
                                              this.globalsns_connect.escape(roomId),
                                              this.globalsns_connect.escape(jid), role);
                        }else{
                            const sqlbase = "UPDATE community_member_store"
                                          + "  SET state=" + CommunityMember.STATE_JOIN + ", role=%s, join_date=now()"
                                          + "  WHERE room_id=%s AND jid=%s";
                            sql = util.format(sqlbase,
                                              role,
                                              this.globalsns_connect.escape(roomId),
                                              this.globalsns_connect.escape(jid));
                        }
                        this.globalsns_connect.query(sql)
                            .then((res) => {
                                const sqlbase = "UPDATE community_store SET updated_at=now(),updated_by=%s WHERE room_id=%s";
                                let update_sql = util.format(sqlbase,
                                                             this.globalsns_connect.escape(jid),
                                                             this.globalsns_connect.escape(roomId));
                                this.globalsns_connect.query(update_sql).then((res)=>{
                                    this.getRoomInfo(jid, roomId).then((res_ri)=>{
                                        //CommunityMember.STATE_JOIN が state に設定されている状態で更新された時 update
                                        res_ri.joinType = oldMembertype != CommunityMember.STATE_JOIN ? 'new' : 'update';
                                        resolve(res_ri);
                                        return;
                                    }).catch((err_ri)=>{
                                        log.connectionLog(3," community.public.member.dbif.js.joining 1:" + err_ri);
                                        reject({
                                            result: false,
                                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                        });
                                        return;
                                    });
                                }).catch((err)=>{
                                    log.connectionLog(3," community.public.member.dbif.js.joining 2:" + err);
                                    reject({
                                        result: false,
                                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                    });
                                    return;
                                });
                            }).catch((err)=>{
                                log.connectionLog(3," community.public.member.dbif.js.joining 3:" + err);
                                reject({
                                    result: false,
                                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                });
                                return;
                            });
                    }).catch((err_sel)=>{
                        log.connectionLog(4," community.public.member.dbif.js.joining sel:" + err_sel);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," community.public.member.dbif.js.joining( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * ルームに情報取得     *
     * @param jid 追加ユーザーのJID
     * @param roomId ルームID
     * @return Promise
     */
    getRoomInfo(jid, roomId){
        log.connectionLog(7,"do func community.public.member.dbif.getRoomInfo(...");
        return new Promise((resolve, reject)=>{
            const sqlbase_sel2 = "SELECT cms2.*,cs.*"
                               + "    "
                               + "  FROM"
                               + "   community_store AS cs LEFT JOIN"
                               + "   ("
                               + "      SELECT"
                               + "        cms.room_id, cms.jid, cms.state, cms.role, cms.join_date, cms.leave_date,"
                               + "        up.nickname, up.photo_type, up.photo_data, ua.login_account"
                               + "      FROM community_member_store AS cms, user_profile AS up, user_account_store AS ua"
                               + "      WHERE cms.state=1"
                               + "        AND cms.jid=up.jid AND cms.jid=ua.openfire_account || '@' || ua.xmpp_server_name AND up.delete_flg=0"
                               + "   ) AS cms2 ON cs.room_id=cms2.room_id"
                               + "  WHERE"
                               + "   cs.room_id=%s";
            let sql_sel2 = util.format(sqlbase_sel2,
                                       this.globalsns_connect.escape(roomId));
            this.globalsns_connect.query(sql_sel2)
                .then((res_sel2) => {
                    let member = [];
                    let personInfo = {};
                    for(let i=0;i<res_sel2[0].length;i++){
                        personInfo[res_sel2[0][i].jid] = {
                            "nickName": res_sel2[0][i].nickname,
                            "avatarData": res_sel2[0][i].photo_data,
                            "avatarType": res_sel2[0][i].photo_type,
                            "status": CommunityMember.STATE_JOIN == res_sel2[0][i].state ? 0 : 1,
                            "userName": res_sel2[0][i].login_account,
                            "role": res_sel2[0][i].role,
                        };
                    }
                    resolve({
                        result: true,
                        reason: Const.API_STATUS.SUCCESS,
                        extras: {},
                        count: 1,
                        items: [{
                            "id": res_sel2[0][0].id,
                            "roomId": res_sel2[0][0].room_id,
                            "roomName": res_sel2[0][0].room_name,
                            "description": res_sel2[0][0].description,
                            "privacyType": res_sel2[0][0].privacy_type,
                            "addedBy": jid,
                            "count": member.length,
                            "members": member,
                            "notifyType": res_sel2[0][0].notify_type,
                            "createdAt" : Utils.formatDate(res_sel2[0][0].created_at),
                            "createdBy" : res_sel2[0][0].created_by ? res_sel2[0][0].created_by : "",
                            "updatedAt" : Utils.formatDate(res_sel2[0][0].updated_at),
                            "updatedBy" : res_sel2[0][0].updated_by ? res_sel2[0][0].updated_by : "",
                            "personInfo": personInfo
                        }]
                    });
                    return;
                }).catch((err_sel2)=>{
                    log.connectionLog(3," community.public.member.dbif.js.getRoomInfo sel2:" + err_sel2);
                    reject({
                        result: false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                    });
                    return;
                });
        });
    }

    /**
     * 退会
     * @param roomId ルームID
     * @param jid 退会ユーザーのJID
     * @return Promise
     */
    leaveMember(roomId, jid){
        log.connectionLog(7,"do func community.public.member.dbif.deleteMember(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! roomId){
                    log.connectionLog(2," community.public.member.dbif.deleteMember roomId invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! jid){
                    log.connectionLog(2," community.public.member.dbif.deleteMember jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," community.public.member.dbif.js.deleteMember globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," community.public.member.dbif.js.deleteMember  sequelize is ok");
                }
                const sqlbase_sel = "UPDATE"
                                  + "   community_member_store AS cms"
                                  + "  SET state=" + CommunityMember.STATE_LEAVE + ", leave_date=now()"
                                  + "  WHERE"
                                  + "   cms.room_id=%s AND cms.jid=%s AND cms.state ="+CommunityMember.STATE_JOIN;
                let sql_sel = util.format(sqlbase_sel,
                                          this.globalsns_connect.escape(roomId),
                                          this.globalsns_connect.escape(jid));
                this.globalsns_connect.query(sql_sel)
                    .then((res) => {
                        resolve({
                            result: true,
                            reason: Const.API_STATUS.SUCCESS,
                            res: res
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(3," community.public.member.dbif.js.deleteMember err:" + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," community.public.member.dbif.js.deleteMember( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * 参加状態更新
     *
     * @param roomId ルームID
     * @param jid 追加ユーザーのJID
     * @param role 設定ロール(1=閲覧のみ、投稿／閲覧, 2=管理者)
     * @return Promise
     */
    updateRole(roomId, jid, role){
        log.connectionLog(7,"do func community.public.member.dbif.updateRole(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! roomId){
                    log.connectionLog(2," community.public.member.dbif.updateRole roomId invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! jid){
                    log.connectionLog(2," community.public.member.dbif.updateRole jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! role || (role != 1  && role != 2)){
                    log.connectionLog(2," community.public.member.dbif.joining role invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," community.public.member.dbif.js.updateRole globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," community.public.member.dbif.js.updateRole  sequelize is ok");
                }
                const sqlbase = "UPDATE community_member_store"
                              + "  SET role=%s, join_date=now()"
                              + "  WHERE room_id=%s AND jid=%s";
                const sql = util.format(sqlbase,
                                        role,
                                        this.globalsns_connect.escape(roomId),
                                        this.globalsns_connect.escape(jid));
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        resolve({
                            result: true,
                            reason: Const.API_STATUS.SUCCESS,
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(3," community.public.member.dbif.js.updateRole:" + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," community.public.member.dbif.js.updateRole( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

};

