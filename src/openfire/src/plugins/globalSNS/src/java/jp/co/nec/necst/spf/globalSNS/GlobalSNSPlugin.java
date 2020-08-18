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

package jp.co.nec.necst.spf.globalSNS;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import jp.co.nec.necst.spf.globalSNS.ContextHub.GlobalSNSDataBaseHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.GlobalSNSManagerDataBaseHelper;
import jp.co.nec.necst.spf.globalSNS.ContextHub.UserProfileAdapter;
import jp.co.nec.necst.spf.globalSNS.Group.ContactManager;
import jp.co.nec.necst.spf.globalSNS.Group.FollowFollowerManager;
import jp.co.nec.necst.spf.globalSNS.Handler.ChatMessageInterceptor;
import jp.co.nec.necst.spf.globalSNS.Handler.ExtendedIQPrivateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.ExtendedIQRegisterHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.ExtendedIQRosterHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.ExtendedIQvCardHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQContactListMemberAddHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQAdminHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQChatRoomCreateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQChatRoomDeleteHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQChatRoomInfoGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQChatRoomListGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQChatRoomMemberAddHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQChatRoomMemberRemoveHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQChatRoomUpdateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQCommunityCreateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQCommunityDeleteHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQCommunityInfoGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQCommunityInfoUpdateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQCommunityMemberAddHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQCommunityMemberInfoGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQCommunityMemberRemoveHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQCommunityOwnerUpdateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQDeviceInfoDeleteHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQDeviceInfoRegisterHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQGetCountHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQGoodJobHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQEmotionPointHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMailAllUserSettingsGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMailBodyGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMailCooperationSettingsGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMailCooperationSettingsSetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMailServerListGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageDeleteHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageOptionHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSearchHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageSendHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageUpdateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMessageBodyUpdateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQMyCommunityListGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQContactListMemberRemoveHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQTaskHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQThreadMessageGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQThreadTitleUpdateHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQThreadTitleListGetHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQUserAuthorityHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQUserSearchHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.UserProfileInterceptor;
import jp.co.nec.necst.spf.globalSNS.Handler.IQNoteDeleteHandler;
import jp.co.nec.necst.spf.globalSNS.Handler.IQNoteInfoUpdateHandler;
import jp.co.nec.necst.spf.globalSNS.Notification.ChatMessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.ChatMessageChangeNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.CommunityNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.GoodJobNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.EmotionPointNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.GroupChatNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.MailMessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.MessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.MessageOptionNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.Notifier;
import jp.co.nec.necst.spf.globalSNS.Notification.PublicMessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.QuestionnaireMessageNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.PublicMessageChangeNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.TaskChangeNotifier;
import jp.co.nec.necst.spf.globalSNS.SmartDeviceNotification.APNsFeedbackReceiver;
import jp.co.nec.necst.spf.globalSNS.Notification.UserProfileNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.VCardChangeNotifier;
import jp.co.nec.necst.spf.globalSNS.WebSocketServer.WebSocketServer;
import jp.co.nes.spf.identityReflector.Ldap.LdapAuthProvider;
import jp.co.nec.necst.spf.globalSNS.Notification.ThreadTitleNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.DeleteNoteNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.UpdateNoteInfoNotifier;
import jp.co.nec.necst.spf.globalSNS.Notification.MurmurNotifier;

import org.jivesoftware.openfire.IQRouter;
import org.jivesoftware.openfire.XMPPServer;
import org.jivesoftware.openfire.container.Plugin;
import org.jivesoftware.openfire.container.PluginClassLoader;
import org.jivesoftware.openfire.container.PluginManager;
import org.jivesoftware.openfire.handler.IQHandler;
import org.jivesoftware.openfire.interceptor.InterceptorManager;
import org.jivesoftware.openfire.interceptor.PacketInterceptor;
import org.jivesoftware.util.Log;
import org.jivesoftware.openfire.auth.AuthProvider;
import org.jivesoftware.util.JiveGlobals;

public class GlobalSNSPlugin implements Plugin {

    private static File mPluginDirectory;

    private static PluginClassLoader mPluginClassLoader;
    private static List<GlobalSNSReqister> mGlobalSNSReqisterList;

    private List<IQHandler> mHandlerList;

    private List<PacketInterceptor> mPacketInterceptorList;

    public static final int CREATE_THREAD_RETRY_MAXIMUM_COUNT = 60;
    public static final int CREATE_THREAD_RETRY_BETWEEN_TIME_MS = 1000;

