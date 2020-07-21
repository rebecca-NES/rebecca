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
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

import org.jivesoftware.util.Log;

public class ReadMessageDateStoreDbHelper {
    public static final String TABLE_NAME = "read_message_date_store";
    public static final String COLUMN_ID_NAME = "id";
    public static final String COLUMN_ITEM_ID_NAME = "item_id";
    public static final String COLUMN_READ_USER_DATETIMES_NAME = "read_user_datetimes";
    public static final String COLUMN_FIRST_READ_DATE_NAME = "first_read_date";

    @SuppressWarnings("deprecation")
    public static boolean insertInitialData(BigInteger messageId, String itemId){
        if (messageId == null) {
            Log.error("ReadMessageDateStoreDbHelper#insertDb::messageId is invalid");
            return false;
        }
        if (itemId == null || itemId.equals("")) {
            Log.error("ReadMessageDateStoreDbHelper#insertDb::itemId is invalid");
            return false;
        }
        String sql = createInsertInitialDataSqlString(messageId, itemId);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
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
                Log.error(e);
                return false;
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    private static String createInsertInitialDataSqlString(BigInteger messageId, String itemId){
        if (messageId == null) {
            Log.error("ReadMessageDateStoreDbHelper#insertSql::messageId is invalid");
            return null;
        }
        if (itemId == null || itemId.equals("")) {
            Log.error("ReadMessageDateStoreDbHelper#insertSql::itemId is invalid");
            return null;
        }
        String setMessageReadInfoSql = "INSERT INTO " + TABLE_NAME + " ("
                + COLUMN_ID_NAME + ","
                + COLUMN_ITEM_ID_NAME + ")"
                + " VALUES ("
                + messageId.toString() + ", "
                + "'" + GlobalSNSUtils.escapeSqlData(itemId) + "'"
                + " )";
        return setMessageReadInfoSql;
    }

    @SuppressWarnings("deprecation")
    public static boolean updateInitialData(String itemId){
        if (itemId == null || itemId.equals("")) {
            Log.error("ReadMessageDateStoreDbHelper#insertDb::itemId is invalid");
            return false;
        }
        String sql = resetInsertInitialDataSqlString(itemId);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
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
                Log.error(e);
                return false;
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    private static String resetInsertInitialDataSqlString(String itemId){
        if (itemId == null || itemId.equals("")) {
            Log.error("ReadMessageDateStoreDbHelper#insertSql::itemId is invalid");
            return null;
        }
        return "UPDATE " + TABLE_NAME
            + " SET "
            + COLUMN_READ_USER_DATETIMES_NAME + "=null, "
            + COLUMN_FIRST_READ_DATE_NAME + "=null "
            + " WHERE "
            + COLUMN_ITEM_ID_NAME + "='" + GlobalSNSUtils.escapeSqlData(itemId) + "'";
    }

    @SuppressWarnings("deprecation")
    public static Set<BigInteger> getExistData(Collection<BigInteger> idList) {
        Set<BigInteger> ret = new HashSet<BigInteger>();
        if (idList == null) {
            Log.error("ReadMessageInfoStoreDbHelper#isExistData::idList is invalid");
            return ret;
        }
        String idListInSql = "";
        boolean isFirst = true;
        for(BigInteger id : idList) {
            if(id == null) {
                continue;
            }
            if(isFirst) {
                isFirst = false;
            } else {
                idListInSql += ",";
            }
            idListInSql += id.toString();
        }
        if(idListInSql == null || "".equals(idListInSql)) {
            return ret;
        }
        String sql = "SELECT " + COLUMN_ID_NAME + " FROM " + TABLE_NAME + " WHERE "
                + COLUMN_ID_NAME + " IN (" + idListInSql + ");";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while(resultSet.next()) {
                    ret.add(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
                }
            } catch (SQLException e) {
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error(e);
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static boolean setReadMessageDate(List<BigInteger> idList,
            Timestamp readDateTime) {
        if(idList == null){
            return false;
        }
        String sql = createSetReadMessageSql(idList, readDateTime);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeUpdate(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to update database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    return false;
                }
                dbHelper.close();
            } catch (Exception e) {
                Log.error(e);
                return false;
            }
        }
        return true;
    }

    private static String createSetReadMessageSql(List<BigInteger> idList, Timestamp readDateTime) {
        if (idList == null) {
            return "";
        }
        int count = idList.size();
        if (count <= 0) {
            return "";
        }
        String now = null;
        String dateTimeDiffSql = "";
        if(readDateTime != null){
            long dateTime = readDateTime.getTime();
            Date date = new java.util.Date(dateTime);
            SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
            now = df.format(date);
            dateTimeDiffSql = "extract(epoch from timestamp '" + now + "') - extract(epoch from " + COLUMN_FIRST_READ_DATE_NAME + ") ";
        }
        String firstReadDateValue = (now == null) ? COLUMN_FIRST_READ_DATE_NAME : "'" + now + "'";
        String readUserDateTimesValWhenNull = (now == null) ? COLUMN_READ_USER_DATETIMES_NAME : "'0,'";

        String sql = "UPDATE " + TABLE_NAME + " " ;
        sql += " SET "
                + COLUMN_READ_USER_DATETIMES_NAME + "="
                + "(CASE WHEN " + COLUMN_READ_USER_DATETIMES_NAME + " IS NULL THEN "
                + readUserDateTimesValWhenNull
                + " ELSE "
                + "(" + COLUMN_READ_USER_DATETIMES_NAME + " || "
                +      dateTimeDiffSql + " || ',' )"
                + " END "
                + " ) "
                + "," + COLUMN_FIRST_READ_DATE_NAME + "="
                + "(CASE WHEN " + COLUMN_FIRST_READ_DATE_NAME + " IS NULL THEN "
                +  firstReadDateValue
                + " ELSE "
                + COLUMN_FIRST_READ_DATE_NAME
                + " END "
                + " ) ";

        sql += " WHERE ";

        String where = "";
        for (int i = 0; i < count; i++) {
            if (i != 0) {
                where += " OR ";
            }
            where += "(id=" + idList.get(i) + ")";
        }
        sql += where;
        return sql;
    }


}
