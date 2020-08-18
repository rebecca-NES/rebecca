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

import java.util.List;

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class MessageSortCondition extends SortCondition{

    public MessageSortCondition() {
        super();
    }

    @SuppressWarnings("deprecation")
    public static MessageSortCondition createSortConditionFromSortElement(
            Element element) {
        if (element == null) {
            Log.error("MessageSortCondition#createSortConditionFromFilterElement::element is null");
            return null;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("MessageSortCondition#createSortConditionFromFilterElement::tag name is null");
            return null;
        }
        if (!(tagName.toLowerCase().equals("sort"))) {
            Log.error("MessageSortCondition#createSortConditionFromFilterElement::tag name is different");
            return null;
        }
        MessageSortCondition sortCondition = new MessageSortCondition();
        if (!(sortCondition.setDataFromElement(element))) {
            Log.error("MessageSortCondition#createSortConditionFromFilterElement::setDataFromElement is false");
            return null;
        }
        return sortCondition;
    }

    @Override
    protected boolean setDataFromElement(Element element) {
        super.setDataFromElement(element);
        resetSortItems();
        return true;
    }

    @Override
    public boolean setData(List<String> sortItems, List<Integer> sortOrders) {
        super.setData(sortItems, sortOrders);
        resetSortItems();
        return true;
    }

    private void resetSortItems(){
        int count = mItems.size();
        for(int i = 0; i < count; i++){
            String item = mItems.get(i);
            mItems.set(i, MessageStoreDbHelper.TABLE_NAME + "." + item);
        }
    }
}
