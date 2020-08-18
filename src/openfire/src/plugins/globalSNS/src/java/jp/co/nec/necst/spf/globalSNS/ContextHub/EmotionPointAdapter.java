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
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jp.co.nec.necst.spf.globalSNS.GlobalSNSUtils;
import jp.co.nec.necst.spf.globalSNS.Data.EmotionPoint;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;

public class EmotionPointAdapter {
    private static final Logger Log = LoggerFactory
        .getLogger(EmotionPointAdapter.class);
    private static EmotionPointAdapter mEmotionPointAdapter = null;

    private EmotionPointAdapter() {
    }

    public static EmotionPointAdapter getInstance() {
        Log.debug("do func EmotionPointAdapter.getInstance(...");
        if (mEmotionPointAdapter == null) {
            mEmotionPointAdapter = new EmotionPointAdapter();
        }
        return mEmotionPointAdapter;
    }

    public Element getEmotionPointElement(List<EmotionPoint> emotionPointList) {
        Log.debug("do func EmotionPointAdapter.getEmotionPointElement(...");
        Element emotionPoint = DocumentHelper.createElement("emotionpoint");
        int gjCount = 0;
        if (emotionPointList != null) {
            gjCount = emotionPointList.size();
        }
        emotionPoint.addAttribute("count", String.valueOf(gjCount));
        if (emotionPointList == null || gjCount == 0) {
            return emotionPoint;
        }
        List<String> emotionPointJidList = MessageAdapter.getInstance()
            .extractJidListFromEmotionPointList(emotionPointList);
        List<Profile> profileList = new ArrayList<Profile>();
        if (emotionPointJidList != null && !emotionPointJidList.isEmpty()) {
            profileList = UserAccountManager.getInstance()
                .getProfileList(emotionPointJidList);
        }
        Map<String, Profile> profileHashMap = new ConcurrentHashMap<String, Profile>();
        if (profileList != null) {
            for (Profile profile : profileList) {
                if (profile == null) {
                    Log.info("EmotionPointAdapter#getEmotionPointElement::profile is null.");
                    continue;
                }
                profileHashMap.put(profile.getJid(), profile);
            }
        }
        for (int i = 0; i < gjCount; i++) {
            EmotionPoint emotionPointData = emotionPointList.get(i);
            if (emotionPointData == null) {
                Log.info("EmotionPointAdapter#getEmotionPointElement::emotionPointData is null.");
                continue;
            }
            Profile profileData = profileHashMap.get(emotionPointData.getJid());
            if (profileData == null) {
                Log.info("EmotionPointAdapter#getEmotionPointElement::profileData is null.");
            }
            Element emotionPointItem = getEmotionPointItemElement(emotionPointData,
                                                                  profileData,"{}");
            if (emotionPointItem == null) {
                Log.error("EmotionPointAdapter#getEmotionPointElement::emotionPointItem is null.");
                continue;
            }
            emotionPoint.add(emotionPointItem);
        }
        return emotionPoint;
    }

