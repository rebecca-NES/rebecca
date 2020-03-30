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
  Image,
  Dimensions,
} from 'react-native'
import {
    Actions,
} from 'react-native-router-flux'
import {
  Header,
  Icon,
} from 'react-native-elements'
import ImageZoom from 'react-native-image-pan-zoom';

import Common from '../Common/Common'
import Const from '../Common/Const'
import CubeeAPI from '../Common/CubeeAPI'

const _ScreenName = "プレビュー画面"

/**
  * プレビュー画面処理
  * <pre>
  * プレビュー画面の制御を行う。
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class PreviewScreen extends Component<{}> {

  /**
    * コンストラクタ
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  constructor() {
    super()
    this.state = {
      winWidth: Dimensions.get('window').width,
      winHeight: Dimensions.get('window').height,
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

  onLayout() {
    this.setState({
      winWidth: Dimensions.get('window').width,
      winHeight: Dimensions.get('window').height,
    })
  }

  /**
    * 画面作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  render() {
    const winWidth = this.state.winWidth;
    const winHeight = this.state.winHeight;

    return (
      <View onLayout = {this.onLayout.bind(this)} style={{flex: 1, backgroundColor: Const.basic_backcolor}} >
        <View style = {{height: Const.statusbar_height, width: '100%',
          backgroundColor: Const.userList_backcolor, zIndex: 3,
          position: 'absolute', top: 0, left: 0}}
        />

        <Header
          leftComponent={
            <Text
              style={{color: Const.userlist_forecolor, padding:10, marginBottom:8, marginLeft:4}}
              onPress={() => this._onPressCancelButton()}
            >
              完了
            </Text>
          }
          centerComponent={{ text: "プレビュー", style: {textAlign:'center', color: Const.userlist_forecolor, width:'70%', fontSize:16, fontWeight:'bold', marginBottom:15} }}
          rightComponent={
            <Text style={{color: Const.userlist_forecolor, padding:10, marginBottom:8, marginLeft:4}}>　　</Text>
          }
          outerContainerStyles={{backgroundColor: Const.userList_backcolor, zIndex: 1, borderBottomWidth:0, padding:0}}
        />

        <View style={{marginTop: Const.headerbar_height}}>
            <ImageZoom cropWidth={winWidth}
                       cropHeight={winHeight - Const.headerbar_height}
                       imageWidth={winWidth}
                       imageHeight={winHeight - Const.headerbar_height}
                       style={{backgroundColor: '#000'}}>
                <Image style={{
                         width: winWidth,
                         height: winHeight - Const.headerbar_height,
                         justifyContent: 'center',
                         alignItems: 'center'
                       }}
                       resizeMode="contain"
                       source={{uri: this.props.image}}/>
            </ImageZoom>
        </View>
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
    if(Actions.currentScene === "preview"){
      Actions.pop()
    }
  }
}
