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

import java.util.Hashtable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPointCounting;

import org.jivesoftware.util.Log;

public class EmotionPointCountingStoreDbHelper {
    private final static String TABLE_NAME = "thankspoint_counting";

    public final static String COLUMN_POINTS_NAME   = "points";
    public final static String COLUMN_JID_NAME      = "jid";
    public final static String COLUMN_UPDATEAT_NAME = "update_at";

    @SuppressWarnings("deprecation")
    public static EmotionPointCounting getEmotionPointTotal(String dateFrom, String dateTo, String jid) {
        Log.debug("do func  EmotionPointCountingStoreDbHelper.getEmotionPointTotal(");
        Pattern dateP = Pattern.compile("^[0-9]{4}/[0-9]{2}/[0-9]{2}$");
        if (jid == null || jid.equals("")) {
            Log.warn("EmotionPointCountingStoreDbHelper.getEmotionPointTotal invalid jid data.");
            return null;
        }
        Matcher dateFromM = dateP.matcher(dateFrom);
        String dateFromSql = "";
        if (dateFrom != null && dateFromM.matches() ) {
            dateFromSql = " AND updated_at >= '"+GlobalSNSUtils.escapeSqlData(dateFrom)+"'";
        }
        Matcher dateToM = dateP.matcher(dateTo);
        String dateToSql = "";
        if (dateTo != null && dateToM.matches() ) {
            dateToSql = " AND updated_at <= '"+GlobalSNSUtils.escapeSqlData(dateTo)+"'";
        }
        String sql = "SELECT * FROM ( SELECT * FROM (SELECT"
            + "  rank() OVER (ORDER BY sum(" + COLUMN_POINTS_NAME + ") DESC) as rank,"
            + "  sum(" + COLUMN_POINTS_NAME + ") as " + COLUMN_POINTS_NAME + ","
            + "  jid"
            + " FROM"
            + "  " + TABLE_NAME
            + " WHERE"
            + "  " + COLUMN_POINTS_NAME + " > 0 "
            + dateFromSql
            + dateToSql
            + " GROUP BY"
            + "  " + COLUMN_JID_NAME + ""
            + " ORDER BY"
            + "  " + COLUMN_POINTS_NAME + " desc, " + COLUMN_JID_NAME + ") AS n ) AS n2 "
            + " WHERE "
            + "  " + COLUMN_JID_NAME + "='" + GlobalSNSUtils.escapeSqlData(jid) + "'"
            ;

        if (sql == null || sql.equals("")) {
            Log.error("EmotionPointCountingStoreDbHelper.getEmotionPointTotal invalid sql data.");
            return null;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
            .createReferenceInstance();
        EmotionPointCounting emotionPointData = new EmotionPointCounting();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    emotionPointData = getEmotionPointTotalByResultSet(resultSet);
                }else{
                    emotionPointData.setRank(BigInteger.valueOf(0));
                    emotionPointData.setPoint(BigInteger.valueOf(0));
                    emotionPointData.setJid(jid);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return emotionPointData;
    }

    private static EmotionPointCounting getEmotionPointTotalByResultSet(ResultSet resultSet) {
        EmotionPointCounting emotionPointData = new EmotionPointCounting();
        try {
            emotionPointData.setRank(resultSet.getBigDecimal("rank").toBigInteger());
            emotionPointData.setPoint(resultSet.getBigDecimal(COLUMN_POINTS_NAME).toBigInteger());
            emotionPointData.setJid(resultSet.getString(COLUMN_JID_NAME));
        } catch (SQLException e) {
            return null;
        }
        return emotionPointData;
    }


    @SuppressWarnings("deprecation")
    public static List<EmotionPointCounting> getEmotionPointRanking(String dateFrom,
                                                                    String dateTo,
                                                                    int rankBottom,
                                                                    int limit,
                                                                    int offset) {
        Log.debug("do func  EmotionPointCountingStoreDbHelper.getEmotionPointRanking(");
        Pattern dateP = Pattern.compile("^[0-9]{4}/[0-9]{2}/[0-9]{2}$");
        Matcher dateFromM = dateP.matcher(dateFrom);
        String dateFromSql = "";
        if (dateFrom != null && dateFromM.matches() ) {
            dateFromSql = " AND updated_at >= '"+GlobalSNSUtils.escapeSqlData(dateFrom)+"'";
        }
        Matcher dateToM = dateP.matcher(dateTo);
        String dateToSql = "";
        if (dateTo != null && dateToM.matches() ) {
            dateToSql = " AND updated_at <= '"+GlobalSNSUtils.escapeSqlData(dateTo)+"'";
        }
        String rankfromsql = "";
        if(rankBottom >= 0){
            rankfromsql = " WHERE n.rank <= " + rankBottom;
        }
        String limitsql = "";
        if(limit >= 0){
            limitsql = " LIMIT " + limit;
        }
        String offsetsql = "";
        if(offset >= 0){
            offsetsql = " OFFSET " + offset;
        }

        String sql = "SELECT * FROM (SELECT"
            + "  rank() OVER (ORDER BY sum(" + COLUMN_POINTS_NAME + ") DESC) as rank,"
            + "  sum(" + COLUMN_POINTS_NAME + ") as " + COLUMN_POINTS_NAME + ","
            + "  jid"
            + " FROM"
            + "  " + TABLE_NAME
            + " WHERE"
            + "  " + COLUMN_POINTS_NAME + " > 0 "
            + dateFromSql
            + dateToSql
            + " GROUP BY"
            + "  jid"
            + " ORDER BY"
            + "  " + COLUMN_POINTS_NAME + " desc, jid) AS n"
            +    rankfromsql
            +    limitsql
            +    offsetsql
            ;
        if (sql == null || sql.equals("")) {
            Log.error("EmotionPointCountingStoreDbHelper.getEmotionPointRanking invalid sql data.");
            return null;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
            .createReferenceInstance();
        List<EmotionPointCounting> emotionPointData = null;
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                emotionPointData = getEmotionPointRankingByResultSet(resultSet);
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        if(emotionPointData == null){
            Log.error("db result data null");
        }
        return emotionPointData;
    }

    private static List<EmotionPointCounting> getEmotionPointRankingByResultSet(ResultSet resultSet)
        throws SQLException {
        int count = resultSet.getFetchSize();
        List<EmotionPointCounting> emotionPointDatalist = new ArrayList<EmotionPointCounting>();
        while (resultSet.next()) {
            EmotionPointCounting emotionPointData = new EmotionPointCounting();
            emotionPointData.setRank(resultSet.getBigDecimal("rank").toBigInteger());
            emotionPointData.setPoint(resultSet.getBigDecimal(COLUMN_POINTS_NAME).toBigInteger());
            emotionPointData.setJid(resultSet.getString(COLUMN_JID_NAME));
            emotionPointDatalist.add(emotionPointData);
        }
        return emotionPointDatalist;
    }
}
