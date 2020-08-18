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

import java.io.StringReader;
import java.math.BigInteger;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.dom4j.Attribute;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomInfo;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomMember;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.ChatRoomSortCondition;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.Notification.GroupChatNotifier;

public class GroupChatAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(GroupChatAdapter.class);
    private static final String SEND_MESSAGE_NAMESPACE = "http://necst.nec.co.jp/protocol/send";
    private static GroupChatAdapter mInstance = null;
    private static final String REMOVE_GROUP_CHAT_MEMBER_NAMESPACE = "http://necst.nec.co.jp/protocol/removegroupchatmember";
    private static final String UPDATE_MESSAGE_BODY_NAMESPACE = "http://necst.nec.co.jp/protocol/updatemessagebody";
    private static final int PACKET_TYPE_RESPONSE = 0;
    private static final int PACKET_TYPE_NOTIFIER = 1;

    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateGroupChatRoomId = new ConcurrentHashMap<String, Object>();
    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateGrounpChatMessageItemId = new ConcurrentHashMap<String, Object>();

    private GroupChatAdapter() {
    }

    public static GroupChatAdapter getInstance() {
        Log.debug("do func GroupChatAdapter.getInstance(...");
        if (mInstance == null) {
            mInstance = new GroupChatAdapter();
        }
        return mInstance;
    }

    public IQ createGroupChatRoom(IQ iq) {
        Log.debug("do func GroupChatAdapter.createGroupChatRoom(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#createGroupChatRoom::iq is null");
            return ret;
        }
        ChatRoomInfo chatRoomInfo = getChatRoomInfoFromCreateRoomXMPP(iq);
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#createGroupChatRoom::chatRoomInfo is null");
            return ret;
        }
        Calendar now = Calendar.getInstance();
        chatRoomInfo.setCreatedAt(new Timestamp(now.getTimeInMillis()));
        chatRoomInfo.setUpdatedBy(chatRoomInfo.getCreatedBy());
        chatRoomInfo.setUpdatedAt(new Timestamp(now.getTimeInMillis()));
        String createdByJidStr = chatRoomInfo.getCreatedBy();
        if (createdByJidStr == null) {
            Log.error("GroupChatAdapter#createGroupChatRoom::createdByJidStr is null");
            return ret;
        }
        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateGroupChatRoomId) {
            lockObject = mLockObjectMapStringToObjectForGenerateGroupChatRoomId
                    .get(createdByJidStr);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateGroupChatRoomId.put(
                        createdByJidStr, lockObject);
            }
        }
        String roomId = null;
        synchronized (lockObject) {
            int nextRoomIdNumber = ChatRoomStoreDbHelper
                    .getNextChatRoomIdNumber(createdByJidStr);
            if (nextRoomIdNumber <= 0) {
                Log.error("GroupChatAdapter#createGroupChatRoom::nextRoomIdNumber is invalid");
                return ret;
            }
            String roomIdPrefix = ChatRoomStoreDbHelper
                    .getRoomIdPrefix(chatRoomInfo.getCreatedBy());
            if (roomIdPrefix == null || roomIdPrefix.equals("")) {
                Log.error("GroupChatAdapter#createGroupChatRoom::roomIdPrefix is invalid");
                return ret;
            }
            roomId = roomIdPrefix + nextRoomIdNumber;
            chatRoomInfo.setRoomId(roomId);
            if (!ChatRoomStoreDbHelper.insertChatRoomToDb(chatRoomInfo)) {
                Log.error("GroupChatAdapter#createGroupChatRoom::failed to insertChatRoomToDb");
                return ret;
            }
        }
        List<String> memberList = chatRoomInfo.getMemberList();
        for (String memeberJid : memberList) {
            if (memeberJid == null) {
                continue;
            }
            ChatRoomMember chatRoomMember = new ChatRoomMember();
            chatRoomMember.setRoomId(roomId);
            chatRoomMember.setJid(memeberJid);
            chatRoomMember.setState(ChatRoomMember.STATE_JOIN);
            chatRoomMember.setJoinDate(new Timestamp(now.getTimeInMillis()));
            ChatRoomMemberStoreDbHelper.insertChatRoomMemberToDb(
                    chatRoomMember, chatRoomInfo.getCreatedBy());
        }

        ret = createCreateGroupChatRoomResponsePacket(iq, roomId);

        GroupChatNotifier.getInstance().sendCreateGroupChatRoomNotification(
                roomId);

        return ret;
    }

    public IQ updateGroupChatRoom(IQ iq) {
        Log.debug("do func GroupChatAdapter.updateGroupChatRoom(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#updateGroupChatRoom::iq is null");
            return ret;
        }
        ChatRoomInfo chatRoomInfo = getChatRoomInfoFromUpdateRoomXMPP(iq);
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#updateGroupChatRoom::chatRoomInfo is null");
            return ret;
        }
        Calendar now = Calendar.getInstance();
        chatRoomInfo.setUpdatedAt(new Timestamp(now.getTimeInMillis()));

        ChatRoomInfo beforeChatRoomInfo = ChatRoomStoreDbHelper
                .getChatRoomInfoByRoomId(chatRoomInfo.getRoomId());
        if (beforeChatRoomInfo == null) {
            Log.error("GroupChatAdapter#updateGroupChatRoom::beforeChatRoomInfo got from DB is null.");
            return ret;
        }

        String beforeRoomName = beforeChatRoomInfo.getRoomName();
        chatRoomInfo.setPreRoomName(beforeRoomName);
        if(chatRoomInfo.getRoomName().compareToIgnoreCase("") == 0) {
            chatRoomInfo.setRoomName(beforeRoomName);
        }

        int beforeNotifyType = beforeChatRoomInfo.getNotifyType();
        chatRoomInfo.setPreNotifyType(beforeNotifyType);
        if(chatRoomInfo.getNotifyType() == -1) {
            chatRoomInfo.setNotifyType(beforeNotifyType);
        }

        int beforePrivacyType = beforeChatRoomInfo.getPrivacyType();
        chatRoomInfo.setPrePrivacyType(beforePrivacyType);
        if(chatRoomInfo.getPrivacyType() == -1) {
            chatRoomInfo.setPrivacyType(beforePrivacyType);
        }

        if (!ChatRoomStoreDbHelper.updateRoomInfo(chatRoomInfo)) {
            Log.error("GroupChatAdapter#updateGroupChatRoom::failed to updateChatRoomToDb");
            return ret;
        }

        ret = IQ.createResultIQ(iq);

        GroupChatNotifier.getInstance().sendUpdateGroupChatRoomNotification(
                chatRoomInfo);

        return ret;
    }

    public IQ deleteGroupChatRoom(IQ iq) {
        Log.debug("do func GroupChatAdapter.deleteGroupChatRoom(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#deleteGroupChatRoom::iq is null");
            return ret;
        }

        ChatRoomInfo chatRoomInfo = getChatRoomInfoFromDeleteRoomXMPP(iq);
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#deleteGroupChatRoom::chatRoomInfo is null");
            return ret;
        }
        ChatRoomStoreDbHelper.updateRoomInfo(chatRoomInfo);

        ret = IQ.createResultIQ(iq);

        return ret;
    }

    @SuppressWarnings("unchecked")
    private ChatRoomInfo getChatRoomInfoFromCreateRoomXMPP(IQ iq) {
        Log.debug("do func GroupChatAdapter.getChatRoomInfoFromCreateRoomXMPP(...");
        ChatRoomInfo ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::iq is null");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();
        if (iq.getType() != IQ.Type.set) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/createchatroom"))) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::contentElem is null");
            return ret;
        }
        Element roomNameElem = contentElem.element("roomname");
        if (roomNameElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::roomNameElem is null");
            return ret;
        }
        String roomName = roomNameElem.getStringValue();
        if (roomName == null || roomName.equals("")) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::roomName is invalid");
            return ret;
        }
        Element parentRoomIdElem = contentElem.element("parentroomid");
        if (parentRoomIdElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::parentRoomIdElem is null");
            return ret;
        }
        String parentRoomId = parentRoomIdElem.getStringValue();
        if (parentRoomId == null ||
            parentRoomId.indexOf(" ") >= 0 ||
            parentRoomId.indexOf("'") >= 0) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::parentRoomId is invalid");
            return ret;
        }
        Element privacyTypeElem = contentElem.element("privacytype");
        int privacyType = -1;
        if (privacyTypeElem != null) {
            String privacyTypeStr = privacyTypeElem.getStringValue();
            if (privacyTypeStr == null) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::privacyType is invalid");
                return ret;
            }else{
                try {
                    privacyType = Integer.parseInt(privacyTypeStr);
                } catch (NumberFormatException e) {
                    Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::privacyTypeStr is invalid");
                    return ret;
                }
            }
        }
        Element listTypeElem = contentElem.element("listtype");
        int listType = -1;
        if (listTypeElem != null) {
            String listTypeStr = listTypeElem.getStringValue();
            if (listTypeStr == null) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::listType is invalid");
                return ret;
            }else{
                try {
                    listType = Integer.parseInt(listTypeStr);
                } catch (NumberFormatException e) {
                    Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::listTypeStr is invalid");
                    return ret;
                }
            }
        }
        Element membersElem = contentElem.element("members");
        if (membersElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::membersElem is null");
            return ret;
        }

        List<Element> memberElementList = membersElem.elements();
        if (memberElementList == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::memberElementList is null");
            return ret;
        }
        int notifyType = ChatRoomInfo.NOTIFY_TYPE_ALL_ON;
        Element notifyTypeElem = contentElem.element("notify_type");
        if (notifyTypeElem != null) {
            try {
                notifyType = Integer.parseInt(notifyTypeElem.getStringValue());
                if(!checkNotfiyType(notifyType)) {
                    Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::notifyType is out of range value:" + notifyType);
                    return ret;
                }
            } catch (NumberFormatException e) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::notifyType is invalid");
                return ret;
            }
        }

        ChatRoomInfo chatRoomInfo = new ChatRoomInfo();
        chatRoomInfo.setRoomName(roomName);
        chatRoomInfo.setParentRoomId(parentRoomId);
        chatRoomInfo.setPrivacyType(privacyType);
        int count = memberElementList.size();
        boolean isOwnerIncluded = false;
        for (int i = 0; i < count; i++) {
            Element memberElement = memberElementList.get(i);
            if (memberElement == null) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::memberElement is null. No."
                        + i);
                continue;
            }
            String memberElemTagName = memberElement.getName();
            if (memberElemTagName == null
                    || !(memberElemTagName.toLowerCase().equals("member"))) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::memberElemTagName is invalid. No."
                        + i);
                continue;
            }
            String memberJidStr = memberElement.getStringValue();
            if (memberJidStr == null || memberJidStr.equals("")) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::memberJidStr is invalid. No."
                        + i);
                continue;
            }
            if (fromJidStr.equals(memberJidStr)) {
                isOwnerIncluded = true;
            }
            JID memberJid = new JID(memberJidStr);
            if (!GlobalSNSUtils.isExistUser(memberJid)) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::user is not exist. No."
                        + i);
                continue;
            }
            List<String> memberList = chatRoomInfo.getMemberList();
            for (String alreadyAddedMember : memberList) {
                if (memberJidStr.equals(alreadyAddedMember)) {
                    Log.info("GroupChatAdapter#getChatRoomInfoFromCreateRoomXMPP::user is allready added. jid="
                            + memberJidStr);
                    continue;
                }
            }
            chatRoomInfo.getMemberList().add(memberJidStr);
        }
        chatRoomInfo.setNotifyType(notifyType);
        if (!isOwnerIncluded) {
            return ret;
        }
        chatRoomInfo.setCreatedBy(fromJidStr);
        ret = chatRoomInfo;
        return ret;
    }

    @SuppressWarnings("unchecked")
    private ChatRoomInfo getChatRoomInfoFromUpdateRoomXMPP(IQ iq) {
        Log.debug("do func GroupChatAdapter.getChatRoomInfoFromUpdateRoomXMPP(...");
        ChatRoomInfo ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::iq is null");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();
        if (iq.getType() != IQ.Type.set) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/updatechatroominfo"))) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::contentElem is null");
            return ret;
        }
        Element extrasElem = contentElem.element("extras");
        if (extrasElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::extrasElem is null");
            return ret;
        }
        Element subTypeElem = extrasElem.element("subtype");
        if (subTypeElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::subTypeElem is null");
            return ret;
        }

        List<Element> subTypeElementList = subTypeElem.elements();
        if (subTypeElementList == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::subTypeElementList is null");
            return ret;
        }

        List<String> subTypeList = new ArrayList<String>();
        int count = subTypeElementList.size();
        for (int i = 0; i < count; i++) {
            Element subTypeElement = subTypeElementList.get(i);
            if (subTypeElement == null) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::subTypeElement is null. No."
                        + i);
                continue;
            }
            String subTypeElemTagName = subTypeElement.getName();
            if (subTypeElemTagName == null
                    || !(subTypeElemTagName.toLowerCase().equals("item"))) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::subTypeElemTagName is invalid. No."
                        + i);
                continue;
            }
            String subTypeStr = subTypeElement.getStringValue();
            if (subTypeStr == null || subTypeStr.equals("")) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::subTypeStr is invalid. No."
                        + i);
                continue;
            }
            subTypeList.add(subTypeStr);
        }
        if (subTypeList.size() == 0) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::subTypeList is null");
            return ret;
        }
        if (!subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGEROOMNAME)
                && !subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGEIMAGE)
                && !subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGENOTIFY)) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::subTypeList is invalid. "
                    + subTypeList.toString());
            return ret;
        }

        String roomName = "";
        if (subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGEROOMNAME)) {
            Element roomNameElem = contentElem.element("roomname");
            if (roomNameElem == null) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::roomNameElem is null");
                return ret;
            }
            roomName = roomNameElem.getStringValue();
            if (roomName == null || roomName.equals("")) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::roomName is invalid");
                return ret;
            }
        }

        int privacyType = -1;
        if (subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_PRIVACYTYPE)) {
            Element privacyTypeElem = contentElem.element("privacytype");
            if (privacyTypeElem == null) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::privacyTypeElem is null");
                return ret;
            }
            String privacyTypeStr = privacyTypeElem.getStringValue();
            if (privacyTypeStr == null || privacyTypeStr.equals("")) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::privacyTypeStr is invalid");
                return ret;
            }
            try {
                privacyType = Integer.parseInt(privacyTypeStr);
            } catch (NumberFormatException e) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMP::privacyTypeStr is invalid");
                return ret;
            }
        }


        int notifyType = ChatRoomInfo.NOTIFY_TYPE_ALL_ON;
        if (subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGENOTIFY)) {
            Element notifyTypeElem = contentElem.element("notify_type");
            if (notifyTypeElem == null) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::notifyTypeElem is null");
                return ret;
            }
            try {
                notifyType = Integer.parseInt(notifyTypeElem.getStringValue());
                if(!checkNotfiyType(notifyType)) {
                    Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::notifyType is out of range value:" + notifyType);
                    return ret;
                }
            } catch (NumberFormatException e) {
                Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::notifyType is invalid");
                return ret;
            }
        }

        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromUpdateRoomXMPP::roomId is invalid");
            return ret;
        }

        ChatRoomInfo chatRoomInfo = new ChatRoomInfo();
        chatRoomInfo.setRoomId(roomId);
        if (subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGEROOMNAME)) {
            chatRoomInfo.setRoomName(roomName);
        }
        if (subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGENOTIFY)) {
            chatRoomInfo.setNotifyType(notifyType);
        }
        chatRoomInfo.setUpdatedBy(fromJidStr);
        chatRoomInfo.setSubTypeList(subTypeList);
        if (subTypeList.contains(ChatRoomInfo.SUBTYPE_ITEM_PRIVACYTYPE)) {
            chatRoomInfo.setPrivacyType(privacyType);
        }else{
            chatRoomInfo.setPrivacyType(-1);
        }

        ret = chatRoomInfo;
        return ret;
    }

    @SuppressWarnings("unchecked")
    private ChatRoomInfo getChatRoomInfoFromDeleteRoomXMPP(IQ iq) {
        Log.debug("do func GroupChatAdapter.getChatRoomInfoFromDeleteRoomXMPP(...");
        ChatRoomInfo ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/deletechatroom"))) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::roomId is invalid");
            return ret;
        }

        ChatRoomInfo chatRoomInfo = ChatRoomStoreDbHelper.getDeletedChatRoomInfoByRoomId(roomId);
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoFromDeleteRoomXMPP::chatRoomInfo is not retrieved");
            return ret;
        }

        String requestJid = iq.getFrom().toBareJID();
        ChatRoomInfo newChatRoomInfo = getUpdateChatRoomInfo(chatRoomInfo, requestJid, 2);

        ret = newChatRoomInfo;
        return ret;
    }

    private IQ createCreateGroupChatRoomResponsePacket(IQ iq, String roomId) {
        Log.debug("do func GroupChatAdapter.createCreateGroupChatRoomResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#createCreateGroupChatRoomResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#createCreateGroupChatRoomResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#createCreateGroupChatRoomResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/createchatroom"))) {
            Log.error("GroupChatAdapter#createCreateGroupChatRoomResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        itemsElem.addAttribute("count", String.valueOf(1));
        boolean withPersonInfo = true;
        Element itemElem = getRoomInfoItemElem(roomId, withPersonInfo);
        if (itemElem == null) {
            Log.error("GroupChatAdapter#createCreateGroupChatRoomResponsePacket::itemElem is null");
            return ret;
        }
        itemsElem.add(itemElem);
        newContentElem.add(itemsElem);
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public Element getRoomInfoItemElem(String roomId, boolean withPersonInfo) {
        Log.debug("do func GroupChatAdapter.getRoomInfoItemElem(...");
        Element ret = null;
        if (roomId == null) {
            Log.error("GroupChatAdapter#getRoomInfoItemElem::roomId is null");
            return ret;
        }
        ChatRoomInfo chatRoomInfo = getChatRoomInfo(roomId);
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#getRoomInfoItemElem::chatRoomInfo is null.");
            return ret;
        }
        ret = getRoomInfoItemElem(chatRoomInfo, withPersonInfo);
        return ret;
    }

    private ChatRoomInfo getChatRoomInfo(String roomId) {
        Log.debug("do func GroupChatAdapter.getChatRoomInfo(...");
        ChatRoomInfo ret = null;
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getChatRoomInfo::roomId is invalid.");
            return ret;
        }
        ChatRoomInfo chatRoomInfo = getChatRoomInfoWithoutMemberInfo(roomId);
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#getChatRoomInfo::chatRoomInfo got from DB is null.");
            return ret;
        }
        List<String> memberList = getJoinedMemberList(roomId);
        if (memberList == null) {
            Log.error("GroupChatAdapter#getChatRoomInfo::memberList is null.");
            return ret;
        }
        int count = memberList.size();
        List<String> chatRoomMemberList = chatRoomInfo.getMemberList();
        for (int i = 0; i < count; i++) {
            String memberJid = memberList.get(i);
            if (memberJid == null || memberJid.equals("")) {
                Log.error("GroupChatAdapter#getChatRoomInfo::memberJid is invalid. No."
                        + i);
                continue;
            }
            chatRoomMemberList.add(memberJid);
        }
        ret = chatRoomInfo;
        return ret;
    }

    private ChatRoomInfo getChatRoomInfoWithoutMemberInfo(String roomId) {
        Log.debug("do func GroupChatAdapter.getChatRoomInfoWithoutMemberInfo(...");
        ChatRoomInfo ret = null;
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getChatRoomInfoWithoutMemberInfo::roomId is invalid.");
            return ret;
        }
        ChatRoomInfo chatRoomInfo = ChatRoomStoreDbHelper
                .getChatRoomInfoByRoomId(roomId);
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#getChatRoomInfoWithoutMemberInfo::chatRoomInfo got from DB is null.");
            return ret;
        }
        ret = chatRoomInfo;
        return ret;
    }

    private Element getRoomInfoItemElem(ChatRoomInfo chatRoomInfo,
            boolean withPersonInfo) {
        Log.debug("do func GroupChatAdapter.getRoomInfoItemElem(...");
        if (chatRoomInfo == null) {
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(chatRoomInfo.getId()));
        itemElem.add(idElem);

        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(chatRoomInfo.getRoomId());
        itemElem.add(roomIdElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        roomNameElem.setText(chatRoomInfo.getRoomName());
        itemElem.add(roomNameElem);

        Element parentRoomIdElem = DocumentHelper.createElement("parentroomid");
        parentRoomIdElem.setText(chatRoomInfo.getParentRoomId());
        itemElem.add(parentRoomIdElem);

        Element privacyTypeElem = DocumentHelper.createElement("privacytype");
        privacyTypeElem.setText(String.valueOf(chatRoomInfo.getPrivacyType()));
        itemElem.add(privacyTypeElem);

        Element membersElem = DocumentHelper.createElement("members");
        List<String> memberList = chatRoomInfo.getMemberList();
        membersElem.addAttribute("count", String.valueOf(memberList.size()));
        for (String memberJid : memberList) {
            if (memberJid == null) {
                continue;
            }
            Element memberElem = DocumentHelper.createElement("member");
            memberElem.setText(memberJid);
            membersElem.add(memberElem);
        }
        itemElem.add(membersElem);

        Element notifyTypeElem = DocumentHelper.createElement("notify_type");
        int notifyType = chatRoomInfo.getNotifyType();
        notifyTypeElem.setText(String.valueOf(notifyType));
        itemElem.add(notifyTypeElem);

        Element createdAtElem = DocumentHelper.createElement("created_at");
        createdAtElem.setText(chatRoomInfo.getCreatedAtStr());
        itemElem.add(createdAtElem);

        Element createdByElem = DocumentHelper.createElement("created_by");
        createdByElem.setText(chatRoomInfo.getCreatedBy());
        itemElem.add(createdByElem);

        Element updatedAtElem = DocumentHelper.createElement("updated_at");
        updatedAtElem.setText(chatRoomInfo.getUpdatedAtStr());
        itemElem.add(updatedAtElem);

        Element updatedByElem = DocumentHelper.createElement("updated_by");
        String updatedBy = chatRoomInfo.getUpdatedBy();
        updatedBy = (updatedBy == null) ? "" : updatedBy;
        updatedByElem.setText(updatedBy);
        itemElem.add(updatedByElem);

        if (withPersonInfo) {
            Set<String> jidSet = new HashSet<String>();
            jidSet.add(chatRoomInfo.getCreatedBy());
            if (!updatedBy.equals("")) {
                jidSet.add(updatedBy);
            }
            jidSet.addAll(memberList);
            Element personInfoElement = UserProfileAdapter.getInstance()
                    .createPersonInfoElement(jidSet);
            if (personInfoElement != null) {
                itemElem.add(personInfoElement);
            }
        }

        return itemElem;
    }

    public IQ getGroupChatRoomInfo(IQ iq) {
        Log.debug("do func GroupChatAdapter.getGroupChatRoomInfo(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomInfo::iq is null");
            return ret;
        }
        String roomId = getRoomIdFromGetGroupChatRoomInfoXMPP(iq);
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getGroupChatRoomInfo::roomId is invalid");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();

        if (!isRoomMember(fromJidStr, roomId)) {
            Log.error("GroupChatAdapter#getGroupChatRoomInfo::from user is not member. from="
                    + fromJidStr + " roomId=" + roomId);
            return ret;
        }

        ret = createGetGroupChatRoomInfoResponsePacket(iq, roomId);
        return ret;
    }

    private String getRoomIdFromGetGroupChatRoomInfoXMPP(IQ iq) {
        Log.debug("do func GroupChatAdapter.getRoomIdFromGetGroupChatRoomInfoXMPP(...");
        String ret = "";
        if (iq == null) {
            Log.error("GroupChatAdapter#getRoomIdFromGetGroupChatRoomInfoXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("GroupChatAdapter#getRoomIdFromGetGroupChatRoomInfoXMPP::iq type is not get");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#getRoomIdFromGetGroupChatRoomInfoXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#getRoomIdFromGetGroupChatRoomInfoXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getchatroominfo"))) {
            Log.error("GroupChatAdapter#getRoomIdFromGetGroupChatRoomInfoXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("GroupChatAdapter#getRoomIdFromGetGroupChatRoomInfoXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("GroupChatAdapter#getRoomIdFromGetGroupChatRoomInfoXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getRoomIdFromGetGroupChatRoomInfoXMPP::roomId is invalid");
            return ret;
        }
        ret = roomId;
        return ret;
    }

    private IQ createGetGroupChatRoomInfoResponsePacket(IQ iq, String roomId) {
        Log.debug("do func GroupChatAdapter.createGetGroupChatRoomInfoResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomInfoResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomInfoResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomInfoResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getchatroominfo"))) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomInfoResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        itemsElem.addAttribute("count", String.valueOf(1));
        boolean withPersonInfo = true;
        Element itemElem = getRoomInfoItemElem(roomId, withPersonInfo);
        if (itemElem == null) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomInfoResponsePacket::itemElem is null");
            return ret;
        }
        itemsElem.add(itemElem);
        newContentElem.add(itemsElem);
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public IQ getGroupChatRoomList(IQ iq) {
        Log.debug("do func GroupChatAdapter.getGroupChatRoomList(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomList::iq is null");
            return ret;
        }
        GroupChatRoomListRequest groupChatRoomListRequest = getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP(iq);
        if (groupChatRoomListRequest == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomList::groupChatRoomListRequest is null");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();
        List<ChatRoomInfo> chatRoomInfoDbList = ChatRoomStoreDbHelper
            .getChatRoomList(fromJidStr,
                             groupChatRoomListRequest.getStartId(),
                             groupChatRoomListRequest.getCount(),
                             groupChatRoomListRequest.getSortCondition(),
                             groupChatRoomListRequest.getSelectParentRoomId(),
                             groupChatRoomListRequest.getSelectPrivacyType(),
                             groupChatRoomListRequest.getSelectListType()
                             );
        if (chatRoomInfoDbList == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomList::chatRoomInfoDbList is null");
            return ret;
        }

        int count = chatRoomInfoDbList.size();
        List<ChatRoomInfo> chatRoomInfoList = new ArrayList<ChatRoomInfo>();
        for (int i = 0; i < count; i++) {
            ChatRoomInfo chatRoomInfo = chatRoomInfoDbList.get(i);
            if (chatRoomInfo == null) {
                Log.error("GroupChatAdapter#getGroupChatRoomList::chatRoomInfo is null. No."
                        + String.valueOf(i));
                continue;
            }
            List<String> memberList = getJoinedMemberList(chatRoomInfo
                    .getRoomId());
            if (memberList == null) {
                Log.error("GroupChatAdapter#getGroupChatRoomList::memberList is null.");
                return ret;
            }
            int memberCount = memberList.size();
            List<String> chatRoomMemberList = chatRoomInfo.getMemberList();
            for (int j = 0; j < memberCount; j++) {
                String memberJid = memberList.get(j);
                if (memberJid == null || memberJid.equals("")) {
                    Log.error("GroupChatAdapter#getGroupChatRoomList::memberJid is invalid. No."
                            + String.valueOf(i) + "-" + String.valueOf(j));
                    continue;
                }
                chatRoomMemberList.add(memberJid);
            }
            chatRoomInfoList.add(chatRoomInfo);
        }

        ret = createGetGroupChatRoomListResponsePacket(iq, chatRoomInfoList);
        return ret;
    }

    private GroupChatRoomListRequest getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP(
            IQ iq) {
        Log.debug("do func GroupChatAdapter.getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP(...");
        GroupChatRoomListRequest ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::iq type is not get");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getgroupchatlist"))) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::contentElem is null");
            return ret;
        }
        Element parentRoomIdElem = contentElem.element("parentroomid");
        String parentRoomId = null;
        if (!contentElem.elements("parentroomid").isEmpty()) {
            parentRoomId = parentRoomIdElem.getStringValue();
        }
        Element privacyTypeElem = contentElem.element("privacytype");
        String privacyTypeStr = null;
        if (!contentElem.elements("privacytype").isEmpty()) {
            privacyTypeStr = privacyTypeElem.getStringValue();
        }

        Element listTypeElem = contentElem.element("listtype");
        String listTypeStr = null;
        if (!contentElem.elements("listtype").isEmpty()) {
            listTypeStr = listTypeElem.getStringValue();
        }

        Element startIdElem = contentElem.element("startid");
        if (startIdElem == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::startIdElem is null");
            return ret;
        }
        String startIdStr = startIdElem.getStringValue();
        if (startIdStr == null || startIdStr.equals("")) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::startIdStr is invalid");
            return ret;
        }
        BigInteger startId = null;
        try {
            startId = new BigInteger(startIdStr);
        } catch (NumberFormatException e) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::startIdStr is not number. ("
                    + startIdStr + ")");
            return ret;
        }

        Element countElem = contentElem.element("count");
        if (countElem == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::countElem is null");
            return ret;
        }
        String countStr = countElem.getStringValue();
        if (countStr == null || countStr.equals("")) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::countStr is invalid");
            return ret;
        }
        int requestCount = 0;
        try {
            requestCount = Integer.parseInt(countStr);
        } catch (NumberFormatException e) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::countStr is not number");
            return ret;
        }

        Element conditionElem = contentElem.element("condition");
        if (conditionElem == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::conditionElem is null");
            return ret;
        }
        Element sortElem = conditionElem.element("sort");
        if (sortElem == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::sortElem is null");
            return ret;
        }
        ChatRoomSortCondition sortCondition = ChatRoomSortCondition
            .createSortConditionFromSortElement(sortElem);
        if (sortCondition == null) {
            Log.error("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::sortCondition is null");
            return ret;
        }
        ret = new GroupChatRoomListRequest();
        ret.setStartId(startId);
        ret.setCount(requestCount);
        ret.setSortCondition(sortCondition);
        if(parentRoomId != null){
            ret.setSelectParentRoomId(parentRoomId);
        }
        if(privacyTypeStr != null){
            try {
                int privacyType = Integer.parseInt(privacyTypeStr);
                ret.setSelectPrivacyType(privacyType);
            } catch (NumberFormatException e) {
                Log.info("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::privacyTypeStr is invalid");
            }
        }
        if(listTypeStr != null){
            try {
                int listType = Integer.parseInt(listTypeStr);
                ret.setSelectListType(listType);
            } catch (NumberFormatException e) {
                Log.info("GroupChatAdapter#getGroupChatRoomListRequestFromGetGroupChatRoomListXMPP::listTypeStr is invalid");
            }
        }
        return ret;
    }

    private IQ createGetGroupChatRoomListResponsePacket(IQ iq,
            List<ChatRoomInfo> chatRoomInfoList) {
        Log.debug("do func GroupChatAdapter.createGetGroupChatRoomListResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomListResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomListResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomListResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getgroupchatlist"))) {
            Log.error("GroupChatAdapter#createGetGroupChatRoomListResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int count = chatRoomInfoList.size();
        for (int i = 0; i < count; i++) {
            ChatRoomInfo chatRoomInfo = chatRoomInfoList.get(i);
            boolean withPersonInfo = false;
            Element itemElem = getRoomInfoItemElem(chatRoomInfo, withPersonInfo);
            if (itemElem == null) {
                Log.error("GroupChatAdapter#createGetGroupChatRoomListResponsePacket::itemElem is null. No."
                        + i);
                return ret;
            }
            itemsElem.add(itemElem);
        }
        itemsElem.addAttribute("count", String.valueOf(count));
        newContentElem.add(itemsElem);
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public boolean isRoomMember(String jid, String roomId) {
        Log.debug("do func GroupChatAdapter.isRoomMember(...");
        boolean ret = false;
        if (jid == null || jid.equals("")) {
            Log.error("GroupChatAdapter#isRoomMember::jid is invalid.");
            return ret;
        }
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#isRoomMember::roomId is invalid.");
            return ret;
        }
        List<String> memberList = getJoinedMemberList(roomId);
        boolean isMember = false;
        for (String memberJid : memberList) {
            if (jid.equals(memberJid)) {
                isMember = true;
                break;
            }
        }
        ret = isMember;
        return ret;
    }

    public List<String> getJoinedMemberList(String roomId) {
        Log.debug("do func GroupChatAdapter.getJoinedMemberList(...");
        List<String> ret = null;
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#roomId::roomId is invalid");
            return ret;
        }
        List<ChatRoomMember> chatRoomMemberList = ChatRoomMemberStoreDbHelper
                .getChatRoomMember(roomId);
        if (chatRoomMemberList == null) {
            Log.error("GroupChatAdapter#getJoinedMemberList::chatRoomMemberList got from DB is null.");
            return ret;
        }
        int count = chatRoomMemberList.size();
        List<String> memberList = new ArrayList<String>();
        for (int i = 0; i < count; i++) {
            ChatRoomMember chatRoomMember = chatRoomMemberList.get(i);
            if (chatRoomMember == null) {
                Log.error("GroupChatAdapter#getRoomInfoItemElem::chatRoomMember is null. No."
                        + i);
                continue;
            }
            int state = chatRoomMember.getState();
            if (state == ChatRoomMember.STATE_JOIN) {
                String memberJid = chatRoomMember.getJid();
                if (memberJid == null || memberJid.equals("")) {
                    Log.error("GroupChatAdapter#getRoomInfoItemElem::memberJid is invalid. No."
                            + i);
                    continue;
                }
                memberList.add(memberJid);
            }
        }
        ret = memberList;
        return ret;
    }

    public ChatRoomMember getRemovedChatRoomMember(String jid, String roomId) {
        Log.debug("do func GroupChatAdapter.getRemovedChatRoomMember(...");
        ChatRoomMember ret = null;

        if (jid == null || "".equals(jid)) {
            Log.error("GroupChatAdapter#getRemovedChatRoomMember jid::jid is invalid");
            return ret;
        }
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getRemovedChatRoomMember roomId::roomId is invalid");
            return ret;
        }
        ChatRoomMember chatRoomMember = ChatRoomMemberStoreDbHelper
                .getChatRoomMember(roomId, jid);
        if (chatRoomMember == null) {
            Log.debug("GroupChatAdapter#getRemovedChatRoomMember::chatRoomMember got from DB is null.");
            return ret;
        }

        int state = chatRoomMember.getState();
        if (state == ChatRoomMember.STATE_LEAVE
                || state == ChatRoomMember.STATE_FORCE_LEAVE) {
            ret = chatRoomMember;
        }

        return ret;
    }

    private String saveGroupChatMessage(Element contentElem, String fromJid,
            String roomId) {
        Log.debug("do func GroupChatAdapter.saveGroupChatMessage(...");
        String ret = "";
        if (contentElem == null) {
            Log.error("GroupChatAdapter#saveGroupChatMessage::contentElem is null");
            return ret;
        }
        if (fromJid == null || fromJid.equals("")) {
            Log.error("GroupChatAdapter#saveGroupChatMessage::fromJid is invalid");
            return "";
        }
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#saveGroupChatMessage::roomId is invalid");
            return "";
        }
        Attribute typeAttr = contentElem.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.GroupChat.equals(ContentType
                .toType(type))) {
            Log.error("GroupChatAdapter#saveGroupChatMessage::type is not 'GroupChat'");
            return ret;
        }

        Element entryElem = contentElem.element("entry");
        if (entryElem == null) {
            Log.error("GroupChatAdapter#saveGroupChatMessage::entryElem is null");
            return "";
        }

        Element attachedItemsElem = contentElem.element("attached_items");
        if (attachedItemsElem == null) {
            Log.debug("GroupChatAdapter#saveGroupChatMessage::attachedItemsElem is null");
            attachedItemsElem = DocumentHelper.createElement("attached_items");
            attachedItemsElem.addAttribute("count", String.valueOf(0));
        }

        Element replyIdElem = contentElem.element("reply_id");

        Element replyToElem = contentElem.element("reply_to");

        Element bodyType = contentElem.element("body_type");

        Element threadTitle = contentElem.element("thread_title");

        Element quotationItemId = contentElem.element("quotation_item_id");

        Element contextElem = contentElem.element("context");

        Message groupChatMessage = new Message();

        groupChatMessage.setMsgType(Message.TYPE_GROUP_CAHT);

        groupChatMessage.setMsgFrom(fromJid);

        groupChatMessage.setMsgTo(roomId);

        Element tmpEntry = entryElem.createCopy();
        tmpEntry.add(attachedItemsElem.createCopy());
        String entryData = tmpEntry.asXML();
        if (entryData == null || entryData.equals("")) {
            Log.error("GroupChatAdapter#saveGroupChatMessage::entryData is invalid");
            return ret;
        }
        groupChatMessage.setEntry(entryData);

        Calendar now = Calendar.getInstance();
        Timestamp timeStamp = new Timestamp(now.getTimeInMillis());
        groupChatMessage.setCreatedAt(timeStamp);

        String replyItemId = "";
        if (replyIdElem != null) {
            replyItemId = replyIdElem.getStringValue();
        }
        groupChatMessage.setReplyId(replyItemId);

        String replyTo = "";
        if (replyToElem != null) {
            replyTo = replyToElem.getStringValue();
        }
        groupChatMessage.setReplyTo(replyTo);

        int bodyTypeInt = 0;
        if (bodyType != null) {
            try{
                bodyTypeInt = Integer.parseInt(bodyType.getStringValue());
            } catch (NumberFormatException e) {
                Log.warn("body_type is not Number.");
            }
        }
        groupChatMessage.setBodyType(bodyTypeInt);

        String threadTitleStr = "";
        if (threadTitle != null) {
            threadTitleStr = threadTitle.getStringValue();
        }
        groupChatMessage.setThreadTitle(threadTitleStr);

        String quotationItemIdStr = "";
        if(quotationItemId != null){
            quotationItemIdStr = quotationItemId.getStringValue();
        }
        groupChatMessage.setQuotationItemId(quotationItemIdStr);

        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateGrounpChatMessageItemId) {
            lockObject = mLockObjectMapStringToObjectForGenerateGrounpChatMessageItemId
                    .get(fromJid);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateGrounpChatMessageItemId
                        .put(fromJid, lockObject);
            }
        }
        String itemId = null;
        synchronized (lockObject) {
            int nextGroupChatMessageItemIdNumber = GroupChatMessageDbHelper
                    .getNextGroupChatMessageIdNumber(fromJid);
            if (nextGroupChatMessageItemIdNumber <= 0) {
                Log.error("GroupChatAdapter#saveGroupChatMessage::nextGroupChatMessageItemIdNumber is invalid");
                return ret;
            }
            String groupChatMessageItemIdPrefix = GroupChatMessageDbHelper
                    .getGroupChatMessageItemIdPrefix(fromJid);

            if (groupChatMessageItemIdPrefix == null
                    || groupChatMessageItemIdPrefix.equals("")) {
                Log.error("GroupChatAdapter#saveGroupChatMessage::groupChatMessageItemIdPrefix is invalid");
                return ret;
            }
            itemId = groupChatMessageItemIdPrefix
                    + nextGroupChatMessageItemIdNumber;

            groupChatMessage.setItemId(itemId);

            if (!MessageStoreDbHelper.insertMessageToDb(groupChatMessage)) {
                Log.error("GroupChatAdapter#saveGroupChatMessage::faild to insert GroupChat Message");
                return ret;
            }
        }
        ret = itemId;

        Message savedGroupChatMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().setInitialData(
                savedGroupChatMessage);

        return ret;
    }

    public Element getGroupChatMessageItemElement(Message groupChatMessage) {
        Log.debug("do func GroupChatAdapter.getGroupChatMessageItemElement(...");
        Element ret = null;
        if (groupChatMessage == null) {
            Log.error("GroupChatAdapter#getGroupChatMessageItemElem::groupChatMessage is null");
            return ret;
        }
        if (Message.TYPE_GROUP_CAHT != groupChatMessage.getMsgType()) {
            Log.error("GroupChatAdapter#getGroupChatMessageItemElem::message type is not Group Chat");
            return ret;
        }
        Set<String> jidSet = new HashSet<String>();
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(groupChatMessage.getId()));
        itemElem.add(idElem);

        Element itemIdElem = DocumentHelper.createElement("item_id");
        itemIdElem.setText(groupChatMessage.getItemId());
        itemElem.add(itemIdElem);

        Element messageTypeElem = DocumentHelper.createElement("msgtype");
        messageTypeElem.setText(String.valueOf(groupChatMessage.getMsgType()));
        itemElem.add(messageTypeElem);

        Element messageFromElem = DocumentHelper.createElement("msgfrom");
        String fromJid = groupChatMessage.getMsgFrom();
        messageFromElem.setText(fromJid);
        itemElem.add(messageFromElem);
        jidSet.add(fromJid);

        Element messageToElem = DocumentHelper.createElement("msgto");
        String roomId = groupChatMessage.getMsgTo();
        messageToElem.setText(roomId);
        itemElem.add(messageToElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        ChatRoomInfo roomInfo = getChatRoomInfoWithoutMemberInfo(roomId);
        if (roomInfo == null) {
            Log.error("GroupChatAdapter#getGroupChatMessageItemElem::roomInfo is null");
            return ret;
        }
        roomNameElem.setText(roomInfo.getRoomName());
        itemElem.add(roomNameElem);

        Element parentRoomIdElem = DocumentHelper.createElement("parentroomid");
        parentRoomIdElem.setText(roomInfo.getParentRoomId());
        itemElem.add(parentRoomIdElem);

        Element privacyTypeElem = DocumentHelper.createElement("privacytype");
        privacyTypeElem.setText(String.valueOf(roomInfo.getPrivacyType()));
        itemElem.add(privacyTypeElem);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entryElem;
        String entryStr = groupChatMessage.getEntry();
        boolean isCreateAttachedItemsElem = true;
        if (entryStr == null || entryStr.equals("")) {
            entryElem = DocumentHelper.createElement("entry");
        } else {
            try {
                Document doc = xmlReader.read(new StringReader(entryStr));
                entryElem = doc.getRootElement();
            } catch (DocumentException e) {
                Log.error("entry data is not XML");
                entryElem = DocumentHelper.createElement("entry");
            }
        }
        Element attachedItemsElem = null;
        if (groupChatMessage.getDeleteFlag() == 2) {
            String deletedBy = groupChatMessage.getDeletedBy();
            if (MessageAdapter.isDeletedByAdmin(deletedBy)) {
                entryElem.element("body").setText(Message.BODY_DELETED_ADMIN);
            } else {
                entryElem.element("body").setText(Message.BODY_DELETED_SELF);
            };
            attachedItemsElem = DocumentHelper.createElement("attached_items");
            attachedItemsElem.addAttribute("count", String.valueOf(0));
        } else {
            attachedItemsElem = entryElem.element("attached_items");
            if (attachedItemsElem == null) {
                attachedItemsElem = DocumentHelper
                        .createElement("attached_items");
                attachedItemsElem.addAttribute("count", String.valueOf(0));
            } else {
                isCreateAttachedItemsElem = false;
            }
        }
        itemElem.add(attachedItemsElem.createCopy());
        if (!isCreateAttachedItemsElem) {
            entryElem.remove(attachedItemsElem);
        }
        itemElem.add(entryElem);

        Element createdAtElem = DocumentHelper.createElement("created_at");
        createdAtElem.setText(groupChatMessage.getCreatedAtStr());
        itemElem.add(createdAtElem);

        Element updatedAt = DocumentHelper.createElement("updated_at");
        updatedAt.setText(groupChatMessage.getUpdatedAtStr());
        itemElem.add(updatedAt);

        Element replyIdElem = DocumentHelper.createElement("reply_id");
        String replyIdStr = groupChatMessage.getReplyId();
        replyIdElem.setText((replyIdStr == null) ? "" : replyIdStr);
        itemElem.add(replyIdElem);

        Element replyToElem = DocumentHelper.createElement("reply_to");
        String replyToStr = groupChatMessage.getReplyTo();
        replyToElem.setText((replyToStr == null) ? "" : replyToStr);
        itemElem.add(replyToElem);

        Element bodyType = DocumentHelper.createElement("body_type");
        bodyType.setText(String.valueOf(groupChatMessage.getBodyType()));
        itemElem.add(bodyType);

        Element threadTitle = DocumentHelper.createElement("thread_title");
        String threadTitleStr = groupChatMessage.getThreadTitle();
        threadTitle.setText((threadTitleStr == null) ? "" : threadTitleStr);
        itemElem.add(threadTitle);

        Element threadRootId = DocumentHelper.createElement("thread_root_id");
        String threadRootIdStr = groupChatMessage.getThreadRootId();
        threadRootId.setText((threadRootIdStr == null) ? "" : threadRootIdStr);
        itemElem.add(threadRootId);

        Element quotation = QuotationMessageAdapter.getInstance().createElement(groupChatMessage);
        itemElem.add(quotation);

        Element emotionPoint = EmotionPointAdapter.getInstance().getEmotionPointElement(groupChatMessage.getEmotionPointList());
        itemElem.add(emotionPoint);

        Element emotionPointIconJsonElm = DocumentHelper.createElement("emotion_point_icon");
        String emotionPointIconJson = groupChatMessage.getEmotionPointIconJson();
        emotionPointIconJsonElm.setText((emotionPointIconJson == null) ? "{}" :  emotionPointIconJson);
        itemElem.add(emotionPointIconJsonElm);

        List<GoodJob> goodJobList = groupChatMessage.getGoodJobList();
        Element goodJobElem = GoodJobAdapter.getInstance().getGoodJobElement(
                goodJobList);
        itemElem.add(goodJobElem);

        Note note = groupChatMessage.getNote();
        Element noteElm = NoteAdapter.getInstance().getNoteElement(note);
        itemElem.add(noteElm);

        Element contextElem = DocumentHelper.createElement("context");
        itemElem.add(contextElem);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(groupChatMessage.getDeleteFlag()));
        itemElem.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            itemElem.add(personInfoElement);
        }

        return itemElem;
    }

    public IQ addGroupChatMember(IQ iq) {
        Log.debug("do func GroupChatAdapter.addGroupChatMember(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#addGroupChatMember::iq is null");
            return ret;
        }
        AddGroupChatMemberRequest addGroupChatMemberRequest = getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP(iq);
        if (addGroupChatMemberRequest == null) {
            Log.error("GroupChatAdapter#addGroupChatMember::addGroupChatMemberRequest is null");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();

        String roomId = addGroupChatMemberRequest.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#addGroupChatMember::roomId is invalid");
            return ret;
        }
        if (!isRoomMember(fromJidStr, roomId)) {
            Log.error("GroupChatAdapter#addGroupChatMember::request user is not room member. request user="
                    + fromJidStr + ", room id=" + roomId);
            return ret;
        }

        String addMemberJid = addGroupChatMemberRequest.getMemberJid();
        if (addMemberJid == null || addMemberJid.equals("")) {
            Log.error("GroupChatAdapter#addGroupChatMember::addMemberJid is invalid");
            return ret;
        }
        if (isRoomMember(addMemberJid, roomId)) {
            Log.error("GroupChatAdapter#addGroupChatMember::adding member is already added. adding member="
                    + addMemberJid + ", room id=" + roomId);
            return ret;
        }

        ChatRoomMember oldMember = getRemovedChatRoomMember(addMemberJid,
                roomId);
        if (oldMember != null) {
            oldMember.setState(ChatRoomMember.STATE_JOIN);
            Calendar now = Calendar.getInstance();
            oldMember.setJoinDate(new Timestamp(now.getTimeInMillis()));
            oldMember.setJoinJid(fromJidStr);
            List<ChatRoomMember> updateMemberList = new ArrayList<ChatRoomMember>();
            updateMemberList.add(oldMember);
            Map<String, Boolean> resultMap = new HashMap<String, Boolean>();
            resultMap.put(oldMember.getJid(), false);
            if (!ChatRoomMemberStoreDbHelper.updateGroupChatMemberToDb(
                    updateMemberList, resultMap)) {
                Log.error("GroupChatAdapter#addGroupChatMember::failed to update ChatRoomMember To Db");
                return ret;
            }
        } else {
            ChatRoomMember chatRoomMember = new ChatRoomMember();
            chatRoomMember.setRoomId(roomId);
            chatRoomMember.setJid(addMemberJid);
            chatRoomMember.setState(ChatRoomMember.STATE_JOIN);
            Calendar now = Calendar.getInstance();
            chatRoomMember.setJoinDate(new Timestamp(now.getTimeInMillis()));
            if (!ChatRoomMemberStoreDbHelper.insertChatRoomMemberToDb(
                    chatRoomMember, fromJidStr)) {
                Log.error("GroupChatAdapter#addGroupChatMember::failed to insert ChatRoomMember To Db");
                return ret;
            }
        }

        ChatRoomStoreDbHelper.updateLastUpdateDate(roomId, fromJidStr);

        GroupChatNotifier.getInstance().sendAddGroupChatMemberNotification(
                roomId, addMemberJid, fromJidStr);

        GroupChatNotifier.getInstance().sendCreateGroupChatRoomNotification(
                roomId, addMemberJid);

        ret = createAddGroupChatMemberResponsePacket(iq, roomId, addMemberJid,
                fromJidStr);
        return ret;
    }

    private AddGroupChatMemberRequest getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP(
            IQ iq) {
        Log.debug("do func GroupChatAdapter.getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP(...");
        AddGroupChatMemberRequest ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/addchatroommember"))) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::roomIdElem is null");
            return ret;
        }
        String roomIdStr = roomIdElem.getStringValue();
        if (roomIdStr == null || roomIdStr.equals("")) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::roomIdStr is invalid");
            return ret;
        }
        Element memberElem = contentElem.element("member");
        if (memberElem == null) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::countElem is null");
            return ret;
        }
        String memberStr = memberElem.getStringValue();
        if (memberStr == null || memberStr.equals("")) {
            Log.error("GroupChatAdapter#getAddGroupChatMemberRequestFromAddGroupChatMemberXMPP::countStr is invalid");
            return ret;
        }
        ret = new AddGroupChatMemberRequest();
        ret.setRoomId(roomIdStr);
        ret.setMemberJid(memberStr);

        return ret;
    }

    private IQ createAddGroupChatMemberResponsePacket(IQ iq, String roomId,
            String addMemberJid, String addedByJid) {
        Log.debug("do func GroupChatAdapter.createAddGroupChatMemberResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#createAddGroupChatMemberResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#createAddGroupChatMemberResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#createAddGroupChatMemberResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/addchatroommember"))) {
            Log.error("GroupChatAdapter#createAddGroupChatMemberResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        Element itemElem = getAddChatRoomMemberItemElem(roomId, addMemberJid,
                addedByJid);
        if (itemElem == null) {
            Log.error("GroupChatAdapter#createAddGroupChatMemberResponsePacket::itemElem is null");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(1));
        newContentElem.add(itemsElem);
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public Element getAddChatRoomMemberItemElem(String roomId,
            String addMemberJid, String addedByJid) {
        Log.debug("do func GroupChatAdapter.getAddChatRoomMemberItemElem(...");
        Element ret = null;
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getAddChatRoomMemberItemElem::roomId is invalid");
            return ret;
        }
        if (addMemberJid == null || addMemberJid.equals("")) {
            Log.error("GroupChatAdapter#getAddChatRoomMemberItemElem::addMemberJid is invalid");
            return ret;
        }
        if (addedByJid == null || addedByJid.equals("")) {
            Log.error("GroupChatAdapter#getAddChatRoomMemberItemElem::addedByJid is invalid");
            return ret;
        }
        ChatRoomInfo chatRoomInfo = getChatRoomInfoWithoutMemberInfo(roomId);
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#getAddChatRoomMemberItemElem::chatRoomInfo got from DB is null.");
            return ret;
        }
        Set<String> jidSet = new HashSet<String>();
        Element itemElem = DocumentHelper.createElement("item");
        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(chatRoomInfo.getRoomId());
        itemElem.add(roomIdElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        roomNameElem.setText(chatRoomInfo.getRoomName());
        itemElem.add(roomNameElem);

        Element parentRoomIdElem = DocumentHelper.createElement("parentroomid");
        parentRoomIdElem.setText(chatRoomInfo.getParentRoomId());
        itemElem.add(parentRoomIdElem);

        Element privacyTypeElem = DocumentHelper.createElement("privacytype");
        privacyTypeElem.setText(String.valueOf(chatRoomInfo.getPrivacyType()));
        itemElem.add(privacyTypeElem);

        Element addedByElem = DocumentHelper.createElement("added_by");
        addedByElem.setText(addedByJid);
        itemElem.add(addedByElem);
        jidSet.add(addedByJid);

        Element membersElem = DocumentHelper.createElement("members");
        Element memberElem = DocumentHelper.createElement("member");
        memberElem.setText(addMemberJid);
        membersElem.add(memberElem);
        jidSet.add(addMemberJid);

        membersElem.addAttribute("count", String.valueOf(1));
        itemElem.add(membersElem);

        Element notifyTypeElem = DocumentHelper.createElement("notify_type");
        int notifyType = chatRoomInfo.getNotifyType();
        notifyTypeElem.setText(String.valueOf(notifyType));
        itemElem.add(notifyTypeElem);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            itemElem.add(personInfoElement);
        }

        ret = itemElem;
        return ret;
    }

    private class GroupChatRoomListRequest {
        private BigInteger mStartId;
        private int mCount;
        private ChatRoomSortCondition mSortCondition;
        private String mSelectParentRoomId;
        private int mPrivacyType;
        private int mListType;

        public GroupChatRoomListRequest() {
            Log.debug("do func GroupChatAdapter.GroupChatRoomListRequest(...");
            mStartId = BigInteger.ZERO;
            mCount = 0;
            mSortCondition = null;
            mSelectParentRoomId = null;
            mPrivacyType = -1;
            mListType = -1;
        }

        public BigInteger getStartId() {
            return mStartId;
        }

        public void setStartId(BigInteger startId) {
            mStartId = startId;
        }

        public int getCount() {
            return mCount;
        }

        public void setCount(int count) {
            mCount = count;
        }

        public ChatRoomSortCondition getSortCondition() {
            return mSortCondition;
        }

        public void setSortCondition(ChatRoomSortCondition sortCondition) {
            mSortCondition = sortCondition;
        }

        public String getSelectParentRoomId() {
            return mSelectParentRoomId;
        }

        public void setSelectParentRoomId(String selectParentRoomId) {
            mSelectParentRoomId = selectParentRoomId;
        }

        public int getSelectPrivacyType() {
            return mPrivacyType;
        }

        public void setSelectPrivacyType(int selectPrivacyType) {
            mPrivacyType = selectPrivacyType;
        }
        public int getSelectListType() {
            return mListType;
        }

        public void setSelectListType(int selectListType) {
            mListType = selectListType;
        }
    }

    private class AddGroupChatMemberRequest {
        private String mRoomId;
        private String mMemberJid;

        public String getRoomId() {
            return mRoomId;
        }

        public void setRoomId(String roomId) {
            mRoomId = roomId;
        }

        public String getMemberJid() {
            return mMemberJid;
        }

        public void setMemberJid(String memberJid) {
            mMemberJid = memberJid;
        }
    }

    public IQ receiveGroupChatMessage(IQ iq) {
        Log.debug("do func GroupChatAdapter.receiveGroupChatMessage(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#receiveGroupChat::iq is null");
            return ret;
        }
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("GroupChatAdapter#receiveGroupChat::not type set");
            return ret;
        }

        Element message = iq.getChildElement();
        if (message == null) {
            Log.error("GroupChatAdapter#receiveGroupChat::not message");
            return ret;
        }
        Element content = message.element("content");
        if (content == null) {
            Log.error("GroupChatAdapter#receiveGroupChat::not content");
            return ret;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.GroupChat.equals(ContentType
                .toType(type))) {
            Log.error("GroupChatAdapter#receiveGroupChat::not type Group Chat");
            return ret;
        }
        String fromJid = iq.getFrom().toBareJID();
        Element msgtoElem = content.element("msgto");
        if (msgtoElem == null) {
            Log.error("GroupChatAdapter#receiveGroupChat::msgtoElem is null");
            return ret;
        }
        String roomId = msgtoElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#receiveGroupChat::roomId is invalid");
            return ret;
        }
        if (!isRoomMember(fromJid, roomId)) {
            Log.error("GroupChatAdapter#receiveGroupChat::from user is not member. from="
                    + fromJid + " roomId=" + roomId);
            return ret;
        }

        String itemId = saveGroupChatMessage(content, fromJid, roomId);
        if (itemId == null || itemId.equals("")) {
            Log.error("GroupChatAdapter#receiveGroupChat::Fail: save Group Chat message");
            return ret;
        }

        Message savedGroupChatMessage = MessageAdapter.getInstance()
                .getMessageAppendReadInfo(itemId, fromJid);

        if (savedGroupChatMessage == null) {
            Log.error("GroupChatAdapter#receiveGroupChatMessage::savedGroupChageMessage is null");
            return ret;
        }

        ret = createSendGroupChatResponsePacket(iq, savedGroupChatMessage);

        GroupChatNotifier.getInstance().notifyGroupChatMessage(itemId);

        ChatRoomStoreDbHelper.updateLastUpdateDate(roomId, fromJid);

        return ret;

    }

    public IQ receiveUpdateGroupChatMessageBody(IQ iq) {
        Log.debug("do func GroupChatAdapter.receiveUpdateGroupChatMessageBody(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::iq is null");
            return ret;
        }
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::not type set");
            return ret;
        }

        Element message = iq.getChildElement();
        if (message == null) {
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::not message");
            return ret;
        }
        Element content = message.element("content");
        if (content == null) {
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::not content");
            return ret;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.GroupChat.equals(ContentType
                .toType(type))) {
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::not type Group Chat");
            return ret;
        }
        Element roomIdElem = content.element("room_id");
        if(roomIdElem == null ||
           roomIdElem.getStringValue() == null ||
           roomIdElem.getStringValue().equals("")) {
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::roomId is invalid");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        Element bodyElm = content.element("body");
        if(bodyElm == null ||
           bodyElm.getStringValue() == null){
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::bodyElm is invalid");
            return createUpdateMessageGroupChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }

        Element itemIdElm = content.element("item_id");
        if(itemIdElm == null ||
           itemIdElm.getStringValue() == null){
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::itemIdElm is invalid");
            return createUpdateMessageGroupChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String itemId = itemIdElm.getStringValue();
        String fromJid = iq.getFrom().toBareJID();
        if (!isRoomMember(fromJid, roomId)) {
            Log.error("GroupChatAdapter#receiveUpdateGroupChatMessageBody::from user is not member. from="
                    + fromJid + " roomId=" + roomId);
            return createUpdateMessageGroupChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }

        Element entryElm = DocumentHelper.createElement("entry");
        entryElm.addNamespace("","http://necst.nec.co.jp/protocol/updatemessagebody");
        entryElm.add(DocumentHelper.createElement("body").addText(bodyElm.getStringValue()));
        entryElm.add(DocumentHelper.createElement("attached_items").addAttribute("count","0"));
        Log.debug("GroupChatAdapter.receiveUpdateGroupChatMessageBody MessageStoreDbHelper.updateMessageBodyToDb entryXML:" + entryElm.asXML());


        if(!MessageStoreDbHelper.updateMessageBodyToDb(3,
                                                       itemId,
                                                       entryElm.asXML(),
                                                       fromJid,
                                                       roomId)){
            Log.error("GroupChatAdapter.receiveUpdateGroupChatMessageBody MessageStoreDbHelper.updateMessageBodyToDb error");
            return createUpdateMessageGroupChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR);
        }

        Message savedMessage = MessageStoreDbHelper
            .getOneMessageByItemIdWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().resetInitialData(savedMessage);


        if (savedMessage == null) {
            Log.error("GroupChatAdapter.receiveUpdateGroupChatMessageBody savedMessage is null");
            return createUpdateMessageGroupChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR);
        }

        GroupChatNotifier.getInstance().notifyUpdateGroupChatMessageBody(itemId);

        ChatRoomStoreDbHelper.updateLastUpdateDate(roomId, fromJid);

        return createUpdateMessageGroupChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_SUCCESS);

    }

    private IQ createSendGroupChatResponsePacket(IQ iq,
            Message savedGroupChatMessage) {
        Log.debug("do func GroupChatAdapter.createSendGroupChatResponsePacket(...");

        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#createSendGroupChatResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("GroupChatAdapter#createSendGroupChatResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("GroupChatAdapter#createSendGroupChatResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(SEND_MESSAGE_NAMESPACE))) {
            Log.error("GroupChatAdapter#createSendGroupChatResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }

        Element newContentElem = createSendGroupChatResponseContentElem(savedGroupChatMessage);
        if (newContentElem == null) {
            Log.info("GroupChatAdapter#createSendGroupChatResponsePacket::newContentElem is null.");
            return ret;
        }
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        ret = replyPacket;

        return ret;
    }

    private IQ createUpdateMessageGroupChatResponsePacket
        (IQ iq, int resultCode) {
        Log.debug("do func GroupChatAdapter.createUpdateMessageGroupChatResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter.createUpdateMessageGroupChatResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("GroupChatAdapter.createUpdateMessageGroupChatResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("GroupChatAdapter.createUpdateMessageGroupChatResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(UPDATE_MESSAGE_BODY_NAMESPACE))) {
            Log.error("GroupChatAdapter.createUpdateMessageGroupChatResponsePacket::namespace is invalid");
            return ret;
        }

        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("MessageAdapter#createThreadTitleResponsePacket::from jid is null");
            return ret;
        }
        String fromJidStr = fromJid.toBareJID();
        if (fromJidStr == null || fromJidStr.equals("")) {
            Log.error("MessageAdapter#createThreadTitleResponsePacket::from jid string is invalid");
            return ret;
        }

        IQ replyPacket = IQ.createResultIQ(iq);
        messageElem.setParent(null);
        if(resultCode ==  GlobalSNSUtils.API_STATUS_SUCCESS){
            replyPacket.setType(IQ.Type.result);
            messageElem.addAttribute("code",String.valueOf(resultCode));
            replyPacket.setChildElement(messageElem);
        }else{
            replyPacket.setType(IQ.Type.error);
            Element errorElm = DocumentHelper.createElement("error");
            errorElm.addAttribute("code",String.valueOf(resultCode));
            replyPacket.setChildElement(errorElm);
        }
        ret = replyPacket;

        return ret;
    }

    private Element createSendGroupChatResponseContentElem(
            Message savedGroupChatMessage) {
        Log.debug("do func GroupChatAdapter.createSendGroupChatResponseContentElem(...");

        Element ret = null;
        if (savedGroupChatMessage == null) {
            Log.error("GroupChatAdapter#createSendGroupChatResponseContentElem::savedGroupChatMessage is null");
            return ret;
        }
        Element contentElem = DocumentHelper.createElement("content");
        contentElem.addAttribute("type",
                IQMessageSendHandler.ContentType.GroupChat.toString());
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = MessageAdapter.getInstance().getMessageItemElement(
                savedGroupChatMessage);
        if (itemElem == null) {
            Log.info("GroupChatAdapter#createSendGroupChatResponseContentElem::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        contentElem.add(itemsElem);

        ret = contentElem;

        return ret;
    }

    private class RemoveGroupChatMemberRequest {
        private String mRoomId;
        private List<String> mMemberJid;
        private String mRemoveType;

        public String getRoomId() {
            return mRoomId;
        }

        public void setRoomId(String roomId) {
            mRoomId = roomId;
        }

        public List<String> getMemberJid() {
            return mMemberJid;
        }

        public void setMemberJid(List<String> memberJid) {
            mMemberJid = memberJid;
        }

        public String getRemoveType() {
            return mRemoveType;
        }

        public void setRemoveType(String removeType) {
            mRemoveType = removeType;
        }
    }

    public IQ removeGroupChatMember(IQ iq) {
        Log.debug("do func GroupChatAdapter.removeGroupChatMember(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#removeGroupChatMember::iq is null");
            return ret;
        }

        RemoveGroupChatMemberRequest removeMemberData = getRemoveMemberDataFromRemoveGroupChatMemberXMPP(
                iq, REMOVE_GROUP_CHAT_MEMBER_NAMESPACE);
        if (removeMemberData == null) {
            Log.error("GroupChatAdapter#removeGroupChatMember::removeMemberData is null");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        String removeType = removeMemberData.getRemoveType();
        String roomId = removeMemberData.getRoomId();
        List<String> removeMemberJidList = removeMemberData.getMemberJid();

        ConcurrentHashMap<String, Boolean> resultMap = new ConcurrentHashMap<String, Boolean>();
        for (String memberJid : removeMemberJidList) {
            resultMap.put(memberJid, false);
        }

        if (!isRoomMember(requestJid, roomId)) {
            Log.error("GroupChatAdapter#removeGroupChatMember::request user is not room member. request user="
                    + requestJid + ", room id=" + roomId);
            return ret;
        }
        if ("own".equals(removeType)) {
            if (removeMemberJidList.size() != 1
                    || !requestJid.equals(removeMemberJidList.get(0))) {
                Log.error("GroupChatAdapter#removeGroupChatMember::parameter invalid(request user is not a member of deleted, but removeType is 'own'");
                return ret;
            }
        } else if ("member".equals(removeType)) {
            for (int i = 0; i < removeMemberJidList.size(); i++) {
                if (requestJid.equals(removeMemberJidList.get(i))) {
                    Log.error("GroupChatAdapter#removeGroupChatMember::parameter invalid(request user included deleted member, but removeType is 'member'");
                    return ret;
                }
            }
        }

        ConcurrentHashMap<String, ChatRoomMember> mHash = new ConcurrentHashMap<String, ChatRoomMember>();
        List<ChatRoomMember> memberList = ChatRoomMemberStoreDbHelper
                .getChatRoomMember(roomId);
        if (memberList == null) {
            Log.error("GroupChatAdapter#removeGroupChatMember::roomMemberList is null.");
            return ret;
        }
        for (ChatRoomMember member : memberList) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            mHash.put(memberJid, member);
        }

        List<ChatRoomMember> canRemoveMemberList = new ArrayList<ChatRoomMember>();
        for (String removeJid : removeMemberJidList) {
            if (removeJid == null || removeJid.equals("")) {
                continue;
            }
            ChatRoomMember member = mHash.get(removeJid);
            if (member != null
                    && member.getState() == ChatRoomMember.STATE_JOIN
                    && GlobalSNSUtils.isExistUser(new JID(removeJid))) {
                if ("own".equals(removeType)) {
                    member.setState(ChatRoomMember.STATE_LEAVE);
                } else {
                    member.setState(ChatRoomMember.STATE_FORCE_LEAVE);
                }
                member.setLeaveJid(requestJid);
                member.setLeaveDate(new Timestamp(Calendar.getInstance()
                        .getTimeInMillis()));
                canRemoveMemberList.add(member);
            }
        }
        ChatRoomInfo chatRoomInfo = ChatRoomStoreDbHelper
                .getChatRoomInfoByRoomId(roomId);

        if (!ChatRoomMemberStoreDbHelper.updateGroupChatMemberToDb(
                canRemoveMemberList, resultMap)) {
            Log.error("GroupChatAdapter#removeGroupChatMember::failed to updateGroupChatMemberToDb");
            return ret;
        }
        if (resultMap.size() <= 0) {
            Log.warn("GroupChatAdapter#removeGroupChatMember::removedMemberList size is 0");
            return ret;
        }
        ret = createRemoveGroupChatMemberResponsePacket(iq, chatRoomInfo,
                resultMap, removeType);

        List<String> chatRoomMember = getJoinedMemberList(roomId);
        if (chatRoomMember.size() <= 0) {
            ChatRoomInfo newChatRoomInfo = getUpdateChatRoomInfo(chatRoomInfo,
                    requestJid, 1);
            ChatRoomStoreDbHelper.updateRoomInfo(newChatRoomInfo);
        } else {
            ChatRoomStoreDbHelper.updateLastUpdateDate(roomId, requestJid);
        }

        GroupChatNotifier.getInstance()
                .sendRemoveGroupChatMemberNotification(requestJid,
                        chatRoomInfo, chatRoomMember, resultMap, removeType);

        return ret;
    }

    private RemoveGroupChatMemberRequest getRemoveMemberDataFromRemoveGroupChatMemberXMPP(
            IQ iq, String namespace) {
        Log.debug("do func GroupChatAdapter.getRemoveMemberDataFromRemoveGroupChatMemberXMPP(...");
        RemoveGroupChatMemberRequest ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::iq is null");
            return ret;
        }
        if (namespace == null || namespace.equals("")) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::namespace is invalid");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::tagName is invalid");
            return ret;
        }
        String tagNamespace = groupElem.getNamespaceURI();
        if (tagNamespace == null || !(tagNamespace.equals(namespace))) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::roomId is invalid");
            return ret;
        }
        Element removeTypeElem = contentElem.element("removetype");
        if (removeTypeElem == null) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::removeTypeElem is null");
            return ret;
        }
        String removeType = removeTypeElem.getStringValue();
        if (removeType == null || removeType.equals("")) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::removeType is invalid");
            return ret;
        }
        Element membersElem = contentElem.element("members");
        if (membersElem == null) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::membersElem is null");
            return ret;
        }
        @SuppressWarnings("unchecked")
        List<Element> memberElementList = membersElem.elements();
        if (memberElementList == null) {
            Log.error("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::memberElementList is null");
            return ret;
        }
        List<String> memberJidList = new ArrayList<String>();
        for (Element memberElem : memberElementList) {
            if (memberElem == null) {
                Log.warn("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::memberElem is null");
                continue;
            }
            String memberElemTagName = memberElem.getName();
            if (memberElemTagName == null
                    || !(memberElemTagName.toLowerCase().equals("member"))) {
                Log.info("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::memberElemTagName is not \"member\".");
                continue;
            }
            String memberJid = memberElem.getStringValue();
            if (memberJid == null || memberJid.equals("")) {
                Log.info("GroupChatAdapter#getRemoveMemberDataFromRemoveGroupChatMemberXMPP::memberJid is invalid");
                continue;
            }
            memberJidList.add(memberJid);
        }
        ret = new RemoveGroupChatMemberRequest();
        ret.setRoomId(roomId);
        ret.setRemoveType(removeType);
        ret.setMemberJid(memberJidList);

        return ret;
    }

    private IQ createRemoveGroupChatMemberResponsePacket(IQ iq,
            ChatRoomInfo chatRoomInfo, Map<String, Boolean> resultMemberList,
            String removeType) {
        Log.debug("do func GroupChatAdapter.createRemoveGroupChatMemberResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("GroupChatAdapter#createRemoveGroupChatMemberResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("GroupChatAdapter#createRemoveGroupChatMemberResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("GroupChatAdapter#createRemoveGroupChatMemberResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals(REMOVE_GROUP_CHAT_MEMBER_NAMESPACE))) {
            Log.error("GroupChatAdapter#createRemoveGroupChatMemberResponsePacket::namespace is invalid");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = createRemoveGroupChatMemberContentElem(
                requestJid, chatRoomInfo, resultMemberList, removeType,
                GroupChatAdapter.PACKET_TYPE_RESPONSE);
        if (newContentElem == null) {
            Log.info("GroupChatAdapter#createRemoveCommunityMemberResponsePacket::newContentElem is null.");
            return ret;
        }
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public Element createRemoveGroupChatMemberContentElem(String requestJid,
            ChatRoomInfo chatRoomInfo, Map<String, Boolean> resultMemberList,
            String removeType, int packetType) {
        Log.debug("do func GroupChatAdapter.createRemoveGroupChatMemberContentElem(...");
        Element ret = null;
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#createRemoveGroupChatMemberContentElem::chatRoomInfo is null");
            return ret;
        }
        Element contentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = creatRemoveGroupChatMemberItemElem(requestJid,
                chatRoomInfo, resultMemberList, removeType, packetType);
        if (itemElem == null) {
            Log.info("GroupChatAdapter#createRemoveGroupChatMemberContentElem::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        contentElem.add(itemsElem);

        ret = contentElem;
        return ret;
    }

    private Element creatRemoveGroupChatMemberItemElem(String requestJid,
            ChatRoomInfo chatRoomInfo, Map<String, Boolean> resultMemberList,
            String removeType, int packetType) {
        Log.debug("do func GroupChatAdapter.creatRemoveGroupChatMemberItemElem(...");
        if (chatRoomInfo == null) {
            Log.error("GroupChatAdapter#creatRemoveGroupChatMemberItemElem::chatRoomInfo is null");
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");

        Element removeTypeElem = DocumentHelper.createElement("removetype");
        removeTypeElem.setText(removeType);
        itemElem.add(removeTypeElem);

        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(chatRoomInfo.getRoomId());
        itemElem.add(roomIdElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        roomNameElem.setText(chatRoomInfo.getRoomName());
        itemElem.add(roomNameElem);

        Element parentRoomIdElem = DocumentHelper.createElement("parentroomid");
        parentRoomIdElem.setText(chatRoomInfo.getParentRoomId());
        itemElem.add(parentRoomIdElem);

        Element privacyTypeElem = DocumentHelper.createElement("privacytype");
        privacyTypeElem.setText(String.valueOf(chatRoomInfo.getPrivacyType()));
        itemElem.add(privacyTypeElem);

        Element removedByElem = DocumentHelper.createElement("removed_by");
        removedByElem.setText(requestJid);
        itemElem.add(removedByElem);

        Element membersElem = DocumentHelper.createElement("members");
        int memberCount = resultMemberList.size();
        membersElem.addAttribute("count", String.valueOf(memberCount));
        itemElem.add(membersElem);

        if (packetType == GroupChatAdapter.PACKET_TYPE_RESPONSE) {
            Element successMembersElem = DocumentHelper
                    .createElement("successmembers");
            membersElem.add(successMembersElem);
            Element failureMembersElem = DocumentHelper
                    .createElement("failuremembers");
            membersElem.add(failureMembersElem);
            for (Iterator<Entry<String, Boolean>> it = resultMemberList
                    .entrySet().iterator(); it.hasNext();) {
                @SuppressWarnings("rawtypes")
                Map.Entry entry = (Map.Entry) it.next();
                Element memberElem = DocumentHelper.createElement("member");
                memberElem.setText(entry.getKey().toString());
                if (Boolean.valueOf(entry.getValue().toString())) {
                    successMembersElem.add(memberElem);
                } else {
                    failureMembersElem.add(memberElem);
                }
            }
        } else if (packetType == GroupChatAdapter.PACKET_TYPE_NOTIFIER) {
            for (Iterator<Entry<String, Boolean>> it = resultMemberList
                    .entrySet().iterator(); it.hasNext();) {
                @SuppressWarnings("rawtypes")
                Map.Entry entry = (Map.Entry) it.next();
                Element memberElem = DocumentHelper.createElement("member");
                memberElem.setText(entry.getKey().toString());
                membersElem.add(memberElem);
            }
        }

        Element notifyTypeElem = DocumentHelper.createElement("notify_type");
        int notifyType = chatRoomInfo.getNotifyType();
        notifyTypeElem.setText(String.valueOf(notifyType));
        itemElem.add(notifyTypeElem);

        return itemElem;
    }

    private ChatRoomInfo getUpdateChatRoomInfo(ChatRoomInfo chatRoomInfo,
            String requestJid, int deleteFlag) {
        Log.debug("do func GroupChatAdapter.getUpdateChatRoomInfo(...");
        if (chatRoomInfo == null) {
            return null;
        }
        if (deleteFlag != 1 && deleteFlag != 2) {
            return null;
        }
        Timestamp timestamp = new Timestamp(System.currentTimeMillis());

        chatRoomInfo.setUpdatedAt(timestamp);
        chatRoomInfo.setUpdatedBy(requestJid);
        chatRoomInfo.setDeletedAt(timestamp);
        chatRoomInfo.setDeletedBy(requestJid);
        chatRoomInfo.setDeleteFlag(deleteFlag);
        chatRoomInfo.setSubTypeList(new ArrayList<String>(Arrays
                .asList(ChatRoomInfo.SUBTYPE_ITEM_DELETECHATROOM)));

        return chatRoomInfo;
    }

    public boolean checkHasDeletedPermission(String fromJid, Message message) {
        Log.debug("do func GroupChatAdapter.checkHasDeletedPermission(...");
        boolean ret = false;
        boolean isRoomMember = isRoomMember(fromJid, message.getMsgTo());

        String msgFrom = message.getMsgFrom();

        if (isRoomMember && msgFrom.equals(fromJid)) {
            ret = true;
        }

        return ret;
    }

    private boolean checkNotfiyType(int notifyType) {
        Log.debug("do func GroupChatAdapter.checkNotfiyType(...");
        if(notifyType != ChatRoomInfo.NOTIFY_TYPE_ALL_ON
                && notifyType != ChatRoomInfo.NOTIFY_TYPE_ALL_OFF) {
            return false;
        }
        return true;
    }
}
