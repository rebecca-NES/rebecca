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

public class UserFilter {
    private static final Logger Log = LoggerFactory
            .getLogger(UserFilter.class);

    private UserFilter() {
    }

    static public UserFilterCondition createFilterConditionFromFilterElement(
            Element element) {
        UserFilterCondition ret = null;
        String logPrefix = "UserFilter#createFilterConditionFromFilterElement::";
        if (element == null) {
            Log.error(logPrefix + "element is null");
            return ret;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error(logPrefix + "tag name is null");
            return ret;
        }
        if (!(tagName.toLowerCase().equals("filter"))) {
            Log.error(logPrefix + "tag name is different");
            return ret;
        }
        List<?> conditionList = element.elements();
        if (conditionList == null || conditionList.size() != 1) {
            Log.error(logPrefix + "child elem count is not one");
            return ret;
        }
        Object childElement = conditionList.get(0);
        if (!(childElement instanceof Element)) {
            Log.error(logPrefix + "child element is not Element Object");
            return ret;
        }
        return createConditionFromConditionElement((Element) childElement);
    }

    static public UserFilterCondition createConditionFromConditionElement(
            Element element) {
        String logPrefix = "UserFilter#createFilterConditionFromFilterElement::";
        if (element == null) {
            Log.error(logPrefix + "element is null");
            return null;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error(logPrefix + "tag name is null");
            return null;
        }
        UserFilterCondition condition = null;
        if (tagName.toLowerCase().equals(AndCondition.ELEMENT_NAME)) {
            condition = new AndCondition();
        } else if (tagName.toLowerCase().equals(OrCondition.ELEMENT_NAME)) {
            condition = new OrCondition();
        } else if (tagName.toLowerCase().equals(NotCondition.ELEMENT_NAME)) {
            condition = new NotCondition();
        } else if (tagName.toLowerCase().equals(KeywordCondition.ELEMENT_NAME)) {
            condition = new KeywordCondition();
        } else if (tagName.toLowerCase().equals(ItemCondition.ELEMENT_NAME)) {
            condition = new ItemCondition();
        } else {
            Log.error(logPrefix + "tag name is unknown");
            return null;
        }
        if (!condition.setDataFromElement(element)) {
            Log.error(logPrefix + "failed to set element");
            return null;
        }
        return condition;
    }
}
