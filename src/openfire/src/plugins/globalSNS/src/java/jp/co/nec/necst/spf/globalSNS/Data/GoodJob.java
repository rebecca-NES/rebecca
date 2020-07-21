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
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.Document;
import org.dom4j.DocumentException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class GoodJob {
    private BigInteger mId;
    private String mItemId;
    private String mMsgOwnJid;
    private String mMsgTo;
    private int mMsgType;
    private String mEntry;
    private String mItemKeeperJid;
    private String mGjJid;
    private Timestamp mDate;

    private static final Logger Log = LoggerFactory
        .getLogger(GoodJob.class);

    public GoodJob() {
        mId = BigInteger.ZERO;
        mItemId = "";
        mMsgOwnJid = "";
        mMsgTo = "";
        mMsgType = -1;
        mEntry = "";
        mItemKeeperJid = "";
        mGjJid = "";
        mDate = null;
    }
    
    public GoodJob(GoodJob src) {
        mId = src.getId();
        mItemId = src.getItemId();
        mMsgOwnJid = src.getMsgOwnJid();
        mMsgTo = src.getMsgTo();
        mMsgType = src.getMsgType();
        mEntry = src.getEntry();
        mItemKeeperJid = src.getItemKeeperJid();
        mGjJid = src.getGjJid();
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

    public String getMsgOwnJid() {
        return mMsgOwnJid;
    }

    public void setMsgOwnJid(String msgownjid) {
        mMsgOwnJid = msgownjid;
    }
    public void setMsgTo(String msgto) {
        mMsgTo = msgto;
    }

    public String getMsgTo() {
        return mMsgTo;
    }

    public void setMsgType(int msgtype) {
        mMsgType = msgtype;
    }

    public void setMsgType(String msgtype) {
        mMsgType = Integer.parseInt(msgtype);
    }

    public int getMsgType() {
        return mMsgType;
    }

    public void setEntry(String entry) {
        mEntry = entry;
    }

    public String getEntry() {
        return mEntry;
    }

    public String getEntryBody() {
        Document document = null;
        String body = "";
        try {
            document = DocumentHelper.parseText(mEntry);
            body = document.getRootElement().element("body").getText();
        } catch (DocumentException e) {
            Log.error("Goodjob.getEntryBody DocumentHelper.parseText error : " + e);
        }
        return body;
    }

    public String getItemKeeperJid() {
        return mItemKeeperJid;
    }

    public void setItemKeeperJid(String itemKeeperJid) {
        mItemKeeperJid = itemKeeperJid;
    }

    public String getGjJid() {
        return mGjJid;
    }

    public void setGjJid(String gjJid) {
        mGjJid = gjJid;
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
