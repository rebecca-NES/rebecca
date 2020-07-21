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
import jp.co.nec.necst.spf.globalSNS.Data.DeviceInfo;

import org.jivesoftware.util.Log;

public class DeviceInfoStroreDbHelper {

    private static final String TABLE_NAME = "device_info_store";
    private static final String COLUMN_ID_NAME = "id";
    private static final String COLUMN_DEVICE_ID_NAME = "device_id";
    private static final String COLUMN_JID_NAME = "jid";
    private static final String COLUMN_NOTIFICATION_SERVICE_NAME = "notification_service";

    @SuppressWarnings("deprecation")
    public static List<DeviceInfo> getDeviceInfoList(String jid) {

        if (jid == null) {
            return null;
        }
        String sql = getSelectSqlString(jid);
        if (sql == null || sql.equals("")) {
            Log.error("getDeviceInfoList : sql is invalid");
            return null;
        }

        ArrayList<DeviceInfo> aryDeviceInfo = null;
        GlobalSNSManagerDataBaseHelper dbHelper = GlobalSNSManagerDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    if (aryDeviceInfo == null) {
                        aryDeviceInfo = new ArrayList<DeviceInfo>();
                    }
                    DeviceInfo deviceInfo = new DeviceInfo();

                    deviceInfo.setId(new BigInteger(resultSet
                            .getString(COLUMN_ID_NAME)));
                    deviceInfo.setDeviceId(resultSet
                            .getString(COLUMN_DEVICE_ID_NAME));
                    deviceInfo.setJid(resultSet.getString(COLUMN_JID_NAME));
                    deviceInfo.setNotificationService(resultSet
                            .getInt(COLUMN_NOTIFICATION_SERVICE_NAME));
                    aryDeviceInfo.add(deviceInfo);
                }
            } catch (SQLException e) {
                Log.error("Failed to get DeviceInfoList : " + sql, e);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return aryDeviceInfo;
    }

    private static String getSelectSqlString(String jid) {
        String sql = "";
        if (jid == null || jid.equals("")) {
            return sql;
        }
        StringBuffer sqlbuf = new StringBuffer();
        sqlbuf.append("SELECT ");
        sqlbuf.append(COLUMN_ID_NAME).append(", ");
        sqlbuf.append(COLUMN_DEVICE_ID_NAME).append(", ");
        sqlbuf.append(COLUMN_JID_NAME).append(", ");
        sqlbuf.append(COLUMN_NOTIFICATION_SERVICE_NAME);
        sqlbuf.append(" FROM ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append(" WHERE ");
        sqlbuf.append(COLUMN_JID_NAME).append(" = '")
                .append(GlobalSNSUtils.escapeSqlData(jid)).append("'");
        sql = sqlbuf.toString();
        return sql;
    }

    @SuppressWarnings("deprecation")
    public static boolean insertDeviceInfoToDb(DeviceInfo deviceInfo) {
        boolean ret = false;
        if (deviceInfo == null) {
            return ret;
        }
        String sql = getInsertSqlString(deviceInfo);
        if (sql == null || sql.equals("")) {
            Log.error("insertDb : sql is invalid");
            return ret;
        }
        GlobalSNSManagerDataBaseHelper dbHelper = GlobalSNSManagerDataBaseHelper
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
                    throw new Exception("Failed to insert database");
                }
                dbHelper.close();
                ret = true;
            } catch (Exception e) {
                return ret;
            }
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    private static String getInsertSqlString(DeviceInfo deviceInfo) {
        String sql = "";
        if (deviceInfo == null) {
            return sql;
        }
        String Jid = deviceInfo.getJid();
        if (Jid == null || Jid.equals("")) {
            Log.debug("DeviceInfoStroreDbHelper#getInsertSqlString : Jid is invalid");
            return sql;
        }
        String deviceId = deviceInfo.getDeviceId();
        if (deviceId == null || deviceId.equals("")) {
            Log.debug("DeviceInfoStroreDbHelper#getInsertSqlString : deviceId is invalid");
            return sql;
        }
        String jid = deviceInfo.getJid();
        if (jid == null || jid.equals("")) {
            Log.debug("DeviceInfoStroreDbHelper#getInsertSqlString : jid is invalid");
            return sql;
        }
        int notificationService = deviceInfo.getNotificationService();

        String columns = COLUMN_DEVICE_ID_NAME + ", " + COLUMN_JID_NAME + ", "
                + COLUMN_NOTIFICATION_SERVICE_NAME;

        String values = "'" + GlobalSNSUtils.escapeSqlData(deviceId) + "', '"
                + GlobalSNSUtils.escapeSqlData(jid) + "', '"
                + notificationService + "'";
        sql = "INSERT INTO " + TABLE_NAME + " (" + columns + ") VALUES ("
                + values + ");";
        return sql;
    }

    @SuppressWarnings("deprecation")
    public static boolean deleteDeviceInfoToDb(DeviceInfo deviceInfo) {
        return deleteDeviceInfoFromDb(deviceInfo, false);
    }

    @SuppressWarnings("deprecation")
    public static boolean deleteDeviceInfoByDeviceToken(
            DeviceInfo deviceInfo) {
        return deleteDeviceInfoFromDb(deviceInfo, true);
    }
    @SuppressWarnings("deprecation")
    private static boolean deleteDeviceInfoFromDb(DeviceInfo deviceInfo,
            boolean usesDeviceTokenOnly) {
        boolean ret = false;
        if (deviceInfo == null) {
            return ret;
        }
        String sql = getDeleteSqlString(deviceInfo, usesDeviceTokenOnly);
        if (sql == null || sql.equals("")) {
            Log.error("deleteDb : sql is invalid");
            return ret;
        }
        GlobalSNSManagerDataBaseHelper dbHelper = GlobalSNSManagerDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                int cnt = dbHelper.executeDelete(sql);
                if (cnt < 0) {
                    String errorMessage = String.format(
                            "Failed to delete database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    throw new Exception("Failed to delete database");
                } else if (cnt == 0) {
                    String warnMessage = String.format(
                            "No row is affected (%s)", sql);
                    Log.warn(warnMessage);
                }
                dbHelper.close();
                ret = true;
            } catch (Exception e) {
                return ret;
            }
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    private static String getDeleteSqlString(DeviceInfo deviceInfo,
            boolean usesDeviceTokenOnly) {
        String sql = "";
        if (deviceInfo == null) {
            return sql;
        }
        String deviceId = deviceInfo.getDeviceId();
        if (deviceId == null || deviceId.equals("")) {
            Log.debug("DeviceInfoStroreDbHelper#getInsertSqlString : deviceId is invalid");
            return sql;
        }
        String jid = null;
        if (!usesDeviceTokenOnly) {
            jid = deviceInfo.getJid();
            if (jid == null || jid.equals("")) {
                Log.debug("DeviceInfoStroreDbHelper#getInsertSqlString : jid is invalid");
                return sql;
            }
        }
        String where = " WHERE upper(" + COLUMN_DEVICE_ID_NAME + ") = upper('"
                + GlobalSNSUtils.escapeSqlData(deviceId) + "') ";
        String jidCondition = usesDeviceTokenOnly ? "" : " AND "
                + COLUMN_JID_NAME + " = '" + GlobalSNSUtils.escapeSqlData(jid)
                + "'";
        int notificationType = deviceInfo.getNotificationService();
        String notificationTypeCondition = null;
        if (notificationType == DeviceInfo.NOTIFICATION_SERVICE_TYPE_APNS
                || notificationType == DeviceInfo.NOTIFICATION_SERVICE_TYPE_GCM) {
            notificationTypeCondition = " AND "
                    + COLUMN_NOTIFICATION_SERVICE_NAME + " = "
                    + notificationType;
        } else {
            notificationTypeCondition = "";
        }
        sql = "DELETE FROM " + TABLE_NAME + where + jidCondition
                + notificationTypeCondition + ";";
        return sql;
    }

}
