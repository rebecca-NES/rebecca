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
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native'
import {
  Header,
  FormLabel,
  FormInput,
  Avatar,
} from 'react-native-elements'
import Icon from 'react-native-vector-icons/FontAwesome'

import ImagePicker from　'react-native-image-picker'
import {
    Actions,
} from 'react-native-router-flux'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import Validation from '../Common/Validation'

const _ScreenName = "プロフィール画面"

/**
  * プロフィール画面処理
  * <pre>
  * プロフィール画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class ProfileScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {
      super()
      this.state = {
        nickname: '',
        memo: '',
        email: '',
        avatarType: '',
        avatarData: '',
        imageData: '',
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

    try {
      var login = CubeeAPI.getLoginInfo()
      var userinfo = await CubeeAPI.fetchUserInfo(login.userInfo.jid)
    }
    catch (e) {
      Alert.alert("プロフィール情報の取得に失敗しました", e)
      return
    }

    await this.setState({
      nickname: Common.urldecode(login.userInfo.nickName),
      memo: Common.urldecode(userinfo.items[0].myMemo),
      email: Common.urldecode(login.userInfo.mailAddress),
      avatarType: userinfo.items[0].avatarType,
      avatarData: userinfo.items[0].avatarData,
    })
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {
    var avatarName = this.state.nickname + " "

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
          centerComponent={{ text: "プロフィール", style: {textAlign:'center', color: Const.profile_forecolor, width:'70%', fontSize:16, fontWeight:'bold', marginBottom:15} }}
          rightComponent={
            <Text
              style={{color: Const.profile_forecolor, padding:10, marginBottom:8, marginRight:4}}
              onPress={() => this._onPressSaveButton()}
            >
              保存
            </Text>
          }
          outerContainerStyles={{backgroundColor: Const.profile_backcolor, borderBottomWidth:0, padding:0}}
        />
          <View style={{ marginTop: Const.headerbar_height }}>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>ニックネーム</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3}} >
              <FormInput
                style={{marginTop: 5, marginBottom:5, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff'}}
                containerStyle={{borderBottomWidth:0, borderTopWidth:0}}
                placeholder="ニックネームを入力"
                value={this.state.nickname}
                onChangeText={(nickname) => this.setState({nickname})}
                maxLength={20}
                keyboardType={'default'}
              />
            </View>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>ひとことメモ</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3}} >
              <FormInput
                style={{marginTop: 5, marginBottom:5, fontSize: Const.textinput_fontsize,
                  height: 100, textAlignVertical: 'top',
                  backgroundColor: '#ffffff'}}
                containerStyle={{borderBottomWidth:0, borderTopWidth:0}}
                placeholder="ひとことメモを入力"
                value={this.state.memo}
                onChangeText={(memo) => this.setState({memo})}
                maxLength={500}
                keyboardType={'default'}
                multiline
              />
            </View>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>メールアドレス</FormLabel>
            <View style={{backgroundColor: '#ffffff', marginTop: 3}} >
              <FormInput
                style={{marginTop: 5, marginBottom:5, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff'}}
                containerStyle={{borderBottomWidth:0, borderTopWidth:0}}
                placeholder="メールアドレスを入力"
                value={this.state.email}
                onChangeText={(email) => this.setState({email})}
                maxLength={256}
                autoCapitalize={'none'}
                keyboardType={'email-address'}
              />
            </View>
            <FormLabel labelStyle={{color:Const.profile_testcolor}}>アバター画像</FormLabel>
            <View style={{marginBottom: 10, flexDirection:'row'}} >
              <View>
                {(() => {
                  if (this.state.imageData) {
                    return (
                      <Avatar
                        medium
                        rounded
                        source={{uri: 'data:image/jpeg;base64,' + this.state.imageData}}
                        containerStyle={{marginTop: 5, marginLeft: 30, marginBottom: 5}}
                      />
                    )
                  }
                  else if (this.state.avatarType === "imagepath") {
                    var uri = Common.addUrlPath(CubeeAPI.getUrl(), this.state.avatarData)
                    return (
                      <Avatar
                        medium
                        rounded
                        source={{uri: uri}}
                        containerStyle={{marginTop: 5, marginLeft: 30, marginBottom: 5}}
                      />
                    )
                  }
                  else {
                    var style = {marginTop: 5, marginLeft: 30, marginBottom: 5}
                    return (
                      Common.avatarCreate(avatarName, "user", "medium", style)
                    )
                  }
                })()}
              </View>
              <View style={{paddingLeft: 50, justifyContent: 'center'}}>
                <Icon name='camera'
                  size={30}
                  onPress={() => this._onCameraBtn()}
                />
                <Text style={{color:Const.profile_testcolor}}>撮影して変更</Text>
              </View>
              <View style={{paddingLeft: 10, justifyContent: 'center'}}>
                <Icon name='photo'
                  size={30}
                  onPress={() => this._onPhotoBtn()}
                />
                <Text style={{color:Const.profile_testcolor}}>アルバムから変更</Text>
              </View>
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
    if(Actions.currentScene === "profile"){
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
    if (!Validation.isProfileName(this.state.nickname)) {
      Alert.alert("プロフィールが保存できません。", "ニックネームを正しく入力してください。")
      return
    }
    if (!Validation.isProfileMemo(this.state.memo)) {
      Alert.alert("プロフィールが保存できません。", "ひとことメモを正しく入力してください。")
      return
    }
    if (!Validation.isEmail(this.state.email, false)) {
      Alert.alert("プロフィールが保存できません。", "メールアドレスを正しく入力してください。")
      return
    }

    try {
      if (this.state.imageData) {
        await this.setState({
          avatarType: "image/jpeg",
          avatarData: this.state.imageData,
        })
      }

      await CubeeAPI.updateUserInfo(this.state.nickname, this.state.email, this.state.avatarType, this.state.avatarData)
      await CubeeAPI.updateUserPresence(this.state.memo)
    }
    catch (e) {
      Alert.alert("プロフィール情報の更新に失敗しました", e)
      return
    }

    Actions.pop()
  }

  /**
    * カメラボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onCameraBtn() {
    // https://github.com/react-community/react-native-image-picker/blob/master/README.md
    let options = {
      cancelButtonTitle: 'キャンセル',
      maxWidth: 400,
      maxHeight: 400,
    }

    // カメラの起動
    ImagePicker.launchCamera(options, (response)  => {
      if (response.didCancel) {
        //Alert.alert("写真の撮影を中止しました。")
      } else if (response.error) {
        Alert.alert("写真の撮影でエラーが発生しました。", response.error)
      } else {
        this.setState({
          imageData: response.data,   // 添付ファイル実態
        })
      }
    })
  }

  /**
    * 写真ボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPhotoBtn() {
    // https://github.com/react-community/react-native-image-picker/blob/master/README.md
    let options = {
      cancelButtonTitle: 'キャンセル',
      maxWidth: 400,
      maxHeight: 400,
    }

    // 画像ライブラリオープン
    ImagePicker.launchImageLibrary(options, (response)  => {
      if (response.didCancel) {
        //Alert.alert("写真の選択を中止しました。")
      } else if (response.error) {
        Alert.alert("写真の選択でエラーが発生しました。", response.error)
      } else {
        this.setState({
          imageData: response.data,   // 添付ファイル実態
        })
      }
    })
  }
}
