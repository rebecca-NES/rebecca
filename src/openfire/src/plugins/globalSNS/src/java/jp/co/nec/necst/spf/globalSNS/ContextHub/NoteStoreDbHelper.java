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
import jp.co.nec.necst.spf.globalSNS.Data.Note;

import org.jivesoftware.util.Log;

public class NoteStoreDbHelper {
    private final static String TABLE_NAME = "note_store";

    private final static String COLUMN_ID_NAME             = "id";
    private final static String COLUMN_NOTE_TITLE_NAME     = "note_title";
    private final static String COLUMN_NOTE_URL_NAME       = "note_url";
    private final static String COLUMN_THREAD_ROOT_ID_NAME = "thread_root_id";
    private final static String COLUMN_OWN_JID_NAME        = "ownjid";
    private final static String COLUMN_CODIMD_UID_NAME     = "codimd_uid";
    private final static String COLUMN_CREATED_AT_NAME     = "created_at";
    private final static String COLUMN_UPDATED_AT_NAME     = "updated_at";

    @SuppressWarnings("deprecation")
    public static Note getNoteData(String itemId) {
        Log.debug("do func NoteStoreDbHelper.getNoteData(...");
        Note noteData = null;
        if (itemId == null || itemId.equals("")) {
            return noteData;
        }
        String sql = getOneNoteDataSelectSql(itemId);
        if (sql == null || sql.equals("")) {
            return noteData;
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
                    noteData = getOneNoteDataByResultSet(resultSet);
                }
            } catch (SQLException e) {
                Log.error("Failed to get timeline data");
            }
            dbHelper.close();
        } catch (Exception e) {
            Log.error("database open error:" + e);
        }
        return noteData;
    }

    private final static String getOneNoteDataSelectSql(String itemId) {
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        String itemIdSql = GlobalSNSUtils.escapeSqlData(itemId);
        return String.format
            ("SELECT"
             + " e.*"
             + " FROM %s AS e WHERE e.%s = '%s'",
             TABLE_NAME,
             COLUMN_THREAD_ROOT_ID_NAME,
             itemIdSql);
    }

    private static Note getOneNoteDataByResultSet(ResultSet resultSet) {
        Note noteData = new Note();
        try {
            noteData.setId(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
            noteData.setTitle(resultSet.getString(COLUMN_NOTE_TITLE_NAME));
            noteData.setNoteUrl(resultSet.getString(COLUMN_NOTE_URL_NAME));
            noteData.setThreadRootId(resultSet.getString(COLUMN_THREAD_ROOT_ID_NAME));
            noteData.setJid(resultSet.getString(COLUMN_OWN_JID_NAME));
            noteData.setCreatedAt(resultSet.getTimestamp(COLUMN_CREATED_AT_NAME));
            noteData.setUpdatedAt(resultSet.getTimestamp(COLUMN_UPDATED_AT_NAME));
        } catch (SQLException e) {
            return null;
        }
        return noteData;
    }

}
