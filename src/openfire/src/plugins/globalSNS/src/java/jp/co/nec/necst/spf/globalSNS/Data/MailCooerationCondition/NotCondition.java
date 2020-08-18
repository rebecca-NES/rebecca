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

import org.jivesoftware.util.Log;

public class NotCondition extends FilterCondition {

    private FilterCondition mChildCondition = null;

    @SuppressWarnings("deprecation")
    @Override
    public String toSqlWhereSectionString() {
        String ret = "";
        if (mChildCondition == null) {
            Log.error("NotCondition#toSqlWhereSectionString::mChildCondition is null");
            return ret;
        }
        String childConditionSqlWhereSectionString = mChildCondition
                .toSqlWhereSectionString();
        if (childConditionSqlWhereSectionString == null
                || childConditionSqlWhereSectionString.equals("")) {
            Log.error("NotCondition#toSqlWhereSectionString::childConditionSqlWhereSectionString is invalid");
            return ret;
        }
        ret = "(NOT " + childConditionSqlWhereSectionString + ")";
        return ret;
    }

    @SuppressWarnings("deprecation")
    public boolean setChildCondition(FilterCondition childCondition) {
        if(childCondition == null) {
            Log.error("NotCondition#setChildCondition::childCondition is null");
            return false;
        }
        mChildCondition = childCondition;
        return true;
    }

}
