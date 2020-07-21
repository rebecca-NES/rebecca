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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jp.co.nec.necst.spf.globalSNS.WebSocketServer.GlobalSNSWebSocket;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApiProcessor;

public class GetPresenceRequestApi extends RequestApi {
    @JSONHint(ignore = true)
    private static final Logger Log = LoggerFactory
            .getLogger(GetPresenceRequestApi.class);

    public Object content;

    @Override
    public ResponseApi doRequest(GlobalSNSWebSocket globalSNSWebSocket) {
        final String logPrefix = "doRequest() : ";
        ResponseApi ret = null;
        if (globalSNSWebSocket == null) {
            Log.error(logPrefix + "globalSNSWebSocket is null.",
                    new Throwable());
            return ret;
        }
        String jid = globalSNSWebSocket.getJid();
        if (jid == null || "".equals(jid)) {
            Log.error(logPrefix + "globalSNSWebSocket's jid is invalid",
                    new Throwable());
            return ret;
        }
        int presence = WebSocketApiProcessor.getInstance().getDisplayPresence(
                jid);
        if (presence == -1) {
            Log.error(logPrefix + "presence is invalid", new Throwable());
            return ret;
        }
        GetPresenceResponseApi response = new GetPresenceResponseApi();
        response.id = id;
        response.request = request;
        response.version = version;
        ((GetPresenceResponseApi.Content) response.content).presence = presence;
        ret = response;
        return ret;
    }

}
