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

package jp.co.nec.necst.spf.globalSNS.Data.SortCondition;

import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PersonSortCondition extends SortCondition {
    private static final Logger Log = LoggerFactory
            .getLogger(PersonSortCondition.class);

    private PersonSortCondition() {
        super();
    }

    static public PersonSortCondition createSortConditionFromSortElement(
            Element element) {
        if (element == null) {
            Log.error("PersonSortCondition#createSortConditionFromFilterElement::element is null");
            return null;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("PersonSortCondition#createSortConditionFromFilterElement::tag name is null");
            return null;
        }
        if (!(tagName.toLowerCase().equals("sort"))) {
            Log.error("PersonSortCondition#createSortConditionFromFilterElement::tag name is different");
            return null;
        }
        PersonSortCondition sortCondition = new PersonSortCondition();
        if (!(sortCondition.setDataFromElement(element))) {
            Log.error("PersonSortCondition#createSortConditionFromFilterElement::setDataFromElement is false");
            return null;
        }
        return sortCondition;
    }

}
