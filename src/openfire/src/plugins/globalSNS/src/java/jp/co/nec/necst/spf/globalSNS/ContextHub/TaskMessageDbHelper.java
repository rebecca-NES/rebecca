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

package jp.co.nec.necst.spf.globalSNS.ContextHub;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.TaskSearchFilter;
import jp.co.nec.necst.spf.globalSNS.Data.TaskSearchSortCondition;

import org.jivesoftware.util.Log;
import org.xmpp.packet.JID;

public class TaskMessageDbHelper extends MessageStoreDbHelper {
    @SuppressWarnings("deprecation")
    public static int getCreateCount(JID fromJid) {
        int ret = 0;
        String sql = "SELECT COUNT(1) AS msgfrom_count FROM " + TABLE_NAME
                + " WHERE " + COLUMN_MESSAGE_FROM_NAME + "='"
                + fromJid.toBareJID() + "' AND " + COLUMN_MESSAGE_TYEP_NAME
                + "=4";

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    ret = resultSet.getInt("msgfrom_count");
                }
            } catch (SQLException e) {
                Log.error("Failed to get task count : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static List<Message> getTaskListDbData(int baseId, int countNum,
            TaskSearchFilter filter, TaskSearchSortCondition sortCondition) {

        String where = getWhereSqlString(baseId, filter);
        String orderBy = getOrderBySqlString(sortCondition);
        String getRownumSqlString = "";
        if (baseId > 0) {
            getRownumSqlString = "SELECT * FROM (SELECT *, row_number() OVER () as rownum FROM (SELECT * FROM "
                    + TABLE_NAME;
            if (!where.equals("")) {
                getRownumSqlString += " WHERE " + where;
            }
            if (!orderBy.equals("")) {
                getRownumSqlString += " ORDER BY " + orderBy;
            }
            getRownumSqlString += ") as dummy_table) as dummy_table2 WHERE id="
                    + String.valueOf(baseId);
        }
        int offset = -1;
        List<Message> retList = null;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }

            ResultSet resultSet;
            if (baseId > 0) {
                resultSet = dbHelper.executeQuery(getRownumSqlString);
                try {
                    if (resultSet.next()) {
                        offset = resultSet.getInt("rownum");
                    }
                } catch (SQLException e) {
                    Log.error("Failed to get tasklist data1");
                    dbHelper.close();
                    return null;
                }
                if (offset < 0) {
                    Log.error("rownum is invalid");
                    dbHelper.close();
                    return null;
                }
            } else {
                offset = 0;
            }
            String getTaskMessageSqlString = "SELECT * FROM publicmessage_store";
            if (!where.equals("")) {
                getTaskMessageSqlString += " WHERE " + where;
            }
            if (!orderBy.equals("")) {
                getTaskMessageSqlString += " ORDER BY " + orderBy;
            }
            getTaskMessageSqlString += " LIMIT " + String.valueOf(countNum)
                    + " OFFSET " + String.valueOf(offset);
            retList = new ArrayList<Message>();
            resultSet = dbHelper.executeQuery(getTaskMessageSqlString);
            try {
                while (resultSet.next()) {
                    Message message = MessageStoreDbHelper
                            .getOneMessageByResultSet(resultSet, false, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get tasklist data2");
            }

            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private static String getWhereSqlString(int baseId, TaskSearchFilter filter) {
        String where = "";
        boolean isFirst = true;
        if (filter != null) {
            List<String> ownerFilterList = filter.getOwner();
            int ownerFilterSize = ownerFilterList.size();
            boolean isOwnerFirst = true;
            for (int i = 0; i < ownerFilterSize; i++) {
                String ownerFilter = ownerFilterList.get(i);
                if (ownerFilter == null || ownerFilter.equals("")) {
                    continue;
                }
                ownerFilter = GlobalSNSUtils.escapeSqlData(ownerFilter);
                if (isOwnerFirst) {
                    where = "((";
                    isFirst = false;
                    isOwnerFirst = false;
                } else {
                    where += " OR ";
                }
                where += COLUMN_OWNER_NAME + "='" + ownerFilter + "'";
            }
            if (!isOwnerFirst) {
                where += ")";
            }
            List<String> clientFilterList = filter.getClient();
            int clientFilterSize = clientFilterList.size();
            boolean isClientFirst = true;
            for (int i = 0; i < clientFilterSize; i++) {
                String clientFilter = clientFilterList.get(i);
                if (clientFilter == null || clientFilter.equals("")) {
                    continue;
                }
                clientFilter = GlobalSNSUtils.escapeSqlData(clientFilter);
                if (!isOwnerFirst) {
                    if (isClientFirst) {
                        where += " OR (";
                    } else {
                        where += " OR ";
                    }
                } else {
                    where += "((";
                }
                isFirst = false;
                isClientFirst = false;
                where += "(" + COLUMN_CLIENT_NAME + "='" + clientFilter
                        + "' AND " + COLUMN_OWNER_NAME + "<>'" + clientFilter
                        + "')";
            }
            if (!isClientFirst) {
                where += ")";
            }
            if (!isOwnerFirst || !isClientFirst) {
                where += ")";
            }

            List<String> groupFilterList = filter.getGroup();
            int groupFilterSize = groupFilterList.size();
            boolean isGroupFirst = true;
            for (int i = 0; i < groupFilterSize; i++) {
                String groupFilter = groupFilterList.get(i);
                if (groupFilter == null || groupFilter.equals("")) {
                    continue;
                }
                groupFilter = GlobalSNSUtils.escapeSqlData(groupFilter);
                if (isGroupFirst) {
                    if (isFirst) {
                        where = "(";
                        isFirst = false;
                    } else {
                        where += " AND (";
                    }
                    isGroupFirst = false;
                } else {
                    where += " OR ";
                }
                where += COLUMN_GROUP_NAME + "='" + groupFilter + "'";
            }
            if (!isGroupFirst) {
                where += ")";
            }
            List<String> statusFilterList = filter.getStatus();
            int statusFilterSize = statusFilterList.size();
            boolean isStatusFirst = true;
            for (int i = 0; i < statusFilterSize; i++) {
                String statusFilter = statusFilterList.get(i);
                if (statusFilter == null || statusFilter.equals("")) {
                    continue;
                }
                statusFilter = GlobalSNSUtils.escapeSqlData(statusFilter);
                if (isStatusFirst) {
                    if (isFirst) {
                        where = "(";
                        isFirst = false;
                    } else {
                        where += " AND (";
                    }
                    isStatusFirst = false;
                } else {
                    where += " OR ";
                }
                where += COLUMN_STATUS_NAME + "='" + statusFilter + "'";
            }
            if (!isStatusFirst) {
                where += ")";
            }
            Timestamp startDate = filter.getStartDate();
            Timestamp endDate = filter.getStartDate();
            if (startDate != null && endDate != null
                    && startDate.before(endDate)) {
                if (isFirst) {
                    where = "(";
                    isFirst = false;
                } else {
                    where += " AND (";
                }
                where += "(" + COLUMN_START_DATE_NAME + "<'"
                        + startDate.toString() + "' AND "
                        + COLUMN_COMPLETE_DATE_NAME + " is null)";
                where += " OR (" + COLUMN_START_DATE_NAME + ">='"
                        + startDate.toString() + "' AND "
                        + COLUMN_START_DATE_NAME + "<='" + endDate.toString()
                        + "')";
                where += " OR (" + COLUMN_COMPLETE_DATE_NAME + ">='"
                        + startDate.toString() + "' AND "
                        + COLUMN_COMPLETE_DATE_NAME + "<='"
                        + endDate.toString() + "')";
                where += " OR (" + COLUMN_START_DATE_NAME + "<'"
                        + startDate.toString() + "' AND "
                        + COLUMN_COMPLETE_DATE_NAME + ">'" + endDate.toString()
                        + "')";
                where += ")";
            }
            List<String> priorityFilterList = filter.getPriority();
            int priorityFilterSize = priorityFilterList.size();
            boolean isPriorityFirst = true;
            for (int i = 0; i < priorityFilterSize; i++) {
                String priorityFilter = priorityFilterList.get(i);
                if (priorityFilter == null || priorityFilter.equals("")) {
                    continue;
                }
                priorityFilter = GlobalSNSUtils.escapeSqlData(priorityFilter);
                if (isPriorityFirst) {
                    if (isFirst) {
                        where = "(";
                        isFirst = false;
                    } else {
                        where += " AND (";
                    }
                    isPriorityFirst = false;
                } else {
                    where += " OR ";
                }
                where += COLUMN_PRIORITY_NAME + "='" + priorityFilter + "'";
            }
            if (!isPriorityFirst) {
                where += ")";
            }
        }
        if (isFirst) {
            where = "(" + COLUMN_MESSAGE_TYEP_NAME + "=4)";
            isFirst = false;
        } else {
            where += " AND (" + COLUMN_MESSAGE_TYEP_NAME + "=4)";
        }
        if (baseId > 0) {
            where = "( " + where + ") ";
            where += " OR (" + COLUMN_ID_NAME + "='" + String.valueOf(baseId)
                    + "')";
        }
        where = "( " + where + ") ";
        where += " AND ((" + COLUMN_DELETE_FLAG_NAME + "=0)OR("
                + COLUMN_DELETE_FLAG_NAME + "=2))";

        return where;
    }

    private static String getOrderBySqlString(
            TaskSearchSortCondition sortCondition) {
        String orderBy = "";
        if (sortCondition != null) {
            Boolean isFirst = true;
            List<String> itemList = sortCondition.getItems();
            List<String> orderList = sortCondition.getOrders();
            int size = itemList.size();
            for (int i = 0; i < size; i++) {
                String item = itemList.get(i);
                String order = orderList.get(i);
                if (isFirst) {
                    isFirst = false;
                } else {
                    orderBy += ", ";
                }
                orderBy += item + " ";
                if (order
                        .equals(String
                                .valueOf(TaskSearchSortCondition.SORT_ORDER_TYPE_DESC_STR))) {
                    orderBy += "DESC";
                } else {
                    orderBy += "ASC";
                }
            }
        }
        return orderBy;
    }

    @SuppressWarnings("deprecation")
    public static int getUnfinishedTaskCount(TaskSearchFilter filter) {
        int ret = 0;
        String where = getWhereSqlString(0, filter);
        where = "(" + where + ") AND (" + COLUMN_MESSAGE_TYEP_NAME
                + "=4) AND (" + COLUMN_STATUS_NAME + "=1 OR "
                + COLUMN_STATUS_NAME + "=2 OR " + COLUMN_STATUS_NAME + "=3 OR "
                + COLUMN_STATUS_NAME + "=4 OR " + COLUMN_STATUS_NAME + "=5 OR "
                + COLUMN_STATUS_NAME + "=6)";

        String sql = "SELECT COUNT(id) AS unfinished_task_count FROM "
                + TABLE_NAME + " WHERE " + where;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    ret = resultSet.getInt("unfinished_task_count");
                }
            } catch (SQLException e) {
                Log.error("Failed to get task count : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static List<Message> getChildrenTaskList(
            List<String> parentTaskItemIdList) {
        List<Message> retList = new ArrayList<Message>();
        if (parentTaskItemIdList == null) {
            Log.error("TaskMessageDbHelper#getChildrenTaskList - itemIdList is null");
            return retList;
        }
        String sql = getChildrenTaskMessageSelectSqlByParentItemIds(parentTaskItemIdList);
        if (sql == null || sql.equals("")) {
            return retList;
        }
        Log.debug(sql);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    Message message = getOneMessageByResultSet(resultSet, false, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private static String getChildrenTaskMessageSelectSqlByParentItemIds(
            List<String> parentTaskItemIdList) {
        if (parentTaskItemIdList == null) {
            return "";
        }
        int count = parentTaskItemIdList.size();
        if (count <= 0) {
            return "";
        }

        String sql = "";
        boolean isFirst = true;
        String where = "(" + COLUMN_MESSAGE_TYEP_NAME + "=4) AND (";
        for (int i = 0; i < count; i++) {
            String parentItemId = parentTaskItemIdList.get(i);
            if (parentItemId == null) {
                continue;
            }
            parentItemId = parentItemId.trim();
            if (parentItemId.equals("")) {
                continue;
            }
            if (!isFirst) {
                where += " OR ";
            } else {
                isFirst = false;
            }
            where += "(" + COLUMN_PARENT_ITEM_ID_NAME + "='"
                    + GlobalSNSUtils.escapeSqlData(parentItemId) + "')";
        }
        if (isFirst) {
            return "";
        }
        where += ") AND ((" + COLUMN_DELETE_FLAG_NAME + "=0)OR("
                + COLUMN_DELETE_FLAG_NAME + "=2))";
        sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + where;
        return sql;
    }

    @SuppressWarnings("deprecation")
    public static List<Message> getSiblingTaskList(Message taskMessage) {
        List<Message> retList = new ArrayList<Message>();
        if (taskMessage == null) {
            Log.error("TaskMessageDbHelper#getSiblingTaskList - taskMessage is null");
            return retList;
        }
        String sql = getSiblingTaskMessageSelectSql(taskMessage);
        if (sql == null) {
            Log.error("TaskMessageDbHelper#getSiblingTaskList - sql is invalid");
            return retList;
        }
        if (sql.equals("")) {
            return retList;
        }
        Log.debug(sql);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    Message message = getOneMessageByResultSet(resultSet, false, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private static String getSiblingTaskMessageSelectSql(Message taskMessage) {
        if (taskMessage == null) {
            return "";
        }
        String parentItemId = taskMessage.getParentItemId();
        if (parentItemId == null || parentItemId.equals("")) {
            return "";
        }
        String where = "(" + COLUMN_MESSAGE_TYEP_NAME + "=4) AND ("
                + COLUMN_PARENT_ITEM_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(parentItemId) + "') AND ("
                + COLUMN_ITEM_ID_NAME + "<>'"
                + GlobalSNSUtils.escapeSqlData(taskMessage.getItemId()) + "')"
                + " AND ((" + COLUMN_DELETE_FLAG_NAME + "=0)OR("
                + COLUMN_DELETE_FLAG_NAME + "=2))";
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + where;
        return sql;
    }
}
