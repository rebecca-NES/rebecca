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

function CodiMdController(){
};(function(){

    var _codiMdController = new CodiMdController();

    CodiMdController.getInstance = function() {
        return _codiMdController;
    };

    var _proto = CodiMdController.prototype;
    var location = Conf.getVal("SYSTEM_LOCATION_ROOT");
    _proto.connectNewWindow = function(){
        let accessToken = CubeeServerConnector.getInstance().getAccessToken();
        const action = "/" + location + "/codimd/redirect";
        const method = "POST";
        if(accessToken){
            var data = {
                accessToken: accessToken
            };
            $.ajax({
                type: method,
                url: action,
                data:JSON.stringify(data),
                contentType: 'application/json',
                dataType: "json",
                success: function(json_data) {
                    if (json_data.result) {
                        window.open(json_data.location, '_blank');
                        return true;
                    }else if(json_data.location){
                        window.open(json_data.location, '_blank');
                        return false;
                    }
                    window.open("/" + location + "", '_blank');
                    return false;
                },
                error: function() {
                    window.open("/" + location + "", '_blank');
                    return false;
                },
                complete: function() {
                }
            });
        }
    }

    _proto.makeNewNote = function(_title, _threadRootId="", _roomId=""){
        return new Promise((resolve, reject) => {
            let accessToken = CubeeServerConnector.getInstance().getAccessToken();
            const action = "/" + location + "/codimd/new";
            const method = "POST";
            if(accessToken){
                var data = {
                    accessToken: accessToken,
                    title: _title,
                    threadRootId: _threadRootId,
                    roomId: _roomId,
                };
                $.ajax({
                    type: method,
                    url: action,
                    data:JSON.stringify(data),
                    contentType: 'application/json',
                    dataType: "json",
                    success: function(json_data) {
                        if (json_data.result) {
                            resolve(json_data);
                            window.open(json_data.location, '_blank');
                            return;
                        }else{
                            reject(json_data);
                            return;
                        }
                    },
                    error: function() {
                        reject(false);
                        return;
                    },
                    complete: function() {
                    }
                });
            } else {
                reject(false);
                return;
            }
        })
    }

    _proto.getNoteList = function(_threadRootId="", _roomId="", _msgType=""){
        return new Promise((resolve, reject) => {
            let accessToken = CubeeServerConnector.getInstance().getAccessToken();
            const action = "/" + location + "/codimd/list";
            const method = "POST";
            if(accessToken){
                var data = {
                    accessToken: accessToken,
                    threadRootId: _threadRootId,
                    roomId: _roomId,
                    msgtype: _msgType
                };
                $.ajax({
                    type: method,
                    url: action,
                    data:JSON.stringify(data),
                    contentType: 'application/json',
                    dataType: "json",
                    success: function(json_data) {
                        if (json_data.result) {
                            resolve(json_data);
                            return;
                        }else{
                            reject(json_data);
                            return;
                        }
                    },
                    error: function() {
                        reject(false);
                        return;
                    },
                    complete: function() {
                    }
                });
            } else {
                reject(false);
                return;
            }
        })
    }

    _proto.removeNote = function(noteUrl){
        return new Promise((resolve, reject) => {
            let accessToken = CubeeServerConnector.getInstance().getAccessToken();
            if(!noteUrl && noteUrl.split("/").length == 3){
                reject(false);
                return;
            }
            const action = "/" + location + "/codimd/delete/" + noteUrl.split("/")[2];
            const method = "DELETE";
            if (accessToken) {
                var data = {
                    accessToken: accessToken
                };
                $.ajax({
                    type: method,
                    url: action,
                    data:JSON.stringify(data),
                    contentType: 'application/json',
                    dataType: "json",
                    success: function(json_data) {
                        if (json_data.result) {
                            resolve(json_data);
                            return;
                        }else{
                            reject(json_data);
                            return;
                        }
                    },
                    error: function() {
                        reject(false);
                        return;
                    },
                    complete: function() {
                    }
                });
            } else {
                reject(false);
                return;
            }
        })
    }

    _proto.assignNoteOnThreadRootId = function(_threadRootId, _noteUrl){
        return new Promise((resolve, reject)=>{
            if (!_noteUrl && !_threadRootId) {
                reject(false);
                return;
            }
            let accessToken = CubeeServerConnector.getInstance().getAccessToken();
            const action = "/" + location + "/codimd/setcubee";
            const method = "POST";
            if(accessToken){
                var data = {
                    accessToken: accessToken,
                    threadRootId: _threadRootId,
                    noteUrl: _noteUrl,
                };
                $.ajax({
                    type: method,
                    url: action,
                    data:JSON.stringify(data),
                    contentType: 'application/json',
                    dataType: "json",
                    success: function(json_data) {
                        if (json_data.result) {
                            resolve(json_data);
                            return;
                        }else{
                            reject(json_data);
                            return;
                        }
                    },
                    error: function() {
                        reject(false);
                        return;
                    },
                    complete: function() {
                    }
                });
            } else {
                reject(false);
                return;
            }
        })
    }

    _proto.connectPostToZeroJson = function(){
        let connect = CubeeServerConnector.getInstance();
        if(connect._isLogined){
            let accessToken = connect.getAccessToken();
            const action = "/" + location + "/codimd/login";
            const method = "POST";

            var data = {
                accessToken: accessToken
            };
            $.ajax({
                type: method,
                url: action,
                data:JSON.stringify(data),
                contentType: 'application/json',
                dataType: "json",
                success: function(json_data) {
                    if (json_data.result) {
                        return true;
                    }else{
                        return false;
                    }
                },
                error: function() {
                    return false;
                },
                complete: function() {
                }
            });
            return true;
        }
        return false;
    }

    _proto.setNoteTitle = function(_noteUrl, _title){
        return new Promise((resolve, reject)=>{
            if (!_noteUrl && !_title) {
                reject(false);
                return;
            }
            let accessToken = CubeeServerConnector.getInstance().getAccessToken();
            const action = "/" + location + "/codimd/rename";
            const method = "POST";
            if(accessToken){
                var data = {
                    accessToken: accessToken,
                    noteUrl: _noteUrl,
                    title: _title,
                };
                $.ajax({
                    type: method,
                    url: action,
                    data:JSON.stringify(data),
                    contentType: 'application/json',
                    dataType: "json",
                    success: function(json_data) {
                        if (json_data.result) {
                            resolve(json_data);
                            return;
                        }else{
                            reject(json_data);
                            return;
                        }
                    },
                    error: function() {
                        reject(false);
                        return;
                    },
                    complete: function() {
                    }
                });
            } else {
                reject(false);
                return;
            }
        })
    }

})();
