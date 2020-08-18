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

package jp.co.nec.necst.spf.globalSNS.WebSocketServer;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.util.Calendar;

import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileDbHelper;
import jp.co.nec.necst.spf.globalSNS.Data.Profile;
import jp.co.nec.necst.spf.globalSNS.Data.UserAccountInfo;
import jp.co.nec.necst.spf.globalSNS.Group.UserAccountManager;
import jp.co.nec.necst.spf.globalSNS.Notification.UserProfileNotifier;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.LoginRequestApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.ResponseApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.ResponseApi.ResponseContent;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.SetPresenceRequestApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.SetPresenceResponseApi;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.Data.LoginResult;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketApi.Data.SetPresenceResult;
import jp.co.nec.necst.spf.globalSNS.XmppPacket.InnerChangedPresence;

import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.auth.AuthFactory;
import org.jivesoftware.openfire.user.UserNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xmpp.packet.JID;
import org.xmpp.packet.Presence.Show;

public class WebSocketApiProcessor {
    private static final Logger Log = LoggerFactory
            .getLogger(WebSocketApiProcessor.class);

    private static enum EncryptType {
        INVALID(""), SHA_256("SHA-256");

        private final String mEncryptType;

        private EncryptType(String encryptType) {
            mEncryptType = encryptType;
        }

        @Override
        public String toString() {
            return mEncryptType;
        }
    }

    private static WebSocketApiProcessor mInstance = null;

    private WebSocketApiProcessor() {
    }

    public static WebSocketApiProcessor getInstance() {
        if (mInstance == null) {
            mInstance = new WebSocketApiProcessor();
        }
        return mInstance;
    }

