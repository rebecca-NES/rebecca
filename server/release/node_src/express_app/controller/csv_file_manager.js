var csv = require('ya-csv');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var Iconv = require('iconv').Iconv;

//===================================================================================
//2019/01/15
// このエラーハンドリングの為のthrow処理の記述がソースコード内に無く、
// 外部ライブラリーのエラーをキャッチししてエラー処理となっていたため
// コメントアウトして暫定運用する、
//===================================================================================
//非同期処理のエラーをハンドリングするため
//domainモジュールを読み込む
//var Domain = require('domain');

var ServerLog = require('../../scripts/controller/server_log');
var _log = ServerLog.getInstance();

/*
 * CsvFileManagerクラス
 */
function CsvFileManager() {
}

var _proto = CsvFileManager.prototype;

/**
 * CSVファイルをArrayデータにパースする
 * @param {string} filePath パース対象のファイルパス
 * @param {function} onToArrayCallBack パース後のコールバック
 * @return {Boolean} パース処理が正常に開始されればtrue, そうでなければfalse
 */
CsvFileManager.toArray = function(filePath, onToArrayCallBack) {
    if (filePath == null || typeof filePath != 'string') {
        _log.connectionLog(4, 'filePath is invalid');
        return false;
    }
    if (onToArrayCallBack == null || typeof onToArrayCallBack != 'function') {
        _log.connectionLog(4, 'onToArrayCallBack is invalid');
        return false;
    }


    //csvファイルをUTF8,改行コードをLFに変換する
    var _tmpFilePath = filePath;
    var command = 'nkf -w -Lu --overwrite ' + _tmpFilePath;
    //===================================================================================
    //2019/01/15
    // このエラーハンドリングの為のthrow処理の記述がソースコード内に無く、
    // 外部ライブラリーのエラーをキャッチししてエラー処理となっていたため
    // コメントアウトして暫定運用する、
    //===================================================================================
    //var _domain = Domain.create();
    exec(command, function(err, stdout, stderr) {
        if (err) {
            console.log(err);
            console.log(err.code);
            console.log(err.signal);
            onToArrayCallBack(null);
            return;
        }
        //===================================================================================
        //2019/01/15
        // このエラーハンドリングの為のthrow処理の記述がソースコード内に無く、
        // 外部ライブラリーのエラーをキャッチししてエラー処理となっていたため
        // コメントアウトして暫定運用する、
        //===================================================================================
        //_domain.run(function() {
        //csvファイルをArrayデータ化する
        _toArrayFromCsvFile(_tmpFilePath, _onToArrayFromCsvFileCallBack);
        //});
    });

    //===================================================================================
    //2019/01/15
    // このエラーハンドリングの為のthrow処理の記述がソースコード内に無く、
    // 外部ライブラリーのエラーをキャッチししてエラー処理となっていたため
    // コメントアウトして暫定運用する、
    //===================================================================================
    //例外処理をハンドリング
    //CSV以外のファイルを読み込もうとしたときの
    //例外処理を想定
    // _domain.on('error', function(err) {
    //     _log.connectionLog(4, 'ERROR :: CSV File Read Fail. FilePath: ' + filePath);
    //     if (err && err.message) {
    //         _log.connectionLog(4, err.message);
    //     }
    //     if (err && err.stack) {
    //         _log.connectionLog(4, err.stack);
    //     }
    //     onToArrayCallBack(null);
    // });
    // 
    return true;

    //csvファイルをArrayデータ化後のコールバック
    function _onToArrayFromCsvFileCallBack(csvDataArray){
        onToArrayCallBack(csvDataArray);
    }
};

/**
 * CSVファイル形式のデータを作成します
 * @param {Array} recordArray 出力データ（2次元配列）
 * @param {number} charCode 文字コードの指定（CsvFileManager.CHAR_CODE_xxxの値）
 * @return {string} CSV形式の文字列（不正なデータの場合はnull）
 */
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
                // DO NOTHING
            } else {
                // エスケープ
                _field = _field.replace(/"/g, '""');
                // 改行コードを"\r\n"にそろえる
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
        // 文字コード変換
        _retCsvData = _conv.convert(_retCsvData);
    }
    return _retCsvData;

    // クォートが必要か判定
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

/**
 * csvファイルをArrayデータ化する
 */
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

    // データ読み込み処理（1行読み込むごとに呼ばれる）
    reader.addListener('data', function(data) {
        csvDataArray[i] = data;
        i++;
    });

    // データ読み込み終了
    reader.addListener('end', function() {
        onToArrayFromCsvFileCallBack(csvDataArray);
    });

    // 処理失敗時
    reader.addListener('error', function(err) {
        _log.connectionLog(4, 'CsvFileManager#_toArrayFromCsvFile Error :: ' + err);
        onToArrayFromCsvFileCallBack(null);
    });

}

/**
 * テンポラリ領域に保存するユニークなファイルパス名を生成
 */
function _createUniqueTmpFilePath(fileName){
    var _ret = '';
    // 最大100回トライする
    for(var _i = 0; _i < 100; _i++) {
        var _tmpFilePath = _createTmpFilePath();
        // 探す
        if(!fs.existsSync(_tmpFilePath)) {
            // 既にあるのでリトライ
            continue;
        }
        _ret = _tmpFilePath;
        break;
    }
    return _ret;
}

/**
 * テンポラリ領域に保存するファイルパス名を生成
 */
function _createUniqueTmpFilePath(){
    //ファイル名を年月日時分秒ms
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
