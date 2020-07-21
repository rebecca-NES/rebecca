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

function openGraphProtocolController(){
};(function(){

    var _ogpController = new openGraphProtocolController();

    openGraphProtocolController.getInstance = function() {
        return _ogpController;
    };

    var _proto = openGraphProtocolController.prototype;

    _proto.getOpenGraphProtocol = function(_url) {
        return new Promise((resolve, reject) => {
            let accessToken = CubeeServerConnector.getInstance().getAccessToken();
            const location = Conf.getVal("SYSTEM_LOCATION_ROOT");
            const action = "/" + location + "/i/ogp/get";
            const method = "POST";
            if(accessToken){
                var data = {
                    accessToken: accessToken,
                    url: _url
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
