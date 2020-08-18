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

import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAuthorityAdapter;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.ContactManager;
import jp.co.nec.necst.spf.globalSNS.Group.FollowFollowerManager;
import jp.co.nec.necst.spf.globalSNS.Group.TenantManager;
import net.arnx.jsonic.JSON;

import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.auth.AuthFactory;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.user.User;
import org.jivesoftware.openfire.user.UserManager;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.jivesoftware.openfire.vcard.VCardManager;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class AdminAdapter {

    private static AdminAdapter mThisInstance = null;

    private AdminAdapter() {
    }

    public static AdminAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new AdminAdapter();
        }
        return mThisInstance;
    }

    @SuppressWarnings({ "deprecation", "unchecked" })
    public IQ getUserList(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#getUserList::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("AdminAdapter#getUserList::iq type is not set");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#getUserList::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#getUserList::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#getUserList::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("AdminAdapter#getUserList::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("AdminAdapter#getUserList::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null
                || (!type.equals("GetAllUserList") && !type
                        .equals("GetSelectUserList"))) {
            Log.error("AdminAdapter#getUserList::type is invalid");
            return ret;
        }

        List<Element> itemElementList = null;
        if (type.equals("GetSelectUserList")) {
            Element itemsElem = contentElem.element("items");
            if (itemsElem == null) {
                Log.error("AdminAdapter#getUserList::itemsElem is null");
                return ret;
            }
            itemElementList = itemsElem.elements();
            if (itemElementList == null) {
                Log.error("AdminAdapter#getUserList::itemElementList is null");
                return ret;
            }
        }
        return createUserListResultIQ(iq, type, itemElementList);
    }

    @SuppressWarnings("deprecation")
    private IQ createUserListResultIQ(IQ iq, String type,
            List<Element> itemElementList) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#createUserListResultIQ::iq is null");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#createUserListResultIQ::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#createUserListResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#createUserListResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = queryElem.element("content");
        if (contentElem != null) {
            queryElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element typeElem = DocumentHelper.createElement("type");
        typeElem.setText(type);
        Element extrasElem = DocumentHelper.createElement("extras");
        Element itemsElem = null;
        if (type.equals("GetAllUserList")) {
            itemsElem = createItemsElementGetAllUserList();
        } else if (type.equals("GetSelectUserList")) {
            itemsElem = createItemsElementGetSelectUserList(itemElementList);
            if (itemsElem == null) {
                return ret;
            }
        }

        newContentElem.add(typeElem);
        newContentElem.add(extrasElem);
        newContentElem.add(itemsElem);
        queryElem.add(newContentElem);
        queryElem.setParent(null);
        replyPacket.setChildElement(queryElem);

        return replyPacket;
    }

    private Element createItemsElementGetAllUserList() {
        Element itemsElem = DocumentHelper.createElement("items");

        UserManager userManager = XMPPServer.getInstance().getUserManager();
        Collection<String> userNameList = userManager.getUsernames();

        VCardManager vManager = VCardManager.getInstance();

        itemsElem.addAttribute("count", String.valueOf(userNameList.size()));
        for (String username : userNameList) {
            Element userVCard = vManager.getVCard(username);
            Element itemElem = DocumentHelper.createElement("item");
            Element jidElem = DocumentHelper.createElement("jid");
            JID jidClass = XMPPServer.getInstance().createJID(username, null);
            String jid = jidClass.toBareJID();
            jidElem.setText(jid);
            itemElem.add(jidElem);
            if (userVCard != null) {
                itemElem.add(userVCard);
            }
            Profile profile = UserProfileDbHelper.getUserProfileData(jid);
            Element groupElem = null;
            if (profile != null) {
                groupElem = ConvertGroupJSONtoXMPP(profile.getAffiliation());
            } else {
                groupElem = DocumentHelper.createElement("group");
            }
            itemElem.add(groupElem);
            Element statusElem = DocumentHelper.createElement("status");
            statusElem.setText(String.valueOf(profile.getDeleteFlg()));
            itemElem.add(statusElem);
            itemsElem.add(itemElem);
        }
        return itemsElem;
    }

    @SuppressWarnings("deprecation")
    private Element createItemsElementGetSelectUserList(
            List<Element> itemElementList) {
        Element itemsElem = DocumentHelper.createElement("items");

        VCardManager vManager = VCardManager.getInstance();
        int count = itemElementList.size();
        itemsElem.addAttribute("count", String.valueOf(count));
        for (int i = 0; i < count; i++) {
            Element itemElem = itemElementList.get(i);
            Element newItemElem = itemElem.createCopy();
            if (newItemElem == null) {
                Log.error("AdminAdapter#createGetSelectUserListResultIQ::itemElem is null. No."
                        + i);
                return null;
            }
            Element jidElem = newItemElem.element("jid");
            if (jidElem == null) {
                Log.error("AdminAdapter#createGetSelectUserListResultIQ::jidElem is null");
                return null;
            }
            String jid = jidElem.getStringValue();
            if (jid == null || jid.equals("")) {
                Log.error("AdminAdapter#createGetSelectUserListResultIQ::jid is invalid. No."
                        + i);
                return null;
            }
            String username = jid.split("@")[0];
            Element userVCard = vManager.getVCard(username);
            if (userVCard != null) {
                newItemElem.add(userVCard);
            }
            Profile profile = UserProfileDbHelper.getUserProfileData(jid);
            Element groupElem = null;
            Element emailElem = null;
            if (profile != null) {
                groupElem = ConvertGroupJSONtoXMPP(profile.getAffiliation());
                emailElem = DocumentHelper.createElement("email");
                emailElem.setText(String.valueOf(profile.getEmail()));
            } else {
                groupElem = DocumentHelper.createElement("group");
            }
            newItemElem.add(groupElem);
            newItemElem.add(emailElem);

            Element isAdminElem = DocumentHelper.createElement("isAdmin");
            isAdminElem.setText(UserAuthorityAdapter.getInstance().getUserAuthority(username));
            newItemElem.add(isAdminElem);

            Element statusElem = DocumentHelper.createElement("status");
            statusElem.setText(String.valueOf(profile.getDeleteFlg()));
            newItemElem.add(statusElem);
            itemsElem.add(newItemElem);
        }
        return itemsElem;
    }

    @SuppressWarnings("deprecation")
    public IQ updateVCard(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#updateVCard::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("AdminAdapter#updateVCard::iq type is not set");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#updateVCard::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#updateVCard::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#updateVCard::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("AdminAdapter#updateVCard::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("AdminAdapter#updateVCard::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("UpdateVCard")) {
            Log.error("AdminAdapter#updateVCard::type is invalid");
            return ret;
        }
        Element jidElem = contentElem.element("jid");
        if (jidElem == null) {
            Log.error("AdminAdapter#updateVCard::jidElem is null");
            return ret;
        }
        String jid = jidElem.getStringValue();
        if (jid == null || jid.equals("")) {
            Log.error("AdminAdapter#updateVCard::jid is invalid");
            return ret;
        }

        Element vCardElement = contentElem.element("vCard");
        if (vCardElement == null) {
            Log.error("AdminAdapter#updateVCard::vCardElement is null");
        }
        String nickName = "";
        Element nicknameElement = vCardElement.element("NICKNAME");
        if (nicknameElement != null
                && !nicknameElement.getText().trim().equals("")) {
            nickName = nicknameElement.getText();
            try {
                nickName = URLDecoder.decode(nickName, "UTF-8");
                nickName = URLEncoder.encode(nickName, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                Log.error("AdminAdapter#updateVCard::Encode or Decode Error"
                        + ". jid:" + jid);
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                String exceptionAsString = sw.toString();
                Log.error(exceptionAsString);
                nickName = "";
            }
        } else {
            Log.info("AdminAdapter#updateVCard::nicknameElement is null"
                    + ". jid:" + jid);
        }
        Element photoElement = vCardElement.element("PHOTO");

        String photoType = "";
        String binval = "";
        if (photoElement == null) {
            Log.info("AdminAdapter#updateVCard::photoElement is null"
                    + ". jid:" + jid);
        } else {
            Element typeElement = photoElement.element("TYPE");
            if (typeElement == null) {
                Log.info("AdminAdapter#updateVCard::typeElement is null"
                        + ". jid:" + jid);
            } else {
                photoType = typeElement.getText();
            }
            Element binvalElement = photoElement.element("BINVAL");
            if (binvalElement == null) {
                Log.info("AdminAdapter#updateVCard::binvalElement is null"
                        + ". jid:" + jid);
            } else {
                binval = binvalElement.getText();
            }
        }
        JID jidClass = new JID(jid);
        if (!GlobalSNSUtils.isExistUser(jidClass)) {
            Log.error("AdminAdapter#updateVCard:: user is unknown. jid=" + jid);
            return ret;
        }

        Profile profileData = UserProfileDbHelper.getUserProfileData(jid);
        if (profileData == null) {
            Log.info("AdminAdapter#updateVCard::profileData is null" + ". jid:"
                    + jid);
        } else {
            profileData.setNickName(nickName);
            profileData.setPhotoType(photoType);
            profileData.setPhotoData(binval);
            Calendar now = Calendar.getInstance();
            Timestamp nowDateTime = new Timestamp(now.getTimeInMillis());
            profileData.setDate(nowDateTime);
            VCardChangeAdapter.getInstance().updateUserProfile(profileData);
        }
        String userName = jidClass.getNode();
        try {
            UserProfileAdapter.getInstance().setVCard(userName, vCardElement);
        } catch (Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            String exceptionAsString = sw.toString();
            Log.error("AdminAdapter#updateVCard::VCard set Error"
                    + exceptionAsString);
            return ret;
        }
        ret = IQ.createResultIQ(iq);
        return ret;
    }

    @SuppressWarnings("deprecation")
    public IQ updateUserPassword(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#updateUserPassword::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("AdminAdapter#updateUserPassword::iq type is not set");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#updateUserPassword::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#updateUserPassword::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#updateUserPassword::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("AdminAdapter#updateUserPassword::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("AdminAdapter#updateUserPassword::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("UpdateUserPassword")) {
            Log.error("AdminAdapter#updateUserPassword::type is invalid");
            return ret;
        }
        Element userNameElem = contentElem.element("username");
        if (userNameElem == null) {
            Log.error("AdminAdapter#updateUserPassword::userNameElem is null");
            return ret;
        }
        String userName = userNameElem.getStringValue();
        if (userName == null || userName.trim().length() == 0) {
            Log.error("AdminAdapter#updateUserPassword::userName is invalid");
            return ret;
        }

        Element passwordElement = contentElem.element("password");
        if (passwordElement == null) {
            Log.error("AdminAdapter#updateUserPassword::passwordElement is null");
            return ret;
        }
        String password = passwordElement.getStringValue();
        if (password == null || password.trim().length() == 0) {
            Log.error("AdminAdapter#updateUserPassword::password is invalid");
            return ret;
        }

        JID updateUserJid = XMPPServer.getInstance().createJID(userName, null);
        if (!GlobalSNSUtils.isExistUser(updateUserJid)) {
            Log.error("AdminAdapter#updateUserPassword:: user is unknown. user="
                    + userName);
            return ret;
        }
        UserManager userManager = XMPPServer.getInstance().getUserManager();
        User user = null;
        try {
            user = userManager.getUser(userName);
        } catch (UserNotFoundException e) {
            Log.error("AdminAdapter#updateUserPassword:: user is unknown. user="
                    + userName);
            return ret;
        }
        JID fromJid = iq.getFrom();
        if (!TenantManager.getInstance().checkTenantAdminHasOneUser(fromJid,
                updateUserJid)) {
            Log.error("AdminAdapter#updateUserPassword:: Target User is out of tenant : username :"
                    + userName);
            return ret;
        }
        user.setPassword(password);
        Profile profileData = UserProfileDbHelper
                .getUserProfileData(updateUserJid.toBareJID());
        if (profileData == null) {
            Log.info("AdminAdapter#updateUserPassword::profileData is null"
                    + ". jid:" + updateUserJid.toBareJID());
        } else {
            profileData.setPassword(password);
            Calendar now = Calendar.getInstance();
            Timestamp nowDateTime = new Timestamp(now.getTimeInMillis());
            profileData.setDate(nowDateTime);
            VCardChangeAdapter.getInstance().updateUserProfile(profileData);
        }
        ret = IQ.createResultIQ(iq);
        return ret;
    }

    @SuppressWarnings({ "deprecation", "unchecked" })
    public IQ createUser(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#createUser::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("AdminAdapter#createUser::iq type is not set");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#createUser::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#createUser::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#createUser::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("AdminAdapter#createUser::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("AdminAdapter#createUser::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("CreateUser")) {
            Log.error("AdminAdapter#createUser::type is invalid");
            return ret;
        }
        List<Element> itemElementList = null;
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("AdminAdapter#createUser::itemsElem is null");
            return ret;
        }
        itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("AdminAdapter#createUser::itemElementList is null");
            return ret;
        }
        Element retItemsElem = DocumentHelper.createElement("items");

        for (int i = 0; i < itemElementList.size(); i++) {
            boolean result = false;
            Element itemElem = itemElementList.get(i);
            Element retItemElem = DocumentHelper.createElement("item");
            if (itemElem == null) {
                Log.error("AdminAdapter#createUser::itemElem is null");
                return ret;
            }
            Element retResultElem = DocumentHelper.createElement("result");
            Element retUsernameItemElem = itemElem.element("username")
                    .createCopy();
            try {
                result = execRegisterUser(itemElem, true);
            } catch (Exception e) {
                result = false;
                Log.error("AdminAdapter#createUser::execRegisterUser failed. username:"
                        + retUsernameItemElem.getText());
            }
            retResultElem.setText(Boolean.toString(result));
            retItemElem.add(retResultElem);
            retItemElem.add(retUsernameItemElem);
            retItemsElem.add(retItemElem);
        }
        List<Element> retItemElementList = retItemsElem.elements();
        retItemsElem.addAttribute("count",
                String.valueOf(retItemElementList.size()));

        ret = createResultIQ("CreateUser", iq, retItemsElem);
        return ret;
    }

    @SuppressWarnings({ "deprecation", "unchecked" })
    public IQ updateUser(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#updateUser::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("AdminAdapter#updateUser::iq type is not set");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#updateUser::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#updateUser::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#updateUser::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("AdminAdapter#updateUser::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("AdminAdapter#updateUser::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("UpdateUser")) {
            Log.error("AdminAdapter#updateUser::type is invalid");
            return ret;
        }
        List<Element> itemElementList = null;
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("AdminAdapter#updateUser::itemsElem is null");
            return ret;
        }
        itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("AdminAdapter#updateUser::itemElementList is null");
            return ret;
        }
        Element retItemsElem = DocumentHelper.createElement("items");

        for (int i = 0; i < itemElementList.size(); i++) {
            boolean result = false;
            Element itemElem = itemElementList.get(i);
            Element retItemElem = DocumentHelper.createElement("item");
            if (itemElem == null) {
                Log.error("AdminAdapter#updateUser::itemElem is null");
                return ret;
            }
            Element retResultElem = DocumentHelper.createElement("result");
            Element retUsernameItemElem = itemElem.element("username")
                    .createCopy();
            result = execUpdateUser(itemElem);
            retResultElem.setText(Boolean.toString(result));
            retItemElem.add(retResultElem);
            retItemElem.add(retUsernameItemElem);
            retItemsElem.add(retItemElem);
        }
        List<Element> retItemElementList = retItemsElem.elements();
        retItemsElem.addAttribute("count",
                String.valueOf(retItemElementList.size()));

        ret = createResultIQ("UpdateUser", iq, retItemsElem);
        return ret;
    }

    @SuppressWarnings({ "deprecation", "unchecked" })
    public IQ physicalDeleteUser(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#physicalDeleteUser::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("AdminAdapter#physicalDeleteUser::iq type is not set");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#physicalDeleteUser::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#physicalDeleteUser::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#physicalDeleteUser::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("AdminAdapter#physicalDeleteUser::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("AdminAdapter#physicalDeleteUser::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("PhysicalDeleteUser")) {
            Log.error("AdminAdapter#physicalDeleteUser::type is invalid");
            return ret;
        }
        List<Element> itemElementList = null;
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("AdminAdapter#physicalDeleteUser::itemsElem is null");
            return ret;
        }
        itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("AdminAdapter#physicalDeleteUser::itemElementList is null");
            return ret;
        }
        Element retItemsElem = DocumentHelper.createElement("items");

        for (int i = 0; i < itemElementList.size(); i++) {
            boolean result = false;
            Element itemElem = itemElementList.get(i);
            Element retItemElem = DocumentHelper.createElement("item");
            if (itemElem == null) {
                Log.error("AdminAdapter#physicalDeleteUser::itemElem is null");
                return ret;
            }
            result = execPhysicalDeleteUser(itemElem);

            Element retResultElem = DocumentHelper.createElement("result");
            retResultElem.setText(Boolean.toString(result));
            retItemElem.add(retResultElem);
            Element retUsernameItemElem = itemElem.element("username")
                    .createCopy();
            retItemElem.add(retUsernameItemElem);
            retItemsElem.add(retItemElem);
        }
        List<Element> retItemElementList = retItemsElem.elements();
        retItemsElem.addAttribute("count",
                String.valueOf(retItemElementList.size()));

        ret = createResultIQ("PhysicalDeleteUser", iq, retItemsElem);
        return ret;
    }

    @SuppressWarnings("deprecation")
    public IQ updateUserAccountStatus(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#updateUserAccountStatus::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("AdminAdapter#updateUserAccountStatus::iq type is not set");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#updateUserAccountStatus::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#updateUserAccountStatus::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#updateUserAccountStatus::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("AdminAdapter#updateUserAccountStatus::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("AdminAdapter#updateUserAccountStatus::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("UpdateUserAccountStatus")) {
            Log.error("AdminAdapter#updateUserAccountStatus::type is invalid");
            return ret;
        }
        Element userNameElem = contentElem.element("username");
        if (userNameElem == null) {
            Log.error("AdminAdapter#updateUserAccountStatus::userNameElem is null");
            return ret;
        }
        String userName = userNameElem.getStringValue();
        if (userName == null) {
            Log.error("AdminAdapter#updateUserAccountStatus::userName is null");
            return ret;
        }
        JID userJid = XMPPServer.getInstance().createJID(userName, null);
        if (!GlobalSNSUtils.isExistUser(userJid)) {
            Log.error("AdminAdapter#updateUserAccountStatus::user is not exist. userName="
                    + userName);
            return ret;
        }
        Element accountStatusElem = contentElem.element("accountstatus");
        if (accountStatusElem == null) {
            Log.error("AdminAdapter#updateUserAccountStatus::accountStatusElem is null");
            return ret;
        }
        String accountStatus = accountStatusElem.getStringValue();
        if (accountStatus == null) {
            Log.error("AdminAdapter#updateUserAccountStatus::accountStatus is null");
            return ret;
        }
        int accountStatusNum = 0;
        try {
            accountStatusNum = Integer.parseInt(accountStatus);
        } catch (NumberFormatException e) {
            Log.error("AdminAdapter#updateUserAccountStatus::accountStatus is invalid. userName="
                    + userName + ", accountStatus=" + accountStatus);
            return ret;
        }
        boolean updateResult = UserProfileDbHelper.updateUserStatus(
                userJid.toBareJID(), accountStatusNum);
        if (!updateResult) {
            Log.error("AdminAdapter#updateUserAccountStatus::failed to update database. userName="
                    + userName + ", accountStatus=" + accountStatus);
            return ret;
        }
        ret = IQ.createResultIQ(iq);
        ret.setChildElement(iq.getChildElement().createCopy());

        return ret;
    }

    @SuppressWarnings("deprecation")
    private IQ createResultIQ(String type, IQ iq, Element itemsElem) {
        IQ ret = null;
        if (iq == null) {
            Log.error("AdminAdapter#createResultIQ::iq is null");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("AdminAdapter#createResultIQ::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("AdminAdapter#createResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/admin"))) {
            Log.error("AdminAdapter#createResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = queryElem.element("content");
        if (contentElem != null) {
            queryElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element typeElem = DocumentHelper.createElement("type");
        typeElem.setText(type);

        newContentElem.add(typeElem);
        newContentElem.add(itemsElem);
        queryElem.add(newContentElem);
        queryElem.setParent(null);
        replyPacket.setChildElement(queryElem);

        return replyPacket;
    }

    public static boolean execRegisterUser(Element itemElement)
            throws UnauthorizedException {
        return execRegisterUser(itemElement, false);
    }

    @SuppressWarnings("deprecation")
    public static boolean execRegisterUser(Element itemElement,
            boolean userCreateFlag) throws UnauthorizedException {
        boolean ret = true;
        Element userNameElement = itemElement.element("username");
        if (userNameElement == null) {
            Log.error("AdminAdapter#execRegisterUser::userNameElement is null");
            return false;
        }
        String userName = userNameElement.getText();
        if (userName == null || userName.equals("")) {
            Log.error("AdminAdapter#execRegisterUser::userName is invalid");
            return false;
        }
        String userJid = XMPPServer.getInstance().createJID(userName, null)
                .toBareJID();
        Element passwordElement = itemElement.element("password");
        String password = passwordElement.getText();
        Element nicknameElement = null;
        Element eMailElement = itemElement.element("email");
        String eMail = null;
        if (eMailElement != null && !eMailElement.getText().trim().equals("")) {
            eMail = eMailElement.getText();
        }
        Element groupElement = itemElement.element("group");

        UserManager userManager = XMPPServer.getInstance().getUserManager();
        if (userCreateFlag) {
            try {
                userManager.createUser(userName, password, null, null);
            } catch (Exception e) {
                Log.error("AdminAdapter#execRegisterUser::createUser error. "
                        + e.getMessage());
                return false;
            }
        }
        Element vCardElement = itemElement.element("vCard");
        if (vCardElement == null) {
            Log.debug("Not vCard Element");
        } else {
            try {
                UserProfileAdapter.getInstance().setVCard(
                        userNameElement.getText(), vCardElement);
                nicknameElement = vCardElement.element("NICKNAME");
            } catch (Exception e) {
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                String exceptionAsString = sw.toString();
                Log.error("VCard set Error" + exceptionAsString);
                throw new UnauthorizedException(e);
            }
        }

        Element contactElement = itemElement.element("contact");
        if (contactElement == null) {
            Log.debug("Not Contact Element");
        } else {
            String type = contactElement.attributeValue("type");
            switch (ContactManager.CreateContactType.toType(type)) {
            case all:
                Map<String, User> targetUsers = ContactManager.getInstance()
                        .getTargetUsers();
                targetUsers.remove(userName);
                ContactManager.getInstance().requestContactEachOther(userName,
                        targetUsers);
                FollowFollowerManager.getInstance().requestFollowEachOther(
                        userName, targetUsers);
                break;
            case none:
            case custom:
            default:
                break;
            }
        }
        Profile profileData = new Profile();
        profileData.setJid(userJid);
        profileData.setPassword(password);
        profileData.setUserName(userName);
        profileData.setEmail(eMail);
        if (nicknameElement != null
                && !nicknameElement.getText().trim().equals("")) {
            String nickName = nicknameElement.getText();
            try {
                nickName = URLDecoder.decode(nickName, "UTF-8");
                nickName = URLEncoder.encode(nickName, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                Log.error("Encode or Decode Error");
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                String exceptionAsString = sw.toString();
                Log.error(exceptionAsString);
                nickName = "";
            }
            profileData.setNickName(nickName);
        }
        String groups = ConvertGroupXMPPtoJSON(groupElement);
        profileData.setAffiliation(groups);

        UserProfileAdapter.getInstance().addUserProfile(profileData);
        Log.info(AdminAdapter.class.getName()
                + " :: End Create user_profile DB Process ::");
        ret = true;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private boolean execUpdateUser(Element itemElement) {
        boolean ret = true;
        Element userNameElement = itemElement.element("username");
        if (userNameElement == null) {
            Log.error("AdminAdapter#execUpdateUser::userNameElement is null");
            return false;
        }
        String userName = userNameElement.getText();
        if (userName == null || userName.equals("")) {
            Log.error("AdminAdapter#execUpdateUser::userName is invalid");
            return false;
        }
        JID userJid = XMPPServer.getInstance().createJID(userName, null);
        String userJidStr = userJid.toBareJID();
        if (!GlobalSNSUtils.isExistUser(userJid)) {
            Log.error("AdminAdapter#execUpdateUser - user is not exist. jid="
                    + userJidStr);
            return false;
        }
        Element nicknameElement = null;
        Element groupElement = itemElement.element("group");

        VCardManager vManager = VCardManager.getInstance();

        String oldNickName = "";

        Element deleteFlgElement = itemElement.element("delete_flg");
        int deleteFlg = -1;
        if(deleteFlgElement != null && deleteFlgElement.getText().matches("^[02]$")){
            deleteFlg = Integer.parseInt(deleteFlgElement.getText());
        }

        Element vCardElement = itemElement.element("vCard");

        Element emailElement = vCardElement.element("EMAIL");
        String emailString = "";
        if (emailElement != null){
            Element emailUserIdElement = emailElement.element("USERID");
            if (emailUserIdElement != null) {
                emailString = emailUserIdElement.getTextTrim();
            }
        }

        if (vCardElement == null) {
            Log.debug("Not vCard Element");
        } else {
            try {
                nicknameElement = vCardElement.element("NICKNAME");
                if (nicknameElement != null) {
                    Element newContentElem = DocumentHelper
                            .createElement("NICKNAME");
                    newContentElem.setText(nicknameElement.getText());
                    Element orgUserVCard = vManager.getVCard(userName);

                    if (orgUserVCard == null) {
                        Element userVCard = DocumentHelper
                                .createElement("vCard");
                        userVCard.addNamespace("", "vcard-temp");
                        String vCardElementStr = userVCard.asXML();
                        SAXReader xmlReader = new SAXReader();
                        xmlReader.setEncoding("UTF-8");
                        Document doc = xmlReader.read(new StringReader(
                                vCardElementStr));
                        orgUserVCard = doc.getRootElement();

                        Log.warn("AdminAdapter#execUpdateUser -User Not Found. userName:"
                                + userName + ". So, create vCard");

                    }

                    Element cpVCardElement = orgUserVCard.createCopy();
                    Element cpNicknameElement = cpVCardElement
                            .element("NICKNAME");
                    if (cpNicknameElement != null) {
                        oldNickName = cpNicknameElement.getText();
                        cpVCardElement.remove(cpNicknameElement);
                    }
                    cpVCardElement.add(newContentElem);

                    UserProfileAdapter.getInstance().setVCard(
                            userNameElement.getText(), cpVCardElement);
                }
            } catch (Exception e) {
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                String exceptionAsString = sw.toString();
                Log.error("VCard set Error" + exceptionAsString);
                return false;
            }
        }

        Profile profileData = UserProfileDbHelper
                .getUserProfileData(userJidStr);
        if (profileData == null) {
            Log.warn("AdminAdapter#execUpdateUser - profile data was not found from DB. jid="
                    + userJidStr);
            profileData = new Profile();
            profileData.setJid(userJidStr);
            profileData.setUserName(userName);
            profileData.setPresence(1);
            profileData.setEmail(null);
            if (emailString != ""){
                profileData.setEmail(emailString);
            }
            String password = "";
            try {
                password = AuthFactory.getAuthProvider().getPassword(userName);
                profileData.setPassword(password);
            } catch (UserNotFoundException exception) {
                Log.error(exception.getMessage());
            }
            profileData.setNickName(oldNickName);
            UserProfileDbHelper.insertUserProfileDataToDb(profileData);
        }
        if (nicknameElement != null) {
            String nickName = nicknameElement.getText();
            try {
                nickName = URLDecoder.decode(nickName, "UTF-8");
                nickName = URLEncoder.encode(nickName, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                Log.error("Encode or Decode Error");
                StringWriter sw = new StringWriter();
                e.printStackTrace(new PrintWriter(sw));
                String exceptionAsString = sw.toString();
                Log.error(exceptionAsString);
                nickName = "";
            }
            profileData.setNickName(nickName);
        }
        if (groupElement != null) {
            String groups = ConvertGroupXMPPtoJSON(groupElement);
            profileData.setAffiliation(groups);
        }
        if(deleteFlg == 0 || deleteFlg == 2){
            profileData.setDeleteFlg(deleteFlg);
        }
        profileData.setEmail(null);
        if (emailString != ""){
            profileData.setEmail(emailString);
        }
        ret = UserProfileDbHelper.updateUserProfileDataToDb(profileData, 0);
        if(ret){
            if(deleteFlg == 0 || deleteFlg == 2){
                ret = UserAccountStroreDbHelper
                    .updateUserAccountDeletFlgDataToDb(deleteFlg,userName);
            }
        }else{
            return false;
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    private boolean execPhysicalDeleteUser(Element itemElem) {
        boolean ret = false;
        if (itemElem == null) {
            Log.error("AdminAdapter#execPhysicalDeleteUser::itemElem is null");
            return ret;
        }
        Element userNameElem = itemElem.element("username");
        if (userNameElem == null) {
            Log.error("AdminAdapter#execPhysicalDeleteUser::userNameElem is null");
            return ret;
        }
        String userName = userNameElem.getText();
        if (userName == null || userName.equals("")) {
            Log.error("AdminAdapter#execPhysicalDeleteUser::userName is invalid");
            return ret;
        }
        try {
            FollowFollowerManager.getInstance().requestPhysicalDeleteUser(
                    userName);

            ContactManager.getInstance().requestPhysicalDeleteUser(userName);

            ret = true;
        } catch (Exception e) {
            Log.error("AdminAdapter#execPhysicalDeleteUser::Error deleteUser. userName:"
                    + userName);
        }
        return ret;
    }

    @SuppressWarnings({ "unchecked" })
    public static String ConvertGroupXMPPtoJSON(Element groupElem) {
        String groupsJSON = "";

        if (groupElem == null) {
            return groupsJSON;
        }
        List<Element> groupElemList = groupElem.elements();
        if (groupElemList == null) {
            return groupsJSON;
        }
        List<String> groupList = new ArrayList<String>();
        for (int i = 0; i < groupElemList.size(); i++) {
            Element itemElem = groupElemList.get(i);
            if (itemElem == null) {
                continue;
            }
            String item = itemElem.getStringValue();
            if (item == null || item.equals("")) {
                continue;
            }
            groupList.add(item);
        }

        groupsJSON = JSON.encode(groupList);

        return groupsJSON;
    }

    @SuppressWarnings("deprecation")
    public static Element ConvertGroupJSONtoXMPP(String groupsJSON) {

        Element groupElem = DocumentHelper.createElement("group");
        try {
            if (groupsJSON != null && !groupsJSON.equals("")) {
                List<String> groupList = JSON.decode(groupsJSON);
                if (groupList != null) {
                    for (int i = 0; i < groupList.size(); i++) {
                        String group = groupList.get(i);
                        Element itemElem = DocumentHelper.createElement("item");
                        itemElem.setText(group);
                        groupElem.add(itemElem);
                    }
                }
            }
        } catch (Exception e) {
            Log.error("AdminAdapter#ConvertGroupJSONtoXMPP::creat groupElem error "
                    + e.getMessage());
        }

        return groupElem;
    }
}
