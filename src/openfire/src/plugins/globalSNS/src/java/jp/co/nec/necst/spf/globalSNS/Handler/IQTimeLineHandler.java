package jp.co.nec.necst.spf.globalSNS.Handler;

import jp.co.nec.necst.spf.globalSNS.ContextHub.PublicMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.dom4j.Element;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;

public class IQTimeLineHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo;

    public IQTimeLineHandler() {
        super("TimeLine Handler");
        mInfo = new IQHandlerInfo("pubsub", "http://jabber.org/protocol/pubsub");
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

        isSavePublishData(packet);

        return XMPPServer.getInstance().getIQPEPHandler().handleIQ(packet);
    }

    @SuppressWarnings("deprecation")
    private boolean isSavePublishData(IQ iq) {
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.debug("not pubsub type set");
            return false;
        }

        Element pubsub = iq.getChildElement();
        if (pubsub == null) {
            Log.debug("not pubsub");
            return false;
        }

        String namespace = pubsub.getNamespaceURI();
        if (!"http://jabber.org/protocol/pubsub".equals(namespace)) {
            Log.debug("not pubsub namespace");
            return false;
        }

        Element publish = pubsub.element("publish");
        if (publish == null) {
            Log.debug("not publish");
            return false;
        }

        Element item = publish.element("item");
        if (item == null) {
            Log.debug("not item");
            return false;
        }

        Element entry = item.element("entry");
        if (entry == null) {
            Log.debug("not entry");
            return false;
        }
        String fromJid = iq.getFrom().toBareJID();
        if (fromJid == null || fromJid.equals("")) {
            Log.debug("not fromJid");
            return false;
        }

        String toJid = iq.getTo().toString();
        if (toJid == null || toJid.equals("")) {
            Log.debug("not toJid");
            return false;
        }


        String nodeName = publish.attributeValue("node");
        if (nodeName == null || nodeName.equals("")) {
            Log.debug("not nodeName");
            return false;
        }

        String itemId = PublicMessageAdapter.getInstance().savePublishData(
                entry, fromJid, toJid, nodeName);
        item.addAttribute("id", itemId);
        return true;
    }

}