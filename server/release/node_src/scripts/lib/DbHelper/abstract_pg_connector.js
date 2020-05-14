(function() {
    //DB接続用抽象クラス

    var ServerLog = require('../../controller/server_log');

    var _log = ServerLog.getInstance();

    var _client;
    var _done;
 
    /**
     * AbstractPgConnectorコンストラクタ
     */
    function AbstractPgConnector() {
    };

    var _proto = AbstractPgConnector.prototype;

    /**
     * DB接続
     * @param {Object} err 接続時の異常
     * @param {string} client 接続後の操作クライアント
     * @param {string} done プールへのクライアント返却用関数
     * @param {function} onResultCallBack 実行結果後のコールバック
     */
    _proto.connect = function(err, client, done, onResultCallBack) {
        var _self = this;
        if(client == null) {
            return false;
        }
        if(done == null) {
            return false;
        }
        //　クライアントオブジェクトと終了用の関数を保存
        this._client = client;
        this._done = done;

        _log.connectionLog(7, 'connect');

        onResultCallBack(err, _self);
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
                // The value assigned to _err here is unused.
                /* if(!result) {
                    _err = 'result is null.';
                }
                else { */
                if(result) {
                    ret = result.rows;
                }
                onSqlResultCallBack(err, ret);
            }
        });
        _log.connectionLog(7, 'query');
    };

    /**
     * SQL終了処理
     * @param {function} onEndSqlCallBack 実行結果後のコールバック
     */
    _proto.end = function(onEndSqlCallBack) {
        var _self = this;
        _self._done();
        onEndSqlCallBack(null);
        _log.connectionLog(7, 'end');
    };

    //var _abstractPgConnector = new AbstractPgConnector();

    AbstractPgConnector.getInstance = function() {
        return new AbstractPgConnector();
    };
    exports.getInstance = AbstractPgConnector.getInstance;
})();
