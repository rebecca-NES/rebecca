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

package jp.co.nec.necst.spf.globalSNS.Data.MessageFilter;

import java.util.List;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class GreaterThanCondition extends ItemCondition {
    public static final String ELEMENT_NAME = "greaterthan";

    @SuppressWarnings("deprecation")
    @Override
    public String toSqlWhereSectionString() {
        String ret = "";
        if (mName == null || mType == null || mValue == null) {
            Log.error("GreaterThanCondition#toSqlWhereSectionString::data is invalid");
            return ret;
        }
        switch (mType) {
        case NUMBER:
            ret = "(" + mName + ">" + GlobalSNSUtils.escapeSqlData(mValue)
                    + ")";
            break;
        case STRING:
            ret = "(" + mName + ">'" + GlobalSNSUtils.escapeSqlData(mValue)
                    + "')";
            break;
        default:
            Log.error("GreaterThanCondition#toSqlWhereSectionString::type is invalid");
            break;
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    @Override
    public boolean setDataFromElement(Element element) {
        if (element == null) {
            Log.error("GreaterThanCondition#setDataFromElement::element is null");
            return false;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("GreaterThanCondition#setDataFromElement::tag name is null");
            return false;
        }
        if (!(tagName.toLowerCase().equals(ELEMENT_NAME))) {
            Log.error("GreaterThanCondition#setDataFromElement::tag name is different");
            return false;
        }
        List<?> childElems = element.elements();
        if (childElems != null && childElems.size() > 0) {
            Log.error("GreaterThanCondition#setDataFromElement::this elem has children - "
                    + String.valueOf(childElems.size()));
            return false;
        }
        String conditionName = element.attributeValue(CONDITION_NAME_ATTR);
        if (conditionName == null || conditionName.equals("")) {
            Log.error("GreaterThanCondition#setDataFromElement::condition name is invalid");
            return false;
        }
        String conditionType = element.attributeValue(CONDITION_TYPE_ATTR);
        if (conditionType == null) {
            Log.error("GreaterThanCondition#setDataFromElement::condition type is null");
            return false;
        }
        String conditionValue = element.getStringValue();
        if (conditionValue == null) {
            Log.error("GreaterThanCondition#setDataFromElement::condition value is null");
            return false;
        }
        if (conditionType.equals(CONDITION_TYPE_ATTR_VALUE_NUMBER)) {
            mType = ValueType.NUMBER;
        } else if (conditionType.equals(CONDITION_TYPE_ATTR_VALUE_STRING)) {
            mType = ValueType.STRING;
        } else {
            Log.error("GreaterThanCondition#setDataFromElement::condition type is unknown");
            return false;
        }
        mName = MessageStoreDbHelper.TABLE_NAME + "." + conditionName;
        mValue = conditionValue;
        return true;
    }
}
