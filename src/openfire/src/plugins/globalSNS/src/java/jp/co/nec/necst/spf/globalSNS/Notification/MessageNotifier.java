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

package jp.co.nec.necst.spf.globalSNS.Notification;

import java.math.BigInteger;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.NotificationManager;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.VoteStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.NotificationDbData;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Notification.NotificationDataMessage.Type;
import net.arnx.jsonic.JSON;
import net.arnx.jsonic.JSONException;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class MessageNotifier extends
        AbstractIndividualNotifier<NotificationDataMessage> {
    private static final Logger Log = LoggerFactory
            .getLogger(MessageNotifier.class);
    private static MessageNotifier mInstance = null;

    private MessageNotifier() {
    }

    public static MessageNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new MessageNotifier();
        }
        return mInstance;
    }

    public void notifyDeleteMessage(Message message) {
        Log.debug("do func MessageNotifier.notifyDeleteMessage(Message ...");
        if (message == null) {
            Log.error("MessageNotifier#notifyDeleteMessage::message is null");
            return;
        }
        NotificationDataMessage notificationData = new NotificationDataMessage();
        notificationData.mType = Type.DeleteMessage;
        notificationData.mMessage = message;
        addQueue(notificationData);
    }

    @Override
    protected void threadProcessOneData(NotificationDataMessage notificationData) {
        Log.debug("do func MessageNotifier.threadProcessOneData(...");
        if (notificationData == null) {
            Log.error("MessageNotifier#threadProcessOneData::notificationData is null");
            return;
        }
        switch (notificationData.mType) {
        case DeleteMessage:
            notifyDaleteMessageProcess(notificationData.mMessage);
            break;
        default:
            break;
        }
    }

    private void notifyDaleteMessageProcess(Message message) {
        Log.debug("do func MessageNotifier.notifyDaleteMessageProcess(...");
        if (message == null) {
            Log.error("MessageNotifier#notifyDaleteMessageProcess::message is null");
            return;
        }
        String deletedByJidStr = message.getDeletedBy();
        if(deletedByJidStr != null && !"".equals(deletedByJidStr)) {
            boolean adminDelete = MessageAdapter.isDeletedByAdmin(deletedByJidStr);
            if (adminDelete) {
                deletedByJidStr = deletedByJidStr.substring(Message.DELETED_BY_ADMIN.length());
            }
            Set<String> deletedByJidStrSet = new HashSet<String>();
            deletedByJidStrSet.add(deletedByJidStr);
            notifyDeleteMessage(message, deletedByJidStrSet);
        }
        Set<String> receiverJidSet = MessageAdapter.getInstance()
                .getMessageReceiverSet(message);
        if (receiverJidSet == null) {
            Log.error("MessageNotifier#notifyDaleteMessageProcess::receiverJidSet is null");
            return;
        }
        if(deletedByJidStr != null && !"".equals(deletedByJidStr)) {
            receiverJidSet.remove(deletedByJidStr);
        }
        if(receiverJidSet.size() > 0) {
            notifyDeleteMessage(message, receiverJidSet);
        }
    }

    private void notifyDeleteMessage(Message message,
            Collection<String> reciverJidCollection) {
        Log.debug("do func MessageNotifier.notifyDeleteMessage(Message, Collection<String> ...");
        if (message == null) {
            Log.error("message is null");
            return;
        }

        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        for (String receiverJid : reciverJidCollection) {
            org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
            pushXmppMessage.setFrom(from);
            pushXmppMessage.setTo(receiverJid);
            pushXmppMessage.setID("notify" + StringUtils.randomString(5) + "__"
                    + from + "__" + StringUtils.randomString(5));
            Element notifyElem = pushXmppMessage.addChildElement("notify",
                    "http://necst.nec.co.jp/protocol/message#delete");
            Element content = DocumentHelper.createElement("content");
            notifyElem.add(content);
            Element items = DocumentHelper.createElement("items");
            items.addAttribute("count", String.valueOf(1));
            content.add(items);
            Element item = MessageAdapter.getInstance()
                    .getDeleteMessageItemElement(message);
            items.add(item);
            XMPPServer.getInstance().getMessageRouter().route(pushXmppMessage);
        }
    }


    public void notifyMessage(Message message, Collection<JID> reciverJidCollection,
            boolean isRememberNotifyToLogined) {
        Log.debug("do func MessageNotifier.notifyMessage(...");
        if (message == null) {
            Log.error("MessageNotifier#notifyMessage::message is null");
            return;
        }
        if (reciverJidCollection == null) {
            Log.error("MessageNotifier#notifyMessage::reciverJidCollection is null");
            return;
        }

        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        for (JID receiverJid : reciverJidCollection) {
            if (!GlobalSNSUtils.isAvailable(receiverJid)) {
                if (isRememberNotifyToLogined) {
                    NotificationDbData notificationDbData = new NotificationDbData();
                    notificationDbData
                            .setNotificationType(NotificationDbData.NOTIFICATION_TYPE_MESSAGE);
                    notificationDbData
                            .setDataType(NotificationDbData.DATA_TYPE_DATA_ONLY);
                    MessageNotifyData messageNotifyData = new MessageNotifyData();
                    messageNotifyData.itemId = message.getItemId();
                    String dataString = JSON.encode(messageNotifyData);
                    notificationDbData.setNotificationData(dataString);
                    notificationDbData.setJid(receiverJid.toBareJID());
                    Calendar now = Calendar.getInstance();
                    notificationDbData.setNotifiedDate(new Timestamp(now
                            .getTimeInMillis()));
                    NotificationManager.getInstatnce().saveNotificateData(
                            notificationDbData);
                }
                continue;
            }
            if(Message.TYPE_QUESTIONNAIRE == message.getMsgType()) {
                Profile profile = UserProfileDbHelper.getUserProfileData(receiverJid.toBareJID().trim());
                if(profile == null){
                    Log.error("MessageNotifier#appendExtraQuestionnaireData::UserProfile from jid string is not exist");
                    return;
                }
                String s62 = GlobalSNSUtils.decimalToSixtyTwoString(BigInteger.valueOf(profile.getId()));
                String userId =  GlobalSNSUtils.escapeSqlData(s62);
                if(userId == null) {
                    Log.error("MessageNotifier#appendExtraQuestionnaireData::userId string is not exist");
                    return;
                }
                message.setVoteFlag(VoteStoreDbHelper.getVoteFlag(message, userId));
            }
            org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
            pushXmppMessage.setFrom(from);
            pushXmppMessage.setTo(receiverJid);
            pushXmppMessage.setID("notifyMessage" + StringUtils.randomString(5)
                    + "__" + from + "__" + StringUtils.randomString(5));
            Element notifyElem = pushXmppMessage.addChildElement("notify",
                    "http://necst.nec.co.jp/protocol/message");
            Element contentElem = DocumentHelper.createElement("content");
            contentElem.addAttribute("type",
                    Message.getMessageTypeString(message));
            notifyElem.add(contentElem);
            Element itemsElem = DocumentHelper.createElement("items");
            itemsElem.addAttribute("count", String.valueOf(1));
            contentElem.add(itemsElem);
            Element itemElem = MessageAdapter.getInstance()
                    .getMessageItemElement(message);
            if (itemElem == null) {
                Log.error("MessageNotifier#notifyMessage::itemElem is null");
                return;
            }
            itemsElem.add(itemElem);
            XMPPServer.getInstance().getMessageRouter().route(pushXmppMessage);
        }
    }

    public void notifyUpdateMessageBody(Message message, Collection<JID> reciverJidCollection,
            boolean isRememberNotifyToLogined) {
        Log.debug("do func  MessageNotifier.notifyUpdateMessageBody(...");
        if (message == null) {
            Log.error("MessageNotifier#notifyMessage::message is null");
            return;
        }
        if (reciverJidCollection == null) {
            Log.error("MessageNotifier#notifyMessage::reciverJidCollection is null");
            return;
        }

        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        for (JID receiverJid : reciverJidCollection) {
            if (!GlobalSNSUtils.isAvailable(receiverJid)) {
                if (isRememberNotifyToLogined) {
                    NotificationDbData notificationDbData = new NotificationDbData();
                    notificationDbData
                            .setNotificationType(NotificationDbData.NOTIFICATION_TYPE_MESSAGE);
                    notificationDbData
                            .setDataType(NotificationDbData.DATA_TYPE_DATA_ONLY);
                    MessageNotifyData messageNotifyData = new MessageNotifyData();
                    messageNotifyData.itemId = message.getItemId();
                    String dataString = JSON.encode(messageNotifyData);
                    notificationDbData.setNotificationData(dataString);
                    notificationDbData.setJid(receiverJid.toBareJID());
                    Calendar now = Calendar.getInstance();
                    notificationDbData.setNotifiedDate(new Timestamp(now
                            .getTimeInMillis()));
                    NotificationManager.getInstatnce().saveNotificateData(
                            notificationDbData);
                }
                continue;
            }
            org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
            pushXmppMessage.setFrom(from);
            pushXmppMessage.setTo(receiverJid);
            pushXmppMessage.setID("notifyMessage" + StringUtils.randomString(5)
                    + "__" + from + "__" + StringUtils.randomString(5));
            Element notifyElem = pushXmppMessage.addChildElement("notify",
                    "http://necst.nec.co.jp/protocol/updatemessagebody");
            Element contentElem = DocumentHelper.createElement("content");
            contentElem.addAttribute("type",
                    Message.getMessageTypeString(message));
            notifyElem.add(contentElem);
            Element extrasElem = DocumentHelper.createElement("extras");
            contentElem.add(extrasElem);
            Element subTypeElem = DocumentHelper.createElement("sub_type");
            subTypeElem.setText("2");
            extrasElem.add(subTypeElem);
            Element itemsElem = DocumentHelper.createElement("items");
            itemsElem.addAttribute("count", String.valueOf(1));
            contentElem.add(itemsElem);
            Element itemElem = MessageAdapter.getInstance()
                    .getMessageItemElement(message);
            if (itemElem == null) {
                Log.error("MessageNotifier#notifyMessage::itemElem is null");
                return;
            }
            itemsElem.add(itemElem);
            XMPPServer.getInstance().getMessageRouter().route(pushXmppMessage);
        }
    }

    public void sendNotification(NotificationDbData notificationDbData) {
        if (notificationDbData == null) {
            Log.error("MessageNotifier#sendNotification :: notificationDbData is null");
            return;
        }
        int notifyType = notificationDbData.getNotificationType();
        Message message = null;
        JID jid = null;
        switch (notifyType) {
        case NotificationDbData.NOTIFICATION_TYPE_MESSAGE:
            int dataType = notificationDbData.getDataType();
            if (dataType == NotificationDbData.DATA_TYPE_DATA_ONLY) {
                String notificationData = notificationDbData
                        .getNotificationData();
                if (notificationData == null || notificationData.equals("")) {
                    Log.error("MessageNotifier#sendNotification :: notificationData is invalid");
                    return;
                }
                String jidStr = notificationDbData.getJid();
                if (jidStr == null || jidStr.equals("")) {
                    Log.error("MessageNotifier#sendNotification :: jidStr is invalid");
                    return;
                }
                MessageNotifyData messageNotifyData = null;
                try {
                    messageNotifyData = JSON.decode(notificationData,
                            MessageNotifyData.class);
                } catch (JSONException e) {
                    Log.error("MessageNotifier#sendNotification :: failed to decode JSON. data="
                            + notificationData);
                    return;
                }
                if (messageNotifyData == null) {
                    Log.error("MessageNotifier#sendNotification :: messageNotifyData is null. data="
                            + notificationData);
                    return;
                }
                message = MessageAdapter.getInstance()
                        .getMessageAppendReadInfo(messageNotifyData.itemId,
                                jidStr);
                jid = new JID(jidStr);
            } else {
                Log.error("MessageNotifier#sendNotification :: notifyDataType is invalid. dataType="
                        + String.valueOf(dataType));
                return;
            }
            break;
        default:
            Log.error("MessageNotifier#sendNotification :: notifyType is unknown. type="
                    + String.valueOf(notifyType));
            return;
        }
        if (message == null) {
            Log.error("MessageNotifier#sendNotification :: message is null");
            return;
        }
        if (jid == null) {
            Log.error("MessageNotifier#sendNotification :: jid is null");
            return;
        }
        List<JID> sendToList = new ArrayList<JID>();
        sendToList.add(jid);
        notifyMessage(message, sendToList, false);
    }

    private class MessageNotifyData {
        public String itemId = "";
    }
}

class NotificationDataMessage {
    enum Type {
        SendMessage, DeleteMessage, ThreadTitle
    }

    public Message mMessage = null;
    public Type mType = null;
}
