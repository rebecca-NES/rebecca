/*
Copyright 2019 NEC Solution Innovators, Ltd.

Licensed under the Apache License, Version 2.0 (the License);
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


import React, { Component } from 'react'
import {
  Platform,
  View,
  AppState,
  StyleSheet,
  AsyncStorage,
  StatusBar,
  PushNotificationIOS
} from 'react-native'
import {
    Scene,
    Router,
    Actions,
} from 'react-native-router-flux'
import Icon from 'react-native-vector-icons/FontAwesome'
import Menu, {
  MenuProvider,
} from 'react-native-popup-menu'
import Toast from 'react-native-simple-toast'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'

import LoginScreen from '../Login/LoginScreen'
import SettingScreen from '../Setting/SettingScreen'
import HomeScreen from '../Home/HomeScreen'
import NewerScreen from '../Newer/NewerScreen'
import CompanyScreen from '../Company/CompanyScreen'
import MoreScreen from '../More/MoreScreen'
import ProfileScreen from '../More/ProfileScreen'
import PasswordScreen from '../More/PasswordScreen'
import CommunityScreen from '../Community/CommunityScreen'
import ChatScreen from '../Chat/ChatScreen'
import GroupChatScreen from '../GroupChat/GroupChatScreen'
import RoomScreen from '../Room/RoomScreen'
import MemberScreen from '../Member/MemberScreen'
import UserListScreen from '../UserList/UserListScreen'
import PreviewScreen from '../Preview/PreviewScreen'
import LicenseScreen from '../More/LicenseScreen'
import CommunityThreadScreen from '../Community/CommunityThreadScreen'
import CommunityReplyScreen from '../Community/CommunityReplyScreen'
import GroupChatThreadScreen from '../GroupChat/GroupChatThreadScreen'
import GroupChatReplyScreen from '../GroupChat/GroupChatReplyScreen'
import ChatThreadScreen from '../Chat/ChatThreadScreen'
import ChatReplyScreen from '../Chat/ChatReplyScreen'
import CompanyThreadScreen from '../Company/CompanyThreadScreen'
import CompanyReplyScreen from '../Company/CompanyReplyScreen'
import NewerThreadScreen from '../Newer/NewerThreadScreen'
import NewerReplyScreen from '../Newer/NewerReplyScreen'

// ライブラリの読込
var PushNotification = require('react-native-push-notification')
var _pushFlag = false
var _badgelist = {feed:false, chat:[], group:[], community:[]}

var tabHomeThis = null
var tabCompanyThis = null

var _allIds = {chat:[], group:[], community:[]}

// プロセスが切れた状態で通知をタップしたことを示すフラグ
var _noProcessTapNotification = false;

PushNotification.setApplicationIconBadgeNumber(0)


// 通知をバックグラウンドでタップした際に実行する処理(iOS)
// react-native-push-notificationでは、userInteractionへ格納された
// boolean値にて判断可能だが、iosはバックグラウンドにあると
// 常にtrueとなってしまうバグがある為、別に実装。
if (Platform.OS === 'ios'){
  // push通知をタップして起動した場合 (iOS only)
  function appOpenedByNotificationTap(notification) {
    Common.saveOperationLog("notification", "プッシュ通知から起動", "")

    // ログイン情報が格納されていない場合、つまりはアプリが起動していない場合に
    // 通知をタップしてアプリを起動した際にフラグをtrueとし、LoginScreen上で
    // 実行される処理を分ける
    var login = CubeeAPI.getLoginInfo()
    if ( login === null) {
      // This expression has no effect.
      // _noProcessTapNotification === true
      _noProcessTapNotification = true;
      return;
    }

    if (notification._data.msgType === Const.cubee_message_feed){ // フィード
      Actions.company()
    } else {
      Actions.newer()
      Actions.refresh({tabRefresh:new Date().getTime()})
    }
  }

  PushNotificationIOS.getInitialNotification().then(function (notification) {
    if (notification != null) {
      appOpenedByNotificationTap(notification);
    }
  });

  let backgroundNotification;

  PushNotificationIOS.addEventListener('notification', function (notification) {
    if (AppState.currentState === 'background') {
      backgroundNotification = notification;
    }
  });

  AppState.addEventListener('change', function (new_state) {
    if (new_state === 'active' && backgroundNotification != null) {
      appOpenedByNotificationTap(backgroundNotification);
      backgroundNotification = null;
    }
  });
}

// 未使用。ホーム画面に通知がきたらバッジを表示し、更新する処理
function checkPushNotification(notification){
  if (notification.type === Const.cubee_message_feed){ // フィード
    if (_badgelist.feed === false){
      _badgelist.feed = true
      tabCompanyThis.setState({badgeUpdateTime:new Date().getTime()})
      if(Actions.currentScene === "_company"){
        Actions.refresh({notificationData: new Date().getTime()})
      }
    }
  }else if (notification.type === Const.cubee_message_chat){ // チャット
    if (_badgelist.chat.indexOf(notification.jid) === -1){
      _badgelist.chat.push(notification.jid)
      tabHomeThis.setState({badgeUpdateTime:new Date().getTime()})
    }
  }else if (notification.type === Const.cubee_message_groupchat){ // グループ
    if (_badgelist.group.indexOf(notification.rid) === -1){
      _badgelist.group.push(notification.rid)
      tabHomeThis.setState({badgeUpdateTime:new Date().getTime()})
    }
  }else if (notification.type === Const.cubee_message_community){ // プロジェクト
    if (_badgelist.community.indexOf(notification.rid) === -1){
      _badgelist.community.push(notification.rid)
      tabHomeThis.setState({badgeUpdateTime:new Date().getTime()})
    }
  }

  // HOMEの場合はリフレッシュ
  if (Actions.currentScene === '_home'){
    _pushFlag = true
    Actions.refresh({notificationData: notification})
  }
}

PushNotification.configure({
  onRegister: function(token) {
    // GCMサーバーに端末を登録し、トークンを受信
    CubeeAPI.setDeviceId(token.token)
  },

  onNotification: function(notification) {
    var login = CubeeAPI.getLoginInfo()
    if (Platform.OS === 'ios'){ // iOS
      if (AppState.currentState === 'active') {
        // アプリ起動中にpush通知を受信した場合
        // ホーム画面の対象ルームにバッジを表示する処理。不具合がある為Toastで対応。
        /*
        Common.saveOperationLog("notification", "プッシュ通知受信", "")
        var data = {type:notification.data.msgType, id:notification.data.notificationId, jid:notification.data.toJid, rid:notification.data.rId}
        checkPushNotification(data)
        */

        // 通知をタップした場合もこの処理に入ってしまうため、
        // ログイン情報がない場合(プロセスが存在しない場合)は
        // フラグを有効としてアプリ起動時の処理を変更する
        if (login === null) {
          _noProcessTapNotification = true
        }else{
          // Toastでメッセージが来たルームを表示する。iosは通知センターに表示が不可の為。
          if (notification.data.isWF &&
              notification.data.msgType !== Const.cubee_message_chat){ // ウォッチフィード
            Toast.show("あなた宛の新着メッセージ（ウォッチ）があります")
          }else if (notification.data.msgType === Const.cubee_message_chat){ // チャット
            Toast.show(notification.message["loc-args"][0] + "さんからの新着メッセージがあります。")
          }else if (notification.data.msgType === Const.cubee_message_groupchat){ // グループ
            Toast.show("グループ["+ notification.message["loc-args"][0] +"]の新着メッセージがあります。" )
          }else if (notification.data.msgType === Const.cubee_message_community){ // プロジェクト
            Toast.show("プロジェクト["+ notification.message["loc-args"][0] +"]の新着メッセージがあります。" )
          }
          _noProcessTapNotification = false
        }
      }
    }
    else { // Android
      if(notification.userInteraction === false){ // プッシュ通知が届いた場合
        Common.saveOperationLog("notification", "プッシュ通知受信", "")
        var messageData = JSON.parse(notification.message)
        var messageType = messageData.content.messageNotice.messageType
        var roomInfo = messageData.content.messageNotice.roomInfo
        var toInfo = messageData.content.messageNotice.toInfo
        var fromJid = messageData.content.messageNotice.fromJid
        var isWF = messageData.content.messageNotice.isWF

        if(notification.foreground === true){
          // アプリ起動中
          // ホーム画面の対象ルームにバッジを表示する処理。不具合がある為Toastで対応。
          /*
          var login = CubeeAPI.getLoginInfo()
          if(login.userInfo.jid !== fromJid){
            var data = {type:messageType, id:notification.id, jid:toInfo ? toInfo.jid : "", rid:roomInfo ? roomInfo.roomId : ""}
            checkPushNotification(data)
          }
          */

          // アプリが起動している状態では、プロセスがない状態で通知をタップしたフラグは常にfalse
          _noProcessTapNotification = false

          // Toastでメッセージが来たルームを表示する。iosと合わせる。
          if (isWF && messageType !== Const.cubee_message_chat){ // ウォッチフィード
            Toast.show("あなた宛の新着メッセージ（ウォッチ）があります")
          }else if (messageType === Const.cubee_message_chat){ // チャット
            Toast.show(Common.urldecode(toInfo.nickname) + " さんからの新着メッセージがあります")
          }else if (messageType === Const.cubee_message_groupchat){ // グループ
            Toast.show("グループ[" + Common.urldecode(roomInfo.roomName) + "]の新着メッセージがあります")
          }else if (messageType === Const.cubee_message_community){ // プロジェクト
            Toast.show("プロジェクト[" + Common.urldecode(roomInfo.roomName) + "]の新着メッセージがあります")
          }
        }else{

          // 通知をタップした際、プロセスが無い場合にフラグを有効化する。
          // androidのuserInteractionにはバグがあり、アプリのプロセスが切れている状態で
          // 受信した通知をタップした場合にtrueとはならない。
          // https://github.com/zo0r/react-native-push-notification/issues/569
          // 上記の状況の際はこの分岐内の処理が実行される。その際にフラグを有効化して
          // アプリ起動時の処理を分岐させる。バグが修正された場合は以下の処理は削除すること。
          if (login === null) {
            _noProcessTapNotification = true
          }

          // アプリバックグランド
          var mes = ""
          if (isWF && messageType !== Const.cubee_message_chat){ // ウォッチフィード
            mes = "あなた宛の新着メッセージ（ウォッチ）があります"
          }else if (messageType === Const.cubee_message_chat){ // チャット
            mes = Common.urldecode(toInfo.nickname) + " さんからの新着メッセージがあります"
          }else if (messageType === Const.cubee_message_groupchat){ // グループ
            mes = "グループ[" + Common.urldecode(roomInfo.roomName) + "]の新着メッセージがあります"
          }else if (messageType === Const.cubee_message_community){ // プロジェクト
            mes = "プロジェクト[" + Common.urldecode(roomInfo.roomName) + "]の新着メッセージがあります"
          }

          PushNotification.localNotification({
              /* プッシュ通知の設定 */
              message: mes,
              tag: messageData, // tagに受信情報を保持させる
            })
        }
      }else{
        Common.saveOperationLog("notification", "プッシュ通知から起動", "")
        // 通知をタップした場合
        var messageData = notification.tag.content.messageNotice

        // 通知をタップした際、プロセスが無い場合にフラグを有効化する。
        // androidのuserInteractionにはバグがあり、アプリのプロセスが切れている状態で
        // 受信した通知をタップした場合にtrueとはならない。
        // https://github.com/zo0r/react-native-push-notification/issues/569
        // その為、通知をタップした際に全てこの処理に入ってくるわけでは無いことに注意。
        if (login === null) {
          _noProcessTapNotification = true
        } else {
          // messageDataを解析して、該当画面に遷移させる
          if (messageData.messageType === Const.cubee_message_feed){ // フィード
            Actions.company()
          } else {
            // 新着画面を更新して表示
            Actions.newer()
            Actions.refresh({tabRefresh:new Date().getTime()})
          }
        }
        // それまでの通知を全て消去する
        PushNotification.cancelAllLocalNotifications()
      }
    }
  },

  // 取得したGCMのsender Androidの場合のみ使用
  senderID: "444707616913"
})

