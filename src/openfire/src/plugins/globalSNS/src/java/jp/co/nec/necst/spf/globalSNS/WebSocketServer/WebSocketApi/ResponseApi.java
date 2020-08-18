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

public class ResponseApi extends WebSocketApi {
    @JSONHint(ignore = true)
    public static final int ERROR_CODE_NONE = 0;
    @JSONHint(ignore = true)
    public static final int ERROR_CODE_ERROR_LOGGED_IN = 1;
    @JSONHint(ignore = true)
    public static final int ERROR_CODE_ERROR_NOT_LOGGED_IN = 2;

    public String request = "";
    public int errorCode = ERROR_CODE_NONE;
    public ResponseContent content = new ResponseContent();

    public class ResponseContent {
        @JSONHint(ignore = true)
        public static final int REASON_CODE_NONE = 0;
        @JSONHint(ignore = true)
        public static final int REASON_CODE_LOGIN_AUTH = 1;
        @JSONHint(ignore = true)
        public static final int REASON_CODE_API_FORMAT = 2;
        @JSONHint(ignore = true)
        public static final int REASON_CODE_SERVER_ERROR = 3;

        public boolean result = true;
        public int reason = REASON_CODE_NONE;
    }

}
