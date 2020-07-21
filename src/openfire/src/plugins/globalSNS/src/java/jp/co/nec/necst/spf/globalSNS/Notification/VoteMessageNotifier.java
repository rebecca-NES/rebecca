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

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.Log;
import org.jivesoftware.util.StringUtils;

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.Data.Message;

public class VoteMessageNotifier {
    private static VoteMessageNotifier mInstance = null;

    private VoteMessageNotifier() {
    }

    public static VoteMessageNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new VoteMessageNotifier();
        }
        return mInstance;
    }

    @SuppressWarnings("deprecation")
    public void notifyVoteMessage(String itemId) {
        Message voteMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        if (voteMessage == null) {
            Log.error("Message is null");
            return;
        }
        if (voteMessage.getShowType() == 0) {
            return;
        }

        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        String receiverJid = voteMessage.getMsgFrom();
        org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
        pushXmppMessage.setFrom(from);
        pushXmppMessage.setTo(receiverJid);
        pushXmppMessage.setID("vote" + StringUtils.randomString(5) + "__"
                + from + "__" + StringUtils.randomString(5));
        Element voteElem = pushXmppMessage.addChildElement("vote",
                "http://necst.nec.co.jp/protocol/vote");
        Element items = DocumentHelper.createElement("items");
        items.addAttribute("count", String.valueOf(1));
        voteElem.add(items);
        Element item = MessageAdapter.getInstance().getMessageItemElement(
                voteMessage);
        items.add(item);

        XMPPServer.getInstance().getMessageRouter().route(pushXmppMessage);
    }
}
