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
  ListView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import {
    Actions,
} from 'react-native-router-flux'
import {
  Avatar,
  Header,
  Icon,
  CheckBox,
  Button,
  ButtonGroup,
} from 'react-native-elements'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'

const _ScreenName = "ユーザー一覧画画面"

/**
  * ユーザー一覧画面処理
  * <pre>
  * ユーザー一覧画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class UserListScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {
      super()
      this.state = {
        usertype: null,
        roomid: null,
        loaded: false,
        items: new ListView.DataSource({
          rowHasChanged: (row1, row2) => row1 !== row2,
        }),
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

    await this.setState({
      usertype: this.props.usertype,
      roomid: this.props.roomid,
    })

    this._fetchUserList()
  }

  /**
    * ユーザーリスト読み込み処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _fetchUserList() {
    var fetchlist = {}
    try {
      if (this.state.usertype === 0) {
        fetchlist = await CubeeAPI.fetchKidokuList(this.state.roomid)
      } else {
        fetchlist = await CubeeAPI.fetchGoodJobList(this.state.roomid)
      }
    }
    catch (e) {
      Common.saveErrorLog(_ScreenName, "ユーザー一覧の取得に失敗しました", e)
      this.setState({loaded: true})
      return
    }

    fetchlist.items.sort(function(a,b){
        if(a.userName < b.userName) return -1
        if(a.userName > b.userName) return 1
        return 0
    })

    this.setState({
      items: this.state.items.cloneWithRows(fetchlist.items),
      loaded: true,
    })
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {

    var listname = (this.state.usertype === 0) ? "既読者一覧" : "いいねユーザー"

    return (
      <View style={{flex: 1, backgroundColor: Const.basic_backcolor_light}} >
        <Header
          leftComponent={
            <Text
              style={{color: Const.userlist_forecolor, padding:10, marginBottom:8, marginLeft:4}}
              onPress={() => this._onPressCancelButton()}
            >
              完了
            </Text>
          }
          centerComponent={{ text: listname, style: {textAlign:'center', color: Const.userlist_forecolor, width:'70%', fontSize:16, fontWeight:'bold', marginBottom:15} }}
          rightComponent={
            <Text style={{padding:10, marginBottom:8, marginRight:4}}>　　</Text>
          }
          outerContainerStyles={{backgroundColor: Const.userList_backcolor, zIndex: 1, borderBottomWidth:0, padding:0}}
        />

        <ScrollView>
          <View style={{marginTop: Const.headerbar_height}}>
            {(() => {
              if (this.state.loaded) {
                return (
                  <ListView
                    dataSource={this.state.items}
                    renderRow={this._renderUserList.bind(this)}
                    enableEmptySections={true}
                    removeClippedSubviews={false}
                  />
                )
              } else {
                return (
                  <View style={{marginTop: 20, justifyContent: 'center'}}>
                    <ActivityIndicator size="large" color={Const.activity_indicator_color} />
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
    * 新着リスト画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _renderUserList(item, sectionID, rowID) {

    var username = (this.state.usertype === 0) ? item.account : item.userName

    return (
      <View>
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
          backgroundColor: Const.userlist_msgbackcolor}}>
          {(() => {
            if (item.avatarType === 'imagepath') {
              var uri = Common.addUrlPath(CubeeAPI.getUrl(), item.avatarData)
              return (
                <Avatar
                  medium
                  rounded
                  source={{uri: uri}}
                  containerStyle={{
                    marginTop: 10,
                    marginLeft: 10,
                    marginBottom: 10,
                  }}
                />
              )
            } else {
              var style = {
                marginTop: 10,
                marginLeft: 10,
                marginBottom: 10,
              };
              return (
                Common.avatarCreate(Common.urldecode(item.nickName), "user", "medium", style)
              )
            }
          })()}
          <View style={{flex: 1}}>
            <Text
              style={{marginTop: 4, marginLeft: 10, fontWeight: 'bold',
              color: Const.userlist_msgforecolor}}
              numberOfLines={1}
            >
              {Common.urldecode(item.nickName)} (@{username})
            </Text>
          </View>
        </View>
        <View style={{
          height: 1,
          backgroundColor: '#DDDDDD',
        }}/>
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
    if(Actions.currentScene === "userlist"){
      Actions.pop()
    }
  }
}
