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

public class FollowInfo {
    private int mId;
    private String mJid;
    private String mFollowJid;
    private int mStatus;
    private Timestamp mDate;
    
    public static final int STATUS_UNFOLLOW = 0;
    public static final int STATUS_FOLLOW = 1;
    public static final int STATUS_BLOCK = 2;
    
    public FollowInfo() {
        mId = 0;
        mJid = "";
        mFollowJid = "";
        mStatus = STATUS_UNFOLLOW;
        Calendar now = Calendar.getInstance();
        mDate = new Timestamp(now.getTimeInMillis());
    }
    
    public FollowInfo(FollowInfo followInfo) {
        mId = followInfo.getId();
        mJid = followInfo.getJid();
        mFollowJid = followInfo.getFollowJid();
        mStatus = followInfo.getStatus();
        mDate = followInfo.getDate();
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
    public String getFollowJid() {
        return mFollowJid;
    }
    public void setFollowJid(String followJid) {
        mFollowJid = followJid;
    }
    public int getStatus() {
        return mStatus;
    }
    public void setStatus(int status) {
        mStatus = status;
    }
    public Timestamp getDate() {
        return mDate;
    }
    public String getDateStr() {
        if (mDate == null) {
            return "";
        }
        long updatedDate = mDate.getTime();
        java.util.Date date = new java.util.Date(updatedDate);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }
    public void setDate(Timestamp date) {
        mDate = date;
    }
}
