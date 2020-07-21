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

import jp.co.nec.necst.spf.globalSNS.Data.MailServerInfo;

import org.jivesoftware.util.Log;

public class MailServerListDbHelper {
    private final static String TABLE_NAME = "mail_server_list";

    private final static String COLUMN_ID_NAME = "id";
    private final static String COLUMN_DISPLAY_NAME_NAME = "display_name";
    private final static String COLUMN_SERVER_TYPE_NAME = "server_type";
    private final static String COLUMN_CREATED_AT_NAME = "created_at";
    private final static String COLUMN_CREATED_BY_NAME = "created_by";
    private final static String COLUMN_UPDATED_AT_NAME = "updated_at";
    private final static String COLUMN_UPDATED_BY_NAME = "updated_by";
    private final static String COLUMN_DELETE_FLAG_NAME = "delete_flag";
    private final static String COLUMN_DELETED_AT_NAME = "deleted_at";
    private final static String COLUMN_DELETED_BY_NAME = "deleted_by";
    private final static String COLUMN_POP_HOST_NAME = "pop_host";
    private final static String COLUMN_POP_PORT_NAME = "pop_port";
    private final static String COLUMN_POP_AUTH_MODE_NAME = "pop_auth_mode";
    private final static String COLUMN_POP_RESPONSE_TIMEOUT = "pop_response_timeout";

    @SuppressWarnings("deprecation")
    public static List<MailServerInfo> getMailServerList() {
        List<MailServerInfo> ret = null;
        String sql = getMailServerListSelectSql();
        if (sql == null || sql.equals("")) {
            Log.error("MailServerListDbHelper#getMailServerList - sql is invalid");
            return ret;
        }
        return getMailServerListBySqlString(sql);
    }

    private static String getMailServerListSelectSql() {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = "(" + COLUMN_DELETE_FLAG_NAME + "=0)";
        sql += where;
        String orderBy = "id ASC";
        sql += " ORDER BY " + orderBy;
        return sql;
    }

    @SuppressWarnings("deprecation")
    private static List<MailServerInfo> getMailServerListBySqlString(String sql) {
        List<MailServerInfo> retList = null;
        if (sql == null || sql.equals("")) {
            Log.error("MailServerListDbHelper#getMailServerListBySqlString - sql is invalid");
            return retList;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        boolean dbOpend = false;
        try {
            if (!dbHelper.open()) {
                Log.error("MailServerListDbHelper#getMailServerListBySqlString - Failed to open database");
                throw new Exception("Failed to open database");
            }
            dbOpend = true;
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                retList = new ArrayList<MailServerInfo>();
                while (resultSet.next()) {
                    MailServerInfo mailServerInfo = getOneMailServerInfoByResultSet(resultSet);
                    if (mailServerInfo != null) {
                        retList.add(mailServerInfo);
                    }
                }
            } catch (SQLException e) {
                Log.error("MailServerListDbHelper#getMailServerListBySqlString - Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
            if (dbOpend) {
                dbHelper.close();
            }
        }
        return retList;
    }

    private static MailServerInfo getOneMailServerInfoByResultSet(
            ResultSet resultSet) {
        MailServerInfo mailServerInfo = new MailServerInfo();
        try {
            mailServerInfo.setId(new BigInteger(resultSet
                    .getString(COLUMN_ID_NAME)));
            mailServerInfo.setDisplayName(resultSet
                    .getString(COLUMN_DISPLAY_NAME_NAME));
            mailServerInfo.setServerType(resultSet
                    .getInt(COLUMN_SERVER_TYPE_NAME));
            mailServerInfo.setCreatedAt(resultSet
                    .getTimestamp(COLUMN_CREATED_AT_NAME));
            mailServerInfo.setCreatedBy(resultSet
                    .getString(COLUMN_CREATED_BY_NAME));
            mailServerInfo.setUpdatedAt(resultSet
                    .getTimestamp(COLUMN_UPDATED_AT_NAME));
            String updatedBy = resultSet.getString(COLUMN_UPDATED_BY_NAME);
            mailServerInfo.setUpdatedBy(updatedBy == null ? "" : updatedBy);
            mailServerInfo.setDeleteFlag(resultSet
                    .getInt(COLUMN_DELETE_FLAG_NAME));
            mailServerInfo.setDeletedAt(resultSet
                    .getTimestamp(COLUMN_DELETED_AT_NAME));
            String deletedBy = resultSet.getString(COLUMN_DELETED_BY_NAME);
            mailServerInfo.setDeletedBy(deletedBy == null ? "" : deletedBy);
            mailServerInfo
                    .setPopHost(resultSet.getString(COLUMN_POP_HOST_NAME));
            mailServerInfo.setPopPort(resultSet.getInt(COLUMN_POP_PORT_NAME));
            mailServerInfo.setPopAuthMode(resultSet
                    .getInt(COLUMN_POP_AUTH_MODE_NAME));
            mailServerInfo.setPopResonseTimeout(resultSet
                    .getInt(COLUMN_POP_RESPONSE_TIMEOUT));
        } catch (SQLException e) {
            return null;
        }
        return mailServerInfo;
    }
}
