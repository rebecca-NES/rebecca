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
} from 'react-native'
import {
    Actions,
} from 'react-native-router-flux'
import {
  Header,
  SearchBar,
  Avatar,
  Icon,
  CheckBox,
  Button,
} from 'react-native-elements'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import Validation from '../Common/Validation'

var _datasource
var _memberlist = []
var _displaylist = []

const _ScreenName = "メンバー設定"

/**
  * メンバー設定処理
  * <pre>
  * メンバー設定の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class MemberScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {

      super()

      _datasource = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2})

      this.state = {
        filter_text: '',
        datasource: _datasource,
        membertype: 0,    // 0:グループチャット, 1:プロジェクト, 2:その他
        roomid: null,
        method: "Select",
        memberlist: [],
        regmember: [],
        buttonTap: false,
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

    if (this.props.method === "Add" && this.props.roomid) {  // 追加
      if (this.props.membertype === 0) {
        var info = await CubeeAPI.fetchGroupChatInfo(this.props.roomid)

        await this.setState(prevState => ({
          membertype: prevState.membertype,
          roomid: prevState.roomid,
          method: prevState.method,
          memberlist: [],
          regmember: info.items[0].memberItems,
        }))
      } else if (this.props.membertype === 1) {
        var info = await CubeeAPI.fetchCommunityMember(this.props.roomid)
        var user = []

        for (var owner in info.items[0].memberItems.ownerItems) {
          user.push(info.items[0].memberItems.ownerItems[owner].jid)
        }
        for (var item in info.items[0].memberItems.generalMemberItems) {
          user.push(info.items[0].memberItems.generalMemberItems[item].jid)
        }

        await this.setState(prevState => ({　
          membertype: prevState.membertype,
          roomid: prevState.roomid,
          method: prevState.method,
          memberlist: [],
          regmember: user,
        }))
      } else {
        await this.setState(prevState => ({
          membertype: prevState.membertype,
          roomid: prevState.roomid,
          method: prevState.method,
          memberlist: [],
          regmember: [],
        }))
      }
    } else if (this.props.method === "Del") {  // 削除
      await this.setState(prevState => ({
        membertype: prevState.membertype,
        roomid: prevState.roomid,
        method: prevState.method,
        memberlist: [],
        regmember: [],
      }))
    } else {  // 選択
      await this.setState(prevState => ({
        membertype: prevState.membertype,
        roomid: prevState.roomid,
        method: prevState.method,
        memberlist: prevState.memberlist,
        regmember: [],
      }))
    }

    this._fetchMemberList()
  }

  /**
    * コンタクトリスト読み込み処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _fetchMemberList() {
    var fetchlist = {}
    if (this.state.method !== "Add" && this.state.membertype === 0 && this.state.roomid) {
      fetchlist = await CubeeAPI.fetchGroupChatInfo(this.state.roomid)
      _memberlist = []
      for (var key in fetchlist.items[0].memberItems) {
        var jid = fetchlist.items[0].memberItems[key]
        var info = fetchlist.items[0].personInfo[jid]
        info["jid"] = jid
        _memberlist.push(info)
      }
    } else if (this.state.method !== "Add" && this.state.membertype === 1 && this.state.roomid) {
      fetchlist = await CubeeAPI.fetchCommunityMember(this.state.roomid)
      const owners = fetchlist.items[0].memberItems.ownerItems;
      const generals = fetchlist.items[0].memberItems.generalMemberItems;
      _memberlist = owners.concat(generals)
    } else {
      fetchlist = await CubeeAPI.fetchContactList()
      _memberlist = []
      for (var key in fetchlist.items) {
        var val = fetchlist.items[key]
        if (this.state.roomid) {
          if (this.state.regmember.indexOf(val.jid) === -1) {
            _memberlist.push(val)
          }
        } else {
          _memberlist.push(val)
        }
      }
    }

    this._filterMemberList()
  }

  /**
    * コンタクトリストフィルター処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _filterMemberList() {
    var search = this.state.filter_text.toLowerCase()
    _displaylist = []

    for (var item in _memberlist) {
      var nickName = Common.urldecode(_memberlist[item].nickName).toLowerCase()
      var userName = Common.urldecode(_memberlist[item].userName).toLowerCase()

      if (nickName.search(search) !== -1 ||
          userName.search(search) !== -1) {
        _memberlist[item].checked = false
        _displaylist.push(_memberlist[item])
      }
    }

    _displaylist.sort(function(a,b){
        if(a.userName < b.userName) return -1
        if(a.userName > b.userName) return 1
        return 0
    })

    this.setState({
      datasource: _datasource.cloneWithRows(_displaylist),
    })
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {

    var title_text = "メンバー選択"
    if (this.state.method === "Add") title_text = "メンバー追加"
    if (this.state.method === "Del") title_text = "メンバー削除"

    return (
      <View style={{flex: 1, backgroundColor: Const.basic_backcolor_light}} >

        <Header
          leftComponent={
            <Text
              style={{color: Const.member_forecolor, padding:10, marginBottom:8, marginLeft:4}}
              onPress={() => this._onPressCancelButton()}
            >
              取消
            </Text>
          }
          centerComponent={{ text: title_text, style: {textAlign:'center', color: Const.member_forecolor, width:'70%', fontSize:16, fontWeight:'bold', marginBottom:15} }}
          rightComponent={
            <Text
              style={{color: Const.member_forecolor, padding:10, marginBottom:8, marginRight:4}}
              onPress={() => this._onPressSaveButton()}
            >
              決定
            </Text>
          }
          outerContainerStyles={{ backgroundColor: Const.member_backcolor, zIndex: 1, borderBottomWidth:0, padding:0 }}
        />

        <ScrollView>
          <View style={{marginTop: Const.headerbar_height}}>
            <SearchBar
              onChangeText={(text) => this._onChangeFilterText(text)}
              placeholder='キーワードでフィルタ'
              inputStyle={{fontSize: Const.textinput_fontsize, height: Const.textinput_height, backgroundColor: Const.searchbar_color}}
              containerStyle={{backgroundColor: Const.basic_backcolor_light, borderBottomWidth:0, borderTopWidth:0}}
              lightTheme
              clearIcon={{style:{padding:10, marginTop:-10, marginRight:-10}}}
            />
          </View>

          <ListView
            dataSource={this.state.datasource}
            renderRow={this._renderMemberList.bind(this)}
            enableEmptySections={true}
            removeClippedSubviews={false}
          />

        </ScrollView>
      </View>
    )
  }

  /**
    * コンタクトリスト画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _renderMemberList(item, sectionID, rowID) {

    var userName = Common.urldecode(item.nickName) + " (@" + item.userName + ")"

    var userCheckd = false
    if (this.state.memberlist.indexOf(item.jid) >= 0) {
      userCheckd = true
    }

    return (
      <View style={{backgroundColor: Const.basic_backcolor_light}}>
        <CheckBox
          title={userName}
          checked={userCheckd}
          onPress={() => this.onPressCheckBox(item)}
        />
      </View>
    )
  }

  /**
    * メンバーチェック処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  onPressCheckBox(item) {
    Common.saveOperationLog(_ScreenName, "メンバーチェック", "")

    var array = this.state.memberlist
    var index = array.indexOf(item.jid)
    if (index >= 0) {
      array.splice(index, 1)
    } else {
      array.push(item.jid)
    }

    var datasource = _displaylist.slice()
    for (var key in datasource) {
      datasource[key].checked = !datasource[key].checked
    }

    this.setState({
      datasource: _datasource.cloneWithRows(datasource),
      memberlist: array,
    })

    _displaylist = datasource
  }

  /**
    * ルーム名フィルター入力処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onChangeFilterText(text) {

    await this.setState({"filter_text": text})

    this._filterMemberList()
  }

  /**
    * キャンセルボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressCancelButton() {
    Common.saveOperationLog(_ScreenName, "キャンセルボタンタップ", "")
    if(Actions.currentScene === "member"){
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

    // ボタンがすでに押下されたかの確認
    if (this.state.buttonTap) {
      return;
    }

    if (this.state.roomid) {
      if (this.state.membertype === 0) {   // グループチャット
        if (this.state.method === "Add") {         // 追加
          for (var key in this.state.memberlist) {
            await CubeeAPI.addMemberGroupChat(
              this.state.roomid,
              this.state.memberlist[key]
            )
            Actions.pop()
            return
          }
        } else if (this.state.method === "Del") {    // 削除
          await CubeeAPI.delMemberGroupChat(
            this.state.roomid,
            this.state.memberlist
          )
          Actions.pop()
          return
        }
      } else if (this.state.membertype === 1) {  // プロジェクト
        if (this.state.method === "Add") {         // 追加
          await CubeeAPI.addMemberCommunity(
            this.state.roomid,
            this.state.memberlist
          )
          Actions.pop()
          return
        } else if (this.state.method === "Del") {    // 削除
          await CubeeAPI.delMemberCommunity(
            this.state.roomid,
            this.state.memberlist
          )
          Actions.pop()
          return
        }
      }
    }

    var members = []
    this.setState({buttonTap:true})
    setTimeout(this.resetButtonTap, 500)
    for (var key in _memberlist) {
      if (this.state.memberlist.indexOf(_memberlist[key].jid) >= 0) {
        members.push("@" + _memberlist[key].userName)
      }
    }
    Actions.pop({refresh: {back: new Date(), method: "Member", members: members}})
  }

  // ボタン押下後に処理に失敗した場合、再度ボタンを押下可能とする
  resetButtonTap () {
    if (Actions.currentScene === "member"){
      this.setState({buttonTap:false})
    }
  }
}
