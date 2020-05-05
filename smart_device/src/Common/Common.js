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
  AsyncStorage,
  Platform,
  Dimensions,
  PixelRatio,
  NetInfo,
} from 'react-native'
import DeviceInfo from 'react-native-device-info'
import {
  Avatar,
} from 'react-native-elements'

import Const from './Const'

var _operationLog = []
var _logNumber = 0
var _isLogging = false

/**
 * 汎用処理
 * <pre>
 * スマデバアプリ汎用処理
 * </pre>
 * @author CRAFT
 * @since 1.0
 */
export default class Common {

  /**
    * URL文字列にパスを結合する
    * @param url URL文字列
    * @param path パス文字列
    * @return 結合した文字列
    * @author CRAFT
    * @since 1.0
    */
  static addUrlPath (url, path) {
    if (url === null) {
      return path
    }
    else if (url.substr(-1) === '/') {
      return url + path
    }
    else {
      return url + '/' + path
    }
  }

  /**
    * URL文字列をエンコードする
    * @param set URL文字列
    * @return エンコード文字列
    * @author CRAFT
    * @since 1.0
    */
  static urlencode (str) {
    // http://locutus.io/php/url/urlencode/
    str = (str + '')
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%20/g, '+')
  }

  /**
    * URL文字列をデコードする
    * @param set URL文字列
    * @return デコード文字列
    * @author CRAFT
    * @since 1.0
    */
  static urldecode (str) {
    // http://locutus.io/php/url/urldecode/
    return decodeURIComponent((str + '')
      .replace(/%(?![\da-f]{2})/gi, function () {
        // PHP tolerates poorly formed escape sequences
        return '%25'
      })
      .replace(/\+/g, '%20'))
  }

  /**
    * 表示用の日時に変換する
    * @param datetime 日時文字列
    * @return 日時文字列
    * @author CRAFT
    * @since 1.0
    */
  static convertDisplayDateTime (datetime) {
    var dt = new Date(datetime)
    var now = new Date()

    if (dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate()) {
      var hour = dt.getHours()
      var min = ("0" + dt.getMinutes()).slice(-2)
      return "今日 " + hour + ":" + min
    }
    else {
      var hour = dt.getHours()
      var min = ("0" + dt.getMinutes()).slice(-2)
      var month = dt.getMonth() + 1
      var day = ("0" + dt.getDate()).slice(-2)
      return month + "/" + day + " " + hour + ":" + min
    }
  }

  /**
    * URLからからファイル名を取得する
    * @param url URL
    * @return ファイル名
    * @author CRAFT
    * @since 1.0
    */
  static getFileName (url) {
    var dot = url.split('/')
    var filename = (dot.length < 2) ? '' : dot[dot.length - 1]
    return filename
  }

  /**
    * ファイル名から拡張子を取得する
    * @param filename ファイル名
    * @return 拡張子
    * @author CRAFT
    * @since 1.0
    */
  static getExtensionName (filename) {
    var dot = filename.split('.')
    var extname = (dot.length < 2) ? '' : dot[dot.length - 1]
    return extname.toLowerCase()
  }

  /**
    * React-NativeのImageがサポートしているファイルタイプか
    * @param extname 拡張子
    * @return サポートしているか
    * @author CRAFT
    * @since 1.0
    */
  static isImageSupport(extname) {
    if (extname === 'png' || extname === 'jpg' || extname === 'jpeg' || extname === 'bmp' || extname === 'gif') {
      return true
    }

    return false
  }

  /**
    * 入力文字数カウント
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static getInputMessageLength(inputMessage) {
    var length = 0
    var check = 0
    for (var n = 0; n < inputMessage.length; n++) {
      if (inputMessage.substr(n, 1) === "@") {
        check = 1
      }
      if (inputMessage.substr(n, 7) === "http://" ||
        inputMessage.substr(n, 8) === "https://") {
        check = 1
      }
      else if ( inputMessage.substr(n, 1) === " " ||
                inputMessage.substr(n, 1) === "," ||
                inputMessage.substr(n, 1) === "\n" ||
                inputMessage.substr(n, 1) === "　"  ) {
        check = 0
        length++
      }
      else {
        if (check === 0) length++
      }
    }
    return length
  }

  /**
    * 操作ログ保存
    * @screen スクリーン名
    * @operaition 操作内容
    * @detail 操作詳細
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static saveOperationLog(screen, operaition, detail) {

    this.saveLog("operation", screen, operaition, detail)
  }

  /**
    * CubeeAPIログ保存
    * @level ログレベル
    * @operaition 操作内容
    * @detail 操作詳細
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static saveCubeeAPILog(level, request, detail) {

    var operaition = {}
    var content = {}

    content.type = request.content.type

    operaition.request = request.request
    operaition.id = request.id
    operaition.version = request.version
    operaition.content = content

    this.saveLog(level, "CubeeAPI", operaition, detail)
  }

  /**
    * CubeeAPIログ保存
    * @level ログレベル
    * @operaition 操作内容
    * @detail 操作詳細
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static saveCubeeFileLog(level, request, detail) {

    this.saveLog(level, "CubeeFile", request, detail)
  }

  /**
    * エラーログ保存
    * @operaition 操作内容
    * @detail 操作詳細
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static saveErrorLog(screen, operaition, detail) {

    Alert.alert(operaition, detail)
    this.saveLog("error", screen, operaition, detail)
  }

  /**
    * ログ保存
    * @level ログレベル
    * @unit ログブロック
    * @operaition 操作内容
    * @detail 操作詳細
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static saveLog(level, unit, operation, detail) {

    // ログ取得するか
    if (!_isLogging) return

    //　1回分の操作ログを作成
    var log = {}
    log.date = new Date
    log.level = level
    log.unit = unit
    log.operation = operation
    log.detail = detail

    // 操作ログ情報に貯める
    _operationLog[_logNumber] = log

    // 100回分保存するための処理
    _logNumber += 1
    if (_logNumber >= Const.max_operation_log) _logNumber = 0

    // ストレージに保存
    AsyncStorage.setItem("OperationLog", JSON.stringify(_operationLog))
    AsyncStorage.setItem("LogNumber", String(_logNumber))
  }

  /**
    * ログクリア
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static clearLog() {

    _logNumber = 0
    _operationLog = []

    this.saveOperationLog("ログクリア", "ログを消去しました。", "")
  }

  /**
    * 障害時ログログ保存
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async startupLog() {

    var ope = await AsyncStorage.getItem("OperationLog")
    var num = await AsyncStorage.getItem("LogNumber")

    if (ope !== null && num !== null) {
        _operationLog = JSON.parse(ope)
        _logNumber = Number(num)
    }

    _isLogging = await AsyncStorage.getItem("isLogging") === "true"

    this.saveOperationLog("アプリ起動", "ロギングを開始しました。", _logNumber)
  }

  /**
    * ロッギング有無情報設定
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static setIsLogging (isLogging) {

    _isLogging = isLogging

    this.saveOperationLog("ログ記録", "ログの記録を開始しました。", "")
  }

  /**
    * ロッギング有無情報設定
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static getIsLogging () {

    return _isLogging
  }

  /**
    * 端末情報取得
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static async getDevInfo() {

    var deviceInfo = {}
    deviceInfo.DeviceManufacturer = DeviceInfo.getManufacturer()
    deviceInfo.DeviceBrand = DeviceInfo.getBrand()
    deviceInfo.DeviceModel = DeviceInfo.getModel()
    deviceInfo.SystemName = DeviceInfo.getSystemName()
    deviceInfo.SystemVersion = DeviceInfo.getSystemVersion()
    deviceInfo.BundleID	 = DeviceInfo.getBundleId()
    deviceInfo.BuildNumber = DeviceInfo.getBuildNumber()
    deviceInfo.DeviceLocale = DeviceInfo.getDeviceLocale()
    deviceInfo.DeviceCountry = DeviceInfo.getDeviceCountry()
    deviceInfo.Timezone = DeviceInfo.getTimezone()
    deviceInfo.APILevel = DeviceInfo.getAPILevel()
    //deviceInfo.TotalMemory = DeviceInfo.getTotalMemory()
    //deviceInfo.MaxMemory = DeviceInfo.getMaxMemory()
    //deviceInfo.AppName = DeviceInfo.getApplicationName()

    var platform = {}
    platform = Platform

    var dimensions = {}
    dimensions.window = Dimensions.get('window')
    dimensions.screen = Dimensions.get('screen')

    var pixelRatio = {}
    pixelRatio.devicePixel = PixelRatio.get()
    pixelRatio.fontScale = PixelRatio.getFontScale()

    var netInfo = {}
    netInfo = await NetInfo.getConnectionInfo()

    var dev = {}
    dev.deviceInfo = deviceInfo
    dev.platform = platform
    dev.dimensions = dimensions
    dev.pixelRatio = pixelRatio
    dev.netInfo = netInfo

    return dev
  }

  /**
    * 操作ログ情報取得
    * @return 無し
    * @author CRAFT
    * @since 1.0
    */
  static getOperationLog() {

    return _operationLog
  }

  /**
    * アバター未設定の場合の要素を返却する
    * @param {string} str - アバターを生成する対象名。uridecode済の文字列を指定すること
    * @param {string} type - user or groupchat or project
    * @param {string} size - small or medium
    * @param {object} style - containerStyleへと設定するstyle情報を格納したオブジェクト
    * @return 表示するAvatar要素
    */
  static avatarCreate(str, type, size, style) {

    var displayName = "";
    if (type == 'user') {
      var reName = str.replace(/( | |　)+/g, ' ').replace(/^ /, '').replace(/ $/, '');
      // nicknameが空の場合、アバターも空で設定する
      if (!str) {
        displayName = "";
      } else if (reName.match(/( | |　)/)) {
        let names = reName.split(' ');
        displayName = Array.from(names[0])[0] + Array.from(names[1])[0];
      } else {
        // Variable chars is used like a local variable, but is missing a declaration.
        var chars = Array.from(reName);
        displayName = chars[0] + (1 < chars.length ? chars[1] : "");
      }
    } else {
      reName = str.replace(/( | )+/g, '');
      chars = Array.from(reName);
      displayName = chars[0];
    }

    var oct = '';
    var colorN = 0;
    var userColor = ['#e96363', '#e98463', '#e9a663', '#e9c763', '#b23333', '#b25333', '#b27333', '#b29233']
    var groupColor = ['#6379e9', '#639be9', '#63bce9', '#63dee9', '#3348b2', '#3368b2', '#3388b2', '#33a8b2']
    for (var i = 0; i < str.length; ++i) {
      var h = str.charCodeAt(i).toString(8);
      oct += h
    }
    for (var i = 0; i < oct.length; ++i) {
      colorN = Number(colorN) + Number(oct.substr(i, 1));
    }
    // 現在のreact-native-elementのバージョンではsize="<size>"のように大きさの指定が不可。
    // 入力された size = small or mediumで条件分岐して対応する
    if (size == "small") {
      if (type == "user") {
        return (
          <Avatar
            small
            rounded
            overlayContainerStyle={{backgroundColor: userColor[colorN % 8]}}
            title={displayName}
            containerStyle={style}
          />
        )
      } else {
        return (
          <Avatar
            small
            rounded
            overlayContainerStyle={{backgroundColor: groupColor[colorN % 8]}}
            title={displayName}
            containerStyle={style}
          />
        )
      }
    } else {
      if (type == "user") {
        return (
          <Avatar
            medium
            rounded
            overlayContainerStyle={{backgroundColor: userColor[colorN % 8]}}
            title={displayName}
            containerStyle={style}
          />
        )
      } else {
        return (
          <Avatar
            medium
            rounded
            overlayContainerStyle={{backgroundColor: groupColor[colorN % 8]}}
            title={displayName}
            containerStyle={style}
          />
        )
      }
    }
  }
}
