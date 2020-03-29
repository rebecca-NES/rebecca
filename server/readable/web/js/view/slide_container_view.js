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

function SlideContainerView(){
}
(function() {
})();

function RightSlideContainerView(){
    SlideContainerView.call(this);
}
(function() {
    RightSlideContainerView.prototype = $.extend({}, SlideContainerView.prototype);
    var _super = SlideContainerView.prototype;
    var _rightSlideContainerView = new RightSlideContainerView();
    RightSlideContainerView.getInstance = function() {
        return _rightSlideContainerView;
    };
    var _proto = RightSlideContainerView.prototype;
    _proto.resizeButton = function() {
        var _bodyOuterHeightM = $('body').outerHeight(true);
        var _mainHeaderOuterHeightM = $('#mainHeader').outerHeight(true);
        var _mainContainerOuterHeightM = _bodyOuterHeightM - _mainHeaderOuterHeightM;
        var _mainContainerObj = $('#mainContainer');
        var _mainContainerMarginH = parseInt(_mainContainerObj.css('marginTop')) + parseInt(_mainContainerObj.css('marginBottom'));
        var _mainContainerBorderH = parseInt(_mainContainerObj.css('borderTopWidth')) + parseInt(_mainContainerObj.css('borderBottomWidth'));
        var _mainContainerPaddingH = parseInt(_mainContainerObj.css('paddingTop')) + parseInt(_mainContainerObj.css('paddingBottom'));
        var _mainContainerHeightNew = _mainContainerOuterHeightM - _mainContainerMarginH - _mainContainerBorderH - _mainContainerPaddingH;
        var _toggleButton = $('#toggler > button');
        _toggleButton.css('height', _mainContainerHeightNew);
        if (ViewUtils.isIE8()) {
            _toggleButton.css('width', "12px");
        }
    };
    $(function(){
        var toggleButton = $('#toggler > button');
        var listInnerContainer = $('#listInnerContainer');
        var listContainer = $('#listContainer');
        toggleButton.button({
            icons : {
                primary : 'ui-icon-triangle-1-e'
            },
            text : false
        });
        toggleButton.on('click', function() {
            listInnerContainer.toggle('slide', {
                direction : 'right'
            }, 100, function() {
                var _iconName = '';
                if(toggleButton.find('span:first').attr('class').indexOf('ui-icon-triangle-1-w') == -1) {
                    _iconName = 'ui-icon-triangle-1-w';
                    listContainer.removeClass('listcontainer-width');
                } else {
                    _iconName = 'ui-icon-triangle-1-e';
                    listContainer.addClass('listcontainer-width');
                }
                toggleButton.button({
                    icons : {
                        primary : _iconName
                    },
                    text : false
                });
                View.getInstance().resizeContent();
            });
        });
    });

})();

function GroupFormingAccordion(){
}
(function() {
})();

