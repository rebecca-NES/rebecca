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

import java.util.ArrayList;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class SortCondition {

    public static final int SORT_ORDER_ASC = 1;
    public static final int SORT_ORDER_DESC = 2;
    protected List<String> mItems;
    protected List<Integer> mOrders;

    protected SortCondition() {
        mItems = new ArrayList<String>();
        mOrders = new ArrayList<Integer>();
    }

    public String toSqlOrderBySectionString() {
        String orderBy = "";
        Boolean isFirst = true;
        int size = mItems.size();
        for (int i = 0; i < size; i++) {
            String item = mItems.get(i);
            int order = mOrders.get(i).intValue();
            if (isFirst) {
                isFirst = false;
            } else {
                orderBy += ", ";
            }
            orderBy += item + " ";
            if (order == SORT_ORDER_DESC) {
                orderBy += "DESC";
            } else {
                orderBy += "ASC";
            }
        }
        return orderBy;
    }

    @SuppressWarnings("deprecation")
    protected boolean setDataFromElement(Element element) {
        if (element == null) {
            Log.error("MessageSortCondition#setDataFromElement::element is null");
            return false;
        }

        Element itemElement = element.element("item");
        Element orderElement = element.element("order");
        if (itemElement == null) {
            Log.error("MessageSortCondition#setDataFromElement::itemElement is null");
            return false;
        }
        String itemString = itemElement.getStringValue();
        GlobalSNSUtils.splitStringToArray(itemString, mItems);
        if (orderElement != null) {
            String orderString = orderElement.getStringValue();
            List<String> ordersStringList = new ArrayList<String>();
            GlobalSNSUtils.splitStringToArray(orderString, ordersStringList);
            int count = ordersStringList.size();
            mOrders.clear();
            for (int i = 0; i < count; i++) {
                try {
                    mOrders.add(new Integer(Integer.parseInt(ordersStringList
                            .get(i))));
                } catch (NumberFormatException e) {
                    mOrders.add(new Integer(SORT_ORDER_ASC));
                }
            }
        }
        int itemSize = mItems.size();
        int orderSize = mOrders.size();
        if (itemSize > orderSize) {
            for (int i = orderSize - 1; i < itemSize; i++) {
                mOrders.add(new Integer(SORT_ORDER_ASC));
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    public boolean setData(List<String> sortItems, List<Integer> sortOrders) {
        boolean ret = false;
        if (sortItems == null) {
            Log.error("MessageSortCondition#setData::sortItems is null");
            return false;
        }
        if (sortOrders == null) {
            Log.error("MessageSortCondition#setData::sortOrders is null");
            return false;
        }
        int count = sortItems.size();
        int sortCount = sortOrders.size();
        mItems.clear();
        mOrders.clear();
        for (int i = 0; i < count; i++) {
            String sortItem = sortItems.get(i);
            if (sortItem == null || sortItem.equals("")) {
                Log.error("MessageSortCondition#setData::sortItem is null. No."
                        + String.valueOf(i));
                return ret;
            }
            mItems.add(sortItem);
            if (i < sortCount && sortOrders.get(i) != null) {
                mOrders.add(sortOrders.get(i));
            } else {
                mOrders.add(new Integer(SORT_ORDER_ASC));
            }
        }
        ret = true;
        return ret;
    }
}
