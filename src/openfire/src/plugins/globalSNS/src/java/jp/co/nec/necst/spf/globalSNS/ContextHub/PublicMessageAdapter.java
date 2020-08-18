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
import java.net.URLDecoder;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.math.BigInteger;

import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.Notification.PublicMessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.PublicMessageChangeNotifier;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

import org.dom4j.Attribute;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class PublicMessageAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(PublicMessageAdapter.class);
    private static PublicMessageAdapter mThisInstance = null;
    private static final String UPDATE_MESSAGE_BODY_NAMESPACE = "http://necst.nec.co.jp/protocol/updatemessagebody";

    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateId = new ConcurrentHashMap<String, Object>();

    private PublicMessageAdapter() {
    }

    public static PublicMessageAdapter getInstance() {
        Log.debug("do func PublicMessageAdapter.getInstance(...");
        if (mThisInstance == null) {
            mThisInstance = new PublicMessageAdapter();
        }
        return mThisInstance;
    }

    public IQ receivedPublicMessage(IQ iq) {
        Log.debug("do func PublicMessageAdapter.receivedPublicMessage(...");
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
        if (!IQMessageSendHandler.ContentType.Public.equals(ContentType
                .toType(type))) {
            Log.error("not type Public");
            return ret;
        }

        String fromJid = iq.getFrom().toBareJID();
        String toJid = iq.getTo().toBareJID();
        Message savedPublicMessage = savePublicMessage(content, fromJid, toJid);
        if (savedPublicMessage == null || savedPublicMessage.getItemId().equals("")) {
            Log.error("Fail: save Public message");
            return ret;
        }
        IQ iqElm =IQ.createResultIQ(iq);
        Element saveMesageElm = getPublicMessageItemElement(savedPublicMessage);

        Element itemsElm = DocumentHelper.createElement("items");
        itemsElm.addAttribute("count","1");
        itemsElm.add(saveMesageElm);

        Element contentElm = DocumentHelper.createElement("content");
        contentElm.addAttribute("type","Public");
        contentElm.add(itemsElm);

        Element messageElm = DocumentHelper.createElement("message");
        messageElm.addNamespace("","http://necst.nec.co.jp/protocol/send");
        messageElm.add(contentElm);

        iqElm.setChildElement(messageElm);
        ret = iqElm;

        PublicMessageNotifier.getInstance().notifyPublicMessage(savedPublicMessage.getItemId());

        return ret;
    }

    public IQ receivedUpdatePublicMessageBody(IQ iq) {
        Log.debug("do func PublicMessageAdapter.receivedUpdatePublicMessageBody(...");
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("not type set");
            return null;
        }

        Element message = iq.getChildElement();
        if (message == null) {
            Log.error("not message");
            return null;
        }
        Element content = message.element("content");
        if (content == null) {
            Log.error("not content");
            return null;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!typeAttr.getValue().equals("Public")) {
            Log.error("not type Public");
            return null;
        }

        String fromJid = iq.getFrom().toBareJID();
        String toJid = iq.getTo().toBareJID();
        String itemId = saveUpdatePublicMessageBody(content, fromJid);
        if (itemId == null || itemId.equals("")) {
            Log.error("Fail: save Public message");
            return createUpdateMessagePublicResponsePacket(iq, GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR);
        }

        PublicMessageChangeNotifier.getInstance().notifyPublicMessage(itemId);

        return createUpdateMessagePublicResponsePacket(iq, GlobalSNSUtils.API_STATUS_SUCCESS);
    }

    
    public Set<JID> getPublicMessageReceiverJidSet(String exclusionJidString) {
        Log.debug("do func PublicMessageAdapter.getPublicMessageReceiverJidSet(...");
        Set<JID> ret = new HashSet<JID>();
        String[] targetUserArray = getPublicMessageReceiverUserNameArray();
        for (String targetUserName : targetUserArray) {
            if (targetUserName == null) {
                continue;
            }
            JID jid = XMPPServer.getInstance().createJID(targetUserName, null);
            if (exclusionJidString == null
                    || !exclusionJidString.equals(jid.toBareJID())) {
                ret.add(jid);
            }
        }
        return ret;
    }

    public Set<String> getPublicMessageReceiverSet() {
        Log.debug("do func PublicMessageAdapter.getPublicMessageReceiverSet(...");
        Set<String> ret = new HashSet<String>();
        String[] targetUserArray = getPublicMessageReceiverUserNameArray();
        for (String targetUserName : targetUserArray) {
            if (targetUserName == null) {
                continue;
            }
            JID jid = XMPPServer.getInstance().createJID(targetUserName, null);
            ret.add(jid.toBareJID());
        }
        return ret;
    }

    private String[] getPublicMessageReceiverUserNameArray() {
        Log.debug("do func PublicMessageAdapter.getPublicMessageReceiverUserNameArray(...");
        Collection<User> allUser = UserAccountManager.getInstance()
                .getAllOpenfireUsers();
        Map<String, User> tergetUsers = new HashMap<String, User>();
        for (User existUser : allUser) {
            String existUserName = existUser.getUsername();
            tergetUsers.put(existUserName, existUser);
        }
        Map<String, User> cubeeSystemUsers = UserAccountManager.getInstance()
                .getCubeeSystemUsers();
        Iterator<String> itCubeeSystemUser = cubeeSystemUsers.keySet()
                .iterator();
        while (itCubeeSystemUser.hasNext()) {
            String cubeeSystemUserUserName = itCubeeSystemUser.next();
            tergetUsers.remove(cubeeSystemUserUserName);
        }
        return tergetUsers.keySet().toArray(new String[0]);
    }

    @SuppressWarnings("deprecation")
    private Message savePublicMessage(Element content, String fromJid,
            String toJid) {
        Message ret = null;
        Log.debug("do func PublicMessageAdapter.savePublicMessage(...");
        if (content == null) {
            Log.debug("not content");
            return ret;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Public.equals(ContentType
                .toType(type))) {
            Log.debug("not type Public");
            return ret;
        }

        Element entry = content.element("entry");

        Element attachedItems = content.element("attached_items");

        Element replyId = content.element("reply_id");

        Element bodyType = content.element("body_type");

        Element threadTitle = content.element("thread_title");

        Element quotationItemId = content.element("quotation_item_id");

        Message publicMessage = new Message();

        publicMessage.setMsgType(Message.TYPE_PUBLIC);

        if (fromJid == null || fromJid.equals("")) {
            Log.debug("not fromJid");
            return ret;
        }
        publicMessage.setMsgFrom(fromJid);

        if (toJid == null || toJid.equals("")) {
            Log.debug("not toJid");
            return ret;
        }
        publicMessage.setMsgTo(toJid);

        Element tmpEntry = entry.createCopy();
        tmpEntry.add(attachedItems.createCopy());
        String entryData = tmpEntry.asXML();
        if (entryData == null || entryData.equals("")) {
            Log.debug("not entryData");
            return ret;
        }
        publicMessage.setEntry(entryData);

        Calendar now = Calendar.getInstance();
        Timestamp timeStamp = new Timestamp(now.getTimeInMillis());
        publicMessage.setCreatedAt(timeStamp);
        Element createdAt = DocumentHelper.createElement("created_at");
        SimpleDateFormat createdDf = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        java.util.Date createdDate = new java.util.Date(now.getTimeInMillis());
        createdAt.setText(createdDf.format(createdDate));

        String replyItemId = "";
        if (replyId != null) {
            replyItemId = replyId.getStringValue();
        }
        publicMessage.setReplyId(replyItemId);

        String replyTo = "";
        Element body = entry.element("body");
        if (body != null) {
            String bodyStr = body.getStringValue();
            String decodeedBodyStr = URLDecoder.decode(bodyStr);
            int atIndex = decodeedBodyStr.indexOf("@");
            if (atIndex == 0) {
                int endIndex = decodeedBodyStr.length();
                int spaceIndex = decodeedBodyStr.indexOf(" ");
                if (spaceIndex > 0 && spaceIndex < endIndex) {
                    endIndex = spaceIndex;
                }
                int returnIndex1 = decodeedBodyStr.indexOf("\r\n");
                if (returnIndex1 > 0 && returnIndex1 < endIndex) {
                    endIndex = returnIndex1;
                }
                int returnIndex2 = decodeedBodyStr.indexOf("\n");
                if (returnIndex2 > 0 && returnIndex2 < endIndex) {
                    endIndex = returnIndex2;
                }
                int returnIndex3 = decodeedBodyStr.indexOf("\r");
                if (returnIndex3 > 0 && returnIndex3 < endIndex) {
                    endIndex = returnIndex3;
                }
                replyTo = decodeedBodyStr.substring(1, endIndex);
                if (replyTo.equals("")) {
                    replyTo = "";
                } else {
                    int hostIndex = fromJid.indexOf("@");
                    if (hostIndex > 0) {
                        String host = fromJid.substring(hostIndex);
                        if (!host.equals("")) {
                            replyTo = replyTo + host;
                        }
                    }
                }
            }
        }
        publicMessage.setReplyTo(replyTo);

        int bodyTypeInt = 0;
        if (bodyType != null) {
            try{
                bodyTypeInt = Integer.parseInt(bodyType.getStringValue());
            } catch (NumberFormatException e) {
                Log.warn("body_type is not Number.");
            }
        }
        publicMessage.setBodyType(bodyTypeInt);

        String threadTitleStr = "";
        if (threadTitle != null) {
            threadTitleStr = threadTitle.getStringValue();
        }
        publicMessage.setThreadTitle(threadTitleStr);

        String quotationItemIdStr = "";
        if(quotationItemId != null){
            quotationItemIdStr = quotationItemId.getStringValue();
        }
        publicMessage.setQuotationItemId(quotationItemIdStr);

        String accountName = fromJid;
        int acountSplitIndex = fromJid.indexOf("@");
        if (acountSplitIndex > 0) {
            accountName = fromJid.substring(0, acountSplitIndex);
        }
        String stream_name = "stream_" + accountName;
        publicMessage.setPublishNodename(stream_name);

        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateId) {
            lockObject = mLockObjectMapStringToObjectForGenerateId
                    .get(stream_name);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateId.put(stream_name,
                        lockObject);
            }
        }
        String itemId = null;
        synchronized (lockObject) {
            int nextItemIdNum = PublicMessageDbHelper
                    .getNextPublicMessageItemIdNumber(stream_name);
            if (nextItemIdNum <= 0) {
                Log.error("nextItemIdNum is invalid");
                return ret;
            }
            itemId = stream_name + "_" + String.valueOf(nextItemIdNum);

            publicMessage.setItemId(itemId);

            if (!MessageStoreDbHelper.insertMessageToDb(publicMessage)) {
                return ret;
            }
        }
        Message savedPublicMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().setInitialData(savedPublicMessage);
        ret = savedPublicMessage;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private String saveUpdatePublicMessageBody(Element content, String fromJid) {
        Log.debug("do func PublicMessageAdapter.saveUpdatePublicMessageBody(...");
        if (content == null) {
            Log.debug("not content");
            return "";
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Public.equals(ContentType
                .toType(type))) {
            Log.debug("not type Public");
            return "";
        }

        Element bodyElm = content.element("body");
        if(bodyElm == null ||
           bodyElm.getStringValue() == null){
            return "";
        }
        Element entryElm = DocumentHelper.createElement("entry");
        entryElm.addNamespace("","http://necst.nec.co.jp/protocol/updatemessagebody");
        entryElm.add(DocumentHelper.createElement("body").addText(bodyElm.getStringValue()));
        entryElm.add(DocumentHelper.createElement("attached_items").addAttribute("count","0"));
        Log.debug("PublicMessageAdapter.saveUpdatePublicMessageBody at MessageStoreDbHelper.updateMessageBodyToDb entryXML:" + entryElm.asXML());

        Element itemIdElm = content.element("item_id");
        if(itemIdElm == null ||
           itemIdElm.getStringValue() == null){
            return "";
        }
        String itemId = itemIdElm.getStringValue();

        if(!MessageStoreDbHelper.updateMessageBodyToDb(1,
                                                       itemId,
                                                       entryElm.asXML(),
                                                       fromJid,
                                                       null)){
            Log.error("PublicMessageAdapter.saveUpdatePublicMessageBody at MessageStoreDbHelper.updateMessageBodyToDb error");
            return "";
        }

        Message savedMessage = MessageStoreDbHelper
            .getOneMessageByItemIdWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().resetInitialData(savedMessage);

        return itemId;
    }

    @Deprecated
    public String savePublishData(Element entry, String fromJid, String toJid,
            String nodeName) {
        Log.debug("do func PublicMessageAdapter.savePublishData(...");
        if (entry == null) {
            Log.debug("not entry");
            return "";
        }

        Element body = entry.element("body");

        Element reply = entry.element("reply");

        Message publicMessage = new Message();
        publicMessage.setMsgType(Message.TYPE_PUBLIC);

        if (fromJid == null || fromJid.equals("")) {
            Log.debug("not fromJid");
            return "";
        }
        publicMessage.setMsgFrom(fromJid);

        if (toJid == null || toJid.equals("")) {
            Log.debug("not toJid");
            return "";
        }
        publicMessage.setMsgTo(toJid);

        String entryData = entry.asXML();
        if (entryData == null || entryData.equals("")) {
            Log.debug("not entryData");
            return "";
        }
        publicMessage.setEntry(entryData);

        if (nodeName == null || nodeName.equals("")) {
            Log.debug("not nodeName");
            return "";
        }
        publicMessage.setPublishNodename(nodeName);

        Calendar now = Calendar.getInstance();
        Timestamp timeStamp = new Timestamp(now.getTimeInMillis());
        publicMessage.setCreatedAt(timeStamp);
        Element createdAt = DocumentHelper.createElement("created");
        SimpleDateFormat createdDf = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        java.util.Date createdDate = new java.util.Date(now.getTimeInMillis());
        createdAt.setText(createdDf.format(createdDate));
        entry.add(createdAt);

        String replyItemId = "";
        if (reply != null) {
            replyItemId = reply.getStringValue();
            if (replyItemId.equals("no_id")) {
                replyItemId = "";
            }
        }
        publicMessage.setReplyId(replyItemId);

        String replyTo = "";
        if (body != null) {
            String bodyStr = body.getStringValue();
            String decodeedBodyStr = URLDecoder.decode(bodyStr);
            int atIndex = decodeedBodyStr.indexOf("@");
            if (atIndex == 0) {
                int endIndex = decodeedBodyStr.length();
                int spaceIndex = decodeedBodyStr.indexOf(" ");
                if (spaceIndex > 0 && spaceIndex < endIndex) {
                    endIndex = spaceIndex;
                }
                int returnIndex1 = decodeedBodyStr.indexOf("\r\n");
                if (returnIndex1 > 0 && returnIndex1 < endIndex) {
                    endIndex = returnIndex1;
                }
                int returnIndex2 = decodeedBodyStr.indexOf("\n");
                if (returnIndex2 > 0 && returnIndex2 < endIndex) {
                    endIndex = returnIndex2;
                }
                int returnIndex3 = decodeedBodyStr.indexOf("\r");
                if (returnIndex3 > 0 && returnIndex3 < endIndex) {
                    endIndex = returnIndex3;
                }
                replyTo = decodeedBodyStr.substring(1, endIndex);
                if (replyTo.equals("")) {
                    replyTo = "";
                } else {
                    int hostIndex = fromJid.indexOf("@");
                    if (hostIndex > 0) {
                        String host = fromJid.substring(hostIndex);
                        if (!host.equals("")) {
                            replyTo = replyTo + host;
                        }
                    }
                }
            }
        }
        publicMessage.setReplyTo(replyTo);

        String accountName = fromJid;
        int acountSplitIndex = fromJid.indexOf("@");
        if (acountSplitIndex > 0) {
            accountName = fromJid.substring(0, acountSplitIndex);
        }
        String stream_name = "stream_" + accountName;
        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateId) {
            lockObject = mLockObjectMapStringToObjectForGenerateId
                    .get(stream_name);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateId.put(stream_name,
                        lockObject);
            }
        }

        String itemId = null;
        synchronized (lockObject) {
            int nextItemIdNum = PublicMessageDbHelper
                    .getNextPublicMessageItemIdNumber(stream_name);
            if (nextItemIdNum <= 0) {
                Log.error("nextItemIdNum is invalid");
                return "";
            }
            itemId = stream_name + "_" + String.valueOf(nextItemIdNum);

            publicMessage.setItemId(itemId);

            MessageStoreDbHelper.insertMessageToDb(publicMessage);
        }

        return itemId;
    }

    public IQ hundleGetTimeLineIQ(IQ iq, Element exodus) {
        Log.debug("do func PublicMessageAdapter.hundleGetTimeLineIQ(...");
        if (iq == null) {
            Log.error("PublicMessageAdapter#hundleGetTimeLineIQ: iq is null");
            return null;
        }
        if (exodus == null) {
            Log.error("PublicMessageAdapter#hundleGetTimeLineIQ: exodus is null");
            return null;
        }

        Element query = iq.getChildElement();
        if (query == null) {
            Log.debug("not query");
            return null;
        }

        Element timelineHistory = exodus.element("timeline_history");
        if (timelineHistory == null) {
            Log.debug("not timeline_history");
            return null;
        }

        Element baseId = timelineHistory.element("base_id");
        if (baseId == null) {
            Log.debug("not base_id");
            return null;
        }

        Element count = timelineHistory.element("count");
        if (count == null) {
            Log.debug("not count");
            return null;
        }

        int baseIdIndex = -1;
        try {
            baseIdIndex = Integer.parseInt(baseId.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("base_id is not Number.");
            return null;
        }

        int countNum = 0;
        try {
            countNum = Integer.parseInt(count.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("count is not Number.");
            return null;
        }

        if (countNum < 1) {
            Log.error("count is not counting number.");
            return null;
        }

        JID fromJID = iq.getFrom();
        String fromJidStr = fromJID.toBareJID();
        Log.debug("From JIDSTR : " + fromJidStr);

        List<Message> timelineItems = getPublicMassageDbData(baseIdIndex,
                countNum, fromJID);

        if (timelineItems == null) {
            Log.error("failed to get timeline data.");
            return null;
        }

        int timeLineItemsCount = timelineItems.size();
        for (int i = 0; i < timeLineItemsCount; i++) {
            Message tlItem = timelineItems.get(i);

            List<GoodJob> goodJobList = GoodJobStoreDbHelper
                    .getGoodJobData(tlItem.getItemId());
            tlItem.setGoodJobList(goodJobList);

            List<EmotionPoint> emotionPointList  = EmotionPointStoreDbHelper
                .getEmotionPointData(tlItem.getItemId());
            tlItem.setEmotionPointList(emotionPointList);

            tlItem.setEmotionPointIconJson("{}");

        }

        for (int i = 0; i < timeLineItemsCount; i++) {
            Message messageItem = timelineItems.get(i);
            if(messageItem.getQuotationMessageId() == null ||
               messageItem.getQuotationMessageId().compareTo(new BigInteger("0")) < 0){
                messageItem.setQuotationMessageData(new QuotationMessage());
                continue;
            }
            QuotationMessage quotationMessageData
                = MessageStoreDbHelper.getQuotationMessageData(messageItem.getQuotationMessageId());
            messageItem.setQuotationMessageData(quotationMessageData);
        }

        for (int i = 0; i < timeLineItemsCount; i++) {
            Message tlItem = timelineItems.get(i);
            QuestionnaireAdapter.getInstance().appendExtraQuestionnaireData(tlItem, fromJidStr);
        }

        IQ replyPacket = IQ.createResultIQ(iq);

        Element items = DocumentHelper.createElement("items");
        items.addAttribute("count", String.valueOf(timelineItems.size()));
        for (int i = 0; i < timeLineItemsCount; i++) {
            Message tlItem = timelineItems.get(i);
            Element item = MessageAdapter.getInstance().getMessageItemElement(
                    tlItem);
            if (item != null) {
                items.add(item);
            }
        }

        exodus.remove(timelineHistory);
        exodus.add(items);
        query.setParent(null);
        replyPacket.setChildElement(query);

        return replyPacket;
    }

    public Element getPublicMessageItemElement(Message publicMessage) {
        Log.debug("do func PublicMessageAdapter.getPublicMessageItemElement(...");
        return setTimelinItem(publicMessage);
    }

    private IQ createUpdateMessagePublicResponsePacket
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


    private Element setTimelinItem(Message tlItem) {
        Log.debug("do func PublicMessageAdapter.setTimelinItem(...");
        Set<String> jidSet = new HashSet<String>();
        Element item = DocumentHelper.createElement("item");
        Element id = DocumentHelper.createElement("id");
        id.setText(String.valueOf(tlItem.getId()));
        item.add(id);

        Element itemId = DocumentHelper.createElement("item_id");
        itemId.setText(tlItem.getItemId());
        item.add(itemId);

        Element messageType = DocumentHelper.createElement("msgtype");
        messageType.setText(String.valueOf(tlItem.getMsgType()));
        item.add(messageType);

        Element messageFrom = DocumentHelper.createElement("msgfrom");
        String fromJid = tlItem.getMsgFrom();
        messageFrom.setText(fromJid);
        item.add(messageFrom);
        jidSet.add(fromJid);

        Element messageTo = DocumentHelper.createElement("msgto");
        messageTo.setText(tlItem.getMsgTo());
        item.add(messageTo);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entry;
        String entryStr = tlItem.getEntry();
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
        Element attachedItems = null;
        if (tlItem.getDeleteFlag() == 2) {
            String deletedBy = tlItem.getDeletedBy();
            if (MessageAdapter.isDeletedByAdmin(deletedBy)) {
                entry.element("body").setText(Message.BODY_DELETED_ADMIN);
            } else {
                entry.element("body").setText(Message.BODY_DELETED_SELF);
            }
            attachedItems = DocumentHelper.createElement("attached_items");
            attachedItems.addAttribute("count", String.valueOf(0));
        } else {
            attachedItems = entry.element("attached_items");
            if (attachedItems == null) {
                attachedItems = DocumentHelper.createElement("attached_items");
                attachedItems.addAttribute("count", String.valueOf(0));
            }
        }
        item.add(attachedItems.createCopy());
        entry.remove(attachedItems);
        item.add(entry);

        Element bodyType = DocumentHelper
                .createElement("body_type");
        bodyType.setText(String.valueOf(tlItem.getBodyType()));
        item.add(bodyType);

        Element publishNodename = DocumentHelper
                .createElement("publish_nodename");
        publishNodename.setText(tlItem.getPublishNodename());
        item.add(publishNodename);

        Element createdAt = DocumentHelper.createElement("created_at");
        createdAt.setText(tlItem.getCreatedAtStr());
        item.add(createdAt);

        Element updatedAt = DocumentHelper.createElement("updated_at");
        updatedAt.setText(tlItem.getUpdatedAtStr());
        item.add(updatedAt);

        Element replyId = DocumentHelper.createElement("reply_id");
        String replyIdStr = tlItem.getReplyId();
        replyId.setText((replyIdStr == null) ? "" : replyIdStr);
        item.add(replyId);

        Element replyTo = DocumentHelper.createElement("reply_to");
        String replyToStr = tlItem.getReplyTo();
        replyTo.setText((replyToStr == null) ? "" : replyToStr);
        item.add(replyTo);

        Element threadTitle = DocumentHelper.createElement("thread_title");
        String threadTitleStr = tlItem.getThreadTitle();
        threadTitle.setText((threadTitleStr == null) ? "" : threadTitleStr);
        item.add(threadTitle);

        Element threadRootId = DocumentHelper.createElement("thread_root_id");
        String threadRootIdStr = tlItem.getThreadRootId();
        threadRootId.setText((threadRootIdStr == null) ? "" : threadRootIdStr);
        item.add(threadRootId);

        Element quotation = QuotationMessageAdapter.getInstance().createElement(tlItem);
        item.add(quotation);

        List<GoodJob> goodJobList = tlItem.getGoodJobList();
        Element goodJob = GoodJobAdapter.getInstance().getGoodJobElement(
                goodJobList);
        item.add(goodJob);

        List<EmotionPoint> emotionPointList = tlItem.getEmotionPointList();
        Element emotionPoint = EmotionPointAdapter.getInstance().getEmotionPointElement(
                emotionPointList);
        item.add(emotionPoint);

        Element emotionPointIconJsonElm = DocumentHelper.createElement("emotion_point_icon");
        String emotionPointIconJson = tlItem.getEmotionPointIconJson();
        emotionPointIconJsonElm.setText((emotionPointIconJson == null) ? "{}" :  emotionPointIconJson);
        item.add(emotionPointIconJsonElm);

        Note note = tlItem.getNote();
        Element noteElm = NoteAdapter.getInstance().getNoteElement(note);
        item.add(noteElm);

        Element context = DocumentHelper.createElement("context");
        item.add(context);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(tlItem.getDeleteFlag()));
        item.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            item.add(personInfoElement);
        }

        return item;
    }

    private List<Message> getPublicMassageDbData(int baseId, int count,
            JID fromJID) {
        Log.debug("do func PublicMessageAdapter.getPublicMassageDbData(...");
        String from = fromJID.toBareJID();
        String dbWhere = "(" + MessageStoreDbHelper.TABLE_NAME + "."
                + MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME + "="
                + Message.TYPE_PUBLIC + ")";

        if (baseId > 0) {
            dbWhere += " AND ( " + MessageStoreDbHelper.TABLE_NAME + "."
                    + MessageStoreDbHelper.COLUMN_ID_NAME + " < " + baseId;
            dbWhere += " )";
        }
        List<String> systemMessageItemIdList = SystemMessageDbHelper
                .getSystemMessageHistoryItemId(from, count, baseId);
        if (systemMessageItemIdList != null) {
            int systemMessageCount = systemMessageItemIdList.size();
            if (systemMessageCount > 0) {
                dbWhere = "(" + dbWhere + ") OR (";
                boolean isSystemMessageItemIdFirst = true;
                for (int i = 0; i < systemMessageCount; i++) {
                    if (isSystemMessageItemIdFirst) {
                        isSystemMessageItemIdFirst = false;
                    } else {
                        dbWhere += " OR ";
                    }
                    dbWhere += MessageStoreDbHelper.TABLE_NAME + "."
                            + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME + "='"
                            + systemMessageItemIdList.get(i) + "'";
                }
                dbWhere += ")";
            }
        }

        List<String> systemQuestionnaireItemIdList = SystemMessageDbHelper
                .getPublicQuestionnaireItemId(count, baseId);
        if (systemQuestionnaireItemIdList != null) {
            int systemQuestionnaireCount = systemQuestionnaireItemIdList.size();
            if (systemQuestionnaireCount > 0) {
                dbWhere = "(" + dbWhere + ") OR (";
                boolean isSystemQuestionnaireItemIdFirst = true;
                for (int i = 0; i < systemQuestionnaireCount; i++) {
                    if (isSystemQuestionnaireItemIdFirst) {
                        isSystemQuestionnaireItemIdFirst = false;
                    } else {
                        dbWhere += " OR ";
                    }
                    dbWhere += MessageStoreDbHelper.TABLE_NAME + "."
                            + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME + "='"
                            + systemQuestionnaireItemIdList.get(i) + "'";
                }
                dbWhere += ")";
            }
        }
        dbWhere = "((" + dbWhere + ") AND ((" + MessageStoreDbHelper.TABLE_NAME
                + "." + MessageStoreDbHelper.COLUMN_DELETE_FLAG_NAME + "="
                + Message.DELETE_FLAG_NON_DELETED + ") OR ("
                + MessageStoreDbHelper.TABLE_NAME + "."
                + MessageStoreDbHelper.COLUMN_DELETE_FLAG_NAME + "="
                + Message.DELETE_FLAG_TRUSH + ")))";

        String dbOrder = "ORDER BY " + MessageStoreDbHelper.TABLE_NAME + "."
                + MessageStoreDbHelper.COLUMN_ID_NAME + " DESC";

        String dbLimit = "LIMIT " + String.valueOf(count);

        String sql = MessageStoreDbHelper.getMessageListSQLAppendReadInfo(from)
                + " WHERE " + dbWhere + " " + dbOrder + " " + dbLimit;

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        List<Message> retList = null;
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }

            retList = new ArrayList<Message>();
            ResultSet resultSet = dbHelper.executeQuery(sql);
            try {
                while (resultSet.next()) {
                    Message publicMessage = MessageStoreDbHelper
                            .getOneMessageByResultSet(resultSet, true, false);
                    if (publicMessage != null) {
                        retList.add(publicMessage);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }

            dbHelper.close();
            MessageStoreDbHelper.complementReaderInfo(retList);

            for (int i = 0; i < retList.size(); i++) {
                Message tlItem = retList.get(i);
                Note note = NoteStoreDbHelper
                    .getNoteData(tlItem.getThreadRootId());
                tlItem.setNote(note);
            }
        } catch (Exception e) {
        }

        return retList;
    }
}
