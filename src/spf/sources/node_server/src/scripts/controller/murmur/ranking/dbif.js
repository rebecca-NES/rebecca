/*
Copyright 2020 NEC Solution Innovators, Ltd.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const log = require("../../server_log").getInstance();
const util = require('util');
const Const = require("../../const");

module.exports = class MurmurRankingDbStore {

    constructor (db_store, tenant_uuid) {
        log.connectionLog(7,"do func murmur.ranking.dbif.constructor(...");
        const db_connect = db_store.getDBConnect();
        if(db_connect ||
           db_connect[tenant_uuid] ||
           db_connect[tenant_uuid]["globalsns"]){
            this.globalsns_connect = db_connect[tenant_uuid]["globalsns"];
        }
    }

    getRankingList(dateFrom, dateTo, rankBottom, offset, limit){
        log.connectionLog(7,"do func murmur.ranking.dbif.getRankingList(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! dateFrom){
                    log.connectionLog(2," murmur.ranking.dbif.getRankingList dateFrom invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                if(! dateTo){
                    log.connectionLog(2," murmur.ranking.dbif.getRankingList dateTo invalid.");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.BAD_REQUEST
                    });
                    return;
                }
                let _rankBottomSql = "",
                        _offsetSql = "",
                        _limitSql = "";
                if(typeof rankBottom == 'number'){
                    _rankBottomSql = " WHERE rank <= " + rankBottom +" ";
                }
                if(typeof offset == 'number'){
                    _offsetSql = " OFFSET " + offset +" ";
                }
                if(typeof limit == 'number'){
                    _limitSql = " LIMIT " + limit +" ";
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," murmur.ranking.dbif.js.getRankingList globalsns_connect is invalid");
                    reject({
                        result:false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                    });
                    return;
                }else{
                    log.connectionLog(7," murmur.ranking.dbif.js.getRankingList  sequelize is ok");
                }
                const sqlbase = "SELECT r.*,"
                              + "       up.name,"
                              + "       up.nickname AS \"nickName\","
                              + "       up.affiliation,"
                              + "       up.photo_type AS \"photoType\","
                              + "       up.photo_data AS \"photoData\""
                              + " FROM"
                              + "  (SELECT RANK() OVER("
                              + "                      ORDER BY count(pm.id) DESC) AS rank,"
                              + "                 count(pm.id) AS \"messageCount\","
                              + "     (SELECT count(*)"
                              + "      FROM user_follow_store"
                              + "      WHERE followee=pm.msgto"
                              + "      GROUP BY followee) AS follower,"
                              + "                 pm.msgto AS jid"
                              + "   FROM publicmessage_store AS pm"
                              + "   WHERE pm.msgtype=11"
                              + "     AND (pm.reply_id = '' OR pm.reply_id IS NULL)"
                              + "     AND pm.msgto=pm.msgfrom"
                              + "     AND pm.created_at >= %s"
                              + "     AND pm.created_at < date %s + integer '1'"
                              + "   GROUP BY pm.msgto"
                              + "   ORDER BY \"messageCount\" DESC, follower"
                              + _offsetSql
                              + _limitSql
                              + "   ) AS r"
                              + "   INNER JOIN"
                              + "        (SELECT jid,name,nickname,affiliation,photo_type,photo_data"
                              + "          FROM user_profile"
                              + "          GROUP BY jid,name,nickname,affiliation,photo_type,photo_data) AS up"
                              + "        ON r.jid=up.jid"
                              + _rankBottomSql
                              + " ORDER BY rank, name";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(dateFrom),
                                      this.globalsns_connect.escape(dateTo)
                );
                log.connectionLog(7," murmur.ranking.dbif.js.getRankingList sql:" + sql);
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        let _items = [];
                        for(let i=0;i<res[0].length;i++){
                            res[0][i].rank = parseInt(res[0][i].rank);
                            res[0][i].messageCount = parseInt(res[0][i].messageCount);
                            res[0][i].follower = res[0][i].follower == null || ! res[0][i].follower.match(/^\d+$/) ? 0 :
                                                 parseInt(res[0][i].follower);
                            try{
                                res[0][i].affiliation = JSON.parse(res[0][i].affiliation);
                            }catch(e){
                                log.connectionLog(2,"murmur.ranking.dbif.js.getRankingList  affiliation JSON.parse err:" + e);
                                res[0][i].affiliation = [];
                            }
                            _items.push(res[0][i]);
                        }
                        resolve({
                            result: true,
                            reason: Const.API_STATUS.SUCCESS,
                            items: _items
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," murmur.ranking.dbif.js.getRankingList sql catch. " + err);
                        reject({
                            result: false,
                            reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," murmur.ranking.dbif.js.getRankingList( catch. " + e);
                reject({
                    result:false,
                    reason: Const.API_STATUS.INTERNAL_SERVER_ERROR
                });
                return;
            }
        });
    }
};

