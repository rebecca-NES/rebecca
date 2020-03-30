const log = require("../../server_log").getInstance();
const Const = require("../../const");

module.exports = class UserProfileListDbStore {

    constructor (db_store, tenant_uuid) {
        log.connectionLog(7,"do func hashtag.dbif.constructor(...");
        const db_connect = db_store.getDBConnect();
        if(db_connect ||
           db_connect[tenant_uuid] ||
           db_connect[tenant_uuid]["globalsns"]){
            this.globalsns_connect = db_connect[tenant_uuid]["globalsns"];
        }
    }

    getAffiliationList(){
        log.connectionLog(7,"do func profile.list.dbif.getAffiliationList(...");
        return new Promise((resolve, reject)=>{
            const sql = "SELECT affiliation FROM user_profile";
            this.globalsns_connect.query(sql)
                .then((res) => {
                    let data = [];
                    let _addlist = {};
                    for(let i=0;i<res[0].length;i++){
                        //DBがtextフォーマットなのでから状態に対応
                        if(res[0][i].affiliation == null||
                           res[0][i].affiliation.length == 0){
                            continue;
                        }
                        let affs = JSON.parse(res[0][i].affiliation);
                        for(let j=0;j<affs.length;j++){
                            if(_addlist[affs[j]]){
                                continue;
                            }
                            _addlist[affs[j]] = true;
                            data.push(affs[j]);
                        }
                    }
                    data.sort((a, b)=>{
                        if(decodeURIComponent(a) < decodeURIComponent(b)){
                            return -1;
                        }
                        if(decodeURIComponent(a) > decodeURIComponent(b)){
                            return 1;
                        }
                        return 0;
                    });
                    resolve({
                        result: true,
                        reason: Const.API_STATUS.SUCCESS,
                        groups: data
                    });
                    return;
                }).catch((err)=>{
                    log.connectionLog(2," profile.list.dbif.getAffiliationList error:"+err);
                    reject({
                        result: false,
                        reason: Const.API_STATUS.INTERNAL_SERVER_ERROR,
                        groups: []
                    });
                    return;
                });
        });
    }
};
