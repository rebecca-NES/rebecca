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
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;

import org.jivesoftware.util.Log;

public class EmotionPointStoreDbHelper {
    private final static String TABLE_NAME = "emotion_store";

    private final static String COLUMN_ID_NAME = "id";
    private final static String COLUMN_ITEM_ID_NAME = "item_id";
    private final static String COLUMN_EMOTION_POINT_NAME = "emotion_point";
    private final static String COLUMN_JID_NAME = "jid";
    private final static String COLUMN_CREATED_AT_NAME = "created_at";
    private final static String COLUMN_UPDATED_AT_NAME = "updated_at";
    private final static String AS_NAME_EMOTION_ICONS_JSON_NAME = "emotion_point_icons_json";

    private final static String getEmotionPointInsertSql(EmotionPoint emotionPointData) {
        if (emotionPointData == null) {
            return "";
        }
        String itemId = emotionPointData.getItemId();
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        int emotionPoint = emotionPointData.getEmotionPoint();

        String jid = emotionPointData.getJid();
        if (jid == null || jid.equals("")) {
            return "";
        }
        String createdAt = emotionPointData.getCreatedAtStr();
        if (createdAt == null || createdAt.equals("")) {
            return "";
        }

        String columns = COLUMN_ITEM_ID_NAME + ", "
            + COLUMN_EMOTION_POINT_NAME + ", "
            + COLUMN_JID_NAME + ", "
            + COLUMN_CREATED_AT_NAME;
        String values = "'" + itemId + "', "
            + emotionPoint + ", '"
            + jid + "', '"
            + createdAt + "'";
        String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                + ") VALUES (" + values + ");";
        return sql;
    }

    private final static String getEmotionPointUpdateSql(EmotionPoint emotionPointData) {
        Log.debug("do func EmotionPointStoreDbHelper.getEmotionPointUpdateSql(...");
        if (emotionPointData == null) {
            return "";
        }
        String itemId = emotionPointData.getItemId();
        if (itemId == null || itemId.equals("")) {
            return "";
        }

        int emotionPoint = emotionPointData.getEmotionPoint();

        String jid = emotionPointData.getJid();
        if (jid == null || jid.equals("")) {
            return "";
        }
        String updatedAt = emotionPointData.getUpdatedAtStr();
        if (updatedAt == null || updatedAt.equals("")) {
            return "";
        }

        String sql = "UPDATE " + TABLE_NAME
            + " SET "
            + COLUMN_EMOTION_POINT_NAME + "=" + emotionPoint + ","
            + COLUMN_UPDATED_AT_NAME + "='" + updatedAt + "'"
            + " WHERE "
            + "     " + COLUMN_ITEM_ID_NAME + "='" + GlobalSNSUtils.escapeSqlData(itemId) + "'"
            + " AND " + COLUMN_JID_NAME + "='" + GlobalSNSUtils.escapeSqlData(jid) + "'";
        return sql;
    }


