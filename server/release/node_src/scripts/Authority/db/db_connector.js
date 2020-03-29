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

var fs = require('fs');
var DBError = require('./db_error').DBError;
var Sequelize = require('sequelize');
var Models = require('./models/models');
var log = require('../log');
var _log = log.returnLogFunction();

function DBConnector() {
    this.confFile = '';
    this.confFIle_mtime = null;
    this.dbs = {};
    this.models = {};
    this.start = false;
    this.interval_monitoring_conf = 1000 * 5;   
}

var _instance = new DBConnector();

function getInstance() {
    _log.connectionLog(7, 'DBConnector::getInstance()');
    return _instance;
}

DBConnector.prototype.stayConnecting = function(confFilePath, cb) {
    if (confFilePath == null || typeof confFilePath != 'string') {
        _log.connectionLog(3, 'DBConnector::stayConnecting(), Invalid argument of confFilePath');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBConnector::stayConnecting(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;

    if (_self.confFile === confFilePath || _self.start === true) {
        _log.connectionLog(6, 'DBConnector::stayConnecting(), already loaded file: ' + confFilePath);
        process.nextTick(function() {
            cb();
        });
        return;
    }

    _log.connectionLog(7, 'DBConnector::stayConnecting');

    function _onLoadJson(err) {
        _log.connectionLog(7, 'DBConnector::stayConnecting()._onLoadJson()');

        if (_self.start == false) {
            if (err) {
                _log.connectionLog(3, 'DBConnector::stayConnecting()._onLoadJson(), got error: ' + err);
                process.nextTick(function() {
                    cb(err);
                });
                return;
            }

            process.nextTick(function() {
                cb();
            });
            _self.start = true;

            setInterval(function() {
                var _mtime = 0;
                try {
                    _mtime = fs.statSync(confFilePath).mtime;
                } catch (ex) {
                    _log.connectionLog(3, 'DBConnector::loadJson(), Failed to stat JSON: ' + confFilePath);
                    return;
                }
                if (_self.confFIle_mtime < _mtime) {
                    _log.connectionLog(7, 'DBConnector::stayConnecting()._onLoadJson() file has been changed: ' + confFilePath + ', old: ' + _self.confFIle_mtime + ', new: ' + _mtime);
                    _self.loadJson(confFilePath, _onLoadJson);
                }

            }, _self.interval_monitoring_conf);

        }

    }
    _self.loadJson(confFilePath, _onLoadJson);

};

DBConnector.prototype.loadJson = function(confFilePath, cb) {
    if (confFilePath == null || typeof confFilePath != 'string') {
        _log.connectionLog(3, 'DBConnector::loadJson(), Invalid argument of confFilePath');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBConnector::loadJson(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;

    var _config = null;
    var _mtime = 0;
    _log.connectionLog(7, 'DBConnector::loadJson()');

    try {
        _config = JSON.parse(fs.readFileSync(confFilePath, 'utf8'));
        _mtime = fs.statSync(confFilePath).mtime;
    } catch (ex) {
        _log.connectionLog(3, 'DBConnector::loadJson(), Failed to parce JSON: ' + confFilePath + ', ' + ex);
        process.nextTick(function() {
            cb({ code: DBError.DB_ERR_LOADJSON_FAILED, message: 'ERROR: DBConnector::loadJson failed to parse JSON: ' + confFilePath + ', ' + ex });
        });
        return;
    }

    _self.confFile = confFilePath;
    _self.confFIle_mtime = _mtime;

    var _now = Date.now();
    var _cnt = 0;
    var _max = _self.updateConnectionDef(_config, _self.dbs, _now);

    if (_max == 0) {
        _log.connectionLog(4, 'DBConnector::loadJson(), there is no definition to connect.');
        process.nextTick(function() {
            cb({ code: DBError.DB_ERR_INVALID_DEF, message: 'WARNING: DBConnector::loadJson(), there is no definition to connect'});
        });
        return;
    }

    function _onConnect(err) {
        _cnt += 1;
        if (err) {
            _log.connectionLog(3, 'DBConnector::loadJson()._onConnect(), got error: ' + err);
            process.nextTick(function() {
                cb({ code: DBError.DB_ERR_CONNECT_FAILED, message: 'ERROR: DBConnector::loadJson failed to connect to DB: ' + JSON.stringify(err)});
            });
            return;
        }
        if (_max == _cnt) {
            process.nextTick(function() {
                cb();
            });
        }
    }

    var _keys = Object.keys(_self.dbs);
    for (var idx = 0; idx <_keys.length; idx++) {
        var _key = _keys[idx];
        if (_self.dbs[_key].chk < _now) {
            _log.connectionLog(6, 'DBConnector::loadJson(), closing.. ' + _key);
            _self.dbs[_key].con.close();
            delete _self.dbs[_key];

        } else if (_self.dbs[_key].con != null) {
            _log.connectionLog(6, 'DBConnector::loadJson(), stay connecting.. ' + _key);
            _onConnect();

        } else {
            _log.connectionLog(6, 'DBConnector::loadJson(), connecting.. ' + _key);
            _self.connect(_key, _onConnect);

        }
    }

};

DBConnector.prototype.updateConnectionDef = function(confJsonData, dbs, now) {
    var _cnt_to_connect = 0;

    var _confKeys = Object.keys(confJsonData);
    if (_confKeys == null || _confKeys.length == 0) {
        _log.connectionLog(3, 'DBConnector::updateConnectionDef(), JSON has no keys');
        return _cnt_to_connect;
    }

    for (var idx = 0; idx < _confKeys.length; idx++) {
        var _key = _confKeys[idx];

        if (confJsonData[_key].db == null || typeof confJsonData[_key].db != 'string') {
            _log.connectionLog(4, 'DBConnector::updateConnectionDef(), no db key in ' + _key);
            continue;
        }
        if (dbs[_key]) {
            if (dbs[_key].db != confJsonData[_key].db) {
                dbs[_key].db = confJsonData[_key].db;
                dbs[_key].con = null;
            }

        } else {
            dbs[_key] = {
                'db'  : confJsonData[_key].db,       
                'con' : null,
                'opts': confJsonData[_key].opts || { logging: false },
                'chk' : now                         
            };
        }

        dbs[_key].chk = now;
        _cnt_to_connect += 1;
    }

    return _cnt_to_connect;

};

DBConnector.prototype.connect = function(dbname, cb) {
    if (dbname == null || typeof dbname != 'string') {
        _log.connectionLog(3, 'DBConnector::connect(), Invalid argument of dbname');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    if (cb == null || typeof cb != 'function') {
        _log.connectionLog(3, 'DBConnector::connect(), Invalid argument of cb');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    _log.connectionLog(7, 'DBConnector::connect');

    _self.dbs[dbname].con = new Sequelize(_self.dbs[dbname].db, _self.dbs[dbname].opts);
    _log.connectionLog(7, 'DBConnector::connect(), connecting.. (' + _self.dbs[dbname].db + ')');

    _self.dbs[dbname].con.authenticate()
        .then(function() {
            _log.connectionLog(5, 'DBConnector::connect(), connected to: ' + dbname);
            process.nextTick(function() {
                cb();
            });
        })
        .catch(function(err) {
            _log.connectionLog(4, 'authenticate');
            err = { code: DBError.DB_ERR_CONNECT_FAILED, message: 'ERROR: DBConnector::connect failed to authenticate with DB: ' + dbname + ', ' + err};
            process.nextTick(function() {
                cb(err);
            });
        });

    _self.models = Models.generateModels(_self.dbs[dbname].con);
};

DBConnector.prototype.getConnection = function(dbname) {
    if (dbname == null || typeof dbname != 'string') {
        _log.connectionLog(3, 'DBConnector::getConnection(), Invalid argument of dbname');
        throw { code: DBError.DB_ERR_INVALID_ARG, message: 'Invalid argument!' };
    }
    var _self = this;
    _log.connectionLog(7, 'DBConnector::getConnection');

    if (_self.dbs[dbname] == null) {
        _log.connectionLog(4, 'DBConnector::getConnection(), there is no such db: ' + dbname);
        throw { code: DBError.DB_ERR_UNKNOWN_DB, message: 'There is no such db. check conf.' + dbname };
    }
    return _self.dbs[dbname].con;
};

exports.getInstance = getInstance;
