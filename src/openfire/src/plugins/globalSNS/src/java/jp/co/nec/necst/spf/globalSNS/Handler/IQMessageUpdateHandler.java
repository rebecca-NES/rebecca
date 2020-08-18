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

import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.VoteMessageAdapter;
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

public class IQMessageUpdateHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo;

    public enum ContentType {
        None, Public, Chat, Task, GroupChat, Mail, Community, Questionnaire;

        public static ContentType toType(String str) {
            try {
                return valueOf(str);
            } catch (Exception ex) {
                return None;
            }
        }
    }

    public IQMessageUpdateHandler() {
        super("Update Message Handler");
        mInfo = new IQHandlerInfo("message",
                "http://necst.nec.co.jp/protocol/update");
    }

    @Override
    public IQHandlerInfo getInfo() {
        return mInfo;
    }

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
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
        IQ ret = null;
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("IQMessageUpdateHandler#receiveMessage::not type set");
            return ret;
        }

        Element pubsub = iq.getChildElement();
        if (pubsub == null) {
            Log.error("IQMessageUpdateHandler#receiveMessage::not message");
            return ret;
        }

        String namespace = pubsub.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/update".equals(namespace)) {
            Log.error("IQMessageUpdateHandler#receiveMessage::not message namespace");
            return ret;
        }

        Element content = pubsub.element("content");
        if (content == null) {
            Log.error("IQMessageUpdateHandler#receiveMessage::not content");
            return ret;
        }

        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        switch (ContentType.toType(type)) {
            case Public:
                break;
            case Chat:
                break;
            case Task:
                ret = TaskMessageAdapter.getInstance().receiveUpdateTask(iq);
                break;
            case GroupChat:
                break;
            case Mail:
                break;
            case Community:
                break;
            case Questionnaire:
                ret = VoteMessageAdapter.getInstance().receiveVoteMessage(iq);
                break;
            default:
                Log.error("IQMessageUpdateHandler#receiveMessage::content type is invalid");
                break;
        }
        return ret;
    }

}