(function() {
    var ShortenURLInfo = require('../model/shorten_url_info');
    // Unused variable SynchronousBridgeNodeXmpp.
    // var SynchronousBridgeNodeXmpp = require('./synchronous_bridge_node_xmpp');
    var ShortenURLManager = require('./shorten_url_manager');
    var Conf = require('./conf');
    var ServerLog = require('./server_log');
    var Utils = require('../utils');
    var Url = require('url');
    var PunyCode = require('punycode');

    var _conf = Conf.getInstance();
    var _log = ServerLog.getInstance();

    var _shortenUrlManager = ShortenURLManager.getInstance();

    /*
     * アカウントデータに関するUtilクラス
     */
    function ShortenURLUtils() {
    }

    /*
     * URLからURL-IDを検索
     *
     */
    ShortenURLUtils.getURLID = function(url, onGetURLIDCallBack) {
        _log.connectionLog(7, 'enter getURLID:' + url);

        // 引数チェック
        if (onGetURLIDCallBack == null || typeof onGetURLIDCallBack != 'function') {
            _log.connectionLog(3, 'ShortenURLUtils#getURLID: null or non-function argument(onGetURLIDCallBack)');
            return;
        }

        if (url == null || typeof url != 'string') {
            _log.connectionLog(3, 'ShortenURLUtils#getURLID: null or non-string argument(url)');
            onGetURLIDCallBack("argument(url) error", null);
            return;
        }

        // 既にURLが登録されていればそこで終わり
       _log.connectionLog(7, 'call ShortenURLManager.getURLInfoFromOriginalURL');
        _shortenUrlManager.getURLInfoFromOriginalURL(url, _onGetURLID);

        function _onGetURLID(err, info) {
            _log.connectionLog(7, 'enter _onGetURLID:' + url);
            if (err == null && info != null) { // 見つかった
                _log.connectionLog(7, 'leave  _onGetURLID(err = null)');
                onGetURLIDCallBack(err, info.getUrlId());
            }
            else if (err != null) {
                _log.connectionLog(7, '_onGetURLID, err = ' + err.name + ":" + err.message);
                onGetURLIDCallBack(err, null);
            }
            else {
                _log.connectionLog(7, 'call  _loopCreate');
                // 登録されていなければIDを生成する
                var createFlag = false;
                var errorFlag = false;
                var seed = 0;

                var info = ShortenURLInfo.create();
                _loopCreate();

                function _loopCreate() {
                    _log.connectionLog(7, 'enter loopCreate, createFlag = ' + createFlag);
                    if (createFlag == true ) {
                        _log.connectionLog(7, 'call onGetURLIDCallBack:' + info.getUrlId());
                        onGetURLIDCallBack(null, info.getUrlId());
                        return;
                    }
                    if (errorFlag == true) {
                        _log.connectionLog(7, 'call onGetURLIDCallBack(record insert error)');
                        onGetURLIDCallBack('record insert error', null);
                        return;
                    }
                    _log.connectionLog(7, 'url = ' + url);
                    _log.connectionLog(7, 'seed = ' + seed);
                    var urlid = _createURLId(url, seed);
                    _log.connectionLog(7, 'urlid = ' + urlid);

                    // レコードを追加する
                    var redir = Utils.replaceAll(_conf.getConfData('SYSTEM_LOCATION_ROOT')+ '/redir/', "/", "%2F");
                    redir = redir + urlid;
                    _log.connectionLog(7, "shortenPath = " + redir);
                    info.setUrlId(urlid);
                    info.setShortenPath(redir);
                    info.setOriginalURL(url);
                    // displayedURLの設定。http://英数字とドットの連続部分  に "/..."を合体
                    var _dispName = url.match(/((https?)(%3A%2F%2F|%3a%2f%2f)([^%]*|[^%]*%[^2]*|[^%]*%[^2]*2[^F]*|[^%]*%[^2]*2[^f]*)(%2F|%2f))/gi);
                    if (_dispName == null) { // URL以外のものが万一来た場合もしくはhttp(s)://のあとに"/"がなかった場合
                       info.setDisplayedURL(url);
                    }
                    else {
                        info.setDisplayedURL(_dispName[0] + '%2E%2E%2E');
                    }
                    _log.connectionLog(7, 'call shortenURLManager.createRecord');
                    _shortenUrlManager.createRecord(info, _onCreate);

                    function _onCreate(_successFlag, _createFlag) {
                        _log.connectionLog(7, 'enter _onCreate');
                        if (_successFlag == false) {
                            _log.connectionLog(7, 'error was detected');
                            errorFlag = true;
                        }
                        else if (_createFlag == false) {
                            _log.connectionLog(7, 'duplicated urlid');
                            seed = Math.floor(Math.random() * 61) + 1;
                        } else {
                            _log.connectionLog(7, 'success insert record');
                            createFlag = true;
                        }
                        _log.connectionLog(7, 'call _loopCreate');
                        _loopCreate();
                        _log.connectionLog(7, 'leave _onCreate');
                    }
                }
            }
            _log.connectionLog(7, 'leave _onGetURLID');
        }
        _log.connectionLog(7, 'leave getURLID');
    };

    /*
     * URLから短縮URL情報を検索
     *
     */
    ShortenURLUtils.getURLInfoFromOriginalURL = function(url, onGetURLInfoFromOriginalURLCallBack) {
        _log.connectionLog(7, 'enter getURLInfoFromOriginalURL:' + url);

        // 引数チェック
        // Variable 'onGetURLInfoFromOriginalURL' is of type function, but it is compared to an expression of type null.
        // if (onGetURLInfoFromOriginalURL == null || typeof onGetURLInfoFromOriginalURL != 'function') {
        if (typeof onGetURLInfoFromOriginalURL != 'function') {
            _log.connectionLog(3, 'ShortenURLUtils#getURLInfoFromOriginalURL: null or non-function argument(onGetURLInfoFromOriginalURLCallBack)');
            return;
        }
        if (url == null || typeof url != 'string') {
            _log.connectionLog(3, 'ShortenURLUtils#getURLInfoFromOriginalURL: null or non-string argument(url)');
            onGetURLInfoFromOriginalURLCallBack("argument(url) error", null);
            return;
        }

        _shortenUrlManager.getURLInfoFromOriginalURL(url, onGetURLInfoFromOriginalURL);

        function onGetURLInfoFromOriginalURL(err, info) {
            _log.connectionLog(7, 'enter onGetURLInfoFromOriginalURL');
            if (err != null) {
                _log.connectionLog(3, "ShortenUrlUtils#onGetURLInfoFromOriginalURL: err = " + err.name + ":" + err.message);
                onGetURLInfoFromOriginalURLCallBack(err, info);
                return;
            }
            onGetURLInfoFromOriginalURLCallBack(err, info);
            _log.connectionLog(7, 'leave onGetURLInfoFromOriginalURL');
            return;
        }

    };

    /*
     * URL-IDから短縮URL情報を検索
     *
     */
    ShortenURLUtils.getExpandedURL = function(urlid, onGetExpandedURLCallBack) {
        _log.connectionLog(7, 'enter getExpandedURL:' + urlid);

        // 引数チェック
        if (onGetExpandedURLCallBack == null || typeof onGetExpandedURLCallBack != 'function') {
            _log.connectionLog(3, 'ShortenURLUtils#getExpandedURL: null or non-function argument(onGetExpandedURLCallBack)');
            return;
        }
        if (urlid == null || typeof urlid != 'string') {
            _log.connectionLog(3, 'ShortenURLUtils#getExpandedURL: null or non-string argument(urlid)');
            onGetExpandedURLCallBack("argument(url) error", null);
            return;
        }

        _shortenUrlManager.getURLInfoFromURLID(urlid, onGetExpandedURL);

        function onGetExpandedURL(err, info) {
            _log.connectionLog(7, 'enter onGetExpandedURL:' + urlid);
            if (err != null) {
                _log.connectionLog(3, 'ShortenURLUtils#onGetExpandedURL: err=' + err.name + ":" + err.message);
                return onGetExpandedURLCallBack(err, null);
            }
            else if (info == null) {
                _log.connectionLog(7, 'ShortenURLUtils#onGetExpandedURL: no err and info is null');
                return onGetExpandedURLCallBack(err, null);
            }
            else {
                _log.connectionLog(7, 'leave onGetExpandedURL');
                return onGetExpandedURLCallBack(err, info.getOriginalURL());
            }
        }
    };

    /*
     * 未エンコードURLを、puny code を考慮して encodeURIcomponent する
     *
     */
    ShortenURLUtils.encodeURIconsideringPunyCode = function(url) {
        var _res = '';
        var _url = Url.parse(url);
        if (!_url || _url.host == null) {
            _log.connectionLog(4, 'ShortenURLUtils#encodeURIconsideringPunyCode: Argument url is not URL: ' + url);
            return _res;
        }
        // 1. protocol
        _res += _url.protocol + '//';
        // 2. domain
        _res += PunyCode.toASCII(_url.hostname);
        // 3. port
        if (!!_url.port) {
            _res += ':' + _url.port;
        }
        // 4. path
        if (!!_url.path) {
            if (! (_url.path=='/' && url[url.length-1]!='/')) {
                // let it be ascii-ed
                _res +=
                    _url.path.replace(/([^\x00-\x7F]+)/gi,
                        function(match, contents, offset, s) {
                            return encodeURIComponent(match);
                        }
                    );
            }
        }
        // 5. hash
        if (!!_url.hash) {
            _res +=
                _url.hash.replace(/([^\x00-\x7F]+)/gi,
                                  function(match, contents, offset, s) {
                                      return encodeURIComponent(match);
                                  }
                );
        }
        _log.connectionLog(7, 'ShortenURLUtils#encodeURIconsideringPunyCode: ' + url + ' encoded_to ' + _res);
        return _res;
    };

    /*
     * URL-IDをURLから生成
     *
     */
    function _createURLId(url, seed) {
        // 62進法
        var BASE = 62;
        // URL-IDの長さ
        var MAXURLIDLEN = 6;
        // 62進法用文字
        var BASESTR = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        // Variable len is used like a local variable, but is missing a declaration.
        var len = url.length;
        // 長さ
        var arr = new Array(MAXURLIDLEN);

        // 配列arrの初期化
        // Variable 'i' is used before its declaration.
        var i;
        for ( i = 0; i < MAXURLIDLEN; i++) {
            arr[i] = seed * i;
        }

        // URL-IDの生成。1桁目はURL中の1,7,15,,,番目の文字から、(...)6ケタ目はURL中の6,12,18,,,番目の文字から取る
        // Variable j is used like a local variable, but is missing a declaration.
        var j;
        for ( i = 0; i < len; i += MAXURLIDLEN) {
            for ( j = 0; j < MAXURLIDLEN; j++) {
                if (i + j < len) {
                    arr[j] += url.charCodeAt(i + j);
                }
                arr[j] = arr[j] % BASE;
            }
        }

        // 62進数への変換
        var res = "";
        for ( i = 0; i < MAXURLIDLEN; i++) {
            res += BASESTR.charAt(arr[i]);
        }
        return res;
    };

    exports.getURLID = ShortenURLUtils.getURLID;
    exports.getURLInfoFromOriginalURL = ShortenURLUtils.getURLInfoFromOriginalURL;
    exports.getExpandedURL = ShortenURLUtils.getExpandedURL;
    exports.encodeURIconsideringPunyCode = ShortenURLUtils.encodeURIconsideringPunyCode;
})();

