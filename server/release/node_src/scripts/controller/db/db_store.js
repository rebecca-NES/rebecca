"use strict";

const fs = require('fs');
const Sequelize = require('sequelize');
const log = require("../server_log").getInstance();

/**
 * Nodeから直接DBに接続するためのクラス。
 * cubee_web_apiで初期化されインスタンスを利用する。
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
        log.connectionLog(7,"do func db.db_store.readConfig(...");
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
     * DB接続
     *
     * @return 接続Sequelizeインスタンス
     */
    getDBConnect() {
        log.connectionLog(7,"do func db.db_store.getDBConnect(...");
        return(this.sequelize);
    }
};
