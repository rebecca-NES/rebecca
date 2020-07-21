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

import org.jivesoftware.util.Log;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.VoteStore;

public class VoteStoreDbHelper {
    public static final String TABLE_NAME = "questionnaire_vote_store";
    public static final String COLUMN_ID_NAME = "id";
    public static final String COLUMN_ITEM_ID_NAME = "item_id";
    public static final String COLUMN_RVOTE_USER_IDS_NAME = "vote_user_ids";
    public static final String COLUMN_OPTION_ID_NAME = "option_id";
    public static final String COLUMN_COUNT_NAME = "count";

    @SuppressWarnings("deprecation")
    public static boolean insertDb(VoteStore voteStore) {
        boolean ret = false;
        if (voteStore == null) {
            return ret;
        }
        String sql = getInsertSqlString(voteStore);
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
    public static boolean updateVoteStore(List<VoteStore> voteStores) {
        if (voteStores == null) {
            Log.error("VoteStoreDbHelper.updateVoteStore::null voteStore");
            return false;
        }
        for (VoteStore voteStore : voteStores) {
            if (voteStore.getItemId() == null || "".equals(voteStore.getItemId())) {
                Log.error("VoteStoreDbHelper.updateVoteStore::null getItemId");
                return false;
            }
            if(voteStore.getRoomId() == null){
                Log.error("VoteStoreDbHelper.updateVoteStore::null getRoomId");
                return false;
            }
            if (voteStore.getOptionId() == null) {
                Log.error("VoteStoreDbHelper.updateVoteStore::null getOptionId");
                return false;
            }
            if (voteStore.getUserId() == null || "".equals(voteStore.getUserId())) {
                Log.error("VoteStoreDbHelper.updateVoteStore::null getUserId");
                return false;
            }
            String appendUserId =  "'," + voteStore.getUserId() + ",'";
            String itemId = GlobalSNSUtils.escapeSqlData(voteStore.getItemId());
            String roomId = GlobalSNSUtils.escapeSqlData(voteStore.getRoomId());
            BigInteger optionId = voteStore.getOptionId();
            int value = voteStore.getValue();

            StringBuffer sql = new StringBuffer();
            sql.append("UPDATE " + TABLE_NAME);
            sql.append(" SET ");
            sql.append(COLUMN_RVOTE_USER_IDS_NAME + "=");
            sql.append("(CASE WHEN " + COLUMN_RVOTE_USER_IDS_NAME + " IS NULL THEN ");
            sql.append(appendUserId);
            sql.append(" ELSE ");
            sql.append("(" + COLUMN_RVOTE_USER_IDS_NAME + " || " + appendUserId + ")");
            sql.append(" END )");
            sql.append("," + COLUMN_COUNT_NAME + "=");
            sql.append(COLUMN_COUNT_NAME + "+" + value);

            sql.append(" WHERE ");

            String where = "";
            where += COLUMN_ITEM_ID_NAME + " = '" + itemId + "' AND ";
            where += COLUMN_OPTION_ID_NAME + " = '" + optionId + "'"
                    + " AND (" + COLUMN_RVOTE_USER_IDS_NAME + " !~ " + appendUserId + " OR " + COLUMN_RVOTE_USER_IDS_NAME + " IS NULL)"
                    + " AND NOW() < (SELECT CASE WHEN " + MessageStoreDbHelper.COLUMN_DUE_DATE_NAME + " IS NULL THEN"
                    + " TO_DATE('29991231','yyyyMMdd') ELSE " + MessageStoreDbHelper.COLUMN_DUE_DATE_NAME + " END FROM " + MessageStoreDbHelper.TABLE_NAME
                    + " WHERE " + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME + " = '" + itemId + "')";
            if(voteStore.getRoomId().equals("")){
                where += " AND EXISTS ("
                    + "SELECT 1"
                    + "  FROM publicmessage_questionnaire_store "
                    + "  WHERE"
                    + "    item_id='" + itemId + "' AND"
                    + "    room_type=1"
                    + ")";
            }else{
                where += " AND EXISTS ("
                    + "SELECT 1"
                    + "  FROM publicmessage_store "
                    + "  WHERE"
                    + "   item_id='" + itemId + "' AND"
                    + "   msgto='" + roomId + "'"
                    + ")";
            }
            sql.append(where);
            Log.debug("VoteStoreDbHelper.updateVoteStore sql:" + sql.toString());
            GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                    .getInstance();
            synchronized (dbHelper) {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    if (dbHelper.executeUpdate(sql.toString()) == -1) {
                        String errorMessage = String.format(
                                "Failed to update database (%s)", sql);
                        Log.error(errorMessage);
                        dbHelper.close();
                        return false;
                    }
                    dbHelper.close();
                } catch (Exception e) {
                    Log.error(e);
                    return false;
                }
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    public static int getVoteFlag(Message questionnaireMessage, String userId) {
        int voteFlag = Message.VOTE_FLAG_NON_VOTE;
        if (questionnaireMessage == null) {
            Log.error("VoteStoreDbHelper#getVoteFlag - questionnaireMessage is null");
            return voteFlag;
        }
        if(userId == null || "".equals(userId)) {
            Log.error("VoteStoreDbHelper#getVoteFlag - userId is null");
            return voteFlag;
        }
        String sql = getVoteFlagSelectSql(questionnaireMessage, userId);
        if (sql == null) {
            Log.error("VoteStoreDbHelper#getVoteFlag - sql is invalid");
            return voteFlag;
        }
        if (sql.equals("")) {
            return voteFlag;
        }
        Log.debug(sql);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if(resultSet.next()) {
                    voteFlag = Message.VOTE_FLAG_VOTE;
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return voteFlag;
    }

    @SuppressWarnings("deprecation")
    public static List<VoteStore> getOptionItemList(
            Message questionnaireMessage) {
        List<VoteStore> retList = new ArrayList<VoteStore>();
        if (questionnaireMessage == null) {
            Log.error("VoteStoreDbHelper#getOptionItemList - questionnaireMessage is null");
            return retList;
        }
        String sql = getOptionItemListSelectSql(questionnaireMessage);
        if (sql == null) {
            Log.error("VoteStoreDbHelper#getVoteFlag - sql is invalid");
            return retList;
        }
        if (sql.equals("")) {
            return retList;
        }
        Log.debug(sql);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while(resultSet.next()) {
                    VoteStore voteStore = getOneVoteStoreByResultSet(resultSet, false);
                    if (voteStore != null) {
                        retList.add(voteStore);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    @SuppressWarnings("deprecation")
    private static VoteStore getOneVoteStoreByResultSet(ResultSet resultSet,
            boolean b) {
        VoteStore voteStore = new VoteStore();
        try {
            voteStore.setOption(resultSet.getString(QuestionnaireOptionStoreDbHelper.COLUMN_OPTION_NAME));
            voteStore.setOptionId(new BigInteger(resultSet.getString(COLUMN_OPTION_ID_NAME)));
            voteStore.setCount(new BigInteger(resultSet.getString(COLUMN_COUNT_NAME)));
        } catch (SQLException e) {
            Log.error("getOneMessageByResultSet() : ", e);
            return null;
        }
        return voteStore;
    }

    @SuppressWarnings("deprecation")
    private static String getOptionItemListSelectSql(
            Message questionnaireMessage) {
        if (questionnaireMessage == null) {
            Log.error("VoteStoreDbHelper#getOptionItemListSelectSql - questionnaireMessage is null");
            return "";
        }
        String itemId = questionnaireMessage.getItemId();
        if (itemId == null || "".equals(itemId)) {
            Log.error("VoteStoreDbHelper#getVoteFlagSelectSql - itemId is null");
            return "";
        }
        String where = TABLE_NAME + "." + COLUMN_ITEM_ID_NAME + " = '" + itemId + "'";
        String sql = "SELECT " + TABLE_NAME + ".*, " + QuestionnaireOptionStoreDbHelper.TABLE_NAME
                + "." + QuestionnaireOptionStoreDbHelper.COLUMN_OPTION_NAME
                + " FROM " + TABLE_NAME + " JOIN " + QuestionnaireOptionStoreDbHelper.TABLE_NAME
                + " ON " + TABLE_NAME + "." + COLUMN_ITEM_ID_NAME + " = "
                + QuestionnaireOptionStoreDbHelper.TABLE_NAME + "." + QuestionnaireOptionStoreDbHelper.COLUMN_ITEM_ID_NAME
                + " AND " + TABLE_NAME + "." + COLUMN_OPTION_ID_NAME + " = "
                + QuestionnaireOptionStoreDbHelper.TABLE_NAME + "." + QuestionnaireOptionStoreDbHelper.COLUMN_ID_NAME
                + " WHERE " + where
                + " ORDER BY " + TABLE_NAME + "." + COLUMN_OPTION_ID_NAME + " ASC ";

        return sql;
    }

    @SuppressWarnings("deprecation")
    private static String getVoteFlagSelectSql(Message questionnaireMessage,
            String userId) {
        if (questionnaireMessage == null) {
            Log.error("VoteStoreDbHelper#getVoteFlagSelectSql - questionnaireMessage is null");
            return "";
        }
        if (userId == null || "".equals(userId)) {
            Log.error("VoteStoreDbHelper#getVoteFlagSelectSql - userId is null");
            return "";
        }
        String itemId = questionnaireMessage.getItemId();
        if (itemId == null || "".equals(itemId)) {
            Log.error("VoteStoreDbHelper#getVoteFlagSelectSql - itemId is null");
            return "";
        }
        String where = COLUMN_ITEM_ID_NAME + " = '" + itemId + "' AND "
                + COLUMN_RVOTE_USER_IDS_NAME + " LIKE '%," + userId + ",%'";
        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + where;
        return sql;
    }

    @SuppressWarnings("deprecation")
    private final static String getInsertSqlString(VoteStore voteStore) {
        String sql = "";
        if (voteStore == null) {
            return sql;
        }
        String itemId = voteStore.getItemId();
        if (itemId == null || itemId.equals("")) {
            Log.debug("getInsertSqlString : itemId is invalid");
            return sql;
        }
        BigInteger optionId = voteStore.getOptionId();
        if (optionId == null) {
            Log.debug("getInsertSqlString : optionId is invalid");
            return sql;
        }
        BigInteger count = voteStore.getCount();
        if (count == null) {
            Log.debug("getInsertSqlString : count is invalid");
            return sql;
        }

        String columns = COLUMN_ITEM_ID_NAME + ", " + COLUMN_OPTION_ID_NAME + ", " + COLUMN_COUNT_NAME;

        String values = "'" + itemId + "', '" + optionId + "', '" + String.valueOf(count) + "'";
        sql = "INSERT INTO " + TABLE_NAME + " (" + columns + ") VALUES ("
                + values + ");";
        return sql;
    }
}
