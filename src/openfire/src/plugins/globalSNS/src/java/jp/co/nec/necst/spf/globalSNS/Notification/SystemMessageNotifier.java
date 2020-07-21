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

import java.util.List;

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageSendToDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Message;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.Log;
import org.jivesoftware.util.StringUtils;

public class SystemMessageNotifier {
    private static SystemMessageNotifier mInstance = null;

    private SystemMessageNotifier() {
    }

    public static SystemMessageNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new SystemMessageNotifier();
        }
        return mInstance;
    }

    @SuppressWarnings("deprecation")
    public void notifySystemMessage(String itemId) {
        Message systemMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        if (systemMessage == null) {
            Log.error("Message is null");
            return;
        }
        if (systemMessage.getShowType() == 0) {
            return;
        }
        List<String> sendToList = MessageSendToDbHelper.getSendToList(itemId);
        if (sendToList == null || sendToList.size() <= 0) {
            return;
        }

        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        int count = sendToList.size();
        for (int i = 0; i < count; i++) {
            String receiverJid = sendToList.get(i);
            org.xmpp.packet.Message pushXmppMessage = new org.xmpp.packet.Message();
            pushXmppMessage.setFrom(from);
            pushXmppMessage.setTo(receiverJid);
            pushXmppMessage.setID("system" + StringUtils.randomString(5) + "__"
                    + from + "__" + StringUtils.randomString(5));
            Element systemElem = pushXmppMessage.addChildElement("system",
                    "http://necst.nec.co.jp/protocol/system");
            Element items = DocumentHelper.createElement("items");
            items.addAttribute("count", String.valueOf(1));
            systemElem.add(items);
            Element item = MessageAdapter.getInstance().getMessageItemElement(
                    systemMessage);
            items.add(item);

            XMPPServer.getInstance().getMessageRouter().route(pushXmppMessage);
        }
    }
}
