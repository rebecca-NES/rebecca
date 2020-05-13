const log = require("../../server_log").getInstance();
const util = require('util');
const Const = require("../../const");

module.exports = class PublicGroupDbStore {

    /**
     * コンストラクター
     *
     * @param db_store globalSnsDBのインスタンス
     * @param tenant_uuid テナントUUID
     * @return このクラスのインスタンス
     */
    constructor (db_store, tenant_uuid) {
        log.connectionLog(7,"do func groupchat.public.dbif.constructor(...");
        const db_connect = db_store.getDBConnect();
        if(db_connect ||
           db_connect[tenant_uuid] ||
           db_connect[tenant_uuid]["globalsns"]){
            this.globalsns_connect = db_connect[tenant_uuid]["globalsns"];
        }
    }

    /**
     *公開ルームのリストを取得
     *
     * @param startId 検索開始ID
     * @param count 検索取得数
     */
    getRoomList(startId, count){
        log.connectionLog(7,"do func groupchat.public.dbif.getRoomList(...");
        return new Promise((resolve, reject)=>{
            try{
                if(startId != null && (typeof startId != 'number' || startId < 0)){
                    log.connectionLog(1," groupchat.public.dbif.js.getRoomList startId is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }
                if(count != null && (typeof count != 'number' || count < 0)){
                    log.connectionLog(1," groupchat.public.dbif.js.getRoomList count is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," groupchat.public.dbif.js.getRoomList globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," groupchat.public.dbif.js.getRoomList  sequelize is ok");
                }
                const sqlbase = "SELECT cs.*,"
                          + "   (SELECT array_agg(jid) FROM chatroom_member_store WHERE state=1 AND room_id=cs.room_id) AS members"
                          + "  FROM"
                          + "   chatroom_store AS cs"
                          + "  WHERE"
                          + "   cs.delete_flag=0 AND cs.privacy_type=0"
                          + "  ORDER BY updated_at DESC, created_at DESC";
                let sql = util.format(sqlbase);
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        let items = [];
                        let isList = false;
                        for(let i=0;i<res[0].length;i++){
                            if(startId == null || startId == 0){
                                isList = true;
                            }
                            // The value assigned to isList here is unused.
                            if(typeof count == 'number' && items.length >= count){
                                // isList = false;
                                break;
                            }
                            if(isList){
                                items.push({
                                    "id": parseInt(res[0][i].id),
                                    "roomId": res[0][i].room_id,
                                    "roomName": res[0][i].room_name,
                                    "parentRoomId": res[0][i].parent_room_id,
                                    "privacyType": parseInt(res[0][i].privacy_type),
                                    "memberCount": res[0][i].members == null ? 0 : res[0][i].members.length,
                                    "memberItems": res[0][i].members == null ? [] : res[0][i].members,
                                    "notifyType": parseInt(res[0][i].notify_type),
                                    "createdAt": res[0][i].created_at,
                                    "createdBy": res[0][i].created_by,
                                    "updatedAt": res[0][i].updated_at,
                                    "updatedBy": res[0][i].updated_by
                                });
                            }
                            if(startId == res[0][i].id){
                                isList = true;
                            }
                        }
                        resolve({
                            result: true,
                            reason: Const.API_STATUS.SUCCESS,
                            extras: {},
                            count: items.length,
                            items: items
                        });
                        return;
                    }).catch((err_sel)=>{
                        log.connectionLog(4," groupchat.public.dbif.js.getRoomList sel:" + err_sel);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," groupchat.public.dbif.js.getRoomList( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }
};

