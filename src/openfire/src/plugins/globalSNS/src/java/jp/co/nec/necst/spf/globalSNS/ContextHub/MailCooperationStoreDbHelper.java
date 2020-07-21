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
import java.util.ArrayList;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;

import org.jivesoftware.util.Log;
import jp.co.nec.necst.spf.globalSNS.Data.MailCooperationInfo;
import jp.co.nec.necst.spf.globalSNS.Data.MailCooerationCondition.FilterCondition;

public class MailCooperationStoreDbHelper {
    public final static String TABLE_NAME = "mail_cooperation_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_SERVER_ID_NAME = "server_id";
    public final static String COLUMN_JID_NAME = "jid";
    public final static String COLUMN_BRANCH_NUMBER_NAME = "branch_number";
    public final static String COLUMN_MAIL_ADDRESS_NAME = "mail_address";
    public final static String COLUMN_SETTING_INFO_NAME = "setting_info";
    public final static String COLUMN_MAIL_COOPERATION_TYPE_NAME = "mail_cooperation_type";
    public final static String COLUMN_DELETE_FLG_NAME = "delete_flag";

    @SuppressWarnings("deprecation")
    private final static String getMailCooperationInfoUpdateSql(
            MailCooperationInfo mailCooperationInfo) {
        Log.debug("do func MailCooperationStoreDbHelper.getMailCooperationInfoUpdateSql(");
        int id = mailCooperationInfo.getId();
        if (id <= 0) {
            Log.error("getMailCooperationInfoUpdateSql : id is invalid");
            return "";
        }
        int serverId = mailCooperationInfo.getServerId();
        if (serverId <= 0) {
            Log.error("getMailCooperationInfoUpdateSql : serverId is invalid");
            return "";
        }
        int branchNumber = mailCooperationInfo.getBranchNumber();
        if (branchNumber <= 0) {
            Log.error("getMailCooperationInfoUpdateSql : serverId is invalid");
            return "";
        }
        String Jid = GlobalSNSUtils.escapeSqlData(mailCooperationInfo.getJid());
        if (Jid == null || Jid.equals("")) {
            Log.error("getMailCooperationInfoUpdateSql : Jid is invalid");
            return "";
        }
        String mailAddress = GlobalSNSUtils.escapeSqlData(mailCooperationInfo
                .getMailAddress());
        if (mailAddress == null) {
            mailAddress = "";
        }
        String settingInfo = GlobalSNSUtils.escapeSqlData(mailCooperationInfo
                .getSettingInfo());
        if (settingInfo == null) {
            Log.debug("getMailCooperationInfoUpdateSql : settingInfo is invalid");
            return "";
        }
        int type = mailCooperationInfo.getMailCooperationType();
        if (type < MailCooperationInfo.MAIL_COOPERATION_TYPE_NON
                || MailCooperationInfo.MAIL_COOPERATION_TYPE_SMAP_POP < type) {
            Log.error("getMailCooperationInfoUpdateSql : type is invalid");
            return "";
        }
        String set = null;

        set = COLUMN_SERVER_ID_NAME + " = " + serverId + ", "
                + COLUMN_MAIL_ADDRESS_NAME + " = '" + mailAddress + "', "
                + COLUMN_SETTING_INFO_NAME + " = '" + settingInfo + "', "
                + COLUMN_MAIL_COOPERATION_TYPE_NAME + " = " + type + "";

        String where = COLUMN_JID_NAME + " = '" + Jid + "' AND "
                + COLUMN_ID_NAME + " = '" + id + "' AND "
                + COLUMN_BRANCH_NUMBER_NAME + " = " + branchNumber + " ";
        String sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE " + where
                + ";";
        return sql;
    }

