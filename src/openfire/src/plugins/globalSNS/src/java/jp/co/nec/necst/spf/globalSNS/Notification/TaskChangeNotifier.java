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

package jp.co.nec.necst.spf.globalSNS.Notification;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.Message;

import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;

public class TaskChangeNotifier {
    private static final Logger Log = LoggerFactory
            .getLogger(TaskChangeNotifier.class);
    private static final int THREAD_STATUS_NOT_START = 0;
    private static final int THREAD_STATUS_STARTED = 1;
    private static final int THREAD_STATUS_STOPED = 2;

    private static TaskChangeNotifier mInstance = null;

    private List<jp.co.nec.necst.spf.globalSNS.Data.Message> mQueueMessage = null;
    private int mThreadStatus = THREAD_STATUS_NOT_START;
    private boolean mThreadStopRequest = false;
    private TaskChangeMessageSenderThread mSenderThread = null;

    public static TaskChangeNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new TaskChangeNotifier();
        }
        return mInstance;
    }

    private TaskChangeNotifier() {
        mQueueMessage = new ArrayList<jp.co.nec.necst.spf.globalSNS.Data.Message>();
        mSenderThread = new TaskChangeMessageSenderThread();
    };

    public boolean start() {
        final String logPrefix = "start :";
        if (mSenderThread == null || mThreadStatus == THREAD_STATUS_STOPED) {
            return false;
        }
        if (mThreadStatus == THREAD_STATUS_STARTED) {
            return true;
        }
        try {
            mSenderThread.start();
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
        if (mSenderThread != null) {
            try {
                mSenderThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public void sendTaskChangeMessage(
            jp.co.nec.necst.spf.globalSNS.Data.Message TaskChange) {
        synchronized (mQueueMessage) {
            mQueueMessage.add(TaskChange);
        }
    }

    private class TaskChangeMessageSenderThread extends Thread {
        public void run() {
            final String logPrefix = "TaskChangeMessageSenderThread:run :";
            Log.debug("TaskChangeMessageSenderThread: start!");
            List<jp.co.nec.necst.spf.globalSNS.Data.Message> tempList = new ArrayList<jp.co.nec.necst.spf.globalSNS.Data.Message>();
            Map<String, List<jp.co.nec.necst.spf.globalSNS.Data.Message>> map = new ConcurrentHashMap<String, List<jp.co.nec.necst.spf.globalSNS.Data.Message>>();
            while (true) {
                if (mThreadStopRequest) {
                    break;
                }
                try {
                    tempList.clear();
                    synchronized (mQueueMessage) {
                        try {
                            tempList.addAll(mQueueMessage);
                        } catch (OutOfMemoryError oomError) {
                            try {
                                Log.error(logPrefix
                                        + "Error occurred in adding tempList.",
                                        oomError);
                            } catch (OutOfMemoryError oomError2) {
                            }
                        }
                        mQueueMessage.clear();
                    }
                    map.clear();
                    for (jp.co.nec.necst.spf.globalSNS.Data.Message taskChange : tempList) {
                        List<jp.co.nec.necst.spf.globalSNS.Data.Message> siblingTaskList = (List<jp.co.nec.necst.spf.globalSNS.Data.Message>) TaskMessageDbHelper
                                .getSiblingTaskList(taskChange);

                        Log.debug("taskList: " + siblingTaskList.size());
                        for (jp.co.nec.necst.spf.globalSNS.Data.Message receiver : siblingTaskList) {
                            String ownerJid = receiver.getOwner();
                            addTaskChangeToMap(map, ownerJid, receiver);
                        }

                        String from = XMPPServer.getInstance().getServerInfo()
                                .getXMPPDomain();

                        Set<String> jidSet = map.keySet();

                        for (String jid : jidSet) {
                            List<jp.co.nec.necst.spf.globalSNS.Data.Message> taskChangeList = map
                                    .get(jid);
                            if (taskChangeList == null) {
                                continue;
                            }
                            Log.debug("TaskChangeList: "
                                    + taskChangeList.size());
                            int count = taskChangeList.size();
                            if (count <= 0) {
                                continue;
                            }
                            Message message = new Message();
                            message.setFrom(from);
                            message.setTo(jid);
                            message.setID("notify"
                                    + StringUtils.randomString(5) + "__" + from
                                    + "__" + StringUtils.randomString(5));

                            Element TaskChangeElem = message
                                    .addChildElement("notify",
                                            "http://necst.nec.co.jp/protocol/messageoption");

                            Element content = DocumentHelper
                                    .createElement("content");
                            TaskChangeElem.add(content);

                            Element type = DocumentHelper.createElement("type");
                            type.setText("UpdateSiblingTask");
                            content.add(type);

                            Element items = DocumentHelper
                                    .createElement("items");
                            items.addAttribute("count", String.valueOf(count));
                            content.add(items);

                            Profile profileData = UserAccountManager
                                    .getInstance().getProfile(
                                            taskChange.getOwner());
                            for (int i = 0; i < count; i++) {
                                jp.co.nec.necst.spf.globalSNS.Data.Message notifyTaskChange = taskChangeList
                                        .get(i);
                                String senderItemId = notifyTaskChange
                                        .getItemId();
                                Element item = TaskMessageAdapter.getInstance()
                                        .getSiblingTaskItemElement(
                                                senderItemId, taskChange,
                                                profileData);
                                items.add(item);
                            }
                            XMPPServer.getInstance().getMessageRouter()
                                    .route(message);
                        }
                    }
                    tempList.clear();
                    map.clear();
                    boolean queueExist = false;
                    synchronized (mQueueMessage) {
                        if (mQueueMessage.size() > 0) {
                            queueExist = true;
                        }
                    }
                    if (queueExist) {
                        continue;
                    }
                } catch (Throwable throwObject) {
                    try {
                        Log.error(logPrefix + "Error occurred in thread loop.",
                                throwObject);
                    } catch (OutOfMemoryError oomError) {
                    }
                }
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                }
            }
        }

        private void addTaskChangeToMap(
                Map<String, List<jp.co.nec.necst.spf.globalSNS.Data.Message>> map,
                String jid,
                jp.co.nec.necst.spf.globalSNS.Data.Message TaskChange) {
            List<jp.co.nec.necst.spf.globalSNS.Data.Message> TaskChangeList = map
                    .get(jid);
            if (TaskChangeList == null) {
                List<jp.co.nec.necst.spf.globalSNS.Data.Message> addTaskChangeList = new ArrayList<jp.co.nec.necst.spf.globalSNS.Data.Message>();
                addTaskChangeList.add(TaskChange);
                map.put(jid, addTaskChangeList);
            } else {
                TaskChangeList.add(TaskChange);
            }
        }
    }
}
