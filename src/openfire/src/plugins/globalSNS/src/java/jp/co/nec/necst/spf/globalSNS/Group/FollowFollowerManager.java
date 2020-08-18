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

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.user.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;
import jp.co.nec.necst.spf.globalSNS.ContextHub.FollowStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.FollowInfo;

public class FollowFollowerManager {
    private static final Logger Log = LoggerFactory
            .getLogger(FollowFollowerManager.class);
    private static FollowFollowerManager mInstance = null;
    private FollowManageProcessThread mManageThread = null;
    private List<QueueData> mQueueDataList = null;

    public static FollowFollowerManager getInstance() {
        if (mInstance == null) {
            mInstance = new FollowFollowerManager();
        }
        return mInstance;
    }

    private FollowFollowerManager() {
        mQueueDataList = new ArrayList<QueueData>();
        mManageThread = new FollowManageProcessThread();
    }

    public List<JID> getFollowerJidList(JID jid) {
        if (jid == null) {
            return null;
        }
        List<JID> retList = new ArrayList<JID>();
        String jidStr = jid.toBareJID();
        List<FollowInfo> followerList = FollowStoreDbHelper
                .selectDbFollowerList(jidStr);
        for (FollowInfo followInfo : followerList) {
            if (followInfo == null) {
                continue;
            }
            if (followInfo.getStatus() != FollowInfo.STATUS_FOLLOW) {
                continue;
            }
            String followerJidStr = followInfo.getJid();
            JID followerJid = new JID(followerJidStr);
            retList.add(followerJid);
        }
        return retList;
    }

    public List<JID> getFollowJidList(JID jid) {
        if (jid == null) {
            return null;
        }
        List<JID> retList = new ArrayList<JID>();
        String jidStr = jid.toBareJID();
        List<FollowInfo> followerList = FollowStoreDbHelper
                .selectDbFollowList(jidStr);
        for (FollowInfo followInfo : followerList) {
            if (followInfo == null) {
                continue;
            }
            if (followInfo.getStatus() != FollowInfo.STATUS_FOLLOW) {
                continue;
            }
            String followJidStr = followInfo.getFollowJid();
            JID followerJid = new JID(followJidStr);
            retList.add(followerJid);
        }
        return retList;
    }

    public boolean follow(String followUserJid, String followerUserJid) {
        boolean ret = false;
        if (followUserJid == null || followUserJid.equals("")) {
            return false;
        }
        if (followerUserJid == null || followerUserJid.equals("")) {
            return false;
        }
        if (followUserJid.equals(followerUserJid)) {
            return false;
        }
        FollowInfo existFollowInfo = FollowStoreDbHelper
                .selectDbByJidAndFollowerJid(followUserJid, followerUserJid);
        if (existFollowInfo == null) {
            FollowInfo followInfo = new FollowInfo();
            followInfo.setJid(followUserJid);
            followInfo.setFollowJid(followerUserJid);
            followInfo.setStatus(FollowInfo.STATUS_FOLLOW);
            FollowStoreDbHelper.insertDb(followInfo);
            ret = true;
        } else {
            existFollowInfo.setStatus(FollowInfo.STATUS_FOLLOW);
            Calendar now = Calendar.getInstance();
            existFollowInfo.setDate(new Timestamp(now.getTimeInMillis()));
            FollowStoreDbHelper.updateDbById(existFollowInfo);
            ret = true;
        }
        return ret;
    }

