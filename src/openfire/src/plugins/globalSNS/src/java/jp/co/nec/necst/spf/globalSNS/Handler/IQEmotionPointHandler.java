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

import java.sql.Timestamp;
import java.util.Calendar;

import jp.co.nec.necst.spf.globalSNS.ContextHub.EmotionPointAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.EmotionPointStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;
import jp.co.nec.necst.spf.globalSNS.Notification.EmotionPointNotifier;

import org.dom4j.Element;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;
import org.xmpp.packet.PacketError;

public class IQEmotionPointHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo = null;

    public IQEmotionPointHandler() {
        super("EmotionPoint Handler");
        mInfo = new IQHandlerInfo("emotionpoint",
                "http://necst.nec.co.jp/protocol/emotionpoint");
    }

    @Override
    public IQHandlerInfo getInfo() {
        return mInfo;
    }

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
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
    private boolean execIQ(IQ iq) throws UnauthorizedException {
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.debug("not emotionpoint type set");
            return false;
        }

        Element emotionPointElem = iq.getChildElement();
        if (emotionPointElem == null) {
            Log.debug("not emotionPointElem");
            return false;
        }

        String namespace = emotionPointElem.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/emotionpoint".equals(namespace)) {
            Log.debug("not emotionPointElem namespace");
            return false;
        }

        Element item = emotionPointElem.element("item");
        if (item == null) {
            Log.debug("not item");
            return false;
        }

        JID fromJID = iq.getFrom();
        String fromJidStr = fromJID.toBareJID();

        String itemId = item.attributeValue("itemid");

        String _emotionPoint = item.attributeValue("emotion_point");
        int emotionPoint = 0;
        if(_emotionPoint != null){
            try{
                emotionPoint = Integer.parseInt(_emotionPoint);
            }catch(java.lang.NumberFormatException e){
                Log.error("IQEmotionPointHandler#execIQ - emotionPoint is not Number");
                return false;
            }
        }

        boolean isNewEmotionPoint = true;
        EmotionPoint emotionPointDbData =EmotionPointStoreDbHelper.getEmotionPointData(itemId, fromJidStr);
        if (emotionPointDbData != null) {
            isNewEmotionPoint = false;
        }

        Message message = MessageStoreDbHelper.getOneMessageByItemIdWithoutReadInfo(itemId);

        if (!EmotionPointAdapter.getInstance().checkHaveEmotionPointPermission(message,
                                                                               fromJidStr)) {
            Log.debug("IQEmotionPointHandler#execIQ - do not have permission to EmotionPoint");
            return false;
        }

        Calendar now = Calendar.getInstance();
        Timestamp timeStamp = new Timestamp(now.getTimeInMillis());

        EmotionPoint emotionPointData = new EmotionPoint();
        emotionPointData.setItemId(itemId);
        emotionPointData.setEmotionPoint(emotionPoint);
        emotionPointData.setJid(fromJidStr);
        boolean ret;
        if(isNewEmotionPoint){
            emotionPointData.setCreatedAt(timeStamp);
            ret = EmotionPointStoreDbHelper.insertEmotionPointDataToDb(emotionPointData);
        }else{
            emotionPointData.setCreatedAt(emotionPointDbData.getCreatedAt());
            emotionPointData.setUpdatedAt(timeStamp);
            ret = EmotionPointStoreDbHelper.updateEmotionPointDataToDb(emotionPointData);
        }
        if (ret) {
            EmotionPoint emotionPointDb = EmotionPointStoreDbHelper
                .getEmotionPointData(emotionPointData.getItemId(),
                                     emotionPointData.getJid());
            EmotionPointNotifier.getInstance().sendEmotionPointMessage(emotionPointDb);
        }
        return ret;
    }

    @Override
    public void stop() {
        super.stop();
    }

}
