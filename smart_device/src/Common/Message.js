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
import Common from './Common'
import CubeeAPI from './CubeeAPI'

export default class MessageCommon {
  /*
   * 返信時に表示すべきアカウントの取得
   */
  static getAccountsFromMessage(msg) {
    if (!msg) {
      return '';
    }
    const from = msg.from;
    const personInfo = msg.personInfo;
    let accounts = [];

    // Get accout from sender
    const senderId = personInfo[from].userName;
    if (!this.isMyUserId(senderId)){
      accounts.push("@" + senderId);
    }
    // Get accounts from message body
    accounts = accounts.concat(this.getAccountsFromMessageBody(msg))

    let accountStr = Array.from(new Set(accounts)).join(" ");
    return accountStr ? accountStr + " " : accountStr;
  }

  /*
   * メッセージ本文中のアカウントを取得する
   */
  static getAccountsFromMessageBody(msg) {
    const _replyAccounts = [];
    const body = Common.urldecode(msg.body)
    const regExpForAccount = new RegExp('@([0-9A-Za-z]|-|[\'\'_.*!#$%&*+\\/=?^`{|}])+', 'g');
    const result = body.match(regExpForAccount)

    if (!result) {
      return [];
    }

    for (let i = 0; i < result.length; i++) {
      let _userId = result[i].replace(/(^[\s　]+)|([\s　]+$)/g, "");
      _userId = _userId.replace("@", "");
      if (!this.isMyUserId(_userId)) {
        _replyAccounts.push("@" + _userId);
      }
    }

    return _replyAccounts;
  }

  static isMyUserId(userId) {
    const userInfo = CubeeAPI.getLoginInfo().userInfo;
    return (userId && userInfo.name == userId)
  }
}
