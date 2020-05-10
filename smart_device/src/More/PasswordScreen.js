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
// Unused import Alert.
import {
  View,
  Text,
//  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native'
import {
  Header,
  FormLabel,
  FormInput,
} from 'react-native-elements'
import {
    Actions,
} from 'react-native-router-flux'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import Validation from '../Common/Validation'

const _ScreenName = "パスワード変更画面"

/**
  * パスワード変更画面処理
  * <pre>
  * パスワード変更画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class PasswordScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {
      super()
      this.state = {
        password: '',
        newpassword1: '',
        newpassword2: '',
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
            centerComponent={{ text: "パスワード変更", style: {textAlign:'center', color: Const.profile_forecolor, width:'65%', fontSize:16, fontWeight:'bold', marginBottom:15} }}
            rightComponent={
              <Text
                style={{color: Const.profile_forecolor, padding:10, marginBottom:8, marginRight:4}}
                onPress={() => this._onPressSaveButton()}
              >
                完了
              </Text>
            }
            outerContainerStyles={{backgroundColor: Const.profile_backcolor, zIndex: 1, borderBottomWidth:0, padding:0}}
          />
          <View style={{ marginTop: Const.headerbar_height }}>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>現在のパスワード</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3}} >
              <FormInput
                style={{marginTop: 5, marginBottom:5, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff'}}
                containerStyle={{borderBottomWidth:0, borderTopWidth:0}}
                placeholder="現在のパスワードを入力"
                value={this.state.password}
                onChangeText={(password) => this.setState({password})}
                maxLength={32}
                secureTextEntry={true}
                keyboardType={'ascii-capable'}
              />
            </View>
            <FormLabel
              containerStyle={{marginBottom: 40}}
              labelStyle={{fontSize: 10, color:Const.profile_testcolor}}>
              ※パスワードは8桁以上32桁以下で入力してください
              </FormLabel>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>新しいパスワード</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3}} >
              <FormInput
                style={{marginTop: 5, marginBottom:5, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff'}}
                containerStyle={{borderBottomWidth:0, borderTopWidth:0}}
                placeholder="新しいパスワードを入力"
                value={this.state.newpassword1}
                onChangeText={(newpassword1) => this.setState({newpassword1})}
                maxLength={32}
                secureTextEntry={true}
                keyboardType={'ascii-capable'}
              />
            </View>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>新しいパスワード（再入力）</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3, marginBottom:10}} >
              <FormInput
                style={{marginTop: 5, marginBottom:5, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff'}}
                containerStyle={{borderBottomWidth:0, borderTopWidth:0}}
                placeholder="確認のための新しいパスワードを入力"
                value={this.state.newpassword2}
                onChangeText={(newpassword2) => this.setState({newpassword2})}
                maxLength={32}
                secureTextEntry={true}
                keyboardType={'ascii-capable'}
              />
            </View>
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
    if(Actions.currentScene === "password"){
      Actions.pop()
    }
  }

  /**
    * 保存ボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressSaveButton() {
    Common.saveOperationLog(_ScreenName, "保存ボタンタップ", "")

    if (!Validation.isPassword(this.state.password)) {
      Common.saveErrorLog(
        _ScreenName,
        "パスワード変更ができません。",
        "現在のパスワードを正しく入力してください。")
      return
    }
    if (!Validation.isNewPassword(this.state.newpassword1, this.state.newpassword2)) {
      Common.saveErrorLog(
        _ScreenName,
        "パスワード変更ができません。",
        "新しいパスワードを正しく入力してください。")
      return
    }

    try {
      await CubeeAPI.updatepassword(this.state.password, this.state.newpassword1)
    }
    catch (e) {
      Common.saveErrorLog(
        _ScreenName, "パスワードの変更に失敗しました", e)
      return
    }

    Actions.pop()
  }
}
