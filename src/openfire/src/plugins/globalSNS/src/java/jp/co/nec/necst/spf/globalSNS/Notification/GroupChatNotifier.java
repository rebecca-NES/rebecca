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

package jp.co.nec.necst.spf.globalSNS.Notification;

import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatRoomStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.GroupChatAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.NotificationManager;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomInfo;
import jp.co.nec.necst.spf.globalSNS.Data.NotificationDbData;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeControler;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content.messageNotice.entry;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientNotifier;
import net.arnx.jsonic.JSON;
import net.arnx.jsonic.JSONException;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;
import org.xmpp.packet.Message;

public class GroupChatNotifier {
    private static final Logger Log = LoggerFactory
            .getLogger(GroupChatNotifier.class);

    private static GroupChatNotifier mInstance = null;
    private static final int THREAD_STATUS_NOT_START = 0;
    private static final int THREAD_STATUS_STARTED = 1;
    private static final int THREAD_STATUS_STOPED = 2;

    private List<INotification> mQueueGroupChatNotification = null;
    private GroupChatNotificationSnderThread mNotificationSenderThread = null;
    private int mThreadStatus = THREAD_STATUS_NOT_START;
    private boolean mThreadStopRequest = false;

    private static final String REMOVE_MEMBER_NAMESPASE = "http://necst.nec.co.jp/protocol/removegroupchatmember";

