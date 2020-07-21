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

function CustomFilterInboxSetting() {
};(function(){
    CustomFilterInboxSetting.createSettingFilterCondition = function(setting) {
        var _ret = null;
        if(setting == null || typeof setting != 'object') {
            return _ret;
        }
        var _conditionArray = new ArrayList();
        if(setting.sender != null) {
            var _senderJidCondition = CustomFilterInboxSetting.createSenderSettingFilterCondition(setting.sender);
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
        _ret = CustomFilterSetting.createSettingFilterConditionFromConditionArray(_conditionArray);

        return _ret;
    };

    CustomFilterInboxSetting.createSenderSettingFilterCondition = function(senderJid) {
        var _ret = null;
        if(senderJid == null) {
            return _ret;
        }
        var _senderJid = Utils.trimStringMulutiByteSpace(senderJid);
        if(_senderJid == '') {
            return _ret;
        }
        _ret = new ItemCondition();
        _ret.setData('client', _senderJid);
        return _ret;
    };
})();

function DialogSettingCustomFilterInboxView(title, columnInfo, ownerObj, parentColumn) {
    DialogSettingCustomFilterView.call(this, title, columnInfo, ownerObj, parentColumn);
};(function() {

    DialogSettingCustomFilterInboxView.prototype = $.extend({}, DialogSettingCustomFilterView.prototype);

    var _super = DialogSettingCustomFilterView.prototype;

    var _proto = DialogSettingCustomFilterInboxView.prototype;

    _proto._init = function() {

        var _self = this;

        _super._init.call(_self);
    };

    _proto._displayFieldSender = function() {

        var _self = this;
        var _autoCompleteInfo = ViewUtils.getAutoCompleteAttributesFromColumnInfo(_self._columnInfo);
        var _ret = '';

        _ret += '<li>';
        _ret += '  <label for="sender_checkbox">';
        _ret += '    <label class="checkbox checkbox_title">';
        _ret += '      <input type="checkbox" class="target" id="sender_checkbox" name="sender-checkbox" value="1">';
        _ret += '        <span></span>';
        _ret +=          Resource.getMessage('custom_filter_inbox_label_sender');
        _ret += '    </label>';
        _ret += '    <input type="text" class="field sender-input ui-corner-all ' + _autoCompleteInfo.autoCompleteType + '" placeholder="' + Resource.getMessage('dialog_placeholder_account') + '" ' + _autoCompleteInfo.roomIdAttribute + '>';
        _ret += '  </label>';
        _ret += '</li>';

        return _ret;
    };

    _proto._getInvalidSenderSettingText = function() {
        var _self = this;
        return Resource.getMessage('custom_filter_inbox_label_sender');
    };

    _proto._createSettingFilterCondition = function(setting) {
        return CustomFilterInboxSetting.createSettingFilterCondition(setting);
    };

    _proto._displayFieldUnread = function() {
        var _ret = '';
        return _ret;
    };

    _proto._getUnreadCheckState = function() {
        return false;
    };
    _proto._setUnreadCheckStatus = function(unreadCheckSatus) {
        return;
    };

})();
