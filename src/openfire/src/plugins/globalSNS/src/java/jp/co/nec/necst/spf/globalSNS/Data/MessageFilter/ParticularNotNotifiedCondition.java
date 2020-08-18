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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatRoomMemberStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.ChatRoomStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityMemberStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ParticularNotNotifiedCondition {
    private static final Logger Log = LoggerFactory
            .getLogger(ParticularNotNotifiedCondition.class);

    public String toSqlWhereSectionString(String userJID) {
        String ret = "";
        if (userJID == null || userJID.equals("")) {
            Log.error("ParticularNotNotifiedCondition#toSqlWhereSectionString::value is invalid");
            return ret;
        }

        String joinedNonNotifiedChatRoomIdsSelectSqlByJidNonOrder = ChatRoomMemberStoreDbHelper.getJoinedNonNotifiedChatRoomIdsSelectSqlByJidNonOrder(userJID);
        String joinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder = CommunityMemberStoreDbHelper.getJoinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder(userJID);
        if((joinedNonNotifiedChatRoomIdsSelectSqlByJidNonOrder == null || joinedNonNotifiedChatRoomIdsSelectSqlByJidNonOrder.equals(""))
                && (joinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder == null || joinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder.equals(""))) {
            ret = "TRUE";
        }
        ret = "(";
        if(joinedNonNotifiedChatRoomIdsSelectSqlByJidNonOrder != null && !joinedNonNotifiedChatRoomIdsSelectSqlByJidNonOrder.equals("")) {
            ret += "(" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_MESSAGE_TO_NAME +
              " NOT IN (" + ChatRoomMemberStoreDbHelper.getJoinedNonNotifiedChatRoomIdsSelectSqlByJidNonOrder(userJID) +
              "))";
            if(joinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder != null && !joinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder.equals("")) {
                ret += " AND ";
            }
        }
        if(joinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder != null && !joinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder.equals("")) {
            ret += "(" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_MESSAGE_TO_NAME +
              " NOT IN (" + CommunityMemberStoreDbHelper.getJoinedNonNotifiedCommunityIdListSelectSqlByJidNonOrder(userJID) +
              "))";
        }
        ret += ")";

        return ret;
    }

    private List<String> getRoomIdListByServerSettingNotNotified(String userJID) {
        List<String> roomIdList = new ArrayList<String>();

        List<String> chatRoomIdList = ChatRoomStoreDbHelper.getChatRoomIdListByNotifyOff();
        List<String> affiliationChatRoomIdList = ChatRoomMemberStoreDbHelper.getJoinedChatRoomIdList(userJID);
        roomIdList.addAll(extractionDuplicateList(chatRoomIdList, affiliationChatRoomIdList));

        List<String> communityRoomIdList = CommunityStoreDbHelper.getCommunityRoomIdListByNotifyOff();
        List<String> affiliationCommunityRoomIdList = CommunityMemberStoreDbHelper.getJoinedCommunityIdList(userJID);
        roomIdList.addAll(extractionDuplicateList(communityRoomIdList, affiliationCommunityRoomIdList));

        return roomIdList;
    }

    private List<String> extractionDuplicateList(List<String> chatRoomIdList, List<String> affiliationChatRoomIdList) {

        List<String> roomIdList = new ArrayList<String>();

        Map<String, String> mapT = new HashMap<String, String>();

        for(String roomId : chatRoomIdList) {
            mapT.put(roomId, "");
        }
        for(String roomId : affiliationChatRoomIdList) {
            if(mapT.containsKey(roomId)) {
                roomIdList.add(roomId);
            }
        }

        return roomIdList;
    }
}
