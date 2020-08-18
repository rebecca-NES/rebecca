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

public class MailServerInfo {
    private BigInteger mId;
    private String mDisplayName;
    private int mServerType;
    private Timestamp mCreatedAt;
    private String mCreatedBy;
    private Timestamp mUpdatedAt;
    private String mUpdatedBy;
    private int mDeleteFlag;
    private Timestamp mDeletedAt;
    private String mDeletedBy;
    private String mPopHost;
    private int mPopPort;
    private int mPopAuthMode;
    private int mPopResonseTimeout;

    public static final int SERVER_TYPE_UNKNOWN = 0;
    public static final int SERVER_TYPE_SMTP = 1;
    public static final int SERVER_TYPE_POP = 2;
    public static final int SERVER_TYPE_IMAP = 3;
    public static final int SERVER_TYPE_SMTP_PLUS_POP = 4;

    public static final int DELETE_FLAG_NONE = 0;
    public static final int DELETE_FLAG_DELETE = 1;

    public static final int POP_AUTH_MODE_UNKNOWN = 0;
    public static final int POP_AUTH_MODE_POP3 = 1;
    public static final int POP_AUTH_MODE_APOP = 2;

    public MailServerInfo() {
        mId = BigInteger.ZERO;
        mDisplayName = "";
        mServerType = SERVER_TYPE_UNKNOWN;
        mCreatedAt = null;
        mCreatedBy = "";
        mUpdatedAt = null;
        mUpdatedBy = "";
        mDeleteFlag = DELETE_FLAG_NONE;
        mDeletedAt = null;
        mDeletedBy = "";
        mPopHost = "";
        mPopPort = 0;
        mPopAuthMode = POP_AUTH_MODE_UNKNOWN;
        mPopResonseTimeout = 0;
    }

    public BigInteger getId() {
        return mId;
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public String getDisplayName() {
        return mDisplayName;
    }

    public void setDisplayName(String displayName) {
        mDisplayName = displayName;
    }

    public int getServerType() {
        return mServerType;
    }

    public void setServerType(int serverType) {
        mServerType = serverType;
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

    public String getPopHost() {
        return mPopHost;
    }

    public void setPopHost(String popHost) {
        mPopHost = popHost;
    }

    public int getPopPort() {
        return mPopPort;
    }

    public void setPopPort(int popPort) {
        mPopPort = popPort;
    }

    public int getPopAuthMode() {
        return mPopAuthMode;
    }

    public void setPopAuthMode(int popAuthMode) {
        mPopAuthMode = popAuthMode;
    }

    public int getPopResonseTimeout() {
        return mPopResonseTimeout;
    }

    public void setPopResonseTimeout(int popResonseTimeout) {
        mPopResonseTimeout = popResonseTimeout;
    }

}
