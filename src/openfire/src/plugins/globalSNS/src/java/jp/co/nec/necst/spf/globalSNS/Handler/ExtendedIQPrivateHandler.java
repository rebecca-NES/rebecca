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

import org.dom4j.Element;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQPrivateHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;

import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.PublicMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.QuestionnaireAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

public class ExtendedIQPrivateHandler extends IQPrivateHandler implements
        IMultipleThreadHandleIQ {
    private static final Logger Log = LoggerFactory
            .getLogger(ExtendedIQPrivateHandler.class);

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        Log.debug("do func ExtendedIQPrivateHandler.handleIQ(...");
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
        Log.debug("do func ExtendedIQPrivateHandler.handleIQInThread(...");
        IQ replyPacket = null;
        Element exodus = getExodusElement(packet);
        if (exodus != null) {
            String exodusNamespace = exodus.getNamespaceURI();
            if (exodusNamespace == null) {
                Log.debug("exodusNamespace is null");
                return super.handleIQ(packet);
            }
            if (exodusNamespace.equals("timeline_history")) {
                replyPacket = PublicMessageAdapter.getInstance()
                        .hundleGetTimeLineIQ(packet, exodus);
            } else if (exodusNamespace.equals("task_list")) {
                replyPacket = TaskMessageAdapter.getInstance()
                        .hundleGetTaskListIQ(packet, exodus);
            } else if (exodusNamespace.equals("chat_history")) {
                replyPacket = ChatMessageAdapter.getInstance()
                        .hundleGetChatHistoryIQ(packet, exodus);
            } else if (exodusNamespace.equals("questionnaire_list")) {
                replyPacket = QuestionnaireAdapter.getInstance()
                        .hundleGetQuestionnaireListIQ(packet, exodus);
            } else {
                Log.debug("exodusNamespace is unknown");
            }
        }
        return (replyPacket != null) ? replyPacket : super.handleIQ(packet);
    }

    private Element getExodusElement(IQ packet) {
        Log.debug("do func ExtendedIQPrivateHandler.getExodusElement(...");
        if (packet == null) {
            Log.error("getExodusElement :: packet is null");
            return null;
        }
        if (!packet.getType().equals(IQ.Type.get)) {
            Log.debug("not query type set");
            return null;
        }

        Element query = packet.getChildElement();
        if (query == null) {
            Log.debug("not query");
            return null;
        }

        String namespace = query.getNamespaceURI();
        if (namespace == null || !"jabber:iq:private".equals(namespace)) {
            Log.debug("not jabber:iq:private namespace");
            return null;
        }
        Element exodus = query.element("exodus");
        if (exodus == null) {
            Log.debug("not exodus");
        }
        return exodus;
    }
}
