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
import java.sql.Timestamp;
import java.text.SimpleDateFormat;

public class NotificationDbData {
    private BigInteger mId;
    private int mNotificationType;
    private int mDataType;
    private String mNotificationData;
    private String mJid;
    private Timestamp mNotifiedDate;

    public static final int NOTIFICATION_TYPE_UNKNOWN = 0;
    public static final int NOTIFICATION_TYPE_MESSAGE = 1;
    public static final int NOTIFICATION_TYPE_CREATE_CHAT_ROOM = 2;
    public static final int NOTIFICATION_TYPE_CHAT_ROOM_ADD_MEMBER = 3;
    public static final int NOTIFICATION_TYPE_CHAT_ROOM_REMOVE_MEMBER = 4;
    public static final int NOTIFICATION_TYPE_CHANGE_CHAT_ROOM_INFO = 5;
    public static final int NOTIFICATION_TYPE_CHANGE_COMMUNITY_INFO = 6;
    public static final int NOTIFICATION_TYPE_ADD_COMMUNITY_MEMBER = 7;
    public static final int NOTIFICATION_TYPE_UPDATE_COMMUNITY_OWNER = 8;
    public static final int NOTIFICATION_TYPE_REMOVE_COMMUNITY_MEMBER = 9;
    public static final int NOTIFICATION_TYPE_MESSAGE_WEBSOCKET = 101;

    public static final int DATA_TYPE_UNKNOWN = 0;
    public static final int DATA_TYPE_XMPP = 1;
    public static final int DATA_TYPE_DATA_ONLY = 2;
    public static final int DATA_TYPE_WEBSOCKET = 3;

    public NotificationDbData() {
        mId = BigInteger.ZERO;
        mNotificationType = NOTIFICATION_TYPE_UNKNOWN;
        mDataType = DATA_TYPE_UNKNOWN;
        mNotificationData = "";
        mJid = "";
        mNotifiedDate = null;
    }

    public BigInteger getId() {
        return mId;
    }
    public void setId(BigInteger id) {
        mId = id;
    }
    public int getNotificationType() {
        return mNotificationType;
    }
    public void setNotificationType(int notificationType) {
        mNotificationType = notificationType;
    }
    public int getDataType() {
        return mDataType;
    }
    public void setDataType(int dataType) {
        mDataType = dataType;
    }
    public String getNotificationData() {
        return mNotificationData;
    }
    public void setNotificationData(String notificationData) {
        mNotificationData = notificationData;
    }
    public String getJid() {
        return mJid;
    }
    public void setJid(String jid) {
        mJid = jid;
    }
    public Timestamp getNotifiedDate() {
        return mNotifiedDate;
    }
    public String getNotifiedDateStr() {
        if (mNotifiedDate == null) {
            return "";
        }
        long notifiedTime = mNotifiedDate.getTime();
        java.util.Date date = new java.util.Date(notifiedTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }
    public void setNotifiedDate(Timestamp notifiedDate) {
        mNotifiedDate = notifiedDate;
    }

}
