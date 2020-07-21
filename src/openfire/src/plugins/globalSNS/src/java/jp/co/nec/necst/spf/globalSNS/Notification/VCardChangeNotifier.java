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

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSPlugin;
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

public class VCardChangeNotifier extends AbstractIndividualNotifier<String> {
    private static final Logger Log = LoggerFactory
            .getLogger(VCardChangeNotifier.class);
    private static VCardChangeNotifier mInstance = null;
    private Set<String> mNotifyFromJidSet = null;

    private VCardChangeNotifier() {
        mNotifyFromJidSet = new HashSet<String>();
    }

    public static VCardChangeNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new VCardChangeNotifier();
        }
        return mInstance;
    }

    @Override
    protected void threadProcessOneData(String jid) {
        if (jid == null) {
            Log.error("VCardChangeNotifier#threadProcessOneData::jid is null");
            return;
        }
        notifyVCardDataProcess(jid);
    }

    public void notifyVCardData(String jid) {
        if (jid == null) {
            Log.error("VCardChangeNotifier#notifyVCardData::jid is null");
            return;
        }
        addQueue(jid);
    }

    private void notifyVCardDataProcess(String jid) {
        final String logPrefix = "notifyVCardDataProcess :";
        if (jid == null || jid.equals("")) {
            Log.error("notifyVCardDataProcess : jid is invalid");
            return;
        }

        boolean isStartOwnThread = false;
        for (int i = 0; i < GlobalSNSPlugin.CREATE_THREAD_RETRY_MAXIMUM_COUNT; i++) {
            try {
                VCardDataSenderThread notifyOwnThread = new VCardDataSenderOwnThread(
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
                    VCardDataSenderThread notifyThread = new VCardDataSenderThread(
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
        Log.debug("do func VCardChangeNotifier.createNotifyMessage");
        if (notifyDataOwnerProfile == null) {
            Log.error("notifyDataOwnerJid userProfile is null");
            return null;
        }
        Message message = new Message();
        String from = XMPPServer.getInstance().getServerInfo().getXMPPDomain();
        message.setFrom(from);
        message.setTo(toJid);
        message.setID("notify" + StringUtils.randomString(5) + "__" + from
                + "__" + StringUtils.randomString(5));
        Element VCardChangeElem = message.addChildElement("notify",
                "http://necst.nec.co.jp/protocol/changepersondata");
        Element content = DocumentHelper.createElement("content");
        VCardChangeElem.add(content);
        Element type = DocumentHelper.createElement("type");
        type.setText("Profile");
        content.add(type);
        Element items = DocumentHelper.createElement("items");
        items.addAttribute("count", "1");
        content.add(items);

        Profile receiverProfile = UserProfileDbHelper.getUserProfileData(toJid);
        if (receiverProfile == null) {
            Log.debug("receiverProfile is null");
            return null;
        }
        int dbPresence = receiverProfile.getPresence();
        if ((dbPresence & Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE) == 0
                && (dbPresence & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) == 0) {
            return null;
        }

        Element item = DocumentHelper.createElement("item");
        items.add(item);
        Element jid = DocumentHelper.createElement("jid");
        jid.setText(notifyDataOwnerProfile.getJid());
        item.add(jid);
        Element nickname = DocumentHelper.createElement("nickName");
        String nickName = notifyDataOwnerProfile.getNickName();
        try {
            nickName = URLDecoder.decode(nickName, "UTF-8");
            nickname.setText(URLEncoder.encode(nickName, "UTF-8"));
            item.add(nickname);
        } catch (UnsupportedEncodingException e) {
            nickname.setText("");
            item.add(nickname);
        }
        Element groups = DocumentHelper.createElement("group");
        String groupsStr = notifyDataOwnerProfile.getAffiliation();
        String[] groupsStrArray = groupsStr.split(",");
        for(String group : groupsStrArray){
            String _group = group.replaceFirst("^\\[", "").replaceFirst("\\]$", "")
                .replaceFirst("^\"", "").replaceFirst("\"$", "");
            Element _gitem = DocumentHelper.createElement("item");
            _gitem.setText(_group);
            groups.add(_gitem);
        }
        item.add(groups);

        Element avatartype = DocumentHelper.createElement("avatarType");
        String avatarType = notifyDataOwnerProfile.getPhotoType();
        avatartype.setText(avatarType);
        item.add(avatartype);
        Element avatardata = DocumentHelper.createElement("avatarData");
        String avatarData = notifyDataOwnerProfile.getPhotoData();
        avatardata.setText(avatarData);
        item.add(avatardata);
        Element updatetime = DocumentHelper.createElement("updateTime");
        String updateTime = notifyDataOwnerProfile.getDateStr();
        updatetime.setText(updateTime);
        item.add(updatetime);

        return message;
    }

    private class VCardDataSenderThread extends Thread {
        protected List<VCardSenderData> mSenderDataList = null;
        protected String mJid = null;

        public VCardDataSenderThread(String jid) {
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
                Log.debug("VCardDataSenderThread#run::profilePushJidList is NULL or empty");
                removeNotifyFromJidSet();
                return;
            }

            mSenderDataList = new ArrayList<VCardSenderData>();
            for (JID othersJid : profilePushJidList) {
                VCardSenderData senderData = new VCardSenderData(
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
            for (VCardSenderData senderData : mSenderDataList) {
                if (senderData == null) {
                    Log.error("VCardChangeNotifier#notifyMessage::senderData is null");
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

    private class VCardDataSenderOwnThread extends VCardDataSenderThread {

        public VCardDataSenderOwnThread(String jid) {
            super(jid);
        }

        public void run() {
            if (mJid == null || "".equals(mJid)) {
                return;
            }
            mSenderDataList = new ArrayList<VCardSenderData>();
            VCardSenderData ownSenderData = new VCardSenderData(mJid, mJid);
            mSenderDataList.add(ownSenderData);
            notifyMessage();
        }
    }

    class VCardSenderData {
        public String mToJid = null;
        public String mNotifyDataOwnerJid = null;

        public VCardSenderData(String toJid, String notifyDataOwnerJid) {
            mToJid = toJid;
            mNotifyDataOwnerJid = notifyDataOwnerJid;
        }
    }
}
