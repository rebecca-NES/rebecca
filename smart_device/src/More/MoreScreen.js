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
  View,
  Text,
  Alert,
  AsyncStorage,
  ScrollView,
} from 'react-native'
// Unused import Avatar.
import {
  Header,
//  Avatar,
} from 'react-native-elements'
import {
    Actions,
} from 'react-native-router-flux'
import { Button } from 'react-native-elements'
import MailCompose from 'react-native-mail-compose'
import DeviceInfo from 'react-native-device-info'
import * as Keychain from 'react-native-keychain'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import Validation from '../Common/Validation'
import RNFetchBlob from 'react-native-fetch-blob'

const _ScreenName = "その他画面"

/**
  * その他画面処理
  * <pre>
  * その他画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class MoreScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {
      super()
  }

  /**
    * コンポーネントマウント直前処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async componentDidMount() {
    Common.saveOperationLog(_ScreenName, "画面表示", "")
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {
    return (
      <View style={{flex: 1, backgroundColor: Const.basic_backcolor_light}} >
        <Header
          centerComponent={{ text: 'その他', style: { color: Const.more_forecolor, fontSize:16, fontWeight:'bold'} }}
          outerContainerStyles={{ backgroundColor: Const.profile_backcolor, zIndex: 1, borderBottomWidth:0}}
        />
        <ScrollView style={{flex: 1}}>
          <View style={{ marginTop: Const.headerbar_height }}>
            <Button
              raised
              icon={{name: 'address-card', type: 'font-awesome', size: 32}}
              buttonStyle={{marginTop: 20, backgroundColor: Const.profile_backcolor, borderRadius: 20, height: 59}}
              containerViewStyle={{backgroundColor: 'transparent'}}
              textStyle={{textAlign: 'center'}}
              title={`プロフィール`}
              onPress={() => this._onPressProfileButton()}
            />

            <Button
              raised
              icon={{name: 'key-change', type: 'material-community', size: 32}}
              buttonStyle={{marginTop: 20, backgroundColor: Const.profile_backcolor, borderRadius: 20}}
              containerViewStyle={{backgroundColor: 'transparent'}}
              textStyle={{textAlign: 'center'}}
              title={`パスワード変更`}
              onPress={() => this._onPressPasswordButton()}
            />
  {/*
            <Button
              raised
              icon={{name: 'folder', type: 'material-community',size: 32}}
              buttonStyle={{marginTop: 20, backgroundColor: Const.profile_backcolor, borderRadius: 20}}
              containerViewStyle={{backgroundColor: 'transparent'}}
              textStyle={{textAlign: 'center'}}
              title={`インボックス`}
            />
  */}
            <Button
              raised
              icon={{name: 'file-send', type: 'material-community',size: 32}}
              buttonStyle={{marginTop: 20, backgroundColor: Const.profile_backcolor, borderRadius: 20}}
              containerViewStyle={{backgroundColor: 'transparent'}}
              textStyle={{textAlign: 'center'}}
              title={`操作ログ送付`}
              onPress={() => this._onPressSendLogButton()}
              disabled={Common.getIsLogging() !== true}
            />

            <Button
              raised
              icon={{name: 'exit-to-app', type: 'material-community',size: 32}}
              buttonStyle={{marginTop: 20, backgroundColor: Const.profile_backcolor, borderRadius: 20}}
              containerViewStyle={{backgroundColor: 'transparent'}}
              textStyle={{textAlign: 'center'}}
              title={`ログアウト`}
              onPress={() => this._onPressLogoutButton()}
            />
          </View>
        </ScrollView>
        <View style={{padding: 8, alignItems: 'flex-end'}}>
          <View style={{flexDirection: 'row'}}>
            <Text style={{color: 'rgba(0, 0, 0, 0.8)', marginTop: 1,
                          paddingRight: 8, textDecorationLine: 'underline'}}
                  onPress={() => this._onPressLicenseButton()}>
               著作権情報
            </Text>
            <Text style={{color: 'rgba(0, 0, 0, 0.8)'}}>
               {DeviceInfo.getVersion()}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  /**
    * プロフィールボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressProfileButton() {
    Common.saveOperationLog(_ScreenName, "プロフィールボタンタップ", "")

    Actions.profile()
  }

  /**
    * パスワード変更ボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressPasswordButton() {
    Common.saveOperationLog(_ScreenName, "パスワード変更ボタンタップ", "")

    Actions.password()
  }

  /**
    * 操作ログ送付ボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressSendLogButton() {
    Common.saveOperationLog(_ScreenName, "操作ログ送付ボタンタップ", "")

    if (!Common.getIsLogging()) {
      Common.saveErrorLog(_ScreenName,
        "操作ログ送付",
        "操作ログが記録されていません。"
      )
      return
    }

    var mailto = await AsyncStorage.getItem("cubeemail")
    if (!Validation.isEmail(mailto)) {
      Common.saveErrorLog(
        _ScreenName,
        "問い合わせメールアドレスが設定されていません。",
        "ログ送付先である問い合わせメールアドレスの設定を行ってください。")
      return
    }

    Alert.alert(
      '操作ログ送付',
      '操作ログを送付するためにメーラーを起動します。',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => this._sendLog()},
      ],
      { cancelable: false }
    )
  }

  /**
    * ログ送付
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _sendLog() {

    var log = {}
    log.deviceInfo = await Common.getDevInfo()
    log.operationLog = Common.getOperationLog()
    var textlog = JSON.stringify(log)

    var CryptoJS = require("crypto-js")
    var password = CubeeAPI.getUserJid().slice(-12)
    var encodelog = CryptoJS.AES.encrypt(textlog, password).toString()
    var mailto = await AsyncStorage.getItem("cubeemail")
    const credentials = await Keychain.getGenericPassword();
    var account = credentials.username;
    //var account = await AsyncStorage.getItem("account")
    var mailtitle = '[Social Platform For Enterprise]操作ログの送付'
    var mailbody = ''
    mailbody += '操作ログを送付します。<br>'
    mailbody += '※ルーム名やメッセージ内容等の情報はマスクされています。<br>'
    mailbody += '<br>'
    mailbody += 'ユーザID：' + account + '<br>'
    mailbody += '<br>'
    mailbody += '以上'
//    mailbody += '<br>'
//    mailbody += '<br>パスワード「' + password + '」'
//    mailbody += '<br>復号化「openssl aes-256-cbc -d -base64 -A -in operation.txt」'

    try {
      await MailCompose.send({
        toRecipients: [mailto],
        subject: mailtitle,
        html: mailbody,
        attachments: [{
          filename: 'operation',
          ext: '.txt',
          mimeType: 'text/plain',
          text: encodelog,
        }],
      })
    } catch (e) {
      Common.saveErrorLog(_ScreenName,
        "メール送信失敗",
        "メール設定ができていないか、送信をキャンセルしました。"
      )
    }
  }

  /**
    * ログアウトボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressLogoutButton() {
    Common.saveOperationLog(_ScreenName, "ログアウトボタンタップ", "")

    Alert.alert(
      'ログアウト',
      'ログアウトを実行しますか？',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => this._Logout()},
      ],
      { cancelable: false }
    )
  }

  /**
    * ログアウト処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _Logout() {

    // ログアウト実行
    try {
      await CubeeAPI.execLogout()
      Common.clearLog()
    } catch (e) {
    }

    // キャッシュデータの削除
    try {
      await RNFetchBlob.session("download").dispose()
    }catch (e) {
    }

    AsyncStorage.setItem("autologin", "")
    AsyncStorage.setItem('open_contactlist', "false")
    AsyncStorage.setItem('open_groupchat', "false")
    AsyncStorage.setItem('open_community', "false")
    Actions.reset("login")
  }

  _onPressLicenseButton() {
    Common.saveOperationLog(_ScreenName, "ライセンス表示ボタンタップ", "")

    Actions.license()
  }
}
