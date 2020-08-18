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
import java.util.ArrayList;
import java.util.List;

import org.jivesoftware.util.Log;

public class SystemMessageDbHelper extends MessageStoreDbHelper {

    @SuppressWarnings("deprecation")
    public static int getCreateCount() {
        int ret = 0;
        String sql = "SELECT COUNT(id) AS system_message_count FROM "
                + TABLE_NAME + " WHERE " + COLUMN_MESSAGE_TYEP_NAME + "=6";
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
                    ret = resultSet.getInt("system_message_count");
                }
            } catch (SQLException e) {
                Log.error("Failed to get system message count : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static List<String> getSystemMessageHistoryItemId(String sendTo,
            int limitCount, int baseId) {
        List<String> systemMessageItemIdList = new ArrayList<String>();
        if (sendTo == null || limitCount <= 0) {
            return systemMessageItemIdList;
        } else if (sendTo.isEmpty()) {
            return systemMessageItemIdList;
        }
        String where = TABLE_NAME + "." + COLUMN_MESSAGE_TYEP_NAME + "=6 AND "
                + MessageSendToDbHelper.TABLE_NAME + "."
                + MessageSendToDbHelper.COLUMN_SEND_TO_NAME + "='" + sendTo
                + "' AND " + TABLE_NAME + "." + COLUMN_SHOW_TYPE_NAME + "=1";
        if (baseId > 0) {
            where += " AND " + TABLE_NAME + "." + COLUMN_ID_NAME + "<"
                    + String.valueOf(baseId);
        }
        String orderBy = TABLE_NAME + "." + COLUMN_ID_NAME + " DESC";
        String limit = String.valueOf(limitCount);
        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_ITEM_ID_NAME
                + " FROM " + MessageSendToDbHelper.TABLE_NAME + " INNER JOIN "
                + TABLE_NAME + " ON " + MessageSendToDbHelper.TABLE_NAME + "."
                + MessageSendToDbHelper.COLUMN_ITEM_ID_NAME + "=" + TABLE_NAME
                + "." + COLUMN_ITEM_ID_NAME + " WHERE " + where + " ORDER BY "
                + orderBy + " LIMIT " + limit + ";";
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
                    String itemId = resultSet.getString(COLUMN_ITEM_ID_NAME);
                    if (itemId == null) {
                        continue;
                    } else if (itemId.isEmpty()) {
                        continue;
                    }
                    systemMessageItemIdList.add(itemId);
                }
            } catch (SQLException e) {
                Log.error("Failed to get system message count : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return systemMessageItemIdList;
    }

    @SuppressWarnings("deprecation")
    public static List<String> getPublicQuestionnaireItemId(int limitCount, int baseId) {
        List<String> systemMessageItemIdList = new ArrayList<String>();
        String where = TABLE_NAME + "." + COLUMN_MESSAGE_TYEP_NAME + "= 10 AND "
                + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME + "."
                + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME + "= 1 ";
        if (baseId > 0) {
            where += " AND " + TABLE_NAME + "." + COLUMN_ID_NAME + "<"
                    + String.valueOf(baseId);
        }
        String orderBy = TABLE_NAME + "." + COLUMN_ID_NAME + " DESC";
        String limit = String.valueOf(limitCount);
        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_ITEM_ID_NAME
                + " FROM " + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME + " INNER JOIN "
                + TABLE_NAME + " ON " + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME + "."
                + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ITEM_ID_NAME + "=" + TABLE_NAME
                + "." + COLUMN_ITEM_ID_NAME + " WHERE " + where + " ORDER BY "
                + orderBy + " LIMIT " + limit + ";";
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
                    String itemId = resultSet.getString(COLUMN_ITEM_ID_NAME);
                    if (itemId == null) {
                        continue;
                    } else if (itemId.isEmpty()) {
                        continue;
                    }
                    systemMessageItemIdList.add(itemId);
                }
            } catch (SQLException e) {
                Log.error("Failed to get system message count : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return systemMessageItemIdList;
    }
}
