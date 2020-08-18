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

function MessageExistingReaderInfo() {
    this._allCount = 0;
    this._existingReaderItemList = new ArrayList();
};(function() {
    var _proto = MessageExistingReaderInfo.prototype;
    _proto.getAllCount = function() {
        return this._allCount;
    };
    _proto.setAllCount = function(allCount) {
        if(allCount == null || typeof allCount != 'number') {
            return;
        }
        this._allCount = allCount;
    };
    _proto.getExistingReaderItemList = function() {
        return this._existingReaderItemList;
    };
})();

function ExistingReaderItem() {
    this._person = null
    this._date = null;
};(function() {
    var _proto = ExistingReaderItem.prototype;
    _proto.getPerson = function() {
        return this._person;
    };
    _proto.setPerson = function(person) {
        if(person == null || typeof person != 'object') {
            return;
        }
        this._person = person;
    };
    _proto.getDate = function() {
        return this._date;
    };
    _proto.setDate = function(date) {
        if(date == null || typeof date != 'object') {
            return;
        }
        this._date = date;
    };
})();