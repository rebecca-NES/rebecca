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

package jp.co.nec.necst.spf.globalSNS.Data.UserFilter;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAccountStroreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;

import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class KeywordCondition extends UserFilterCondition {
    public static final String ELEMENT_NAME = "keyword";
    private static final String CONDITION_INCLUDE_ATTR = "include";

    private String mValue = null;
    private Set<String> mIncludeSet = null;

    private static final Logger Log = LoggerFactory
            .getLogger(KeywordCondition.class);

    @Override
    public String toSqlWhereSectionString() {
        String ret = "";
        if (mValue == null) {
            Log.error("KeywordCondition#toSqlWhereSectionString::data is invalid");
            return ret;
        }
        String escapedValueForRegexpPhrase = GlobalSNSUtils
                .escapeSqlDataForRegexpPhrase(mValue);
        ret = "(";
        ret += "(";
        ret += "(" + UserProfileDbHelper.TABLE_NAME + "." + UserProfileDbHelper.COLUMN_NICKNAME_NAME
                + " ~ E'.*" + escapedValueForRegexpPhrase + ".*')";
        ret += " OR ";
        ret += " (" + UserProfileDbHelper.TABLE_NAME + "." + UserProfileDbHelper.COLUMN_AFFILIATION_NAME
                + " ~ E'[^,]*" + escapedValueForRegexpPhrase + "[^,]*')";
        String encodedAtString = null;
        try {
            encodedAtString = URLEncoder.encode("@", "UTF-8");
        } catch (UnsupportedEncodingException e) {
        }
        String vagueAccountString = mValue;
        if (encodedAtString != null) {
            int atIndex = mValue.indexOf(encodedAtString);
            if (atIndex == 0) {
                vagueAccountString = mValue.substring(encodedAtString
                        .length());
            }
        }
        List<String> jidListByFuzzyAccountName = UserAccountStroreDbHelper
                .searchJidListByFuzzyAccountName(vagueAccountString);
        if (jidListByFuzzyAccountName != null
                && !jidListByFuzzyAccountName.isEmpty()) {
            String inOperatorStr = GlobalSNSUtils
                    .convertListToStringforInOperator(jidListByFuzzyAccountName);
            if (inOperatorStr != null && !"".equals(inOperatorStr)) {
                ret += " OR ";
                ret += "("
                        + UserProfileDbHelper.TABLE_NAME + "." + UserProfileDbHelper.COLUMN_JID_NAME
                        + " IN (" + inOperatorStr + "))";
            }
        }
        if (mIncludeSet != null) {
        }
        ret += ")";

        ret += ")";

        return ret;
    }

    @Override
    public boolean setDataFromElement(Element element) {
        if (element == null) {
            Log.error("KeywordCondition#setDataFromElement::element is null");
            return false;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("KeywordCondition#setDataFromElement::tag name is null");
            return false;
        }
        if (!(tagName.toLowerCase().equals(ELEMENT_NAME))) {
            Log.error("KeywordCondition#setDataFromElement::tag name is different");
            return false;
        }
        List<?> childElems = element.elements();
        if (childElems != null && childElems.size() > 0) {
            Log.error("KeywordCondition#setDataFromElement::this elem has children - "
                    + String.valueOf(childElems.size()));
            return false;
        }
        String conditionValue = element.getStringValue();
        if (conditionValue == null) {
            Log.error("KeywordCondition#setDataFromElement::condition value is null");
            return false;
        }
        if (conditionValue.equals("")) {
            Log.error("KeywordCondition#setDataFromElement::condition value is empty");
            return false;
        }
        mValue = conditionValue;
        String conditionInclude = element
                .attributeValue(CONDITION_INCLUDE_ATTR);
        if (conditionInclude != null && !conditionInclude.equals("")) {
            List<String> includeList = new ArrayList<String>();
            GlobalSNSUtils.splitStringToArray(conditionInclude, " ",
                    includeList);
            mIncludeSet = new HashSet<String>();
            mIncludeSet.addAll(includeList);
        }
        return true;
    }

    public boolean setData(String conditionValue, Set<String> includeSet) {
        if (conditionValue == null) {
            Log.error("KeywordCondition#setData::conditionValue is null");
            return false;
        }
        if (conditionValue.equals("")) {
            Log.error("KeywordCondition#setData::conditionValue is empty");
            return false;
        }
        mValue = conditionValue;
        if (includeSet != null) {
            mIncludeSet = includeSet;
        }
        return true;
    }

}
