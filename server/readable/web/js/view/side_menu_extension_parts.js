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

function SideMenuExtensionParts(partsType, parent, title, position) {
    this._parentObj = parent;

    this._partsType = partsType;

    this._title = title? title : Resource.getMessage('subview_title');

    this._width = position? position.width : $('#listInnerContainer').outerWidth();

    this._frame = null;

    this._isShow = false;
};(function() {
    var _proto = SideMenuExtensionParts.prototype;

    _proto.init = function() {
        var _self = this;
        _self._frame = _self._createFrame();
        _self._createEventHandler();
        return _self;
    };

    _proto.cleanUp = function(){
        var _self = this;
        if(_self._frame){
            _self._frame.remove();
            _self._frame = null;
        }
        if(_self._parentObj){
            _self._parentObj = null;
        }
    };
    _proto._createFrame = function() {
        var _self = this;
        var _ret = "";
        _ret += '<div id="' + _self._partsType + '-subview" class="ui-widget-content subviewTop" style="width:' + _self._width + 'px; min-width:' + _self._width + 'px;" >';
        _ret += '<div class="ui-dialog-titlebar ui-widget-header"><span class="ui-dialog-title" >' + Resource.getMessage('subview_title')+ '</span>';
        _ret += '<a class="subview-close"><span class="ui-icon ui-icon-closethick">close</span></a></div>';
        _ret += '  <div class="subview-contents">';
        _ret += _self._getInnerHtml();
        _ret += '  </div>';
        _ret += '</div>';
        return $(_ret);
    };

     _proto._getInnerHtml = function(){
        return "";
     };

    _proto._createEventHandler = function() {
        var _self = this;
        _self._frame.find('.ui-icon-closethick').on('click', function(){
            _self.hide();
        });
    };

    _proto.show = function(){
        var _self = this;
        if(_self._frame.css('display') != 'none'){
            return;
        }
        var _pos = _self._getPosition();
        $('#' + _self._partsType + '-subview').css({
            'top' : _pos.top + 'px',
            'margin-left' : _pos.marginLeft + 'px',
        });
        _self._frame.toggle('slide', {direction: 'right', duration: 0});

        _self._isShow = true;
    };

    _proto.hide = function(){
        var _self = this;
        if(_self._frame.css('display') == 'none'){
            return;
        }
        _self._frame.toggle('slide', {direction: 'left', duration: 0});

        _self._isShow = false;
        _self.setListInnerContainerScrollForIE89();
    };

    _proto._getPosition = function(){
        var _self = this;
        var _top = $('#headerContainer').outerHeight() + $('#mainHeader').outerHeight() + $('#userProfile').outerHeight() + 4;

        var _listContainerWidth = _self._width + 10;;

        var _left = - _listContainerWidth - 4;
        return {
            top : _top,
            marginLeft : _left
        };
    };
})();
