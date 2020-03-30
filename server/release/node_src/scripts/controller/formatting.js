/**
 * API入力値のデータのフォーマット変換の関数を定義
 *
 *
 * @module  src/scripts/controller/dataformatting
 */

'use strict';

const Log = require('./server_log').getInstance();

/**
 * 前後のスペース文字を削除
 * base64のデータをデコードして値リフォームする。
 * 前提条件）
 *   base64は ecodeURIComponentでコード化されている
 *   元データの文字コードはUTF8
 * ※変換できない値の指定は元の値を戻します。
 *
 * @param value リフォームする値
 * @return 返還された値
 */
exports.exTrim = (value) => {
    Log.connectionLog(7, 'do func Fotmatting.exTrim(...');
    if(value == undefined ||
       value == null ||
       typeof value != "string" ||
       value.length == 0){
        return value;
    }
    let _value;
    try{
        _value = decodeURIComponent(value.trim());
    }catch(e){
        //デコードできないフォーマットが却って来た場合は
        Log.connectionLog(5,"Fotmatting.exTrim error decodeURIComponent undecode data inputed.");
         _value = value;
    }
    return encodeURIComponent(_value.trim());
}

