/**
 * Authority DB connection handling module
 * @module  src/scripts/Auhority/db/db_connector
 */

/* global require */
var fs = require('fs');
var DBError = require('./db_error').DBError;
var Sequelize = require('sequelize');
var Models = require('./models/models');
var log = require('../log');
var _log = log.returnLogFunction();

/**
 * DBConnector クラス
 * @class  DBConnector
 * @constructor
 */
function DBConnector() {
    this.confFile = '';
    this.confFIle_mtime = null;
    this.dbs = {};
    this.models = {};
    this.start = false;
    this.interval_monitoring_conf = 1000 * 5;   // 5 sec
}

var _instance = new DBConnector();

/**
 * DBConnector のインスタンスを返却する
 * @return {DBConnector} DBConnectorインスタンス
 */
function getInstance() {
    _log.connectionLog(7, 'DBConnector::getInstance()');
    return _instance;
}

/**
 * DBとの接続を開始する
 * @param  {string} confFilePath 設定ファイルへのパス
 * @param  {Function} cb コールバック
 * @return {Error} cb の 第1パラメータで返却する
 */
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

    /**
     * DB接続開始後のコールバック
     * @param  {Error} err エラーがあれば。正常時は null。
     * @return {Error} cb の 第1パラメータで返却する
     */
    function _onLoadJson(err) {
        _log.connectionLog(7, 'DBConnector::stayConnecting()._onLoadJson()');

        // First connecting success will callback and stay monitoring json file
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

            // Start to monitoring json file
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
    // JSON読み込みを行い、DB接続を開始する
    _self.loadJson(confFilePath, _onLoadJson);

};

/**
 * 設定ファイルの読み込みと、DB接続の開始
 * @param {string} confFIlePath confFilePath 設定ファイルへのパス
 * @param  {Function} cb コールバック
 * @return {Error} cb の 第1パラメータで返却する
 */
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
        // 同期的に読み込む
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

    // Update connecting data
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

    /**
     * 接続完了時のコールバック
     * @param  {Error} err エラーがあれば。正常時は null。
     * @return {Error} cb の 第1パラメータで返却する
     */
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

/**
 * Update local data from JSON file and flag should connect to DB.
 * Private method.
 * @param  {object} confJsonData Loaded json data from a file
 * @param  {object} dbs          Definitions storing connection (DBConnector.dbs)
 * @param  {date} now            flag to determine should connect
 * @return {int}                 max count to handle connect.
 */
DBConnector.prototype.updateConnectionDef = function(confJsonData, dbs, now) {
    // Max connections count to connect
    var _cnt_to_connect = 0;

    // DB設定の数をカウントする
    var _confKeys = Object.keys(confJsonData);
    if (_confKeys == null || _confKeys.length == 0) {
        _log.connectionLog(3, 'DBConnector::updateConnectionDef(), JSON has no keys');
        return _cnt_to_connect;
    }

    // Load all definitions
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
                'db'  : confJsonData[_key].db,       // 必須
                'con' : null,
                'opts': confJsonData[_key].opts || { logging: false },
                'chk' : now                         // 更新確認用
            };
        }

        dbs[_key].chk = now;
        _cnt_to_connect += 1;
    }

    return _cnt_to_connect;

};

/**
 * DB接続を行うメソッド
 * @param  {string} dbname 接続するDBの名前。権限管理を使用するシステムで一意
 * @param  {Function} cb コールバック
 * @return {Error} cb の 第1パラメータで返却する
 */
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

    // DB接続オブジェクトの生成
    _self.dbs[dbname].con = new Sequelize(_self.dbs[dbname].db, _self.dbs[dbname].opts);
    _log.connectionLog(7, 'DBConnector::connect(), connecting.. (' + _self.dbs[dbname].db + ')');

    // 認証の実行により、DB接続を行う
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

    // 接続したDBにモデル定義をロードする
    _self.models = Models.generateModels(_self.dbs[dbname].con);
};

/**
 * 指定されたDB名の、DBコネクションオブジェクトを返却する。
 * @param  {string} dbname 接続するDBの名前。権限管理を使用するシステムで一意。JSONに記載のもの。
 * @return {sequelize.dbconnectoin} 該当するものが無い場合は null
 */
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
