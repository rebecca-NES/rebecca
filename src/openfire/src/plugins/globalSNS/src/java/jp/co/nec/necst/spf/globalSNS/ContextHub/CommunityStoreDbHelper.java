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
import java.util.ArrayList;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityMember;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.CommunitySortCondition;

import org.jivesoftware.util.Log;

public class CommunityStoreDbHelper {
    public final static String TABLE_NAME = "community_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_ROOM_ID_NAME = "room_id";
    private final static String COLUMN_ROOM_NAME_NAME = "room_name";
    private final static String COLUMN_DESCRIPTION_NAME = "description";
    public final static String COLUMN_PRIVACY_TYPE_NAME = "privacy_type";
    private final static String COLUMN_MEMBER_ENNTRY_TYPE_NAME = "member_entry_type";
    private final static String COLUMN_LOGO_URL_NAME = "logoUrl";
    public final static String COLUMN_NOTIFY_TYPE_NAME = "notify_type";
    private final static String COLUMN_CREATED_AT_NAME = "created_at";
    private final static String COLUMN_CREATED_BY_NAME = "created_by";
    private final static String COLUMN_UPDATED_AT_NAME = "updated_at";
    private final static String COLUMN_UPDATED_BY_NAME = "updated_by";
    public final static String COLUMN_DELETE_FLAG_NAME = "delete_flag";
    private final static String COLUMN_DELETED_AT_NAME = "deleted_at";
    private final static String COLUMN_DELETED_BY_NAME = "deleted_by";


