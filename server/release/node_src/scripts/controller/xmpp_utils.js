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

    var SessionDataMannager = require('./session_data_manager');
    var ServerLog = require('./server_log');
    var _log = ServerLog.getInstance();

    var CHECK_CREATE_XMPP_DATA_RETRY_MAX = 100;

    function checkCreateXmppData(xsConn, xmppRequestCreateFunction) {
        _log.connectionLog(7, 'do func XmppUtil::checkCreateXmppData');
        if(xsConn == null || typeof xsConn != 'object') {
            _log.connectionLog(3, 'checkCreateXmppData: xsConn is illegal');
            return [null, null];
        }
        if(xmppRequestCreateFunction == null || typeof xmppRequestCreateFunction != 'function') {
            _log.connectionLog(3, 'checkCreateXmppData: xmppRequestCreateFunction is illegal');
            return [null, null];
        }
        var _sessionDataMannager = SessionDataMannager.getInstance();
        var _ary = _sessionDataMannager.getByOpenfireSock(xsConn);
        if(_ary == null){
            _log.connectionLog(3, 'checkCreateXmppData: _ary is null');
            return [null, null];
        }
        if(_ary.length == 0){
            _log.connectionLog(3, 'checkCreateXmppData: _ary length is 0');
            return [null, null];
        }

        for(var _i = 0; _i < CHECK_CREATE_XMPP_DATA_RETRY_MAX; _i++){
            var _xmppData = xmppRequestCreateFunction();
            if(_xmppData == null){
                _log.connectionLog(3, 'checkCreateXmppData: xmppData is null');
                return [null, null];
            }
            if(_xmppData[1] == null){
                _log.connectionLog(3, 'checkCreateXmppData: xmppData[1] is null');
                return _xmppData;
            }
            function _findCallback() {
                for(var _index = 0; _index < _ary.length; _index++){
                    var _callback = _ary[_index].getCallback(_xmppData[1]);
                    if(_callback != null){
                        return true;
                    }
                }
                return false;
            }
            if(_findCallback() == false){
                return _xmppData;
            }
            _log.connectionLog(7, 'checkCreateXmppData: xmppData request ID is duplicated');
        }
        _log.connectionLog(3, 'checkCreateXmppData: CHECK_CREATE_XMPP_DATA_RETRY_MAX over');
        return [null, null];
    }

    exports.checkCreateXmppData = checkCreateXmppData;
})();
