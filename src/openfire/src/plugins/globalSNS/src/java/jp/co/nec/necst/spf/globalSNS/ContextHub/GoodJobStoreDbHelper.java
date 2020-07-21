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
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;

import org.jivesoftware.util.Log;

public class GoodJobStoreDbHelper {
    private final static String TABLE_NAME = "goodjob_store";

    private final static String COLUMN_ID_NAME = "id";
    private final static String COLUMN_ITEM_ID_NAME = "item_id";
    private final static String COLUMN_ITEM_KEEPER_JID_NAME = "item_keeper_jid";
    private final static String COLUMN_GJ_JID_NAME = "gj_jid";
    private final static String COLUMN_DATE_NAME = "date";

    private final static String getGoodJobInsertSql(GoodJob goodJobData) {
        if (goodJobData == null) {
            return "";
        }
        String itemId = goodJobData.getItemId();
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        String itemKeeperJid = goodJobData.getItemKeeperJid();
        if (itemKeeperJid == null || itemKeeperJid.equals("")) {
            return "";
        }
        String gjJid = goodJobData.getGjJid();
        if (gjJid == null || gjJid.equals("")) {
            return "";
        }
        String date = goodJobData.getDateStr();
        if (date == null || date.equals("")) {
            return "";
        }

        String columns = COLUMN_ITEM_ID_NAME + ", "
                + COLUMN_ITEM_KEEPER_JID_NAME + ", " + COLUMN_GJ_JID_NAME
                + ", " + COLUMN_DATE_NAME;
        String values = "'" + itemId + "', '" + itemKeeperJid + "', '" + gjJid
                + "', '" + date + "'";
        String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                + ") VALUES (" + values + ");";
        return sql;
    }

    @SuppressWarnings("deprecation")
    public static boolean insertGoodJobDataToDb(GoodJob goodJobData) {
        if (goodJobData == null) {
            return false;
        }
        String sql = getGoodJobInsertSql(goodJobData);
        if (sql == null || sql.equals("")) {
            return false;
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
    public static GoodJob getGoodJobData(String itemId, String gjJid) {
        GoodJob goodJobData = null;
        if (itemId == null || itemId.equals("")) {
            return goodJobData;
        }
        if (gjJid == null || gjJid.equals("")) {
            return goodJobData;
        }
        String sql = getOneGoodJobDataSelectSql(itemId, gjJid);
        if (sql == null || sql.equals("")) {
            return goodJobData;
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
                if (resultSet.next()) {
                    goodJobData = getOneGoodJobDataByResultSet(resultSet);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return goodJobData;
    }

    private final static String getOneGoodJobDataSelectSql(String itemId,
            String gjJid) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        if (gjJid == null || gjJid.equals("")) {
            return "";
        }
        String itemIdSql = GlobalSNSUtils.escapeSqlData(itemId);
        return String.format("SELECT"
                             + " p.msgfrom as msgownjid,"
                             + " p.msgto,"
                             + " p.entry,"
                             + " p.msgtype,"
                             + " g.*"
                             + " FROM %s AS g, publicmessage_store AS p WHERE g.item_id=p.item_id AND (g.%s = '%s' AND g.%s = '%s')",
                TABLE_NAME, COLUMN_ITEM_ID_NAME, itemIdSql, COLUMN_GJ_JID_NAME,
                gjJid);
    }

    @SuppressWarnings("deprecation")
    public static List<GoodJob> getGoodJobData(String itemId) {
        List<GoodJob> goodJobList = new ArrayList<GoodJob>();
        ;
        if (itemId == null || itemId.equals("")) {
            return goodJobList;
        }
        String sql = getGoodJobDataSelectSql(itemId);
        if (sql == null || sql.equals("")) {
            return goodJobList;
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
                    GoodJob goodJobData = getOneGoodJobDataByResultSet(resultSet);
                    if (goodJobData == null) {
                        continue;
                    }
                    goodJobList.add(goodJobData);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return goodJobList;
    }

    private final static String getGoodJobDataSelectSql(String itemId) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        String itemIdSql = GlobalSNSUtils.escapeSqlData(itemId);
        return String.format("SELECT"
                             + " p.msgfrom as msgownjid,"
                             + " p.msgto,"
                             + " p.entry,"
                             + " p.msgtype,"
                             + " g.*"
                             + " FROM %s AS g, publicmessage_store AS p WHERE g.item_id=p.item_id AND (g.%s = '%s')",
                TABLE_NAME, COLUMN_ITEM_ID_NAME, itemIdSql);
    }

    private static GoodJob getOneGoodJobDataByResultSet(ResultSet resultSet) {
        GoodJob goodJobData = new GoodJob();
        try {
            goodJobData.setId(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
            goodJobData.setItemId(resultSet.getString(COLUMN_ITEM_ID_NAME));
            goodJobData.setMsgOwnJid(resultSet.getString("msgownjid"));
            goodJobData.setMsgTo(resultSet.getString("msgto"));
            goodJobData.setMsgType(resultSet.getString("msgtype"));
            goodJobData.setEntry(resultSet.getString("entry"));
            goodJobData.setItemKeeperJid(resultSet
                    .getString(COLUMN_ITEM_KEEPER_JID_NAME));
            goodJobData.setGjJid(resultSet.getString(COLUMN_GJ_JID_NAME));
            goodJobData.setDate(resultSet.getTimestamp(COLUMN_DATE_NAME));
        } catch (SQLException e) {
            return null;
        }
        return goodJobData;
    }

}
