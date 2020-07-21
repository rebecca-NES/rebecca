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
import jp.co.nec.necst.spf.globalSNS.Data.Message;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class ChatMessageDbHelper extends MessageStoreDbHelper {
    private static final Logger Log = LoggerFactory
            .getLogger(ChatMessageDbHelper.class);

    public static int getCreateCount(JID fromJid) {
        int ret = 0;
        String sql = "SELECT COUNT(1) AS msgfrom_count FROM " + TABLE_NAME
                + " WHERE " + COLUMN_MESSAGE_FROM_NAME + "='"
                + fromJid.toBareJID() + "' AND " + COLUMN_MESSAGE_TYEP_NAME
                + "=2";

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
                    ret = resultSet.getInt("msgfrom_count");
                }
            } catch (SQLException e) {
                Log.error("Failed to get task count : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    public static List<Message> getChatHistoryDbData(int baseIdIndex,
            int countNum, String participantJid1, String participantJid2) {
        final String prefix = "getChatHistoryDbData():";
        String where = getWhereSqlString(participantJid1, participantJid2,
                baseIdIndex);
        if (where == null || where.equals("")) {
            return null;
        }
        String orderBy = TABLE_NAME + "." + COLUMN_ID_NAME + " DESC";
        String limit = String.valueOf(countNum);

        String sql = MessageStoreDbHelper
                .getMessageListSQLAppendReadInfo(participantJid1)
                + " WHERE "
                + where + " ORDER BY " + orderBy + " LIMIT " + limit;

        List<Message> retList = new ArrayList<Message>();
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
                .createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error(prefix + "Failed to open database", new Throwable());
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    Message message = getOneMessageByResultSet(resultSet, true, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error(prefix + "Failed to get chat_history data",
                        new Throwable());
            }
            dbHelper.close();
            MessageStoreDbHelper.complementReaderInfo(retList);
        } catch (Exception e) {
        }
        return retList;
    }

    private static String getWhereSqlString(String participantJid1,
            String participantJid2, int baseIdIndex) {
        String where = null;
        if (participantJid1 == null || participantJid1.equals("")) {
            return null;
        }
        if (participantJid2 == null || participantJid2.equals("")) {
            return null;
        }
        participantJid1 = GlobalSNSUtils.escapeSqlData(participantJid1);
        participantJid2 = GlobalSNSUtils.escapeSqlData(participantJid2);
        where = "(" + TABLE_NAME + "." + COLUMN_MESSAGE_TYEP_NAME + "="
                + Message.TYPE_CHAT + ") AND ((" + TABLE_NAME + "."
                + COLUMN_MESSAGE_FROM_NAME + "='" + participantJid1 + "' AND "
                + TABLE_NAME + "." + COLUMN_MESSAGE_TO_NAME + "='"
                + participantJid2 + "') OR (" + TABLE_NAME + "."
                + COLUMN_MESSAGE_FROM_NAME + "='" + participantJid2 + "' AND "
                + TABLE_NAME + "." + COLUMN_MESSAGE_TO_NAME + "='"
                + participantJid1 + "'))";
        if (baseIdIndex > 0) {
            where += " AND (" + TABLE_NAME + "." + COLUMN_ID_NAME + "<"
                    + String.valueOf(baseIdIndex) + ")";
        }
        where = "(" + where + ") AND ((" + TABLE_NAME + "."
                + COLUMN_DELETE_FLAG_NAME + "="
                + Message.DELETE_FLAG_NON_DELETED + ")OR(" + TABLE_NAME + "."
                + COLUMN_DELETE_FLAG_NAME + "=" + Message.DELETE_FLAG_TRUSH
                + "))";

        return where;
    }
}
