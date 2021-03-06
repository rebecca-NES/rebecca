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

(function() {
    var GlobalSNSManagerDbConnector = require('../lib/DbHelper/global_sns_manager_db_connector');
    var ShortenURLInfo = require('../model/shorten_url_info');
    var ServerLog = require('./server_log');
    var Utils = require('../utils');
    var SynchronousBridgeNodeXmpp = require('./synchronous_bridge_node_xmpp');
    var Conf = require('./conf');

    var _log = ServerLog.getInstance();
    var _conf = Conf.getInstance();


    function ShortenURLManager() {
    };

    var _shortenURLManager = new ShortenURLManager();

    ShortenURLManager.getInstance = function() {
        return _shortenURLManager;
    };
    
    var TABLE_SHORTEN = "shorten_uri_store";
    var COLUMN_SHORTEN = "shorten_uri";
    var COLUMN_URLID = "urlid";
    var COLUMN_DISPLAYED = "displayed_uri";
    var COLUMN_ORIGINAL = "original_uri";
    var COLUMN_COUNTER = "counter";

    
    var _proto = ShortenURLManager.prototype;

    _proto.createRecord = function(info, onCreateCallBack) {
       _log.connectionLog(7, 'enter ShortenURLManager.createRecord');
        var _self = this;
        return GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);
        function _onGetConnectionCallBack(err, connection) {
            _log.connectionLog(7, "enter ShortenURLManager#_onGetConnectionCallBack");
            if (err) {
                _log.connectionLog(3,'ShortenURLManager#create: DB connect : ' + err.name + ": " + err.message);
                onCreateCallBack(false, false);
                return;
            }
       
            var sql = "insert INTO " + TABLE_SHORTEN + "(" +
                COLUMN_SHORTEN + "," + COLUMN_URLID + "," + COLUMN_DISPLAYED + "," + COLUMN_ORIGINAL + "," + COLUMN_COUNTER  + ") " +
                "VALUES(" + 
                GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(info.getShortenPath()) + "," +
                GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(info.getUrlId()) + "," +
                GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(info.getDisplayedURL()) + "," +
                GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(info.getOriginalURL()) + ", 0)";
            try {
                connection.query(sql, _onCreate);
            }
            catch (e) {
                _log.connectionLog(3,'[add a record] DB Error; ' + e.name + ":" + e.message);
                _log.connectionLog(3,'SQL =' + sql);
                onCreateCallBack(false, false);
            }

            function _onCreate(err, result) {
                _log.connectionLog(7, "enter ShortenURLManager#_onCreate");
                connection.end(function(endErr) {
                    _log.connectionLog(7, "in end handler");
                    if (endErr) {
                        _log.connectionLog(3,'ShortenURLManager#_onCreate : DB disconnect err :: ' + endErr.name + ":" + endErr.message);
                        onCreateCallBack(false, false);
                    }
                    else if (err) {
                        if (err.message.indexOf('ER_DUP_ENTRY:') == 0) {
                            _log.connectionLog(4,'same urlid was found: ' + info.getUrlId());
                            onCreateCallBack(true, false);
                        }
                        else {
                            _log.connectionLog(3,'ShortenURLManager#_onCreate : ' + err.name + ": " + err.message);
                            _log.connectionLog(3,'ShortenURLManager#_onCreate _sql : ' + sql);
                            onCreateCallBack(false, false);
                        }
                    }
                    else {
                        _log.connectionLog(7, "call onCreateCallBack");
                        onCreateCallBack(true, true);
                    }
                }
            )}
        }
       _log.connectionLog(7, 'leave ShortenURLManager.createRecord');
 	};

	_proto.getURLInfoFromURLID = function(urlid, onGetURLInfoFromURLID) {
        var _self = this;
       _log.connectionLog(7, 'enter ShortenURLManager.getURLInfoFromURLID');
        return GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);
        function _onGetConnectionCallBack(err, connection) {
            if(err){
                _log.connectionLog(3,'ShortenURLManager#getURLInfoFromURLID DB connect: ' + err.name + ": " + err.message);
                onGetURLInfoFromURLID(err, null);
                return;
            }
            var sql = "select * from " + TABLE_SHORTEN + " where " + COLUMN_URLID + "=" + 
                GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(urlid);
            try {
                connection.query(sql, _onGetURLInfoFromURLID);
            }
            catch (e) {
                _log.connectionLog(3,'[search a record by urlid] DB Error; ' + e.name + ":" + e.message);
                _log.connectionLog(3,'SQL =' + sql);
                onGetURLInfoFromURLID(e, null);
            }

            function _onGetURLInfoFromURLID(err, result) {
                _log.connectionLog(7, "enter ShortenURLManager#_onGetURLInfoFromURLID");
                connection.end(function(endErr){
                    if (endErr) {
                        _log.connectionLog(3,'ShortenURLManager#_onGetURLInfoFromURLID : DB disconnect err :: ' + endErr.name + ":" + endErr.message);
                        onGetURLInfoFromURLID(endErr, null);
                    }
                    else if (err) {
                        _log.connectionLog(3,'ShortenURLManager#_onGetURLInfoFromURLID : ' + err.name + ": " + err.message);
                        _log.connectionLog(3,'ShortenURLManager#_onGetURLInfoFromURLID _sql : ' + sql);
                        onGetURLInfoFromURLID(err, null);
                    }
                    else if (result.length != 1) {
                        _log.connectionLog(4,'ShortenURLManager#_onGetURLInfoFromURLID: result.length = ' + result.length);
                        onGetURLInfoFromURLID(err, null);
                    }
                    else if (result == null  || result.length == 0) {
                        _log.connectionLog(7,'ShortenURLManager#getURLInfoFromURLID) not found:');
                        onGetURLInfoFromURLID(null, null);
                    }
                    else {
                        _log.connectionLog(7,'ShortenURLManager#getURLInfoFromURLID), originalURL = ' + result[0].original_uri);
                        var info = ShortenURLInfo.create();
                        info.setUrlId(result[0].urlid);
                        info.setDisplayedURL(result[0].displayed_uri);
                        info.setShortenPath(result[0].shorten_uri);
                        info.setOriginalURL(result[0].original_uri);
                        onGetURLInfoFromURLID(err, info);
                    }
                })
            }
        }
    };
	
    _proto.getURLInfoFromOriginalURL = function(url, onGetURLInfoFromOriginalURL) {
       _log.connectionLog(7, 'enter ShortenURLManager.getURLInfoFromOriginalURL');
        var _self = this;
        
       _log.connectionLog(7, "ShortenUrlManager#getURLInfoFromOriginalURL: url = " + url);

        return GlobalSNSManagerDbConnector.getInstance().getConnection(_onGetConnectionCallBack);
        function _onGetConnectionCallBack(err, connection) {
            _log.connectionLog(7, "ShortenUrlManager#_onGetConnectionCallBack");
            if(err){
                _log.connectionLog(3,'ShortenURLManager#getURLInfoFromOriginalURL DB connect : ' + err.name + ": " + err.message);
                onGetURLInfoFromOriginalURL(err, null);
                return;
            }
            var sql = "SELECT * FROM " + TABLE_SHORTEN + " WHERE " + COLUMN_ORIGINAL + "=" + 
                    GlobalSNSManagerDbConnector.getInstance().escapeSqlStr(url);
            _log.connectionLog(7, "sql = " + sql);
            try {
                connection.query(sql, _onGetURLInfoFromOriginalURL);
            }
            catch (e) {
                _log.connectionLog(3,'[find a record by url] DB Error; ' + e.name + ":" + e.message);
                _log.connectionLog(3,'SQL =' + sql);
                onGetURLInfoFromOriginalURL(e, null);
            }
            function _onGetURLInfoFromOriginalURL(err, result) {
                _log.connectionLog(7, "enter ShortenUrlManager#_onGetURLInfoFromOriginalURL");
                connection.end(function(endErr){
                    if (endErr) {
                        _log.connectionLog(3,'ShortenURLManager#_onGetURLInfoFromOriginalURL : DB disconnect err :: ' + endErr.name + ":" + endErr.message);
                        onGetURLInfoFromOriginalURL(endErr, null);
                    }
                    else if (err) {
                        _log.connectionLog(3,'ShortenURLManager#_onGetURLInfoFromOriginalURL : ' + err.name + ": " + err.message);
                        _log.connectionLog(3,'ShortenURLManager#_onGetURLInfoFromOriginalURL _sql : ' + sql);
                         onGetURLInfoFromOriginalURL(err, null);
                    }
                    else if (!result || result.length == 0) {
                        _log.connectionLog(7, "not found: " + url);
                        onGetURLInfoFromOriginalURL(null, null);
                    }
                    else {
                        _log.connectionLog(7, "result.length = " + result.length);
                        var info = ShortenURLInfo.create();
                        info.setUrlId(result[0].urlid);
                        info.setDisplayedURL(result[0].displayed_uri);
                        info.setShortenPath(result[0].shorten_uri);
                        info.setOriginalURL(result[0].original_uri);
                        onGetURLInfoFromOriginalURL(err, info);
                    }
                    return;
                }
                )
            }
        }
    };
    exports.getInstance = ShortenURLManager.getInstance;
})();