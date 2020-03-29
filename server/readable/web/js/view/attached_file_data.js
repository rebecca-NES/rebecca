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
function AttachedFileData(htmlElement, url) {
    this._htmlElement = htmlElement;
    this._url = url;
    this._controlflag = AttachedFileData.FILE_ATTACHED;
    this._fileName = '';
    if (this._url != null) {
        this._fileName = ViewUtils.getAttachmentFileName(this._url);
    }
    this._createEventHandler();
};(function() {
    AttachedFileData.FILE_ATTACHED = 0;
    AttachedFileData.FILE_DELETE = 1;
    AttachedFileData.FILE_ATTACHE_NEW = 2;

    AttachedFileData.prototype = $.extend({}, ViewCore.prototype);
    var _proto = AttachedFileData.prototype;
    _proto.getUrl = function() {
        return this._url;
    };
    _proto.setUrl = function(url) {
        if(url == null || typeof url != 'string') {
            return;
        }
        if(url == '') {
            return;
        }
        this._url = url;
    };
    _proto.getFlag = function() {
        return this._controlflag;
    };
    _proto.setFlag = function(flag) {
        if(flag == null || typeof flag != 'number') {
            return;
        }
        this._controlflag = flag;
    };
    _proto.getFileName = function() {
        return this._fileName;
    };
    _proto.setFileName = function(filename) {
        if(filename == null || typeof filename != 'string') {
            return;
        }
        if(filename == '') {
            return;
        }
        this._fileName = filename;
    };

    _proto._createEventHandler = function() {
        var _self = this;
        var _rootElement = _self.getHtmlElement();
        if(!_rootElement) {
            return;
        }
        _rootElement.on('click', 'div.attached-files > div.file-selected > a.cancel-file-upload', function() {
            _self._clickCancelAttachedFile($(this));
        });
    };

    _proto._clickCancelAttachedFile = function(targetElement) {
        var _self = this;
        var _targetParent = targetElement.parent();

        _self.getHtmlElement().find('div.attached-files').remove();

        _self.setFlag(AttachedFileData.FILE_DELETE);
    };

    _proto.getHtml = function() {
        var _self = this;
        var _ret = '';
        var _ret = '';
        _ret += '  <input type="file" name="upfile" class="file">';
        _ret += '  <div class="file-selected">';
        _ret += '    <a class="ico_btn select-file" data-toggle="tooltip" data-original-title=' + _self.getFileName() + ' data-placement="right">';
        _ret += '      <i class="fa fa-paperclip"></i>';
        _ret += '    </a>';
        _ret += '    <p class="file-name" data-toggle="tooltip" data-original-title="' + _self.getFileName() + '" data-placement="bottom">' + _self.getFileName() + '</p>';
        _ret += '    <a class="ico_btn cancel-file-upload" data-toggle="tooltip" data-original-title="cancel" data-placement="bottom">';
        _ret += '      <i class="fa fa-remove"></i>';
        _ret += '    </a>';
        _ret += '    <br class="clear-float">';
        _ret += '  </div>';
        return _ret;
    }

})();
