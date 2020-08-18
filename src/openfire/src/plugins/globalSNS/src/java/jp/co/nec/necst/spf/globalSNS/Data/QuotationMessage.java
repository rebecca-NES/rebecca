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

public class QuotationMessage {
    private BigInteger mId;
    private String mQuotationItemId;
    private int mPrivateFlag;
    private String mEntry;
    private Timestamp mCreatedAt;
    private Timestamp mUpdatedAt;
    private int     mMsgType;
    private String mMsgFrom;
    private String mMsgTo;
    private String mNickName;
    private String mPhotoType;
    private String mPhotoData;
    private String mUserName;
    private String mAffiliation;

    public QuotationMessage() {
        mId = null;
        mQuotationItemId = null;
        mPrivateFlag = 1;
        mEntry = "";
        mCreatedAt = null;
        mUpdatedAt = null;
        mMsgType = 0;
        mMsgFrom = "";
        mMsgTo = "";
        mUserName = "";
        mNickName = "";
        mPhotoType = "";
        mPhotoData = "";
        mAffiliation = "";
    }

    public QuotationMessage(QuotationMessage src) {
        mId = src.getId();
        mQuotationItemId = src.getQuotationItemId();
        mPrivateFlag = src.getPrivateFlag();
        mMsgType = src.getMsgType();
        mMsgFrom = src.getMsgFrom();
        mMsgTo = src.getMsgTo();
        mEntry = src.getEntry();
        mCreatedAt = src.getCreatedAt();
        mUpdatedAt = src.getUpdatedAt();
        mUserName = src.getUserName();
        mNickName = src.getNickName();
        mPhotoType = src.getPhotoType();
        mPhotoData = src.getPhotoData();
        mAffiliation = src.getAffiliation();
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public BigInteger getId(){
        return mId;
    }

    public void setQuotationItemId(String quotationItemId){
        mQuotationItemId = quotationItemId;
    }

    public String getQuotationItemId(){
        return mQuotationItemId;
    }


    public void setPrivateFlag(int privateFlag){
        mPrivateFlag = privateFlag;
    }

    public int getPrivateFlag(){
        return mPrivateFlag;
    }

    public void setEntry(String entry){
        mEntry = entry;
    }

    public String getEntry(){
        return mEntry;
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

    public Timestamp getUpdatedAt() {
        return mUpdatedAt;
    }

    public String getUpdatedAtStr() {
        if (mUpdatedAt == null) {
            return "";
        }
        long updatedAt = mUpdatedAt.getTime();
        java.util.Date date = new java.util.Date(updatedAt);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        mUpdatedAt = updatedAt;
    }

    public int getMsgType() {
        return mMsgType;
    }

    public void setMsgType(int msgType) {
        mMsgType = msgType;
    }

    public String getMsgFrom() {
        return mMsgFrom;
    }

    public void setMsgFrom(String msgFrom) {
        mMsgFrom = msgFrom;
    }

    public void setMsgTo(String msgTo) {
        mMsgTo = msgTo;
    }

    public String getMsgTo() {
        return mMsgTo;
    }


    public String getNickName() {
        return mNickName;
    }

    public void setNickName(String nickName) {
        mNickName = nickName;
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

    public String getUserName() {
        return mUserName;
    }

    public void setUserName(String userName) {
        mUserName = userName;
    }

    public String getAffiliation() {
        return mAffiliation;
    }

    public void setAffiliation(String groups) {
        this.mAffiliation = groups;
    }

}
