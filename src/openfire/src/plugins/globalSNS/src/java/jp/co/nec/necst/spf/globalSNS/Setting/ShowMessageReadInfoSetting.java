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

package jp.co.nec.necst.spf.globalSNS.Setting;

import java.util.HashMap;
import java.util.Map;

import jp.co.nec.necst.spf.globalSNS.ContextHub.TenantSystemConfDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Message;

public class ShowMessageReadInfoSetting {

    private Map<Integer, String> mKeyMap = new HashMap<Integer, String>();
    private Map<String, String> mDefaultValueMap = new HashMap<String, String>();
    private static ShowMessageReadInfoSetting mShowMessageReadInfoSetting = null;
    private final String SHOW_READ_INFO_PUBLIC_KEY_NAME = "SHOW_READ_INFO_PUBLIC";
    private final String SHOW_READ_INFO_CHAT_KEY_NAME = "SHOW_READ_INFO_CHAT";
    private final String SHOW_READ_INFO_GROUPCHAT_KEY_NAME = "SHOW_READ_INFO_GROUPCHAT";
    private final String SHOW_READ_INFO_COMMUNITY_FEED_KEY_NAME = "SHOW_READ_INFO_COMMUNITY_FEED";
    private final String SHOW_READ_INFO_MAIL_KEY_NAME = "SHOW_READ_INFO_MAIL";
    private final String SHOW_READ_INFO_MURMUR_KEY_NAME = "SHOW_READ_INFO_MURMUR";

    public static ShowMessageReadInfoSetting getInstance() {
        if (mShowMessageReadInfoSetting == null) {
            mShowMessageReadInfoSetting = new ShowMessageReadInfoSetting();
        }
        return mShowMessageReadInfoSetting;
   }

    private ShowMessageReadInfoSetting() {
        mKeyMap.put(Message.TYPE_PUBLIC, SHOW_READ_INFO_PUBLIC_KEY_NAME);
        mKeyMap.put(Message.TYPE_CHAT, SHOW_READ_INFO_CHAT_KEY_NAME);
        mKeyMap.put(Message.TYPE_GROUP_CAHT, SHOW_READ_INFO_GROUPCHAT_KEY_NAME);
        mKeyMap.put(Message.TYPE_COMMUNITY, SHOW_READ_INFO_COMMUNITY_FEED_KEY_NAME);
        mKeyMap.put(Message.TYPE_MAIL, SHOW_READ_INFO_MAIL_KEY_NAME);
        mKeyMap.put(Message.TYPE_MURMUR, SHOW_READ_INFO_MURMUR_KEY_NAME);

        mDefaultValueMap.put(SHOW_READ_INFO_PUBLIC_KEY_NAME, "false");
        mDefaultValueMap.put(SHOW_READ_INFO_CHAT_KEY_NAME, "true");
        mDefaultValueMap.put(SHOW_READ_INFO_GROUPCHAT_KEY_NAME, "true");
        mDefaultValueMap.put(SHOW_READ_INFO_COMMUNITY_FEED_KEY_NAME, "true");
        mDefaultValueMap.put(SHOW_READ_INFO_MAIL_KEY_NAME, "false");
        mDefaultValueMap.put(SHOW_READ_INFO_MURMUR_KEY_NAME, "true");
    }

    public boolean isShow(Message message) {
        int type = message.getMsgType();
        String key = mKeyMap.get(type);
        if(key == null){
            return false;
        }
        return getReadInfoSetting(key);
    }

    private boolean getReadInfoSetting(String key){
        if(key == null){
            return false;
        }
        String value = TenantSystemConfDbHelper.getValue(key);
        if(value == null || ( !value.equals("true") && !value.equals("false") )){
            return Boolean.valueOf(mDefaultValueMap.get(key));
        }
        return Boolean.valueOf(value);
    }
}
