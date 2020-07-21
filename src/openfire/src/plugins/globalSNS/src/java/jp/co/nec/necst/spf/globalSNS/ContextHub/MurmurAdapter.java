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
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;

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
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.user.User;

import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.Notification.MurmurNotifier;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;

public class MurmurAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(MurmurAdapter.class);
    private static MurmurAdapter mInstance = null;

    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateMurmurMessageItemId = new ConcurrentHashMap<String, Object>();

    private static final String SEND_MESSAGE_NAMESPACE = "http://necst.nec.co.jp/protocol/send";
    private static final String UPDATE_MESSAGE_BODY_NAMESPACE = "http://necst.nec.co.jp/protocol/updatemessagebody";

    private MurmurAdapter() {
    }

    public static MurmurAdapter getInstance() {
        Log.debug("do func MurmurAdapter.getInstance(...");
        if (mInstance == null) {
            mInstance = new MurmurAdapter();
        }
        return mInstance;
    }

    public IQ receiveMurmurMessage(IQ iq) {
        Log.debug("do func MurmurAdapter.receiveMurmurMessage(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MurmurAdapter#receiveMurmurMessage::iq is null");
            return ret;
        }
        Message murmurMemssge = getMurmurMemssageFromSendMurmurMemberXMPP(iq);
        if (murmurMemssge == null) {
            Log.error("MurmurAdapter#receiveMurmurMessage::murmurMemssge is null");
            return ret;
        }

        String requestJid = murmurMemssge.getMsgTo();

        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateMurmurMessageItemId) {
            lockObject = mLockObjectMapStringToObjectForGenerateMurmurMessageItemId.get(requestJid);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateMurmurMessageItemId.put(requestJid, lockObject);
            }
        }
        String itemId = null;
        synchronized (lockObject) {
            int nextMurmurMessageItemIdNumber
                = MurmurMessageDbHelper.getNextMurmurMessageIdNumber(requestJid);
            String murmurMessageItemIdPrefix
                = MurmurMessageDbHelper.getMurmurMessageItemIdPrefix(requestJid);
            if (nextMurmurMessageItemIdNumber <= 0
                    || murmurMessageItemIdPrefix == null
                    || murmurMessageItemIdPrefix.equals("")) {
                Log.error("MurmurManager#receiveMessage::itemIdIndex or murmurMessageItemIdPrefix is invalid. requestJid="
                        + requestJid);
                return null;
            }
            itemId = murmurMessageItemIdPrefix
                    + nextMurmurMessageItemIdNumber;
            murmurMemssge.setItemId(itemId);

            if (!MessageStoreDbHelper.insertMessageToDb(murmurMemssge)) {
                Log.error("MurmurAdapter#receiveMurmurMessage::null from MessageStoreDbHelper.insertMessageWithItemIdToDb");
                return null;
            }
        }
        Message savedMurmurMessage = MessageAdapter.getInstance().getMessageWithoutReadInfo(itemId);

        MessageReadInfoSetter.getInstance().setInitialData
            (savedMurmurMessage);

        ret = createSendMurmurMessageResponsePacket
            (iq, savedMurmurMessage);

        MurmurNotifier.getInstance().notifyMurmurMessage
            (savedMurmurMessage);

        return ret;
    }

    public IQ receiveUpdateMurmurMessageBody(IQ iq) {
        Log.debug("do func MurmurAdapter.receiveUpdateMurmurMessageBody(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MurmurAdapter#receiveUpdateMurmurMessageBody::iq is null");
            return ret;
        }

        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("MurmurAdapter#receiveUpdateMurmurMessageBody::not type set");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MurmurAdapter#receiveUpdateMurmurMessageBody::messageElem is null");
            return ret;
        }
        Element content = messageElem.element("content");
        if (content == null) {
            Log.error("MurmurAdapter#receiveUpdateMurmurMessageBody::contentElem is null");
            return ret;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Murmur.equals(ContentType
                .toType(type))) {
            Log.error("MurmurAdapter#receiveUpdateMurmurMessageBody::not type Murmur");
            return ret;
        }
        Element bodyElm = content.element("body");
        if(bodyElm == null ||
           bodyElm.getStringValue() == null){
            Log.error("MurmurAdapter#receiveUpdateMurmurMessageBody::bodyElm is invalid");
            return createUpdateMessageMurmurResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }

        Element itemIdElm = content.element("item_id");
        if(itemIdElm == null ||
           itemIdElm.getStringValue() == null){
            Log.error("MurmurAdapter#receiveUpdateMurmurMessageBody::itemIdElm is invalid");
            return createUpdateMessageMurmurResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String itemId = itemIdElm.getStringValue();
        String fromJid = iq.getFrom().toBareJID();

        Element entryElm = DocumentHelper.createElement("entry");
        entryElm.addNamespace("","http://necst.nec.co.jp/protocol/updatemessagebody");
        entryElm.add(DocumentHelper.createElement("body").addText(bodyElm.getStringValue()));
        entryElm.add(DocumentHelper.createElement("attached_items").addAttribute("count","0"));
        Log.debug("MurmurAdapter.receiveUpdateMurmurMessageBody MessageStoreDbHelper.updateMessageBodyToDb entryXML:" + entryElm.asXML());

        if(!MessageStoreDbHelper.updateMessageBodyToDb(11,
                                                       itemId,
                                                       entryElm.asXML(),
                                                       fromJid, null)){
            Log.error("MurmurAdapter.receiveUpdateMurmurMessageBody MessageStoreDbHelper.updateMessageBodyToDb error");
            return createUpdateMessageMurmurResponsePacket
                (iq, GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR);
        }

        Message savedMessage = MessageAdapter
            .getInstance().getMessageWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().resetInitialData(savedMessage);

        MurmurNotifier.getInstance().notifyMurmurUpdateMessage(savedMessage);

        return createUpdateMessageMurmurResponsePacket(iq, GlobalSNSUtils.API_STATUS_SUCCESS);
    }

    private Message getMurmurMemssageFromSendMurmurMemberXMPP(IQ iq) {
        Log.debug("do func MurmurAdapter.getMurmurMemssageFromSendMurmurMemberXMPP(...");
        Message ret = null;
        if (iq == null) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::iq is null");
            return ret;
        }
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::not type set");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::messageElem is null");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::contentElem is null");
            return ret;
        }
        Attribute typeAttr = contentElem.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Murmur.equals(ContentType
                .toType(type))) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::not type Murmur");
            return ret;
        }
        Element msgfromElem = contentElem.element("msgfrom");
        if (msgfromElem == null) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::msgfromElem is null");
            return ret;
        }
        String from = msgfromElem.getStringValue();
        if (from == null || from.equals("")) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::from is invalid");
            return ret;
        }
        Element msgtoElem = contentElem.element("msgto");
        if (msgtoElem == null) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::msgtoElem is null");
            return ret;
        }
        Element entryElem = contentElem.element("entry");
        if (entryElem == null) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::entryElem is null");
            return ret;
        }
        Element attachedItemsElem = contentElem.element("attached_items");
        if (attachedItemsElem == null) {
            Log.debug("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::attachedItemsElem is null");
            attachedItemsElem = DocumentHelper.createElement("attached_items");
            attachedItemsElem.addAttribute("count", String.valueOf(0));
        }
        Element tmpEntry = entryElem.createCopy();
        tmpEntry.add(attachedItemsElem.createCopy());
        String entryData = tmpEntry.asXML();
        if (entryData == null || entryData.equals("")) {
            Log.error("MurmurAdapter#getMurmurMemssageFromSendMurmurMemberXMPP::entryData is invalid");
            return ret;
        }
        String msgto = "";
        Element replyIdElem = contentElem.element("reply_id");
        String replyItemId = "";
        if (replyIdElem != null) {
            replyItemId = replyIdElem.getStringValue();
            String _replayId = new String(replyItemId);
            if(_replayId.matches("^[^_]+_.+_\\d+$")){
                String _from = new String(from);
                String ofuid = _replayId.replaceAll("^[^_]+_(.+)_\\d+$","$1");
                msgto = ofuid + _from.substring(from.indexOf("@"),from.length());
            }else{
                msgto = from;
            }
        }else{
            msgto = from;
        }
        Element replyToElem = contentElem.element("reply_to");
        String replyTo = "";
        if (replyToElem != null) {
            replyTo = replyToElem.getStringValue();
        }
        Element bodyType = contentElem.element("body_type");
        int bodyTypeInt = 0;
        if (bodyType != null) {
            try{
                bodyTypeInt = Integer.parseInt(bodyType.getStringValue());
            } catch (NumberFormatException e) {
                Log.warn("body_type is not Number.");
            }
        }

        Element threadTitleElem = contentElem.element("thread_title");
        String threadTitle = "";
        if (threadTitleElem != null) {
            threadTitle = threadTitleElem.getStringValue();
        }
        Log.debug("do func MurmurAdapter.getMurmurMemssageFromSendMurmurMemberXMPP(...  threadTitle : " + threadTitle);

        Element quotationItemIdElem = contentElem.element("quotation_item_id");
        String quotationItemIdStr = "";
        if(quotationItemIdElem != null){
            quotationItemIdStr = quotationItemIdElem.getStringValue();
        }

        Message murmurMessage = new Message();
        murmurMessage.setMsgType(Message.TYPE_MURMUR);
        murmurMessage.setMsgFrom(from);
        murmurMessage.setMsgTo(msgto);
        murmurMessage.setEntry(entryData);
        murmurMessage.setReplyId(replyItemId);
        murmurMessage.setReplyTo(replyTo);
        murmurMessage.setBodyType(bodyTypeInt);
        murmurMessage.setThreadTitle(threadTitle);
        murmurMessage.setQuotationItemId(quotationItemIdStr);
        Calendar now = Calendar.getInstance();
        Timestamp timeStamp = new Timestamp(now.getTimeInMillis());
        murmurMessage.setCreatedAt(timeStamp);

        ret = murmurMessage;
        return ret;
    }

    private IQ createSendMurmurMessageResponsePacket(IQ iq,
            Message savedMurmurMessage) {
        Log.debug("do func MurmurAdapter.createSendMurmurMessageResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MurmurAdapter#createSendMurmurMessageResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MurmurAdapter#createSendMurmurMessageResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MurmurAdapter#createSendMurmurMessageResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(SEND_MESSAGE_NAMESPACE))) {
            Log.error("MurmurAdapter#createSendMurmurMessageResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = createSendMurmurMessageContentElem(savedMurmurMessage);
        if (newContentElem == null) {
            Log.info("MurmurAdapter#createSendMurmurMessageResponsePacket::newContentElem is null.");
            return ret;
        }
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        ret = replyPacket;
        return ret;
    }

    private IQ createUpdateMessageMurmurResponsePacket
        (IQ iq, int resultCode) {
        Log.debug("do func MurmurAdapter.createSendMurmurMessageResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("MurmurAdapter#createSendMurmurMessageResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MurmurAdapter#createSendMurmurMessageResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MurmurAdapter#createSendMurmurMessageResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(UPDATE_MESSAGE_BODY_NAMESPACE))) {
            Log.error("MurmurAdapter#createSendMurmurMessageResponsePacket::namespace is invalid");
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

    public Element createSendMurmurMessageContentElem(Message savedMurmurMessage) {
        Log.debug("do func MurmurAdapter.createSendMurmurMessageContentElem(...");
        Element ret = null;
        if (savedMurmurMessage == null) {
            Log.error("MurmurAdapter#createSendMurmurMessageContentElem::savedMurmurMessage is null");
            return ret;
        }
        Element contentElem = DocumentHelper.createElement("content");
        contentElem.addAttribute("type",
                                 IQMessageSendHandler.ContentType.Murmur.toString());
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = MessageAdapter.getInstance().getMessageItemElement(savedMurmurMessage);
        if (itemElem == null) {
            Log.info("MurmurAdapter#createSendMurmurMessageContentElem::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        contentElem.add(itemsElem);

        ret = contentElem;
        return ret;
    }

    public Element getMurmurMessageItemElement(Message murmurMessage) {
        Log.debug("do func MurmurAdapter.getMurmurMessageItemElement(...");
        Element ret = null;
        if (murmurMessage == null) {
            Log.error("MurmurAdapter#getMurmurMessageItemElement::groupChatMessage is null");
            return ret;
        }
        if (Message.TYPE_MURMUR != murmurMessage.getMsgType()) {
            Log.error("MurmurAdapter#getMurmurMessageItemElement::message type is not Murmur");
            return ret;
        }
        Set<String> jidSet = new HashSet<String>();
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(murmurMessage.getId()));
        itemElem.add(idElem);

        Element itemIdElem = DocumentHelper.createElement("item_id");
        itemIdElem.setText(murmurMessage.getItemId());
        itemElem.add(itemIdElem);

        Element messageTypeElem = DocumentHelper.createElement("msgtype");
        messageTypeElem.setText(String.valueOf(murmurMessage.getMsgType()));
        itemElem.add(messageTypeElem);

        Element messageFromElem = DocumentHelper.createElement("msgfrom");
        String fromJid = murmurMessage.getMsgFrom();
        messageFromElem.setText(fromJid);
        itemElem.add(messageFromElem);
        jidSet.add(fromJid);

        Element messageToElem = DocumentHelper.createElement("msgto");
        String toJid = murmurMessage.getMsgTo();
        messageToElem.setText(toJid);
        itemElem.add(messageToElem);
        jidSet.add(toJid);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entryElem;
        String entryStr = murmurMessage.getEntry();
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
        if (murmurMessage.getDeleteFlag() == 2) {
            String deletedBy = murmurMessage.getDeletedBy();
            if (MessageAdapter.isDeletedByAdmin(deletedBy)) {
                entryElem.element("body").setText(Message.BODY_DELETED_ADMIN);
            } else {
                entryElem.element("body").setText(Message.BODY_DELETED_SELF);
            }
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
        createdAtElem.setText(murmurMessage.getCreatedAtStr());
        itemElem.add(createdAtElem);

        Element updatedAt = DocumentHelper.createElement("updated_at");
        updatedAt.setText(murmurMessage.getUpdatedAtStr());
        itemElem.add(updatedAt);

        Element replyIdElem = DocumentHelper.createElement("reply_id");
        String replyIdStr = murmurMessage.getReplyId();
        replyIdElem.setText((replyIdStr == null) ? "" : replyIdStr);
        itemElem.add(replyIdElem);

        Element replyToElem = DocumentHelper.createElement("reply_to");
        String replyToStr = murmurMessage.getReplyTo();
        replyToElem.setText((replyToStr == null) ? "" : replyToStr);
        itemElem.add(replyToElem);

        Element bodyType = DocumentHelper.createElement("body_type");
        bodyType.setText(String.valueOf(murmurMessage.getBodyType()));
        itemElem.add(bodyType);

        Element threadTitleElem = DocumentHelper.createElement("thread_title");
        String threadTitleStr = murmurMessage.getThreadTitle();
        threadTitleElem.setText((threadTitleStr == null) ? "" : threadTitleStr);
        itemElem.add(threadTitleElem);

        Element threadRootIdElem = DocumentHelper.createElement("thread_root_id");
        String threadRootIdStr = murmurMessage.getThreadRootId();
        threadRootIdElem.setText((threadRootIdStr == null) ? "" : threadRootIdStr);
        itemElem.add(threadRootIdElem);

        Element quotation = QuotationMessageAdapter.getInstance().createElement(murmurMessage);
        itemElem.add(quotation);

        Element emotionPoint = EmotionPointAdapter.getInstance().getEmotionPointElement(murmurMessage.getEmotionPointList());
        itemElem.add(emotionPoint);

        Element emotionPointIconJsonElm = DocumentHelper.createElement("emotion_point_icon");
        String emotionPointIconJson = murmurMessage.getEmotionPointIconJson();
        emotionPointIconJsonElm.setText((emotionPointIconJson == null) ? "{}" :  emotionPointIconJson);
        itemElem.add(emotionPointIconJsonElm);

        List<GoodJob> goodJobList = murmurMessage.getGoodJobList();
        Element goodJobElem = GoodJobAdapter.getInstance().getGoodJobElement(
                goodJobList);
        itemElem.add(goodJobElem);

        Element messageColumnNameElem = DocumentHelper.createElement("column_name");
        String columnName = murmurMessage.getColumnName();
        messageColumnNameElem.setText(columnName == null ? "" : columnName);
        itemElem.add(messageColumnNameElem);

        Note note = murmurMessage.getNote();
        Element noteElm = NoteAdapter.getInstance().getNoteElement(note);
        itemElem.add(noteElm);

        Element contextElem = DocumentHelper.createElement("context");
        itemElem.add(contextElem);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(murmurMessage.getDeleteFlag()));
        itemElem.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            itemElem.add(personInfoElement);
        }

        return itemElem;
    }

    public Set<String> getMurmurMessageReceiverSet() {
        Log.debug("do func MurmurAdapter.getMurmurMessageReceiverSet(...");
        Set<String> ret = new HashSet<String>();
        String[] targetUserArray = getMurmurMessageReceiverUserNameArray();
        for (String targetUserName : targetUserArray) {
            if (targetUserName == null) {
                continue;
            }
            JID jid = XMPPServer.getInstance().createJID(targetUserName, null);
            ret.add(jid.toBareJID());
        }
        return ret;
    }

    private String[] getMurmurMessageReceiverUserNameArray() {
        Log.debug("do func MurmurAdapter.getMurmurMessageReceiverUserNameArray(...");
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
}
