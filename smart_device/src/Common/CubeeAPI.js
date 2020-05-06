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
  Alert,
  Platform,
  Text,
  Linking,
} from 'react-native'
import {
  Actions,
} from 'react-native-router-flux'
import Icon from 'react-native-vector-icons/FontAwesome'
import RNFetchBlob from 'react-native-fetch-blob'

import Common from './Common'
import Const from './Const'

var _url = ''
var _tenant = ''
var _account = ''
var _password = ''
var _login = null
var _deviceId = null

/**
  * Cubee Web API処理
  * <pre>
  * Cubee Web APIのインターフェイス処理
  * </pre>
  * @author CRAFT
  * @since 1.0
  */
export default class CubeeAPI {

  /**
    * URL設定処理
    * @param  url   Cubee接続先URL
    * @param  tenant  テナント名
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static setUrl(url, tenant) {

    _url = url
    _tenant = tenant

    return
  }

  /**
    * URL取得処理
    * @return WebAPIのURL
    * @author CRAFT
    * @since 1.0
    */
  static getUrl() {
    if (!_tenant || _tenant === "") {
      return Common.addUrlPath(_url, 'asynchronous/')
    }
    else {
      return Common.addUrlPath(_url, 't/' + _tenant + '/asynchronous/')
    }
  }

  /**
    * ログイン情報設定処理
    * @param  account   アカウント名
    * @param  password  パスワード
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static setAccount(account, password) {
    _account = account
    _password = password
    return
  }

  /**
    * ログイン情報D取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static getLoginInfo() {
    return _login
  }

  /**
    * デバイスID設定処理
    * @param  deviceId   デバイスID
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static setDeviceId(deviceId) {

    _deviceId = deviceId

    return
  }

  /**
    * メッセージ内にあるURLを排除する
    * @return item アイテム情報
    * @author CRAFT
    * @since 1.0
    */
  static getItemBody (item) {

    // 削除メッセージ
    if ( item.deleteFlag != 0 ) {
      return Const.msg_deleted
    }

    var body = item.body

    var textList = []
    for (var n = 0; n < item.shortenUrlCount; n++) {
      const originalURL = item.shortenItems[n].OriginalURL
      const oriUrls = originalURL.split("+")
      const disUrls = item.shortenItems[n].DisplayedURL.split("+")

      for (var i in oriUrls){
        const oriUrl = oriUrls[i]
        const disUrl = disUrls[i]
        var arr = Common.urldecode(oriUrl).split("/")
        var filename = arr[arr.length-1]
        var extname = Common.getExtensionName(filename)
        if(-1 !== Common.urldecode(oriUrl).indexOf(_url) && Common.isImageSupport(extname)){ // 添付画像ファイル
            body = body.replace(oriUrl, "")
            continue
        }
        var index = body.indexOf(oriUrl)
        textList.push(
          <Text key = {10*n+i}>
            <Text>
              {Common.urldecode(body.substring(0, index))}
            </Text>
            {(() => {
              if (-1 !== Common.urldecode(oriUrl).indexOf(_url) && !Common.isImageSupport(Common.urldecode(oriUrl))) {
                return (
                  <Icon name='paperclip'
                    size={15}
                  />
                )
              }
            })()}
            <Text style={{color:Const.goodjob_mark_color, textDecorationLine:'underline'}}
              onPress={() => -1 !== Common.urldecode(oriUrl).indexOf(_url) ?
                Alert.alert('企業向けソーシャルプラットフォーム','サポートされていないファイル形式です',[{text: '閉じる'},]) :
                Linking.openURL(Common.urldecode(oriUrl))} >
              {-1 !== Common.urldecode(oriUrl).indexOf(_url) && !Common.isImageSupport(Common.urldecode(oriUrl))
                 ? Common.urldecode(filename) : Common.urldecode(disUrl)}
            </Text>
          </Text>
        )
        body = body.slice(index + oriUrl.length)
      }
    }

    textList.push(<Text key = {999}>
      <Text>
        {Common.urldecode(body)}
      </Text>
    </Text>)

  	return (textList)
  }

