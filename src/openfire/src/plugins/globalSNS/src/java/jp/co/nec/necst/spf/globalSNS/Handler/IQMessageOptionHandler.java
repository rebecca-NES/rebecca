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

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageOptionAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.dom4j.Element;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;

public class IQMessageOptionHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo = null;

    public enum ContentType {
        None, DemandTask, ClearDemandedTask, GetExistingReaderList, SetReadMessage,
        GetGoodJobList, GetGoodJobTotal, GetGoodJobRanking,
        GetEmotionPointList, GetThanksPointsTotal, GetThanksPointsRanking;

        public static ContentType toType(String str) {
            try {
                return valueOf(str);
            } catch (Exception ex) {
                return None;
            }
        }
    }

    public IQMessageOptionHandler() {
        super("Message Option Handler");
        mInfo = new IQHandlerInfo("message",
                "http://necst.nec.co.jp/protocol/messageoption");
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
        IQ replyPacket = execIQ(packet);
        if (replyPacket == null) {
            replyPacket = IQ.createResultIQ(packet);
            replyPacket.setError(PacketError.Condition.bad_request);
        }
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private IQ execIQ(IQ iq) {
        Log.debug("do func  IQMessageOptionHandler.execIQ(");
        IQ ret = null;

        if (iq == null) {
            Log.error("IQMessageOptionHandler#execIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("IQMessageOptionHandler#execIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("IQMessageOptionHandler#execIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("IQMessageOptionHandler#execIQ::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("IQMessageOptionHandler#execIQ::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("IQMessageOptionHandler#execIQ::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || type.equals("")) {
            Log.error("IQMessageOptionHandler#execIQ::type is null");
            return ret;
        }

        switch (ContentType.toType(type)) {
            case DemandTask:
                ret = MessageOptionAdapter.getInstance().demandTask(iq);
                break;
            case ClearDemandedTask:
                ret = MessageOptionAdapter.getInstance().clearDemandTask(iq);
                break;
            case GetExistingReaderList:
                ret = MessageOptionAdapter.getInstance().getExistingReaderList(
                        iq);
                break;
            case SetReadMessage:
                ret = MessageOptionAdapter.getInstance().setReadMessage(iq);
                break;
            case GetGoodJobList:
                ret = MessageOptionAdapter.getInstance().getGoodJobList(iq);
                break;
            case GetGoodJobTotal:
                ret = MessageOptionAdapter.getInstance().getGoodJobTotal(iq);
                break;
            case GetGoodJobRanking:
                ret = MessageOptionAdapter.getInstance().getGoodJobRanking(iq);
                break;
            case GetEmotionPointList:
                ret = MessageOptionAdapter.getInstance().getEmotionPointList(iq);
                break;
            case GetThanksPointsTotal:
                ret = MessageOptionAdapter.getInstance().getEmotionPointTotal(iq);
                break;
            case GetThanksPointsRanking:
                ret = MessageOptionAdapter.getInstance().getEmotionPointRanking(iq);
                break;
            default:
                Log.error("IQMessageOptionHandler#execIQ::type is invalid :: "
                        + type);
                break;
        }
        return ret;
    }

}
