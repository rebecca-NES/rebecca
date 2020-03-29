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
function ColumnMessageGoodJobButton(htmlElement, parent, itemId, goodJobList, isToolTipOwner) {
    this._htmlElement = htmlElement;
    this._parent = parent;
    this._itemId = itemId;
    this._goodJobList = goodJobList;
    this._count = 0;
    if(isToolTipOwner != false) {
        isToolTipOwner = true;
    }
    this._isToolTipOwner = isToolTipOwner
    this._createEventHandler();
};(function() {
    ColumnMessageGoodJobButton.prototype = $.extend({}, ViewCore.prototype);
    var _proto = ColumnMessageGoodJobButton.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.off();
        this._htmlElement = null;
        this._parent = null;
        this._itemId = null;
        this._goodJobList = null;
        this._isToolTipOwner = null;
    };
    ColumnMessageGoodJobButton.getHtml = function(goodJobList) {
        var _ret = '';
        _ret += '<div class="frm-good-job">';
        _ret += '<a class="msg_gj_btn ico_btn" data-toggle="tooltip" title="" data-original-title="' + Resource.getMessage('goodjob') + '">';
        _ret += '<i class="fa fa-thumbs-o-up"></i></a>';
        var count = goodJobList.getCount();
        if(count == 0){
            _ret += '<span class="good-job-counter not-read-message txt_btn" data-toggle="tooltip" title="" data-original-title="' + Resource.getMessage('goodjob') + '">';
        }else{
            _ret += '<span class="good-job-counter not-read-message txt_btn">';
        }
        _ret += '' + count;
        _ret += '</span>';
        _ret += '</div>';
	return _ret;
    };
    _proto.getParent = function() {
        return this._parent;
    };
    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.find('.fa-thumbs-o-up').on('click', function() {
            _self._parent.sendGoodJob();
        });
        _rootElement.find('span.good-job-counter').on('click', function(e) {
            _rootElement.children('.mTip').hide();
            _self.showGoodJobUserList();
            e.stopPropagation();
        });
        TooltipView.getInstance().createGoodJobTooltip(_rootElement, _self._getGoodJobList(), _self._isToolTipOwner);
    };
    _proto._getGoodJobList = function() {
        var _self = this;
        if(_self._itemId == null) {
            return null;
        }
        var _message = _self.getParent().getMessage();
        if(_message == null) {
            return null;
        }
        _self._goodJobList = _message.getGoodJobList();
        return _self._goodJobList;
    }
    _proto.showGoodJobUserList = function() {
        var _self = this;
        var _goodJobList = _self._getGoodJobList();
        var _count = _goodJobList.getCount();
        if(_count == 0){
            return;
        }
        var _lastIndex = _count - 1;
        var _personList = new ArrayList();
        for(var _i = _lastIndex; _i >= 0; _i--){
            var _goodJobData = _goodJobList.get(_i);
            var _profile = _createProfileFromGoodJobData(_goodJobData);
            var _person = new Person();
            _person.setJid(_goodJobData.getJid());
            _person._profile = _profile;
            _personList.add(_person);
        }
        var _dialogPersonListView = new DialogGoodJobPersonListView(_self._itemId, _personList);
        ColumnManager.getInstance().showPersonListDialog(_dialogPersonListView);
    }
    _proto.onGoodJobReceive = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        var _goodJobList = _self._getGoodJobList();
        _rootElement.find('span.good-job-counter').html(_goodJobList.getCount());
        TooltipView.getInstance().createGoodJobTooltip(_rootElement, _goodJobList, _self._isToolTipOwner);

        $(_rootElement).find('.good-job-counter').attr({
            'data-original-title': ''
        });
    };
    function _createProfileFromGoodJobData(goodJobData){
        if(!goodJobData || typeof goodJobData != 'object'){
            return;
        }
        var _profile = new Profile();
        _profile.setNickName(goodJobData.getNickName());
        _profile.setAvatarType(goodJobData.getAvatarType());
        _profile.setAvatarData(goodJobData.getAvatarData());
        _profile.setLoginAccount(goodJobData.getLoginAccount());
        _profile.setStatus(goodJobData.getStatus());
        return _profile;
    }
})();
