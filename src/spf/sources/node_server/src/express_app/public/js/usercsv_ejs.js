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

var ERR_NOT_CSV_FILE = 'csvファイルを選択してください';

function checkFileExt(fileName){
    if(!fileName.match(/\.csv$/i)){
        return false;
    }
    return true;
};

function _getErrNotCsvHtmlStr(){
    return ' <p class="text-error">' + ERR_NOT_CSV_FILE + '</p>'
}

function _getFileFormHtmlStr(){
    return '<input type="file" name="upfile" accept="text/csv">'
}

$(function(){
    var _formObj = $('form');
    var _upFileObj = $('input[name=upfile]');
    var _log =  $('div.result-log');

    _formObj.on('change', 'input[name=upfile]', function(){
        var _fileName = $(this).val();
        if(!checkFileExt(_fileName)){
            $(this).replaceWith(_getFileFormHtmlStr());
            _log.html(_getErrNotCsvHtmlStr());
        }else{
            _log.html('');
        }
    });
});
