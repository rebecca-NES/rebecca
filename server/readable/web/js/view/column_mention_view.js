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
function ColumnMentionView(columnInformation) {
    ColumnView.call(this, columnInformation);

    this._className = ColumnView.CLASS_SEL_MENTION;
    this._displayName = this._createDisplayName();
    this.createView();

    this._htmlElement.find('button.column-option').show();
    columnInformation.setIconImage('images/column_reply.png');
};(function() {
    ColumnMentionView.prototype = $.extend({}, ColumnFilterView.prototype);
    var _super = ColumnFilterView.prototype;
    var _proto = ColumnMentionView.prototype;

    _proto._setOptionMenu = function(optionButton) {
        var _self = this;
        var _optionMenuHtml = ColumnOptionMenu.getHtml(_self._info);
        var _optionMenuElem = TooltipView.getInstance().createColumnOptionMenuTooltip(optionButton, _optionMenuHtml);
        _self._columnOptionMenu = new ColumnOptionMenu(_optionMenuElem, _self._info, _self);
    };

    _proto._createSubForms = ColumnTimelineView.prototype._createSubForms;
    _proto.clickSubFormButton = ColumnTimelineView.prototype.clickSubFormButton;
    _proto.sendPublicMessage = ColumnTimelineView.prototype.sendPublicMessage;
    _proto.createMessageObjectOnly = function(msg) {
        var _self = this;
        if (!msg || typeof msg != 'object') {
            return;
        }
        var _msgObj = null;
        _msgObj = new ColumnPublicMessageView(_self, msg);
        return _msgObj;
    };
    _proto.getColumnMessageHtml = ColumnTimelineView.prototype.getColumnMessageHtml;
    _proto._createDisplayName = function() {
        var _ret = ColumnView.DISPLAY_NAME_MENTION;
        return _ret;
    };

})();
