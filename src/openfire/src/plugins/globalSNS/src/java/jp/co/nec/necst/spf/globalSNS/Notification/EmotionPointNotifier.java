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

import java.util.Set;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.Message;

import jp.co.nec.necst.spf.globalSNS.ContextHub.EmotionPointAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.EmotionPointStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;

public class EmotionPointNotifier extends AbstractIndividualNotifier<EmotionPoint> {
    private static final Logger Log = LoggerFactory
            .getLogger(EmotionPointNotifier.class);
    private static EmotionPointNotifier mInstance = null;

    public static EmotionPointNotifier getInstance() {
        Log.debug("do func  EmotionPointNotifier.getInstance(...");
        if (mInstance == null) {
            mInstance = new EmotionPointNotifier();
        }
        return mInstance;
    }

    private EmotionPointNotifier() {
    };


    public void sendEmotionPointMessage(EmotionPoint emotionPoint) {
        Log.debug("do func  EmotionPointNotifier.sendEmotionPointMessage(...");
        if (emotionPoint == null) {
            Log.error("EmotionPointNotifier#sendEmotionPointMessage::emotionPoint is null");
            return;
        }
        addQueue(emotionPoint);
    }

    @Override
    protected void threadProcessOneData(EmotionPoint emotionPoint) {
        Log.debug("do func  EmotionPointNotifier.threadProcessOneData(...");
        if (emotionPoint == null) {
            Log.error("EmotionPointNotifier#threadPrxocessOneData::emotionPoint is null");
            return;
        }
        jp.co.nec.necst.spf.globalSNS.Data.Message message = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(emotionPoint.getItemId());
        if (message == null) {
            Log.error("EmotionPointNotifier#threadProcessOneData::message is null");
            return;
        }
        String emotionPointDoJid = emotionPoint.getJid();
        EmotionPointNotification gjNotification = new EmotionPointNotification(
                emotionPointDoJid, emotionPoint);
        Notifier.getInstance().notifyHighPriortyNotification(gjNotification);

        Set<String> receiverSet = MessageAdapter.getInstance()
                .getMessageReceiverSet(message);
        receiverSet.remove(emotionPointDoJid);

        for (String toNotificationJid : receiverSet) {
            EmotionPointNotification gjReceiverNotification = new EmotionPointNotification(
                    toNotificationJid, emotionPoint);
            Notifier.getInstance().notifyLowPriortyNotification(
                    gjReceiverNotification);
        }
    }

    class EmotionPointNotification extends Notification {
        public EmotionPoint mEmotionPoint = null;

        public EmotionPointNotification(String toJid, EmotionPoint emotionPoint) {
            mTo = toJid;
            mEmotionPoint = emotionPoint;
        }

        @Override
        public Message createNotificationMessage() {
            Log.debug("do func  EmotionPointNotifier > EmotionPointNotification.createNotificationMessage(...");
            if (mTo == null || mEmotionPoint == null) {
                Log.error("EmotionPointNotification#createNotificationMessage::parameter is invalid");
                return null;
            }
            Profile profile = UserProfileDbHelper.getUserProfileData(mEmotionPoint
                                                                     .getJid());
            String from = XMPPServer.getInstance().getServerInfo()
                    .getXMPPDomain();
            Message message = new Message();
            message.setFrom(from);
            message.setTo(mTo);
            message.setID("emotionpoint" + StringUtils.randomString(5) + "_" + from
                    + "_" + StringUtils.randomString(5));
            String emotionPointIconJson
                = EmotionPointStoreDbHelper.getEmotionPointIconJson(mEmotionPoint.getItemId());
            Element emotionpointElem = message.addChildElement("emotionpoint",
                    "http://necst.nec.co.jp/protocol/emotionpoint#event");
            int count = 1;
            Element items = DocumentHelper.createElement("items");
            items.addAttribute("count", String.valueOf(count));
            emotionpointElem.add(items);
            Element item = EmotionPointAdapter.getInstance()
                .getEmotionPointItemElement(mEmotionPoint,
                                            profile,
                                            emotionPointIconJson);
            items.add(item);
            return message;
        }
    }
}
