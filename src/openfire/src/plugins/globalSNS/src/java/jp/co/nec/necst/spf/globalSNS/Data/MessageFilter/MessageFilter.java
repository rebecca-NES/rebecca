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

package jp.co.nec.necst.spf.globalSNS.Data.MessageFilter;

import java.util.List;

import jp.co.nec.necst.spf.globalSNS.ContextHub.MessageStoreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.MessageFilter.ItemCondition.ValueType;

import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class MessageFilter {

    private MessageFilter() {
    }

    @SuppressWarnings("deprecation")
    static public MessageFilterCondition createFilterConditionFromFilterElement(
            Element element) {
        MessageFilterCondition ret = null;
        if (element == null) {
            Log.error("MessageFilterCondition#createFilterConditionFromFilterElement::element is null");
            return ret;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("MessageFilterCondition#createFilterConditionFromFilterElement::tag name is null");
            return ret;
        }
        if (!(tagName.toLowerCase().equals("filter"))) {
            Log.error("MessageFilterCondition#createFilterConditionFromFilterElement::tag name is different");
            return ret;
        }
        List<?> conditionList = element.elements();
        if (conditionList == null || conditionList.size() != 1) {
            Log.error("MessageFilterCondition#createFilterConditionFromFilterElement::child elem count is not one");
            return ret;
        }
        Object childElement = conditionList.get(0);
        if (!(childElement instanceof Element)) {
            Log.error("MessageFilterCondition#createFilterConditionFromFilterElement::child element is not Element Object");
            return ret;
        }
        return createConditionFromConditionElement((Element) childElement);
    }

    @SuppressWarnings("deprecation")
    static public MessageFilterCondition createConditionFromConditionElement(
            Element element) {
        if (element == null) {
            Log.error("MessageFilterCondition#createConditionFromElement::element is null");
            return null;
        }
        String tagName = element.getName();
        if (tagName == null) {
            Log.error("MessageFilterCondition#createConditionFromElement::tag name is null");
            return null;
        }
        MessageFilterCondition condition = null;
        if (tagName.toLowerCase().equals(AndCondition.ELEMENT_NAME)) {
            condition = new AndCondition();
        } else if (tagName.toLowerCase().equals(OrCondition.ELEMENT_NAME)) {
            condition = new OrCondition();
        } else if (tagName.toLowerCase().equals(NotCondition.ELEMENT_NAME)) {
            condition = new NotCondition();
        } else if (tagName.toLowerCase().equals(ItemCondition.ELEMENT_NAME)) {
            condition = new ItemCondition();
        } else if (tagName.toLowerCase().equals(
                GreaterThanCondition.ELEMENT_NAME)) {
            condition = new GreaterThanCondition();
        } else if (tagName.toLowerCase().equals(LessThanCondition.ELEMENT_NAME)) {
            condition = new LessThanCondition();
        } else if (tagName.toLowerCase().equals(KeywordCondition.ELEMENT_NAME)) {
            condition = new KeywordCondition();
        } else if (tagName.toLowerCase().equals(
                ParticularCondition.ELEMENT_NAME)) {
            condition = new ParticularCondition();
        } else {
            Log.error("MessageFilterCondition#createConditionFromElement::tag name is unknown");
            return null;
        }
        if (!condition.setDataFromElement(element)) {
            Log.error("MessageFilterCondition#createConditionFromElement::failed to set element");
            return null;
        }
        return condition;
    }

    @SuppressWarnings("deprecation")
    static public MessageFilterCondition addRefinedFilter(
            MessageFilterCondition condition, String jid) {
        return addRefinedFilter(condition, jid, false);
    }
    @SuppressWarnings("deprecation")
    static public MessageFilterCondition addRefinedFilter
        (MessageFilterCondition condition, String jid, boolean isFeedInFilter) {
        AndCondition retCondition = new AndCondition();
        if (!retCondition.addChildCondition(condition)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to add condition to retCondition");
            return null;
        }
        OrCondition refinedCondition = new OrCondition();
        ItemCondition publicMessageRefinedCondition = new ItemCondition();
        if (!publicMessageRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                ValueType.NUMBER, "1")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set publicMessageRefinedCondition data");
            return null;
        }
        refinedCondition.addChildCondition(publicMessageRefinedCondition);
        AndCondition chatMessageRefinedCondition = new AndCondition();
        ItemCondition chatMessageTypeRefinedCondition = new ItemCondition();
        if (!chatMessageTypeRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                ValueType.NUMBER, "2")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set chatMessageTypeRefinedCondition data");
            return null;
        }
        chatMessageRefinedCondition
                .addChildCondition(chatMessageTypeRefinedCondition);
        OrCondition chatMessageFromOrToRefinedCondition = new OrCondition();
        ItemCondition chatMessageFromRefinedCondition = new ItemCondition();
        if (!chatMessageFromRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_FROM_NAME,
                ValueType.STRING, jid)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set chatMessageFromRefinedCondition data");
            return null;
        }
        chatMessageFromOrToRefinedCondition
                .addChildCondition(chatMessageFromRefinedCondition);
        ItemCondition chatMessageToRefinedCondition = new ItemCondition();
        if (!chatMessageToRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TO_NAME, ValueType.STRING,
                jid)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set chatMessageToRefinedCondition data");
            return null;
        }
        chatMessageFromOrToRefinedCondition
                .addChildCondition(chatMessageToRefinedCondition);
        chatMessageRefinedCondition
                .addChildCondition(chatMessageFromOrToRefinedCondition);
        refinedCondition.addChildCondition(chatMessageRefinedCondition);
        AndCondition groupChatMessageRefinedCondition = new AndCondition();
        ItemCondition groupChatMessageTypeRefinedCondition = new ItemCondition();
        if (!groupChatMessageTypeRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                ValueType.NUMBER, "3")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set groupChatMessageTypeRefinedCondition data");
            return null;
        }
        groupChatMessageRefinedCondition
                .addChildCondition(groupChatMessageTypeRefinedCondition);
        GroupChatNarrowCondition groupChatNarrowCondition = new GroupChatNarrowCondition();
        if (!groupChatNarrowCondition.setData(jid)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set groupChatMessageToRefinedCondition data");
            return null;
        }
        groupChatMessageRefinedCondition
                .addChildCondition(groupChatNarrowCondition);
        refinedCondition.addChildCondition(groupChatMessageRefinedCondition);
        AndCondition groupQuestionnaireMessageRefinedCondition = new AndCondition();
        ItemCondition groupQuestionnaireMessageTypeRefinedCondition = new ItemCondition();
        if (!groupQuestionnaireMessageTypeRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                ValueType.NUMBER, "10")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set groupQuestionnaireMessageTypeRefinedCondition data");
            return null;
        }
        groupQuestionnaireMessageRefinedCondition
                .addChildCondition(groupQuestionnaireMessageTypeRefinedCondition);
        GroupChatNarrowCondition groupQuestionnaireNarrowCondition = new GroupChatNarrowCondition();
        if (!groupQuestionnaireNarrowCondition.setData(jid)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set groupQuestionnaireMessageToRefinedCondition data");
            return null;
        }
        groupQuestionnaireMessageRefinedCondition
                .addChildCondition(groupQuestionnaireNarrowCondition);
        refinedCondition.addChildCondition(groupQuestionnaireMessageRefinedCondition);
        AndCondition taskMessageRefinedCondition = new AndCondition();
        ItemCondition taskMessageTypeRefinedCondition = new ItemCondition();
        if (!taskMessageTypeRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                ValueType.NUMBER, "4")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set taskMessageTypeRefinedCondition data");
            return null;
        }
        taskMessageRefinedCondition
                .addChildCondition(taskMessageTypeRefinedCondition);
        OrCondition ownOrCommunityTaskMessageRefined = new OrCondition();
        ItemCondition taskMessageOwnerRefinedCondition = new ItemCondition();
        if (!taskMessageOwnerRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_OWNER_NAME, ValueType.STRING, jid)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set taskMessageOwnerRefinedCondition data");
            return null;
        }
        ownOrCommunityTaskMessageRefined
                .addChildCondition(taskMessageOwnerRefinedCondition);
        CommunityMessageJoinedCondition communityTaskJoinedCondition = new CommunityMessageJoinedCondition();
        if (!communityTaskJoinedCondition.setData(jid,
                MessageStoreDbHelper.COLUMN_GROUP_NAME)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set communityTaskSeekableCondition data");
            return null;
        }
        ownOrCommunityTaskMessageRefined
                .addChildCondition(communityTaskJoinedCondition);
        taskMessageRefinedCondition
                .addChildCondition(ownOrCommunityTaskMessageRefined);
        refinedCondition.addChildCondition(taskMessageRefinedCondition);
        AndCondition communityMessageRefinedCondition = new AndCondition();
        ItemCondition communityMessageTypeRefinedCondition = new ItemCondition();
        if (!communityMessageTypeRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                ValueType.NUMBER, "5")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set communityMessageTypeRefinedCondition data");
            return null;
        }
        communityMessageRefinedCondition
                .addChildCondition(communityMessageTypeRefinedCondition);
        CommunityMessageJoinedCondition communityMessageJoinedCondition = new CommunityMessageJoinedCondition();
        if (!communityMessageJoinedCondition.setData(jid,
                MessageStoreDbHelper.COLUMN_MESSAGE_TO_NAME)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set communityMessageSeekableCondition data");
            return null;
        }
        communityMessageRefinedCondition
                .addChildCondition(communityMessageJoinedCondition);
        refinedCondition.addChildCondition(communityMessageRefinedCondition);
        AndCondition communityQuestionnaireRefinedCondition = new AndCondition();
        ItemCondition communityQuestionnaireTypeRefinedCondition = new ItemCondition();
        if (!communityQuestionnaireTypeRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                ValueType.NUMBER, "10")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set communityQuestionnaireTypeRefinedCondition data");
            return null;
        }
        communityQuestionnaireRefinedCondition
                .addChildCondition(communityQuestionnaireTypeRefinedCondition);
        CommunityMessageJoinedCondition communityQuestionnaireJoinedCondition = new CommunityMessageJoinedCondition();
        if (!communityQuestionnaireJoinedCondition.setData(jid,
                MessageStoreDbHelper.COLUMN_MESSAGE_TO_NAME)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set communityQuestionnaireSeekableCondition data");
            return null;
        }
        communityQuestionnaireRefinedCondition
                .addChildCondition(communityQuestionnaireJoinedCondition);
        refinedCondition.addChildCondition(communityQuestionnaireRefinedCondition);
        if(isFeedInFilter){
            AndCondition feedQuestionnaireRefinedCondition = new AndCondition();
            ItemCondition feedQuestionnaireTypeRefinedCondition = new ItemCondition();
            if (!feedQuestionnaireTypeRefinedCondition.setData
                ( MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                  ValueType.NUMBER, "10")) {
                Log.error("MessageFilterCondition#addRefinedFilter::failed to set feedQuestionnaireTypeRefinedCondition data");
                return null;
            }
            feedQuestionnaireRefinedCondition
                .addChildCondition(communityQuestionnaireTypeRefinedCondition);
            QuestionnaireMessageColumnTypeCondition feedQuestionnaireRoomTypeRefinedCondition = new QuestionnaireMessageColumnTypeCondition();
            if (!feedQuestionnaireRoomTypeRefinedCondition.setData
                (1, MessageStoreDbHelper.TABLE_NAME + "." + MessageStoreDbHelper.COLUMN_ITEM_ID_NAME)) {
                Log.error("MessageFilterCondition#addRefinedFilter::failed to set feedQuestionnaireTypeRefinedCondition data");
                return null;
            }
            feedQuestionnaireRefinedCondition
                .addChildCondition(feedQuestionnaireRoomTypeRefinedCondition);
            refinedCondition.addChildCondition(feedQuestionnaireRefinedCondition);
        }
        ItemCondition murmurTypeRefinedCondition = new ItemCondition();
        if (!murmurTypeRefinedCondition.setData
            ( MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
              ValueType.NUMBER, "11")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set murmurTypeRefinedCondition data");
            return null;
        }
        refinedCondition.addChildCondition(murmurTypeRefinedCondition);
        AndCondition mailMessageRefinedCondition = new AndCondition();
        ItemCondition mailMessageTypeRefinedCondition = new ItemCondition();
        if (!mailMessageTypeRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TYEP_NAME,
                ValueType.NUMBER, "9")) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set mailMessageTypeRefinedCondition data");
            return null;
        }
        mailMessageRefinedCondition
                .addChildCondition(mailMessageTypeRefinedCondition);
        ItemCondition mailMessageMsgtoRefinedCondition = new ItemCondition();
        if (!mailMessageMsgtoRefinedCondition.setData(
                MessageStoreDbHelper.COLUMN_MESSAGE_TO_NAME, ValueType.STRING,
                jid)) {
            Log.error("MessageFilterCondition#addRefinedFilter::failed to set mailMessageMsgtoRefinedCondition data");
            return null;
        }
        mailMessageRefinedCondition
                .addChildCondition(mailMessageMsgtoRefinedCondition);
        refinedCondition.addChildCondition(mailMessageRefinedCondition);

        retCondition.addChildCondition(refinedCondition);
        return retCondition;
    }

}
