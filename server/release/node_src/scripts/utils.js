(function() {
    const _ = require('underscore');
    var crypto = require('crypto');
    var fs = require('fs');

    /**
     * 指定範囲の整数乱数を返す
     *  @param {number} start 最小値
     *  @param {number} end 最大値
     *  @return {number} startからend間での間のランダムな数値
     */
    function getRandomNumber(start, end) {
        return start + Math.floor(Math.random() * (end - start + 1));
    };

    var _6BitNumToChare = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    function convert6BitNumToChara(num) {
        if (num == null || typeof num != 'number') {
            return '';
        }
        if (num < 0 || num > 63) {
            return '';
        }
        return _6BitNumToChare[num];
    };

    var _0_37_NumToChare = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    function convert38NumToChara(num) {
        if (num == null || typeof num != 'number') {
            return '';
        }
        if (num < 0 || num > 37) {
            return '';
        }
        return _0_37_NumToChare[num];
    };

    function getChildObject(obj, key) {
        if(obj == null || typeof obj != 'object') {
            return null;
        }
        if(key == null || typeof key != 'string' || key == '') {
            return null;
        }
        var _ret = obj[key];
        if(_ret == undefined) {
            return null;
        }
        return _ret;
    };

    function getIPAddress(socket) {
        if(socket == null || typeof socket != 'object') {
            return null;
        }
        var _ret = null;
        if(socket.remoteAddress){
            //HTTP通信の場合
            _ret = socket.clientIP;
        }else if(socket.request.connection.remoteAddress){
            //soket.ioプロトコルの場合
            _ret = socket.request.connection.remoteAddress;
        }
        return _ret;
    };

    function getChildXmlElement(parentElem, childNodeName) {
        if(parentElem == null) {
            return null;
        }
        if(parentElem.childNodes == null || typeof parentElem.childNodes != 'function') {
            return null;
        }
        var _childNodes = parentElem.childNodes();
        if(_childNodes.length == null || typeof _childNodes.length != 'number') {
            return null;
        }
        var _childNodeCount = _childNodes.length;
        var _childNode = null;
        var _isFind = false;
        for(var _i = 0; _i < _childNodeCount; _i++) {
            _childNode = _childNodes[_i];
            if(_childNode == null) {
                continue;
            }
            if(_childNode.type == null || typeof _childNode.type != 'function') {
                continue;
            }
            var _type = _childNode.type();
            if(_type == null || typeof _type != 'string' || _type != 'element') {
                continue;
            }
            if(_childNode.name == null || typeof _childNode.name != 'function') {
                continue;
            }
            var _name = _childNode.name();
            if(_name == null || typeof _name != 'string') {
                continue;
            }
            if(_name == childNodeName) {
                _isFind = true;
                break;
            }
        }
        if(_isFind) {
            return _childNode;
        }
        return null;
    };

    function getChildXmlElementArray(parentElem, childNodeName) {
        if(parentElem == null) {
            return null;
        }
        if(parentElem.childNodes == null || typeof parentElem.childNodes != 'function') {
            return null;
        }
        var _childNodes = parentElem.childNodes();
        if(_childNodes.length == null || typeof _childNodes.length != 'number') {
            return null;
        }
        var _childNodeCount = _childNodes.length;
        var _retArray = new Array();
        var _findCount = 0;
        for(var _i = 0; _i < _childNodeCount; _i++) {
            var _childNode = _childNodes[_i];
            if(_childNode == null) {
                continue;
            }
            if(_childNode.type == null || typeof _childNode.type != 'function') {
                continue;
            }
            var _type = _childNode.type();
            if(_type == null || typeof _type != 'string' || _type != 'element') {
                continue;
            }
            // ノード名の指定がある場合はその名前がある物のみとりだす
            if(childNodeName != null) {
                var _name = _childNode.name();
                if(_name == null || typeof _name != 'string') {
                    continue;
                }
                if(_name != childNodeName) {
                    continue;
                }
            }
            _retArray[_findCount] = _childNode;
            _findCount++;
        }
        return _retArray;
    };

    /**
     * 文字列の部分文字列を別の文字列にすべておきかえ
     * @param {String} expression 文字列全体
     * @param {string} org 検索文字列
     * @param {string} dest 置換文字列
     * @returns {String} 置換後の文字列全体
     */
    function replaceAll(expression, org, dest) {
        return expression.split(org).join(dest);
    };

    /*
     * 文字列データからMD5ハッシュを生成する
     * @param {String} src 文字列データ
     * @return {String} MD5ハッシュ文字列
     */
    function md5Hex(src) {
        var md5 = crypto.createHash('md5');
        md5.update(src, 'utf8');
        return md5.digest('hex');
    };

    /*
     * 文字列データからSHA-256ハッシュを生成する
     * @param {String} src 文字列データ
     * @return {String} MD5ハッシュ文字列
     */
    function sha256Hex(src) {
        var _sha256 = crypto.createHash('sha256');
        _sha256.update(src, 'utf8');
        return _sha256.digest('hex');
    }

    /*
     * 文字列をtrimする
     */
    function trim(src) {
        // This expensive 3 Values use depends on 3 Values.
        // return src.replace(/(^\s+)|(\s+$)/g, '');
        return src.replace(/^\s+|(?<!\s)\s+$/g, '');
    }

    /**
     * 指定文字列の値が指定正規表現を満たしているかどうかをチェックする
     * @param {string} str 値をチェックしたい文字列
     * @param {RegExp} regexp 正規表現リテラル
     * @return {Boolean} 指定要素の値が指定正規表現を満たしていればtrue, そうでなければfalse
     */
    function checkRegExp(str, regexp) {
        if (!(str.match(regexp))) {
            return false;
        } else {
            return true;
        }
    };

    /**
     * 指定ファイルに指定データを出力する（出力後改行する）
     **/
    var ENCODING_UTF8 = 'utf8';
    function appendDataFile(filePath, lineData, encoding) {
        var _encoding = ENCODING_UTF8;
        if(encoding != null && typeof encoding == 'string') {
            _encoding = encoding;
        }
        var _lineData = lineData + '\n';
        fs.appendFileSync(filePath, _lineData, _encoding);
    }

    /**
     * 不要な制御文字を除去する
     * @param {String} input 除去対象文字を含むであろう文字列
     * @returns {String} 制御文字を除去した文字列
     */
    function excludeControleCharacters(input) {
        // 引数チェック
        if(input == null || typeof input != 'string' || input == '') {
            return '';
        }
        var _str = input;
        /**
         * 登録時に、半角スペースに置き換えるべき文字
         * \u0009: CHARACTER TABULATION  水平タブ (HT)
         * \u000B: VERTICAL TABULATION   垂直タブ (VT)
         * \u000C: FORM FEED             フォームフィード (FF)
         * \u001C: FILE SEPARATOR        ファイル分離文字 (FS)
         * \u001D: GROUP SEPARATOR       グループ分離文字 (GS)
         * \u001E: RECORD SEPARATOR      レコード分離文字 (RS)
         * \u001F: UNIT SEPARATOR        ユニット分離文字 (US)
         * \u00A0: NO-BREAK SPACE        ノーブレークスペース
         * \u2028: LINE SEPARATOR        行区切り文字 (LS)
         * \u2029: PARAGRAPH SEPARATOR   段落区切り文字 (PS)
         * これらの文字を空白スペースに置換する
         */
        _str = _str.replace(/[\u0009\u000B\u000C\u001C\u001D\u001E\u001F\u00A0\u2028\u2029]+/g, ' ');
        return _str;
    };


    /**
     * 入力値判定の関数群
     *
     * 暫定的に入力値単位などのクラス化などを行うまで、入力値判定を下記にまとめる
     * 複数になった時ポータビリーが必要になるのでvaridieter直下にまとめた
     *
     * 規則：
     *   戻り値は正しければtureを戻すこと。
     *   値の有無は判別しない値の整合性のみチェック記述
     *
     * @param value 検証する値
     * @return boolean 戻り値は正しければtureを戻すこと。
     */
    const varidieter = {
        // duplicate *
        parentRoomId : (value) => {
            if(!_.isString(value) ||
               value.length > 272 ||
               value.match(/[^a-zA-Z0-9_.!#$%&*+-]/)){
                return false;
            }else{
                return true;
            }
        },
        memberEntryType : (value) => {
            if(!_.isString(value) ||
               (value.length != 6 && value.length != 3) ||
               value.match(/[^a-fA-F0-9]/)){
                return false;
            }else{
                return true;
            }
        }
    };

    /*
     * 10進数を16進数に変換する
     *
     * @param number 変換する数値
     * @return string 16進数に変換した値
     */
    function convertDecimalToHexa(number) {
        return number.toString(16).toUpperCase();
    };

    /*
     * 16進数を10進数に変換する
     *
     * @param string 変換する文字
     * @return string 10進数に変換した値
     */
    function convertHexaToDecimal(string) {
        return parseInt(string, 16);
    };

    /*
     * 3文字を6文字に変換する
     *
     * @param string 3文字の文字列
     * @return string 6文字の文字列
     */
    function convertThreeWordToSix (string) {
        var codeArr = string.split('');
        let res = codeArr[0] + codeArr[0] + codeArr[1] + codeArr[1] + codeArr[2] + codeArr[2];
        return res;
    };

    /*
     * 削除者を確認し管理者によって削除したか確認
     *
     * @param string deletedBy 削除者
     * @return boolean 管理者によって削除されていたらtrue、それ以外はfalse
     */
    function CheckDeletedBy(deletedBy) {
        var _ret = false;
        if (deletedBy != null && deletedBy != '') {
            if (deletedBy.startsWith('adminDelete:')) {
                _ret = true;
            }
        }
        return _ret;
    };

    const formatDate = (dateString) => {
        if(!dateString){
            return "";
        }
        let date = new Date(dateString);
        return date.getFullYear()
             + "/" + ("0" + (date.getMonth() + 1)).slice(-2)
             + "/" + ("0" + date.getDate()).slice(-2)
             + " " + ("0" + date.getHours()).slice(-2)
             + ":" + ("0" + date.getMinutes()).slice(-2)
             + ":" + ("0" + date.getSeconds()).slice(-2)
             + "." + ("000" + date.getMilliseconds()).slice(-3);
    };

    exports.getRandomNumber = getRandomNumber;
    exports.convert6BitNumToChara = convert6BitNumToChara;
    exports.convert38NumToChara = convert38NumToChara;
    exports.getChildObject = getChildObject;
    exports.getIPAddress = getIPAddress;
    exports.getChildXmlElement = getChildXmlElement;
    exports.getChildXmlElementArray = getChildXmlElementArray;
    exports.replaceAll = replaceAll;
    exports.md5Hex = md5Hex;
    exports.sha256Hex = sha256Hex;
    exports.trim = trim;
    exports.checkRegExp = checkRegExp;
    exports.ENCODING_UTF8 = ENCODING_UTF8;
    exports.appendDataFile = appendDataFile;
    exports.excludeControleCharacters = excludeControleCharacters;
    exports.varidieter = varidieter;
    exports.convertHexaToDecimal = convertHexaToDecimal;
    exports.convertDecimalToHexa = convertDecimalToHexa;
    exports.convertThreeWordToSix = convertThreeWordToSix;
    exports.CheckDeletedBy = CheckDeletedBy;
    exports.formatDate = formatDate;
})();
