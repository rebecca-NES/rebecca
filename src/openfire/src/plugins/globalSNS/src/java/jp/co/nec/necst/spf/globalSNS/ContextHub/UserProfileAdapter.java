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

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;
import jp.co.nec.necst.spf.globalSNS.Notification.UserProfileNotifier;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.auth.AuthFactory;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.jivesoftware.openfire.vcard.VCardManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;
import org.xmpp.packet.Presence;
import org.xmpp.packet.Presence.Show;

public class UserProfileAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(UserProfileAdapter.class);
    private static UserProfileAdapter mThisInstance = null;

    private UserProfileAdapter() {
    }

    public static UserProfileAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new UserProfileAdapter();
        }
        return mThisInstance;
    }

    public void entryUserProfile(Presence presence) {
        Log.debug("do func  UserProfileAdapter.entryUserProfile(");
        if (presence == null) {
            Log.error("entryUserProfile : presence packet is invalid");
            return;
        }

        JID fromJid = presence.getFrom();
        String jidData = fromJid.toBareJID();
        if (jidData == null || jidData.equals("")) {
            Log.error("entryUserProfile : jidData is invalid");
            return;
        }

        if (presence.getType() != null
                && (presence.getType().equals(Presence.Type.unsubscribe) || presence
                        .getType().equals(Presence.Type.unsubscribed))) {
            return;
        }

        Profile userProfile = UserProfileDbHelper.getUserProfileData(jidData);
        if (userProfile == null) {
            userProfile = new Profile();
            userProfile.setJid(jidData);
            String userName = fromJid.getNode();
            userProfile.setUserName(userName);
            userProfile
                    .setPresence(Profile.PRESENCE_STATUS_OFFLINE_BEFORE_CHAT);
            String password = "";
            try {
                password = AuthFactory.getAuthProvider().getPassword(userName);
                userProfile.setPassword(password);
            } catch (UserNotFoundException exception) {
                Log.error(exception.getMessage());
            }
            VCardManager vManager = VCardManager.getInstance();
            Element userVCard = vManager.getVCard(userName);
            if (userVCard != null) {
                Element nicknameElement = userVCard.element("NICKNAME");
                if (nicknameElement != null) {
                    String nickName = nicknameElement.getText();
                    userProfile.setNickName(nickName);
                }
                Element extrasElement = userVCard.element("EXTRAS");
                if (extrasElement != null) {
                    String extras = extrasElement.getText();
                    userProfile.setExtrasData(extras);
                }
            }
            UserProfileDbHelper.insertUserProfileDataToDb(userProfile);
        }

        userProfile.setJid(jidData);

        Profile profileData_s = new Profile();
        String nowDateTime = profileData_s.getDateStr();
        try {
            Timestamp newTime = new Timestamp(new SimpleDateFormat(
                    "yyyy/MM/dd HH:mm:ss").parse(nowDateTime).getTime());
            userProfile.setDate(newTime);
        } catch (Exception e) {
            Log.error("SimpleDateFormat Error");
            return;
        }

        boolean isLogin = false;
        if (presence.getType() == null) {
            int presenceDbData = userProfile.getPresence();
            if ((presenceDbData & Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE) != 0
                    || (presenceDbData & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) != 0) {
                boolean isPresenceChanged = false;
                if (presence.getShow() != null) {
                    int presenceData = 0;
                    if (presence.getShow().equals(Show.chat)) {
                        presenceData = 1;
                    } else if (presence.getShow().equals(Show.away)) {
                        presenceData = 2;
                    } else if (presence.getShow().equals(Show.xa)) {
                        presenceData = 3;
                    } else if (presence.getShow().equals(Show.dnd)) {
                        presenceData = 4;
                    } else {
                        Log.error("entryUserProfile : presence.getShow() is invalid");
                        return;
                    }
                    if ((presenceDbData & 0x7) != presenceData) {
                        userProfile.setPresence(presenceData
                                | Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE);
                        isPresenceChanged = true;
                    }
                } else {
                    Log.error("entryUserProfile : presence.getShow() is invalid");
                    return;
                }

                String myMemoData = presence.getStatus();
                try {
                    myMemoData = URLDecoder.decode(myMemoData, "UTF-8");
                    myMemoData = URLEncoder.encode(myMemoData, "UTF-8");
                } catch (UnsupportedEncodingException e) {
                    myMemoData = "";
                }
                boolean isMyMemoChanged = false;
                if (!myMemoData.equals(userProfile.getMyMemo())) {
                    userProfile.setMyMemo(myMemoData);
                    isMyMemoChanged = true;
                }

                if (isPresenceChanged || isMyMemoChanged) {
                    boolean updated = UserProfileDbHelper
                            .updateUserProfileDataToDb(userProfile, 0);
                    if (!updated) {
                        Log.error("faild to update User　Profile : JID = "
                                + jidData);
                        return;
                    }
                } else {
                    return;
                }
            } else {
                userProfile.setPresence(userProfile.getPresence()
                        | Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE);
                boolean updated = UserProfileDbHelper
                        .updateUserProfileDataToDb(userProfile, 1);
                if (!updated) {
                    Log.error("faild to update User　Profile : JID = " + jidData);
                    return;
                }
                isLogin = true;
            }
        } else {
            int currendDbPresence = userProfile.getPresence();
            if ((currendDbPresence & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) != 0) {
                currendDbPresence = (Profile.PRESENCE_STATUS_OFFLINE_BEFORE_CHAT | Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE);
            }
            userProfile.setPresence(currendDbPresence & 0x7);

            boolean updated = UserProfileDbHelper.updateUserProfileDataToDb(
                    userProfile, 1);
            if (!updated) {
                Log.error("faild to update User　Profile : JID = " + jidData);
                return;
            }
        }
        UserProfileNotifier.getInstance().notifyUserProfile(jidData);
        if (isLogin) {
            NotificationManager.getInstatnce().onLogin(jidData);
        }
    }
    
    public void initPresence() {
        UserProfileDbHelper.initPresence();
    }

    public Element getMessageEItemlemnt(String jid, Profile userProfile) {
        Log.debug("do func UserProfileAdapter.getMessageEItemlemnt(");
        Element PresenceItem = DocumentHelper.createElement("item");
        PresenceItem.addAttribute("jid", jid);
        if ((userProfile.getPresence() & Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE) != 0 || (userProfile.getPresence() & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) != 0) {
            PresenceItem.addAttribute("presence",
                    String.valueOf(userProfile.getPresence() & 0x7));
        } else {
            PresenceItem.addAttribute("presence", "0");
        }
        String myMemo = userProfile.getMyMemo();
        try {
            myMemo = URLDecoder.decode(myMemo, "UTF-8");
            PresenceItem.addAttribute("myMemo",
                    URLEncoder.encode(myMemo, "UTF-8"));
        } catch (UnsupportedEncodingException e) {
            PresenceItem.addAttribute("myMemo", "");
        }
        PresenceItem.addAttribute("updateTime", userProfile.getDateStr());
        return PresenceItem;
    }

    public void addUserProfile(Profile profileData) {
        UserProfileDbHelper.insertUserProfileDataToDb(profileData);
    }

    public void setVCard(String userName, Element vCardElement)
            throws Exception {
        if (userName == null) {
            return;
        }
        if (vCardElement == null) {
            return;
        }
        VCardManager vCardManager = XMPPServer.getInstance().getVCardManager();
        vCardManager.setVCard(userName, vCardElement);
    }

    public boolean updatePasswordToDB(String jidString, String password) {
        boolean ret = false;
        if (jidString == null || password == null) {
            Log.error("UserProfileAdapter#updatePassword - jidString or password is null.");
            return false;
        }
        Profile profile = UserProfileDbHelper.getUserProfileData(jidString);
        if (profile == null) {
            Log.error("UserProfileAdapter#updatePassword - profile data was not found from DB. jid="
                    + jidString);
            return false;
        }
        profile.setPassword(password);
        ret = UserProfileDbHelper.updateUserProfileDataToDb(profile, 0);
        return ret;
    }

    public Element createPersonInfoElement(Collection<String> jidCollection) {
        Element personInfoElem = DocumentHelper.createElement("person_info");
        if (jidCollection == null || jidCollection.isEmpty()) {
            Log.info("createPersonInfoElement::jidSet is null or empty.");
            personInfoElem.addAttribute("count", String.valueOf(0));
            return personInfoElem;
        }
        List<Profile> profileList = UserAccountManager.getInstance()
                .getProfileList(jidCollection);
        if (profileList == null || profileList.isEmpty()) {
            Log.info("createPersonInfoElement::profileList is null or empty.");
            personInfoElem.addAttribute("count", String.valueOf(0));
            return personInfoElem;
        }
        for (Profile profile : profileList) {
            if (profile == null) {
                continue;
            }
            Element itemElem = DocumentHelper.createElement("item");
            Element jidElem = DocumentHelper.createElement("jid");
            jidElem.setText(profile.getJid());
            itemElem.add(jidElem);
            Element nickNameElem = DocumentHelper.createElement("nickname");
            String nickName = profile.getNickName();
            try {
                nickName = URLDecoder.decode(nickName, "UTF-8");
                nickName = URLEncoder.encode(nickName, "UTF-8");
            } catch (UnsupportedEncodingException e) {
                nickName = "";
            }
            nickNameElem.setText(nickName);
            itemElem.add(nickNameElem);
            Element avatarTypeElem = DocumentHelper.createElement("avatartype");
            String avatarType = profile.getPhotoType();
            avatarTypeElem.setText(avatarType);
            itemElem.add(avatarTypeElem);
            Element avatarDataElem = DocumentHelper.createElement("avatardata");
            String avatarData = profile.getPhotoData();
            avatarDataElem.setText(avatarData);
            itemElem.add(avatarDataElem);
            Element statusElem = DocumentHelper.createElement("status");
            int status = profile.getDeleteFlg();
            statusElem.setText(String.valueOf(status));
            itemElem.add(statusElem);
            personInfoElem.add(itemElem);
        }
        int elementCount = personInfoElem.elements().size();
        personInfoElem.addAttribute("count", String.valueOf(elementCount));
        return personInfoElem;
    }
}