    public boolean unFollow(String followUserJid, String followerUserJid) {
        boolean ret = false;
        if (followUserJid == null || followUserJid.equals("")) {
            return false;
        }
        if (followerUserJid == null || followerUserJid.equals("")) {
            return false;
        }
        if (followUserJid.equals(followerUserJid)) {
            return false;
        }
        FollowInfo existFollowInfo = FollowStoreDbHelper
                .selectDbByJidAndFollowerJid(followUserJid, followerUserJid);
        if (existFollowInfo == null) {
            FollowInfo followInfo = new FollowInfo();
            followInfo.setJid(followUserJid);
            followInfo.setFollowJid(followerUserJid);
            followInfo.setStatus(FollowInfo.STATUS_UNFOLLOW);
            FollowStoreDbHelper.insertDb(followInfo);
            ret = true;
        } else {
            existFollowInfo.setStatus(FollowInfo.STATUS_UNFOLLOW);
            Calendar now = Calendar.getInstance();
            existFollowInfo.setDate(new Timestamp(now.getTimeInMillis()));
            FollowStoreDbHelper.updateDbById(existFollowInfo);
            ret = true;
        }
        return ret;
    }

    public boolean block(String followUserJid, String followerUserJid) {
        boolean ret = false;
        if (followUserJid == null || followUserJid.equals("")) {
            return false;
        }
        if (followerUserJid == null || followerUserJid.equals("")) {
            return false;
        }
        if (followUserJid.equals(followerUserJid)) {
            return false;
        }
        FollowInfo existFollowInfo = FollowStoreDbHelper
                .selectDbByJidAndFollowerJid(followUserJid, followerUserJid);
        if (existFollowInfo == null) {
            FollowInfo followInfo = new FollowInfo();
            followInfo.setJid(followUserJid);
            followInfo.setFollowJid(followerUserJid);
            followInfo.setStatus(FollowInfo.STATUS_BLOCK);
            FollowStoreDbHelper.insertDb(followInfo);
            ret = true;
        } else {
            existFollowInfo.setStatus(FollowInfo.STATUS_BLOCK);
            Calendar now = Calendar.getInstance();
            existFollowInfo.setDate(new Timestamp(now.getTimeInMillis()));
            FollowStoreDbHelper.updateDbById(existFollowInfo);
            ret = true;
        }
        return ret;
    }

