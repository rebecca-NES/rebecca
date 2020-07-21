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

package jp.co.nec.necst.spf.globalSNS.ContextHub;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.PublicMessageQuestionnaireInfo;
import jp.co.nec.necst.spf.globalSNS.Data.VoteStore;
import jp.co.nec.necst.spf.globalSNS.Notification.QuestionnaireMessageNotifier;

import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

public class VoteMessageAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(VoteMessageAdapter.class);
    private static VoteMessageAdapter mInstance = null;

    private VoteMessageAdapter() {
    }

    public static VoteMessageAdapter getInstance() {
        if (mInstance == null) {
            mInstance = new VoteMessageAdapter();
        }
        return mInstance;
    }

    public void appendExtraQuestionnaireVoteData(Message message) {

        message.setOptionItemList(VoteStoreDbHelper.getOptionItemList(message));

        message.setVoteFlag(Message.VOTE_FLAG_NON_VOTE);
    }

    public IQ receiveVoteMessage(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("VoteMessageAdpter#receiveVoteMessage::iq is null");
            return ret;
        }

        updateVoteStore(iq);
        ret = IQ.createResultIQ(iq);
        ret.setChildElement(iq.getChildElement().createCopy());
        return ret;
    }

    private void updateVoteStore(IQ iq) {
        if (iq == null) {
            Log.error("VoteMessageAdpter#getRequestedVoteMessageFromAddOrUpdateMessageXMPP::iq is null");
            return;
        }
        if (!iq.getType().equals(IQ.Type.set)) {
            Log.error("VoteMessageAdpter#getRequestedVoteMessageFromAddOrUpdateMessageXMPP::not type set");
            return;
        }
        Element messageElem = iq.getChildElement();
        if (messageElem == null) {
            Log.error("VoteMessageAdpter#getRequestedVoteMessageFromAddOrUpdateMessageXMPP::messageElem is null");
            return;
        }
        Element contentElem = messageElem.element("content");
        if (contentElem == null) {
            Log.error("VoteMessageAdpter#getRequestedVoteMessageFromAddOrUpdateMessageXMPP::contentElem is null");
            return;
        }
        getVoteMessageData(contentElem, iq.getFrom());
    }

    @SuppressWarnings("unchecked")
    private void getVoteMessageData(Element contentElement, JID fromJid) {
        List<VoteStore> voteMessages = new ArrayList<VoteStore>();
        if (contentElement == null) {
            Log.error("VoteMessageAdpter#getVoteMessageData::not itemElement");
            return;
        }
        Element itemIdElement = contentElement.element("itemId");
        if (itemIdElement == null) {
            Log.error("VoteMessageAdpter#getVoteMessageData::not itemIdElement");
            return;
        }
        if (itemIdElement.getStringValue() == null
                || itemIdElement.getStringValue().equals("")) {
            Log.error("VoteMessageAdpter#getVoteMessageData::not itemId");
            return;
        }

        String roomType = PublicMessageQuestionnaireStoreDbHelper
                .getQuestionnaireRoomType(itemIdElement.getStringValue());
        if (roomType == null) {
            Log.error("VoteMessageAdpter#getVoteMessageData::roomType = null item = "
                    + itemIdElement.getStringValue());
        }
        Element msgtoElement = contentElement.element("msgto");
        if (msgtoElement == null) {
            Log.error("QuestionnaireAdapter#saveQuestionnaireMessage::not msgtoElement");
            return;
        }
        String msgto = msgtoElement.getStringValue();
        if (msgto == null) {
            Log.error("VoteMessageAdpter#getVoteMessageData::not msgto");
            return;
        }

        Element optionItems = contentElement.element("optionItems");
        if (optionItems == null) {
            Log.error("VoteMessageAdpter#getVoteMessageData::not optionItems");
            return;
        }

        List<Element> optionItemList = optionItems.elements("optionItem");
        if (optionItemList == null) {
            Log.error("VoteMessageAdpter#getVoteMessageData::not optionItemList");
            return;
        }
        if (optionItemList.size() < 1) {
            Log.error("VoteMessageAdpter#getVoteMessageData::optionItemList.size < 1");
            return;
        }

        for (Element optionItem : optionItemList) {
            Element optionIdElement = optionItem.element("optionId");
            if (optionIdElement == null) {
                Log.error("VoteMessageAdpter#getVoteMessageData::not optionIdElement");
                return;
            }
            if (optionIdElement.getStringValue() == null
                    || optionIdElement.getStringValue().equals("")) {
                Log.error("VoteMessageAdpter#getVoteMessageData::not optionId");
                return;
            }

            Element valueElement = optionItem.element("optionValue");
            if (valueElement == null) {
                Log.error("VoteMessageAdpter#getVoteMessageData::not optionValue");
                return;
            }
            if (valueElement.getStringValue() == null
                    || valueElement.getStringValue().equals("")) {
                Log.error("VoteMessageAdpter#getVoteMessageData::not value");
                return;
            }
            String value = valueElement.getStringValue();

            String userId = null;
            if (fromJid != null) {
                String fromJidStr = fromJid.toBareJID();
                if (fromJidStr == null || fromJidStr.equals("")) {
                    Log.error("VoteMessageAdpter#getVoteMessageData::from jid string is invalid");
                    return;
                }

                Profile profile = UserProfileDbHelper
                        .getUserProfileData(fromJidStr.trim());
                if (profile == null) {
                    Log.error("VoteMessageAdpter#getVoteMessageData::UserProfile from jid string is not exist");
                    return;
                }
                String s62 = GlobalSNSUtils.decimalToSixtyTwoString(BigInteger
                        .valueOf(profile.getId()));
                userId = GlobalSNSUtils.escapeSqlData(s62);

                VoteStore voteMessage = new VoteStore();
                voteMessage.setItemId(itemIdElement.getStringValue());
                voteMessage.setRoomId(msgto);
                voteMessage.setUserId(userId);
                voteMessage.setValue(Integer.parseInt(value));
                voteMessage.setOptionId(new BigInteger(optionIdElement
                        .getStringValue()));
                voteMessages.add(voteMessage);
            }
        }

        if (VoteStoreDbHelper.updateVoteStore(voteMessages)) {
            switch (Integer.valueOf(roomType)) {
                case PublicMessageQuestionnaireInfo.ROOM_TYPE_GROUP:
                    QuestionnaireAdapter.getInstance()
                            .notifyAddQuestionnaireVoteMessageForGroup(
                                    itemIdElement.getStringValue(),
                                    fromJid.toBareJID(), msgto);
                    break;
                case PublicMessageQuestionnaireInfo.ROOM_TYPE_COMMUNITY:
                    QuestionnaireAdapter.getInstance()
                        .notifyAddQuestionnaireVoteMessageForCommunity
                        (itemIdElement.getStringValue(), msgto);
                    break;
                default:
                    QuestionnaireMessageNotifier.getInstance()
                            .notifyQuestionnaireMessage(
                                    itemIdElement.getStringValue());
                    break;
            }
        } else {
            Log.error("VoteMessageAdapter VoteStoreDbHelper.updateVoteStore false");
        }
        Log.info("VoteMessageAdapter.getVoteMessageData END");
    }
}
