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

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.PublicMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeControler;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientNotifier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class PublicMessageNotifier extends AbstractIndividualNotifier<String> {
    private static final Logger Log = LoggerFactory
            .getLogger(PublicMessageNotifier.class);
    private static PublicMessageNotifier mInstance = null;

    public static PublicMessageNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new PublicMessageNotifier();
        }
        return mInstance;
    }

    private PublicMessageNotifier() {
    }

    public void notifyPublicMessage(String itemId) {
        Log.debug("do func PublicMessageNotifier.notifyPublicMessage(...");
        if (itemId == null) {
            Log.error("PublicMessageNotifier#notifyPublicMessage::itemId is null.");
            return;
        }
        addQueue(itemId);
    }

    @Override
    protected void threadProcessOneData(String itemId) {
        if (itemId == null) {
            Log.error("PublicMessageNotifier#threadProcessOneData::itemId is null");
            return;
        }
        Message publicMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        if (publicMessage == null) {
            Log.error("PublicMessageNotifier#threadProcessOneData::publicMessage is null");
            return;
        }
        if (publicMessage.getShowType() == 0) {
            return;
        }
        String fromJidStr = publicMessage.getMsgFrom();
        JID fromJid = new JID(fromJidStr);
        Set<JID> ownJidSet = new HashSet<JID>();
        ownJidSet.add(fromJid);
        MessageNotifier.getInstance().notifyMessage(publicMessage, ownJidSet,
                false);

        Set<JID> receiverJidSet = PublicMessageAdapter.getInstance()
                .getPublicMessageReceiverJidSet(fromJidStr);

        MessageNotifier.getInstance().notifyMessage(publicMessage,
                receiverJidSet, false);
        notifyClientApp(publicMessage);
    }

    private void notifyClientApp(Message publicMessage) {
        if (publicMessage == null) {
            Log.error("PublicMessageNotifier#notifySmartDevice:: Message is null");
            return;
        }
        String body = publicMessage.getMessageBodyInEntry();
        try {
            body = URLDecoder.decode(body, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            Log.error("PublicMessageNotifier#notifySmartDevice:: body decode error");
            return;
        }
        List<String> reciverJidList = GlobalSNSUtils.getUserListFromStr(body);
        if (reciverJidList == null) {
            return;
        }
        SmartDeviceNoticeInfo deviceNoticeInfo = new SmartDeviceNoticeInfo();
        SmartDeviceNoticeInfo.content content = deviceNoticeInfo.new content();
        content.setType(SmartDeviceNoticeInfo.content.TYPE_MESSAGE);
        SmartDeviceNoticeInfo.content.messageNotice messageNotice = content.new messageNotice();
        messageNotice.setMessageType(Message.TYPE_PUBLIC);
        messageNotice.setFromJid(publicMessage.getMsgFrom());
        boolean isWF = true;
        messageNotice.setIsWF(isWF);
        SmartDeviceNoticeInfo.content.messageNotice.entry entry = messageNotice.new entry();
        if (0 == publicMessage.getDeleteFlag()) {
            entry.setBody(publicMessage.getMessageBodyInEntry());
        }
        messageNotice.setEntry(entry);
        content.setMessageNotice(messageNotice);

        deviceNoticeInfo.setContent(content);

        for (String jidStr : reciverJidList) {
            JID jid = new JID(jidStr);
            SmartDeviceNoticeControler.notify(jid, deviceNoticeInfo);
            WebSocketClientNotifier.getInstance().notifyMessage(jidStr,
                    publicMessage);
        }
    }
}
