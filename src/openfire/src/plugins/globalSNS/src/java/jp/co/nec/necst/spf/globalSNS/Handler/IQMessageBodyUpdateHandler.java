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

import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.GroupChatAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MailCooperationAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.PublicMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MurmurAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.dom4j.Attribute;
import org.dom4j.Element;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class IQMessageBodyUpdateHandler extends IQHandler implements
        IMultipleThreadHandleIQ {
    private static final Logger Log = LoggerFactory
            .getLogger(IQMessageBodyUpdateHandler.class);

    private IQHandlerInfo mInfo;

    public enum ContentType {
        None, Public, Chat, Task, GroupChat, Mail, Community, Murmur;

        public static ContentType toType(String str) {
            try {
                return valueOf(str);
            } catch (Exception ex) {
                return None;
            }
        }
    }

    public IQMessageBodyUpdateHandler() {
        super("Send Message Handler");
        mInfo = new IQHandlerInfo("message",
               "http://necst.nec.co.jp/protocol/updatemessagebody");
    }

    @Override
    public IQHandlerInfo getInfo() {
        Log.debug("do func IQMessageBodyUpdateHandler.getInfo(...");
        return mInfo;
    }

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        Log.debug("do func IQMessageBodyUpdateHandler.handleIQ(...");
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
        Log.debug("do func IQMessageBodyUpdateHandler.handleIQInThread(...");
        IQ ret = receiveMessage(packet);
        if (ret == null) {
            ret = IQ.createResultIQ(packet);
            ret.setChildElement(packet.getChildElement().createCopy());
            ret.setError(PacketError.Condition.bad_request);
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    private IQ receiveMessage(IQ iq) {
        Log.debug("do func IQMessageBodyUpdateHandler.receiveMessage(...");
        IQ ret = null;
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("IQMessageBodyUpdateHandler#receiveMessage::not type set");
            return ret;
        }

        Element pubsub = iq.getChildElement();
        if (pubsub == null) {
            Log.error("IQMessageBodyUpdateHandler#receiveMessage::not message");
            return ret;
        }

        String namespace = pubsub.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/updatemessagebody".equals(namespace)) {
            Log.error("IQMessageBodyUpdateHandler#receiveMessage::not message namespace");
            return ret;
        }

        Element content = pubsub.element("content");
        if (content == null) {
            Log.error("IQMessageBodyUpdateHandler#receiveMessage::not content");
            return ret;
        }

        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        IQ __ret = null;
        switch (ContentType.toType(type)) {
        case Public:
            ret = PublicMessageAdapter.getInstance()
                .receivedUpdatePublicMessageBody(iq);
            if (ret == null) {
                Log.error("IQMessageBodyUpdateHandler#receiveMessage PublicMessageAdapter.getInstance().receivedUpdatePublicMessageBody(iq) is null");
                ret = IQ.createResultIQ(iq);
                ret.setChildElement(iq.getChildElement().createCopy());
            }
            break;
        case Chat:
            ret = ChatMessageAdapter.getInstance()
                .receivedUpdateChatMessageBody(iq);
            if (ret == null) {
                Log.error("IQMessageBodyUpdateHandler#receiveMessage ChatMessageAdapter.receivedUpdateChatMessageBody(iq) is null");
                ret = IQ.createResultIQ(iq);
                ret.setChildElement(iq.getChildElement().createCopy());
            }
            break;
        case GroupChat:
            ret = GroupChatAdapter.getInstance()
                .receiveUpdateGroupChatMessageBody(iq);
            if(ret == null){
                Log.error("IQMessageBodyUpdateHandler#receiveMessage GroupChatAdapter.getInstance().receiveUpdateGroupChatMessageBody(iq) is null");
                ret = IQ.createResultIQ(iq);
                ret.setChildElement(iq.getChildElement().createCopy());
            }
            break;
        case Community:
            ret = CommunityAdapter.getInstance()
                .receiveUpdateCommunityMessageBody(iq);
            if(ret == null){
                Log.error("IQMessageBodyUpdateHandler#receiveMessage CommunityAdapter.getInstance().receiveUpdateCommunityMessageBody(iq) is null");
                ret = IQ.createResultIQ(iq);
                ret.setChildElement(iq.getChildElement().createCopy());
            }
            break;
        case Murmur:
            ret = MurmurAdapter.getInstance()
                .receiveUpdateMurmurMessageBody(iq);
            if(ret == null){
                Log.error("IQMessageBodyUpdateHandler#receiveMessage MurmurAdapter.getInstance().receiveUpdateMurmurMessageBody(iq) is null");
                ret = IQ.createResultIQ(iq);
                ret.setChildElement(iq.getChildElement().createCopy());
            }
            break;
        default:
            Log.error("IQMessageBodyUpdateHandler#receiveMessage::content type is invalid");
            break;
        }
        return ret;
    }

}
