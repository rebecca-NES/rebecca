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

function BaseSideListViewImpl() {
    this._accordionView = null;
    this._listContainerElm = null;
    this._listInnerContainerElm = null;
    this._tabInfo = null;
};
(function() {

    var _proto = BaseSideListViewImpl.prototype;

    _proto.init = function(tabInfo) {
        var _self = this;
        _self._listContainerElm =  $('#listContainer');
        _self._listInnerContainerElm = _self._listContainerElm.children('#listInnerContainer');
        if (_self._tabInfo == null) {
            if (tabInfo != null) {
                _self._tabInfo = tabInfo;
            } else {
                _self._tabInfo = {
                    type : TabItemView.TYPE_UNKNOWN,
                    columnListId : '',
                    extras : {}
                };
            }
        }
        if(_self._accordionView == null) {
            _self._accordionView = (new AccordionView()).init();
        }
        return _self;
    };

    _proto.refresh = function() {
        var _self = this;
        _self._accordionView.removeDom();
        var _accordionViewDom = _self._accordionView.createFrame();
        _self._listInnerContainerElm.append(_accordionViewDom);
        _self._accordionView.showInnerFrame();
    };

    _proto.resizeContents = function() {
        var _self = this;
        _self._accordionView.resizeAreaForSubView();
        if(ViewUtils.isIE89()){
            var _accordionElm = _self._accordionView.getHtmlElement();
            var _myPresenceElmHeight = $('#userProfile').outerHeight(true);
            var _listInnerHeight = _self._listInnerContainerElm.outerHeight(true);
            var _accrodionHeight = _listInnerHeight - _myPresenceElmHeight;
            _accordionElm.height(_accrodionHeight);
            _self._accordionView.resizeAreaForIE89();
        }
        _self._accordionView.resizeContent();
    };

    _proto.onProfileChanged = function(profile) {
        var _self = this;
        if(_self.sidebarParts) {
            for(var i=0; i<_self.sidebarParts.length; i++) {
              _self.sidebarParts[i].onProfileChanged(profile);
            }
        }
    };

    _proto.onNotification = function(notification) {
        var _self = this;
        if(_self.sidebarParts) {
            for(var i=0; i<_self.sidebarParts.length; i++) {
              _self.sidebarParts[i].onNotification(notification);
            }
        }
    };

    _proto.notifyChatMessage = function(notification) {
      var _self = this;
      if(_self.sidebarParts) {
        for(var i=0; i<_self.sidebarParts.length; i++) {
          if(typeof _self.sidebarParts[i].notifyChatMessage == 'function') {
            _self.sidebarParts[i].notifyChatMessage(notification);
          }
        }
      }
    };

    _proto.setAccordionParts = function(partsList) {
        var _self = this;
        _self._accordionView.cleanUp();
        _self._accordionView.addPartsList(partsList);
    };
    _proto.cleanUp = function() {
        var _self = this;
        if(_self._accordionView != null) {
            _self._accordionView.cleanUp();
            _self._accordionView = null;
        }
        _self._listContainerElm = null;
        _self._listInnerContainerElm = null;
    };
})();
