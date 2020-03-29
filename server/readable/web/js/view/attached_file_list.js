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
function AttachedFileList(htmlElement) {
    ArrayList.call(this);
    this._htmlElement = htmlElement;
};(function() {
    AttachedFileList.prototype = $.extend({}, ArrayList.prototype, ViewCore.prototype);
    var _super = ArrayList.prototype;
    var _proto = AttachedFileList.prototype;
    _proto.cleanup = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        _rootElement.off();
    };
    _proto.add = function(url) {
        var _self = this;
        if (_validation({'url' : url}) == false) {
            return false;
        }
        var _existAttachedFileData = _self.getByUrl(url);
        if(_existAttachedFileData != null) {
            return false;
        }
        var _attachedFileData = new AttachedFileData(_self.getHtmlElement(), url);
        return _super.add.call(this, _attachedFileData);
    };
    _proto.getByUrl = function(url) {
        var _self = this;
        if (_validation({'url' : url}) == false) {
            return null;
        }
        var _retAttachedFileData = null;
        var _count = _self._length;
        for(var _i = 0; _i < _count; _i++) {
            if(_self._array[_i].getUrl() == url) {
                _retAttachedFileData = _self._array[_i];
                break;
            }
        }
        return _retAttachedFileData;
    };
    _proto.removeByUrl = function(url) {
        var _self = this;
        if (_validation({'url' : url}) == false) {
            return null;
        }
        var _retAttachedFileData = null;
        var _count = _self._length;
        for(var _i = 0; _i < _count; _i++) {
            if(_self._array[_i].getUrl() == url) {
                _retAttachedFileData = _super.remove.call(this, _i);
                break;
            }
        }
        return _retAttachedFileData;
    };
    _proto.setByUrl = function(setAttachedFileData) {
        var _self = this;
        if (_validation({'setAttachedFileData' : setAttachedFileData}) == false) {
            return null;
        }
        var _retAttachedFileData = null;
        var _url = setAttachedFileData.getUrl();
        var _count = _self._length;
        for(var _i = 0; _i < _count; _i++) {
            if(_self._array[_i].getUrl() == _url) {
                _retAttachedFileData = _self._array[_i];
                break;
            }
        }
        _retAttachedFileData.setFlag(setAttachedFileData.getFlag());

        return _retAttachedFileData;
    };
    _proto.removeAll = function() {
        _super.removeAll.call(this);
    };
    _proto.getAttachedUrl = function() {
        var _self = this;
        var _retAttachedFileData = null;
        var _count = _self._length;
        for(var _i = 0; _i < _count; _i++) {
            _retAttachedFileData = _self._array[_i].getUrl();
        }
        return _retAttachedFileData;
    };
    _proto.getHtml = function() {
        var _self = this;
        var _ret = '';
        _ret = '<div class="attached-files">';
        var _count = _self._length;
        for(var _i = 0; _i < _count; _i++) {
            _ret += _self._array[_i].getHtml();
        }
        _ret += '</div>';
        return _ret;
    };

    function _validation(args) {
        for (var p in args) {
            if (p == 'url') {
                if (args[p] == null || typeof args[p] != 'string') {return false;}
            } else if (p == 'setAttachedFileData') {
                if (args[p] == null || typeof args[p] != 'object') {return false;}
            }
        }
        return true;
    };
})();
