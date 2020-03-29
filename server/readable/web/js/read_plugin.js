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
function PluginUtility() {}
(function(){
    PluginUtility.loadJsFile = function(pathToJsFile) {
        var _ret = false;
        if(pathToJsFile != null && typeof pathToJsFile == 'string') {
            var _pluginScript = document.createElement('script');
            var _readPath = pathToJsFile;
            if (pathToJsFile.indexOf('?') == -1) {
                _pluginScript.src = _readPath + '?rannum=' + Math.floor(Math.random() * (65536));
            } else {
                _pluginScript.src = _readPath + '&rannum=' + Math.floor(Math.random() * (65536));
            }
            document.body.appendChild(_pluginScript);
            _ret = true;
        }
        return _ret;
    };
})();

function PluginReader() {
}
(function() {
    PluginReader.onLoadPluginList = function(pluginList){
        if(typeof pluginList === 'undefined') {
            return false;
        }
        var _pluginList = pluginList;
        if(_pluginList == null || !(_pluginList instanceof Array)) {
            return false;
        }
        var _pluginBasePath = 'js/plugins';
        var _pluginEntryPointFile = 'main.js';
        for(var _i = 0; _i < _pluginList.length; _i++) {
            var _pluginPath = _pluginList[_i];
            _pluginPath = _pluginBasePath + '/' + _pluginPath + '/' + _pluginEntryPointFile;
            PluginUtility.loadJsFile(_pluginPath);
        }
        return true;
    };
})();

(function() {
    $(function(){
        var _pluginUrl = 'js/plugins/pluginlist';
        $.ajax({
            type: 'GET',
            url: _pluginUrl,
            cache: false,
            dataType: 'text',
            success: function(data) {
                var _dataList = data.split(/\r\n|\r|\n/);
                var _pluginList = [];
                for(var _i = 0; _i < _dataList.length; _i++) {
                    if(_dataList[_i] == null) {
                        continue;
                    }
                    var _annotationStringIndex = _dataList[_i].indexOf('#');
                    var _pluginName = _dataList[_i];
                    if(_annotationStringIndex != -1) {
                        _pluginName = _dataList[_i].substring(0, _annotationStringIndex);
                    }
                    _pluginName = $.trim(_pluginName);
                    if(_pluginName == '') {
                        continue;
                    }
                    _pluginList.push(_pluginName);
                }
                PluginReader.onLoadPluginList(_pluginList);
            },
            error:function() {
                console.log('faild to get pluginlist');
            }
        });
    });
    var _customExtUrl = 'js/custom_ext/main.js';
    document.write('<script src="' + _customExtUrl + '?rannum=' + Math.floor(Math.random() * (65536)) + '"></script>');
})();
