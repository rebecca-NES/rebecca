const log = require("../../server_log").getInstance();
const Const = require("../../const");

module.exports = class PublicCommunityDbStore {

    /**
     * コンストラクター
     *
     * @param db_store globalSnsDBのインスタンス
     * @param tenant_uuid テナントUUID
     * @return このクラスのインスタンス
     */
    constructor (db_store, tenant_uuid) {
        log.connectionLog(7,"do func community.public.dbif.constructor(...");
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
        log.connectionLog(7,"do func community.public.dbif.getRoomList(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! this.globalsns_connect){
                    log.connectionLog(1," community.public.dbif.js.getRoomList globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," community.public.dbif.js.getRoomList  sequelize is ok");
                }
                const sql = "SELECT cs.*,"
                          + "   (SELECT array_agg(jid) FROM community_member_store WHERE state=1 AND room_id=cs.room_id) AS members"
                          + "  FROM"
                          + "   community_store AS cs"
                          + "  WHERE"
                          + "   cs.delete_flag=0 AND cs.privacy_type=0"
                          + "  ORDER BY updated_at DESC, created_at DESC";
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        let items = [];
                        let isList = false;
                        for(let i=0;i<res[0].length;i++){
                            if(startId == null || startId == 0){
                                isList = true;
                            }
                            if(typeof count == 'number' && items.length >= count){
                                isList = false;
                                break;
                            }
                            if(isList){
                                items.push({
                                    "id": parseInt(res[0][i].id),
                                    "roomId": res[0][i].room_id,
                                    "roomName": res[0][i].room_name,
                                    "description": res[0][i].description,
                                    "memberCount": res[0][i].members == null ? 0 : res[0][i].members.length,
                                    "memberItems": res[0][i].members == null ? [] : res[0][i].members,
                                    "privacyType": parseInt(res[0][i].privacy_type),
                                    "memberEntryType": res[0][i].member_entry_type,
                                    "logoUrl": res[0][i].logourl,
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
                        log.connectionLog(4," community.public.dbif.js.getRoomList sel:" + err_sel);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," community.public.dbif.js.getRoomList( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }
};

