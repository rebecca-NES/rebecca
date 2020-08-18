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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSPlugin;
import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;
import org.xmpp.packet.Message;

public class UserProfileNotifier extends AbstractIndividualNotifier<String> {
    private static final Logger Log = LoggerFactory
            .getLogger(UserProfileNotifier.class);
    private static UserProfileNotifier mInstance = null;
    private Set<String> mNotifyFromJidSet = null;

    private UserProfileNotifier() {
        mNotifyFromJidSet = new HashSet<String>();
    }

    public static UserProfileNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new UserProfileNotifier();
        }
        return mInstance;
    }

    @Override
    protected void threadProcessOneData(String jid) {
        if (jid == null) {
            Log.error("UserProfileNotifier#threadProcessOneData::String jid is null");
            return;
        }
        notifyUserProfileProcess(jid);
    }

    public void notifyUserProfile(String jid) {
        if (jid == null) {
            Log.error("UserProfileNotifier#notifyUserProfile::jid is null");
            return;
        }
        addQueue(jid);
    }

    private void notifyUserProfileProcess(String jid) {
        final String logPrefix = "notifyUserProfileProcess :";
        if (jid == null || jid.equals("")) {
            Log.error("UserProfileNotifier#notifyUserProfileProcess : jid is invalid");
            return;
        }
        boolean isStartOwnThread = false;
        for (int i = 0; i < GlobalSNSPlugin.CREATE_THREAD_RETRY_MAXIMUM_COUNT; i++) {
            try {
                UserProfileSenderOwnThread notifyOwnThread = new UserProfileSenderOwnThread(
                        jid);
                notifyOwnThread.start();
                isStartOwnThread = true;
                break;
            } catch (Throwable throwObject) {
                try {
                    Log.error(logPrefix
                            + "Error occurred on starting thread. jid=" + jid,
                            throwObject);
                } catch (OutOfMemoryError oomError) {
                }
                try {
                    Thread.sleep(GlobalSNSPlugin.CREATE_THREAD_RETRY_BETWEEN_TIME_MS);
                } catch (InterruptedException e) {
                }
            }
        }
        if (!isStartOwnThread) {
            try {
                Log.error(logPrefix + "failded to starting own notify thread.",
                        new Throwable());
            } catch (OutOfMemoryError oomError) {
            }
        }

        boolean isNotify = true;
        synchronized (mNotifyFromJidSet) {
            if (mNotifyFromJidSet.contains(jid)) {
                isNotify = false;
            } else {
                mNotifyFromJidSet.add(jid);
            }
        }
        if (isNotify) {
            boolean isStartOtherThread = false;
            for (int i = 0; i < GlobalSNSPlugin.CREATE_THREAD_RETRY_MAXIMUM_COUNT; i++) {
                try {
                    UserProfileSenderThread notifyThread = new UserProfileSenderThread(
                            jid);
                    notifyThread.start();
                    isStartOtherThread = true;
                    break;
                } catch (Throwable throwObject) {
                    try {
                        Log.error(logPrefix
                                + "Error occurred on starting thread. jid="
                                + jid, throwObject);
                    } catch (OutOfMemoryError oomError) {
                    }
                    try {
                        Thread.sleep(GlobalSNSPlugin.CREATE_THREAD_RETRY_BETWEEN_TIME_MS);
                    } catch (InterruptedException e) {
                    }
                }
            }
            if (!isStartOtherThread) {
                try {
                    Log.error(logPrefix
                            + "failded to starting other notify thread.",
                            new Throwable());
                } catch (OutOfMemoryError oomError) {
                }
            }
        }
    }

    private Message createNotifyMessage(String toJid,
            Profile notifyDataOwnerProfile) {
        Log.debug("do func UserProfileNotifier.createNotifyMessage");
        if (notifyDataOwnerProfile == null) {
            return null;
        }
        Message message = new Message();
        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        message.setFrom(from);
        message.setTo(toJid);
        message.setID("notify" + StringUtils.randomString(5) + "__" + from
                + "__" + StringUtils.randomString(5));
        Element TaskChangeElem = message.addChildElement("notify",
                "http://necst.nec.co.jp/protocol/changepersondata");
        Element content = DocumentHelper.createElement("content");
        TaskChangeElem.add(content);
        Element type = DocumentHelper.createElement("type");
        type.setText("Presence");
        content.add(type);
        Element items = DocumentHelper.createElement("items");
        items.addAttribute("count", "1");
        content.add(items);

        Profile receiverProfile = UserProfileDbHelper.getUserProfileData(toJid);
        if (receiverProfile == null) {
            return null;
        }
        int dbPresence = receiverProfile.getPresence();
        if ((dbPresence & Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE) == 0
                && (dbPresence & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) == 0) {
            return null;
        }
        Element item = UserProfileAdapter.getInstance().getMessageEItemlemnt(
                notifyDataOwnerProfile.getJid(), notifyDataOwnerProfile);
        items.add(item);
        return message;
    }

    private class UserProfileSenderThread extends Thread {
        protected List<UserProfileSenderData> mSenderDataList = null;
        protected String mJid = null;

        public UserProfileSenderThread(String jid) {
            mJid = jid;
        }

        public void run() {
            if (mJid == null || "".equals(mJid)) {
                return;
            }
            JID jidData = new JID(mJid);
            List<JID> profilePushJidList = UserAccountManager.getInstance()
                    .getProfilePushJidList(jidData);
            if (profilePushJidList == null || profilePushJidList.isEmpty()) {
                Log.debug("UserProfileSenderThread#run::profilePushJidList is NULL or empty");
                removeNotifyFromJidSet();
                return;
            }

            mSenderDataList = new ArrayList<UserProfileSenderData>();
            for (JID othersJid : profilePushJidList) {
                UserProfileSenderData senderData = new UserProfileSenderData(
                        othersJid.toBareJID(), mJid);
                mSenderDataList.add(senderData);
            }
            notifyMessage();
            removeNotifyFromJidSet();
        }

        private void removeNotifyFromJidSet() {
            synchronized (mNotifyFromJidSet) {
                mNotifyFromJidSet.remove(mJid);
            }
        }

        protected void notifyMessage() {
            if (mSenderDataList == null) {
                return;
            }
            Profile notifyDataOwnerProfile = UserProfileDbHelper
                    .getUserProfileData(mJid);
            for (UserProfileSenderData senderData : mSenderDataList) {
                if (senderData == null) {
                    Log.error("serProfileNotifier#notifyMessage::senderData is null");
                    continue;
                }
                Message message = createNotifyMessage(senderData.mToJid,
                        notifyDataOwnerProfile);
                if (message == null) {
                    continue;
                }
                XMPPServer.getInstance().getMessageRouter().route(message);
            }
        }
    }

    private class UserProfileSenderOwnThread extends UserProfileSenderThread {
        public UserProfileSenderOwnThread(String ownJid) {
            super(ownJid);
        }

        public void run() {
            if (mJid == null || "".equals(mJid)) {
                return;
            }
            mSenderDataList = new ArrayList<UserProfileSenderData>();
            UserProfileSenderData ownSenderData = new UserProfileSenderData(
                    mJid, mJid);
            mSenderDataList.add(ownSenderData);

            if (GlobalSNSUtils.waitUserLogined(mJid, 300000) == false) {
                return;
            }

            notifyMessage();
        }
    }

    class UserProfileSenderData {
        public String mToJid = null;
        public String mNotifyDataOwnerJid = null;

        public UserProfileSenderData(String toJid, String notifyDataOwnerJid) {
            mToJid = toJid;
            mNotifyDataOwnerJid = notifyDataOwnerJid;
        }
    }
}
