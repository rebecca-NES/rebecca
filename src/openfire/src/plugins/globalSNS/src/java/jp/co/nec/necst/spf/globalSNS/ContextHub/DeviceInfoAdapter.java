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

import java.util.List;

import jp.co.nec.necst.spf.globalSNS.Data.DeviceInfo;

import org.dom4j.Element;
import org.jivesoftware.util.Log;
import org.xmpp.packet.IQ;
import org.xmpp.packet.JID;


public class DeviceInfoAdapter {

    private static DeviceInfoAdapter mThisInstance = null;

    private DeviceInfoAdapter() {
    }

    public static DeviceInfoAdapter getInstance() {
        if (mThisInstance == null) {
            mThisInstance = new DeviceInfoAdapter();
        }
        return mThisInstance;
    }


    @SuppressWarnings("deprecation")
    public IQ registerDeviceInfo(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("DeviceInfoAdapter#registerDeviceInfo::iq is null");
            return ret;
        }

        DeviceInfo deviceInfo = getDeviceInfoFromRegisterDeviceInfoXMPP(iq);
        if (deviceInfo == null) {
            Log.error("DeviceInfoAdapter#registerDeviceInfo::deviceInfo is null");
            return ret;
        }
        if (!this.existsDeviceInfo(deviceInfo)) {
            if (!DeviceInfoStroreDbHelper.insertDeviceInfoToDb(deviceInfo)) {
                Log.error("DeviceInfoAdapter#registerDeviceInfo::failed to insert DeviceInfo To Db");
                return ret;
            }
            Log.info("DeviceInfoAdapter#registerDeviceInfo::succeeded to insert DeviceInfo To Db: "
                + deviceInfo.getNotificationService() + ", "
                + deviceInfo.getDeviceId() + ", "
                + deviceInfo.getJid()
            );
        }
        ret = IQ.createResultIQ(iq);
        return ret;
    }

    boolean existsDeviceInfo(DeviceInfo newDeviceInfo) {
        String jid = newDeviceInfo.getJid();
        String wantsToRegister = newDeviceInfo.getDeviceId();
        List<DeviceInfo> registeredDevices = DeviceInfoStroreDbHelper
                .getDeviceInfoList(jid);
        if(registeredDevices == null) {
            Log.debug("DeviceInfoAdapter#existsDeviceInfo::registeredDevices is null.");
            return false;
        }
        for (DeviceInfo registered : registeredDevices) {
            String registeredDeviceId = registered.getDeviceId();
            if (wantsToRegister.equalsIgnoreCase(registeredDeviceId)) {
                Log.info("DeviceInfoAdapter#existsDeviceInfo::device is already registered.");
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("deprecation")
    private DeviceInfo getDeviceInfoFromRegisterDeviceInfoXMPP(
            IQ iq) {
        DeviceInfo ret = null;
        if (iq == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::iq type is not set");
            return ret;
        }
        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::fromJid is null");
            return ret;
        }
        String fromJidStr = fromJid.toBareJID();

        Element deviceInfoElem = iq.getChildElement();
        if (deviceInfoElem == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::device_info is null");
            return ret;
        }
        String tagName = deviceInfoElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("device_info"))) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::device_info is invalid");
            return ret;
        }
        String namespace = deviceInfoElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/deviceinfo/register"))) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = deviceInfoElem.element("content");
        if (contentElem == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::contentElem is null");
            return ret;
        }
        Element deviceIdElem = contentElem.element("device_id");
        if (deviceIdElem == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::deviceIdElem is null");
            return ret;
        }
        String deviceIdStr = deviceIdElem.getStringValue();
        if (deviceIdStr == null || deviceIdStr.equals("")) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::deviceIdStr is invalid");
            return ret;
        }
        Element notificationServiceElem = contentElem.element("notification_service");
        if (notificationServiceElem == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::notificationServiceElem is null");
            return ret;
        }
        String notificationServiceStr = notificationServiceElem.getStringValue();
        if (notificationServiceStr == null || notificationServiceStr.equals("")) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::notificationServiceStr is invalid");
            return ret;
        }
        int notificationService;
        try {
            notificationService = Integer.valueOf(notificationServiceStr);
        } catch (NumberFormatException e) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::notificationService is not Number");
            return ret;
        }
        if(notificationService < DeviceInfo.NOTIFICATION_SERVICE_TYPE_GCM || DeviceInfo.NOTIFICATION_SERVICE_TYPE_APNS < notificationService){
            Log.error("DeviceInfoAdapter#getDeviceInfoFromRegisterDeviceInfoXMPP::notificationService is wrong value");
            return ret;
        }
        ret = new DeviceInfo();
        ret.setDeviceId(deviceIdStr);
        ret.setJid(fromJidStr);
        ret.setNotificationService(notificationService);

        return ret;
    }
    @SuppressWarnings("deprecation")
    public IQ deleteDeviceInfo(IQ iq) {
        IQ ret = null;
        if (iq == null) {
            Log.error("DeviceInfoAdapter#deleteDeviceInfo::iq is null");
            return ret;
        }

        DeviceInfo deviceInfo = getDeviceInfoFromDeleteDeviceInfoXMPP(iq);
        if (deviceInfo == null) {
            Log.error("DeviceInfoAdapter#deleteDeviceInfo::deviceInfo is null");
            return ret;
        }
        if(!DeviceInfoStroreDbHelper
                .deleteDeviceInfoToDb(deviceInfo) ) {
            Log.error("DeviceInfoAdapter#deleteDeviceInfo::failed to delete DeviceInfo From Db");
            return ret;
        }
        Log.info("DeviceInfoAdapter#deleteDeviceInfo::succeeded to delete DeviceInfo From Db: "
            + deviceInfo.getNotificationService() + ", "
            + deviceInfo.getDeviceId() + ", "
            + deviceInfo.getJid()
        );
        ret = IQ.createResultIQ(iq);
        return ret;
    }

    @SuppressWarnings("deprecation")
    private DeviceInfo getDeviceInfoFromDeleteDeviceInfoXMPP(IQ iq) {
        DeviceInfo ret = null;
        if (iq == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::iq is null");
            return ret;
        }
        if (iq.getType() != IQ.Type.set) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::iq type is not set");
            return ret;
        }
        JID fromJid = iq.getFrom();
        if (fromJid == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::fromJid is null");
            return ret;
        }
        String fromJidStr = fromJid.toBareJID();

        Element deviceInfoElem = iq.getChildElement();
        if (deviceInfoElem == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::device_info is null");
            return ret;
        }
        String tagName = deviceInfoElem.getName();
        if (tagName == null || !(tagName.toLowerCase().equals("device_info"))) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::device_info is invalid");
            return ret;
        }
        String namespace = deviceInfoElem.getNamespaceURI();
        if (namespace == null
                || !(namespace
                        .equals("http://necst.nec.co.jp/protocol/deviceinfo/delete"))) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::namespace is invalid");
            return ret;
        }
        Element contentElem = deviceInfoElem.element("content");
        if (contentElem == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::contentElem is null");
            return ret;
        }
        Element deviceIdElem = contentElem.element("device_id");
        if (deviceIdElem == null) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::deviceIdElem is null");
            return ret;
        }
        String deviceIdStr = deviceIdElem.getStringValue();
        if (deviceIdStr == null || deviceIdStr.equals("")) {
            Log.error("DeviceInfoAdapter#getDeviceInfoFromDeleteDeviceInfoXMPP::deviceIdStr is invalid");
            return ret;
        }
        ret = new DeviceInfo();
        ret.setDeviceId(deviceIdStr);
        ret.setJid(fromJidStr);

        return ret;
    }
}
