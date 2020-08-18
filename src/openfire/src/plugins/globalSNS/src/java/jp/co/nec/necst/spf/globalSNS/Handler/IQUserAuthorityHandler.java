package jp.co.nec.necst.spf.globalSNS.Handler;

import jp.co.nec.necst.spf.globalSNS.ContextHub.UserAuthorityAdapter;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.IMultipleThreadHandleIQ;
import jp.co.nec.necst.spf.globalSNS.Handler.MultipleProcessHandler.MultiplepPocessorIQHandler;

import org.dom4j.Element;
import org.jivesoftware.openfire.IQHandlerInfo;
import org.jivesoftware.openfire.auth.UnauthorizedException;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.IQ.Type;
import org.xmpp.packet.PacketError;

public class IQUserAuthorityHandler extends IQHandler implements
        IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo = null;

    public IQUserAuthorityHandler() {
        super("UserAuthority Handler");
        mInfo = new IQHandlerInfo("user_authority",
                "http://necst.nec.co.jp/protocol/authority");
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
        IQ replyPacket = null;
        if (execIQ(packet)) {
            replyPacket = UserAuthorityAdapter.getInstance()
                    .handleGetUserAuthorityIQ(packet);
        } else {
            replyPacket = IQ.createResultIQ(packet);
            replyPacket.setChildElement(packet.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.bad_request);
        }
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private boolean execIQ(IQ iq) throws UnauthorizedException {
        boolean ret = false;
        Element userAuthorityElement = iq.getChildElement();
        if (userAuthorityElement == null) {
            Log.debug("userAuthorityElement is null");
            return false;
        }
        if (!userAuthorityElement.getName().equals("user_authority")) {
            Log.debug("not userAuthorityElement");
            return false;
        }
        String namespace = userAuthorityElement.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/authority".equals(namespace)) {
            Log.debug("not task namespace");
            return false;
        }

        Type iqType = iq.getType();
        if (iqType.equals(IQ.Type.get)) {
            ret = true;
        } else if (iqType.equals(IQ.Type.set)) {
            ret = false;
        }
        return ret;
    }
}
