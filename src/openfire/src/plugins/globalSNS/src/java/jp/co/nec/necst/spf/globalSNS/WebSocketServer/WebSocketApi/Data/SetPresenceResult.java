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

package jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.Data;

import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.ResponseApi;

public class SetPresenceResult {
    private int mReason = ResponseApi.ResponseContent.REASON_CODE_NONE;
    private int mPresence = 0;
    public int getReason() {
        return mReason;
    }
    public void setReason(int reason) {
        mReason = reason;
    }
    public int getPresence() {
        return mPresence;
    }
    public void setPresence(int presence) {
        mPresence = presence;
    }
}
