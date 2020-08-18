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

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class OrCondition extends AndOrCondition {
    public static final String ELEMENT_NAME = "or";

    @Override
    public String toSqlWhereSectionString() {
        return toSqlWhereSectionString("OR");
    }

    @SuppressWarnings("deprecation")
    @Override
    public boolean setDataFromElement(Element element) {
        if (element == null) {
            Log.error("OrCondition#setDataFromElement::element is null");
            return false;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("OrCondition#setDataFromElement::tag name is null");
            return false;
        }
        if (!(tagName.toLowerCase().equals(ELEMENT_NAME))) {
            Log.error("OrCondition#setDataFromElement::tag name is different");
            return false;
        }
        return createChildDataElement(element);
    }
}
