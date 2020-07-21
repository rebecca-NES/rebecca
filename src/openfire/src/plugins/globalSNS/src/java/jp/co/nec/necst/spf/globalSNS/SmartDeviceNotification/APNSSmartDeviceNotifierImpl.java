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

import static org.apache.commons.lang.StringUtils.isEmpty;
import static org.apache.commons.lang.StringUtils.isNotEmpty;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jp.co.nec.necst.spf.globalSNS.Data.Message;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content.messageNotice;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content.messageNotice.roomInfo;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.SmartDeviceNoticeInfo.content.messageNotice.toInfo;

import org.jivesoftware.util.Log;

import com.notnoop.apns.APNS;
import com.notnoop.apns.ApnsService;
import com.notnoop.apns.PayloadBuilder;
import com.notnoop.apns.internal.Utilities;

public class APNSSmartDeviceNotifierImpl extends AbstractSmartDeviceNotifier {
    private static final String CUSTOM_FIELD_KEY_ROOM_ID = "rId";

    private static final String CUSTOM_FIELD_KEY_TO_JID = "toJid";

    private static final String CUSTOM_FIELD_KEY_FROM_JID = "fromJid";

    private static final String CUSTOM_FIELD_KEY_MESSAGE_TYPE = "msgType";

    private static final String CUSTOM_FIELD_KEY_IS_WF = "isWF";

    private static final String CUSTOM_FIELD_KEY_VERSION = "ver";

    private static final String LOC_KEY_ALERT_GROUP_CHAT = "ALERT_GC";

    private static final String LOC_KEY_ALERT_CHAT = "ALERT_CH";

    private static final String LOC_KEY_ALERT_WATCH_FEED = "ALERT_WF";

    private static final String LOC_KEY_ALERT_COMMUNITY_FEED = "ALERT_CF";

    private static final int LOC_ARGS_MAX_BYTES = 61;

    private static final int LOC_ARGS_MAX_BYTES_INCLUDES_ELLIPSES = LOC_ARGS_MAX_BYTES + 3;

    private static final int BODY_MAX_BYTES = 560;

    private static final int BODY_MAX_BYTES_INCLUDES_ELLIPSES = BODY_MAX_BYTES + 3;

    private APNSUtils utils;

    public APNSSmartDeviceNotifierImpl(APNSUtils utils) {
        this.utils = utils;
    }

    @SuppressWarnings("deprecation")
    void sendNotification() {

        try {
            ApnsService service = this.utils.getApnsServiceInstance();
            if (service == null) {
                Log.error("APNSSmartDeviceNotifierImpl#sendNotification: can NOT send notification because of fail to get APNS service instance. ");
                return;
            }
            SmartDeviceNoticeInfo noticeInfo = getNotifyData();
            PayloadBuilder builder = APNS.newPayload().badge(1)
                    .sound("default").forNewsstand()
                    .customFields(this.composeCustomFields(noticeInfo));
            builder = this.localizedAlert(builder, noticeInfo);
            String payload = builder.build();
            if (builder.isTooLong()) {
                Log.error("APNSSmartDeviceNotifierImpl#sendNotification: notification Message is TOO LONG: "
                        + payload);
            }

            List<String> deviceIdList = getDeviceIdListFromDeviceInfoList();
            Log.info("APNSSmartDeviceNotifierImpl#sendNotification: device="
                    + deviceIdList + " payload: " + payload);

            service.push(deviceIdList, payload);

            Log.info("APNSSmartDeviceNotifierImpl#sendNotification: END");
        } catch (Exception e) {
            Log.error("APNSSmartDeviceNotifierImpl#sendNotification:: Failed to send APNS notification."
                    + e.toString());
        }
    }

