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
import java.util.List;

import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;

import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.SortCondition.PersonSortCondition;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.UserFilter;
import jp.co.nec.necst.spf.globalSNS.Data.UserFilter.UserFilterCondition;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;
import net.arnx.jsonic.JSON;

public class UserAdapter {
    private static final Logger Log = LoggerFactory
            .getLogger(UserProfileAdapter.class);
    private static UserAdapter mThisInstance = null;

    public enum ContentType {
        allusers;

        public static ContentType toType(String str) {
            try {
                return valueOf(str);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    public static UserAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new UserAdapter();
        }
        return mThisInstance;
    }

    public IQ searchPerson(IQ iq) {
        IQ ret = null;
        String logPrefix = "UserAdapter#searchPerson::";
        if (iq == null) {
            Log.error(logPrefix + "iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.get) {
            Log.error(logPrefix + "iq type is not get");
            return ret;
        }
        Element personElem = iq.getChildElement();
        if (personElem == null) {
            Log.error(logPrefix + "messageElem is null");
            return ret;
        }
        String tagName = personElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("person"))) {
            Log.error(logPrefix + "tagName is invalid");
            return ret;
        }
        String namespace = personElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/searchperson"))) {
            Log.error(logPrefix + "namespace is invalid");
            return ret;
        }
        Element contentElem = personElem.element("content");
        if (contentElem == null) {
            Log.error(logPrefix + "contentElem is null");
            return ret;
        }
        Element typeElem = contentElem.element("type");
        if (typeElem == null) {
            Log.error(logPrefix + "typeElem is null");
            return ret;
        }
        String type = typeElem.getStringValue();
        if (ContentType.toType(type) == null) {
            Log.error(logPrefix + "type is invalid");
            return ret;
        }
        Element conditionElem = contentElem.element("condition");
        if (conditionElem == null) {
            Log.error(logPrefix + "conditionElem is null");
            return ret;
        }
        Element filterElem = conditionElem.element("filter");
        if (filterElem == null) {
            Log.error(logPrefix + "filterElem is null");
            return ret;
        }
        UserFilterCondition filterCondition = UserFilter
                .createFilterConditionFromFilterElement(filterElem);
        if (filterCondition == null) {
            Log.error(logPrefix + "filterCondition is null");
            return ret;
        }
        Element sortElem = conditionElem.element("sort");
        if (sortElem == null) {
            Log.error(logPrefix + "sortElem is null");
            return ret;
        }
        PersonSortCondition sortCondition = PersonSortCondition
                .createSortConditionFromSortElement(sortElem);
        Element startIdElem = contentElem.element("startid");
        if (startIdElem == null) {
            Log.error(logPrefix + "startIdElem is null");
            return ret;
        }
        String startIdStr = startIdElem.getStringValue();
        if (startIdStr == null || startIdStr.equals("")) {
            Log.error(logPrefix + "startIdStr is invalid");
            return ret;
        }
        int startId = 0;
        try {
            startId = Integer.parseInt(startIdStr);
        } catch (NumberFormatException e) {
            Log.error(logPrefix + "startIdStr is not number");
            return ret;
        }
        Element countElem = contentElem.element("count");
        if (countElem == null) {
            Log.error(logPrefix + "countElem is null");
            return ret;
        }
        String countStr = countElem.getStringValue();
        if (countStr == null || countStr.equals("")) {
            Log.error(logPrefix + "countStr is invalid");
            return ret;
        }
        int requestCount = 0;
        try {
            requestCount = Integer.parseInt(countStr);
        } catch (NumberFormatException e) {
            Log.error(logPrefix + "countStr is not number");
            return ret;
        }

        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error(logPrefix + "from jid is null");
            return ret;
        }

        List<Profile> userProfileList = UserAccountManager.getInstance()
                .searchProfile(startId, requestCount, filterCondition,
                        sortCondition, fromJid);

        int searchAllCount = UserAccountManager.getInstance().getCount(
                filterCondition);

        return createSearchResultIQ(iq, userProfileList, searchAllCount);
    }

    private IQ createSearchResultIQ(IQ iq, List<Profile> userProfileList,
            int searchAllCount) {
        IQ ret = null;
        String logPrefix = "UserAdapter#createSearchResultIQ::";
        if (iq == null) {
            Log.error(logPrefix + "iq is null");
            return ret;
        }
        Element personElem = iq.getChildElement();
        if (personElem == null) {
            Log.error(logPrefix + "personElem is null");
            return ret;
        }
        String tagName = personElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("person"))) {
            Log.error(logPrefix + "tagName is invalid");
            return ret;
        }
        String namespace = personElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/searchperson"))) {
            Log.error(logPrefix + "namespace is invalid");
            return ret;
        }
        IQ replyPacket = IQ.createResultIQ(iq);
        Element contentElem = personElem.element("content");
        if (contentElem != null) {
            personElem.remove(contentElem);
        }
        Element newContentElem = DocumentHelper.createElement("content");
        Element extrasElem = DocumentHelper.createElement("extras");
        Element allItemCountElem = DocumentHelper
                .createElement("all_item_count");
        allItemCountElem.setText(String.valueOf(searchAllCount));
        extrasElem.add(allItemCountElem);
        newContentElem.add(extrasElem);
        Element itemsElem = DocumentHelper.createElement("items");
        int itemCount = 0;
        if (userProfileList != null) {
            itemCount = userProfileList.size();
        }
        itemsElem.addAttribute("count", String.valueOf(itemCount));
        for (int i = 0; i < itemCount; i++) {
            Profile item = userProfileList.get(i);
            Element itemElem = getProfileItemElement(item);
            if (itemElem == null) {
                Log.error(logPrefix + "itemElem is null");
                continue;
            }
            itemsElem.add(itemElem);
        }
        newContentElem.add(itemsElem);
        personElem.add(newContentElem);
        personElem.setParent(null);
        replyPacket.setChildElement(personElem);

        return replyPacket;
    }

    private Element getProfileItemElement(Profile profile) {
        if (profile == null) {
            return null;
        }
        Element itemElem = DocumentHelper.createElement("item");
        Element idElem = DocumentHelper.createElement("id");
        idElem.setText(String.valueOf(profile.getId()));
        itemElem.add(idElem);
        Element jidElem = DocumentHelper.createElement("jid");
        jidElem.setText(profile.getJid());
        itemElem.add(jidElem);
        Element subscriptionElem = DocumentHelper.createElement("subscription");
        subscriptionElem.setText(profile.getSubscription());
        itemElem.add(subscriptionElem);
        Element statusElem = DocumentHelper.createElement("status");
        statusElem.setText(String.valueOf(profile.getDeleteFlg()));
        itemElem.add(statusElem);
        Element nickNameElem = DocumentHelper.createElement("nickname");
        String nickName = profile.getNickName();
        try {
            nickName = URLDecoder.decode(nickName, "UTF-8");
            nickName = URLEncoder.encode(nickName, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            nickName = "";
        }
        nickNameElem.setText(nickName);
        itemElem.add(nickNameElem);
        Element presenceElem = DocumentHelper.createElement("presence");
        int presence = 0;
        int presenceData = profile.getPresence();
        if ((presenceData & Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE) != 0
                || (presenceData & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) != 0) {
            presence = presenceData & 0x7;
        }
        presenceElem.setText(String.valueOf(presence));
        itemElem.add(presenceElem);
        Element myMemoElem = DocumentHelper.createElement("mymemo");
        String myMemo = profile.getMyMemo();
        try {
            myMemo = URLDecoder.decode(myMemo, "UTF-8");
            myMemo = URLEncoder.encode(myMemo, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            myMemo = "";
        }
        myMemoElem.setText(myMemo);
        itemElem.add(myMemoElem);
        Element avatarTypeElem = DocumentHelper.createElement("avatartype");
        String avatarType = profile.getPhotoType();
        avatarTypeElem.setText(avatarType);
        itemElem.add(avatarTypeElem);
        Element avatarDataElem = DocumentHelper.createElement("avatardata");
        String avatarData = profile.getPhotoData();
        avatarDataElem.setText(avatarData);
        itemElem.add(avatarDataElem);
        Element groupsElem = DocumentHelper.createElement("groups");
        String strAffiliation = profile.getAffiliation();
        if (strAffiliation == null || strAffiliation.trim().equals("")) {
            strAffiliation = "[]";
        }
        List<String> affiliationList = JSON.decode(strAffiliation);
        if (affiliationList != null) {
            int affiliationCount = affiliationList.size();
            for (int j = 0; j < affiliationCount; j++) {
                String groupName = affiliationList.get(j);
                if (groupName == null || "".equals(groupName)) {
                    continue;
                }
                Element groupElem = DocumentHelper.createElement("group");
                groupElem.setText(groupName);
                groupsElem.add(groupElem);
            }
        }
        itemElem.add(groupsElem);
        return itemElem;
    }

    public Element getProfileItemElementForContactList(Profile profile) {
        Element ret = getProfileItemElement(profile);
        if (ret == null) {
            return ret;
        }
        ret.setName("member");
        return ret;
    }
}