    public static File getPublicDirectory() {
        return mPluginDirectory;
    }

    public static PluginClassLoader getPluginClassLoader() {
        return mPluginClassLoader;
    }

    public static boolean registerGlobalSNSReqister(GlobalSNSReqister register) {
        boolean ret = false;
        if (register == null) {
            return ret;
        }
        if (mGlobalSNSReqisterList == null) {
            return ret;
        }
        return mGlobalSNSReqisterList.add(register);
    }

    @SuppressWarnings("deprecation")
    public void initializePlugin(PluginManager manager, File directory) {
        mPluginDirectory = directory;

        mPluginClassLoader = manager.getPluginClassloader(this);

        mGlobalSNSReqisterList = new ArrayList<GlobalSNSReqister>();

        boolean initDbResult = GlobalSNSManagerDataBaseHelper.initialize();
        if (!initDbResult) {
            Log.error("GlobalSNS plugin : GlobalSNSManagerDataBaseHelper initialize fail");
            return;
        }
        initDbResult = GlobalSNSDataBaseHelper.initialize();
        if (!initDbResult) {
            Log.error("GlobalSNS plugin : GlobalSNSDataBaseHelper initialize fail");
            return;
        }

        UserProfileAdapter.getInstance().initPresence();

        FollowFollowerManager.getInstance().start();
        ContactManager.getInstance().start();
        WebSocketServer.getInstance().start();
        APNsFeedbackReceiver.getInstance().start();

        Notifier.getInstance().start();

        MessageNotifier.getInstance().start();
        PublicMessageNotifier.getInstance().start();
        PublicMessageChangeNotifier.getInstance().start();
        GoodJobNotifier.getInstance().start();
        EmotionPointNotifier.getInstance().start();
        TaskChangeNotifier.getInstance().start();
        MailMessageNotifier.getInstance().start();
        GroupChatNotifier.getInstance().start();
        MessageOptionNotifier.getInstance().start();
        ChatMessageNotifier.getInstance().start();
        ChatMessageChangeNotifier.getInstance().start();
        CommunityNotifier.getInstance().start();
        VCardChangeNotifier.getInstance().start();
        UserProfileNotifier.getInstance().start();
        QuestionnaireMessageNotifier.getInstance().start();
        ThreadTitleNotifier.getInstance().start();
        DeleteNoteNotifier.getInstance().start();
        UpdateNoteInfoNotifier.getInstance().start();
        MurmurNotifier.getInstance().start();

        mHandlerList = new ArrayList<IQHandler>();
        mHandlerList.add(new ExtendedIQPrivateHandler());
        mHandlerList.add(new IQGoodJobHandler());
        mHandlerList.add(new IQEmotionPointHandler());
        mHandlerList.add(new IQTaskHandler());
        mHandlerList.add(new IQUserAuthorityHandler());
        mHandlerList.add(new ExtendedIQRegisterHandler());
        mHandlerList.add(new IQMessageSendHandler());
        mHandlerList.add(new IQMessageUpdateHandler());
        mHandlerList.add(new IQMessageBodyUpdateHandler());
        mHandlerList.add(new ExtendedIQvCardHandler());
        mHandlerList.add(new IQMessageSearchHandler());
        mHandlerList.add(new IQMessageDeleteHandler());
        mHandlerList.add(new IQChatRoomCreateHandler());
        mHandlerList.add(new IQChatRoomUpdateHandler());
        mHandlerList.add(new IQChatRoomInfoGetHandler());
        mHandlerList.add(new IQChatRoomListGetHandler());
        mHandlerList.add(new IQChatRoomMemberAddHandler());
        mHandlerList.add(new IQChatRoomDeleteHandler());
        mHandlerList.add(new IQMailCooperationSettingsSetHandler());
        mHandlerList.add(new IQMailServerListGetHandler());
        mHandlerList.add(new IQMailCooperationSettingsGetHandler());
        mHandlerList.add(new IQMailAllUserSettingsGetHandler());
        mHandlerList.add(new IQMailBodyGetHandler());
        mHandlerList.add(new IQThreadMessageGetHandler());
        mHandlerList.add(new IQThreadTitleUpdateHandler());
        mHandlerList.add(new IQThreadTitleListGetHandler());
        mHandlerList.add(new IQDeviceInfoRegisterHandler());
        mHandlerList.add(new IQDeviceInfoDeleteHandler());
        mHandlerList.add(new IQMessageOptionHandler());
        mHandlerList.add(new IQGetCountHandler());
        mHandlerList.add(new IQAdminHandler());
        mHandlerList.add(new ExtendedIQRosterHandler());
        mHandlerList.add(new IQCommunityCreateHandler());
        mHandlerList.add(new IQMyCommunityListGetHandler());
        mHandlerList.add(new IQCommunityInfoGetHandler());
        mHandlerList.add(new IQCommunityMemberInfoGetHandler());
        mHandlerList.add(new IQCommunityInfoUpdateHandler());
        mHandlerList.add(new IQCommunityMemberAddHandler());
        mHandlerList.add(new IQCommunityOwnerUpdateHandler());
        mHandlerList.add(new IQCommunityMemberRemoveHandler());
        mHandlerList.add(new IQCommunityDeleteHandler());
        mHandlerList.add(new IQChatRoomMemberRemoveHandler());
        mHandlerList.add(new IQUserSearchHandler());
        mHandlerList.add(new IQContactListMemberAddHandler());
        mHandlerList.add(new IQContactListMemberRemoveHandler());
        mHandlerList.add(new IQNoteDeleteHandler());
        mHandlerList.add(new IQNoteInfoUpdateHandler());

        mPacketInterceptorList = new ArrayList<PacketInterceptor>();
        mPacketInterceptorList.add(new ChatMessageInterceptor());
        mPacketInterceptorList.add(new UserProfileInterceptor());

        IQRouter iqRouter = XMPPServer.getInstance().getIQRouter();
        for (IQHandler handler : mHandlerList) {
            iqRouter.addHandler(handler);
        }

        InterceptorManager interceptorManager = InterceptorManager
                .getInstance();
        for (PacketInterceptor packetInterceptor : mPacketInterceptorList) {
            interceptorManager.addInterceptor(packetInterceptor);
        }

        Log.info("GlobalSNS plugin has been loaded");

        Log.info("Hostname = "
                + XMPPServer.getInstance().getServerInfo().getHostname());

        if(JiveGlobals.getXMLProperty("ir.ldap_enable", false)){
            LdapAuthProvider ldap = new LdapAuthProvider();
            JiveGlobals.setProperty("provider.auth.className", ldap.getClass().getName());
            Log.info("GlobalSNS plugin loaded provider.auth.className setting in openfire.xml");
        }
    }

