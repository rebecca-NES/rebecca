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

function AccordionView() {
    SideMenuParts.call(this);
    this._partsList = new Array();
    this._activePats = null;
};
(function() {

    AccordionView.prototype = $.extend({}, SideMenuParts.prototype);
    var _super = SideMenuParts.prototype;
    var _proto = AccordionView.prototype;

    _proto.cleanUp = function() {
        var _self = this;
        var _partsList = _self._partsList;
        var _partsViewCount = _partsList.length;
        for ( var _i = 0; _i < _partsList.length; _i++) {
            var _parts = _partsList[_i];
            if (_parts == null) {
                continue;
            }
            _parts.cleanUp();
        }
        _self._partsList = new Array();
        _super.cleanUp.call(_self);

        if(_self._activePats){
            _self._activePats.cleanUp();
        }
    };
    _proto.removeDom = function() {
        var _self = this;
        if(_self._frame == null){
            return;
        }
        _self._frame.remove();
        _self._frame = null;
    };
    _proto.addPartsList = function(partsList) {
        var _self = this;
        var _partsList = _self._partsList.concat(partsList);
        _self._partsList = _partsList;
    };

    _proto.createFrame = function() {
        var _self = this;
        var _frameHtml = '<dl class="accordion box-border olient-vertical flex1"></dl>';
        var _ret = $(_frameHtml);
        _self._frame = _ret;
        return _ret;
    };
    _proto.showInnerFrame = function() {
        var _self = this;
        var _partsList = _self._partsList;
        var _partsViewCount = _partsList.length;
        function _partsViewCreateCallback() {
        }
        for ( var _i = 0; _i < _partsList.length; _i++) {
            var _parts = _partsList[_i];
            if (_parts == null) {
                continue;
            }
            var _partsType = ((_parts.viewPartsListHeader) ? ' ' + _parts.viewPartsListHeader : '');
            var _headerHtml = '<dt class="ui-widget-header list-header' + _partsType + '">'
                    + _parts.getHeaderDisplayName() + '</dt>';
            var _partsHeader = $(_headerHtml);
            _self._frame.append(_partsHeader);
            var _partsFrame = _parts.createFrame();
            var _dlElem = $('<dd class="box-border olient-vertical flex1' + _partsType + '"></dd>');
            _dlElem.append(_partsFrame);
            _dlElem.css('display', 'none');
            _self._frame.append(_dlElem);
            _parts.showInnerFrame(_partsViewCreateCallback);

        }
        _self._frame.children('dd:first').css('display', '');
        _self._activePats = _partsList[0];
        _self._frame.children('dt').on('click', function() {
            if ($('+dd', this).css('display') == 'none') {
                var _children = _self._frame.children('dd');
                var _displayDdOffsetHeight = 0;
                for(var i=0; i < _children.length; i++){
                    if(_children.eq(i).css('display') != 'none'){
                        _displayDdOffsetHeight = _children.eq(i).css('height');
                        break;
                    }
                }
                $('+dd', this).css('height', _displayDdOffsetHeight);

                var _targetObj = _self._notifyBeforeActivate($('+dd', this));
                _self._frame.children('dd').slideUp();
                $('+dd', this).slideDown('normal', function() {
                    _self._notifyActivate(_targetObj);
                    _self._activePats = _targetObj;
                    _self.resizeContent();
                });
            }
        });

        _self.resizeContent();
    };

    _proto.resizeContent = function() {
        var _self = this;
        if (_self._frame == null) {
            return;
        }
        var _partsList = _self._partsList;
        for ( var _i = 0; _i < _partsList.length; _i++) {
            var _parts = _partsList[_i];
            if (_parts == null) {
                continue;
            }
            if (_self._frame.children('dd').eq(_i).css('display') == 'none') {
                continue;
            }
            _parts.resizeContent();
        }
    };

    _proto.resizeAreaForIE89 = function() {
        if(!ViewUtils.isIE89()){
            return;
        }
        var _self = this;
        if (_self._frame == null) {
            return;
        }
        var _rootElm = _self._frame;
        var _rootHeight = _rootElm.outerHeight(true);
        var _headersHeight = 0;
        var _headersElm = _self._frame.children('dt');
        _headersElm.each(function(){
            _headersHeight += $(this).outerHeight(true);
        });
        var _contentsHeight = _rootHeight - _headersHeight;
        _self._frame.children('dd').height(_contentsHeight);
        var _partsList = _self._partsList;
        var _partsViewCount = _partsList.length;
        for ( var _i = 0; _i < _partsList.length; _i++) {
            var _parts = _partsList[_i];
            if (_parts == null) {
                continue;
            }
            _parts.resizeAreaForIE89();
        }
    };

    _proto.resizeAreaForSubView = function(){
        var _self = this;
        var _partsList = _self._partsList;
        var _partsViewCount = _partsList.length;
        for ( var _i = 0; _i < _partsList.length; _i++) {
            var _parts = _partsList[_i];
            if (_parts == null) {
                continue;
            }
            _parts.resizeAreaForSubView(_self._activePats);
        }
    };

    _proto.onProfileChanged = function(profile) {
        var _self = this;
        if (_self._frame == null) {
            return;
        }
        var _partsList = _self._partsList;
        var _count = _partsList.length;
        var _index = 0;
        var _delay = 10;
        function asyncProfileChangedFunc() {
            if(_index >= _count) {
                return;
            }
            var _parts = _partsList[_index];
            if (_parts != null) {
                _parts.onProfileChanged(profile);
            }
            _index++;
            setTimeout(asyncProfileChangedFunc, _delay);
        }
        setTimeout(asyncProfileChangedFunc, _delay);
    };

    _proto.onNotification = function(notification) {
        var _self = this;
        if (_self._frame == null) {
            return;
        }
        var _partsList = _self._partsList;
        var _count = _partsList.length;
        var _index = 0;
        var _delay = 10;
        function asyncNotificationFunc() {
            if(_index >= _count) {
                return;
            }
            var _parts = _partsList[_index];
            if (_parts != null) {
                _parts.onNotification(notification);
            }
            _index++;
            setTimeout(asyncNotificationFunc, _delay);
        }
        setTimeout(asyncNotificationFunc, _delay);
    };

    _proto._notifyBeforeActivate = function(element){
        var _self = this;
        var _targetClass = null;
        var _targetObj = null;
        if(element.find('.contact-list-for-community-top').length > 0){
            _targetClass = ContactListForCommunityView;
        }else if(element.find('.contact-list-top').length > 0){
            _targetClass = ContactListView;
        }else if(element.find('.list-groupchat').length > 0){
            _targetClass = GroupChatListView;
        }else if(element.find('.list-community').length > 0){
            _targetClass = CommunityListView;
        }else if(element.find('.list-community-member').length > 0){
            _targetClass = CommunityMemberListView;
        }else if(element.find('.community-detail').length > 0){
            _targetClass = CommunityDetailsView;
        }
        if(!_targetClass){
            return null;
        }
        for(var i=0; i<_self._partsList.length; i++){
            if(_self._partsList[i] instanceof _targetClass){
                _targetObj = _self._partsList[i];
                  break;
            }
        }

        for (var j = 0; j<_self._partsList.length; j++) {
            _self._partsList[j].beforeActivate.call(_self._partsList[j], _targetObj);
        }
        return _targetObj;
    };

    _proto._notifyActivate = function(targetObj){
        var _self = this;
        if(!targetObj){
            return;
        }
        for (var j = 0; j<_self._partsList.length; j++) {
            _self._partsList[j].activate.call(_self._partsList[j], targetObj);
        }
        return targetObj;
    };
})();