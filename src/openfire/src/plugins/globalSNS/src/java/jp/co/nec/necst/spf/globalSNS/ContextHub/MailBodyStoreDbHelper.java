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

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.MailBody;

import org.jivesoftware.util.Log;

public class MailBodyStoreDbHelper {

    private final static String TABLE_NAME = "mail_body_store";
    private final static String COLUMN_ID_NAME = "id";
    private final static String COLUMN_ITEM_ID_NAME = "item_id";
    private final static String COLUMN_JID_NAME = "jid";
    private final static String COLUMN_MAIL_BODY = "mail_body";

    @SuppressWarnings("deprecation")
    public static boolean insertMailBodyToDb(MailBody mailBody) {
        boolean ret = false;
        if (mailBody == null) {
            Log.error("MailBodyStoreDbHelper#insertMailBodyToDb - mailBody is null");
            return ret;
        }
        String itemId = mailBody.getItemId();
        if (itemId == null || itemId.equals("")) {
            Log.error("MailBodyStoreDbHelper#insertMailBodyToDb - itemId is invalid");
            return ret;
        }
        String jid = mailBody.getJid();
        if (jid == null || jid.equals("")) {
            Log.error("MailBodyStoreDbHelper#insertMailBodyToDb - jid is invalid");
            return ret;
        }
        String mailBodyString = mailBody.getMailBody();
        if (mailBodyString == null) {
            Log.error("MailBodyStoreDbHelper#insertMailBodyToDb - mailBodyString is null");
            return ret;
        }
        String columns = COLUMN_ITEM_ID_NAME + ", " + COLUMN_JID_NAME + ", "
                + COLUMN_MAIL_BODY;
        String values = "'" + GlobalSNSUtils.escapeSqlData(itemId) + "', '"
                + GlobalSNSUtils.escapeSqlData(jid) + "', '"
                + GlobalSNSUtils.escapeSqlData(mailBodyString) + "'";
        String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                + ") VALUES (" + values + ");";
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
                Log.error("MailBodyStoreDbHelper#insertMailBodyToDb - exception");
                return false;
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    public static MailBody getMailBody(String itemId, String fromJid) {
        MailBody ret = null;
        if (itemId == null || itemId.equals("")) {
            Log.error("MailBodyStoreDbHelper#getMailBody - itemId is invalid");
            return ret;
        }
        if (fromJid == null || fromJid.equals("")) {
            Log.error("MailBodyStoreDbHelper#getMailBody - fromJid is invalid");
            return ret;
        }
        String sql = getMailBodySelectSql(itemId, fromJid);
        if (sql == null || sql.equals("")) {
            Log.error("MailBodyStoreDbHelper#getMailBody - sql is invalid");
            return ret;
        }
        return getMessageBodyBySqlString(sql);
    }

    private static String getMailBodySelectSql(String itemId, String fromJid) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        if (fromJid == null || fromJid.equals("")) {
            return "";
        }

        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = COLUMN_ITEM_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(itemId) + "' AND "
                + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(fromJid) + "'";
        sql += where;
        sql += " ORDER BY " + COLUMN_ID_NAME + " ASC LIMIT 1";
        return sql;
    }

    @SuppressWarnings("deprecation")
    private static MailBody getMessageBodyBySqlString(String sql) {
        MailBody ret = null;
        if (sql == null || sql.equals("")) {
            Log.error("MailBodyStoreDbHelper#getMessageBodyBySqlString - sql is invalid");
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        boolean dbOpend = false;
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            dbOpend = true;
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    MailBody mailBody = getOneMessageBodyByResultSet(resultSet);
                    ret = mailBody;
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
            if (dbOpend) {
                dbHelper.close();
            }
        }
        return ret;
    }

    private static MailBody getOneMessageBodyByResultSet(ResultSet resultSet) {
        MailBody mailBody = new MailBody();
        try {
            mailBody.setId(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
            mailBody.setItemId(resultSet.getString(COLUMN_ITEM_ID_NAME));
            mailBody.setJid(resultSet.getString(COLUMN_JID_NAME));
            mailBody.setMailBody(resultSet.getString(COLUMN_MAIL_BODY));
        } catch (SQLException e) {
            return null;
        }
        return mailBody;
    }

}
