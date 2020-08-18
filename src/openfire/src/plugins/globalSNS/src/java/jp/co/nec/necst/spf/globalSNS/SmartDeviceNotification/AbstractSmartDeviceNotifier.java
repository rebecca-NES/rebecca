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

package jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification;

import java.util.ArrayList;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.Data.DeviceInfo;

abstract class AbstractSmartDeviceNotifier {

    private SmartDeviceNoticeInfo notifyData;

    private List<DeviceInfo> deviceInfoList;

    SmartDeviceNoticeInfo getNotifyData() {
        return notifyData;
    }

    void setNotifyData(SmartDeviceNoticeInfo notifyData) {
        this.notifyData = notifyData;
    }

    List<DeviceInfo> getDeviceInfoList() {
        return deviceInfoList;
    }

    void setDeviceInfoList(List<DeviceInfo> deviceInfoList) {
        this.deviceInfoList = deviceInfoList;
    }

    List<String> getDeviceIdListFromDeviceInfoList() {
        List<String> deviceIdList = new ArrayList<String>();

        for(DeviceInfo deviceInfo : deviceInfoList){
            String deviceId = deviceInfo.getDeviceId();
            if (!deviceIdList.contains(deviceId)) {
                deviceIdList.add(deviceId);
            }
        }
        int count = deviceIdList.size();
        if(count == 0){
            deviceIdList = null;
        }
        return deviceIdList;
    }


    abstract void sendNotification();

}
