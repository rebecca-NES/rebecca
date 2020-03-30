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
  Platform,
} from 'react-native'

export default {

  // プログラム名
  program_name: 'Social Platform for the enterprise',

  // 基本背景色
  basic_backcolor: '#c3c5ca',
  basic_backcolor_light: '#f6f6f6',

  // タブバー
  tabbar_iconcolor: '#444444',
  tabbar_active_color: '#444444',
  tabbar_inactive_color: '#444444',
  tabbar_active_backcolor: '#72c7ff',
  tabbar_inactive_backcolor: '#eeeeee',

  // メッセージ色
  child_backcolor: '#eeeeee',
  child_forecolor: '#444444',
  parent_backcolor: '#ffffff',
  parent_forecolor: '#444444',

  // ホーム画面
  home_backcolor: '#1f7abe',
  home_forecolor: '#ffffff',
  home_item_backcolor: '#f1f1f1',
  home_item_forecolor: '#aaaaaa',

  // 新着画面
  newer_backcolor: '#da5367',
  newer_forecolor: '#ffffff',

  // チャット画面
  chat_backcolor: '#7e1e85',
  chat_forecolor: '#ffffff',
  chat_conversation_color: '#f9c10f',

  // プロジェクト画面
  community_backcolor: '#187bce',
  community_forecolor: '#ffffff',
  community_conversation_color: '#f9c10f',

  // グループチャット画面
  groupchat_backcolor: '#7e1e85',
  groupchat_forecolor: '#ffffff',
  groupchat_conversation_color: '#f9c10f',

  // カンパニー画面
  company_backcolor: '#376eb1',
  company_forecolor: '#ffffff',
  company_conversation_color: '#f9c10f',

  // その他画面
  more_backcolor: '#3d6dcc',
  more_forecolor: '#ffffff',

  // アプリ設定画面
  setting_backcolor: '#3d6dcc',
  setting_forecolor: '#ffffff',

  // ルーム設定画面
  room_backcolor: '#3d6dcc',
  room_forecolor: '#ffffff',

  // メンバー設定画面
  member_backcolor: '#3d6dcc',
  member_forecolor: '#ffffff',

  // プロフィール画面
  profile_backcolor: '#007bca',
  profile_forecolor: '#ffffff',
  profile_testcolor: '#a4a4a4',

  // ユーザー一覧画面
  userList_backcolor: '#3d6dcc',
  userlist_forecolor: '#ffffff',
  userlist_msgbackcolor:  '#ffffff',
  userlist_msgforecolor:  '#888888',

  // マーク
  midoku_mark_color: '#2196f3',
  kidoku_mark_color: '#2196f3',
  goodjob_mark_color: '#2196f3',

  // メッセージ投稿画面
  send_button_color:  '#2196f3',

  // ぐるぐるマーク
  activity_indicator_color: '#3d6dcc',

  // 投稿メッセージの最大文字数
  message_max_char: 140,

  // ページ内表示アイテム数
  page_per_item:  10,

  next_fetch_distance: 400,
  scroll_event_throttle: 500,

  // ステータスバー
  statusbar_height: Platform.select({ios: 20, android: 0}),

  // ヘッダーバー
  headerbar_height: 70,

  // TextInput (FormInput)
  textinput_fontsize: 16,
  textinput_height: Platform.select({ios: 32, android: 44}),

  // プレビュー画像サイズ
  preview_image_width:  250,
  preview_image_height: 200,

  // Cubeeメッセージ種別
  cubee_message_feed: 1,      //フィード
  cubee_message_chat: 2,      // チャット
  cubee_message_groupchat: 3, // グループチャット
  cubee_message_community: 5, // プロジェクト
  cubee_message_system: 6,    // システムメッセージ

  // 削除されたメッセージ
  msg_deleted: 'このメッセージは削除されました。',

  // 写真撮影ファイル名
  camera_file_name: "photo.jpg",
  upload_file_name: "upload.jpg",

  // 操作ログ
  max_operation_log:  100,

  // SearchBarの色
  searchbar_color: '#ffffff',

  // 透明
  transparent_color:'#00000000',
}
