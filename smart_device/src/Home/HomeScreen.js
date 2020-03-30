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
  TouchableOpacity,
  AsyncStorage,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  AppRegistry,
  BackHandler,
} from 'react-native'
import {
  Actions,
} from 'react-native-router-flux'
import Icon from 'react-native-vector-icons/FontAwesome'
import {
  Header,
  SearchBar,
  Avatar,
  CheckBox,
  Button,
} from 'react-native-elements'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import App from '../Application/App'

var _contactlist = []
var _groupchatlist_lastid = 0
var _groupchatlist_lastnum = Const.page_per_item
var _groupchatlist = []
var _communitylist_lastid = 0
var _communitylist_lastnum = Const.page_per_item
var _communitylist = []

var _datasource_contactlist
var _datasource_groupchat
var _datasource_community

const _ScreenName = "ホーム画面"
const checkHome = () => {
    if(Actions.currentScene === "_home"){
      return true
    }
  }
const handleAndroidBack = () => (
  BackHandler.addEventListener('hardwareBackPress', checkHome)
)

/**
  * ホーム画面処理
  * <pre>
  * ホーム画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class HomeScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {

      super()

      _contactlist = []
      _groupchatlist_lastid = 0
      _groupchatlist_lastnum = Const.page_per_item
      _groupchatlist = []
      _communitylist_lastid = 0
      _communitylist_lastnum = Const.page_per_item
      _communitylist = []

      _datasource_contactlist = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2})
      _datasource_groupchat = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2})
      _datasource_community = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2})

      this.state = {
        refreshing: false,
        filter_roomname: '',
        open_contactlist: false,
        open_groupchat: false,
        open_community: false,
        loaded_contactlist: false,
        loaded_groupchat: false,
        loaded_community: false,
        datasource_contactlist: _datasource_contactlist,
        datasource_groupchat: _datasource_groupchat,
        datasource_community: _datasource_community,
      }
  }

  /**
    * コンポーネントマウント直前処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  componentDidMount() {
    Common.saveOperationLog(_ScreenName, "画面表示", "")

    AsyncStorage.getItem("open_contactlist").then((value) => {
      if (value === "true")
        this.setState({"open_contactlist": true})
    }).done()
    AsyncStorage.getItem("open_groupchat").then((value) => {
      if (value === "true")
        this.setState({"open_groupchat": true})
    }).done()
    AsyncStorage.getItem("open_community").then((value) => {
      if (value === "true")
        this.setState({"open_community": true})
    }).done()

    this._fetchContactList()
    this._fetchGroupChatList()
    this._fetchCommunityList()

    handleAndroidBack()
  }

  /**
    * コンポーネント更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  componentWillReceiveProps(nextProps) {

//    if (App.getPushFlag() === false){
      _contactlist = []
      _groupchatlist_lastid = 0
      _groupchatlist_lastnum = Const.page_per_item
      _groupchatlist = []
      _communitylist_lastid = 0
      _communitylist_lastnum = Const.page_per_item
      _communitylist = []

      this.setState({
        loaded_contactlist: false,
        loaded_groupchat: false,
        loaded_community: false,
      })

      this._fetchContactList()
      this._fetchGroupChatList()
      this._fetchCommunityList()
/*    }else{
      App.setPushFlag(false)

      if (nextProps.notificationData.type === Const.cubee_message_feed){

      }else if (nextProps.notificationData.type === Const.cubee_message_chat){
        this._filterContactList()
      }else if (nextProps.notificationData.type === Const.cubee_message_groupchat){
        this._filterGroupChatList()
      }else if (nextProps.notificationData.type === Const.cubee_message_community){
        this._filterCommunityList()
      }else{
        this._filterContactList()
        this._filterGroupChatList()
        this._filterCommunityList()
      }
    }*/
  }

  /**
    * コンタクトリスト読み込み処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _fetchContactList() {
    try {
      var contactlist = await CubeeAPI.fetchContactList()
    }
    catch (e) {
      Common.saveErrorLog(_ScreenName, "コンタクトリストの取得に失敗しました", e)
      this.setState({loaded_contactlist: true})
      return
    }

    _contactlist = contactlist.items
    this._filterContactList()
  }

  /**
    * コンタクトリストフィルター処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _filterContactList() {
    var search = this.state.filter_roomname.toLowerCase()
    var displaylist = []

    for (var item in _contactlist) {
      var nickName = Common.urldecode(_contactlist[item].nickName).toLowerCase()
      var userName = Common.urldecode(_contactlist[item].userName).toLowerCase()
      var groupName = Common.urldecode(_contactlist[item].groupItems[0]).toLowerCase()

      if (nickName.search(search) !== -1 ||
          groupName.search(search) !== -1 ||
          userName.search(search) !== -1) {
        displaylist.push(_contactlist[item])
      }
    }

    displaylist.sort(function(a,b){
        if(a.userName < b.userName) return -1
        if(a.userName > b.userName) return 1
        return 0
    })

    // var allIds = App.getAllIds()
    // allIds.chat = displaylist.map(item => item.jid)
    // App.setAllIds(allIds)

    this.setState({
      datasource_contactlist: _datasource_contactlist.cloneWithRows(displaylist),
      loaded_contactlist: true,
    })
  }

  /**
    * グループチャット一覧読み込み処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _fetchGroupChatList() {
    var fetchlist = {}
    try {
      fetchlist = await CubeeAPI.fetchGroupChatList(_groupchatlist_lastid)
    }
    catch (e) {
      Common.saveErrorLog(_ScreenName, "グループチャット一覧の取得に失敗しました", e)
      this.setState({loaded_groupchat: true})
      return
    }

    for (var item in fetchlist.items) {
      _groupchatlist.push(fetchlist.items[item])
    }

    _groupchatlist_lastnum = fetchlist.count
    this._filterGroupChatList()

    if (fetchlist.count > 0) {
      _groupchatlist_lastid = fetchlist.items[fetchlist.count - 1].id
    }
  }

  /**
    * グループチャット一覧フィルター処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _filterGroupChatList() {

    var search = this.state.filter_roomname.toLowerCase()
    var displaylist = []

    for (var item in _groupchatlist) {
      var roomname = Common.urldecode(_groupchatlist[item].roomName).toLowerCase()
      if (roomname.search(search) !== -1) {
        displaylist.push(_groupchatlist[item])
      }
    }

    // var allIds = App.getAllIds()
    // allIds.group = displaylist.map(item => item.roomId)
    // App.setAllIds(allIds)

    this.setState({
      datasource_groupchat: _datasource_groupchat.cloneWithRows(displaylist),
      loaded_groupchat: true,
    })
  }

  /**
    * プロジェクト一覧読み込み処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _fetchCommunityList() {
    var fetchlist = {}
    try {
      fetchlist = await CubeeAPI.fetchCommunityList(_communitylist_lastid)
    }
    catch (e) {
      Common.saveErrorLog(_ScreenName, "プロジェクト一覧の取得に失敗しました", e)
      this.setState({loaded_community: true})
      return
    }

    for (var item in fetchlist.items) {
      _communitylist.push(fetchlist.items[item])
    }

    _communitylist_lastnum = fetchlist.count
    this._filterCommunityList()

    if (fetchlist.count > 0) {
      _communitylist_lastid = fetchlist.items[fetchlist.count - 1].id
    }
  }

  /**
    * プロジェクト一覧フィルター処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _filterCommunityList() {
    var search = this.state.filter_roomname.toLowerCase()
    var displaylist = []

    for (var item in _communitylist) {
      var roomname = Common.urldecode(_communitylist[item].roomName).toLowerCase()
      if (roomname.search(search) !== -1) {
        displaylist.push(_communitylist[item])
      }
    }

    // var allIds = App.getAllIds()
    // allIds.community = displaylist.map(item => item.roomId)
    // App.setAllIds(allIds)

    this.setState({
      datasource_community: _datasource_community.cloneWithRows(displaylist),
      loaded_community: true,
    })
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {

    var icon_contactlist = this.state.open_contactlist ? 'angle-up' : 'angle-down'
    var icon_groupchatlist = this.state.open_groupchat ? 'angle-up' : 'angle-down'
    var icon_communitylist = this.state.open_community ? 'angle-up' : 'angle-down'

    return (
      <View style={{flex: 1, backgroundColor: 'white'}} >

        <Header
          centerComponent={
            <Text
              style={{color: Const.home_forecolor, fontSize: 16, fontWeight: 'bold'}}
            >
              ホーム
            </Text>
          }
          rightComponent={
            {/*
            <Text
              style={{color: Const.home_forecolor}}
              onPress={() => this._onPressRoomButton()}
            >
              追加
            </Text>
            */}
          }
          outerContainerStyles={{backgroundColor: Const.home_backcolor, zIndex: 1, borderBottomWidth:0}}
        />

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh.bind(this)}
              tintColor={Const.transparent_color}
            />
          }
        >
          <View style={{marginTop: Const.headerbar_height}} >
            <SearchBar
              onChangeText={(text) => this._onChangeFilterText(text)}
              placeholder='キーワードでフィルタ'
              inputStyle={{fontSize: Const.textinput_fontsize, height: Const.textinput_height, backgroundColor: Const.searchbar_color}}
              containerStyle={{backgroundColor: Const.basic_backcolor, borderBottomWidth:0, borderTopWidth:0}}
              lightTheme
              clearIcon
            />
          </View>

          <TouchableOpacity
            onPress={this._onPressOpenCommunityList.bind(this)}
          >
            <View style={{backgroundColor: Const.home_item_backcolor, height: 40, flexDirection: 'row'}} >
              <View style={{justifyContent: 'center', alignItems: 'flex-start', width: '15%'}} >
                <Icon name='users' style={{paddingLeft: 12, color: Const.home_item_forecolor}}
                  size={20} />
              </View>
              <View style={{justifyContent: 'center', width: '75%'}} >
                <Text style={{color: Const.home_item_forecolor, fontWeight: 'bold'}}>
                  プロジェクト
                </Text>
              </View>
              <View style={{justifyContent: 'center',  alignItems: 'flex-end', width: '10%'}} >
                <Icon name={icon_communitylist} style={{paddingRight: 12, color: Const.home_item_forecolor}}
                  size={25} />
              </View>
            </View>
          </TouchableOpacity>
          {(() => {
            if (this.state.open_community) {
              if (this.state.loaded_community) {
                return (
                  <View>
                    <ListView
                      dataSource={this.state.datasource_community}
                      renderRow={this._renderCommnutyList.bind(this)}
                      enableEmptySections={true}
                      removeClippedSubviews={false}
                    />
                  </View>
                )
              } else {
                return (
                  <View style={{marginTop: 20, justifyContent: 'center'}}>
                    <ActivityIndicator size="large" color={Const.activity_indicator_color} />
                  </View>
                )
              }
            }
          })()}
          {(() => {
            if (this.state.open_community && this.state.loaded_community && _communitylist_lastnum === Const.page_per_item) {
              return (
                <View style={{justifyContent: 'center', backgroundColor: 'white', height: 30}}>
                  <Text
                    style={{textAlign: 'center', fontWeight: 'bold'}}
                    onPress={() => this._onPressNextCommunity()}
                  >
                    もっと見る
                  </Text>
                </View>
              )
            }
          })()}

          <TouchableOpacity
            onPress={this._onPressOpenGroupChatList.bind(this)}
          >
            <View style={{backgroundColor: Const.home_item_backcolor, height: 40, flexDirection: 'row'}} >
              <View style={{justifyContent: 'center', alignItems: 'flex-start', width: '15%'}} >
                <View style={{flexDirection: 'row'}} >
                  <View>
                    <Icon name='user' style={{paddingLeft: 12, color: Const.home_item_forecolor}}
                      size={16} />
                  </View>
                  <View>
                    <Icon name='user' style={{color: Const.home_item_forecolor}}
                      size={16} />
                  </View>
                </View>
              </View>
              <View style={{justifyContent: 'center', width: '75%'}} >
                <Text style={{color: Const.home_item_forecolor, fontWeight: 'bold'}}>
                  グループチャット
                </Text>
              </View>
              <View style={{justifyContent: 'center',  alignItems: 'flex-end', width: '10%'}} >
                <Icon name={icon_groupchatlist} style={{paddingRight: 12, color: Const.home_item_forecolor}}
                  size={25} />
              </View>
            </View>
          </TouchableOpacity>
          {(() => {
            if (this.state.open_groupchat)  {
              if (this.state.loaded_groupchat) {
                return (
                  <View>
                    <ListView
                      dataSource={this.state.datasource_groupchat}
                      renderRow={this._renderGroupChatList.bind(this)}
                      enableEmptySections={true}
                      removeClippedSubviews={false}
                    />
                  </View>
                )
              } else {
                return (
                  <View style={{marginTop: 20, justifyContent: 'center'}}>
                    <ActivityIndicator size="large" color={Const.activity_indicator_color} />
                  </View>
                )
              }
            }
          })()}
          {(() => {
            if (this.state.open_groupchat && this.state.loaded_groupchat && _groupchatlist_lastnum === Const.page_per_item) {
              return (
                <View style={{justifyContent: 'center', backgroundColor: 'white', height: 30}}>
                  <Text
                    style={{textAlign: 'center', fontWeight: 'bold'}}
                    onPress={() => this._onPressNextGroupChat()}
                  >
                    もっと見る
                  </Text>
                </View>
              )
            }
          })()}

          <TouchableOpacity
            onPress={this._onPressOpenContactList.bind(this)}
          >
            <View style={{backgroundColor: Const.home_item_backcolor, height: 40, flexDirection: 'row'}} >
              <View style={{justifyContent: 'center', alignItems: 'flex-start', width: '15%'}} >
                <Icon name='user' style={{paddingLeft: 12, color: Const.home_item_forecolor}}
                  size={20} />
              </View>
              <View style={{justifyContent: 'center', width: '75%'}} >
                <Text style={{color: Const.home_item_forecolor, fontWeight: 'bold'}}>
                  コンタクトリスト
                </Text>
              </View>
              <View style={{justifyContent: 'center',  alignItems: 'flex-end', width: '10%'}} >
                <Icon name={icon_contactlist} style={{paddingRight: 12, color: Const.home_item_forecolor}}
                  size={25} />
              </View>
            </View>
          </TouchableOpacity>
          {(() => {
            if (this.state.open_contactlist) {
              if (this.state.loaded_contactlist) {
                return (
                  <ListView
                    dataSource={this.state.datasource_contactlist}
                    renderRow={this._renderContactList.bind(this)}
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
            }
          })()}

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
  _renderContactList(item, sectionID, rowID) {
    var groupName = "所属グループなし"
    if (item.groupCount > 0) {
      groupName = Common.urldecode(item.groupItems[0])
    }

    return (
      <TouchableOpacity  onPress={() => this._onPressedContactList(item)}>
      <View>
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', paddingLeft:20, paddingRight:20}}>
          {(() => {
            if (item.avatarType === 'imagepath') {
              var uri = Common.addUrlPath(CubeeAPI.getUrl(), item.avatarData)
              return (
                <Avatar
                  small
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
              return Common.avatarCreate(Common.urldecode(item.nickName), "user", "small", style);
            }
          })()}
          <View style={{flex: 1}}>
            <Text
              style={{marginTop: 4, marginLeft: 10, fontWeight: 'bold', color: Const.chat_msgforecolor}}
              numberOfLines={1}
            >
              {Common.urldecode(item.nickName)} (@{item.userName})
            </Text>
            <Text
              style={{marginBottom: 4, marginLeft: 10, fontWeight: 'normal', color: Const.chat_msgforecolor}}
              numberOfLines={2}
            >
              {groupName}
            </Text>
          </View>
          {(()=>{return App.getBadgelist().chat.indexOf(item.jid) >= 0 ?
            <View style={{alignItems: 'center',justifyContent: 'center'}}>
              <View style={styles.listBadge} />
              <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold', backgroundColor:'#00000000'}}>!</Text>
            </View>
         : null})()}
        </View>
      </View>
      </TouchableOpacity>
    )
  }

  /**
    * グループチャット一覧画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _renderGroupChatList(item, sectionID, rowID) {
    return (
      <TouchableOpacity  onPress={() => this._onPressedGroupChatList(item)}>
      <View>
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', paddingLeft:20, paddingRight:20}}>
          {(() => {
            var style = {
              marginTop: 10,
              marginLeft: 10,
              marginBottom: 10,
            };
            return Common.avatarCreate(Common.urldecode(item.roomName), "groupchat", "small", style)
          })()}
          <View style={{flex: 1}}>
            <Text
              style={{marginLeft: 10, fontWeight: 'bold', color: Const.groupchat_msgforecolor}}
              numberOfLines={1}
              >{Common.urldecode(item.roomName)}</Text>
              {/* } GroupChat has no description liek Project
            <Text
              style={{marginBottom: 4, marginLeft: 10, fontWeight: 'normal', color: Const.groupchat_msgforecolor}}
              numberOfLines={2}
              ></Text> */}
          </View>
          {(()=>{return App.getBadgelist().group.indexOf(item.roomId) >= 0 ?
            <View style={{alignItems: 'center',justifyContent: 'center'}}>
              <View style={styles.listBadge} />
              <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold', backgroundColor:'#00000000'}}>!</Text>
            </View>
             : null})()}
        </View>
      </View>
      </TouchableOpacity>
    )
  }

  /**
    * プロジェクト一覧画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _renderCommnutyList(item, sectionID, rowID) {
    return (
      <TouchableOpacity  onPress={() => this._onPressedCommunityList(item)}>
      <View>
        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', paddingLeft:20, paddingRight:20}}>
          {(() => {
            if (item.logoUrl !== '') {
              var uri = Common.addUrlPath(CubeeAPI.getUrl(), item.logoUrl)
              return (
                <Avatar
                  small
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
              return Common.avatarCreate(Common.urldecode(item.roomName), "project", "small", style)
            }
          })()}
          <View style={{flex: 1}}>
            <Text
              style={{marginTop: 4, marginLeft: 10, fontWeight: 'bold', color: Const.community_msgforecolor}}
              numberOfLines={1}
            >
              {Common.urldecode(item.roomName)}
            </Text>
            <Text
              style={{marginBottom: 4, marginLeft: 10, fontWeight: 'normal', color: Const.community_msgforecolor}}
              numberOfLines={2}
            >
              {Common.urldecode(item.description)}
            </Text>
          </View>
          {(()=>{return App.getBadgelist().community.indexOf(item.roomId) >= 0 ?
          <View style={{alignItems: 'center',justifyContent: 'center'}}>
            <View style={styles.listBadge} />
            <Text style={{color: 'white', fontSize: 15, fontWeight: 'bold', backgroundColor:'#00000000'}}>!</Text>
          </View>
           : null})()}
        </View>
      </View>
      </TouchableOpacity>
    )
  }

  /**
    * 画面更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onRefresh() {
    Common.saveOperationLog(_ScreenName, "画面更新タップ", "")

    _contactlist = []
    _groupchatlist_lastid = 0
    _groupchatlist_lastnum = Const.page_per_item
    _groupchatlist = []
    _communitylist_lastid = 0
    _communitylist_lastnum = Const.page_per_item
    _communitylist = []

    this.setState({
      loaded_contactlist: false,
      loaded_groupchat: false,
      loaded_community: false,
    })

    this._fetchContactList()
    this._fetchGroupChatList()
    this._fetchCommunityList()
  }

  /**
    * ルーム名フィルター入力処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onChangeFilterText(text) {
    await this.setState({
      "filter_roomname": text,
      open_contactlist: true,
      open_groupchat: true,
      open_community: true,
    })

    AsyncStorage.setItem('open_contactlist', "true")
    AsyncStorage.setItem('open_groupchat', "true")
    AsyncStorage.setItem('open_community', "true")

    this._filterContactList()
    this._filterGroupChatList()
    this._filterCommunityList()
  }

  /**
    * ルーム追加タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressRoomButton() {
    Common.saveOperationLog(_ScreenName, "ルーム追加タップ", "")

    Actions.room()
  }

  /**
    * コンタクトリストオープンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressOpenContactList() {
    Common.saveOperationLog(_ScreenName, "コンタクトリストオープンタップ", "")

    var open =!this.state.open_contactlist
    this.setState({"open_contactlist": open})
    AsyncStorage.setItem('open_contactlist', open ? "true" : "false")
  }

  /**
    * グループチャット一覧オープンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressOpenGroupChatList() {
    Common.saveOperationLog(_ScreenName, "グループチャット一覧オープンタップ", "")

    var open =!this.state.open_groupchat
    this.setState({"open_groupchat": open})
    AsyncStorage.setItem('open_groupchat', open ? "true" : "false")
  }

  /**
    * プロジェクト一覧オープンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressOpenCommunityList() {
    Common.saveOperationLog(_ScreenName, "プロジェクト一覧オープンタップ", "")

    var open =!this.state.open_community
    this.setState({open_community: open})
    AsyncStorage.setItem('open_community', open ? "true" : "false")
  }

  /**
    * グループチャット次を取得タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressNextGroupChat() {
    Common.saveOperationLog(_ScreenName, "グループチャット次を取得タップ", "")

//    this.setState({loaded_groupchat: false})
    this._fetchGroupChatList()
  }

  /**
    * プロジェクトー次を取得タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressNextCommunity() {
    Common.saveOperationLog(_ScreenName, "プロジェクト一覧を取得タップ", "")

//    this.setState({loaded_community: false})
    this._fetchCommunityList()
  }

  /**
    * コンタクトリストタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressedContactList(item) {
    var badgelist = App.getBadgelist()
    var pos = badgelist.chat.indexOf(item.jid)
    if(pos !== -1){
      badgelist.chat.splice(pos, 1)
      App.setBadgelist(badgelist)
    }
    Common.saveOperationLog(_ScreenName, "コンタクトリストタップ", "")
    Actions.chat({
      jid: item.jid,
      nickname: item.nickName,
    })
  }

  /**
    * グループチャット一蘭タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressedGroupChatList(item) {
    var badgelist = App.getBadgelist()
    var pos = badgelist.group.indexOf(item.roomId)
    if(pos !== -1){
      badgelist.group.splice(pos, 1)
      App.setBadgelist(badgelist)
    }
    Common.saveOperationLog(_ScreenName, "グループチャット一覧タップ", "")
    Actions.groupchat({
      roomid: item.roomId,
      roomname: item.roomName,
    })
  }

  /**
    * プロジェクト一覧タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressedCommunityList(item) {
    var badgelist = App.getBadgelist()
    var pos = badgelist.community.indexOf(item.roomId)
    if(pos !== -1){
      badgelist.community.splice(pos, 1)
      App.setBadgelist(badgelist)
    }
    Common.saveOperationLog(_ScreenName, "プロジェクト一覧タップ", "")

    // プロジェクトカラーが設定されている場合
    var projectColor = "";
    if (item.memberEntryType) {
      projectColor = "#" + item.memberEntryType;
    }
    Actions.community({
      roomid: item.roomId,
      roomname: item.roomName,
      projectColor: projectColor,
    })
  }
}

const styles = StyleSheet.create({
  listBadge: {
    width: 27,
    height: 20,
    borderRadius: 20/2,
    backgroundColor: '#e14b67',
    position: 'absolute',
  },
})
