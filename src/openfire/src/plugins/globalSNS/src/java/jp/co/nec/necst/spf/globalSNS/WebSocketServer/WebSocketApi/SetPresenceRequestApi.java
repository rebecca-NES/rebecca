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
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApiProcessor;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.Data.SetPresenceResult;
import net.arnx.jsonic.JSONHint;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SetPresenceRequestApi extends RequestApi {
    @JSONHint(ignore = true)
    private static final Logger Log = LoggerFactory
            .getLogger(SetPresenceRequestApi.class);

    public Content content;

    public class Content {
        @JSONHint(ignore = true)
        public static final int ACTION_TYPE_INVALID = -1;
        @JSONHint(ignore = true)
        public static final int ACTION_TYPE_MANUAL = 0;
        @JSONHint(ignore = true)
        public static final int ACTION_TYPE_AUTO = 1;
        @JSONHint(ignore = true)
        public static final int PRESENCE_TYPE_OFFLINE = 0;
        @JSONHint(ignore = true)
        public static final int PRESENCE_TYPE_CHAT = 1;
        @JSONHint(ignore = true)
        public static final int PRESENCE_TYPE_AWAY = 2;
        @JSONHint(ignore = true)
        public static final int PRESENCE_TYPE_XA = 3;
        @JSONHint(ignore = true)
        public static final int PRESENCE_TYPE_DND = 4;

        public int action = ACTION_TYPE_INVALID;
        public int presence = PRESENCE_TYPE_OFFLINE;
    }

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
        if (content == null || content.action == Content.ACTION_TYPE_INVALID
                || content.presence == Content.PRESENCE_TYPE_OFFLINE) {
            Log.error(logPrefix + "content is null.", new Throwable());
            ret = new ResponseApi();
            ret.id = id;
            ret.request = request;
            ret.version = version;
            ret.errorCode = ResponseApi.ERROR_CODE_ERROR_LOGGED_IN;
            ret.content.result = false;
            ret.content.reason = ResponseApi.ResponseContent.REASON_CODE_API_FORMAT;
            return ret;
        }
        SetPresenceResult result = WebSocketApiProcessor.getInstance()
                .setPresence(jid, content.action, content.presence);
        if (result == null) {
            Log.error(logPrefix + "result is null.", new Throwable());
            return ret;
        }
        int resultReason = result.getReason();
        if (resultReason != ResponseApi.ResponseContent.REASON_CODE_NONE
                && resultReason != SetPresenceResponseApi.Content.REASON_CODE_NOT_CHANGED) {
            ret = new ResponseApi();
            ret.id = id;
            ret.request = request;
            ret.version = version;
            ret.errorCode = ResponseApi.ERROR_CODE_ERROR_LOGGED_IN;
            ret.content.result = false;
            ret.content.reason = resultReason;
            return ret;
        }
        SetPresenceResponseApi response = new SetPresenceResponseApi();
        response.id = id;
        response.request = request;
        response.version = version;
        ((SetPresenceResponseApi.Content) response.content).reason = resultReason;
        ((SetPresenceResponseApi.Content) response.content).presence = result
                .getPresence();
        ret = response;
        return ret;
    }

}
