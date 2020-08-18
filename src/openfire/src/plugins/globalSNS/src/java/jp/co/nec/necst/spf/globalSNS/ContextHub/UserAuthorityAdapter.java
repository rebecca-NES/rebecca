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

package jp.co.nec.necst.spf.globalSNS.ContextHub;



import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;
import org.xmpp.packet.PacketError;

import org.jivesoftware.openfire.admin.AdminManager;

public class UserAuthorityAdapter {
    private static UserAuthorityAdapter mThisInstance = null;
    
    private static final String AUTHORITY_TYPE_ADMIN = "admin";
    private static final String AUTHORITY_TYPE_UNKNOWN = "unknown";

    private UserAuthorityAdapter() {
    }

    public static UserAuthorityAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new UserAuthorityAdapter();
        }
        return mThisInstance;
    }

    @SuppressWarnings("deprecation")
    public IQ handleGetUserAuthorityIQ(IQ iq) {
        if (iq == null) {
            Log.error("UserAuthorityAdapter#handleGetUserAuthorityIQ: iq is null");
            return null;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element userAuthorityElement = iq.getChildElement();
        if(userAuthorityElement == null){
            Log.debug("not user_authority");
            replyPacket.setChildElement(iq.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.bad_request);
            return replyPacket;
        }
        JID fromJID = iq.getFrom();
        String authorityType = getUserAuthority(fromJID.getNode());
        Element typeElement = DocumentHelper.createElement("type");
        typeElement.setText(authorityType);
        userAuthorityElement.add(typeElement);
        userAuthorityElement.setParent(null);
        replyPacket.setChildElement(userAuthorityElement);
        
        return replyPacket;
    }

    public String getUserAuthority(String userName) {
        String ret = AUTHORITY_TYPE_UNKNOWN;
        if(isAdmin(userName)){
            ret = AUTHORITY_TYPE_ADMIN;
        }
        return ret;
    }

    public boolean isAdmin(String userName) {
        return AdminManager.getInstance().isUserAdmin(userName,true);
    }

}
