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

import jp.co.nec.necst.spf.globalSNS.ContextHub.MailCooperationAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class IQMailCooperationSettingsGetHandler extends IQHandler implements
        IMultipleThreadHandleIQ {
    private static final Logger Log = LoggerFactory
            .getLogger(IQMailCooperationSettingsGetHandler.class);

    private IQHandlerInfo mInfo = null;

    public IQMailCooperationSettingsGetHandler() {
        super("Get Mail Cooperation Settings Handler");
        mInfo = new IQHandlerInfo("mail",
                "http://necst.nec.co.jp/protocol/getsettings");
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

    private IQ execIQ(IQ packet) {
        Log.debug("do func IQMailCooperationSettingsGetHandler.execIQ(");
        return MailCooperationAdapter.getInstance().getMailCooperationSettings(
                packet);
    }

}
