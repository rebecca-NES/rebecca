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
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomInfo;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomMember;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.ChatRoomSortCondition;

import org.jivesoftware.util.Log;

public class ChatRoomStoreDbHelper {
    public final static String TABLE_NAME = "chatroom_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_ROOM_ID_NAME = "room_id";
    public final static String COLUMN_ROOM_NAME_NAME = "room_name";
    public final static String COLUMN_PARENT_ROOM_ID_NAME = "parent_room_id";
    public final static String COLUMN_PRIVACY_TYPE_NAME = "privacy_type";
    public final static String COLUMN_CREATED_AT_NAME = "created_at";
    public final static String COLUMN_CREATED_BY_NAME = "created_by";
    public final static String COLUMN_UPDATED_AT_NAME = "updated_at";
    public final static String COLUMN_UPDATED_BY_NAME = "updated_by";
    public final static String COLUMN_DELETE_FLAG_NAME = "delete_flag";
    public final static String COLUMN_DELETED_AT_NAME = "deleted_at";
    public final static String COLUMN_DELETED_BY_NAME = "deleted_by";
    public final static String COLUMN_NOTIFY_TYPE_NAME = "notify_type";

    @SuppressWarnings("deprecation")
    public static int getNextChatRoomIdNumber(String fromJid) {
        int retNumber = 0;
        if (fromJid == null) {
            return retNumber;
        }
        String roomIdPrefix = getRoomIdPrefix(fromJid);
        if (roomIdPrefix == null || roomIdPrefix.equals("")) {
            return retNumber;
        }
        String sql = "SELECT " + COLUMN_ID_NAME + ", " + COLUMN_ROOM_ID_NAME
                + " FROM " + TABLE_NAME + " WHERE " + COLUMN_ROOM_ID_NAME
                + " ~ E'^"
                + GlobalSNSUtils.escapeSqlDataForRegexpPhrase(roomIdPrefix)
                + "[0-9]+$' ORDER BY " + COLUMN_ID_NAME + " DESC LIMIT 1";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                try {
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    if (resultSet.next()) {
                        String lastRoomId = resultSet
                                .getString(COLUMN_ROOM_ID_NAME);
                        String currentIndexNumberStr = "";
                        try {
                            currentIndexNumberStr = lastRoomId.substring(
                                    roomIdPrefix.length(), lastRoomId.length());
                            retNumber = Integer.parseInt(currentIndexNumberStr);
                            retNumber += 1;
                        } catch (IndexOutOfBoundsException e) {
                            Log.error("Failed to extract currentIndexNumberStr : "
                                    + currentIndexNumberStr);
                        } catch (NumberFormatException e) {
                            Log.error("invalid number format currentIndexNumberStr : "
                                    + currentIndexNumberStr);
                        }
                    } else {
                        retNumber = 1;
                    }
                } catch (SQLException e) {
                    Log.error("Failed to get next RoomId number : " + sql);
                }
                dbHelper.close();
            } catch (Exception e) {
            }
        }
        return retNumber;
    }

    public static String getRoomIdPrefix(String fromJid) {
        String ret = "";
        if (fromJid == null) {
            return ret;
        }
        String accountName = fromJid.split("@")[0];
        ret = "room_" + accountName + "_";
        return ret;
    }

    @SuppressWarnings("deprecation")
    public final static boolean insertChatRoomToDb(ChatRoomInfo roomInfo) {
        if (roomInfo == null) {
            Log.error("roomInfo is null");
            return false;
        }
        String roomId = roomInfo.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("roomId is invalid");
            return false;
        }
        String roomName = roomInfo.getRoomName();
        if (roomName == null || roomName.equals("")) {
            Log.error("roomName is invalid");
            return false;
        }
        String parentRoomId = roomInfo.getParentRoomId();
        if (parentRoomId == null) {
            Log.error("parentRoomId is invalid");
            return false;
        }
        Timestamp cretaedAt = roomInfo.getCreatedAt();
        if (cretaedAt == null) {
            Log.error("cretaedAt is null");
            return false;
        }
        String createdBy = roomInfo.getCreatedBy();
        if (createdBy == null || createdBy.equals("")) {
            Log.error("createdBy is invalid");
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
                String sqlRoomName = "'"
                        + GlobalSNSUtils.escapeSqlData(roomName) + "'";
                String sqlParentRoomId = "'"
                        + GlobalSNSUtils.escapeSqlData(parentRoomId) + "'";
                String privacyType = "" + roomInfo.getPrivacyType();
                String sqlPrivacyTypeStr = "'"
                        + GlobalSNSUtils.escapeSqlData(privacyType) + "'";
                String sqlCreatedAt = "'" + roomInfo.getCreatedAtStr() + "'";
                String sqlCreatedBy = "'"
                        + GlobalSNSUtils.escapeSqlData(createdBy) + "'";
                String updatedAtStr = roomInfo.getUpdatedAtStr();
                String sqlUpdatedAtStr = "NULL";
                if (!updatedAtStr.equals("")) {
                    sqlUpdatedAtStr = "'" + updatedAtStr + "'";
                }
                String updatedBy = roomInfo.getUpdatedBy();
                String sqlUpdatedBy = "''";
                if (updatedBy != null) {
                    sqlUpdatedBy = "'"
                            + GlobalSNSUtils.escapeSqlData(updatedBy) + "'";
                }
                String sqlDeleteFlagStr = "" + roomInfo.getDeleteFlag();
                String deletedAtStr = roomInfo.getDeletedAtStr();
                String sqlDeletedAtStr = "NULL";
                if (!deletedAtStr.equals("")) {
                    sqlDeletedAtStr = "'" + deletedAtStr + "'";
                }
                String deletedBy = roomInfo.getDeletedBy();
                String sqlDeletedBy = "''";
                if (deletedBy != null) {
                    sqlDeletedBy = "'"
                            + GlobalSNSUtils.escapeSqlData(deletedBy) + "'";
                }
                String notifyType = "" + roomInfo.getNotifyType();
                String sqlNotifyTypeStr = "'"
                        + GlobalSNSUtils.escapeSqlData(notifyType) + "'";

                String columns = COLUMN_ROOM_ID_NAME + ", "
                        + COLUMN_ROOM_NAME_NAME + ", "
                        + COLUMN_PARENT_ROOM_ID_NAME + ", "
                        + COLUMN_PRIVACY_TYPE_NAME + ", "
                        + COLUMN_CREATED_AT_NAME + ", "
                        + COLUMN_CREATED_BY_NAME + ", "
                        + COLUMN_UPDATED_AT_NAME + ", "
                        + COLUMN_UPDATED_BY_NAME + ", "
                        + COLUMN_DELETE_FLAG_NAME + ", "
                        + COLUMN_DELETED_AT_NAME + ", "
                        + COLUMN_DELETED_BY_NAME + ", "
                        + COLUMN_NOTIFY_TYPE_NAME;
                String values = sqlRoomId + ", "
                        + sqlRoomName + ", "
                        + sqlParentRoomId + ", "
                        + sqlPrivacyTypeStr + ", "
                        + sqlCreatedAt + ", " + sqlCreatedBy + ", "
                        + sqlUpdatedAtStr + ", " + sqlUpdatedBy + ", "
                        + sqlDeleteFlagStr + ", " + sqlDeletedAtStr + ", "
                        + sqlDeletedBy + ", " + sqlNotifyTypeStr;
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

    public static ChatRoomInfo getChatRoomInfoByRoomId(String roomId) {
        ChatRoomInfo ret = null;
        List<String> roomIdList = new ArrayList<String>();
        roomIdList.add(roomId);
        List<ChatRoomInfo> chatRooomInfoList = getChatRoomInfoListByRoomIdList(roomIdList, true);
        if (chatRooomInfoList == null || chatRooomInfoList.size() < 1) {
            return ret;
        }
        ret = chatRooomInfoList.get(0);
        return ret;
    }

    public static ChatRoomInfo getDeletedChatRoomInfoByRoomId(String roomId) {
        ChatRoomInfo ret = null;
        List<String> roomIdList = new ArrayList<String>();
        roomIdList.add(roomId);
        List<ChatRoomInfo> chatRooomInfoList = getChatRoomInfoListByRoomIdList(roomIdList, false);
        if (chatRooomInfoList == null || chatRooomInfoList.size() < 1) {
            return ret;
        }
        ret = chatRooomInfoList.get(0);
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static List<ChatRoomInfo> getChatRoomInfoListByRoomIdList(
            List<String> roomIdList, boolean existFlag) {
        List<ChatRoomInfo> retList = new ArrayList<ChatRoomInfo>();
        if (roomIdList == null) {
            Log.error("ChatRoomStoreDbHelper#getChatRoomInfoListByRoomIdList - roomIdList is null");
            return retList;
        }
        String sql = getChatRoomInfoSelectSqlByRoomIdList(roomIdList, existFlag);
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomStoreDbHelper#getChatRoomInfoListByRoomIdList - sql is invalid");
            return retList;
        }
        return getChatRoomInfoListBySqlString(sql);
    }

    private static String getChatRoomInfoSelectSqlByRoomIdList(
            List<String> roomIdList, boolean existFlag) {
        if (roomIdList == null) {
            return "";
        }
        int count = roomIdList.size();
        if (count <= 0) {
            return "";
        }

        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        for (int i = 0; i < count; i++) {
            if (i != 0) {
                where += " OR ";
            }
            where += "(" + COLUMN_ROOM_ID_NAME + "='"
                    + GlobalSNSUtils.escapeSqlData(roomIdList.get(i)) + "')";
        }
        where = "(" + where + ") AND (" + COLUMN_DELETE_FLAG_NAME;
        if (existFlag) {
            where += "=0)";
        } else {
            where += "<>0)";
        }
        sql += where;

        return sql;
    }

    @SuppressWarnings("deprecation")
    private static List<ChatRoomInfo> getChatRoomInfoListBySqlString(String sql) {
        List<ChatRoomInfo> retList = new ArrayList<ChatRoomInfo>();
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomStoreDbHelper#getChatRoomInfoListBySqlString - sql is invalid");
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
                    ChatRoomInfo chatRoomInfo = getOneChatRoomInfoByResultSet(resultSet);
                    if (chatRoomInfo != null) {
                        retList.add(chatRoomInfo);
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

    private static ChatRoomInfo getOneChatRoomInfoByResultSet(
            ResultSet resultSet) {
        ChatRoomInfo chatRoomInfo = new ChatRoomInfo();
        try {
            chatRoomInfo
                    .setId(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
            chatRoomInfo.setRoomId(resultSet.getString(COLUMN_ROOM_ID_NAME));
            chatRoomInfo
                    .setRoomName(resultSet.getString(COLUMN_ROOM_NAME_NAME));
            chatRoomInfo
                    .setParentRoomId(resultSet.getString(COLUMN_PARENT_ROOM_ID_NAME));
            chatRoomInfo.setPrivacyType(resultSet
                    .getInt(COLUMN_PRIVACY_TYPE_NAME));
            chatRoomInfo.setCreatedAt(resultSet
                    .getTimestamp(COLUMN_CREATED_AT_NAME));
            chatRoomInfo.setCreatedBy(resultSet
                    .getString(COLUMN_CREATED_BY_NAME));
            chatRoomInfo.setUpdatedAt(resultSet
                    .getTimestamp(COLUMN_UPDATED_AT_NAME));
            String updatedBy = resultSet.getString(COLUMN_UPDATED_BY_NAME);
            chatRoomInfo.setUpdatedBy(updatedBy == null ? "" : updatedBy);
            chatRoomInfo.setDeleteFlag(resultSet
                    .getInt(COLUMN_DELETE_FLAG_NAME));
            chatRoomInfo.setDeletedAt(resultSet
                    .getTimestamp(COLUMN_DELETED_AT_NAME));
            String deletedBy = resultSet.getString(COLUMN_DELETED_BY_NAME);
            chatRoomInfo.setDeletedBy(deletedBy == null ? "" : deletedBy);
            chatRoomInfo.setNotifyType(resultSet
                    .getInt(COLUMN_NOTIFY_TYPE_NAME));
        } catch (SQLException e) {
            return null;
        }
        return chatRoomInfo;
    }

    @SuppressWarnings("deprecation")
    public static List<ChatRoomInfo> getChatRoomList
        ( String fromJid,
          BigInteger startId, int countNum,
          ChatRoomSortCondition sortCondition,
          String selectedParentRoomId) {
        return getChatRoomList(fromJid,
                               startId,
                               countNum,
                               sortCondition,
                               selectedParentRoomId,
                               -1,-1);
    }

    @SuppressWarnings("deprecation")
    public static List<ChatRoomInfo> getChatRoomList
        ( String fromJid,
          BigInteger startId, int countNum,
          ChatRoomSortCondition sortCondition,
          String selectedParentRoomId,
          int selectPrivacyType,
          int selectListType) {
        Log.debug("do func  ChatRoomStoreDbHelper.getChatRoomList(...");
        List<ChatRoomInfo> ret = null;
        if (fromJid == null || fromJid.equals("")) {
            Log.error("ChatRoomStoreDbHelper#getChatRoomList::fromJid is invalid");
            return ret;
        }
        if (startId == null) {
            Log.error("ChatRoomStoreDbHelper#getChatRoomList::startId is null");
            return ret;
        }
        if (sortCondition == null) {
            Log.error("ChatRoomStoreDbHelper#getChatRoomList::sortCondition is null");
            return ret;
        }
        String selectStr = TABLE_NAME + "." + COLUMN_ID_NAME + ", "
                + TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + ", " + TABLE_NAME
                + "." + COLUMN_ROOM_NAME_NAME + ", " + TABLE_NAME + "."
                + COLUMN_PARENT_ROOM_ID_NAME + ", " + TABLE_NAME + "."
                + COLUMN_PRIVACY_TYPE_NAME + ", " + TABLE_NAME + "."
                + COLUMN_CREATED_AT_NAME + ", " + TABLE_NAME + "."
                + COLUMN_CREATED_BY_NAME + ", " + TABLE_NAME + "."
                + COLUMN_UPDATED_AT_NAME + ", " + TABLE_NAME + "."
                + COLUMN_UPDATED_BY_NAME + ", " + TABLE_NAME + "."
                + COLUMN_DELETE_FLAG_NAME + ", " + TABLE_NAME + "."
                + COLUMN_DELETED_AT_NAME + ", " + TABLE_NAME + "."
                + COLUMN_DELETED_BY_NAME + ", " + TABLE_NAME + "."
                + COLUMN_NOTIFY_TYPE_NAME;
        String joinTable = ChatRoomMemberStoreDbHelper.TABLE_NAME;
        String innerJoinOn = TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + "="
                + ChatRoomMemberStoreDbHelper.TABLE_NAME + "."
                + ChatRoomMemberStoreDbHelper.COLUMN_ROOM_ID_NAME;

        String where = TABLE_NAME + "." + COLUMN_DELETE_FLAG_NAME + "=0";

        if(selectPrivacyType == 0){
            where += " AND "
                + TABLE_NAME + "." + COLUMN_PRIVACY_TYPE_NAME
                + "=" + selectPrivacyType + "";
            if(selectListType == 0){
                where += " AND "
                    + TABLE_NAME + ".room_id NOT IN"
                    + "(SELECT room_id FROM " + ChatRoomMemberStoreDbHelper.TABLE_NAME
                    + " WHERE jid='" + fromJid + "' AND "
                    + ChatRoomMemberStoreDbHelper.COLUMN_STATE_NAME
                    + "=" + ChatRoomMember.STATE_JOIN
                    + ")";
                innerJoinOn = null;
            }else if(selectListType == 1){
                innerJoinOn += " AND "
                    + ChatRoomMemberStoreDbHelper.TABLE_NAME
                    + "." + ChatRoomMemberStoreDbHelper.COLUMN_JID_NAME
                    + "='" + fromJid + "' ";
                innerJoinOn += " AND "
                    + ChatRoomMemberStoreDbHelper.COLUMN_STATE_NAME
                    + "=" + ChatRoomMember.STATE_JOIN;
            }else{
                innerJoinOn = null;
            }
        }else if(selectPrivacyType > 0){
            where += " AND "
                + TABLE_NAME + "." + COLUMN_PRIVACY_TYPE_NAME
                + "=" + selectPrivacyType + "";
            innerJoinOn += " AND "
                + ChatRoomMemberStoreDbHelper.TABLE_NAME
                + "." + ChatRoomMemberStoreDbHelper.COLUMN_JID_NAME
                + "='" + fromJid + "'"
                + " AND "
                + ChatRoomMemberStoreDbHelper.COLUMN_STATE_NAME
                + "=" + ChatRoomMember.STATE_JOIN;
        }else{
            innerJoinOn += " AND "
                + ChatRoomMemberStoreDbHelper.TABLE_NAME
                + "." + ChatRoomMemberStoreDbHelper.COLUMN_JID_NAME
                + "='" + fromJid + "'"
                + " AND "
                + ChatRoomMemberStoreDbHelper.COLUMN_STATE_NAME
                + "=" + ChatRoomMember.STATE_JOIN;
        }

        if(selectedParentRoomId != null){
            where += " AND "
                + TABLE_NAME + "." + COLUMN_PARENT_ROOM_ID_NAME
                + "='" + GlobalSNSUtils.escapeSqlData(selectedParentRoomId) + "'";
        }

        if (!startId.equals(BigInteger.ZERO)) {
            where = "((" + where + ") OR (" + TABLE_NAME + "." + COLUMN_ID_NAME
                    + "=" + startId.toString() + "))";
        }
        String orderBy = sortCondition.toSqlOrderBySectionString();
        String getRownumSqlString = "";
        if (startId.longValue() > 0) {
            getRownumSqlString = "SELECT * FROM (SELECT *, row_number() OVER() as rownum FROM (SELECT "
                    + selectStr + " FROM " + TABLE_NAME;
            if(innerJoinOn != null){
                getRownumSqlString += " INNER JOIN " + joinTable + " ON "
                    + innerJoinOn;
            }
            getRownumSqlString += " WHERE " + where;
            if (!orderBy.equals("")) {
                getRownumSqlString += " ORDER BY " + orderBy;
            }
            getRownumSqlString += ") as dummy_table) as dummy_table2 WHERE id="
                    + startId.toString();

        }
        int offset = -1;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        boolean isDbOpend = false;
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            isDbOpend = true;

            ResultSet resultSet;
            if (startId.longValue() > 0) {
                resultSet = dbHelper.executeQuery(getRownumSqlString);
                try {
                    if (resultSet.next()) {
                        offset = resultSet.getInt("rownum");
                    }
                } catch (SQLException e) {
                    Log.error("Failed to get chatRoomInfolist data1");
                    dbHelper.close();
                    isDbOpend = false;
                    throw new Exception("Failed to select database1");
                }
                if (offset < 0) {
                    Log.error("rownum is invalid");
                    dbHelper.close();
                    isDbOpend = false;
                    throw new Exception("rownum is invalid");
                }
            } else {
                offset = 0;
            }
            String getChatRoomInfoSqlString = "SELECT " + selectStr + " FROM "
                    + TABLE_NAME;
            if(innerJoinOn != null){
                getChatRoomInfoSqlString += " INNER JOIN " + joinTable + " ON "
                    + innerJoinOn;
            }

            getChatRoomInfoSqlString += " WHERE " + where;
            if (!orderBy.equals("")) {
                getChatRoomInfoSqlString += " ORDER BY " + orderBy;
            }

            getChatRoomInfoSqlString += " LIMIT " + String.valueOf(countNum)
                    + " OFFSET " + String.valueOf(offset);
            ret = new ArrayList<ChatRoomInfo>();
            resultSet = dbHelper.executeQuery(getChatRoomInfoSqlString);
            try {
                while (resultSet.next()) {
                    ChatRoomInfo chatRoomInfo = getOneChatRoomInfoByResultSet(resultSet);
                    if (chatRoomInfo != null) {
                        ret.add(chatRoomInfo);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get chatRoomInfolist data2");
            }

            dbHelper.close();
            isDbOpend = false;
        } catch (Exception e) {
            if (isDbOpend) {
                dbHelper.close();
            }
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static boolean updateRoomInfo(ChatRoomInfo roomInfo) {
        boolean ret = false;
        if (roomInfo == null) {
            Log.error("roomInfo is null");
            return false;
        }
        String roomId = roomInfo.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("ChatRoomStoreDbHelper#updateRoomInfo::roomId is invalid");
            return ret;
        }

        if (roomInfo.getSubTypeList() == null
                || roomInfo.getSubTypeList().size() == 0) {
            Log.error("ChatRoomStoreDbHelper#updateRoomInfo::subTypeList is null");
            return ret;
        }
        if (!roomInfo.getSubTypeList().contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGEROOMNAME)
                && !roomInfo.getSubTypeList().contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGEIMAGE)
                && !roomInfo.getSubTypeList().contains(ChatRoomInfo.SUBTYPE_ITEM_CHANGENOTIFY)
                && !roomInfo.getSubTypeList().contains(ChatRoomInfo.SUBTYPE_ITEM_DELETECHATROOM)
                && !roomInfo.getSubTypeList().contains(ChatRoomInfo.SUBTYPE_ITEM_PRIVACYTYPE)) {
            Log.error("ChatRoomStoreDbHelper#updateRoomInfo::subTypeList is invalid. "
                    + roomInfo.getSubTypeList().toString());
            return ret;
        }

        String roomName = roomInfo.getRoomName();
        if (roomInfo.getSubTypeList().contains(
                ChatRoomInfo.SUBTYPE_ITEM_CHANGEROOMNAME)) {
            if (roomName == null || roomName.equals("")) {
                Log.error("ChatRoomStoreDbHelper#updateRoomInfo::roomName is invalid");
                return ret;
            }
        }


        String notifyTypeStr = String.valueOf(roomInfo.getNotifyType());
        if (roomInfo.getSubTypeList().contains(
                ChatRoomInfo.SUBTYPE_ITEM_CHANGENOTIFY)) {
            if (notifyTypeStr == null) {
                Log.error("ChatRoomStoreDbHelper#updateRoomInfo::notifyType is invalid");
                return ret;
            }
        }

        String privacyTypeStr = String.valueOf(roomInfo.getPrivacyType());
        if (roomInfo.getSubTypeList()
            .contains(ChatRoomInfo.SUBTYPE_ITEM_PRIVACYTYPE)) {
            if (privacyTypeStr == null) {
                Log.error("ChatRoomStoreDbHelper#updateRoomInfo::privacyType invalid");
                return ret;
            }
        }

        Timestamp updatedAt = roomInfo.getUpdatedAt();
        if (updatedAt == null) {
            Log.error("ChatRoomStoreDbHelper#updateRoomInfo::updatedAt is invalid");
            return false;
        }
        String updatedByJid = roomInfo.getUpdatedBy();
        if (updatedByJid == null || updatedByJid.equals("")) {
            Log.error("ChatRoomStoreDbHelper#updateRoomInfo::updatedByJid is invalid");
            return ret;
        }
        StringBuffer sqlbuf = new StringBuffer();
        sqlbuf.append("UPDATE ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append(" SET ");

        if (roomInfo.getSubTypeList().contains(
                ChatRoomInfo.SUBTYPE_ITEM_CHANGEROOMNAME)) {
            sqlbuf.append(COLUMN_ROOM_NAME_NAME).append("='")
                    .append(GlobalSNSUtils.escapeSqlData(roomName))
                    .append("', ");
        }

        if (roomInfo.getSubTypeList().contains(ChatRoomInfo.SUBTYPE_ITEM_DELETECHATROOM)) {
            String deletedBy = roomInfo.getDeletedBy();
            if (deletedBy == null || deletedBy.equals("")) {
                Log.error("ChatRoomStoreDbHelper#updateRoomInfo::deletedBy is invalid");
                return ret;
            }
            String deletedAt = roomInfo.getDeletedAtStr();
            if (deletedAt == null) {
                Log.error("ChatRoomStoreDbHelper#updateRoomInfo::deletedAt is invalid");
                return ret;
            }
            String deleteFlag = String.valueOf(roomInfo.getDeleteFlag());
            if (deleteFlag == null) {
                Log.error("ChatRoomStoreDbHelper#updateRoomInfo::deleteFlag is invalid");
                return ret;
            }
            sqlbuf.append(COLUMN_DELETE_FLAG_NAME).append("='").append(deleteFlag).append("', ");
            sqlbuf.append(COLUMN_DELETED_AT_NAME).append("='").append(deletedAt).append("', ");
            sqlbuf.append(COLUMN_DELETED_BY_NAME).append("='").append(GlobalSNSUtils.escapeSqlData(deletedBy)).append("', ");
        }

        if (roomInfo.getSubTypeList().contains(
                ChatRoomInfo.SUBTYPE_ITEM_CHANGENOTIFY)) {
            sqlbuf.append(COLUMN_NOTIFY_TYPE_NAME).append("=").append(notifyTypeStr).append(", ");
        }

        if (roomInfo.getSubTypeList()
            .contains(ChatRoomInfo.SUBTYPE_ITEM_PRIVACYTYPE)) {
            sqlbuf.append(COLUMN_PRIVACY_TYPE_NAME).append("=").append(privacyTypeStr).append(", ");
        }

        sqlbuf.append(COLUMN_UPDATED_AT_NAME).append("='").append(updatedAt).append("', ");
        sqlbuf.append(COLUMN_UPDATED_BY_NAME).append("='")
                .append(GlobalSNSUtils.escapeSqlData(updatedByJid)).append("'");
        sqlbuf.append(" WHERE ");
        sqlbuf.append(COLUMN_ROOM_ID_NAME).append("='")
                .append(GlobalSNSUtils.escapeSqlData(roomId)).append("'");
        String sql = sqlbuf.toString();

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
                if (dbHelper.executeUpdate(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to update database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    return false;
                }
                dbHelper.close();
                isDbOpend = false;
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                Log.error("ChatRoomStoreDbHelper#updateRoomInfo::failed to update data. sql="
                        + sql);
                return ret;
            }
        }
        ret = true;
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static boolean updateLastUpdateDate(String roomId,
            String updatedByJid) {
        boolean ret = false;
        if (roomId == null || roomId.equals("")) {
            Log.error("ChatRoomStoreDbHelper#updateLastUpdateDate::roomId is invalid");
            return ret;
        }
        if (updatedByJid == null || updatedByJid.equals("")) {
            Log.error("ChatRoomStoreDbHelper#updateLastUpdateDate::updatedByJid is invalid");
            return ret;
        }
        String sql = getUpdateLastUpdateDateSql(roomId, updatedByJid);
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomStoreDbHelper#updateLastUpdateDate::sql is invalid");
            return ret;
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
                if (dbHelper.executeUpdate(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to update database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    return false;
                }
                dbHelper.close();
                isDbOpend = false;
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                Log.error("ChatRoomStoreDbHelper#updateLastUpdateDate::failed to update data. sql="
                        + sql);
                return ret;
            }
        }
        ret = true;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private static String getUpdateLastUpdateDateSql(String roomId,
            String updatedByJid) {
        String ret = "";
        if (roomId == null || roomId.equals("")) {
            Log.error("ChatRoomStoreDbHelper#getUpdateLastUpdateDateSql::roomId is invalid");
            return ret;
        }
        if (updatedByJid == null || updatedByJid.equals("")) {
            Log.error("ChatRoomStoreDbHelper#getUpdateLastUpdateDateSql::updatedByJid is invalid");
            return ret;
        }
        Calendar now = Calendar.getInstance();
        long updatedTime = now.getTimeInMillis();
        java.util.Date date = new java.util.Date(updatedTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        String updatedAt = df.format(date);

        String set = COLUMN_UPDATED_AT_NAME + "='" + updatedAt + "', "
                + COLUMN_UPDATED_BY_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(updatedByJid) + "'";
        String where = COLUMN_ROOM_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(roomId) + "'";
        String sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE " + where
                + ";";
        ret = sql;
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static List<String> getChatRoomIdListByNotifyOff() {
        List<String> retList = new ArrayList<String>();
        String sql = getChatRoomIdSelectSqlByNotifyOff();
        if (sql == null || sql.equals("")) {
            Log.error("ChatRoomStoreDbHelper#getChatRoomIdListByNotifyOff - sql is invalid");
            return retList;
        }
        List<ChatRoomInfo> chatRoomInfoList = getChatRoomInfoListBySqlString(sql);
        for(ChatRoomInfo info : chatRoomInfoList) {
            retList.add(info.getRoomId());
        }
        return retList;
    }

    private static String getChatRoomIdSelectSqlByNotifyOff() {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where = "(" + COLUMN_NOTIFY_TYPE_NAME + ">0" + ") AND (" + COLUMN_DELETE_FLAG_NAME + "=0)";
        sql += where;

        return sql;
    }
}
