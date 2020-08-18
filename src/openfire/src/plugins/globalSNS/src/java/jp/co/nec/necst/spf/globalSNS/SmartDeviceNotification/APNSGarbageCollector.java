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

import static java.lang.String.format;

import java.util.Date;
import java.util.Map;
import java.util.TimerTask;

import jp.co.nec.necst.spf.globalSNS.ContextHub.DeviceInfoStroreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.DeviceInfo;

import org.jivesoftware.util.Log;

import com.notnoop.apns.ApnsService;

public class APNSGarbageCollector extends TimerTask {

    private APNSUtils utils;

    public APNSGarbageCollector(APNSUtils utils) {
        this.utils = utils;
    }

    @Override
    public void run() {
        Log.info("APNSGarbageCollector#run START");
        Log.info("get invalid device tokens from APNs Feedback service...");
        ApnsService service = this.utils.getApnsServiceInstance();
        Map<String, Date> inactiveDevices = service.getInactiveDevices();
        Log.info("num of invalid device tokens: " + inactiveDevices.size());

        for (Map.Entry<String, Date> inactive : inactiveDevices.entrySet()) {
            if (Log.isDebugEnabled()) {
                String msg = format(
                        "APNSGarbageCollector#deleteInactiveDevices: deviceId: %s date:%s",
                        inactive.getKey(), inactive.getValue());
                Log.debug(msg);
            }
            DeviceInfo deviceInfo = new DeviceInfo();
            deviceInfo.setDeviceId(inactive.getKey());
            deviceInfo.setJid(null);
            deviceInfo
                    .setNotificationService(DeviceInfo.NOTIFICATION_SERVICE_TYPE_APNS);
            this.deleteDeviceInfoFromDB(deviceInfo);
        }
        Log.info("APNSGarbageCollector#run END");
    }

    @SuppressWarnings("deprecation")
    private void deleteDeviceInfoFromDB(DeviceInfo deviceInfo) {
        boolean result = DeviceInfoStroreDbHelper
                .deleteDeviceInfoByDeviceToken(deviceInfo);

        String resultStr = result ? "Succeeded" : "Failed";
        String msg = "APNSGarbageCollector#deleteDeviceInfoFromDB: "
                + resultStr + " to delete device_id." + " jid : "
                + deviceInfo.getJid() + ", deviceId : "
                + deviceInfo.getDeviceId();
        if (result) {
            Log.info(msg);
        } else {
            Log.error(msg);
        }
    }

}
