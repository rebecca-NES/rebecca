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

public class IQMessageDeleteHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo;

    public IQMessageDeleteHandler() {
        super("Message Handler");
        mInfo = new IQHandlerInfo("message",
                "http://necst.nec.co.jp/protocol/delete");
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
        IQ replyPacket = IQ.createResultIQ(packet);
        if (execIQ(packet)) {
            replyPacket.setChildElement(packet.getChildElement().createCopy());

        } else {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.bad_request);
        }
        return replyPacket;
    }

    private boolean execIQ(IQ iq) {
        return MessageAdapter.getInstance().deleteMessage(iq);
    }

}