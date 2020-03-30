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


/**
* 汎用チェック処理
* <pre>
* スマデバアプリ汎用チェック処理
* </pre>
* @author CRAFT
* @since 1.0
*/
export default class Validation {

  /**
    * アカウント名の入力チェック
    * @param account アカウント名
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isAccount (account) {
    if (account === null) {
      return false
    }
    if (account.length === 0) {
      return false
    }
    return true
  }

  /**
    * パスワードの入力チェック
    * @param password パスワード
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isPassword (password) {
    if (password === null) {
      return false
    }
    if (password.length === 0) {
      return false
    }
    return true
  }

  /**
    * 接続先urlの入力チェック
    * @param password 接続先url
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isCubeeurl (cubeeurl) {
    if (cubeeurl === null) {
      return false
    }
    if (cubeeurl.length === 0) {
      return false
    }
    var reg = /^(http|https):\/\/[^ "]+$/
    if (!reg.test(cubeeurl)) {
      return false
    }
    return true
  }

  /**
    * テナント名の入力チェック
    * @param tenant テナント名
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isTenant (tenant) {
    if (tenant === null) {
      return false
    }
    if (tenant.length === 0) {
      return false
    }
    return true
  }

  /**
    * メールアドレスの入力チェック
    * @param email メールアドレス
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isEmail (email, require=true) {
    if ((email === null || email.length === 0)
        && !require) {
      return true
    }
//  const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
//  const reg = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    const reg = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!reg.test(email)) {
      return false
    }
    return true
  }

  /**
    * ルーム名の入力チェック
    * @param roomname ルーム名
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isRoomname (roomname) {
    if (roomname === null) {
      return false
    }
    if (roomname.length === 0) {
      return false
    }
    return true
  }

  /**
    * ルームメンバーの入力チェック
    * @param roomuser[] ルームメンバー
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isRoomuser (roomuser) {
    if (roomuser === null) {
      return false
    }
    if (roomuser.length === 0) {
      return false
    }
    return true
  }

  /**
    * プロファイルニックネームの入力チェック
    * @param name ニックネーム
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isProfileName (name) {
    if (name === null) {
      return false
    }
    if (name.length === 0) {
      return false
    }
    return true
  }

  /**
    * プロファイルメモの入力チェック
    * @param memo メモ
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isProfileMemo (memo) {
    if (memo === null) {
      return false
    }
    return true
  }

  /**
    * 新パスワードの入力チェック
    * @param password1 パスワード1
    * @param password2 パスワード2
    * @return true=有効、false=無効
    * @author CRAFT
    * @since 1.0
    */
  static isNewPassword (password1, password2) {
    if (password1 === null) {
      return false
    }
    if (password1.length < 8) {
      return false
    }
    if (password1 != password2) {
      return false
    }
    return true
  }
}
