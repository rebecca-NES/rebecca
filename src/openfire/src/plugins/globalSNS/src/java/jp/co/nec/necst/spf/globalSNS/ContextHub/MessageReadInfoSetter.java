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
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.Setting.RecordReadMessageDateSetting;

import org.jivesoftware.util.Log;

public class MessageReadInfoSetter {

    private static MessageReadInfoSetter mThisInstance = null;

    private MessageReadInfoSetter() {
    }

    public static MessageReadInfoSetter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new MessageReadInfoSetter();
        }
        return mThisInstance;
    }

    @SuppressWarnings("deprecation")
    public void setInitialData(Message message){
        if(message == null){
            return;
        }
        BigInteger id = message.getId();
        String itemId = message.getItemId();
        boolean ret = ReadMessageInfoStoreDbHelper.insertInitialData(id, itemId);
        if(!ret){
            Log.error("MessageReadInfoSetter#setInitialData : Fail Initial ReadMessageInfo");
            return;
        }
        ret = ReadMessageDateStoreDbHelper.insertInitialData(id, itemId);
        return;
    }

    @SuppressWarnings("deprecation")
    public boolean resetInitialData(Message message){
        if(message == null){
            return false;
        }
        String itemId = message.getItemId();
        boolean ret = ReadMessageInfoStoreDbHelper.updateInitialData(itemId);
        if(!ret){
            Log.error("MessageReadInfoSetter#setInitialData : Fail Initial ReadMessageInfo");
            return false;
        }
        ret = ReadMessageDateStoreDbHelper.updateInitialData(itemId);
        if(!ret){
            Log.error("MessageReadInfoSetter#setInitialData : Fail Initial ReadMessageDate");
            return false;
        }
        return ret;
    }

    public boolean setReadMessage(List<Message> targetMessageList,
            String fromJidStr, Timestamp readDateTime) {

        if(targetMessageList == null){
            return false;
        }
        if(fromJidStr == null || fromJidStr.trim().equals("")){
            return false;
        }
        if(readDateTime == null){
            return false;
        }

        int count = targetMessageList.size();
        if(count == 0){
            return false;
        }
        List<BigInteger> idList = new ArrayList<BigInteger>();
        for(Message message : targetMessageList){
            if(message == null){
                continue;
            }
            idList.add(message.getId());
        }
        if(idList.size() == 0){
            return false;
        }
        Set<BigInteger> existDataInReadInfoStore = ReadMessageInfoStoreDbHelper.getExistData(idList);
        Set<BigInteger> existDataInReadDateStore = ReadMessageDateStoreDbHelper.getExistData(idList);
        for(Message message : targetMessageList) {
            if(message == null) {
                continue;
            }
            BigInteger id = message.getId();
            String itemId = message.getItemId();
            if(!existDataInReadInfoStore.contains(id)) {
                ReadMessageInfoStoreDbHelper.insertInitialData(id, itemId);
            }
            if(!existDataInReadDateStore.contains(id)) {
                ReadMessageDateStoreDbHelper.insertInitialData(id, itemId);
            }
        }

        boolean ret = ReadMessageInfoStoreDbHelper.setReadMessageInfo(idList, fromJidStr, readDateTime);

        if(!ret){
            return ret;
        }
        Timestamp tmpReadDateTime = readDateTime;
        boolean isRecord = RecordReadMessageDateSetting.getInstance().isRecord();
        if(!isRecord){
            tmpReadDateTime = null;
        }
        ret = ReadMessageDateStoreDbHelper.setReadMessageDate(idList, tmpReadDateTime);

        return ret;
    }

}
