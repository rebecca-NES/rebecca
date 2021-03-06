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

public class CommunityMember {
    public static final int STATE_NOT_JOIN = 0;
    public static final int STATE_JOIN = 1;
    public static final int STATE_INVITING = 2;
    public static final int STATE_WAITING_ACCEPTE = 3;
    public static final int STATE_LEAVE = 4;
    public static final int STATE_FORCE_LEAVE = 5;

    public static final int ROLE_TYPE_NOT_JOIN = 0;
    public static final int ROLE_TYPE_GENERAL = 1;
    public static final int ROLE_TYPE_OWNER = 2;

    private BigInteger mId;
    private String mRoomId;
    private String mJid;
    private int mState;
    private int mRole;
    private Timestamp mJoinDate;
    private Timestamp mLeaveDate;

    public CommunityMember() {
        mId = BigInteger.ZERO;
        mRoomId = "";
        mJid = "";
        mState = STATE_NOT_JOIN;
        mRole = ROLE_TYPE_NOT_JOIN;
        mJoinDate = null;
        mLeaveDate = null;
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

    public String getJid() {
        return mJid;
    }

    public void setJid(String jid) {
        mJid = jid;
    }

    public int getState() {
        return mState;
    }

    public void setState(int state) {
        mState = state;
    }

    public int getRole() {
        return mRole;
    }

    public void setRole(int role) {
        mRole = role;
    }

    public Timestamp getJoinDate() {
        return mJoinDate;
    }

    public String getJoinDateStr() {
        if (mJoinDate == null) {
            return "";
        }
        long joinTime = mJoinDate.getTime();
        java.util.Date date = new java.util.Date(joinTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setJoinDate(Timestamp joinDate) {
        mJoinDate = joinDate;
    }

    public Timestamp getLeaveDate() {
        return mLeaveDate;
    }

    public String getLeaveDateStr() {
        if (mLeaveDate == null) {
            return "";
        }
        long leaveTime = mLeaveDate.getTime();
        java.util.Date date = new java.util.Date(leaveTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setLeaveDate(Timestamp leaveDate) {
        mLeaveDate = leaveDate;
    }
}