    @SuppressWarnings("deprecation")
    public static boolean updateMailCooperationInfo(
            MailCooperationInfo mailCooperationInfo) {
        if (mailCooperationInfo == null) {
            Log.error("updateMailCooperationInfo : profileData is invalid");
            return false;
        }
        String sql = getMailCooperationInfoUpdateSql(mailCooperationInfo);
        if (sql == null || sql.equals("")) {
            Log.error("updateMailCooperationInfo : sql is invalid");
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
                if (dbHelper.executeUpdate(sql) <= 0) {
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

    @SuppressWarnings("deprecation")
    public static List<MailCooperationInfo> getMailCooperationInfoList(
            FilterCondition filterCondition) {
        String where = filterCondition.toSqlWhereSectionString();
        if (!where.equals("")) {
            where = "WHERE " + where;
        }
        String sql = "SELECT * FROM " + TABLE_NAME + " " + where + " ORDER BY "
                + COLUMN_ID_NAME;

        List<MailCooperationInfo> retList = null;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            ResultSet resultSet;
            retList = new ArrayList<MailCooperationInfo>();
            resultSet = dbHelper.executeQuery(sql);
            try {
                while (resultSet.next()) {
                    MailCooperationInfo mailCooperationInfo = getOneMailCooperationInfoByResultSet(resultSet);
                    if (mailCooperationInfo != null) {
                        retList.add(mailCooperationInfo);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get tasklist data2");
            }

            dbHelper.close();
        } catch (Exception e) {
            return null;
        }
        return retList;
    }

    private static MailCooperationInfo getOneMailCooperationInfoByResultSet(
            ResultSet resultSet) {

        MailCooperationInfo mailCooperationInfo = new MailCooperationInfo();
        try {
            mailCooperationInfo.setId(resultSet.getInt(COLUMN_ID_NAME));
            mailCooperationInfo.setServerId(resultSet
                    .getInt(COLUMN_SERVER_ID_NAME));
            mailCooperationInfo.setJid(resultSet.getString(COLUMN_JID_NAME));
            mailCooperationInfo.setBranchNumber(resultSet
                    .getInt(COLUMN_BRANCH_NUMBER_NAME));
            mailCooperationInfo.setMailAddress(resultSet
                    .getString(COLUMN_MAIL_ADDRESS_NAME));
            mailCooperationInfo.setSettingInfo(resultSet
                    .getString(COLUMN_SETTING_INFO_NAME));
            mailCooperationInfo.setMailCooperationType(resultSet
                    .getInt(COLUMN_MAIL_COOPERATION_TYPE_NAME));
            mailCooperationInfo.setDeleteFlag(resultSet
                    .getInt(COLUMN_DELETE_FLG_NAME));
        } catch (SQLException e) {
            return null;
        }
        return mailCooperationInfo;
    }

    @SuppressWarnings("deprecation")
    public static boolean insertMailCooperationInfo(
            MailCooperationInfo mailCooperationInfo) {
        if (mailCooperationInfo == null) {
            Log.error("insertMailCooperationInfo : mailCooperationInfo is invalid");
            return false;
        }
        String sql = getMailCooperationInfoInsertSql(mailCooperationInfo);
        if (sql == null || sql.equals("")) {
            Log.error("insertMailCooperationInfo : sql is invalid");
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
                if (dbHelper.executeUpdate(sql) <= 0) {
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

    @SuppressWarnings("deprecation")
    private final static String getMailCooperationInfoInsertSql(
            MailCooperationInfo mailCooperationInfo) {
        int serverId = mailCooperationInfo.getServerId();
        if (serverId <= 0) {
            Log.error("getMailCooperationInfoUpdateSql : serverId is invalid");
            return "";
        }
        int branchNumber = mailCooperationInfo.getBranchNumber();
        if (branchNumber <= 0) {
            Log.error("getMailCooperationInfoUpdateSql : branchNumber is invalid");
            return "";
        }
        String jid = GlobalSNSUtils.escapeSqlData(mailCooperationInfo.getJid());
        if (jid == null || jid.equals("")) {
            Log.error("getMailCooperationInfoUpdateSql : Jid is invalid");
            return "";
        }
        String mailAddress = GlobalSNSUtils.escapeSqlData(mailCooperationInfo
                .getMailAddress());
        if (mailAddress == null) {
            mailAddress = "";
        }
        String settingInfo = GlobalSNSUtils.escapeSqlData(mailCooperationInfo
                .getSettingInfo());
        if (settingInfo == null) {
            Log.debug("getMailCooperationInfoUpdateSql : settingInfo is invalid");
            return "";
        }
        int type = mailCooperationInfo.getMailCooperationType();
        if (type < MailCooperationInfo.MAIL_COOPERATION_TYPE_NON
                || MailCooperationInfo.MAIL_COOPERATION_TYPE_SMAP_POP < type) {
            Log.error("getMailCooperationInfoUpdateSql : type is invalid");
            return "";
        }
        int delete_flg = mailCooperationInfo.getDeleteFlag();
        if (delete_flg < MailCooperationInfo.DELETE_FLG_FALSE
                || MailCooperationInfo.DELETE_FLG_TRUE < delete_flg) {
            Log.error("getMailCooperationInfoUpdateSql : type is invalid");
            return "";
        }
        String columns = COLUMN_SERVER_ID_NAME + ", " + COLUMN_JID_NAME + ", "
                + COLUMN_BRANCH_NUMBER_NAME + ", " + COLUMN_MAIL_ADDRESS_NAME
                + ", " + COLUMN_SETTING_INFO_NAME + ", "
                + COLUMN_MAIL_COOPERATION_TYPE_NAME + ", "
                + COLUMN_DELETE_FLG_NAME;
        String values = serverId + ", '" + jid + "', " + branchNumber + ", '"
                + mailAddress + "', '" + settingInfo + "', " + type + " , "
                + delete_flg;
        String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
                + ") VALUES (" + values + ");";
        return sql;
    }
}
