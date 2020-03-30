var ERR_NOT_CSV_FILE = 'csvファイルを選択してください';

//ファイルの拡張子チェック
function checkFileExt(fileName){
    //ファイルの拡張子がcsvでなければ、エラーを出力
    if(!fileName.match(/\.csv$/i)){
        return false;
    }
    return true;
};

//エラー文字列
function _getErrNotCsvHtmlStr(){
    return ' <p class="text-error">' + ERR_NOT_CSV_FILE + '</p>'
}

//fileフォームのhtml文字列
function _getFileFormHtmlStr(){
    return '<input type="file" name="upfile" accept="text/csv">'
}

$(function(){
    //formエレメント取得
    var _formObj = $('form');
    //fileフォーム取得
    var _upFileObj = $('input[name=upfile]');
    var _log =  $('div.result-log');

    //fileフォームのchangeイベント登録
    _formObj.on('change', 'input[name=upfile]', function(){
        var _fileName = $(this).val();
        if(!checkFileExt(_fileName)){
            //csvファイル以外を選択されたときはエラーメッセージを出力
            $(this).replaceWith(_getFileFormHtmlStr());
            _log.html(_getErrNotCsvHtmlStr());
        }else{
            _log.html('');
        }
    });
});
