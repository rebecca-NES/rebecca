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

function QuestionnaireNotificationIconView(message) {
    NotificationIconView.call(this, message);
};(function() {
    QuestionnaireNotificationIconView.prototype = $.extend({}, NotificationIconView.prototype);
    var _super = NotificationIconView.prototype;
    var _proto = QuestionnaireNotificationIconView.prototype;
    _proto._init = function(message) {
    };
    _proto._addEventHandler = function() {
        var _self = this;
        var _selfElm = _self._htmlElement;
        _selfElm.on('click', function() {
            console.log('QuestionnaireNotificationIconView::_addEventHandler … click!');
            if(TabManager.getInstance().isActiveMyWorkplace()) {
                ColumnManager.getInstance().addQuestionnaireColumn(true, true);
                NotificationIconManager.getInstance().removeNotificationIcon(_self);
            } else {
                function onActiveMyWorkplace(result) {
                    if(!result) {
                        return;
                    }
                    ColumnManager.getInstance().addQuestionnaireColumn(true, true);
                };
                TabManager.getInstance().activeMyWorkplaceTab(onActiveMyWorkplace);
            }
        });
    };
    _proto._getIconPath = function() {
        return 'images/notice_questionnaire.png';
    };
    _proto._setType = function() {
        var _self = this;
        _self._type = ColumnInformation.TYPE_COLUMN_QUESTIONNAIRE;
    };
    _proto.onAddColumn = function(columnInfo) {
        var _self = this;
        NotificationIconManager.getInstance().removeNotificationIcon(_self);
    };
    _proto.onColumnClicked = function(columnInformation) {
        var _self = this;
        var _clickedColumnType = columnInformation.getColumnType();
        if(_self.getType() != _clickedColumnType) {
            return;
        }
        NotificationIconManager.getInstance().removeNotificationIcon(_self);
    };
})();