    public Element getEmotionPointItemElement(EmotionPoint emotionPointData,
                                              Profile profile,
                                              String emotionPointIconJson) {
        Log.debug("do func EmotionPointAdapter.getEmotionPointItemElement(...");
        if (emotionPointData == null) {
            Log.error("EmotionPointAdapter#getEmotionPointItemElement::emotionPointData is null.");
            return null;
        }
        if(emotionPointIconJson == null ||
           emotionPointIconJson.length() == 0){
            emotionPointIconJson = "{}";
        }
        Element emotionPointItem = DocumentHelper.createElement("item");

        emotionPointItem.addAttribute("itemid", emotionPointData.getItemId());

        emotionPointItem.addAttribute("msgownjid", emotionPointData.getMsgOwnJid());

        emotionPointItem.addAttribute("msgto", emotionPointData.getMsgTo());

        emotionPointItem.addAttribute("msgtype", String.valueOf(emotionPointData.getMsgType()));

        emotionPointItem.addAttribute("body", emotionPointData.getEntryBody());

        emotionPointItem.addAttribute("emotion_point",
                                      String.valueOf(emotionPointData.getEmotionPoint()));

        Element emotionPointIconJsonElem = DocumentHelper.createElement("emotion_point_icon");
        emotionPointIconJsonElem.setText(emotionPointIconJson);
        emotionPointItem.add(emotionPointIconJsonElem);

        String jid = emotionPointData.getJid();
        emotionPointItem.addAttribute("fromjid", jid);

        String nickName = null;
        String avatarType = null;
        String avatarData = null;
        if (profile != null) {
            nickName = profile.getNickName();
            avatarType = profile.getPhotoType();
            avatarData = profile.getPhotoData();
        } else {
            nickName = GlobalSNSUtils.getUserName(jid);
            avatarType = "";
            avatarData = "";
        }
        try {
            nickName = URLDecoder.decode(nickName, "UTF-8");
            nickName = URLEncoder.encode(nickName, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            nickName = "";
        }
        emotionPointItem.addAttribute("fromname", nickName);

        emotionPointItem.addAttribute("created_at", emotionPointData.getCreatedAtStr());

        emotionPointItem.addAttribute("updated_at", emotionPointData.getUpdatedAtStr());

        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(jid);
        emotionPointItem.add(jidElem);
        Element nickNameElem = DocumentHelper.createElement("nickname");
        nickNameElem.setText(nickName);
        emotionPointItem.add(nickNameElem);
        Element avatarTypeElem = DocumentHelper.createElement("avatartype");
        avatarTypeElem.setText(avatarType);
        emotionPointItem.add(avatarTypeElem);
        Element avatarDataElem = DocumentHelper.createElement("avatardata");
        avatarDataElem.setText(avatarData);
        emotionPointItem.add(avatarDataElem);
        Element statusElem = DocumentHelper.createElement("status");
        int status = Profile.DELETE_FLAG_STATUS_NOMAL;
        if (profile != null) {
            status = profile.getDeleteFlg();
        }
        statusElem.setText(String.valueOf(status));
        emotionPointItem.add(statusElem);

        return emotionPointItem;
    }

    public boolean checkHaveEmotionPointPermission(Message message, String fromJid) {
        Log.debug("do func EmotionPointAdapter.checkHaveEmotionPointPermission(...");
        boolean ret = true;
        int messageType = message.getMsgType();
        switch (messageType) {
        case Message.TYPE_PUBLIC:
        case Message.TYPE_CHAT:
        case Message.TYPE_TASK:
        case Message.TYPE_COMMUNITY:
        case Message.TYPE_SYSTEM:
        case Message.TYPE_MAIL:
            break;
        case Message.TYPE_GROUP_CAHT:
            String roomId = message.getMsgTo();
            ret = GroupChatAdapter.getInstance().isRoomMember(fromJid,
                                                              roomId);
            break;
        default:
            break;
        }
        return ret;
    }

    public List<EmotionPoint> getEmotionPointList(String itemId) {
        Log.debug("do func EmotionPointAdapter.getEmotionPointList(...");
        return EmotionPointStoreDbHelper.getEmotionPointData(itemId);
    }

    public List<Element> createEmotionPointElementList(List<EmotionPoint> emotionPointList) {
        Log.debug("do func EmotionPointAdapter.createEmotionPointElementList(...");
        return createEmotionPointElementList(emotionPointList, "{}");
    }

    public List<Element> createEmotionPointElementList(List<EmotionPoint> emotionPointList, String emotionPointIconJson) {
        Log.debug("do func EmotionPointAdapter.createEmotionPointElementList(...");
        if(emotionPointList == null){
            return null;
        }
        if(emotionPointIconJson == null||
           emotionPointIconJson == ""){
            emotionPointIconJson = "{}";
        }
        List<Element> ret = new ArrayList<Element>();
        int count = emotionPointList.size();
        for(int i = 0; i < count; i++){
            EmotionPoint emotionPoint = emotionPointList.get(i);
            Profile profile = UserProfileDbHelper.getUserProfileData(emotionPoint.getJid());
            Element itemElem = getEmotionPointItemElement(emotionPoint,
                                                          profile,
                                                          emotionPointIconJson);
            ret.add(itemElem);
        }
        return ret;
    }
}