/**
  * ロプリケーションメイン処理
  * <pre>
  * プリケーションの制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class App extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
    constructor() {

      super()

      // 障害時ログ保存
      Common.startupLog()
      StatusBar.setHidden(true)
    }

    componentDidMount() {
      AppState.addEventListener('change', this._handleAppStateChange)
      StatusBar.setHidden(false)
      StatusBar.setBarStyle('light-content')
    }

    componentWillUnmount() {
      AppState.removeEventListener('change', this._handleAppStateChange)
      StatusBar.setHidden(false)
      StatusBar.setBarStyle('light-content')
    }

    _handleAppStateChange = (nextAppState) => {
        PushNotification.setApplicationIconBadgeNumber(0)
    }

    static getNoProcessTapNotificationFlag() {
      return _noProcessTapNotification
    }

    static setNoProcessTapNotificationFlag(boolean) {
      _noProcessTapNotification = boolean
    }

    static getPushFlag() {
      return _pushFlag
    }

    static setPushFlag(pushFlag) {
      return _pushFlag = pushFlag
    }

    static getBadgelist(){
      return _badgelist
    }

    static setBadgelist(badgelist){
      _badgelist = badgelist
    }

    // static getAllIds(){
    //   return _allIds
    // }
    //
    // static setAllIds(ids){
    //   _allIds = ids
    // }

    refreshHomeList(){
      _pushFlag = true
      //Actions.refresh({notificationData: new Date().getTime()})
    }

    clearCompanyBadge(){
      _badgelist.feed = false
    }

    refreshNewerList(){
      //Actions.refresh({tabRefresh:new Date().getTime()})
    }

    refreshCompanyList(){
      //Actions.refresh({tabRefresh:new Date().getTime()})
      this.clearCompanyBadge()
    }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render () {
    return(
      <Router>
          <Scene
            key="root"
            hideNavBar
            >
              <Scene
                key="login"
                initial
                component={LoginScreen}
                title="ログイン"
                panHandlers={null}
              />
              <Scene
                key="setting"　
                component={SettingScreen}
                title="設定"
              />
              <Scene
                key="tabbar"
                tabs={true}
                hideNavBar
                tabBarPosition='bottom'
                swipeEnabled={false}
                activeTintColor={Const.tabbar_active_color}
                inactiveTintColor={Const.tabbar_inactive_color}
                activeBackgroundColor={Const.tabbar_active_backcolor}
                inactiveBackgroundColor={Const.tabbar_inactive_backcolor}
                >
                <Scene
                  key="home"
                  component={HomeScreen}
                  title="ホーム"
                  icon={iconHome}
                  navBar={() => <View />}
                  onEnter={() => this.refreshHomeList()}
                  panHandlers={null}
                />
                <Scene
                  key="newer"
                  component={NewerScreen}
                  title="新着"
                  icon={iconNewer}
                  navBar={() => <View />}
                  onEnter={() => this.refreshNewerList()}
                  panHandlers={null}
                />
                <Scene
                  key="company"
                  component={CompanyScreen}
                  title="フィード"
                  icon={iconCompany}
                  navBar={() => <View />}
                  onEnter={() => this.refreshCompanyList()}
                  panHandlers={null}
                />
                <Scene
                  key="more"
                  component={MoreScreen}
                  title="その他"
                  icon={iconMore}
                  navBar={() => <View />}
                  panHandlers={null}
                />
              </Scene>
              <Scene
                key="chat"　
                component={ChatScreen}
                title="チャット"
              />
              <Scene
                key="groupchat"　
                component={GroupChatScreen}
                title="グループチャット"
              />
              <Scene
                key="community"　
                component={CommunityScreen}
                title="プロジェクト"
              />
              <Scene
                key="room"　
                component={RoomScreen}
                title="ルーム設定"
              />
              <Scene
                key="member"　
                component={MemberScreen}
                title="メンバー選択"
              />
              <Scene
                key="userlist"　
                component={UserListScreen}
                title="ユーザー一覧"
              />
              <Scene
                key="preview"　
                component={PreviewScreen}
                title="イメージ表示"
              />
              <Scene
                key="profile"　
                component={ProfileScreen}
                title="プロフィール"
              />
              <Scene
                key="password"　
                component={PasswordScreen}
                title="パスワード変更"
              />
              <Scene
                key="license"　
                component={LicenseScreen}
                title="ライセンス"
              />
              <Scene key="community_thread" component={CommunityThreadScreen} title="会話を見る" />
              <Scene key="groupchat_thread" component={GroupChatThreadScreen} title="会話を見る" />
              <Scene key="chat_thread" component={ChatThreadScreen} title="会話を見る" />
              <Scene key="company_thread" component={CompanyThreadScreen} title="会話を見る" />
              <Scene key="newer_thread" component={NewerThreadScreen} title="会話を見る" />
              <Scene key="community_reply" component={CommunityReplyScreen} title="返信" />
              <Scene key="groupchat_reply" component={GroupChatReplyScreen} title="返信" />
              <Scene key="chat_reply" component={ChatReplyScreen} title="返信" />
              <Scene key="company_reply" component={CompanyReplyScreen} title="返信" />
              <Scene key="newer_reply" component={NewerReplyScreen} title="返信" />
          </Scene>
      </Router>
    )
  }
}

/**
  * アプリケーションメインスタイルシート
  * @return 無し
  * @author CRAFT
  * @since 1.0
  */

