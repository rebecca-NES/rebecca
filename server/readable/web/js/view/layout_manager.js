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
function LayoutManager() {
};(function() {
    LayoutManager.prototype = $.extend({}, ViewCore.prototype);
    LayoutManager.INIT_COMPLETE = false;
    LayoutManager.MARGINAL_WIDTH = 641;
    LayoutManager.MENUICON_WIDTH = 40;
    LayoutManager.MODE = { UNKNOWN: 'UNKNOWN', DESKTOP: 'DESKTOP', MOBILE: 'MOBILE' };
    LayoutManager.isMobile = false;
    LayoutManager.isDesktop = false;
    LayoutManager.isHeadreScrolling = false;
    LayoutManager.CURRENT_MODE = LayoutManager.MODE.UNKNOWN;
    LayoutManager.PREVIOUS_MODE = LayoutManager.MODE.UNKNOWN;
    LayoutManager.SCREEN = { WIDTH: 0, HEIGHT: 0 };
    LayoutManager.HEADER = { WIDTH: 0, HEIGHT: 0 };
    LayoutManager.ACTION = { FRAME: 0, CANVAS: 0 };
    LayoutManager.MAINOUTER = { WIDTH: 0, HEIGHT: 0 };
    LayoutManager.LIST = { WIDTH: 0, HEIGHT: 0 };
    var MNG = LayoutManager;
    var columnContainer = $('#columnContainer');
    var listContainer = $('#listContainer');
    var switchToList = $('#switchToList');
    var switchToColumn = $('#switchToColumn');
    var mainHeader = $('#mainHeader');
    var mainContainer = $('#mainContainer');
    var actionbar = $('#actionbar');
    var menuoptfunc = $('#menuoptionalfunction');
    var menubar = $('#menubar');
    var menuIcons = $('#menuIcons');
    var contextSearchIcon = $('#searchIcon_for_mobile');
    var mainOuterContainer = $('#mainOuterContainer');

    LayoutManager.initScreenLayout = function (){
        if (MNG.INIT_COMPLETE) return;
        MNG.INIT_COMPLETE = true;
    };
    LayoutManager.displayList = function (){};
    LayoutManager.displayColumn = function (){};
    LayoutManager.resetScreenLayout = function (){};

    LayoutManager.switchToList = function(){};
    LayoutManager.switchToColumn = function(){},
    LayoutManager.resetDialogWidth = function(dialogWidth){};
    LayoutManager.resetDialogHeight = function(dialogHeight){};
    LayoutManager.iconAreaScrollToShow = function(index) {};
    LayoutManager._iconAreaScrollToShow = function(scrollFunc, counter) {};

})();
