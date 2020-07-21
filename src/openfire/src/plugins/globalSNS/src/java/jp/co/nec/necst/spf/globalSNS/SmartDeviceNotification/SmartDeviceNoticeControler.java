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

import jp.co.nec.necst.spf.globalSNS.ContextHub.DeviceInfoStroreDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.DeviceInfo;

import org.jivesoftware.util.Log;
import org.xmpp.packet.JID;

public class SmartDeviceNoticeControler {

    @SuppressWarnings("deprecation")
    public static void notify(JID jid, SmartDeviceNoticeInfo deviceNoticeInfo){
        if(jid == null){
            Log.error("SmartDeviceNoticeControler#notify:: jid is null");
            return;
        }
        if(deviceNoticeInfo == null){
            Log.error("SmartDeviceNoticeControler#notify:: deviceNoticeInfo is null");
            return;
        }
        List<DeviceInfo> deviceInfoList = DeviceInfoStroreDbHelper.getDeviceInfoList(jid.toBareJID());
        sendNotificationService(deviceInfoList, deviceNoticeInfo);
    }

    @SuppressWarnings("deprecation")
    private static void sendNotificationService(
            List<DeviceInfo> deviceInfoList,
            SmartDeviceNoticeInfo deviceNoticeInfo) {
        if(deviceInfoList == null){
            return;
        }
        if (deviceNoticeInfo == null) {
            Log.error("SmartDeviceNoticeControler#sendNotificationService:: deviceNoticeInfo is null");
            return;
        }
        List<DeviceInfo> deviceIdListForGCM = getFilteredDeviceInfoListFromDeviceInfoList(deviceInfoList,DeviceInfo.NOTIFICATION_SERVICE_TYPE_GCM);
        if(deviceIdListForGCM == null){
            Log.info("SmartDeviceNoticeControler#sendNotificationService:: deviceIdListForGCM is null");
        }else{
            AbstractSmartDeviceNotifier gcmNotifier = new GCMSmartDeviceNotifierImpl();
            gcmNotifier.setDeviceInfoList(deviceIdListForGCM);
            gcmNotifier.setNotifyData(deviceNoticeInfo);
            gcmNotifier.sendNotification();
        }
        List<DeviceInfo> deviceIdListForAPNS = getFilteredDeviceInfoListFromDeviceInfoList(
                deviceInfoList, DeviceInfo.NOTIFICATION_SERVICE_TYPE_APNS);
        if (deviceIdListForAPNS == null) {
            Log.info("SmartDeviceNoticeControler#sendNotificationService:: deviceIdListForAPNS is null");
        } else {
            AbstractSmartDeviceNotifier apnsNotifier = new APNSSmartDeviceNotifierImpl(
                    new APNSUtilsImpl());
            apnsNotifier.setDeviceInfoList(deviceIdListForAPNS);
            apnsNotifier.setNotifyData(deviceNoticeInfo);
            apnsNotifier.sendNotification();
        }
    }

    @SuppressWarnings("deprecation")
    private static List<DeviceInfo> getFilteredDeviceInfoListFromDeviceInfoList(
            List<DeviceInfo> deviceInfoList, int notificationServiceType) {
        if(deviceInfoList == null){
            Log.error("SmartDeviceNoticeControler#getDeviceIdListForGCM:: deviceInfoList is null");
            return null;
        }
        List<DeviceInfo> filteredDeviceInfoList = new ArrayList<DeviceInfo>();
        for(DeviceInfo deviceInfo : deviceInfoList){
            int curNotificationService = deviceInfo.getNotificationService();
            if(curNotificationService == notificationServiceType){
                filteredDeviceInfoList.add(deviceInfo);
            }
        }
        int count = filteredDeviceInfoList.size();
        if(count == 0){
            filteredDeviceInfoList = null;
        }
        return filteredDeviceInfoList;
    }

}
