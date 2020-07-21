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

function DialogFavoriteGroupView(title, memberList, callback) {
    this._height = 200;
    this._selectedUserList = memberList;
    this._callback = callback;
    DialogSettingView.call(this, title);
};(function() {
    DialogFavoriteGroupView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogFavoriteGroupView.prototype;

    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
        _self.showDialog();
    };

    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = "";
        _ret += '<div class="controls form_controls" style="text-align:center;">';
        _ret += '<select class="favorite-select ui-corner-all" style="margin-top:2em;">';

        var _favoriteGroupMax = FavoriteStore.getInstance().getGroupCount();
        for(var _id = 0; _id < _favoriteGroupMax; _id++){
            _ret += '<option value="' + _id +'"';
            if(_id == 0){
                _ret += 'selected ';
            }
            _ret += 'style="margin-top:0;">' + FavoriteStore.getInstance().getGroupName(_id) + '</option>';
        }
        _ret += '</select>';
        _ret += '</div>';
        return _ret;
    };

    _proto.createSubmitButtonObj = function() {
        var _self = this;
        _self._submitButtonFunc = function() {
            var _dialogObj = this;
            _self.submit(_dialogObj);
        };
        _self._cancelButtonFunc = function() {
            var _dialogObj = this;
            $(_dialogObj).dialog("close");
        };

        var _buttonObj = [];
        _buttonObj.push({
            text : _self.getButtonTitle(),
            click : _self._submitButtonFunc
        });
        _buttonObj.push({
            text : Resource.getMessage('dialog_label_cancel'),
            click : _self._cancelButtonFunc
        });
        return _buttonObj;
    };

    _proto.submit = function(dialogObj) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _valueStr = _rootElement.find('select.favorite-select').val();
        var _selectValue = parseInt(_valueStr);

        var _jidList = [];
        var _count = _self._selectedUserList.getCount();
        for(var _i = 0; _i < _count; _i++){
            _jidList.add(_self._selectedUserList.get(_i));
        }
        FavoriteStore.getInstance().addGroupMember(_selectValue, _jidList);
        _self._dialogInnerElement.dialog("close");
        this._callback(_selectValue);
    };
})();
