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
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.PersonSortCondition;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.UserFilterCondition;

import org.jivesoftware.openfire.XMPPServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class UserProfileDbHelper {
    private static final Logger Log = LoggerFactory
            .getLogger(UserProfileDbHelper.class);
    public final static String TABLE_NAME = "user_profile";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_JID_NAME = "jid";
    public final static String COLUMN_MAIL_ADDRESS_NAME = "mailaddress";
    public final static String COLUMN_PASSWORD_NAME = "password";
    public final static String COLUMN_NAME_NAME = "name";
    public final static String COLUMN_NICKNAME_NAME = "nickname";
    public final static String COLUMN_PRESENCE_NAME = "presence";
    public final static String COLUMN_MY_MEMO_NAME = "my_memo";
    public final static String COLUMN_PHOTO_TYPE_NAME = "photo_type";
    public final static String COLUMN_PHOTO_DATA_NAME = "photo_data";
    public final static String COLUMN_UPDATE_TIME_NAME = "update_time";
    public final static String COLUMN_DELETE_FLG_NAME = "delete_flg";
    public final static String COLUMN_AFFILIATION_NAME = "affiliation";
    public final static String COLUMN_EXTRAS_NAME = "extras";
    public final static String COLUMN_NOTIFICATION_CLIENT_LAST_UPDATED_AT = "notification_client_last_updated_at";

    private final static String getUserProfileCountSql(Profile profileData) {
        Log.debug("do func UserProfileDbHelper.getUserProfileCountSql(");
        String Jid = profileData.getJid();
        if (Jid == null || Jid.equals("")) {
            Log.error("getUserProfileCountSql : Jid is invalid");
            return "";
        }

        String columns = COLUMN_JID_NAME;
        String sql = "SELECT COUNT(1) AS profile_count FROM " + TABLE_NAME
                + " WHERE " + columns + " = '" + Jid + "';";
        return sql;
    }

    public static int countUserProfileDataToDb(Profile profileData) {
        Log.debug("do func UserProfileDbHelper.countUserProfileDataToDb(");
        int count = 0;

        if (profileData == null) {
            Log.error("countUserProfileDataToDb : profileData is invalid");
            return -1;
        }
        String sql = getUserProfileCountSql(profileData);
        if (sql == null || sql.equals("")) {
            Log.error("countUserProfileDataToDb : sql is invalid");
            return -1;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("countUserProfileDataToDb : Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    count = resultSet.getInt("profile_count");
                }
            } catch (SQLException e) {
                Log.error("countUserProfileDataToDb : Failed to get profile count : "
                        + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
            return -1;
        }
        return count;
    }

    private final static String getUserProfileInsertSql(Profile profileData) {
        Log.debug("do func UserProfileDbHelper.getUserProfileInsertSql(");
        String Jid = profileData.getJid();
        if (Jid == null || Jid.equals("")) {
            Log.error("getUserProfileInsertSql : Jid is invalid");
            return "";
        }
        String MailAddress = profileData.getEmail();
        if (MailAddress == null || MailAddress.equals("")) {
        }
        String Password = profileData.getPassword();
        if (Password == null || Password.equals("")) {
        }
        String UsrName = profileData.getUserName();
        if (UsrName == null || UsrName.equals("")) {
        }
        String NickName = profileData.getNickName();
        if (NickName == null || NickName.equals("")) {
        }
        int Presence = profileData.getPresence();
        if ((Presence & 0x7) < 0 || 4 < (Presence & 0x7)) {
            Log.error("getUserProfileInsertSql : Presence is invalid");
            return "";
        }
        String MyMemo = profileData.getMyMemo();
        if (MyMemo == null || MyMemo.equals("")) {
        }
        String PhotoType = profileData.getPhotoType();
        if (PhotoType == null || PhotoType.equals("")) {
        }
        String PhotoData = profileData.getPhotoData();
        if (PhotoData == null || PhotoData.equals("")) {
        }
        String Date = profileData.getDateStr();
        if (Date == null || Date.equals("")) {
            Log.error("getUserProfileInsertSql : Date is invalid");
            return "";
        }
        int deleteFlag = profileData.getDeleteFlg();
        String Groups = profileData.getAffiliation();

        String columns = COLUMN_JID_NAME + ", " + COLUMN_MAIL_ADDRESS_NAME
                + ", " + COLUMN_PASSWORD_NAME + ", " + COLUMN_NAME_NAME + ", "
                + COLUMN_NICKNAME_NAME + ", " + COLUMN_PRESENCE_NAME + ", "
                + COLUMN_MY_MEMO_NAME + ", " + COLUMN_PHOTO_TYPE_NAME + ", "
                + COLUMN_PHOTO_DATA_NAME + ", " + COLUMN_UPDATE_TIME_NAME
                + ", " + COLUMN_DELETE_FLG_NAME + ", "
                + COLUMN_AFFILIATION_NAME;
        String values = "'" + Jid + "', '" + MailAddress + "', "
                + GlobalSNSUtils.getSqlDataToCryptPassword(Password) + ", '"
                + UsrName + "', '" + GlobalSNSUtils.escapeSqlData(NickName)
                + "', '" + Presence + "', '"
                + GlobalSNSUtils.escapeSqlData(MyMemo) + "', '" + PhotoType
                + "', '" + PhotoData + "', '" + Date + "', '" + deleteFlag
                + "', '" + GlobalSNSUtils.escapeSqlData(Groups) + "'";
        String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                + ") VALUES (" + values + ");";
        return sql;
    }

    public static boolean insertUserProfileDataToDb(Profile profileData) {
        Log.debug("do func UserProfileDbHelper.insertUserProfileDataToDb(");
        if (profileData == null) {
            Log.error("insertUserProfileDataToDb : profileData is invalid");
            return false;
        }
        String sql = getUserProfileInsertSql(profileData);
        if (sql == null || sql.equals("")) {
            Log.error("insertUserProfileDataToDb : sql is invalid");
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

    public static Profile getUserProfileData(String jid) {
        Log.debug("do func UserProfileDbHelper.getUserProfileData(");
        return getUserProfileData(jid, true, false);
    }

    public static Profile getUserProfileDataWithExtra(String jid) {
        Log.debug("do func UserProfileDbHelper.getUserProfileDataWithExtra(");
        return getUserProfileData(jid, true, true);
    }

    public static Profile getUserProfileData(String jid,
            boolean exclusionDeleteUserFlg) {
        Log.debug("do func UserProfileDbHelper.getUserProfileData(");
        return getUserProfileData(jid, true, false);
    }
    static Profile getUserProfileData(String jid,
            boolean exclusionDeleteUserFlg,
            boolean withExtra) {
        Log.debug("do func UserProfileDbHelper.getUserProfileData(");
        Profile profileData = null;
        if (jid == null || jid.equals("")) {
            Log.error("getUserProfileData : jid is invalid");
            return profileData;
        }
        Set<String> jidSet = new HashSet<String>();
        jidSet.add(jid);
        List<Profile> profileDataList = getUserProfileDataList(jidSet,
                exclusionDeleteUserFlg, withExtra);
        if (profileDataList == null || profileDataList.isEmpty()) {
            Log.error("getUserProfileData : profileDataList is invalid");
            return profileData;
        }
        profileData = profileDataList.get(0);
        return profileData;
    }

    public static List<Profile> getUserProfileDataList(
            Collection<String> jidCollection, boolean exclusionDeleteUserFlg) {
        Log.debug("do func UserProfileDbHelper.getUserProfileDataList(");
        return getUserProfileDataList(jidCollection, exclusionDeleteUserFlg, false);
    }
    static List<Profile> getUserProfileDataList(
           Collection<String> jidCollection, boolean exclusionDeleteUserFlg,
           boolean withExtra) {
        Log.debug("do func UserProfileDbHelper.getUserProfileDataList(...");
        List<Profile> profileDataList = new ArrayList<Profile>();
        if (jidCollection == null || jidCollection.isEmpty()) {
            Log.error("getUserProfileDataList : jidCollection is invalid");
            return profileDataList;
        }
        String sql = getUserProfileSelectSql(jidCollection,exclusionDeleteUserFlg,withExtra);
        if (sql == null || sql.equals("")) {
            Log.error("jidList : sql is invalid");
            return profileDataList;
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
                    Profile profileData = getUserProfileByResultSet(resultSet, withExtra);
                    if (profileData != null) {
                        profileDataList.add(profileData);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return profileDataList;
    }

    private final static String getUserProfileSelectSql(
            Collection<String> jidCollection, boolean exclusionDeleteUserFlg,
            boolean withExtra) {
        Log.debug("do func UserProfileDbHelper.getUserProfileSelectSql(...");
        String ret = "";
        if (jidCollection == null || jidCollection.isEmpty()) {
            Log.error("getUserProfileSelectSql : jidCollection is invalid");
            return ret;
        }
        String inOperatorStr = GlobalSNSUtils
                .convertListToStringforInOperator(new ArrayList<String>(
                        jidCollection));
        String sql = "";
        Log.debug("UserProfileDbHelper.getUserProfileSelectSql withExtra:"+withExtra);
        if (withExtra) {
            sql = String.format("SELECT * FROM %s WHERE (%s IN (%s))",
                    TABLE_NAME, COLUMN_JID_NAME, inOperatorStr);
        } else {
            sql = String.format(
                     "SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s FROM %s WHERE (%s IN (%s)) ",
                     COLUMN_ID_NAME,
                     COLUMN_JID_NAME,
                     COLUMN_MAIL_ADDRESS_NAME,
                     COLUMN_PASSWORD_NAME,
                     COLUMN_NAME_NAME,
                     COLUMN_NICKNAME_NAME,
                     COLUMN_PRESENCE_NAME,
                     COLUMN_MY_MEMO_NAME,
                     COLUMN_PHOTO_TYPE_NAME,
                     COLUMN_PHOTO_DATA_NAME,
                     COLUMN_UPDATE_TIME_NAME,
                     COLUMN_DELETE_FLG_NAME,
                     COLUMN_AFFILIATION_NAME,
                     COLUMN_NOTIFICATION_CLIENT_LAST_UPDATED_AT,
                     TABLE_NAME,
                     COLUMN_JID_NAME, 
                     inOperatorStr
                 );
        }
        if (exclusionDeleteUserFlg) {
            sql += "AND (delete_flg <> 1);";
        } else {
            sql += ";";
        }
        return sql;
    }

    public static Profile getUserProfileData(BigInteger id,
            boolean exclusionDeleteUserFlg) {
        Log.debug("do func UserProfileDbHelper.getUserProfileData(...");
        Profile profileData = null;
        if (id == null) {
            Log.error("getUserProfileData : jid is invalid");
            return profileData;
        }
        String sql = getUserProfileSelectSql(id, exclusionDeleteUserFlg);
        if (sql == null || sql.equals("")) {
            Log.error("getUserProfileData : sql is invalid");
            return profileData;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                boolean withExtra = false;
                ResultSet resultSet = dbHelper.executeQuery(sql);
                if (resultSet.next()) {
                    profileData = getUserProfileByResultSet(resultSet, withExtra);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return profileData;
    }

    private final static String getUserProfileSelectSql(BigInteger id,
            boolean exclusionDeleteUserFlg) {
        Log.debug("do func UserProfileDbHelper.getUserProfileSelectSql(...");
        if (id == null) {
            Log.error("getUserProfileSelectSql : id is invalid");
            return "";
        }
        String sql = "";
        if (exclusionDeleteUserFlg) {
            sql = String
                    .format("SELECT * FROM %s WHERE ((%s = %s) AND (delete_flg <> 1));",
                            TABLE_NAME, COLUMN_ID_NAME, id.toString());
        } else {
            sql = String.format("SELECT * FROM %s WHERE ((%s = %s));",
                    TABLE_NAME, COLUMN_ID_NAME, id.toString());
        }
        return sql;
    }

    private static Profile getUserProfileByResultSet(ResultSet resultSet, boolean withExtra) {
        final String logPrefix = "getUserProfileByResultSet() : ";
        Profile profileData = new Profile();
        try {
            profileData.setId(resultSet.getInt(COLUMN_ID_NAME));
            profileData.setJid(resultSet.getString(COLUMN_JID_NAME));
            profileData.setEmail(resultSet.getString(COLUMN_MAIL_ADDRESS_NAME));
            profileData.setPassword(resultSet.getString(COLUMN_PASSWORD_NAME));
            profileData.setUserName(resultSet.getString(COLUMN_NAME_NAME));
            profileData.setNickName(resultSet.getString(COLUMN_NICKNAME_NAME));
            profileData.setPresence(resultSet.getInt(COLUMN_PRESENCE_NAME));
            profileData.setMyMemo(resultSet.getString(COLUMN_MY_MEMO_NAME));
            profileData.setPhotoType(resultSet
                    .getString(COLUMN_PHOTO_TYPE_NAME));
            profileData.setPhotoData(resultSet
                    .getString(COLUMN_PHOTO_DATA_NAME));
            profileData
                    .setDate(resultSet.getTimestamp(COLUMN_UPDATE_TIME_NAME));
            profileData.setDeleteFlg(resultSet.getInt(COLUMN_DELETE_FLG_NAME));
            profileData.setAffiliation(resultSet
                    .getString(COLUMN_AFFILIATION_NAME));
            if (withExtra) {
                String extras = resultSet.getString(COLUMN_EXTRAS_NAME);
                profileData.setExtrasData(extras);
            }
        } catch (SQLException e) {
            Log.error(logPrefix, e);
            return null;
        }
        return profileData;
    }

    private final static String getUserProfileUpdateSql(Profile profileData,
            int upFlg) {
        Log.debug("do func UserProfileDbHelper.getUserProfileUpdateSql(");
        String Jid = profileData.getJid();
        if (Jid == null || Jid.equals("")) {
            Log.error("getUserProfileUpdateSql : Jid is invalid");
            return "";
        }
        String mailAddress = profileData.getEmail();
        boolean hasMailAddress = false;
        if (mailAddress != null) {
            hasMailAddress = true;
        }
        String Password = profileData.getPassword();
        if (Password == null || Password.equals("")) {
        }
        String UsrName = profileData.getUserName();
        if (UsrName == null || UsrName.equals("")) {
        }
        String NickName = profileData.getNickName();
        if (NickName == null || NickName.equals("")) {
        }

        int Presence = profileData.getPresence();
        if ((Presence & 0x7) < 0 || 4 < (Presence & 0x7)) {
            Log.error("getUserProfileUpdateSql : Presence is invalid");
            return "";
        }
        String MyMemo = profileData.getMyMemo();
        if (MyMemo == null || MyMemo.equals("")) {
        }
        String PhotoType = profileData.getPhotoType();
        if (PhotoType == null || PhotoType.equals("")) {
        }
        String PhotoData = profileData.getPhotoData();
        if (PhotoData == null || PhotoData.equals("")) {
        }
        int deleteFlag = profileData.getDeleteFlg();
        String Groups = profileData.getAffiliation();
        if (Groups == null || Groups.equals("")) {
        }
        String Date = profileData.getDateStr();
        if (Date == null || Date.equals("")) {
            Log.error("getUserProfileUpdateSql : Date is invalid");
            return "";
        }
        String Extras = profileData.getExtrasData();
        String extrasSql = "";
        if (Extras != null && Extras != "") {
            extrasSql = ", " + COLUMN_EXTRAS_NAME + " = '" + GlobalSNSUtils.escapeSqlData(Extras) + "'";
        } else if ("{}".equals(Extras)) {
            extrasSql = ", " + COLUMN_EXTRAS_NAME + " = null ";
        }
        String set = null;
        if (upFlg == 0) {
            String mailAddressSQLSet = "";
            if (hasMailAddress) {
                mailAddressSQLSet = COLUMN_MAIL_ADDRESS_NAME + " = '"
                        + GlobalSNSUtils.escapeSqlData(mailAddress) + "', ";
            }
            set = mailAddressSQLSet + COLUMN_PASSWORD_NAME + " = "
                    + GlobalSNSUtils.getSqlDataToCryptPassword(Password) + ", "
                    + COLUMN_NAME_NAME + " = '" + UsrName + "', "
                    + COLUMN_NICKNAME_NAME + " = '"
                    + GlobalSNSUtils.escapeSqlData(NickName) + "', "
                    + COLUMN_PRESENCE_NAME + " = '" + Presence + "', "
                    + COLUMN_MY_MEMO_NAME + " = '"
                    + GlobalSNSUtils.escapeSqlData(MyMemo) + "', "
                    + COLUMN_PHOTO_TYPE_NAME + " = '" + PhotoType + "', "
                    + COLUMN_PHOTO_DATA_NAME + " = '" + PhotoData + "', "
                    + COLUMN_UPDATE_TIME_NAME + " = '" + Date + "', "
                    + COLUMN_DELETE_FLG_NAME + " = " + deleteFlag + ", "
                    + COLUMN_AFFILIATION_NAME + " = '" + GlobalSNSUtils.escapeSqlData(Groups) + "' "
                    + extrasSql ;
        } else {
            set = COLUMN_PRESENCE_NAME + " = '" + Presence + "', "
                    + COLUMN_UPDATE_TIME_NAME + " = '" + Date + "', "
                    + COLUMN_DELETE_FLG_NAME + " = " + deleteFlag;
        }
        String where = COLUMN_JID_NAME + " = '" + Jid + "'";
        String sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE " + where
                + ";";
        return sql;
    }

    public static boolean updateUserProfileDataToDb(Profile profileData,
            int upFlg) {
        Log.debug("do func UserProfileDbHelper.updateUserProfileDataToDb(");
        if (profileData == null) {
            Log.error("updateUserProfileDataToDb : profileData is invalid");
            return false;
        }
        String sql = getUserProfileUpdateSql(profileData, upFlg);
        if (sql == null || sql.equals("")) {
            Log.error("updateUserProfileDataToDb : sql is invalid");
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
                if (dbHelper.executeUpdate(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to update database (%s)", sql);
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

    public static boolean updateUserStatus(String jid, int status) {
        Log.debug("do func UserProfileDbHelper.updateUserStatus(");
        if (jid == null) {
            Log.error("UserProfileDbHelper#updateUserStatus : jid is null");
            return false;
        }
        if (jid.equals("")) {
            Log.error("UserProfileDbHelper#updateUserStatus : jid is invalid");
            return false;
        }
        if (status < 0 || status > 2) {
            Log.error("UserProfileDbHelper#updateUserStatus : status is invalid");
            return false;
        }
        String set = COLUMN_DELETE_FLG_NAME + " = " + status;
        String where = COLUMN_JID_NAME + " = '" + jid + "'";
        String sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE " + where
                + ";";
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
                return false;
            }
        }
        return true;
    }

    public static boolean physicalDeleteUserDataDBTable(String userName) {
        Log.debug("do func UserProfileDbHelper.physicalDeleteUserDataDBTable(");
        if (userName == null || userName.equals("")) {
            Log.error("physicalDeleteUserDataDBTable : userName is invalid");
            return false;
        }
        JID userJid = XMPPServer.getInstance().createJID(userName, null);
        String userJidStr = userJid.toBareJID();
        if (userJidStr == null || userJidStr.equals("")) {
            Log.error("physicalDeleteUserDataDBTable : userJidStr is invalid");
            return false;
        }
        String deleteUserProfileSql = "DELETE FROM " + TABLE_NAME + " WHERE "
                + COLUMN_JID_NAME + " = '" + userJidStr + "'";

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeDelete(deleteUserProfileSql) == -1) {
                    String errorMessage = String.format(
                            "Failed to delete database (%s)",
                            deleteUserProfileSql);
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

    public static List<Profile> getUserProfileDataList(List<String> jidList) {
        Log.debug("do func UserProfileDbHelper.getUserProfileDataList(...");
        List<Profile> ret = new ArrayList<Profile>();
        if (jidList == null) {
            Log.error("getUserProfileDataList : jidList is invalid");
            return ret;
        }
        String sql = getUsersProfileSelectSql(jidList);
        if (sql == null || sql.equals("")) {
            Log.error("getUserProfileDataList : sql is invalid");
            return ret;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                boolean withExtra = false;
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    Profile profileData = getUserProfileByResultSet(resultSet, withExtra);
                    if (profileData != null) {
                        ret.add(profileData);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    private static String getUsersProfileSelectSql(List<String> jidList) {
        Log.debug("do func UserProfileDbHelper.getUsersProfileSelectSql(...");
        String ret = "";
        if (jidList == null || jidList.size() <= 0) {
            Log.error("getUsersProfileSelectSql : jidList is invalid");
            return ret;
        }
        int count = jidList.size();
        boolean isFirst = true;
        String jidsSql = null;
        for (int i = 0; i < count; i++) {
            String userJid = jidList.get(i);
            if (userJid == null || "".equals(userJid)) {
                continue;
            }
            if (isFirst) {
                isFirst = false;
                jidsSql = "(" + COLUMN_JID_NAME + " IN (";
            } else {
                jidsSql += ",";
            }
            jidsSql += "'" + GlobalSNSUtils.escapeSqlData(userJid) + "'";
        }
        if (jidsSql != null) {
            jidsSql += "))";
        } else {
            return ret;
        }

        String sql = String.format("SELECT * FROM %s WHERE %s;", TABLE_NAME,
                jidsSql);
        return sql;
    }

    public static List<String> searchJidListByFuzzyNickname(String fuzzyNickname) {
        Log.debug("do func UserProfileDbHelper.searchJidListByFuzzyNickname(...");
        List<String> ret = null;
        if (fuzzyNickname == null || "".equals(fuzzyNickname)) {
            Log.error("UserProfileDbHelper#searchJidListByFuzzyNickname::fuzzyNickname is invalid");
            return ret;
        }
        String sql = getJidListByFuzzyNicknameSelectSql(fuzzyNickname);
        if (sql == null || "".equals(sql)) {
            Log.error("UserProfileDbHelper#searchJidListByFuzzyNickname::sql is invalid");
            return ret;
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
                ret = new ArrayList<String>();
                while (resultSet.next()) {
                    try {
                        String jid = resultSet.getString(COLUMN_JID_NAME);
                        if (jid == null) {
                            Log.warn("UserProfileDbHelper#searchJidListByFuzzyNickname::gotten jid is null... continue.");
                            continue;
                        }
                        ret.add(jid);
                    } catch (SQLException e) {
                        Log.error("UserProfileDbHelper#searchJidListByFuzzyNickname::faild to get jid... continue.");
                        continue;
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    private static String getJidListByFuzzyNicknameSelectSql(
            String fuzzyNickname) {
        Log.debug("do func UserProfileDbHelper.getJidListByFuzzyNicknameSelectSql(...");
        String ret = null;
        if (fuzzyNickname == null || "".equals(fuzzyNickname)) {
            Log.error("UserProfileDbHelper#getJidListByFuzzyNicknameSelectSql::fuzzyNickname is invalid");
            return ret;
        }
        String escapedValueForRegexpPhrase = GlobalSNSUtils
                .escapeSqlDataForRegexpPhrase(fuzzyNickname);
        if (escapedValueForRegexpPhrase == null
                || "".equals(escapedValueForRegexpPhrase)) {
            Log.error("UserProfileDbHelper#getJidListByFuzzyNicknameSelectSql::escapedValueForRegexpPhrase is invalid");
            return ret;
        }
        ret = "SELECT " + COLUMN_JID_NAME + " FROM " + TABLE_NAME + " WHERE ("
                + COLUMN_NICKNAME_NAME + " ~ E'^.*"
                + escapedValueForRegexpPhrase + ".*$');";
        return ret;
    }

    public static List<Profile> searchProfile(int startId, int count,
            UserFilterCondition filterCondition,
            PersonSortCondition sortCondition) {
        Log.debug("do func UserProfileDbHelper.searchProfile(...");
        String where = filterCondition.toSqlWhereSectionString();
        if (!where.equals("")) {
            where = "((" + where + ") AND ((" + TABLE_NAME + "."
                    + COLUMN_DELETE_FLG_NAME + "="
                    + Profile.DELETE_FLAG_STATUS_NOMAL + ")))";
        } else {
            where = "(" + TABLE_NAME + "." + COLUMN_DELETE_FLG_NAME + "="
                    + Profile.DELETE_FLAG_STATUS_NOMAL + ")";
        }
        if (startId > 0) {
            where = "( " + where + " OR (" + TABLE_NAME + "." + COLUMN_ID_NAME
                    + "=" + String.valueOf(startId) + "))";
        }
        String orderBy = sortCondition.toSqlOrderBySectionString();
        String selectColumn = TABLE_NAME + "." + COLUMN_ID_NAME + ","
                + TABLE_NAME + "." + COLUMN_JID_NAME + "," + TABLE_NAME + "."
                + COLUMN_MAIL_ADDRESS_NAME + "," + TABLE_NAME + "."
                + COLUMN_PASSWORD_NAME + "," + TABLE_NAME + "."
                + COLUMN_NAME_NAME + "," + TABLE_NAME + "."
                + COLUMN_NICKNAME_NAME + "," + TABLE_NAME + "."
                + COLUMN_PRESENCE_NAME + "," + TABLE_NAME + "."
                + COLUMN_MY_MEMO_NAME + "," + TABLE_NAME + "."
                + COLUMN_PHOTO_TYPE_NAME + "," + TABLE_NAME + "."
                + COLUMN_PHOTO_DATA_NAME + "," + TABLE_NAME + "."
                + COLUMN_UPDATE_TIME_NAME + "," + TABLE_NAME + "."
                + COLUMN_DELETE_FLG_NAME + "," + TABLE_NAME + "."
                + COLUMN_AFFILIATION_NAME + "," + TABLE_NAME + "."
                + COLUMN_EXTRAS_NAME;
        String getRownumSqlString = "";
        if (startId > 0) {
            getRownumSqlString = "SELECT * FROM (SELECT *, row_number() OVER () as rownum FROM ( "
                    + "SELECT "
                    + selectColumn
                    + " FROM "
                    + TABLE_NAME
                    + " LEFT JOIN "
                    + UserAccountStroreDbHelper.TABLE_NAME
                    + " AS account_store ON "
                    + TABLE_NAME
                    + "."
                    + COLUMN_JID_NAME
                    + "=(account_store."
                    + UserAccountStroreDbHelper.COLUMN_OPENFIRE_ACCOUNT
                    + " || '@' || account_store."
                    + UserAccountStroreDbHelper.COLUMN_XMPP_SERVER_NAME + ")"
                    + ", (SELECT min(id) AS id  FROM user_profile WHERE " + where +" GROUP BY jid) AS minid_prof";
            getRownumSqlString += " WHERE (" + where+ ") AND minid_prof.id = user_profile.id";
            if (!orderBy.equals("")) {
                getRownumSqlString += " ORDER BY " + orderBy;
            }
            getRownumSqlString += ") as dummy_table) as dummy_table2 WHERE "
                    + "dummy_table2." + COLUMN_ID_NAME + "="
                    + String.valueOf(startId);
        }
        int offset = -1;
        List<Profile> retList = null;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }

            ResultSet resultSet;
            if (startId > 0) {
                resultSet = dbHelper.executeQuery(getRownumSqlString);
                try {
                    if (resultSet.next()) {
                        offset = resultSet.getInt("rownum");
                    }
                } catch (SQLException e) {
                    Log.error("Failed to get tasklist data1");
                    dbHelper.close();
                    throw new Exception("Failed to select database1");
                }
                if (offset < 0) {
                    Log.error("rownum is invalid");
                    dbHelper.close();
                    throw new Exception("rownum is invalid");
                }
            } else {
                offset = 0;
            }
            String sql = "SELECT " + selectColumn + " FROM " + TABLE_NAME
                    + " LEFT JOIN "
                    + UserAccountStroreDbHelper.TABLE_NAME
                    + " AS account_store ON " + TABLE_NAME + "."
                    + COLUMN_JID_NAME + "=(account_store."
                    + UserAccountStroreDbHelper.COLUMN_OPENFIRE_ACCOUNT
                    + " || '@' || account_store."
                    + UserAccountStroreDbHelper.COLUMN_XMPP_SERVER_NAME + ")"
                    + ", (SELECT min(id) AS id  FROM user_profile WHERE " + where +" GROUP BY jid) AS minid_prof ";

            if (where.equals("")) {
                Log.error("where is invalid");
                dbHelper.close();
                throw new Exception("where is invalid");
            }
            where += " AND minid_prof.id = user_profile.id ";
            sql += " WHERE " + where;

            if (!orderBy.equals("")) {
                sql += " ORDER BY " + orderBy;
            }
            sql += " LIMIT " + String.valueOf(count) + " OFFSET "
                    + String.valueOf(offset);

            retList = new ArrayList<Profile>();
            resultSet = dbHelper.executeQuery(sql);
            try {
                boolean withExtra = false;
                while (resultSet.next()) {
                    Profile profile = getUserProfileByResultSet(resultSet, withExtra);
                    if (profile != null) {
                        retList.add(profile);
                    }
                }
            } catch (SQLException e) {
                Log.error("searchProfile() : ", e);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    public static int getCount(UserFilterCondition filterCondition) {
        Log.debug("do func UserProfileDbHelper.getCount(...");
        int ret = 0;
        String where = filterCondition.toSqlWhereSectionString();
        if (!where.equals("")) {
            where = "((" + where + ") AND ((" + TABLE_NAME + "."
                    + COLUMN_DELETE_FLG_NAME + "="
                    + Profile.DELETE_FLAG_STATUS_NOMAL + ")))";
        } else {
            where = "(" + TABLE_NAME + "." + COLUMN_DELETE_FLG_NAME + "="
                    + Profile.DELETE_FLAG_STATUS_NOMAL + ")";
        }
        String sql = "SELECT COUNT(1) AS count FROM " + TABLE_NAME
            + ", (SELECT min(id) AS id  FROM user_profile WHERE " + where +" GROUP BY jid) AS minid_prof "
            + " WHERE "
            + "(" + where + ") AND minid_prof.id = user_profile.id ";
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
                    ret = resultSet.getInt("count");
                }
            } catch (SQLException e) {
                Log.error("Failed to profile count : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    public static boolean updateNotificationClientLastUpdatedAt(String jid,
            Timestamp notificationClientLastUpdatedAt) {
        Log.debug("do func UserProfileDbHelper.updateNotificationClientLastUpdatedAt(...");
        final String prefix = "updateNotificationClientLastUpdatedAt() : ";
        String updateAt = "NULL";
        if (notificationClientLastUpdatedAt != null) {
            long dateTime = notificationClientLastUpdatedAt.getTime();
            Date date = new Date(dateTime);
            SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
            updateAt = "'" + df.format(date) + "'";
        }
        String set = COLUMN_NOTIFICATION_CLIENT_LAST_UPDATED_AT + " = "
                + updateAt;
        String where = COLUMN_JID_NAME + " = '" + jid + "'";
        String sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE " + where
                + ";";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .getInstance();
        boolean result = false;
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeUpdate(sql) == -1) {
                    String errorMessage = String.format(
                            "Failed to update database (%s)", sql);
                    throw new Exception(errorMessage);
                }
                result = true;
            } catch (Exception e) {
                Log.error(prefix, e);
            } finally {
                dbHelper.close();
            }
        }
        return result;
    }

    public static Timestamp getNotificationClientLastUpdatedAt(String jid) {
        final String prefix = "getNotificationClientLastUpdatedAt() : ";
        String where = COLUMN_JID_NAME + " = '" + jid + "'";
        String sql = "SELECT " + COLUMN_NOTIFICATION_CLIENT_LAST_UPDATED_AT
                + " FROM " + TABLE_NAME + " WHERE " + where;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        Timestamp result = null;

        try {
            if (!dbHelper.open()) {
                throw new Exception("Failed to open database");
            }
            ResultSet resultSet = dbHelper.executeQuery(sql);
            if (resultSet.next()) {
                result = resultSet
                        .getTimestamp(COLUMN_NOTIFICATION_CLIENT_LAST_UPDATED_AT);
            }
        } catch (Exception e) {
            Log.error(prefix, e);
        } finally {
            dbHelper.close();
        }
        return result;
    }

    public static void initPresence() {
        Log.debug("do func UserProfileDbHelper.initPresence(...");
        String sql = getUpdateInitPresenceSql();
        if (sql == null || sql.equals("")) {
            Log.error("initPresence : sql is invalid");
            return;
        }
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
                    return;
                }
                dbHelper.close();
            } catch (Exception e) {
                return;
            }
        }
    }

    private static String getUpdateInitPresenceSql() {
        String set = COLUMN_PRESENCE_NAME + "=" + COLUMN_PRESENCE_NAME + "&7";
        String where = COLUMN_PRESENCE_NAME + ">"
                + Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE;
        String sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE " + where
                + ";";
        return sql;
    }

}
