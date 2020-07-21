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

package jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi;

import net.arnx.jsonic.JSONHint;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.GlobalSNSWebSocket;

public class InvalidRequestApi extends RequestApi {
    @JSONHint(ignore = true)
    public int errorCode = ResponseApi.ERROR_CODE_ERROR_NOT_LOGGED_IN;
    @JSONHint(ignore = true)
    public boolean result = false;
    @JSONHint(ignore = true)
    public int reason = ResponseApi.ResponseContent.REASON_CODE_API_FORMAT;

    public InvalidRequestApi() {
        version = 1;
    }

    public ResponseApi doRequest(GlobalSNSWebSocket globalSNSWebSocket) {
        ResponseApi ret = new ResponseApi();
        ret.id = id;
        ret.version = version;
        ret.request = request;
        ret.errorCode = errorCode;
        ret.content.result = result;
        ret.content.reason = reason;
        return ret;
    }
}
