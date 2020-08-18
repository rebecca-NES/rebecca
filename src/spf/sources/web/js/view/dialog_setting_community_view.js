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

function DialogSettingCommunityView(communityId) {
    var _title = Resource.getMessage('setting_community_dialog_title');
    this._submitButtonTitle = Resource.getMessage('button_update');

    this._communityId = communityId;
    DialogCommunityCreateSettingBaseView.call(this, _title);
};(function() {
    DialogSettingCommunityView.prototype = $.extend({}, DialogCommunityCreateSettingBaseView.prototype);
    var _super = DialogCommunityCreateSettingBaseView.prototype;
    var _proto = DialogSettingCommunityView.prototype;

    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);

        CubeeController.getInstance().getCommunityInfo(_self._communityId, function(communityInfo){
            _self.communityInfo = communityInfo;
            var _roomName = communityInfo.getRoomName();
            var _privacyType = communityInfo.getPrivacyType();
            var _memberEntryType = communityInfo.getMemberEntryType();
            var _description = communityInfo.getDescription();
            _memberEntryType = ViewUtils.communityMemberEntryTypeNumToStr(_memberEntryType);
            _self._dialogInnerElement.find("input[name=community-title]").val(_roomName);
            _self._dialogInnerElement.find("textarea[name=community-description]").val(_description);
            _self._dialogInnerElement.find("#project_privacy_type").val(_privacyType);
            _self._dialogInnerElement.find(".project_memberentrytype").html(_memberEntryType);
            var projectcolor = chkColorInfo(communityInfo.getMemberEntryType());
            _self._dialogInnerElement.find('input[name=community-color][value="#E04F5F"]').prop('checked', projectcolor==="#E04F5F");
            _self._dialogInnerElement.find('input[name=community-color][value="#E7953B"]').prop('checked', projectcolor==="#E7953B");
            _self._dialogInnerElement.find('input[name=community-color][value="#FAD43D"]').prop('checked', projectcolor==="#FAD43D");
            _self._dialogInnerElement.find('input[name=community-color][value="#98D44E"]').prop('checked', projectcolor==="#98D44E");
            _self._dialogInnerElement.find('input[name=community-color][value="#32BEA6"]').prop('checked', projectcolor==="#32BEA6");
            _self._dialogInnerElement.find('input[name=community-color][value="#51B8FD"]').prop('checked', projectcolor==="#51B8FD");
            _self._dialogInnerElement.find('input[name=community-color][value="#187BCE"]').prop('checked', projectcolor==="#187BCE");
            _self._dialogInnerElement.find('input[name=community-color][value="#AF69C4"]').prop('checked', projectcolor==="#AF69C4");
            _self._dialogInnerElement.find('input[name=community-color][value="#F195AD"]').prop('checked', projectcolor==="#F195AD");
            _self._dialogInnerElement.find('input[name=community-color][value="#A17255"]').prop('checked', projectcolor==="#A17255");
            _self._dialogInnerElement.find('input[name=community-color][value="#8CA8BC"]').prop('checked', projectcolor==="#8CA8BC");
            _self._dialogInnerElement.find('input[name=community-color][value="#555555"]').prop('checked', projectcolor==="#555555");

        });
    };

    function chkColorInfo (_color){
        var _self = this;

        if(_color.indexOf('#') == -1) {
           _color = '#' + _color;
        }

        if (SelectAndAddProjectView._colors.indexOf(_color) >= 0) {
            return _color;
        } else {
            return SelectAndAddProjectView._default_color;
        }
    };

     _proto._request = function(dialogObj) {
         var _self = this;
         var _rootElement = _self._dialogInnerElement;
         var _titleElem = _rootElement.find('input[name="community-title"]');
         var _descriptionElm = _rootElement.find('textarea[name="community-description"]');
         var _titleStr = Utils.excludeControleCharacters(_titleElem.val());
         var _descriptionStr = Utils.excludeControleCharacters(_descriptionElm.val());
         var communityColor = $('input[name=community-color]:checked').val();
         var _communityInfo = new CommunityInfo();
         _communityInfo.setRoomId(_self._communityId);
         _communityInfo.setRoomName(_titleStr);
         _communityInfo.setDescription(_descriptionStr);
         var _privacyType = parseInt($('#project_privacy_type').val());
         _communityInfo.setPrivacyType(_privacyType);
         if(communityColor == null || communityColor == '') {
             _communityInfo.setMemberEntryType(Conf.getVal('DEFAULT_PROJECT_COLOR'));
         } else {
             _communityInfo.setMemberEntryType(Utils.getSafeStringData(communityColor));
         }

         loadingIconOnDialog();

         var _inputLogoElm = _rootElement.find('input[name="logofile"]');
         if(_inputLogoElm.val() != ''){
             var _files = _inputLogoElm.prop('files');
             var _file = _files[0];
             return CubeeController.getInstance().uploadCommunityLogo(_self.communityInfo.getRoomId(), _file, _onUploadLogoCallback);
         }else{
             var _communityLogo = _self.communityInfo.getLogoUrl();
             _communityInfo.setLogoUrl(_communityLogo);
             return CubeeController.getInstance().updateCommunity(_communityInfo, _onUpdateCommunity);
         }

         function _onUploadLogoCallback(responce) {
           var _result = responce.result;
             if(_result == 'failed'){
                 _rootElement.find("#dialog-error").text( Resource.getMessage('config_community_change_failed'));
                 _rootElement.find(".success_btn").attr("disabled", false);
                 return;
             }
             _communityInfo.setLogoUrl(responce.path);
             return CubeeController.getInstance().updateCommunity(_communityInfo, _onUpdateCommunity);
         };

         function _onUpdateCommunity(updatedCommunityInfo){
             _rootElement.find(".success_btn").attr("disabled", false);
             if(updatedCommunityInfo == null){
                 _rootElement.find("#dialog-error").text( Resource.getMessage('config_community_change_failed'));
                 return;
             }
             let view = new CommunityDetailsView();
             view.init(updatedCommunityInfo.getRoomId());
             view.setCommunityDetailData(updatedCommunityInfo.getRoomId());
             SelectAndAddProjectView.getInstance().getProjectList(updatedCommunityInfo);

             TabManager.getInstance().selectOrAddTabByCommunityInfo(updatedCommunityInfo.getRoomId(), updatedCommunityInfo);

             _self.cleanup();
         }

         function loadingIconOnDialog(){
             ViewUtils.hideLoadingIconInChild($('#dialog-error'));
             ViewUtils.showLoadingTopInChild($('#dialog-error'));
             _self._dialogInnerElement.find(".success_btn").attr("disabled", true);
             _self._dialogInnerElement.find("#dialog-error").text("");
         }
     };

     _proto.cleanup = function() {
         ViewUtils.modal_allexit();
     };

})();
