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

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class MailMessageNotifier {
    private static final Logger Log = LoggerFactory
            .getLogger(MailMessageNotifier.class);
    private static final int THREAD_STATUS_NOT_START = 0;
    private static final int THREAD_STATUS_STARTED = 1;
    private static final int THREAD_STATUS_STOPED = 2;

    private static MailMessageNotifier mInstance = null;

    private List<List<String>> mQueueMessage = null;
    private int mThreadStatus = THREAD_STATUS_NOT_START;
    private boolean mThreadStopRequest = false;
    private MailMessageNotifyThread mNotifyThread = null;

    private MailMessageNotifier() {
        mQueueMessage = new ArrayList<List<String>>();
        mNotifyThread = new MailMessageNotifyThread();
    }

    public static MailMessageNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new MailMessageNotifier();
        }
        return mInstance;
    }

    public void notifyMessage(List<String> itemIdList) {
        if (itemIdList == null) {
            Log.error("MailMessageNotifier#notifyMessage::itemIdList is NULL");
            return;
        }
        synchronized (mQueueMessage) {
            mQueueMessage.add(itemIdList);
        }
    }

    public boolean start() {
        final String logPrefix = "start :";
        if (mNotifyThread == null || mThreadStatus == THREAD_STATUS_STOPED) {
            return false;
        }
        if (mThreadStatus == THREAD_STATUS_STARTED) {
            return true;
        }
        try {
            mNotifyThread.start();
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
        if (mNotifyThread != null) {
            try {
                mNotifyThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private class MailMessageNotifyThread extends Thread {
        public void run() {
            final String logPrefix = "MailMessageNotifyThread:run :";
            Log.debug("MailMessageNotifyThread: start!");
            List<List<String>> tempList = new ArrayList<List<String>>();
            while (true) {
                if (mThreadStopRequest) {
                    break;
                }
                try {
                    tempList.clear();
                    synchronized (mQueueMessage) {
                        try {
                            tempList.addAll(mQueueMessage);
                            mQueueMessage.clear();
                        } catch (OutOfMemoryError oomError) {
                            try {
                                Log.error(logPrefix
                                        + "Error occurred in adding tempList.",
                                        oomError);
                            } catch (OutOfMemoryError oomError2) {
                            }
                        }
                    }
                    int count = tempList.size();
                    for (int i = 0; i < count; i++) {
                        List<String> itemList = tempList.get(i);
                        if (itemList == null) {
                            Log.error("MailMessageNotifier#MailMessageNotifyThread#run - itemList is null");
                            continue;
                        }
                        notifyMailMessage(itemList);
                    }

                    tempList.clear();
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

        private void notifyMailMessage(List<String> itemIdList) {
            if (itemIdList == null) {
                Log.error("MailMessageNotifier#MailMessageNotifyThread#notifyMailMessage::itemIdList is NULL");
                return;
            }
            int count = itemIdList.size();
            for (int i = 0; i < count; i++) {
                String itemId = itemIdList.get(i);
                if (itemId == null) {
                    Log.error("MailMessageNotifier#MailMessageNotifyThread#notifyMailMessage::itemId is NULL. No,"
                            + String.valueOf(i));
                    continue;
                }
                jp.co.nec.necst.spf.globalSNS.Data.Message mailMessage = MessageAdapter
                        .getInstance().getMessageWithoutReadInfo(itemId);
                if (mailMessage == null) {
                    Log.error("MailMessageNotifier#MailMessageNotifyThread#notifyMailMessage::mailMessage is NULL. No."
                            + String.valueOf(i));
                    continue;
                }
                if (jp.co.nec.necst.spf.globalSNS.Data.Message.TYPE_MAIL != mailMessage
                        .getMsgType()) {
                    Log.error("MailMessageNotifier#MailMessageNotifyThread#notifyMailMessage::notify message type is not Mail");
                    continue;
                }
                List<JID> reciverJidList = new ArrayList<JID>();
                JID jid = new JID(mailMessage.getMsgTo());
                reciverJidList.add(jid);
                MessageNotifier.getInstance().notifyMessage(mailMessage,
                        reciverJidList, false);
            }
        }
    }
}
