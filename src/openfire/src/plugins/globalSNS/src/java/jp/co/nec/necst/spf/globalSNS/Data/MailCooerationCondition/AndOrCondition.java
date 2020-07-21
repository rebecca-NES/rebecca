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

package jp.co.nec.necst.spf.globalSNS.Data.MailCooerationCondition;

import java.util.ArrayList;
import java.util.List;

import org.jivesoftware.util.Log;

public abstract class AndOrCondition extends FilterCondition {

    protected List<FilterCondition> mConditionList = null;
    
    public AndOrCondition() {
        mConditionList = new ArrayList<FilterCondition>();
    }

    @SuppressWarnings("deprecation")
    protected String toSqlWhereSectionString(String separater) {
        String ret = "";
        if (mConditionList == null) {
            Log.error("AndOrCondition#toSqlWhereSectionString::mConditionList is null");
            return ret;
        }
        int count = mConditionList.size();
        if (count < 2) {
            Log.error("AndOrCondition#toSqlWhereSectionString::mConditionList count is 0 or 1");
            return ret;
        }
        boolean isFirst = true;
        for (int i = 0; i < count; i++) {
            FilterCondition condition = mConditionList.get(i);
            if (condition == null) {
                continue;
            }
            String childConditionSqlWhereSectionString = condition
                    .toSqlWhereSectionString();
            if (childConditionSqlWhereSectionString == null
                    || childConditionSqlWhereSectionString.equals("")) {
                continue;
            }
            if (isFirst) {
                ret = "(";
                isFirst = false;
            } else {
                ret += " " + separater + " ";
            }
            ret += childConditionSqlWhereSectionString;
        }
        if (!isFirst) {
            ret += ")";
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public boolean addChildCondition(FilterCondition childCondition) {
        if(childCondition == null) {
            Log.error("AndOrCondition#addChildCondition::childCondition is null");
            return false;
        }
        mConditionList.add(childCondition);
        return true;
    }
}
