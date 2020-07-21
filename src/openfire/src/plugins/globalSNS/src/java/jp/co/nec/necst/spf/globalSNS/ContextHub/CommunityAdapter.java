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

import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityMember;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.CommunitySortCondition;
import jp.co.nec.necst.spf.globalSNS.Group.CommunityManager;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.Notification.CommunityNotifier;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

public class CommunityAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(CommunityAdapter.class);
    private static CommunityAdapter mInstance = null;

    private static final String ADD_COMMUNITY_MEMBER_NAMESPACE = "http://necst.nec.co.jp/protocol/addcommunitymember";
    private static final String REMOVE_COMMUNITY_MEMBER_NAMESPACE = "http://necst.nec.co.jp/protocol/removecommunitymember";
    private static final String SEND_MESSAGE_NAMESPACE = "http://necst.nec.co.jp/protocol/send";
    private static final String UPDATE_MESSAGE_BODY_NAMESPACE = "http://necst.nec.co.jp/protocol/updatemessagebody";

    private CommunityAdapter() {
    }

    public static CommunityAdapter getInstance() {
        Log.debug("do func CommunityAdapter.getInstance(...");
        if (mInstance == null) {
            mInstance = new CommunityAdapter();
        }
        return mInstance;
    }

    public IQ createCommunity(IQ iq) {
        Log.debug("do func CommunityAdapter.createCommunity(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createCommunity::iq is null");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfoFromCreateCommunityXMPP(iq);
        if (communityInfo == null) {
            Log.error("CommunityAdapter#createCommunity::communityInfo is null");
            return ret;
        }
        CommunityInfo createdCommunityInfo = CommunityManager.getInstance()
                .createCommunity(communityInfo);
        if (createdCommunityInfo == null) {
            Log.error("CommunityAdapter#createCommunity::createdCommunityInfo is null");
            return ret;
        }
        ret = createCreateCommunityResponsePacket(iq, createdCommunityInfo);

        String requestJid = iq.getFrom().toBareJID();
        CommunityNotifier.getInstance().sendAddCommunityMemberNotification(
                requestJid, communityInfo, communityInfo.getMemberList());

        return ret;
    }
    private CommunityInfo getCommunityInfoFromCreateCommunityXMPP(IQ iq) {
        Log.debug("do func CommunityAdapter.getCommunityInfoFromCreateCommunityXMPP(...");
        CommunityInfo ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::iq is null");
            return ret;
        }
        JID fromJid = iq.getFrom();
        String fromJidStr = fromJid.toBareJID();
        if (iq.getType() != IQ.Type.set) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/createcommunity"))) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::contentElem is null");
            return ret;
        }
        Element roomNameElem = contentElem.element("roomname");
        if (roomNameElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::roomNameElem is null");
            return ret;
        }
        String roomName = roomNameElem.getStringValue();
        if (roomName == null || roomName.equals("")) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::roomName is invalid");
            return ret;
        }
        Element descriptionElem = contentElem.element("description");
        if (descriptionElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::descriptionElem is null");
            return ret;
        }
        String description = descriptionElem.getStringValue();
        if (description == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::description is invalid");
            return ret;
        }
        Element privacyTypeElem = contentElem.element("privacytype");
        if (privacyTypeElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::privacyTypeElem is null");
            return ret;
        }
        int privacyType = CommunityInfo.PRIVACY_TYPE_ITEM_SECRET;
        try {
            privacyType = Integer.parseInt(privacyTypeElem.getStringValue());
        } catch (NumberFormatException e) {
            e.printStackTrace();
            return ret;
        }
        if (privacyType < CommunityInfo.PRIVACY_TYPE_ITEM_OPEN
                || privacyType > CommunityInfo.PRIVACY_TYPE_ITEM_SECRET) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::privacyType is invalid");
            return ret;
        }
        Element memberEntryTypeElem = contentElem.element("memberentrytype");
        if (memberEntryTypeElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::memberEntryTypeElem is null");
            return ret;
        }
        int memberEntryType = 2791657;
        try {
            memberEntryType = Integer.parseInt(memberEntryTypeElem
                    .getStringValue());
        } catch (NumberFormatException e) {
            e.printStackTrace();
            return ret;
        }
        Element logoUrlElem = contentElem.element("logourl");
        if (logoUrlElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::logoUrlElem is null");
            return ret;
        }
        String logoUrl = logoUrlElem.getStringValue();
        if (logoUrl == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::logoUrl is invalid");
            return ret;
        }
        int notifyType = 0;
        Element notifyTypeElem = contentElem.element("notify_type");
        if (notifyTypeElem != null) {
            try {
                notifyType = Integer.parseInt(notifyTypeElem.getStringValue());
                if(!checkNotfiyType(notifyType)) {
                    Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::notifyType is out of range value:" + notifyType);
                    return ret;
                }
            } catch (NumberFormatException e) {
                Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::notifyType is invalid");
                e.printStackTrace();
                return ret;
            }
        }

        CommunityInfo communityInfo = new CommunityInfo();
        communityInfo.setRoomName(roomName);
        communityInfo.setDescription(description);
        communityInfo.setPrivacyType(privacyType);
        communityInfo.setMemberEntryType(memberEntryType);
        communityInfo.setLogoUrl(logoUrl);
        communityInfo.setNotifyType(notifyType);

        CommunityMember owner = new CommunityMember();
        owner.setJid(fromJidStr);
        owner.setState(CommunityMember.STATE_JOIN);
        owner.setRole(CommunityMember.ROLE_TYPE_OWNER);
        communityInfo.getMemberList().add(owner);
        communityInfo.setCreatedBy(fromJidStr);
        ret = communityInfo;
        return ret;
    }

    private IQ createCreateCommunityResponsePacket(IQ iq,
            CommunityInfo createdCommunityInfo) {
        Log.debug("do func CommunityAdapter.createCreateCommunityResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createCreateCommunityResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#createCreateCommunityResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#createCreateCommunityResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/createcommunity"))) {
            Log.error("CommunityAdapter#createCreateCommunityResponsePacket::namespace is invalid");
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
        Element itemElem = getCommunityInfoItemElem(createdCommunityInfo);
        if (itemElem == null) {
            Log.error("CommunityAdapter#createCreateCommunityResponsePacket::itemElem is null");
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

    private Element getCommunityInfoItemElem(CommunityInfo communityInfo) {
        Log.debug("do func CommunityAdapter.getCommunityInfoItemElem(...");
        if (communityInfo == null) {
            Log.error("CommunityAdapter#getCommunityInfoItemElem::communityInfo is null");
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(communityInfo.getId()));
        itemElem.add(idElem);

        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(communityInfo.getRoomId());
        itemElem.add(roomIdElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        roomNameElem.setText(communityInfo.getRoomName());
        itemElem.add(roomNameElem);

        Element descriptionElem = DocumentHelper.createElement("description");
        descriptionElem.setText(communityInfo.getDescription());
        itemElem.add(descriptionElem);

        Element membersElem = DocumentHelper.createElement("members");
        List<CommunityMember> memberList = communityInfo.getMemberList();
        membersElem.addAttribute("count", String.valueOf(memberList.size()));
        itemElem.add(membersElem);

        Element privacyTypeElem = DocumentHelper.createElement("privacytype");
        privacyTypeElem.setText(String.valueOf(communityInfo.getPrivacyType()));
        itemElem.add(privacyTypeElem);

        Element memberEntryTypeElem = DocumentHelper
                .createElement("memberentrytype");
        memberEntryTypeElem.setText(String.valueOf(communityInfo
                .getMemberEntryType()));
        itemElem.add(memberEntryTypeElem);

        Element logoUrlElem = DocumentHelper.createElement("logourl");
        logoUrlElem.setText(communityInfo.getLogoUrl());
        itemElem.add(logoUrlElem);

        Element notifyTypeElem = DocumentHelper.createElement("notify_type");
        int notifyType = communityInfo.getNotifyType();
        notifyTypeElem.setText(String.valueOf(notifyType));
        itemElem.add(notifyTypeElem);

        Element createdAtElem = DocumentHelper.createElement("created_at");
        createdAtElem.setText(communityInfo.getCreatedAtStr());
        itemElem.add(createdAtElem);

        Element createdByElem = DocumentHelper.createElement("created_by");
        createdByElem.setText(communityInfo.getCreatedBy());
        itemElem.add(createdByElem);

        Element updatedAtElem = DocumentHelper.createElement("updated_at");
        updatedAtElem.setText(communityInfo.getUpdatedAtStr());
        itemElem.add(updatedAtElem);

        Element updatedByElem = DocumentHelper.createElement("updated_by");
        String updatedBy = communityInfo.getUpdatedBy();
        updatedByElem.setText((updatedBy == null) ? "" : updatedBy);
        itemElem.add(updatedByElem);

        return itemElem;
    }

    @Deprecated
    public IQ getMyCommunityList(IQ iq) {
        return getCommunityList(iq);
    }

    public IQ getCommunityList(IQ iq) {
        Log.debug("do func CommunityAdapter.getCommunityList(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getMyCommunityList::iq is null");
            return ret;
        }
        CommunityListRequest communityListRequest = getCommunityListRequestRequestFromGetMyCommunityListXMPP(iq);
        if (communityListRequest == null) {
            Log.error("CommunityAdapter#getMyCommunityList::communityListRequest is null");
            return ret;
        }
        JID fromJid = iq.getFrom();

        List<CommunityInfo> myCommunityInfoList = CommunityManager
            .getInstance().getCommunityList(fromJid,
                                            communityListRequest.getStartId(),
                                            communityListRequest.getCount(),
                                            communityListRequest.getSortCondition(),
                                            communityListRequest.getSelectPrivacyType(),
                                            communityListRequest.getSelectListType()
                                            );
        if (myCommunityInfoList == null) {
            Log.error("CommunityAdapter#getMyCommunityList::myCommunityInfoList is null");
            return ret;
        }
        ret = createGetMyCommunityListResponsePacket(iq, myCommunityInfoList);
        return ret;
    }

    private CommunityListRequest getCommunityListRequestRequestFromGetMyCommunityListXMPP(
            IQ iq) {
        Log.debug("do func CommunityAdapter.getCommunityListRequestRequestFromGetMyCommunityListXMPP(...");
        CommunityListRequest ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::iq type is not get");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getmycommunitylist"))) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::contentElem is null");
            return ret;
        }
        Element privacyTypeElem = contentElem.element("privacytype");
        int privacyType = -1;
        if (privacyTypeElem != null) {
            String privacyTypeStr = privacyTypeElem.getStringValue();
            if (privacyTypeStr == null) {
                Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::privacyType is invalid");
                return ret;
            }else{
                try {
                    privacyType = Integer.parseInt(privacyTypeStr);
                } catch (NumberFormatException e) {
                    Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::privacyTypeStr is invalid");
                    return ret;
                }
            }
        }

        Element listTypeElem = contentElem.element("listtype");
        int listType = -1;
        if (listTypeElem != null) {
            String listTypeStr = listTypeElem.getStringValue();
            if (listTypeStr == null) {
                Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::listType is invalid");
                return ret;
            }else{
                try {
                    listType = Integer.parseInt(listTypeStr);
                } catch (NumberFormatException e) {
                    Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::listTypeStr is invalid");
                    return ret;
                }
            }
        }

        Element startIdElem = contentElem.element("startid");
        if (startIdElem == null) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::startIdElem is null");
            return ret;
        }
        String startIdStr = startIdElem.getStringValue();
        if (startIdStr == null || startIdStr.equals("")) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::startIdStr is invalid");
            return ret;
        }
        BigInteger startId = null;
        try {
            startId = new BigInteger(startIdStr);
        } catch (NumberFormatException e) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::startIdStr is not number. ("
                    + startIdStr + ")");
            return ret;
        }

        Element countElem = contentElem.element("count");
        if (countElem == null) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::countElem is null");
            return ret;
        }
        String countStr = countElem.getStringValue();
        if (countStr == null || countStr.equals("")) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::countStr is invalid");
            return ret;
        }
        int requestCount = 0;
        try {
            requestCount = Integer.parseInt(countStr);
        } catch (NumberFormatException e) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::countStr is not number");
            return ret;
        }

        Element conditionElem = contentElem.element("condition");
        if (conditionElem == null) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::conditionElem is null");
            return ret;
        }
        Element sortElem = conditionElem.element("sort");
        if (sortElem == null) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::sortElem is null");
            return ret;
        }
        CommunitySortCondition sortCondition = CommunitySortCondition
                .createSortConditionFromSortElement(sortElem);
        if (sortCondition == null) {
            Log.error("CommunityAdapter#getCommunityListRequestRequestFromGetMyCommunityListXMPP::sortCondition is null");
            return ret;
        }
        ret = new CommunityListRequest();
        ret.setStartId(startId);
        ret.setCount(requestCount);
        ret.setSortCondition(sortCondition);
        ret.setSelectPrivacyType(privacyType);
        ret.setSelectListType(listType);
        return ret;
    }

    private IQ createGetMyCommunityListResponsePacket(IQ iq,
            List<CommunityInfo> myCommunityInfoList) {
        Log.debug("do func CommunityAdapter.createGetMyCommunityListResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createGetMyCommunityListResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#createGetMyCommunityListResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#createGetMyCommunityListResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getmycommunitylist"))) {
            Log.error("CommunityAdapter#createGetMyCommunityListResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int count = myCommunityInfoList.size();
        int itemCount = 0;
        for (int i = 0; i < count; i++) {
            CommunityInfo communityInfo = myCommunityInfoList.get(i);
            Element itemElem = getCommunityInfoItemElem(communityInfo);
            if (itemElem == null) {
                Log.error("CommunityAdapter#createGetMyCommunityListResponsePacket::itemElem is null. No."
                        + i);
                continue;
            }
            itemsElem.add(itemElem);
            itemCount++;
        }
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        newContentElem.add(itemsElem);
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public IQ getCommunityInfo(IQ iq) {
        Log.debug("do func CommunityAdapter.getCommunityInfo(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getCommunityInfo::iq is null");
            return ret;
        }
        String roomId = getRoomIdFromGetCommunityInfoXMPP(iq);
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#getCommunityInfo::roomId is invalid");
            return ret;
        }
        JID fromJid = iq.getFrom();
        CommunityInfo communityInfo = CommunityManager.getInstance()
                .getCommunityInfoWithRequestJID(fromJid, roomId);

        ret = createGetCommunityInfoResponsePacket(iq, communityInfo);
        return ret;
    }

    private String getRoomIdFromGetCommunityInfoXMPP(IQ iq) {
        Log.debug("do func CommunityAdapter.getRoomIdFromGetCommunityInfoXMPP(...");
        String ret = "";
        if (iq == null) {
            Log.error("CommunityAdapter#getRoomIdFromGetCommunityInfoXMPP::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getRoomIdFromGetCommunityInfoXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getRoomIdFromGetCommunityInfoXMPP::tagName is invalid");
            return ret;
        }
        String namespace = "http://necst.nec.co.jp/protocol/getcommunityinfo";
        return getRoomIdFromXMPP(iq, namespace);
    }

    private IQ createGetCommunityInfoResponsePacket(IQ iq,
            CommunityInfo communityInfo) {
        Log.debug("do func CommunityAdapter.createGetCommunityInfoResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createGetCommunityInfoResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#createGetCommunityInfoResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#createGetCommunityInfoResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getcommunityinfo"))) {
            Log.error("CommunityAdapter#createGetCommunityInfoResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = getCommunityInfoItemElem(communityInfo);
        if (itemElem == null) {
            Log.info("CommunityAdapter#createGetCommunityInfoResponsePacket::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        newContentElem.add(itemsElem);
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public IQ getCommunityMemberInfo(IQ iq) {
        Log.debug("do func CommunityAdapter.getCommunityMemberInfo(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getCommunityMemberInfo::iq is null");
            return ret;
        }
        String roomId = getRoomIdFromGetCommunityMemberInfoXMPP(iq);
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#getCommunityMemberInfo::roomId is invalid");
            return ret;
        }
        JID fromJid = iq.getFrom();
        CommunityInfo communityInfo = CommunityManager.getInstance()
                .getCommunityInfoWithRequestJID(fromJid, roomId);

        ret = createGetCommunityMemberInfoResponsePacket(iq, communityInfo);
        return ret;
    }

    private String getRoomIdFromGetCommunityMemberInfoXMPP(IQ iq) {
        Log.debug("do func CommunityAdapter.getRoomIdFromGetCommunityMemberInfoXMPP(...");
        String ret = "";
        if (iq == null) {
            Log.error("CommunityAdapter#getRoomIdFromGetCommunityMemberInfoXMPP::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getRoomIdFromGetCommunityMemberInfoXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getRoomIdFromGetCommunityMemberInfoXMPP::tagName is invalid");
            return ret;
        }
        String namespace = "http://necst.nec.co.jp/protocol/getcommunitymemberinfo";
        return getRoomIdFromXMPP(iq, namespace);
    }

    private String getRoomIdFromXMPP(IQ iq, String namespace) {
        Log.debug("do func CommunityAdapter.getRoomIdFromXMPP(...");
        String ret = "";
        if (iq == null) {
            Log.error("CommunityAdapter#getRoomIdFromXMPP::iq is null");
            return ret;
        }
        if (namespace == null || "".equals(namespace)) {
            Log.error("CommunityAdapter#getRoomIdFromXMPP::namespace is invalid");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("CommunityAdapter#getRoomIdFromXMPP::iq type is not get");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getRoomIdFromXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getRoomIdFromXMPP::tagName is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("CommunityAdapter#getRoomIdFromXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("CommunityAdapter#getRoomIdFromXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#getRoomIdFromXMPP::roomId is invalid");
            return ret;
        }
        ret = roomId;
        return ret;
    }

    private IQ createGetCommunityMemberInfoResponsePacket(IQ iq,
            CommunityInfo communityInfo) {
        Log.debug("do func CommunityAdapter.createGetCommunityMemberInfoResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createGetCommunityMemberInfoResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#createGetCommunityMemberInfoResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#createGetCommunityMemberInfoResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/getcommunitymemberinfo"))) {
            Log.error("CommunityAdapter#createGetCommunityMemberInfoResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = creatCommunityMemberInfoItemElem(communityInfo);
        if (itemElem == null) {
            Log.info("CommunityAdapter#createGetCommunityMemberInfoResponsePacket::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        newContentElem.add(itemsElem);
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    private Element creatCommunityMemberInfoItemElem(CommunityInfo communityInfo) {
        Log.debug("do func CommunityAdapter.creatCommunityMemberInfoItemElem(...");
        if (communityInfo == null) {
            Log.error("CommunityAdapter#getCommunityMemberInfoItemElem::communityInfo is null");
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(communityInfo.getId()));
        itemElem.add(idElem);

        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(communityInfo.getRoomId());
        itemElem.add(roomIdElem);

        Element membersElem = DocumentHelper.createElement("members");
        List<CommunityMember> memberList = communityInfo.getMemberList();
        int memberCount = memberList.size();
        membersElem.addAttribute("count", String.valueOf(memberCount));
        itemElem.add(membersElem);

        List<String> jidList = new ArrayList<String>();
        for (int i = 0; i < memberCount; i++) {
            CommunityMember member = memberList.get(i);
            if (member == null) {
                continue;
            }
            String jid = member.getJid();
            jidList.add(jid);
        }
        List<Profile> userProfileList = UserProfileDbHelper
                .getUserProfileDataList(jidList);
        Map<String, Profile> profileMap = new ConcurrentHashMap<String, Profile>();
        int profileCount = userProfileList.size();
        for (int i = 0; i < profileCount; i++) {
            Profile profile = userProfileList.get(i);
            if (profile == null) {
                continue;
            }
            String jid = profile.getJid();
            profileMap.put(jid, profile);
        }
        for (int i = 0; i < memberCount; i++) {
            CommunityMember member = memberList.get(i);
            if (member == null) {
                continue;
            }
            String memberElemName = "";
            int role = member.getRole();
            switch (role) {
            case CommunityMember.ROLE_TYPE_GENERAL:
                memberElemName = "generalmember";
                break;
            case CommunityMember.ROLE_TYPE_OWNER:
                memberElemName = "owner";
                break;
            default:
                break;
            }
            if (memberElemName == null || memberElemName.equals("")) {
                Log.error("CommunityAdapter#getCommunityMemberInfoItemElem::memberElemName is invalid");
                continue;
            }
            String jid = member.getJid();
            Profile profile = profileMap.get(jid);
            Element memberElem = createMemberElem(memberElemName, member,
                    profile);
            if (memberElem == null) {
                Log.error("CommunityAdapter#getCommunityMemberInfoItemElem::memberElem is null");
                continue;
            }

            membersElem.add(memberElem);
        }

        return itemElem;
    }

    private Element createMemberElem(String tagName, CommunityMember member,
            Profile profile) {
        Log.debug("do func CommunityAdapter.createMemberElem(...");
        Element ret = null;
        if (tagName == null || tagName.equals("")) {
            Log.error("CommunityAdapter#createMemberElem::tagName is invalid");
        }
        if (member == null) {
            Log.error("CommunityAdapter#createMemberElem::member is null");
            return ret;
        }
        Element memberElem = DocumentHelper.createElement(tagName);
        String jid = member.getJid();
        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(jid);
        memberElem.add(jidElem);
        Element nickNameElem = DocumentHelper.createElement("nickName");
        String nickName = "";
        if (profile != null) {
            nickName = profile.getNickName();
            try {
                nickName = URLDecoder.decode(nickName, "UTF-8");
                nickName = URLEncoder.encode(nickName, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                nickName = "";
            }
        }
        nickNameElem.setText(nickName);
        memberElem.add(nickNameElem);
        Element avatarTypeElem = DocumentHelper.createElement("avatarType");
        String avatarType = "";
        if (profile != null) {
            avatarType = profile.getPhotoType();
        }
        avatarTypeElem.setText(avatarType);
        memberElem.add(avatarTypeElem);
        Element avatarDataElem = DocumentHelper.createElement("avatarData");
        String avatarData = "";
        if (profile != null) {
            avatarData = profile.getPhotoData();
        }
        avatarDataElem.setText(avatarData);
        memberElem.add(avatarDataElem);
        Element statusElem = DocumentHelper.createElement("status");
        int status = 1;
        if (profile != null) {
            status = profile.getDeleteFlg();
        }
        statusElem.setText(String.valueOf(status));
        memberElem.add(statusElem);
        Element roleElem = DocumentHelper.createElement("role");
        int role = member.getRole();
        roleElem.setText(String.valueOf(role));
        memberElem.add(roleElem);

        ret = memberElem;
        return ret;
    }

    private class CommunityListRequest {
        private BigInteger mStartId;
        private int mCount;
        private CommunitySortCondition mSortCondition;
        private int mPrivacyType;
        private int mListType;

        public CommunityListRequest() {
            mStartId = BigInteger.ZERO;
            mCount = 0;
            mSortCondition = null;
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

        public CommunitySortCondition getSortCondition() {
            return mSortCondition;
        }

        public void setSortCondition(CommunitySortCondition sortCondition) {
            mSortCondition = sortCondition;
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

    public IQ updateCommunityInfo(IQ iq) {
        Log.debug("do func CommunityAdapter.updateCommunityInfo(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#updateCommunityInfo::iq is null");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfoFromUpdateCommunityXMPP(iq);
        if (communityInfo == null) {
            Log.error("CommunityAdapter#updateCommunityInfo::communityInfo is null");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        CommunityInfo preCommunityInfo = CommunityManager.getInstance()
                .getCommunityInfo(communityInfo.getRoomId());

        if(communityInfo.getRoomName().compareToIgnoreCase("") == 0) {
            communityInfo.setRoomName(preCommunityInfo.getRoomName());
        }

        if(communityInfo.getNotifyType() == -1) {
            communityInfo.setNotifyType(preCommunityInfo.getNotifyType());
        }

        CommunityInfo updatedCommunityInfo = CommunityManager.getInstance()
                .updateCommunity(requestJid, communityInfo);
        if (updatedCommunityInfo == null) {
            Log.error("CommunityAdapter#updateCommunityInfo::updatedCommunityInfo is null");
            return ret;
        }
        ret = createUpdateCommunityResponsePacket(iq, updatedCommunityInfo,
                preCommunityInfo);
        CommunityNotifier.getInstance().sendUpdateCommunityInfoNotification(
                updatedCommunityInfo, preCommunityInfo);

        return ret;
    }

    private CommunityInfo getCommunityInfoFromUpdateCommunityXMPP(IQ iq) {
        Log.debug("do func CommunityAdapter.getCommunityInfoFromUpdateCommunityXMPP(...");
        CommunityInfo ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/updatecommunityinfo"))) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::roomId is invalid");
            return ret;
        }
        Element roomNameElem = contentElem.element("roomname");
        if (roomNameElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::roomname is null");
            return ret;
        }
        String roomName = roomNameElem.getStringValue();
        if (roomName == null || roomName.equals("")) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::roomName is invalid");
            return ret;
        }
        Element descriptionElem = contentElem.element("description");
        if (descriptionElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::descriptionElem is null");
            return ret;
        }
        String description = descriptionElem.getStringValue();
        if (description == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::description is invalid");
            return ret;
        }
        Element privacyTypeElem = contentElem.element("privacytype");
        if (privacyTypeElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::privacyTypeElem is null");
            return ret;
        }
        int privacyType = CommunityInfo.PRIVACY_TYPE_ITEM_SECRET;
        try {
            privacyType = Integer.parseInt(privacyTypeElem.getStringValue());
        } catch (NumberFormatException e) {
            e.printStackTrace();
            return ret;
        }
        if (privacyType < CommunityInfo.PRIVACY_TYPE_ITEM_OPEN
                || privacyType > CommunityInfo.PRIVACY_TYPE_ITEM_SECRET) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::privacyType is invalid");
            return ret;
        }
        Element memberEntryTypeElem = contentElem.element("memberentrytype");
        if (memberEntryTypeElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::memberEntryTypeElem is null");
            return ret;
        }
        int memberEntryType = 0;
        try {
            memberEntryType = Integer.parseInt(memberEntryTypeElem
                    .getStringValue());
        } catch (NumberFormatException e) {
            e.printStackTrace();
            return ret;
        }
        Element logoUrlElem = contentElem.element("logourl");
        if (logoUrlElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::logoUrlElem is null");
            return ret;
        }
        String logoUrl = logoUrlElem.getStringValue();
        if (logoUrl == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::logoUrl is invalid");
            return ret;
        }
        int notifyType = -1;
        Element notifyTypeElem = contentElem.element("notify_type");
        if (notifyTypeElem != null) {
            try {
                notifyType = Integer.parseInt(notifyTypeElem.getStringValue());
                if(!checkNotfiyType(notifyType)) {
                    Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::notifyType is out of range value:" + notifyType);
                    return ret;
                }
            } catch (NumberFormatException e) {
                Log.error("CommunityAdapter#getCommunityInfoFromCreateCommunityXMPP::notifyType is invalid");
                return ret;
            }
        }
        CommunityInfo communityInfo = new CommunityInfo();
        communityInfo.setRoomId(roomId);
        if(roomName.compareToIgnoreCase("") != 0) {
            communityInfo.setRoomName(roomName);
        }
        communityInfo.setDescription(description);
        communityInfo.setPrivacyType(privacyType);
        communityInfo.setMemberEntryType(memberEntryType);
        communityInfo.setLogoUrl(logoUrl);
        if(notifyType != -1) {
            communityInfo.setNotifyType(notifyType);
        }

        ret = communityInfo;
        return ret;
    }

    private IQ createUpdateCommunityResponsePacket(IQ iq,
            CommunityInfo updatedCommunityInfo, CommunityInfo preCommunityInfo) {
        Log.debug("do func CommunityAdapter.createUpdateCommunityResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createUpdateCommunityResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#createUpdateCommunityResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#createUpdateCommunityResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/updatecommunityinfo"))) {
            Log.error("CommunityAdapter#createUpdateCommunityResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = createUpdateCommunityContentElem(
                updatedCommunityInfo, preCommunityInfo);
        if (newContentElem == null) {
            Log.error("CommunityAdapter#createUpdateCommunityResponsePacket::newContentElem is null");
            return ret;
        }
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public Element createUpdateCommunityContentElem(
            CommunityInfo updatedCommunityInfo, CommunityInfo preCommunityInfo) {
        Log.debug("do func CommunityAdapter.createUpdateCommunityContentElem(...");
        Element ret = null;
        Element contentElem = DocumentHelper.createElement("content");
        Element extrasElem = DocumentHelper.createElement("extras");
        Element preInfoElem = getPreCommunityInfoElem(preCommunityInfo);
        if (preInfoElem == null) {
            Log.error("CommunityAdapter#createUpdateCommunityContentElem::preInfoElem is null");
            return ret;
        }
        extrasElem.add(preInfoElem);
        contentElem.add(extrasElem);
        Element itemsElem = DocumentHelper.createElement("items");
        itemsElem.addAttribute("count", String.valueOf(1));
        Element itemElem = getCommunityInfoItemElem(updatedCommunityInfo);
        if (itemElem == null) {
            Log.error("CommunityAdapter#createUpdateCommunityContentElem::itemElem is null");
            return ret;
        }
        itemsElem.add(itemElem);
        contentElem.add(itemsElem);
        ret = contentElem;
        return ret;
    }

    private Element getPreCommunityInfoElem(CommunityInfo preCommunityInfo) {
        Log.debug("do func CommunityAdapter.getPreCommunityInfoElem(...");
        if (preCommunityInfo == null) {
            Log.error("CommunityAdapter#getPreCommunityInfoElem::preCommunityInfo is null");
            return null;
        }
        Element preInfoElem = DocumentHelper.createElement("preinfo");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(preCommunityInfo.getId()));
        preInfoElem.add(idElem);

        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(preCommunityInfo.getRoomId());
        preInfoElem.add(roomIdElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        roomNameElem.setText(preCommunityInfo.getRoomName());
        preInfoElem.add(roomNameElem);

        Element descriptionElem = DocumentHelper.createElement("description");
        descriptionElem.setText(preCommunityInfo.getDescription());
        preInfoElem.add(descriptionElem);

        Element membersElem = DocumentHelper.createElement("members");
        List<CommunityMember> memberList = preCommunityInfo.getMemberList();
        membersElem.addAttribute("count", String.valueOf(memberList.size()));
        preInfoElem.add(membersElem);

        Element privacyTypeElem = DocumentHelper.createElement("privacytype");
        privacyTypeElem.setText(String.valueOf(preCommunityInfo
                .getPrivacyType()));
        preInfoElem.add(privacyTypeElem);

        Element memberEntryTypeElem = DocumentHelper
                .createElement("memberentrytype");
        memberEntryTypeElem.setText(String.valueOf(preCommunityInfo
                .getMemberEntryType()));
        preInfoElem.add(memberEntryTypeElem);

        Element logoUrlElem = DocumentHelper.createElement("logourl");
        logoUrlElem.setText(preCommunityInfo.getLogoUrl());
        preInfoElem.add(logoUrlElem);

        Element notifyTypeElem = DocumentHelper.createElement("notify_type");
        int notifyType = preCommunityInfo.getNotifyType();
        notifyTypeElem.setText(String.valueOf(notifyType));
        preInfoElem.add(notifyTypeElem);

        return preInfoElem;
    }

    public IQ deleteCommunity(IQ iq) {
        Log.debug("do func CommunityAdapter.deleteCommunity(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#deleteCommunity::iq is null");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfoFromDeleteCommunityXMPP(iq);
        if (communityInfo == null) {
            Log.error("CommunityAdapter#deleteCommunity::communityInfo is null");
            return ret;
        }
        CommunityInfo updatedCommunityInfo = CommunityManager.getInstance()
                .deleteCommunity(communityInfo);
        if (updatedCommunityInfo == null) {
            Log.error("CommunityAdapter#deleteCommunity::updatedCommunityInfo is null");
            return ret;
        }

        ret = IQ.createResultIQ(iq);

        return ret;
    }

    private CommunityInfo getCommunityInfoFromDeleteCommunityXMPP(IQ iq) {
        Log.debug("do func CommunityAdapter.getCommunityInfoFromDeleteCommunityXMPP(...");
        CommunityInfo ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromDeleteCommunityXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("CommunityAdapter#getCommunityInfoFromDeleteCommunityXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromDeleteCommunityXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getCommunityInfoFromDeleteCommunityXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/deletecommunity"))) {
            Log.error("CommunityAdapter#getCommunityInfoFromDeleteCommunityXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#getCommunityInfoFromUpdateCommunityXMPP::roomId is invalid");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        Timestamp timestamp = new Timestamp(System.currentTimeMillis());

        CommunityInfo communityInfo = new CommunityInfo();
        communityInfo.setRoomId(roomId);

        communityInfo.setUpdatedAt(timestamp);
        communityInfo.setUpdatedBy(requestJid);
        communityInfo.setDeletedAt(timestamp);
        communityInfo.setDeletedBy(requestJid);

        ret = communityInfo;
        return ret;
    }

    public IQ addCommunityMember(IQ iq) {
        Log.debug("do func CommunityAdapter.addCommunityMember(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#addCommunityMember::iq is null");
            return ret;
        }
        MemberData addMemberData = getAddOrRemoveMemberDataFromAddCommunityMemberXMPP(
                iq, ADD_COMMUNITY_MEMBER_NAMESPACE);
        if (addMemberData == null) {
            Log.error("CommunityAdapter#addCommunityMember::addMemberData is null");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        String roomId = addMemberData.getRoomId();
        List<String> addMemberJidList = addMemberData.getJidList();
        List<CommunityMember> addedMemberList = CommunityManager.getInstance()
                .addCommunityMember(requestJid, roomId, addMemberJidList);
        if (addedMemberList == null) {
            Log.error("CommunityAdapter#addCommunityMember::addedMemberList is null");
            return ret;
        }
        if (addedMemberList.size() <= 0) {
            Log.warn("CommunityAdapter#addCommunityMember::addedMemberList size is 0");
            return ret;
        }
        CommunityInfo communityInfo = CommunityManager.getInstance()
                .getCommunityInfo(roomId);
        ret = createAddCommunityMemberResponsePacket(iq, communityInfo,
                addedMemberList);

        CommunityNotifier.getInstance().sendAddCommunityMemberNotification(
                    requestJid, communityInfo, addedMemberList);

        return ret;
    }

    private IQ createAddCommunityMemberResponsePacket(IQ iq,
            CommunityInfo communityInfo, List<CommunityMember> addedMemberList) {
        Log.debug("do func CommunityAdapter.createAddCommunityMemberResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createAddCommunityMemberResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#createAddCommunityMemberResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#createAddCommunityMemberResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/addcommunitymember"))) {
            Log.error("CommunityAdapter#createAddCommunityMemberResponsePacket::namespace is invalid");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = createAddCommunityMemberContentElem(
                requestJid, communityInfo, addedMemberList);
        if (newContentElem == null) {
            Log.info("CommunityAdapter#createGetCommunityMemberInfoResponsePacket::newContentElem is null.");
            return ret;
        }
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public Element createAddCommunityMemberContentElem(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> addedMemberList) {
        Log.debug("do func CommunityAdapter.createAddCommunityMemberContentElem(...");
        Element ret = null;
        if (communityInfo == null) {
            Log.error("CommunityAdapter#creatAddCommunityMemberItemElem::communityInfo is null");
            return ret;
        }
        Element contentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = creatAddCommunityMemberItemElem(requestJid,
                communityInfo, addedMemberList);
        if (itemElem == null) {
            Log.info("CommunityAdapter#createAddCommunityMemberContentElem::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        contentElem.add(itemsElem);

        ret = contentElem;
        return ret;
    }

    private Element creatAddCommunityMemberItemElem(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> addedMemberList) {
        Log.debug("do func CommunityAdapter.creatAddCommunityMemberItemElem(...");
        if (communityInfo == null) {
            Log.error("CommunityAdapter#creatAddCommunityMemberItemElem::communityInfo is null");
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");

        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(communityInfo.getRoomId());
        itemElem.add(roomIdElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        roomNameElem.setText(communityInfo.getRoomName());
        itemElem.add(roomNameElem);

        Element addedByElem = DocumentHelper.createElement("added_by");
        addedByElem.setText(requestJid);
        itemElem.add(addedByElem);

        Element membersElem = DocumentHelper.createElement("members");
        int memberCount = addedMemberList.size();
        membersElem.addAttribute("count", String.valueOf(memberCount));
        itemElem.add(membersElem);

        List<String> jidList = new ArrayList<String>();
        for (int i = 0; i < memberCount; i++) {
            CommunityMember member = addedMemberList.get(i);
            if (member == null) {
                continue;
            }
            String jid = member.getJid();
            jidList.add(jid);
        }
        List<Profile> userProfileList = UserProfileDbHelper
                .getUserProfileDataList(jidList);
        Map<String, Profile> profileMap = new ConcurrentHashMap<String, Profile>();
        int profileCount = userProfileList.size();
        for (int i = 0; i < profileCount; i++) {
            Profile profile = userProfileList.get(i);
            if (profile == null) {
                continue;
            }
            String jid = profile.getJid();
            profileMap.put(jid, profile);
        }
        for (int i = 0; i < memberCount; i++) {
            CommunityMember member = addedMemberList.get(i);
            if (member == null) {
                continue;
            }
            String memberElemName = "member";
            String jid = member.getJid();
            Profile profile = profileMap.get(jid);
            Element memberElem = createMemberElem(memberElemName, member,
                    profile);
            if (memberElem == null) {
                Log.error("CommunityAdapter#creatAddCommunityMemberItemElem::memberElem is null");
                continue;
            }

            membersElem.add(memberElem);
        }

        Element notifyTypeElem = DocumentHelper.createElement("notify_type");
        int notifyType = communityInfo.getNotifyType();
        notifyTypeElem.setText(String.valueOf(notifyType));
        itemElem.add(notifyTypeElem);

        return itemElem;
    }

    class MemberData {
        private String mRoomId;
        private List<String> mJidList;

        public MemberData() {
            mRoomId = "";
            mJidList = null;
        }

        public String getRoomId() {
            return mRoomId;
        }

        public void setRoomId(String roomId) {
            mRoomId = roomId;
        }

        public List<String> getJidList() {
            return mJidList;
        }

        public void setJidList(List<String> addJidList) {
            mJidList = addJidList;
        }

    }

    public IQ updateCommunityOwner(IQ iq) {
        Log.debug("do func CommunityAdapter.updateCommunityOwner(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#updateCommunityOwner::iq is null");
            return ret;
        }
        MemberData ownerMemeberData = getOwnerDataFromUpdateCommunityOwnerXMPP(iq);
        if (ownerMemeberData == null) {
            Log.error("CommunityAdapter#updateCommunityOwner::ownerMemeberData is null");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        String roomId = ownerMemeberData.getRoomId();
        List<String> ownerJidList = ownerMemeberData.getJidList();
        CommunityInfo preCommunityInfo = CommunityManager.getInstance()
                .getCommunityInfo(roomId);
        List<CommunityMember> communityOwnerList = CommunityManager
                .getInstance().updateCommunityOwner(requestJid, roomId,
                        ownerJidList);
        if (communityOwnerList == null) {
            Log.error("CommunityAdapter#updateCommunityOwner::communityOwnerList is null");
            return ret;
        }
        if (communityOwnerList.size() <= 0) {
            Log.warn("CommunityAdapter#updateCommunityOwner::communityOwnerList size is 0");
            return ret;
        }
        CommunityInfo newCommunityInfo = CommunityManager.getInstance()
                .getCommunityInfo(roomId);
        ret = createUpdateCommunityOwnerResponsePacket(iq, newCommunityInfo,
                preCommunityInfo, communityOwnerList);

        CommunityNotifier.getInstance().sendUpdateCommunityOwnerNotification(
                newCommunityInfo, preCommunityInfo, communityOwnerList);

        return ret;
    }

    private MemberData getOwnerDataFromUpdateCommunityOwnerXMPP(IQ iq) {
        Log.debug("do func CommunityAdapter.getOwnerDataFromUpdateCommunityOwnerXMPP(...");
        MemberData ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/updatecommunityowner"))) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::roomId is invalid");
            return ret;
        }
        Element ownersElem = contentElem.element("owners");
        if (ownersElem == null) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::ownersElem is null");
            return ret;
        }
        @SuppressWarnings("unchecked")
        List<Element> ownerElementList = ownersElem.elements();
        if (ownerElementList == null) {
            Log.error("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::ownerElementList is null");
            return ret;
        }
        List<String> ownerJidList = new ArrayList<String>();
        for (Element ownerElem : ownerElementList) {
            if (ownerElem == null) {
                Log.warn("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::ownerElem is null");
                continue;
            }
            String ownerElemTagName = ownerElem.getName();
            if (ownerElemTagName == null
                    || !(ownerElemTagName.toLowerCase().equals("owner"))) {
                Log.info("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::ownerElemTagName is not \"onwer\".");
                continue;
            }
            String ownerJid = ownerElem.getStringValue();
            if (ownerJid == null || ownerJid.equals("")) {
                Log.info("CommunityAdapter#getOwnerDataFromUpdateCommunityOwnerXMPP::ownerJid is invalid");
                continue;
            }
            ownerJidList.add(ownerJid);
        }
        ret = new MemberData();
        ret.setRoomId(roomId);
        ret.setJidList(ownerJidList);

        return ret;
    }

    private IQ createUpdateCommunityOwnerResponsePacket(IQ iq,
            CommunityInfo newCommunityInfo, CommunityInfo preCommunityInfo,
            List<CommunityMember> communityOwnerList) {
        Log.debug("do func CommunityAdapter.createUpdateCommunityOwnerResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createUpdateCommunityOwnerResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#createUpdateCommunityOwnerResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#createUpdateCommunityOwnerResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/updatecommunityowner"))) {
            Log.error("CommunityAdapter#createUpdateCommunityOwnerResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = createUpdateCommunityOwnerContentElem(
                newCommunityInfo, preCommunityInfo, communityOwnerList);
        if (newContentElem == null) {
            Log.error("CommunityAdapter#createUpdateCommunityResponsePacket::newContentElem is null");
            return ret;
        }
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public Element createUpdateCommunityOwnerContentElem(
            CommunityInfo newCommunityInfo, CommunityInfo preCommunityInfo,
            List<CommunityMember> communityOwnerList) {
        Log.debug("do func CommunityAdapter.createUpdateCommunityOwnerContentElem(...");
        Element ret = null;
        Element contentElem = DocumentHelper.createElement("content");
        Element extrasElem = DocumentHelper.createElement("extras");
        Element preOwnersElem = createPreOwnersElem(preCommunityInfo);
        if (preOwnersElem == null) {
            Log.error("CommunityAdapter#createUpdateCommunityOwnerContentElem::preOwnersElem is null");
            return ret;
        }
        extrasElem.add(preOwnersElem);
        contentElem.add(extrasElem);
        Element itemsElem = DocumentHelper.createElement("items");
        itemsElem.addAttribute("count", String.valueOf(1));
        String roomId = newCommunityInfo.getRoomId();
        Element itemElem = createCommunityOwnerItemElem(roomId,
                communityOwnerList);
        if (itemElem == null) {
            Log.error("CommunityAdapter#createUpdateCommunityContentElem::itemElem is null");
            return ret;
        }
        itemsElem.add(itemElem);
        contentElem.add(itemsElem);
        ret = contentElem;
        return ret;
    }

    private Element createPreOwnersElem(CommunityInfo preCommunityInfo) {
        Log.debug("do func CommunityAdapter.createPreOwnersElem(...");
        Element ret = null;
        if (preCommunityInfo == null) {
            Log.error("CommunityAdapter#createPreOwnersElem::preCommunityInfo is null");
            return ret;
        }
        List<CommunityMember> preCommunityMemberList = preCommunityInfo
                .getMemberList();
        List<CommunityMember> preCommunityOwnerList = new ArrayList<CommunityMember>();
        for (CommunityMember member : preCommunityMemberList) {
            if (member == null) {
                continue;
            }
            if (member.getState() == CommunityMember.STATE_JOIN
                    && member.getRole() == CommunityMember.ROLE_TYPE_OWNER) {
                preCommunityOwnerList.add(member);
            }
        }
        Element preOwnersElem = DocumentHelper.createElement("preowners");
        int count = preCommunityOwnerList.size();
        preOwnersElem.addAttribute("count", String.valueOf(count));
        for (CommunityMember member : preCommunityOwnerList) {
            Element ownerElem = createOwnerElemnt(member);
            if (ownerElem == null) {
                continue;
            }
            preOwnersElem.add(ownerElem);
        }
        ret = preOwnersElem;
        return ret;
    }

    private Element createOwnerElemnt(CommunityMember ownerMember) {
        Log.debug("do func CommunityAdapter.createOwnerElemnt(...");
        Element ret = null;
        if (ownerMember == null) {
            Log.error("CommunityAdapter#createPreOwnersElem::ownerMember is null");
            return ret;
        }
        if (ownerMember.getRole() != CommunityMember.ROLE_TYPE_OWNER) {
            Log.error("CommunityAdapter#createPreOwnersElem::"
                    + ownerMember.getJid() + " is not owner");
            return ret;
        }
        Element ownerElem = DocumentHelper.createElement("owner");
        ownerElem.setText(ownerMember.getJid());

        ret = ownerElem;
        return ret;
    }

    private Element createCommunityOwnerItemElem(String roomId,
            List<CommunityMember> communityOwnerList) {
        Log.debug("do func CommunityAdapter.createCommunityOwnerItemElem(...");
        Element ret = null;
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#createCommunityOwnerItemElem::roomId is invalid.");
            return ret;
        }
        if (communityOwnerList == null) {
            Log.error("CommunityAdapter#createCommunityOwnerItemElem::communityOwnerList is null");
            return ret;
        }
        Element itemElem = DocumentHelper.createElement("item");
        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(roomId);
        itemElem.add(roomIdElem);
        Element ownersElem = DocumentHelper.createElement("owners");
        int count = communityOwnerList.size();
        ownersElem.addAttribute("count", String.valueOf(count));
        for (CommunityMember member : communityOwnerList) {
            Element ownerElem = createOwnerElemnt(member);
            if (ownerElem == null) {
                continue;
            }
            ownersElem.add(ownerElem);
        }
        itemElem.add(ownersElem);

        ret = itemElem;
        return ret;
    }

    public IQ removeCommunityMember(IQ iq) {
        Log.debug("do func CommunityAdapter.removeCommunityMember(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#removeCommunityMember::iq is null");
            return ret;
        }
        MemberData removeMemberData = getAddOrRemoveMemberDataFromAddCommunityMemberXMPP(
                iq, REMOVE_COMMUNITY_MEMBER_NAMESPACE);
        if (removeMemberData == null) {
            Log.error("CommunityAdapter#removeCommunityMember::removeMemberData is null");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        String roomId = removeMemberData.getRoomId();
        List<String> removeMemberJidList = removeMemberData.getJidList();
        List<CommunityMember> removedMemberList = CommunityManager
                .getInstance().removeCommunityMember(requestJid, roomId,
                        removeMemberJidList);
        if (removedMemberList == null) {
            Log.error("CommunityAdapter#removeCommunityMember::removedMemberList is null");
            return ret;
        }
        if (removedMemberList.size() <= 0) {
            Log.warn("CommunityAdapter#removeCommunityMember::removedMemberList size is 0");
            return ret;
        }
        CommunityInfo communityInfo = CommunityManager.getInstance()
                .getCommunityInfo(roomId);
        ret = createRemoveCommunityMemberResponsePacket(iq, communityInfo,
                removedMemberList);

        CommunityNotifier.getInstance().sendRemoveCommunityMemberNotification(
                requestJid, communityInfo, removedMemberList);

        return ret;
    }

    private MemberData getAddOrRemoveMemberDataFromAddCommunityMemberXMPP(
            IQ iq, String namespace) {
        Log.debug("do func CommunityAdapter.getAddOrRemoveMemberDataFromAddCommunityMemberXMPP(...");
        MemberData ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::iq is null");
            return ret;
        }
        if (namespace == null || namespace.equals("")) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::namespace is invalid");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::iq type is not set");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::tagName is invalid");
            return ret;
        }
        String tagNamespace = groupElem.getNamespaceURI();
        if (tagNamespace == null || !(tagNamespace.equals(namespace))) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = groupElem.element("content");
        if (contentElem == null) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::contentElem is null");
            return ret;
        }
        Element roomIdElem = contentElem.element("roomid");
        if (roomIdElem == null) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::roomIdElem is null");
            return ret;
        }
        String roomId = roomIdElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::roomId is invalid");
            return ret;
        }
        Element membersElem = contentElem.element("members");
        if (membersElem == null) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::membersElem is null");
            return ret;
        }
        @SuppressWarnings("unchecked")
        List<Element> memberElementList = membersElem.elements();
        if (memberElementList == null) {
            Log.error("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::memberElementList is null");
            return ret;
        }
        List<String> memberJidList = new ArrayList<String>();
        for (Element memberElem : memberElementList) {
            if (memberElem == null) {
                Log.warn("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::memberElem is null");
                continue;
            }
            String memberElemTagName = memberElem.getName();
            if (memberElemTagName == null
                    || !(memberElemTagName.toLowerCase().equals("member"))) {
                Log.info("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::memberElemTagName is not \"member\".");
                continue;
            }
            String memberJid = memberElem.getStringValue();
            if (memberJid == null || memberJid.equals("")) {
                Log.info("CommunityAdapter#getAddOrRemoveMemberDataFromAddCommunityMemberXMPP::memberJid is invalid");
                continue;
            }
            memberJidList.add(memberJid);
        }
        ret = new MemberData();
        ret.setRoomId(roomId);
        ret.setJidList(memberJidList);

        return ret;
    }

    private IQ createRemoveCommunityMemberResponsePacket(IQ iq,
            CommunityInfo communityInfo, List<CommunityMember> removedMemberList) {
        Log.debug("do func CommunityAdapter.createRemoveCommunityMemberResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createRemoveCommunityMemberResponsePacket::iq is null");
            return ret;
        }
        Element groupElem = iq.getChildElement();
        if (groupElem == null) {
            Log.error("CommunityAdapter#createRemoveCommunityMemberResponsePacket::groupElem is null");
            return ret;
        }
        String tagName = groupElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("group"))) {
            Log.error("CommunityAdapter#createRemoveCommunityMemberResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = groupElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals(REMOVE_COMMUNITY_MEMBER_NAMESPACE))) {
            Log.error("CommunityAdapter#createRemoveCommunityMemberResponsePacket::namespace is invalid");
            return ret;
        }
        String requestJid = iq.getFrom().toBareJID();
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = groupElem.element("content");
        if (contentElem != null) {
            groupElem.remove(contentElem);
        }
        Element newContentElem = createRemoveCommunityMemberContentElem(
                requestJid, communityInfo, removedMemberList);
        if (newContentElem == null) {
            Log.info("CommunityAdapter#createRemoveCommunityMemberResponsePacket::newContentElem is null.");
            return ret;
        }
        groupElem.add(newContentElem);
        groupElem.setParent(null);
        replyPacket.setChildElement(groupElem);
        ret = replyPacket;
        return ret;
    }

    public Element createRemoveCommunityMemberContentElem(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> removedMemberList) {
        Log.debug("do func CommunityAdapter.createRemoveCommunityMemberContentElem(...");
        Element ret = null;
        if (communityInfo == null) {
            Log.error("CommunityAdapter#createRemoveCommunityMemberContentElem::communityInfo is null");
            return ret;
        }
        Element contentElem = DocumentHelper.createElement("content");
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = creatRemoveCommunityMemberItemElem(requestJid,
                communityInfo, removedMemberList);
        if (itemElem == null) {
            Log.info("CommunityAdapter#createRemoveCommunityMemberContentElem::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        contentElem.add(itemsElem);

        ret = contentElem;
        return ret;
    }

    private Element creatRemoveCommunityMemberItemElem(String requestJid,
            CommunityInfo communityInfo, List<CommunityMember> removedMemberList) {
        Log.debug("do func CommunityAdapter.creatRemoveCommunityMemberItemElem(...");
        if (communityInfo == null) {
            Log.error("CommunityAdapter#creatRemoveCommunityMemberItemElem::communityInfo is null");
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");

        Element roomIdElem = DocumentHelper.createElement("roomid");
        roomIdElem.setText(communityInfo.getRoomId());
        itemElem.add(roomIdElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        roomNameElem.setText(communityInfo.getRoomName());
        itemElem.add(roomNameElem);

        Element removedByElem = DocumentHelper.createElement("removed_by");
        removedByElem.setText(requestJid);
        itemElem.add(removedByElem);

        Element membersElem = DocumentHelper.createElement("members");
        int memberCount = removedMemberList.size();
        membersElem.addAttribute("count", String.valueOf(memberCount));
        itemElem.add(membersElem);

        for (CommunityMember member : removedMemberList) {
            if (member == null) {
                continue;
            }
            Element memberElem = DocumentHelper.createElement("member");
            memberElem.setText(member.getJid());
            membersElem.add(memberElem);
        }

        return itemElem;
    }

    public IQ receiveCommunityMessage(IQ iq) {
        Log.debug("do func CommunityAdapter.receiveCommunityMessage(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#receiveCommunityMessage::iq is null");
            return ret;
        }
        Message communityMemssge = getCommunityMemssageFromSendCommunityMemberXMPP(iq);
        if (communityMemssge == null) {
            Log.error("CommunityAdapter#receiveCommunityMessage::communityMemssge is null");
            return ret;
        }

        String requestJid = iq.getFrom().toBareJID();

        Message savedCommunityMessage = CommunityManager.getInstance()
                .receiveMessage(requestJid, communityMemssge);
        if (savedCommunityMessage == null) {
            Log.error("CommunityAdapter#receiveCommunityMessage::savedCommunityMessage is null");
            return ret;
        }

        MessageReadInfoSetter.getInstance().setInitialData(
                savedCommunityMessage);

        ret = createSendCommunityMessageResponsePacket(iq,
                savedCommunityMessage);

        CommunityInfo communityInfo = CommunityManager.getInstance()
                .getCommunityInfo(savedCommunityMessage.getMsgTo());
        CommunityNotifier.getInstance().notifyCommunityMessage(
                savedCommunityMessage, communityInfo);

        CommunityStoreDbHelper.updateLastUpdateDate(savedCommunityMessage.getMsgTo());

        return ret;
    }

    public IQ receiveUpdateCommunityMessageBody(IQ iq) {
        Log.debug("do func CommunityAdapter.receiveUpdateCommunityMessageBody(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::iq is null");
            return ret;
        }

        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::not type set");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::messageElem is null");
            return ret;
        }
        Element content = messageElem.element("content");
        if (content == null) {
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::contentElem is null");
            return ret;
        }
        Attribute typeAttr = content.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Community.equals(ContentType
                .toType(type))) {
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::not type Community");
            return ret;
        }
        Element roomIdElem = content.element("room_id");
        if(roomIdElem == null ||
           roomIdElem.getStringValue() == null ||
           roomIdElem.getStringValue().equals("")) {
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::roomId is invalid");
            return  createUpdateMessageCommunityResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String roomId = roomIdElem.getStringValue();
        Element bodyElm = content.element("body");
        if(bodyElm == null ||
           bodyElm.getStringValue() == null){
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::bodyElm is invalid");
            return createUpdateMessageCommunityResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }

        Element itemIdElm = content.element("item_id");
        if(itemIdElm == null ||
           itemIdElm.getStringValue() == null){
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::itemIdElm is invalid");
            return createUpdateMessageCommunityResponsePacket(iq, GlobalSNSUtils.API_STATUS_BAD_REQUEST);
        }
        String itemId = itemIdElm.getStringValue();
        String fromJid = iq.getFrom().toBareJID();
        if (!CommunityMemberStoreDbHelper
            .isMemberOfRoomId(roomId, fromJid)) {
            Log.error("CommunityAdapter#receiveUpdateCommunityMessageBody::from user is not member. from="
                      + fromJid + " roomId=" + roomId);
            return createUpdateMessageCommunityResponsePacket(iq, GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR);
        }

        Element entryElm = DocumentHelper.createElement("entry");
        entryElm.addNamespace("","http://necst.nec.co.jp/protocol/updatemessagebody");
        entryElm.add(DocumentHelper.createElement("body").addText(bodyElm.getStringValue()));
        entryElm.add(DocumentHelper.createElement("attached_items").addAttribute("count","0"));
        Log.debug("CommunityAdapter.receiveUpdateCommunityMessageBody MessageStoreDbHelper.updateMessageBodyToDb entryXML:" + entryElm.asXML());

        if(!MessageStoreDbHelper.updateMessageBodyToDb(5,
                                                       itemId,
                                                       entryElm.asXML(),
                                                       fromJid,
                                                       roomId)){
            Log.error("CommunityAdapter.receiveUpdateCommunityMessageBody MessageStoreDbHelper.updateMessageBodyToDb error");
            return createUpdateMessageCommunityResponsePacket
                (iq, GlobalSNSUtils.API_STATUS_INTERNAL_SERVER_ERROR);
        }

        Message savedMessage = MessageAdapter
            .getInstance().getMessageWithoutReadInfo(itemId);
        MessageReadInfoSetter.getInstance().resetInitialData(savedMessage);

        CommunityInfo communityInfo = CommunityManager.getInstance()
            .getCommunityInfo(roomId);
        CommunityNotifier.getInstance().notifyCommunityMessageBody
            (savedMessage, communityInfo);

        CommunityStoreDbHelper.updateLastUpdateDate(roomId);

        return createUpdateMessageCommunityResponsePacket(iq, GlobalSNSUtils.API_STATUS_SUCCESS);
    }

    private Message getCommunityMemssageFromSendCommunityMemberXMPP(IQ iq) {
        Log.debug("do func CommunityAdapter.getCommunityMemssageFromSendCommunityMemberXMPP(...");
        Message ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::iq is null");
            return ret;
        }
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::not type set");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::messageElem is null");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::contentElem is null");
            return ret;
        }
        Attribute typeAttr = contentElem.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Community.equals(ContentType
                .toType(type))) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::not type Community");
            return ret;
        }
        Element msgfromElem = contentElem.element("msgfrom");
        if (msgfromElem == null) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::msgfromElem is null");
            return ret;
        }
        String from = msgfromElem.getStringValue();
        if (from == null || from.equals("")) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::from is invalid");
            return ret;
        }
        Element msgtoElem = contentElem.element("msgto");
        if (msgtoElem == null) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::msgtoElem is null");
            return ret;
        }
        String roomId = msgtoElem.getStringValue();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::roomId is invalid");
            return ret;
        }
        Element entryElem = contentElem.element("entry");
        if (entryElem == null) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::entryElem is null");
            return ret;
        }
        Element attachedItemsElem = contentElem.element("attached_items");
        if (attachedItemsElem == null) {
            Log.debug("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::attachedItemsElem is null");
            attachedItemsElem = DocumentHelper.createElement("attached_items");
            attachedItemsElem.addAttribute("count", String.valueOf(0));
        }
        Element tmpEntry = entryElem.createCopy();
        tmpEntry.add(attachedItemsElem.createCopy());
        String entryData = tmpEntry.asXML();
        if (entryData == null || entryData.equals("")) {
            Log.error("CommunityAdapter#getCommunityMemssageFromSendCommunityMemberXMPP::entryData is invalid");
            return ret;
        }
        Element replyIdElem = contentElem.element("reply_id");
        String replyItemId = "";
        if (replyIdElem != null) {
            replyItemId = replyIdElem.getStringValue();
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
        Log.debug("do func CommunityAdapter.getCommunityMemssageFromSendCommunityMemberXMPP(...  threadTitle : " + threadTitle);

        Element quotationItemIdElem = contentElem.element("quotation_item_id");
        String quotationItemIdStr = "";
        if(quotationItemIdElem != null){
            quotationItemIdStr = quotationItemIdElem.getStringValue();
        }


        Message communityMessage = new Message();
        communityMessage.setMsgType(Message.TYPE_COMMUNITY);
        communityMessage.setMsgFrom(from);
        communityMessage.setMsgTo(roomId);
        communityMessage.setEntry(entryData);
        communityMessage.setReplyId(replyItemId);
        communityMessage.setReplyTo(replyTo);
        communityMessage.setBodyType(bodyTypeInt);
        communityMessage.setThreadTitle(threadTitle);
        communityMessage.setQuotationItemId(quotationItemIdStr);
        Calendar now = Calendar.getInstance();
        Timestamp timeStamp = new Timestamp(now.getTimeInMillis());
        communityMessage.setCreatedAt(timeStamp);

        ret = communityMessage;
        return ret;
    }

    private IQ createSendCommunityMessageResponsePacket(IQ iq,
            Message savedCommunityMessage) {
        Log.debug("do func CommunityAdapter.createSendCommunityMessageResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createSendCommunityMessageResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("CommunityAdapter#createSendCommunityMessageResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("CommunityAdapter#createSendCommunityMessageResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(SEND_MESSAGE_NAMESPACE))) {
            Log.error("CommunityAdapter#createSendCommunityMessageResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        Element newContentElem = createSendCommunityMessageContentElem(savedCommunityMessage);
        if (newContentElem == null) {
            Log.info("CommunityAdapter#createSendCommunityMessageResponsePacket::newContentElem is null.");
            return ret;
        }
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        ret = replyPacket;
        return ret;
    }

    private IQ createUpdateMessageCommunityResponsePacket
        (IQ iq, int resultCode) {
        Log.debug("do func CommunityAdapter.createSendCommunityMessageResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("CommunityAdapter#createSendCommunityMessageResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("CommunityAdapter#createSendCommunityMessageResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("CommunityAdapter#createSendCommunityMessageResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(UPDATE_MESSAGE_BODY_NAMESPACE))) {
            Log.error("CommunityAdapter#createSendCommunityMessageResponsePacket::namespace is invalid");
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

    public Element createSendCommunityMessageContentElem(
            Message savedCommunityMessage) {
        Log.debug("do func CommunityAdapter.createSendCommunityMessageContentElem(...");
        Element ret = null;
        if (savedCommunityMessage == null) {
            Log.error("CommunityAdapter#createSendCommunityMessageContentElem::savedCommunityMessage is null");
            return ret;
        }
        Element contentElem = DocumentHelper.createElement("content");
        contentElem.addAttribute("type",
                IQMessageSendHandler.ContentType.Community.toString());
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = MessageAdapter.getInstance().getMessageItemElement(
                savedCommunityMessage);
        if (itemElem == null) {
            Log.info("CommunityAdapter#createSendCommunityMessageContentElem::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        contentElem.add(itemsElem);

        ret = contentElem;
        return ret;
    }

    public Element getCommunityMessageItemElement(Message communityMessage) {
        Log.debug("do func CommunityAdapter.getCommunityMessageItemElement(...");
        Element ret = null;
        if (communityMessage == null) {
            Log.error("CommunityAdapter#getCommunityMessageItemElement::groupChatMessage is null");
            return ret;
        }
        if (Message.TYPE_COMMUNITY != communityMessage.getMsgType()) {
            Log.error("CommunityAdapter#getCommunityMessageItemElement::message type is not Community");
            return ret;
        }
        Set<String> jidSet = new HashSet<String>();
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(communityMessage.getId()));
        itemElem.add(idElem);

        Element itemIdElem = DocumentHelper.createElement("item_id");
        itemIdElem.setText(communityMessage.getItemId());
        itemElem.add(itemIdElem);

        Element messageTypeElem = DocumentHelper.createElement("msgtype");
        messageTypeElem.setText(String.valueOf(communityMessage.getMsgType()));
        itemElem.add(messageTypeElem);

        Element messageFromElem = DocumentHelper.createElement("msgfrom");
        String fromJid = communityMessage.getMsgFrom();
        messageFromElem.setText(fromJid);
        itemElem.add(messageFromElem);
        jidSet.add(fromJid);

        Element messageToElem = DocumentHelper.createElement("msgto");
        String roomId = communityMessage.getMsgTo();
        messageToElem.setText(roomId);
        itemElem.add(messageToElem);

        Element roomNameElem = DocumentHelper.createElement("roomname");
        CommunityInfo communityInfo = CommunityManager.getInstance()
                .getCommunityInfoWithoutMemberInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityAdapter#getCommunityMessageItemElement::communityInfo is null");
            return ret;
        }
        roomNameElem.setText(communityInfo.getRoomName());
        itemElem.add(roomNameElem);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entryElem;
        String entryStr = communityMessage.getEntry();
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
        if (communityMessage.getDeleteFlag() == 2) {
            String deletedBy = communityMessage.getDeletedBy();
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
        createdAtElem.setText(communityMessage.getCreatedAtStr());
        itemElem.add(createdAtElem);

        Element updatedAt = DocumentHelper.createElement("updated_at");
        updatedAt.setText(communityMessage.getUpdatedAtStr());
        itemElem.add(updatedAt);

        Element replyIdElem = DocumentHelper.createElement("reply_id");
        String replyIdStr = communityMessage.getReplyId();
        replyIdElem.setText((replyIdStr == null) ? "" : replyIdStr);
        itemElem.add(replyIdElem);

        Element replyToElem = DocumentHelper.createElement("reply_to");
        String replyToStr = communityMessage.getReplyTo();
        replyToElem.setText((replyToStr == null) ? "" : replyToStr);
        itemElem.add(replyToElem);

        Element bodyType = DocumentHelper.createElement("body_type");
        bodyType.setText(String.valueOf(communityMessage.getBodyType()));
        itemElem.add(bodyType);

        Element threadTitleElem = DocumentHelper.createElement("thread_title");
        String threadTitleStr = communityMessage.getThreadTitle();
        threadTitleElem.setText((threadTitleStr == null) ? "" : threadTitleStr);
        itemElem.add(threadTitleElem);

        Element threadRootIdElem = DocumentHelper.createElement("thread_root_id");
        String threadRootIdStr = communityMessage.getThreadRootId();
        threadRootIdElem.setText((threadRootIdStr == null) ? "" : threadRootIdStr);
        itemElem.add(threadRootIdElem);

        Element quotation = QuotationMessageAdapter.getInstance().createElement(communityMessage);
        itemElem.add(quotation);

        Element emotionPoint = EmotionPointAdapter.getInstance().getEmotionPointElement(communityMessage.getEmotionPointList());
        itemElem.add(emotionPoint);

        Element emotionPointIconJsonElm = DocumentHelper.createElement("emotion_point_icon");
        String emotionPointIconJson = communityMessage.getEmotionPointIconJson();
        emotionPointIconJsonElm.setText((emotionPointIconJson == null) ? "{}" :  emotionPointIconJson);
        itemElem.add(emotionPointIconJsonElm);

        List<GoodJob> goodJobList = communityMessage.getGoodJobList();
        Element goodJobElem = GoodJobAdapter.getInstance().getGoodJobElement(
                goodJobList);
        itemElem.add(goodJobElem);

        Note note = communityMessage.getNote();
        Element noteElm = NoteAdapter.getInstance().getNoteElement(note);
        itemElem.add(noteElm);

        Element contextElem = DocumentHelper.createElement("context");
        itemElem.add(contextElem);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(communityMessage.getDeleteFlag()));
        itemElem.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            itemElem.add(personInfoElement);
        }

        return itemElem;
    }

    private boolean checkNotfiyType(int notifyType) {
        Log.debug("do func CommunityAdapter.checkNotfiyType(...");
        if(notifyType != CommunityInfo.NOTIFY_TYPE_ALL_ON
                && notifyType != CommunityInfo.NOTIFY_TYPE_ALL_OFF) {
            return false;
        }
        return true;
    }
}
