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
function CustomFilterSetting() {
};(function(){
    CustomFilterSetting.createSettingFilterCondition = function(setting) {
        var _ret = null;
        if(setting == null || typeof setting != 'object') {
            return _ret;
        }
        var _conditionArray = new ArrayList();
        if(setting.sender != null) {
            var _senderJidCondition = CustomFilterSetting.createSenderSettingFilterCondition(setting.sender);
            if(_senderJidCondition != null) {
                _conditionArray.add(_senderJidCondition);
            }
        }
        if(setting.attached_file == true || setting.having_url == true) {
            var _attachedFileAndHavingUrlSettingFilterCondition = CustomFilterSetting.createAttachedFileAndHavingUrlSettingFilterCondition(setting.attached_file, setting.having_url);
            if(_attachedFileAndHavingUrlSettingFilterCondition != null) {
                _conditionArray.add(_attachedFileAndHavingUrlSettingFilterCondition);
            }
        }
        if(setting.term != null && setting.term != 0) {
            var _termSettingFilterCondition = CustomFilterSetting.createTermSettingFilterCondition(setting.term);
            if(_termSettingFilterCondition != null) {
                _conditionArray.add(_termSettingFilterCondition);
            }
        }
        if(setting.unread != null && setting.unread == true) {
            var _unreadSettingFilterCondition = CustomFilterSetting.createUnreadSettingFilterCondition();
            if(_unreadSettingFilterCondition != null) {
                _conditionArray.add(_unreadSettingFilterCondition);
            }
        }
        _ret = CustomFilterSetting.createSettingFilterConditionFromConditionArray(_conditionArray);

        return _ret;
    };

    CustomFilterSetting.createSettingFilterConditionFromConditionArray = function(conditionArray) {
        var _ret = null;
        if(conditionArray == null) {
            return _ret;
        }
        var _conditionCount = conditionArray.getCount();
        if(_conditionCount > 0) {
            if(_conditionCount == 1) {
                _ret = conditionArray.get(0);
            } else {
                _ret = new AndCondition();
                for(var _i = 0; _i < _conditionCount; _i++) {
                    _ret.addChildCondition(conditionArray.get(_i));
                }
            }
        }
        return _ret;
    };

    CustomFilterSetting.createSenderSettingFilterCondition = function(senderJid) {
        var _ret = null;
        if(senderJid == null) {
            return _ret;
        }
        var _senderJid = Utils.trimStringMulutiByteSpace(senderJid);
        if(_senderJid == '') {
            return _ret;
        }
        _ret = new ItemCondition();
        _ret.setData('msgfrom', _senderJid);
        return _ret;
    };

    CustomFilterSetting.createAttachedFileAndHavingUrlSettingFilterCondition = function(isAttachedFile, isHavingUrl) {
        var _ret = null;
        var _attachedFileStyleUrl = Utils.getDocumentRootUrlWithoutProtocol() + 'f/';
        var _attachedFileStyleUrlNew = Utils.getDocumentRootUrlWithoutProtocol() + 'file/';
        if(isAttachedFile == true && isHavingUrl == true) {
            _ret = new OrCondition();

            var _httpCondition = new KeywordCondition();
            _httpCondition.setData('http://');
            _ret.addChildCondition(_httpCondition);

            var _httpsCondition = new KeywordCondition();
            _httpsCondition.setData('https://');
            _ret.addChildCondition(_httpsCondition);
        } else if(isAttachedFile == true) {
            _ret = new OrCondition();

            var _httpAttachedFileStyleUrlCondition = new KeywordCondition();
            _httpAttachedFileStyleUrlCondition.setData('http://' + _attachedFileStyleUrl);
            _ret.addChildCondition(_httpAttachedFileStyleUrlCondition);

            var _httpsAttachedFileStyleUrlCondition = new KeywordCondition();
            _httpsAttachedFileStyleUrlCondition.setData('https://' + _attachedFileStyleUrl);
            _ret.addChildCondition(_httpsAttachedFileStyleUrlCondition);

            var _httpAttachedFileStyleUrlNewCondition = new KeywordCondition();
            _httpAttachedFileStyleUrlNewCondition.setData('http://' + _attachedFileStyleUrlNew);
            _ret.addChildCondition(_httpAttachedFileStyleUrlNewCondition);

            var _httpsAttachedFileStyleUrlNewCondition = new KeywordCondition();
            _httpsAttachedFileStyleUrlNewCondition.setData('https://' + _attachedFileStyleUrlNew);
            _ret.addChildCondition(_httpsAttachedFileStyleUrlNewCondition);
        } else if(isHavingUrl == true) {
            _ret = new AndCondition();
            var _urlCondition = ParticularCondition.createMessageHavingUrlExceptAttachedFileCondition(_attachedFileStyleUrl);
            _ret.addChildCondition(_urlCondition);
            var _urlNewCondition = ParticularCondition.createMessageHavingUrlExceptAttachedFileCondition(_attachedFileStyleUrlNew);
            _ret.addChildCondition(_urlNewCondition);
        }
        return _ret;
    };
    CustomFilterSetting.createTermSettingFilterCondition = function(term) {
        var _ret = null;
        if(term == null || typeof term != 'number') {
            return _ret;
        }
        var _date = null;
        switch(term) {
            case DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE:
                break;
            case DialogSettingCustomFilterView.TERM_DATA_24_HOUR_VALUE:
                _date = Date.create('1 day ago');
                break;
            case DialogSettingCustomFilterView.TERM_DATA_48_HOUR_VALUE:
                _date = Date.create('2 days ago');
                break;
            case DialogSettingCustomFilterView.TERM_DATA_1_WEEK_VALUE:
                _date = Date.create('last week');
                break;
            case DialogSettingCustomFilterView.TERM_DATA_1_MONTH_VALUE:
                _date = Date.create('last month');
                break;
            case DialogSettingCustomFilterView.TERM_DATA_1_YEAR_VALUE:
                _date = Date.create('last year');
                break;
            default:
                break;
        }
        if(_date == null) {
            return _ret;
        }
        var _dateString = Utils.getDate(_date, Utils.DISPLAY_STANDARD_DATE_FORMAT);
        _ret = new GreaterThanCondition();
        _ret.setData('created_at', _dateString);
        return _ret;
    };

    CustomFilterSetting.createUnreadSettingFilterCondition = function(){
        var _logUser = LoginUser.getInstance();
        var _jid = _logUser.getJid();
        var _ret = new AndCondition();
        _ret.addChildCondition(ParticularCondition.createUnreadMessageFileCondition(_jid));
        var _notCondition = new NotCondition();
        var _notItemCondition = new ItemCondition();
        _notItemCondition.setData('msgtype', Message.TYPE_QUESTIONNAIRE);
        _notCondition.setChildCondition(_notItemCondition);
        _ret.addChildCondition(_notCondition);
        return _ret;
    }
})();

