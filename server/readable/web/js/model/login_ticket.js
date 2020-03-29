/*
Copyright 2020 NEC Solution Innovators, Ltd.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

function LoginTicket() {
};(function() {

  LoginTicket.read = function () {
    var loginTicket = localStorage.getItem(LoginView.URI_PARAM_LOGIN_TICKET);
    if (loginTicket) {
      loginTicket = decrypt(loginTicket,
          createKey(_aes_password, _aes_salt),
          _aes_iv_string);
    }
    return loginTicket;
  };

  LoginTicket.write = function (loginTicket) {
    if (loginTicket) {
      localStorage.setItem(LoginView.URI_PARAM_LOGIN_TICKET,
          encrypt(loginTicket,
              createKey(_aes_password, _aes_salt),
              _aes_iv_string));
    }
    else {
      this.remove();
    }
  };

  LoginTicket.remove = function () {
    localStorage.removeItem(LoginView.URI_PARAM_LOGIN_TICKET);
  };

  LoginTicket.readAccount = function () {
    var loginTicket = this.read();
    return this.loginTicket2Account(loginTicket);
  };

  LoginTicket.writeAccount = function (tenant, id, pw) {
    if (id && pw) {
      var _account = this.account2LoginTicket(tenant, id, pw);
      if (_account) {
        this.write(_account);
      }
    }
    else {
      this.remove();
    }
  };

  LoginTicket.password = function (pw) {
    if (pw) {
      var _account = this.readAccount();
      if (_account && _account.id && _account.pw) {
        this.writeAccount(_account.tenant, _account.id, pw);
      }
    }
  };

  LoginTicket.loginTicket2Account = function (loginTicket) {
    if (loginTicket) {
      var _account = null;
      try {
        _account = JSON.parse(loginTicket);
      } catch (e) {
        return null;
      }
      if (_account && _account.id && _account.pw) {
        return _account;
      }
    }
    return null;
  };

  LoginTicket.account2LoginTicket = function (tenant, id, pw) {
    if (id && pw) {
      if (tenant) {
        return '{"tenant":"' + tenant + '","id":"' + id + '","pw":"' + pw + '"}';
      } else {
        return '{"id":"' + id + '","pw":"' + pw + '"}';
      }
    }
    return null;
  };

})();
