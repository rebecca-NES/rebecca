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

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityMemberStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityStoreDbHelper;

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class CommunityMessageSeekableCondition extends MessageFilterCondition {

    private String mJid = null;
    protected String mMatchColumn = null;

    @SuppressWarnings("deprecation")
    @Override
    public String toSqlWhereSectionString() {
        String ret = "";
        if (mJid == null) {
            Log.error("GroupChatNarrowCondition#toSqlWhereSectionString::mJid is invalid");
            return ret;
        }
        if(mMatchColumn == null) {
            Log.error("GroupChatNarrowCondition#toSqlWhereSectionString::mMatchColumn is invalid");
            return ret;
        }
        String sqlJidStr = GlobalSNSUtils.escapeSqlData(mJid);
        String sqlMatchColumnStr = GlobalSNSUtils.escapeSqlData(mMatchColumn);
        List<String> joinedCommunityList = CommunityMemberStoreDbHelper.getJoinedCommunityIdList(sqlJidStr);
        List<String> openedCommunityList = CommunityStoreDbHelper.getOpendCommunityIdList();
        Set<String> communityIds = new HashSet<String>(joinedCommunityList);
        communityIds.addAll(openedCommunityList);
        List<String> communityIdList = new ArrayList<String>(communityIds);
        if (communityIdList.isEmpty()) {
            ret = "FALSE";
        }
        else {
            ret = "(" + sqlMatchColumnStr + " IN ("
                    + GlobalSNSUtils.convertListToStringforInOperator(communityIdList) + "))";
        }
        return ret;
    }

    @Override
    public boolean setDataFromElement(Element element) {
        return true;
    }

    @SuppressWarnings("deprecation")
    public boolean setData(String jid, String matchColumn) {
        if (jid == null) {
            Log.error("CommunityMessageSeekableCondition#setData::jid is null");
            return false;
        }
        if (jid.equals("")) {
            Log.error("CommunityMessageSeekableCondition#setData::jid is empty");
            return false;
        }
        if (matchColumn == null) {
            Log.error("CommunityMessageSeekableCondition#setData::matchColumn is null");
            return false;
        }
        if (matchColumn.equals("")) {
            Log.error("CommunityMessageSeekableCondition#setData::matchColumn is empty");
            return false;
        }
        mJid = jid;
        mMatchColumn = matchColumn;
        return true;
    }

}
