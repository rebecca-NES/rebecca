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

package jp.co.nec.necst.spf.globalSNS.ContextHub;

import java.util.ArrayList;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSPlugin;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.NotificationDbData;
import jp.co.nec.necst.spf.globalSNS.Notification.CommunityNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.GroupChatNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.MessageNotifier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class NotificationManager {

    private static final Logger Log = LoggerFactory
            .getLogger(NotificationManager.class);

    private static NotificationManager mInstance = null;

    public static NotificationManager getInstatnce() {
        if (mInstance == null) {
            mInstance = new NotificationManager();
        }
        return mInstance;
    }

    private NotificationManager() {
    }

    public boolean saveNotificateData(NotificationDbData notificationDbData) {
        boolean ret = false;
        if (notificationDbData == null) {
            Log.error("NotificationManager#saveNotificateData : notificationDbData is null");
            return ret;
        }
        return NotificationStoreDbHelper
                .insertNotificationDataToDb(notificationDbData);
    }

    public void onLogin(String jidStr) {
        final String logPrefix = "onLogin :";
        if (jidStr == null || jidStr.equals("")) {
            Log.error("NotificationManager#onLogin : jidStr is invalid");
            return;
        }
        JID jid = new JID(jidStr);
        if (!GlobalSNSUtils.isExistUser(jid)) {
            Log.error("NotificationManager#onLogin : user is unknown. jid="
                    + jidStr);
            return;
        }
        boolean isStartThread = false;
        for (int i = 0; i < GlobalSNSPlugin.CREATE_THREAD_RETRY_MAXIMUM_COUNT; i++) {
            try {
                OnLoginNotifyThread onLoginNotifyThread = new OnLoginNotifyThread(
                        jidStr);
                onLoginNotifyThread.start();
                isStartThread = true;
                break;
            } catch (Throwable throwObject) {
                try {
                    Log.error(logPrefix
                            + "Error occurred on starting thread. jidStr="
                            + jidStr, throwObject);
                } catch (OutOfMemoryError oomError) {
                }
                try {
                    Thread.sleep(GlobalSNSPlugin.CREATE_THREAD_RETRY_BETWEEN_TIME_MS);
                } catch (InterruptedException e) {
                }
            }
        }
        if (!isStartThread) {
            try {
                Log.error(logPrefix + "failded to starting thread.",
                        new Throwable());
            } catch (OutOfMemoryError oomError) {
            }
        }
    }

    private class OnLoginNotifyThread extends Thread {
        private String mJidStr = null;

        public OnLoginNotifyThread(String jidStr) {
            mJidStr = jidStr;
        }

        public void run() {
            if (mJidStr == null || mJidStr.equals("")) {
                Log.error("OnLoginNotifyThread#run : mJidStr is invalid");
                return;
            }
            notifyOnLogin();
        }

        private void notifyOnLogin() {
            final String logPrefix = "notifyOnLogin : ";
            if (mJidStr == null || mJidStr.equals("")) {
                Log.error("OnLoginNotifyThread#notifyOnLogin() : mJidStr is invalid");
                return;
            }
            JID jid = new JID(mJidStr);
            if (!GlobalSNSUtils.isExistUser(jid)) {
                Log.error("OnLoginNotifyThread#notifyOnLogin() : user is unknown. jid="
                        + mJidStr);
                return;
            }
            int timeoutMills = 30000;
            if (!GlobalSNSUtils.waitUserLogined(mJidStr, timeoutMills)) {
                Log.error("OnLoginNotifyThread#notifyOnLogin() :: waitUserLogined is false. jid = "
                        + mJidStr);
                return;
            }
            try {
                List<NotificationDbData> notificationDbDataList = NotificationStoreDbHelper
                        .getNotificationDataListByJid(mJidStr,
                                NotificationStoreDbHelper.FilterMode.XMPP, 0,
                                true);
                if (notificationDbDataList == null) {
                    Log.error("OnLoginNotifyThread#notifyOnLogin() :: notificationDbDataList is null.");
                    return;
                }
                int count = notificationDbDataList.size();
                List<NotificationDbData> groupChatNotificationList = new ArrayList<NotificationDbData>();
                for (int i = 0; i < count; i++) {
                    NotificationDbData notificationDbData = notificationDbDataList
                            .get(i);
                    if (notificationDbData == null) {
                        Log.error("OnLoginNotifyThread#notifyOnLogin() :: notificationDbData is null. No."
                                + String.valueOf(i));
                        continue;
                    }
                    int notifyType = notificationDbData.getNotificationType();
                    switch (notifyType) {
                        case NotificationDbData.NOTIFICATION_TYPE_MESSAGE:
                            MessageNotifier.getInstance().sendNotification(
                                    notificationDbData);
                            break;
                        case NotificationDbData.NOTIFICATION_TYPE_CREATE_CHAT_ROOM:
                        case NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_ADD_MEMBER:
                        case NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_REMOVE_MEMBER:
                        case NotificationDbData.NOTIFICATION_TYPE_CHANGE_CHAT_ROOM_INFO:
                            groupChatNotificationList.add(notificationDbData);
                            break;
                        case NotificationDbData.NOTIFICATION_TYPE_CHANGE_COMMUNITY_INFO:
                        case NotificationDbData.NOTIFICATION_TYPE_ADD_COMMUNITY_MEMBER:
                        case NotificationDbData.NOTIFICATION_TYPE_UPDATE_COMMUNITY_OWNER:
                        case NotificationDbData.NOTIFICATION_TYPE_REMOVE_COMMUNITY_MEMBER:
                            CommunityNotifier.getInstance().sendNotification(
                                    notificationDbData);
                            break;
                        default:
                            Log.info("OnLoginNotifyThread#notifyOnLogin() :: notifyType is unknown. No."
                                    + String.valueOf(i)
                                    + " type="
                                    + String.valueOf(notifyType));
                            break;
                    }
                }
                GroupChatNotifier.getInstance()
                        .sendGroupChatNotificationListOnLogedIn(
                                groupChatNotificationList);
            } catch (Exception exception) {
                Log.error(
                        logPrefix
                                + "Error occurred on sending notification on loged in.",
                        exception);
            } catch (OutOfMemoryError oomError) {
                Log.error(logPrefix + "OutOfMemoryError occurred on loged in.",
                        oomError);
            }
            NotificationStoreDbHelper.deleteNotificationToDbByJid(mJidStr,
                    NotificationStoreDbHelper.FilterMode.ALL);
        }
    }
}
