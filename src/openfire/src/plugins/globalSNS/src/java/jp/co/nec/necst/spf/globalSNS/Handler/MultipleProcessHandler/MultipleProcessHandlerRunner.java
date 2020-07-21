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

package jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler;

import org.jivesoftware.openfire.PacketDeliverer;
import org.jivesoftware.openfire.SessionManager;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.util.LocaleUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;

public class MultipleProcessHandlerRunner implements Runnable {
    
    private static final Logger Log = LoggerFactory
            .getLogger(MultipleProcessHandlerRunner.class);

    private IQ mPacket;
    private IMultipleThreadHandleIQ mHandler;
    private static PacketDeliverer mDeliverer = null;
    private static SessionManager mSessionManager = null;
    
    public MultipleProcessHandlerRunner(IMultipleThreadHandleIQ handler, IQ packet) {
        mHandler = handler;
        mPacket = packet;
        if(mDeliverer == null) {
            mDeliverer = XMPPServer.getInstance().getPacketDeliverer();
        }
        if(mSessionManager == null) {
            mSessionManager = XMPPServer.getInstance().getSessionManager();
        }
        
    }
    
    @Override
    public void run() {
        String logPrefix = "run() : ";
        IQ returnPacket = null;
        try {
            returnPacket = mHandler.handleIQInThread(mPacket);
            if (returnPacket != null) {
                mDeliverer.deliver(returnPacket);
            }
        } catch (UnauthorizedException e) {
            if (mPacket != null) {
                try {
                    IQ response = IQ.createResultIQ(mPacket);
                    response.setChildElement(mPacket.getChildElement()
                            .createCopy());
                    response.setError(PacketError.Condition.not_authorized);
                    mSessionManager.getSession(mPacket.getFrom())
                            .process(response);
                } catch (Exception de) {
                    Log.error(
                            logPrefix
                                    + LocaleUtils
                                            .getLocalizedString("admin.error"),
                            de);
                    mSessionManager.getSession(mPacket.getFrom()).close();
                }
            }
        } catch (Exception e) {
            Log.error(
                    logPrefix
                            + LocaleUtils
                                    .getLocalizedString("admin.error"),
                    e);
            try {
                IQ response = IQ.createResultIQ(mPacket);
                response.setChildElement(mPacket.getChildElement()
                        .createCopy());
                response.setError(PacketError.Condition.internal_server_error);
                mSessionManager.getSession(mPacket.getFrom()).process(
                        response);
            } catch (Exception e1) {
            }
        }
    }

}
