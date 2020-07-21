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

public class TaskNote {
    private BigInteger mId;
    private String mItemId;
    private String mSenderJid;
    private String mMessage;
    private Timestamp mDate;

    public TaskNote() {
        mId = BigInteger.ZERO;
        mItemId = "";
        mSenderJid = "";
        mMessage = "";
        mDate = null;
    }
    
    public TaskNote(TaskNote src) {
        mId = src.getId();
        mItemId = src.getItemId();
        mSenderJid = src.getSenderJid();
        mMessage = src.getMessage();
        mDate = src.getDate();
    }

    public BigInteger getId() {
        return mId;
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public String getItemId() {
        return mItemId;
    }

    public void setItemId(String itemId) {
        mItemId = itemId;
    }

    public String getSenderJid() {
        return mSenderJid;
    }

    public void setSenderJid(String senderJid) {
        mSenderJid = senderJid;
    }

    public String getMessage() {
        return mMessage;
    }

    public void setMessage(String message) {
        mMessage = message;
    }

    public Timestamp getDate() {
        return mDate;
    }
    
    public String getDateStr() {
        if(mDate == null) {
            return "";
        }
        long dateTime = mDate.getTime();
        java.util.Date date = new java.util.Date(dateTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setDate(Timestamp date) {
        mDate = date;
    }
}
