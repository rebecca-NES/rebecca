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
import java.util.Calendar;
import java.util.List;
import java.util.Hashtable;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.MessageExistingReaderInfo;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.CommunityManager;
import jp.co.nec.necst.spf.globalSNS.Notification.MessageOptionNotifier;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJobCounting;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPointCounting;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class MessageOptionAdapter {

    private static MessageOptionAdapter mThisInstance = null;

    private MessageOptionAdapter() {
    }

    public static MessageOptionAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new MessageOptionAdapter();
        }
        return mThisInstance;
    }

    @SuppressWarnings("deprecation")
    public IQ demandTask(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#demandTask::iq is null");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        Message message = getMessageFromDemandTaskXMPP(iq);
        if (message == null) {
            Log.error("MessageOptionAdapter#demandTask::message is null");
            return ret;
        }

        Message beforeMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(message.getItemId());
        if (beforeMessage == null) {
            Log.error("MessageOptionAdapter#demandTask::beforeMessage got from DB is null.");
            return ret;
        }
        if (beforeMessage.getDemandStatus() == Message.DEMAND_STATUS_DEMAND) {
            Log.warn("MessageOptionAdapter#demandTask::demand_status is already 1. item_id:"
                    + beforeMessage.getItemId());
            return ret;
        }

        Calendar now = Calendar.getInstance();
        message.setDemandDate(new Timestamp(now.getTimeInMillis()));
        message.setDemandStatus(Message.DEMAND_STATUS_DEMAND);

        if (!MessageStoreDbHelper.updateDemandTaskToDb(message)) {
            Log.error("MessageOptionAdapter#demandTask::failed to updateDemandTaskToDb");
            return ret;
        }

        ret = IQ.createResultIQ(iq);

        message = MessageAdapter.getInstance().getMessageAppendReadInfo(
                message.getItemId(), requestJid);

        MessageOptionNotifier.getInstance().notifyDemandTask(message,
                requestJid);

        return ret;
    }

    @SuppressWarnings({ "deprecation", "unchecked" })
    private Message getMessageFromDemandTaskXMPP(IQ iq) {
        Message ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::iq type is not set");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("DemandTask")) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::type is invalid");
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::itemElementList is null");
            return ret;
        }
        Message message = new Message();
        int count = itemElementList.size();
        for (int i = 0; i < count; i++) {
            Element itemElement = itemElementList.get(i);
            if (itemElement == null) {
                Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::itemElement is null. No."
                        + i);
                return ret;
            }
            Element itemIdElem = itemElement.element("item_id");
            if (itemIdElem == null) {
                Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::itemIdElem is null");
                return ret;
            }
            String itemId = itemIdElem.getStringValue();
            if (itemId == null || itemId.equals("")) {
                Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::itemId is invalid. No."
                        + i);
                return ret;
            }
            message.setItemId(itemId);

            Element clearConditionElem = itemElement.element("clear_condition");
            if (clearConditionElem == null) {
                Log.error("MessageOptionAdapter#getMessageFromDemandTaskXMPP::clearConditionElem is null");
                return ret;
            }
        }
        ret = message;
        return ret;
    }

    @SuppressWarnings("deprecation")
    public IQ clearDemandTask(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#clearDemandTask::iq is null");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        Message message = getMessageFromClearDemandTaskXMPP(iq);
        if (message == null) {
            Log.error("MessageOptionAdapter#clearDemandTask::message is null");
            return ret;
        }

        Message beforeMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(message.getItemId());
        if (beforeMessage == null) {
            Log.error("MessageOptionAdapter#clearDemandTask::beforeMessage got from DB is null.");
            return ret;
        }
        if (beforeMessage.getDemandStatus() == Message.DEMAND_STATUS_NON_DEMAND) {
            Log.warn("MessageOptionAdapter#clearDemandTask::demand_status is already 0. item_id:"
                    + beforeMessage.getItemId());
            return ret;
        }

        message.setDemandDate(null);
        message.setDemandStatus(Message.DEMAND_STATUS_NON_DEMAND);

        if (!MessageStoreDbHelper.updateDemandTaskToDb(message)) {
            Log.error("MessageOptionAdapter#clearDemandTask::failed to updateDemandTaskToDb");
            return ret;
        }

        ret = IQ.createResultIQ(iq);

        message = MessageAdapter.getInstance().getMessageAppendReadInfo(
                message.getItemId(), requestJid);

        MessageOptionNotifier.getInstance().notifyClearDemandTask(message,
                requestJid);

        return ret;
    }

    @SuppressWarnings({ "deprecation", "unchecked" })
    private Message getMessageFromClearDemandTaskXMPP(IQ iq) {
        Message ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::iq type is not set");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("ClearDemandedTask")) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::type is invalid :: "
                    + type);
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::itemElementList is null");
            return ret;
        }
        Message message = new Message();
        int count = itemElementList.size();
        for (int i = 0; i < count; i++) {
            Element itemElem = itemElementList.get(i);
            if (itemElem == null) {
                Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::itemElem is null. No."
                        + i);
                return ret;
            }
            Element itemIdElem = itemElem.element("item_id");
            if (itemIdElem == null) {
                Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::itemIdElem is null");
                return ret;
            }
            String itemId = itemIdElem.getStringValue();
            if (itemId == null || itemId.equals("")) {
                Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::itemId is invalid. No."
                        + i);
                return ret;
            }
            message.setItemId(itemId);
        }
        ret = message;
        return ret;
    }

    public Element getDemandTaskItemElement(Message message, String fromUserJid) {
        return setDemandTaskItem(message, fromUserJid);
    }

    private Element setDemandTaskItem(Message message, String fromUserJid) {

        String fromUserNickName = GlobalSNSUtils.getUserName(fromUserJid);

        Element itemElem = DocumentHelper.createElement("item");
        Element taskInfoElem = DocumentHelper.createElement("task_info");
        itemElem.add(taskInfoElem);
        Element itemIdElem = DocumentHelper.createElement("item_id");
        itemIdElem.setText(message.getItemId());
        taskInfoElem.add(itemIdElem);
        Element titleElem = DocumentHelper.createElement("title");
        titleElem.setText(getTitleEncodeStringElementFromMessageEntry(message));
        taskInfoElem.add(titleElem);
        Element ownerElem = DocumentHelper.createElement("owner");
        ownerElem.setText(message.getOwner());
        taskInfoElem.add(ownerElem);
        Element clientElem = DocumentHelper.createElement("client");
        clientElem.setText(message.getClient());
        taskInfoElem.add(clientElem);
        Element statusElem = DocumentHelper.createElement("status");
        statusElem.setText(Integer.toString(message.getStatus()));
        taskInfoElem.add(statusElem);
        Element demandDateElem = DocumentHelper.createElement("demand_date");
        demandDateElem.setText(message.getDemandDateStr());
        taskInfoElem.add(demandDateElem);

        Element fromUserInfoElem = DocumentHelper
                .createElement("from_user_info");
        itemElem.add(fromUserInfoElem);
        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(fromUserJid);
        fromUserInfoElem.add(jidElem);
        Element nicknameElem = DocumentHelper.createElement("nickname");
        nicknameElem.setText(fromUserNickName);
        fromUserInfoElem.add(nicknameElem);
        return itemElem;
    }

    @SuppressWarnings("deprecation")
    private String getTitleEncodeStringElementFromMessageEntry(Message message) {

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entry = null;
        String entryStr = message.getEntry();
        if (entryStr == null || entryStr.equals("")) {
            Log.error("MessageOptionAdapter#getTitleElementFromMessageEntry:: entryStr is null");
            return null;
        } else {
            try {
                Document doc = xmlReader.read(new StringReader(entryStr));
                entry = doc.getRootElement();
            } catch (DocumentException e) {
                Log.error("MessageOptionAdapter#getTitleElementFromMessageEntry:: entry data is not XML");
                return null;
            }
        }
        Element titleElement = entry.element("title");
        String title = titleElement.getStringValue();
        return title;
    }

    @SuppressWarnings("deprecation")
    public IQ getExistingReaderList(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getExistingReaderList::iq is null");
            return ret;
        }
        Message message = getMessageFromGetExistingReaderListXMPP(iq);
        if (message == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::message is null");
            return ret;
        }

        Message savedMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(message.getItemId());
        if (savedMessage == null) {
            Log.error("MessageOptionAdapter#getExistingReaderList::savedMessage got from DB is null.");
            return ret;
        }

        List<MessageExistingReaderInfo> existingReaderList = MessageExistingReaderAdapter
                .getInstance().getExistingReaderListWithDetail(savedMessage);
        if (existingReaderList == null) {
            Log.error("MessageOptionAdapter#getExistingReaderList::existingReaderList is null.");
            return ret;
        }

        ret = createExistingReaderInfoResultIQ(iq, existingReaderList);

        return ret;
    }

    @SuppressWarnings("deprecation")
    private IQ createExistingReaderInfoResultIQ(IQ iq,
            List<MessageExistingReaderInfo> existingReaderList) {
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageOptionAdapter#createExistingReaderInfoResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#createExistingReaderInfoResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#createExistingReaderInfoResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#createExistingReaderInfoResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 0;
        if (existingReaderList != null) {
            itemCount = existingReaderList.size();
        }
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        List<Element> itemElemList = MessageExistingReaderAdapter.getInstance()
                .createExistingReaderInfoElement(existingReaderList);
        if (itemElemList != null) {
            for (Element itemElem : itemElemList) {
                if (itemElem == null) {
                    continue;
                }
                itemsElem.add(itemElem);
            }
        }
        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        return replyPacket;
    }

    @SuppressWarnings({ "deprecation" })
    private Message getMessageFromGetExistingReaderListXMPP(IQ iq) {
        Message ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("GetExistingReaderList")) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::type is invalid :: "
                    + type);
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::itemElementList is null");
            return ret;
        }
        Message message = new Message();
        int count = itemElementList.size();
        if (count != 1) {
            return ret;
        }
        Element itemElem = itemElementList.get(0);
        if (itemElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::itemElem is null.");
            return ret;
        }
        Element itemIdElem = itemElem.element("item_id");
        if (itemIdElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::itemIdElem is null");
            return ret;
        }
        String itemId = itemIdElem.getStringValue();
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::itemId is invalid.");
            return ret;
        }
        message.setItemId(itemId);
        ret = message;
        return ret;
    }

    @SuppressWarnings("deprecation")
    public IQ setReadMessage(IQ iq) {
        Log.debug("do func  MessageOptionAdapter.setReadMessage(");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#setReadMessage::iq is null");
            return ret;
        }
        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("MessageOptionAdapter#setReadMessage::from jid is null");
            return ret;
        }
        String fromJidStr = fromJid.toBareJID();
        if (fromJidStr == null || fromJidStr.equals("")) {
            Log.error("MessageOptionAdapter#setReadMessage::from jid string is invalid");
            return ret;
        }
        List<String> itemIdList = getItemIdListFromSetReadMessageXMPP(iq);
        if (itemIdList == null) {
            Log.error("MessageOptionAdapter#setReadMessage::itemIdList is null");
            return ret;
        }

        List<Message> targetMessageList = new ArrayList<Message>();
        List<Message> responseMessageList = new ArrayList<Message>();
        List<MessageExistingReaderInfo> messageExistingReaderInfoList = new ArrayList<MessageExistingReaderInfo>();
        Timestamp now = new Timestamp(Calendar.getInstance().getTimeInMillis());

        Profile profile = UserProfileDbHelper.getUserProfileData(fromJidStr.trim());
        if(profile == null){
            Log.error("MessageOptionAdapter#setReadMessage::UserProfile from jid string is not exist");
            return ret;
        }

        String s62 = GlobalSNSUtils.decimalToSixtyTwoString(BigInteger.valueOf(profile.getId()));
        String userId =  GlobalSNSUtils.escapeSqlData(s62);

        for (String itemId : itemIdList) {
            Message message = MessageStoreDbHelper
                    .getOneMessageByItemIdWithoutReadInfo(itemId);

            List<String> existingReaderList = MessageExistingReaderAdapter
                    .getInstance().getExistingReaderList(message);
            if( existingReaderList.contains(userId)){
                responseMessageList.add(message);
                continue;
            }

            boolean checkUserResult = checkUserForSetReadMessage(fromJidStr,
                    message);
            if (!checkUserResult) {
                continue;
            }
            targetMessageList.add(message);
            responseMessageList.add(message);
            MessageExistingReaderInfo messageExistingReaderInfo = new MessageExistingReaderInfo();
            messageExistingReaderInfo.setItemId(itemId);
            messageExistingReaderInfo.setJid(fromJidStr);
            messageExistingReaderInfo.setDate(now);
            messageExistingReaderInfoList.add(messageExistingReaderInfo);
        }
        if (responseMessageList.size() == 0) {
            return ret;
        }

        if (targetMessageList.size() > 0 &&
            !MessageReadInfoSetter.getInstance().setReadMessage(
                targetMessageList, fromJidStr, now)) {
            Log.error("MessageOptionAdapter#setReadMessage::failed to updateMessageReadInfoToDb");
            return ret;
        }

        ret = createSetReadMessageResultIQ(iq, responseMessageList);

        MessageOptionNotifier.getInstance().notifyReadMessage(
                messageExistingReaderInfoList);

        return ret;
    }

    private boolean checkUserForSetReadMessage(String fromJidStr,
            Message message) {
        Log.debug("do func  MessageOptionAdapter.checkUserForSetReadMessage(");
        boolean result = false;
        int messageType = message.getMsgType();
        switch (messageType) {
            case Message.TYPE_PUBLIC: {
                result = true;
                break;
            }
            case Message.TYPE_GROUP_CAHT: {
                String roomId = message.getMsgTo();
                result = GroupChatAdapter.getInstance().isRoomMember(
                        fromJidStr, roomId);
                break;
            }
            case Message.TYPE_CHAT: {
                String toJid = message.getMsgTo();
                if (fromJidStr.equals(toJid)) {
                    result = true;
                    break;
                }
                String fromJid = message.getMsgFrom();
                if (fromJidStr.equals(fromJid)) {
                    result = true;
                    break;
                }
                break;
            }
            case Message.TYPE_COMMUNITY: {
                String roomId = message.getMsgTo();
                result = CommunityManager.getInstance().isMember(roomId,
                        fromJidStr);
                break;
            }
            case Message.TYPE_MAIL: {
                String toJid = message.getMsgTo();
                if (fromJidStr.equals(toJid)) {
                    result = true;
                    break;
                }
                break;
            }
            case Message.TYPE_MURMUR: {
                result = true;
                break;
            }
            default: {
                break;
            }
        }
        return result;
    }

    @SuppressWarnings("deprecation")
    private IQ createSetReadMessageResultIQ(IQ iq,
            List<Message> targetMessageList) {
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageOptionAdapter#createSetReadMessageResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#createSetReadMessageResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#createSetReadMessageResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#createSetReadMessageResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element typeElem = DocumentHelper.createElement("type");
        typeElem.setText("SetReadMessage");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 0;
        if (targetMessageList != null) {
            itemCount = targetMessageList.size();
        }
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        for (Message message : targetMessageList) {
            Element itemElm = DocumentHelper.createElement("item");
            Element itemIdElm = DocumentHelper.createElement("item_id");
            itemElm.add(itemIdElm);
            itemIdElm.setText(message.getItemId());
            itemsElem.add(itemElm);
        }
        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        return replyPacket;
    }

    @SuppressWarnings({ "deprecation", "unchecked" })
    private List<String> getItemIdListFromSetReadMessageXMPP(IQ iq) {
        List<String> ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::iq type is not set");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetExistingReaderListXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("SetReadMessage")) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::type is invalid :: "
                    + type);
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromSetReadMessageXMPP::itemElementList is null");
            return ret;
        }
        int count = itemElementList.size();
        ret = new ArrayList<String>();
        for (int i = 0; i < count; i++) {
            Element itemElem = itemElementList.get(i);
            if (itemElem == null) {
                Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::itemElem is null. No."
                        + i);
                continue;
            }
            Element itemIdElem = itemElem.element("item_id");
            if (itemIdElem == null) {
                Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::itemIdElem is null");
                continue;
            }
            String itemId = itemIdElem.getStringValue();
            if (itemId == null || itemId.equals("")) {
                Log.error("MessageOptionAdapter#getMessageFromClearDemandTaskXMPP::itemId is invalid. No."
                        + i);
                continue;
            }
            ret.add(itemId);
        }
        if (ret.size() == 0) {
            return null;
        }
        return ret;
    }

    public Element getNotifyReadMessageItem(
            MessageExistingReaderInfo messageExistingReaderInfo) {

        String itemId = messageExistingReaderInfo.getItemId();
        String jid = messageExistingReaderInfo.getJid();
        String dateStr = messageExistingReaderInfo.getDateStr();

        String fromUserNickName = GlobalSNSUtils.getUserName(jid);
        Profile profile = UserProfileDbHelper.getUserProfileData(jid);
        if (profile == null) {
            return null;
        }
        String avatarType = profile.getPhotoType();
        String avatarData = profile.getPhotoData();

        Element itemElem = DocumentHelper.createElement("item");
        Element itemIdElem = DocumentHelper.createElement("item_id");
        itemIdElem.setText(itemId);
        itemElem.add(itemIdElem);

        Element fromUserInfoElem = DocumentHelper
                .createElement("from_user_info");
        itemElem.add(fromUserInfoElem);
        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(jid);
        fromUserInfoElem.add(jidElem);
        Element nicknameElem = DocumentHelper.createElement("nickname");
        nicknameElem.setText(fromUserNickName);
        fromUserInfoElem.add(nicknameElem);
        Element avatarTypeElem = DocumentHelper.createElement("avatartype");
        avatarTypeElem.setText(avatarType);
        fromUserInfoElem.add(avatarTypeElem);
        Element avatarDataElem = DocumentHelper.createElement("avatardata");
        avatarDataElem.setText(avatarData);
        fromUserInfoElem.add(avatarDataElem);
        Element dateElem = DocumentHelper.createElement("date");
        dateElem.setText(dateStr);
        fromUserInfoElem.add(dateElem);

        return itemElem;
    }

    @SuppressWarnings("deprecation")
    public IQ getGoodJobList(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getGoodJobList::iq is null");
            return ret;
        }
        String itemId = getMessageFromGetGoodJobListXMPP(iq);
        if (itemId == null) {
            Log.error("MessageOptionAdapter#getGoodJobList::itemId is null");
            return ret;
        }

        Message savedMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        if (savedMessage == null) {
            Log.error("MessageOptionAdapter#getGoodJobList::savedMessage got from DB is null.");
            return ret;
        }

        List<GoodJob> goodJobList = GoodJobAdapter.getInstance().getGoodJobList(itemId);

        ret = createGoodJobListResultIQ(iq, goodJobList);

        return ret;
    }

    @SuppressWarnings("deprecation")
    public IQ getGoodJobTotal(IQ iq) {
        Log.debug("do func  MessageOptionAdapter.getGoodJobTotal(");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getGoodJobTotal::iq is null");
            return ret;
        }
        Hashtable params = getMessageFromGetGoodJobTotalXMPP(iq);
        if (params == null) {
            Log.error("MessageOptionAdapter#getGoodJobTotal::params is null");
            return ret;
        }

        GoodJobCounting goodJobData
            = GoodJobCountingStoreDbHelper.getGoodJobTotal((String)params.get("dateFrom"),
                                                           (String)params.get("dateTo"),
                                                           (String)params.get("jid"));
        ret = createGoodJobTotalResultIQ(iq, goodJobData);

        return ret;
    }

    @SuppressWarnings("deprecation")
    public IQ getGoodJobRanking(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getGoodJobRanking::iq is null");
            return ret;
        }
        Hashtable params = getMessageFromGetGoodJobRankingXMPP(iq);
        if (params == null) {
            Log.error("MessageOptionAdapter#getGoodJobRanking::params is null");
            return ret;
        }

        List<GoodJobCounting> goodJobData
            = GoodJobCountingStoreDbHelper.getGoodJobRanking((String)params.get("dateFrom"),
                                                             (String)params.get("dateTo"),
                                                             Integer.parseInt((String)params.get("rankBottom")),
                                                             Integer.parseInt((String)params.get("limit")),
                                                             Integer.parseInt((String)params.get("offset")));
        Hashtable<String,Profile> profileList = new Hashtable<String,Profile>();
        for(GoodJobCounting goodJobd : goodJobData){
            Profile profile = UserProfileDbHelper.getUserProfileData(goodJobd.getJid());
            profileList.put(goodJobd.getJid(), profile);
        }

        ret = createGoodJobRankingResultIQ(iq, goodJobData, profileList);
        return ret;
    }

    @SuppressWarnings("deprecation")
    private IQ createGoodJobListResultIQ(IQ iq, List<GoodJob> goodJobList) {
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageOptionAdapter#createGoodJobListResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#createGoodJobListResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#createGoodJobListResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#createGoodJobListResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 0;
        if (goodJobList != null) {
            itemCount = goodJobList.size();
        }
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        List<Element> itemElemList = GoodJobAdapter.getInstance()
                .createGoodJobElementList(goodJobList);
        if (itemElemList != null) {
            for (Element itemElem : itemElemList) {
                if (itemElem == null) {
                    continue;
                }
                itemsElem.add(itemElem);
            }
        }
        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private IQ createGoodJobTotalResultIQ(IQ iq, GoodJobCounting goodJobData) {
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageOptionAdapter#createGoodJobListResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#createGoodJobListResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#createGoodJobListResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#createGoodJobListResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");

        Element itemElem = DocumentHelper.createElement("item");

        Element rankElem = DocumentHelper.createElement("rank");
        if(goodJobData != null &&
           goodJobData.getRank() != null){
            rankElem.setText(goodJobData.getRank().toString());
            itemElem.add(rankElem);
        }else{
            Log.error("MessageOptionAdapter#createGoodJobTotalResultIQ::rank is invalid");
            return ret;
        }

        Element jidElem = DocumentHelper.createElement("jid");
        if(goodJobData != null &&
           goodJobData.getJid() != null){
            jidElem.setText(goodJobData.getJid());
            itemElem.add(jidElem);
        }else{
            Log.error("MessageOptionAdapter#createGoodJobTotalResultIQ::jid is invalid");
            return ret;
        }

        Element pointsElem = DocumentHelper.createElement("points");
        if(goodJobData != null &&
           goodJobData.getPoint() != null){
            pointsElem.setText(goodJobData.getPoint().toString());
            itemElem.add(pointsElem);
        }else{
            Log.error("MessageOptionAdapter#createGoodJobTotalResultIQ::point is invalid");
            return ret;
        }
        itemsElem.add(itemElem);

        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private IQ createGoodJobRankingResultIQ(IQ iq,
                                            List<GoodJobCounting> goodJobData,
                                            Hashtable<String,Profile> profileList) {
        Log.debug("do func  MessageOptionAdapter.createGoodJobRankingResultIQ(");
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageOptionAdapter#createGoodJobRankingResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#createGoodJobRankingResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#createGoodJobRankingResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#createGoodJobRankingResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");

        for(int i=0;i<goodJobData.size();i++){
            Element itemElem = DocumentHelper.createElement("item");

            Element rankElem = DocumentHelper.createElement("rank");
            if(goodJobData.get(i) != null &&
               goodJobData.get(i).getRank() != null){
                rankElem.setText(goodJobData.get(i).getRank().toString());
                itemElem.add(rankElem);
            }else{
                Log.error("MessageOptionAdapter#createGoodJobRankingResultIQ::rank is invalid");
                return ret;
            }

            Element jidElem = DocumentHelper.createElement("jid");
            String jid = "";
            if(goodJobData.get(i) != null &&
               goodJobData.get(i).getJid() != null){
                jid = goodJobData.get(i).getJid();
                jidElem.setText(jid);
                itemElem.add(jidElem);
            }else{
                Log.error("MessageOptionAdapter#createGoodJobRankingResultIQ::jid is invalid");
                return ret;
            }

            Element pointsElem = DocumentHelper.createElement("points");
            if(goodJobData.get(i) != null &&
               goodJobData.get(i).getPoint() != null){
                pointsElem.setText(goodJobData.get(i).getPoint().toString());
                itemElem.add(pointsElem);
            }else{
                Log.error("MessageOptionAdapter#createGoodJobRankingResultIQ::point is invalid");
                return ret;
            }

            String userName = profileList.get(jid).getUserName();
            String userNickName = profileList.get(jid).getNickName();
            String affiliation = profileList.get(jid).getAffiliation();
            String avatarType = profileList.get(jid).getPhotoType();
            String avatarData = profileList.get(jid).getPhotoData();

            Element nameElem = DocumentHelper.createElement("name");
            nameElem.setText(userName);
            itemElem.add(nameElem);
            Element nicknameElem = DocumentHelper.createElement("nickname");
            nicknameElem.setText(userNickName);
            itemElem.add(nicknameElem);
            Element affiliationElem = DocumentHelper.createElement("affiliation");
            affiliationElem.setText(affiliation);
            itemElem.add(affiliationElem);
            Element avatarTypeElem = DocumentHelper.createElement("avatartype");
            avatarTypeElem.setText(avatarType);
            itemElem.add(avatarTypeElem);
            Element avatarDataElem = DocumentHelper.createElement("avatardata");
            avatarDataElem.setText(avatarData);
            itemElem.add(avatarDataElem);
            itemsElem.add(itemElem);
        }

        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private Hashtable<String, String> getMessageFromGetGoodJobTotalXMPP(IQ iq) {
        Log.debug("do func  MessageOptionAdapter.getMessageFromGetGoodJobTotalXMPP(");
        Hashtable ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("GetGoodJobTotal")) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::type is invalid :: "
                    + ((type == null)? "null": type));
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::itemElementList is null");
            return ret;
        }
        int count = itemElementList.size();
        if (count != 1) {
            return ret;
        }
        Element itemElem = itemElementList.get(0);
        if (itemElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::itemElem is null.");
            return ret;
        }

        Element jidElem = itemElem.element("jid");
        if (jidElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::jidElem is null");
            return ret;
        }
        String jid = jidElem.getStringValue();
        if (jid == null || jid.equals("")) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::jid is invalid.");
            return ret;
        }

        Element dateFromElem = itemElem.element("date_from");
        String dateFrom = null;
        if (dateFromElem == null) {
            Log.debug("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::dateFromElem is null");
        }else{
            dateFrom = dateFromElem.getStringValue();
        }

        Element dateToElem = itemElem.element("date_to");
        String dateTo = null;
        if (dateToElem == null) {
            Log.debug("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::dateToElem is null");
        }else{
            dateTo = dateToElem.getStringValue();
        }
        Hashtable<String, String> params = new Hashtable<String, String>();
        params.put("dateFrom", dateFrom);
        params.put("dateTo", dateTo);
        params.put("jid", jid);
        return params;
    }

    @SuppressWarnings("deprecation")
    private Hashtable<String, String> getMessageFromGetGoodJobRankingXMPP(IQ iq) {
        Log.debug("do func  MessageOptionAdapter.getMessageFromGetGoodJobRankingXMPP(");
        Hashtable ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("GetGoodJobRanking")) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::type is invalid :: "
                    + ((type == null)? "null": type));
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::itemElementList is null");
            return ret;
        }
        int count = itemElementList.size();
        if (count != 1) {
            return ret;
        }
        Element itemElem = itemElementList.get(0);
        if (itemElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::itemElem is null.");
            return ret;
        }

        Element dateFromElem = itemElem.element("date_from");
        String dateFrom = null;
        if (dateFromElem == null) {
            Log.debug("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::dateFromElem is null");
        }else{
            dateFrom = dateFromElem.getStringValue();
        }

        Element dateToElem = itemElem.element("date_to");
        String dateTo = null;
        if (dateToElem == null) {
            Log.debug("MessageOptionAdapter#getMessageFromGetGoodJobRankingXMPP::dateToElem is null");
        }else{
            dateTo = dateToElem.getStringValue();
        }
        String rankBottom = "-1";
        Element rankBottomElem = itemElem.element("rank_bottom");
        if (rankBottomElem != null) {
            rankBottom = rankBottomElem.getStringValue();
            if (rankBottom == null || rankBottom.equals("")) {
                rankBottom = "-1";
            }
        }
        String limit = "-1";
        Element limitElem = itemElem.element("limit");
        if (limitElem != null) {
            limit = limitElem.getStringValue();
            if (limit == null || limit.equals("")) {
                limit = "-1";
            }
        }
        String offset = "-1";
        Element offsetElem = itemElem.element("offset");
        if (offsetElem != null) {
            offset = offsetElem.getStringValue();
            if (offset == null || offset.equals("")) {
                offset = "-1";
            }
        }
        Hashtable<String, String> params = new Hashtable<String, String>();
        params.put("dateFrom", dateFrom);
        params.put("dateTo", dateTo);
        params.put("rankBottom", rankBottom);
        params.put("limit", limit);
        params.put("offset", offset);
        return params;
    }

    @SuppressWarnings("deprecation")
    private String getMessageFromGetGoodJobListXMPP(IQ iq) {
        String ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("GetGoodJobList")) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::type is invalid :: "
                    + ((type == null)? "null": type));
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::itemElementList is null");
            return ret;
        }
        int count = itemElementList.size();
        if (count != 1) {
            return ret;
        }
        Element itemElem = itemElementList.get(0);
        if (itemElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::itemElem is null.");
            return ret;
        }
        Element itemIdElem = itemElem.element("item_id");
        if (itemIdElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::itemIdElem is null");
            return ret;
        }
        String itemId = itemIdElem.getStringValue();
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobListXMPP::itemId is invalid.");
            return ret;
        }
        ret = itemId;
        return ret;

    }

    @SuppressWarnings("deprecation")
    public IQ getEmotionPointList(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getEmotionPointList::iq is null");
            return ret;
        }
        String itemId = getMessageFromGetEmotionPointListXMPP(iq);
        if (itemId == null) {
            Log.error("MessageOptionAdapter#getEmotionPointList::itemId is null");
            return ret;
        }

        Message savedMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        if (savedMessage == null) {
            Log.error("MessageOptionAdapter#getEmotionPointList::savedMessage got from DB is null.");
            return ret;
        }

        List<EmotionPoint> emotionPointList = EmotionPointAdapter.getInstance().getEmotionPointList(itemId);

        String emotionPointIconJson = EmotionPointStoreDbHelper.getEmotionPointIconJson(itemId);

        ret = createEmotionPointListResultIQ(iq, emotionPointList, emotionPointIconJson);

        return ret;
    }

    @SuppressWarnings("deprecation")
    public IQ getEmotionPointTotal(IQ iq) {
        Log.debug("do func  MessageOptionAdapter.getEmotionPointTotal(");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getEmotionPointTotal::iq is null");
            return ret;
        }
        Hashtable params = getMessageFromGetEmotionPointTotalXMPP(iq);
        if (params == null) {
            Log.error("MessageOptionAdapter#getEmotionPointTotal::params is null");
            return ret;
        }

        EmotionPointCounting emotionPointData
            = EmotionPointCountingStoreDbHelper.getEmotionPointTotal((String)params.get("dateFrom"),
                                                                     (String)params.get("dateTo"),
                                                                     (String)params.get("jid"));
        ret = createEmotionPointTotalResultIQ(iq, emotionPointData);

        return ret;
    }

    @SuppressWarnings("deprecation")
    public IQ getEmotionPointRanking(IQ iq) {
        Log.debug("do func  MessageOptionAdapter.getEmotionPointTotal(");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getEmotionPointTotal::iq is null");
            return ret;
        }
        Hashtable params = getMessageFromGetEmotionPointRankingXMPP(iq);
        if (params == null) {
            Log.error("MessageOptionAdapter#getEmotionPointRanking::params is null");
            return ret;
        }

        List<EmotionPointCounting>  emotionPointData
            = EmotionPointCountingStoreDbHelper.getEmotionPointRanking((String)params.get("dateFrom"),
                                                                       (String)params.get("dateTo"),
                                                                       Integer.parseInt((String)params.get("rankBottom")),
                                                                       Integer.parseInt((String)params.get("limit")),
                                                                       Integer.parseInt((String)params.get("offset")));
        Hashtable<String,Profile> profileList = new Hashtable<String,Profile>();
        for(EmotionPointCounting emotionpointd : emotionPointData){
            Profile profile = UserProfileDbHelper.getUserProfileData(emotionpointd.getJid());
            profileList.put(emotionpointd.getJid(), profile);
        }

        ret = createEmotionPointRankingResultIQ(iq, emotionPointData, profileList);

        return ret;
    }

    @SuppressWarnings("deprecation")
    private IQ createEmotionPointListResultIQ(IQ iq, List<EmotionPoint> emotionPointList, String emotionPointIconJson) {
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageOptionAdapter#createEmotionPointListResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#createEmotionPointListResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#createEmotionPointListResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#createEmotionPointListResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 0;
        if (emotionPointList != null) {
            itemCount = emotionPointList.size();
        }
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        List<Element> itemElemList = EmotionPointAdapter.getInstance()
            .createEmotionPointElementList(emotionPointList, emotionPointIconJson);
        if (itemElemList != null) {
            for (Element itemElem : itemElemList) {
                if (itemElem == null) {
                    continue;
                }
                itemsElem.add(itemElem);
            }
        }
        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private String getMessageFromGetEmotionPointListXMPP(IQ iq) {
        String ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("GetEmotionPointList")) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::type is invalid :: "
                    + ((type == null)? "null": type));
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemElementList is null");
            return ret;
        }
        int count = itemElementList.size();
        if (count != 1) {
            return ret;
        }
        Element itemElem = itemElementList.get(0);
        if (itemElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemElem is null.");
            return ret;
        }
        Element itemIdElem = itemElem.element("item_id");
        if (itemIdElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemIdElem is null");
            return ret;
        }
        String itemId = itemIdElem.getStringValue();
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemId is invalid.");
            return ret;
        }
        ret = itemId;
        return ret;

    }

    @SuppressWarnings("deprecation")
    private IQ createEmotionPointTotalResultIQ(IQ iq, EmotionPointCounting emotionPointData) {
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageOptionAdapter#createEmotionPointListResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#createEmotionPointListResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#createEmotionPointListResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#createEmotionPointListResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");

        Element itemElem = DocumentHelper.createElement("item");

        Element rankElem = DocumentHelper.createElement("rank");
        if(emotionPointData != null &&
           emotionPointData.getRank() != null){
            rankElem.setText(emotionPointData.getRank().toString());
            itemElem.add(rankElem);
        }else{
            Log.error("MessageOptionAdapter#createEmotionPointTotalResultIQ::rank is invalid");
            return ret;
        }

        Element jidElem = DocumentHelper.createElement("jid");
        if(emotionPointData != null &&
           emotionPointData.getJid() != null){
            jidElem.setText((String)emotionPointData.getJid());
            itemElem.add(jidElem);
        }else{
            Log.error("MessageOptionAdapter#createEmotionPointTotalResultIQ::jid is invalid");
            return ret;
        }

        Element pointsElem = DocumentHelper.createElement("points");
        if(emotionPointData != null &&
           emotionPointData.getPoint() != null){
            pointsElem.setText(emotionPointData.getPoint().toString());
            itemElem.add(pointsElem);
        }else{
            Log.error("MessageOptionAdapter#createEmotionPointTotalResultIQ::point is invalid");
            return ret;
        }
        itemsElem.add(itemElem);

        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private Hashtable<String, String> getMessageFromGetEmotionPointTotalXMPP(IQ iq) {
        Hashtable ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("GetThanksPointsTotal")) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::type is invalid :: "
                    + ((type == null)? "null": type));
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemElementList is null");
            return ret;
        }
        int count = itemElementList.size();
        if (count != 1) {
            return ret;
        }
        Element itemElem = itemElementList.get(0);
        if (itemElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemElem is null.");
            return ret;
        }

        Element jidElem = itemElem.element("jid");
        if (jidElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::jidElem is null");
            return ret;
        }
        String jid = jidElem.getStringValue();
        if (jid == null || jid.equals("")) {
            Log.error("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::jid is invalid.");
            return ret;
        }

        Element dateFromElem = itemElem.element("date_from");
        String dateFrom = null;
        if (dateFromElem == null) {
            Log.debug("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::dateFromElem is null");
        }else{
            dateFrom = dateFromElem.getStringValue();
        }

        Element dateToElem = itemElem.element("date_to");
        String dateTo = null;
        if (dateToElem == null) {
            Log.debug("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::dateToElem is null");
        }else{
            dateTo = dateToElem.getStringValue();
        }
        Hashtable<String, String> params = new Hashtable<String, String>();
        params.put("dateFrom", dateFrom);
        params.put("dateTo", dateTo);
        params.put("jid", jid);
        return params;
    }

    @SuppressWarnings("deprecation")
    private IQ createEmotionPointRankingResultIQ(IQ iq,
                                                 List<EmotionPointCounting> emotionPointData,
                                                 Hashtable<String,Profile> profileList) {
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageOptionAdapter#createEmotionPointRankingResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#createEmotionPointRankingResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#createEmotionPointRankingResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
            || !(namespace
                 .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#createEmotionPointRankingResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");

        for(int i=0;i<emotionPointData.size();i++){
            Element itemElem = DocumentHelper.createElement("item");

            Element rankElem = DocumentHelper.createElement("rank");
            if(emotionPointData.get(i) != null &&
               emotionPointData.get(i).getRank() != null){
                rankElem.setText(emotionPointData.get(i).getRank().toString());
                itemElem.add(rankElem);
            }else{
                Log.error("MessageOptionAdapter#createEmotionPointRankingResultIQ::rank is invalid");
                return ret;
            }
            Element jidElem = DocumentHelper.createElement("jid");
            String jid = "";
            if(emotionPointData.get(i) != null &&
               emotionPointData.get(i).getJid() != null){
                jid = emotionPointData.get(i).getJid();
                jidElem.setText(jid);
                itemElem.add(jidElem);
            }else{
                Log.error("MessageOptionAdapter#createEmotionPointRankingResultIQ::jid is invalid");
                return ret;
            }
            Element pointsElem = DocumentHelper.createElement("points");
            if(emotionPointData.get(i) != null &&
               emotionPointData.get(i).getPoint() != null){
                pointsElem.setText(emotionPointData.get(i).getPoint().toString());
                itemElem.add(pointsElem);
            }else{
                Log.error("MessageOptionAdapter#createEmotionPointRankingResultIQ::point is invalid");
                return ret;
            }

            String userName = profileList.get(jid).getUserName();
            String userNickName = profileList.get(jid).getNickName();
            String affiliation = profileList.get(jid).getAffiliation();
            String avatarType = profileList.get(jid).getPhotoType();
            String avatarData = profileList.get(jid).getPhotoData();

            Element nameElem = DocumentHelper.createElement("name");
            nameElem.setText(userName);
            itemElem.add(nameElem);
            Element nicknameElem = DocumentHelper.createElement("nickname");
            nicknameElem.setText(userNickName);
            itemElem.add(nicknameElem);
            Element affiliationElem = DocumentHelper.createElement("affiliation");
            affiliationElem.setText(affiliation);
            itemElem.add(affiliationElem);
            Element avatarTypeElem = DocumentHelper.createElement("avatartype");
            avatarTypeElem.setText(avatarType);
            itemElem.add(avatarTypeElem);
            Element avatarDataElem = DocumentHelper.createElement("avatardata");
            avatarDataElem.setText(avatarData);
            itemElem.add(avatarDataElem);
            itemsElem.add(itemElem);
        }

        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private Hashtable<String, String> getMessageFromGetEmotionPointRankingXMPP(IQ iq) {
        Hashtable ret = null;
        if (iq == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/messageoption"))) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("GetThanksPointsRanking")) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::type is invalid :: "
                    + ((type == null)? "null": type));
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemsElem is null");
            return ret;
        }

        List<Element> itemElementList = itemsElem.elements();
        if (itemElementList == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemElementList is null");
            return ret;
        }
        int count = itemElementList.size();
        if (count != 1) {
            return ret;
        }
        Element itemElem = itemElementList.get(0);
        if (itemElem == null) {
            Log.error("MessageOptionAdapter#getMessageFromGetEmotionPointListXMPP::itemElem is null.");
            return ret;
        }

        Element dateFromElem = itemElem.element("date_from");
        String dateFrom = null;
        if (dateFromElem == null) {
            Log.debug("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::dateFromElem is null");
        }else{
            dateFrom = dateFromElem.getStringValue();
        }

        Element dateToElem = itemElem.element("date_to");
        String dateTo = null;
        if (dateToElem == null) {
            Log.debug("MessageOptionAdapter#getMessageFromGetGoodJobTotalXMPP::dateToElem is null");
        }else{
            dateTo = dateToElem.getStringValue();
        }
        String rankBottom = "-1";
        Element rankBottomElem = itemElem.element("rank_bottom");
        if (rankBottomElem != null) {
            rankBottom = rankBottomElem.getStringValue();
            if (rankBottom == null || rankBottom.equals("")) {
                rankBottom = "-1";
            }
        }
        String limit = "-1";
        Element limitElem = itemElem.element("limit");
        if (limitElem != null) {
            limit = limitElem.getStringValue();
            if (limit == null || limit.equals("")) {
                limit = "-1";
            }
        }
        String offset = "-1";
        Element offsetElem = itemElem.element("offset");
        if (offsetElem != null) {
            offset = offsetElem.getStringValue();
            if (offset == null || offset.equals("")) {
                offset = "-1";
            }
        }
        Hashtable<String, String> params = new Hashtable<String, String>();
        params.put("dateFrom", dateFrom);
        params.put("dateTo", dateTo);
        params.put("rankBottom", rankBottom);
        params.put("limit", limit);
        params.put("offset", offset);
        return params;

    }

}
