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
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJobCounting;

import org.jivesoftware.util.Log;

public class GoodJobCountingStoreDbHelper {
    private final static String TABLE_NAME = "goodjob_counting";

    public final static String COLUMN_POINTS_NAME   = "points";
    public final static String COLUMN_JID_NAME      = "jid";
    public final static String COLUMN_UPDATEAT_NAME = "update_at";

    @SuppressWarnings("deprecation")
    public static GoodJobCounting getGoodJobTotal(String dateFrom, String dateTo, String jid) {
        Log.debug("do func  GoodJobCountingStoreDbHelper.getGoodJobTotal(");
        Pattern dateP = Pattern.compile("^[0-9]{4}/[0-9]{2}/[0-9]{2}$");
        if (jid == null || jid.equals("")) {
            Log.warn("GoodJobCountingStoreDbHelper.getGoodJobTotal invalid jid data.");
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
            + "  " + COLUMN_POINTS_NAME + " > 0"
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
            Log.error("GoodJobCountingStoreDbHelper.getGoodJobTotal invalid sql data.");
            return null;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
            .createReferenceInstance();
        GoodJobCounting goodJobData = new GoodJobCounting();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    goodJobData = getGoodJobTotalByResultSet(resultSet);
                }else{
                    goodJobData.setRank(BigInteger.valueOf(0));
                    goodJobData.setPoint(BigInteger.valueOf(0));
                    goodJobData.setJid(jid);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return goodJobData;
    }

    private static GoodJobCounting getGoodJobTotalByResultSet(ResultSet resultSet) {
        GoodJobCounting goodJobData = new GoodJobCounting();
        Log.debug("do func  GoodJobCountingStoreDbHelper.getGoodJobTotalByResultSet(");
        try {
            goodJobData.setRank(resultSet.getBigDecimal("rank").toBigInteger());
            goodJobData.setPoint(resultSet.getBigDecimal(COLUMN_POINTS_NAME).toBigInteger());
            goodJobData.setJid(resultSet.getString(COLUMN_JID_NAME));
        } catch (SQLException e) {
            return null;
        }
        return goodJobData;
    }


    @SuppressWarnings("deprecation")
    public static List<GoodJobCounting> getGoodJobRanking(String dateFrom,
                                                          String dateTo,
                                                          int rankBottom,
                                                          int limit,
                                                          int offset) {
        Log.debug("do func  GoodJobCountingStoreDbHelper.getGoodJobRanking(");
        Pattern dateP = Pattern.compile("^[0-9]{4}/[0-9]{2}/[0-9]{2}$");
        Matcher dateFromM = dateP.matcher(dateFrom);
        String dateFromSql = "";
        if (dateFrom != null && dateFromM.matches()) {
            dateFromSql = " AND updated_at >= '"+GlobalSNSUtils.escapeSqlData(dateFrom)+"'";
        }
        Matcher dateToM = dateP.matcher(dateTo);
        String dateToSql = "";
        if (dateTo != null && dateToM.matches()) {
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
            Log.error("GoodJobCountingStoreDbHelper.getGoodJobRanking invalid sql data.");
            return null;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
            .createReferenceInstance();
        List<GoodJobCounting> goodJobData = null;
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                goodJobData = getGoodJobRankingByResultSet(resultSet);
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        if(goodJobData == null){
            Log.error("db result data null");
        }
        return goodJobData;
    }

    private static List<GoodJobCounting> getGoodJobRankingByResultSet(ResultSet resultSet) throws SQLException {
        int count = resultSet.getFetchSize();
        List<GoodJobCounting> goodJobDatalist = new ArrayList<GoodJobCounting>();
        while (resultSet.next()) {
            GoodJobCounting goodJobData = new GoodJobCounting();
            goodJobData.setRank(resultSet.getBigDecimal("rank").toBigInteger());
            goodJobData.setPoint(resultSet.getBigDecimal(COLUMN_POINTS_NAME).toBigInteger());
            goodJobData.setJid(resultSet.getString(COLUMN_JID_NAME));
            goodJobDatalist.add(goodJobData);
        }
        return goodJobDatalist;
    }
}
