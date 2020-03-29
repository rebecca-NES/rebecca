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
function DialogChatRoomUpdateRoomInfoView(title, roomId) {
    this._dialogAreaElement = $('#modal_area');
    this._dialogInnerElement = null;
    this._title = title;
    this._roomId = roomId;
    this._roomInfo = null;
    DialogSettingView.call(this, title);
};(function() {
    DialogChatRoomUpdateRoomInfoView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogChatRoomUpdateRoomInfoView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);

        _self._dialogAreaElement.html(_self.getInnerHtml());
        _self._dialogInnerElement = _self._dialogAreaElement.children();

        var _rootElement = _self._dialogInnerElement;
        var _roomNameInputElement = _rootElement.find('input#room_name');
        _roomNameInputElement.on('keypress', function(e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                _self._updateRoomInfoExecute();
            }
        });
        _self._dialogInnerElement.find('.modal_btn').on('click', function(){
            _self._updateRoomInfoExecute();
        })
    };
    _proto.showDialog = function() {
        var _self = this;
        _self._onOpenDialog();
    };
    _proto._onOpenDialog = function() {
        var _self = this;
        function _onGetRoomInfoCallBack(roomInfo){
            _self._roomInfo = roomInfo;
            _self._initInputData();
            $('#modal_area').css('display', 'block');
            $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
            _self._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
            $('.overlay').animate({ 'opacity':0.3}, 200 );
        }
        var _ret = CubeeController.getInstance().getRoomInfo(_self._roomId, _onGetRoomInfoCallBack);
        if(!_ret){
            console.log('GetRoomInfo Request is fail');
            ViewUtils.modal_allexit();
            return false;
        }
    };
    _proto._initInputData = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _roomNameInputElement = _rootElement.find('input#room_name');
        if(!_self._roomInfo){
            return;
        }
        var _defaultVal = _self._roomInfo.getRoomName();
        _roomNameInputElement.val(_defaultVal);
        var _privacyType = _self._roomInfo.getPrivacyType();
        _self._dialogInnerElement.find("#gc_privacy_type").val(_privacyType);
        _roomNameInputElement.blur();
        _roomNameInputElement.focus();
    };

    _proto.getInnerHtml = function() {
        var _self = this;
        var _ret = "";

        _ret = '<div id="grouptitle_modal" class="card modal_card">';
        _ret += '    <div class="card_title">';
        _ret += '      <p>' + _self._title + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content_wrapper">';
        _ret += '      <div class="modal_content">';
        _ret += '        <p class="modal_title">' + Resource.getMessage('dialog_label_roomname') + '</p>';
        _ret += '        <input type="text" id="room_name" placeholder="' + Resource.getMessage('dialog_placeholder_roomname') + '" class="field ui-corner-all" maxlength="50">';
        _ret += '      </div>';
        _ret += '    <div class="modal_content w50">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('community_privacy') + '</p>';
        _ret += '      <select id="gc_privacy_type" class="field term-select ui-corner-all">\
            <option value="0" >'+Resource.getMessage('community_privacy_open')+'</option>\
            <option value="2" selected>'+Resource.getMessage('community_privacy_secret')+'</option>\
        </select>';
        _ret += '    </div>';

        _ret += '    </div>';
        _ret += '      <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <div class="btn_wrapper">';
        _ret += '      <button type="button" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">' + Resource.getMessage('dialog_label_ok') + '</span></button>';
        _ret += '    </div>';
        _ret += '    <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };

    _proto._updateRoomInfoExecute = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        if (!_self._isChangeData(_rootElement)) {
            ViewUtils.modal_allexit();
            return true;
        }
        if (!_self._isValidationOk(_rootElement)) {
            return false;
        }

        var _roomNameElement = _rootElement.find('input#room_name');
        var _roomNameStr = Utils.excludeControleCharacters(_roomNameElement.val());
        _self._roomInfo.setRoomName(_roomNameStr);
        var _privacyType = parseInt($('#gc_privacy_type').val());
        _self._roomInfo.setPrivacyType(_privacyType);

        var _ret = CubeeController.getInstance().updateChatRoomInfo(_self._roomInfo, _onUpdateRoomInfoCallBack);
        if(!_ret){
            console.log('UpdateRoomInfo Request is fail');
        }
        ViewUtils.modal_allexit();
        return true;

        function _onUpdateRoomInfoCallBack(){
        };
    };
    _proto._isChangeData = function(formObj) {
        var _self = this;
        var _ret = true;
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _rootElement = formObj.find('input#room_name');
        var _roomName = _rootElement.val();
        if (!_self._roomInfo || _roomName == _self._roomInfo.getRoomName()) {
            if ( _self._roomInfo.getPrivacyType() == parseInt($('#gc_privacy_type').val())) {
                _ret = false;
            }
        }
        return _ret;
    };

    _proto._isValidationOk = function(formObj) {
        var _self = this;
        var _ret = true;
        if (!formObj || typeof formObj != 'object') {
            return false;
        }
        var _rootElement = formObj.find('input#room_name');
        var _roomName = _rootElement.val();
        formObj.find("#dialog-error").text('');
        _rootElement.removeClass('input-error');
        if (_roomName == '' || Utils.trimStringMulutiByteSpace(_roomName) == '') {
            _rootElement.addClass('input-error');
            formObj.find("#dialog-error").text(Resource.getMessage('group_chat_error_room_name'));
            _ret = false;
        }
        var _privacyType = parseInt(formObj.find('#gc_privacy_type').val());
        if (_privacyType != 0 && _privacyType != 2) {
            formObj.find("#dialog-error").text(Resource.getMessage('dialog_error_invalid_input'));
            _ret = false;
        }
        return _ret;
    };
})();
