/**
 * license_manager.js  -  ライセンス管理
 *
 * created: 2015/9/7 cubee v3/sp3
 */

(function() {

   /**
    * requires.
    */
    var _fs = require('fs');
    var _path = require('path');

    var ServerLog = require('../../scripts/controller/server_log');
    var _log = ServerLog.getInstance();

   /**
    * LicenseManagerコンストラクタ
    */
    function LicenseManager() {
    };

   /**
    * 固定値
    */
    var _CONSTS = {
        "TIDREP_PATTERN" : /%_TENANT_ID_%/g, //テナントIDリプレース用パターン
        "KEY_FILE" : "/opt/cubee/license/tenant/%_TENANT_ID_%.txt", //ライセンスキーファイル
        //license.txtに記述されるライセンスキーのパターン(数字と英大文字でD,I,O,Zは使用しない)
        "KEY_PATTERN" : "^([0-9A-CE-HJ-NP-Y]{5})-([0-9A-CE-HJ-NP-Y]{5})-([0-9A-CE-HJ-NP-Y]{5})-([0-9A-CE-HJ-NP-Y]{5})$",

        //ライセンス情報のパターン
        "DATA_PATTERN" : "^(\\d)(\\d{5})(\\d)(\\d{2})(\\d{2})(\\d)(\\d{6})(\\d)(\\d{6})(\\d)$",

        //ライセンス数のゼロサプレス用パターン
        "USERCNT_PATTERN" : "([1-9]\\d*)$",

        "TERM_FORMAT"  : "yymmdd",        //有効期限のフォーマット
        "INDEFINITE_TERM" : "999999",     //有効期限なしの場合の値

        //32進数→10進数変換テーブル
        "TRANS_TABLE" : {
            "0" : 0,  "1" : 1,  "2" : 2,  "3" : 3,  "4" : 4,  "5" : 5,  "6" : 6,  "7" : 7,
            "8" : 8,  "9" : 9,  "A" : 10, "B" : 11, "C" : 12, "E" : 13, "F" : 14, "G" : 15,
            "H" : 16, "J" : 17, "K" : 18, "L" : 19, "M" : 20, "N" : 21, "P" : 22, "Q" : 23,
            "R" : 24, "S" : 25, "T" : 26, "U" : 27, "V" : 28, "W" : 29, "X" : 30, "Y" : 31
        },

        //ライセンスタイプ
        "TYPE_PATTERN"  : "^0[1-4]$", //ライセンスタイプチェックパターン
        "TYPE_ENTRY"    : "01",    //エントリーパック
        "TYPE_UPGRADE"  : "02",    //アップグレードパック
        "TYPE_STANDARD" : "03",    //スタンダードパック
        "TYPE_USER"     : "04",    //ユーザライセンス

        //エラーコード
        "ERR_NO_KEYS"    : -1,  //ライセンスファイルの読み込み失敗
        "ERR_WRONG_KEY1" : -2,  //初期ライセンス不正
        "ERR_WRONG_KEY2" : -3   //追加ライセンス不正
    };

    LicenseManager.CONSTS = _CONSTS;

    var _proto = LicenseManager.prototype;

  /**
   * 利用可能ユーザ数
   * @param {String} テナントID
   * @return {object} { count : 利用可能ユーザ数, error : エラー情報 }
   */
    _proto.getLicensedUserCount = function(tid) {
        var _keyDatas = _get_license_keys(tid);
        if( _keyDatas == null ) {
            _log.connectionLog(3, "[license_manager] ERR_NO_KEYS  (_keyDatas=null)");
            return { "count" : 0, "error" : _CONSTS.ERR_NO_KEYS };
        }

        var _key_count = _keyDatas.length;
        var _license_info = [];
        var _license_count = 0;
        var _error = "";
        for( var _i = 0; _i < _key_count; _i++) {
           if( _keyDatas[_i] === "" ) {
               continue;
           }

           var _info = _get_license_info(_keyDatas[_i]); 
           if(_info == null ) {
               _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY2 license_key=(" + _keyDatas[_i] + ")");
               _error = _CONSTS.ERR_WRONG_KEY2;
               continue;
           }

           _license_info[_license_count++] = new _addLicenseInfo( _info );
        }

        if( _license_count <= 0 ) {
            _log.connectionLog(3, "[license_manager] ERR_NO_KEYS  (_license_count=0)");
            return { "count" : 0, "error" : _CONSTS.ERR_NO_KEYS };
        }

        //ライセンスタイプでソート
        _license_info.sort(function(a,b) { return(a.license_type < b.license_type )? -1 : 1 } );

        var _user = "";
        var _base = "";
        var _count = 0;
        var _no = {};
        for ( var _i = 0; _i < _license_count; _i++ ) {
            var _info = _license_info[_i];

            if(_info.license_type === _CONSTS.TYPE_ENTRY || _info.license_type === _CONSTS.TYPE_STANDARD){
            //ベースキーのチェック
                if( _base !== "" ) {
                    _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY1  wrong base-key: base_type=("+ _base + ")  add_type=(" + _info.license_type + ")");
                    return { "count" : 0, "error" : _CONSTS.ERR_WRONG_KEY1 };
                }

                _user = _info.user_code;
                _base = _info.license_type;
            } else if ( _base === "" ) {
            //ベースキーがない
                _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY1  (no base-key)");
                return { "count" : 0, "error" : _CONSTS.ERR_WRONG_KEY1 };

            } else if ( _user !== _info.user_code ) {
            //ユーザコードが異なる
                _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY2  wrong user_code: base_user=("+_user+")  add_user=(" +_info.user_code +")" );
                _error = _CONSTS.ERR_WRONG_KEY2;
                continue;
            } else if ( typeof _no[_info.license_no] !== "undefined" ) {
            //発行番号が重複する
                _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY2  license_no already exist: no=(" +_info.license_no +")");
                _error = _CONSTS.ERR_WRONG_KEY2;
                continue;

            } else if ( _info.license_type === _CONSTS.TYPE_UPGRADE ) {
            //アップグレードパック
                if( _base !== _CONSTS.TYPE_ENTRY ) {
                    _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY2  wrong add-type: base_type=("+_base+") add_type=("+_info.license_type+")");
                    return { "count" : 0, "error" : _CONSTS.ERR_WRONG_KEY1 };
                }

                _base = _info.license_type;

            } else if ( _info.license_type === _CONSTS.TYPE_USER ) {
            //追加ユーザライセンス
                if( _base !== _CONSTS.TYPE_UPGRADE && _base !== _CONSTS.TYPE_STANDARD ) {
                    _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY2  wrong add-type: base_type=("+_base+") add_type=("+_info.license_type+")");
                    _error = _CONSTS.ERR_WRONG_KEY2;
                    continue;
                }
            }

            _no[_info.license_no] = 1;
            _count += _info.user_count;
        }

        return { "count" : _count, "error" : _error };
    };

    function _addLicenseInfo( info ) {
        this.user_code = info.user_code;
        this.license_no = info.license_no;
        this.license_type = info.license_type;
        this.term_date = info.term_date;
        this.user_count = info.user_count;
    }

    /**
     * ライセンスファイルの読み込み
     * @param {String} テナントID
     * @return {Array} ライセンスキーのリスト
     */
    function _get_license_keys(tid) {

        var _key_file = _CONSTS.KEY_FILE;
        _key_file = _key_file.replace( _CONSTS.TIDREP_PATTERN, tid );
        if(!_fs.existsSync(_key_file)) {
            _log.connectionLog(3, "[license_manager] no license-file: file=(" + _key_file + ")");
            return null;
        }
 
        var _fileData = _fs.readFileSync(_key_file).toString();
        return _fileData.split('\n');
    };

    /**
     * ライセンスキーの解析（メイン）
     * @param {String} ライセンスキー
     * @return {Object} ライセンス情報 { user_code, license_no, license_type, term_date, user_count }
     */
    function _get_license_info( license_key ) {

        var _p1 = _phase1(license_key);
        if( _p1 == null ) {
            return null;
        }

        var _p2 = _phase2(_p1);
        var _p3 = _phase3(_p1);
        var _p4 = _phase4(_p1);
        var _p5 = _phase5(_p1);
        var _p6 = _phase6(_p1);
        var _p7 = _phase7(_p3, _p4, _p5, _p6);
        var _p8 = _phase8(_p7,_p2);
        var _p9 = _phase9(_p8, _p2);

        return _p9;
    };

    /**
     * 32進文字列を10進文字列に変換して返す
     * @param {String} 変換する32進文字列
     * @return {String} 変換後の10進文字列
     */
    function _to_decimal( str ) {
        var _n = 0;
        var _l = str.length;

        for ( var _i = 0; _i < _l; _i++ ) {
            _n = _n * 32 + _CONSTS.TRANS_TABLE[str.substring(_i, _i+1)];
        }

        return _n;
    };

    /**
     * 日付の形式チェック
     * @param {String} チェックする日付（yymmdd）
     * @return {boolean} 正しい日付:true  不正な日付:false
     */
    function _chk_date(ymd) {

        if( ymd.length != 6 ) {
            return false;
        }

        //999999は有効期限なしとして許可する
        if( ymd == _CONSTS.INDEFINITE_TERM ) {
            return true;
        }

        var _year = ymd.substring(0,2);
        var _mon = ymd.substring(2,4);
        var _day = ymd.substring(4,6);

        var _dt = new Date(_year, _mon - 1, _day);
        if(_dt == null || _dt.getYear() != _year || _dt.getMonth() + 1 != _mon || _dt.getDate() != _day) {
            return false;
        }
        return true;
    };

    /**
     * 10進文字列の各桁の合計値を求める
     * @param {String} 10進文字列
     * @return {int} 各桁の合計値
     */
    function _sum_columns(str){
        var _n = 0;
        for ( var _i = str.length; _i > 0; _i-- ) {
          _n += parseInt(str.substring(_i-1, _i));
        }

        return _n;
    };

    /**
     * 文字列を右へローテーションする
     * @param {String} ローテーションする文字列
     * @param {int} ローテーションする桁数
     * @return {String} ローテーション後の文字列
     */
    function _rotate_r(str, n) {
        return str.substring(str.length-n) + str.substring(0,str.length-n);
    };


    /**
     * phase1: ライセンスキーの分割と並べ替え
     * @param {String} ライセンスキー
     * @return {String} 並び替えたライセンスキー  形式が不正な場合は、null
     */
    function _phase1(license_key){
      var _mat = license_key.match(_CONSTS.KEY_PATTERN);
      if(_mat == null){
        return null;
      }

      return _mat[3] + _mat[4] + _mat[1] + _mat[2];
    };

    /**
     * phase2: phase1の結果の1桁目の文字(32進数)を10進数に変換する
     * @param {String} phase1の結果の文字列(32進文字列)
     * @return {int} phase1の結果の1文字目を10進数値に変換したもの
     */
    function _phase2 ( p1 ) {
       return _CONSTS.TRANS_TABLE[p1.substring(0,1)];
    };

    /**
     * phase3: phase1の結果の2～7桁を8桁の10進数値に変換する
     * @param {String} phase1の結果の文字列(32進文字列)
     * @return {String} 10進文字列
     */
    function _phase3 ( p1 ) {
        var _n = _to_decimal(p1.substring( 2-1, 2+6-1 ));    //2桁目から6桁
        return ("00000000" + _n ).slice(-8);                 //ゼロパディング
    };

    /**
     * phase4: phase1の結果の8～12桁を7桁の10進数に変換する
     * @param {String} phase1の結果の文字列(32進文字列)
     * @return {String} 10進文字列
     */
    function _phase4 ( p1 ) {
        var _n = _to_decimal(p1.substring( 8-1, 8+5-1 ));    //8桁目から5桁
        return ("0000000" + _n ).slice(-7);                  //ゼロパディング
    };

    /**
     * phase5: phase1の結果の13～16桁を6桁の10進数に変換する
     * @param {String} phase1の結果の文字列(32進文字列)
     * @return {String} 10進文字列
     */
    function _phase5 ( p1 ) {
        var _n = _to_decimal(p1.substring( 13-1, 13+4-1 ));    //13桁目から4桁
        return ("000000" + _n ).slice(-6);                  //ゼロパディング
    };

    /**
     * phase6: phase1の結果の17～20桁を5桁の10進数に変換する
     * @param {String} phase1の結果の文字列(32進文字列)
     * @return {String} 10進文字列
     */
    function _phase6 ( p1 ) {
        var _n = _to_decimal(p1.substring( 17-1, 17+4-1 ));    //17桁目から4桁
        return ("00000" + _n ).slice(-5);                  //ゼロパディング
    };

    /**
     * phase7: phase3,4,5,6の結果を結合する
     * @param {String} phase3の結果の文字列(8桁の10進文字列)
     * @param {String} phase4の結果の文字列(7桁の10進文字列)
     * @param {String} phase5の結果の文字列(6桁の10進文字列)
     * @param {String} phase6の結果の文字列(5桁の10進文字列)
     * @return {String} 結合した文字列（26桁の10進文字列）
     */
    function _phase7 ( p3, p4, p5, p6 ) {
        return "" + p3 + p4 + p5 + p6;
    };

    /**
     * phase8: phase7の結果をphase2の結果の桁数分右へローテーションする
     * @param {String} phase7の結果の文字列(ローテーションする文字列)
     * @param {int} phase2の結果の数値(ローテーションする桁数)
     * @return {String} ローテーション後の文字列
     */
    function _phase8 ( p7, p2 ) {
        return _rotate_r(p7, p2);
    };

    /**
     * phase9: ライセンス情報の分解
     * @param {String} phase8の結果
     * @param {int} phase2の結果(チェックサム値)
     * @return {Object} ライセンス情報{ user_info, license_no, license_type, term_date, user_count }
     *    不正なライセンス情報の場合はnull
     */
    function _phase9( p8, p2 ) {

        //パターンチェック：
        var _mat = p8.match(_CONSTS.DATA_PATTERN);
        if(_mat == null){
          return null;
        }

        //チェックサム：各桁の合計値%桁数とphase2の値を比較
        var _sum = _sum_columns(p8);
        if (( _sum % p8.length ) != p2 ) {
          return null;
        }

        //ユーザコードチェック：
        if( _mat[2] != ( _mat[1] + _mat[3] + _mat[6] + _mat[8] + _mat[10] )) {
          return null;
        }

        //有効期限形式チェック：
        if( !_chk_date(_mat[7] )) {
          return null;
        }

        //ライセンスタイプチェック
        if( _mat[5].match(_CONSTS.TYPE_PATTERN) == null) {
          return null;
        }

        //ライセンス数のパターンチェック
        var _count = _mat[9].match(_CONSTS.USERCNT_PATTERN);
        if ( _count == null ) {
            return null;
        }

        return {
              "user_code"    : _mat[2],   //ユーザコード
              "license_no"   : _mat[4],   //ライセンス番号
              "license_type" : _mat[5],   //ライセンスタイプ
              "term_date"    : _mat[7],   //有効期限(yymmdd or 999999)
              "user_count"   : parseInt(_count[1])  //ユーザ数
        };
    };


    var _licenseManager = new LicenseManager();
    LicenseManager.getInstance = function() {
        return _licenseManager;
    };

    exports.getInstance = LicenseManager.getInstance;
    exports.ERR_NO_KEYS = LicenseManager.CONSTS.ERR_NO_KEYS;
    exports.ERR_WRONG_KEY1 = LicenseManager.CONSTS.ERR_WRONG_KEY1;
    exports.ERR_WRONG_KEY2 = LicenseManager.CONSTS.ERR_WRONG_KEY2;

})();
