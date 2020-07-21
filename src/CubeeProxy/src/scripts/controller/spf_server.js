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

    var _conf = Conf.getInstance();

    var _log = ServerLog.getInstance();

    var _redisConnector = RedisConnector.getInstance();

    var _spfListManager = SpfListManager.getInstance();

    var _outsideSocketIOServerListManager = OutsideSocketIOServerListManager.getInstance();

    var CONTENT_TYPE_MULTIPART = 'multipart';
    var GET_DESTINATION_HOST = 'get_destination_host';
    var CONF_KEY_SOCKET_IO_PORT = 'SOCKET_IO_PORT';
    var ASYNCHRONOUS = 'asynchronous';
    var CONF_KEY_DEFAULT_TENANT_NAME = 'DEFAULT_TENANT_NAME';
    var REG_EXP_URL_TENANTNAME = '\/t\/[^\/]+';
    var BODY_KEY_TENANTNAME = 'tenantName';
    var API_LOGIN = 'Login';
    var CONF_KEY_REQUEST_TIMEOUT = 'REQUEST_TIMEOUT';
    var CONF_KEY_SYSTEM_LOCATION_ROOT = 'SYSTEM_LOCATION_ROOT';

    function SpfServer() {
        _outsideSocketIOServerListManager.loadList(function(){});
    }

    var serverCnt = 0;
    var defaultTenantname = null;

    var _proto = SpfServer.prototype;

    _proto.requestSpfServer = function(serverRequest, serverResponse) {
        var _contentType = serverRequest.headers['content-type'];
        if(_contentType && _contentType.indexOf(CONTENT_TYPE_MULTIPART) != -1){
            _log.connectionLog(7,
                'SpfServer.requestSpfServer:: Request content-type:' +
                _contentType);

            this._requestMultipart(serverRequest, serverResponse);
        } else {
            _log.connectionLog(7,
                'SpfServer.requestSpfServer:: Request content-type is not multipart');

            this._request(serverRequest, serverResponse);
        }
    }

    _proto._request = function(serverRequest, serverResponse) {
        var _self = this;

        var _requestUrl = url.parse(serverRequest.url);
        var _body = '';
        var _client = null;
        var _myHost = serverRequest.headers.host;

        serverRequest.on('data', function(data) {
            _body += data;
        });
        serverRequest.on('end', function() {
            _redisConnector.createRedisClient(_createSpfServerList);
        });

        function _createSpfServerList(err, client) {
            if(err) {
                serverResponse.writeHead(404);
                serverResponse.end();
                return;
            }
            _client = client;
            _spfListManager.loadSpfServerList(client,
                                              false,
                                              _selectDestinationHost);
        }

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

            if(_body.length > 0) {
                _contentType = serverRequest.headers['content-type'];
                if(_contentType && _contentType.indexOf('json') != -1){
                    _objBody = JSON.parse(_body);
                } else {
                    _urlinfo = url.parse( '/?' + _body.toString(), true );
                    _objBody = _urlinfo.query;
                }
            }

            if(_requestUrl.path.indexOf(ASYNCHRONOUS) != -1 ||
               _requestUrl.path.indexOf(_urlInTenantname) != -1) {
                _log.connectionLog(7,
                    'SpfServer._request:: This request from smart device');

                if(_requestUrl.path.indexOf('/t/') != -1){
                    _tenantnameRegExp = new RegExp(REG_EXP_URL_TENANTNAME);
                    _tenantUrl = _requestUrl.path.match(_tenantnameRegExp).join('');
                    _tenantname = _tenantUrl.slice(3);
                    _requestUrl.path = _requestUrl.path.replace(_tenantnameRegExp, '');
                }
                if(_objBody && _objBody.request){
                    if(_objBody.request == API_LOGIN){
                        if(!_tenantname){
                            if(defaultTenantname) {
                                _tenantname = defaultTenantname;
                            } else {
                                _tenantname = _conf.getConfData(CONF_KEY_DEFAULT_TENANT_NAME);
                                if (!_tenantname) {
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
                        _contentType = serverRequest.headers['content-type'];
                        if(_contentType && _contentType.indexOf('json') != -1){
                            if(!_objBody['content']) {
                                _objBody['content'] = {};
                            }
                            if (! (BODY_KEY_TENANTNAME in _objBody.content)) {
                                _objBody['content'][BODY_KEY_TENANTNAME] = _tenantname;
                                _body = JSON.stringify(_objBody);
                            }
                        } else {
                            if (_body.indexOf(BODY_KEY_TENANTNAME + '=') != -1) {
                                _body = BODY_KEY_TENANTNAME + '=' + _tenantname +
                                        '&' + _body;
                            }
                        }
                        serverRequest.headers['content-length'] = _body.length;
                    }
                }
            }

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
                        _accesstoken = _cookieSessionData.accessToken;
                    }
                }
            }
            if(_objBody && (_objBody['accesstoken'] || _objBody['accessToken'])){
                if(_objBody['accesstoken']) {
                    _accesstoken = _objBody['accesstoken'];
                } else {
                    _accesstoken = _objBody['accessToken'];
                }
            }
            if(_accesstoken){
                _log.connectionLog(7,
                    'SpfServer._request:: accessToken exist');

                _getAccessRelationData();
            } else {
                _log.connectionLog(7,
                    'SpfServer._request:: accessToken not exist');

                _selectDestinationHostBySpfServerList();
            }

            function _getAccessRelationData() {
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
                        _log.connectionLog(4,
                            'SpfServer._request:: spfHost is nothing in redis');

                        _selectDestinationHostBySpfServerList();
                    } else {
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
                        _sendRequest(_serverObjList[0]['hostname'],
                                     _serverObjList[0]['port']);
                    }
                });
            }

            function _selectDestinationHostBySpfServerList() {
                _spfServerList = _spfListManager.getSpfServerList();
                if(!_spfServerList[0]) {
                    _log.connectionLog(3,
                        'SpfServer._request:: _spfServerList is nothing');

                    serverResponse.writeHead(404);
                    serverResponse.end();
                    return;
                }
                if(serverCnt >= _spfServerList.length){
                    serverCnt = 0;
                }
                _spfHost = _spfServerList[serverCnt]['hostname'];
                _spfPort = _spfServerList[serverCnt]['port'];
                if(_loginApiFlg){
                    serverCnt++;
                }
                _sendRequest(_spfHost, _spfPort);
            }
        }

        function _sendRequest(spfHost, spfPort) {
            var _destinationHost = null;
            var _spfSocketPort = null;
            var _reqUrl = '';
            var _uni = null;
            var _locationRegExp = null;
            var _timeout = parseInt(_conf.getConfData(CONF_KEY_REQUEST_TIMEOUT));
            if (isNaN(_timeout)) {
                _timeout = 300;
            }
            _timeout = _timeout * 1000;

            _redisConnector.quit(_client);

            _log.connectionLog(7,
                'SpfServer._request:: spfHost : ' + spfHost);
            _log.connectionLog(7,
                'SpfServer._request:: spfPort : ' + spfPort);

            if(_requestUrl.path.indexOf(GET_DESTINATION_HOST) != -1) {
                _destinationHost = new DestinationHost();

                serverCnt++;

                var _socketIOHostAndPort = _outsideSocketIOServerListManager.getHostAndPort(spfHost);
                if(_socketIOHostAndPort == null) {
                    serverResponse.writeHead(404);
                    serverResponse.end();
                    return;
                }
                _destinationHost.createResponseData(_socketIOHostAndPort[0], _socketIOHostAndPort[1]);

                serverResponse.writeHead(_destinationHost.getStatusCode(),
                                         _destinationHost.getHeader());
                serverResponse.write(_destinationHost.getResponseData());
                serverResponse.end();
                return;
            }

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
                    var _escapedMyHost = _myHost.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    _locationRegExp = new RegExp('^http\:\/\/' + _escapedMyHost + '\:' + spfPort + '\/');
                    response.headers.location = response.headers.location.replace(_locationRegExp, '/');
                    serverResponse.writeHead(response.code, {'Location': response.headers.location});
                    serverResponse.end();
                    return;
                }
                serverResponse.writeHead(response.code,
                                         response.headers);
                serverResponse.write(response.raw_body);
                serverResponse.end();
            });
        }
    }

    _proto._requestMultipart = function(serverRequest, serverResponse) {
        var _self = this;

        var _requestUrl = url.parse(serverRequest.url);
        var _multipartBody = {};
        var _client = null;

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
            _multipartBody['fields'] = fields;
            _multipartBody['files'] = files;

            _redisConnector.createRedisClient(_createSpfServerList);
        });

        function _createSpfServerList(err, client) {
            if(err) {
                serverResponse.writeHead(404);
                serverResponse.end();
                return;
            }
            _client = client;

            _spfListManager.loadSpfServerList(client,
                                              false,
                                              _selectDestinationHost);
        }

        function _selectDestinationHost() {
            var _cookieData = {};
            var _cookieSession = '';
            var _cookieSessionData = {};
            var _accesstoken = '';
            var _spfServerList = [];
            var _serverObjList = [];

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
                        _accesstoken = _cookieSessionData.accessToken;
                    }
                }
            }
            if(_multipartBody['fields'].accesstoken){
                _accesstoken = _multipartBody['fields'].accesstoken;
            }
            if(_accesstoken){
                _log.connectionLog(7,
                    'SpfServer._requestMultipart:: accessToken exist');

                _getAccessRelationData();
            } else {
                _log.connectionLog(7,
                    'SpfServer._requestMultipart:: accessToken not exist');

                _selectDestinationHostBySpfServerList();
            }

            function _getAccessRelationData() {
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
                        _log.connectionLog(4,
                            'SpfServer._requestMultipart:: spfHost is nothing in redis');

                        _selectDestinationHostBySpfServerList();
                    } else {
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
                        _sendRequest(_serverObjList[0]['hostname'],
                                     _serverObjList[0]['port']);
                    }
                });
            }

            function _selectDestinationHostBySpfServerList() {
                _spfServerList = _spfListManager.getSpfServerList();
                if(!_spfServerList[0]) {
                    _log.connectionLog(3,
                        'SpfServer._requestMultipart:: _spfServerList is nothing');

                    serverResponse.writeHead(404);
                    serverResponse.end();
                    return;
                }
                if(serverCnt >= _spfServerList.length){
                    serverCnt = 0;
                }
                _sendRequest(_spfServerList[serverCnt]['hostname'],
                             _spfServerList[serverCnt]['port']);
            }
        }

        function _sendRequest(spfHost, spfPort) {
            var _reqUrl = '';
            var _uni = null;
            var _timeout = parseInt(_conf.getConfData(CONF_KEY_REQUEST_TIMEOUT));
            var _fileData = {};

            if (isNaN(_timeout)) {
                _timeout = 300;
            }
            _timeout = _timeout * 1000;

            _redisConnector.quit(_client);

            _log.connectionLog(7,
                'SpfServer._requestMultipart:: spfHost : ' + spfHost);
            _log.connectionLog(7,
                'SpfServer._requestMultipart:: spfPort : ' + spfPort);

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
            for(_fielodsKey in _multipartBody['fields']) {
                _uni.field(_fielodsKey, _multipartBody['fields'][_fielodsKey][0]);
            }
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
