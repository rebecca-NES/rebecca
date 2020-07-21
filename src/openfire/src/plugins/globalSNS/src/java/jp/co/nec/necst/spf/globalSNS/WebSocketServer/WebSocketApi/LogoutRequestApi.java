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

import jp.co.nec.necst.spf.globalSNS.WebSocketServer.GlobalSNSWebSocket;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.ResponseApi.ResponseContent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LogoutRequestApi extends RequestApi {

    private static final Logger Log = LoggerFactory
            .getLogger(LogoutRequestApi.class);

    public Object content;

    public LogoutRequestApi() {
    }

    public ResponseApi doRequest(GlobalSNSWebSocket globalSNSWebSocket) {
        final String prefix = "doRequest() : ";
        LogoutResponseApi response = new LogoutResponseApi();
        response.id = id;
        response.request = request;
        response.version = version;
        response.errorCode = ResponseApi.ERROR_CODE_ERROR_LOGGED_IN;
        response.content.result = false;
        response.content.reason = ResponseApi.ResponseContent.REASON_CODE_SERVER_ERROR;
        if(globalSNSWebSocket == null){
            Log.error(prefix + "globalSNSWebSocket is null", new Throwable());
            return response;
        }
        String jid = globalSNSWebSocket.getJid();
        if(jid == null){
            Log.error(prefix + "jid is invalid", new Throwable());
            return response;
        }

        response.errorCode = ResponseApi.ERROR_CODE_NONE;
        response.content.result = true;
        response.content.reason = ResponseContent.REASON_CODE_NONE;

        return response;
    }

}
