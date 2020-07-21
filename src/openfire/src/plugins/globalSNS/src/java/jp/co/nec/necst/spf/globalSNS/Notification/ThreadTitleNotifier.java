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

import java.util.Set;
import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.Message;
import org.xmpp.packet.JID;

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.PublicMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.GroupChatAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MurmurAdapter;
import jp.co.nec.necst.spf.globalSNS.Data.ThreadTitle;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityMember;
import jp.co.nec.necst.spf.globalSNS.Data.CommunityInfo;
import jp.co.nec.necst.spf.globalSNS.Group.CommunityManager;
import jp.co.nec.necst.spf.globalSNS.Handler.IQThreadTitleUpdateHandler;

public class ThreadTitleNotifier extends AbstractIndividualNotifier<ThreadTitle> {
    private static final Logger Log = LoggerFactory
        .getLogger(ThreadTitleNotifier.class);
    private static ThreadTitleNotifier mInstance = null;

    public static ThreadTitleNotifier getInstance() {
        Log.debug("do func ThreadTitleNotifier.getInstance(...");
        if (mInstance == null) {
            mInstance = new ThreadTitleNotifier();
        }
        return mInstance;
    }

    private ThreadTitleNotifier() {
    };

    public void notifyThreadTitle(ThreadTitle threadTitle) {
        Log.debug("do func ThreadTitleNotifier.notifyThreadTitle(...");
        if (threadTitle == null) {
            Log.error("ThreadTitleNotifier#notifyThreadTitle::threadTitle is null");
            return;
        }
        addQueue(threadTitle);
    }

    @Override
    protected void threadProcessOneData(ThreadTitle threadTitle) {
        Log.debug("do func ThreadTitleNotifier.threadProcessOneData(...");
        if (threadTitle == null) {
            Log.error("ThreadTitleNotifier#threadProcessOneData::threadTitle is null");
            return;
        }
        String fromJidStr = threadTitle.getEditerJID();
        ThreadTitleNotification _threadTitleNotification
            = new ThreadTitleNotification(fromJidStr, threadTitle);
        Notifier.getInstance().notifyHighPriortyNotification(_threadTitleNotification);

        Set<JID> receiverJidSet = null;
        if(threadTitle.getType().equals("Public")){
            receiverJidSet = PublicMessageAdapter.getInstance()
                .getPublicMessageReceiverJidSet(fromJidStr);
            for (JID toNotificationJid : receiverJidSet) {
                ThreadTitleNotification gjReceiverNotification
                    = new ThreadTitleNotification(toNotificationJid.toString(), threadTitle);
                Notifier.getInstance()
                    .notifyLowPriortyNotification(gjReceiverNotification);
            }
        }else if(threadTitle.getType().equals("Chat")){
            jp.co.nec.necst.spf.globalSNS.Data.Message message = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(threadTitle.getFromItemId());
            if (message == null) {
                Log.error("ThreadTitleNotifier.threadProcessOneData::message is null");
                return;
            }
            Set<String> receiverList = MessageAdapter.getInstance()
                .getMessageReceiverSet(message);
            List<String> lowPriorityReceiverList = new ArrayList<String>();
            for (String jidStr : receiverList) {
                if (jidStr == null ||
                    jidStr.equals("") ||
                    jidStr.equals(fromJidStr)) {
                    continue;
                }
                ThreadTitleNotification gjReceiverNotification
                    = new ThreadTitleNotification(jidStr, threadTitle);
                Notifier.getInstance()
                    .notifyLowPriortyNotification(gjReceiverNotification);
            }
        }else if(threadTitle.getType().equals("GroupChat")){
            jp.co.nec.necst.spf.globalSNS.Data.Message groupChatMessage = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(threadTitle.getFromItemId());
            if (groupChatMessage == null) {
                Log.error("ThreadTitleNotifier.threadProcessOneData::groupChatMessage is NULL");
                return;
            }
            if (jp.co.nec.necst.spf.globalSNS.Data.Message.TYPE_GROUP_CAHT != groupChatMessage
                .getMsgType()) {
                Log.error("ThreadTitleNotifier.threadProcessOneData::notify message type is not Group Chat");
                return;
            }
            String roomId = groupChatMessage.getMsgTo();
            List<String> memberList = GroupChatAdapter.getInstance()
                .getJoinedMemberList(roomId);
            if (memberList == null) {
                Log.error("ThreadTitleNotifier.threadProcessOneData::memberList is null");
                return;
            }
            for (String jidStr : memberList) {
                if (jidStr == null ||
                    jidStr.equals("") ||
                    jidStr.equals(fromJidStr)) {
                    Log.warn("ThreadTitleNotifier.threadProcessOneData::jidStr is invalid");
                    continue;
                }
                ThreadTitleNotification gjReceiverNotification
                    = new ThreadTitleNotification(jidStr, threadTitle);
                Notifier.getInstance()
                    .notifyLowPriortyNotification(gjReceiverNotification);
            }
        }else if(threadTitle.getType().equals("Community")){
            jp.co.nec.necst.spf.globalSNS.Data.Message communityMessage = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(threadTitle.getFromItemId());
            CommunityInfo communityInfo = CommunityManager.getInstance()
                .getCommunityInfo(communityMessage.getMsgTo());
            List<CommunityMember> memberList = communityInfo.getMemberList();
            if (memberList == null) {
                Log.error("ThreadTitleNotifier.threadProcessOneData::memberList is null");
                return;
            }
            for (CommunityMember member : memberList) {
                if (member == null||
                    member.getJid().equals("")||
                    member.getJid().equals(fromJidStr)) {
                    Log.warn("ThreadTitleNotifier.threadProcessOneData::member is null");
                    continue;
                }
                ThreadTitleNotification gjReceiverNotification
                    = new ThreadTitleNotification(member.getJid(), threadTitle);
                Notifier.getInstance()
                    .notifyLowPriortyNotification(gjReceiverNotification);
            }
        }else if(threadTitle.getType().equals("Murmur")){
            Set<String> _receiverJidSet = MurmurAdapter.getInstance()
                .getMurmurMessageReceiverSet();
            for (String jidString : _receiverJidSet) {
                ThreadTitleNotification gjReceiverNotification
                    = new ThreadTitleNotification(jidString, threadTitle);
                Notifier.getInstance()
                    .notifyLowPriortyNotification(gjReceiverNotification);
            }
        }else{
            Log.error("ThreadTitleNotifier.threadProcessOneData::threadTitle.getType() is not null");
            return;
        }

    }

