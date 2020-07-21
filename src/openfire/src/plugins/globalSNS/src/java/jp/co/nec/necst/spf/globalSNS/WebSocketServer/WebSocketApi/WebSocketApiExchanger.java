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

import net.arnx.jsonic.JSON;
import net.arnx.jsonic.JSONException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WebSocketApiExchanger {
    private static final Logger Log = LoggerFactory
            .getLogger(WebSocketApiExchanger.class);

    public static enum RequestApiType {
        INVALID_REQUEST_API(""), LOGIN("Login"), LOGOUT("Logout"), GET_LOGIN_USER_PRESENCE(
                "GetLoginUserPresence"), SET_LOGIN_USER_PRESENCE(
                "SetLoginUserPresence");

        private final String mName;

        private RequestApiType(String apiName) {
            mName = apiName;
        }

        @Override
        public String toString() {
            return mName;
        }

        public static RequestApiType toRequestApiType(String name) {
            RequestApiType result = null;

            for (RequestApiType apiType : values()) {
                if (apiType.toString().equals(name)) {
                    result = apiType;
                    break;
                }
            }

            return result != null ? result : INVALID_REQUEST_API;
        }
    }

    public static RequestApi exchangeRequestJsonApiToApiObject(
            String requestApiJson) {
        final String logPrefix = "exchangeRequestJsonApiToApiObject() : ";
        RequestApi ret = new InvalidRequestApi();
        if (requestApiJson == null) {
            Log.info(logPrefix + "requestApiJson is null");
            return ret;
        }
        if ("".equals(requestApiJson)) {
            Log.info(logPrefix + "requestApiJson is empty");
            return ret;
        }
        RequestApi api = null;
        JSON preJson = new JSON();
        preJson.setMaxDepth(2);
        try {
            api = preJson.parse(requestApiJson, RequestApi.class);
        } catch (JSONException e) {
            Log.info(logPrefix + "failed to perse request string");
            return ret;
        }
        RequestApiType request = RequestApiType.toRequestApiType(api.request);
        String id = api.id;
        int version = api.version;
        JSON json = new JSON(JSON.Mode.STRICT);
        try {
            switch (request) {
                case LOGIN:
                    api = json.parse(requestApiJson, LoginRequestApi.class);
                    break;
                case LOGOUT:
                    api = json.parse(requestApiJson, LogoutRequestApi.class);
                    break;
                case GET_LOGIN_USER_PRESENCE:
                    api = json.parse(requestApiJson,
                            GetPresenceRequestApi.class);
                    break;
                case SET_LOGIN_USER_PRESENCE:
                    api = json.parse(requestApiJson,
                            SetPresenceRequestApi.class);
                    break;
                default:
                    Log.info(logPrefix + "unknown api request = " + api.request + ", json : " + requestApiJson);
                    ret.id = id;
                    ret.request = api.request;
                    if(version != 0) {
                        ret.version = version;
                    }
                    return ret;
            }
        } catch (JSONException e) {
            Log.info(logPrefix + "format error. json : " + requestApiJson);
            ret.id = id;
            ret.request = api.request;
            if(version != 0) {
                ret.version = version;
            }
            return ret;
        }
        ret = api;
        return ret;
    }

    public static String createResponseJsonString(ResponseApi response) {
        final String logPrefix = "createResponseJsonString() : ";
        String ret = null;
        try {
            ret = JSON.encode(response);
        } catch (JSONException e) {
            Log.info(logPrefix + "failed to encode response");
        }
        return ret;
    }

    public static String createNotificationApiJsonString(
            NotificationApi api) {
        final String logPrefix = "createNotificationApiJsonString() : ";
        if (api == null) {
            Log.info(logPrefix + "api is null");
            return null;
        }
        String json = null;
        try {
            json = JSON.encode(api);
        } catch (JSONException e) {
            Log.info(logPrefix + "failed to encode response");
        }
        return json;
    }

}
