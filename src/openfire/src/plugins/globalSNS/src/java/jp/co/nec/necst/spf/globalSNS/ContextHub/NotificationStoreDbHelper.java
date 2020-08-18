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

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.NotificationDbData;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class NotificationStoreDbHelper {
    private static final Logger Log = LoggerFactory
            .getLogger(NotificationStoreDbHelper.class);
    public final static String TABLE_NAME = "notification_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_NOTIFICATION_TYPE_NAME = "notification_type";
    public final static String COLUMN_DATA_TYPE_NAME = "data_type";
    public final static String COLUMN_NOTIFICATION_DATA_NAME = "notification_data";
    public final static String COLUMN_JID_NAME = "jid";
    public final static String COLUMN_NOTIFIED_DATE_NAME = "notified_date";

    public static enum FilterMode {
        ALL, XMPP, WEBSOCKET;
    }

    public static boolean insertNotificationDataToDb(
            NotificationDbData notificationDbData) {
        if (notificationDbData == null) {
            Log.error("NotificationStoreDbHelper#insertNotificationDataToDb :: notificationDbData is null");
            return false;
        }

        String notificationData = notificationDbData.getNotificationData();
        if (notificationData == null) {
            Log.error("NotificationStoreDbHelper#insertNotificationDataToDb :: notificationData is null");
            return false;
        }
        String sqlNotificationData = "'"
                + GlobalSNSUtils.escapeSqlData(notificationData) + "'";

        String jid = notificationDbData.getJid();
        if (jid == null) {
            Log.error("NotificationStoreDbHelper#insertNotificationDataToDb :: jid is null");
            return false;
        }
        String sqlJidData = "'" + GlobalSNSUtils.escapeSqlData(jid) + "'";

        String notifiedDate = notificationDbData.getNotifiedDateStr();
        String sqlnotifiedDate = "NULL";
        if (!notifiedDate.equals("")) {
            sqlnotifiedDate = "'" + notifiedDate + "'";
        }

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
                String columns = COLUMN_NOTIFICATION_TYPE_NAME + ", "
                        + COLUMN_DATA_TYPE_NAME + ", "
                        + COLUMN_NOTIFICATION_DATA_NAME + ", "
                        + COLUMN_JID_NAME + ", " + COLUMN_NOTIFIED_DATE_NAME;
                String values = String.valueOf(notificationDbData
                        .getNotificationType())
                        + ","
                        + String.valueOf(notificationDbData.getDataType())
                        + ","
                        + sqlNotificationData
                        + ","
                        + sqlJidData
                        + ","
                        + sqlnotifiedDate;
                String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                        + ") VALUES (" + values + ")";
                if (dbHelper.executeInsert(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to insert database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    isDbOpend = false;
                    return false;
                }
                dbHelper.close();
                isDbOpend = false;
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return false;
            }
        }
        return true;
    }

    public static List<NotificationDbData> getNotificationDataListByJid(
            String jid, FilterMode filterMode, int maxCount, boolean isOldFirst) {
        List<NotificationDbData> ret = null;
        if (jid == null || jid.equals("")) {
            Log.error("NotificationStoreDbHelper#getNotificationDataListByJid :: jid is invalid");
            return ret;
        }
        String sql = getNotificationDataByJidSelectSql(jid, filterMode, maxCount, isOldFirst);
        if (sql == null || sql.equals("")) {
            Log.error("NotificationStoreDbHelper#getNotificationDataListByJid :: sql is invalid");
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        boolean isDbOpend = false;
        try {
            if (!dbHelper.open()) {
                Log.error("NotificationStoreDbHelper#getNotificationDataListByJid :: Failed to open database");
                throw new Exception("Failed to open database");
            }
            isDbOpend = true;
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                List<NotificationDbData> notificationDbDataList = new ArrayList<NotificationDbData>();
                while (resultSet.next()) {
                    NotificationDbData notificationDbData = getOneNotificationDbDataByResultSet(resultSet);
                    if (notificationDbData == null) {
                        Log.error("NotificationStoreDbHelper#getNotificationDataListByJid :: notificationDbData is null");
                        continue;
                    }
                    notificationDbDataList.add(notificationDbData);
                }
                ret = notificationDbDataList;
            } catch (SQLException e) {
                Log.error("NotificationStoreDbHelper#getNotificationDataListByJid :: Failed to get Notification data");
            }
            dbHelper.close();
            isDbOpend = false;
        } catch (Exception e) {
            if (isDbOpend) {
                dbHelper.close();
                isDbOpend = false;
            }
            return ret;
        }
        return ret;
    }

    private static String getNotificationDataByJidSelectSql(String jid,
            FilterMode filterMode, int maxCount, boolean isOldFirst) {
        String ret = "";
        if (jid == null || jid.equals("")) {
            Log.error("NotificationStoreDbHelper#getNotificationDataSelectSql :: jid is invalid");
            return ret;
        }
        String sqljidStr = GlobalSNSUtils.escapeSqlData(jid);
        String filterStr = getWhereFilterModeString(filterMode);
        if (filterStr != null && !"".equals(filterStr)) {
            filterStr = " AND (" + filterStr + ")";
        } else {
            filterStr = "";
        }
        String orderStr = "ASC";
        if(!isOldFirst) {
            orderStr = "DESC";
        }
        String limitStr = "";
        if(maxCount > 0) {
            limitStr = " LIMIT " + String.valueOf(maxCount);
        }
        ret = String.format(
                "SELECT * FROM %s WHERE (%s='%s')%s ORDER BY %s %s%s",
                TABLE_NAME, COLUMN_JID_NAME, sqljidStr, filterStr,
                COLUMN_ID_NAME, orderStr, limitStr);
        return ret;
    }

    private static String getWhereFilterModeString(FilterMode filterMode) {
        String filterStr = "";
        switch (filterMode) {
            case XMPP:
                filterStr = COLUMN_NOTIFICATION_TYPE_NAME
                        + "<"
                        + String.valueOf(NotificationDbData.NOTIFICATION_TYPE_MESSAGE_WEBSOCKET);
                break;
            case WEBSOCKET:
                filterStr = COLUMN_NOTIFICATION_TYPE_NAME
                        + ">="
                        + String.valueOf(NotificationDbData.NOTIFICATION_TYPE_MESSAGE_WEBSOCKET);
                break;
            case ALL:
            default:
                break;
        }
        return filterStr;
    }

    private static NotificationDbData getOneNotificationDbDataByResultSet(
            ResultSet resultSet) {
        NotificationDbData ret = null;
        if (resultSet == null) {
            return ret;
        }
        try {
            NotificationDbData notificationDbData = new NotificationDbData();
            notificationDbData.setId(new BigInteger(resultSet
                    .getString(COLUMN_ID_NAME)));
            notificationDbData.setNotificationType(resultSet
                    .getInt(COLUMN_NOTIFICATION_TYPE_NAME));
            notificationDbData.setDataType(resultSet
                    .getInt(COLUMN_DATA_TYPE_NAME));
            notificationDbData.setNotificationData(resultSet
                    .getString(COLUMN_NOTIFICATION_DATA_NAME));
            notificationDbData.setJid(resultSet.getString(COLUMN_JID_NAME));
            notificationDbData.setNotifiedDate(resultSet
                    .getTimestamp(COLUMN_NOTIFIED_DATE_NAME));
            ret = notificationDbData;
        } catch (SQLException e) {
            return ret;
        }
        return ret;
    }

    public static boolean deleteNotificationToDbByJid(String jid,
            FilterMode filterMode) {
        boolean ret = false;
        if (jid == null || jid.equals("")) {
            Log.error("NotificationStoreDbHelper#deleteNotificationToDb :: jid is invalid");
            return ret;
        }
        String filterStr = getWhereFilterModeString(filterMode);
        if (filterStr != null && !"".equals(filterStr)) {
            filterStr = " AND (" + filterStr + ")";
        } else {
            filterStr = "";
        }
        String sql = "DELETE FROM " + TABLE_NAME + " WHERE (" + COLUMN_JID_NAME
                + "='" + GlobalSNSUtils.escapeSqlData(jid) + "')" + filterStr
                + ";";
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
                if (dbHelper.executeDelete(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to update database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    isDbOpend = false;
                    return ret;
                }
                dbHelper.close();
                isDbOpend = false;
                ret = true;
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return ret;
            }
        }
        return ret;
    }
    public static int getNotificationCountByJid(
            String jid, FilterMode filterMode) {
        final String logPrefix = "getNotificationDataCountByJid() : ";
        int ret = 0;
        if (jid == null || jid.equals("")) {
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return ret;
        }
        String sql = getNotificationCountByJidSelectSql(jid, filterMode);
        if (sql == null || sql.equals("")) {
            Log.error(logPrefix + "sql is invalid", new Throwable());
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        boolean isDbOpend = false;
        try {
            if (!dbHelper.open()) {
                Log.error(logPrefix + "Failed to open database", new Throwable());
                throw new Exception("Failed to open database");
            }
            isDbOpend = true;
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    ret = resultSet.getInt("notification_count");
                }
            } catch (SQLException e) {
                Log.error(logPrefix + "Failed to get Notification data", new Throwable());
            }
            dbHelper.close();
            isDbOpend = false;
        } catch (Exception e) {
            if (isDbOpend) {
                dbHelper.close();
                isDbOpend = false;
            }
            return ret;
        }
        return ret;
    }

    private static String getNotificationCountByJidSelectSql(String jid,
            FilterMode filterMode) {
        final String logPrefix = "getNotificationCountByJidSelectSql() : ";
        String ret = "";
        if (jid == null || jid.equals("")) {
            Log.error(logPrefix + "jid is invalid", new Throwable());
            return ret;
        }
        String sqljidStr = GlobalSNSUtils.escapeSqlData(jid);
        String filterStr = getWhereFilterModeString(filterMode);
        if (filterStr != null && !"".equals(filterStr)) {
            filterStr = " AND (" + filterStr + ")";
        } else {
            filterStr = "";
        }
        ret = String.format(
                "SELECT count(1) as notification_count FROM %s WHERE (%s='%s')%s",
                TABLE_NAME, COLUMN_JID_NAME, sqljidStr, filterStr);
        return ret;
    }
}
