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

public class ItemCondition extends MessageFilterCondition {
    public static final String ELEMENT_NAME = "item";

    static final protected String CONDITION_NAME_ATTR = "name";
    static final protected String CONDITION_TYPE_ATTR = "type";

    static final protected String CONDITION_TYPE_ATTR_VALUE_NUMBER = "number";
    static final protected String CONDITION_TYPE_ATTR_VALUE_STRING = "string";

    public enum ValueType {
        NUMBER, STRING,
    };

    protected String mName = null;
    protected ValueType mType = null;
    protected String mValue = null;

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
    @Override
    public boolean setDataFromElement(Element element) {
        if (element == null) {
            Log.error("ItemCondition#setDataFromElement::element is null");
            return false;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("ItemCondition#setDataFromElement::tag name is null");
            return false;
        }
        if (!(tagName.toLowerCase().equals(ELEMENT_NAME))) {
            Log.error("ItemCondition#setDataFromElement::tag name is different");
            return false;
        }
        List<?> childElems = element.elements();
        if (childElems != null && childElems.size() > 0) {
            Log.error("ItemCondition#setDataFromElement::this elem has children - "
                    + String.valueOf(childElems.size()));
            return false;
        }
        String conditionName = element.attributeValue(CONDITION_NAME_ATTR);
        if (conditionName == null || conditionName.equals("")) {
            Log.error("ItemCondition#setDataFromElement::condition name is invalid");
            return false;
        }
        String conditionType = element.attributeValue(CONDITION_TYPE_ATTR);
        if (conditionType == null) {
            Log.error("ItemCondition#setDataFromElement::condition type is null");
            return false;
        }
        String conditionValue = element.getStringValue();
        if (conditionValue == null) {
            Log.error("ItemCondition#setDataFromElement::condition value is null");
            return false;
        }
        if (conditionType.equals(CONDITION_TYPE_ATTR_VALUE_NUMBER)) {
            mType = ValueType.NUMBER;
        } else if (conditionType.equals(CONDITION_TYPE_ATTR_VALUE_STRING)) {
            mType = ValueType.STRING;
        } else {
            Log.error("ItemCondition#setDataFromElement::condition type is unknown");
            return false;
        }
        mName = MessageStoreDbHelper.TABLE_NAME + "." + conditionName;
        mValue = conditionValue;
        return true;
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

        mName = MessageStoreDbHelper.TABLE_NAME + "." + conditionName;
        mType = conditionType;
        mValue = conditionValue;
        return true;
    }

    @SuppressWarnings("deprecation")
    public boolean setDataPublicmessageQuestionnaireStore(String conditionName, ValueType conditionType, String conditionValue) {
        if(conditionName == null || conditionType == null || conditionValue == null) {
            Log.error("ItemCondition#setData::Args is invalid");
            return false;
        }
        if(conditionName.equals("")) {
            Log.error("ItemCondition#setData::condition name is invalid");
            return false;
        }

        mName = "publicmessage_questionnaire_store." + conditionName;
        mType = conditionType;
        mValue = conditionValue;
        return true;
    }

}
