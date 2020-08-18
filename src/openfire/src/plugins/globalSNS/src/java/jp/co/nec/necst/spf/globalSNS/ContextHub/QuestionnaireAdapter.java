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
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.PublicMessageQuestionnaireInfo;
import jp.co.nec.necst.spf.globalSNS.Data.QuestionnaireOptionInfo;
import jp.co.nec.necst.spf.globalSNS.Data.QuestionnaireSearchFilter;
import jp.co.nec.necst.spf.globalSNS.Data.QuestionnaireSearchSortCondition;
import jp.co.nec.necst.spf.globalSNS.Data.VoteStore;
import jp.co.nec.necst.spf.globalSNS.Group.CommunityManager;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.Notification.CommunityNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.GroupChatNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.QuestionnaireMessageNotifier;

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

public class QuestionnaireAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(QuestionnaireAdapter.class);
    private static QuestionnaireAdapter mInstance = null;

    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateId = new ConcurrentHashMap<String, Object>();

    private static final String SEND_MESSAGE_NAMESPACE = "http://necst.nec.co.jp/protocol/send";

    private QuestionnaireAdapter() {
    }

    public static QuestionnaireAdapter getInstance() {
        if (mInstance == null) {
            mInstance = new QuestionnaireAdapter();
        }
        return mInstance;
    }

    public IQ hundleGetQuestionnaireListIQ(IQ iq, Element exodus) {
        if (iq == null) {
            Log.error("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: iq is null");
            return null;
        }
        if (exodus == null) {
            Log.error("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: exodus is null");
            return null;
        }

        Element query = iq.getChildElement();
        if (query == null) {
            Log.debug("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: not query");
            return null;
        }
        Element questionnaireLististElement = exodus
                .element("questionnaire_list");
        if (questionnaireLististElement == null) {
            Log.debug("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: not questionnaire_list");
            return null;
        }

        Element baseIdElement = questionnaireLististElement.element("base_id");
        if (baseIdElement == null) {
            Log.debug("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: not base_id");
            return null;
        }

        Element countElement = questionnaireLististElement.element("count");
        if (countElement == null) {
            Log.debug("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: not count");
            return null;
        }
        Element filterElement = questionnaireLististElement.element("filter");
        if (filterElement == null) {
            Log.debug("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: not filter");
            return null;
        }

        Element sortElement = questionnaireLististElement.element("sort");
        if (sortElement == null) {
            Log.debug("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: not sort");
            return null;
        }

        int baseIdIndex = -1;
        try {
            baseIdIndex = Integer.parseInt(baseIdElement.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: base_id is not Number.");
            return null;
        }

        int countNum = 0;
        try {
            countNum = Integer.parseInt(countElement.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("QuestionnaireAdapter#hundleGetQuestionnaireListIQ: count is not Number.");
            return null;
        }

        QuestionnaireSearchFilter filter = new QuestionnaireSearchFilter();
        String fromJidString = iq.getFrom().toBareJID();
        filter.setFromJid(fromJidString);
        Element groupElement = filterElement.element("group_name");
        if (groupElement != null) {
            String groupString = groupElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(groupString, filter.getGroup());
            String requestJid = iq.getFrom().toBareJID();
            List<String> requestGroupList = filter.getGroup();
            List<String> newGroupList = new ArrayList<String>();
            for (String roomId : requestGroupList) {
                if (CommunityManager.getInstance().isGettableMessage(roomId,
                        requestJid)) {
                    newGroupList.add(roomId);
                } else {
                    Log.warn("QuestionnaireAdapter#hundleGetQuestionnaireListIQ::this community is not readable. roomId="
                            + roomId + " requestJid=" + requestJid);
                }
            }
            if (newGroupList.size() <= 0) {
                Log.warn("QuestionnaireAdapter#hundleGetQuestionnaireListIQ::request group is invalid");
                return null;
            }
            filter.setGroup(newGroupList);
        }
        Element withoutfeedElement = filterElement.element("withoutfeed");
        if(withoutfeedElement != null &&
           withoutfeedElement.getStringValue() != null &&
           withoutfeedElement.getStringValue().equals("1")){
            filter.setWithOutFeedFilter(true);
        }

        Element statusElement = filterElement.element("status");
        if (statusElement != null) {
            String statusString = statusElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(statusString, filter.getStatus());
        }
        Element startDateElement = filterElement.element("start_date");
        Element dueDateElement = filterElement.element("due_date");
        if (startDateElement != null && dueDateElement != null) {
            String startDateString = startDateElement.getStringValue();
            String dueDateString = dueDateElement.getStringValue();
            if (!startDateString.equals("") && !dueDateElement.equals("")) {
                Calendar startCal = GlobalSNSUtils
                        .parseDateString(startDateString);
                Calendar endCal = GlobalSNSUtils.parseDateString(dueDateString);
                if (startCal != null && endCal != null) {
                    filter.setStartDate(new Timestamp(startCal
                            .getTimeInMillis()));
                    filter.setEndDate(new Timestamp(endCal.getTimeInMillis()));
                }
            }
        }
        QuestionnaireSearchSortCondition sortCondition = new QuestionnaireSearchSortCondition();
        Element itemElement = sortElement.element("item");
        Element orderElement = sortElement.element("order");
        if (itemElement != null) {
            List<String> itemList = sortCondition.getItems();
            List<String> orderList = sortCondition.getOrders();
            String itemString = itemElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(itemString, itemList);
            if (orderElement != null) {
                String orderString = orderElement.getStringValue();
                GlobalSNSUtils.splitStringToArray(orderString, orderList);
            }
            int itemSize = itemList.size();
            int orderSize = orderList.size();
            if (itemSize > orderSize) {
                for (int i = orderSize - 1; i < itemSize; i++) {
                    orderList
                            .add(QuestionnaireSearchSortCondition.SORT_ORDER_TYPE_ASC_STR);
                }
            }
        }

        List<Message> questionnaireList = QuestionnaireMessageDbHelper
                .getQuestionnaireListDbData(baseIdIndex, countNum, filter,
                        sortCondition, fromJidString);
        int questionnaireListSize = 0;
        if (questionnaireList != null) {
            questionnaireListSize = questionnaireList.size();
            for (int i = questionnaireListSize - 1; i >= 0; i--) {
                Message questionnaireMessage = questionnaireList.get(i);
                if (questionnaireMessage == null) {
                    questionnaireList.remove(i);
                    continue;
                }
                appendExtraQuestionnaireData(questionnaireMessage);
            }
            questionnaireListSize = questionnaireList.size();
        }

        IQ replyPacket = IQ.createResultIQ(iq);

        Element items = DocumentHelper.createElement("items");
        items.addAttribute("count", String.valueOf(questionnaireListSize));
        for (int i = 0; i < questionnaireListSize; i++) {
            Message questionnaireMessage = questionnaireList.get(i);
            Element item = getQuestionnaireMessageItemElement(questionnaireMessage);
            items.add(item);
        }

        exodus.remove(questionnaireLististElement);
        exodus.add(items);
        query.setParent(null);
        replyPacket.setChildElement(query);

        return replyPacket;
    }

    public boolean receiveQuestionnaireMessage(IQ iq) {
        String _ret = getItemIdReceiveQuestionnaireMessage(iq);
        if(_ret == null){
            return false;
        }
        return true;
    }
    public String getItemIdReceiveQuestionnaireMessage(IQ iq) {
        Log.debug("do func QuestionnaireAdapter.receiveQuestionnaireMessage(...");
        if (iq == null) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::iq is null");
            return null;
        }

        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::not type set");
            return null;
        }

        Element message = iq.getChildElement();
        if (message == null) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::not message");
            return null;
        }
        String namespace = message.getNamespaceURI();
        if (namespace == null || !(namespace.equals(SEND_MESSAGE_NAMESPACE))) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::namespace is invalid");
            return null;
        }
        Element content = message.element("content");
        if (content == null) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::not content");
            return null;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Questionnaire.equals(ContentType
                .toType(type))) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::not type Questionnaire");
            return null;
        }

        JID from = iq.getFrom();
        if (from == null) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::not from iq");
            return null;
        }

        JID to = iq.getTo();
        if (to == null) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::not to iq");
            return null;
        }
        Element roomTypeElement = content.element("roomType");
        String roomType = String
                .valueOf(PublicMessageQuestionnaireInfo.ROOM_TYPE_PUBLIC);
        if (roomTypeElement == null) {
            Log.debug("QuestionnaireAdapter#receiveQuestionnaireMessage::not roomTypeElement");
            return null;
        }
        roomType = roomTypeElement.getText();
        if (roomType == null || "".equals(roomType)) {
            Log.debug("QuestionnaireAdapter#receiveQuestionnaireMessage::not roomType");
            return null;
        }
        Element msgtoElement = content.element("msgto");
        if (msgtoElement == null) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not msgtoElement");
            return null;
        }
        String msgto = msgtoElement.getText();
        if (msgto == null || msgto.equals("")) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not msgto");
            return null;
        }
        Element entry = content.element("entry");
        if (entry == null) {
            Log.debug("QuestionnaireAdapter#receiveQuestionnaireMessage::not entry");
            return null;
        }

        String fromJid = iq.getFrom().toBareJID();
        String itemId = saveQuestionnaireMessage(content, fromJid, msgto,
                roomType);
        if (itemId == null || itemId.equals("")) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::note itemId");
            return null;
        }

        if (!savePublicMessageQuestionnaireStore(content, itemId)) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::Fail: save PublicMessageQuestionnaireStore");
            return null;
        }

        if (!saveQuestionnaireOptionStore(content, itemId)) {
            Log.error("QuestionnaireAdapter#receiveQuestionnaireMessage::Fail: save QuestionnaireOptionStore");
            return null;
        }

        switch (Integer.valueOf(roomType)) {
            case PublicMessageQuestionnaireInfo.ROOM_TYPE_GROUP:
                notifyAddQuestionnaireVoteMessageForGroup(itemId, fromJid,
                        msgto);
                break;
            case PublicMessageQuestionnaireInfo.ROOM_TYPE_COMMUNITY:
                notifyAddQuestionnaireVoteMessageForCommunity(itemId, msgto);
                break;
            default:
                QuestionnaireMessageNotifier.getInstance()
                        .notifyQuestionnaireMessage(itemId);
                break;
        }

        return itemId;
    }

    public Element getQuestionnaireMessageItemElement(
            Message questionnaireMessage) {
        Log.debug("do func QuestionnaireAdapter.getQuestionnaireMessageItemElement(...");
        Set<String> jidSet = new HashSet<String>();
        Element item = DocumentHelper.createElement("item");
        Element id = DocumentHelper.createElement("id");
        id.setText(String.valueOf(questionnaireMessage.getId()));
        item.add(id);

        Element itemId = DocumentHelper.createElement("item_id");
        itemId.setText(questionnaireMessage.getItemId());
        item.add(itemId);

        Element messageType = DocumentHelper.createElement("msgtype");
        messageType.setText(String.valueOf(questionnaireMessage.getMsgType()));
        item.add(messageType);

        Element messageFrom = DocumentHelper.createElement("msgfrom");
        String fromJid = questionnaireMessage.getMsgFrom();
        messageFrom.setText(fromJid);
        item.add(messageFrom);
        jidSet.add(fromJid);

        Element messageTo = DocumentHelper.createElement("msgto");
        messageTo.setText(questionnaireMessage.getMsgTo());
        item.add(messageTo);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entry;
        String entryStr = questionnaireMessage.getEntry();
        if (entryStr == null || entryStr.equals("")) {
            entry = DocumentHelper.createElement("entry");
        } else {
            try {
                Document doc = xmlReader.read(new StringReader(entryStr));
                entry = doc.getRootElement();
            } catch (DocumentException e) {
                Log.error("entry data is not XML");
                entry = DocumentHelper.createElement("entry");
            }
        }
        boolean isDeletedItem = false;
        if (questionnaireMessage.getDeleteFlag() == 2) {
            String deletedBy = questionnaireMessage.getDeletedBy();
            if (MessageAdapter.isDeletedByAdmin(deletedBy)) {
                entry.element("body").setText(Message.BODY_DELETED_ADMIN);
            } else {
                entry.element("body").setText(Message.BODY_DELETED_SELF);
            }
            isDeletedItem = true;
        } else {
            isDeletedItem = false;
        }
        item.add(entry);
        Element attachedItemsElem = DocumentHelper.createElement("attached_items");
        attachedItemsElem.addAttribute("count", String.valueOf(0));
        item.add(attachedItemsElem.createCopy());
        Element optionItemsElement = DocumentHelper.createElement("optionItems");
        item.add(optionItemsElement);
        if(! isDeletedItem){
            List<VoteStore> optionItemList = questionnaireMessage
                .getOptionItemList();
            int count = 0;
            for (VoteStore voteStore : optionItemList) {
                Element optionItemElement = DocumentHelper
                    .createElement("optionItem");

                Element optionIdElement = DocumentHelper.createElement("optionId");
                optionIdElement.setText(voteStore.getOptionId().toString());
                optionItemElement.add(optionIdElement);
                Element optionElement = DocumentHelper.createElement("option");
                optionElement.setText(voteStore.getOption());
                optionItemElement.add(optionElement);
                Element optionValueElement = DocumentHelper
                    .createElement("optionValue");
                optionValueElement.setText(voteStore.getCount().toString());
                optionItemElement.add(optionValueElement);

                optionItemsElement.add(optionItemElement);
                count++;
            }
            optionItemsElement.addAttribute("count", String.valueOf(count));
        }
        PublicMessageQuestionnaireInfo publicmessageQuestionnaireInfo = questionnaireMessage.getPublicmessageQuestionnaireInfo();
        if (null != publicmessageQuestionnaireInfo) {
            Element inputType = DocumentHelper.createElement("inputType");
            inputType.setText(String.valueOf(publicmessageQuestionnaireInfo.getInputType()));
            item.add(inputType);
            Element resultVisible = DocumentHelper.createElement("resultVisible");
            resultVisible.setText(String.valueOf(publicmessageQuestionnaireInfo.getResultVisible()));
            item.add(resultVisible);
            Element graphType = DocumentHelper.createElement("graphType");
            graphType.setText(String.valueOf(publicmessageQuestionnaireInfo.getGraphType()));
            item.add(graphType);
            Element roomType = DocumentHelper.createElement("roomType");
            roomType.setText(String.valueOf(publicmessageQuestionnaireInfo.getRoomType()));
            item.add(roomType);
        }

        Element roomId = DocumentHelper.createElement("roomId");
        roomId.setText(questionnaireMessage.getGroup());
        item.add(roomId);

        Element roomName = DocumentHelper.createElement("roomName");
        roomName.setText(questionnaireMessage.getGroupName());
        item.add(roomName);

        Element parentRoomId = DocumentHelper.createElement("parentroomid");
        parentRoomId.setText(questionnaireMessage.getParentRoomId());
        item.add(parentRoomId);

        Element voteFlag = DocumentHelper.createElement("voteFlag");
        voteFlag.setText(String.valueOf(questionnaireMessage.getVoteFlag()));
        item.add(voteFlag);

        Element createdAt = DocumentHelper.createElement("created_at");
        createdAt.setText(questionnaireMessage.getCreatedAtStr());
        item.add(createdAt);

        Element replyId = DocumentHelper.createElement("reply_id");
        String replyIdStr = questionnaireMessage.getReplyId();
        replyId.setText((replyIdStr == null) ? "" : replyIdStr);
        item.add(replyId);

        Element replyTo = DocumentHelper.createElement("reply_to");
        String replyToStr = questionnaireMessage.getReplyTo();
        replyTo.setText((replyToStr == null) ? "" : replyToStr);
        item.add(replyTo);

        Element startDate = DocumentHelper.createElement("start_date");
        startDate.setText(questionnaireMessage.getStartDateStr());
        item.add(startDate);
        Element dueDate = DocumentHelper.createElement("due_date");
        dueDate.setText(questionnaireMessage.getDueDateStr());
        item.add(dueDate);
        Element owner = DocumentHelper.createElement("owner");
        String ownerJid = questionnaireMessage.getOwner();
        ownerJid = (ownerJid == null) ? "" : ownerJid;
        owner.setText(ownerJid);
        item.add(owner);
        if (!ownerJid.equals("")) {
            jidSet.add(ownerJid);
        }
        Element updatedAt = DocumentHelper.createElement("updated_at");
        updatedAt.setText(questionnaireMessage.getUpdatedAtStr());
        item.add(updatedAt);
        Element updatedBy = DocumentHelper.createElement("updated_by");
        String updatedByJid = questionnaireMessage.getUpdatedBy();
        updatedBy.setText(updatedByJid);
        item.add(updatedBy);
        jidSet.add(updatedByJid);
        Element client = DocumentHelper.createElement("client");
        String clientJid = questionnaireMessage.getClient();
        clientJid = (clientJid == null) ? "" : clientJid;
        client.setText(clientJid);
        item.add(client);
        if (!clientJid.equals("")) {
            jidSet.add(clientJid);
        }

        Element context = DocumentHelper.createElement("context");
        context.setText("");
        item.add(context);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(questionnaireMessage
                .getDeleteFlag()));
        item.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            item.add(personInfoElement);
        }

        return item;
    }

    @SuppressWarnings("unchecked")
    private String saveQuestionnaireMessage(Element content, String fromJid,
            String msgto, String roomType) {
        Log.debug("do func QuestionnaireAdapter.saveQuestionnaireMessage(...");
        if (content == null) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not content");
            return null;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Questionnaire.equals(ContentType
                .toType(type))) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not type Questionnaire");
            return null;
        }
        if (fromJid == null || fromJid.equals("")) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not fromJid");
            return null;
        }
        if (roomType == null || "".equals(roomType)) {
            Log.debug("QuestionnaireAdapter#receiveQuestionnaireMessage::not roomType");
            return null;
        }
        Element inputTypeElement = content.element("inputType");
        if (inputTypeElement == null || "".equals(inputTypeElement.getText())) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not inputTypeElement");
            return null;
        }
        Element resultVisibleElement = content.element("resultVisible");
        if (resultVisibleElement == null
                || "".equals(resultVisibleElement.getText())) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not resultVisibleElement");
            return null;
        }
        Element graphTypeElement = content.element("graphType");
        if (graphTypeElement == null || "".equals(graphTypeElement.getText())) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not graphTypeElement");
            return null;
        }
        Element roomIdElement = content.element("roomId");
        String roomId = "";
        if (roomIdElement != null) {
            roomId = roomIdElement.getText();
        }
        Element optionItemsElement = content.element("optionItems");
        if (optionItemsElement == null) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not optionItemsElement");
            return null;
        }
        List<Element> optionElementList = optionItemsElement.elements("option");
        if (optionElementList == null) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not optionElementList");
            return null;
        }
        Element entry = content.element("entry");
        if (entry == null) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not entry");
            return null;
        }
        Element bodyElement = entry.element("body");
        if (bodyElement == null || "".equals(bodyElement.getText())) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not bodyElement");
            return null;
        }

        Element startDateElement = content.element("start_date");

        Element dueDateElement = content.element("due_date");

        Message questionnaireMessage = new Message();
        questionnaireMessage.setMsgType(Message.TYPE_QUESTIONNAIRE);
        questionnaireMessage.setMsgFrom(fromJid);
        questionnaireMessage.setMsgTo(msgto);
        questionnaireMessage.setGroup(roomId);

        Element tmpEntry = entry.createCopy();
        String entryData = tmpEntry.asXML();
        if (entryData == null || entryData.equals("")) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireMessage::not entryData");
            return null;
        }
        questionnaireMessage.setEntry(entryData);

        Calendar now = Calendar.getInstance();
        Timestamp timeStamp = new Timestamp(now.getTimeInMillis());
        questionnaireMessage.setCreatedAt(timeStamp);
        Element createdAt = DocumentHelper.createElement("created_at");
        SimpleDateFormat createdDf = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        java.util.Date createdDate = new java.util.Date(now.getTimeInMillis());
        createdAt.setText(createdDf.format(createdDate));

        if (startDateElement != null) {
            String startDate = startDateElement.getStringValue();
            Calendar cal = GlobalSNSUtils.parseDateString(startDate);
            if (cal != null) {
                questionnaireMessage.setStartDate(new Timestamp(cal
                        .getTimeInMillis()));
            }
        }
        if (dueDateElement != null) {
            String dueDate = dueDateElement.getStringValue();
            Calendar cal = GlobalSNSUtils.parseDateString(dueDate);
            if (cal != null) {
                questionnaireMessage.setDueDate(new Timestamp(cal
                        .getTimeInMillis()));
            }
        }

        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateId) {
            lockObject = mLockObjectMapStringToObjectForGenerateId.get(fromJid);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateId.put(fromJid,
                        lockObject);
            }
        }
        String itemId = null;
        synchronized (lockObject) {
            int nextQuestionnaireMessageItemIdNumber = QuestionnaireMessageDbHelper
                    .getNextQuestionnaireMessageItemIdNumber(fromJid);
            if (nextQuestionnaireMessageItemIdNumber <= 0) {
                Log.error("QuestionnaireAdapter#saveQuestionnaireMessage::nextQuestionnaireMessageItemIdNumber is invalid");
                return null;
            }
            String questionnaireChatMessageItemIdPrefix = QuestionnaireMessageDbHelper
                    .getQuestionnaireMessageItemIdPrefix(fromJid);
            if (questionnaireChatMessageItemIdPrefix == null
                    || questionnaireChatMessageItemIdPrefix.equals("")) {
                Log.error("QuestionnaireAdapter#saveQuestionnaireMessage::questionnaireMessageItemIdPrefix is invalid");
                return null;
            }
            itemId = questionnaireChatMessageItemIdPrefix
                    + nextQuestionnaireMessageItemIdNumber;

            questionnaireMessage.setItemId(itemId);

            if (!MessageStoreDbHelper.insertMessageToDb(questionnaireMessage)) {
                Log.error("QuestionnaireAdapter#saveQuestionnaireMessage::faild to insert Questionnaire Message");
                return null;
            }
        }
        Message savedQuestionnaireMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().setInitialData(
                savedQuestionnaireMessage);

        return itemId;
    }

    private boolean savePublicMessageQuestionnaireStore(Element content,
            String itemId) {
        Log.debug("do func QuestionnaireAdapter.savePublicMessageQuestionnaireStore(...");
        if (content == null) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not content");
            return false;
        }
        Element inputTypeElement = content.element("inputType");
        if (inputTypeElement == null) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not inputTypeElement");
            return false;
        }
        String inputType = inputTypeElement.getText();
        if (inputType == null || "".equals(inputType)) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not inputType");
            return false;
        }
        Element resultVisibleElement = content.element("resultVisible");
        if (resultVisibleElement == null) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not resultVisibleElement");
            return false;
        }
        String resultVisible = resultVisibleElement.getText();
        if (resultVisible == null || "".equals(resultVisible)) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not resultVisible");
            return false;
        }
        Element graphTypeElement = content.element("graphType");
        if (graphTypeElement == null) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not graphTypeElement");
            return false;
        }
        String graphType = graphTypeElement.getText();
        if (graphType == null || "".equals(graphType)) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not graphType");
            return false;
        }
        Element roomTypeElement = content.element("roomType");
        if (roomTypeElement == null) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not roomTypeElement");
            return false;
        }
        String roomType = roomTypeElement.getText();
        if (roomType == null || "".equals(roomType)) {
            Log.debug("QuestionnaireAdapter#savePublicMessageQuestionnaireStore::not roomType");
            return false;
        }

        PublicMessageQuestionnaireInfo publicmessageQuestionnaireInfo = new PublicMessageQuestionnaireInfo();
        publicmessageQuestionnaireInfo.setItemId(itemId);
        publicmessageQuestionnaireInfo.setInputType(Integer.valueOf(inputType));
        publicmessageQuestionnaireInfo.setResultVisible(Integer
                .valueOf(resultVisible));
        publicmessageQuestionnaireInfo.setGraphType(Integer.valueOf(graphType));
        publicmessageQuestionnaireInfo.setRoomType(Integer.valueOf(roomType));

        return PublicMessageQuestionnaireStoreDbHelper
                .insertDb(publicmessageQuestionnaireInfo);
    }

    @SuppressWarnings("unchecked")
    private boolean saveQuestionnaireOptionStore(Element content, String itemId) {
        Log.debug("do func QuestionnaireAdapter.saveQuestionnaireOptionStore(...");
        if (content == null) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireOptionStore::not content");
            return false;
        }
        if (itemId == null || itemId.equals("")) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireOptionStore::not itemId");
            return false;
        }
        Element optionItemsElement = content.element("optionItems");
        if (optionItemsElement == null) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireOptionStore::not optionItemsElement");
            return false;
        }
        List<Element> optionElementList = optionItemsElement.elements("option");
        if (optionElementList == null) {
            Log.debug("QuestionnaireAdapter#saveQuestionnaireOptionStore::not optionElementList");
            return false;
        }
        for (Element element : optionElementList) {
            String option = element.getText();
            if (option != null && !"".equals(option)) {
                QuestionnaireOptionInfo questionnaireOptionInfo = new QuestionnaireOptionInfo();
                questionnaireOptionInfo.setItemId(itemId);
                questionnaireOptionInfo.setOption(GlobalSNSUtils.escapeSqlData(option));

                QuestionnaireOptionStoreDbHelper
                        .insertDb(questionnaireOptionInfo);
            }
        }

        List<QuestionnaireOptionInfo> resultList = QuestionnaireOptionStoreDbHelper
                .selectDbByItemId(itemId);

        if (null != resultList) {
            for (QuestionnaireOptionInfo questionnaireOptionInfo : resultList) {
                VoteStore voteStore = new VoteStore();
                voteStore.setItemId(itemId);
                voteStore.setOptionId(questionnaireOptionInfo.getId());
                voteStore.setCount(BigInteger.ZERO);
                VoteStoreDbHelper.insertDb(voteStore);
            }
        }

        return true;
    }

    public void appendExtraQuestionnaireData(Message questionnaireMessage,
            String requestJid) {
        Log.debug("do func QuestionnaireAdapter.appendExtraQuestionnaireData(...");
        if (questionnaireMessage == null) {
            Log.error("QuestionnaireAdapter#appendExtraQuestionnaireData::questionnaireMessage is invalid");
            return;
        }
        String userId = null;
        if (requestJid == null || requestJid.equals("")) {
            Log.error("QuestionnaireAdapter#appendExtraQuestionnaireData::requestJid string is invalid");
            return;
        }

        Profile profile = UserProfileDbHelper.getUserProfileData(requestJid
                .trim());
        if (profile == null) {
            Log.error("QuestionnaireAdapter#appendExtraQuestionnaireData::UserProfile from jid string is not exist");
            return;
        }
        String s62 = GlobalSNSUtils.decimalToSixtyTwoString(BigInteger
                .valueOf(profile.getId()));
        userId = GlobalSNSUtils.escapeSqlData(s62);
        if (userId == null) {
            Log.error("QuestionnaireAdapter#appendExtraQuestionnaireData::userId string is not exist");
            return;
        }

        questionnaireMessage.setOptionItemList(VoteStoreDbHelper
                .getOptionItemList(questionnaireMessage));

        questionnaireMessage.setVoteFlag(VoteStoreDbHelper.getVoteFlag(
                questionnaireMessage, userId));
    }

    public void appendExtraQuestionnaireData(Message questionnaireMessage) {

        questionnaireMessage.setOptionItemList(VoteStoreDbHelper
                .getOptionItemList(questionnaireMessage));
    }

    public void notifyAddQuestionnaireVoteMessageForCommunity(String itemId,
            String roomId) {
        Log.debug("do func QuestionnaireAdapter.notifyAddQuestionnaireVoteMessageForCommunity(...");

        CommunityInfo communityInfo = CommunityManager.getInstance()
                .getCommunityInfo(roomId);
        communityInfo.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        if (CommunityStoreDbHelper.updateCommunityToDb(communityInfo)) {
            Message savedQuestionnaireMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
            savedQuestionnaireMessage.setUpdatedAt(communityInfo.getUpdatedAt());
            savedQuestionnaireMessage.setUpdatedBy(communityInfo.getUpdatedBy());
            List<VoteStore> votes = VoteStoreDbHelper.getOptionItemList(savedQuestionnaireMessage);
            CommunityNotifier.getInstance().notifyCommunityMessageForQuestionnaire
                (savedQuestionnaireMessage, communityInfo);
        }else{
            Log.error("QuestionnaireAdapter#notifyAddQuestionnaireVoteMessageForCommunity CommunityStoreDbHelper.updateCommunityToDb:false");
            return;
        }
    }

    public void notifyAddQuestionnaireVoteMessageForGroup(String itemId,
            String fromJid, String roomId) {
        Log.debug("do func QuestionnaireAdapter.notifyAddQuestionnaireVoteMessageForGroup(...");

        GroupChatNotifier.getInstance().notifyGroupChatMessageForQuestionnaire(
                itemId);

        ChatRoomStoreDbHelper.updateLastUpdateDate(roomId, fromJid);

    }

}
