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

public class Note {
    private BigInteger mId;
    private String mTitle;
    private String mNoteUrl;
    private String mThreadRootId;
    private String mOldThreadRootId;
    private String mRoomId;
    private String mJid;
    private Timestamp mCreatedAt;
    private Timestamp mUpdatedAt;

    public Note() {
        mId = BigInteger.ZERO;
        mTitle = "";
        mNoteUrl = "";
        mThreadRootId = "";
        mOldThreadRootId = "";
        mRoomId = "";
        mJid = "";
        mCreatedAt = null;
        mUpdatedAt = null;
    }

    public Note(Note src) {
        mId = src.getId();
        mTitle = src.getTitle();
        mNoteUrl = src.getNoteUrl();
        mThreadRootId = src.getThreadRootId();
        mOldThreadRootId = src.getOldThreadRootId();
        mRoomId = src.getRoomId();
        mJid = src.getJid();
        mCreatedAt = src.getCreatedAt();
        mUpdatedAt = src.getUpdatedAt();
    }

    public BigInteger getId() {
        return mId;
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public String getTitle() {
        return mTitle;
    }

    public void setTitle(String title) {
        mTitle = title;
    }

    public String getNoteUrl() {
        return mNoteUrl;
    }

    public void setNoteUrl(String url) {
        mNoteUrl = url;
    }

    public String getThreadRootId() {
        return mThreadRootId;
    }

    public void setThreadRootId(String itemId) {
        mThreadRootId = itemId;
    }

    public String getOldThreadRootId() {
        return mOldThreadRootId;
    }

    public void setOldThreadRootId(String oldItemId) {
        mOldThreadRootId = oldItemId;
    }

    public String getRoomId() {
        return mRoomId;
    }

    public void setRoomId(String roomId) {
        mRoomId = roomId;
    }

    public String getJid() {
        return mJid;
    }

    public void setJid(String jid) {
        mJid = jid;
    }

    public Timestamp getCreatedAt() {
        return mCreatedAt;
    }

    public String getCreatedAtStr() {
        if(mCreatedAt == null) {
            return "";
        }
        long dateTime = mCreatedAt.getTime();
        java.util.Date date = new java.util.Date(dateTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss.SSS");
        return df.format(date);
    }

    public void setCreatedAt(Timestamp date) {
        mCreatedAt = date;
    }

    public Timestamp getUpdatedAt() {
        return mUpdatedAt;
    }

    public String getUpdatedAtStr() {
        if(mUpdatedAt == null) {
            return "";
        }
        long dateTime = mUpdatedAt.getTime();
        java.util.Date date = new java.util.Date(dateTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss.SSS");
        return df.format(date);
    }

    public void setUpdatedAt(Timestamp date) {
        mUpdatedAt = date;
    }
}
