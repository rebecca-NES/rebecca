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
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.sql.Timestamp;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.MissingFormatArgumentException;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.UtilStringResource;
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Notification.SystemMessageNotifier;

import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;
import org.jivesoftware.openfire.XMPPServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SystemMessageAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(SystemMessageAdapter.class);
    private static SystemMessageAdapter mInstance = null;

    private static Object mLockObjectForGenerateId = new Object();

    private SystemMessageAdapter() {
    }

    public static SystemMessageAdapter getInstance() {
        if (mInstance == null) {
            mInstance = new SystemMessageAdapter();
        }
        return mInstance;
    }

    public Element getSystemMessageItemElemnt(Message systemMessage) {
        Set<String> jidSet = new HashSet<String>();
        Element item = DocumentHelper.createElement("item");
        Element id = DocumentHelper.createElement("id");
        id.setText(String.valueOf(systemMessage.getId()));
        item.add(id);

        Element itemId = DocumentHelper.createElement("item_id");
        itemId.setText(systemMessage.getItemId());
        item.add(itemId);

        Element messageType = DocumentHelper.createElement("msgtype");
        messageType.setText(String.valueOf(systemMessage.getMsgType()));
        item.add(messageType);

        Element messageFrom = DocumentHelper.createElement("msgfrom");
        String fromJid = systemMessage.getMsgFrom();
        messageFrom.setText(fromJid);
        item.add(messageFrom);
        jidSet.add(fromJid);

        Element messageTo = DocumentHelper.createElement("msgto");
        messageTo.setText(systemMessage.getMsgTo());
        item.add(messageTo);

        SAXReader xmlReader = new SAXReader();
        xmlReader.setEncoding("UTF-8");
        Element entry;
        String entryStr = systemMessage.getEntry();
        if (entryStr == null || entryStr.equals("")) {
            entry = DocumentHelper.createElement("entry");
        } else {
            String bodyString = "";
            try {
                Document doc = xmlReader.read(new StringReader(entryStr));
                entry = doc.getRootElement();
                Element body = entry.element("body");
                Element args = entry.element("args");

                if (systemMessage.getDeleteFlag() == 2) {
                    String deletedBy = systemMessage.getDeletedBy();
                    if (MessageAdapter.isDeletedByAdmin(deletedBy)) {
                        body.setText(Message.BODY_DELETED_ADMIN);
                    } else {
                        body.setText(Message.BODY_DELETED_SELF);
                    }
                } else {
                    if (body != null) {
                        String i18nKey = body.getStringValue();
                        String bodyStringformat = UtilStringResource
                                .getInstance().getString(i18nKey,
                                        Locale.JAPANESE);
                        if (bodyStringformat == null) {
                            Log.error("bodyStringformat is null. key : "
                                    + i18nKey);
                            bodyStringformat = "";
                        }
                        if (args != null) {
                            String argsCountString = "";
                            try {
                                argsCountString = args.attributeValue("count");
                                int argsCount = Integer
                                        .parseInt(argsCountString);
                                String[] argsString = new String[argsCount];
                                for (int i = 0; i < argsCount; i++) {
                                    Element arg = args.element("arg_"
                                            + String.valueOf(i + 1));
                                    String argString = "";
                                    if (arg != null) {
                                        argString = arg.getStringValue();
                                        if (argString == null) {
                                            argString = "";
                                        }
                                    }
                                    argsString[i] = URLDecoder.decode(
                                            argString, "utf-8");
                                }
                                bodyString = String.format(bodyStringformat,
                                        (Object[]) argsString);
                            } catch (NumberFormatException e) {
                                Log.error("NumberFormatException : "
                                        + argsCountString);
                                bodyString = bodyStringformat;
                            } catch (MissingFormatArgumentException e) {
                                Log.error("MissingFormatArgumentException : "
                                        + bodyStringformat);
                                bodyString = bodyStringformat;
                            }
                        } else {
                            Log.error("args is null");
                            bodyString = bodyStringformat;
                        }
                        String encodedBodyString = URLEncoder.encode(
                                bodyString, "utf-8");
                        body.setText(encodedBodyString);
                    }
                    if (args != null) {
                        entry.remove(args);
                    }
                }
            } catch (DocumentException e) {
                Log.error("entry data is not XML");
                entry = DocumentHelper.createElement("entry");
            } catch (UnsupportedEncodingException e) {
                Log.error("faild to encode string : " + bodyString);
                entry = DocumentHelper.createElement("entry");
            }
        }
        item.add(entry);

        Element replyId = DocumentHelper.createElement("reply_id");
        replyId.setText(systemMessage.getReplyId());
        item.add(replyId);

        Element replyTo = DocumentHelper.createElement("reply_to");
        replyTo.setText(systemMessage.getReplyTo());
        item.add(replyTo);

        Element createdAt = DocumentHelper.createElement("created_at");
        createdAt.setText(systemMessage.getCreatedAtStr());
        item.add(createdAt);

        List<GoodJob> goodJobList = systemMessage.getGoodJobList();
        Element goodJob = GoodJobAdapter.getInstance().getGoodJobElement(
                goodJobList);
        item.add(goodJob);

        Element context = DocumentHelper.createElement("context");
        item.add(context);

        Element deleteFlag = DocumentHelper.createElement("delete_flag");
        deleteFlag.setText(Integer.toString(systemMessage.getDeleteFlag()));
        item.add(deleteFlag);

        Element personInfoElement = UserProfileAdapter.getInstance()
                .createPersonInfoElement(jidSet);
        if (personInfoElement != null) {
            item.add(personInfoElement);
        }

        return item;
    }

    public void addSystemMessage(String triggerPersonJid, String triggerItemId,
            String bodyKey, List<String> argList, int triggerAction,
            List<String> sendToList) {
        if (bodyKey == null || bodyKey.equals("")) {
            Log.error("bodyKey is empty");
            return;
        }
        if (sendToList == null || sendToList.isEmpty()) {
            Log.error("sendToList is empty");
            return;
        }
        if (triggerPersonJid == null || triggerPersonJid.equals("")) {
            triggerPersonJid = XMPPServer.getInstance().getServerInfo()
                    .getXMPPDomain();
        }
        if (triggerItemId == null) {
            triggerItemId = "";
        }
        Message systemMessage = new Message();
        systemMessage.setMsgType(Message.TYPE_SYSTEM);
        systemMessage.setMsgFrom(triggerPersonJid);
        systemMessage.setMsgTo("");
        Element entryElement = DocumentHelper.createElement("entry");
        Element bodyElement = DocumentHelper.createElement("body");
        bodyElement.setText(bodyKey);
        entryElement.add(bodyElement);
        Element triggerActionElement = DocumentHelper
                .createElement("trigger_action");
        triggerActionElement.setText(String.valueOf(triggerAction));
        entryElement.add(triggerActionElement);
        Element argsElement = DocumentHelper.createElement("args");
        int argsCount = argList.size();
        argsElement.addAttribute("count", String.valueOf(argsCount));
        for (int i = 0; i < argsCount; i++) {
            Element argNElement = DocumentHelper.createElement("arg_"
                    + String.valueOf(i + 1));
            String argNString = argList.get(i);
            if (argNString == null) {
                argNString = "";
            }
            argNElement.setText(argNString);
            argsElement.add(argNElement);
        }

        entryElement.add(argsElement);
        String entryStr = entryElement.asXML();
        systemMessage.setEntry(entryStr);
        Calendar now = Calendar.getInstance();
        systemMessage.setCreatedAt(new Timestamp(now.getTimeInMillis()));
        systemMessage.setReplyId(triggerItemId);
        systemMessage.setReplyTo(triggerPersonJid);
        boolean saved = false;
        String itemId = null;
        synchronized (mLockObjectForGenerateId) {
            int regCount = SystemMessageDbHelper.getCreateCount();
            itemId = "system_" + String.valueOf(regCount + 1);
            systemMessage.setItemId(itemId);
            saved = MessageStoreDbHelper
                    .insertMessageToDb(systemMessage);
            if (!saved) {
                Log.error("faild to save System Message : item ID = " + itemId);
                return;
            }
        }
        saved = MessageSendToDbHelper.insertMessageSendToDb(itemId, sendToList);
        if (!saved) {
            MessageStoreDbHelper.deleteMessageToDb(itemId);
            Log.error("faild to save System Message Send To : item ID = "
                    + itemId);
            return;
        }
        SystemMessageNotifier.getInstance().notifySystemMessage(itemId);
    }
}
