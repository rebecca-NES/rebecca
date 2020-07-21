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
import java.util.Map;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomInfo;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomMember;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChatRoomMemberStoreDbHelper {
    private static final Logger Log = LoggerFactory
            .getLogger(ChatRoomMemberStoreDbHelper.class);
    public final static String TABLE_NAME = "chatroom_member_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_ROOM_ID_NAME = "room_id";
    public final static String COLUMN_JID_NAME = "jid";
    public final static String COLUMN_STATE_NAME = "state";
    public final static String COLUMN_JOIN_DATE_NAME = "join_date";
    public final static String COLUMN_LEAVE_DATE_NAME = "leave_date";
    public final static String COLUMN_JOIN_JID_NAME = "join_jid";
    public final static String COLUMN_LEAVE_JID_NAME = "leave_jid";

    public static boolean insertChatRoomMemberToDb(ChatRoomMember member,
            String fromJid) {
        if (member == null) {
            Log.error("member is null");
            return false;
        }
        String roomId = member.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("roomId is invalid");
            return false;
        }
        String jid = member.getJid();
        if (jid == null || jid.equals("")) {
            Log.error("jid is invalid");
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
                String sqlRoomId = "'" + GlobalSNSUtils.escapeSqlData(roomId)
                        + "'";
                String sqlJid = "'" + GlobalSNSUtils.escapeSqlData(jid) + "'";
                String sqlStateStr = "" + member.getState();
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
                String sqlJoinJid = "'" + GlobalSNSUtils.escapeSqlData(fromJid)
                        + "'";
                String sqlLeaveJid = "NULL";

                String columns = COLUMN_ROOM_ID_NAME + ", " + COLUMN_JID_NAME
                        + ", " + COLUMN_STATE_NAME + ", "
                        + COLUMN_JOIN_DATE_NAME + ", " + COLUMN_LEAVE_DATE_NAME
                        + ", " + COLUMN_JOIN_JID_NAME + ", "
                        + COLUMN_LEAVE_JID_NAME;
                String values = sqlRoomId + ", " + sqlJid + ", " + sqlStateStr
                        + ", " + sqlJoinDateStr + ", " + sqlLeaveDateStr + ", "
                        + sqlJoinJid + ", " + sqlLeaveJid;
                String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                        + ") VALUES (" + values + ");";
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

    public static List<ChatRoomMember> getChatRoomMember(String roomId) {
        List<ChatRoomMember> retList = new ArrayList<ChatRoomMember>();
        if (roomId == null) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomMember - roomId is null");
            return retList;
        }
        String sql = getChatRoomMemberSelectSqlByRoomId(roomId);
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomMember - sql is invalid");
            return retList;
        }
        return getChatRoomMemberListBySqlString(sql);
    }

    private static String getChatRoomMemberSelectSqlByRoomId(String roomId) {
        if (roomId == null) {
            return "";
        }

        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where += "(" + COLUMN_ROOM_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(roomId) + "')";
        sql += where;
        String order = " ORDER BY " + COLUMN_ID_NAME + " ASC";
        sql += order;
        return sql;
    }

    private static List<ChatRoomMember> getChatRoomMemberListBySqlString(
            String sql) {
        List<ChatRoomMember> retList = new ArrayList<ChatRoomMember>();
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomMemberListBySqlString - sql is invalid");
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
                    ChatRoomMember chatRoomMember = getOneChatRoomMemberByResultSet(resultSet);
                    if (chatRoomMember != null) {
                        retList.add(chatRoomMember);
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

    private static ChatRoomMember getOneChatRoomMemberByResultSet(
            ResultSet resultSet) {
        ChatRoomMember chatRoomMember = new ChatRoomMember();
        try {
            chatRoomMember.setId(new BigInteger(resultSet
                    .getString(COLUMN_ID_NAME)));
            chatRoomMember.setRoomId(resultSet.getString(COLUMN_ROOM_ID_NAME));
            chatRoomMember.setJid(resultSet.getString(COLUMN_JID_NAME));
            chatRoomMember.setState(resultSet.getInt(COLUMN_STATE_NAME));
            chatRoomMember.setJoinDate(resultSet
                    .getTimestamp(COLUMN_JOIN_DATE_NAME));
            chatRoomMember.setLeaveDate(resultSet
                    .getTimestamp(COLUMN_LEAVE_DATE_NAME));
            chatRoomMember
                    .setJoinJid(resultSet.getString(COLUMN_JOIN_JID_NAME));
            chatRoomMember.setLeaveJid(resultSet
                    .getString(COLUMN_LEAVE_JID_NAME));
        } catch (SQLException e) {
            return null;
        }
        return chatRoomMember;
    }

    public static boolean updateGroupChatMemberToDb(
            List<ChatRoomMember> updateMemberList,
            Map<String, Boolean> resultMap) {
        boolean ret = false;

        if (updateMemberList == null) {
            Log.error("ChatRoomMemberStoreDbHelper#updateGroupChatMemberToDb::updateMemberList is null");
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            boolean dbOpend = false;
            try {
                if (!dbHelper.open()) {
                    Log.error("ChatRoomMemberStoreDbHelper#updateGroupChatMemberToDb::Failed to open database");
                    throw new Exception("Failed to open database");
                }
                dbOpend = true;
                for (ChatRoomMember member : updateMemberList) {
                    String sql = "";
                    sql = createUpdateDataSql(member);
                    if (sql == null || sql.equals("")) {
                        Log.error("ChatRoomMemberStoreDbHelper#updateGroupChatMemberToDb::update sql is invalid");
                        continue;
                    }
                    if (dbHelper.executeUpdate(sql) == -1) {
                        Log.error(String
                                .format("Failed to insert or update database (%s)",
                                        sql));
                        continue;
                    }
                    resultMap.put(member.getJid(), true);
                    ret = true;
                }
                dbHelper.close();
            } catch (Exception e) {
                Log.error("ChatRoomMemberStoreDbHelper#updateGroupChatMemberToDb::Exception : "
                        + e.getMessage());
                if (dbOpend) {
                    dbHelper.close();
                }
                return ret;
            }
        }
        return ret;
    }

    private static String createUpdateDataSql(ChatRoomMember member) {
        String ret = "";
        String roomId = member.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("ChatRoomMemberStoreDbHelper#createUpdateDataSql::roomId is invalid");
            return ret;
        }
        String jid = member.getJid();
        if (jid == null || jid.equals("")) {
            Log.error("ChatRoomMemberStoreDbHelper#createUpdateDataSql::jid is invalid");
            return ret;
        }
        String joinJid = member.getJoinJid();
        if (jid == null || jid.equals("")) {
            Log.error("ChatRoomMemberStoreDbHelper#createUpdateDataSql::joinJid is invalid");
            return ret;
        }
        String leaveJid = member.getLeaveJid();
        if (jid == null || jid.equals("")) {
            Log.error("ChatRoomMemberStoreDbHelper#createUpdateDataSql::leaveJid is invalid");
            return ret;
        }
        String sqlRoomId = "'" + GlobalSNSUtils.escapeSqlData(roomId) + "'";
        String sqlJid = "'" + GlobalSNSUtils.escapeSqlData(jid) + "'";
        String sqlStateStr = "" + member.getState();
        String sqlJoinJid = "'" + GlobalSNSUtils.escapeSqlData(joinJid) + "'";
        String sqlLeaveJid = "'" + GlobalSNSUtils.escapeSqlData(leaveJid) + "'";

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
                + COLUMN_JOIN_DATE_NAME + "=" + sqlJoinDateStr + ", "
                + COLUMN_LEAVE_DATE_NAME + "=" + sqlLeaveDateStr + ", "
                + COLUMN_JOIN_JID_NAME + "=" + sqlJoinJid + ", "
                + COLUMN_LEAVE_JID_NAME + "=" + sqlLeaveJid + " " + "WHERE "
                + COLUMN_ID_NAME + "=" + String.valueOf(member.getId());
        ret = sql;
        return ret;
    }

    public static ChatRoomMember getChatRoomMember(String roomId, String jid) {
        ChatRoomMember ret = null;
        if (roomId == null) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomMember - roomId is null");
            return ret;
        }

        if (jid == null) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomMember - jid is null");
            return ret;
        }

        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = COLUMN_ROOM_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(roomId) + "'" + " AND "
                + COLUMN_JID_NAME + "='" + GlobalSNSUtils.escapeSqlData(jid)
                + "'";
        sql += where;

        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomMember - sql is invalid");
            return ret;
        }
        List<ChatRoomMember> resultList = getChatRoomMemberListBySqlString(sql);
        if (resultList == null || resultList.size() < 1) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomMember - resultList is invalid");
            return ret;
        }

        return resultList.get(0);
    }

    public static List<String> getJoinedAllChatRoomMemberJidList(String jid) {
        List<String> ret = null;
        if (jid == null || "".equals(jid)) {
            Log.error("ChatRoomMemberStroreDbHelper#getJoinedAllChatRoomMemberJidList - jid is null or empty");
            return ret;
        }
        String ownJoinedChatRoomsSql = "SELECT " + COLUMN_ROOM_ID_NAME
                + " FROM " + TABLE_NAME + " WHERE " + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(jid) + "' AND "
                + COLUMN_STATE_NAME + "=1;";
        List<String> joinedRoomIdList = getChatRoomIdListBySqlString(ownJoinedChatRoomsSql);
        if (joinedRoomIdList == null) {
            Log.error("ChatRoomMemberStroreDbHelper#getJoinedAllChatRoomMemberJidList - joinedRoomIdList is null");
            return ret;
        }
        if (joinedRoomIdList.isEmpty()) {
            Log.debug("ChatRoomMemberStroreDbHelper#getJoinedAllChatRoomMemberJidList - joinedRoomIdList is empty");
            ret = new ArrayList<String>();
            return ret;
        }
        String inOperatorStr = GlobalSNSUtils
                .convertListToStringforInOperator(joinedRoomIdList);
        if (inOperatorStr == null || "".equals(inOperatorStr)) {
            Log.info("ChatRoomMemberStroreDbHelper#getJoinedAllChatRoomMemberJidList - inOperatorStr is empty");
            ret = new ArrayList<String>();
            return ret;
        }
        String allOwnJoinedChatRoomMembersSql = "SELECT " + COLUMN_JID_NAME
                + " FROM " + TABLE_NAME + " WHERE " + COLUMN_ROOM_ID_NAME
                + " IN (" + inOperatorStr + ") AND " + COLUMN_JID_NAME + "<>'"
                + jid + "' AND " + COLUMN_STATE_NAME + "=1 GROUP BY "
                + COLUMN_JID_NAME + ";";
        ret = getChatRoomMemberJidListBySqlString(allOwnJoinedChatRoomMembersSql);
        return ret;
    }

    private static List<String> getChatRoomIdListBySqlString(String sql) {
        List<String> retList = new ArrayList<String>();
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomIdListBySqlString - sql is invalid");
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

    public static List<String> getJoinedChatRoomIdList(String jid) {
        List<String> retList = new ArrayList<String>();
        if (jid == null) {
            Log.error("ChatRoomMemberStroreDbHelper#getJoinedChatRoomIdList - jid is null");
            return retList;
        }
        String sql = getJoinedChatRoomIdsSelectSqlByJid(jid);
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomMemberStroreDbHelper#getJoinedChatRoomIdList - sql is invalid");
            return retList;
        }
        return getChatRoomIdListBySqlString(sql);
    }

    private static String getJoinedChatRoomIdsSelectSqlByJid(String jid) {
        if (jid == null) {
            return "";
        }

        String sql = "SELECT " + COLUMN_ROOM_ID_NAME + " FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where += TABLE_NAME + "." + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(jid) + "' AND "
                + TABLE_NAME + "." + COLUMN_STATE_NAME + "="
                + ChatRoomMember.STATE_JOIN;
        sql += where;
        String order = " ORDER BY " + TABLE_NAME + "." + COLUMN_ID_NAME + " DESC";
        sql += order;
        return sql;
    }

    public static String getJoinedChatRoomIdsSelectSqlByJidNonOrder(String jid) {
        if (jid == null) {
            return "";
        }

        String sql = "SELECT " + COLUMN_ROOM_ID_NAME + " FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where += TABLE_NAME + "." + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(jid) + "' AND "
                + TABLE_NAME + "." + COLUMN_STATE_NAME + "="
                + ChatRoomMember.STATE_JOIN;
        sql += where;
        return sql;
    }

    public static String getJoinedNonNotifiedChatRoomIdsSelectSqlByJidNonOrder(String jid) {
        if (jid == null) {
            return "";
        }

        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + " FROM " + TABLE_NAME +
                     " JOIN " + ChatRoomStoreDbHelper.TABLE_NAME + " ON " +
                     TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + "=" + ChatRoomStoreDbHelper.TABLE_NAME + "." + ChatRoomStoreDbHelper.COLUMN_ROOM_ID_NAME +
                     " WHERE ";
        String where = "";
        where += "(" + TABLE_NAME + "." + COLUMN_JID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(jid) + "' AND "
                + TABLE_NAME + "." + COLUMN_STATE_NAME + "="
                + ChatRoomMember.STATE_JOIN + " AND "
                + ChatRoomStoreDbHelper.TABLE_NAME + "." + ChatRoomStoreDbHelper.COLUMN_NOTIFY_TYPE_NAME
                + ">" + ChatRoomInfo.NOTIFY_TYPE_ALL_ON + " AND "
                + ChatRoomStoreDbHelper.TABLE_NAME + "." + ChatRoomStoreDbHelper.COLUMN_DELETE_FLAG_NAME
                + "=" + ChatRoomInfo.DELETE_FLAG_NOT_DELETED
                + ")";
        sql += where;
        return sql;
    }

    private static List<String> getChatRoomMemberJidListBySqlString(String sql) {
        List<String> retList = new ArrayList<String>();
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomMemberStroreDbHelper#getChatRoomMemberJidListBySqlString - sql is invalid");
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
