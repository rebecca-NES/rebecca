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

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import jp.co.nec.necst.spf.globalSNS.Data.ContactListMember;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.ContactManager;
import jp.co.nec.necst.spf.globalSNS.Group.ContactManager.AddOrRemoveResultMemberListType;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;
import net.arnx.jsonic.JSON;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.SharedGroupException;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.roster.Roster;
import org.jivesoftware.openfire.roster.RosterItem;
import org.jivesoftware.openfire.user.User;
import org.jivesoftware.openfire.user.UserAlreadyExistsException;
import org.jivesoftware.openfire.user.UserManager;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class ContactAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(ContactAdapter.class);
    private static ContactAdapter mThisInstance = null;
    private static UserManager userManager = XMPPServer.getInstance()
            .getUserManager();

    private ContactAdapter() {
    }

    public static ContactAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new ContactAdapter();
        }
        return mThisInstance;
    }

    public void addRosterItem(String baseUserName, String targetUserName,
            RosterItem.SubType type) throws UserNotFoundException,
            UserAlreadyExistsException, SharedGroupException {
        User baseUser = userManager.getUser(baseUserName);
        JID targetUserJid = XMPPServer.getInstance().createJID(targetUserName,
                null);
        RosterItem.SubType subType = RosterItem.SUB_NONE;
        if (type != null) {
            subType = type;
        }
        boolean isPush = true;
        boolean isPersistent = true;
        RosterItem baseUserRosterItem = baseUser.getRoster().createRosterItem(
                targetUserJid, isPush, isPersistent);
        baseUserRosterItem.setSubStatus(subType);
        baseUser.getRoster().updateRosterItem(baseUserRosterItem);
    }

    public void deleteRosterItem(String baseUserName, String deleteUserName)
            throws UserNotFoundException, SharedGroupException {
        User baseUser = userManager.getUser(baseUserName);
        JID deleteUserJid = XMPPServer.getInstance().createJID(deleteUserName,
                null);
        baseUser.getRoster().deleteRosterItem(deleteUserJid, false);
    }

    @SuppressWarnings({ "unchecked" })
    public static IQ getRoster(IQ iq) throws UserNotFoundException,
            SharedGroupException {
        IQ retPacket = null;
        if (iq == null) {
            Log.error("ContactAdapter#getRoster - iq is null.");
            return retPacket;
        }
        JID sender = iq.getFrom();
        String id = iq.getID();
        Roster cachedRoster = userManager.getUser(sender.getNode()).getRoster();
        retPacket = cachedRoster.getReset().createCopy();
        if (retPacket == null) {
            Log.error("ContactAdapter#getRoster - retPacket is null.");
            return retPacket;
        }

        retPacket.setType(IQ.Type.result);
        retPacket.setTo(sender);
        retPacket.setID(id);
        Element queryElement = retPacket.getChildElement();
        if (queryElement == null) {
            Log.error("ContactAdapter#getRoster - queryElement is null.");
            return retPacket;
        }
        if (!"query".equals(queryElement.getName())) {
            Log.error("ContactAdapter#getRoster - queryElement name is invalid.");
            return retPacket;
        }
        if (!"jabber:iq:roster".equals(queryElement.getNamespaceURI())) {
            Log.error("ContactAdapter#getRoster - queryElement namespace is invalid.");
            return retPacket;
        }

        List<Element> itemElemList = queryElement.elements();
        if (itemElemList == null) {
            Log.error("ContactAdapter#getRoster - itemElemList is null.");
            return retPacket;
        }
        Set<String> jidList = new HashSet<String>();
        for (Element itemElem : itemElemList) {
            if (itemElem == null) {
                continue;
            }
            if (!"item".equals(itemElem.getName())) {
                Log.info("ContactAdapter#getRoster - itemElem name is not 'item'.");
                continue;
            }
            String jidStr = itemElem.attributeValue("jid");
            if (jidStr == null || "".equals(jidStr)) {
                jidStr = itemElem.attributeValue("JID");
            }
            if (jidStr == null || "".equals(jidStr)) {
                Log.info("ContactAdapter#getRoster - jid attribute is not exist in itemElem.");
                continue;
            }
            jidList.add(jidStr);
        }
        boolean exclusionDeleteUserFlg = false;
        List<Profile> profileList = UserProfileDbHelper.getUserProfileDataList(
                jidList, exclusionDeleteUserFlg);
        Map<String, Profile> profileHashMap = new ConcurrentHashMap<String, Profile>();
        for (Profile profile : profileList) {
            if (profile == null) {
                continue;
            }
            String jid = profile.getJid();
            profileHashMap.put(jid, profile);
        }
        for (Element itemElem : itemElemList) {
            if (itemElem == null) {
                continue;
            }
            if (!"item".equals(itemElem.getName())) {
                Log.info("ContactAdapter#getRoster - itemElem name is not 'item'.");
                continue;
            }
            String jidStr = itemElem.attributeValue("jid");
            if (jidStr == null || "".equals(jidStr)) {
                jidStr = itemElem.attributeValue("JID");
            }
            if (jidStr == null || "".equals(jidStr)) {
                Log.info("ContactAdapter#getRoster - jid attribute is not exist in itemElem.");
                continue;
            }
            Profile userProfile = profileHashMap.get(jidStr);
            if (userProfile == null) {
                Log.info("ContactAdapter#getRoster - userProfile is null.");
                userProfile = new Profile();
            }
            String strAffiliation = userProfile.getAffiliation();
            if (strAffiliation == null || strAffiliation.trim().equals("")) {
                strAffiliation = "[]";
            }
            List<String> affiliationList = JSON.decode(strAffiliation);
            int deleteFlag = userProfile.getDeleteFlg();
            List<Element> groupElemList = itemElem.elements();
            if (groupElemList != null) {
                int groupCount = groupElemList.size();
                for (int j = groupCount - 1; j >= 0; --j) {
                    Element openfireGroupElem = groupElemList.get(j);
                    if (openfireGroupElem == null) {
                        continue;
                    }
                    if (!"group".equals(openfireGroupElem.getName())) {
                        continue;
                    }
                    itemElem.remove(openfireGroupElem);
                }
            }
            if (affiliationList != null) {
                int affiliationCount = affiliationList.size();
                for (int j = 0; j < affiliationCount; j++) {
                    String groupName = affiliationList.get(j);
                    if (groupName == null || "".equals(groupName)) {
                        continue;
                    }
                    Element cubeeGroupElem = DocumentHelper
                            .createElement("group");
                    cubeeGroupElem.setText(groupName);
                    itemElem.add(cubeeGroupElem);
                }
            }
            itemElem.addAttribute("status", String.valueOf(deleteFlag));
            String nickName = userProfile.getNickName();
            try {
                nickName = URLDecoder.decode(nickName, "UTF-8");
                nickName = URLEncoder.encode(nickName, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                nickName = "";
            }
            itemElem.addAttribute("nickname", nickName);
            int presence = 0;
            int presenceData = userProfile.getPresence();
            if ((presenceData & Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE) != 0 || (presenceData & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) != 0) {
                presence = presenceData & 0x7;
            }
            itemElem.addAttribute("presence", String.valueOf(presence));
            String myMemo = userProfile.getMyMemo();
            try {
                myMemo = URLDecoder.decode(myMemo, "UTF-8");
                myMemo = URLEncoder.encode(myMemo, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                myMemo = "";
            }
            itemElem.addAttribute("mymemo", myMemo);
            String avatarType = userProfile.getPhotoType();
            itemElem.addAttribute("avatartype", avatarType);
            String avatarData = userProfile.getPhotoData();
            itemElem.addAttribute("avatardata", avatarData);
        }

        return retPacket;
    }

    public IQ addMember(IQ iq) {
        IQ retPacket = null;
        String logPrefix = "ContactAdapter#addMember::";
        if (iq == null) {
            Log.error(logPrefix + "iq is null");
            return retPacket;
        }
        Element contactElem = iq.getChildElement();
        if (contactElem == null) {
            Log.error(logPrefix + "contactElem is null");
            return retPacket;
        }
        String tagName = contactElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("contact"))) {
            Log.error(logPrefix + "tagName is invalid");
            return retPacket;
        }
        String namespaceURI = contactElem.getNamespaceURI();
        List<ContactListMember> requestAddMemberData = getAddMemberDataFromAddContactListMemberXMPP(iq);
        if (requestAddMemberData == null) {
            Log.error(logPrefix + "addMemberData is null");
            return retPacket;
        }
        String requestJid = iq.getFrom().toBareJID();
        Map<AddOrRemoveResultMemberListType, List<ContactListMember>> resultMap = ContactManager.getInstance()
                .addMember(requestJid, requestAddMemberData);
        if (resultMap == null) {
            Log.error(logPrefix + "addedMemberList is null");
            return retPacket;
        }
        List<ContactListMember> successMemberList = resultMap.get(AddOrRemoveResultMemberListType.SuccessMembers);
        List<ContactListMember> failureMemberList = resultMap.get(AddOrRemoveResultMemberListType.FailureMembers);
        retPacket = createAddOrRemoveMemberResponsePacket(iq, successMemberList, failureMemberList, namespaceURI);

        return retPacket;
    }

    private IQ createAddOrRemoveMemberResponsePacket(IQ iq,
            List<ContactListMember> successMemberList,
            List<ContactListMember> failureMemberList,
            String namespace) {
        IQ ret = null;
        String logPrefix = "ContactAdapter#createAddMemberResponsePacket::";
        if (iq == null) {
            Log.error(logPrefix + "iq is null");
            return ret;
        }
        if (successMemberList == null) {
            Log.error(logPrefix + "successMemberList is null");
            return ret;
        }
        if (failureMemberList == null) {
            Log.error(logPrefix + "failureMemberList is null");
            return ret;
        }
        if (namespace == null || "".equals(namespace.trim())) {
            Log.error(logPrefix + "namespace is null");
            return ret;
        }
        Element contactElem = iq.getChildElement();
        if (contactElem == null) {
            Log.error(logPrefix + "contactElem is null");
            return ret;
        }
        String tagName = contactElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("contact"))) {
            Log.error(logPrefix + "tagName is invalid");
            return ret;
        }
        String namespaceURI = contactElem.getNamespaceURI();
        if (namespaceURI == null
                || !(namespaceURI
                        .equals(namespace))) {
            Log.error(logPrefix + "namespace is invalid");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = contactElem.element("content");
        if (contentElem != null) {
            contactElem.remove(contentElem);
        }
        Element newContentElem = null;
        if("http://necst.nec.co.jp/protocol/addcontactlistmember".equals(namespace)){
            newContentElem = createAddMemberContentElem(
                    requestJid, successMemberList, failureMemberList);
        }else if("http://necst.nec.co.jp/protocol/removecontactlistmember".equals(namespace)){
            newContentElem = createRemoveMemberContentElem(
                    requestJid, successMemberList, failureMemberList);
        }
        if (newContentElem == null) {
            Log.error(logPrefix + "newContentElem is null.");
            return ret;
        }
        contactElem.add(newContentElem);
        contactElem.setParent(null);
        replyPacket.setChildElement(contactElem);
        ret = replyPacket;

        return ret;
    }

    private Element createAddMemberContentElem(String requestJid,
            List<ContactListMember> successMemberList,
            List<ContactListMember> failureMemberList) {
        Element contentElem = null;
        String logPrefix = "ContactAdapter#createAddMemberContentElem::";
        if (requestJid == null || "".equals(requestJid)) {
            Log.error(logPrefix + "requestJid is null");
            return contentElem;
        }
        if (successMemberList == null) {
            Log.error(logPrefix + "successMemberList is null");
            return contentElem;
        }
        if (failureMemberList == null) {
            Log.error(logPrefix + "failureMemberList is null");
            return contentElem;
        }
        contentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        Element itemElem = DocumentHelper.createElement("item");
        Element addedByElem = DocumentHelper.createElement("added_by");
        addedByElem.setText(requestJid);
        Element membersElem = DocumentHelper.createElement("members");
        int membersCount = failureMemberList.size();
        membersElem.addAttribute("count", String.valueOf(membersCount));
        Element successMemberElem = createSuccessAddMemberElem(requestJid, successMemberList);
        Element failureMembersElem = createFailureAddMemberElem(failureMemberList);
        membersElem.add(successMemberElem);
        membersElem.add(failureMembersElem);
        itemElem.add(addedByElem);
        itemElem.add(membersElem);
        itemsElem.add(itemElem);
        contentElem.add(itemsElem);

        return contentElem;
    }

    private Element createSuccessAddMemberElem(String requestJid,
            List<ContactListMember> successMemberList) {
        Element ret = null;
        String logPrefix = "ContactAdapter#createSuccessAddMemberElem::";
        if (requestJid == null || "".equals(requestJid)) {
            Log.error(logPrefix + "requestJid is null");
            return ret;
        }
        if (successMemberList == null) {
            Log.error(logPrefix + "successedMemberList is null");
            return ret;
        }
        Element successMemberElem = DocumentHelper.createElement("successmembers");
        for(ContactListMember contactListMember : successMemberList){
            String addedJid = contactListMember.getJid();
            Profile profile = UserAccountManager.getInstance().getProfile(addedJid, requestJid);
            if(profile == null){
                continue;
            }
            Element memberElem = UserAdapter.getInstance().getProfileItemElementForContactList(profile);
            if(memberElem == null){
                continue;
            }
            Element contactListGroupsElem = DocumentHelper.createElement("contactlistgroups");
            String strAffiliation = profile.getAffiliation();
            if (strAffiliation == null || strAffiliation.trim().equals("")) {
                strAffiliation = "[]";
            }
            List<String> affiliationList = JSON.decode(strAffiliation);
            List<Integer> positionList = contactListMember.getPosition();
            if (affiliationList != null) {
                int affiliationCount = affiliationList.size();
                for (int j = 0; j < affiliationCount; j++) {
                    String groupName = affiliationList.get(j);
                    if (groupName == null || "".equals(groupName)) {
                        continue;
                    }
                    Element contactListGroupElem = DocumentHelper.createElement("contactlistgroup");
                    contactListGroupElem.setText(groupName);
                    contactListGroupsElem.add(contactListGroupElem);
                    positionList.add(-1);
                }
            }
            Element positionElem = DocumentHelper.createElement("position");
            for(Integer position : positionList){
                if(position == null){
                    continue;
                }
                Element positionItemElem = DocumentHelper.createElement("item");
                positionItemElem.setText(position.toString());
                positionElem.add(positionItemElem);
            }
            memberElem.add(contactListGroupsElem);
            memberElem.add(positionElem);
            successMemberElem.add(memberElem);
        }
        ret = successMemberElem;
        return ret;
    }

    private Element createFailureAddMemberElem(
            List<ContactListMember> failureMemberList) {
        Element ret = null;
        String logPrefix = "ContactAdapter#createFailureAddMemberElem::";
        if (failureMemberList == null) {
            Log.error(logPrefix + "failureMemberList is null");
            return ret;
        }
        Element failureMembersElem = DocumentHelper.createElement("failuremembers");
        for(ContactListMember contactListMember : failureMemberList){
            String jid = contactListMember.getJid();
            Element memberElem = DocumentHelper.createElement("member");
            List<String> groupList = contactListMember.getContactListGroup();
            String group = "";
            if(groupList.size() != 0){
                group = groupList.get(0);
            }
            Element jidElem = DocumentHelper.createElement("jid");
            jidElem.setText(jid);
            Element contactListGroupElem = DocumentHelper.createElement("contactlistgroup");
            contactListGroupElem.setText(group);
            memberElem.add(jidElem);
            memberElem.add(contactListGroupElem);
            failureMembersElem.add(memberElem);
        }
        ret = failureMembersElem;
        return ret;
    }


    private List<ContactListMember> getAddMemberDataFromAddContactListMemberXMPP(IQ iq) {
        List<ContactListMember> ret = null;
        String logPrefix = "ContactAdapter#getAddMemberDataFromAddContactListMemberXMPP::";
        if (iq == null) {
            Log.error(logPrefix + "iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error(logPrefix + "iq type is not set");
            return ret;
        }
        Element contactElem = iq.getChildElement();
        if (contactElem == null) {
            Log.error(logPrefix + "contactElem is null");
            return ret;
        }
        String tagName = contactElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("contact"))) {
            Log.error(logPrefix + "tagName is invalid");
            return ret;
        }
        String namespace = contactElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/addcontactlistmember"))) {
            Log.error(logPrefix + "namespace is invalid");
            return ret;
        }
        Element contentElem = contactElem.element("content");
        if (contentElem == null) {
            Log.error(logPrefix + "contentElem is null");
            return ret;
        }
        Element membersElem = contentElem.element("members");
        if (membersElem == null) {
            Log.error(logPrefix + "membersElem is null");
            return ret;
        }
        @SuppressWarnings("unchecked")
        List<Element> memberElementList = membersElem.elements();
        if (memberElementList == null) {
            Log.error(logPrefix + "memberElementList is null");
            return ret;
        }
        ret = new ArrayList<ContactListMember>();
        for (Element memberElem : memberElementList) {
            if (memberElem == null) {
                Log.warn(logPrefix + "memberElem is null");
                continue;
            }
            String memberElemTagName = memberElem.getName();
            if (memberElemTagName == null
                    || !(memberElemTagName.toLowerCase().equals("member"))) {
                Log.error(logPrefix + "memberElemTagName is not \"member\".");
                continue;
            }
            Element jidElem = memberElem.element("jid");
            if (jidElem == null) {
                Log.error(logPrefix + "jidElem is null");
                return ret;
            }

            String memberJid = jidElem.getStringValue();
            if (memberJid == null || memberJid.equals("")) {
                Log.error(logPrefix + "memberJid is invalid");
                continue;
            }
            Element contactListGroupElem = memberElem.element("contactlistgroup");
            String contactListGroup = "";
            if (contactListGroupElem != null) {
                contactListGroup = contactListGroupElem.getStringValue();
            }

            ContactListMember contactListMember = new ContactListMember();
            contactListMember.setJid(memberJid);
            contactListMember.getContactListGroup().add(contactListGroup);
            ret.add(contactListMember);
        }
        return ret;
    }

    public IQ removeMember(IQ iq) {
        IQ retPacket = null;
        String logPrefix = "ContactAdapter#removeMember::";
        if (iq == null) {
            Log.error(logPrefix + "iq is null");
            return retPacket;
        }
        Element contactElem = iq.getChildElement();
        if (contactElem == null) {
            Log.error(logPrefix + "contactElem is null");
            return retPacket;
        }
        String tagName = contactElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("contact"))) {
            Log.error(logPrefix + "tagName is invalid");
            return retPacket;
        }
        String namespaceURI = contactElem.getNamespaceURI();
        List<ContactListMember> requestRemoveMemberData = getRemoveMemberDataFromRemoveContactListMemberXMPP(iq);
        if (requestRemoveMemberData == null) {
            Log.error(logPrefix + "requestRemoveMemberData is null");
            return retPacket;
        }
        String requestJid = iq.getFrom().toBareJID();
        Map<AddOrRemoveResultMemberListType, List<ContactListMember>> resultMap = ContactManager.getInstance()
                .removeMember(requestJid, requestRemoveMemberData);
        if (resultMap == null) {
            Log.error(logPrefix + "resultMap is null");
            return retPacket;
        }
        List<ContactListMember> successMemberList = resultMap.get(AddOrRemoveResultMemberListType.SuccessMembers);
        List<ContactListMember> failureMemberList = resultMap.get(AddOrRemoveResultMemberListType.FailureMembers);
        retPacket = createAddOrRemoveMemberResponsePacket(iq, successMemberList, failureMemberList, namespaceURI);

        return retPacket;
    }

    private List<ContactListMember> getRemoveMemberDataFromRemoveContactListMemberXMPP(
            IQ iq) {
        List<ContactListMember> ret = null;
        String logPrefix = "ContactAdapter#getRemoveMemberDataFromRemoveContactListMemberXMPP::";
        if (iq == null) {
            Log.error(logPrefix + "iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error(logPrefix + "iq type is not set");
            return ret;
        }
        Element contactElem = iq.getChildElement();
        if (contactElem == null) {
            Log.error(logPrefix + "contactElem is null");
            return ret;
        }
        String tagName = contactElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("contact"))) {
            Log.error(logPrefix + "tagName is invalid");
            return ret;
        }
        String namespace = contactElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/removecontactlistmember"))) {
            Log.error(logPrefix + "namespace is invalid");
            return ret;
        }
        Element contentElem = contactElem.element("content");
        if (contentElem == null) {
            Log.error(logPrefix + "contentElem is null");
            return ret;
        }
        Element membersElem = contentElem.element("members");
        if (membersElem == null) {
            Log.error(logPrefix + "membersElem is null");
            return ret;
        }
        @SuppressWarnings("unchecked")
        List<Element> memberElementList = membersElem.elements();
        if (memberElementList == null) {
            Log.error(logPrefix + "memberElementList is null");
            return ret;
        }
        ret = new ArrayList<ContactListMember>();
        for (Element memberElem : memberElementList) {
            if (memberElem == null) {
                Log.warn(logPrefix + "memberElem is null");
                continue;
            }
            String memberElemTagName = memberElem.getName();
            if (memberElemTagName == null
                    || !(memberElemTagName.toLowerCase().equals("member"))) {
                Log.error(logPrefix + "memberElemTagName is not \"member\".");
                continue;
            }
            Element jidElem = memberElem.element("jid");
            if (jidElem == null) {
                Log.error(logPrefix + "jidElem is null");
                return ret;
            }

            String memberJid = jidElem.getStringValue();
            if (memberJid == null || memberJid.equals("")) {
                Log.error(logPrefix + "memberJid is invalid");
                continue;
            }

            ContactListMember contactListMember = new ContactListMember();
            contactListMember.setJid(memberJid);
            ret.add(contactListMember);
        }
        return ret;
    }

    private Element createRemoveMemberContentElem(String requestJid,
            List<ContactListMember> successMemberList,
            List<ContactListMember> failureMemberList) {
        Element contentElem = null;
        String logPrefix = "ContactAdapter#createAddMemberContentElem::";
        if (requestJid == null || "".equals(requestJid)) {
            Log.error(logPrefix + "requestJid is null");
            return contentElem;
        }
        if (successMemberList == null) {
            Log.error(logPrefix + "addedMemberList is null");
            return contentElem;
        }
        if (failureMemberList == null) {
            Log.error(logPrefix + "requestAddMemberData is null");
            return contentElem;
        }
        contentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        Element itemElem = DocumentHelper.createElement("item");
        Element addedByElem = DocumentHelper.createElement("removed_by");
        addedByElem.setText(requestJid);
        Element membersElem = DocumentHelper.createElement("members");
        int membersCount = failureMemberList.size();
        membersElem.addAttribute("count", String.valueOf(membersCount));
        Element successMemberElem = createSuccessOrFailureRemoveMemberElem(successMemberList, "successmembers");
        Element failureMembersElem = createSuccessOrFailureRemoveMemberElem(failureMemberList, "failuremembers");
        membersElem.add(successMemberElem);
        membersElem.add(failureMembersElem);
        itemElem.add(addedByElem);
        itemElem.add(membersElem);
        itemsElem.add(itemElem);
        contentElem.add(itemsElem);

        return contentElem;
    }

    private Element createSuccessOrFailureRemoveMemberElem(
            List<ContactListMember> memberList, String tagName) {
        Element ret = null;
        String logPrefix = "ContactAdapter#createSuccessOrFailureRemoveMemberElem::";
        if (memberList == null) {
            Log.error(logPrefix + "memberList is null");
            return ret;
        }
        if (tagName == null || "".equals(tagName)) {
            Log.error(logPrefix + "tagName is invalid");
            return ret;
        }
        Element successOrFailureMemberElem = DocumentHelper.createElement(tagName);
        for(ContactListMember contactListMember : memberList){
            String jid = contactListMember.getJid();
            Element memberElem =  DocumentHelper.createElement("member");
            Element jidElem = DocumentHelper.createElement("jid");
            jidElem.setText(jid);
            memberElem.add(jidElem);
            successOrFailureMemberElem.add(memberElem);
        }
        ret = successOrFailureMemberElem;
        return ret;
    }
}
