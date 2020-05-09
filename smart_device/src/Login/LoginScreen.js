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
  Dimensions,
  Platform,
  View,
  Text,
  Image,
  ImageBackground,
  Alert,
  AsyncStorage,
} from 'react-native'
import {
  FormInput,
  Button,
  Icon,
} from 'react-native-elements'
import {
  Actions,
} from 'react-native-router-flux'
import MailCompose from 'react-native-mail-compose'
import DeviceInfo from 'react-native-device-info'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import * as Keychain from 'react-native-keychain'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import Validation from '../Common/Validation'
import App from '../Application/App'

const _ScreenName = "ログイン画面処理"

/**
  * ログイン画面処理
  * <pre>
  * ログイン画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class LoginDisplay extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */

  constructor() {

    super()

    this.state = {
      cubeeurl: '',
      tenant: '',
      account: '',
      password: '',
      cubeemail: '',
      vw: Dimensions.get('window').width/100,
      vh: Dimensions.get('window').height/100,
      textSize: Dimensions.get('window').width/100,
    }

    this.onLayout = this.onLayout.bind(this)

    AsyncStorage.getItem("cubeeurl").then((value) => {
        this.setState({"cubeeurl": value})
    }).done()
    AsyncStorage.getItem("tenant").then((value) => {
        this.setState({"tenant": value})
    }).done()

    AsyncStorage.getItem("autologin").then((value) => {
      if (value != "autologin"){
        Keychain.resetGenericPassword();
        this.setState({"account": ''});
      } else {
        Keychain.getGenericPassword().then((credentials) => {
          this.setState({"account": credentials.username ? credentials.username : ''});
        });
      }
    })

    //AsyncStorage.getItem("password").then((value) => {
        //this.setState({"password": value})
    //}).done()
    AsyncStorage.getItem("cubeemail").then((value) => {
        this.setState({"cubeemail": value})
    }).done()
  }

  // レイアウト変更時、vwとvhの値を更新
  onLayout(e) {
    this.setState({
      vw: Dimensions.get('window').width/100,
      vh: Dimensions.get('window').height/100,
    })
    // textサイズはwidthとheightの値が小さい方に合わせる
    if(this.state.vw >= this.state.vh) {
      this.setState(prevState => ({
        textSize: prevState.vh
      }))
    }else{
      this.setState(prevState => ({
        textSize: prevState.vw
      }))
    }
  }

  /**
    * コンポーネントマウント直前処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async componentDidMount() {
    Common.saveOperationLog(_ScreenName, "画面表示", "")

    var autologin = await AsyncStorage.getItem("autologin")
    if (autologin != "autologin") {
      return
    }

    var cubeeurl = await AsyncStorage.getItem("cubeeurl")
    var tenant = await AsyncStorage.getItem("tenant")

    const credentials = await Keychain.getGenericPassword();

    var account = credentials.username ? credentials.username : '';
    var password = credentials.password ? credentials.password : '';

    if (!cubeeurl || !tenant) {
      Common.saveErrorLog(_ScreenName, "ログインに失敗しました",
        "設定画面から接続先URL、テナント情報を入力してください")
      return
    }

    CubeeAPI.setUrl(cubeeurl, tenant)
    CubeeAPI.setAccount(account, password)

    try {
      await CubeeAPI.execLogin()
    } catch (e) {
      Common.saveErrorLog(_ScreenName, "ログインに失敗しました", e)
      return
    }

    // アプリのプロセスが存在しない時に通知をタップした場合
    // ホーム画面には遷移せずに新着画面へと遷移する
    // androidのみ、通知センター上の通知を全て削除する
    if (App.getNoProcessTapNotificationFlag()) {
      if (Platform.OS === 'android'){
        var PushNotification = require('react-native-push-notification')
        PushNotification.cancelAllLocalNotifications()
      }
      Actions.newer()
      App.setNoProcessTapNotificationFlag(false)
    } else {
      Actions.tabbar()
    }
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {
    return (
      <View
        onLayout = {this.onLayout}
        style={{flex: 1, backgroundColor: Const.basic_backcolor}} >
        <ImageBackground
          //imageStyle={{resizeMode:'stretch'}}
          style={{flex: 1}}
          source={require('../Images/login_bg.png')} >

          <KeyboardAwareScrollView>
            <View style={{alignItems: 'flex-end', paddingTop: 4 * this.state.vh, paddingRight: 10}}>
              <Icon
                name='settings'
                color='#ffffff'
                size={40}
                onPress={() => this._onPressSettingButton()} />
            </View>

            <View style={{flex: 1, alignItems: 'center', height: 96 * this.state.vh}}>
              <View style={{
                top: 6 * this.state.vh
              }}>
                <Text style={{
                  fontFamily:'Genome-Thin',
                  backgroundColor: 'rgba(0,0,0,0)',
                  color: '#ffffff',
                  fontSize: Const.textinput_fontsize / 1.8 * this.state.textSize,
                  textAlignVertical: "center",
                  textAlign: "center",
                }}
                allowFontScaling={false}>
                Social Platform for{"\n"}the enterprise
                </Text>
              </View>

              <View style={{
                // 画面縦サイズの15％の位置へ配置
                top: 14 * this.state.vh,
                // 画面横の5％パディング
                paddingRight: 5 * this.state.vw,
                paddingLeft: 5 * this.state.vw,
              }}>
                <FormInput style={
                  [
                    styles.contentBody__textInput,
                    {
                      // テキストボックスの間のマージン 画面縦サイズの2%
                      marginTop: 2 * this.state.vh,
                      fontSize: Const.textinput_fontsize / 4 * this.state.textSize,
                      // テキストボックスのサイズ　画面縦サイズの8%
                      height: 8 * this.state.vh,
                      minHeight: 40,
                      // テキストボックス内におけるテキストのパディング設定　画面サイズの5%
                      paddingLeft: 5 * this.state.vw,
                      paddingRight: 5 * this.state.vw,
                    }
                  ]}
                  value={this.state.account}
                  onChangeText={(account) => this.setState({account})}
                  placeholder='アカウント名'
                  maxLength={252}
                  autoCapitalize={'none'}
                  keyboardType={'ascii-capable'}
                  containerStyle={{borderBottomWidth: 0}}
                  underlineColorAndroid={'rgba(255, 255, 255, 0.1)'}
                />

                <FormInput
                  style={
                    [
                      styles.contentBody__textInput,
                      {
                        // テキストボックスの間のマージン 画面縦サイズの3%
                        marginTop: 2 * this.state.vh,
                        fontSize: Const.textinput_fontsize / 4 * this.state.textSize,
                        // テキストボックスのサイズ　画面縦サイズの8%
                        height: 8 * this.state.vh,
                        minHeight: 40,
                        // テキストボックス内におけるテキストのパディング設定　画面サイズの5%
                        paddingLeft: 5 * this.state.vw,
                        paddingRight: 5 * this.state.vw,
                      }
                    ]}
                  value={this.state.password}
                  onChangeText={(password) => this.setState({password})}
                  placeholder='パスワード'
                  maxLength={32}
                  secureTextEntry={true}
                  keyboardType={'ascii-capable'}
                  containerStyle={{borderBottomWidth: 0}}
                  underlineColorAndroid={'rgba(255, 255, 255, 0.1)'}
                />

                <View style={{
                  // テキストボックスとログインボタンの間　画面の8%
                  paddingTop: 6 * this.state.vh
                }}>
                  <Button
                    buttonStyle={[styles.contentBody__loginButton,
                      {
                        height: 8 * this.state.vh,
                      }
                    ]}
                    textStyle={[styles.contentBody__loginButtonText,
                      {
                        fontSize: Const.textinput_fontsize / 4 * this.state.textSize
                      }
                    ]}
                    containerViewStyle={{marginLeft: 20, marginRight: 20}}
                    title='ログイン'
                    onPress={() => this._onPressLoginButton()}
                  />
                </View>

                <Text
                  style={[styles.contentBody__linkToMail,
                      {
                        fontSize: Const.textinput_fontsize / 4 * this.state.textSize
                      }
                  ]}
                  onPress={() => this._onPressForgetText()}
                >
                  ログイン情報を忘れてしまった場合
                </Text>

              </View>
            </View>
          </KeyboardAwareScrollView>
          <View style={styles.version}>
            <Text style={
              {
                fontSize: Const.textinput_fontsize / 4 * this.state.textSize
              }}>
              {DeviceInfo.getVersion()}
            </Text>
          </View>
        </ImageBackground>
      </View>
    )
  }

  /**
    * ログインボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressLoginButton() {
    Common.saveOperationLog(_ScreenName, "ログインボタンタップ", "")

    if (!Validation.isAccount(this.state.account)) {
      Common.saveErrorLog(_ScreenName,
        "ログインに失敗しました",
        "アカウント名またはパスワードを入力してください。")
      return
    }
    if (!Validation.isPassword(this.state.password)) {
      Common.saveErrorLog(_ScreenName,
        "ログインに失敗しました",
        "アカウント名またはパスワードを入力してください。")
      return
    }

    CubeeAPI.setUrl(this.state.cubeeurl, this.state.tenant)
    CubeeAPI.setAccount(this.state.account, this.state.password)

    // url, tenant情報が設定されていない場合
    if (!this.state.cubeeurl || !this.state.tenant) {
      Common.saveErrorLog(_ScreenName, "ログインに失敗しました",
        "設定画面から接続先URL、テナント情報を入力してください")
      return
    }

    try {
      await CubeeAPI.execLogin()
    } catch (e) {
      Common.saveErrorLog(_ScreenName, "ログインに失敗しました", e)
      return
    }

    Keychain.setGenericPassword(this.state.account, this.state.password);
    AsyncStorage.setItem('autologin', "autologin")
    Actions.tabbar()
  }

  /**
    * アプリ設定ボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressSettingButton() {
    Common.saveOperationLog(_ScreenName, "アプリ設定ボタンタップ", "")

    Actions.setting()
  }

  /**
    * ログイン忘れボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressForgetText() {
    Common.saveOperationLog(_ScreenName, "ログイン忘れボタンタップ", "")

    var mailTitle = '[Social Platform For Enterprise]アカウント情報の確認/再設定依頼'
    var mailBody = ''
    mailBody += 'アカウント情報を忘れたため、ログインすることができません。<br>'
    mailBody += '確認をお願いします。<br>'
    mailBody += '<br>'
    mailBody += '※以下の中から今の状態を残して送信してください。※<br>'
    mailBody += '　・テナント名を忘れた<br>'
    mailBody += '　・アカウント名を忘れた<br>'
    mailBody += '　・パスワードを忘れた<br>'
    mailBody += '<br>'
    mailBody += '以上'

    if (!Validation.isEmail(this.state.cubeemail)) {
      Common.saveErrorLog(
        _ScreenName,
        "問い合わせメールアドレスが設定されていません。",
        "メール送付先である問い合わせメールアドレスの設定を行ってください。")
      return
    }

    try {
      await MailCompose.send({
        toRecipients: [this.state.cubeemail],
        subject: mailTitle,
        html: mailBody,
      })
    } catch (e) {
      console.log(e)
      Common.saveErrorLog(_ScreenName,
        "メール送信失敗",
        "メール設定ができていないか、送信をキャンセルしました。"
      )
    }
  }
}

const styles = {
  contentBody__linkToMail: {
    marginTop: 20,
    textAlign: 'center',
    backgroundColor:'transparent',
    color: '#FFF',
    fontWeight: "bold",
    textDecorationLine: 'underline',
    textDecorationColor: '#FFF',
  },
  contentBody__textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    color: 'rgb(134, 136, 139)',
    borderRadius: 3
  },
  // ログインボタン設定
  contentBody__loginButton: {
    backgroundColor: 'rgb(31, 122, 190)',
    borderRadius: 3
  },
  // ログインボタンのテキスト表示設定
  contentBody__loginButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  version: {
    alignItems: "flex-end",
    backgroundColor: 'transparent',
    position: 'absolute',
    padding: 10,
    bottom: 0,
    right: 0,
  }
}
