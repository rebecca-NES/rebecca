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

import jp.co.nec.necst.spf.globalSNS.Data.MessageFilter.MessageFilter;
import jp.co.nec.necst.spf.globalSNS.Data.MessageFilter.MessageFilterCondition;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;

public class GetCountAdapter {

    private static GetCountAdapter mThisInstance = null;

    private GetCountAdapter() {
    }

    public static GetCountAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new GetCountAdapter();
        }
        return mThisInstance;
    }

    @SuppressWarnings("deprecation")
    public IQ message(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("GetCountAdapter#message::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error("GetCountAdapter#message::iq type is not set");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("GetCountAdapter#message::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("GetCountAdapter#message::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/getcount"))) {
            Log.error("GetCountAdapter#message::namespace is invalid");
            return ret;
        }
        Element contentElem = queryElem.element("content");
        if (contentElem == null) {
            Log.error("GetCountAdapter#message::contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error("GetCountAdapter#message::typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (type == null || !type.equals("Message")) {
            Log.error("GetCountAdapter#message::type is invalid");
            return ret;
        }
        Element conditionElem = contentElem.element("condition");
        if (conditionElem == null) {
            Log.error("GetCountAdapter#message::conditionElem is null");
            return ret;
        }
        Element filterElem = conditionElem.element("filter");
        if (filterElem == null) {
            Log.error("GetCountAdapter#message::filterElem is null");
            return ret;
        }
        MessageFilterCondition filterCondition = MessageFilter
                .createFilterConditionFromFilterElement(filterElem);
        if (filterCondition == null) {
            Log.error("GetCountAdapter#message::filterCondition is null");
            return ret;
        }
        int messageCount = MessageStoreDbHelper.getMessageCount(filterCondition);

        return createGetCountResultIQ(iq, type, messageCount);
    }

    @SuppressWarnings("deprecation")
    private IQ createGetCountResultIQ(IQ iq, String type, int searchAllCount) {
        IQ ret = null;
        if (iq == null) {
            Log.warn("GetCountAdapter#createGetCountResultIQ::iq is null");
            return ret;
        }
        Element queryElem = iq.getChildElement();
        if (queryElem == null) {
            Log.error("GetCountAdapter#createGetCountResultIQ::queryElem is null");
            return ret;
        }
        String tagName = queryElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("query"))) {
            Log.error("GetCountAdapter#createGetCountResultIQ::tagName is invalid");
            return ret;
        }
        String namespace = queryElem.getNamespaceURI();
        if (namespace == null
                || !(namespace.equals("http://necst.nec.co.jp/protocol/getcount"))) {
            Log.error("GetCountAdapter#createGetCountResultIQ::namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = queryElem.element("content");
        if (contentElem != null) {
            queryElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element typeElem = DocumentHelper.createElement("type");
        typeElem.setText(type);
        Element countElem = DocumentHelper.createElement("count");
        countElem.setText(String.valueOf(searchAllCount));
        Element extrasElem = DocumentHelper.createElement("extras");

        newContentElem.add(typeElem);
        newContentElem.add(countElem);
        newContentElem.add(extrasElem);
        queryElem.add(newContentElem);
        queryElem.setParent(null);
        replyPacket.setChildElement(queryElem);

        return replyPacket;
    }
}
