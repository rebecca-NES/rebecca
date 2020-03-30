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

/*
 * メッセージ　画像のサムネイル
 */

'use strict'

import React, { Component } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Actions } from 'react-native-router-flux'

import Common from '../Common/Common'
import Const from '../Common/Const'

export default class Thumbnails extends Component<{}> {

  constructor(props) {
    super(props)
    this.state = {
      loadError: [],
    }
  }

  // 画像の読み込み失敗時の処理
  onError(index) {
    let { loadError } = this.state;
    loadError[index] = true;

    const _attaches = this.props.attaches;
    const item = this.props.item;
    console.log(`failed to load image. path: ${_attaches[item.itemId][index]}`)

    this.setState({loadError})
  }

  render() {
    const _attaches = this.props.attaches;
    const item = this.props.item;

    return (
      <View>
        {(()=>{
            let imageList = [];
            if (Array.isArray(_attaches[item.itemId]) && _attaches[item.itemId].length !== 0) {
              for (let i in _attaches[item.itemId]) {
                if (this.state.loadError[i]) {
                  imageList.push((
                    <View key = {i}>
                      <Text style={{color: 'red'}}>サムネイルの表示に失敗しました。</Text>
                    </View>
                  ));
                } else {
                  imageList.push((
                    <View style={{alignItems: 'center'}} key = {i}>
                      <TouchableOpacity onPress={this.props.onPressImage.bind(this, item, i)}>
                         <Image style={{ marginTop: 6, marginBottom: 6,
                                width: Const.preview_image_width, height: Const.preview_image_height}}
                                source={{uri: _attaches[item.itemId][i]}}
                                resizeMode="contain"
                                onError={ this.onError.bind(this, i) }/>
                       </TouchableOpacity>
                    </View>
                  ))
                }
              }
            }
            return imageList;
        })()}
      </View>
    )
  }
}
