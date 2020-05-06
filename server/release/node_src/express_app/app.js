(function() {

    // SSL 3.0無効化用モジュール読み込み
    var constants = require('constants');
    // 設定ファイルデータモジュールの読み込み
    var fs = require('fs');
    var Utils = require('../scripts/utils');
    var Conf = require('../scripts/controller/conf');
    var _conf = Conf.getInstance();
    // ログAPIモジュールの読み込み
    var ServerLog = require('../scripts/controller/server_log');
    var log = ServerLog.getInstance();

    // CubeeWepAPIモジュールの読み込み
    var CubeeWebApi = require('../scripts/controller/cubee_web_api');

    // ImageFileUtilsモジュールの読み込み
    var ImageFileUtils = require('../scripts/controller/image_file_utils');

    // FileUtilsモジュールの読み込み
    var FileUtils = require('../scripts/controller/file_utils');

    // urlモジュールの読み込み
    var _url = require('url');

    // セッション管理モジュールの読み込み
    var SessionDataMannager = require('../scripts/controller/session_data_manager');

    // 　XMPPサーバ接続用ラッパー
    var SynchronousBridgeNodeXmpp = require('../scripts/controller/synchronous_bridge_node_xmpp');

    //
    var ShortenURLUtils = require('../scripts/controller/shorten_url_utils');

    var RequestData = require('../scripts/model/request_data').RequestData;

    var FileConvert = require('../scripts/controller/file_convert');
    var _fileConv = FileConvert.getInstance();

    // AccessTokenをキーとした中継先情報の時限延長モジュールの読み込み
    var StoreVolatileChef = require('../scripts/lib/CacheHelper/store_volatile_chef');

    let CodiMDApi = require('../scripts/controller/codimd/api');
    let OGPApi    = require('../scripts/controller/ogp/api');
    let GlobalSnsDB = require('../scripts/controller/codimd/db_store');

    // リクエストURLパス
    var REQUEST_URL_PATH_USER = 'user';
    var REQUEST_URL_PATH_USER_TYPE_AVATAR = 'avatar';
    var REQUEST_URL_PATH_COMM = 'comm';
    var REQUEST_URL_PATH_COMM_TYPE_LOGO = 'logo';

    // テナントUUIDの正規表現
    var REG_EXP_TENANTUUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

    //express処理
    var express = require('express')
      , login = require('./routes/login')
      , user = require('./routes/tenant/user/user')
      // Terminate "signup" function
      //, signup = require('./routes/signup')
      , path = require('path')
  //    define favicon delete because of it is unused by TM  
  //  , favicon = require('serve-favicon')
      , morgan = require('morgan')
      , cookieParser = require('cookie-parser')
      , cookieSession = require('cookie-session')
      // add csurf. by TM 20200430
      , csrf = require('csurf')
      , serveStatic = require('serve-static')
      , bodyParser = require('body-parser')
      , methodOverride = require('method-override')
      , errorHandler = require('errorhandler')
      , multer = require('multer');


    var app = express();
    // image_dir is not used, so delete it. by TM
    // var image_dir = '../../html/images';

    var location = _conf.getConfData('SYSTEM_LOCATION_ROOT');

    // all environments
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    // faviconは使用していないため、コメントアウト。
    // nodejsのdockerイメージから、nginxが分離し、htmlファイル群も離れて参照不可となった点に注意
    // app.use(favicon(path.join( __dirname , image_dir, 'favicon.ico')));
    app.use(morgan('combined'));
    app.use(function(req, res, next) {
        // 非同期APIはcontent-typeがapplication/jsonでないとうまくbodyPaserでパースできないので、上書きする
        var _index = req.url.indexOf(location + '/asynchronous');
        if(_index == 0) {
            req.headers['content-type'] = 'application/json';
        }
        next();
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true, uploadDir: './tmp'}));
    app.use(methodOverride());
    // add semi colum to end of sentense. by TM 20200430
    app.use(cookieParser());
    app.use(cookieSession({
        // The hard-coded value "admintool session" is used as key. 
        // 環境変数にしたほうが良い
        secret:"admintool session",
        cookie: {
            maxAge: 60 * 30 * 1000
        }
    }));
    // This cookie middleware is serving a request handler 5 Values without CSRF protection.
    // add 
    app.use(csrf({ cookie:true }));

    // Terminate "signup" function
    app.use(location + '/admintool', serveStatic (path.join(__dirname, '/public')));

    // development only
    if ('development' == app.get('env')) {
        app.use(errorHandler());
    }

    // Terminate "signup" function
    ////signupの設定
    ////ユーザ新規登録画面表示(セルフ登録)
    //app.get(location + '/signup', signup.show);
    //app.post(location + '/signup', signup.createUser);


    // 短縮URLをredirect
    app.get(location + '/redir/*', onRedirect);
    app.post(location + '/redir/*', onRedirectPost);

    //ログイン画面表示
    app.get(location + '/admintool', login.start);
    //ログイン処理実行
    app.post(location + '/admintool/login', login.execLogin);
    // ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※
    // ※ここから下はログイン認証が通ってから、リクエストを受け付けること ※
    // ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※ ※
    //ユーザ一覧画面表示
    app.get(location + '/admintool/tenant/:tid/user', _loginCheckForAdminTool, user.list);
    //ユーザ新規登録画面表示
    app.get(location + '/admintool/tenant/:tid/user/new', _loginCheckForAdminTool, user.reg);
    //ユーザ一括登録
    app.get(location + '/admintool/tenant/:tid/user/csvreg', _loginCheckForAdminTool, user.csvreg);
    //ユーザ一括更新
    app.get(location + '/admintool/tenant/:tid/user/csvupd', _loginCheckForAdminTool, user.csvupd);
    //ユーザパスワード再設定
    app.get(location + '/admintool/tenant/:tid/user/:uid/update', _loginCheckForAdminTool, user.update);
    //ユーザ削除(app.delはexpress的に実装のないアプリケーション関数と思われるので一時コメントアウト、ソース的にエラーになっていたため)
    //    app.del(location + '/admintool/tenant/:tid/user/:uid', _loginCheckForAdminTool, user.deleteUser);
    //ユーザ新規登録処理
    app.post(location + '/admintool/tenant/:tid/user/new', _loginCheckForAdminToolWithCsrfMeasure, user.createUser);
    //ユーザパスワード再設定処理
    app.post(location + '/admintool/tenant/:tid/user/:uid/update', _loginCheckForAdminToolWithCsrfMeasure, user.updateUser);
    //ユーザ一括登録処理
    app.post(location + '/admintool/tenant/:tid/user/csvreg', _loginCheckForAdminToolWithCsrfMeasure, user.execBatchCreate);
    //ユーザ一括更新処理
    app.post(location + '/admintool/tenant/:tid/user/csvupd', _loginCheckForAdminToolWithCsrfMeasure, user.execBatchUpdate);
    //ユーザ一覧ファイル取得処理
    app.get(location + '/admintool/tenant/:tid/user/csvuserlist', _loginCheckForAdminTool, user.getUserListCsvFile);
    //ユーザステータス更新処理
    app.post(location + '/admintool/tenant/:tid/user/:uid/status', _loginCheckForAdminToolWithCsrfMeasure, user.updateUserAccountStatus);


    //cubee用の設定
    app.get(location + '/' + REG_EXP_TENANTUUID + '/user/*', _onRequest);
    app.get(location + '/' + REG_EXP_TENANTUUID + '/comm/*', _onRequest);
    app.get(location + '/asynchronous/*', _onRequest);
    app.post(location + '/' + REG_EXP_TENANTUUID + '/user/*', _onRequest);
    app.post(location + '/' + REG_EXP_TENANTUUID + '/comm/*', _onRequest);
    app.post(location + '/asynchronous/*', _onRequest);
    // app.post(location + '/uploaduseravatar', _onUploadUserAvatar);
    app.post(location + '/uploadcommunitylogo', _onUploadCommunityLogo);
    app.post(location + '/fileupload', _onFileUpload);
    app.post(location + '/filedownload', _onFileDownload);
    // This route handler performs 4 Values, but is not rate-limited.
    // set up rate limiter: maximum of five requests per minute
    var RateLimit = require('express-rate-limit');
    var limiter = new RateLimit({
        windowMs: 1*60*1000, // 1 minute
        max: 5
    });
    // apply rate limiter to uploaduseravtar
    app.use(location + '/uploaduseravatar', limiter);
    app.post(location + '/uploaduseravatar', _onUploadUserAvatar);

    let _globalSnsDB = new GlobalSnsDB('/opt/cubee/cmnconf/spf_globalsns_dbs.json');
    // ノート機能設定を参照し、TRUEの場合のみエンドポイントを有効化する
    var enableNote = _conf.getConfData('ENABLE_NOTE').toUpperCase();
    if (enableNote == 'TRUE') {
        log.connectionLog(7, 'note enabled!');
        app.use(location    + '/codimd/login', limiter);
        app.post(location   + '/codimd/login',
                (req, res)=> {
                    CodiMDApi.Login(req,res,_globalSnsDB)
                });
        app.post(location   + '/codimd/new',
                (req,res)=>{
                    CodiMDApi.getNewNoteUrl(req,res,_globalSnsDB)
                });
        app.use(location    + '/codimd/redirect', limiter);
        app.post(location   + '/codimd/redirect',
                (req,res)=>{
                    CodiMDApi.LoginRedirect(req,res,_globalSnsDB)
                });
        app.post(location   + '/codimd/list',
                (req,res)=>{
                    CodiMDApi.getNoteList(req,res,_globalSnsDB)
                });
        app.post(location   + '/codimd/setcubee',
                (req,res)=>{
                    CodiMDApi.joinNoteToCubeeMesssage(req,res,_globalSnsDB)
                });
        app.delete(location + '/codimd/delete/:id',
                (req,res)=>{
                    CodiMDApi.deleteNote(req,res,_globalSnsDB)
                });
        app.post(location   + '/codimd/rename',
                (req,res)=>{
                    CodiMDApi.renameNoteOnCubee(req,res,_globalSnsDB)
                });
    }
    
    //OGPApi
    app.post(location + '/i/ogp/get',
            (req,res)=>{
                OGPApi.getOGP(req, res);
            });

    function start() {
        // HTTP
        var _httpPort = parseInt(_conf.getConfData('HTTP_PORT'));
        if (isNaN(_httpPort)) {
            log.connectionLog(6, 'HTTP Port Setting is nothing');
        } else {
            // httpモジュールの読み込み
            var _http = require('http');
            //HTTP Webサーバオブジェクト生成
            _http.createServer(app).listen(_httpPort);
        }

        // HTTPS
        var _httpsPort = parseInt(_conf.getConfData('HTTPS_PORT'));
        if (isNaN(_httpsPort)) {
            log.connectionLog(6, 'HTTP SSL Port Setting is nothing');
        } else {
            var _sslCertificateFile = _conf.getConfData('HTTPS_SSL_CERTIFICATE_PATH');
            var _sslCertificateKeyFile = _conf.getConfData('HTTPS_SSL_CERTIFICATE_KEY_PATH');
            if (_sslCertificateFile == '' || _sslCertificateKeyFile == '') {
                log.connectionLog(6, 'HTTP SSL Setting is invalid');
            } else {
                var _option = {
                    key : fs.readFileSync(_sslCertificateKeyFile).toString(),
                    cert : fs.readFileSync(_sslCertificateFile).toString(),
                    secureProtocol: 'SSLv23_method',
                    secureOptions: constants.SSL_OP_NO_SSLv3
                };
                //HTTPS通信モジュール読み込み
                var _https = require('https');
                //HTTPS Webサーバオブジェクト生成
                _https.createServer(_option, app).listen(_httpsPort);
            }
        }
    };

    //クライアントからサーバーにリクエストイベントがあった時に発生するコールバック関数
    function _onRequest(request, response) {
        var _pathName = _url.parse(request.url).pathname;
        var _userRegExpStr = '\/' + REG_EXP_TENANTUUID + '\/' + REQUEST_URL_PATH_USER + '\/';
        var _userRegExp = new RegExp(_userRegExpStr, 'i');
        var _commRegExpStr = '\/' + REG_EXP_TENANTUUID + '\/' + REQUEST_URL_PATH_COMM + '\/';
        var _commRegExp = new RegExp(_commRegExpStr, 'i');
        if(_pathName.match(_userRegExp)){
            _onUserDataRequest(request, response);
        } else if(_pathName.match(_commRegExp)) {
            _onCommunityDataRequest(request, response);
        } else {
            serverExec(request, response);
        }
    };

    //CubeeWebApiの受け付け処理
    function serverExec(request, response) {
        var pathname = _url.parse(request.url).pathname;
        var remoteIP = request.connection.remoteAddress;
        var clientIP = request.headers['x-forwarded-for'];
        var socket = request.connection;
        socket.disconnect = function(){};
        socket.send = function(){};
        socket.clientIP = (clientIP != null || clientIP != '')? clientIP : remoteIP;
        log.connectionLog(7, 'Request for ' + pathname + ' received.');
        log.connectionLog(7, 'HTTP received');
        log.connectionLog(7, 'remoteIP : ' + remoteIP);
        log.connectionLog(7, 'clientIP : ' + clientIP);
        request.setEncoding('utf8');
        var _requestData = '';

        //JSON文字列へ変換
        _requestData = JSON.stringify(request.body);
        CubeeWebApi.getInstance().receive(socket, _requestData, callBack, true);

        function callBack(responseStr){
            log.connectionLog(7, 'do func app.js serverExec  responce do callBack');
            //クライアントとのセッションをクリア　& 30分間接続がなければOpenfireとのセッションをクリアする
            CubeeWebApi.getInstance().notifyDisconnect(socket);
            //レスポンス
            response.set({
                "Content-Type" : "application/json",
                "Access-Control-Allow-Origin": "*"
            });
            log.connectionLog(7, 'request data : ' + _requestData);
            log.connectionLog(7, 'response data request : ' + responseStr);
            response.status(200).send(responseStr);
            response.end();
            _requestData = '';
        };
    };

    //画像ファイルデータなどのユーザデータの受け付け処理
    function _onUserDataRequest(request, response) {
        var _pathName = _url.parse(request.url).pathname;
        var _extensionAvatarImageStr = '\/' + REG_EXP_TENANTUUID + '\/' + REQUEST_URL_PATH_USER + '\/.+\/' + REQUEST_URL_PATH_USER_TYPE_AVATAR + '\/';
        var _extensionAvatarImageReg = new RegExp(_extensionAvatarImageStr, 'i');
        if(_pathName.match(_extensionAvatarImageReg)){
             //アバター画像取得かどうか
            _onGetAvatarImageRequest(request, response);
            return;
        }
        log.connectionLog(3, 'URL request is Invalid : ' + _pathName);
        response.writeHead(404);
        response.end();
    };

    //アバター画像取得の受け付け処理
    function _onGetAvatarImageRequest(request, response) {
        var _requestData = '';
        var _pathName = _url.parse(request.url).pathname;
        var _extensionAvatarImageStr = '\/' + REG_EXP_TENANTUUID + '\/' + REQUEST_URL_PATH_USER + '\/.+\/' + REQUEST_URL_PATH_USER_TYPE_AVATAR + '\/.+';
        var _extensionAvatarImageReg = new RegExp(_extensionAvatarImageStr, 'i');
        var _avatarImagePath = _pathName.match(_extensionAvatarImageReg);
        if(!_avatarImagePath){
            log.connectionLog(3, 'URL request is Invalid : ' + _pathName);
            response.writeHead(404);
            response.end();
            // The value assigned to _requestData here is unused.
            // _requestData = '';
           return;
        }

        var _imageFileData = ImageFileUtils.getInstance().getFileData(_avatarImagePath);
        if(_imageFileData == null){
            log.connectionLog(3, '_imageFileData is null ');
            response.writeHead(404);
            response.end();
            // The value assigned to _requestData here is unused.
            // _requestData = '';
            return;
        }
        var _imageType = _imageFileData.type;
        var _imageBinary = _imageFileData.binary;
        response.set({
            "Content-Type" : _imageType,
            "Access-Control-Allow-Origin": "*",
        });
        response.status(200).send(_imageBinary);
        response.end();
        // The value assigned to _requestData here is unused.
        // _requestData = '';
    };

    //コミュニティデータの受け付け処理
    function _onCommunityDataRequest(request, response) {
        var _pathName = _url.parse(request.url).pathname;
        var _logoImageRegExpStr = '\/' + REG_EXP_TENANTUUID + '\/' + REQUEST_URL_PATH_COMM + '\/.+\/' + REQUEST_URL_PATH_COMM_TYPE_LOGO + '\/';
        var _logoImageRegExp = new RegExp(_logoImageRegExpStr, 'i');
        if(_pathName.match(_logoImageRegExp)){
             //コミュニティロゴ画像取得かどうか
            _onGetCommunityLogoImageRequest(request, response);
            return;
        }
        log.connectionLog(3, 'URL request is Invalid : ' + _pathName);
        response.writeHead(404);
        response.end();
    };

    //コミュニティロゴ画像取得の受け付け処理
    function _onGetCommunityLogoImageRequest(request, response) {
        // local variable _requestData is not used.
        // var _requestData = '';
        var _pathName = _url.parse(request.url).pathname;
        var _logoImageRegExpStr = '\/' + REG_EXP_TENANTUUID + '\/' + REQUEST_URL_PATH_COMM + '\/.+\/' + REQUEST_URL_PATH_COMM_TYPE_LOGO + '\/.+';
        var _logoImageRegExp = new RegExp(_logoImageRegExpStr, 'i');
        var _logoImagePath = _pathName.match(_logoImageRegExp);
        if(!_logoImagePath){
            log.connectionLog(3, 'URL request is Invalid : ' + _pathName);
            response.writeHead(404);
            response.end();
            // The value assigned to _requestData here is unused.
            // _requestData = '';
           return;
        }

        var _imageFileData = ImageFileUtils.getInstance().getFileData(_logoImagePath);
        if(_imageFileData == null){
            log.connectionLog(3, '_imageFileData is null ');
            response.writeHead(404);
            response.end();
            // The value assigned to _requestData here is unused.
            // _requestData = '';
            return;
        }
        var _imageType = _imageFileData.type;
        var _imageBinary = _imageFileData.binary;
        response.set({
            "Content-Type" : _imageType,
            "Access-Control-Allow-Origin": "*",
        });
        response.status(200).send(_imageBinary);
        response.end();
        // The value assigned to _requestData here is unused.
        // _requestData = '';
    };

    //admintool用のログインチェック処理
    // 使い方
    //     app.post(url, loginCheckForAdminTool, 処理);
    //     app.get(url, loginCheckForAdminTool, 処理);
    function _loginCheckForAdminTool(req, res, next) {
        if(req.session.accessToken){
            var _sessionDataMannager = SessionDataMannager.getInstance();
            var _sessionData = _sessionDataMannager.get(req.session.accessToken);
            if(_sessionData == null) {
                res.redirect(location + '/admintool');
            } else {
                // URLのテナントUUIDとsessionDataのテナントUUIDが等しいくない場合はログイン画面へリダイレクト
                if(req.params.tid != _sessionData.getTenantUuid()) {
                    res.redirect(location + '/admintool');
                } else {
                    // Redisの中継先情報の時限を更新する
                    StoreVolatileChef.getInstance().extend(req.session.accessToken, null);
                    next();
                }
            }
        }else{
            res.redirect(location + '/admintool');
        }
    };

    // CSRF(クロスサイト・リクエストフォージェリ)対策したログインチェック
    // 主にデータ更新やデータ追加の処理の場合にここを使う
    function _loginCheckForAdminToolWithCsrfMeasure(req, res, next) {
        upload(req, res, function(err){
            // CSRF対策関数
            function csrfMeasures() {
                // アクセストークンのハッシュがパラメータとして含まれているか確認
                var _accessToken = req.session.accessToken;
                var _accessTokenHash = req.body.ATH;
                if(Utils.sha256Hex(_accessToken) == _accessTokenHash) {
                    next();
                } else {
                    res.redirect(location + '/admintool');
                }
            }
            // まずはアクセストークンチェック
            _loginCheckForAdminTool(req, res, csrfMeasures);
        })
    };

    //アバター画像アップロード時のコールバック関数
    function _onUploadUserAvatar(request, response) {
        var _data = {result : "failed"};
        var _accessToken = request.body.accesstoken;
        var _account = request.body.account;
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(_accessToken);
        if(request.files == null) {
            log.connectionLog(3, '_onUploadUserAvatar:: files is Invalid ');
            _sendResponce(_data);
            return;
        }
        var _avatarFile = request.files.avatarfile;
        log.connectionLog(7, '_onUploadUserAvatar:: _avatarFile : ' + JSON.stringify(_avatarFile));
        if(_avatarFile == null){
            log.connectionLog(3, '_onUploadUserAvatar:: _avatarFile is Invalid ');
            _sendResponce(_data);
            return;
        }
        var _avatarFileSize = _avatarFile.size;
        var _tmpFilePath = _avatarFile.path;
        //700KB以上ならエラー
        if(_avatarFileSize > 700 * 1024){
            log.connectionLog(3, '_onUploadUserAvatar:: _avatarFileSize is Over 700KB ');
            _sendResponce(_data);
            fs.unlinkSync(_tmpFilePath);
            return;
        }

        if(_sessionData == null) {
            log.connectionLog(3, '_onUploadUserAvatar:: _sessionData is Invalid ');
            _sendResponce(_data);
            fs.unlinkSync(_tmpFilePath);
            return;
        }
        if(_account != _sessionData.getLoginAccout()) {
            log.connectionLog(3, '_onUploadUserAvatar:: _account is Invalid :' + _account);
            _sendResponce(_data);
            fs.unlinkSync(_tmpFilePath);
            return;
        }

        var _fileExt = path.extname(_avatarFile.name);
        var _tenantUuid = _sessionData.getTenantUuid();
        var _newImageFilePath = ImageFileUtils.getInstance().moveToUserFilePath(_tenantUuid, _sessionData.getJid(), _tmpFilePath, _fileExt, ImageFileUtils.USE_TYPE_AVATER, ImageFileUtils.PREFIX_ORIGINAL);
        log.connectionLog(7, '_onUploadUserAvatar:: _newImageFilePath : ' + _newImageFilePath);
        if(_newImageFilePath == null){
            log.connectionLog(3, '_onUploadUserAvatar:: _newImageFilePath is Invalid ');
            _sendResponce(_data);
            fs.unlinkSync(_tmpFilePath);
            return;
        }
        var _newImageFileName = path.basename(_newImageFilePath);
        _data = {
            result:"success",
            path:_newImageFilePath,
            filename:_newImageFileName,
        };
        _sendResponce(_data);

        function _sendResponce(jsonObj){
            var _data = JSON.stringify(jsonObj);
            log.connectionLog(7, '_onUploadUserAvatar:: Responce data : ' + _data);
            response.set({
                "Content-Type" : "text/html",
                "Access-Control-Allow-Origin": "*",
            });
            response.status(200).send(_data);
            response.end();
        };
    };

    // コミュニティロゴ画像アップロード時
    function _onUploadCommunityLogo(request, response) {
        upload(request, response, function(err){
            var _data = {result : "failed"};
            var _accessToken = request.body.accesstoken;
            var _account = request.body.account;
            var _communityRoomId = request.body.roomid;
            var _sessionDataMannager = SessionDataMannager.getInstance();
            var _sessionData = _sessionDataMannager.get(_accessToken);

            if(request.files == null) {
                log.connectionLog(3, '_onUploadCommunityLogo:: files is Invalid ');
                _sendResponce(_data);
                return;
            }
            var _logoFile = request.files[0];
            log.connectionLog(7, '_onUploadCommunityLogo:: _logoFile : ' + JSON.stringify(_logoFile));
            if(_logoFile == null){
                log.connectionLog(3, '_onUploadCommunityLogo:: _logoFile is Invalid ');
                _sendResponce(_data);
                return;
            }
            var _logoFileSize = _logoFile.size;
            var _tmpFilePath = _logoFile.path;
            //700KB以上ならエラー
            if(_logoFileSize > 700 * 1024){
                log.connectionLog(3, '_onUploadCommunityLogo:: _logoFileSize is Over 700KB ');
                _sendResponce(_data);
                fs.unlinkSync(_tmpFilePath);
                return;
            }

            if(_sessionData == null) {
                log.connectionLog(3, '_onUploadCommunityLogo:: _sessionData is Invalid ');
                _sendResponce(_data);
                fs.unlinkSync(_tmpFilePath);
                return;
            }
            if(_account != _sessionData.getLoginAccout()) {
                log.connectionLog(3, '_onUploadCommunityLogo:: _account is Invalid :' + _account);
                _sendResponce(_data);
                fs.unlinkSync(_tmpFilePath);
                return;
            }
            var _tenantUuid = _sessionData.getTenantUuid();

            // コミュニティオーナーかチェック
            var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
            var _getCommunityMemberContent = {
                type : 'CommunityMemberInfo',
                roomId : _communityRoomId
            };
            if(_synchronousBridgeNodeXmpp.getGroup(_accessToken, _getCommunityMemberContent, _onGetCommunityMemberCallback) == false) {
                log.connectionLog(3, '_onUploadCommunityLogo:: getCommunityMember is Failed :' + _communityRoomId);
                _sendResponce(_data);
                fs.unlinkSync(_tmpFilePath);
                return;
            }
            function _onGetCommunityMemberCallback(result, reason, extras, count, items) {
                if(result == false) {
                    log.connectionLog(3, '_onUploadCommunityLogo:: onGetCommunityMember is Failed :' + _communityRoomId);
                    _sendResponce(_data);
                    fs.unlinkSync(_tmpFilePath);
                    return;
                }
                if(items == null) {
                    log.connectionLog(3, '_onUploadCommunityLogo(onGetCommunityMember):: items is null :' + _communityRoomId);
                    _sendResponce(_data);
                    fs.unlinkSync(_tmpFilePath);
                    return;
                }
                if(items.length == 0) {
                    log.connectionLog(3, '_onUploadCommunityLogo(onGetCommunityMember):: items.length is 0 :' + _communityRoomId);
                    _sendResponce(_data);
                    fs.unlinkSync(_tmpFilePath);
                    return;
                }
                var _item = items[0];
                if(_item.memberItems == null) {
                    log.connectionLog(3, '_onUploadCommunityLogo(onGetCommunityMember):: _item.memberItems is null :' + _communityRoomId);
                    _sendResponce(_data);
                    fs.unlinkSync(_tmpFilePath);
                    return;
                }
                var _memberItems = _item.memberItems;
                var isFind = false;
                var _ownerItems = _memberItems.ownerItems;
                var _generalMemberItems = _memberItems.generalMemberItems;
                if(_ownerItems != null) {
                    for(var _i = 0; _i < _ownerItems.length; _i++) {
                        if(_ownerItems[_i].userName == _account && _ownerItems[_i].status == 0) {
                            // メンバーであるのでOK
                            isFind = true;
                            break;
                        }
                    }
                }
                if(isFind == false) {
                    // オーナーではないのでエラー
                    log.connectionLog(3, '_onUploadCommunityLogo(onGetCommunityMember):: ' + _account + ' is not owner :' + _communityRoomId);
                    _sendResponce(_data);
                    fs.unlinkSync(_tmpFilePath);
                    return;
                }
                // 正常なデータであるので、参照できる場所にファイルをコピーする
                _fileCopyToCommDir();
            };

            function _fileCopyToCommDir() {
                var _fileExt = path.extname(_logoFile.originalname);
                var _jid = _sessionData.getJid();
                var _xmppServerName = _jid.split('@')[1];
                var _ret = ImageFileUtils.getInstance().moveToCommunityFilePath(_tenantUuid, _communityRoomId, _xmppServerName,_tmpFilePath, _fileExt, ImageFileUtils.USE_TYPE_LOGO, ImageFileUtils.PREFIX_ORIGINAL, _onFileCopy);
                if(_ret == false) {
                    _onFileCopy(null);
                }
            }

            function _onFileCopy(newImageFilePath) {
                log.connectionLog(7, '_onUploadCommunityLogo:: newImageFilePath : ' + newImageFilePath);
                if(newImageFilePath == null){
                    log.connectionLog(3, '_onUploadCommunityLogo:: newImageFilePath is Invalid ');
                    _sendResponce(_data);
                    fs.unlinkSync(_tmpFilePath);
                    return;
                }
                var _newImageFileName = path.basename(newImageFilePath);
                _data = {
                    result:"success",
                    path:newImageFilePath,
                    filename:_newImageFileName,
                };
                _sendResponce(_data);
            };

            function _sendResponce(jsonObj){
                var _data = JSON.stringify(jsonObj);
                log.connectionLog(7, '_onUploadCommunityLogo:: Responce data : ' + _data);
                response.set({
                    "Content-Type" : "text/html",
                    "Access-Control-Allow-Origin": "*",
                });
                response.status(200).send(_data);
                response.end();
            };
        })
    };

    var upload = multer({dest: './tmp'}).any();
    //ファイルアップロード
    function _onFileUpload(request, response) {
        upload(request, response, function(err){
            var _data = {result : "failed"};
            var _accessToken = request.body.accesstoken;
            var _sessionDataMannager = SessionDataMannager.getInstance();
            var _sessionData = _sessionDataMannager.get(_accessToken);
            if(request.files == null) {
                log.connectionLog(3, '_onFileUpload:: files is Invalid ');
                _sendResponce(_data);
                return;
            }
            var _uploadFile = request.files[0];
            if(_uploadFile == null){
                log.connectionLog(3, '_onFileUpload:: _uploadFile is Invalid ');
                _sendResponce(_data);
                return;
            }
            log.connectionLog(7, '_onFileUpload:: _uploadFile : ' + JSON.stringify(_uploadFile));

            var _uploadFileSize = _uploadFile.size;
            var _tmpFilePath = _uploadFile.path;
            //20MB以上ならエラー
            if(_uploadFileSize > 20 * 1024 * 1024){
                log.connectionLog(3, '_onFileUpload:: _uploadFileSize is Over 20MB ');
                _sendResponce(_data);
                fs.exists(_tmpFilePath, function (exists){
                    if(exists) {
                        fs.unlink(_tmpFilePath, _onUnlinkComplete);
                    }
                });
                return;
            }

            if(_sessionData == null) {
                log.connectionLog(3, '_onFileUpload:: _sessionData is Invalid ');
                _sendResponce(_data);
                fs.exists(_tmpFilePath, function (exists){
                    if(exists) {
                        fs.unlink(_tmpFilePath, _onUnlinkComplete);
                    }
                });
                return;
            }

            var _tenantUuid = _sessionData.getTenantUuid();
            // 格納フォルダを生成し、ファイルを移動する
            FileUtils.getInstance().moveToFilePath(_tenantUuid, _tmpFilePath, _uploadFile.originalname, _onMoveToFilePathComplete);

            function _onMoveToFilePathComplete(newPath) {
                // Variable '_data' is used before its declaration.
                // 冒頭（543行）とこの後ろの2か所で、定義している。
                var _dataRespFail = {result : "failed"};
                if(newPath == null){
                    log.connectionLog(3, '_onFileUpload:: newPath is Invalid ');
                    _sendResponce(_dataRespFail);
                    fs.exists(_tmpFilePath, function (exists){
                        if(exists) {
                            fs.unlink(_tmpFilePath, _onUnlinkComplete);
                        }
                    });
                    return;
                }

                log.connectionLog(7, '_onFileUpload:: newPath : ' + newPath);

                // サムネイルのURL用パス
                // The initial value of _thumbnailPath is unused, since it is always overwritten.
                // var _thumbnailPath = newPath;
                var _thumbnailPath;
                // 添付ファイルのURLにはテナントUUIDを含めないので、URLエンコード前に除外する
                _thumbnailPath = newPath.replace(new RegExp(REG_EXP_TENANTUUID + '\/'),'');
                // ファイル名とパスをURLエンコード
                var _newFileName = encodeURI(path.basename(_thumbnailPath));
                var _newFilePath = encodeURI(_thumbnailPath);
                // 543行の定義と紛らわしいので、名前を変更
                var _dataSuccess = {
                    result:"success",
                    path:_newFilePath,
                    filename:_newFileName,
                };

                // ファイル加工
                _fileConv.preConvertProcess(newPath, 'thumbnail', _onPreConvert);

                function _onPreConvert(startFunc){
                    // 正常終了
                    _sendResponce(_dataSuccess);

                    // ファイル加工開始
                    if(startFunc != null){
                        setTimeout(function(){
                            log.connectionLog(7, '_onPreConvert:: convert start : ' + newPath);
                            startFunc(_onStartFuncCallback);
                        }, 1);
                    }
                }
                function _onStartFuncCallback(result){
                    if(result){
                        log.connectionLog(7, '_onStartFuncCallback:: convert done');
                    }else{
                        log.connectionLog(4, '_onStartFuncCallback:: convert failed');
                    }
                }
            };

            function _onUnlinkComplete(error) {
                if(error) {
                    log.connectionLog(3, '_onFileUpload:: fileUnlink is error : ' + error);
                }
            };

            function _sendResponce(jsonObj) {
                var _data = JSON.stringify(jsonObj);
                log.connectionLog(7, '_onFileUpload:: Responce data : ' + _data);
                response.set({
                    "Content-Type" : "text/html",
                    "Access-Control-Allow-Origin": "*",
                });
                response.status(200).send(_data);
                response.end();
            };
        })
    };

    //ファイルダウンロード
    function _onFileDownload(request, response) {
        var _proccessResult = false;
        var _accessToken = request.body.accesstoken;
        var _itemId = request.body.itemId;
        var _downloadURL = request.body.downloadURL;
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _sessionData = _sessionDataMannager.get(_accessToken);
        var _system_location_root = _conf.getConfData('SYSTEM_LOCATION_ROOT');

        if(_itemId == null || _itemId == '') {
            log.connectionLog(3, '_onFileDownload:: itemId is Invalid ');
            _sendResponce(_proccessResult);
            return;
        }
        if(_downloadURL == null || _downloadURL == '') {
            log.connectionLog(3, '_onFileDownload:: downloadURL is Invalid ');
            _sendResponce(_proccessResult);
            return;
        }
        if(_sessionData == null) {
            log.connectionLog(3, '_onFileDownload:: _sessionData is Invalid ');
            _sendResponce(_proccessResult);
            return;
        }

        var _tenantUuid = _sessionData.getTenantUuid();
        // ダウンロードファイルのパスを抽出
        FileUtils.getInstance().getRelativeFilePathFromURL(_tenantUuid, _downloadURL, _system_location_root, _onGetDownloadFilePathComplete);

        function _onGetDownloadFilePathComplete(relativeFilePath) {

            if (relativeFilePath == null ||  typeof relativeFilePath != 'string' || relativeFilePath == '') {
                log.connectionLog(3, '_onGetDownloadFilePathComplete:: invalid argument (relativeFilePath).');
                _sendResponce(false);
                return;
            }

            // ファイル名取得
            var _fileName = path.basename(relativeFilePath);

            // RFC 2231 形式での URIエンコード
            _fileName = FileUtils.getInstance().rawurlencode(_fileName);
            log.connectionLog(7, '_onGetDownloadFilePathComplete# RFC 2231 _fileName:  ' + _fileName);

            try {
                log.connectionLog(7, '_onGetDownloadFilePathComplete# Prepare to strem: ' + relativeFilePath);

                var stat = fs.statSync(relativeFilePath);
                var strm = fs.createReadStream(relativeFilePath);
                strm.on('data', function(chunk) {
                    log.connectionLog(7, '_onGetDownloadFilePathComplete# Sending data-length: ' + chunk.length);
                });
                strm.on('end', function() {
                    _sendResponce(true);
                    log.connectionLog(7, '_onGetDownloadFilePathComplete# Done sending: ' + relativeFilePath);
                });
                strm.on('error', function(error) {
                    _sendResponce(false);
                    log.connectionLog(3, '_onGetDownloadFilePathComplete# Error on streaming: ' + relativeFilePath + ' : ' + error);
                });

                response.writeHead(200, {
                    'Accept-Ranges' : 'bytes',
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type' : 'application/octet-stream',
                    'Content-Disposition' : 'attachment;filename*=UTF-8\'\'' + _fileName,
                    'Content-Length' : stat.size
                });

                // Start to stream
                log.connectionLog(7, '_onGetDownloadFilePathComplete# Start to strem.. ' + relativeFilePath);
                strm.pipe(response);

            } catch (err) {
                 log.connectionLog(3, '_onGetDownloadFilePathComplete# Failed: ' + relativeFilePath + ' : ' + err);
                _sendResponce(false);
            }

        };

        function _sendResponce(result){
            log.connectionLog(7, '_onFileDownload:: Responce result : ' + result);
            if(result == false) {
                var _data = { result : 'failed'};
                var _returnData = JSON.stringify(_data);
                response.status(200).send(_returnData);
            }
            response.end();
        };
    };

    function onRedirect(request, response) {
        var _urlid = _extractionRedirectIdFromUrlPath(request.path);
        if (_urlid == null) {
            // 短縮URLでないものが来た
            log.connectionLog(4, "onRedirect: not shorten url:" + request.path);
            response.writeHead(404);
            response.end();
            return;
        }

        ShortenURLUtils.getExpandedURL(_urlid, onGetExpandedURL);

        function onGetExpandedURL(err, originalURL) {
            // 応答する
            _responseExpandedURL(err, originalURL, request, response);
        }
    };

    // 短縮URLのPOSTでのアクセス（ログの出力機能付き）
    function onRedirectPost(request, response) {
        var _urlid = _extractionRedirectIdFromUrlPath(request.path);
        if (_urlid == null) {
            // 短縮URLでないものが来た
            log.connectionLog(4, "onRedirectPost: not shorten url:" + request.path);
            response.writeHead(404);
            response.end();
            return;
        }
        ShortenURLUtils.getExpandedURL(_urlid, onGetExpandedURL);

        function onGetExpandedURL(err, originalURL) {
            // 先に応答する
            _responseExpandedURL(err, originalURL, request, response);

            // ログに出力する
            if (err != null || originalURL == null) {
                // エラーなので終了
                return;
            }
            // ロギングするデータを収集する
            var _accessToken = request.body.accesstoken;
            var _itemId = request.body.itemId;
            // アカウントを取得
            var _account = '';
            var _nickName = '';
            var _affiliation = [];
            var _sessionDataMannager = SessionDataMannager.getInstance();
            var _sessionData = _sessionDataMannager.get(_accessToken);

            if(_itemId == null || _itemId == '') {
                log.connectionLog(3, 'onRedirectPost:: itemId is Invalid ');
                _itemId = '';
            }
            function _onSearchPersonCallback(requestResult, requestReason, requestExtras, requestCount, requestItems) {
                if(requestResult) {
                    if(requestItems != null && requestItems[0] != null) {
                        var _data = requestItems[0];
                        // ニックネームを取り出す
                        if(_data.nickName != null) {
                            _nickName = _data.nickName;
                        }
                        // 所属を取り出す
                        if(_data.groupItems != null) {
                            _affiliation = _data.groupItems;
                        }
                    }
                }
                // ファイルにログを出力する
                _writeLogExpandedURL(_account, _nickName, _affiliation, _itemId, originalURL);
            }
            var _isRequestedUserData = false;
            if(_sessionData != null) {
                _account = _sessionData.getLoginAccout();
                if(_account == null) {
                    log.connectionLog(3, 'onRedirectPost:: _account is Invalid ');
                    _account = '';
                }
                if(_account != '') {
                    // ニックネーム、所属を取得する
                    var _synchronousBridgeNodeXmpp = SynchronousBridgeNodeXmpp.getInstance();
                    var _requestData = {
                        type : RequestData.GET_PERSON_LIST_TYPE_SEARCH,
                        subType : 'AllUsers',
                        startId : 0,
                        count : 1,
                        condition : {
                            filter: {
                                type : 'item',
                                name : 'login_account',
                                value : _account
                            },
                            sort : {
                                item : 'login_account',
                                order : '1'
                            }
                        }
                    }
                    _isRequestedUserData = _synchronousBridgeNodeXmpp.searchPerson(_accessToken, _requestData, _onSearchPersonCallback);
                }
            } else{
                log.connectionLog(3, 'onRedirectPost:: _sessionData is Invalid ');
            }
            if(_isRequestedUserData == false) {
                // ログにエラー（情報が取れなかった）として出力
                var _ERROR_REASON_XMPP_SERVER = 6
                _onSearchPersonCallback(false, _ERROR_REASON_XMPP_SERVER, {}, 0, {});
            }
        }
    }

    function _extractionRedirectIdFromUrlPath(path) {
        var _urlid = null
        // 短縮URLの形式は、/cubee/redir/XXXXXX(ただしエンコード済み)。ここから最後のXXXXXXを取り出す。
        log.connectionLog(7, "_extractionRedirectIdFromUrlPath: " + path);
        var pat = _conf.getConfData('SYSTEM_LOCATION_ROOT') + "/redir/(.*)";
        try { // 引数の解析
            var _match = path.match("/([0-9A-Za-z]+)$");
            if (_match != null && _match.length == 2) {
                _urlid = _match[1];
                log.connectionLog(7, "_extractionRedirectIdFromUrlPath: urlid = " + _urlid);
            }
        } catch (e) { // 解析時に例外発生
            //response.writeHead(500);
            log.connectionLog(4, "_extractionRedirectIdFromUrlPath: err = " + e + ", path = " + path);
        }
        return _urlid;
    }

    function _responseExpandedURL(err, originalURL, request, response) {
        if (err != null) {
            response.writeHead(500);
            if (typeof err == 'string') {
                log.connectionLog(4, "_responseExpandedURL: " + err);
            }
            else {
                log.connectionLog(4, "_responseExpandedURL: " + err.name + ": " + err.message);
            }
            response.end();
        } else if (originalURL == null) {
            log.connectionLog(7, "_responseExpandedURL: no error and no URL");
            response.writeHead(404);
            response.end();
        } else {
            // originalURLはエンコードされている
            var decodedURL = decodeURIComponent(originalURL.replace(/\+/g, '%20'));
            decodedURL = ShortenURLUtils.encodeURIconsideringPunyCode(decodedURL);
            log.connectionLog(7, "_responseExpandedURL: OriginalURL: " + decodedURL);
            response.writeHead(301 , {"Location" : decodedURL});
            response.end();
        }
        return;
    }

    // 短縮URLの展開したという情報をログに出力する
    function _writeLogExpandedURL (account, nickName, affiliation, itemId, originalURL) {
        // 出力ディレクトリがあるか確認
        var _logPath = path.join(__dirname, '../logs');
        var _expandedLogPath = path.join(_logPath, 'expandedurl');
        if(!fs.existsSync(_expandedLogPath)) {
            // ディレクトリがない場合は作成
            fs.mkdirSync(_expandedLogPath);
        }

        // nickName, affiliation, originalURLはエンコードされている
        var _date = new Date;
        var _yearStr = '' + _date.getFullYear();
        var _monthStr = ('0' + (_date.getMonth() + 1)).substr(-2);
        var _dateStr = ('0' + _date.getDate()).substr(-2);
        var _fullDateString = [_yearStr, _monthStr, _dateStr].join( '/' );
        var _timeString = [('0' + _date.getHours()).substr(-2), ('0' + _date.getMinutes()).substr(-2), ('0' + _date.getSeconds()).substr(-2)].join(':');
        var _decodedNickName = decodeURIComponent(nickName.replace(/\+/g, '%20'));
        var _decodedaffiliation = [];
        for(var _i = 0; _i < affiliation.length; _i++) {
            _decodedaffiliation[_i] = decodeURIComponent(affiliation[_i].replace(/\+/g, '%20'));
        }
        // Variable _decodedaffiliationString is used like a local variable, but is missing a declaration.
        var _decodedaffiliationString = _decodedaffiliation.join('\n');
        var _decodedURL = decodeURIComponent(originalURL.replace(/\+/g, '%20'));
        // 年のディレクトリを作る
        _expandedLogPath = path.join(_expandedLogPath, _yearStr);
        if(!fs.existsSync(_expandedLogPath)) {
            // ディレクトリがない場合は作成
            fs.mkdirSync(_expandedLogPath);
        }
        // 月のディレクトリを作る
        _expandedLogPath = path.join(_expandedLogPath, _monthStr);
        if(!fs.existsSync(_expandedLogPath)) {
            // ディレクトリがない場合は作成
            fs.mkdirSync(_expandedLogPath);
        }
        // 出力データ
        var _writeStringData = '"' + _fullDateString.replace(/\"/g, '""') + '","' + _timeString.replace(/\"/g, '""') + '","' + account.replace(/\"/g, '""') + '","' + _decodedNickName.replace(/\"/g, '""') + '","' + _decodedaffiliationString.replace(/\"/g, '""') + '","' + itemId.replace(/\"/g, '""') + '","' + _decodedURL.replace(/\"/g, '""') + '"';
        // ファイル名（パスを含む）
        var _fileName = 'expandedurl' + _fullDateString.replace(/\//g, '') + '.log';
        var _filePath = path.join(_expandedLogPath, _fileName);
        // ファイルに追記で出力する
        Utils.appendDataFile(_filePath, _writeStringData, Utils.ENCODING_UTF8);
    }

    exports.start = start;
})();