  /**
    * 添付画像ファイルを取得する
    * @return なし
    * @author CRAFT
    * @since 1.0
    */
  static async getAttaches (_attaches, fetchlist, _fetch_items, _ScreenName) {
    for (var key in fetchlist.items) {
      var item = fetchlist.items[key]
      _fetch_items.push(item)
      _attaches[item.itemId] = []

      if (item.shortenUrlCount !== 0) {
        for (var i = 0; i < item.shortenUrlCount; i++){
          const oriUrls = item.shortenItems[i].OriginalURL.split("+")
          for (var j = 0; j < oriUrls.length; j++){
            var extname = Common.getExtensionName(oriUrls[j])
            if (Common.isImageSupport(extname)) {
              try {
                if(_attaches[item.itemId].length == 0){
                  var data = await CubeeAPI.fetchAttachFile(oriUrls[j], item.itemId)
                  _attaches[item.itemId] = [data]
                }else{
                  var data = await CubeeAPI.fetchAttachFile(oriUrls[j], item.itemId)
                  _attaches[item.itemId].push(data)
                }
              }
              catch (e) {
                Common.saveErrorLog(_ScreenName, "添付ファイルの読み込みに失敗しました", e)
              }
            }
          }
        }
      }
    }
  }

  /**
    * 自身がいいねしたか取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static isGoodJob(items) {
    var find = false
    for (var key in items) {
      if (items[key].fromJid === _login.userInfo.jid) {
        find = true
      }
    }
    return find
  }

  /**
    * 削除可能なアイテムであるか判定処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static isRemoveItem(item) {

    // システムメッセージはだめ
    if ( item.type === Const.cubee_message_system ) {
      return false
    }
    // 自身の投稿ではない
    if ( item.from != _login.userInfo.jid ) {
      return false
    }
    // すでに削除すみ
    if ( item.deleteFlag != 0 ) {
       return false
    }
    return true
  }

  /**
    * 返信可能なアイテムであるか判定処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static isReplyItem(item) {

    // システムメッセージはだめ
    if ( item.type === Const.cubee_message_system ) {
      return false
    }
    return true
  }

  /**
    * 会話可能なアイテムであるか判定処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static isKaiwaItem(item) {

    // システムメッセージはだめ
    if ( item.type === Const.cubee_message_system ) {
      return false
    }
    return true
  }

  static getUserJid() {
    return _login.userInfo.jid
  }

  /**
    * ログイン処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async execLogin() {

    // 3.1.1 ログイン
    var request = {
      "request": "Login",
      "id": new Date().toString(),
      "version": 1,
      "content": {
        "user": _account,
        "password": _password
      }
    }

    try {
      Common.saveCubeeAPILog("operation", request, "")
      _login = await this._callCubeeAPI(request)
    }
    catch (e) {
      Common.saveCubeeAPILog("error", request, e)
      throw(e)
      return
    }

    if (_deviceId) {

      // 3.14.1 端末情報の登録
      var request = {
        "accessToken": _login.accessToken,
        "request": "SetLoginPersonData",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "RegisterDeviceInfo",
          "deviceId": _deviceId,
          "notificationService": Platform.OS === 'ios' ? 2 : 1,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        throw(e)
      }
    }
  }

  /**
    * ログアウト処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async execLogout() {

    if (_deviceId) {

      // 3.14.2 端末情報の削除
      var request = {
        "accessToken": _login.accessToken,
        "request": "SetLoginPersonData",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "DeleteDeviceInfo",
          "deviceId": _deviceId,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        //throw(e)
      }
    }

    // 3.1.2 ログアウト
    var request = {
      "accessToken": _login.accessToken,
      "request": "Logout",
      "id": new Date().toString(),
      "version": 1,
      "content": {
      }
    }

    try {
      Common.saveCubeeAPILog("operation", request, "")
      await this._callCubeeAPI(request)
    }
    catch (e) {
      Common.saveCubeeAPILog("error", request, e)
      //throw(e)
    }

    _login = null
  }

  /**
    * ユーザープロフィール情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async updateUserInfo(nickName, mailAddress, avatarType, avatarData) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // メモリ上も更新
      _login.userInfo.nickName = Common.urlencode(nickName)
      _login.userInfo.mailAddress = Common.urlencode(mailAddress)

      // 3.2.2 ログインユーザのプロフィール変更
      var request = {
        "accessToken": _login.accessToken,
        "request": "SetLoginPersonData",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type" : "Profile",
          "nickName" : Common.urlencode(nickName),
          "avatarType" : avatarType,
          "avatarData" : avatarData,
          "mailAddress" : Common.urlencode(mailAddress)
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * パスワード変更処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async updatepassword(oldpass, newpass) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.2.3 ログインユーザのパスワード変更
      var request = {
        "accessToken": _login.accessToken,
        "request": "SetLoginPersonData",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type" : "Password",
          "oldPassword" : oldpass,
          "newPassword" : newpass
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * ユーザープレゼンス情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async updateUserPresence(memo) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.2.4 プレゼンス変更
      var request = {
        "accessToken": _login.accessToken,
        "request": "SetLoginPersonData",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type" : "Presence",
          "presence" : 1,
          "myMemo" : Common.urlencode(memo)
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * ユーザー情報取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchUserInfo(id) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.2.5 ユーザ情報の取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetPersonList",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type" : "Search",
          "subType" : "AllUsers",
          "condition" : {
            "filter" : {
              "type" : "item",
              "name" : "jid",
              "value" : id
            },
            "sort" : {
              "item" : "jid",
              "order" : "1"
            }
          },
          "startId" : 0,
          "count" : 1
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * コンタクトリスト取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchContactList() {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.3.1 ログインユーザのコンタクトリスト取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetPersonList",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "ContactList",
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * チャット取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchChatList(partner, startId) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.5.1 チャット取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "Chat",
          "condition": {
            "partner": partner,
          },
          "startId": startId,
          "count": Const.page_per_item,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * チャット投稿処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async sendChatMessage(to, replyId, body) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.5.2 チャット投稿
      var request = {
        "accessToken": _login.accessToken,
        "request": "SendMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "Chat",
          "to": to,
          "body": body,
          "replyId": replyId,
          "attachedCount": 0,
          "attachedItems": [],
          "context": "",
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクト一覧取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchCommunityList(startId) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.2 参加プロジェクト一覧の取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "MyCommunityList",
          "startId": startId,
          "count": Const.page_per_item,
          "condition": {
            "sort": {
              "item": "updated_at",
              "order": "2",
            }
          }
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクト詳細情報取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchCommunityInfo(id) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.3 プロジェクトの詳細情報取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "CommunityInfo",
          "roomId": id,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクト詳細情報取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchCommunityMember(id) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.4 プロジェクトメンバ情報取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "CommunityMemberInfo",
          "roomId": id,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクト詳細情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async createCommunityRoom(name, desc) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.1 プロジェクトの作成
      var request = {
        "accessToken": _login.accessToken,
        "request": "CreateGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "CommunityRoom",
          "roomName": name,
          "description": desc,
          "privacyType": 2,
          "memberEntryType": 0,
          "logoUrl": "",
          "notifyType": 0,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクト詳細情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async addMemberCommunity(id, user) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.5 プロジェクトメンバ追加
      var request = {
        "accessToken": _login.accessToken,
        "request": "AddMember",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "CommunityRoom",
          "roomId": id,
          "count": user.length,
          "members": user,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクト詳細情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async delMemberCommunity(id, user) {
    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.6 プロジェクトメンバ削除
      var request = {
        "accessToken": _login.accessToken,
        "request": "RemoveMember",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "CommunityRoom",
          "roomId": id,
          "count": user.length,
          "members": user,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクト詳細情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async updateCommunityInfo(id, name, desc, logo) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.7 プロジェクト情報更新
      var request = {
        "accessToken": _login.accessToken,
        "request": "UpdateGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "CommunityRoomInfo",
          "roomId": id,
          "roomName": name,
          "description": desc,
          "privacyType": 2,
          "memberEntryType": 0,
          "logoUrl": logo,
          "notifyType": 0,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクト詳細情報取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchCommunityMessgae(messageid, startid) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.9 プロジェクトフィードメッセージ取得
      var request = {
        "accessToken":  _login.accessToken,
        "request": "GetMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
            "type": "Search",
            "condition": {
                "filter": {
                    "type": "and",
                    "value": [
                        {
                            "type": "item",
                            "name": "msgtype",
                            "value": 5
                        },
                        {
                            "type": "item",
                            "name": "msgto",
                            "value": messageid
                        }
                    ]
                },
                "sort": {
                    "item": "id",
                    "order": "2"
                }
            },
            "startId": startid,
            "count": Const.page_per_item
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * プロジェクトフィードメッセージ投稿処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async sendCommunityMessage(roomId, replyId, body) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.10.10 プロジェクトフィードメッセージ投稿投稿
      var request = {
        "accessToken": _login.accessToken,
        "request": "SendMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "Community",
          "roomId": roomId,
          "body": body,
          "replyId": replyId,
          "replyTo": "",
          "attachedCount": 0,
          "attachedItems": [],
          "context": "",
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * グループチャットリスト取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchGroupChatList(startId) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.9.2 チャットルーム一覧取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GroupChatRoomList",
          "startId": startId,
          "count": Const.page_per_item,
          "condition": {
            "sort": {
              "item": "updated_at",
              "order": "2",
            }
          }
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * グループチャット詳細情報取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchGroupChatInfo(id) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.9.3 チャットのルーム情報取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GroupChatRoomInfo",
          "roomId": id,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * グループチャット詳細情報作成処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async createGroupChatInfo(name, user) {

    // 自分もメンバーにする
    var user2 = []
    user2.push(_login.userInfo.jid)
    for (var key in user) {
      user2.push(user[key])
    }

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      //3.9.1 チャットルーム作成
      var request = {
        "accessToken": _login.accessToken,
        "request": "CreateGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GroupChatRoom",
          "roomName": name,
          "memberCount": user2.length,
          "memberItems": user2,
          "notifyType": 0,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * グループチャット詳細情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async updateGroupChatInfo(id, name) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.9.6 チャットのルーム情報更新
      var request = {
        "accessToken": _login.accessToken,
        "request": "UpdateGroup",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GroupChatRoomInfo",
          "extras": {
            "subType": ["ChangeRoomName"],
          },
          "roomId": id,
          "roomName": name,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * グループチャット詳細情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async addMemberGroupChat(id, user) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.9.4 チャットのメンバ追加
      var request = {
        "accessToken": _login.accessToken,
        "request": "AddMember",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GroupChatRoom",
          "roomId": id,
          "member": user,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * グループチャット詳細情報更新処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async delMemberGroupChat(id, user) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.9.5 チャットのメンバ削除
      var request = {
        "accessToken": _login.accessToken,
        "request": "RemoveMember",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GroupChatRoom",
          "removeType": "member",
          "roomId": id,
          "count": user.length,
          "members": user,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * グループチャット詳細情報取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchGroupChatMessgae(messageid, startid) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.9.7 グループチャットメッセージ取得
      var request = {
        "accessToken":  _login.accessToken,
        "request": "GetMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
            "type": "Search",
            "condition": {
                "filter": {
                    "type": "and",
                    "value": [
                        {
                            "type": "item",
                            "name": "msgtype",
                            "value": 3
                        },
                        {
                            "type": "item",
                            "name": "msgto",
                            "value": messageid
                        }
                    ]
                },
                "sort": {
                    "item": "id",
                    "order": "2"
                }
            },
            "startId": startid,
            "count": Const.page_per_item
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * グループチャットメッセージ投稿処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async sendGroupChatMessage(roomId, replyId, body) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.9.8 グループチャットメッセージ投稿
      var request = {
        "accessToken": _login.accessToken,
        "request": "SendMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GroupChat",
          "roomId": roomId,
          "body": body,
          "replyId": replyId,
          "replyTo": "",
          "attachedCount": 0,
          "attachedItems": [],
          "context": "",
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * 新着リスト取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchNewerList(startId) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.x.x xxxxxxx
      var request = {
        "accessToken": _login.accessToken,
          "request": "GetMessage",
          "id": new Date().toString(),
          "version": 1,
          "content": {
              "type": "Search",
              "condition": {
                  "filter": {
                      "type": "or",
                      "value": [
                          {
                              "type": "and",
                              "value": [
                                  {
                                      "type": "item",
                                      "name": "msgtype",
                                      "value": 1
                                  },
                                  {
                                      "type": "keyword",
                                      "value": "%40" + _login.userInfo.name,
                                      "include": []
                                  }
                              ]
                          },
                          {
                              "type": "and",
                              "value": [
                                  {
                                      "type": "item",
                                      "name": "msgtype",
                                      "value": 2
                                  },
                                  {
                                      "type": "or",
                                      "value": [
                                          {
                                              "type": "item",
                                              "name": "msgfrom",
                                              "value": _login.userInfo.jid
                                          },
                                          {
                                              "type": "item",
                                              "name": "msgto",
                                              "value": _login.userInfo.jid
                                          }
                                      ]
                                  }
                              ]
                          },
                          {
                              "type": "item",
                              "name": "msgtype",
                              "value": 3
                          },
                          {
                              "type": "and",
                              "value": [
                                  {
                                      "type": "item",
                                      "name": "msgtype",
                                      "value": 4
                                  },
                                  {
                                      "type": "item",
                                      "name": "owner",
                                      "value": _login.userInfo.jid
                                  },
                                  {
                                      "type": "and",
                                      "value": [
                                          {
                                              "type": "not",
                                              "value": {
                                                  "type": "item",
                                                  "name": "status",
                                                  "value": 1
                                              }
                                          },
                                          {
                                              "type": "or",
                                              "value": [
                                                  {
                                                      "type": "not",
                                                      "value": {
                                                          "type": "item",
                                                          "name": "status",
                                                          "value": 2
                                                      }
                                                  },
                                                  {
                                                      "type": "item",
                                                      "name": "parent_item_id",
                                                      "value": ""
                                                  }
                                              ]
                                          }
                                      ]
                                  }
                              ]
                          },
                          {
                              "type": "and",
                              "value": [
                                  {
                                      "type": "item",
                                      "name": "msgtype",
                                      "value": 4
                                  },
                                  {
                                      "type": "item",
                                      "name": "owner",
                                      "value": _login.userInfo.jid
                                  },
                                  {
                                      "type": "or",
                                      "value": [
                                          {
                                              "type": "item",
                                              "name": "status",
                                              "value": 1
                                          },
                                          {
                                              "type": "and",
                                              "value": [
                                                  {
                                                      "type": "item",
                                                      "name": "status",
                                                      "value": 2
                                                  },
                                                  {
                                                      "type": "not",
                                                      "value": {
                                                          "type": "item",
                                                          "name": "parent_item_id",
                                                          "value": ""
                                                      }
                                                  }
                                              ]
                                          }
                                      ]
                                  }
                              ]
                          },
                          {
                              "type": "item",
                              "name": "msgtype",
                              "value": 5
                          },
                          {
                              "type": "item",
                              "name": "msgtype",
                              "value": 9
                          }
                      ]
                  },
                  "sort": {
                      "item": "id",
                      "order": "2"
                  }
              },
              "startId": startId,
              "count": Const.page_per_item
          }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * ウオッチリスト取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchWatchList(startId) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.x.x xxxxx
      var request = {
          "accessToken": _login.accessToken,
          "request": "GetMessage",
          "id": new Date().toString(),
          "version": 1,
          "content":{
            "type":"Search",
            "condition":{
              "filter":{
                "type":"or",
                "value":[
                  {
                    "type":"and",
                    "value":[
                      {
                        "type":"item",
                        "name":"msgtype",
                        "value":1
                      },
                      {
                        "type":"keyword",
                        "value":"%40" + _login.userInfo.name,
                        "include":[]
                      }
                    ]
                  },
                  {
                    "type":"and",
                    "value":[
                      {
                        "type":"item",
                        "name":"msgtype",
                        "value":4
                      },
                      {
                        "type":"item",
                        "name":"owner",
                        "value":_login.userInfo.jid
                      },
                      {
                        "type":"and",
                        "value":[
                          {
                            "type":"not",
                            "value":{
                              "type":"item",
                              "name":"status",
                              "value":1
                            }
                          },
                          {
                            "type":"or",
                            "value":[
                              {
                                "type":"not",
                                "value":{
                                  "type":"item",
                                  "name":"status",
                                  "value":2
                                }
                              },
                              {
                                "type":"item",
                                "name":"parent_item_id",
                                "value":""
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type":"and",
                    "value":[
                      {
                        "type":"item",
                        "name":"msgtype",
                        "value":4
                      },
                      {
                        "type":"item",
                        "name":"owner",
                        "value":_login.userInfo.jid
                      },
                      {
                        "type":"or",
                        "value":[
                          {
                            "type":"item",
                            "name":"status",
                            "value":1
                          },
                          {
                            "type":"and",
                            "value":[
                              {
                                "type":"item",
                                "name":"status",
                                "value":2
                              },
                              {
                                "type":"not",
                                "value":{
                                  "type":"item",
                                  "name":"parent_item_id",
                                  "value":""
                                }
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type":"item",
                    "name":"msgtype",
                    "value":9
                  },
                  {
                    "type":"and",
                    "value":[
                      {
                        "type":"item",
                        "name":"msgtype",
                        "value":5
                      },
                      {
                        "type":"keyword",
                        "value":"%40" + _login.userInfo.name,
                        "include":[]
                      }
                    ]
                  },
                  {
                    "type":"and",
                    "value":[
                      {
                        "type":"item",
                        "name":"msgtype",
                        "value":2
                      },
                      {
                        "type":"or",
                        "value":[
                          {
                            "type":"item",
                            "name":"msgfrom",
                            "value":_login.userInfo.jid
                          },
                          {
                            "type":"item",
                            "name":"msgto",
                            "value":_login.userInfo.jid
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type":"and",
                    "value":[
                      {
                        "type":"item",
                        "name":"msgtype",
                        "value":3
                      },
                      {
                        "type":"keyword",
                        "value":"%40" + _login.userInfo.name,
                        "include":[]
                      }
                    ]
                  }
                ]
              },
              "sort":{
                "item":"id",
                "order":"2"
              }
            },
            "startId":startId,
            "count":Const.page_per_item
          }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * カンパニーリスト取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchCompanyList(startId) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.x.x xxxxx
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "MyFeed",
          "startId": startId,
          "count": Const.page_per_item,
          "condition": {}
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * スレッドリスト取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchThreadList(itemId) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.x.x xxxxx
      var request = {
        "accessToken": _login.accessToken,
        "request": "GetMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "Thread",
          "itemId": itemId
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * カンパニー投稿処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async sendCompanyMessage(replyId, body) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.4.2 フィード投稿
      var request = {
        "accessToken": _login.accessToken,
        "request": "SendMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "Public",
          "body": body,
          "replyId": replyId,
          "attachedCount": 0,
          "attachedItems": [],
          "context": "",
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * メッセージ削除処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async deleteMessage(itemId) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.11.2 メッセージの削除
      var request = {
        "accessToken": _login.accessToken,
        "request": "DeleteMessage",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "Delete",
          "itemId": itemId,
          "deleteFlag": 2,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * GoodJob要求処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async execGoodJob(id) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.8.1 Good Job 要求
      var request = {
        "accessToken": _login.accessToken,
        "request": "MessageOption",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "AddGoodJob",
          "itemId": id,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * GoodJobユーザー取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchGoodJobList(id) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.8.2 Good job したユーザ取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "MessageOption",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GetGoodJobList",
          "itemId": id,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * 既読要求処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async execKidoku(id) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.13.2 既読要求
      var request = {
        "accessToken": _login.accessToken,
        "request": "MessageOption",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "SetReadMessage",
          "itemCount": 1,
          "items": [{
            "itemId": id,
          }]
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * 既読ユーザー取得処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async fetchKidokuList(id) {

    // 認証セッション切れを考えリトライする
    for (var counter = 0; counter < 2; counter++) {

      // 認証セッション切れていたら、再度ログイン
      if (_login === null) {
        try {
          await this.execLogin()
        }
        catch (e) {
          throw(e)
        }
      }

      // 3.13.1 既読情報の取得
      var request = {
        "accessToken": _login.accessToken,
        "request": "MessageOption",
        "id": new Date().toString(),
        "version": 1,
        "content": {
          "type": "GetExistingReaderList",
          "itemId": id,
        }
      }

      try {
        Common.saveCubeeAPILog("operation", request, "")
        return await this._callCubeeAPI(request)
      }
      catch (e) {
        Common.saveCubeeAPILog("error", request, e)
        if (counter === 0) continue
        throw(e)
      }
    }
  }

  /**
    * Cubee WabAPI呼び出し処理
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async _callCubeeAPI (request) {
    var url = CubeeAPI.getUrl()
    var header = {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request)
    }
    var result

    try {
      result = await fetch(url, header)
    }
    catch(e) {
      Common.saveCubeeAPILog("error", request, e)
      throw "サーバからの応答がありません。しばらくたってから再度実施してください。(" + e + ")"
    }
    if (result.status != 200) {
      Common.saveCubeeAPILog("error", request, result)
      throw "サーバからの応答がありません。しばらくたってから再度実施してください。(status=" + result.status + ")"
    }

    const responce = await result.json()
    if (responce.errorCode != 0) {
      if (responce.errorCode === 9) {
        _login = null
      }
      throw "サーバからの応答がありません。しばらくたってから再度実施してください。(code=" + responce.errorCode + ")"
    }
    if (!responce.content.result) {
      if (responce.content.reason === 4){
        throw "認証に失敗しました。テナント名、アカウント名またはパスワードが正しくありません。(reason=" + responce.content.reason + ")"
      } else if (responce.content.reason === 403000) {
        throw "この機能の利用権限がありません。(reason=" + responce.content.reason +")"
      }
      throw "サーバからの応答がありません。しばらくたってから再度実施してください。(reason=" + responce.content.reason + ")"
    }

    return responce.content
  }

  /**
    * Cubee ファイルダウンロード呼び出し処理
    * @param download ダウンロードURL
    * @param id アイテムID
    * @return ファイル
    * @author CRAFT
    * @since 1.0
    */
  static async fetchAttachFile(download, id) {
    if(-1 !== Common.urldecode(download).indexOf(_url)){
      var url = Common.addUrlPath(_url, 'filedownload/')
      var header = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
      var body = "downloadURL=" + download
      body += "&accesstoken=" + _login.accessToken
      body += "&itemId=" + id

      try {
        Common.saveCubeeFileLog("operation", "download", download)
        // Variable result is used like a local variable, but is missing a declaration.
        var result = await RNFetchBlob
          .config({fileCache : true, session: "download",appendExt: Common.getExtensionName(download)})
          .fetch("POST", url, header, body)
      } catch(e) {
        Common.saveCubeeFileLog("error", "download", e)
        throw "サーバからの応答がありません。しばらくたってから再度実施してください。(" + e + ")"
      }
      if (result.respInfo.status != 200) {
        Common.saveCubeeFileLog("error", "download", result)
        throw "サーバからの応答がありません。しばらくたってから再度実施してください。(status=" + result.respInfo.status + ")"
      }
      return Platform.OS === 'android' ? 'file://' + result.path() : '' + result.path()
    }else{
      return Common.urldecode(download)
    }

  }

