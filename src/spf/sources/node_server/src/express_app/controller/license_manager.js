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

(function() {

    var _fs = require('fs');
    var _path = require('path');

    var ServerLog = require('../../scripts/controller/server_log');
    var _log = ServerLog.getInstance();

    function LicenseManager() {
    };

    var _CONSTS = {
        "TIDREP_PATTERN" : /%_TENANT_ID_%/g,
        "KEY_FILE" : "/opt/cubee/license/tenant/%_TENANT_ID_%.txt",
        "KEY_PATTERN" : "^([0-9A-CE-HJ-NP-Y]{5})-([0-9A-CE-HJ-NP-Y]{5})-([0-9A-CE-HJ-NP-Y]{5})-([0-9A-CE-HJ-NP-Y]{5})$",

        "DATA_PATTERN" : "^(\\d)(\\d{5})(\\d)(\\d{2})(\\d{2})(\\d)(\\d{6})(\\d)(\\d{6})(\\d)$",

        "USERCNT_PATTERN" : "([1-9]\\d*)$",

        "TERM_FORMAT"  : "yymmdd",
        "INDEFINITE_TERM" : "999999",

        "TRANS_TABLE" : {
            "0" : 0,  "1" : 1,  "2" : 2,  "3" : 3,  "4" : 4,  "5" : 5,  "6" : 6,  "7" : 7,
            "8" : 8,  "9" : 9,  "A" : 10, "B" : 11, "C" : 12, "E" : 13, "F" : 14, "G" : 15,
            "H" : 16, "J" : 17, "K" : 18, "L" : 19, "M" : 20, "N" : 21, "P" : 22, "Q" : 23,
            "R" : 24, "S" : 25, "T" : 26, "U" : 27, "V" : 28, "W" : 29, "X" : 30, "Y" : 31
        },

        "TYPE_PATTERN"  : "^0[1-4]$",
        "TYPE_ENTRY"    : "01",
        "TYPE_UPGRADE"  : "02",
        "TYPE_STANDARD" : "03",
        "TYPE_USER"     : "04",

        "ERR_NO_KEYS"    : -1,
        "ERR_WRONG_KEY1" : -2,
        "ERR_WRONG_KEY2" : -3
    };

    LicenseManager.CONSTS = _CONSTS;

    var _proto = LicenseManager.prototype;

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

        _license_info.sort(function(a,b) { return(a.license_type < b.license_type )? -1 : 1 } );

        var _user = "";
        var _base = "";
        var _count = 0;
        var _no = {};
        for ( var _i = 0; _i < _license_count; _i++ ) {
            var _info = _license_info[_i];

            if(_info.license_type === _CONSTS.TYPE_ENTRY || _info.license_type === _CONSTS.TYPE_STANDARD){
                if( _base !== "" ) {
                    _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY1  wrong base-key: base_type=("+ _base + ")  add_type=(" + _info.license_type + ")");
                    return { "count" : 0, "error" : _CONSTS.ERR_WRONG_KEY1 };
                }

                _user = _info.user_code;
                _base = _info.license_type;
            } else if ( _base === "" ) {
                _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY1  (no base-key)");
                return { "count" : 0, "error" : _CONSTS.ERR_WRONG_KEY1 };

            } else if ( _user !== _info.user_code ) {
                _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY2  wrong user_code: base_user=("+_user+")  add_user=(" +_info.user_code +")" );
                _error = _CONSTS.ERR_WRONG_KEY2;
                continue;
            } else if ( typeof _no[_info.license_no] !== "undefined" ) {
                _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY2  license_no already exist: no=(" +_info.license_no +")");
                _error = _CONSTS.ERR_WRONG_KEY2;
                continue;

            } else if ( _info.license_type === _CONSTS.TYPE_UPGRADE ) {
                if( _base !== _CONSTS.TYPE_ENTRY ) {
                    _log.connectionLog(3, "[license_manager] ERR_WRONG_KEY2  wrong add-type: base_type=("+_base+") add_type=("+_info.license_type+")");
                    return { "count" : 0, "error" : _CONSTS.ERR_WRONG_KEY1 };
                }

                _base = _info.license_type;

            } else if ( _info.license_type === _CONSTS.TYPE_USER ) {
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

    function _to_decimal( str ) {
        var _n = 0;
        var _l = str.length;

        for ( var _i = 0; _i < _l; _i++ ) {
            _n = _n * 32 + _CONSTS.TRANS_TABLE[str.substring(_i, _i+1)];
        }

        return _n;
    };

    function _chk_date(ymd) {

        if( ymd.length != 6 ) {
            return false;
        }

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

    function _sum_columns(str){
        var _n = 0;
        for ( var _i = str.length; _i > 0; _i-- ) {
          _n += parseInt(str.substring(_i-1, _i));
        }

        return _n;
    };

    function _rotate_r(str, n) {
        return str.substring(str.length-n) + str.substring(0,str.length-n);
    };


    function _phase1(license_key){
      var _mat = license_key.match(_CONSTS.KEY_PATTERN);
      if(_mat == null){
        return null;
      }

      return _mat[3] + _mat[4] + _mat[1] + _mat[2];
    };

    function _phase2 ( p1 ) {
       return _CONSTS.TRANS_TABLE[p1.substring(0,1)];
    };

    function _phase3 ( p1 ) {
        var _n = _to_decimal(p1.substring( 2-1, 2+6-1 ));
        return ("00000000" + _n ).slice(-8);
    };

    function _phase4 ( p1 ) {
        var _n = _to_decimal(p1.substring( 8-1, 8+5-1 ));
        return ("0000000" + _n ).slice(-7);
    };

    function _phase5 ( p1 ) {
        var _n = _to_decimal(p1.substring( 13-1, 13+4-1 ));
        return ("000000" + _n ).slice(-6);
    };

    function _phase6 ( p1 ) {
        var _n = _to_decimal(p1.substring( 17-1, 17+4-1 ));
        return ("00000" + _n ).slice(-5);
    };

    function _phase7 ( p3, p4, p5, p6 ) {
        return "" + p3 + p4 + p5 + p6;
    };

    function _phase8 ( p7, p2 ) {
        return _rotate_r(p7, p2);
    };

    function _phase9( p8, p2 ) {

        var _mat = p8.match(_CONSTS.DATA_PATTERN);
        if(_mat == null){
          return null;
        }

        var _sum = _sum_columns(p8);
        if (( _sum % p8.length ) != p2 ) {
          return null;
        }

        if( _mat[2] != ( _mat[1] + _mat[3] + _mat[6] + _mat[8] + _mat[10] )) {
          return null;
        }

        if( !_chk_date(_mat[7] )) {
          return null;
        }

        if( _mat[5].match(_CONSTS.TYPE_PATTERN) == null) {
          return null;
        }

        var _count = _mat[9].match(_CONSTS.USERCNT_PATTERN);
        if ( _count == null ) {
            return null;
        }

        return {
              "user_code"    : _mat[2],
              "license_no"   : _mat[4],
              "license_type" : _mat[5],
              "term_date"    : _mat[7],
              "user_count"   : parseInt(_count[1])
        };
    };


    var _licenseManager = new LicenseManager();
    LicenseManager.getInstance = function() {
        return _licenseManager;
    }

    exports.getInstance = LicenseManager.getInstance;
    exports.ERR_NO_KEYS = LicenseManager.CONSTS.ERR_NO_KEYS;
    exports.ERR_WRONG_KEY1 = LicenseManager.CONSTS.ERR_WRONG_KEY1;
    exports.ERR_WRONG_KEY2 = LicenseManager.CONSTS.ERR_WRONG_KEY2;

})();
