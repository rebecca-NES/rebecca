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

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Iterator;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSPlugin;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatRoomStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.NotificationManager;
import jp.co.nec.necst.spf.globalSNS.ContextHub.NotificationStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.TenantSystemConfDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.NotificationDbData;
import jp.co.nec.necst.spf.globalSNS.Data.UserAccountInfo;
import jp.co.nec.necst.spf.globalSNS.Group.CommunityManager;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.MessageNotificationApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.WebSocketApiExchanger;
import net.arnx.jsonic.JSON;
import net.arnx.jsonic.JSONException;

import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class WebSocketClientNotifier {
    private static final Logger Log = LoggerFactory
            .getLogger(WebSocketClientNotifier.class);

    private static final int DEFULT_CLIENT_PUSH_NOTIFICATION_KEEP_DAYS = 90;
    private static final int DEFULT_CLIENT_PUSH_NOTIFICATION_MAX_COUNT = 100;

    private static WebSocketClientNotifier mInstance = null;

    private WebSocketClientNotifier() {
    }

    public static WebSocketClientNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new WebSocketClientNotifier();
        }
        return mInstance;
    }

    public void notifyStoredData(String jid, Timestamp clientLastUpdatedAt) {
        final String logPrefix = "notifyStoredData() : ";
        if (jid == null || "".equals(jid)) {
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return;
        }
        boolean isStartThread = false;
        for (int i = 0; i < GlobalSNSPlugin.CREATE_THREAD_RETRY_MAXIMUM_COUNT; i++) {
            try {
                OnLoginNotifyThread onLoginNotifyThread = new OnLoginNotifyThread(
                        jid, clientLastUpdatedAt);
                onLoginNotifyThread.start();
                isStartThread = true;
                break;
            } catch (Throwable throwObject) {
                try {
                    Log.error(logPrefix + "Error occurred on starting thread.",
                            throwObject);
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
        private Timestamp mClientLastUpdatedAt = null;

        public OnLoginNotifyThread(String jidStr, Timestamp clientLastUpdatedAt) {
            mJidStr = jidStr;
            mClientLastUpdatedAt = clientLastUpdatedAt;
        }

        public void run() {
            final String logPrefix = "ProcessThread - run() : ";
            if (mJidStr == null || mJidStr.equals("")) {
                Log.error(logPrefix
                        + "OnLoginNotifyThread#run : mJidStr is invalid");
                return;
            }
            String keepDaysStr = TenantSystemConfDbHelper
                    .getValue(TenantSystemConfDbHelper.KEY_CLIENT_PUSH_NOTIFICATION_KEEP_DAYS);
            int keepDays = DEFULT_CLIENT_PUSH_NOTIFICATION_KEEP_DAYS;
            if (keepDaysStr != null) {
                try {
                    keepDays = Integer.parseInt(keepDaysStr);
                } catch (NumberFormatException e) {
                    Log.error(
                            logPrefix
                                    + "'client push notification keep days' is invalid : "
                                    + keepDaysStr + " ... Use "
                                    + String.valueOf(keepDays), e);
                }
            } else {
                Log.error(logPrefix + "keepDays setting is nothing... Use "
                        + String.valueOf(keepDays), new Throwable());
            }
            boolean deletableNotification = true;
            if (mClientLastUpdatedAt != null) {
                Calendar calendar = Calendar.getInstance();
                long now = calendar.getTimeInMillis();
                long clientLastUpdatedTime = mClientLastUpdatedAt.getTime();
                long keepTime = clientLastUpdatedTime + (long) keepDays * 24
                        * 60 * 60 * 1000;
                if (now < keepTime) {
                    if (!notifyRecentMessage()) {
                        deletableNotification = false;
                    }
                }
            }
            if (deletableNotification) {
                NotificationStoreDbHelper.deleteNotificationToDbByJid(mJidStr,
                        NotificationStoreDbHelper.FilterMode.WEBSOCKET);
            }
        }

        private boolean notifyRecentMessage() {
            final String logPrefix = "ProcessThread - notifyRecentMessage() : ";
            String maxNotifyCountStr = TenantSystemConfDbHelper
                    .getValue(TenantSystemConfDbHelper.KEY_CLIENT_PUSH_NOTIFICATION_MAX_COUNT);
            int maxNotifyCount = DEFULT_CLIENT_PUSH_NOTIFICATION_MAX_COUNT;
            if (maxNotifyCountStr != null) {
                try {
                    maxNotifyCount = Integer.parseInt(maxNotifyCountStr);
                } catch (NumberFormatException e) {
                    Log.info(logPrefix
                            + "'client push notification max count' is invalid : "
                            + maxNotifyCountStr + " ... Use "
                            + String.valueOf(maxNotifyCount));
                }
            } else {
                Log.info(logPrefix + "max count setting is nothing... Use "
                        + String.valueOf(maxNotifyCount));
            }
            boolean ret = true;
            int allCount = NotificationStoreDbHelper.getNotificationCountByJid(
                    mJidStr, NotificationStoreDbHelper.FilterMode.WEBSOCKET);
            if (allCount > 0) {
                List<NotificationDbData> notificationDbDataList = NotificationStoreDbHelper
                        .getNotificationDataListByJid(mJidStr,
                                NotificationStoreDbHelper.FilterMode.WEBSOCKET,
                                maxNotifyCount, false);
                List<String> itemIdList = new ArrayList<String>();
                for (NotificationDbData notificationDbData : notificationDbDataList) {
                    int notificationType = notificationDbData
                            .getNotificationType();
                    if (notificationType != NotificationDbData.NOTIFICATION_TYPE_MESSAGE_WEBSOCKET) {
                        Log.info(logPrefix
                                + "notificationType is invalid. notificationType="
                                + String.valueOf(notificationType));
                        continue;
                    }
                    int dataType = notificationDbData.getDataType();
                    if (dataType != NotificationDbData.DATA_TYPE_WEBSOCKET) {
                        Log.info(logPrefix + "dataType is invalid. dataType="
                                + String.valueOf(dataType));
                        continue;
                    }
                    String notificationData = notificationDbData
                            .getNotificationData();
                    MessageNotifyData messageNotifyData = null;
                    try {
                        messageNotifyData = JSON.decode(notificationData,
                                MessageNotifyData.class);
                    } catch (JSONException e) {
                        Log.error(logPrefix + "failed to decode JSON. data="
                                + notificationData, new Throwable());
                        continue;
                    }
                    if (messageNotifyData == null) {
                        Log.error(logPrefix
                                + "messageNotifyData is null. data="
                                + notificationData, new Throwable());
                        continue;
                    }
                    if (messageNotifyData.itemId == null
                            || "".equals(messageNotifyData.itemId)) {
                        Log.error(logPrefix
                                + "messageNotifyData.itemId is invalid",
                                new Throwable());
                        continue;
                    }
                    itemIdList.add(messageNotifyData.itemId);
                }
                if (!itemIdList.isEmpty()) {
                    List<Message> messageList = MessageStoreDbHelper
                            .getMessageDbDataByItemIdsWithoutReadInfo(itemIdList);
                    ret = pushMessage(mJidStr, messageList, allCount);
                }
            }

            return ret;
        }
    }

    private class MessageNotifyData {
        public String itemId = "";
    }

    public void notifyMessage(String jid, Message message) {
        Log.debug("do func WebSocketClientNotifier.notifyMessage(...");
        if (!checkNotify(jid, message)) {
            return;
        }

        List<GlobalSNSWebSocket> socketList = WebSocketClientManager
                .getInstance().getWebSocketList(jid);
        if (socketList == null) {
            storeNotificationMessage(jid, message);
            return;
        }

        List<Message> messageList = new ArrayList<Message>();
        messageList.add(message);
        int count = messageList.size();
        boolean ret = pushMessage(jid, messageList, count);
        if (!ret) {
            storeNotificationMessage(jid, message);
        }
    }

    public void notifyUpdateMessageBody(String jid, Message message) {
        Log.debug("do func WebSocketClientNotifier.notifyUpdateMessageBody(...");
        if (!checkNotify(jid, message)) {
            return;
        }

        List<GlobalSNSWebSocket> socketList = WebSocketClientManager
                .getInstance().getWebSocketList(jid);
        if (socketList == null) {
            storeNotificationMessage(jid, message);
            return;
        }

        List<Message> messageList = new ArrayList<Message>();
        messageList.add(message);
        int count = messageList.size();
        boolean ret = pushMessage(jid, messageList, count, 2);
        if (!ret) {
            storeNotificationMessage(jid, message);
        }
    }

    public boolean pushMessage(String jid, List<Message> messageList,
                               int allCount) {
        Log.debug("do func WebSocketClientNotifier.pushMessage(.. not extraSubType");
        return this.pushMessage(jid, messageList, allCount, -1);
    }
    public boolean pushMessage(String jid, List<Message> messageList,
                               int allCount, int extraSubType) {
        Log.debug("do func WebSocketClientNotifier.pushMessage(.. in extraSubType");
        final String logPrefix = "pushMessage() : ";
        if (jid == null || "".equals(jid)) {
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return false;
        }
        if (messageList == null) {
            Log.error(logPrefix + "message is null", new Throwable());
            return false;
        }

        String id = StringUtils.randomString(5) + "__"
                + StringUtils.randomString(5);
        MessageNotificationApi api = new MessageNotificationApi();
        api.id = id;
        api.version = 1;
        api.content = api.new Content();
        MessageNotificationApi.Content content = api.content;
        content.allCount = allCount;
        content.count = messageList.size();
        if(extraSubType >= 0){
            api.content.extras = api.content.new Extras();
            api.content.extras.subType = extraSubType;
        }
        content.items = new ArrayList<MessageNotificationApi.Content.Message>();
        boolean isDetail = (content.count == 1);
        for (Iterator<Message> it = messageList.iterator(); it.hasNext();) {
            Message message = it.next();
            if (message == null) {
                continue;
            }
            MessageNotificationApi.Content.Message contentMessage;
            if (isDetail) {
                MessageNotificationApi.Content.MessageDetail messageData = content.new MessageDetail();
                messageData.itemId = message.getItemId();
                String fromJid = message.getMsgFrom();
                UserAccountInfo accountInfo = UserAccountManager.getInstance()
                        .getUserAccountInfoByJid(fromJid);
                if (accountInfo != null) {
                    messageData.from = accountInfo.getLoginAccount();
                }
                String nickName = GlobalSNSUtils.getUserName(fromJid);
                try {
                    nickName = URLDecoder.decode(nickName, "UTF-8");
                    nickName = URLEncoder.encode(nickName, "UTF-8");
                } catch (UnsupportedEncodingException e) {
                    nickName = "";
                }
                messageData.fromName = nickName;

                int messageType = message.getMsgType();
                switch (messageType) {
                    case Message.TYPE_CHAT:
                        messageData.to = message.getMsgTo();
                        messageData.groupName = "";
                        break;
                    case Message.TYPE_GROUP_CAHT:
                        messageData.to = message.getMsgTo();
                        if (messageData.to != null
                                && !"".equals(messageData.to)) {

                            ChatRoomInfo chatRoomInfo = ChatRoomStoreDbHelper
                                    .getChatRoomInfoByRoomId(messageData.to);
                            if (chatRoomInfo != null) {
                                String groupName = chatRoomInfo.getRoomName();
                                try {
                                    groupName = URLDecoder.decode(groupName,
                                            "UTF-8");
                                    groupName = URLEncoder.encode(groupName,
                                            "UTF-8");
                                } catch (UnsupportedEncodingException e) {
                                    groupName = "";
                                }
                                messageData.groupName = groupName;
                            }
                        }
                        break;
                    case Message.TYPE_COMMUNITY:
                        messageData.to = message.getMsgTo();
                        if (messageData.to != null
                                && !"".equals(messageData.to)) {
                            CommunityInfo communityInfo = CommunityManager
                                    .getInstance()
                                    .getCommunityInfoWithoutMemberInfo(
                                            messageData.to);
                            if (communityInfo != null) {
                                String groupName = communityInfo.getRoomName();
                                try {
                                    groupName = URLDecoder.decode(groupName,
                                            "UTF-8");
                                    groupName = URLEncoder.encode(groupName,
                                            "UTF-8");
                                } catch (UnsupportedEncodingException e) {
                                    groupName = "";
                                }
                                messageData.groupName = groupName;
                            }
                        }
                        break;
                    default:
                        messageData.to = "";
                        messageData.groupName = "";
                        break;
                }
                String title = message.getSubStringEntry("title");
                if (title != null) {
                    try {
                        title = URLDecoder.decode(title, "UTF-8");
                        title = URLEncoder.encode(title, "UTF-8");
                    } catch (UnsupportedEncodingException e) {
                        title = "";
                    }
                    messageData.title = title;
                }
                String body = message.getSubStringEntry("body");
                if (body != null) {
                    try {
                        body = URLDecoder.decode(body, "UTF-8");
                        body = URLEncoder.encode(body, "UTF-8");
                    } catch (UnsupportedEncodingException e) {
                        body = "";
                    }
                    messageData.body = body;
                }
                messageData.status = message.getStatus();
                messageData.createdAt = message.getCreatedAtStr();
                messageData.updatedAt = message.getUpdatedAtStr();
                contentMessage = messageData;
            } else {
                contentMessage = content.new Message();
            }
            contentMessage.subType = message.getMsgType();
            content.items.add(contentMessage);
        }

        String json = WebSocketApiExchanger
                .createNotificationApiJsonString(api);

        List<GlobalSNSWebSocket> socketList = WebSocketClientManager
                .getInstance().getWebSocketList(jid);
        if (socketList == null) {
            Log.info(logPrefix + " Client WebSocket is null : jid = " + jid);
            return false;
        }
        boolean result = false;
        List<GlobalSNSWebSocket> copiedSocketList = new ArrayList<GlobalSNSWebSocket>();
        synchronized (socketList) {
            int socketCount = socketList.size();
            for (int i = 0; i < socketCount; i++) {
                copiedSocketList.add(socketList.get(i));
            }
        }
        int copiedSocketListCount = copiedSocketList.size();
        for (int i = 0; i < copiedSocketListCount; i++) {
            GlobalSNSWebSocket socket = copiedSocketList.get(i);
            if (socket == null) {
                continue;
            }
            boolean ret = socket.push(json);
            if (ret) {
                result = true;
            }
        }
        return result;
    }

    private void storeNotificationMessage(String jid, Message message) {
        final String logPrefix = "storeNotificationMessage() : ";
        if (jid == null || jid.trim().equals("")) {
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return;
        }
        if (message == null) {
            Log.error(logPrefix + "message is null", new Throwable());
            return;
        }
        JID jidData = new JID(jid);
        if (GlobalSNSUtils.isAvailable(jidData)) {
            return;
        }

        Timestamp clientLastUpdatedAt = UserAccountManager.getInstance()
                .getNotificationClientLastUpdatedAt(jid);

        String keepDaysStr = TenantSystemConfDbHelper
                .getValue(TenantSystemConfDbHelper.KEY_CLIENT_PUSH_NOTIFICATION_KEEP_DAYS);
        int keepDays = DEFULT_CLIENT_PUSH_NOTIFICATION_KEEP_DAYS;
        if (keepDaysStr != null) {
            try {
                keepDays = Integer.parseInt(keepDaysStr);
            } catch (NumberFormatException e) {
                Log.error(logPrefix
                        + "'client push notification keep days' is invalid : "
                        + keepDaysStr + " ... Use " + String.valueOf(keepDays),
                        e);
            }
        } else {
            Log.error(logPrefix + "keepDays setting is nothing... Use "
                    + String.valueOf(keepDays), new Throwable());
        }
        if (clientLastUpdatedAt != null) {
            Calendar calendar = Calendar.getInstance();
            long now = calendar.getTimeInMillis();
            long clientLastUpdatedTime = clientLastUpdatedAt.getTime();
            long keepTime = clientLastUpdatedTime + (long) keepDays * 24 * 60
                    * 60 * 1000;
            if (now < keepTime) {
                MessageNotifyData messageNotifyData = new MessageNotifyData();
                messageNotifyData.itemId = message.getItemId();
                String notifyData = JSON.encode(messageNotifyData);
                NotificationDbData notificationDbData = new NotificationDbData();
                notificationDbData
                        .setNotificationType(NotificationDbData.NOTIFICATION_TYPE_MESSAGE_WEBSOCKET);
                notificationDbData
                        .setDataType(NotificationDbData.DATA_TYPE_WEBSOCKET);
                notificationDbData.setNotificationData(notifyData);
                notificationDbData.setJid(jid);
                notificationDbData.setNotifiedDate(new Timestamp(now));
                boolean isSaved = NotificationManager.getInstatnce()
                        .saveNotificateData(notificationDbData);
                if (!isSaved) {
                    Log.error(logPrefix + "Fail Notification Data.",
                            new Throwable());
                }
            } else {
                NotificationStoreDbHelper.deleteNotificationToDbByJid(jid,
                        NotificationStoreDbHelper.FilterMode.WEBSOCKET);
            }
        }
    }

    private boolean checkNotify(String jid, Message message) {
        final String logPrefix = "checkNotify() : ";
        if (jid == null || jid.trim().equals("")) {
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return false;
        }
        if (message == null) {
            Log.error(logPrefix + "message is null", new Throwable());
            return false;
        }
        boolean result = false;
        int messageType = message.getMsgType();
        switch (messageType) {
            case Message.TYPE_PUBLIC:
                result = checkPublicMessage(jid, message);
                break;
            case Message.TYPE_TASK:
                result = checkTaskMessage(jid, message);
                break;
            case Message.TYPE_CHAT:
                result = checkChatMessage(jid, message);
                break;
            case Message.TYPE_GROUP_CAHT:
                result = checkGroupChatMessage(jid, message);
                break;
            case Message.TYPE_COMMUNITY:
                result = checkCommunityMessage(jid, message);
                break;
            default:
                result = false;
                break;
        }
        return result;
    }

    private boolean checkPublicMessage(String jid, Message message) {
        return true;
    }

    private boolean checkTaskMessage(String jid, Message message) {
        final String logPrefix = "checkTaskMessage() : ";
        if (jid == null || jid.trim().equals("")) {
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return false;
        }
        if (message == null) {
            Log.error(logPrefix + "message is null", new Throwable());
            return false;
        }
        String updateBy = message.getUpdatedBy();
        if (jid.equals(updateBy)) {
            return false;
        }
        String client = message.getClient();
        String owner = message.getOwner();
        if (!client.equals(owner)) {
            if (jid.equals(client)) {
                return true;
            }
            if (jid.equals(owner)) {
                int status = message.getStatus();
                boolean isNew = (status == Message.STATUS_NEW);
                if (isNew) {
                    return true;
                }
            }
        }
        if (jid.equals(owner)) {
            return true;
        }
        return false;
    }

    private boolean checkChatMessage(String jid, Message message) {
        return !isMessageFrom(jid, message);
    }

    private boolean checkGroupChatMessage(String jid, Message message) {
        return !isMessageFrom(jid, message);
    }

    private boolean checkCommunityMessage(String jid, Message message) {
        return !isMessageFrom(jid, message);
    }

    private boolean isMessageFrom(String jid, Message message) {
        final String logPrefix = "isMessageFrom() : ";
        if (jid == null || jid.trim().equals("")) {
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return false;
        }
        if (message == null) {
            Log.error(logPrefix + "message is null", new Throwable());
            return false;
        }
        String messageFrom = message.getMsgFrom();
        return jid.equals(messageFrom);
    }

}
