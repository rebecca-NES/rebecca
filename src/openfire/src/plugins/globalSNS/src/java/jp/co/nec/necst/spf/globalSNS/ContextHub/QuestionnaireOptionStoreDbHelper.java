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

import jp.co.nec.necst.spf.globalSNS.Data.QuestionnaireOptionInfo;

public class QuestionnaireOptionStoreDbHelper {

    private QuestionnaireOptionStoreDbHelper() {
    }

    public final static String TABLE_NAME = "questionnaire_option_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_ITEM_ID_NAME = "item_id";
    public final static String COLUMN_OPTION_NAME = "option";

    @SuppressWarnings("deprecation")
    public static boolean insertDb(QuestionnaireOptionInfo questionnaireOptionInfo) {
        boolean ret = false;
        if (questionnaireOptionInfo == null) {
            return ret;
        }
        String sql = getInsertSqlString(questionnaireOptionInfo);
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
    public static List<QuestionnaireOptionInfo> selectDbByItemId(String itemId) {
        List<QuestionnaireOptionInfo> ret = new ArrayList<QuestionnaireOptionInfo>();
        if (itemId == null || itemId.equals("")) {
            Log.debug("selectDbByItemIdAndOption : itemId is invalid");
            return ret;
        }
        String sql = getSelectDbByItemIdSql(itemId);
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
                    QuestionnaireOptionInfo questionnaireOptionInfo = getQuestionnaireOptionInfoByResultSet(resultSet);
                    if (questionnaireOptionInfo != null) {
                        ret.add(questionnaireOptionInfo);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            return null;
        }

        return ret;
    }

    @SuppressWarnings("deprecation")
    private final static String getInsertSqlString(QuestionnaireOptionInfo questionnaireOptionInfo) {
        String sql = "";
        if (questionnaireOptionInfo == null) {
            return sql;
        }
        String itemId = questionnaireOptionInfo.getItemId();
        if (itemId == null || itemId.equals("")) {
            Log.debug("getInsertSqlString : itemId is invalid");
            return sql;
        }
        String option = questionnaireOptionInfo.getOption();
        if (option == null || option.equals("")) {
            Log.debug("getInsertSqlString : option is invalid");
            return sql;
        }

        String columns = COLUMN_ITEM_ID_NAME + ", " + COLUMN_OPTION_NAME;

        String values = "'" + itemId + "', '" + option + "'";
        sql = "INSERT INTO " + TABLE_NAME + " (" + columns + ") VALUES ("
                + values + ");";
        return sql;
    }

    @SuppressWarnings("deprecation")
    private static String getSelectDbByItemIdSql(String itemId) {
        if (itemId == null || itemId.equals("")) {
            Log.error("getSelectDbByItemIdAndOptionSql : itemId is invalid");
            return "";
        }
        return String.format("SELECT * FROM %s WHERE %s = '%s' ORDER BY " + 
                COLUMN_ID_NAME + " ASC;",
                TABLE_NAME, COLUMN_ITEM_ID_NAME, itemId);
    }

    private static QuestionnaireOptionInfo getQuestionnaireOptionInfoByResultSet(ResultSet resultSet) {
        QuestionnaireOptionInfo questionnaireOptionInfo = new QuestionnaireOptionInfo();
        try {
            questionnaireOptionInfo.setId(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
            questionnaireOptionInfo.setItemId(resultSet.getString(COLUMN_ITEM_ID_NAME));
            questionnaireOptionInfo
                    .setOption(resultSet.getString(COLUMN_OPTION_NAME));
        } catch (SQLException e) {
            return null;
        }
        return questionnaireOptionInfo;
    }

}
