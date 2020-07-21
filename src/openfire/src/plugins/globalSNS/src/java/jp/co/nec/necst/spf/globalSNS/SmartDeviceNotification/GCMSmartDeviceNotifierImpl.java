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

import java.util.List;

import jp.co.nec.necst.spf.globalSNS.ContextHub.DeviceInfoStroreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.SystemConfDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.SystemConfDbHelper.SystemConfKey;
import jp.co.nec.necst.spf.globalSNS.Data.DeviceInfo;
import net.arnx.jsonic.JSON;

import org.jivesoftware.util.Log;

import com.google.android.gcm.server.Constants;
import com.google.android.gcm.server.Message;
import com.google.android.gcm.server.MulticastResult;
import com.google.android.gcm.server.Result;
import com.google.android.gcm.server.Sender;

public class GCMSmartDeviceNotifierImpl extends AbstractSmartDeviceNotifier {

    @SuppressWarnings("deprecation")
    void sendNotification() {

        try{
            String gcmAPIKey = SystemConfDbHelper.getValue(SystemConfKey.GCM_API_KEY);

            if (gcmAPIKey == null || gcmAPIKey.equals("")) {
                Log.error("GCMSmartDeviceNotifierImpl#sendNotification:: Failed to send GCM notification");
                return;
            }

            Sender sender = new Sender( gcmAPIKey );
            String deviceNoticeInfoJSON = JSON.encode(getNotifyData());
            Message message = new Message.Builder().addData("message",
                    deviceNoticeInfoJSON).build();

            List<String> deviceIdList = getDeviceIdListFromDeviceInfoList();

            MulticastResult multicastResult = sender.send(message, deviceIdList, 1);

           if( Log.isDebugEnabled()) {
               Log.debug("GCMSmartDeviceNotifierImpl#sendNotification:" +
                       " multicastResult : " + multicastResult.toString());
           }

            if (multicastResult.getFailure() > 0 || multicastResult.getCanonicalIds() > 0 ) {

                if (multicastResult.getFailure() > 0) {
                    Log.error("GCMSmartDeviceNotifierImpl#sendNotification:: Failed to send GCM notification." +
                            " multicastResult : " + multicastResult.toString());
                } else if (multicastResult.getCanonicalIds() > 0) {
                    Log.info("GCMSmartDeviceNotifierImpl#sendNotification:: same device has more than on registration." +
                            " multicastResult : " + multicastResult.toString());
                }

                List<Result> listResult = multicastResult.getResults();
                for (int i=0; i < listResult.size(); i++){
                    Result result = listResult.get(i);

                    if (result.getCanonicalRegistrationId() != null) {
                        DeviceInfo deviceInfo = getDeviceInfoList().get(i);
                        StringBuffer infoBuf = new StringBuffer();
                        infoBuf.append("GCMSmartDeviceNotifierImpl#sendNotification:: same device has more than on registration.");
                        infoBuf.append(" multicast_id : " + multicastResult.getMulticastId());
                        infoBuf.append(", jid : " + deviceInfo.getJid());
                        infoBuf.append(", deviceId : " + deviceInfo.getDeviceId());
                        infoBuf.append(", canonicalId : " + result.getCanonicalRegistrationId());

                        deleteDeviceInfoToDB(deviceInfo);

                    } else if (result.getErrorCodeName() != null) {
                        DeviceInfo deviceInfo = getDeviceInfoList().get(i);
                        StringBuffer errBuf = new StringBuffer();
                        errBuf.append("GCMSmartDeviceNotifierImpl#sendNotification:: Failed to send GCM notification.");
                        errBuf.append(" multicast_id : " + multicastResult.getMulticastId());
                        errBuf.append(", jid : " + deviceInfo.getJid());
                        errBuf.append(", deviceId : " + deviceInfo.getDeviceId());
                        errBuf.append(", errorCode : " + result.getErrorCodeName());
                        Log.error(errBuf.toString());

                        if (result.getErrorCodeName().equals(Constants.ERROR_INVALID_REGISTRATION) ||
                                result.getErrorCodeName().equals(Constants.ERROR_NOT_REGISTERED)){
                            deleteDeviceInfoToDB(deviceInfo);
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.error("GCMSmartDeviceNotifierImpl#sendNotification:: Failed to send GCM notification." + e.toString());
        }
    }

    @SuppressWarnings("deprecation")
    private void deleteDeviceInfoToDB(DeviceInfo deviceInfo) {
        if (DeviceInfoStroreDbHelper.deleteDeviceInfoToDb(deviceInfo)) {
            Log.info("GCMSmartDeviceNotifierImpl#deleteDeviceInfoToDB:: Succeeded to delete device_id."
                    + " jid : " + deviceInfo.getJid()
                    +", deviceId : " + deviceInfo.getDeviceId());
        } else {
            Log.error("GCMSmartDeviceNotifierImpl#deleteDeviceInfoToDB:: Failed to delete device_id."
                    + " jid : " + deviceInfo.getJid()
                    +", deviceId : " + deviceInfo.getDeviceId());
        }
    }
}
