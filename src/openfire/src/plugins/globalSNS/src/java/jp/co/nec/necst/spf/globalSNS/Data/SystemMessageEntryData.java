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

import java.util.ArrayList;
import java.util.List;

public class SystemMessageEntryData {
    private int triggerActionId = SystemMessageTriggerActionId.NONE;
    private String bodyKey = "";
    private List<String> argList = new ArrayList<String>();
    private List<String> senderList= new ArrayList<String>();
    public int getTriggerActionId() {
        return triggerActionId;
    }
    public void setTriggerActionId(int triggerActionId) {
        this.triggerActionId = triggerActionId;
    }
    public String getBodyKey() {
        return bodyKey;
    }
    public void setBodyKey(String bodyKey) {
        this.bodyKey = bodyKey;
    }
    public List<String> getArgList() {
        return argList;
    }
    public List<String> getSenderList() {
        return senderList;
    }
}
