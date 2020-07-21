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

public class DeleteNoteNotifier extends AbstractIndividualNotifier<Note> {
    private static final Logger Log = LoggerFactory
        .getLogger(DeleteNoteNotifier.class);
    private static DeleteNoteNotifier mInstance = null;

    public static DeleteNoteNotifier getInstance() {
        Log.debug("do func  DeleteNoteNotifier.getInstance(...");
        if (mInstance == null) {
            mInstance = new DeleteNoteNotifier();
        }
        return mInstance;
    }

    private DeleteNoteNotifier() {
    };


    public void sendDeleteNoteMessage(Note deleteNote) {
        Log.debug("do func  DeleteNoteNotifier.sendDeleteNoteMessage(...");
        if (deleteNote == null) {
            Log.error("DeleteNoteNotifier#sendDeleteNoteMessage::deleteNote is null");
            return;
        }
        addQueue(deleteNote);
    }

    @Override
    protected void threadProcessOneData(Note deleteNote) {
        Log.debug("do func  DeleteNoteNotifier.threadProcessOneData(...");
        if (deleteNote == null) {
            Log.error("DeleteNoteNotifier#threadPrxocessOneData::deleteNote is null");
            return;
        }
        DeleteNoteNotification gjNotification
            = new DeleteNoteNotification(deleteNote.getJid(),
                                         deleteNote);
        Notifier.getInstance()
            .notifyHighPriortyNotification(gjNotification);

        String threadRootId = deleteNote.getThreadRootId();
        if(threadRootId != null && threadRootId.length() > 0){
            jp.co.nec.necst.spf.globalSNS.Data.Message message = MessageAdapter
                .getInstance().getMessageWithoutReadInfo(threadRootId);
            if (message == null) {
                Log.error("DeleteNoteNotifier#threadProcessOneData::message is null");
                return;
            }
            Set<String> receiverSet
                = MessageAdapter.getInstance().getMessageReceiverSet(message);
            receiverSet.remove(deleteNote.getJid());

            for (String toNotificationJid : receiverSet) {
                DeleteNoteNotification gjReceiverNotification
                    = new DeleteNoteNotification(toNotificationJid, deleteNote);
                Notifier.getInstance().notifyLowPriortyNotification(gjReceiverNotification);
            }
        }
    }

    class DeleteNoteNotification extends Notification {
        public Note mDeleteNote = null;

        public DeleteNoteNotification(String toJid, Note deleteNote) {
            mTo = toJid;
            mDeleteNote = deleteNote;
        }

        @Override
        public Message createNotificationMessage() {
            Log.debug("do func  DeleteNoteNotifier > DeleteNoteNotification.createNotificationMessage(...");
            if (mTo == null || mDeleteNote == null) {
                Log.error("DeleteNoteNotification#createNotificationMessage::parameter is invalid");
                return null;
            }
            Profile profile = UserProfileDbHelper.getUserProfileData(mDeleteNote.getJid());
            String from = XMPPServer
                .getInstance()
                .getServerInfo()
                .getXMPPDomain();
            Message message = new Message();
            message.setFrom(from);
            message.setTo(mTo);
            message.setID("deletenote" + StringUtils.randomString(5) + "_" + from
                          + "_" + StringUtils.randomString(5));
            Element deletenoteElem = message.addChildElement
                ("notedelete",
                 "http://necst.nec.co.jp/protocol/deletenote");
            int count = 1;
            Element item = DocumentHelper.createElement("item");
            item.addAttribute("count", String.valueOf(count));
            item.addAttribute("note_title", mDeleteNote.getTitle());
            item.addAttribute("note_url", mDeleteNote.getNoteUrl());
            item.addAttribute("thread_root_id", mDeleteNote.getThreadRootId());
            item.addAttribute("room_id", mDeleteNote.getRoomId());
            item.addAttribute("ownjid", mDeleteNote.getJid());
            item.addAttribute("created_at", mDeleteNote.getCreatedAtStr());
            item.addAttribute("updated_at", mDeleteNote.getUpdatedAtStr());
            deletenoteElem.add(item);
            return message;
        }
    }
}
