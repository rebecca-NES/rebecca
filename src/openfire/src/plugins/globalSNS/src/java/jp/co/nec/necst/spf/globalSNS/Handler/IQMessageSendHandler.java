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
import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.QuestionnaireAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MurmurAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.dom4j.Attribute;
import org.dom4j.Element;
import org.dom4j.DocumentHelper;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;

public class IQMessageSendHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo;

    public enum ContentType {
        None, Public, Chat, Task, GroupChat, Mail, Community, Questionnaire, Murmur;

        public static ContentType toType(String str) {
            try {
                return valueOf(str);
            } catch (Exception ex) {
                return None;
            }
        }
    }

    public IQMessageSendHandler() {
        super("Send Message Handler");
        mInfo = new IQHandlerInfo("message",
                "http://necst.nec.co.jp/protocol/send");
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
        Log.debug("do func IQMessageSendHandler.receiveMessage(...");
        IQ ret = null;
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("IQMessageSendHandler#receiveMessage::not type set");
            return ret;
        }

        Element pubsub = iq.getChildElement();
        if (pubsub == null) {
            Log.error("IQMessageSendHandler#receiveMessage::not message");
            return ret;
        }

        String namespace = pubsub.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/send".equals(namespace)) {
            Log.error("IQMessageSendHandler#receiveMessage::not message namespace");
            return ret;
        }

        Element content = pubsub.element("content");
        if (content == null) {
            Log.error("IQMessageSendHandler#receiveMessage::not content");
            return ret;
        }

        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        switch (ContentType.toType(type)) {
            case Public:
                ret = PublicMessageAdapter.getInstance()
                    .receivedPublicMessage(iq);
                break;
            case Chat:
                break;
            case Task:
                ret = TaskMessageAdapter.getInstance().receiveAddTask(iq);
                break;
            case GroupChat:
                ret = GroupChatAdapter.getInstance()
                        .receiveGroupChatMessage(iq);
                break;
            case Mail:
                if (MailCooperationAdapter.getInstance()
                        .receivedMailMessage(iq)) {
                    ret = IQ.createResultIQ(iq);
                    ret.setChildElement(iq.getChildElement().createCopy());
                }
                break;
            case Community:
                ret = CommunityAdapter.getInstance()
                        .receiveCommunityMessage(iq);
                break;
            case Questionnaire:
                String itemId = QuestionnaireAdapter.getInstance()
                    .getItemIdReceiveQuestionnaireMessage(iq);
                if (itemId != null) {
                    ret = IQ.createResultIQ(iq);
                    ret.setChildElement(iq.getChildElement().createCopy());
                    Element _iqchild = iq.getChildElement().createCopy();
                    Element _contentEml = _iqchild.element("content");
                    Element _items = DocumentHelper.createElement("items");
                    Element _item = DocumentHelper.createElement("item");
                    _items.add(_item);
                    Element _itemId = DocumentHelper.createElement("item_id");
                    _itemId.setText(itemId);
                    _item.add(_itemId);
                    _contentEml.add(_items);
                    ret.setChildElement(_iqchild);
                }
                break;
            case Murmur:
                ret = MurmurAdapter.getInstance()
                    .receiveMurmurMessage(iq);
                break;
            default:
                Log.error("IQMessageSendHandler#receiveMessage::content type is invalid");
                break;
        }
        return ret;
    }

}
