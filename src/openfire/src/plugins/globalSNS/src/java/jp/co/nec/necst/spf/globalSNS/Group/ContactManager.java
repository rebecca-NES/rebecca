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

package jp.co.nec.necst.spf.globalSNS.Group;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import jp.co.nec.necst.spf.globalSNS.ContextHub.ContactAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.ContactListMember;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;

import org.jivesoftware.openfire.SharedGroupException;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.roster.RosterItem;
import org.jivesoftware.openfire.user.User;
import org.jivesoftware.openfire.user.UserAlreadyExistsException;
import org.jivesoftware.openfire.user.UserManager;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.jivesoftware.openfire.vcard.VCardManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class ContactManager {
    private static final Logger Log = LoggerFactory
            .getLogger(ContactManager.class);
    private static ContactManager mInstance = null;
    private UserManager userManager = XMPPServer.getInstance().getUserManager();
    private ContactManageProcessThread mManageThread = null;
    private List<QueueData> mQueueDataList = null;

    public enum CreateContactType {
        none, all, custom;

        public static CreateContactType toType(String str) {
            try {
                return valueOf(str);
            } catch (Exception ex) {
                return none;
            }
        }
    }

    public enum AddOrRemoveResultMemberListType {
        SuccessMembers, FailureMembers;
    }

    public static ContactManager getInstance() {
        if (mInstance == null) {
            mInstance = new ContactManager();
        }
        return mInstance;
    }

    private ContactManager() {
        mQueueDataList = new ArrayList<QueueData>();
        mManageThread = new ContactManageProcessThread();
    }

    private void createContact(String newUserName, Map<String, User> targetUsers) {
        targetUsers.remove(newUserName);
        Iterator<String> itTargetUser = targetUsers.keySet().iterator();
        while (itTargetUser.hasNext()) {
            String targetUserName = itTargetUser.next();
            try {
                ContactAdapter.getInstance().addRosterItem(newUserName,
                        targetUserName, RosterItem.SUB_BOTH);
                ContactAdapter.getInstance().addRosterItem(targetUserName,
                        newUserName, RosterItem.SUB_BOTH);
            } catch (UserNotFoundException e) {
                String exceptionMessage = String
                        .format(createExceptionLogString(), newUserName,
                                targetUserName);
                Log.error(ContactManager.class.getName()
                        + " :: UserNotFoundException :: \n" + exceptionMessage);
                continue;
            } catch (UserAlreadyExistsException e) {
                String exceptionMessage = String
                        .format(createExceptionLogString(), newUserName,
                                targetUserName);
                Log.error(ContactManager.class.getName()
                        + " :: UserAlreadyExistsException :: \n"
                        + exceptionMessage);
                continue;
            } catch (SharedGroupException e) {
                String exceptionMessage = String
                        .format(createExceptionLogString(), newUserName,
                                targetUserName);
                Log.error(ContactManager.class.getName()
                        + " :: SharedGroupException :: \n" + exceptionMessage);
                continue;
            }
        }
    }

    private boolean physicalDeleteUser(String userName) {
        UserProfileDbHelper.physicalDeleteUserDataDBTable(userName);

        UserManager userManeger = XMPPServer.getInstance().getUserManager();
        VCardManager vCardManager = XMPPServer.getInstance().getVCardManager();
        vCardManager.deleteVCard(userName);
        try {
            User user = userManeger.getUser(userName);
            userManeger.deleteUser(user);
        } catch (UserNotFoundException e) {
            Log.error("ContactManager#physicalDeleteUser: Faild to delte user. userName="
                    + userName);
        }
        return true;
    }

    public Map<String, User> getTargetUsers() {
        Map<String, User> tergetUsers = new HashMap<String, User>();
        Map<String, User> notApplicableUsers = getNotApplicableUsers();
        Collection<User> allUser = userManager.getUsers();
        for (User existUser : allUser) {
            String existUserName = existUser.getUsername();
            tergetUsers.put(existUserName, existUser);
        }
        Iterator<String> itNotApplicableUser = notApplicableUsers.keySet()
                .iterator();
        while (itNotApplicableUser.hasNext()) {
            String notApplicableUserName = itNotApplicableUser.next();
            tergetUsers.remove(notApplicableUserName);
        }
        return tergetUsers;
    }

    private Map<String, User> getNotApplicableUsers() {
        String hostName = XMPPServer.getInstance().getServerInfo()
                .getHostname();
        String[] notApplicableUsersNameArrayEnv = {};
        if ("spfdev".equals(hostName) || "spfpoc03".equals(hostName)) {
            notApplicableUsersNameArrayEnv = new String[] { "sean", "rocky" };
        }
        Map<String, User> notApplicableUsers = UserAccountManager.getInstance()
                .getCubeeSystemUsers();
        for (int i = 0; i < notApplicableUsersNameArrayEnv.length; i++) {
            try {
                User notApplicableUser = userManager
                        .getUser(notApplicableUsersNameArrayEnv[i]);
                notApplicableUsers.put(notApplicableUsersNameArrayEnv[i],
                        notApplicableUser);
            } catch (UserNotFoundException e) {
                continue;
            }
        }
        return notApplicableUsers;
    }

    private String createExceptionLogString() {
        String headerMessage = "Fail Create Contact %s - %s \n";
        return headerMessage;
    }

    private static final int THREAD_STATUS_NOT_START = 0;
    private static final int THREAD_STATUS_STARTED = 1;
    private static final int THREAD_STATUS_STOPED = 2;

    private int mThreadStatus = THREAD_STATUS_NOT_START;
    private boolean mThreadStopRequest = false;

    public boolean start() {
        final String logPrefix = "start :";
        if (mManageThread == null || mThreadStatus == THREAD_STATUS_STOPED) {
            return false;
        }
        if (mThreadStatus == THREAD_STATUS_STARTED) {
            return true;
        }
        try {
            mManageThread.start();
            mThreadStatus = THREAD_STATUS_STARTED;
            return true;
        } catch (Throwable throwObject) {
            try {
                Log.error(logPrefix + "Error occurred on starting thread.",
                        throwObject);
            } catch (OutOfMemoryError oomError) {
            }
        }
        return false;
    }

    public void stop() {
        mThreadStatus = THREAD_STATUS_STOPED;
        mThreadStopRequest = true;
        if (mManageThread != null) {
            try {
                mManageThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public void requestContactEachOther(String oneUserName,
            Map<String, User> targetUsers) {
        synchronized (mQueueDataList) {
            QueueData queueData = new ContactEachOtherQueueData(oneUserName,
                    targetUsers);
            mQueueDataList.add(queueData);
            Log.info("Contact List request queue add all count="
                    + String.valueOf(mQueueDataList.size()));
        }
    }

    public void requestPhysicalDeleteUser(String userName) {
        synchronized (mQueueDataList) {
            QueueData queueData = new PhysicalDeleteUserQueueData(userName);
            mQueueDataList.add(queueData);
            Log.info("Contact List request queue add all count="
                    + String.valueOf(mQueueDataList.size()));
        }
    }

    private class ContactManageProcessThread extends Thread {
        public void run() {
            final String logPrefix = "ContactManageProcessThread:run :";
            Log.debug("ContactManageProcessThread: start!");
            List<QueueData> tempList = new ArrayList<QueueData>();
            while (true) {
                if (mThreadStopRequest) {
                    break;
                }
                int nextSleepMills = 100;
                try {
                    tempList.clear();
                    synchronized (mQueueDataList) {
                        try {
                            tempList.addAll(mQueueDataList);
                        } catch (OutOfMemoryError oomError) {
                            try {
                                Log.error(logPrefix
                                        + "Error occurred in adding tempList.",
                                        oomError);
                            } catch (OutOfMemoryError oomError2) {
                            }
                        }
                        mQueueDataList.clear();
                    }
                    int count = tempList.size();
                    for (int i = 0; i < count; i++) {
                        Log.debug("Contact List request temp queue pull. all count="
                                + String.valueOf(i + 1)
                                + "/"
                                + String.valueOf(count));
                        QueueData queueData = tempList.get(i);
                        ThreadRequestType type = queueData.getType();
                        switch (type) {
                            case contactEachOther:
                                ContactEachOtherData contactEachOtherData = (ContactEachOtherData) queueData
                                        .getData();
                                createContact(
                                        contactEachOtherData.getOneUserName(),
                                        contactEachOtherData.getTargetUsers());
                                break;
                            case physicalDeleteUser:
                                PhysicalDeleteUserData physicalDeleteUserData = (PhysicalDeleteUserData) queueData
                                        .getData();
                                physicalDeleteUser(physicalDeleteUserData
                                        .getUserName());
                                break;
                            default:
                                break;
                        }
                    }
                    tempList.clear();
                    synchronized (mQueueDataList) {
                        if (mQueueDataList.size() > 0) {
                            nextSleepMills = 10;
                        }
                    }
                } catch (Throwable throwObject) {
                    try {
                        Log.error(logPrefix + "Error occurred in thread loop.",
                                throwObject);
                    } catch (OutOfMemoryError oomError) {
                    }
                }
                try {
                    Thread.sleep(nextSleepMills);
                } catch (InterruptedException e) {
                }
            }
        }
    }

    enum ThreadRequestType {
        contactEachOther, physicalDeleteUser
    }

    private class QueueData {
        protected ThreadRequestType type;
        protected Object data;

        public ThreadRequestType getType() {
            return type;
        }

        public Object getData() {
            return data;
        }
    }

    private class ContactEachOtherQueueData extends QueueData {
        public ContactEachOtherQueueData(String oneUserName,
                Map<String, User> targetUsers) {
            type = ThreadRequestType.contactEachOther;
            data = new ContactEachOtherData(oneUserName, targetUsers);
        }
    }

    private class PhysicalDeleteUserQueueData extends QueueData {
        public PhysicalDeleteUserQueueData(String userName) {
            type = ThreadRequestType.physicalDeleteUser;
            data = new PhysicalDeleteUserData(userName);
        }
    }

    private class ContactEachOtherData {
        private String mOneUserName;
        private Map<String, User> mTargetUsers;

        public ContactEachOtherData(String oneUserName,
                Map<String, User> targetUsers) {
            mOneUserName = oneUserName;
            mTargetUsers = targetUsers;
        }

        public String getOneUserName() {
            return mOneUserName;
        }

        public Map<String, User> getTargetUsers() {
            return mTargetUsers;
        }
    }

    private class PhysicalDeleteUserData {
        private String mUserName;

        public PhysicalDeleteUserData(String userName) {
            mUserName = userName;
        }

        public String getUserName() {
            return mUserName;
        }
    }

    public Map<AddOrRemoveResultMemberListType, List<ContactListMember>> addMember(
            String requestJid, List<ContactListMember> addMemberData) {
        List<ContactListMember> successList = new ArrayList<ContactListMember>();
        List<ContactListMember> failureList = new ArrayList<ContactListMember>();
        String logPrefix = "ContactManager#addMember::";
        if (requestJid == null || "".equals(requestJid.trim())) {
            Log.error(logPrefix + "requestJid is null");
            return null;
        }
        if (addMemberData == null) {
            Log.error(logPrefix + "addMemberData is null");
            return null;
        }
        JID requestUserJid = new JID(requestJid);
        String requestUserName = requestUserJid.getNode();
        for (ContactListMember contactListMember : addMemberData) {
            if (contactListMember == null) {
                Log.error(logPrefix + "contactListMember is null");
                continue;
            }
            String addJid = contactListMember.getJid();
            Profile profile = UserAccountManager.getInstance().getProfile(
                    addJid);
            if (profile == null) {
                failureList.add(contactListMember);
                Log.error("Terget Jid not found : " + addJid);
                continue;
            }
            boolean isSuccess = false;
            try {
                addRosterItem(requestUserName, addJid, RosterItem.SUB_BOTH);
                boolean followResult = FollowFollowerManager.getInstance()
                        .follow(requestUserJid.toBareJID(), addJid);
                if (!followResult) {
                    Log.error(logPrefix + "followResult is false : from user="
                            + requestUserJid.toBareJID() + " to user=:"
                            + addJid);
                    removeRosterItem(requestUserName, addJid);
                } else {
                    isSuccess = true;
                }
            } catch (UserNotFoundException e) {
                Log.error(logPrefix, e);
                continue;
            } catch (UserAlreadyExistsException e) {
                Log.error(logPrefix, e);
                continue;
            } catch (SharedGroupException e) {
                Log.error(logPrefix, e);
                continue;
            }
            if (isSuccess) {
                successList.add(contactListMember);
            } else {
                failureList.add(contactListMember);
            }
        }
        int successCount = successList.size();
        if (successCount <= 0) {
            return null;
        }
        Map<AddOrRemoveResultMemberListType, List<ContactListMember>> ret = new HashMap<AddOrRemoveResultMemberListType, List<ContactListMember>>();
        ret.put(AddOrRemoveResultMemberListType.SuccessMembers, successList);
        ret.put(AddOrRemoveResultMemberListType.FailureMembers, failureList);
        return ret;
    }

    private void addRosterItem(String baseUserName, String targetUserJidStr,
            RosterItem.SubType type) throws UserNotFoundException,
            UserAlreadyExistsException, SharedGroupException {
        User baseUser = userManager.getUser(baseUserName);
        JID targetUserJid = new JID(targetUserJidStr);
        try {
            RosterItem existUser = baseUser.getRoster().getRosterItem(
                    targetUserJid);
            if (existUser != null) {
                throw new UserAlreadyExistsException();
            }
        } catch (UserNotFoundException e) {
        }
        RosterItem.SubType subType = RosterItem.SUB_NONE;
        if (type != null) {
            subType = type;
        }
        boolean isPush = true;
        boolean isPersistent = true;
        RosterItem baseUserRosterItem = baseUser.getRoster().createRosterItem(
                targetUserJid, isPush, isPersistent);
        baseUserRosterItem.setSubStatus(subType);
        baseUser.getRoster().updateRosterItem(baseUserRosterItem);
    }

    public Map<AddOrRemoveResultMemberListType, List<ContactListMember>> removeMember(
            String requestJid, List<ContactListMember> requestRemoveMemberData) {
        List<ContactListMember> successList = new ArrayList<ContactListMember>();
        List<ContactListMember> failureList = new ArrayList<ContactListMember>();
        String logPrefix = "ContactManager#addMember::";
        if (requestJid == null || "".equals(requestJid.trim())) {
            Log.error(logPrefix + "requestJid is null");
            return null;
        }
        if (requestRemoveMemberData == null) {
            Log.error(logPrefix + "requestRemoveMemberData is null");
            return null;
        }
        JID requestUserJid = new JID(requestJid);
        String requestUserName = requestUserJid.getNode();
        for (ContactListMember contactListMember : requestRemoveMemberData) {
            if (contactListMember == null) {
                Log.warn(logPrefix + "contactListMember is null");
                continue;
            }
            String removeJid = contactListMember.getJid();
            boolean isSuccess = false;
            try {
                removeRosterItem(requestUserName, removeJid);
                boolean unfollowResult = FollowFollowerManager.getInstance()
                        .unFollow(requestUserJid.toBareJID(), removeJid);
                if (!unfollowResult) {
                    Log.error(logPrefix
                            + "unfollowResult is false : from user="
                            + requestUserJid.toBareJID() + " to user=:"
                            + removeJid);
                    removeRosterItem(requestUserName, removeJid);
                } else {
                    isSuccess = true;
                }
            } catch (UserNotFoundException e) {
                Log.error(logPrefix, e);
                continue;
            } catch (SharedGroupException e) {
                Log.error(logPrefix, e);
                continue;
            }
            if (isSuccess) {
                successList.add(contactListMember);
            } else {
                failureList.add(contactListMember);
            }
        }
        int successCount = successList.size();
        if (successCount <= 0) {
            return null;
        }
        Map<AddOrRemoveResultMemberListType, List<ContactListMember>> ret = new HashMap<AddOrRemoveResultMemberListType, List<ContactListMember>>();
        ret.put(AddOrRemoveResultMemberListType.SuccessMembers, successList);
        ret.put(AddOrRemoveResultMemberListType.FailureMembers, failureList);
        return ret;
    }

    private void removeRosterItem(String requestUserName, String removeJid)
            throws UserNotFoundException, SharedGroupException {
        User baseUser = userManager.getUser(requestUserName);
        JID targetUserJid = new JID(removeJid);
        baseUser.getRoster().getRosterItem(targetUserJid);
        baseUser.getRoster().deleteRosterItem(targetUserJid, false);
    }

}
