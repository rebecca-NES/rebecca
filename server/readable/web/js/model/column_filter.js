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

function ColumnSearchCondition(filterCondition, sortCondition) {
    this._filterCondition = null;
    this._sortCondition = null;
    if (!filterCondition || typeof filterCondition != 'object') {
        return;
    }
    if (!sortCondition || typeof sortCondition != 'object') {
        return;
    }
    this._filterCondition = filterCondition;
    this._sortCondition = sortCondition;
};(function() {
    var _proto = ColumnSearchCondition.prototype;

    _proto.getFilterCondition = function() {
        return this._filterCondition;
    };

    _proto.getSortCondition = function() {
        return this._sortCondition;
    };
    _proto.isMatch = function(message) {
        if (!message || typeof message != 'object') {
            return false;
        }
        return this.getFilterCondition().isMatch(message);
    };
    _proto.isColmunChangeable = function(message) {
        if (!message || typeof message != 'object') {
            return false;
        }
        return this.getFilterCondition().isColmunChangeable(message);
    };

})();


function ColumnFilterCondition() {
};(function() {
    var _proto = ColumnFilterCondition.prototype;
    ColumnFilterCondition.CONDITION_TYPE_AND = 'and';
    ColumnFilterCondition.CONDITION_TYPE_OR = 'or';
    ColumnFilterCondition.CONDITION_TYPE_NOT = 'not';
    ColumnFilterCondition.CONDITION_TYPE_ITEM = 'item';
    ColumnFilterCondition.CONDITION_TYPE_GREATER_THAN = 'greaterthan';
    ColumnFilterCondition.CONDITION_TYPE_LESS_THAN = 'lessthan';
    ColumnFilterCondition.CONDITION_TYPE_KEYWORD = 'keyword';
    ColumnFilterCondition.CONDITION_TYPE_PARTICULAR = 'particular';

    _proto.getJSONObject = function() {
        return null;
    };

    _proto.getConditionObject = function(element) {
        return null;
    };

    _proto._createCondition	= function(element) {

        var condition;
        switch(element.type) {

        case ColumnFilterCondition.CONDITION_TYPE_AND:
            condition = new AndCondition();
            break;

        case ColumnFilterCondition.CONDITION_TYPE_OR:
            condition = new OrCondition();
            break;

        case ColumnFilterCondition.CONDITION_TYPE_NOT:
            condition = new NotCondition();
            break;

        case ColumnFilterCondition.CONDITION_TYPE_ITEM:
            condition = new ItemCondition();
            break;

        case ColumnFilterCondition.CONDITION_TYPE_GREATER_THAN:
            condition = new GreaterThanCondition();
            break;

        case ColumnFilterCondition.CONDITION_TYPE_LESS_THAN:
            condition = new LessThanCondition();
            break;

        case ColumnFilterCondition.CONDITION_TYPE_KEYWORD:
            condition = new KeywordCondition();
            break;

        case ColumnFilterCondition.CONDITION_TYPE_PARTICULAR:
            condition = new ParticularCondition();
            break;

        default:
            return null;
        }

        condition.getConditionObject(element);

        return condition;
    };

    _proto.isMatch = function(message) {
        return false;
    };
    _proto.isColmunChangeable = function(message) {
        return false;
    };
})();
function ColumnSortCondition() {
    this._items = new ArrayList();
    this._orders = new ArrayList();
};(function() {
    var _proto = ColumnSortCondition.prototype;
    ColumnSortCondition.SORT_ORDER_ASC = '1';
    ColumnSortCondition.SORT_ORDER_DESC = '2';
    _proto.getJSONObject = function() {
        var _self = this;
        var _sort = {};
        var _items = _self._items;
        var _itemsCount = _items.getCount();
        var _orders = _self._orders;
        var _ordersCount = _orders.getCount();
        var _itemString = '';
        var _orderString = '';
        var _isFirst = true;
        if(_itemsCount <= 0 || _ordersCount <= 0) {
            _items = _self._getDefaultItems();
            _itemsCount = _items.getCount();
            _orders = _self._getDefaultOrders();
            _ordersCount = _orders.getCount();
        }
        for(var _i = 0; _i < _itemsCount; _i++){
             var _item = _items.get(_i);
             if (_isFirst) {
                 _isFirst = false;
             } else {
                 _itemString += ',';
             }
             _itemString += _item;
        }
        _isFirst = true;
        for(var _j = 0; _j < _ordersCount; _j++){
             var _order = _orders.get(_j);
             if (_isFirst) {
                 _isFirst = false;
             } else {
                 _orderString += ',';
             }
             _orderString += _order;
        }
        _sort.item = _itemString;
        _sort.order = _orderString;
        return _sort;
    };

    _proto.getConditionObject = function(element) {
        var _self = this;

        var _sort = this;

        var _itemArray = element.item.split(",");

        var _orderArray = element.order.split(",");

        for(var _i=0; _i<_itemArray.length; _i++) {
            _self.add(_itemArray[_i], _orderArray[_i]);
        }

        return _sort;
    };

    _proto._getDefaultItems = function(){
        var _self = this;
        var _items = new ArrayList();
        var _id = 'id';
        _items.add(_id);
        return _items;
    };
    _proto._getDefaultOrders = function(){
        var _self = this;
        var _orders = new ArrayList();
        _orders.add(ColumnSortCondition.SORT_ORDER_DESC);
        return _orders;
    };
    _proto.add = function(sortItem, sortOrder) {
        var _self = this;
        if (!sortItem || typeof sortItem != 'string' || sortItem == '') {
            return;
        }
        var _order = null;
        if(!sortOrder || typeof sortOrder != 'string' || sortOrder != ColumnSortCondition.SORT_ORDER_DESC) {
            _order = ColumnSortCondition.SORT_ORDER_ASC;
        } else {
            _order = sortOrder;
        }
        _self._items.add(sortItem);
        _self._orders.add(_order);
    };

    _proto.getItems = function(){
        return this._items;
    };
    _proto.getOrders = function(){
        return this._orders;
    };
})();
function AndOrCondition() {
    ColumnFilterCondition.call(this);

    this._columnFilterConditionList = new ArrayList();

};(function() {
    var Super = function Super() {
    };
    Super.prototype = ColumnFilterCondition.prototype;
    AndOrCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = AndOrCondition.prototype;
    _proto.getJSONObject = function() {
        var _self = this;
        var _ret = null;
        var _count = _self._columnFilterConditionList.getCount();
        if(_count < 2){
            return _ret;
        }
        var _value = [];
        for(var _i = 0; _i < _count; _i++){
            var _columnFilterCondition = _self._columnFilterConditionList.get(_i);
            var _childConditionJson = _columnFilterCondition.getJSONObject();
            if(_childConditionJson == null) {
                return _ret;
            }
            _value[_i] = _childConditionJson;
        }
        _ret = {value : _value};
        return _ret;
    };

    _proto._createChildCondition = function(element) {
        var _self = this;

        if(element == null) {
            return null;
        }

        var _count = element.value.length;
        if(_count < 2) {
            return null;
        }

        for(var _i = 0; _i < _count; _i++) {
            var _childCondition = _self._createCondition(element.value[_i]);
            if(_childCondition == null) {
                return null;
            }

            _self.addChildCondition(_childCondition);
        }

        return _self._columnFilterConditionList;
    };

    _proto.getChildConditionList = function() {
        var _self = this;
        return _self._columnFilterConditionList;
    };
    _proto.addChildCondition = function(columnFilterCondition) {
        if (!columnFilterCondition || typeof columnFilterCondition != 'object') {
            return;
        }
        var _self = this;
        _self._columnFilterConditionList.add(columnFilterCondition);
    };
})();

