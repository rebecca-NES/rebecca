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
} from 'react-native'
import {
  Header,
  Icon,
  FormLabel,
  FormInput,
  ButtonGroup,
  Avatar,
} from 'react-native-elements'
import {
    Actions,
} from 'react-native-router-flux'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import Validation from '../Common/Validation'

const _ScreenName = "ルーム設定画面"

/**
  * ルーム設定画面処理
  * <pre>
  * ルーム設定画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class RoomScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {
      super()
      this.state = {
        roomid: null,
        roomtype: 0,
        roomname: '',
        roomdesc: '',
        roomlogo: '',
        roomuser: [],
      }

      this._onPressRoomType = this._onPressRoomType.bind(this)
  }

  /**
    * コンポーネントマウント直前処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async componentDidMount() {
    Common.saveOperationLog(_ScreenName, "画面表示", "")

    if (this.props.roomid) {
      if (this.props.roomtype === 0) {
        var groupchatInfo = await CubeeAPI.fetchGroupChatInfo(this.props.roomid)

        this.setState(prevState => ({ 
          roomid: prevState.roomid,
          roomtype: prevState.roomtype,
          roomname: Common.urldecode(groupchatInfo.items[0].roomName),
          roomdesc: "",
          roomlogo: "",
          roomuser: [],
        }))
      } else {
        var communityInfo = await CubeeAPI.fetchCommunityInfo(this.props.roomid)

        this.setState(prevState => ({
          roomid: prevState.roomid,
          roomtype: prevState.roomtype,
          roomname: Common.urldecode(communityInfo.items[0].roomName),
          roomdesc: Common.urldecode(communityInfo.items[0].description),
          roomlogo: communityInfo.items[0].logoUrl,
          roomuser: [],
        }))
      }
    } else {
      this.setState({
        roomid: null,
        roomtype: 0,
        roomname: '',
        roomdesc: '',
        roomlogo: '',
        roomuser: [],
      })
    }
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {
    const buttons = ['グループチャット', 'プロジェクト']
    const { roomtype } = this.state

    var roomname = this.state.roomname + ' '

    return (
      <View style={{flex: 1, backgroundColor: Const.basic_backcolor}} >

        <Header
          leftComponent={
            <Text
              style={{color: Const.room_forecolor, padding:10, marginBottom:8, marginLeft:4}}
              onPress={() => this._onPressCancelButton()}
            >
              キャンセル
            </Text>
          }
          centerComponent={{ text: "ルーム設定", style: {textAlign:'center', color: Const.room_forecolor, width:'70%', fontSize:16, fontWeight:'bold', marginBottom:15} }}
          rightComponent={
            <Text
              style={{color: Const.room_forecolor, padding:10, marginBottom:8, marginRight:4}}
              onPress={() => this._onPressSaveButton()}
            >
              保存
            </Text>
          }
          outerContainerStyles={{ backgroundColor: Const.room_backcolor, zIndex: 1, borderBottomWidth:0, padding:0}}
        />

        <ScrollView>
          <View style={{marginTop: Const.headerbar_height}}>

            {(() => {
              if (!this.state.roomid) {
                return (
                  <View style={{marginTop: 20}}>
                    <ButtonGroup
                      onPress={this._onPressRoomType}
                      selectedIndex={roomtype}
                      buttons={buttons}
                      containerStyle={{height: 50}}
                    />
                  </View>
                )
              } else {
                return (
                  <FormLabel>{buttons[this.state.roomtype]}</FormLabel>
                )
              }
            })()}

            {(() => {
              if (this.state.roomlogo) {
                var uri = Common.addUrlPath(CubeeAPI.getUrl(), this.state.roomlogo)
                return (
                  <View style={{marginTop: 20}}>
                    <Avatar
                      medium
                      rounded
                      source={{uri: uri}}
                      containerStyle={{marginLeft: 20}}
                    />
                  </View>
                )
              } else {
                return (
                  <View style={{marginTop: 20}}>
                    <Avatar
                      medium
                      rounded
                      title={roomname.substr(0, 1)}
                      containerStyle={{marginLeft: 20}}
                    />
                  </View>
                )
              }
            })()}

            <View style={{marginTop: 5}}>
              <FormInput
                style={{marginTop: 5, fontSize: Const.textinput_fontsize,
                  height: Const.textinput_height,
                  backgroundColor: '#ffffff', paddingLeft: 12, paddingRight: 12}}
                placeholder="タイトルを入力"
                value={this.state.roomname}
                onChangeText={(roomname) => this.setState({roomname})}
                maxLength={50}
                keyboardType={'default'}
              />
            </View>

            {(() => {
              if (this.state.roomtype === 1) {
                return (
                  <View style={{marginTop: 20, flexDirection: 'row'}}>
                    <View style={{width: '50%'}}>
                      <FormLabel>
                        公開設定
                      </FormLabel>
                    </View>
                    <View style={{width: '50%'}}>
                      <FormLabel style={{alignSelf: 'flex-end'}}>
                        秘密
                      </FormLabel>
                    </View>
                  </View>
                )
              }
            })()}

            {(() => {
              if (this.state.roomtype === 1) {
                return (
                  <View style={{marginTop: 20, flexDirection: 'row'}}>
                    <View style={{width: '50%'}}>
                      <FormLabel>
                        参加タイプ
                      </FormLabel>
                    </View>
                    <View style={{width: '50%'}}>
                      <FormLabel style={{alignSelf: 'flex-end'}}>
                        追加のみ
                      </FormLabel>
                    </View>
                  </View>
                )
              }
            })()}

            {(() => {
              if (this.state.roomtype === 1) {
                return (
                  <View style={{marginTop: 20}}>
                    <FormLabel>
                      説明
                    </FormLabel>
                    <FormInput
                      style={{marginTop: 5, fontSize: Const.textinput_fontsize,
                        height: 100, textAlignVertical: 'top',
                         backgroundColor: '#ffffff', paddingLeft: 12, paddingRight: 12}}
                      placeholder="説明を入力"
                      value={this.state.roomdesc}
                      onChangeText={(roomdesc) => this.setState({roomdesc})}
                      maxLength={7000}
                      keyboardType={'default'}
                      multiline
                    />
                  </View>
                )
              }
            })()}

            {(() => {
              if (!this.state.roomid) {
                return (
                  <View style={{marginTop: 20, flexDirection: 'row'}}>
                    <View style={{width: '50%'}}>
                      <FormLabel>
                        メンバー選択
                      </FormLabel>
                    </View>
                    <View style={{width: '50%'}}>
                      <Icon
                        type='font-awesome'
                        name='plus'
                        size={26}
                        style={{alignSelf: 'flex-end', marginRight: 30}}
                        onPress={() => this._onPressMember() }
                      />
                    </View>
                  </View>
                )
              }
            })()}

          </View>
        </ScrollView>
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

    Actions.pop()
  }

  /**
    * 保存ボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressSaveButton() {
    Common.saveOperationLog(_ScreenName, "保存ボタンタップ", "")

    if (!Validation.isRoomname(this.state.roomname)) {
      Common.saveErrorLog(_ScreenName, "ルーム設定エラー", "タイトルを入力してください。")
      return
    }

    if (!this.state.roomid) {
      if (!Validation.isRoomuser(this.state.roomuser)) {
        Common.saveErrorLog(_ScreenName, "ルーム設定エラー", "メンバーを選択してください。")
        return
      }
    }

    if (this.state.roomtype === 0) {
      if (this.state.roomid) {
        await CubeeAPI.updateGroupChatInfo(
          this.state.roomid,
          Common.urlencode(this.state.roomname)
        )
      } else {
        await CubeeAPI.createGroupChatInfo(
          Common.urlencode(this.state.roomname),
          this.state.roomuser
        )
      }
    } else {
      if (this.state.roomid) {
        await CubeeAPI.updateCommunityInfo(
          this.state.roomid,
          Common.urlencode(this.state.roomname),
          Common.urlencode(this.state.roomdesc),
          this.state.roomlogo
        )
      } else {
        var communityInfo = await CubeeAPI.createCommunityRoom(
          Common.urlencode(this.state.roomname),
          Common.urlencode(this.state.roomdesc),
          this.state.roomlogo
        )

        await CubeeAPI.addMemberCommunity(
          communityInfo.items[0].roomId,
          this.state.roomuser
        )
      }
    }

    Actions.pop()
  }

  /**
    * ルームタイプタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressRoomType (roomtype) {
    Common.saveOperationLog(_ScreenName, "ルームタイプタップ", "")

    this.setState({roomtype})
  }

  /**
    * メンバー変更タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressMember () {
    Common.saveOperationLog(_ScreenName, "メンバー変更タップ", "")

    Actions.member({
      membertype: this.state.roomtype === 0 ? "GroupChat" : "Community",
      roomid: this.state.roomid,
      method: "Select",
      memberlist: this.state.roomuser,
    })
  }
}
