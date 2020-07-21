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

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.Message;
import java.sql.Timestamp;

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;

public class UpdateNoteInfoNotifier extends AbstractIndividualNotifier<Note> {
    private static final Logger Log = LoggerFactory
        .getLogger(UpdateNoteInfoNotifier.class);
    private static UpdateNoteInfoNotifier mInstance = null;

    public static UpdateNoteInfoNotifier getInstance() {
        Log.debug("do func  UpdateNoteInfoNotifier.getInstance(...");
        if (mInstance == null) {
            mInstance = new UpdateNoteInfoNotifier();
        }
        return mInstance;
    }

    private UpdateNoteInfoNotifier() {
    };


    public void sendUpdateNoteInfoMessage(Note updateNoteInfo) {
        Log.debug("do func  UpdateNoteInfoNotifier.sendUpdateNoteInfoMessage(...");
        if (updateNoteInfo == null) {
            Log.error("UpdateNoteInfoNotifier#sendUpdateNoteInfoMessage::updateNoteInfo is null");
            return;
        }
        addQueue(updateNoteInfo);
    }

    @Override
    protected void threadProcessOneData(Note updateNoteInfo) {
        Log.debug("do func  UpdateNoteInfoNotifier.threadProcessOneData(...");
        if (updateNoteInfo == null) {
            Log.error("UpdateNoteInfoNotifier#threadPrxocessOneData::updateNoteInfo is null");
            return;
        }
        UpdateNoteInfoNotification gjNotification
            = new UpdateNoteInfoNotification(updateNoteInfo.getJid(),
                                         updateNoteInfo);
        Notifier.getInstance()
            .notifyHighPriortyNotification(gjNotification);

        String threadRootId = updateNoteInfo.getThreadRootId();
        if(threadRootId != null && threadRootId.length() > 0){
            jp.co.nec.necst.spf.globalSNS.Data.Message message = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(threadRootId);
            if (message == null) {
                Log.error("UpdateNoteInfoNotifier#threadProcessOneData::message is null");
                return;
            }
            Set<String> receiverSet
                = MessageAdapter.getInstance().getMessageReceiverSet(message);
            receiverSet.remove(updateNoteInfo.getJid());

            for (String toNotificationJid : receiverSet) {
                UpdateNoteInfoNotification gjReceiverNotification
                    = new UpdateNoteInfoNotification(toNotificationJid, updateNoteInfo);
                Notifier.getInstance().notifyLowPriortyNotification(gjReceiverNotification);
            }
        }

        String oldThreadRootId = updateNoteInfo.getOldThreadRootId();
        if(oldThreadRootId != null &&
           oldThreadRootId.length() > 0 &&
           !oldThreadRootId.equals(threadRootId)){
            jp.co.nec.necst.spf.globalSNS.Data.Message message = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(oldThreadRootId);
            if (message == null) {
                Log.error("UpdateNoteInfoNotifier#threadProcessOneData::message is null");
                return;
            }
            Set<String> receiverSet
                = MessageAdapter.getInstance().getMessageReceiverSet(message);
            receiverSet.remove(updateNoteInfo.getJid());

            for (String toNotificationJid : receiverSet) {
                UpdateNoteInfoNotification gjReceiverNotification
                    = new UpdateNoteInfoNotification(toNotificationJid, updateNoteInfo);
                Notifier.getInstance().notifyLowPriortyNotification(gjReceiverNotification);
            }
        }
    }

    class UpdateNoteInfoNotification extends Notification {
        public Note mUpdateNoteInfo = null;

        public UpdateNoteInfoNotification(String toJid, Note updateNoteInfo) {
            mTo = toJid;
            mUpdateNoteInfo = updateNoteInfo;
        }

        @Override
        public Message createNotificationMessage() {
            Log.debug("do func  UpdateNoteInfoNotifier > UpdateNoteInfoNotification.createNotificationMessage(...");
            if (mTo == null || mUpdateNoteInfo == null) {
                Log.error("UpdateNoteInfoNotification#createNotificationMessage::parameter is invalid");
                return null;
            }
            Profile profile = UserProfileDbHelper.getUserProfileData(mUpdateNoteInfo.getJid());
            String from = XMPPServer
                .getInstance()
                .getServerInfo()
                .getXMPPDomain();
            Message message = new Message();
            message.setFrom(from);
            message.setTo(mTo);
            message.setID("updatenoteinfo" + StringUtils.randomString(5) + "_" + from
                          + "_" + StringUtils.randomString(5));
            Element deletenoteElem = message.addChildElement
                ("noteinfoupdate",
                 "http://necst.nec.co.jp/protocol/updatenoteinfo");
            int count = 1;
            Element item = DocumentHelper.createElement("item");
            item.addAttribute("count", String.valueOf(count));
            item.addAttribute("note_title", mUpdateNoteInfo.getTitle());
            item.addAttribute("note_url", mUpdateNoteInfo.getNoteUrl());
            item.addAttribute("thread_root_id", mUpdateNoteInfo.getThreadRootId());
            item.addAttribute("old_thread_root_id", mUpdateNoteInfo.getOldThreadRootId());
            item.addAttribute("room_id", mUpdateNoteInfo.getRoomId());
            item.addAttribute("ownjid", mUpdateNoteInfo.getJid());
            item.addAttribute("created_at", mUpdateNoteInfo.getCreatedAtStr());
            item.addAttribute("updated_at", mUpdateNoteInfo.getUpdatedAtStr());
            deletenoteElem.add(item);
            return message;
        }
    }
}
