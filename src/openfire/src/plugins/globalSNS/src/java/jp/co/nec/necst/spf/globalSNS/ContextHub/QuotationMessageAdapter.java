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

import java.io.StringReader;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.QuotationMessage;

public class QuotationMessageAdapter {
    private static final Logger Log
        = LoggerFactory.getLogger(GoodJobAdapter.class);

    private static QuotationMessageAdapter mInstance = null;

    private QuotationMessageAdapter(){
    }

    public static QuotationMessageAdapter getInstance() {
        if (mInstance == null) {
            mInstance = new QuotationMessageAdapter();
        }
        return mInstance;
    }

    public static Element createElement(Message message){
        Element quotation = DocumentHelper.createElement("quotation");
        QuotationMessage quotationMessageData = message.getQuotationMessageData();
        if(quotationMessageData != null){
            Element quotationItemId = DocumentHelper.createElement("quotation_item_id");
            String quotationItemIdStr = quotationMessageData.getQuotationItemId();
            if(quotationItemIdStr != null){
                quotationItemId.setText(quotationItemIdStr);
                quotation.add(quotationItemId);

                Element quotationId = DocumentHelper.createElement("id");
                String quotationIdStr = String.valueOf(quotationMessageData.getId());
                quotationId.setText(quotationIdStr);
                quotation.add(quotationId);

                Element quotationPrivateFlag = DocumentHelper.createElement("private_flag");
                String quotationPrivateFlagStr = String.valueOf(quotationMessageData.getPrivateFlag());
                quotationPrivateFlag.setText(quotationPrivateFlagStr);
                quotation.add(quotationPrivateFlag);

                Element quotationCreatedAt = DocumentHelper.createElement("created_at");
                String quotationCreatedAtStr = quotationMessageData.getCreatedAtStr();
                quotationCreatedAt.setText(quotationCreatedAtStr);
                quotation.add(quotationCreatedAt);

                Element quotationUpdatedAt = DocumentHelper.createElement("updated_at");
                String quotationUpdatedAtStr = quotationMessageData.getUpdatedAtStr();
                quotationUpdatedAt.setText(quotationUpdatedAtStr);
                quotation.add(quotationUpdatedAt);

                Element quotationMessageFrom = DocumentHelper.createElement("msgfrom");
                String quotationMessageFromStr = quotationMessageData.getMsgFrom();
                quotationMessageFrom.setText(quotationMessageFromStr);
                quotation.add(quotationMessageFrom);

                Element quotationMessageTo = DocumentHelper.createElement("msgto");
                String quotationMessageToStr = quotationMessageData.getMsgTo();
                quotationMessageTo.setText(quotationMessageToStr);
                quotation.add(quotationMessageTo);

                Element quotationMessageType = DocumentHelper.createElement("msgtype");
                String quotationMessageTypeStr = String.valueOf(quotationMessageData.getMsgType());
                quotationMessageType.setText(quotationMessageTypeStr);
                quotation.add(quotationMessageType);

                Element quotationUserName = DocumentHelper.createElement("user_name");
                String quotationUserNameStr = quotationMessageData.getUserName();
                quotationUserName.setText(quotationUserNameStr);
                quotation.add(quotationUserName);

                Element quotationNickName = DocumentHelper.createElement("nickname");
                String quotationNickNameStr = quotationMessageData.getNickName();
                quotationNickName.setText(quotationNickNameStr);
                quotation.add(quotationNickName);

                Element quotationPhotoType = DocumentHelper.createElement("photo_type");
                String quotationPhotoTypeStr = quotationMessageData.getPhotoType();
                quotationPhotoType.setText(quotationPhotoTypeStr);
                quotation.add(quotationPhotoType);

                Element quotationPhotoData = DocumentHelper.createElement("photo_data");
                String quotationPhotoDataStr = quotationMessageData.getPhotoData();
                quotationPhotoData.setText(quotationPhotoDataStr);
                quotation.add(quotationPhotoData);

                Element quotationAffiliation = DocumentHelper.createElement("affiliation");
                String quotationAffiliationStr = quotationMessageData.getAffiliation();
                quotationAffiliation.setText(quotationAffiliationStr);
                quotation.add(quotationAffiliation);

                SAXReader quotationXmlReader = new SAXReader();
                quotationXmlReader.setEncoding("UTF-8");
                Element quotationEntry;
                String quotationEntryStr = null;
                quotationEntryStr = quotationMessageData.getEntry();
                if (quotationEntryStr == null || quotationEntryStr.equals("")) {
                    quotationEntry = DocumentHelper.createElement("entry");
                } else {
                    try {
                        Document doc = quotationXmlReader.read(new StringReader(quotationEntryStr));
                        quotationEntry = doc.getRootElement();
                    } catch (DocumentException e) {
                        Log.error("quotationEntry data is not XML");
                        quotationEntry = DocumentHelper.createElement("entry");
                    }
                }
                Element quotationAttachedItems = quotationEntry.element("attached_items");
                if (quotationAttachedItems == null) {
                    quotationAttachedItems = DocumentHelper.createElement("attached_items");
                    quotationAttachedItems.addAttribute("count", String.valueOf(0));
                }
                quotation.add(quotationAttachedItems.createCopy());
                quotationEntry.remove(quotationAttachedItems);
                quotation.add(quotationEntry);
            }
        }
        return quotation;
    }
}
