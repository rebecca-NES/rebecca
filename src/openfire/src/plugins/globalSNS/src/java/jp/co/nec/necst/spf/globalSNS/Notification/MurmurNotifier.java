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
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;
import org.xmpp.packet.Message;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MurmurAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MurmurMessageDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserFollowStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.NotificationManager;
import jp.co.nec.necst.spf.globalSNS.Data.NotificationDbData;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeControler;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content.messageNotice.entry;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientNotifier;
import net.arnx.jsonic.JSON;
import net.arnx.jsonic.JSONException;

public class MurmurNotifier extends
        AbstractIndividualNotifier<NotificationDataMurmur> {

    private static final Logger Log = LoggerFactory
            .getLogger(MurmurNotifier.class);
    private static MurmurNotifier mInstance = null;

    private static final String UPDATE_MESSAGE_BODY_NAMESPACE = "http://necst.nec.co.jp/protocol/updatemessagebody";

    public static MurmurNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new MurmurNotifier();
        }
        return mInstance;
    }

    private MurmurNotifier() {
    }

    @Override
    protected void threadProcessOneData(
            NotificationDataMurmur notificationData) {
        Log.debug("do func MurmurNotifier.threadProcessOneData(...");
        if (notificationData == null) {
            Log.error("MurmurNotifier#threadProcessOneData::notificationData is null");
            return;
        }
        switch (notificationData.mType) {
            case SendMessage:
                notifySendMurmurMessage((NotificationDataMurmurSendMessage) notificationData);
                break;
            case UpdateMessageBody:
                notifyUpdateMurmurMessageBody((NotificationDataMurmurUpdateMessage) notificationData);
                break;
            default:
                break;
        }
    }

    public void notifyMurmurMessage(
            jp.co.nec.necst.spf.globalSNS.Data.Message murmurMessage) {
        Log.debug("do func MurmurNotifier.notifyMurmurMessage(...");
        if (murmurMessage == null) {
            Log.error("MurmurNotifier#notifyMurmurMessage::murmurMessage is null");
            return;
        }
        NotificationDataMurmurSendMessage notificationData = new NotificationDataMurmurSendMessage
            (murmurMessage);

        addQueue(notificationData);
    }

    public void notifyMurmurUpdateMessage(
            jp.co.nec.necst.spf.globalSNS.Data.Message murmurMessage) {
        Log.debug("do func MurmurNotifier.notifyMurmurMessage(...");
        if (murmurMessage == null) {
            Log.error("MurmurNotifier#notifyMurmurUpdateMessage::murmurMessage is null");
            return;
        }
        NotificationDataMurmurUpdateMessage notificationData = new NotificationDataMurmurUpdateMessage
            (murmurMessage);

        addQueue(notificationData);
    }

    private void notifySendMurmurMessage
        (NotificationDataMurmurSendMessage notificationData) {
        Log.debug("do func MurmurNotifier.notifySendMurmurMessage(...");
        if (notificationData == null) {
            Log.error("MurmurNotifier#notifySendMurmurMessage::notificationData is null");
            return;
        }

        jp.co.nec.necst.spf.globalSNS.Data.Message murmurMessage = notificationData.mMessage;
        if (murmurMessage == null) {
            Log.error("MurmurNotifier#notifySendMurmurMessage::murmurMessage is null");
            return;
        }
        String msgfromJid = murmurMessage.getMsgFrom();

        List<JID> reciverJidList = MurmurMessageDbHelper.getMessageReceiverJidList(msgfromJid);

        MessageNotifier.getInstance().notifyMessage
            (murmurMessage,
             reciverJidList, true);

    }

    private void notifyUpdateMurmurMessageBody
        (NotificationDataMurmurUpdateMessage notificationData) {
        Log.debug("do func MurmurNotifier.notifyUpdateMurmurMessageBody(...");
        if (notificationData == null) {
            Log.error("MurmurNotifier#notifyUpdateMurmurMessageBody::notificationData is null");
            return;
        }

        jp.co.nec.necst.spf.globalSNS.Data.Message murmurMessage = notificationData.mMessage;
        if (murmurMessage == null) {
            Log.error("MurmurNotifier#notifyUpdateMurmurMessageBody::murmurMessage is null");
            return;
        }
        String msgfromJid = murmurMessage.getMsgFrom();

        List<JID> reciverJidList = MurmurMessageDbHelper.getMessageReceiverJidList(msgfromJid);

        MessageNotifier.getInstance().notifyUpdateMessageBody
            (murmurMessage,
             reciverJidList, true);

    }


    private void notifySmartDevice(List<JID> reciverJidList,
            jp.co.nec.necst.spf.globalSNS.Data.Message murmurMessage) {
        if (murmurMessage == null) {
            Log.error("MurmurNotifier#notifySmartDevice:: Message is null");
            return;
        }
        SmartDeviceNoticeInfo deviceNoticeInfo = new SmartDeviceNoticeInfo();
        SmartDeviceNoticeInfo.content content = deviceNoticeInfo.new content();

        content.setType(SmartDeviceNoticeInfo.content.TYPE_MESSAGE);

        SmartDeviceNoticeInfo.content.messageNotice messageNotice = content.new messageNotice();
        int messsageTypeMurmur = jp.co.nec.necst.spf.globalSNS.Data.Message.TYPE_MURMUR;
        messageNotice.setMessageType(messsageTypeMurmur);

        String fromJid = murmurMessage.getMsgFrom();
        messageNotice.setFromJid(fromJid);

        String body = murmurMessage.getMessageBodyInEntry();
        try {
            body = URLDecoder.decode(body, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            Log.error("MurmurNotifier#notifySmartDevice:: body decode error");
            return;
        }

        SmartDeviceNoticeInfo.content.messageNotice.entry entry = messageNotice.new entry();
        if (0 == murmurMessage.getDeleteFlag()) {
            entry.setBody(murmurMessage.getMessageBodyInEntry());
        }
        messageNotice.setEntry(entry);

        content.setMessageNotice(messageNotice);

        deviceNoticeInfo.setContent(content);

        List<String> isWFJidList = GlobalSNSUtils.getUserListFromStr(body);
        HashSet<String> isWFJidSet = new HashSet<String>();
        if(isWFJidList != null) {
            isWFJidSet.addAll(isWFJidList);
        }

        for (JID jid : reciverJidList) {
            String reciverJidStr = jid.toBareJID();
            if (reciverJidStr.equalsIgnoreCase(fromJid)) {
                continue;
            }
            boolean isWF = false;
            if(isWFJidSet.contains(reciverJidStr)) {
                isWF = true;
            }
            messageNotice.setIsWF(isWF);

            SmartDeviceNoticeControler.notify(jid, deviceNoticeInfo);
        }
    }
}

class NotificationDataMurmurSendMessage extends NotificationDataMurmur {
    public jp.co.nec.necst.spf.globalSNS.Data.Message mMessage = null;

    NotificationDataMurmurSendMessage
        (jp.co.nec.necst.spf.globalSNS.Data.Message message) {
        mType = Type.SendMessage;
        mMessage = message;
    }
}

class NotificationDataMurmurUpdateMessage extends NotificationDataMurmur {
    public jp.co.nec.necst.spf.globalSNS.Data.Message mMessage = null;

    NotificationDataMurmurUpdateMessage(
            jp.co.nec.necst.spf.globalSNS.Data.Message message) {
        mType = Type.UpdateMessageBody;
        mMessage = message;
    }
}


abstract class NotificationDataMurmur {
    enum Type {
        SendMessage, UpdateMessageBody, NotifyUpdateMurmur
    }

    public Type mType = null;
}
