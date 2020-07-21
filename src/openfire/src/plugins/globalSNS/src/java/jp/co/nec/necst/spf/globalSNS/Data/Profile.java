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

package jp.co.nec.necst.spf.globalSNS.Data;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import org.jivesoftware.openfire.roster.RosterItem;
import org.jivesoftware.openfire.roster.RosterItem.SubType;

public class Profile {
    private int mId;
    private String mJid;
    private String mPassword;
    private String mUserName;
    private String mNickName;
    private int mPresence;
    private String mMyMemo;
    private String mPhotoType;
    private String mPhotoData;
    private String mExtrasData;
    private Timestamp mDate;
    private String mEmail;
    private int mDeleteFlg;
    private String mAffiliation;
    private String mSubscription;

    public static final int PRESENCE_STATUS_FLAG_OFFLINE = 0x0;
    public static final int PRESENCE_STATUS_FLAG_MANUAL_ONLINE = 0x8;
    public static final int PRESENCE_STATUS_FLAG_AUTO_ONLINE = 0x10;
    
    public static final int PRESENCE_STATUS_OFFLINE_BEFORE_CHAT = 1;
    public static final int PRESENCE_STATUS_OFFLINE_BEFORE_AWAY = 2;
    public static final int PRESENCE_STATUS_OFFLINE_BEFORE_XA = 3;
    public static final int PRESENCE_STATUS_OFFLINE_BEFORE_DND = 4;
    public static final int PRESENCE_STATUS_MANUAL_CHAT = PRESENCE_STATUS_OFFLINE_BEFORE_CHAT | PRESENCE_STATUS_FLAG_MANUAL_ONLINE;
    public static final int PRESENCE_STATUS_MANUAL_AWAY = PRESENCE_STATUS_OFFLINE_BEFORE_AWAY | PRESENCE_STATUS_FLAG_MANUAL_ONLINE;
    public static final int PRESENCE_STATUS_MANUAL_XA = PRESENCE_STATUS_OFFLINE_BEFORE_XA | PRESENCE_STATUS_FLAG_MANUAL_ONLINE;
    public static final int PRESENCE_STATUS_MANUAL_DND = PRESENCE_STATUS_OFFLINE_BEFORE_DND | PRESENCE_STATUS_FLAG_MANUAL_ONLINE;
    public static final int PRESENCE_STATUS_AUTO_CHAT = PRESENCE_STATUS_OFFLINE_BEFORE_CHAT | PRESENCE_STATUS_FLAG_AUTO_ONLINE;
    public static final int PRESENCE_STATUS_AUTO_AWAY = PRESENCE_STATUS_OFFLINE_BEFORE_AWAY | PRESENCE_STATUS_FLAG_AUTO_ONLINE;
    public static final int PRESENCE_STATUS_AUTO_XA = PRESENCE_STATUS_OFFLINE_BEFORE_XA | PRESENCE_STATUS_FLAG_AUTO_ONLINE;
    public static final int PRESENCE_STATUS_AUTO_DND = PRESENCE_STATUS_OFFLINE_BEFORE_DND | PRESENCE_STATUS_FLAG_AUTO_ONLINE;
    
    public static final int DELETE_FLAG_STATUS_NOMAL = 0;
    public static final int DELETE_FLAG_STATUS_DELETED = 1;
    public static final int DELETE_FLAG_STATUS_SUSPEND = 2;

    public Profile() {
        mJid = "";
        mPassword = "";
        mUserName = "";
        mNickName = "";
        mPresence = 1;
        mMyMemo = "";
        mPhotoType = "";
        mPhotoData = "";
        mExtrasData = "";
        Calendar now = Calendar.getInstance();
        mDate = new Timestamp(now.getTimeInMillis());
        mEmail = "";
        mDeleteFlg = 0;
        mAffiliation = "";
        mSubscription = "none";
    }

    public Profile(Profile profile) {
        this.setId(profile.getId());
        this.setJid(profile.getJid());
        this.setPassword(profile.getPassword());
        this.setUserName(profile.getUserName());
        this.setNickName(profile.getNickName());
        this.setPresence(profile.getPresence());
        this.setMyMemo(profile.getMyMemo());
        this.setPhotoType(profile.getPhotoType());
        this.setPhotoData(profile.getPhotoData());
        Timestamp date = Timestamp.valueOf(profile.getDate().toString());
        this.setDate(date);
        this.setEmail(profile.getEmail());
        this.setDeleteFlg(profile.getDeleteFlg());
        this.setAffiliation(profile.getAffiliation());
        this.setExtrasData(profile.getExtrasData());
        this.setSubscription(profile.getSubscription());
    }

    public int getId() {
        return mId;
    }

    public void setId(int id) {
        mId = id;
    }

    public String getJid() {
        return mJid;
    }

    public void setJid(String jid) {
        mJid = jid;
    }

    public String getPassword() {
        return mPassword;
    }

    public void setPassword(String password) {
        mPassword = password;
    }

    public String getUserName() {
        return mUserName;
    }

    public void setUserName(String userName) {
        mUserName = userName;
    }

    public String getNickName() {
        return mNickName;
    }

    public void setNickName(String nickName) {
        mNickName = nickName;
    }

    public int getPresence() {
        return mPresence;
    }

    public void setPresence(int presence) {
        mPresence = presence;
    }

    public String getMyMemo() {
        return mMyMemo;
    }

    public void setMyMemo(String myMemo) {
        mMyMemo = myMemo;
    }

    public String getPhotoType() {
        return mPhotoType;
    }

    public void setPhotoType(String photoType) {
        mPhotoType = photoType;
    }

    public String getPhotoData() {
        return mPhotoData;
    }

    public void setPhotoData(String photoData) {
        mPhotoData = photoData;
    }

    public String getExtrasData() {
        return mExtrasData;
    }

    public void setExtrasData(String extrasData) {
        mExtrasData = (extrasData == null? "" : extrasData);
    }

    public String getDateStr() {
        if (mDate == null) {
            return "";
        }
        long dateTime = mDate.getTime();
        java.util.Date date = new java.util.Date(dateTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public Timestamp getDate() {
        return mDate;
    }

    public void setDate(Timestamp date) {
        mDate = date;
    }

    public String getEmail() {
        return mEmail;
    }

    public void setEmail(String email) {
        this.mEmail = email;
    }

    public int getDeleteFlg() {
        return mDeleteFlg;
    }

    public void setDeleteFlg(int deleteFlg) {
        this.mDeleteFlg = deleteFlg;
    }

    public String getAffiliation() {
        return mAffiliation;
    }

    public void setAffiliation(String groups) {
        this.mAffiliation = groups;
    }

    public String getSubscription() {
        return mSubscription;
    }

    public void setSubscription(SubType subStatus) {
        if (subStatus == RosterItem.SUB_BOTH) {
            mSubscription = "both";
        } else if (subStatus == RosterItem.SUB_FROM) {
            mSubscription = "from";
        } else if (subStatus == RosterItem.SUB_REMOVE) {
            mSubscription = "remove";
        } else if (subStatus == RosterItem.SUB_TO) {
            mSubscription = "to";
        } else if (subStatus == RosterItem.SUB_NONE) {
            mSubscription = "none";
        }
    }

    private void setSubscription(String subscription) {
        mSubscription = subscription;
    }
}
