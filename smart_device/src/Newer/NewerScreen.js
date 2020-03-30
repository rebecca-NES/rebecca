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
  StyleSheet,
  View,
  Text,
  Alert,
  ScrollView,
  ListView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native'
import {
    Actions,
} from 'react-native-router-flux'
import Icon from 'react-native-vector-icons/FontAwesome'
import {
  SearchBar,
  Avatar,
  Header,
  CheckBox,
  Button,
  ButtonGroup,
  Badge,
  Divider,
} from 'react-native-elements'
import Toast from 'react-native-simple-toast'
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
  MenuProvider,
} from 'react-native-popup-menu'

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'
import Thumbnails from '../Components/Thumbnails'

const _ScreenName = "新着画面処理"

/**
  * 新着画面処理
  * <pre>
  * 新着画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class NewerScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {

    super()

    this._fetch_lastid = 0
    this._fetch_items = []
    this._attaches = []
    this._fetching = false    // 読み込み処理中かどうか

    this._datasource = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2})

    this.state = {
      newertype: 0,
      refreshing: false,
      filter_username: '',
      filter_midoku: false,
      loaded: false,
      items: this._datasource,
    }

    this._onPressImage = this._onPressImage.bind(this);
  }

  /**
    * コンポーネントマウント直前処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  componentDidMount() {
    Common.saveOperationLog(_ScreenName, "画面表示", "")

    this._fetch_lastid = 0
    this._fetch_items = []
    this._attaches = []

    this._fetch_list()
  }

  /**
    * コンポーネントマウント直前処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  componentDidUpdate(prevProps, prevState) {

    if ( this.state.loaded !== true ) {
      this._fetch_list()
    }
  }

  /**
    * コンポーネント更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  componentWillReceiveProps(nextProps) {

    if(nextProps.tabRefresh){
      this.refs._scrollView.scrollTo({y:0, animated: false})
      this._onRefresh()
    }else{
      this._fetch_lastid = 0
      this._fetch_items = []
      this._attaches = []

      this.setState({
        loaded: false,
      })
    }
  }

  /**
    * 新着リスト読み込み処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _fetch_list() {

    if (this._fetching) {
      return
    }
    this._fetching = true

    var fetchlist = {}
    try {
      if (this.state.newertype === 0) {
        fetchlist = await CubeeAPI.fetchNewerList(this._fetch_lastid)
      } else {
        fetchlist = await CubeeAPI.fetchWatchList(this._fetch_lastid)
      }
    }
    catch (e) {
      Common.saveErrorLog(_ScreenName, "新着リストの取得に失敗しました", e)
    }

    await CubeeAPI.getAttaches(this._attaches, fetchlist, this._fetch_items, _ScreenName)

    this._filter_List()

    if (fetchlist.count > 0) {
      this._fetch_lastid = fetchlist.items[fetchlist.count - 1].id
    }

    this._fetching = false
  }

  /**
    * 新着リストフィルター処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _filter_List() {

    var search = this.state.filter_username.toLowerCase()
    var displaylist = []

    for (var item in this._fetch_items) {

      var from = this._fetch_items[item].from
      var nickName = Common.urldecode(this._fetch_items[item].personInfo[from].nickName).toLowerCase()
      var userName = Common.urldecode(this._fetch_items[item].personInfo[from].userName).toLowerCase()

      if (nickName.search(search) !== -1 ||
          userName.search(search) !== -1) {

        if (this.state.filter_midoku) {
          if (this._fetch_items[item].readFlg === 0) {
            displaylist.push(this._fetch_items[item])
          }
        } else {
          displaylist.push(this._fetch_items[item])
        }
      }
    }

    this.setState({
      items: this.state.items.cloneWithRows(displaylist),
      loaded: true,
      refreshing: false,
    })
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {
    const buttons = ['全ての新着', '自分宛']

    return (
    <MenuProvider style={{flex: 1}}>
      <View style={{flex: 1, backgroundColor: Const.basic_backcolor}} >

        <Header
          centerComponent={{text: '新着', style: {color: Const.newer_forecolor, fontSize: 16, fontWeight: 'bold'}}}
          outerContainerStyles={{backgroundColor: Const.newer_backcolor, zIndex: 1, borderBottomWidth:0}}
        />

        <ScrollView
          style={{flex: 1, marginTop: Const.headerbar_height}}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh.bind(this)}
            />
          }
          scrollEventThrottle={500}
          onScroll={this._onScroll.bind(this)}
          ref='_scrollView'
          >
          <View>
            <SearchBar
              onChangeText={(text) => this._onChangeFilterText(text)}
              placeholder='ユーザーごとにフィルタ'
              inputStyle={{fontSize: Const.textinput_fontsize, height: Const.textinput_height, backgroundColor: Const.searchbar_color}}
              containerStyle={{backgroundColor: Const.basic_backcolor, borderBottomWidth:0, borderTopWidth:0}}
              lightTheme
              clearIcon={{style:{padding:10, marginTop:-10, marginRight:-10}}}
            />

            <View style={{flexDirection: 'row'}}>
              <View style={{width: '100%'}}>
                <ButtonGroup
                  onPress={this._onPressNewerType.bind(this)}
                  selectedIndex={this.state.newertype}
                  buttons={buttons}
                  containerStyle={{
                    height: 30, borderWidth:0, marginTop: 0, marginBottom: 4
                  }}
                  selectedBackgroundColor={Const.newer_backcolor}
                  selectedTextStyle={{color: Const.newer_forecolor}}
                />
              </View>
              {/*<View style={{width: '40%'}}>
                <CheckBox
                  checked={this.state.filter_midoku}
                  title={`未読のみ`}
                  onPress={() => this._onMidokuChecked()}
                  containerStyle={{backgroundColor: Const.basic_backcolor, borderWidth:0, alignSelf: 'flex-end',  }}
                  textStyle={{fontSize: 12}}
                  uncheckedColor={'black'}
                  checkedColor={'black'}
                />
              </View>*/}
            </View>
          </View>

          <View>
            {(() => {
              if (this.state.loaded || this.state.refreshing) {
                return (
                  <ListView
                    dataSource={this.state.items}
                    renderRow={this._renderNewerList.bind(this)}
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
    </MenuProvider>
    )
  }

  /**
    * 新着リスト画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _renderNewerList(item, sectionID, rowID) {

    var roomTypeBackColor = ""
    var roomTypeTextColor = ""
    var roomTypeName = ""
    var roomDescBackColor = ""
    var roomDescTextColor = ""

    if (item.type === Const.cubee_message_feed) { // フィード
      roomTypeBackColor = Const.company_backcolor
      roomTypeTextColor = Const.company_forecolor
      roomTypeName = "フィード"
    } else if (item.type === Const.cubee_message_chat) { // チャット
      roomTypeBackColor = Const.chat_backcolor
      roomTypeTextColor = Const.chat_forecolor

      var chat = item.from
      if (chat === CubeeAPI.getUserJid()) chat = item.to
      roomTypeName = Common.urldecode(item.personInfo[chat].nickName) + "（チャット）"
    } else if (item.type === Const.cubee_message_groupchat) { // グループチャット
      roomTypeBackColor = Const.groupchat_backcolor
      roomTypeTextColor = Const.groupchat_forecolor
      roomTypeName = Common.urldecode(item.roomName) + "（グループチャット）"
    } else if (item.type === Const.cubee_message_community) { // プロジェクト
      roomTypeBackColor = Const.community_backcolor
      roomTypeTextColor = Const.community_forecolor
      roomTypeName = Common.urldecode(item.roomName) + "（プロジェクト）"
    } else {
      return(<View></View>)
    }

    roomDescBackColor = Const.parent_backcolor
    roomDescTextColor = Const.parent_forecolor

    var from = item.from
    var nickName = Common.urldecode(item.personInfo[from].nickName)
    var userName = "@" + Common.urldecode(item.personInfo[from].userName)
    var datetime = Common.convertDisplayDateTime(item.createdAt)
    var itemBody = CubeeAPI.getItemBody(item)

    var kidoku_color = Const.kidoku_mark_color
    var kidoku_num = "既読一覧"
    if (item.type !== 1) {
      var kidoku_num = "既読 0"
      if (item.readAllCount) {
        kidoku_num = "既読 " + item.readAllCount
      }
    }

    var goodjob_color = Const.parent_forecolor
    var goodjobexec_disable = false
    var goodjoblist_disable = true
    if (CubeeAPI.isGoodJob(item.goodJobItems)) {
      goodjob_color = Const.goodjob_mark_color
      goodjobexec_disable = true
    }
    if (item.goodJobCount > 0) {
      goodjoblist_disable = false
    }

    return (
      <View style={{flex: 1, backgroundColor: roomDescBackColor, borderColor: '#c3c5ca', borderTopWidth: 4}}>

        <View style={{height: 25, justifyContent: 'center', backgroundColor: roomTypeBackColor}}>
          <Text style={{paddingLeft: 12, color: roomTypeTextColor}} numberOfLines={1}>{roomTypeName}</Text>
        </View>

          <View style={{padding: 10}}>
            <TouchableOpacity onPress={() => this._onPressKidoku(item)}>

              <View style={{backgroundColor: roomDescBackColor}}>
                <View style={{flexDirection: 'row'}}>
                  <View>
                    {(() => {
                      if (item.type === Const.cubee_message_system) {
                        return (
                          <Avatar small rounded source={require('../Images/icon/SPFE_icon-0048.png')}
                            containerStyle={{marginTop: 5, marginLeft: 5, marginBottom: 5}}/>
                        )
                      } else if (item.personInfo[from].avatarType === "imagepath") {
                        var uri = Common.addUrlPath(CubeeAPI.getUrl(), item.personInfo[from].avatarData)
                        return (
                          <Avatar
                            small
                            rounded
                            source={{uri: uri}}
                            containerStyle={{marginTop: 5, marginLeft: 5, marginBottom: 5}}
                          />
                        )
                      } else {
                        var style = {marginTop: 5, marginLeft: 5, marginBottom: 5}
                        return (
                          Common.avatarCreate(nickName, "user", "small", style)
                        )
                      }
                    })()}
                  </View>
                  {(()=>{return (item.type === Const.cubee_message_system || item.readFlg !== 0) ? null :
                    <View style={styles.listBadge} />
                  })()}

                  <View style={{justifyContent: 'center', paddingLeft: 12, marginRight: 40}}>

                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{width: '85%', flexDirection: 'row', flexWrap: 'wrap'}}>
                      <View>
                        <Text style={{color: Const.parent_forecolor, fontWeight: 'bold'}}
                          numberOfLines={1}>
                          {nickName}
                        </Text>
                        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                          <Text style={{color: Const.home_item_forecolor}}>
                            {userName}
                          </Text>
                          <Text style={{color: Const.home_item_forecolor, paddingLeft:8}}>
                            {datetime}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={{width: '15%', flexWrap: 'wrap', justifyContent: 'flex-end', flexDirection: 'row', }} >
                    {(() => {
                      if ( CubeeAPI.isRemoveItem(item) ) {
                        return (
                          <Menu style={{marginLeft:8, flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                            <MenuTrigger>
                              <View style={{paddingLeft:8, paddingRight:8, paddingTop:3, paddingBottom:3, borderRadius:3, borderColor: Const.basic_backcolor}}>
                                <Icon name='ellipsis-v'
                                  size={20}
                                  style={{paddingLeft:3, paddingRight:3}}
                                />
                              </View>
                            </MenuTrigger>
                            <MenuOptions optionsContainerStyle={{marginTop: 30, width:80}}>
                              <MenuOption onSelect={this._onPressRemoveButton.bind(this, item)} text='削除' />
                            </MenuOptions>
                          </Menu>
                        )
                      }
                    })()}
                    </View>
                  </View>
                  <Text style={{color: Const.parent_forecolor, paddingTop: 5, paddingBottom: 5}}>
                    {itemBody}
                  </Text>

                    <Thumbnails item={item} attaches={this._attaches} onPressImage={this._onPressImage}/>

                    <View style={{flexDirection: 'row', paddingTop: 5}}>

                      <View style={{flexDirection: 'row',width: '70%'}} >
                        <TouchableOpacity onPress={this._onPressReplyButton.bind(this, item)}
                          style={{backgroundColor:'white', paddingLeft:8, paddingRight:8, paddingTop:3, paddingBottom:3, borderRadius:3, borderColor: Const.basic_backcolor, borderWidth:1}}>
                          <Icon name='reply'
                            size={20}
                            style={{color: Const.parent_forecolor,}}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this._onPressKaiwaButton.bind(this, item)}
                          style={{backgroundColor:'white', marginLeft:8, paddingLeft:8, paddingRight:8, paddingTop:3, paddingBottom:3, borderRadius:3, borderColor: Const.basic_backcolor, borderWidth:1}}>
                          <Icon name='comments-o'
                            size={20}
                            style={{color: Const.parent_forecolor,}}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this._onPressedNewerList.bind(this, item)}
                          style={{backgroundColor:'white', marginLeft:10, paddingLeft:10, paddingRight:8, paddingTop:3, paddingBottom:3, borderRadius:3, borderColor: Const.basic_backcolor, borderWidth:1}}>
                          <Icon name='sign-in'
                            size={20}
                            style={{color: Const.parent_forecolor,}}
                          />
                        </TouchableOpacity>

                        <Menu style={{marginLeft:8,}}>
                          <MenuTrigger>
                            <View style={{backgroundColor:'white', flexDirection: 'row',paddingLeft:8, paddingRight:8, paddingTop:3, paddingBottom:3, borderRadius:3, borderColor: Const.basic_backcolor, borderWidth:1}}>
                              <Icon name='thumbs-o-up'
                                size={20}
                                style={{color: goodjob_color}}
                              />
                              <Text style={{marginLeft:3,
                                            marginTop: Platform.select({ios: 2, android: 0}),
                                            color: goodjob_color}}>
                                {item.goodJobCount}
                              </Text>
                            </View>
                          </MenuTrigger>
                          <MenuOptions optionsContainerStyle={{marginTop: 30, width:80}}>
                            <MenuOption disabled={goodjobexec_disable} onSelect={this._onPressGoodJob.bind(this, item)} text='いいね' />
                            <MenuOption><Divider /></MenuOption>
                            <MenuOption disabled={goodjoblist_disable} onSelect={this._onPressGoodJobList.bind(this, item)} text='確認' />
                          </MenuOptions>
                        </Menu>
                      </View>

                      <View style={{width: '30%', flexDirection: 'row', justifyContent: 'flex-end'}} >
                        {(() => {
                          if (item.type !== Const.cubee_message_system) {
                            return (
                              <TouchableOpacity
                                onPress={this._onPressKidokuList.bind(this, item)}>
                                <Text style={{color: kidoku_color, marginTop:5, marginBottom:5}}>
                                  {kidoku_num}
                                </Text>
                              </TouchableOpacity>
                            )
                          }
                        })()}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

      </View>
    )
  }

  /**
    * プレビューボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressImage(item, i) {
    Common.saveOperationLog(_ScreenName, "プレビューボタンタップ", "")

     this._onPressKidoku(item)
     Actions.preview({
       image: this._attaches[item.itemId][i]
     })
   }

  /**
    * 新着タイプタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressNewerType (newertype) {
    Common.saveOperationLog(_ScreenName, "新着タイプタップ", "")

    if (!this.state.loaded) {
      return
    }

    this._fetch_lastid = 0
    this._fetch_items = []
    this._attaches = []

    await this.setState({
      loaded: false,
      newertype: newertype,
    })

    this._fetch_list()
  }

  /**
    * 既読タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressKidoku(item) {

    if (item.type === Const.cubee_message_system) {
      return
    }
    if (item.readFlg === 1) {
      return
    }
    Common.saveOperationLog(_ScreenName, "既読タップ", "")

    try {
      CubeeAPI.execKidoku(item.itemId)
    }
    catch (e) {
      Common.saveErrorLog(_ScreenName, "既読に失敗しました", e)
      return
    }

    var lst = this._fetch_items.slice()
    for ( var inx in lst ) {
      if ( lst[inx].id === item.id ) {
        lst[inx].readFlg = 1
        if (lst[inx].readAllCount) {
          lst[inx].readAllCount += 1
        } else {
          lst[inx].readAllCount = 1
        }
        break
      }
    }

    var displaylist = lst.slice()
    if (this.state.filter_midoku) {
      displaylist = displaylist.filter(item => item.readFlg == 0)
    }

    const datasource = this._datasource.cloneWithRows(displaylist)

    this.setState({
      items: datasource,
    })

    this._fetch_items = lst

    //Toast.show("既読にしました")
  }

  /**
    * 画面更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onRefresh() {
    Common.saveOperationLog(_ScreenName, "画面更新処タップ", "")

    if (this._fetching) {
      // currently refreshing messages(_fetching true means fetching messages)
      return
    }
    this._fetch_lastid = 0
    this._fetch_items = []
    this._attaches = []

    this.setState({
      loaded: false,
      refreshing: true,
    })
  }

  /**
    * 画面スクロール処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onScroll(event: Object) {

    let currentOffsetY = event.nativeEvent.contentOffset.y
    let maximumOffset = event.nativeEvent.contentSize.height - event.nativeEvent.layoutMeasurement.height
    let distanceToBottom = maximumOffset - currentOffsetY

    if (distanceToBottom < Const.next_fetch_distance) {
        this._fetch_list()
    }
  }

  /**
    * ユーザー名フィルター入力処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onChangeFilterText(text) {

    await this.setState({"filter_username": text})

    this._filter_List()
  }

  /**
    * 未読フィルタータップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onMidokuChecked() {
    Common.saveOperationLog(_ScreenName, "未読フィルタータップ", "")

    await this.setState({filter_midoku: !this.state.filter_midoku})

    this._filter_List()
  }

  /**
    * チャット相手の情報を取得する
    * @return {object} jid:チャット相手のjid, nickName:チャット相手のnickName
    * @author NES
    * @since 1.0
    */
  _getChatTargetInfo(item) {
    var login = CubeeAPI.getLoginInfo()
    var chatNickName = ""
    var chatJid = ""
    if (login.userInfo.jid == item.to){
      chatNickName = item.personInfo[item.from].nickName
      chatJid = item.from
    } else {
      chatNickName = item.personInfo[item.to].nickName
      chatJid = item.to
    }
    return {jid: chatJid, nickName: chatNickName}
  }

  /**
    * 新着リストタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressedNewerList(item) {
    this._onPressKidoku(item)

    Common.saveOperationLog(_ScreenName, "ルームへ遷移", "")

    if (item.type === Const.cubee_message_feed) { // フィード
      Actions.company({
        method: "Room",
      })
    } else if (item.type === Const.cubee_message_chat) { // チャット
      var chatTarget = this._getChatTargetInfo(item)
      Actions.chat({
        jid: chatTarget.jid,
        nickname: chatTarget.nickName,
      })
    } else if (item.type === Const.cubee_message_groupchat) { // グループチャット
      Actions.groupchat({
        roomid: item.to,
        roomname: item.roomName,
      })
    } else if (item.type === Const.cubee_message_community) { // プロジェクト
      Actions.community({
        roomid: item.to,
        roomname: item.roomName,
      })
    }
  }

  /**
    * いいねタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressGoodJob(item) {
    this._onPressKidoku(item)

    Common.saveOperationLog(_ScreenName, "いいねタップ", "")

    if (CubeeAPI.isGoodJob(item.goodJobItems)) {
      Common.saveErrorLog(_ScreenName, "既にいいねしています", "")
      return
    }
    try {
      CubeeAPI.execGoodJob(item.itemId)
    }
    catch (e) {
      Common.saveErrorLog(_ScreenName, "いいねに失敗しました", e)
      return
    }

    var lst = this._fetch_items.slice()
    for ( var inx in lst ) {
      if ( lst[inx].id === item.id ) {
        // 人数
        lst[inx].goodJobCount = lst[inx].goodJobCount + 1

        // いいねリスト
        var goodjob = {}
        goodjob.fromJid = CubeeAPI.getUserJid()
        lst[inx].goodJobItems.push(goodjob)

        break
      }
    }

    var displaylist = lst.slice()
    if (this.state.filter_midoku) {
      displaylist = displaylist.filter(item => item.readFlg == 0)
    }

    const datasource = this._datasource.cloneWithRows(displaylist)

    this.setState({
      items: datasource,
    })

    this._fetch_items = lst

    Toast.show("いいねしました")
  }

  /**
    * いいね人数タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressGoodJobList(item) {
    Common.saveOperationLog(_ScreenName, "いいね人数タップ", "")

    Actions.userlist({
      usertype: 1,
      roomid: item.itemId,
    })
  }

  /**
    * 既読人数タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressKidokuList(item) {
    Common.saveOperationLog(_ScreenName, "既読人数タップ", "")

    Actions.userlist({
      usertype: 0,
      roomid: item.itemId,
    })
  }

  /**
    * 削除ボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressRemoveButton(item) {
    Common.saveOperationLog(_ScreenName, "削除ボタンタップ", "")

     if ( item.deleteFlag !== 0 ) {
       Common.saveErrorLog(_ScreenName, "既に削除されています", "")
       return
     }

     Alert.alert('確認', '削除してよろしいですか？',
       [
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => {

          try {
            CubeeAPI.deleteMessage(item.itemId)
          }
          catch (e) {
            Common.saveErrorLog(_ScreenName, "メッセージの削除に失敗しました", e)
            return
          }

          var lst = this._fetch_items.slice()
          for ( var inx in lst ) {
            if ( lst[inx].id === item.id ) {
              lst[inx].deleteFlag = 2
              lst[inx].body = "このメッセージは削除されました。"
              this._attaches[item.itemId] = null
              break
            }
          }

          var displaylist = lst.slice()
          if (this.state.filter_midoku) {
            displaylist = displaylist.filter(item => item.readFlg == 0)
          }

          const datasource = this._datasource.cloneWithRows(displaylist)

          this.setState({
            items: datasource,
          })

          this._fetch_items = lst
        }},
       ],
     { cancelable: false })
  }

  /**
    * 返信タップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressReplyButton(item) {
    this._onPressKidoku(item)

    Common.saveOperationLog(_ScreenName, "返信ボタンタップ", "")

    if (item.type === Const.cubee_message_feed) { // フィード
      Actions.company_reply({
        method: "Reply",
        itemid: item.itemId,
      })
    } else if (item.type === Const.cubee_message_chat) { // チャット
      var chatTarget = this._getChatTargetInfo(item)
      Actions.chat_reply({
        jid: chatTarget.jid,
        nickname: chatTarget.nickName,
        method: "Reply",
        itemid: item.itemId,
      })
    } else if (item.type === Const.cubee_message_groupchat) { // グループチャット
      Actions.groupchat_reply({
        roomid: item.to,
        roomname: item.roomName,
        method: "Reply",
        itemid: item.itemId,
      })
    } else if (item.type === Const.cubee_message_community) { // プロジェクト
      Actions.community_reply({
        roomid: item.to,
        roomname: item.roomName,
        method: "Reply",
        itemid: item.itemId,
      })
    }
  }

  /**
    * 会話を見るタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressKaiwaButton(item) {
    this._onPressKidoku(item)

    Common.saveOperationLog(_ScreenName, "会話を見るボタンタップ", "")

    if (item.type === Const.cubee_message_feed) { // フィード
      Actions.company_thread({
        method: "Kaiwa",
        itemid: item.itemId,
        roomname: 'フィード'
      })
    } else if (item.type === Const.cubee_message_chat) { // チャット
      var chatTarget = this._getChatTargetInfo(item)
      Actions.chat_thread({
        jid: chatTarget.jid,
        nickname: chatTarget.nickName,
        method: "Kaiwa",
        itemid: item.itemId,
      })
    } else if (item.type === Const.cubee_message_groupchat) { // グループチャット
      Actions.groupchat_thread({
        roomid: item.to,
        roomname: item.roomName,
        method: "Kaiwa",
        itemid: item.itemId,
      })
    } else if (item.type === Const.cubee_message_community) { // プロジェクト
      Actions.community_thread({
        roomid: item.to,
        roomname: item.roomName,
        method: "Kaiwa",
        itemid: item.itemId,
      })
    }
  }
}
const styles = StyleSheet.create({
  listBadge: {
    width: 16,
    height: 16,
    borderRadius: 16/2,
    backgroundColor: Const.midoku_mark_color,
    position: 'absolute', top: 2, left: 2,
  },
})