  /**
    * Cubee ファイルダウンロード呼び出し処理
    * @param download ダウンロードURL
    * @param id アイテムID
    * @return ファイル
    * @author CRAFT
    * @since 1.0
    */
  static async uploadAttachFile(uploadname, uploadfile) {

    var url = Common.addUrlPath(_url, 'fileupload/')
    const ERROR = "サーバからの応答がありません。しばらくたってから再度実施してください。"

    try {
      Common.saveCubeeFileLog("operation", "upload", uploadname)
      let response = '';
      let responseStatus = '';

      // iOSはシングルテナント環境下で画像を送信できない為、fetchを使用している。
      // androidはfetchを使用すると環境によっては接続ができなくなるようなので
      // RNFetchBlobモジュールを使用してリクエストを送信する。
      // https://github.com/facebook/react-native/issues/10404
      if (Platform.OS === 'ios') {
        var data = new FormData()
        data.append('accesstoken', _login.accessToken)
        data.append('uploadfile', {uri: uploadfile.uri, name: uploadname});

        response = await fetch(url, {
          method: 'POST',
          body: data
        })
        responseStatus = response.status;

      } else if (Platform.OS === 'android') {
        var header = {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
        var body = [
          { name: 'accesstoken', data: _login.accessToken },
          { name: 'uploadfile', filename: uploadname, data: uploadfile.data }
        ]
        response = await RNFetchBlob.fetch("POST", url, header, body)
        responseStatus = response.respInfo.status;
      }

      if (responseStatus != 200) {
        Common.saveCubeeFileLog("error", "upload", response)
        throw ERROR + "(status=" + response.status + ")"
      }

      let responseJson = await response.json();
      if (responseJson.result != 'success') {
        Common.saveCubeeFileLog("error", "upload", responseJson)
        throw ERROR + "(status=" + responseJson.result+ ")"
      }
      return Common.addUrlPath(_url, responseJson.path)

    } catch(e) {
      Common.saveCubeeFileLog("error", "upload", e)
      throw ERROR + "(" + e + ")"
    }

  }
}