    class ThreadTitleNotification extends Notification {
        public ThreadTitle mThreadTitle = null;

        public ThreadTitleNotification(String toJid, ThreadTitle threadTitle) {
            mTo = toJid;
            mThreadTitle = threadTitle;
        }

        @Override
        public Message createNotificationMessage() {
            if (mTo == null || mThreadTitle == null) {
                Log.error("ThreadTitleNotification#createNotificationMessage::parameter is invalid");
                return null;
            }
            Profile profile = UserProfileDbHelper.getUserProfileData(mThreadTitle.getEditerJID());
            String from = XMPPServer.getInstance().getServerInfo()
                .getXMPPDomain();
            Message message = new Message();
            message.setFrom(from);
            message.setTo(mTo);
            message.setID("threadtitle" + StringUtils.randomString(5) + "_" + from + "_" + StringUtils.randomString(5));
            Element threatTitleElem
                = message.addChildElement("threadtitleupdate","http://necst.nec.co.jp/protocol/threadtitleupdate#event");
            int count = 1;
            Element items = DocumentHelper.createElement("items");
            items.addAttribute("count", String.valueOf(count));
            threatTitleElem.add(items);
            Element typeElem = DocumentHelper.createElement("type");
            typeElem.setText(String.valueOf(mThreadTitle.getType()));
            items.add(typeElem);
            Element threadRootIdElem = DocumentHelper.createElement("thread_root_id");
            threadRootIdElem.setText(mThreadTitle.getThreadRootId());
            items.add(threadRootIdElem);
            Element threadTitleElem = DocumentHelper.createElement("thread_title");
            threadTitleElem.setText(mThreadTitle.getThreadTitle());
            items.add(threadTitleElem);
            Element itemIdElem = DocumentHelper.createElement("item_id");
            itemIdElem.setText(mThreadTitle.getFromItemId());
            items.add(itemIdElem);
            return message;
        }
    }
}
