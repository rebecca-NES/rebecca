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
import java.util.ArrayList;
import java.util.List;

public class QuestionnaireSearchFilter {
    private String mFromJid;
    private List<String> mGroup;
    private List<String> mStatus;
    private Timestamp mStartDate;
    private Timestamp mEndDate;
    private boolean mWithOutFeedFilter;

    public QuestionnaireSearchFilter() {
        mFromJid = "";
        mGroup = new ArrayList<String>();
        mStatus = new ArrayList<String>();
        mStartDate = null;
        mEndDate = null;
        mWithOutFeedFilter = false;
    }

    public String getFromJid() {
        return mFromJid;
    }

    public void setFromJid(String fromJid) {
        mFromJid = fromJid;
    }

    public List<String> getGroup() {
        return mGroup;
    }

    public void setGroup(List<String> group) {
        mGroup = group;
    }

    public List<String> getStatus() {
        return mStatus;
    }

    public void setStatus(List<String> status) {
        mStatus = status;
    }

    public Timestamp getStartDate() {
        return mStartDate;
    }

    public void setStartDate(Timestamp startDate) {
        mStartDate = startDate;
    }

    public Timestamp getEndDate() {
        return mEndDate;
    }

    public void setEndDate(Timestamp endDate) {
        mEndDate = endDate;
    }

    public boolean getWithOutFeedFilter() {
        return mWithOutFeedFilter;
    }

    public void setWithOutFeedFilter(boolean filter) {
        mWithOutFeedFilter = filter;
    }
}
