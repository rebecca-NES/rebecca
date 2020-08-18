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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

public class SystemConfDbHelper {

    public static final String TABLE_NAME = "system_conf";
    public static final String UPSERT_TABLE = "merge_system_conf";
    public static final String COLUMN_CONF_KEY_NAME = "conf_key";
    public static final String COLUMN_VALUE_NAME = "value";

    private static final Logger Log = LoggerFactory
            .getLogger(TenantSystemConfDbHelper.class);


    public static enum SystemConfKey {
        GCM_API_KEY,
        SERVER_URL,
        WEBSOCKET_PORT,
        WEBSOCKET_SSL_FLAG,
        WEBSOCKET_SSL_PASSWORD,
        WEBSOCKET_SSL_KEYSTORE_PASSWORD,
        WEBSOCKET_SSL_KEYSTORE_PATH;
    }

    public static String getValue(SystemConfKey key) {
        if (key == null) {
            return null;
        }
        String sql = getSelectSqlString(key);
        if (sql == null || sql.equals("")) {
            Log.error("SystemConfDbHelper::getValue : sql is invalid");
            return null;
        }

        String value = null;
        GlobalSNSManagerDataBaseHelper dbHelper = GlobalSNSManagerDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    value = resultSet.getString(COLUMN_VALUE_NAME);
                }
            } catch (SQLException e) {
                Log.error("Failed to get DeviceInfoList : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        if (value == null) {
            Log.error("SystemConfDbHelper::getValue:: Requested system_key is not found :: "
                    + key.toString());
        }
        return value;
    }

    private static String getSelectSqlString(SystemConfKey key) {
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
        sqlbuf.append(COLUMN_CONF_KEY_NAME).append(" = '")
                .append(key.toString()).append("'");
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
        GlobalSNSManagerDataBaseHelper dbHelper = GlobalSNSManagerDataBaseHelper
                .getInstance();
        boolean result = true;
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    throw new Exception("Failed to open database");
                }
                dbHelper.executeQuery(sql);
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
        sqlbuf.append("SELECT ");
        sqlbuf.append(UPSERT_TABLE);
        sqlbuf.append("('");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append("','");
        sqlbuf.append(escapeKey);
        sqlbuf.append("','");
        sqlbuf.append(escapeValue);
        sqlbuf.append("')");
        sql = sqlbuf.toString();
        return sql;
    }

}
