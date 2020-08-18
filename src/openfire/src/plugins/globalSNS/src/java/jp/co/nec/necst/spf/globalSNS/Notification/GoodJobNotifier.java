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

import jp.co.nec.necst.spf.globalSNS.ContextHub.GoodJobAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;

public class GoodJobNotifier extends AbstractIndividualNotifier<GoodJob> {
    private static final Logger Log = LoggerFactory
            .getLogger(GoodJobNotifier.class);
    private static GoodJobNotifier mInstance = null;

    public static GoodJobNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new GoodJobNotifier();
        }
        return mInstance;
    }

    private GoodJobNotifier() {
    };

    public void sendGoddJobMessage(GoodJob goodJob) {
        if (goodJob == null) {
            Log.error("GoodJobNotifier#sendGoddJobMessage::goodJob is null");
            return;
        }
        addQueue(goodJob);
    }

    @Override
    protected void threadProcessOneData(GoodJob goodJob) {
        if (goodJob == null) {
            Log.error("GoodJobNotifier#threadProcessOneData::goodJob is null");
            return;
        }
        jp.co.nec.necst.spf.globalSNS.Data.Message message = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(goodJob.getItemId());
        if (message == null) {
            Log.error("GoodJobNotifier#threadProcessOneData::message is null");
            return;
        }
        String goodJobDoJid = goodJob.getGjJid();
        GoodJobNotification gjNotification = new GoodJobNotification(
                goodJobDoJid, goodJob);
        Notifier.getInstance().notifyHighPriortyNotification(gjNotification);

        Set<String> receiverSet = MessageAdapter.getInstance()
                .getMessageReceiverSet(message);
        receiverSet.remove(goodJobDoJid);

        for (String toNotificationJid : receiverSet) {
            GoodJobNotification gjReceiverNotification = new GoodJobNotification(
                    toNotificationJid, goodJob);
            Notifier.getInstance().notifyLowPriortyNotification(
                    gjReceiverNotification);
        }
    }

    class GoodJobNotification extends Notification {
        public GoodJob mGoodJob = null;

        public GoodJobNotification(String toJid, GoodJob goodJob) {
            mTo = toJid;
            mGoodJob = goodJob;
        }

        @Override
        public Message createNotificationMessage() {
            if (mTo == null || mGoodJob == null) {
                Log.error("GoodJobNotification#createNotificationMessage::parameter is invalid");
                return null;
            }
            Profile profile = UserProfileDbHelper.getUserProfileData(mGoodJob
                    .getGjJid());
            String from = XMPPServer.getInstance().getServerInfo()
                    .getXMPPDomain();
            Message message = new Message();
            message.setFrom(from);
            message.setTo(mTo);
            message.setID("goodjob" + StringUtils.randomString(5) + "_" + from
                    + "_" + StringUtils.randomString(5));
            Element goodjobElem = message.addChildElement("goodjob",
                    "http://necst.nec.co.jp/protocol/goodjob#event");
            int count = 1;
            Element items = DocumentHelper.createElement("items");
            items.addAttribute("count", String.valueOf(count));
            goodjobElem.add(items);
            Element item = GoodJobAdapter.getInstance().getGoodJobItemElement(
                    mGoodJob, profile);
            items.add(item);
            return message;
        }
    }
}
