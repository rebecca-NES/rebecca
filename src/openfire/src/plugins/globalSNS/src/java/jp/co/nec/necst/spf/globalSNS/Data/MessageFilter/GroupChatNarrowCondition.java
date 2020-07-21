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

package jp.co.nec.necst.spf.globalSNS.Data.MessageFilter;

import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatRoomMemberStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class GroupChatNarrowCondition extends MessageFilterCondition {

    private String mJid = null;;

    @SuppressWarnings("deprecation")
    @Override
    public String toSqlWhereSectionString() {
        String ret = "";
        if (mJid == null) {
            Log.error("GroupChatNarrowCondition#toSqlWhereSectionString::mJid is invalid");
            return ret;
        }
        String joinedGroupChatSelectSQL = ChatRoomMemberStoreDbHelper.getJoinedChatRoomIdsSelectSqlByJidNonOrder(mJid);
        if (joinedGroupChatSelectSQL == null || joinedGroupChatSelectSQL.equals("")) {
            ret = "FALSE";
        }
        else {
            ret = "(" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_MESSAGE_TO_NAME
                    + " IN (" + joinedGroupChatSelectSQL + "))";
        }
        return ret;
    }

    @Override
    public boolean setDataFromElement(Element element) {
        return true;
    }

    @SuppressWarnings("deprecation")
    public boolean setData(String jid) {
        if (jid == null) {
            Log.error("GroupChatNarrowCondition#setData::jid is null");
            return false;
        }
        if (jid.equals("")) {
            Log.error("GroupChatNarrowCondition#setData::jid is empty");
            return false;
        }
        mJid = jid;
        return true;
    }

}
