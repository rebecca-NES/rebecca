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

package jp.co.nec.necst.spf.globalSNS.Data;

import java.io.StringReader;
import java.math.BigInteger;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Message {
    private static final Logger Log = LoggerFactory.getLogger(Message.class);

    public static final int TYPE_UNKNOWN = 0;
    public static final int TYPE_PUBLIC = 1;
    public static final int TYPE_CHAT = 2;
    public static final int TYPE_GROUP_CAHT = 3;
    public static final int TYPE_TASK = 4;
    public static final int TYPE_COMMUNITY = 5;
    public static final int TYPE_SYSTEM = 6;
    public static final int TYPE_MAIL = 9;
    public static final int TYPE_QUESTIONNAIRE = 10;
    public static final int TYPE_MURMUR = 11;
    public static final int TYPE_ALL = 99;

    private static final String TYPE_UNKNOWN_STR = "Unknown";
    private static final String TYPE_PUBLIC_STR = "Public";
    private static final String TYPE_CHAT_STR = "Chat";
    private static final String TYPE_GROUP_CAHT_STR = "GroupChat";
    private static final String TYPE_TASK_STR = "Task";
    private static final String TYPE_COMMUNITY_STR = "Community";
    private static final String TYPE_SYSTEM_STR = "System";
    private static final String TYPE_MAIL_STR = "Mail";
    private static final String TYPE_QUESTIONNAIRE_STR = "Questionnaire";
    private static final String TYPE_MURMUR_STR = "Murmur";
    private static final String TYPE_ALL_STR = "all";

    public static final int STATUS_UNKNOWN = 0;
    public static final int STATUS_INBOX = 1;
    public static final int STATUS_ASSIGNING = 2;
    public static final int STATUS_NEW = 3;
    public static final int STATUS_DOING = 4;
    public static final int STATUS_SOLVED = 5;
    public static final int STATUS_FEEDBACK = 6;
    public static final int STATUS_FINISHED = 7;
    public static final int STATUS_REJECTED = 8;

    public static final int DELETE_FLAG_NON_DELETED = 0;
    public static final int DELETE_FLAG_DELETED = 1;
    public static final int DELETE_FLAG_TRUSH = 2;

    public static final int DEMAND_STATUS_NON_DEMAND = 0;
    public static final int DEMAND_STATUS_DEMAND = 1;

    public final static String BODY_DELETED_SELF = "deleted";
    public final static String BODY_DELETED_ADMIN = "deleted_by_admin";
    public final static String DELETED_BY_ADMIN = "adminDelete:";

    public static final int VOTE_FLAG_NON_VOTE = 0;
    public static final int VOTE_FLAG_VOTE = 1;

    public static String getMessageTypeString(Message message) {
        String ret = TYPE_UNKNOWN_STR;
        if (message == null) {
            return ret;
        }
        int type = message.getMsgType();
        switch (type) {
        case TYPE_PUBLIC:
            ret = TYPE_PUBLIC_STR;
            break;
        case TYPE_CHAT:
            ret = TYPE_CHAT_STR;
            break;
        case TYPE_GROUP_CAHT:
            ret = TYPE_GROUP_CAHT_STR;
            break;
        case TYPE_TASK:
            ret = TYPE_TASK_STR;
            break;
        case TYPE_COMMUNITY:
            ret = TYPE_COMMUNITY_STR;
            break;
        case TYPE_SYSTEM:
            ret = TYPE_SYSTEM_STR;
            break;
        case TYPE_MAIL:
            ret = TYPE_MAIL_STR;
            break;
        case TYPE_QUESTIONNAIRE:
            ret = TYPE_QUESTIONNAIRE_STR;
            break;
        case TYPE_MURMUR:
            ret = TYPE_MURMUR_STR;
            break;
        default:
            break;
        }
        return ret;
    }

    private BigInteger mId;
    private String mItemId;
    private int mMsgType;
    private String mMsgFrom;
    private String mMsgTo;
    private String mEntry;
    private int mBodyType;
    private String mPublishNodename;
    private Timestamp mCreatedAt;
    private String mReplyId;
    private String mReplyTo;
    private String mThreadTitle;
    private String mThreadRootId;
    private String mQuotationItemId;
    private BigInteger mQuotationMessageId;
    private Timestamp mStartDate;
    private Timestamp mDueDate;
    private String mOwner;
    private String mGroup;
    private String mGroupName;
    private String mColumnName;
    private String mParentRoomId;
    private int mStatus;
    private Timestamp mCompleteDate;
    private int mPriority;
    private Timestamp mUpdatedAt;
    private String mUpdatedBy;
    private String mClient;
    private List<GoodJob> mGoodJobList;
    private QuotationMessage mQuotationMessage;
    private List<EmotionPoint> mEmotionPointList;
    private String mEmotionPointIconJson;
    private List<TaskNote> mTaskNoteList;
    private int mShowType;
    private String mParentItemId;
    private List<Message> mSiblingTaskList;
    private String mPreviousOwner;
    private int mDeleteFlag;
    private Timestamp mDeletedAt;
    private String mDeletedBy;
    private String mMailMessageId;
    private String mMailInReplyTo;
    private String mMailBody;
    private int mDemandStatus;
    private Timestamp mDemandDate;
    private int mReadFlag;
    private List<MessageExistingReaderInfo> mReadItem;
    private BigInteger mReadAllCount;
    private PublicMessageQuestionnaireInfo mPublicmessageQuestionnaireInfo;
    private int mVoteFlag;
    private List<VoteStore> mOptionItemList;
    private Note mNote;

    public Message(Message src) {
        mId = src.getId();
        mItemId = src.getItemId();
        mMsgType = src.getMsgType();
        mMsgFrom = src.getMsgFrom();
        mMsgTo = src.getMsgTo();
        mEntry = src.getEntry();
        mBodyType = src.getBodyType();
        mPublishNodename = src.getPublishNodename();
        mCreatedAt = src.getCreatedAt();
        mReplyId = src.getReplyId();
        mReplyTo = src.getReplyTo();
        mThreadTitle = src.getThreadTitle();
        mThreadRootId = src.getThreadRootId();
        mQuotationItemId = src.getQuotationItemId();
        mQuotationMessageId = src.getQuotationMessageId();
        mStartDate = src.getStartDate();
        mDueDate = src.getDueDate();
        mOwner = src.getOwner();
        mGroup = src.getGroup();
        mGroupName = src.getGroupName();
        mColumnName = src.getColumnName();
        mParentRoomId = src.getParentRoomId();
        mStatus = src.getStatus();
        mCompleteDate = src.getCompleteDate();
        mPriority = src.getPriority();
        mUpdatedAt = src.getUpdatedAt();
        mUpdatedBy = src.getUpdatedBy();
        mClient = src.getClient();
        mDeleteFlag = src.getDeleteFlag();
        mDeletedAt = src.getDeletedAt();
        mDeletedBy = src.getDeletedBy();
        mMailMessageId = src.getMailMessageId();
        mMailInReplyTo = src.getMailInReplyTo();
        mMailBody = src.getMailBody();
        mDemandStatus = src.getDemandStatus();
        mDemandDate = src.getDemandDate();
        List<GoodJob> srcGoodJobList = src.getGoodJobList();
        if (srcGoodJobList != null) {
            mGoodJobList = new ArrayList<GoodJob>();
            int count = srcGoodJobList.size();
            for (int i = 0; i < count; i++) {
                GoodJob gj = srcGoodJobList.get(i);
                mGoodJobList.add(new GoodJob(gj));
            }
        } else {
            mGoodJobList = null;
        }

        if(src.getQuotationMessageData() != null){
            mQuotationMessage = new QuotationMessage(src.getQuotationMessageData());
        }else{
            mQuotationMessage = null;
        }

        List<EmotionPoint> srcEmotionPointList = src.getEmotionPointList();
        if (srcEmotionPointList != null) {
            mEmotionPointList = new ArrayList<EmotionPoint>();
            int count = srcEmotionPointList.size();
            for (int i = 0; i < count; i++) {
                EmotionPoint ep = srcEmotionPointList.get(i);
                mEmotionPointList.add(new EmotionPoint(ep));
            }
        } else {
            mEmotionPointList = null;
        }

        mEmotionPointIconJson = src.getEmotionPointIconJson();

        List<TaskNote> srcTaskNote = src.getTaskNoteList();
        if (srcTaskNote != null) {
            mTaskNoteList = new ArrayList<TaskNote>();
            int count = srcTaskNote.size();
            for (int i = 0; i < count; i++) {
                TaskNote tn = srcTaskNote.get(i);
                mTaskNoteList.add(new TaskNote(tn));
            }
        } else {
            mTaskNoteList = null;
        }
        mShowType = src.getShowType();
        mPreviousOwner = src.getPreviousOwner();
        mParentItemId = src.getParentItemId();
        List<Message> srcSimblingTaskMessageList = src.getSiblingTaskList();
        if (srcTaskNote != null) {
            mSiblingTaskList = new ArrayList<Message>();
            int count = srcSimblingTaskMessageList.size();
            for (int i = 0; i < count; i++) {
                Message srcSimbingTaskMessage = srcSimblingTaskMessageList
                        .get(i);
                mSiblingTaskList.add(srcSimbingTaskMessage);
            }
        } else {
            mSiblingTaskList = null;
        }
        mReadFlag = src.getReadFlag();
        List<MessageExistingReaderInfo> srcReadItem = src.getReadItem();
        if (srcReadItem != null) {
            mReadItem = new ArrayList<MessageExistingReaderInfo>();
            int count = srcReadItem.size();
            for (int i = 0; i < count; i++) {
                MessageExistingReaderInfo messageExistingReaderInfo = srcReadItem.get(i);
                mReadItem.add(new MessageExistingReaderInfo(messageExistingReaderInfo));
            }
        } else {
            mReadItem = null;
        }
        mReadAllCount = src.getReadAllCount();
        mPublicmessageQuestionnaireInfo = src.getPublicmessageQuestionnaireInfo();
        mVoteFlag = src.getVoteFlag();
        List<VoteStore> srcOptionItemList = src.getOptionItemList();
        if (srcOptionItemList != null) {
            mOptionItemList = new ArrayList<VoteStore>();
            int count = srcOptionItemList.size();
            for (int i = 0; i < count; i++) {
                VoteStore tn = srcOptionItemList.get(i);
                mOptionItemList.add(new VoteStore(tn));
            }
        } else {
            mOptionItemList = null;
        }
        if(src.getNote() != null){
            mNote = new Note(src.getNote());
        }else{
            mNote = null;
        }
    }

    public Message() {
        mId = BigInteger.ZERO;
        mItemId = "";
        mMsgType = TYPE_UNKNOWN;
        mMsgFrom = "";
        mMsgTo = "";
        mEntry = "";
        mBodyType = 0;
        mPublishNodename = "";
        mCreatedAt = null;
        mReplyId = "";
        mReplyTo = "";
        mThreadTitle = null;
        mThreadRootId = "";
        mQuotationItemId = null;
        mQuotationMessageId = null;
        mStartDate = null;
        mDueDate = null;
        mOwner = "";
        mGroup = "";
        mGroupName = "";
        mColumnName = "";
        mParentRoomId = "";
        mStatus = 0;
        mCompleteDate = null;
        mPriority = 1;
        mUpdatedAt = null;
        mUpdatedBy = "";
        mClient = "";
        mGoodJobList = null;
        mQuotationMessage = null;
        mEmotionPointList = null;
        mEmotionPointIconJson = null;
        mTaskNoteList = null;
        mShowType = 1;
        mPreviousOwner = "";
        mParentItemId = "";
        mSiblingTaskList = null;
        mDeleteFlag = 0;
        mDeletedAt = null;
        mDeletedBy = "";
        mMailMessageId = "";
        mMailInReplyTo = "";
        mMailBody = "";
        mReadFlag = 0;
        mReadItem = null;
        mReadAllCount = BigInteger.ZERO;
        mPublicmessageQuestionnaireInfo = null;
        mVoteFlag = 0;
        mOptionItemList = null;
        mNote = null;
    }

    public BigInteger getId() {
        return mId;
    }

    public void setId(BigInteger id) {
        mId = id;
    }

    public String getItemId() {
        return mItemId;
    }

    public void setItemId(String itemId) {
        mItemId = itemId;
    }

    public int getMsgType() {
        return mMsgType;
    }

    public void setMsgType(int msgType) {
        mMsgType = msgType;
    }

    public String getMsgFrom() {
        return mMsgFrom;
    }

    public void setMsgFrom(String msgFrom) {
        mMsgFrom = msgFrom;
    }

    public String getMsgTo() {
        return mMsgTo;
    }

    public void setMsgTo(String msgTo) {
        mMsgTo = msgTo;
    }

    public String getEntry() {
        return mEntry;
    }

    public void setEntry(String entry) {
        mEntry = entry;
    }

    public int getBodyType() {
        return mBodyType;
    }

    public void setBodyType(int type) {
        mBodyType = type;
    }

    public String getPublishNodename() {
        return mPublishNodename;
    }

    public void setPublishNodename(String publishNodename) {
        mPublishNodename = publishNodename;
    }

    public Timestamp getCreatedAt() {
        return mCreatedAt;
    }

    public String getCreatedAtStr() {
        if (mCreatedAt == null) {
            return "";
        }
        long createdTime = mCreatedAt.getTime();
        java.util.Date date = new java.util.Date(createdTime);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setCreatedAt(Timestamp createdAt) {
        mCreatedAt = createdAt;
    }

    public String getReplyId() {
        return mReplyId;
    }

    public void setReplyId(String replyId) {
        mReplyId = replyId;
    }

    public String getReplyTo() {
        return mReplyTo;
    }

    public void setReplyTo(String replyTo) {
        mReplyTo = replyTo;
    }

    public String getThreadTitle() {
        return mThreadTitle;
    }

    public void setThreadTitle(String threadTitle) {
        mThreadTitle = threadTitle;
    }

    public String getThreadRootId() {
        return mThreadRootId;
    }

    public void setThreadRootId(String threadRootId) {
        mThreadRootId = threadRootId;
    }

    public String getQuotationItemId() {
        return mQuotationItemId;
    }

    public void setQuotationItemId(String quotationItemId) {
         mQuotationItemId = quotationItemId;
    }

    public BigInteger getQuotationMessageId() {
        return mQuotationMessageId;
    }

    public void setQuotationMessageId(BigInteger quotationMessageId) {
         mQuotationMessageId = quotationMessageId;
    }

    public List<GoodJob> getGoodJobList() {
        return mGoodJobList;
    }

    public void setGoodJobList(List<GoodJob> goodJobList) {
        mGoodJobList = goodJobList;
    }

    public QuotationMessage getQuotationMessageData() {
        return mQuotationMessage;
    }

    public void setQuotationMessageData(QuotationMessage quotationMessage) {
        mQuotationMessage = quotationMessage;
    }

    public List<EmotionPoint> getEmotionPointList() {
        return mEmotionPointList;
    }

    public void setEmotionPointList(List<EmotionPoint> emotionPointList) {
        mEmotionPointList = emotionPointList;
    }

    public String getEmotionPointIconJson() {
        return mEmotionPointIconJson;
    }

    public void setEmotionPointIconJson(String emotionIconJson) {
        mEmotionPointIconJson = emotionIconJson;
    }

    public Timestamp getStartDate() {
        return mStartDate;
    }

    public String getStartDateStr() {
        if (mStartDate == null) {
            return "";
        }
        long startDate = mStartDate.getTime();
        java.util.Date date = new java.util.Date(startDate);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setStartDate(Timestamp startDate) {
        mStartDate = startDate;
    }

    public Timestamp getDueDate() {
        return mDueDate;
    }

    public String getDueDateStr() {
        if (mDueDate == null) {
            return "";
        }
        long dueDate = mDueDate.getTime();
        java.util.Date date = new java.util.Date(dueDate);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setDueDate(Timestamp dueDate) {
        mDueDate = dueDate;
    }

    public String getOwner() {
        return mOwner;
    }

    public void setOwner(String owner) {
        mOwner = owner;
    }

    public String getGroup() {
        return mGroup;
    }

    public void setGroup(String group) {
        mGroup = group;
    }

    public String getGroupName() {
        return mGroupName;
    }

    public void setGroupName(String groupName) {
        mGroupName = groupName;
    }

    public String getColumnName() {
        return mColumnName;
    }

    public void setColumnName(String columnName) {
        mColumnName = columnName;
    }

    public String getParentRoomId() {
        return mParentRoomId;
    }
    public void setParentRoomId(String parentRoomId) {
        mParentRoomId = parentRoomId;
    }

    public int getStatus() {
        return mStatus;
    }

    public void setStatus(int status) {
        mStatus = status;
    }

    public Timestamp getCompleteDate() {
        return mCompleteDate;
    }

    public String getCompleteDateStr() {
        if (mCompleteDate == null) {
            return "";
        }
        long completeDate = mCompleteDate.getTime();
        java.util.Date date = new java.util.Date(completeDate);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setCompleteDate(Timestamp completeDate) {
        mCompleteDate = completeDate;
    }

    public int getPriority() {
        return mPriority;
    }

    public void setPriority(int priority) {
        mPriority = priority;
    }

    public Timestamp getUpdatedAt() {
        return mUpdatedAt;
    }

    public String getUpdatedAtStr() {
        if (mUpdatedAt == null) {
            return "";
        }
        long updatedAt = mUpdatedAt.getTime();
        java.util.Date date = new java.util.Date(updatedAt);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        mUpdatedAt = updatedAt;
    }

    public String getUpdatedBy() {
        return mUpdatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        mUpdatedBy = updatedBy;
    }

    public String getClient() {
        return mClient;
    }

    public void setClient(String client) {
        mClient = client;
    }

    public List<TaskNote> getTaskNoteList() {
        return mTaskNoteList;
    }

    public void setTaskNoteList(List<TaskNote> taskNoteList) {
        mTaskNoteList = taskNoteList;
    }

    public int getShowType() {
        return mShowType;
    }

    public void setShowType(int showType) {
        mShowType = showType;
    }

    public String getPreviousOwner() {
        return mPreviousOwner;
    }

    public void setPreviousOwner(String previousOwner) {
        mPreviousOwner = previousOwner;
    }

    public String getParentItemId() {
        return mParentItemId;
    }

    public void setParentItemId(String parentItemId) {
        mParentItemId = parentItemId;
    }

    public List<Message> getSiblingTaskList() {
        return mSiblingTaskList;
    }

    public void setSiblingTaskList(List<Message> mSiblingTaskList) {
        this.mSiblingTaskList = mSiblingTaskList;
    }

    public String getSubStringEntry(String subkey) {
        String ret = null;
        String entryString = getEntry();
        if (entryString == null || entryString.equals("")) {
            return null;
        }
        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Document doc;
        try {
            doc = xmlReader.read(new StringReader(entryString));
            Element entry = doc.getRootElement();
            if (entry == null) {
                return null;
            }
            Element subkeyElement = entry.element(subkey);
            if (subkeyElement == null) {
                return null;
            }
            ret = subkeyElement.getStringValue();
        } catch (DocumentException e) {
        }
        return ret;
    }

    public int getDeleteFlag() {
        return mDeleteFlag;
    }

    public void setDeleteFlag(int deleteFlag) {
        mDeleteFlag = deleteFlag;
    }

    public Timestamp getDeletedAt() {
        return mDeletedAt;
    }

    public String getDeletedAtStr() {
        if (mDeletedAt == null) {
            return "";
        }
        long deletedAt = mDeletedAt.getTime();
        java.util.Date date = new java.util.Date(deletedAt);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setDeletedAt(Timestamp deletedAt) {
        mDeletedAt = deletedAt;
    }

    public String getDeletedBy() {
        return mDeletedBy;
    }

    public void setDeletedBy(String deletedBy) {
        mDeletedBy = deletedBy;
    }

    public String getMailMessageId() {
        return mMailMessageId;
    }

    public void setMailMessageId(String mailMessageId) {
        mMailMessageId = mailMessageId;
    }

    public String getMailInReplyTo() {
        return mMailInReplyTo;
    }

    public void setMailInReplyTo(String mailInReplyTo) {
        mMailInReplyTo = mailInReplyTo;
    }

    public String getMailBody() {
        return mMailBody;
    }

    public void setMailBody(String mailBody) {
        mMailBody = mailBody;
    }

    public int getDemandStatus() {
        return mDemandStatus;
    }

    public void setDemandStatus(int demandStatus) {
        mDemandStatus = demandStatus;
    }

    public Timestamp getDemandDate() {
        return mDemandDate;
    }

    public String getDemandDateStr() {
        if (mDemandDate == null) {
            return "";
        }
        long demandDate = mDemandDate.getTime();
        java.util.Date date = new java.util.Date(demandDate);
        SimpleDateFormat df = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
        return df.format(date);
    }

    public void setDemandDate(Timestamp demandDate) {
        mDemandDate = demandDate;
    }

    public int getReadFlag() {
        return mReadFlag;
    }

    public void setReadFlag(int readFlg) {
        mReadFlag = readFlg;
    }

    public List<MessageExistingReaderInfo> getReadItem() {
        return mReadItem;
    }

    public void setReadItem(List<MessageExistingReaderInfo> readItem) {
        mReadItem = readItem;
    }

    public BigInteger getReadAllCount() {
        return mReadAllCount;
    }

    public void setReadAllCount(BigInteger readAllCount) {
        mReadAllCount = readAllCount;
    }
    
    public PublicMessageQuestionnaireInfo getPublicmessageQuestionnaireInfo() {
        return mPublicmessageQuestionnaireInfo;
    }

    public void setPublicmessageQuestionnaireInfo(
            PublicMessageQuestionnaireInfo publicmessageQuestionnaireInfo) {
        mPublicmessageQuestionnaireInfo = publicmessageQuestionnaireInfo;
    }

    public int getVoteFlag() {
        return mVoteFlag;
    }

    public void setVoteFlag(int voteFlag) {
        mVoteFlag = voteFlag;
    }

    public List<VoteStore> getOptionItemList() {
        return mOptionItemList;
    }

    public void setOptionItemList(List<VoteStore> optionItemList) {
        mOptionItemList = optionItemList;
    }

    public String getMessageBodyInEntry() {
        String ret = "";
        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entry = null;
        String entryStr = getEntry();
        if (entryStr == null || entryStr.equals("")) {
            Log.error("Message#getMessageBodyInEntry:: entryStr is null");
            return ret;
        } else {
            try {
                Document doc = xmlReader.read(new StringReader(entryStr));
                entry = doc.getRootElement();
            } catch (DocumentException e) {
                Log.error("Message#getMessageBodyInEntry:: entry data is not XML");
                return ret;
            }
        }
        Element bodyElement = entry.element("body");
        if(bodyElement == null) {
            Log.error("Message#getMessageBodyInEntry:: bodyElement is null");
            return ret;
        }
        ret = bodyElement.getStringValue();
        if(ret == null) {
            ret = "";
            Log.error("Message#getMessageBodyInEntry:: body data is null");
        }
        return ret;
    }

    public Note getNote() {
        return mNote;
    }

    public void setNote(Note note) {
        mNote = note;
    }

}
