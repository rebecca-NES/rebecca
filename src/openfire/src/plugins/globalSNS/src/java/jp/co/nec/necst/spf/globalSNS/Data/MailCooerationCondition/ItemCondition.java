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


import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

import org.jivesoftware.util.Log;

public class ItemCondition extends FilterCondition {

    public enum ValueType {
        NUMBER, STRING,
    };

    private String mName = null;
    private ValueType mType = null;
    private String mValue = null;

    @SuppressWarnings("deprecation")
    @Override
    public String toSqlWhereSectionString() {
        String ret = "";
        if (mName == null || mType == null || mValue == null) {
            Log.error("ItemCondition#toSqlWhereSectionString::data is invalid");
            return ret;
        }
        switch (mType) {
        case NUMBER:
            ret = "(" + mName + "=" + GlobalSNSUtils.escapeSqlData(mValue)
                    + ")";
            break;
        case STRING:
            ret = "(" + mName + "='" + GlobalSNSUtils.escapeSqlData(mValue)
                    + "')";
            break;
        default:
            Log.error("ItemCondition#toSqlWhereSectionString::type is invalid");
            break;
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public boolean setData(String conditionName, ValueType conditionType, String conditionValue) {
        if(conditionName == null || conditionType == null || conditionValue == null) {
            Log.error("ItemCondition#setData::Args is invalid");
            return false;
        }
        if(conditionName.equals("")) {
            Log.error("ItemCondition#setData::condition name is invalid");
            return false;
        }
        mName = conditionName;
        mType = conditionType;
        mValue = conditionValue;
        return true;
    }

}
