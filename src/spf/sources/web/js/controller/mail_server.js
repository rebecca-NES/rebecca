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

function MailServerManager() {
    this._mailServerInfoList = new MailServerInfoList();
};(function() {
    var _proto = MailServerManager.prototype;
    _proto.getServerInfoListFirst = function(onGetServerListCallBack) {
        var _self = this;
        if (onGetServerListCallBack != null && typeof onGetServerListCallBack != 'function') {
            return false;
        }
        function callBackFunc(serverList) {
            _self._mailServerInfoList.removeAll();
            
            var _count = serverList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                _self._mailServerInfoList.add(serverList.get(_i));
            }
            onGetServerListCallBack(serverList);
        }
        return CubeeServerConnector.getInstance().getServerList(callBackFunc);
    };
    _proto.getServerInfoList = function() {
        var _self = this;
        return _self._mailServerInfoList;
    };
    _proto.getServerInfoById = function(id) {
        var _self = this;
        if (id == null || typeof id != 'number') {
            return null;
        }
        var _serverInfo = null;
        for (var _i = 0; _i < _self._mailServerInfoList.getCount(); _i++) {
            if (_self._mailServerInfoList.get(_i).getId() == id) {
                _serverInfo = _self._mailServerInfoList.get(_i);
                break;
            }
        }
        return _serverInfo;
    };
    _proto.disconnected = function() {
    };
})();
