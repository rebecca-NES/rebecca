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

function DialogView() {
    this._dialogInnerElement = null;
};(function() {})();

function DialogOkCancelView() {
    DialogView.call(this);
    this._dialogInnerElement = $('#dialog_area');
    this._buttons = {};
    this.ps = "";
    this._init();
};(function() {
    DialogOkCancelView.prototype = $.extend({}, DialogView.prototype);
    var _super = DialogView.prototype;
    var _proto = DialogOkCancelView.prototype;
    _proto._init = function() {
    };
    _proto.cleanup = function() {
        var _self = this;
        _self._dialogInnerElement.find('.scroll_content').find('*').off().remove();
    }

    _proto.showDialog = function() {
        var _self = this;
        $('#modal_area').css('display', 'block');
        $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
        this._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200, function(){
            if(_self.ps != ""){
                _self.ps.update();
            }
        });
        $('.overlay').animate({ 'opacity':0.3}, 200);
        document.activeElement.blur();
    };
})();

function DialogCloseView(_title, _message) {
	DialogView.call(this);
  this._dialogAreaElement = $('#modal_area');
  this._dialogInnerElement = null;
	this._buttons = {	};
	this._init(_title, _message);
};(function() {
	this.prototype = $.extend({}, DialogView.prototype);
	var _proto = DialogCloseView.prototype;
	_proto._init = function(_title, _message) {
    var _ret = "";
    _ret += '<div id="msg_modal" class="card modal_card">';
    _ret += '  <div class="card_title">';
    _ret += '    <p>'+_title+'</p>';
    _ret += '  </div>';
    _ret += '  <div class="modal_content_wrapper">';
    _ret += '    <p class="txt">'+_message+'</p>';
    _ret += '  </div>';
    _ret += '  <div class="btn_wrapper">';
    _ret += '    <p id="dialog-error" class="ui-state-error-text dialog_error_footer"></p>';
    _ret += '    <button type="button" id="msg_ok_btn" class="modal_btn success_btn ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" role="button" aria-disabled="false"><span class="ui-button-text">'+Resource.getMessage('dialog_label_ok')+'</span></button>';
    _ret += '  </div>';
    _ret += '  <a class="modal_exit modal_exit_btn ico_btn ui-dialog-titlebar-close ui-corner-all" role="button"><i class="fa fa-times"></i></a>';
    _ret += '</div>';
    this._dialogAreaElement.html(_ret);
    this._dialogInnerElement = this._dialogAreaElement.children();

    this._dialogInnerElement.find('#msg_ok_btn').on('click', function() {
        ViewUtils.modal_allexit();
        this._dialogInnerElement = null;
    });
	};

  _proto.showDialog = function() {
      $('#modal_area').css('display', 'block');
      $('#modal_area').prepend('<div class="overlay modal_exit"></div>');
      this._dialogInnerElement.addClass('on').css('display', 'block').animate({ 'margin-top':0, 'opacity':1 }, 200 );
      $('.overlay').animate({ 'opacity':0.3}, 200 );
      document.activeElement.blur();
  };
}).call(DialogCloseView);
