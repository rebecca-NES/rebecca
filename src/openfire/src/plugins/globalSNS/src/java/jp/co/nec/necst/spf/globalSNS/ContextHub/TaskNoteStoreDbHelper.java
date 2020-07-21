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

import java.math.BigInteger;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.TaskNote;

import org.jivesoftware.util.Log;

public class TaskNoteStoreDbHelper {
    private final static String TABLE_NAME = "tasknote_store";

    private final static String COLUMN_ID_NAME = "id";
    private final static String COLUMN_ITEM_ID_NAME = "item_id";
    private final static String COLUMN_SENDER_JID_NAME = "sender_jid";
    private final static String COLUMN_MESSAGE_NAME = "message";
    private final static String COLUMN_DATE_NAME = "date";


    @SuppressWarnings("deprecation")
    public static List<TaskNote> getTaskNoteData(String itemId) {
        List<TaskNote> taskNoteList = new ArrayList<TaskNote>();
        ;
        if (itemId == null || itemId.equals("")) {
            return taskNoteList;
        }
        String sql = getTaskNoteDataSelectSql(itemId);
        if (sql == null || sql.equals("")) {
            return taskNoteList;
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
                    TaskNote taskNoteData = getOneTaskNoteDataByResultSet(resultSet);
                    if (taskNoteData == null) {
                        continue;
                    }
                    taskNoteList.add(taskNoteData);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return taskNoteList;
    }

    private final static String getTaskNoteDataSelectSql(String itemId) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        String itemIdSql = GlobalSNSUtils.escapeSqlData(itemId);
        return String.format("SELECT * FROM %s WHERE (%s = '%s')",
                TABLE_NAME, COLUMN_ITEM_ID_NAME, itemIdSql);
    }

    private static TaskNote getOneTaskNoteDataByResultSet(ResultSet resultSet) {
        TaskNote taskNoteData = new TaskNote();
        try {
            taskNoteData
                    .setId((BigInteger) resultSet.getObject(COLUMN_ID_NAME));
            taskNoteData.setItemId(resultSet.getString(COLUMN_ITEM_ID_NAME));
            taskNoteData.setSenderJid(resultSet
                    .getString(COLUMN_SENDER_JID_NAME));
            String message = resultSet.getString(COLUMN_MESSAGE_NAME);
            taskNoteData.setMessage(message == null ? "" : message);
            taskNoteData.setDate(resultSet.getTimestamp(COLUMN_DATE_NAME));
        } catch (SQLException e) {
            return null;
        }
        return taskNoteData;
    }

    public static boolean updateLastUpdateDate(String update_roomid) {
        if (update_roomid == null || update_roomid.equals("")) {
            Log.error("TaskNoteStoreDbHelper#updateLastUpdateDate::update_roomid is invalid");
            return false;
        }
        String updateRoomSql = getUpdateLastUpdateDateSql(update_roomid);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
            .getInstance();
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                isDbOpend = true;
                if (dbHelper.executeUpdate(updateRoomSql) == -1) {
                    String errorMessage = String.format
                        ("Failed to update database (%s)", updateRoomSql);
                    Log.error(errorMessage);
                    return false;
                }
                dbHelper.close();
                isDbOpend = false;
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                Log.error("CommunityStoreDbHelper#updateLastUpdateDate::failed to update data. sql="
                          + updateRoomSql);
                return false;
            }
        }
        return true;
    }

    private static String getUpdateLastUpdateDateSql(String update_roomid) {
        Calendar now = Calendar.getInstance();
        long updatedTime = now.getTimeInMillis();
        java.util.Date date = new java.util.Date(updatedTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        String updatedAt = df.format(date);

        return "update community_store set updated_at="
            + "'" + GlobalSNSUtils.escapeSqlData(updatedAt) + "'"
            + " where room_id="
            + "'" + GlobalSNSUtils.escapeSqlData(update_roomid) + "'";
    }
}
