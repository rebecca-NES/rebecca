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

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;
import org.jivesoftware.util.Log;
import org.dom4j.Attribute;
import org.dom4j.Element;

public class IQThreadTitleUpdateHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo = null;

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

    public IQThreadTitleUpdateHandler() {
        super("Get Thread Message Handler");
        Log.debug("do func IQThreadTitleUpdateHandler()");
        mInfo = new IQHandlerInfo("message",
                "http://necst.nec.co.jp/protocol/threadtitleupdate");
    }

    @Override
    public IQHandlerInfo getInfo() {
        Log.debug("do func IQThreadTitleUpdateHandler.getInfo(...");
        return mInfo;
    }

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        Log.debug("do func IQThreadTitleUpdateHandler.handleIQ(...");
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
        Log.debug("do func IQThreadTitleUpdateHandler.handleIQInThread(...");
        IQ replyPacket = receiveMessage(packet);
        if (replyPacket == null) {
            replyPacket = IQ.createResultIQ(packet);
            replyPacket.setChildElement(packet.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.bad_request);
        }
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private IQ receiveMessage(IQ iq) {
        Log.debug("do func IQThreadTitleUpdateHandler.receiveMessage(...");
        IQ ret = null;
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("IQThreadTitleUpdateHandler#receiveMessage::not type set");
            return ret;
        }

        Element pubsub = iq.getChildElement();
        if (pubsub == null) {
            Log.error("IQThreadTitleUpdateHandler#receiveMessage::not message");
            return ret;
        }

        String namespace = pubsub.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/threadtitleupdate".equals(namespace)) {
            Log.error("IQThreadTitleUpdateHandler#receiveMessage::not message namespace");
            return ret;
        }

        Element content = pubsub.element("content");
        if (content == null) {
            Log.error("IQThreadTitleUpdateHandler#receiveMessage::not content");
            return ret;
        }

        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();

        switch (ContentType.toType(type)) {
        case Public:
        case Chat:
        case GroupChat:
        case Community:
        case Murmur:
            ret = MessageAdapter.getInstance().receiveUpdateThreadTitle(iq);
            break;
        case Task:
            break;
        case Mail:
            break;
        default:
            Log.error("IQThreadTitleUpdateHandler#receiveMessage::content type is invalid");
            break;
        }
        return ret;
    }

}
