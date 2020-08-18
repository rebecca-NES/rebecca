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

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageOptionAdapter;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.MessageExistingReaderInfo;
import jp.co.nec.necst.spf.globalSNS.Setting.ShowMessageReadInfoSetting;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MessageOptionNotifier extends
        AbstractIndividualNotifier<INotification> {
    private static final Logger Log = LoggerFactory
            .getLogger(MessageOptionNotifier.class);
    private static MessageOptionNotifier mInstance = null;
    private static String DEMAND_TASK_TYPE_DEMAND = "DemandTask";
    private static String DEMAND_TASK_TYPE_CLEAR_DEMAND = "ClearDemandedTask";

    private MessageOptionNotifier() {
    }

    public static MessageOptionNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new MessageOptionNotifier();
        }
        return mInstance;
    }

    @Override
    protected void threadProcessOneData(INotification notificationData) {
        Log.debug("do func  MessageOptionAdapter.threadProcessOneData(");
        notificationData.sendNotification();
    }

    public void notifyDemandTask(Message message, String fromUserJid) {
        if (message == null) {
            Log.error("MessageOptionNotifier#notifyDemandTask::message is null");
            return;
        }
        if (fromUserJid == null || fromUserJid.equals("")) {
            Log.error("MessageOptionNotifier#notifyDemandTask::fromUserJid is invalid");
            return;
        }
        DemandTaskNotification notificationData = new DemandTaskNotification(
                DEMAND_TASK_TYPE_DEMAND, message, fromUserJid);
        addQueue(notificationData);
    }

    public void notifyClearDemandTask(Message message, String fromUserJid) {
        if (message == null) {
            Log.error("MessageOptionNotifier#notifyClearDemandTask::message is null");
            return;
        }
        if (fromUserJid == null || fromUserJid.equals("")) {
            Log.error("MessageOptionNotifier#notifyClearDemandTask::fromUserJid is invalid");
            return;
        }
        DemandTaskNotification notificationData = new DemandTaskNotification(
                DEMAND_TASK_TYPE_CLEAR_DEMAND, message, fromUserJid);
        addQueue(notificationData);
    }

    public void notifyReadMessage(
            List<MessageExistingReaderInfo> messageExistingReaderInfoList) {
        Log.debug("do func  MessageOptionAdapter.notifyReadMessage(");
        if (messageExistingReaderInfoList == null) {
            Log.error("MessageOptionNotifier#notifySetReadMessage::messageExistingReaderInfoList is invalid");
            return;
        }
        ReadMessageNotification readMessageNotification = new ReadMessageNotification(
                messageExistingReaderInfoList);
        addQueue(readMessageNotification);
    }

    private class DemandTaskNotification implements INotification {
        private String mType = null;
        private Message mMessage = null;
        private String mFromJid = null;

        DemandTaskNotification(String type, Message message, String fromJid) {
            mType = type;
            mMessage = message;
            mFromJid = fromJid;
        }

        public void sendNotification() {
            Log.debug("do func  MessageOptionAdapter.sendNotification(");
            if (mType == null || mMessage == null || mFromJid == null) {
                Log.error("DemandTaskNotification#sendNotification::parameter is null");
                return;
            }
            notifyDemandTaskOrClearDemandTask(mType, mMessage, mFromJid);
        }

        private void notifyDemandTaskOrClearDemandTask(String type,
                Message message, String fromUserJid) {
            Log.debug("do func  MessageOptionAdapter.notifyDemandTaskOrClearDemandTask(");
            if (message == null) {
                Log.error("message is null");
                return;
            }

            Set<String> receiverJidSet = MessageAdapter.getInstance()
                    .getMessageReceiverSet(message);
            if (receiverJidSet == null) {
                Log.error("MessageOptionNotifier#notifyDemandTaskOrClearDemandTask::receiverJidList is null");
                return;
            }
            String from = XMPPServer.getInstance().getServerInfo()
                    .getXMPPDomain();
            for (String receiverJid : receiverJidSet) {
                Log.debug("MessageOptionNotifier#notifyDemandTaskOrClearDemandTask:: send to : "
                        + receiverJid);
                org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
                pushXmppMessage.setFrom(from);
                pushXmppMessage.setTo(receiverJid);
                pushXmppMessage.setID("notify" + StringUtils.randomString(5)
                        + "__" + from + "__" + StringUtils.randomString(5));
                Element notifyElem = pushXmppMessage.addChildElement("notify",
                        "http://necst.nec.co.jp/protocol/messageoption");
                Element contentElem = DocumentHelper.createElement("content");
                notifyElem.add(contentElem);
                Element typeElem = DocumentHelper.createElement("type");
                typeElem.setText(type);
                contentElem.add(typeElem);

                Element itemsElem = DocumentHelper.createElement("items");
                itemsElem.addAttribute("count", String.valueOf(1));
                contentElem.add(itemsElem);
                Element itemElem = MessageOptionAdapter.getInstance()
                        .getDemandTaskItemElement(message, fromUserJid);
                itemsElem.add(itemElem);
                XMPPServer.getInstance().getMessageRouter()
                        .route(pushXmppMessage);
            }
        }
    }

    private class ReadMessageNotification implements INotification {

        private List<MessageExistingReaderInfo> mMessageExistingReaderInfoList = null;

        ReadMessageNotification(
                List<MessageExistingReaderInfo> messageExistingReaderInfoList) {
            mMessageExistingReaderInfoList = messageExistingReaderInfoList;
        }

        public void sendNotification() {
            for (MessageExistingReaderInfo messageExistingReaderInfo : mMessageExistingReaderInfoList) {
                runNotifySetReadMessage(messageExistingReaderInfo);
            }
        }

        private void runNotifySetReadMessage(
                MessageExistingReaderInfo messageExistingReaderInfo) {
            if (messageExistingReaderInfo == null) {
                Log.error("ReadMessageNotification#notifySetReadMessage::messageExistingReaderInfo is invalid");
                return;
            }
            String itemId = messageExistingReaderInfo.getItemId();
            Message message = MessageAdapter.getInstance()
                    .getMessageWithoutReadInfo(itemId);
            if (message == null) {
                Log.error("ReadMessageNotification#runNotifySetReadMessage::message is null");
                return;
            }

            String readJid = messageExistingReaderInfo.getJid();
            if (readJid != null && !"".equals(readJid)) {
                Set<String> readJidStrSet = new HashSet<String>();
                readJidStrSet.add(readJid);
                notifyReadMessageOption(messageExistingReaderInfo,
                        readJidStrSet);
            }

            boolean isShow = ShowMessageReadInfoSetting.getInstance().isShow(
                    message);
            if (!isShow) {
                return;
            }

            Set<String> receiverJidSet = MessageAdapter.getInstance()
                    .getMessageReceiverSet(message);
            if (receiverJidSet == null) {
                Log.error("ReadMessageNotification#runNotifySetReadMessage::receiverJidList is null");
                return;
            }
            if (readJid != null && !"".equals(readJid)) {
                receiverJidSet.remove(readJid);
            }
            if (receiverJidSet.size() > 0) {
                notifyReadMessageOption(messageExistingReaderInfo,
                        receiverJidSet);
            }
        }
    }

    private void notifyReadMessageOption(
            MessageExistingReaderInfo messageExistingReaderInfo,
            Collection<String> receiverJidSet) {
        if (messageExistingReaderInfo == null || receiverJidSet == null) {
            Log.error("MessageOptionNotifier#notifyReadMessageOption:messageExistingReaderInfo or receiverJidSet or both are invalid");
            return;
        }
        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        for (String receiverJid : receiverJidSet) {
            Log.debug("MessageOptionNotifier:: send to : " + receiverJid);
            org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
            pushXmppMessage.setFrom(from);
            pushXmppMessage.setTo(receiverJid);
            pushXmppMessage.setID("notify" + StringUtils.randomString(5) + "__"
                    + from + "__" + StringUtils.randomString(5));
            Element notifyElem = pushXmppMessage.addChildElement("notify",
                    "http://necst.nec.co.jp/protocol/messageoption");
            Element contentElem = DocumentHelper.createElement("content");
            notifyElem.add(contentElem);
            Element typeElem = DocumentHelper.createElement("type");
            typeElem.setText("SetReadMessage");
            contentElem.add(typeElem);

            Element itemsElem = DocumentHelper.createElement("items");
            itemsElem.addAttribute("count", String.valueOf(1));
            contentElem.add(itemsElem);
            Element itemElem = MessageOptionAdapter.getInstance()
                    .getNotifyReadMessageItem(messageExistingReaderInfo);
            itemsElem.add(itemElem);
            XMPPServer.getInstance().getMessageRouter().route(pushXmppMessage);
        }

    }
}
