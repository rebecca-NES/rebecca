(function() {
    //DB接続用抽象クラス

    // どのDBを使用するか（Settingファイルから本来は読み込む)
    var db_type = "pg";
    var mysql = require('mysql');

    var PgConnector = require('./pg_connector');

    /**
     * AbstractDbConnectorコンストラクタ
     */
    function AbstractDbConnector(dbConfig) {
        if(db_type === "pg") {
            this._dbConfig = dbConfig;
            this._pg = PgConnector.getInstance();
        }
        else {
            this._pool = mysql.createPool(dbConfig);
        }
    };

    var _proto = AbstractDbConnector.prototype;

    /**
     * DBへ接続
     * @param {function} onResultCallBack 実行結果後のコールバック
     * @returns {boolean} true : 処理成功 / false : 処理失敗
     */
    _proto.getConnection = function(onResultCallBack) {
        if(onResultCallBack == null || typeof onResultCallBack != 'function') {
            return false;
        }
        var _self = this;
        if(db_type === "pg") {
            _self._pg.getConnection(onResultCallBack);
        }
        else {
            _self._pool.getConnection(function(err, connection) {
                if(err){
                    onResultCallBack(err, null);
                    return;
                }
                onResultCallBack(null, connection);
            });
        }      
        return true;
    };
    /**
     * トランザクションコネクションオブジェクトの取得
     * @param {function} onResultCallBack 実行結果後のコールバック
     * @returns {Object} トランザクションコネクションオブジェクト
     */
    _proto.getTransaction = function() {
        var _self = this;
        if(db_type === "pg") {
            var _tran = _self._pg.getTransaction();
            _self._pg.initTransactionSetting(_tran);
        }
        else {
            var _tran = mysql.createConnection(_self._dbConfig);
            _self.initTransactionSetting(_tran);
        }
        return _tran;
    };
    /**
     * トランザクションコネクションオブジェクトの設定
     * @param {function} onResultCallBack 実行結果後のコールバック
     * @returns {Object} トランザクションコネクションオブジェクト
     */
    _proto.initTransactionSetting = function(transaction) {
        if(transaction == null || typeof transaction != 'object') {
            return false;
        }
        var _self = this;

        transaction.begin = function(callback) {
            transaction.query("SET autocommit=0", function(err, info) {
                if(err) {
                    callback(err);
                }
                else {
                    transaction.query("START TRANSACTION", function(err, info) {
                        if(err) {
                            callback(err);
                        }
                        else {
                            callback(null, info);
                        }
                    });
                }
            });
        }

        transaction.commit = function(callback) {
            transaction.query("COMMIT", function(err, info) {
                if(err) {
                    callback(err);
                }
                else {
                    transaction.query("SET autocommit=1", function(err, info) {
                        if(err) {
                            callback(err);
                        }
                        else {
                            callback(null, info);
                        }
                    });
                }
            });
        }

        transaction.rollback = function(callback) {
            transaction.query("ROLLBACK", function(err, info) {
                if(err) {
                    callback(err);
                }
                else {
                    transaction.query("SET autocommit=1", function(err, info) {
                        if(err) {
                            callback(err);
                        }
                        else {
                            callback(null, info);
                        }
                    });
                }
            });
        }
    };
    /**
     * SQLのエスケープ処理
     * @param {Object} sql sql文に使われるデータ
     * @returns {String} エスケープ後の文字列
     * @exsample
     *    var baseSql = 'SELECT * FROM hoge WHERE name = ';
     *    var name = 'hogehoge';
     *    var sql = baseSql + 【継承先クラス】.getInstance().escapeSqlStr(name);
     */
    _proto.escapeSqlStr = function(sql) {
        return mysql.escape(sql);
    };

    exports.AbstractDbConnector = AbstractDbConnector;
})();
