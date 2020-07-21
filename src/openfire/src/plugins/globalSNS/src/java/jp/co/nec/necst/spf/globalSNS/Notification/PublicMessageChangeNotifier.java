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

import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageAdapter;
import jp.co.nec.necst.spf.globalSNS.ContextHub.PublicMessageAdapter;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeControler;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketClientNotifier;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;

public class PublicMessageChangeNotifier extends AbstractIndividualNotifier<String> {
    private static final Logger Log = LoggerFactory
            .getLogger(PublicMessageChangeNotifier.class);
    private static PublicMessageChangeNotifier mInstance = null;

    public static PublicMessageChangeNotifier getInstance() {
        if (mInstance == null) {
            mInstance = new PublicMessageChangeNotifier();
        }
        return mInstance;
    }

    private PublicMessageChangeNotifier() {
    }

    public void notifyPublicMessage(String itemId) {
        Log.debug("do func PublicMessageChangeNotifier.notifyPublicMessage(...");
        if (itemId == null) {
            Log.error("PublicMessageChangeNotifier#notifyPublicMessage::itemId is null.");
            return;
        }
        addQueue(itemId);
    }

    @Override
    protected void threadProcessOneData(String itemId) {
        if (itemId == null) {
            Log.error("PublicMessageChangeNotifier#threadProcessOneData::itemId is null");
            return;
        }
        Message publicMessage = MessageAdapter.getInstance()
                .getMessageWithoutReadInfo(itemId);
        if (publicMessage == null) {
            Log.error("PublicMessageChangeNotifier#threadProcessOneData::publicMessage is null");
            return;
        }
        if (publicMessage.getShowType() == 0) {
            return;
        }
        String fromJidStr = publicMessage.getMsgFrom();
        JID fromJid = new JID(fromJidStr);
        Set<JID> ownJidSet = new HashSet<JID>();
        ownJidSet.add(fromJid);
        MessageNotifier.getInstance().notifyUpdateMessageBody(publicMessage, ownJidSet,
                false);

        Set<JID> receiverJidSet = PublicMessageAdapter.getInstance()
                .getPublicMessageReceiverJidSet(fromJidStr);

        MessageNotifier.getInstance().notifyUpdateMessageBody(publicMessage,
                receiverJidSet, false);
    }
}
