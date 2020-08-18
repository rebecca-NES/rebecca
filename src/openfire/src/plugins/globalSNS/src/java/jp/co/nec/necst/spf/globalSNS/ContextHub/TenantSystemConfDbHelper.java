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

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TenantSystemConfDbHelper {
    public static final String TABLE_NAME = "tenant_system_conf";
    public static final String COLUMN_CONF_KEY_NAME = "conf_key";
    public static final String COLUMN_VALUE_NAME = "value";

    public static final String KEY_CLIENT_PUSH_NOTIFICATION_KEEP_DAYS = "CLIENT_PUSH_NOTIFICATION_KEEP_DAYS";
    public static final String KEY_CLIENT_PUSH_NOTIFICATION_MAX_COUNT = "CLIENT_PUSH_NOTIFICATION_MAX_COUNT";
    public static final String KEY_APNS_CERT_PASS = "APNS_CERT_PASS";
    public static final String KEY_APNS_CERT_PATH = "APNS_CERT_PATH";
    public static final String KEY_APNS_CERT_TYPE = "APNS_CERT_TYPE";

    private static final Logger Log = LoggerFactory
            .getLogger(TenantSystemConfDbHelper.class);

    public static String getValue(String key) {
        if (key == null) {
            return null;
        }
        String sql = getSelectSqlString(key);
        if (sql == null || sql.equals("")) {
            Log.error("SystemConfDbHelper::getValue : sql is invalid");
            return null;
        }

        String value = null;
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
                    value = resultSet.getString(COLUMN_VALUE_NAME);
                }
            } catch (SQLException e) {
                Log.error("Failed to get DeviceInfoList : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        if (value == null) {
            Log.error("TenantSystemConfDbHelper::getValue:: Requested conf_key is not found :: "
                    + key.toString());
        }
        return value;
    }

    private static String getSelectSqlString(String key) {
        String sql = "";
        if (key == null) {
            return sql;
        }
        StringBuffer sqlbuf = new StringBuffer();
        sqlbuf.append("SELECT ");
        sqlbuf.append(COLUMN_VALUE_NAME);
        sqlbuf.append(" FROM ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append(" WHERE ");
        sqlbuf.append(COLUMN_CONF_KEY_NAME).append(" = '").append(key)
                .append("'");
        sql = sqlbuf.toString();
        return sql;
    }

    public static boolean setValue(String key, String value) {
        if (key == null || "".equals(key.trim())) {
            return false;
        }
        if (value == null) {
            return  false;
        }
        String sql = setValueSqlString(key, value);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        boolean result = true;
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeUpdate(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to insert database (%s)", sql);
                    throw new Exception(errorMessage);
                }

            } catch (Exception e) {
                Log.error("setValue() : ", e);
                result = false;
            }finally{
                dbHelper.close();
            }
        }
        return result;
    }

    private static String setValueSqlString(String key, String value) {
        String sql = "";
        if (key == null) {
            return sql;
        }
        if (value == null) {
            return sql;
        }
        String escapeKey = GlobalSNSUtils.escapeSqlData(key);
        String escapeValue = GlobalSNSUtils.escapeSqlData(value);

        StringBuffer sqlbuf = new StringBuffer();
        
        sqlbuf.append(" UPDATE ").append(TABLE_NAME);
        sqlbuf.append(" SET    ").append(COLUMN_VALUE_NAME).append(" = '").append(escapeValue).append("'");
        sqlbuf.append(" WHERE  ").append(COLUMN_CONF_KEY_NAME).append(" = '").append(escapeKey).append("'");
        
        sqlbuf.append(";INSERT INTO ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append("(");
        sqlbuf.append(COLUMN_CONF_KEY_NAME);
        sqlbuf.append(",");
        sqlbuf.append(COLUMN_VALUE_NAME);
        sqlbuf.append(")");
        sqlbuf.append(" SELECT '").append(escapeKey).append("', '").append(escapeValue).append("'");
        sqlbuf.append(" WHERE  NOT EXISTS (");
        sqlbuf.append("  SELECT 1 FROM ").append(TABLE_NAME);
        sqlbuf.append("   WHERE ").append(COLUMN_CONF_KEY_NAME).append(" = '").append(escapeKey).append("'");
        sqlbuf.append(" )");

        sql = sqlbuf.toString();

        return sql;
    }
}
