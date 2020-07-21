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

function ColumnQuestionnaireMessageView(parent, msg) {
    if (!msg || typeof msg != 'object') {
        console.log('ColumnQuestionnaireMessageView::new _ msg is invalid');
        return;
    }
    var _type = msg.getType();
    if (_type != Message.TYPE_QUESTIONNAIRE) {
        console.log('ColumnQuestionnaireMessageView::new _ invalid type:' + _type);
        return;
    }

    this._inputType = msg.getInputType();
    ColumnMessageView.call(this, parent, msg);
};(function () {
    ColumnQuestionnaireMessageView.QUESTIONNAIRE_MESSAGE_ICON_CLS_NAME = 'Questionnaire-message-icon';
    ColumnQuestionnaireMessageView.prototype = $.extend({}, ColumnMessageView.prototype);
    var _super = ColumnMessageView.prototype;
    var _proto = ColumnQuestionnaireMessageView.prototype;

    _proto.cleanup = function () {
        var _self = this;
        _super.cleanup.call(_self);
    };

    _proto.getMessageHtml = function () {
        var _self = this;
        var _ret = '';
        var _msg = this.getMessage();
        var _itemId = this.getItemId();
        _ret += '<div draggable="false" class="box-border olient-vertical ' + ColumnQuestionnaireView.cssClass + ' ' + '"';
        _ret += ' itemId="' + _itemId + '"';
        _ret += '>';
        if (_self.getParent().getType() == ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE) {
            _ret += ColumnSearchView.getBorderHeaderHtml(_msg);
        }
        _ret += _self.getMessageHeaderHtml();
        _ret += _self.getMessageBodyHtml();
        _ret += '</div> <!-- questionnaire-message -->';
        return _ret;
    };
    _proto.setHtmlElement = function (htmlElement) {
        var _self = this;
        var msg = _self.getMessage();
        var addedClickEvent = false;
        _self._htmlElement = htmlElement;
        if (_self._htmlElement) {
            _self.setOptionSelectEvent();
            _self.setVoteEvent();
            _self.setToggleEvent();
        }
        if (_self._htmlElement.find('.questionnaire-toggle').length) {
            _self._htmlElement.find('.message-body').addClass("toggle-questionnaire-on");
            _self._htmlElement.find('.questionnaire-toggle').click(function(){
                _self._htmlElement.find('.message-body').toggleClass('open').find('.questionnaire-vote-area').stop().slideToggle(200);
            })

        }
        let hashtagElement = _self._htmlElement.find('a.hashtag');
        _self._setHashtagEvent(hashtagElement);
    };

    _proto._setHashtagEvent = function(element) {
        var _self = this;
        if (element) {
            element.on('click', function() {
                ContextSearchView.getInstance().search($(this).text(), _self.getParent(), true);
            });
        }
    };

    _proto.setToggleEvent = function () {
        var _self = this;
        if (!isOwnerMessage(_self.getMessage())) {
            return;
        }

        var _rootElem = _self.getHtmlElement();
        var _button = _rootElem.find("div.questionnaire-vote-toggle button");

        var _toggleIconOpen = 'ui-icon-minusthick';
        var _toggleIconClose = 'ui-icon-plusthick';
        _button.button({
            icons: {
                primary: _toggleIconClose
            },
            text: false
        }).click(function () {
            var $this = $(this);
            var $icon = $this.find('span.ui-icon');
            $icon.toggleClass(_toggleIconClose).toggleClass(_toggleIconOpen);
            if ($icon.hasClass(_toggleIconClose)) {
                $this.attr('title', Resource.getMessage('vote_toggle_display'));
            } else {
                $this.attr('title', Resource.getMessage('vote_toggle_hide'));
            }
            $this.parents('div.message-body').children('div.questionnaire-vote-area').slideToggle(function () {
                $(this).toggleClass('display-none');
                View.getInstance().resizeContent();
            });
        });
    };

    _proto.setOptionSelectEvent = function () {
        var _self = this;
        var _rootElem = _self.getHtmlElement();
        var _buttons = _rootElem.find("div.questionnaire-option-item");
        _buttons.on("click", function () {
            if (_self._inputType == QuestionnaireMessage.INPUTTYPE_CHECKBOX) {
                $(this).toggleClass("selected");
            } else {
                _buttons.removeClass("selected");
                $(this).addClass("selected");
            }
        });
    };

    _proto.setVoteEvent = function () {
        var _self = this;
        var _rootElem = _self.getHtmlElement();
        var _button = _rootElem.find("button.questionnaire-vote-button").eq(0);
        _button = _button.button();
        _button.on("click", function () {
            _button.off();
            _self.voteAction();
        });

        var _msg = _self.getMessage();

        switch(parseInt(_msg.getRoomType())) {
            case Message.TYPE_PUBLIC:
                if(!AuthorityInfo.getInstance().checkRights('sendMessageToFeed')){
                      _button.prop('disabled',true);
                      _button.text( Resource.getMessage('vote_status_label_authority_err') );
                }
                break;
            case Message.TYPE_GROUP_CHAT:
                if(AuthorityInfo.getInstance().checkRights('viewMessageInGroupchat', _msg.getRoomId())){
                      _button.prop('disabled',true);
                      _button.text( Resource.getMessage('vote_status_label_authority_err') );
                }
                break;
            case Message.TYPE_COMMUNITY:
                if(AuthorityInfo.getInstance().checkRights('viewMessageInCommunity', _msg.getRoomId())){
                      _button.prop('disabled',true);
                      _button.text( Resource.getMessage('vote_status_label_authority_err') );
                }
                break;
            default:
                break;
        }
        if (beforeStartDate(_msg)) {
            _button.prop('disabled',true);
            _button.text( Resource.getMessage('vote_status_label_before') );
        }
        if (afterEndDate(_msg)) {
            _button.prop('disabled',true);
            _button.text( Resource.getMessage('vote_status_label_after') );
        }
    };

    function beforeStartDate(msg) {
        var _before = false;
        var _startDate = msg.getStartDate();
        if (_startDate && _startDate.length > 0) {
            var _now = new Date();
            var _nowStr = _now.format(Utils.DISPLAY_STANDARD_DATE_FORMAT);
            if (_nowStr < _startDate) {
                _before = true;
            }
        }
        return _before;
    }

    function afterEndDate(msg) {
        var _after = false;
        var _endDate = msg.getDueDate();
        if (_endDate && _endDate.length > 0) {
            var _now = new Date();
            var _nowStr = _now.format(Utils.DISPLAY_STANDARD_DATE_FORMAT);
            if (_nowStr > _endDate) {
                _after = true;
            }
        }
        return _after;
    }

    _proto.voteAction = function () {
        var _self = this;
        var itemId = _self.getItemId();
        var optionItems = new ArrayList();
        var htmlElement = _self.getHtmlElement();
        var selectElement = htmlElement.find("div.questionnaire-option-item.selected");
        selectElement.each(function (index, item) {
            var optionId = $(item).attr("option-id");
            var optionItem = {
                optionValue: 1,
                optionId: optionId
            };
            optionItems.add(optionItem);
        });

        if (selectElement.length <= 0) {
            _self.setVoteEvent();
            return;
        }

        var msgto = '';
        var msg = _self.getMessage();
        if (msg) {
            msgto = msg.getRoomId();
        }
        CubeeController.getInstance().sendVoteMessage(onVoteActionCallback, msgto, itemId, optionItems);

        function onVoteActionCallback(result) {
            console.log("vote completed. Result is " + result);
        }
    };

    _proto.getMessageHeaderHtml = function () {
        var _self = this;
        var _ret = '';
        var _message = _self.getMessage();
        _ret = _getMessageHeaderHtml(_message);
        return _ret;
    };

    ColumnQuestionnaireMessageView.getMessageHeaderHtml = function (message) {
        var _ret = '';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageHeaderHtml(message);
        return _ret;
    };

    function _getMessageHeaderHtml(msg) {
        var _self = this;
        var _ret = '';
        var _msg = msg;
        var _itemId = _msg.getItemId();
        var _id = _msg.getId();
        var _from = _msg.getFrom();
        var _profile = _msg.getProfileByJid(_from);
        var _person = new Person();
        _person.setJid(_from);
        _person._profile = _profile;
        var _nickname = _person.getUserName();
        if (_nickname == null || _nickname == '') {
            _nickname = ViewUtils.getUserName(_from);
        }
        var _accountName = _person.getLoginAccount();
        if (_accountName == null || _accountName == '') {
            _accountName = ViewUtils.getCubeeAccountName(_from);
        }
        var _status = (_person != null) ? _person.getStatus() : Person.PROFILE_STATUS_ACTIVE;
        var _date = Utils.getDate(_msg.getDate(), Utils.DISPLAY_STANDARD_DATE_FORMAT);
        var _avatarHtml = ViewUtils.getAvatarDataHtmlFromPerson(_person);
        _ret += '<div class="box-border olient-horizontal message-header questionnaire-message-header">';
        _ret += '<div class="message-info" messageid="' + (_id == null ? '' : _id) + '" itemid="' + _itemId + '" />';
        if (ViewUtils.isIE89()) _ret += '<table><tr><td>';
        _ret += _avatarHtml;
        if (ViewUtils.isIE89()) _ret += '</td><td width="100%">';
        _ret += '<div class="flex1 block-info">';
        _ret += '<div class="sender-name text-overflow-ellipsis-nosize box-border-for-abbreviation"';
        _ret += ' title="' + Utils.convertEscapedTag(_nickname);
        _ret += ViewUtils.getUserStatusString(_status);
        _ret += ' @' + Utils.convertEscapedTag(_accountName) + '">';
        _ret += Utils.convertEscapedHtml(_nickname);
        _ret += ViewUtils.getUserStatusString(_status);
        _ret += '<span class="sender-account">@' + Utils.convertEscapedHtml(_accountName) + '</span></div>';

        _ret += '<div class="questionnaire-message-header-time">';
        _ret += '<div class="message-time">' + _date + '</div>';
        _ret += '</div>';
        _ret += '<div class="message-time end-date">' + getStartDate(_msg) + '</div>';
        _ret += '<div class="message-time end-date">' + getEndDate(_msg) + '</div>';
        _ret += '</div>';
        if (ViewUtils.isIE89()) _ret += '</td></tr></table>';
        _ret += '</div>';
        return _ret;
    }

    function getStartDate(message) {
        var _startDate = message.getStartDate();
        var _date = '';
        if (_startDate) {
            _date += Utils.getDate(_startDate, Utils.DISPLAY_VOTE_END_DATE_FORMAT);
            _date += Resource.getMessage('vote_startdate_status_text');
        }
        return _date;
    }

    function getEndDate(message) {
        var _dueDate = message.getDueDate();
        var _date = '';
        var _startDate = message.getStartDate();
        if (_dueDate) {
            _date += Utils.getDate(_dueDate, Utils.DISPLAY_VOTE_END_DATE_FORMAT);
            _date += Resource.getMessage('vote_enddate_status_text');
        }
        return _date;
    }

    function _getOptionsHtml(msg) {
        if (msg.getDeleteFlag() == 2) {
            return "";
        }
        var isOwner = isOwnerMessage(msg);
        if (msg.getVoteFlag()) {
            if (msg.getResultVisible() == QuestionnaireMessage.INFORMATION_PUBLIC || isOwner) {
                return _getGraphHtml(msg);
            }
            else {
                return _getOptionsVoteHtml(msg, true);
            }
        } else if (isOwner) {
            return _getOptionsVoteHtml(msg) + _getGraphHtml(msg);
        } else {
            return _getOptionsVoteHtml(msg);
        }
    }

    function isOwnerMessage(msg) {
        return msg.getFrom() == LoginUser.getInstance().getJid();
    }

    function _getVoteToggleHtml() {
        var _ret = '';
        _ret = '\
        <a class="questionnaire-toggle col_btn col_input_btn \
        popup_btn ico_btn" data-toggle="tooltip" data-placement="bottom" data-container="body"\
        data-original-title="' + Resource.getMessage('vote_toggle_display') + '">\
            <i class="fa fa-caret-down"></i>\
        </a>';
        return _ret;
    }

    function _getOptionsVoteHtml(msg, disableVote) {
        var optionItems = msg.getOptionItems();

        var _ret = '';

        var displayClass = '';
        if (isOwnerMessage(msg)) {
            _ret += _getVoteToggleHtml();
            displayClass = 'display-none';
        }

        if (disableVote) {
            displayClass += 'disable-vote-action';
        }

        var _inputType = msg.getInputType();
        var _inputTypeStr = '';
        if(_inputType === QuestionnaireMessage.INPUTTYPE_RADIO) {
            _inputTypeStr = 'radio';
        }

        _ret += '<div class="questionnaire-vote-area ' + displayClass + '">';

        _ret += '<div>';
        var _count = msg.getOptionCount();
        for (var _i = 0; _i < _count; _i++) {
            var item = optionItems.get(_i);
            _ret += '<div class="questionnaire-option-item" option-id="' + item.optionId.toString() + '">';

            var itemText = Utils.convertEscapedHtml(item.option.toString());
            _ret += '<div class="questionnaire-option-item-text" title="' + itemText + '">' + itemText + '</div>';
            if (!disableVote) {
                _ret += '<div class="questionnaire-option-item-mark ' + _inputTypeStr + '"></div>';
            }

            _ret += '</div>';
        }
        _ret += '</div>';

        if (!disableVote) {
            _ret += '  <div class="questionnaire-vote-buttons">';
            _ret += '    <button class="questionnaire-vote-button" >' + Resource.getMessage('vote_button_name') + '</button>';
            _ret += '  </div>';
        }

        _ret += '  </div>';
        return _ret;
    }

    function _getBlankImageHtml() {
        var _ret = '';
        _ret += '<div>';
        _ret += '<img class="avatar ' + ColumnQuestionnaireMessageView.QUESTIONNAIRE_MESSAGE_ICON_CLS_NAME + '" src="images/blank.png">';
        _ret += '</div>';
        return _ret;
    }

    function _getGraphHtml(msg) {
        var _ret = '';

        _ret += '<div class="questionnaire-result">';
        var _graphType = msg.getGraphType();
        if (_graphType === QuestionnaireMessage.GRAPHTYPE_PIE) {
            _ret += _getPieHtml(msg);
        } else {
            _ret += _getBarHtml(msg);
        }

        _ret += '</div>';
        return _ret;
    }

    function _getBarHtml(msg) {
        var optionItems = msg.getOptionItems();
        var count = msg.getOptionCount();
        var _total = 0;
        var _i = 0;
        var item = null;
        var _value = 0;
        for (_i = 0; _i < count; _i++) {
            item = optionItems.get(_i);
            _value = parseInt(item.optionValue, 10);
            if (!isNaN(_value)) {
                _total += _value;
            }
        }

        var _ret = '';
        for (_i = 0; _i < count; _i++) {
            item = optionItems.get(_i);

            var _ratedWidth = 0;
            _value = parseInt(item.optionValue, 10);
            if (isNaN(_value)) {
                _value = 0;
            }
            if (_total > 0) {
                _ratedWidth = _value * 100 / _total;
            }

            var itemName = Utils.convertEscapedHtml(item.option.toString());
            _ret += '<div class="questionnaire-result-bar-item">';
            _ret += '<div class="questionnaire-result-bar-item-name" title="' + itemName + '">' + itemName + '</div>';

            _ret += '<div class="questionnaire-result-bar-item-graph">';
            _ret += '<div class="questionnaire-result-bar-item-progress">';
            _ret += '<div style="width: ' + _ratedWidth + '%;"></div>';
            _ret += '</div>';
            _ret += '<div class="questionnaire-result-bar-item-number">' + _ratedWidth.toFixed(0) + '%(' + _value + ')</div>';
            _ret += '</div>';

            _ret += '</div>';
        }

        return _ret;
    }

    function _getPieHtml(msg) {
        var pieSize = 90;
        var pieRadius = pieSize / 2;
        var pie = d3.layout.pie();
        var arc = d3.svg.arc().innerRadius(0).outerRadius(pieRadius);
        var colors = d3.scale.category20();
        var _gTransform = 'translate(' + pieRadius + ',' + pieRadius + ')';

        var data = [];
        var optionItems = msg.getOptionItems();
        var count = msg.getOptionCount();
        var totalCount = 0;
        var _i = 0;
        var _value = 0;
        for (_i = 0; _i < count; _i++) {
            var item = optionItems.get(_i);
            _value = parseInt(item.optionValue, 10);
            if (isNaN(_value)) {
                _value = 0;
            }
            data.push(_value);
            totalCount += _value;
        }

        var _ret = '';

        _ret += '<div class="questionnaire-result-sample">';
        for (_i = 0; _i < count; _i++) {
            var item = optionItems.get(_i);
            var rate = 0;
            _value = parseInt(item.optionValue, 10);
            if (isNaN(_value)) {
                _value = 0;
            }

            if (_value > 0) {
                rate = _value * 100 / totalCount;
            }

            var itemName = Utils.convertEscapedHtml(item.option.toString());
            _ret += '<div class="questionnaire-result-sample-item">';
            _ret += '<div class="questionnaire-result-sample-item-color" style="background-color:' + colors(_i) + '">&nbsp;</div>';
            _ret += '<div class="questionnaire-result-sample-item-name" title="' + itemName + '">' + itemName + '</div>';
            _ret += '<div class="questionnaire-result-sample-item-number">' + rate.toFixed(0) + '%(' + _value + ')</div>';
            _ret += '</div>';
        }
        _ret += '</div>';

        _ret += '<div class="questionnaire-result-graph-pie">';
        _ret += '<svg width="' + pieSize + '" height="' + pieSize + '">';
        if (totalCount === 0) {
            data = [1];
        }
        var pieDatas = pie(data);
        for (var i = 0; i < data.length; i++) {
            var _color = getColor(i);
            var _path = arc(pieDatas[i]);
            _ret += '<g transform="' + _gTransform + '">';
            _ret += '<path fill="' + _color + '" d="' + _path + '">';
            _ret += '</path>';
            _ret += '</g>';
        }
        _ret += '</svg>';
        _ret += '</div>';

        return _ret;

        function getColor(index) {
            if (totalCount === 0) {
                return '#dbdbdb';
            }
            return colors(index);
        }
    }

    _proto.getMessageFooterHtml = function () {
        var _self = this;
        var _ret = '';
        var _message = _self.getMessage();
        _ret = _getMessageFooterHtml(_message);
        return _ret;
    };

    ColumnQuestionnaireMessageView.getMessageFooterHtml = function (message) {
        var _ret = '';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageFooterHtml(message);
        return _ret;
    };

    function _getMessageFooterHtml(msg) {
        var _ret = '<div></div>';
        return _ret;
    }

    _proto.getMessageBodyHtml = function () {
        var _self = this;
        var _ret = '';
        var _message = _self.getMessage();
        _ret = _getMessageBodyHtml(_message);
        return _ret;
    };

    ColumnQuestionnaireMessageView.getMessageBodyHtml = function (message) {
        var _ret = '';
        if (!message || typeof message != 'object') {
            return _ret;
        }
        _ret = _getMessageBodyHtml(message);
        return _ret;
    };

    function _getMessageBodyHtml(msg) {
        var _title = msg.getMessage();
        var _deleteFlag = msg.getDeleteFlag();
        if(_deleteFlag == 2){
            _title = _title.replace("deleted_by_admin", Resource.getMessage('deleted_questionnaire_body_by_admin'));
            _title = _title.replace("deleted", Resource.getMessage('deleted_questionnaire_body'));
        }
        var _escapedTitlePre = Utils.convertEscapedHtml(_title, false);
        var _escapedTitleTag = Utils.convertEscapedTag(_title);
        var _escapedTitle = ViewUtils.replaceHashtagElement(_escapedTitlePre);
        var _ret = '';
        _ret += '<div class="box-border olient-vertical message-info">';
        _ret += '<div class="message-body box-border-for-abbreviation olient-vertical">';
        _ret += '<pre class="" title="' + _escapedTitleTag + '">' + _escapedTitle + '</pre>';
        _ret += _getOptionsHtml(msg);
        _ret += '</div>';
        _ret += '</div>';

        return _ret;
    }

    _proto._setReadMessage = function () {
    };
    _proto._setMessageReadFlgView = function () {
    };
})();
