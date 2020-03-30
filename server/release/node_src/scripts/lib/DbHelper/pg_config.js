(function() {
    //pg用パラメータクラス
    var Conf = require('../../controller/conf');
    var _conf = Conf.getInstance();
    var _host = _conf.getConfData('GLOBAL_SNS_MANAGER_DB_SERVER_HOST', '127.0.0.1');

    /**
     * PgConfigのコンストラクタ
     */
    function PgConfig() {

    }

    var _proto = PgConfig.prototype;

    //接続設定
    var _dbConfig = {
            host     : _host,                   //接続先ホスト
            port     : 5432,                    //接続先ポート
            user     : 'globalsns_admin',       //ユーザー名
            password : 'password',              //パスワード
            database : 'globalsns',             //DB名
            ssl      : false,                   //SSL接続
    };
    var _pgConfig = new PgConfig();

    _proto.getConfig = function() {
    	return _dbConfig;
    };

    PgConfig.getInstance = function() {
        return _pgConfig;
    };
    exports.getInstance = PgConfig.getInstance;
})();
