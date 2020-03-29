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
function TaskFilterAndSortCondition(jsonString) {
    this._filterOwner = '';
    this._filterStatus = '';
    this._filterGroup = '';
    this._filterStartDate = '';
    this._filterEndDate = '';
    this._filterClient = '';
    this._filterUpdatedBy = '';
    this._sortItem = '';
    this._sortOrder = '';
    if (jsonString != null && typeof jsonString == 'string' && jsonString != '') {
        var _jsonObject = JSON.parse(jsonString);
        var _filter = _jsonObject.filter;
        if (_filter != null) {
            if (_filter[TaskFilterAndSortCondition.FILTER_KEY_OWNER] != null) {
                this._filterOwner = _filter[TaskFilterAndSortCondition.FILTER_KEY_OWNER];
            }
            if (_filter[TaskFilterAndSortCondition.FILTER_KEY_STATUS] != null) {
                this._filterStatus = _filter[TaskFilterAndSortCondition.FILTER_KEY_STATUS];
            }
            if (_filter[TaskFilterAndSortCondition.FILTER_KEY_GROUP] != null) {
                this._filterGroup = _filter[TaskFilterAndSortCondition.FILTER_KEY_GROUP];
            }
            if (_filter[TaskFilterAndSortCondition.FILTER_KEY_START_DATE] != null) {
                this._filterStartDate = _filter[TaskFilterAndSortCondition.FILTER_KEY_START_DATE];
            }
            if (_filter[TaskFilterAndSortCondition.FILTER_KEY_END_DATE] != null) {
                this._filterEndDate = _filter[TaskFilterAndSortCondition.FILTER_KEY_END_DATE];
            }
            if (_filter[TaskFilterAndSortCondition.FILTER_KEY_CLIENT] != null) {
                this._filterClient = _filter[TaskFilterAndSortCondition.FILTER_KEY_CLIENT];
            }
            if (_filter[TaskFilterAndSortCondition.FILTER_KEY_UPDATED_BY] != null) {
                this._filterUpdatedBy = _filter[TaskFilterAndSortCondition.FILTER_KEY_UPDATED_BY];
            }
        }
        var _sort = _jsonObject.sort;
        if (_sort != null) {
            if (_sort[TaskFilterAndSortCondition.SORT_KEY_ITEM] != null) {
                this._sortItem = _sort[TaskFilterAndSortCondition.SORT_KEY_ITEM];
            }
            if (_sort[TaskFilterAndSortCondition.SORT_KEY_ORDER] != null) {
                this._sortOrder = _sort[TaskFilterAndSortCondition.SORT_KEY_ORDER];
            }
        }
    }
};(function() {
    var _proto = TaskFilterAndSortCondition.prototype;
    TaskFilterAndSortCondition.SORT_KEY_ITEM = 'item';
    TaskFilterAndSortCondition.SORT_KEY_ORDER = 'order';
    TaskFilterAndSortCondition.DB_COLOMN_STATUS = 'status';
    TaskFilterAndSortCondition.DB_COLOMN_DUE_DATE = 'due_date';
    TaskFilterAndSortCondition.DB_COLOMN_COMPLETE_DATE = 'complete_date';
    TaskFilterAndSortCondition.DB_COLUMN_PRIORITY = 'priority';
    TaskFilterAndSortCondition.DB_COLUMN_CLIENT = 'client';
    TaskFilterAndSortCondition.DB_COLUMN_UPDATE_AT = 'updated_at';
    TaskFilterAndSortCondition.DB_COLUMN_CREATED_AT = 'created_at';
    TaskFilterAndSortCondition.DB_COLUMN_DEMAND_STATUS = 'demand_status';
    TaskFilterAndSortCondition.DB_COLUMN_DEMAND_DATE = 'demand_date';
    TaskFilterAndSortCondition.SORT_COLUMN_IS_NULL = 'IS NULL';
    TaskFilterAndSortCondition.SORT_ORDER_ASC = '1';
    TaskFilterAndSortCondition.SORT_ORDER_DES = '2';
    TaskFilterAndSortCondition.FILTER_KEY_OWNER = 'owner';
    TaskFilterAndSortCondition.FILTER_KEY_STATUS = 'status';
    TaskFilterAndSortCondition.FILTER_KEY_GROUP = 'group';
    TaskFilterAndSortCondition.FILTER_KEY_START_DATE = 'start_date';
    TaskFilterAndSortCondition.FILTER_KEY_END_DATE = 'end_date';
    TaskFilterAndSortCondition.FILTER_KEY_CLIENT = 'client';
    TaskFilterAndSortCondition.FILTER_KEY_UPDATED_BY = 'updated_by';
    TaskFilterAndSortCondition.DELIMITER_STRING = ',';

    _proto.getFilterConditionJSONString = function() {
        var _ret = '';
        _ret += '{';
        _ret += '"filter":{';
        _ret += (this.getFilterOwner() == '') ? '' : '"' + TaskFilterAndSortCondition.FILTER_KEY_OWNER + '":"' + this.getFilterOwner() + '",';
        _ret += (this.getFilterStatus() == '') ? '' : '"' + TaskFilterAndSortCondition.FILTER_KEY_STATUS + '":"' + this.getFilterStatus() + '",';
        _ret += (this.getFilterGroup() == '') ? '' : '"' + TaskFilterAndSortCondition.FILTER_KEY_GROUP + '":"' + this.getFilterGroup() + '",';
        _ret += (this.getFilterStartDate() == '') ? '' : '"' + TaskFilterAndSortCondition.FILTER_KEY_START_DATE + '":"' + this.getFilterStartDate() + '",';
        _ret += (this.getFilterEndDate() == '') ? '' : '"' + TaskFilterAndSortCondition.FILTER_KEY_END_DATE + '":"' + this.getFilterEndDate() + '",';
        _ret += (this.getFilterClient() == '') ? '' : '"' + TaskFilterAndSortCondition.FILTER_KEY_CLIENT + '":"' + this.getFilterClient() + '",';
        _ret += (this.getFilterUpdatedBy() == '') ? '' : '"' + TaskFilterAndSortCondition.FILTER_KEY_UPDATED_BY + '":"' + this.getFilterUpdatedBy() + '",';
        _ret = _removeLastComma(_ret);
        _ret += '},';
        _ret += '"sort":{';
        _ret += (this.getSortItem() == '') ? '' : '"item":"' + this.getSortItem() + '",';
        _ret += (this.getSortOrder() == '') ? '' : '"order":"' + this.getSortOrder() + '",';
        _ret = _removeLastComma(_ret);
        _ret += '}';
        _ret += '}';
        return _ret;
    };

    _proto.getFilterObject = function(jsonString) {
        if (_validation({'string' : jsonString}) == false) {
            return null;
        }
        var _jsonObject = JSON.parse(jsonString||null);
        if(_jsonObject == null){
            return null;
        }
        return _jsonObject.filter;
    };
    _proto.getSortObject = function(jsonString) {
        if (_validation({'string' : jsonString}) == false) {
            return null;
        }
        var _jsonObject = JSON.parse(jsonString);
        return _jsonObject.sort;
    };
    _proto.getFilterOwner = function() {
        return this._filterOwner;
    };
    _proto.getFilterStatus = function() {
        return this._filterStatus;
    };
    _proto.getFilterGroup = function() {
        return this._filterGroup;
    };
    _proto.getFilterStartDate = function() {
        return this._filterStartDate;
    };
    _proto.getFilterEndDate = function() {
        return this._filterEndDate;
    };
    _proto.getFilterClient = function() {
        return this._filterClient;
    };
    _proto.getFilterUpdatedBy = function() {
        return this._filterUpdatedBy;
    };
    _proto.getSortItem = function() {
        return this._sortItem;
    };
    _proto.getSortOrder = function() {
        return this._sortOrder;
    };
    _proto.setFilterOwner = function(filterOwner) {
        if (_validation({'string' : filterOwner}) == false) {
            return;
        }
        this._filterOwner = filterOwner;
    };
    _proto.setFilterStatus = function(filterStatus) {
        if (_validation({'string' : filterStatus}) == false) {
            return;
        }
        this._filterStatus = filterStatus;
    };
    _proto.setFilterGroup = function(filterGroup) {
        if (_validation({'string' : filterGroup}) == false) {
            return;
        }
        this._filterGroup = filterGroup;
    };
    _proto.setFilterStartDate = function(filterStartDate) {
        if (_validation({'string' : filterStartDate}) == false) {
            return;
        }
        this._filterStartDate = filterStartDate;
    };
    _proto.setFilterEndDate = function(filterEndDate) {
        if (_validation({'string' : filterEndDate}) == false) {
            return;
        }
        this._filterEndDate = filterEndDate;
    };
    _proto.setFilterClient = function(filterClient) {
        if (_validation({'string' : filterClient}) == false) {
            return;
        }
        this._filterClient = filterClient;
    };
    _proto.setFilterUpdateBy = function(filterUpdatedBy) {
        if (_validation({'string' : filterUpdatedBy}) == false) {
            return;
        }
        this._filterUpdatedBy = filterUpdatedBy;
    };
    _proto.setSortItem = function(sortItem) {
        if (_validation({'string' : sortItem}) == false) {
            return;
        }
        this._sortItem = sortItem;
    };
    _proto.setSortOrder = function(sortOrder) {
        if (_validation({'string' : sortOrder}) == false) {
            return;
        }
        this._sortOrder = sortOrder;
    };

    _proto.getSortKey = function(index) {
        var _ret = '';
        if (_validation({'number' : index}) == false) {
            return _ret;
        }
        var _sortKeys = this._sortItem.split(TaskFilterAndSortCondition.DELIMITER_STRING);
        if (_sortKeys.length > index) {
            _ret = _sortKeys[index];
        }
        return _ret;
    };
    _proto.getSortOrderValue = function(index) {
        var _ret = '';
        if (_validation({'number' : index}) == false) {
            return _ret;
        }
        var _sortOders = this._sortOrder.split(TaskFilterAndSortCondition.DELIMITER_STRING);
        if (_sortOders.length > index) {
            _ret = _sortOders[index];
        }
        return _ret;
    };

    function _removeLastComma(str) {
        var _ret;
        var _len = str.length;
        var _last = str.slice(-1);
        _ret = _last == ',' ? str.slice(0, _len - 1) : str;
        return _ret;
    };

    function _validation(args) {
        for (var p in args) {
            if (p == 'string') {
                if (args[p] == null || typeof args[p] != 'string') {return false;}
            } else if (p == 'number') {
                if (args[p] == null || typeof args[p] != 'number' || args[p] < 0) {return false;}
            }
        }
        return true;
    };

})();
