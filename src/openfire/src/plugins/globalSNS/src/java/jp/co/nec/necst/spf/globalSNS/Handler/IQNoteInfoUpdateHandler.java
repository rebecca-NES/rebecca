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

package jp.co.nec.necst.spf.globalSNS.Handler;

import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;
import jp.co.nec.necst.spf.globalSNS.Data.Note;
import jp.co.nec.necst.spf.globalSNS.Notification.UpdateNoteInfoNotifier;

import org.dom4j.Attribute;
import org.dom4j.Element;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.PacketError;
import org.xmpp.packet.JID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.text.ParseException;

public class IQNoteInfoUpdateHandler
    extends IQHandler implements IMultipleThreadHandleIQ {
    private static final Logger Log = LoggerFactory
        .getLogger(IQNoteInfoUpdateHandler.class);

    private IQHandlerInfo mInfo;

    public enum ContentType {
        None, Public, Chat, Task, GroupChat, Community;

        public static ContentType toType(String str) {
            try {
                return valueOf(str);
            } catch (Exception ex) {
                return None;
            }
        }
    }

    public IQNoteInfoUpdateHandler() {
        super("Update Note Info Handler");
        mInfo = new IQHandlerInfo("note",
                                  "http://necst.nec.co.jp/protocol/updatenoteinfo");
    }

    @Override
    public IQHandlerInfo getInfo() {
        Log.debug("do func IQNoteInfoUpdateHandler.getInfo(...");
        return mInfo;
    }

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        Log.debug("do func IQNoteInfoUpdateHandler.handleIQ(...");
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
        Log.debug("do func IQNoteInfoUpdateHandler.handleIQInThread(...");
        IQ replyPacket = IQ.createResultIQ(packet);
        if (execIQ(packet)) {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
        } else {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.item_not_found);
        }
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private boolean execIQ(IQ iq) {
        Log.debug("do func IQNoteInfoUpdateHandler.execIQ(...");
        boolean ret = false;
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("IQNoteInfoUpdateHandler#execIQ::not type set");
            return ret;
        }

        JID fromJID = iq.getFrom();
        if (fromJID == null) {
            Log.error("IQNoteInfoUpdateHandler#execIQ::not fromJID");
            return ret;
        }
        String fromJidStr = fromJID.toBareJID();

        Element pubsub = iq.getChildElement();
        if (pubsub == null) {
            Log.error("IQNoteInfoUpdateHandler#execIQ::not note");
            return ret;
        }

        String namespace = pubsub.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/updatenoteinfo".equals(namespace)) {
            Log.error("IQNoteInfoUpdateHandler#execIQ::not note namespace");
            return ret;
        }

        Element itemElem = pubsub.element("item");
        if (itemElem == null) {
            Log.error("IQNoteInfoUpdateHandler#execIQ::not item");
            return ret;
        }

        String title = itemElem.attributeValue("note_title");
        if(title == null){
            Log.error("IQNoteInfoUpdateHandler#execIQ::not note_title");
            return ret;
        }
        Log.debug("IQNoteInfoUpdateHandler#execIQ noteUrl:" + title);

        String noteUrl = itemElem.attributeValue("note_url");
        if(noteUrl == null){
            Log.error("IQNoteInfoUpdateHandler#execIQ::not note_url");
            return ret;
        }
        Log.debug("IQNoteInfoUpdateHandler#execIQ noteUrl:" + noteUrl);

        String threadRootId = itemElem.attributeValue("thread_root_id");
        if(threadRootId == null){
            Log.error("IQNoteInfoUpdateHandler#execIQ::not threadRootId");
            return ret;
        }
        Log.debug("IQNoteInfoUpdateHandler#execIQ threadRootId:" + threadRootId);

        String oldThreadRootId = itemElem.attributeValue("old_thread_root_id");
        Log.debug("IQNoteInfoUpdateHandler#execIQ oldThreadRootId:" + oldThreadRootId);

        String roomId = itemElem.attributeValue("room_id");
        if(roomId == null){
            Log.error("IQNoteInfoUpdateHandler#execIQ::not roomId");
            return ret;
        }
        Log.debug("IQNoteInfoUpdateHandler#execIQ roomId:" + roomId);

        String ownjid = itemElem.attributeValue("ownjid");
        if(ownjid == null){
            Log.error("IQNoteInfoUpdateHandler#execIQ::not ownjid");
            return ret;
        }
        Log.debug("IQNoteInfoUpdateHandler#execIQ ownjid:" + ownjid);

        String created_at_longtime = itemElem.attributeValue("created_at_longtime");
        if(created_at_longtime == null){
            Log.error("IQNoteInfoUpdateHandler#execIQ::not created_at_longtime");
            return ret;
        }
        Log.debug("IQNoteInfoUpdateHandler#execIQ created_at_longtime:" + created_at_longtime);

        String updated_at_longtime = itemElem.attributeValue("updated_at_longtime");
        if(updated_at_longtime == null){
            Log.error("IQNoteInfoUpdateHandler#execIQ::not updated_at_longtime");
            return ret;
        }
        Log.debug("IQNoteInfoUpdateHandler#execIQ updated_at_longtime:" + updated_at_longtime);

        Note _updateNoteInfo = new Note();
        _updateNoteInfo.setTitle(title);
        _updateNoteInfo.setNoteUrl(noteUrl);
        _updateNoteInfo.setThreadRootId(threadRootId);
        if(oldThreadRootId != null){
            _updateNoteInfo.setOldThreadRootId(oldThreadRootId);
        }
        _updateNoteInfo.setRoomId(roomId);
        _updateNoteInfo.setJid(ownjid);
        try{
            _updateNoteInfo.setCreatedAt(new Timestamp(Long.parseLong(created_at_longtime)));
        }catch(NumberFormatException e){
            Log.warn("IQNoteInfoUpdateHandler#execIQ created_at_longtime lonn parse error:" + e);
        }
        try{
            _updateNoteInfo.setUpdatedAt(new Timestamp(Long.parseLong(updated_at_longtime)));
        }catch(NumberFormatException e){
            Log.warn("IQNoteInfoUpdateHandler#execIQ updated_at_longtime long parse error:" + e);
        }

        UpdateNoteInfoNotifier.getInstance().sendUpdateNoteInfoMessage(_updateNoteInfo);
        return true;
    }

}
