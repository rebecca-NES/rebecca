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

import jp.co.nec.necst.spf.globalSNS.ContextHub.TaskMessageAdapter;
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

public class IQTaskHandler extends IQHandler implements IMultipleThreadHandleIQ {

    private IQHandlerInfo mInfo = null;

    public IQTaskHandler() {
        super("Task Handler");
        mInfo = new IQHandlerInfo("task",
                "http://necst.nec.co.jp/protocol/task");
    }

    @Override
    public IQHandlerInfo getInfo() {
        Log.debug("do func IQTaskHandler.getInfo(...");
        return mInfo;
    }

    @Override
    public IQ handleIQ(IQ packet) throws UnauthorizedException {
        Log.debug("do func IQTaskHandler.handleIQ(...");
        return MultiplepPocessorIQHandler.getInstance().addIQPacket(this,
                packet);
    }

    @Override
    public IQ handleIQInThread(IQ packet) throws UnauthorizedException {
        Log.debug("do func IQTaskHandler.handleIQInThread(...");
        IQ replyPacket = IQ.createResultIQ(packet);
        if (execIQ(packet)) {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
        } else {
            replyPacket.setChildElement(packet.getChildElement().createCopy());
            replyPacket.setError(PacketError.Condition.bad_request);
        }
        return replyPacket;
    }

    @SuppressWarnings("deprecation")
    private boolean execIQ(IQ iq) throws UnauthorizedException {
        Log.debug("do func IQTaskHandler.execIQ(...");
        boolean ret = false;
        Element taskElement = iq.getChildElement();
        if (taskElement == null) {
            Log.debug("taskElement is null");
            return false;
        }
        if (!taskElement.getName().equals("task")) {
            Log.debug("not taskElement");
            return false;
        }
        String namespace = taskElement.getNamespaceURI();
        if (!"http://necst.nec.co.jp/protocol/task".equals(namespace)) {
            Log.debug("not task namespace");
            return false;
        }

        TaskMessageAdapter taskMessageAdapter = TaskMessageAdapter
                .getInstance();

        Type iqType = iq.getType();
        if (iqType.equals(IQ.Type.set)) {
            Element element = taskElement.element("add");
            if (element != null) {
                ret = taskMessageAdapter.addTaskHundler(element, iq.getFrom(),
                        iq.getTo());
            } else if ((element = taskElement.element("update")) != null) {
                ret = taskMessageAdapter.updateTaskHundler(element,
                        iq.getFrom(), iq.getTo());
            } else {
                ret = false;
            }
        } else if (iqType.equals(IQ.Type.get)) {
            ret = false;
        }
        return ret;
    }
}