function AndCondition() {
    AndOrCondition.call(this);
    this._type = ColumnFilterCondition.CONDITION_TYPE_AND;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = AndOrCondition.prototype;
    AndCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = AndCondition.prototype;
    _proto.getJSONObject = function() {
        var _self = this;
        var _ret = _super.getJSONObject.call(_self);
        if(_ret == null) {
            return _ret;
        }
        _ret.type = _self._type;
        return _ret;
    };

    _proto.getConditionObject = function(element) {
        var _self = this;

        if(element == null) {
            return null;
        }

        if(element.type != _self._type) {
            return null;
        }

        return _self._createChildCondition(element);
    };

    _proto.isMatch = function(message) {
        var _self = this;
        var _count = _self._columnFilterConditionList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _columnFilterCondition = _self._columnFilterConditionList.get(_i);
            if(_columnFilterCondition.isMatch(message) == false) {
                return false;
            }
        }
        return true;
    };
    _proto.isColmunChangeable = function(message) {
        var _self = this;
        var _count = _self._columnFilterConditionList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _columnFilterCondition = _self._columnFilterConditionList.get(_i);
            if(_columnFilterCondition.isColmunChangeable(message) == false) {
                return false;
            }
        }
        return true;
    };
    _proto.getType = function() {
        var _self = this;
        return _self._type;
    };

})();
function OrCondition() {
    AndOrCondition.call(this);
    this._type = ColumnFilterCondition.CONDITION_TYPE_OR;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = AndOrCondition.prototype;
    OrCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = OrCondition.prototype;
    _proto.getJSONObject = function() {
        var _self = this;
        var _ret = _super.getJSONObject.call(_self);
        if(_ret == null) {
            return _ret;
        }
        _ret.type = _self._type;
        return _ret;
    };

    _proto.getConditionObject = function(element) {
        var _self = this;

        if(element == null) {
            return null;
        }

        if(element.type != _self._type) {
            return null;
        }

        return _self._createChildCondition(element);
    };

    _proto.isMatch = function(message) {
        var _self = this;
        var _count = _self._columnFilterConditionList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _columnFilterCondition = _self._columnFilterConditionList.get(_i);
            if(_columnFilterCondition.isMatch(message) == true) {
                return true;
            }
        }
        return false;
    };
    _proto.isColmunChangeable = function(message) {
        var _self = this;
        var _count = _self._columnFilterConditionList.getCount();
        for(var _i = 0; _i < _count; _i++){
            var _columnFilterCondition = _self._columnFilterConditionList.get(_i);
            if(_columnFilterCondition.isColmunChangeable(message) == true) {
                return true;
            }
        }
        return false;
    };
    _proto.getType = function() {
        var _self = this;
        return _self._type;
    };

})();
function NotCondition() {
    ColumnFilterCondition.call(this);
    this._columnFilterCondition = null;
    this._type = ColumnFilterCondition.CONDITION_TYPE_NOT;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ColumnFilterCondition.prototype;
    NotCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = NotCondition.prototype;

    _proto.getJSONObject = function() {
        var _self = this;
        var _ret = null;
        if(_self._columnFilterCondition == null){
            return _ret;
        }
        var _value = _self._columnFilterCondition.getJSONObject();
        if(_value == null) {
            return _ret;
        }
        _ret = {
            type : _self._type,
            value : _value
        };
        return _ret;
    };

    _proto.getConditionObject = function(element) {
        var _self = this;

        if(element == null) {
            return null;
        }

        if(element.type != _self._type) {
            return null;
        }

        if(!element.value) {
            return null;
        }
        if(element.value.length != undefined && element.value.length != 1) {
            return null;
        }

        var _condition = _self._createCondition(element.value);
         if(_condition == null) {
            return null;
        }

        var _ret = null;

        _ret = this;
        this.setChildCondition(_condition);

        return _ret;
    };

    _proto.getChildCondition = function() {
        var _self = this;
        return _self._columnFilterCondition;
    };
    _proto.setChildCondition = function(columnFilterCondition) {
        if (!columnFilterCondition || typeof columnFilterCondition != 'object') {
            return;
        }
        var _self = this;
        _self._columnFilterCondition = columnFilterCondition;
    };
    _proto.isMatch = function(message) {
        var _self = this;
        if(_self._columnFilterCondition == null){
            return false;
        }
        return !_self._columnFilterCondition.isMatch(message);
    };
    _proto.isColmunChangeable = function(message) {
        var _self = this;
        if(_self._columnFilterCondition == null){
            return false;
        }
        return !_self._columnFilterCondition.isColmunChangeable(message);
    };
    _proto.getType = function() {
        var _self = this;
        return _self._type;
    };

})();
function ItemCondition() {
    ColumnFilterCondition.call(this);
    this._type = ColumnFilterCondition.CONDITION_TYPE_ITEM;
    this._name = null;
    this._value = null;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ColumnFilterCondition.prototype;
    ItemCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = ItemCondition.prototype;

    _proto.getJSONObject = function() {
        var _self = this;
        var _ret = null;
        if(_self._name == null || _self._name == ''){
            return _ret;
        }
        if(_self._value == null){
            return _ret;
        }
        _ret = {
            type : _self._type,
            name : _self._name,
            value : _self._value
        };
        return _ret;
    };

    _proto.getConditionObject = function(element) {
        var _self = this;

        if(element == null) {
            return null;
        }

        if(element.type != _self._type) {
            return null;
        }

        if(typeof element.value == 'object') {
           return null;
        }

        var _ret = null;

        _ret = this;
        _ret.setData(element.name, element.value);

        return _ret;
    };

    _proto.setData = function(name,value) {
        var _self = this;
        if (!name || typeof name != 'string' || name == '') {
            return;
        }
        if(value == null || (typeof value != 'string' && typeof value != 'number')) {
            return;
        }
        _self._name = name;
        _self._value = value;
    };
    _proto.isMatch = function(message) {
        var _self = this;
        if (!_self._name || typeof _self._name != 'string' || _self._name == '') {
            return false;
        }
        if(_self._value == null || (typeof _self._value != 'string' && typeof _self._value != 'number')) {
            return false;
        }
        return message.isMatchFilterCondition(_self._name, _self._value);
    };
    _proto.isColmunChangeable = function(message) {
        var _self = this;
        if (!_self._name || typeof _self._name != 'string' || _self._name == '') {
            return false;
        }
        if(_self._value == null || (typeof _self._value != 'string' && typeof _self._value != 'number')) {
            return false;
        }
        return message.isColmunChangeableFilterCondition(_self._name, _self._value);
    };
    _proto.getType = function() {
        var _self = this;
        return _self._type;
    };
    _proto.getValue = function() {
        var _self = this;
        return _self._value;
    };
    _proto.getName = function() {
        var _self = this;
        return _self._name;
    };

})();

