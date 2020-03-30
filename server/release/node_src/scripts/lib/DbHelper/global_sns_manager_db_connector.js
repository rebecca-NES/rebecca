(function() {
    var AbstractDbConnector = require('./abstract_db_connector').AbstractDbConnector;
    var NodeJsUtil = require('util');
    var Conf = require('../../controller/conf');
    var _conf = Conf.getInstance();
    var _host = _conf.getConfData('GLOBAL_SNS_MANAGER_DB_SERVER_HOST', '127.0.0.1');
    var _user = _conf.getConfData('GLOBAL_SNS_MANAGER_DB_USER', 'globalsns_admin');
    var _pw = _conf.getConfData('GLOBAL_SNS_MANAGER_DB_PW', '');

    /**
     * GlobalSNSManagerDbConnectorコンストラクタ
     */
    function GlobalSNSManagerDbConnector(_dbConfig){
        AbstractDbConnector.call(this,_dbConfig);
    }

    var _proto = GlobalSNSManagerDbConnector.prototype;

    //AbstractDbConnectorクラスを継承
    NodeJsUtil.inherits(GlobalSNSManagerDbConnector, AbstractDbConnector);

    //接続設定
    var _dbConfig = {
            host     : _host,             //接続先ホスト
            user     : _user,             //ユーザー名
            password : _pw,               //パスワード
            database : 'globalsns_manager',     //DB名
            connectionLimit : 50,               //同時コネクション数
            insecureAuth: true,                 //認証方式でセキュアでないものを許す
    };
    var _globalSNSManagerDbConnector = new GlobalSNSManagerDbConnector(_dbConfig);

    GlobalSNSManagerDbConnector.getInstance = function() {
        return _globalSNSManagerDbConnector;
    };
    exports.getInstance = GlobalSNSManagerDbConnector.getInstance;

})();
