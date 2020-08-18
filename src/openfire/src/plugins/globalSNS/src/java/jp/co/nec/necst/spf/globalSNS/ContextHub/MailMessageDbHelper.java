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

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Message;

import org.jivesoftware.util.Log;

public class MailMessageDbHelper extends MessageStoreDbHelper {
    @SuppressWarnings("deprecation")
    public static int getNextMailMessageIdNumber(String jid) {
        int retNumber = 0;
        if (jid == null) {
            return retNumber;
        }
        String messageIdPrefix = getMailMessageItemIdPrefix(jid);
        if (messageIdPrefix == null || messageIdPrefix.equals("")) {
            return retNumber;
        }
        String sql = "SELECT " + COLUMN_ID_NAME + ", " + COLUMN_ITEM_ID_NAME
                + " FROM " + TABLE_NAME + " WHERE " + COLUMN_MESSAGE_TYEP_NAME
                + "=" + Message.TYPE_MAIL + " AND " + COLUMN_ITEM_ID_NAME
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
                    Log.error("Failed to get next item_id number : " + sql);
                }
                dbHelper.close();
            } catch (Exception e) {
            }
        }
        return retNumber;
    }

    public static String getMailMessageItemIdPrefix(String jid) {
        String ret = "";
        if (jid == null) {
            return ret;
        }
        String accountName = jid.split("@")[0];
        ret = "mail_" + accountName + "_";
        return ret;
    }

    @SuppressWarnings("deprecation")
    public static String getItemIdFromMailInReplyTo(String mailInReplyTo,
            String msgTo) {
        String ret = "";
        if (mailInReplyTo == null) {
            Log.error("MailMessageDbHelper#getItemIdFromMailInReplyTo - mailInReplyTo is null");
            return ret;
        }
        if (msgTo == null) {
            Log.error("MailMessageDbHelper#getItemIdFromMailInReplyTo - msgTo is null");
            return ret;
        }
        if (mailInReplyTo.equals("")) {
            return ret;
        }
        String sql = "SELECT " + COLUMN_ITEM_ID_NAME + " FROM " + TABLE_NAME
                + " WHERE (" + COLUMN_MAIL_MESSAGE_ID_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(mailInReplyTo) + "') AND ("
                + COLUMN_MESSAGE_TO_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(msgTo) + "') ORDER BY "
                + COLUMN_ID_NAME + " DESC LIMIT 1";
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
                    String itemId = resultSet.getString(COLUMN_ITEM_ID_NAME);
                    ret = itemId;
                }
            } catch (SQLException e) {
                Log.error("Failed to get in-reply-to item_id : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }
}