function GreaterThanCondition() {
    ItemCondition.call(this);
    this._type = ColumnFilterCondition.CONDITION_TYPE_GREATER_THAN;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ItemCondition.prototype;
    GreaterThanCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = GreaterThanCondition.prototype;
    _proto.isMatch = function(message) {
        var _self = this;
        if (!_self._name || typeof _self._name != 'string' || _self._name == '') {
            return false;
        }
        if(_self._value == null || (typeof _self._value != 'string' && typeof _self._value != 'number')) {
            return false;
        }
        return message.isMatchGraterThanCondition(_self._name, _self._value);
    };
    _proto.isColmunChangeable = function(message) {
        var _self = this;
        if (!_self._name || typeof _self._name != 'string' || _self._name == '') {
            return false;
        }
        if(_self._value == null || (typeof _self._value != 'string' && typeof _self._value != 'number')) {
            return false;
        }
        return message.isColmunChangeableGraterThanCondition(_self._name, _self._value);
    };
})();

function LessThanCondition() {
    ItemCondition.call(this);
    this._type = ColumnFilterCondition.CONDITION_TYPE_LESS_THAN;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ItemCondition.prototype;
    LessThanCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = LessThanCondition.prototype;

    _proto.isMatch = function(message) {
        var _self = this;
        if (!_self._name || typeof _self._name != 'string' || _self._name == '') {
            return false;
        }
        if(_self._value == null || (typeof _self._value != 'string' && typeof _self._value != 'number')) {
            return false;
        }
        return message.isMatchLessThanCondition(_self._name, _self._value);
    };
    _proto.isColmunChangeable = function(message) {
        var _self = this;
        if (!_self._name || typeof _self._name != 'string' || _self._name == '') {
            return false;
        }
        if(_self._value == null || (typeof _self._value != 'string' && typeof _self._value != 'number')) {
            return false;
        }
        return message.isColmunChangeableLessThanCondition(_self._name, _self._value);
    };
})();

