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

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatRoomMemberStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityMemberStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAccountStroreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.UserAccountInfo;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.PersonSortCondition;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.AndCondition;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.ItemCondition;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.ItemCondition.ValueType;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.NotCondition;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.OrCondition;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.UserFilterCondition;

import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.roster.Roster;
import org.jivesoftware.openfire.roster.RosterItem;
import org.jivesoftware.openfire.user.User;
import org.jivesoftware.openfire.user.UserManager;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class UserAccountManager {
    private static final Logger Log = LoggerFactory
            .getLogger(UserAccountManager.class);
    private UserManager mUserManager = XMPPServer.getInstance()
            .getUserManager();

    private static UserAccountManager mInstance = null;

    public static UserAccountManager getInstance() {
        if (mInstance == null) {
            mInstance = new UserAccountManager();
        }
        return mInstance;
    }

    private UserAccountManager() {
    };

    public Collection<User> getAllOpenfireUsers() {
        return mUserManager.getUsers();
    }

    public Map<String, User> getCubeeSystemUsers() {
        String[] cubeeSystemUsersNameArray = { "admin", "cubee" };
        Map<String, User> cubeeSystemUsers = new HashMap<String, User>();
        for (int i = 0; i < cubeeSystemUsersNameArray.length; i++) {
            try {
                User cubeeSystemUser = mUserManager
                        .getUser(cubeeSystemUsersNameArray[i]);
                cubeeSystemUsers.put(cubeeSystemUsersNameArray[i],
                        cubeeSystemUser);
            } catch (UserNotFoundException e) {
                continue;
            }
        }
        return cubeeSystemUsers;
    }

    public List<JID> getProfilePushJidList(JID jid) {
        List<JID> ret = new ArrayList<JID>();
        if (jid == null) {
            Log.error("UserAccountManager#getProfilePushJidList::jid is null.");
            return ret;
        }
        Map<String, JID> jidMap = new ConcurrentHashMap<String, JID>();

        List<String> joinedAllChatRoomMemberJidList = ChatRoomMemberStoreDbHelper
                .getJoinedAllChatRoomMemberJidList(jid.toBareJID());
        if (joinedAllChatRoomMemberJidList != null
                && !joinedAllChatRoomMemberJidList.isEmpty()) {
            for (String memberJid : joinedAllChatRoomMemberJidList) {
                if (!jidMap.containsKey(memberJid)) {
                    jidMap.put(memberJid, new JID(memberJid));
                }
            }
        }

        List<String> joinedAllCommunityMemberJidList = CommunityMemberStoreDbHelper
                .getJoinedAllCommunityMemberJidList(jid.toBareJID());
        if (joinedAllCommunityMemberJidList != null
                && !joinedAllCommunityMemberJidList.isEmpty()) {
            for (String memberJid : joinedAllCommunityMemberJidList) {
                if (!jidMap.containsKey(memberJid)) {
                    jidMap.put(memberJid, new JID(memberJid));
                }
            }
        }


        List<JID> followerList = FollowFollowerManager.getInstance()
                .getFollowerJidList(jid);
        if (followerList != null) {
            for (JID followerJid : followerList) {
                if (followerJid == null) {
                    continue;
                }
                String followerJidStr = followerJid.toBareJID();
                if (!jidMap.containsKey(followerJidStr)) {
                    jidMap.put(followerJidStr, followerJid);
                }
            }
        }

        ret.addAll(jidMap.values());

        return ret;
    }

    public List<Profile> getProfileList(Collection<String> jidCollection) {
        List<Profile> ret = null;
        if (jidCollection == null) {
            Log.error("UserAccountManager#getProfileList::jidCollection is null.");
            return ret;
        }
        if (jidCollection.isEmpty()) {
            Log.error("UserAccountManager#getProfileList::jidCollection is empty.");
            return ret;
        }
        boolean exclusionDeleteUserFlag = false;
        ret = UserProfileDbHelper.getUserProfileDataList(jidCollection,
                exclusionDeleteUserFlag);
        return ret;
    }

    public Profile getProfile(String jid) {
        Profile ret = null;
        if (jid == null) {
            Log.error("UserAccountManager#getProfile::jid is null.");
            return ret;
        }
        if (jid.equals("")) {
            Log.error("UserAccountManager#getProfile::jid is empty.");
            return ret;
        }
        boolean exclusionDeleteUserFlag = false;
        ret = UserProfileDbHelper.getUserProfileData(jid,
                exclusionDeleteUserFlag);
        return ret;
    }

    public Profile getProfile(String jid, String requestUserJid) {
        if (requestUserJid == null) {
            Log.error("UserAccountManager#getProfile::requestUserJid is null.");
            return null;
        }
        if (requestUserJid.equals("")) {
            Log.error("UserAccountManager#getProfile::requestUserJid is empty.");
            return null;
        }
        Profile ret = getProfile(jid);
        if (ret == null) {
            Log.error("UserAccountManager#getProfile::Profile is null.");
            return null;
        }
        JID reqUserJid = new JID(requestUserJid);
        User fromUser = null;
        try {
            fromUser = XMPPServer.getInstance().getUserManager()
                    .getUser(reqUserJid.getNode());
        } catch (UserNotFoundException e) {
            Log.error("UserAccountManager#getProfile::fromUser is not found. : "
                    + requestUserJid);
            return null;
        }
        Roster roster = fromUser.getRoster();
        String getUserJid = ret.getJid();
        JID curJid = new JID(getUserJid);
        RosterItem rosterItem = null;
        try {
            rosterItem = roster.getRosterItem(curJid);
        } catch (UserNotFoundException e) {
            return ret;
        }
        ret.setSubscription(rosterItem.getSubStatus());
        return ret;
    }

    public List<Profile> searchProfile(int startId, int requestCount,
            UserFilterCondition filterCondition,
            PersonSortCondition sortCondition, JID fromJid) {
        if (filterCondition == null) {
            Log.error("UserAccountManager#searchProfile::filterCondition is null.");
            return null;
        }
        if (sortCondition == null) {
            Log.error("UserAccountManager#searchProfile::sortCondition is null.");
            return null;
        }
        if (fromJid == null) {
            Log.error("UserAccountManager#searchProfile::fromJid is empty.");
            return null;
        }
        UserFilterCondition condition = filterCondition;
        UserFilterCondition untargetSystemUserCondition = createUntargetSystemUserCondition();
        if (untargetSystemUserCondition != null) {
            AndCondition andCondition = new AndCondition();
            andCondition.addChildCondition(filterCondition);
            andCondition.addChildCondition(untargetSystemUserCondition);
            condition = andCondition;
        }

        List<Profile> userProfileList = UserProfileDbHelper.searchProfile(
                startId, requestCount, condition, sortCondition);

        List<Profile> margedUserProfileList = margeOpenfireUserData(
                userProfileList, fromJid);
        if (margedUserProfileList == null) {
            Log.error("UserAccountManager#searchProfile::from jid is null");
            return null;
        }
        return margedUserProfileList;
    }

    private List<Profile> margeOpenfireUserData(List<Profile> userProfileList,
            JID fromJid) {
        List<Profile> ret = null;
        String logPrefix = "UserAccountManager#margeOpenfireUserData::";
        if (userProfileList == null) {
            Log.error(logPrefix + "userProfileList is null");
            return ret;
        }
        User fromUser = null;
        Roster roster = null;
        try {
            fromUser = XMPPServer.getInstance().getUserManager()
                    .getUser(fromJid.getNode());
        } catch (UserNotFoundException e) {
            Log.error("margeOpenfireUserData() : ", e);
            return ret;
        }
        roster = fromUser.getRoster();
        ret = new ArrayList<Profile>();
        for (Profile profile : userProfileList) {
            if (profile == null) {
                continue;
            }
            Profile newProfile = new Profile(profile);
            String curJidStr = profile.getJid();
            JID curJid = new JID(curJidStr);
            RosterItem rosterItem = null;
            try {
                rosterItem = roster.getRosterItem(curJid);
            } catch (UserNotFoundException e) {
                ret.add(newProfile);
                continue;
            }
            newProfile.setSubscription(rosterItem.getSubStatus());
            ret.add(newProfile);
        }
        return ret;
    }

    public int getCount(UserFilterCondition filterCondition) {
        if (filterCondition == null) {
            Log.error("UserAccountManager#getCount filterCondition is null");
            return 0;
        }
        UserFilterCondition condition = filterCondition;
        UserFilterCondition untargetSystemUserCondition = createUntargetSystemUserCondition();
        if (untargetSystemUserCondition != null) {
            AndCondition andCondition = new AndCondition();
            andCondition.addChildCondition(filterCondition);
            andCondition.addChildCondition(untargetSystemUserCondition);
            condition = andCondition;
        }
        return UserProfileDbHelper.getCount(condition);
    }

    public UserFilterCondition createUntargetSystemUserCondition() {
        UserFilterCondition ret = null;
        Map<String, User> cubeeSystemUserMap = getCubeeSystemUsers();
        if (cubeeSystemUserMap == null) {
            return ret;
        }
        List<UserFilterCondition> systemUserCondition = new ArrayList<UserFilterCondition>();
        for (Map.Entry<String, User> entry : cubeeSystemUserMap.entrySet()) {
            String userStr = entry.getKey();
            if (userStr == null || "".equals(userStr)) {
                continue;
            }
            ItemCondition itemCondition = new ItemCondition();
            JID jid = XMPPServer.getInstance().createJID(userStr, null);
            if (jid == null) {
                continue;
            }
            itemCondition.setData("jid", ValueType.STRING, jid.toBareJID());
            systemUserCondition.add(itemCondition);
        }
        int count = systemUserCondition.size();
        if (count <= 0) {
            Log.debug("UserAccountManager#createUntargetSystemUserCondition:count is 0");
            return ret;
        }
        NotCondition notCondition = new NotCondition();
        if (count == 1) {
            UserFilterCondition userFilterCondition = systemUserCondition
                    .get(0);
            if (userFilterCondition == null) {
                Log.error("UserAccountManager#createUntargetSystemUserCondition:count =1 :userFilterCondition is null");
                return ret;
            }
            notCondition.setChildCondition(systemUserCondition.get(0));
        } else {
            OrCondition orCondition = new OrCondition();
            int addedCount = 0;
            UserFilterCondition latestAddUserFilterCondition = null;
            for (UserFilterCondition userFilterCondition : systemUserCondition) {
                if (userFilterCondition == null) {
                    Log.error("UserAccountManager#createUntargetSystemUserCondition:userFilterCondition is null");
                    continue;
                }
                if (orCondition.addChildCondition(userFilterCondition)) {
                    latestAddUserFilterCondition = userFilterCondition;
                    addedCount++;
                }
            }
            if (addedCount <= 0) {
                Log.error("UserAccountManager#createUntargetSystemUserCondition:addedCount is 0");
                return ret;
            } else if (addedCount == 1) {
                if (latestAddUserFilterCondition == null) {
                    Log.error("UserAccountManager#createUntargetSystemUserCondition:latestAddUserFilterCondition is null");
                    return ret;
                }
                notCondition.setChildCondition(latestAddUserFilterCondition);
            } else {
                notCondition.setChildCondition(orCondition);
            }
        }
        ret = notCondition;
        return ret;
    }

    public UserAccountInfo getUserAccountInfo(String userAccount) {
        return UserAccountStroreDbHelper.getUserAccountInfo(userAccount);
    }

    public boolean updateNotificationClientLastUpdatedAt(String jid,
            Timestamp notificationClientLastUpdatedAt) {
        return UserProfileDbHelper.updateNotificationClientLastUpdatedAt(jid,
                notificationClientLastUpdatedAt);
    }

    public Timestamp getNotificationClientLastUpdatedAt(String jid) {
        return UserProfileDbHelper.getNotificationClientLastUpdatedAt(jid);
    }

    public UserAccountInfo getUserAccountInfoByJid(String jid) {
        if (jid == null) {
            Log.error("getUserAccountInfo() : jid is null", new Throwable());
            return null;
        }
        return UserAccountStroreDbHelper.getUserAccountInfoByJid(jid);
    }

}
