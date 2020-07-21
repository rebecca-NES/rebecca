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

import org.jivesoftware.util.Log;

public class PublicMessageDbHelper extends MessageStoreDbHelper {

    @SuppressWarnings("deprecation")
    public static int getNextPublicMessageItemIdNumber(String stream_name) {
        int retNumber = 0;
        if (stream_name == null) {
            return retNumber;
        }
        String streamNamePrefix = stream_name + "_";
        String sql = "SELECT " + COLUMN_ID_NAME + ", " + COLUMN_ITEM_ID_NAME
                + " FROM " + TABLE_NAME + " WHERE " + COLUMN_ITEM_ID_NAME
                + " ~ E'^"
                + GlobalSNSUtils.escapeSqlDataForRegexpPhrase(streamNamePrefix)
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
                        String lastPublicMessageItemId = resultSet
                                .getString(COLUMN_ITEM_ID_NAME);
                        String currentIndexNumberStr = "";
                        try {
                            currentIndexNumberStr = lastPublicMessageItemId
                                    .substring(streamNamePrefix.length(),
                                            lastPublicMessageItemId.length());
                            retNumber = Integer.parseInt(currentIndexNumberStr);
                        } catch (IndexOutOfBoundsException e) {
                            Log.error("Failed to extract currentIndexNumberStr : "
                                    + currentIndexNumberStr);
                        } catch (NumberFormatException e) {
                            Log.error("invalid number format currentIndexNumberStr : "
                                    + currentIndexNumberStr);
                        }
                    }
                    retNumber += 1;
                } catch (SQLException e) {
                    Log.error("Failed to get next PublicMessage ItemId number : "
                            + sql);
                }
                dbHelper.close();
            } catch (Exception e) {
            }
        }
        return retNumber;
    }
}
