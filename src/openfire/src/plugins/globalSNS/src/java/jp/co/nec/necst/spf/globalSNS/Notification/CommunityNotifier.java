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
import java.util.HashSet;
import java.util.List;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;
import org.xmpp.packet.Message;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.NotificationManager;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityMember;
import jp.co.nec.necst.spf.globalSNS.Data.NotificationDbData;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeControler;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content.messageNotice.entry;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientNotifier;
import net.arnx.jsonic.JSON;
import net.arnx.jsonic.JSONException;

public class CommunityNotifier extends
        AbstractIndividualNotifier<NotificationDataCommunity> {
    private static final Logger Log = LoggerFactory
            .getLogger(CommunityNotifier.class);
    private static CommunityNotifier mInstance = null;

    private static final String UPDATE_COMMUNITY_INFO_NAMESPACE = "http://necst.nec.co.jp/protocol/updatecommunityinfo";
    private static final String ADD_MEMBER_NEMESPASE = "http://necst.nec.co.jp/protocol/addcommunitymember";
    private static final String UPDATE_COMMUNITY_OWNER_NAMESPACE = "http://necst.nec.co.jp/protocol/updatecommunityowner";
    private static final String REMOVE_MEMBER_NAMESPASE = "http://necst.nec.co.jp/protocol/removecommunitymember";
    private static final String UPDATE_MESSAGE_BODY_NAMESPACE = "http://necst.nec.co.jp/protocol/updatemessagebody";

    public static CommunityNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new CommunityNotifier();
        }
        return mInstance;
    }

    private CommunityNotifier() {
    }

    @Override
    protected void threadProcessOneData(
            NotificationDataCommunity notificationData) {
        if (notificationData == null) {
            Log.error("CommunityNotifier#threadProcessOneData::notificationData is null");
            return;
        }
        switch (notificationData.mType) {
            case SendMessage:
                notifySendCommunityMessage((NotificationDataCommunitySendMessage) notificationData);
                break;
            case UpdateMessageBody:
                notifyUpdateCommunityMessageBody((NotificationDataCommunityUpdateMessage) notificationData);
                break;
            case NotifyAddQuestionnaire:
                notifySendCommunityMessageForQuestionnaire((NotificationDataCommunitySendMessageForQuestionnaire) notificationData);
                break;
            case NotifyUpdateCommunity:
                notifyUpdateCommunityInfoNotification((NotificationDataCommunityUpdate) notificationData);
                break;
            case NotifyAddMember:
                notifyAddCommunityMemberNotification((NotificationDataCommunityAddMember) notificationData);
                break;
            case NotifyUpdateCommunityOwner:
                notifyUpdateCommunityOwnerNotification((NotificationDataCommunityUpdateOwner) notificationData);
                break;
            case NotifyRemoveMember:
                notifyRemoveCommunityMemberNotification((NotificationDataCommunityRemoveMember) notificationData);
                break;
            default:
                break;
        }
    }

    public void sendUpdateCommunityInfoNotification(
            CommunityInfo updatedCommunityInfo, CommunityInfo preCommunityInfo) {
        if (updatedCommunityInfo == null) {
            Log.error("CommunityNotifier#sendUpdateCommunityInfoNotification::updatedCommunityInfo is null");
            return;
        }
        if (preCommunityInfo == null) {
            Log.error("CommunityNotifier#sendUpdateCommunityInfoNotification::preCommunityInfo is null");
            return;
        }
        NotificationDataCommunityUpdate notificationData = new NotificationDataCommunityUpdate(
                updatedCommunityInfo, preCommunityInfo);
        addQueue(notificationData);
    }

    private void notifyUpdateCommunityInfoNotification(
            NotificationDataCommunityUpdate notificationData) {
        if (notificationData == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityInfoNotification::notificationData is null");
            return;
        }
        CommunityInfo updatedCommunityInfo = notificationData.mUpdatedCommunityInfo;
        if (updatedCommunityInfo == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityInfoNotification::updatedCommunityInfo is null");
            return;
        }
        CommunityInfo preCommunityInfo = notificationData.mPreCommunityInfo;
        if (preCommunityInfo == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityInfoNotification::preCommunityInfo is null");
            return;
        }
        List<CommunityMember> memberList = updatedCommunityInfo.getMemberList();
        if (memberList == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityInfoNotification::memberList is null");
            return;
        }
        Element contentElem = createUpdateCommunityContentElem(
                updatedCommunityInfo, preCommunityInfo);
        if (contentElem == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityInfoNotification::contentElem is null");
            return;
        }
        Element copyContentElem;
        for (CommunityMember member : memberList) {
            copyContentElem = contentElem.createCopy();
            String memberJid = member.getJid();
            sendCommunityNotificationToOneMember(copyContentElem, memberJid,
                    UPDATE_COMMUNITY_INFO_NAMESPACE,
                    NotificationDbData.NOTIFICATION_TYPE_CHANGE_COMMUNITY_INFO);
        }
    }

    private Element createUpdateCommunityContentElem(
            CommunityInfo updatedCommunityInfo, CommunityInfo preCommunityInfo) {
        return CommunityAdapter.getInstance().createUpdateCommunityContentElem(
                updatedCommunityInfo, preCommunityInfo);
    }

    public void sendAddCommunityMemberNotification(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> addedMemberList) {
        if (requestJid == null) {
            Log.error("CommunityNotifier#sendAddCommunityMemberNotification::requestJid is null");
            return;
        }
        if (communityInfo == null) {
            Log.error("CommunityNotifier#sendAddCommunityMemberNotification::communityInfo is null");
            return;
        }
        if (addedMemberList == null || addedMemberList.size() <= 0) {
            Log.error("CommunityNotifier#sendAddCommunityMemberNotification::addedMemberList is null or size 0");
            return;
        }
        NotificationDataCommunityAddMember notificationData = new NotificationDataCommunityAddMember(
                requestJid, communityInfo, addedMemberList);
        addQueue(notificationData);
    }

    private void notifyAddCommunityMemberNotification(
            NotificationDataCommunityAddMember notificationData) {
        if (notificationData == null) {
            Log.error("CommunityNotifier#notifyAddCommunityMemberNotification::notificationData is null");
            return;
        }
        String requestJid = notificationData.mRequestJid;
        if (requestJid == null) {
            Log.error("CommunityNotifier#notifyAddCommunityMemberNotification::requestJid is null");
            return;
        }
        CommunityInfo communityInfo = notificationData.mCommunityInfo;
        if (communityInfo == null) {
            Log.error("CommunityNotifier#notifyAddCommunityMemberNotification::communityInfo is null");
            return;
        }
        List<CommunityMember> addedMemberList = notificationData.mAddedMemberList;
        if (addedMemberList == null || addedMemberList.size() <= 0) {
            Log.error("CommunityNotifier#notifyAddCommunityMemberNotification::addedMemberList is null or size 0");
            return;
        }
        List<CommunityMember> memberList = communityInfo.getMemberList();
        if (memberList == null) {
            Log.error("CommunityNotifier#notifyAddCommunityMemberNotification::memberList is null");
            return;
        }
        ConcurrentHashMap<String, CommunityMember> sendToHash = new ConcurrentHashMap<String, CommunityMember>();
        for (CommunityMember member : memberList) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            sendToHash.put(memberJid, member);
        }
        for (CommunityMember member : addedMemberList) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            sendToHash.put(memberJid, member);
        }
        Element contentElem = createAddCommunityMemberContentElem(requestJid,
                communityInfo, addedMemberList);
        if (contentElem == null) {
            Log.error("CommunityNotifier#notifyAddCommunityMemberNotification::contentElem is null");
            return;
        }
        Element copyContentElem;
        for (Entry<String, CommunityMember> memberEntry : sendToHash.entrySet()) {
            copyContentElem = contentElem.createCopy();
            String sendToJid = memberEntry.getKey();
            sendCommunityNotificationToOneMember(copyContentElem, sendToJid,
                    ADD_MEMBER_NEMESPASE,
                    NotificationDbData.NOTIFICATION_TYPE_ADD_COMMUNITY_MEMBER);
        }
    }

    private Element createAddCommunityMemberContentElem(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> addedMemberList) {
        return CommunityAdapter.getInstance()
                .createAddCommunityMemberContentElem(requestJid, communityInfo,
                        addedMemberList);
    }

    public void sendUpdateCommunityOwnerNotification(
            CommunityInfo newCommunityInfo, CommunityInfo preCommunityInfo,
            List<CommunityMember> communityOwnerList) {
        if (newCommunityInfo == null) {
            Log.error("CommunityNotifier#sendUpdateCommunityOwnerNotification::newCommunityInfo is null");
            return;
        }
        if (preCommunityInfo == null) {
            Log.error("CommunityNotifier#sendUpdateCommunityOwnerNotification::preCommunityInfo is null");
            return;
        }
        if (communityOwnerList == null || communityOwnerList.size() <= 0) {
            Log.error("CommunityNotifier#sendUpdateCommunityOwnerNotification::communityOwnerList is null or size 0");
            return;
        }
        NotificationDataCommunityUpdateOwner notificationData = new NotificationDataCommunityUpdateOwner(
                newCommunityInfo, preCommunityInfo, communityOwnerList);
        addQueue(notificationData);
    }

    private void notifyUpdateCommunityOwnerNotification(
            NotificationDataCommunityUpdateOwner notificationData) {
        if (notificationData == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityOwnerNotification::notificationData is null");
            return;
        }
        CommunityInfo newCommunityInfo = notificationData.mNewCommunityInfo;
        if (newCommunityInfo == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityOwnerNotification::newCommunityInfo is null");
            return;
        }
        CommunityInfo preCommunityInfo = notificationData.mPreCommunityInfo;
        if (preCommunityInfo == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityOwnerNotification::preCommunityInfo is null");
            return;
        }
        List<CommunityMember> communityOwnerList = notificationData.mCommunityOwnerList;
        if (communityOwnerList == null || communityOwnerList.size() <= 0) {
            Log.error("CommunityNotifier#notifyUpdateCommunityOwnerNotification::communityOwnerList is null or size 0");
            return;
        }
        List<CommunityMember> memberList = newCommunityInfo.getMemberList();
        if (memberList == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityOwnerNotification::memberList is null");
            return;
        }
        Element contentElem = createUpdateCommunityOwnerContentElem(
                newCommunityInfo, preCommunityInfo, communityOwnerList);
        if (contentElem == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityOwnerNotification::contentElem is null");
            return;
        }
        Element copyContentElem;
        for (CommunityMember member : memberList) {
            copyContentElem = contentElem.createCopy();
            String sendToJid = member.getJid();
            sendCommunityNotificationToOneMember(copyContentElem, sendToJid,
                    UPDATE_COMMUNITY_OWNER_NAMESPACE,
                    NotificationDbData.NOTIFICATION_TYPE_UPDATE_COMMUNITY_OWNER);
        }
    }

    private Element createUpdateCommunityOwnerContentElem(
            CommunityInfo newCommunityInfo, CommunityInfo preCommunityInfo,
            List<CommunityMember> communityOwnerList) {
        return CommunityAdapter.getInstance()
                .createUpdateCommunityOwnerContentElem(newCommunityInfo,
                        preCommunityInfo, communityOwnerList);
    }

    public void sendRemoveCommunityMemberNotification(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> removedMemberList) {
        if (requestJid == null) {
            Log.error("CommunityNotifier#sendRemoveCommunityMemberNotification::requestJid is null");
            return;
        }
        if (communityInfo == null) {
            Log.error("CommunityNotifier#sendRemoveCommunityMemberNotification::communityInfo is null");
            return;
        }
        if (removedMemberList == null || removedMemberList.size() <= 0) {
            Log.error("CommunityNotifier#sendRemoveCommunityMemberNotification::removedMemberList is null or size 0");
            return;
        }
        NotificationDataCommunityRemoveMember notificationData = new NotificationDataCommunityRemoveMember(
                requestJid, communityInfo, removedMemberList);
        addQueue(notificationData);
    }

    private void notifyRemoveCommunityMemberNotification(
            NotificationDataCommunityRemoveMember notificationData) {
        if (notificationData == null) {
            Log.error("CommunityNotifier#notifyRemoveCommunityMemberNotification::notificationData is null");
            return;
        }
        String requestJid = notificationData.mRequestJid;
        if (requestJid == null) {
            Log.error("CommunityNotifier#notifyRemoveCommunityMemberNotification::requestJid is null");
            return;
        }
        CommunityInfo communityInfo = notificationData.mCommunityInfo;
        if (communityInfo == null) {
            Log.error("CommunityNotifier#notifyRemoveCommunityMemberNotification::communityInfo is null");
            return;
        }
        List<CommunityMember> removedMemberList = notificationData.mRemovedMemberList;
        if (removedMemberList == null || removedMemberList.size() <= 0) {
            Log.error("CommunityNotifier#notifyRemoveCommunityMemberNotification::removedMemberList is null or size 0");
            return;
        }
        List<CommunityMember> memberList = communityInfo.getMemberList();
        if (memberList == null) {
            Log.error("CommunityNotifier#notifyRemoveCommunityMemberNotification::memberList is null");
            return;
        }
        ConcurrentHashMap<String, CommunityMember> sendToHash = new ConcurrentHashMap<String, CommunityMember>();
        for (CommunityMember member : memberList) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            sendToHash.put(memberJid, member);
        }
        for (CommunityMember member : removedMemberList) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            sendToHash.put(memberJid, member);
        }
        Element contentElem = createRemoveCommunityMemberContentElem(
                requestJid, communityInfo, removedMemberList);
        if (contentElem == null) {
            Log.error("CommunityNotifier#notifyRemoveCommunityMemberNotification::contentElem is null");
            return;
        }
        Element copyContentElem;
        for (Entry<String, CommunityMember> memberEntry : sendToHash.entrySet()) {
            copyContentElem = contentElem.createCopy();
            String sendToJid = memberEntry.getKey();
            sendCommunityNotificationToOneMember(
                    copyContentElem,
                    sendToJid,
                    REMOVE_MEMBER_NAMESPASE,
                    NotificationDbData.NOTIFICATION_TYPE_REMOVE_COMMUNITY_MEMBER);
        }
    }

    private Element createRemoveCommunityMemberContentElem(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> removedMemberList) {
        return CommunityAdapter.getInstance()
                .createRemoveCommunityMemberContentElem(requestJid,
                        communityInfo, removedMemberList);
    }

    private void sendCommunityNotificationToOneMember(Element contentElem,
            String sendTo, String namespace, int notificationTypeToDbData) {
        if (contentElem == null) {
            Log.error("CommunityNotifier#sendCommunityNotificationToOneMember::contentElem is null");
            return;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("CommunityNotifier#sendCommunityNotificationToOneMember::sendTo is invalid");
            return;
        }
        if (namespace == null || namespace.equals("")) {
            Log.error("CommunityNotifier#sendCommunityNotificationToOneMember::namespace is invalid");
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
                Log.error("CommunityNotifier#sendCommunityNotificationToOneMember::notificationDbData is null");
                return;
            }
            NotificationManager.getInstatnce().saveNotificateData(
                    notificationDbData);
            return;
        }
        Message message = new Message();
        message.setFrom(from);
        message.setTo(sendTo);
        message.setID("updateCommunity" + StringUtils.randomString(5) + "__"
                + sendTo + "__" + StringUtils.randomString(5));
        Element notifyElem = message.addChildElement("notify", namespace);
        notifyElem.add(contentElem);
        XMPPServer.getInstance().getMessageRouter().route(message);
    }

    private NotificationDbData createNotificationDbData(String sendTo,
            int notificationTypeToDbData, Element contentElem) {
        NotificationDbData ret = null;
        if (contentElem == null) {
            Log.error("CommunityNotifier#createNotificationDbData::contentElem is null");
            return ret;
        }
        if (sendTo == null || sendTo.equals("")) {
            Log.error("CommunityNotifier#createNotificationDbData::sendTo is invalid");
            return ret;
        }
        if (notificationTypeToDbData <= 0) {
            Log.info("CommunityNotifier#createNotificationDbData::notificationTypeToDbData is less than or equal to zero");
            return ret;
        }
        NotificationDbData notificationDbData = new NotificationDbData();
        notificationDbData.setNotificationType(notificationTypeToDbData);
        notificationDbData.setDataType(NotificationDbData.DATA_TYPE_DATA_ONLY);
        CommunityNotifyData notifyData = new CommunityNotifyData();
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

    private class CommunityNotifyData {
        public int innerVersion = 0;
        public String contentElementXml = "";
    }

    public void sendNotification(NotificationDbData notificationDbData) {
        if (notificationDbData == null) {
            Log.error("CommunityNotifier#sendNotification :: notificationDbData is null");
            return;
        }
        int notifyType = notificationDbData.getNotificationType();
        int dataType = notificationDbData.getDataType();
        String notificationData = notificationDbData.getNotificationData();

        switch (notifyType) {
            case NotificationDbData.NOTIFICATION_TYPE_CHANGE_COMMUNITY_INFO:
            case NotificationDbData.NOTIFICATION_TYPE_ADD_COMMUNITY_MEMBER:
            case NotificationDbData.NOTIFICATION_TYPE_UPDATE_COMMUNITY_OWNER:
            case NotificationDbData.NOTIFICATION_TYPE_REMOVE_COMMUNITY_MEMBER: {
                if (dataType != NotificationDbData.DATA_TYPE_DATA_ONLY) {
                    Log.error("CommunityNotifier#sendNotification :: dataType is not DATA_TYPE_DATA_ONLY");
                    return;
                }
                if (notificationData == null || notificationData.equals("")) {
                    Log.error("CommunityNotifier#sendNotification :: notificationData is invalid");
                    return;
                }
                String jidStr = notificationDbData.getJid();
                if (jidStr == null || jidStr.equals("")) {
                    Log.error("CommunityNotifier#sendNotification :: jidStr is invalid");
                    return;
                }
                CommunityNotifyData notifyData = null;
                try {
                    notifyData = JSON.decode(notificationData,
                            CommunityNotifyData.class);
                } catch (JSONException e) {
                    Log.error("CommunityNotifier#sendNotification :: failed to decode JSON. data="
                            + notificationData);
                    return;
                }
                SAXReader xmlReader = new SAXReader();
                xmlReader.setEncoding("UTF-8");
                if (notifyData.innerVersion < 1) {
                    Log.error("CommunityNotifier#sendNotification :: notifyData.innerVersion is invalid");
                    return;
                }
                if (notifyData.contentElementXml == null
                        || notifyData.contentElementXml.equals("")) {
                    Log.error("CommunityNotifier#sendNotification :: notifyData.contentElementXml is invalid");
                    return;
                }
                Element contentElem = null;
                try {
                    Document doc = xmlReader.read(new StringReader(
                            notifyData.contentElementXml));
                    contentElem = doc.getRootElement();
                } catch (DocumentException e) {
                    Log.error("CommunityNotifier#sendNotification :: contetnElem data is not XML");
                    return;
                }
                if (contentElem == null) {
                    Log.error("CommunityNotifier#sendNotification :: contentElem is null");
                    return;
                }
                String namespace = "";
                switch (notifyType) {
                    case NotificationDbData.NOTIFICATION_TYPE_CHANGE_COMMUNITY_INFO:
                        namespace = UPDATE_COMMUNITY_INFO_NAMESPACE;
                        break;
                    case NotificationDbData.NOTIFICATION_TYPE_ADD_COMMUNITY_MEMBER:
                        namespace = ADD_MEMBER_NEMESPASE;
                        break;
                    case NotificationDbData.NOTIFICATION_TYPE_UPDATE_COMMUNITY_OWNER:
                        namespace = UPDATE_COMMUNITY_OWNER_NAMESPACE;
                        break;
                    case NotificationDbData.NOTIFICATION_TYPE_REMOVE_COMMUNITY_MEMBER:
                        namespace = REMOVE_MEMBER_NAMESPASE;
                        break;
                    default:
                        Log.error("CommunityNotifier#sendNotification :: notifyType is unknown. type="
                                + String.valueOf(notifyType));
                        return;
                }
                sendCommunityNotificationToOneMember(contentElem, jidStr,
                        namespace, notifyType);
                break;
            }
            default:
                Log.error("CommunityNotifier#sendNotification :: notifyType is unknown. type="
                        + String.valueOf(notifyType));
                return;
        }
    }

    public void notifyCommunityMessage(
            jp.co.nec.necst.spf.globalSNS.Data.Message communityMessage,
            CommunityInfo communityInfo) {
        if (communityMessage == null) {
            Log.error("CommunityNotifier#notifyCommunityMessage::communityMessage is null");
            return;
        }
        if (communityInfo == null) {
            Log.error("CommunityNotifier#notifyCommunityMessage::communityInfo is null");
            return;
        }
        NotificationDataCommunitySendMessage notificationData = new NotificationDataCommunitySendMessage(
                communityMessage, communityInfo);
        addQueue(notificationData);
    }

    public void notifyCommunityMessageForQuestionnaire(
            jp.co.nec.necst.spf.globalSNS.Data.Message questionnaireMessage,
            CommunityInfo communityInfo) {
        if (questionnaireMessage == null) {
            Log.error("CommunityNotifier#notifyCommunityMessageForQuestionnaire::questionnaireMessage is null");
            return;
        }
        if (communityInfo == null) {
            Log.error("CommunityNotifier#notifyCommunityMessageForQuestionnaire::communityInfo is null");
            return;
        }
        NotificationDataCommunitySendMessageForQuestionnaire notificationData = new NotificationDataCommunitySendMessageForQuestionnaire(
                questionnaireMessage, communityInfo);
        addQueue(notificationData);
    }

    private void notifySendCommunityMessage(
            NotificationDataCommunitySendMessage notificationData) {
        if (notificationData == null) {
            Log.error("CommunityNotifier#notifySendCommunityMessage::notificationData is null");
            return;
        }

        jp.co.nec.necst.spf.globalSNS.Data.Message communityMessage = notificationData.mMessage;
        if (communityMessage == null) {
            Log.error("CommunityNotifier#notifySendCommunityMessage::communityMessage is null");
            return;
        }
        CommunityInfo communityInfo = notificationData.mCommunityInfo;
        if (communityInfo == null) {
            Log.error("CommunityNotifier#notifySendCommunityMessage::communityInfo is null");
            return;
        }
        List<CommunityMember> memberList = communityInfo.getMemberList();
        if (memberList == null) {
            Log.error("CommunityNotifier#notifySendCommunityMessage::memberList is null");
            return;
        }
        List<JID> reciverJidList = new ArrayList<JID>();
        for (CommunityMember member : memberList) {
            if (member == null) {
                Log.warn("CommunityNotifier#notifySendCommunityMessage::member is null");
                continue;
            }
            JID memberJid = new JID(member.getJid());
            reciverJidList.add(memberJid);
        }
        MessageNotifier.getInstance().notifyMessage(communityMessage,
                reciverJidList, true);
        notifySmartDevice(reciverJidList, communityMessage);
        for (JID jid : reciverJidList) {
            if (jid == null) {
                continue;
            }
            String jidStr = jid.toBareJID();
            WebSocketClientNotifier.getInstance().notifyMessage(jidStr,
                    communityMessage);
        }
    }

    public void notifyCommunityMessageBody(
            jp.co.nec.necst.spf.globalSNS.Data.Message communityMessage,
            CommunityInfo communityInfo) {
        if (communityMessage == null) {
            Log.error("CommunityNotifiernotifyCommunityMessageBody::communityMessage is null");
            return;
        }
        if (communityInfo == null) {
            Log.error("CommunityNotifier#notifyCommunityMessageBody::communityInfo is null");
            return;
        }
        NotificationDataCommunityUpdateMessage notificationData
            = new NotificationDataCommunityUpdateMessage
            (communityMessage, communityInfo);
        addQueue(notificationData);
    }

    public void notifyUpdateCommunityMessageBody(
            NotificationDataCommunityUpdateMessage notificationData)  {
        Log.debug("do func CommunityNotifier.notifyUpdateCommunityMessageBody(...");
        if (notificationData == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityMessageBody::notificationData is null");
            return;
        }

        jp.co.nec.necst.spf.globalSNS.Data.Message communityMessage = notificationData.mMessage;
        if (communityMessage == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityMessageBody::communityMessage is null");
            return;
        }
        CommunityInfo communityInfo = notificationData.mCommunityInfo;
        if (communityInfo == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityMessageBody::communityInfo is null");
            return;
        }
        List<CommunityMember> memberList = communityInfo.getMemberList();
        if (memberList == null) {
            Log.error("CommunityNotifier#notifyUpdateCommunityMessageBody::memberList is null");
            return;
        }
        List<JID> reciverJidList = new ArrayList<JID>();
        for (CommunityMember member : memberList) {
            if (member == null) {
                Log.warn("CommunityNotifier#notifyUpdateCommunityMessageBody::member is null");
                continue;
            }
            JID memberJid = new JID(member.getJid());
            reciverJidList.add(memberJid);
        }
        MessageNotifier.getInstance().notifyUpdateMessageBody
            (communityMessage, reciverJidList, true);
        for (JID jid : reciverJidList) {
            if (jid == null) {
                continue;
            }
            String jidStr = jid.toBareJID();
            WebSocketClientNotifier.getInstance().notifyUpdateMessageBody
                (jidStr,communityMessage);
        }
    }

    private void notifySendCommunityMessageForQuestionnaire(
            NotificationDataCommunitySendMessageForQuestionnaire notificationData) {
        if (notificationData == null) {
            Log.error("CommunityNotifier#notifySendCommunityMessageForQuestionnaire::notificationData is null");
            return;
        }

        jp.co.nec.necst.spf.globalSNS.Data.Message questionnaireMessage = notificationData.mMessage;
        if (questionnaireMessage == null) {
            Log.error("CommunityNotifier#notifySendCommunityMessageForQuestionnaire::questionnaireMessage is null");
            return;
        }
        CommunityInfo communityInfo = notificationData.mCommunityInfo;
        if (communityInfo == null) {
            Log.error("CommunityNotifier#notifySendCommunityMessageForQuestionnaire::communityInfo is null");
            return;
        }
        List<CommunityMember> memberList = communityInfo.getMemberList();
        if (memberList == null) {
            Log.error("CommunityNotifier#notifySendCommunityMessageForQuestionnaire::memberList is null");
            return;
        }
        List<JID> reciverJidList = new ArrayList<JID>();
        for (CommunityMember member : memberList) {
            if (member == null) {
                Log.warn("CommunityNotifier#notifySendCommunityMessageForQuestionnaire::member is null");
                continue;
            }
            JID memberJid = new JID(member.getJid());
            reciverJidList.add(memberJid);
        }
        MessageNotifier.getInstance().notifyMessage(questionnaireMessage,
                reciverJidList, true);
        for (JID jid : reciverJidList) {
            if (jid == null) {
                continue;
            }
            String jidStr = jid.toBareJID();
            WebSocketClientNotifier.getInstance().notifyMessage(jidStr,
                    questionnaireMessage);
        }
    }

    private void notifySmartDevice(List<JID> reciverJidList,
            jp.co.nec.necst.spf.globalSNS.Data.Message communityMessage) {
        if (communityMessage == null) {
            Log.error("CommunityNotifier#notifySmartDevice:: Message is null");
            return;
        }
        SmartDeviceNoticeInfo deviceNoticeInfo = new SmartDeviceNoticeInfo();
        SmartDeviceNoticeInfo.content content = deviceNoticeInfo.new content();

        content.setType(SmartDeviceNoticeInfo.content.TYPE_MESSAGE);

        SmartDeviceNoticeInfo.content.messageNotice messageNotice = content.new messageNotice();
        int messsageTypeCommunity = jp.co.nec.necst.spf.globalSNS.Data.Message.TYPE_COMMUNITY;
        messageNotice.setMessageType(messsageTypeCommunity);

        String fromJid = communityMessage.getMsgFrom();
        messageNotice.setFromJid(fromJid);

        String body = communityMessage.getMessageBodyInEntry();
        try {
            body = URLDecoder.decode(body, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            Log.error("CommunityNotifier#notifySmartDevice:: body decode error");
            return;
        }

        String roomId = communityMessage.getMsgTo();
        CommunityInfo communityInfo = CommunityStoreDbHelper
                .getCommunityInfoByRoomId(roomId);

        if(communityInfo.getNotifyType() >= CommunityInfo.NOTIFY_TYPE_ALL_OFF) {
            Log.debug("CommunityNotifier#notifySmartDevice:: Not notified roomId=" + roomId);
            return;
        }

        String roomName = communityInfo.getRoomName();
        SmartDeviceNoticeInfo.content.messageNotice.roomInfo roomInfo = messageNotice.new roomInfo();
        roomInfo.setRoomId(roomId);
        roomInfo.setRoomName(roomName);
        messageNotice.setRoomInfo(roomInfo);

        SmartDeviceNoticeInfo.content.messageNotice.entry entry = messageNotice.new entry();
        if (0 == communityMessage.getDeleteFlag()) {
            entry.setBody(communityMessage.getMessageBodyInEntry());
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
}

class NotificationDataCommunitySendMessage extends NotificationDataCommunity {
    public jp.co.nec.necst.spf.globalSNS.Data.Message mMessage = null;
    public CommunityInfo mCommunityInfo = null;

    NotificationDataCommunitySendMessage(
            jp.co.nec.necst.spf.globalSNS.Data.Message message,
            CommunityInfo communityInfo) {
        mType = Type.SendMessage;
        mMessage = message;
        mCommunityInfo = communityInfo;
    }
}

class NotificationDataCommunityUpdateMessage extends NotificationDataCommunity {
    public jp.co.nec.necst.spf.globalSNS.Data.Message mMessage = null;
    public CommunityInfo mCommunityInfo = null;

    NotificationDataCommunityUpdateMessage(
            jp.co.nec.necst.spf.globalSNS.Data.Message message,
            CommunityInfo communityInfo) {
        mType = Type.UpdateMessageBody;
        mMessage = message;
        mCommunityInfo = communityInfo;
    }
}


class NotificationDataCommunitySendMessageForQuestionnaire extends NotificationDataCommunity {
    public jp.co.nec.necst.spf.globalSNS.Data.Message mMessage = null;
    public CommunityInfo mCommunityInfo = null;

    NotificationDataCommunitySendMessageForQuestionnaire(
            jp.co.nec.necst.spf.globalSNS.Data.Message message,
            CommunityInfo communityInfo) {
        mType = Type.NotifyAddQuestionnaire;
        mMessage = message;
        mCommunityInfo = communityInfo;
    }
}

class NotificationDataCommunityUpdate extends NotificationDataCommunity {
    public CommunityInfo mUpdatedCommunityInfo = null;
    public CommunityInfo mPreCommunityInfo = null;

    NotificationDataCommunityUpdate(CommunityInfo updatedCommunityInfo,
            CommunityInfo preCommunityInfo) {
        mType = Type.NotifyUpdateCommunity;
        mUpdatedCommunityInfo = updatedCommunityInfo;
        mPreCommunityInfo = preCommunityInfo;
    }
}

class NotificationDataCommunityAddMember extends NotificationDataCommunity {
    public String mRequestJid = null;
    public CommunityInfo mCommunityInfo = null;
    public List<CommunityMember> mAddedMemberList = null;

    NotificationDataCommunityAddMember(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> addedMemberList) {
        mType = Type.NotifyAddMember;
        mRequestJid = requestJid;
        mCommunityInfo = communityInfo;
        mAddedMemberList = addedMemberList;
    }
}

class NotificationDataCommunityUpdateOwner extends NotificationDataCommunity {
    public CommunityInfo mNewCommunityInfo = null;
    public CommunityInfo mPreCommunityInfo = null;
    public List<CommunityMember> mCommunityOwnerList;

    NotificationDataCommunityUpdateOwner(CommunityInfo newCommunityInfo,
            CommunityInfo preCommunityInfo,
            List<CommunityMember> communityOwnerList) {
        mType = Type.NotifyUpdateCommunityOwner;
        mNewCommunityInfo = newCommunityInfo;
        mPreCommunityInfo = preCommunityInfo;
        mCommunityOwnerList = communityOwnerList;
    }
}

class NotificationDataCommunityRemoveMember extends NotificationDataCommunity {
    public String mRequestJid = null;
    public CommunityInfo mCommunityInfo = null;
    public List<CommunityMember> mRemovedMemberList = null;

    NotificationDataCommunityRemoveMember(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> removedMemberList) {
        mType = Type.NotifyRemoveMember;
        mRequestJid = requestJid;
        mCommunityInfo = communityInfo;
        mRemovedMemberList = removedMemberList;
    }
}

abstract class NotificationDataCommunity {
    enum Type {
        SendMessage, UpdateMessageBody, NotifyUpdateCommunity, NotifyAddMember, NotifyUpdateCommunityOwner, NotifyRemoveMember, NotifyAddQuestionnaire
    }

    public Type mType = null;
}
