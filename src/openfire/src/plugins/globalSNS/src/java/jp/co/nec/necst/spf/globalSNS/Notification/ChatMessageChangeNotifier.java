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

public class ChatMessageChangeNotifier extends AbstractIndividualNotifier<String> {
    private static final Logger Log = LoggerFactory
            .getLogger(ChatMessageChangeNotifier.class);
    private static ChatMessageChangeNotifier mInstance = null;

    private ChatMessageChangeNotifier() {
    }

    public static ChatMessageChangeNotifier getInstance() {
        Log.debug("do func  ChatMessageChangeNotifier#getInstance");
        if (mInstance == null) {
            mInstance = new ChatMessageChangeNotifier();
        }
        return mInstance;
    }

    public void notifyChatMessage(String itemId) {
        Log.debug("do func  ChatMessageChangeNotifier#notifyChatMessage");
        if (itemId == null) {
            Log.error("ChatMessageChangeNotifier#notifyChatMessage::itemId is null");
            return;
        }
        addQueue(itemId);
    }

    @Override
    protected void threadProcessOneData(String itemId) {
        Log.debug("do func  ChatMessageChangeNotifier#threadProcessOneData");
        if (itemId == null) {
            Log.error("ChatMessageChangeNotifier#threadProcessOneData::itemId is null");
            return;
        }
        Message message = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        if (message == null) {
            Log.error("ChatMessageChangeNotifier#threadProcessOneData::message is null");
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
            if (jidStr == null) {
                continue;
            }
            JID jid = new JID(jidStr);
            WebSocketClientNotifier.getInstance()
                    .notifyMessage(jidStr, message);
        }
    }

    private String getPartnerJid(JID reciverJid, Message chatMessage) {
        Log.debug("do func  ChatMessageChangeNotifier#getPartnerJid");
        if (reciverJid == null) {
            Log.error("ChatMessageChangeNotifier#getPartnerJid:: reciverJid is null");
            return null;
        }
        if (chatMessage == null) {
            Log.error("ChatMessageChangeNotifier#getPartnerJid:: Message is null");
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
            Log.debug("do func  ChatMessageChangeNotifier in ChatMessageNotification.createNotificationMessage(...");
            if (mTo == null || mMessage == null) {
                Log.error("ChatMessageNotification#createNotificationMessage::parameter is invalid");
                return null;
            }
            org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
            String from = XMPPServer.getInstance().getServerInfo()
                    .getXMPPDomain();
            pushXmppMessage.setFrom(from);
            pushXmppMessage.setTo(mTo);
            pushXmppMessage.setID("notifyMessage" + StringUtils.randomString(5) + "__"
                    + from + "__" + StringUtils.randomString(5));
            Element notifyElem = pushXmppMessage.addChildElement("notify",
                    "http://necst.nec.co.jp/protocol/updatemessagebody");
            Element contentElem = DocumentHelper.createElement("content");
            contentElem.addAttribute("type",
                                     Message.getMessageTypeString(mMessage));
            notifyElem.add(contentElem);
            Element extrasElem = DocumentHelper.createElement("extras");
            contentElem.add(extrasElem);
            Element subTypeElem = DocumentHelper.createElement("sub_type");
            subTypeElem.setText("2");
            extrasElem.add(subTypeElem);

            Element items = DocumentHelper.createElement("items");
            items.addAttribute("count", String.valueOf(1));
            contentElem.add(items);
            Element item = MessageAdapter.getInstance()
                .getMessageItemElement(mMessage);
            items.add(item);

            return pushXmppMessage;
        }

    }

}
