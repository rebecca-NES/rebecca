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

import jp.co.nec.necst.spf.globalSNS.ContextHub.TenantSystemConfDbHelper;

public class RecordReadMessageDateSetting {

    private static final String RECOERD_READ_DATE_FLAG_KEY = "RECORD_READ_DATE_FLG";
    private static RecordReadMessageDateSetting mRecordReadMessageDateSetting = null;

    public static RecordReadMessageDateSetting getInstance() {
        if (mRecordReadMessageDateSetting == null) {
            mRecordReadMessageDateSetting = new RecordReadMessageDateSetting();
        }
        return mRecordReadMessageDateSetting;
    }

    private RecordReadMessageDateSetting(){
    }

    public boolean isRecord() {
        String value = TenantSystemConfDbHelper.getValue(RECOERD_READ_DATE_FLAG_KEY);
        if(value == null){
            return false;
        }
        return Boolean.valueOf(value);
    }

}