function KeywordCondition() {
    ColumnFilterCondition.call(this);
    this._type = ColumnFilterCondition.CONDITION_TYPE_KEYWORD;
    this._value = null;
    this._include = null;
};(function() {
    KeywordCondition.INCLUDE_TYPE_MSGFROM = 'msgfrom';
    var Super = function Super() {
    };
    Super.prototype = ColumnFilterCondition.prototype;
    KeywordCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = KeywordCondition.prototype;

    _proto.getJSONObject = function() {
        var _self = this;
        var _ret = null;
        if(_self._value == null || typeof _self._value != 'string' || _self._value == ''){
            return _ret;
        }
        var _include = [];
        if(_self._include != null) {
            for(var _key in _self._include) {
                _include.push(_key);
            }
        }
        _ret = {
            type : _self._type,
            value : _self._value,
            include : _include
        };
        return _ret;
    };

    _proto.getConditionObject = function(element) {
        var _self = this;

        if(element == null) {
            return null;
        }

        if(element.type != _self._type) {
            return null;
        }

        if(typeof element.value == 'object') {
            return null;
        }

        var _ret = null;

        _ret = this;
        _ret.setData(element.value);

        if(element.include != null) {
            for(var _i = 0; _i < element.include.length; _i++) {
                _ret._addInclude(element.include[_i]);
            }
        }

        return _ret;
    };

    _proto.setData = function(value) {
        if (!value || typeof value != 'string' || value == '') {
            return;
        }
        var _self = this;
        _self._value = value;
    };
    _proto.isMatch = function(message) {
        var _self = this;
        if (!_self._value || typeof _self._value != 'string' || _self._value == '') {
            return false;
        }
        return message.hasKeyword(_self._value, _self._include);
    };
    _proto.isColmunChangeable = function(message) {
        var _self = this;
        var _ret = _self.isMatch(message);
        if(_ret == true) {
            return _ret;
        }
        _ret = message.hasKeywordPreInfomation(_self._value, _self._include);
        return _ret;
    };
    _proto.getType = function() {
        var _self = this;
        return _self._type;
    };
    _proto.getValue = function() {
        var _self = this;
        return _self._value;
    };

    _proto.setAddIncludeMessageFrom = function() {
        var _self = this;
        _self._addInclude(KeywordCondition.INCLUDE_TYPE_MSGFROM);
    }
    _proto._addInclude = function(includeType) {
        var _self = this;
        if (!includeType || typeof includeType != 'string' || includeType == '') {
            return;
        }
        if(_self._include == null || typeof _self._include != 'object') {
            _self._include = {};
        }
        _self._include[includeType] = includeType;
    }
    _proto._deleteInclude = function(includeType) {
        var _self = this;
        if (!includeType || typeof includeType != 'string' || includeType == '') {
            return;
        }
        if(_self._include == null || typeof _self._include != 'object') {
            return;
        }
        delete _self._include[includeType];
    }

})();
function ParticularCondition() {
    ItemCondition.call(this);
    this._type = ColumnFilterCondition.CONDITION_TYPE_PARTICULAR;
};(function() {
    var Super = function Super() {
    };
    Super.prototype = ItemCondition.prototype;
    ParticularCondition.prototype = new Super();
    var _super = Super.prototype;

    ParticularCondition.CONDITION_TYPE_TASK_REQUESTING = 'TaskRequesting';
    ParticularCondition.CONDITION_TYPE_TASK_REQUESTED = 'TaskRequested';
    ParticularCondition.CONDITION_TYPE_TASK_SELF = 'TaskSelf';
    ParticularCondition.CONDITION_TYPE_TASK_OWNER = 'TaskOwner';
    ParticularCondition.CONDITION_TYPE_COMMUNITY_JOINED = 'CommunityJoined';
    ParticularCondition.CONDITION_TYPE_COMMUNITY_TASK_DEMANDED = 'CommunityTaskDemanded';
    ParticularCondition.CONDITION_TYPE_MESSAGE_HAVING_URL_EXCEPT_ATTACHED_FILE = 'MessageHavingUrlExceptAttachedFile';
    ParticularCondition.CONDITION_TYPE_UNREAD_MESSAGE = 'UnreadMessage';
    var _proto = ParticularCondition.prototype;

    ParticularCondition.createTaskRequestingCondition = function(jid) {
        var _particularCondition = new ParticularCondition();
        _particularCondition.setData(ParticularCondition.CONDITION_TYPE_TASK_REQUESTING, jid);
        return _particularCondition;
    };

    ParticularCondition.createTaskRequestedCondition = function(jid) {
        var _particularCondition = new ParticularCondition();
        _particularCondition.setData(ParticularCondition.CONDITION_TYPE_TASK_REQUESTED, jid);
        return _particularCondition;
    };

    ParticularCondition.createTaskSelfCondition = function(jid) {
        var _particularCondition = new ParticularCondition();
        _particularCondition.setData(ParticularCondition.CONDITION_TYPE_TASK_SELF, jid);
        return _particularCondition;
    };

    ParticularCondition.createTaskOwnerCondition = function(jid) {
        var _particularCondition = new ParticularCondition();
        _particularCondition.setData(ParticularCondition.CONDITION_TYPE_TASK_OWNER, jid);
        return _particularCondition;
    };
    ParticularCondition.createCommunityJoinedCondition = function(jid) {
        var _particularCondition = new ParticularCondition();
        _particularCondition.setData(ParticularCondition.CONDITION_TYPE_COMMUNITY_JOINED, jid);
        return _particularCondition;
    };
    ParticularCondition.createCommunityTaskDemandedCondition = function(jid) {
        var _particularCondition = new ParticularCondition();
        _particularCondition.setData(ParticularCondition.CONDITION_TYPE_COMMUNITY_TASK_DEMANDED, jid);
        return _particularCondition;
    };
    ParticularCondition.createMessageHavingUrlExceptAttachedFileCondition = function(attachedFileStyleUrl) {
        var _particularCondition = new ParticularCondition();
        _particularCondition.setData(ParticularCondition.CONDITION_TYPE_MESSAGE_HAVING_URL_EXCEPT_ATTACHED_FILE, attachedFileStyleUrl);
        return _particularCondition;
    };
    ParticularCondition.createUnreadMessageFileCondition = function(jid) {
        var _particularCondition = new ParticularCondition();
        _particularCondition.setData(ParticularCondition.CONDITION_TYPE_UNREAD_MESSAGE, jid);
        return _particularCondition;
    };
    _proto.isMatch = function(message) {
        var _self = this;
        if (!_self._name || typeof _self._name != 'string' || _self._name == '') {
            return false;
        }
        if(_self._value == null || (typeof _self._value != 'string' && typeof _self._value != 'number')) {
            return false;
        }
        var _ret = false;
        switch(_self._name) {
        case ParticularCondition.CONDITION_TYPE_TASK_REQUESTING:
            _ret = _self._isMatchTaskRequestingCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_TASK_REQUESTED:
            _ret = _self._isMatchTaskRequestedCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_TASK_SELF:
            _ret = _self._isMatchTaskSelfCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_TASK_OWNER:
            _ret = _self._isMatchTaskOwnerCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_COMMUNITY_JOINED:
            _ret = _self._isMatchCommunityJoinedComdition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_COMMUNITY_TASK_DEMANDED:
            _ret = _self._isMatchCommunityTaskDemandedCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_MESSAGE_HAVING_URL_EXCEPT_ATTACHED_FILE:
            _ret = _self._isMatchMessageHavingUrlExceptAttachedFileCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_UNREAD_MESSAGE:
            _ret = _self._isMatchUnreadMessageCondition(message);
            break;
        default:
            break;
        }
        return _ret;
    };
    _proto.isColmunChangeable = function(message) {
        var _self = this;
        if (!_self._name || typeof _self._name != 'string' || _self._name == '') {
            return false;
        }
        if(_self._value == null || (typeof _self._value != 'string' && typeof _self._value != 'number')) {
            return false;
        }
        var _ret = false;
        switch(_self._name) {
        case ParticularCondition.CONDITION_TYPE_TASK_REQUESTING:
            _ret = _self._isColmunChangeableTaskRequestingCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_TASK_REQUESTED:
            _ret = _self._isColmunChangeableTaskRequestedCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_TASK_SELF:
            _ret = _self._isColmunChangeableTaskSelfCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_TASK_OWNER:
            _ret = _self._isColmunChangeableTaskOwnerCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_COMMUNITY_JOINED:
            _ret = _self._isColmunChangeableCommunityJoinedCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_COMMUNITY_TASK_DEMANDED:
            _ret = _self._isColmunChangeableCommunityTaskDemandCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_MESSAGE_HAVING_URL_EXCEPT_ATTACHED_FILE:
            _ret = _self._isColmunChangeableMessageHavingUrlExceptAttachedFileCondition(message);
            break;
        case ParticularCondition.CONDITION_TYPE_UNREAD_MESSAGE:
            _ret = _self._isColmunChangeableUnreadMessageCondition(message);
            break;
        default:
            break;
        }
        return _ret;
    };

    _proto._isMatchTaskRequestingCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        if(message.getType() != Message.TYPE_TASK) {
            return _ret;
        }
        if(_self._value != message.getOwnerJid()){
            return _ret;
        }
        var _itemId = message.getItemId();
        var _childItemIdList = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childItemIdList == null || _childItemIdList.getCount() <= 0){
            return _ret;
        }
        _ret = true;
        return _ret;
    };
    _proto._isMatchTaskRequestedCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        if(message.getType() != Message.TYPE_TASK) {
            return _ret;
        }
        if(_self._value != message.getOwnerJid()){
            return _ret;
        }
        var _parentItemId = message.getParentItemId();
        if(_parentItemId == null || _parentItemId == '') {
            return _ret;
        }
        _ret = true;
        return _ret;
    };
    _proto._isMatchTaskSelfCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        if(message.getType() != Message.TYPE_TASK) {
            return _ret;
        }
        if(_self._value != message.getOwnerJid()){
            return _ret;
        }
        var _parentItemId = message.getParentItemId();
        if(_parentItemId != null && _parentItemId != '') {
            return _ret;
        }
        var _itemId = message.getItemId();
        var _childItemIdList = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childItemIdList != null && _childItemIdList.getCount() > 0){
            return _ret;
        }
        _ret = true;
        return _ret;
    };
    _proto._isMatchTaskOwnerCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        if(message.getType() != Message.TYPE_TASK) {
            return _ret;
        }
        if(_self._value == message.getOwnerJid()){
            _ret = true;
            return _ret;
        }
        var _itemId = message.getItemId();
        var _childItemIdList = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childItemIdList == null) {
            return _ret;
        }
        var _count = _childItemIdList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            var _childTaskItemId = _childItemIdList.get(_i);
            var _childTaskMessage = CubeeController.getInstance().getMessage(_childTaskItemId);
            if(_childTaskMessage == null) {
                continue;
            }
            if(_self._value == _childTaskMessage.getOwnerJid()){
                _ret = true;
                return _ret;
            }
        }
        return _ret;
    };
    _proto._isMatchCommunityJoinedComdition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        var _messageType = message.getType();
        if(_messageType == Message.TYPE_COMMUNITY) {
            _ret = true;
        } else if(_messageType == Message.TYPE_TASK){
            var _communityId = message.getCommunityId();
            if(_communityId != null && _communityId != '') {
                var _status = message.getStatus();
                if(_status > TaskMessage.STATUS_INBOX) {
                    _ret = true;
                }
            }
        }
        return _ret;
    };

    _proto._isMatchCommunityTaskDemandedCondition = function(message) {
        var _ret = false;

        if(!message || message.getType() != Message.TYPE_TASK
            || message.getParentItemId() != '' && message.getCommunityId() == ""){
            return _ret;
        }

        var _itemId = message.getItemId();
        var _childItemIdList = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childItemIdList == null) {
            return _ret;
        }
        var _count = _childItemIdList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            var _childTaskItemId = _childItemIdList.get(_i);
            var _childTaskMessage = CubeeController.getInstance().getMessage(_childTaskItemId);
            if(_childTaskMessage == null) {
                continue;
            }
            if(_childTaskMessage.getDemandStatus() == 1){
                _ret = true;
                return _ret;
            }
        }

        return _ret;
    };
    _proto._isMatchMessageHavingUrlExceptAttachedFileCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        var _re = new RegExp('https?://(?!' + _self._value + ')');
        var _matchStrArray = message.getMessage().match(_re);
        if(_matchStrArray != null && _matchStrArray.length > 0) {
            _ret = true;
        }
        return _ret;
    };

    _proto._isMatchUnreadMessageCondition = function(message){
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        var _type = message.getType();
        if(_type == Message.TYPE_TASK || _type == Message.TYPE_SYSTEM){
            return _ret;
        }
        var _readFlag = message.getReadFlag();
        return (_readFlag == Message.READ_STATUS_UNREAD);
    };

    _proto._isColmunChangeableTaskRequestingCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        _ret = _self._isMatchTaskRequestingCondition(message);
        if(_ret) {
            return _ret;
        }
        if(message.getType() != Message.TYPE_TASK) {
            return _ret;
        }
        if(_self._value != message.getPreOwnerJid()){
            return _ret;
        }
        var _itemId = message.getItemId();
        var _childItemIdList = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childItemIdList == null || _childItemIdList.getCount() <= 0){
            return _ret;
        }
        _ret = true;
        return _ret;
    };
    _proto._isColmunChangeableTaskRequestedCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        _ret = _self._isMatchTaskRequestedCondition(message);
        if(_ret) {
            return _ret;
        }
        if(message.getType() != Message.TYPE_TASK) {
            return _ret;
        }
        if(_self._value != message.getPreOwnerJid()){
            return _ret;
        }
        var _parentItemId = message.getParentItemId();
        if(_parentItemId == null || _parentItemId == '') {
            return _ret;
        }
        _ret = true;
        return _ret;
    };
    _proto._isColmunChangeableTaskSelfCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        _ret = _self._isMatchTaskSelfCondition(message);
        if(_ret) {
            return _ret;
        }
        if(message.getType() != Message.TYPE_TASK) {
            return _ret;
        }
        if(_self._value != message.getPreOwnerJid()){
            return _ret;
        }
        var _parentItemId = message.getParentItemId();
        if(_parentItemId != null && _parentItemId != '') {
            return _ret;
        }
        var _itemId = message.getItemId();
        var _childItemIdList = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childItemIdList != null && _childItemIdList.getCount() > 0){
            return _ret;
        }
        _ret = true;
        return _ret;
    };
    _proto._isColmunChangeableTaskOwnerCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        _ret = _self._isMatchTaskOwnerCondition(message);
        if(_ret) {
            return _ret;
        }
        if(message.getType() != Message.TYPE_TASK) {
            return _ret;
        }
        if(_self._value == message.getPreOwnerJid()){
            _ret = true;
            return _ret;
        }
        var _itemId = message.getItemId();
        var _childItemIdList = CubeeController.getInstance().getChildrenTaskItemIds(_itemId);
        if(_childItemIdList == null) {
            return _ret;
        };
        var _count = _childItemIdList.getCount();
        for(var _i = 0; _i < _count; _i++) {
            var _childTaskItemId = _childItemIdList.get(_i);
            var _childTaskMessage = CubeeController.getInstance().getMessage(_childTaskItemId);
            if(_childTaskMessage == null) {
                continue;
            }
            if(_self._value == _childTaskMessage.getPreOwnerJid()){
                _ret = true;
                return _ret;
            }
        }
        return _ret;
    };
    _proto._isColmunChangeableCommunityJoinedCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        var _messageType = message.getType();
        if(_messageType == Message.TYPE_COMMUNITY) {
            _ret = true;
        } else if(_messageType == Message.TYPE_TASK){
            var _communityId = message.getCommunityId();
            if(_communityId != null && _communityId != '') {
                var _status = message.getStatus();
                if(_status > TaskMessage.STATUS_INBOX) {
                    _ret = true;
                }
            }
        }
        return _ret;
    };

    _proto._isColmunChangeableCommunityTaskDemandCondition = function(message) {
        return message && message.getType() == Message.TYPE_TASK && message.getParentItemId() == '' && message.getCommunityId != '';
    };
    _proto._isColmunChangeableMessageHavingUrlExceptAttachedFileCondition = function(message) {
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        _ret = _self._isMatchMessageHavingUrlExceptAttachedFileCondition(message);
        if(_ret) {
            return _ret;
        }
        var _messageType = message.getType();
        if(_messageType == Message.TYPE_TASK) {
            var _re = new RegExp('https?://(?!' + _self._value + ')');
            var _matchStrArray = message.getPreMessage().match(_re);
            if(_matchStrArray != null && _matchStrArray.length > 0) {
                _ret = true;
            }
        }
        return _ret;
    };
    _proto._isColmunChangeableUnreadMessageCondition = function(message){
        var _self = this;
        var _ret = false;
        if(message == null) {
            return _ret;
        }
        var _type = message.getType();
        if(_type == Message.TYPE_TASK || _type == Message.TYPE_SYSTEM){
            return _ret;
        }
        var _readFlag = message.getReadFlag();
        var _ret = (_readFlag == Message.READ_STATUS_UNREAD) || (_readFlag == Message.READ_STATUS_READ)
        return _ret;
    };

})();

