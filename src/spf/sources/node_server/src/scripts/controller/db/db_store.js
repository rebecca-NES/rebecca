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

"use strict";

const fs = require('fs');
const Sequelize = require('sequelize');
const log = require("../server_log").getInstance();

module.exports = class DbStore{

    constructor (confFilePath) {
        this.readConfig(confFilePath);
    }

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

    getDBConnect() {
        log.connectionLog(7,"do func db.db_store.getDBConnect(...");
        return(this.sequelize);
    }
};
