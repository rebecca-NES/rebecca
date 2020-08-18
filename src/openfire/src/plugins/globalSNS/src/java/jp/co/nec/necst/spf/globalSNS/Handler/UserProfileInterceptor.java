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

import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileAdapter;
import jp.co.nec.necst.spf.globalSNS.XmppPacket.InnerChangedPresence;

import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.interceptor.PacketInterceptor;
import org.jivesoftware.openfire.interceptor.PacketRejectedException;
import org.jivesoftware.openfire.session.Session;
import org.xmpp.packet.Packet;
import org.xmpp.packet.Presence;

public class UserProfileInterceptor implements PacketInterceptor {
    @SuppressWarnings("unused")
    private final XMPPServer server;

    public UserProfileInterceptor() {
        server = XMPPServer.getInstance();
    }
    
    public void interceptPacket(Packet packet, Session session,
            boolean incoming, boolean processed) throws PacketRejectedException {
        if (!incoming || processed
                || !(packet instanceof Presence)) {
          return;
        }
        if(packet instanceof InnerChangedPresence) {
            return;
        }
        final Presence presence = (Presence) packet;

        UserProfileAdapter.getInstance().entryUserProfile(presence);
    }
}
