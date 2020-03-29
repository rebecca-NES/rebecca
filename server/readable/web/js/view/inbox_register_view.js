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

function InboxRegisterView(htmlElement, viewTitle, parent) {
    RegisterView.call(this, htmlElement, viewTitle, parent);
    this._columType = ColumnInformation.TYPE_COLUMN_INBOX;
};(function() {
    InboxRegisterView.prototype = $.extend({}, RegisterView.prototype);
    var _super = RegisterView.prototype;
    var _proto = InboxRegisterView.prototype;

    _proto._createSubForms = function(viewTitle) {
    	if (viewTitle != null) {
        	var _self = this;
            var _rootElement = _self.getHtmlElement();
            var _headerElement = _rootElement.find('.task-register-header');
            _headerElement.find('.reg-task-title').text(viewTitle);
    	}
    };

    _proto._addEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        if(!_rootElement) {
            return;
        }
        var _eventTargetCancel = _rootElement.find('.action-register-task > span.cancel');
        _eventTargetCancel.on('click', function() {
            _self._clickCancelButton();
        });
        var _eventTargetRegister = _rootElement.find('.action-register-task > span.register');
        _eventTargetRegister.on('click', function() {
            _self._clickRegisterButton();
        });
        _rootElement.on("click", 'div.task-register > .task-register-header > .action-register-task > span.cancel', function() {
            _self._clickCancelButton();
        });
        _rootElement.on("click", 'div.task-register > .task-register-header > .action-register-task > span.register', function() {
            _self._clickInboxRegisterButton();
        });
    };

    _proto._removeEventHandler = function(){
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        if(!_rootElement) {
            return;
        }
        var _eventTargetCancel = _rootElement.find('.action-register-task > span.cancel');
        _eventTargetCancel.off("click");
        var _eventTargetRegister = _rootElement.find('.action-register-task > span.register');
        _eventTargetRegister.off("click");
        _eventTargetCancel.find('#cancel-register').attr('title', 'Cancel Add Inbox');
        _eventTargetRegister.find('#execut-register').attr('title', 'Execute Add Inbox');
    }

    _proto._getHtml = function() {
        var _ret = "";
        _ret += '<form class="register-area">';

        _ret += '<div class="register-task-body box-border olient-horizontal">';
        _ret += '<div class="task-body-textarea-area flex1">';
        _ret += '<textarea id="task-body" name="task-body" class="task-register-item ui-corner-all" placeholder="' + Resource.getMessage('task_body_placeholder') + '"></textarea>';
        _ret += '</div>';
        _ret += '<div class="register-task-body-char-counter">';
        _ret += ViewUtils.getCharCounterHtml('char-counter-task-register');
        _ret += '</div>';
        _ret += '</div>';

        _ret += '</form>';
        return _ret;
    };

    _proto.appear = function() {
        var _self = this;
        var _selfElm = _self.getHtmlElement();
        var _registerElem = _selfElm.find('div.task-register');

        if(_selfElm){
            var _registerForm = _selfElm.find('.register-area');
            if (_registerForm.length == 0) {
            	_registerElem.append(_self._getHtml());
                _self._createRegisterForm();
            }
        }

        _self._removeEventHandler();
        _self._addEventHandler();

        _registerElem.slideToggle();
    };

    _proto._createRegisterForm = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _taskRegisterDiv = _rootElement.find('div.task-register');
        var _registerDiv = _taskRegisterDiv.find('.register-area');

        var _taskBodyDiv = _registerDiv.find('.register-task-body');
        var _taskBodyTextAreaElem = _taskBodyDiv.find('textarea');
        ViewUtils.setCharCounter(_taskBodyTextAreaElem, _taskBodyDiv.find('.' + ViewUtils.CHAR_COUNTER_CLASSNAME), TaskRegisterView.MAX_LENGTH_TASK_BODY);
    }

    _proto._cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _taskRegisterDiv = _rootElement.find('div.task-register');
        var _registerDiv = _taskRegisterDiv.find('.register-area');
        _registerDiv.remove();
    }

    _proto._clickCancelButton = function() {
        var _self = this;
        _self.getHtmlElement().find('div.task-register').slideUp();
    	_self._cleanup();
    };

    _proto._clickRegisterButton = function() {
        var _self = this;
        if(!_self._isValidationOk()) {
            return;
        }
        _self._updateMessageData();

        function addTaskCallback(result) {
            console.log("add inbox : " + result);
        };
        if(CubeeController.getInstance().addTask(_self._taskMessage, addTaskCallback) == true) {
        	_self._cleanup();
            _self.getHtmlElement().find('div.task-register').slideUp();
        } else {
            console.log("faild to add inbox");
        }
    };

    _proto._isValidationOk = function() {
        var _ret = true;
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _taskRegisterDiv = _rootElement.find('div.task-register');
        var _registerDiv = _taskRegisterDiv.find('.register-area');

        var _taskBodyDiv = _registerDiv.find('.register-task-body');
        var _taskBodyTextAreaElem = _taskBodyDiv.find('textarea');

        _taskBodyTextAreaElem.removeClass('input-error');
        var re = /((https?)(:\/\/\S+))/gi;
        var edited = _taskBodyTextAreaElem.val().replace(re, "");
        if(edited > TaskRegisterView.MAX_LENGTH_TASK_BODY) {
        	_taskBodyTextAreaElem.addClass('input-error');
            _ret = false;
        } else {
        	if(_taskBodyTextAreaElem.val() == '') {
            	_taskBodyTextAreaElem.addClass('input-error');
                _ret = false;
        	}
        }
        return _ret;
    };

    _proto._updateMessageData = function() {
        var _self = this;
        var _taskMessage = _self._taskMessage;
        var _rootElement = _self.getHtmlElement();
        var _taskRegisterDiv = _rootElement.find('div.task-register');
        var _registerDiv = _taskRegisterDiv.find('.register-area');

        var _taskBodyDiv = _registerDiv.find('.register-task-body');
        var _taskBodyTextAreaElem = _taskBodyDiv.find('textarea');
        _taskMessage.setMessage(_taskBodyTextAreaElem.val());
        _taskMessage.setStatus(TaskMessage.STATUS_INBOX);

        _taskMessage.setOwnerJid(LoginUser.getInstance().getJid());

        _taskMessage.setClient(LoginUser.getInstance().getJid());

    };

})();
