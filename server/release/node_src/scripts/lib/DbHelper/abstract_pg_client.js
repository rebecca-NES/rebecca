(function() {
    //DB接続用抽象クラス

    var Client = require('pg').Client;

    var ServerLog = require('../../controller/server_log');

    var _client;

    var _log = ServerLog.getInstance();

    /**
     * AbstractPgClientコンストラクタ
     */
    function AbstractPgClient() {
    };

    var _proto = AbstractPgClient.prototype;

    _proto.initTransactionSetting = function(dbConfig) {
        this._client = new Client(dbConfig);
        this._client.connect();
    };

    /**
     * トランザクション開始
     * @param {function} callback 実行結果後のコールバック
     */
    _proto.begin = function(callback) {
        var _self = this;
        _self._client.query("BEGIN", function(err, result) {
            _log.connectionLog(7, 'begin');
            if(err) {
                callback(err);
            }
            else {
                callback(null, result);
            }
        });
    };

    /**
     * トランザクション終了
     * @param {function} callback 実行結果後のコールバック
     */
    _proto.commit = function(callback) {
        var _self = this;
        _self._client.query("COMMIT", _self._client.end.bind(_self._client));
        _log.connectionLog(7, 'commit');
        callback(null, null);
    };

    /**
     * 処理失敗時のロールバック
     * @param {function} callback 実行結果後のコールバック
     */
    _proto.rollback = function(callback) {
        var _self = this;
        _self._client.query("ROLLBACK", function() {
            _log.connectionLog(7, 'rollback');
            callback(null, null);
            _self._client.end();
        });
    };

    /**
     * SQL発行
     * @param {string} sql 実行SQL文
     * @param {function} onSqlResultCallBack 実行結果後のコールバック
     */
    _proto.query = function(sql, onSqlResultCallBack) {
        var _self = this;
        _self._client.query(sql, function(err, result) {
            if(err) {
                onSqlResultCallBack(err, null);
            }
            else {
                var _err = null;
                var ret;
                if(!result) {
                    _err = 'result is null.';
                }
                else {
                    ret = result.rows;
                }
                onSqlResultCallBack(err, ret);
            }
        });
        _log.connectionLog(7, 'query');
    };

    /**
     * 終了処理
     * @param {function} onSqlResultCallBack コールバック
     */
    _proto.end = function(callback) {
        callback(null, null);
        _log.connectionLog(7, 'end');
    };

    // var _abstractPgClient = new AbstractPgClient();

    AbstractPgClient.getInstance = function() {
        return new AbstractPgClient();
    };
    exports.getInstance = AbstractPgClient.getInstance;
})();
