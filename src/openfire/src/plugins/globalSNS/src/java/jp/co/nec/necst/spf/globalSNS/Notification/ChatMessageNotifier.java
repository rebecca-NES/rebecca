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

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeControler;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content.messageNotice.entry;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientNotifier;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class ChatMessageNotifier extends AbstractIndividualNotifier<String> {
    private static final Logger Log = LoggerFactory
            .getLogger(ChatMessageNotifier.class);
    private static ChatMessageNotifier mInstance = null;

    private ChatMessageNotifier() {
    }

    public static ChatMessageNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new ChatMessageNotifier();
        }
        return mInstance;
    }

    public void notifyChatMessage(String itemId) {
        if (itemId == null) {
            Log.error("ChatMessageNotifier#notifyChatMessage::itemId is null");
            return;
        }
        addQueue(itemId);
    }

    @Override
    protected void threadProcessOneData(String itemId) {
        if (itemId == null) {
            Log.error("ChatMessageNotifier#threadProcessOneData::itemId is null");
            return;
        }
        Message message = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        if (message == null) {
            Log.error("ChatMessageNotifier#threadProcessOneData::message is null");
            return;
        }
        Set<String> receiverList = MessageAdapter.getInstance()
                .getMessageReceiverSet(message);

        List<String> highPriorityReceiverList = new ArrayList<String>();
        List<String> lowPriorityReceiverList = new ArrayList<String>();
        String fromJid = message.getMsgFrom();
        for (String jidStr : receiverList) {
            if (jidStr == null) {
                continue;
            }
            if (jidStr.equals(fromJid)) {
                highPriorityReceiverList.add(jidStr);
            } else {
                lowPriorityReceiverList.add(jidStr);
            }
        }

        for (String toNotificationJid : highPriorityReceiverList) {
            ChatMessageNotification chatNotification = new ChatMessageNotification(
                    toNotificationJid, message);
            Notifier.getInstance().notifyHighPriortyNotification(
                    chatNotification);
        }
        for (String toNotificationJid : lowPriorityReceiverList) {
            ChatMessageNotification chatNotification = new ChatMessageNotification(
                    toNotificationJid, message);
            Notifier.getInstance().notifyLowPriortyNotification(
                    chatNotification);
        }
        for (String jidStr : receiverList) {
            JID jid = new JID(jidStr);
            notifySmartDevice(jid, message);
            WebSocketClientNotifier.getInstance()
                    .notifyMessage(jidStr, message);
        }
    }

    private void notifySmartDevice(JID reciverJid, Message chatMessage) {
        if (reciverJid == null) {
            Log.error("ChatMessageNotifier#notifySmartDevice:: reciverJid is null");
            return;
        }
        if (chatMessage == null) {
            Log.error("ChatMessageNotifier#notifySmartDevice:: Message is null");
            return;
        }
        Log.info("receiverJid:" + reciverJid.toBareJID() + " toJID:"
                + chatMessage.getMsgTo() + " fromJID: "
                + chatMessage.getMsgFrom());
        if (reciverJid.toBareJID().equalsIgnoreCase(chatMessage.getMsgFrom())) {
            return;
        }
        SmartDeviceNoticeInfo deviceNoticeInfo = new SmartDeviceNoticeInfo();
        SmartDeviceNoticeInfo.content content = deviceNoticeInfo.new content();

        content.setType(SmartDeviceNoticeInfo.content.TYPE_MESSAGE);

        SmartDeviceNoticeInfo.content.messageNotice messageNotice = content.new messageNotice();
        messageNotice.setMessageType(Message.TYPE_CHAT);

        messageNotice.setFromJid(chatMessage.getMsgFrom());

        String partnerJid = getPartnerJid(reciverJid, chatMessage);
        String nickname = GlobalSNSUtils.getUserName(partnerJid);
        SmartDeviceNoticeInfo.content.messageNotice.toInfo toInfo = messageNotice.new toInfo();
        toInfo.setJid(partnerJid);
        toInfo.setNickname(nickname);
        messageNotice.setToInfo(toInfo);
        boolean isWF = true;
        messageNotice.setIsWF(isWF);

        SmartDeviceNoticeInfo.content.messageNotice.entry entry = messageNotice.new entry();
        if (0 == chatMessage.getDeleteFlag()) {
            entry.setBody(chatMessage.getMessageBodyInEntry());
        }
        messageNotice.setEntry(entry);

        content.setMessageNotice(messageNotice);

        deviceNoticeInfo.setContent(content);

        SmartDeviceNoticeControler.notify(reciverJid, deviceNoticeInfo);
    }

    private String getPartnerJid(JID reciverJid, Message chatMessage) {
        if (reciverJid == null) {
            Log.error("ChatMessageNotifier#notifySmartDevice:: reciverJid is null");
            return null;
        }
        if (chatMessage == null) {
            Log.error("ChatMessageNotifier#getPartnerJid:: Message is null");
            return null;
        }
        String partnerJid = chatMessage.getMsgFrom();
        if (partnerJid.equals(reciverJid.toBareJID())) {
            partnerJid = chatMessage.getMsgTo();
        }
        return partnerJid;
    }

    class ChatMessageNotification extends Notification {
        public Message mMessage = null;

        public ChatMessageNotification(String toJid, Message message) {
            mTo = toJid;
            mMessage = message;
        }

        @Override
        public org.xmpp.packet.Message createNotificationMessage() {
            Log.debug("do func  ChatMessageNotification.createNotificationMessage(...");
            if (mTo == null || mMessage == null) {
                Log.error("ChatMessageNotification#createNotificationMessage::parameter is invalid");
                return null;
            }
            org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
            String from = XMPPServer.getInstance().getServerInfo()
                    .getXMPPDomain();
            pushXmppMessage.setFrom(from);
            pushXmppMessage.setTo(mTo);
            pushXmppMessage.setID("chat" + StringUtils.randomString(5) + "__"
                    + from + "__" + StringUtils.randomString(5));
            Element chatElem = pushXmppMessage.addChildElement("chat",
                    "http://necst.nec.co.jp/protocol/chat#send");
            Element items = DocumentHelper.createElement("items");
            items.addAttribute("count", String.valueOf(1));
            chatElem.add(items);
            Element item = MessageAdapter.getInstance().getMessageItemElement(
                    mMessage);
            items.add(item);

            return pushXmppMessage;
        }

    }

}
