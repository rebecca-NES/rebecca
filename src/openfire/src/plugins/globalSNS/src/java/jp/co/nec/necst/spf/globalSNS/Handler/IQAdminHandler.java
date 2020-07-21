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

import jp.co.nec.necst.spf.globalSNS.ContextHub.AdminAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAuthorityAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.dom4j.Element;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;
import org.xmpp.packet.PacketError;

public class IQAdminHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo = null;

    public enum ContentType {
        None, GetAllUserList, GetSelectUserList, UpdateVCard, UpdateUserPassword, CreateUser, UpdateUser, PhysicalDeleteUser, UpdateUserAccountStatus;

        public static ContentType toType(String str) {
            try {
                return valueOf(str);
            } catch (Exception ex) {
                return None;
            }
        }
    }

    public IQAdminHandler() {
        super("Admin Handler");
        mInfo = new IQHandlerInfo("query",
                "http://necst.nec.co.jp/protocol/admin");
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
        IQ ret = null;

        if (iq == null) {
            Log.error("IQAdminHandler#execIQ::iq is null");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromUserName = fromJid.getNode();
        if (!UserAuthorityAdapter.getInstance().isAdmin(fromUserName)) {
            Log.error("IQAdminHandler#execIQ::Request From Not Admin User :"
                    + fromUserName);
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("IQAdminHandler#execIQ::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("IQAdminHandler#execIQ::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("IQAdminHandler#execIQ::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("IQAdminHandler#execIQ::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("IQAdminHandler#execIQ::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || type.equals("")) {
            Log.error("IQAdminHandler#execIQ::type is null");
            return ret;
        }

        switch (ContentType.toType(type)) {
            case GetAllUserList:
            case GetSelectUserList:
                ret = AdminAdapter.getInstance().getUserList(iq);
                break;
            case UpdateVCard:
                ret = AdminAdapter.getInstance().updateVCard(iq);
                break;
            case UpdateUserPassword:
                ret = AdminAdapter.getInstance().updateUserPassword(iq);
                break;
            case CreateUser:
                ret = AdminAdapter.getInstance().createUser(iq);
                break;
            case UpdateUser:
                ret = AdminAdapter.getInstance().updateUser(iq);
                break;
            case PhysicalDeleteUser:
                ret = AdminAdapter.getInstance().physicalDeleteUser(iq);
                break;
            case UpdateUserAccountStatus:
                ret = AdminAdapter.getInstance().updateUserAccountStatus(iq);
                break;
            default:
                Log.error("IQAdminHandler#execIQ::type is invalid :: " + type);
                break;
        }
        return ret;
    }
}
