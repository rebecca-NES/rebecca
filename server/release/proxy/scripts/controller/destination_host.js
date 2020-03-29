(function() {
    var ServerLog = require('./server_log');

    // ServerLogクラスインスタンス取得
    var _log = ServerLog.getInstance();

    function DestinationHost() {
        // レスポンスステータスコード
        this._statusCode = 200;
        // レスポンスヘッダ
        this._header = {
            'Content-Type': 'application/x-javascript',
            'Cache-Control': 'no-cache'
        };
        // レスポンスデータ
        this._responseData = '';
    }

    var _proto = DestinationHost.prototype;

    /*
     * ステータスコード取得
     * @returns {Number} ステータスコード
     */
    _proto.getStatusCode = function() {
        return this._statusCode;
    }

    /*
     * レスポンスヘッダ取得
     * @returns {header} レスポンスヘッダ
     */
    _proto.getHeader = function() {
        return this._header;
    }

    /*
     * レスポンスデータ取得
     * @returns {String} レスポンスデータ
     */
    _proto.getResponseData = function() {
        return this._responseData;
    }

    /*
     * レスポンスデータ生成
     * @param {String} dHost ディスパッチ先ホスト名
     * @param {Number} dPort ディスパッチ先ポート番号
     */
    _proto.createResponseData = function(dHost, dPort) {
        _log.connectionLog(7,
            'DestinationHost.createResponseData::dispatch destination socket.io server ' +
            dHost + ':' + dPort);

        this._responseData = 'var d_host = "' + dHost + '"; var d_socketio_port = ' + dPort + ';';
    }

    module.exports = DestinationHost;
})();