const iconNewer = () => (
    <Icon color={Const.tabbar_iconcolor} name='bell' size={25}/>
)

const iconMore = () => (
    <Icon color={Const.tabbar_iconcolor} name='bars' size={25} />
)

class iconHome extends Component {
  constructor() {
      super()
      this.state = {
        badgeUpdateTime: 0,
      }
      tabHomeThis = this
  }
  render() {
    if (_badgelist.chat.length === 0 && _badgelist.group.length === 0 && _badgelist.community.length === 0){
      return (
        <View style={{flex:1, flexDirection:'column', alignItems:'center', alignSelf:'center', justifyContent: 'center'}}>
          <Icon color={Const.tabbar_iconcolor} name='home' size={25} />
        </View>
      )
    }else{
      return (
        <View style={{flex:1, flexDirection:'column', alignItems:'center', alignSelf:'center', justifyContent: 'center'}}>
          <Icon color={Const.tabbar_iconcolor} name='home' size={25} />
          <View style={styles.tabBadge} />
        </View>
      )
    }
  }
}

class iconCompany extends Component {
  constructor() {
      super()
      this.state = {
        badgeUpdateTime: 0,
      }
      tabCompanyThis = this
  }
  render() {
    if (_badgelist.feed === true){
      return (
        <View style={{flex:1, flexDirection:'column', alignItems:'center', alignSelf:'center', justifyContent: 'center'}}>
          <Icon color={Const.tabbar_iconcolor} name='commenting' size={25}/>
          <View style={styles.tabBadge} />
        </View>
      )
    }else{
      return (
        <View style={{flex:1, flexDirection:'column', alignItems:'center', alignSelf:'center', justifyContent: 'center'}}>
          <Icon color={Const.tabbar_iconcolor} name='commenting' size={25}/>
        </View>
      )
    }
  }
}

const styles = StyleSheet.create({
  tabBadge: {
    width: 16,
    height: 16,
    borderRadius: 16/2,
    backgroundColor: '#e14b67',
    position: 'absolute', top: 5, left: 0,
  },
})
