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

import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageAdapter.TASK_OPERATION_TYPE;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeControler;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content.messageNotice.entry;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientNotifier;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.Log;
import org.jivesoftware.util.StringUtils;
import org.xmpp.packet.JID;

public class TaskMessageNotifier {
    private static TaskMessageNotifier mInstance = null;

    private TaskMessageNotifier() {
    }

    public static TaskMessageNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new TaskMessageNotifier();
        }
        return mInstance;
    }

    @SuppressWarnings("deprecation")
    public void notifyTaskMessage(Map<String, List<String>> mapItemIdToSender,
            TASK_OPERATION_TYPE type) {
        if (mapItemIdToSender == null) {
            Log.error("mapItemIdToSenderJid is null");
            return;
        }
        Set<String> itemIdSet = mapItemIdToSender.keySet();
        List<String> itemIdList = new ArrayList<String>();
        for (String itemId : itemIdSet) {
            itemIdList.add(itemId);
        }
        Log.debug("Task item Count : " + itemIdList.size());
        int count = itemIdList.size();
        for (int i = 0; i < count; i++) {
            Message taskMessage = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(itemIdList.get(i));
            if (taskMessage == null ||
                taskMessage.getMsgType() != Message.TYPE_TASK) {
                continue;
            }
            TaskMessageAdapter.getInstance().appendExtraTaskData(taskMessage);
            List<String> senderList = mapItemIdToSender.get(taskMessage
                    .getItemId());
            if (senderList == null) {
                Log.error("senderList is null");
                continue;
            }
            for (int j = 0; j < senderList.size(); j++) {
                Log.debug("Sender : " + senderList.get(j));
            }
            notifyTaskMessage(taskMessage, senderList, type);
            List<JID> senderJidList = new ArrayList<JID>();
            for (String jidStr : senderList) {
                JID jid = new JID(jidStr);
                senderJidList.add(jid);
            }
            for (JID jid : senderJidList) {
                if (jid == null) {
                    continue;
                }
                String jidStr = jid.toBareJID();
                WebSocketClientNotifier.getInstance().notifyMessage(jidStr,
                        taskMessage);
            }
        }

    }

    @SuppressWarnings("deprecation")
    private void notifyTaskMessage(Message taskMessage,
            List<String> senderList, TASK_OPERATION_TYPE notifytype) {
        Log.debug("do func TaskMessageNotifire.notifyTaskMessage(...");

        if (taskMessage == null) {
            Log.error("taskMessage is null");
            return;
        }
        if (taskMessage.getMsgType() != Message.TYPE_TASK) {
            Log.error("taskMessage'type is not 'task'");
            return;
        }
        if (notifytype == null) {
            Log.error("pushu type is null");
            return;
        }
        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        int count = senderList.size();
        Log.debug("Task Notify Count : " + String.valueOf(count));
        for (int i = 0; i < count; i++) {
            org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
            pushXmppMessage.setFrom(from);
            pushXmppMessage.setTo(senderList.get(i));
            pushXmppMessage.setID("task" + StringUtils.randomString(5) + "__"
                    + from + "__" + StringUtils.randomString(5));
            Element notifyElem = pushXmppMessage.addChildElement("notify",
                    "http://necst.nec.co.jp/protocol/message");
            boolean isAppendChild = false;
            Element contentElem = TaskMessageAdapter.getInstance()
                    .createAddOrUpdateTaskMessageContentElem(taskMessage,
                            isAppendChild);
            Element extrasElem = contentElem.element("extras");
            Element subTypeElem = DocumentHelper.createElement("sub_type");
            switch (notifytype) {
                case ADD:
                    subTypeElem.setText("1");
                    break;
                case UPDATE:
                    subTypeElem.setText("2");
                    break;
            }
            extrasElem.add(subTypeElem);
            notifyElem.add(contentElem);
            XMPPServer.getInstance().getMessageRouter().route(pushXmppMessage);
        }
    }

    @SuppressWarnings("deprecation")
    private void notifySmartDevice(List<JID> reciverJidList, Message taskMessage) {
        if (taskMessage == null) {
            Log.error("TaskMessageNotifier#notifySmartDevice:: Message is null");
            return;
        }
        SmartDeviceNoticeInfo deviceNoticeInfo = new SmartDeviceNoticeInfo();
        SmartDeviceNoticeInfo.content content = deviceNoticeInfo.new content();

        content.setType(SmartDeviceNoticeInfo.content.TYPE_MESSAGE);

        SmartDeviceNoticeInfo.content.messageNotice messageNotice = content.new messageNotice();
        messageNotice.setMessageType(Message.TYPE_TASK);

        messageNotice.setFromJid(taskMessage.getUpdatedBy());

        SmartDeviceNoticeInfo.content.messageNotice.entry entry = messageNotice.new entry();
        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entryElm = null;
        String entryStr = taskMessage.getEntry();
        if (entryStr == null || entryStr.equals("")) {
            Log.error("TaskMessageNotifier#notifySmartDevice:: entryStr is null");
            return;
        } else {
            try {
                Document doc = xmlReader.read(new StringReader(entryStr));
                entryElm = doc.getRootElement();
            } catch (DocumentException e) {
                Log.error("TaskMessageNotifier#notifySmartDevice:: entry data is not XML");
                return;
            }
        }
        Element titleElement = entryElm.element("title");
        String title = titleElement.getStringValue();
        entry.setTitle(title);
        messageNotice.setEntry(entry);

        int status = taskMessage.getStatus();
        messageNotice.setStatus(status);

        boolean isWF = false;
        messageNotice.setIsWF(isWF);

        content.setMessageNotice(messageNotice);

        deviceNoticeInfo.setContent(content);

        for (JID jid : reciverJidList) {
            SmartDeviceNoticeControler.notify(jid, deviceNoticeInfo);
        }
    }

}
