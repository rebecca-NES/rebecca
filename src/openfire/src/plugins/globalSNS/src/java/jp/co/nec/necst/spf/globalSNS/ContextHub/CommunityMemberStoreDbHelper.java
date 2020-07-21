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
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityMember;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CommunityMemberStoreDbHelper {
    private static final Logger Log = LoggerFactory
            .getLogger(CommunityMemberStoreDbHelper.class);
    public final static String TABLE_NAME = "community_member_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_ROOM_ID_NAME = "room_id";
    public final static String COLUMN_JID_NAME = "jid";
    public final static String COLUMN_STATE_NAME = "state";
    private final static String COLUMN_ROLE_NAME = "role";
    private final static String COLUMN_JOIN_DATE_NAME = "join_date";
    private final static String COLUMN_LEAVE_DATE_NAME = "leave_date";

    public static boolean insertCommunityMemberToDb(CommunityMember member) {
        if (member == null) {
            Log.error("member is null");
            return false;
        }
        String sql = createIsnertDataSql(member);
        if (sql == null || sql.equals("")) {
            Log.error("sql is invalid");
            return false;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            boolean dbOpend = false;
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                dbOpend = true;
                if (dbHelper.executeInsert(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to insert database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    return false;
                }
                dbHelper.close();
            } catch (Exception e) {
                if (dbOpend) {
                    dbHelper.close();
                }
                return false;
            }
        }
        return true;

    }

    public static List<CommunityMember> getJoinMemberList(String roomId) {
        List<CommunityMember> retList = new ArrayList<CommunityMember>();
        if (roomId == null) {
            Log.error("CommunityMemberStoreDbHelper#getMemberList - roomId is null");
            return retList;
        }
        String sql = getCommunityJoinMemberSelectSqlByRoomId(roomId);
        if (sql == null || sql.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#getMemberList - sql is invalid");
            return retList;
        }
        return getCommunityMemberListBySqlString(sql);
    }

    public static List<CommunityMember> getMemberList(String roomId) {
        List<CommunityMember> retList = new ArrayList<CommunityMember>();
        if (roomId == null) {
            Log.error("CommunityMemberStoreDbHelper#getMemberList - roomId is null");
            return retList;
        }
        String sql = getCommunityMemberSelectSqlByRoomId(roomId);
        if (sql == null || sql.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#getMemberList - sql is invalid");
            return retList;
        }
        return getCommunityMemberListBySqlString(sql);
    }

    private static String getCommunityJoinMemberSelectSqlByRoomId(String roomId) {
        if (roomId == null) {
            return "";
        }

        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where += "(" + COLUMN_ROOM_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(roomId) + "' AND "
                + COLUMN_STATE_NAME + "=" + CommunityMember.STATE_JOIN + ")";
        sql += where;
        String order = " ORDER BY " + COLUMN_ID_NAME + " ASC";
        sql += order;
        return sql;
    }

    private static String getCommunityMemberSelectSqlByRoomId(String roomId) {
        if (roomId == null) {
            return "";
        }

        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where += "(" + COLUMN_ROOM_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(roomId) + ")";
        sql += where;
        String order = " ORDER BY " + COLUMN_ID_NAME + " ASC";
        sql += order;
        return sql;
    }

    private static List<CommunityMember> getCommunityMemberListBySqlString(
            String sql) {
        List<CommunityMember> retList = new ArrayList<CommunityMember>();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#getCommunityMemberListBySqlString - sql is invalid");
            return retList;
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
                    CommunityMember communityMember = getOneCommunityMemberByResultSet(resultSet);
                    if (communityMember != null) {
                        retList.add(communityMember);
                    }
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
        return retList;
    }

    private static CommunityMember getOneCommunityMemberByResultSet(
            ResultSet resultSet) {
        CommunityMember communityMember = new CommunityMember();
        try {
            communityMember.setId(new BigInteger(resultSet
                    .getString(COLUMN_ID_NAME)));
            communityMember.setRoomId(resultSet.getString(COLUMN_ROOM_ID_NAME));
            communityMember.setJid(resultSet.getString(COLUMN_JID_NAME));
            communityMember.setState(resultSet.getInt(COLUMN_STATE_NAME));
            communityMember.setRole(resultSet.getInt(COLUMN_ROLE_NAME));
            communityMember.setJoinDate(resultSet
                    .getTimestamp(COLUMN_JOIN_DATE_NAME));
            communityMember.setLeaveDate(resultSet
                    .getTimestamp(COLUMN_LEAVE_DATE_NAME));
        } catch (SQLException e) {
            return null;
        }
        return communityMember;
    }

    public static List<String> getJoinedCommunityIdList(String jid) {
        List<String> retList = new ArrayList<String>();
        if (jid == null) {
            Log.error("CommunityMemberStoreDbHelper#getJoinedCommunityIdList - jid is null");
            return retList;
        }
        String sql = getCommunityIdListSelectSqlByJid(jid);
        if (sql == null || sql.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#getJoinedCommunityIdList - sql is invalid");
            return retList;
        }
        return getCommunityIdListBySqlString(sql);
    }

    private static String getCommunityIdListSelectSqlByJid(String jid) {
        if (jid == null) {
            return "";
        }

        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + " FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where += TABLE_NAME + "." + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(jid) + "' AND "
                + TABLE_NAME + "." + COLUMN_STATE_NAME + "="
                + CommunityMember.STATE_JOIN;
        sql += where;
        String order = " ORDER BY " + TABLE_NAME + "." + COLUMN_ID_NAME + " DESC";
        sql += order;
        return sql;
    }

    public static String getCommunityIdListSelectSqlByJidNonOrder(String jid) {
        if (jid == null) {
            return "";
        }

        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + " FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where += TABLE_NAME + "." + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(jid) + "' AND "
                + TABLE_NAME + "." + COLUMN_STATE_NAME + "="
                + CommunityMember.STATE_JOIN;
        sql += where;
        return sql;
    }

    public static String getJoinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder(String jid) {
        if (jid == null) {
            return "";
        }

        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + " FROM " + TABLE_NAME +
                     " JOIN " + CommunityStoreDbHelper.TABLE_NAME + " ON " +
                     TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + "=" + CommunityStoreDbHelper.TABLE_NAME + "." + CommunityStoreDbHelper.COLUMN_ROOM_ID_NAME +
                     " WHERE ";
        String where = "";
        where += "(" + TABLE_NAME + "." + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(jid) + "' AND "
                + TABLE_NAME + "." + COLUMN_STATE_NAME + "="
                + CommunityMember.STATE_JOIN + " AND "
                + CommunityStoreDbHelper.TABLE_NAME + "." + CommunityStoreDbHelper.COLUMN_NOTIFY_TYPE_NAME
                + ">" + CommunityInfo.NOTIFY_TYPE_ALL_ON + " AND "
                + CommunityStoreDbHelper.TABLE_NAME + "." + CommunityStoreDbHelper.COLUMN_DELETE_FLAG_NAME
                + "=" + CommunityInfo.DELETE_FLAG_NOT_DELETED
                + ")";
        sql += where;
        return sql;
    }

    private static List<String> getCommunityIdListBySqlString(
            String sql) {
        List<String> retList = new ArrayList<String>();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#getCommunityIdListBySqlString - sql is invalid");
            return retList;
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
                    String roomId = resultSet.getString(COLUMN_ROOM_ID_NAME);
                    if (roomId != null) {
                        retList.add(roomId);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get room id");
            }
            dbHelper.close();
        } catch (Exception e) {
            if (dbOpend) {
                dbHelper.close();
            }
        }
        return retList;
    }

    public static boolean updateOrInsertCommunityMemberToDb(
            List<CommunityMember> addMemberList) {
        boolean ret = false;
        if (addMemberList == null) {
            Log.error("CommunityMemberStoreDbHelper#updateOrInsertCommunityMemberToDb::addMemberList is null");
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            boolean dbOpend = false;
            boolean isAllRight = true;
            try {
                if (!dbHelper.open()) {
                    Log.error("CommunityMemberStoreDbHelper#updateOrInsertCommunityMemberToDb::Failed to open database");
                    throw new Exception("Failed to open database");
                }
                dbOpend = true;
                for (CommunityMember member : addMemberList) {
                    String sql = "";
                    int executeResult = -1;
                    CommunityMember existMemberData = getCommunityMemberBySqlStringAlreadyDbOpened(
                            dbHelper, member.getRoomId(), member.getJid());
                    if (existMemberData == null) {
                        sql = createIsnertDataSql(member);
                        if (sql == null || sql.equals("")) {
                            isAllRight = false;
                            Log.error("CommunityMemberStoreDbHelper#updateOrInsertCommunityMemberToDb::insert sql is invalid");
                            continue;
                        }
                        executeResult = dbHelper.executeInsert(sql);
                    } else {
                        member.setId(existMemberData.getId());
                        sql = createUpdateDataSql(member);
                        if (sql == null || sql.equals("")) {
                            isAllRight = false;
                            Log.error("CommunityMemberStoreDbHelper#updateOrInsertCommunityMemberToDb::update sql is invalid");
                            continue;
                        }
                        executeResult = dbHelper.executeUpdate(sql);
                    }
                    if (executeResult == -1) {
                        String errorMessage = String
                                .format("Failed to insert or update database (%s)",
                                        sql);
                        Log.error(errorMessage);
                        isAllRight = false;
                        continue;
                    }
                }
                dbHelper.close();
            } catch (Exception e) {
                if (dbOpend) {
                    dbHelper.close();
                }
                return false;
            }
            ret = isAllRight;
        }
        return ret;
    }

    private static String createIsnertDataSql(CommunityMember member) {
        String ret = "";
        String roomId = member.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#createIsnertDataSql::roomId is invalid");
            return ret;
        }
        String jid = member.getJid();
        if (jid == null || jid.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#createIsnertDataSql::jid is invalid");
            return ret;
        }
        String sqlRoomId = "'" + GlobalSNSUtils.escapeSqlData(roomId) + "'";
        String sqlJid = "'" + GlobalSNSUtils.escapeSqlData(jid) + "'";
        String sqlStateStr = "" + member.getState();
        String sqlRoleStr = "" + member.getRole();
        String joinDateStr = member.getJoinDateStr();
        String sqlJoinDateStr = "NULL";
        if (!joinDateStr.equals("")) {
            sqlJoinDateStr = "'" + joinDateStr + "'";
        }
        String leaveDateStr = member.getLeaveDateStr();
        String sqlLeaveDateStr = "NULL";
        if (!leaveDateStr.equals("")) {
            sqlLeaveDateStr = "'" + leaveDateStr + "'";
        }

        String columns = COLUMN_ROOM_ID_NAME + ", " + COLUMN_JID_NAME + ", "
                + COLUMN_STATE_NAME + ", " + COLUMN_ROLE_NAME + ", "
                + COLUMN_JOIN_DATE_NAME + ", " + COLUMN_LEAVE_DATE_NAME;
        String values = sqlRoomId + ", " + sqlJid + ", " + sqlStateStr + ", "
                + sqlRoleStr + ", " + sqlJoinDateStr + ", " + sqlLeaveDateStr;
        String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                + ") VALUES (" + values + ");";
        ret = sql;
        return ret;
    }

    private static String createUpdateDataSql(CommunityMember member) {
        String ret = "";
        String roomId = member.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#createUpdateDataSql::roomId is invalid");
            return ret;
        }
        String jid = member.getJid();
        if (jid == null || jid.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#createUpdateDataSql::jid is invalid");
            return ret;
        }
        String sqlRoomId = "'" + GlobalSNSUtils.escapeSqlData(roomId) + "'";
        String sqlJid = "'" + GlobalSNSUtils.escapeSqlData(jid) + "'";
        String sqlStateStr = "" + member.getState();
        String sqlRoleStr = "" + member.getRole();
        String joinDateStr = member.getJoinDateStr();
        String sqlJoinDateStr = "NULL";
        if (!joinDateStr.equals("")) {
            sqlJoinDateStr = "'" + joinDateStr + "'";
        }
        String leaveDateStr = member.getLeaveDateStr();
        String sqlLeaveDateStr = "NULL";
        if (!leaveDateStr.equals("")) {
            sqlLeaveDateStr = "'" + leaveDateStr + "'";
        }

        String sql = "UPDATE " + TABLE_NAME + " SET " + COLUMN_ROOM_ID_NAME
                + "=" + sqlRoomId + ", " + COLUMN_JID_NAME + "=" + sqlJid
                + ", " + COLUMN_STATE_NAME + "=" + sqlStateStr + ", "
                + COLUMN_ROLE_NAME + "=" + sqlRoleStr + ", "
                + COLUMN_JOIN_DATE_NAME + "=" + sqlJoinDateStr + ", "
                + COLUMN_LEAVE_DATE_NAME + "=" + sqlLeaveDateStr + " WHERE "
                + COLUMN_ID_NAME + "=" + String.valueOf(member.getId());
        ret = sql;
        return ret;
    }

    private static String getCommunityMemberSelectSqlByRoomId(String roomId,
            String jidStr) {
        if (roomId == null) {
            return "";
        }
        if (jidStr == null) {
            return "";
        }

        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where += "(" + COLUMN_ROOM_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(roomId) + "' AND "
                + COLUMN_JID_NAME + "='" + GlobalSNSUtils.escapeSqlData(jidStr)
                + "')";
        sql += where;
        String order = " ORDER BY " + COLUMN_ID_NAME + " ASC";
        sql += order;
        return sql;
    }

    public static boolean isMemberOfRoomId(String roomId, String jid) {
        boolean ret = false;
        if (roomId == null) {
            Log.error("CommunityMemberStoreDbHelper#isMemberOfRoomId::roomId is null");
            return ret;
        }
        if (jid == null) {
            Log.error("CommunityMemberStoreDbHelper#isMemberOfRoomId::jid is null");
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            boolean dbOpend = false;
            try {
                if (!dbHelper.open()) {
                    Log.error("CommunityMemberStoreDbHelper#isMemberOfRoomId::Failed to open database");
                    throw new Exception("Failed to open database");
                }
                dbOpend = true;
                CommunityMember existMemberData
                    = getCommunityMemberBySqlStringAlreadyDbOpened
                    (dbHelper, roomId, jid);
                if (existMemberData == null ||
                    existMemberData.getJid() == null ||
                    existMemberData.getJid().length() <= 0) {
                    Log.error("CommunityMemberStoreDbHelper#isMemberOfRoomId::insert sql is invalid");
                } else {
                    ret = true;
                }
                dbHelper.close();
                dbOpend = false;
            } catch (Exception e) {
                if (dbOpend) {
                    dbHelper.close();
                }
            }
        }
        return ret;
    }


    private static CommunityMember getCommunityMemberBySqlStringAlreadyDbOpened(
            GlobalSNSDataBaseHelper dbHelper, String roomId, String jidStr) {
        CommunityMember ret = null;
        String sql = getCommunityMemberSelectSqlByRoomId(roomId, jidStr);
        if (sql == null) {
            Log.error("CommunityMemberStoreDbHelper#getCommunityMemberBySqlStringAlreadyDbOpened - sql is invalid");
            return ret;
        }
        List<CommunityMember> retList = getCommunityMemberListBySqlStringAlreadyDbOpened(
                dbHelper, sql);
        if (retList == null || retList.size() <= 0) {
            return ret;
        }
        ret = retList.get(0);
        return ret;
    }

    private static List<CommunityMember> getCommunityMemberListBySqlStringAlreadyDbOpened(
            GlobalSNSDataBaseHelper dbHelper, String sql) {
        List<CommunityMember> retList = new ArrayList<CommunityMember>();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#getCommunityMemberListBySqlStringAlreadyDbOpened - sql is invalid");
            return retList;
        }
        try {
            ResultSet resultSet = dbHelper.executeQuery(sql);
            while (resultSet.next()) {
                CommunityMember communityMember = getOneCommunityMemberByResultSet(resultSet);
                if (communityMember != null) {
                    retList.add(communityMember);
                }
            }
        } catch (SQLException e) {
            Log.error("Failed to get message data");
        }
        return retList;
    }

    public static boolean updateCommunityMemberToDb(
            List<CommunityMember> updateMemberList) {
        boolean ret = false;
        if (updateMemberList == null) {
            Log.error("CommunityMemberStoreDbHelper#updateCommunityMemberToDb::updateMemberList is null");
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            boolean dbOpend = false;
            boolean isAllRight = true;
            try {
                if (!dbHelper.open()) {
                    Log.error("CommunityMemberStoreDbHelper#updateCommunityMemberToDb::Failed to open database");
                    throw new Exception("Failed to open database");
                }
                dbOpend = true;
                for (CommunityMember member : updateMemberList) {
                    String sql = "";
                    sql = createUpdateDataSql(member);
                    if (sql == null || sql.equals("")) {
                        isAllRight = false;
                        Log.error("CommunityMemberStoreDbHelper#updateCommunityMemberToDb::update sql is invalid");
                        continue;
                    }
                    if (dbHelper.executeUpdate(sql) == -1) {
                        String errorMessage = String
                                .format("Failed to insert or update database (%s)",
                                        sql);
                        Log.error(errorMessage);
                        isAllRight = false;
                        continue;
                    }
                }
                dbHelper.close();
            } catch (Exception e) {
                if (dbOpend) {
                    dbHelper.close();
                }
                return false;
            }
            ret = isAllRight;
        }
        return ret;
    }

    public static List<String> getJoinedAllCommunityMemberJidList(String jid) {
        List<String> ret = null;
        if (jid == null || "".equals(jid)) {
            Log.error("CommunityMemberStoreDbHelper#getJoinedAllCommunityMemberJidList - jid is null or empty");
            return ret;
        }
        String ownJoinedCommunityRoomsSql = "SELECT " + COLUMN_ROOM_ID_NAME
                + " FROM " + TABLE_NAME + " WHERE " + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(jid) + "' AND "
                + COLUMN_STATE_NAME + "=1;";
        List<String> joinedRoomIdList = getCommuniryRoomIdListBySqlString(ownJoinedCommunityRoomsSql);
        if (joinedRoomIdList == null) {
            Log.error("CommunityMemberStoreDbHelper#getJoinedAllCommunityMemberJidList - joinedRoomIdList is null");
            return ret;
        }
        if (joinedRoomIdList.isEmpty()) {
            Log.debug("CommunityMemberStoreDbHelper#getJoinedAllCommunityMemberJidList - joinedRoomIdList is empty");
            ret = new ArrayList<String>();
            return ret;
        }
        String inOperatorStr = GlobalSNSUtils
                .convertListToStringforInOperator(joinedRoomIdList);
        if (inOperatorStr == null || "".equals(inOperatorStr)) {
            Log.info("CommunityMemberStoreDbHelper#getJoinedAllCommunityMemberJidList - inOperatorStr is empty");
            ret = new ArrayList<String>();
            return ret;
        }
        String allOwnJoinedCommunityRoomMembersSql = "SELECT "
                + COLUMN_JID_NAME + " FROM " + TABLE_NAME + " WHERE "
                + COLUMN_ROOM_ID_NAME + " IN (" + inOperatorStr + ") AND "
                + COLUMN_JID_NAME + "<>'" + jid + "' AND " + COLUMN_STATE_NAME
                + "=1 GROUP BY " + COLUMN_JID_NAME + ";";
        ret = getCommunityMemberJidListBySqlString(allOwnJoinedCommunityRoomMembersSql);
        return ret;
    }

    private static List<String> getCommuniryRoomIdListBySqlString(String sql) {
        List<String> retList = new ArrayList<String>();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#getCommuniryRoomIdListBySqlString - sql is invalid");
            return retList;
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
                    try {
                        String roomId = resultSet
                                .getString(COLUMN_ROOM_ID_NAME);
                        retList.add(roomId);
                    } catch (SQLException e) {
                        Log.error("Failed to get roomId. sql=" + sql);
                        continue;
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get roomId data. sql=" + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
            if (dbOpend) {
                dbHelper.close();
            }
        }
        return retList;
    }

    private static List<String> getCommunityMemberJidListBySqlString(String sql) {
        List<String> retList = new ArrayList<String>();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityMemberStoreDbHelper#getChatRoomMemberJidListBySqlString - sql is invalid");
            return retList;
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
                    try {
                        String jid = resultSet.getString(COLUMN_JID_NAME);
                        retList.add(jid);
                    } catch (SQLException e) {
                        Log.error("Failed to get jid. sql=" + sql);
                        continue;
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get jid data. sql=" + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
            if (dbOpend) {
                dbHelper.close();
            }
        }
        return retList;
    }
}
