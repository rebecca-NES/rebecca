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
import java.util.Map;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.Data.FollowInfo;

import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.user.User;
import org.jivesoftware.util.Log;
import org.xmpp.packet.JID;

public class FollowStoreDbHelper {

    private FollowStoreDbHelper() {
    }

    private final static String TABLE_NAME = "follow_store";

    private final static String COLUMN_ID_NAME = "id";
    private final static String COLUMN_JID_NAME = "jid";
    private final static String COLUMN_FOLLOW_JID_NAME = "follow_jid";
    private final static String COLUMN_STATUS_NAME = "status";
    private final static String COLUMN_DATE_NAME = "date";

    @SuppressWarnings("deprecation")
    public static boolean insertDb(FollowInfo followInfo) {
        boolean ret = false;
        if (followInfo == null) {
            return ret;
        }
        String sql = getInsertSqlString(followInfo);
        if (sql == null || sql.equals("")) {
            Log.error("insertDb : sql is invalid");
            return ret;
        }
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
    public static boolean updateDbById(FollowInfo followInfo) {
        boolean ret = false;
        if (followInfo == null) {
            return ret;
        }
        String sql = getUpdateSqlByIdString(followInfo);
        if (sql == null || sql.equals("")) {
            Log.error("updateDbById : sql is invalid");
            return ret;
        }
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
    public static List<FollowInfo> selectDbFollowList(String jid) {
        if (jid == null || jid.equals("")) {
            return null;
        }
        String sql = getFollowListSelectSql(jid);
        if (sql == null || sql.equals("")) {
            return null;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        List<FollowInfo> followList = new ArrayList<FollowInfo>();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    followList.add(getFollowInfoByResultSet(resultSet));
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            return null;
        }
        return followList;
    }

    @SuppressWarnings("deprecation")
    public static List<FollowInfo> selectDbFollowerList(String followJid) {
        if (followJid == null || followJid.equals("")) {
            return null;
        }
        String sql = getFollowerListSelectSql(followJid);
        Log.debug("getFollowerListSelectSql : " + sql);

        if (sql == null || sql.equals("")) {
            return null;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        List<FollowInfo> followerList = new ArrayList<FollowInfo>();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    followerList.add(getFollowInfoByResultSet(resultSet));
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            return null;
        }
        return followerList;
    }

    @SuppressWarnings("deprecation")
    public static FollowInfo selectDbByJidAndFollowerJid(String jid,
            String followJid) {
        FollowInfo followInfo = null;
        if (jid == null || jid.equals("")) {
            Log.debug("selectDbByJidAndFollowerJid : Jid is invalid");
            return null;
        }
        if (followJid == null || followJid.equals("")) {
            Log.debug("selectDbByJidAndFollowerJid : followJid is invalid");
            return null;
        }
        String sql = getSelectByJidAndFollowerJidSql(jid, followJid);
        if (sql == null || sql.equals("")) {
            return null;
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
                    followInfo = getFollowInfoByResultSet(resultSet);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            return null;
        }

        return followInfo;
    }

    @SuppressWarnings("deprecation")
    public static boolean physicalDeleteUserDataDBTable(String userName) {
        if (userName == null || userName.equals("")) {
            Log.error("physicalDeleteUserDataDBTable : userName is invalid");
            return false;
        }
        JID userJid = XMPPServer.getInstance().createJID(userName, null);
        String userJidStr = userJid.toBareJID();
        if (userJidStr == null || userJidStr.equals("")) {
            Log.error("physicalDeleteUserDataDBTable : userJidStr is invalid");
            return false;
        }
        String deleteFollowStoreSql = "DELETE FROM " + TABLE_NAME + " WHERE "
                + COLUMN_FOLLOW_JID_NAME + " = '" + userJidStr + "' OR "
                + COLUMN_JID_NAME + " = '" + userJidStr + "'";

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeDelete(deleteFollowStoreSql) == -1) {
                    String errorMessage = String.format(
                            "Failed to delete database (%s)",
                            deleteFollowStoreSql);
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

    @SuppressWarnings("deprecation")
    private final static String getInsertSqlString(FollowInfo followInfo) {
        String sql = "";
        if (followInfo == null) {
            return sql;
        }
        String Jid = followInfo.getJid();
        if (Jid == null || Jid.equals("")) {
            Log.debug("getInsertSqlString : Jid is invalid");
            return sql;
        }
        String followJid = followInfo.getFollowJid();
        if (followJid == null || followJid.equals("")) {
            Log.debug("getInsertSqlString : followJid is invalid");
            return sql;
        }
        int status = followInfo.getStatus();
        String date = followInfo.getDateStr();
        if (date == null || date.equals("")) {
            Log.debug("getInsertSqlString : Date is invalid");
            return sql;
        }

        String columns = COLUMN_JID_NAME + ", " + COLUMN_FOLLOW_JID_NAME + ", "
                + COLUMN_STATUS_NAME + ", " + COLUMN_DATE_NAME;

        String values = "'" + Jid + "', '" + followJid + "', "
                + String.valueOf(status) + ", '" + date + "'";
        sql = "INSERT INTO " + TABLE_NAME + " (" + columns + ") VALUES ("
                + values + ");";
        return sql;
    }

    @SuppressWarnings("deprecation")
    private final static String getUpdateSqlByIdString(FollowInfo followInfo) {
        String sql = "";
        if (followInfo == null) {
            return sql;
        }
        int id = followInfo.getId();
        if (id == 0) {
            Log.debug("getInsertSqlString : id is invalid");
            return sql;
        }
        String Jid = followInfo.getJid();
        if (Jid == null || Jid.equals("")) {
            Log.debug("getInsertSqlString : Jid is invalid");
            return sql;
        }
        String followJid = followInfo.getFollowJid();
        if (followJid == null || followJid.equals("")) {
            Log.debug("getInsertSqlString : followJid is invalid");
            return sql;
        }
        int status = followInfo.getStatus();
        String date = followInfo.getDateStr();
        if (date == null || date.equals("")) {
            Log.debug("getInsertSqlString : Date is invalid");
            return sql;
        }

        String set = COLUMN_JID_NAME + " = '" + Jid + "', "
                + COLUMN_FOLLOW_JID_NAME + " = '" + followJid + "', "
                + COLUMN_STATUS_NAME + " = " + String.valueOf(status) + ", "
                + COLUMN_DATE_NAME + " = '" + date + "'";
        String where = COLUMN_ID_NAME + " = " + String.valueOf(id);

        sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE " + where + ";";
        return sql;
    }

    @SuppressWarnings("deprecation")
    private final static String getFollowListSelectSql(String jid) {
        if (jid == null || jid.equals("")) {
            Log.error("getFollowListSelectSql : jid is invalid");
            return "";
        }
        return String.format("SELECT * FROM %s WHERE %s = '%s';", TABLE_NAME,
                COLUMN_JID_NAME, jid);
    }

    @SuppressWarnings("deprecation")
    private final static String getFollowerListSelectSql(String jid) {
        if (jid == null || jid.equals("")) {
            Log.error("getFollowerListSelectSql : jid is invalid");
            return "";
        }
        return String.format("SELECT * FROM %s WHERE %s = '%s';", TABLE_NAME,
                COLUMN_FOLLOW_JID_NAME, jid);
    }

    @SuppressWarnings("deprecation")
    private final static String getSelectByJidAndFollowerJidSql(String jid,
            String followJid) {
        if (jid == null || jid.equals("")) {
            Log.error("getSelectByJidAndFollowerJidSql : jid is invalid");
            return "";
        }
        if (followJid == null || followJid.equals("")) {
            Log.error("getSelectByJidAndFollowerJidSql : followJid is invalid");
            return "";
        }
        return String.format("SELECT * FROM %s WHERE %s = '%s' AND %s = '%s';",
                TABLE_NAME, COLUMN_JID_NAME, jid, COLUMN_FOLLOW_JID_NAME,
                followJid);
    }

    private static FollowInfo getFollowInfoByResultSet(ResultSet resultSet) {
        FollowInfo followInfo = new FollowInfo();
        try {
            followInfo.setId(resultSet.getInt(COLUMN_ID_NAME));
            followInfo.setJid(resultSet.getString(COLUMN_JID_NAME));
            followInfo
                    .setFollowJid(resultSet.getString(COLUMN_FOLLOW_JID_NAME));
            followInfo.setStatus(resultSet.getInt(COLUMN_STATUS_NAME));
            followInfo.setDate(resultSet.getTimestamp(COLUMN_DATE_NAME));
        } catch (SQLException e) {
            return null;
        }
        return followInfo;
    }

    @SuppressWarnings("deprecation")
    public static List<FollowInfo> getFollowInfoListBeforeFollowEachOther(
            String oneUserName, Map<String, User> targetUsers) {
        List<FollowInfo> ret = new ArrayList<FollowInfo>();

        if (oneUserName == null || oneUserName.equals("")) {
            Log.error("getFollowInfoListBeforeFollowEachOther : oneUserName is invalid");
            return ret;
        }
        if (targetUsers == null) {
            Log.error("getFollowInfoListBeforeFollowEachOther : targetUsers is invalid");
            return ret;
        }
        String sql = getSelectByOneUserNameAndTargetUsersBeforeFollowEachOtherSql(
                oneUserName, targetUsers);
        if (sql == null || sql.equals("")) {
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("getFollowInfoListBeforeFollowEachOther:: Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    FollowInfo followInfo = getFollowInfoByResultSet(resultSet);
                    if (followInfo == null) {
                        Log.warn("getFollowInfoListBeforeFollowEachOther:: Failed to open database");
                        continue;
                    }
                    ret.add(followInfo);
                }
            } catch (SQLException e) {
                Log.error("getFollowInfoListBeforeFollowEachOther:: Failed to get follow list data");
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error("getFollowInfoListBeforeFollowEachOther:: exception occured");
            return ret;
        }

        return ret;
    }

    @SuppressWarnings("deprecation")
    private static String getSelectByOneUserNameAndTargetUsersBeforeFollowEachOtherSql(
            String oneUserName, Map<String, User> targetUsers) {
        if (oneUserName == null || oneUserName.equals("")) {
            Log.error("getSelectByOneUserNameAndTargetUsersBeforeFollowEachOtherSql : oneUserName is invalid");
            return "";
        }
        if (targetUsers == null) {
            Log.error("getSelectByOneUserNameAndTargetUsersBeforeFollowEachOtherSql : targetUsers is invalid");
            return "";
        }
        String dummyTableName = "dummy_table";
        String where = "";
        String oneUserJid = XMPPServer.getInstance()
                .createJID(oneUserName, null).toBareJID();
        Set<String> targetUserSet = targetUsers.keySet();
        boolean isFirst = true;
        for (String targetUserName : targetUserSet) {
            if (targetUserName == null || targetUserName.equals("")) {
                Log.error("getSelectByOneUserNameAndTargetUsersBeforeFollowEachOtherSql : targetOneUser is invalid");
                continue;
            }
            String targetUserJid = XMPPServer.getInstance()
                    .createJID(targetUserName, null).toBareJID();
            if (!isFirst) {
                where += " OR ";
            } else {
                isFirst = false;
            }
            where += "(" + dummyTableName + "." + COLUMN_JID_NAME + "='"
                    + targetUserJid + "' OR " + dummyTableName + "."
                    + COLUMN_FOLLOW_JID_NAME + "='" + targetUserJid + "')";
        }
        if (where.equals("")) {
            Log.error("getSelectByOneUserNameAndTargetUsersBeforeFollowEachOtherSql : where is invalid");
            return "";
        }
        String dummyTableSql = "(SELECT * from " + TABLE_NAME + " where "
                + COLUMN_JID_NAME + "='" + oneUserJid + "' OR "
                + COLUMN_FOLLOW_JID_NAME + "='" + oneUserJid + "') AS "
                + dummyTableName;
        String order = COLUMN_ID_NAME;

        return String.format("SELECT * FROM %s WHERE %s ORDER BY %s;",
                dummyTableSql, where, order);
    }

    @SuppressWarnings("deprecation")
    public static boolean insertDb(List<FollowInfo> followInfoList) {
        boolean ret = false;
        if (followInfoList == null) {
            Log.error("insertDb : followInfoList is invalid");
            return ret;
        }
        String sql = getInsertSqlStringByList(followInfoList);
        if (sql == null || sql.equals("")) {
            Log.error("insertDb : sql is invalid");
            return ret;
        }
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
    private static String getInsertSqlStringByList(
            List<FollowInfo> followInfoList) {
        String sql = "";
        if (followInfoList == null) {
            Log.error("getInsertSqlStringByList : followInfoList is null");
            return sql;
        }
        int count = followInfoList.size();
        if (count <= 0) {
            Log.error("getInsertSqlStringByList : followInfoList count is Zero");
            return sql;
        }
        String values = "";
        boolean isFirst = true;
        for (int i = 0; i < count; i++) {
            FollowInfo followInfo = followInfoList.get(i);
            if (followInfo == null) {
                Log.error("getInsertSqlStringByList : followInfo is null");
                continue;
            }
            String Jid = followInfo.getJid();
            if (Jid == null || Jid.equals("")) {
                Log.error("getInsertSqlStringByList : Jid is invalid");
                continue;
            }
            String followJid = followInfo.getFollowJid();
            if (followJid == null || followJid.equals("")) {
                Log.error("getInsertSqlStringByList : followJid is invalid");
                continue;
            }
            int status = followInfo.getStatus();
            String date = followInfo.getDateStr();
            if (date == null || date.equals("")) {
                Log.error("getInsertSqlStringByList : Date is invalid");
                continue;
            }
            if (isFirst) {
                isFirst = false;
            } else {
                values += ",";
            }
            values += "('" + Jid + "', '" + followJid + "', "
                    + String.valueOf(status) + ", '" + date + "')";
        }

        if (values.equals("")) {
            Log.error("getInsertSqlStringByList : values is empty");
            return sql;
        }

        String columns = "(" + COLUMN_JID_NAME + ", " + COLUMN_FOLLOW_JID_NAME
                + ", " + COLUMN_STATUS_NAME + ", " + COLUMN_DATE_NAME + ")";

        sql = "INSERT INTO " + TABLE_NAME + " " + columns + " VALUES " + values
                + ";";
        return sql;
    }

    @SuppressWarnings("deprecation")
    public static boolean updateDbById(List<FollowInfo> followInfoList) {
        boolean ret = false;
        if (followInfoList == null) {
            Log.error("updateDbById : followInfoList is invalid");
            return ret;
        }
        List<String> sqlList = getUpdateSqlByIdStringList(followInfoList);
        if (sqlList == null) {
            Log.error("updateDbById : sqlList is invalid");
            return ret;
        }
        int count = sqlList.size();
        if (count <= 0) {
            Log.error("updateDbById : sqlList is Zero");
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                ret = true;
                for (int i = 0; i < count; i++) {
                    String sql = sqlList.get(i);
                    if (sql == null || sql.equals("")) {
                        Log.error("updateDbById(List) : sql is invalid");
                        continue;
                    }
                    if (dbHelper.executeUpdate(sql) == -1) {
                        String errorMessage = String.format(
                                "Failed to insert database (%s)", sql);
                        Log.error(errorMessage);
                        ret = false;
                        continue;
                    }
                }
                dbHelper.close();
            } catch (Exception e) {
                return ret;
            }
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    private static List<String> getUpdateSqlByIdStringList(
            List<FollowInfo> followInfoList) {
        List<String> sqlList = new ArrayList<String>();
        if (followInfoList == null) {
            Log.error("getUpdateSqlByIdStringList : followInfoList is null");
            return sqlList;
        }
        int count = followInfoList.size();
        if (count <= 0) {
            Log.error("getUpdateSqlByIdStringList : followInfoList count is Zero");
            return sqlList;
        }
        for (int i = 0; i < count; i++) {
            FollowInfo followInfo = followInfoList.get(i);
            if (followInfo == null) {
                Log.error("getUpdateSqlByIdStringList : followInfo is null");
                continue;
            }
            int id = followInfo.getId();
            if (id == 0) {
                Log.error("getUpdateSqlByIdStringList : id is invalid");
                continue;
            }
            String Jid = followInfo.getJid();
            if (Jid == null || Jid.equals("")) {
                Log.error("getUpdateSqlByIdStringList : Jid is invalid");
                continue;
            }
            String followJid = followInfo.getFollowJid();
            if (followJid == null || followJid.equals("")) {
                Log.error("getUpdateSqlByIdStringList : followJid is invalid");
                continue;
            }
            int status = followInfo.getStatus();
            String date = followInfo.getDateStr();
            if (date == null || date.equals("")) {
                Log.error("getUpdateSqlByIdStringList : Date is invalid");
                continue;
            }

            String set = COLUMN_JID_NAME + " = '" + Jid + "', "
                    + COLUMN_FOLLOW_JID_NAME + " = '" + followJid + "', "
                    + COLUMN_STATUS_NAME + " = " + String.valueOf(status)
                    + ", " + COLUMN_DATE_NAME + " = '" + date + "'";
            String where = COLUMN_ID_NAME + " = " + String.valueOf(id);

            String sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE "
                    + where + ";";
            sqlList.add(sql);
        }
        return sqlList;
    }

}
