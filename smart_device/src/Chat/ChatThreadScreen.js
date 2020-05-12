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

// Unused imports Component, React.
// import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux'

import Common from '../Common/Common'
import ChatScreen from '../Chat/ChatScreen'

const _ScreenName = "チャット画面"

export default class Thread extends ChatScreen<{}> {

  constructor() {
    super()
  }
  _onPressCloseButton() {
    Common.saveOperationLog(_ScreenName, "戻るボタンタップ", "")
    Actions.pop()
  }
  // Refresh event on RefreshControl
  _onRefresh() {
    Common.saveOperationLog(_ScreenName, "画面更新タップ", "")

    this.setState({loaded: false})
  }
}
