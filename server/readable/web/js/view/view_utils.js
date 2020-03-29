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
function ViewUtils() {
};(function() {
    ViewUtils.LOADING_ICON_CLASS_NAME = 'loading-readmore';
    ViewUtils.DEFAULT_USER_AVATAR_SRC = 'images/user_noimage.png';
    ViewUtils.CHAR_COUNTER_BEFORE = 0;
    ViewUtils.CHAR_COUNTER_AFTER = 1;
    ViewUtils.CHAR_COUNTER_CLASSNAME = 'char-counter';
    ViewUtils.CHAR_COUNTER_UNDER_CLASSNAME = 'char-counter-under';
    ViewUtils.CHAR_COUNTER_OVER_CLASSNAME = 'char-counter-over';
    ViewUtils.ACCOUNT_PREFIX = '@';

    ViewUtils.STATUS_PRESENCEICON_CONTACTLIST = 0;
    ViewUtils.STATUS_PRESENCEICON_GROUPCHAT_MEMBERLIST = 1;

    ViewUtils.SINGLE_CLICK_DECISION_TIME = 500;

    ViewUtils.TYPE_CONTACT_LIST = 0;
    ViewUtils.TYPE_GROUP_CHAT = 1;
    ViewUtils.TYPE_COMMUNITY = 2;

    var loadingIconSelector = "div." + ViewUtils.LOADING_ICON_CLASS_NAME;

    ViewUtils.getUserName = function(jid) {
        var _ret = '';
        if (_validation({'jid' : jid}) == false) {
            return _ret;
        }
        var _personData = CubeeController.getInstance().getPersonData(jid);
        if (_personData) {
            var _personName = _personData.getUserName();
            if (_personName != null && _personName != '') {
                _ret = _personName;
            }
        }else{
            var _messageElem = $('.message-border div[jid="' + jid + '"] img').eq(0);
            if(_messageElem.length == 1){
                _ret = _messageElem.attr('alt');
            }
        }
        if(_ret == null || _ret == '') {
            _ret = ViewUtils.getCubeeAccountName(jid);
        }
        return _ret;
    };
    ViewUtils.getUserNameByPerson = function(person){
        var _ret = '';
        if(person == null || typeof person != 'object'){
            return _ret;
        }
        var _userName = person.getUserName();
        if (_userName != null && _userName != '') {
            _ret = _userName;
        }else{
            _ret = person.getLoginAccount();
        }
        return _ret;
    };
    ViewUtils.getCubeeAccountName = function(jid) {
        var _ret = '';
        if (_validation({'jid' : jid}) == false) {
            return _ret;
        }
        var _personData = CubeeController.getInstance().getPersonData(jid);
        if (_personData) {
            var _loginName = _personData.getLoginAccount();
            if (_loginName != null && _loginName != '') {
                _ret = _loginName;
            }
        }
        return _ret;
    };
    ViewUtils.getCubeeAccountNameByPerson = function(person){
        var _ret = '';
        if(person == null || typeof person != 'object'){
            return _ret;
        }
        var _loginAccount = person.getLoginAccount();
        if (_loginAccount != null && _loginAccount != '') {
            _ret = _loginAccount;
        }else{
            _ret = ViewUtils.getCubeeAccountName(person.getJid());
        }
        return _ret;
    };
    ViewUtils.setCharCounter = function(textBoxElm, outputTargetElm, maxLength, urlCount, isThreadTitle) {
        if (_validation({'textBoxElm' : textBoxElm, 'outputTargetElm' : outputTargetElm, 'maxLength' : maxLength}) == false) {
            return false;
        }
        updateCount();
        textBoxElm.on('keyup', function() {
            updateCount();
        });
        textBoxElm.on('change', function() {
            updateCount();
        });
        textBoxElm.on('focus', function() {
            updateCount();
        });
        function updateCount(self) {
            var _curElm = textBoxElm;
            var _curLen;
            if (urlCount == true) {
                _curLen = _curElm.val().length;
            } else {
                if(isThreadTitle){
                    _curLen = ViewUtils.getCalculattionTitle(_curElm.val());
                }else{
                    _curLen = ViewUtils.getCalculattionBody(_curElm.val());
                }
            }
            var _cond = maxLength - _curLen;
            if (_cond >= 0) {
                outputTargetElm.removeClass(ViewUtils.CHAR_COUNTER_OVER_CLASSNAME);
                outputTargetElm.addClass(ViewUtils.CHAR_COUNTER_UNDER_CLASSNAME);
            } else {
                outputTargetElm.removeClass(ViewUtils.CHAR_COUNTER_UNDER_CLASSNAME);
                outputTargetElm.addClass(ViewUtils.CHAR_COUNTER_OVER_CLASSNAME);
            }
            outputTargetElm.html(_cond);
        }

        return true;

    };
    ViewUtils.getCharCounterHtml = function(classNames) {
        if (_validation({'classNames' : classNames}) == false) {
            classNames = '';
        }
        return '<span class="' + ViewUtils.CHAR_COUNTER_CLASSNAME + ' ' + classNames + '"></span>';
    };
    ViewUtils.taskStatusNumToStr = function(status) {
        var _ret = '';
        if (_validation({'status' : status}) == false) {
            return _ret;
        }
        switch(status) {
            case TaskMessage.STATUS_INBOX:
                _ret = Resource.getMessage('task_to_inbox');
                break;
            case TaskMessage.STATUS_ASSIGNING:
                _ret = Resource.getMessage('task_status_assign');
                break;
            case TaskMessage.STATUS_NEW:
                _ret = Resource.getMessage('task_status_new');
                break;
            case TaskMessage.STATUS_DOING:
                _ret = Resource.getMessage('task_status_do');
                break;
            case TaskMessage.STATUS_SOLVED:
                _ret = Resource.getMessage('task_status_solved');
                break;
            case TaskMessage.STATUS_FEEDBACK:
                _ret = Resource.getMessage('task_status_fb');
                break;
            case TaskMessage.STATUS_FINISHED:
                _ret = Resource.getMessage('task_status_fin');
                break;
            case TaskMessage.STATUS_REJECTED:
                _ret = Resource.getMessage('task_status_rej');
                break;
            default:
                break;
        }
        return _ret;
    };
    ViewUtils.requestTaskStatusNumToStr = function(status, isParent) {
        var _ret = '';
        if (_validation({'status' : status}) == false) {
            return _ret;
        }
        switch(status) {
            case TaskMessage.STATUS_ASSIGNING:
                _ret = Resource.getMessage('task_status_assign');
                if (!isParent) {
                    _ret = Resource.getMessage('task_status_req');
                }
                break;
            case TaskMessage.STATUS_NEW:
                _ret = Resource.getMessage('task_status_new');
                if (isParent) {
                    _ret = Resource.getMessage('task_status_accept');
                }
                break;
            default:
                _ret = ViewUtils.taskStatusNumToStr(status);
                break;
        }
        return _ret;
    };
    ViewUtils.taskPriorityNumToStr = function(priority) {
        var _ret = '';
        if (_validation({'priority' : priority}) == false) {
            return _ret;
        }
        switch(priority) {
            case TaskMessage.PRIORITY_LOW:
                _ret = Resource.getMessage('task_priority_low');
                break;
            case TaskMessage.PRIORITY_MEDIUM:
                _ret = Resource.getMessage('task_priority_medium');
                break;
            case TaskMessage.PRIORITY_HIGH:
                _ret = Resource.getMessage('task_priority_high');
                break;
            case TaskMessage.PRIORITY_TOP:
                _ret = Resource.getMessage('task_priority_top');
                break;
            default:
                break;
        }
        return _ret;
    };
    ViewUtils.showLoadingTopInChild = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        if (elm.siblings(loadingIconSelector).size() == 0) {
            elm.prepend('<div class="' + ViewUtils.LOADING_ICON_CLASS_NAME + '"></div>');
            $(window).trigger('resize');
            return true;
        }
        return false;
    };
    ViewUtils.showLoadingIcon = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        if (elm.siblings(loadingIconSelector).size() == 0) {
            elm.after('<div class="' + ViewUtils.LOADING_ICON_CLASS_NAME + '"></div>');
            $(window).trigger('resize');
            return true;
        }
        return false;
    };
    ViewUtils.hideLoadingIconInChild = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        var loadingIcon = elm.find(loadingIconSelector);
        if ($(loadingIcon).size() > 0) {
            $(loadingIcon).remove();
            $(window).trigger('resize');
            return true;
        }
        return false;
    };
    ViewUtils.hideLoadingIcon = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        var loadingIcon = elm.siblings('.' + ViewUtils.LOADING_ICON_CLASS_NAME);
        if ($(loadingIcon).size() > 0) {
            $(loadingIcon).remove();
            $(window).trigger('resize');
            return true;
        }
        return false;
    };
    ViewUtils.showLoginLoadingIcon = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        if (elm.siblings(loadingIconSelector).size() == 0) {
            elm.before('<div class="' + ViewUtils.LOADING_ICON_CLASS_NAME + '"></div>');
            return true;
        }
        return false;
    };
    ViewUtils.hideLoginLoadingIcon = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        var loadingIcon = elm.siblings('.' + ViewUtils.LOADING_ICON_CLASS_NAME);
        if ($(loadingIcon).size() > 0) {
            $(loadingIcon).remove();
            return true;
        }
        return false;
    };
    ViewUtils.getAvatarDataHtml = function(jid, className) {
        if (_validation({'jid' : jid}) == false) {
            return '';
        }
        var _person = CubeeController.getInstance().getPersonData(jid);
        var _userName = ViewUtils.getUserName(jid);
        var _avatarSrc = ViewUtils.getAvatarUrl(_person);
        if(!_person){
            var _messageElem = $('.message-border div[jid="' + jid + '"] img').eq(0);
            if(_messageElem.length == 1){
                _avatarSrc = _messageElem.attr('src');
            }
        }

        var _retHtml = _getAvatarDataHtml(jid, _userName, _avatarSrc, className);

        return _retHtml;
    };
    ViewUtils.getAvatarDataHtmlFromPerson = function(person, className) {
        if(!person || typeof person != 'object'){
            return;
        }
        var _jid = person.getJid();
        var _userName = person.getUserName();
        if(!_userName || _userName == ''){
            _userName = person.getLoginAccount()
            if(!_userName || _userName == ''){
                _userName = ViewUtils.getCubeeAccountName(person.getJid());
            }
        }
        var _avatarSrc = ViewUtils.getAvatarUrl(person);
        var _retHtml = _getAvatarDataHtml(_jid, _userName, _avatarSrc, className);

        return _retHtml;
    };
    function _getAvatarDataHtml(jid, userName, avatarSrc, className){
        var HAS_NO_AVATAR = 'images/user_noimage.png';
        var _ret = '';
        _ret += '<div class="block-avatar" jid="' + jid + '">';
        _ret += '<span class="ico ico_user">'

        if (avatarSrc == HAS_NO_AVATAR) {
            var p = new Person();
            p.setUserName(userName);
            _ret += ViewUtils.getDefaultAvatarHtml(p);
        } else {
            if ( typeof (className) != 'undefined') {
                _ret += '<img class="' + className + '" alt="' + Utils.convertEscapedTag(userName) + '" src="' + avatarSrc + '">';
            } else {
                _ret += '<img class="avatar" alt="' + Utils.convertEscapedTag(userName) + '" src="' + avatarSrc + '">';
            }
        }
        _ret += '</span>';
        _ret += '</div>';

        return _ret;
    }

    ViewUtils.createAvatarToolTipHtml = function(person, rankingId){
        if(!person || typeof person != 'object'){
            return;
        }
        var _jid = person.getJid();
        var _presence = person.getPresence();
        var _userName = person.getUserName();
        var _status = person.getStatus();
        var _myMemo = person.getMyMemo();
        var _groups = person.getGroup();
        if(!_groups){
            _groups = [];
        }
        var __getAvatarDataHtml = function(){
            if(CubeeController.getInstance().getPersonData(_jid)){
                return ViewUtils.getAvatarDataHtml(_jid, "tooltip-block-image");
            }else{
                return ViewUtils.getAvatarDataHtmlFromPerson(person, "tooltip-block-image");
            }
        };
        function getFollowBtn(_jid, _followeeList) {
            var returnHtml = "";
            if (_jid != LoginUser.getInstance().getJid()) {
                for(var i = 0 ; i < _followeeList.getCount() ; i++) {
                    if(_jid == _followeeList._array[i].getJid()) {
                        returnHtml += '<td width="110px">';
                        returnHtml += '  <button type="button" class="unfollow-btn">';
                        returnHtml += Resource.getMessage('del_followee_text');
                        returnHtml += '  </button>';
                        returnHtml += '</td>';
                        return returnHtml;
                    }
                }
                returnHtml += '<td width="110px">';
                returnHtml += '  <button type="button" class="follow-btn">';
                returnHtml += Resource.getMessage('add_followee_text');
                returnHtml += '  </button>';
                returnHtml += '</td>';
                return returnHtml;
            }
            returnHtml += '<td width="110px">';
            returnHtml += '  <button disabled class="follow-btn">';
            returnHtml += Resource.getMessage('add_followee_text');
            returnHtml += '  </button>';
            returnHtml += '</td>';
            return returnHtml;
        }
        function getMyMemoText(_myMemo) {
            var returnHtml = "";
            if(_myMemo) {
                returnHtml += '<div id="tooltipProfileMyMemo" class="tooltip-block-item">';
                returnHtml += Utils.convertEscapedHtml(_myMemo, true);
                returnHtml += '</div>';
                return returnHtml;
            } else {
                return '';
            }
        }
        var _presenceColorCss = ViewUtils.getPresenceColorCss(_presence);
        var _adjustWidth = _userName.length < 12 ? (ViewUtils.getRepeatString('&nbsp;', 12 - _userName.length)) : '';
        var _avatarTipHtml = '';
        _avatarTipHtml += '<div class="tooltip-block-border cf">';
        _avatarTipHtml += '  <div class="tooltip-block-left">';
        _avatarTipHtml += '    <div>';
        _avatarTipHtml += '      <span class="ico ico_user">';
        _avatarTipHtml +=        __getAvatarDataHtml();
        _avatarTipHtml += '      </span>';
        _avatarTipHtml += '    </div>';
        _avatarTipHtml += '  </div>';
        _avatarTipHtml += '  <div class="tooltip-block-right">';
        _avatarTipHtml += '    <div id="tooltipProfileName" class="tooltip-block-item">';
        _avatarTipHtml +=         Utils.convertEscapedHtml(_userName);
        _avatarTipHtml +=         ViewUtils.getUserStatusString(_status);
        _avatarTipHtml += '    </div>';
        _avatarTipHtml += '    <div class="tooltip-block-item tooltipGroupName" style="font-size:12px;">';
        _avatarTipHtml +=        Utils.convertEscapedHtml(_groups.join(','));
        _avatarTipHtml += '    </div>';
        _avatarTipHtml += '    <div class="tooltip-block-item">';
        _avatarTipHtml += '      <span id="tooltipProfilePresenceString" class="' + _presenceColorCss + '">';
        _avatarTipHtml +=          ViewUtils.convertPresenceNumToDisplayStr(_presence);
        _avatarTipHtml += '      </span>';
        _avatarTipHtml += '    </div>';
        _avatarTipHtml += '    <div id="sidebar-gj-tp-'+rankingId+'">';
        _avatarTipHtml += '        <goodjob-thanks-counter v-bind:total="total"></goodjob-thanks-counter>';
        _avatarTipHtml += '    </div>';
        _avatarTipHtml += getMyMemoText(_myMemo);
        _avatarTipHtml += '    <table class="sidebar-followee-follower-list">';
        _avatarTipHtml += '      <div class="list_ttl_ico"></div>';
        _avatarTipHtml += '      <tr style="text-align:center">';
        _avatarTipHtml += '        <div class="sidebar_list_inner">';
        _avatarTipHtml += '        <div class="tooltip-border-line"></div>'
        _avatarTipHtml += '          <div class="list_ttl">';
        _avatarTipHtml += '            <td width="96px">';
        _avatarTipHtml += '              <a class="followeelist txt_btn" data-toggle="tooltip" data-html="true" data-placement="bottom" data-modal="followeelist-modal" title="フォローリスト">'
        _avatarTipHtml += '                <span class="followee-count">0</span>フォロー</a>';
        _avatarTipHtml += '            </td>';
        _avatarTipHtml += '            <td>';
        _avatarTipHtml += '              <a class="followerlist txt_btn" data-toggle="tooltip" data-html="true" data-placement="bottom" data-modal="followerlist-modal" title="フォロワーリスト">'
        _avatarTipHtml += '                <span class="follower-count">0</span>フォロワー</a>';
        _avatarTipHtml += '            </td>';
        _avatarTipHtml += '          </div>';
        _avatarTipHtml += '        </div>';
        _avatarTipHtml += '      </tr>';
        _avatarTipHtml += '    </table>';
        _avatarTipHtml += '    <table>';
        _avatarTipHtml += '      <tr>';
        _avatarTipHtml += getFollowBtn(_jid, LoginUser.getInstance().getFolloweeList());
        _avatarTipHtml += '        <td>';
        _avatarTipHtml += '    <button type="button" class="murmur-btn">';
        _avatarTipHtml += Resource.getMessage('murmur_btn_text');
        _avatarTipHtml += '    </button>';
        _avatarTipHtml += '        </td>';
        _avatarTipHtml += '      </tr>';
        _avatarTipHtml += '    </table>';
        _avatarTipHtml += '  </div>';
        _avatarTipHtml += '</div>';

        return _avatarTipHtml;
    };
    ViewUtils.centeringElement = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        elm.removeClass('visibility-hidden');
        return true;
    };
    ViewUtils.urlAutoLink = function(shortenUrls, src, flg, lastUrl, trimFlg, itemId) {
        var re = /((https?|ftp)(:\/\/\S+))|\\\\(.+\\)+\S*/gi;
        var _matchStrArray = src.match(re);
        var _preEscapedHtml = Utils.convertPreEscapedHtml(src, flg);
        if (_matchStrArray != null && _matchStrArray.length > 0) {
            var _urlStrings = [];
            var _cnt = _matchStrArray.length;
            for (var _i = 0; _i < _cnt; _i++) {
                var _matchStr = _matchStrArray[_i];
                var _found = false;
                var _urlStringsLen = _urlStrings.length;
                for (var _j = 0; _j < _urlStringsLen; _j++) {
                    if (_urlStrings[_j] == _matchStr) {
                        _found = true;
                        break;
                    }
                }
                if (_found != true) {
                    _urlStrings[_urlStringsLen] = _matchStr;
                }
            }

            var _urlCnt = _urlStrings.length;
            var _cnt = _urlCnt;
            if (trimFlg) {
                _cnt -= 1;
            }
            for (var _i = 0; _i < _cnt; _i++) {
                var _urlString = _urlStrings[_i];
                var _urlStringSrcStr = Utils.convertEscapedHtml(_urlString, flg);
                if (_urlString.indexOf("ftp://") == 0) {
                    _preEscapedHtml = Utils.replaceAll(_preEscapedHtml, _urlStringSrcStr, '<a class="url-link" href="' + _urlString + '" target="_blank">' + _urlStringSrcStr + '</a>');
                } else if (_urlString.indexOf("\\") == 0) {
                    if (ViewUtils.isIE()) {
                        _preEscapedHtml = Utils.replaceAll(_preEscapedHtml, _urlStringSrcStr, '<a class="url-link" href="' + _urlString + '" target="_blank">' + _urlStringSrcStr + '</a>');
                    }
                } else {   
                    var info = _findShortenUrlInfo(shortenUrls, _urlString);
                    if (info != null) {
                        _urlString = info.getShortenPath();
                        var _urlStringSrcStr = Utils.convertEscapedHtml(info.getDisplayedURL());
                        var _urlOriginal = Utils.convertEscapedHtml(info.getOriginalURL());
                        var _urlOriginalTag = Utils.convertEscapedTag(info.getOriginalURL());
                        var _itemId = itemId;
                        if(_itemId == null){
                            itemId = '';
                        }
                        _preEscapedHtml = Utils.replaceAll(_preEscapedHtml, _urlOriginal, '<a class="url-link" href=' + _urlOriginal + ' target="_blank" title="' + _urlOriginalTag + '">' + _urlStringSrcStr + '</a>');
                    }
                    else {
                       _preEscapedHtml = Utils.replaceAll(_preEscapedHtml, _urlStringSrcStr, '<a class="url-link" href="' + _urlString + '" target="_blank">' + _urlStringSrcStr + '</a>');
                     }
                }
            }
            if ( typeof lastUrl != 'undefined' && lastUrl != null && trimFlg) {
                _preEscapedHtml = _preEscapedHtml.replace(_urlStrings[_urlCnt - 1] + "</pre>", "");
                if (lastUrl.indexOf("ftp://") == 0) {
                   _preEscapedHtml += '<a class="url-link" href="' + lastUrl + '" target="_blank">' + _urlStrings[_urlCnt - 1] + '</a></pre>';
                }
                else { 
                    var info = _findShortenUrlInfo(shortenUrls, lastUrl);
                    if (info != null) {
                        var _lasturlStringSrcStr = Utils.convertEscapedHtml(info.getDisplayedURL());
                        var _lasturlOriginal = Utils.convertEscapedTag(info.getOriginalURL());
                        _preEscapedHtml += '<a class="url-link" href=' + _lasturlOriginal + ' target="_blank" title="' + _lasturlOriginal + '">' + _lasturlStringSrcStr + '</a></pre>';
                    }
                    else {
                       _preEscapedHtml += '<a class="url-link" href="' + lastUrl + '" target="_blank">' + _urlStrings[_urlCnt - 1] + '</a></pre>';
                    }
                }
            }
        }
        return _preEscapedHtml;
    };

    function _findShortenUrlInfo(shortenUrls, url) {
        for (var i = 0; i < shortenUrls.getCount(); i++) {
            var orig = shortenUrls.get(i).getOriginalURL();
            if (orig == url) {
                return shortenUrls.get(i);
            }
        }
        return null;
    };

    ViewUtils.checkLength = function(obj, min, max) {
        var _length = obj.val().length;
        if (_length > max || _length < min) {
            return false;
        }
        return true;
    };
    ViewUtils.checkRegexp = function(obj, regexp) {
        if (!(regexp.test(obj.val()))) {
            return false;
        } else {
            return true;
        }
    };
    ViewUtils.convertPresenceNumToDisplayStr = function(presenceNum) {
        var _presenceStr = Resource.getMessage('presence_offline');
        if (_validation({'presenceNum' : presenceNum}) == false) {
            return _presenceStr;
        }
        switch(presenceNum) {
            case Person.PRESENCE_STATUS_ONLINE:
                _presenceStr = Resource.getMessage('presence_online');
                break;
            case Person.PRESENCE_STATUS_AWAY:
                _presenceStr = Resource.getMessage('presence_staway');
                break;
            case Person.PRESENCE_STATUS_EXT_AWAY:
                _presenceStr = Resource.getMessage('presence_exaway');
                break;
            case Person.PRESENCE_STATUS_DO_NOT_DISTURB:
                _presenceStr = Resource.getMessage('presence_nodisturb');
                break;
            default:
                break;
        }
        return _presenceStr;
    };
    ViewUtils.showPresenceIcon = function(baseElem, presenceNum, status) {
        if (_validation({'baseElem' : baseElem}) == false) {
            return false;
        }
        var _buttonElem = baseElem.children('button');
        var _presenceColorCss = ViewUtils.getPresenceColorCss(presenceNum);
        if (_buttonElem.length != 0) {
            _buttonElem.remove();
        }
        var _classname;
        switch(status) {
            case ViewUtils.STATUS_PRESENCEICON_CONTACTLIST:
              _classname = 'button_presence contact-list-presence ' + _presenceColorCss;
                 break;
            case ViewUtils.STATUS_PRESENCEICON_GROUPCHAT_MEMBERLIST:
              _classname = 'button_presence groupchat-memberlist-presence ' + _presenceColorCss;
                  break;
            default:
                  break;
        }
        baseElem.find('span')
            .removeClass('status online offline leave busy out')
            .addClass("status " + _classname);
        return true;
    };
    ViewUtils.getPresenceColorCss = function(presenceNum) {
        var _presenceColorCss = 'button_presence_offline';
        if (_validation({'presenceNum' : presenceNum}) == false) {
            return _presenceColorCss;
        }
        switch(presenceNum) {
            case Person.PRESENCE_STATUS_OFFLINE:
                _presenceColorCss = 'offline';
                break;
            case Person.PRESENCE_STATUS_ONLINE:
                _presenceColorCss = 'online';
                break;
            case Person.PRESENCE_STATUS_AWAY:
                _presenceColorCss = 'leave';
                break;
            case Person.PRESENCE_STATUS_EXT_AWAY:
                _presenceColorCss = 'out';
                break;
            case Person.PRESENCE_STATUS_DO_NOT_DISTURB:
                _presenceColorCss = 'busy';
                break;
            default:
                break;
        }
        return _presenceColorCss;
    };
    ViewUtils.getRepeatString = function(str, count) {
        var _ret = '';
        if (_validation({'str' : str, 'count' : count}) == false) {
            return _ret;
        }
        return Array(count + 1).join(str);
    };
    ViewUtils.showPrivateMark = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        var _pos = elm.position();
        _pos.top += 16;
        _pos.left += 24;
        $(elm).parent().append('<img src="images/lock.png" style="' + 'position: absolute;' + 'top:' + _pos.top + 'px;' + 'left:' + _pos.left + 'px;' + 'width:24px!important; height:24px!important;" />');
        return true;
    };
    ViewUtils.showUnreadTopicMark = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        var _pos = elm.position();
        _pos.top += 16;
        _pos.left += 16;
        $(elm).parent().append('<button style="position:absolute;' + 'top:' + _pos.top + 'px;' + 'left:' + _pos.left + 'px;' + 'width:20px!important; height:18px!important; font-size:11px;" ' + 'class="button_notification">13</button>').children('button').css("background-color", "#0000ff").css("color", "#ffffff");
        return true;
    };
    ViewUtils.removeElems = function(elmList) {
        var removeShowElemCount = elmList.getCount();
        for (var _i = 0; _i < removeShowElemCount; _i++) {
            elmList.get(_i).remove();
        }
    };
    ViewUtils.extractUrls = function(message) {
        var _urlList = new ArrayList();
        if (_validation({'message' : message}) == false) {
            return _urlList;
        }
        var _re = /((https?|ftp)(:\/\/\S+))/gi;
        var _matchStrArray = message.match(_re);
        if (_matchStrArray != null) {
            var _count = _matchStrArray.length;
            for (var _i = 0; _i < _count; _i++) {
                _urlList.add(_matchStrArray[_i]);
            }
        }
        return _urlList;
    };
    ViewUtils.extractAttachedFileUrls = function(message) {
        var _urlList = new ArrayList();
        if (_validation({'message' : message}) == false) {
            return _urlList;
        }
        var _re = /((https?|ftp)(:\/\/\S+))/gi;
        var _matchStrArray = message.match(_re);
        if (_matchStrArray != null) {
            var _count = _matchStrArray.length;
            for (var _i = 0; _i < _count; _i++) {
                if(isAttachmentUrl(message, _matchStrArray[_i])) {
                    _urlList.add(_matchStrArray[_i]);
                }
            }
        }

        return _urlList;
    };
    ViewUtils.getThumbnailImageHtml = function(url, message, itemId) {
        if (_validation({'url' : url}) == false) {
            return '';
        }

        var ret;
        var _decodedURL = '';
        try {
            _decodedURL = decodeURI(url);
        } catch (e) {
            if (e.message == "URI malformed") {
                _decodedURL = url;
            } else {
              return '';
            }
        }

        var _decodedFile = Utils.convertEscapedTag(_decodedURL.split('/').pop());
        if (!isImageUrl(url)) {
            if(isAttachmentUrl(message, url)) {
              var _urlImage = 'images/add_attach_file.png';
                var _style = 'style="margin-left: 2px; height: 20px; width: 20px; border: 0px;"';
                if(!ViewUtils.isOldUploadFilePath(url)){
                    ret = '<a href="javascript: void(0)" onClick="return CubeeController.getInstance().downloadfile(\'' + url.replace(/\'/g, "\\'") + '\',\'' + itemId + '\');" title="' + _decodedFile + '"' + _style + '><i class="fa fa-paperclip"></i>' + _decodedFile + '</a>';
                }
                else {
                    ret = '<a href="' + url + '" target="_blank"><img src="' + _urlImage + '" class="image-thumbnail clickable" title="' + url + '" ' + _style + '/></a>';
                }
            } else {
              return '';
            }
        } else {
            if(isAttachmentUrl(message, url)) {
                if(!ViewUtils.isOldUploadFilePath(url)){
                    if (ViewUtils.isIE89()) {
                        ret = '<a href="javascript: void(0)"onClick="return CubeeController.getInstance().downloadfile(\'' + url + '\',\'' + itemId + '\');"><img class="image-thumbnail clickable" title="' + url + '"/></a>';
                    }
                    else {
                        ret = '<a href="javascript: void(0)" onClick="return CubeeController.getInstance().downloadfileOpen(this);"><img class="image-thumbnail clickable" title="' + _decodedFile + '" data-url="' + url + '"/></a>';
                    }
                } else {
                    ret = '<a href="' + url + '" target="_blank"><img src="' + url + '" class="image-thumbnail clickable" title="' + url + '"/></a>';
                }
            } else {
                ret = '<a href="' + url + '" target="_blank"><img src="' + url + '" class="image-thumbnail clickable" title="' + url + '"/></a>';
            }
        }

        return ret;
    };
    ViewUtils.removeAttachmentUrl = function(message) {
        var _message = message;
        if (_validation({'message' : message}) == false) {
            return '';
        }
        var _re = /((https?|ftp)(:\/\/\S+))/gi;
        var _matchStrArray = message.match(_re);
        if (_matchStrArray != null) {
            var _count = _matchStrArray.length;
            if (isAttachmentUrl(message, _matchStrArray[_count - 1])) {
                _message = message.replace(_matchStrArray[_count - 1], '');
            }
        }
        return _message;
    };
    ViewUtils.getAttachmentFileName = function(attachmentUrl) {
        var _filename = '';
        if (_validation({'attachmentUrl' : attachmentUrl}) == false) {
            return false;
        }
        var _regexp = new RegExp(location.protocol + "//" + location.hostname + "(/[^/].*/|/)(f|file)/.*$");
        var _matchUrl = attachmentUrl.match(_regexp);
        if (_matchUrl == null) {
            return _filename;
        }
        var _splitUrl = attachmentUrl.split('/');
        var _count = _splitUrl.length;
        _filename = _splitUrl[_count - 1];
        return Utils.urldecode(_filename);
    };
    ViewUtils.getKeywordListFromKeywordInputString = function(inputKeyword) {
        var _keywordString = Utils.replaceAll(inputKeyword, '　', ' ');
        _keywordString = _keywordString.replace(/ +/g,' ');
        var _keywordList = Utils.convertStringToArrayList(_keywordString, ' ');
        var _count = _keywordList.getCount();
        if (_count < 1) {
            return null;
        }
        for (var _i = 0; _i < _count; _i++) {
            var _inputKeyword = _keywordList.get(_i);
            if ((_inputKeyword.indexOf('+') == 0 || _inputKeyword.indexOf('＋') == 0) && _inputKeyword.length > 1) {
                _inputKeyword = _inputKeyword.substring(1);
                _keywordList.set(_i,_inputKeyword);
            }
        }
        return _keywordList;
    };
    ViewUtils.getKeywordFilterFromKeywordInputString = function(inputKeyword, includeMsgFrom) {
        var _includeMsgFrom = (arguments.length == 2) ? includeMsgFrom : true;
        var _keywordString = Utils.replaceAll(inputKeyword, '　', ' ');
        _keywordString = _keywordString.replace(/ +/g,' ');
        var _keywordList = Utils.convertStringToArrayList(_keywordString, ' ');
        var _count = _keywordList.getCount();
        var _columnFilter = null;
        if (_count < 1) {
            return null;
        }
        var _inputKeyword = _keywordList.get(0);
        if ((_inputKeyword.indexOf('+') == 0 || _inputKeyword.indexOf('＋') == 0) && _inputKeyword.length > 1) {
            _inputKeyword = _inputKeyword.substring(1);
        }
        var _prevCondition = new KeywordCondition();
        _prevCondition.setData(_inputKeyword);
        if(_includeMsgFrom){
            _prevCondition.setAddIncludeMessageFrom();
        }
        for (var _i = 1; _i < _count; _i++) {
            var _isOr = false;
            var _inputKeyword = _keywordList.get(_i);
            if ((_inputKeyword.indexOf('+') == 0 || _inputKeyword.indexOf('＋') == 0) && _inputKeyword.length > 1) {
                _inputKeyword = _inputKeyword.substring(1);
                _isOr = true;
            }
            var _nextCondition = new KeywordCondition();
            _nextCondition.setData(_inputKeyword);
            if(_includeMsgFrom){
                _nextCondition.setAddIncludeMessageFrom();
            }
            var _complexCondition = null;
            if(_isOr) {
                _complexCondition = new OrCondition();
            } else {
                _complexCondition = new AndCondition();
            }
            _complexCondition.addChildCondition(_prevCondition);
            _complexCondition.addChildCondition(_nextCondition);
            _prevCondition = _complexCondition;
        }
        _columnFilter = _prevCondition;
        return _columnFilter;
    };
    ViewUtils.getAvatarUrl = function(person) {
        var _avatarSrc = ViewUtils.DEFAULT_USER_AVATAR_SRC;
        if (person != null) {
            var _avatarType = person.getAvatarType();
            var _avatarData = person.getAvatarData();

            if (_avatarType != null && _avatarType != '' && _avatarData != null && _avatarData != '') {
                _avatarSrc = 'data:' + _avatarType + ';base64,' + _avatarData;
                if(_avatarType == 'imagepath'){
                    var _postUrlPath = location.protocol + "//" + location.hostname;
                    var _path = location.pathname;
                    var _lastPathDelimiterIndex = _path.lastIndexOf('/');
                    var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1);
                    if (_htmlFile.length != 0) {
                        if (_htmlFile.lastIndexOf('.') < 0) {
                            _postUrlPath += _path;
                        } else {
                            _postUrlPath += _path.substring(0, _lastPathDelimiterIndex + 1);
                        }
                    } else {
                        _postUrlPath += _path;
                    }
                    _avatarSrc = _postUrlPath;
                    if(_postUrlPath.charAt(_postUrlPath.length - 1) != '/'){
                        _avatarSrc += '/';
                    }
                    _avatarSrc += _avatarData;
                }
            }
        }
        return _avatarSrc;
    };
    function isUrl(_url) {
        if (typeof url == 'string') {
            return false;
        }
        var _extensionReg = new RegExp("((https?|ftp)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))");
        var _extensionIndex = _url.search(_extensionReg);
        if (_extensionIndex < 0) {
            return false;
        }
        return true;
    };
    function isImageUrl(imageUrl) {
        if (_validation({'imageUrl' : imageUrl}) == false) {
            return false;
        }
        var _extensionReg = new RegExp('^https?:\/\/.+(\.jpg|\.jpeg|\.png|\.gif|\.bmp)$', 'i');
        var _extensionIndex = imageUrl.search(_extensionReg);
        if (_extensionIndex < 0) {
            return false;
        }
        return true;
    };
    ViewUtils.isAttachmentUrl = function(message, attachmentUrl){ return isAttachmentUrl(message, attachmentUrl); };
    function isAttachmentUrl(message, attachmentUrl) {
        if (_validation({'message' : message, 'attachmentUrl' : attachmentUrl}) == false) {
            return false;
        }
        if (attachmentUrl.length > message.length) {
            return false;
        }
        if (message.substr(message.length - attachmentUrl.length, attachmentUrl.length) != attachmentUrl) {
            return false;
        }

        var _host = location.host;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') >= 0) {
                _path = _path.substring(0, _lastPathDelimiterIndex);
            }
        } else {
            _path = _path.substring(0, _lastPathDelimiterIndex);
        }

        var _attachmentPaths = ['f', 'file'];

        for(var i=0; i < _attachmentPaths.length; i++){
            var _regexp = new RegExp("https?://" + _host + _path + "/" + _attachmentPaths[i] + "/.*$");
            var _matchUrl = attachmentUrl.match(_regexp);
            var _regexpCubee = new RegExp("https?://" + _host + "/cubee/" + _attachmentPaths[i] + "/.*$");
            var _matchCubee = attachmentUrl.match(_regexpCubee);
            if( _matchUrl != null || _matchCubee != null) {
                return true;
            }
        }

        if (attachmentUrl.match(/\/redir\/[0-9A-Za-z]+$/) != null) {
            return false;
        }

        return false;

    };
    function _validation(args) {
        for (var p in args) {
            if (p == 'jid' || p == 'classNames' || p == 'str' || p == 'message' || p == 'url' || p == 'attachmentUrl' || p == 'imageUrl') {
                if (args[p] == null || typeof args[p] != 'string') {return false;}
            } else if (p == 'textBoxElm' || p == 'outputTargetElm' || p == 'baseElem') {
                if (args[p] == null || typeof args[p] != 'object' || args[p].size() == 0) {return false;}
            } else if (p == 'maxLength' || p == 'count') {
                if (args[p] == null || typeof args[p] != 'number' || args[p] < 0) {return false;}
            } else if (p == 'status' || p == 'priority' || p == 'presenceNum') {
                if (args[p] == null || typeof args[p] != 'number') {return false;}
            } else if (p == 'elm') {
                if (args[p] == null || typeof args[p] != 'object') {return false;}
            } else if (p == 'privacyType') {
                if (args[p] == null || typeof args[p] != 'number') {return false;}
            } else if (p == 'memberEntryType') {
                if (args[p] == null || typeof args[p] != 'number') {return false;}
            }
        }
        return true;
    };
    ViewUtils.getColumnTypeListFromMessage = function(message) {
        var _columnTypeList = new ArrayList();
        var _type = message.getType();
        switch (_type) {
            case Message.TYPE_PUBLIC:
                _columnTypeList.add(ColumnInformation.TYPE_COLUMN_TIMELINE);
                var _isMention = ViewUtils.isMentionMessage(message);
                if (_isMention) {
                    _columnTypeList.add(ColumnInformation.TYPE_COLUMN_MENTION);
                }
                break;
            case Message.TYPE_CHAT:
                _columnTypeList.add(ColumnInformation.TYPE_COLUMN_CHAT);
                break;
            case Message.TYPE_GROUP_CHAT:
                _columnTypeList.add(ColumnInformation.TYPE_COLUMN_UNKNOWN);
                break;
            case Message.TYPE_TASK:
                var isInboxColumnMessage = ViewUtils.isInboxColumnMessage(message);
                if (isInboxColumnMessage) {
                    _columnTypeList.add(ColumnInformation.TYPE_COLUMN_INBOX);
                } else {
                    _columnTypeList.add(ColumnInformation.TYPE_COLUMN_TASK);
                }
                break;
            case Message.TYPE_COMMUNITY:
                _columnTypeList.add(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED);
                break;
            case Message.TYPE_SYSTEM:
                _columnTypeList.add(ColumnInformation.TYPE_COLUMN_TIMELINE);
                break;
            case Message.TYPE_MAIL:
                _columnTypeList.add(ColumnInformation.TYPE_COLUMN_MAIL);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                _columnTypeList.add(ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE);
                break;
            default :
                _columnTypeList.add(ColumnInformation.TYPE_COLUMN_UNKNOWN);
                break;
        }
        return _columnTypeList;
    };
    ViewUtils.isMentionMessage = function(message) {
        var _ret = false;
        if (!message || typeof message != 'object') {
            return _ret;
        }
        var _type = message.getType();
        if (!_type || _type != Message.TYPE_PUBLIC) {
            return _ret;
        }
        var _mentionSearchCondition = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_MENTION);
        if (_mentionSearchCondition.isMatch(message)) {
            _ret = true;
        }
        return _ret;
    }
    ViewUtils.isToMeMessage = function(message) {
        var _ret = false;
        if (!message || typeof message != 'object') {
            return _ret;
        }
        var _toMeSearchCondition = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_TOME);
        if (_toMeSearchCondition.isMatch(message)) {
            _ret = true;
        }
        return _ret;
    }
    ViewUtils.isInboxColumnMessage = function(message) {
        var _ret = false;
        if (!message || typeof message != 'object') {
            return _ret;
        }
        var _type = message.getType();
        if (!_type || _type != Message.TYPE_TASK) {
            return _ret;
        }
        var _status = message.getStatus();
        var _parentItemId = message.getParentItemId();
        var isAssigning = false;
        if ((_status == TaskMessage.STATUS_ASSIGNING) && (_parentItemId != '')) {
            isAssigning = true;
        }
        if (_status == TaskMessage.STATUS_INBOX || isAssigning) {
            _ret = true;
        }
        return _ret;
    };

    function _setCompleteArrayFavoriteGroup(completeArray){
        var _favoriteCount = FavoriteStore.getInstance().getGroupCount();
        for(var _i = 0; _i < _favoriteCount; _i++) {
            var _favoriteGroupName = FavoriteStore.getInstance().getGroupName(_i);
            completeArray.push('@@' + _favoriteGroupName);
        }
    };

    function _onSelectFavoriteGroup(element, suggestionStr){
        var _accountStr = '';
        var _FavoriteStr = suggestionStr.slice(2);
        var _favoriteId = FavoriteStore.getInstance().getGroupIdByName(_FavoriteStr);
        if(_favoriteId >= 0){
            var _memberList = FavoriteStore.getInstance().getGroupMember(_favoriteId);
            for(var _i = 0; _i < _memberList.length; _i++){
                var _jid = _memberList[_i];
                var _person = CubeeController.getInstance().getPersonData(_jid);
                var _account = _person.getLoginAccount(_person);
                _accountStr += '@' + _account + ' ';
            }
            var _currentStr = element.val();
            var _index = _currentStr.lastIndexOf(suggestionStr);
            _currentStr = _currentStr.substr(0, (_currentStr.length - suggestionStr.length));
            $(element).val(_currentStr + _accountStr);
            return true;
        }
        return false;
    };

    ViewUtils.setAutoCompleteEventToTextArea = function() {

        var _delimiter = new RegExp(' |\n');
        function setAutoComplete(element) {
            function _formatResult(suggestion, currentValue, tagcountlist) {
                var _reEscape = new RegExp('(\\' + ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')', 'g');
                var _pattern = '(' + currentValue.replace(_reEscape, '\\$1') + ')';
                var _suggestNickName = '';
                if(suggestion.value.indexOf('#') == 0){
                    if(tagcountlist != null && tagcountlist[suggestion.value]){
                        _suggestNickName = "(" + tagcountlist[suggestion.value] + "件)";
                    }
                }else if(suggestion.value.indexOf('@') == 0){
                    var _accountName = suggestion.value.substring(1, suggestion.value.length-1);
                    if(_accountName == 'all'){
                        _suggestNickName = '('+ Resource.getMessage('group_title_all') + ')';
                    }else{
                        var _personData = CubeeController.getInstance().getPersonDataByLoginAccount(_accountName);
                        if(_personData != null) {
                            var _nickNameData = _personData.getUserName();
                            if(_nickNameData != null && _nickNameData != '') {
                                _suggestNickName = '('+ _nickNameData +')';
                            }
                        }
                    }
                }
                return suggestion.value.replace(new RegExp(_pattern, 'gi'), '<strong>$1<\/strong>') + Utils.convertEscapedHtml(_suggestNickName);
            };
            function _onSelect(suggestion) {
                var _suggestionStr = suggestion.value;
                if(_suggestionStr.startsWith('@@')){
                    _onSelectFavoriteGroup(element, _suggestionStr);
                }

                ViewUtils.setCursorEndOfLineForText(element);
                element.focus();    
            }
            function _createCompleteElement(element, _setAutoComplete){
                var _loginUser = LoginUser.getInstance();
                var _contactList = ContactList.getInstance();
                var _completeArray = [];
                var _loginUserAccount = _loginUser.getLoginAccount();
                _completeArray[0] = '@all ';
                _completeArray[1] = '@' + _loginUserAccount + ' ';
                var _contactListCount = _contactList.getCount();
                for(var _i = 0; _i < _contactListCount; _i++) {
                    var _person = _contactList.get(_i);
                    var _account = _person.getLoginAccount();
                    _completeArray[_i+2] = '@' + _account + ' ';
                }
                CubeeServerConnector.getInstance().getHashtagRanking()
                                    .then((res)=>{
                                        let tagcountlist = {};
                                        for(let i=0;i<res.content.items.length;i++){
                                            let tag = decodeURIComponent(res.content.items[i].tagname);
                                            _completeArray.push(tag + " ");
                                            tagcountlist[tag + " "] = res.content.items[i].count;
                                        }
                                        _setAutoComplete(_completeArray, tagcountlist);
                                        element.data('iBinded', false);
                                    }).catch((err)=>{
                                        _setAutoComplete(_completeArray, {});
                                        element.data('iBinded', false);
                                    });
            }
            function _setAutoComplete(completeArray, tagcountlist){
                if(element.data('autocomplete')){
                    return element.data('autocomplete').setOptions({
                        lookup: completeArray,
                        formatResult: (suggestion, currentValue) => {
                            return _formatResult(suggestion, currentValue, tagcountlist);
                        }
                    });
                }else{
                    return element.autocomplete({
                        lookup: completeArray,
                        minChars: 1,
                        delimiter: _delimiter,
                        onSelect : _onSelect,
                        formatResult: (suggestion, currentValue) => {
                            return _formatResult(suggestion, currentValue, tagcountlist);
                        },
                        lookupFilter: function(suggestion, originalQuery, queryLowerCase){
                            if(queryLowerCase.length == 1 &&
                               suggestion.value != "@all "){
                                return false;
                            }
                            if(queryLowerCase.length == 1 &&
                               queryLowerCase != "@"){
                                return false;
                            }
                            if(suggestion.value == "@all " &&
                               (
                                   $(element).parent().hasClass("register-task-client") ||
                                   $(element).parent().hasClass("register-task-owner") ||
                                   $(element).parent().hasClass("column-inbox-frm-message")||
                                   $(element).parent().hasClass("column-chat-frm-message")||
                                   $(element).closest('.column-chat').length ||
                                   $(element).hasClass("register-questionnaire-item")
                               )){
                                return false;
                            }
                            if(suggestion.value.indexOf("#") >= 0 &&
                               ( ( $(element).hasClass("questionnaire-register-item") &&
                                   $(element).hasClass("register-option-input") )||
                                 $(element).hasClass("register-questionnaire-item") )){
                                return false;
                            }
                            return suggestion.value.toLowerCase().indexOf(queryLowerCase) !== -1;
                        }
                    });
                }
            }
            _createCompleteElement(element, _setAutoComplete);
        };
        $(document).off('focusin', 'input.autocomplete[type="text"]');
        $(document).on('focusin', 'input.autocomplete[type="text"]', function(){
            if($(this).data('iBinded') == true){
                return;
            }
            $(this).data('iBinded', true)
            setAutoComplete($(this));
        });
        $(document).off('focusin', 'textarea.autocomplete');
        $(document).on('focusin', 'textarea.autocomplete', function(){
            if($(this).data('iBinded') == true){
                return;
            }
            $(this).data('iBinded', true)
            setAutoComplete($(this));
        });
    };
    ViewUtils.setAutoCompleteEventForCommunityMember = function() {

        function setAutoComplete(element) {
            var _accountList = new PersonList();
            function _formatResult(suggestion, currentValue, tagcountlist) {
                var _reEscape = new RegExp('(\\' + ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')', 'g');
                var _pattern = '(' + currentValue.replace(_reEscape, '\\$1') + ')';
                var _suggestNickName = '';
                if(suggestion.value.indexOf('#') == 0){
                    if(tagcountlist != null && tagcountlist[suggestion.value]){
                        _suggestNickName = "(" + tagcountlist[suggestion.value] + "件)";
                    }
                }else if(suggestion.value.indexOf('@') == 0){
                    var _accountName = suggestion.value.substring(1, suggestion.value.length-1);
                    if(_accountName == 'all'){
                        _suggestNickName = '('+ Resource.getMessage('room_group_title_all') + ')';
                    }else{
                    var _personData = _accountList.getByLoginAccount(_accountName);
                        if(_personData != null) {
                            var _nickNameData = _personData.getUserName();
                            if(_nickNameData != null && _nickNameData != '') {
                                _suggestNickName = '('+ _nickNameData +')';
                            }
                        }
                    }
                }
                return suggestion.value.replace(new RegExp(_pattern, 'gi'), '<strong>$1<\/strong>') + Utils.convertEscapedHtml(_suggestNickName);
            };
            function _onSelect(suggestion) {
                var _suggestionStr = suggestion.value;
                if(_suggestionStr.startsWith('@@')){
                    if(_onSelectFavoriteGroup(element, _suggestionStr) == false){
                        function _onSelectGetCommunityCallback(communityInfo){
                            if(communityInfo == null){
                                return;
                            }
                            var _accountStr = '';
                            var _ownerList = communityInfo.getOwnerList();
                            var _ownerCount = _ownerList.getCount();
                            var _generalMemberList = communityInfo.getGeneralMemberList();
                            var _generalMemberCount = _generalMemberList.getCount();
                            for(var _i = 0; _i < _ownerCount; _i++) {
                                var _person = _ownerList.get(_i);
                                var _account = _person.getLoginAccount(_person);
                                _accountStr += '@' + _account + ' ';
                            }
                            for(var _y = 0; _y < _generalMemberCount; _y++) {
                                var _person = _generalMemberList.get(_y);
                                var _account = _person.getLoginAccount(_person);
                                _accountStr += '@' + _account + ' ';
                            }

                            var _currentStr = element.val();
                            var _index = _currentStr.lastIndexOf(_suggestionStr);
                            _currentStr = _currentStr.substr(0, (_currentStr.length - _suggestionStr.length));
                            $(element).val(_currentStr + _accountStr);
                            ViewUtils.setCursorEndOfLineForText(element);
                            element.focus();    
                        }
                        CubeeController.getInstance().getCommunityMemberInfo(_communityId, _onSelectGetCommunityCallback);
                    }
                }

                ViewUtils.setCursorEndOfLineForText(element);
                element.focus();    
            }
            var _communityId = element.attr('groupId');
            if(!_communityId){
                _communityId = element.attr('communityId');
             }
            CubeeController.getInstance().getCommunityMemberInfo(_communityId, _onGetCommunityMemberInfoCallback);

            function _onGetCommunityMemberInfoCallback(communityInfo){
                if(communityInfo == null){
                    return;
                }
                var _ownerList = communityInfo.getOwnerList();
                var _ownerCount = _ownerList.getCount();
                var _generalMemberList = communityInfo.getGeneralMemberList();
                var _generalMemberCount = _generalMemberList.getCount();
                var _completeArray = [];
                for(var _i = 0; _i < _ownerCount; _i++) {
                    var _person = _ownerList.get(_i);
                    var _account = _person.getLoginAccount();
                    var _displayAccount = '@' + _account + ' ';
                    _completeArray.push(_displayAccount);
                    _accountList.add(_person);
                }
                for(var _y = 0; _y < _generalMemberCount; _y++) {
                    var _person = _generalMemberList.get(_y);
                    var _account = _person.getLoginAccount();
                    var _displayAccount = '@' + _account + ' ';
                    _completeArray.push(_displayAccount);
                    _accountList.add(_person);
                }
                _completeArray.push('@all ');

                _completeArray.push('@@' + Resource.getMessage('group_title_community_member'));    

                var _delimiter = new RegExp(' |\n');

                CubeeServerConnector.getInstance().getHashtagRanking()
                                    .then((res)=>{
                                        let tagcountlist = {};
                                        for(let i=0;i<res.content.items.length;i++){
                                            let tag = decodeURIComponent(res.content.items[i].tagname);
                                            _completeArray.push(tag + " ");
                                            tagcountlist[tag + " "] = res.content.items[i].count;
                                        }
                                        createAutoCompleteFunc(tagcountlist);
                                        $(element).data('iBinded', false);
                                    }).catch((err)=>{
                                        createAutoCompleteFunc({});
                                        $(element).data('iBinded', false);
                                    });
                const createAutoCompleteFunc = (tagcountlist) =>{
                    if(element.data('autocomplete')){
                        return element.data('autocomplete').setOptions({
                            lookup: _completeArray,
                            formatResult: (suggestion, currentValue) => {
                                return _formatResult(suggestion, currentValue, tagcountlist);
                            }
                        });
                    }else{
                        element.autocomplete({
                            lookup: _completeArray,
                            minChars: 1,
                            delimiter: _delimiter,
                            onSelect : _onSelect,
                            formatResult: (suggestion, currentValue) => {
                                return _formatResult(suggestion, currentValue, tagcountlist);
                            },
                            lookupFilter: function(suggestion, originalQuery, queryLowerCase){
                                if(queryLowerCase.length == 1 &&
                                   suggestion.value != "@all "){
                                    return false;
                                }
                                if(queryLowerCase.length == 1 &&
                                   queryLowerCase != "@"){
                                    return false;
                                }
                                if(suggestion.value == "@all " &&
                                   (
                                       $(element).parent().hasClass("register-task-client") ||
                                       $(element).parent().hasClass("register-task-owner")
                                   )){
                                    return false;
                                }
                                return suggestion.value.toLowerCase().indexOf(queryLowerCase) !== -1;
                            }
                        });
                    }
                }
            };
        };
        $(document).off('focusin', 'input.autocomplete-for-community[type="text"]');
        $(document).on('focusin', 'input.autocomplete-for-community[type="text"]', function(){
            if($(this).data('iBinded') == true){
                return;
            }
            $(this).data('iBinded', true)
            var _element = this;
            setTimeout(function(){
                setAutoComplete($(_element));
            }, 100);
        });
        $(document).off('focusin', 'textarea.autocomplete-for-community');
        $(document).on('focusin', 'textarea.autocomplete-for-community', function(){
            if($(this).data('iBinded') == true){
                return;
            }
            $(this).data('iBinded', true)
            var _element = this;
            setTimeout(function(){
                setAutoComplete($(_element));
            }, 100);
        });
    };

    ViewUtils.setAutoCompleteEventToTextAreaForGroup = function(groupType) {
        var TYPE_GROUPCHAT = 1;
        var _type = groupType ? groupType : TYPE_GROUPCHAT;
        var _completeArray = [];
        var _events = [];
        var _showEvents = [];
        var _createCompleteElement = function (element, createAutoCompleteFunc) {};

        switch(_type){
            case TYPE_GROUPCHAT:
                _showEvents = [
                    {event: 'focusin', element: 'input.autocomplete-for-chatroom[type="text"]'},
                    {event: 'focusin', element: 'textarea.autocomplete-for-chatroom'}];
                _createCompleteElement = function (element, createAutoCompleteFunc){
                    var _roomId = element.attr('groupId');
                    var _roomInfo = ColumnManager.getInstance()._getChatroomInformationFromColumnObjByRoomId(_roomId);
                    if(_roomInfo === null){
                        var _ret = CubeeController.getInstance().getRoomInfo(_roomId, _onGetRoomInfoCallBack);
                        if(!_ret){
                            console.log('GetRoomInfo Request is fail');
                            _onGetRoomInfoCallBack(null);
                        }
                    }else{
                        _onGetRoomInfoCallBack(_roomInfo);
                    }

                    function _onGetRoomInfoCallBack(roomInfo){
                        _completeArray = [];
                        var _personList = new PersonList();
                        if(roomInfo === null){
                            createAutoCompleteFunc(_completeArray, roomInfo);
                            return;
                        }
                        var _roomMemberList = roomInfo.getMemberList();
                        var _roomMemberCount = _roomMemberList.getCount();
                        for(var i = 0; i < _roomMemberCount; i++) {
                            var _jid = _roomMemberList.get(i);
                            var _profile = roomInfo.getProfileMap().getByKey(_jid);
                            var _account = _profile.getLoginAccount();
                            _completeArray.push('@' + _account + ' ');
                        }
                        _completeArray.push('@all ');

                        _completeArray.push('@@' + Resource.getMessage('group_title_group_member'));    

                        CubeeServerConnector.getInstance().getHashtagRanking()
                                            .then((res)=>{
                                                let tagcountlist = {};
                                                for(let i=0;i<res.content.items.length;i++){
                                                    let tag = decodeURIComponent(res.content.items[i].tagname);
                                                    _completeArray.push(tag + " ");
                                                    tagcountlist[tag + " "] = res.content.items[i].count;
                                                }
                                                createAutoCompleteFunc(_completeArray, roomInfo, tagcountlist);
                                                element.data('iBinded', false);
                                            }).catch((err)=>{
                                                createAutoCompleteFunc(_completeArray, roomInfo, {});
                                                element.data('iBinded', false);
                                            });
                    }
                };
                break;
            default:
            break;
        }

        function setAutoComplete(element) {
            var _roomInfo = null;
            function _formatResult(suggestion, currentValue, tagcountlist) {
                var _reEscape = new RegExp('(\\' + ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')', 'g');
                var _pattern = '(' + currentValue.replace(_reEscape, '\\$1') + ')';
                var _suggestNickName = '';
                if(suggestion.value.indexOf('#') == 0){
                    if(tagcountlist != null && tagcountlist[suggestion.value]){
                        _suggestNickName = "(" + tagcountlist[suggestion.value] + "件)";
                    }
                }else if(suggestion.value.indexOf('@') == 0){
                    var _accountName = suggestion.value.substring(1, suggestion.value.length-1);
                    if(_accountName == 'all'){
                        _suggestNickName = '('+ Resource.getMessage('room_group_title_all') + ')';
                    }else{
                        var _nickNameData = '';
                        if(_roomInfo != null) {
                            var _profileMap = _roomInfo.getProfileMap();
                            if(_profileMap != null) {
                                var _profileCount = _profileMap.getCount();
                                for(var _i = 0; _i < _profileCount; _i++) {
                                    var _profile = _profileMap.get(_i);
                                    if(_profile == null) {
                                        continue;
                                    }
                                    if(_accountName == _profile.getLoginAccount()) {
                                        _nickNameData = _profile.getNickName();
                                        break;
                                    }
                                }
                            }
                        }
                        if(_nickNameData != null && _nickNameData != '') {
                            _suggestNickName = '('+ _nickNameData +')';
                        }
                    }
                }
                return suggestion.value.replace(new RegExp(_pattern, 'gi'), '<strong>$1<\/strong>') + Utils.convertEscapedHtml(_suggestNickName);
            };
            function _onSelect(suggestion) {
                var _suggestionStr = suggestion.value;
                if(_suggestionStr.startsWith('@@')){
                    if(_onSelectFavoriteGroup(element, _suggestionStr) == false){
                        var _accountStr = '';
                        var _roomMemberList = _roomInfo.getMemberList();
                        var _roomMemberCount = _roomMemberList.getCount();
                        for(var i = 0; i < _roomMemberCount; i++) {
                            var _jid = _roomMemberList.get(i);
                            var _profile = _roomInfo.getProfileMap().getByKey(_jid);
                            var _account = _profile.getLoginAccount();
                            _accountStr += '@' + _account + ' ';
                        }
                        var _currentStr = element.val();
                        var _index = _currentStr.lastIndexOf(_suggestionStr);
                        _currentStr = _currentStr.substr(0, (_currentStr.length - _suggestionStr.length));
                        $(element).val(_currentStr + _accountStr);
                    }
                }

                ViewUtils.setCursorEndOfLineForText(element);
                element.focus();    
            }
            function _getDelimiter(){
                return new RegExp(' |\n');
            }
            function _setAutoComplete(completeArray, roomInfo, tagcountlist){
                _roomInfo = roomInfo;
                if(element.data('autocomplete')){
                    return element.data('autocomplete').setOptions({
                        lookup: completeArray,
                        formatResult: (suggestion, currentValue) => {
                            return _formatResult(suggestion, currentValue, tagcountlist);
                        }
                    });
                }else{
                    return element.autocomplete({
                        lookup: completeArray,
                        minChars: 1,
                        delimiter: _getDelimiter(),
                        onSelect : _onSelect,
                        formatResult: (suggestion, currentValue) => {
                            return _formatResult(suggestion, currentValue, tagcountlist);
                        },
                        lookupFilter: function(suggestion, originalQuery, queryLowerCase){
                            if(queryLowerCase.length == 1 &&
                               suggestion.value != "@all "){
                                return false;
                            }
                            if(queryLowerCase.length == 1 &&
                               queryLowerCase != "@"){
                                return false;
                            }
                            return suggestion.value.toLowerCase().indexOf(queryLowerCase) !== -1;
                        },
                    });
                }
            }
            _createCompleteElement(element, _setAutoComplete);

        };
        (function setShowEventHandler(){
            for(var i=0; i<_showEvents.length; i++){
                var _event = _showEvents[i].event;
                var _element = _showEvents[i].element;
                $(document).off(_event, _element);
                $(document).on(_event, _element, function(){
                    if($(this).data('iBinded') == true){
                        return;
                    }
                    $(this).data('iBinded', true);
                    setAutoComplete($(this));
                });
            }
        })();
    };

    ViewUtils.clearAutoCompleteEventToTextArea = function(type, groupId){
        if(type == null || typeof type != 'number'){
            return;
        }
        var targetSelectors = [];
        switch(type){
            case ViewUtils.TYPE_CONTACT_LIST:
                targetSelectors.push('input.autocomplete[type="text"]');
                targetSelectors.push('textarea.autocomplete');
                break;
            case ViewUtils.TYPE_GROUP_CHAT:
                targetSelectors.push('input.autocomplete-for-chatroom[type="text"][groupid="' + groupId + '"]');
                targetSelectors.push('textarea.autocomplete-for-chatroom[groupid="' + groupId + '"]');
                break;
            case ViewUtils.TYPE_COMMUNITY:
                targetSelectors.push('input.autocomplete-for-community[type="text"][groupid="' + groupId + '"]');
                targetSelectors.push('textarea.autocomplete-for-community[communityid="' + groupId + '"]');
                targetSelectors.push('input.autocomplete-for-community[type="text"][communityid="' + groupId + '"]');
                targetSelectors.push('textarea.autocomplete-for-community[groupid="' + groupId + '"]');
                break;
            default:
                return;
        }
        var _processedCount = 0;
        var _count = targetSelectors.length;

        setTimeout(function(){
            _chageFlaseIBinded();
        }, 1);
        function _chageFlaseIBinded(){
            if(_count <= _processedCount){
                return;
            }else{
                $(document).find(targetSelectors[_processedCount]).each(function(){
                    $(this).data('iBinded', false);
                });
                _processedCount++;
                setTimeout(function(){
                    _chageFlaseIBinded();
                }, 1);
            }
        }
    };

    ViewUtils.getGroupChatColumnInfo = function(roomInfo) {
        var _columnInfomation = new GroupChatColumnInformation();
        if (roomInfo == null || typeof roomInfo != 'object') {
            return null;
        }
        var _subData = {};
        _subData.roomId = roomInfo.getRoomId();
        var _filterCondition = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_GROUP_CHAT, _subData);
        var _sortCondition = new ColumnSortCondition();
        var _searchCondition = new ColumnSearchCondition(_filterCondition,_sortCondition);
        var _columnInfomation = new GroupChatColumnInformation();
        _columnInfomation.setChatRoomInfomation(roomInfo);
        _columnInfomation.setSearchCondition(_searchCondition);
        return _columnInfomation;
    };
    ViewUtils.getCommunityFeedColumnInfo = function(communityInfo) {
        if (communityInfo == null || typeof communityInfo != 'object') {
            return null;
        }
        var _subData = {};
        _subData.roomId = communityInfo.getRoomId();
        var _filterCondition = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED, _subData);
        var _sortCondition = new ColumnSortCondition();
        var _searchCondition = new ColumnSearchCondition(_filterCondition,_sortCondition);
        var _columnInfomation = new CommunityFeedColumnInformation();
        _columnInfomation.setCommunityInfomation(communityInfo);
        _columnInfomation.setSearchCondition(_searchCondition);
        return _columnInfomation;
    };
    ViewUtils.getCommunityTaskColumnInfo = function(communityInfo) {
        if (communityInfo == null || typeof communityInfo != 'object') {
            return null;
        }
        var _subData = {};
        _subData.roomId = communityInfo.getRoomId();
        var _filterCondition = CommunityTaskColumnFilter.getFilterWithoutCompletedTask(_subData);
        var _sortCondition = ViewUtils.getTaskDefaultSortCondition();
        var _searchCondition = new ColumnSearchCondition(_filterCondition,_sortCondition);
        var _columnInfomation = new CommunityTaskColumnInformation();
        _columnInfomation.setCommunityInfomation(communityInfo);
        _columnInfomation.setSearchCondition(_searchCondition);
        return _columnInfomation;
    };
    ViewUtils.convertAccountStrToJidStr = function(inputAccountStr) {
        var _ret = null;
        if (inputAccountStr == null || typeof inputAccountStr != 'string' || Utils.trimStringMulutiByteSpace(inputAccountStr) == '') {
            return _ret;
        }
        var _idx = inputAccountStr.indexOf(ViewUtils.ACCOUNT_PREFIX);
        if(_idx != 0){
            return _ret;
        }
        var _accountName = inputAccountStr.substring(1, inputAccountStr.length);
        var _personData = CubeeController.getInstance().getPersonDataByLoginAccount(_accountName);
        if(_personData == null){
            return _ret;
        }
        _ret = _personData.getJid();
        return _ret;
    };
    ViewUtils.convertAccountStrToJidStrFromServer = function(inputAccountStr, callback) {
        if (inputAccountStr == null || typeof inputAccountStr != 'string' || Utils.trimStringMulutiByteSpace(inputAccountStr) == '') {
            _onGetPersonInfo(null);
            return;
        }
        var _idx = inputAccountStr.indexOf(ViewUtils.ACCOUNT_PREFIX);
        if(_idx != 0){
            _onGetPersonInfo(null);
            return;
        }
        var _accountName = inputAccountStr.substring(1, inputAccountStr.length);
        var _accountList = new ArrayList();
        _accountList.add(_accountName);
        CubeeController.getInstance().getPersonDataByLoginAccountFromServer(_accountList, _onGetPersonInfo);
        return;
        function _onGetPersonInfo(personList) {
            var _jid = null;
            if(personList != null && personList.getCount() > 0) {
                _jid = personList.get(0).getJid();
            }
            if(callback && typeof callback == 'function') {
                setTimeout(function(){
                    callback(_jid);
                }, 1);
            }
        }
    };
    ViewUtils.convertJidStrToAccountStr = function(jid) {
        var _ret = '';
        if (jid == null || typeof jid != 'string' || Utils.trimStringMulutiByteSpace(jid) == '') {
            return _ret;
        }
        _ret = ViewUtils.ACCOUNT_PREFIX + ViewUtils.getCubeeAccountName(jid);
        return _ret;
    };
    ViewUtils.convertJidStrToAccountStrFromServer = function(jid, callback) {
        if (jid == null || typeof jid != 'string' || Utils.trimStringMulutiByteSpace(jid) == '') {
            _onGetPersonInfo(null);
            return;
        }
        var _jidList = new ArrayList();
        _jidList.add(jid);
        CubeeController.getInstance().getPersonDataByJidFromServer(_jidList, _onGetPersonInfo);
        return;
        function _onGetPersonInfo(personList) {
            var _account = '';
            if(personList != null && personList.getCount() > 0) {
                _account = ViewUtils.ACCOUNT_PREFIX + personList.get(0).getLoginAccount();
            }
            if(callback && typeof callback == 'function') {
                setTimeout(function(){
                    callback(_account);
                }, 1);
            }
        }
    };
    ViewUtils.getTaskFilterAndSortCondition = function(jid) {
        var _filterCondition = new TaskFilterAndSortCondition();
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        _filterCondition.setFilterOwner(jid);
        var _statusItems = '';
        _statusItems += TaskMessage.STATUS_ASSIGNING;
        _statusItems += ',' + TaskMessage.STATUS_NEW;
        _statusItems += ',' + TaskMessage.STATUS_DOING;
        _filterCondition.setFilterStatus(_statusItems);
        var _sortCondition = ViewUtils.getTaskDefaultSortCondition();
        var _sortConditionJsonObject = _sortCondition.getJSONObject();
        _filterCondition.setSortItem(_sortConditionJsonObject.item);
        _filterCondition.setSortOrder(_sortConditionJsonObject.order);
        return _filterCondition;
    };
    ViewUtils.getTaskDefaultSortCondition = function() {
        var _sortCondition = new ColumnSortCondition();
        _sortCondition.add(TaskFilterAndSortCondition.DB_COLUMN_DEMAND_STATUS, TaskFilterAndSortCondition.SORT_ORDER_DES);
        _sortCondition.add(TaskFilterAndSortCondition.DB_COLUMN_DEMAND_DATE, TaskFilterAndSortCondition.SORT_ORDER_ASC);
        _sortCondition.add(TaskFilterAndSortCondition.DB_COLOMN_COMPLETE_DATE + ' ' + TaskFilterAndSortCondition.SORT_COLUMN_IS_NULL, TaskFilterAndSortCondition.SORT_ORDER_DES);
        _sortCondition.add(TaskFilterAndSortCondition.DB_COLOMN_COMPLETE_DATE, TaskFilterAndSortCondition.SORT_ORDER_DES);
        _sortCondition.add(TaskFilterAndSortCondition.DB_COLOMN_DUE_DATE + ' ' + TaskFilterAndSortCondition.SORT_COLUMN_IS_NULL, TaskFilterAndSortCondition.SORT_ORDER_ASC);
        _sortCondition.add(TaskFilterAndSortCondition.DB_COLOMN_DUE_DATE, TaskFilterAndSortCondition.SORT_ORDER_ASC);
        _sortCondition.add(TaskFilterAndSortCondition.DB_COLUMN_PRIORITY, TaskFilterAndSortCondition.SORT_ORDER_DES);
        _sortCondition.add(TaskFilterAndSortCondition.DB_COLOMN_STATUS, TaskFilterAndSortCondition.SORT_ORDER_ASC);
        var _ret = _sortCondition;
        return _ret;
    };
    ViewUtils.getMailColumnInfomation = function() {
        var _columnInfoMail = new ColumnInformation();
        _columnInfoMail.setColumnType(ColumnInformation.TYPE_COLUMN_MAIL);
        _columnInfoMail.setFilterCondition('');

        var _filterCondition = ColumnFilterManager.getColumnFilter(_columnInfoMail.getColumnType(), null);
        if(_filterCondition == null) {
            return false;
        }
        var _sortCondition = new ColumnSortCondition();
        var _searchCondition = new ColumnSearchCondition(_filterCondition, _sortCondition);
        _columnInfoMail.setSearchCondition(_searchCondition);
        return _columnInfoMail;
    };
    ViewUtils.getCooperationServerName = function() {
        var _serverName = LoginUser.getInstance().getSettings().getMailCooperationList().get(0).getServerName();
        if (_serverName == '') {
            var _serverInfo = CubeeController.getInstance().getServerInfoById(1);
            if (_serverInfo != null) {
                _serverName = _serverInfo.getDisplayName();
            } else {
                _serverName = Resource.getMessage('no_server_info');
            }
        }
        return _serverName;
    };
    ViewUtils.getRequestString = function() {
        var _qsParamArray = new Array();
        var _query = window.location.search.substring(1);
        var _params = _query.split('&');
        for (var _i = 0; _i < _params.length; _i++) {
            var _pos = _params[_i].indexOf('=');
            if (_pos > 0) {
                var _key = _params[_i].substring(0, _pos);
                var _val = _params[_i].substring(_pos + 1);
                _qsParamArray[_key] = _val;
            }
        }
        return _qsParamArray;
    };
    ViewUtils.createMessageObject = function(parent, message) {
        if (parent == null || typeof parent != 'object') {
            return null;
        }
        if (message == null || typeof message != 'object') {
            return null;
        }
        var _msgObj = null;
        var _type = message.getType();
        switch(_type) {
            case Message.TYPE_PUBLIC:
                _msgObj = new ColumnPublicMessageView(parent, message);
                break;
            case Message.TYPE_SYSTEM:
                _msgObj = new ColumnSystemMessageView(parent, message);
                break;
            case Message.TYPE_CHAT:
                _msgObj = new ColumnChatMessageView(parent, message);
                break;
            case Message.TYPE_GROUP_CHAT:
                _msgObj = new ColumnGroupChatMessageView(parent, message);
                break;
            case Message.TYPE_TASK:
                var _isInbox = ViewUtils.isInboxColumnMessage(message);
                var _communityName = message.getCommunityName();
                if (_isInbox) {
                    _msgObj = new ColumnInboxMessageView(parent, message);
                }else if(_communityName != null && _communityName != ''){
                    _msgObj = new ColumnCommunityTaskMessageView(parent, message);
                }else {
                    _msgObj = new ColumnTaskMessageView(parent, message);
                }
                break;
            case Message.TYPE_GROUP_CHAT:
                _msgObj = new ColumnGroupChatMessageView(parent, message);
                break;
            case Message.TYPE_MAIL:
                _msgObj = new ColumnMailMessageView(parent, message);
                break;
            case Message.TYPE_COMMUNITY:
                _msgObj = new ColumnCommunityMessageView(parent, message);
                break;
            case Message.TYPE_QUESTIONNAIRE:
                _msgObj = new ColumnQuestionnaireMessageView(parent, message);
                break;
            case Message.TYPE_MURMUR:
                _msgObj = new ColumnMurmurMessageView(parent, message);
                break;
            default:
                console.log('ViewUtils::createMessageObjectOnly _ invalid type:' + _type);
                break;
        }
        return _msgObj;
     };
    ViewUtils.createDisplayName = function(columnInfo) {
        var _columnType = columnInfo.getColumnType();
        return ViewUtils.createDisplayNameByColumnType(_columnType);
    };
    ViewUtils.createDisplayNameByColumnType = function(columnType) {
        switch(columnType){
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
                return ColumnView.DISPLAY_NAME_TIMELINE;
            case ColumnInformation.TYPE_COLUMN_MENTION:
                return ColumnView.DISPLAY_NAME_MENTION;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                return ColumnView.DISPLAY_NAME_CHAT;
            case ColumnInformation.TYPE_COLUMN_TASK:
                return ColumnView.DISPLAY_NAME_MY_TASK;
            case ColumnInformation.TYPE_COLUMN_INBOX:
                return ColumnView.DISPLAY_NAME_INBOX;
            case ColumnInformation.TYPE_COLUMN_TASK:
                return ColumnView.DISPLAY_NAME_TASK;
            case ColumnInformation.TYPE_COLUMN_SEARCH:
                return ColumnView.DISPLAY_NAME_SEARCH;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                return ColumnView.DISPLAY_NAME_GROUP_CHAT;
            case ColumnInformation.TYPE_COLUMN_MAIL:
                return ColumnView.DISPLAY_NAME_MAIL;
            case ColumnInformation.TYPE_COLUMN_RECENT:
                return ColumnView.DISPLAY_NAME_RECENT;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
                return ColumnView.DISPLAY_NAME_COMMUNITY_FEED;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                return ColumnView.DISPLAY_NAME_COMMUNITY_TASK;
            case ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE:
                return ColumnView.DISPLAY_NAME_QUESTIONNAIRE;
            default:
                return "";
        }
    };
    ViewUtils.createDisplayNameWithSubData = function(columnType, subDataStr, sourceColumnDisplayName, callback) {
        var _isAsync = false;
        var _sourceColumnDisplayName = '';
        switch(columnType){
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
            case ColumnInformation.TYPE_COLUMN_MENTION:
            case ColumnInformation.TYPE_COLUMN_TASK:
            case ColumnInformation.TYPE_COLUMN_INBOX:
            case ColumnInformation.TYPE_COLUMN_MAIL:
            case ColumnInformation.TYPE_COLUMN_RECENT:
                _sourceColumnDisplayName = ViewUtils.createDisplayNameByColumnType(columnType);
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                if(subDataStr == null || typeof subDataStr != 'string') {
                    callback(_sourceColumnDisplayName);
                    return;
                }
                var _partnerPerson = CubeeController.getInstance().getPersonData(subDataStr);
                if(_partnerPerson != null) {
                    var _nickName = _partnerPerson.getUserName();
                    if(_nickName != null && _nickName != '') {
                        _sourceColumnDisplayName = _nickName;
                    }
                }else{
                    _sourceColumnDisplayName = sourceColumnDisplayName;
                }
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                function _onGetRoomInfo(gottenRoomInfo) {
                    if(gottenRoomInfo != null) {
                        var _roomName = gottenRoomInfo.getRoomName();
                        if(_roomName != null && _roomName != '') {
                            _sourceColumnDisplayName = _roomName;
                        }
                    }
                    callback(_sourceColumnDisplayName);
                };
                if(subDataStr != null && typeof subDataStr == 'string' && subDataStr != '') {
                    _isAsync = true;
                    CubeeController.getInstance().getRoomInfo(subDataStr, _onGetRoomInfo);
                }
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
                function _onGetCommunityInfoForCommunityFeed(gottenCommunityInfo) {
                    if(gottenCommunityInfo != null) {
                        var _roomName = gottenCommunityInfo.getRoomName();
                        if(_roomName != null && _roomName != '') {
                            _sourceColumnDisplayName = _roomName;
                        }
                    }
                    callback(_sourceColumnDisplayName);
                };
                if(subDataStr != null && typeof subDataStr == 'string' && subDataStr != '') {
                    _isAsync = true;
                    CubeeController.getInstance().getCommunityInfo(subDataStr, _onGetCommunityInfoForCommunityFeed);
                }
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                function _onGetCommunityInfoForCommunityTask(gottenCommunityInfo) {
                    if(gottenCommunityInfo != null) {
                        var _roomName = gottenCommunityInfo.getRoomName();
                        if(_roomName != null && _roomName != '') {
                            _sourceColumnDisplayName = ViewUtils.createDisplayNameByColumnType(columnType) + '(' + _roomName + ')';
                        }
                    }
                    callback(_sourceColumnDisplayName);
                };
                if(subDataStr != null && typeof subDataStr == 'string' && subDataStr != '') {
                    _isAsync = true;
                    CubeeController.getInstance().getCommunityInfo(subDataStr, _onGetCommunityInfoForCommunityTask);
                }
                break;
            default:
                break;
        }
        if(!_isAsync) {
            callback(_sourceColumnDisplayName);
        }
    };
    ViewUtils.getSubDataInColumnInfo = function(columnType, subData) {
        var _ret = {};
        if(subData == null) {
            return _ret;
        }
        if (columnType == ColumnInformation.TYPE_COLUMN_CHAT) {
            _ret = subData.partner;
        } else if (columnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
            _ret = subData.roomId;
        } else if (columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED) {
            _ret = subData.roomId;
        } else if (columnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
            _ret = subData.roomId;
        } else {
            _ret = subData;
        }
        return _ret;
    };
    ViewUtils.createQuestionnaireColumnInfo = function() {
        var _columnInfo = new ColumnInformation();
        _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE);

        var _condition = new TaskFilterAndSortCondition();
        var _jid = LoginUser.getInstance().getJid();
        var _sortItems = TaskFilterAndSortCondition.DB_COLUMN_CREATED_AT;
        _condition.setSortItem(_sortItems);
        var _orders = TaskFilterAndSortCondition.SORT_ORDER_DES;
        _condition.setSortOrder(_orders);
        _columnInfo.setFilterCondition(_condition.getFilterConditionJSONString());

        var _questionnaireFilterCondition = new FilterCondition('{}');
        var _questionnaireSortCondition = new ColumnSortCondition();
        _questionnaireSortCondition.add(TaskFilterAndSortCondition.DB_COLUMN_CREATED_AT, ColumnSortCondition.SORT_ORDER_DESC);
        var _questionnaireColumnSearchCondition = new ColumnSearchCondition(_questionnaireFilterCondition, _questionnaireSortCondition);
        _columnInfo.setSearchCondition(_questionnaireColumnSearchCondition);

        return _columnInfo;
    };
    ViewUtils.createIndexColumnInfo = function() {
        var _columnInfo = new ColumnInformation();
        _columnInfo.setColumnType(ColumnInformation.TYPE_COLUMN_INBOX);
        var _condition = new TaskFilterAndSortCondition();
        var _jid = LoginUser.getInstance().getJid();
        _condition.setFilterStatus(TaskMessage.STATUS_INBOX + ',' + TaskMessage.STATUS_ASSIGNING);
        _condition.setFilterOwner(_jid);
        var _sortItems = TaskFilterAndSortCondition.DB_COLUMN_DEMAND_STATUS;
        _sortItems += ',' + TaskFilterAndSortCondition.DB_COLUMN_DEMAND_DATE;
        _sortItems += ',' + TaskFilterAndSortCondition.DB_COLUMN_UPDATE_AT;
        _condition.setSortItem(_sortItems);
        var _orders = TaskFilterAndSortCondition.SORT_ORDER_DES;
        _orders += ',' + TaskFilterAndSortCondition.SORT_ORDER_ASC;
        _orders += ',' + TaskFilterAndSortCondition.SORT_ORDER_DES;
        _condition.setSortOrder(_orders);
        _columnInfo.setFilterCondition(_condition.getFilterConditionJSONString());
        var _inboxFilterCondition = new InboxFilterCondition();
        var _inboxSortCondition = new ColumnSortCondition();
        _inboxSortCondition.add(TaskFilterAndSortCondition.DB_COLUMN_DEMAND_STATUS, ColumnSortCondition.SORT_ORDER_DESC);
        _inboxSortCondition.add(TaskFilterAndSortCondition.DB_COLUMN_DEMAND_DATE, ColumnSortCondition.SORT_ORDER_ASC);
        _inboxSortCondition.add(TaskFilterAndSortCondition.DB_COLUMN_UPDATE_AT, ColumnSortCondition.SORT_ORDER_DESC);
        var _inboxColumnSearchCondition = new ColumnSearchCondition(_inboxFilterCondition, _inboxSortCondition);
        _columnInfo.setSearchCondition(_inboxColumnSearchCondition);
        return _columnInfo;
    };
     ViewUtils.isFinishedTask = function(message) {
         var _ret = false;
         if (!message || typeof message != 'object') {
             return _ret;
         }
         var _type = message.getType();
         if (!_type || _type != Message.TYPE_TASK) {
             return _ret;
         }
         var _status = message.getStatus();
         var _isFinished = true;
         if (_status != TaskMessage.STATUS_UNKNOWN  && _status != TaskMessage.STATUS_FINISHED && _status != TaskMessage.STATUS_REJECTED) {
             _isFinished = false;
         }
         return _isFinished;
     };

     ViewUtils.validBlinkTaskStatusElement = function(msgElement,delay,beforeHtml,afterHtml,isMultiOwner,childOwnerJid) {
         var _statusElement = ViewUtils.getStatusElement(msgElement,isMultiOwner,childOwnerJid);
         var _timerId;
         var flag = false;
         $(function(){
             _timerId = setInterval(_blinkStatusElement,delay);

         });
         function _blinkStatusElement(){
             _statusElement = ViewUtils.getStatusElement(msgElement,isMultiOwner,childOwnerJid);
             if(flag == false){
                 $(_statusElement).replaceWith(beforeHtml);
                 flag = true;
             }else{
                 $(_statusElement).replaceWith(afterHtml);
                 flag = false;
             }
         }

         return _timerId;

     };

     ViewUtils.invalidBlinkTaskStatusElement = function(timerId,msgElement,baseHtml,isMultiOwner,childOwnerJid) {
         var _statusElement = ViewUtils.getStatusElement(msgElement,isMultiOwner,childOwnerJid);
         clearInterval(timerId);
         $(_statusElement).replaceWith(baseHtml);
     };

     ViewUtils.getDemandTaskListByMessage = function(msg) {
         if(msg == null){
           return null;
         }
         var _childrenTaskItemIds = CubeeController.getInstance().getChildrenTaskItemIds(msg.getItemId());

         var _demandTaskList = new ArrayList();
         var _childrenTaskCount = 0;
         if(_childrenTaskItemIds != null) {
             _childrenTaskCount = _childrenTaskItemIds.getCount();
             for (var _i = 0; _i < _childrenTaskCount; _i++) {
                 var _childTask = CubeeController.getInstance().getMessage(_childrenTaskItemIds.get(_i));
                 if (_childTask == null) {
                     continue;
                 }
                 if(_childTask.getDemandStatus() == TaskMessage.DEMAND_OFF){
                     continue;
                 }
                 _demandTaskList.add(_childTask);
             }
         }else{
             if(msg.getDemandStatus() == TaskMessage.DEMAND_ON){
               _demandTaskList.add(msg);
             }
         }
         return _demandTaskList;
     };
     ViewUtils.getStatusElement = function(msgElement,isMultiOwner,childrenTaskOwnerJid) {
         var _statusElm = null;
         if (!msgElement || typeof msgElement != 'object') {
             return _statusElm;
         }
         if(isMultiOwner){
             var _childrenTaskAreaElm = msgElement.find('div.message-footer').find('div.children-task-assign-area');
             var _ownerElm = _childrenTaskAreaElm.children().find('[ownerjid = "' + childrenTaskOwnerJid +'"]');
             _statusElm = _ownerElm.find('.child-task-status-view');
         }else{
             var _messageFooterElm = msgElement.find('div.message-footer');
             _statusElm = _messageFooterElm.children().find('div.task-status-view');
         }
         return _statusElm;
     };
    ViewUtils.setDoubleClickEventToAvatar = function() {
        if (ViewUtils.isIE8()) {
            $(document).on('dblclick', 'div#columnContainer .block-avatar', function() { 
                var jid = $(this).attr('jid'); 
                if (jid != '') {
                    ColumnManager.getInstance().addChatColumn(jid, true);
                }
            });
        }
        $(document).on('click', 'div#columnContainer .block-avatar', function() { 
            var jid = $(this).attr('jid'); 
            if (jid != '') {
                if (ViewUtils.isCheckDoubleClick($(this))) {
                    ColumnManager.getInstance().addChatColumn(jid, true);
                }
            }
        });
        $(document).on('click', 'div#columnContainer .child-task-avatar', function(){
            var jid = $(this).parents('.child-task-owner-jid').attr('ownerjid');
            if (jid != '') {
                if (ViewUtils.isCheckDoubleClick($(this))) {
                    ColumnManager.getInstance().addChatColumn(jid, true);
                }
            }
        });
    };
     ViewUtils.isCheckDoubleClick = function(selfObj) {
         var _ret = false;
         if (selfObj.data('clickTimerId') == null) {
             var _timerid = setTimeout(function(){
                 selfObj.data('clickTimerId', null);
             }, ViewUtils.SINGLE_CLICK_DECISION_TIME);
             selfObj.data('clickTimerId', _timerid);
             _ret = false;
         } else {
             clearTimeout(selfObj.data('clickTimerId'));
             selfObj.data('clickTimerId', null);
             _ret = true;
         }
         return _ret;
     };
     ViewUtils.getClientHeight = function(obj) {
         var _height = obj.attr('clientHeight')?obj.attr('clientHeight'):obj.get()[0].clientHeight;
         if(_height){
             _height = parseInt(_height);
         }
         return _height;
     };
     ViewUtils.setCursorEndOfLineForText = function(textElement) {
         var v = textElement.val();
         textElement.val('');
         textElement.focus().val(v);
     };
    ViewUtils.isValidInputTextLength = function(text) {
        var _ret = true;
        let edited = ViewUtils.getCalculattionBody(text);
        if (text == '' || edited > ColumnView.TEXTAREA_MAX_LENGTH) {
            _ret = false;
        }
        return _ret;
     };
     ViewUtils.getUserStatusString = function(status) {
         var _ret = '';
         if(status == Person.PROFILE_STATUS_SUSPEND){
             _ret = Resource.getMessage('suspend');
         }
         return _ret;
     };
     var _isIE8 = null;
     ViewUtils.isIE8 = function() {
        if (_isIE8) {
            return _isIE8;
        }
        _isIE8 = false;
        if ($.browser.msie) {
            var _version = parseInt($.browser.version);
            if (_version == 8) {
                _isIE8 =  true;
            }
        }
        return _isIE8;
     };
     var _isIE9 = null;
     ViewUtils.isIE9 = function() {
        if (_isIE9) {
            return _isIE9;
        }
        _isIE9 = false;
        if ($.browser.msie) {
            var _version = parseInt($.browser.version);
            if (_version == 9) {
                _isIE9 = true;
            }
        }
        return _isIE9;
     };
     var _isIE89 = null;
     ViewUtils.isIE89 = function() {
        if (_isIE89) {
            return _isIE89;
        }
        _isIE89 = false;
        if ($.browser.msie) {
            var _version = parseInt($.browser.version);
            if (_version == 8 || _version == 9) {
                _isIE89 = true;
            }
        }
        return _isIE89;
     };
     var _isIE = null;
     ViewUtils.isIE = function() {
        if (_isIE !== null) {
            return _isIE;
        }
        _isIE = false;
        var ua = window.navigator.userAgent; 
        if (ua.match(/MSIE/) || ua.match(/Trident/)) {
            _isIE = true;
        }
        return _isIE;
     };

     ViewUtils.isOldUploadFilePath = function(url) {
        var _host = location.host;
        var _path = location.pathname;
        var _lastPathDelimiterIndex = _path.lastIndexOf('/');
        var _htmlFile = _path.substring(_lastPathDelimiterIndex + 1, _path.length);
        if (_htmlFile.length != 0) {
            if (_htmlFile.lastIndexOf('.') >= 0) {
                _path = _path.substring(0, _lastPathDelimiterIndex);
            }
        } else {
            _path = _path.substring(0, _lastPathDelimiterIndex);
        }
        var _regexp = new RegExp("https?://" + _host + _path + "/f/.*$");
        var _matchUrl = url.match(_regexp);
        var _regexpCubee = new RegExp("https?://" + _host + "/cubee/f/.*$");
        var _matchCubee = url.match(_regexpCubee);
        if( _matchUrl != null || _matchCubee != null) {
            return true;
        }

        return false;
     };
    ViewUtils.showErrorMessageIE = function(elm, message) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        if (elm.siblings('div.ui-state-error-text').size() > 0) {
            ViewUtils.hideErrorMessageIE(elm);
        }
        elm.after('<div class="ui-state-error-text error-message-ie">' + message + '</div>');
        return true;
    };
    ViewUtils.hideErrorMessageIE = function(elm) {
        if (_validation({'elm' : elm}) == false) {
            return false;
        }
        if (elm.siblings('div.ui-state-error-text').size() > 0) {
            elm.siblings('div.ui-state-error-text').remove();
            return true;
        }
        return false;
    };
    ViewUtils.communityPrivacyTypeNumToStr = function(privacyType) {
        var _ret = '';
        if (_validation({'privacyType' : privacyType}) == false) {
            return _ret;
        }
        switch(privacyType) {
            case CommunityInfo.PRIVACY_TYPE_ITEM_OPEN:
                _ret = Resource.getMessage('community_privacy_open');
                break;
            case CommunityInfo.PRIVACY_TYPE_ITEM_CLOSED:
                _ret = Resource.getMessage('community_privacy_close');
                break;
            case CommunityInfo.PRIVACY_TYPE_ITEM_SECRET:
                _ret = Resource.getMessage('community_privacy_secret');
                break;
            default:
                break;
        }
        return _ret;
    };
    ViewUtils.communityMemberEntryTypeNumToStr = function(memberEntryType) {
        var _ret = Resource.getMessage('community_member_entry_type_add');
        return _ret;
    };

    ViewUtils.searchUserExecute = function(searchTarget, condition, callback){
        function _callback(_matchUserList){
            _matchUserList._array.sort(function(prev, next){
                var _pAccount = prev.getLoginAccount();
                var _nAccount = next.getLoginAccount();
                if(_pAccount == _nAccount) return 0;
                return _pAccount < _nAccount ?  -1 : 1;
            });
            if(callback && typeof callback == 'function'){
               callback(_matchUserList);
            }
            return;
        }

        _searchInArray(searchTarget, condition);

        function _searchInArray(searchList, condition){
            var _matchUserList = new SearchResultPersonList();

            var _count = searchList.getCount();
            var _processedCount = 0;

            setTimeout(function(){
                _asyncSearchOneUser();
            }, 1);
            function _asyncSearchOneUser(){
                if(_count <= _processedCount){
                    _matchUserList.setAllItemCount(_matchUserList.getCount());
                    setTimeout(function(){
                        _callback(_matchUserList);
                    }, 1);
                    return;
                }
                var _person = searchList.get(_processedCount);
                if(_search(_person, condition)){
                    _matchUserList.add(_person);
                }
                _processedCount++;
                setTimeout(function(){
                    _asyncSearchOneUser();
                }, 1);
            }

        }
        function _search(searchUser, condition){
            if(condition.getType() == 'or'){
                var _values = condition._columnFilterConditionList;
                for(var i=0; i<_values.getCount(); i++){
                    if(_search(searchUser, _values.get(i))){
                        return true;
                    }
                }
                return false;
            }else if(condition.getType() == 'and'){
                var _values = condition._columnFilterConditionList;
                for(var i=0; i<_values.getCount(); i++){
                    if(!_search(searchUser, _values.get(i))){
                        return false;
                    }
                }
                return true;
            }else if(condition.getType() == 'keyword'){
                return _itemSearch(searchUser, condition.getValue());
            }
        }
        function _itemSearch(searchUser, keyword){
            if(searchUser.getUserName().indexOf(keyword) != -1){
                return true;
            }
            var _accountKeyword = keyword;
            if(keyword.indexOf('@') === 0){
                _accountKeyword = keyword.substr(1);
            }
            if(_accountKeyword.length > 0){
                var _loginAccount = searchUser.getLoginAccount();
                if(_loginAccount.indexOf(_accountKeyword) != -1){
                    return true;
                }
            }
            var _groups = searchUser.getGroup();
            for(var i=0; i<_groups.length; i++){
                if(_groups[i].indexOf(keyword) != -1){
                    return true
                }
            }
            return false;
        }
    }
    ViewUtils.getSourceColumnTypeAndRoomIdFromColumnInfo = function(columnInfo, columnType){
        var _columnType = columnType ? columnType: columnInfo.getColumnType();
        var _roomId = null;
        var _sourceColumnType = _columnType;
        switch(_columnType){
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                if(columnInfo.getChatRoomInfomation()){
                    _roomId = columnInfo.getChatRoomInfomation().getRoomId();
                }
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                if(columnInfo.getCommunityInfomation()){
                    _roomId = columnInfo.getCommunityInfomation().getRoomId();
                }
                break;
            case ColumnInformation.TYPE_COLUMN_SEARCH:
                if(columnInfo.getSubData()){
                    _roomId = columnInfo.getSubData().roomId;
                    _sourceColumnType = columnInfo.getSourceColumnTypeList().get(0);
                }
                break;
            case ColumnInformation.TYPE_COLUMN_FILTER:
                if(columnInfo.getSubData()){
                    _roomId = columnInfo.getSubData().roomId;
                    _sourceColumnType = columnInfo.getSourceColumnType();
                }
                break;
            case ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER:
                if(columnInfo.getSubData()){
                    _roomId = columnInfo.getSubData().roomId;
                    if(columnInfo.getBeginningColumnType() == ColumnInformation.TYPE_COLUMN_UNKNOWN){
                        _sourceColumnType = columnInfo.getSourceColumnType();
                    }else{
                        _sourceColumnType = columnInfo.getBeginningColumnType();
                    }
                }
                break;
            default :
                break;
        }
        return {
            roomId: _roomId,
            sourceColumnType: _sourceColumnType
        };
    };

    ViewUtils.getAutoCompleteAttributesFromColumnInfo = function(columnInfo){
        if(!columnInfo || typeof columnInfo != 'object'){
            return;
        }
        var autoCompleteInfo = ViewUtils.getSourceColumnTypeAndRoomIdFromColumnInfo(columnInfo);
        var _autoCompleteType = 'autocomplete';
        var _roomIdAttribute = '';
        switch(autoCompleteInfo.sourceColumnType){
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT :
                _autoCompleteType = 'autocomplete-for-chatroom';
                _roomIdAttribute = 'groupId="' + autoCompleteInfo.roomId + '"';
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK:
                _autoCompleteType = 'autocomplete-for-community';
                _roomIdAttribute = 'groupId="' + autoCompleteInfo.roomId + '"';
                break;
            default :
                break;
        }
        return{
            autoCompleteType: _autoCompleteType,
            roomIdAttribute: _roomIdAttribute
        }
    }

    ViewUtils.createPersonByProfile = function(jid, profile){
        var _person = null;
        if(jid == null || typeof jid != 'string'){
            return _person;
        }
        if(profile == null || typeof profile != 'object'){
            return _person;
        }

        _person = new Person();
        _person.setJid(jid);
        _person._profile = profile;

        return _person;
    }

    ViewUtils.getGroupName = function(person) {
      if (!person || !person.getGroup) {
        return;
      }
      var groups = person.getGroup().join(',');
      return groups ? groups : Resource.getMessage('group_title_no_group');
    }

    ViewUtils.getDefaultAvatarHtml = function(person) {
      var avatarInfo = Utils.avatarCreate({
        type: 'user',
        name: person.getUserName()
      });

      var html = '';
      html += '<div class="no_img" style="background-color:' + avatarInfo.color + ';">';
      html += '  <div class="no_img_inner">' + avatarInfo.name + '</div>';
      html += '</div>';

      return html;
    }

    ViewUtils.replaceTenantBaseTitleCategory = function(_threadTitle, originTitle, category, option){
        let categoryList = LoginUser.getInstance().getTenantInfo().threadTitleCategory;
        let addClass = option && typeof option.class == 'string' && option.class ? option.class : "";
        let replaceDone = false;
        let orignalCategory = [];
        let threadTitle;
        if(categoryList && Object.keys(categoryList).length != 0){
            let keysCate = {};
            for(let i=0;i<Object.keys(categoryList).length;i++){
                let val = decodeURIComponent(Object.keys(categoryList)[i]);
                keysCate[val] = categoryList[Object.keys(categoryList)[i]];
            }
            threadTitle = _threadTitle.replace(
                new RegExp('\\\[([^\\\]]+)\\\]','g'),
                (match, p1, offset, string)=>{
                    if(replaceDone){
                        return match;
                    }
                    if(!keysCate[p1] ||
                       ((string.indexOf(match) > 0 &&
                         string.substring(string.indexOf(match)-1,string.indexOf(match)) != ']') ||
                        (p1.match(/\s+/) || p1.length > 2 || (orignalCategory.length + category.length) > 5 - 1))){
                        if(p1.length > 2){
                            replaceDone = true;
                        }else if(!p1.match(/\s+/)){
                            orignalCategory.push(p1)
                        }
                        return '['+p1+']';
                    }else{
                        var avatarInfo = Utils.avatarCreate({
                            type: 'hashtag',
                            name: p1
                        });
                        let bgColor = keysCate[p1].bgColor;
                        let color = keysCate[p1].color;
                        category.push({
                            index: originTitle.indexOf("["+p1+"]"),
                            data: '<span class="thread-title-category-tip ' + addClass + '" style="color:'
                                 +color+';background-color:' + bgColor + ';">'+p1+'</span>'
                        });
                        return "";
                    }
                });
        }
        return(threadTitle);
    };

    ViewUtils.replaceOrignalTitleCategory = function(_threadTitle, originTitle, category, option){
        let addClass = option && typeof option.class == 'string' && option.class ? option.class : "";
        let categoryList = LoginUser.getInstance().getTenantInfo().threadTitleCategory;
        let replaceDone = false;
        let keysCate = {};
        for(let i=0;i<Object.keys(categoryList).length;i++){
            let val = decodeURIComponent(Object.keys(categoryList)[i]);
            keysCate[val] = categoryList[Object.keys(categoryList)[i]];
        }
        let threadTitle = _threadTitle.replace(
            new RegExp('\\\[([^\\\]]+)\\\]','g'),
            (match, p1, offset, string)=>{
                if(replaceDone){
                    return match;
                }
                if(keysCate[p1]){
                    replaceDone = true;
                    return match;
                }
                if((string.indexOf(match) > 0 &&
                    string.substring(string.indexOf(match)-1,string.indexOf(match)) != ']') ||
                   (p1.match(/\s+/) || p1.length > 2 || category.length > 5 - 1)){
                    replaceDone = true;
                    return '['+p1+']';
                }else{
                    var avatarInfo = Utils.avatarCreate({
                        type: 'hashtag',
                        name: p1
                    });
                    let color = "#fff";
                    let bgColor = avatarInfo.color;
                    category.push({
                        index: originTitle.indexOf(p1),
                        data: '<span class="thread-title-category-tip ' + addClass + '" style="color:'
                             +color+';background-color:' + bgColor + ';">'+p1+'</span>'
                    })
                    return "";
                }
            });
        return(threadTitle);
    }

    ViewUtils.setNewNoticeMark = function(target) {
      if(!target) {
        return;
      }
      target.parent().addClass('notice');
      target.append('<span class="new_message_notice">!</span>');
    }

    ViewUtils.unsetNewNoticeMark = function(target) {
      if(!target) {
        return;
      }
      target.removeClass('notice');
      target.find('.new_message_notice').remove();
    }

    ViewUtils.modal_on = function(modal_n, wizard) {
      if (!wizard) {
        $('#' + modal_n).show();
        $('#dialog_area').prepend('<div class="overlay modal_exit"></div>');
      } else {
        $('#wizard_modal').show();
      }
      $('.ui-dialog').addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
      $('.overlay').animate({ 'opacity':0.3}, 200 );
    }

    ViewUtils.wizard_overlayClose = function(){
        ViewUtils.modal_exit();
        $('.wizard_overlay').addClass('visibility-hidden');
    };

    ViewUtils.modal_exit = function(){
      $('.ui-dialog.on').animate({ 'margin-top':-70 + 'px', 'opacity':0 }, 200, function() {
          $(this).css('display','none');
          $('.modal_card').css('display','none');
      });
      $('#modal_area').hide();
      $('.overlay').animate({ 'opacity':0}, 200, function() {
          $(this).remove();
      });
    };
    ViewUtils.modal_allexit = function(){
        dlg_scr.forEach(function (value) {
            value.destroy();
        });
        dlg_scr = [];
        ViewUtils.modal_exit();
        $('#modal_area').find('*').off();
        $('#modal_area').off();
        $('#modal_area').children().remove();
    };

    ViewUtils.rayout_resize =  function(element){
      element.resize();
    };

    ViewUtils.switchAttachmentArea = function(newMessageArea, show) {
        var _self = this;
        if (!newMessageArea || newMessageArea.find(".file-selected").length == 0) {
            return;
        }
        var target = newMessageArea.find(".file-selected").children().not(".submit-message-progress");
        if (!target) {
            return;
        }

        if (show) {
            target.show();
        } else {
            target.hide();
        }
    }

    ViewUtils.animateCss = function(element, animationName, callback) {
        element.addClass('animated ' + animationName);

        element.on('animationend', function(){
            $(this).removeClass('animated ' + animationName);
            $(this).off('animationend');
            if (typeof callback === 'function') callback()
        })
    }
    ViewUtils.convertMessageTypeToColumnType = function(messageType) {
        switch(messageType) {
            case Message.TYPE_PUBLIC:
                return ColumnInformation.TYPE_COLUMN_TIMELINE;
                break;
            case Message.TYPE_CHAT:
                return ColumnInformation.TYPE_COLUMN_CHAT;
                break;
            case Message.TYPE_GROUP_CHAT:
                return ColumnInformation.TYPE_COLUMN_GROUP_CHAT;
                break;
            case Message.TYPE_COMMUNITY:
                return ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED;
                break;
            default:
                return ColumnInformation.TYPE_COLUMN_UNKNOWN;
        }
    }
    ViewUtils.convertColumnTypeToMessageType = function(columnType) {
        switch(columnType) {
            case ColumnInformation.TYPE_COLUMN_TIMELINE:
                return Message.TYPE_PUBLIC;
                break;
            case ColumnInformation.TYPE_COLUMN_CHAT:
                return Message.TYPE_CHAT;
                break;
            case ColumnInformation.TYPE_COLUMN_GROUP_CHAT:
                return Message.TYPE_GROUP_CHAT;
                break;
            case ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED:
                return Message.TYPE_COMMUNITY;
                break;
            case ColumnInformation.TYPE_COLUMN_MURMUR:
                return Message.TYPE_MURMUR;
                break;
            default:
                return 0;
        }
    }

    ViewUtils.sendPushNotificationForGoodJobOrThanksPoint = function(_notificationObject) {
        if (!_notificationObject.getMsgOwnJid() ||
            _notificationObject.getMsgOwnJid() != LoginUser.getInstance().getJid()) {
            return;
        }
        if (!PushNotificationSettingManager.getInstance().isSetting(LoginUser.getInstance().getJid())) {
            return;
        }
        if (_notificationObject.getFromJid() == LoginUser.getInstance().getJid()) {
            return;
        }
        var _title = "";
        var _body = "";
        if (NotificationSettingManager.getInstance().isSetting(
            ViewUtils.convertMessageTypeToColumnType(_notificationObject.getMsgType()),
            _notificationObject.getMsgTo())) {
            return;
        };
        if (ViewUtils.getAttachmentFileName(_notificationObject.getMessage())) {
            _body += ViewUtils.removeAttachmentUrl(_notificationObject.getMessage()).slice(0, -1);
        } else {
            _body += _notificationObject.getMessage();
        }
        switch(_notificationObject.getType()) {
            case Notification_model.TYPE_GOOD_JOB:
                _title = _notificationObject.getNickName() +
                    Resource.getMessage('push_notification_for_goodjob');
                break;
            case Notification_model.TYPE_EMOTION_POINT:
                if (_notificationObject.getEmotionPoint() == 0) {
                    return;
                }
                _title = _notificationObject.getNickName() +
                    Resource.getMessage('push_notification_for_thanks_point');
                break;
            default:
                return;
                break;
        }
        Push.create(_title, {
            icon: "images/cubee.png",
            body: _body,
            timeout: 5000,
            onClick: function () {
                window.focus();
                this.close();
            }
        });
    }

    ViewUtils.sendPushNotification = function(_messageObject) {
        if (!PushNotificationSettingManager.getInstance().isSetting(LoginUser.getInstance().getJid())) {
            return;
        }
        var _title = "";
        var _body = "";
        var _icon = "images/cubee.png";
        if (_messageObject.getFrom() == LoginUser.getInstance().getJid()) {
            return;
        }
        _body += _messageObject.getProfileByJid(_messageObject.getFrom()).getNickName() + '：\n';
        if (_messageObject.getThreadTitle()) {
            _body += "# " + _messageObject.getThreadTitle() + '\n';
        }
        if (ViewUtils.getAttachmentFileName(_messageObject.getMessage())) {
            _body += ViewUtils.removeAttachmentUrl(_messageObject.getMessage()).slice(0, -1);
        } else {
            _body += _messageObject.getMessage();
        }
        if (_messageObject.getProfileByJid(_messageObject.getFrom()).getAvatarData()) {
            _icon = location.origin + location.pathname + _messageObject.getProfileByJid(_messageObject.getFrom()).getAvatarData();
        }
        switch(_messageObject.getType()) {
            case Message.TYPE_PUBLIC:
                if (!_messageObject.getMessage().match('@'+LoginUser.getInstance().getLoginAccount()) &&
                    !_messageObject.getMessage().match('@all')) {
                    return;
                }
                _title += Resource.getMessage('MyFeed');
                break;
            case Message.TYPE_CHAT:
                if (NotificationSettingManager.getInstance().isSetting(ColumnInformation.TYPE_COLUMN_CHAT, _messageObject.getFrom())) {
                    return;
                };
                _title += Resource.getMessage('Chat') + ' - ' + _messageObject.getProfileByJid(_messageObject.getFrom()).getNickName();
                break;
            case Message.TYPE_COMMUNITY:
                if (NotificationSettingManager.getInstance().isSetting(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED, _messageObject.getTo())) {
                    return;
                };
                _title += Resource.getMessage('Community') + ' - ' + _messageObject.getRoomName();
                break;
            case Message.TYPE_GROUP_CHAT:
                if (NotificationSettingManager.getInstance().isSetting(ColumnInformation.TYPE_COLUMN_GROUP_CHAT, _messageObject.getTo())) {
                    return;
                };
                _title += Resource.getMessage('GroupChat') + ' - ' + _messageObject.getRoomName();
                break;
            case Message.TYPE_QUESTIONNAIRE:
                switch (parseInt(_messageObject.getRoomType())) {
                    case QuestionnaireRegister.ROOM_TYPE_FEED:
                        _title += Resource.getMessage('MyFeed');
                        break;
                    case QuestionnaireRegister.ROOM_TYPE_COMMUNITY:
                        if (NotificationSettingManager.getInstance().isSetting(ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED, _messageObject.getRoomId())) {
                            return;
                        };
                        _title += Resource.getMessage('Community') + ' - ' + _messageObject.getRoomName();
                        break;
                    case QuestionnaireRegister.ROOM_TYPE_GROUPCHAT:
                        if (NotificationSettingManager.getInstance().isSetting(ColumnInformation.TYPE_COLUMN_GROUP_CHAT, _messageObject.getRoomId())) {
                            return;
                        };
                        _title += Resource.getMessage('GroupChat') + ' - ' + _messageObject.getRoomName();
                        break;
                    default:
                        break;
                }
                _body = _messageObject.getProfileByJid(_messageObject.getFrom()).getNickName() +
                    Resource.getMessage('push_notification_for_questionnaire');
                break;
            default:
                return;
        }

        Push.create(_title, {
            icon: _icon,
            body: _body,
            timeout: 5000,
            onClick: function () {
                window.focus();
                this.close();
            }
        });
    }

    ViewUtils.showOpenGraphProtocolImage = function(_htmlElement) {
        var _ogpThumbnailElement = _htmlElement.find('div.ogp-area');
        _ogpThumbnailElement.each(function(index, el) {
            var _element = $(el);
            _element.hide();
            if (_element.attr('value')) {
                openGraphProtocolController.getInstance().getOpenGraphProtocol(_element.attr('value'))
                .then(function(result) {
                    if (result.result) {
                        if (result.data.ogDescription && result.data.ogTitle) {
                            var ogpHtml = "";
                            if (result.data.ogImage.url) {
                                var imageUrl = Utils.convertEscapedHtml(Utils.urldecode(result.data.ogImage.url));
                                if (isUrl(imageUrl)) {
                                    ogpHtml += '<a class="ogp-image-link" href="'+_element.attr('value')+'" target="_brank">\
                                        <img class="ogp-image" src='+imageUrl+'></a>';
                                }
                            }
                            var _title = Utils.urldecode(result.data.ogTitle);
                            var _shortenTitle = _title;
                            var titleLength = Conf.getVal('OGP_TITLE_MAX_LENGTH');
                            if (_title.length > titleLength) {
                                _shortenTitle = _shortenTitle.substring(0, titleLength);
                                _shortenTitle += '…';
                            }
                            var _desc = Utils.urldecode(result.data.ogDescription);
                            var descLength = Conf.getVal('OGP_DESCRIPTION_MAX_LENGTH');
                            if (_desc.length > descLength) {
                                _desc = _desc.substring(0, descLength);
                                _desc += '…';
                            }
                            ogpHtml += '\
                                <div class="ogp-string">\
                                    <p class="ogp-title" title="'+Utils.convertEscapedHtml(_title)+'">'+Utils.convertEscapedHtml(_shortenTitle)+'</p>\
                                    <p class="ogp-description">'+Utils.convertEscapedHtml(_desc)+'</p>';
                            if (result.data.ogUrl) {
                                var url = Utils.convertEscapedHtml(Utils.urldecode(result.data.ogUrl));
                                if (isUrl(url)) {
                                    ogpHtml += '<a href="' + url + '" class="ogp-url url-link" target="_brank"\
                                        title="' + url + '">' + url + '</p>';
                                }
                            } else {
                                ogpHtml += '<a href="'+_element.attr('value')+'" class="ogp-url url-link" target="_brank"\
                                    title="'+_element.attr('value')+'">'+_element.attr('value')+'</p>';
                            }
                            ogpHtml += '</div>';
                            _element.append(ogpHtml)
                            _element.fadeToggle(200);
                        }
                    }
                }).catch(function(err){
                    return;
                })
            }
            return;
        });
    };

    ViewUtils.replaceHashtagElement = function(body, inHtml=true, isRepEmpty=false) {
        let hashtagMatchWithHtml = /(#[^ -\/:-@\[-`{-~\s]+?)(\s|\&nbsp\;|<|$)/g;
        let hashtagPrefixBFMatch = /(^|\s|>|\&nbsp\;)$/;
        if(!inHtml){
            hashtagMatchWithHtml = /(#[^ -\/:-@\[-`{-~\s]+?)(\s|$)/g;
            hashtagPrefixBFMatch = /(^|\s)$/;
        }
        return body.replace(hashtagMatchWithHtml,
                            (arg,p1,p2,offset,str) => {
                                if(str.indexOf(p1) >= 0 && p1.length <= 31){
                                    let lastw = str.substr(0,str.indexOf(p1));
                                    if(lastw.match(hashtagPrefixBFMatch)){
                                        return !isRepEmpty ?
                                               '<a class="hashtag" title="'
                                               + p1 +'">'
                                               + p1 +'</a>'
                                               + p2 : "";
                                    }
                                }
                                return arg;
                            });
    };

    ViewUtils.replaceMentionElement = function(body, inHtml=true, isRepEmpty=false) {
        let mentionMatchWithHtml = /(@[\w\-''_\.\*!#$%&+\/=?^`{\|}]+?)(\s|\&nbsp\;|<|$)/g;
        let mentionPrefixBFMatch = /(^|\s|>|\&nbsp\;)$/;
        if(!inHtml){
            mentionMatchWithHtml = /(@[\w\-''_\.\*!#$%&+\/=?^`{\|}]+?)(\s|$)/g;
            mentionPrefixBFMatch = /(^|\s)$/;
        }
        return body.replace(mentionMatchWithHtml,
                            (arg,p1,p2,offset,str) => {
                                if(str.indexOf(p1) >= 0 && p1.length <= 31){
                                    let lastw = str.substr(0,str.indexOf(p1));
                                    if(lastw.match(mentionPrefixBFMatch)){
                                        return !isRepEmpty ?
                                               p1 + p2 : "";
                                    }
                                }
                                return arg;
                            });
    };

    ViewUtils.getShowBodyMessage = function(body){
        var re = /((https?)(:\/\/\S+))/gi;
        var re2 = /\\\\(.+\\)+\S*/gi;
        var _curLenHTML = body.replace(re, "").replace(re2, "");
        _curLenHTML = ViewUtils.replaceMentionElement(_curLenHTML, false, true);
        var _curLen = ViewUtils.replaceHashtagElement(_curLenHTML, false, true);
        return _curLen;
    }

    ViewUtils.getCalculattionTitle = function(title){
        return title.length;
    }

    ViewUtils.getCalculattionBody = function(body){
        return ViewUtils.getShowBodyMessage(body).length;
    }

    ViewUtils.getSubstringBody = function(body, len){
        if(ViewUtils.getCalculattionBody(body) > len){
            let _body = body;
            while(ViewUtils.getCalculattionBody(_body) > len){
                _body = _body.substring(0, _body.length - 1);
            }
            return _body;
        }else{
            return body;
        }
    }

    ViewUtils.showStampMessage = function(element, parent){
        let emoji_speech = $("pre:not(.message-title)", $(element).get(0))
            .html()
            .replace(/^(([^\&\;]+)&lt;(.*|.*<br>)&gt;([^;]*)|(.+))$/m,
                     (match, p1, p2, p3, p4, p5, offset, string)=>{
                         if(p2 != null && p2.length){
                             let chars = Array.from(p2);
                             let messElm = "";
                             if(p3 != null){
                                 p3 = p3.replace(/(^&nbsp;|&nbsp;$)/g,"");
                                 let countp3 = p3.replace(/(\<br\>|&nbsp;|&#x0009;|&gt;|&lt;|&#039;|&quot;|&amp;)/g," ");
                                 if(countp3.length){
                                     let rem = 0;
                                     if(countp3.length <= 15){
                                         rem = 2.3;
                                     }else if(countp3.length <= 30){
                                         rem = 2.1;
                                     }else if(countp3.length <= 40){
                                         rem = 1.8;
                                     }else if(countp3.length <= 50){
                                         rem = 1.6;
                                     }else if(countp3.length <= 60){
                                         rem = 1.5;
                                     }
                                     let mess = ViewUtils.replaceHashtagElement(p3 ,true, false);
                                     let stylel = "";
                                     if(rem > 0){
                                         stylel = ' style="font-size:'+rem+'rem;'
                                                + 'line-height:'+(Math.ceil((rem / 3 * 4)*10)/10)+'rem;"';
                                     }
                                     messElm = '<div class="stamp-speech-bubble" '+stylel+'>'+mess+'</div>';
                                 }
                             }
                             return chars[0] + messElm;
                         }else if(p5 == Resource.getMessage('deleted_message_body') ||
                                  p5 == Resource.getMessage('deleted_message_body_by_admin')){
                             return match;
                         }else if(p5 != null && p5.length){
                             return Array.from(p5)[0];
                         }
                         return match;
                     });
        if(emoji_speech && emoji_speech.indexOf("stamp-speech-bubble")){
            $("pre:not(.message-title)", $(element).get(0)).html(emoji_speech);
            $(".hashtag",$(element).get(0)).on('click', function() {
                ContextSearchView.getInstance().search($(this).text(), parent, true);
            });
        }
        twemoji.parse($(element).get(0));
    }

    ViewUtils.getMurmurColumnInfo = function(jid) {
        if (jid == null || typeof jid != 'string') {
            return null;
        }
        let _columnInfomation = new MurmurColumnInformation();
         let _subData = {};
        _subData.jid = jid;
        const _filterCondition = ColumnFilterManager.getColumnFilter(ColumnInformation.TYPE_COLUMN_MURMUR, _subData);
        const _sortCondition = new ColumnSortCondition();
        const _searchCondition = new ColumnSearchCondition(_filterCondition,_sortCondition);
        _columnInfomation.setSearchCondition(_searchCondition);
        return _columnInfomation;
    };
})();
