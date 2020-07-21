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
import java.util.HashSet;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.QuestionnaireSearchFilter;
import jp.co.nec.necst.spf.globalSNS.Data.QuestionnaireSearchSortCondition;
import jp.co.nec.necst.spf.globalSNS.Data.TaskSearchSortCondition;

import org.jivesoftware.util.Log;

public class QuestionnaireMessageDbHelper extends MessageStoreDbHelper {

    @SuppressWarnings("deprecation")
    public static int getNextQuestionnaireMessageItemIdNumber(String fromJid) {
        int retNumber = 0;
        if (fromJid == null) {
            return retNumber;
        }
        String messageIdPrefix = getQuestionnaireMessageItemIdPrefix(fromJid);
        if (messageIdPrefix == null || messageIdPrefix.equals("")) {
            return retNumber;
        }
        String sql = "SELECT " + COLUMN_ID_NAME + ", " + COLUMN_ITEM_ID_NAME
                + " FROM " + TABLE_NAME + " WHERE " + COLUMN_MESSAGE_TYEP_NAME
                + "=" + Message.TYPE_QUESTIONNAIRE + " AND " + COLUMN_ITEM_ID_NAME
                + " ~ E'^"
                + GlobalSNSUtils.escapeSqlDataForRegexpPhrase(messageIdPrefix)
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
                        String lastItemId = resultSet
                                .getString(COLUMN_ITEM_ID_NAME);
                        String currentIndexNumberStr = "";
                        try {
                            currentIndexNumberStr = lastItemId.substring(
                                    messageIdPrefix.length(),
                                    lastItemId.length());
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

    public static String getQuestionnaireMessageItemIdPrefix(String fromJid) {
        String ret = "";
        if (fromJid == null) {
            return ret;
        }
        String accountName = fromJid.split("@")[0];
        ret = "questionnaire_" + accountName + "_";
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static List<Message> getQuestionnaireListDbData(int baseId, int countNum,
            QuestionnaireSearchFilter filter, QuestionnaireSearchSortCondition sortCondition,
            String fromJidString) {
        String leftJoinVote = getLeftJoinVoteSqlString();
        String leftJoinQuestionnaire = getLeftJoinQuestionnaireSqlString(filter);
        Set<String> jidSet = new HashSet<String>();
        jidSet.add(fromJidString.trim());
        List<Profile> profiles = UserProfileDbHelper.getUserProfileDataList(jidSet, false);
        String read_users = "";
        if (profiles != null || !profiles.isEmpty()) {
            for(int i=0;i<profiles.size();i++){
                Profile profile = profiles.get(i);
                int id = profile.getId();
                BigInteger userId = BigInteger.valueOf(id);
                String s62 = GlobalSNSUtils.decimalToSixtyTwoString(userId);
                read_users += " WHEN qvs.group_concat LIKE '%," + GlobalSNSUtils.escapeSqlData(s62) + ",%' THEN 1 ";
            }
        }
        String where = getWhereSqlString(baseId, filter);
        String orderBy = getOrderBySqlString(sortCondition);
        String getRownumSqlString = "";
        if (baseId > 0) {
            getRownumSqlString = "SELECT * FROM (SELECT *, row_number() OVER () as rownum FROM (SELECT qm.* FROM "
                    + TABLE_NAME + " AS qm ";
            if (!leftJoinVote.equals("")) {
                getRownumSqlString += " LEFT JOIN " + leftJoinVote;
            }
            if (!leftJoinQuestionnaire.equals("")) {
                getRownumSqlString += " LEFT JOIN " + leftJoinQuestionnaire;
            }
            if (!where.equals("")) {
                getRownumSqlString += " WHERE " + where;
            }
            if (!orderBy.equals("")) {
                getRownumSqlString += " ORDER BY " + orderBy;
            }
            getRownumSqlString += ") as dummy_table) as dummy_table2 WHERE id="
                    + String.valueOf(baseId);
        }
        int offset = -1;
        List<Message> retList = null;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }

            ResultSet resultSet;
            if (baseId > 0) {
                resultSet = dbHelper.executeQuery(getRownumSqlString);
                try {
                    if (resultSet.next()) {
                        offset = resultSet.getInt("rownum");
                    }
                } catch (SQLException e) {
                    Log.error("Failed to get tasklist data1");
                    dbHelper.close();
                    return null;
                }
                if (offset < 0) {
                    Log.error("rownum is invalid");
                    dbHelper.close();
                    return null;
                }
            } else {
                offset = 0;
            }
            String getQuestionnaireMessageSqlString = "SELECT qm.*, 0 AS "
                + COLUMN_VOTE_FLAG + " FROM " + TABLE_NAME + " AS qm ";
            if (read_users != null && !read_users.equals("")) {
                getQuestionnaireMessageSqlString = "SELECT qm.*,"
                        + " CASE"
                        + " WHEN"
                        + "  PQ.ROOM_TYPE = 3"
                        + " THEN"
                        + "  (select room_name from chatroom_store where room_id=QM.MSGTO limit 1)"
                        + " WHEN"
                        + "  PQ.ROOM_TYPE = 5"
                        + " THEN"
                        + "  (select room_name from community_store where room_id=QM.MSGTO limit 1)"
                        + " ELSE"
                        + "  ''"
                        + " END AS room_name,"
                        + " CASE"
                        + " WHEN"
                        + "  PQ.ROOM_TYPE = 3"
                        + " THEN"
                        + "  (select parent_room_id from chatroom_store where room_id=QM.MSGTO limit 1)"
                        + " ELSE"
                        + "  ''"
                        + " END AS parent_room_id,"
                        +" pq." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME 
                        + ", pq." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_INPUT_TYPE_NAME
                        + ", pq." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_RESULT_VISIBLE_NAME
                        + ", pq." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_GRAPH_TYPE_NAME
                        + ", CASE " + read_users + " ELSE 0 END AS "
                        + COLUMN_VOTE_FLAG + " FROM " + TABLE_NAME + " AS qm ";
            }
            if (!leftJoinVote.equals("")) {
                getQuestionnaireMessageSqlString += " LEFT JOIN " + leftJoinVote;
            }
            if (!leftJoinQuestionnaire.equals("")) {
                getQuestionnaireMessageSqlString += " LEFT JOIN " + leftJoinQuestionnaire;
            }
            if (!where.equals("")) {
                getQuestionnaireMessageSqlString += " WHERE " + where;
            }
            if (!orderBy.equals("")) {
                getQuestionnaireMessageSqlString += " ORDER BY " + orderBy;
            }
            getQuestionnaireMessageSqlString += " LIMIT " + String.valueOf(countNum)
                    + " OFFSET " + String.valueOf(offset);
            retList = new ArrayList<Message>();
            resultSet = dbHelper.executeQuery(getQuestionnaireMessageSqlString);
            try {
                while (resultSet.next()) {
                    Message message = MessageStoreDbHelper
                            .getOneMessageByResultSet(resultSet, false, true);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get tasklist data2");
            }

            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private static String getLeftJoinVoteSqlString() {
        StringBuffer leftJoin = new StringBuffer();
        leftJoin.append(" (SELECT DISTINCT " + VoteStoreDbHelper.COLUMN_ITEM_ID_NAME + ", ");
        leftJoin.append(" array_to_string(ARRAY(SELECT " + " qi." + VoteStoreDbHelper.COLUMN_RVOTE_USER_IDS_NAME);
        leftJoin.append(" FROM " + VoteStoreDbHelper.TABLE_NAME + " AS qi");
        leftJoin.append(" WHERE qi." + VoteStoreDbHelper.COLUMN_ITEM_ID_NAME + "= qd.");
        leftJoin.append(VoteStoreDbHelper.COLUMN_ITEM_ID_NAME + "),'') AS group_concat FROM ");
        leftJoin.append(VoteStoreDbHelper.TABLE_NAME + " AS qd GROUP BY qd." + VoteStoreDbHelper.COLUMN_ITEM_ID_NAME + ") AS qvs");
        leftJoin.append(" ON qm." + COLUMN_ITEM_ID_NAME + "= qvs." + VoteStoreDbHelper.COLUMN_ITEM_ID_NAME);
        return leftJoin.toString();
    }

    private static String getLeftJoinQuestionnaireSqlString(QuestionnaireSearchFilter filter) {
        StringBuffer leftJoin = new StringBuffer();
        leftJoin.append(PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME + " AS pq ON ");
        leftJoin.append(" qm." + COLUMN_ITEM_ID_NAME + "= pq." + VoteStoreDbHelper.COLUMN_ITEM_ID_NAME);
        return leftJoin.toString();
    }

    private static String getWhereSqlString(int baseId, QuestionnaireSearchFilter filter) {
        String where = "";
        boolean isFirst = true;
        if (filter != null) {
            String fromJidFilter = filter.getFromJid();
            boolean isFromJidFirst = true;
            if (fromJidFilter != null && !fromJidFilter.equals("")) {
                fromJidFilter = GlobalSNSUtils.escapeSqlData(fromJidFilter);
                if (isFromJidFirst) {
                    where = "(";
                    isFirst = false;
                    isFromJidFirst = false;
                } else {
                    where += " OR ";
                }
                where += "qm." + COLUMN_MESSAGE_FROM_NAME + "='" + fromJidFilter + "'";

                where += " OR qm.group_name='' OR ";
                where += " qm.group_name IS NULL OR qm.group_name IN (select DISTINCT ";
                where += CommunityMemberStoreDbHelper.COLUMN_ROOM_ID_NAME + " FROM ";
                where += CommunityMemberStoreDbHelper.TABLE_NAME + " WHERE ";
                where += CommunityMemberStoreDbHelper.COLUMN_JID_NAME + " = '" + fromJidFilter + "')";
                where += " OR qm.group_name IN (select DISTINCT ";
                where += ChatRoomMemberStoreDbHelper.COLUMN_ROOM_ID_NAME + " FROM ";
                where += ChatRoomMemberStoreDbHelper.TABLE_NAME + " WHERE ";
                where += ChatRoomMemberStoreDbHelper.COLUMN_JID_NAME + " = '" + fromJidFilter + "')";
                if (!isFromJidFirst) {
                    where += ")";
                }
            }

            List<String> groupFilterList = filter.getGroup();
            int groupFilterSize = groupFilterList.size();
            boolean isGroupFirst = true;
            for (int i = 0; i < groupFilterSize; i++) {
                String groupFilter = groupFilterList.get(i);
                if (groupFilter == null || groupFilter.equals("")) {
                    continue;
                }
                groupFilter = GlobalSNSUtils.escapeSqlData(groupFilter);
                if (isGroupFirst) {
                    if (isFirst) {
                        where = "(";
                        isFirst = false;
                    } else {
                        where += " AND (";
                    }
                    isGroupFirst = false;
                } else {
                    where += " OR ";
                }
                where += "qm." + COLUMN_GROUP_NAME + "='" + groupFilter + "'";
            }
            if (!isGroupFirst) {
                where += ")";
            }
            List<String> statusFilterList = filter.getStatus();
            int statusFilterSize = statusFilterList.size();
            boolean isStatusFirst = true;
            for (int i = 0; i < statusFilterSize; i++) {
                String statusFilter = statusFilterList.get(i);
                if (statusFilter == null || statusFilter.equals("")) {
                    continue;
                }
                statusFilter = GlobalSNSUtils.escapeSqlData(statusFilter);
                if (isStatusFirst) {
                    if (isFirst) {
                        where = "(";
                        isFirst = false;
                    } else {
                        where += " AND (";
                    }
                    isStatusFirst = false;
                } else {
                    where += " OR ";
                }
                where += "qm." + COLUMN_STATUS_NAME + "='" + statusFilter + "'";
            }
            if (!isStatusFirst) {
                where += ")";
            }
            Timestamp startDate = filter.getStartDate();
            Timestamp endDate = filter.getEndDate();
            if (startDate != null && endDate != null
                    && startDate.before(endDate)) {
                if (isFirst) {
                    where = "(";
                    isFirst = false;
                } else {
                    where += " AND (";
                }
                where += "(" + "qm." + COLUMN_START_DATE_NAME + "<'"
                        + startDate.toString() + "' AND "
                        + "qm." + COLUMN_DUE_DATE_NAME + " is null)";
                where += " OR (" + "qm." + COLUMN_START_DATE_NAME + ">='"
                        + startDate.toString() + "' AND "
                        + "qm." + COLUMN_START_DATE_NAME + "<='" + endDate.toString()
                        + "')";
                where += " OR (" + "qm." + COLUMN_DUE_DATE_NAME + ">='"
                        + startDate.toString() + "' AND "
                        + "qm." + COLUMN_DUE_DATE_NAME + "<='"
                        + endDate.toString() + "')";
                where += " OR (" + "qm." + COLUMN_START_DATE_NAME + "<'"
                        + startDate.toString() + "' AND "
                        + "qm." + COLUMN_DUE_DATE_NAME + ">'" + endDate.toString()
                        + "')";
                where += ")";
            }
        }
        if (isFirst) {
            where = "(" + "qm." + COLUMN_MESSAGE_TYEP_NAME + "=10)";
            isFirst = false;
        } else {
            where += " AND (" + "qm." + COLUMN_MESSAGE_TYEP_NAME + "=10)";
        }

        if (baseId > 0) {
            where = "( " + where + ") ";
            where += " OR (" + "qm." + COLUMN_ID_NAME + "='" + String.valueOf(baseId)
                    + "')";
        }
        where = "( " + where + ") ";
        where += " AND ((" + "qm." + COLUMN_DELETE_FLAG_NAME + "=0)OR("
                + "qm." + COLUMN_DELETE_FLAG_NAME + "=2))";

        if (filter.getWithOutFeedFilter()) {
            where += " AND pq." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME + "!=1 ";
        }
        return where;
    }

    private static String getOrderBySqlString(
            QuestionnaireSearchSortCondition sortCondition) {
        String orderBy = "";
        if (sortCondition != null) {
            Boolean isFirst = true;
            List<String> itemList = sortCondition.getItems();
            List<String> orderList = sortCondition.getOrders();
            int size = itemList.size();
            for (int i = 0; i < size; i++) {
                String item = itemList.get(i);
                String order = orderList.get(i);
                if (isFirst) {
                    isFirst = false;
                } else {
                    orderBy += ", ";
                }
                orderBy += "qm." + item + " ";
                if (order
                        .equals(String
                                .valueOf(TaskSearchSortCondition.SORT_ORDER_TYPE_DESC_STR))) {
                    orderBy += "DESC";
                } else {
                    orderBy += "ASC";
                }
            }
        }
        return orderBy;
    }
}
