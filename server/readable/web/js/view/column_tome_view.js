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
function ColumnToMeView(columnInformation) {
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_TOME;
    this._displayName = this._createDisplayName(columnInformation);
    this.createView();
    var _titleElement = this._htmlElement.children('div').children('div.column-header').eq(0).children('div.column-header-title').eq(0);
    _titleElement.css({'border-bottom-color': '#e7435f'});

    this._htmlElement.find('div.frm-message').css('display', 'none'); 
    this._htmlElement.find('a.column-toggle').css('display', 'none');
};(function() {
    ColumnToMeView.prototype = $.extend({}, ColumnSearchView.prototype);
    var _super = ColumnSearchView.prototype;
    var _proto = ColumnToMeView.prototype;
    _proto._createDisplayName = function() {
        var _ret = ColumnView.DISPLAY_NAME_TOME;
        return _ret;
    };
    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = ToMeColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new ToMeColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };
})();
