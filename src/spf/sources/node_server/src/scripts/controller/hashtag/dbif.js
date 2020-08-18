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

const log = require("../server_log").getInstance();
const util = require('util');
const Const = require("../const");
const Validation = require("../validation");

module.exports = class HashtagDbStore {

    constructor (db_store, tenant_uuid) {
        log.connectionLog(7,"do func hashtag.dbif.constructor(...");
        const db_connect = db_store.getDBConnect();
        if(db_connect ||
           db_connect[tenant_uuid] ||
           db_connect[tenant_uuid]["globalsns"]){
            this.globalsns_connect = db_connect[tenant_uuid]["globalsns"];
        }
    }

    setHastagArray(hashtags, item_id, jid){
        log.connectionLog(7,"do func hashtag.dbif.setHastagArray(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! item_id){
                    log.connectionLog(2," hashtag.dbif.setHastagArray hashtags invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! jid){
                    log.connectionLog(2," hashtag.dbif.setHastagArray hashtags invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! hashtags ||
                   typeof hashtags != "object" ||
                   hashtags.length === undefined){
                    log.connectionLog(2," hashtag.dbif.setHastagArray hashtags invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," hashtag.dbif.js.setHastagArray globalsns_connect is invalid");
                    reject({
                        result:false
                    });
                    return;
                }else{
                    log.connectionLog(7," hashtag.dbif.js.setHastagArray  sequelize is ok");
                }
                this.deleteHastagDataInItemId(item_id)
                    .then((res1)=>{
                        let tagAction = [];
                        let double_check = {};
                        for(let i=0;i<hashtags.length;i++){
                            if(double_check[hashtags[i]]){
                                continue;
                            }
                            double_check[hashtags[i]] = true;
                            tagAction.push(
                                new Promise((resolve, reject)=>{
                                    this.insertHastagData(hashtags[i],
                                                          item_id,
                                                          jid)
                                        .then((res2)=>{
                                            resolve({
                                                result:true
                                            });
                                            return;
                                        })
                                        .catch((res2)=>{
                                            reject({
                                                result:false
                                            });
                                            return;
                                        });
                                })
                            );
                        }
                        Promise.all(tagAction)
                               .then((res3)=>{
                                   resolve({
                                       result:true
                                   });
                                   return;
                               })
                               .catch((err3)=>{
                                   log.connectionLog(2,"hashtag.dbif.js.setHastagArray db insert action err:"+ JSON.stringify(err3));
                                   reject({
                                       result:false
                                   });
                                   return;
                               });
                    })
                    .catch((err1)=>{
                        log.connectionLog(7,"hashtag.dbif.js.setHastagArray deleteHastagDataInItemId err1:"+ JSON.stringify(err1));
                        reject({
                            result:false
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," hashtag.dbif.js.setHastagArray( catch. " + e);
                reject({
                    result:false
                });
                return;
            }
        });
    }

    getHastagRanking(msgTo, dateFrom, dateTo, rankBottom, offset, limit){
        log.connectionLog(7,"do func hashtag.dbif.getHastagRanking(...");
        let msgToSQLTableJoin = "";
        let msgToSQLInWhere = "";
        let _before_day = 365;
        let _toDate = 'now()';
        let isSetRankBottom = false;
        let _offset = 0;
        let _limit = 100;
        if(Validation.msgToValidationCheck(msgTo, true)){
            msgToSQLTableJoin = " LEFT OUTER JOIN publicmessage_store as p ON h.item_id=p.item_id";
            msgToSQLInWhere = " AND p.msgto=" + this.globalsns_connect.escape(msgTo);
        }
        if(Validation.dateValidationCheck(dateTo, true)){
            _toDate = this.globalsns_connect.escape(dateTo) + "::date";
        }
        if(Validation.dateValidationCheck(dateFrom, true)){
            if(Validation.dateValidationCheck(dateTo, true)){
                _before_day = (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 1000 / 60 / 60 / 24;
            }else{
                _before_day = parseInt((new Date().getTime() - new Date(dateFrom).getTime()) / 1000 / 60 / 60 / 24);
            }
        }
        if(rankBottom != null && typeof rankBottom == 'number'){
            isSetRankBottom = true;
        }
        if(offset != null && typeof offset == 'number'){
            _offset = offset;
        }
        if(limit != null && typeof limit == 'number'){
            _limit = limit;
        }
        return new Promise((resolve, reject)=>{
            if(! this.globalsns_connect){
                log.connectionLog(1," hashtag.dbif.js.setHastagArray globalsns_connect is invalid");
                reject({
                    result:false,
                    reason:Const.API_STATUS.INTERNAL_SERVER_ERROR,
                    data:[]
                });
                return;
            }else{
                const sqlbase = "select"
                              + "    tagname,"
                              + "    count(*),"
                              + "    max(h.created_at) as created_at,"
                              + "    rank() OVER(ORDER BY count(*) DESC) AS rank"
                              + "  from"
                              + "    hashtag_store AS h"
                              + "" + msgToSQLTableJoin
                              + "  WHERE"
                              + "    h.created_at > %s - interval '%s day'"
                              + "" + msgToSQLInWhere
                              + "  GROUP BY tagname"
                              + "  ORDER BY count DESC, created_at DESC, tagname"
                              + "  OFFSET %s"
                              + "  LIMIT %s;";
                let sql = util.format(sqlbase,
                                      _toDate,
                                      _before_day,
                                      _offset,
                                      _limit);
                log.connectionLog(7,"do func hashtag.dbif.getHastagRanking sql : " + sql);
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        log.connectionLog(7," hashtag.dbif.js.insertHastagData note_store: s" + JSON.stringify(res));
                        let data = [];
                        for(let i=0;i<res[0].length;i++){
                            if(res[0][i].created_at){
                                res[0][i].created_at = formatDate(res[0][i].created_at);
                            }
                            if(!isSetRankBottom ||
                               (isSetRankBottom && res[0][i].rank <= rankBottom)){
                                data.push(res[0][i]);
                            }
                        }
                        resolve({
                            result:true,
                            reason:Const.API_STATUS.SUCCESS,
                            data:data
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," hashtag.dbif.js.insertHastagData note_store: err" + err);
                        reject({
                            result:false,
                            reason:Const.API_STATUS.INTERNAL_SERVER_ERROR,
                            data:[]
                        });
                        return;
                    });
            }
        });
    }

    insertHastagData(tag, itemid, jid){
        log.connectionLog(7,"do func hashtag.dbif.insertHastagData(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! itemid){
                    log.connectionLog(2," hashtag.dbif.insertHastagData itemid invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," hashtag.dbif.js.insertHastagData globalsns_connect is invalid");
                    reject({
                        result:false
                    });
                    return;
                }else{
                    log.connectionLog(7," hashtag.dbif.js.insertHastagData  sequelize is ok");
                }
                const sqlbase = "INSERT INTO hashtag_store (item_id, jid, tagname, created_at) VALUES (%s, %s, %s, now())";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(itemid),
                                      this.globalsns_connect.escape(jid),
                                      this.globalsns_connect.escape(tag) );
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        log.connectionLog(7," hashtag.dbif.js.insertHastagData note_store: s" + JSON.stringify(res));
                        resolve({
                            result:true
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," hashtag.dbif.js.insertHastagData note_store: err" + err);
                        reject({
                            result:false
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," hashtag.dbif.js.insertHastagData( catch. " + e);
                reject({
                    result:false
                });
                return;
            }
        });
    }

    deleteHastagDataInItemId(itemid){
        log.connectionLog(7,"do func hashtag.dbif.deleteHastagDataInItemId(...");
        return new Promise((resolve, reject)=>{
            try{
                if(! itemid){
                    log.connectionLog(2," hashtag.dbif.deleteHastagDataInItemId itemid invalid.");
                    reject({
                        result:false
                    });
                    return;
                }
                if(! this.globalsns_connect){
                    log.connectionLog(1," hashtag.dbif.js.deleteHastagDataInItemId globalsns_connect is invalid");
                    reject({
                        result:false
                    });
                    return;
                }else{
                    log.connectionLog(7," hashtag.dbif.js.deleteHastagDataInItemId  sequelize is ok");
                }
                const sqlbase = "DELETE FROM hashtag_store where item_id = %s";
                let sql = util.format(sqlbase,
                                      this.globalsns_connect.escape(itemid));
                log.connectionLog(7," hashtag.dbif.js.deleteHastagDataInItemId  sql:" + sql);
                this.globalsns_connect.query(sql)
                    .then((res) => {
                        log.connectionLog(7," hashtag.dbif.js.deleteHastagDataInItemId  note_store: s" + JSON.stringify(res));
                        resolve({
                            result:true
                        });
                        return;
                    }).catch((err)=>{
                        log.connectionLog(2," hashtag.dbif.js.deleteHastagDataInItemId note_store: err" + err);
                        reject({
                            result:false
                        });
                        return;
                    });
            }catch(e){
                log.connectionLog(2," hashtag.dbif.js.deleteHastagDataInItemId( catch. " + e);
                reject({
                    result:false
                });
                return;
            }
        });
    }
};

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
