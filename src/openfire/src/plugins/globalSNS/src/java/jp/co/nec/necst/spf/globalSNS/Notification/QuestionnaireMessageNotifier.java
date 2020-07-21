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

public class QuestionnaireMessageNotifier extends AbstractIndividualNotifier<String> {
    private static final Logger Log = LoggerFactory
            .getLogger(QuestionnaireMessageNotifier.class);
    private static QuestionnaireMessageNotifier mInstance = null;

    public static QuestionnaireMessageNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new QuestionnaireMessageNotifier();
        }
        return mInstance;
    }

    private QuestionnaireMessageNotifier() {
    }

    public void notifyQuestionnaireMessage(String itemId) {
        if (itemId == null) {
            Log.error("QuestionnaireMessageNotifier#notifyQuestionnaireMessage::itemId is null.");
            return;
        }
        addQueue(itemId);
    }

    @Override
    protected void threadProcessOneData(String itemId) {
        if (itemId == null) {
            Log.error("QuestionnaireMessageNotifier#threadProcessOneData::itemId is null");
            return;
        }
        Message questionnaireMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        if (questionnaireMessage == null) {
            Log.error("QuestionnaireMessageNotifier#threadProcessOneData::questionnaireMessage is null");
            return;
        }
        if (questionnaireMessage.getShowType() == 0) {
            return;
        }
        String fromJidStr = questionnaireMessage.getMsgFrom();
        JID fromJid = new JID(fromJidStr);
        Set<JID> ownJidSet = new HashSet<JID>();
        ownJidSet.add(fromJid);
        MessageNotifier.getInstance().notifyMessage(questionnaireMessage, ownJidSet,
                false);

        Set<JID> receiverJidSet = PublicMessageAdapter.getInstance()
                .getPublicMessageReceiverJidSet(fromJidStr);

        MessageNotifier.getInstance().notifyMessage(questionnaireMessage,
                receiverJidSet, false);
        notifyClientApp(questionnaireMessage);
    }

    private void notifyClientApp(Message questionnaireMessage) {
        if (questionnaireMessage == null) {
            Log.error("PublicMessageNotifier#notifySmartDevice:: Message is null");
            return;
        }
        String body = questionnaireMessage.getMessageBodyInEntry();
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
        messageNotice.setMessageType(Message.TYPE_QUESTIONNAIRE);
        messageNotice.setFromJid(questionnaireMessage.getMsgFrom());
        boolean isWF = true;
        messageNotice.setIsWF(isWF);

        content.setMessageNotice(messageNotice);

        deviceNoticeInfo.setContent(content);

        for (String jidStr : reciverJidList) {
            JID jid = new JID(jidStr);
            WebSocketClientNotifier.getInstance().notifyMessage(jidStr,
                    questionnaireMessage);
        }
    }
}
