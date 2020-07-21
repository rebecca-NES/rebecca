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

function DialogSelectChatRoomMemberView(title, roomId) {
    var _self = this;
    DialogSelectMemberView.call(this, title, roomId);
};(function() {
    DialogSelectChatRoomMemberView.prototype = $.extend({}, DialogSelectMemberView.prototype);
    var _super = DialogSelectMemberView.prototype;
    var _proto = DialogSelectChatRoomMemberView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
    };

    _proto._isValidateJoinedMember = function(memberInfo, onValidateCallBack) {
        var _self = this;

        var _roomId = _self._groupId;
        var _roomInfo = ColumnManager.getInstance()._getChatroomInformationFromColumnObjByRoomId(_roomId);
        if(_roomInfo === null){
            var _ret = CubeeController.getInstance().getRoomInfo(_roomId, _onGetRoomInfoCallBack);
            if(!_ret){
                console.log('GetRoomInfo Request is fail');
                _self._dialogInnerElement.dialog("close");
                return false;
            }
        }else{
            _onGetRoomInfoCallBack(_roomInfo);
        }

        function _onGetRoomInfoCallBack(roomInfo){
            var _existMemberList = new PersonList();
            var _notExistMemberList = new PersonList();

            if(roomInfo === null){
                setTimeout(function(){ onValidateCallBack(null); },100);
                return;
            }
            var _memberList = memberInfo.memberList;
            var _memberCount = _memberList.getCount();
            var _roomMemberList = roomInfo.getMemberList();
            var _roomMemberCount = _roomMemberList.getCount();

            for(var j=0; j<_memberCount; j++){
                var _isExist = false;
                var jid = memberInfo.memberList.get(j).getJid();

                for(var i = 0; i < _roomMemberCount; i++) {
                    if(jid == _roomMemberList.get(i)){
                        _isExist = true;
                        break;
                    }
                }
                if(_isExist){
                    _existMemberList.add(_memberList.get(j));
                }else{
                    _notExistMemberList.add(_memberList.get(j));
                }
            }

            onValidateCallBack(_self._validateJoinedMember(memberInfo, _existMemberList, _notExistMemberList));
        }
    };

    _proto._getRoomMemberList = function(roomId){
        return new Promise((resolve, reject) => {

            function _onGetPersonDatas(personList) {
                if (personList == null) {
                    return reject('getPersonData result no data');
                }
                resolve(personList);
            }

            function _onGetRoomInfoCallBack(roomInfo){
                if(roomInfo == null){
                    return reject('GetRoomInfo result no data');
                }
                CubeeController.getInstance().getPersonDataByJidFromServer(
                    roomInfo.getMemberList(),
                    _onGetPersonDatas
                )
            }
            var _roomInfo = ColumnManager.getInstance()._getChatroomInformationFromColumnObjByRoomId(roomId);
            if (_roomInfo == null) {
                var _ret = CubeeController.getInstance().getRoomInfo(roomId, _onGetRoomInfoCallBack);
                if(!_ret){
                    return reject('GetRoomInfo Request is fail');
                }
            }else{
                _onGetRoomInfoCallBack(_roomInfo);
            }
        });
    }

})();
