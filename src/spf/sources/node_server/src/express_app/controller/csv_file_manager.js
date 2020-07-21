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

var csv = require('ya-csv');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var Iconv = require('iconv').Iconv;


var ServerLog = require('../../scripts/controller/server_log');
var _log = ServerLog.getInstance();

function CsvFileManager() {
}

var _proto = CsvFileManager.prototype;

CsvFileManager.toArray = function(filePath, onToArrayCallBack) {
    if (filePath == null || typeof filePath != 'string') {
        _log.connectionLog(4, 'filePath is invalid');
        return false;
    }
    if (onToArrayCallBack == null || typeof onToArrayCallBack != 'function') {
        _log.connectionLog(4, 'onToArrayCallBack is invalid');
        return false;
    }


    var _tmpFilePath = filePath;
    var command = 'nkf -w -Lu --overwrite ' + _tmpFilePath;
    exec(command, function(err, stdout, stderr) {
        if (err) {
            console.log(err);
            console.log(err.code);
            console.log(err.signal);
            onToArrayCallBack(null);
            return;
        }
        _toArrayFromCsvFile(_tmpFilePath, _onToArrayFromCsvFileCallBack);
    });

    return true;

    function _onToArrayFromCsvFileCallBack(csvDataArray){
        onToArrayCallBack(csvDataArray);
    }
};

CsvFileManager.createCsvData = function(recordArray, charCode) {
    if (recordArray == null || typeof recordArray != 'object') {
        _log.connectionLog(4, 'recordArray is invalid');
        return null;
    }
    var _conv = null;
    switch(charCode) {
        case CsvFileManager.CHAR_CODE_SJIS:
            _conv = new Iconv('UTF-8', 'Shift_JIS');
            break;
        default:
            break;
    }
    var _retCsvData = '';
    var _quote = '"';
    var _separator = ',';
    for(var _i = 0; _i < recordArray.length; _i++) {
        var _record = recordArray[_i];
        if(_record == null) {
            _log.connectionLog(4, 'record is invalid : No.' + _i);
            continue;
        }
        if (!Array.isArray(_record)) {
            _log.connectionLog(4, 'record is not Array : No.' + _i);
            continue;
        }
        for (var _j = 0; _j < _record.length; _j++) {
            var _field = _record[_j];
            if(_field != null && typeof _field != 'string') {
                _field = String(_field);
            }
            if (_j != 0) {
                _retCsvData += _separator;
            }
            var isQuote = isNeetQuote(_field);
            if(isQuote) {
                _retCsvData += _quote;
            }
            if(_field == null) {
            } else {
                _field = _field.replace(/"/g, '""');
                _field = _field.replace(/\r\n/g, '\n');
                _field = _field.replace(/\r/g, '\n');
                _field = _field.replace(/\n/g, '\r\n');
                _retCsvData += _field;
            }
            if(isQuote) {
                _retCsvData += _quote;
            }
        }
        _retCsvData += '\r\n';
    }
    if(_conv != null) {
        _retCsvData = _conv.convert(_retCsvData);
    }
    return _retCsvData;

    function isNeetQuote(data) {
        if(data == null || typeof data != 'string') {
            return false;
        }
        if(data.indexOf(',') >= 0) {
            return true;
        }
        if(data.indexOf('"') >= 0) {
            return true;
        }
        if(data.indexOf('\r') >= 0) {
            return true;
        }
        if(data.indexOf('\n') >= 0) {
            return true;
        }
        return false;
    }
};

function _toArrayFromCsvFile(filePath, onToArrayFromCsvFileCallBack){
    if (filePath == null || typeof filePath != 'string') {
        _log.connectionLog(4, 'filePath is invalid');
        return;
    }
    if (onToArrayFromCsvFileCallBack == null || typeof onToArrayFromCsvFileCallBack != 'function') {
        _log.connectionLog(4, 'onToArrayFromCsvFileCallBack is invalid');
        return;
    }
    var reader = csv.createCsvFileReader(filePath,{ columnsFromHeader: true });

    var i = 0;
    var csvDataArray = new Array();

    reader.addListener('data', function(data) {
        csvDataArray[i] = data;
        i++;
    });

    reader.addListener('end', function() {
        onToArrayFromCsvFileCallBack(csvDataArray);
    });

    reader.addListener('error', function(err) {
        _log.connectionLog(4, 'CsvFileManager#_toArrayFromCsvFile Error :: ' + err);
        onToArrayFromCsvFileCallBack(null);
    });

}

function _createUniqueTmpFilePath(fileName){
    var _ret = '';
    for(var _i = 0; _i < 100; _i++) {
        var _tmpFilePath = _createTmpFilePath();
        if(!fs.existsSync(_tmpFilePath)) {
            continue;
        }
        _ret = _tmpFilePath;
        break;
    }
    return _ret;
}

function _createUniqueTmpFilePath(){
    var _now = new Date();
    var _year = _now.getFullYear();
    var _month = _now.getMonth();
    var _date = _now.getDate();
    var _hour = _now.getHours();
    var _minute = _now.getMinutes();
    var _second = _now.getSeconds();
    var _ms = _now.getMilliseconds();
    return '../tmp/' + _year + _month + _date + _hour + _minute + _second + _ms + '.csv';
}

CsvFileManager.CHAR_CODE_NONE = 0;
CsvFileManager.CHAR_CODE_UTF8 = 1;
CsvFileManager.CHAR_CODE_SJIS = 2;

module.exports = CsvFileManager;
