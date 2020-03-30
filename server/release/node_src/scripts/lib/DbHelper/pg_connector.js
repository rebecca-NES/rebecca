(function() {

    var pg = require('pg');
    pg.defaults.poolSize = 50;
    var PgConfig = require('./pg_config');
    var AbstractPgConnector = require('./abstract_pg_connector');
    var AbstractPgClient = require('./abstract_pg_client');

    var ServerLog = require('../../controller/server_log');

    var _log = ServerLog.getInstance();

    /**
     * PgConnectorコンストラクタ
     */
    function PgConnector() {
        this._dbConfig = PgConfig.getInstance().getConfig();
        //this._absPg = AbstractPgConnector.getInstance();
        //this._absCl = AbstractPgClient.getInstance();
    };

    var _proto = PgConnector.prototype;

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
        pg.connect(this._dbConfig, function(err, client, done) {
            var _absPg = AbstractPgConnector.getInstance();
            _absPg.connect(err, client, done, onResultCallBack);
        });
        return true;
    };
    /**
     * トランザクションコネクションオブジェクトの取得
     * @returns {Object} トランザクションコネクションオブジェクト
     */
    _proto.getTransaction = function() {
        var _self = this;
        var _absCl = AbstractPgClient.getInstance();
        return _absCl;
    };

    /**
     * トランザクションコネクションオブジェクトの設定
     * @param {function} absClient トランザクションコネクションオブジェクト
     */
    _proto.initTransactionSetting = function(absClient) {
        if(absClient == null || typeof absClient != 'object') {
            return false;
        }
        absClient.initTransactionSetting(this._dbConfig);
    };

    var _pgConnector = new PgConnector();

    PgConnector.getInstance = function() {
        return _pgConnector;
    };
    exports.getInstance = PgConnector.getInstance;
})();
