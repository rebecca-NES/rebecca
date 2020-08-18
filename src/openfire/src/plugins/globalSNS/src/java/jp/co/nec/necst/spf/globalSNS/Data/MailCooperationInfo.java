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

public class MailCooperationInfo {
    private int mId;
    private int mServerId;
    private String mJid;
    private int mBranchNumber;
    private String mMailAddress;
    private String mSettingInfo;
    private int mDeleteFlag;
    private int mMailCooperationType;
    
    public final static int DELETE_FLG_FALSE = 0;
    public final static int DELETE_FLG_TRUE = 1;

    public final static int MAIL_COOPERATION_TYPE_NON = 0;
    public final static int MAIL_COOPERATION_TYPE_SMAP = 1;
    public final static int MAIL_COOPERATION_TYPE_POP = 2;
    public final static int MAIL_COOPERATION_TYPE_IMAP = 3;
    public final static int MAIL_COOPERATION_TYPE_SMAP_POP = 4;
    
    public MailCooperationInfo() {
        mId = 0;
        mServerId = 1;
        mBranchNumber = 1;
        mJid = "";
        mMailAddress = "";
        mSettingInfo = "";
        mDeleteFlag = 0;
        mMailCooperationType = 0;
    }

    public int getId() {
        return mId;
    }

    public void setId(int id) {
        mId = id;
    }

    public int getServerId() {
        return mServerId;
    }

    public void setServerId(int serverId) {
        mServerId = serverId;
    }

    public String getJid() {
        return mJid;
    }

    public void setJid(String jid) {
        mJid = jid;
    }

    public int getBranchNumber() {
        return mBranchNumber;
    }

    public void setBranchNumber(int branchNumber) {
        mBranchNumber = branchNumber;
    }

    public String getMailAddress() {
        return mMailAddress;
    }

    public void setMailAddress(String mailAddress) {
        mMailAddress = mailAddress;
    }

    public String getSettingInfo() {
        return mSettingInfo;
    }

    public void setSettingInfo(String settingInfo) {
        mSettingInfo = settingInfo;
    }

    public int getDeleteFlag() {
        return mDeleteFlag;
    }

    public void setDeleteFlag(int deleteFlag) {
        mDeleteFlag = deleteFlag;
    }

    public int getMailCooperationType() {
        return mMailCooperationType;
    }

    public void setMailCooperationType(int mailCooperationType) {
        mMailCooperationType = mailCooperationType;
    }


}
