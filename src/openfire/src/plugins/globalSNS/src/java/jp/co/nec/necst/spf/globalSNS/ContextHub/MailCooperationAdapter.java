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
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.MailBody;
import jp.co.nec.necst.spf.globalSNS.Data.MailCooperationInfo;
import jp.co.nec.necst.spf.globalSNS.Data.MailServerInfo;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.MailCooerationCondition.AndCondition;
import jp.co.nec.necst.spf.globalSNS.Data.MailCooerationCondition.FilterCondition;
import jp.co.nec.necst.spf.globalSNS.Data.MailCooerationCondition.ItemCondition;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.Notification.MailMessageNotifier;

import org.dom4j.Attribute;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.openfire.XMPPServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class MailCooperationAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(MailCooperationAdapter.class);
    private static MailCooperationAdapter mInstance = null;

    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateId = new ConcurrentHashMap<String, Object>();

    private MailCooperationAdapter() {
    }

    public static MailCooperationAdapter getInstance() {
        if (mInstance == null) {
            mInstance = new MailCooperationAdapter();
        }
        return mInstance;
    }

    public IQ setMailCooperationSettings(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#setMailCooperationSettings::iq is null");
            return ret;
        }
        List<MailCooperationInfo> mailCooperationInfoList = getMailCooperationInfoFromMailListCooperationXMPP(iq);
        if (mailCooperationInfoList == null) {
            return ret;
        }
        int count = mailCooperationInfoList.size();

        for (int i = 0; i < count; i++) {
            MailCooperationInfo mailCooperationInfo = mailCooperationInfoList
                    .get(i);
            boolean updateRet = MailCooperationStoreDbHelper
                    .updateMailCooperationInfo(mailCooperationInfo);
            if (!updateRet) {
                return ret;
            }
        }
        ret = IQ.createResultIQ(iq);
        return ret;
    }

    @SuppressWarnings("unchecked")
    private List<MailCooperationInfo> getMailCooperationInfoFromMailListCooperationXMPP(
            IQ iq) {
        List<MailCooperationInfo> ret = new ArrayList<MailCooperationInfo>();
        if (iq == null) {
            Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::iq is null");
            return null;
        }
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();
        if (iq.getType() != IQ.Type.set) {
            Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::iq type is not set");
            return null;
        }
        Element mailElem = iq.getChildElement();
        if (mailElem == null) {
            Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::mailElem is null");
            return null;
        }
        String tagName = mailElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("mail"))) {
            Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::tagName is invalid");
            return null;
        }
        String namespace = mailElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/setsettings"))) {
            Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::namespace is invalid");
            return null;
        }
        Element contentElem = mailElem.element("content");
        if (contentElem == null) {
            Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::contentElem is null");
            return null;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::itemsElem is null");
            return null;
        }
        List<Element> itemsElementList = itemsElem.elements();
        if (itemsElementList == null) {
            Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP itemsElementList is null");
            return null;
        }
        int count = itemsElementList.size();
        for (int i = 0; i < count; i++) {
            Element itemElement = itemsElementList.get(i);
            Element idElem = itemElement.element("id");
            if (idElem == null) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::idElem is null");
                return null;
            }
            String idStr = idElem.getStringValue();
            int id = 0;
            try {
                id = Integer.parseInt(idStr);
            } catch (NumberFormatException e) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::idStr is not number");
                return null;
            }
            Element serverIdElem = itemElement.element("server_id");
            if (serverIdElem == null) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::idElem is null");
                return null;
            }
            int serverId = 0;
            String serverIdStr = serverIdElem.getStringValue();
            try {
                serverId = Integer.parseInt(serverIdStr);
            } catch (NumberFormatException e) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::idStr is not number");
                return null;
            }
            Element branchNumberElem = itemElement.element("branch_number");
            if (branchNumberElem == null) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::branchNumberElem is null");
                return null;
            }
            int branchNumber = 0;
            String branchNumberStr = branchNumberElem.getStringValue();
            try {
                branchNumber = Integer.parseInt(branchNumberStr);
            } catch (NumberFormatException e) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::branchNumberStr is not number");
                return null;
            }
            Element mailCooperationTypeElem = itemElement
                    .element("mail_cooperation_type");
            if (mailCooperationTypeElem == null) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::mailCooperationTypeElem is null");
                return null;
            }
            int type = 0;
            String typeStr = mailCooperationTypeElem.getStringValue();
            try {
                type = Integer.parseInt(typeStr);
            } catch (NumberFormatException e) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::typeStr is not number");
                return null;
            }
            Element mailElement = itemElement.element("mail_address");
            if (mailElement == null) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::mailElement is null");
                return null;
            }
            String mail = mailElement.getStringValue();
            Element settingInfoElement = itemElement.element("setting_info");
            if (settingInfoElement == null) {
                Log.error("MailCooperationAdapter#getMailCooperationInfoFromMailCooperationXMPP::settingInfoElement is null");
                return null;
            }
            String settingInfo = settingInfoElement.asXML();

            MailCooperationInfo mailCooperationInfo = new MailCooperationInfo();
            mailCooperationInfo.setId(id);
            mailCooperationInfo.setServerId(serverId);
            mailCooperationInfo.setBranchNumber(branchNumber);
            mailCooperationInfo.setMailCooperationType(type);
            mailCooperationInfo.setMailAddress(mail);
            mailCooperationInfo.setSettingInfo(settingInfo);
            mailCooperationInfo.setJid(fromJidStr);
            ret.add(mailCooperationInfo);
        }
        return ret;
    }

    public IQ getMailServerList(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#getMailServerList::iq is null");
            return ret;
        }
        boolean isGetMailServerListRequest = isGetMailServerListXMPPRequest(iq);
        if (isGetMailServerListRequest == false) {
            Log.error("MailCooperationAdapter#getMailServerList::XMPP is invalid");
            return ret;
        }

        ret = createGetMailServerListResponsePacket(iq);
        return ret;
    }

    private boolean isGetMailServerListXMPPRequest(IQ iq) {
        boolean ret = false;
        if (iq == null) {
            Log.error("MailCooperationAdapter#isGetMailServerListXMPPRequest::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MailCooperationAdapter#isGetMailServerListXMPPRequest::iq type is not get");
            return ret;
        }
        Element mailElem = iq.getChildElement();
        if (mailElem == null) {
            Log.error("MailCooperationAdapter#isGetMailServerListXMPPRequest::mailElem is null");
            return ret;
        }
        String tagName = mailElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("mail"))) {
            Log.error("MailCooperationAdapter#isGetMailServerListXMPPRequest::tagName is invalid");
            return ret;
        }
        String namespace = mailElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getserverlist"))) {
            Log.error("MailCooperationAdapter#isGetMailServerListXMPPRequest::namespace is invalid");
            return ret;
        }
        Element contentElem = mailElem.element("content");
        if (contentElem == null) {
            Log.error("MailCooperationAdapter#isGetMailServerListXMPPRequest::contentElem is null");
            return ret;
        }
        ret = true;
        return ret;
    }

    private IQ createGetMailServerListResponsePacket(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#createGetMailServerListResponsePacket::iq is null");
            return ret;
        }
        Element mailElem = iq.getChildElement();
        if (mailElem == null) {
            Log.error("MailCooperationAdapter#createGetMailServerListResponsePacket::mailElem is null");
            return ret;
        }
        String tagName = mailElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("mail"))) {
            Log.error("MailCooperationAdapter#createGetMailServerListResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = mailElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getserverlist"))) {
            Log.error("MailCooperationAdapter#createGetMailServerListResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = mailElem.element("content");
        if (contentElem != null) {
            mailElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        List<MailServerInfo> mailServerInfoList = MailServerListDbHelper
                .getMailServerList();
        if (mailServerInfoList == null) {
            Log.error("MailCooperationAdapter#createGetMailServerListResponsePacket::mailServerInfoList is null");
            return ret;
        }
        int count = mailServerInfoList.size();
        int index = 0;
        for (int i = 0; i < count; i++) {
            MailServerInfo mailServerInfo = mailServerInfoList.get(i);
            if (mailServerInfo == null) {
                continue;
            }
            Element itemElem = getMailServerInfoItemElem(mailServerInfo);
            ;
            if (itemElem == null) {
                Log.error("MailCooperationAdapter#createGetMailServerListResponsePacket::itemElem is null");
                return ret;
            }
            itemsElem.add(itemElem);
            index++;
        }
        itemsElem.addAttribute("count", String.valueOf(index));
        newContentElem.add(itemsElem);
        mailElem.add(newContentElem);
        mailElem.setParent(null);
        replyPacket.setChildElement(mailElem);
        ret = replyPacket;
        return ret;
    }

    private Element getMailServerInfoItemElem(MailServerInfo mailServerInfo) {
        if (mailServerInfo == null) {
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(mailServerInfo.getId()));
        itemElem.add(idElem);

        Element displayNameElem = DocumentHelper.createElement("display_name");
        displayNameElem.setText(mailServerInfo.getDisplayName());
        itemElem.add(displayNameElem);

        Element serverTypeElem = DocumentHelper.createElement("server_type");
        serverTypeElem.setText(String.valueOf(mailServerInfo.getServerType()));
        itemElem.add(serverTypeElem);

        Element createdAtElem = DocumentHelper.createElement("created_at");
        createdAtElem.setText(mailServerInfo.getCreatedAtStr());
        itemElem.add(createdAtElem);

        Element createdByElem = DocumentHelper.createElement("created_by");
        createdByElem.setText(mailServerInfo.getCreatedBy());
        itemElem.add(createdByElem);

        Element updatedAtElem = DocumentHelper.createElement("updated_at");
        updatedAtElem.setText(mailServerInfo.getUpdatedAtStr());
        itemElem.add(updatedAtElem);

        Element updatedByElem = DocumentHelper.createElement("updated_by");
        String updatedBy = mailServerInfo.getUpdatedBy();
        updatedByElem.setText((updatedBy == null) ? "" : updatedBy);
        itemElem.add(updatedByElem);

        Element popHostElem = DocumentHelper.createElement("pop_host");
        popHostElem.setText(mailServerInfo.getPopHost());
        itemElem.add(popHostElem);

        Element popPortElem = DocumentHelper.createElement("pop_port");
        popPortElem.setText(String.valueOf(mailServerInfo.getPopPort()));
        itemElem.add(popPortElem);

        Element popAuthModeElem = DocumentHelper.createElement("pop_auth_mode");
        popAuthModeElem
                .setText(String.valueOf(mailServerInfo.getPopAuthMode()));
        itemElem.add(popAuthModeElem);

        Element popResponseTimeoutElem = DocumentHelper
                .createElement("pop_response_timeout");
        popResponseTimeoutElem.setText(String.valueOf(mailServerInfo
                .getPopResonseTimeout()));
        itemElem.add(popResponseTimeoutElem);

        return itemElem;
    }

    public boolean receivedMailMessage(IQ iq) {
        boolean ret = false;
        if (iq == null) {
            Log.error("MailCooperationAdapter#receivedMailMessage::iq is null");
            return ret;
        }
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("MailCooperationAdapter#receivedMailMessage::not type set");
            return ret;
        }

        Element message = iq.getChildElement();
        if (message == null) {
            Log.error("MailCooperationAdapter#receivedMailMessage::not message");
            return ret;
        }
        Element content = message.element("content");
        if (content == null) {
            Log.error("MailCooperationAdapter#receivedMailMessage::not content");
            return ret;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Mail.equals(ContentType
                .toType(type))) {
            Log.error("MailCooperationAdapter#receivedMailMessage::not type Mail");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromUserName = fromJid.getNode();
        if (!UserAuthorityAdapter.getInstance().isAdmin(fromUserName)) {
            Log.info("MailCooperationAdapter#receivedMailMessage::not Admin User (Username = "
                    + fromUserName + ")");
            return false;
        }

        List<String> saveItemIdList = saveMailMessage(content,
                fromJid.toBareJID());

        MailMessageNotifier.getInstance().notifyMessage(saveItemIdList);

        return true;
    }

    @SuppressWarnings("unchecked")
    private List<String> saveMailMessage(Element contentElem, String fromJid) {
        List<String> ret = null;
        if (contentElem == null) {
            Log.error("MailCooperationAdapter#saveMailMessage::contentElem is null");
            return ret;
        }
        if (fromJid == null || fromJid.equals("")) {
            Log.error("MailCooperationAdapter#saveMailMessage::fromJid is invalid");
            return ret;
        }
        Attribute typeAttr = contentElem.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Mail.equals(ContentType
                .toType(type))) {
            Log.error("MailCooperationAdapter#saveMailMessage::type is not 'Mail'");
            return ret;
        }
        Element itemsElem = contentElem.element("items");
        if (itemsElem == null) {
            Log.error("MailCooperationAdapter#saveMailMessage::itemsElem is null");
            return ret;
        }

        List<Element> itemElemList = itemsElem.elements();
        if (itemElemList == null) {
            Log.error("MailCooperationAdapter#saveMailMessage::itemElemList is null");
            return ret;
        }
        ret = new ArrayList<String>();
        int count = itemElemList.size();
        for (int i = 0; i < count; i++) {
            Element itemElem = itemElemList.get(i);
            if (itemElem == null) {
                Log.error("MailCooperationAdapter#saveMailMessage::itemElem is null. No."
                        + String.valueOf(i));
                continue;
            }
            Message mailMessage = getMailMessageFromSendMailMessageItemXMPP(itemElem);
            if (mailMessage == null) {
                Log.error("MailCooperationAdapter#saveMailMessage::mailMessage is null. No."
                        + String.valueOf(i));
                continue;
            }

            Calendar now = Calendar.getInstance();
            Timestamp timeStamp = new Timestamp(now.getTimeInMillis());
            mailMessage.setCreatedAt(timeStamp);

            String mailInReplyTo = mailMessage.getMailInReplyTo();
            if (!mailInReplyTo.equals("")) {
                String replyTo = MailMessageDbHelper
                        .getItemIdFromMailInReplyTo(mailInReplyTo,
                                mailMessage.getMsgTo());
                if (replyTo != null) {
                    mailMessage.setReplyTo(replyTo);
                }
            }

            String msgToJidStr = mailMessage.getMsgTo();
            if (msgToJidStr == null) {
                Log.error("MailCooperationAdapter#saveMailMessage::msgToJidStr is null. No."
                        + String.valueOf(i));
                continue;
            }
            Object lockObject = null;
            synchronized (mLockObjectMapStringToObjectForGenerateId) {
                lockObject = mLockObjectMapStringToObjectForGenerateId
                        .get(msgToJidStr);
                if (lockObject == null) {
                    lockObject = new Object();
                    mLockObjectMapStringToObjectForGenerateId.put(msgToJidStr,
                            lockObject);
                }
            }
            String itemId = null;
            synchronized (lockObject) {
                int nextMailMessageItemIdNumber = MailMessageDbHelper
                        .getNextMailMessageIdNumber(msgToJidStr);
                if (nextMailMessageItemIdNumber <= 0) {
                    Log.error("MailCooperationAdapter#saveMailMessage::nextMailMessageItemIdNumber is invalid");
                    continue;
                }
                String mailMessageItemIdPrefix = MailMessageDbHelper
                        .getMailMessageItemIdPrefix(mailMessage.getMsgTo());
                if (mailMessageItemIdPrefix == null
                        || mailMessageItemIdPrefix.equals("")) {
                    Log.error("MailCooperationAdapter#saveMailMessage::mailMessageItemIdPrefix is invalid");
                    continue;
                }
                itemId = mailMessageItemIdPrefix
                        + nextMailMessageItemIdNumber;
                mailMessage.setItemId(itemId);

                if (!MessageStoreDbHelper.insertMessageToDb(mailMessage)) {
                    Log.error("MailCooperationAdapter#saveMailMessage::failed to save message to database");
                    continue;
                }
            }

            MailBody mailBody = new MailBody();
            mailBody.setItemId(itemId);
            mailBody.setJid(mailMessage.getMsgTo());
            mailBody.setMailBody(mailMessage.getMailBody());
            MailBodyStoreDbHelper.insertMailBodyToDb(mailBody);

            ret.add(itemId);

            Message savedMailMessage = MessageAdapter.getInstance()
                    .getMessageWithoutReadInfo(itemId);
            MessageReadInfoSetter.getInstance()
                    .setInitialData(savedMailMessage);

        }

        return ret;
    }

    private Message getMailMessageFromSendMailMessageItemXMPP(Element itemElem) {
        Log.debug("do func MailCooperationAdapter.getMailMessageFromSendMailMessageItemXMPP(");
        Message ret = null;
        if (itemElem == null) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::itemElem is null");
            return ret;
        }
        Element msgToElem = itemElem.element("msgto");
        if (msgToElem == null) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::msgToElem is null");
            return ret;
        }
        Element entryElem = itemElem.element("entry");
        if (entryElem == null) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::entryElem is null");
            return ret;
        }
        Element priorityElem = itemElem.element("priority");
        if (priorityElem == null) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::priorityElem is null");
            return ret;
        }
        Element mailMessageIdElem = itemElem.element("mail_message_id");
        if (mailMessageIdElem == null) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::mailMessageIdElem is null");
            return ret;
        }
        Element mailInReplyToElem = itemElem.element("mail_in_reply_to");
        if (mailInReplyToElem == null) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::mailInReplyToElem is null");
            return ret;
        }
        Element attachedItemsElem = itemElem.element("attached_items");
        if (attachedItemsElem == null) {
            Log.debug("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::attachedItemsElem is null");
            attachedItemsElem = DocumentHelper.createElement("attached_items");
            attachedItemsElem.addAttribute("count", String.valueOf(0));
        }
        Element contextElem = itemElem.element("context");
        if (contextElem == null) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::contextElem is null");
            return ret;
        }

        Element mailBodyElem = itemElem.element("mail_body");
        if (mailBodyElem == null) {
            Log.debug("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::mailBodyElem is null");
            return ret;
        }

        Message mailMessage = new Message();

        mailMessage.setMsgType(Message.TYPE_MAIL);

        mailMessage.setMsgFrom(XMPPServer.getInstance().getServerInfo()
                .getXMPPDomain());

        mailMessage.setMsgTo(msgToElem.getStringValue());

        Element tmpEntry = entryElem.createCopy();
        tmpEntry.add(attachedItemsElem.createCopy());
        String entryData = tmpEntry.asXML();
        if (entryData == null || entryData.equals("")) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::entryData is invalid");
            return ret;
        }
        mailMessage.setEntry(entryData);
        int priority = 1;
        try {
            priority = Integer.parseInt(priorityElem.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("MailCooperationAdapter#getMailMessageFromSendMailMessageItemXMPP::priorityElem is invalid");
            return ret;
        }
        mailMessage.setPriority(priority);
        mailMessage.setMailMessageId(mailMessageIdElem.getStringValue());
        mailMessage.setMailInReplyTo(mailInReplyToElem.getStringValue());
        mailMessage.setMailBody(mailBodyElem.getStringValue());

        ret = mailMessage;
        return ret;
    }

    public Element getMailMessageItemElement(Message mailMessage) {
        Element ret = null;
        if (mailMessage == null) {
            Log.error("MailCooperationAdapter#getGroupChatMessageItemElem::getMailMessageItemElement is null");
            return ret;
        }
        if (Message.TYPE_MAIL != mailMessage.getMsgType()) {
            Log.error("MailCooperationAdapter#getGroupChatMessageItemElem::message type is not Group Chat");
            return ret;
        }
        Set<String> jidSet = new HashSet<String>();
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(mailMessage.getId()));
        itemElem.add(idElem);

        Element itemIdElem = DocumentHelper.createElement("item_id");
        itemIdElem.setText(mailMessage.getItemId());
        itemElem.add(itemIdElem);

        Element messageTypeElem = DocumentHelper.createElement("msgtype");
        messageTypeElem.setText(String.valueOf(mailMessage.getMsgType()));
        itemElem.add(messageTypeElem);

        Element messageFromElem = DocumentHelper.createElement("msgfrom");
        messageFromElem.setText(mailMessage.getMsgFrom());
        itemElem.add(messageFromElem);

        Element messageToElem = DocumentHelper.createElement("msgto");
        String toJid = mailMessage.getMsgTo();
        messageToElem.setText(toJid);
        itemElem.add(messageToElem);
        jidSet.add(toJid);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entryElem;
        String entryStr = mailMessage.getEntry();
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
        if (mailMessage.getDeleteFlag() == 2) {
            String deletedBy = mailMessage.getDeletedBy();
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

        Element priorityElem = DocumentHelper.createElement("priority");
        priorityElem.setText(String.valueOf(mailMessage.getPriority()));
        itemElem.add(priorityElem);

        Element mailMessageIdElem = DocumentHelper
                .createElement("mail_message_id");
        mailMessageIdElem
                .setText(String.valueOf(mailMessage.getMailMessageId()));
        itemElem.add(mailMessageIdElem);

        Element mailInReplyToElem = DocumentHelper
                .createElement("mail_in_reply_to");
        mailInReplyToElem
                .setText(String.valueOf(mailMessage.getMailInReplyTo()));
        itemElem.add(mailInReplyToElem);

        Element replyIdElem = DocumentHelper.createElement("reply_id");
        String replyIdStr = mailMessage.getReplyId();
        replyIdElem.setText((replyIdStr == null) ? "" : replyIdStr);
        itemElem.add(replyIdElem);

        Element createdAtElem = DocumentHelper.createElement("created_at");
        createdAtElem.setText(mailMessage.getCreatedAtStr());
        itemElem.add(createdAtElem);

        List<GoodJob> goodJobList = mailMessage.getGoodJobList();
        Element goodJobElem = GoodJobAdapter.getInstance().getGoodJobElement(
                goodJobList);
        itemElem.add(goodJobElem);

        Element contextElem = DocumentHelper.createElement("context");
        itemElem.add(contextElem);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(mailMessage.getDeleteFlag()));
        itemElem.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            itemElem.add(personInfoElement);
        }

        ret = itemElem;
        return ret;
    }

    public boolean checkMessageAuthor(Message message, String fromJid) {
        boolean ret = false;
        String msgTo = message.getMsgTo();
        if (msgTo.equals(fromJid)) {
            ret = true;
        }
        return ret;
    }

    public IQ getMailCooperationSettings(IQ iq) {
        Log.debug("do func MailCooperationAdapter.getMailCooperationSettings(");
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#getMailCooperationSettings::iq is null");
            return ret;
        }
        boolean isMailCooperationSettingsRequest = isGetMailCooperationSettingsXMPPRequest(iq);
        if (isMailCooperationSettingsRequest == false) {
            Log.error("MailCooperationAdapter#getMailCooperationSettings::XMPP is invalid");
            return ret;
        }
        ret = createGetMailCooperationSettingsResponsePacket(iq);
        return ret;
    }

    private boolean isGetMailCooperationSettingsXMPPRequest(IQ iq) {
        boolean ret = false;
        if (iq == null) {
            Log.error("MailCooperationAdapter#isGetMailCooperationSettingsXMPPRequest::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MailCooperationAdapter#isGetMailCooperationSettingsXMPPRequest::iq type is not get");
            return ret;
        }
        Element mailElem = iq.getChildElement();
        if (mailElem == null) {
            Log.error("MailCooperationAdapter#isGetMailCooperationSettingsXMPPRequest::mailElem is null");
            return ret;
        }
        String tagName = mailElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("mail"))) {
            Log.error("MailCooperationAdapter#isGetMailCooperationSettingsXMPPRequest::tagName is invalid");
            return ret;
        }
        String namespace = mailElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getsettings"))) {
            Log.error("MailCooperationAdapter#isGetMailCooperationSettingsXMPPRequest::namespace is invalid");
            return ret;
        }
        Element contentElem = mailElem.element("content");
        if (contentElem == null) {
            Log.error("MailCooperationAdapter#isGetMailCooperationSettingsXMPPRequest::contentElem is null");
            return ret;
        }
        ret = true;
        return ret;
    }

    private IQ createGetMailCooperationSettingsResponsePacket(IQ iq) {
        Log.debug("do func MailCooperationAdapter.createGetMailCooperationSettingsResponsePacket(");
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#createGetMailCooperationSettingsResponsePacket::iq is null");
            return ret;
        }
        Element mailElem = iq.getChildElement();
        if (mailElem == null) {
            Log.error("MailCooperationAdapter#createGetMailCooperationSettingsResponsePacket::mailElem is null");
            return ret;
        }
        String tagName = mailElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("mail"))) {
            Log.error("MailCooperationAdapter#createGetMailCooperationSettingsResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = mailElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getsettings"))) {
            Log.error("MailCooperationAdapter#createGetMailCooperationSettingsResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = mailElem.element("content");
        if (contentElem != null) {
            mailElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();
        ItemCondition jidCondition = new ItemCondition();
        jidCondition.setData(MailCooperationStoreDbHelper.COLUMN_JID_NAME,
                ItemCondition.ValueType.STRING, fromJidStr);
        ItemCondition delCondition = new ItemCondition();
        delCondition.setData(
                MailCooperationStoreDbHelper.COLUMN_DELETE_FLG_NAME,
                ItemCondition.ValueType.NUMBER,
                String.valueOf(MailCooperationInfo.DELETE_FLG_FALSE));
        AndCondition andCondition = new AndCondition();
        andCondition.addChildCondition(jidCondition);
        andCondition.addChildCondition(delCondition);
        List<MailCooperationInfo> mailCooperationInfoList = getMailCooperationInfoList(andCondition);
        if (mailCooperationInfoList == null) {
            Log.error("MailCooperationAdapter#createGetMailCooperationSettingsResponsePacket::mailCooperationInfoList is null");
            return ret;
        }
        int count = mailCooperationInfoList.size();
        if (count == 0) {
            boolean isInsert = insertMailCooperationInfoByJid(fromJidStr);
            if (!isInsert) {
                Log.error("MailCooperationAdapter#createGetMailCooperationSettingsResponsePacket::mailCooperationInfoList is null");
                return ret;
            }
            mailCooperationInfoList = getMailCooperationInfoList(andCondition);
            count = mailCooperationInfoList.size();
        }
        int index = 0;
        for (int i = 0; i < count; i++) {
            MailCooperationInfo mailCooperationInfo = mailCooperationInfoList
                    .get(i);
            if (mailCooperationInfo == null) {
                continue;
            }
            Element itemElem = getMailCooperationInfoItemElem(mailCooperationInfo);
            if (itemElem == null) {
                Log.error("MailCooperationAdapter#createGetMailCooperationSettingsResponsePacket::itemElem is null");
                return ret;
            }
            itemsElem.add(itemElem);
            index++;
        }
        itemsElem.addAttribute("count", String.valueOf(index));
        newContentElem.add(itemsElem);
        mailElem.add(newContentElem);
        mailElem.setParent(null);
        replyPacket.setChildElement(mailElem);
        ret = replyPacket;
        return ret;
    }

    private boolean insertMailCooperationInfoByJid(String fromJidStr) {
        if (fromJidStr == null || fromJidStr.equals("")) {
            Log.error("MailCooperationAdapter#insertMailCooperationInfoByJid::fromJidStr is null");
            return false;
        }
        ItemCondition jidCondition = new ItemCondition();
        jidCondition.setData(MailCooperationStoreDbHelper.COLUMN_JID_NAME,
                ItemCondition.ValueType.STRING, fromJidStr);
        List<MailCooperationInfo> mailCooperationInfoListByJid = getMailCooperationInfoList(jidCondition);
        int jidAllMailInfoCount = mailCooperationInfoListByJid.size();
        MailCooperationInfo mailCooperationInfo = new MailCooperationInfo();
        mailCooperationInfo.setJid(fromJidStr);
        mailCooperationInfo.setBranchNumber(jidAllMailInfoCount + 1);
        return MailCooperationStoreDbHelper
                .insertMailCooperationInfo(mailCooperationInfo);
    }

    private List<MailCooperationInfo> getMailCooperationInfoList(
            FilterCondition filterCondition) {
        Log.debug("do func MailCooperationAdapter.getMailCooperationInfoList(");
        return MailCooperationStoreDbHelper
                .getMailCooperationInfoList(filterCondition);
    }

    private Element getMailCooperationInfoItemElem(
            MailCooperationInfo mailCooperationInfo) {
        if (mailCooperationInfo == null) {
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(mailCooperationInfo.getId()));
        itemElem.add(idElem);

        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(mailCooperationInfo.getJid());
        itemElem.add(jidElem);

        Element serverIdElem = DocumentHelper.createElement("server_id");
        serverIdElem.setText(String.valueOf(mailCooperationInfo.getServerId()));
        itemElem.add(serverIdElem);

        Element branchNumberElem = DocumentHelper
                .createElement("branch_number");
        branchNumberElem.setText(String.valueOf(mailCooperationInfo
                .getBranchNumber()));
        itemElem.add(branchNumberElem);

        Element mailAddressElem = DocumentHelper.createElement("mail_address");
        mailAddressElem.setText(mailCooperationInfo.getMailAddress());
        itemElem.add(mailAddressElem);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element settingInfoElm;
        String settingInfoElmStr = mailCooperationInfo.getSettingInfo();
        if (settingInfoElmStr == null || settingInfoElmStr.equals("")) {
            settingInfoElm = DocumentHelper.createElement("setting_info");
        } else {
            try {
                Document doc = xmlReader.read(new StringReader(
                        settingInfoElmStr));
                settingInfoElm = doc.getRootElement();
            } catch (DocumentException e) {
                Log.error("settingInfoElm data is not XML");
                settingInfoElm = DocumentHelper.createElement("setting_info");
            }
        }
        itemElem.add(settingInfoElm);

        Element mailCooperationTypeElem = DocumentHelper
                .createElement("mail_cooperation_type");
        int updatedBy = mailCooperationInfo.getMailCooperationType();
        mailCooperationTypeElem.setText(String.valueOf(updatedBy));
        itemElem.add(mailCooperationTypeElem);

        return itemElem;
    }

    public IQ getAllUserMailSettings(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#getAllUserMailSettings::iq is null");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromUserName = fromJid.getNode();
        if (!UserAuthorityAdapter.getInstance().isAdmin(fromUserName)) {
            Log.error("MailCooperationAdapter#createGetAllUserMailSettingsResponsePacket::Not Admin User Request : "
                    + fromUserName);
            return ret;
        }
        boolean isMailCooperationSettingsRequest = isGetAllUserMailSettingsXMPPRequest(iq);
        if (isMailCooperationSettingsRequest == false) {
            Log.error("MailCooperationAdapter#getAllUserMailSettings::XMPP is invalid");
            return ret;
        }
        ret = createGetAllUserMailSettingsResponsePacket(iq);
        return ret;
    }

    private boolean isGetAllUserMailSettingsXMPPRequest(IQ iq) {
        boolean ret = false;
        if (iq == null) {
            Log.error("MailCooperationAdapter#isGetAllUserMailSettingsXMPPRequest::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MailCooperationAdapter#isGetAllUserMailSettingsXMPPRequest::iq type is not get");
            return ret;
        }
        Element mailElem = iq.getChildElement();
        if (mailElem == null) {
            Log.error("MailCooperationAdapter#isGetAllUserMailSettingsXMPPRequest::mailElem is null");
            return ret;
        }
        String tagName = mailElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("mail"))) {
            Log.error("MailCooperationAdapter#isGetAllUserMailSettingsXMPPRequest::tagName is invalid");
            return ret;
        }
        String namespace = mailElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getallusersettings"))) {
            Log.error("MailCooperationAdapter#isGetAllUserMailSettingsXMPPRequest::namespace is invalid");
            return ret;
        }
        Element contentElem = mailElem.element("content");
        if (contentElem == null) {
            Log.error("MailCooperationAdapter#isGetAllUserMailSettingsXMPPRequest::contentElem is null");
            return ret;
        }
        ret = true;
        return ret;
    }

    private IQ createGetAllUserMailSettingsResponsePacket(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#createGetAllUserMailSettingsResponsePacket::iq is null");
            return ret;
        }
        Element mailElem = iq.getChildElement();
        if (mailElem == null) {
            Log.error("MailCooperationAdapter#createGetAllUserMailSettingsResponsePacket::mailElem is null");
            return ret;
        }
        String tagName = mailElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("mail"))) {
            Log.error("MailCooperationAdapter#createGetAllUserMailSettingsResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = mailElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getallusersettings"))) {
            Log.error("MailCooperationAdapter#createGetAllUserMailSettingsResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = mailElem.element("content");
        if (contentElem != null) {
            mailElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        ItemCondition delCondition = new ItemCondition();
        delCondition.setData(
                MailCooperationStoreDbHelper.COLUMN_DELETE_FLG_NAME,
                ItemCondition.ValueType.NUMBER,
                String.valueOf(MailCooperationInfo.DELETE_FLG_FALSE));
        AndCondition andCondition = new AndCondition();
        andCondition.addChildCondition(delCondition);
        List<MailCooperationInfo> mailCooperationInfoList = getMailCooperationInfoList(andCondition);
        if (mailCooperationInfoList == null) {
            Log.error("MailCooperationAdapter#createGetAllUserMailSettingsResponsePacket::mailCooperationInfoList is null");
            return ret;
        }
        int count = mailCooperationInfoList.size();
        int index = 0;
        for (int i = 0; i < count; i++) {
            MailCooperationInfo mailCooperationInfo = mailCooperationInfoList
                    .get(i);
            if (mailCooperationInfo == null) {
                continue;
            }
            Element itemElem = getMailCooperationInfoItemElem(mailCooperationInfo);
            if (itemElem == null) {
                Log.error("MailCooperationAdapter#createGetMailCooperationSettingsResponsePacket::itemElem is null");
                return ret;
            }
            itemsElem.add(itemElem);
            index++;
        }
        itemsElem.addAttribute("count", String.valueOf(index));
        newContentElem.add(itemsElem);
        mailElem.add(newContentElem);
        mailElem.setParent(null);
        replyPacket.setChildElement(mailElem);
        ret = replyPacket;
        return ret;
    }

    public IQ getMailBody(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#getMailBody::iq is null");
            return ret;
        }
        String itemId = getRequestItemIdFromGetMailBodyXMPPRequest(iq);
        if (itemId == null || itemId.equals("")) {
            Log.error("MailCooperationAdapter#getMailBody::itemId is invalid");
            return ret;
        }
        Message mailMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        if (mailMessage == null) {
            Log.error("MailCooperationAdapter#getMailBody::mailMessage is null");
            return ret;
        }
        if (!mailMessage.getMsgTo().equals(iq.getFrom().toBareJID())) {
            Log.error("MailCooperationAdapter#getMailBody::from is invalid");
            return ret;
        }

        ret = createGetMailBodyResponsePacket(iq, itemId);
        return ret;
    }

    private String getRequestItemIdFromGetMailBodyXMPPRequest(IQ iq) {
        String ret = "";
        if (iq == null) {
            Log.error("MailCooperationAdapter#getRequestItemIdFromGetMailBodyXMPPRequest::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("MailCooperationAdapter#getRequestItemIdFromGetMailBodyXMPPRequest::iq type is not get");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MailCooperationAdapter#getRequestItemIdFromGetMailBodyXMPPRequest::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MailCooperationAdapter#getRequestItemIdFromGetMailBodyXMPPRequest::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getmailbody"))) {
            Log.error("MailCooperationAdapter#getRequestItemIdFromGetMailBodyXMPPRequest::namespace is invalid");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("MailCooperationAdapter#getRequestItemIdFromGetMailBodyXMPPRequest::contentElem is null");
            return ret;
        }
        Element itemIdElem = contentElem.element("item_id");
        if (itemIdElem == null) {
            Log.error("MailCooperationAdapter#getRequestItemIdFromGetMailBodyXMPPRequest::itemIdElem is null");
            return ret;
        }
        String itemId = itemIdElem.getStringValue();
        ret = itemId;
        return ret;
    }

    private IQ createGetMailBodyResponsePacket(IQ iq, String itemId) {
        IQ ret = null;
        if (iq == null) {
            Log.error("MailCooperationAdapter#createGetMailBodyResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("MailCooperationAdapter#createGetMailBodyResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("MailCooperationAdapter#createGetMailBodyResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getmailbody"))) {
            Log.error("MailCooperationAdapter#createGetMailBodyResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        MailBody mailBody = MailBodyStoreDbHelper.getMailBody(itemId, iq
                .getFrom().toBareJID());
        if (mailBody == null) {
            Log.error("MailCooperationAdapter#createGetMailBodyResponsePacket::mailBody is null");
            return ret;
        }
        itemsElem.addAttribute("count", String.valueOf(1));
        Element itemElem = getMailBodyItemElem(mailBody);
        if (itemElem == null) {
            Log.error("MailCooperationAdapter#createGetMailBodyResponsePacket::itemElem is null");
            return ret;
        }
        itemsElem.add(itemElem);
        newContentElem.add(itemsElem);
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        ret = replyPacket;
        return ret;
    }

    private Element getMailBodyItemElem(MailBody mailBody) {
        if (mailBody == null) {
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(mailBody.getId()));
        itemElem.add(idElem);

        Element itemIdElem = DocumentHelper.createElement("item_id");
        itemIdElem.setText(mailBody.getItemId());
        itemElem.add(itemIdElem);

        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(mailBody.getJid());
        itemElem.add(jidElem);

        Element mailBodyElem = DocumentHelper.createElement("mail_body");
        mailBodyElem.setText(mailBody.getMailBody());
        itemElem.add(mailBodyElem);
        return itemElem;
    }

}
