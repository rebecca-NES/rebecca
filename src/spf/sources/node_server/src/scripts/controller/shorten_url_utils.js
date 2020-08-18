/*
Copyright 2020 NEC Solution Innovators, Ltd.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

(function() {
    var ShortenURLInfo = require('../model/shorten_url_info');
    var SynchronousBridgeNodeXmpp = require('./synchronous_bridge_node_xmpp');
    var ShortenURLManager = require('./shorten_url_manager');
    var Conf = require('./conf');
    var ServerLog = require('./server_log');
    var Utils = require('../utils');
    var Url = require('url');
    var PunyCode = require('punycode');

    var _conf = Conf.getInstance();
    var _log = ServerLog.getInstance();

    var _shortenUrlManager = ShortenURLManager.getInstance();

    function ShortenURLUtils() {
    }

    ShortenURLUtils.getURLID = function(url, onGetURLIDCallBack) {
        _log.connectionLog(7, 'enter getURLID:' + url);

        if (onGetURLIDCallBack == null || typeof onGetURLIDCallBack != 'function') {
            _log.connectionLog(3, 'ShortenURLUtils#getURLID: null or non-function argument(onGetURLIDCallBack)');
            return;
        }

        if (url == null || typeof url != 'string') {
            _log.connectionLog(3, 'ShortenURLUtils#getURLID: null or non-string argument(url)');
            onGetURLIDCallBack("argument(url) error", null);
            return;
        }

       _log.connectionLog(7, 'call ShortenURLManager.getURLInfoFromOriginalURL');
        _shortenUrlManager.getURLInfoFromOriginalURL(url, _onGetURLID);

        function _onGetURLID(err, info) {
            _log.connectionLog(7, 'enter _onGetURLID:' + url);
            if (err == null && info != null) {
                _log.connectionLog(7, 'leave  _onGetURLID(err = null)');
                onGetURLIDCallBack(err, info.getUrlId());
            }
            else if (err != null) {
                _log.connectionLog(7, '_onGetURLID, err = ' + err.name + ":" + err.message);
                onGetURLIDCallBack(err, null);
            }
            else {
                _log.connectionLog(7, 'call  _loopCreate');
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

                    var redir = Utils.replaceAll(_conf.getConfData('SYSTEM_LOCATION_ROOT')+ '/redir/', "/", "%2F");
                    redir = redir + urlid;
                    _log.connectionLog(7, "shortenPath = " + redir);
                    info.setUrlId(urlid);
                    info.setShortenPath(redir);
                    info.setOriginalURL(url);
                    var _dispName = url.match(/((https?)(%3A%2F%2F|%3a%2f%2f)([^%]*|[^%]*%[^2]*|[^%]*%[^2]*2[^F]*|[^%]*%[^2]*2[^f]*)(%2F|%2f))/gi);
                    if (_dispName == null) {
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

    ShortenURLUtils.getURLInfoFromOriginalURL = function(url, onGetURLInfoFromOriginalURLCallBack) {
        _log.connectionLog(7, 'enter getURLInfoFromOriginalURL:' + url);

        if (onGetURLInfoFromOriginalURL == null || typeof onGetURLInfoFromOriginalURL != 'function') {
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

    ShortenURLUtils.getExpandedURL = function(urlid, onGetExpandedURLCallBack) {
        _log.connectionLog(7, 'enter getExpandedURL:' + urlid);

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

    ShortenURLUtils.encodeURIconsideringPunyCode = function(url) {
        var _res = '';
        var _url = Url.parse(url);
        if (!_url || _url.host == null) {
            _log.connectionLog(4, 'ShortenURLUtils#encodeURIconsideringPunyCode: Argument url is not URL: ' + url);
            return _res;
        }
        _res += _url.protocol + '//';
        _res += PunyCode.toASCII(_url.hostname);
        if (!!_url.port) {
            _res += ':' + _url.port;
        }
        if (!!_url.path) {
            if (! (_url.path=='/' && url[url.length-1]!='/')) {
                _res +=
                    _url.path.replace(/([^\x00-\x7F]+)/gi,
                        function(match, contents, offset, s) {
                            return encodeURIComponent(match);
                        }
                    );
            }
        }
        if (!!_url.hash) {
            _res +=
                _url.hash.replace(/([^\x00-\x7F]+)/gi,
                                  function(match, contents, offset, s) {
                                      return encodeURIComponent(match);
                                  }
                );
        }
        _log.connectionLog(7, 'ShortenURLUtils#encodeURIconsideringPunyCode: ' + url + ' encoded_to ' + _res)
        return _res;
    };

    function _createURLId(url, seed) {
        var BASE = 62;
        var MAXURLIDLEN = 6;
        var BASESTR = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

        len = url.length;
        var arr = new Array(MAXURLIDLEN);

        for ( i = 0; i < MAXURLIDLEN; i++) {
            arr[i] = seed * i;
        }

        for ( i = 0; i < len; i += MAXURLIDLEN) {
            for ( j = 0; j < MAXURLIDLEN; j++) {
                if (i + j < len) {
                    arr[j] += url.charCodeAt(i + j);
                }
                arr[j] = arr[j] % BASE;
            }
        }

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

