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

import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.List;
import java.util.HashSet;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.CommunityMemberStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.ReadMessageInfoStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class ParticularCondition extends ItemCondition {
    public static final String ELEMENT_NAME = "particular";

    static final private String TASK_REQUESTING = "TaskRequesting";
    static final private String TASK_REQUESTED = "TaskRequested";
    static final private String TASK_SELF = "TaskSelf";
    static final private String TASK_OWNER = "TaskOwner";
    static final private String COMMUNITY_JOINED = "CommunityJoined";
    static final private String COMMUNITY_TASK_DEMANDED = "CommunityTaskDemanded";
    static final private String MESSAGE_HAVING_URL_EXCEPT_ATTACHED_FILE = "MessageHavingUrlExceptAttachedFile";
    static final private String UNREAD_MESSAGE = "UnreadMessage";
    static final private String NOT_NOTIFIED = "NotNotified";

    @SuppressWarnings("deprecation")
    @Override
    public String toSqlWhereSectionString() {
        String ret = "";
        if (mName == null || mType == null || mValue == null) {
            Log.error("ParticularCondition#toSqlWhereSectionString::data is invalid");
            return ret;
        }
        switch (mType) {
        case STRING:
            if (TASK_REQUESTING.equals(mName)) {
                List<String> parentIdList = MessageStoreDbHelper.getParentItemIdListByClientId(mValue);
                if (parentIdList.isEmpty()) {
                    ret = "FALSE";
                } else {
                    ret = "(" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME
                            + " IN (" + GlobalSNSUtils.convertListToStringforInOperator(parentIdList)
                            + "))";
                }
            } else if (TASK_REQUESTED.equals(mName)) {
                ret = "((" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_OWNER_NAME + "='"
                        + GlobalSNSUtils.escapeSqlData(mValue) + "' AND "
                        + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_PARENT_ITEM_ID_NAME
                        + "<>'')";
                List<String> parentIdList = MessageStoreDbHelper.getParentItemIdListByOwnerIdAndExistGroupName(mValue);
                if (parentIdList.isEmpty()) {
                    ret += ")";
                } else {
                    ret += " OR " + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME
                            + " IN (" + GlobalSNSUtils.convertListToStringforInOperator(parentIdList)
                            + "))";
                }
            } else if (TASK_SELF.equals(mName)) {
                List<String> parentIdList = MessageStoreDbHelper.getParentItemIdListByClientId(mValue);
                if (parentIdList.isEmpty()) {
                    ret = "(" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_OWNER_NAME + "='"
                            + GlobalSNSUtils.escapeSqlData(mValue) + "' AND "
                            + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_PARENT_ITEM_ID_NAME
                            + "='')";
                } else {
                    ret = "(" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_OWNER_NAME + "='"
                            + GlobalSNSUtils.escapeSqlData(mValue) + "' AND "
                            + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_PARENT_ITEM_ID_NAME
                            + "='' AND NOT "
                            + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME
                            + " IN (" + GlobalSNSUtils.convertListToStringforInOperator(parentIdList)
                            + "))";
                }
            } else if (TASK_OWNER.equals(mName)) {
                List<String> parentIdList = MessageStoreDbHelper.getUniqueParentItemIdListByOwnerId(mValue);
                if (parentIdList.isEmpty()) {
                    ret = "(" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_OWNER_NAME + "='"
                            + GlobalSNSUtils.escapeSqlData(mValue) + "')";
                } else {
                    ret = "((" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_OWNER_NAME + "='"
                            + GlobalSNSUtils.escapeSqlData(mValue) + "') OR " + "("
                            + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME + " IN "
                            + "(" + GlobalSNSUtils.convertListToStringforInOperator(parentIdList)
                            + ")))";
                }
            } else if (COMMUNITY_JOINED.equals(mName)) {
                String sqlJidStr = GlobalSNSUtils.escapeSqlData(mValue);
                List<String> joinedCommunityList = CommunityMemberStoreDbHelper.getJoinedCommunityIdList(sqlJidStr);
                if (joinedCommunityList.isEmpty()) {
                    ret = "FALSE";
                } else {
                    ret = "((" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME
                            + "=" + String.valueOf(Message.TYPE_TASK) + " AND "
                            + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_GROUP_NAME
                            + " IN (" + GlobalSNSUtils.convertListToStringforInOperator(joinedCommunityList)
                            + ")) OR ("
                            + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME + "="
                            + String.valueOf(Message.TYPE_COMMUNITY) + " AND "
                            + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_MESSAGE_TO_NAME
                            + " IN (" + GlobalSNSUtils.convertListToStringforInOperator(joinedCommunityList)
                            + ")))";
                }
            } else if (COMMUNITY_TASK_DEMANDED.equals(mName)) {
                List<String> parentIdList = MessageStoreDbHelper.getParentItemIdListOfDemandTask();
                if (parentIdList.isEmpty()) {
                    ret = "FALSE";
                } else {
                    ret = "(" + MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME
                            + " IN (" + GlobalSNSUtils.convertListToStringforInOperator(parentIdList)
                            + "))";
                }
            } else if (MESSAGE_HAVING_URL_EXCEPT_ATTACHED_FILE.equals(mName)) {
                ret = toSqlWhereSectionStringForMessageHavingUrlExceptAttachedFile(mValue);
            }else if(UNREAD_MESSAGE.equals(mName)){
                ret = toSqlWhereSectionStringForUnReadMesage(mValue);
            } else if(NOT_NOTIFIED.equals(mName)) {
                ParticularNotNotifiedCondition condition = new ParticularNotNotifiedCondition();
                ret = condition.toSqlWhereSectionString(mValue);
            } else {
                Log.error("ParticularCondition#toSqlWhereSectionString::name is invalid");
            }
            break;
        default:
            Log.error("ParticularCondition#toSqlWhereSectionString::type is invalid");
            break;
        }
        return ret;
    }


    @SuppressWarnings("deprecation")
    private String toSqlWhereSectionStringForMessageHavingUrlExceptAttachedFile(
            String value) {
        String ret = "";
        if (value == null || value.equals("")) {
            Log.error("ParticularCondition#toSqlWhereSectionStringForMessageHavingUrlExceptAttachedFile::value is invalid");
            return ret;
        }
        String decodedValue = value;
        try {
            decodedValue = URLDecoder.decode(value, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            Log.error("ParticularCondition#toSqlWhereSectionStringForMessageHavingUrlExceptAttachedFile::value is invalid(encode decode)");
            return ret;
        }
        try {
            if (decodedValue != null) {
                value = URLEncoder.encode(decodedValue, "UTF-8");
            }
        } catch (UnsupportedEncodingException e) {
            Log.error("ParticularCondition#toSqlWhereSectionStringForMessageHavingUrlExceptAttachedFile::decodedValue is invalid(encode decode)");
            return ret;
        }
        ret = "(";
        ret += "(" + MessageStoreDbHelper.TABLE_NAME + "." +  MessageStoreDbHelper.COLUMN_ENTRY_NAME
                + " ~ E'^.*>[^<]*https?%3A%2F%2F(";
        int count = value.length();
        StringBuilder sbUnless = new StringBuilder();
        for (int i = 0; i < count; i++) {
            String preStr = value.substring(0, i);
            String escapePreStrForRegexpPhrase = GlobalSNSUtils
                    .escapeSqlDataForRegexpPhrase(preStr);
            sbUnless.append(escapePreStrForRegexpPhrase);
            String unlessCharStr = value.substring(i, i + 1);
            sbUnless.append("[^"
                    + GlobalSNSUtils
                            .escapeSqlDataForRegexpPhraseInBracket(unlessCharStr)
                    + "]");
            if (i != count - 1) {
                sbUnless.append("|");
            }
        }
        ret += sbUnless.toString();
        ret += ").*$')";
        ret += " AND (" + MessageStoreDbHelper.COLUMN_DELETE_FLAG_NAME + "=0)";
        ret += ")";
        return ret;
    }

    @SuppressWarnings("deprecation")
    private String toSqlWhereSectionStringForUnReadMesage(String value) {
        String ret = "";
        if (value == null || value.equals("")) {
            Log.error("ParticularCondition#toSqlWhereSectionStringForUnReadMesage::value is invalid");
            return ret;
        }
        Set<String> jidSet = new HashSet<String>();
        jidSet.add(value);
        List<Profile> profiles = UserProfileDbHelper.getUserProfileDataList(jidSet, false);
        if (profiles == null || profiles.isEmpty()) {
            return ret;
        }
        String read_users = "";
        for(int i=0;i<profiles.size();i++){
            Profile profile = profiles.get(i);
            int id = profile.getId();
            BigInteger userId = BigInteger.valueOf(id);
            String s62 = GlobalSNSUtils.decimalToSixtyTwoString(userId);
            if(read_users.length() > 0){
                read_users += " AND ";
            }
            read_users += " NOT ("
                + ReadMessageInfoStoreDbHelper.TABLE_NAME + "." + ReadMessageInfoStoreDbHelper.COLUMN_READ_USER_IDS_NAME
                + " LIKE '%" + GlobalSNSUtils.escapeSqlDataForLikePhrase(s62) + "%' )"
                ;
        }

        ret = "( "
            + "  NOT (" + ReadMessageInfoStoreDbHelper.TABLE_NAME + "." + ReadMessageInfoStoreDbHelper.COLUMN_ID_NAME + " IS NULL) "
            + "  AND("
            +     ReadMessageInfoStoreDbHelper.TABLE_NAME + "." + ReadMessageInfoStoreDbHelper.COLUMN_COUNT_NAME + "=0"
            + "   OR (" + read_users +")"
            + "  )"
            + ")";
        return ret;
    }

    @SuppressWarnings("deprecation")
    @Override
    public boolean setDataFromElement(Element element) {
        if (element == null) {
            Log.error("ParticularCondition#setDataFromElement::element is null");
            return false;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("ParticularCondition#setDataFromElement::tag name is null");
            return false;
        }
        if (!(tagName.toLowerCase().equals(ELEMENT_NAME))) {
            Log.error("ParticularCondition#setDataFromElement::tag name is different");
            return false;
        }
        List<?> childElems = element.elements();
        if (childElems != null && childElems.size() > 0) {
            Log.error("ParticularCondition#setDataFromElement::this elem has children - "
                    + String.valueOf(childElems.size()));
            return false;
        }
        String conditionName = element.attributeValue(CONDITION_NAME_ATTR);
        if (conditionName == null || conditionName.equals("")) {
            Log.error("ParticularCondition#setDataFromElement::condition name is invalid");
            return false;
        }
        String conditionType = element.attributeValue(CONDITION_TYPE_ATTR);
        if (conditionType == null) {
            Log.error("ParticularCondition#setDataFromElement::condition type is null");
            return false;
        }
        String conditionValue = element.getStringValue();
        if (conditionValue == null) {
            Log.error("ParticularCondition#setDataFromElement::condition value is null");
            return false;
        }
        if (conditionType.equals(CONDITION_TYPE_ATTR_VALUE_NUMBER)) {
            mType = ValueType.NUMBER;
        } else if (conditionType.equals(CONDITION_TYPE_ATTR_VALUE_STRING)) {
            mType = ValueType.STRING;
        } else {
            Log.error("ParticularCondition#setDataFromElement::condition type is unknown");
            return false;
        }
        mName = conditionName;
        mValue = conditionValue;
        return true;
    }
}
