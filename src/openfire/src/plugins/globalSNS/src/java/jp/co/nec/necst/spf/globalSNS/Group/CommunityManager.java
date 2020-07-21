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

package jp.co.nec.necst.spf.globalSNS.Group;

import java.math.BigInteger;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityMemberStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityMessageDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityMember;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.CommunitySortCondition;

import org.jivesoftware.util.Log;
import org.xmpp.packet.JID;

public class CommunityManager {
    private static CommunityManager mInstance = null;

    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateCommunityRoomId = new ConcurrentHashMap<String, Object>();
    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateCommunityFeedMessageItemId = new ConcurrentHashMap<String, Object>();

    public static CommunityManager getInstance() {
        Log.debug("do func CommunityManager.getInstance(...");
        if (mInstance == null) {
            mInstance = new CommunityManager();
        }
        return mInstance;
    }

    private CommunityManager() {
    }

    @SuppressWarnings("deprecation")
    public CommunityInfo createCommunity(CommunityInfo communityInfo) {
        Log.debug("do func CommunityManager.createCommunity(...");
        CommunityInfo ret = null;
        if (communityInfo == null) {
            return ret;
        }
        String createdByJidStr = communityInfo.getCreatedBy();
        Calendar now = Calendar.getInstance();
        communityInfo.setCreatedAt(new Timestamp(now.getTimeInMillis()));
        communityInfo.setUpdatedBy(createdByJidStr);
        communityInfo.setUpdatedAt(new Timestamp(now.getTimeInMillis()));
        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateCommunityRoomId) {
            lockObject = mLockObjectMapStringToObjectForGenerateCommunityRoomId
                    .get(createdByJidStr);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateCommunityRoomId.put(
                        createdByJidStr, lockObject);
            }
        }
        String roomId = null;
        synchronized (lockObject) {
            int nextRoomIdNumber = CommunityStoreDbHelper
                    .getNextCommunityRoomIdNumber(createdByJidStr);
            if (nextRoomIdNumber <= 0) {
                Log.error("CommunityManager#createCommunity::nextRoomIdNumber is invalid");
                return ret;
            }
            String roomIdPrefix = CommunityStoreDbHelper
                    .getRoomIdPrefix(communityInfo.getCreatedBy());
            if (roomIdPrefix == null || roomIdPrefix.equals("")) {
                Log.error("CommunityManager#createCommunity::roomIdPrefix is invalid");
                return ret;
            }
            roomId = roomIdPrefix + nextRoomIdNumber;
            communityInfo.setRoomId(roomId);
            if (!CommunityStoreDbHelper.insertCommunityToDb(communityInfo)) {
                Log.error("CommunityManager#createCommunity::failed to insertCommunityToDb");
                return ret;
            }
        }
        List<CommunityMember> memberList = communityInfo.getMemberList();
        for (CommunityMember member : memberList) {
            if (member == null) {
                continue;
            }
            member.setRoomId(roomId);
            member.setState(CommunityMember.STATE_JOIN);
            member.setJoinDate(new Timestamp(now.getTimeInMillis()));
            CommunityMemberStoreDbHelper.insertCommunityMemberToDb(member);
        }

        CommunityInfo createdCommunityInfo = getCommunityInfo(roomId);

        ret = createdCommunityInfo;

        return ret;
    }

    @SuppressWarnings("deprecation")
    public CommunityInfo getCommunityInfo(String roomId) {
        Log.debug("do func CommunityManager.getCommunityInfo(...");
        CommunityInfo ret = null;
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#getCommunityInfo::roomId is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfoWithoutMemberInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#getCommunityInfo::communityInfo got from DB is null.");
            return ret;
        }
        communityInfo = appendCommunityJoinMember(communityInfo);
        ret = communityInfo;
        return ret;
    }

    @SuppressWarnings("deprecation")
    public CommunityInfo getCommunityInfoWithoutMemberInfo(String roomId) {
        Log.debug("do func CommunityManager.getCommunityInfoWithoutMemberInfo(...");
        CommunityInfo ret = null;
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#getCommunityInfoWithoutMemberInfo::roomId is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = CommunityStoreDbHelper
                .getCommunityInfoByRoomId(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#getCommunityInfoWithoutMemberInfo::communityInfo got from DB is null.");
            return ret;
        }
        ret = communityInfo;
        return ret;
    }

    @SuppressWarnings("deprecation")
    public List<CommunityMember> getJoinMemberList(String roomId) {
        Log.debug("do func CommunityManager.getJoinMemberList(...");
        List<CommunityMember> ret = null;
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#getJoinMemberList::roomId is invalid");
            return ret;
        }
        List<CommunityMember> communityMemberList = CommunityMemberStoreDbHelper
                .getJoinMemberList(roomId);
        if (communityMemberList == null) {
            Log.error("CommunityManager#getJoinMemberList::communityMemberList got from DB is null.");
            return ret;
        }
        ret = communityMemberList;
        return ret;
    }

    @SuppressWarnings("deprecation")
    public List<CommunityInfo> getMyCommunityList(JID requestJid,
            BigInteger startId, int countNum,
            CommunitySortCondition sortCondition) {
        return getCommunityList(requestJid,
                                startId,
                                countNum,
                                sortCondition,
                                -1,-1);
    }

    @SuppressWarnings("deprecation")
    public List<CommunityInfo> getCommunityList(JID requestJid,
                                                BigInteger startId, int countNum,
                                                CommunitySortCondition sortCondition,
                                                int selectPrivacyType,
                                                int selectListType) {
        Log.debug("do func CommunityManager.getMyCommunityList(...");
        List<CommunityInfo> ret = null;
        if (requestJid == null) {
            Log.error("CommunityManager#getMyCommunityList::requestJid is null");
            return ret;
        }
        if (startId == null) {
            Log.error("CommunityManager#getMyCommunityList::startId is null");
            return ret;
        }
        if (countNum < 1) {
            Log.error("CommunityManager#getMyCommunityList::count is invalid");
            return ret;
        }
        if (sortCondition == null) {
            Log.error("CommunityManager#getMyCommunityList::sortCondition is null");
            return ret;
        }
        String requestJidStr = requestJid.toBareJID();

        List<CommunityInfo> communityDbList
            = CommunityStoreDbHelper.getComminityList(requestJidStr,
                                                      startId,
                                                      countNum,
                                                      sortCondition,
                                                      selectPrivacyType,
                                                      selectListType);
        if (communityDbList == null) {
            Log.error("CommunityManager#getMyCommunityList::communityDbList is null");
            return ret;
        }

        List<CommunityInfo> communityList = appendCommunityJoinMember(communityDbList);
        ret = communityList;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private List<CommunityInfo> appendCommunityJoinMember(
            List<CommunityInfo> communityList) {
        Log.debug("do func CommunityManager.appendCommunityJoinMember(...");
        List<CommunityInfo> ret = communityList;
        if (communityList == null) {
            Log.error("CommunityManager#appendCommunityJoinMember::communityList is null");
            return ret;
        }

        int count = communityList.size();
        List<CommunityInfo> retCommunityList = new ArrayList<CommunityInfo>();
        for (int i = 0; i < count; i++) {
            CommunityInfo communityInfo = communityList.get(i);
            if (communityInfo == null) {
                Log.error("CommunityManager#appendCommunityJoinMember::communityInfo is null. No."
                        + String.valueOf(i));
                continue;
            }
            communityInfo = appendCommunityJoinMember(communityInfo);
            retCommunityList.add(communityInfo);
        }
        ret = retCommunityList;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private CommunityInfo appendCommunityJoinMember(CommunityInfo communityInfo) {
        Log.debug("do func CommunityManager.appendCommunityJoinMember(...");
        if (communityInfo == null) {
            Log.error("CommunityManager#appendCommunityJoinMember::communityInfo is null.");
            return communityInfo;
        }
        List<CommunityMember> memberList = getJoinMemberList(communityInfo
                .getRoomId());
        if (memberList == null) {
            Log.error("CommunityManager#appendCommunityJoinMember::memberList is null.");
            return communityInfo;
        }
        int memberCount = memberList.size();
        List<CommunityMember> communityMemberList = communityInfo
                .getMemberList();
        for (int i = 0; i < memberCount; i++) {
            CommunityMember member = memberList.get(i);
            if (member == null) {
                Log.error("CommunityManager#appendCommunityJoinMember::member is invalid."
                        + i);
                continue;
            }
            communityMemberList.add(member);
        }
        return communityInfo;
    }

    @SuppressWarnings("deprecation")
    public CommunityInfo getCommunityInfoWithRequestJID(JID requestJid,
            String roomId) {
        Log.debug("do func CommunityManager.getCommunityInfoWithRequestJID(...");
        CommunityInfo ret = null;
        if (requestJid == null) {
            Log.error("CommunityManager#getCommunityInfoWithRequestJID::requestJid is null.");
            return ret;
        }
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#getCommunityInfoWithRequestJID::roomId is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#getCommunityInfoWithRequestJID::communityInfo is null.");
            return ret;
        }
        boolean isGettable = true;
        int communityPrivacyType = communityInfo.getPrivacyType();
        if (communityPrivacyType != CommunityInfo.PRIVACY_TYPE_ITEM_OPEN
                && communityPrivacyType != CommunityInfo.PRIVACY_TYPE_ITEM_CLOSED) {
            List<CommunityMember> memberList = communityInfo.getMemberList();
            if (memberList == null) {
                isGettable = false;
            }
            if (isGettable) {
                boolean isFound = false;
                for (CommunityMember member : memberList) {
                    if (member == null) {
                        continue;
                    }
                    String memberJid = member.getJid();
                    if (memberJid == null || memberJid.equals("")) {
                        continue;
                    }
                    if (memberJid.equals(requestJid.toBareJID())) {
                        isFound = true;
                        break;
                    }
                }
                if (!isFound) {
                    Log.info("CommunityManager#getCommunityInfoWithRequestJID:: "
                            + requestJid.toBareJID()
                            + " is not join. roomId="
                            + roomId);
                    isGettable = false;
                }
            }
        }
        if (isGettable) {
            ret = communityInfo;
        }

        return ret;
    }

    @SuppressWarnings("deprecation")
    public boolean isGettableMessage(String roomId, String jid) {
        Log.debug("do func CommunityManager.isGettableMessage(...");
        boolean ret = false;
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#isGettableMessage::roomId is null.");
            return ret;
        }
        if (jid == null || jid.equals("")) {
            Log.error("CommunityManager#isGettableMessage::jid is null.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        if (communityInfo.getPrivacyType() == CommunityInfo.PRIVACY_TYPE_ITEM_OPEN) {
            ret = true;
        } else if (isMember(communityInfo, jid)) {
            ret = true;
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public CommunityInfo updateCommunity(String requestJid,
            CommunityInfo requestUpdateCommunityInfo) {
        Log.debug("do func CommunityManager.updateCommunity(...");
        CommunityInfo ret = null;
        if (requestJid == null) {
            Log.error("CommunityManager#updateCommunity::requestJid is null.");
            return ret;
        }
        if (requestUpdateCommunityInfo == null) {
            Log.error("CommunityManager#updateCommunity::requestUpdateCommunityInfo is null.");
            return ret;
        }
        String roomId = requestUpdateCommunityInfo.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#updateCommunity::roomId is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#updateCommunity::communityInfo is null.");
            return ret;
        }
        if (!isOwner(communityInfo, requestJid)) {
            Log.error("CommunityManager#updateCommunity::"
                    + requestJid
                    + " doesn't have authority to update community info. Community room ID="
                    + roomId);
            return ret;
        }
        communityInfo.setRoomName(requestUpdateCommunityInfo.getRoomName());
        communityInfo.setDescription(requestUpdateCommunityInfo
                .getDescription());
        communityInfo.setPrivacyType(requestUpdateCommunityInfo
                .getPrivacyType());
        communityInfo.setMemberEntryType(requestUpdateCommunityInfo
                .getMemberEntryType());
        communityInfo.setLogoUrl(requestUpdateCommunityInfo.getLogoUrl());
        communityInfo.setNotifyType(requestUpdateCommunityInfo.getNotifyType());
        communityInfo.setUpdatedBy(requestJid);
        Calendar now = Calendar.getInstance();
        communityInfo.setUpdatedAt(new Timestamp(now.getTimeInMillis()));
        if (!CommunityStoreDbHelper.updateCommunityToDb(communityInfo)) {
            Log.error("CommunityManager#updateCommunity::failed to updateCommunityToDb");
            return ret;
        }
        ret = communityInfo;
        return ret;
    }

    @SuppressWarnings("deprecation")
    public CommunityInfo deleteCommunity(
            CommunityInfo requestUpdateCommunityInfo) {
        Log.debug("do func CommunityManager.deleteCommunity(...");
        CommunityInfo ret = null;
        if (requestUpdateCommunityInfo == null) {
            Log.error("CommunityManager#deleteCommunity::requestUpdateCommunityInfo is null.");
            return ret;
        }
        String roomId = requestUpdateCommunityInfo.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#deleteCommunity::roomId is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#deleteCommunity::communityInfo is null.");
            return ret;
        }
        communityInfo.setUpdatedAt(requestUpdateCommunityInfo.getUpdatedAt());
        communityInfo.setUpdatedBy(requestUpdateCommunityInfo.getUpdatedBy());
        communityInfo.setDeletedAt(requestUpdateCommunityInfo.getDeletedAt());
        communityInfo.setDeletedBy(requestUpdateCommunityInfo.getDeletedBy());
        if (!CommunityStoreDbHelper.deleteCommunityOnDb(communityInfo)) {
            Log.error("CommunityManager#deleteCommunity::failed to deleteCommunityOnDb");
            return ret;
        }
        ret = communityInfo;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private boolean isOwner(CommunityInfo communityInfo, String jid) {
        Log.debug("do func CommunityManager.isOwner(...");
        boolean ret = false;
        if (communityInfo == null) {
            Log.error("CommunityManager#isOwner::communityInfo is null");
            return ret;
        }
        if (jid == null || jid.equals("")) {
            Log.error("CommunityManager#isOwner::jid is invalid");
            return ret;
        }
        List<CommunityMember> communityMember = communityInfo.getMemberList();
        if (communityMember == null) {
            Log.error("CommunityManager#isOwner::communityMember is null");
            return ret;
        }
        for (CommunityMember member : communityMember) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            if (jid.equals(memberJid)) {
                if (member.getState() == CommunityMember.STATE_JOIN
                        && member.getRole() == CommunityMember.ROLE_TYPE_OWNER) {
                    ret = true;
                } else {
                    Log.info("CommunityManager#isOwner::" + jid
                            + " is not owner. Community room ID="
                            + communityInfo.getRoomId());
                }
                break;
            }
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public List<CommunityMember> addCommunityMember(String requestJid,
            String roomId, List<String> addJidList) {
        Log.debug("do func CommunityManager.addCommunityMember(...");
        List<CommunityMember> ret = null;
        if (requestJid == null) {
            Log.error("CommunityManager#addCommunityMember::requestJid is null.");
            return ret;
        }
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#addCommunityMember::roomId is invalid.");
            return ret;
        }
        if (addJidList == null || addJidList.size() <= 0) {
            Log.error("CommunityManager#addCommunityMember::addJidList is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#addCommunityMember::communityInfo is null.");
            return ret;
        }
        if (!isMember(communityInfo, requestJid)) {
            Log.error("CommunityManager#addCommunityMember::" + requestJid
                    + " isn't community member. Community room ID=" + roomId);
            return ret;
        }
        ConcurrentHashMap<String, CommunityMember> memberHash = new ConcurrentHashMap<String, CommunityMember>();
        List<CommunityMember> communityMember = communityInfo.getMemberList();
        if (communityMember == null) {
            Log.error("CommunityManager#addCommunityMember::communityMember is null");
            return ret;
        }
        for (CommunityMember member : communityMember) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            memberHash.put(memberJid, member);
        }
        int memberEntryType = communityInfo.getMemberEntryType();
        List<CommunityMember> addMemberList = new ArrayList<CommunityMember>();
        for (String addJid : addJidList) {
            if (addJid == null || addJid.equals("")) {
                continue;
            }
            CommunityMember member = memberHash.get(addJid);
            if (member == null
                    || member.getState() != CommunityMember.STATE_JOIN) {
                if (GlobalSNSUtils.isExistUser(new JID(addJid))) {
                    CommunityMember addMember = new CommunityMember();
                    addMember.setJid(addJid);
                    addMember.setRoomId(roomId);
                    addMember.setState(CommunityMember.STATE_JOIN);
                    addMember
                            .setRole(CommunityMember.ROLE_TYPE_GENERAL);
                    Calendar now = Calendar.getInstance();
                    addMember.setJoinDate(new Timestamp(now
                            .getTimeInMillis()));
                    addMemberList.add(addMember);
                }
            }
        }

        if (!CommunityMemberStoreDbHelper
                .updateOrInsertCommunityMemberToDb(addMemberList)) {
            Log.error("CommunityManager#addCommunityMember::failed to updateCommunityToDb");
            return ret;
        }
        ret = addMemberList;

        return ret;
    }

    @SuppressWarnings("deprecation")
    public List<CommunityMember> updateCommunityOwner(String requestJid,
            String roomId, List<String> ownerJidList) {
        Log.debug("do func CommunityManager.updateCommunityOwner(...");
        List<CommunityMember> ret = null;
        if (requestJid == null) {
            Log.error("CommunityManager#updateCommunityOwner::requestJid is null.");
            return ret;
        }
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#updateCommunityOwner::roomId is invalid.");
            return ret;
        }
        if (ownerJidList == null || ownerJidList.size() <= 0) {
            Log.error("CommunityManager#updateCommunityOwner::ownerJidList is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#updateCommunityOwner::communityInfo is null.");
            return ret;
        }
        if (!isOwner(communityInfo, requestJid)) {
            Log.error("CommunityManager#updateCommunityOwner::"
                    + requestJid
                    + " doesn't have authority to update community info. Community room ID="
                    + roomId);
            return ret;
        }
        boolean isIncludeRequestJid = false;
        HashSet<String> requestOwnerHash = new HashSet<String>();
        for (String requestOwner : ownerJidList) {
            if (requestOwner == null) {
                continue;
            }
            if (requestOwner.equals(requestJid)) {
                isIncludeRequestJid = true;
            }
            requestOwnerHash.add(requestOwner);
        }
        if (!isIncludeRequestJid) {
            Log.error("CommunityManager#updateCommunityOwner::request jid is not include. room ID="
                    + roomId);
            return ret;
        }
        List<CommunityMember> communityMemberList = communityInfo
                .getMemberList();
        if (communityMemberList == null) {
            Log.error("CommunityManager#updateCommunityOwner::communityMember is null");
            return ret;
        }
        List<CommunityMember> updateMemberList = new ArrayList<CommunityMember>();
        List<CommunityMember> notUpdateOwnerList = new ArrayList<CommunityMember>();
        for (CommunityMember member : communityMemberList) {
            if (member == null) {
                continue;
            }
            String memberJidStr = member.getJid();
            int memberState = member.getState();
            if (memberState != CommunityMember.STATE_JOIN) {
                Log.info("CommunityManager#updateCommunityOwner::"
                        + memberJidStr + " is not join. room ID=" + roomId);
                continue;
            }
            int role = member.getRole();
            if (role == CommunityMember.ROLE_TYPE_OWNER) {
                if (requestOwnerHash.contains(memberJidStr)) {
                    notUpdateOwnerList.add(member);
                } else {
                    member.setRole(CommunityMember.ROLE_TYPE_GENERAL);
                    updateMemberList.add(member);
                }
            } else {
                if (requestOwnerHash.contains(memberJidStr)) {
                    member.setRole(CommunityMember.ROLE_TYPE_OWNER);
                    updateMemberList.add(member);
                } else {
                }
            }
        }
        if (updateMemberList.size() <= 0) {
            Log.info("CommunityManager#updateCommunityOwner::update jid is nothing. room ID="
                    + roomId);
            return ret;
        }
        if (!CommunityMemberStoreDbHelper
                .updateCommunityMemberToDb(updateMemberList)) {
            Log.error("CommunityManager#updateCommunityOwner::failed to updateCommunityMemberToDb");
            return ret;
        }
        ret = notUpdateOwnerList;
        for (CommunityMember member : updateMemberList) {
            if (member == null) {
                continue;
            }
            int role = member.getRole();
            if (role == CommunityMember.ROLE_TYPE_OWNER) {
                ret.add(member);
            }
        }

        return ret;
    }

    @SuppressWarnings("deprecation")
    public List<CommunityMember> removeCommunityMember(String requestJid,
            String roomId, List<String> removeJidList) {
        Log.debug("do func CommunityManager.removeCommunityMember(...");
        List<CommunityMember> ret = null;
        if (requestJid == null) {
            Log.error("CommunityManager#removeCommunityMember::requestJid is null.");
            return ret;
        }
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#removeCommunityMember::roomId is invalid.");
            return ret;
        }
        if (removeJidList == null || removeJidList.size() <= 0) {
            Log.error("CommunityManager#removeCommunityMember::removeJidList is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#removeCommunityMember::communityInfo is null.");
            return ret;
        }
        if (!isOwner(communityInfo, requestJid)) {
            Log.error("CommunityManager#removeCommunityMember::"
                    + requestJid
                    + " doesn't have authority to update community info. Community room ID="
                    + roomId);
            return ret;
        }
        ConcurrentHashMap<String, CommunityMember> memberHash = new ConcurrentHashMap<String, CommunityMember>();
        List<CommunityMember> communityMember = communityInfo.getMemberList();
        if (communityMember == null) {
            Log.error("CommunityManager#removeCommunityMember::communityMember is null");
            return ret;
        }
        for (CommunityMember member : communityMember) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            memberHash.put(memberJid, member);
        }
        List<CommunityMember> removeMemberList = new ArrayList<CommunityMember>();
        for (String removeJid : removeJidList) {
            if (removeJid == null || removeJid.equals("")) {
                continue;
            }
            if (requestJid.equals(removeJid)) {
                Log.error("CommunityManager#removeCommunityMember::requested Jid is included. requested="
                        + requestJid);
                return ret;
            }
            CommunityMember member = memberHash.get(removeJid);
            if (member != null
                    && member.getState() == CommunityMember.STATE_JOIN) {
                if (GlobalSNSUtils.isExistUser(new JID(removeJid))) {
                    member.setState(CommunityMember.STATE_FORCE_LEAVE);
                    member.setRole(CommunityMember.ROLE_TYPE_NOT_JOIN);
                    Calendar now = Calendar.getInstance();
                    member.setLeaveDate(new Timestamp(now.getTimeInMillis()));
                    removeMemberList.add(member);
                }
            }
        }
        if (!CommunityMemberStoreDbHelper
                .updateCommunityMemberToDb(removeMemberList)) {
            Log.error("CommunityManager#removeCommunityMember::failed to updateCommunityToDb");
            return ret;
        }
        ret = removeMemberList;

        return ret;
    }

    @SuppressWarnings("deprecation")
    public Message receiveMessage(String requestJid, Message communityMemssge) {
        Log.debug("do func CommunityManager.receiveMessage(...");
        Message ret = null;
        if (requestJid == null) {
            Log.error("CommunityManager#receiveMessage::requestJid is null.");
            return ret;
        }
        if (communityMemssge == null) {
            Log.error("CommunityManager#receiveMessage::communityMemssge is invalid.");
            return ret;
        }
        String roomId = communityMemssge.getMsgTo();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#receiveMessage::roomId is invalid.");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        if (communityInfo == null) {
            Log.error("CommunityManager#receiveMessage::communityInfo is null.");
            return ret;
        }
        if (!isMember(communityInfo, requestJid)) {
            Log.error("CommunityManager#receiveMessage::requestJid is not join. requestJid="
                    + requestJid + " roomId=" + roomId);
            return ret;
        }
        String fromJid = communityMemssge.getMsgFrom();
        if (!requestJid.equals(fromJid)) {
            Log.error("CommunityManager#receiveMessage::msgFrom is invalid. requestJid="
                    + requestJid + " roomId=" + roomId);
            return ret;
        }
        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateCommunityFeedMessageItemId) {
            lockObject = mLockObjectMapStringToObjectForGenerateCommunityFeedMessageItemId
                    .get(fromJid);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateCommunityFeedMessageItemId
                        .put(fromJid, lockObject);
            }
        }
        String itemId = null;
        synchronized (lockObject) {
            int nextCommunityMessageItemIdNumber = CommunityMessageDbHelper
                    .getNextCommunityMessageIdNumber(fromJid);
            String communityMessageItemIdPrefix = CommunityMessageDbHelper
                    .getCommunityMessageItemIdPrefix(fromJid);
            if (nextCommunityMessageItemIdNumber <= 0
                    || communityMessageItemIdPrefix == null
                    || communityMessageItemIdPrefix.equals("")) {
                Log.error("CommunityManager#receiveMessage::itemIdIndex or communityMessageItemIdPrefix is invalid. requestJid="
                        + requestJid + " roomId=" + roomId);
                return ret;
            }
            itemId = communityMessageItemIdPrefix
                    + nextCommunityMessageItemIdNumber;
            communityMemssge.setItemId(itemId);

            if (!MessageStoreDbHelper.insertMessageToDb(communityMemssge)) {
                Log.error("CommunityManager#receiveMessage::faild to insert Community Message");
                return ret;
            }
        }

        ret = MessageAdapter.getInstance().getMessageWithoutReadInfo(itemId);
        return ret;
    }

    @SuppressWarnings("deprecation")
    private boolean isMember(CommunityInfo communityInfo, String jid) {
        Log.debug("do func CommunityManager.isMember(CommunityInfo communityInfo, String jid...");
        boolean ret = false;
        if (communityInfo == null) {
            Log.error("CommunityManager#isMember::communityInfo is null");
            return ret;
        }
        if (jid == null || jid.equals("")) {
            Log.error("CommunityManager#isMember::jid is invalid");
            return ret;
        }
        List<CommunityMember> communityMember = communityInfo.getMemberList();
        if (communityMember == null) {
            Log.error("CommunityManager#isMember::communityMember is null");
            return ret;
        }
        for (CommunityMember member : communityMember) {
            if (member == null) {
                continue;
            }
            String memberJid = member.getJid();
            if (jid.equals(memberJid)) {
                if (member.getState() == CommunityMember.STATE_JOIN) {
                    ret = true;
                } else {
                    Log.info("CommunityManager#isMember::" + jid
                            + " is not member. Community room ID="
                            + communityInfo.getRoomId());
                }
                break;
            }
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public boolean isMember(String roomId, String jid) {
        Log.debug("do func CommunityManager.isMember(...");
        boolean ret = false;
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityManager#isMember::roomId is invalid");
            return ret;
        }
        if (jid == null || jid.equals("")) {
            Log.error("CommunityManager#isMember::jid is invalid");
            return ret;
        }
        CommunityInfo communityInfo = getCommunityInfo(roomId);
        return isMember(communityInfo, jid);
    }
}
