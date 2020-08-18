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

package jp.co.nec.necst.spf.globalSNS.Data;

import java.util.ArrayList;
import java.util.List;

public class TaskSearchSortCondition {
    public static final String SORT_ORDER_TYPE_ASC_STR = "1";
    public static final String SORT_ORDER_TYPE_DESC_STR = "2";
    private List<String> mItems;
    private List<String> mOrders;

    public TaskSearchSortCondition() {
        mItems = new ArrayList<String>();
        mOrders = new ArrayList<String>();
    }

    public List<String> getItems() {
        return mItems;
    }

    public void setItems(List<String> items) {
        mItems = items;
    }

    public List<String> getOrders() {
        return mOrders;
    }

    public void setOrders(List<String> orders) {
        mOrders = orders;
    }
}
