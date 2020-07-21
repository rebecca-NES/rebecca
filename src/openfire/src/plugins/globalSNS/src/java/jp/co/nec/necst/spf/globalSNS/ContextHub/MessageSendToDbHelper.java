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

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

import org.jivesoftware.util.Log;

public class MessageSendToDbHelper {
    public final static String TABLE_NAME = "message_sendto_list_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_ITEM_ID_NAME = "item_id";
    public final static String COLUMN_SEND_TO_NAME = "send_to";

    @SuppressWarnings("deprecation")
    public static List<String> getSendToList(String itemId) {
        List<String> sendToList = new ArrayList<String>();
        ;
        if (itemId == null || itemId.equals("")) {
            return sendToList;
        }
        String sql = getSendToDataSelectSql(itemId);
        if (sql == null || sql.equals("")) {
            return sendToList;
        }
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
                    String sendToString = resultSet
                            .getString(COLUMN_SEND_TO_NAME);
                    if (sendToString == null) {
                        continue;
                    }
                    if (sendToString.split("@").length != 2) {
                        continue;
                    }
                    sendToList.add(sendToString);
                }
            } catch (SQLException e) {
                Log.error("Failed to get sendToList data : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return sendToList;
    }

    private static String getSendToDataSelectSql(String itemId) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        String itemIdSql = GlobalSNSUtils.escapeSqlData(itemId);
        return String.format("SELECT * FROM %s WHERE (%s='%s')", TABLE_NAME,
                COLUMN_ITEM_ID_NAME, itemIdSql);
    }

    @SuppressWarnings("deprecation")
    public static boolean insertMessageSendToDb(String itemId,
            List<String> sendToList) {
        if (itemId == null || itemId.equals("")) {
            return false;
        }
        if (sendToList == null || sendToList.size() <= 0) {
            return false;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                String columns = COLUMN_ITEM_ID_NAME + ", "
                        + COLUMN_SEND_TO_NAME;
                String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                        + ") VALUES ";
                int count = sendToList.size();
                boolean first = true;
                for (int i = 0; i < count; i++) {
                    String values = "'" + GlobalSNSUtils.escapeSqlData(itemId)
                            + "','" + sendToList.get(i) + "'";
                    if (first) {
                        first = false;
                    } else {
                        sql += ", ";
                    }
                    sql += "(" + values + ")";
                }
                if (dbHelper.executeInsert(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to insert database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    return false;
                }
                dbHelper.close();
            } catch (Exception e) {
                return false;
            }
        }
        return true;
    }

}