    @SuppressWarnings("deprecation")
    public static int getNextCommunityRoomIdNumber(String createdBy) {
        int retNumber = 0;
        if (createdBy == null) {
            return retNumber;
        }
        String roomIdPrefix = getRoomIdPrefix(createdBy);
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

    public static String getRoomIdPrefix(String createdBy) {
        String ret = "";
        if (createdBy == null) {
            return ret;
        }
        String accountName = createdBy.split("@")[0];
        ret = "community_" + accountName + "_";
        return ret;
    }
    @SuppressWarnings("deprecation")
    public static boolean insertCommunityToDb(CommunityInfo communityInfo) {
        if (communityInfo == null) {
            Log.error("communityInfo is null");
            return false;
        }
        String roomId = communityInfo.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("roomId is invalid");
            return false;
        }
        String roomName = communityInfo.getRoomName();
        if (roomName == null || roomName.equals("")) {
            Log.error("roomName is invalid");
            return false;
        }
        String description = communityInfo.getDescription();
        if (description == null) {
            Log.error("description is invalid");
            return false;
        }
        int privacyType = communityInfo.getPrivacyType();
        int memberEntryType = communityInfo.getMemberEntryType();
        String logoUrl = communityInfo.getLogoUrl();
        if (logoUrl == null) {
            Log.error("logoUrl is invalid");
            return false;
        }
        Timestamp cretaedAt = communityInfo.getCreatedAt();
        if (cretaedAt == null) {
            Log.error("cretaedAt is null");
            return false;
        }
        String createdBy = communityInfo.getCreatedBy();
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
                String sqlDescription = "'"
                        + GlobalSNSUtils.escapeSqlData(description) + "'";
                String sqlPrivacyType = String.valueOf(privacyType);
                String sqlMemberEntryType = String.valueOf(memberEntryType);
                String sqlLogoUrl = "'" + GlobalSNSUtils.escapeSqlData(logoUrl)
                        + "'";
                String sqlCreatedAt = "'" + communityInfo.getCreatedAtStr()
                        + "'";
                String sqlCreatedBy = "'"
                        + GlobalSNSUtils.escapeSqlData(createdBy) + "'";
                String updatedAtStr = communityInfo.getUpdatedAtStr();
                String sqlUpdatedAtStr = "NULL";
                if (!updatedAtStr.equals("")) {
                    sqlUpdatedAtStr = "'" + updatedAtStr + "'";
                }
                String updatedBy = communityInfo.getUpdatedBy();
                String sqlUpdatedBy = "''";
                if (updatedBy != null) {
                    sqlUpdatedBy = "'"
                            + GlobalSNSUtils.escapeSqlData(updatedBy) + "'";
                }
                String sqlDeleteFlagStr = "" + communityInfo.getDeleteFlag();
                String deletedAtStr = communityInfo.getDeletedAtStr();
                String sqlDeletedAtStr = "NULL";
                if (!deletedAtStr.equals("")) {
                    sqlDeletedAtStr = "'" + deletedAtStr + "'";
                }
                String deletedBy = communityInfo.getDeletedBy();
                String sqlDeletedBy = "''";
                if (deletedBy != null) {
                    sqlDeletedBy = "'"
                            + GlobalSNSUtils.escapeSqlData(deletedBy) + "'";
                }
                String notifyType = "" + communityInfo.getNotifyType();
                String sqlNotifyTypeStr = "'"
                        + GlobalSNSUtils.escapeSqlData(notifyType) + "'";

                String columns = COLUMN_ROOM_ID_NAME + ", "
                        + COLUMN_ROOM_NAME_NAME + ", "
                        + COLUMN_DESCRIPTION_NAME + ", "
                        + COLUMN_PRIVACY_TYPE_NAME + ", "
                        + COLUMN_MEMBER_ENNTRY_TYPE_NAME + ", "
                        + COLUMN_LOGO_URL_NAME + ", " + COLUMN_CREATED_AT_NAME
                        + ", " + COLUMN_CREATED_BY_NAME + ", "
                        + COLUMN_UPDATED_AT_NAME + ", "
                        + COLUMN_UPDATED_BY_NAME + ", "
                        + COLUMN_DELETE_FLAG_NAME + ", "
                        + COLUMN_DELETED_AT_NAME + ", "
                        + COLUMN_DELETED_BY_NAME + ", "
                        + COLUMN_NOTIFY_TYPE_NAME;
                String values = sqlRoomId + ", " + sqlRoomName + ", "
                        + sqlDescription + ", " + sqlPrivacyType + ", "
                        + sqlMemberEntryType + ", " + sqlLogoUrl + ", "
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

    public static CommunityInfo getCommunityInfoByRoomId(String roomId) {
        CommunityInfo ret = null;
        List<String> roomIdList = new ArrayList<String>();
        roomIdList.add(roomId);
        List<CommunityInfo> CommunityInfoList = getCommunityInfoListByRoomIdList(roomIdList);
        if (CommunityInfoList == null || CommunityInfoList.size() < 1) {
            return ret;
        }
        ret = CommunityInfoList.get(0);
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static List<CommunityInfo> getCommunityInfoListByRoomIdList(
            List<String> roomIdList) {
        List<CommunityInfo> retList = new ArrayList<CommunityInfo>();
        if (roomIdList == null) {
            Log.error("CommunityStoreDbHelper#getCommunityInfoListByRoomIdList - roomIdList is null");
            return retList;
        }
        String sql = getCommunityInfoSelectSqlByRoomIdList(roomIdList);
        if (sql == null || sql.equals("")) {
            Log.error("CommunityStoreDbHelper#getCommunityInfoListByRoomIdList - sql is invalid");
            return retList;
        }
        return getCommunityInfoListBySqlString(sql);
    }

    private static String getCommunityInfoSelectSqlByRoomIdList(
            List<String> roomIdList) {
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
        where = "(" + where + ") AND (" + COLUMN_DELETE_FLAG_NAME + "=0)";
        sql += where;

        return sql;
    }

    @SuppressWarnings("deprecation")
    private static List<CommunityInfo> getCommunityInfoListBySqlString(
            String sql) {
        List<CommunityInfo> retList = new ArrayList<CommunityInfo>();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityStoreDbHelper#getCommunityInfoListBySqlString - sql is invalid");
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
                    CommunityInfo communityInfo = getOneCommunityInfoByResultSet(resultSet);
                    if (communityInfo != null) {
                        retList.add(communityInfo);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error("data fail.", e);
            if (dbOpend) {
                dbHelper.close();
            }
        }
        return retList;
    }

    private static CommunityInfo getOneCommunityInfoByResultSet(
            ResultSet resultSet) {
        CommunityInfo communityInfo = new CommunityInfo();
        try {
            communityInfo.setId(new BigInteger(resultSet
                    .getString(COLUMN_ID_NAME)));
            communityInfo.setRoomId(resultSet.getString(COLUMN_ROOM_ID_NAME));
            communityInfo.setRoomName(resultSet
                    .getString(COLUMN_ROOM_NAME_NAME));
            communityInfo.setDescription(resultSet
                    .getString(COLUMN_DESCRIPTION_NAME));
            communityInfo.setPrivacyType(resultSet
                    .getInt(COLUMN_PRIVACY_TYPE_NAME));
            communityInfo.setMemberEntryType(resultSet
                    .getInt(COLUMN_MEMBER_ENNTRY_TYPE_NAME));
            communityInfo.setLogoUrl(resultSet.getString(COLUMN_LOGO_URL_NAME));
            communityInfo.setCreatedAt(resultSet
                    .getTimestamp(COLUMN_CREATED_AT_NAME));
            communityInfo.setCreatedBy(resultSet
                    .getString(COLUMN_CREATED_BY_NAME));
            communityInfo.setUpdatedAt(resultSet
                    .getTimestamp(COLUMN_UPDATED_AT_NAME));
            String updatedBy = resultSet.getString(COLUMN_UPDATED_BY_NAME);
            communityInfo.setUpdatedBy(updatedBy == null ? "" : updatedBy);
            communityInfo.setDeleteFlag(resultSet
                    .getInt(COLUMN_DELETE_FLAG_NAME));
            communityInfo.setDeletedAt(resultSet
                    .getTimestamp(COLUMN_DELETED_AT_NAME));
            String deletedBy = resultSet.getString(COLUMN_DELETED_BY_NAME);
            communityInfo.setDeletedBy(deletedBy == null ? "" : deletedBy);
            communityInfo.setNotifyType(resultSet.getInt(COLUMN_NOTIFY_TYPE_NAME));
        } catch (SQLException e) {
            return null;
        }
        return communityInfo;
    }

    @SuppressWarnings("deprecation")
    public static List<CommunityInfo> getMyComminityList(String requestJidStr,
                                                         BigInteger startId,
                                                         int count,
                                                         CommunitySortCondition sortCondition) {
        return getComminityList(requestJidStr,
                                startId,
                                count,
                                sortCondition,
                                -1,-1);
    }

    @SuppressWarnings("deprecation")
    public static List<CommunityInfo> getComminityList(String requestJidStr,
                                                       BigInteger startId,
                                                       int count,
                                                       CommunitySortCondition sortCondition,
                                                       int selectPrivacyType,
                                                       int selectListType) {
        List<CommunityInfo> ret = null;
        if (requestJidStr == null || requestJidStr.equals("")) {
            Log.error("CommunityStoreDbHelper#getMyComminityList::fromJid is invalid");
            return ret;
        }
        if (startId == null) {
            Log.error("CommunityStoreDbHelper#getMyComminityList::startId is null");
            return ret;
        }
        if (sortCondition == null) {
            Log.error("CommunityStoreDbHelper#getMyComminityList::sortCondition is null");
            return ret;
        }
        String selectStr = getCommunityInfoSelectString();
        String joinTable = CommunityMemberStoreDbHelper.TABLE_NAME;
        String innerJoinOn = getCommunityMemberDBJoinOnString();

        String where = TABLE_NAME + "." + COLUMN_DELETE_FLAG_NAME + "=0";

        if(selectPrivacyType == 0){
            where += " AND "
                + TABLE_NAME + "." + COLUMN_PRIVACY_TYPE_NAME
                + "=" + selectPrivacyType + "";
            if(selectListType == 0){
                where += " AND "
                    + TABLE_NAME + ".room_id NOT IN"
                    + "(SELECT room_id FROM " + CommunityMemberStoreDbHelper.TABLE_NAME
                    + " WHERE jid='" + requestJidStr + "' AND "
                    + CommunityMemberStoreDbHelper.COLUMN_STATE_NAME
                    + "=" + CommunityMember.STATE_JOIN
                    + ")";
                innerJoinOn = null;
            }else if(selectListType == 1){
                innerJoinOn += " AND "
                    + CommunityMemberStoreDbHelper.TABLE_NAME
                    + "." + CommunityMemberStoreDbHelper.COLUMN_JID_NAME
                    + "='" + requestJidStr + "' ";
                innerJoinOn += " AND "
                    + CommunityMemberStoreDbHelper.COLUMN_STATE_NAME
                    + "=" + CommunityMember.STATE_JOIN;
            }else{
                innerJoinOn = null;
            }
        }else if(selectPrivacyType > 0){
            where += " AND "
                + TABLE_NAME + "." + COLUMN_PRIVACY_TYPE_NAME
                + "=" + selectPrivacyType + "";
            innerJoinOn += " AND "
                + CommunityMemberStoreDbHelper.TABLE_NAME
                + "." + CommunityMemberStoreDbHelper.COLUMN_JID_NAME
                + "='" + requestJidStr + "'"
                + " AND "
                + CommunityMemberStoreDbHelper.COLUMN_STATE_NAME
                + "=" + CommunityMember.STATE_JOIN;
        }else{
            innerJoinOn += " AND "
                + CommunityMemberStoreDbHelper.TABLE_NAME
                + "." + CommunityMemberStoreDbHelper.COLUMN_JID_NAME
                + "='" + requestJidStr + "'"
                + " AND "
                + CommunityMemberStoreDbHelper.COLUMN_STATE_NAME
                + "=" + CommunityMember.STATE_JOIN;
        }

        if (!startId.equals(BigInteger.ZERO)) {
            where = "((" + where + ") OR (" + TABLE_NAME + "." + COLUMN_ID_NAME
                    + "=" + startId.toString() + "))";
        }
        String orderBy = sortCondition.toSqlOrderBySectionString();
        int offset = 0;
        if (startId.longValue() > 0) {
            String getRownumSqlString = "SELECT * FROM (SELECT *, row_number() OVER() as rownum FROM (SELECT "
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

            offset = getSortOffsetValue(getRownumSqlString);
        }
        String getMyCommunityListSqlString = "SELECT " + selectStr + " FROM "
                + TABLE_NAME;
        if(innerJoinOn != null){
            getMyCommunityListSqlString += " INNER JOIN " + joinTable + " ON "
                + innerJoinOn;
        }

        getMyCommunityListSqlString += " WHERE " + where;
        if (!orderBy.equals("")) {
            getMyCommunityListSqlString += " ORDER BY " + orderBy;
        }

        getMyCommunityListSqlString += " LIMIT " + String.valueOf(count)
                + " OFFSET " + String.valueOf(offset);


        ret = getCommunityInfoListBySqlString(getMyCommunityListSqlString);
        return ret;
    }

    private static String getCommunityInfoSelectString() {
        String ret = TABLE_NAME + "." + COLUMN_ID_NAME + ", " + TABLE_NAME
                + "." + COLUMN_ROOM_ID_NAME + ", " + TABLE_NAME + "."
                + COLUMN_ROOM_NAME_NAME + ", " + TABLE_NAME + "."
                + COLUMN_DESCRIPTION_NAME + ", " + TABLE_NAME + "."
                + COLUMN_PRIVACY_TYPE_NAME + ", " + TABLE_NAME + "."
                + COLUMN_MEMBER_ENNTRY_TYPE_NAME + ", " + TABLE_NAME + "."
                + COLUMN_LOGO_URL_NAME + ", " + TABLE_NAME + "."
                + COLUMN_CREATED_AT_NAME + ", " + TABLE_NAME + "."
                + COLUMN_CREATED_BY_NAME + ", " + TABLE_NAME + "."
                + COLUMN_UPDATED_AT_NAME + ", " + TABLE_NAME + "."
                + COLUMN_UPDATED_BY_NAME + ", " + TABLE_NAME + "."
                + COLUMN_DELETE_FLAG_NAME + ", " + TABLE_NAME + "."
                + COLUMN_DELETED_AT_NAME + ", " + TABLE_NAME + "."
                + COLUMN_DELETED_BY_NAME + ", " + TABLE_NAME + "."
                + COLUMN_NOTIFY_TYPE_NAME;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private static String getCommunityMemberDBJoinOnString(String jid) {
        if (jid == null || jid.equals("")) {
            Log.error("CommunityStoreDbHelper#getCommunityMemberDBJoinOnString::jid is invalid");
            return "";
        }
        String joinTable = CommunityMemberStoreDbHelper.TABLE_NAME;
        String ret = TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + "=" + joinTable
            + "." + CommunityMemberStoreDbHelper.COLUMN_ROOM_ID_NAME
            + " AND " + joinTable + "."
            + CommunityMemberStoreDbHelper.COLUMN_JID_NAME + "='" + jid
            + "' AND " + CommunityMemberStoreDbHelper.COLUMN_STATE_NAME
            + "=" + CommunityMember.STATE_JOIN;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private static String getCommunityMemberDBJoinOnString() {
        String joinTable = CommunityMemberStoreDbHelper.TABLE_NAME;
        String ret = TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + "=" + joinTable
            + "." + CommunityMemberStoreDbHelper.COLUMN_ROOM_ID_NAME;
        return ret;
    }

    @SuppressWarnings("deprecation")
    private static int getSortOffsetValue(String getOffsetSql) {
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
            .createReferenceInstance();
        boolean isDbOpend = false;
        int retOffset = 0;
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            isDbOpend = true;
            ResultSet resultSet = dbHelper.executeQuery(getOffsetSql);
            try {
                if (resultSet.next()) {
                    retOffset = resultSet.getInt("rownum");
                }
            } catch (SQLException e) {
                Log.error("Failed to get chatRoomInfolist data1");
                dbHelper.close();
                isDbOpend = false;
                throw new Exception("Failed to select database1");
            }
            if (retOffset < 0) {
                Log.error("rownum is invalid");
                dbHelper.close();
                isDbOpend = false;
                throw new Exception("rownum is invalid");
            }
            dbHelper.close();
        } catch (Exception e) {
            if (isDbOpend) {
                dbHelper.close();
            }
        }
        return retOffset;
    }

    @SuppressWarnings("deprecation")
    public static List<String> getOpendCommunityIdList() {
        List<String> retList = new ArrayList<String>();
        String sql = getOpendCommunityIdListSelectSql();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityStoreDbHelper#getOpendCommunityIdList - sql is invalid");
            return retList;
        }
        return getCommunityListBySqlString(sql);
    }

    private static String getOpendCommunityIdListSelectSql() {
        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_ROOM_ID_NAME + " FROM "
                + TABLE_NAME + " WHERE "
                + TABLE_NAME + "." + COLUMN_PRIVACY_TYPE_NAME + "="
                + CommunityInfo.PRIVACY_TYPE_ITEM_OPEN + " ORDER BY "
                + TABLE_NAME + "." + COLUMN_ID_NAME + " DESC";
        return sql;
    }

    @SuppressWarnings("deprecation")
    private static List<String> getCommunityListBySqlString(
            String sql) {
        List<String> retList = new ArrayList<String>();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityStoreDbHelper#getCommunityListBySqlString - sql is invalid");
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

    @SuppressWarnings("deprecation")
    public static boolean updateCommunityToDb(CommunityInfo communityInfo) {
        if (communityInfo == null) {
            Log.error("updateCommunityToDb::communityInfo is null");
            return false;
        }
        String roomId = communityInfo.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("updateCommunityToDb::roomId is invalid");
            return false;
        }
        String roomName = communityInfo.getRoomName();
        if (roomName == null || roomName.equals("")) {
            Log.error("updateCommunityToDb::roomName is invalid");
            return false;
        }
        String description = communityInfo.getDescription();
        if (description == null) {
            Log.error("updateCommunityToDb::description is invalid");
            return false;
        }
        int privacyType = communityInfo.getPrivacyType();
        int memberEntryType = communityInfo.getMemberEntryType();
        String logoUrl = communityInfo.getLogoUrl();
        if (logoUrl == null) {
            Log.error("updateCommunityToDb::logoUrl is invalid");
            return false;
        }
        Timestamp cretaedAt = communityInfo.getCreatedAt();
        if (cretaedAt == null) {
            Log.error("updateCommunityToDb::cretaedAt is null");
            return false;
        }
        String createdBy = communityInfo.getCreatedBy();
        if (createdBy == null || createdBy.equals("")) {
            Log.error("updateCommunityToDb::createdBy is invalid");
            return false;
        }

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
            .getInstance();
        synchronized (dbHelper) {
            boolean dbOpend = false;
            try {
                if (!dbHelper.open()) {
                    Log.error("updateCommunityToDb::Failed to open database");
                    throw new Exception("Failed to open database");
                }
                dbOpend = true;
                String sqlRoomId = "'" + GlobalSNSUtils.escapeSqlData(roomId)
                        + "'";
                String sqlRoomName = "'"
                        + GlobalSNSUtils.escapeSqlData(roomName) + "'";
                String sqlDescription = "'"
                        + GlobalSNSUtils.escapeSqlData(description) + "'";
                String sqlPrivacyType = String.valueOf(privacyType);
                String sqlMemberEntryType = String.valueOf(memberEntryType);
                String sqlLogoUrl = "'" + GlobalSNSUtils.escapeSqlData(logoUrl)
                        + "'";
                String sqlCreatedAt = "'" + communityInfo.getCreatedAtStr()
                        + "'";
                String sqlCreatedBy = "'"
                        + GlobalSNSUtils.escapeSqlData(createdBy) + "'";
                String updatedAtStr = communityInfo.getUpdatedAtStr();
                String sqlUpdatedAtStr = "NULL";
                if (!updatedAtStr.equals("")) {
                    sqlUpdatedAtStr = "'" + updatedAtStr + "'";
                }
                String updatedBy = communityInfo.getUpdatedBy();
                String sqlUpdatedBy = "''";
                if (updatedBy != null) {
                    sqlUpdatedBy = "'"
                            + GlobalSNSUtils.escapeSqlData(updatedBy) + "'";
                }
                String sqlDeleteFlagStr = "" + communityInfo.getDeleteFlag();
                String deletedAtStr = communityInfo.getDeletedAtStr();
                String sqlDeletedAtStr = "NULL";
                if (!deletedAtStr.equals("")) {
                    sqlDeletedAtStr = "'" + deletedAtStr + "'";
                }
                String deletedBy = communityInfo.getDeletedBy();
                String sqlDeletedBy = "''";
                if (deletedBy != null) {
                    sqlDeletedBy = "'"
                            + GlobalSNSUtils.escapeSqlData(deletedBy) + "'";
                }
                String sqlnotifyTypeStr = "" + communityInfo.getNotifyType();

                String setSql = COLUMN_ROOM_ID_NAME + "=" + sqlRoomId + ","
                        + COLUMN_ROOM_NAME_NAME + "=" + sqlRoomName + ","
                        + COLUMN_DESCRIPTION_NAME + "=" + sqlDescription + ","
                        + COLUMN_PRIVACY_TYPE_NAME + "=" + sqlPrivacyType + ","
                        + COLUMN_MEMBER_ENNTRY_TYPE_NAME + "=" + sqlMemberEntryType + ","
                        + COLUMN_LOGO_URL_NAME + "=" + sqlLogoUrl + ","
                        + COLUMN_CREATED_AT_NAME + "=" + sqlCreatedAt + ","
                        + COLUMN_CREATED_BY_NAME + "=" + sqlCreatedBy + ","
                        + COLUMN_UPDATED_AT_NAME + "=" + sqlUpdatedAtStr + ","
                        + COLUMN_UPDATED_BY_NAME + "=" + sqlUpdatedBy + ","
                        + COLUMN_DELETE_FLAG_NAME + "=" + sqlDeleteFlagStr + ","
                        + COLUMN_DELETED_AT_NAME + "=" + sqlDeletedAtStr + ","
                        + COLUMN_DELETED_BY_NAME + "=" + sqlDeletedBy + ","
                        + COLUMN_NOTIFY_TYPE_NAME + "=" + sqlnotifyTypeStr;
                String where = COLUMN_ID_NAME + "=" + String.valueOf(communityInfo.getId());
                String sql = "UPDATE " + TABLE_NAME + " SET " + setSql
                        + " WHERE " + where;
                if (dbHelper.executeUpdate(sql) == -1) {
                    String errorMessage = String.format(
                            "updateCommunityToDb::Failed to update database (%s)", sql);
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

    @SuppressWarnings("deprecation")
    public static boolean deleteCommunityOnDb(CommunityInfo communityInfo) {
        if (communityInfo == null) {
            Log.error("deleteCommunityOnDb::communityInfo is null");
            return false;
        }
        String roomId = communityInfo.getRoomId();
        if (roomId == null || roomId.equals("")) {
            Log.error("deleteCommunityOnDb::roomId is invalid");
            return false;
        }
        Timestamp updatedAt = communityInfo.getUpdatedAt();
        if (updatedAt == null) {
            Log.error("deleteCommunityOnDb::updatedAt is null");
            return false;
        }
        String updatedBy = communityInfo.getUpdatedBy();
        if (updatedBy == null || updatedBy.equals("")) {
            Log.error("deleteCommunityOnDb::updatedBy is invalid");
            return false;
        }
        Timestamp deletedAt = communityInfo.getDeletedAt();
        if (deletedAt == null) {
            Log.error("deleteCommunityOnDb::deletedAt is null");
            return false;
        }
        String deletedBy = communityInfo.getDeletedBy();
        if (deletedBy == null || deletedBy.equals("")) {
            Log.error("deleteCommunityOnDb::deletedBy is invalid");
            return false;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            boolean dbOpend = false;
            try {
                if (!dbHelper.open()) {
                    Log.error("deleteCommunityOnDb::Failed to open database");
                    throw new Exception("Failed to open database");
                }
                dbOpend = true;
                String sqlRoomId = "'" + GlobalSNSUtils.escapeSqlData(roomId)
                        + "'";
                String updatedAtStr = communityInfo.getUpdatedAtStr();
                String sqlUpdatedAtStr = "NULL";
                if (!updatedAtStr.equals("")) {
                    sqlUpdatedAtStr = "'" + updatedAtStr + "'";
                }
                String sqlUpdatedBy = "'"
                            + GlobalSNSUtils.escapeSqlData(updatedBy) + "'";
                String deletedAtStr = communityInfo.getDeletedAtStr();
                String sqlDeletedAtStr = "NULL";
                if (!deletedAtStr.equals("")) {
                    sqlDeletedAtStr = "'" + deletedAtStr + "'";
                }
                String sqlDeletedBy = "'"
                            + GlobalSNSUtils.escapeSqlData(deletedBy) + "'";

                String setSql = COLUMN_ROOM_ID_NAME + "=" + sqlRoomId + ","
                        + COLUMN_UPDATED_AT_NAME + "=" + sqlUpdatedAtStr + ","
                        + COLUMN_UPDATED_BY_NAME + "=" + sqlUpdatedBy + ","
                        + COLUMN_DELETED_AT_NAME + "=" + sqlDeletedAtStr + ","
                        + COLUMN_DELETED_BY_NAME + "=" + sqlDeletedBy + ","
                        + COLUMN_DELETE_FLAG_NAME + "=2";
                String where = COLUMN_ID_NAME + "=" + String.valueOf(communityInfo.getId());
                String sql = "UPDATE " + TABLE_NAME + " SET " + setSql
                        + " WHERE " + where;
                if (dbHelper.executeUpdate(sql) == -1) {
                    String errorMessage = String.format(
                            "updateCommunityToDb::Failed to update database (%s)", sql);
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

    @SuppressWarnings("deprecation")
    public static List<String> getCommunityRoomIdListByNotifyOff() {
        List<String> retList = new ArrayList<String>();
        String sql = getCommunityRoomIdSelectSqlByNotifyOff();
        if (sql == null || sql.equals("")) {
            Log.error("CommunityStoreDbHelper#getCommunityInfoListByRoomIdList - sql is invalid");
            return retList;
        }
        List<CommunityInfo> communityInfoList = getCommunityInfoListBySqlString(sql);
        for(CommunityInfo info : communityInfoList) {
            retList.add(info.getRoomId());
        }
        return retList;
    }

    private static String getCommunityRoomIdSelectSqlByNotifyOff() {
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE ";
        String where = "";
        where = "(" + COLUMN_NOTIFY_TYPE_NAME + ">0" + ") AND (" + COLUMN_DELETE_FLAG_NAME + "=0)";
        sql += where;

        return sql;
    }

    @SuppressWarnings("deprecation")
    public static boolean updateLastUpdateDate(String update_roomid) {
        if (update_roomid == null || update_roomid.equals("")) {
            Log.error("CommunityStoreDbHelper#updateLastUpdateDate::update_roomid is invalid");
            return false;
        }
        String updateRoomSql = getUpdateLastUpdateDateSql(update_roomid);
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
                if (dbHelper.executeUpdate(updateRoomSql) == -1) {
                    String errorMessage = String.format
                        ("Failed to update database (%s)", updateRoomSql);
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
                Log.error("CommunityStoreDbHelper#updateLastUpdateDate::failed to update data. sql="
                          + updateRoomSql);
                return false;
            }
        }
        return true;
    }

    private static String getUpdateLastUpdateDateSql(String update_roomid) {
        Calendar now = Calendar.getInstance();
        long updatedTime = now.getTimeInMillis();
        java.util.Date date = new java.util.Date(updatedTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        String updatedAt = df.format(date);

        return "update community_store set updated_at="
            + "'" + GlobalSNSUtils.escapeSqlData(updatedAt) + "'"
            + " where room_id="
            + "'" + GlobalSNSUtils.escapeSqlData(update_roomid) + "'";
    }
}
