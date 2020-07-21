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

import java.sql.Timestamp;
import java.util.Calendar;

import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.GlobalSNSWebSocket;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApiProcessor;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientManager;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientNotifier;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.ResponseApi.ResponseContent;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.Data.LoginResult;
import net.arnx.jsonic.JSONHint;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoginRequestApi extends RequestApi {
    public Content content;

    @JSONHint(ignore = true)
    private static final Logger Log = LoggerFactory
            .getLogger(LoginRequestApi.class);

    public class Content {
        public String user = "";
        public String password = "";
        public String encryptType = "";
    }


    public ResponseApi doRequest(GlobalSNSWebSocket globalSNSWebSocket) {
        final String prefix = "doRequest() : ";
        LoginResponseApi response = null;
        response = new LoginResponseApi();
        response.id = id;
        response.request = request;
        response.version = version;
        response.errorCode = ResponseApi.ERROR_CODE_ERROR_NOT_LOGGED_IN;
        response.content.result = false;
        response.content.reason = ResponseApi.ResponseContent.REASON_CODE_SERVER_ERROR;
        if(globalSNSWebSocket == null){
            Log.error(prefix + "globalSNSWebSocket is null", new Throwable());
            return response;
        }
        LoginResult loginResult = WebSocketApiProcessor.getInstance().login(this);
        if(!loginResult.isResult()){
            Log.info(prefix + "Login Fail");
            response.content.reason = loginResult.getReason();
            return response;
        }
        String jid = loginResult.getJid();
        globalSNSWebSocket.setJid(jid);
        globalSNSWebSocket.setUserName(loginResult.getAccount());
        WebSocketClientManager.getInstance().onLogin(globalSNSWebSocket);

        Timestamp preNotificationClientLastUpdatedAt = UserAccountManager
                .getInstance().getNotificationClientLastUpdatedAt(jid);

        Calendar now = Calendar.getInstance();
        Timestamp nowDate = new Timestamp(now.getTimeInMillis());
        boolean updateResult = UserAccountManager.getInstance()
                .updateNotificationClientLastUpdatedAt(jid, nowDate);
        if (!updateResult) {
            Log.info(prefix + "Fail Update NotificationClientLastUpdatedAt ");
            return response;
        }

        WebSocketClientNotifier.getInstance().notifyStoredData(jid,
                preNotificationClientLastUpdatedAt);


        response.errorCode = ResponseApi.ERROR_CODE_NONE;
        response.content.result = true;
        response.content.reason = ResponseContent.REASON_CODE_NONE;

        return response;
    }
}
