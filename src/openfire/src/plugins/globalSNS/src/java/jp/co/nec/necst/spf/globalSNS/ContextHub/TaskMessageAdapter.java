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

import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityMember;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.SystemMessageEntryData;
import jp.co.nec.necst.spf.globalSNS.Data.SystemMessageTriggerActionId;
import jp.co.nec.necst.spf.globalSNS.Data.TaskNote;
import jp.co.nec.necst.spf.globalSNS.Data.TaskSearchFilter;
import jp.co.nec.necst.spf.globalSNS.Data.TaskSearchSortCondition;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;
import jp.co.nec.necst.spf.globalSNS.Group.CommunityManager;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler.ContentType;
import jp.co.nec.necst.spf.globalSNS.Notification.MessageOptionNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.TaskChangeNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.TaskMessageNotifier;

import org.dom4j.Attribute;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class TaskMessageAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(TaskMessageAdapter.class);
    private static TaskMessageAdapter mThisInstance = null;

    private static Map<String, Object> mLockObjectMapStringToObjectForGenerateId = new ConcurrentHashMap<String, Object>();

    private static final String SEND_MESSAGE_NAMESPACE = "http://necst.nec.co.jp/protocol/send";
    private static final String UPDATE_MESSAGE_NAMESPACE = "http://necst.nec.co.jp/protocol/update";

    public static enum TASK_OPERATION_TYPE {
        ADD, UPDATE;
    }

    private TaskMessageAdapter() {
    }

    public static TaskMessageAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new TaskMessageAdapter();
        }
        return mThisInstance;
    }

    public IQ hundleGetTaskListIQ(IQ iq, Element exodus) {
        if (iq == null) {
            Log.error("TaskMessageAdapter#hundleGetTaskListIQ: iq is null");
            return null;
        }
        if (exodus == null) {
            Log.error("TaskMessageAdapter#hundleGetTaskListIQ: exodus is null");
            return null;
        }

        Element query = iq.getChildElement();
        if (query == null) {
            Log.debug("not query");
            return null;
        }
        Element taskListElement = exodus.element("task_list");
        if (taskListElement == null) {
            Log.debug("not task_list");
            return null;
        }

        Element baseIdElement = taskListElement.element("base_id");
        if (baseIdElement == null) {
            Log.debug("not base_id");
            return null;
        }

        Element countElement = taskListElement.element("count");
        if (countElement == null) {
            Log.debug("not count");
            return null;
        }
        Element filterElement = taskListElement.element("filter");
        if (filterElement == null) {
            Log.debug("not filter");
            return null;
        }

        Element sortElement = taskListElement.element("sort");
        if (sortElement == null) {
            Log.debug("not sort");
            return null;
        }

        int baseIdIndex = -1;
        try {
            baseIdIndex = Integer.parseInt(baseIdElement.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("base_id is not Number.");
            return null;
        }

        int countNum = 0;
        try {
            countNum = Integer.parseInt(countElement.getStringValue());
        } catch (NumberFormatException e) {
            Log.error("count is not Number.");
            return null;
        }

        TaskSearchFilter filter = new TaskSearchFilter();
        Element ownerElement = filterElement.element("owner");
        if (ownerElement != null) {
            String ownerString = ownerElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(ownerString, filter.getOwner());
        }
        Element groupElement = filterElement.element("group_name");
        if (groupElement != null) {
            String groupString = groupElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(groupString, filter.getGroup());
            String requestJid = iq.getFrom().toBareJID();
            List<String> requestGroupList = filter.getGroup();
            List<String> newGroupList = new ArrayList<String>();
            for (String roomId : requestGroupList) {
                if (CommunityManager.getInstance().isGettableMessage(roomId,
                        requestJid)) {
                    newGroupList.add(roomId);
                } else {
                    Log.warn("TaskMessgeAdapter#hundleGetTaskListIQ::this community is not readable. roomId="
                            + roomId + " requestJid=" + requestJid);
                }
            }
            if (newGroupList.size() <= 0) {
                Log.warn("TaskMessgeAdapter#hundleGetTaskListIQ::request group is invalid");
                return null;
            }
            filter.setGroup(newGroupList);
        }
        Element statusElement = filterElement.element("status");
        if (statusElement != null) {
            String statusString = statusElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(statusString, filter.getStatus());
        }
        Element priorityElement = filterElement.element("priority");
        if (priorityElement != null) {
            String priorityString = priorityElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(priorityString,
                    filter.getPriority());
        }
        Element startDateElement = filterElement.element("start_date");
        Element endDateElement = filterElement.element("end_date");
        if (startDateElement != null && endDateElement != null) {
            String startDateString = startDateElement.getStringValue();
            String endDateString = endDateElement.getStringValue();
            if (!startDateString.equals("") && !endDateElement.equals("")) {
                Calendar startCal = GlobalSNSUtils
                        .parseDateString(startDateString);
                Calendar endCal = GlobalSNSUtils.parseDateString(endDateString);
                if (startCal != null && endCal != null) {
                    filter.setStartDate(new Timestamp(startCal
                            .getTimeInMillis()));
                    filter.setEndDate(new Timestamp(endCal.getTimeInMillis()));
                }
            }
        }
        Element clientElement = filterElement.element("client");
        if (clientElement != null) {
            String clientString = clientElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(clientString, filter.getClient());
        }
        TaskSearchSortCondition sortCondition = new TaskSearchSortCondition();
        Element itemElement = sortElement.element("item");
        Element orderElement = sortElement.element("order");
        if (itemElement != null) {
            List<String> itemList = sortCondition.getItems();
            List<String> orderList = sortCondition.getOrders();
            String itemString = itemElement.getStringValue();
            GlobalSNSUtils.splitStringToArray(itemString, itemList);
            if (orderElement != null) {
                String orderString = orderElement.getStringValue();
                GlobalSNSUtils.splitStringToArray(orderString, orderList);
            }
            int itemSize = itemList.size();
            int orderSize = orderList.size();
            if (itemSize > orderSize) {
                for (int i = orderSize - 1; i < itemSize; i++) {
                    orderList
                            .add(TaskSearchSortCondition.SORT_ORDER_TYPE_ASC_STR);
                }
            }
        }

        List<Message> taskList = TaskMessageDbHelper.getTaskListDbData(
                baseIdIndex, countNum, filter, sortCondition);
        int taskListSize = 0;
        List<String> parentTaskItemIdList = new ArrayList<String>();
        if (taskList != null) {
            taskListSize = taskList.size();
            for (int i = taskListSize - 1; i >= 0; i--) {
                Message taskMessage = taskList.get(i);
                if (taskMessage == null) {
                    taskList.remove(i);
                    continue;
                }
                appendExtraTaskData(taskMessage);
                String itemId = taskMessage.getItemId();
                parentTaskItemIdList.add(itemId);
            }
            taskListSize = taskList.size();
        }

        List<Message> childrenTaskList = TaskMessageDbHelper
                .getChildrenTaskList(parentTaskItemIdList);
        int childrenTaskListSize = 0;
        if (childrenTaskList != null) {
            childrenTaskListSize = childrenTaskList.size();
            for (int i = childrenTaskListSize - 1; i >= 0; i--) {
                Message childrenTaskMessage = childrenTaskList.get(i);
                if (childrenTaskMessage == null) {
                    childrenTaskList.remove(i);
                    continue;
                }
                String itemId = childrenTaskMessage.getItemId();
                childrenTaskMessage.setTaskNoteList(TaskNoteStoreDbHelper
                        .getTaskNoteData(itemId));
            }
            childrenTaskListSize = childrenTaskList.size();
        }

        int unfinishedTaskCount = TaskMessageDbHelper
                .getUnfinishedTaskCount(filter);

        IQ replyPacket = IQ.createResultIQ(iq);

        Element items = DocumentHelper.createElement("items");
        items.addAttribute("count", String.valueOf(taskListSize));
        items.addAttribute("unfinished_task_count",
                String.valueOf(unfinishedTaskCount));
        for (int i = 0; i < taskListSize; i++) {
            Message taskMessage = taskList.get(i);
            Element item = getTaskMessageItemElement(taskMessage);
            items.add(item);
        }
        Element childrenItems = DocumentHelper.createElement("children_items");
        childrenItems.addAttribute("count",
                String.valueOf(childrenTaskListSize));
        for (int i = 0; i < childrenTaskListSize; i++) {
            Message childrenTaskMessage = childrenTaskList.get(i);
            Element item = getTaskMessageItemElement(childrenTaskMessage);
            childrenItems.add(item);
        }

        exodus.remove(taskListElement);
        exodus.add(items);
        exodus.add(childrenItems);
        query.setParent(null);
        replyPacket.setChildElement(query);

        return replyPacket;
    }

    public void appendExtraTaskData(Message taskMessage) {
        appendSiblingTaskList(taskMessage);
        appendTaskNoteList(taskMessage);
    }

    private void appendSiblingTaskList(Message taskMessage) {
        taskMessage.setSiblingTaskList(TaskMessageDbHelper
                .getSiblingTaskList(taskMessage));
    }

    private void appendTaskNoteList(Message taskMessage) {
        taskMessage.setTaskNoteList(TaskNoteStoreDbHelper
                .getTaskNoteData(taskMessage.getItemId()));
    }

    public Element getTaskMessageItemElement(Message taskMessage) {
        Log.debug("do func TaskMessageAdapter.getTaskMessageItemElement(...");
        Set<String> jidSet = new HashSet<String>();
        Element item = DocumentHelper.createElement("item");
        Element id = DocumentHelper.createElement("id");
        id.setText(String.valueOf(taskMessage.getId()));
        item.add(id);

        Element itemId = DocumentHelper.createElement("item_id");
        itemId.setText(taskMessage.getItemId());
        item.add(itemId);

        Element messageType = DocumentHelper.createElement("msgtype");
        messageType.setText(String.valueOf(taskMessage.getMsgType()));
        item.add(messageType);

        Element messageFrom = DocumentHelper.createElement("msgfrom");
        String fromJid = taskMessage.getMsgFrom();
        messageFrom.setText(fromJid);
        item.add(messageFrom);
        jidSet.add(fromJid);

        Element messageTo = DocumentHelper.createElement("msgto");
        messageTo.setText(taskMessage.getMsgTo());
        item.add(messageTo);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entry;
        String entryStr = taskMessage.getEntry();
        boolean isCreateAttachedItemsElem = true;
        if (entryStr == null || entryStr.equals("")) {
            entry = DocumentHelper.createElement("entry");
        } else {
            try {
                Document doc = xmlReader.read(new StringReader(entryStr));
                entry = doc.getRootElement();
            } catch (DocumentException e) {
                Log.error("entry data is not XML");
                entry = DocumentHelper.createElement("entry");
            }
        }
        Element attachedItemsElem = entry.element("attached_items");
        if (attachedItemsElem == null) {
            attachedItemsElem = DocumentHelper.createElement("attached_items");
            attachedItemsElem.addAttribute("count", String.valueOf(0));
        } else {
            isCreateAttachedItemsElem = false;
        }
        item.add(attachedItemsElem.createCopy());
        if (!isCreateAttachedItemsElem) {
            entry.remove(attachedItemsElem);
        }
        item.add(entry);

        Element priority = DocumentHelper.createElement("priority");
        priority.setText(String.valueOf(taskMessage.getPriority()));
        item.add(priority);

        Element createdAt = DocumentHelper.createElement("created_at");
        createdAt.setText(taskMessage.getCreatedAtStr());
        item.add(createdAt);

        Element replyId = DocumentHelper.createElement("reply_id");
        String replyIdStr = taskMessage.getReplyId();
        replyId.setText((replyIdStr == null) ? "" : replyIdStr);
        item.add(replyId);

        Element replyTo = DocumentHelper.createElement("reply_to");
        String replyToStr = taskMessage.getReplyTo();
        replyTo.setText((replyToStr == null) ? "" : replyToStr);
        item.add(replyTo);

        Element startDate = DocumentHelper.createElement("start_date");
        startDate.setText(taskMessage.getStartDateStr());
        item.add(startDate);
        Element dueDate = DocumentHelper.createElement("due_date");
        dueDate.setText(taskMessage.getDueDateStr());
        item.add(dueDate);
        Element owner = DocumentHelper.createElement("owner");
        String ownerJid = taskMessage.getOwner();
        ownerJid = (ownerJid == null) ? "" : ownerJid;
        owner.setText(ownerJid);
        item.add(owner);
        if (!ownerJid.equals("")) {
            jidSet.add(ownerJid);
        }
        Element group = DocumentHelper.createElement("group");
        String groupStr = taskMessage.getGroup();
        group.setText((groupStr == null) ? "" : groupStr);
        item.add(group);
        Element groupName = DocumentHelper.createElement("groupname");
        String groupNameStr = "";
        if (!"".equals(groupStr)) {
            CommunityInfo communityInfo = CommunityManager.getInstance()
                    .getCommunityInfoWithoutMemberInfo(groupStr);
            if (communityInfo == null) {
                Log.warn("TaskMessageAdapter#getTaskMessageItemElement::communityInfo is null");
            } else {
                groupNameStr = communityInfo.getRoomName();
            }
        }
        groupName.setText(groupNameStr);
        item.add(groupName);
        Element status = DocumentHelper.createElement("status");
        status.setText(String.valueOf(taskMessage.getStatus()));
        item.add(status);
        Element completeDate = DocumentHelper.createElement("complete_date");
        completeDate.setText(taskMessage.getCompleteDateStr());
        item.add(completeDate);
        Element updatedAt = DocumentHelper.createElement("updated_at");
        updatedAt.setText(taskMessage.getUpdatedAtStr());
        item.add(updatedAt);
        Element updatedBy = DocumentHelper.createElement("updated_by");
        String updatedByJid = taskMessage.getUpdatedBy();
        updatedBy.setText(updatedByJid);
        item.add(updatedBy);
        jidSet.add(updatedByJid);
        Element client = DocumentHelper.createElement("client");
        String clientJid = taskMessage.getClient();
        clientJid = (clientJid == null) ? "" : clientJid;
        client.setText(clientJid);
        item.add(client);
        if (!clientJid.equals("")) {
            jidSet.add(clientJid);
        }
        Element note = DocumentHelper.createElement("note");
        List<TaskNote> taskNoteList = taskMessage.getTaskNoteList();
        int tnCount = 0;
        if (taskNoteList != null) {
            tnCount = taskNoteList.size();
        }
        note.addAttribute("count", String.valueOf(tnCount));
        item.add(note);
        for (int i = 0; i < tnCount; i++) {
            TaskNote taskNoteData = taskNoteList.get(i);
            Element taskNoteItem = DocumentHelper.createElement("item");
            String noteSenderJid = taskNoteData.getSenderJid();
            taskNoteItem.addAttribute("sender_jid", noteSenderJid);
            taskNoteItem.addAttribute("date", taskNoteData.getDateStr());
            String noteMessage = taskNoteData.getMessage();
            if (noteMessage != null && noteMessage.equals("")) {
                taskNoteItem.setText(noteMessage);
            }
            note.add(taskNoteItem);
            jidSet.add(noteSenderJid);
        }
        Element reminder = DocumentHelper.createElement("reminder");
        reminder.addAttribute("count", String.valueOf(0));
        item.add(reminder);

        Element parentItemId = DocumentHelper.createElement("parent_item_id");
        parentItemId.setText(taskMessage.getParentItemId());
        item.add(parentItemId);

        List<Message> siblingTaskList = taskMessage.getSiblingTaskList();
        Element siblingItems = getSiblingElement(taskMessage.getItemId(),
                siblingTaskList);
        item.add(siblingItems);

        Element demandStatus = DocumentHelper.createElement("demand_status");
        demandStatus.setText(String.valueOf(taskMessage.getDemandStatus()));
        item.add(demandStatus);

        Element demandDate = DocumentHelper.createElement("demand_date");
        demandDate.setText(taskMessage.getDemandDateStr());
        item.add(demandDate);

        if(taskMessage.getStatus() == Message.STATUS_INBOX){
            Element quotation = QuotationMessageAdapter.getInstance().createElement(taskMessage);
            item.add(quotation);
        }

        Element context = DocumentHelper.createElement("context");
        context.setText("");
        item.add(context);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(taskMessage.getDeleteFlag()));
        item.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            item.add(personInfoElement);
        }

        return item;
    }

    private Element getSiblingElement(String itemId,
            List<Message> siblingTaskList) {
        Element siblingItems = DocumentHelper.createElement("sibling");
        int siblingnCount = 0;
        if (siblingTaskList != null) {
            siblingnCount = siblingTaskList.size();
        }
        siblingItems.addAttribute("count", String.valueOf(siblingnCount));
        if (siblingTaskList == null) {
            return siblingItems;
        }
        List<String> siblingOwnerJidList = extractOwnerJidListFromTaskList(siblingTaskList);
        List<Profile> profileList = new ArrayList<Profile>();
        if (siblingOwnerJidList != null && !siblingOwnerJidList.isEmpty()) {
            profileList = UserAccountManager.getInstance().getProfileList(
                    siblingOwnerJidList);
        }
        Map<String, Profile> profileHashMap = new ConcurrentHashMap<String, Profile>();
        if (profileList != null) {
            for (Profile profile : profileList) {
                if (profile == null) {
                    Log.info("TaskMessageAdapter#getSiblingElement::profile is null.");
                    continue;
                }
                profileHashMap.put(profile.getJid(), profile);
            }
        }
        for (int i = 0; i < siblingnCount; i++) {
            Message siblingTask = siblingTaskList.get(i);
            if (siblingTask == null) {
                Log.info("TaskMessageAdapter#getSiblingElement::siblingTask is null.");
                continue;
            }
            Profile profileData = profileHashMap.get(siblingTask.getOwner());
            if (profileData == null) {
                Log.info("TaskMessageAdapter#getSiblingElement::profileData is null.");
            }
            Element siblingTaskItem = getSiblingTaskItemElement(itemId,
                    siblingTask, profileData);
            if (siblingTaskItem == null) {
                Log.error("TaskMessageAdapter#getSiblingElement::siblingTaskItem is null.");
                continue;
            }
            siblingItems.add(siblingTaskItem);
        }
        return siblingItems;
    }

    public Element getSiblingTaskItemElement(String senderItemId,
            Message siblingTask, Profile profile) {
        if (siblingTask == null) {
            Log.error("TaskMessageAdapter#getSiblingTaskItemElement::siblingTask is null.");
            return null;
        }
        Element siblingTaskItem = DocumentHelper.createElement("item");

        siblingTaskItem.addAttribute("itemid", senderItemId);

        siblingTaskItem.addAttribute("siblingitemid", siblingTask.getItemId());

        String sblingOwnerJid = siblingTask.getOwner();
        siblingTaskItem.addAttribute("ownerjid", sblingOwnerJid);

        String nickName = null;
        String avatarType = null;
        String avatarData = null;
        if (profile != null) {
            nickName = profile.getNickName();
            avatarType = profile.getPhotoType();
            avatarData = profile.getPhotoData();
        } else {
            nickName = GlobalSNSUtils.getUserName(sblingOwnerJid);
            avatarType = "";
            avatarData = "";
        }
        try {
            nickName = URLDecoder.decode(nickName, "UTF-8");
            nickName = URLEncoder.encode(nickName, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            nickName = "";
        }

        siblingTaskItem.addAttribute("ownername", nickName);

        int status = siblingTask.getStatus();
        siblingTaskItem.addAttribute("status", String.valueOf(status));

        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(sblingOwnerJid);
        siblingTaskItem.add(jidElem);
        Element nickNameElem = DocumentHelper.createElement("nickname");
        nickNameElem.setText(nickName);
        siblingTaskItem.add(nickNameElem);
        Element avatarTypeElem = DocumentHelper.createElement("avatartype");
        avatarTypeElem.setText(avatarType);
        siblingTaskItem.add(avatarTypeElem);
        Element avatarDataElem = DocumentHelper.createElement("avatardata");
        avatarDataElem.setText(avatarData);
        siblingTaskItem.add(avatarDataElem);
        Element statusElem = DocumentHelper.createElement("status");
        int accountStatus = Profile.DELETE_FLAG_STATUS_NOMAL;
        if (profile != null) {
            accountStatus = profile.getDeleteFlg();
        }
        statusElem.setText(String.valueOf(accountStatus));
        siblingTaskItem.add(statusElem);

        return siblingTaskItem;
    }

    private List<String> extractOwnerJidListFromTaskList(List<Message> taskList) {
        List<String> ret = new ArrayList<String>();
        if (taskList == null || taskList.isEmpty()) {
            Log.info("extractOwnerJidListFromTaskList::taskList is null or empty.");
            return ret;
        }
        for (Message message : taskList) {
            if (message == null) {
                Log.debug("extractOwnerJidListFromTaskList::message is null.");
                continue;
            }
            String jid = message.getOwner();
            if (jid == null || jid.equals("")) {
                Log.debug("extractOwnerJidListFromTaskList::jid is null or empty.");
                continue;
            }
            ret.add(jid);
        }

        return ret;
    }

    @Deprecated
    public boolean addTaskHundler(Element addElement, JID fromJid, JID toJid) {
        if (addElement == null) {
            Log.error("not addElement");
            return false;
        }

        Element itemElement = addElement.element("item");
        if (itemElement == null) {
            Log.error("not itemElement");
            return false;
        }
        List<Message> taskMessageList = getCommonTaskMessageListFromXMPP(itemElement);
        if (taskMessageList == null) {
            return false;
        }
        int messageCount = taskMessageList.size();
        if (messageCount == 0) {
            return false;
        }
        String fromJidStr = fromJid.toBareJID();
        String toJidStr = toJid.toBareJID();
        boolean ret = true;
        Map<String, List<String>> mapItemIdToSender = new ConcurrentHashMap<String, List<String>>();
        List<Message> regedTaskMessageList = new ArrayList<Message>();
        HashSet<String> ownerHash = new HashSet<String>();
        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateId) {
            lockObject = mLockObjectMapStringToObjectForGenerateId
                    .get(fromJidStr);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateId.put(fromJidStr,
                        lockObject);
            }
        }
        synchronized (lockObject) {
            int regCount = TaskMessageDbHelper.getCreateCount(fromJid);
            boolean isRequestTaskFlg = isRequestTask(itemElement, fromJidStr);
            String parentItemId = "";

            Element statusElement = itemElement.element("status");
            int statusNum = Integer.parseInt(statusElement.getStringValue());

            if (isRequestTaskFlg && (statusNum != Message.STATUS_INBOX)) {
                Message baseTaskMessage = taskMessageList.get(0);
                String accountName = "";
                int atIndex = fromJidStr.indexOf("@");
                if (atIndex > 0) {
                    accountName = fromJidStr.substring(0, atIndex);
                } else {
                    accountName = fromJidStr;
                }

                parentItemId = "task_" + accountName + "_"
                        + String.valueOf(regCount + 1);
                Message parentTaskMessage = createParentTaskMessage(
                        baseTaskMessage, parentItemId, fromJidStr, toJidStr);
                int parentTaskStatus = parentTaskMessage.getStatus();
                if (parentTaskStatus == Message.STATUS_FINISHED
                        || parentTaskStatus == Message.STATUS_REJECTED) {
                    Calendar now = Calendar.getInstance();
                    parentTaskMessage.setCompleteDate(new Timestamp(now
                            .getTimeInMillis()));
                }
                boolean insertedDb = MessageStoreDbHelper
                        .insertMessageToDb(parentTaskMessage);
                if (insertedDb) {
                    List<String> sendToList = createSenderList(parentTaskMessage);
                    mapItemIdToSender.put(parentItemId, sendToList);
                    regedTaskMessageList.add(parentTaskMessage);
                    regCount++;

                } else {
                    ret = false;
                    return ret;
                }
            }
            for (int i = 0; i < messageCount; i++) {
                Message taskMessage = taskMessageList.get(i);
                String accountName = "";
                int atIndex = fromJidStr.indexOf("@");
                if (atIndex > 0) {
                    accountName = fromJidStr.substring(0, atIndex);
                } else {
                    accountName = fromJidStr;
                }
                String itemId = "task_" + accountName + "_"
                        + String.valueOf(regCount + 1);
                taskMessage.setItemId(itemId);
                taskMessage.setMsgFrom(fromJidStr);
                taskMessage.setMsgTo(toJidStr);
                Calendar now = Calendar.getInstance();
                taskMessage.setCreatedAt(new Timestamp(now.getTimeInMillis()));
                taskMessage.setUpdatedAt(new Timestamp(now.getTimeInMillis()));
                taskMessage.setUpdatedBy(fromJidStr);
                if (taskMessage.getClient().equals("")) {
                    taskMessage.setClient(fromJidStr);
                }
                taskMessage.setParentItemId(parentItemId);
                int taskStatus = taskMessage.getStatus();
                if (taskStatus == Message.STATUS_FINISHED
                        || taskStatus == Message.STATUS_REJECTED) {
                    taskMessage.setCompleteDate(new Timestamp(now
                            .getTimeInMillis()));
                }
                boolean insertedDb = MessageStoreDbHelper
                        .insertMessageToDb(taskMessage);
                if (insertedDb) {
                    List<String> sendToList = createSenderList(taskMessage);
                    mapItemIdToSender.put(itemId, sendToList);
                    regedTaskMessageList.add(taskMessage);
                    ownerHash.add(taskMessage.getOwner());
                    regCount++;
                } else {
                    ret = false;
                }
            }
        }
        TaskMessageNotifier.getInstance().notifyTaskMessage(mapItemIdToSender,
                TASK_OPERATION_TYPE.ADD);
        int regedCount = regedTaskMessageList.size();
        Log.debug(String.valueOf(regedCount));
        for (int i = 0; i < regedCount; i++) {
            Message taskMessage = regedTaskMessageList.get(i);
            notifyAddTaskSystemMessage(fromJidStr, taskMessage, ownerHash);
        }
        return ret;
    }

    private boolean isRequestTask(Element itemElement, String fromJid) {
        if (itemElement == null) {
            Log.error("not itemElement");
            return false;
        }
        String owner = "";
        Element ownerElement = itemElement.element("owner");
        owner = ownerElement.getStringValue();
        String client = fromJid;
        Element clientElement = itemElement.element("client");
        if (clientElement != null && !clientElement.getStringValue().equals("")) {
            client = clientElement.getStringValue();
        }
        boolean ret = (!client.equals(owner));
        return ret;
    }

    private Message createParentTaskMessage(Message baseTaskMessage,
            String parentItemId, String fromJidStr, String toJidStr) {
        Message parentTaskMessage = new Message();

        parentTaskMessage.setItemId(parentItemId);
        parentTaskMessage.setMsgType(Message.TYPE_TASK);
        parentTaskMessage.setEntry(baseTaskMessage.getEntry());
        parentTaskMessage.setReplyId(baseTaskMessage.getReplyId());
        parentTaskMessage.setReplyTo(baseTaskMessage.getReplyTo());
        parentTaskMessage.setStartDate(baseTaskMessage.getStartDate());
        parentTaskMessage.setDueDate(baseTaskMessage.getDueDate());
        parentTaskMessage.setGroup(baseTaskMessage.getGroup());
        parentTaskMessage.setStatus(baseTaskMessage.getStatus());
        parentTaskMessage.setPriority(baseTaskMessage.getPriority());
        if (baseTaskMessage.getClient().equals("")) {
            parentTaskMessage.setClient(fromJidStr);
            parentTaskMessage.setOwner(fromJidStr);
        } else {
            parentTaskMessage.setClient(baseTaskMessage.getClient());
            parentTaskMessage.setOwner(baseTaskMessage.getClient());
        }
        parentTaskMessage.setMsgFrom(fromJidStr);
        parentTaskMessage.setMsgTo(toJidStr);
        Calendar now = Calendar.getInstance();
        parentTaskMessage.setCreatedAt(new Timestamp(now.getTimeInMillis()));
        parentTaskMessage.setUpdatedAt(new Timestamp(now.getTimeInMillis()));
        parentTaskMessage.setUpdatedBy(fromJidStr);

        return parentTaskMessage;
    }

    private void notifyAddTaskSystemMessage(String fromJid,
            Message triggerTaskMessage, HashSet<String> ownerHash) {
        if (fromJid == null || triggerTaskMessage == null) {
            Log.error("fromJid or trigerTaskMessage is null");
            return;
        }
        String itemId = triggerTaskMessage.getItemId();
        int taskStatus = triggerTaskMessage.getStatus();
        if (taskStatus == 1 || taskStatus == 2) {
            Log.debug("task is INBOX or ASSIGNING");
            return;
        }
        Log.debug("ParentItemId : " + triggerTaskMessage.getParentItemId());
        Log.debug("triggerTaskMessage client : "
                + triggerTaskMessage.getClient());
        Log.debug("triggerTaskMessage owner : " + triggerTaskMessage.getOwner());
        if (!triggerTaskMessage.getParentItemId().equals("")
                && triggerTaskMessage.getClient().equals(
                        triggerTaskMessage.getOwner())) {
            Log.debug("task is self chilren task");
            return;
        }
        List<Integer> possibleTriggerActionIdList = new ArrayList<Integer>();
        String owner = triggerTaskMessage.getOwner();
        String client = triggerTaskMessage.getClient();
        if (owner == null) {
            Log.error("owner is null");
            return;
        }
        if (owner.equals("")) {
            Log.error("owner is empty");
            return;
        }
        if (client != null) {
            if (!client.equals("")) {
                if (!owner.equals(client)) {
                    possibleTriggerActionIdList
                            .add(SystemMessageTriggerActionId.REQUEST_TASK);
                }
            }
        }
        if (taskStatus == 7 || taskStatus == 8) {
            possibleTriggerActionIdList
                    .add(SystemMessageTriggerActionId.FINISH_TASK);
        }
        possibleTriggerActionIdList.add(SystemMessageTriggerActionId.ADD_TASK);

        int triggerActionId = SystemMessageTriggerActionId
                .getHighestPriorityTriggerActionId(possibleTriggerActionIdList);
        if (triggerActionId == SystemMessageTriggerActionId.NONE) {
            Log.debug("triggerActionId is NONE");
            return;
        }
        List<SystemMessageEntryData> systemMessageEntryDataList = getSystemMessageAddTaskEntryDataList(
                triggerTaskMessage, triggerActionId, ownerHash);
        for (SystemMessageEntryData systemMessageEntryData : systemMessageEntryDataList) {
            SystemMessageAdapter.getInstance().addSystemMessage(fromJid,
                    itemId, systemMessageEntryData.getBodyKey(),
                    systemMessageEntryData.getArgList(),
                    systemMessageEntryData.getTriggerActionId(),
                    systemMessageEntryData.getSenderList());
        }
    }

    private List<Message> getCommonTaskMessageListFromXMPP(Element itemElement) {
        if (itemElement == null) {
            Log.error("not itemElement");
            return null;
        }

        Element entryElement = itemElement.element("entry");
        if (entryElement == null) {
            Log.error("not entryElement");
            return null;
        }

        if (checkTaskEntryElement(entryElement) == false) {
            Log.error("entryElement is invalid");
            return null;
        }
        String entry = entryElement.asXML();

        Element replyIdElement = itemElement.element("reply_id");

        Element replyToElement = itemElement.element("reply_to");

        Element startDateElement = itemElement.element("start_date");

        Element dueDateElement = itemElement.element("due_date");

        Element ownerElement = itemElement.element("owner");

        List<String> ownerList = new ArrayList<String>();
        if (ownerElement != null) {
            GlobalSNSUtils.splitStringToArray(ownerElement.getStringValue(),
                    ownerList);
            if (ownerList.size() <= 0) {
                ownerList.add("");
            }
        } else {
            ownerList.add("");
        }

        Element groupElement = itemElement.element("group");

        Element statusElement = itemElement.element("status");
        if (statusElement == null) {
            Log.error("not statusElement");
            return null;
        }
        int status = 0;
        String statusString = statusElement.getStringValue();
        if (statusString == null || statusString.equals("")) {
            Log.error("status is invalid1");
        }
        try {
            status = Integer.parseInt(statusString);
        } catch (NumberFormatException e) {
            Log.error("status is invalid2");
            return null;
        }
        Element priorityElement = itemElement.element("priority");
        if (priorityElement == null) {
            Log.error("not priorityElement");
            return null;
        }
        int priority = 1;
        String priorityString = priorityElement.getStringValue();
        if (priorityString == null || priorityString.equals("")) {
            Log.error("priority is invalid1");
        }
        try {
            priority = Integer.parseInt(priorityString);
        } catch (NumberFormatException e) {
            Log.error("priority is invalid2");
            return null;
        }

        Element contextElement = itemElement.element("context");
        if (contextElement == null) {
            Log.error("not contextElement");
            return null;
        }

        String client = "";
        Element clientElement = itemElement.element("client");
        if (clientElement != null) {
            client = clientElement.getStringValue();
        }

        String parentItemId = "";
        Element parentItemIdElement = itemElement.element("parent_item_id");
        if (parentItemIdElement != null) {
            parentItemId = parentItemIdElement.getStringValue();
        }

        int ownerCount = ownerList.size();
        List<Message> taskMessageList = new ArrayList<Message>();
        for (int i = 0; i < ownerCount; i++) {
            Message taskMessage = new Message();
            taskMessage.setMsgType(Message.TYPE_TASK);
            taskMessage.setEntry(entry);
            if (replyIdElement != null) {
                taskMessage.setReplyId(replyIdElement.getStringValue());
            }
            if (replyToElement != null) {
                taskMessage.setReplyTo(replyToElement.getStringValue());
            }
            if (startDateElement != null) {
                String startDate = startDateElement.getStringValue();
                Calendar cal = GlobalSNSUtils.parseDateString(startDate);
                if (cal != null) {
                    taskMessage.setStartDate(new Timestamp(cal
                            .getTimeInMillis()));
                }
            }
            if (dueDateElement != null) {
                String dueDate = dueDateElement.getStringValue();
                Calendar cal = GlobalSNSUtils.parseDateString(dueDate);
                if (cal != null) {
                    taskMessage
                            .setDueDate(new Timestamp(cal.getTimeInMillis()));
                }
            }
            taskMessage.setOwner(ownerList.get(i));
            if (groupElement != null) {
                taskMessage.setGroup(groupElement.getStringValue());
            }
            taskMessage.setStatus(status);
            taskMessage.setPriority(priority);
            taskMessage.setClient(client);
            taskMessage.setParentItemId(parentItemId);
            taskMessageList.add(taskMessage);
        }
        return taskMessageList;
    }

    @Deprecated
    public boolean updateTaskHundler(Element updateElement, JID fromJid,
            JID toJid) {
        if (updateElement == null) {
            Log.error("not addElement");
            return false;
        }

        Element itemElement = updateElement.element("item");
        if (itemElement == null) {
            Log.error("not itemElement");
            return false;
        }

        List<Message> taskMessageList = getCommonTaskMessageListFromXMPP(itemElement);
        if (taskMessageList == null) {
            return false;
        }
        int messageCount = taskMessageList.size();
        if (messageCount <= 0) {
            return false;
        }
        Element itemIdElement = itemElement.element("item_id");
        if (itemIdElement == null) {
            Log.error("not itemIdElement");
            return false;
        }
        String itemId = itemIdElement.getStringValue();
        Message dbMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        if (dbMessage == null) {
            Log.error("Target message is not found");
            return false;
        }

        String fromJidStr = fromJid.toBareJID();
        Object lockObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateId) {
            lockObject = mLockObjectMapStringToObjectForGenerateId
                    .get(fromJidStr);
            if (lockObject == null) {
                lockObject = new Object();
                mLockObjectMapStringToObjectForGenerateId.put(fromJidStr,
                        lockObject);
            }
        }
        Map<String, List<String>> mapAddItemIdToSender = new ConcurrentHashMap<String, List<String>>();
        List<Message> regedTaskMessageList = new ArrayList<Message>();
        HashSet<String> ownerHash = new HashSet<String>();
        Message updateTaskMessage = null;
        String parentItemId = dbMessage.getParentItemId();
        boolean ret = true;
        synchronized (lockObject) {
            int regCount = TaskMessageDbHelper.getCreateCount(fromJid);
            boolean isRequestTaskFlg = isRequestTask(itemElement, fromJidStr);
            if (parentItemId == null) {
                parentItemId = "";
            }

            if (isRequestTaskFlg && parentItemId.equals("")) {
                String toJidStr = toJid.toBareJID();
                Message baseTaskMessage = taskMessageList.get(0);
                String accountName = "";
                int atIndex = fromJidStr.indexOf("@");
                if (atIndex > 0) {
                    accountName = fromJidStr.substring(0, atIndex);
                } else {
                    accountName = fromJidStr;
                }
                parentItemId = "task_" + accountName + "_"
                        + String.valueOf(regCount + 1);
                Message parentTaskMessage = createParentTaskMessage(
                        baseTaskMessage, parentItemId, fromJidStr, toJidStr);
                int parentTaskStatus = parentTaskMessage.getStatus();
                if (parentTaskStatus == Message.STATUS_FINISHED
                        || parentTaskStatus == Message.STATUS_REJECTED) {
                    if (baseTaskMessage.getCompleteDate() == null) {
                        Calendar now = Calendar.getInstance();
                        parentTaskMessage.setCompleteDate(new Timestamp(now
                                .getTimeInMillis()));
                    } else {
                        parentTaskMessage.setCompleteDate(baseTaskMessage
                                .getCompleteDate());
                    }
                }
                boolean insertedDb = MessageStoreDbHelper
                        .insertMessageToDb(parentTaskMessage);
                if (insertedDb) {
                    List<String> sendToList = createSenderList(parentTaskMessage);
                    mapAddItemIdToSender.put(parentItemId, sendToList);
                    regCount++;
                } else {
                    return false;
                }
            }
            int updateTaskIndex = -1;
            int ownerCount = taskMessageList.size();
            for (int i = 0; i < ownerCount; i++) {
                if (dbMessage.getOwner().equals(
                        taskMessageList.get(i).getOwner())) {
                    updateTaskIndex = i;
                    break;
                }
            }
            if (updateTaskIndex == -1) {
                updateTaskIndex = 0;
            }
            updateTaskMessage = taskMessageList.get(updateTaskIndex);

            if (!updateTask(itemId, dbMessage, updateTaskMessage, fromJidStr,
                    parentItemId)) {
                return false;
            }
            ownerHash.add(updateTaskMessage.getOwner());

            ret = true;
            for (int i = 0; i < ownerCount; i++) {
                if (i == updateTaskIndex) {
                    continue;
                }
                Message taskMessage = taskMessageList.get(i);

                if (!addTask(regCount, taskMessage, fromJidStr,
                        dbMessage.getMsgTo(), parentItemId)) {
                    ret = false;
                    continue;
                }

                List<String> sendToList = createSenderList(taskMessage);
                mapAddItemIdToSender.put(taskMessage.getItemId(), sendToList);
                regedTaskMessageList.add(taskMessage);
                ownerHash.add(taskMessage.getOwner());
                regCount++;
            }
        }

        if (mapAddItemIdToSender.size() > 0) {
            TaskMessageNotifier.getInstance().notifyTaskMessage(
                    mapAddItemIdToSender, TASK_OPERATION_TYPE.ADD);
        }
        int regedCount = regedTaskMessageList.size();
        for (int i = 0; i < regedCount; i++) {
            Message taskMessage = regedTaskMessageList.get(i);
            notifyAddTaskSystemMessage(fromJidStr, taskMessage, ownerHash);
        }

        boolean isClearDemand = isClearDemandTask(itemId);
        if (isClearDemand) {
            updateTaskMessage = MessageStoreDbHelper
                    .getOneMessageByItemIdWithoutReadInfo(itemId);

            MessageOptionNotifier.getInstance().notifyClearDemandTask(
                    updateTaskMessage, fromJid.toBareJID());
        }

        notifyUpdateTask(itemId, dbMessage, updateTaskMessage, fromJidStr,
                parentItemId);

        return ret;
    }

    private boolean isClearDemandTask(String itemId) {
        boolean ret = false;
        Message updatedTaskMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        if (updatedTaskMessage == null) {
            Log.error("TaskMessageAdapter#notifyClearDemandTassk::Target message is not found");
            return ret;
        }
        if (updatedTaskMessage.getDemandStatus() == Message.DEMAND_STATUS_NON_DEMAND) {
            return ret;
        }

        if (updatedTaskMessage.getStatus() < Message.STATUS_FINISHED) {
            return ret;
        }

        updatedTaskMessage.setDemandStatus(Message.DEMAND_STATUS_NON_DEMAND);
        updatedTaskMessage.setDemandDate(null);
        if (!MessageStoreDbHelper.updateDemandTaskToDb(updatedTaskMessage)) {
            Log.error("TaskMessageAdapter#notifyClearDemandTassk::failed to updateDemandTaskToDb");
            return ret;
        }
        ret = true;
        return ret;

    }

    private boolean addTask(int regCount, Message newTaskMessage,
            String fromJidStr, String toJidStr, String parentItemId) {
        Log.debug("do func TaskMessageAdapter.addTask(...");
        String accountName = "";
        int atIndex = fromJidStr.indexOf("@");
        if (atIndex > 0) {
            accountName = fromJidStr.substring(0, atIndex);
        } else {
            accountName = fromJidStr;
        }
        String addTaskItemId = "task_" + accountName + "_"
                + String.valueOf(regCount + 1);
        newTaskMessage.setItemId(addTaskItemId);
        newTaskMessage.setMsgFrom(fromJidStr);
        newTaskMessage.setMsgTo(toJidStr);
        Calendar now = Calendar.getInstance();
        newTaskMessage.setCreatedAt(new Timestamp(now.getTimeInMillis()));
        newTaskMessage.setUpdatedAt(new Timestamp(now.getTimeInMillis()));
        newTaskMessage.setUpdatedBy(fromJidStr);
        if (newTaskMessage.getClient().equals("")) {
            newTaskMessage.setClient(fromJidStr);
        }
        newTaskMessage.setParentItemId(parentItemId);
        int newTaskStatus = newTaskMessage.getStatus();
        if (newTaskStatus == Message.STATUS_FINISHED
                || newTaskStatus == Message.STATUS_REJECTED) {
            newTaskMessage
                    .setCompleteDate(new Timestamp(now.getTimeInMillis()));
        }
        boolean ret = MessageStoreDbHelper.insertMessageToDb(newTaskMessage);

        return ret;
    }

    private boolean updateTask(String itemId, Message preTaskMessage,
            Message newTaskMessage, String updatedByJidStr, String parentItemId) {
        boolean ret = false;
        newTaskMessage.setItemId(itemId);
        newTaskMessage.setCompleteDate(preTaskMessage.getCompleteDate());
        int taskStatus = newTaskMessage.getStatus();
        int taskPreStatus = preTaskMessage.getStatus();
        Calendar now = Calendar.getInstance();
        if (taskStatus == Message.STATUS_FINISHED
                || taskStatus == Message.STATUS_REJECTED) {
            if (taskPreStatus > Message.STATUS_UNKNOWN
                    && taskPreStatus < Message.STATUS_FINISHED) {
                newTaskMessage.setCompleteDate(new Timestamp(now
                        .getTimeInMillis()));
            }
        } else {
            newTaskMessage.setCompleteDate(null);
        }
        newTaskMessage.setUpdatedAt(new Timestamp(now.getTimeInMillis()));
        newTaskMessage.setUpdatedBy(updatedByJidStr);
        if (newTaskMessage.getClient().equals("")) {
            String client = preTaskMessage.getClient();
            if (client.equals("")) {
                newTaskMessage.setClient(preTaskMessage.getMsgFrom());
            } else {
                newTaskMessage.setClient(client);
            }
        }
        newTaskMessage.setPreviousOwner(preTaskMessage.getOwner());
        newTaskMessage.setParentItemId(parentItemId);

        ret = MessageStoreDbHelper.updateMessageToDb(newTaskMessage);

        return ret;
    }

    private void notifyUpdateTask(String itemId, Message preTaskMessage,
            Message newTaskMessage, String updatedByJidStr, String parentItemId) {
        List<String> sendToList = createSenderList(newTaskMessage);
        Map<String, List<String>> mapItemIdToSender = new ConcurrentHashMap<String, List<String>>();
        mapItemIdToSender.put(itemId, sendToList);
        TaskMessageNotifier.getInstance().notifyTaskMessage(mapItemIdToSender,
                TASK_OPERATION_TYPE.UPDATE);
        String roomId = newTaskMessage.getGroup();
        boolean isCommunity = (!"".equals(roomId));
        if (!isCommunity) {
            notifyUpdateTaskSystemMessage(updatedByJidStr, newTaskMessage,
                    preTaskMessage);
        }

        if (!parentItemId.equals("")) {
            int taskStatus = newTaskMessage.getStatus();
            int taskPreStatus = preTaskMessage.getStatus();
            if (taskStatus != taskPreStatus) {
                int parentTaskNextStatus = calcParentTaskStatus(parentItemId);
                Message parentTaskMessage = MessageStoreDbHelper
                        .getOneMessageByItemIdWithoutReadInfo(parentItemId);
                if (parentTaskNextStatus != -1 || parentTaskMessage != null) {
                    int parentTaskPreStatus = parentTaskMessage.getStatus();
                    if (parentTaskNextStatus != parentTaskPreStatus) {
                        Message preParentTaskMessage = new Message(
                                parentTaskMessage);
                        parentTaskMessage.setStatus(parentTaskNextStatus);
                        Calendar now = Calendar.getInstance();
                        parentTaskMessage.setUpdatedAt(new Timestamp(now
                                .getTimeInMillis()));
                        parentTaskMessage.setUpdatedBy(updatedByJidStr);
                        if (parentTaskNextStatus == 7
                                || parentTaskNextStatus == 8) {
                            if (parentTaskPreStatus > 0
                                    && parentTaskPreStatus < 7) {
                                parentTaskMessage
                                        .setCompleteDate(new Timestamp(now
                                                .getTimeInMillis()));
                            }
                        } else {
                            parentTaskMessage.setCompleteDate(null);
                        }
                        MessageStoreDbHelper
                                .updateMessageToDb(parentTaskMessage);
                        List<String> notifyUpdateList = new ArrayList<String>();
                        Map<String, List<String>> mapParentItemIdToSender = new ConcurrentHashMap<String, List<String>>();
                        if (isCommunity) {
                            CommunityInfo community = CommunityManager
                                    .getInstance().getCommunityInfo(roomId);
                            if (community != null) {
                                List<CommunityMember> communityMembers = community
                                        .getMemberList();
                                int count = communityMembers.size();
                                for (int i = 0; i < count; i++) {
                                    CommunityMember member = communityMembers
                                            .get(i);
                                    if (member == null) {
                                        continue;
                                    }
                                    notifyUpdateList.add(member.getJid());
                                }
                            }
                        } else {
                            String notifyUser = newTaskMessage.getClient();
                            notifyUpdateList.add(notifyUser);
                        }
                        mapParentItemIdToSender.put(parentItemId,
                                notifyUpdateList);
                        TaskMessageNotifier.getInstance().notifyTaskMessage(
                                mapParentItemIdToSender,
                                TASK_OPERATION_TYPE.UPDATE);
                    }
                }
            }
        }
        if (!isCommunity) {
            TaskChangeNotifier.getInstance().sendTaskChangeMessage(
                    newTaskMessage);
        }
    }

    private int calcParentTaskStatus(String parentTaskItemId) {
        int ret = -1;
        List<String> parentTaskItemIds = new ArrayList<String>();
        parentTaskItemIds.add(parentTaskItemId);
        List<Message> childrenTaskList = TaskMessageDbHelper
                .getChildrenTaskList(parentTaskItemIds);
        int childrenCount = childrenTaskList.size();
        for (int i = 0; i < childrenCount; i++) {
            Message childTask = childrenTaskList.get(i);
            if (childTask == null) {
                continue;
            }
            int childStatus = childTask.getStatus();
            if (ret == -1 || ret > childStatus) {
                ret = childStatus;
            }
        }
        return ret;
    }

    private void notifyUpdateTaskSystemMessage(String fromJid,
            Message triggerTaskMessage, Message previousTaskMessage) {
        if (fromJid == null || triggerTaskMessage == null
                || previousTaskMessage == null) {
            return;
        }
        String itemId = triggerTaskMessage.getItemId();
        int taskStatus = triggerTaskMessage.getStatus();
        int taskPreStatus = previousTaskMessage.getStatus();
        if (taskStatus == Message.STATUS_INBOX
                || taskStatus == Message.STATUS_ASSIGNING) {
            return;
        }
        if (taskStatus == Message.STATUS_FINISHED
                || taskStatus == Message.STATUS_REJECTED) {
            if (taskPreStatus == Message.STATUS_FINISHED
                    && taskPreStatus == Message.STATUS_REJECTED) {
                return;
            }
        }
        if (taskPreStatus == Message.STATUS_INBOX) {
            if (taskStatus == Message.STATUS_FINISHED
                    || taskStatus == Message.STATUS_REJECTED) {
                return;
            }
        }
        List<Integer> possibleTriggerActionIdList = new ArrayList<Integer>();
        if (!triggerTaskMessage.getOwner().equals(
                previousTaskMessage.getOwner())) {
            possibleTriggerActionIdList
                    .add(SystemMessageTriggerActionId.REQUEST_TASK);
        } else {
            if (!triggerTaskMessage.getOwner().equals(
                    triggerTaskMessage.getClient())) {
                if (taskStatus > 2 && taskStatus < 7) {
                    if (taskPreStatus == 1 || taskPreStatus == 2
                            || taskPreStatus == 7 || taskPreStatus == 8) {
                        possibleTriggerActionIdList
                                .add(SystemMessageTriggerActionId.REQUEST_TASK);
                    }
                }
            }
        }
        if (taskStatus > 2 && taskStatus < 7) {
            if (taskPreStatus == 1 || taskPreStatus == 2 || taskPreStatus == 7
                    || taskPreStatus == 8) {
                possibleTriggerActionIdList
                        .add(SystemMessageTriggerActionId.ADD_TASK);
            }
        }
        if (taskStatus == 7 || taskStatus == 8) {
            if (taskPreStatus > 0 && taskPreStatus < 7) {
                possibleTriggerActionIdList
                        .add(SystemMessageTriggerActionId.FINISH_TASK);
            }
        }
        int triggerActionId = SystemMessageTriggerActionId
                .getHighestPriorityTriggerActionId(possibleTriggerActionIdList);
        if (triggerActionId == SystemMessageTriggerActionId.NONE) {
            return;
        }
        String bodyKey = "";
        List<String> argList = new ArrayList<String>();
        switch (triggerActionId) {
            case SystemMessageTriggerActionId.FINISH_TASK: {
                bodyKey = "finishTaskSystemMessage_ver20130325";
                if (taskStatus == 8) {
                    bodyKey = "systemMessageRejectTask_ver20150826";
                }
                String title = triggerTaskMessage.getSubStringEntry("title");
                String ownerJid = triggerTaskMessage.getOwner();
                if (title == null) {
                    title = "";
                }
                argList.add(title);
                argList.add(GlobalSNSUtils.getUserName(ownerJid));
            }
                break;
            case SystemMessageTriggerActionId.ADD_TASK:
            case SystemMessageTriggerActionId.REQUEST_TASK: {
                bodyKey = "addTaskSystemMessage";
                String ownerJid = triggerTaskMessage.getOwner();
                argList.add(GlobalSNSUtils.getUserName(ownerJid));
                String title = triggerTaskMessage.getSubStringEntry("title");
                if (title == null) {
                    title = "";
                }
                argList.add(title);
            }
                break;
            default:
                return;
        }
        List<String> sendToList = createSenderList(triggerTaskMessage);
        SystemMessageAdapter.getInstance().addSystemMessage(fromJid, itemId,
                bodyKey, argList, triggerActionId, sendToList);
    }

    private List<String> createSenderList(Message taskMessage) {
        HashSet<String> receiverJidHash = new HashSet<String>();
        int status = taskMessage.getStatus();
        String roomId = taskMessage.getGroup();
        if ("".equals(roomId)) {
            receiverJidHash.add(taskMessage.getUpdatedBy());
            String owner = taskMessage.getOwner();
            if (owner != null && !owner.equals("")
                    && (status != Message.STATUS_INBOX)) {
                receiverJidHash.add(owner);
            }
            String previousOwner = taskMessage.getPreviousOwner();
            if (previousOwner != null && !previousOwner.equals("")
                    && (status != Message.STATUS_INBOX)) {
                receiverJidHash.add(previousOwner);
            }
            String client = taskMessage.getClient();
            if (client != null && !client.equals("")
                    && (status != Message.STATUS_INBOX)) {
                receiverJidHash.add(client);
            }
        } else {
            if (status == Message.STATUS_INBOX) {
                receiverJidHash.add(taskMessage.getUpdatedBy());
            } else {
                CommunityInfo community = null;
                String communityRoomId = taskMessage.getGroup();
                if (communityRoomId != null && !communityRoomId.equals("")) {
                    community = CommunityManager.getInstance()
                            .getCommunityInfo(communityRoomId);
                }
                if (community != null) {
                    List<CommunityMember> communityMembers = community
                            .getMemberList();
                    int count = communityMembers.size();
                    for (int i = 0; i < count; i++) {
                        CommunityMember member = communityMembers.get(i);
                        if (member == null) {
                            continue;
                        }
                        receiverJidHash.add(member.getJid());
                    }
                }
            }
        }
        List<String> notifySystemMessageReceiverList = new ArrayList<String>();
        for (String receiverJid : receiverJidHash) {
            notifySystemMessageReceiverList.add(receiverJid);
        }
        return notifySystemMessageReceiverList;
    }

    private List<String> createSenderListForSystemMessage(Message taskMessage) {
        HashSet<String> receiverJidHash = new HashSet<String>();
        if (!taskMessage.getParentItemId().equals("")) {
            String owner = taskMessage.getOwner();
            if (owner != null && !owner.equals("")) {
                receiverJidHash.add(owner);
            }
        } else {
            receiverJidHash.add(taskMessage.getUpdatedBy());
            String client = taskMessage.getClient();
            if (client != null && !client.equals("")) {
                receiverJidHash.add(client);
            }
        }
        List<String> notifySystemMessageReceiverList = new ArrayList<String>();
        for (String receiverJid : receiverJidHash) {
            notifySystemMessageReceiverList.add(receiverJid);
        }
        return notifySystemMessageReceiverList;
    }

    private List<SystemMessageEntryData> getSystemMessageAddTaskEntryDataList(
            Message taskMessage, int triggerActionId, HashSet<String> ownerHash) {
        List<SystemMessageEntryData> systemMessageEntryDataList = new ArrayList<SystemMessageEntryData>();
        int taskStatus = taskMessage.getStatus();
        int ownerCount = ownerHash.size();
        List<String> senderList = createSenderListForSystemMessage(taskMessage);
        String ownerJid = taskMessage.getOwner();
        String clientJid = taskMessage.getClient();
        String updateByJid = taskMessage.getUpdatedBy();
        String title = taskMessage.getSubStringEntry("title");
        String owner = GlobalSNSUtils.getUserName(ownerJid);
        String client = GlobalSNSUtils.getUserName(clientJid);
        String updateBy = GlobalSNSUtils.getUserName(updateByJid);
        for (String receiverJid : senderList) {
            SystemMessageEntryData systemMessageEntryData = new SystemMessageEntryData();
            if (receiverJid.equals(taskMessage.getUpdatedBy())) {
                if (receiverJid.equals(taskMessage.getClient())
                        && taskMessage.getClient().equals(
                                taskMessage.getOwner())) {
                    boolean isUpdateBy = ownerHash.contains(receiverJid);
                    if (isUpdateBy) {
                        if (ownerCount == 1) {
                            if (taskStatus == 8) {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageRejectTask");
                            } else if (taskStatus == 7) {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageFinishTask");
                            } else {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageAddTask");
                            }
                            systemMessageEntryData.getArgList().add(title);
                            systemMessageEntryData.getArgList().add(owner);
                        } else {
                            if (taskStatus == 8) {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageRejectTaskSelfAndOthers");

                            } else if (taskStatus == 7) {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageFinishTaskSelfAndOthers");

                            } else {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageAddTaskSelfAndOthers");
                            }
                            systemMessageEntryData.getArgList().add(
                                    Integer.toString(ownerCount - 1));
                            systemMessageEntryData.getArgList().add(title);
                            systemMessageEntryData.getArgList().add(updateBy);
                            systemMessageEntryData.getArgList().add(
                                    Integer.toString(ownerCount - 1));
                        }
                    } else {
                        if (ownerCount == 1) {
                            if (taskStatus == 8) {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageRejectTask");
                            } else if (taskStatus == 7) {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageFinishTask");
                            } else {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageRequestTask");
                            }
                            systemMessageEntryData.getArgList().add(title);
                            String childrenOwner = ownerHash.iterator().next();
                            systemMessageEntryData.getArgList().add(
                                    GlobalSNSUtils.getUserName(childrenOwner));
                        } else {
                            if (taskStatus == 8) {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageRejectTaskMulitiOwner");

                            } else if (taskStatus == 7) {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageFinishTaskMulitiOwner");

                            } else {
                                systemMessageEntryData
                                        .setBodyKey("systemMessageRequestTaskMulitiOwner");

                            }
                            systemMessageEntryData.getArgList().add(title);
                            systemMessageEntryData.getArgList().add(
                                    Integer.toString(ownerCount));
                        }
                    }
                } else if (!receiverJid.equals(taskMessage.getClient())) {
                    if (taskMessage.getParentItemId().equals("")
                            && ownerHash.contains(receiverJid)) {
                        continue;
                    }
                    if (ownerCount == 1) {
                        if (taskStatus == 8) {
                            systemMessageEntryData
                                    .setBodyKey("systemMessageRejectTask");
                        } else if (taskStatus == 7) {
                            systemMessageEntryData
                                    .setBodyKey("systemMessageFinishTask");
                        } else {
                            systemMessageEntryData
                                    .setBodyKey("systemMessageAddTask");
                        }
                        systemMessageEntryData.getArgList().add(title);
                        systemMessageEntryData.getArgList().add(owner);

                    } else {
                        if (taskStatus == 8) {
                            systemMessageEntryData
                                    .setBodyKey("systemMessageRejectTaskMulitiOwner");

                        } else if (taskStatus == 7) {
                            systemMessageEntryData
                                    .setBodyKey("systemMessageFinishTaskMulitiOwner");

                        } else {
                            systemMessageEntryData
                                    .setBodyKey("systemMessageAddTaskMulitiOwner");

                        }
                        systemMessageEntryData.getArgList().add(title);
                        systemMessageEntryData.getArgList().add(
                                Integer.toString(ownerCount));
                    }
                }
            } else if (receiverJid.equals(taskMessage.getClient())) {
                if (ownerCount == 1) {
                    if (taskStatus == 8) {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeRejectedTask");
                    } else if (taskStatus == 7) {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeFinishedTask");

                    } else {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeAddedTask");

                    }
                    systemMessageEntryData.getArgList().add(title);
                    systemMessageEntryData.getArgList().add(owner);
                    systemMessageEntryData.getArgList().add(updateBy);
                } else {
                    if (taskStatus == 8) {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeRejectedTaskMulitiOwner");

                    } else if (taskStatus == 7) {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeFinishedTaskMulitiOwner");

                    } else {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeAddedTaskMulitiOwner");

                    }
                    systemMessageEntryData.getArgList().add(title);
                    systemMessageEntryData.getArgList().add(
                            Integer.toString(ownerCount));
                    systemMessageEntryData.getArgList().add(updateBy);
                }
            } else {
                if (receiverJid.equals(taskMessage.getClient())) {
                    if (taskStatus == 8) {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeRejectedTask");
                    } else if (taskStatus == 7) {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeFinishedTask");

                    } else {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeAddedTask");

                    }
                    systemMessageEntryData.getArgList().add(title);
                    systemMessageEntryData.getArgList().add(owner);
                    systemMessageEntryData.getArgList().add(updateBy);
                } else {
                    if (taskStatus == 8) {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeRejectedRequestTask");

                    } else if (taskStatus == 7) {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeFinishedRequestTask");

                    } else {
                        systemMessageEntryData
                                .setBodyKey("systemMessageBeRequestedTask");

                    }
                    systemMessageEntryData.getArgList().add(title);
                    systemMessageEntryData.getArgList().add(client);
                }
            }
            systemMessageEntryData.setTriggerActionId(triggerActionId);
            systemMessageEntryData.getSenderList().add(receiverJid);
            systemMessageEntryDataList.add(systemMessageEntryData);
        }

        return systemMessageEntryDataList;
    }

    private boolean checkTaskEntryElement(Element entryElement) {
        if (entryElement == null) {
            Log.error("not entryElement");
            return false;
        }
        Element titleElement = entryElement.element("title");
        if (titleElement == null) {
            Log.error("not titleElement");
            return false;
        }

        Element bodyElement = entryElement.element("body");
        if (bodyElement == null) {
            Log.error("not bodyElement");
            return false;
        }

        Element progressElement = entryElement.element("progress");
        if (progressElement == null) {
            Log.error("not progressElement");
            return false;
        }

        Element spentTimeElement = entryElement.element("spent_time");
        if (spentTimeElement == null) {
            Log.error("not spentTimeElement");
            return false;
        }

        Element estimatedTimeElement = entryElement.element("estimated_time");
        if (estimatedTimeElement == null) {
            Log.error("not estimatedTimeElement");
            return false;
        }

        Element remainingTimeElement = entryElement.element("remaining_time");
        if (remainingTimeElement == null) {
            Log.error("not remainingTimeElement");
            return false;
        }

        Element goalElement = entryElement.element("goal");
        if (goalElement == null) {
            Log.error("not goalElement");
            return false;
        }

        Element alertElement = entryElement.element("alert");
        if (alertElement == null) {
            Log.error("not alertElement");
            return false;
        }
        return true;
    }

    public boolean checkMessageAuthor(Message message, String fromJid) {
        boolean ret = false;
        int status = message.getStatus();
        String msgFrom = message.getMsgFrom();
        String owner = message.getOwner();
        String client = message.getClient();
        String roomId = message.getGroup();
        String parentItemId = message.getParentItemId();

        if ("".equals(roomId)) {
            if (msgFrom.equals(fromJid) || owner.equals(fromJid)
                    || client.equals(fromJid)) {
                if (status == Message.STATUS_INBOX) {
                    ret = true;
                } else if ("".equals(parentItemId)) {
                    ret = true;
                }
            }
        } else {
            if (status == Message.STATUS_INBOX) {
                if (msgFrom.equals(fromJid) || owner.equals(fromJid)
                        || client.equals(fromJid)) {
                    ret = true;
                }
            } else {
                if (!CommunityManager.getInstance().isMember(roomId, fromJid)) {
                    return ret;
                }
                if ("".equals(parentItemId)) {
                    ret = true;
                }
            }
        }
        return ret;
    }

    public List<String> getDeleteItemId(String itemId) {

        List<String> retList = new ArrayList<String>();

        retList.add(itemId);

        List<Message> childrenTaskList = TaskMessageDbHelper
                .getChildrenTaskList(Arrays.asList(itemId));

        for (Message childrenTask : childrenTaskList) {
            retList.add(childrenTask.getItemId());
        }

        return retList;
    }

    public void notifyDeleteMessage(Message message, JID fromJid) {

        int status = message.getStatus();
        if (status == Message.STATUS_INBOX) {
            return;
        }

        Set<JID> reciverJidList = new HashSet<JID>();

        String owner = message.getOwner();
        if (!owner.equals("") && !owner.equals(fromJid.toBareJID())) {
            reciverJidList.add(new JID(owner));
        }

        notifyDeleteSystemMessage(reciverJidList, fromJid, message);
    }

    private void notifyDeleteSystemMessage(Set<JID> receiverJidList,
            JID fromJid, Message message) {

        Log.debug("Message#getParentItemId():" + message.getParentItemId());
        Log.debug("Message#getClient():" + message.getClient());
        Log.debug("Message#getOwner():" + message.getOwner());

        if (message.getParentItemId().isEmpty() == false
                && message.getClient().equals(message.getOwner())) {

            Log.debug("task is self children task");

            return;
        }

        List<String> argList = new ArrayList<String>();
        {
            argList.add(message.getSubStringEntry("title"));

            argList.add(GlobalSNSUtils.getUserName(fromJid.toBareJID()));
        }

        int triggerActionId = SystemMessageTriggerActionId.DELETE_TASK;

        for (JID receiverJid : receiverJidList) {

            if (receiverJid == null) {
                continue;
            }

            String bodyKey;
            {
                if (receiverJid.toBareJID().equals(message.getClient())) {
                    bodyKey = "systemMessageDeleteTask";
                }

                else {
                    bodyKey = "systemMessageBeDeletedTask";
                }
            }

            List<String> sendToList = new ArrayList<String>();
            sendToList.add(receiverJid.toBareJID());

            Log.debug("message.getItemId():" + message.getItemId());
            Log.debug("receiverJid.toBareJID():" + receiverJid.toBareJID());

            SystemMessageAdapter.getInstance().addSystemMessage(
                    fromJid.toBareJID(), message.getItemId(), bodyKey, argList,
                    triggerActionId, sendToList);
        }
    }

    public IQ receiveAddTask(IQ iq) {
        Log.debug("do func TaskMessageAdapter.receiveAddTask(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("TaskMessageAdapter#receiveAddTask::iq is null");
            return ret;
        }
        Message requestedTaskMessage = getRequestedTaskMessageFromAddOrUpdateMessageXMPP(iq);
        if (requestedTaskMessage == null) {
            Log.error("TaskMessageAdapter#receiveAddTask::requestedTaskMessage is null");
            return ret;
        }
        boolean isCommunity = false;
        JID requestedJid = iq.getFrom();
        String requestedJidStr = requestedJid.toBareJID();
        JID toJid = iq.getTo();
        String roomId = requestedTaskMessage.getGroup();
        if (!"".equals(roomId)) {
            if (!CommunityManager.getInstance().isMember(roomId,
                    requestedJidStr)) {
                Log.error("TaskMessageAdapter#receiveAddTask:: "
                        + requestedJidStr + " is not community member. roomId="
                        + roomId);
                return ret;
            }
            isCommunity = true;
        }

        CreatedTaskData createdTaskData = addTask(requestedTaskMessage,
                requestedJid, toJid);
        if (createdTaskData == null) {
            Log.error("TaskMessageAdapter#receiveAddTask::createdTaskData is null");
            return ret;
        }
        Message baseTask = createdTaskData.getBaseTask();
        if (baseTask == null && createdTaskData.getChildTaskList().size() <= 0) {
            Log.error("TaskMessageAdapter#receiveAddTask::createdTaskData is invalid");
            return ret;
        }

        Map<String, List<String>> mapItemIdToSender = new ConcurrentHashMap<String, List<String>>();
        HashSet<String> ownerHash = new HashSet<String>();
        if (baseTask != null) {
            List<String> sendToList = createSenderList(baseTask);
            mapItemIdToSender.put(baseTask.getItemId(), sendToList);
        }
        List<Message> childrenTaskList = createdTaskData.getChildTaskList();
        for (Message childTask : childrenTaskList) {
            if (childTask == null) {
                continue;
            }
            List<String> sendToList = createSenderList(childTask);
            mapItemIdToSender.put(childTask.getItemId(), sendToList);
            String owner = childTask.getOwner();
            if (!owner.equals("")) {
                ownerHash.add(owner);
            }
        }

        if(requestedTaskMessage.getGroup() != null &&
           requestedTaskMessage.getGroup().indexOf("community_") == 0)
            TaskNoteStoreDbHelper.updateLastUpdateDate(requestedTaskMessage.getGroup());

        TaskMessageNotifier.getInstance().notifyTaskMessage(mapItemIdToSender,
                TASK_OPERATION_TYPE.ADD);

        if (!isCommunity) {
            if (baseTask != null) {
                notifyAddTaskSystemMessage(requestedJidStr, baseTask, ownerHash);
            }
            for (Message childTask : childrenTaskList) {
                notifyAddTaskSystemMessage(requestedJidStr, childTask,
                        ownerHash);
            }
        }

        if (baseTask == null) {
            baseTask = createdTaskData.getChildTaskList().get(0);
        }
        ret = createAddTaskResponsePacket(iq, baseTask);

        return ret;
    }

    public IQ receiveUpdateTask(IQ iq) {
        Log.debug("do func TaskMessageAdapter.receiveUpdateTask(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("TaskMessageAdapter#receiveUpdateTask::iq is null");
            return ret;
        }
        Message requestedTaskMessage = getRequestedTaskMessageFromAddOrUpdateMessageXMPP(iq);
        if (requestedTaskMessage == null) {
            Log.error("TaskMessageAdapter#receiveUpdateTask::requestedTaskMessage is null");
            return ret;
        }

        String itemId = requestedTaskMessage.getItemId();
        Message dbMessage = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        if (dbMessage == null) {
            Log.error("TaskMessageAdapter#receiveUpdateTask::Target message is not found");
            return ret;
        }

        boolean isCommunity = false;
        JID requestedJid = iq.getFrom();
        String requestedJidStr = requestedJid.toBareJID();
        String roomId = requestedTaskMessage.getGroup();
        if (!"".equals(roomId)) {
            isCommunity = true;
        }

        String dbMessageGroup = dbMessage.getGroup();
        int dbMessageStatus = dbMessage.getStatus();
        if (dbMessageStatus == Message.STATUS_INBOX
                && !dbMessageGroup.equals("")
                && requestedTaskMessage.getStatus() != Message.STATUS_INBOX) {
            if (!dbMessageGroup.equals(roomId) && !"".equals("")) {
                Log.error("TaskMessageAdapter#receiveUpdateTask::can't change group 1");
                return ret;
            }
        } else if (requestedTaskMessage.getStatus() != Message.STATUS_INBOX) {
            if (!dbMessageGroup.equals(roomId)) {
                Log.error("TaskMessageAdapter#receiveUpdateTask::can't change group 2");
                return ret;
            }
        }

        if (isCommunity) {
            if (!CommunityManager.getInstance().isMember(roomId,
                    requestedJidStr)) {
                Log.error("TaskMessageAdapter#receiveUpdateTask:: "
                        + requestedJidStr + " is not community member. roomId="
                        + roomId);
                return ret;
            }
        }

        JID toJid = iq.getTo();
        UpdatedTaskData updatedTaskData = updateTask(requestedTaskMessage,
                dbMessage, requestedJid, toJid);
        if (updatedTaskData == null) {
            Log.error("TaskMessageAdapter#receiveUpdateTask::updatedTaskData is null.");
            return ret;
        }
        Message updatedTask = updatedTaskData.getUpdateTask();
        if (updatedTask == null) {
            Log.error("TaskMessageAdapter#receiveUpdateTask::updatedTask is null.");
            return ret;
        }
        HashSet<String> ownerHash = new HashSet<String>();
        String updateTaskOwner = updatedTask.getOwner();
        if (updateTaskOwner != null && !updateTaskOwner.equals("")) {
            ownerHash.add(updateTaskOwner);
        }

        Map<String, List<String>> mapAddItemIdToSender = new ConcurrentHashMap<String, List<String>>();
        Message addedParentTask = updatedTaskData.getAddParentTask();
        if (addedParentTask != null) {
            List<String> sendToList = createSenderList(addedParentTask);
            mapAddItemIdToSender.put(addedParentTask.getItemId(), sendToList);
        }
        List<Message> addedTaskList = updatedTaskData.getAddTaskList();
        for (Message taskMessage : addedTaskList) {
            List<String> sendToList = createSenderList(taskMessage);
            mapAddItemIdToSender.put(taskMessage.getItemId(), sendToList);
            String addedTaskOwner = taskMessage.getOwner();
            if (addedTaskOwner != null && !addedTaskOwner.equals("")) {
                ownerHash.add(addedTaskOwner);
            }
        }
        if (mapAddItemIdToSender.size() > 0) {
            TaskMessageNotifier.getInstance().notifyTaskMessage(
                    mapAddItemIdToSender, TASK_OPERATION_TYPE.ADD);
        }

        if (!isCommunity) {
            for (Message taskMessage : addedTaskList) {
                notifyAddTaskSystemMessage(requestedJidStr, taskMessage,
                        ownerHash);
            }
        }

        boolean isClearDemand = isClearDemandTask(updatedTask.getItemId());
        if (isClearDemand) {
            updatedTask = MessageStoreDbHelper
                    .getOneMessageByItemIdWithoutReadInfo(itemId);
            MessageOptionNotifier.getInstance().notifyClearDemandTask(
                    updatedTask, requestedJidStr);
        }

        notifyUpdateTask(itemId, dbMessage, updatedTask, requestedJidStr,
                updatedTask.getParentItemId());

        if(requestedTaskMessage.getGroup() != null &&
           requestedTaskMessage.getGroup().indexOf("community_") == 0)
            TaskNoteStoreDbHelper.updateLastUpdateDate(requestedTaskMessage.getGroup());

        ret = createUpdateTaskResponsePacket(iq, updatedTask);
        return ret;
    }

    private CreatedTaskData addTask(Message taskMessage, JID requestedJid,
            JID toJid) {
        Log.debug("do func TaskMessageAdapter.addTask(...");
        CreatedTaskData ret = null;
        if (requestedJid == null) {
            Log.error("TaskMessageAdapter#addTask::requestedJid is null");
            return ret;
        }
        if (toJid == null) {
            Log.error("TaskMessageAdapter#addTask::toJid is null");
            return ret;
        }
        if (taskMessage == null) {
            Log.error("TaskMessageAdapter#addTask::taskMessage is null");
            return ret;
        }
        String requestedJidStr = requestedJid.toBareJID();
        String roomId = taskMessage.getGroup();
        boolean isCommunity = false;
        if (!"".equals(roomId)) {
            isCommunity = true;
        }
        String client = taskMessage.getClient();
        if (!isCommunity && "".equals(client)) {
            client = requestedJidStr;
            taskMessage.setClient(requestedJidStr);
        }
        String owner = taskMessage.getOwner();
        boolean isRequested = false;
        if (!owner.equals("") && !client.equals("") && !client.equals(owner)) {
            isRequested = true;
        }
        List<String> ownerList = new ArrayList<String>();
        GlobalSNSUtils.splitStringToArray(owner, ownerList);
        if (ownerList.size() <= 0) {
            ownerList.add("");
        }
        boolean isInbox = (taskMessage.getStatus() == Message.STATUS_INBOX);
        if (!isInbox && isCommunity) {
            if (!client.equals("")
                    && !CommunityManager.getInstance().isMember(roomId, client)) {
                Log.warn("TaskMessageAdapter#addTask::client is not member. client="
                        + client + " roomId=" + roomId);
                return ret;
            }
            List<String> newOwnerList = new ArrayList<String>();
            for (String dividedOwner : ownerList) {
                if (dividedOwner == null) {
                    continue;
                }
                if (dividedOwner.equals("")) {
                    newOwnerList.add(dividedOwner);
                } else if (CommunityManager.getInstance().isMember(roomId,
                        dividedOwner)) {
                    newOwnerList.add(dividedOwner);
                } else {
                    Log.warn("TaskMessageAdapter#addTask::dividedOwner is not member. owner="
                            + dividedOwner + " roomId=" + roomId);
                }
            }
            ownerList = newOwnerList;
        }

        Object lockJidObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateId) {
            lockJidObject = mLockObjectMapStringToObjectForGenerateId
                    .get(requestedJidStr);
            if (lockJidObject == null) {
                lockJidObject = new Object();
                mLockObjectMapStringToObjectForGenerateId.put(requestedJidStr,
                        lockJidObject);
            }
        }
        CreatedTaskData createdTaskData = null;
        synchronized (lockJidObject) {
            int regCount = TaskMessageDbHelper.getCreateCount(requestedJid);
            createdTaskData = new CreatedTaskData();
            String toJidStr = toJid.toBareJID();
            String parentItemId = "";
            if (isRequested && !isInbox) {
                String accountName = "";
                int atIndex = requestedJidStr.indexOf("@");
                if (atIndex > 0) {
                    accountName = requestedJidStr.substring(0, atIndex);
                } else {
                    accountName = requestedJidStr;
                }

                parentItemId = "task_" + accountName + "_"
                        + String.valueOf(regCount + 1);
                Message parentTaskMessage = createParentTaskMessage(
                        taskMessage, parentItemId, requestedJidStr, toJidStr);
                int parentTaskStatus = parentTaskMessage.getStatus();
                if (parentTaskStatus == Message.STATUS_FINISHED
                        || parentTaskStatus == Message.STATUS_REJECTED) {
                    Calendar now = Calendar.getInstance();
                    parentTaskMessage.setCompleteDate(new Timestamp(now
                            .getTimeInMillis()));
                }
                boolean insertedDb = MessageStoreDbHelper
                        .insertMessageToDb(parentTaskMessage);
                if (insertedDb) {
                    Message addedTaskMessage = MessageAdapter.getInstance()
                            .getMessageWithoutReadInfo(
                                    parentTaskMessage.getItemId());
                    if (addedTaskMessage == null) {
                        Log.error("TaskMessageAdapter#addTask::addedTaskMessage(parent) is null.");
                        return ret;
                    }
                    createdTaskData.setBaseTask(addedTaskMessage);
                    regCount++;

                } else {
                    Log.error("TaskMessageAdapter#addTask::Failed to insert parent task.");
                    return ret;
                }
            }

            for (String ownerJid : ownerList) {
                String accountName = "";
                int atIndex = requestedJidStr.indexOf("@");
                if (atIndex > 0) {
                    accountName = requestedJidStr.substring(0, atIndex);
                } else {
                    accountName = requestedJidStr;
                }
                String itemId = "task_" + accountName + "_"
                        + String.valueOf(regCount + 1);
                Message childTaskMessage = createTaskFromBaseTask(taskMessage,
                        itemId, requestedJidStr, toJidStr, ownerJid,
                        parentItemId);
                boolean insertedDb = MessageStoreDbHelper
                        .insertMessageToDb(childTaskMessage);
                if (insertedDb) {
                    Message addedTaskMessage = MessageAdapter.getInstance()
                            .getMessageWithoutReadInfo(
                                    childTaskMessage.getItemId());
                    if (addedTaskMessage == null) {
                        Log.error("TaskMessageAdapter#addTask::addedTaskMessage(child) is null.");
                        continue;
                    }
                    List<Message> childTaskList = createdTaskData
                            .getChildTaskList();
                    childTaskList.add(addedTaskMessage);
                    regCount++;

                } else {
                    Log.error("TaskMessageAdapter#addTask::Failed to insert child task.");
                }
            }
        }

        ret = createdTaskData;
        return ret;
    }

    private Message createTaskFromBaseTask(Message baseTask, String itemId,
            String requestedJid, String toJid, String ownerJid,
            String parentItemId) {
        Log.debug("do func TaskMessageAdapter.createTaskFromBaseTask(...");
        Message taskMessage = new Message();

        taskMessage.setMsgType(Message.TYPE_TASK);
        taskMessage.setEntry(baseTask.getEntry());
        taskMessage.setReplyId(baseTask.getReplyId());
        taskMessage.setReplyTo(baseTask.getReplyTo());
        taskMessage.setStartDate(baseTask.getStartDate());
        taskMessage.setDueDate(baseTask.getDueDate());
        taskMessage.setGroup(baseTask.getGroup());
        taskMessage.setStatus(baseTask.getStatus());
        taskMessage.setPriority(baseTask.getPriority());
        taskMessage.setClient(baseTask.getClient());
        taskMessage.setOwner(ownerJid);

        taskMessage.setMsgFrom(requestedJid);
        taskMessage.setMsgTo(toJid);
        Calendar now = Calendar.getInstance();
        taskMessage.setCreatedAt(new Timestamp(now.getTimeInMillis()));
        taskMessage.setUpdatedAt(new Timestamp(now.getTimeInMillis()));
        taskMessage.setUpdatedBy(requestedJid);
        taskMessage.setItemId(itemId);
        if(baseTask.getStatus() == Message.STATUS_INBOX &&
           baseTask.getQuotationItemId() != null){
            taskMessage.setQuotationItemId(baseTask.getQuotationItemId());
        }
        taskMessage.setParentItemId(parentItemId);
        int taskStatus = baseTask.getStatus();
        if (taskStatus == Message.STATUS_FINISHED
                || taskStatus == Message.STATUS_REJECTED) {
            taskMessage.setCompleteDate(new Timestamp(now.getTimeInMillis()));
        }
        return taskMessage;
    }

    @SuppressWarnings("unused")
    private UpdatedTaskData updateTask(Message requestTaskMessage,
            Message dbMessage, JID requestedJid, JID toJid) {
        UpdatedTaskData ret = null;
        if (requestedJid == null) {
            Log.error("TaskMessageAdapter#updateTask::requestedJid is null");
            return ret;
        }
        if (toJid == null) {
            Log.error("TaskMessageAdapter#updateTask::toJid is null");
            return ret;
        }
        if (requestTaskMessage == null) {
            Log.error("TaskMessageAdapter#updateTask::taskMessage is null");
            return ret;
        }
        if (dbMessage == null) {
            Log.error("TaskMessageAdapter#updateTask::dbMessage is null");
            return ret;
        }

        String requestedJidStr = requestedJid.toBareJID();

        String roomId = requestTaskMessage.getGroup();
        boolean isCommunity = false;
        if (!"".equals(roomId)) {
            isCommunity = true;
        }
        String client = requestTaskMessage.getClient();
        if (!isCommunity && "".equals(client)) {
            client = dbMessage.getClient();
            requestTaskMessage.setClient(client);
        }
        String owner = requestTaskMessage.getOwner();
        boolean isRequested = false;
        if (!owner.equals("") && !client.equals("") && !client.equals(owner)) {
            isRequested = true;
        }
        String parentItemId = dbMessage.getParentItemId();
        if (parentItemId == null) {
            parentItemId = "";
        }

        List<String> ownerList = new ArrayList<String>();
        GlobalSNSUtils.splitStringToArray(owner, ownerList);
        if (ownerList.size() <= 0) {
            ownerList.add("");
        }
        if (!parentItemId.equals("") && ownerList.size() > 1) {
            Log.error("TaskMessageAdapter#updateTask::parentItemId is Exist. So, can't divid owner.");
            return ret;
        }
        boolean isInbox = (requestTaskMessage.getStatus() == Message.STATUS_INBOX);
        if (!isInbox && isCommunity) {
            if (!client.equals("")
                    && !CommunityManager.getInstance().isMember(roomId, client)) {
                Log.warn("TaskMessageAdapter#updateTask::client is not member. client="
                        + client + " roomId=" + roomId);
                return ret;
            }
            List<String> newOwnerList = new ArrayList<String>();
            for (String dividedOwner : ownerList) {
                if (dividedOwner == null) {
                    continue;
                }
                if (dividedOwner.equals("")) {
                    newOwnerList.add(dividedOwner);
                } else if (CommunityManager.getInstance().isMember(roomId,
                        dividedOwner)) {
                    newOwnerList.add(dividedOwner);
                } else {
                    Log.warn("TaskMessageAdapter#updateTask::dividedOwner is not member. owner="
                            + dividedOwner + " roomId=" + roomId);
                }
            }
            ownerList = newOwnerList;
        }

        UpdatedTaskData updatedTaskData = new UpdatedTaskData();
        Object lockJidObject = null;
        synchronized (mLockObjectMapStringToObjectForGenerateId) {
            lockJidObject = mLockObjectMapStringToObjectForGenerateId
                    .get(requestedJid.toBareJID());
            if (lockJidObject == null) {
                lockJidObject = new Object();
                mLockObjectMapStringToObjectForGenerateId.put(
                        requestedJid.toBareJID(), lockJidObject);
            }
        }
        synchronized (lockJidObject) {
            int regCount = TaskMessageDbHelper.getCreateCount(requestedJid);
            String accountName = "";
            int atIndex = requestedJidStr.indexOf("@");
            if (atIndex > 0) {
                accountName = requestedJidStr.substring(0, atIndex);
            } else {
                accountName = requestedJidStr;
            }
            if (isRequested && parentItemId.equals("")) {
                String toJidStr = toJid.toBareJID();
                parentItemId = "task_" + accountName + "_"
                        + String.valueOf(regCount + 1);
                Message parentTaskMessage = createParentTaskMessage(
                        requestTaskMessage, parentItemId, requestedJidStr,
                        toJidStr);
                int parentTaskStatus = parentTaskMessage.getStatus();
                if (parentTaskStatus == Message.STATUS_FINISHED
                        || parentTaskStatus == Message.STATUS_REJECTED) {
                    Calendar now = Calendar.getInstance();
                    parentTaskMessage.setCompleteDate(new Timestamp(now
                            .getTimeInMillis()));
                }
                boolean insertedDb = MessageStoreDbHelper
                        .insertMessageToDb(parentTaskMessage);
                if (insertedDb) {
                    Message addedTaskMessage = MessageAdapter.getInstance()
                            .getMessageWithoutReadInfo(
                                    parentTaskMessage.getItemId());
                    if (addedTaskMessage == null) {
                        Log.error("TaskMessageAdapter#updateTask::addedTaskMessage(parent) is null.");
                        return ret;
                    }
                    updatedTaskData.setAddParentTask(addedTaskMessage);
                    regCount++;

                } else {
                    Log.error("TaskMessageAdapter#updateTask::Faild to insert Message To Db (parent).");
                    return ret;
                }
            }
            int updateTaskIndex = -1;
            int ownerCount = ownerList.size();
            for (int i = 0; i < ownerCount; i++) {
                if (dbMessage.getOwner().equals(ownerList.get(i))) {
                    updateTaskIndex = i;
                    break;
                }
            }
            if (updateTaskIndex == -1) {
                updateTaskIndex = 0;
            }
            String ownerForUpdate = ownerList.get(updateTaskIndex);
            Message updateMessage = createTaskFromBaseTask(requestTaskMessage,
                    dbMessage.getItemId(), requestedJidStr,
                    dbMessage.getMsgTo(), ownerForUpdate, parentItemId);
            updateMessage.setId(dbMessage.getId());
            updateMessage.setCreatedAt(dbMessage.getCreatedAt());
            updateMessage.setMsgFrom(dbMessage.getMsgFrom());
            updateMessage.setCompleteDate(dbMessage.getCompleteDate());
            int taskStatus = updateMessage.getStatus();
            int taskPreStatus = dbMessage.getStatus();
            Calendar now = Calendar.getInstance();
            if (taskStatus == Message.STATUS_FINISHED
                    || taskStatus == Message.STATUS_REJECTED) {
                if (taskPreStatus > Message.STATUS_UNKNOWN
                        && taskPreStatus < Message.STATUS_FINISHED) {
                    updateMessage.setCompleteDate(new Timestamp(now
                            .getTimeInMillis()));
                }
            } else {
                updateMessage.setCompleteDate(null);
            }
            boolean isUpdatedDb = MessageStoreDbHelper
                    .updateMessageToDb(updateMessage);
            if (isUpdatedDb) {
                Message updatedTaskMessage = MessageAdapter.getInstance()
                        .getMessageWithoutReadInfo(updateMessage.getItemId());
                if (updateMessage == null) {
                    Log.error("TaskMessageAdapter#updateTask::updatedTaskMessage is null.");
                    return ret;
                }
                updatedTaskMessage.setPreviousOwner(dbMessage.getOwner());
                updatedTaskData.setUpdateTask(updatedTaskMessage);

            } else {
                Log.error("TaskMessageAdapter#updateTask::Faild to update Message To Db (parent).");
                return ret;
            }

            for (int i = 0; i < ownerCount; i++) {
                if (i == updateTaskIndex) {
                    continue;
                }
                String ownerForNewAdd = ownerList.get(i);
                String addTaskItemId = "task_" + accountName + "_"
                        + String.valueOf(regCount + 1);
                Message newAddTask = createTaskFromBaseTask(requestTaskMessage,
                        addTaskItemId, requestedJidStr, dbMessage.getMsgTo(),
                        ownerForNewAdd, parentItemId);
                boolean isAddedDb = MessageStoreDbHelper
                        .insertMessageToDb(newAddTask);
                if (isAddedDb) {
                    Message addedTaskMessage = MessageAdapter.getInstance()
                            .getMessageWithoutReadInfo(newAddTask.getItemId());
                    if (addedTaskMessage == null) {
                        Log.error("TaskMessageAdapter#updateTask::addedTaskMessage is null.");
                        return ret;
                    }
                    updatedTaskData.getAddTaskList().add(addedTaskMessage);
                    regCount++;

                } else {
                    Log.error("TaskMessageAdapter#updateTask::Faild to update Message To Db (new).");
                }
            }
        }

        ret = updatedTaskData;
        return ret;
    }

    private Message getRequestedTaskMessageFromAddOrUpdateMessageXMPP(IQ iq) {
        Message ret = null;
        if (iq == null) {
            Log.error("TaskMessageAdapter#getRequestedTaskMessageFromAddOrUpdateMessageXMPP::iq is null");
            return ret;
        }
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("TaskMessageAdapter#getRequestedTaskMessageFromAddOrUpdateMessageXMPP::not type set");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("TaskMessageAdapter#getRequestedTaskMessageFromAddOrUpdateMessageXMPP::messageElem is null");
            return ret;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("TaskMessageAdapter#getRequestedTaskMessageFromAddOrUpdateMessageXMPP::contentElem is null");
            return ret;
        }
        Attribute typeAttr = contentElem.attribute("type");
        String type = typeAttr.getValue();
        if (!IQMessageSendHandler.ContentType.Task.equals(ContentType
                .toType(type))) {
            Log.error("TaskMessageAdapter#getRequestedTaskMessageFromAddOrUpdateMessageXMPP::not type Community");
            return ret;
        }
        ret = getCommonTaskMessageFromXMPP(contentElem);
        return ret;
    }

    private Message getCommonTaskMessageFromXMPP(Element contentElement) {
        Log.debug("do func TaskMessageAdapter.getCommonTaskMessageFromXMPP(...");

        Message ret = null;
        if (contentElement == null) {
            Log.error("not itemElement");
            return ret;
        }

        Element itemIdElement = contentElement.element("item_id");

        Element entryElement = contentElement.element("entry");
        if (entryElement == null) {
            Log.error("not entryElement");
            return ret;
        }

        if (checkTaskEntryElement(entryElement) == false) {
            Log.error("entryElement is invalid");
            return ret;
        }

        Element replyIdElement = contentElement.element("reply_id");

        Element replyToElement = contentElement.element("reply_to");

        Element startDateElement = contentElement.element("start_date");

        Element dueDateElement = contentElement.element("due_date");

        String owner = "";
        Element ownerElement = contentElement.element("owner");
        if (ownerElement != null) {
            owner = ownerElement.getStringValue();
        }

        Element groupElement = contentElement.element("group");

        Element statusElement = contentElement.element("status");
        if (statusElement == null) {
            Log.error("not statusElement");
            return ret;
        }
        int status = 0;
        String statusString = statusElement.getStringValue();
        if (statusString == null || statusString.equals("")) {
            Log.error("status is invalid1");
        }
        try {
            status = Integer.parseInt(statusString);
        } catch (NumberFormatException e) {
            Log.error("status is invalid2");
            return ret;
        }
        Element priorityElement = contentElement.element("priority");
        if (priorityElement == null) {
            Log.error("not priorityElement");
            return ret;
        }
        int priority = 1;
        String priorityString = priorityElement.getStringValue();
        if (priorityString == null || priorityString.equals("")) {
            Log.error("priority is invalid1");
        }
        try {
            priority = Integer.parseInt(priorityString);
        } catch (NumberFormatException e) {
            Log.error("priority is invalid2");
            return ret;
        }

        Element contextElement = contentElement.element("context");
        if (contextElement == null) {
            Log.error("not contextElement");
            return ret;
        }

        String client = "";
        Element clientElement = contentElement.element("client");
        if (clientElement != null) {
            client = clientElement.getStringValue();
        }

        Element attachedItemsElem = contentElement.element("attached_items");
        if (attachedItemsElem == null) {
            attachedItemsElem = DocumentHelper.createElement("attached_items");
            attachedItemsElem.addAttribute("count", String.valueOf(0));
        }
        Element tmpEntry = entryElement.createCopy();
        tmpEntry.add(attachedItemsElem.createCopy());
        String entryData = tmpEntry.asXML();
        if (entryData == null || entryData.equals("")) {
            Log.error("TaskMessageAdapter#getCommonTaskMessageFromXMPP::entryData is invalid");
            return ret;
        }

        String quotationItemId = "";
        Element quotationItemIdElement = contentElement.element("quotation_item_id");
        if (quotationItemIdElement != null) {
            quotationItemId = quotationItemIdElement.getStringValue();
        }

        String parentItemId = "";
        Element parentItemIdElement = contentElement.element("parent_item_id");
        if (parentItemIdElement != null) {
            parentItemId = parentItemIdElement.getStringValue();
        }

        Message taskMessage = new Message();
        if (itemIdElement != null) {
            taskMessage.setItemId(itemIdElement.getStringValue());
        }
        taskMessage.setMsgType(Message.TYPE_TASK);
        taskMessage.setEntry(entryData);
        if (replyIdElement != null) {
            taskMessage.setReplyId(replyIdElement.getStringValue());
        }
        if (replyToElement != null) {
            taskMessage.setReplyTo(replyToElement.getStringValue());
        }
        if (startDateElement != null) {
            String startDate = startDateElement.getStringValue();
            Calendar cal = GlobalSNSUtils.parseDateString(startDate);
            if (cal != null) {
                taskMessage.setStartDate(new Timestamp(cal.getTimeInMillis()));
            }
        }
        if (dueDateElement != null) {
            String dueDate = dueDateElement.getStringValue();
            Calendar cal = GlobalSNSUtils.parseDateString(dueDate);
            if (cal != null) {
                taskMessage.setDueDate(new Timestamp(cal.getTimeInMillis()));
            }
        }
        taskMessage.setOwner(owner);
        if (groupElement != null) {
            taskMessage.setGroup(groupElement.getStringValue());
        }
        taskMessage.setStatus(status);
        taskMessage.setPriority(priority);
        taskMessage.setClient(client);
        taskMessage.setQuotationItemId(quotationItemId);
        taskMessage.setParentItemId(parentItemId);

        ret = taskMessage;
        return ret;
    }

    private IQ createAddTaskResponsePacket(IQ iq, Message taskMessage) {
        Log.debug("do func TaskMessageAdapter.createAddTaskResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("TaskMessageAdapter#createAddTaskResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("TaskMessageAdapter#createAddTaskResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("TaskMessageAdapter#createAddTaskResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(SEND_MESSAGE_NAMESPACE))) {
            Log.error("TaskMessageAdapter#createAddTaskResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        boolean isAppendChild = true;
        Element newContentElem = createAddOrUpdateTaskMessageContentElem(
                taskMessage, isAppendChild);
        if (newContentElem == null) {
            Log.info("TaskMessageAdapter#createAddTaskMessageContentElem::newContentElem is null.");
            return ret;
        }
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        ret = replyPacket;
        return ret;
    }

    private IQ createUpdateTaskResponsePacket(IQ iq, Message taskMessage) {
        Log.debug("do func TaskMessageAdapter.createUpdateTaskResponsePacket(...");
        IQ ret = null;
        if (iq == null) {
            Log.error("TaskMessageAdapter#createUpdateTaskResponsePacket::iq is null");
            return ret;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("TaskMessageAdapter#createUpdateTaskResponsePacket::messageElem is null");
            return ret;
        }
        String tagName = messageElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("message"))) {
            Log.error("TaskMessageAdapter#createUpdateTaskResponsePacket::tagName is invalid");
            return ret;
        }
        String namespace = messageElem.getNamespaceURI();
        if (namespace == null || !(namespace.equals(UPDATE_MESSAGE_NAMESPACE))) {
            Log.error("TaskMessageAdapter#createUpdateTaskResponsePacket::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = messageElem.element("content");
        if (contentElem != null) {
            messageElem.remove(contentElem);
        }
        boolean isAppendChild = true;
        Element newContentElem = createAddOrUpdateTaskMessageContentElem(
                taskMessage, isAppendChild);
        if (newContentElem == null) {
            Log.info("TaskMessageAdapter#createUpdateTaskResponsePacket::newContentElem is null.");
            return ret;
        }
        messageElem.add(newContentElem);
        messageElem.setParent(null);
        replyPacket.setChildElement(messageElem);
        ret = replyPacket;
        return ret;
    }

    public Element createAddOrUpdateTaskMessageContentElem(Message taskMessage,
            boolean isAppendChild) {
        Log.debug("do func TaskMessageAdapter.createAddOrUpdateTaskMessageContentElem(...");
        Element ret = null;
        if (taskMessage == null) {
            Log.error("TaskMessageAdapter#createAddTaskMessageContentElem::taskMessage is null");
            return ret;
        }
        Element contentElem = DocumentHelper.createElement("content");
        contentElem.addAttribute("type",
                IQMessageSendHandler.ContentType.Task.toString());
        Element extrasElem = createAddTaskMessageExtrasElem(taskMessage,
                isAppendChild);
        if (extrasElem == null) {
            Log.info("TaskMessageAdapter#createAddTaskMessageExtrasElem::extrasElem is null.");
            return ret;
        }
        contentElem.add(extrasElem);
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 1;
        Element itemElem = MessageAdapter.getInstance().getMessageItemElement(
                taskMessage);
        if (itemElem == null) {
            Log.info("TaskMessageAdapter#createAddTaskMessageContentElem::itemElem is null.");
            return ret;
        }
        itemsElem.add(itemElem);
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        contentElem.add(itemsElem);

        ret = contentElem;
        return ret;
    }

    private Element createAddTaskMessageExtrasElem(Message taskMessage,
            boolean isAppendChild) {
        Element ret = null;
        if (taskMessage == null) {
            Log.error("TaskMessageAdapter#createAddTaskMessageContentElem::taskMessage is null");
            return ret;
        }

        Element extrasElem = DocumentHelper.createElement("extras");
        if (isAppendChild) {
            List<String> parentTaskItemIdList = new ArrayList<String>();
            parentTaskItemIdList.add(taskMessage.getItemId());
            List<Message> childrenTaskList = TaskMessageDbHelper
                    .getChildrenTaskList(parentTaskItemIdList);
            Element childrenItemsElem = createChildrenItemsElem(childrenTaskList);
            if (childrenItemsElem == null) {
                Log.error("TaskMessageAdapter#createAddTaskMessageContentElem::childrenItemsElem is null");
                return ret;
            }
            extrasElem.add(childrenItemsElem);
        }
        ret = extrasElem;
        return ret;
    }

    private Element createChildrenItemsElem(List<Message> childrenTaskList) {
        int childrenTaskListSize = 0;
        if (childrenTaskList != null) {
            childrenTaskListSize = childrenTaskList.size();
            for (int i = childrenTaskListSize - 1; i >= 0; i--) {
                Message childrenTaskMessage = childrenTaskList.get(i);
                if (childrenTaskMessage == null) {
                    childrenTaskList.remove(i);
                    continue;
                }
                appendTaskNoteList(childrenTaskMessage);
            }
            childrenTaskListSize = childrenTaskList.size();
        }
        Element childrenItems = DocumentHelper.createElement("children_items");
        childrenItems.addAttribute("count",
                String.valueOf(childrenTaskListSize));
        for (int i = 0; i < childrenTaskListSize; i++) {
            Message childrenTaskMessage = childrenTaskList.get(i);
            Element item = getTaskMessageItemElement(childrenTaskMessage);
            childrenItems.add(item);
        }
        return childrenItems;
    }

    class CreatedTaskData {
        private Message mBaseTask;
        private List<Message> mChildTaskList;

        public CreatedTaskData() {
            mBaseTask = null;
            mChildTaskList = new ArrayList<Message>();
        }

        public Message getBaseTask() {
            return mBaseTask;
        }

        public void setBaseTask(Message baseTask) {
            mBaseTask = baseTask;
        }

        public List<Message> getChildTaskList() {
            return mChildTaskList;
        }
    }

    class UpdatedTaskData {
        private Message mAddParentTask;
        private Message mUpdateTask;
        private List<Message> mAddTaskList;

        public UpdatedTaskData() {
            mAddParentTask = null;
            mUpdateTask = null;
            mAddTaskList = new ArrayList<Message>();
        }

        public Message getAddParentTask() {
            return mAddParentTask;
        }

        public void setAddParentTask(Message addParentTask) {
            mAddParentTask = addParentTask;
        }

        public Message getUpdateTask() {
            return mUpdateTask;
        }

        public void setUpdateTask(Message updateTask) {
            mUpdateTask = updateTask;
        }

        public List<Message> getAddTaskList() {
            return mAddTaskList;
        }
    }
}
