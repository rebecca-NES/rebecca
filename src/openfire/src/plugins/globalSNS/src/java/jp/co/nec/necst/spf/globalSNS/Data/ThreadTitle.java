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

public class ThreadTitle {
    private String mType;
    private BigInteger mId;
    private String mThreadRootId;
    private String mThreadTitle;
    private String mEditerJID;
    private String mFromItemId;

    public ThreadTitle() {
        mType = "";
        mThreadRootId = "";
        mThreadTitle = "";
        mEditerJID = "";
        mFromItemId = "";
    }

    public ThreadTitle(ThreadTitle src) {
        mType = src.getType();
        mThreadRootId = src.getThreadRootId();
        mThreadTitle = src.getThreadTitle();
        mEditerJID = src.getEditerJID();
        mFromItemId = src.getFromItemId();
    }

    public String getType() {
        return mType;
    }

    public void setType(String type) {
        mType = type;
    }

    public String getThreadRootId() {
        return mThreadRootId;
    }

    public void setThreadRootId(String threadRootId) {
        mThreadRootId = threadRootId;
    }

    public String getThreadTitle() {
        return mThreadTitle;
    }

    public void setThreadTitle(String threadTitle) {
        mThreadTitle = threadTitle;
    }

    public String getEditerJID() {
        return mEditerJID;
    }

    public void setEditerJID(String editerJID) {
        mEditerJID = editerJID;
    }

    public String getFromItemId() {
        return mFromItemId;
    }

    public void setFromItemId(String fromItemId) {
        mFromItemId = fromItemId;
    }
}
