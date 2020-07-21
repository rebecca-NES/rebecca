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

import java.math.BigInteger;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

public class CommunityInfo {

    public static final int PRIVACY_TYPE_ITEM_OPEN = 0;
    public static final int PRIVACY_TYPE_ITEM_CLOSED = 1;
    public static final int PRIVACY_TYPE_ITEM_SECRET = 2;

    public static final int MEMBER_ENTRY_TYPE_ITEM_ADD = 0;
    public static final int MEMBER_ENTRY_TYPE_ITEM_INVITE = 1;
    public static final int MEMBER_ENTRY_TYPE_ITEM_INVITE_OR_ACCEPT = 2;
    public static final int MEMBER_ENTRY_TYPE_ITEM_INVITE_OR_FREE = 3;

    public static final int NOTIFY_TYPE_ALL_ON = 0;
    public static final int NOTIFY_TYPE_ALL_OFF = 1;

    public static final int DELETE_FLAG_NOT_DELETED = 0;
    public static final int DELETE_FLAG_DELETED = 1;

    private BigInteger mId;
    private String mRoomId;
    private String mRoomName;
    private String mDescription;
    private int mPrivacyType;
    private int mMemberEntryType;
    private String mLogoUrl;
    private Timestamp mCreatedAt;
    private String mCreatedBy;
    private Timestamp mUpdatedAt;
    private String mUpdatedBy;
    private int mDeleteFlag;
    private Timestamp mDeletedAt;
    private String mDeletedBy;
    private List<CommunityMember> mMemberList;
    private int mNotifyType;

    public CommunityInfo() {
        mId = BigInteger.ZERO;
        mRoomId = "";
        mRoomName = "";
        mDescription = "";
        mPrivacyType = 0;
        mMemberEntryType = 0;
        mLogoUrl = "";
        mCreatedAt = null;
        mCreatedBy = "";
        mUpdatedAt = null;
        mUpdatedBy = "";
        mDeleteFlag = DELETE_FLAG_NOT_DELETED;
        mDeletedAt = null;
        mDeletedBy = "";
        mMemberList = new ArrayList<CommunityMember>();
        mNotifyType = -1;
    }

    public BigInteger getId() {
        return mId;
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public String getRoomId() {
        return mRoomId;
    }

    public void setRoomId(String roomId) {
        mRoomId = roomId;
    }

    public String getRoomName() {
        return mRoomName;
    }

    public void setRoomName(String roomName) {
        mRoomName = roomName;
    }

    public String getDescription() {
        return mDescription;
    }

    public void setDescription(String description) {
        mDescription = description;
    }

    public int getPrivacyType() {
        return mPrivacyType;
    }

    public void setPrivacyType(int privacyType) {
        mPrivacyType = privacyType;
    }

    public int getMemberEntryType() {
        return mMemberEntryType;
    }

    public void setMemberEntryType(int memberEntryType) {
        mMemberEntryType = memberEntryType;
    }

    public String getLogoUrl() {
        return mLogoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        mLogoUrl = logoUrl;
    }

    public Timestamp getCreatedAt() {
        return mCreatedAt;
    }

    public String getCreatedAtStr() {
        if (mCreatedAt == null) {
            return "";
        }
        long createdTime = mCreatedAt.getTime();
        java.util.Date date = new java.util.Date(createdTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setCreatedAt(Timestamp createdAt) {
        mCreatedAt = createdAt;
    }

    public String getCreatedBy() {
        return mCreatedBy;
    }

    public void setCreatedBy(String createdBy) {
        mCreatedBy = createdBy;
    }

    public Timestamp getUpdatedAt() {
        return mUpdatedAt;
    }

    public String getUpdatedAtStr() {
        if (mUpdatedAt == null) {
            return "";
        }
        long updatedTime = mUpdatedAt.getTime();
        java.util.Date date = new java.util.Date(updatedTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        mUpdatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return mUpdatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        mUpdatedBy = updatedBy;
    }

    public int getDeleteFlag() {
        return mDeleteFlag;
    }

    public void setDeleteFlag(int deleteFlag) {
        mDeleteFlag = deleteFlag;
    }

    public Timestamp getDeletedAt() {
        return mDeletedAt;
    }

    public void setDeletedAt(Timestamp deletedAt) {
        mDeletedAt = deletedAt;
    }

    public String getDeletedBy() {
        return mDeletedBy;
    }

    public String getDeletedAtStr() {
        if (mDeletedAt == null) {
            return "";
        }
        long deletedTime = mDeletedAt.getTime();
        java.util.Date date = new java.util.Date(deletedTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setDeletedBy(String deletedBy) {
        mDeletedBy = deletedBy;
    }

    public List<CommunityMember> getMemberList() {
        return mMemberList;
    }

    public int getNotifyType() {
        return mNotifyType;
    }

    public void setNotifyType(int notifyType) {
        mNotifyType = notifyType;
    }
}