    public static GroupChatNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new GroupChatNotifier();
        }
        return mInstance;
    }

    private GroupChatNotifier() {
        mQueueGroupChatNotification = new ArrayList<INotification>();
        mNotificationSenderThread = new GroupChatNotificationSnderThread();
    }

    public boolean start() {
        final String logPrefix = "start :";
        if (mNotificationSenderThread == null
                || mThreadStatus == THREAD_STATUS_STOPED) {
            return false;
        }
        if (mThreadStatus == THREAD_STATUS_STARTED) {
            return true;
        }
        try {
            mNotificationSenderThread.start();
            mThreadStatus = THREAD_STATUS_STARTED;
            return true;
        } catch (Throwable throwObject) {
            try {
                Log.error(logPrefix + "Error occurred on starting thread.",
                        throwObject);
            } catch (OutOfMemoryError oomError) {
            }
        }
        return false;
    }

    public void stop() {
        mThreadStatus = THREAD_STATUS_STOPED;
        mThreadStopRequest = true;
        if (mNotificationSenderThread != null) {
            try {
                mNotificationSenderThread.join();
            } catch (InterruptedException e) {
                Log.error("InterruptedException occurred.", e);
            }
        }
    }

    public void sendCreateGroupChatRoomNotification(String roomId) {
        if (roomId == null) {
            Log.error("GroupChatNotifier#sendCreateGroupChatRoomNotification::roomId is null");
            return;
        }
        List<String> memberList = GroupChatAdapter.getInstance()
                .getJoinedMemberList(roomId);
        if (memberList == null) {
            Log.error("GroupChatNotifier#sendCreateGroupChatRoomNotification::memberList is null");
        }
        for (String memberJid : memberList) {
            sendCreateGroupChatRoomNotification(roomId, memberJid);
        }
    }

    public void sendUpdateGroupChatRoomNotification(ChatRoomInfo chatRoomInfo) {
        if (chatRoomInfo == null) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::chatRoomInfo is null");
            return;
        }
        if (chatRoomInfo.getRoomId() == null) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::roomId is null");
            return;
        }
        List<String> memberList = GroupChatAdapter.getInstance()
                .getJoinedMemberList(chatRoomInfo.getRoomId());
        if (memberList == null) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::memberList is null");
        }
        for (String memberJid : memberList) {
            sendUpdateGroupChatRoomNotification(chatRoomInfo, memberJid);
        }
    }

    public void sendCreateGroupChatRoomNotification(String roomId, String sendTo) {
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatNotifier#sendCreateGroupChatRoomNotification::roomId is invalid");
            return;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("GroupChatNotifier#sendCreateGroupChatRoomNotification::sendTo is invalid");
            return;
        }
        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        JID sendToJid = new JID(sendTo);
        if (!GlobalSNSUtils.isAvailable(sendToJid)) {
            NotificationDbData notificationDbData = new NotificationDbData();
            notificationDbData
                    .setNotificationType(NotificationDbData.NOTIFICATION_TYPE_CREATE_CHAT_ROOM);
            notificationDbData
                    .setDataType(NotificationDbData.DATA_TYPE_DATA_ONLY);
            CreateChatRoomNotifyData createChatRoomNotifyData = new CreateChatRoomNotifyData();
            createChatRoomNotifyData.roomId = roomId;
            String dataString = JSON.encode(createChatRoomNotifyData);
            notificationDbData.setNotificationData(dataString);
            notificationDbData.setJid(sendTo);
            Calendar now = Calendar.getInstance();
            notificationDbData.setNotifiedDate(new Timestamp(now
                    .getTimeInMillis()));
            NotificationManager.getInstatnce().saveNotificateData(
                    notificationDbData);
            return;
        }
        List<String> roomIdList = new ArrayList<String>();
        roomIdList.add(roomId);
        sendCreateGroupChatRoomNotification(from, sendTo, roomIdList);
    }

    public void sendUpdateGroupChatRoomNotification(ChatRoomInfo chatRoomInfo,
            String sendTo) {
        if (chatRoomInfo == null || chatRoomInfo.equals("")) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::chatRoomInfo is invalid");
            return;
        }
        if (chatRoomInfo.getRoomId() == null
                || chatRoomInfo.getRoomId().equals("")) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::roomId is invalid");
            return;
        }
        if (chatRoomInfo.getPreRoomName() == null
                || chatRoomInfo.getPreRoomName().equals("")) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::preRoomName is invalid");
            return;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::sendTo is invalid");
            return;
        }
        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        JID sendToJid = new JID(sendTo);
        if (!GlobalSNSUtils.isAvailable(sendToJid)) {
            NotificationDbData notificationDbData = new NotificationDbData();
            notificationDbData
                    .setNotificationType(NotificationDbData.NOTIFICATION_TYPE_CHANGE_CHAT_ROOM_INFO);
            notificationDbData
                    .setDataType(NotificationDbData.DATA_TYPE_DATA_ONLY);
            UpdateChatRoomInfoData updateChatRoomInfoData = new UpdateChatRoomInfoData();
            updateChatRoomInfoData.roomId = chatRoomInfo.getRoomId();
            updateChatRoomInfoData.preRoomName = chatRoomInfo.getPreRoomName();
            updateChatRoomInfoData.preNotifyType = chatRoomInfo.getPreNotifyType();
            updateChatRoomInfoData.prePrivacyType = chatRoomInfo.getPrePrivacyType();

            updateChatRoomInfoData.extras.subType = chatRoomInfo
                    .getSubTypeList();

            String dataString = JSON.encode(updateChatRoomInfoData);
            notificationDbData.setNotificationData(dataString);
            notificationDbData.setJid(sendTo);
            Calendar now = Calendar.getInstance();
            notificationDbData.setNotifiedDate(new Timestamp(now
                    .getTimeInMillis()));
            NotificationManager.getInstatnce().saveNotificateData(
                    notificationDbData);
            return;
        }
        List<String> roomIdList = new ArrayList<String>();
        roomIdList.add(chatRoomInfo.getRoomId());
        sendUpdateGroupChatRoomNotification(chatRoomInfo, from, sendTo,
                roomIdList);
    }

    private void sendCreateGroupChatRoomNotification(String from,
            String sendTo, List<String> roomIdList) {
        if (from == null || from.equals("")) {
            Log.error("GroupChatNotifier#sendCreateGroupChatRoomNotification::from is invalid");
            return;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("GroupChatNotifier#sendCreateGroupChatRoomNotification::sendTo is invalid");
            return;
        }
        if (roomIdList == null) {
            Log.error("GroupChatNotifier#sendCreateGroupChatRoomNotification::roomIdList is null");
            return;
        }
        Message message = new Message();
        message.setFrom(from);
        message.setTo(sendTo);
        message.setID("createGroupChatRoom" + StringUtils.randomString(5)
                + "__" + sendTo + "__" + StringUtils.randomString(5));
        Element notifyElem = message.addChildElement("notify",
                "http://necst.nec.co.jp/protocol/createchatroom");
        Element contentElem = DocumentHelper.createElement("content");
        notifyElem.add(contentElem);
        Element itemsElem = DocumentHelper.createElement("items");
        contentElem.add(itemsElem);
        int count = roomIdList.size();
        int index = 0;
        boolean withPersonInfo = true;
        for (int i = 0; i < count; i++) {
            String roomId = roomIdList.get(i);
            Element itemElem = GroupChatAdapter.getInstance()
                    .getRoomInfoItemElem(roomId, withPersonInfo);
            if (itemElem == null) {
                Log.error("GroupChatNotifier#createCreateGroupChatRoomNotificationMessage::itemElem is null");
                continue;
            }
            itemsElem.add(itemElem);
            index++;
        }
        itemsElem.addAttribute("count", String.valueOf(index));

        XMPPServer.getInstance().getMessageRouter().route(message);
    }

    private void sendUpdateGroupChatRoomNotification(ChatRoomInfo chatRoomInfo,
            String from, String sendTo, List<String> roomIdList) {
        if (chatRoomInfo == null || chatRoomInfo.equals("")) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::chatRoomInfo is invalid");
            return;
        }
        if (from == null || from.equals("")) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::from is invalid");
            return;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::sendTo is invalid");
            return;
        }
        if (roomIdList == null) {
            Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::roomIdList is null");
            return;
        }
        Message message = new Message();
        message.setFrom(from);
        message.setTo(sendTo);
        message.setID("updateGroupChatRoom" + StringUtils.randomString(5)
                + "__" + sendTo + "__" + StringUtils.randomString(5));
        Element notifyElem = message.addChildElement("notify",
                "http://necst.nec.co.jp/protocol/updatechatroominfo");
        Element contentElem = DocumentHelper.createElement("content");
        notifyElem.add(contentElem);

        Element extrasElem = DocumentHelper.createElement("extras");
        contentElem.add(extrasElem);
        Element subtypeElem = DocumentHelper.createElement("subtype");
        extrasElem.add(subtypeElem);
        for (String item : chatRoomInfo.getSubTypeList()) {
            if (item == null) {
                continue;
            }
            Element itemElem = DocumentHelper.createElement("item");
            itemElem.setText(item);
            subtypeElem.add(itemElem);
        }
        Element preroomnameElem = DocumentHelper.createElement("preroomname");
        preroomnameElem.setText(chatRoomInfo.getPreRoomName());
        extrasElem.add(preroomnameElem);
        Element prenotifyTypeElem = DocumentHelper.createElement("prenotify_type");
        prenotifyTypeElem.setText(String.valueOf(chatRoomInfo.getPreNotifyType()));
        extrasElem.add(prenotifyTypeElem);

        Element preprivacyTypeElem = DocumentHelper.createElement("preprivacy_type");
        preprivacyTypeElem.setText(String.valueOf(chatRoomInfo.getPrePrivacyType()));
        extrasElem.add(preprivacyTypeElem);

        Element itemsElem = DocumentHelper.createElement("items");
        contentElem.add(itemsElem);
        int count = roomIdList.size();
        int index = 0;
        boolean withPersonInfo = true;
        for (int i = 0; i < count; i++) {
            String roomId = roomIdList.get(i);
            Element itemElem = GroupChatAdapter.getInstance()
                    .getRoomInfoItemElem(roomId, withPersonInfo);
            if (itemElem == null) {
                Log.error("GroupChatNotifier#sendUpdateGroupChatRoomNotification::itemElem is null");
                continue;
            }
            itemsElem.add(itemElem);
            index++;
        }
        itemsElem.addAttribute("count", String.valueOf(index));

        XMPPServer.getInstance().getMessageRouter().route(message);
    }

    public void notifyGroupChatMessage(String itemId) {
        this.notifyGroupChatMessageEx(itemId,
                jp.co.nec.necst.spf.globalSNS.Data.Message.TYPE_GROUP_CAHT);
    }

    public void notifyGroupChatMessageForQuestionnaire(String itemId) {
        Log.debug("do func GroupChatNotifier.notifyGroupChatMessageForQuestionnaire(...");
        this.notifyGroupChatMessageEx(itemId,
                jp.co.nec.necst.spf.globalSNS.Data.Message.TYPE_QUESTIONNAIRE);
    }

    private void notifyGroupChatMessageEx(String itemId, int msgType) {
        Log.debug("do func GroupChatNotifier.notifyGroupChatMessageEx(...");
        jp.co.nec.necst.spf.globalSNS.Data.Message groupChatMessage = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(itemId);

        if (groupChatMessage == null) {
            Log.error("GroupChatNotifier#notifyGroupChatMessageEx::groupChatMessage is NULL");
            return;
        }
        if (msgType != groupChatMessage.getMsgType()) {
            Log.error("GroupChatNotifier#notifyGroupChatMessageEx::notify message type is not Group Chat");
            return;
        }
        String roomId = groupChatMessage.getMsgTo();
        List<String> memberList = GroupChatAdapter.getInstance()
                .getJoinedMemberList(roomId);
        if (memberList == null) {
            Log.error("GroupChatNotifier#notifyGroupChatMessageEx::memberList is null");
            return;
        }
        List<JID> reciverJidList = new ArrayList<JID>();
        for (String memberJidStr : memberList) {
            if (memberJidStr == null || memberJidStr.equals("")) {
                Log.warn("GroupChatNotifier#notifyGroupChatMessageEx::memberJidStr is invalid");
                continue;
            }
            JID memberJid = new JID(memberJidStr);
            reciverJidList.add(memberJid);
        }
        MessageNotifier.getInstance().notifyMessage(groupChatMessage,
                reciverJidList, true);
        if(jp.co.nec.necst.spf.globalSNS.Data.Message.TYPE_QUESTIONNAIRE != msgType){
            notifySmartDevice(reciverJidList, groupChatMessage, msgType);
        }
        for (JID jid : reciverJidList) {
            if (jid == null) {
                continue;
            }
            String jidStr = jid.toBareJID();
            WebSocketClientNotifier.getInstance().notifyMessage(jidStr,
                    groupChatMessage);
        }
    }

    public void notifyUpdateGroupChatMessageBody(String itemId) {
        Log.debug("do func GroupChatNotifier.notifyUpdateGroupChatMessageBody(...");
        jp.co.nec.necst.spf.globalSNS.Data.Message groupChatMessage = MessageAdapter
            .getInstance().getMessageWithoutReadInfo(itemId);
        if (groupChatMessage == null) {
            Log.error("GroupChatNotifier#notifyGroupChatMessage::groupChatMessage is NULL");
            return;
        }
        if (jp.co.nec.necst.spf.globalSNS.Data.Message.TYPE_GROUP_CAHT != groupChatMessage
                .getMsgType()) {
            Log.error("GroupChatNotifier#notifyGroupChatMessage::notify message type is not Group Chat");
            return;
        }
        String roomId = groupChatMessage.getMsgTo();
        List<String> memberList = GroupChatAdapter.getInstance()
                .getJoinedMemberList(roomId);
        if (memberList == null) {
            Log.error("GroupChatNotifier#notifyGroupChatMessage::memberList is null");
            return;
        }
        List<JID> reciverJidList = new ArrayList<JID>();
        for (String memberJidStr : memberList) {
            if (memberJidStr == null || memberJidStr.equals("")) {
                Log.warn("GroupChatNotifier#notifyGroupChatMessage::memberJidStr is invalid");
                continue;
            }
            JID memberJid = new JID(memberJidStr);
            reciverJidList.add(memberJid);
        }
        MessageNotifier.getInstance().notifyUpdateMessageBody(groupChatMessage,
                                                    reciverJidList, true);
        for (JID jid : reciverJidList) {
            if (jid == null) {
                continue;
            }
            String jidStr = jid.toBareJID();
            WebSocketClientNotifier.getInstance().notifyUpdateMessageBody(jidStr,
                                                                          groupChatMessage);
        }
    }

    private void notifySmartDevice(List<JID> reciverJidList,
            jp.co.nec.necst.spf.globalSNS.Data.Message groupChatMessage, 
            int msgType) {
        if (groupChatMessage == null) {
            Log.error("GroupChatNotifier#notifySmartDevice:: Message is null");
            return;
        }
        SmartDeviceNoticeInfo deviceNoticeInfo = new SmartDeviceNoticeInfo();
        SmartDeviceNoticeInfo.content content = deviceNoticeInfo.new content();

        content.setType(SmartDeviceNoticeInfo.content.TYPE_MESSAGE);

        SmartDeviceNoticeInfo.content.messageNotice messageNotice = content.new messageNotice();
        messageNotice.setMessageType(msgType);

        String fromJid = groupChatMessage.getMsgFrom();
        messageNotice.setFromJid(fromJid);

        String body = groupChatMessage.getMessageBodyInEntry();
        try {
            body = URLDecoder.decode(body, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            Log.error("GroupChatNotifier#notifySmartDevice:: body decode error");
            return;
        }

        String roomId = groupChatMessage.getMsgTo();
        ChatRoomInfo chatRoomInfo = ChatRoomStoreDbHelper
                .getChatRoomInfoByRoomId(roomId);

        if(chatRoomInfo.getNotifyType() >= ChatRoomInfo.NOTIFY_TYPE_ALL_OFF) {
            Log.debug("GroupChatNotifier#notifySmartDevice:: Not notified roomId=" + roomId);
            return;
        }

        String roomName = chatRoomInfo.getRoomName();
        SmartDeviceNoticeInfo.content.messageNotice.roomInfo roomInfo = messageNotice.new roomInfo();
        roomInfo.setRoomId(roomId);
        roomInfo.setRoomName(roomName);
        messageNotice.setRoomInfo(roomInfo);

        SmartDeviceNoticeInfo.content.messageNotice.entry entry = messageNotice.new entry();
        if (0 == groupChatMessage.getDeleteFlag()) {
            entry.setBody(groupChatMessage.getMessageBodyInEntry());
        }
        messageNotice.setEntry(entry);
        content.setMessageNotice(messageNotice);

        deviceNoticeInfo.setContent(content);

        List<String> isWFJidList = GlobalSNSUtils.getUserListFromStr(body);
        HashSet<String> isWFJidSet = new HashSet<String>();
        if(isWFJidList != null) {
            isWFJidSet.addAll(isWFJidList);
        }

        for (JID jid : reciverJidList) {
            String reciverJidStr = jid.toBareJID();
            if (reciverJidStr.equalsIgnoreCase(fromJid)) {
                continue;
            }
            boolean isWF = false;
            if(isWFJidSet.contains(reciverJidStr)) {
                isWF = true;
            }
            messageNotice.setIsWF(isWF);

            SmartDeviceNoticeControler.notify(jid, deviceNoticeInfo);
        }
    }

    public void sendAddGroupChatMemberNotification(String roomId,
            String addMemberJid, String addedByJid) {
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::roomId is invalid");
            return;
        }
        if (addMemberJid == null || addMemberJid.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::addMemberJid is invalid");
            return;
        }
        if (addedByJid == null || addedByJid.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::addedByJid is invalid");
            return;
        }
        List<String> memberList = GroupChatAdapter.getInstance()
                .getJoinedMemberList(roomId);
        if (memberList == null) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::memberList is null");
        }
        for (String memberJid : memberList) {
            if (addMemberJid.equals(memberJid)) {
                continue;
            }
            sendAddGroupChatMemberNotification(roomId, memberJid, addMemberJid,
                    addedByJid, true);
        }
    }

    private void sendAddGroupChatMemberNotification(String roomId,
            String sendTo, String addMemberJid, String addedByJid,
            boolean isRememberNotifyToLogined) {
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::roomId is invalid");
            return;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::sendTo is invalid");
            return;
        }
        if (addMemberJid == null || addMemberJid.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::addMemberJid is invalid");
            return;
        }
        if (addedByJid == null || addedByJid.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::addedByJid is invalid");
            return;
        }
        JID sendToJid = new JID(sendTo);
        if (!GlobalSNSUtils.isAvailable(sendToJid)) {
            if (isRememberNotifyToLogined) {
                NotificationDbData notificationDbData = new NotificationDbData();
                notificationDbData
                        .setNotificationType(NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_ADD_MEMBER);
                notificationDbData
                        .setDataType(NotificationDbData.DATA_TYPE_DATA_ONLY);
                ChatRoomAddMemberNotifyData chatRoomAddMemberNotifyData = new ChatRoomAddMemberNotifyData();
                chatRoomAddMemberNotifyData.roomId = roomId;
                chatRoomAddMemberNotifyData.addedMemberJid = addedByJid;
                chatRoomAddMemberNotifyData.addedBy = addedByJid;
                String dataString = JSON.encode(chatRoomAddMemberNotifyData);
                notificationDbData.setNotificationData(dataString);
                notificationDbData.setJid(sendTo);
                Calendar now = Calendar.getInstance();
                notificationDbData.setNotifiedDate(new Timestamp(now
                        .getTimeInMillis()));
                NotificationManager.getInstatnce().saveNotificateData(
                        notificationDbData);
            }
            return;
        }
        sendAddGroupChatMemberNotification(roomId, sendTo, addMemberJid,
                addedByJid);
    }

    private void sendAddGroupChatMemberNotification(String roomId,
            String sendTo, String addMemberJid, String addedByJid) {
        if (roomId == null || roomId.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::roomId is invalid");
            return;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::sendTo is invalid");
            return;
        }
        if (addMemberJid == null || addMemberJid.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::addMemberJid is invalid");
            return;
        }
        if (addedByJid == null || addedByJid.equals("")) {
            Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::addedByJid is invalid");
            return;
        }
        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        Message message = new Message();
        message.setFrom(from);
        message.setTo(sendTo);
        message.setID("addGroupChatMember" + StringUtils.randomString(5) + "__"
                + sendTo + "__" + StringUtils.randomString(5));
        Element notifyElem = message.addChildElement("notify",
                "http://necst.nec.co.jp/protocol/addchatroommember");
        Element contentElem = DocumentHelper.createElement("content");
        notifyElem.add(contentElem);
        Element itemsElem = DocumentHelper.createElement("items");
        contentElem.add(itemsElem);
        int count = 1;
        int index = 0;
        for (int i = 0; i < count; i++) {
            Element itemElem = GroupChatAdapter.getInstance()
                    .getAddChatRoomMemberItemElem(roomId, addMemberJid,
                            addedByJid);
            if (itemElem == null) {
                Log.error("GroupChatNotifier#sendAddGroupChatMemberNotification::itemElem is null");
                continue;
            }
            itemsElem.add(itemElem);
            index++;
        }
        itemsElem.addAttribute("count", String.valueOf(index));

        XMPPServer.getInstance().getMessageRouter().route(message);
    }

    public void sendRemoveGroupChatMemberNotification(String requestJid,
            ChatRoomInfo chatRoomInfo, List<String> chatRoomMember,
            Map<String, Boolean> resultList, String removeType) {
        if (requestJid == null || requestJid.trim().equals("")) {
            Log.error("GroupChatNotifier#sendRemoveGroupChatMemberNotification::requestJid is null");
            return;
        }
        if (chatRoomInfo == null) {
            Log.error("GroupChatNotifier#sendRemoveGroupChatMemberNotification::chatRoomInfo is null");
            return;
        }
        if (resultList == null || resultList.size() <= 0) {
            Log.error("GroupChatNotifier#sendRemoveGroupChatMemberNotification::resultList is null or size 0");
            return;
        }
        if (chatRoomMember == null) {
            Log.error("GroupChatNotifier#sendRemoveGroupChatMemberNotification::chatRoomMember is null");
            return;
        }
        if (removeType == null || removeType.trim().equals("")) {
            Log.error("GroupChatNotifier#sendRemoveGroupChatMemberNotification::removeType is null");
            return;
        }
        GroupChatRemoveMemberNotification groupChatRemoveMemberNotifyData = new GroupChatRemoveMemberNotification(
                requestJid, chatRoomInfo, chatRoomMember, resultList,
                removeType);
        synchronized (mQueueGroupChatNotification) {
            mQueueGroupChatNotification.add(groupChatRemoveMemberNotifyData);
        }
    }

    public void sendNotification(NotificationDbData notificationDbData) {
        if (notificationDbData == null) {
            Log.error("GroupChatNotifier#sendNotification :: notificationDbData is null");
            return;
        }
        int notifyType = notificationDbData.getNotificationType();
        int dataType = notificationDbData.getDataType();
        String notificationData = notificationDbData.getNotificationData();
        String jidStr = null;

        switch (notifyType) {
            case NotificationDbData.NOTIFICATION_TYPE_CREATE_CHAT_ROOM: {
                String roomId = null;
                if (dataType == NotificationDbData.DATA_TYPE_DATA_ONLY) {
                    if (notificationData == null || notificationData.equals("")) {
                        Log.error("GroupChatNotifier#sendNotification :: notificationData is invalid");
                        return;
                    }
                    jidStr = notificationDbData.getJid();
                    if (jidStr == null || jidStr.equals("")) {
                        Log.error("GroupChatNotifier#sendNotification :: jidStr is invalid");
                        return;
                    }
                    CreateChatRoomNotifyData createChatRoomNotifyData = null;
                    try {
                        createChatRoomNotifyData = JSON.decode(
                                notificationData,
                                CreateChatRoomNotifyData.class);
                    } catch (JSONException e) {
                        Log.error("GroupChatNotifier#sendNotification :: failed to decode JSON. data="
                                + notificationData);
                        return;
                    }
                    if (createChatRoomNotifyData == null) {
                        Log.error("GroupChatNotifier#sendNotification :: createChatRoomNotifyData is null. data="
                                + notificationData);
                        return;
                    }
                    roomId = createChatRoomNotifyData.roomId;
                } else {
                    Log.error("GroupChatNotifier#sendNotification :: notifyDataType is invalid. dataType="
                            + String.valueOf(dataType));
                    return;
                }
                if (roomId == null || jidStr == null) {
                    Log.error("GroupChatNotifier#sendNotification :: getData is invalid. dataType="
                            + String.valueOf(dataType));
                    return;
                }
                List<String> roomIdList = new ArrayList<String>();
                roomIdList.add(roomId);
                String from = XMPPServer.getInstance().getServerInfo()
                        .getXMPPDomain();
                sendCreateGroupChatRoomNotification(from, jidStr, roomIdList);
                break;
            }
            case NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_ADD_MEMBER: {
                String roomId = null;
                String addMemberJid = null;
                String addedByJid = null;
                if (dataType == NotificationDbData.DATA_TYPE_DATA_ONLY) {
                    if (notificationData == null || notificationData.equals("")) {
                        Log.error("GroupChatNotifier#sendNotification :: notificationData is invalid");
                        return;
                    }
                    jidStr = notificationDbData.getJid();
                    if (jidStr == null || jidStr.equals("")) {
                        Log.error("GroupChatNotifier#sendNotification :: jidStr is invalid");
                        return;
                    }
                    ChatRoomAddMemberNotifyData chatRoomAddMemberNotifyData = null;
                    try {
                        chatRoomAddMemberNotifyData = JSON.decode(
                                notificationData,
                                ChatRoomAddMemberNotifyData.class);
                    } catch (JSONException e) {
                        Log.error("GroupChatNotifier#sendNotification :: failed to decode JSON. data="
                                + notificationData);
                        return;
                    }
                    if (chatRoomAddMemberNotifyData == null) {
                        Log.error("GroupChatNotifier#sendNotification :: chatRoomAddMemberNotifyData is null. data="
                                + notificationData);
                        return;
                    }
                    roomId = chatRoomAddMemberNotifyData.roomId;
                    addMemberJid = chatRoomAddMemberNotifyData.addedMemberJid;
                    addedByJid = chatRoomAddMemberNotifyData.addedBy;
                } else {
                    Log.error("GroupChatNotifier#sendNotification :: notifyDataType is invalid. dataType="
                            + String.valueOf(dataType));
                    return;
                }
                if (roomId == null || jidStr == null || addMemberJid == null
                        || addedByJid == null) {
                    Log.error("GroupChatNotifier#sendNotification :: getData is invalid. dataType="
                            + String.valueOf(dataType));
                    return;
                }
                sendAddGroupChatMemberNotification(roomId, jidStr,
                        addMemberJid, addedByJid, false);
                break;
            }
            case NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_REMOVE_MEMBER:
                if (dataType != NotificationDbData.DATA_TYPE_DATA_ONLY) {
                    Log.error("GroupChatNotifier#sendNotification :: dataType is not DATA_TYPE_DATA_ONLY");
                    return;
                }
                if (notificationData == null || notificationData.equals("")) {
                    Log.error("GroupChatNotifier#sendNotification :: notificationData is invalid");
                    return;
                }
                jidStr = notificationDbData.getJid();
                if (jidStr == null || jidStr.equals("")) {
                    Log.error("GroupChatNotifier#sendNotification :: jidStr is invalid");
                    return;
                }
                GroupChatNotifyData notifyData = null;
                try {
                    notifyData = JSON.decode(notificationData,
                            GroupChatNotifyData.class);
                } catch (JSONException e) {
                    Log.error("GroupChatNotifier#sendNotification :: failed to decode JSON. data="
                            + notificationData);
                    return;
                }
                SAXReader xmlReader = new SAXReader();
                xmlReader.setEncoding("UTF-8");
                if (notifyData.innerVersion < 1) {
                    Log.error("GroupChatNotifier#sendNotification :: notifyData.innerVersion is invalid");
                    return;
                }
                if (notifyData.contentElementXml == null
                        || notifyData.contentElementXml.equals("")) {
                    Log.error("GroupChatNotifier#sendNotification :: notifyData.contentElementXml is invalid");
                    return;
                }
                Element contentElem = null;
                try {
                    Document doc = xmlReader.read(new StringReader(
                            notifyData.contentElementXml));
                    contentElem = doc.getRootElement();
                } catch (DocumentException e) {
                    Log.error("GroupChatNotifier#sendNotification :: contetnElem data is not XML");
                    return;
                }
                if (contentElem == null) {
                    Log.error("GroupChatNotifier#sendNotification :: contentElem is null");
                    return;
                }
                sendGroupChatNotificationToOneMember(contentElem, jidStr,
                        REMOVE_MEMBER_NAMESPASE, notifyType);
                break;
            case NotificationDbData.NOTIFICATION_TYPE_CHANGE_CHAT_ROOM_INFO:
                ChatRoomInfo chatRoomInfo = new ChatRoomInfo();
                if (dataType == NotificationDbData.DATA_TYPE_DATA_ONLY) {
                    if (notificationData == null || notificationData.equals("")) {
                        Log.error("GroupChatNotifier#sendNotification :: notificationData is invalid");
                        return;
                    }
                    jidStr = notificationDbData.getJid();
                    if (jidStr == null || jidStr.equals("")) {
                        Log.error("GroupChatNotifier#sendNotification :: jidStr is invalid");
                        return;
                    }
                    UpdateChatRoomInfoData updateChatRoomInfoData = null;
                    try {
                        updateChatRoomInfoData = JSON.decode(notificationData,
                                UpdateChatRoomInfoData.class);
                    } catch (JSONException e) {
                        Log.error("GroupChatNotifier#sendNotification :: failed to decode JSON. data="
                                + notificationData);
                        return;
                    }
                    if (updateChatRoomInfoData == null) {
                        Log.error("GroupChatNotifier#sendNotification :: UpdateChatRoomInfoData is null. data="
                                + notificationData);
                        return;
                    }
                    chatRoomInfo.setRoomId(updateChatRoomInfoData.roomId);
                    chatRoomInfo
                            .setPreRoomName(updateChatRoomInfoData.preRoomName);
                    chatRoomInfo
                            .setPreNotifyType(updateChatRoomInfoData.preNotifyType);
                    chatRoomInfo
                            .setSubTypeList(updateChatRoomInfoData.extras.subType);
                } else {
                    Log.error("GroupChatNotifier#sendNotification :: notifyDataType is invalid. dataType="
                            + String.valueOf(dataType));
                    return;
                }
                if (chatRoomInfo.getRoomId() == null || jidStr == null) {
                    Log.error("GroupChatNotifier#sendNotification :: getData is invalid. dataType="
                            + String.valueOf(dataType));
                    return;
                }
                List<String> roomIdList = new ArrayList<String>();
                roomIdList.add(chatRoomInfo.getRoomId());
                String from = XMPPServer.getInstance().getServerInfo()
                        .getXMPPDomain();
                sendUpdateGroupChatRoomNotification(chatRoomInfo, from, jidStr,
                        roomIdList);
                break;
            default:
                Log.error("GroupChatNotifier#sendNotification :: notifyType is unknown. type="
                        + String.valueOf(notifyType));
                return;
        }
    }

    public void sendGroupChatNotificationListOnLogedIn(
            List<NotificationDbData> groupChatNotificationList) {
        final String logPrefix = "sendGroupChatNotificationListOnLogedIn() : ";
        if (groupChatNotificationList == null
                || groupChatNotificationList.size() < 1) {
            return;
        }
        int count = groupChatNotificationList.size();
        HashSet<String> roomIdToNotificationList = new HashSet<String>();
        for (int i = 0; i < count; i++) {
            NotificationDbData notificationDbData = groupChatNotificationList
                    .get(i);
            if (notificationDbData == null) {
                Log.error(logPrefix + "notificationDbData is null. index=" + i,
                        new Throwable());
                continue;
            }
            int notifyType = notificationDbData.getNotificationType();
            int dataType = notificationDbData.getDataType();
            String notificationData = notificationDbData.getNotificationData();
            switch (notifyType) {
                case NotificationDbData.NOTIFICATION_TYPE_CREATE_CHAT_ROOM: {
                    String roomId = null;
                    if (dataType == NotificationDbData.DATA_TYPE_DATA_ONLY) {
                        if (notificationData == null
                                || notificationData.equals("")) {
                            Log.error(logPrefix + "notificationData is invalid");
                            continue;
                        }
                        CreateChatRoomNotifyData createChatRoomNotifyData = null;
                        try {
                            createChatRoomNotifyData = JSON.decode(
                                    notificationData,
                                    CreateChatRoomNotifyData.class);
                        } catch (JSONException e) {
                            Log.error(logPrefix
                                    + "failed to decode JSON. data="
                                    + notificationData);
                            continue;
                        }
                        if (createChatRoomNotifyData == null) {
                            Log.error(logPrefix
                                    + "createChatRoomNotifyData is null. data="
                                    + notificationData);
                            continue;
                        }
                        roomId = createChatRoomNotifyData.roomId;
                    } else {
                        Log.error(logPrefix
                                + "notifyDataType is invalid. dataType="
                                + String.valueOf(dataType));
                        continue;
                    }
                    if (roomId == null) {
                        Log.error(logPrefix + "getData is invalid. dataType="
                                + String.valueOf(dataType));
                        continue;
                    }
                    sendNotification(notificationDbData);
                    roomIdToNotificationList.add(roomId);
                    break;
                }
                case NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_ADD_MEMBER: {
                    String roomId = null;
                    if (dataType == NotificationDbData.DATA_TYPE_DATA_ONLY) {
                        if (notificationData == null
                                || notificationData.equals("")) {
                            Log.error(logPrefix + "notificationData is invalid");
                            continue;
                        }
                        ChatRoomAddMemberNotifyData chatRoomAddMemberNotifyData = null;
                        try {
                            chatRoomAddMemberNotifyData = JSON.decode(
                                    notificationData,
                                    ChatRoomAddMemberNotifyData.class);
                        } catch (JSONException e) {
                            Log.error(logPrefix
                                    + "failed to decode JSON. data="
                                    + notificationData);
                            continue;
                        }
                        if (chatRoomAddMemberNotifyData == null) {
                            Log.error(logPrefix
                                    + "chatRoomAddMemberNotifyData is null. data="
                                    + notificationData);
                            continue;
                        }
                        roomId = chatRoomAddMemberNotifyData.roomId;
                    } else {
                        Log.error(logPrefix
                                + "notifyDataType is invalid. dataType="
                                + String.valueOf(dataType));
                        continue;
                    }
                    if (roomId == null) {
                        Log.error(logPrefix + "getData is invalid. dataType="
                                + String.valueOf(dataType));
                        continue;
                    }
                    if (roomIdToNotificationList.contains(roomId)) {
                        Log.debug(logPrefix
                                + "Already notify create group chat");
                        continue;
                    }
                    sendNotification(notificationDbData);
                    break;
                }
                case NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_REMOVE_MEMBER: {
                    sendNotification(notificationDbData);
                    break;
                }
                case NotificationDbData.NOTIFICATION_TYPE_CHANGE_CHAT_ROOM_INFO: {
                    ChatRoomInfo chatRoomInfo = new ChatRoomInfo();
                    if (dataType == NotificationDbData.DATA_TYPE_DATA_ONLY) {
                        if (notificationData == null
                                || notificationData.equals("")) {
                            Log.error(logPrefix + "notificationData is invalid");
                            continue;
                        }
                        UpdateChatRoomInfoData updateChatRoomInfoData = null;
                        try {
                            updateChatRoomInfoData = JSON.decode(
                                    notificationData,
                                    UpdateChatRoomInfoData.class);
                        } catch (JSONException e) {
                            Log.error(logPrefix
                                    + "failed to decode JSON. data="
                                    + notificationData);
                            continue;
                        }
                        if (updateChatRoomInfoData == null) {
                            Log.error(logPrefix
                                    + "UpdateChatRoomInfoData is null. data="
                                    + notificationData);
                            continue;
                        }
                        chatRoomInfo.setRoomId(updateChatRoomInfoData.roomId);
                        chatRoomInfo
                                .setPreRoomName(updateChatRoomInfoData.preRoomName);
                        chatRoomInfo
                                .setPreNotifyType(updateChatRoomInfoData.preNotifyType);
                        chatRoomInfo
                                .setSubTypeList(updateChatRoomInfoData.extras.subType);
                    } else {
                        Log.error(logPrefix
                                + "notifyDataType is invalid. dataType="
                                + String.valueOf(dataType));
                        continue;
                    }
                    String roomId = chatRoomInfo.getRoomId();
                    if (roomId == null || roomId.equals("")) {
                        Log.error(logPrefix + "getData is invalid. dataType="
                                + String.valueOf(dataType));
                        continue;
                    }
                    if (roomIdToNotificationList.contains(roomId)) {
                        Log.debug(logPrefix
                                + "Already notify create group chat");
                        continue;
                    }
                    sendNotification(notificationDbData);
                    break;
                }
                default:
                    Log.error(logPrefix
                            + "notificationDbData'type is invalid. index=" + i,
                            new Throwable());
                    continue;
            }
        }
    }

    private class CreateChatRoomNotifyData {
        public String roomId = "";
    }

    private class ChatRoomAddMemberNotifyData {
        public String roomId = "";
        public String addedMemberJid = "";
        public String addedBy = "";
    }

    private class UpdateChatRoomInfoData {
        public String roomId = "";
        public String preRoomName = "";
        public int preNotifyType = -1;
        public int prePrivacyType = -1;
        public UpdateChatRoomInfoExtrasData extras = new UpdateChatRoomInfoExtrasData();

        private class UpdateChatRoomInfoExtrasData {
            public List<String> subType;
        }
    }

    private void sendGroupChatNotificationToOneMember(Element contentElem,
            String sendTo, String namespace, int notificationTypeToDbData) {
        if (contentElem == null) {
            Log.error("GroupChatNotifier#sendGroupChatNotificationToOneMember::contentElem is null");
            return;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("GroupChatNotifier#sendGroupChatNotificationToOneMember::sendTo is invalid");
            return;
        }
        if (namespace == null || namespace.equals("")) {
            Log.error("GroupChatNotifier#sendGroupChatNotificationToOneMember::namespace is invalid");
            return;
        }
        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        JID sendToJid = new JID(sendTo);
        if (!GlobalSNSUtils.isAvailable(sendToJid)) {
            if (notificationTypeToDbData <= 0) {
                return;
            }
            NotificationDbData notificationDbData = createNotificationDbData(
                    sendTo, notificationTypeToDbData, contentElem);
            if (notificationDbData == null) {
                Log.error("GroupChatNotifier#sendGroupChatNotificationToOneMember::notificationDbData is null");
                return;
            }
            NotificationManager.getInstatnce().saveNotificateData(
                    notificationDbData);
            return;
        }
        Message message = new Message();
        message.setFrom(from);
        message.setTo(sendTo);
        String idType = "";
        switch (notificationTypeToDbData) {
            case NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_REMOVE_MEMBER:
                idType = "RemoveGroupChatMember";
                break;
            default:
                break;
        }
        message.setID(idType + StringUtils.randomString(5) + "__" + sendTo
                + "__" + StringUtils.randomString(5));
        Element notifyElem = message.addChildElement("notify", namespace);
        notifyElem.add(contentElem);
        XMPPServer.getInstance().getMessageRouter().route(message);
    }

    private NotificationDbData createNotificationDbData(String sendTo,
            int notificationTypeToDbData, Element contentElem) {
        NotificationDbData ret = null;
        if (contentElem == null) {
            Log.error("GroupChatNotifier#createNotificationDbData::contentElem is null");
            return ret;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("GroupChatNotifier#createNotificationDbData::sendTo is invalid");
            return ret;
        }
        if (notificationTypeToDbData <= 0) {
            Log.info("GroupChatNotifier#createNotificationDbData::notificationTypeToDbData is less than or equal to zero");
            return ret;
        }
        NotificationDbData notificationDbData = new NotificationDbData();
        notificationDbData.setNotificationType(notificationTypeToDbData);
        notificationDbData.setDataType(NotificationDbData.DATA_TYPE_DATA_ONLY);
        GroupChatNotifyData notifyData = new GroupChatNotifyData();
        notifyData.innerVersion = 1;
        notifyData.contentElementXml = contentElem.asXML();
        String notifyDataString = JSON.encode(notifyData);
        notificationDbData.setNotificationData(notifyDataString);
        notificationDbData.setJid(sendTo);
        Calendar now = Calendar.getInstance();
        notificationDbData
                .setNotifiedDate(new Timestamp(now.getTimeInMillis()));
        ret = notificationDbData;
        return ret;
    }

    private class GroupChatNotifyData {
        public int innerVersion = 0;
        public String contentElementXml = "";
    }

    private class GroupChatNotificationSnderThread extends Thread {
        public void run() {
            final String logPrefix = "GroupChatNotificationSnderThread:run :";
            Log.debug("GroupChatNotificationSnderThread: start!");
            List<INotification> tempList = new ArrayList<INotification>();
            while (true) {
                if (mThreadStopRequest) {
                    break;
                }
                try {
                    tempList.clear();
                    synchronized (mQueueGroupChatNotification) {
                        try {
                            tempList.addAll(mQueueGroupChatNotification);
                        } catch (OutOfMemoryError oomError) {
                            try {
                                Log.error(logPrefix
                                        + "Error occurred in adding tempList.",
                                        oomError);
                            } catch (OutOfMemoryError oomError2) {
                            }
                        }
                        mQueueGroupChatNotification.clear();
                    }
                    for (INotification notification : tempList) {
                        notification.sendNotification();
                    }
                    tempList.clear();
                    boolean queueExist = false;
                    synchronized (mQueueGroupChatNotification) {
                        if (!mQueueGroupChatNotification.isEmpty()) {
                            queueExist = true;
                        }
                    }
                    if (queueExist) {
                        continue;
                    }
                } catch (Throwable throwObject) {
                    try {
                        Log.error(logPrefix + "Error occurred in thread loop.",
                                throwObject);
                    } catch (OutOfMemoryError oomError) {
                    }
                }
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                }
            }
        }
    }

    private class GroupChatRemoveMemberNotification implements INotification {

        private String mRequestJid = null;
        private ChatRoomInfo mChatRoomInfo = null;
        private List<String> mChatRoomMember = null;
        private Map<String, Boolean> mResultList = null;
        private String mRemoveType = null;

        GroupChatRemoveMemberNotification(String requestJid,
                ChatRoomInfo chatRoomInfo, List<String> chatRoomMember,
                Map<String, Boolean> resultList, String removeType) {
            mRequestJid = requestJid;
            mChatRoomInfo = new ChatRoomInfo(chatRoomInfo);
            mChatRoomMember = new ArrayList<String>();
            mChatRoomMember.addAll(chatRoomMember);
            mResultList = new HashMap<String, Boolean>();
            mResultList.putAll(resultList);
            mRemoveType = removeType;
        }

        public void sendNotification() {
            String requestJid = mRequestJid;
            ChatRoomInfo chatRoomInfo = mChatRoomInfo;
            List<String> chatRoomMember = mChatRoomMember;
            Map<String, Boolean> resultList = mResultList;
            String removeType = mRemoveType;

            if (requestJid == null || requestJid.trim().equals("")) {
                Log.error("GroupChatRemoveMemberNotification#sendNotification::requestJid is null");
                return;
            }
            if (chatRoomInfo == null) {
                Log.error("GroupChatRemoveMemberNotification#sendNotification::chatRoomInfo is null");
                return;
            }
            if (resultList == null || resultList.isEmpty()) {
                Log.error("GroupChatRemoveMemberNotification#sendNotification::resultList is null or size 0");
                return;
            }
            if (chatRoomMember == null) {
                Log.error("GroupChatRemoveMemberNotification#sendNotification::chatRoomMember is null");
                return;
            }
            if (removeType == null || removeType.trim().equals("")) {
                Log.error("GroupChatRemoveMemberNotification#sendNotification::removeType is null");
                return;
            }
            Set<String> sendToSet = new HashSet<String>();
            for (String mJid : chatRoomMember) {
                if (mJid == null) {
                    continue;
                }
                sendToSet.add(mJid);
            }
            for (Entry<String, Boolean> mEntry : resultList.entrySet()) {
                if (mEntry == null) {
                    continue;
                }
                String mJid = mEntry.getKey();
                sendToSet.add(mJid);
            }
            Element contentElem = createRemoveGroupChatMemberContentElem(
                    requestJid, chatRoomInfo, resultList, removeType);
            if (contentElem == null) {
                Log.error("GroupChatRemoveMemberNotification#sendNotification::contentElem is null");
                return;
            }
            Element copyContentElem;
            Iterator<String> it = sendToSet.iterator();
            while (it.hasNext()) {
                copyContentElem = contentElem.createCopy();
                String sendToJid = it.next();
                sendGroupChatNotificationToOneMember(
                        copyContentElem,
                        sendToJid,
                        REMOVE_MEMBER_NAMESPASE,
                        NotificationDbData.NOTIFICATION_TYPE_CHAT_ROOM_REMOVE_MEMBER);
            }
        }

        private Element createRemoveGroupChatMemberContentElem(
                String requestJid, ChatRoomInfo chatRoomInfo,
                Map<String, Boolean> resultList, String removeType) {

            for (Iterator<Entry<String, Boolean>> it = resultList.entrySet()
                    .iterator(); it.hasNext();) {
                @SuppressWarnings("rawtypes")
                Map.Entry entry = (Map.Entry) it.next();
                if (!Boolean.valueOf(entry.getValue().toString())) {
                    resultList.remove(entry.getKey());
                }
            }

            return GroupChatAdapter.getInstance()
                    .createRemoveGroupChatMemberContentElem(requestJid,
                            chatRoomInfo, resultList, removeType, 1);
        }

    }
}
