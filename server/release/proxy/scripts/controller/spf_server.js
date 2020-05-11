(function() {
    var Conf            = require('./conf');
    var ServerLog       = require('./server_log');
    var RedisConnector  = require('./redis_connector');
    var SpfListManager  = require('./spf_list_manager');
    var DestinationHost = require('./destination_host');
    var OutsideSocketIOServerListManager = require('./outside_socket_io_server_list_manager');
    var url             = require('url');
    var fs              = require('fs');
    var cookie          = require('cookie');
    var multiparty      = require('multiparty');
    var unirest         = require('unirest');

    // confクラスインスタンス取得
    var _conf = Conf.getInstance();

    // ServerLogクラスインスタンス取得
    var _log = ServerLog.getInstance();

    // RedisConnectorクラスインスタンス取得
    var _redisConnector = RedisConnector.getInstance();

    // SpfListManagerクラスインスタンス取得
    var _spfListManager = SpfListManager.getInstance();

    // 外向けのSocketIOのアドレスとポートのリスト管理クラスの取得
    var _outsideSocketIOServerListManager = OutsideSocketIOServerListManager.getInstance();

    // 定数定義
    var CONTENT_TYPE_MULTIPART = 'multipart';
    var GET_DESTINATION_HOST = 'get_destination_host';
    // Unused variable CONF_KEY_SOCKET_IO_PORT.
    // var CONF_KEY_SOCKET_IO_PORT = 'SOCKET_IO_PORT';
    var ASYNCHRONOUS = 'asynchronous';
    var CONF_KEY_DEFAULT_TENANT_NAME = 'DEFAULT_TENANT_NAME';
    var REG_EXP_URL_TENANTNAME = '\/t\/[^\/]+';
    var BODY_KEY_TENANTNAME = 'tenantName';
    var API_LOGIN = 'Login';
    var CONF_KEY_REQUEST_TIMEOUT = 'REQUEST_TIMEOUT';
    var CONF_KEY_SYSTEM_LOCATION_ROOT = 'SYSTEM_LOCATION_ROOT';

    function SpfServer() {
        // 外向けのSocketIOのアドレスとポート読み込み
        _outsideSocketIOServerListManager.loadList(function(){});
    }

    // Cubeeサーバroundrobin用変数
    var serverCnt = 0;
    // デフォルトテナント名
    var defaultTenantname = null;

    var _proto = SpfServer.prototype;

    /*
     * Cubeeサーバへリクエスト送信
     * @param {request} serverRequest リクエスト
     * @param {response} serverResponse レスポンス
     */
    _proto.requestSpfServer = function(serverRequest, serverResponse) {
        // content-type 判定
        var _contentType = serverRequest.headers['content-type'];
        if(_contentType && _contentType.indexOf(CONTENT_TYPE_MULTIPART) != -1){
            // content-type:multipart　の場合
            _log.connectionLog(7,
                'SpfServer.requestSpfServer:: Request content-type:' +
                _contentType);

            this._requestMultipart(serverRequest, serverResponse);
        } else {
            // content-type:multipart　以外の場合
            _log.connectionLog(7,
                'SpfServer.requestSpfServer:: Request content-type is not multipart');

            this._request(serverRequest, serverResponse);
        }
    }

    /*
     * リクエストを送信
     * @param {request} serverRequest リクエスト
     * @param {response} serverResponse レスポンス
     */
    _proto._request = function(serverRequest, serverResponse) {
        var _self = this;

        var _requestUrl = url.parse(serverRequest.url);
        var _body = '';
        var _client = null;
        var _myHost = serverRequest.headers.host;

        serverRequest.on('data', function(data) {
            // リクエストボディを受け取る
            _body += data;
        });
        serverRequest.on('end', function() {
            // redis の準備
            _redisConnector.createRedisClient(_createSpfServerList);
        });

        // 接続先Cubeeサーバリストを生成
        function _createSpfServerList(err, client) {
            if(err) {
                serverResponse.writeHead(404);
                serverResponse.end();
                return;
            }
            _client = client;
            // Cubeeサーバリスト生成
            _spfListManager.loadSpfServerList(client,
                                              false,
                                              _selectDestinationHost);
        }

        // 接続先Cubeeサーバを決定
        function _selectDestinationHost(err) {
            if(err) {
                _log.connectionLog(3,
                    'SpfServer._request:: redis error : ' + err.message);

                serverResponse.writeHead(404);
                serverResponse.end();
                return;
            }
            var _systemLocationRoot = _conf.getConfData(CONF_KEY_SYSTEM_LOCATION_ROOT);
            if(!_systemLocationRoot) {
                _log.connectionLog(3,
                    'SpfServer._request:: SYSTEM LOCATION ROOT Setting is nothing');

                serverResponse.writeHead(404);
                serverResponse.end();
                return;
            }
            var _urlInTenantname = _systemLocationRoot + '/t/';
            var _loginApiFlg = false;
            var _tenantname = null;
            var _tenantnameRegExp = null;
            var _tenantUrl = '';
            var _urlinfo = null;
            var _contentType = '';
            var _objBody = {};

            var _cookieData = {};
            var _cookieSession = '';
            var _cookieSessionData = {};
            var _accesstoken = '';
            var _spfServerList = [];
            var _serverObjList = [];
            var _spfHost = '';
            var _spfPort = null;

            // _body をパース
            if(_body.length > 0) {
                _contentType = serverRequest.headers['content-type'];
                if(_contentType && _contentType.indexOf('json') != -1){
                    // content-type : application/json の場合
                    _objBody = JSON.parse(_body);
                } else {
                    // content-type : text/plain の場合
                    _urlinfo = url.parse( '/?' + _body.toString(), true );
                    _objBody = _urlinfo.query;
                }
            }

            // スマデバ版の場合、URLのテナント名を切り取り、bodyに追加
            if(_requestUrl.path.indexOf(ASYNCHRONOUS) != -1 ||
               _requestUrl.path.indexOf(_urlInTenantname) != -1) {
                _log.connectionLog(7,
                    'SpfServer._request:: This request from smart device');

                // URLのテナント名を切り取る
                if(_requestUrl.path.indexOf('/t/') != -1){
                    _tenantnameRegExp = new RegExp(REG_EXP_URL_TENANTNAME);
                    _tenantUrl = _requestUrl.path.match(_tenantnameRegExp).join('');
                    _tenantname = _tenantUrl.slice(3);
                    _requestUrl.path = _requestUrl.path.replace(_tenantnameRegExp, '');
                }
                if(_objBody && _objBody.request){
                    if(_objBody.request == API_LOGIN){
                        // ログインAPIの場合、bodyにテナント名追加
                        if(!_tenantname){
                            // テナント名が指定されていない場合、config からデフォルトテナント名取得
                            if(defaultTenantname) {
                                _tenantname = defaultTenantname;
                            } else {
                                _tenantname = _conf.getConfData(CONF_KEY_DEFAULT_TENANT_NAME);
                                if (!_tenantname) {
                                    // デフォルトテナント名
                                    _tenantname = 'spf';

                                    _log.connectionLog(4,
                                        'SpfServer._request:: Default Tenantname Setting is nothing');
                                }
                                defaultTenantname = _tenantname;
                            }
                        }
                        _log.connectionLog(7,
                            'SpfServer._request:: _tenantname is ' +
                            _tenantname);

                        _loginApiFlg = true;
                        // リクエスト body にテナント名追加
                        _contentType = serverRequest.headers['content-type'];
                        if(_contentType && _contentType.indexOf('json') != -1){
                            // content-type : application/json の場合
                            if(!_objBody['content']) {
                                _objBody['content'] = {};
                            }
                            // リクエストに、テナント名があるか。あれば、書き換える必要はない
                            if (! (BODY_KEY_TENANTNAME in _objBody.content)) {
                                _objBody['content'][BODY_KEY_TENANTNAME] = _tenantname;
                                _body = JSON.stringify(_objBody);
                            }
                        } else {
                            // content-type : text/plain の場合
                            // リクエストに、テナント名があるか。あれば、書き換える必要はない
                            if (_body.indexOf(BODY_KEY_TENANTNAME + '=') != -1) {
                                _body = BODY_KEY_TENANTNAME + '=' + _tenantname +
                                        '&' + _body;
                            }
                        }
                        serverRequest.headers['content-length'] = _body.length;
                    }
                }
            }

            // アクセストークン確認
            if(serverRequest.headers.cookie) {
                _cookieData = cookie.parse(serverRequest.headers.cookie);
                if(_cookieData['connect.sess']){
                    _cookieSession = _cookieData['connect.sess'];

                    _cookieSession = _cookieSession.replace(new RegExp('^[^{]+'), '');
                    _cookieSession = _cookieSession.replace(new RegExp('[^}]+$'), '');

                    _log.connectionLog(7,
                        'SpfServer._request:: cookie session data : ' + _cookieSession);

                    _cookieSessionData = JSON.parse(_cookieSession);
                    if(_cookieSessionData.accessToken) {
                        // cookie から取得
                        _accesstoken = _cookieSessionData.accessToken;
                    }
                }
            }
            if(_objBody && (_objBody['accesstoken'] || _objBody['accessToken'])){
                // body から取得
                if(_objBody['accesstoken']) {
                    _accesstoken = _objBody['accesstoken'];
                } else {
                    _accesstoken = _objBody['accessToken'];
                }
            }
            if(_accesstoken){
                // accesstoken がある場合
                _log.connectionLog(7,
                    'SpfServer._request:: accessToken exist');

                _getAccessRelationData();
            } else {
                // accesstoken がない場合
                _log.connectionLog(7,
                    'SpfServer._request:: accessToken not exist');

                _selectDestinationHostBySpfServerList();
            }

            // accesstoken がある場合
            function _getAccessRelationData() {
                // redis から中継先を取得
                _client.get(_accesstoken, function(err, spfHost) {
                    if(err) {
                        _log.connectionLog(3,
                            'SpfServer._request:: redis error : ' +
                            err.message);

                        serverResponse.writeHead(404);
                        serverResponse.end();
                        return;
                    }
                    if(!spfHost) {
                        // 中継先が redis から消えている(スマデバ版で30分操作がなかった)場合
                        _log.connectionLog(4,
                            'SpfServer._request:: spfHost is nothing in redis');

                        _selectDestinationHostBySpfServerList();
                    } else {
                        // Cubeeサーバを選択
                        _spfServerList.push(spfHost);
                        _serverObjList = _spfListManager.splitServerList(_spfServerList);
                        if(!_serverObjList[0]) {
                            _log.connectionLog(3,
                                'SpfServer._request:: spfHost format is wrong : ' +
                                spfHost);

                            serverResponse.writeHead(404);
                            serverResponse.end();
                            return;
                        }
                        // CubeeServer にリクエスト送信
                        _sendRequest(_serverObjList[0]['hostname'],
                                     _serverObjList[0]['port']);
                    }
                });
            }

            // accesstoken がない場合
            function _selectDestinationHostBySpfServerList() {
                // Cubeeサーバリスト取得
                _spfServerList = _spfListManager.getSpfServerList();
                if(!_spfServerList[0]) {
                    _log.connectionLog(3,
                        'SpfServer._request:: _spfServerList is nothing');

                    serverResponse.writeHead(404);
                    serverResponse.end();
                    return;
                }
                // Cubeeサーバを取得
                if(serverCnt >= _spfServerList.length){
                    serverCnt = 0;
                }
                _spfHost = _spfServerList[serverCnt]['hostname'];
                _spfPort = _spfServerList[serverCnt]['port'];
                if(_loginApiFlg){
                    serverCnt++;
                }
                // Cubeeサーバへリクエスト送信
                _sendRequest(_spfHost, _spfPort);
            }
        }

        // Cubeeサーバへリクエスト送信
        function _sendRequest(spfHost, spfPort) {
            var _destinationHost = null;
            var _spfSocketPort = null;
            var _reqUrl = '';
            var _uni = null;
            var _locationRegExp = null;
            var _timeout = parseInt(_conf.getConfData(CONF_KEY_REQUEST_TIMEOUT));
            if (isNaN(_timeout)) {
                // デフォルトtimeout値 300sec
                _timeout = 300;
            }
            _timeout = _timeout * 1000;

            // redis コネクション解放
            _redisConnector.quit(_client);

            _log.connectionLog(7,
                'SpfServer._request:: spfHost : ' + spfHost);
            _log.connectionLog(7,
                'SpfServer._request:: spfPort : ' + spfPort);

            // リクエストが get_destination_host.js の場合、javascript を生成して返却
            if(_requestUrl.path.indexOf(GET_DESTINATION_HOST) != -1) {
                // DestinationHostクラスインスタンス生成
                _destinationHost = new DestinationHost();

                serverCnt++;

                // レスポンスデータ生成
                /*
                _spfSocketPort = parseInt(_conf.getConfData(CONF_KEY_SOCKET_IO_PORT));
                if (isNaN(_spfSocketPort)) {
                    // デフォルトポート番号
                    _spfSocketPort = 3000;

                    _log.connectionLog(4,
                        'SpfServer._request:: Socket.io Port Setting is nothing');
                }
                */
                var _socketIOHostAndPort = _outsideSocketIOServerListManager.getHostAndPort(spfHost);
                if(_socketIOHostAndPort == null) {
                    serverResponse.writeHead(404);
                    serverResponse.end();
                    return;
                }
                _destinationHost.createResponseData(_socketIOHostAndPort[0], _socketIOHostAndPort[1]);

                // レスポンス返却
                serverResponse.writeHead(_destinationHost.getStatusCode(),
                                         _destinationHost.getHeader());
                serverResponse.write(_destinationHost.getResponseData());
                serverResponse.end();
                return;
            }

            // クライアントから受け取った通りにリクエスト
            _reqUrl = 'http://' + spfHost + ':' + spfPort + _requestUrl.path;

            _log.connectionLog(7,
                'SpfServer._request:: request URL : ' +
                _reqUrl);
            if(_body.length > 0){
                _log.connectionLog(7,
                    'SpfServer._request:: request data : ' +
                    _body);
            }

            _uni = unirest(serverRequest.method,
                           _reqUrl,
                           serverRequest.headers,
                           _body);
            _uni.encoding(null);
            _uni.followRedirect(false);
            _uni.timeout(_timeout);
            _uni.end(function (response) {
                if(response.error) {
                    if(response.error.code == 'ETIMEDOUT') {
                        _log.connectionLog(3,
                            'SpfServer._request:: Send request error : Timeout ' +
                            (_timeout / 1000) + ' sec');
                    } else {
                        _log.connectionLog(3,
                            'SpfServer._request:: Send request error : ' +
                            response.error.message);
                    }
                    serverResponse.writeHead(404);
                    serverResponse.end();
                    return;
                }
                if(response.code == 301 && response.headers.location) {
                    // この後ろで使う準備
                    var _ = require('lodash');
                    // redirect の location の 自ホスト部分を除去する
                    // 自ホストに該当する正規表現を組み立てる（Request Header の正規表現記号をエスケープし、組み立てる）
                    var _escapedMyHost = _myHost.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    // This regular expression is constructed from a user-provided value.
                    var _safeEscapedMyHost =  _.escapeRegExp(_escapedMyHost); 
                    _locationRegExp = new RegExp('^http\:\/\/' + _safeEscapedMyHost + '\:' + spfPort + '\/');
                    // 自ホスト部分を削除する
                    response.headers.location = response.headers.location.replace(_locationRegExp, '/');
                    serverResponse.writeHead(response.code, {'Location': response.headers.location});
                    serverResponse.end();
                    return;
                }
                // Cubeeサーバから受け取ったデータをクライアントへ送り返す
                serverResponse.writeHead(response.code,
                                         response.headers);
                serverResponse.write(response.raw_body);
                serverResponse.end();
            });
        }
    }

    /*
     * content-type:multipart のリクエストを送信
     * @param {request} serverRequest リクエスト
     * @param {response} serverResponse レスポンス
     */
    _proto._requestMultipart = function(serverRequest, serverResponse) {
        var _self = this;

        var _requestUrl = url.parse(serverRequest.url);
        var _multipartBody = {};
        var _client = null;

        // content-type:multipart のリクエストを解析
        var _form = new multiparty.Form();
        _form.parse(serverRequest, function(err, fields, files) {
            if(err) {
                _log.connectionLog(3,
                    'SpfServer._requestMultipart:: multiparty parse error : ' +
                    err.message);

                serverResponse.writeHead(404);
                serverResponse.end();
                return;
            }
            // body を multipart 用の連想配列にする
            _multipartBody['fields'] = fields;
            _multipartBody['files'] = files;

            // redis の準備
            _redisConnector.createRedisClient(_createSpfServerList);
        });

        // 接続先Cubeeサーバリストを生成
        function _createSpfServerList(err, client) {
            if(err) {
                serverResponse.writeHead(404);
                serverResponse.end();
                return;
            }
            _client = client;

            // Cubeeサーバリスト生成
            _spfListManager.loadSpfServerList(client,
                                              false,
                                              _selectDestinationHost);
        }

        // 接続先Cubeeサーバを決定
        function _selectDestinationHost() {
            var _cookieData = {};
            var _cookieSession = '';
            var _cookieSessionData = {};
            var _accesstoken = '';
            var _spfServerList = [];
            var _serverObjList = [];

            // アクセストークン確認
            if(serverRequest.headers.cookie) {
                _cookieData = cookie.parse(serverRequest.headers.cookie);
                if(_cookieData['connect.sess']){
                    _cookieSession = _cookieData['connect.sess'];

                    _cookieSession = _cookieSession.replace(new RegExp('^[^{]+'), '');
                    _cookieSession = _cookieSession.replace(new RegExp('[^}]+$'), '');

                    _log.connectionLog(7,
                        'SpfServer._requestMultipart:: cookie session data : ' + _cookieSession);

                    _cookieSessionData = JSON.parse(_cookieSession);
                    if(_cookieSessionData.accessToken) {
                        // cookie から取得
                        _accesstoken = _cookieSessionData.accessToken;
                    }
                }
            }
            if(_multipartBody['fields'].accesstoken){
                // body から取得
                _accesstoken = _multipartBody['fields'].accesstoken;
            }
            if(_accesstoken){
                // accesstoken がある場合
                _log.connectionLog(7,
                    'SpfServer._requestMultipart:: accessToken exist');

                _getAccessRelationData();
            } else {
                // accesstoken がない場合
                _log.connectionLog(7,
                    'SpfServer._requestMultipart:: accessToken not exist');

                _selectDestinationHostBySpfServerList();
            }

            // accesstoken がある場合
            function _getAccessRelationData() {
                // redis から中継先を取得
                _client.get(_accesstoken, function(err, spfHost) {
                    if(err) {
                        _log.connectionLog(3,
                            'SpfServer._requestMultipart:: redis error : ' +
                            err.message);

                        serverResponse.writeHead(404);
                        serverResponse.end();
                        return;
                    }
                    if(!spfHost) {
                        // 中継先が redis から消えている(スマデバ版で30分操作がなかった)場合
                        _log.connectionLog(4,
                            'SpfServer._requestMultipart:: spfHost is nothing in redis');

                        _selectDestinationHostBySpfServerList();
                    } else {
                        // Cubeeサーバを選択
                        _spfServerList.push(spfHost);
                        _serverObjList = _spfListManager.splitServerList(_spfServerList);
                        if(!_serverObjList[0]) {
                            _log.connectionLog(3,
                                'SpfServer._requestMultipart:: spfHost format is wrong : ' +
                                spfHost);

                            serverResponse.writeHead(404);
                            serverResponse.end();
                            return;
                        }
                        // Cubeeサーバにリクエスト送信
                        _sendRequest(_serverObjList[0]['hostname'],
                                     _serverObjList[0]['port']);
                    }
                });
            }

            // accesstoken がない場合
            function _selectDestinationHostBySpfServerList() {
                // Cubeeサーバリスト取得
                _spfServerList = _spfListManager.getSpfServerList();
                if(!_spfServerList[0]) {
                    _log.connectionLog(3,
                        'SpfServer._requestMultipart:: _spfServerList is nothing');

                    serverResponse.writeHead(404);
                    serverResponse.end();
                    return;
                }
                // Cubeeサーバを選択
                if(serverCnt >= _spfServerList.length){
                    serverCnt = 0;
                }
                // Cubeeサーバにリクエスト送信
                _sendRequest(_spfServerList[serverCnt]['hostname'],
                             _spfServerList[serverCnt]['port']);
            }
        }

        // Cubeeサーバへリクエスト送信
        function _sendRequest(spfHost, spfPort) {
            var _reqUrl = '';
            var _uni = null;
            var _timeout = parseInt(_conf.getConfData(CONF_KEY_REQUEST_TIMEOUT));
            var _fileData = {};

            if (isNaN(_timeout)) {
                // デフォルトtimeout値 300sec
                _timeout = 300;
            }
            _timeout = _timeout * 1000;

            // redis コネクション解放
            _redisConnector.quit(_client);

            _log.connectionLog(7,
                'SpfServer._requestMultipart:: spfHost : ' + spfHost);
            _log.connectionLog(7,
                'SpfServer._requestMultipart:: spfPort : ' + spfPort);

            // クライアントから受け取った通りにリクエスト
            _reqUrl = 'http://' + spfHost + ':' + spfPort + _requestUrl.path;

            _log.connectionLog(7,
                'SpfServer._requestMultipart:: request URL : ' +
                _reqUrl);
            _log.connectionLog(7,
                'SpfServer._requestMultipart:: request data : ' +
                JSON.stringify(_multipartBody));

            _uni = unirest(serverRequest.method,
                    _reqUrl,
                    serverRequest.headers);
            // body のパラメータを追加
            // Variable _fielodsKey is used like a local variable, but is missing a declaration.
            var _fielodsKey;
            for(_fielodsKey in _multipartBody['fields']) {
                _uni.field(_fielodsKey, _multipartBody['fields'][_fielodsKey][0]);
            }
            // body のファイルデータを追加
            // Variable _filesKey is used like a local variable, but is missing a declaration.
            var _filesKey;
            for(_filesKey in _multipartBody['files']) {
                _fileData = _multipartBody['files'][_filesKey][0];

                _uni.attach(_filesKey, _fileData.path, {
                    filename: _fileData.originalFilename,
                    knownLength: _fileData.size,
                    contentType: _fileData.headers['content-type']
                });
            }
            _uni.encoding(null);
            _uni.followRedirect(false);
            _uni.timeout(_timeout);
            _uni.end(function (response) {
                // tmp のアップロードデータを削除
                // Variable _filesKey is used like a local variable, but is missing a declaration.
                var _filesKey;
                for(_filesKey in _multipartBody['files']) {
                    _fileData = _multipartBody['files'][_filesKey][0];

                    fs.unlink(_fileData.path, function(fsErr) {
                        if(fsErr) {
                            _log.connectionLog(3,
                                'SpfServer._requestMultipart:: Delete failure file ' +
                                _fileData.path + ' : ' + fsErr.message);
                        } else {
                            _log.connectionLog(7,
                                'SpfServer._requestMultipart:: Successfully file deleted :' +
                                _fileData.path);
                        }
                    });
                }
                if(response.error) {
                    if(response.error.code == 'ETIMEDOUT') {
                        _log.connectionLog(3,
                            'SpfServer._requestMultipart:: Send request error : Timeout ' +
                            (_timeout / 1000) + ' sec');
                    } else {
                        _log.connectionLog(3,
                            'SpfServer._requestMultipart:: Send request error : ' +
                            response.error.message);
                    }
                    serverResponse.writeHead(404);
                    serverResponse.end();
                    return;
                }

                // Cubeeサーバから受け取ったデータをクライアントへ送り返す
                serverResponse.writeHead(response.code,
                                         response.headers);
                serverResponse.write(response.raw_body);
                serverResponse.end();
            });
        }
    }

    var _spfServer = new SpfServer();

    SpfServer.getInstance = function() {
        return _spfServer;
    }

    exports.getInstance = SpfServer.getInstance;

})();