function DialogSettingCustomFilterView(title, columnInfo, ownerObj, parentColumn) {

    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;

    this._submitButtonTitle = DialogOkCancelView.LABEL_OK;

    this._columnInfo = columnInfo;
    this._ownerObj = ownerObj;

    this._parentColumn = parentColumn;

    DialogSettingView.call(this, title); 
};(function() {
    DialogSettingCustomFilterView.SETTING_VALUE_HAVING_ATTACHED_FILE = 1;
    DialogSettingCustomFilterView.SETTING_VALUE_HAVING_URL = 2;
    DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE = 0;
    DialogSettingCustomFilterView.TERM_DATA_24_HOUR_VALUE = 1;
    DialogSettingCustomFilterView.TERM_DATA_48_HOUR_VALUE = 2;
    DialogSettingCustomFilterView.TERM_DATA_1_WEEK_VALUE = 3;
    DialogSettingCustomFilterView.TERM_DATA_1_MONTH_VALUE = 4;
    DialogSettingCustomFilterView.TERM_DATA_1_YEAR_VALUE = 5;
    DialogSettingCustomFilterView.TERM_DATA_ARRAY = [
            {value: DialogSettingCustomFilterView.TERM_DATA_24_HOUR_VALUE, label: Resource.getMessage('custom_filter_label_term_24_hours')},
            {value: DialogSettingCustomFilterView.TERM_DATA_48_HOUR_VALUE, label: Resource.getMessage('custom_filter_label_term_48_hours')},
            {value: DialogSettingCustomFilterView.TERM_DATA_1_WEEK_VALUE, label: Resource.getMessage('custom_filter_label_term_1_week')},
            {value: DialogSettingCustomFilterView.TERM_DATA_1_MONTH_VALUE, label: Resource.getMessage('custom_filter_label_term_1_month')},
            {value: DialogSettingCustomFilterView.TERM_DATA_1_YEAR_VALUE, label: Resource.getMessage('custom_filter_label_term_1_year')}
        ];
    DialogSettingCustomFilterView.prototype = $.extend({}, DialogSettingView.prototype);

    var _super = DialogSettingView.prototype;

    var _proto = DialogSettingCustomFilterView.prototype;

    _proto._init = function() {

        var _self = this;

        _super._init.call(_self);

        var _rootElement = _self._dialogInnerElement;

        var _targetInputElement = _rootElement.find('input.target');
        _targetInputElement.on('change', function(e) {
            _self._changeTarget(e.target);
        });

        var _senderJid = '';
        var _attachedFile = false;
        var _havingUrl = false;
        var _term = DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE;
        var _unread = false;
        var _setting = null;
        if(_self._columnInfo.getSetting != null && typeof _self._columnInfo.getSetting == 'function') {
            _setting = _self._columnInfo.getSetting();
        }
        if(_setting) {
            _senderJid = (_setting.sender != null)? _setting.sender : _senderJid;
            _attachedFile = (_setting.attached_file != null)? _setting.attached_file : _attachedFile;
            _havingUrl = (_setting.having_url != null)? _setting.having_url : _havingUrl;
            _term = (_setting.term != null)? _setting.term : _term;
            _unread = (_setting.unread != null)? _setting.unread : _unread;
        }

        _self._setSenderJid(_senderJid);
        _self._setHavingAttachedFileCheckStatus(_attachedFile);
        _self._setHavingUrlCheckStatus(_havingUrl);
        _self._setTermData(_term);
        _self._setUnreadCheckStatus(_unread);

        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _self._searchExecute();
        })
    };

    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = '';
        _ret += '<div id="colfilter_modal" class="card modal_card">';
        _ret += '<div class="card_title">';
        _ret += '  <p>'+Resource.getMessage('column_btn_filter')+'</p>';
        _ret += '</div>';
        _ret += '<div class="list_wrapper">';
        _ret += '<ul class="modal_list select_list">';
        _ret += _self._displayFieldSender();

        _ret += _self._displayFieldUrl();

        _ret += _self._displayFieldTerm();

        _ret += _self._displayFieldUnread();

        _ret += '</ul>';
        _ret += '</div>';
        _ret += '<div class="btn_wrapper">';
        _ret += '  <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '  <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_ok')+'</span></button>';
        _ret += '</div>';
        _ret += '<a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';

        return _ret;
    };

    _proto._displayFieldSender = function() {
        var _self = this;
        var _autoCompleteInfo = ViewUtils.getAutoCompleteAttributesFromColumnInfo(_self._columnInfo);
        var _ret = '';

        _ret += '<li>';
        _ret += '  <label for="sender_checkbox">';
        _ret += '    <label class="checkbox checkbox_title">';
        _ret += '      <input type="checkbox" class="target" id="sender_checkbox" name="sender-checkbox" value="1">';
        _ret += '        <span></span>' + Resource.getMessage('custom_filter_label_sender');
        _ret += '    </label>';
        _ret += '    <input type="text" class="field sender-input ui-corner-all ' + _autoCompleteInfo.autoCompleteType + '" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '" ' + _autoCompleteInfo.roomIdAttribute + '>';

        _ret += '  </label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._displayFieldUrl = function() {
        var _self = this;
        var _ret = '';

        _ret += '<li>';
        _ret += '  <label for="">';
        _ret += '    <label style="margin-right:20px">';
        _ret += '    <span></span>' + Resource.getMessage('custom_filter_label_having_attached_file_and_url') + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" id="having_attached_file_checkbox" name="having-attached-file" value="' + DialogSettingCustomFilterView.SETTING_VALUE_HAVING_ATTACHED_FILE + '"><span></span>' + Resource.getMessage('custom_filter_label_having_attached_file') + '</label>';
        _ret += '  <label class="checkbox checkbox_btn"><input type="checkbox" id="having_url_checkbox" name="having-url" value="' + DialogSettingCustomFilterView.SETTING_VALUE_HAVING_ATTACHED_FILE + '"><span></span>' + Resource.getMessage('custom_filter_label_having_url') + '</label>';
        _ret += '</li>';
        return _ret;
    };

    _proto._displayFieldTerm = function() {
        var _self = this;
        var _ret = '';

        _ret += '<li>';
        _ret += '  <label for="term_checkbox">';
        _ret += '    <label class="checkbox checkbox_title">';
        _ret += '      <input type="checkbox" class="target" id="term_checkbox" name="term-checkbox" value="1">';
        _ret += '      <span></span>' + Resource.getMessage('custom_filter_label_term');
        _ret += '    </label>';
        _ret += '    <select class="field term-select ui-corner-all">';
        var _termDataArray = DialogSettingCustomFilterView.TERM_DATA_ARRAY;
        for(var _i = 0; _i < _termDataArray.length; _i++) {
            var _termData = _termDataArray[_i];
            var _selected = ((_i == 0) ? 'selected' : '');
            _ret += '<option value="' + _termData.value + '" ' + _selected + '">' + _termData.label + '</option>';
        }
        _ret += '    </select>';
        _ret += '  </label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._displayFieldUnread = function() {
        var _self = this;
        var _ret = '';

        _ret += '<li>';
        _ret += '  <label for="unread_checkbox">';
        _ret += '    <label class="checkbox">';
        _ret += '      <input type="checkbox" class="target" id="unread_checkbox" name="unread-checkbox" value="1">';
        _ret += '      <span></span>' + Resource.getMessage('custom_filter_label_unread_message');
        _ret += '    </label>';
        _ret += '  </label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._changeTarget = function(_targetInputElement) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = $(_targetInputElement).closest('fieldset');
        var _childElem = _fieldsetElement.children('div').find('*');
        if(_targetInputElement.checked) {
            _childElem.removeAttr('disabled');
        } else {
            _childElem.attr('disabled','disabled');
            var _textElement = _fieldsetElement.find('input[type=text]');
            if(_textElement) {
                _textElement.removeClass('input-error');
            }
        }
        return true;
    };

    _proto._searchExecute = function() {

        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        var _colmunTypeFilter;
        var _filterColumnInformation = new CustomFilterColumnInfomation();

        _self._checkSetting(_rootElement, _onChackSetting);

        function _onChackSetting(result) {
            if (result == false) {
                return;
            }

            _filterColumnInformation.setSourceColumnDisplayName(_self._getDisplayName());

            var _sourceColumnType = _self._columnInfo.getColumnType();
            var _beginningColumnType = null;
            var _isEdit = false;
            if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_CUSTOM_FILTER) {
                _sourceColumnType = _self._columnInfo.getSourceColumnType();
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _beginningColumnType = _self._columnInfo.getBeginningColumnType();
                }
                _isEdit = true;
            } else {
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _beginningColumnType = _self._columnInfo.getSourceColumnType();
                }
            }

            _filterColumnInformation.setSourceColumnType(_sourceColumnType);
            if(_beginningColumnType != null) {
                _filterColumnInformation.setBeginningColumnType(_beginningColumnType);
            }

            var _subData = {};
            if(_isEdit) {
                _subData = _self._columnInfo.getSubData();
            } else {
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_CHAT) {
                    _subData.partner = _self._columnInfo.getFilterCondition();
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_GROUP_CHAT) {
                    var _roomInfo = _self._columnInfo.getChatRoomInfomation();
                    var _roomId = _roomInfo.getRoomId();
                    _subData.roomId = _roomId;
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_FEED){
                    var _roomInfo = _self._columnInfo.getCommunityInfomation();
                    var _roomId = _roomInfo.getRoomId();
                    _subData.roomId = _roomId;
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_COMMUNITY_TASK) {
                    var _communityInfo = _self._columnInfo.getCommunityInfomation();
                    var _roomId = _communityInfo.getRoomId();
                    _subData.roomId = _roomId;
                } else if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH || _sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                    _subData = CustomFilterColumnInfomation.copySubData(_self._columnInfo.getSubData());
                }
            }
            _filterColumnInformation.setSubData(_subData);
            if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH || _sourceColumnType == ColumnInformation.TYPE_COLUMN_FILTER) {
                var _keywordStr = _self._columnInfo.getKeyword();
                var _narrowFilterCondition = null;
                if(_sourceColumnType == ColumnInformation.TYPE_COLUMN_SEARCH) {
                    var _srcSourceColumnTypeList = _self._columnInfo.getSourceColumnTypeList();
                    var _dstSourceColumnTypeList = _filterColumnInformation.getSourceColumnTypeList();
                    var _srcSourceColumnTypeListCount = _srcSourceColumnTypeList.getCount();
                    for(var _i = 0; _i < _srcSourceColumnTypeListCount; _i++) {
                        _dstSourceColumnTypeList.add(_srcSourceColumnTypeList.get(_i));
                    }
                    if(_subData != null && _subData.roomId != null && _subData.roomId != '') {
                        _narrowFilterCondition = ColumnFilterManager.getColumnFilterForCommunity(_dstSourceColumnTypeList, _subData);
                    } else {
                        _narrowFilterCondition = ColumnFilterManager.getColumnFilterList(_dstSourceColumnTypeList);
                    }
                } else {
                    _narrowFilterCondition = ColumnFilterManager.getColumnFilter(_beginningColumnType, _subData);
                }
                var _searchKeywordFilter = ViewUtils.getKeywordFilterFromKeywordInputString(_keywordStr);
                _colmunTypeFilter = new AndCondition();
                _colmunTypeFilter.addChildCondition(_narrowFilterCondition);
                _colmunTypeFilter.addChildCondition(_searchKeywordFilter);

                _filterColumnInformation.setKeyword(_keywordStr);
            } else {
                _colmunTypeFilter = ColumnFilterManager.getColumnFilter(_sourceColumnType, _subData);
            }
            if(_colmunTypeFilter == null) {
                return;
            }

            _self._getSettingFromView(_onGetSettingFromView);
        }

        function _onGetSettingFromView(setting) {
            var _settingFilter = _self._createSettingFilterCondition(setting);
            var _columnFilter;
            if(_settingFilter != null) {
                _columnFilter = new AndCondition();
                _columnFilter.addChildCondition(_colmunTypeFilter);
                _columnFilter.addChildCondition(_settingFilter);
            } else {
                _columnFilter = _colmunTypeFilter;
            }

            var _columnSort = new ColumnSortCondition();
            var _columnSearchCondition = new ColumnSearchCondition(_columnFilter, _columnSort);

            _filterColumnInformation.setSearchCondition(_columnSearchCondition);

            _filterColumnInformation.setSetting(setting);

            if(_self._parentColumn == null) {
                ColumnManager.getInstance().insertAfterColumn(_filterColumnInformation, _self._ownerObj, true, true);
            } else {
                _self._parentColumn.searchAgain(_filterColumnInformation);
            }

            ViewUtils.modal_allexit();
        }
    };

    _proto._getSettingFromView = function(callback) {
        var _self = this;
        var _ret = {};
        _self._getSenderSettingData(_onGetSenderSettingData);
        _ret.attached_file = _self._getAttachedFileSetteingData();
        _ret.having_url = _self._getHavingUrlSetteingData();
        _ret.term = _self._getTermSettingData();
        _ret.unread = _self._getUnreadSetteingData();
        function _onGetSenderSettingData(sender) {
            _ret.sender = sender;
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(_ret);
                }, 1);
            }
        }
    };

    _proto._getSenderSettingData = function(callback) {
        var _self = this;
        var _ret = '';
        if(_self._isTargetSender()) {
            _self._getSenderJid(_onGetSenderJid);
        } else {
            _onGetSenderJid(null);
        }
        function _onGetSenderJid(jid) {
            if(jid != null) {
                _ret = jid;
            }
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(_ret);
                }, 1);
            }
        }
    };

    _proto._getAttachedFileSetteingData = function() {
        var _self = this;
        return _self._getHavingAttachedFileCheckState();
    };

    _proto._getHavingUrlSetteingData = function() {
        var _self = this;
        return _self._getHavingUrlCheckState();
    };

    _proto._getTermSettingData = function() {
        var _self = this;
        var _ret = DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE;
        if(_self._isTargetTerm()) {
            _ret = _self._getTermData();
        }
        return _ret;
    };

    _proto._getUnreadSetteingData = function() {
        var _self = this;
        return _self._getUnreadCheckState();
    };

    _proto._createSettingFilterCondition = function(setting) {
        return CustomFilterSetting.createSettingFilterCondition(setting);
    };

    _proto._getDisplayName = function()
    {
        var _self = this;
        var _displayName = _self._columnInfo.getDisplayName();

        var _columnType = _self._columnInfo.getColumnType();
        if (_columnType == ColumnInformation.TYPE_COLUMN_TASK || _columnType == ColumnInformation.TYPE_COLUMN_INBOX) {
            _displayName = ViewUtils.createDisplayName(_self._columnInfo);
        }
        return _displayName;
    };

    _proto._checkSetting = function(filterFormObj, callback) {
        var _self = this;

        if (!filterFormObj || typeof filterFormObj != 'object') {
            return false;
        }

        var _ret = true;

        filterFormObj.find("#dialog-error").text('');

        var _invalidTextArray = new Array();

        _self._checkSenderSetting(filterFormObj, _invalidTextArray, _onCheckSenderSetting);

        function _onCheckSenderSetting(result) {
            if(result == false) {

                var _errorStr = '';

                if(_invalidTextArray.length > 0) {

                    var _invalidTextStr = '';
                    for(var _i=0; _i<_invalidTextArray.length; _i++) {

                        if(_i > 0) {
                            _invalidTextStr += ', ';
                        }

                        _invalidTextStr += _invalidTextArray[_i];
                    }
                    _errorStr += _invalidTextStr + Resource.getMessage('custom_filter_error_text');
                }

                filterFormObj.find("#dialog-error").text(_errorStr);
            }
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(result);
                }, 1);
            }
        }
    };

    _proto._checkSenderSetting = function(filterFormObj, invalidTextArray, callback) {
        var _self = this;
        var _ret = true;
        if(_self._isTargetSender()) {
            _self._getSenderJid(_onGetSenderJid);
        } else {
            _callCallback();
        }
        function _onGetSenderJid(jid) {
            if (jid == null || Utils.trimStringMulutiByteSpace(jid) == '') {
                filterFormObj.find('input.sender-input').addClass('input-error');
                var _invalidText = _self._getInvalidSenderSettingText();
                invalidTextArray.push(_invalidText);
                _ret = false;
            }
            _callCallback();
        }
        function _callCallback() {
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(_ret);
                }, 1);
            }
        }
    };

    _proto._getInvalidSenderSettingText = function() {
        var _self = this;
        return Resource.getMessage('custom_filter_label_sender');
    };


    _proto._getSenderJid = function(callback) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('.sender-input');

        var _account = Utils.trimStringMulutiByteSpace(_element.val());
        ViewUtils.convertAccountStrToJidStrFromServer(_account, _onConvertAccountStrToJidStr);
        function _onConvertAccountStrToJidStr(jid) {
            if(callback && typeof callback == 'function') {
                setTimeout(function() {
                    callback(jid);
                }, 1);
            }
        }
    };
    _proto._setSenderJid = function(senderJid) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="sender_checkbox"]');
        if(senderJid) {
            _fieldsetElement.find('input#sender_checkbox').prop('checked',true);
            ViewUtils.convertJidStrToAccountStrFromServer(senderJid, function(account) {
                _fieldsetElement.find('.sender-input').val(account);
            });
        } else {
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        }
    };

    _proto._getHavingAttachedFileCheckState = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('input#having_attached_file_checkbox:checked');
        return (_element.length > 0)? true: false;
    };
    _proto._setHavingAttachedFileCheckStatus = function(havingAttachedFileCheckSatus) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        if(havingAttachedFileCheckSatus) {
            _rootElement.find('input#having_attached_file_checkbox').prop('checked',true);
        }
    };

    _proto._getHavingUrlCheckState = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('input#having_url_checkbox:checked');
        return (_element.length > 0)? true: false;
    };
    _proto._setHavingUrlCheckStatus = function(havingUrlCheckSatus) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        if(havingUrlCheckSatus) {
            _rootElement.find('input#having_url_checkbox').prop('checked',true);
        }
    };

    _proto._getTermData = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _termValueStr = _rootElement.find('select.term-select').val();
        return parseInt(_termValueStr);
    };
    _proto._setTermData = function(termDataValue) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _fieldsetElement = _rootElement.find('label[for="term_checkbox"]');
        if(termDataValue == DialogSettingCustomFilterView.TERM_DATA_NONE_VALUE) {
            var _childElem = _fieldsetElement.children('div').find('*');
            _childElem.attr('disabled','disabled');
        } else {
            _fieldsetElement.find('input#term_checkbox').prop('checked',true);
            _fieldsetElement.find('select.term-select').val(termDataValue);
        }
    };
    _proto._getUnreadCheckState = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('input#unread_checkbox:checked');
        return (_element.length > 0)? true: false;
    };
    _proto._setUnreadCheckStatus = function(unreadCheckSatus) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        if(unreadCheckSatus) {
            _rootElement.find('input#unread_checkbox').prop('checked',true);
        }
    };
    _proto._isTargetSender = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('input#sender_checkbox:checked');
        return (_element.length > 0)? true: false;
    };

    _proto._isTargetTerm = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _element = _rootElement.find('input#term_checkbox:checked');
        return (_element.length > 0)? true: false;
    };

})();
