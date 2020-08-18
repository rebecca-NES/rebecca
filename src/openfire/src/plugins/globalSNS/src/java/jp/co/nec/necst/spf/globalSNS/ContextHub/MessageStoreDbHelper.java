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
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;
import java.util.Enumeration;
import java.util.Hashtable;
import java.util.HashSet;
import java.util.Set;


import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.MessageExistingReaderInfo;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.ChatRoomInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;
import jp.co.nec.necst.spf.globalSNS.Data.PublicMessageQuestionnaireInfo;
import jp.co.nec.necst.spf.globalSNS.Data.MessageFilter.MessageFilterCondition;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.MessageSortCondition;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.SortCondition;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MessageStoreDbHelper {
    private static final Logger Log = LoggerFactory
            .getLogger(MessageStoreDbHelper.class);

    public final static String TABLE_NAME = "publicmessage_store";
    public final static String TABLE_NAME_LOG = "publicmessage_logs";
    public final static String TABLE_THREAD_STORE_NAME = "thread_store";
    public final static String TABLE_THREAD_STORE_LOG_NAME = "thread_store_log";
    public final static String TABLE_QUOTATION_MESSAGE_STORE_NAME = "quotation_message_store";

    public final static String COLUMN_ID_NAME = "id";
    public final static String COLUMN_ITEM_ID_NAME = "item_id";
    public final static String COLUMN_MESSAGE_TYEP_NAME = "msgtype";
    public final static String COLUMN_MESSAGE_FROM_NAME = "msgfrom";
    public final static String COLUMN_MESSAGE_TO_NAME = "msgto";
    public final static String COLUMN_ENTRY_NAME = "entry";
    public final static String COLUMN_BODY_TYPE_NAME = "body_type";
    public final static String COLUMN_PUBLISH_NODE_NAME_NAME = "publish_nodename";
    public final static String COLUMN_CREATED_AT_NAME = "created_at";
    public final static String COLUMN_REPLY_ID_NAME = "reply_id";
    public final static String COLUMN_REPLY_TO_NAME = "reply_to";
    public final static String COLUMN_START_DATE_NAME = "start_date";
    public final static String COLUMN_DUE_DATE_NAME = "due_date";
    public final static String COLUMN_OWNER_NAME = "owner";
    public final static String COLUMN_GROUP_NAME = "group_name";
    public final static String COLUMN_ROOM_NAME_NAME = "room_name";
    public final static String COLUMN_MURMUR_NAME = "column_name";
    public final static String COLUMN_PARENT_ROOM_ID_NAME = "parent_room_id";
    public final static String COLUMN_STATUS_NAME = "status";
    public final static String COLUMN_COMPLETE_DATE_NAME = "complete_date";
    public final static String COLUMN_PRIORITY_NAME = "priority";
    public final static String COLUMN_UPDATED_AT_NAME = "updated_at";
    public final static String COLUMN_UPDATED_BY_NAME = "updated_by";
    public final static String COLUMN_CLIENT_NAME = "client";
    public final static String COLUMN_SHOW_TYPE_NAME = "show_type";
    public final static String COLUMN_PARENT_ITEM_ID_NAME = "parent_item_id";
    public final static String COLUMN_DELETE_FLAG_NAME = "delete_flag";
    public final static String COLUMN_DELETED_AT_NAME = "deleted_at";
    public final static String COLUMN_DELETED_BY_NAME = "deleted_by";
    public final static String COLUMN_MAIL_MESSAGE_ID_NAME = "mail_message_id";
    public final static String COLUMN_MAIL_IN_REPLY_TO_NAME = "mail_in_reply_to";
    public final static String COLUMN_DEMAND_STATUS_NAME = "demand_status";
    public final static String COLUMN_DEMAND_DATE = "demand_date";
    public final static String COLUMN_READ_FLG = "read_flg";
    public final static String COLUMN_THREAD_TITLE_NAME = "thread_title";
    public final static String COLUMN_THREAD_ROOT_ID_NAME = "thread_root_id";
    public final static String COLUMN_ROOM_ID_NAME = "room_id";
    public final static String COLUMN_CREATED_BY_NAME = "created_by";
    public final static String COLUMN_MOVED_AT_NAME = "moved_at";
    public final static String COLUMN_MOVED_BY_NAME = "moved_by";
    public final static String COLUMN_QUOTATION_MESSAGE_ID_NAME = "quotation_message_id";
    public final static String COLUMN_VOTE_FLAG = "vote_flag";

    private static final Integer[] NOT_GET_READ_INFO_TYPES = {
            Message.TYPE_UNKNOWN, Message.TYPE_TASK, Message.TYPE_SYSTEM };

    public final static Message getOneMessageByItemIdWithoutReadInfo(
            String itemId) {
        Log.debug("do func MessageStoreDbHelper.getOneMessageByItemIdWithoutReadInfo(...");
        if (itemId == null) {
            return null;
        }
        List<String> itemIdList = new ArrayList<String>();
        itemIdList.add(itemId);

        List<Message> messageList = getMessageDbDataByItemIdsWithoutReadInfo(itemIdList);

        if (messageList == null || messageList.size() <= 0) {
            return null;
        }
        Message message = messageList.get(0);

        return message;
    }

    public final static Message getOneMessageByItemIdRegardlessDeleteFlagWithoutReadInfo(
            String itemId) {
        Log.debug("do func MessageStoreDbHelper.getOneMessageByItemIdRegardlessDeleteFlagWithoutReadInfo(...");
        if (itemId == null) {
            return null;
        }
        List<String> itemIdList = new ArrayList<String>();
        itemIdList.add(itemId);

        List<Message> messageList = getMessageDbDataByItemIdsRegardlessDeleteFlagWithoutReadInfo(itemIdList);

        if (messageList == null || messageList.size() <= 0) {
            return null;
        }
        Message message = messageList.get(0);

        return message;
    }

    public final static Message getOneMessageAppendMessageReadInfoByItemId(
            String itemId, String jidForGetReadStatus) {
        Log.debug("do func MessageStoreDbHelper.getOneMessageAppendMessageReadInfoByItemId(...");
        if (itemId == null) {
            return null;
        }
        if (jidForGetReadStatus == null
                || jidForGetReadStatus.trim().equals("")) {
            return null;
        }
        List<String> itemIdList = new ArrayList<String>();
        itemIdList.add(itemId);

        List<Message> messageList = getMessageDbDataAppendMessageReadInfoByItemIds(
                itemIdList, jidForGetReadStatus);

        if (messageList.size() <= 0) {
            return null;
        }
        Message message = messageList.get(0);

        return message;
    }

    public static boolean isInColumn(ResultSet resultSet, String columnName) throws SQLException{
        Log.debug("do func MessageStoreDbHelper.isInColumn(...");
        ResultSetMetaData rsMeta = resultSet.getMetaData();
        int columnCount = rsMeta.getColumnCount();
        for (int i = 1; i <= columnCount; i++ ) {
            String name = rsMeta.getColumnName(i);
            if(name.equals(columnName)){
                return true;
            }
        }
        return false;
    }

    public final static Message getOneMessageByResultSet(ResultSet resultSet,
                                                         boolean needReadInfo, boolean needVoteFlag) {
        Log.debug("do func MessageStoreDbHelper.getOneMessageByResultSet(...");
        Message message = new Message();
        try {
            message.setId(new BigInteger(resultSet.getString(COLUMN_ID_NAME)));
            message.setItemId(resultSet.getString(COLUMN_ITEM_ID_NAME));
            message.setMsgType(resultSet.getInt(COLUMN_MESSAGE_TYEP_NAME));
            message.setMsgFrom(resultSet.getString(COLUMN_MESSAGE_FROM_NAME));
            message.setMsgTo(resultSet.getString(COLUMN_MESSAGE_TO_NAME));
            message.setEntry(resultSet.getString(COLUMN_ENTRY_NAME));
            message.setBodyType(resultSet.getInt(COLUMN_BODY_TYPE_NAME));
            message.setPublishNodename(resultSet
                    .getString(COLUMN_PUBLISH_NODE_NAME_NAME));
            message.setCreatedAt(resultSet.getTimestamp(COLUMN_CREATED_AT_NAME));
            message.setReplyId(resultSet.getString(COLUMN_REPLY_ID_NAME));
            message.setReplyTo(resultSet.getString(COLUMN_REPLY_TO_NAME));

            String threadTitleStr = null;
            if(isInColumn(resultSet, COLUMN_THREAD_TITLE_NAME)){
                threadTitleStr = resultSet.getString(COLUMN_THREAD_TITLE_NAME);
            }
            message.setThreadTitle(threadTitleStr == null ? "" : threadTitleStr);

            message.setThreadRootId(resultSet.getString(COLUMN_THREAD_ROOT_ID_NAME));
            message.setStartDate(resultSet.getTimestamp(COLUMN_START_DATE_NAME));
            message.setDueDate(resultSet.getTimestamp(COLUMN_DUE_DATE_NAME));
            String ownerString = resultSet.getString(COLUMN_OWNER_NAME);
            message.setOwner(ownerString == null ? "" : ownerString);
            String groupString = resultSet.getString(COLUMN_GROUP_NAME);
            message.setGroup(groupString == null ? "" : groupString);
            try{
                String groupNameString = resultSet.getString(COLUMN_ROOM_NAME_NAME);
                message.setGroupName(groupNameString == null ? "" : groupNameString);
            }catch(java.sql.SQLException e){}
            try{
                String parentRoomIdString = resultSet.getString(COLUMN_PARENT_ROOM_ID_NAME);
                message.setParentRoomId(parentRoomIdString == null ? "" : parentRoomIdString);
            }catch(java.sql.SQLException e){}
            if(isInColumn(resultSet, COLUMN_MURMUR_NAME)){
                message.setColumnName(resultSet.getString(COLUMN_MURMUR_NAME));
            }
            message.setStatus(resultSet.getInt(COLUMN_STATUS_NAME));
            message.setCompleteDate(resultSet
                    .getTimestamp(COLUMN_COMPLETE_DATE_NAME));
            message.setPriority(resultSet.getInt(COLUMN_PRIORITY_NAME));
            message.setUpdatedAt(resultSet.getTimestamp(COLUMN_UPDATED_AT_NAME));
            message.setUpdatedBy(resultSet.getString(COLUMN_UPDATED_BY_NAME));
            message.setClient(resultSet.getString(COLUMN_CLIENT_NAME));
            message.setShowType(resultSet.getInt(COLUMN_SHOW_TYPE_NAME));
            String parentItemId = resultSet
                    .getString(COLUMN_PARENT_ITEM_ID_NAME);
            message.setParentItemId(parentItemId == null ? "" : parentItemId);
            message.setDeleteFlag(resultSet.getInt(COLUMN_DELETE_FLAG_NAME));
            message.setDeletedAt(resultSet.getTimestamp(COLUMN_DELETED_AT_NAME));
            message.setDeletedBy(resultSet.getString(COLUMN_DELETED_BY_NAME));
            message.setMailMessageId(resultSet
                    .getString(COLUMN_MAIL_MESSAGE_ID_NAME));
            message.setMailInReplyTo(resultSet
                    .getString(COLUMN_MAIL_IN_REPLY_TO_NAME));
            message.setDemandStatus(resultSet.getInt(COLUMN_DEMAND_STATUS_NAME));
            message.setDemandDate(resultSet.getTimestamp(COLUMN_DEMAND_DATE));
            if (Message.TYPE_QUESTIONNAIRE == message.getMsgType()) {
                PublicMessageQuestionnaireInfo publicmessageQuestionnaireInfo = new PublicMessageQuestionnaireInfo();
                publicmessageQuestionnaireInfo.setRoomType(resultSet.getInt(PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME));
                publicmessageQuestionnaireInfo.setInputType(resultSet.getInt(PublicMessageQuestionnaireStoreDbHelper.COLUMN_INPUT_TYPE_NAME));
                publicmessageQuestionnaireInfo.setResultVisible(resultSet.getInt(PublicMessageQuestionnaireStoreDbHelper.COLUMN_RESULT_VISIBLE_NAME));
                publicmessageQuestionnaireInfo.setGraphType(resultSet.getInt(PublicMessageQuestionnaireStoreDbHelper.COLUMN_GRAPH_TYPE_NAME));
                message.setPublicmessageQuestionnaireInfo(publicmessageQuestionnaireInfo);
            }
            if(resultSet.getBigDecimal(COLUMN_QUOTATION_MESSAGE_ID_NAME) != null){
                message.setQuotationMessageId
                    (resultSet.getBigDecimal(COLUMN_QUOTATION_MESSAGE_ID_NAME).toBigInteger());
            }
            if (needReadInfo
                    && !Arrays.asList(NOT_GET_READ_INFO_TYPES).contains(
                            new Integer(message.getMsgType()))) {
                setReadInfo(message, resultSet);
            }
            if (needVoteFlag) {
                message.setVoteFlag(resultSet.getInt(COLUMN_VOTE_FLAG));
            }
        } catch (SQLException e) {
            Log.error("getOneMessageByResultSet() : ", e);
            return null;
        }
        return message;
    }

    private static void setReadInfo(Message message, ResultSet resultSet) {
        Log.debug("do func MessageStoreDbHelper.setReadInfo(...");
        if (message == null) {
            return;
        }
        if (resultSet == null) {
            return;
        }
        try{
            int readFlag = resultSet.getInt(COLUMN_READ_FLG);
            message.setReadFlag(readFlag);
            String countStr = null;
            if(isInColumn(resultSet, ReadMessageInfoStoreDbHelper.COLUMN_COUNT_NAME)){
                countStr = resultSet.getString(ReadMessageInfoStoreDbHelper.COLUMN_COUNT_NAME);
            }
            message.setReadAllCount(new BigInteger(countStr != null ? countStr : "0"));
            String lastReadUserIdStr = null;
            if(isInColumn(resultSet, ReadMessageInfoStoreDbHelper.COLUMN_LAST_READ_USER_ID_NAME)){
                lastReadUserIdStr = resultSet.getString(ReadMessageInfoStoreDbHelper.COLUMN_LAST_READ_USER_ID_NAME);
            }
            BigInteger lastReadUserId = new BigInteger(lastReadUserIdStr != null ? lastReadUserIdStr : "0");

            Timestamp lastReadDate = null;
            if(isInColumn(resultSet, ReadMessageInfoStoreDbHelper.COLUMN_LAST_READ_DATE_NAME)){
                lastReadDate = resultSet
                    .getTimestamp(ReadMessageInfoStoreDbHelper.COLUMN_LAST_READ_DATE_NAME);
            }
            if (lastReadUserId == null || lastReadDate == null) {
                return;
            }
            MessageExistingReaderInfo messageExistingReaderInfo = new MessageExistingReaderInfo();
            messageExistingReaderInfo.setItemId(message.getItemId());
            messageExistingReaderInfo.setTemporaryUserId(lastReadUserId);
            messageExistingReaderInfo.setDate(lastReadDate);
            List<MessageExistingReaderInfo> readItem = new ArrayList<MessageExistingReaderInfo>();
            readItem.add(messageExistingReaderInfo);
            message.setReadItem(readItem);
        } catch (SQLException e) {
            Log.error("setReadInfo() : ", e);
            return;
        } catch (Exception e) {
            Log.error("setReadInfo() : ", e);
            return;
        }
    }

    public final static int copyThreadTitleToLogTable(String threadRootId) {
        Log.debug("do func MessageStoreDbHelper.copyThreadTitleToLogTable(...");
        Hashtable _resultData =  getThreadTitleData(threadRootId);
        if(_resultData == null){
            Log.error("MessageStoreDbHelper.copyThreadTitleToLogTable old data read error from db.");
            return 2;
        }else if(_resultData.isEmpty()){
            Log.error("MessageStoreDbHelper.copyThreadTitleToLogTable threadRootId data not exists.");
            return 1;
        }
        if(setThreadTitleLog((String)_resultData.get(COLUMN_THREAD_TITLE_NAME),
                             (String)_resultData.get(COLUMN_THREAD_ROOT_ID_NAME),
                             (String)_resultData.get(COLUMN_ROOM_ID_NAME),
                             (String)_resultData.get(COLUMN_CREATED_AT_NAME),
                             (String)_resultData.get(COLUMN_CREATED_BY_NAME))){
            return 0;
        }else{
            return 3;
        }
    }

    public final static Hashtable getThreadTitleData(String threadRootId) {
        Log.debug("do func MessageStoreDbHelper.getThreadTitleData(...");
        if (threadRootId == null ||
            threadRootId.indexOf(' ') > -1 ||
            threadRootId.length() < 1 ||
            threadRootId.length() > 139) {
            return null;
        }
        String sql = "SELECT * "
            + " from " + TABLE_THREAD_STORE_NAME
            + " where " + COLUMN_THREAD_ROOT_ID_NAME + "='" + GlobalSNSUtils.escapeSqlData(threadRootId) + "'";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        Hashtable<String, String> resultData = new Hashtable<String, String>();
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    while (resultSet.next()) {
                        String resThreadRootId = resultSet.getString(COLUMN_THREAD_ROOT_ID_NAME);
                        if(resThreadRootId != null){
                            resultData.put(COLUMN_THREAD_ROOT_ID_NAME, resThreadRootId);
                        }
                        String resThreadTitle = resultSet.getString(COLUMN_THREAD_TITLE_NAME);
                        if(resThreadTitle != null){
                            resultData.put(COLUMN_THREAD_TITLE_NAME, resThreadTitle);
                        }
                        String resRoomId = resultSet.getString(COLUMN_ROOM_ID_NAME);
                        if(resRoomId != null){
                            resultData.put(COLUMN_ROOM_ID_NAME, resRoomId);
                        }
                        String resCreatedAt = resultSet.getString(COLUMN_CREATED_AT_NAME);
                        if(resCreatedAt != null){
                            resultData.put(COLUMN_CREATED_AT_NAME, resCreatedAt);
                        }
                        String resCreatedBy = resultSet.getString(COLUMN_CREATED_BY_NAME);
                        if(resCreatedAt != null){
                            resultData.put(COLUMN_CREATED_BY_NAME, resCreatedBy);
                        }

                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to get message data");
                    dbHelper.close();
                    isDbOpend = false;
                    return null;
                }
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return null;
            }
        }
        return resultData;
    }

    public final static boolean setThreadTitleLog(String threadTitle,
                                                  String threadRootId,
                                                  String roomId,
                                                  String createAt,
                                                  String createBy) {
        Log.debug("do func MessageStoreDbHelper.setThreadTitleLog(...");
        if (threadTitle == null ||
            threadTitle.indexOf(' ') > -1 ||
            threadTitle.length() > 1024) {
            return false;
        }
        if (threadRootId == null ||
            threadRootId.indexOf(' ') > -1 ||
            threadRootId.length() < 1 ||
            threadRootId.length() > 139) {
            return false;
        }
        if (roomId == null || roomId.length() == 0 ){
            roomId = "";
        }else if(roomId.indexOf(' ') > -1 ||
                 roomId.length() > 513) {
            return false;
        }
        if (createAt == null ||
            createAt.length() < 1 ||
            createAt.length() > 513) {
            return false;
        }
        if (createBy == null ||
            createBy.indexOf(' ') > -1 ||
            createBy.length() < 1 ||
            createBy.length() > 513) {
            return false;
        }
        String sql = "INSERT INTO " + TABLE_THREAD_STORE_LOG_NAME
            + " (" + COLUMN_THREAD_TITLE_NAME + ", " + COLUMN_THREAD_ROOT_ID_NAME + ", " + COLUMN_ROOM_ID_NAME + ", "+COLUMN_CREATED_AT_NAME+", "+COLUMN_CREATED_BY_NAME+", "+COLUMN_MOVED_AT_NAME+") "
            + " VALUES "
            + " ("
            + " '" + GlobalSNSUtils.escapeSqlData(threadTitle) + "', "
            + " '" + GlobalSNSUtils.escapeSqlData(threadRootId) + "', "
            + " '" + GlobalSNSUtils.escapeSqlData(roomId) + "', "
            + " '" + GlobalSNSUtils.escapeSqlData(createAt) + "', "
            + " '" + GlobalSNSUtils.escapeSqlData(createBy) + "', "
            + " now()"
            + " ) ";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        String dbReplyId = null;
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    int res = dbHelper.executeInsert(sql);
                    if (res == -1) {
                        String errorMessage = String.format("Failed to insert database (%s)", sql);
                        Log.error(errorMessage);
                        dbHelper.close();
                        isDbOpend = false;
                        return false;
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to set thread title.");
                    dbHelper.close();
                    isDbOpend = false;
                    return false;
                }
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return false;
            }
        }
        return true;
    }

    public final static boolean setThreadTitle(String threadTitle,
                                               String threadRootId,
                                               String roomId,
                                               String createBy) {
        Log.debug("do func MessageStoreDbHelper.setThreadTitle(...");
        if (threadTitle == null ||
            threadTitle.indexOf(' ') > -1 ||
            threadTitle.length() > 1024) {
            return false;
        }
        if (threadRootId == null ||
            threadRootId.indexOf(' ') > -1 ||
            threadRootId.length() < 1 ||
            threadRootId.length() > 139) {
            return false;
        }
        if (roomId == null || roomId.length() == 0 ){
            roomId = "";
        }else if(roomId.indexOf(' ') > -1 ||
                 roomId.length() > 513) {
            return false;
        }
        if (createBy == null ||
            createBy.indexOf(' ') > -1 ||
            createBy.length() < 1 ||
            createBy.length() > 513) {
            return false;
        }

        String sql = "INSERT INTO " + TABLE_THREAD_STORE_NAME
            + " ("+COLUMN_THREAD_TITLE_NAME+", " + COLUMN_THREAD_ROOT_ID_NAME + ", " + COLUMN_ROOM_ID_NAME + ", "+ COLUMN_CREATED_AT_NAME +", " + COLUMN_CREATED_BY_NAME + ") "
            + " VALUES "
            + " ("
            + " '" + GlobalSNSUtils.escapeSqlData(threadTitle) + "', "
            + " '" + GlobalSNSUtils.escapeSqlData(threadRootId) + "', "
            + " '" + GlobalSNSUtils.escapeSqlData(roomId) + "', "
            + " now(), "
            + " '" + GlobalSNSUtils.escapeSqlData(createBy) + "' "
            + " ) "
            + " ON CONFLICT (" + COLUMN_THREAD_ROOT_ID_NAME + ") "
            + " DO UPDATE SET "
            + " "+COLUMN_THREAD_TITLE_NAME+" = '" + GlobalSNSUtils.escapeSqlData(threadTitle) + "',"
            + " "+COLUMN_CREATED_AT_NAME+" = now(), "
            + " "+COLUMN_CREATED_BY_NAME+" = '" + GlobalSNSUtils.escapeSqlData(createBy) + "'"
            ;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        String dbReplyId = null;
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    int res = dbHelper.executeInsert(sql);
                    if (res == -1) {
                        String errorMessage = String.format("Failed to insert database (%s)", sql);
                        Log.error(errorMessage);
                        dbHelper.close();
                        isDbOpend = false;
                        return false;
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to set thread title.");
                    dbHelper.close();
                    isDbOpend = false;
                    return false;
                }
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return false;
            }
        }
        return true;
    }

    public final static String getThreadRootIDFromReplyID(String replyid) {
        Log.debug("do func MessageStoreDbHelper.getThreadRootIDFromReplyID(...");
        if (replyid == null || replyid.indexOf(' ') > -1) {
            return null;
        }
        String sql = "SELECT " + COLUMN_THREAD_ROOT_ID_NAME
            + " from " + TABLE_NAME
            + " where " + COLUMN_ITEM_ID_NAME + "='" + GlobalSNSUtils.escapeSqlData(replyid) + "'";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        String dbReplyId = null;
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    while (resultSet.next()) {
                        String resThreadRootId = resultSet.getString(COLUMN_THREAD_ROOT_ID_NAME);
                        if(resThreadRootId != null){
                            dbReplyId = resThreadRootId;
                            break;
                        }
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to get message data");
                    dbHelper.close();
                    isDbOpend = false;
                    return null;
                }
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return null;
            }
        }
        return dbReplyId;
    }

    public final static boolean isThreadMember(int messageType,
                                               String itemId,
                                               String threadRootIdStr,
                                               String JID) {
        Log.debug("do func MessageStoreDbHelper.isThreadMember(...");
        if (itemId == null || itemId.indexOf(' ') > -1) {
            return false;
        }
        if (threadRootIdStr == null || threadRootIdStr.indexOf(' ') > -1) {
            return false;
        }
        if (JID == null || JID.indexOf(' ') > -1) {
            return false;
        }
        String sql = "SELECT count(id) from " + TABLE_NAME
            + " where " + COLUMN_ITEM_ID_NAME
            +                "='" + GlobalSNSUtils.escapeSqlData(itemId) + "'"
            + "  and " + COLUMN_THREAD_ROOT_ID_NAME
            +                 "='" + GlobalSNSUtils.escapeSqlData(threadRootIdStr) + "'"
            + "  and " + COLUMN_MESSAGE_TYEP_NAME
            +                 "=" + messageType
            + "  and " + COLUMN_MESSAGE_FROM_NAME
            +                 "='" + GlobalSNSUtils.escapeSqlData(JID) + "'" ;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        boolean isMember = false;
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    while (resultSet.next()) {
                        if(resultSet.getInt("count") > 0){
                            isMember = true;
                            break;
                        }
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to get message data");
                    dbHelper.close();
                    isDbOpend = false;
                    return false;
                }
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return false;
            }
        }
        return isMember;
    }

    public final static ArrayList getThreadTitleList(int messageType,
                                                     String roomId,
                                                     String msgTo,
                                                     String fromJID,
                                                     boolean withoutfeedAtAll) {
        ArrayList threadTitleListArray = new ArrayList<Hashtable>();
        Log.debug("do func MessageStoreDbHelper.getThreadTitleList(...");

        String sql = null;
        switch(messageType){
        case 1:
            sql = "SELECT t.id, count, p.msgtype, p.thread_root_id, t.thread_title, (CASE WHEN p.p_edited_at > t.created_at THEN p.p_edited_at ELSE t.created_at END) AS edited_at"
                + " ,'' AS room_name"
                + " FROM "
                + "   (SELECT count(id), msgtype, max(CASE WHEN updated_at IS NULL THEN created_at ELSE updated_at END) as p_edited_at, thread_root_id"
                + "      from publicmessage_store"
                + "      where"
                + "          delete_flag != 2"
                + "         AND msgtype =" + messageType
                + "      group by thread_root_id, msgtype) as p,"
                + "   thread_store as t"
                + " where"
                + "   t.thread_title != ''"
                + "   AND t.thread_root_id = p.thread_root_id "
                + " ORDER BY edited_at DESC";
            break;
        case 2:
            if (msgTo == null||
                (
                 msgTo.indexOf(' ') > -1 ||
                 msgTo.length() < 1 ||
                 msgTo.length() > 139
                 )) {
                return null;
            }
            if (fromJID == null||
                (
                 fromJID.indexOf(' ') > -1 ||
                 fromJID.length() < 1 ||
                 fromJID.length() > 139
                 )) {
                return null;
            }
            sql = "SELECT t.id, count, p.msgtype, p.thread_root_id, t.thread_title, (CASE WHEN p.p_edited_at > t.created_at THEN p.p_edited_at ELSE t.created_at END) AS  edited_at"
                + " ,'' AS room_name"
                + " FROM "
                + "   (SELECT count(id), msgtype, max(CASE WHEN updated_at IS NULL THEN created_at ELSE updated_at END) as p_edited_at, thread_root_id"
                + "      from publicmessage_store"
                + "      where"
                + "         delete_flag != 2"
                + "         AND ("
                + "               ("
                + "                      msgto ='" + GlobalSNSUtils.escapeSqlData(msgTo) +"'"
                + "                  AND msgfrom ='" + GlobalSNSUtils.escapeSqlData(fromJID) +"'"
                + "               ) OR ("
                + "                      msgfrom ='" + GlobalSNSUtils.escapeSqlData(msgTo) +"'"
                + "                  AND msgto ='" + GlobalSNSUtils.escapeSqlData(fromJID) +"'"
                + "               )"
                + "         )"
                + "         AND msgtype =" + messageType
                + "      group by thread_root_id, msgtype) as p,"
                + "   thread_store as t"
                + " where"
                + "   t.thread_title != ''"
                + "   AND t.thread_root_id = p.thread_root_id "
                + " ORDER BY edited_at DESC";
            break;
        case 3:
        case 5:
            if (roomId == null ||
                (
                 roomId.indexOf(' ') > -1 ||
                 roomId.length() < 1 ||
                 roomId.length() > 139
                 )) {
                return null;
            }
            sql = "SELECT t.id, count, p.msgtype, p.thread_root_id, t.thread_title, (CASE WHEN p.p_edited_at > t.created_at THEN p.p_edited_at ELSE t.created_at END) AS edited_at"
                + " ,'' AS room_name"
                + " FROM "
                + "   (SELECT msgto, count(id), msgtype, max(CASE WHEN updated_at IS NULL THEN created_at ELSE updated_at END) as p_edited_at, thread_root_id"
                + "      from publicmessage_store"
                + "      where"
                + "         delete_flag != 2"
                + "         AND msgto ='" + GlobalSNSUtils.escapeSqlData(roomId) +"'"
                + "         AND msgtype =" + messageType
                + "      group by thread_root_id, msgtype, msgto) as p,"
                + "   thread_store as t"
                + " where"
                + "   t.thread_title != ''"
                + "   AND t.thread_root_id = p.thread_root_id "
                + " ORDER BY edited_at DESC";
            break;
        case 11:
            if (msgTo == null||
                (
                 msgTo.indexOf(' ') > -1 ||
                 msgTo.length() < 1 ||
                 msgTo.length() > 139
                 )) {
                return null;
            }
            if (fromJID == null||
                (
                 fromJID.indexOf(' ') > -1 ||
                 fromJID.length() < 1 ||
                 fromJID.length() > 139
                 )) {
                return null;
            }
            sql = "SELECT t.id, count, p.msgtype, p.thread_root_id, t.thread_title, (CASE WHEN p.p_edited_at > t.created_at THEN p.p_edited_at ELSE t.created_at END) AS  edited_at"
                + " , CASE WHEN p.msgtype = 11"
                + "     THEN (SELECT column_name FROM murmur_store WHERE own_jid=p.msgto)"
                + "     ELSE '' END AS room_name"
                + " FROM "
                + "   (SELECT count(id), msgto,  msgtype, max(CASE WHEN updated_at IS NULL THEN created_at ELSE updated_at END) as p_edited_at, thread_root_id"
                + "      from publicmessage_store"
                + "      where"
                + "         delete_flag != 2"
                + "         AND msgto ='" + GlobalSNSUtils.escapeSqlData(msgTo) +"'"
                + "         AND msgtype =" + messageType
                + "      group by thread_root_id, msgto, msgtype) as p,"
                + "   thread_store as t"
                + " where"
                + "   t.thread_title != ''"
                + "   AND t.thread_root_id = p.thread_root_id "
                + " ORDER BY edited_at DESC";
            break;
        case 99:
            String uid = fromJID.substring(0,(fromJID.indexOf("@") - 4));
            String feedSql = "";
            if(!withoutfeedAtAll){
                feedSql
                    = "         (msgtype=1 AND"
                    + "             ("
                    + "               entry ~ E'^.*>[^<]*%40" + uid + ".*$'"
                    + "                OR"
                    + "               entry ~ E'^.*>[^<]*%40all.*$'"
                    + "             ))"
                    + "          OR";
            }
            sql = "SELECT t.id, count, p.msgtype, p.thread_root_id, t.thread_title, (CASE WHEN p.p_edited_at > t.created_at THEN p.p_edited_at ELSE t.created_at END) AS edited_at"
                + ",CASE"
                + " WHEN"
                + "  p.msgtype = 1"
                + " THEN"
                + "  'feed'"
                + " WHEN"
                + "  p.msgtype = 2"
                + " THEN"
                + "  (select uup.nickname from user_profile as uup, publicmessage_store as pps where "
                + "     pps.item_id=p.thread_root_id"
                + "     AND "
                + "     ("
                + "       (pps.msgto != '" + GlobalSNSUtils.escapeSqlData(fromJID) + "' AND uup.jid=pps.msgto)"
                + "       OR "
                + "       (pps.msgfrom != '" + GlobalSNSUtils.escapeSqlData(fromJID) + "' AND uup.jid=pps.msgfrom)"
                + "     )"
                + "    limit 1)"
                + " WHEN"
                + "  p.msgtype = 3"
                + " THEN"
                + "  (select room_name from chatroom_store where room_id=p.msgto limit 1)"
                + " WHEN"
                + "  p.msgtype = 5"
                + " THEN"
                + "  (select room_name from community_store where room_id=p.msgto limit 1)"
                + " WHEN"
                + "  p.msgtype = 11"
                + " THEN"
                + "    (CASE WHEN EXISTS(select column_name from murmur_store where own_jid=p.msgto limit 1) THEN (select column_name from murmur_store where own_jid=p.msgto limit 1) ELSE '' END)"
                + " ELSE"
                + "  ''"
                + " END AS room_name"
                + " FROM "
                + "   (SELECT msgto, count(id), msgtype, max(CASE WHEN updated_at IS NULL THEN created_at ELSE updated_at END) as p_edited_at, thread_root_id"
                + "      from publicmessage_store"
                + "      where"
                + "         delete_flag != 2"
                + "        AND"
                + "        ("
                + feedSql
                + "            (msgtype=2 AND (msgfrom ='"+GlobalSNSUtils.escapeSqlData(fromJID)+"' OR msgto ='"+GlobalSNSUtils.escapeSqlData(fromJID)+"')"
                + "            )"
                + "          OR"
                + "            (msgtype=3 AND "
                + "              msgto IN ("
                + "                SELECT room_id FROM chatroom_member_store WHERE jid='"+GlobalSNSUtils.escapeSqlData(fromJID)+"' AND state=1"
                + "              )"
                + "            )"
                + "          OR"
                + "            (msgtype=5 AND "
                + "              msgto IN ("
                + "                SELECT room_id FROM community_member_store WHERE jid='"+GlobalSNSUtils.escapeSqlData(fromJID)+"' AND state=1"
                + "              )"
                + "            )"
                + "          OR"
                + "            (msgtype=11 AND "
                + "              ("
                + "                msgto='"+GlobalSNSUtils.escapeSqlData(fromJID)+"' OR "
                + "                msgto IN (SELECT followee FROM user_follow_store WHERE follower='"+GlobalSNSUtils.escapeSqlData(fromJID)+"') "
                + "              )"
                + "            )"
                + "        )"
                + "      group by thread_root_id, msgtype, msgto) as p,"
                + "   thread_store as t"
                + " where"
                + "   t.thread_title != ''"
                + "   AND t.thread_root_id = p.thread_root_id "
                + " ORDER BY edited_at DESC";
            break;
        default:
            return null;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    Log.debug("SQL MessageStoreDbHelper.getThreadTitleList sql : " + sql);
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    while (resultSet.next()) {
                        Hashtable<String, String> resultData = new Hashtable<String, String>();
                        String resId = resultSet.getString("id");
                        if(resId != null){
                            resultData.put("id", resId);
                        }
                        String resCount = resultSet.getString("count");
                        if(resCount != null){
                            resultData.put("count", resCount);
                        }
                        String resThreadRootId = resultSet.getString(COLUMN_THREAD_ROOT_ID_NAME);
                        if(resThreadRootId != null){
                            resultData.put(COLUMN_THREAD_ROOT_ID_NAME, resThreadRootId);
                        }
                        String resThreadTitle = resultSet.getString(COLUMN_THREAD_TITLE_NAME);
                        if(resThreadTitle != null){
                            resultData.put(COLUMN_THREAD_TITLE_NAME, resThreadTitle);
                        }
                        String resEditedAt = resultSet.getString("edited_at");
                        if(resEditedAt != null){
                            resultData.put("edited_at", resEditedAt);
                        }
                        String resRoomName = resultSet.getString("room_name");
                        if(resRoomName != null){
                            resultData.put("room_name", resRoomName);
                        }
                        String resMsgTypeName = resultSet.getString("msgtype");
                        if(resMsgTypeName != null){
                            resultData.put("msgtype", resMsgTypeName);
                        }
                        threadTitleListArray.add(resultData);
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to get message data");
                    dbHelper.close();
                    isDbOpend = false;
                    return null;
                }
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return null;
            }
        }
        return threadTitleListArray;
    }

    public final static QuotationMessage getQuotationMessageData(BigInteger id) {
        Log.debug("do func MessageStoreDbHelper.getQuotationMessageData(...");
        if (id == null ||
            id.compareTo(new BigInteger("0")) < 0) {
            return null;
        }
        String sql = "SELECT * "
            + " from " + TABLE_QUOTATION_MESSAGE_STORE_NAME
            + " where id=" + id + "";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        QuotationMessage resultData = new QuotationMessage();
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    while (resultSet.next()) {
                        BigDecimal resQuotationId = resultSet.getBigDecimal("id");
                        if(resQuotationId != null){
                            resultData.setId(resQuotationId.toBigInteger());
                        }
                        String resQuotationItemId = resultSet.getString("quotation_item_id");
                        if(resQuotationItemId != null){
                            resultData.setQuotationItemId(resQuotationItemId);
                        }
                        int resPrivateFlag = resultSet.getInt("private_flag");
                        resultData.setPrivateFlag(resPrivateFlag);

                        String resEntry = resultSet.getString("entry");
                        if(resEntry != null){
                            resultData.setEntry(resEntry);
                        }
                        Timestamp resCreatedAt = resultSet.getTimestamp("created_at");
                        if(resCreatedAt != null){
                            resultData.setCreatedAt(resCreatedAt);
                        }
                        Timestamp resUpdatedAt = resultSet.getTimestamp("updated_at");
                        if(resUpdatedAt != null){
                            resultData.setUpdatedAt(resUpdatedAt);
                        }

                        int resMsgType = resultSet.getInt("msgtype");
                        resultData.setMsgType(resMsgType);

                        String resMsgFrom = resultSet.getString("msgfrom");
                        if(resMsgFrom != null){
                            resultData.setMsgFrom(resMsgFrom);
                        }

                        String resMsgTo = resultSet.getString("msgto");
                        if(resMsgTo != null){
                            resultData.setMsgTo(resMsgTo);
                        }

                        String resNickName = resultSet.getString("nickname");
                        if(resNickName != null){
                            resultData.setNickName(resNickName);
                        }

                        String resPhotoType = resultSet.getString("photo_type");
                        if(resPhotoType != null){
                            resultData.setPhotoType(resPhotoType);
                        }

                        String resPhotoData = resultSet.getString("photo_data");
                        if(resPhotoData != null){
                            resultData.setPhotoData(resPhotoData);
                        }

                        String resName = resultSet.getString("user_name");
                        if(resName != null){
                            resultData.setUserName(resName);
                        }

                        String resAffiliation = resultSet.getString("affiliation");
                        if(resAffiliation != null){
                            resultData.setAffiliation(resAffiliation);
                        }
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to get message data");
                    dbHelper.close();
                    isDbOpend = false;
                    return null;
                }
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return null;
            }
        }
        return resultData;
    }

    public final static BigInteger setQuotationData(String quotationItemId) {
        Log.debug("do func MessageStoreDbHelper.setQuotationData(...");
        if (quotationItemId == null ||
            quotationItemId.indexOf(' ') > -1 ||
            quotationItemId.length() < 1 ||
            quotationItemId.length() > 139) {
            return new BigInteger("-1");
        }

        Message quota_mess = getOneMessageByItemIdWithoutReadInfo(quotationItemId);
        if(quota_mess == null){
            return new BigInteger("-2");
        }else if(quota_mess.getQuotationMessageId() != null){
            return quota_mess.getQuotationMessageId();
        }
        Profile msgfromProf = new Profile();
        boolean isPublicMessage = false;
        if((quota_mess.getMsgType() == 1 || quota_mess.getMsgType() == 11)&&
           quota_mess.getMsgTo() != null){
                isPublicMessage = true;
        }else if(quota_mess.getMsgType() == 3 &&
                 quota_mess.getMsgTo() != null){
            ChatRoomInfo  roomInfo = ChatRoomStoreDbHelper
                .getChatRoomInfoByRoomId(quota_mess.getMsgTo());
            if(roomInfo.getPrivacyType() == 0){
                isPublicMessage = true;
            }
        }else if(quota_mess.getMsgType() == 5 &&
                 quota_mess.getMsgTo() != null){
            CommunityInfo roomInfo = CommunityStoreDbHelper
                .getCommunityInfoByRoomId(quota_mess.getMsgTo());
            if(roomInfo.getPrivacyType() == 0){
                isPublicMessage = true;
            }
        }
        msgfromProf = UserProfileDbHelper.getUserProfileDataWithExtra(quota_mess.getMsgFrom());
        if(msgfromProf == null){
            Log.error("has not owner profile of quatation message.");
            return new BigInteger("-3");
        }
        int privateFlag = 1;
        if(isPublicMessage){
            privateFlag = 0;
        }
        Timestamp messUpdatedAt = quota_mess.getUpdatedAt();
        String messUpdatedAtSql = "NULL";
        if(messUpdatedAt != null){
            messUpdatedAtSql = "'" + GlobalSNSUtils.escapeSqlData
                (quota_mess.getUpdatedAt().toString()) + "'";
        }
        String sql = "INSERT INTO " + TABLE_QUOTATION_MESSAGE_STORE_NAME
            + "("
            + " quotation_item_id, "
            + " private_flag, "
            + " entry,"
            + " created_at,"
            + " updated_at,"
            + " msgtype,"
            + " msgfrom,"
            + " msgto,"
            + " nickname,"
            + " photo_type,"
            + " photo_data,"
            + " user_name,"
            + " affiliation"
            + ") VALUES ("
            + "'" + GlobalSNSUtils.escapeSqlData(quotationItemId) + "',"
            + ""  + privateFlag + ","
            + "'" + GlobalSNSUtils.escapeSqlData(quota_mess.getEntry()) + "',"
            + "'" + quota_mess.getCreatedAt() + "',"
            + ""  + messUpdatedAtSql  + ","
            + ""  + quota_mess.getMsgType() + ","
            + "'" + quota_mess.getMsgFrom() + "',"
            + "'" + quota_mess.getMsgTo() + "',"
            + "'" + GlobalSNSUtils.escapeSqlData(msgfromProf.getNickName()) + "',"
            + "'" + GlobalSNSUtils.escapeSqlData(msgfromProf.getPhotoType()) + "',"
            + "'" + GlobalSNSUtils.escapeSqlData(msgfromProf.getPhotoData()) + "',"
            + "'" + GlobalSNSUtils.escapeSqlData(msgfromProf.getUserName()) + "',"
            + "'" + GlobalSNSUtils.escapeSqlData(msgfromProf.getAffiliation()) + "'"
            + ")"
            + " RETURNING id";

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        BigInteger quotationMessageId = new BigInteger("-4");
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    while (resultSet.next()) {
                        quotationMessageId = resultSet.getBigDecimal("id").toBigInteger();
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to set quotation message id.");
                    dbHelper.close();
                    isDbOpend = false;
                    return quotationMessageId;
                }
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return quotationMessageId;
            }
        }
        return quotationMessageId;
    }

    public final static boolean insertMessageToDb(Message message) {
        Log.debug("do func MessageStoreDbHelper.insertMessageToDb(...");
        if (message == null) {
            return false;
        }

        String entry = message.getEntry();
        String sqlEntry = "''";
        if (entry != null) {
            sqlEntry = "'" + GlobalSNSUtils.escapeSqlData(entry) + "'";
        }
        String replyId = message.getReplyId();
        String sqlReplyId = "''";
        if (replyId != null) {
            sqlReplyId = "'" + GlobalSNSUtils.escapeSqlData(replyId)
                + "'";
        }
        String replyTo = message.getReplyTo();
        String sqlReplyTo = "''";
        if (replyTo != null) {
            sqlReplyTo = "'" + GlobalSNSUtils.escapeSqlData(replyTo)
                + "'";
        }

        String threadRootId = "";
        if(message.getMsgType() == 1 ||
           message.getMsgType() == 2 ||
           message.getMsgType() == 3 ||
           message.getMsgType() == 5 ||
           message.getMsgType() == 11){
            if(sqlReplyId.length() <= 2){
                threadRootId = message.getItemId();
            }else{
                String parentThreadRoomId = getThreadRootIDFromReplyID(message.getReplyId());
                if(parentThreadRoomId != null){
                    threadRootId = parentThreadRoomId;
                }
            }
        }
        String sqlTreadRootId = "'" + GlobalSNSUtils.escapeSqlData(threadRootId) + "'";

        String startDate = message.getStartDateStr();
        String sqlStartDate = "NULL";
        if (!startDate.equals("")) {
            sqlStartDate = "'" + startDate + "'";
        }
        String dueDate = message.getDueDateStr();
        String sqlDueDate = "NULL";
        if (!dueDate.equals("")) {
            sqlDueDate = "'" + dueDate + "'";
        }
        String owner = message.getOwner();
        String sqlOwner = "''";
        if (owner != null) {
            sqlOwner = "'" + GlobalSNSUtils.escapeSqlData(owner) + "'";
        }

        String threadTitle = message.getThreadTitle();
        if((message.getMsgType() == 1 ||
            message.getMsgType() == 2 ||
            message.getMsgType() == 3 ||
            message.getMsgType() == 5 ||
            message.getMsgType() == 11) &&
           sqlReplyId.length() <= 2 &&
           threadTitle != null &&
           threadRootId != null &&
           threadRootId.length() > 0){
            if(! setThreadTitle(threadTitle,
                                threadRootId,
                                (((
                                   message.getMsgType() == 3 ||
                                   message.getMsgType() == 5
                                   ) && message.getMsgTo() != null
                                  )? message.getMsgTo() : ""),
                                message.getMsgFrom())){
                return false;
            }
        }

        String quotationItemId = message.getQuotationItemId();
        BigInteger quotationMessageId = new BigInteger("-1");
        if (quotationItemId != null) {
            quotationMessageId = setQuotationData(quotationItemId);
        }
        String quotationMessageIdStr = "NULL";
        if(quotationMessageId.compareTo(new BigInteger("0")) > 0){
            quotationMessageIdStr = quotationMessageId.toString();
        }

        String group = message.getGroup();
        String sqlGroup = "''";
        if (group != null) {
            sqlGroup = "'" + GlobalSNSUtils.escapeSqlData(group) + "'";
        }
        String completeDate = message.getCompleteDateStr();
        String sqlCompleteDate = "NULL";
        if (!completeDate.equals("")) {
            sqlCompleteDate = "'" + completeDate + "'";
        }
        String updateAt = message.getUpdatedAtStr();
        String sqlUpdateAt = "NULL";
        if (!updateAt.equals("")) {
            sqlUpdateAt = "'" + updateAt + "'";
        }
        String parentItemId = message.getParentItemId();
        String sqlParentItemId = "''";
        if (parentItemId != null) {
            sqlParentItemId = "'"
                + GlobalSNSUtils.escapeSqlData(parentItemId) + "'";
        }

        String columns = COLUMN_ITEM_ID_NAME + ", "
            + COLUMN_MESSAGE_TYEP_NAME + ", "
            + COLUMN_MESSAGE_FROM_NAME + ", "
            + COLUMN_MESSAGE_TO_NAME + ", " + COLUMN_ENTRY_NAME
            + ", " + COLUMN_BODY_TYPE_NAME
            + ", " + COLUMN_PUBLISH_NODE_NAME_NAME + ", "
            + COLUMN_CREATED_AT_NAME + ", " + COLUMN_REPLY_ID_NAME
            + ", " + COLUMN_REPLY_TO_NAME + ", "
            + COLUMN_THREAD_ROOT_ID_NAME + ", "
            + COLUMN_START_DATE_NAME + ", " + COLUMN_DUE_DATE_NAME
            + ", " + COLUMN_OWNER_NAME + ", " + COLUMN_GROUP_NAME
            + ", " + COLUMN_STATUS_NAME + ", "
            + COLUMN_COMPLETE_DATE_NAME + ", "
            + COLUMN_PRIORITY_NAME + ", " + COLUMN_UPDATED_AT_NAME
            + ", " + COLUMN_UPDATED_BY_NAME + ", "
            + COLUMN_CLIENT_NAME + ", " + COLUMN_SHOW_TYPE_NAME
            + ", " + COLUMN_PARENT_ITEM_ID_NAME + ", "
            + COLUMN_DELETE_FLAG_NAME + ", "
            + COLUMN_MAIL_MESSAGE_ID_NAME + ", "
            + COLUMN_MAIL_IN_REPLY_TO_NAME + ", "
            + COLUMN_QUOTATION_MESSAGE_ID_NAME;
        String values = "'"
            + GlobalSNSUtils.escapeSqlData(message.getItemId())
            + "', "
            + String.valueOf(message.getMsgType())
            + ", '"
            + GlobalSNSUtils.escapeSqlData(message.getMsgFrom())
            + "', '"
            + GlobalSNSUtils.escapeSqlData(message.getMsgTo())
            + "', "
            + sqlEntry
            + ", "
            + message.getBodyType()
            + ", '"
            + GlobalSNSUtils.escapeSqlData(message
                                           .getPublishNodename())
            + "', '"
            + GlobalSNSUtils.escapeSqlData(message
                                           .getCreatedAtStr())
            + "' , "
            + sqlReplyId
            + ", "
            + sqlReplyTo
            + ", "
            + sqlTreadRootId
            + ", "
            + sqlStartDate
            + ", "
            + sqlDueDate
            + ", "
            + sqlOwner
            + ", "
            + sqlGroup
            + ", "
            + String.valueOf(message.getStatus())
            + ", "
            + sqlCompleteDate
            + ", "
            + String.valueOf(message.getPriority())
            + ", "
            + sqlUpdateAt
            + ", '"
            + GlobalSNSUtils.escapeSqlData(message.getUpdatedBy())
            + "', '"
            + GlobalSNSUtils.escapeSqlData(message.getClient())
            + "', "
            + String.valueOf(message.getShowType())
            + ", "
            + sqlParentItemId
            + ", "
            + String.valueOf(message.getDeleteFlag())
            + ", '"
            + GlobalSNSUtils.escapeSqlData(message
                                           .getMailMessageId())
            + "', '"
            + GlobalSNSUtils.escapeSqlData(message
                                           .getMailInReplyTo()) + "',"
            + " " + quotationMessageIdStr +"";
        String sql = "INSERT INTO " + TABLE_NAME + " (" + columns
            + ") VALUES (" + values + ");";

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                isDbOpend = true;

                if (dbHelper.executeInsert(sql) == -1) {
                    String errorMessage = String.format(
                             "Failed to insert database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    isDbOpend = false;
                    return false;
                }
                dbHelper.close();
                isDbOpend = false;
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return false;
            }
        }
        return true;
    }

    public final static boolean updateMessageBodyToDb(int messageType,
                                                      String itemId,
                                                      String body,
                                                      String fromJID,
                                                      String roomId) {
        Log.debug("do func MessageStoreDbHelper.updateMessageBodyToDb(...");
        if (messageType != 1 &&
            messageType != 2 &&
            messageType != 3 &&
            messageType != 5 &&
            messageType != 11 ) {
            Log.error("MessageStoreDbHelper.updateMessageBodyToDb messageType data invalid.");
            return false;
        }
        if (itemId == null ||
            itemId.length() < 1 ||
            itemId.length() > 139) {
            Log.error("MessageStoreDbHelper.updateMessageBodyToDb itemId data invalid.");
            return false;
        }
        if (body == null ||
            body.length() < 1) {
            Log.error("MessageStoreDbHelper.updateMessageBodyToDb body data invalid.");
            return false;
        }
        if (fromJID == null ||
            fromJID.length() < 1 ||
            fromJID.length() > 513) {
            Log.error("MessageStoreDbHelper.updateMessageBodyToDb fromJID data invalid.");
            return false;
        }
        if ((messageType == 3 || messageType == 5 ) &&
            (roomId == null || roomId.length() < 1 || roomId.length() > 272)) {
            Log.debug("MessageStoreDbHelper.updateMessageBodyToDb roomId data invalid.");
            return false;
        }else if(roomId == null){
            roomId = "";
        }

        Hashtable lastEntry = getMessageBodyDataByOwner(itemId, fromJID);
        if(lastEntry == null ||
           lastEntry.isEmpty()){
            return false;
        }

        if(! setMessageBodyDataLog((String)lastEntry.get(COLUMN_ITEM_ID_NAME),
                                   (String)lastEntry.get(COLUMN_ENTRY_NAME),
                                   (String)lastEntry.get(COLUMN_CREATED_AT_NAME),
                                   (String)lastEntry.get(COLUMN_MESSAGE_FROM_NAME),
                                   fromJID)){
            return false;
        }

        String sql = "UPDATE " + TABLE_NAME + " SET "
            + " entry = '" + GlobalSNSUtils.escapeSqlData(body) + "', "
            + " updated_at = now(), "
            + " updated_by = '" + GlobalSNSUtils.escapeSqlData(fromJID) + "' "
            + " WHERE "
            + " msgfrom = '" + GlobalSNSUtils.escapeSqlData(fromJID) + "' AND "
            + " msgtype = " + messageType + " AND "
            + " item_id = '" + GlobalSNSUtils.escapeSqlData(itemId) + "';";

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                isDbOpend = true;

                if (dbHelper.executeInsert(sql) == -1) {
                    String errorMessage = String.format(
                             "Failed to insert database (%s)", sql);
                    Log.error(errorMessage);
                    dbHelper.close();
                    isDbOpend = false;
                    return false;
                }
                dbHelper.close();
                isDbOpend = false;
            } catch (Exception e) {
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return false;
            }
        }

        return true;
    }

    public final static Hashtable getMessageBodyDataByOwner(String itemId, String fromJID) {
        Log.debug("do func MessageStoreDbHelper.getMessageBodyData(...");
        if (fromJID == null ||
            fromJID.length() < 1 ||
            fromJID.length() > 513) {
            Log.error("MessageStoreDbHelper.getMessageBodyData fromJID data invalid.");
            return null;
        }
        if (itemId == null ||
            itemId.indexOf(' ') > -1 ||
            itemId.length() < 1 ||
            itemId.length() > 139) {
            Log.debug("MessageStoreDbHelper.getMessageBodyData itemId invalid");
            return null;
        }
        String sql = "SELECT * "
            + " FROM " + TABLE_NAME
            + " WHERE "
            + " " + COLUMN_MESSAGE_FROM_NAME + "='" + GlobalSNSUtils.escapeSqlData(fromJID) + "' AND "
            + " " + COLUMN_ITEM_ID_NAME + "='" + GlobalSNSUtils.escapeSqlData(itemId) + "'";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        Hashtable<String, String> resultData = new Hashtable<String, String>();
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    ResultSet resultSet = dbHelper.executeQuery(sql);
                    while (resultSet.next()) {
                        resultData.put(COLUMN_ITEM_ID_NAME, resultSet.getString(COLUMN_ITEM_ID_NAME));

                        String resEntry = resultSet.getString(COLUMN_ENTRY_NAME);
                        if(resEntry != null){
                            resultData.put(COLUMN_ENTRY_NAME, resEntry);
                        }

                        String resCreatedAt = resultSet.getString(COLUMN_CREATED_AT_NAME);
                        if(resCreatedAt != null){
                            resultData.put(COLUMN_CREATED_AT_NAME, resCreatedAt);
                        }

                        String resMsgFrom = resultSet.getString(COLUMN_MESSAGE_FROM_NAME);
                        if(resMsgFrom != null){
                            resultData.put(COLUMN_MESSAGE_FROM_NAME, resMsgFrom);
                        }

                        String resUpdatedAt = resultSet.getString(COLUMN_UPDATED_AT_NAME);
                        if(resUpdatedAt != null){
                            resultData.put(COLUMN_UPDATED_AT_NAME, resUpdatedAt);
                        }

                        String resUpdatedBy = resultSet.getString(COLUMN_UPDATED_BY_NAME);
                        if(resUpdatedBy != null){
                            resultData.put(COLUMN_UPDATED_BY_NAME, resUpdatedBy);
                        }
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to get message data " + e);
                    dbHelper.close();
                    isDbOpend = false;
                    return null;
                }
            } catch (Exception e) {
                Log.error("Failed db error " + e);
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return null;
            }
        }
        return resultData;
    }

    public final static boolean setMessageBodyDataLog(String itemId,
                                                      String entry,
                                                      String createAt,
                                                      String createBy,
                                                      String movedBy) {
        Log.debug("do func MessageStoreDbHelper.setMessageBodyDataLog(...");
        if (itemId == null ||
            itemId.indexOf(' ') > -1 ||
            itemId.length() < 1 ||
            itemId.length() > 139) {
            Log.debug("MessageStoreDbHelper.setMessageBodyDataLog itemId invalid");
            return false;
        }
        if (entry == null) {
            Log.debug("MessageStoreDbHelper.setMessageBodyDataLog entry invalid");
            return false;
        }
        if (createAt == null ||
            createAt.length() < 1 ||
            createAt.length() > 513) {
            Log.debug("MessageStoreDbHelper.setMessageBodyDataLog createAt invalid");
            return false;
        }
        if (createBy == null ||
            createBy.indexOf(' ') > -1 ||
            createBy.length() < 1 ||
            createBy.length() > 513) {
            Log.debug("MessageStoreDbHelper.setMessageBodyDataLog createBy invalid");
            return false;
        }
        if (movedBy == null ||
            movedBy.indexOf(' ') > -1 ||
            movedBy.length() < 1 ||
            movedBy.length() > 513) {
            Log.debug("MessageStoreDbHelper.setMessageBodyDataLog movedBy invalid");
            return false;
        }
        String sql = "INSERT INTO " + TABLE_NAME_LOG
            + " ( "
            + COLUMN_ITEM_ID_NAME + ","
            + COLUMN_ENTRY_NAME + ","
            + COLUMN_CREATED_AT_NAME + ","
            + COLUMN_CREATED_BY_NAME + ","
            + COLUMN_MOVED_AT_NAME + ","
            + COLUMN_MOVED_BY_NAME
            + ") VALUES ( "
            + " '" + GlobalSNSUtils.escapeSqlData(itemId)   + "',"
            + " '" + GlobalSNSUtils.escapeSqlData(entry)    + "',"
            + " '" + GlobalSNSUtils.escapeSqlData(createAt) + "',"
            + " '" + GlobalSNSUtils.escapeSqlData(createBy) + "',"
            + " now(),"
            + " '" + GlobalSNSUtils.escapeSqlData(movedBy)  + "'"
            + ")";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        Hashtable<String, String> resultData = new Hashtable<String, String>();
        synchronized (dbHelper) {
            boolean isDbOpend = false;
            try {
                try {
                    if (!dbHelper.open()) {
                        Log.error("Failed to open database");
                        throw new Exception("Failed to open database");
                    }
                    isDbOpend = true;
                    int res = dbHelper.executeInsert(sql);
                    if (res == -1) {
                        String errorMessage = String.format("Failed to insert database (%s)", sql);
                        Log.error(errorMessage);
                        dbHelper.close();
                        isDbOpend = false;
                        return false;
                    }
                    dbHelper.close();
                    isDbOpend = false;
                } catch (SQLException e) {
                    Log.error("Failed to get message data");
                    dbHelper.close();
                    isDbOpend = false;
                    return false;
                }
            } catch (Exception e) {
                Log.error("Failed db error " + e);
                if (isDbOpend) {
                    dbHelper.close();
                    isDbOpend = false;
                }
                return false;
            }
        }
        return true;
    }

    public static List<Message> getMessageDbDataByItemIdsWithoutReadInfo(
            List<String> itemIdList) {
        Log.debug("do func MessageStoreDbHelper.getMessageDbDataByItemIdsWithoutReadInfo(...");
        List<Message> retList = new ArrayList<Message>();

        if (itemIdList == null) {
            Log.error("MessageStoreDbHelper#getMessageDbDataByItemIdsWithoutReadInfo - itemIdList is null");
            return retList;
        }

        String sql = getMessageSelectSqlByItemIdsWithoutReadInfo(itemIdList);
        if (sql == null || sql.equals("")) {
            Log.error("MessageStoreDbHelper#getMessageDbDataByItemIdsWithoutReadInfo - sql is invalid");
            return retList;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        Log.debug("MessageStoreDbHelper.getMessageDbDataByItemIdsWithoutReadInfo in sql : " + sql);
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    Message message = getOneMessageByResultSet(resultSet, false, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    public static List<Message> getMessageDbDataByItemIdsRegardlessDeleteFlagWithoutReadInfo(
            List<String> itemIdList) {
        Log.debug("do func MessageStoreDbHelper.getMessageDbDataByItemIdsRegardlessDeleteFlagWithoutReadInfo(...");
        List<Message> retList = new ArrayList<Message>();

        if (itemIdList == null) {
            Log.error("MessageStoreDbHelper#getMessageDbDataByItemIdsRegardlessDeleteFlag - itemIdList is null");
            return retList;
        }

        String sql = getMessageSelectSqlByItemIdsRegardlessDeleteFlagWithoutReadInfo(itemIdList);
        if (sql == null || sql.equals("")) {
            Log.error("MessageStoreDbHelper#getMessageSelectSqlByItemIdsRegardlessDeleteFlagWithoutReadInfo - sql is invalid");
            return retList;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    Message message = getOneMessageByResultSet(resultSet, false, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private final static String getMessageSelectSqlByItemIdsWithoutReadInfo(
            List<String> itemIdList) {
        Log.debug("do func MessageStoreDbHelper.getMessageSelectSqlByItemIdsWithoutReadInfo(...");
        if (itemIdList == null) {
            return "";
        }
        int count = itemIdList.size();
        if (count <= 0) {
            return "";
        }

        String sql = "SELECT "
            + "p.*"
            + ",CASE"
            + " WHEN"
            + "  pm.room_type = 3"
            + " THEN"
            + "  (select room_name from chatroom_store where room_id=p.MSGTO limit 1)"
            + " WHEN"
            + "  pm.room_type = 5"
            + " THEN"
            + "  (select room_name from community_store where room_id=p.MSGTO limit 1)"
            + " ELSE"
            + "  ''"
            + " END AS room_name"
            + ", CASE"
            + " WHEN"
            + "  pm.ROOM_TYPE = 3"
            + " THEN"
            + "  (select parent_room_id from chatroom_store where room_id=p.MSGTO limit 1)"
            + " ELSE"
            + "  ''"
            + " END AS parent_room_id"
            + ",CASE WHEN p.msgtype = 11"
            + "  THEN (SELECT column_name FROM murmur_store WHERE own_jid=p.msgto)"
            + "     ELSE '' END AS column_name"
            + ",t.thread_title "
            + ",  pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME
            + ", pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_INPUT_TYPE_NAME
            + ", pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_RESULT_VISIBLE_NAME
            + ", pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_GRAPH_TYPE_NAME
            + " FROM " + TABLE_NAME + " AS p"
            + " LEFT JOIN thread_store AS t ON (p.thread_root_id = t.thread_root_id) "
            + " LEFT JOIN "
            + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME + " AS pm ON " + " p." + COLUMN_ITEM_ID_NAME
            + "= pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ITEM_ID_NAME
            + " WHERE ";
        String where = "";
        for (int i = 0; i < count; i++) {
            if (i != 0) {
                where += " OR ";
            }
            where += "(p.item_id='"
                    + GlobalSNSUtils.escapeSqlData(itemIdList.get(i)) + "')";
        }
        where = "(" + where + ") AND ((p." + COLUMN_DELETE_FLAG_NAME + "=0) OR (p."
                + COLUMN_DELETE_FLAG_NAME + "=2))";
        sql += where;

        return sql;
    }

    private static String getMessageSelectSqlByItemIdsRegardlessDeleteFlagWithoutReadInfo(
            List<String> itemIdList) {
        Log.debug("do func MessageStoreDbHelper.getMessageSelectSqlByItemIdsRegardlessDeleteFlagWithoutReadInfo(...");
        if (itemIdList == null) {
            return "";
        }
        int count = itemIdList.size();
        if (count <= 0) {
            return "";
        }

        String sql = "SELECT "
            + "   p.*"
            + ",CASE"
            + " WHEN"
            + "  pm.room_type = 3"
            + " THEN"
            + "  (select room_name from chatroom_store where room_id=p.MSGTO limit 1)"
            + " WHEN"
            + "  pm.room_type = 5"
            + " THEN"
            + "  (select room_name from community_store where room_id=p.MSGTO limit 1)"
            + " ELSE"
            + "  ''"
            + " END AS room_name"
            + ", CASE"
            + " WHEN"
            + "  pm.ROOM_TYPE = 3"
            + " THEN"
            + "  (select parent_room_id from chatroom_store where room_id=p.MSGTO limit 1)"
            + " ELSE"
            + "  ''"
            + " END AS parent_room_id"
            + " , t.thread_title "
            + " , pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME
            + " , pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_INPUT_TYPE_NAME
            + " , pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_RESULT_VISIBLE_NAME
            + " , pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_GRAPH_TYPE_NAME
            + " FROM "
            +     TABLE_NAME + " AS p"
            + "   LEFT JOIN "
            + "     thread_store AS t ON (p.thread_root_id = t.thread_root_id) "
            + "   LEFT JOIN "
            +       PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME + " AS pm"
            + "       ON p." + COLUMN_ITEM_ID_NAME + "= pm." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ITEM_ID_NAME
            +" WHERE ";
        String where = "";
        for (int i = 0; i < count; i++) {
            if (i != 0) {
                where += " OR ";
            }
            where += "(p.item_id='"
                    + GlobalSNSUtils.escapeSqlData(itemIdList.get(i)) + "')";
        }
        sql += where;

        return sql;
    }

    public static List<Message> getMessageDbDataAppendMessageReadInfoByItemIds(
            List<String> itemIdList, String jidForGetReadStatus) {
        Log.debug("do func MessageStoreDbHelper.getMessageDbDataAppendMessageReadInfoByItemIds(...");
        List<Message> retList = new ArrayList<Message>();

        if (itemIdList == null) {
            Log.error("MessageStoreDbHelper#getMessageDbDataAppendMessageReadInfoByItemIds - itemIdList is null");
            return retList;
        }
        if (jidForGetReadStatus == null
                || jidForGetReadStatus.trim().equals("")) {
            Log.error("MessageStoreDbHelper#getMessageDbDataAppendMessageReadInfoByItemIds - jidForGetReadFlag is null");
            return retList;
        }

        String sql = getMessageSelectSqlByItemIdsAppendMessageReadInfo(
                itemIdList, jidForGetReadStatus);
        if (sql == null || sql.equals("")) {
            Log.error("MessageStoreDbHelper#getMessageDbDataByItemIds - sql is invalid");
            return retList;
        }
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
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
                Log.error("Failed to get message data");
            }
            dbHelper.close();
            complementReaderInfo(retList);
        } catch (Exception e) {
        }
        return retList;
    }

    private final static String getMessageSelectSqlByItemIdsAppendMessageReadInfo(
            List<String> itemIdList, String jidForGetReadFlag) {
        Log.debug("do func MessageStoreDbHelper.getMessageSelectSqlByItemIdsAppendMessageReadInfo(...");
        if (itemIdList == null) {
            return "";
        }
        if (jidForGetReadFlag == null || jidForGetReadFlag.trim().equals("")) {
            return "";
        }
        int count = itemIdList.size();
        if (count <= 0) {
            return "";
        }

        String sql = getMessageListSQLAppendReadInfo(jidForGetReadFlag)
                + " WHERE ";
        String where = "";
        for (int i = 0; i < count; i++) {
            if (i != 0) {
                where += " OR ";
            }
            where += "(" + TABLE_NAME + "." + COLUMN_ITEM_ID_NAME + "='"
                    + GlobalSNSUtils.escapeSqlData(itemIdList.get(i)) + "')";
        }
        where = "(" + where + ") AND ((" + COLUMN_DELETE_FLAG_NAME + "="
                + Message.DELETE_FLAG_NON_DELETED + ") OR ("
                + COLUMN_DELETE_FLAG_NAME + "=" + Message.DELETE_FLAG_TRUSH
                + "))";
        sql += where;

        return sql;
    }

    public static List<Message> searchAllMessage(
            MessageFilterCondition filterCondition,
            MessageSortCondition sortCondition, String fromJid) {
        Log.debug("do func MessageStoreDbHelper.searchAllMessage(...");
        String where = filterCondition.toSqlWhereSectionString();
        if (!where.equals("")) {
            where = "((" + where + ") AND ((" + TABLE_NAME + "."
                    + COLUMN_DELETE_FLAG_NAME + "="
                    + Message.DELETE_FLAG_NON_DELETED + ")OR(" + TABLE_NAME
                    + "." + COLUMN_DELETE_FLAG_NAME + "="
                    + Message.DELETE_FLAG_TRUSH + ")))";
        }
        String orderBy = sortCondition.toSqlOrderBySectionString();
        List<Message> retList = null;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }

            ResultSet resultSet;

            String sql = getMessageListSQLAppendReadInfo(fromJid);
            if (where.equals("")) {
                Log.error("where is invalid");
                dbHelper.close();
                throw new Exception("where is invalid");
            }
            sql += " WHERE " + where;

            if (!orderBy.equals("")) {
                sql += " ORDER BY " + orderBy;
            }
            retList = new ArrayList<Message>();

            resultSet = dbHelper.executeQuery(sql);
            try {
                while (resultSet.next()) {
                    Message message = getOneMessageByResultSet(resultSet, true, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to search all Message");
            }

            dbHelper.close();
            complementReaderInfo(retList);
        } catch (Exception e) {
        }
        return retList;
    }

    public static List<Message> searchMessage(int startId, int countNum,
            MessageFilterCondition filterCondition,
            MessageSortCondition sortCondition, String fromJid) {
        Log.debug("do func MessageStoreDbHelper.searchMessage(...");
        String where = filterCondition.toSqlWhereSectionString();
        if (!where.equals("")) {
            where = "((" + where + ") AND ((" + TABLE_NAME + "."
                    + COLUMN_DELETE_FLAG_NAME + "="
                    + Message.DELETE_FLAG_NON_DELETED + ")OR(" + TABLE_NAME
                    + "." + COLUMN_DELETE_FLAG_NAME + "="
                    + Message.DELETE_FLAG_TRUSH + ")))";
        }
        String orderBy = sortCondition.toSqlOrderBySectionString();
        String getRownumSqlString = "";
        final boolean isOrderByMessageID = orderBy.equals(TABLE_NAME + "." + COLUMN_ID_NAME + " DESC");
        if (startId > 0) {
            if (!isOrderByMessageID) {
                if (!where.equals("")) {
                    where = "( " + where + " OR (" + TABLE_NAME + "."
                            + COLUMN_ID_NAME + "=" + String.valueOf(startId) + "))";
                }
                getRownumSqlString = "SELECT * FROM (SELECT *, row_number() OVER () as rownum FROM ( "
                        + "" + "SELECT "
                        + TABLE_NAME
                        + ".*,"
                        + ReadMessageInfoStoreDbHelper.TABLE_NAME
                        + "."
                        + ReadMessageInfoStoreDbHelper.COLUMN_READ_USER_IDS_NAME
                        + ","
                        + ReadMessageInfoStoreDbHelper.TABLE_NAME
                        + "."
                        + ReadMessageInfoStoreDbHelper.COLUMN_LAST_READ_USER_ID_NAME
                        + ","
                        + ReadMessageInfoStoreDbHelper.TABLE_NAME
                        + "."
                        + ReadMessageInfoStoreDbHelper.COLUMN_LAST_READ_DATE_NAME
                        + ","
                        + ReadMessageInfoStoreDbHelper.TABLE_NAME
                        + "."
                        + ReadMessageInfoStoreDbHelper.COLUMN_COUNT_NAME
                        + " FROM "
                        + TABLE_NAME
                        + " LEFT JOIN "
                        + ReadMessageInfoStoreDbHelper.TABLE_NAME
                        + " ON "
                        + "( "
                        + TABLE_NAME
                        + "."
                        + COLUMN_ID_NAME
                        + " = "
                        + ReadMessageInfoStoreDbHelper.TABLE_NAME
                        + "."
                        + ReadMessageInfoStoreDbHelper.COLUMN_ID_NAME + " ) ";
                if (!where.equals("")) {
                    getRownumSqlString += " WHERE " + where;
                }
                if (!orderBy.equals("")) {
                    getRownumSqlString += " ORDER BY " + orderBy;
                }
                getRownumSqlString += ") as dummy_table) as dummy_table2 WHERE "
                        + "dummy_table2." + COLUMN_ID_NAME + "="
                        + String.valueOf(startId);
            } else {
                if (!where.equals("")) {
                    where = "( " + where + " AND (" + TABLE_NAME + "."
                            + COLUMN_ID_NAME + "<" + String.valueOf(startId) + "))";
                }
            }
        }
        int offset = -1;
        List<Message> retList = null;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }

            ResultSet resultSet;
            if (startId > 0) {
                if (!isOrderByMessageID){
                    resultSet = dbHelper.executeQuery(getRownumSqlString);
                    try {
                        if (resultSet.next()) {
                            offset = resultSet.getInt("rownum");
                        }
                    } catch (SQLException e) {
                        Log.error("Failed to get tasklist data1");
                        dbHelper.close();
                        throw new Exception("Failed to select database1");
                    }
                    if (offset < 0) {
                        Log.error("rownum is invalid");
                        dbHelper.close();
                        throw new Exception("rownum is invalid");
                    }
                } else {
                    offset = 0;
                }
            } else {
                offset = 0;
            }
            String sql = getMessageListSQLAppendReadInfo(fromJid);

            if (where.equals("")) {
                Log.error("where is invalid");
                dbHelper.close();
                throw new Exception("where is invalid");
            }
            sql += " WHERE " + where;

            if (!orderBy.equals("")) {
                sql += " ORDER BY " + orderBy;
            }
            sql += " LIMIT " + String.valueOf(countNum);
            if (!isOrderByMessageID){
                sql += " OFFSET " + String.valueOf(offset);
            }
            retList = new ArrayList<Message>();
            if (isOrderByMessageID){
                dbHelper.execute("SET ENABLE_SEQSCAN TO OFF");
            }
            resultSet = dbHelper.executeQuery(sql);
            if (isOrderByMessageID){
                dbHelper.execute("SET ENABLE_SEQSCAN TO DEFAULT");
            }
            try {
                while (resultSet.next()) {
                    Message message = getOneMessageByResultSet(resultSet, true, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get tasklist data2");
            }
            dbHelper.close();
            complementReaderInfo(retList);
        } catch (Exception e) {
        }
        return retList;
    }

    public static int getMessageCount(MessageFilterCondition filterCondition) {
        Log.debug("do func MessageStoreDbHelper.getMessageCount(...");
        int ret = 0;
        String where = filterCondition.toSqlWhereSectionString();
        where = "((" + where + ") AND ((" + COLUMN_DELETE_FLAG_NAME
                + "=0) OR (" + COLUMN_DELETE_FLAG_NAME + "=2)))";
        where += " LIMIT 100";
        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_ID_NAME + " FROM " + TABLE_NAME
                + " LEFT JOIN " + ReadMessageInfoStoreDbHelper.TABLE_NAME
                + " ON " + "( " + TABLE_NAME + "." + COLUMN_ID_NAME + " = "
                + ReadMessageInfoStoreDbHelper.TABLE_NAME + "."
                + ReadMessageInfoStoreDbHelper.COLUMN_ID_NAME + " ) "
                + " WHERE " + where;
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                Log.debug("search Message sql=" + sql);
                if (resultSet.last()) {
                    ret = resultSet.getRow();
                }
            } catch (SQLException e) {
                Log.error("Failed to get task count : " + sql);
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return ret;
    }

    public static boolean updateMessageToDb(Message message) {
        Log.debug("do func MessageStoreDbHelper.updateMessageToDb(...");
        if (message == null) {
            return false;
        }
        String sql = getUpdateMessageSqlByMessage(message);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeUpdate(sql) == -1) {
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

    private final static String getUpdateMessageSqlByMessage(Message message) {
        Log.debug("do func MessageStoreDbHelper.getUpdateMessageSqlByMessage(...");
        if (message == null) {
            return "";
        }
        String itemId = message.getItemId();
        if (itemId == null || itemId.equals("")) {
            return "";
        }
        String entry = message.getEntry();
        String sqlEntry = "''";
        if (entry != null) {
            sqlEntry = "'" + GlobalSNSUtils.escapeSqlData(entry) + "'";
        }
        String replyId = message.getReplyId();
        String sqlReplyId = "''";
        if (replyId != null) {
            sqlReplyId = "'" + GlobalSNSUtils.escapeSqlData(replyId) + "'";
        }
        String replyTo = message.getReplyTo();
        String sqlReplyTo = "''";
        if (replyTo != null) {
            sqlReplyTo = "'" + GlobalSNSUtils.escapeSqlData(replyTo) + "'";
        }
        String startDate = message.getStartDateStr();
        String sqlStartDate = "NULL";
        if (!startDate.equals("")) {
            sqlStartDate = "'" + startDate + "'";
        }
        String dueDate = message.getDueDateStr();
        String sqlDueDate = "NULL";
        if (!dueDate.equals("")) {
            sqlDueDate = "'" + dueDate + "'";
        }
        String owner = message.getOwner();
        String sqlOwner = "''";
        if (owner != null) {
            sqlOwner = "'" + GlobalSNSUtils.escapeSqlData(owner) + "'";
        }
        String group = message.getGroup();
        String sqlGroup = "''";
        if (group != null) {
            sqlGroup = "'" + GlobalSNSUtils.escapeSqlData(group) + "'";
        }
        String completeDate = message.getCompleteDateStr();
        String sqlCompleteDate = "NULL";
        if (!completeDate.equals("")) {
            sqlCompleteDate = "'" + completeDate + "'";
        }
        String updateAt = message.getUpdatedAtStr();
        String sqlUpdateAt = "NULL";
        if (!updateAt.equals("")) {
            sqlUpdateAt = "'" + updateAt + "'";
        }
        String parentItemId = message.getParentItemId();
        String sqlParentItemId = "''";
        if (parentItemId != null) {
            sqlParentItemId = "'" + GlobalSNSUtils.escapeSqlData(parentItemId)
                    + "'";
        }
        String set = COLUMN_ENTRY_NAME + "=" + sqlEntry + ", "
                + COLUMN_PUBLISH_NODE_NAME_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(message.getPublishNodename())
                + "', " + COLUMN_START_DATE_NAME + "=" + sqlStartDate + ", "
                + COLUMN_DUE_DATE_NAME + "=" + sqlDueDate + ", "
                + COLUMN_OWNER_NAME + "=" + sqlOwner + ", " + COLUMN_GROUP_NAME
                + "=" + sqlGroup + ", " + COLUMN_STATUS_NAME + "="
                + String.valueOf(message.getStatus()) + ", "
                + COLUMN_COMPLETE_DATE_NAME + "=" + sqlCompleteDate + ", "
                + COLUMN_PRIORITY_NAME + "="
                + String.valueOf(message.getPriority()) + ", "
                + COLUMN_UPDATED_AT_NAME + "=" + sqlUpdateAt + ", "
                + COLUMN_UPDATED_BY_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(message.getUpdatedBy()) + "', "
                + COLUMN_CLIENT_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(message.getClient()) + "', "
                + COLUMN_PARENT_ITEM_ID_NAME + "=" + sqlParentItemId;
        String where = COLUMN_ITEM_ID_NAME + "='" + itemId + "'";
        String sql = "UPDATE " + TABLE_NAME + " SET " + set + " WHERE " + where
                + ";";
        return sql;
    }

    public static boolean deleteMessageToDb(String itemId) {
        Log.debug("do func MessageStoreDbHelper.deleteMessageToDb(...");
        if (itemId == null || itemId.equals("")) {
            return false;
        }
        String sql = "DELETE FROM " + TABLE_NAME + " WHERE item_id='" + itemId
                + "';";
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeDelete(sql) == -1) {
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

    public static boolean deleteMessage(String itemId, int deleteFlag,
            String fromJid, String type) {
        Log.debug("do func MessageStoreDbHelper.deleteMessage(...");
        if (itemId == null || itemId.equals("")) {
            return false;
        }
        Calendar now = Calendar.getInstance();
        Timestamp daleteTime = new Timestamp(now.getTimeInMillis());
        String deletedDateStr = daleteTime.toString();
        String updateSet = " SET " + COLUMN_DELETE_FLAG_NAME + " = "
                + deleteFlag;
        String deletedBy = type.equals("AdminDelete") ? Message.DELETED_BY_ADMIN + fromJid : fromJid;
        if (deleteFlag == Message.DELETE_FLAG_NON_DELETED) {
            updateSet += ", " + COLUMN_DELETED_AT_NAME + " = NULL" + ", "
                    + COLUMN_DELETED_BY_NAME + " = ''";
        } else {
        updateSet += ", " + COLUMN_DELETED_AT_NAME + " = '"
                    + deletedDateStr + "', ";

        updateSet += COLUMN_DELETED_BY_NAME + " = '" + deletedBy + "'";
        }
        String where = " WHERE " + COLUMN_ITEM_ID_NAME + " = '" + itemId + "'";
        String sql = "UPDATE " + TABLE_NAME + updateSet + where;
        Log.debug("delete sql :: " + sql);
        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeUpdate(sql) == -1) {
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

    public static List<Message> getSortedMesageListAppendReadInfo(
            List<String> itemIdList, String sortOrderItemString, int sortOrder,
            String fromJid) {
        Log.debug("do func MessageStoreDbHelper.getSortedMesageListAppendReadInfo(...");
        List<Message> retList = null;
        if (itemIdList == null) {
            Log.error("MessageStoreDbHelper#getSortedMesageList - itemIdList is null");
            return retList;
        }
        if (sortOrderItemString == null) {
            Log.error("MessageStoreDbHelper#getSortedMesageList - sortOrderItemString is null");
            return retList;
        }
        String sql = getSortedMessageSelectSqlByItemIds(itemIdList,
                sortOrderItemString, sortOrder, fromJid);
        if (sql == null || sql.equals("")) {
            Log.error("MessageStoreDbHelper#getSortedMesageList - sql is invalid");
            return retList;
        }

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                retList = new ArrayList<Message>();
                while (resultSet.next()) {
                    Message message = getOneMessageByResultSet(resultSet, true, false);
                    if (message != null) {
                        retList.add(message);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get message data");
            }
            dbHelper.close();
            complementReaderInfo(retList);
        } catch (Exception e) {
        }
        return retList;
    }

    private final static String getSortedMessageSelectSqlByItemIds(
            List<String> itemIdList, String sortOrderItemString, int sortOrder,
            String fromJid) {
        Log.debug("do func MessageStoreDbHelper.getSortedMessageSelectSqlByItemIds(...");
        if (itemIdList == null) {
            return "";
        }
        int count = itemIdList.size();
        if (count <= 0) {
            return "";
        }
        String sql = getMessageListSQLAppendReadInfo(fromJid);
        sql += " WHERE ";
        String where = "";
        for (int i = 0; i < count; i++) {
            if (i != 0) {
                where += " OR ";
            }
            where += "(" + TABLE_NAME + "." + COLUMN_ITEM_ID_NAME + "='"
                    + GlobalSNSUtils.escapeSqlData(itemIdList.get(i)) + "')";
        }
        where = "(" + where + ") AND ((" + TABLE_NAME + "."
                + COLUMN_DELETE_FLAG_NAME + "=0) OR (" + TABLE_NAME + "."
                + COLUMN_DELETE_FLAG_NAME + "=2))";
        sql += where;
        String sortOrderString = (sortOrder == SortCondition.SORT_ORDER_DESC) ? "DESC"
                : "ASC";
        String order = sortOrderItemString + " " + sortOrderString;
        sql += " ORDER BY " + order;

        return sql;
    }

    public static List<String> getParentItemIdListByClientId(String clientJid) {
        Log.debug("do func MessageStoreDbHelper.getParentItemIdListByClientId(...");
        List<String> retList = new ArrayList<String>();
        if (clientJid == null) {
            Log.error("MessageStoreDbHelper#getParentItemIdListByClientId - clientJid is null");
            return retList;
        }
        String sql = getParentItemIdListSelectSqlByClientId(clientJid);
        if (sql == null || sql.equals("")) {
            Log.error("MessageStoreDbHelper#getParentItemIdListByClientId - sql is invalid");
            return retList;
        }

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    String parentId = resultSet
                            .getString(COLUMN_PARENT_ITEM_ID_NAME);
                    if (parentId != null) {
                        retList.add(parentId);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get parent jid");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private final static String getParentItemIdListSelectSqlByClientId(
            String clientJid) {
        Log.debug("do func MessageStoreDbHelper.getParentItemIdListSelectSqlByClientId(...");
        if (clientJid == null) {
            return "";
        }
        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_PARENT_ITEM_ID_NAME
                + " FROM "
                + TABLE_NAME + " WHERE " + TABLE_NAME + "."
                + COLUMN_CLIENT_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(clientJid) + "' AND "
                + TABLE_NAME + "." + COLUMN_PARENT_ITEM_ID_NAME
                + "<>'' GROUP BY " + TABLE_NAME + "."
                + COLUMN_PARENT_ITEM_ID_NAME;
        return sql;
    }

    public static List<String> getParentItemIdListByOwnerIdAndExistGroupName(
            String ownerJid) {
        Log.debug("do func MessageStoreDbHelper.getParentItemIdListByOwnerIdAndExistGroupName(...");
        List<String> retList = new ArrayList<String>();
        if (ownerJid == null) {
            Log.error("MessageStoreDbHelper#getParentItemIdListByOwnerIdAndExistGroupName - ownerJid is null");
            return retList;
        }
        String sql = getParentItemIdListSelectSqlByOwnerIdAndExistGroupName(ownerJid);
        if (sql == null || sql.equals("")) {
            Log.error("MessageStoreDbHelper#getParentItemIdListByOwnerIdAndExistGroupName - sql is invalid");
            return retList;
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
                while (resultSet.next()) {
                    String parentId = resultSet
                            .getString(COLUMN_PARENT_ITEM_ID_NAME);
                    if (parentId != null) {
                        retList.add(parentId);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get parent jid");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private final static String getParentItemIdListSelectSqlByOwnerIdAndExistGroupName(
            String ownerJid) {
        Log.debug("do func MessageStoreDbHelper.getParentItemIdListSelectSqlByOwnerIdAndExistGroupName(...");
        if (ownerJid == null) {
            return "";
        }
        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_PARENT_ITEM_ID_NAME
                + " FROM "
                + TABLE_NAME + " WHERE (" + TABLE_NAME + "."
                + COLUMN_OWNER_NAME + "='"
                + GlobalSNSUtils.escapeSqlData(ownerJid) + "' AND "
                + TABLE_NAME + "." + COLUMN_PARENT_ITEM_ID_NAME + " <>'' AND "
                + TABLE_NAME + "." + COLUMN_GROUP_NAME + " <>'')";
        return sql;
    }

    public static List<String> getUniqueParentItemIdListByOwnerId(
            String ownerJid) {
        Log.debug("do func MessageStoreDbHelper.getUniqueParentItemIdListByOwnerId(...");
        List<String> retList = new ArrayList<String>();
        if (ownerJid == null) {
            Log.error("MessageStoreDbHelper#getUniqueParentItemIdListByOwnerId - ownerJid is null");
            return retList;
        }
        String sql = getUniqueParentItemIdListSelectSqlByOwnerId(ownerJid);
        if (sql == null || sql.equals("")) {
            Log.error("MessageStoreDbHelper#getUniqueParentItemIdListByOwnerId - sql is invalid");
            return retList;
        }

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    String parentId = resultSet
                            .getString(COLUMN_PARENT_ITEM_ID_NAME);
                    if (parentId != null) {
                        retList.add(parentId);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get parent jid");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private final static String getUniqueParentItemIdListSelectSqlByOwnerId(
            String ownerJid) {
        Log.debug("do func MessageStoreDbHelper.getUniqueParentItemIdListSelectSqlByOwnerId(...");
        if (ownerJid == null) {
            return "";
        }
        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_PARENT_ITEM_ID_NAME
                + " FROM "
                + TABLE_NAME + " WHERE " + TABLE_NAME + "." + COLUMN_OWNER_NAME
                + "='" + GlobalSNSUtils.escapeSqlData(ownerJid) + "' AND "
                + TABLE_NAME + "." + COLUMN_PARENT_ITEM_ID_NAME
                + "<>'' GROUP BY " + TABLE_NAME + "."
                + COLUMN_PARENT_ITEM_ID_NAME;
        return sql;
    }

    public static List<String> getParentItemIdListOfDemandTask() {
        Log.debug("do func MessageStoreDbHelper.getParentItemIdListOfDemandTask(...");
        List<String> retList = new ArrayList<String>();
        String sql = getParentItemIdListSelectSqlOfDemandTask();
        if (sql == null || sql.equals("")) {
            Log.error("MessageStoreDbHelper#getParentItemIdListOfDemandTask - sql is invalid");
            return retList;
        }

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.createReferenceInstance();
        try {
            if (!dbHelper.open()) {
                Log.error("Failed to open database");
                throw new Exception("Failed to open database");
            }
            try {
                ResultSet resultSet = dbHelper.executeQuery(sql);
                while (resultSet.next()) {
                    String parentId = resultSet
                            .getString(COLUMN_PARENT_ITEM_ID_NAME);
                    if (parentId != null) {
                        retList.add(parentId);
                    }
                }
            } catch (SQLException e) {
                Log.error("Failed to get parent jid");
            }
            dbHelper.close();
        } catch (Exception e) {
        }
        return retList;
    }

    private final static String getParentItemIdListSelectSqlOfDemandTask() {
        Log.debug("do func MessageStoreDbHelper.getParentItemIdListSelectSqlOfDemandTask(...");
        String sql = "SELECT " + TABLE_NAME + "." + COLUMN_PARENT_ITEM_ID_NAME
                + " FROM "
                + TABLE_NAME + " WHERE (" + TABLE_NAME + "."
                + COLUMN_DEMAND_STATUS_NAME + "=1 AND " + TABLE_NAME + "."
                + COLUMN_PARENT_ITEM_ID_NAME + "<>'' AND " + TABLE_NAME + "."
                + COLUMN_GROUP_NAME + "<>'')";
        return sql;
    }

    public static boolean updateDemandTaskToDb(Message message) {
        Log.debug("do func MessageStoreDbHelper.updateDemandTaskToDb(...");
        if (message == null) {
            Log.error("message is null");
            return false;
        }
        String itemId = message.getItemId();
        if (itemId == null || itemId.equals("")) {
            Log.error("MessageStoreDbHelper#updateDemandTaskToDb::itemId is invalid");
            return false;
        }
        String demandStatus = Integer.toString(message.getDemandStatus());

        String demandDate = message.getDemandDateStr();
        String sqlDemandDate = "NULL";
        if (!demandDate.equals("")) {
            sqlDemandDate = "'" + demandDate + "'";
        }

        StringBuffer sqlbuf = new StringBuffer();
        sqlbuf.append("UPDATE ");
        sqlbuf.append(TABLE_NAME);
        sqlbuf.append(" SET ");
        sqlbuf.append(COLUMN_DEMAND_STATUS_NAME).append("=")
                .append(demandStatus).append(",");
        sqlbuf.append(COLUMN_DEMAND_DATE).append("=").append(sqlDemandDate);
        sqlbuf.append(" WHERE ");
        sqlbuf.append(COLUMN_ITEM_ID_NAME).append("='")
                .append(GlobalSNSUtils.escapeSqlData(itemId)).append("'");

        String sql = sqlbuf.toString();

        GlobalSNSDataBaseHelper dbHelper = GlobalSNSDataBaseHelper.getInstance();
        synchronized (dbHelper) {
            try {
                if (!dbHelper.open()) {
                    Log.error("Failed to open database");
                    throw new Exception("Failed to open database");
                }
                if (dbHelper.executeUpdate(sql) == -1) {
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

    static String getMessageListSQLAppendReadInfo(String fromJid) {
        Log.debug("do func MessageStoreDbHelper.getMessageListSQLAppendReadInfo(...");
        if (fromJid == null || fromJid.trim().equals("")) {
            return null;
        }
        Set<String> jidSet = new HashSet<String>();
        jidSet.add(fromJid);
        List<Profile> profiles = UserProfileDbHelper
            .getUserProfileDataList(jidSet, false);
        if (profiles == null || profiles.isEmpty()) {
            return null;
        }
        String case_then_read_users = "";
        for(int i=0;i<profiles.size();i++){
            Profile profile = profiles.get(i);
            int id = profile.getId();
            BigInteger userId = BigInteger.valueOf(id);
            String s62 = GlobalSNSUtils.decimalToSixtyTwoString(userId);
            case_then_read_users += " WHEN "
                + ReadMessageInfoStoreDbHelper.TABLE_NAME + "."
                + ReadMessageInfoStoreDbHelper.COLUMN_READ_USER_IDS_NAME
                + " LIKE '%," + s62 + ",%' THEN 1 ";
        }

        String sql = "SELECT "
                + TABLE_NAME + ".* " + ", "
                + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME
                + "." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME + ", "
                + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME
                + "." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_INPUT_TYPE_NAME + ", "
                + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME
                + "." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_RESULT_VISIBLE_NAME + ", "
                + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME
                + "." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_GRAPH_TYPE_NAME + ", "
                + ReadMessageInfoStoreDbHelper.TABLE_NAME + ".*,"

                + "CASE"
                + " WHEN"
                + " " + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME
                + "." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME + " = 3"
                + " THEN"
                + "  (select room_name from chatroom_store where room_id=" + TABLE_NAME +".MSGTO limit 1)"
                + " WHEN"
                + " " + PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME
                + "." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ROOM_TYPE_NAME + " = 5"
                + " THEN"
                + "  (select room_name from community_store where room_id=" + TABLE_NAME + ".MSGTO limit 1)"
                + " ELSE"
                + "  ''"
                + " END AS room_name,"
                + "CASE WHEN " + TABLE_NAME + ".msgtype = 11"
                + "  THEN (SELECT column_name FROM murmur_store WHERE own_jid=" + TABLE_NAME + ".msgto)"
                + "     ELSE '' END AS column_name,"
                + " t.thread_title AS thread_title,"
                + " CASE"
                + case_then_read_users
                + " ELSE 0 END AS "
                + COLUMN_READ_FLG + " FROM" + " " + TABLE_NAME + " LEFT JOIN "
                + ReadMessageInfoStoreDbHelper.TABLE_NAME + " ON " + "( "
                + TABLE_NAME + "." + COLUMN_ID_NAME + " = "
                + ReadMessageInfoStoreDbHelper.TABLE_NAME + "."
                + ReadMessageInfoStoreDbHelper.COLUMN_ID_NAME + " ) "
                + " LEFT JOIN " 
                +    PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME + " ON " + " ( " 
                +    TABLE_NAME + "." + COLUMN_ITEM_ID_NAME + " = "
                +    PublicMessageQuestionnaireStoreDbHelper.TABLE_NAME
                +    "." + PublicMessageQuestionnaireStoreDbHelper.COLUMN_ITEM_ID_NAME + " ) "
                + " LEFT JOIN thread_store AS t ON (" + TABLE_NAME + ".thread_root_id = t.thread_root_id) ";
        return sql;
    }

    static void complementReaderInfo(List<Message> messageList) {
        Log.debug("do func MessageStoreDbHelper.complementReaderInfo(...");
        final String prefix = "complementReaderInfo() : ";
        if (messageList == null) {
            Log.error(prefix + "messageList is null", new Throwable());
            return;
        }
        for (Message dbMessage : messageList) {
            if (dbMessage == null) {
                Log.error(prefix + "dbMessage is null", new Throwable());
                continue;
            }
            List<MessageExistingReaderInfo> readItemList = dbMessage
                    .getReadItem();
            if (readItemList == null) {
                continue;
            }
            for (MessageExistingReaderInfo readInfo : readItemList) {
                if (readInfo == null) {
                    Log.error(prefix + "readInfo is null", new Throwable());
                    continue;
                }
                BigInteger readUserId = readInfo.getTemporaryUserId();
                if (readUserId == null) {
                    Log.error(prefix + "readUserId is null", new Throwable());
                    continue;
                }
                Profile profile = UserProfileDbHelper.getUserProfileData(
                        readUserId, false);
                if (profile == null) {
                    Log.error(prefix + "profile is null");
                    continue;
                }
                readInfo.setJid(profile.getJid());
            }
        }
    }
}