    PayloadBuilder localizedAlert(PayloadBuilder builder,
            SmartDeviceNoticeInfo noticeInfo) {
        if (noticeInfo == null || noticeInfo.getContent() == null) {
            return builder;
        }
        messageNotice notice = noticeInfo.getContent().getMessageNotice();
        if (notice == null) {
            return builder;
        }
        int messageType = notice.getMessageType();
        switch (messageType) {
            case Message.TYPE_PUBLIC:
                builder.localizedTitleKey(LOC_KEY_ALERT_WATCH_FEED);
                builder.alertTitle(this.truncateLocaleArg("あなた宛の新着メッセージ（ウォッチ）があります"));
                break;
            case Message.TYPE_CHAT:
                String nickName = notice.getToInfo().getNickname();
                if (isEmpty(nickName)) {
                    nickName = notice.getToInfo().getJid();
                }
                builder.localizedTitleKey(LOC_KEY_ALERT_CHAT)
                    .localizedTitleArguments(this.truncateLocaleArg(nickName));
                builder.localizedArguments(this.truncateLocaleArg(nickName));
                builder.alertTitle(this.truncateLocaleArg(nickName + "さんからの新着メッセージがあります。"));
                break;
            case Message.TYPE_GROUP_CAHT: {
                String locaizedKeyStr = LOC_KEY_ALERT_GROUP_CHAT;
                if(notice.getIsWF()) {
                    locaizedKeyStr = LOC_KEY_ALERT_WATCH_FEED;
                }
                String roomName = notice.getRoomInfo().getRoomName();
                builder.localizedTitleKey(locaizedKeyStr)
                    .localizedTitleArguments(this.truncateLocaleArg(roomName));
                builder.localizedArguments(this.truncateLocaleArg(roomName));
                builder.alertTitle(this.truncateLocaleArg("グループ[" + roomName + "]の新着メッセージがあります"));
            }
                break;
            case Message.TYPE_COMMUNITY: {
                String locaizedKeyStr = LOC_KEY_ALERT_COMMUNITY_FEED;
                if(notice.getIsWF()) {
                    locaizedKeyStr = LOC_KEY_ALERT_WATCH_FEED;
                }
                String roomName = notice.getRoomInfo().getRoomName();
                builder.localizedTitleKey(locaizedKeyStr)
                    .localizedTitleArguments(this.truncateLocaleArg(roomName));
                builder.localizedArguments(this.truncateLocaleArg(roomName));
                builder.alertTitle(this.truncateLocaleArg("プロジェクト[" + roomName + "]の新着メッセージがあります"));
            }
            break;
        }
        String message = notice.getEntry().getBody();
        builder.alertBody(this.truncateBody(message));
        return builder;
    }

    String truncateLocaleArg(String arg) {
        String urldecoded = URLDecoder.decode(arg);
        int currentLength = Utilities.toUTF8Bytes(urldecoded).length;
        if (currentLength <= LOC_ARGS_MAX_BYTES_INCLUDES_ELLIPSES) {
            return urldecoded;
        }
        String abbreviated = Utilities.truncateWhenUTF8(urldecoded,
                LOC_ARGS_MAX_BYTES) + "...";
        return abbreviated;
    }

    String truncateBody(String arg) {
        int currentLength = Utilities.toUTF8Bytes(arg).length;
        if (currentLength <= BODY_MAX_BYTES_INCLUDES_ELLIPSES) {
            return arg;
        }
        String abbreviated = Utilities.truncateWhenUTF8(arg,
                BODY_MAX_BYTES) + "...";
        return abbreviated;
    }

    Map<String, Object> composeCustomFields(SmartDeviceNoticeInfo noticeInfo) {
        Map<String, Object> customFields = new ConcurrentHashMap<String, Object>();
        content contents = noticeInfo.getContent();
        customFields.put(CUSTOM_FIELD_KEY_VERSION, noticeInfo.getVersion());
        messageNotice notice = contents.getMessageNotice();
        customFields
                .put(CUSTOM_FIELD_KEY_MESSAGE_TYPE, notice.getMessageType());
        switch (notice.getMessageType()) {
            case Message.TYPE_CHAT:
                toInfo toInfo = notice.getToInfo();
                if (toInfo != null && isNotEmpty(toInfo.getJid())) {
                    customFields.put(CUSTOM_FIELD_KEY_TO_JID, toInfo.getJid());
                }
                break;
            case Message.TYPE_GROUP_CAHT:
            case Message.TYPE_COMMUNITY:
                roomInfo room = notice.getRoomInfo();
                if (room != null && isNotEmpty(room.getRoomId())) {
                    customFields
                            .put(CUSTOM_FIELD_KEY_ROOM_ID, room.getRoomId());
                }
                break;
        }
        customFields.put(CUSTOM_FIELD_KEY_IS_WF, notice.getIsWF());
        return customFields;
    }

}
