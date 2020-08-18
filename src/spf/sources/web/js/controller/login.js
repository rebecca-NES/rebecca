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

function LoginManager() {

};(function() {
    var _proto = LoginManager.prototype;
    _proto.login = function(tenantName, userName, password, onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification, onLoginWizard) {

        var _self = this;
        if(userName == null || typeof userName != 'string') {
            return false;
        }
        if(password == null || typeof password != 'string') {
            return false;
        }
        if (!_checkParameterCallbackFunction(onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification, onLoginWizard)) {
            return false;
        }
        var _host = d_host;
        var _port = d_socketio_port;
        function _onConnectedCallbak(connectReceiveData) {
            return onConnected(connectReceiveData);
        };

        function _onLoginWizardCallbak(connectReceiveData) {
            onLoginWizard(connectReceiveData);
        };        

        return CubeeServerConnector.getInstance().connect(_host, _port, tenantName, userName, password, _onConnectedCallbak, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification,_onLoginWizardCallbak);
    };
    _proto.skipLogin = function(accessToken, onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification) {
        var _self = this;
        if(accessToken == null || typeof accessToken != 'string') {
            return false;
        }
        if (!_checkParameterCallbackFunction(onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification)) {
            return false;
        }
        var _host = d_host;
        var _port = d_socketio_port;
        function _onConnectedCallbak(connectReceiveData) {
            onConnected(connectReceiveData);
        };

        return CubeeServerConnector.getInstance().skipLoginConnect(_host, _port, accessToken, _onConnectedCallbak, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification);
    };
    function _checkParameterCallbackFunction(onConnected, onDisconnected, onError, onProfileChangedNotify, onMessage, onNotification, onLoginWizard) {

        if(onConnected == null || typeof onConnected != 'function') {
            return false;
        }
        if(onDisconnected == null || typeof onDisconnected != 'function') {
            return false;
        }
        if(onError == null || typeof onError != 'function') {
            return false;
        }
        if(onProfileChangedNotify == null || typeof onProfileChangedNotify != 'function') {
            return false;
        }
        if(onMessage == null || typeof onMessage != 'function') {
            return false;
        }
        if(onNotification == null || typeof onNotification != 'function') {
            return false;
        }
        if(onLoginWizard == null || typeof onLoginWizard != 'function') {
            return false;
        }
        return true;
    };
    _proto.logout = function() {
        CubeeServerConnector.getInstance().disconnect();
    };
    _proto.onNotificationReceived = function(notification) {
    };
    _proto.disconnected = function() {

    };
})();
