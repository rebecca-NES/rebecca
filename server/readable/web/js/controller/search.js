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
function SearchManager() {

};(function() {
    var _proto = SearchManager.prototype;
    _proto.searchMessage = function(startId, count, columnSearchCondition, onSearchMessageCallback) {
        var _self = this;
        if (startId == null || typeof startId != 'number' || startId < 0) {
            return false;
        }
        if (count == null || typeof count != 'number' || count < 1) {
            return false;
        }
        if (columnSearchCondition == null || typeof columnSearchCondition != 'object') {
            return false;
        }
        if (onSearchMessageCallback == null || typeof onSearchMessageCallback != 'function') {
            return false;
        }
        function callBackFunc(resultMessageData) {
            onSearchMessageCallback(resultMessageData);
        }

        return CubeeServerConnector.getInstance().searchMessage(startId, count, columnSearchCondition, callBackFunc);
    };
    _proto.onNotificationReceived = function(notification) {
    };
    _proto.disconnected = function() {
    };
})();
