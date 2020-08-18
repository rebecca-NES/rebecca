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

function MessageBox(message, okCallback, isConfirm, cancelCallback, title, size) {
    this.title = title ? title : Resource.getMessage('dialog_confirmation_title');
    this._displayMessage = message;
    this._width = (size && typeof size.width == 'number') ? size.width : null;
    this._height = (size && typeof size.height == 'number') ? size.height : null;
    this._okCallback = (okCallback && typeof okCallback == 'function') ? okCallback : function(){};
    this._isConfirm = isConfirm;
    DialogOkCancelView.call(this);
};(function() {
    MessageBox.prototype = $.extend({}, DialogOkCancelView.prototype);
    var _super = DialogOkCancelView.prototype;
    var _proto = MessageBox.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);


        $('#dialog_area').html(_self.getDeleteMessageCheckHtml());

        var _dialogSettings = {
            title : _self.title,
            buttons : _self._buttons,
            modal : true,
            autoOpen : true,
            draggable: (LayoutManager.isDesktop ? true : false),
            resizable: false,
            close : function() {}
        };
        if(_self._width){
            _dialogSettings.width = LayoutManager.resetDialogWidth(_self._width);
        }
        if(_self._height){
            _dialogSettings.height = LayoutManager.resetDialogHeight(_self._height);
        }

        _self._dialogInnerElement.dialog(_dialogSettings);
    };
    _proto.getDeleteMessageCheckHtml = function() {
        var _self = this;
        var _ret = "";
        _ret += '<div class="control-group form_group">';
        _ret += '  <label class="control-label form_label message-box">';
        _ret +=      _self._displayMessage ;
        _ret += '  </label>';
        _ret += '</div>';
        return _ret;
    };
})();
