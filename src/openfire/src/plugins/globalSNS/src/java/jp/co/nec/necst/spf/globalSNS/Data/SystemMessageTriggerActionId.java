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

package jp.co.nec.necst.spf.globalSNS.Data;

import java.util.List;

import org.jivesoftware.util.Log;

public class SystemMessageTriggerActionId {
    public static final int NONE = 0;
    public static final int ADD_TASK = 1;
    public static final int FINISH_TASK = 2;
    public static final int REQUEST_TASK = 3;
    public static final int DELETE_TASK = 4;
    
    private static int[] PRIORITY_OF_ACTION_ID = {
        NONE,
        ADD_TASK,
        REQUEST_TASK,
        FINISH_TASK,
        DELETE_TASK,
    };
    
    @SuppressWarnings("deprecation")
    public static int getHighestPriorityTriggerActionId (List<Integer> possibleTrigerActionIdList) {
        if(possibleTrigerActionIdList == null) {
            Log.error("possibleTrigerActionIdList is null");
            return NONE;
        }
        int count = possibleTrigerActionIdList.size();
        if(count == 0) {
            Log.error("possibleTrigerActionIdList is empty");
            return NONE;
        }
        int highestIndex = 0;
        int definitionCount = PRIORITY_OF_ACTION_ID.length;
        for(int i = 0; i < count; i++) {
            int trigerActionId = possibleTrigerActionIdList.get(i);
            for(int j = definitionCount - 1; j > highestIndex; j--) {
                if(PRIORITY_OF_ACTION_ID[j] == trigerActionId) {
                    highestIndex = j;
                    break;
                }
            }
        }
        return PRIORITY_OF_ACTION_ID[highestIndex];
    }
}
