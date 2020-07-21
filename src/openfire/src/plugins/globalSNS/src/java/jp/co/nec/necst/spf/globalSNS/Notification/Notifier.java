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

import java.util.concurrent.ConcurrentLinkedQueue;

import org.jivesoftware.openfire.XMPPServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.Message;

public class Notifier {
    private static final Logger Log = LoggerFactory.getLogger(Notifier.class);
    private static final int THREAD_STATUS_NOT_START = 0;
    private static final int THREAD_STATUS_STARTED = 1;
    private static final int THREAD_STATUS_STOPED = 2;

    private static Notifier mInstance = null;

    private ConcurrentLinkedQueue<Notification> mHighPriorityNotificationQueue = null;
    private ConcurrentLinkedQueue<Notification> mLowPriorityNotificationQueue = null;
    private NotifierThread mNotifierThread = null;
    private int mThreadStatus = THREAD_STATUS_NOT_START;
    private boolean mThreadStopRequest = false;

    private Notifier() {
        mHighPriorityNotificationQueue = new ConcurrentLinkedQueue<Notification>();
        mLowPriorityNotificationQueue = new ConcurrentLinkedQueue<Notification>();
        mNotifierThread = new NotifierThread();
    }

    public static Notifier getInstance() {
        if (mInstance == null) {
            mInstance = new Notifier();
        }
        return mInstance;
    }

    public boolean start() {
        final String logPrefix = "start :";
        if (mNotifierThread == null || mThreadStatus == THREAD_STATUS_STOPED) {
            return false;
        }
        if (mThreadStatus == THREAD_STATUS_STARTED) {
            return true;
        }
        try {
            mNotifierThread.start();
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

    public void notifyHighPriortyNotification(Notification notification) {
        Log.debug("do func  Notifier.notifyHighPriortyNotification(...");
        if (notification == null) {
            Log.error("Notifier#notifyLowPriortyNotification::notification is null");
            return;
        }
        mHighPriorityNotificationQueue.offer(notification);
    }

    public void notifyLowPriortyNotification(Notification notification) {
        if (notification == null) {
            Log.error("Notifier#notifyLowPriortyNotification::notification is null");
            return;
        }
        mLowPriorityNotificationQueue.offer(notification);
    }

    public void stop() {
        mThreadStatus = THREAD_STATUS_STOPED;
        mThreadStopRequest = true;
        if (mNotifierThread != null) {
            try {
                mNotifierThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private class NotifierThread extends Thread {
        public void run() {
            final String logPrefix = "NotifierThread:run :";
            Log.debug("NotifierThread: start!");
            while (true) {
                if (mThreadStopRequest) {
                    break;
                }
                try {
                    Notification notificationData = mHighPriorityNotificationQueue
                            .poll();
                    if (notificationData == null) {
                        notificationData = mLowPriorityNotificationQueue.poll();
                    }
                    if (notificationData == null) {
                        try {
                            Thread.sleep(100);
                        } catch (InterruptedException e) {
                        }
                        continue;
                    }
                    if (notificationData.mTo != null) {
                        Message notificationMessage = notificationData
                                .createNotificationMessage();
                        if (notificationMessage != null) {
                            XMPPServer.getInstance().getMessageRouter()
                                    .route(notificationMessage);
                        } else {
                            Log.error("NotifierThread#run::notificationMessage is null");
                        }
                    }

                    if (!mHighPriorityNotificationQueue.isEmpty()) {
                        continue;
                    }
                    if (!mLowPriorityNotificationQueue.isEmpty()) {
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
    }
}
