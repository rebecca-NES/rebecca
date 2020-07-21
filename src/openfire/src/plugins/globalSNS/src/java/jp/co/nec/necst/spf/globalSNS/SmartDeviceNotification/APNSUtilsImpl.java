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

import static jp.co.nec.necst.spf.globalSNS.ContextHub.TenantSystemConfDbHelper.KEY_APNS_CERT_PASS;
import static jp.co.nec.necst.spf.globalSNS.ContextHub.TenantSystemConfDbHelper.KEY_APNS_CERT_PATH;
import static jp.co.nec.necst.spf.globalSNS.ContextHub.TenantSystemConfDbHelper.KEY_APNS_CERT_TYPE;
import static jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.APNsEnvironment.DEVELOPMENT;
import static jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.APNsEnvironment.PRODUCTION;
import static org.apache.commons.lang.StringUtils.isEmpty;

import java.io.File;

import jp.co.nec.necst.spf.globalSNS.ContextHub.DeviceInfoStroreDbHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.TenantSystemConfDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.DeviceInfo;

import org.jivesoftware.util.Log;

import com.notnoop.apns.APNS;
import com.notnoop.apns.ApnsDelegate;
import com.notnoop.apns.ApnsNotification;
import com.notnoop.apns.ApnsService;
import com.notnoop.apns.ApnsServiceBuilder;
import com.notnoop.apns.DeliveryError;
import com.notnoop.exceptions.ApnsDeliveryErrorException;

class APNSUtilsImpl implements APNSUtils {
    private static final int ERROR_CODE_INVALID_TOKEN = 8;

    APNSUtilsImpl() {
    }

    private static ApnsService _service = null;

    public ApnsService getApnsServiceInstance() {
        if (_service == null) {
            _service = getApnsService();
        }
        return _service;
    }

    static ApnsService getApnsService() {
        if (_service != null) {
            return _service;
        }
        APNsEnvironment environment = getEnvironment();
        if (environment == null) {
            return null;
        }
        String apnsCertPath = getCertPath(environment);
        String apnsCertPass = TenantSystemConfDbHelper
                .getValue(KEY_APNS_CERT_PASS);
        if (isEmpty(apnsCertPath) || isEmpty(apnsCertPass)) {
            Log.error("APNSSmartDeviceNotifierImpl#getApnsService: Failed to get APNS cert info");
            return null;
        }
        ApnsService service = null;
        try {
            service = createApnsService(apnsCertPath, apnsCertPass, environment);
        } catch (Exception e) {
            Log.error(
                    "APNSSmartDeviceNotifierImpl#getApnsService: Failed to create ApnsService instance",
                    e);
        }
        return service;
    }

    static APNsEnvironment getEnvironment() {
        String apnsCertType = TenantSystemConfDbHelper
                .getValue(KEY_APNS_CERT_TYPE);
        if (DEVELOPMENT.toString().equalsIgnoreCase(apnsCertType)) {
            return DEVELOPMENT;
        } else if (PRODUCTION.toString().equalsIgnoreCase(apnsCertType)) {
            return PRODUCTION;
        }
        Log.error("invalid value stored in DB. key: " + KEY_APNS_CERT_TYPE
                + " value: " + apnsCertType);
        return null;
    }

    static String getCertPath(APNsEnvironment env) {

        String certPath = TenantSystemConfDbHelper.getValue(KEY_APNS_CERT_PATH);
        Log.info("APNSSmartDeviceNotifierImpl#getCertPath certPath from DB: "
                + certPath);

        File certFile = new File(certPath);
        if (certFile.exists()) {
            return certPath;
        }
        Log.error("APNs cert file DOES NOT exist: " + certPath);
        return null;
    }

    private static ApnsService createApnsService(String certPath,
            String certPass, APNsEnvironment environment) {

        ApnsServiceBuilder builder = APNS.newService()
                .withCert(certPath, certPass)
                .withDelegate(createApnsDelegate());

        if (environment.equals(DEVELOPMENT)) {
            Log.info("creating Development ApnsService");
            builder.withSandboxDestination();
        } else {
            Log.info("creating Production ApnsService");
            builder.withProductionDestination();
        }
        ApnsService service = builder.build();
        if (Log.isDebugEnabled()) {
            Log.debug("created ApnsService: " + service);
        }
        return service;
    }

    static ApnsDelegate createApnsDelegate() {
        return new ApnsDelegate() {
            public void cacheLengthExceeded(int newCacheLength) {
                String msg = String
                        .format("APNSSmartDeviceNotifierImpl#ApnsDelegate: cache length exceeded. new cache length: %d",
                                newCacheLength);
                Log.info(msg);
            }

            public void connectionClosed(DeliveryError e, int messageIdentifier) {
                String msg = String
                        .format("APNSSmartDeviceNotifierImpl#ApnsDelegate: connection closed. code=%s messageId=%d",
                                e, messageIdentifier);
                Log.error(msg);
            }

            public void messageSendFailed(ApnsNotification message, Throwable t) {
                String msg = String
                        .format("APNSSmartDeviceNotifierImpl#ApnsDelegate: message send failed. message=%s cause: %s",
                                message, t);
                Log.error(msg, t);
                if (message == null) {
                    Log.error("you should consider increasing your cacheLength value to prevent data loss.");
                    return;
                }
                if (!(t instanceof ApnsDeliveryErrorException)) {
                    return;
                }
                ApnsDeliveryErrorException e = (ApnsDeliveryErrorException) t;
                int errorCode = e.getDeliveryError().code();
                if (errorCode != ERROR_CODE_INVALID_TOKEN) {
                    return;
                }
                deleteDeviceTokenFromDB(message);
            }

            private void deleteDeviceTokenFromDB(ApnsNotification message) {
                byte[] deviceToken = message.getDeviceToken();
                String tokenHex = byteArrayToHex(deviceToken);
                Log.info("Delete invalid Device Token: " + tokenHex);
                DeviceInfo deviceInfo = new DeviceInfo();
                deviceInfo.setDeviceId(tokenHex);
                deviceInfo
                        .setNotificationService(DeviceInfo.NOTIFICATION_SERVICE_TYPE_APNS);
                DeviceInfoStroreDbHelper
                        .deleteDeviceInfoByDeviceToken(deviceInfo);
            }

            String byteArrayToHex(byte[] a) {
                StringBuilder sb = new StringBuilder(a.length * 2);
                for (byte b : a)
                    sb.append(String.format("%02x", b & 0xff));
                return sb.toString();
            }

            public void messageSent(ApnsNotification message, boolean resent) {
                if (Log.isDebugEnabled()) {
                    String msg = String
                            .format("APNSSmartDeviceNotifierImpl#ApnsDelegate: message was successfully sent. message=%s resent: %b",
                                    message, resent);
                    Log.debug(msg);
                }
            }

            public void notificationsResent(int resendCount) {
                String msg = String
                        .format("APNSSmartDeviceNotifierImpl#ApnsDelegate: messages resent %d times.",
                                resendCount);
                Log.info(msg);
            }
        };
    }
}
