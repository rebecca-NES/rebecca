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


public class UserAccountInfo {
    private String mLoginAccount;
    private String mOpenfireAccount;
    private String mXmppServerName;
    private String mEmail;
    private Timestamp mDate;
    private int mDeleteFlg;

    public static final int DELETE_FLAG_STATUS_NOMAL = 0;
    public static final int DELETE_FLAG_STATUS_DELETED = 1;
    public static final int DELETE_FLAG_STATUS_SUSPEND = 2;


    public UserAccountInfo() {
        mLoginAccount = "";
        mOpenfireAccount = "";
        mXmppServerName = "";
        mEmail = "";
        Calendar now = Calendar.getInstance();
        mDate = new Timestamp(now.getTimeInMillis());
        mDeleteFlg = DELETE_FLAG_STATUS_NOMAL;
    }

    public String getLoginAccount() {
        return mLoginAccount;
    }

    public void setLoginAccount(String loginAccount) {
        this.mLoginAccount = loginAccount;
    }

    public String getOpenfireAccount() {
        return mOpenfireAccount;
    }

    public void setOpenfireAccount(String openfireAccount) {
        this.mOpenfireAccount = openfireAccount;
    }

    public String getXmppServerName() {
        return mXmppServerName;
    }

    public void setXmppServerName(String xmppServerName) {
        this.mXmppServerName = xmppServerName;
    }
    public String getEmail() {
        return mEmail;
    }
    public void setEmail(String email) {
        this.mEmail = email;
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

    public int getDeleteFlg() {
        return mDeleteFlg;
    }

    public void setDeleteFlg(int deleteFlg) {
        this.mDeleteFlg = deleteFlg;
    }
}