    public LoginResult login(LoginRequestApi api) {
        final String prefix = "login() : ";
        LoginResult result = new LoginResult();
        result.setResult(false);
        result.setReason(ResponseApi.ResponseContent.REASON_CODE_SERVER_ERROR);
        if (api == null) {
            Log.error(prefix + "api is null", new Throwable());
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_API_FORMAT);
            return result;
        }
        LoginRequestApi.Content content = api.content;
        if (content == null) {
            Log.info(prefix + "content is null");
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_API_FORMAT);
            return result;
        }
        EncryptType encryptType = null;
        if ("SHA256".equals(content.encryptType)) {
            encryptType = EncryptType.SHA_256;
        } else {
            Log.info(prefix
                    + "content.encryptType is not supported. encryptType = "
                    + ((content.encryptType == null) ? "null"
                            : content.encryptType));
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_API_FORMAT);
            return result;
        }
        String userAccount = content.user;
        UserAccountInfo accountInfo = UserAccountManager.getInstance()
                .getUserAccountInfo(userAccount);
        if (accountInfo == null) {
            Log.info(prefix + "accountInfo is null : user = " + userAccount);
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_LOGIN_AUTH);
            return result;
        }

        String openfireAccount = accountInfo.getOpenfireAccount();
        String openfirePassword = "";
        JID jid = XMPPServer.getInstance().createJID(openfireAccount, null);
        String userJid = jid.toBareJID();
        int deleteFlg = accountInfo.getDeleteFlg();
        if (deleteFlg == UserAccountInfo.DELETE_FLAG_STATUS_DELETED
                || deleteFlg == UserAccountInfo.DELETE_FLAG_STATUS_SUSPEND) {
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_LOGIN_AUTH);
            Log.info(prefix + "user is invalid : user = " + userAccount);
            return result;
        }

        try {
            openfirePassword = AuthFactory.getPassword(openfireAccount);
        } catch (UnsupportedOperationException e) {
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_LOGIN_AUTH);
            Log.error(prefix + "UnsupportedOperationException ", e);
            return result;
        } catch (UserNotFoundException e) {
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_LOGIN_AUTH);
            Log.error(prefix + "UserNotFound user = " + openfireAccount, e);
            return result;
        }

        String requestPassword = content.password;
        if (requestPassword == null) {
            Log.info(prefix + "requestPassword is null");
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_LOGIN_AUTH);
            return result;
        }
        String hashedOpenfirePasswordString = getEncryptPasswordString(
                openfirePassword, encryptType);
        if (hashedOpenfirePasswordString == null) {
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_LOGIN_AUTH);
            Log.error(prefix + "UnsupportedOperationException ",
                    new Throwable());
            return result;
        }
        if(encryptType.equals(EncryptType.SHA_256)) {
            if (!hashedOpenfirePasswordString.toLowerCase().equals(requestPassword.toLowerCase())) {
                result.setReason(ResponseApi.ResponseContent.REASON_CODE_LOGIN_AUTH);
                Log.info(prefix + "passsword is invalid ");
                return result;
            }
        } else {
            Log.error(prefix
                    + "content.encryptType is not supported. encryptType = "
                    + ((content.encryptType == null) ? "null"
                            : content.encryptType), new Throwable());
            result.setReason(ResponseApi.ResponseContent.REASON_CODE_API_FORMAT);
            return result;
        }

        result.setResult(true);
        result.setReason(ResponseContent.REASON_CODE_NONE);
        result.setJid(userJid);
        result.setAccount(userAccount);

        return result;
    }

    private String getEncryptPasswordString(String text, EncryptType encryptType) {
        final String prefix = "getEncryptPasswordString() : ";
        String ret = null;
        if (text == null || "".equals(text)) {
            Log.error(prefix + "text is invalid.", new Throwable());
            return ret;
        }
        if (encryptType == null) {
            Log.error(prefix + "encryptType is null.", new Throwable());
            return ret;
        }
        byte[] hashArray = encryptPassword(text, encryptType);
        if (hashArray == null) {
            Log.error(prefix + "hashArray is null.", new Throwable());
            return ret;
        }
        StringBuffer buffer = new StringBuffer();
        for (int i = 0; i < hashArray.length; i++) {
            String tmpStr = Integer.toHexString(hashArray[i] & 0xff);
            if (tmpStr.length() == 1) {
                buffer.append('0').append(tmpStr);
            } else {
                buffer.append(tmpStr);
            }
        }
        ret = buffer.toString();
        return ret;
    }

    private byte[] encryptPassword(String text, EncryptType encryptType) {
        final String prefix = "encryptPassword() : ";
        byte[] ret = null;
        MessageDigest md = null;
        if (encryptType == null || encryptType.equals(EncryptType.INVALID)) {
            Log.error(prefix + "encryptType is invalid.", new Throwable());
            return ret;
        }
        try {
            md = MessageDigest.getInstance(encryptType.toString());
        } catch (NoSuchAlgorithmException e) {
            Log.error(prefix + " Fail encrypt ", e);
            return ret;
        }
        md.update(text.getBytes());
        ret = md.digest();
        return ret;
    }

    public boolean logout(String jid) {
        final String logPrefix = "logout() : ";
        Profile profile = UserAccountManager.getInstance().getProfile(jid);
        if (profile == null) {
            Log.info(logPrefix + "jid is invalid  jid = " + jid);
            return false;
        }
        Calendar now = Calendar.getInstance();
        Timestamp nowDate = new Timestamp(now.getTimeInMillis());
        boolean updateResult = UserAccountManager.getInstance()
                .updateNotificationClientLastUpdatedAt(jid, nowDate);
        if (!updateResult) {
            Log.info(logPrefix + "Fail Update Profile jid = " + jid);
            return false;
        }
        return true;
    }

    public int getDisplayPresence(String jid) {
        final String logPrefix = "getDisplayPresence() : ";
        int ret = -1;
        if (jid == null || "".equals(jid)) {
            Log.error(logPrefix + "jid is invalid.", new Throwable());
            return ret;
        }
        Profile profile = UserAccountManager.getInstance().getProfile(jid);
        if (profile == null) {
            Log.error(logPrefix + "profile is null. JID=" + jid,
                    new Throwable());
            return ret;
        }
        int presence = profile.getPresence();
        if ((presence & 0x8) == 0 && (presence & 0x10) == 0) {
            ret = 0;
        } else {
            ret = presence & 0x7;
        }
        return ret;
    }

    public SetPresenceResult setPresence(String jid, int action, int presence) {
        final String logPrefix = "getDisplayPresence() : ";
        SetPresenceResult ret = null;
        if (jid == null || "".equals(jid)) {
            Log.error(logPrefix + "jid is invalid.", new Throwable());
            return ret;
        }
        boolean isArgCorrect = true;
        if (action != SetPresenceRequestApi.Content.ACTION_TYPE_AUTO
                || (presence < SetPresenceRequestApi.Content.PRESENCE_TYPE_CHAT || presence > SetPresenceRequestApi.Content.PRESENCE_TYPE_DND)) {
            isArgCorrect = false;
        }
        ret = new SetPresenceResult();
        if (isArgCorrect) {
            Profile profile = UserAccountManager.getInstance().getProfile(jid);
            if (profile == null) {
                Log.error(logPrefix + "profile is null. JID=" + jid,
                        new Throwable());
                return ret;
            }
            int currentDbPresence = profile.getPresence();
            boolean isChangable = false;
            if (presence == SetPresenceRequestApi.Content.PRESENCE_TYPE_CHAT) {
                if (currentDbPresence == Profile.PRESENCE_STATUS_AUTO_AWAY) {
                    isChangable = true;
                }
            } else if (presence == SetPresenceRequestApi.Content.PRESENCE_TYPE_AWAY) {
                if (currentDbPresence == Profile.PRESENCE_STATUS_MANUAL_CHAT
                        || currentDbPresence == Profile.PRESENCE_STATUS_AUTO_CHAT) {
                    isChangable = true;
                }
            }
            if (isChangable) {
                int changeDbPresence = (presence | Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE);
                profile.setPresence(changeDbPresence);
                boolean isUpdateResult = UserProfileDbHelper
                        .updateUserProfileDataToDb(profile, 1);
                if (!isUpdateResult) {
                    Log.error(logPrefix + "failed to update profile DB.",
                            new Throwable());
                    return ret;
                }
                UserProfileNotifier.getInstance().notifyUserProfile(jid);
                InnerChangedPresence innerChangedPresence = createInnerChangedPresence(profile);
                if (innerChangedPresence == null) {
                    Log.warn(logPrefix
                            + "failed to create InnerChangedPresence.",
                            new Throwable());
                } else {
                    XMPPServer.getInstance().getPresenceRouter()
                            .route(innerChangedPresence);
                }
                ret.setPresence(presence);
            } else {
                ret.setReason(SetPresenceResponseApi.Content.REASON_CODE_NOT_CHANGED);
                int responsePresence;
                if ((currentDbPresence & Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE) == 0
                        && (currentDbPresence & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) == 0) {
                    responsePresence = Profile.PRESENCE_STATUS_FLAG_OFFLINE;
                } else {
                    responsePresence = (currentDbPresence & 0x7);
                }
                ret.setPresence(responsePresence);
            }
        } else {
            ret.setReason(ResponseApi.ResponseContent.REASON_CODE_API_FORMAT);
        }
        return ret;
    }

    private InnerChangedPresence createInnerChangedPresence(Profile profile) {
        final String logPrefix = "createInnerChangedPresence() : ";
        InnerChangedPresence ret = null;
        if (profile == null) {
            Log.error(logPrefix + "profile is null.", new Throwable());
            return ret;
        }
        int presence = profile.getPresence();
        if ((presence & Profile.PRESENCE_STATUS_FLAG_MANUAL_ONLINE) == 0
                && (presence & Profile.PRESENCE_STATUS_FLAG_AUTO_ONLINE) == 0) {
            Log.error(
                    logPrefix + "presence is invalid. "
                            + String.valueOf(presence), new Throwable());
            return ret;
        }
        Show show = Show.chat;
        switch (presence & 0x7) {
            case 1:
                show = Show.chat;
                break;
            case 2:
                show = Show.away;
                break;
            case 3:
                show = Show.xa;
                break;
            case 4:
                show = Show.dnd;
                break;
            default:
                Log.error(
                        logPrefix + "presence is invalid. "
                                + String.valueOf(presence), new Throwable());
                return ret;
        }
        ret = new InnerChangedPresence();
        ret.setFrom(profile.getJid());
        ret.setStatus(profile.getMyMemo());
        ret.setShow(show);
        return ret;
    }
}
