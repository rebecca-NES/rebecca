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

import java.util.List;

import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NotCondition extends UserFilterCondition {
    private static final Logger Log = LoggerFactory
            .getLogger(NotCondition.class);

    public static final String ELEMENT_NAME = "not";

    private UserFilterCondition mChildCondition = null;

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

    @Override
    public boolean setDataFromElement(Element element) {
        if (element == null) {
            Log.error("NotCondition#setDataFromElement::element is null");
            return false;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("NotCondition#setDataFromElement::tag name is null");
            return false;
        }
        if (!(tagName.toLowerCase().equals(ELEMENT_NAME))) {
            Log.error("NotCondition#setDataFromElement::tag name is different");
            return false;
        }
        List<?> conditionList = element.elements();
        if (conditionList == null || conditionList.size() != 1) {
            Log.error("NotCondition#setDataFromElement::child elem count is not one");
            return false;
        }
        Object childElement = conditionList.get(0);
        if (!(childElement instanceof Element)) {
            Log.error("NotCondition#setDataFromElement::child element is not Element Object");
            return false;
        }
        mChildCondition = UserFilter
                .createConditionFromConditionElement((Element) childElement);
        if (mChildCondition == null) {
            Log.error("NotCondition#setDataFromElement::child condition is null");
            return false;
        }
        return true;
    }

    public boolean setChildCondition(UserFilterCondition childCondition) {
        if(childCondition == null) {
            Log.error("NotCondition#setChildCondition::childCondition is null");
            return false;
        }
        mChildCondition = childCondition;
        return true;
    }

}
