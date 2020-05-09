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
  KeyboardAvoidingView,
} from 'react-native'
import {
  Header,
  FormLabel,
  FormInput,
  CheckBox,
} from 'react-native-elements'
import {
    Actions,
} from 'react-native-router-flux'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import Validation from '../Common/Validation'

const _ScreenName = "アプリ設定画面"

/**
  * アプリ設定画面処理
  * <pre>
  * アプリ設定画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class SettingScreen extends Component<{}> {

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
        cubeemail: '',
        isLogging: false,
      }

      AsyncStorage.getItem("cubeeurl").then((value) => {
          this.setState({"cubeeurl": value})
      }).done()
      AsyncStorage.getItem("tenant").then((value) => {
          this.setState({"tenant": value})
      }).done()
      AsyncStorage.getItem("cubeemail").then((value) => {
          this.setState({"cubeemail": value})
      }).done()
      AsyncStorage.getItem("isLogging").then((value) => {
          this.setState({"isLogging": value === "true"})
      }).done()
/*
      this.state = {
        cubeeurl: 'https://spf-trial01.nec-solutioninnovators.com/cubee/',
        tenant: 'craft',
        cubeemail: 'kaneki@craft3.com',
        isLogging: false,
      }
*/
/*
      this.state = {
        cubeeurl: 'http://133.208.22.181/cubee/',
        tenant: '###',
        cubeemail: 'kaneki@craft3.com',
        isLogging: false,
      }
*/
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
        <ScrollView style={{flex: 1}}>
          <Header
            leftComponent={
              <Text
                style={{color: Const.profile_forecolor, padding:10, marginBottom:8, marginLeft:4}}
                onPress={() => this._onPressCancelButton()}
              >
                取消
              </Text>
            }
            centerComponent={{ text: "アプリ設定", style: {textAlign:'center', color: Const.profile_forecolor, width:'70%', fontSize:16, fontWeight:'bold', marginBottom:15} }}
            rightComponent={
              <Text
                style={{color: Const.profile_forecolor, padding:10, marginBottom:8, marginRight:4}}
                onPress={() => this._onPressSaveButton()}
              >
                保存
              </Text>
            }
            outerContainerStyles={{backgroundColor: Const.profile_backcolor, zIndex: 1, borderBottomWidth:0, padding:0}}
          />
          <View style={{ marginTop: Const.headerbar_height }}>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>接続先URL</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3}} >
              <FormInput
                style={{marginTop: 10, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff', paddingLeft: 12, paddingRight: 12}}
                placeholder="接続先URLを入力"
                value={this.state.cubeeurl}
                onChangeText={(cubeeurl) => this.setState({cubeeurl})}
                maxLength={100}
                keyboardType={'url'}
              />
            </View>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>テナント名</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3}} >
              <FormInput
                style={{marginTop: 10, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff', paddingLeft: 12, paddingRight: 12}}
                placeholder="テナント名を入力"
                value={this.state.tenant}
                onChangeText={(tenant) => this.setState({tenant})}
                maxLength={256}
                autoCapitalize={'none'}
              />
            </View>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>問い合わせメールアドレス</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3}} >
              <FormInput
                style={{marginTop: 10, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff', paddingLeft: 12, paddingRight: 12}}
                placeholder="問い合わせメールアドレスを入力"
                value={this.state.cubeemail}
                onChangeText={(cubeemail) => this.setState({cubeemail})}
                maxLength={256}
                autoCapitalize={'none'}
                keyboardType={'email-address'}
              />
            </View>
            <CheckBox
              title='操作ログを取得する'
              checked={this.state.isLogging}
              style={{marginTop: 20, marginLeft: 20, backgroundColor: Const.basic_backcolor_light}}
              textStyle={{color:Const.profile_testcolor}}
              onPress={() => this._onPressLogging()}
              uncheckedColor={'black'}
              checkedColor={'black'}
            />
          </View>
        </ScrollView>
        <KeyboardAvoidingView behavior="padding" />
      </View>
    )
  }

  /**
    * キャンセルボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressCancelButton() {
    Common.saveOperationLog(_ScreenName, "キャンセルボタンタップ", "")

    Actions.login()
  }

  /**
    * 保存ボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressSaveButton() {
    Common.saveOperationLog(_ScreenName, "保存ボタンタップ", "")

    if (!Validation.isCubeeurl(this.state.cubeeurl)) {
      Common.saveErrorLog(
        _ScreenName,
        "設定が保存できません。",
        "接続先URLを正しく入力してください。")
      return
    }
    /*
    旧アプリの仕様にあわせ、テナント名は空白を許容する。
    空白の場合はｖ４のエンドポイントで動作する
    
    if (!Validation.isTenant(this.state.tenant)) {
      Common.saveErrorLog(
        _ScreenName,
        "設定が保存できません。",
        "テナント名を正しく入力してください。")
      return
    }
    */
    if (!Validation.isEmail(this.state.cubeemail, false)) {
      Common.saveErrorLog(
        _ScreenName,
        "設定が保存できません。",
        "問い合わせメールアドレスを正しく入力してください。")
      return
    }

    AsyncStorage.setItem('cubeeurl', this.state.cubeeurl)
    if (this.state.tenant === null) {
      AsyncStorage.setItem('tenant', '')
    } else {
      AsyncStorage.setItem('tenant', this.state.tenant)
    }
    if (this.state.cubeemail === null) {
      AsyncStorage.setItem('cubeemail', '')
    } else {
      AsyncStorage.setItem('cubeemail', this.state.cubeemail)
    }
    AsyncStorage.setItem('isLogging', this.state.isLogging ? "true" : "false")

    CubeeAPI.setUrl(this.state.cubeeurl, this.state.tenant)
    Common.setIsLogging(this.state.isLogging)

    Actions.login()
  }

  /**
    * 操作ログ保存チェックボックス処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressLogging() {

    this.setState(prevState => ({
      isLogging: !prevState.isLogging
    }))
  }
}
