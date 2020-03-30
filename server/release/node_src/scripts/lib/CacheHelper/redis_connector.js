(function() {
    // redisモジュールの読み込み
    var Redis = require('redis');
    // ログ出力モジュールの読み込み
    var ServerLog = require('../../controller/server_log');
    // 共通設定ファイルの読み込み
    var Conf = require('../../controller/conf');

    var log = ServerLog.getInstance();
    var _conf = Conf.getInstance();

    // コンストラクタ
    function RedisConnector() {
        var _self = this;

        //接続設定
        var _host = _conf.getConfData('REDIS_SERVER_HOST');
        var _port = parseInt(_conf.getConfData('REDIS_PORT'));
        var _pw   = _conf.getConfData('REDIS_PW');
        var _connectTimeOut = parseInt(_conf.getConfData('REDIS_CONNECT_TIMEOUT'));
        if (isNaN(_connectTimeOut)) {
            // デフォルトtimeout値 2sec
            _connectTimeOut = 2000;
            log.connectionLog(4,
                'RedisConnector: redis Connection Timeout Setting is nothing (REDIS_CONNECT_TIMEOUT)');
        }
        // node_redis に使用するオプション
        _self._redisOptions = {
                 host     : _host             // 接続先ホスト
                ,port     : _port             // 接続先ポート
                ,password : _pw               // パスワード
                ,db       : 1                 // DB番号
                ,tls      : false             // tls(ssl)は使用しない。使用する場合は、connectのイベント名が異なる
                ,connect_timeout : _connectTimeOut      // 接続時のタイムアウト秒数
                ,socket_keepalive : true                 // redisの接続を維持する
        }
        _self._redisClient = null;
        _self._isAuthorized = false;

    }

    var _RedisConnector = new RedisConnector();

    /**
    * シングルトン実装
    */
    RedisConnector.getInstance = function() {
        return _RedisConnector;
    }

    exports.getInstance = RedisConnector.getInstance;

    var _proto = RedisConnector.prototype;

    /**
    * node_redis client を返却する
    * @return {object(redis_client)} RedisClient を返却する
    */
    _proto.getRedisClient = function() {
        log.connectionLog(7, 'RedisConnector#getRedisClient');
        var _self = this;
        if (!_self._redisClient) {
            _connect(_self);
        }
        return _self._redisClient;
    }

    /**
    * Redis に接続し、redisClientを保持する
    */
    function _connect(_self) {

        if (!_self._redisClient) {
            log.connectionLog(7, 'RedisConnector#_connect Prepair to connect.');

            // redisクライアント生成
            // IPV6 かどうかは ライブラリの中で判定しているため、呼び出し側での対処はない
            _self._redisClient = Redis.createClient(_self._redisOptions.port, _self._redisOptions.host, _self._redisOptions);

            // イベント割り当て
            // 一部は不要なので使用しない（コメントアウトしている）
            // node_redis は、 createClient すると、イベント割り当てはクリアされるため、ここで割り当てる
            // _self._redisClient.once('connect', _onRedisConnect);
            // _self._redisClient.on('data', _onRedisData);
            _self._redisClient.on('error', _onRedisError);
            _self._redisClient.on('clientError', _onRedisClientError);
            _self._redisClient.once('close', _onRedisClose);
            _self._redisClient.once('end', _onRedisEnd);
            // _self._redisClient.on('drain', _onRedisDrain);

        }
        if (_self._isAuthorized) {
            // 認証不要
            log.connectionLog(7, 'RedisConnector#_connect Already connected to redis.');
            return;
        }

        /**
        * コールバック。Redisでエラーが発生した時。
        * @param {Error} err エラーオブジェクト
        */
        function _onRedisError(err) {
            log.connectionLog(4, 'RedisConnector#_onRedisError err: ' + err);
            onRedisError(_self, err);
        }
        /**
        * コールバック。Redisでエラーが発生した時。
        * @param {Error} err エラーオブジェクト
        * @notice node_redis でも 'error' イベントと同じ扱い
        */
        function _onRedisClientError(err) {
            log.connectionLog(7, 'RedisConnector#_onRedisClientError');
            onRedisClientError(_self, err);
        }
        /**
        * コールバック。Redisで接続が切れた場合。
        * @notice node_redis でも 'end' イベントと同じ扱い
        */
        function _onRedisClose() {
            log.connectionLog(7, 'RedisConnector#_onRedisClose');
            onRedisClose(_self);
        }
        /**
        * コールバック。Redisで接続が終了した場合。
        * @notice node_redis でも 'close' イベントと同じ扱い
        */
        function _onRedisEnd() {
            log.connectionLog(7, 'RedisConnector#_onRedisEnd');
            onRedisEnd(_self);
        }
        /**
        * コールバック。認証処理
        * @param {Error} err 失敗した場合に値がある
        * @param {string} res 成功した場合は 'OK' が返る
        */
        function _onRedisAuth(err, res) {
            log.connectionLog(7, 'RedisConnector#_onRedisAuth');
            _onRedisAuth(_self, err, res);
        }

        // 認証する
        log.connectionLog(7, 'RedisConnector#_connect Starting auth');
        _self._redisClient.auth(_self._redisOptions.password, _self._onRedisAuth);

    }

    /**
    * コールバック。Redisでエラーが発生した時。
    * @param {object(RedisConnector)} _self RedisConnector
    * @param {Error} err エラーオブジェクト
    */
    function onRedisError(_self, err) {
        log.connectionLog(4, 'RedisConnector#onRedisError err: ' + err);
    }
    /**
    * コールバック。Redisでエラーが発生した時。
    * @param {object(RedisConnector)} _self RedisConnector
    * @param {Error} err エラーオブジェクト
    * @notice node_redis でも 'error' イベントと同じ扱い
    */
    function onRedisClientError(_self, err) {
        log.connectionLog(7, 'RedisConnector#onRedisClientError');
        onRedisError(_self, err);
    }
    /**
    * コールバック。Redisで接続が切れた場合。
    * @param {object(RedisConnector)} _self RedisConnector
    * @notice node_redis でも 'end' イベントと同じ扱い
    */
    function onRedisClose(_self) {
        log.connectionLog(7, 'RedisConnector#onRedisClose');
        // 後処理
        log.connectionLog(7, 'RedisConnector#onRedisClose Going down');
        _self._isAuthorized = false;
        _self._redisClient = null;
    }
    /**
    * コールバック。Redisで接続が終了した場合。
    * @param {object(RedisConnector)} _self RedisConnector
    * @notice node_redis でも 'close' イベントと同じ扱い
    */
    function onRedisEnd(_self) {
        log.connectionLog(7, 'RedisConnector#onRedisEnd');
        onRedisClose(_self);
    }
    /**
    * コールバック。認証処理
    * @param {object(RedisConnector)} _self RedisConnector
    * @param {Error} err 失敗した場合に値がある
    * @param {string} res 成功した場合は 'OK' が返る
    */
    function onRedisAuth(_self, err, res) {
        if (err) {
            // redis の接続を解除する
            log.connectionLog(4, 'RedisConnector#_onRedisAuth Failed to auth cos: ' + err);
            _self._disconnect(new Error('Failed to auth cos: ' + err.message));
            return;
        }
        if (!res || typeof res != 'string') {
            // redis の接続を解除する
            log.connectionLog(4, 'RedisConnector#_onRedisAuth Failed to auth cos result is not OK');
            _self._disconnect(new Error('Failed to auth cos result is not OK'));
            return;
        }
        if (res != 'OK') {
            // redis の接続を解除する
            log.connectionLog(4, 'RedisConnector#_onRedisAuth Failed to auth cos result is not OK: ' + res);
            _self._disconnect(new Error('Failed to auth cos result is not OK'));
            return;
        }
        _self._isAuthorized = true;
    }

})();