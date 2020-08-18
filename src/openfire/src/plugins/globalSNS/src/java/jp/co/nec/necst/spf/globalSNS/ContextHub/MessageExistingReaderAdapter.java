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

import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.MessageExistingReaderInfo;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Setting.ShowMessageReadInfoSetting;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.jivesoftware.util.Log;

public class MessageExistingReaderAdapter {

    private static MessageExistingReaderAdapter mMessageExistingReaderAdapter = null;

    private MessageExistingReaderAdapter() {
    }

    public static MessageExistingReaderAdapter getInstance() {
        if (mMessageExistingReaderAdapter == null) {
            mMessageExistingReaderAdapter = new MessageExistingReaderAdapter();
        }
        return mMessageExistingReaderAdapter;
    }

    @SuppressWarnings("deprecation")
    public void setMessageReadInfo(Element rootElement, Message message){
        if(rootElement == null){
            return;
        }
        if(message == null){
            return;
        }
        Element readFlag = DocumentHelper.createElement("readflg");
        readFlag.setText(String.valueOf(message.getReadFlag()));
        rootElement.add(readFlag);
        boolean isShow = ShowMessageReadInfoSetting.getInstance().isShow(message);
        if(!isShow){
            return;
        }
        Element readItemsElm = DocumentHelper.createElement("readItems");
        BigInteger readAllCount = message.getReadAllCount();
        if(readAllCount != null) {
            readItemsElm.addAttribute("allcount", message.getReadAllCount().toString());
        } else {
            readItemsElm.addAttribute("allcount","0");
        }
        List<MessageExistingReaderInfo> readItems = message.getReadItem();
        int count = 0;
        if(readItems != null){
            count = readItems.size();
        }
        for(int i = 0; i < count; i++){
            MessageExistingReaderInfo messageExistingReaderInfo = readItems.get(i);
            if(messageExistingReaderInfo == null) {
                Log.error("MessageExistingReaderAdapter#setMessageReadInfo:messageExistingReaderInfo is null");
                continue;
            }
            Element item = getMessageExistingReaderInfoElement(messageExistingReaderInfo);
            if(item == null) {
                Log.error("MessageExistingReaderAdapter#item is null");
                continue;
            }
            readItemsElm.add(item);
        }
        rootElement.add(readItemsElm);
    }

    private Element getMessageExistingReaderInfoElement(
            MessageExistingReaderInfo messageExistingReaderInfo) {
        if(messageExistingReaderInfo == null){
            return null;
        }
        Element itemElm = DocumentHelper.createElement("item");
        Element jidElm = DocumentHelper.createElement("jid");
        itemElm.add(jidElm);
        jidElm.setText(messageExistingReaderInfo.getJid());
        Profile profile = UserProfileDbHelper.getUserProfileData(messageExistingReaderInfo.getJid(), false);
        Element nickNameElm = DocumentHelper.createElement("nickname");
        try {
            String nickName = URLDecoder.decode(profile.getNickName(), "UTF-8");
            nickName = URLEncoder.encode(nickName, "UTF-8");
            nickNameElm.setText(nickName);
            itemElm.add(nickNameElm);
        } catch (UnsupportedEncodingException e) {
            return null;
        }
        Element avatarTypeElm = DocumentHelper.createElement("avatartype");
        avatarTypeElm.setText(profile.getPhotoType());
        itemElm.add(avatarTypeElm);
        Element avatarDataElm = DocumentHelper.createElement("avatardata");
        avatarDataElm.setText(profile.getPhotoData());
        itemElm.add(avatarDataElm);
        Element dateElm = DocumentHelper.createElement("date");
        dateElm.setText(messageExistingReaderInfo.getDateStr());
        itemElm.add(dateElm);
        return itemElm;
    }

    public List<MessageExistingReaderInfo> getExistingReaderListWithDetail(
            Message message) {
        if(message == null){
            return null;
        }
        BigInteger id = message.getId();
        List<MessageExistingReaderInfo> existingReaderList = ReadMessageInfoStoreDbHelper.getExistingReaderListWithDetail(id);
        return existingReaderList;
    }

    public List<String> getExistingReaderList(
            Message message) {
        if(message == null){
            return null;
        }
        BigInteger id = message.getId();
        List<String> existingReaderList = ReadMessageInfoStoreDbHelper.getExistingReaderList(id);
        return existingReaderList;
    }

    public List<Element> createExistingReaderInfoElement(List<MessageExistingReaderInfo> existingReaderList) {
        if(existingReaderList == null){
            return null;
        }
        List<Element> ret = new ArrayList<Element>();
        int count = existingReaderList.size();
        for(int i = 0; i < count; i++){
            MessageExistingReaderInfo messageExistingReaderInfo = existingReaderList.get(i);
            Element messageExistingReaderInfoElement = getMessageExistingReaderInfoElement(messageExistingReaderInfo);
            ret.add(messageExistingReaderInfoElement);
        }
        return ret;
    }

}
