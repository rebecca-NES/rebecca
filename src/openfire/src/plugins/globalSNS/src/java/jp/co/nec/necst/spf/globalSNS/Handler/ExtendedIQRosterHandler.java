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

import jp.co.nec.necst.spf.globalSNS.ContextHub.ContactAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.jivesoftware.openfire.SharedGroupException;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQRosterHandler;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;

public class ExtendedIQRosterHandler extends IQRosterHandler implements
        IMultipleThreadHandleIQ {
    private static final Logger Log = LoggerFactory
            .getLogger(ExtendedIQRosterHandler.class);

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
        IQ.Type type = packet.getType();
        IQ replyPacket = null;

        if (IQ.Type.get == type) {
            try {
                replyPacket = execIQ(packet);
            } catch (UserNotFoundException e) {
                Log.error("ExtendedIQRosterHandler#handleIQ::UserNotFoundException occured");
            } catch (SharedGroupException e) {
                Log.error("ExtendedIQRosterHandler#handleIQ::SharedGroupException occured");
            }
            if (replyPacket == null) {
                replyPacket = IQ.createResultIQ(packet);
                replyPacket.setChildElement(packet.getChildElement()
                        .createCopy());
                replyPacket.setError(PacketError.Condition.bad_request);
            }
        } else {
            replyPacket = super.handleIQ(packet);
        }
        return replyPacket;
    }

    private IQ execIQ(IQ iq) throws UserNotFoundException, SharedGroupException {
        if (iq == null) {
            Log.error("ExtendedIQRosterHandler::execIQ iq is null");
            return null;
        }
        return ContactAdapter.getRoster(iq);
    }
}
