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
import java.util.ArrayList;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Calendar;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import org.xmpp.packet.JID;

import org.jivesoftware.util.Log;

public class UserFollowStoreDbHelper {
    public final static String TABLE_NAME = "user_follow_store";

    GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();

    public static List<JID> getFollowerJidList(String jid){
        List<JID> followerJidList = new ArrayList<JID>();
        if (jid == null) {
            return followerJidList;
        }
        String sql = "SELECT * "
            + " FROM "+ TABLE_NAME
            + " WHERE followee='" + GlobalSNSUtils.escapeSqlData(jid) + "'";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper
            .getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                try {
                    followerJidList.add(new JID(jid));
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    while (resultSet.next()) {
                        String followerJid = resultSet.getString("follower");
                        if(followerJid != null && followerJid.indexOf('@') >= 0){
                            followerJidList.add(new JID(followerJid));
                        }
                    }
                } catch (SQLException e) {
                    Log.error("Failed to get next Follower number : " + sql);
                }
                dbHelper.close();
            } catch (Exception e) {
                return followerJidList;
            }
        }
        return followerJidList;
    }
}
