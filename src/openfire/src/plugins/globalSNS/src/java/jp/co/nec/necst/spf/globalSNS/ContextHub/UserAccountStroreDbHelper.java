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
import java.util.HashMap;
import java.util.List;
import java.util.Date;
import java.text.SimpleDateFormat;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.UserAccountInfo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class UserAccountStroreDbHelper {
    private static final Logger Log = LoggerFactory
            .getLogger(UserAccountStroreDbHelper.class);

    public static final String TABLE_NAME = "user_account_store";
    public static final String COLUMN_TENANT_UUID = "tenant_uuid";
    public static final String COLUMN_LOGIN_ACCOUNT = "login_account";
    public static final String COLUMN_OPENFIRE_ACCOUNT = "openfire_account";
    public static final String COLUMN_XMPP_SERVER_NAME = "xmpp_server_name";
    private static final String COLUMN_XMPP_MAILADDRESS = "mailaddress";
    private final static String COLUMN_UPDATE_TIME_NAME = "update_time";
    private final static String COLUMN_DELETE_FLG_NAME = "delete_flg";

    private final static String COLUMN_ALIAS_JID_NAME = "jid";

    public static UserAccountInfo getUserAccountInfo(String loginAccount) {

        if (loginAccount == null) {
            return null;
        }
        String sql = getSelectSqlString(loginAccount);
        if (sql == null || sql.equals("")) {
            Log.error("getUserAccountInfo : sql is invalid");
            return null;
        }

        UserAccountInfo userAccountInfo = null;
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
                    userAccountInfo = new UserAccountInfo();

                    userAccountInfo.setLoginAccount(resultSet
                            .getString(COLUMN_LOGIN_ACCOUNT));
                    userAccountInfo.setOpenfireAccount(resultSet
                            .getString(COLUMN_OPENFIRE_ACCOUNT));
                    userAccountInfo.setXmppServerName(resultSet
                            .getString(COLUMN_XMPP_SERVER_NAME));
                    userAccountInfo.setDeleteFlg(resultSet
                            .getInt(COLUMN_DELETE_FLG_NAME));
                }
            } catch (SQLException e) {
                Log.error("Failed to get getUserAccountInfo : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return userAccountInfo;
    }

    private static String getSelectSqlString(String loginAccount) {
        String sql = "";
        if (loginAccount == null || loginAccount.equals("")) {
            return sql;
        }
        StringBuffer sqlbuf = new StringBuffer();
        sqlbuf.append("SELECT ");
        sqlbuf.append(COLUMN_LOGIN_ACCOUNT).append(", ");
        sqlbuf.append(COLUMN_OPENFIRE_ACCOUNT).append(", ");
        sqlbuf.append(COLUMN_XMPP_SERVER_NAME).append(", ");
        sqlbuf.append(COLUMN_DELETE_FLG_NAME);
        sqlbuf.append(" FROM ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append(" WHERE ");
        sqlbuf.append(COLUMN_LOGIN_ACCOUNT).append(" = '")
                .append(GlobalSNSUtils.escapeSqlData(loginAccount)).append("'");
        sqlbuf.append(" AND ");
        sqlbuf.append(COLUMN_TENANT_UUID).append(" = '")
                .append(GlobalSNSUtils.escapeSqlData(GlobalSNSDataBaseHelper.getTenantUuid())).append("'");
        sql = sqlbuf.toString();
        return sql;
    }

    public static UserAccountInfo getUserAccountInfoByJid(String jid) {
        if (jid == null) {
            return null;
        }
        HashMap<String, String> openfireAccountAndXmppServer = getOpenfireAccountAndXmppServerByJid(jid);

        String openfireAccount = openfireAccountAndXmppServer
                .get(COLUMN_OPENFIRE_ACCOUNT);
        String xmppServerName = openfireAccountAndXmppServer
                .get(COLUMN_XMPP_SERVER_NAME);
        String sql = getSelectSqlStringByOpenfireAccountAndXmppserver(
                openfireAccount, xmppServerName);
        if (sql == null || sql.equals("")) {
            Log.error("getUserAccountInfoByJid : sql is invalid");
            return null;
        }
        UserAccountInfo userAccountInfo = null;
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
                    userAccountInfo = new UserAccountInfo();

                    userAccountInfo.setLoginAccount(resultSet
                            .getString(COLUMN_LOGIN_ACCOUNT));
                    userAccountInfo.setOpenfireAccount(resultSet
                            .getString(COLUMN_OPENFIRE_ACCOUNT));
                    userAccountInfo.setXmppServerName(resultSet
                            .getString(COLUMN_XMPP_SERVER_NAME));
                    userAccountInfo.setDeleteFlg(resultSet
                            .getInt(COLUMN_DELETE_FLG_NAME));
                }
            } catch (SQLException e) {
                Log.error("Failed to get getUserAccountInfo : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return userAccountInfo;
    }

    private static HashMap<String, String> getOpenfireAccountAndXmppServerByJid(
            String jid) {
        if (jid == null || jid.equals("")) {
            return null;
        }
        JID jidObj = new JID(jid);
        String openfireAccount = jidObj.getNode();
        String xmppServerName = jidObj.getDomain();

        HashMap<String, String> openfireAccountAndXmppServer = new HashMap<String, String>();
        openfireAccountAndXmppServer.put(COLUMN_OPENFIRE_ACCOUNT,
                openfireAccount);
        openfireAccountAndXmppServer.put(COLUMN_XMPP_SERVER_NAME,
                xmppServerName);
        return openfireAccountAndXmppServer;
    }

    private static String getSelectSqlStringByOpenfireAccountAndXmppserver(
            String openfireAccount, String xmppServer) {
        String sql = "";
        if (openfireAccount == null || openfireAccount.equals("")) {
            return sql;
        }
        if (xmppServer == null || xmppServer.equals("")) {
            return sql;
        }
        StringBuffer sqlbuf = new StringBuffer();
        sqlbuf.append("SELECT ");
        sqlbuf.append(COLUMN_LOGIN_ACCOUNT).append(", ");
        sqlbuf.append(COLUMN_OPENFIRE_ACCOUNT).append(", ");
        sqlbuf.append(COLUMN_XMPP_SERVER_NAME).append(", ");
        sqlbuf.append(COLUMN_DELETE_FLG_NAME);
        sqlbuf.append(" FROM ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append(" WHERE ");
        sqlbuf.append(COLUMN_OPENFIRE_ACCOUNT).append(" = '")
                .append(GlobalSNSUtils.escapeSqlData(openfireAccount))
                .append("'");
        sqlbuf.append(" AND ");
        sqlbuf.append(COLUMN_XMPP_SERVER_NAME).append(" = '")
                .append(GlobalSNSUtils.escapeSqlData(xmppServer)).append("'");
        sql = sqlbuf.toString();
        return sql;
    }

    public static boolean updateUserAccountDeletFlgDataToDb(int deleteFlg,
                                                            String openfireAccount){
        if(deleteFlg != UserAccountInfo.DELETE_FLAG_STATUS_NOMAL &&
           deleteFlg != UserAccountInfo.DELETE_FLAG_STATUS_DELETED &&
           deleteFlg != UserAccountInfo.DELETE_FLAG_STATUS_SUSPEND){
            Log.error("updateUserAccountDeletFlgDataToDb : deleteFlg is invalid");
            return false;
        }

        if (openfireAccount == null ||
            openfireAccount.equals("") ||
            ! openfireAccount.matches("^[A-Za-z0-9_.*!#$%&+-]+$")) {
            Log.error("updateUserAccountDeletFlgDataToDb : openfireAccount is invalid");
            return false;
        }

        String sql = getUserAccountUpdataDeletFlgSql(deleteFlg,
                                                     openfireAccount);
        if (sql.equals("")) {
            Log.error("updateUserAccountDeletFlgDataToDb : sql is invalid");
            return false;
        }
        GlobalSNSManagerDataBaseHelper dbHelper
            = GlobalSNSManagerDataBaseHelper.getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeInsert(sql) == -1) {
                    String errorMessage
                        = String.format("Failed to update database (%s)", sql);
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
    };

    private final static String getUserAccountUpdataDeletFlgSql(int deleteFlg,
                                                                String openfireAccount){
        if(deleteFlg != UserAccountInfo.DELETE_FLAG_STATUS_NOMAL &&
           deleteFlg != UserAccountInfo.DELETE_FLAG_STATUS_SUSPEND){
            Log.error("getUserAccountUpdataDeletFlgSql : deleteFlg is invalid");
            return "";
        }

        if (openfireAccount == null ||
            openfireAccount.equals("") ||
            ! openfireAccount.matches("^[A-Za-z0-9_.*!#$%&+-]+$")) {
            Log.error("getUserAccountUpdataDeletFlgSql : openfireAccount is invalid");
            return "";
        }

        Date date = new Date();
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");

        String tenantUUID = GlobalSNSUtils.escapeSqlData(GlobalSNSDataBaseHelper.getTenantUuid());

        return "UPDATE " + TABLE_NAME
            + " SET "
            + " update_time = '" + df.format(date) + "',"
            + " delete_flg = '" + deleteFlg + "'"
            + " WHERE "
            + " openfire_account = '" + GlobalSNSUtils.escapeSqlData(openfireAccount) + "' and "
            + " tenant_uuid = '" + tenantUUID + "';";
    }

    public static boolean insertUserAccountInfoDataToDb(
            UserAccountInfo userAccountInfo) {
        if (userAccountInfo == null) {
            Log.error("insertUserAccountInfoDataToDb : userAccountInfo is invalid");
            return false;
        }
        String sql = getUserAccountInsertSql(userAccountInfo);
        if (sql == null || sql.equals("")) {
            Log.error("insertUserAccountInfoDataToDb : sql is invalid");
            return false;
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
                    return false;
                }
                dbHelper.close();
            } catch (Exception e) {
                return false;
            }
        }
        return true;
    }

    private final static String getUserAccountInsertSql(
            UserAccountInfo userAccountInfo) {
        String loginAccount = userAccountInfo.getLoginAccount();
        if (loginAccount == null || loginAccount.equals("")) {
            Log.error("getUserAccountInsertSql : loginAccount is invalid");
            return "";
        }
        String openfireAccount = userAccountInfo.getOpenfireAccount();
        if (openfireAccount == null || openfireAccount.equals("")) {
            Log.error("getUserAccountInsertSql : openfireAccount is invalid");
            return "";
        }
        String xmppServerName = userAccountInfo.getXmppServerName();
        if (xmppServerName == null || xmppServerName.equals("")) {
            Log.error("getUserAccountInsertSql : xmppAerverName is invalid");
            return "";
        }
        String mailaddress = userAccountInfo.getEmail();
        if (mailaddress == null) {
            Log.error("getUserAccountInsertSql : mailaddress is invalid");
            return "";
        }
        String Date = userAccountInfo.getDateStr();
        if (Date == null || Date.equals("")) {
            Log.error("getUserAccountInsertSql : Date is invalid");
            return "";
        }
        int deleteFlg = userAccountInfo.getDeleteFlg();
        if (deleteFlg != 0 && deleteFlg != 1) {
            Log.error("getUserAccountInsertSql : deleteFlg is invalid");
            return "";
        }
        StringBuffer sqlbuf = new StringBuffer();
        sqlbuf.append("INSERT INTO ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append(" (");
        sqlbuf.append(COLUMN_TENANT_UUID).append(", ");
        sqlbuf.append(COLUMN_LOGIN_ACCOUNT).append(", ");
        sqlbuf.append(COLUMN_OPENFIRE_ACCOUNT).append(", ");
        sqlbuf.append(COLUMN_XMPP_SERVER_NAME).append(", ");
        sqlbuf.append(COLUMN_XMPP_MAILADDRESS).append(", ");
        sqlbuf.append(COLUMN_UPDATE_TIME_NAME).append(", ");
        sqlbuf.append(COLUMN_DELETE_FLG_NAME);
        sqlbuf.append(" ) VALUES (");
        sqlbuf.append("'").append(GlobalSNSUtils.escapeSqlData(GlobalSNSDataBaseHelper.getTenantUuid())).append("', ");
        sqlbuf.append("'").append(loginAccount).append("', ");
        sqlbuf.append("'").append(openfireAccount).append("', ");
        sqlbuf.append("'").append(xmppServerName).append("', ");
        sqlbuf.append("'").append(mailaddress).append("', ");
        sqlbuf.append("'").append(Date).append("', ");
        sqlbuf.append("'").append(deleteFlg).append("' ");
        sqlbuf.append(");");
        return sqlbuf.toString();
    }

    public static ArrayList<UserAccountInfo> getDeletedUserAccountInfoList(
            String xmppServerName) {

        if (xmppServerName == null) {
            return null;
        }
        String sql = getSelectDeleteAccountSqlString(xmppServerName);
        if (sql == null || sql.equals("")) {
            Log.error("getUserAccountInfo : sql is invalid");
            return null;
        }

        ArrayList<UserAccountInfo> userAccountInfoList = new ArrayList<UserAccountInfo>();
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
                    UserAccountInfo userAccountInfo = new UserAccountInfo();
                    userAccountInfo.setLoginAccount(resultSet
                            .getString(COLUMN_LOGIN_ACCOUNT));
                    userAccountInfo.setOpenfireAccount(resultSet
                            .getString(COLUMN_OPENFIRE_ACCOUNT));
                    userAccountInfo.setXmppServerName(resultSet
                            .getString(COLUMN_XMPP_SERVER_NAME));
                    userAccountInfo.setDeleteFlg(resultSet
                            .getInt(COLUMN_DELETE_FLG_NAME));
                    userAccountInfo.setEmail(resultSet
                            .getString(COLUMN_XMPP_MAILADDRESS));
                }
            } catch (SQLException e) {
                Log.error("Failed to get getUserAccountInfo : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return userAccountInfoList;
    }

    private static String getSelectDeleteAccountSqlString(String xmppServerName) {
        String sql = "";
        if (xmppServerName == null || xmppServerName.equals("")) {
            return sql;
        }
        StringBuffer sqlbuf = new StringBuffer();
        sqlbuf.append("SELECT ");
        sqlbuf.append(COLUMN_LOGIN_ACCOUNT).append(", ");
        sqlbuf.append(COLUMN_OPENFIRE_ACCOUNT).append(", ");
        sqlbuf.append(COLUMN_XMPP_SERVER_NAME).append(", ");
        sqlbuf.append(COLUMN_DELETE_FLG_NAME);
        sqlbuf.append(COLUMN_XMPP_MAILADDRESS);
        sqlbuf.append(" FROM ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append(" WHERE ");
        sqlbuf.append(COLUMN_XMPP_SERVER_NAME).append(" = '")
                .append(GlobalSNSUtils.escapeSqlData(xmppServerName))
                .append("'");
        sqlbuf.append(" AND ");
        sqlbuf.append(COLUMN_DELETE_FLG_NAME);
        sqlbuf.append(" = 1");
        sql = sqlbuf.toString();
        return sql;
    }

    public static List<String> searchJidListByFuzzyAccountName(
            String fuzzyAccountName) {
        List<String> ret = null;
        if (fuzzyAccountName == null || "".equals(fuzzyAccountName)) {
            Log.error("UserAccountStroreDbHelper#searchJidListByFuzzyAccountName::fuzzyAccountName is invalid");
            return ret;
        }
        String sql = getJidListByFuzzyAccountNameSelectSql(fuzzyAccountName);
        if (sql == null || "".equals(sql)) {
            Log.error("UserAccountStroreDbHelper#searchJidListByFuzzyAccountName::sql is invalid");
            return ret;
        }
        GlobalSNSManagerDataBaseHelper dbHelper = GlobalSNSManagerDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                ret = new ArrayList<String>();
                while (resultSet.next()) {
                    try {
                        String jid = resultSet.getString(COLUMN_ALIAS_JID_NAME);
                        if (jid == null) {
                            Log.warn("UserAccountStroreDbHelper#searchJidListByFuzzyAccountName::gotten jid is null... continue.");
                            continue;
                        }
                        ret.add(jid);
                    } catch (SQLException e) {
                        Log.error("UserAccountStroreDbHelper#searchJidListByFuzzyAccountName::faild to get jid... continue.");
                        continue;
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    private static String getJidListByFuzzyAccountNameSelectSql(
            String fuzzyAccountName) {
        String ret = null;
        if (fuzzyAccountName == null || "".equals(fuzzyAccountName)) {
            Log.error("UserAccountStroreDbHelper#getJidListByFuzzyAccountNameSelectSql::fuzzyNickname is invalid");
            return ret;
        }
        String escapedValueForRegexpPhrase = GlobalSNSUtils
                .escapeSqlDataForRegexpPhrase(fuzzyAccountName);
        if (escapedValueForRegexpPhrase == null
                || "".equals(escapedValueForRegexpPhrase)) {
            Log.error("UserAccountStroreDbHelper#getJidListByFuzzyAccountNameSelectSql::escapedValueForRegexpPhrase is invalid");
            return ret;
        }
        ret = "SELECT (" + COLUMN_OPENFIRE_ACCOUNT + " || '@' || "
                + COLUMN_XMPP_SERVER_NAME + ")" + " AS "
                + COLUMN_ALIAS_JID_NAME + " FROM " + TABLE_NAME + " WHERE ("
                + COLUMN_TENANT_UUID + " = '" + GlobalSNSUtils.escapeSqlData(GlobalSNSDataBaseHelper.getTenantUuid()) + "' AND "
                + COLUMN_LOGIN_ACCOUNT + " ~ E'^.*"
                + escapedValueForRegexpPhrase + ".*$');";
        return ret;
    }

}