function FilterCondition(jsonString) {
    if (!jsonString || typeof jsonString != 'string') {
        this._jsonString = '';
        return;
    }
    this._jsonString = jsonString;
};(function() {
    var _proto = FilterCondition.prototype;
    FilterCondition.CONDITION_TYPE_AND = 'and';
    FilterCondition.CONDITION_TYPE_OR = 'or';
    FilterCondition.CONDITION_TYPE_NOT = 'not';
    FilterCondition.CONDITION_TYPE_ITEM = 'item';

    _proto.getJsonString = function() {
        return this._jsonString;
    };
    _proto.setJsonString = function(jsonString) {
        if (jsonString == null || typeof jsonString != 'string') {
            return;
        }
        this._jsonString = jsonString;
    };
    _proto.getJSONObject = function() {
        var _self = this;
        var _jsonObject = JSON.parse(_self._jsonString);
        return _jsonObject;
    };

    _proto.isMatch = function(message) {
        if (!message || typeof message != 'object') {
            return _ret;
        }
        return false;
    };
})();
function SortCondition(jsonString) {
    if (!jsonString || typeof jsonString != 'string') {
        this._jsonString = this._getDefaultSortConditionJsonString();
        return;
    }
    this._jsonString = jsonString;
};(function() {
    var _proto = SortCondition.prototype;
    SortCondition.SORT_ORDER_ASC = '1';
    SortCondition.SORT_ORDER_DESC = '2';

    _proto.getJsonString = function() {
        return this._jsonString;
    };
    _proto.setJsonString = function(jsonString) {
        if (jsonString == null || typeof jsonString != 'string') {
            return;
        }
        // This expression assigns variable jsonString to itself.
        // this._jsonString = jsonString = jsonString;
        this._jsonString = jsonString;
    };
    _proto.getJSONObject = function() {
        var _self = this;
        var _jsonObject = JSON.parse(_self._jsonString);
        return _jsonObject;
    };

    _proto._getDefaultSortConditionJsonString = function(){
        var _sort = {
                    item : 'id',
                    order : SortCondition.SORT_ORDER_DESC
        };
        return JSON.stringify(_sort);
    };
})();
function TaskFilterCondition(jsonString) {
    FilterCondition.call(this, (jsonString == null || typeof jsonString != 'string')? this._getDefaultFilterJsonString(): jsonString);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = FilterCondition.prototype;
    TaskFilterCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = TaskFilterCondition.prototype;

    _proto._getDefaultFilterJsonString = function() {
        var _and = FilterCondition.CONDITION_TYPE_AND;
        var _or = FilterCondition.CONDITION_TYPE_OR;
        var _not = FilterCondition.CONDITION_TYPE_NOT;
        var _item = FilterCondition.CONDITION_TYPE_ITEM;
        var _filter = {
                type : _and,
                value : [
                    {
                        type : _item,
                        name : "msgtype",
                        value : Message.TYPE_TASK
                    },
                    {
                        type : _item,
                        name : "owner",
                        value : LoginUser.getInstance().getJid()
                    },
                    {
                        type : _and,
                        value : [
                            {
                                type : _not,
                                value :
                                    {
                                        type : _item,
                                        name : "status",
                                        value : TaskMessage.STATUS_INBOX
                                    }
                            },
                            {
                                type : _not,
                                value :
                                    {
                                        type : _and,
                                        value : [
                                            {
                                                type : _item,
                                                name : "status",
                                                value : TaskMessage.STATUS_ASSIGNING
                                            },
                                            {
                                                type : _not,
                                                value :
                                                    {
                                                        type : _item,
                                                        name : "parent_item_id",
                                                        value : ''
                                                    }
                                            }
                                        ]
                                    }
                            }
                        ]
                    }
                ]
        };
        return JSON.stringify(_filter);
    };

    _proto.isMatch = function(message) {
        if (!message || typeof message != 'object') {
            return _ret;
        }

        return false;
    };

})();
function InboxFilterCondition(jsonString) {
    FilterCondition.call(this, (jsonString == null || typeof jsonString != 'string')? this._getDefaultFilterJsonString(): jsonString);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = FilterCondition.prototype;
    InboxFilterCondition.prototype = new Super();
    var _super = Super.prototype;
    var _proto = InboxFilterCondition.prototype;

    _proto._getDefaultFilterJsonString = function() {
        var _filter = {
            type : FilterCondition.CONDITION_TYPE_AND,
            value : [
                {
                    type : FilterCondition.CONDITION_TYPE_ITEM,
                    name : 'msgtype',
                    value : Message.TYPE_TASK
                },
                {
                    type : FilterCondition.CONDITION_TYPE_ITEM,
                    name : 'owner',
                    value : LoginUser.getInstance().getJid()
                },
                {
                    type : FilterCondition.CONDITION_TYPE_OR,
                    value : [
                        {
                            type : FilterCondition.CONDITION_TYPE_ITEM,
                            name : "status",
                            value : TaskMessage.STATUS_INBOX
                        },
                        {
                            type : FilterCondition.CONDITION_TYPE_AND,
                            value : [
                                {
                                    type : FilterCondition.CONDITION_TYPE_ITEM,
                                    name : "status",
                                    value : TaskMessage.STATUS_ASSIGNING
                                },
                                {
                                    type : FilterCondition.CONDITION_TYPE_NOT,
                                    value : {
                                        type : FilterCondition.CONDITION_TYPE_ITEM,
                                        name : "parent_item_id",
                                        value : ''
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        return JSON.stringify(_filter);
    };

    _proto.isMatch = function(message) {
        if (!message || typeof message != 'object') {
            return _ret;
        }

        return false;
    };
})();
function TaskSortCondition(jsonString) {
    SortCondition.call(this,(jsonString == null || typeof jsonString != 'string')? this._getDefaultFilterJsonString(): jsonString);
};(function() {
    var Super = function Super() {
    };
    Super.prototype = FilterCondition.prototype;
    TaskSortCondition.prototype = new Super();
    var _super = Super.prototype;
    TaskSortCondition.DB_COLOMN_STATUS = 'status';
    TaskSortCondition.DB_COLOMN_DUE_DATE = 'due_date';
    TaskSortCondition.DB_COLOMN_COMPLETE_DATE = 'complete_date';
    TaskSortCondition.DB_COLUMN_PRIORITY = 'priority';
    TaskSortCondition.DB_COLUMN_UPDATE_AT = 'updated_at';

    var _proto = TaskSortCondition.prototype;


    _proto._getDefaultFilterJsonString = function(){
        var _sort = {
                    item : TaskSortCondition.DB_COLOMN_STATUS + ',' + TaskSortCondition.DB_COLUMN_PRIORITY + ',' + TaskSortCondition.DB_COLOMN_COMPLETE_DATE + ',' + TaskSortCondition.DB_COLOMN_DUE_DATE,
                    order : SortCondition.SORT_ORDER_ASC + ',' + SortCondition.SORT_ORDER_DESC + ',' + SortCondition.SORT_ORDER_DESC + ',' + SortCondition.SORT_ORDER_ASC
        };
        return JSON.stringify(_sort);
    };
})();

