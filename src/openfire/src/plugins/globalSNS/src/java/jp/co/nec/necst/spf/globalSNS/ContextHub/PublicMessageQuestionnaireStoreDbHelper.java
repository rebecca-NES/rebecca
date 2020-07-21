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

import org.jivesoftware.util.Log;

import jp.co.nec.necst.spf.globalSNS.Data.PublicMessageQuestionnaireInfo;

public class PublicMessageQuestionnaireStoreDbHelper {

    private PublicMessageQuestionnaireStoreDbHelper() {
    }

    public final static String TABLE_NAME = "publicmessage_questionnaire_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_ITEM_ID_NAME = "item_id";
    public final static String COLUMN_INPUT_TYPE_NAME = "input_type";
    public final static String COLUMN_RESULT_VISIBLE_NAME = "result_visible";
    public final static String COLUMN_GRAPH_TYPE_NAME = "graph_type";
    public final static String COLUMN_ROOM_TYPE_NAME = "room_type";

    @SuppressWarnings("deprecation")
    public static boolean insertDb(PublicMessageQuestionnaireInfo publicmessageQuestionnaireInfo) {
        boolean ret = false;
        if (publicmessageQuestionnaireInfo == null) {
            return ret;
        }
        String sql = getInsertSqlString(publicmessageQuestionnaireInfo);
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
    private final static String getInsertSqlString(PublicMessageQuestionnaireInfo publicmessageQuestionnaireInfo) {
        String sql = "";
        if (publicmessageQuestionnaireInfo == null) {
            return sql;
        }
        String itemId = publicmessageQuestionnaireInfo.getItemId();
        if (itemId == null || itemId.equals("")) {
            Log.debug("getInsertSqlString : itemId is invalid");
            return sql;
        }
        int inputType = publicmessageQuestionnaireInfo.getInputType();
        if (inputType != PublicMessageQuestionnaireInfo.INPUT_TYPE_RADIOBOX
                && inputType != PublicMessageQuestionnaireInfo.INPUT_TYPE_CHECKBOX) {
            Log.debug("getInsertSqlString : inputType is invalid");
            return sql;
        }
        int resultVisible = publicmessageQuestionnaireInfo.getResultVisible();
        if (resultVisible != PublicMessageQuestionnaireInfo.RESULT_VISIBLE_PUBLIC
                && resultVisible != PublicMessageQuestionnaireInfo.RESULT_VISIBLE_CREATOR_ONLY) {
            Log.debug("getInsertSqlString : resultVisible is invalid");
            return sql;
        }
        int graphType = publicmessageQuestionnaireInfo.getGraphType();
        if (graphType != PublicMessageQuestionnaireInfo.GRAPH_TYPE_BAR
                && graphType != PublicMessageQuestionnaireInfo.GRAPH_TYPE_PIE) {
            Log.debug("getInsertSqlString : graphType is invalid");
            return sql;
        }
        int roomType = publicmessageQuestionnaireInfo.getRoomType();
        if (roomType != PublicMessageQuestionnaireInfo.ROOM_TYPE_PUBLIC
                && roomType != PublicMessageQuestionnaireInfo.ROOM_TYPE_GROUP
                && roomType != PublicMessageQuestionnaireInfo.ROOM_TYPE_COMMUNITY) {
            Log.debug("getInsertSqlString : roomType is invalid");
            return sql;
        }

        String columns = COLUMN_ITEM_ID_NAME + ", " + COLUMN_INPUT_TYPE_NAME + ", "
                + COLUMN_RESULT_VISIBLE_NAME + ", " + COLUMN_GRAPH_TYPE_NAME + "," + COLUMN_ROOM_TYPE_NAME;

        String values = "'" + itemId + "', '" + String.valueOf(inputType) + "', "
                + String.valueOf(resultVisible) + ", '" + String.valueOf(graphType) + "'"
                + ", '" + String.valueOf(roomType) + "'";
        sql = "INSERT INTO " + TABLE_NAME + " (" + columns + ") VALUES ("
                + values + ");";
        return sql;
    }

    @SuppressWarnings("deprecation")
    public static String getQuestionnaireRoomType(String itemId) {
        String ret = null;
        if(itemId == null || "".equals(itemId)) {
            Log.error("QuestionnaireMessageDbHelper :: getQuestionnaireRoomType itemId is nvl");
            return null;
        }

        String sql = "SELECT * FROM " + TABLE_NAME + " WHERE " + COLUMN_ITEM_ID_NAME + " = '" + itemId + "'";

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    ret =  resultSet.getString(COLUMN_ROOM_TYPE_NAME);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
                return null;
            }
            dbHelper.close();
        } catch (Exception e) {
            return null;
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static String getQuestionnaireItemIdListSelectSqlMsgTypeOrder(int msgtype){
        String sql = "";
        if (msgtype < 0) {
            return sql;
        }
        sql = "SELECT " + COLUMN_ITEM_ID_NAME
            + " FROM " + TABLE_NAME
            + " WHERE " + COLUMN_ROOM_TYPE_NAME + "="+msgtype;
        return sql;
    }
}
