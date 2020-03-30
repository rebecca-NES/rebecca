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


'use strict'

import React, { Component } from 'react'
import {
  Platform,
  StyleSheet,
  View,
  Text,
  Alert,
  ScrollView,
  ListView,
  Image,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native'
import {
  Header,
  Button,
  SearchBar,
  FormLabel,
  FormInput,
  Avatar,
  Badge,
  Divider,
} from 'react-native-elements'
import {
    Actions,
} from 'react-native-router-flux'
import Icon from 'react-native-vector-icons/FontAwesome'

import ImagePicker from　'react-native-image-picker'
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
import MessageCommon from '../Common/Message'
import Thumbnails from '../Components/Thumbnails'

const NORMAL_MODE = 0
const REPLY_MODE = 1
const KAIWA_MODE = 2

const _ScreenName = "プロジェクト画面"

export default class CommunityScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {

    super()
    this.isSearchFocused = false
    this.isTouchable = true
    this._fetch_lastid = 0
    this._fetch_items = []
    this._filter_items = []
    this._display_items = []
    this._attaches = []
    this._fetching = false    // 読み込み処理中かどうか
    this._pop_return = true  //
    this._mode = NORMAL_MODE
    this.inputArea

    this._datasource = new ListView.DataSource({rowHasChanged: (row1, row2) => row1 !== row2})

    this.state = {
      refreshing: false,
      filter_text: '',
      itemId: '',        // 表示するItemID
      single: false,      // 単一メッセージ表示
      members: [],      // 投稿時の人選択リスト
      attach_filename: '',    // 添付ファイル名
      attach_source: '',      // 添付ファイル実態
      input_message:'',       // 入力文字列
      loaded: false,
      items: this._datasource,
      inputHeight:40,
    }
    this._onPressImage = this._onPressImage.bind(this);
  }

  /**
    * コンポーネントマウント直前処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async componentDidMount() {
    Common.saveOperationLog(_ScreenName, "画面表示", "")

    this._fetch_lastid = 0
    this._fetch_items = []
    this._attaches = []
    this._pop_return = true

    if (this.props.method === "Reply") {
      await this.setState({
        roomid: this.props.roomid,
        roomname: this.props.roomname,
        single: true,
        itemId: this.props.itemid,
        loaded: false,
        projectColor: this.props.projectColor,
      })
    } else if (this.props.method === "Kaiwa") {
      await this.setState({
        roomid: this.props.roomid,
        roomname: this.props.roomname,
        single: false,
        itemId: this.props.itemid,
        loaded: false,
      })
    } else {
      await this.setState({
        roomid: this.props.roomid,
        roomname: this.props.roomname,
        projectColor: this.props.projectColor,
        loaded: false,
      })
    }

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
  async componentWillReceiveProps(nextProps) {

    if (nextProps.method === "Member") {
      if ( nextProps.members.length > 0 ) {
        var msg = this.state.input_message
        for ( var inx in nextProps.members ) {
          if (msg) msg += " "
          msg += nextProps.members[inx]
        }

        this.setState({input_message: msg})
      }
    }
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {

    var headerTitle = Common.urldecode(this.state.roomname)
    var sendMessage = true
    // テーマカラーの設定
    var tabColor = Const.community_backcolor
    // プロジェクトカラーが設定されている場合はそちらに設定する
    if (this.state.projectColor) {
      tabColor = this.state.projectColor;
    }



    sendMessage = !this.isSearchFocused
    this._mode = NORMAL_MODE
    if (this.state.single) {
      headerTitle = "返信(" + headerTitle + ")"
      this._mode = REPLY_MODE
    } else if (this.state.itemId) {
      headerTitle = "会話(" + headerTitle + ")"
      sendMessage = false
      tabColor = Const.community_conversation_color
      this._mode = KAIWA_MODE
    }
    this.isTouchable = true

    return (
    <MenuProvider style={{flex: 1}}>
      <View style={{flex: 1, backgroundColor: Const.basic_backcolor}} >
        <View style={{flex: 1, justifyContent: 'flex-start'}}>

          <Header
            leftComponent={
              <Text
                style={{color: Const.chat_forecolor, padding:10, marginBottom:8, marginLeft:4}}
                onPress={() => this._onPressCloseButton()}
              >
                戻る
              </Text>
            }
            centerComponent={{ text: headerTitle, style: {textAlign:'center', color: Const.chat_forecolor,width:'65%', fontSize:16, fontWeight:'bold', marginBottom:15} }}
            rightComponent={<Text style={{opacity:0, padding:10, marginRight:4}}>戻る</Text>}
            outerContainerStyles={{
              backgroundColor: tabColor, padding:0,
              zIndex: 1, borderBottomWidth:0,
            }}
          />

          <ScrollView
            style={{flex: 1, marginTop: Const.headerbar_height}}
            refreshControl={
              <RefreshControl
                refreshing={this.state.refreshing}
                onRefresh={this._onRefresh.bind(this)}
              />
            }
            scrollEventThrottle={Const.scroll_event_throttle}
            onScroll={this._onScroll.bind(this)}
            >
            <View >
              {/*
                <View style={{marginTop: 10, marginBottom: 10}}>
                  <View style={{flexDirection: 'row'}}>
                    <View>
                      <Button
                        raised
                        buttonStyle={{borderRadius: 10, height: 30}}
                        textStyle={{textAlign: 'center', fontSize: 10}}
                        containerViewStyle={{backgroundColor: 'transparent'}}
                        title={`タイトル\n変更`}
                        icon={{name: 'settings', type: 'material-community', size: 20}}
                        onPress={() => this._onPressTitleChange()}
                      />
                    </View>
                    <View>
                      <Button
                        raised
                        buttonStyle={{borderRadius: 10, height: 30}}
                        textStyle={{textAlign: 'center', fontSize: 10}}
                        containerViewStyle={{backgroundColor: 'transparent'}}
                        title={`メンバー\n追加`}
                        icon={{name: 'user-plus', type: 'font-awesome', size: 20}}
                        onPress={() => this._onPressMemberAdd()}
                      />
                    </View>
                    <View>
                      <Button
                        raised
                        buttonStyle={{borderRadius: 10, height: 30}}
                        textStyle={{textAlign: 'center', fontSize: 10}}
                        icon={{name: 'user-times', type: 'font-awesome', size: 20}}
                        containerViewStyle={{backgroundColor: 'transparent'}}
                        title={`メンバー\n削除`}
                        onPress={() => this._onPressMemberDel()}
                      />
                    </View>
                  </View>
                </View>
              */}

              {(() => {
                if (!this.state.single) {
                  return (
                    <SearchBar
                      onChangeText={(text) => this._onChangeFilterText(text)}
                      onFocus={(event) => this._onFocusBar(event)}
                      onBlur={(event) => this._onBlurBar(event)}
                      placeholder='ユーザーごとにフィルタ'
                      inputStyle={{fontSize: Const.textinput_fontsize, height: Const.textinput_height, backgroundColor: Const.searchbar_color}}
                      containerStyle={{backgroundColor: Const.basic_backcolor, borderBottomWidth:0, borderTopWidth:0}}
                      lightTheme
                      clearIcon={{style:{padding:10, marginTop:-10, marginRight:-10}}}
                      value={this.state.filter_text}
                    />
                  )
                }
              })()}
            </View>

            {(() => {
              if (this.state.loaded || this.state.refreshing) {
                return (
                  <ListView
                    dataSource={this.state.items}
                    renderRow={this._renderListRow.bind(this)}
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
          </ScrollView>
        </View>

        {(() => {
          if (sendMessage) {
            return (
            <View style={{justifyContent: 'flex-end', backgroundColor: 'white', zIndex:2,
              borderColor: Const.basic_backcolor, borderWidth:1}} >

              <View style={{marginBottom: 10, flexDirection:'row'}} >

                <View style={{width: '80%'}} >
                  <FormInput
                    style={{marginTop: 10, fontSize: Const.textinput_fontsize,
                            height: this.state.inputHeight, textAlignVertical: 'top',
                            backgroundColor: '#f6f6f6',
                            paddingLeft: 12, paddingRight: 12, borderRadius:5}}
                    containerStyle={{borderBottomWidth:0}}
                    value={this.state.input_message}
                    placeholder="メッセージを入力"
                    keyboardType={'default'}
                    onChange={(msg) => this._onChangeInputMessage(msg)}
                    maxLength={999}
                    multiline
                    blurOnSubmit={false}
                    ref={input => this.inputArea = input}
                    onFocus={(event) => this._onFocusInput(event)}
                    onBlur={(event) => this._onBlurInput(event)}
                  />
                </View>

                <View style={{width: '20%', flexDirection: 'column', justifyContent: 'space-between',}} ><View />
                  <TouchableOpacity onPress={() => this._onSendMsgBtn()} style={{backgroundColor:Const.send_button_color, borderRadius:7, width:50, height:this.state.inputHeight, alignItems:'center', justifyContent: 'center'}}>
                    <Text style={{color:'white'}} >送信</Text>
                  </ TouchableOpacity>
                </View>

              </View>

              <View style={{marginBottom: 10, flexDirection:'row', display: this.state.inputHeight > 40 ? 'flex' : 'none'}} >

                {(() => {
                  if (!this.state.attach_source) {
                    return (
                      <View style={{paddingLeft: 24}}>
                        <Icon name='photo'
                          size={20}
                          style={{color: Const.send_button_color}}
                          onPress={() => this._onPhotoBtn()}
                        />
                      </View>
                    )
                  }
                })()}

                {(() => {
                  if (!this.state.attach_source) {
                    return (
                      <View style={{paddingLeft: 12}}>
                        <Icon name='camera'
                          size={20}
                          style={{color: Const.send_button_color}}
                          onPress={() => this._onCameraBtn()}
                        />
                      </View>
                    )
                  }
                })()}

                {(() => {
                  if (this.state.attach_source) {
                    return (
                      <View style={{paddingLeft: 24}}>
                        <Icon name='remove'
                          size={20}
                          style={{color: Const.send_button_color}}
                          onPress={() => this._onRemoveAttachBtn()}
                        />
                      </View>
                    )
                  }
                })()}

                {(() => {
                  if (this.state.attach_source) {
                    return (
                      <View style={{paddingLeft: 12, width:'40%'}}>
                        <Text style={{color: Const.send_button_color}} numberOfLines={1}>
                          {this.state.attach_filename}
                        </Text>
                      </View>
                    )
                  }
                })()}

                <View style={{paddingLeft: 24}}>
                  <Icon name='at'
                    size={20}
                    style={{color: Const.send_button_color}}
                    onPress={() => this._onPersonSelectBtn()}
                  />
                </View>

                <View style={{paddingLeft: 24}}>
                  <Text style={{color: Const.send_button_color}}>
                    {140 - Common.getInputMessageLength(this.state.input_message)}文字
                  </Text>
                </View>
              </View>
            </View>
            )
          }
        })()}
        {(() => {
          if (Platform.OS === 'ios'&& sendMessage) {
            return (
              <KeyboardAvoidingView behavior="padding" />)
          }
        })()}
      </View>
    </MenuProvider>
    )
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _renderListRow(item, sectionID, rowID) {

    var from = item.from
    var nickName = Common.urldecode(item.personInfo[from].nickName)
    var userName = "@" + Common.urldecode(item.personInfo[from].userName)
    var datetime = Common.convertDisplayDateTime(item.createdAt)

    if (item.type === Const.cubee_message_system) {
      nickName = Const.program_name
      userName = ""
    }

    var dispStyle = {
      borderColor: Const.basic_backcolor,
      borderTopWidth:4,
      backgroundColor: Const.parent_backcolor,
      padding: 10,
    }

    if (item.hasOwnProperty("isParent") && item.isParent === false) {
      dispStyle = {
        backgroundColor: Const.child_backcolor,
        padding: 10,
        paddingLeft:30,
      }
    }else if(rowID === '0'){
      dispStyle = {
        backgroundColor: Const.parent_backcolor,
        padding: 10,
      }
    }

    //削除されたメッセージの本文を変える
    var itemBody = CubeeAPI.getItemBody(item)

    var kidoku_num = "既読 0"
    var kidoku_color = Const.kidoku_mark_color
    if (item.readAllCount) {
      kidoku_num = "既読 " + item.readAllCount
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

      <View>
        {(() => {
        /*  if ( !this.state.itemId ) { //
            if ( item.replyId === "" ) { // 親か？ */
            if (this._mode === NORMAL_MODE && item._children_num && item._children_num > 1) {    // 子がいるか？
              if (item.parentId){
                return (
                <View  style={{backgroundColor: Const.child_backcolor, paddingLeft:62}}>
                  <TouchableOpacity
                    onPress={() => this._onPressThredOpenClose(item.parentId)}
                    style={{flexDirection: 'row', paddingTop:5}}>
                    <Icon name='reply'
                      size={20}
                      style={{color: Const.send_button_color}}
                    />
                    {
                      item.isOpen ?
                      <Text style={{color: Const.send_button_color, fontWeight:'bold', marginLeft:3, paddingTop:3}} >
                      古いコメントを非表示
                      </Text>
                    :
                      <Text style={{color: Const.send_button_color, fontWeight:'bold', marginLeft:3, paddingTop:3}} >
                      すべてのコメント({item._children_num}件)を表示
                      </Text>
                    }
                    <Icon name={item.isOpen ? 'angle-up' : 'angle-down'}
                      size={20}
                      style={{color: Const.send_button_color, marginLeft:3}}
                    />
                </TouchableOpacity>
              </View>
                )
              }
            }
        })()}
        <View style={dispStyle}>
            <TouchableOpacity onPress={this._onPressKidoku.bind(this, item)}>
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
                <View style={{justifyContent: 'center', paddingLeft: 12, paddingRight: 40}}>
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
                      {(() => {
                        if (this._mode !== REPLY_MODE) {
                          return (
                            <TouchableOpacity onPress={this._onPressReplyButton.bind(this, item)}
                              style={{backgroundColor:'white', marginRight:8, paddingLeft:8, paddingRight:8, paddingTop:3, paddingBottom:3, borderRadius:3, borderColor: Const.basic_backcolor, borderWidth:1}}>
                              <Icon name='reply'
                                size={20}
                                style={{color: Const.parent_forecolor,}}
                              />
                            </TouchableOpacity>
                          )
                        }
                      })()}

                      {(() => {
                        if (this._mode === NORMAL_MODE) {
                          return (
                            <TouchableOpacity onPress={this._onPressKaiwaButton.bind(this, item)}
                              style={{backgroundColor:'white', marginRight:8, paddingLeft:8, paddingRight:8, paddingTop:3, paddingBottom:3, borderRadius:3, borderColor: Const.basic_backcolor, borderWidth:1}}>
                              <Icon name='comments-o'
                                size={20}
                                style={{color: Const.parent_forecolor,}}
                              />
                            </TouchableOpacity>
                          )
                        }
                      })()}

                      <Menu>
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

            </TouchableOpacity>

          </View>
        </View>
    )
  }

  /**
    * リスト読み込み処理
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
      if (this.state.itemId) {
        this._fetch_items = []
        fetchlist = await CubeeAPI.fetchThreadList(this.state.itemId)
      } else {
        fetchlist = await CubeeAPI.fetchCommunityMessgae(this.state.roomid, this._fetch_lastid)
      }
    }
    catch (e) {
      Common.saveErrorLog(_ScreenName, "プロジェクトメッセージの取得に失敗しました", e)
    }

    await CubeeAPI.getAttaches(this._attaches, fetchlist, this._fetch_items, _ScreenName)

    this._filter_list()

    if (fetchlist.count > 0) {
      this._fetch_lastid = fetchlist.items[fetchlist.count - 1].id
    }

    this._fetching = false
  }

  /**
    * リストフィルター処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _filter_list() {

    var search = this.state.filter_text.toLowerCase()
    var message = this.state.input_message
    this._filter_items = []

    for (var item in this._fetch_items) {

      var from = this._fetch_items[item].from
      var nickName = Const.program_name.toLowerCase()
      var userName = ""

      if (this._fetch_items[item].type !== Const.cubee_message_system) {
        nickName = Common.urldecode(this._fetch_items[item].personInfo[from].nickName).toLowerCase()
        userName = Common.urldecode(this._fetch_items[item].personInfo[from].userName).toLowerCase()
      }

      if (nickName.search(search) !== -1 || userName.search(search) !== -1) {
        this._filter_items.push(this._fetch_items[item])
      }
    }

    if (this.state.single) {
      //単一表示
      this._display_items = []
      for (var item in this._filter_items) {
        if (this._filter_items[item].itemId === this.state.itemId) {
          this._display_items.push(this._filter_items[item])
          // message = "@" + this._filter_items[item].personInfo[this._filter_items[item].from].userName
          message = MessageCommon.getAccountsFromMessage(this._filter_items[item])
          break
        }
      }
    } else {
      //全件表示
      this._display_items = this._sortList()
    }

    this.setState({
      items: this.state.items.cloneWithRows(this._display_items),
      loaded: true,
      input_message: message,
      refreshing: false,
    })
    if (this.state.single && this.inputArea && this.inputArea.input) {
      this.inputArea.input.focus()
    } else if (!this.state.itemId && this.inputArea && this.inputArea.input) {
      this.inputArea.input.blur()
    }
  }

  /**
    * リスト並び替え処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _sortList() {

    var parentList = []
    var displayList = []

    this._filter_items.forEach(item => {
      item.isParent = true
      item.childrenLatestId = -1
      item._children_num = 0
    })

    if(this.state.filter_text === ""){
      //親リスト作成
      for (var item in this._filter_items) {
        if ( this._filter_items[item].replyId === "" ) {
          parentList.push(this._filter_items[item])
        } else {
          if ( this._searchId(this._filter_items[item].replyId) === 0 ) {
            parentList.push(this._filter_items[item])
          }else{
            this._filter_items[item].isParent = false  //親として扱う
          }
        }
      }

      // 最新の子リストitemIdを取得
      for ( var parent in parentList ) {
        var childlist = [] //このスレッドのリスト(ソート前)
        this._searchReplyId(childlist, parentList[parent].itemId)
        if(0 < childlist.length){
          parentList[parent].childrenLatestId = Math.max.apply(null, childlist.map(item => item.id))
        }else{
          parentList[parent].childrenLatestId = parentList[parent].id
        }
      }

      this.sortArrayParent(parentList)

      //親リストの下にreplyを追加
      for ( var parent in parentList ) {
        //まず親を追加
        displayList.push(parentList[parent])

        var childlist = [] //このスレッドのリスト(ソート前)
        this._searchReplyId(childlist, parentList[parent].itemId)

        this.sortArrayChild(childlist)

        //表示リストに追加
        if ( childlist.length > 0 ) {
          if (this.state.itemId) {
            childlist[childlist.length - 1].parentId = ""
            childlist[childlist.length - 1]._children_num = 0
            childlist[childlist.length - 1].isOpen = false
            childlist[0].parentId = parentList[parent].id
            childlist[0]._children_num = childlist.length
            childlist[0].isOpen = parentList[parent]._children_open
            displayList = displayList.concat(childlist)
          } else if (parentList[parent]._children_open) {
            childlist[childlist.length - 1].parentId = ""
            childlist[childlist.length - 1]._children_num = 0
            childlist[childlist.length - 1].isOpen = false
            childlist[0].parentId = parentList[parent].id
            childlist[0]._children_num = childlist.length
            childlist[0].isOpen = parentList[parent]._children_open
            displayList = displayList.concat(childlist)
          } else {
            childlist[0].parentId = ""
            childlist[0]._children_num = 0
            childlist[0].isOpen = false
            childlist[childlist.length - 1].parentId = parentList[parent].id
            childlist[childlist.length - 1]._children_num = childlist.length
            childlist[childlist.length - 1].isOpen = parentList[parent]._children_open
            displayList = displayList.concat(Object.assign({}, childlist[childlist.length - 1]))
          }
        }
      }
    }else{
      displayList = this._filter_items.slice()
    }

    return displayList
  }

  /**
    * 親リスト並び替え処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  sortArrayParent(array) {
    array.sort(function (a,b) {
      return b.childrenLatestId < a.childrenLatestId ? -1
           : b.childrenLatestId > a.childrenLatestId ? 1
           : 0
    })
  }

  /**
    * 子リスト並び替え処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  sortArrayChild(array) {
    array.sort(function (a,b) {
      return b.id < a.id ? 1
           : b.id > a.id ? -1
           : 0
    })
  }

  /**
    * 指定されたIDをReplyIdにもつものを探す
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _searchReplyId(ary, id) {
    for ( var inx in this._filter_items ) {
      if ( this._filter_items[inx].replyId === id ) {
        ary.push(this._filter_items[inx])
        this._searchReplyId(ary, this._filter_items[inx].itemId)
      }
    }
  }

  /**
    * 指定されたitemIDを探す
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _searchId(id) {
    for ( var inx in this._filter_items ) {
      if ( this._filter_items[inx].itemId === id ) {
        return this._filter_items[inx]
      }
    }
    return 0
  }

  /**
    * 投稿ボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onSendMsgBtn() {
    if(this.isTouchable){
      this.isTouchable = false
      Common.saveOperationLog(_ScreenName, "投稿ボタンタップ", "")

      if (this.state.input_message.length === 0) {
        Common.saveErrorLog(_ScreenName, "メッセージを入力してください。", "")
        this.isTouchable = true
        return
      }
      var messageLenght = Common.getInputMessageLength(this.state.input_message)
      if (messageLenght > Const.message_max_char) {
        Common.saveErrorLog(_ScreenName, "メッセージは140文字以下で入力してください。", "")
        this.isTouchable = true
        return
      }

      var attach_url = ''
      var input_message = this.state.input_message
      if (this.state.attach_source) {

        try {
          attach_url = await CubeeAPI.uploadAttachFile(
            this.state.attach_filename,
            this.state.attach_source)
        }
        catch (e) {
          Common.saveErrorLog(_ScreenName, "添付ファイルの書き込みに失敗しました", e)
          this.isTouchable = true
          return
        }

        input_message = input_message + " " + attach_url
      }

      var replyid = ''
      if (this.state.single) {
        replyid = this.state.itemId
      }

      try {
        await CubeeAPI.sendCommunityMessage(
          this.state.roomid,
          replyid,
          Common.urlencode(input_message))
      }
      catch (e) {
        Common.saveErrorLog(_ScreenName, "メッセージの書き込みに失敗しました", e)
        this.isTouchable = true
        return
      }

      if (this._pop_return && this._mode === REPLY_MODE) {
        Actions.pop()
        return
      }

      this._fetch_lastid = 0
      this._fetch_items = []
      this._attaches = []
      this._pop_return = true

      this.setState({
        single: false,
        itemId: '',
        input_message: '',
        loaded: false,
        attach_source: '',
        attach_filename: '',
        refreshing: true,
      })
    }
  }

  /**
    * 人選択ボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPersonSelectBtn() {
    Common.saveOperationLog(_ScreenName, "宛先選択ボタンタップ", "")

    Actions.member({
      membertype: 1,
      roomid: this.state.roomid,
      method: "Select",
      memberlist: [],
    })
  }

  /**
    * カメラボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onCameraBtn() {
    Common.saveOperationLog(_ScreenName, "カメラボタンタップ", "")

    // https://github.com/react-community/react-native-image-picker/blob/master/README.md
    let options = {
      cancelButtonTitle: 'キャンセル',
    }

    // カメラの起動
    ImagePicker.launchCamera(options, (response)  => {
      if (response.didCancel) {
        //Alert.alert("写真の撮影を中止しました。")
      } else if (response.error) {
        Common.saveErrorLog(_ScreenName, "写真の撮影でエラーが発生しました。", response.error)
      } else {
        var filename = Const.camera_file_name
        if (response.fileName) filename = response.fileName
        this.setState({
          attach_filename: filename,  // 添付ファイル名
          attach_source: response,   // 添付ファイル実態
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
    Common.saveOperationLog(_ScreenName, "写真ボタンタップ", "")

    // https://github.com/react-community/react-native-image-picker/blob/master/README.md
    let options = {
      cancelButtonTitle: 'キャンセル',
    }

    // 画像ライブラリオープン
    ImagePicker.launchImageLibrary(options, (response)  => {
      if (response.didCancel) {
        //Alert.alert("写真の選択を中止しました。")
      } else if (response.error) {
        Common.saveErrorLog(_ScreenName, "写真の選択でエラーが発生しました。", response.error)
      } else {
        var filename = Const.upload_file_name
        if (response.fileName) filename = response.fileName
        this.setState({
          attach_filename: filename,  // 添付ファイル名
          attach_source: response   // 添付ファイル実態
        })
      }
    })
  }

  /**
    * 添付削除ボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onRemoveAttachBtn() {
    Common.saveOperationLog(_ScreenName, "添付削除ボタンタップ", "")

    this.setState({
      attach_filename: "",  // 添付ファイル名
      attach_source: ""   // 添付ファイル実態
    })
  }

  /**
    * 投稿メッセージ入力処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onChangeInputMessage(msg) {
    this.setState({
      input_message : msg.nativeEvent.text
    })
  }

  /**
     * スレッド押下処理
     * @return 無し
     * @author CRAFT
     * @since 1.0
     */
  _onPressThredOpenClose(id) {
    Common.saveOperationLog(_ScreenName, "スレッド表示ボタンタップ", "")

    var lst = this._fetch_items.slice()
    for ( var inx in lst ) {
      if ( lst[inx].id === id ) {
        lst[inx]._children_open = !lst[inx]._children_open
        break
      }
    }
    this._fetch_items = lst

    this._filter_list()
  }

  /**
    * イメージ押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressImage(item, i) {
    Common.saveOperationLog(_ScreenName, "プレビュー表示ボタンタップ", "")

    this._onPressKidoku(item)
    Actions.preview({
      image: this._attaches[item.itemId][i]
    })
  }

  /**
    * 戻るボタンタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressCloseButton() {
    Common.saveOperationLog(_ScreenName, "戻るボタンタップ", "")

    if (this._pop_return) {
      if(Actions.currentScene === "community"){
        Actions.pop()
      }
    } else {
      this._onRefreshAll()
    }
  }

  /**
    * 返信ボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressReplyButton(item) {
    this._onPressKidoku(item)

    Common.saveOperationLog(_ScreenName, "返信ボタンタップ", "")

    Actions.community_reply({
      roomid: this.props.roomid,
      roomname: this.props.roomname,
      itemid: item.itemId,
      projectColor: this.props.projectColor,
      method: 'Reply'
    })
  }

  /**
    * 会話を見るボタン押下処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressKaiwaButton(item) {
    this._onPressKidoku(item)

    Common.saveOperationLog(_ScreenName, "会話を見るボタンタップ", "")

    Actions.community_thread({
      roomid: this.props.roomid,
      roomname: this.props.roomname,
      itemid: item.itemId,
      method: 'Kaiwa'
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

          var lst = this._display_items.slice()
          for ( var inx in lst ) {
            if ( lst[inx].id === item.id ) {
              lst[inx].deleteFlag = 2
              lst[inx].body = "このメッセージは削除されました。"
              this._attaches[item.itemId] = null
              break
            }
          }

          const datasource = this._datasource.cloneWithRows(lst)

          this.setState({
            items: datasource,
          })
          this._display_items = lst
        }},
       ],
     { cancelable: false })
  }

  /**
    * いいねタップ処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onPressGoodJob(item) {
    this._onPressKidoku(item)

    Common.saveOperationLog(_ScreenName, "いいねボタンタップ", "")

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

    var lst = this._display_items.slice()
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

    const datasource = this._datasource.cloneWithRows(lst)

    this.setState({
      items: datasource,
    })
    this._display_items = lst

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

    var lst = this._display_items.slice()
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

    const datasource = this._datasource.cloneWithRows(lst)

    this.setState({
      items: datasource,
    })
    this._display_items = lst

    //Toast.show("既読にしました")
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
    * 画面更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onRefresh() {
    Common.saveOperationLog(_ScreenName, "画面更新タップ", "")

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
      itemId: '',
    })
  }

  /**
    * 画面更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onRefreshAll() {

    this._fetch_lastid = 0
    this._fetch_items = []
    this._attaches = []
    this._pop_return = true

    this.setState({
      single: false,
      itemId: '',
      loaded: false,
    })
  }

  /**
    * 画面スクロール処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onScroll(event: Object) {

    if (this.state.itemId) {
      return
    }

    let currentOffsetY = Math.max(0, event.nativeEvent.contentOffset.y)
    let maximumOffset = event.nativeEvent.contentSize.height - event.nativeEvent.layoutMeasurement.height
    let distanceToBottom = maximumOffset - currentOffsetY

    if (distanceToBottom < Const.next_fetch_distance) {
        this._fetch_list()
    }
  }

  /**
    * ルーム名フィルター入力処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onChangeFilterText(text) {

    await this.setState({
      filter_text: text,
      loaded:false
    })

    this._filter_list()
  }

  /**
    * 検索エリアにフォーカスが当たった
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onFocusBar(event) {
    this.isSearchFocused = true
    this._filter_list()
  }

  /**
    * 検索エリアのフォーカスが外れた
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onBlurBar(event) {
    this.isSearchFocused = false
    this._filter_list()
  }

  /**
    * 検索エリアにフォーカスが当たった
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onFocusInput(event) {
    this.setState({
      inputHeight:80,
    })
  }

  /**
    * 送信エリアにフォーカスが当たった
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  _onBlurInput(event) {
    this.setState({
      inputHeight:40,
    })
  }

  /**
    * タイトル変更ボタンプレス処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressTitleChange() {
    Common.saveOperationLog(_ScreenName, "タイトル変更ボタンタップ", "")

    Actions.room({
      roomtype: "Community",
      roomid: this.state.roomid,
    })
  }

  /**
    * メンバー変更ボタンプレス処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressMemberAdd() {
    Common.saveOperationLog(_ScreenName, "メンバー変更ボタンタップ", "")

    Actions.member({
      membertype: 1,
      roomid: this.state.roomid,
      method: "Add",
      memberlist: [],
    })
  }

  /**
    * メンバー変更ボタンプレス処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  async _onPressMemberDel() {
    Common.saveOperationLog(_ScreenName, "メンバー変更ボタンタップ", "")

    Actions.member({
      membertype: 1,
      roomid: this.state.roomid,
      method: "Del",
      memberlist: [],
    })
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
