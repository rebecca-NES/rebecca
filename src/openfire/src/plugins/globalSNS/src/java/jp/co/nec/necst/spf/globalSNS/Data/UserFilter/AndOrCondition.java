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

import java.util.ArrayList;
import java.util.List;

import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class AndOrCondition extends UserFilterCondition {
    private static final Logger Log = LoggerFactory
            .getLogger(AndOrCondition.class);

    protected List<UserFilterCondition> mConditionList = null;

    public AndOrCondition() {
        mConditionList = new ArrayList<UserFilterCondition>();
    }

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
            UserFilterCondition condition = mConditionList.get(i);
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

    protected boolean createChildDataElement(Element element) {
        if (element == null) {
            Log.error("AndOrCondition#createChildDataElement::element is null");
            return false;
        }
        List<?> conditionList = element.elements();
        int count = conditionList.size();
        if (count < 2) {
            Log.error("AndOrCondition#createChildDataElement::children count is 0 or 1");
            return false;
        }
        mConditionList = new ArrayList<UserFilterCondition>();
        for (int i = 0; i < count; i++) {
            Object childElement = conditionList.get(i);
            if (!(childElement instanceof Element)) {
                Log.error("AndOrCondition#createChildDataElement::child element is not Element Object");
                return false;
            }
            UserFilterCondition childCondition = UserFilter
                    .createConditionFromConditionElement((Element) childElement);
            if (childCondition == null) {
                Log.error("AndOrCondition#createChildDataElement::children condition is null");
                return false;
            }
            mConditionList.add(childCondition);
        }
        return true;
    }

    public boolean addChildCondition(UserFilterCondition childCondition) {
        if(childCondition == null) {
            Log.error("AndOrCondition#addChildCondition::childCondition is null");
            return false;
        }
        mConditionList.add(childCondition);
        return true;
    }
}
