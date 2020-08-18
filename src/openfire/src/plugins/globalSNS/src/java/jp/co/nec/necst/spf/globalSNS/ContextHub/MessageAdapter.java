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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.math.BigInteger;

import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomMember;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityMember;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.ThreadTitle;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;
import jp.co.nec.necst.spf.globalSNS.Data.PublicMessageQuestionnaireInfo;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Data.MessageFilter.ItemCondition;
import jp.co.nec.necst.spf.globalSNS.Data.MessageFilter.ItemCondition.ValueType;
import jp.co.nec.necst.spf.globalSNS.Data.MessageFilter.MessageFilter;
import jp.co.nec.necst.spf.globalSNS.Data.MessageFilter.MessageFilterCondition;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.MessageSortCondition;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.SortCondition;
import jp.co.nec.necst.spf.globalSNS.Group.CommunityManager;
import jp.co.nec.necst.spf.globalSNS.Notification.MessageNotifier;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Handler.IQThreadTitleUpdateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQThreadTitleUpdateHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.Handler.IQThreadTitleListGetHandler;
import jp.co.nec.necst.spf.globalSNS.Notification.PublicMessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.ChatMessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.GroupChatNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.CommunityNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.ThreadTitleNotifier;
import org.jivesoftware.openfire.XMPPServer;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Attribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class MessageAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(MessageAdapter.class);
    private static MessageAdapter mThisInstance = null;

    public static enum MESSAGE_OPERATION_TYPE {
        ADD, UPDATE, DELETE;
    }
    public final static String TYPE_SEARCH_ALL = "SearchAll";

    private MessageAdapter() {
    }

    public static MessageAdapter getInstance() {
        Log.debug("do func MessageAdapter.getInstance(...");
        if (mThisInstance == null) {
            mThisInstance = new MessageAdapter();
        }
        return mThisInstance;
    }

    public IQ searchMessage(IQ iq) {
        Log.debug("do func MessageAdapter.searchMessage(...");
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageAdapter#searchMessage::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.warn("MessageAdapter#searchMessage::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageAdapter#searchMessage::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageAdapter#searchMessage::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/search"))) {
            Log.error("MessageAdapter#searchMessage::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageAdapter#searchMessage::contentElem is null");
            return ret;
        }
        Element conditionElem = contentElem.element("condition");
        if (conditionElem == null) {
            Log.error("MessageAdapter#searchMessage::conditionElem is null");
            return ret;
        }
        Element filterElem = conditionElem.element("filter");
        if (filterElem == null) {
            Log.error("MessageAdapter#searchMessage::filterElem is null");
            return ret;
        }

        boolean isFeedInFilter = false;
        if(hasFilterItemKeysValue(filterElem, "msgtype", "1")){
            isFeedInFilter = true;
        }

        MessageFilterCondition filterCondition = MessageFilter
            .createFilterConditionFromFilterElement(filterElem);
        if (filterCondition == null) {
            Log.error("MessageAdapter#searchMessage::filterCondition failed");
            return ret;
        }
        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("MessageAdapter#searchMessage::from jid is null");
            return ret;
        }
        String fromJidStr = fromJid.toBareJID();
        if (fromJidStr == null || fromJidStr.equals("")) {
            Log.error("MessageAdapter#searchMessage::from jid string is invalid");
            return ret;
        }
        if(contentElem.element("type") == null ||
           ! contentElem.element("type").getText().equals(TYPE_SEARCH_ALL)){
            filterCondition = MessageFilter.addRefinedFilter(filterCondition,
                                                             fromJidStr,
                                                             isFeedInFilter);
            if (filterCondition == null) {
                Log.error("MessageAdapter#searchMessage::addedRefinedFilterCondition failed");
                return ret;
            }
        }
        Element sortElem = conditionElem.element("sort");
        if (sortElem == null) {
            Log.error("MessageAdapter#searchMessage::sortElem is null");
            return ret;
        }
        MessageSortCondition sortCondition = MessageSortCondition
                .createSortConditionFromSortElement(sortElem);
        if (sortCondition == null) {
            Log.error("MessageAdapter#searchMessage::sortCondition is null");
            return ret;
        }
        Element startIdElem = contentElem.element("startid");
        if (startIdElem == null) {
            Log.error("MessageAdapter#searchMessage::startIdElem is null");
            return ret;
        }
        String startIdStr = startIdElem.getStringValue();
        if (startIdStr == null || startIdStr.equals("")) {
            Log.error("MessageAdapter#searchMessage::startIdStr is invalid");
            return ret;
        }
        int startId = 0;
        try {
            startId = Integer.parseInt(startIdStr);
        } catch (NumberFormatException e) {
            Log.error("MessageAdapter#searchMessage::startIdStr is not number");
            return ret;
        }
        Element countElem = contentElem.element("count");
        if (countElem == null) {
            Log.error("MessageAdapter#searchMessage::countElem is null");
            return ret;
        }
        String countStr = countElem.getStringValue();
        if (countStr == null || countStr.equals("")) {
            Log.error("MessageAdapter#searchMessage::countStr is invalid");
            return ret;
        }
        int requestCount = 0;
        try {
            requestCount = Integer.parseInt(countStr);
        } catch (NumberFormatException e) {
            Log.error("MessageAdapter#searchMessage::countStr is not number");
            return ret;
        }
        List<Message> messageList = MessageStoreDbHelper.searchMessage(startId,
                requestCount, filterCondition, sortCondition, fromJidStr);
        if (messageList == null) {
            Log.error("MessageAdapter#searchMessage::messageList is null");
            return ret;
        }
        int allMessageCount = MessageStoreDbHelper
                .getMessageCount(filterCondition);
        int messageListCount = messageList.size();
        List<String> parentTaskItemIdList = new ArrayList<String>();
        for (int i = 0; i < messageListCount; i++) {
            Message messageItem = messageList.get(i);
            if (messageItem == null) {
                continue;
            }
            if (messageItem.getMsgType() == Message.TYPE_TASK) {
                String itemId = messageItem.getItemId();
                messageItem.setTaskNoteList(TaskNoteStoreDbHelper
                        .getTaskNoteData(itemId));
                messageItem.setSiblingTaskList(TaskMessageDbHelper
                        .getSiblingTaskList(messageItem));
                parentTaskItemIdList.add(itemId);
            } else if(messageItem.getMsgType() == Message.TYPE_QUESTIONNAIRE) {
                QuestionnaireAdapter.getInstance().appendExtraQuestionnaireData(messageItem, fromJidStr);   
            }
        }
        List<Message> childrenTaskList = TaskMessageDbHelper
                .getChildrenTaskList(parentTaskItemIdList);
        int childrenTaskListSize = 0;
        if (childrenTaskList != null) {
            childrenTaskListSize = childrenTaskList.size();
            for (int i = childrenTaskListSize - 1; i >= 0; i--) {
                Message childrenTaskMessage = childrenTaskList.get(i);
                if (childrenTaskMessage == null) {
                    childrenTaskList.remove(i);
                    continue;
                }
                String itemId = childrenTaskMessage.getItemId();
                childrenTaskMessage.setTaskNoteList(TaskNoteStoreDbHelper
                        .getTaskNoteData(itemId));
            }
        }
        for (int i = 0; i < messageListCount; i++) {
            Message messageItem = messageList.get(i);
            List<GoodJob> goodJobList = GoodJobStoreDbHelper
                    .getGoodJobData(messageItem.getItemId());
            messageItem.setGoodJobList(goodJobList);

            List<EmotionPoint> emotionPointList = EmotionPointStoreDbHelper
                .getEmotionPointData(messageItem.getItemId());
            messageItem.setEmotionPointList(emotionPointList);

            String emotionPointIconJson = EmotionPointStoreDbHelper.getEmotionPointIconJson(messageItem.getItemId());
            messageItem.setEmotionPointIconJson(emotionPointIconJson);

            Note note = NoteStoreDbHelper
                .getNoteData(messageItem.getThreadRootId());
            messageItem.setNote(note);
        }

        for (int i = 0; i < messageListCount; i++) {
            Message messageItem = messageList.get(i);
            if(messageItem.getQuotationMessageId() == null ||
               messageItem.getQuotationMessageId().compareTo(new BigInteger("0")) < 0){
                messageItem.setQuotationMessageData(new QuotationMessage());
                continue;
            }
            QuotationMessage quotationMessageData
                = MessageStoreDbHelper.getQuotationMessageData(messageItem.getQuotationMessageId());
            messageItem.setQuotationMessageData(quotationMessageData);
        }

        return createSearchResultIQ(iq, messageList, childrenTaskList,
                allMessageCount);
    }

    private IQ createSearchResultIQ(IQ iq, List<Message> messageList,
            List<Message> childrenMessageList, int searchAllCount) {
        Log.debug("do func MessageAdapter.createSearchResultIQ(...");
        IQ ret = null;
        if (iq == null) {
            Log.warn("MessageAdapter#createSearchResultIQ::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageAdapter#createSearchResultIQ::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageAdapter#createSearchResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/search"))) {
            Log.error("MessageAdapter#createSearchResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element extrasElem = DocumentHelper.createElement("extras");
        Element allItemCountElem = DocumentHelper
                .createElement("all_item_count");
        allItemCountElem.setText(String.valueOf(searchAllCount));
        extrasElem.add(allItemCountElem);
        Element childrenItemsElem = DocumentHelper
                .createElement("children_items");
        int childrenCount = 0;
        if (childrenMessageList != null) {
            childrenCount = childrenMessageList.size();
        }
        childrenItemsElem.addAttribute("count", String.valueOf(childrenCount));
        for (int i = 0; i < childrenCount; i++) {
            Message childItem = childrenMessageList.get(i);
            Element childItemElem = getMessageItemElement(childItem);
            if (childItemElem == null) {
                Log.error("MessageAdapter#createSearchResultIQ::childItemElem is null");
                continue;
            }
            childrenItemsElem.add(childItemElem);
        }
        extrasElem.add(childrenItemsElem);
        newContentElem.add(extrasElem);
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 0;
        if (messageList != null) {
            itemCount = messageList.size();
        }
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        for (int i = 0; i < itemCount; i++) {
            Message item = messageList.get(i);
            Element itemElem = getMessageItemElement(item);
            if (itemElem == null) {
                Log.error("MessageAdapter#createSearchResultIQ::itemElem is null");
                continue;
            }
            itemsElem.add(itemElem);
        }
        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);

        return replyPacket;
    }

    public Message getMessageWithoutReadInfo(String itemId) {
        Log.debug("do func MessageAdapter.getMessageWithoutReadInfo(...");
        Message ret = null;
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageAdapter#getMessge::itemId is invalid");
            return ret;
        }
        Message message = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        if (message == null) {
            Log.error("MessageAdapter#getMessge::message is NULL");
            return ret;
        }
        List<GoodJob> goodJobList = GoodJobStoreDbHelper.getGoodJobData(itemId);
        message.setGoodJobList(goodJobList);

        QuotationMessage quotationMessageData
            = MessageStoreDbHelper.getQuotationMessageData(message.getQuotationMessageId());
        message.setQuotationMessageData(quotationMessageData);

        List<EmotionPoint> emotionPointList  = EmotionPointStoreDbHelper.getEmotionPointData(itemId);
        message.setEmotionPointList(emotionPointList);

        String emotionPointIconJson = EmotionPointStoreDbHelper.getEmotionPointIconJson(itemId);
        message.setEmotionPointIconJson(emotionPointIconJson);

        Note note  = NoteStoreDbHelper.getNoteData(message.getThreadRootId());
        message.setNote(note);

        switch (message.getMsgType()) {
            case Message.TYPE_PUBLIC:
            case Message.TYPE_CHAT:
            case Message.TYPE_GROUP_CAHT:
            case Message.TYPE_COMMUNITY:
            case Message.TYPE_SYSTEM:
            case Message.TYPE_MAIL:
            case Message.TYPE_MURMUR:
                break;
            case Message.TYPE_TASK:
                TaskMessageAdapter.getInstance().appendExtraTaskData(message);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                QuestionnaireAdapter.getInstance().appendExtraQuestionnaireData(message);
                break;
            default:
                break;
        }
        ret = message;
        return ret;
    }

    public Element getMessageItemElement(Message messageItem) {
        Log.debug("do func MessageAdapter.getMessageItemElement(...");
        Element ret = null;
        int messageType = messageItem.getMsgType();
        switch (messageType) {
            case Message.TYPE_PUBLIC:
                ret = PublicMessageAdapter.getInstance()
                        .getPublicMessageItemElement(messageItem);
                break;
            case Message.TYPE_CHAT:
                ret = ChatMessageAdapter.getInstance()
                        .getChatMessageItemElement(messageItem);
                break;
            case Message.TYPE_GROUP_CAHT:
                ret = GroupChatAdapter.getInstance()
                        .getGroupChatMessageItemElement(messageItem);
                break;
            case Message.TYPE_TASK:
                ret = TaskMessageAdapter.getInstance()
                        .getTaskMessageItemElement(messageItem);
                break;
            case Message.TYPE_COMMUNITY:
                ret = CommunityAdapter.getInstance()
                        .getCommunityMessageItemElement(messageItem);
                break;
            case Message.TYPE_SYSTEM:
                ret = SystemMessageAdapter.getInstance()
                        .getSystemMessageItemElemnt(messageItem);
                break;
            case Message.TYPE_MAIL:
                ret = MailCooperationAdapter.getInstance()
                        .getMailMessageItemElement(messageItem);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                ret = QuestionnaireAdapter.getInstance()
                        .getQuestionnaireMessageItemElement(messageItem);
                break;
            case Message.TYPE_MURMUR:
                ret = MurmurAdapter.getInstance()
                        .getMurmurMessageItemElement(messageItem);
                break;
            default:
                break;
        }
        if (ret == null) {
            return ret;
        }
        MessageExistingReaderAdapter.getInstance().setMessageReadInfo(ret,
                messageItem);
        return ret;
    }

    public List<String> extractJidListFromGoodJobList(List<GoodJob> goodJobList) {
        Log.debug("do func MessageAdapter.extractJidListFromGoodJobList(...");
        final String prefix = "extractJidListFromGoodJobList() :: ";
        List<String> ret = new ArrayList<String>();
        if (goodJobList == null) {
            Log.error(prefix + "goodJobList is null.", new Throwable());
            return ret;
        } else if (goodJobList.isEmpty()) {
            Log.info(prefix + "goodJobList is empty.");
            return ret;
        }
        for (GoodJob goodJob : goodJobList) {
            if (goodJob == null) {
                Log.debug("extractJidListFromGoodJobList::goodJob is null.");
                continue;
            }
            String jid = goodJob.getGjJid();
            if (jid == null || jid.equals("")) {
                Log.debug("extractJidListFromGoodJobList::jid is null or empty.");
                continue;
            }
            ret.add(jid);
        }

        return ret;
    }

    public List<String> extractJidListFromEmotionPointList(List<EmotionPoint> emotionPointList) {
        Log.debug("do func MessageAdapter.extractJidListFromEmotionPointList(...");
        final String prefix = "extractJidListFromEmotionPointList() :: ";
        List<String> ret = new ArrayList<String>();
        if (emotionPointList == null) {
            Log.error(prefix + "emotionPointList is null.", new Throwable());
            return ret;
        } else if (emotionPointList.isEmpty()) {
            Log.info(prefix + "emotionPointList is empty.");
            return ret;
        }
        for (EmotionPoint emotionPoint : emotionPointList) {
            if (emotionPoint == null) {
                Log.debug("extractJidListFromEmotionPointList::emotionPoint is null.");
                continue;
            }
            String jid = emotionPoint.getJid();
            if (jid == null || jid.equals("")) {
                Log.debug("extractJidListFromEmotionPointList::jid is null or empty.");
                continue;
            }
            ret.add(jid);
        }

        return ret;
    }

    public Message getMessageAppendReadInfo(String itemId,
            String jidForGetReadStatus) {
        Log.debug("do func MessageAdapter.getMessageAppendReadInfo(...");
        Message ret = null;
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageAdapter#getMessge::itemId is invalid");
            return ret;
        }
        Message message = MessageStoreDbHelper
                .getOneMessageAppendMessageReadInfoByItemId(itemId,
                        jidForGetReadStatus);
        if (message == null) {
            Log.error("MessageAdapter#getMessge::message is NULL");
            return ret;
        }
        List<GoodJob> goodJobList = GoodJobStoreDbHelper.getGoodJobData(itemId);
        message.setGoodJobList(goodJobList);

        QuotationMessage quotationMessageData
            = MessageStoreDbHelper.getQuotationMessageData(message.getQuotationMessageId());
        message.setQuotationMessageData(quotationMessageData);

        List<EmotionPoint> emotionPointList  = EmotionPointStoreDbHelper.getEmotionPointData(itemId);
        message.setEmotionPointList(emotionPointList);

        String emotionPointIconJson = EmotionPointStoreDbHelper.getEmotionPointIconJson(itemId);
        message.setEmotionPointIconJson(emotionPointIconJson);

        Note note  = NoteStoreDbHelper.getNoteData(message.getThreadRootId());
        message.setNote(note);

        switch (message.getMsgType()) {
            case Message.TYPE_PUBLIC:
            case Message.TYPE_CHAT:
            case Message.TYPE_GROUP_CAHT:
            case Message.TYPE_COMMUNITY:
            case Message.TYPE_SYSTEM:
            case Message.TYPE_MAIL:
                break;
            case Message.TYPE_TASK:
                TaskMessageAdapter.getInstance().appendExtraTaskData(message);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                QuestionnaireAdapter.getInstance()
                        .appendExtraQuestionnaireData(message, jidForGetReadStatus);
                break;
            default:
                break;
        }
        ret = message;
        return ret;
    }

    public boolean deleteMessage(IQ iq) {
        Log.debug("do func MessageAdapter.deleteMessage(...");
        if (iq == null) {
            Log.warn("MessageAdapter#deleteMessage::iq is null");
            return false;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.warn("MessageAdapter#deleteMessage::iq type is not set");
            return false;
        }
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageAdapter#deleteMessage::messageElem is null");
            return false;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageAdapter#deleteMessage::tagName is invalid");
            return false;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/delete"))) {
            Log.error("MessageAdapter#deleteMessage::namespace is invalid");
            return false;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageAdapter#deleteMessage::contentElem is null");
            return false;
        }
        Element itemIdElem = contentElem.element("item_id");
        if (itemIdElem == null) {
            Log.error("MessageAdapter#deleteMessage::itemIdElem is null");
            return false;
        }
        Element deleteFlagElem = contentElem.element("delete_flag");
        if (deleteFlagElem == null) {
            Log.error("MessageAdapter#deleteMessage::deleteFlagElem is null");
            return false;
        }
        int deleteFlag = Integer.parseInt(deleteFlagElem.getStringValue());
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("MessageAdapter#deleteMessage::type is null");
            return false;
        }
        String type = typeElem.getStringValue();

        String itemId = itemIdElem.getStringValue();
        Message dbMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        if (dbMessage == null) {
            Log.error("Target message is not found");
            return false;
        }

        if (type.equals("Delete")) {
            String deleteBy = dbMessage.getDeletedBy();
            if (deleteBy != null && deleteBy != "" && isDeletedByAdmin(deleteBy)) {
                Log.error("MessageAdapter#deleteMessage::already delete by delete");
                return false;
            }
            boolean isAuthor = checkMessageAuthor(dbMessage, fromJidStr);
            if (isAuthor == false) {
                Log.error("MessageAdapter#deleteMessage::not have permission to delete");
                return false;
            }
        }
        List<String> deleteItemList = getDeleteItemId(dbMessage.getMsgType(),
                itemId);
        int deleteCount = deleteItemList.size();

        for (int i = deleteCount - 1; i >= 0; i--) {
            String relatedItemId = deleteItemList.get(i);
            Message relatedMessage = MessageStoreDbHelper
                    .getOneMessageByItemIdWithoutReadInfo(relatedItemId);

            if (relatedMessage == null) {
                Log.error("Target message is not found");
                return false;
            }
            boolean retDelete = MessageStoreDbHelper.deleteMessage(
                    relatedItemId, deleteFlag, fromJidStr, type);
            if (!retDelete) {
                Log.error("MessageAdapter#deleteMessage::error to delete message");
                return false;
            }
            relatedMessage = MessageStoreDbHelper
                    .getOneMessageByItemIdRegardlessDeleteFlagWithoutReadInfo(relatedItemId);

            MessageNotifier.getInstance().notifyDeleteMessage(relatedMessage);
        }

        return true;
    }

    public static boolean isDeletedByAdmin(String deletedByJidStr) {
        Log.debug("do func MessageAdapter.isDeletedByAdmin(...");
        boolean ret = false;
        if (deletedByJidStr.startsWith(Message.DELETED_BY_ADMIN)) {
            ret = true;
        }
        return ret;
    }

    public Element getDeleteMessageItemElement(Message message) {
                Log.debug("do func MessageAdapter.getDeleteMessageItemElement(...");
        return setDeleteMessageItem(message);
    }

    private Element setDeleteMessageItem(Message deleteMessage) {
        Log.debug("do func MessageAdapter.setDeleteMessageItem(...");
        Element item = DocumentHelper.createElement("item");
        Element itemId = DocumentHelper.createElement("item_id");
        itemId.setText(deleteMessage.getItemId());
        item.add(itemId);
        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(String.valueOf(deleteMessage.getDeleteFlag()));
        item.add(deleteFlag);
        Element deletedBy = DocumentHelper.createElement("deleted_by");
        deletedBy.setText(deleteMessage.getDeletedBy());
        item.add(deletedBy);
        return item;
    }

    public boolean checkMessageAuthor(Message message, String fromJid) {
        Log.debug("do func MessageAdapter.checkMessageAuthor(...");
        boolean ret = false;
        int messageType = message.getMsgType();
        switch (messageType) {
            case Message.TYPE_PUBLIC:
                ret = isAuthor(message, fromJid);
                break;
            case Message.TYPE_CHAT:
                ret = isAuthor(message, fromJid);
                break;
            case Message.TYPE_GROUP_CAHT:
                ret = GroupChatAdapter.getInstance().checkHasDeletedPermission(
                        fromJid, message);
                break;
            case Message.TYPE_TASK:
                ret = TaskMessageAdapter.getInstance().checkMessageAuthor(
                        message, fromJid);
                break;
            case Message.TYPE_COMMUNITY:
                ret = isAuthor(message, fromJid);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                ret = isAuthor(message, fromJid);
                break;
            case Message.TYPE_SYSTEM:
                break;
            case Message.TYPE_MAIL:
                ret = MailCooperationAdapter.getInstance().checkMessageAuthor(
                        message, fromJid);
                break;
            default:
                ret = isAuthor(message, fromJid);
                break;
        }
        return ret;
    }

    private boolean isAuthor(Message message, String fromJid) {
        boolean ret = false;
        String msgFrom = message.getMsgFrom();
        if (msgFrom.equals(fromJid)) {
            ret = true;
        }
        return ret;
    }

    public List<String> getDeleteItemId(int messageType, String itemId) {
        Log.debug("do func MessageAdapter.getDeleteItemId(...");
        List<String> retList = new ArrayList<String>();

        switch (messageType) {
            case Message.TYPE_PUBLIC:
                retList.add(itemId);
                break;
            case Message.TYPE_CHAT:
                retList.add(itemId);
                break;
            case Message.TYPE_GROUP_CAHT:
                retList.add(itemId);
                break;
            case Message.TYPE_TASK:
                retList = TaskMessageAdapter.getInstance().getDeleteItemId(
                        itemId);
                break;
            case Message.TYPE_COMMUNITY:
                retList.add(itemId);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                retList.add(itemId);
                break;
            case Message.TYPE_MURMUR:
                retList.add(itemId);
                break;
            case Message.TYPE_SYSTEM:
                break;
            case Message.TYPE_MAIL:
                retList.add(itemId);
                break;
            default:
                break;
        }

        return retList;
    }

    public Set<String> getMessageReceiverSet(Message message) {
        Log.debug("do func MessageAdapter.getMessageReceiverSet(...");
        Set<String> ret = new HashSet<String>();
        if (message == null) {
            Log.error("MessageAdapter#getMessageReceiverList::message is null.");
            return ret;
        }
        int messageType = message.getMsgType();
        if(messageType == Message.TYPE_QUESTIONNAIRE){
            PublicMessageQuestionnaireInfo pmqi = message.getPublicmessageQuestionnaireInfo();
            if(pmqi == null ||
               ( pmqi.getRoomType() != 1 &&
                 pmqi.getRoomType() != 3 &&
                 pmqi.getRoomType() != 5)){
                return ret;
            }
            messageType = pmqi.getRoomType();
        }
        switch (messageType) {
            case Message.TYPE_GROUP_CAHT: {
                String chatRoomId = message.getMsgTo();
                List<ChatRoomMember> chatRoomMemberList = ChatRoomMemberStoreDbHelper
                        .getChatRoomMember(chatRoomId);
                if (chatRoomMemberList == null) {
                    Log.error("MessageAdapter#getMessageReceiverList::chatRoomMemberList is null.");
                    break;
                }
                for (ChatRoomMember chatRoomMember : chatRoomMemberList) {
                    if (chatRoomMember == null) {
                        continue;
                    }
                    String jid = chatRoomMember.getJid();
                    if (jid == null) {
                        continue;
                    }
                    ret.add(jid);
                }
                break;
            }
            case Message.TYPE_CHAT: {
                String toJid = message.getMsgTo();
                ret.add(toJid);
                String fromJid = message.getMsgFrom();
                ret.add(fromJid);
                break;
            }
            case Message.TYPE_SYSTEM: {
                ret.addAll(MessageSendToDbHelper.getSendToList(message
                        .getItemId()));
                break;
            }
            case Message.TYPE_COMMUNITY: {
                String communityId = message.getMsgTo();
                List<CommunityMember> communityMember = CommunityManager
                        .getInstance().getJoinMemberList(communityId);
                if (communityMember == null) {
                    Log.error("MessageAdapter#getMessageReceiverList::communityMember is null.");
                    break;
                }
                for (CommunityMember member : communityMember) {
                    if (member == null) {
                        continue;
                    }
                    String jid = member.getJid();
                    ret.add(jid);
                }
                break;
            }
            case Message.TYPE_PUBLIC: {
                ret = PublicMessageAdapter.getInstance()
                        .getPublicMessageReceiverSet();
                break;
            }
            case Message.TYPE_MURMUR: {
                ret = MurmurAdapter.getInstance()
                        .getMurmurMessageReceiverSet();
                break;
            }
            case Message.TYPE_TASK: {
                String communityId = message.getGroup();

                if ("".equals(communityId)) {
                    String owner = message.getOwner();
                    if (owner.equals("") == false) {
                        ret.add(owner);
                    }

                    String client = message.getClient();
                    if (client.equals("") == false
                            && client.equals(owner) == false) {
                        ret.add(client);
                    }
                } else {
                    List<CommunityMember> communityMember = CommunityManager
                            .getInstance().getJoinMemberList(communityId);
                    if (communityMember == null) {
                        Log.error("MessageAdapter#getMessageReceiverList::communityMember(task) is null.");
                        break;
                    }
                    for (CommunityMember member : communityMember) {
                        if (member == null) {
                            continue;
                        }
                        String jid = member.getJid();
                        ret.add(jid);
                    }
                }
                break;
            }
            case Message.TYPE_MAIL:
                ret.add(message.getMsgTo());
                break;
            default:
                break;
        }
        return ret;
    }

    public IQ getThreadMessage(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageAdapter#getThreadMessage::iq is null");
            return ret;
        }
        String itemId = getRequestItemIdFromGetThreadMessageXMPPRequest(iq);
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageAdapter#getThreadMessage::itemId is invalid");
            return ret;
        }

        List<String> itemIdList = getThreadMessageItemIDList(itemId, iq
                .getFrom().toBareJID());
        if (itemIdList == null) {
            Log.error("MessageAdapter#getThreadMessage::itemIdList is invalid");
            return ret;
        }

        ret = createGetThreadMessageResponsePacket(iq, itemIdList);
        return ret;
    }

    private String getRequestItemIdFromGetThreadMessageXMPPRequest(IQ iq) {
        String ret = "";
        if (iq == null) {
            Log.error("MessageAdapter#getRequestItemIdFromGetThreadMessageXMPPRequest::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MessageAdapter#getRequestItemIdFromGetThreadMessageXMPPRequest::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageAdapter#getRequestItemIdFromGetThreadMessageXMPPRequest::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageAdapter#getRequestItemIdFromGetThreadMessageXMPPRequest::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/threadmessage"))) {
            Log.error("MessageAdapter#getRequestItemIdFromGetThreadMessageXMPPRequest::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageAdapter#getRequestItemIdFromGetThreadMessageXMPPRequest::contentElem is null");
            return ret;
        }
        Element itemIdElem = contentElem.element("item_id");
        if (itemIdElem == null) {
            Log.error("MessageAdapter#getRequestItemIdFromGetThreadMessageXMPPRequest::itemIdElem is null");
            return ret;
        }
        String itemId = itemIdElem.getStringValue();
        ret = itemId;
        return ret;
    }

    public IQ receiveUpdateThreadTitle(IQ iq) {
        Log.debug("do func MessageAdapter.receiveUpdateThreadTitle(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageAdapter#receiveUpdateThreadTitle::iq is null");
            return ret;
        }
        int resultCode = setUpdateThreadTitleToDb(iq);
        if (resultCode !=  GlobalSNSUtils.API_STATUS_SUCCESS) {
            Log.warn("MessageAdapter#receiveUpdateThreadTitle::_reqDataCheck is false");
        }

        ret = createUpdateThreadTitleResponsePacket(iq, resultCode);
        return ret;
    }

    private int setUpdateThreadTitleToDb(IQ iq) {
        Log.debug("do func MessageAdapter.setUpdateThreadTitleToDb(...");
        if (iq == null) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::iq is null");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::iq type is not set");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::messageElem is null");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::tagName is invalid");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/threadtitleupdate"))) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::namespace is invalid");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::contentElem is null");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        Element threadTitleElem = contentElem.element("thread_title");
        if (threadTitleElem == null) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::threadTitleElem is null");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        String threadTitleStr = threadTitleElem.getText();
        Element threadRootIdElem = contentElem.element("thread_root_id");
        if (threadRootIdElem == null) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::threadRootIdElem is null");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        String threadRootIdStr = threadRootIdElem.getText();
        Element itemIdElem = contentElem.element("item_id");
        if (itemIdElem == null) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::itemIdElem is null");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        String itemIdStr = itemIdElem.getText();
        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb iq.getFrom is null");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        String fromJidStr = fromJid.toBareJID();
        String roomIdStr = null;
        Attribute typeAttr = contentElem.attribute("type");
        String type = typeAttr.getValue();
        if(type == null){
            Log.error("MessageAdapter#setUpdateThreadTitleToDb::type is null");
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        int messageTypeID = 0;
        if(IQThreadTitleUpdateHandler.ContentType
           .Public.equals(ContentType.toType(type))){
            messageTypeID = Message.TYPE_PUBLIC;
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Chat.equals(ContentType.toType(type))){
            messageTypeID = Message.TYPE_CHAT;
        }else if(IQThreadTitleUpdateHandler.ContentType
           .GroupChat.equals(ContentType.toType(type))){
            Element roomIdElem = contentElem.element("room_id");
            if (roomIdElem == null) {
                Log.error("MessageAdapter#setUpdateThreadTitleToDb::roomIdElem is null");
                return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
            }
            messageTypeID = Message.TYPE_GROUP_CAHT;
            roomIdStr = roomIdElem.getStringValue();
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Community.equals(ContentType.toType(type)) ){
            Element roomIdElem = contentElem.element("room_id");
            if (roomIdElem == null) {
                Log.error("MessageAdapter#setUpdateThreadTitleToDb::roomIdElem is null");
                return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
            }
            messageTypeID = Message.TYPE_COMMUNITY;
            roomIdStr = roomIdElem.getStringValue();
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Murmur.equals(ContentType.toType(type))){
            messageTypeID = Message.TYPE_MURMUR;
        }else{
            Log.error("not allow type :" + type);
            return  GlobalSNSUtils.API_STATUS_BAD_REQUEST;
        }
        if(! MessageStoreDbHelper.isThreadMember(messageTypeID,
                                                 itemIdStr,
                                                 threadRootIdStr,
                                                 fromJidStr)){
            Log.warn("MessageAdapter#setUpdateThreadTitleToDb "
                     + "MessageStoreDbHelper.getMessageFrom() not allow");
            return   GlobalSNSUtils.API_STATUS_FORBIDDEN;
        }
        if(MessageStoreDbHelper.copyThreadTitleToLogTable(threadRootIdStr) > 1){
            Log.warn("MessageAdapter#setUpdateThreadTitleToDb "
                     + "MessageStoreDbHelper.copyThreadTitleToLogTable() db error");
            return  GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR;
        }
        if(! MessageStoreDbHelper.setThreadTitle(threadTitleStr,
                                                threadRootIdStr,
                                                roomIdStr,
                                                fromJidStr )){
            Log.error("MessageAdapter#setUpdateThreadTitleToDb "
                      + "MessageStoreDbHelper.setThreadTitle() not succsess");
            return  GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR;
        }
        ThreadTitle threadTitle = new ThreadTitle();
        threadTitle.setThreadRootId(threadRootIdStr);
        threadTitle.setThreadTitle(threadTitleStr);
        threadTitle.setEditerJID(fromJidStr);
        threadTitle.setFromItemId(itemIdStr);
        if(IQThreadTitleUpdateHandler.ContentType
           .Public.equals(ContentType.toType(type)) ){
            threadTitle.setType("Public");
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Chat.equals(ContentType.toType(type))){
            threadTitle.setType("Chat");
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .GroupChat.equals(ContentType.toType(type))){
            threadTitle.setType("GroupChat");
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Community.equals(ContentType.toType(type))){
            threadTitle.setType("Community");
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Murmur.equals(ContentType.toType(type))){
            threadTitle.setType("Murmur");
        }
        ThreadTitleNotifier.getInstance().notifyThreadTitle(threadTitle);
        return GlobalSNSUtils.API_STATUS_SUCCESS;
    }

    private IQ createUpdateThreadTitleResponsePacket(IQ iq, int resultCode) {
        Log.debug("do func MessageAdapter.createThreadTitleResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageAdapter#createThreadTitleResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageAdapter#createThreadTitleResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (!(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageAdapter#createThreadTitleResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/threadtitleupdate"))) {
            Log.error("MessageAdapter#createThreadTitleResponsePacket::namespace is invalid:" + namespace);
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
            replyPacket.setChildElement(messageElem);
        }else{
            replyPacket.setType(IQ.Type.error);
            Element errorElm = DocumentHelper.createElement("error");
            errorElm.addAttribute("code",String.valueOf(resultCode));
            replyPacket.setChildElement(errorElm);
        }

        return replyPacket;
    }

    public IQ receiveGetThreadTitleList(IQ iq) {
        Log.debug("do func MessageAdapter.receiveGetListThreadTitle(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageAdapter#receiveGetListThreadTitle::iq is null");
            return ret;
        }
        try{
            ret = getThreadTitleList(iq);
            return ret;
        }catch(IllegalArgumentException e){
            Log.warn("MessageAdapter#receiveGetListThreadTitle::_reqDataCheck is false :" + e);
            ret = iq;
            ret.setType(IQ.Type.error);
            Element errorElm = DocumentHelper.createElement("error");
            errorElm.addAttribute("code", e.getMessage());
            ret.setChildElement(errorElm);
            return ret;
        }
    }

    private IQ getThreadTitleList(IQ iq) throws IllegalArgumentException {
        Log.debug("do func MessageAdapter.getThreadTitleList(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageAdapter#getThreadTitleList::iq is null");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        if (!iq.getType().equals(IQ.Type.get)) {
            Log.error("MessageAdapter#getThreadTitleList::iq type is not set");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageAdapter#getThreadTitleList::messageElem is null");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageAdapter#getThreadTitleList::tagName is invalid");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/threadtitlelistget"))) {
            Log.error("MessageAdapter#getThreadTitleList::namespace is invalid");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MessageAdapter#getThreadTitleList::contentElem is null");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("MessageAdapter#setUpdateThreadTitleToDb iq.getFrom is null");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String fromJidStr = fromJid.toBareJID();
        if (fromJidStr == null || fromJidStr.equals("")) {
            Log.error("MessageAdapter#getThreadTitleList::from jid string is invalid");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String msgToStr = null;
        String roomIdStr = null;
        Attribute typeAttr = contentElem.attribute("type");
        String type = typeAttr.getValue();
        if(type == null){
            Log.error("MessageAdapter#getThreadTitleList::type is null");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        int messageTypeID = 0;
        boolean withoutfeedAtAll = false;
        if(IQThreadTitleUpdateHandler.ContentType
           .Public.equals(ContentType.toType(type))){
            messageTypeID = Message.TYPE_PUBLIC;
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Chat.equals(ContentType.toType(type))){
            Element msgToElem = contentElem.element("msgto");
            if (msgToElem == null) {
                Log.error("MessageAdapter#getThreadTitleList::msgToElem is null");
                throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
            }
            messageTypeID = Message.TYPE_CHAT;
            msgToStr = msgToElem.getStringValue();
        }else if(IQThreadTitleUpdateHandler.ContentType
           .GroupChat.equals(ContentType.toType(type))){
            Element roomIdElem = contentElem.element("room_id");
            if (roomIdElem == null) {
                Log.error("MessageAdapter#getThreadTitleList::roomIdElem is null");
                throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
            }
            messageTypeID = Message.TYPE_GROUP_CAHT;
            roomIdStr = roomIdElem.getStringValue();
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Community.equals(ContentType.toType(type)) ){
            Element roomIdElem = contentElem.element("room_id");
            if (roomIdElem == null) {
                Log.error("MessageAdapter#getThreadTitleList::roomIdElem is null");
                throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
            }
            messageTypeID = Message.TYPE_COMMUNITY;
            roomIdStr = roomIdElem.getStringValue();
        }else if(type.equals("all") ){
            messageTypeID = Message.TYPE_ALL;
            Element filterElem = contentElem.element("filter");
            if(filterElem !=null){
                Element withoutfeedElem = filterElem.element("withoutfeed");
                if(withoutfeedElem !=null &&
                   withoutfeedElem.getStringValue().equals("1")){
                    withoutfeedAtAll = true;
                }
            }
        }else if(IQThreadTitleUpdateHandler.ContentType
                 .Murmur.equals(ContentType.toType(type))){
            Element msgToElem = contentElem.element("msgto");
            if (msgToElem == null) {
                Log.error("MessageAdapter#getThreadTitleList::msgToElem is null");
                throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
            }
            messageTypeID = Message.TYPE_MURMUR;
            msgToStr = msgToElem.getStringValue();
        }else{
            Log.error("MessageAdapter#getThreadTitleList not allow type :" + type);
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        ArrayList listData = MessageStoreDbHelper.getThreadTitleList(messageTypeID,
                                                                     roomIdStr,
                                                                     msgToStr,
                                                                     fromJidStr,
                                                                     withoutfeedAtAll);
        if(listData == null){
            Log.error("MessageAdapter#getThreadTitleList "
                      + "MessageStoreDbHelper.setThreadTitle() not succsess");
            throw new IllegalArgumentException( "" + GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR);
        }

        ret = IQ.createResultIQ(iq);
        ret.setType(IQ.Type.result);

        Element newContentElem = messageElem.element("content");
        Element extrasElem = DocumentHelper.createElement("extras");
        newContentElem.add(extrasElem);
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = listData.size();
        itemsElem.addAttribute("count", String.valueOf(itemCount));

        for(int i=0;i<listData.size();i++){
            Hashtable titleData = (Hashtable)listData.get(i);
            Element itemElem = DocumentHelper.createElement("item");
            Element idElem = DocumentHelper.createElement("id");
            idElem.setText((String) titleData.get("id"));
            itemElem.add(idElem);
            Element threatTitleElem = DocumentHelper.createElement("thread_title");
            threatTitleElem.setText((String) titleData.get("thread_title"));
            itemElem.add(threatTitleElem);
            Element threadRootIdElem = DocumentHelper.createElement("thread_root_id");
            threadRootIdElem.setText((String) titleData.get("thread_root_id"));
            itemElem.add(threadRootIdElem);
            Element editedAtElem = DocumentHelper.createElement("edited_at");
            editedAtElem.setText((String) titleData.get("edited_at"));
            itemElem.add(editedAtElem);
            Element roomNameElem = DocumentHelper.createElement("room_name");
            if(roomNameElem != null){
                roomNameElem.setText((String) titleData.get("room_name"));
                itemElem.add(roomNameElem);
            }
            Element msgtypeElem = DocumentHelper.createElement("msgtype");
            if(msgtypeElem != null){
                msgtypeElem.setText((String) titleData.get("msgtype"));
                itemElem.add(msgtypeElem);
            }
            itemsElem.add(itemElem);
        }
        newContentElem.add(itemsElem);
        messageElem.setParent(null);
        ret.setChildElement(messageElem);
        return ret;
    }

    private List<String> getThreadMessageItemIDList(String itemId,
            String fromJid) {
        List<String> ret = null;
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageAdapter#getThreadMessageItemIDList::itemId is invalid");
            return ret;
        }
        if (fromJid == null || fromJid.equals("")) {
            Log.error("MessageAdapter#getThreadMessageItemIDList::fromJid is invalid");
            return ret;
        }
        MessageFilterCondition itemIdFilterCondition = createItemIdFilterCondition(itemId);
        if (itemIdFilterCondition == null) {
            Log.error("MessageAdapter#getThreadMessageItemIDList::itemIdFilterCondition is null");
            return ret;
        }
        MessageFilterCondition filterCondition = MessageFilter
                .addRefinedFilter(itemIdFilterCondition, fromJid);
        if (filterCondition == null) {
            Log.error("MessageAdapter#getThreadMessageItemIDList::filterCondition is null");
            return ret;
        }
        MessageSortCondition sortCondition = new MessageSortCondition();
        List<String> sortItems = new ArrayList<String>();
        sortItems.add(MessageStoreDbHelper.COLUMN_ID_NAME);
        List<Integer> sortOrders = new ArrayList<Integer>();
        sortOrders.add(new Integer(SortCondition.SORT_ORDER_ASC));
        sortCondition.setData(sortItems, sortOrders);
        List<Message> messageList = MessageStoreDbHelper.searchAllMessage(
                filterCondition, sortCondition, fromJid);
        if (messageList == null) {
            Log.error("MessageAdapter#getThreadMessageItemIDList::messageList is null");
            return ret;
        }
        ret = new ArrayList<String>();
        if (messageList.size() < 1) {
            Log.info("MessageAdapter#getThreadMessageItemIDList::messageList count is 0");
            return ret;
        }
        Message message = messageList.get(0);
        if (message == null) {
            Log.info("MessageAdapter#getThreadMessageItemIDList::message is null");
            return ret;
        }
        String searchedMessageItemId = message.getItemId();
        if (searchedMessageItemId == null || searchedMessageItemId.equals("")) {
            Log.info("MessageAdapter#getThreadMessageItemIDList::searchedMessageItemId is invalid");
            return ret;
        }
        Map<String, Message> addedItemIdToMessage = new ConcurrentHashMap<String, Message>();
        ret.add(searchedMessageItemId);
        addedItemIdToMessage.put(searchedMessageItemId, message);
        for (int i = 0; i < ret.size(); i++) {
            String sourceId = ret.get(i);
            if (sourceId == null || sourceId.equals("")) {
                Log.info("MessageAdapter#getThreadMessageItemIDList::sourceId is invalid");
                continue;
            }
            Message sourceMessage = addedItemIdToMessage.get(sourceId);
            if (sourceMessage == null) {
                Log.info("MessageAdapter#getThreadMessageItemIDList::sourceMessage is null");
                continue;
            }
            String replyId = sourceMessage.getReplyId();
            if (replyId != null && !replyId.equals("")
                    && !replyId.equals("no_id")) {
                Message addedMessage = addedItemIdToMessage.get(replyId);
                if (addedMessage == null) {
                    MessageFilterCondition srcReplyIdFilterCondition = createItemIdFilterCondition(replyId);
                    if (srcReplyIdFilterCondition == null) {
                        Log.error("MessageAdapter#getThreadMessageItemIDList::srcReplyIdFilterCondition is null");
                        return ret;
                    }
                    filterCondition = MessageFilter.addRefinedFilter(
                            srcReplyIdFilterCondition, fromJid);
                    if (filterCondition == null) {
                        Log.error("MessageAdapter#getThreadMessageItemIDList::filterCondition is null");
                        return ret;
                    }
                    List<Message> replySrcMessageList = MessageStoreDbHelper
                            .searchAllMessage(filterCondition, sortCondition,
                                    fromJid);
                    if (replySrcMessageList != null) {
                        int replySrcMessageCount = replySrcMessageList.size();
                        for (int j = 0; j < replySrcMessageCount; j++) {
                            Message replySrcMessage = replySrcMessageList
                                    .get(j);
                            if (replySrcMessage == null) {
                                continue;
                            }
                            searchedMessageItemId = replySrcMessage.getItemId();
                            if (searchedMessageItemId == null
                                    || searchedMessageItemId.equals("")) {
                                Log.info("MessageAdapter#getThreadMessageItemIDList::searchedMessageItemId is invalid");
                                continue;
                            }
                            ret.add(searchedMessageItemId);
                            addedItemIdToMessage.put(searchedMessageItemId,
                                    replySrcMessage);
                        }
                    } else {
                        Log.error("MessageAdapter#getThreadMessageItemIDList::replySrcMessageList is null");
                    }
                } else {
                }
            }

            MessageFilterCondition replyIdFilterCondition = createReplyIdFilterCondition(sourceId);
            if (replyIdFilterCondition == null) {
                Log.error("MessageAdapter#getThreadMessageItemIDList::replyIdFilterCondition is null");
                return ret;
            }
            filterCondition = MessageFilter.addRefinedFilter(
                    replyIdFilterCondition, fromJid);
            if (filterCondition == null) {
                Log.error("MessageAdapter#getThreadMessageItemIDList::filterCondition is null");
                return ret;
            }
            List<Message> replyMessageList = MessageStoreDbHelper
                    .searchAllMessage(filterCondition, sortCondition, fromJid);
            if (replyMessageList != null) {
                int replySrcMessageCount = replyMessageList.size();
                for (int j = 0; j < replySrcMessageCount; j++) {
                    Message replyMessage = replyMessageList.get(j);
                    if (replyMessage == null) {
                        continue;
                    }
                    searchedMessageItemId = replyMessage.getItemId();
                    if (searchedMessageItemId == null
                            || searchedMessageItemId.equals("")) {
                        Log.info("MessageAdapter#getThreadMessageItemIDList::searchedMessageItemId is invalid");
                        continue;
                    }
                    Message addedMessage = addedItemIdToMessage
                            .get(searchedMessageItemId);
                    if (addedMessage != null) {
                        continue;
                    }
                    ret.add(searchedMessageItemId);
                    addedItemIdToMessage.put(searchedMessageItemId,
                            replyMessage);
                }
            } else {
                Log.error("MessageAdapter#getThreadMessageItemIDList::replyMessageList is null");
            }
        }
        return ret;
    }

    private MessageFilterCondition createItemIdFilterCondition(String itemId) {
        Log.debug("do func MessageAdapter.createItemIdFilterCondition(...");
        MessageFilterCondition ret = null;
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageAdapter#getItemIdFilterCondition::itemId is invalid");
            return ret;
        }
        ItemCondition itemIdFilterCondition = new ItemCondition();
        if (!itemIdFilterCondition.setData(
                MessageStoreDbHelper.COLUMN_ITEM_ID_NAME, ValueType.STRING,
                itemId)) {
            Log.error("MessageAdapter#getItemIdFilterCondition::failed to set itemIdFilterCondition data");
            return ret;
        }
        ret = itemIdFilterCondition;
        return ret;
    }

    private MessageFilterCondition createReplyIdFilterCondition(String replyId) {
        Log.debug("do func MessageAdapter.createReplyIdFilterCondition(...");
        MessageFilterCondition ret = null;
        if (replyId == null || replyId.equals("")) {
            Log.error("MessageAdapter#createReplyIdFilterCondition::replyId is invalid");
            return ret;
        }
        ItemCondition replyIdFilterCondition = new ItemCondition();
        if (!replyIdFilterCondition.setData(
                MessageStoreDbHelper.COLUMN_REPLY_ID_NAME, ValueType.STRING,
                replyId)) {
            Log.error("MessageAdapter#createReplyIdFilterCondition::failed to set replyIdFilterCondition data");
            return ret;
        }
        ret = replyIdFilterCondition;
        return ret;
    }

    private IQ createGetThreadMessageResponsePacket(IQ iq,
            List<String> itemIdList) {
        Log.debug("do func MessageAdapter.createGetThreadMessageResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MessageAdapter#createGetThreadMessageResponsePacket::iq is null");
            return ret;
        }
        if (itemIdList == null) {
            Log.error("MessageAdapter#createGetThreadMessageResponsePacket::itemIdList is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MessageAdapter#createGetThreadMessageResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MessageAdapter#createGetThreadMessageResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/threadmessage"))) {
            Log.error("MessageAdapter#createGetThreadMessageResponsePacket::namespace is invalid");
            return ret;
        }
        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("MessageAdapter#createGetThreadMessageResponsePacket::from jid is null");
            return ret;
        }
        String fromJidStr = fromJid.toBareJID();
        if (fromJidStr == null || fromJidStr.equals("")) {
            Log.error("MessageAdapter#createGetThreadMessageResponsePacket::from jid string is invalid");
            return ret;
        }
        List<Message> messageList = getSortedMessageList(itemIdList,
                MessageStoreDbHelper.TABLE_NAME + "."
                        + MessageStoreDbHelper.COLUMN_ID_NAME,
                SortCondition.SORT_ORDER_ASC, fromJidStr);
        if (messageList == null) {
            Log.error("MessageAdapter#createGetThreadMessageResponsePacket::messageList is null");
            return ret;
        }

        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element extrasElem = DocumentHelper.createElement("extras");
        newContentElem.add(extrasElem);
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = messageList.size();
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        for (int i = 0; i < itemCount; i++) {
            Message item = messageList.get(i);
            Element itemElem = getMessageItemElement(item);
            if (itemElem == null) {
                Log.error("MessageAdapter#createGetThreadMessageResponsePacket::itemElem is null");
                continue;
            }
            itemsElem.add(itemElem);
        }
        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);

        return replyPacket;
    }

    private List<Message> getSortedMessageList(List<String> itemIdList,
            String sortOrderItemString, int sortOrder, String fromJid) {
        List<Message> ret = null;
        List<Message> messageList = MessageStoreDbHelper
                .getSortedMesageListAppendReadInfo(itemIdList,
                        sortOrderItemString, sortOrder, fromJid);
        if (messageList == null) {
            Log.error("MessageAdapter#getSortedMessageList::messageList is null");
            return ret;
        }
        int messageListCount = messageList.size();
        for (int i = 0; i < messageListCount; i++) {
            Message messageItem = messageList.get(i);
            if (messageItem == null) {
                continue;
            }
            if (messageItem.getMsgType() == Message.TYPE_TASK) {
                String itemId = messageItem.getItemId();
                messageItem.setTaskNoteList(TaskNoteStoreDbHelper
                        .getTaskNoteData(itemId));
                messageItem.setSiblingTaskList(TaskMessageDbHelper
                        .getSiblingTaskList(messageItem));
            }
        }
        for (int i = 0; i < messageListCount; i++) {
            Message messageItem = messageList.get(i);

            List<GoodJob> goodJobList = GoodJobStoreDbHelper
                    .getGoodJobData(messageItem.getItemId());
            messageItem.setGoodJobList(goodJobList);

            List<EmotionPoint> emotionPointList = EmotionPointStoreDbHelper
                .getEmotionPointData(messageItem.getItemId());
            messageItem.setEmotionPointList(emotionPointList);

            String emotionPointIconJson = EmotionPointStoreDbHelper.getEmotionPointIconJson(messageItem.getItemId());
            messageItem.setEmotionPointIconJson(emotionPointIconJson);

            Note note = NoteStoreDbHelper
                .getNoteData(messageItem.getThreadRootId());
            messageItem.setNote(note);

        }

        for (int i = 0; i < messageListCount; i++) {
            Message messageItem = messageList.get(i);
            if(messageItem.getQuotationMessageId() == null ||
               messageItem.getQuotationMessageId().compareTo(new BigInteger("0")) < 0){
                messageItem.setQuotationMessageData(new QuotationMessage());
                continue;
            }
            QuotationMessage quotationMessageData
                = MessageStoreDbHelper.getQuotationMessageData(messageItem.getQuotationMessageId());
            messageItem.setQuotationMessageData(quotationMessageData);
        }

        ret = messageList;
        return ret;
    }

    private static boolean hasFilterItemKeysValue(Element elm, String name, String value){
        List<Element> conditionList = elm.elements();
        if(conditionList != null && conditionList.size() > 0){
            for(int j=0;j<conditionList.size();j++){
                Element element = conditionList.get(j);
                if(element.getName().toLowerCase().equals("item")){
                    List<org.dom4j.Attribute> attrs = element.attributes();
                    for(int i=0;i<attrs.size();i++){
                        if( attrs.get(i).getValue().toLowerCase().equals(name) &&
                            attrs.get(i).getQualifiedName().toLowerCase().equals("name") &&
                            element.getText().equals(value)){
                            Log.debug("MessageAdapter  hasFilterItemKeysValue found name, value:" + attrs.get(i).getValue() + "=" + element.getText());
                            return true;
                        }
                    }
                }
                if(hasFilterItemKeysValue(element, name, value)){
                    return true;
                }
            }
        }
        return false;
    }
}
