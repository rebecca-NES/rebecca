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

function SideMenuAccordionParts() {
    SideMenuParts.call(this);
    this._headerDisplayName = '';

    this._subView = null;
    this.viewPartsListHeader = null;
};
(function() {
    SideMenuAccordionParts.prototype = $.extend({}, SideMenuParts.prototype);
    var _super = SideMenuParts.prototype;

    var _proto = SideMenuAccordionParts.prototype;

    _proto.getHeaderDisplayName = function() {
        var _self = this;
        return _self._headerDisplayName;
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
        var _parent = _rootElm.parent();
        var _contentsHeight = _parent.outerHeight(true);
        _rootElm.height(_contentsHeight);
    };

    _proto.beforeActivate = function(targetObj){
    };

    _proto.activate = function(targetObj){
    };
    _proto.resizeAreaForSubView = function(activeObj){
        var _self = this;
        if(!_self._subView){
            return;
        }
        if(!activeObj || activeObj !== _self){
            return;
        }
        var _toggleWidth = $("#toggler").outerWidth();
        if($("#listContainer").outerWidth() > _toggleWidth){
            _self._subView.show();
        }else{
            _self._subView.hide();
        }
    };
})();