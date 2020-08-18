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

function ColumnQuestionnaireView(columnInformation) {
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_QUESTIONNAIRE;
    this._displayName = ColumnView.DISPLAY_NAME_QUESTIONNAIRE;
    this.createView();
    this._htmlElement.find('button.column-option').hide();
};(function() {
    ColumnQuestionnaireView.cssClass = 'questionnaire-message';
        ColumnQuestionnaireView.prototype = $.extend({}, ColumnView.prototype);
        var _super = ColumnView.prototype;
        var _proto = ColumnQuestionnaireView.prototype;

        _proto.createView = function() {
            var _self = this;
            var columnInfo = this.getColumnInfo();
            if (columnInfo == null || typeof columnInfo != 'object') {
                return;
            }
            var _columnType = _self.getType();
            var displayName = ViewUtils.createDisplayName(columnInfo);
            columnInfo.setDisplayName(displayName);
            var FormAreaHtml = '';
            FormAreaHtml += ColumnSubmitButtonView.getHtml(_columnType);
            this.createHtml(FormAreaHtml);
        };
        _proto._createSubForms = function() {
            var _self = this;
            var _htmlElem = _self.getHtmlElement();
            if(_htmlElem == null) {
                return;
            }
            _htmlElem.find('div.frm-message > button').before(ColumnSubmitButtonView.getHtml(ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE));
            var _btnElement = _htmlElem.find('div.frm-message > button');
            var _reloadBtnElement = _btnElement.eq(0);
            var _questionnaireAddBtnElement = _btnElement.eq(1);
            _self._buttonList = new ArrayList();
            _self._buttonList.add(new ColumnSubmitButtonView(_questionnaireAddBtnElement, _self, Resource.getMessage('questionnaire_registerQuestionnaire_btn') ));
            _self._buttonList.add(new ColumnReloadButtonView(_reloadBtnElement, _self, Resource.getMessage('questionnaire_reloadQuestionnaire_btn') ));
        };
        _proto.getHistoryMessage = function() {
            var _self = this;
            var _columnInfo = _self.getColumnInfo();
            var _condition = _columnInfo.getFilterCondition();
            var _sort = new TaskFilterAndSortCondition().getSortObject(_condition);
            function onGetHistoryMessageCallback(questionnaireMessageList) {
                if (questionnaireMessageList.getCount() < 20) {
                    _self._allMessageReceived = true;
                }
                _self.onGetHistoryMessage(questionnaireMessageList);
                $(window).trigger('resize');
                _self.refreshScrollbar();
            }

            CubeeController.getInstance().getQuestionnaireMessages(_self._currentLoadedItemId, 20, _sort, onGetHistoryMessageCallback);
        };
        _proto.onGetHistoryMessage = function(questionnaireMessageList) {

            var _self = this;
            _self._hideLoadingIconInSelf();
            if (!questionnaireMessageList) {
                return;
            }
            var _count = questionnaireMessageList.getCount();
            for (var _i = 0; _i < _count; _i++) {
                var _questionnaireMessage = questionnaireMessageList.get(_i);
                var _itemId = _questionnaireMessage.getItemId();
                if (!_self.getMsgObjByItemId(_itemId)) {
                    _self.showHistoryMessage(_questionnaireMessage);
                }
            }
        };
        _proto.cleanup = function() {
            var _self = this;
            _super.cleanup.call(_self);
            if(_self._buttonList){
                _self._buttonList.removeAll();
                delete _self._buttonList;
            }
        };
        _proto.clickSubFormButton = function() {
            var _self = this;
            var questionnaireMessage = new QuestionnaireMessage();
            var register = new QuestionnaireRegister(_self, questionnaireMessage);
            var _htmlElem = _self.getHtmlElement();
            if(_htmlElem == null) {
                return;
            }
            var subFormDiv = _htmlElem.find('div.frm-message');
            subFormDiv.children().hide();
            _self._showQuestionnaireEditView(subFormDiv, register);
            $(subFormDiv).css('height', _self._getFrmMessageHeight(subFormDiv));
            $(window).trigger('resize');
        };
        _proto._endSubformEditMode = function() {
            var _self = this;
            var _htmlElem = _self.getHtmlElement();
            if(_htmlElem == null) {
                return;
            }
            var subFormDiv = _htmlElem.find('div.frm-message');
            _self._hideQuestionnaireEditView(subFormDiv);
            subFormDiv.children().show();
            $(window).trigger('resize');
        }
        _proto._hideSubForm = function(subForm) {
            var _self = this;
            $(subForm).children('button').addClass('display-none');
        }
        _proto._showSubForm = function(subForm) {
            var _self = this;
            $(subForm).css('height', '');
            $(subForm).children('button').removeClass('display-none');
        }
        _proto._showQuestionnaireEditView = function(subForm, register) {
            var _self = this;
            $(subForm).append(register.getCreateQuestionnaireForm());
            register._addTextareaAutosize($(subForm).find('div.questionnaire-register-area'));
        }
        _proto._hideQuestionnaireEditView = function(subForm) {
            var _self = this;
            $(subForm).children('div.questionnaire-register-area').remove();
        };
        _proto.onQuestionnaireRegist = function(register){
            var _self = this;
            register.registQuestionnaire(_callback);
            function _callback(result) {
                if(result) {
                    _self._endSubformEditMode();
                    _self.showUpdateMessage(register.getRegistedMessageData());
                }
            }
        };
        _proto.onQuestionnaireEditCancel = function() {
            var _self = this;
            _self._endSubformEditMode();
        };

        _proto.clickReloadButton = function() {
            var _self = this;
            var _htmlElem = _self.getHtmlElement();
            if(_htmlElem == null) {
                return;
            }
            var _questionnaireMessageElement = _htmlElem.find('div.column-content .message-border').not('.' + ViewUtils.LOADING_ICON_CLASS_NAME);
            _self._currentLoadedItemId = 0;
            var _hash = _self._getMsgObjHash();
            for (var key in _hash) {
                _hash[key].cleanup();
                delete _hash[key];
            }
            _self._getMsgObjIndexList().removeAll();
            _questionnaireMessageElement.remove();
            _self._hideLoadingIconInSelf();
            _self._allMessageReceived = false;
            _self._LoadingIcon('div.wrap-frm-message');
            _self.getHistoryMessage();
        };
        _proto.onAddMessageReceive = function(message) {
            var _self = this;
            if (_self._validation({'object' : message}) == false) {
                return;
            }
            _self.onAddQuestionnaireMessageReceive(message);
        };
        _proto.onAddQuestionnaireMessageReceive = function(questionnaireMessage) {
            var _self = this;
            if (questionnaireMessage == null) {
                return;
            }

            if (questionnaireMessage.getType() == Message.TYPE_QUESTIONNAIRE) {
                var _itemId = questionnaireMessage.getItemId();
                if (_self.getMsgObjByItemId(_itemId)) {
                    return;
                }
            }
            _self.showMessage(questionnaireMessage);
        };
        _proto.createMessageObjectOnly = function(msg) {
            var _self = this;
            if (!msg || typeof msg != 'object') {
                return null;
            }
            var _type = msg.getType();
            var _msgObj = null;
            switch(_type) {
                case Message.TYPE_QUESTIONNAIRE:
                    _msgObj = new ColumnQuestionnaireMessageView(_self, msg);
                    break;
                default:
                    console.log('ColumnQuestionnaireView::createMessageObjectOnly _ invalid type:' + _type);
                    break;
            }

            return _msgObj;
        };
        _proto.showMessage = function(msg) {
            var _self = this;
            if (_self._validation({'object' : msg}) == false) {
                return false;
            }
            _self._showMessageData(msg);
            return true;
        };
        _proto.getColumnMessageHtml = function(message) {
            var _ret = '';
            if (!message || typeof message != 'object') {
                return _ret;
            }
            _ret = message.getMessageHtml();
            return _ret;
        };
        _proto.setContentLayout = function(){
            var _self = this;
            var column = _self.getHtmlElement();
            if(column == null) {
                return;
            }
            var columnH = $(column).outerHeight(true);
            var headerH = $(column).children('div.column-header').outerHeight(true);
            var input = $(column).children('div.wrap-frm-message').css('height', '');
            var inputH = $(input).hasClass('display-none') ? 0 : $(input).outerHeight(true);
            var register = $(input).find('div.frm-message > div.task-register-area');
            var regBody = $(register).children('div.task-register-scroll-area').css('height', '');
            var content = $(column).children('div.column-content');
            if(LayoutManager.isDesktop || (headerH + inputH) <= columnH){
                $(content).css('height', (columnH - (headerH + inputH)) + 'px');
            } else {
                $(content).css('height', '0px');
                var nextInputH = columnH - headerH;
                var regHeadH = $(register).children('div.task-register-header').outerHeight(true);
                var regButtonH = $(register).children('div.register-task-buttons').outerHeight(true);
                $(regBody).css('height', (nextInputH - (regHeadH + regButtonH)) + 'px');
                $(input).css('height', nextInputH + 'px');
            }
        }

        _proto._getFrmMessageHeight = function(subFormDiv) {
            var _frmMessageHeight = '';
            var _subElem = $(subFormDiv).get(0);
            var _subFormDivHeight = parseInt($(_subElem).css('height'));
            var _regElem = $(subFormDiv).find('div.task-register-area').get(0);
            var _taskRegisterAreaOuterHeight = $(_regElem).outerHeight(true);
            if (_subFormDivHeight < _taskRegisterAreaOuterHeight) {
                var _subFormDivBorderH = parseInt(subFormDiv.css('borderTopWidth')) + parseInt(subFormDiv.css('borderBottomWidth'));
                var _subFormDivPaddingH = parseInt(subFormDiv.css('paddingTop')) + parseInt(subFormDiv.css('paddingBottom'));
                _frmMessageHeight = (_taskRegisterAreaOuterHeight + _subFormDivBorderH + _subFormDivPaddingH);
            }
            return _frmMessageHeight;
        };
    })();
