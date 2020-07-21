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

package jp.co.nec.necst.spf.globalSNS.Handler;

import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatMessageAdapter;

import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.interceptor.PacketInterceptor;
import org.jivesoftware.openfire.interceptor.PacketRejectedException;
import org.jivesoftware.openfire.session.Session;
import org.xmpp.packet.JID;
import org.xmpp.packet.Packet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.jivesoftware.openfire.multiplex.ClientSessionConnection;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import org.dom4j.Element;
import org.xmpp.packet.IQ;
import org.dom4j.DocumentHelper;
import jp.co.nec.necst.spf.globalSNS.Notification.ChatMessageNotifier;

public class ChatMessageInterceptor implements PacketInterceptor {
    private static final Logger Log = LoggerFactory
            .getLogger(ChatMessageInterceptor.class);

    private final XMPPServer server;

    public ChatMessageInterceptor() {
        server = XMPPServer.getInstance();
    }

    public void interceptPacket(Packet packet, Session session,
            boolean incoming, boolean processed) throws PacketRejectedException {
        if (!incoming || processed
                || !(packet instanceof org.xmpp.packet.Message)) {
            return;
        }
        final org.xmpp.packet.Message message = (org.xmpp.packet.Message) packet;
        final JID toJid = message.getTo();

        if (!server.isLocal(toJid)
                || !server.getUserManager().isRegisteredUser(toJid)) {
            return;
        }
        if(message.getType() != org.xmpp.packet.Message.Type.chat) {
            return;
        }
        Log.debug("do func ChatMessageInterceptor.interceptPacket(...");
        String messageBody = message.getBody();
        if (messageBody == null) {
            return;
        }

        Message saveMessage = ChatMessageAdapter.getInstance().sendChatMessage(message);
        if(saveMessage != null){
            Element saveMessageElm = ChatMessageAdapter.getInstance().getChatMessageItemElement(saveMessage);

            Element itemsElm = DocumentHelper.createElement("items");
            itemsElm.addAttribute("count","1");
            itemsElm.add(saveMessageElm);

            Element contentElm = DocumentHelper.createElement("content");
            contentElm.addAttribute("type","Chat");
            contentElm.add(itemsElm);

            Element messageElm = DocumentHelper.createElement("message");
            messageElm.addNamespace("","http://necst.nec.co.jp/protocol/send");
            messageElm.add(contentElm);

            Element iqElm = DocumentHelper.createElement("iq");
            iqElm.addAttribute("from",saveMessage.getMsgFrom());
            iqElm.addAttribute("id",message.getID());
            iqElm.addAttribute("to",saveMessage.getMsgTo());
            iqElm.addAttribute("type","result");
            iqElm.add(messageElm);
            session.process(new org.xmpp.packet.Message(iqElm));

            ChatMessageNotifier.getInstance().notifyChatMessage(saveMessage.getItemId());
        }
    }

}
