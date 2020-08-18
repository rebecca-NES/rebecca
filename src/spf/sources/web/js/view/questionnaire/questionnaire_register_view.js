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

function QuestionnaireRegister(parentObject, message){
    this._parentObject = parentObject;
    this._messageData = message;
    this._registedMessageData = undefined;
    this._registerForm = undefined;
    this.init();
};(function(){
    QuestionnaireRegister.MAX_LENGTH_QUESTIONNAIRE_OPTION = Conf.getVal('QUESTIONNAIRE_OPTION_MAX_LENGTH');
    QuestionnaireRegister.OPTION_MAX_COUNT = 10;
    QuestionnaireRegister.OPTION_MIN_COUNT = 2;
    QuestionnaireRegister.OPTION_DEFAUL_COUNT = 3;
    QuestionnaireRegister.OPTION_REMAIN_COUNT = QuestionnaireRegister.OPTION_MAX_COUNT - QuestionnaireRegister.OPTION_DEFAUL_COUNT;
    QuestionnaireRegister.ROOM_TYPE_FEED = 1;
    QuestionnaireRegister.ROOM_TYPE_GROUPCHAT = 3;
    QuestionnaireRegister.ROOM_TYPE_COMMUNITY = 5;
    QuestionnaireRegister.COUNT = 20;

    var _proto = QuestionnaireRegister.prototype;
    var _range;
    var _optionCount = 0;

    _proto.init = function(){
        var _self = this;
        _self._questionnaireInputType = _self._messageData.getInputType();
        _self._questionnaireResultVisible = _self._messageData.getResultVisible();
        _self._questionnaireGraphType = _self._messageData.getGraphType();
        _self._questionnaireStartDate = (_self._messageData.getStartDate ? _self._messageData.getStartDate() : '');
        _self._questionnaireStartDateStr = (_self._questionnaireStartDate ? Utils.getDate(_self._questionnaireStartDate.toString(), FORMAT) : '');
        _self._questionnaireDueDate = (_self._messageData.getDueDate ? _self._messageData.getDueDate() : _self._messageData.getDueDate);
        _self._questionnaireDueDateStr = (_self._questionnaireDueDate ? Utils.getDate(_self._questionnaireDueDate.toString(), FORMAT) : '');
    };

    _proto.getInputType = function(){
        return [
             {value: QuestionnaireMessage.INPUTTYPE_RADIO, label: Resource.getMessage('questionnaire_inputType_radiobox')}
            ,{value: QuestionnaireMessage.INPUTTYPE_CHECKBOX, label: Resource.getMessage('questionnaire_inputType_checkbox')}
        ];
    };

    _proto.getResultVisible = function(){
        return [
            {value: QuestionnaireMessage.INFORMATION_PUBLIC, label: Resource.getMessage('questionnaire_resultVisible_public')}
            ,{value: QuestionnaireMessage.INFORMATION_PRIVATE, label: Resource.getMessage('questionnaire_resultVisible_private')}
        ];
    };

    _proto.getGraphType = function(){
        return [
            {value: QuestionnaireMessage.GRAPHTYPE_BAR, label: Resource.getMessage('questionnaire_graphType_bar')},
            {value: QuestionnaireMessage.GRAPHTYPE_PIE, label: Resource.getMessage('questionnaire_graphType_pie')}
        ];
    };

    _proto.getCreateQuestionnaireForm = function(){
        var _self = this;
        var _form = '';
        var i, selected;

        _optionCount = 0;

        _form += '<div class="questionnaire-register-area olient-vertical">';

        _form += '  <div class="questionnaire-register-header box-border olient-horizontal">';
        _form += '    <span class="reg-questionnaire-title">' + Resource.getMessage('questionnaire_title_createQuestionnaire') + '</span>';
        _form += '  </div>';

        _form += '  <div class="questionnaire-register-scroll-area">';

        _form += '  <div class="layout-grouping">';

        _form += '  <div class="register-questionnaire-body olient-horizontal">';
        _form += '    <div class="questionnaire-body-textarea-area flex1">';
        _form += '      <textarea name="questionnaire-body" class="questionnaire-register-item ui-corner-all autocomplete" placeholder="' + Resource.getMessage('questionnaire_body_placeholder') + '" style="min-height: 4em;"></textarea>';
        _form += '    </div>';
        _form += '    <div class="register-questionnaire-body-char-counter">';
        _form +=        ViewUtils.getCharCounterHtml('char-counter-questionnaire-register');
        _form += '    </div>';
        _form += '  </div>';

        _form += '  </div>';

        _form += '  <div class="layout-grouping">';
        _form += '  <div class="register-questionnaire-table register-questionnaire-Range box-border olient-horizontal">';
        _form += '    <div class="register-questionnaire-label">' + Resource.getMessage('questionnaire_range_title') + '</div>';
        _form += '    <div class="register-questionnaire-item">';
        _form += '      <select  id = "rangeId" class="questionnaire-Range questionnaire-register-item ui-corner-all width-100">';
        _form += '        <option value="-1,-1">' + Resource.getMessage('questionnaire_range_value_no_select') + '</option>';
        _form += '      </select>';
        _form += '    </div>';
        _form += '  </div>';

        var resultVisibles = _self.getResultVisible();
        _form += '  <div class="register-questionnaire-table register-questionnaire-resultVisible box-border olient-horizontal">';
        _form += '    <div class="register-questionnaire-label">' + Resource.getMessage('questionnaire_resultVisible_title') + '</div>';
        _form += '    <div class="register-questionnaire-item">';
        _form += '      <select class="questionnaire-resultVisible questionnaire-register-item ui-corner-all width-100">';
        for (i=0; i<resultVisibles.length; i++) {
            var resultVisible = resultVisibles[i];
            selected = ((_self._questionnaireResultVisible == resultVisible.value) ? 'selected' : '');
            _form += '        <option value="' + resultVisible.value + '" ' + selected + '>' + resultVisible.label + '</option>';
        }
        _form += '      </select>';
        _form += '    </div>';
        _form += '  </div>';

        _form += '  </div>';

        _form += '  <div class="layout-grouping">';
        var inputTypes = _self.getInputType();
        _form += '  <div class="register-questionnaire-table register-questionnaire-inputType box-border olient-horizontal">';
        _form += '    <div class="register-questionnaire-label">' + Resource.getMessage('questionnaire_inputtype_title') + '</div>';
        _form += '    <div class="register-questionnaire-item">';
        _form += '      <select class="questionnaire-inputType questionnaire-register-item ui-corner-all width-100">';
        for (i=0; i<inputTypes.length; i++) {
            var inputType = inputTypes[i];
            selected = ((_self._questionnaireInputType == inputType.value) ? 'selected' : '');
            _form += '        <option value="' + inputType.value + '" ' + selected + '>' + inputType.label + '</option>';
        }
        _form += '      </select>';
        _form += '    </div>';
        _form += '  </div>';

        var graphTypes = _self.getGraphType();
        _form += '  <div class="register-questionnaire-table register-questionnaire-graphType box-border olient-horizontal">';
        _form += '    <div class="register-questionnaire-label">' + Resource.getMessage('questionnaire_graphType_title') + '</div>';
        _form += '    <div class="register-questionnaire-item">';
        _form += '      <select class="questionnaire-graphType questionnaire-register-item ui-corner-all width-100">';
        for (i=0; i<graphTypes.length; i++) {
            var graphType = graphTypes[i];
            selected = ((_self._questionnaireGraphType == graphType.value) ? 'selected' : '');
            _form += '        <option value="' + graphType.value + '" ' + selected + '>' + graphType.label + '</option>';
        }
        _form += '      </select>';
        _form += '    </div>';
        _form += '  </div>';
        _form += '  </div>';

        _form += '  <div class="layout-grouping">';
        _form += '  <div class="register-questionnaire-table register-questionnaire-start-date box-border olient-horizontal box-align-center">';
        _form += '    <div class="register-questionnaire-label">' + Resource.getMessage('questionnaire_start_date') + '</div>';
        _form += '    <div class="register-questionnaire-item" style = "display: flex">';
        _form += '      <div style="flex:1;"><input class="questionnaire-start-date date-time-picker-start questionnaire-register-item ui-corner-all" value="' + _self._questionnaireStartDateStr + '"></div>';
        _form += '    </div>';
        _form += '  </div>';

        _form += '  <div class="register-questionnaire-table register-questionnaire-due-date box-border olient-horizontal box-align-center">';
        _form += '    <div class="register-questionnaire-label">' + Resource.getMessage('questionnaire_due_date') + '</div>';
        _form += '    <div class="register-questionnaire-item" style = "display: flex">';
        _form += '      <div style="flex:1;"><input class="questionnaire-due-date date-time-picker-due questionnaire-register-item ui-corner-all" value="' + _self._questionnaireDueDateStr + '"></div>';
        _form += '    </div>';
        _form += '  </div>';

        _form += '  </div>';

        _form += '  <div class="layout-grouping">';
        _form += '  <div class="register-questionnaire-buttons olient-horizontal">';
        _form += '    <button id = "AddOption" class="register-questionnaire-add" >' + Resource.getMessage('questionnaire_item_add') + '</button>';
        _form += '    <label id = "optionCount" class="register-optionCount-label">' + QuestionnaireRegister.OPTION_REMAIN_COUNT + '</label>';
        _form += '  </div>';
        _form += '  </div>';

        _form += '  <div class="layout-grouping-option" id = "insert">';

        for (i = 1; i < 4; i++) {
            _form += createOptionItemHtml(i);
            _optionCount++;
        }
        _form += '  </div>';

        _form += '  </div>';

        _form += '  <div class="register-questionnaire-buttons">';
        _form += '    <button class="register-questionnaire-OK">' + Resource.getMessage('dialog_label_ok2') + '</button>';
        _form += '    <button class="register-questionnaire-Cancel">' + Resource.getMessage('dialog_label_cancel') + '</button>';
        _form += '  </div>';

        _form += '</div>';

        var form = (_self._registerForm = $(_form));
        var optionArea = $(form).find('div#insert');
        optionArea.on('click', 'span.img_option_delete', function() {
            var formCount = document.getElementById ("optionCount").innerText;
            if (formCount < QuestionnaireRegister.OPTION_MAX_COUNT - QuestionnaireRegister.OPTION_MIN_COUNT) {
                var parent = $(this).parent();
                parent = parent.parent();
                parent = parent.parent();
                parent.remove();

                optionArea.children().each(function(index, item) {
                    var _item = $(item);
                    _item.find("div.register-questionnaire-label").text(Resource.getMessage('QuestionnaireOption') + (index + 1));
                });

                formCount++;
                document.getElementById ("optionCount").innerText = formCount;
                if(formCount > 0) {
                    $(form).find('#AddOption').attr('disabled', false);
                }
                _optionCount--;
            }
            _self.ps.update();
        });

        var rangeSelectClick = $(form).find('select#rangeId');
        rangeSelectClick.on('click', function() {
            var title = Resource.getMessage('questionnaire_dialog_range_title');
            var dialogView = null;
            var selectOption = $("select#rangeId").find("option:selected");

            dialogView = new DialogSelectQuestinnaireRangeView(title, selectOption);
            if(dialogView){
                dialogView.showDialog();
            }
        });

        ViewUtils.setCharCounter(form.find('textarea'),
            form.find('.register-questionnaire-body-char-counter .char-counter-questionnaire-register'),
            ColumnView.TEXTAREA_MAX_LENGTH, false)

        var _optionItems = optionArea.children();
        for (i = 0; i < _optionItems.length; i++) {
            var item = $(_optionItems[i]);
            var $input = item.find("input");
            var $charCounter = item.find('.' + ViewUtils.CHAR_COUNTER_CLASSNAME);
            ViewUtils.setCharCounter($input, $charCounter, QuestionnaireRegister.MAX_LENGTH_QUESTIONNAIRE_OPTION, true);
        }

        var startDate = new Date();
        var dueDate = new Date();
        dueDate.setDate(dueDate.getDate()+ 1);
        var dateTimePicker_start = $(form).find('input.date-time-picker-start');
        var dateTimePicker_due = $(form).find('input.date-time-picker-due');
        $(dateTimePicker_start).datetimepicker({
            showOn : "focus",
            dateFormat : Utils.DISPLAY_DATEPICKER_DATE_FORMAT,
            defaultDate: startDate
        }).next('img.date-time-pickers-icon-calender').on('click', function(){
            $(this).prev('input.date-time-picker-start').eq(0).focus();
        });
        $(dateTimePicker_due).datetimepicker({
            showOn : "focus",
            dateFormat : Utils.DISPLAY_DATEPICKER_DATE_FORMAT,
            defaultDate: dueDate
        }).next('img.date-time-pickers-icon-calender').on('click', function(){
            $(this).prev('input.date-time-picker-due').eq(0).focus();
        });
        var questionnaireButtonBlock = $(form).find('div.register-questionnaire-buttons');
        var questionnaireButtonOK = $(questionnaireButtonBlock).find('button.register-questionnaire-OK').button();
        var questionnaireButtonCancel = $(questionnaireButtonBlock).find('button.register-questionnaire-Cancel').button();
        var questionnaireButtonAdd = $(questionnaireButtonBlock).find('button.register-questionnaire-add').button();
        $(questionnaireButtonOK).on('click', function(){
            _self._parentObject.onQuestionnaireRegist(_self);
        });
        $(questionnaireButtonCancel).on('click', function(){
            _self._parentObject.onQuestionnaireEditCancel();
        });

        $(questionnaireButtonAdd).on('click', function(){
            _optionCount++;
            var _optionHtml = createOptionItemHtml(_optionCount);
            _self.onQuestionnaireEditAdd(_optionHtml);
        });
        _self.ps = new PerfectScrollbar($(form).find('.questionnaire-register-scroll-area')[0], {
            suppressScrollX: true
        });
        col_scr.push(_self.ps);
        return form;
    };

    _proto.onQuestionnaireEditAdd = function(_optionHtml) {
        var _self = this;
        var _form = _self._registerForm;
        var _item = $(_optionHtml);
        _form.find("div#insert").append(_item);

        var $input = _item.find("input");
        var $charCounter = _item.find('.' + ViewUtils.CHAR_COUNTER_CLASSNAME);
        ViewUtils.setCharCounter($input, $charCounter, QuestionnaireRegister.MAX_LENGTH_QUESTIONNAIRE_OPTION, true);

        var formCount = document.getElementById ("optionCount").innerText;
        formCount--;
        document.getElementById ("optionCount").innerText = formCount;
        if(formCount == 0) {
            _form.find("#AddOption").attr('disabled', true);
        }
        _self.ps.update();
    };

    function createOptionItemHtml(n) {
        var form = '';

        form += '  <div class="layout-grouping">';
        form += '  <div class="register-questionnaire-optionItems register-questionnaire-option olient-horizontal width-100">';
        form += '    <div class="register-questionnaire-label box-border olient-vertical">' + Resource.getMessage('questionnaire_item_option') + n + '</div>';
        form += '    <div class="register-questionnaire-item">';
        form += '  <input style="height: 27px;" type="text" class="questionnaire-register-item register-option-input ui-corner-all autocomplete width-100" placeholder="' + Resource.getMessage('questionnaire_option_text') + '">';
        form += '    </div>';
        form += '    <div style="display: table; text-align: center; width: 35px;">';
        form += '      <span style="display: table-cell; vertical-align: middle;" class="img_option_delete"><a class="col_btn col_question_close_btn ico_btn"><i class="fa fa-close"></i></a></span>';
        form += '    </div>';
        form += '    <div style="height: 33px; width: 20px;" class="register-questionnaire-name-char-counter">';
        form +=        ViewUtils.getCharCounterHtml('char-counter-questionnaire-register');
        form += '    </div>';
        form += '  </div>';
        form += '  </div>';

        return form;
    }

    _proto._addTextareaAutosize = function(registerForm) {
        var questionnaireBodyTextareaBlock = registerForm.find('div.questionnaire-body-textarea-area');
        var questionnaireBodyTextarea = $(questionnaireBodyTextareaBlock).find('textarea');
        $(questionnaireBodyTextarea).autosize();
    };

    _proto.getRegistedMessageData = function(){
        return this._registedMessageData;
    };

    _proto.registQuestionnaire = function(callback){
        var _self = this;
        if(!_self._registerForm) { throw Resource.getMessage('register form is not defined.'); }
        if(!_self._isValidationOk(_onIsValidation)){
            setTimeout(function() {
                callback(false);
            }, 1);
            return;
        }
        function _onIsValidation(isValidationResult) {
            if(!isValidationResult) {
                callback(false);
                return;
            }
            var _questionnaireMessage = new QuestionnaireMessage();
            if(_self._messageData.getType() == Message.TYPE_QUESTIONNAIRE) {
                _questionnaireMessage.copy(_self._messageData);
            }
            _self.getInputContent(_questionnaireMessage, _onGetInputContent);
        }
        function _onGetInputContent(questionnaireMessage) {
            var _ret = false;

            var _dialog = new DialogQuestionnaireConfirmView(questionnaireMessage, callback);
            _dialog.showDialog();
        }
    };

    _proto.getInputContent = function(questionnaireMessage, callback){
        var _self = this;
        var form = this._registerForm;

        questionnaireMessage.setInputType(parseInt($(form).find('div.register-questionnaire-inputType > div.register-questionnaire-item > select.questionnaire-inputType').val()));
        questionnaireMessage.setResultVisible(parseInt($(form).find('div.register-questionnaire-resultVisible > div.register-questionnaire-item > select.questionnaire-resultVisible').val()));
        questionnaireMessage.setGraphType(parseInt($(form).find('div.register-questionnaire-graphType > div.register-questionnaire-item > select.questionnaire-graphType').val()));
        var rangeStr = Utils.excludeControleCharacters($(form).find('div.register-questionnaire-Range > div.register-questionnaire-item > select.questionnaire-Range').val());
        var paramArray=rangeStr.split(",");
        if (paramArray[0] == 0) {
            questionnaireMessage.setRoomId("");
        } else {
            questionnaireMessage.setRoomId(paramArray[0]);
        }
        questionnaireMessage.setRoomType(paramArray[1]);
        var optionItemArray = new ArrayList();
        var optionArea = $(form).find('div#insert');
        var _optionItems = optionArea.children();
        for (var i = 0; i < _optionItems.length; i++) {
            var item = $(_optionItems[i]);
            var optionContent =  Utils.excludeControleCharacters(item.find("input").val());
            if (optionContent == null || optionContent.length == 0) {
                continue;
            } else {
                optionItemArray.add(optionContent);
            }
        }
        questionnaireMessage.setRoomName($(form).find('select#rangeId option').text())
        questionnaireMessage.setOptionItems(optionItemArray);
        questionnaireMessage.setOptionCount(optionItemArray._length);
        questionnaireMessage.setDueDate($(form).find('div.register-questionnaire-due-date > div.register-questionnaire-item > div > input.questionnaire-due-date').val());
        questionnaireMessage.setStartDate($(form).find('div.register-questionnaire-start-date > div.register-questionnaire-item > div > input.questionnaire-start-date').val());
        var _content = $(form).find('div.register-questionnaire-body > div.questionnaire-body-textarea-area > textarea').val();
        _content = Utils.excludeControleCharacters(_content);
        questionnaireMessage.setMessage(_content);

        _callCallback();

        function _callCallback() {
            if (callback && typeof callback == 'function') {
                setTimeout(function(){
                    callback(questionnaireMessage);
                }, 1);
            }
        }
    };

    _proto._isValidationOk = function(callback) {
        var _ret = true;
        var _self = this;
        var form = this._registerForm;

        setTimeout(function() {
            _validationCheck(null);
        }, 1);

        function _validationCheck(communityInfoOfMember) {
            var _questionnaireBodyTextAreaElem = $(form).find('div.register-questionnaire-body > div.questionnaire-body-textarea-area > textarea');
            _questionnaireBodyTextAreaElem.removeClass('input-error');
            var _message = _questionnaireBodyTextAreaElem.val();
            if(!ViewUtils.isValidInputTextLength(_message)) {
                _questionnaireBodyTextAreaElem.addClass('input-error');
                _ret = false;
            }

            var _questionnaireRangeElem = $(form).find('#rangeId');
            _questionnaireRangeElem.removeClass('input-error');
            if (_questionnaireRangeElem.val().split(",")[0] == "-1") {
                _questionnaireRangeElem.addClass('input-error');
                _ret = false;
            }

            var _questionnaireStartDateInput = $(form).find('div.register-questionnaire-start-date > div.register-questionnaire-item > div > input.questionnaire-start-date');
            var _startDateStr = _questionnaireStartDateInput.val();
            var _startDate = null;
            _questionnaireStartDateInput.removeClass('input-error');
            if (_startDateStr != '') {

                if (Utils.isValidDate(_startDateStr)) {
                    _startDate = new Date(_startDateStr);
                } else {
                    _questionnaireStartDateInput.addClass('input-error');
                    _ret = false;
                }
            }
            var _questionnaireDueDateInput = $(form).find('div.register-questionnaire-due-date > div.register-questionnaire-item > div > input.questionnaire-due-date');
            var _dueDateStr = _questionnaireDueDateInput.val();
            var _dueDate = null;
            _questionnaireDueDateInput.removeClass('input-error');
            if (_dueDateStr != '') {

                if (Utils.isValidDate(_dueDateStr)) {
                    _dueDate = new Date(_dueDateStr);
                } else {
                    _questionnaireDueDateInput.addClass('input-error');
                    _ret = false;
                }
            }
            if (_startDate && _dueDate) {
                if(_startDate.getTime() > _dueDate.getTime()) {
                    if (!_questionnaireStartDateInput.hasClass('input-error')) {
                        _questionnaireStartDateInput.addClass('input-error');
                    }
                    if (!_questionnaireDueDateInput.hasClass('input-error')) {
                        _questionnaireDueDateInput.addClass('input-error');
                    }
                    _ret = false;
                }
            }
            if (_dueDate) {
                var _nowDate = new Date();
                if (_nowDate > _dueDate) {
                    if (!_questionnaireDueDateInput.hasClass('input-error')) {
                        _questionnaireDueDateInput.addClass('input-error');
                    }
                    _ret = false;
                }
            }

            var optionArea = $(form).find('div#insert');
            var _optionItems = optionArea.children();
            for (var i = 0; i < _optionItems.length; i++) {
                var item = $(_optionItems[i]);
                item.find("input").removeClass('input-error');
                var optionContent =  Utils.trimString(item.find("input").val());
                if (optionContent.length == 0 || optionContent.length > QuestionnaireRegister.MAX_LENGTH_QUESTIONNAIRE_OPTION) {
                    item.find("input").addClass('input-error');
                    _ret = false;;
                    break;
                }
                for (var j = 0; j < i; j++) {
                    var compareitem = $(_optionItems[j]);
                    var compareStr =  Utils.trimString(compareitem.find("input").val());
                    if (compareStr == optionContent) {
                        item.find("input").addClass('input-error');
                        compareitem.find("input").addClass('input-error');
                        _ret = false;
                        break;
                    }
                }
                if (_ret == false) {
                    break;
                }
            }

            callback(_ret);
        };
        return true;
    };
})();
