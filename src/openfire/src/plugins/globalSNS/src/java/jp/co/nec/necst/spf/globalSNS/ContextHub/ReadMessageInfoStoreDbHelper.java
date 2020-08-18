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
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.jivesoftware.util.Log;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.MessageExistingReaderInfo;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;

public class ReadMessageInfoStoreDbHelper {
    public static final String TABLE_NAME = "read_message_info_store";
    public static final String COLUMN_ID_NAME = "id";
    public static final String COLUMN_ITEM_ID_NAME = "item_id";
    public static final String COLUMN_READ_USER_IDS_NAME = "read_user_ids";
    public static final String COLUMN_LAST_READ_DATE_NAME = "last_read_date";
    public static final String COLUMN_LAST_READ_USER_ID_NAME = "last_read_user_id";
    public static final String COLUMN_COUNT_NAME = "count";

    private static final Pattern mUserIdS62Pattern = Pattern.compile(",[0-9a-zA-z]+,");

    @SuppressWarnings("deprecation")
    public static boolean insertInitialData(BigInteger messageId, String itemId){
        if (messageId == null) {
            Log.error("ReadMessageInfoStoreDbHelper#insertDb::messageId is invalid");
            return false;
        }
        if (itemId == null || itemId.equals("")) {
            Log.error("ReadMessageInfoStoreDbHelper#insertDb::itemId is invalid");
            return false;
        }
        String sql = createInsertInitialDataSqlString(messageId, itemId);
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
                Log.error(e);
                return false;
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    private static String createInsertInitialDataSqlString(BigInteger messageId, String itemId){
        if (messageId == null) {
            Log.error("ReadMessageInfoStoreDbHelper#insertSql::messageId is invalid");
            return null;
        }
        if (itemId == null || itemId.equals("")) {
            Log.error("ReadMessageInfoStoreDbHelper#insertSql::itemId is invalid");
            return null;
        }
        String setMessageReadInfoSql = "INSERT INTO " + TABLE_NAME + " ("
                + COLUMN_ID_NAME + ","
                + COLUMN_ITEM_ID_NAME + ")"
                + " VALUES ("
                + messageId.toString() + ", "
                + "'" + GlobalSNSUtils.escapeSqlData(itemId) + "'"
                + " )";
        return setMessageReadInfoSql;
    }

    @SuppressWarnings("deprecation")
    public static boolean updateInitialData(String itemId){
        if (itemId == null || itemId.equals("")) {
            Log.error("ReadMessageInfoStoreDbHelper#updateInitialData::itemId is invalid");
            return false;
        }
        String sql = resetInitialDataSqlString(itemId);
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
                Log.error(e);
                return false;
            }
        }
        return true;
    }

    @SuppressWarnings("deprecation")
    private static String resetInitialDataSqlString(String itemId){
        if (itemId == null || itemId.equals("")) {
            Log.error("ReadMessageInfoStoreDbHelper#resetInitialDataSqlString::itemId is invalid");
            return null;
        }
        return "UPDATE " + TABLE_NAME
            + " SET "
            + COLUMN_READ_USER_IDS_NAME + "=null, "
            + COLUMN_LAST_READ_DATE_NAME + "=null, "
            + COLUMN_LAST_READ_USER_ID_NAME + "=null, "
            + COLUMN_COUNT_NAME + "=0"
            + " WHERE "
            + COLUMN_ITEM_ID_NAME + "='" + GlobalSNSUtils.escapeSqlData(itemId) + "'";
   }

    @SuppressWarnings("deprecation")
    public static Set<BigInteger> getExistData(Collection<BigInteger> idList) {
        Set<BigInteger> ret = new HashSet<BigInteger>();
        if (idList == null) {
            Log.error("ReadMessageInfoStoreDbHelper#isExistData::idList is invalid");
            return ret;
        }
        String idListInSql = "";
        boolean isFirst = true;
        for(BigInteger id : idList) {
            if(id == null) {
                continue;
            }
            if(isFirst) {
                isFirst = false;
            } else {
                idListInSql += ",";
            }
            idListInSql += id.toString();
        }
        if(idListInSql == null || "".equals(idListInSql)) {
            return ret;
        }
        String sql = "SELECT " + COLUMN_ID_NAME + " FROM " + TABLE_NAME + " WHERE "
                + COLUMN_ID_NAME + " IN (" + idListInSql + ");";
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
                    ret.add(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
                }
            } catch (SQLException e) {
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error(e);
        }
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static List<MessageExistingReaderInfo> getExistingReaderListWithDetail(
            BigInteger id) {
        if(id == null){
            return null;
        }
        List<MessageExistingReaderInfo> retList = null;

        String sql =  String.format(
                "SELECT %s.*, %s, %s FROM %s LEFT JOIN %s USING (%s) WHERE %s = %s;",
                TABLE_NAME,
                ReadMessageDateStoreDbHelper.COLUMN_READ_USER_DATETIMES_NAME,
                ReadMessageDateStoreDbHelper.COLUMN_FIRST_READ_DATE_NAME,
                TABLE_NAME,
                ReadMessageDateStoreDbHelper.TABLE_NAME,
                COLUMN_ID_NAME,
                COLUMN_ID_NAME,
                id.toString()
                );

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
                    retList = getOneMessageExistingReaderInfoByResultSet(resultSet);
                } else {
                    retList = new ArrayList<MessageExistingReaderInfo>();
                }
            } catch (SQLException e) {
                Log.error(e);
            } finally {
                dbHelper.close();
            }
        } catch (Exception e) {
            Log.error(e);
        }
        return retList;
    }

    @SuppressWarnings("deprecation")
    public static List<String> getExistingReaderList(
            BigInteger id) {
        if(id == null){
            return null;
        }
        List<String> retList = new ArrayList<String>();

        String sql = "SELECT " + COLUMN_READ_USER_IDS_NAME
                   + " FROM " + TABLE_NAME + " "
                   + " WHERE "
                   + COLUMN_ID_NAME + " = " + id.toString();

        String readUserIds = null;

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
                    readUserIds = resultSet.getString(COLUMN_READ_USER_IDS_NAME);
                }
            } catch (SQLException e) {
                Log.error(e);
            } finally {
                dbHelper.close();
            }

            if(readUserIds == null){
                return retList;
            }

            if(readUserIds.length() == 0){
                return retList;
            }

            Matcher mat = mUserIdS62Pattern.matcher(readUserIds);
            while(mat.find()){
                String userId = mat.group();
                userId = userId.replaceAll(",", "");
                retList.add(userId);
            }

        } catch (Exception e) {
            Log.error(e);
        }
        return retList;
    }

    @SuppressWarnings("deprecation")
    private static List<MessageExistingReaderInfo> getOneMessageExistingReaderInfoByResultSet(
            ResultSet resultSet) {
        List<MessageExistingReaderInfo> retList = new ArrayList<MessageExistingReaderInfo>();

        List<Timestamp> readUserDates = getReadUserDates(resultSet);

        try {
            String readUserIds = null;
            readUserIds = resultSet.getString(COLUMN_READ_USER_IDS_NAME);
            if(readUserIds == null){
                return retList;
            }
            Matcher mat = mUserIdS62Pattern.matcher(readUserIds);
            while(mat.find()){
                MessageExistingReaderInfo messageExistingReaderInfo = new MessageExistingReaderInfo();
                String itemId = resultSet.getString(COLUMN_ITEM_ID_NAME);
                if(itemId == null){
                    continue;
                }
                messageExistingReaderInfo.setItemId(itemId);
                String userIdConvertedS62 = mat.group();
                userIdConvertedS62 = userIdConvertedS62.replaceAll(",", "");
                BigInteger userId = GlobalSNSUtils.sixtyTwoStringToDecimal(userIdConvertedS62);
                Profile profile = UserProfileDbHelper.getUserProfileData(userId, true);
                if(profile == null){
                    continue;
                }
                messageExistingReaderInfo.setJid(profile.getJid());

                if(readUserDates.isEmpty() == false){
                    Timestamp tmp = readUserDates.remove(0);
                    if(tmp.getTime() > 0 )
                        messageExistingReaderInfo.setDate(tmp);
                }

                retList.add(messageExistingReaderInfo);
            }
        } catch (SQLException e) {
            Log.error(e);
            return null;
        }
        return retList;
    }

    @SuppressWarnings("deprecation")
    public static boolean setReadMessageInfo(List<BigInteger> idList,
            String fromJidStr, Timestamp readDateTime) {

        if(idList == null){
            return false;
        }
        if(fromJidStr == null || fromJidStr.trim().equals("")){
            return false;
        }
        if(readDateTime == null){
            return false;
        }
        Profile profile = UserProfileDbHelper.getUserProfileData(fromJidStr);
        if(profile == null){
            return false;
        }
        int id = profile.getId();
        String sql = createSetReadMessageSql(idList, id, readDateTime);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeUpdate(sql) == -1) {
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
        return true;
    }

    private static String createSetReadMessageSql(List<BigInteger> idList,
            int userId, Timestamp readDateTime) {
        if (idList == null) {
            return "";
        }
        if (userId == 0) {
            return "";
        }
        if (readDateTime == null) {
            return "";
        }
        int count = idList.size();
        if (count <= 0) {
            return "";
        }
        String s62 = GlobalSNSUtils.decimalToSixtyTwoString(BigInteger.valueOf(userId));
        long dateTime = readDateTime.getTime();
        java.util.Date date = new java.util.Date(dateTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        String appendUserId =  "'," + GlobalSNSUtils.escapeSqlData(s62) + ",'";

        String sql = "UPDATE " + TABLE_NAME + " " ;
        sql += " SET "
                + COLUMN_READ_USER_IDS_NAME + "="
                + "(CASE WHEN " + COLUMN_READ_USER_IDS_NAME + " IS NULL THEN "
                +  appendUserId
                + " ELSE "
                + "(" + COLUMN_READ_USER_IDS_NAME + " || " + appendUserId + ")"
                + " END )"
                + "," + COLUMN_LAST_READ_USER_ID_NAME + "="
                +       userId
                + "," + COLUMN_LAST_READ_DATE_NAME + "="
                +       "'" + df.format(date) + "'"
                + "," + COLUMN_COUNT_NAME + "="
                +       COLUMN_COUNT_NAME + "+1";

        sql += " WHERE ";

        String where = "";
        for (int i = 0; i < count; i++) {
            if (i != 0) {
                where += " OR ";
            }
            where += "(id=" + idList.get(i) + ")";
        }
        sql += where;
        return sql;
    }

    @SuppressWarnings("deprecation")
    private static List<Timestamp> getReadUserDates(ResultSet resultSet) {
        List<Timestamp> retList = new ArrayList<Timestamp>();

        try {
            Timestamp firstReadDate = null;
            firstReadDate = resultSet.getTimestamp(ReadMessageDateStoreDbHelper.COLUMN_FIRST_READ_DATE_NAME);
            if(firstReadDate == null )
                return retList;
            long firstReadTime = firstReadDate.getTime();

            String readUserDates = null;
            readUserDates = resultSet.getString(ReadMessageDateStoreDbHelper.COLUMN_READ_USER_DATETIMES_NAME);
            if(readUserDates == null )
                return retList;

             Pattern readUserDatePattern = Pattern.compile("[0-9]*+,");
             Matcher mat = readUserDatePattern.matcher(readUserDates);
             while(mat.find()){
                String readDate = mat.group();
                readDate = readDate.replaceAll(",", "");

                Timestamp tmp = new Timestamp(0);
                if(readDate.length() > 0){
                    tmp.setTime(firstReadTime + Long.parseLong(readDate) * 1000);
                }
                retList.add(tmp);

            }
        } catch (Exception e) {
            Log.error(e);
        }

        return retList;
    }
}
