var ServerLog = require('../controller/server_log');

/*
* returnLogFunction
* ログ出力用のオブジェクトを返す関数。現状、権限管理基盤はnodejs上に乗っているため
* nodejsがもつログの仕組みをそのまま使用することとする。
* 分離する際はこの関数内を書き換えること。
*/
function returnLogFunction(){
    var _log = ServerLog.getInstance();
    return(_log);
}

exports.returnLogFunction = returnLogFunction;
