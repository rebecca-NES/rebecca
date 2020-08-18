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

function DialogSelectCommunityMemberView(title, commnityId) {
    var _self = this;
    DialogSelectMemberView.call(this, title, commnityId);
};(function() {
    DialogSelectCommunityMemberView.prototype = $.extend({}, DialogSelectMemberView.prototype);
    var _super = DialogSelectMemberView.prototype;
    var _proto = DialogSelectCommunityMemberView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
    };

    _proto._isValidateJoinedMember = function(memberInfo, onValidateCallBack) {
        var _self = this;

        var _communityId = _self._groupId;
        CubeeController.getInstance().getCommunityMemberInfo(_communityId, _onGetCommunityMemberInfo);

        function _onGetCommunityMemberInfo(communityInfo){
            var _existMemberList = new PersonList();
            var _notExistMemberList = new PersonList();

            if(communityInfo === null){
                setTimeout(function(){ onValidateCallBack(null); },100);
                return;
            }
            var _memberList = memberInfo.memberList;
            var _memberCount = _memberList.getCount();
            var _ownerList = communityInfo.getOwnerList();
            var _ownerCount = _ownerList.getCount();
            var _generalMemberList = communityInfo.getGeneralMemberList();
            var _generalMemberCount = _generalMemberList.getCount();

            for(var j=0; j<_memberCount; j++){
                var _isExist = false;
                var jid = memberInfo.memberList.get(j).getJid();

                for(var i = 0; i < _ownerCount; i++) {
                    if(jid == _ownerList.get(i).getJid()){
                        _isExist = true;
                        break;
                    }
                }
                for(var k = 0; k < _generalMemberCount; k++) {
                    if(jid == _generalMemberList.get(k).getJid()){
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
})();
