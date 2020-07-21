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

package jp.co.nec.necst.spf.globalSNS.Data;

import java.math.BigInteger;

public class DeviceInfo {
    private BigInteger mId;
    private String mDeviceId;
    private String mJid;
    private int mNotificationService;

    public static final int NOTIFICATION_SERVICE_TYPE_UNKNOWN = 0;
    public static final int NOTIFICATION_SERVICE_TYPE_GCM = 1;
    public static final int NOTIFICATION_SERVICE_TYPE_APNS = 2;

    public DeviceInfo() {
        mId = BigInteger.ZERO;
        mDeviceId = "";
        mJid = "";
        mNotificationService = NOTIFICATION_SERVICE_TYPE_UNKNOWN;
    }

    public BigInteger getId() {
        return mId;
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public String getDeviceId() {
        return mDeviceId;
    }

    public void setDeviceId(String deviceId) {
        mDeviceId = deviceId;
    }

    public String getJid() {
        return mJid;
    }

    public void setJid(String jid) {
        mJid = jid;
    }

    public int getNotificationService() {
        return mNotificationService;
    }

    public void setNotificationService(int notificationService) {
        mNotificationService = notificationService;
    }



}
