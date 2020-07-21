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

if (Conf.getVal('PORTAL_ENABLED')) {

    function PortalManager() {
    };(function() {

        PortalManager.PORTAL_ROOT_PATH = 'portal/';

        PortalManager._beforeDisplayModeIsMobile = !(window.innerWidth < LayoutManager.MARGINAL_WIDTH);

        PortalManager._loginTicket = null;

        PortalManager.viewContents = function() {

            var _baseHeight = window.innerHeight;

            var _leftWidth = 300;
            var _topHeight = 300;
            var _bottomHeight = 200;

            var _top = $(document).find('#loginOuterContainerTop');
            var _left = $(document).find('#loginOuterContainerLeft');
            var _bottom = $(document).find('#loginOuterContainerBottom');
            var _center = $(document).find('#loginContainer');

            var _centerHeight;

            if (window.innerWidth < LayoutManager.MARGINAL_WIDTH) {

                _left.width(0);
                _left.html('');
                _bottom.height(0);
                _bottom.html('');

                _top.css({'height':_topHeight + 'px','vertical-align':'middle','text-align':'left'});
                if (PortalManager._beforeDisplayModeIsMobile === false) {
                    _top.html('<iframe style="width:100%;height:100%;overflow:hidden;" src="' + PortalManager.PORTAL_ROOT_PATH + 'top.html"></iframe>');
                }
                PortalManager._beforeDisplayModeIsMobile = true;

                _centerHeight = _baseHeight - _topHeight;
            }

            else {

                _top.height(0);
                _top.html('');

                _left.css({'width':_leftWidth + 'px','vertical-align':'top','text-align':'center'});
                _bottom.css({'height':_bottomHeight + 'px','vertical-align':'middle','text-align':'left'});
                _left.height(_baseHeight);
                if (PortalManager._beforeDisplayModeIsMobile === true) {
                    _left.html('<iframe style="width:100%;height:100%;overflow:hidden;" src="' + PortalManager.PORTAL_ROOT_PATH + 'left.html"></iframe>');
                    _bottom.html('<iframe style="width:100%;height:100%;overflow:hidden;" src="' + PortalManager.PORTAL_ROOT_PATH + 'bottom.html"></iframe>');
                }
                else {
                    _left.children('iframe').eq(0).height(_baseHeight);
                }
                PortalManager._beforeDisplayModeIsMobile = false;

                _centerHeight = _baseHeight - _bottomHeight;
            }

            if (_centerHeight > 0) {
                _center.height(_centerHeight);
            }
            else {
                _center.height(0);
                _left.height(_baseHeight);
            }
            location.href = "#PORTAL";
        };

        PortalManager.autoLogin = function() {
            var _loginTicket = PortalManager._loginTicket;
            if (_loginTicket) {
                $('#btnLogin').css({'visibility':'hidden'});
                LoginView.getInstance()._execTicketLogin(_loginTicket);
                LoginView.getInstance()._setResourceStaticElements();
            }
            else {
                $('#btnAutoLogin').hide();
            }
        };

        $(window).resize(function() {
            if ($(document).find('#loginOuterContainer').css('display') != 'none') {
                setTimeout(PortalManager.viewContents, 1);
            }
        });
        PortalManager.viewContents();

    })();


    LoginTicket.read = function () {
        if (PortalManager._loginTicket) {
            return PortalManager._loginTicket;
        }

        var _loginTicket = localStorage.getItem(LoginView.URI_PARAM_LOGIN_TICKET);
        if (_loginTicket) {
            _loginTicket = decrypt(_loginTicket, createKey(_aes_password, _aes_salt), _aes_iv_string);
        }
        if (!_loginTicket) {
            return null;
        }

        var _account = LoginTicket.loginTicket2Account(_loginTicket);
        if (_account && _account.id) {

            PortalManager._loginTicket = _loginTicket;

            var _elem = $(document).find('#btnLogin');
            _elem.before('<div><a href="#" id="btnAutoLogin" onclick="PortalManager.autoLogin()" style="background-color:white;padding-left:5px;padding-right:5px;">Login as "' + _account.id + '"</a><div><br>');
        }

        return null;
    };

}