    @SuppressWarnings("deprecation")
    public static boolean insertEmotionPointDataToDb(EmotionPoint emotionPointData) {
        if (emotionPointData == null) {
            return false;
        }
        String sql = getEmotionPointInsertSql(emotionPointData);
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
                Log.error("database open error:" + e);
                return false;
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    public static boolean updateEmotionPointDataToDb(EmotionPoint emotionPointData) {
        Log.debug("do func EmotionPointStoreDbHelper.updateEmotionPointDataToDb(...");
        if (emotionPointData == null) {
            return false;
        }
        String sql = getEmotionPointUpdateSql(emotionPointData);
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
                Log.error("database open error:" + e);
                return false;
            }
        }
        return true;
    }


    @SuppressWarnings("deprecation")
    public static EmotionPoint getEmotionPointData(String itemId, String jid) {
        EmotionPoint emotionPointData = null;
        if (itemId == null || itemId.equals("")) {
            return emotionPointData;
        }
        if (jid == null || jid.equals("")) {
            return emotionPointData;
        }
        String sql = getOneEmotionPointDataSelectSql(itemId, jid);
        if (sql == null || sql.equals("")) {
            return emotionPointData;
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
                    emotionPointData = getOneEmotionPointDataByResultSet(resultSet);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error("database open error:" + e);
        }
        return emotionPointData;
    }

    private final static String getOneEmotionPointDataSelectSql(String itemId,
                                                                String jid) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        if (jid == null || jid.equals("")) {
            return "";
        }
        String itemIdSql = GlobalSNSUtils.escapeSqlData(itemId);
        return String.format
            ("SELECT"
             + " p.msgfrom as msgownjid,"
             + " p.msgto,"
             + " p.entry,"
             + " p.msgtype,"
             + " e.*"
             + " FROM %s AS e,%s as p WHERE (e.%s = '%s' AND e.%s = '%s' AND p.item_id= e.item_id)",
             TABLE_NAME,
                "publicmessage_store",
                COLUMN_ITEM_ID_NAME,
                itemIdSql,
                COLUMN_JID_NAME,
                jid);
    }

    @SuppressWarnings("deprecation")
    public static List<EmotionPoint> getEmotionPointData(String itemId) {
        List<EmotionPoint> emotionPointList = new ArrayList<EmotionPoint>();
        ;
        if (itemId == null || itemId.equals("")) {
            return emotionPointList;
        }
        String sql = getEmotionPointDataSelectSql(itemId);
        if (sql == null || sql.equals("")) {
            return emotionPointList;
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
                    EmotionPoint emotionPointData = getOneEmotionPointDataByResultSet(resultSet);
                    if (emotionPointData == null) {
                        continue;
                    }
                    emotionPointList.add(emotionPointData);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error("database open error:" + e);
        }
        return emotionPointList;
    }

    private final static String getEmotionPointDataSelectSql(String itemId) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        String itemIdSql = GlobalSNSUtils.escapeSqlData(itemId);
        return String.format
            ("SELECT"
             + "  p.msgfrom as msgownjid,"
             + "  p.msgto,"
             + "  p.entry,"
             + "  p.msgtype,"
             + "  e.*,"
             + "  CASE WHEN e.updated_at is NULL THEN e.created_at ELSE e.updated_at END AS edittimestamp "
             + " FROM"
             + "   %s as e,"
             + "   %s as p"
             + " WHERE"
             + "   ("
             + "       e.%s != 0"
             + "        AND"
             + "       e.%s = '%s'"
             + "        AND"
             + "       p.item_id= e.item_id"
             + "   )"
             + " ORDER BY edittimestamp DESC",
             TABLE_NAME,
             "publicmessage_store",
             COLUMN_EMOTION_POINT_NAME,
             COLUMN_ITEM_ID_NAME,
             itemIdSql);
    }

    private static EmotionPoint getOneEmotionPointDataByResultSet(ResultSet resultSet) {
        EmotionPoint emotionPointData = new EmotionPoint();
        try {
            emotionPointData.setId(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
            emotionPointData.setItemId(resultSet.getString(COLUMN_ITEM_ID_NAME));
            emotionPointData.setMsgOwnJid(resultSet.getString("msgownjid"));
            emotionPointData.setMsgTo(resultSet.getString("msgto"));
            emotionPointData.setMsgType(resultSet.getString("msgtype"));
            emotionPointData.setEntry(resultSet.getString("entry"));
            emotionPointData.setEmotionPoint(resultSet.getInt(COLUMN_EMOTION_POINT_NAME));
            emotionPointData.setJid(resultSet.getString(COLUMN_JID_NAME));
            emotionPointData.setCreatedAt(resultSet.getTimestamp(COLUMN_CREATED_AT_NAME));
            emotionPointData.setUpdatedAt(resultSet.getTimestamp(COLUMN_UPDATED_AT_NAME));
        } catch (SQLException e) {
            return null;
        }
        return emotionPointData;
    }

    @SuppressWarnings("deprecation")
    public static String getEmotionPointIconJson(String itemId) {
        String iconsJson = "{}";
        if (itemId == null || itemId.equals("")) {
            return iconsJson;
        }
        String sql = getEmotionPointIconSelectSql(itemId);
        if (sql == null || sql.equals("")) {
            return iconsJson;
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
                    iconsJson = resultSet.getString(AS_NAME_EMOTION_ICONS_JSON_NAME);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error("database open error:" + e);
        }
        return iconsJson;
    }

    private final static String getEmotionPointIconSelectSql(String itemId) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        String itemIdSql = GlobalSNSUtils.escapeSqlData(itemId);
        return String.format
            ("SELECT"
             + "   CASE"
             + "     WHEN p.msgtype = 3 THEN (SELECT emotion_point_icon FROM chatroom_store WHERE room_id=p.msgto)"
             + "     WHEN p.msgtype = 5 THEN (SELECT emotion_point_icon FROM community_store WHERE room_id=p.msgto)"
             + "   ELSE '{}' END as emotion_point_icons_json"
             + " FROM"
             + "   %s as p"
             + " WHERE"
             + "   p.item_id = '%s'",
             "publicmessage_store",
             itemIdSql);
    }

    @SuppressWarnings("deprecation")
    public static String getEmotionPointIconJsonFromRoomId(int msgType, String roomId) {
        String iconsJson = "{}";
        if (roomId == null || roomId.equals("")) {
            return iconsJson;
        }
        if (msgType != 3 && msgType != 5) {
            return iconsJson;
        }
        String sql = getEmotionPointIconFromRoomIdSelectSql(msgType, roomId);
        if (sql == null || sql.equals("")) {
            return iconsJson;
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
                    iconsJson = resultSet.getString(AS_NAME_EMOTION_ICONS_JSON_NAME);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error("database open error:" + e);
        }
        return iconsJson;
    }

    private final static String getEmotionPointIconFromRoomIdSelectSql(int msgType, String roomId) {
        if (roomId == null || roomId.equals("")) {
            return "";
        }
        String roomIdSql = GlobalSNSUtils.escapeSqlData(roomId);
        return String.format
            ("SELECT"
             + "   CASE"
             + "     WHEN %s = 3 THEN (SELECT emotion_point_icon FROM chatroom_store WHERE room_id='%s')"
             + "     WHEN %s = 5 THEN (SELECT emotion_point_icon FROM community_store WHERE room_id='%s')"
             + "   ELSE '{}' END as emotion_point_icons_json",
             msgType,roomIdSql,
             msgType,roomIdSql);
    }

}
