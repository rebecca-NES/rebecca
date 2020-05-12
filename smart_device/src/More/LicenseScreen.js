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
import { View, Text, ScrollView } from 'react-native'
// Unused imports FormInput, FormLabel.
// import { Header, FormLabel, FormInput } from 'react-native-elements'
import { Header } from 'react-native-elements'
import { Actions } from 'react-native-router-flux'

import Common from '../Common/Common'
import Const from '../Common/Const'
import License from '../Common/Licenses'

const _ScreenName = "License"

export default class LicenseScreen extends Component<{}> {

  constructor() {
    super()
  }

  async componentDidMount() {
    Common.saveOperationLog(_ScreenName, "画面表示", "")
  }

  _onPressCancelButton() {
    Common.saveOperationLog(_ScreenName, "キャンセルボタンタップ", "")
    Actions.pop()
  }

  render() {
    return (
      <View style={{flex: 1, backgroundColor: Const.basic_backcolor_light}} >
        <Header
          leftComponent={
            <Text style={{color: Const.profile_forecolor, padding:10, marginBottom:8, marginLeft:4}}
                  onPress={() => this._onPressCancelButton()}>戻る</Text>}
          centerComponent={{
            text: "著作権情報",
            style: {
              textAlign:'center',
              color: Const.profile_forecolor,
              width:'65%',
              fontSize:16,
              fontWeight:'bold',
              marginBottom:15} }}
          outerContainerStyles={{backgroundColor: Const.profile_backcolor, zIndex: 1, borderBottomWidth:0, padding:0}}
        />
        <ScrollView style={{flex: 1, marginTop: Const.headerbar_height}}>
           <Text>{License.contents}</Text>
        </ScrollView>
      </View>
    )
  }
}
