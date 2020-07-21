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

public class MessageExistingReaderInfo {

    private String mItemId;
    private String mJid;
    private Timestamp mDate;
    private BigInteger mTemporaryUserId;

    public MessageExistingReaderInfo() {
        mItemId = "";
        mJid = "";
        mDate = null;
        setTemporaryUserId(null);
    }

    public MessageExistingReaderInfo(MessageExistingReaderInfo src) {
        mItemId = src.getItemId();
        mJid = src.getJid();
        mDate = src.getDate();
        mTemporaryUserId = src.getTemporaryUserId();
    }

    public String getItemId() {
        return mItemId;
    }

    public void setItemId(String itemId) {
        mItemId = itemId;
    }

    public String getJid() {
        return mJid;
    }

    public void setJid(String jid) {
        mJid = jid;
    }

    public Timestamp getDate() {
        return mDate;
    }

    public void setDate(Timestamp date) {
        mDate = date;
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

    public BigInteger getTemporaryUserId() {
        return mTemporaryUserId;
    }

    public void setTemporaryUserId(BigInteger temporaryUserId) {
        mTemporaryUserId = temporaryUserId;
    }
}
