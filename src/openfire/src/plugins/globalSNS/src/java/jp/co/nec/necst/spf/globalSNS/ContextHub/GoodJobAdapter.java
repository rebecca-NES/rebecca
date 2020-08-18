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
import jp.co.nec.necst.spf.globalSNS.Data.GoodJob;
import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;

public class GoodJobAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(GoodJobAdapter.class);
    private static GoodJobAdapter mGoodJobAdapter = null;

    private GoodJobAdapter() {
    }

    public static GoodJobAdapter getInstance() {
        if (mGoodJobAdapter == null) {
            mGoodJobAdapter = new GoodJobAdapter();
        }
        return mGoodJobAdapter;
    }

    public Element getGoodJobElement(List<GoodJob> goodJobList) {
        Element goodJob = DocumentHelper.createElement("goodjob");
        int gjCount = 0;
        if (goodJobList != null) {
            gjCount = goodJobList.size();
        }
        goodJob.addAttribute("count", String.valueOf(gjCount));
        if (goodJobList == null || gjCount == 0) {
            return goodJob;
        }
        List<String> goodJobJidList = MessageAdapter.getInstance()
                .extractJidListFromGoodJobList(goodJobList);
        List<Profile> profileList = new ArrayList<Profile>();
        if (goodJobJidList != null && !goodJobJidList.isEmpty()) {
            profileList = UserAccountManager.getInstance().getProfileList(
                    goodJobJidList);
        }
        Map<String, Profile> profileHashMap = new ConcurrentHashMap<String, Profile>();
        if (profileList != null) {
            for (Profile profile : profileList) {
                if (profile == null) {
                    Log.info("GoodJobAdapter#getGoodJobElement::profile is null.");
                    continue;
                }
                profileHashMap.put(profile.getJid(), profile);
            }
        }
        for (int i = 0; i < gjCount; i++) {
            GoodJob goodJobData = goodJobList.get(i);
            if (goodJobData == null) {
                Log.info("GoodJobAdapter#getGoodJobElement::goodJobData is null.");
                continue;
            }
            Profile profileData = profileHashMap.get(goodJobData.getGjJid());
            if (profileData == null) {
                Log.info("GoodJobAdapter#getGoodJobElement::profileData is null.");
            }
            Element goodJobItem = getGoodJobItemElement(goodJobData,
                    profileData);
            if (goodJobItem == null) {
                Log.error("GoodJobAdapter#getGoodJobElement::goodJobItem is null.");
                continue;
            }
            goodJob.add(goodJobItem);
        }
        return goodJob;
    }

    public Element getGoodJobItemElement(GoodJob goodJobData, Profile profile) {
        if (goodJobData == null) {
            Log.error("GoodJobAdapter#getGoodJobItemElement::goodJobData is null.");
            return null;
        }
        Element goodJobItem = DocumentHelper.createElement("item");

        goodJobItem.addAttribute("itemid", goodJobData.getItemId());
        goodJobItem.addAttribute("msgownjid", goodJobData.getMsgOwnJid());
        goodJobItem.addAttribute("msgto", goodJobData.getMsgTo());
        goodJobItem.addAttribute("msgtype", String.valueOf(goodJobData.getMsgType()));
        goodJobItem.addAttribute("body", goodJobData.getEntryBody());
        String gjJid = goodJobData.getGjJid();
        goodJobItem.addAttribute("fromjid", gjJid);

        String nickName = null;
        String avatarType = null;
        String avatarData = null;
        if (profile != null) {
            nickName = profile.getNickName();
            avatarType = profile.getPhotoType();
            avatarData = profile.getPhotoData();
        } else {
            nickName = GlobalSNSUtils.getUserName(gjJid);
            avatarType = "";
            avatarData = "";
        }
        try {
            nickName = URLDecoder.decode(nickName, "UTF-8");
            nickName = URLEncoder.encode(nickName, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            nickName = "";
        }
        goodJobItem.addAttribute("fromname", nickName);

        goodJobItem.addAttribute("date", goodJobData.getDateStr());

        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(gjJid);
        goodJobItem.add(jidElem);
        Element nickNameElem = DocumentHelper.createElement("nickname");
        nickNameElem.setText(nickName);
        goodJobItem.add(nickNameElem);
        Element avatarTypeElem = DocumentHelper.createElement("avatartype");
        avatarTypeElem.setText(avatarType);
        goodJobItem.add(avatarTypeElem);
        Element avatarDataElem = DocumentHelper.createElement("avatardata");
        avatarDataElem.setText(avatarData);
        goodJobItem.add(avatarDataElem);
        Element statusElem = DocumentHelper.createElement("status");
        int status = Profile.DELETE_FLAG_STATUS_NOMAL;
        if (profile != null) {
            status = profile.getDeleteFlg();
        }
        statusElem.setText(String.valueOf(status));
        goodJobItem.add(statusElem);

        return goodJobItem;
    }

    public boolean checkHaveGoodJobPermission(Message message, String fromJid) {
        boolean ret = true;
        int messageType = message.getMsgType();
        switch (messageType) {
            case Message.TYPE_PUBLIC:
            case Message.TYPE_CHAT:
            case Message.TYPE_TASK:
            case Message.TYPE_COMMUNITY:
            case Message.TYPE_MURMUR:
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

    public List<GoodJob> getGoodJobList(String itemId) {
        return GoodJobStoreDbHelper.getGoodJobData(itemId);
    }

    public List<Element> createGoodJobElementList(List<GoodJob> goodJobList) {
        if(goodJobList == null){
            return null;
        }
        List<Element> ret = new ArrayList<Element>();
        int count = goodJobList.size();
        for(int i = 0; i < count; i++){
            GoodJob goodJob = goodJobList.get(i);
            Profile profile = UserProfileDbHelper.getUserProfileData(goodJob
                    .getGjJid());
            Element itemElem = getGoodJobItemElement(
                    goodJob, profile);
            ret.add(itemElem);
        }
        return ret;
    }
}