    public void destroyPlugin() {
        if (mGlobalSNSReqisterList != null) {
            for (GlobalSNSReqister register : mGlobalSNSReqisterList) {
                register.stop();
            }
        }
        InterceptorManager interceptorManager = InterceptorManager
                .getInstance();
        for (PacketInterceptor packetInterceptor : mPacketInterceptorList) {
            interceptorManager.removeInterceptor(packetInterceptor);
        }

        IQRouter iqRouter = XMPPServer.getInstance().getIQRouter();
        for (IQHandler handler : mHandlerList) {
            iqRouter.removeHandler(handler);
        }

        FollowFollowerManager.getInstance().stop();
        ContactManager.getInstance().stop();
        WebSocketServer.getInstance().stop();
        APNsFeedbackReceiver.getInstance().stop();

        MessageNotifier.getInstance().stop();
        PublicMessageNotifier.getInstance().stop();
        PublicMessageChangeNotifier.getInstance().stop();
        GoodJobNotifier.getInstance().stop();
        EmotionPointNotifier.getInstance().stop();
        TaskChangeNotifier.getInstance().stop();
        MailMessageNotifier.getInstance().stop();
        GroupChatNotifier.getInstance().stop();
        MessageOptionNotifier.getInstance().stop();
        ChatMessageNotifier.getInstance().stop();
        ChatMessageChangeNotifier.getInstance().stop();
        CommunityNotifier.getInstance().stop();
        VCardChangeNotifier.getInstance().stop();
        UserProfileNotifier.getInstance().stop();
        QuestionnaireMessageNotifier.getInstance().stop();
        ThreadTitleNotifier.getInstance().stop();
        DeleteNoteNotifier.getInstance().stop();
        UpdateNoteInfoNotifier.getInstance().stop();
        MurmurNotifier.getInstance().stop();

        Notifier.getInstance().stop();

        GlobalSNSManagerDataBaseHelper.cleanUp();
        GlobalSNSDataBaseHelper.cleanUp();
    }
}
