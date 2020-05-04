const log = require("../server_log").getInstance();
const util = require('util');
const Const = require("../const");

/**
 * ユーザーフォローのDB操作クラス
 */
module.exports = class UserFollowDbStore {

    /**
     * コンストラクター
     *
     * @param db_store globalSnsDBのインスタンス
     * @param tenant_uuid テナントUUID
     * @return このクラスのインスタンス
     */
    constructor (db_store, tenant_uuid) {
        log.connectionLog(7,"do func user_follow.dbif.constructor(...");
        const db_connect = db_store.getDBConnect();
        if(db_connect ||
           db_connect[tenant_uuid] ||
           db_connect[tenant_uuid]["globalsns"]){
            this.globalsns_connect = db_connect[tenant_uuid]["globalsns"];
        }
    }

    /**
     * ユーザーをフォローする
     *
     * @param followeeJid フォローされるユーザーJID
     * @param followerJid フォローするユーザーJID（アクションの主語者）
     */
    addUserFollow(followeeJid, followerJid){
        log.connectionLog(7,"do func user_follow.dbif.addUserFollow(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! followeeJid){
                    log.connectionLog(2," user_follow.dbif.addUserFollow followeeJid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! followerJid){
                    log.connectionLog(2," user_follow.dbif.addUserFollow followerJid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," user_follow.dbif.js.addUserFollow globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," user_follow.dbif.js.addUserFollow  sequelize is ok");
                }
                const sqlbase = "INSERT INTO user_follow_store"
                              + "  (followee, follower, created_at)"
                              + " VALUES (%s, %s, now())";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(followeeJid),
                                      this.globalsns_connect.escape(followerJid));
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        const sqlbase2 = "SELECT id, jid, name, nickname, presence,"
                                       + "   photo_type,"
                                       + "   photo_data,"
                                       + "   affiliation"
                                       + " FROM user_profile"
                                       + "   WHERE jid=%s OR jid=%s";
                        let sql2 = util.format(sqlbase2,
                                               this.globalsns_connect.escape(followeeJid),
                                               this.globalsns_connect.escape(followerJid));
                        this.globalsns_connect.query(sql2).then((res2)=>{
                            try{
                                let personInfo = {};
                                for(let i=0;i<res2[0].length;i++){
                                    personInfo[res2[0][i].jid] = {
                                        nickName: res2[0][i].nickname,
                                        avatarData: res2[0][i].photo_data,
                                        avatarType: res2[0][i].photo_type,
                                        status: res2[0][i].presence,
                                        userName: ((res2[0][i].name.length > 4) ?
                                                   res2[0][i].name.substring(0,res2[0][i].name.length - 4) :
                                                   res2[0][i].name),
                                        group: res2[0][i].affiliation != null ? JSON.parse(res2[0][i].affiliation) : []
                                    };
                                }
                                resolve({
                                    result: true,
                                    reason: Const.API_STATUS.SUCCESS,
                                    personInfo: personInfo
                                });
                                return;
                            }catch(e){
                                log.connectionLog(2," user_follow.dbif.js.addUserFollow maybe JSON.parse error:" + e);
                                reject({
                                    result: false,
                                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                });
                                return;
                            }
                        }).catch((err2)=>{
                            log.connectionLog(3," user_follow.dbif.js.addUserFollow for user_profile:" + JSON.stringify(err2));
                            reject({
                                result: false,
                                reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                            });
                            return;
                        });
                    }).catch((err)=>{
                        log.connectionLog(4," user_follow.dbif.js.addUserFollow:" + JSON.stringify(err));
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
                log.connectionLog(2," user_follow.dbif.js.addUserFollow( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * ユーザーをフォロー解除
     *
     * @param followeeJid フォロー解除されるユーザーJID
     * @param followerJid フォロー解除するユーザーJID（アクションの主語者）
     */
    delUserFollow(followeeJid, followerJid){
        log.connectionLog(7,"do func user_follow.dbif.delUserFollow(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! followeeJid){
                    log.connectionLog(2," user_follow.dbif.delUserFollow followeeJid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! followerJid){
                    log.connectionLog(2," user_follow.dbif.delUserFollow followerJid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," user_follow.dbif.js.delUserFollow globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," user_follow.dbif.js.delUserFollow  sequelize is ok");
                }
                const sqlbase = "DELETE FROM user_follow_store"
                              + "  WHERE followee= %s AND follower=%s";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(followeeJid),
                                      this.globalsns_connect.escape(followerJid));
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        if(res[1] && res[1].rowCount == 1){
                            const sqlbase2 = "SELECT id, jid, name, nickname, presence,"
                                           + "   photo_type,"
                                           + "   photo_data,"
                                           + "   affiliation"
                                           + " FROM user_profile"
                                           + "   WHERE jid=%s OR jid=%s";
                            let sql2 = util.format(sqlbase2,
                                                   this.globalsns_connect.escape(followeeJid),
                                                   this.globalsns_connect.escape(followerJid));
                            this.globalsns_connect.query(sql2).then((res2)=>{
                                try{
                                    let personInfo = {};
                                    for(let i=0;i<res2[0].length;i++){
                                        personInfo[res2[0][i].jid] = {
                                            nickName: res2[0][i].nickname,
                                            avatarData: res2[0][i].photo_data,
                                            avatarType: res2[0][i].photo_type,
                                            status: res2[0][i].presence,
                                            userName: ((res2[0][i].name.length > 4) ?
                                                       res2[0][i].name.substring(0,res2[0][i].name.length - 4) :
                                                       res2[0][i].name),
                                            group: res2[0][i].affiliation != null ? JSON.parse(res2[0][i].affiliation) : []
                                        };
                                    }
                                    resolve({
                                        result: true,
                                        reason: Const.API_STATUS.SUCCESS,
                                        personInfo: personInfo
                                    });
                                    return;
                                }catch(e){
                                    log.connectionLog(2," user_follow.dbif.js.addUserFollow maybe JSON.parse error:" + e);
                                    reject({
                                        result: false,
                                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                    });
                                    return;
                                }
                            }).catch((err2)=>{
                                log.connectionLog(3," user_follow.dbif.js.addUserFollow for user_profile:" + JSON.stringify(err2));
                                reject({
                                    result: false,
                                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                                });
                                return;
                            });
                        }else{
                            log.connectionLog(4," user_follow.dbif.js.delUserFollow:" + JSON.stringify(res));
                            reject({
                                result: false,
                                reason: Const.API_STATUS.BAD_REQUEST,
                                mess: 'DataNotExists'
                            });
                            return;
                        }
                    }).catch((err)=>{
                        log.connectionLog(2," user_follow.dbif.js.delUserFollow sql catch. " + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," user_follow.dbif.js.delUserFollow( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * フォローの状態（フォローされている人数、フォローしている人数）を取得
     *
     * @param jid 状態を取得するユーザーのJID
     */
    getFollowInfo(jid){
        log.connectionLog(7,"do func user_follow.dbif.getFollowInfo(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! jid){
                    log.connectionLog(2," user_follow.dbif.getFollowInfo jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," user_follow.dbif.js.getFollowInfo globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," user_follow.dbif.js.getFollowInfo  sequelize is ok");
                }
                const sqlbase = "SELECT"
                              + " (SELECT count(*)"
                              + "   FROM user_follow_store AS ufs,"
                              + "        (SELECT jid,delete_flg FROM user_profile GROUP BY jid,delete_flg) AS up"
                              + "   WHERE ufs.followee=%s AND delete_flg=0 AND ufs.followee=up.jid) AS \"followerCount\","
                              + " (SELECT count(*)"
                              + "   FROM user_follow_store AS ufs,"
                              + "        (SELECT jid,delete_flg FROM user_profile GROUP BY jid,delete_flg) AS up"
                              + "   WHERE ufs.follower=%s AND delete_flg=0 AND ufs.followee=up.jid) AS \"followeeCount\"";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(jid),
                                      this.globalsns_connect.escape(jid));
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        log.connectionLog(7," user_follow.dbif.js.getFollowInfo db res:" + JSON.stringify(res));
                        resolve(
                            {
                                result: true,
                                reason: Const.API_STATUS.SUCCESS,
                                followeeCount: parseInt(res[0][0].followeeCount),
                                followerCount: parseInt(res[0][0].followerCount)
                            });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," user_follow.dbif.js.getFollowInfo sql catch. err:" + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," user_follow.dbif.js.getFollowInfo( catch. e:" + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * 指定ユーザーがフォローしているリストを取得
     *
     * @param jid フォローしているユーザーのJID(指定ユーザー)
     */
    getFolloweeList(jid){
        log.connectionLog(7,"do func user_follow.dbif.getFolloweeList(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! jid){
                    log.connectionLog(2," user_follow.dbif.getFolloweeList jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," user_follow.dbif.js.getFolloweeList globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," user_follow.dbif.js.getFolloweeList  sequelize is ok");
                }
                const sqlbase = "SELECT"
                              + "  ufs.followee AS jid,"
                              + "  ua.login_account AS name, up.nickname AS \"nickName\", CAST(up.affiliation AS json) AS group,"
                              + "  up.photo_type AS \"avatarType\", up.photo_data AS \"avatarData\","
                              + "  ufs.created_at AS \"createdAt\""
                              + " FROM user_follow_store AS ufs, user_profile AS up, user_account_store AS ua"
                              + "  WHERE ufs.follower=%s AND up.delete_flg=0 AND ufs.followee=up.jid AND"
                              + "    ufs.followee=ua.openfire_account||'@'||ua.xmpp_server_name"
                              + "  ORDER BY ufs.created_at DESC";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(jid));
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        let doubleCheck = {};
                        let userDoubleClean = [];
                        for(let i=0;i<res[0].length;i++){
                            if(doubleCheck[res[0][i].jid]){
                                continue;
                            }
                            // This replaces only the first occurrence of /\+/.
                            // gをつける
                            res[0][i].nickName = res[0][i].nickName.replace(/\+/g,"%20");
                            userDoubleClean.push(res[0][i]);
                            doubleCheck[res[0][i].jid] = true;
                        }
                        resolve({
                            result: true,
                            reason: Const.API_STATUS.SUCCESS,
                            items: userDoubleClean
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," user_follow.dbif.js.getFolloweeList sql catch. " + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," user_follow.dbif.js.getFolloweeList( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }

    /**
     * 指定ユーザーがフォローされているリストを取得
     *
     * @param jid フォローされているユーザーのJID(指定ユーザー)
     */
    getFollowerList(jid){
        log.connectionLog(7,"do func user_follow.dbif.getFollowerList(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! jid){
                    log.connectionLog(2," user_follow.dbif.getFollowerList jid invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," user_follow.dbif.js.getFollowerList globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," user_follow.dbif.js.getFollowerList  sequelize is ok");
                }
                const sqlbase = "SELECT"
                              + "  ufs.follower AS jid,"
                              + "  ua.login_account AS name, up.nickname AS \"nickName\", CAST(up.affiliation AS json) AS group,"
                              + "  up.photo_type AS \"avatarType\", up.photo_data AS \"avatarData\","
                              + "  ufs.created_at AS \"createdAt\""
                              + " FROM user_follow_store AS ufs, user_profile AS up, user_account_store AS ua"
                              + "  WHERE ufs.followee=%s AND up.delete_flg=0 AND ufs.follower=up.jid AND"
                              + "    ufs.follower=ua.openfire_account||'@'||ua.xmpp_server_name"
                              + "  ORDER BY ufs.created_at DESC";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(jid));
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        let doubleCheck = {};
                        let userDoubleClean = [];
                        for(let i=0;i<res[0].length;i++){
                            if(doubleCheck[res[0][i].jid]){
                                continue;
                            }
                            res[0][i].nickName = res[0][i].nickName.replace(/\+/g,"%20");
                            userDoubleClean.push(res[0][i]);
                            doubleCheck[res[0][i].jid] = true;
                        }
                        resolve({
                            result: true,
                            reason: Const.API_STATUS.SUCCESS,
                            items: userDoubleClean
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," user_follow.dbif.js.getFollowerList sql catch. " + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," user_follow.dbif.js.getFollowerList( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }
};

