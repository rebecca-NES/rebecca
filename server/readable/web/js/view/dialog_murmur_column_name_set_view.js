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
function DialogMurmurColumnNameSetView(columnInfo) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this.columnInfo = columnInfo;
    DialogOkCancelView.call(this);
};(function() {
    DialogMurmurColumnNameSetView.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = DialogMurmurColumnNameSetView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _rootElement = _self._dialogInnerElement;
        var _columnNameInputElement = _rootElement.find('input#column-name');
        _columnNameInputElement.on('keypress', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                _self._updateColumnNameExecute();
            }
        });
        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _self._updateColumnNameExecute();
        })
    };
    _proto.showDialog = function() {
        var _self = this;
        _self._onOpenDialog();
        var _columnNameInputElement = _self._dialogInnerElement.find('input#column-name');
        _columnNameInputElement.blur();
        _columnNameInputElement.focus();
    };
    _proto._onOpenDialog = function() {
        var _self = this;
        _self._initInputData();
        $('#modal_area').css('display', 'block');
        $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
        _self._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
        $('.overlay').animate({ 'opacity':0.3}, 200 );
    };
    _proto._initInputData = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _columnNameInputElement = _rootElement.find('input#column-name');
        var _defaultVal = _self.columnInfo._columnName != null ? _self.columnInfo._columnName : '';
        _columnNameInputElement.val(_defaultVal);
    };

    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = "";

        _ret = '<div id="murmur-column-name-modal" class="card modal_card">';
        _ret += '    <div class="card_title">';
        _ret += '      <p>' + Resource.getMessage('dialog_label_murmur_column_name_set'); + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <div class="modal_content">';
        _ret += '        <input type="text" id="column-name" placeholder="' + Resource.getMessage('dialog_placeholder_murmur_column_name') + '" class="field ui-corner-all column-name-input">';
        _ret += '        <p id="dialog-notes" style="padding: 0 15px;">' + Resource.getMessage('dialog_set_murmur_column_name_note') + '</p>';
        _ret += '      </div>';
        _ret += '    </div>';
        _ret += '    <div class="btn_wrapper">';
        _ret += '      <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '      <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_label_ok') + '</span></button>';
        _ret += '    </div>';
        _ret += '    <a class="modal_exit modal_exit_btn ico_btn ui-dialog-columnNamebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };

    _proto._updateColumnNameExecute = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        if (!_self._isChangeData(_rootElement)) {
            ViewUtils.modal_allexit();
            return true;
        }
        if (!_self._isValidationOk(_rootElement)) {
            return false;
        }

        var _columnNameElement = _rootElement.find('input#column-name');
        var _columnNameStr = Utils.excludeControleCharacters(_columnNameElement.val());
        const jid = MurmurColumnInformation.getOwnJidFromSearchCondition(_self.columnInfo);
        if(jid == null){
            return false;
        }
        if(jid != LoginUser.getInstance().getJid()){
            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('authority_err'));
            return false;
        }
        CubeeServerConnector.getInstance().setMurmurColumnName(jid, encodeURIComponent(_columnNameStr))
                            .then((res)=>{
                                ViewUtils.modal_allexit();
                                return;
                            })
                            .catch((err)=>{
                                if (err && err.content.reason) {
                                    switch (err.content.reason) {
                                        case (403000):
                                            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('authority_err'));
                                            break;
                                        default:
                                            _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_update_column_name_error'));
                                            break;
                                    }
                                } else {
                                    _self._dialogAreaElement.find("#dialog-error").text(Resource.getMessage('dialog_update_column_name_error'));
                                }
                                return;
                            })
        return true;
    };
    _proto._isChangeData = function(formObj) {
        var _self = this;
        var _ret = true;
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _rootElement = formObj.find('input#column-name');
        var _columnName = _rootElement.val();
        if (_columnName == _self.columnInfo._columnName) {
            _ret = false;
        }
        return _ret;
    };

    _proto._isValidationOk = function(formObj) {
        var _self = this;
        var _ret = true;
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _rootElement = formObj.find('input#column-name');
        var _columnName = _rootElement.val();
        formObj.find("#dialog-error").text('');
        _rootElement.removeClass('input-error');
        if (_columnName.length > 20) {
            _rootElement.addClass('input-error');
            formObj.find("#dialog-error").text(Resource.getMessage('dialog_update_column_name_validation_error'));
            _ret = false;
        }
        return _ret;
    };
})();