    private boolean physicalDeleteUser(String userName) {
        return FollowStoreDbHelper.physicalDeleteUserDataDBTable(userName);
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

    public void requestFollowEachOther(String oneUserName,
            Map<String, User> targetUsers) {
        synchronized (mQueueDataList) {
            QueueData queueData = new FollowEachOtherQueueData(oneUserName,
                    targetUsers);
            mQueueDataList.add(queueData);
            Log.info("Follow List request queue add all count="
                    + String.valueOf(mQueueDataList.size()));
        }
    }

    public void requestPhysicalDeleteUser(String userName) {
        synchronized (mQueueDataList) {
            QueueData queueData = new PhysicalDeleteUserQueueData(userName);
            mQueueDataList.add(queueData);
            Log.info("Follow List request queue add all count="
                    + String.valueOf(mQueueDataList.size()));
        }
    }

    private class FollowManageProcessThread extends Thread {
        public void run() {
            final String logPrefix = "FollowManageProcessThread:run :";
            Log.debug("FollowManageProcessThread: start!");
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
                        Log.debug("Follow List request temp queue pull. all count="
                                + String.valueOf(i + 1)
                                + "/"
                                + String.valueOf(count));
                        QueueData queueData = tempList.get(i);
                        ThreadRequestType type = queueData.getType();
                        switch (type) {
                            case followEachOther:
                                FollowEachOtherData followEachOtherData = (FollowEachOtherData) queueData
                                        .getData();
                                followEachOther(
                                        followEachOtherData.getOneUserName(),
                                        followEachOtherData.getTargetUsers());
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

        private void followEachOther(String oneUserName,
                Map<String, User> targetUsers) {
            targetUsers.remove(oneUserName);
            Set<String> targetUserSet = targetUsers.keySet();

            List<FollowInfo> existFollowInfoList = FollowStoreDbHelper
                    .getFollowInfoListBeforeFollowEachOther(oneUserName,
                            targetUsers);
            Map<String, Set<String>> existFollowDataMap = new ConcurrentHashMap<String, Set<String>>();
            int existFollowListCount = existFollowInfoList.size();
            for (int i = 0; i < existFollowListCount; i++) {
                FollowInfo followInfo = existFollowInfoList.get(i);
                if (followInfo == null) {
                    Log.error("followEachOther : existFollowInfo is invalid");
                    continue;
                }
                Set<String> followJidSet = existFollowDataMap.get(followInfo
                        .getJid());
                if (followJidSet == null) {
                    followJidSet = new HashSet<String>();
                }
                followJidSet.add(followInfo.getFollowJid());
                existFollowDataMap.put(followInfo.getJid(), followJidSet);
            }
            List<FollowInfo> addFollowInfoList = new ArrayList<FollowInfo>();
            String oneUserJidStr = XMPPServer.getInstance()
                    .createJID(oneUserName, null).toBareJID();
            for (String targetUserName : targetUserSet) {
                String targetUserJidStr = XMPPServer.getInstance()
                        .createJID(targetUserName, null).toBareJID();

                Set<String> followJidSet = existFollowDataMap
                        .get(oneUserJidStr);
                boolean addList = true;
                if (followJidSet != null) {
                    if (followJidSet.contains(targetUserJidStr)) {
                        addList = false;
                    }
                }
                if (addList) {
                    FollowInfo followInfo = new FollowInfo();
                    followInfo.setJid(oneUserJidStr);
                    followInfo.setFollowJid(targetUserJidStr);
                    followInfo.setStatus(FollowInfo.STATUS_FOLLOW);
                    addFollowInfoList.add(followInfo);
                }

                followJidSet = existFollowDataMap.get(targetUserJidStr);
                addList = true;
                if (followJidSet != null) {
                    if (followJidSet.contains(oneUserJidStr)) {
                        addList = false;
                    }
                }
                if (addList) {
                    FollowInfo followInfo = new FollowInfo();
                    followInfo.setJid(targetUserJidStr);
                    followInfo.setFollowJid(oneUserJidStr);
                    followInfo.setStatus(FollowInfo.STATUS_FOLLOW);
                    addFollowInfoList.add(followInfo);
                }
            }
            int addFollowInfoListCount = addFollowInfoList.size();
            int startIndex = 0;
            int oneAddCount = 1000;
            while (startIndex < addFollowInfoListCount) {
                List<FollowInfo> processFollowList = new ArrayList<FollowInfo>();
                for (int i = 0; i < oneAddCount
                        && startIndex + i < addFollowInfoListCount; i++) {
                    processFollowList
                            .add(addFollowInfoList.get(startIndex + i));
                }
                FollowStoreDbHelper.insertDb(processFollowList);
                startIndex += oneAddCount;
            }

            for (int i = 0; i < existFollowListCount; i++) {
                FollowInfo followInfo = existFollowInfoList.get(i);
                if (followInfo == null) {
                    Log.error("followEachOther : existFollowInfo is invalid");
                    continue;
                }
                followInfo.setStatus(FollowInfo.STATUS_FOLLOW);
                Calendar now = Calendar.getInstance();
                followInfo.setDate(new Timestamp(now.getTimeInMillis()));
            }
            if (!existFollowInfoList.isEmpty()) {
                FollowStoreDbHelper.updateDbById(existFollowInfoList);
            }
        }
    }

    enum ThreadRequestType {
        followEachOther, physicalDeleteUser
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

    private class FollowEachOtherQueueData extends QueueData {
        public FollowEachOtherQueueData(String oneUserName,
                Map<String, User> targetUsers) {
            type = ThreadRequestType.followEachOther;
            data = new FollowEachOtherData(oneUserName, targetUsers);
        }
    }

    private class PhysicalDeleteUserQueueData extends QueueData {
        public PhysicalDeleteUserQueueData(String userName) {
            type = ThreadRequestType.physicalDeleteUser;
            data = new PhysicalDeleteUserData(userName);
        }
    }

    private class FollowEachOtherData {
        private String mOneUserName;
        private Map<String, User> mTargetUsers;

        public FollowEachOtherData(String oneUserName,
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

}
