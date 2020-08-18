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

import jp.co.nec.necst.spf.globalSNS.ContextHub.GoodJobAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.GoodJobStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;
import jp.co.nec.necst.spf.globalSNS.Notification.GoodJobNotifier;

import org.dom4j.Element;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;
import org.xmpp.packet.PacketError;

public class IQGoodJobHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo = null;

    public IQGoodJobHandler() {
        super("GoodJob Handler");
        mInfo = new IQHandlerInfo("goodjob",
                "http://necst.nec.co.jp/protocol/goodjob");
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
            Log.debug("not goodjob type set");
            return false;
        }

        Element goodJob = iq.getChildElement();
        if (goodJob == null) {
            Log.debug("not goodJob");
            return false;
        }

        String namespace = goodJob.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/goodjob".equals(namespace)) {
            Log.debug("not goodJob namespace");
            return false;
        }

        Element item = goodJob.element("item");
        if (item == null) {
            Log.debug("not item");
            return false;
        }

        JID fromJID = iq.getFrom();
        String fromJidStr = fromJID.toBareJID();

        String itemId = item.attributeValue("itemid");

        if (GoodJobStoreDbHelper.getGoodJobData(itemId, fromJidStr) != null) {
            return true;
        }

        Message message = MessageStoreDbHelper
                .getOneMessageByItemIdWithoutReadInfo(itemId);
        if (message == null) {
            Log.error("publicMessage is null by getOnePublicMessageByItemId");
            return false;
        }
        String itemKeeperJid = message.getMsgFrom();

        if (!GoodJobAdapter.getInstance().checkHaveGoodJobPermission(message,
                fromJidStr)) {
            Log.debug("IQGoodJobHandler#execIQ - do not have permission to GoodJob");
            return false;
        }

        Calendar now = Calendar.getInstance();
        Timestamp timeStamp = new Timestamp(now.getTimeInMillis());

        GoodJob goodJobData = new GoodJob();
        goodJobData.setItemId(itemId);
        goodJobData.setGjJid(fromJidStr);
        goodJobData.setItemKeeperJid(itemKeeperJid);
        goodJobData.setDate(timeStamp);
        boolean ret = GoodJobStoreDbHelper.insertGoodJobDataToDb(goodJobData);
        if (ret) {
            GoodJob goodJobdb = GoodJobStoreDbHelper.getGoodJobData(goodJobData.getItemId(),goodJobData.getGjJid());
            GoodJobNotifier.getInstance().sendGoddJobMessage(goodJobdb);
        }
        return ret;
    }

    @Override
    public void stop() {
        super.stop();

    }

}
