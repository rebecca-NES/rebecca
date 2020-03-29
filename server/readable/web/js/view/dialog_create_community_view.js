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
function DialogCreateCommunityView() {
    var _title = Resource.getMessage('create_community_dialog_title');
    this._submitButtonTitle = Resource.getMessage('button_create');
    DialogCommunityCreateSettingBaseView.call(this, _title);
};(function() {
    DialogCreateCommunityView.prototype = $.extend({}, DialogCommunityCreateSettingBaseView.prototype);
    var _super = DialogCommunityCreateSettingBaseView.prototype;
    var _proto = DialogCreateCommunityView.prototype;
    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
    };

    _proto._request = function(dialogObj) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _titleElem = _rootElement.find('input[name="community-title"]');
        var _descriptionElm = _rootElement.find('textarea[name="community-description"]');
        var _titleStr = _titleElem.val();
        var _descriptionStr = _descriptionElm.val();
        var communityColor = $('input[name=community-color]:checked').val();
        var _communityInfo = new CommunityInfo();
        _communityInfo.setRoomName(_titleStr);
        _communityInfo.setDescription(_descriptionStr);
        var _privacyType = parseInt($('#project_privacy_type').val());
        _communityInfo.setPrivacyType(_privacyType);
        if(communityColor == null || communityColor == '') {
            _communityInfo.setMemberEntryType(Conf.getVal('DEFAULT_PROJECT_COLOR'));
        } else {
            _communityInfo.setMemberEntryType(Utils.getSafeStringData(communityColor));
        }

        _communityInfo.setLogoUrl('');

        loadingIconOnDialog();

        return CubeeController.getInstance().createCommunity(_communityInfo, _onCreateCommunity);

        function _onCreateCommunity(createdCommunityInfo){
            if(createdCommunityInfo.hasOwnProperty('content')){
                if(createdCommunityInfo.content.reason == 403000){
                      errOnDialog(Resource.getMessage('authority_err'));
                }else{
                      errOnDialog(Resource.getMessage('create_community_err'));
                }
                ViewUtils.hideLoadingIconInChild($('#dialog-error'));
                return;
            }

            var _inputLogoElm = _rootElement.find('input[name="logofile"]');
            var delCommunityId = $('.project_btn').attr('data_value');

            if(_inputLogoElm.val() != ''){
                var _files = _inputLogoElm.prop('files');
                var _file = _files[0];
                return CubeeController.getInstance().uploadCommunityLogo(createdCommunityInfo.getRoomId(), _file,_onUploadLogoCallback);

                function _onUploadLogoCallback(responce) {
                    var _result = responce.result;
                    if(_result == 'failed'){
                        errOnDialog(Resource.getMessage('community_logo_setting_failed'));
                        _rootElement.find('.btn_wrapper #onCreatePrj').prop("disabled", true);
                        return;
                    }
                    _communityInfo.setRoomId(createdCommunityInfo.getRoomId());

                    _communityInfo.setLogoUrl(responce.path);

                    return CubeeController.getInstance().updateCommunity(_communityInfo, _onUpdateCommunity);
                }

                function _onUpdateCommunity(updatedCommunityInfo){
                    if(updatedCommunityInfo == null){
                        errOnDialog(Resource.getMessage('community_logo_setting_failed'));
                        _rootElement.find('.btn_wrapper #onCreatePrj').prop("disabled", true);
                    }else{
                        refreshProject(updatedCommunityInfo.getRoomId(), updatedCommunityInfo, delCommunityId);
                    }
                }
            }
            refreshProject(createdCommunityInfo.getRoomId(), createdCommunityInfo, delCommunityId);
        }

        function refreshProject(_projectId, _communityInfo, _delCommunityId){
            SelectAndAddProjectView.getInstance().getProjectList(_communityInfo);

            function deleteProject(){
                var _tabCommunity = new TabCommunityItemView();

                if(_delCommunityId != "myworkplace"){
                    _tabCommunity.init(_delCommunityId);
                }
                TabManager.getInstance()._deleteProject(_tabCommunity);
            }

            TabManager.getInstance().selectOrAddTabByCommunityInfo(_projectId, _communityInfo, deleteProject);

            ViewUtils.hideLoadingIconInChild($('#dialog-error'));

            ViewUtils.modal_allexit();
        }

        function errOnDialog(errMessage){
            var _errElement = _rootElement.find("#dialog-error");
            _errElement.text(errMessage);

            _rootElement.find('.btn_wrapper #onCreatePrj').prop("disabled", false);
            $(".ui-dialog-titlebar-close").show();
        }

        function loadingIconOnDialog(){
            _rootElement.find('.btn_wrapper #onCreatePrj').prop("disabled", true);
            $(".ui-dialog-titlebar-close").hide();

            ViewUtils.hideLoadingIconInChild($('#dialog-error'));
            ViewUtils.showLoadingTopInChild($('#dialog-error'));
        }
    };

})();
