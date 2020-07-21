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
import java.sql.Timestamp;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.math.BigInteger;

import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Notification.ChatMessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.ChatMessageChangeNotifier;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import org.jivesoftware.openfire.session.Session;
import org.xmpp.packet.Packet;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Attribute;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class ChatMessageAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(ChatMessageAdapter.class);
    private static ChatMessageAdapter mThisInstance = null;
    private static final String UPDATE_MESSAGE_BODY_NAMESPACE = "http://necst.nec.co.jp/protocol/updatemessagebody";
    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateId = new ConcurrentHashMap<String, Object>();

    private ChatMessageAdapter() {
    }

    public static ChatMessageAdapter getInstance() {
        Log.debug("do func ChatMessageAdapter.getInstance(...");
        if (mThisInstance == null) {
            mThisInstance = new ChatMessageAdapter();
        }
        return mThisInstance;
    }

    public Message sendChatMessage(org.xmpp.packet.Message message) {
        Log.debug("do func ChatMessageAdapter.sendChatMessage(...");
        Message ret = null;
        if (message == null) {
            Log.error("sendChatMessage : message packet is null");
            return ret;
        }
        JID fromJid = message.getFrom();
        JID toJid = message.getTo();
        if (fromJid == null || toJid == null) {
            Log.error("sendChatMessage : fromJid or toJid is null");
            return ret;
        }
        String fromJidStr = fromJid.toBareJID();
        if (fromJidStr == null) {
            Log.error("sendChatMessage : fromJidStr is null");
            return ret;
        }
        String toJidStr = toJid.toBareJID();
        String messageBody = message.getBody();
        if (messageBody == null || messageBody.equals("")) {
            Log.error("sendChatMessage : messageBody is invalid");
            return ret;
        }
        Element replyIdElement = message.getChildElement("reply_id", "");
        if (replyIdElement == null) {
            Log.error("sendChatMessage : replyIdElement is null");
            return ret;
        }
        String replyId = replyIdElement.getStringValue();
        if (replyId == null) {
            replyId = "";
        }

        Element bodyTypeElement = message.getChildElement("body_type", "");
        if (bodyTypeElement == null) {
            Log.error("sendChatMessage : bodyTypeElement is null");
            return ret;
        }
        int bodyType;
        try{
            bodyType = Integer.parseInt(bodyTypeElement.getStringValue());
        }catch(NumberFormatException e) {
            bodyType = 0;
        }

        Element threadTitleElement = message.getChildElement("thread_title", "");
        if (threadTitleElement == null) {
            Log.error("sendChatMessage : threadTitleElement is null");
            return ret;
        }
        String threadTitle = threadTitleElement.getStringValue();
        if (threadTitle == null) {
            threadTitle = "";
        }

        Element quotationItemIdElement = message.getChildElement("quotation_item_id","");
        String quotationItemId = "";
        if(quotationItemIdElement != null){
            quotationItemId = quotationItemIdElement.getStringValue();
        }

        Calendar now = Calendar.getInstance();
        Element entryElement = DocumentHelper.createElement("entry");
        Element bodyElement = DocumentHelper.createElement("body");
        bodyElement.setText(messageBody);
        entryElement.add(bodyElement);
        String entryStr = entryElement.asXML();

        Message saveMessage = new Message();
        saveMessage.setMsgType(Message.TYPE_CHAT);
        saveMessage.setMsgFrom(fromJidStr);
        saveMessage.setMsgTo(toJidStr);
        saveMessage.setEntry(entryStr);
        saveMessage.setBodyType(bodyType);
        saveMessage.setReplyId(replyId);
        saveMessage.setReplyTo(toJidStr);
        saveMessage.setThreadTitle(threadTitle);
        saveMessage.setQuotationItemId(quotationItemId);
        saveMessage.setCreatedAt(new Timestamp(now.getTimeInMillis()));
        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateId) {
            lockObject = mLockObjectMapStringToObjectForGenerateId
                    .get(fromJidStr);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateId.put(fromJidStr,
                        lockObject);
            }
        }
        String itemId = null;
        synchronized (lockObject) {
            int regCount = ChatMessageDbHelper.getCreateCount(fromJid);
            if (regCount == -1) {
                Log.error("sendChatMessage : regCount is invalid. jid = "
                        + fromJidStr);
                return ret;
            }
            String accountName = "";
            int atIndex = fromJidStr.indexOf("@");
            if (atIndex > 0) {
                accountName = fromJidStr.substring(0, atIndex);
            } else {
                accountName = fromJidStr;
            }
            itemId = "chat_" + accountName + "_" + String.valueOf(regCount + 1);
            saveMessage.setItemId(itemId);
            boolean saved = MessageStoreDbHelper.insertMessageToDb(saveMessage);
            if (!saved) {
                Log.error("faild to save Chat Message : item ID = " + itemId);
                return ret;
            }
        }

        Message savedChatMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().setInitialData(savedChatMessage);

        return(savedChatMessage);
    }

    public IQ receivedUpdateChatMessageBody(IQ iq) {
        Log.debug("do func ChatMessageAdapter.receivedUpdateChatMessageBody(...");
        IQ ret = null;
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("not type set");
            return ret;
        }
        Element message = iq.getChildElement();
        if (message == null) {
            Log.error("not message");
            return ret;
        }
        Element content = message.element("content");
        if (content == null) {
            Log.error("not content");
            return ret;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (! typeAttr.getValue().equals("Chat")) {
            Log.error("not type Chat");
            return ret;
        }
        Element bodyElm = content.element("body");
        if(bodyElm == null ||
           bodyElm.getStringValue() == null){
            return createUpdateMessageChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }

        if(iq.getFrom() == null ||
           iq.getFrom().toBareJID() == null){
            return createUpdateMessageChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String fromJid = iq.getFrom().toBareJID();

        Element entryElm = DocumentHelper.createElement("entry");
        entryElm.addNamespace("","http://necst.nec.co.jp/protocol/updatemessagebody");
        entryElm.add(DocumentHelper.createElement("body").addText(bodyElm.getStringValue()));
        entryElm.add(DocumentHelper.createElement("attached_items").addAttribute("count","0"));
        Log.debug("ChatMessageAdapter.saveUpdateChatMessageBody at MessageStoreDbHelper.updateMessageBodyToDb entryXML:" + entryElm.asXML());

        Element itemIdElm = content.element("item_id");
        if(itemIdElm == null ||
           itemIdElm.getStringValue() == null){
            return createUpdateMessageChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String itemId = itemIdElm.getStringValue();

        if(!MessageStoreDbHelper.updateMessageBodyToDb(2,
                                                       itemId,
                                                       entryElm.asXML(),
                                                       fromJid,
                                                       null)){
            Log.error("ChatMessageAdapter.saveUpdateChatMessageBody at MessageStoreDbHelper.updateMessageBodyToDb error");
            return createUpdateMessageChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR);
        }

        Message savedChatMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().resetInitialData(savedChatMessage);

        ChatMessageChangeNotifier.getInstance().notifyChatMessage(itemId);

        return createUpdateMessageChatResponsePacket(iq, GlobalSNSUtils.API_STATUS_SUCCESS);
    }

    private IQ createUpdateMessageChatResponsePacket
        (IQ iq, int resultCode) {
        Log.debug("do func ChatMessageAdapter.createSendChatMessageResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("ChatMessageAdapter.createSendChatMessageResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("ChatMessageAdapter.createSendChatMessageResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("ChatMessageAdapter.createSendChatMessageResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(UPDATE_MESSAGE_BODY_NAMESPACE))) {
            Log.error("ChatMessageAdapter.createSendChatMessageResponsePacket::namespace is invalid");
            return ret;
        }

        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("ChatMessageAdapter.createSendChatMessageResponsePacket::from jid is null");
            return ret;
        }
        String fromJidStr = fromJid.toBareJID();
        if (fromJidStr == null || fromJidStr.equals("")) {
            Log.error("ChatMessageAdapter.createSendChatMessageResponsePacket::from jid string is invalid");
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


    public Element getChatMessageItemElement(Message chatMessage) {
        Log.debug("do func ChatMessageAdapter.getChatMessageItemElement(...");
        Set<String> jidSet = new HashSet<String>();
        Element item = DocumentHelper.createElement("item");
        Element id = DocumentHelper.createElement("id");
        id.setText(String.valueOf(chatMessage.getId()));
        item.add(id);

        Element itemId = DocumentHelper.createElement("item_id");
        itemId.setText(chatMessage.getItemId());
        item.add(itemId);

        Element messageType = DocumentHelper.createElement("msgtype");
        messageType.setText(String.valueOf(chatMessage.getMsgType()));
        item.add(messageType);

        Element messageFrom = DocumentHelper.createElement("msgfrom");
        String fromJid = chatMessage.getMsgFrom();
        messageFrom.setText(fromJid);
        item.add(messageFrom);
        jidSet.add(fromJid);

        Element messageTo = DocumentHelper.createElement("msgto");
        String toJid = chatMessage.getMsgTo();
        messageTo.setText(toJid);
        item.add(messageTo);
        jidSet.add(toJid);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entry;
        String entryStr = chatMessage.getEntry();
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
        if (chatMessage.getDeleteFlag() == 2) {
            String deletedBy = chatMessage.getDeletedBy();
            if (MessageAdapter.isDeletedByAdmin(deletedBy)) {
                entry.element("body").setText(Message.BODY_DELETED_ADMIN);
            } else {
                entry.element("body").setText(Message.BODY_DELETED_SELF);
            }
        }
        item.add(entry);

        Element createdAt = DocumentHelper.createElement("created_at");
        createdAt.setText(chatMessage.getCreatedAtStr());
        item.add(createdAt);

        Element updatedAt = DocumentHelper.createElement("updated_at");
        updatedAt.setText(chatMessage.getUpdatedAtStr());
        item.add(updatedAt);

        Element replyId = DocumentHelper.createElement("reply_id");
        String replyIdStr = chatMessage.getReplyId();
        replyId.setText((replyIdStr == null) ? "" : replyIdStr);
        item.add(replyId);

        Element replyTo = DocumentHelper.createElement("reply_to");
        String replyToStr = chatMessage.getReplyTo();
        replyTo.setText((replyToStr == null) ? "" : replyToStr);
        item.add(replyTo);

        Element bodyType = DocumentHelper.createElement("body_type");
        String bodyTypeStr = String.valueOf(chatMessage.getBodyType());
        bodyType.setText((bodyTypeStr == null) ? "0" : bodyTypeStr);
        item.add(bodyType);

        Element threadTitle = DocumentHelper.createElement("thread_title");
        String threadTitleStr = chatMessage.getThreadTitle();
        threadTitle.setText((threadTitleStr == null) ? "" : threadTitleStr);
        item.add(threadTitle);

        Element threadRootId = DocumentHelper.createElement("thread_root_id");
        String threadRootIdStr = chatMessage.getThreadRootId();
        threadRootId.setText((threadRootIdStr == null) ? "" : threadRootIdStr);
        item.add(threadRootId);

        Element quotation = QuotationMessageAdapter.getInstance().createElement(chatMessage);
        item.add(quotation);

        Element emotionPoint = EmotionPointAdapter.getInstance().getEmotionPointElement(chatMessage.getEmotionPointList());
        item.add(emotionPoint);

        Element emotionPointIconJsonElm = DocumentHelper.createElement("emotion_point_icon");
        String emotionPointIconJson = chatMessage.getEmotionPointIconJson();
        emotionPointIconJsonElm.setText((emotionPointIconJson == null) ? "{}" :  emotionPointIconJson);
        item.add(emotionPointIconJsonElm);

        List<GoodJob> goodJobList = chatMessage.getGoodJobList();
        Element goodJob = GoodJobAdapter.getInstance().getGoodJobElement(
                goodJobList);
        item.add(goodJob);

        Note note = chatMessage.getNote();
        Element noteElm = NoteAdapter.getInstance().getNoteElement(note);
        item.add(noteElm);

        Element context = DocumentHelper.createElement("context");
        item.add(context);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(chatMessage.getDeleteFlag()));
        item.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            item.add(personInfoElement);
        }

        return item;
    }

    public IQ hundleGetChatHistoryIQ(IQ iq, Element exodus) {
        Log.debug("do func ChatMessageAdapter.hundleGetChatHistoryIQ(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("ChatMessageAdapter#hundleGetChatHistoryIQ: iq is null");
            return ret;
        }
        if (exodus == null) {
            Log.error("ChatMessageAdapter#hundleGetChatHistoryIQ: exodus is null");
            return ret;
        }
        Element query = iq.getChildElement();
        if (query == null) {
            Log.debug("not query");
            return ret;
        }
        Element chatHistoryElement = exodus.element("chat_history");
        if (chatHistoryElement == null) {
            Log.error("not chat_historyt");
            return ret;
        }

        Element baseIdElement = chatHistoryElement.element("base_id");
        if (baseIdElement == null) {
            Log.debug("not base_id");
            return ret;
        }

        Element countElement = chatHistoryElement.element("count");
        if (countElement == null) {
            Log.debug("not count");
            return ret;
        }
        Element filterElement = chatHistoryElement.element("filter");
        if (filterElement == null) {
            Log.debug("not filter");
            return ret;
        }

        int baseIdIndex = -1;
        try {
            baseIdIndex = Integer.parseInt(baseIdElement.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("base_id is not Number.");
            return ret;
        }

        int countNum = 0;
        try {
            countNum = Integer.parseInt(countElement.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("count is not Number.");
            return ret;
        }

        Element partnerElement = filterElement.element("partner");
        String partnerJid = "";
        if (partnerElement != null) {
            partnerJid = partnerElement.getStringValue();
        }

        if (partnerJid.equals("")) {
            Log.error("filter is invalid.");
            return ret;
        }

        JID fromJid = iq.getFrom();
        String myJid = fromJid.toBareJID();

        List<Message> chatHistory = ChatMessageDbHelper.getChatHistoryDbData(
                baseIdIndex, countNum, myJid, partnerJid);

        if (chatHistory == null) {
            Log.error("chatHistory is null.");
            return ret;
        }
        int chatHistorySize = chatHistory.size();
        if (chatHistorySize < 0) {
            Log.error("chatHistorySize is invalid.");
            return ret;
        }

        for (int i = 0; i < chatHistorySize; i++) {
            Message chatMessage = chatHistory.get(i);

            List<GoodJob> goodJobList = GoodJobStoreDbHelper
                    .getGoodJobData(chatMessage.getItemId());
            chatMessage.setGoodJobList(goodJobList);

            List<EmotionPoint> emotionPointList = EmotionPointStoreDbHelper
                .getEmotionPointData(chatMessage.getItemId());
            chatMessage.setEmotionPointList(emotionPointList);

            chatMessage.setEmotionPointIconJson("{}");

            Note note = NoteStoreDbHelper
                .getNoteData(chatMessage.getThreadRootId());
            chatMessage.setNote(note);
        }

        for (int i = 0; i < chatHistorySize; i++) {
            Message messageItem = chatHistory.get(i);
            if(messageItem.getQuotationMessageId() == null ||
               messageItem.getQuotationMessageId().compareTo(new BigInteger("0")) < 0){
                messageItem.setQuotationMessageData(new QuotationMessage());
                continue;
            }
            QuotationMessage quotationMessageData
                = MessageStoreDbHelper.getQuotationMessageData(messageItem.getQuotationMessageId());
            messageItem.setQuotationMessageData(quotationMessageData);
        }

        IQ replyPacket = IQ.createResultIQ(iq);

        Element items = DocumentHelper.createElement("items");
        items.addAttribute("count", String.valueOf(chatHistorySize));
        for (int i = 0; i < chatHistorySize; i++) {
            Message chatMessage = chatHistory.get(i);
            Element item = MessageAdapter.getInstance().getMessageItemElement(
                    chatMessage);
            if (item != null) {
                items.add(item);
            }
        }
        exodus.remove(chatHistoryElement);
        exodus.add(items);
        query.setParent(null);
        replyPacket.setChildElement(query);

        return replyPacket;
    }

}
