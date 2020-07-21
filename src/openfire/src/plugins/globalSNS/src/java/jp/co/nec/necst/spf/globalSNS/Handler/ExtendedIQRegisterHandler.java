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

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.AdminAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAuthorityAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQRegisterHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.IQ.Type;
import org.xmpp.packet.JID;
import org.xmpp.packet.PacketError;

public class ExtendedIQRegisterHandler extends IQRegisterHandler implements
        IMultipleThreadHandleIQ {
    private static final Logger Log = LoggerFactory
            .getLogger(ExtendedIQRegisterHandler.class);

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
        if (!isExecute(packet)) {
            IQ replyPacket = IQ.createResultIQ(packet);
            replyPacket.setChildElement(packet.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.bad_request);
            return replyPacket;
        }
        IQ replyPacket = super.handleIQ(packet);
        if (replyPacket == null) {
            replyPacket = IQ.createResultIQ(packet);
        }
        if (replyPacket.getType().equals(IQ.Type.error) || !execIQ(packet)) {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.bad_request);
        } else {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
        }
        return replyPacket;
    }

    private boolean execIQ(IQ iq) throws UnauthorizedException {
        boolean ret = false;
        JID fromJid = iq.getFrom();
        String fromUserName = fromJid.getNode();
        if (UserAuthorityAdapter.getInstance().isAdmin(fromUserName)) {
            ret = execIQAsAdministrator(iq);
        }
        if (ret == false) {
            ret = execIQAsRegularUser(iq);
        }
        return ret;
    }

    private boolean execIQAsAdministrator(IQ iq) throws UnauthorizedException {
        boolean ret = true;
        Type iqType = iq.getType();
        if (iqType.equals(IQ.Type.set)) {
            Element queryElement = iq.getChildElement();
            if (queryElement == null) {
                Log.debug("queryElement is null");
                return false;
            }
            ret = AdminAdapter.execRegisterUser(queryElement);
        }
        return ret;
    }

    private boolean execIQAsRegularUser(IQ iq) {
        boolean ret = true;
        Type iqType = iq.getType();
        if (iqType.equals(IQ.Type.set)) {
            Element queryElement = iq.getChildElement();
            if (queryElement == null) {
                Log.debug("ExtendedIQRegisterHandler#execIQAsRegularUser - queryElement is null");
                return false;
            }
            Element userNameElement = queryElement.element("username");
            if (userNameElement == null) {
                Log.debug("ExtendedIQRegisterHandler#execIQAsRegularUser userNameElement is null");
                return false;
            }
            String userName = userNameElement.getText();
            JID fromJid = iq.getFrom();
            String fromUserName = fromJid.getNode();
            if (!fromUserName.equals(userName)) {
                Log.debug("ExtendedIQRegisterHandler#execIQAsRegularUser userName is different from logined user.");
                return false;
            }
            Element passwordElement = queryElement.element("password");
            if (passwordElement == null) {
                Log.debug("ExtendedIQRegisterHandler#execIQAsRegularUser passwordElement is null");
                return false;
            }
            String password = passwordElement.getText();

            ret = UserProfileAdapter.getInstance().updatePasswordToDB(
                    fromJid.toBareJID(), password);
        }
        return ret;
    }

    private boolean isExecute(IQ iq) {
        boolean ret = true;
        Type iqType = iq.getType();
        if (iqType.equals(IQ.Type.set)) {
            ret = false;
            JID fromJid = iq.getFrom();
            String fromUserName = fromJid.getNode();
            Element queryElement = iq.getChildElement();
            Element userNameElement = queryElement.element("username");
            String userNameElemData = "";
            if (userNameElement != null) {
                userNameElemData = userNameElement.getText();
            }
            if (UserAuthorityAdapter.getInstance().isAdmin(fromUserName)) {
                JID newUserJid = XMPPServer.getInstance().createJID(
                        userNameElemData, null);
                ret = !GlobalSNSUtils.isExistUser(newUserJid);
            }
            if(ret == false) {
                if (fromUserName.equals(userNameElemData)) {
                    ret = true;
                } else {
                    ret = false;
                }
            }
        }
        return ret;
    }
}
