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
function DialogCommunityCreateSettingBaseView(title) {
    this.title = title;
    this._submitButtonTitle = this._submitButtonTitle || Resource.getMessage('dialog_label_ok');
    DialogSettingView.call(this, title);
    this._createEventHandler();
};(function() {
    DialogCommunityCreateSettingBaseView.prototype = $.extend({}, DialogSettingView.prototype);
    var _super = DialogSettingView.prototype;
    var _proto = DialogCommunityCreateSettingBaseView.prototype;

    _proto._init = function() {
        var _self = this;
        _super._init.call(_self);
    };

    _proto.clearInputCommunityLogo = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        _rootElement.find('.modal_content').find('input[type="file"]').replaceWith(_inputCommunityLogoTagHtml());
        _rootElement.find('.modal_content').find('img.form-img-community-logo').attr(
            'src',
            _rootElement.find('.modal_content').find('img.form-img-community-logo').attr('data-ex-src')
        );
    };


    _proto.getInnerHtml = function() {
        var _ret = "";
        _ret += '<div id="addproject_modal" class="card modal_card">';
        _ret += '  <div class="card_title">';
        _ret += '    <p>' + this.title + '</p>';
        _ret += '  </div>';
        _ret += '  <div class="modal_content_wrapper">';
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('community_title') + '</p>';
        _ret += '      <input maxlength="50" type="text" class="field ui-corner-all" name="community-title">';
        _ret += '    </div>';
        _ret += '    <div class="modal_content">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('community_description') + '</p>';
        _ret += '      <textarea maxlength="7000" class="field ui-corner-all" name="community-description" rows="3"></textarea>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content w50">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('community_privacy') + '</p>';
        _ret += '      <select id="project_privacy_type" class="field term-select ui-corner-all">\
            <option value="0" >'+Resource.getMessage('community_privacy_open')+'</option>\
            <option value="2" selected>'+Resource.getMessage('community_privacy_secret')+'</option>\
        </select>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content w50">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('community_member_entry_type') + '</p>';
        _ret += '      <p class="fwb mb0">' + Resource.getMessage('community_member_entry_type_add') + '</p>';
        _ret += '    </div>';
        _ret += '    <div class="modal_content mb0">';
        _ret += '      <p class="modal_title">' + Resource.getMessage('community_color') + '</p>';
        _ret += '      <div class="project_color">';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#E04F5F"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#E7953B"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#FAD43D"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#98D44E"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#32BEA6"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#51B8FD"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#187BCE"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#AF69C4"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#F195AD"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#A17255"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#8CA8BC"><span></span>';
        _ret += '        </label>';
        _ret += '        <label class="color_box">';
        _ret += '          <input type="radio" name="community-color" value="#555555"><span></span>';
        _ret += '        </label>';
        _ret += '      </div>';
        _ret += '    </div>';


        _ret += '    <div class="modal_content mb0">';
        _ret += '        <p class="modal_title">' + Resource.getMessage('community_logo') + '</p>';

        _ret += '                <img class="form-img-community-logo" src="images/no_image.png" data-ex-src="images/no_image.png">';
        _ret += '                <div id="community-logo-field">';
        _ret += '                    <input type="file" name="logofile" accept="image/jpeg, image/gif, image/png">';
        var _accessToken = CubeeController.getInstance().getAccessToken();
        var _account =  LoginUser.getInstance().getLoginAccount();
        _ret += '                    <input type="hidden" name="accesstoken" value="' + _accessToken +'">';
        _ret += '                    <input type="hidden" name="account" value="' + _account + '">';
        _ret += '                    <input type="hidden" name="roomid" value="">';
        _ret += '                </div>';

        _ret += '    </div>';
        _ret += '  </div>';
        _ret += '  <div class="btn_wrapper">';
        _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
        _ret += '    <button type="button" id="onCreatePrj" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-hover" role="button" aria-disabled="false"><span class="ui-button-text">' + this._submitButtonTitle + '</span></button>';
        _ret += '  </div>';
        _ret += '    <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
        _ret += '</div>';
        return _ret;
    };
    _proto.submit = function(dialogObj) {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;
        var _isOk = _self._isValidateOk(_rootElement);
        if(!_isOk){
            return;
        }
        _self._request(dialogObj);
    };
    _proto._isValidateOk = function(formElement) {
        var _self = this;
        if (formElement == null || typeof formElement != 'object') {
            return false;
        }
        var _ret = true;
        var _titleElem = formElement.find('input[name="community-title"]');
        var _descriptionElm = formElement.find('textarea[name="community-description"]');
        var _titleStr = _titleElem.val();
        var _descriptionStr = _descriptionElm.val();
        _titleElem.removeClass('dialog-error');
        _descriptionElm.removeClass('dialog-error');
        if(Utils.trimStringMulutiByteSpace(_titleStr) == ''){
            _ret = false;
            formElement.find("#dialog-error").text( Resource.getMessage('config_community_title_empty') );
            _titleElem.addClass('input-error');
        }
        return _ret;
    };
    _proto._request = function(dialogObj) {
        var _self = this;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self._dialogInnerElement;

        _rootElement.on('change', 'input[type="file"]', function() {
            _rootElement.find("#dialog-error").text('');
            var item = this.files[0];
            if (!item) {
                _self.clearInputCommunityLogo();
                return;
            }
            switch (item.type) {
                case 'image/jpeg':
                case 'image/gif':
                case 'image/png':
                case 'image/bmp':
                break;
            default:
                _self.clearInputCommunityLogo();
                _rootElement.find("#dialog-error").text( Resource.getMessage('config_community_logo_failed') );
                return;
            }
            if (item.size <= 0 || item.size > Conf.getVal('COMMUNITY_LOGO_SIZE_LIMIT')) {
                _self.clearInputCommunityLogo();
                _rootElement.find("#dialog-error").text( Resource.getMessage('config_community_community_large') );
                return;
            }

            if (!window.FileReader) {
                _rootElement.find('img').css('filter', 'alpha(opacity=30)');
                return;
            }
            var fr = new FileReader();
            fr.onload = function() {
                _rootElement.find('img').attr('src', fr.result);
            };
            fr.readAsDataURL(item);

       });

        _rootElement.find('textarea').on('ready',function(){
            $(this).autosize();
        });

        $('#onCreatePrj').click(function() {
            var _dialogObj = this;
            _self.submit(_dialogObj);
        });

        $('#modal_area .modal_card .project_color .color_box').click(function() {
            var nowchecked = $('input[name=community-color]:checked').val();
            $('input[name=community-color]').click(function(){
                if($(this).val() == nowchecked) {
                    $(this).prop('checked', false);
                    nowchecked = false;
                } else {
                    nowchecked = $(this).val();
                }
            });
        });

        $('#modal_area .modal_card .project_color .color_box').each(function () {
            var color = $(this).children('input[type="radio"]').val();
            $(this).children('span').css('background-color', color);
        });

    };

    function _inputCommunityLogoTagHtml() {
        return '<input type="file" name="logofile" accept="image/jpeg, image/gif, image/png">';
    };

})();
