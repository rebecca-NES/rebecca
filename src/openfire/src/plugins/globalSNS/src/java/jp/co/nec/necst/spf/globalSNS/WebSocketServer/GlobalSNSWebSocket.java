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

package jp.co.nec.necst.spf.globalSNS.WebSocketServer;

import java.io.IOException;

import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.InvalidRequestApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.LogoutRequestApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.RequestApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.ResponseApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.WebSocketApiExchanger;

import org.eclipse.jetty.websocket.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GlobalSNSWebSocket implements WebSocket.OnTextMessage {
    private static final Logger Log = LoggerFactory
            .getLogger(GlobalSNSWebSocket.class);

    private Connection mConnection;
    private String mUserName = null;
    private String mJid = null;
    
    private int MAX_TEXT_MESSAGE_SIZE = 1024 * 1024 * 2;

    public String getUserName() {
        return mUserName;
    }

    public void setUserName(String userName) {
        mUserName = userName;
    }

    public String getJid() {
        return mJid;
    }

    public void setJid(String jid) {
        mJid = jid;
    }

    @Override
    public void onClose(int arg0, String arg1) {
        close();
    }

    @Override
    public void onOpen(Connection connection) {
        mConnection = connection;
        if (mConnection != null) {
            mConnection.setMaxTextMessageSize(MAX_TEXT_MESSAGE_SIZE);
        }
    }

    @Override
    public void onMessage(final String data) {
        final String logPrefix = "onMessage() : ";
        RequestApi api = null;
        ResponseApi response = null;
        boolean isLogined = (mJid != null);

        api = WebSocketApiExchanger.exchangeRequestJsonApiToApiObject(data);
        if (api == null) {
            response = new ResponseApi();
            response.version = 1;
            if (isLogined) {
                response.errorCode = ResponseApi.ERROR_CODE_ERROR_LOGGED_IN;
            } else {
                response.errorCode = ResponseApi.ERROR_CODE_ERROR_NOT_LOGGED_IN;
            }
            response.content.result = false;
            response.content.reason = ResponseApi.ResponseContent.REASON_CODE_API_FORMAT;
            Log.error(logPrefix + "api is invalid.", new Throwable());
        } else if(api instanceof InvalidRequestApi) {
            response = api.doRequest(this);
            if(response != null) {
                if (isLogined) {
                    response.errorCode = ResponseApi.ERROR_CODE_ERROR_LOGGED_IN;
                } else {
                    response.errorCode = ResponseApi.ERROR_CODE_ERROR_NOT_LOGGED_IN;
                }
            }
        } else {
            if (isLogined
                    && !WebSocketApiExchanger.RequestApiType.LOGIN.toString()
                            .equals(api.request)) {
                response = api.doRequest(this);
            } else if (!isLogined
                    && WebSocketApiExchanger.RequestApiType.LOGIN.toString()
                            .equals(api.request)) {
                response = api.doRequest(this);
            } else if (isLogined) {
                response = new ResponseApi();
                response.id = api.id;
                response.request = api.request;
                if(api.version == 0) {
                    response.version = 1;
                } else {
                    response.version = api.version;
                }
                response.errorCode = ResponseApi.ERROR_CODE_ERROR_LOGGED_IN;
                response.content.result = false;
                response.content.reason = ResponseApi.ResponseContent.REASON_CODE_API_FORMAT;
                Log.info(logPrefix + "already logind.");
            } else {
                response = new ResponseApi();
                response.id = api.id;
                response.request = api.request;
                if(api.version == 0) {
                    response.version = 1;
                } else {
                    response.version = api.version;
                }
                response.errorCode = ResponseApi.ERROR_CODE_ERROR_NOT_LOGGED_IN;
                response.content.result = false;
                response.content.reason = ResponseApi.ResponseContent.REASON_CODE_API_FORMAT;
                Log.info(logPrefix + "not logind.");
            }
        }
        if (response == null) {
            response = new ResponseApi();
            response.id = api.id;
            response.request = api.request;
            if(api.version == 0) {
                response.version = 1;
            } else {
                response.version = api.version;
            }
            if (isLogined) {
                response.errorCode = ResponseApi.ERROR_CODE_ERROR_LOGGED_IN;
            } else {
                response.errorCode = ResponseApi.ERROR_CODE_ERROR_NOT_LOGGED_IN;
            }
            response.content.result = false;
            response.content.reason = ResponseApi.ResponseContent.REASON_CODE_SERVER_ERROR;
        }
        String responseJsonString = WebSocketApiExchanger
                .createResponseJsonString(response);
        if(responseJsonString == null || "".equals(responseJsonString)) {
            Log.error(logPrefix + "responseJsonString is invalid.", new Throwable());
        }
        push(responseJsonString);
        if(!isLogined && response.errorCode != ResponseApi.ERROR_CODE_NONE) {
            close();
        } else if (isLogined && api instanceof LogoutRequestApi
                && response.errorCode == ResponseApi.ERROR_CODE_NONE) {
            close();
        }
    }

    private void close() {
        final String logPrefix = "close() : ";
        if (mJid != null) {
            WebSocketApiProcessor.getInstance().logout(mJid);
        }
        forceClose();
        WebSocketClientManager.getInstance().onDisconnect(this);
        mJid = null;
        mUserName = null;
        if (mConnection != null) {
            try {
                synchronized (mConnection) {
                    mConnection = null;
                }
            } catch (NullPointerException e) {
                Log.warn(logPrefix + "mConnection is null by others", e);
            }
        }
    }

    public void forceClose() {
        final String logPrefix = "forceClose() : ";
        if (mConnection != null) {
            try {
                synchronized (mConnection) {
                    if (mConnection != null && mConnection.isOpen()) {
                        mConnection.disconnect();
                    }
                }
            } catch (NullPointerException e) {
                Log.warn(logPrefix + "mConnection is null by others", e);
            }
        }
    }

    public boolean push(String json) {
        final String logPrefix = "push() : ";
        boolean ret = false;
        if (json == null || json.equals("")) {
            Log.error(logPrefix + "json is invalid", new Throwable());
            return ret;
        }
        if (mConnection != null) {
            try {
                synchronized (mConnection) {
                    if (mConnection != null && mConnection.isOpen()) {
                        try {
                            mConnection.sendMessage(json);
                            ret = true;
                        } catch (IOException e) {
                            Log.error(logPrefix + "faild to send message.", e);
                        }
                    }
                }
            } catch (NullPointerException e) {
                Log.warn(logPrefix + "mConnection is null by others", e);
            }
        }
        return ret;
    }

}
