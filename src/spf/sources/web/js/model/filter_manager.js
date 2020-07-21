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

function FilterManager() {
};(function() {
    FilterManager.TYPE_UNKNOWN = 0;
    FilterManager.TYPE_MESSAGE_COUNT_DEMAND_TASK = 1;
    var _proto = FilterManager.prototype;
    FilterManager.getFilter = function(type, subData) {
        var _retCondition = null;
        switch(type){
            case FilterManager.TYPE_MESSAGE_COUNT_DEMAND_TASK:
                _retCondition = DemandTaskFilter.getFilter(subData);
                break;
            default:
                break;
        }
        return _retCondition;
    };


})();

function DemandTaskFilter() {
};(function() {

    var _proto = DemandTaskFilter.prototype;

    DemandTaskFilter.getFilter = function(subData) {
        var _retCondition = new AndCondition();

        var _msgTypeItemCondition = new ItemCondition();
        _msgTypeItemCondition.setData('msgtype', Message.TYPE_TASK);
        _retCondition.addChildCondition(_msgTypeItemCondition);

        var _ownerItemCondition = new ItemCondition();
        _ownerItemCondition.setData('owner', LoginUser.getInstance().getJid());
        _retCondition.addChildCondition(_ownerItemCondition);

        var _demandStatusItemCondition = new ItemCondition();
        _demandStatusItemCondition.setData('demand_status', TaskMessage.DEMAND_ON);
        _retCondition.addChildCondition(_demandStatusItemCondition);

        if(subData == null || typeof subData != 'number') {
            return _retCondition;
        }
        switch(subData){
            case ColumnInformation.TYPE_COLUMN_TASK:
                var _orCondition = new OrCondition();
                var _statusNewItemCondition = new ItemCondition();
                var _statusDoingItemCondition = new ItemCondition();
                var _statusFinishedItemCondition = new ItemCondition();
                var _statusRejectedItemCondition = new ItemCondition();
                _statusNewItemCondition.setData('status', TaskMessage.STATUS_NEW);
                _statusDoingItemCondition.setData('status', TaskMessage.STATUS_DOING);
                _statusFinishedItemCondition.setData('status', TaskMessage.STATUS_FINISHED);
                _statusRejectedItemCondition.setData('status', TaskMessage.STATUS_REJECTED);
                _orCondition.addChildCondition(_statusNewItemCondition);
                _orCondition.addChildCondition(_statusDoingItemCondition);
                _orCondition.addChildCondition(_statusFinishedItemCondition);
                _orCondition.addChildCondition(_statusRejectedItemCondition);
                _retCondition.addChildCondition(_orCondition);
                break;
            case ColumnInformation.TYPE_COLUMN_INBOX:
                var _statusItemCondition = new ItemCondition();
                _statusItemCondition.setData('status', TaskMessage.STATUS_ASSIGNING);
                _retCondition.addChildCondition(_statusItemCondition);
                break;
            default:
                break;
        }
        return _retCondition;
    };
})();
