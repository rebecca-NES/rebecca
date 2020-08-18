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

public class ChatRoomInfo {

    public static final String SUBTYPE_ITEM_CHANGEROOMNAME = "ChangeRoomName";
    public static final String SUBTYPE_ITEM_CHANGEIMAGE = "ChangeImage";
    public static final String SUBTYPE_ITEM_CHANGENOTIFY = "ChangeNotify";
    public static final String SUBTYPE_ITEM_DELETECHATROOM = "DeleteChatRoom";
    public static final String SUBTYPE_ITEM_PRIVACYTYPE = "ChangePrivacyType";

    public static final int NOTIFY_TYPE_ALL_ON = 0;
    public static final int NOTIFY_TYPE_ALL_OFF = 1;
    
    public static final int DELETE_FLAG_NOT_DELETED = 0;
    public static final int DELETE_FLAG_DELETED = 1;

    private BigInteger mId;
    private String mRoomId;
    private String mRoomName;
    private String mPreRoomName;
    private String mParentRoomId;
    private int mPreNotifyType;
    private Timestamp mCreatedAt;
    private String mCreatedBy;
    private Timestamp mUpdatedAt;
    private String mUpdatedBy;
    private int mDeleteFlag;
    private Timestamp mDeletedAt;
    private String mDeletedBy;
    private List<String> mMemberList;
    private List<String> mSubTypeList;
    private int mNotifyType;
    private int mPrivacyType;
    private int mPrePrivacyType;
    
    public ChatRoomInfo() {
        mId = BigInteger.ZERO;
        mRoomId = "";
        mRoomName = "";
        mParentRoomId = "";
        mCreatedAt = null;
        mCreatedBy = "";
        mUpdatedAt = null;
        mUpdatedBy = "";
        mDeleteFlag = 0;
        mDeletedAt = null;
        mDeletedBy = "";
        mMemberList = new ArrayList<String>();
        mSubTypeList = new ArrayList<String>();
        mNotifyType = -1;
        mPrivacyType = 2;
        mPrePrivacyType = -1;
    }

    public ChatRoomInfo(ChatRoomInfo src){
        mId = src.getId();
        mRoomId = src.getRoomId();
        mRoomName = src.getRoomName();
        mParentRoomId = src.getParentRoomId();
        mCreatedAt = src.getCreatedAt();
        mCreatedBy = src.getCreatedBy();
        mUpdatedAt = src.getUpdatedAt();
        mUpdatedBy = src.getUpdatedBy();
        mDeleteFlag = src.getDeleteFlag();
        mDeletedAt = src.getDeletedAt();
        mDeletedBy = src.getDeletedBy();
        mMemberList = new ArrayList<String>();
        mMemberList.addAll(src.getMemberList());
        mSubTypeList = new ArrayList<String>();
        mSubTypeList.addAll(src.getSubTypeList());
        mNotifyType = src.getNotifyType();
        mPrivacyType = src.getPrivacyType();
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

    public String getPreRoomName() {
        return mPreRoomName;
    }

    public void setPreRoomName(String preRoomName) {
        mPreRoomName = preRoomName;
    }

    public String getParentRoomId() {
        return mParentRoomId;
    }

    public void setParentRoomId(String parentRoomId) {
        mParentRoomId = parentRoomId;
    }

    public Timestamp getCreatedAt() {
        return mCreatedAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        mCreatedAt = createdAt;
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

    public String getDeletedAtStr() {
        if (mDeletedAt == null) {
            return "";
        }
        long deletedTime = mDeletedAt.getTime();
        java.util.Date date = new java.util.Date(deletedTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setDeletedAt(Timestamp deletedAt) {
        mDeletedAt = deletedAt;
    }

    public String getDeletedBy() {
        return mDeletedBy;
    }

    public void setDeletedBy(String deletedBy) {
        mDeletedBy = deletedBy;
    }

    public List<String> getMemberList() {
        return mMemberList;
    }

    public void setSubTypeList(List<String> SubTypeList) {
        mSubTypeList = SubTypeList;
    }

    public List<String> getSubTypeList() {
        return mSubTypeList;
    }

    public int getNotifyType() {
        return mNotifyType;
    }

    public void setNotifyType(int notifyType) {
        mNotifyType = notifyType;
    }

    public int getPreNotifyType() {
        return mPreNotifyType;
    }

    public void setPreNotifyType(int preNotifyType) {
        mPreNotifyType = preNotifyType;
    }

    public int getPrivacyType() {
        return mPrivacyType;
    }

    public void setPrivacyType(int privacyType) {
        mPrivacyType = privacyType;
    }

    public int getPrePrivacyType() {
        return mPrePrivacyType;
    }

    public void setPrePrivacyType(int privacyType) {
        mPrePrivacyType = privacyType;
    }

}
